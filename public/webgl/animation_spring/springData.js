
// Spring vertex and normal arrays will be generated dynamically and stored here
let springPoints = [];
let normals = [];

function generateSpringGeometry(currentLength) {
    springPoints = [];
    normals = [];

    const numCoils = 30;
    const pointsPerCoil = 20;
    const radialSegments = 24;
    const springRadius = 0.1;
    const helixRadius = 0.4;

    const totalPoints = numCoils * pointsPerCoil;
    const heightStep = currentLength / totalPoints;

    let vertices = [];
    let normalSet = [];

    for (let i = 0; i < totalPoints; i++) {
        let t = i / pointsPerCoil;
        let angle = t * 2 * Math.PI;
        let center_x = helixRadius * Math.cos(angle);
        let center_z = helixRadius * Math.sin(angle);
        let center_y = -i * heightStep;

        let dx = -helixRadius * Math.sin(angle);
        let dz = helixRadius * Math.cos(angle);
        let tangent = [dx, -heightStep, dz];
        let tangentLen = Math.hypot(...tangent);
        tangent = tangent.map(v => v / tangentLen);

        let up = [0, 1, 0];
        let normal = [
            up[1]*tangent[2] - up[2]*tangent[1],
            up[2]*tangent[0] - up[0]*tangent[2],
            up[0]*tangent[1] - up[1]*tangent[0],
        ];
        let normLen = Math.hypot(...normal);
        normal = normal.map(v => v / normLen);

        let binormal = [
            tangent[1]*normal[2] - tangent[2]*normal[1],
            tangent[2]*normal[0] - tangent[0]*normal[2],
            tangent[0]*normal[1] - tangent[1]*normal[0],
        ];

        let ring = [];
        let ringNormals = [];
        for (let j = 0; j < radialSegments; j++) {
            let theta = (j / radialSegments) * 2 * Math.PI;
            let cosTheta = Math.cos(theta);
            let sinTheta = Math.sin(theta);

            let nx = normal[0] * cosTheta + binormal[0] * sinTheta;
            let ny = normal[1] * cosTheta + binormal[1] * sinTheta;
            let nz = normal[2] * cosTheta + binormal[2] * sinTheta;

            let x = center_x + springRadius * nx;
            let y = center_y + springRadius * ny;
            let z = center_z + springRadius * nz;

            ring.push(vec4(x, y, z, 1.0));
            ringNormals.push(vec3(nx, ny, nz));
        }
        vertices.push(ring);
        normalSet.push(ringNormals);
    }

    for (let i = 0; i < totalPoints - 1; i++) {
        for (let j = 0; j < radialSegments; j++) {
            let nextJ = (j + 1) % radialSegments;

            let p1 = vertices[i][j];
            let p2 = vertices[i][nextJ];
            let p3 = vertices[i + 1][j];
            let p4 = vertices[i + 1][nextJ];

            let n1 = normalSet[i][j];
            let n2 = normalSet[i][nextJ];
            let n3 = normalSet[i + 1][j];
            let n4 = normalSet[i + 1][nextJ];

            springPoints.push(p1, p3, p2);
            normals.push(n1, n3, n2);

            springPoints.push(p2, p3, p4);
            normals.push(n2, n3, n4);
        }
    }
}
