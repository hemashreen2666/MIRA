"""/api/v1/expression/*"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.expression import ExpressionResponse
from app.services import expression_service

router = APIRouter(prefix="/expression", tags=["Facial Expression"])


@router.get(
    "/latest",
    response_model=ExpressionResponse,
    summary="Get the latest estimated facial expression",
    description="Estimates one of Happy/Neutral/Sad/Tired. Not a clinical assessment.",
)
def latest_expression(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    row = expression_service.get_latest_expression(db, user_id)
    if not row:
        row = expression_service.estimate_expression(db, user_id)
    return ExpressionResponse(
        current=row.expression,
        states=expression_service.EXPRESSIONS,
        confidence=row.confidence,
        timestamp=row.timestamp,
    )


@router.post(
    "/estimate",
    response_model=ExpressionResponse,
    summary="Run a new facial expression estimation",
)
def run_expression_estimate(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    row = expression_service.estimate_expression(db, user_id)
    return ExpressionResponse(
        current=row.expression,
        states=expression_service.EXPRESSIONS,
        confidence=row.confidence,
        timestamp=row.timestamp,
    )
