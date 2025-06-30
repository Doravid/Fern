precision mediump float;

varying vec3 fNormal;
varying vec3 fPosition;

void main() {
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    vec3 ambient = vec3(0.2, 0.2, 0.2);
    float diff = max(dot(fNormal, lightDir), 0.0);
    vec3 color = vec3(0.8, 0.3, 0.3);
    gl_FragColor = vec4(ambient + diff * color, 1.0);
}