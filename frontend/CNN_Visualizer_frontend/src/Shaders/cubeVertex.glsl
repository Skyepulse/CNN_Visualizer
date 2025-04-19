precision highp float;

// Built-in attributes
attribute vec3 position;

// Thin instance custom attributes
attribute mat4 a_matrix;  // Transformation matrix
attribute vec4 a_color;   // RGBA color

// Varying passed to fragment shader
varying vec4 vColor;

uniform mat4 view;
uniform mat4 projection;

void main() {
    vec4 worldPosition = a_matrix * vec4(position, 1.0);
    gl_Position = projection * view * worldPosition;
    vColor = a_color;
}
