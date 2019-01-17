/// <reference types="webgl2" />
/// <reference types="webgl-ext" />
import { ProcessApproachEnum } from "../definitions/ProcessApproach";
export default class System {
    private static __instance;
    private __processStages;
    private __componentRepository;
    private __renderingPipeline?;
    private __processApproach;
    private __webglStrategy?;
    private constructor();
    process(): void;
    setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement): WebGL2RenderingContext | (WebGLRenderingContext & WebGL1Extensions) | null;
    readonly processApproach: ProcessApproachEnum;
    static getInstance(): System;
}
