"""SQLAlchemy engine/session setup + FastAPI dependency for DB sessions."""
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _):
        """SQLite requires foreign-key enforcement to be enabled per connection."""
        dbapi_connection.execute("PRAGMA foreign_keys=ON")
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_tables() -> None:
    """Create missing SQLite tables automatically on startup."""
    from app import models  # noqa: F401  -- register all ORM models

    Base.metadata.create_all(bind=engine)
    if _is_sqlite:
        _ensure_sqlite_columns()


def _ensure_sqlite_columns() -> None:
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "age" not in user_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))

    if "skin_analysis" in inspector.get_table_names():
        skin_columns = {column["name"] for column in inspector.get_columns("skin_analysis")}
        with engine.begin() as connection:
            if "fatigue_level" not in skin_columns:
                connection.execute(text("ALTER TABLE skin_analysis ADD COLUMN fatigue_level INTEGER NOT NULL DEFAULT 0"))
            if "recommendation_summary" not in skin_columns:
                connection.execute(text("ALTER TABLE skin_analysis ADD COLUMN recommendation_summary TEXT"))
            if "analyzed_at" not in skin_columns:
                connection.execute(text("ALTER TABLE skin_analysis ADD COLUMN analyzed_at DATETIME"))
                # Legacy SQLite CURRENT_TIMESTAMP values are UTC instants.
                connection.execute(text("UPDATE skin_analysis SET analyzed_at = timestamp WHERE analyzed_at IS NULL"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_skin_analysis_analyzed_at ON skin_analysis (analyzed_at)"))
