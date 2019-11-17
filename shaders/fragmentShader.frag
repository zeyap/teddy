precision highp float;

uniform vec3 lightPos;

float intensity = 80.0;
float ambientLight = 0.2;

varying vec2 geom_texCoord;
varying vec3 vertexPos;
varying vec3 vertexNormal;
varying mat4 modelMat;

float bumpiness = 1.5;

void main() {
    
    vec4 c = vec4(1.0,1.0,1.0,1.0);
    
    // to world space
    vec3 normal = normalize(vertexNormal);
    // calculate lighting
    // diffuse lighting
    vec3 lightDir = normalize(lightPos - vertexPos);
    float d = distance(vertexPos,lightPos);

    float diffuse = max(dot(normal, lightDir), 0.0)/(d*d)*intensity;

    gl_FragColor = vec4(min(ambientLight+diffuse,1.8)*c.rgb, 1.0);
    // gl_FragColor = vec4(0.5*(normal.xyz+1.0), 1.0); // show normal
}