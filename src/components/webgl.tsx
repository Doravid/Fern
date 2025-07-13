// components/WebGLCanvas.tsx
import React, { useRef, useEffect, useCallback } from "react";

//////////////////////////////////////////////////////////////////////////////
//
// Inlined Angel.js (Math Utilities) - Only necessary functions included
//
//////////////////////////////////////////////////////////////////////////////

// Helper function to flatten arguments into a single array
function _argumentsToArray(args: IArguments): number[] {
  return ([] as number[]).concat.apply([], Array.prototype.slice.apply(args));
}

//----------------------------------------------------------------------------
// Vector Constructors and Types

export type Vec2 = [number, number];
export type Vec3 = [number, number, number]; // Included for flatten's generic type, even if not directly used for operations
export type Vec4 = [number, number, number, number];

export function vec2(...args: number[]): Vec2 {
  const result = _argumentsToArray(arguments);
  switch (result.length) {
    case 0:
      result.push(0.0);
    case 1:
      result.push(0.0);
  }
  return result.splice(0, 2) as Vec2;
}

export function vec4(...args: number[]): Vec4 {
  const result = _argumentsToArray(arguments);
  switch (result.length) {
    case 0:
      result.push(0.0);
    case 1:
      result.push(0.0);
    case 2:
      result.push(0.0);
    case 3:
      result.push(1.0);
  }
  return result.splice(0, 4) as Vec4;
}

//----------------------------------------------------------------------------
// Matrix Types (needed for VectorOrMatrix in flatten)

export type Mat2 = Vec2[] & { matrix?: boolean };
export type Mat3 = Vec3[] & { matrix?: boolean };
export type Mat4 = Vec4[] & { matrix?: boolean };

type VectorOrMatrix = number[] | (number[][] & { matrix?: boolean });

//----------------------------------------------------------------------------
// Generic Mathematical Operations for Vectors

export function add(u: VectorOrMatrix, v: VectorOrMatrix): VectorOrMatrix {
  const result: number[] | number[][] = [];

  // Assuming only vector-vector addition is used in this specific simulation.
  // Original Angel.js has matrix-matrix and matrix-non-matrix checks.
  // Keeping only vector-vector logic as per "only port what I actually use".
  if (u.length !== v.length) {
    throw new Error("add(): vectors are not the same dimension");
  }

  for (let i = 0; i < u.length; ++i) {
    (result as number[]).push((u as number[])[i] + (v as number[])[i]);
  }
  return result as VectorOrMatrix;
}

export function scale(s: number, u: number[]): number[] {
  if (!Array.isArray(u)) {
    throw new Error("scale: second parameter " + u + " is not a vector");
  }
  const result: number[] = [];
  for (let i = 0; i < u.length; ++i) {
    result.push(s * u[i]);
  }
  return result;
}

//----------------------------------------------------------------------------
// Vector Functions (dependencies for normalize)

export function dot(u: number[], v: number[]): number {
  if (u.length !== v.length) {
    throw new Error("dot(): vectors are not the same dimension");
  }

  let sum = 0.0;
  for (let i = 0; i < u.length; ++i) {
    sum += u[i] * v[i];
  }
  return sum;
}

export function length(u: number[]): number {
  return Math.sqrt(dot(u, u));
}

export function normalize<T extends number[]>(
  u: T,
  excludeLastComponent?: boolean
): T {
  let tempU = [...u]; // Create a copy to avoid modifying original array for pop/push
  let last: number | undefined;

  if (excludeLastComponent && tempU.length > 0) {
    last = tempU.pop();
  }

  const len = length(tempU);

  if (!Number.isFinite(len) || len === 0) {
    console.warn(
      "normalize: vector " +
        u +
        " has zero or non-finite length, returning original."
    );
    return u; // Return original if cannot normalize
  }

  for (let i = 0; i < tempU.length; ++i) {
    tempU[i] /= len;
  }

  if (excludeLastComponent && last !== undefined) {
    tempU.push(last);
  }

  return tempU as T;
}

//----------------------------------------------------------------------------
// Flatten for WebGL buffers

export function flatten(v: VectorOrMatrix): Float32Array {
  // This version of flatten simplified assuming it's mostly used for vectors
  // within the particle simulation. If matrix flattening were truly needed,
  // the full transpose and matrix check would need to be re-added,
  // along with a minimal `transpose` function.
  // For the given use case (flattening vec2/vec4 positions/colors), this simplified version is fine.

  let n = v.length;
  let elemsAreArrays = false;

  if (Array.isArray(v[0])) {
    elemsAreArrays = true;
    n *= (v[0] as number[]).length;
  }

  const floats = new Float32Array(n);
  let idx = 0;

  if (elemsAreArrays) {
    for (let i = 0; i < v.length; ++i) {
      for (let j = 0; j < (v[i] as number[]).length; ++j) {
        floats[idx++] = (v[i] as number[])[j];
      }
    }
  } else {
    for (let i = 0; i < v.length; ++i) {
      floats[i] = (v as number[])[i];
    }
  }
  return floats;
}

//////////////////////////////////////////////////////////////////////////////
//
// Inlined WebGL Helper Utilities - Only necessary functions included
//
//////////////////////////////////////////////////////////////////////////////

/**
 * Creates and compiles a shader.
 * @param gl The WebGLRenderingContext.
 * @param type The type of shader (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
 * @param source The GLSL source code for the shader.
 * @returns The compiled WebGLShader or null if compilation fails.
 */
function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error("An error occurred compiling the shaders: " + info);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Creates a WebGL program from vertex and fragment shader sources.
 * @param gl The WebGLRenderingContext.
 * @param vsSource The GLSL source code for the vertex shader.
 * @param fsSource The GLSL source code for the fragment shader.
 * @returns The linked WebGLProgram or null if linking fails.
 */
function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create program");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error("Unable to initialize the shader program: " + info);
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * Initializes a WebGL context for the given canvas.
 * Mimics WebGLUtils.setupWebGL
 * @param canvas The HTMLCanvasElement to get the context from.
 * @param attribs Optional WebGLContextAttributes.
 * @returns The WebGLRenderingContext or null if not available.
 */
function setupWebGL(
  canvas: HTMLCanvasElement,
  attribs?: WebGLContextAttributes
): WebGLRenderingContext | null {
  const names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  let context: WebGLRenderingContext | null = null;
  for (let i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i] as "webgl", {
        antialias: true,
        ...attribs,
      }) as WebGLRenderingContext;
    } catch (e) {
      // Ignore errors and try next name
    }
    if (context) {
      break;
    }
  }
  return context;
}

//////////////////////////////////////////////////////////////////////////////
//
// WebGLCanvas Component and Simulation Logic
//
//////////////////////////////////////////////////////////////////////////////

// Define GLSL Shaders
const vertexShaderSource = `
  attribute vec4 vPosition;
  attribute vec4 vColor;
  uniform float pointSize;
  varying vec4 fColor;

  void main() {
    gl_Position = vPosition;
    gl_PointSize = pointSize; // Set point size from uniform
    fColor = vColor;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec4 fColor;

  void main() {
    // Render a circular point
    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (dist > 0.5) {
      discard; // Discard fragments outside the circle
    }
    gl_FragColor = fColor;
  }
`;

// Simulation constants
const numParticles = 75;
const radius = 0.02; // Particle radius for collision/visuals
const headDistance = 0.04; // Distance of the "head" point from the particle center
const canvasSize = 1.0; // Assuming clip space range from -1 to 1
const numObstacles = 4; // This constant should be correctly defined and accessible.

// Using refs for mutable WebGL state and simulation data
interface WebGLState {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  positionBuffer: WebGLBuffer | null;
  colorBuffer: WebGLBuffer | null;
  vPosition: number;
  vColor: number;
  pointSizeUniformLocation: WebGLUniformLocation | null;
  animationFrameId: number | null;
}

// Particle class to manage position and velocity
class Particle {
  position: Vec2;
  velocity: Vec2;
  color: Vec4;

  constructor(position: Vec2, velocity: Vec2, color: Vec4) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
  }

  update(dt: number) {
    this.position = add(this.position, scale(dt, this.velocity)) as Vec2;
  }

  /**
   * Handles collisions between this particle and the four walls.
   * Uses simple bounce logic by inverting position if boundary is crossed.
   */
  handleWallCollisions() {
    if (Math.abs(this.position[0]) + radius >= canvasSize) {
      this.position[0] *= -0.99;
    }
    if (Math.abs(this.position[1]) + radius >= canvasSize) {
      this.position[1] *= -0.99;
    }
  }

  /**
   * Handles interaction (chase/flee/convert) between this particle and another particle p.
   * @param p The other particle for interaction.
   */
  handleParticleCollisions(p: Particle) {
    let deltaX = this.position[0] - p.position[0];
    let deltaY = this.position[1] - p.position[1];
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    //Ignore if they particles cant see each other.
    if (distance > radius * 10) {
      return;
    }
    const thisSpeed = Math.sqrt(this.velocity[0] ** 2 + this.velocity[1] ** 2);
    const theirSpeed = Math.sqrt(p.velocity[0] ** 2 + p.velocity[1] ** 2);
    let scaleFactor = 1 / distance ** 2;
    let dirVec = scale(scaleFactor, normalize([deltaX, deltaY]));

    // Check what relationship the particles have.
    const thisColorIndex =
      this.color[0] === 1.0 ? 0 : this.color[1] === 1.0 ? 1 : 2;
    const otherColorIndex = p.color[0] === 1.0 ? 0 : p.color[1] === 1.0 ? 1 : 2;
    const chases = (thisColorIndex + 1) % 3 === otherColorIndex;
    const flees = (otherColorIndex + 1) % 3 === thisColorIndex;

    if (chases || flees) {
      const scalingFactor = 0.0001 * (chases ? -1.0 : 1.0);

      for (let i = 0; i < 2; i++) {
        this.velocity[i] += dirVec[i] * scalingFactor;
        p.velocity[i] += dirVec[i] * scalingFactor;
      }

      // Re-normalize velocities to maintain original speed
      this.velocity = scale(
        thisSpeed,
        normalize(this.velocity, false) as Vec2
      ) as Vec2;
      p.velocity = scale(
        theirSpeed,
        normalize(p.velocity, false) as Vec2
      ) as Vec2;
    }

    // Handle color changing if close enough (conversion)
    if (distance <= radius * 2.5) {
      // Using original conversion radius
      if (chases) {
        p.color = [...this.color] as Vec4; // Predator converts prey
      } else if (flees) {
        this.color = [...p.color] as Vec4; // Prey gets converted by predator
      }
    }
  }

  /**
   * Applies repulsive force from obstacles.
   * @param obstacles The array of obstacles.
   */
  handleObstacleForce(obstacles: Obstacle[]) {
    const speed = length(this.velocity);
    for (let i = 0; i < obstacles.length; i++) {
      // Correctly using obstacles.length
      const obstacle = obstacles[i];
      const deltaX = this.position[0] - obstacle.position[0];
      const deltaY = this.position[1] - obstacle.position[1];

      const distanceSq = deltaX * deltaX + deltaY * deltaY;
      const distance = Math.sqrt(distanceSq);

      // If the particle can't see the obstacle, ignore it.
      if (distance > radius * 10) {
        // Using original senseRadius for obstacle
        continue;
      }

      if (distance === 0) continue; // Avoid division by zero

      const scaleFactor = 1 / distance; // Inverse distance for force calculation
      const dirVec = scale(
        scaleFactor,
        normalize([deltaX, deltaY], false) as Vec2
      );

      this.velocity[0] += dirVec[0] * 0.0005; // Repulsive force magnitude
      this.velocity[1] += dirVec[1] * 0.0005;
    }
    // Re-normalize velocity to maintain original speed
    this.velocity = scale(
      speed,
      normalize(this.velocity, false) as Vec2
    ) as Vec2;
  }

  getHeadPosition(): Vec2 {
    const speed = length(this.velocity);
    if (speed === 0) return this.position; // Avoid division by zero if stationary

    const normalizedVelocity = [
      this.velocity[0] / speed,
      this.velocity[1] / speed,
    ] as Vec2;
    return [
      this.position[0] + normalizedVelocity[0] * headDistance,
      this.position[1] + normalizedVelocity[1] * headDistance,
    ];
  }

  // Draw particle as a point with a separate head point
  render(
    gl: WebGLRenderingContext,
    positionBuffer: WebGLBuffer,
    colorBuffer: WebGLBuffer,
    pointSizeUniformLocation: WebGLUniformLocation | null
  ) {
    // Draw main particle
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.position));

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.color));

    gl.uniform1f(pointSizeUniformLocation, gl.canvas.width / 20); // Set point size for main particle
    gl.drawArrays(gl.POINTS, 0, 1);

    // Draw head particle
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.getHeadPosition()));

    gl.uniform1f(pointSizeUniformLocation, gl.canvas.width / 30); // Set smaller point size for head
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Obstacle {
  position: Vec2;
  color: Vec4;

  constructor(position: Vec2, color: Vec4) {
    this.position = position;
    this.color = color;
  }

  render(
    gl: WebGLRenderingContext,
    positionBuffer: WebGLBuffer,
    colorBuffer: WebGLBuffer,
    pointSizeUniformLocation: WebGLUniformLocation | null
  ) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.position));

    // Outer "sense" color (more transparent)
    const outerColor = [...this.color] as Vec4;
    outerColor[3] = 0.1; // More transparent for the outer ring
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(outerColor));

    gl.uniform1f(pointSizeUniformLocation, 70.0); // Larger size for outer ring
    gl.drawArrays(gl.POINTS, 0, 1);

    // Inner core color (opaque)
    const innerColor = [...this.color] as Vec4;
    innerColor[3] = 1.0; // Opaque for the core
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(innerColor));

    gl.uniform1f(pointSizeUniformLocation, 22.0); // Smaller size for the core
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglState = useRef<WebGLState>({
    gl: null,
    program: null,
    positionBuffer: null,
    colorBuffer: null,
    vPosition: -1,
    vColor: -1,
    pointSizeUniformLocation: null,
    animationFrameId: null,
  });
  const particlesRef = useRef<Particle[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastTimeRef = useRef<number>(0);

  // Animation loop function
  const renderLoop = useCallback((currentTime: DOMHighResTimeStamp) => {
    const {
      gl,
      program,
      positionBuffer,
      colorBuffer,
      pointSizeUniformLocation,
    } = webglState.current;
    if (
      !gl ||
      !program ||
      !positionBuffer ||
      !colorBuffer ||
      pointSizeUniformLocation === null
    ) {
      console.warn("WebGL not fully initialized for rendering.");
      return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    const currentTimeSeconds = currentTime * 0.0004;
    const dt = currentTimeSeconds - lastTimeRef.current;
    lastTimeRef.current = currentTimeSeconds; // Update lastTime for next frame

    const currentParticles = particlesRef.current;
    const currentObstacles = obstaclesRef.current;

    // Handle collisions between particles
    for (let i = 0; i < currentParticles.length; i++) {
      for (let j = i + 1; j < currentParticles.length; j++) {
        const pi = currentParticles[i];
        const pj = currentParticles[j];
        pi.handleParticleCollisions(pj);
      }
    }

    // Update and render all particles
    for (const p of currentParticles) {
      p.handleWallCollisions();
      p.handleObstacleForce(currentObstacles); // Pass obstacles to particle for force calculation
      p.update(dt);
      p.render(gl, positionBuffer, colorBuffer, pointSizeUniformLocation);
    }

    // Render all obstacles
    for (const o of currentObstacles) {
      o.render(gl, positionBuffer, colorBuffer, pointSizeUniformLocation);
    }

    webglState.current.animationFrameId = requestAnimationFrame(renderLoop);
  }, []); // Dependencies are stable refs, so useCallback is effective

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found.");
      return;
    }

    // Initialize WebGL context
    const gl = setupWebGL(canvas) as WebGLRenderingContext;
    webglState.current.gl = gl;

    canvas.width = window.innerHeight / 3;
    canvas.height = window.innerHeight / 3;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background

    // Create shader program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
      console.error("Failed to create WebGL program.");
      return;
    }
    gl.useProgram(program);
    webglState.current.program = program;

    // Get attribute and uniform locations
    const vPosition = gl.getAttribLocation(program, "vPosition");
    const vColor = gl.getAttribLocation(program, "vColor");
    const pointSizeUniformLocation = gl.getUniformLocation(
      program,
      "pointSize"
    );

    if (
      vPosition === -1 ||
      vColor === -1 ||
      pointSizeUniformLocation === null
    ) {
      console.error("Failed to get attribute or uniform location.");
      return;
    }
    webglState.current.vPosition = vPosition;
    webglState.current.vColor = vColor;
    webglState.current.pointSizeUniformLocation = pointSizeUniformLocation;

    // Create global buffers to be reused for each particle/obstacle
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vec2(0, 0)), gl.DYNAMIC_DRAW); // Initialize with dummy data
    webglState.current.positionBuffer = positionBuffer;

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      flatten(vec4(1.0, 1.0, 1.0, 1.0)),
      gl.DYNAMIC_DRAW
    ); // Initialize
    webglState.current.colorBuffer = colorBuffer;

    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Initialize particles
    const initialParticles: Particle[] = [];
    for (let i = 0; i < numParticles; ++i) {
      const position = vec2(Math.random() * 2 - 1, Math.random() * 2 - 1);
      const velocity = vec2(Math.random() - 0.5, Math.random() - 0.5);

      // Normalize initial velocity
      const initialSpeed = length(velocity);
      // Ensure initialSpeed is not zero to prevent division by zero
      const normalizedVelocity =
        initialSpeed === 0
          ? vec2(0, 0)
          : (scale(1 / initialSpeed, velocity) as Vec2);

      let color: Vec4;
      if (i < numParticles / 3) {
        color = vec4(0.2, 0.2, 1.0, 1) as Vec4; // Blue
      } else if (i < (2 * numParticles) / 3) {
        color = vec4(0.2, 1, 0.2, 1) as Vec4; // Green
      } else {
        color = vec4(1, 0.2, 0.2, 1) as Vec4; // Red
      }
      initialParticles.push(new Particle(position, normalizedVelocity, color));
    }
    particlesRef.current = initialParticles;

    // Initialize obstacles
    const initialObstacles: Obstacle[] = [];
    for (let i = 0; i < numObstacles; i++) {
      // Using numObstacles here for initialization
      const position = vec2(Math.random() * 2 - 1, Math.random() * 2 - 1);
      initialObstacles.push(
        new Obstacle(position, vec4(0.95, 0.5, 0.85, 1) as Vec4)
      );
    }
    obstaclesRef.current = initialObstacles;

    // Start the animation loop
    lastTimeRef.current = performance.now() * 0.001; // Initialize lastTime in seconds
    webglState.current.animationFrameId = requestAnimationFrame(renderLoop);

    // Cleanup function
    return () => {
      if (webglState.current.animationFrameId !== null) {
        cancelAnimationFrame(webglState.current.animationFrameId);
      }
      // Clean up WebGL resources
      if (gl) {
        if (webglState.current.program)
          gl.deleteProgram(webglState.current.program);
        if (webglState.current.positionBuffer)
          gl.deleteBuffer(webglState.current.positionBuffer);
        if (webglState.current.colorBuffer)
          gl.deleteBuffer(webglState.current.colorBuffer);
      }
    };
  }, [renderLoop]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        margin: "0 auto",
        background: "#000",
        borderRadius: "15px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      Your browser does not support the HTML5 Canvas element.
    </canvas>
  );
};

export default WebGLCanvas;
