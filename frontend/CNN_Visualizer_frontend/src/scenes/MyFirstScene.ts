import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Color3,
    type Vector,
    Material
} from '@babylonjs/core';

import type { Visual } from '@src/components/DrawingCanvas.vue';

//================================//
export type SceneInformation = {
    scene: Scene,
    camera: FreeCamera,
    light: HemisphericLight,
    engine: Engine
};

//================================//
export const createScene = async function (canvas: HTMLCanvasElement): Promise<SceneInformation> {
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera1", new Vector3(0, 3, -10), scene);
    camera.setTarget(Vector3.Zero());
    //camera.attachControl(canvas, false);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    engine.runRenderLoop(() => scene.render());

    return {scene: scene, camera: camera, light: light, engine: engine};
};

//================================//
export const addVisual = async function(sceneInformation: SceneInformation, order: number, visual: Visual): Promise<void>
{
    if (sceneInformation === null) return;

    const centerPosition: Vector3 = new Vector3(0.0, 0.0, -3.0 * order);
    const height = visual.height;
    const width = visual.width;

    const cubeSize = 0.2; // length of one side of the cube
    const cubeSpace = 0.1; // space between cubes

    const data = visual.data; //[] of numbers between 0 and 255 grayscale colors

    // Start position top left corner of the visual
    // If the height is pair then it should be placed at y 0.0 + cubeSpace/2 + height/2 * (cubeSize + cubeSpace)
    // If the height is odd then it should be placed at y 0.0 + cubeSize/2 + (height-1)/2 * (cubeSize + cubeSpace)
    // If the width is pair then it should be placed at x 0.0 - cubeSpace/2 - width/2 * (cubeSize + cubeSpace)
    // If the width is odd then it should be placed at x 0.0 - cubeSize/2 - (width-1)/2 * (cubeSize + cubeSpace)

    const startX = width % 2 === 0 ? -cubeSpace / 2 - (width / 2) * (cubeSize + cubeSpace) : -cubeSize / 2 - ((width - 1) / 2) * (cubeSize + cubeSpace);
    const startY = height % 2 === 0 ? cubeSpace / 2 + (height / 2) * (cubeSize + cubeSpace) : cubeSize / 2 + ((height - 1) / 2) * (cubeSize + cubeSpace);

    const startPosition: Vector3 = new Vector3(startX, startY, centerPosition.z);

    for (let i = 0; i < data.length; i++)
    {
        const pos: Vector3 = startPosition.add(new Vector3(
            (i % width) * (cubeSize + cubeSpace),
            -Math.floor(i / width) * (cubeSize + cubeSpace),
            0.0
        ));

        const cube = MeshBuilder.CreateBox("cube", { size: cubeSize }, sceneInformation.scene);
        cube.position = pos;

        const gray = data[i] / 255; // Normalize to 0.0–1.0
        const color = new Color3(gray, gray, gray);

        const cubeMat: Material = new StandardMaterial("cubeMat", sceneInformation.scene);
        (cubeMat as StandardMaterial).diffuseColor = color;
        cube.material = cubeMat;
    }

    //Place Camera at (0, 3, z - 10) and look at (0, 0, z)
    sceneInformation.camera.position = new Vector3(0, 3, centerPosition.z - 10);
    sceneInformation.camera.setTarget(new Vector3(0, 0, centerPosition.z));
};