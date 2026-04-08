//Default dimensions, set at -200, -200 so that the center is the pivot point when you rotate.
let dims = [-200,-200,400,400]

/** @type {WebGLRenderingContext} */
let gl;
let canvas;
let program;
//having this setup with two empty arrays lets you draw on an empty campus before you read any files.
let lines = [];
lines.push([]);
lines.push([]);

//Variables to keep track of the current rotation, scaling, and translation. 
let rotNum = 0;
let transX = 0;
let transY = 0;
let scaleNum = 1.0;

//The center of the coordinate system.
let centerX = 0;
let centerY = 0;

//Current Draw Color 
let drawColor = vec4(0,0,0,1.0);

const toRGB = (color) => {
    const { style } = new Option();
    style.color = color;
    cols = style.color.replace(/[^\d,]/g, '').split(',');
    vec4a = vec4(cols[0]/255.0,cols[1]/255.0,cols[2]/255.0,1)
    return vec4a;
}

//Wait for the page load before doing things.
document.addEventListener("DOMContentLoaded", function () {
    //Check if drawing color should change.
    document.getElementById('colorInput').addEventListener('input', function() {
        drawColor = toRGB(this.value);
        console.log(drawColor);
    });

    // Get the file input element
    const fileInput = document.getElementById("files");
    canvas = document.getElementById('webgl');
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    /** @type {WebGLRenderingContext} */
    gl = WebGLUtils.setupWebGL(canvas);
    //Check that the return value is not null.
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    //Set up the viewport
    gl.viewport(0, 0, canvas.width , canvas.height);
    //Set the Clear Color
    gl.clearColor(1, 1, 1, 1.0);
    //Set a default projection matrix (Needed to be able to draw on an empty scene)
    projMatrix = ortho(dims[0], dims[0]+dims[2], dims[1]+dims[3], dims[1], -1, 1)
    pushUniform(projMatrix, "projMatrix")

    //Start rendering any drawings before you load an svg.
    render();

    // Add an event listener for the 'change' event
    fileInput.addEventListener("change", function (event) {
        resetTransform();
        // Get the selected file
        let file = event.target.files[0];
        let reader = new FileReader();
        reader.readAsText(file);
        //Read the file
        reader.onload = function(){
            
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(reader.result, "image/svg+xml");
            dims = xmlGetViewbox(xmlDoc, [0,0,400,400]);
            lines = xmlGetLines(xmlDoc, dims);
            //Calculate the center of the new coordinate system
            centerX = dims[0] + dims[2]/2;
            centerY = dims[1] + dims[3]/2;

            //Set the projection matrix to be the bounds of the SVG
            let projMatrix = ortho(dims[0], dims[0]+dims[2], dims[1]+dims[3], dims[1], -1, 1)
            pushUniform(projMatrix, "projMatrix")

            //Set the viewport so the SVG isn't skewed.
            if(dims[2] > dims[3]){
                gl.viewport(0, 0, canvas.width, canvas.height * (dims[3])/(dims[2]))
            }
            else{
                gl.viewport(0, 0, canvas.width * (dims[2])/(dims[3]), canvas.height )
            }

        }
    });
    
    var shouldMove = false;
    //Hold data for after you click the second point. (If I just pushed them it gave an error).
    let tempData = [];
    canvas.addEventListener("mousedown", function (event){
        // 0 is left, 1 is middle, 2 is right
        if(event.button === 0) shouldMove = true; 
        if(!(event.button === 2)) return;
        const rect = canvas.getBoundingClientRect()
        var x = event.clientX - rect.left;
        var y = 400 - (event.clientY - rect.top);
        
        // Convert coordinate system
        var coords = canvasToWorld(x,y,dims);
        coords = getPreTransformedPoint(coords[0],coords[1])
        x = coords[0];
        y = coords[1];

        //Add a line if we have 2 vertices.
        if(tempData.length > 0){
            //Push the vertexes
            lines[0].push(tempData[0]);
            lines[0].push(vec4(x, y, 0, 1.0));
            //Push the colors
            lines[1].push(tempData[1]);
            lines[1].push(drawColor);
            tempData = []; // clear the temp vertex;
        }
        else {
            tempData.push(vec4(x, y, 0, 1.0))
            tempData.push(drawColor);
        }
    })
    // 0 is left, 1 is middle, 2 is right
    window.addEventListener("mouseup", function (event) {
        if(event.button === 0) shouldMove = false;
    })
    // 0 is left, 1 is middle, 2 is right
    window.addEventListener("mousemove", function (mouseMov) {
        if(!shouldMove) return;
        transX += (mouseMov.movementX/canvas.width) * dims[2];
        transY += mouseMov.movementY/400.0 * dims[3];
    })
    window.addEventListener("keydown", (event) => {
        console.log(event.key);
        if(event.key === 'r'){
            resetTransform();
        }



    });

    window.addEventListener("wheel", function (scrollMove) {
        if(scrollMove.shiftKey){
            if(scrollMove.deltaY < 0){
                scaleNum *= 1.33333333;
            }
            else {
                scaleNum *= 0.75; 
            }
            if(scaleNum < 0.15) scaleNum = 0.15;
            if(scaleNum > 30) scaleNum = 30;
        }
        else{
            rotNum += scrollMove.deltaY * 0.1;
        }
    })
});

function render()
{
    var points = linesToVertices(lines[0]); //Array -> Array of Vec4
    var colors = lines[1]; //Doesn't need to be converted because I only add vec4's already

    //Push the vertices and the colors.
    pushAttribute(points, "vPosition");
    pushAttribute(colors, "vColor");
    //Clear the buffer
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Calculate object transformations. 
    let rotationMatrix = mult(translate(centerX,centerY,0),mult(rotateZ(rotNum),translate(-centerX,-centerY,0)));
    let translationMatrix = translate(transX, transY, 0);
    let scaleMatrix = mult(translate(centerX,centerY,0),mult(scalem(scaleNum, scaleNum, scaleNum),translate(-centerX,-centerY,0)));
    let modelMatrix = mult(mult(translationMatrix,rotationMatrix), scaleMatrix);
    //Push the Model Matrix
    pushUniform(modelMatrix, "modelMatrix");

    //Draw Lines.
    if(lines[0].length > 0){
        gl.drawArrays(gl.LINES, 0, lines[0].length);
    }
    requestAnimationFrame(render);
}

//Parses an array into an array of vec4s
function linesToVertices(array){
    var vertices = [];
    for(var i = 0; i < array.length; i++){
        vertices.push(vec4(array[i][0], array[i][1], 0, 1.0))
    }
    return vertices;
}

//Class Provided Functions to clean up code.
function pushAttribute(data, attName) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

	let attrib = gl.getAttribLocation(program, attName);
	gl.vertexAttribPointer(attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attrib);
}
function pushUniform(data, uniformName) {
	let uniformLoc = gl.getUniformLocation(program, uniformName);
	gl.uniformMatrix4fv(uniformLoc, false, flatten(data));
}

//Converts a Canvas Coordinate to World Coordinates.
function canvasToWorld(x_c, y_c, dims) {
    // Normalize canvas coordinates (0 to 1)
    let x_n = x_c / 400;
    let y_n = y_c / 400;

    // Undo the viewport distortion
    if(dims[2] > dims[3]){
        y_n = y_n * (dims[2] / dims[3]);
    }
    if(dims[3] > dims[2]){
        x_n = x_n * (dims[3] / dims[2]);
    }

    // Convert to world coordinates
    let x_w = dims[0] + x_n * dims[2];
    let y_w = dims[1] + (1 - y_n) * dims[3];

    return [x_w, y_w];
}

// Takes a point and gets the pre transformed point. 
// I know this can be done using inverse() on the model matrix,
// but this is easier and should be just as fast. (Though I did not benchmark so I could be wrong) 
function getPreTransformedPoint(x_c, y_c) {
    // Step 1: Apply inverse translation
    let x = x_c - transX;
    let y = y_c - transY;

    // Step 2: Apply inverse rotation
    let cosTheta = Math.cos(radians(-rotNum));
    let sinTheta = Math.sin(radians(-rotNum));
    var deltaX = x-centerX;
    var deltaY = y-centerY;
    let xRot = cosTheta * (deltaX) - sinTheta * (deltaY) + centerX;
    let yRot = sinTheta * (deltaX) + cosTheta * (deltaY) + centerY;

    // Step 3: Apply inverse scale
    let xFinal = (xRot - centerX) / scaleNum + centerX;
    let yFinal = (yRot - centerY) / scaleNum + centerY;

    return [xFinal, yFinal];
}

function resetTransform(){
    transX = 0;
    transY = 0;
    rotNum = 0;
    scaleNum = 1;
}