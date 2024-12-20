import { Buffer } from '../memory/Buffer';
import { Texture } from '../textures/Texture';
import { ShaderSemanticsName } from '../definitions/ShaderSemantics';
import { Material } from '../materials/core/Material';
import { Accessor } from '../memory/Accessor';
import { RnM2, RnM2Accessor, RnM2Texture, RnM2TextureInfo, RnM2SparseIndices } from '../../types/RnM2';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Sampler } from '../textures/Sampler';
/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export declare class ModelConverter {
    private constructor();
    private static __generateGroupEntity;
    private static addTags;
    private static __generateMeshEntity;
    private static __generateCameraEntity;
    private static __generateLightEntity;
    private static __setupMaterials;
    static convertToRhodoniteObject(gltfModel: RnM2): ISceneGraphEntity;
    private static createRnBuffer;
    static _setupTransform(gltfModel: RnM2, groups: ISceneGraphEntity[]): void;
    static _setupHierarchy(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void;
    /**
     * @internal
     */
    static _setupAnimation(gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[], rootGroup: ISceneGraphEntity): void;
    static _setupSkeleton(gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[]): void;
    private static __setupObjects;
    private static __isMorphing;
    private static __setupLight;
    private static __setupCamera;
    private static __setupMesh;
    static setSparseAccessor(accessor: RnM2Accessor, rnAccessor: Accessor): void;
    private static __setVRM1Material;
    private static setMToonTextures;
    private static __setVRM0xMaterial;
    private static __generateAppropriateMaterial;
    private static __isLighting;
    private static __useTangentAttribute;
    private static __useNormalTexture;
    private static __makeOutputSrgb;
    private static __setupMaterial;
    static _createSampler(texture: RnM2Texture): Sampler;
    static _createTexture(texture: RnM2Texture, gltfModel: RnM2, { autoDetectTransparency }?: {
        autoDetectTransparency?: boolean | undefined;
    }): Texture;
    private static __needResizeToPowerOfTwoOnWebGl1;
    private static __sizeIsPowerOfTwo;
    private static __needParameterInitialization;
    private static _checkRnGltfLoaderOptionsExist;
    private static __rewrapWithTypedArray;
    static _checkBytesPerComponent(accessor: RnM2Accessor | RnM2SparseIndices): number;
    static _checkComponentNumber(accessor: RnM2Accessor): number;
    static _checkDataViewMethod(accessor: RnM2Accessor | RnM2SparseIndices): string;
    static _isSystemLittleEndian(): boolean;
    static _readBinaryFromAccessorAndSetItToAccessorExtras(accessor: RnM2Accessor, rnBuffers?: Buffer[]): Float32Array;
    /**
     * normalize values of TypedArray to Float32Array
     * See: the last part of 3.11.Animation at https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
     * @param dataViewMethod
     * @param numberArray
     * @returns
     */
    private static __normalizeTypedArrayToFloat32Array;
    private static __addOffsetToIndices;
    /**
     * Take a Rn.Accessor from the Rn.Buffer
     *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
     * @param accessor
     * @param rnBuffer
     * @returns
     */
    private static __getRnAccessor;
    /**
     * Take a Rn.BufferView and a Rn.Accessor from the Rn.Buffer
     *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
     * @param accessor
     * @param rnBuffer
     * @returns
     */
    private static __getRnBufferViewAndRnAccessor;
    private static __copyRnAccessorAndBufferView;
    private static __takeRnBufferViewAndRnAccessorForDraco;
    private static __getRnBufferView;
    private static __getGeometryFromDracoBuffer;
    static __getIndicesFromDraco(draco: any, decoder: any, dracoGeometry: any, triangleStripDrawMode: boolean): Uint32Array | undefined;
    private static __decodeDraco;
    static _setupTextureTransform(textureJson: RnM2TextureInfo, rnMaterial: Material, textureTransformShaderSemantic: ShaderSemanticsName, textureRotationShaderSemantic: ShaderSemanticsName): void;
    private static __createBufferForDecompressedData;
}
