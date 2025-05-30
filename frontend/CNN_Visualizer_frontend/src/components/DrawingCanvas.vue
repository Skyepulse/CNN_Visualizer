<template>
    <!--- IF IS NOT MOBILE --->  
    <div class="flex flex-row items-start space-x-4 p-4 w-full h-full" v-if="!isMobile">
        <div ref = "canvasContainer" class="flex flex-col items-start space-y-4 w-1/3">
            <canvas
              ref="canvas"
              width="400"
              height="400"
              class="border-2 border-gray-300 rounded cursor-crosshair"
              @mousedown="startDrawing"
              @mouseup="stopDrawing"
              @mousemove="draw"
              @mouseleave="stopDrawing"
              @touchstart.prevent="startDrawingTouch"
              @touchmove.prevent="drawTouch"
              @touchend="stopDrawing"
            >
            </canvas>
            <div class="flex flex-row w-full h-full">
              <div
                class="relative border-2 border-gray-300 rounded w-[150px] h-[150px] flex items-center justify-center"
              >
                  <img
                      v-if="hasImage"
                      :src="outputImageSource"
                      alt="Output"
                      class="w-full h-full object-contain"
                  />
                  <p v-else class=" text-shadow-zinc-50 font-bold text-center text-gray-400">
                      Your downscaled image sent to the model will appear here
                  </p>
              </div>
            </div>
        </div>
        <div class="flex flex-col w-2/3 space-y-4">
            <BabylonCanvas 
              v-if="fpsDisplay"
              :height="babylonHeight" 
              :width="babylonWidth" 
              :fpsDisplay="fpsDisplay" 
              ref="bbCanvasRef"
            >
            </BabylonCanvas>
            <div class="flex justify-center flex-wrap mt-3 mb-3">
                <div 
                  class="flex items-center justify-center"
                  :class="[
                    navigation ? 'w-[40px]' : 'w-[250px]',
                  ]"
                >
                    <input
                      ref="numberInput"
                      type="number"
                      v-model.number="realNumber"
                      min="0"
                      max="9"
                      class="border border-gray-300 rounded p-2 w-full text-center"
                      :class = "hasDrawn ? 'bg-gray-100 text-teal-900 font-bold' : 'bg-gray-400 text-gray-500 cursor-not-allowed'"
                      :placeholder="navigation ? '' : 'What number did you draw?'"
                      :disabled="!hasDrawn"
                      @blur="validateRealNumber"
                    />
                </div>
                <div class="flex m-2" v-if ="navigation">
                    <button class="text-base rounded-r-none  hover:scale-110 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
                    hover:bg-teal-200  
                    bg-gray-100  
                    text-teal-700 
                      border duration-200 ease-in-out 
                    border-teal-600 transition
                      max-h-[40px]
                      w-full"
                      @click="goToPreviousStep"
                    >
                        <div class="flex leading-4.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left w-5 h-5">
                                <polyline points="15 18 9 12 15 6">
                                </polyline>
                            </svg>
                            <fit-text>Last step</fit-text>
                        </div>
                    </button>
                    <button class="text-base  rounded-l-none border-l-0  hover:scale-110 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
                    hover:bg-teal-200  
                    bg-gray-100  
                    text-teal-700 
                      border duration-200 ease-in-out 
                    border-teal-600 transition
                      max-h-[40px]
                      w-full"
                      @click="goToNextStep"
                    >
                        <div class="flex leading-4.5">
                            <fit-text>Next step</fit-text>
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right w-5 h-5 ml-1">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </button>
                </div>
                <div class="flex m-2">
                    <button
                      class="text-base rounded-r-none focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer
                        bg-gray-100 text-teal-700 border duration-200 ease-in-out border-teal-600 transition max-h-[40px]"
                      :class="{
                        'opacity-50 cursor-not-allowed pointer-events-none bg-gray-200 text-gray-400 border-gray-300': !hasDrawn,
                        'hover:bg-teal-700 hover:text-teal-100 hover:scale-110': hasDrawn
                      }"
                      @click="transformCanvasAs28x28Grayscale"
                      :disabled="!hasDrawn"
                    >
                        <div class="flex leading-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye w-5 h-5 mr-1">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <fit-text>Send to Model</fit-text>
                        </div>
                    </button>
                    <button class="text-base  rounded-l-none border-l-0  hover:scale-110 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
                    hover:bg-teal-700 hover:text-teal-100 
                    bg-gray-100  
                    text-teal-700 
                      border duration-200 ease-in-out 
                    border-teal-600 transition
                      max-h-[40px]"
                      @click="cleanup"
                    >   
                        <div class="flex leading-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit w-5 h-5 mr-1">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <fit-text>Clear Canvas</fit-text>
                        </div>
                    </button>
                    <div class="flex ml-2">
                        <p ref="fpsDisplay" class="text-gray-300 text-lg font-bold [font-size:calc(1vw+0.3rem)] flex items-center justify-center h-full">
                          0
                        </p>
                    </div>
                </div>
            </div>
            <BackendImages>
            </BackendImages>
        </div>
    </div>

    <!--- IF IS MOBILE --->
    <div class="flex flex-col items-center space-x-4 p-1 m-0 w-full h-full" v-else>
      <BabylonCanvas 
            v-if="fpsDisplay"
            :height="babylonHeight"
            :width="babylonWidth" 
            :fpsDisplay="fpsDisplay" 
            ref="mobilebbCanvasRef"
          >
      </BabylonCanvas>
      <div class="flex justify-center flex-wrap mt-3 mb-3">
          <div 
            class="flex items-center justify-center"
            :class="[
              navigation ? 'w-[40px]' : 'w-[250px]',
            ]"
          >
              <input
                ref="numberInput"
                type="number"
                v-model.number="realNumber"
                min="0"
                max="9"
                class="border border-gray-300 rounded p-2 w-full text-center"
                :class = "hasDrawn ? 'bg-gray-100 text-teal-900 font-bold' : 'bg-gray-400 text-gray-500 cursor-not-allowed'"
                :placeholder="navigation ? '' : 'What number did you draw?'"
                :disabled="!hasDrawn"
                @blur="validateRealNumber"
              />
          </div>
          <div class="flex m-2" v-if ="navigation">
              <button class="text-base rounded-r-none focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
              bg-gray-100  
              text-teal-700 
                border duration-200 ease-in-out 
              border-teal-600 transition
                max-h-[40px]
                w-full"
                @click="goToPreviousStep"
              >
                  <div class="flex leading-4.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left w-5 h-5">
                          <polyline points="15 18 9 12 15 6">
                          </polyline>
                      </svg>
                      <fit-text>Last step</fit-text>
                  </div>
              </button>
              <button class="text-base  rounded-l-none border-l-0 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
              bg-gray-100  
              text-teal-700 
                border duration-200 ease-in-out 
              border-teal-600 transition
                max-h-[40px]
                w-full"
                @click="goToNextStep"
              >
                  <div class="flex leading-4.5">
                      <fit-text>Next step</fit-text>
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right w-5 h-5 ml-1">
                          <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                  </div>
              </button>
          </div>
          <div class="flex m-2">
              <button
                class="text-base rounded-r-none focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer
                  bg-gray-100 text-teal-700 border duration-200 ease-in-out border-teal-600 transition max-h-[40px]"
                :class="{
                  'opacity-50 cursor-not-allowed pointer-events-none bg-gray-200 text-gray-400 border-gray-300': !hasDrawn,
                  '': hasDrawn
                }"
                @click="transformCanvasAs28x28Grayscale"
                :disabled="!hasDrawn"
              >
                  <div class="flex leading-5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye w-5 h-5 mr-1">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <fit-text>Send to Model</fit-text>
                  </div>
              </button>
              <button class="text-base  rounded-l-none border-l-0 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
              bg-gray-100  
              text-teal-700 
                border duration-200 ease-in-out 
              border-teal-600 transition
                max-h-[40px]"
                @click="cleanup"
              >   
                  <div class="flex leading-5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit w-5 h-5 mr-1">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <fit-text>Clear Canvas</fit-text>
                  </div>
              </button>
              <div class="flex ml-2">
                  <p ref="fpsDisplay" class="text-gray-300 text-lg font-bold [font-size:calc(1vw+0.3rem)] flex items-center justify-center h-full">
                    0
                  </p>
              </div>
          </div>
      </div>
      <div ref="canvasContainer" class="flex flex-row m-0 p-0 w-full justify-center">
        <div
          ref="mobileDownscaledImageContainer"
          class="relative border-2 border-gray-300 rounded flex items-center justify-center"
        >
            <img
                v-if="hasImage"
                :src="outputImageSource"
                alt="Output"
                class="w-full h-full object-contain"
            />
            <p v-else class=" text-shadow-zinc-50 font-bold text-center text-gray-400 text-[3vw]">
                Your downscaled image sent to the model will appear here
            </p>
        </div>
        <canvas
          ref="mobileCanvas"
          width="400"
          height="400"
          class="border-2 border-gray-300 rounded cursor-crosshair"
          @mousedown="startDrawing"
          @mouseup="stopDrawing"
          @mousemove="draw"
          @mouseleave="stopDrawing"
          @touchstart.prevent="startDrawingTouch"
          @touchmove.prevent="drawTouch"
          @touchend="stopDrawing"
        >
        </canvas>
      </div>
      <div class="w-full mt-2">
        <BackendImages>
        </BackendImages>
      </div>
    </div> 
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
  import { useWebSocket } from '@src/composables/useWebSocket'
  import BabylonCanvas from './babylonCanvas.vue'
  import { launchMnistAnimation, resetScene, goToNextStep, goToPreviousStep } from '@src/scenes/MyFirstScene'
  import type { SceneInformation } from '@src/scenes/MyFirstScene'
  import BackendImages from '@src/components/BackendImages.vue'
  import { sendImageData } from '@src/composables/auxiliaries'
  import { useResponsive } from '@src/composables/useresponsive'
  import { nextTick } from 'vue'
  import { watch } from 'vue'

  //================================//
  const { messages } = useWebSocket()
  const { isMobile } = useResponsive()

  //================================//
  export type Visual = {
    title: string;
    width: number;
    height: number;
    data: number[]; // Flat grayscale pixel array
  };

  //================================//
  const canvas = ref<HTMLCanvasElement | null>(null)
  const mobileCanvas = ref<HTMLCanvasElement | null>(null)
  const getCanvas = (): HTMLCanvasElement | null => isMobile.value ? mobileCanvas.value : canvas.value;

  const canvasContainer = ref<HTMLDivElement | null>(null)
  const isDrawing = ref<boolean>(false)
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const fpsDisplay = ref<HTMLParagraphElement | undefined>(undefined)

  const outputImageSource = ref<string>('')
  const hasImage = ref<boolean>(false)

  const realNumber = ref<number | null>(null)
  const numberInput = ref<HTMLInputElement | null>(null)

  const hasDrawn = ref<boolean>(false)

  const bbCanvasRef = ref<InstanceType<typeof BabylonCanvas> | null>(null)
  const mobilebbCanvasRef = ref<InstanceType<typeof BabylonCanvas> | null>(null)

  const getBabylonCanvas = (): InstanceType<typeof BabylonCanvas> | null => isMobile.value ? mobilebbCanvasRef.value: bbCanvasRef.value;

  const navigation = ref<boolean | null>(null)

  // Mobile Only
  const babylonWidth = ref<number>(800)
  const babylonHeight = ref<number>(400)

  const mobileDownscaledImageContainer = ref<HTMLElement | null>(null)

  //================================//
  onMounted(async () => {

    let currentCanvas = getCanvas();
    while (!currentCanvas) {
      await nextTick();
      currentCanvas = getCanvas();
    }

    if (!currentCanvas) return;

    resetDrawingCanvas();

    window.addEventListener('resize', resizeCanvas);
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas);
  })

  watch(getCanvas, (newVal, oldVal) => {
    if (newVal !== oldVal) {
      resetBabylonScene(bbCanvasRef?.value);
      resetBabylonScene(mobilebbCanvasRef?.value);

      nextTick();
      resetDrawingCanvas();
    }
  })

  //================================//
  const startDrawing = (e: MouseEvent): void => {
    isDrawing.value = true
    const currentCanvas = getCanvas();
    if (!ctx.value || !currentCanvas) return

    if (!hasDrawn.value){
        hasDrawn.value = true
        ctx.value.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
        ctx.value.fillStyle='black'
        ctx.value.fillRect(0, 0, currentCanvas.width, currentCanvas.height)
    }

    ctx.value.beginPath()
    ctx.value.moveTo(getX(e), getY(e))
  }

  //================================//
  const resizeCanvas = () => {
    const currentCanvas = getCanvas();

    if (isMobile.value) {
      // For mobile, set a fixed size
      const screenWidth = window.innerWidth - 16;

      // Keep a 1:2 aspect ratio
      babylonWidth.value = screenWidth;
      babylonHeight.value = screenWidth * 0.5;
    } else {
      const rect = bbCanvasRef.value != null ? bbCanvasRef.value.getBoundingClientRect() : { width: 800, height: 400 }
      babylonWidth.value = rect.width;
      babylonHeight.value = babylonWidth.value * 0.5;
    }

    const currentBabylonCanvas = getBabylonCanvas();
    currentBabylonCanvas?.getSceneInformation()?.engine.resize();

    if (!currentCanvas) return

    // Get the new computed size (CSS width)
    const rect = canvasContainer.value != null ? canvasContainer.value.getBoundingClientRect() : { width: 400, height: 400 }
    const size = isMobile.value ? rect.width * 0.7 : rect.width;  // Because it's square (aspect-square)

    if (mobileDownscaledImageContainer.value) 
    {
        mobileDownscaledImageContainer.value.style.height = `${rect.width * 0.3}px`;
    }

    // Set the internal resolution to match
    currentCanvas.width = size
    currentCanvas.height = size

    if (ctx.value) {
      ctx.value.lineWidth = size * 0.06  // Keep thickness proportional
      ctx.value.lineCap = 'round'
      ctx.value.strokeStyle = '#FFF'
      ctx.value.fillStyle = 'black'
      
      if(!isMobile.value) ctx.value.fillRect(0, 0, size, size)

      if (!hasDrawn.value) {
        drawInitialText()
      }
    }
  }

  //================================//
  const draw = (e: MouseEvent): void => {
    if (!isDrawing.value || !ctx.value) return

    ctx.value.lineTo(getX(e), getY(e))
    ctx.value.stroke()
  }

  //================================//
  const stopDrawing = (): void => {
    isDrawing.value = false
    if (!ctx.value) return

    ctx.value.closePath()
  }

  //================================//
  const getTouchPos = (e: TouchEvent): { x: number; y: number } => {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  //================================//
  const startDrawingTouch = (e: TouchEvent): void => {
    isDrawing.value = true;
    const { x, y } = getTouchPos(e);

    if (!ctx.value) return;

    if (!hasDrawn.value) {
      hasDrawn.value = true;
      const currentCanvas = getCanvas();
      if (!currentCanvas) return;
      ctx.value.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      ctx.value.fillStyle = 'black';
      ctx.value.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
    }

    ctx.value.beginPath();
    ctx.value.moveTo(x, y);
  };

  //================================//
  const drawTouch = (e: TouchEvent): void => {
    if (!isDrawing.value || !ctx.value) return;

    const { x, y } = getTouchPos(e);
    ctx.value.lineTo(x, y);
    ctx.value.stroke();
  };

  //================================//
  const resetDrawingCanvas = (): void => {
    const currentCanvas = getCanvas();

    if (!currentCanvas) return

    ctx.value = currentCanvas.getContext('2d')

    if (!ctx.value) return

    ctx.value.lineWidth = 25
    ctx.value.lineCap = 'round'
    ctx.value.strokeStyle = '#FFF'
    
    ctx.value.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, currentCanvas.width, currentCanvas.height)

    hasDrawn.value = false

    resizeCanvas()
  }

  //================================//
  const getX = (e: MouseEvent): number => e.offsetX
  const getY = (e: MouseEvent): number => e.offsetY

  //================================//
  const cleanup = (): void => {
    const currentCanvas = getCanvas();

    if (!currentCanvas || !ctx.value) return

    navigation.value = false

    ctx.value.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, currentCanvas.width, currentCanvas.height)

    hasDrawn.value = false

    // Input value reset
    if (numberInput.value) {
      numberInput.value.value = ''
      realNumber.value = null
    }

    drawInitialText()

    // reset scene
    resetBabylonScene(getBabylonCanvas());
  }

  //================================//
  const resetBabylonScene = (bbcanvas: InstanceType<typeof BabylonCanvas> | null): void =>
  {
    if (!bbcanvas) return;

    if(bbcanvas.getSceneInformation() !== undefined && bbcanvas.getSceneInformation() !== null){
      const sceneInfo: SceneInformation = bbcanvas.getSceneInformation() as SceneInformation;
      resetScene(sceneInfo);
    }

    outputImageSource.value = '';
    hasImage.value = false

    if (numberInput.value) {
      numberInput.value.value = '';
      realNumber.value = null;
    }
  }

  //================================//
  const validateRealNumber = () => {
    if (realNumber.value === null || realNumber.value < 0 || realNumber.value > 9) {
      realNumber.value = null;
      if (numberInput.value) numberInput.value.value = '';
    }
  }

  //================================//
  const drawInitialText = () => {
    const currentCanvas = getCanvas();
    if (!ctx.value || !currentCanvas) return

    const canvasWidth = currentCanvas.width

    ctx.value.font = `${(canvasWidth * 26 / 400)}px system-ui`
    ctx.value.fillStyle = 'white'
    ctx.value.textAlign = 'center'
    ctx.value.fillText('Draw a number from 0-9 here ✍️', currentCanvas.width / 2, currentCanvas.height / 2)
  }

  //================================//
  const transformCanvasAs28x28Grayscale = () => {
    const currentCanvas = getCanvas();

    if (!currentCanvas || ! hasDrawn.value) return

    navigation.value = false

    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = 28
    resizedCanvas.height = 28
    const resizedCtx = resizedCanvas.getContext('2d')

    if (!resizedCtx) return

    // 2. Draw original canvas content scaled down to 28x28
    resizedCtx.drawImage(currentCanvas, 0, 0, 28, 28)

    // 3. Get the image data and manually convert to grayscale
    const imageData = resizedCtx.getImageData(0, 0, 28, 28)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // Grayscale using luminance method
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        data[i] = data[i + 1] = data[i + 2] = gray
        // keep alpha as is
    }

    resizedCtx.putImageData(imageData, 0, 0)

    // Send message as base64 string
    const base64String = resizedCanvas.toDataURL('image/png')

    const randomNumber = Math.floor(Math.random() * 1000000)
    const randomClient = `client-${randomNumber}`
    
    sendImageData(base64String, realNumber.value, randomClient);
  }

  //================================//
  watchEffect( async () => {
    // Check if there are new messages
    if (messages.value.length === 0) return

    const lastMessage = messages.value[messages.value.length - 1]
    
    if (lastMessage !== null && lastMessage.type === 'mnist-image') {
      messages.value.pop()
    }

    else if (lastMessage !== null && lastMessage.type === 'mnist-prediction') {
      const data = lastMessage.data
      // decode data with json
      try{

        const decodedData = JSON.parse(data)

        const decodedVisuals: Visual[] = decodedData.visuals
        const transformedPredictions = decodedVisuals[decodedVisuals.length - 1].data;

        const originalImage: Visual = decodedVisuals[0]
        outputImageSource.value = await saveVisualAsPNG(originalImage)
        hasImage.value = true

        const currentBBCanvas = getBabylonCanvas();

        if(currentBBCanvas?.getSceneInformation() !== undefined && currentBBCanvas?.getSceneInformation() !== null){
          const sceneInfo: SceneInformation = currentBBCanvas.getSceneInformation() as SceneInformation
          
          await launchMnistAnimation(sceneInfo, decodedVisuals, transformedPredictions).then(() => {
            navigation.value = true;
          });

        }

      } catch (error) {
        console.error('Error decoding data:', error)
      }

      messages.value.pop()
    }
  })

  //================================//
  const saveVisualAsPNG = async (visual: Visual): Promise<string> => 
  {
    const canvas = document.createElement('canvas')
    canvas.width = visual.width
    canvas.height = visual.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const imageData = ctx.createImageData(visual.width, visual.height)
    const data = imageData.data

    for (let i = 0; i < visual.data.length; i++) {
      const value = visual.data[i]
      data[i * 4] = value // R
      data[i * 4 + 1] = value // G
      data[i * 4 + 2] = value // B
      data[i * 4 + 3] = 255 // A
    }

    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL('image/png')
  }
</script>