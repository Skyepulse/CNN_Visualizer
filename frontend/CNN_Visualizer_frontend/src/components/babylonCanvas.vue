<template>
    <canvas 
        ref="bjsCanvas" :width= width :height= height 
        class="border-2 border-gray-300 rounded bg-amber-50"
    ></canvas>
</template>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { createScene } from '@src/scenes/MyFirstScene';
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
        }
    });
</script>