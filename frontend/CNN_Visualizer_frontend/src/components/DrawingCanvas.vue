<template>
    <div class="flex flex-row items-start space-x-4 p-4 w-full h-full">
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
            >
            </canvas>
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
        <div class="flex flex-col w-2/3 space-y-4">
            <BabylonCanvas 
              v-if="fpsDisplay"
              :height="400" 
              :width="800" 
              :fpsDisplay="fpsDisplay" 
              ref="bbCanvasRef"
            >
            </BabylonCanvas>
            <div class="flex justify-center flex-wrap">
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
                    <button class="text-base  rounded-r-none  hover:scale-110 focus:outline-none flex justify-center px-4 py-2 rounded font-bold cursor-pointer 
                    hover:bg-teal-700 hover:text-teal-100 
                    bg-gray-100  
                    text-teal-700 
                      border duration-200 ease-in-out 
                    border-teal-600 transition
                      max-h-[40px]"
                      @click="sendCanvasAs28x28Grayscale"
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
        </div>
    </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
  import { useWebSocket } from '@src/composables/useWebSocket'
  import BabylonCanvas from './babylonCanvas.vue'
  import { launchMnistAnimation, resetScene, goToNextStep, goToPreviousStep } from '@src/scenes/MyFirstScene'
  import type { SceneInformation } from '@src/scenes/MyFirstScene'

  //================================//
  const { sendMessage, messages } = useWebSocket()

  //================================//
  export type Visual = {
    title: string;
    width: number;
    height: number;
    data: number[]; // Flat grayscale pixel array
  };

  //================================//
  const canvas = ref<HTMLCanvasElement | null>(null)
  const canvasContainer = ref<HTMLDivElement | null>(null)
  const isDrawing = ref<boolean>(false)
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const fpsDisplay = ref<HTMLParagraphElement | undefined>(undefined)

  const outputImageSource = ref<string>('')
  const hasImage = ref<boolean>(false)

  const hasDrawn = ref<boolean>(false)

  const bbCanvasRef = ref<InstanceType<typeof BabylonCanvas> | null>(null)

  const navigation = ref<boolean | null>(null)
  const leftA = ref<HTMLButtonElement | null>(null)
  const rightA = ref<HTMLButtonElement | null>(null)

  //================================//
  onMounted(() => {
    if (!canvas.value) return

    ctx.value = canvas.value.getContext('2d')

    if (!ctx.value) return

    ctx.value.lineWidth = 25
    ctx.value.lineCap = 'round'
    ctx.value.strokeStyle = '#FFF'
    
    outputImageSource.value = new URL('../assets/number.png', import.meta.url).href
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

    resizeCanvas()

    window.addEventListener('resize', resizeCanvas)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
  })

  //================================//
  const startDrawing = (e: MouseEvent): void => {
    isDrawing.value = true
    if (!ctx.value || !canvas.value) return

    if (!hasDrawn.value){
        hasDrawn.value = true
        ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
        ctx.value.fillStyle='black'
        ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
    }

    ctx.value.beginPath()
    ctx.value.moveTo(getX(e), getY(e))
  }

  //================================//
  const resizeCanvas = () => {
    if (!canvas.value) return

    // Get the new computed size (CSS width)
    const rect = canvasContainer.value != null ? canvasContainer.value.getBoundingClientRect() : { width: 400, height: 400 }
    const size = rect.width  // Because it's square (aspect-square)

    // Set the internal resolution to match
    canvas.value.width = size
    canvas.value.height = size

    // Optional: redraw background or initial text if needed
    if (ctx.value) {
      ctx.value.lineWidth = size * 0.06  // Keep thickness proportional
      ctx.value.lineCap = 'round'
      ctx.value.strokeStyle = '#FFF'
      ctx.value.fillStyle = 'black'
      ctx.value.fillRect(0, 0, size, size)

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
  const getX = (e: MouseEvent): number => e.offsetX
  const getY = (e: MouseEvent): number => e.offsetY

  //================================//
  const cleanup = (): void => {
    if (!canvas.value || !ctx.value) return

    navigation.value = false

    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

    hasDrawn.value = false
    drawInitialText()

    // reset scene
    if(bbCanvasRef.value?.getSceneInformation() !== undefined && bbCanvasRef.value?.getSceneInformation() !== null){
      const sceneInfo: SceneInformation = bbCanvasRef.value.getSceneInformation() as SceneInformation
      resetScene(sceneInfo)
    }

    // reset center image
    outputImageSource.value = ''
    hasImage.value = false
  }

  //================================//
  const drawInitialText = () => {
    if (!ctx.value || !canvas.value) return

    const canvasWidth = canvas.value.width

    ctx.value.font = `${(canvasWidth * 26 / 400)}px system-ui`
    ctx.value.fillStyle = 'white'
    ctx.value.textAlign = 'center'
    ctx.value.fillText('Draw a number from 0-9 here ✍️', canvas.value.width / 2, canvas.value.height / 2)
  }

  //================================//
  const sendCanvasAs28x28Grayscale = () => {
    if (!canvas.value) return

    navigation.value = false

    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = 28
    resizedCanvas.height = 28
    const resizedCtx = resizedCanvas.getContext('2d')

    if (!resizedCtx) return

    // 2. Draw original canvas content scaled down to 28x28
    resizedCtx.drawImage(canvas.value, 0, 0, 28, 28)

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
    const base64Data = base64String.split(',')[1]

    const randomNumber = Math.floor(Math.random() * 1000000)
    const randomClient = `client-${randomNumber}`

    const sendJSON = {
      data: base64Data,
      name: randomClient,
      real: 1
    }

    sendMessage("mnist-image", JSON.stringify(sendJSON))
  }

  //================================//
  const saveImage = (): void => {
    if (!canvas.value) return

    sendCanvasAs28x28Grayscale()
  }

  //================================//
  watchEffect( async () => {
    // Check if there are new messages
    if (messages.value.length === 0) return

    const lastMessage = messages.value[messages.value.length - 1]
    
    if (lastMessage !== null && lastMessage.type === 'mnist-image') {
      
      const base64String = lastMessage.data
      //outputImageSource.value = `data:image/png;base64,${base64String}`
      //hasImage.value = true

      // pop the message from the array
      messages.value.pop()
    }

    else if (lastMessage !== null && lastMessage.type === 'mnist-prediction') {
      const data = lastMessage.data
      // decode data with json
      try{

        const decodedData = JSON.parse(data)
        const prediction = decodedData.prediction

        const decodedVisuals: Visual[] = decodedData.visuals
        const transformedPredictions = decodedVisuals[decodedVisuals.length - 1].data;

        const originalImage: Visual = decodedVisuals[0]
        outputImageSource.value = await saveVisualAsPNG(originalImage)
        hasImage.value = true

        if(bbCanvasRef.value?.getSceneInformation() !== undefined && bbCanvasRef.value?.getSceneInformation() !== null){
          const sceneInfo: SceneInformation = bbCanvasRef.value.getSceneInformation() as SceneInformation
          
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