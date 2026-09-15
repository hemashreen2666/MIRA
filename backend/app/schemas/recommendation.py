"""Response shapes for /api/v1/recommendations."""
from typing import List, Literal

from pydantic import BaseModel

Priority = Literal["Low", "Medium", "High"]


class RecommendationItem(BaseModel):
    """Matches frontend mockData.recommendations[i] shape exactly."""
    id: str
    title: str
    body: str
    priority: Priority
    addedToRoutine: bool


class RecommendationListResponse(BaseModel):
    items: List[RecommendationItem]
