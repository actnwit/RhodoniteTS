import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { Primitive } from '../foundation/geometry/Primitive';
import { Material } from '../foundation/materials/core/Material';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { PrimitiveUID } from '../types/CommonTypes';
import { getShaderPropertyFunc } from '../foundation/definitions/ShaderSemantics';
export declare class WebGpuStrategyBasic implements CGAPIStrategy {
    private static __instance;
    private __storageBufferUid;
    private __storageBlendShapeBufferUid;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private __lastMaterialsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private __lastBlendShapeComponentsUpdateCountForWeights;
    private __lastBlendShapeComponentsUpdateCountForBlendData;
    private constructor();
    static getInstance(): WebGpuStrategyBasic;
    static getVertexShaderMethodDefinitions_storageBuffer(): string;
    private static __getShaderProperty;
    private static getOffsetOfPropertyInShader;
    $load(meshComponent: MeshComponent): boolean;
    common_$load(): void;
    private __setupShaderProgramForMeshComponent;
    private _setupShaderProgram;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive, vertexShaderMethodDefinitions: string, propertySetter: getShaderPropertyFunc): void;
    renderWithRenderBundle(renderPass: RenderPass): boolean;
    prerender(): void;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: number): boolean;
    private __renderWithoutBuffers;
    renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, isOpaque: boolean): boolean;
    private __createAndUpdateStorageBuffer;
    private __createAndUpdateStorageBufferForCameraOnly;
    private __createOrUpdateStorageBlendShapeBuffer;
    private __updateUniformMorph;
    private __getAppropriateCameraComponentSID;
}
