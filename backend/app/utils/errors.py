"""
Centralized API error handling.

All handled errors are returned as:
{ "success": false, "error": { "code": "...", "message": "..." } }

Internal stack traces are never exposed to the client.
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class MiraAPIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code


async def mira_api_error_handler(request: Request, exc: MiraAPIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."},
        },
    )
