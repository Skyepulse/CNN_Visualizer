<template>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue'
    import { useWebSocket } from '@src/composables/useWebSocket'

    const { fetchAPIRoute } = useWebSocket()

    //================================//
    async function fetchImageData()
    {
        const response = await fetchAPIRoute('/images')
        if (response.status === 200) {
            const data = await response.json()
            console.log(data)
        } else {
            console.error('Failed to fetch image data:', response.statusText)
        }
    }

    //================================//
    onMounted(() => {
        fetchImageData()
    })
</script>