import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    HemisphericLight,
    DirectionalLight,
    MeshBuilder,
    StandardMaterial,
    Color4,
    Light,
    Matrix,
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
export const addVisual = async function(sceneInformation: SceneInformation, order: number, visual: Visual, centerPosition: Vector3, space: number = 0.1): Promise<void>
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

    const baseCube = MeshBuilder.CreateBox("baseCube", { size: cubeSize }, sceneInformation.scene);

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

    baseCube.material = new StandardMaterial("baseCubeMaterial", sceneInformation.scene);
};

//================================//
export const launchMnistAnimation = async function(sceneInformation: SceneInformation, visuals: Visual[]): Promise<void> 
{
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
    await safeAwait(addVisual(sceneInformation, 0, visuals[0], new Vector3(0, 0, 0)));
    setCameraPosition(sceneInformation, new Vector3(5, 0, -14));
    setCameraLookAt(sceneInformation, new Vector3(0, 0, 0));
    await safeAwait(wait(1500));
    
    await safeAwait(rotateAroundCircle(sceneInformation, new Vector3(0, 0, 0), new Vector3(5, 0, -14), Math.PI * 2, 2000));
    await safeAwait(wait(500));
    await safeAwait(linearTravel(sceneInformation, new Vector3(5, 0, -14), new Vector3(5, 0, -25), 1000));

    //[2] CONV LAYER 1
    await safeAwait(addVisual(sceneInformation, 1, visuals[1], new Vector3(0, 0, -10), 0.03));
    setCameraPosition(sceneInformation, new Vector3(5, 0, -25));
    setCameraLookAt(sceneInformation, new Vector3(0, 0, -10));
    await safeAwait(wait(1500));

    await safeAwait(rotateAroundCircle(sceneInformation, new Vector3(0, 0, 0), new Vector3(5, 0, -25), Math.PI * 2, 2000));

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

            console.log(t);

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
export const linearTravel = async function(sceneInformation: SceneInformation, start: Vector3, end: Vector3, time: number): Promise<void> {
    if (sceneInformation === null || !sceneInformation.camera) return;

    const camera = sceneInformation.camera;

    const currentToken = (sceneInformation.animationToken ?? 0);
    const initialTarget = camera.target;
    const targetOffset = end.subtract(start);
    const targetEnd = initialTarget.add(targetOffset);

    return new Promise((resolve) => {
        const startTime = performance.now();
        const animation = () => {
            if (sceneInformation.animationToken !== currentToken) return resolve();

            const now = performance.now();
            const elapsed = now - startTime;
            const t = Math.min(elapsed / time, 1);

            const newPos = Vector3.Lerp(start, end, t);
            const newTarget = Vector3.Lerp(initialTarget, targetEnd, t);

            camera.position = newPos;
            camera.setTarget(newTarget);

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