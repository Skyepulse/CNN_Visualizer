
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from Application.database import DatabaseEndpoint
import uvicorn
import json
from abc import ABC, abstractmethod
from Config.config import DB_CONFIG

#==========================#
class MyServer(FastAPI, ABC):

    #==========================#
    def __init__(self, port: int = 5000):
        super().__init__()
        self.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.port = port
        self.host = "localhost"

        # Members
        self.connected_clients = set()
        self.number_of_clients = 0

        self.add_websocket_route("/ws", self.websocket_endpoint)

        self.add_api_route("/status", self.status_handler, methods=["GET"])
        self.add_api_route("/", self.hello_handler, methods=["GET"])

        # Init DB
        self.db = DatabaseEndpoint(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            dbname=DB_CONFIG["dbname"]
        )
        
        @self.on_event("startup")
        async def startup_event():
            await self.db.init_db()
            print("[Startup] Database connection pool initialized.")

    #==========================#
    async def websocket_endpoint(self, websocket: WebSocket):
        await websocket.accept()
        try:
            self.connected_clients.add(websocket)
            self.number_of_clients += 1
            await self.on_connect(websocket)

            while True:
                raw_data = await websocket.receive_text()

                try:
                    data_json = json.loads(raw_data)
                    type = data_json.get("type")
                    data = data_json.get("data")

                    await self.process_message(type, data, websocket)

                except json.JSONDecodeError:
                    print(f"Invalid JSON received: {raw_data}")
                except Exception as e:
                    print(f"Error processing message: {e}")

        except WebSocketDisconnect:
            await self.on_disconnect(websocket)
            self.connected_clients.remove(websocket)
            self.number_of_clients -= 1
    
    #==========================#
    @abstractmethod
    async def process_message(self, type:str, data: str):
        pass

    #==========================#
    @abstractmethod
    async def on_disconnect(self, websocket: WebSocket):
        pass

    #==========================#
    @abstractmethod
    async def on_connect(self, websocket: WebSocket):
        pass

    #==========================#
    async def status_handler(self):
        return PlainTextResponse(str(self.number_of_clients))

    #==========================#
    async def hello_handler(self):
        return PlainTextResponse("hello world")
    
    #==========================#
    def run(self):
        uvicorn.run(self, host=self.host, port=self.port)
        print(f"Server running on {self.host}:{self.port}")

    #==========================#
    async def sendMessage(self, websocket: WebSocket, type: str, data: str):
        if websocket not in self.connected_clients:
            print(f"Client {websocket.client.port} is not connected.")
            return
        
        if type is None or data is None:
            print("Invalid message type or data. Cannot send message.")
            return
        
        message = json.dumps({"type": type, "data": data})
        await websocket.send_text(message)