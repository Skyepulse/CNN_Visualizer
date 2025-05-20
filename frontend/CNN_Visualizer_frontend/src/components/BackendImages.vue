<template>
    <div class ="flex flex-row items-center justify-center" ref="imageContainer">

    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useWebSocket } from '@src/composables/useWebSocket'

    const { fetchAPIRoute } = useWebSocket()

    //================================//
    const imageContainer = ref<HTMLDivElement | null>(null)

    //================================//
    interface ImageData {
        image_data: string
        real: number
        prediction: number
        client_name: string
    }

    //================================//
    async function fetchImageData()
    {
        try {
            const response = await fetchAPIRoute('images')
            
            // Check if the object contains a 'message' property
            if (response && response.message)
            {
                console.log('Received message:', response.message)
                return
            }

            if (response.length === 0 || !response[0].image_data || !response[0].real || !response[0].prediction || !response[0].client_name)
            {
                throw new Error('No images found in the response. There should be at least one image.')
            }

            if (imageContainer.value)
            {
                // Clear the container before appending new images
                imageContainer.value.innerHTML = '';

                // Create an image element for each image in the response
                (response as ImageData[]).forEach(({image_data}) => {
                    const img = document.createElement('img')
                    img.src = `data:image_data/png;base64,${image_data}`
                    img.alt = 'MNIST Image'
                    img.className = 'm-2' // Add some margin for spacing
                    imageContainer.value?.appendChild(img)
                })
            }
        } catch (error) {
            console.error('Error parsing JSON for mnist images:', error)
        }
    }

    //================================//
    onMounted(() => {
        fetchImageData()
    })
</script>