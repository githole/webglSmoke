precision mediump float;

uniform sampler2D uVelDensityTexture;

uniform vec4 uTsWs;
uniform vec4 uWsTs;
uniform vec4 uTsIs;
uniform vec4 uIsTs;
uniform vec4 uOption;

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
    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);

    vec3 wsPos = uvToIndexSpace(vTextureCoord) * uIsTs.xyz * uTsWs.xyz; // scaling
    float dt = uOption.x;

    vec3 wsVel = value.xyz;
    vec3 wsPrevPos = wsPos - dt * wsVel;

    vec3 ts = wsPrevPos * uWsTs.xyz;


    vec3 is = ts * uTsIs.xyz - vec3(0.5, 0.5, 0.5);
    vec3 iIs0 = floor(is);
    vec3 iIs1 = iIs0 + vec3(1, 1, 1);
    vec3 st1 = is - iIs0;
    vec3 st0 = vec3(1, 1, 1) - st1;

    iIs0 += vec3(0.5, 0.5, 0.5);
    iIs1 += vec3(0.5, 0.5, 0.5);

    vec4 v000 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));
    vec4 v100 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));
    vec4 v010 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));
    vec4 v110 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));
    vec4 v001 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));
    vec4 v101 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));
    vec4 v011 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));
    vec4 v111 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));
    
    float finalDensity = 
        st0.x * (
            st0.y * (st0.z * v000.w + st1.z * v001.w) +
            st1.y * (st0.z * v010.w + st1.z * v011.w)) +
        st1.x * (
            st0.y * (st0.z * v100.w + st1.z * v101.w) +
            st1.y * (st0.z * v110.w + st1.z * v111.w));

    gl_FragColor = vec4(value.xyz, finalDensity);
}
