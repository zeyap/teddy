precision highp float;

uniform vec3 lightPos;
uniform vec4 color;

float intensity = 1.0;
float ambientLight = 0.5;

varying vec3 vertexPos;
varying vec3 vertexNormal;
varying vec3 vertexBC;
varying mat4 modelMat;

void main() {

    float celShadingThreshold[4];
    celShadingThreshold[0] = 0.02;
    celShadingThreshold[1] = 0.1;//0.3
    celShadingThreshold[2] = 0.6;
    celShadingThreshold[3] = 0.9;

    float celShadingVal[5];
    celShadingVal[0] = 0.3;
    celShadingVal[1] = 0.6;
    celShadingVal[2] = 0.87;
    celShadingVal[3] = 0.95;
    celShadingVal[4] = 1.0;
    
    vec3 c = color.rgb;

    vec3 v = normalize(-vertexPos.xyz);
    
    // to world space
    vec3 normal = normalize(vertexNormal);
    // calculate lighting
    // diffuse lighting
    vec3 lightDir = normalize(lightPos - vertexPos);

    float angle = dot(lightDir, vertexNormal);
    // if(angle<0.0){
    //     angle = -angle;
    // }

    if (angle < celShadingThreshold[0])
    {
        c = c * celShadingVal[0];
    }
    else if (angle < celShadingThreshold[1])
    {
        c = c * celShadingVal[1];
    }
    else if (angle < celShadingThreshold[2])
    {
        c = c * celShadingVal[2];
    }
    else if (angle < celShadingThreshold[3])
    {
        c = c * celShadingVal[3];
    }
    else
    {
        c = c * celShadingVal[4];
    }
    gl_FragColor = vec4(c, 1.0);
    
}