<template>
    <h1 class="text-center font-bold p-0 mb-1 bg-gray-200 text-black rounded rounded-bl-none rounded-br-none">... Or select one of the other user's images!</h1>
    <Carousel v-bind="carouselConfig">
        <Slide v-for="({ image_data, prediction, real }, index) in images" :key="index">
            <div class="carousel__item h-25">
                <MnistImage
                    :imgSrc="`data:image/png;base64,${image_data}`"
                    :text="prediction"
                    :isCorrect="prediction == real"
                />
            </div>
        </Slide>
        <template #addons>
        </template>
    </Carousel>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useWebSocket } from '@src/composables/useWebSocket'
    import MnistImage from '@src/components/MnistImage.vue'

    import 'vue3-carousel/carousel.css'
    import { Carousel, Slide} from 'vue3-carousel'

    const carouselConfig = {
        itemsToShow: 10,
        autoplay: 1000,
        wrapAround: true,
        mouseWheel: true,
        pauseAutoplayOnHover: true,
    }

    const { fetchAPIRoute } = useWebSocket()

    //================================//
    const images = ref<ImageData[] | null>(null)

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

            (response as ImageData[]).forEach(({image_data}) => {
                image_data = `data:image_data/png;base64,${image_data}`;
            });

            console.log(response[0].image_data)

            images.value = response;

        } catch (error) {
            console.error('Error parsing JSON for mnist images:', error)
        }
    }

    //================================//
    onMounted(() => {
        fetchImageData()
    })
</script>