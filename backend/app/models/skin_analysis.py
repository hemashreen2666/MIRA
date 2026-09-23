"""
Stores VISIBLE FEATURE ANALYSIS results only (never raw images).

Field names mirror the frontend's mockData.skinMetrics ids:
acne, redness, darkCircles, unevenTone, brightness, oily.
"""
import uuid
from datetime import datetime

from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SkinAnalysis(Base):
    __tablename__ = "skin_analysis"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # 0-100 visible-feature scores (higher = more visually present)
    acne_level: Mapped[int] = mapped_column(Integer)
    redness_level: Mapped[int] = mapped_column(Integer)
    dark_circles_level: Mapped[int] = mapped_column(Integer)
    uneven_skin_tone_level: Mapped[int] = mapped_column(Integer)
    facial_brightness_level: Mapped[int] = mapped_column(Integer)
    fatigue_level: Mapped[int] = mapped_column(Integer, default=0)
    oily_appearance_level: Mapped[int] = mapped_column(Integer)
    recommendation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    analysis_version: Mapped[str] = mapped_column(String(20), default="demo-0.1")
    processing_time_ms: Mapped[float] = mapped_column(Float, default=0.0)

    # UTC instant assigned by the application at save time.  SQLite does not
    # preserve tzinfo itself, so API serialization normalizes this as UTC.
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    # Legacy field retained for existing installations and older migrations.
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    recorded_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    recorded_time: Mapped[str | None] = mapped_column(String(8), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="skin_analyses")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="analysis")
