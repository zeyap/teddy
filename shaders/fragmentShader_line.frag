precision highp float;
uniform vec4 color;

void main() {
    gl_FragColor = vec4(color.x,color.y,color.z,1.0);
}