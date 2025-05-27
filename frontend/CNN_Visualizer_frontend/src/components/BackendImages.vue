<template>
    <h1 class="text-center font-bold p-0 mb-1 bg-gray-200 text-black rounded rounded-bl-none rounded-br-none" v-if="images">... Or select one of the other user's images!</h1>
    <Carousel v-bind="carouselConfig" v-if="images.length > 0">
        <Slide v-for="({ image_data, prediction, real }, index) in images" :key="index">
            <div class="carousel__item h-25">
                <MnistImage
                    :imgSrc="`data:image/png;base64,${image_data}`"
                    :text="real"
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

    const { fetchAPIRoute } = useWebSocket()

    //================================//
    const images = ref<ImageData[]>([])
    const carouselConfig = ref<CarouselConfig>({
        itemsToShow: 0,
        autoplay: 0,
        wrapAround: false,
        mouseWheel: false,
        pauseAutoplayOnHover: false
    })

    //================================//
    interface ImageData {
        image_data: string
        real: number
        prediction: number
        client_name: string
    }

    //================================//
    interface CarouselConfig {
        itemsToShow: number
        autoplay: number
        wrapAround: boolean
        mouseWheel: boolean
        pauseAutoplayOnHover: boolean
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

            if (response.length === 0 || !response[0].image_data || response[0].real === undefined || response[0].prediction === undefined|| !response[0].client_name)
            {
                throw new Error('No images found in the response. There should be at least one image.')
            }

            (response as ImageData[]).forEach(({image_data}) => {
                image_data = `data:image_data/png;base64,${image_data}`;
            });

            images.value = response;
            carouselConfig.value = {
                itemsToShow: images.value.length > 10 ? 10 : images.value.length,
                autoplay: images.value.length > 10 ? 1000 : 0,
                wrapAround: images.value.length > 10,
                mouseWheel: true,
                pauseAutoplayOnHover: true
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