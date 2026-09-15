"""Facial expression estimation service (demo inference)."""
import random
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expression import FacialExpressionAnalysis

EXPRESSIONS = ["Happy", "Neutral", "Sad", "Tired"]


def estimate_expression(db: Session, user_id: UUID) -> FacialExpressionAnalysis:
    """
    DEMO INFERENCE: picks a plausible expression + confidence. Replace with
    a real MediaPipe-landmark-driven or CNN-based classifier later behind
    this same function signature.
    """
    expression = random.choice(EXPRESSIONS)
    confidence = round(random.uniform(0.7, 0.97), 2)

    row = FacialExpressionAnalysis(user_id=user_id, expression=expression, confidence=confidence)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_latest_expression(db: Session, user_id: UUID) -> FacialExpressionAnalysis | None:
    return (
        db.execute(
            select(FacialExpressionAnalysis)
            .where(FacialExpressionAnalysis.user_id == user_id)
            .order_by(FacialExpressionAnalysis.timestamp.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
