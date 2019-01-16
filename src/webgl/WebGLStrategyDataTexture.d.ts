import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
export default class WebGLStrategyDataTexture implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __shaderProgramUid;
    private __vertexHandles;
    private static __vertexHandleOfPrimitiveObjectUids;
    private __isVAOSet;
    private constructor();
    readonly vertexShaderMethodDefinitions_dataTexture: string;
    setupShaderProgram(): void;
    private __isLoaded;
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(): void;
    attatchShaderProgram(): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyDataTexture;
    common_$render(): boolean;
}
