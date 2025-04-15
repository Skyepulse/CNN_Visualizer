from Application.application import MyServer
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
import base64
import os
from colorama import Fore, Style

#==========================#
class CNNServer(MyServer):

    #==========================#
    def __init__(self, port: int = 5000):
        super().__init__(port=port)

        self.images = {}
        self.image_filepaths = {}

    #==========================#
    async def process_message(self, type: str, data: str, websocket: WebSocket):
        
        if type is None or data is None:
            print(Fore.RED, "Invalid message received. Could not be processed with type: ", type, " and data: ", data, " from ", websocket.client.port, Style.RESET_ALL)
            return
        
        match type:
            case "simple-message":
                print("Simple message received: ", data, " from ", websocket.client.port)
                pass
            case "mnist-image":
                await self.handle_mnist_image(data, websocket)
                pass
            case _:
                # Default case
                print(Fore.RED, "Unknown message type received: ", type, " with data: ", data, " from ", websocket, Style.RESET_ALL)
                pass
    
    #==========================#
    async def handle_mnist_image(self, data: str, websocket: WebSocket):
        # Handle the MNIST image data here
        print(Fore.CYAN, f"MNIST image data received from {websocket.client.port}", Style.RESET_ALL)
        
        image_data = base64.b64decode(data)
        os.makedirs("mnist_images", exist_ok=True)
        filename = f"mnist_{str(websocket.client.port)}.png"
        filepath = os.path.join("mnist_images", filename)

        # If an image with the same name already exists, replace it
        if os.path.exists(filepath):
            os.remove(filepath)

        with open(filepath, "wb") as image_file:
            image_file.write(image_data)

        self.images[websocket] = image_data
        self.image_filepaths[websocket] = filepath
        
        print(f"MNIST image saved to {filepath}")

        await self.sendMessage(websocket, "mnist-image", data)

    #==========================#
    async def on_connect(self, websocket: WebSocket):
        print(Fore.GREEN, f"Client {websocket.client.port} connected at {datetime.now()}", Style.RESET_ALL)

    #==========================#
    async def on_disconnect(self, websocket: WebSocket):
        print(Fore.YELLOW, f"Client {websocket.client.port} disconnected at {datetime.now()}", Style.RESET_ALL)

        if websocket in self.images:
            del self.images[websocket]

        if websocket in self.image_filepaths:
            os.remove(self.image_filepaths[websocket])
            del self.image_filepaths[websocket]