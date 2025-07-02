// components/WebGLCanvas.tsx
import React, { useRef, useEffect, useCallback } from "react";
import { mul } from "three/tsl";

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
const numParticles = 200;
const radius = 0.03; // Particle radius for collision/visuals
const canvasSize = 1.0; // Assuming clip space range from -1 to 1

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
  radius;

  constructor(
    position: Vec2,
    velocity: Vec2,
    color: Vec4,
    radius: number = 0.3
  ) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.radius = radius;
  }

  update(dt: number) {
    this.velocity[1] -= 3 * dt;
    this.position = add(this.position, scale(dt, this.velocity)) as Vec2;
  }

  /**
   * Handles collisions between this particle and the four walls.
   * Uses simple bounce logic by inverting position if boundary is crossed.
   */
  handleWallCollisions(restitution: number = 0.8) {
    // Left and right walls
    if (this.position[0] - this.radius <= -canvasSize) {
      this.position[0] = -canvasSize + this.radius; // Move particle just inside boundary
      this.velocity[0] = -this.velocity[0] * restitution; // Reverse and dampen velocity
    } else if (this.position[0] + this.radius >= canvasSize) {
      this.position[0] = canvasSize - this.radius; // Move particle just inside boundary
      this.velocity[0] = -this.velocity[0] * restitution; // Reverse and dampen velocity
    }

    // Top and bottom walls
    if (this.position[1] - this.radius <= -canvasSize) {
      this.position[1] = -canvasSize + this.radius; // Move particle just inside boundary
      this.velocity[1] = -this.velocity[1] * restitution; // Reverse and dampen velocity
    } else if (this.position[1] + this.radius >= canvasSize) {
      this.position[1] = canvasSize - this.radius; // Move particle just inside boundary
      this.velocity[1] = -this.velocity[1] * restitution; // Reverse and dampen velocity
    }
  }

  /**
   * Handles interaction (chase/flee/convert) between this particle and another particle p.
   * @param p The other particle for interaction.
   */
  handleParticleCollisions(p: Particle) {
    const deltaX = this.position[0] - p.position[0];
    const deltaY = this.position[1] - p.position[1];
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const minDistance = this.radius + p.radius;

    if (distance < minDistance) {
      const actualDistance = Math.max(distance, 0.001);

      const dirX = deltaX / actualDistance;
      const dirY = deltaY / actualDistance;
      const relativeVelX = this.velocity[0] - p.velocity[0];
      const relativeVelY = this.velocity[1] - p.velocity[1];

      const relativeVelNormal = relativeVelX * dirX + relativeVelY * dirY;

      if (relativeVelNormal > 0) return;

      const restitution = 0.8;

      const impulse = (-(1 + restitution) * relativeVelNormal) / 2;

      const impulseX = impulse * dirX;
      const impulseY = impulse * dirY;

      this.velocity[0] += impulseX;
      this.velocity[1] += impulseY;
      p.velocity[0] -= impulseX;
      p.velocity[1] -= impulseY;
      const overlap = minDistance - actualDistance;
      const separationX = (overlap / 2) * dirX;
      const separationY = (overlap / 2) * dirY;

      this.position[0] += separationX;
      this.position[1] += separationY;
      p.position[0] -= separationX;
      p.position[1] -= separationY;
    }
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

    gl.uniform1f(pointSizeUniformLocation, gl.canvas.width * this.radius); // Set point size for main particle
    gl.drawArrays(gl.POINTS, 0, 1);
  }
  handleMouseForce(dt: number) {
    // Pass delta time
    if (!isOnCanvas) return;
    const deltaX = this.position[0] - mouseX;
    const deltaY = this.position[1] - mouseY;
    const distanceSq = deltaX * deltaX + deltaY * deltaY;
    const distance = Math.sqrt(distanceSq);
    if (distance > this.radius * 10 || distance === 0) return;

    const scaleFactor = 1 / distance;
    const dirVec = scale(
      scaleFactor,
      normalize([deltaX, deltaY], false) as Vec2
    );

    // Make force proportional to time, not frame rate
    const forceStrength = 1; // Adjust this value
    this.velocity[0] += dirVec[0] * forceStrength * dt;
    this.velocity[1] += dirVec[1] * forceStrength * dt;
  }
}

let mouseX: number = 0;
let mouseY: number = 0;
let isOnCanvas: boolean = false;
let isMobile = false;
// Helper function to get coordinates from mouse or touch event

const Particles: React.FC = () => {
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
      p.update(dt);
      p.render(gl, positionBuffer, colorBuffer, pointSizeUniformLocation);
      p.handleMouseForce(dt);
    }

    webglState.current.animationFrameId = requestAnimationFrame(renderLoop);
  }, []); // Dependencies are stable refs, so useCallback is effective

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found.");
      return;
    }

    // Initialize WebGL context
    const gl = setupWebGL(canvas) as WebGLRenderingContext;
    webglState.current.gl = gl;
    function normalizeCoordinates(
      clientX: number,
      clientY: number,
      rect: DOMRect
    ): [number, number] {
      const mX = clientX - rect.left;
      const mY = clientY - rect.top;
      const normalizedX = (mX / canvas.width) * 2 - 1;
      const normalizedY = (mY / canvas.height) * -2 + 1;
      return [normalizedX, normalizedY];
    }
    function updateMousePosition(clientX: number, clientY: number) {
      const rect = canvas?.getBoundingClientRect();
      [mouseX, mouseY] = normalizeCoordinates(clientX, clientY, rect);
    }

    // Mouse event listeners (updated to use helper function)
    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      updateMousePosition(event.clientX, event.clientY);
    });

    canvas.addEventListener("mouseleave", (event: MouseEvent) => {
      isOnCanvas = false;
    });

    canvas.addEventListener("mouseenter", (event: MouseEvent) => {
      isOnCanvas = true;
    });

    // Touch event listeners
    canvas.addEventListener("touchstart", (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling and other default behaviors
      isOnCanvas = true;
      isMobile = true;
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateMousePosition(touch.clientX, touch.clientY);
      }
    });

    canvas.addEventListener("touchmove", (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateMousePosition(touch.clientX, touch.clientY);
      }
    });

    canvas.addEventListener("touchend", (event: TouchEvent) => {
      event.preventDefault();
      isOnCanvas = false;
    });

    canvas.addEventListener("touchcancel", (event: TouchEvent) => {
      event.preventDefault();
      isOnCanvas = false;
    });

    canvas.width = window.innerHeight / 3;
    canvas.height = window.innerHeight / 3;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.85, 0.85, 0.95, 1.0); // Black background

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
      let rando = Math.max(Math.random(), 0.4);
      color = vec4(0.4 * rando, 0.4 * rando, 1.0 * rando, 1) as Vec4; // Blue
      initialParticles.push(
        new Particle(
          position,
          normalizedVelocity,
          color,
          Math.random() * 0.03 + 0.015
        )
      );
    }
    particlesRef.current = initialParticles;

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

export default Particles;
