import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import Matrix44 from "../foundation/math/Matrix44";
import Material from "../foundation/materials/Material";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import RenderPass from "../foundation/renderer/RenderPass";
import { WebGLResourceHandle } from "../types/CommonTypes";
export default class WebGLStrategyUBO implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __uboUid;
    private __vertexHandles;
    private static __vertexHandleOfPrimitiveObjectUids;
    private __isVAOSet;
    private vertexShaderMethodDefinitions_UBO;
    private constructor();
    setupShaderProgram(meshComponent: MeshComponent): void;
    private __isLoaded;
    $load(meshComponent: MeshComponent): void;
    $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attatchShaderProgram(material: Material): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyUBO;
    common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass): boolean;
}
