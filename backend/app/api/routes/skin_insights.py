"""Authenticated, local personalized skincare insights."""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.skin_insight import PersonalizedInsightResponse
from app.services import skin_insight_service

router = APIRouter(prefix="/skin-insights", tags=["Personalized Skin Insights"])


@router.get("/me", response_model=PersonalizedInsightResponse)
def my_skin_insights(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    return skin_insight_service.get_personalized_insight(db, user_id)
