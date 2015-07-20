
var gMouseX = 0;
var gMouseY = 0;

var gScreenWidth = 0;
var gScreenHeight = 0;

var gCurrentCameraDistance = 20.0;

function onMouseMove(event) {
    gMouseX = event.offsetX;
    gMouseY = event.offsetY;
}

var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        var ext;
        ext = gl.getExtension('OES_texture_float');
        if(ext == null){
            alert('float texture not supported');
            return;
        }

        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


// **************************************************************** //
//
// Initialize textures & render targets
//
// **************************************************************** //
var gSimX = 64;
var gSimY = 64;
var gSimZ = 64;

// 3D texture 64x64x64 -> 2D texture 512x512
var gSimTexWidth = 512;
var gSimTexHeight = 512;

var velDensityRT = [];
var densityRT = [];
var pressureRT = [];

var volumeHalfRT;
var volumeRT;

function createRenderTarget(width, height, type, data) {
    var rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = width;
    rttFramebuffer.height = height;

    rttFramebuffer.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttFramebuffer.texture);
//    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    /*
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttFramebuffer.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return rttFramebuffer;
}

function initTextures() {
    {
        var width = gScreenWidth / 2;
        var height = gScreenHeight / 2;
        var data = new Uint8Array(width * height * 4);
        volumeHalfRT = createRenderTarget(width, height, gl.UNSIGNED_BYTE, data);
    }
    {
        var width = gScreenWidth;
        var height = gScreenHeight;
        var data = new Uint8Array(width * height * 4);
        volumeRT = createRenderTarget(width, height, gl.UNSIGNED_BYTE, data);
    }
    for (var i = 0; i < 2; ++i) {
        var width = gSimTexWidth;
        var height = gSimTexHeight;
        var data = new Float32Array(width * height * 4);
        velDensityRT[i] = createRenderTarget(width, height, gl.FLOAT, data);
    }

    for (var i = 0; i < 2; ++i) {
        var width = gSimTexWidth;
        var height = gSimTexHeight;
        var data = new Float32Array(width * height * 4);
        pressureRT[i] = createRenderTarget(width, height, gl.FLOAT, data);
    }
}

// **************************************************************** //
//
// Shader utils
//
// **************************************************************** //
function getShader(gl, str, type) {
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(str);
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function createShader(fragmentStr, vertexStr) {
    var fragmentShader = getShader(gl, fragmentStr, "fragment");
    var vertexShader = getShader(gl, vertexStr, "vertex");

    var shader = gl.createProgram();
    gl.attachShader(shader, vertexShader);
    gl.attachShader(shader, fragmentShader);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    return shader;
}

// **************************************************************** //
//
// Initialize shaders
//
// **************************************************************** //
var showTextureShader;
var showTextureRGBShader;
function initShowTextureShader() {
    showTextureShader = createShader(showTexture_frag, showTexture_vert);

    gl.useProgram(showTextureShader);

    showTextureShader.vertexPositionAttribute = gl.getAttribLocation(showTextureShader, "aVertexPosition");
    gl.enableVertexAttribArray(showTextureShader.vertexPositionAttribute);
    showTextureShader.textureCoordAttribute = gl.getAttribLocation(showTextureShader, "aTextureCoord");
    gl.enableVertexAttribArray(showTextureShader.textureCoordAttribute);

    showTextureShader.perspectiveMatrixUniform = gl.getUniformLocation(showTextureShader, "uPerspectiveMatrix");
    showTextureShader.modelMatrixUniform = gl.getUniformLocation(showTextureShader, "uModelMatrix");
    showTextureShader.viewMatrixUniform = gl.getUniformLocation(showTextureShader, "uViewMatrix");

    showTextureShader.samplerUniform = gl.getUniformLocation(showTextureShader, "uSampler");

    showTextureRGBShader = createShader(showTextureRGB_frag, showTexture_vert);

    gl.useProgram(showTextureRGBShader);

    showTextureRGBShader.vertexPositionAttribute = gl.getAttribLocation(showTextureRGBShader, "aVertexPosition");
    gl.enableVertexAttribArray(showTextureRGBShader.vertexPositionAttribute);
    showTextureRGBShader.textureCoordAttribute = gl.getAttribLocation(showTextureRGBShader, "aTextureCoord");
    gl.enableVertexAttribArray(showTextureRGBShader.textureCoordAttribute);

    showTextureRGBShader.perspectiveMatrixUniform = gl.getUniformLocation(showTextureRGBShader, "uPerspectiveMatrix");
    showTextureRGBShader.modelMatrixUniform = gl.getUniformLocation(showTextureRGBShader, "uModelMatrix");
    showTextureRGBShader.viewMatrixUniform = gl.getUniformLocation(showTextureRGBShader, "uViewMatrix");

    showTextureRGBShader.samplerUniform = gl.getUniformLocation(showTextureRGBShader, "uSampler");
}

function initFluidShader(frag_str, vert_str) {
    var shader = createShader(frag_str, vert_str);

    gl.useProgram(shader);

    shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    shader.textureCoordAttribute = gl.getAttribLocation(shader, "aTextureCoord");
    gl.enableVertexAttribArray(shader.textureCoordAttribute);

    shader.perspectiveMatrixUniform = gl.getUniformLocation(shader, "uPerspectiveMatrix");
    shader.modelMatrixUniform = gl.getUniformLocation(shader, "uModelMatrix");
    shader.viewMatrixUniform = gl.getUniformLocation(shader, "uViewMatrix");

    shader.velDensityTextureUniform = gl.getUniformLocation(shader, "uVelDensityTexture");
    shader.pressureTextureUniform = gl.getUniformLocation(shader, "uPressureTexture");

    shader.TsWsUniform = gl.getUniformLocation(shader, "uTsWs");
    shader.WsTsUniform = gl.getUniformLocation(shader, "uWsTs");
    shader.TsIsUniform = gl.getUniformLocation(shader, "uTsIs");
    shader.IsTsUniform = gl.getUniformLocation(shader, "uIsTs");
    shader.optionUniform = gl.getUniformLocation(shader, "uOption");
    shader.invResolutionUniform = gl.getUniformLocation(shader, "uInvResolution");

    shader.texResolutionUniform = gl.getUniformLocation(shader, "uTexResolution");
    shader.simResolutionUniform = gl.getUniformLocation(shader, "uSimResolution");
    shader.sliceResolutionUniform = gl.getUniformLocation(shader, "uSliceResolution");

    shader.timeUniform = gl.getUniformLocation(shader, "uTime");

    return shader;
}

function initRenderVolumeShader(frag_str, vert_str) {
    var shader = createShader(frag_str, vert_str);

    gl.useProgram(shader);

    shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    shader.textureCoordAttribute = gl.getAttribLocation(shader, "aTextureCoord");
    gl.enableVertexAttribArray(shader.textureCoordAttribute);

    shader.perspectiveMatrixUniform = gl.getUniformLocation(shader, "uPerspectiveMatrix");
    shader.modelMatrixUniform = gl.getUniformLocation(shader, "uModelMatrix");
    shader.viewMatrixUniform = gl.getUniformLocation(shader, "uViewMatrix");
    shader.invViewMatrixUniform = gl.getUniformLocation(shader, "uInvViewMatrix");
    shader.cameraParamsUniform = gl.getUniformLocation(shader, "uCameraParams");

    shader.velDensityTextureUniform = gl.getUniformLocation(shader, "uVelDensityTexture");

    
    shader.projParamsUniform = gl.getUniformLocation(shader, "uProjParams");
    shader.texResolutionUniform = gl.getUniformLocation(shader, "uTexResolution");
    shader.simResolutionUniform = gl.getUniformLocation(shader, "uSimResolution");
    shader.sliceResolutionUniform = gl.getUniformLocation(shader, "uSliceResolution");


    shader.optionUniform = gl.getUniformLocation(shader, "uOption");
    return shader;
}

var advectDensityStepShader;
var advectVelStepShader;
var setupPressureShader;
var updateVelocityShader;
var solvePressureShader;

var addSourceShader;
var addSourceShader2;

var renderVolumeShader;

function initShaders() {
    initShowTextureShader();

    advectDensityStepShader = initFluidShader(advectDensityStep_frag, fluid_vert);
    advectVelStepShader = initFluidShader(advectVelStep_frag, fluid_vert);
    setupPressureShader = initFluidShader(setupPressure_frag, fluid_vert);
    updateVelocityShader = initFluidShader(updateVelocity_frag, fluid_vert);
    solvePressureShader = initFluidShader(solvePressure_frag, fluid_vert);
    addSourceShader = initFluidShader(addSource_frag, fluid_vert);
    addSourceShader2 = initFluidShader(addSource2_frag, fluid_vert);
    renderVolumeShader = initRenderVolumeShader(renderVolume_frag, fluid_vert);
}


// **************************************************************** //
//
// Matrix & vertex buffers
//
// **************************************************************** //
var modelMatrix = mat4.create();
var viewMatrix = mat4.create();
var invViewMatrix = mat4.create();
var perspectiveMatrix = mat4.create();
var orthoMatrix = mat4.create();
var translateMatrix = mat4.create();

var plainVertexBuffer;
var plainTextureCoordBuffer;

function initBuffers() {
    // plain
    {
        var vertices = [
             1,  1,
            -1,  1,
             1, -1,
            -1, -1
        ];
        var textureCoords = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];
        plainVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, plainVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        plainVertexBuffer.itemSize = 2;
        plainVertexBuffer.numItems = 4;

        plainTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, plainTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        plainTextureCoordBuffer.itemSize = 2;
        plainTextureCoordBuffer.numItems = 4;
    }
}

function drawTexture(shader, texture, x, y, w, h) {
    mat4.ortho(orthoMatrix, -1, 1, -1, 1, -100, 100.0);
    mat4.identity(viewMatrix);
    gl.disable(gl.DEPTH_TEST);
    {
        gl.useProgram(shader);

        gl.bindBuffer(gl.ARRAY_BUFFER, plainVertexBuffer);
        gl.vertexAttribPointer(shader.vertexPositionAttribute, plainVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
       
        mat4.fromScaling(modelMatrix, [w, -h, 0]);
        mat4.fromTranslation(translateMatrix, [x, y, 0]);
        mat4.multiply(modelMatrix, translateMatrix, modelMatrix);
        // set matrix
        gl.uniformMatrix4fv(shader.perspectiveMatrixUniform, false, orthoMatrix);
        gl.uniformMatrix4fv(shader.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shader.viewMatrixUniform, false, viewMatrix);
        // texture
        gl.bindBuffer(gl.ARRAY_BUFFER, plainTextureCoordBuffer);
        gl.vertexAttribPointer(shader.textureCoordAttribute, plainTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(shader.samplerUniform, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, plainVertexBuffer.numItems);
    }
    gl.enable(gl.DEPTH_TEST);
}

// **************************************************************** //
//
// Update simulation textures
//
// **************************************************************** //
var gFrame = 0;
function update(currentVelDensityRT, currentPressureRT, nextRT, shader) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, nextRT);

    var width = gSimTexWidth;
    var height = gSimTexHeight;
    gl.viewport(0, 0, width, height);

    mat4.ortho(orthoMatrix, 1, -1, 1, -1, -100, 100.0);
    mat4.identity(viewMatrix);
    gl.disable(gl.DEPTH_TEST);
    {
        gl.useProgram(shader);

        gl.bindBuffer(gl.ARRAY_BUFFER, plainVertexBuffer);
        gl.vertexAttribPointer(shader.vertexPositionAttribute, plainVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        mat4.fromTranslation(modelMatrix, [0, 0, 0]);

        // set matrix
        gl.uniformMatrix4fv(shader.perspectiveMatrixUniform, false, orthoMatrix);
        gl.uniformMatrix4fv(shader.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shader.viewMatrixUniform, false, viewMatrix);
        // texture
        gl.bindBuffer(gl.ARRAY_BUFFER, plainTextureCoordBuffer);
        gl.vertexAttribPointer(shader.textureCoordAttribute, plainTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        if (currentVelDensityRT != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currentVelDensityRT.texture);
            gl.uniform1i(shader.velDensityTextureUniform, 0);
        }
        if (currentPressureRT != null) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, currentPressureRT.texture);
            gl.uniform1i(shader.pressureTextureUniform, 1);
        }

        // uniform variables
        gl.uniform4fv(shader.timeUniform, [gFrame, 0, 0, 0]);

        // Texture Space -> World Space
        // World Space -> Texture Space
        gl.uniform4fv(shader.TsWsUniform, [1, 1, 1, 0]);
        gl.uniform4fv(shader.WsTsUniform, [1, 1, 1, 0]);

        // Texture Space -> Index Space
        // Index Space -> Texture Space
        gl.uniform4fv(shader.TsIsUniform, [gSimX, gSimY, gSimZ, 0]);
        gl.uniform4fv(shader.IsTsUniform, [1.0 / gSimX, 1.0 / gSimY, 1.0 / gSimZ, 0]);

        // dt: x
        // h: y
        gl.uniform4fv(shader.optionUniform, [0.01, 1.0 / gSimX, 0, 0]);

        gl.uniform4fv(shader.invResolutionUniform, [1.0 / gSimX, 1.0 / gSimY, 1.0 / gSimZ, 0]);

        gl.uniform4fv(shader.texResolutionUniform, [gSimTexWidth, gSimTexHeight, 0, 0]);
        gl.uniform4fv(shader.simResolutionUniform, [gSimX, gSimY, gSimZ, 0]);
        gl.uniform4fv(shader.sliceResolutionUniform, [gSimTexWidth / gSimX, gSimTexHeight / gSimY, 0, 0]);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, plainVertexBuffer.numItems);
    }
    gl.enable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function clear(rt) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt);

    var width = gScreenWidth;
    var height = gScreenHeight;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// **************************************************************** //
//
// Render volume to current render target
//
// **************************************************************** //
var currentRT = volumeRT;
function renderVolume() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, currentRT);

    var width = currentRT.width;
    var height = currentRT.height;
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(viewMatrix);
    gl.disable(gl.DEPTH_TEST);
    {
        gl.useProgram(renderVolumeShader);

        gl.bindBuffer(gl.ARRAY_BUFFER, plainVertexBuffer);
        gl.vertexAttribPointer(renderVolumeShader.vertexPositionAttribute, plainVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        mat4.fromTranslation(modelMatrix, [0, 0, 0]);

        // set matrix
        mat4.ortho(orthoMatrix, 1, -1, 1, -1, -100, 100.0);
        gl.uniformMatrix4fv(renderVolumeShader.perspectiveMatrixUniform, false, orthoMatrix);
        gl.uniformMatrix4fv(renderVolumeShader.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(renderVolumeShader.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(renderVolumeShader.invViewMatrixUniform, false, invViewMatrix);
        gl.uniform4fv(renderVolumeShader.cameraParamsUniform, [cameraPosition.x, cameraPosition.y, cameraPosition.z, 0]);
        // texture
        gl.bindBuffer(gl.ARRAY_BUFFER, plainTextureCoordBuffer);
        gl.vertexAttribPointer(renderVolumeShader.textureCoordAttribute, plainTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);


        var A = perspectiveMatrix[0];
        var B = perspectiveMatrix[5];
        var C = perspectiveMatrix[10];
        var D = perspectiveMatrix[14];
        gl.uniform4fv(renderVolumeShader.projParamsUniform, [A, B, C, D]);

        gl.uniform4fv(renderVolumeShader.optionUniform, [gParameter.densityScale, gFrame, 0, 0]);

        gl.uniform4fv(renderVolumeShader.texResolutionUniform, [gSimTexWidth, gSimTexHeight, 0, 0]);
        gl.uniform4fv(renderVolumeShader.simResolutionUniform, [gSimX, gSimY, gSimZ, 0]);
        gl.uniform4fv(renderVolumeShader.sliceResolutionUniform, [gSimTexWidth / gSimX, gSimTexHeight / gSimY, 0, 0]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velDensityRT[0].texture);
        gl.uniform1i(renderVolumeShader.velDensityTextureUniform, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, plainVertexBuffer.numItems);
    }
    gl.enable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

var Parameter = function() {
    this.iteration = 1;
    this.densityScale = 10.0;
    this.addSource = 'bottom';
    this.showSimTexture = false;
    this.halfResolution = true;
    this.clear = function() {
        clear(velDensityRT[0]);
        clear(velDensityRT[1]);
        clear(pressureRT[0]);
        clear(pressureRT[1]);
    };
};
var gParameter = new Parameter();


// **************************************************************** //
//
// Simulation step (Stable fluids)
//
// **************************************************************** //
function updateFluid() {
    gFrame ++;
    var c0 = 0;
    var c1 = 1;
    
    // Velocity step
    if (gParameter.addSource == 'bottom') {
        update(velDensityRT[c0], null, velDensityRT[c1], addSourceShader);
    } else if (gParameter.addSource == 'side') {
        update(velDensityRT[c0], null, velDensityRT[c1], addSourceShader2);
    }
    // Project
    update(velDensityRT[c1], pressureRT[c0], pressureRT[c1], setupPressureShader);
    for (var i = 0; i < gParameter.iteration; ++i) {
        update(null, pressureRT[c1], pressureRT[c0], solvePressureShader);
        update(null, pressureRT[c0], pressureRT[c1], solvePressureShader);
    }
    update(null, pressureRT[c1], pressureRT[c0], solvePressureShader);
    update(velDensityRT[c1], pressureRT[c0], velDensityRT[c0], updateVelocityShader);

    // Density step
    update(velDensityRT[c0], null, velDensityRT[c1], advectDensityStepShader);

    // Velocity step
    update(velDensityRT[c1], null, velDensityRT[c0], advectVelStepShader);
}

// from glMatrix-0.9.5.min.js
function inverse(a,b){
b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],o=a[10],m=a[11],n=a[12],p=a[13],r=a[14],s=a[15],
A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*n,y=k*r-o*n,z=k*s-m*n,C=l*r-o*p,D=l*s-m*p,E=o*s-m*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);
b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+o*v-m*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-n*w+r*t-s*B)*q;
b[7]=(k*w-o*t+m*B)*q;b[8]=(f*D-h*z+j*x)*q;
b[9]=(-c*D+d*z-g*x)*q;b[10]=(n*v-p*t+s*A)*q;b[11]=(-k*v+l*t-m*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-n*u+p*B-r*A)*q;b[15]=(k*u-l*B+o*A)*q;return b}

var cameraPosition = new Float32Array();

function drawScene() {
    currentRT = volumeRT;
    if (gParameter.halfResolution) {
        currentRT = volumeHalfRT;
    }
    updateFluid();

    gl.viewport(0, 0, gScreenWidth, gScreenHeight);
    mat4.perspective(perspectiveMatrix, 60.0 / 180.0 * Math.PI, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    // mouse position -> spherical coordinate
    {
        var u = gMouseX / gScreenWidth;
        var v = gMouseY / gScreenHeight;
        var theta = (1 - v) * Math.PI / 2.0;
        var phi = u * Math.PI * 2.0;
        var r = gCurrentCameraDistance;
        var sx = r * Math.sin(theta) * Math.cos(phi);
        var sy = r * Math.cos(theta);
        var sz = r * Math.sin(theta) * Math.sin(phi);

        cameraPosition.x = sx;
        cameraPosition.y = sy;
        cameraPosition.z = sz;

        mat4.lookAt(viewMatrix, [sx, sy, sz], [0, 1, 0], [0, 1, 0]);
        inverse(viewMatrix, invViewMatrix);
    }
    renderVolume();

    gl.viewport(0, 0, gScreenWidth, gScreenHeight);
    drawTexture(showTextureRGBShader, currentRT.texture, 0, 0, 1, 1);

    if (gParameter.showSimTexture) {
      drawTexture(showTextureShader, velDensityRT[0].texture, 0.7, 0.0, 0.3, gScreenWidth / gScreenHeight * 0.3);
    }
}

function onWheel(e) {
    if(!e) e = window.event; //for legacy IE
    var delta = e.deltaY ? -(e.deltaY) : e.wheelDelta ? e.wheelDelta : -(e.detail);
    if (delta < 0){
        e.preventDefault();
        // down
        gCurrentCameraDistance -= 0.5;
    } else if (delta > 0){
        e.preventDefault();
        // up
        gCurrentCameraDistance += 0.5;
    }
}

function webGLStart() {
    // Setup canvas
    var canvas = document.getElementById("canvas");
    canvas.onmousemove = onMouseMove;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var mousewheelevent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
    try{
    	canvas.addEventListener(mousewheelevent, onWheel, false);
    }catch(e){
    	//for legacy IE
    	canvas.attachEvent("onmousewheel", onWheel);
    }
    gScreenWidth = canvas.width;
    gScreenHeight = canvas.height;

    // Setup WebGL
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Setup GUI
    var gui = new dat.GUI();
    gui.add(gParameter, 'iteration').min(1).max(10).step(1);
    gui.add(gParameter, 'densityScale').min(0.1).max(50).step(0.1);
    gui.add(gParameter, 'addSource', [ 'bottom', 'side'] );
    gui.add(gParameter, 'clear');
    gui.add(gParameter, 'showSimTexture');
    gui.add(gParameter, 'halfResolution');

    // Setup Stats
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );
    var update = function () {
        stats.begin();
        drawScene();
        stats.end();
        requestAnimationFrame(update);
    };
    requestAnimationFrame( update );
//    setInterval(drawScene, 16);
}

onload = function(){
    webGLStart();
};