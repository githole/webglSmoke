attribute vec2 aVertexPosition;

uniform mat4 uPerspectiveMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform sampler2D uSampler;

varying vec4 vColor;

void main(void) {
    vColor = vec4(1.0, 1.0, 1.0, 1.0);

    vec3 value = texture2D(uSampler, aVertexPosition.xy).xyz;
/*    vec3 value = vec3(aVertexPosition.xy, 0);*/

    gl_Position = uPerspectiveMatrix * uViewMatrix * uModelMatrix * vec4(value, 1.0);
    gl_PointSize = 2.0;
}