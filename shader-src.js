var addSource_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTime;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"void main(void) {\n"+
"    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);\n"+
"    vec3 is = uvToIndexSpace(vTextureCoord);\n"+
"    if (0.0 < is.y && is.y < 6.0 && abs(is.x - 32.0) < 8.0 && abs(is.z - 32.0) < 8.0) {\n"+
"        value.w += 0.001;\n"+
"    }\n"+
"    if (0.0 < is.y && is.y < 3.0 && abs(is.x - 32.0) < 2.0 && abs(is.z - 32.0) < 2.0) {\n"+
"        value.y += 0.05;\n"+
"    }\n"+
"    gl_FragColor = vec4(value);\n"+
"}\n"+
"";
var addSource2_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTime;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"void main(void) {\n"+
"    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);\n"+
"    vec3 is = uvToIndexSpace(vTextureCoord);\n"+
"    if (0.0 < is.x && is.x < 3.0 && abs(is.y - 32.0) < 2.0 && abs(is.z - 32.0) < 2.0) {\n"+
"        value.w += 0.001;\n"+
"    }\n"+
"    if (0.0 < is.x && is.x < 3.0 && abs(is.y - 32.0) < 2.0 && abs(is.z - 32.0) < 2.0) {\n"+
"        value.x += 0.05;\n"+
"    }\n"+
"    if (0.0 < is.y && is.y < 3.0 && abs(is.x - 32.0) < 2.0 && abs(is.z - 32.0) < 2.0) {\n"+
"        value.y += 0.01;\n"+
"    }\n"+
"    gl_FragColor = vec4(value);\n"+
"}\n"+
"";
var advectDensityStep_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"uniform vec4 uTsWs;\n"+
"uniform vec4 uWsTs;\n"+
"uniform vec4 uTsIs;\n"+
"uniform vec4 uIsTs;\n"+
"uniform vec4 uOption;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"void main(void) {\n"+
"    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);\n"+
"    vec3 wsPos = uvToIndexSpace(vTextureCoord) * uIsTs.xyz * uTsWs.xyz; // scaling\n"+
"    float dt = uOption.x;\n"+
"    vec3 wsVel = value.xyz;\n"+
"    vec3 wsPrevPos = wsPos - dt * wsVel;\n"+
"    vec3 ts = wsPrevPos * uWsTs.xyz;\n"+
"    vec3 is = ts * uTsIs.xyz - vec3(0.5, 0.5, 0.5);\n"+
"    vec3 iIs0 = floor(is);\n"+
"    vec3 iIs1 = iIs0 + vec3(1, 1, 1);\n"+
"    vec3 st1 = is - iIs0;\n"+
"    vec3 st0 = vec3(1, 1, 1) - st1;\n"+
"    iIs0 += vec3(0.5, 0.5, 0.5);\n"+
"    iIs1 += vec3(0.5, 0.5, 0.5);\n"+
"    vec4 v000 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v100 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v010 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v110 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v001 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v101 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v011 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v111 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    \n"+
"    float finalDensity = \n"+
"        st0.x * (\n"+
"            st0.y * (st0.z * v000.w + st1.z * v001.w) +\n"+
"            st1.y * (st0.z * v010.w + st1.z * v011.w)) +\n"+
"        st1.x * (\n"+
"            st0.y * (st0.z * v100.w + st1.z * v101.w) +\n"+
"            st1.y * (st0.z * v110.w + st1.z * v111.w));\n"+
"    gl_FragColor = vec4(value.xyz, finalDensity);\n"+
"}\n"+
"";
var advectVelStep_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"uniform vec4 uTsWs;\n"+
"uniform vec4 uWsTs;\n"+
"uniform vec4 uTsIs;\n"+
"uniform vec4 uIsTs;\n"+
"uniform vec4 uOption;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"void main(void) {\n"+
"    vec4 value =  texture2D(uVelDensityTexture, vTextureCoord);\n"+
"    vec3 wsPos = uvToIndexSpace(vTextureCoord) * uIsTs.xyz * uTsWs.xyz; // scaling\n"+
"    float dt = uOption.x;\n"+
"    vec3 wsVel = value.xyz;\n"+
"    vec3 wsPrevPos = wsPos - dt * wsVel;\n"+
"    vec3 ts = wsPrevPos * uWsTs.xyz;\n"+
"    vec3 is = ts * uTsIs.xyz - vec3(0.5, 0.5, 0.5);\n"+
"    vec3 iIs0 = floor(is);\n"+
"    vec3 iIs1 = iIs0 + vec3(1, 1, 1);\n"+
"    vec3 st1 = is - iIs0;\n"+
"    vec3 st0 = vec3(1, 1, 1) - st1;\n"+
"    iIs0 += vec3(0.5, 0.5, 0.5);\n"+
"    iIs1 += vec3(0.5, 0.5, 0.5);\n"+
"    vec4 v000 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v100 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v010 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v110 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v001 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v101 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v011 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v111 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    \n"+
"    vec3 finalVelocity = \n"+
"        st0.x * (\n"+
"            st0.y * (st0.z * v000.xyz + st1.z * v001.xyz) +\n"+
"            st1.y * (st0.z * v010.xyz + st1.z * v011.xyz)) +\n"+
"        st1.x * (\n"+
"            st0.y * (st0.z * v100.xyz + st1.z * v101.xyz) +\n"+
"            st1.y * (st0.z * v110.xyz + st1.z * v111.xyz));\n"+
"    gl_FragColor = vec4(finalVelocity.xyz, value.w);\n"+
"}\n"+
"";
var fluid_vert="attribute vec2 aVertexPosition;\n"+
"attribute vec2 aTextureCoord;\n"+
"uniform mat4 uPerspectiveMatrix;\n"+
"uniform mat4 uModelMatrix;\n"+
"uniform mat4 uViewMatrix;\n"+
"varying vec2 vTextureCoord;\n"+
"void main(void) {\n"+
"    vTextureCoord = aTextureCoord;\n"+
"    gl_Position = uPerspectiveMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition.xy, 0, 1.0);\n"+
"}\n"+
"";
var renderVolume_frag="precision mediump float;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uOption;\n"+
"uniform vec4 uProjParams;\n"+
"uniform mat4 uInvViewMatrix;\n"+
"uniform vec4 uCameraParams;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"// http://bassser.tumblr.com/post/11626074256/reconstructing-position-from-depth-buffer\n"+
"vec3 reconstructPosition(in float p_depth, in vec2 p_ndc, in vec4 p_projParams)\n"+
"{ \n"+
"    float depth = p_depth * 2.0 - 1.0;\n"+
"    float viewDepth = p_projParams.w / (depth - p_projParams.z);\n"+
"    return vec3((p_ndc * viewDepth) / p_projParams.xy, viewDepth);\n"+
"}\n"+
"float sampleDensity(vec3 is) {\n"+
"    vec3 iIs0 = floor(is);\n"+
"    return texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0))).w;\n"+
"}\n"+
"// Very heavy!\n"+
"float sampleDensityBilinear(vec3 is) {\n"+
"    vec3 iIs0 = floor(is);\n"+
"    vec3 iIs1 = iIs0 + vec3(1, 1, 1);\n"+
"    vec3 st1 = is - iIs0;\n"+
"    vec3 st0 = vec3(1, 1, 1) - st1;\n"+
"    iIs0 += vec3(0.5, 0.5, 0.5);\n"+
"    iIs1 += vec3(0.5, 0.5, 0.5);\n"+
"    vec4 v000 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v100 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v010 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v110 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs0.z), vec3(0, 0, 0)));\n"+
"    vec4 v001 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v101 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs0.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v011 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs0.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    vec4 v111 = texture2D(uVelDensityTexture, IndexSpaceToUV(vec3(iIs1.x, iIs1.y, iIs1.z), vec3(0, 0, 0)));\n"+
"    \n"+
"    float d = \n"+
"        st0.x * (\n"+
"            st0.y * (st0.z * v000.w + st1.z * v001.w) +\n"+
"            st1.y * (st0.z * v010.w + st1.z * v011.w)) +\n"+
"        st1.x * (\n"+
"            st0.y * (st0.z * v100.w + st1.z * v101.w) +\n"+
"            st1.y * (st0.z * v110.w + st1.z * v111.w));\n"+
"    return d;\n"+
"}\n"+
"float rand(vec2 co){\n"+
"    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n"+
"}\n"+
"bool checkInside(vec3 org, vec3 pmin, vec3 pmax) {\n"+
"    if (org.x < pmin.x || org.y < pmin.y || org.z < pmin.z ||\n"+
"        org.x > pmax.x || org.y > pmax.y || org.z > pmax.z)\n"+
"        return false;\n"+
"    return true;\n"+
"}\n"+
"vec2 checkIntersect(vec3 org, vec3 dir, vec3 pmin, vec3 pmax) {\n"+
"    vec2 t;\n"+
"    float t0 = 0.0, t1 = 100000.0;\n"+
"    for (int i = 0; i < 3; ++i) {\n"+
"        float invRayDir = 1.0 / dir[i];\n"+
"        float tNear = (pmin[i] - org[i]) * invRayDir;\n"+
"        float tFar  = (pmax[i] - org[i]) * invRayDir;\n"+
"        if (tNear > tFar) {\n"+
"            float tmp = tNear;\n"+
"            tNear = tFar;\n"+
"            tFar = tmp;\n"+
"        }\n"+
"        t0 = tNear > t0 ? tNear : t0;\n"+
"        t1 = tFar  < t1 ? tFar  : t1;\n"+
"        if (t0 > t1) return vec2(-1, -1);\n"+
"    }\n"+
"    return vec2(t0, t1);\n"+
"}\n"+
"#define N 32.0\n"+
"vec3 wsToIs(vec3 ws) {\n"+
"    return ((ws / vec3(4.0, 4.0, 4.0)) + vec3(1, 0, 1)) * 0.5 * uSimResolution.xyz + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"void main(void) {\n"+
"    // Constants\n"+
"    vec3 kLightVec = normalize(vec3(0.3, 0.7, 0.2));\n"+
"    float densityScale = uOption.x;\n"+
"    vec3 pMin = vec3(-4, 0, -4);\n"+
"    vec3 pMax = vec3(4, 8, 4);\n"+
"    float planeSize = 25.0;\n"+
"    vec3 finalColor = vec3(0.5, 0.5, 0.5);\n"+
"    float sunPower = 1.0;\n"+
"    vec3 vsPos = reconstructPosition(0.0, vTextureCoord * vec2(2.0, -2.0) + vec2(-1.0, 1.0), uProjParams);\n"+
"    vec3 wsPos = (uInvViewMatrix * vec4(vsPos, 1)).xyz;\n"+
"    vec3 wsDir = normalize(wsPos - uCameraParams.xyz);\n"+
"    vec3 wsOrg = uCameraParams.xyz;\n"+
"    float tPlane = -dot(wsOrg, vec3(0, 1, 0)) / dot(wsDir, vec3(0, 1, 0));\n"+
"    vec3 wsInter = wsOrg + tPlane * wsDir;\n"+
"    if (tPlane > 0.0 && abs(wsInter.x) < planeSize && abs(wsInter.z)  < planeSize)  {\n"+
"        // col = vec4(wsOrg + t * wsDir, 1).xyz;\n"+
"        finalColor = vec3(0.2, 0.2, 0.2);\n"+
"    }\n"+
"    // Shadow\n"+
"    float shadowTransmittance = 1.0;\n"+
"    {\n"+
"        vec3 wsShadowOrg = wsOrg + tPlane * wsDir;\n"+
"        vec2 shadowTp = checkIntersect(wsShadowOrg, kLightVec, pMin, pMax);\n"+
"        wsShadowOrg = wsShadowOrg + shadowTp.x * kLightVec;\n"+
"        float length = shadowTp.y - shadowTp.x;\n"+
"        for (float j = 0.0; j < N; j += 1.0) {\n"+
"            vec3 wsDPos = wsShadowOrg + (length / N) * (j + 0.5) * kLightVec;\n"+
"            if (!checkInside(wsDPos, pMin, pMax) || length <= 0.0)\n"+
"                break;\n"+
"            vec3 isDPos = ((wsDPos / vec3(4.0, 4.0, 4.0)) + vec3(1, 0, 1)) * 0.5 * uSimResolution.xyz + vec3(0.5, 0.5, 0.5);\n"+
"            float ddensity = densityScale * sampleDensity(isDPos);\n"+
"            shadowTransmittance *= exp(-ddensity * (length / N));\n"+
"        }\n"+
"    }\n"+
"    // Volume ray marching \n"+
"    float sum = 0.0;\n"+
"    float transmittance = 1.0;\n"+
"    {\n"+
"        vec2 tp = checkIntersect(wsOrg, wsDir, pMin, pMax);\n"+
"        wsOrg = wsOrg + tp.x * wsDir;\n"+
"        float length = tp.y - tp.x;\n"+
"        for (float i = 0.0; i < N; i += 1.0) {\n"+
"            float nt = length / N * (i + (1.0 + rand(vec2(i + wsPos.z, uOption.y + wsPos.x + wsPos.y))) * 0.5);\n"+
"            vec3 wsCurrentPos = wsOrg + nt * wsDir;\n"+
"            if (!checkInside(wsCurrentPos, pMin, pMax) || length <= 0.0)\n"+
"                break;\n"+
"            vec3 isPos = wsToIs(wsCurrentPos);\n"+
"            float density = densityScale * sampleDensity(isPos);\n"+
"            transmittance *= exp(-density * (length / N));\n"+
"            float sunTransmittance = 1.0;\n"+
"            vec3 wsSunOrg = wsCurrentPos;\n"+
"            vec2 sunTp = checkIntersect(wsSunOrg, kLightVec, pMin, pMax);\n"+
"            wsSunOrg = wsSunOrg + sunTp.x * kLightVec;\n"+
"            float sunLength = sunTp.y - sunTp.x;\n"+
"            for (float j = 0.0; j < N; j += 1.0) {\n"+
"                vec3 wsDPos = wsSunOrg + (sunLength / N) * (j + 0.5) * kLightVec;\n"+
"                vec3 isDPos = wsToIs(wsDPos);\n"+
"                float ddensity = densityScale * sampleDensity(isDPos);\n"+
"                sunTransmittance *= exp(-ddensity * (sunLength / N));\n"+
"            }\n"+
"            sum += (transmittance * sunPower * sunTransmittance * density) * (length / N);\n"+
"        }\n"+
"    }\n"+
"    vec3 result = vec3(shadowTransmittance * transmittance * finalColor) + vec3(sum, sum, sum);\n"+
"    result = pow(result, vec3(0.45, 0.45, 0.45));\n"+
"    gl_FragColor = vec4(result, 1);\n"+
"}\n"+
"";
var renderVolume_vert="attribute vec2 aVertexPosition;\n"+
"uniform mat4 uPerspectiveMatrix;\n"+
"uniform mat4 uModelMatrix;\n"+
"uniform mat4 uViewMatrix;\n"+
"uniform sampler2D uSampler;\n"+
"varying vec4 vColor;\n"+
"void main(void) {\n"+
"    vColor = vec4(1.0, 1.0, 1.0, 1.0);\n"+
"    vec3 value = texture2D(uSampler, aVertexPosition.xy).xyz;\n"+
"/*    vec3 value = vec3(aVertexPosition.xy, 0);*/\n"+
"    gl_Position = uPerspectiveMatrix * uViewMatrix * uModelMatrix * vec4(value, 1.0);\n"+
"    gl_PointSize = 2.0;\n"+
"}\n"+
"";
var setupPressure_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"uniform sampler2D uPressureTexture;\n"+
"uniform vec4 uOption;\n"+
"uniform vec4 uInvResolution;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTsIs;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"void main(void) {\n"+
"    vec3 is = uvToIndexSpace(vTextureCoord);\n"+
"    \n"+
"    vec4 vx0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 1, 0, 0)));\n"+
"    vec4 vx1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3(-1, 0, 0)));\n"+
"    vec4 vy0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 1, 0)));\n"+
"    vec4 vy1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0,-1, 0)));\n"+
"    vec4 vz0 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 0, 1)));\n"+
"    vec4 vz1 =  texture2D(uVelDensityTexture, IndexSpaceToUV(is, vec3( 0, 0,-1)));\n"+
"    float h = uOption.y;\n"+
"    float div = -0.5 * h * (\n"+
"        vx0.x - vx1.x + \n"+
"        vy0.y - vy1.y + \n"+
"        vz0.z - vz1.z);\n"+
"    float prevPressure = texture2D(uPressureTexture, vTextureCoord).y;\n"+
"    gl_FragColor = vec4(div, prevPressure, 0, 0);\n"+
"}\n"+
"";
var showTexture_frag="precision mediump float;\n"+
"uniform sampler2D uSampler;\n"+
"varying vec2 vTextureCoord;\n"+
"void main(void) {\n"+
"  gl_FragColor = vec4(abs(texture2D(uSampler, vTextureCoord).www) * 1.0, 1);\n"+
"}\n"+
"";
var showTexture_vert="attribute vec2 aVertexPosition;\n"+
"attribute vec2 aTextureCoord;\n"+
"uniform mat4 uPerspectiveMatrix;\n"+
"uniform mat4 uModelMatrix;\n"+
"uniform mat4 uViewMatrix;\n"+
"varying vec2 vTextureCoord;\n"+
"void main(void) {\n"+
"    vTextureCoord = aTextureCoord;\n"+
"    gl_Position = uPerspectiveMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition.xy, 0, 1.0);\n"+
"}\n"+
"";
var showTextureRGB_frag="precision mediump float;\n"+
"uniform sampler2D uSampler;\n"+
"varying vec2 vTextureCoord;\n"+
"void main(void) {\n"+
"  gl_FragColor = vec4(abs(texture2D(uSampler, vTextureCoord).rgb) * 1.0, 1);\n"+
"}\n"+
"";
var solvePressure_frag="precision mediump float;\n"+
"uniform sampler2D uPressureTexture;\n"+
"uniform vec4 uOption;\n"+
"uniform vec4 uInvResolution;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"void main(void) {\n"+
"    vec3 is = uvToIndexSpace(vTextureCoord);\n"+
"    float p0 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 1, 0, 0))).y;\n"+
"    float p1 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3(-1, 0, 0))).y;\n"+
"    float p2 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 1, 0))).y;\n"+
"    float p3 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0,-1, 0))).y;\n"+
"    float p4 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0, 1))).y;\n"+
"    float p5 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0,-1))).y;\n"+
"    float div = texture2D(uPressureTexture, vTextureCoord).x;\n"+
"    float newp = (div + p0 + p1 + p2 + p3 + p4 + p5) / 6.0;\n"+
"    gl_FragColor = vec4(div, newp, 0, 0);\n"+
"}\n"+
"";
var updateVelocity_frag="precision mediump float;\n"+
"uniform sampler2D uVelDensityTexture;\n"+
"uniform sampler2D uPressureTexture;\n"+
"uniform vec4 uOption;\n"+
"uniform vec4 uInvResolution;\n"+
"varying vec2 vTextureCoord;\n"+
"uniform vec4 uTexResolution;\n"+
"uniform vec4 uSimResolution;\n"+
"uniform vec4 uSliceResolution;\n"+
"vec3 uvToIndexSpace(vec2 uv) {\n"+
"    \n"+
"    vec2 globalIndex = uv * uTexResolution.xy;\n"+
"    vec2 iSliceIndex = floor(globalIndex / uSimResolution.xy);\n"+
"    float iIndexZ = floor(iSliceIndex.y * uSliceResolution.x  + iSliceIndex.x + 0.5);\n"+
"    vec2 localIndex = floor(mod(globalIndex, uSimResolution.xy));\n"+
"    \n"+
"    return vec3(localIndex, float(iIndexZ)) + vec3(0.5, 0.5, 0.5);\n"+
"}\n"+
"vec2 IndexSpaceToUV(vec3 is, vec3 offset) {\n"+
"    vec3 isOrg = is + offset;\n"+
"    isOrg = clamp(isOrg, vec3(0.5, 0.5, 0.5), uSimResolution.xyz - vec3(0.5, 0.5, 0.5));\n"+
"    float iSliceX = floor(mod(isOrg.z, uSliceResolution.x));\n"+
"    float iSliceY = floor(isOrg.z / uSliceResolution.x);\n"+
"    \n"+
"    return (uSimResolution.xy * vec2(iSliceX, iSliceY) + vec2(isOrg.x, isOrg.y)) / uTexResolution.xy;\n"+
"}\n"+
"void main(void) {\n"+
"    vec3 is = uvToIndexSpace(vTextureCoord);\n"+
"    float p0 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 1, 0, 0))).y;\n"+
"    float p1 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3(-1, 0, 0))).y;\n"+
"    float p2 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 1, 0))).y;\n"+
"    float p3 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0,-1, 0))).y;\n"+
"    float p4 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0, 1))).y;\n"+
"    float p5 =  texture2D(uPressureTexture, IndexSpaceToUV(is, vec3( 0, 0,-1))).y;\n"+
"    float h = uOption.y;\n"+
"    vec4 vel = texture2D(uVelDensityTexture, vTextureCoord);\n"+
"    vel.x -= 0.5 * (p0 - p1) / h;\n"+
"    vel.y -= 0.5 * (p2 - p3) / h;\n"+
"    vel.z -= 0.5 * (p4 - p5) / h;\n"+
"    gl_FragColor = vec4(vel.xyz, vel.w);\n"+
"}\n"+
"";
