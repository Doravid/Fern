
"use strict";

let canvas;
let gl;

let program;

let eye = vec3(0, -2.4, 6);
let at = vec3(0, -2.4, 0);
let up = vec3(0, 1, 0);

// Physics parameters
let mass = 1.0;
let k = 20.0;
let gravity = 9.8;
let velocity = 0;
let position = 0;
let damp = 0.98;
let dragging = false;
let lastY = 0;
const baseLength = 2.0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) alert("WebGL isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    let modelViewMatrix = lookAt(eye, at, up);
    setUniformMatrix("modelViewMatrix", modelViewMatrix);

    let projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
    setUniformMatrix("projectionMatrix", projectionMatrix);

    let normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    let normalMatrix = mat3();
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            normalMatrix[i][j] = modelViewMatrix[i][j];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    // Mouse interaction
    canvas.addEventListener("mousedown", (e) => {
        dragging = true;
        lastY = e.clientY;
    });
    canvas.addEventListener("mouseup", () => dragging = false);
    canvas.addEventListener("mousemove", (e) => {
        if (dragging) {
            position = position + e.movementY*0.01
            
        }
    });

    render();
};

function simulateSpring(dt) {
    position += velocity * dt;

    velocity += ((-k * position)/mass + (gravity)) * dt;
    velocity *= damp;
    if(position <= -1){
        velocity = -1 * velocity * 0.8;
        position = -1;
    }
}

function render(now) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!dragging) {
        simulateSpring(0.016);
    }

    // Generate updated spring mesh
    generateSpringGeometry(baseLength + position);

    // Update vertex buffer
    setAttribute("vPosition", springPoints);

    // Update normal buffer
    setAttribute("vNormal", normals, 3);

    gl.drawArrays(gl.TRIANGLES, 0, springPoints.length);

    requestAnimationFrame(render);
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