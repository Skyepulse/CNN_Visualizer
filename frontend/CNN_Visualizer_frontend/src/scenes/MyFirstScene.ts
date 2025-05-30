import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    DirectionalLight,
    MeshBuilder,
    Color4,
    Vector4,
    Light,
    Matrix,
    Mesh,
    Color3,
    type int,
    ShaderMaterial,
    StandardMaterial,
    type float,
} from '@babylonjs/core';

import {Control, AdvancedDynamicTexture, TextBlock, } from '@babylonjs/gui';
import type { Visual } from '@src/components/DrawingCanvas.vue';
import { createUnlitMaterial } from "@src/scenes/Materials";

//Earcut for MeshBuilder
import earcut from 'earcut';

//================================//
export type CameraMovements = {
    goLeft: boolean,
    goRight: boolean,
    goFront: boolean,
    goBack: boolean,
}

//================================//
const CAMERA_MOVEMENTS = { goLeft: false, goRight: false, goFront: false, goBack: false};
const STEP_POSITIONS = {previous: false, next: false}
let step_lock = false;
let TEXT_SIZE = 20;
let fontData: any = null;

//================================//
const ANIMATION_PLACEMENTS = [
    new Vector3(-10, 5, -14),
    new Vector3(-10, 5, -25),
    new Vector3(-15, 5, -30),
    new Vector3(-10, 5, -40),
    new Vector3(-10, 5, -49),
    new Vector3(-13, 5, -60),
    new Vector3(-15, 15, -62),
    new Vector3(0, 5, -64)
]

//================================//
const ANIMATION_LOOKATS = [
    new Vector3(0, 0, 0),
    new Vector3(0, 0, -7),
    new Vector3(0, 0, -15),
    new Vector3(0, 0, -25),
    new Vector3(0, 0, -42),
    new Vector3(0, 0, -42),
    new Vector3(0, 0, -44),
    new Vector3(0, 0, -56),
]

//================================//
/*
const ANIMATION_CUBES = [   // From -> To
    [1, 2],
    [2, 8],
    [8, 14],
    [14, 30],
    [30, 46],
    [46, 47],
    [47, 49],
    [49, 50]
]
*/

//================================//
const ANIMATION_STEPS = [
    {text: 'The initial 28x28 grayscale image sent to the model. This enters the model for inference.', pose: 0},
    {text: 'The first convolutional layer with 6 filters of size 28x28. They can be interpreted as different feature detectors looking for patterns like edges, corners or curves. Can you recognize some?', pose: 1},
    {text: 'The first pooling layer that reduces the size of each feature map by 2x, making the model more resistant to small variations in input. We now have 6 14x14 features.', pose: 2},
    {text: 'The second convolutional layer with 16 filters combines the previous features to detect more complex patterns. We have 16 10x10 features.', pose: 3},
    {text: 'The second pooling layer further reduces the size while preserving important features. We now have 16 5X5 features', pose: 4}, 
    {text: 'We flatten the 16 5X5 features to prepare for the fully connected layers. In these layers, every single entry pixels has a saying in the each output pixel. That makes 48,000 weights for this layer alone!', pose: 5},
    {text: 'Hidden layers with respectively 120 and 84 neurons continues to process the information.', pose: 6},
    {text: 'Final output layer with 10 neurons - one for each digit (0-9). The brightest neuron indicates the predicted digit. You may recognize that the model associates the features in your drawing to other numbers to some extent, which are they?', pose: 7}
]

//================================//
const ANIMATION_TEXT_PLACEMENTS = [
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_CENTER, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_LEFT, left: "0%", top: "0%", width: "25%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_TOP, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_LEFT, left: "0%", top: "0%", width: "25%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_TOP, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_RIGHT, left: "0%", top: "0%", width: "40%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_TOP, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_RIGHT, left: "0%", top: "0%", width: "45%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_TOP, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_CENTER, left: "0%", top: "0%", width: "50%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_TOP, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_RIGHT, left: "0%", top: "0%", width: "60%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_CENTER, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_LEFT, left: "0%", top: "0%", width: "25%", height: "auto"},
    {vertical_alignment: Control.VERTICAL_ALIGNMENT_BOTTOM, horizontal_alignment: Control.HORIZONTAL_ALIGNMENT_CENTER, left: "0%", top: "0%", width: "98%", height: "auto"},
]

//================================//
export type SceneInformation = {
    scene?: Scene,
    camera?: FreeCamera,
    light?: Light,
    engine: Engine,
    inRenderLoop?: () => void,
    animationToken?: number,
    cubeInstances?: Mesh[],
    wholeRenderCube?: Mesh,
    wholeMatrix?: Float32Array,
    wholeColors?: Float32Array,
    fullScreenGUI?: AdvancedDynamicTexture,
    stepTexts?: TextBlock[],
    predictionMeshes?: Mesh[],
    IntroText: TextBlock,
    currentStep: int
};

//================================//
type AddedVisualInfo = 
{
    matrix: Float32Array,
    color: Float32Array,
    cube: Mesh
}

//
let numInstances = 0;

//================================//
export const createScene = async function (canvas: HTMLCanvasElement, fpsDisplay?: HTMLElement): Promise<SceneInformation> {
    const engine = new Engine(canvas, true);
    engine.adaptToDeviceRatio = true;

    TEXT_SIZE = Math.round(canvas.height * 0.05);
    const inRenderLoop = () => {
        if (fpsDisplay) {
            const fps = engine.getFps();
            fpsDisplay.innerText = `FPS: ${fps.toFixed(2).padStart(5, '0')}`;
        }
    }

    fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();

    const IntroText = new TextBlock("IntroText");
    IntroText.text = `This is an animated visualizer of the inner workings of a CNN model for MNIST digit recognition. \n\n Draw a number and press Send to see all steps in the model's Inference process and the final prediction! \n\n If you also input the real number you tried to draw, your image will be saved for other users to test too!`;
    IntroText.color = "white";
    IntroText.textWrapping = true;
    IntroText.resizeToFit = true;
    IntroText.width = "80%";
    IntroText.height = "auto";
    IntroText.fontSize = TEXT_SIZE;
    IntroText.lineSpacing = 0;
    IntroText.fontFamily = fontData.family;

    const sceneInformation: SceneInformation = {
        engine: engine,
        inRenderLoop: inRenderLoop,
        IntroText: IntroText,
        currentStep: 0,
        cubeInstances: [],
        stepTexts: [],
        predictionMeshes: [],
    };
    
    resetScene(sceneInformation);

    return sceneInformation;
};

//================================//
export const addVisual = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || sceneInformation.scene === undefined) return;

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

    const startX = -1 * ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = ((height - 1) / 2) * (cubeSize + cubeSpace);

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
    baseCube.thinInstanceSetBuffer("customColor", colors, 4);

    const material = createUnlitMaterial(sceneInformation.scene) as ShaderMaterial;

    baseCube.material = material;
    numInstances++;

    return {matrix: matrixData, color: colors, cube: baseCube};
};

//================================//
export const addVisualFromInput = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, lastVisualInfos: AddedVisualInfo[], timeTravel: number, timeOffset: number, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || sceneInformation.scene === undefined || lastVisualInfos === undefined) return;

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

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    // Start position top left corner of the visual
    // If the height is pair then it should be placed at y 0.0 + cubeSpace/2 + height/2 * (cubeSize + cubeSpace)
    // If the height is odd then it should be placed at y 0.0 + cubeSize/2 + (height-1)/2 * (cubeSize + cubeSpace)
    // If the width is pair then it should be placed at x 0.0 - cubeSpace/2 - width/2 * (cubeSize + cubeSpace)
    // If the width is odd then it should be placed at x 0.0 - cubeSize/2 - (width-1)/2 * (cubeSize + cubeSpace)

    const startX = -((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = ((height - 1) / 2) * (cubeSize + cubeSpace);

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

    const material = createUnlitMaterial(sceneInformation.scene) as ShaderMaterial;

    baseCube.material = material;
    baseCube.thinInstanceSetBuffer("matrix", fromWholeMatrix, 16);
    baseCube.thinInstanceSetBuffer("customColor", fromWholeColors, 4);

    numInstances++;

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

            if (t < 1) allFinished = false;

            const fromMat = Matrix.FromArray(fromWholeMatrix, i * 16);
            const toMat = Matrix.FromArray(finalMatrixData, i * 16);
            const interpolated = Matrix.Lerp(fromMat, toMat, t);
            interpolated.copyToArray(currentMatrixData, i * 16);

            const fromCol = Vector4.FromArray(fromWholeColors, i * 4);
            const toCol = Vector4.FromArray(finalColorsData, i * 4);
            const lerpedVector = lerpVector4(fromCol, toCol, t) as Vector4;
            lerpedVector.toArray(currentColorsData, i * 4);
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("customColor", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData, cube: baseCube};
}

//================================//
export const addVisualFromSubsampling = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, fromMatrix: Float32Array, fromColors: Float32Array, timeTravel: number, timeOffset: number, space: number = 0.1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || sceneInformation.scene === undefined || fromMatrix === undefined) return;

    const height = visual.height;
    const width = visual.width;

    assert( fromMatrix.length === visual.data.length * 4 * 16, "subsampling only works to divide by 2 height and width" );

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = space; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    const startX = -1 * ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = ((height - 1) / 2) * (cubeSize + cubeSpace);

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
    
    const material = createUnlitMaterial(sceneInformation.scene) as ShaderMaterial;

    baseCube.material = material;
    baseCube.thinInstanceSetBuffer("matrix", fromMatrix, 16);
    baseCube.thinInstanceSetBuffer("customColor", fromColors, 4);

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
        baseCube.thinInstanceSetBuffer("customColor", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        } else {
            baseCube.thinInstanceSetBuffer("matrix", finalMatrixData, 16);
            baseCube.thinInstanceSetBuffer("customColor", finalColorsData, 4);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData, cube: baseCube};
}

//================================//
// To optimize here the time offset is also the travel time for the animation
export const addVisualFromConvolution = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, lastVisualInfos: AddedVisualInfo[], timeTravel: number, space: number = 0.1, kernelSize: number = 5, stride: number = 1): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || sceneInformation.scene === undefined || lastVisualInfos === undefined) return;

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

    const startX = -1 * ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = ((height - 1) / 2) * (cubeSize + cubeSpace);

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

    const currentToken = sceneInformation.animationToken ?? 0;
    const globalStartTime = performance.now();

    const material = createUnlitMaterial(sceneInformation.scene) as ShaderMaterial;

    baseCube.material = material;
    baseCube.thinInstanceSetBuffer("matrix", fromWholeMatrix, 16);
    baseCube.thinInstanceSetBuffer("customColor", fromWholeColors, 4);

    numInstances++;

    const updateMatrices = () => {
        if ((sceneInformation.animationToken ?? 0) !== currentToken) return;

        const now = performance.now();
        const currentMatrixData = new Float32Array(fromWholeMatrix.length);
        const currentColorsData = new Float32Array(fromWholeColors.length);

        let allFinished = true;

        for (let i = 0; i < data.length; i++) {
            const startTime = globalStartTime + timeTravel * i;
            const localElapsedTime = now - startTime;

            const t = Math.min(Math.max(localElapsedTime / timeTravel, 0), 1);

            const kernelIndexes = getKernelIndexes(i, inWidth, numInputs, width, kernelSize, stride);

            if (t < 1) allFinished = false;

            if (now  < startTime) continue; // Skip if the animation is not started yet

            for (let j = 0; j < kernelIndexes.length; j++) {
                const kernelIndex = kernelIndexes[j];

                const fromMat = Matrix.FromArray(fromWholeMatrix, kernelIndex * 16);
                const toMat = Matrix.FromArray(finalMatrixData, i * 16);
                const interpolated = Matrix.Lerp(fromMat, toMat, t);
                interpolated.copyToArray(currentMatrixData, kernelIndex * 16);

                const fromCol = Vector4.FromArray(fromWholeColors, kernelIndex * 4);
                const toCol = Vector4.FromArray(finalColorsData, i * 4);
                const interpolatedColor = lerpVector4(fromCol, toCol, t) as Vector4;
                interpolatedColor.toArray(currentColorsData, kernelIndex * 4);
            }
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("customColor", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        } else {
            baseCube.thinInstanceSetBuffer("matrix", finalMatrixData, 16);
            baseCube.thinInstanceSetBuffer("customColor", finalColorsData, 4);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData, cube: baseCube};
}

//================================//
export const addVisualFromFullConnectedLayer = async function(sceneInformation: SceneInformation, visual: Visual, centerPosition: Vector3, lastVisualInfos: AddedVisualInfo[], timeTravel: number, space: number = 0.1, rows: number = 2): Promise<AddedVisualInfo | undefined>
{
    if (sceneInformation === null || sceneInformation.scene === undefined || lastVisualInfos === undefined) return;

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

    const data = visual.data;
    const length = data.length;
    const cubeSize = 0.2;

    if (rows <= 0) rows = 1;

    const cols = Math.ceil(length / rows);
    const startx = -((cols - 1) / 2) * (cubeSize + space);
    const starty = ((rows - 1) / 2) * (cubeSize + space);

    const width = Math.ceil(length / rows);
    const startPosition: Vector3 = new Vector3(startx + centerPosition.x, starty + centerPosition.y, centerPosition.z);
    const baseCube = MeshBuilder.CreateBox(`baseCube_${numInstances}`, { size: cubeSize }, sceneInformation.scene);

    const finalMatrixData = new Float32Array(length * 16);
    const finalColorsData = new Float32Array(length * 4);

    for (let i = 0; i < length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + space),
            -Math.floor(i / width) * (cubeSize + space),
            0.0
        ));

        const matrix = Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(finalMatrixData, i * 16);

        const gray = data[i] / 255.0; // Normalize to [0, 1]
        finalColorsData.set([gray, gray, gray, 1.0], i * 4); // RGBA format
    }

    const currentToken = sceneInformation.animationToken ?? 0;
    const globalStartTime = performance.now();

    const material = createUnlitMaterial(sceneInformation.scene) as ShaderMaterial;

    baseCube.material = material;
    baseCube.thinInstanceSetBuffer("matrix", fromWholeMatrix, 16);
    baseCube.thinInstanceSetBuffer("customColor", fromWholeColors, 4);

    numInstances++;

    const updateMatrices = () => {
        if ((sceneInformation.animationToken ?? 0) !== currentToken) return;

        const now = performance.now();
        const currentMatrixData = new Float32Array(fromWholeMatrix.length + length * 16);
        const currentColorsData = new Float32Array(fromWholeColors.length + length * 4);

        let allFinished = true;

        for (let i = 0; i < length; i++) {
            const startTime = globalStartTime + timeTravel * i;
            const localElapsedTime = now - startTime;

            const t = Math.min(Math.max(localElapsedTime / timeTravel, 0), 1);

            if (t < 1) allFinished = false;

            if (now  < startTime) continue; // Skip if the animation is not started yet

            // All fromWholeMatrix cubes are used to compute each out position,
            // we therefore animate all of them at the same time.
            // In the end we will add the final position of the out cube static
            for (let j = 0; j < fromWholeMatrix.length / 16; j++)
            {
                const fromMat = Matrix.FromArray(fromWholeMatrix, j * 16);
                const toMat = Matrix.FromArray(finalMatrixData, i * 16);
                const interpolated = Matrix.Lerp(fromMat, toMat, t);
                interpolated.copyToArray(currentMatrixData, j * 16);

                const fromCol = Vector4.FromArray(fromWholeColors, j * 4);
                const toCol = Vector4.FromArray(finalColorsData, i * 4);
                const interpolatedColor = lerpVector4(fromCol, toCol, t) as Vector4;
                interpolatedColor.toArray(currentColorsData, j * 4);
            }

            if ( t >= 1 )
            {
                const staticMatrix = Matrix.FromArray(finalMatrixData, i * 16);
                staticMatrix.copyToArray(currentMatrixData, (fromWholeMatrix.length / 16 + i) * 16);

                const staticColor = Vector4.FromArray(finalColorsData, i * 4);
                staticColor.toArray(currentColorsData, (fromWholeColors.length / 4 + i) * 4);
            }
        }

        baseCube.thinInstanceSetBuffer("matrix", currentMatrixData, 16);
        baseCube.thinInstanceSetBuffer("customColor", currentColorsData, 4);

        if (!allFinished) {
            requestAnimationFrame(updateMatrices);
        } else {
            baseCube.thinInstanceSetBuffer("matrix", finalMatrixData, 16);
            baseCube.thinInstanceSetBuffer("customColor", finalColorsData, 4);
        }
    };

    requestAnimationFrame(updateMatrices);

    return {matrix: finalMatrixData, color: finalColorsData, cube: baseCube};
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
export const launchMnistAnimation = async function(sceneInformation: SceneInformation, visuals: Visual[], finalPredictions: float[]): Promise<void> 
{
    if (sceneInformation === null) return;
    if (!sceneInformation.engine) return;
    if (!sceneInformation.scene) return;
    if (!sceneInformation.camera) return;
    if (!sceneInformation.light) return;
    if (!sceneInformation.inRenderLoop) return;

    // reset scene
    await resetScene(sceneInformation);

    sceneInformation.IntroText.isVisible = false;
    
    const tokenAtStart = sceneInformation.animationToken ?? 0;

    const isTokenInvalid = () => sceneInformation.animationToken !== tokenAtStart;

    const safeAwait = async (promise: Promise<any>) => {
        const result = await promise;
        if (isTokenInvalid()) throw new Error("Reset scene called during animation.");
        return result;
    };

    setCameraPosition

    // [1] INPUT IMAGE
    const inputImageInfo = await safeAwait(addVisual(sceneInformation, visuals[0], new Vector3(0, 0, 0), 0.2)) as AddedVisualInfo;
    sceneInformation.cubeInstances?.push(inputImageInfo.cube);

    setCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[0]);
    setCameraLookAt(sceneInformation, ANIMATION_LOOKATS[0]);

    await safeAwait(wait(100));
    await assignNewRendersToWholeCube(sceneInformation, inputImageInfo.cube, inputImageInfo.matrix, inputImageInfo.color);

    await safeAwait(rotateAroundCircle(sceneInformation, sceneInformation.camera.target.clone(), sceneInformation.camera.position.clone(), Math.PI * 2, 2000));
    await safeAwait(wait(100));
    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[1], 500));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[1], 500));

    //[2] CONV LAYER 1
    const convLayer1Infos: AddedVisualInfo[] = new Array(6);
    for(let i = 0; i < 6; i++)
    {
        convLayer1Infos[i] = await safeAwait(addVisualFromInput(sceneInformation, visuals[1 + i], new Vector3(0, 0, -7 - i * 0.5), [inputImageInfo], 100, 1, 0.05));
        await safeAwait(wait(1000))
    }

    await safeAwait(wait(500));
    for (const visualInfo of convLayer1Infos) {
        sceneInformation.cubeInstances?.push(visualInfo.cube);
        await assignNewRendersToWholeCube(sceneInformation, visualInfo.cube, visualInfo.matrix, visualInfo.color);
    }

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[2], 500));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[2], 500));

    //[3] pooling layer 1
    const poolLayer1Infos: AddedVisualInfo[] = new Array(6);
    for(let i = 0; i < 6; i++)
    {
        let speed = 100;
        let timeOffset = 1;
        let waitTime = 500;

        if (i === 0)
        {
            speed = 200;
            timeOffset = 10;
            waitTime = 2000;
        }

        poolLayer1Infos[i] = await safeAwait(addVisualFromSubsampling(sceneInformation, visuals[7 + i], new Vector3((5/2) * (-1) * (3.45 + 0.5) + (3.45 + 0.5) * i, 0, -15), convLayer1Infos[i].matrix, convLayer1Infos[i].color, speed, timeOffset, 0.05));
        await safeAwait(wait(waitTime))
    }
    
    await safeAwait(wait(500));
    for (const visualInfo of poolLayer1Infos) {
        sceneInformation.cubeInstances?.push(visualInfo.cube);
        await assignNewRendersToWholeCube(sceneInformation, visualInfo.cube, visualInfo.matrix, visualInfo.color);
    }
    
    //[4] CONV LAYER 2
    const convLayer2Infos: AddedVisualInfo[] = new Array(16);
    for(let i = 0; i < 16; i++)
    {
        let speed = (i === 0) ? 100 : 6;

        let waitTime = speed * visuals[13 + i].data.length;

        if (i === 0) waitTime-= 2000;
        convLayer2Infos[i] = await safeAwait(addVisualFromConvolution(sceneInformation, visuals[13 + i], new Vector3(0, 0, -23 - i * 0.5), poolLayer1Infos, speed, 0.05, 5, 1));
        
        await safeAwait(wait(waitTime))

        if (i === 0)
        {
            await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[3], 500));
            await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[3], 500));
        }
    }
    await safeAwait(wait(500));
    for (const visualInfo of convLayer2Infos) {
        sceneInformation.cubeInstances?.push(visualInfo.cube);
        await assignNewRendersToWholeCube(sceneInformation, visualInfo.cube, visualInfo.matrix, visualInfo.color);
    }

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[4], 500));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[4], 500));

    //[5] POOLING LAYER 2
    const poolLayer2Infos: AddedVisualInfo[] = new Array(16);
    for(let i = 0; i < 16; i++)
    {
        let speed = 100;
        let timeOffset = 1;
        let waitTime = 100;

        if (i === 0)
        {
            speed = 200;
            timeOffset = 10;
            waitTime = 700;
        }

        poolLayer2Infos[i] = await safeAwait(addVisualFromSubsampling(sceneInformation, visuals[29 + i], new Vector3(0, 0, -35 - i * 0.5), convLayer2Infos[i].matrix, convLayer2Infos[i].color, speed, timeOffset, 0.05));
        await safeAwait(wait(waitTime))
    }
    await safeAwait(wait(500));
    for (const visualInfo of poolLayer2Infos) {
        sceneInformation.cubeInstances?.push(visualInfo.cube);
        await assignNewRendersToWholeCube(sceneInformation, visualInfo.cube, visualInfo.matrix, visualInfo.color);
    }

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[5], 1000));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[5], 1000));

    //[6] FULL CONNECTED LAYER 1
    const fullConnectedLayer1Infos = await safeAwait(addVisualFromInput(sceneInformation, visuals[45], new Vector3(0, 0, -46), poolLayer2Infos, 1000, 0, 0.05));
    await safeAwait(wait(1000));

    sceneInformation.cubeInstances?.push(fullConnectedLayer1Infos.cube);
    await assignNewRendersToWholeCube(sceneInformation, fullConnectedLayer1Infos.cube, fullConnectedLayer1Infos.matrix, fullConnectedLayer1Infos.color);

    await safeAwait(wait(500));

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[6], 1000));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[6], 1000));

    const fullConnectedLayer2Infos = await safeAwait(addVisualFromFullConnectedLayer(sceneInformation, visuals[46], new Vector3(0, 0, -50), [fullConnectedLayer1Infos], 15, 0.05, 2));
    await safeAwait(wait(15*visuals[46].data.length));

    sceneInformation.cubeInstances?.push(fullConnectedLayer2Infos.cube);
    await assignNewRendersToWholeCube(sceneInformation, fullConnectedLayer2Infos.cube, fullConnectedLayer2Infos.matrix, fullConnectedLayer2Infos.color);

    await safeAwait(wait(500));

    const fullConnectedLayer3Infos = await safeAwait(addVisualFromFullConnectedLayer(sceneInformation, visuals[47], new Vector3(0, 0, -54), [fullConnectedLayer2Infos], 25, 0.05, 2));
    await safeAwait(wait(25*visuals[47].data.length));

    sceneInformation.cubeInstances?.push(fullConnectedLayer3Infos.cube);
    await assignNewRendersToWholeCube(sceneInformation, fullConnectedLayer3Infos.cube, fullConnectedLayer3Infos.matrix, fullConnectedLayer3Infos.color);

    await safeAwait(wait(500));

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[7], 1000));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[7], 1000));

    // Final prediction
    const final10 = await safeAwait(addVisualFromFullConnectedLayer(sceneInformation, visuals[48], new Vector3(0,0,-58), [fullConnectedLayer3Infos], 750, 1.0, 1));
    
    const finalPredCopy = new Float32Array(finalPredictions);
    const sortedPreds = [...finalPredCopy].sort((a, b) => b - a);
    const topOne = finalPredCopy.indexOf(Math.max(...finalPredCopy));
    const topTwo = finalPredCopy.indexOf(sortedPreds[1]);
    const topThree = finalPredCopy.indexOf(sortedPreds[2]);

    for (let i = 0; i < 10; i++)
    {
        const startPos = new Vector3(-5 + (i * 1.15), 0, -58)
        const endPos = new Vector3(-5 + (i * 1.15), 1, -58);
        const startScale = 0.2;
        const endScale = 1;
        const time = 750;

        const number = finalPredictions[i];
        const color = (i === topOne) ? 'gold' : (i === topTwo) ? 'silver' : (i === topThree) ? 'orange' : 'white';

        await safeAwait(animatePredictionNumber(sceneInformation, number, startPos, endPos, startScale, endScale, time, color));
    }

    sceneInformation.cubeInstances?.push(final10.cube);
    await assignNewRendersToWholeCube(sceneInformation, final10.cube, final10.matrix, final10.color);

    await generateTexts(sceneInformation);
};

//================================//
const getColorFromName = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        'gold': '#FFDB32',
        'silver': '#C0C8C0',
        'orange': '#FFA532',
        'white': '#00ffe8'
    };
    return colorMap[colorName] || '#00ffe8';
};

//================================//
export const animatePredictionNumber = async function(sceneInformation: SceneInformation, number: number, startPosition: Vector3, endPosition: Vector3, startScale: float, endScale: float, time: float, color: string = 'white'): Promise<void>
{
    if (sceneInformation === null || sceneInformation.scene === undefined || sceneInformation.predictionMeshes == undefined || sceneInformation.camera === undefined) return;

    const text: Mesh | null = MeshBuilder.CreateText(`text_${sceneInformation.predictionMeshes.length}`, `${number}%`, fontData, {size: 0.25, resolution: 16, depth: 0.1}, sceneInformation.scene, earcut);
    if (!text) return;

    text.position.set(startPosition.x, startPosition.y, startPosition.z);
    text.lookAt(sceneInformation.camera.position);
    text.rotate(Vector3.Up(), Math.PI);

    text.scaling.set(startScale, startScale, startScale);
    text.setEnabled(true);

    // Create Standard Material for the text
    const material = new StandardMaterial(`textMaterial_${sceneInformation.predictionMeshes.length}`, sceneInformation.scene);
    material.diffuseColor = Color3.FromHexString(getColorFromName(color));

    text.material = material;

    sceneInformation.predictionMeshes.push(text);

    const currentToken = sceneInformation.animationToken ?? 0;
    const startTime = performance.now();

    return new Promise((resolve) => {
        const animation = () => {
            if (sceneInformation.animationToken !== currentToken) return resolve();

            const now = performance.now();
            const elapsed = now - startTime;

            const t = Math.min(elapsed / time, 1);

            text!.position.x = startPosition.x + (endPosition.x - startPosition.x) * t;
            text!.position.y = startPosition.y + (endPosition.y - startPosition.y) * t;
            text!.position.z = startPosition.z + (endPosition.z - startPosition.z) * t;

            text!.scaling.x = startScale + (endScale - startScale) * t;
            text!.scaling.y = startScale + (endScale - startScale) * t;
            text!.scaling.z = startScale + (endScale - startScale) * t;

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
export const resetScene = async function(sceneInformation: SceneInformation): Promise<void>
{
    if (sceneInformation === null) return;
    if (!sceneInformation.engine || !sceneInformation.inRenderLoop) return;

    if(sceneInformation.cubeInstances)
    {
        sceneInformation.cubeInstances.forEach((cube: Mesh) => {
            if (cube) cube.dispose();
        });
        sceneInformation.cubeInstances = [];
    }

    if(sceneInformation.stepTexts)
    {
        sceneInformation.stepTexts.forEach((text: TextBlock) => {
            if (text) text.dispose();
        });
        sceneInformation.stepTexts = [];
    }

    if(sceneInformation.predictionMeshes)
    {
        sceneInformation.predictionMeshes.forEach((mesh: Mesh) => {
            if (mesh) mesh.dispose();
        });
        sceneInformation.predictionMeshes = [];
    }

    sceneInformation.currentStep = ANIMATION_STEPS.length - 1;
    STEP_POSITIONS.next = false;
    STEP_POSITIONS.previous = false;

    if(sceneInformation.fullScreenGUI) sceneInformation.fullScreenGUI.dispose();
    if(sceneInformation.wholeColors) sceneInformation.wholeColors = new Float32Array(0);
    if(sceneInformation.wholeMatrix) sceneInformation.wholeMatrix = new Float32Array(0);
    if(sceneInformation.wholeRenderCube) sceneInformation.wholeRenderCube.dispose();
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
    newLight.intensity = 1.5;
    newLight.position = new Vector3(0, 0, -100);

    sceneInformation.light = newLight;

    sceneInformation.scene.clearColor = new Color4(0.1, 0.1, 0.1, 1.0); // Dark gray

    //Stop previous render loop if any
    sceneInformation.engine.stopRenderLoop();

    sceneInformation.engine.runRenderLoop(() => 
    {
        sceneInformation.scene?.render();
        sceneInformation.inRenderLoop?.();
        processCameraMovements(sceneInformation);
        processStepPositions(sceneInformation);
    });

    sceneInformation.wholeRenderCube = MeshBuilder.CreateBox("wholeRenderCube", { size: 0.2 }, sceneInformation.scene);
    sceneInformation.wholeRenderCube.position = new Vector3(0, 0, 0);
    const material: ShaderMaterial = createUnlitMaterial(sceneInformation.scene);

    sceneInformation.wholeRenderCube.material = material;
    sceneInformation.wholeRenderCube.isVisible = false;

    sceneInformation.cubeInstances = [];
    sceneInformation.cubeInstances.push(sceneInformation.wholeRenderCube);

    sceneInformation.fullScreenGUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, sceneInformation.scene);
    
    sceneInformation.IntroText.fontSize = TEXT_SIZE;
    sceneInformation.fullScreenGUI.addControl(sceneInformation.IntroText);
    sceneInformation.IntroText.isVisible = true;
    
    //sceneInformation.scene?.debugLayer.show();
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

//================================//
const assignNewRendersToWholeCube = async function(sceneInformation: SceneInformation, cube: Mesh, matrix: Float32Array, color: Float32Array): Promise<void>
{
    if (sceneInformation === null || sceneInformation.wholeRenderCube === undefined) return;

    if (sceneInformation.wholeColors === undefined) sceneInformation.wholeColors = new Float32Array(0);
    if (sceneInformation.wholeMatrix === undefined) sceneInformation.wholeMatrix = new Float32Array(0);

    //We add the positions in matrix and colors to wholeMatrix and wholeColors
    const newMatrix = new Float32Array(sceneInformation.wholeMatrix.length + matrix.length);
    const newColors = new Float32Array(sceneInformation.wholeColors.length + color.length);

    newMatrix.set(sceneInformation.wholeMatrix, 0);
    newMatrix.set(matrix, sceneInformation.wholeMatrix.length);
    sceneInformation.wholeMatrix = newMatrix;

    newColors.set(sceneInformation.wholeColors, 0);
    newColors.set(color, sceneInformation.wholeColors.length);
    sceneInformation.wholeColors = newColors;

    //We set the new buffer to the wholeRenderCube
    sceneInformation.wholeRenderCube.thinInstanceSetBuffer("matrix", sceneInformation.wholeMatrix, 16);
    sceneInformation.wholeRenderCube.thinInstanceSetBuffer("customColor", sceneInformation.wholeColors, 4);

    cube.isVisible = false; // Hide the original cube
    sceneInformation.wholeRenderCube.isVisible = true; // Show the whole render cube
}

//================================//
export function goLeft(value: boolean): void {
    CAMERA_MOVEMENTS.goLeft = value;
}

//================================//
export function goRight(value: boolean): void {
    CAMERA_MOVEMENTS.goRight = value;
}

//================================//
export function goUp(value: boolean): void {
    CAMERA_MOVEMENTS.goFront = value;
}

//================================//
export function goDown(value: boolean): void {
    CAMERA_MOVEMENTS.goBack = value;
}

//================================//
function processCameraMovements(sceneInformation: SceneInformation): void {
    if (sceneInformation === null || !sceneInformation.camera) return;

    const camera = sceneInformation.camera;
    const speed = 0.1; // Adjust the speed as needed

    // Get the camera's forward vector (normalized)
    const forward = camera.getTarget().subtract(camera.position).normalize();

    // Calculate right vector (cross product of forward and up)
    const right = Vector3.Cross(forward, Vector3.Up()).normalize();

    if (CAMERA_MOVEMENTS.goLeft) {
        camera.position.addInPlace(right.scale(speed));
        camera.target.addInPlace(right.scale(speed));
    }
    if (CAMERA_MOVEMENTS.goRight) {
        camera.position.subtractInPlace(right.scale(speed));
        camera.target.subtractInPlace(right.scale(speed));
    }
    if (CAMERA_MOVEMENTS.goFront) {
        camera.position.addInPlace(forward.scale(speed));
        camera.target.addInPlace(forward.scale(speed));
    }
    if (CAMERA_MOVEMENTS.goBack) {
        camera.position.subtractInPlace(forward.scale(speed));
        camera.target.subtractInPlace(forward.scale(speed));
    }
}

//================================//
export function goToPreviousStep(): void {
    if (step_lock) return;

    STEP_POSITIONS.previous = true;
}

//================================//
export function goToNextStep(): void {
    if (step_lock) return;

    STEP_POSITIONS.next = true;
}

//================================//
function processStepPositions(sceneInformation: SceneInformation): void {

    if (!STEP_POSITIONS.next && !STEP_POSITIONS.previous) return;


    if (STEP_POSITIONS.next && STEP_POSITIONS.previous)
    {
        STEP_POSITIONS.next = false;
        STEP_POSITIONS.previous = false;

        return;
    }

    else if(STEP_POSITIONS.next)
    {
        sceneInformation.currentStep = (sceneInformation.currentStep + 1) % ANIMATION_STEPS.length;
        STEP_POSITIONS.next = false; 
    }

    else if (STEP_POSITIONS.previous)
    {
        sceneInformation.currentStep = ((sceneInformation.currentStep - 1 + ANIMATION_STEPS.length) % ANIMATION_STEPS.length);
        STEP_POSITIONS.previous = false;
    }

    step_lock = true;
    
    goToStep(sceneInformation, sceneInformation.currentStep).then(() => {
        step_lock = false;
    });
}

//================================//
const goToStep = async function(sceneInformation: SceneInformation, index: int) : Promise<void> {
        
    if (index < 0 || index >= ANIMATION_STEPS.length) return;
    if (!sceneInformation.cubeInstances || sceneInformation.cubeInstances === undefined) return;
    
    const texts = sceneInformation.stepTexts ?? [];
    texts.forEach((text: TextBlock) => {
        text.isVisible = false;
    });

    const tokenAtStart = sceneInformation.animationToken ?? 0;

    const isTokenInvalid = () => sceneInformation.animationToken !== tokenAtStart;

    const safeAwait = async (promise: Promise<any>) => {
        const result = await promise;
        if (isTokenInvalid()) throw new Error("Reset scene called during animation.");
        return result;
    };

    await safeAwait(setTimedCameraPosition(sceneInformation, ANIMATION_PLACEMENTS[index], 400));
    await safeAwait(setTimedCameraLookAt(sceneInformation, ANIMATION_LOOKATS[index], 150));

    const stepText: TextBlock | undefined = sceneInformation.stepTexts ? sceneInformation.stepTexts[index] : undefined;
    if (stepText) {
        stepText.isVisible = true;
    }

    // Should I keep this?
    /*
    const cubes = sceneInformation.cubeInstances ?? [];
    cubes.forEach((cube: Mesh) => {
        cube.isVisible = false;
    });

    const stepCubes = ANIMATION_CUBES[index];
    for (let i = stepCubes[0]; i < stepCubes[1]; i++)
    {
        const cube: Mesh | undefined = sceneInformation.cubeInstances ? sceneInformation.cubeInstances[i] : undefined;
        if (cube) {
            cube.isVisible = true;
        }
    }
    */
}

//================================//
const generateTexts = async function(sceneInformation: SceneInformation,): Promise<void> {

    if (sceneInformation === null || sceneInformation.scene === undefined || sceneInformation.fullScreenGUI === undefined) return;

    sceneInformation.stepTexts = [];
    ANIMATION_STEPS.forEach((step) => {
        const text: TextBlock = new TextBlock(`stepText_${step.pose}`, step.text);
        text.textWrapping = true;
        text.resizeToFit = true;
        text.height = "auto";
        text.color = "white";
        text.fontSize = TEXT_SIZE;
        text.lineSpacing = 0;
        text.fontFamily = fontData.fontFamily;
        
        text.top = ANIMATION_TEXT_PLACEMENTS[step.pose].top;
        text.left = ANIMATION_TEXT_PLACEMENTS[step.pose].left;
        text.verticalAlignment = ANIMATION_TEXT_PLACEMENTS[step.pose].vertical_alignment;
        text.horizontalAlignment = ANIMATION_TEXT_PLACEMENTS[step.pose].horizontal_alignment;
        text.width = ANIMATION_TEXT_PLACEMENTS[step.pose].width;
        text.height = ANIMATION_TEXT_PLACEMENTS[step.pose].height;
        
        sceneInformation.fullScreenGUI?.addControl(text);
        sceneInformation.stepTexts?.push(text);

        const isVisible = (step.pose === ANIMATION_STEPS.length - 1) ? true : false;
        text.isVisible = isVisible;
    });
}