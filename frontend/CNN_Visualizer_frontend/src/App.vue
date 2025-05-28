<script setup lang="ts">
import DrawingCanvas from './components/DrawingCanvas.vue';
import WebSocketClient from './components/WebSocketClient.vue';
</script>

<template>
  <!-- div horizontal container> -->
  <DrawingCanvas></DrawingCanvas>
  <WebSocketClient></WebSocketClient>
</template>