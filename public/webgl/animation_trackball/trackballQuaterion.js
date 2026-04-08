let canvas;
let gl;

let numVertices  = 36;

let points = [];
let colors = [];

let rotationMatrix;
let rotationMatrixLoc;

let angle = 0.0;
let axis = [0, 0, 1];

let trackingMouse = false;
let trackballMove = false;

let lastPos = [0, 0, 0];
let curX = 0, curY = 0;
let startX = 0, startY = 0;


/**
 * Returns the selected coordinate on the unit sphere that
 * represents our trackball.
 *
 * @param x The x-coordinate on the unit sphere
 * @param y The y-coordinate on the unit sphere
 * @returns {number[]} The vec3 that represents the x, y, and z coordinates on the unit sphere.
 */
function trackballView( x,  y ) {
    let v = [];
    let z = Math.sqrt(1 - x*x - y*y);
    v = [x,y,z];
    return v;
}

/**
 * Calculates the angle and axis of rotation since the last frame draw.
 *
 * @param x The x-coordinate on the unit sphere
 * @param y The y-coordinate on the unit sphere
 */
function mouseMotion( x,  y)
{
    let dx, dy, dz;

    let curPos = trackballView(x, y);
    if(trackingMouse) {

        dx = curPos[0] - lastPos[0];
        dy = curPos[1] - lastPos[1];
        dz = curPos[2] - lastPos[2];

        //Update angle and axis
        if (dx || dy || dz) {
            let crossP = cross(curPos, lastPos);
            axis = crossP;
            let mag = Math.sqrt(crossP[0]*crossP[0] + crossP[1]*crossP[1] + crossP[2]*crossP[2]);
            angle =  Math.asin(mag);
            rotationMatrix = mult(rotate(angle,axis),rotationMatrix);
        }
    }
}

function startMotion( x,  y)
{
    trackingMouse = true;
    trackballMove = true;

    startX = x;
    startY = y;
    curX = x;
    curY = y;

    lastPos = trackballView(x, y);
}

function stopMotion( x,  y)
{
    trackingMouse = false;
    trackballMove = false;
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas, null );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    let cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    let vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    let vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    let vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    rotationMatrix = mat4();
    rotationMatrixLoc = gl.getUniformLocation(program, "rotMatrix");
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(mat4()));

    canvas.addEventListener("mousedown", function(event){
      let x = 2 * event.clientX/canvas.width - 1;
      let y = 2 * (canvas.height - event.clientY)/canvas.height - 1;
      startMotion(x, y);
    });

    canvas.addEventListener("mouseup", function(event){
      let x = 2 * event.clientX/canvas.width - 1;
      let y = 2 * (canvas.height - event.clientY)/canvas.height - 1;
      stopMotion(x, y);
    });

    canvas.addEventListener("mousemove", function(event){
      let x = 2 * event.clientX/canvas.width - 1;
      let y = 2 * (canvas.height - event.clientY)/canvas.height - 1;
      mouseMotion(x, y);
    });

    render();
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

function quad(a, b, c, d)
{
    let vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    let vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    let indices = [ a, b, c, a, c, d ];

    for ( let i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
    }
}
let currentMat;
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //curMat = rotate(angle,axis);
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices);
    requestAnimationFrame(render);
}
