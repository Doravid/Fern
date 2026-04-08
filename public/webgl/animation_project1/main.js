// Bonus Features:
// 1. Adjustable Car Speed. Press -/+ to make the car move faster or slower. 

// 2. Engine Noises. The car will make engine noises that scale with it's speed. 
// The audio loops when it ends and is silent when the car isn't moving.
// If you can't hear the audio try turning up your volume or making the car move faster, it can be quiet at low speeds.

//Known Bug: Shadows are projected incorrectly.

// Global WebGL variables
let gl;                 // WebGL context
let program;            // GLSL program
let canvas;             // Canvas element
let skyboxProgram;      // Separate program for skybox

// Uniform locations
let modelViewMatrixLoc;
let projectionMatrixLoc;
let normalMatrixLoc;
let textureLoc;
let useTextureLoc;
let diffuseLoc;
let specularLoc;
let lightPositionLoc;
let ambientLoc;
let enablePointLightLoc;

// Skybox uniform locations
let skyboxModelViewMatrixLoc;
let skyboxProjectionMatrixLoc;
let skyboxTextureLoc;

// Attribute locations
let vPositionLoc;
let vNormalLoc;
let vTexCoordLoc;

// Skybox attribute locations
let skyboxPositionLoc;

// Camera and scene properties
let modelViewMatrix;
let projectionMatrix;
let normalMatri;
let lightPosition = vec4(2, 3.0, 2, 1.0);
let ambientColor = vec4(0.15, 0.11, 0.1, 1.0);

// Model to render
let currentModel = null;
let models = [];

// Skybox
let skybox;

// Buffers
let vertexBuffer;
let normalBuffer;
let texCoordBuffer;

//Stack for Hierachy
let stack = [];
let enablePointLight = true;
let enableCameraRotate = false;
let enableCarMovement = false;
let cameraAttachedToCar = false;
let skyboxEnabled = false;

let enableReflections = false;
let enableRefraction = false;
let reflectionLoc;
let refractionLoc;
let envMapLoc;


let enableShadows = false;
let shadowProgram;
let shadowModelViewMatrixLoc;
let shadowProjectionMatrixLoc;
let shadowPositionLoc;



let audio;

let movementSpeed = 0.02;
function handleKeyPress(event) {
    const pressedKey = event.code;
    console.log(pressedKey);
    switch (pressedKey) {
        case "KeyL":
            enablePointLight = !enablePointLight;
            break;
        case "KeyC":
            enableCameraRotate = !enableCameraRotate;
            break;
        case "KeyM":
            enableCarMovement = !enableCarMovement;
            if (enableCarMovement) {
                audio.play();
            } else { audio.pause(); }
            break;
        case "KeyD":
            cameraAttachedToCar = !cameraAttachedToCar;
            break;
        case "KeyE":
            skyboxEnabled = !skyboxEnabled;
            break;
        case "KeyR":
            enableReflections = !enableReflections;
            break;
        case "KeyF":
            enableRefraction = !enableRefraction;
            break;
        case "Minus":
            if (movementSpeed > 0) movementSpeed -= 0.01;
            audio.volume = Math.max(movementSpeed * 10, 0.0);
            break;
        case "Equal":
            if (movementSpeed < 0.10) movementSpeed += 0.01;
            audio.volume = Math.min(movementSpeed * 10, 1.0);
            break;
        case "KeyS":
            enableShadows = !enableShadows;
            break;
    }
}



//Initialize WebGL
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    audio = new Audio("https://users.wpi.edu/~ddpeterson/files/engine.mp3");
    audio.volume = movementSpeed * 10;
    audio.addEventListener("timeupdate", () => {
        if (audio.currentTime >= audio.duration - 0.7) {
            audio.currentTime = 0;
            audio.play();
        }
    });

    // Initialize WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Initialize shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    skyboxProgram = initShaders(gl, "skybox-vertex-shader", "skybox-fragment-shader");
    shadowProgram = initShaders(gl, "shadow-vertex-shader", "shadow-fragment-shader");
    gl.useProgram(program);


    document.addEventListener('keypress', e => handleKeyPress(e));

    // Get attribute locations for main program
    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    vNormalLoc = gl.getAttribLocation(program, "vNormal");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    // Get uniform locations for main program
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    textureLoc = gl.getUniformLocation(program, "uTexture");
    useTextureLoc = gl.getUniformLocation(program, "uUseTexture");
    diffuseLoc = gl.getUniformLocation(program, "uDiffuse");
    specularLoc = gl.getUniformLocation(program, "uSpecular");
    lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    ambientLoc = gl.getUniformLocation(program, "uAmbient");
    enablePointLightLoc = gl.getUniformLocation(program, "uEnablePointLight");
    reflectionLoc = gl.getUniformLocation(program, "uEnableReflection");
    refractionLoc = gl.getUniformLocation(program, "uEnableRefraction");
    envMapLoc = gl.getUniformLocation(program, "uEnvMap");
    shadowPositionLoc = gl.getAttribLocation(shadowProgram, "vPosition");
    shadowModelViewMatrixLoc = gl.getUniformLocation(shadowProgram, "modelViewMatrix");
    shadowProjectionMatrixLoc = gl.getUniformLocation(shadowProgram, "projectionMatrix");

    // Get attribute locations for skybox program
    skyboxPositionLoc = gl.getAttribLocation(skyboxProgram, "vPosition");

    // Get uniform locations for skybox program
    skyboxModelViewMatrixLoc = gl.getUniformLocation(skyboxProgram, "modelViewMatrix");
    skyboxProjectionMatrixLoc = gl.getUniformLocation(skyboxProgram, "projectionMatrix");
    skyboxTextureLoc = gl.getUniformLocation(skyboxProgram, "skybox");

    // Create buffers
    vertexBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    texCoordBuffer = gl.createBuffer();

    // Set light properties
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform4fv(ambientLoc, flatten(ambientColor));

    //Set projection matrix
    projectionMatrix = perspective(80.0, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Initialize skybox
    skybox = new Skybox();
    let stopSign = new Model("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj", "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl");
    let lamp = new Model("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj", "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl");
    let car = new Model("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj", "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl");
    let street = new Model("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj", "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl");
    let bunny = new Model("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj", "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl");
    //Push all the models to the models array.
    models.push(stopSign);  //0
    models.push(lamp);      //1
    models.push(street)     //2
    models.push(car);       //3
    models.push(bunny);     //4

    for (let i = 0; i < models.length; i++) {
        let model = models[i];
        let checkLoading = setInterval(function () {
            if (model.objParsed && model.mtlParsed) {
                clearInterval(checkLoading);
                // If the model has a texture, load it
                if (model.textured && model.imagePath) {
                    // Pass the model to loadTexture
                    loadTexture(model.imagePath, model);
                }
            }
        }, 100);
    }
    render();
};
let startedRendering = false;
// Load a texture from a URL
function loadTexture(url, model) {
    model.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, model.texture);
    // Set temporary texture until image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    // Load the texture image
    let image = new Image();
    image.crossOrigin = "";
    image.src = url;
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, model.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Re-render when texture is loaded
        if (!startedRendering) {
            startedRendering = true;
            render();
        }
    };
    image.src = url;
}

function Tree(root) {
    this.root = root;
}
function Node(model, modelMatrix) {
    this.model = model;
    this.modelMatrix = modelMatrix;
    this.children = [];
}
function hierarchy(node) {
    let modelMatrix = node.modelMatrix;
    let model = node.model;
    let children = node.children;

    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    renderModel(model);

    // Render shadows for objects above the ground plane
    if (model === models[0] || model === models[3]) {
        renderModelShadow(model, modelMatrix);
    }

    for (let i = 0; i < children.length; i++) {
        hierarchy(children[i]);
    }
    modelViewMatrix = stack.pop();
}

function renderModel(model) {
    currentModel = model;
    for (let face of currentModel.faces) {
        renderFace(face);
    }
}

let rads = 0;
let carRads = 0;
// Render the scene
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (enableCameraRotate && !cameraAttachedToCar) {
        rads += 0.02;
        if (rads >= 2 * Math.PI) rads = 0;
    }
    if (enableCarMovement) {
        carRads += movementSpeed;
        if (carRads >= 2 * Math.PI) carRads = 0;
    }
    let x, y, z;
    let eye, at, up;

    //Variables to hold car position.
    let carX = Math.sin(carRads) * 3;
    let carZ = Math.cos(carRads) * 3;

    car = new Node(models[3], mult(translate(carX, 0, carZ), rotateY(90 + (carRads * (180 / Math.PI)))));

    //This isn't what's wanted but I couldn't figure out how to add the camera to the hierarchy and it's only 3 points.
    if (cameraAttachedToCar) {
        // Calculate car's forward direction vector based on its rotation
        let carForwardX = Math.sin(carRads);
        let carForwardZ = Math.cos(carRads);
        let hoodOffsetX = 0;
        let hoodOffsetZ = 0.7;
        // Calculate the camera position on the car's hood
        let camX = carX + hoodOffsetX * Math.cos(carRads) - hoodOffsetZ * carForwardX;
        let camZ = carZ + hoodOffsetX * Math.sin(carRads) - hoodOffsetZ * carForwardZ;
        let lookAtX = carX + carForwardX;
        let lookAtZ = carZ + carForwardZ;
        eye = vec3(camX, 1, camZ);
        at = vec3(lookAtX, 1, lookAtZ);
        up = vec3(0, 1.0, 0.0);
        modelViewMatrix = mult(translate(-0.4, 0, 0.6), mult(rotateY(-90), lookAt(eye, at, up)));
    } else {
        //Variables to hold camera position.
        z = Math.sin(rads) * 3.5;
        x = Math.cos(rads) * 3.5;
        y = Math.sin(2 * rads) * 0.15 + 3;
        eye = vec3(x, y, z);
        at = vec3(0.0, 0.5, 0.0);
        up = vec3(0.0, 1.0, 0.0);
        modelViewMatrix = lookAt(eye, at, up);
    }

    // Render skybox first
    if (skyboxEnabled) {
        skybox.render(modelViewMatrix, projectionMatrix);
    }
    if (!skyboxEnabled && (enableReflections || enableRefraction)) {
        // Ensure skybox textures are loaded for reflections/refractions
        if (!skybox.loaded) {
            skybox.loadTexture();
        }
    }

    // Set camera view for scene objects
    gl.useProgram(program);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Update normal matrix
    normalMatri = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatri));
    gl.uniform1i(enablePointLightLoc, enablePointLight);

    stopSign = new Node(models[0], translate(-1, 0, -4))
    lightPost = new Node(models[1], translate(0, 0, 0));
    street = new Node(models[2], translate(0, 0, 0));
    bunny = new Node(models[4], translate(0, .65, 1.7))
    car.children.push(bunny);
    //Render the scene.
    hierarchy(stopSign);
    hierarchy(lightPost);
    hierarchy(street);
    hierarchy(car);

    requestAnimationFrame(render);
}

// Render a single face
function renderFace(face, isShadow = false) {
    if (isShadow) {
        // For shadows, just set up vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceVertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(shadowPositionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shadowPositionLoc);

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, face.faceVertices.length);
        return;
    }

    // Regular rendering code (existing code)
    let diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
    let specularColor = vec4(1.0, 1.0, 1.0, 1.0);
    if (face.material) {
        if (currentModel.diffuseMap.has(face.material)) {
            diffuseColor = vec4(...currentModel.diffuseMap.get(face.material));
        }

        if (currentModel.specularMap.has(face.material)) {
            specularColor = vec4(...currentModel.specularMap.get(face.material));
        }
    }

    gl.uniform4fv(diffuseLoc, flatten(diffuseColor));
    gl.uniform4fv(specularLoc, flatten(specularColor));

    let useTexture = currentModel.textured && face.faceTexCoords.length > 0 && currentModel.texture;
    gl.uniform1i(useTextureLoc, useTexture ? 1 : 0);

    if (useTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentModel.texture);
        gl.uniform1i(textureLoc, 0);
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox.texture);
    gl.uniform1i(envMapLoc, 1);

    let isCarOrBunny = (currentModel === models[3] || currentModel === models[4]);
    gl.uniform1i(reflectionLoc, enableReflections && isCarOrBunny);

    let isBunny = (currentModel === models[4]);
    gl.uniform1i(refractionLoc, enableRefraction && isBunny);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceVertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    if (face.faceNormals.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceNormals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormalLoc);
    } else {
        gl.disableVertexAttribArray(vNormalLoc);
        gl.vertexAttrib4f(vNormalLoc, 0.0, 0.0, 1.0, 0.0);
    }

    if (face.faceTexCoords.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceTexCoords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoordLoc);
    } else {
        gl.disableVertexAttribArray(vTexCoordLoc);
        gl.vertexAttrib2f(vTexCoordLoc, 0.0, 0.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, face.faceVertices.length);
}
// Skybox class
function Skybox() {
    this.vertices = [
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,

        -1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,

        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,

        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0
    ];

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    this.texture = null;
    this.loaded = false;

    // Skybox texture faces
    this.textureFaces = [
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_posx.png", // Right
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_negx.png", // Left
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_posy.png", // Top
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_negy.png", // Bottom
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_posz.png", // Front
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/skybox_negz.png"  // Back
    ];

    this.loadTexture();
}

Skybox.prototype.loadTexture = function () {
    const that = this;

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

    // Set default texture data while images load
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])
        );
    }

    let loadedFaces = 0;

    this.textureFaces.forEach((url, index) => {
        const image = new Image();
        image.crossOrigin = "";

        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, that.texture);
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + index,
                0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
            );

            loadedFaces++;

            if (loadedFaces === 6) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
                that.loaded = true;
            }
        };

        image.src = url;
    });
};

Skybox.prototype.render = function (viewMatrix, projectionMatrix) {
    if (!this.loaded) return;

    // Switch to skybox program
    gl.useProgram(skyboxProgram);

    // Remove translation from view matrix to keep skybox centered around camera
    let skyboxViewMatrix = mat4();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            skyboxViewMatrix[i][j] = viewMatrix[i][j];
        }
    }
    // Set uniforms
    gl.uniformMatrix4fv(skyboxModelViewMatrixLoc, false, flatten(skyboxViewMatrix));
    gl.uniformMatrix4fv(skyboxProjectionMatrixLoc, false, flatten(projectionMatrix));

    // Bind skybox texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.uniform1i(skyboxTextureLoc, 0);

    // Set up vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(skyboxPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(skyboxPositionLoc);

    // Draw skybox
    gl.depthFunc(gl.LEQUAL);  // Change depth function to render skybox behind everything
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthFunc(gl.LESS);    // Reset depth function

    // Switch back to main program
    gl.useProgram(program);
};


function calculateShadowMatrix(light) {
    let m = mat4();
    m[3][3] = 0;
    m[3][1] = -1 / light[1];

    shadowMatrix = mult(m, translate(-light[0], -light[1], -light[2]));
    shadowMatrix = mult(translate(light[0], light[1] + 0.01, light[2]), shadowMatrix);

    return shadowMatrix;
}
function renderModelShadow(model, modelMatrix) {
    if (!enableShadows || !enablePointLight) return;

    // Switch to shadow program
    gl.useProgram(shadowProgram);

    // Enable blending for semi-transparent shadows
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Push the current matrix
    stack.push(modelViewMatrix);

    // Calculate shadow projection matrix
    const shadowMatrix = calculateShadowMatrix(lightPosition);

    // Apply shadow transform
    modelViewMatrix = mult(modelViewMatrix, mult(modelMatrix, shadowMatrix));
    gl.uniformMatrix4fv(shadowModelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(shadowProjectionMatrixLoc, false, flatten(projectionMatrix));

    // Render each face with shadow settings
    currentModel = model;
    for (let face of currentModel.faces) {
        renderFace(face, true);
    }

    // Pop the matrix stack
    modelViewMatrix = stack.pop();

    // Disable blending
    gl.disable(gl.BLEND);

    // Switch back to main program
    gl.useProgram(program);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}