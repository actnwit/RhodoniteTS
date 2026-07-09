import type { ObjectUID } from '../../types/CommonTypes';
import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { ComponentMemoryRegistry } from '../core/ComponentMemoryRegistry';
import { ComponentRepository } from '../core/ComponentRepository';
import { Config } from '../core/Config';
import { EntityRepository } from '../core/EntityRepository';
import { GlobalDataRepository } from '../core/GlobalDataRepository';
import { MemoryManager } from '../core/MemoryManager';
import { type ProcessApproachEnum } from '../definitions/ProcessApproach';
import { DummyTextures } from '../materials/core/DummyTextures';
import { Vector4 } from '../math/Vector4';
import { Logger } from '../misc/Logger';
import { type ICGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Expression } from '../renderer/Expression';
import { Frame } from '../renderer/Frame';
import { EngineState } from './EngineState';
import type { WebARSystem } from '../../xr/WebARSystem';
import type { WebXRSystem } from '../../xr/WebXRSystem';
import { RnObject } from '../core/RnObject';
import { MaterialRepository } from '../materials/core/MaterialRepository';
/**
 * The argument type for Engine.init() method.
 */
interface EngineInitDescription {
    approach: ProcessApproachEnum;
    canvas: HTMLCanvasElement;
    webglOption?: WebGLContextAttributes;
    notToDisplayRnInfoAtInit?: boolean;
    config?: Config;
}
/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * const engine = await Rn.Engine.init({
 *   approach: Rn.ProcessApproach.DataTexture,
 *   canvas: document.getElementById('world') as HTMLCanvasElement,
 * });
 *
 * ... (create something) ...
 *
 * engine.startRenderLoop((time, _myArg1, _myArg2) => {
 *   Rn.Engine.process([expression]);
 * }, myArg1, myArg2);
 * ```
 */
export declare class Engine extends RnObject {
    private __expressionForProcessAuto?;
    private __renderPassForProcessAuto?;
    private __processApproach;
    private __cgApiResourceRepository;
    private __webglResourceRepository?;
    private __webGpuResourceRepository?;
    private __engineState;
    private __renderPassTickCount;
    private __animationFrameId;
    private __renderLoopFunc?;
    private __args;
    private __webXRSystem;
    private __webARSystem;
    private __entityRepository;
    private __componentRepository;
    private __componentMemoryRegistry;
    private __memoryManager?;
    private __materialRepository;
    private __globalDataRepository;
    private __config;
    private __logger;
    private __dummyTextures?;
    private __lastCameraComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastPrimitiveCount;
    /** Shader program cache map for this engine instance. Maps shader text to program UIDs. */
    private __shaderProgramCache;
    private static __engines;
    private static __engineCount;
    private __engineUid;
    private constructor();
    get engineUid(): number;
    static getEngine(objectUid: ObjectUID): Engine | undefined;
    /**
     * Destroys the engine and releases all associated resources.
     *
     * @remarks
     * This method performs a comprehensive cleanup of all engine resources including:
     * - Stopping the render loop
     * - Deleting all entities and their components
     * - Destroying all textures (including dummy textures)
     * - Clearing material repository data
     * - Releasing GPU resources (WebGL/WebGPU)
     * - Clearing memory manager buffers
     *
     * After calling this method, the engine instance should not be used.
     *
     * @example
     * ```typescript
     * const engine = await Rn.Engine.init({ ... });
     * // ... use the engine ...
     * engine.destroy(); // Clean up all resources
     * ```
     */
    /**
     * Destroys the engine and releases all associated resources.
     *
     * @remarks
     * This method performs a comprehensive cleanup of all engine resources including:
     * - Stopping the render loop
     * - Invalidating all shader caches in materials
     * - Deleting all entities and their components
     * - Destroying all textures (including dummy textures)
     * - Clearing material repository data
     * - Releasing GPU resources (WebGL/WebGPU)
     * - Clearing memory manager buffers
     *
     * After calling this method, the engine instance should not be used.
     */
    destroy(): void;
    /**
     * Internal method that performs the actual resource cleanup.
     * Called after the render loop has fully stopped.
     */
    private __destroyResources;
    /**
     * Starts a render loop.
     *
     * @example
     * ```
     * Rn.Engine.startRenderLoop((time, _myArg1, _myArg2) => {
     *   Rn.Engine.process([expression]);
     * }, myArg1, myArg2);
     * ```
     *
     * @param renderLoopFunc - function to be called in each frame
     * @param args - arguments you want to be passed to renderLoopFunc
     */
    startRenderLoop(renderLoopFunc: (time: number, ...args: any[]) => void, ...args: any[]): void;
    private __getAnimationFrameObject;
    /**
     * Stops a existing render loop.
     */
    stopRenderLoop(): void;
    /**
     * Restart a render loop.
     */
    restartRenderLoop(): void;
    /**
     * A Simple version of process method
     *
     * @remarks
     * No need to create expressions and renderPasses and to register entities, etc...
     * It's suitable for simple use cases like sample apps.
     *
     * @param clearColor - color to clear the canvas
     */
    processAuto(clearColor?: Vector4): void;
    /**
     * A process method to render a scene
     *
     * @remarks
     * You need to call this method for rendering.
     *
     * @param frame/expression - a frame/expression object
     */
    process(frame: Frame): void;
    process(expressions: Expression[]): void;
    private __processRenderPassWebGPU;
    private __renderDeferredEffekseerEffectsAfterResolveWebGPU;
    private __renderMeshesWebGPU;
    private _processWebGPU;
    private _processWebGL;
    static get processTime(): number;
    static get timeAtProcessBegin(): number;
    static get timeAtProcessEnd(): number;
    static createCamera(engine: Engine): void;
    private setViewportForNormalRendering;
    private bindFramebufferWebGL;
    private __displayRnInfo;
    /**
     * Initialize the Rhodonite system.
     *
     * @remarks
     * Don't forget `await` to use this method.
     *
     * @example
     * ```
     * const engine = await Rn.Engine.init({
     *   approach: Rn.ProcessApproach.DataTexture,
     *   canvas: document.getElementById('world') as HTMLCanvasElement,
     * });
     * ```
     *
     * @param desc
     * @returns
     */
    static init(desc: EngineInitDescription): Promise<Engine>;
    get processApproach(): import("..").ProcessApproachClass;
    resizeCanvas(width: number, height: number): void;
    getCanvasSize(): [number, number];
    getCurrentWebGLContextWrapper(): import("../../webgl").WebGLContextWrapper | undefined;
    get entityRepository(): EntityRepository;
    get componentRepository(): ComponentRepository;
    get componentMemoryRegistry(): ComponentMemoryRegistry;
    get webXRSystem(): WebXRSystem;
    get webARSystem(): WebARSystem;
    get memoryManager(): MemoryManager;
    get globalDataRepository(): GlobalDataRepository;
    get materialRepository(): MaterialRepository;
    get webglResourceRepository(): WebGLResourceRepository;
    get cgApiResourceRepository(): ICGAPIResourceRepository;
    get webGpuResourceRepository(): WebGpuResourceRepository;
    get dummyTextures(): DummyTextures;
    get engineState(): EngineState;
    get config(): Config;
    get logger(): Logger;
    /**
     * Gets the shader program cache for this engine instance.
     * This cache maps shader text to compiled shader program UIDs.
     * Each engine has its own cache to prevent cross-contamination between WebGL contexts.
     * @internal
     */
    get shaderProgramCache(): Map<string, number>;
}
export {};
