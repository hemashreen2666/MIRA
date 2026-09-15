"""Response shapes for /api/v1/expression/*."""
from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel

Expression = Literal["Happy", "Neutral", "Sad", "Tired"]


class ExpressionResponse(BaseModel):
    """Matches frontend getFacialExpression() shape: current/states/confidence."""
    current: Expression
    states: List[Expression]
    confidence: float
    timestamp: datetime
