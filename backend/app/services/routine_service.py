"""
Routine management: fetch today's routine + steps, mark a step complete,
reset the routine, and record a daily RoutineProgress snapshot used by
wellness insights.
"""
from datetime import datetime, timezone, date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.routine import SkincareRoutine, RoutineStep, RoutineProgress


def get_or_create_default_routine(db: Session, user_id: UUID) -> SkincareRoutine:
    routine = (
        db.execute(select(SkincareRoutine).where(SkincareRoutine.user_id == user_id).limit(1))
        .scalars()
        .first()
    )
    if routine:
        return routine

    routine = SkincareRoutine(user_id=user_id, name="Daily Routine")
    db.add(routine)
    db.flush()

    default_steps = [
        (1, "Cleanse", "Gentle cleanser, lukewarm water, 60 seconds.", "1 min"),
        (2, "Hydrate", "Apply hydrating toner or essence to damp skin.", "1 min"),
        (3, "Moisturize", "Lock in moisture with a lightweight daily moisturizer.", "2 min"),
        (4, "Sun Protection", "Broad-spectrum SPF, reapply if heading outdoors.", "1 min"),
    ]
    for order_index, title, description, duration in default_steps:
        db.add(RoutineStep(
            routine_id=routine.id,
            order_index=order_index,
            title=title,
            description=description,
            duration=duration,
            complete=False,
        ))
    db.commit()
    db.refresh(routine)
    return routine


def _steps_for(db: Session, routine_id: UUID) -> list[RoutineStep]:
    return (
        db.execute(
            select(RoutineStep).where(RoutineStep.routine_id == routine_id).order_by(RoutineStep.order_index)
        )
        .scalars()
        .all()
    )


def get_routine_progress(db: Session, user_id: UUID):
    routine = get_or_create_default_routine(db, user_id)
    steps = _steps_for(db, routine.id)
    completed = sum(1 for s in steps if s.complete)
    percent = round((completed / len(steps)) * 100) if steps else 0
    return routine, steps, percent


def complete_step(db: Session, user_id: UUID, order_index: int, complete: bool = True):
    """
    `order_index` matches the frontend's stable step id (1..N), not the
    internal step UUID, so RoutineTracker.jsx can call this endpoint using
    the same ids it already renders.
    """
    routine = get_or_create_default_routine(db, user_id)
    step = (
        db.execute(
            select(RoutineStep).where(
                RoutineStep.routine_id == routine.id, RoutineStep.order_index == order_index
            )
        )
        .scalars()
        .first()
    )
    if not step:
        return None
    step.complete = complete
    step.completed_at = datetime.now(timezone.utc) if complete else None
    db.commit()

    steps = _steps_for(db, step.routine_id)
    completed = sum(1 for s in steps if s.complete)
    total = len(steps)
    percent = round((completed / total) * 100) if total else 0

    _record_daily_progress(db, user_id, step.routine_id, completed, total, percent)
    return steps, completed, total, percent


def reset_routine(db: Session, user_id: UUID):
    routine = get_or_create_default_routine(db, user_id)
    steps = _steps_for(db, routine.id)
    for step in steps:
        step.complete = False
        step.completed_at = None
    db.commit()
    _record_daily_progress(db, user_id, routine.id, 0, len(steps), 0)
    return steps


def _record_daily_progress(db: Session, user_id: UUID, routine_id: UUID, completed: int, total: int, percent: int):
    today = date.today()
    existing = (
        db.execute(
            select(RoutineProgress).where(
                RoutineProgress.user_id == user_id,
                RoutineProgress.routine_id == routine_id,
                RoutineProgress.progress_date == today,
            )
        )
        .scalars()
        .first()
    )
    if existing:
        existing.completed_steps = completed
        existing.total_steps = total
        existing.percent_complete = percent
    else:
        db.add(RoutineProgress(
            user_id=user_id,
            routine_id=routine_id,
            progress_date=today,
            completed_steps=completed,
            total_steps=total,
            percent_complete=percent,
        ))
    db.commit()
