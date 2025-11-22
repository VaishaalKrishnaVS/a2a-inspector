"""Request and response models."""

from typing import Any

from pydantic import BaseModel


class MessageRequest(BaseModel):
    """Request model for sending messages to agents."""

    prompt: str
    metadata: dict[str, Any] = {}


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str


class ErrorResponse(BaseModel):
    """Error response model."""

    detail: str
    error_code: str | None = None
