<template>
  <div class="flex flex-col items-center justify-center h-full bg-amber-950">
    <div class="relative h-[80%] aspect-square">
      <img
        :src="imgSrc"
        alt="mnist_image"
        class="hover:scale-120 absolute top-0 left-0 w-full h-full object-contain rounded rounded-bl-none rounded-br-none transition-transform duration-300 ease-in-out group-hover:scale-110"
        @click="sendImageData(imgSrc)"
      />
    </div>
    <p
      class="text-center w-full h-5 bg-white rounded rounded-tl-none rounded-tr-none"
      :class="isCorrect ? 'text-green-600' : 'text-red-600'"
    >
      {{ text }}
    </p>
  </div>
</template>



<script setup lang="ts">
  import { sendImageData } from '@src/composables/auxiliaries';

  //================================//
  defineProps<{
      imgSrc: string
      text: number
      isCorrect: boolean
  }>()
    
</script>