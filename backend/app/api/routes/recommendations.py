"""/api/v1/recommendations"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.recommendation import RecommendationListResponse, RecommendationItem
from app.services import recommendation_service
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get(
    "",
    response_model=RecommendationListResponse,
    summary="List current non-medical recommendations",
)
def list_recommendations(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    rows = recommendation_service.list_recommendations(db, user_id)
    return RecommendationListResponse(
        items=[
            RecommendationItem(
                id=r.slug, title=r.title, body=r.body, priority=r.priority, addedToRoutine=r.added_to_routine
            )
            for r in rows
        ]
    )


@router.patch(
    "/{recommendation_id}/add-to-routine",
    response_model=RecommendationItem,
    summary="Mark a recommendation as added to the routine",
)
def add_to_routine(
    recommendation_id: str,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    row = recommendation_service.mark_added_to_routine(db, user_id, recommendation_id)
    if not row:
        raise MiraAPIError("NOT_FOUND", "Recommendation not found.", status_code=404)
    return RecommendationItem(
        id=row.slug, title=row.title, body=row.body, priority=row.priority, addedToRoutine=row.added_to_routine
    )
