"""Response/request shapes for /api/v1/routine/*."""
from typing import List
from uuid import UUID

from pydantic import BaseModel


class RoutineStepOut(BaseModel):
    """Matches frontend mockData.routineSteps[i] shape (id kept as int-like index for UI)."""
    id: int
    title: str
    description: str
    duration: str
    complete: bool


class RoutineProgressResponse(BaseModel):
    """Matches frontend getRoutineProgress() shape: steps + percentComplete."""
    steps: List[RoutineStepOut]
    percentComplete: int


class RoutineCompleteStepResponse(BaseModel):
    percentComplete: int
    completedSteps: int
    totalSteps: int
    steps: List[RoutineStepOut]
