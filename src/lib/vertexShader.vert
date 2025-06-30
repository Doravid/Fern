attribute vec4 vPosition;
attribute vec3 vNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 fNormal;
varying vec3 fPosition;

void main() {
    fNormal = normalize(normalMatrix * vNormal);
    fPosition = vec3(modelViewMatrix * vPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}