precision mediump float;

uniform sampler2D uSampler;

varying vec2 vTextureCoord;

void main(void) {
  gl_FragColor = vec4(abs(texture2D(uSampler, vTextureCoord).rgb) * 1.0, 1);
}