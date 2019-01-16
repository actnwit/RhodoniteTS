import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import RowMajarMatrix44 from "../foundation/math/RowMajarMatrix44";
export default class WebGLStrategyUniform implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __uboUid;
    private __shaderProgramUid;
    private __shaderProgram?;
    private __vertexHandles;
    private static __vertexHandleOfPrimitiveObjectUids;
    private __isVAOSet;
    private __uniformLocation_worldMatrix?;
    private vertexShaderMethodDefinitions_uniform;
    private constructor();
    setupShaderProgram(): void;
    private __isLoaded;
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(): void;
    attatchShaderProgram(): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyUniform;
    common_$render(): boolean;
    $render(primitive_i: number, primitive: Primitive, worldMatrix: RowMajarMatrix44): void;
}
