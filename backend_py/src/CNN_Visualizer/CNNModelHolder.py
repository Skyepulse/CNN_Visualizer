import torch
import torch.nn as nn
import torch.nn.functional as F
from colorama import Fore, Style
import numpy as np
from PIL import Image
from torchvision import transforms
import io

#==========================#
class LeNetLoader:
    def __init__(self, model_path: str, dataset: str = 'mnist'):   
        self.model = LeNet(dataset=dataset)
        self.model_path = model_path
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    #==========================#
    def load_model(self):
        try:
            state_dict = torch.load(self.model_path, map_location=torch.device('cpu'))
            self.model.load_state_dict(state_dict)
            self.model.eval()  # Set the model to evaluation mode
            print(Fore.GREEN, f"Model loaded successfully from {self.model_path}", Style.RESET_ALL)
        except Exception as e:
            print(Fore.RED, f"Error loading model: {e}", Style.RESET_ALL)

    #==========================#
    def get_model(self):
        return self.model
    
    #==========================#
    async def predict(self, image: torch.Tensor):
        """
        Perform inference on a single MNIST image tensor.

        Args:
            image (torch.Tensor): A [28, 28] or [1, 28, 28] grayscale image (values in 0–1).

        Returns:
            int: The predicted class label (0–9)
        """
        try:
            if image.ndim == 2:
                # Add channel and batch dimension → [1, 1, 28, 28]
                image = image.unsqueeze(0).unsqueeze(0)
            elif image.ndim == 3:
                # Add batch dimension → [1, 1, 28, 28]
                image = image.unsqueeze(0)

            image = image.to(self.device).float()

            with torch.no_grad():
                output = self.model(image)
                prediction = torch.argmax(output, dim=1).item()

            return prediction, self.model.visuals
        
        except Exception as e:
            print(Fore.RED, f"Error during prediction: {e}", Style.RESET_ALL)
            return -1, []
        
    #==========================#
    async def data_to_tensor(self, data: bytes) -> torch.Tensor:
        """
        Convert byte data to a PyTorch tensor.

        Args:
            data (bytes): Byte data representing a grayscale image.

        Returns:
            torch.Tensor: A [1, 28, 28] tensor representing the image.
        """
        try:
            image = Image.open(io.BytesIO(data)).convert('L')  # Convert to grayscale
            transform = transforms.Compose([
                transforms.Resize((28, 28)),  # Resize to 28x28
                transforms.ToTensor(),        # Convert to tensor
                transforms.Normalize((0.5,), (0.5,)) # Convert to [-1, 1]
            ])
            tensor = transform(image)
            return tensor
        
        except Exception as e:
            print(Fore.RED, f"Error converting data to tensor: {e}", Style.RESET_ALL)
            return None
    
#==========================#
class LeNet(nn.Module):
    def __init__(self, dataset='mnist'):
        super(LeNet, self).__init__()

        self.dataset = dataset.lower()
        self.in_channels = 1 if self.dataset == 'mnist' else 3
        self.input_size = (28, 28) if self.dataset == 'mnist' else (32, 32)

        self.conv1 = nn.Conv2d(self.in_channels, 6, kernel_size=5, padding=2)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, kernel_size=5)

        # Dynamically initialize fc1 based on input shape
        self.fc1 = None  # Placeholder for now
        self._init_fc1()

        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def _init_fc1(self):
        with torch.no_grad():
            dummy_input = torch.zeros(1, self.in_channels, *self.input_size)
            x = self.pool(F.relu(self.conv1(dummy_input)))
            x = self.pool(F.relu(self.conv2(x)))
            num_features = x.view(1, -1).shape[1]
            self.fc1 = nn.Linear(num_features, 120)

    def forward(self, x, save_visuals=True):
        """
        Forward pass through the network.
        Args:
            x (torch.Tensor): Input tensor.
            save_visuals (bool): Flag to save visualizations.
        Returns:
            torch.Tensor: Output tensor after passing through the network.
        """
        self.visuals = []
        visuals = []

        if save_visuals:
            visuals.append(self.prepare_visuals("Input Image", x[0,0].detach().cpu().numpy()))
        
        x1 = self.conv1(x)
        if save_visuals:
            for i in range(x1.shape[1]):
                visuals.append(self.prepare_visuals(f"Conv1 Feature Map {i}", x1[0,i].detach().cpu().numpy()))

        x1_relu = F.relu(x1)
        x2 = self.pool(x1_relu)
        if save_visuals:
            for i in range(x2.shape[1]):
                visuals.append(self.prepare_visuals(f"Pool1 Feature Map {i}", x2[0,i].detach().cpu().numpy()))

        x3 = self.conv2(x2)
        if save_visuals:
            for i in range(x3.shape[1]):
                visuals.append(self.prepare_visuals(f"Conv2 Feature Map {i}", x3[0,i].detach().cpu().numpy()))

        x3_relu = F.relu(x3)
        x4 = self.pool(x3_relu)
        if save_visuals:
            for i in range(x4.shape[1]):
                visuals.append(self.prepare_visuals(f"Pool2 Feature Map {i}", x4[0,i].detach().cpu().numpy()))

        x_flat = x4.view(x4.shape[0], -1)
        if save_visuals:
            flat_vis = x_flat[0].detach().cpu().numpy().reshape(1, -1)
            visuals.append(self.prepare_visuals("Flattened Feature Map (400)", flat_vis))

        x5 = F.relu(self.fc1(x_flat))
        if save_visuals:
            fc1_vis = x5[0].detach().cpu().numpy().reshape(10, 12)
            visuals.append(self.prepare_visuals("FC1 Output (120)", fc1_vis))

        x6 = F.relu(self.fc2(x5))
        if save_visuals:
            fc2_vis = x6[0].detach().cpu().numpy().reshape(7, 12)
            visuals.append(self.prepare_visuals("FC2 Output (84)", fc2_vis))

        x7 = self.fc3(x6)
        out = F.log_softmax(x7, dim=1)
        if save_visuals:
            fc3_vis = out[0].detach().cpu().numpy().reshape(1, 10)
            visuals.append(self.prepare_visuals("FC3 Output (10 logits)", fc3_vis))

        self.visuals = visuals

        return out

    def prepare_visuals(self, name, array):
        # Normalize to [0, 255] uint8
        arr = array - np.min(array)
        if np.max(arr) != 0:
            arr = arr / np.max(arr)
        arr = (arr * 255).astype(np.uint8)

        return {
            "title": name,
            "width": arr.shape[1],
            "height": arr.shape[0],
            "data": arr.flatten().tolist(),
        }