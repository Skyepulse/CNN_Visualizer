<template>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue'
    import { useWebSocket } from '@src/composables/useWebSocket'

    const { connect } = useWebSocket('ws://localhost:5000/ws')

    onMounted(() => {
        connect()
    })
</script>