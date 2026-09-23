import hashlib
import secrets
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user_id
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int | None = Field(default=None, ge=0, le=130)
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: UUID
    name: str | None
    age: int | None
    username: str
    created_at: datetime


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    age: int | None = Field(default=None, ge=0, le=130)


class UserResponse(BaseModel):
    user_id: UUID
    name: str | None
    age: int | None
    username: str | None
    created_at: datetime


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 390000).hex()
    return f"{salt}${digest}"


def matches(password: str, saved: str) -> bool:
    salt, _ = saved.split("$", 1)
    return secrets.compare_digest(password_hash(password, salt), saved)


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.id,
        name=user.display_name,
        age=user.age,
        username=user.username,
        created_at=user.created_at,
    )


def start_session(user: User) -> str:
    token = secrets.token_urlsafe(32)
    user.session_token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token


def to_auth_response(user: User, token: str) -> AuthResponse:
    return AuthResponse(
        token=token,
        user_id=user.id,
        name=user.display_name,
        age=user.age,
        username=user.username or "demo-user",
        created_at=user.created_at,
    )


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == body.username) | (User.email == body.email)).first():
        raise MiraAPIError("ACCOUNT_EXISTS", "That username or email is already registered.", 409)
    user = User(
        display_name=body.name,
        age=body.age,
        username=body.username,
        email=str(body.email),
        password_hash=password_hash(body.password),
    )
    db.add(user)
    token = start_session(user)
    db.commit()
    db.refresh(user)
    return to_auth_response(user, token)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not user.password_hash or not matches(body.password, user.password_hash):
        raise MiraAPIError("INVALID_CREDENTIALS", "Incorrect username or password.", 401)
    token = start_session(user)
    db.commit()
    db.refresh(user)
    return to_auth_response(user, token)


@router.post("/users", response_model=UserResponse, summary="Create a local MIRA user profile")
def create_user(body: UserCreateRequest, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    user = User(display_name=body.name, age=body.age)
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_user_response(user)


@router.get("/users", response_model=list[UserResponse], summary="List the current local MIRA user profile")
def list_users(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    users = db.query(User).filter(User.id == user_id).all()
    return [to_user_response(user) for user in users]


@router.get("/users/{user_id}", response_model=UserResponse, summary="Get a local MIRA user profile")
def get_user(user_id: UUID, db: Session = Depends(get_db), current_user_id: UUID = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise MiraAPIError("FORBIDDEN", "You can only access your own MIRA profile.", 403)
    user = db.get(User, user_id)
    if not user:
        raise MiraAPIError("NOT_FOUND", "User profile not found.", 404)
    return to_user_response(user)
