/// <reference types="webgl2" />
/// <reference types="webgl-ext" />
import { ProcessApproachEnum } from "../definitions/ProcessApproach";
import Expression from "../renderer/Expression";
export default class System {
    private static __instance;
    private __processStages;
    private __componentRepository;
    private __entityRepository;
    private __processApproach;
    private __webglResourceRepository;
    private __webglStrategy?;
    private __localExpression;
    private __localRenderPass;
    private __lastEntitiesNumber;
    private constructor();
    process(expression?: Expression): void;
    setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement, memoryUsageOrder?: number): WebGL2RenderingContext | (WebGLRenderingContext & WebGL1Extensions) | null;
    readonly processApproach: ProcessApproachEnum;
    static getInstance(): System;
}
