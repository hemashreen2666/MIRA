"""
Non-medical recommendations generated from a skin_analysis record.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, String, Text, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("skin_analysis.id"), nullable=True, index=True
    )

    slug: Mapped[str] = mapped_column(String(40))  # stable id, e.g. "hydration"
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(10))  # Low | Medium | High
    added_to_routine: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    analysis: Mapped["SkinAnalysis | None"] = relationship(back_populates="recommendations")
