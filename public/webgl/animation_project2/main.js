//There is a provided spline file in the z

let gl;                 // WebGL context
let program;            // GLSL program
let canvas;             // Canvas element

// Uniform locations
let modelViewMatrixLoc;
let projectionMatrixLoc;
let normalMatrixLoc;
let diffuseLoc;
let specularLoc;
let lightPositionLoc;
let ambientLoc;
//Bones for the right half of the bird
let bones1 = [
    { x: 0, y: 0, angle: 20, length: 3.8 },
    { x: 0, y: 0, angle: 0, length: 3.8 },
    { x: 0, y: 0, angle: 0, length: 4.0 },
];
//Bones for the left half of the bird
let bones2 = [
    { x: 0, y: 0, angle: 0, length: 4 },
    { x: 0, y: 0, angle: 0, length: 4 },
    { x: 0, y: 0, angle: 0, length: 4 },
];

// Attribute locations
let vPositionLoc;
let vNormalLoc;

// Camera and scene properties
let modelViewMatrix;
let projectionMatrix;
let normalMatri;
let lightPosition = vec4(0, 10.0, 0, 1.0);
let ambientColor = vec4(0.15, 0.11, 0.1, 1.0);

// Model to render
let currentModel = null;
let models = [];

// Buffers
let vertexBuffer;
let normalBuffer;

//Stack for Hierarchy
let stack = [];
let fileLoaded = false;
let mySpline;

//Initialize WebGL
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    
    //File loading logic stolen from Project 1
    document.getElementById('files').onchange = function() {
        var file = this.files[0];
      
        var reader = new FileReader();
        reader.onload = function() {
            const text = this.result;
            //Split the lines
            var lines = text.split('\n');
            //Filter out the bad lines
            lines = lines.filter(element => element[0] !== '#' && element.length > 0)
            
            for (var line = 0; line < lines.length; line++) {
                lines[line] = lines[line].split(',');
            }
            //Start by parsing the info at the top
            let numPoints = parseInt(lines[1]);
            let numSeconds = parseFloat(lines[2]);  
            let controlPoints = [];
            let rotAngles = []; 
            for(let j = 3; j < 3 + (2*numPoints); j+=2){
                controlPoints.push([parseFloat(lines[j][0]),parseFloat(lines[j][1]),parseFloat(lines[j][2])]);
                rotAngles.push([parseFloat(lines[j+1][0]),parseFloat(lines[j+1][1]),parseFloat(lines[j+1][2])]);
            }
            //Set the current spline to the just loaded spline
            mySpline = new Spline(numPoints, numSeconds, controlPoints, rotAngles);
            fileLoaded = true;
        };
        reader.readAsText(file);
    };

    // Initialize WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }
    
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    // Initialize shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    document.addEventListener('keypress', e => handleKeyPress(e));
    
    // Get attribute locations
    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    vNormalLoc = gl.getAttribLocation(program, "vNormal");
    
    // Get uniform locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    diffuseLoc = gl.getUniformLocation(program, "uDiffuse");
    specularLoc = gl.getUniformLocation(program, "uSpecular");
    lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    ambientLoc = gl.getUniformLocation(program, "uAmbient");
    
    // Create buffers
    vertexBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    
    // Set light properties
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform4fv(ambientLoc, flatten(ambientColor));
    
    //Set projection matrix
    projectionMatrix = perspective(80.0, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    //Set the camera position
    let z = -15;
    let x = 15;
    let y = 6;
    let eye = vec3(x, y, z);
    let at = vec3(4.0, 0.5, 0.0);
    let up = vec3(0.0, 1.0, 0.0);
    modelViewMatrix = lookAt(eye, at, up);

    // Get the car
    let car = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl");

    // Get the street
    let street = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl");

    //Custom model made while having just slightly too much fun
    let duck = new Model(
        "https://users.wpi.edu/~ddpeterson/files/tests1.obj",
        "https://users.wpi.edu/~ddpeterson/files/tests1.mtl"
    );
    //Push all the models to the models array.
    models.push(street);
    models.push(car)
    models.push(duck)

        
    for(let i = 0; i < models.length; i++) {
        let model = models[i];
        let checkLoading = setInterval(function() {
            if (model.objParsed && model.mtlParsed) {
                clearInterval(checkLoading);
            }
        }, 100);
    }
    render();
};
//Tree, Node, and Hierarchy are all taken from my CS 4731 final project, they allow for hierarchial modeling.
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

    for(let i = 0; i < children.length; i++) {
        hierarchy(children[i]);
    }

    modelViewMatrix = stack.pop();
}

function renderModel(model){
    currentModel = model;
    for (let face of currentModel.faces) {
        renderFace(face);
    }
}

let time = 0;
// Render the scene
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //update the time
    time += 0.02;
    time %= 1;

    //Update the kinematics, based on the time (uses global state)
    forwardKinematics();
    // Set camera view
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    // Update normal matrix
    normalMatri = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatri));
    //Set defaults to be 0
    let offset = vec3(0,0,0);
    let rotateMat = mat4();
    
    if(fileLoaded){
        //Uses the spline to find the current offset
        offset = getBSplinePoint(mySpline.controlPoints, time);
        //Uses quaternions and the spline definition
        let temp = getInterpolatedRotation(mySpline.eulerRotations, time);
        rotateMat = rotate(temp.angle, temp.axis);
    }

    street = new Node(models[0], translate(0, 0, 0));
    duckBody = new Node(models[2], mult(translate(offset[0], 4, offset[1]),mult(rotateY(45), rotateMat)));

    //The right wing
    carWing = new Node(models[1], mult(translate(-2.5, 0.2, 0),mult(rotAtEnd(bones1[0].angle),rotateY(270))));
    carWing1 = new Node(models[1], mult(translate(-2.5 - bones1[1].x, 0.2 - bones1[1].y, 0),mult(rotAtEnd(bones1[1].angle),rotateY(270))));
    carWing2 = new Node(models[1], mult(translate(-2.5 - bones1[2].x, 0.2 - bones1[2].y, 0),mult(rotAtEnd(bones1[2].angle),rotateY(270))));
    
    //The left wing
    carWing3 = new Node(models[1], mult(translate(2.5, 0.2, 0),mult(rotAtEnd(bones2[0].angle, -2.5),rotateY(270))));
    carWing4 = new Node(models[1], mult(translate(2.5 + bones2[1].x, 0.2 + bones2[1].y, 0),mult(rotAtEnd(bones2[1].angle, -2.5),rotateY(270))));
    carWing5 = new Node(models[1], mult(translate(2.5 + bones2[2].x, 0.2 + bones2[2].y, 0),mult(rotAtEnd(bones2[2].angle, -2.5),rotateY(270))));

    //They are all children of the main bird body. 
    // All of the rotations and offsets within each wing is done via forward kinematics
    duckBody.children.push(carWing);
    duckBody.children.push(carWing1);
    duckBody.children.push(carWing2);
    duckBody.children.push(carWing3);
    duckBody.children.push(carWing4);
    duckBody.children.push(carWing5);
    
    
    // Render objects using hierarchy
    hierarchy(street);
    hierarchy(duckBody);
    //Render next frame
    requestAnimationFrame(render);
}
//Simple helper function to rotate objects at their end instead of at there center
function rotAtEnd(angle, distance = 2.5){
    return mult(translate(distance,0,0),mult(rotateZ(angle), translate(-1 * distance,0,0)));
}
function forwardKinematics(){
    
    //Calculate the bone positions for the first wing
    bones1[1].x = bones1[0].length * Math.cos(radians(bones1[0].angle));
    bones1[1].y = bones1[0].length * Math.sin(radians(bones1[0].angle));
    
    bones1[2].x = (bones1[1].length * Math.cos(radians(bones1[1].angle))) + bones1[1].x;
    bones1[2].y = (bones1[1].length * Math.sin(radians(bones1[1].angle))) + bones1[1].y;
    
    //Calculate the angles for the wings
    bones1[0].angle = Math.sin(2* time * Math.PI) * 40;
    bones1[1].angle = (Math.sin(2* time * Math.PI) * 40) * 1.7;
    bones1[2].angle = (Math.sin(2* time * Math.PI) * 40) * 2.5;


    //Calculate the bone positions for the second wing
    bones2[1].x = bones2[0].length * Math.cos(radians(bones2[0].angle));
    bones2[1].y = bones2[0].length * Math.sin(radians(bones2[0].angle));

    bones2[2].x = (bones2[1].length * Math.cos(radians(bones2[1].angle))) + bones2[1].x;
    bones2[2].y = (bones2[1].length * Math.sin(radians(bones2[1].angle))) + bones2[1].y;

    //Slightly cheating but is a much more compact and efficient way than doing the full math again.
    bones2[0].angle = -1 * bones1[0].angle;
    bones2[1].angle = -1 * bones1[1].angle;
    bones2[2].angle = -1 * bones1[2].angle;

}

// Render a single face (Taken from my computer graphics final project)
function renderFace(face) {
    // Get material properties
    let diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);  // Default white
    let specularColor = vec4(1.0, 1.0, 1.0, 1.0); // Default white
    
    if (face.material) {
        // Get diffuse color if available
        if (currentModel.diffuseMap.has(face.material)) {
            diffuseColor = vec4(...currentModel.diffuseMap.get(face.material));
        }
        
        // Get specular color if available
        if (currentModel.specularMap.has(face.material)) {
            specularColor = vec4(...currentModel.specularMap.get(face.material));
        }
    }
    
    // Set material uniforms
    gl.uniform4fv(diffuseLoc, flatten(diffuseColor));
    gl.uniform4fv(specularLoc, flatten(specularColor));
    
    // Set up vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceVertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);
    
    // Set up normals if available
    if (face.faceNormals.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(face.faceNormals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNormalLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormalLoc);
    } else {
        // If no normals, disable the attribute
        gl.disableVertexAttribArray(vNormalLoc);
        // Set a default normal
        gl.vertexAttrib4f(vNormalLoc, 0.0, 0.0, 1.0, 0.0);
    }
    
    // Draw the face
    gl.drawArrays(gl.TRIANGLES, 0, face.faceVertices.length);
}



//Simple spline class
class Spline {
    constructor(numControlPoints, timeToTraverse, controlPoints, eulerRotations) {
        this.numControlPoints = numControlPoints;
        this.timeToTraverse = timeToTraverse;
        this.controlPoints = controlPoints;
        this.eulerRotations = eulerRotations;
    }
}
//From project 1, gets an offset / a point given a set of points and time t
function getBSplinePoint(points, t) {
    // Determine which segment of the curve we're on
   const totalSegments = points.length - 3;
   const segmentIndex = Math.floor(t * totalSegments);
   // Adjust local t to be within the current segment
   const localT = (t * totalSegments) - segmentIndex;
   // Get the 4 points for this segment
   const p0 = points[segmentIndex];
   const p1 = points[segmentIndex + 1];
   const p2 = points[segmentIndex + 2];
   const p3 = points[segmentIndex + 3];
   // Calculate point coordinates using B-Spline basis functions
   const t2 = localT * localT;
   const t3 = t2 * localT;
   const x = (1/6) * (
    (p0[0] + 4 * p1[0] + p2[0]) +
    (-3 * p0[0] + 3 * p2[0]) * localT +
    (3 * p0[0] - 6 * p1[0] + 3 * p2[0]) * t2 +
    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
    );
   const y = (1/6) * (
    (p0[1] + 4 * p1[1] + p2[1]) +
    (-3 * p0[1] + 3 * p2[1]) * localT +
    (3 * p0[1] - 6 * p1[1] + 3 * p2[1]) * t2 +
    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
    );
   const z = (1/6) * (
    (p0[2] + 4 * p1[2] + p2[2]) +
    (-3 * p0[2] + 3 * p2[2]) * localT +
    (3 * p0[2] - 6 * p1[2] + 3 * p2[2]) * t2 +
    (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3
    );
   return [x, y, z];
}
function eulerToQuaternion(eulerAngles) {
    // Convert degrees to radians
    const degToRad = Math.PI / 180;
    const x = eulerAngles[0] * degToRad;
    const y = eulerAngles[1] * degToRad;
    const z = eulerAngles[2] * degToRad;
    
    // Calculate quaternion components
    const cx = Math.cos(x / 2);
    const sx = Math.sin(x / 2);
    const cy = Math.cos(y / 2);
    const sy = Math.sin(y / 2);
    const cz = Math.cos(z / 2);
    const sz = Math.sin(z / 2);
    
    // Compute quaternion
    const qw = cx * cy * cz + sx * sy * sz;
    const qx = sx * cy * cz - cx * sy * sz;
    const qy = cx * sy * cz + sx * cy * sz;
    const qz = cx * cy * sz - sx * sy * cz;
    
    return [qw, qx, qy, qz];
}

// SLERP between two quaternions
function slerpQuaternions(q1, q2, t) {
    // Normalize input quaternions
    q1 = normalize(q1);
    q2 = normalize(q2);
    // Calculate dot product
    let dotA = dot(q1, q2);
    
    // If dot product is negative, flip one quaternion to take shortest path
    if (dotA < 0) {
        q2 = [-q2[0], -q2[1], -q2[2], -q2[3]];
        dotA = -dotA;
    }
    // Clamp dot to be in valid acos range
    dotA = Math.min(Math.max(dotA, -1), 1);
    
    // Calculate angle between quaternions
    const theta = Math.acos(dotA);
    const sinTheta = Math.sin(theta);
    
    // when there is very small or no rotation. 
    if (sinTheta < 0.001) {
        return [
            q1[0] + t * (q2[0] - q1[0]),
            q1[1] + t * (q2[1] - q1[1]),
            q1[2] + t * (q2[2] - q1[2]),
            q1[3] + t * (q2[3] - q1[3])
        ];
    }
    
    // Calculate interpolation factors
    const s1 = Math.sin((1 - t) * theta) / sinTheta;
    const s2 = Math.sin(t * theta) / sinTheta;
    
    // Interpolate
    return [
        s1 * q1[0] + s2 * q2[0],
        s1 * q1[1] + s2 * q2[1],
        s1 * q1[2] + s2 * q2[2],
        s1 * q1[3] + s2 * q2[3]
    ];
}

// Convert quaternion to axis-angle representation
function quaternionToAxisAngle(q) {
    q = normalize(q);
    
    // Extract angle
    const angle = 2 * Math.acos(q[0]);
    // If angle is very small, return default axis
    if (Math.abs(angle) < 0.00001) {
        return { angle: 0, axis: [1, 0, 0] };
    }
    
    // Calculate scale
    const scale = 1 / Math.sin(angle / 2);
    
    // Extract axis
    const axis = [
        q[1] * scale,
        q[2] * scale,
        q[3] * scale
    ];
    
    const angleDeg = angle * (180 / Math.PI);
    
    return { angle: angleDeg, axis: axis };
}

// Main function to interpolate rotations
function getInterpolatedRotation(rotations, t) {
    // Calculate which segment the time falls into
    const totalSegments = rotations.length - 1;
    const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
    
    // Calculate local time within segment
    const localT = (t * totalSegments) - segmentIndex;
    // Convert Euler angles to quaternions
    const q1 = eulerToQuaternion(rotations[segmentIndex]);
    const q2 = eulerToQuaternion(rotations[segmentIndex + 1]);
    
    // Perform SLERP
    const interpolatedQ = slerpQuaternions(q1, q2, localT);
    // Convert back to axis-angle representation
    return quaternionToAxisAngle(interpolatedQ);
}