import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from httpx import AsyncClient

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)
AGENT_CARD_ENDPOINT = "/.well-known/agent-card.json"

_log = logging.getLogger(__name__)


@app.get("/")
async def test_pack():
    return {"status": "working"}


@app.get("/agent-card")
async def get_agent_card(
    url: str = Query(..., description="Base URL of the agent to fetch card from")
):
    _log.info(f"Fetching agent card for URL: {url}")
    agent_card_url = f"{url.rstrip('/')}{AGENT_CARD_ENDPOINT}"
    try:
        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(agent_card_url)
            response.raise_for_status()
            data = response.json()
            _log.info(f"response: {data}")
            return data
    except Exception as e:
        _log.error(f"Error fetching agent card: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch agent card: {str(e)}"
        )
