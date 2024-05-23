import { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Mesh } from '../foundation/geometry/Mesh';
import { CGAPIResourceHandle, WebGLResourceHandle, Index, Count, PrimitiveUID } from '../types/CommonTypes';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
export declare class WebGLStrategyUniform implements CGAPIStrategy, WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __lastShader;
    private __lastMaterial?;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private static __globalDataRepository;
    private static readonly componentMatrices;
    private constructor();
    private static __vertexShaderMethodDefinitions_uniform;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    /**
     * re-setup shader program for the material in this WebGL strategy
     * @param material - a material to re-setup shader program
     * @param updatedShaderSources - updated shader sources
     * @param onError - callback function to handle error
     * @returns
     */
    _reSetupShaderForMaterialBySpector(material: Material, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
    $load(meshComponent: MeshComponent): boolean;
    prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attachShaderProgram(material: Material): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveUid: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    dettachVertexData(glw: WebGLContextWrapper): void;
    static getInstance(): WebGLStrategyUniform;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
    renderInner(primitiveUid: PrimitiveUID, glw: WebGLContextWrapper, renderPass: RenderPass, renderPassTickCount: Count, isVRMainPass: boolean, displayIdx: Index): boolean;
    private bindDataTexture;
}
