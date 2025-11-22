"""Main FastAPI application."""

import json
from collections.abc import AsyncGenerator
from typing import Any, List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from a2a.types import Part, SendStreamingMessageResponse

from client.a2a_client import create_agent_card, send_message
from config import CORS_ALLOW_ORIGINS, get_app_config
from models import MessageRequest
from util.logging_config import LoggingConfig

_log = LoggingConfig.get_logger(__name__)

# Application state (in production, use Redis or similar)
_app_state: dict[str, Any] = {"agent_card_url": None, "agent_card": None}

# FastAPI app configuration
app_config = get_app_config()
app = FastAPI(**app_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS if "*" not in CORS_ALLOW_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize_response(response: Any) -> dict[str, Any]:
    """Serialize Pydantic model or dict to JSON-serializable dict."""
    if hasattr(response, "model_dump"):
        return response.model_dump()
    elif hasattr(response, "dict"):
        return response.dict()
    elif isinstance(response, dict):
        return response
    else:
        return {"data": str(response)}


@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "working"}


@app.get("/agent-card", tags=["agent"])
async def get_agent_card(
    url: str = Query(..., description="Base URL of the agent to fetch card from")
):
    """Fetch agent card from the specified URL."""
    _log.info(f"Fetching agent card for URL: {url}")

    try:
        # Use SDK to fetch agent card (includes validation and caching)
        agent_card = await create_agent_card(url, False)

        # Store in app state
        _app_state["agent_card_url"] = url
        _app_state["agent_card"] = agent_card

        # Convert to dict for response
        card_data = _serialize_response(agent_card)
        _log.info(f"Successfully fetched agent card for {url}")
        return card_data

    except httpx.HTTPStatusError as e:
        _log.error(
            f"HTTP error fetching agent card: {e.response.status_code} - {e.response.text}"
        )
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to fetch agent card: HTTP {e.response.status_code}",
        )
    except httpx.RequestError as e:
        _log.error(f"Request error fetching agent card: {e}")
        raise HTTPException(
            status_code=503, detail=f"Failed to connect to agent: {str(e)}"
        )
    except Exception as e:
        _log.error(f"Unexpected error fetching agent card: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch agent card: {str(e)}"
        )


def _is_streaming_response(response: Any) -> bool:
    """Check if response is a streaming response (AsyncGenerator)."""
    # Check for AsyncGenerator protocol
    return hasattr(response, "__aiter__") and not isinstance(
        response, (str, bytes, dict, list)
    )


def _extract_text_from_chunk(chunk: SendStreamingMessageResponse) -> Optional[str]:
    """
    Extract 'text' from streaming chunks shaped like the logs you pasted.
    Returns a string or None if no text is present.
    """
    try:
        # Helpful debug
        try:
            # This is safe; you’re already doing something similar
            _log.info("chunk in extractor: %s", json.dumps(chunk, default=str))
        except Exception:
            pass

        # 1) Get result
        result = chunk.root.result
        if not result:
            return None

        # Some chunks are initial "task" kind with history + no status.message
        kind = result.kind
        if kind != "status-update":
            # Ignore non-stream text events if you only care about streaming deltas
            return None

        # 2) Get status
        status = result.status or {}
        message = status.message
        if not message:
            return None

        # 3) Get parts (list of dicts)
        parts: list[Part] = message.parts
        text: str = ""
        for p in parts:
            if p.root.kind == "text":
                text += p.root.text

        return text or None

    except Exception as e:
        _log.exception("Failed to extract text from chunk: %s", e)
        return None


async def _generate_sse_stream(
    response: AsyncGenerator[SendStreamingMessageResponse, None],
) -> AsyncGenerator[str, None]:
    """Generate Server-Sent Events stream from async generator."""
    try:
        async for chunk in response:
            data = _extract_text_from_chunk(chunk)
            if data != None:
                yield f"data: {data}\n\n"
    except Exception as e:
        _log.error(f"Error in streaming response: {e}", exc_info=True)
        error_data = {"error": str(e), "type": type(e).__name__}
        yield f"data: {json.dumps(error_data)}\n\n"


@app.post("/chat", tags=["chat"])
async def chat(request: MessageRequest):
    """Send a message to the agent and return the response."""
    agent_card_url = _app_state.get("agent_card_url")
    agent_card = _app_state.get("agent_card")

    if agent_card_url is None:
        raise HTTPException(
            status_code=400,
            detail="No agent card URL set. Please fetch an agent card first.",
        )

    _log.info(
        f"Processing message - prompt: {request.prompt[:50]}..., "
        f"metadata keys: {list(request.metadata.keys())}"
    )

    try:
        # Send message to agent (reuse cached agent card if available)
        response = await send_message(
            agent_url=agent_card_url,
            prompt=request.prompt,
            metadata=request.metadata,
            agent_card=agent_card,
        )

        # Handle streaming vs non-streaming responses
        if _is_streaming_response(response):
            _log.info("Returning streaming response")
            return StreamingResponse(
                _generate_sse_stream(response),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",  # Disable buffering for nginx
                },
            )
        else:
            _log.info("Returning non-streaming response")
            return _serialize_response(response)

    except httpx.HTTPStatusError as e:
        _log.error(
            f"HTTP error sending message: {e.response.status_code} - {e.response.text}"
        )
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to send message: HTTP {e.response.status_code}",
        )
    except httpx.RequestError as e:
        _log.error(f"Request error sending message: {e}")
        raise HTTPException(
            status_code=503, detail=f"Failed to connect to agent: {str(e)}"
        )
    except Exception as e:
        _log.error(f"Unexpected error sending message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
