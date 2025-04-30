<script setup lang="ts">
import DrawingCanvas from './components/DrawingCanvas.vue';
import WebSocketClient from './components/WebSocketClient.vue';

</script>

@import { DrawingCanvas } from './components/DrawingCanvas.vue'

<template>
  <!-- div horizontal container> -->
  <DrawingCanvas></DrawingCanvas>
  <WebSocketClient></WebSocketClient>
</template>