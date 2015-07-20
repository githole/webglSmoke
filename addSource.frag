precision mediump float;

uniform sampler2D uVelDensityTexture;
varying vec2 vTextureCoord;

uniform vec4 uTime;

uniform vec4 uTexResolution;
uniform vec4 uSimResolution;
uniform vec4 uSliceResolution;
vec3 uvToIndexSpace(vec2 uv) {
    
    vec2 globalIndex = uv * uTexResolution.xy;
    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);

    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);
    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));
    
    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);
}

void main(void) {
    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);
    vec3 is = uvToIndexSpace(vTextureCoord);

    if (0.0 < is.y && is.y < 6.0 && abs(is.x - 32.0) < 8.0 && abs(is.z - 32.0) < 8.0) {
        value.w += 0.001;
    }
    if (0.0 < is.y && is.y < 3.0 && abs(is.x - 32.0) < 2.0 && abs(is.z - 32.0) < 2.0) {
        value.y += 0.05;
    }

    gl_FragColor = vec4(value);
}
