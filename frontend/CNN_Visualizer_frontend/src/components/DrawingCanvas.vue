<template>
    <div class="flex flex-col items-center space-y-4 p-4">
        <canvas
        ref="canvas"
        width="500"
        height="400"
        class="border-2 border-gray-300 rounded cursor-crosshair"
        @mousedown="startDrawing"
        @mouseup="stopDrawing"
        @mousemove="draw"
        @mouseleave="stopDrawing"
        ></canvas>
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

  onMounted(() => {
    if (!canvas.value) return

    ctx.value = canvas.value.getContext('2d')

    if (!ctx.value) return

    ctx.value.lineWidth = 2
    ctx.value.lineCap = 'round'
    ctx.value.strokeStyle = '#000'
  })

  const startDrawing = (e: MouseEvent): void => {
    isDrawing.value = true
    if (!ctx.value) return

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
  }

  const saveImage = (): void => {
    if (!canvas.value) return

    const link = document.createElement('a')
    link.download = 'drawing.png'
    link.href = canvas.value.toDataURL('image/png')
    link.click()
  }
</script>