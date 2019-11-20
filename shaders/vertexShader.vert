uniform mat4 xform_projMat;
uniform mat4 xform_viewMat;
uniform mat4 xform_modelMat;

attribute vec3 vert_position;
attribute vec3 vert_normal;
attribute vec3 vert_barycentric;

varying vec3 vertexPos;
varying vec3 vertexNormal;
varying vec3 vertexBC;
varying mat4 modelMat;

void main() {
    gl_Position = xform_projMat * (xform_viewMat * (xform_modelMat * vec4(vert_position, 1.0)));
    vertexPos = vert_position;
    vertexNormal = vert_normal;
    modelMat = xform_modelMat;
    vertexBC = vert_barycentric;
}