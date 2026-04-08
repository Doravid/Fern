let canvas;
let gl;

let numVertices  = 36;

let program;

let pointsArray = [];
let colorsArray = [];
let theta;
let id;

let vertices = [
    vec4( -0.5, 0.0,  0.5, 1.0 ),
    vec4( -0.5,  1.0,  0.5, 1.0 ),
    vec4( 0.5,  1.0,  0.5, 1.0 ),
    vec4( 0.5, 0.0,  0.5, 1.0 ),
    vec4( -0.5, 0.0, -0.5, 1.0 ),
    vec4( -0.5,  1.0, -0.5, 1.0 ),
    vec4( 0.5,  1.0, -0.5, 1.0 ),
    vec4( 0.5, 0.0, -0.5, 1.0 )
];

let vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

let thetaLoc;


function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


function init(shader) {

    if(id) {
        cancelAnimationFrame(id);
    }

    theta = 0;

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas, null );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, shader, "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    let cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    let vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    let vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    let vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    modelMatrix = mat4();

    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    let cameraMatrix = lookAt(vec3(1, 2, 2), vec3(0, 2, 0), vec3(0, 1, 0));
    let cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
    gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));

    let projMatrix = perspective(120, 1, 0.1, 10);
    let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));

    render();

}

let modelMatrix;
let modelMatrixLoc;

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta += 0.01;

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform1f(thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    let secondCube = mult(translate(0.0, 1.0, 0.0), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(secondCube));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    let thirdCube = mult(translate(0.0, 2.0, 0.0), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(thirdCube));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    let fourthCube = mult(translate(0.0, 3.0, 0.0), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(fourthCube));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    id = requestAnimFrame(render);
}
