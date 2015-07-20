precision mediump float;

uniform sampler2D uVelDensityTexture;
uniform sampler2D uPressureTexture;

uniform vec4 uOption;
uniform vec4 uInvResolution;

varying vec2 vTextureCoord;


uniform vec4 uTsIs;

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
    
    vec4 vx0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 1, 0, 0)));
    vec4 vx1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3(-1, 0, 0)));
    vec4 vy0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 1, 0)));
    vec4 vy1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0,-1, 0)));
    vec4 vz0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 0, 1)));
    vec4 vz1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 0,-1)));
    float h = uOption.y;
    float div = -0.5 * h * (
        vx0.x - vx1.x + 
        vy0.y - vy1.y + 
        vz0.z - vz1.z);
    float prevPressure = texture2D(uPressureTexture, vTextureCoord).y;

    gl_FragColor = vec4(div, prevPressure, 0, 0);
}
