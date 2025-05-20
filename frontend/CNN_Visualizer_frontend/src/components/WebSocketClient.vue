<template>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue'
    import { useWebSocket } from '@src/composables/useWebSocket'

    const { connect } = useWebSocket(import.meta.env.VITE_BACKEND_URL)

    onMounted(() => {
        connect()
    })
</script>