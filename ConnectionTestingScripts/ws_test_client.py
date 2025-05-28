import asyncio
import websockets

async def test_ws():
    uri = "wss://www.008032025.xyz/test"  # 👈 Your domain & Caddy endpoint

    try:
        async with websockets.connect(uri) as websocket:
            print("🔌 Connected to server")
            await websocket.send("Hello from local machine!")
            response = await websocket.recv()
            print("✅ Response from server:", response)

    except Exception as e:
        print("❌ WebSocket error:", e)

if __name__ == "__main__":
    asyncio.run(test_ws())
