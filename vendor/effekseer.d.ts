declare global {
    type GPUFeatureName = string;
    type GPUTextureFormat = string;
    type GPUCanvasAlphaMode = "opaque" | "premultiplied";
    interface GPURequestAdapterOptions {
        powerPreference?: "low-power" | "high-performance";
        forceFallbackAdapter?: boolean;
    }
    interface GPUDeviceDescriptor {
        label?: string;
        requiredFeatures?: Iterable<GPUFeatureName>;
        requiredLimits?: Record<string, number>;
        defaultQueue?: {
            label?: string;
        };
    }
    interface GPUFeatureSet {
        has(feature: GPUFeatureName): boolean;
    }
    interface GPUAdapter {
        readonly features: GPUFeatureSet;
        requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
    }
    interface GPUQueue {
    }
    interface GPUDevice extends EventTarget {
        readonly queue: GPUQueue;
    }
    interface GPUTexture {
    }
    interface GPUCanvasConfiguration {
        device: GPUDevice;
        format: GPUTextureFormat;
        alphaMode?: GPUCanvasAlphaMode;
    }
    interface GPUCanvasContext {
        readonly canvas: HTMLCanvasElement | OffscreenCanvas;
        configure(configuration: GPUCanvasConfiguration): void;
        unconfigure?(): void;
        getCurrentTexture(): GPUTexture;
    }
    interface GPURenderPassEncoder {
    }
    interface GPU {
        requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
        getPreferredCanvasFormat(): GPUTextureFormat;
    }
    interface Navigator {
        readonly gpu: GPU;
    }
}
export type BackendType = "webgl" | "webgpu";
export declare class EffekseerError extends Error {
    constructor(message: string);
}
export declare class RuntimeNotInitializedError extends EffekseerError {
}
export declare class UnsupportedBackendError extends EffekseerError {
}
export declare class WebGPUUnavailableError extends EffekseerError {
}
export declare class WebGLContextLostError extends EffekseerError {
}
export declare class NativeInitializationError extends EffekseerError {
}
export declare class ResourceLoadError extends EffekseerError {
}
export declare class EffectLoadError extends EffekseerError {
}
export declare class SoundLoadError extends EffekseerError {
}
export declare class MaterialCompileError extends EffekseerError {
}
export declare class InvalidOperationError extends EffekseerError {
}
type NativeValueType = "number" | "void" | "string";
type NativeArgType = "number" | "string";
type NativeCwrapOptions = {
    async?: boolean;
};
export interface NativeModule {
    cwrap(name: string, returnType: NativeValueType, argTypes: NativeArgType[], options?: NativeCwrapOptions): (...args: number[]) => number | void | Promise<number | void>;
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAP8?: Int8Array;
    HEAPU8?: Uint8Array;
    HEAPF32: Float32Array;
    stackSave(): number;
    stackRestore(stack: number): void;
    stackAlloc(size: number): number;
    GL?: {
        registerContext(context: WebGLRenderingContext | WebGL2RenderingContext, attrs: Record<string, unknown>): number;
        makeContextCurrent(contextHandle: number): void;
    };
    AL?: {
        currentCtx?: {
            audioCtx?: AudioContext;
            ctx?: AudioContext;
        };
    };
    resourcesMap?: Record<string, ArrayBuffer>;
    _loadBinary?: (path: string, isRequired: number) => ArrayBuffer | null;
    _loadImage?: (path: string) => TexImageSource | null;
    _isPowerOfTwo?: (image: {
        width: number;
        height: number;
    }) => boolean;
    preinitializedWebGPUDevice?: GPUDevice;
    effekseerLastWebGPUError?: string;
    effekseerWebGPUErrors?: string[];
    __effekseerImportWebGPURenderPassEncoder?: (renderPassEncoder: GPURenderPassEncoder) => number;
}
export type NativeModuleFactory = (options?: Record<string, unknown>) => NativeModule | Promise<NativeModule>;
export interface RuntimeOptionsBase {
    backend: BackendType;
    wasmPath?: string;
    scriptPath?: string;
    moduleFactory?: NativeModuleFactory;
    locateFile?: (path: string, prefix: string) => string;
}
export interface WebGLRuntimeOptions extends RuntimeOptionsBase {
    backend: "webgl";
}
export interface WebGPURuntimeOptions extends RuntimeOptionsBase {
    backend: "webgpu";
    device?: GPUDevice;
    adapterOptions?: GPURequestAdapterOptions;
    deviceDescriptor?: GPUDeviceDescriptor;
}
export type RuntimeOptions = WebGLRuntimeOptions | WebGPURuntimeOptions;
export interface ContextOptionsBase {
    backend: BackendType;
    instanceMaxCount?: number;
    squareMaxCount?: number;
    audioContext?: AudioContext;
}
export interface WebGLContextOptions extends ContextOptionsBase {
    backend: "webgl";
    graphicsContext: WebGLRenderingContext | WebGL2RenderingContext;
    enableExtensionsByDefault?: boolean;
    enablePremultipliedAlpha?: boolean;
    enableTimerQuery?: boolean;
    onTimerQueryReport?: (nanoseconds: number) => void;
    timerQueryReportIntervalCount?: number;
}
export interface WebGPUContextOptions extends ContextOptionsBase {
    backend: "webgpu";
    canvas?: HTMLCanvasElement | OffscreenCanvas;
    canvasContext?: GPUCanvasContext;
    device?: GPUDevice;
    colorFormat?: GPUTextureFormat;
    depthFormat?: GPUTextureFormat;
    width?: number;
    height?: number;
}
export interface WebGPUExternalRenderPassOptions {
    colorFormat?: GPUTextureFormat;
    depthFormat?: GPUTextureFormat;
}
export interface WebGPUFrameBufferReadback {
    data: Uint8Array;
    width: number;
    height: number;
    bytesPerRow: number;
}
export type ContextOptions = WebGLContextOptions | WebGPUContextOptions;
export interface Matrix4Like {
    elements: ArrayLike<number>;
}
export interface ThreeCameraLike {
    projectionMatrix: Matrix4Like;
    matrixWorldInverse: Matrix4Like;
    updateMatrixWorld?: () => void;
}
export interface ThreeCameraOptions {
    updateMatrixWorld?: boolean;
}
export interface EffectLoadOptions {
    scale?: number;
    redirect?: (url: string) => string;
    resourceLoader?: ResourceLoader;
}
export type EffectLoadCallback = (effect: EffekseerEffect) => void;
export type EffectLoadErrorCallback = (error: unknown) => void;
export type ResourceType = "binary" | "image" | "sound" | "material";
export type ResourceLoader = (url: string, type: ResourceType, baseDir: string) => Promise<ArrayBuffer | Blob | TexImageSource> | ArrayBuffer | Blob | TexImageSource;
export interface UnzipLike {
    decompress(path: string): Uint8Array;
}
export type UnzipConstructor = new (data: Uint8Array) => UnzipLike;
interface NativeCore {
    InitWebGL(instanceMaxCount: number, squareMaxCount: number, extensions: number, premultipliedAlpha: number): number;
    InitWebGPU(instanceMaxCount: number, squareMaxCount: number, width: number, height: number): number;
    Terminate(context: number): void;
    Update(context: number, deltaFrames: number): void;
    BeginUpdate(context: number): void;
    EndUpdate(context: number): void;
    UpdateHandle(context: number, handle: number, deltaFrames: number): void;
    Draw(context: number): void;
    BeginDraw(context: number): void;
    EndDraw(context: number): void;
    DrawHandle(context: number, handle: number): void;
    BeginWebGPUFrame(context: number): number;
    DrawWebGPUFrame(context: number): void;
    EndWebGPURenderPass(context: number): void;
    SubmitWebGPUFrame(context: number): void;
    ReadWebGPUFrameBuffer(context: number, data: number, size: number): Promise<number>;
    ResizeWebGPU(context: number, width: number, height: number): number;
    DrawToExternalWebGPURenderPass(context: number, renderPassEncoder: number, colorFormat: number, depthFormat: number): number;
    ReleaseImportedWebGPURenderPassEncoder(renderPassEncoder: number): void;
    SetProjectionMatrix(context: number, matrix: number): void;
    SetProjectionPerspective(context: number, fov: number, aspect: number, near: number, far: number): void;
    SetProjectionOrthographic(context: number, width: number, height: number, near: number, far: number): void;
    SetCameraMatrix(context: number, matrix: number): void;
    SetCameraLookAt(context: number, eyeX: number, eyeY: number, eyeZ: number, atX: number, atY: number, atZ: number, upX: number, upY: number, upZ: number): void;
    LoadEffect(context: number, data: number, size: number, scale: number): number;
    ReleaseEffect(context: number, effect: number): void;
    ReloadResources(context: number, effect: number, data: number, size: number): void;
    StopAllEffects(context: number): void;
    PlayEffect(context: number, effect: number, x: number, y: number, z: number): number;
    StopEffect(context: number, handle: number): void;
    StopRoot(context: number, handle: number): void;
    Exists(context: number, handle: number): number;
    SetFrame(context: number, handle: number, frame: number): void;
    SetLocation(context: number, handle: number, x: number, y: number, z: number): void;
    SetRotation(context: number, handle: number, x: number, y: number, z: number): void;
    SetScale(context: number, handle: number, x: number, y: number, z: number): void;
    SetMatrix(context: number, handle: number, matrix: number): void;
    GetDynamicInput(context: number, handle: number, index: number): number;
    SetDynamicInput(context: number, handle: number, index: number, value: number): void;
    SendTrigger(context: number, handle: number, index: number): void;
    SetAllColor(context: number, handle: number, r: number, g: number, b: number, a: number): void;
    SetTargetLocation(context: number, handle: number, x: number, y: number, z: number): void;
    SetPaused(context: number, handle: number, paused: number): void;
    SetShown(context: number, handle: number, shown: number): void;
    SetSpeed(context: number, handle: number, speed: number): void;
    SetRandomSeed(context: number, handle: number, seed: number): void;
    GetRestInstancesCount(context: number): number;
    GetUpdateTime(context: number): number;
    GetDrawTime(context: number): number;
    IsVertexArrayObjectSupported(context: number): number;
    SetRestorationOfStatesFlag(context: number, flag: number): void;
    CaptureBackground(context: number, x: number, y: number, width: number, height: number): void;
    ResetBackground(context: number): void;
    SetListener(context: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, ux: number, uy: number, uz: number): void;
    SetSoundVolume(context: number, volume: number): void;
    PauseSound(context: number, paused: number): void;
    ResumeSound(context: number): void;
    SetLogEnabled(flag: number): void;
}
declare class EffekseerRuntime {
    readonly backend: BackendType;
    readonly module: NativeModule;
    readonly core: NativeCore;
    imageCrossOrigin: string;
    audioContext: AudioContext | null;
    loadingEffect: EffekseerEffect | null;
    private constructor();
    static create(options: RuntimeOptions): Promise<EffekseerRuntime>;
    setLogEnabled(flag: boolean): void;
    setImageCrossOrigin(crossOrigin: string): void;
    setAudioContext(audioContext: AudioContext): void;
    resumeAudio(): Promise<void>;
    withNativeBuffer<T>(buffer: ArrayBuffer, callback: (ptr: number, size: number) => T): T;
}
export declare function initRuntime(options: RuntimeOptions): Promise<void>;
export declare function getLastWebGPUError(): string | undefined;
export declare function getWebGPUErrors(): readonly string[];
export declare function setLogEnabled(flag: boolean): void;
export declare function setImageCrossOrigin(crossOrigin: string): void;
export declare function setAudioContext(audioContext: AudioContext): void;
declare abstract class BaseEffekseerContext {
    readonly runtime: EffekseerRuntime;
    readonly backend: BackendType;
    nativePtr: number;
    private released;
    protected constructor(runtime: EffekseerRuntime, backend: BackendType, nativePtr: number);
    protected assertAlive(): void;
    release(): void;
    update(deltaFrames?: number): void;
    beginUpdate(): void;
    endUpdate(): void;
    updateHandle(handle: EffekseerHandle, deltaFrames: number): void;
    draw(): void;
    beginDraw(): void;
    drawHandle(handle: EffekseerHandle): void;
    endDraw(): void;
    setProjectionMatrix(matrixArray: ArrayLike<number>): void;
    setProjectionPerspective(fov: number, aspect: number, near: number, far: number): void;
    setProjectionOrthographic(width: number, height: number, near: number, far: number): void;
    setCameraMatrix(matrixArray: ArrayLike<number>): void;
    setCameraLookAt(positionX: number, positionY: number, positionZ: number, targetX: number, targetY: number, targetZ: number, upX?: number, upY?: number, upZ?: number): void;
    setCameraLookAtFromVector(position: {
        x: number;
        y: number;
        z: number;
    }, target: {
        x: number;
        y: number;
        z: number;
    }, up?: {
        x: number;
        y: number;
        z: number;
    }): void;
    setCameraFromThree(camera: ThreeCameraLike, options?: ThreeCameraOptions): void;
    loadEffect(data: string | ArrayBuffer, scaleOrOptions?: number | EffectLoadOptions, onload?: EffectLoadCallback, onerror?: EffectLoadErrorCallback, redirect?: (url: string) => string): Promise<EffekseerEffect>;
    loadEffectPackage(data: string | ArrayBuffer, Unzip: UnzipConstructor | UnzipLike, scaleOrOptions?: number | EffectLoadOptions, onload?: EffectLoadCallback, onerror?: EffectLoadErrorCallback): Promise<EffekseerEffect>;
    private loadEffectAsync;
    private loadEffectPackageAsync;
    releaseEffect(effect: EffekseerEffect): void;
    play(effect: EffekseerEffect, x?: number, y?: number, z?: number): EffekseerHandle | null;
    stopAll(): void;
    setSoundVolume(volume: number): void;
    setListener(position: {
        x: number;
        y: number;
        z: number;
    }, at: {
        x: number;
        y: number;
        z: number;
    }, up?: {
        x: number;
        y: number;
        z: number;
    }): void;
    resumeSound(): Promise<void>;
    pauseSound(): void;
    getRestInstancesCount(): number;
    getUpdateTime(): number;
    getDrawTime(): number;
    getLastWebGPUError(): string | undefined;
    private withStackMatrix;
}
export declare class WebGLEffekseerContext extends BaseEffekseerContext {
    readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
    private glContextHandle;
    constructor(runtime: EffekseerRuntime, options: WebGLContextOptions);
    makeContextCurrent(): void;
    draw(): void;
    setRestorationOfStatesFlag(flag: boolean): void;
    isVertexArrayObjectSupported(): boolean;
    captureBackground(x: number, y: number, width: number, height: number): void;
    resetBackground(): void;
}
export declare class WebGPUEffekseerContext extends BaseEffekseerContext {
    readonly device: GPUDevice | undefined;
    readonly canvasContext: GPUCanvasContext | undefined;
    private frameActive;
    private renderPassActive;
    private colorFormat;
    private depthFormat;
    private width;
    private height;
    constructor(runtime: EffekseerRuntime, options: WebGPUContextOptions);
    configureSurface(options?: {
        width?: number;
        height?: number;
        colorFormat?: GPUTextureFormat;
        depthFormat?: GPUTextureFormat;
        alphaMode?: GPUCanvasAlphaMode;
    }): void;
    draw(): void;
    drawToCanvas(): void;
    beginRenderPass(): void;
    drawCurrentFrame(): void;
    drawToRenderPass(renderPassEncoder: GPURenderPassEncoder, options?: WebGPUExternalRenderPassOptions): void;
    readFrameBuffer(): Promise<WebGPUFrameBufferReadback>;
    endRenderPass(): void;
    submit(): void;
    release(): void;
}
export type EffekseerContext = WebGLEffekseerContext | WebGPUEffekseerContext;
export declare function createContext(options: ContextOptions): Promise<EffekseerContext>;
export declare function releaseContext(context: EffekseerContext): void;
export declare class EffekseerEffect {
    readonly context: BaseEffekseerContext;
    readonly options: EffectLoadOptions;
    readonly packageResources: Map<string, ArrayBuffer>;
    nativePtr: number;
    baseDir: string;
    isLoaded: boolean;
    mainBuffer: ArrayBuffer | null;
    private resources;
    private pending;
    constructor(context: BaseEffekseerContext, options?: EffectLoadOptions, packageResources?: Map<string, ArrayBuffer>);
    loadFromBuffer(buffer: ArrayBuffer): Promise<void>;
    requestBinary(path: string, required: boolean): ArrayBuffer | null;
    requestImage(path: string): TexImageSource | null;
    release(): void;
    private resolveUrl;
    private resolveBinary;
    private resolveImage;
}
export declare class EffekseerHandle {
    readonly context: BaseEffekseerContext;
    readonly native: number;
    constructor(context: BaseEffekseerContext, native: number);
    stop(): void;
    stopRoot(): void;
    get exists(): boolean;
    setFrame(frame: number): void;
    setLocation(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
    setMatrix(matrixArray: ArrayLike<number>): void;
    setAllColor(r: number, g: number, b: number, a: number): void;
    setTargetLocation(x: number, y: number, z: number): void;
    getDynamicInput(index: number): number;
    setDynamicInput(index: number, value: number): void;
    sendTrigger(index: number): void;
    setPaused(paused: boolean): void;
    setShown(shown: boolean): void;
    setSpeed(speed: number): void;
    setRandomSeed(seed: number): void;
}
export {};
