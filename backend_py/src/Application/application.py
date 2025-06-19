from datetime import datetime, timezone
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.responses import JSONResponse, Response
from fastapi.requests import Request
from fastapi import HTTPException
from contextlib import asynccontextmanager
from Application.database import DatabaseEndpoint
import uvicorn
import json
from abc import ABC, abstractmethod
from Config.config import DB_CONFIG
from Config.config import BACKEND_PROXY_HEADERS
from Config.config import BACKEND_EMAIL
from Config.config import BACKEND_EMAIL_PASSWORD
import base64
from pydantic import BaseModel, EmailStr
import smtplib
from email.message import EmailMessage

#==========================#
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Initializing database connection pool...")
    await app.db.init_db()
    print("[Startup] Database connection pool initialized.")
    yield
    print("[Shutdown] Cleaning up...")  # Optional

#==========================#
class MyServer(FastAPI, ABC):

    #==========================#
    def __init__(self, port: int = 5000):
        super().__init__(lifespan=lifespan)
        self.add_middleware(
                CORSMiddleware,
                allow_origins=["*"],  # Allow all origins
                allow_methods=["*"],
                allow_headers=["*"],
            )
        self.port = port
        self.host = "0.0.0.0"

        # Members
        self.connected_clients = set()
        self.number_of_clients = 0

        self.add_websocket_route("/ws", self.websocket_endpoint)

        self.add_api_route("/api/status", self.status_handler, methods=["GET"])
        self.add_api_route("/api/helloworld", self.hello_handler, methods=["GET"])
        self.add_api_route("/api/images", self.images_handler, methods=["GET"])
        self.add_api_route("/api/latest_image", self.latest_image_handler, methods=["GET"])
        self.add_api_route("/api/random_image", self.random_image_handler, methods=["GET"])
        self.add_api_route("/api/last_connections", self.last_connections_handler, methods=["GET"])
        self.add_api_route("/api/contact", self.contact_handler, methods=["POST"])

        # Init DB
        self.db = DatabaseEndpoint(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            dbname=DB_CONFIG["dbname"],
            max_images=2000
        )

        #init email smtp connection
        self.smtp = smtplib.SMTP('smtp.gmail.com', 587)
        self.smtp.starttls()
        self.smtp.starttls()
        self.smtp.login(BACKEND_EMAIL, BACKEND_EMAIL_PASSWORD)

    #==========================#
    async def websocket_endpoint(self, websocket: WebSocket):
        await websocket.accept()
        try:
            self.connected_clients.add(websocket)
            uuidClient = uuid.uuid4()
            await self.db.log_connection(uuidClient, datetime.now(timezone.utc))
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
            await self.db.log_disconnection(uuidClient, datetime.now(timezone.utc))
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
    async def last_connections_handler(self, hours: int = Query(default=1, ge=1, le=168)):
        rows = await self.db.get_connections_last_hours(hours)

        result = []
        try:
            for row in rows:
                result.append({
                    "uuid": str(row["session_uuid"]),
                    "connected_at": row["connected_at"].astimezone().isoformat(),
                    "disconnected_at": (
                        row["disconnected_at"].astimezone().isoformat()
                        if row["disconnected_at"] else None
                    )
                })
                
        except Exception as e:
            print(f"Error processing connection data: {e}")
            return JSONResponse(content={"message": "Error processing connection data."}, status_code=500)

        if not result:
            return JSONResponse(content={"message": "No connections found."}, status_code=404)

        return JSONResponse(content={"connections": result})

    #==========================#
    async def status_handler(self):
        return PlainTextResponse(str(self.number_of_clients))

    #==========================#
    async def hello_handler(self):
        return PlainTextResponse("hello world")
    
    #==========================#
    async def contact_handler(self, request: Request):
        try:
            data = await request.json()
            form = ContactForm(**data)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid input") from e

        msg = EmailMessage()
        msg["Subject"] = f"Contact Form: {form.subject}"
        msg["From"] = form.email
        msg.set_content(form.message)
        msg["To"] = BACKEND_EMAIL

        try:
            self.smtp.send_message(msg)
            print(f"Email sent from {form.email} with subject '{form.subject}'")
            return JSONResponse(content={"message": "Email sent successfully."}, status_code=200)
        except Exception as e:
            print(f"Failed to send email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send email") from e

    #==========================#
    async def random_image_handler(self):
        row = await self.db.get_random_image()

        print(f"Returning random image: {row}")

        if not row:
            svg = '''
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
                <rect width="200" height="20" fill="#e05d44"/>
                <text x="10" y="14" fill="#fff">No images found</text>
            </svg>
            '''

            return Response(content=svg, media_type="image/svg+xml")
        
        image_data = row["image_data"]

        return Response(content=image_data, media_type="image/png")
    
    #==========================#
    async def latest_image_handler(self):
        row = await self.db.get_images(1)
        
        if not row:
            svg = '''
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
                <rect width="200" height="20" fill="#e05d44"/>
                <text x="10" y="14" fill="#fff">No images found</text>
            </svg>
            '''
            return Response(content=svg, media_type="image/svg+xml")

        row = row[0]
        image_data = row["image_data"]
        
        return Response(content=image_data, media_type="image/png")

    #==========================#
    async def images_handler(self):
        rows = await self.db.get_images(20)
        
        images = []

        for row in rows:
            image_data = row["image_data"]
            prediction = row["prediction"]
            real = row["real"]
            client_name = row["client_name"]

            image_base64 = base64.b64encode(image_data).decode("utf-8")

            images.append({
                "image_data": image_base64,
                "prediction": prediction,
                "real": real,
                "client_name": client_name
            })
        
        if not images:
            return JSONResponse(content={"message": "No images found."})

        print(f"Returning {len(images)} images.")
        return JSONResponse(content=images)
    
    #==========================#
    def run(self):
        print(f"Server running on {self.host}:{self.port} with proxy headers set to {BACKEND_PROXY_HEADERS}.")
        uvicorn.run(self, host=self.host, port=self.port, proxy_headers=BACKEND_PROXY_HEADERS)

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

#==========================#
class ContactForm(BaseModel):
    email: EmailStr
    subject: str
    message: str