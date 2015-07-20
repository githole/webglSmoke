precision mediump float;

varying vec2 vTextureCoord;

uniform vec4 uOption;

uniform vec4 uProjParams;
uniform mat4 uInvViewMatrix;
uniform vec4 uCameraParams;

uniform sampler2D uVelDensityTexture;

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

// http://bassser.tumblr.com/post/11626074256/reconstructing-position-from-depth-buffer
vec3 reconstructPosition(in float p_depth, in vec2 p_ndc, in vec4 p_projParams)
{ 
    float depth = p_depth * 2.0 - 1.0;
    float viewDepth = p_projParams.w / (depth - p_projParams.z);

    return vec3((p_ndc * viewDepth) / p_projParams.xy, viewDepth);
}

float sampleDensity(vec3 is) {
    vec3 iIs0 = floor(is);
    return texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0))).w;
}

// Very heavy!
float sampleDensityBilinear(vec3 is) {
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
    
    float d = 
        st0.x * (
            st0.y * (st0.z * v000.w + st1.z * v001.w) +
            st1.y * (st0.z * v010.w + st1.z * v011.w)) +
        st1.x * (
            st0.y * (st0.z * v100.w + st1.z * v101.w) +
            st1.y * (st0.z * v110.w + st1.z * v111.w));
    return d;
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

bool checkInside(vec3 org, vec3 pmin, vec3 pmax) {
    if (org.x < pmin.x || org.y < pmin.y || org.z < pmin.z ||
        org.x > pmax.x || org.y > pmax.y || org.z > pmax.z)
        return false;
    return true;
}

vec2 checkIntersect(vec3 org, vec3 dir, vec3 pmin, vec3 pmax) {
    vec2 t;
    float t0 = 0.0, t1 = 100000.0;

    for (int i = 0; i < 3; ++i) {
        float invRayDir = 1.0 / dir[i];
        float tNear = (pmin[i] - org[i]) * invRayDir;
        float tFar  = (pmax[i] - org[i]) * invRayDir;

        if (tNear > tFar) {
            float tmp = tNear;
            tNear = tFar;
            tFar = tmp;
        }
        t0 = tNear > t0 ? tNear : t0;
        t1 = tFar  < t1 ? tFar  : t1;
        if (t0 > t1) return vec2(-1, -1);
    }
    return vec2(t0, t1);
}

#define N 32.0

vec3 wsToIs(vec3 ws) {
    return ((ws / vec3(4.0, 4.0, 4.0)) + vec3(1, 0, 1)) * 0.5 * uSimResolution.xyz + vec3(0.5, 0.5, 0.5);
}

void main(void) {
    // Constants
    vec3 kLightVec = normalize(vec3(0.3, 0.7, 0.2));
    float densityScale = uOption.x;
    vec3 pMin = vec3(-4, 0, -4);
    vec3 pMax = vec3(4, 8, 4);
    float planeSize = 25.0;
    vec3 finalColor = vec3(0.5, 0.5, 0.5);
    float sunPower = 1.0;

    vec3 vsPos = reconstructPosition(0.0, vTextureCoord * vec2(2.0, -2.0) + vec2(-1.0, 1.0), uProjParams);
    vec3 wsPos = (uInvViewMatrix * vec4(vsPos, 1)).xyz;
    vec3 wsDir = normalize(wsPos - uCameraParams.xyz);
    vec3 wsOrg = uCameraParams.xyz;
    float tPlane = -dot(wsOrg, vec3(0, 1, 0)) / dot(wsDir, vec3(0, 1, 0));

    vec3 wsInter = wsOrg + tPlane * wsDir;
    if (tPlane > 0.0 && abs(wsInter.x) < planeSize && abs(wsInter.z)  < planeSize)  {
        // col = vec4(wsOrg + t * wsDir, 1).xyz;
        finalColor = vec3(0.2, 0.2, 0.2);
    }

    // Shadow
    float shadowTransmittance = 1.0;
    {
        vec3 wsShadowOrg = wsOrg + tPlane * wsDir;
        vec2 shadowTp = checkIntersect(wsShadowOrg, kLightVec, pMin, pMax);
        wsShadowOrg = wsShadowOrg + shadowTp.x * kLightVec;

        float length = shadowTp.y - shadowTp.x;
        for (float j = 0.0; j < N; j += 1.0) {
            vec3 wsDPos = wsShadowOrg + (length / N) * (j + 0.5) * kLightVec;

            if (!checkInside(wsDPos, pMin, pMax) || length <= 0.0)
                break;

            vec3 isDPos = ((wsDPos / vec3(4.0, 4.0, 4.0)) + vec3(1, 0, 1)) * 0.5 * uSimResolution.xyz + vec3(0.5, 0.5, 0.5);
            float ddensity = densityScale * sampleDensity(isDPos);

            shadowTransmittance *= exp(-ddensity * (length / N));
        }
    }

    // Volume ray marching 
    float sum = 0.0;
    float transmittance = 1.0;
    {
        vec2 tp = checkIntersect(wsOrg, wsDir, pMin, pMax);
        wsOrg = wsOrg + tp.x * wsDir;

        float length = tp.y - tp.x;
        for (float i = 0.0; i < N; i += 1.0) {
            float nt = length / N * (i + (1.0 + rand(vec2(i + wsPos.z, uOption.y + wsPos.x + wsPos.y))) * 0.5);
            vec3 wsCurrentPos = wsOrg + nt * wsDir;

            if (!checkInside(wsCurrentPos, pMin, pMax) || length <= 0.0)
                break;

            vec3 isPos = wsToIs(wsCurrentPos);
            float density = densityScale * sampleDensity(isPos);

            transmittance *= exp(-density * (length / N));

            float sunTransmittance = 1.0;
            vec3 wsSunOrg = wsCurrentPos;
            vec2 sunTp = checkIntersect(wsSunOrg, kLightVec, pMin, pMax);
            wsSunOrg = wsSunOrg + sunTp.x * kLightVec;
            float sunLength = sunTp.y - sunTp.x;
            for (float j = 0.0; j < N; j += 1.0) {
                vec3 wsDPos = wsSunOrg + (sunLength / N) * (j + 0.5) * kLightVec;
                vec3 isDPos = wsToIs(wsDPos);
                float ddensity = densityScale * sampleDensity(isDPos);

                sunTransmittance *= exp(-ddensity * (sunLength / N));
            }
            sum += (transmittance * sunPower * sunTransmittance * density) * (length / N);
        }
    }

    vec3 result = vec3(shadowTransmittance * transmittance * finalColor) + vec3(sum, sum, sum);
    result = pow(result, vec3(0.45, 0.45, 0.45));
    gl_FragColor = vec4(result, 1);
}