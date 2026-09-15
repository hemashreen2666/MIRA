"""/api/v1/wellness/*"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.wellness import WellnessInsightsResponse
from app.services import wellness_service

router = APIRouter(prefix="/wellness", tags=["Wellness"])


@router.get(
    "/insights",
    response_model=WellnessInsightsResponse,
    summary="Get wellness trend + routine completion insights",
    description="Historical, non-medical routine-consistency and visible-feature trend data for charts.",
)
def wellness_insights(
    days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)
):
    trend, completion = wellness_service.get_wellness_insights(db, user_id, days)
    return WellnessInsightsResponse(trend=trend, completion=completion)
