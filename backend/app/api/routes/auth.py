import hashlib
import secrets
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
class LoginRequest(BaseModel):
    username: str
    password: str
class AuthResponse(BaseModel):
    token: str
    username: str

def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 390000).hex()
    return f"{salt}${digest}"
def matches(password: str, saved: str) -> bool:
    salt, _ = saved.split("$", 1)
    return secrets.compare_digest(password_hash(password, salt), saved)
def session(user: User) -> AuthResponse:
    token = secrets.token_urlsafe(32)
    user.session_token_hash = hashlib.sha256(token.encode()).hexdigest()
    return AuthResponse(token=token, username=user.username or "demo-user")

@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == body.username) | (User.email == body.email)).first():
        raise MiraAPIError("ACCOUNT_EXISTS", "That username or email is already registered.", 409)
    user = User(display_name=body.name, username=body.username, email=str(body.email), password_hash=password_hash(body.password))
    db.add(user); response = session(user); db.commit()
    return response

@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not user.password_hash or not matches(body.password, user.password_hash):
        raise MiraAPIError("INVALID_CREDENTIALS", "Incorrect username or password.", 401)
    response = session(user); db.commit()
    return response
