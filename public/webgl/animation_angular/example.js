
"use strict";

let canvas;
let gl;
let program;

let platformVertices = [], armVertices = [], sphereVertices = [], normals = [];
let radius = 1.0;
let omega = 0.0;
let angle = 0;

let projectionMatrix, normalMatrixLoc;
let eye = vec3(0, 1.5, 5);
let at = vec3(0, 0, 0);
let up = vec3(0, 1, 0);

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) alert("WebGL not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    buildPlatform();
    buildArms();

    // Buffers
    // Update vertex buffer
    setAttribute("vPosition", platformVertices.concat(armVertices));

    // Update normal buffer
    setAttribute("vNormal", normals, 3);

    let projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
    setUniformMatrix("projectionMatrix", projectionMatrix);

    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    document.getElementById("radiusSlider").addEventListener("input", (e) => {
        radius = parseFloat(e.target.value);
        updateAngularVelocity();
        buildArms(); // rebuild arm vertices
        setAttribute("vPosition", platformVertices.concat(armVertices));
    });

    updateAngularVelocity();
    render();
};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    angle += omega * 0.016;

    let mv = lookAt(eye, at, up);
    mv = mult(mv, rotateY(angle * 180 / Math.PI));
    setUniformMatrix("modelViewMatrix", mv);

    let normalMatrix = mat3();
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            normalMatrix[i][j] = mv[i][j];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, platformVertices.length + armVertices.length);
    requestAnimationFrame(render);
}

function updateAngularVelocity() {
    omega = 1/radius;
}

function setAttribute(name, data, length = 4) {
    let pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

    let aLoc = gl.getAttribLocation(program,  name);
    gl.vertexAttribPointer(aLoc, length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLoc);
}

function setUniformMatrix(name, data) {
    let matrixLoc = gl.getUniformLocation(program, name);
    gl.uniformMatrix4fv(matrixLoc, false, flatten(data));
}