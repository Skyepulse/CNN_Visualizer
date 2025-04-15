#Import MyServer class from Application/application.py
from CNN_Visualizer.CNNVisualizer import CNNServer

my_server = CNNServer(port=5000)

if __name__ == "__main__":
    my_server.run()