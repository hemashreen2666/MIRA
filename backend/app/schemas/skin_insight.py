"""Response shapes for the authenticated personalized skin-insights endpoint."""
from typing import Literal
from pydantic import BaseModel

Trend = Literal["IMPROVING", "STABLE", "INCREASING", "DECREASING", "INSUFFICIENT_DATA"]


class MetricInsight(BaseModel):
    id: str
    label: str
    current: int
    previous: int | None = None
    recent_average: float | None = None
    trend: Trend


class RoutineReminder(BaseModel):
    type: str
    message: str
    routine_step: str


class PersonalizedInsightResponse(BaseModel):
    greeting: str
    welcome: str
    has_analysis: bool
    history_count: int
    progress_message: str | None = None
    metrics: list[MetricInsight]
    reminders: list[RoutineReminder]
