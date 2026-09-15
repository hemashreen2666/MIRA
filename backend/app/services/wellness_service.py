"""
Wellness insights: builds chart-ready trend/completion data from stored
RoutineProgress and SkinAnalysis history. Never fabricates medical data.
"""
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.routine import RoutineProgress, RoutineStep, SkincareRoutine
from app.models.skin_analysis import SkinAnalysis

DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def get_wellness_insights(db: Session, user_id: UUID, days: int = 7):
    since = date.today() - timedelta(days=days - 1)

    progress_rows = (
        db.execute(
            select(RoutineProgress)
            .where(RoutineProgress.user_id == user_id, RoutineProgress.progress_date >= since)
            .order_by(RoutineProgress.progress_date)
        )
        .scalars()
        .all()
    )
    progress_by_date = {row.progress_date: row for row in progress_rows}

    analysis_rows = (
        db.execute(
            select(SkinAnalysis)
            .where(SkinAnalysis.user_id == user_id, SkinAnalysis.timestamp >= since)
            .order_by(SkinAnalysis.timestamp)
        )
        .scalars()
        .all()
    )
    brightness_by_date = {}
    for row in analysis_rows:
        brightness_by_date[row.timestamp.date()] = row.facial_brightness_level

    trend = []
    for i in range(days):
        d = since + timedelta(days=i)
        label = DAY_LABELS[d.weekday()]
        consistency = progress_by_date[d].percent_complete if d in progress_by_date else 0
        brightness = brightness_by_date.get(d, 0)
        trend.append({"day": label, "consistency": consistency, "brightness": brightness})

    completion = _completion_by_step(db, user_id, since)

    return trend, completion


def _completion_by_step(db: Session, user_id: UUID, since: date):
    routine = (
        db.execute(select(SkincareRoutine).where(SkincareRoutine.user_id == user_id).limit(1))
        .scalars()
        .first()
    )
    if not routine:
        return []

    steps = (
        db.execute(
            select(RoutineStep).where(RoutineStep.routine_id == routine.id).order_by(RoutineStep.order_index)
        )
        .scalars()
        .all()
    )
    # Without a full per-step historical log table, report today's binary
    # completion scaled to 0/100 per step as a simple, honest signal.
    return [{"name": step.title, "value": 100 if step.complete else 0} for step in steps]
