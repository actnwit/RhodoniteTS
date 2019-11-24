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
    private __lastEntitiesNumber;
    private __renderPassTickCount;
    private constructor();
    process(expressions: Expression[]): void;
    setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement, memoryUsageOrder?: number, webglOption?: any, rnWebGLDebug?: boolean): WebGLRenderingContext;
    get processApproach(): ProcessApproachEnum;
    static getInstance(): System;
}
