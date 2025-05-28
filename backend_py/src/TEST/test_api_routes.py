import pytest
import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", f"ws://localhost:{5000}/ws")
API_URL = os.getenv("BACKEND_API_URL", f"http://localhost:{5000}")

API_TEST_ENDPOINTS = [
    "/status",
    "/images",
    "/helloworld"
]

@pytest.mark.asyncio
async def test_api_endpoints():
    num_clients = 200

    async def client_task(client_id):
        async with aiohttp.ClientSession() as session:
            for endpoint in API_TEST_ENDPOINTS:
                url = f"{API_URL}{endpoint}"
                async with session.get(url) as response:
                    assert response.status == 200

                    # Try to parse JSON if possible
                    try:
                        data = await response.json()
                    except aiohttp.ContentTypeError:
                        # Fallback to plain text if not JSON
                        data = await response.text()

                    print(f"Client {client_id} received data from {url}: {data}")
                    assert data is not None

    await asyncio.gather(*(client_task(i) for i in range(num_clients)))
