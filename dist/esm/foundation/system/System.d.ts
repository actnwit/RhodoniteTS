import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { Expression } from '../renderer/Expression';
import { Frame } from '../renderer/Frame';
import { Vector4 } from '../math/Vector4';
interface SystemInitDescription {
    approach: ProcessApproachEnum;
    canvas: HTMLCanvasElement;
    memoryUsageOrder?: {
        cpuGeneric: number;
        gpuInstanceData: number;
        gpuVertexData: number;
    };
    webglOption?: WebGLContextAttributes;
    rnWebGLDebug?: boolean;
    fallback3dApi?: boolean;
}
export declare class System {
    private static __instance;
    private static __expressionForProcessAuto?;
    private static __renderPassForProcessAuto?;
    private static __processApproach;
    private static __webglResourceRepository;
    private static __webglStrategy?;
    private static __renderPassTickCount;
    private static __animationFrameId;
    private static __renderLoopFunc?;
    private static __args;
    private static __stageMethods;
    private constructor();
    static startRenderLoop(renderLoopFunc: Function, ...args: unknown[]): void;
    private static __getAnimationFrameObject;
    static stopRenderLoop(): void;
    static restartRenderLoop(): void;
    static processAuto(clearColor?: Vector4): void;
    static process(frame: Frame): void;
    static process(expressions: Expression[]): void;
    private static createCamera;
    private static setViewportForNormalRendering;
    private static bindFramebuffer;
    static init(desc: SystemInitDescription): Promise<WebGL2RenderingContext>;
    static detectComponentMethods(): void;
    static get processApproach(): import("../definitions/ProcessApproach").ProcessApproachClass;
    static resizeCanvas(width: number, height: number): void;
    static getCanvasSize(): [number, number];
    static getInstance(): System;
    static getCurrentWebGLContextWrapper(): import("../..").WebGLContextWrapper | undefined;
}
export {};
