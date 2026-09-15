"""
Shared FastAPI dependencies.

MIRA runs as a single-device, single-user smart mirror by default, so we
resolve (or lazily create) one demo user rather than requiring auth/login
for this academic project. This is intentionally simple and documented --
swap for real auth if MIRA is ever deployed multi-user/multi-tenant.
"""
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User


def get_current_user_id(db: Session = Depends(get_db)) -> UUID:
    user = db.query(User).order_by(User.created_at).first()
    if not user:
        user = User(display_name="MIRA Demo User")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id
