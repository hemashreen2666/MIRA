"""
Facial expression estimation results (Happy / Neutral / Sad / Tired).
"""
import uuid
from datetime import datetime

from sqlalchemy import Float, String, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FacialExpressionAnalysis(Base):
    __tablename__ = "facial_expression_analysis"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)

    expression: Mapped[str] = mapped_column(String(20))  # Happy | Neutral | Sad | Tired
    confidence: Mapped[float] = mapped_column(Float)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
