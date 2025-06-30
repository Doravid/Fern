"use strict";

let canvas, gl, program;
let projectionMatrix, normalMatrixLoc;

let vertices = [],
  normals = [];

let angle = 45; // degrees
let gravity = 9.8;
let velocity = 5.0;
let ballLaunched = false;

let ballPos = vec3(0, 0, 0);
let ballVel = vec3(0, 0, 0);

let timePrev = 0;

let eye = vec3(1.2, 1, 2);
let at = vec3(1.2, 1, 0);
let up = vec3(0, 1, 0);

window.onload = function init() {
  console.log("hello, worls!");
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas, null);
  if (!gl) alert("WebGL isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 0.95, 0.95, 1.0);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  let projectionMatrix = perspective(
    60,
    canvas.width / canvas.height,
    0.1,
    100
  );
  setUniformMatrix("projectionMatrix", projectionMatrix);

  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

  document
    .getElementById("angleSlider")
    .addEventListener("input", (e) => (angle = parseFloat(e.target.value)));
  document
    .getElementById("gravitySlider")
    .addEventListener("input", (e) => (gravity = parseFloat(e.target.value)));

  canvas.addEventListener("click", () => {
    if (!ballLaunched) {
      let rad = (angle * Math.PI) / 180;
      /* FIX ME */
      /* Define initial ballPos and ballVel */
      ballVel = [Math.cos(rad) * velocity, Math.sin(rad) * velocity, 0];
      ballPos = [Math.cos(rad) * 0.6, Math.sin(rad) * 0.6, 0];
      ballLaunched = true;
    }
  });

  render();
};

function updateBall(dt) {
  if (!ballLaunched) return;
  ballPos = [
    ballPos[0] + ballVel[0] * dt,
    ballPos[1] + ballVel[1] * dt,
    ballPos[2] + ballVel[2] * dt,
  ];
  ballVel = [ballVel[0], ballVel[1] - dt * gravity];

  if (ballPos[1] < 0) ballLaunched = false;
}

function render(now) {
  vertices = [];
  normals = [];
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  let mv = lookAt(eye, at, up);

  // Draw cannon
  setUniformMatrix("modelViewMatrix", mv);
  createCannon();
  setAttribute("vPosition", vertices);
  setAttribute("vNormal", normals, 3);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length);

  // Update ball physics
  let dt = timePrev ? (now - timePrev) / 1000 : 0;
  updateBall(dt);
  timePrev = now;

  // Draw ball
  if (ballLaunched) {
    createBall();
    setAttribute("vPosition", vertices);
    setAttribute("vNormal", normals, 3);
    mv = mult(mv, translate(ballPos[0], ballPos[1], 0));
    setUniformMatrix("modelViewMatrix", mv);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
  }

  let normalMatrix = mat3();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) normalMatrix[i][j] = mv[i][j];
  gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

  requestAnimationFrame(render);
}

function setAttribute(name, data, length = 4) {
  let pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  let aLoc = gl.getAttribLocation(program, name);
  gl.vertexAttribPointer(aLoc, length, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aLoc);
}

function setUniformMatrix(name, data) {
  let matrixLoc = gl.getUniformLocation(program, name);
  gl.uniformMatrix4fv(matrixLoc, false, flatten(data));
}
