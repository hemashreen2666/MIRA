"""
Pytest fixtures: spins up an isolated SQLite database (swap-compatible with
the SQLAlchemy models) so tests never require a live PostgreSQL instance or
a real webcam. All CV inference used in tests goes through the mock path.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    # StaticPool keeps a single shared connection so the in-memory schema is
    # visible from the threadpool where FastAPI runs sync endpoints.
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        response = c.post("/api/v1/auth/register", json={
            "name": "Test User", "username": "testuser", "email": "test@example.test", "password": "test-password",
        })
        c.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        yield c
    app.dependency_overrides.clear()
