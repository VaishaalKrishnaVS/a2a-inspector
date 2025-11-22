"""A2A client utilities for agent card resolution."""

from typing import AsyncGenerator
from uuid import uuid4

import httpx
from a2a.client import A2ACardResolver, A2AClient
from a2a.types import (
    AgentCard,
    Message,
    MessageSendParams,
    Role,
    SendMessageRequest,
    SendMessageResponse,
    SendStreamingMessageRequest,
    SendStreamingMessageResponse,
    TextPart,
)

from config import HTTP_TIMEOUT_AGENT_CARD, HTTP_TIMEOUT_MESSAGE
from util.cache import cache_agent_card, get_cached_agent_card
from util.logging_config import LoggingConfig

_log = LoggingConfig.get_logger(__name__)


async def create_agent_card(base_url: str, use_cache: bool = True) -> AgentCard:
    """
    Create/resolve an agent card using the A2A SDK.

    Args:
        base_url: Base URL of the agent
        use_cache: Whether to use cached agent card if available

    Returns:
        AgentCard object

    Raises:
        a2a.client.errors.A2AClientHTTPError: If HTTP error occurs
        a2a.client.errors.A2AClientJSONError: If JSON parsing/validation fails
    """
    # Check cache first
    if use_cache:
        cached_card = get_cached_agent_card(base_url)
        if cached_card:
            _log.debug(f"Using cached agent card for {base_url}")
            return cached_card

    _log.info(f"Resolving agent card for base URL: {base_url}")
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_AGENT_CARD) as client:
        resolver = A2ACardResolver(client, base_url=base_url)
        card = await resolver.get_agent_card()
        _log.info(f"Successfully resolved agent card for {base_url}")

        # Cache the card
        if use_cache:
            cache_agent_card(base_url, card)

        return card


def _create_message(prompt: str, metadata: dict) -> MessageSendParams:
    """Create a message with the given prompt and metadata."""
    part = TextPart(kind="text", text=prompt)
    message = Message(message_id=str(uuid4()), parts=[part], role=Role.user)
    return MessageSendParams(message=message, metadata=metadata)


def _supports_streaming(agent_card: AgentCard) -> bool:
    """Check if agent card supports streaming."""
    return (
        agent_card.capabilities is not None
        and hasattr(agent_card.capabilities, "streaming")
        and agent_card.capabilities.streaming is True
    )


async def send_message(
    agent_url: str,
    prompt: str,
    metadata: dict,
    agent_card: AgentCard | None = None,
) -> SendMessageResponse | AsyncGenerator[SendStreamingMessageResponse, None]:
    """
    Send a message to an agent.

    Args:
        agent_url: Base URL of the agent
        prompt: The message text to send
        metadata: Additional metadata to include with the message
        agent_card: Optional pre-resolved agent card (avoids extra lookup)

    Returns:
        SendMessageResponse for non-streaming, or AsyncGenerator for streaming responses

    Note:
        For streaming responses, the httpx client is kept alive until the stream is consumed.
        The caller must ensure the stream is fully consumed or properly closed.
    """
    _log.info(
        f"Sending message to Agent URL: {agent_url} with prompt: {prompt[:50]}... "
        f"and metadata keys: {list(metadata.keys())}"
    )

    # Resolve agent card if not provided
    if agent_card is None:
        agent_card = await create_agent_card(agent_url)

    message_params = _create_message(prompt, metadata)
    supports_streaming = _supports_streaming(agent_card)

    if supports_streaming:
        _log.info("Using streaming message endpoint")
        # For streaming, we need to keep the client alive
        # Create client outside context manager and manage lifecycle in wrapper
        httpx_client = httpx.AsyncClient(timeout=HTTP_TIMEOUT_MESSAGE)
        a2a_client = A2AClient(httpx_client=httpx_client, agent_card=agent_card)
        request = SendStreamingMessageRequest(id=str(uuid4()), params=message_params)

        # Return wrapper that manages client lifecycle
        async def streaming_generator():
            try:
                async for response in a2a_client.send_message_streaming(request):
                    yield response
            finally:
                await httpx_client.aclose()

        return streaming_generator()
    else:
        _log.info("Using non-streaming message endpoint")
        # For non-streaming, we can use context manager normally
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_MESSAGE) as httpx_client:
            client = A2AClient(httpx_client=httpx_client, agent_card=agent_card)
            request = SendMessageRequest(id=str(uuid4()), params=message_params)
            return await client.send_message(request)
