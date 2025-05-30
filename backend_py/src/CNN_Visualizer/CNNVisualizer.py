from Application.application import MyServer
from CNN_Visualizer.CNNModelHolder import LeNetLoader
from Helpers.ThreadPools import run_in_executor
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
import base64
import os
from colorama import Fore, Style
import json

#==========================#
class CNNServer(MyServer):

    #==========================#
    def __init__(self, port: int = 5000):
        super().__init__(port=port)

        self.images = {}
        self.image_filepaths = {}
        self.modelHolder = LeNetLoader(model_path="other/Models/mnist_leNet.pth", dataset="mnist")

        self.modelHolder.load_model()

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
                #decode the data JSON:
                data = json.loads(data)

                # Assert we have 'data', 'name' and 'real' keys
                if "data" not in data or "name" not in data or "real" not in data:
                    print(Fore.RED, "Invalid MNIST image message received. Missing keys in data: ", data, " from ", websocket.client.port, Style.RESET_ALL)
                    return
                await self.handle_mnist_image(data['data'], websocket, data['real'], data['name'])
                pass
            case _:
                # Default case
                print(Fore.RED, "Unknown message type received: ", type, " with data: ", data, " from ", websocket, Style.RESET_ALL)
                pass
    
    #==========================#
    async def handle_mnist_image(self, data: str, websocket: WebSocket, real: int = -1, client_name: str = ""):
        # Handle the MNIST image data here        
        image_data = base64.b64decode(data)
        os.makedirs("mnist_images", exist_ok=True)
        filename = f"mnist_{str(websocket.client.port)}.png"
        filepath = os.path.join("mnist_images", filename)

        # If an image with the same name already exists, replace it
        if os.path.exists(filepath):
            os.remove(filepath)

        #
        #with open(filepath, "wb") as image_file:
        #   image_file.write(image_data)

        self.images[websocket] = image_data
        #self.image_filepaths[websocket] = filepath
        
        await self.sendMessage(websocket, "mnist-image", data)

        # Perform inference
        image_tensor = await self.modelHolder.data_to_tensor(image_data)

        # Thread pool for prediction
        prediction, visuals = await run_in_executor(self.modelHolder.predict, image_tensor)

        print(Fore.GREEN, f"Prediction for image from {websocket.client.port}: {prediction}", Style.RESET_ALL)

        match prediction:
            case -1:
                print(Fore.RED, f"Error during prediction for image from {websocket.client.port}", Style.RESET_ALL)
                await self.sendMessage(websocket, "mnist-prediction-error", "error")
            case _:
                await self.package_and_send_prediction(websocket, prediction, visuals)
        
        if real != -1:

            print("Saving image in DataBase")
            
            if client_name == "":
                client_name = f"Client {websocket.client.port}"
            # Save the image to the file system
            await self.db.insert_and_cleanup_image(
                image_data=image_data,
                prediction=prediction,
                real=real,  # Placeholder for the real label
                client_port=websocket.client.port,
                client_name=client_name
            )

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

    #==========================#
    async def package_and_send_prediction(self, websocket: WebSocket, prediction: int, visuals: list):
        for index, visual in enumerate(visuals):
            if index == len(visuals) - 1:
                continue
            visual["data"] = [int(v) for v in visual["data"]] # ensure integers

        payload = {
            "prediction": prediction,
            "visuals": visuals
        }

        await self.sendMessage(websocket, "mnist-prediction", json.dumps(payload))