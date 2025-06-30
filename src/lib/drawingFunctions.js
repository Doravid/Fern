function createCannon() {
  const sides = 32;
  const radius = 0.05;
  const length = 0.6;
  const base = vec3(0, 0, 0);
  const rad = (angle * Math.PI) / 180;

  // Direction the cannon is facing
  const dir = normalize(vec3(Math.cos(rad), Math.sin(rad), 0));
  const up = vec3(0, 0, 1); // original axis of cylinder
  const axis = cross(up, dir);
  const angleBetween = Math.acos(dot(up, dir));

  for (let i = 0; i < sides; i++) {
    const theta1 = (i / sides) * 2 * Math.PI;
    const theta2 = ((i + 1) / sides) * 2 * Math.PI;

    const x1 = radius * Math.cos(theta1);
    const y1 = radius * Math.sin(theta1);
    const x2 = radius * Math.cos(theta2);
    const y2 = radius * Math.sin(theta2);

    // Two points on base and tip circles
    let p0 = vec3(x1, y1, 0);
    let p1 = vec3(x2, y2, 0);
    let p2 = vec3(x1, y1, length);
    let p3 = vec3(x2, y2, length);

    // Rotate the points into cannon direction
    p0 = rotateVec(p0, axis, angleBetween);
    p1 = rotateVec(p1, axis, angleBetween);
    p2 = rotateVec(p2, axis, angleBetween);
    p3 = rotateVec(p3, axis, angleBetween);

    // Translate to base position
    p0 = add(base, p0);
    p1 = add(base, p1);
    p2 = add(base, p2);
    p3 = add(base, p3);

    // Add triangles
    vertices.push(vec4(...p0, 1), vec4(...p1, 1), vec4(...p2, 1));
    vertices.push(vec4(...p2, 1), vec4(...p1, 1), vec4(...p3, 1));

    const n1 = normalize(vec3(-1 * x1, -1 * y1, 0));
    const n2 = normalize(vec3(-1 * x2, -1 * y2, 0));
    normals.push(n1, n2, n1, n1, n2, n2);
  }
}

// Helper to rotate a vector around an axis by angle (Rodrigues' rotation formula)
function rotateVec(v, axis, angle) {
  if (length(axis) < 0.0001) return v;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const dotVA = dot(v, axis);
  const crossVA = cross(axis, v);

  const term1 = scale(cosA, v);
  const term2 = scale(sinA, crossVA);
  const term3 = scale((1 - cosA) * dotVA, axis);

  return add(add(term1, term2), term3);
}

function createBall() {
  const r = 0.05;
  const slices = 20;
  vertices = [];
  normals = [];
  for (let i = 0; i < slices; i++) {
    let theta1 = (i / slices) * 2 * Math.PI;
    let theta2 = ((i + 1) / slices) * 2 * Math.PI;

    vertices.push(
      vec4(0, 0, 0, 1),
      vec4(r * Math.cos(theta1), r * Math.sin(theta1), 0, 1),
      vec4(r * Math.cos(theta2), r * Math.sin(theta2), 0, 1)
    );
    normals.push(vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1));
  }
}
