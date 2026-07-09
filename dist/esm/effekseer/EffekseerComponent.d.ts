import type { ComponentToComponentMethods } from '../foundation/components/ComponentTypes';
import { Component } from '../foundation/core/Component';
import type { IEntity } from '../foundation/core/Entity';
import type { IVector3 } from '../foundation/math/IVector';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { ComponentSID, Second } from '../types/CommonTypes';
type WebGPUExternalRenderPassOptions = {
    colorFormat?: GPUTextureFormat;
    depthFormat?: GPUTextureFormat;
};
export declare class EffekseerComponent extends Component {
    static readonly ANIMATION_EVENT_PLAY = 0;
    static readonly ANIMATION_EVENT_PAUSE = 1;
    static readonly ANIMATION_EVENT_END = 2;
    static Unzip?: any;
    static wasmModuleUri?: string;
    static nativeScriptUri?: string;
    static wasmModuleUriWebGL?: string;
    static nativeScriptUriWebGL?: string;
    static wasmModuleUriWebGPU?: string;
    static nativeScriptUriWebGPU?: string;
    uri?: string;
    arrayBuffer?: ArrayBuffer;
    type: string;
    playJustAfterLoaded: boolean;
    isLoop: boolean;
    isPause: boolean;
    randomSeed: number;
    isImageLoadWithCredential: boolean;
    isSoundEnabled: boolean;
    autoResumeSoundByUserGesture: boolean;
    private __effect?;
    private __context?;
    private __handle?;
    private __speed;
    private __timer?;
    private __isInitialized;
    private __isDestroyed;
    private __loadPromise?;
    private __reportedMissingModule;
    private __autoResumeSoundEventTarget?;
    private __autoResumeSoundEventHandler?;
    private __webGpuSurfaceWidth;
    private __webGpuSurfaceHeight;
    private __webGpuSurfaceColorFormat?;
    private __webGpuSurfaceDepthFormat?;
    private static __runtimeInitializationPromise?;
    private static __runtimeInitializationKey?;
    private static __webGpuDeviceIds;
    private static __webGpuDeviceIdCount;
    private static __tmp_identityMatrix_0;
    private static __tmp_identityMatrix_1;
    static get componentTID(): 13;
    private static __getEffekseerModule;
    private static __getWebGpuDeviceId;
    private static __getRuntimeUris;
    private static __initializeRuntime;
    private static __formatError;
    cancelLoop(): void;
    isPlay(): boolean;
    play(): boolean;
    continue(): void;
    pause(): void;
    stop(): void;
    set playSpeed(val: number);
    get playSpeed(): number;
    setSoundVolume(volume: number): void;
    resumeSound(): Promise<boolean>;
    pauseSound(): void;
    private __registerAutoResumeSoundByUserGesture;
    private __unregisterAutoResumeSoundByUserGesture;
    private __resumeSoundByUserGesture;
    setTime(targetSec: Second): boolean;
    set translate(vec: IVector3);
    get translate(): IVector3;
    set rotate(vec: IVector3);
    get rotate(): IVector3;
    set scale(vec: IVector3);
    get scale(): IVector3;
    private __getBackend;
    private __getWebGpuDevice;
    prepareWebGPURendering(options?: WebGPUExternalRenderPassOptions): void;
    private __createEffekseerContext;
    $load(): void;
    $logic(): void;
    _destroy(): void;
    private __releaseEffekseerResources;
    private __drawEffekseerEffectNormal;
    private __drawEffekseerEffectWebGPU;
    private __drawEffekseerEffectWebXR;
    $render(): void;
    $renderWebGPU(renderPassEncoder: GPURenderPassEncoder, options?: WebGPUExternalRenderPassOptions, displayIdx?: number): void;
    static sort_$render(engine: Engine, renderPass: RenderPass): ComponentSID[];
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
export interface IEffekseerEntityMethods {
    getEffekseer(): EffekseerComponent;
}
export {};
