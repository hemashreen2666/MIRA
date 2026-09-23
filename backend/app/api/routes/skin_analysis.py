"""
/api/v1/skin-analysis/*

POST /analyze accepts an OPTIONAL image upload, runs the CV pipeline fully
in-memory, persists only derived scores, then discards the image.
"""
from typing import Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.skin_analysis import (
    SkinAnalysisResponse,
    SkinAnalysisHistoryResponse,
    SkinAnalysisHistoryItem,
    DemoSkinAnalysisResponse,
)
from app.services import skin_analysis_service, recommendation_service
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/skin-analysis", tags=["Skin Analysis"])

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB request size limit
DEMO_SCAN_TTL = timedelta(minutes=30)
# Deliberately process-local: demo scans are anonymous, expire quickly, and
# are never written to SQLite or associated with any account.
_demo_scans: dict[UUID, tuple[datetime, object]] = {}


def get_demo_scan(scan_id: UUID):
    now = datetime.now(timezone.utc)
    for key, (expires_at, _) in list(_demo_scans.items()):
        if expires_at <= now:
            _demo_scans.pop(key, None)
    entry = _demo_scans.get(scan_id)
    return entry[1] if entry and entry[0] > now else None


async def _read_frame(frame: Optional[UploadFile]) -> Optional[bytes]:
    if frame is None:
        return None
    image_bytes = await frame.read()
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise MiraAPIError("PAYLOAD_TOO_LARGE", "Uploaded frame exceeds the size limit.", status_code=413)
    return image_bytes


@router.post("/demo/analyze", response_model=DemoSkinAnalysisResponse, summary="Run an anonymous current-only demo scan")
async def analyze_demo_skin(frame: Optional[UploadFile] = File(default=None)):
    image_bytes = await _read_frame(frame)
    try:
        scan_id, analyzed_at, scores, metrics, _ = skin_analysis_service.run_demo_skin_analysis(image_bytes)
    except ValueError as exc:
        raise MiraAPIError("ANALYSIS_FAILED", str(exc), status_code=422)
    except Exception:
        raise MiraAPIError("ANALYSIS_FAILED", "Unable to process the camera frame.", status_code=500)
    _demo_scans[scan_id] = (datetime.now(timezone.utc) + DEMO_SCAN_TTL, scores)
    return DemoSkinAnalysisResponse(
        analysis_id=scan_id, demo_scan_id=scan_id, analyzed_at=analyzed_at, metrics=metrics,
        recommendation="Based on your current scan, these cosmetic products may be relevant.",
    )


@router.post(
    "/analyze",
    response_model=SkinAnalysisResponse,
    summary="Run visible-feature skin analysis",
    description=(
        "Runs the CV pipeline on an optional single frame. The image is "
        "processed fully in memory and is never written to disk or the "
        "database -- only the resulting numeric scores are persisted. "
        "This performs visible-feature estimation, not medical diagnosis."
    ),
)
async def analyze_skin(
    frame: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    image_bytes = await _read_frame(frame)

    try:
        row, metrics = skin_analysis_service.run_skin_analysis(db, user_id, image_bytes)
    except ValueError as exc:
        raise MiraAPIError("ANALYSIS_FAILED", str(exc), status_code=422)
    except Exception:
        raise MiraAPIError("ANALYSIS_FAILED", "Unable to process the camera frame.", status_code=500)

    recommendation_service.generate_recommendations_for_analysis(db, user_id, row)

    return SkinAnalysisResponse(
        analysis_id=row.id,
        analyzed_at=skin_analysis_service.as_utc(row.analyzed_at),
        metrics=metrics,
        recommendation=row.recommendation_summary,
    )


@router.get(
    "/latest",
    response_model=SkinAnalysisResponse,
    summary="Get the most recent skin analysis",
)
def latest_skin_analysis(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    row, metrics = skin_analysis_service.get_latest_skin_analysis(db, user_id)
    if not row:
        raise MiraAPIError("NOT_FOUND", "No saved skin analysis is available yet.", 404)
    elif not row.recommendation_summary:
        recommendation_service.generate_recommendations_for_analysis(db, user_id, row)
    return SkinAnalysisResponse(
        analysis_id=row.id,
        analyzed_at=skin_analysis_service.as_utc(row.analyzed_at),
        metrics=metrics,
        recommendation=row.recommendation_summary,
    )


@router.get(
    "/history/me",
    response_model=SkinAnalysisHistoryResponse,
    summary="Current authenticated user's paginated skin analysis history",
)
def skin_analysis_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    items, total = skin_analysis_service.get_skin_analysis_history(db, user_id, page, page_size)
    return SkinAnalysisHistoryResponse(
        items=[
            SkinAnalysisHistoryItem(
                analysis_id=r.id,
                analyzed_at=skin_analysis_service.as_utc(r.analyzed_at),
                metrics=m,
                recommendation=r.recommendation_summary,
            )
            for r, m in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
