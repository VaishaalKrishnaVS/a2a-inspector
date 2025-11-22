"""Application configuration and constants."""

import os
from functools import lru_cache

AGENT_CARD_ENDPOINT = "/.well-known/agent-card.json"

# HTTP Client timeouts (in seconds)
HTTP_TIMEOUT_AGENT_CARD = float(os.getenv("HTTP_TIMEOUT_AGENT_CARD", "10.0"))
HTTP_TIMEOUT_MESSAGE = float(os.getenv("HTTP_TIMEOUT_MESSAGE", "30.0"))

# CORS settings
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


@lru_cache(maxsize=1)
def get_app_config():
    """Get application configuration (cached)."""
    return {
        "title": "A2A Inspector API",
        "description": "API for inspecting and interacting with A2A agents",
        "version": "1.0.0",
    }
