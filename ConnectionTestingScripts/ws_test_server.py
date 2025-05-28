from fastapi import FastAPI, WebSocket
import uvicorn

app = FastAPI()

@app.websocket("/test")
async def test_websocket(websocket: WebSocket):
    await websocket.accept()
    print("✅ Connection accepted")
    while True:
        data = await websocket.receive_text()
        print("📩 Received:", data)
        await websocket.send_text("Echo: " + data)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
