"""
/api/v1/skin-analysis/*

POST /analyze accepts an OPTIONAL image upload, runs the CV pipeline fully
in-memory, persists only derived scores, then discards the image.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.skin_analysis import (
    SkinAnalysisResponse,
    SkinAnalysisHistoryResponse,
    SkinAnalysisHistoryItem,
)
from app.services import skin_analysis_service, recommendation_service
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/skin-analysis", tags=["Skin Analysis"])

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB request size limit


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
    image_bytes = None
    if frame is not None:
        image_bytes = await frame.read()
        if len(image_bytes) > MAX_UPLOAD_BYTES:
            raise MiraAPIError("PAYLOAD_TOO_LARGE", "Uploaded frame exceeds the size limit.", status_code=413)

    try:
        row, metrics = skin_analysis_service.run_skin_analysis(db, user_id, image_bytes)
    except ValueError as exc:
        raise MiraAPIError("ANALYSIS_FAILED", str(exc), status_code=422)
    except Exception:
        raise MiraAPIError("ANALYSIS_FAILED", "Unable to process the camera frame.", status_code=500)

    recommendation_service.generate_recommendations_for_analysis(db, user_id, row)

    return SkinAnalysisResponse(analysis_id=row.id, timestamp=row.timestamp, metrics=metrics)


@router.get(
    "/latest",
    response_model=SkinAnalysisResponse,
    summary="Get the most recent skin analysis",
)
def latest_skin_analysis(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    row, metrics = skin_analysis_service.get_latest_skin_analysis(db, user_id)
    if not row:
        row, metrics = skin_analysis_service.run_skin_analysis(db, user_id, None)
    return SkinAnalysisResponse(analysis_id=row.id, timestamp=row.timestamp, metrics=metrics)


@router.get(
    "/history",
    response_model=SkinAnalysisHistoryResponse,
    summary="Paginated skin analysis history",
)
def skin_analysis_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    items, total = skin_analysis_service.get_skin_analysis_history(db, user_id, page, page_size)
    return SkinAnalysisHistoryResponse(
        items=[SkinAnalysisHistoryItem(analysis_id=r.id, timestamp=r.timestamp, metrics=m) for r, m in items],
        total=total,
        page=page,
        page_size=page_size,
    )
