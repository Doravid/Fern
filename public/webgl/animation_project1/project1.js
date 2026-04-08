let canvas;
let gl;

let numVertices  = 36;

let points = [];
let colors = [];

let modelMatrix;
let modelMatrixLoc;

let mySpline;


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


    let eye = vec3(5,6,5);
    let at = vec3(4.9,4.5,0);
    let up = vec3(0,1,0);
    modelMatrix = lookAt(eye,at,up);
    
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));



    perspectiveMatrix = perspective(90.0, 1.0, 0.01, 100);
    perspectiveMatrixLoc = gl.getUniformLocation(program, "perspectiveMatrix");
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));

    document.getElementById('files').onchange = function() {
      var file = this.files[0];
    
      var reader = new FileReader();
      reader.onload = function() {
        const text = this.result;
    
        // By lines
        var lines = text.split('\n');
        lines = lines.filter(element => element[0] !== '#' && element.length > 0)
        
        for (var line = 0; line < lines.length; line++) {
            lines[line] = lines[line].split(',');
        }
        let numPoints = parseInt(lines[1]);
        console.log(numPoints);
        let numSeconds = parseFloat(lines[2]);
        let controlPoints = [];
        let rotAngles = [];
        for(let j = 3; j < 3 + (2*numPoints); j+=2){
            controlPoints.push([parseFloat(lines[j][0]),parseFloat(lines[j][1]),parseFloat(lines[j][2])]);
            rotAngles.push([parseFloat(lines[j+1][0]),parseFloat(lines[j+1][1]),parseFloat(lines[j+1][2])]);
        }

        mySpline = new Spline(numPoints, numSeconds, controlPoints, rotAngles);
        mySpline.printSpline();
        //Only start rendering once the file is parsed.
        render();
      };
      reader.readAsText(file);
    };
    
    
}

function colorCube()
{
    colorQuad( 1, 0, 3, 2 );
    colorQuad( 2, 3, 7, 6 );
    colorQuad( 3, 0, 4, 7 );
    colorQuad( 6, 5, 1, 2 );
    colorQuad( 4, 5, 6, 7 );
    colorQuad( 5, 4, 0, 1 );
}

function colorQuad(a, b, c, d)
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
let time = 0;
let catmull = true;
let rotating = false;
function render()
{
    //Animation update
    time += 0.0003; //if its too slow or fast just change this value
    if(time >= 1){
        if(!catmull){
            rotating = true;
        }
        catmull = false;
        time = 0;
    }
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let offset;
    let temp = getInterpolatedRotation(mySpline.eulerRotations, time);
    let rotateMat = rotate(temp.angle, temp.axis);
    if(catmull){
        offset = getCatmullRomPoint(mySpline.controlPoints, time); 
    }else offset = getBSplinePoint(mySpline.controlPoints, time);
    console.log(offset);
    
    mat = mult(translate(offset[0],offset[1],offset[2]),mult(modelMatrix,rotateMat) );
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices);
    requestAnimationFrame(render);
}


class Spline {
    constructor(numControlPoints, timeToTraverse, controlPoints, eulerRotations) {
        this.numControlPoints = numControlPoints;
        this.timeToTraverse = timeToTraverse;
        this.controlPoints = controlPoints;
        this.eulerRotations = eulerRotations;
    }

    printSpline() {
        console.log("Number of Control Points: " + this.numControlPoints + 
                    "\nTime To Traverse: " + this.timeToTraverse + 
                    "\nPoints: " );
        for(let i = 0; i < this.controlPoints.length; i++){
            console.log(this.controlPoints[i]);
        }
        console.log("Rotations: ");
        for(let i = 0; i < this.controlPoints.length; i++){
            console.log(this.eulerRotations[i]);
        }
    }
}
function getCatmullRomPoint(points, t) {
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
    
    // Calculate point coordinates using Catmull-Rom basis functions
    const t2 = localT * localT;
    const t3 = t2 * localT;
    
    const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * localT +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
    );
    
    const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * localT +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
    );
    
    const z = 0.5 * (
        (2 * p1[2]) +
        (-p0[2] + p2[2]) * localT +
        (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
        (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3
    );
    
    return [x, y, z];
}

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
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ],
        [ 0.0, 1.0, 0.0, 1.0 ] 
    ];

    let indices = [ a, b, c, a, c, d ];

    for ( let i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
    }
}


//Convert to quaternions
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