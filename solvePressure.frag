precision mediump float;

uniform sampler2D uPressureTexture;

uniform vec4 uOption;
uniform vec4 uInvResolution;

varying vec2 vTextureCoord;

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

vec2 IndexSpaceToUV(vec3 is, vec3 offset) {
    vec3 isOrg = is + offset;
    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));

    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));
    float iSliceY = floor(isOrg.z / uSliceResolution.x);
    
    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;
}
void main(void) {
    vec3 is = uvToIndexSpace(vTextureCoord);

    float p0 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 1, 0, 0))).y;
    float p1 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3(-1, 0, 0))).y;
    float p2 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 1, 0))).y;
    float p3 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0,-1, 0))).y;
    float p4 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0, 1))).y;
    float p5 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0,-1))).y;
    float div = texture2D(uPressureTexture, vTextureCoord).x;

    float newp = (div + p0 + p1 + p2 + p3 + p4 + p5) / 6.0;

    gl_FragColor = vec4(div, newp, 0, 0);
}
