"""Response shapes for /api/v1/wellness/*."""
from typing import List
from pydantic import BaseModel


class TrendPoint(BaseModel):
    """Matches frontend mockData.wellnessTrend[i] shape."""
    day: str
    consistency: int
    brightness: int


class CompletionPoint(BaseModel):
    """Matches frontend mockData.routineCompletion[i] shape."""
    name: str
    value: int


class WellnessInsightsResponse(BaseModel):
    """Matches frontend getWellnessInsights() shape: trend + completion."""
    trend: List[TrendPoint]
    completion: List[CompletionPoint]
