// UnlitMaterial.ts
import { ShaderMaterial, Effect, Scene } from "@babylonjs/core";

// 1) Register your shaders with Babylon’s Effect manager:
Effect.ShadersStore["unlitVertexShader"] = `
    precision highp float;

    // per‐vertex attributes:
    attribute vec3 position;
    attribute vec4 customColor;
    attribute vec2 uv;

    // camera uniforms:
    uniform mat4 viewProjection;

    //varying
    varying vec2 vUV;
    varying vec4 vColor;

    #include<instancesDeclaration>

    void main() {
        #include<instancesVertex>
        
        gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

        vUV = uv;
        vColor = customColor;
    }
`;

Effect.ShadersStore["unlitFragmentShader"] = `
    precision highp float;

    varying vec2 vUV;
    varying vec4 vColor;

    void main() {
        gl_FragColor = vColor;
    }
`;

// 2) Factory that builds the material:
export function createUnlitMaterial(scene: Scene): ShaderMaterial {
    return new ShaderMaterial(
        "unlitThinInstanceMaterial",
        scene,
        {
            vertex:   "unlit",
            fragment: "unlit",
        },
        {
            attributes: ["position", "normal", "uv", "customColor"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection"]
        }
    );
}
