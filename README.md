# 🧠 CNN Visualizer

**Explore the inner workings of a real-time Convolutional Neural Network on MNIST digits — all in your browser.**  
Draw a digit, test the model live, and watch the animated layers teach you the inner works of a CNN.  
Curious what tricks others used to confuse the AI? Check out their creations and share yours too!

<p align="center">
  <img src="/other/SS1.png" alt="Project Screenshot" width="600"/>
</p>

---

## 🔍 What It Does

This project provides an **interactive visual breakdown** of how a CNN processes handwritten digits.  
See how each layer interprets your input — from a 28x28 greyscale image to final prediction.

💡 **Features:**
- ✏️ Draw your own digits and test the model
- 🎞️ Animated convolution, pooling, and dense layers
- 🌐 Real-time model inference with WebSocket communication
- 📊 View and share misclassified examples from others
- A **60 FPS** animation, even on mobile phones, thanks to **instancing shaders** to render hundreds of cubes with minimal compute time!

---

## 🛠️ Tech Stack

**Frontend:**
- 🚀 [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- 🎮 [Babylon.js](https://www.babylonjs.com/) for WebGL visualization and shader instancing
- ⚡ Node.js for development server

**Backend:**
- 🐍 [FastAPI](https://fastapi.tiangolo.com/) for API and WebSocket handling
- 🧠 Python CNN model trained on MNIST with Pytorch
- 🗄️ PostgreSQL for storing user-submitted digits

**Infrastructure:**
- 🔁 [Caddy](https://caddyserver.com/) as a reverse proxy for seamless HTTPS & routing

---

## 🌐 Try It Out

**🚀 [Live Demo →](https://www.008032025.xyz)**  
> *(Works on Desktop and mobile phones! Try it out.)*

---

## 📸 Sneak Peek
Random images of drawn digits by users of the visualizer!

<div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
  <img src="https://www.008032025.xyz/api/random_image?t=1748838493" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748837687" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748815763" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748812993" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748819464" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748834398" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748826235" alt="Random Image" width="100"/>
  <img src="https://www.008032025.xyz/api/random_image?t=1748813131" alt="Random Image" width="100"/>
</div>

## 📄 License

MIT License © 2025