function buildPlatform() {
    const sides = 40;
    const r = 1.0;
    const h = 0.1;
    const yOffset = -h / 2;

    let topY = h/2 + yOffset;     // Top face Y
    let bottomY = -h/2 + yOffset;  // Bottom face Y

    platformVertices = [];
    normals = [];

    // Top face
    buildFace(sides, r, topY);

    // Bottom face
    buildFace(sides, r, bottomY);

    // Side faces
    for (let i = 0; i < sides; i++) {
        let theta1 = (i / sides) * 2 * Math.PI;
        let theta2 = ((i + 1) / sides) * 2 * Math.PI;

        let x1 = r * Math.cos(theta1), z1 = r * Math.sin(theta1);
        let x2 = r * Math.cos(theta2), z2 = r * Math.sin(theta2);

        let top1 = vec4(x1, topY, z1, 1);
        let top2 = vec4(x2, topY, z2, 1);
        let bot1 = vec4(x1, bottomY, z1, 1);
        let bot2 = vec4(x2, bottomY, z2, 1);

        let normal = normalize(vec3(x1 + x2, 0, z1 + z2)); // approximate average normal

        platformVertices.push(top1, bot1, bot2);
        platformVertices.push(top1, bot2, top2);

        normals.push(normal, normal, normal);
        normals.push(normal, normal, normal);
    }
}


function buildFace(sides, r, yVal) {
    for (let i = 0; i < sides; i++) {
        let theta1 = (i / sides) * 2 * Math.PI;
        let theta2 = ((i + 1) / sides) * 2 * Math.PI;

        let x1 = r * Math.cos(theta1), z1 = r * Math.sin(theta1);
        let x2 = r * Math.cos(theta2), z2 = r * Math.sin(theta2);

        platformVertices.push(vec4(0, yVal, 0, 1), vec4(x1, yVal, z1, 1), vec4(x2, yVal, z2, 1));
        normals.push(vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 1, 0));
    }
}

function buildArms() {
    armVertices = [];
    const len = 0.3, thick = 0.05;
    const pos = [[-radius, 0, 0], [radius, 0, 0]];

    for (let p of pos) {
        let [x, y, z] = p;
        let x0 = x - len / 2, x1 = x + len / 2;
        let y0 = y, y1 = y + thick;
        let z0 = z - thick / 2, z1 = z + thick / 2;

        let v = [
            vec4(x0, y0, z0, 1), vec4(x1, y0, z0, 1), vec4(x1, y1, z0, 1),
            vec4(x0, y1, z0, 1), vec4(x0, y0, z1, 1), vec4(x1, y0, z1, 1),
            vec4(x1, y1, z1, 1), vec4(x0, y1, z1, 1)
        ];
        let faces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [1,2,6,5], [0,3,7,4]];
        let faceNormals = [vec3(0,0,-1),vec3(0,0,1),vec3(0,-1,0),vec3(0,1,0),vec3(1,0,0),vec3(-1,0,0)];

        for (let i = 0; i < faces.length; i++) {
            let f = faces[i];
            armVertices.push(v[f[0]], v[f[1]], v[f[2]]);
            armVertices.push(v[f[0]], v[f[2]], v[f[3]]);
            normals.push(faceNormals[i], faceNormals[i], faceNormals[i]);
            normals.push(faceNormals[i], faceNormals[i], faceNormals[i]);
        }
    }
}
