"""
MIRA backend entrypoint.

Existing React Frontend
        -> FastAPI REST API   (this file wires it up)
        -> Business/AI Service Layer   (app/services)
        -> Computer Vision / ML Models (app/cv, app/ml)
        -> PostgreSQL Database          (app/models via SQLAlchemy)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.api.router import v1_router
from app.api.routes import health
from app.utils.errors import MiraAPIError, mira_api_error_handler, unhandled_exception_handler

settings = get_settings()
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("MIRA backend starting up (env=%s)", settings.APP_ENV)
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    description=(
        "Backend for MIRA (Mirror Intelligent Routine Assistant): an "
        "AI-powered smart mirror performing VISIBLE skin-feature analysis, "
        "facial expression estimation, hand tracking, and non-medical "
        "skincare/wellness recommendations. All AI processing runs "
        "in-memory and locally -- no facial images, video, or biometric "
        "embeddings are ever stored. Not a medical diagnostic system."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(MiraAPIError, mira_api_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(health.router)
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)
