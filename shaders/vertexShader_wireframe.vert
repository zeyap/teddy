uniform mat4 xform_projMat;
uniform mat4 xform_viewMat;
uniform mat4 xform_modelMat;

attribute vec3 vert_position;

void main() {
    gl_Position = xform_projMat * (xform_viewMat * (xform_modelMat * vec4(vert_position, 1.0)));
}