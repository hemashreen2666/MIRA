"""
Historical non-medical wellness metrics (routine consistency, visible-feature
trends) used to power the Insights page charts.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WellnessInsight(Base):
    __tablename__ = "wellness_insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    insight_date: Mapped[date] = mapped_column(Date, index=True)
    consistency: Mapped[int] = mapped_column(Integer)   # 0-100, routine completion based
    brightness: Mapped[int] = mapped_column(Integer)    # 0-100, from skin_analysis trend

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
