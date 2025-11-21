"""Simple in-memory cache for agent cards."""

from typing import Optional

from a2a.types import AgentCard

# Simple in-memory cache: {url: (card, timestamp)}
_agent_card_cache: dict[str, tuple[AgentCard, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached_agent_card(url: str) -> Optional[AgentCard]:
    """
    Get cached agent card if available and not expired.

    Args:
        url: Agent base URL

    Returns:
        Cached AgentCard or None if not found/expired
    """
    import time

    if url not in _agent_card_cache:
        return None

    card, timestamp = _agent_card_cache[url]
    if time.time() - timestamp > CACHE_TTL_SECONDS:
        del _agent_card_cache[url]
        return None

    return card


def cache_agent_card(url: str, card: AgentCard) -> None:
    """
    Cache an agent card.

    Args:
        url: Agent base URL
        card: AgentCard to cache
    """
    import time

    _agent_card_cache[url] = (card, time.time())


def clear_agent_card_cache(url: Optional[str] = None) -> None:
    """
    Clear agent card cache.

    Args:
        url: Specific URL to clear, or None to clear all
    """
    if url:
        _agent_card_cache.pop(url, None)
    else:
        _agent_card_cache.clear()
