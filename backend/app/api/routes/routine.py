"""/api/v1/routine/*"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.schemas.routine import RoutineProgressResponse, RoutineStepOut, RoutineCompleteStepResponse
from app.services import routine_service
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/routine", tags=["Skincare Routine"])


def _to_out(steps) -> list[RoutineStepOut]:
    return [
        RoutineStepOut(id=i + 1, title=s.title, description=s.description, duration=s.duration, complete=s.complete)
        for i, s in enumerate(steps)
    ]


@router.get("", response_model=RoutineProgressResponse, summary="Get today's routine + progress")
def get_routine(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    _, steps, percent = routine_service.get_routine_progress(db, user_id)
    return RoutineProgressResponse(steps=_to_out(steps), percentComplete=percent)


@router.get("/progress", response_model=RoutineProgressResponse, summary="Get routine completion progress")
def get_progress(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    _, steps, percent = routine_service.get_routine_progress(db, user_id)
    return RoutineProgressResponse(steps=_to_out(steps), percentComplete=percent)


@router.patch(
    "/steps/{step_id}/complete",
    response_model=RoutineCompleteStepResponse,
    summary="Mark a routine step complete (or incomplete)",
    description="step_id here is the same 1..N id the frontend already renders for each step.",
)
def complete_step(step_id: int, complete: bool = True, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    result = routine_service.complete_step(db, user_id, step_id, complete)
    if not result:
        raise MiraAPIError("NOT_FOUND", "Routine step not found.", status_code=404)
    steps, completed, total, percent = result
    return RoutineCompleteStepResponse(
        percentComplete=percent, completedSteps=completed, totalSteps=total, steps=_to_out(steps)
    )


@router.post("/reset", response_model=RoutineProgressResponse, summary="Reset today's routine")
def reset_routine(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    steps = routine_service.reset_routine(db, user_id)
    return RoutineProgressResponse(steps=_to_out(steps), percentComplete=0)
