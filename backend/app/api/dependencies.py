"""Shared FastAPI dependencies."""
import hashlib
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.utils.errors import MiraAPIError


def get_current_user_id(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> UUID:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = db.query(User).filter(User.session_token_hash == token_hash).first()
        if user:
            return user.id

    # Never fall back to the first database user.  Besides making account
    # boundaries ambiguous, that could expose one person's data to another.
    raise MiraAPIError("AUTH_REQUIRED", "Please log in to access your MIRA data.", 401)
