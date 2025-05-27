#Import MyServer class from Application/application.py
from CNN_Visualizer.CNNVisualizer import CNNServer
from Config.config import BACKEND_PORT

my_server = CNNServer(port=BACKEND_PORT)

if __name__ == "__main__":
    my_server.run()