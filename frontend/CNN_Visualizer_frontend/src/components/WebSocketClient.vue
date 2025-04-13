<template>
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">WebSocket Chat</h1>
      <ul>
        <li v-for="(msg, index) in messages" :key="index">{{ msg }}</li>
      </ul>
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref } from 'vue'

    const messages = ref<string[]>([])
    let socket: WebSocket

    onMounted(() => {
        socket = new WebSocket('ws://localhost:8000/ws')

        socket.onmessage = (event) => {
            messages.value.push(event.data)
        }

        socket.onopen = () => {
            socket.send("Hello from frontend")
        }
    })
</script>