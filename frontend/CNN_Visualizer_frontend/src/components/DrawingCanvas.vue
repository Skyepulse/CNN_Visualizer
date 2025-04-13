<template>
    <div class="flex flex-col items-center space-y-4 p-4">
        <div class="flex space-x-4">
            <canvas
            ref="canvas"
            width="500"
            height="400"
            class="border-2 border-gray-300 rounded cursor-crosshair bg-amber-50"
            @mousedown="startDrawing"
            @mouseup="stopDrawing"
            @mousemove="draw"
            @mouseleave="stopDrawing"
            >
            </canvas>
            <div
            class="relative border-2 border-gray-300 rounded w-[500px] h-[400px] flex items-center justify-center"
            >
            <img
                v-if="outputImage"
                :src="outputImageSource"
                alt="Output"
                class="w-full h-full object-contain"
            />
            <p v-else class=" text-shadow-zinc-50 font-bold">
                Your output image will be shown here
            </p>
            </div>
        </div>
        <div class="flex space-x-4">
            <button
                @click="cleanup"
                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Clear
            </button>
            <button
                @click="saveImage"
                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
                Save
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const canvas = ref<HTMLCanvasElement | null>(null)
  const isDrawing = ref<boolean>(false)
  const ctx = ref<CanvasRenderingContext2D | null>(null)

  const outputImage = ref<ImageData | null>(null)
  const outputImageSource = ref<string>('')

  const hasDrawn = ref<boolean>(false)

  onMounted(() => {
    if (!canvas.value) return

    ctx.value = canvas.value.getContext('2d')

    if (!ctx.value) return

    ctx.value.lineWidth = 10
    ctx.value.lineCap = 'round'
    ctx.value.strokeStyle = '#FFF'
    
    outputImageSource.value = new URL('../assets/number.png', import.meta.url).href
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

    drawInitialText()
  })

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

  const draw = (e: MouseEvent): void => {
    if (!isDrawing.value || !ctx.value) return

    ctx.value.lineTo(getX(e), getY(e))
    ctx.value.stroke()
  }

  const stopDrawing = (): void => {
    isDrawing.value = false
    if (!ctx.value) return

    ctx.value.closePath()
  }

  const getX = (e: MouseEvent): number => e.offsetX
  const getY = (e: MouseEvent): number => e.offsetY

  const cleanup = (): void => {
    if (!canvas.value || !ctx.value) return

    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.value.fillStyle='black'
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)

    hasDrawn.value = false
    drawInitialText()
  }

  const drawInitialText = () => {
    if (!ctx.value || !canvas.value) return

    ctx.value.font = '28px system-ui'
    ctx.value.fillStyle = 'white'
    ctx.value.textAlign = 'center'
    ctx.value.fillText('Draw here ✍️', canvas.value.width / 2, canvas.value.height / 2)
  }

  const downloadCanvasAs28x28Grayscale = () => {
    if (!canvas.value) return

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

    const link = document.createElement('a')
    link.download = 'mnist-digit.png'
    link.href = resizedCanvas.toDataURL('image/png')
    link.click()
  }


  const saveImage = (): void => {
    if (!canvas.value) return

    downloadCanvasAs28x28Grayscale()
  }
</script>