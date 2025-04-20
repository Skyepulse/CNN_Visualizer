import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    DirectionalLight,
    MeshBuilder,
    StandardMaterial,
    Color4,
    Vector4,
    Light,
    Matrix,
    Mesh,
} from '@babylonjs/core';

import type { Visual } from '@src/components/DrawingCanvas.vue';
import "@babylonjs/inspector";

//import cubeVertexShader from '@src/Shaders/cubeVertex.glsl?raw';
//import cubeFragmentShader from '@src/Shaders/cubeFragment.glsl?raw';

//================================//
export type SceneInformation = {
    scene?: Scene,
    camera?: FreeCamera,
    light?: Light,
    engine: Engine,
    inRenderLoop?: () => void,
    animationToken?: number,
};

//================================//
type AddedVisualInfo = 
{
    matrix: Float32Array,
    color: Float32Array
}

//
let numInstances = 0;

//================================//
export const createScene = async function (canvas: HTMLCanvasElement, fpsDisplay?: HTMLElement): Promise<SceneInformation> {
    const engine = new Engine(canvas, true);
    const inRenderLoop = () => {
        if (fpsDisplay) {
            const fps = engine.getFps();
            fpsDisplay.innerText = `FPS: ${fps.toFixed(2).padStart(5, '0')}`;
        }
    }

    const sceneInformation: SceneInformation = {
        engine: engine,
        inRenderLoop: inRenderLoop,
    };
    
    resetScene(sceneInformation);

    return sceneInformation;
};

//================================//
export const addVisual = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null) return;

    const height = visual.height;
    const width = visual.width;

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    // Start position top left corner of the visual
    // If the height is pair then it should be placed at y 0.0 + cubeSpace/2 + height/2 * (cubeSize + cubeSpace)
    // If the height is odd then it should be placed at y 0.0 + cubeSize/2 + (height-1)/2 * (cubeSize + cubeSpace)
    // If the width is pair then it should be placed at x 0.0 - cubeSpace/2 - width/2 * (cubeSize + cubeSpace)
    // If the width is odd then it should be placed at x 0.0 - cubeSize/2 - (width-1)/2 * (cubeSize + cubeSpace)

    const startX = width % 2 === 0 ? -cubeSpace / 2 - (width / 2) * (cubeSize + cubeSpace) : -cubeSize / 2 - ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = height % 2 === 0 ? cubeSpace / 2 + (height / 2) * (cubeSize + cubeSpace) : cubeSize / 2 + ((height - 1) / 2) * (cubeSize + cubeSpace);

    const startPosition: Vector3 = new Vector3(startX, startY, centerPosition.z);

    const baseCube = MeshBuilder.CreateBox(`baseCube_${numInstances}`, { size: cubeSize }, sceneInformation.scene);

    const matrixData = new Float32Array(data.length * 16);
    const colors = new Float32Array(data.length * 4);

    for (let i = 0; i < data.length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + cubeSpace),
            -Math.floor(i / width) * (cubeSize + cubeSpace),
            0.0
        ));

        const matrix = Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(matrixData, i * 16);

        const gray = data[i] / 255.0; // Normalize to [0, 1]
        colors.set([gray, gray, gray, 1.0], i * 4); // RGBA format
    }

    baseCube.thinInstanceSetBuffer("matrix", matrixData, 16);
    baseCube.thinInstanceSetBuffer("color", colors, 4);

    baseCube.material = new StandardMaterial(`baseCubeMaterial_${numInstances}`, sceneInformation.scene);
    numInstances++;

    return {matrix: matrixData, color: colors};
};

//================================//
export const addVisualFromInput = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, fromMatrix: Float32Array, fromColors: Float32Array, timeTravel: number, timeOffset: number, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || fromMatrix === undefined) return;

    const height = visual.height;
    const width = visual.width;

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    // Start position top left corner of the visual
    // If the height is pair then it should be placed at y 0.0 + cubeSpace/2 + height/2 * (cubeSize + cubeSpace)
    // If the height is odd then it should be placed at y 0.0 + cubeSize/2 + (height-1)/2 * (cubeSize + cubeSpace)
    // If the width is pair then it should be placed at x 0.0 - cubeSpace/2 - width/2 * (cubeSize + cubeSpace)
    // If the width is odd then it should be placed at x 0.0 - cubeSize/2 - (width-1)/2 * (cubeSize + cubeSpace)

    const startX = width % 2 === 0 ? -cubeSpace / 2 - (width / 2) * (cubeSize + cubeSpace) : -cubeSize / 2 - ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = height % 2 === 0 ? cubeSpace / 2 + (height / 2) * (cubeSize + cubeSpace) : cubeSize / 2 + ((height - 1) / 2) * (cubeSize + cubeSpace);

    const startPosition: Vector3 = new Vector3(startX + centerPosition.x, startY + centerPosition.y, centerPosition.z);

    const baseCube = MeshBuilder.CreateBox(`baseCube_${numInstances}`, { size: cubeSize }, sceneInformation.scene);

    const finalMatrixData = new Float32Array(data.length * 16);
    const finalColorsData = new Float32Array(data.length * 4);

    for (let i = 0; i < data.length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + cubeSpace),
            -Math.floor(i / width) * (cubeSize + cubeSpace),
            0.0
        ));

        const matrix = Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(finalMatrixData, i * 16);

        const gray = data[i] / 255.0; // Normalize to [0, 1]
        finalColorsData.set([gray, gray, gray, 1.0], i * 4); // RGBA format
    }

    baseCube.material = new StandardMaterial(`baseCube_${numInstances}`, sceneInformation.scene);
    baseCube.thinInstanceSetBuffer("matrix", fromMatrix, 16);
    baseCube.thinInstanceSetBuffer("color", fromColors, 4);

    numInstances++;

    const currentToken = sceneInformation.animationToken ?? 0;

    const globalStartTime = performance.now();

    const updateMatrices = () => 
    {
        if ((sceneInformation.animationToken ?? 0) !== currentToken) return;

        const now = performance.now();
        const currentMatrixData = new Float32Array(fromMatrix.length);
        const currentColorsData = new Float32Array(fromColors.length);

        let allFinished = true;

        for (let i = 0; i < data.length; i++) {
            const startTime = globalStartTime + timeOffset * i;
            const localElapsedTime = now - startTime;
            const t = Math.min(Math.max(localElapsedTime / timeTravel, 0), 1);

            if (t < 1) allFinished = false;

            const fromMat = Matrix.FromArray(fromMatrix, i * 16);
            const toMat = Matrix.FromArray(finalMatrixData, i * 16);
            const interpolated = Matrix.Lerp(fromMat, toMat, t);
            interpolated.copyToArray(currentMatrixData, i * 16);

            const fromCol = Vector4.FromArray(fromColors, i * 4);
            const toCol = Vector4.FromArray(finalColorsData, i * 4);
            const lerpedVector = lerpVector4(fromCol, toCol, t) as Vector4;
            lerpedVector.toArray(currentColorsData, i * 4);
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("color", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData};
}

//================================//
export const addVisualFromSubsampling = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, fromMatrix: Float32Array, fromColors: Float32Array, timeTravel: number, timeOffset: number, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || fromMatrix === undefined) return;

    const height = visual.height;
    const width = visual.width;

    assert( fromMatrix.length === visual.data.length * 4 * 16, "subsampling only works to divide by 2 height and width" );

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    const startX = width % 2 === 0 ? -cubeSpace / 2 - (width / 2) * (cubeSize + cubeSpace) : -cubeSize / 2 - ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = height % 2 === 0 ? cubeSpace / 2 + (height / 2) * (cubeSize + cubeSpace) : cubeSize / 2 + ((height - 1) / 2) * (cubeSize + cubeSpace);

    const startPosition: Vector3 = new Vector3(startX + centerPosition.x, startY + centerPosition.y, centerPosition.z);

    const baseCube = MeshBuilder.CreateBox(`baseCube_${numInstances}`, { size: cubeSize }, sceneInformation.scene);

    const finalMatrixData = new Float32Array(data.length * 16);
    const finalColorsData = new Float32Array(data.length * 4);

    for (let i = 0; i < data.length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + cubeSpace),
            -Math.floor(i / width) * (cubeSize + cubeSpace),
            0.0
        ));
        
        const matrix = Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(finalMatrixData, i * 16);

        const gray = data[i] / 255.0; // Normalize to [0, 1]
        finalColorsData.set([gray, gray, gray, 1.0], i * 4); // RGBA format
    }
    
    baseCube.material = new StandardMaterial(`baseCube_${numInstances}`, sceneInformation.scene);
    baseCube.thinInstanceSetBuffer("matrix", fromMatrix, 16);
    baseCube.thinInstanceSetBuffer("color", fromColors, 4);

    numInstances++;

    const currentToken = sceneInformation.animationToken ?? 0;

    const globalStartTime = performance.now();

    const updateMatrices = () =>
    {
        if ((sceneInformation.animationToken ?? 0) !== currentToken) return;

        const now = performance.now();
        const currentMatrixData = new Float32Array(fromMatrix.length);
        const currentColorsData = new Float32Array(fromColors.length);

        let allFinished = true;

        for (let i = 0; i < data.length; i++) {
            const startTime = globalStartTime + timeOffset * i;
            const localElapsedTime = now - startTime;
            const t = Math.min(Math.max(localElapsedTime / timeTravel, 0), 1);

            const subsamplingIndexes = getSubsamplingIndexes(i, width * 2);

            if (t < 1) allFinished = false;

            for (let j = 0; j < subsamplingIndexes.length; j++)
            {
                const subsamplingIndex = subsamplingIndexes[j];

                const fromMat = Matrix.FromArray(fromMatrix, subsamplingIndex * 16);
                const toMat = Matrix.FromArray(finalMatrixData, i * 16);
                const interpolated = Matrix.Lerp(fromMat, toMat, t);
                interpolated.copyToArray(currentMatrixData, subsamplingIndex * 16);

                const fromCol = Vector4.FromArray(fromColors, subsamplingIndex * 4);
                const toCol = Vector4.FromArray(finalColorsData, i * 4);
                const lerpedVector = lerpVector4(fromCol, toCol, t) as Vector4;
                lerpedVector.toArray(currentColorsData, subsamplingIndex * 4);
            }
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("color", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        } else {
            baseCube.thinInstanceSetBuffer("matrix", finalMatrixData, 16);
            baseCube.thinInstanceSetBuffer("color", finalColorsData, 4);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData};
}

//================================//
export const addVisualFromConvolution = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, lastVisualInfos: AddedVisualInfo[], timeTravel: number, timeOffset: number, space: number = 0.1, kernelSize: number = 5, stride: number = 1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || lastVisualInfos === undefined) return;

    const numInputs = lastVisualInfos.length;
    
    // Flatten all input matrices into one huge array
    const fromWholeMatrix = new Float32Array(numInputs * lastVisualInfos[0].matrix.length);
    const fromWholeColors = new Float32Array(numInputs * lastVisualInfos[0].color.length);

    for (let i = 0; i < numInputs; i++) {
        const fromMatrix = lastVisualInfos[i].matrix;
        const fromColors = lastVisualInfos[i].color;
        fromWholeMatrix.set(fromMatrix, i * fromMatrix.length);
        fromWholeColors.set(fromColors, i * fromColors.length);
    }

    const height = visual.height;
    const width = visual.width;

    const inWidth = Math.sqrt(lastVisualInfos[0].matrix.length / 16);

    assert(Number.isInteger(inWidth), "Input matrix must be square");

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    const startX = width % 2 === 0 ? -cubeSpace / 2 - (width / 2) * (cubeSize + cubeSpace) : -cubeSize / 2 - ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = height % 2 === 0 ? cubeSpace / 2 + (height / 2) * (cubeSize + cubeSpace) : cubeSize / 2 + ((height - 1) / 2) * (cubeSize + cubeSpace);

    const startPosition: Vector3 = new Vector3(startX + centerPosition.x, startY + centerPosition.y, centerPosition.z);

    const baseCube = MeshBuilder.CreateBox(`baseCube_${numInstances}`, { size: cubeSize }, sceneInformation.scene);

    const finalMatrixData = new Float32Array(data.length * 16);
    const finalColorsData = new Float32Array(data.length * 4);

    for (let i = 0; i < data.length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + cubeSpace),
            -Math.floor(i / width) * (cubeSize + cubeSpace),
            0.0
        ));

        const matrix = Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(finalMatrixData, i * 16);

        const gray = data[i] / 255.0; // Normalize to [0, 1]
        finalColorsData.set([gray, gray, gray, 1.0], i * 4); // RGBA format
    }

    const translationOffset = new Vector3(0, 0, -10);

    for (let i = 0; i < 14*14*6; i++) {
        const matrix = Matrix.FromArray(fromWholeMatrix, i * 16);
        const currentPos = matrix.getTranslation();
        const newPos = currentPos.add(translationOffset);
        const translatedMatrix = Matrix.Translation(newPos.x, newPos.y, newPos.z);
        translatedMatrix.copyToArray(fromWholeMatrix, i * 16);
    }

    baseCube.material = new StandardMaterial(`baseCubeMaterial_${numInstances}`, sceneInformation.scene);
    baseCube.thinInstanceSetBuffer("matrix", fromWholeMatrix, 16);
    baseCube.thinInstanceSetBuffer("color", fromWholeColors, 4);

    numInstances++;

    /*
    const currentToken = sceneInformation.animationToken ?? 0;
    const globalStartTime = performance.now();

    
    const updateMatrices = () =>
    {
        if ((sceneInformation.animationToken ?? 0) !== currentToken) return;

        const now = performance.now();
        const currentMatrixData = new Float32Array(fromWholeMatrix.length);
        const currentColorsData = new Float32Array(fromWholeColors.length);

        let allFinished = true;

        for (let i = 0; i < data.length; i++) {
            const startTime = globalStartTime + timeOffset * i;
            const localElapsedTime = now - startTime;
            const t = Math.min(Math.max(localElapsedTime / timeTravel, 0), 1);

            const kernelIndexesBefore = getKernelIndexes(i, inWidth, numInputs, visual.width, kernelSize, stride);
            // first 25 values
            const kernelIndexes = kernelIndexesBefore.slice(0, 4);
            if (t < 1) allFinished = false;

            for (let j = 0; j < kernelIndexes.length; j++)
            {
                const kernelIndex = kernelIndexes[j];

                const fromMat = Matrix.FromArray(fromWholeMatrix, kernelIndex * 16);
                const toMat = Matrix.FromArray(finalMatrixData, i * 16);
                const interpolated = Matrix.Lerp(fromMat, toMat, t);
                interpolated.copyToArray(currentMatrixData, kernelIndex * 16);

                const fromCol = Vector4.FromArray(fromWholeColors, kernelIndex * 4);
                const toCol = Vector4.FromArray(finalColorsData, i * 4);
                const lerpedVector = lerpVector4(fromCol, toCol, t) as Vector4;
                lerpedVector.toArray(currentColorsData, kernelIndex * 4);
            }
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("color", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        } else {
            baseCube.thinInstanceSetBuffer("matrix", finalMatrixData, 16);
            baseCube.thinInstanceSetBuffer("color", finalColorsData, 4);
        }
    };

    requestAnimationFrame(updateMatrices);
    */

    return {matrix: finalMatrixData, color: finalColorsData};
}

//================================//
const getSubsamplingIndexes = function(subsampledIndex: number, width: number): number[] {
    const subsampledWidth = width / 2;

    const subsampledRow = Math.floor(subsampledIndex / subsampledWidth);
    const subsampledCol = subsampledIndex % subsampledWidth;

    const topLeft = (subsampledRow * 2) * width + (subsampledCol * 2);
    const topRight = topLeft + 1;
    const bottomLeft = topLeft + width;
    const bottomRight = bottomLeft + 1;

    return [topLeft, topRight, bottomLeft, bottomRight];
};

//================================//
const getKernelIndexes = function(kernelIndex: number, inWidth: number, inInputs: number, outWidth: number, kernelSize: number = 5, stride: number = 1): number[]
{
    const indexes: number[] = [];

    // Compute where the top-left of the kernel should be placed
    const outRow = Math.floor(kernelIndex / outWidth);
    const outCol = kernelIndex % outWidth;

    const startY = outRow * stride;
    const startX = outCol * stride;

    for (let c = 0; c < inInputs; c++) {
        for (let dy = 0; dy < kernelSize; dy++) {
            const y = startY + dy;
            if (y >= inWidth) continue;

            for (let dx = 0; dx < kernelSize; dx++) {
                const x = startX + dx;
                if (x >= inWidth) continue;

                const flatIndex = c * inWidth * inWidth + y * inWidth + x;
                indexes.push(flatIndex);
            }
        }
    }

    return indexes;
};

//================================//
export const launchMnistAnimation = async function(sceneInformation: SceneInformation, visuals: Visual[]): Promise<void> 
{
    if (sceneInformation === null) return;
    if (!sceneInformation.engine) return;
    if (!sceneInformation.scene) return;
    if (!sceneInformation.camera) return;
    if (!sceneInformation.light) return;
    if (!sceneInformation.inRenderLoop) return;

    // reset scene
    await resetScene(sceneInformation);
    
    const tokenAtStart = sceneInformation.animationToken ?? 0;

    const isTokenInvalid = () => sceneInformation.animationToken !== tokenAtStart;

    const safeAwait = async (promise: Promise<any>) => {
        const result = await promise;
        if (isTokenInvalid()) throw new Error("Reset scene called during animation.");
        return result;
    };

    // [1] INPUT IMAGE
    const inputImageInfo = await safeAwait(addVisual(sceneInformation, visuals[0], new Vector3(0, 0, 0), 0.2)) as AddedVisualInfo;
    setCameraPosition(sceneInformation, new Vector3(-10, 5, -14));
    setCameraLookAt(sceneInformation, new Vector3(0, 0, 0));
    await safeAwait(wait(100));
    
    await safeAwait(rotateAroundCircle(sceneInformation, sceneInformation.camera.target.clone(), sceneInformation.camera.position.clone(), Math.PI * 2, 2000));
    await safeAwait(wait(500));
    await safeAwait(setTimedCameraPosition(sceneInformation, new Vector3(-10, 5, -25), 1000));

    //[2] CONV LAYER 1
    await safeAwait(setTimedCameraLookAt(sceneInformation, new Vector3(0, 0, -7), 1000));
    const convLayer1Infos: AddedVisualInfo[] = new Array(6);
    for(let i = 0; i < 6; i++)
    {
        convLayer1Infos[i] = await safeAwait(addVisualFromInput(sceneInformation, visuals[1 + i], new Vector3(0, 0, -7 - i * 0.5), inputImageInfo.matrix, inputImageInfo.color, 100, 1, 0.05));
        await safeAwait(wait(1000))
    }
    await safeAwait(wait(500));

    await safeAwait(setTimedCameraPosition(sceneInformation, new Vector3(-10, 5, -30), 1000));
    await safeAwait(setTimedCameraLookAt(sceneInformation, new Vector3(0, 0, -15), 1000));

    //[3] pooling layer 1
    const poolLayer1Infos: AddedVisualInfo[] = new Array(6);
    for(let i = 0; i < 6; i++)
    {
        poolLayer1Infos[i] = await safeAwait(addVisualFromSubsampling(sceneInformation, visuals[7 + i], new Vector3(-10 + 3.7 * i, 0, -15), convLayer1Infos[i].matrix, convLayer1Infos[i].color, 100, 1, 0.05));
        await safeAwait(wait(500))
    }
    await safeAwait(wait(500));

    await safeAwait(setTimedCameraPosition(sceneInformation, new Vector3(-10, 5, -45), 1000));
    //await safeAwait(setTimedCameraLookAt(sceneInformation, new Vector3(0, 0, -23), 1000));

    //[4] CONV LAYER 2
    const convLayer2Infos: AddedVisualInfo[] = new Array(16);
    for(let i = 0; i < 1; i++)
    {
        convLayer2Infos[i] = await safeAwait(addVisualFromConvolution(sceneInformation, visuals[13 + i], new Vector3(0, 0, -23 - i * 0.5), poolLayer1Infos, 10000, 2000, 0.05, 5, 1));
        await safeAwait(wait(1000))
    }
};

//================================//
export const resetScene = async function(sceneInformation: SceneInformation): Promise<void>
{
    if (sceneInformation === null) return;
    if (!sceneInformation.engine || !sceneInformation.inRenderLoop) return;

    if(sceneInformation.scene) sceneInformation.scene.dispose();
    if(sceneInformation.camera) sceneInformation.camera.dispose();
    if(sceneInformation.light) sceneInformation.light.dispose();

    sceneInformation.animationToken = (sceneInformation.animationToken ?? 0) + 1;

    sceneInformation.scene = new Scene(sceneInformation.engine);
    sceneInformation.camera = new FreeCamera("camera1", new Vector3(0, 0, -10), sceneInformation.scene);
    sceneInformation.camera.setTarget(Vector3.Zero());

    // Allow moving the camera
    sceneInformation.camera.attachControl(sceneInformation.engine.getRenderingCanvas(), true);
    sceneInformation.camera.speed = 0.5; // Adjust the speed as needed

    const newLight = new DirectionalLight("light1", new Vector3(0, 0, 1), sceneInformation.scene);
    newLight.intensity = 0.5;
    newLight.position = new Vector3(0, 0, -10);

    sceneInformation.light = newLight;

    sceneInformation.scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0); // Dark gray

    sceneInformation.engine.runRenderLoop(() => 
    {
        sceneInformation.scene?.render();
        sceneInformation.inRenderLoop?.();
    });

    sceneInformation.scene?.debugLayer.show();
}

//================================//
export const rotateAroundCircle = async function(sceneInformation: SceneInformation, center: Vector3, start: Vector3, angle: number, time: number): Promise<void>
{
    if (sceneInformation === null || !sceneInformation.camera) return;

    const camera = sceneInformation.camera;

    const radius = Math.sqrt(Math.pow(start.x - center.x, 2) + Math.pow(start.z - center.z, 2));
    const startAngle = Math.atan2(start.z - center.z, start.x - center.x);
    const y = start.y;

    const currentToken = (sceneInformation.animationToken ?? 0);

    return new Promise((resolve) => {
        const startTime = performance.now();
        const animation = () => {

            if (sceneInformation.animationToken !== currentToken) return resolve();

            const now = performance.now();
            const elapsed = now - startTime;

            const t = Math.min(elapsed / time, 1);

            const currentAngle = startAngle + t * angle;
            const x = center.x + radius * Math.cos(currentAngle);
            const z = center.z + radius * Math.sin(currentAngle);

            camera.position = new Vector3(x, y, z);
            camera.setTarget(center);

            if (t < 1) {
                requestAnimationFrame(animation);
            } else {
                resolve();
            }
        };
        requestAnimationFrame(animation);
    });
}

//================================//
export const setTimedCameraPosition = async function(sceneInformation: SceneInformation, end: Vector3, time: number): Promise<void> {
    if (sceneInformation === null || !sceneInformation.camera) return;

    const camera = sceneInformation.camera;

    const currentToken = (sceneInformation.animationToken ?? 0);
    const initialPosition = camera.position.clone();

    return new Promise((resolve) => {
        const startTime = performance.now();
        const animation = () => {
            if (sceneInformation.animationToken !== currentToken) return resolve();

            const now = performance.now();
            const elapsed = now - startTime;
            const t = Math.min(elapsed / time, 1);

            const newPos = Vector3.Lerp(initialPosition, end, t);

            camera.position = newPos;

            if (t < 1) {
                requestAnimationFrame(animation);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(animation);
    });
};


//================================//
export const wait = async function(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//================================//
export const setCameraPosition = function(sceneInformation: SceneInformation, position: Vector3): void
{
    if (sceneInformation === null || !sceneInformation.camera) return;

    sceneInformation.camera.position = position;
}

//================================//
export const setCameraLookAt = function(sceneInformation: SceneInformation, target: Vector3): void
{
    if (sceneInformation === null || !sceneInformation.camera) return;

    sceneInformation.camera.setTarget(target);
}

//================================//
export const setTimedCameraLookAt = async function(sceneInformation: SceneInformation, target: Vector3, time: number): Promise<void>
{
    if (sceneInformation === null || !sceneInformation.camera) return;

    const camera = sceneInformation.camera;
    const currentToken = (sceneInformation.animationToken ?? 0);
    const initialTarget = camera.getTarget().clone();

    return new Promise((resolve) => {
        const startTime = performance.now();
        const animation = () => {
            if (sceneInformation.animationToken !== currentToken) return resolve();

            const now = performance.now();
            const elapsed = now - startTime;
            const t = Math.min(elapsed / time, 1);

            const newTarget = Vector3.Lerp(initialTarget, target, t);

            camera.setTarget(newTarget);

            if (t < 1) {
                requestAnimationFrame(animation);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(animation);
    });
}

//================================//
function lerpVector4(from: Vector4, to: Vector4, t: number): Vector4 {
    return new Vector4(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
        from.z + (to.z - from.z) * t,
        from.w + (to.w - from.w) * t
    );
}

//================================//
function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg || "Assertion failed");
    }
}