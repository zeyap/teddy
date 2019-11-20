precision highp float;

uniform vec3 lightPos;

float intensity = 1.0;
float ambientLight = 0.5;

varying vec3 vertexPos;
varying vec3 vertexNormal;
varying vec3 vertexBC;
varying mat4 modelMat;

void main() {
    
    vec4 c = vec4(1.0,1.0,1.0,1.0);

    vec3 v = normalize(-vertexPos.xyz);
    
    // to world space
    vec3 normal = normalize(vertexNormal);
    // calculate lighting
    // diffuse lighting
    vec3 lightDir = normalize(lightPos - vertexPos);
    float d = distance(vertexPos,lightPos);

    float diffuse = max(dot(normal, lightDir), 0.0)/(d*d)*intensity;

    vec3 h = normalize(lightDir + v);
    vec3 spec = vec3(1.0) * pow(max(dot(normal,h),0.0),1.0);

    gl_FragColor = vec4(min(ambientLight+diffuse+spec,1.2)*c.rgb, 1.0);
    // gl_FragColor = vec4(0.5*(normal.xyz+1.0), 1.0); // show normal
    // gl_FragColor = c;// wireframe
}