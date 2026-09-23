"""
Skincare routine + its steps + per-day completion progress.

RoutineStep.complete tracks the CURRENT (today's) completion state, which is
what the frontend's mockData.routineSteps represents. RoutineProgress keeps
a historical log per day for wellness insights / trends.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Integer, String, Text, Date, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(80), default="Daily Routine")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="routines")


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("skincare_routines.id"), index=True)

    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    duration: Mapped[str] = mapped_column(String(20))  # display string e.g. "1 min"

    complete: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RoutineProgress(Base):
    """One row per user per day: snapshot of how much of the routine was completed."""
    __tablename__ = "routine_progress"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    routine_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("skincare_routines.id"))

    progress_date: Mapped[date] = mapped_column(Date, index=True)
    completed_steps: Mapped[int] = mapped_column(Integer, default=0)
    total_steps: Mapped[int] = mapped_column(Integer, default=0)
    percent_complete: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RoutineTaskProgress(Base):
    __tablename__ = "routine_task_progress"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    routine_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("skincare_routines.id"), index=True)

    progress_date: Mapped[date] = mapped_column(Date, index=True)
    task_name: Mapped[str] = mapped_column(String(80))
    complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
