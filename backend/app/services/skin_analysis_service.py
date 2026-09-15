"""
Skin analysis business logic: run the CV pipeline (or mock), persist only
the derived numeric results, and shape the response for the frontend.

PRIVACY: the raw frame/image bytes passed in are processed only in-memory
inside this request and are never written to disk or the database.
"""
import time
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.skin_analysis import SkinAnalysis
from app.ml.inference import get_skin_analyzer
from app.ml.preprocessing import decode_image_bytes, crop_face_region
from app.cv.face_detector import FaceDetector
from app.schemas.skin_analysis import SkinMetric, score_to_level
from app.core.logging import get_logger

logger = get_logger(__name__)

METRIC_LABELS = {
    "acne": "Acne-like Spots",
    "redness": "Redness",
    "darkCircles": "Dark Circles",
    "unevenTone": "Uneven Skin Tone",
    "brightness": "Facial Brightness",
    "oily": "Oily Appearance",
}


def _metrics_from_row(row: SkinAnalysis, previous: Optional[SkinAnalysis]) -> list[SkinMetric]:
    values = {
        "acne": row.acne_level,
        "redness": row.redness_level,
        "darkCircles": row.dark_circles_level,
        "unevenTone": row.uneven_skin_tone_level,
        "brightness": row.facial_brightness_level,
        "oily": row.oily_appearance_level,
    }
    prev_values = {
        "acne": previous.acne_level if previous else values["acne"],
        "redness": previous.redness_level if previous else values["redness"],
        "darkCircles": previous.dark_circles_level if previous else values["darkCircles"],
        "unevenTone": previous.uneven_skin_tone_level if previous else values["unevenTone"],
        "brightness": previous.facial_brightness_level if previous else values["brightness"],
        "oily": previous.oily_appearance_level if previous else values["oily"],
    }
    metrics = []
    for key, score in values.items():
        metrics.append(
            SkinMetric(
                id=key,
                label=METRIC_LABELS[key],
                value=score_to_level(score),
                level=score,
                trend=score - prev_values[key],
                note="Visible Feature" if score < 34 else "Detected",
            )
        )
    return metrics


def run_skin_analysis(db: Session, user_id: UUID, image_bytes: Optional[bytes]) -> tuple[SkinAnalysis, list[SkinMetric]]:
    """
    Runs the CV pipeline against an optional uploaded frame (never stored),
    persists only the resulting scores, and returns the row + shaped
    metrics for the API response.
    """
    start = time.perf_counter()

    if image_bytes:
        frame = decode_image_bytes(image_bytes)
        detector = FaceDetector()
        face = detector.detect(frame)
        region = crop_face_region(frame, face.x, face.y, face.w, face.h) if face else frame
        analyzer = get_skin_analyzer(prefer_camera_pipeline=True)
        scores = analyzer.analyze(region)
        # `frame`/`region` go out of scope here and are garbage collected —
        # never written to disk.
    else:
        analyzer = get_skin_analyzer(prefer_camera_pipeline=False)
        scores = analyzer.analyze(None)

    elapsed_ms = (time.perf_counter() - start) * 1000

    row = SkinAnalysis(
        user_id=user_id,
        acne_level=scores.acne,
        redness_level=scores.redness,
        dark_circles_level=scores.dark_circles,
        uneven_skin_tone_level=scores.uneven_skin_tone,
        facial_brightness_level=scores.facial_brightness,
        oily_appearance_level=scores.oily_appearance,
        analysis_version="demo-0.1",
        processing_time_ms=elapsed_ms,
        recorded_date=datetime.now().strftime("%d/%m/%Y"),
        recorded_time=datetime.now().strftime("%I:%M %p"),
    )
    db.add(row)
    db.flush()

    previous = (
        db.execute(
            select(SkinAnalysis)
            .where(SkinAnalysis.user_id == user_id, SkinAnalysis.id != row.id)
            .order_by(SkinAnalysis.timestamp.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )

    metrics = _metrics_from_row(row, previous)
    db.commit()
    db.refresh(row)

    logger.info("skin_analysis completed user_id=%s analysis_id=%s ms=%.1f", user_id, row.id, elapsed_ms)
    return row, metrics


def get_latest_skin_analysis(db: Session, user_id: UUID):
    row = (
        db.execute(
            select(SkinAnalysis)
            .where(SkinAnalysis.user_id == user_id)
            .order_by(SkinAnalysis.timestamp.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not row:
        return None, []
    previous = (
        db.execute(
            select(SkinAnalysis)
            .where(SkinAnalysis.user_id == user_id, SkinAnalysis.id != row.id)
            .order_by(SkinAnalysis.timestamp.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    return row, _metrics_from_row(row, previous)


def get_skin_analysis_history(db: Session, user_id: UUID, page: int, page_size: int):
    total = db.execute(
        select(SkinAnalysis).where(SkinAnalysis.user_id == user_id)
    ).scalars().all()
    total_count = len(total)

    rows = (
        db.execute(
            select(SkinAnalysis)
            .where(SkinAnalysis.user_id == user_id)
            .order_by(SkinAnalysis.timestamp.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    items = []
    for i, row in enumerate(rows):
        previous = rows[i + 1] if i + 1 < len(rows) else None
        items.append((row, _metrics_from_row(row, previous)))
    return items, total_count
