let gl;
let program;
let programInfo = {};
let velocity = vec2(0.0, 0.0);
let position = vec2(0, 0.0);
let currentNpcs = [];

const npcSize = 0.23;
let playerScale = 0.25;

let npcTexture;
let backgroundTexture;

let playerTexture;
let playerTextureBack;
let playerTextureLeft;
let playerTextureRight;

let itemOneTexture;
let itemTwoTexture;
let itemThreeTexture;

let currentItem = -1;
let hasHeldItem = false;
let currentItems;

let squarePositionBuffer;
let squareTexCoordBuffer;
let backgroundPositionBuffer;
let backgroundTexCoordBuffer;
let dialogElement;
let dialogNode;

let itemElement;
let itemNode;

let canvas;

let levels = [];
let currentLevel;
let shouldIterateText = false;
let hasAccepted = false;
let hasRejected = false;

let banhMi = false;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas, null);

  levels = loadLevels();
  currentLevel = levels[0];
  currentNpcs = currentLevel.npc_array;
  dictionary(currentLevel.words, currentLevel.isFinished); //currentLevel.isFinished is always false here

  if (!gl) {
    alert("WebGL isn't available");
  }

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  programInfo = {
    vPosition: gl.getAttribLocation(program, "vPosition"),
    vTexCoord: gl.getAttribLocation(program, "vTexCoord"),
    modelMatrix: gl.getUniformLocation(program, "modelMatrix"),
    u_texture: gl.getUniformLocation(program, "u_texture"),
  };

  const squareVertices = [
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5),
    vec2(0.5, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, 0.5),
    vec2(-0.5, 0.5),
  ];
  const squareTexCoords = [
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0),
    vec2(0, 1),
    vec2(1, 0),
    vec2(0, 0),
  ];

  const backgroundVertices = [
    vec2(-1, -1),
    vec2(1, -1),
    vec2(1, 1),
    vec2(-1, -1),
    vec2(1, 1),
    vec2(-1, 1),
  ];

  squarePositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(squareVertices), gl.STATIC_DRAW);

  squareTexCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(squareTexCoords), gl.STATIC_DRAW);

  backgroundPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(backgroundVertices), gl.STATIC_DRAW);

  backgroundTexCoordBuffer = squareTexCoordBuffer;

  backgroundTexture = loadTexture(gl, currentLevel.image);
  for (const npc of currentNpcs) {
    npc.texture = loadTexture(gl, npc.image);
  }
  playerTextureFront = loadTexture(
    gl,
    "https://www.dev-fern.com/character.png"
  );
  playerTextureBack = loadTexture(
    gl,
    "https://www.dev-fern.com/character_back.png"
  );
  playerTextureLeft = loadTexture(
    gl,
    "https://www.dev-fern.com/character_left.png"
  );
  playerTextureRight = loadTexture(
    gl,
    "https://www.dev-fern.com/character_right.png"
  );
  playerTexture = playerTextureFront;

  itemOneTexture = loadTexture(
    gl,
    "https://www.dev-fern.com/character_right.png"
  );
  itemTwoTexture = loadTexture(
    gl,
    "https://www.dev-fern.com/character_right.png"
  );
  itemThreeTexture = loadTexture(
    gl,
    "https://www.dev-fern.com/character_right.png"
  );

  dialogElement = document.querySelector("#dialog");
  dialogNode = document.createTextNode("");
  dialogElement.appendChild(dialogNode);
  dialogElement.parentElement.parentElement.classList.add("hidden");

  itemElement = document.querySelector("#item");
  itemNode = document.createTextNode("");
  itemElement.appendChild(itemNode);
  itemElement.parentElement.parentElement.classList.add("hidden");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  render();
};

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key == "w") {
      velocity[1] = 0.01;
      playerTexture = playerTextureBack;
    }
    if (e.key == "a") {
      velocity[0] = -0.01;
      playerTexture = playerTextureLeft;
    }
    if (e.key == "s") {
      velocity[1] = -0.01;
      playerTexture = playerTextureFront;
    }
    if (e.key == "d") {
      velocity[0] = 0.01;
      playerTexture = playerTextureRight;
    }
    if (e.key == " ") {
      shouldIterateText = true;
    }
    if (e.key == "y") {
      hasAccepted = true;
    }
    if (e.key == "n") {
      hasRejected = true;
    }
  },
  false
);

document.addEventListener(
  "keyup",
  (e) => {
    if (e.key == "w" || e.key == "s") velocity[1] = 0;
    if (e.key == "a" || e.key == "d") velocity[0] = 0;
  },
  false
);

function updatePosition() {
  position = add(position, velocity);
  //Left Right
  if (
    position[0] > 0.95 &&
    currentLevel.connections.right >= 0 &&
    currentLevel.isFinished
  ) {
    loadLevel(currentLevel.connections.right);
    position[1] = 0;
    position[0] = -0.9;
  } else if (position[0] > 0.95) position[0] = 0.95 * Math.sign(position[0]);
  if (
    position[0] < -0.95 &&
    currentLevel.connections.left >= 0 &&
    currentLevel.isFinished
  ) {
    loadLevel(currentLevel.connections.left);
    position[1] = 0;
    position[0] = 0.9;
  } else if (position[0] < -0.95) position[0] = 0.95 * Math.sign(position[0]);
  //Up Down
  if (
    position[1] > 0.95 &&
    currentLevel.connections.up >= 0 &&
    currentLevel.isFinished
  ) {
    loadLevel(currentLevel.connections.up);
    position[1] = -0.9;
    position[0] = 0;
    console.log(currentLevel.connections);
  } else if (position[1] > 0.95) position[1] = 0.95 * Math.sign(position[1]);

  if (
    position[1] < -0.95 &&
    currentLevel.connections.down >= 0 &&
    currentLevel.isFinished
  ) {
    loadLevel(currentLevel.connections.down);
    position[1] = 0.9;
    position[0] = 0;
  } else if (position[1] < -0.95) position[1] = 0.95 * Math.sign(position[1]);
}

function handleNpc() {
  const minDistance = 0.25;
  let isNearAnNpc = false;
  const overlay = dialogElement.parentElement.parentElement;

  for (const npc of currentNpcs) {
    if (length(subtract(npc.position, position)) < minDistance) {
      //Number GUY LOGIC
      if (
        currentLevel.items &&
        currentItem == currentLevel.items[2] &&
        npc.id == "number"
      ) {
        npc.iterator = 1;
        npc.dialogues = ["yippiee", "yippie"];
        autoFillThree();
      } else if (npc.id == "number") {
        npc.dialogues = dialogues[2];
      }
      //WATER GUY LOGIC
      if (npc.id == "water" && (hasAccepted || hasRejected)) {
        npc.iterator = 1;
        if (hasAccepted) {
          npc.dialogues = ["Một nước", "Một nước"];
          hasAccepted = false;
        }
        if (hasRejected) {
          npc.dialogues = ["Oh.", "Oh."];
          hasRejected = false;
        }
        shouldIterateText = false;
      } else if (shouldIterateText && npc.id == "water") {
        npc.dialogues = dialogues[4];
        iterator = 4;
      }
      //BANH ME GUY LOGIC
      if (
        npc.id == "jeff" &&
        levels[2].isFinished &&
        npc.dialogues != dialogues[5]
      ) {
        npc.iterator = 0;
        npc.dialogues = dialogues[5];
        banhMi = true;
      }

      if (npc.id == "steve" && banhMi && npc.dialogues != dialogues[6]) {
        npc.iterator = 0;
        npc.dialogues = dialogues[6];
      }

      if (shouldIterateText) {
        if (npc.iterator + 1 < npc.dialogues.length) {
          npc.iterator += 1;
        } else npc.iterator = 0;
        shouldIterateText = false;
      }
      isNearAnNpc = true;
      let offset = 0;
      if (npc.iterator % 2 == 0) {
        offset = 50;
        const pixelX = (position[0] * 0.5 + 0.5) * canvas.width;
        const pixelY = (position[1] * -0.5 + 0.5) * canvas.height;
        overlay.style.top = `${Math.floor(pixelY) + offset}px`;
        overlay.style.left = `${Math.floor(pixelX)}px`;
      } else {
        offset = -50;
        const pixelX = (npc.position[0] * 0.5 + 0.5) * canvas.width;
        const pixelY = (npc.position[1] * -0.5 + 0.5) * canvas.height;
        overlay.style.top = `${Math.floor(pixelY) + offset}px`;
        overlay.style.left = `${Math.floor(pixelX)}px`;
      }

      dialogNode.nodeValue = npc.dialogues[npc.iterator];
      overlay.classList.remove("hidden");

      break;
    }
  }

  if (!isNearAnNpc) {
    overlay.classList.add("hidden");
  }
}
function handleItem() {
  if (!currentLevel.items) return;
  const minDistance = 0.25;
  let isNearAnItem = false;
  const overlay = itemElement.parentElement.parentElement;

  for (const item of currentLevel.items) {
    if (!item.enabled) break;
    if (length(subtract(item.position, position)) < minDistance) {
      if (shouldIterateText) {
        if (currentItem) {
          currentItem.enabled = true;
        }
        currentItem = item;
        shouldIterateText = false;
      }
      isNearAnItem = true;
      offset = -50;
      const pixelX = (item.position[0] * 0.5 + 0.5) * canvas.width;
      const pixelY = (item.position[1] * -0.5 + 0.5) * canvas.height;
      overlay.style.top = `${Math.floor(pixelY) + offset}px`;
      overlay.style.left = `${Math.floor(pixelX)}px`;

      itemNode.nodeValue = "Pick Item Up? (space)";
      overlay.classList.remove("hidden");

      break;
    }
  }

  if (!isNearAnItem) {
    overlay.classList.add("hidden");
  }
}
function loadLevel(levelNum) {
  currentLevel = levels[levelNum];
  currentNpcs = currentLevel.npc_array;
  backgroundTexture = loadTexture(gl, currentLevel.image);
  dictionary(currentLevel.words, currentLevel.isFinished);
  for (const npc of currentNpcs) {
    npc.texture = loadTexture(gl, npc.image);
  }
  if (currentLevel.items) {
    for (const item of currentLevel.items) {
      item.texture = loadTexture(gl, item.image);
    }
  }
}
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  updatePosition();
  handleNpc();
  handleItem();

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareTexCoordBuffer);
  gl.vertexAttribPointer(programInfo.vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.vTexCoord);

  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundPositionBuffer);
  gl.vertexAttribPointer(programInfo.vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.vPosition);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.uniform1i(programInfo.u_texture, 0);

  gl.uniformMatrix4fv(programInfo.modelMatrix, false, flatten(mat4()));
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
  gl.vertexAttribPointer(programInfo.vPosition, 2, gl.FLOAT, false, 0, 0);

  for (const npc of currentNpcs) {
    gl.bindTexture(gl.TEXTURE_2D, npc.texture);
    let modelMatrix = mult(
      translate(npc.position[0], npc.position[1], 0),
      scalem(npcSize, npcSize, 1)
    );
    gl.uniformMatrix4fv(programInfo.modelMatrix, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  if (currentLevel.items) {
    for (const item of currentLevel.items) {
      if (item == currentItem) continue;
      gl.bindTexture(gl.TEXTURE_2D, item.texture);
      let modelMatrix = mult(
        translate(item.position[0], item.position[1], 0),
        scalem(npcSize, npcSize, 1)
      );
      gl.uniformMatrix4fv(programInfo.modelMatrix, false, flatten(modelMatrix));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  gl.bindTexture(gl.TEXTURE_2D, playerTexture);

  let playerMatrix = mult(
    translate(position[0], position[1], 0),
    scalem(playerScale, playerScale, 1)
  );
  gl.uniformMatrix4fv(programInfo.modelMatrix, false, flatten(playerMatrix));
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}
function levelIsFinished() {
  currentLevel.isFinished = true;
  console.log("hi");
}
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 0, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };
  image.src = url;

  return texture;
}
