from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

class MyServer(FastAPI):

    def __init__(self):
        super().__init__()
        self.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Members
        self.connected_clients = set()
        self.number_of_clients = 0

        self.add_websocket_route("/ws", self.websocket_endpoint)

        self.add_api_route("/status", self.status_handler, methods=["GET"])
        self.add_api_route("/", self.hello_handler, methods=["GET"])

    async def websocket_endpoint(self, websocket: WebSocket):
        await websocket.accept()
        try:
            self.connected_clients.add(websocket)
            self.number_of_clients += 1
            while True:
                data = await websocket.receive_text()
                print("Received from", websocket, " data:", data)
                await websocket.send_text(f"Echo: {data}")
        except WebSocketDisconnect:
            self.connected_clients.remove(websocket)
            self.number_of_clients -= 1
            print("Client disconnected")

    async def status_handler(self):
        return PlainTextResponse(str(self.number_of_clients))

    async def hello_handler(self):
        return PlainTextResponse("hello world")
    