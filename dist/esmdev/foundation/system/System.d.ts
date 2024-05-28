import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { Expression } from '../renderer/Expression';
import { Frame } from '../renderer/Frame';
import { Vector4 } from '../math/Vector4';
/**
 * The argument type for System.init() method.
 */
interface SystemInitDescription {
    approach: ProcessApproachEnum;
    canvas: HTMLCanvasElement;
    memoryUsageOrder?: {
        cpuGeneric: number;
        gpuInstanceData: number;
        gpuVertexData: number;
    };
    webglOption?: WebGLContextAttributes;
    notToDisplayRnInfoAtInit?: boolean;
}
/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * await Rn.System.init({
 *   approach: Rn.ProcessApproach.DataTexture,
 *   canvas: document.getElementById('world') as HTMLCanvasElement,
 * });
 *
 * ... (create something) ...
 *
 * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
 *   Rn.System.process([expression]);
 * }, myArg1, myArg2);
 * ```
 */
export declare class System {
    private static __expressionForProcessAuto?;
    private static __renderPassForProcessAuto?;
    private static __processApproach;
    private static __cgApiResourceRepository;
    private static __renderPassTickCount;
    private static __animationFrameId;
    private static __renderLoopFunc?;
    private static __args;
    private static __rnXRModule?;
    private static __lastCameraControllerComponentsUpdateCount;
    private static __lastTransformComponentsUpdateCount;
    private static __lastPrimitiveCount;
    private constructor();
    /**
     * Starts a render loop.
     *
     * @example
     * ```
     * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
     *   Rn.System.process([expression]);
     * }, myArg1, myArg2);
     * ```
     *
     * @param renderLoopFunc - function to be called in each frame
     * @param args - arguments you want to be passed to renderLoopFunc
     */
    static startRenderLoop(renderLoopFunc: (time: number, ...args: any[]) => void, ...args: any[]): void;
    private static __getAnimationFrameObject;
    /**
     * Stops a existing render loop.
     */
    static stopRenderLoop(): void;
    /**
     * Restart a render loop.
     */
    static restartRenderLoop(): void;
    /**
     * A Simple version of process method
     *
     * @remarks
     * No need to create expressions and renderPasses and to register entities, etc...
     * It's suitable for simple use cases like sample apps.
     *
     * @param clearColor - color to clear the canvas
     */
    static processAuto(clearColor?: Vector4): void;
    /**
     * A process method to render a scene
     *
     * @remarks
     * You need to call this method for rendering.
     *
     * @param frame/expression - a frame/expression object
     */
    static process(frame: Frame): void;
    static process(expressions: Expression[]): void;
    static get processTime(): number;
    static get timeAtProcessBegin(): number;
    static get timeAtProcessEnd(): number;
    private static createCamera;
    private static setViewportForNormalRendering;
    private static bindFramebufferWebGL;
    private static __displayRnInfo;
    /**
     * Initialize the Rhodonite system.
     *
     * @remarks
     * Don't forget `await` to use this method.
     *
     * @example
     * ```
     * await Rn.System.init({
     *   approach: Rn.ProcessApproach.DataTexture,
     *   canvas: document.getElementById('world') as HTMLCanvasElement,
     * });
     * ```
     *
     * @param desc
     * @returns
     */
    static init(desc: SystemInitDescription): Promise<void>;
    static get processApproach(): import("../definitions/ProcessApproach").ProcessApproachClass;
    static resizeCanvas(width: number, height: number): void;
    static getCanvasSize(): [number, number];
    static getCurrentWebGLContextWrapper(): import("../..").WebGLContextWrapper | undefined;
}
export {};
