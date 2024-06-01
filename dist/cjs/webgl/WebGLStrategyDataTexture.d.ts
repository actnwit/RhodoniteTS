import { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { Primitive } from '../foundation/geometry/Primitive';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { Material } from '../foundation/materials/core/Material';
import { Mesh } from '../foundation/geometry/Mesh';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { WebGLResourceHandle, Index, CGAPIResourceHandle, Count, PrimitiveUID } from '../types/CommonTypes';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
export declare class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __dataUBOUid;
    private __lastShader;
    private __lastMaterial?;
    private static __shaderProgram;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private static __globalDataRepository;
    private static __currentComponentSIDs?;
    _totalSizeOfGPUShaderDataStorageExceptMorphData: number;
    private static __isDebugOperationToDataTextureBufferDone;
    private __lastMaterialsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraComponentsUpdateCount;
    private constructor();
    static dumpDataTextureBuffer(): void;
    static getVertexShaderMethodDefinitions_dataTexture(): string;
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
    private static __getShaderProperty;
    private static getOffsetOfPropertyInShader;
    $load(meshComponent: MeshComponent): boolean;
    private __createAndUpdateDataTexture;
    deleteDataTexture(): void;
    prerender(): void;
    private __isUboUse;
    private __createAndUpdateUBO;
    attachGPUData(primitive: Primitive): void;
    attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyDataTexture;
    private __setCurrentComponentSIDsForEachRenderPass;
    private __setCurrentComponentSIDsForEachPrimitive;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
    private __renderWithoutBuffers;
    renderInner(primitiveUid: PrimitiveUID, glw: WebGLContextWrapper, renderPass: RenderPass, isVRMainPass: boolean, displayIdx: Index): boolean;
    private bindDataTexture;
}
