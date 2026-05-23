export class EffekseerError extends Error {
    constructor(message) {
        super(message);
        this.name = new.target.name;
    }
}
export class RuntimeNotInitializedError extends EffekseerError {
}
export class UnsupportedBackendError extends EffekseerError {
}
export class WebGPUUnavailableError extends EffekseerError {
}
export class WebGLContextLostError extends EffekseerError {
}
export class NativeInitializationError extends EffekseerError {
}
export class ResourceLoadError extends EffekseerError {
}
export class EffectLoadError extends EffekseerError {
}
export class SoundLoadError extends EffekseerError {
}
export class MaterialCompileError extends EffekseerError {
}
export class InvalidOperationError extends EffekseerError {
}
const runtimes = new Map();
function cwrapNumber(module, name, args) {
    return module.cwrap(name, "number", args);
}
function cwrapVoid(module, name, args) {
    return module.cwrap(name, "void", args);
}
function cwrapNumberAsync(module, name, args) {
    return module.cwrap(name, "number", args, { async: true });
}
function bindCore(module) {
    return {
        InitWebGL: cwrapNumber(module, "EffekseerInitWebGL", ["number", "number", "number", "number"]),
        InitWebGPU: cwrapNumber(module, "EffekseerInitWebGPU", ["number", "number", "number", "number"]),
        Terminate: cwrapVoid(module, "EffekseerTerminate", ["number"]),
        Update: cwrapVoid(module, "EffekseerUpdate", ["number", "number"]),
        BeginUpdate: cwrapVoid(module, "EffekseerBeginUpdate", ["number"]),
        EndUpdate: cwrapVoid(module, "EffekseerEndUpdate", ["number"]),
        UpdateHandle: cwrapVoid(module, "EffekseerUpdateHandle", ["number", "number", "number"]),
        Draw: cwrapVoid(module, "EffekseerDraw", ["number"]),
        BeginDraw: cwrapVoid(module, "EffekseerBeginDraw", ["number"]),
        EndDraw: cwrapVoid(module, "EffekseerEndDraw", ["number"]),
        DrawHandle: cwrapVoid(module, "EffekseerDrawHandle", ["number", "number"]),
        BeginWebGPUFrame: cwrapNumber(module, "EffekseerBeginWebGPUFrame", ["number"]),
        DrawWebGPUFrame: cwrapVoid(module, "EffekseerDrawWebGPUFrame", ["number"]),
        EndWebGPURenderPass: cwrapVoid(module, "EffekseerEndWebGPURenderPass", ["number"]),
        SubmitWebGPUFrame: cwrapVoid(module, "EffekseerSubmitWebGPUFrame", ["number"]),
        ReadWebGPUFrameBuffer: cwrapNumberAsync(module, "EffekseerReadWebGPUFrameBuffer", ["number", "number", "number"]),
        ResizeWebGPU: cwrapNumber(module, "EffekseerResizeWebGPU", ["number", "number", "number"]),
        DrawToExternalWebGPURenderPass: cwrapNumber(module, "EffekseerDrawToExternalWebGPURenderPass", ["number", "number", "number", "number"]),
        ReleaseImportedWebGPURenderPassEncoder: cwrapVoid(module, "EffekseerReleaseImportedWebGPURenderPassEncoder", ["number"]),
        SetProjectionMatrix: cwrapVoid(module, "EffekseerSetProjectionMatrix", ["number", "number"]),
        SetProjectionPerspective: cwrapVoid(module, "EffekseerSetProjectionPerspective", ["number", "number", "number", "number", "number"]),
        SetProjectionOrthographic: cwrapVoid(module, "EffekseerSetProjectionOrthographic", ["number", "number", "number", "number", "number"]),
        SetCameraMatrix: cwrapVoid(module, "EffekseerSetCameraMatrix", ["number", "number"]),
        SetCameraLookAt: cwrapVoid(module, "EffekseerSetCameraLookAt", ["number", "number", "number", "number", "number", "number", "number", "number", "number", "number"]),
        LoadEffect: cwrapNumber(module, "EffekseerLoadEffect", ["number", "number", "number", "number"]),
        ReleaseEffect: cwrapVoid(module, "EffekseerReleaseEffect", ["number", "number"]),
        ReloadResources: cwrapVoid(module, "EffekseerReloadResources", ["number", "number", "number", "number"]),
        StopAllEffects: cwrapVoid(module, "EffekseerStopAllEffects", ["number"]),
        PlayEffect: cwrapNumber(module, "EffekseerPlayEffect", ["number", "number", "number", "number", "number"]),
        StopEffect: cwrapVoid(module, "EffekseerStopEffect", ["number", "number"]),
        StopRoot: cwrapVoid(module, "EffekseerStopRoot", ["number", "number"]),
        Exists: cwrapNumber(module, "EffekseerExists", ["number", "number"]),
        SetFrame: cwrapVoid(module, "EffekseerSetFrame", ["number", "number", "number"]),
        SetLocation: cwrapVoid(module, "EffekseerSetLocation", ["number", "number", "number", "number", "number"]),
        SetRotation: cwrapVoid(module, "EffekseerSetRotation", ["number", "number", "number", "number", "number"]),
        SetScale: cwrapVoid(module, "EffekseerSetScale", ["number", "number", "number", "number", "number"]),
        SetMatrix: cwrapVoid(module, "EffekseerSetMatrix", ["number", "number", "number"]),
        GetDynamicInput: cwrapNumber(module, "EffekseerGetDynamicInput", ["number", "number", "number"]),
        SetDynamicInput: cwrapVoid(module, "EffekseerSetDynamicInput", ["number", "number", "number", "number"]),
        SendTrigger: cwrapVoid(module, "EffekseerSendTrigger", ["number", "number", "number"]),
        SetAllColor: cwrapVoid(module, "EffekseerSetAllColor", ["number", "number", "number", "number", "number", "number"]),
        SetTargetLocation: cwrapVoid(module, "EffekseerSetTargetLocation", ["number", "number", "number", "number", "number"]),
        SetPaused: cwrapVoid(module, "EffekseerSetPaused", ["number", "number", "number"]),
        SetShown: cwrapVoid(module, "EffekseerSetShown", ["number", "number", "number"]),
        SetSpeed: cwrapVoid(module, "EffekseerSetSpeed", ["number", "number", "number"]),
        SetRandomSeed: cwrapVoid(module, "EffekseerSetRandomSeed", ["number", "number", "number"]),
        GetRestInstancesCount: cwrapNumber(module, "EffekseerGetRestInstancesCount", ["number"]),
        GetUpdateTime: cwrapNumber(module, "EffekseerGetUpdateTime", ["number"]),
        GetDrawTime: cwrapNumber(module, "EffekseerGetDrawTime", ["number"]),
        IsVertexArrayObjectSupported: cwrapNumber(module, "EffekseerIsVertexArrayObjectSupported", ["number"]),
        SetRestorationOfStatesFlag: cwrapVoid(module, "EffekseerSetRestorationOfStatesFlag", ["number", "number"]),
        CaptureBackground: cwrapVoid(module, "EffekseerCaptureBackground", ["number", "number", "number", "number", "number"]),
        ResetBackground: cwrapVoid(module, "EffekseerResetBackground", ["number"]),
        SetListener: cwrapVoid(module, "EffekseerSetListener", ["number", "number", "number", "number", "number", "number", "number", "number", "number", "number"]),
        SetSoundVolume: cwrapVoid(module, "EffekseerSetSoundVolume", ["number", "number"]),
        PauseSound: cwrapVoid(module, "EffekseerPauseSound", ["number", "number"]),
        ResumeSound: cwrapVoid(module, "EffekseerResumeSound", ["number"]),
        SetLogEnabled: cwrapVoid(module, "EffekseerSetLogEnabled", ["number"]),
    };
}
async function loadScript(path) {
    if (typeof document === "undefined") {
        throw new RuntimeNotInitializedError("scriptPath loading requires a browser document.");
    }
    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = path;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new RuntimeNotInitializedError(`Failed to load native script: ${path}`));
        document.head.appendChild(script);
    });
}
function getGlobalFactory(backend) {
    const key = backend === "webgl" ? "effekseer_webgl_native" : "effekseer_webgpu_native";
    return globalThis[key];
}
async function requestWebGPUDevice(options) {
    if (options.device) {
        return options.device;
    }
    if (!("gpu" in navigator) || navigator.gpu == null) {
        throw new WebGPUUnavailableError("navigator.gpu is not available.");
    }
    const adapter = await navigator.gpu.requestAdapter(options.adapterOptions);
    if (!adapter) {
        throw new WebGPUUnavailableError("Failed to request a WebGPU adapter.");
    }
    const optional = ["float32-filterable", "texture-formats-tier2", "texture-compression-bc"];
    const requiredFeatures = optional.filter((feature) => adapter.features.has(feature));
    return adapter.requestDevice({
        ...options.deviceDescriptor,
        requiredFeatures: options.deviceDescriptor?.requiredFeatures ?? requiredFeatures,
    });
}
function toNativeWebGPUColorFormat(format) {
    switch (format ?? "rgba8unorm") {
        case "rgba8unorm":
            return 1;
        case "bgra8unorm":
            return 2;
        case "rgba8unorm-srgb":
            return 3;
        case "bgra8unorm-srgb":
            return 4;
        default:
            throw new InvalidOperationError(`Unsupported WebGPU color format for Effekseer: ${format}`);
    }
}
function toNativeWebGPUDepthFormat(format) {
    switch (format) {
        case undefined:
            return 0;
        case "depth32float":
            return 1;
        case "depth24plus-stencil8":
            return 2;
        case "depth32float-stencil8":
            return 3;
        default:
            throw new InvalidOperationError(`Unsupported WebGPU depth format for Effekseer: ${format}`);
    }
}
function prepareNativeWebGPUCanvas(canvas) {
    if (typeof document === "undefined" ||
        typeof HTMLCanvasElement === "undefined" ||
        !(canvas instanceof HTMLCanvasElement)) {
        return;
    }
    if (canvas.id === "canvas") {
        return;
    }
    const existing = document.getElementById("canvas");
    if (existing && existing !== canvas) {
        throw new NativeInitializationError("The native WebGPU backend renders to #canvas, but another element already uses that id.");
    }
    canvas.id = "canvas";
}
function arrayBufferFromView(view) {
    const copy = new Uint8Array(view.byteLength);
    copy.set(view);
    return copy.buffer;
}
function normalizeResourcePath(path) {
    let normalized = path.replace(/\\/g, "/");
    while (normalized.startsWith("./")) {
        normalized = normalized.slice(2);
    }
    normalized = normalized.replace(/\/{2,}/g, "/");
    return normalized;
}
function resourcePathCandidates(path, baseDir = "") {
    const candidates = new Set();
    const normalized = normalizeResourcePath(path);
    candidates.add(normalized);
    candidates.add(normalized.replace(/^\/+/, ""));
    if (baseDir) {
        const base = normalizeResourcePath(baseDir).replace(/\/?$/, "/");
        if (normalized.startsWith(base)) {
            candidates.add(normalized.slice(base.length));
        }
        else {
            candidates.add(normalizeResourcePath(base + normalized));
        }
    }
    return [...candidates].filter((candidate) => candidate.length > 0);
}
function addPackageResource(resources, path, buffer, baseDir = "") {
    for (const candidate of resourcePathCandidates(path, baseDir)) {
        resources.set(candidate, buffer);
    }
}
async function decodeImageFromBlob(blob) {
    if (typeof createImageBitmap === "function") {
        try {
            return await createImageBitmap(blob);
        }
        catch {
            // Fall through to HTMLImageElement for browsers that expose ImageBitmap but reject this input.
        }
    }
    if (typeof Image === "undefined") {
        throw new ResourceLoadError("ImageBitmap is unavailable and HTMLImageElement cannot be created.");
    }
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(blob);
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new ResourceLoadError("Failed to decode image resource."));
        };
        image.src = url;
    });
}
async function fetchArrayBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new ResourceLoadError(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.arrayBuffer();
}
class EffekseerRuntime {
    constructor(backend, module) {
        this.imageCrossOrigin = "";
        this.audioContext = null;
        this.loadingEffect = null;
        this.backend = backend;
        this.module = module;
        this.core = bindCore(module);
        module.resourcesMap = module.resourcesMap ?? {};
        module._isPowerOfTwo = (image) => image.width > 0 && image.height > 0 && (image.width & (image.width - 1)) === 0 && (image.height & (image.height - 1)) === 0;
        module._loadBinary = (path, isRequired) => this.loadingEffect?.requestBinary(path, isRequired !== 0) ?? null;
        module._loadImage = (path) => this.loadingEffect?.requestImage(path) ?? null;
    }
    static async create(options) {
        let factory = options.moduleFactory;
        if (!factory && options.scriptPath) {
            await loadScript(options.scriptPath);
            factory = getGlobalFactory(options.backend);
        }
        if (!factory) {
            factory = getGlobalFactory(options.backend);
        }
        if (!factory) {
            throw new RuntimeNotInitializedError(`Native module factory for ${options.backend} was not found.`);
        }
        const moduleOptions = {};
        if (options.locateFile) {
            moduleOptions.locateFile = options.locateFile;
        }
        else if (options.wasmPath) {
            const wasmPath = options.wasmPath;
            moduleOptions.locateFile = (path) => path.endsWith(".wasm") ? wasmPath : path;
        }
        if (options.backend === "webgpu") {
            moduleOptions.preinitializedWebGPUDevice = await requestWebGPUDevice(options);
        }
        const module = await factory(moduleOptions);
        return new EffekseerRuntime(options.backend, module);
    }
    setLogEnabled(flag) {
        this.core.SetLogEnabled(flag ? 1 : 0);
    }
    setImageCrossOrigin(crossOrigin) {
        this.imageCrossOrigin = crossOrigin;
    }
    setAudioContext(audioContext) {
        this.audioContext = audioContext;
    }
    async resumeAudio() {
        const nativeContext = this.module.AL?.currentCtx?.audioCtx ?? this.module.AL?.currentCtx?.ctx;
        const context = this.audioContext ?? nativeContext ?? null;
        if (context && context.state !== "running") {
            await context.resume();
        }
    }
    withNativeBuffer(buffer, callback) {
        const ptr = this.module._malloc(buffer.byteLength);
        try {
            const heap = this.module.HEAPU8 ?? this.module.HEAP8;
            if (!heap) {
                throw new NativeInitializationError("The native module does not expose a writable heap.");
            }
            heap.set(new Uint8Array(buffer), ptr);
            return callback(ptr, buffer.byteLength);
        }
        finally {
            this.module._free(ptr);
        }
    }
}
export async function initRuntime(options) {
    const runtime = await EffekseerRuntime.create(options);
    runtimes.set(options.backend, runtime);
}
export function getLastWebGPUError() {
    return runtimes.get("webgpu")?.module.effekseerLastWebGPUError;
}
export function getWebGPUErrors() {
    return runtimes.get("webgpu")?.module.effekseerWebGPUErrors ?? [];
}
function getRuntime(backend) {
    const runtime = runtimes.get(backend);
    if (!runtime) {
        throw new RuntimeNotInitializedError(`Runtime for ${backend} has not been initialized.`);
    }
    return runtime;
}
export function setLogEnabled(flag) {
    for (const runtime of runtimes.values()) {
        runtime.setLogEnabled(flag);
    }
}
export function setImageCrossOrigin(crossOrigin) {
    for (const runtime of runtimes.values()) {
        runtime.setImageCrossOrigin(crossOrigin);
    }
}
export function setAudioContext(audioContext) {
    for (const runtime of runtimes.values()) {
        runtime.setAudioContext(audioContext);
    }
}
class BaseEffekseerContext {
    constructor(runtime, backend, nativePtr) {
        this.released = false;
        this.runtime = runtime;
        this.backend = backend;
        this.nativePtr = nativePtr;
        if (nativePtr === 0) {
            throw new NativeInitializationError(`Failed to initialize ${backend} context.`);
        }
    }
    assertAlive() {
        if (this.released || this.nativePtr === 0) {
            throw new InvalidOperationError("Effekseer context has been released.");
        }
    }
    release() {
        if (!this.released && this.nativePtr !== 0) {
            this.runtime.core.Terminate(this.nativePtr);
            this.nativePtr = 0;
            this.released = true;
        }
    }
    update(deltaFrames = 1.0) {
        this.assertAlive();
        this.runtime.core.Update(this.nativePtr, deltaFrames);
    }
    beginUpdate() {
        this.assertAlive();
        this.runtime.core.BeginUpdate(this.nativePtr);
    }
    endUpdate() {
        this.assertAlive();
        this.runtime.core.EndUpdate(this.nativePtr);
    }
    updateHandle(handle, deltaFrames) {
        this.assertAlive();
        this.runtime.core.UpdateHandle(this.nativePtr, handle.native, deltaFrames);
    }
    draw() {
        this.assertAlive();
        this.runtime.core.Draw(this.nativePtr);
    }
    beginDraw() {
        this.assertAlive();
        this.runtime.core.BeginDraw(this.nativePtr);
    }
    drawHandle(handle) {
        this.assertAlive();
        this.runtime.core.DrawHandle(this.nativePtr, handle.native);
    }
    endDraw() {
        this.assertAlive();
        this.runtime.core.EndDraw(this.nativePtr);
    }
    setProjectionMatrix(matrixArray) {
        this.withStackMatrix(matrixArray, (ptr) => this.runtime.core.SetProjectionMatrix(this.nativePtr, ptr));
    }
    setProjectionPerspective(fov, aspect, near, far) {
        this.assertAlive();
        this.runtime.core.SetProjectionPerspective(this.nativePtr, fov, aspect, near, far);
    }
    setProjectionOrthographic(width, height, near, far) {
        this.assertAlive();
        this.runtime.core.SetProjectionOrthographic(this.nativePtr, width, height, near, far);
    }
    setCameraMatrix(matrixArray) {
        this.withStackMatrix(matrixArray, (ptr) => this.runtime.core.SetCameraMatrix(this.nativePtr, ptr));
    }
    setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upX = 0, upY = 1, upZ = 0) {
        this.assertAlive();
        this.runtime.core.SetCameraLookAt(this.nativePtr, positionX, positionY, positionZ, targetX, targetY, targetZ, upX, upY, upZ);
    }
    setCameraLookAtFromVector(position, target, up = { x: 0, y: 1, z: 0 }) {
        this.setCameraLookAt(position.x, position.y, position.z, target.x, target.y, target.z, up.x, up.y, up.z);
    }
    setCameraFromThree(camera, options = {}) {
        if (options.updateMatrixWorld !== false) {
            camera.updateMatrixWorld?.();
        }
        this.setProjectionMatrix(camera.projectionMatrix.elements);
        this.setCameraMatrix(camera.matrixWorldInverse.elements);
    }
    loadEffect(data, scaleOrOptions, onload, onerror, redirect) {
        this.assertAlive();
        const options = typeof scaleOrOptions === "number"
            ? { scale: scaleOrOptions, redirect }
            : (scaleOrOptions ?? {});
        const promise = this.loadEffectAsync(data, options);
        if (onload || onerror) {
            promise.then((effect) => onload?.(effect), (error) => onerror?.(error));
        }
        return promise;
    }
    loadEffectPackage(data, Unzip, scaleOrOptions = 1.0, onload, onerror) {
        const options = typeof scaleOrOptions === "number" ? { scale: scaleOrOptions } : scaleOrOptions;
        const promise = this.loadEffectPackageAsync(data, Unzip, options);
        if (onload || onerror) {
            promise.then((effect) => onload?.(effect), (error) => onerror?.(error));
        }
        return promise;
    }
    async loadEffectAsync(data, options) {
        const effect = new EffekseerEffect(this, options);
        if (typeof data === "string") {
            effect.baseDir = data.includes("/") ? data.slice(0, data.lastIndexOf("/") + 1) : "";
            await effect.loadFromBuffer(await fetchArrayBuffer(options.redirect ? options.redirect(data) : data));
        }
        else {
            await effect.loadFromBuffer(data);
        }
        return effect;
    }
    async loadEffectPackageAsync(data, Unzip, options) {
        const buffer = typeof data === "string" ? await fetchArrayBuffer(data) : data;
        const unzip = typeof Unzip === "function" ? new Unzip(new Uint8Array(buffer)) : Unzip;
        const meta = JSON.parse(new TextDecoder().decode(unzip.decompress("metafile.json")));
        let effectPath = "";
        let effectArchivePath = "";
        const packageResources = new Map();
        for (const [path, info] of Object.entries(meta.files)) {
            const normalizedPath = normalizeResourcePath(path);
            if (info.type === "Effect") {
                effectPath = normalizedPath;
                effectArchivePath = path;
            }
            else {
                const decompressed = unzip.decompress(path);
                addPackageResource(packageResources, normalizedPath, arrayBufferFromView(decompressed));
                if (info.type === "Curve" && info.dependencies?.[0]) {
                    addPackageResource(packageResources, `${normalizedPath}.efkcurve`, arrayBufferFromView(unzip.decompress(info.dependencies[0])));
                }
                else if (info.type === "Model" && info.dependencies?.[0]) {
                    addPackageResource(packageResources, normalizedPath, arrayBufferFromView(unzip.decompress(info.dependencies[0])));
                }
                else if (info.dependencies) {
                    for (const dependency of info.dependencies) {
                        const normalizedDependency = normalizeResourcePath(dependency);
                        addPackageResource(packageResources, normalizedDependency, arrayBufferFromView(unzip.decompress(dependency)));
                    }
                }
            }
        }
        if (!effectPath) {
            throw new EffectLoadError("Effect package does not contain an Effect entry.");
        }
        const effect = new EffekseerEffect(this, options, packageResources);
        await effect.loadFromBuffer(arrayBufferFromView(unzip.decompress(effectArchivePath || effectPath)));
        return effect;
    }
    releaseEffect(effect) {
        this.assertAlive();
        effect.release();
    }
    play(effect, x = 0, y = 0, z = 0) {
        this.assertAlive();
        if (!effect.isLoaded || effect.nativePtr === 0) {
            return null;
        }
        const handle = this.runtime.core.PlayEffect(this.nativePtr, effect.nativePtr, x, y, z);
        return handle >= 0 ? new EffekseerHandle(this, handle) : null;
    }
    stopAll() {
        this.assertAlive();
        this.runtime.core.StopAllEffects(this.nativePtr);
    }
    setSoundVolume(volume) {
        this.assertAlive();
        this.runtime.core.SetSoundVolume(this.nativePtr, volume);
    }
    setListener(position, at, up = { x: 0, y: 1, z: 0 }) {
        this.assertAlive();
        this.runtime.core.SetListener(this.nativePtr, position.x, position.y, position.z, at.x, at.y, at.z, up.x, up.y, up.z);
    }
    async resumeSound() {
        this.assertAlive();
        await this.runtime.resumeAudio();
        this.runtime.core.ResumeSound(this.nativePtr);
    }
    pauseSound() {
        this.assertAlive();
        this.runtime.core.PauseSound(this.nativePtr, 1);
    }
    getRestInstancesCount() {
        this.assertAlive();
        return this.runtime.core.GetRestInstancesCount(this.nativePtr);
    }
    getUpdateTime() {
        this.assertAlive();
        return this.runtime.core.GetUpdateTime(this.nativePtr);
    }
    getDrawTime() {
        this.assertAlive();
        return this.runtime.core.GetDrawTime(this.nativePtr);
    }
    getLastWebGPUError() {
        return this.backend === "webgpu" ? this.runtime.module.effekseerLastWebGPUError : undefined;
    }
    withStackMatrix(matrixArray, callback) {
        this.assertAlive();
        if (matrixArray.length < 16) {
            throw new InvalidOperationError("Matrix arrays must contain at least 16 elements.");
        }
        const stack = this.runtime.module.stackSave();
        try {
            const ptr = this.runtime.module.stackAlloc(4 * 16);
            this.runtime.module.HEAPF32.set(Array.from(matrixArray).slice(0, 16), ptr >> 2);
            callback(ptr);
        }
        finally {
            this.runtime.module.stackRestore(stack);
        }
    }
}
export class WebGLEffekseerContext extends BaseEffekseerContext {
    constructor(runtime, options) {
        if (!runtime.module.GL) {
            throw new NativeInitializationError("The native WebGL module did not expose Module.GL.");
        }
        const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" &&
            options.graphicsContext instanceof WebGL2RenderingContext;
        const glContextHandle = runtime.module.GL.registerContext(options.graphicsContext, {
            majorVersion: isWebGL2 ? 2 : 1,
            minorVersion: 0,
            enableExtensionsByDefault: options.enableExtensionsByDefault ?? true,
        });
        runtime.module.GL.makeContextCurrent(glContextHandle);
        const nativePtr = runtime.core.InitWebGL(options.instanceMaxCount ?? 4000, options.squareMaxCount ?? 10000, options.enableExtensionsByDefault === false ? 0 : 1, options.enablePremultipliedAlpha ? 1 : 0);
        super(runtime, "webgl", nativePtr);
        this.gl = options.graphicsContext;
        this.glContextHandle = glContextHandle;
    }
    makeContextCurrent() {
        this.runtime.module.GL?.makeContextCurrent(this.glContextHandle);
    }
    draw() {
        this.makeContextCurrent();
        super.draw();
    }
    setRestorationOfStatesFlag(flag) {
        this.runtime.core.SetRestorationOfStatesFlag(this.nativePtr, flag ? 1 : 0);
    }
    isVertexArrayObjectSupported() {
        return this.runtime.core.IsVertexArrayObjectSupported(this.nativePtr) !== 0;
    }
    captureBackground(x, y, width, height) {
        this.runtime.core.CaptureBackground(this.nativePtr, x, y, width, height);
    }
    resetBackground() {
        this.runtime.core.ResetBackground(this.nativePtr);
    }
}
export class WebGPUEffekseerContext extends BaseEffekseerContext {
    constructor(runtime, options) {
        const canvas = options.canvas ?? options.canvasContext?.canvas;
        prepareNativeWebGPUCanvas(canvas);
        const width = options.width ?? ("width" in (canvas ?? {}) ? Number(canvas.width) : 640);
        const height = options.height ?? ("height" in (canvas ?? {}) ? Number(canvas.height) : 480);
        const colorFormat = options.colorFormat ?? navigator.gpu.getPreferredCanvasFormat();
        options.canvasContext?.configure({
            device: options.device ?? runtime.module.preinitializedWebGPUDevice,
            format: colorFormat,
            alphaMode: "premultiplied",
        });
        const nativePtr = runtime.core.InitWebGPU(options.instanceMaxCount ?? 4000, options.squareMaxCount ?? 10000, width, height);
        super(runtime, "webgpu", nativePtr);
        this.frameActive = false;
        this.renderPassActive = false;
        this.device = options.device ?? runtime.module.preinitializedWebGPUDevice;
        this.canvasContext = options.canvasContext;
        this.colorFormat = colorFormat;
        this.depthFormat = options.depthFormat;
        this.width = width;
        this.height = height;
    }
    configureSurface(options = {}) {
        this.assertAlive();
        if (this.frameActive) {
            throw new InvalidOperationError("configureSurface cannot be called while a WebGPU frame is active.");
        }
        if (this.canvasContext && this.device) {
            this.colorFormat = options.colorFormat ?? this.colorFormat;
            this.canvasContext.configure({
                device: this.device,
                format: this.colorFormat,
                alphaMode: options.alphaMode ?? "premultiplied",
            });
        }
        this.depthFormat = options.depthFormat ?? this.depthFormat;
        const width = options.width ?? (this.canvasContext?.canvas && "width" in this.canvasContext.canvas ? Number(this.canvasContext.canvas.width) : undefined);
        const height = options.height ?? (this.canvasContext?.canvas && "height" in this.canvasContext.canvas ? Number(this.canvasContext.canvas.height) : undefined);
        if (width !== undefined && height !== undefined && this.runtime.core.ResizeWebGPU(this.nativePtr, width, height) === 0) {
            throw new NativeInitializationError("Failed to resize the native WebGPU surface.");
        }
        if (width !== undefined) {
            this.width = width;
        }
        if (height !== undefined) {
            this.height = height;
        }
    }
    draw() {
        this.drawToCanvas();
    }
    drawToCanvas() {
        this.beginRenderPass();
        try {
            this.drawCurrentFrame();
        }
        finally {
            this.endRenderPass();
        }
        this.submit();
    }
    beginRenderPass() {
        this.assertAlive();
        if (this.frameActive) {
            throw new InvalidOperationError("A WebGPU frame is already active.");
        }
        if (this.runtime.core.BeginWebGPUFrame(this.nativePtr) === 0) {
            throw new NativeInitializationError("Failed to begin the native WebGPU frame.");
        }
        this.frameActive = true;
        this.renderPassActive = true;
    }
    drawCurrentFrame() {
        this.assertAlive();
        if (!this.renderPassActive) {
            throw new InvalidOperationError("drawCurrentFrame requires an active native WebGPU render pass.");
        }
        this.runtime.core.DrawWebGPUFrame(this.nativePtr);
    }
    drawToRenderPass(renderPassEncoder, options = {}) {
        this.assertAlive();
        if (this.frameActive) {
            throw new InvalidOperationError("drawToRenderPass cannot run while a native WebGPU frame is active.");
        }
        const importRenderPass = this.runtime.module.__effekseerImportWebGPURenderPassEncoder;
        if (!importRenderPass) {
            throw new InvalidOperationError("The native WebGPU module does not expose render-pass object import.");
        }
        const nativeRenderPass = importRenderPass(renderPassEncoder);
        let consumed = false;
        try {
            const colorFormat = toNativeWebGPUColorFormat(options.colorFormat ?? this.colorFormat);
            const depthFormat = toNativeWebGPUDepthFormat(options.depthFormat ?? this.depthFormat);
            const ok = this.runtime.core.DrawToExternalWebGPURenderPass(this.nativePtr, nativeRenderPass, colorFormat, depthFormat) !== 0;
            consumed = ok;
            if (!ok) {
                throw new NativeInitializationError("Failed to draw into the external WebGPU render pass.");
            }
        }
        finally {
            if (!consumed) {
                this.runtime.core.ReleaseImportedWebGPURenderPassEncoder(nativeRenderPass);
            }
        }
    }
    async readFrameBuffer() {
        this.assertAlive();
        if (this.frameActive) {
            throw new InvalidOperationError("readFrameBuffer cannot run while a native WebGPU frame is active.");
        }
        if (!this.runtime.module.HEAPU8) {
            throw new NativeInitializationError("The native module did not expose HEAPU8.");
        }
        const bytesPerRow = this.width * 4;
        const byteLength = bytesPerRow * this.height;
        const dataPtr = this.runtime.module._malloc(byteLength);
        try {
            const written = await this.runtime.core.ReadWebGPUFrameBuffer(this.nativePtr, dataPtr, byteLength);
            if (written <= 0) {
                throw new NativeInitializationError("Failed to read the native WebGPU frame buffer.");
            }
            if (written > byteLength) {
                throw new NativeInitializationError(`Native WebGPU frame buffer readback requires ${written} bytes, but ${byteLength} bytes were allocated.`);
            }
            return {
                data: this.runtime.module.HEAPU8.slice(dataPtr, dataPtr + written),
                width: this.width,
                height: this.height,
                bytesPerRow,
            };
        }
        finally {
            this.runtime.module._free(dataPtr);
        }
    }
    endRenderPass() {
        this.assertAlive();
        if (!this.renderPassActive) {
            return;
        }
        this.runtime.core.EndWebGPURenderPass(this.nativePtr);
        this.renderPassActive = false;
    }
    submit() {
        this.assertAlive();
        if (!this.frameActive) {
            return;
        }
        if (this.renderPassActive) {
            this.endRenderPass();
        }
        this.runtime.core.SubmitWebGPUFrame(this.nativePtr);
        this.frameActive = false;
    }
    release() {
        if (this.frameActive) {
            this.submit();
        }
        super.release();
    }
}
export async function createContext(options) {
    const runtime = getRuntime(options.backend);
    if (options.audioContext) {
        runtime.setAudioContext(options.audioContext);
    }
    return options.backend === "webgl"
        ? new WebGLEffekseerContext(runtime, options)
        : new WebGPUEffekseerContext(runtime, options);
}
export function releaseContext(context) {
    context.release();
}
export class EffekseerEffect {
    constructor(context, options = {}, packageResources = new Map()) {
        this.nativePtr = 0;
        this.baseDir = "";
        this.isLoaded = false;
        this.mainBuffer = null;
        this.resources = new Map();
        this.pending = [];
        this.context = context;
        this.options = options;
        this.packageResources = packageResources;
    }
    async loadFromBuffer(buffer) {
        this.mainBuffer = buffer;
        let guard = 0;
        while (guard++ < 16) {
            this.pending = [];
            this.context.runtime.loadingEffect = this;
            try {
                this.context.runtime.withNativeBuffer(buffer, (ptr, size) => {
                    if (this.nativePtr === 0) {
                        this.nativePtr = this.context.runtime.core.LoadEffect(this.context.nativePtr, ptr, size, this.options.scale ?? 1.0);
                    }
                    else {
                        this.context.runtime.core.ReloadResources(this.context.nativePtr, this.nativePtr, ptr, size);
                    }
                });
            }
            finally {
                this.context.runtime.loadingEffect = null;
            }
            if (this.nativePtr === 0) {
                throw new EffectLoadError("Native effect creation failed.");
            }
            if (this.pending.length === 0) {
                this.isLoaded = true;
                return;
            }
            await Promise.all(this.pending);
        }
        throw new EffectLoadError("Effect resource dependency resolution did not converge.");
    }
    requestBinary(path, required) {
        const normalizedPath = normalizeResourcePath(path);
        const key = `binary:${normalizedPath}`;
        const found = this.resources.get(key);
        if (found) {
            return found.loaded ? found.buffer : null;
        }
        const resource = { kind: "binary", path: normalizedPath, required, loaded: false, buffer: null };
        resource.promise = this.resolveBinary(normalizedPath, required)
            .then((buffer) => {
            resource.buffer = buffer;
            resource.loaded = true;
        })
            .catch((error) => {
            resource.loaded = true;
            if (required) {
                throw error instanceof Error ? error : new ResourceLoadError(String(error));
            }
        });
        this.resources.set(key, resource);
        this.pending.push(resource.promise);
        return null;
    }
    requestImage(path) {
        const normalizedPath = normalizeResourcePath(path);
        const key = `image:${normalizedPath}`;
        const found = this.resources.get(key);
        if (found) {
            return found.loaded ? found.image : null;
        }
        const resource = { kind: "image", path: normalizedPath, required: true, loaded: false, image: null };
        resource.promise = this.resolveImage(normalizedPath).then((image) => {
            resource.image = image;
            resource.loaded = true;
        });
        this.resources.set(key, resource);
        this.pending.push(resource.promise);
        return null;
    }
    release() {
        if (this.nativePtr !== 0) {
            this.context.runtime.core.ReleaseEffect(this.context.nativePtr, this.nativePtr);
            this.nativePtr = 0;
            this.isLoaded = false;
        }
    }
    resolveUrl(path) {
        const url = normalizeResourcePath(this.baseDir + path);
        return this.options.redirect ? this.options.redirect(url) : url;
    }
    async resolveBinary(path, required) {
        for (const candidate of resourcePathCandidates(path, this.baseDir)) {
            const packaged = this.packageResources.get(candidate);
            if (packaged) {
                return packaged;
            }
        }
        const url = this.resolveUrl(path);
        try {
            const loaded = this.options.resourceLoader
                ? await this.options.resourceLoader(url, "binary", this.baseDir)
                : await fetchArrayBuffer(url);
            if (loaded instanceof ArrayBuffer) {
                return loaded;
            }
            if (loaded instanceof Blob) {
                return await loaded.arrayBuffer();
            }
            throw new ResourceLoadError(`Resource loader returned an image for binary resource ${url}.`);
        }
        catch (error) {
            if (!required) {
                return null;
            }
            throw error instanceof Error ? error : new ResourceLoadError(String(error));
        }
    }
    async resolveImage(path) {
        for (const candidate of resourcePathCandidates(path, this.baseDir)) {
            const packaged = this.packageResources.get(candidate);
            if (packaged) {
                return decodeImageFromBlob(new Blob([packaged]));
            }
        }
        const url = this.resolveUrl(path);
        const loaded = this.options.resourceLoader
            ? await this.options.resourceLoader(url, "image", this.baseDir)
            : await fetch(url).then(async (response) => {
                if (!response.ok) {
                    throw new ResourceLoadError(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                }
                return response.blob();
            });
        if (loaded instanceof Blob) {
            return decodeImageFromBlob(loaded);
        }
        if (loaded instanceof ArrayBuffer) {
            return decodeImageFromBlob(new Blob([loaded]));
        }
        return loaded;
    }
}
export class EffekseerHandle {
    constructor(context, native) {
        this.context = context;
        this.native = native;
    }
    stop() {
        this.context.runtime.core.StopEffect(this.context.nativePtr, this.native);
    }
    stopRoot() {
        this.context.runtime.core.StopRoot(this.context.nativePtr, this.native);
    }
    get exists() {
        return this.context.runtime.core.Exists(this.context.nativePtr, this.native) !== 0;
    }
    setFrame(frame) {
        this.context.runtime.core.SetFrame(this.context.nativePtr, this.native, frame);
    }
    setLocation(x, y, z) {
        this.context.runtime.core.SetLocation(this.context.nativePtr, this.native, x, y, z);
    }
    setRotation(x, y, z) {
        this.context.runtime.core.SetRotation(this.context.nativePtr, this.native, x, y, z);
    }
    setScale(x, y, z) {
        this.context.runtime.core.SetScale(this.context.nativePtr, this.native, x, y, z);
    }
    setMatrix(matrixArray) {
        const module = this.context.runtime.module;
        const stack = module.stackSave();
        try {
            const ptr = module.stackAlloc(4 * 16);
            module.HEAPF32.set(Array.from(matrixArray).slice(0, 16), ptr >> 2);
            this.context.runtime.core.SetMatrix(this.context.nativePtr, this.native, ptr);
        }
        finally {
            module.stackRestore(stack);
        }
    }
    setAllColor(r, g, b, a) {
        this.context.runtime.core.SetAllColor(this.context.nativePtr, this.native, r, g, b, a);
    }
    setTargetLocation(x, y, z) {
        this.context.runtime.core.SetTargetLocation(this.context.nativePtr, this.native, x, y, z);
    }
    getDynamicInput(index) {
        return this.context.runtime.core.GetDynamicInput(this.context.nativePtr, this.native, index);
    }
    setDynamicInput(index, value) {
        this.context.runtime.core.SetDynamicInput(this.context.nativePtr, this.native, index, value);
    }
    sendTrigger(index) {
        this.context.runtime.core.SendTrigger(this.context.nativePtr, this.native, index);
    }
    setPaused(paused) {
        this.context.runtime.core.SetPaused(this.context.nativePtr, this.native, paused ? 1 : 0);
    }
    setShown(shown) {
        this.context.runtime.core.SetShown(this.context.nativePtr, this.native, shown ? 1 : 0);
    }
    setSpeed(speed) {
        this.context.runtime.core.SetSpeed(this.context.nativePtr, this.native, speed);
    }
    setRandomSeed(seed) {
        this.context.runtime.core.SetRandomSeed(this.context.nativePtr, this.native, seed);
    }
}
