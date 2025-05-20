import pytest
import asyncio
import base64
import websockets
import json

# Path to a sample MNIST image file to send as base64
SAMPLE_IMAGE_PATH = "sample_digit.png"
SERVER_WS_URL = "ws://localhost:5000/ws"

def load_sample_image_base64():
    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

@pytest.mark.asyncio
async def test_multiple_clients_handle_prediction():
    num_clients = 25
    image_data = load_sample_image_base64()

    async def client_task(client_id):
        async with websockets.connect(SERVER_WS_URL) as websocket:

            data = json.dumps({
                "data": image_data,
                "real": -1,
                "name": ""
            })

            # Send mnist image
            await websocket.send(json.dumps({
                "type": "mnist-image",
                "data": data
            }))

            received_prediction = False

            try:
                while True:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5)
                    parsed = json.loads(message)
                    if parsed["type"] == "mnist-prediction":
                        data = json.loads(parsed["data"])
                        assert "prediction" in data
                        assert isinstance(data["prediction"], int)
                        assert 0 <= data["prediction"] <= 9
                        print(f"Client {client_id} received prediction: {data['prediction']}")
                        received_prediction = True
                        break
            except asyncio.TimeoutError:
                pytest.fail(f"Client {client_id} timed out waiting for prediction")

            assert received_prediction

    # Launch multiple clients concurrently
    await asyncio.gather(*(client_task(i) for i in range(num_clients)))
