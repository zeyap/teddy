uniform mat4 xform_projMat;
uniform mat4 xform_viewMat;
uniform mat4 xform_modelMat;

attribute vec3 vert_position;
attribute vec2 vert_texCoord;
attribute vec3 vert_normal;

varying vec2 geom_texCoord;
varying vec3 vertexPos;
varying vec3 vertexNormal;
varying mat4 modelMat;

void main() {
    gl_Position = xform_projMat * (xform_viewMat * (xform_modelMat * vec4(vert_position, 1.0)));
    vertexPos = vert_position;
    geom_texCoord = vert_texCoord;
    vertexNormal = vert_normal;
    modelMat = xform_modelMat;
}