import { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { Matrix44 } from '../foundation/math/Matrix44';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Mesh } from '../foundation/geometry/Mesh';
import { CGAPIResourceHandle, WebGLResourceHandle, Index, Count, PrimitiveUID } from '../types/CommonTypes';
export declare class WebGLStrategyUniform implements WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __lastShader;
    private __lastMaterial?;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private static __globalDataRepository;
    private __latestPrimitivePositionAccessorVersions;
    private readonly componentMatrices;
    private constructor();
    private static __vertexShaderMethodDefinitions_uniform;
    setupShaderProgram(meshComponent: MeshComponent): void;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material
     * @param isPointSprite
     */
    setupShaderForMaterial(material: Material, updatedShaderSources?: ShaderSources): CGAPIResourceHandle;
    $load(meshComponent: MeshComponent): void;
    isMeshSetup(mesh: Mesh): boolean;
    $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle): void;
    common_$prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attachShaderProgram(material: Material): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveUid: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    dettachVertexData(glw: WebGLContextWrapper): void;
    static getInstance(): WebGLStrategyUniform;
    common_$render(primitiveUids: Int32Array, meshComponents: MeshComponent[], viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass, renderPassTickCount: Count): boolean;
    renderInner(primitiveUid: PrimitiveUID, glw: WebGLContextWrapper, renderPass: RenderPass, renderPassTickCount: Count, isVRMainPass: boolean, displayIdx: Index): boolean;
    $render(): void;
}
