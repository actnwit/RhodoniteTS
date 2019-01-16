import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
export default class WebGLStrategyUBO implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __uboUid;
    private __shaderProgramUid;
    private __vertexHandles;
    private static __vertexHandleOfPrimitiveObjectUids;
    private __isVAOSet;
    private vertexShaderMethodDefinitions_UBO;
    private constructor();
    setupShaderProgram(): void;
    private __isLoaded;
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(): void;
    attatchShaderProgram(): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyUBO;
    common_$render(): boolean;
}
