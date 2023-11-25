import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { Count, PrimitiveUID } from '../types/CommonTypes';
import { getShaderPropertyFunc } from '../foundation/definitions/ShaderSemantics';
export declare class WebGpuStrategyBasic implements CGAPIStrategy {
    private __latestPrimitivePositionAccessorVersions;
    private static __instance;
    private static __currentComponentSIDs?;
    private static __globalDataRepository;
    private __storageBufferUid;
    private __storageBlendShapeBufferUid;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private constructor();
    static getInstance(): WebGpuStrategyBasic;
    static getVertexShaderMethodDefinitions_storageBuffer(): string;
    private static __getShaderProperty;
    private static getOffsetOfPropertyInShader;
    $load(meshComponent: MeshComponent): void;
    private __setupShaderProgramForMeshComponent;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive, vertexShaderMethodDefinitions: string, propertySetter: getShaderPropertyFunc): void;
    private __isMeshSetup;
    $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: number): void;
    common_$prerender(): void;
    common_$render(primitiveUids: Int32Array, renderPass: RenderPass, renderPassTickCount: number): boolean;
    renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, renderPassTickCount: Count): boolean;
    private __createAndUpdateStorageBuffer;
    private __createStorageBlendShapeBuffer;
    private __updateUniformMorph;
    private __setCurrentComponentSIDsForEachRenderPass;
}
