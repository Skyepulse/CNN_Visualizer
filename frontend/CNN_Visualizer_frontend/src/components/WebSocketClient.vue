<template>
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