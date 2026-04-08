//My Choice / Bonus Features
// You can move the light with the arrow keys, using shift to move up and down on the y axis.
// You can change the direction of motion. Press D to change direction.


let canvas;
/** @type {WebGLRenderingContext} */
let gl;
let program;
let program2; //Second program so the curve is always fully lit.

let numTimesToSubdivide = 0;
let pointsArray = [];
let normalsArray = [];

//Flat Shading
let flatNormalsArray = [];
let finalFlatNormalsArray = [];
//Smooth Shading
let finalPointsArray = [];
let finalNormalsArray = [];

let isAnimPlaying = false;
let isWireframe = false;
let usePhongShading = true;
let currentLineSub = 0;
let loopSubdivision = [];
let segmentLengths = [];
//Total length of the curve
let totalLength = 0;

let lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );

//True is clockwise, false is counter clockwise.
let direction = true;
//The Cube
let vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 ),
];
//The vertices for the loop the cube is following.
let lineVerts = [
    vec4(0, 0, 0, 1),   
    vec4(3, 0, 6, 1),   
    vec4(7, 0, 8.5, 1),  
    vec4(12, 0, 9, 1), 
    vec4(15, 0, 4, 1), 
    vec4(13, 0, -2, 1),  
    vec4(7, 0, -1, 1),   
    vec4(2, 0, 0, 1),   
];

function handleKeyPress(e) {
    //Light movement
    if(!e.shiftKey){
        switch(e.key) {
            case "ArrowUp":
                lightPosition[1] += 1;
                break;
            case "ArrowDown":
                lightPosition[1] -= 1;
                break;
            case "ArrowLeft":
                lightPosition[0] -= 1;
                break;
            case "ArrowRight":
                lightPosition[0] += 1;
                break;
        } 
    }else{
        switch(e.key) {
            case "ArrowUp":
                lightPosition[2] += 1;
                break;
            case "ArrowDown":
                lightPosition[2] -= 1;
                break;
            case "ArrowLeft":
                lightPosition[0] -= 1;
                break;
            case "ArrowRight":
                lightPosition[0] += 1;
                break;
    }
    }
    //Other Key handling
    switch(e.code) {
        //Change Subdivisions
        case "KeyK":
            if (numTimesToSubdivide < 5) numTimesToSubdivide += 1;
            passData();
            break;
        case "KeyJ":
            if (numTimesToSubdivide > 0) numTimesToSubdivide -= 1;
            passData();
            break;
            //Toggle Wireframe view
        case 'KeyM':
            isWireframe = !isWireframe;
            passData();
            break;
        case 'KeyD':
            direction = !direction;
            break;
            //Toggle flat Shading
        case 'KeyL':
            usePhongShading = !usePhongShading;
            passData();
            break;
            //Set curve subdivisions
        case "KeyG":
            if (currentLineSub < 8){ 
                currentLineSub += 1;
                lineVerts = loopSubdivision[currentLineSub];
                calcTotalLength();
            }
            break;
        case "KeyH":
            if (currentLineSub > 0){
                currentLineSub -= 1;
                lineVerts = loopSubdivision[currentLineSub];
                calcTotalLength();
            } 
            break;
            //Start and stop the animation
        case 'KeyA':
            isAnimPlaying = !isAnimPlaying;
            break;
            
    }
}
//Creates a triangle face.
function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0],c[1], c[2], 0.0));
    flatNormalsArray.push(a[0], a[1], a[2], 0.0);
    flatNormalsArray.push(a[0], a[1], a[2], 0.0);
    flatNormalsArray.push(a[0], a[1], a[2], 0.0);
}
//Subdivides a triangle
function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
        a = normalize(a, true);
        b = normalize(b, true);
        c = normalize(c, true);

        let ab = mix( a, b, 0.5);
        let ac = mix( a, c, 0.5);
        let bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function passData() {
    gl.useProgram(program);
    // Create and bind the line buffer
    lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVerts), gl.STATIC_DRAW);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    //Use line based mesh if drawing wireframe version.
    if(isWireframe){
        gl.bufferData(gl.ARRAY_BUFFER, flatten(finalPointsArray[numTimesToSubdivide+6]), gl.STATIC_DRAW);
    }else{
        gl.bufferData(gl.ARRAY_BUFFER, flatten(finalPointsArray[numTimesToSubdivide]), gl.STATIC_DRAW);
    }
    //Pass in wireframe and shading type information to the shader
    let wireToggleLocation = gl.getUniformLocation(program, "isWireframe");
    gl.uniform1i(wireToggleLocation, isWireframe ? 1 : 0);
    const usePhongShadingLoc = gl.getUniformLocation(program, "usePhongShading");
    gl.uniform1i(usePhongShadingLoc, usePhongShading ? 1 : 0); 

    let vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.useProgram(program2);
    let vPosition2 = gl.getAttribLocation( program2, "vPosition");
    gl.vertexAttribPointer(vPosition2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);
    gl.useProgram(program);
    
    //FLAT!!
    let vFlatNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vFlatNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(finalFlatNormalsArray[numTimesToSubdivide]), gl.STATIC_DRAW); 

    let vFlatNormalValues = gl.getAttribLocation( program, "vFlatNormal");
    gl.vertexAttribPointer(vFlatNormalValues, 4, gl.FLOAT, false, 0, 0);
    if(isWireframe)  gl.disableVertexAttribArray(vFlatNormalValues);
    else gl.enableVertexAttribArray(vFlatNormalValues);
    
    //Normals for smooth lighting.
    let vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(finalNormalsArray[numTimesToSubdivide]), gl.STATIC_DRAW); 
    
    let vNormalValues = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormalValues, 4, gl.FLOAT, false, 0, 0);
    if(isWireframe) gl.disableVertexAttribArray(vNormalValues);
    else gl.enableVertexAttribArray(vNormalValues);


}
//Find the total length of the curve. Uses the global: totalLength
function calcTotalLength(){
    totalLength = 0;
    segmentLengths = [];
    for (let i = 0; i < lineVerts.length; i++) {
        const start = lineVerts[i];
        const end = lineVerts[(i + 1) % lineVerts.length];
        segmentLengths.push(distance(start, end));
        
        totalLength += distance(start,end);
    }
}

window.onload = function init() {
    //Pre-compute All of the smooth curves.
    for(var i = 0; i <= 8; i++){
        loopSubdivision.push(lineVerts.slice());
        chaikinCornerCutting();
    }
    lineVerts = loopSubdivision[0];
    calcTotalLength();
    //Web GL Setup
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL(canvas, null);
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.enable(gl.DEPTH_TEST);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    //Constant black clear color.
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    program2 = initShaders( gl, "vertex-shader-solid", "fragment-shader-solid" );
    gl.useProgram( program );

    let lightAmbient = vec4(0.4, 0.4, 0.4, 1.0 );
    let lightDiffuse = vec4( 0.8, 0.9, 1.0, 1.0 );
    let lightSpecular = vec4( 0.8, 0.9, 1.0, 1.0 );

    let materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
    let materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    let materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
    let materialShininess = 10.0;
    //Pass in parameters for lighting equations
    gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    window.addEventListener("keydown", handleKeyPress);

    // Pre-compute the vertices for each of the six possible subdivided spheres
    for (let i = 0; i <= 5; i++) {
        pointsArray = [];
        normalsArray = [];
        flatNormalsArray = [];
        cube(vertices, i);
        finalPointsArray.push(pointsArray);
        finalNormalsArray.push(normalsArray);
        finalFlatNormalsArray.push(flatNormalsArray);
    }
    //Precompute the Wireframes as well, just append them to the end of the points array.
    for (let i = 0; i <= 5; i++) {
        pointsArray = [];
        cube(vertices, i);
        finalPointsArray.push(trianglesToWireframe(pointsArray));
    }

    gl.useProgram(program);
    let modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    let projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    let eye = vec3(0.0, 10.0, 0.01);
    let at = vec3(0.0, 0.0, 0.0);
    let up = vec3(0.0, 0, -1.0);

    let modelViewMatrix = mult(translate(-7.5,6,0),lookAt(eye, at , up));
    let projectionMatrix = perspective(90.0, 1.0, 0.01, 100) ;// (-3.0, 3.0, -3.0, 3.0, 0.1, 10.0);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.useProgram(program2);
    //Pass the modelview and projection matrices to the curve shader aswell.
    let modelViewMatrixLoc2 = gl.getUniformLocation( program2, "modelViewMatrix" );
    let projectionMatrixLoc2 = gl.getUniformLocation( program2, "projectionMatrix" );
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc2, false, flatten(projectionMatrix) );
    gl.useProgram(program);
    // Pass our vertex and normal data to the shader
    passData();

    render();
}

let t = 0;//Time
function render() {
    //Update the completion % of the loop.
    if(isAnimPlaying){
        if (direction){
            t += 0.001;
            t %= 1; 
        }
        else {
            t -= 0.001;
            if (t <= 0) t = 1;
        }
    } 

    let modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    let projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    let eye = vec3(0.0, 10.0, 0.01);
    let at = vec3(0.0, 0.0, 0.0);
    let up = vec3(0.0, 0, 1);
    let pointOnLoop = getPointOnLoop(t);
    let modelViewMatrix = mult(translate(pointOnLoop[0],-pointOnLoop[2],0.0), mult(translate(-7.5,6,0),lookAt(eye, at , up)));
    let projectionMatrix = perspective(90.0, 1.0, 0.01, 100) ;// (-3.0, 3.0, -3.0, 3.0, 0.1, 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));

    passData();
    


    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(isWireframe){
        gl.drawArrays( gl.LINES, 0, finalPointsArray[numTimesToSubdivide+6].length );
    }else{
        gl.drawArrays( gl.TRIANGLES, 0, finalPointsArray[numTimesToSubdivide].length );
    }
    gl.useProgram( program2 );
    
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    let vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.LINE_LOOP, 0, lineVerts.length);

    gl.useProgram( program );
    
    requestAnimationFrame(render);
}

//Creates the Cube.
function cube(vertices, N) {
    // Define the 12 triangles that make up the cube
    let cubeTriangles = [
        [vertices[0], vertices[1], vertices[2]], [vertices[0], vertices[2], vertices[3]], // Front face
        [vertices[4], vertices[5], vertices[6]], [vertices[4], vertices[6], vertices[7]], // Back face
        [vertices[0], vertices[1], vertices[5]], [vertices[0], vertices[5], vertices[4]], // Left face
        [vertices[2], vertices[3], vertices[7]], [vertices[2], vertices[7], vertices[6]], // Right face
        [vertices[1], vertices[2], vertices[6]], [vertices[1], vertices[6], vertices[5]], // Top face
        [vertices[0], vertices[3], vertices[7]], [vertices[0], vertices[7], vertices[4]]  // Bottom face
    ];
    for (let i = 0; i < cubeTriangles.length; i++) {
        divideTriangle(cubeTriangles[i][0], cubeTriangles[i][1], cubeTriangles[i][2], N);
    }
}
//Converts a triangle into 3 lines, so that it can be rendered in wireframe view
function trianglesToWireframe(triangleVertices) {
    const lineSegments = [];
    // Process each triangle
    for (let i = 0; i < triangleVertices.length; i += 3) {
        const v1 = triangleVertices[i];
        const v2 = triangleVertices[i + 1];
        const v3 = triangleVertices[i + 2];
        lineSegments.push(v1, v2);
        lineSegments.push(v3, v2);
        lineSegments.push(v1, v3);
    }
    return lineSegments;
}

//Gets the point the cube should be at on the loop at a given completion percent. e.g 0.5 means the should should have covered half the distance of the loop.
function getPointOnLoop(t) {
    const totalDistance = t * totalLength;
    let accumulatedDistance = 0;
    let segmentIndex = 0;
  
    // Find which segment the point lies on
    while (accumulatedDistance + segmentLengths[segmentIndex] < totalDistance) {
      accumulatedDistance += segmentLengths[segmentIndex];
      segmentIndex++;
    }
    // Interpolate along the current segment
    const start = lineVerts[segmentIndex];
    const end = lineVerts[(segmentIndex + 1) % lineVerts.length];
    const segmentT = (totalDistance - accumulatedDistance) / segmentLengths[segmentIndex];
  
    const x = start[0] + segmentT * (end[0] - start[0]);
    const y = start[1] + segmentT * (end[1] - start[1]);
    const z = start[2] + segmentT * (end[2] - start[2]);
    return [x,y,z];
  }
//Corner cutting for the loop.
function chaikinCornerCutting(iterations = 1) {
    while (iterations--) {
        const newVerts = [...Array(lineVerts.length)].map((_, i) => {
            const p0 = lineVerts[i];
            const p1 = lineVerts[(i + 1) % lineVerts.length];
            return [
                [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1], 0.75 * p0[2] + 0.25 * p1[2], p0[3]],
                [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1], 0.25 * p0[2] + 0.75 * p1[2], p1[3]]
            ];
        }).flat();
        lineVerts = newVerts;
    }
}