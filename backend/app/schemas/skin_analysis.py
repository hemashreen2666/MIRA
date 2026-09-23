"""
Response shapes for /api/v1/skin-analysis/*.

The `list` shape under `metrics` mirrors the frontend's mockData.skinMetrics
exactly (id/label/value/level/trend/note) so SkinAnalysis.jsx needs no
changes. `features` mirrors the nested example from the spec for consumers
that prefer a keyed object.
"""
from datetime import datetime
from typing import List, Literal
from uuid import UUID

from pydantic import BaseModel, Field

Level = Literal["Low", "Moderate", "High"]


def score_to_level(score: int) -> Level:
    if score < 34:
        return "Low"
    if score < 67:
        return "Moderate"
    return "High"


class SkinMetric(BaseModel):
    """Matches frontend mockData.skinMetrics[i] shape exactly."""
    id: str
    label: str
    value: Level
    level: int = Field(ge=0, le=100)
    trend: int
    note: str


class SkinAnalysisResponse(BaseModel):
    analysis_id: UUID
    analyzed_at: datetime
    metrics: List[SkinMetric]
    recommendation: str | None = None


class DemoSkinAnalysisResponse(SkinAnalysisResponse):
    """A temporary, anonymous current scan. It is never persisted."""
    demo_scan_id: UUID


class SkinAnalysisHistoryItem(BaseModel):
    analysis_id: UUID
    analyzed_at: datetime
    metrics: List[SkinMetric]
    recommendation: str | None = None


class SkinAnalysisHistoryResponse(BaseModel):
    items: List[SkinAnalysisHistoryItem]
    total: int
    page: int
    page_size: int
