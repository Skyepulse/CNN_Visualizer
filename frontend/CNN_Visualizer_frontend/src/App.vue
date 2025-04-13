<script setup lang="ts">
import DrawingCanvas from './components/DrawingCanvas.vue';
import WebSocketClient from './components/WebSocketClient.vue';

</script>

@import { DrawingCanvas } from './components/DrawingCanvas.vue'

<template>
  <h1 class = "text-purple-400 w-full text-center font-bold text-3xl">
    Try to draw a number from 0 - 9 !
  </h1>
  <DrawingCanvas></DrawingCanvas>
  <WebSocketClient></WebSocketClient>
</template>