<template>
    <canvas 
        ref="bjsCanvas" :width= width :height= height 
        class="border-2 border-gray-300 rounded m-0"
    ></canvas>
</template>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { createScene, goUp, goDown, goLeft, goRight } from '@src/scenes/MyFirstScene';
    import type { SceneInformation } from '@src/scenes/MyFirstScene';

    //================================//
    const props = defineProps<{
        height: number
        width: number
        fpsDisplay: HTMLElement | undefined
    }>()

    //================================//
    const bjsCanvas = ref<HTMLCanvasElement | null>(null);
    const sceneInfo = ref<SceneInformation | null>(null);

    //================================//
    defineExpose({
        getSceneInformation: () => sceneInfo.value
    });

    //================================//
    onMounted(async () => {
        if (bjsCanvas.value) {
            sceneInfo.value = await createScene(bjsCanvas.value, props.fpsDisplay);
            
            // On key pressed events
            window.addEventListener('keydown', function(event) {
                switch(event.key){
                    case 'z':
                        goUp(true);
                        break;
                    case 's':
                        goDown(true);
                        break;
                    case 'q':
                        goLeft(true);
                        break;
                    case 'd':
                        goRight(true);
                        break;
                }
            });

            window.addEventListener('keyup', function(event) {
                switch(event.key){
                    case 'z':
                        goUp(false);
                        break;
                    case 's':
                        goDown(false);
                        break;
                    case 'q':
                        goLeft(false);
                        break;
                    case 'd':
                        goRight(false);
                        break;
                }
            });
        }
    });
</script>