attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uPerspectiveMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;

varying vec2 vTextureCoord;

void main(void) {
    vTextureCoord = aTextureCoord;
    gl_Position = uPerspectiveMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition.xy, 0, 1.0);
}