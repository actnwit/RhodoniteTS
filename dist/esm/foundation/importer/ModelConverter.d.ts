import type { RnM2, RnM2Accessor, RnM2Image, RnM2SparseIndices, RnM2TextureInfo, RnM2TextureSampler } from '../../types/RnM2';
import type { ShaderSemanticsName } from '../definitions/ShaderSemantics';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import type { Accessor } from '../memory/Accessor';
import { Buffer } from '../memory/Buffer';
import type { Engine } from '../system/Engine';
import { Sampler } from '../textures/Sampler';
import { Texture } from '../textures/Texture';
/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
export declare class ModelConverter {
    private constructor();
    /**
     * Generates a group entity for the glTF model
     * @param gltfModel - The glTF model data
     * @returns A scene graph entity configured as a group
     */
    private static __generateGroupEntity;
    /**
     * Adds source type and version tags to an entity based on the glTF model
     * @param entity - The entity to add tags to
     * @param gltfModel - The glTF model containing asset information
     */
    private static addTags;
    /**
     * Generates a mesh entity for the glTF model
     * @param engine - The engine instance
     * @param gltfModel - The glTF model data
     * @returns A mesh entity with appropriate tags
     */
    private static __generateMeshEntity;
    /**
     * Generates a camera entity for the glTF model
     * @param engine - The engine instance
     * @param gltfModel - The glTF model data
     * @returns A camera entity with appropriate tags
     */
    private static __generateCameraEntity;
    /**
     * Generates a light entity for the glTF model
     * @param engine - The engine instance
     * @param gltfModel - The glTF model data
     * @returns A light entity with appropriate tags
     */
    private static __generateLightEntity;
    /**
     * Sets up materials from the glTF model
     * @param gltfModel - The glTF model data
     * @param rnTextures - Array of Rhodonite textures
     * @param rnSamplers - Array of Rhodonite samplers
     * @returns Array of configured Rhodonite materials
     */
    private static __setupMaterials;
    /**
     * Sets up textures from the glTF model asynchronously
     * @param gltfModel - The glTF model data
     * @returns Promise resolving to array of Rhodonite textures
     */
    private static __setupTextures;
    /**
     * Creates samplers from the glTF model
     * @param engine - The engine instance
     * @param gltfModel - The glTF model data
     * @returns Array of Rhodonite samplers
     */
    private static __createSamplers;
    /**
     * Converts a glTF model to Rhodonite objects synchronously (without texture loading)
     * @param gltfModel - The glTF model data to convert
     * @returns The root group entity containing the converted scene
     */
    static convertToRhodoniteObjectSimple(engine: Engine, gltfModel: RnM2): ISceneGraphEntity;
    /**
     * Converts a glTF model to Rhodonite objects asynchronously (with full texture loading)
     * @param gltfModel - The glTF model data to convert
     * @returns Promise resolving to the root group entity containing the converted scene
     */
    static convertToRhodoniteObject(engine: Engine, gltfModel: RnM2): Promise<ISceneGraphEntity>;
    /**
     * Creates Rhodonite buffers from glTF buffer data
     * @param gltfModel - The glTF model containing buffer data
     * @returns Array of Rhodonite Buffer objects
     */
    private static __createRnBuffer;
    /**
     * Sets up transform properties for entities from glTF node data
     * @param gltfModel - The glTF model data
     * @param groups - Array of scene graph entities to apply transforms to
     */
    static _setupTransform(gltfModel: RnM2, groups: ISceneGraphEntity[]): void;
    /**
     * Sets up the hierarchy relationships between entities based on glTF node structure
     * @param gltfModel - The glTF model data
     * @param rnEntities - Array of Rhodonite entities to organize in hierarchy
     */
    static _setupHierarchy(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void;
    /**
     * Sets up animation data from glTF animations
     * @param gltfModel - The glTF model data
     * @param rnEntities - Array of Rhodonite entities
     * @param rnBuffers - Array of Rhodonite buffers
     * @param rootGroup - The root group entity
     * @param rnMaterials - Array of Rhodonite materials
     * @internal
     */
    static _setupAnimation(engine: Engine, gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[], rootGroup: ISceneGraphEntity, rnMaterials: Material[]): void;
    /**
     * Sets up pointer-based animation for materials, nodes, lights, and cameras
     * @param rnEntities - Array of Rhodonite entities
     * @param channel - Animation channel data
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     * @param rnMaterials - Array of Rhodonite materials
     * @param gltfModel - The glTF model data
     */
    private static __setPointerAnimation;
    /**
     * Sets up pointer animation for camera properties
     * @param match - Regex match result containing camera index
     * @param rnEntities - Array of Rhodonite entities
     * @param pointer - Animation pointer string
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     * @param gltfModel - The glTF model data
     */
    private static __setPointerAnimationCameras;
    /**
     * Sets up pointer animation for light properties
     * @param match - Regex match result containing light index
     * @param rnEntities - Array of Rhodonite entities
     * @param pointer - Animation pointer string
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     * @param gltfModel - The glTF model data
     */
    private static __setPointerAnimationLights;
    /**
     * Sets up pointer animation for node properties (transform, weights)
     * @param match - Regex match result containing node index
     * @param rnEntities - Array of Rhodonite entities
     * @param pointer - Animation pointer string
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     */
    private static __setPointerAnimationNodes;
    /**
     * Sets up pointer animation for material properties
     * @param match - Regex match result containing material index
     * @param rnMaterials - Array of Rhodonite materials
     * @param pointer - Animation pointer string
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     */
    private static __setPointerAnimationMaterials;
    /**
     * Sets up standard animation (non-pointer based) for transform properties
     * @param rnEntities - Array of Rhodonite entities
     * @param channel - Animation channel data
     * @param samplerObject - Animation sampler object
     * @param animation - Animation data
     * @param animInputArray - Input time values
     * @param animOutputArray - Output animation values
     * @param interpolation - Interpolation method
     * @param animationAttributeType - Type of animation attribute
     */
    private static __setNormalAnimation;
    /**
     * Sets up skeletal animation and joint hierarchies from glTF skin data
     * @param gltfModel - The glTF model data
     * @param rnEntities - Array of Rhodonite entities
     * @param rnBuffers - Array of Rhodonite buffers
     */
    static _setupSkeleton(engine: Engine, gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[]): void;
    /**
     * Sets up all objects (meshes, cameras, lights, groups) from glTF nodes
     * @param gltfModel - The glTF model data
     * @param rnBuffers - Array of Rhodonite buffers
     * @param rnMaterials - Array of Rhodonite materials
     * @param rnTextures - Array of Rhodonite textures
     * @param rnSamplers - Array of Rhodonite samplers
     * @returns Object containing arrays of entities and entities by name
     */
    private static __setupObjects;
    /**
     * Checks if a node has morphing (blend shape) capabilities
     * @param node - The glTF node to check
     * @param gltfModel - The glTF model data
     * @returns True if the node supports morphing
     */
    private static __isMorphing;
    /**
     * Sets up a light entity from glTF light data
     * @param light - The glTF light data
     * @param gltfModel - The glTF model data
     * @returns Configured light entity
     */
    private static __setupLight;
    /**
     * Sets up a camera entity from glTF camera data
     * @param camera - The glTF camera data
     * @param gltfModel - The glTF model data
     * @returns Configured camera entity
     */
    private static __setupCamera;
    /**
     * Sets up a mesh entity from glTF mesh data
     * @param engine - The engine instance
     * @param mesh - The glTF mesh data
     * @param meshIndex - Index of the mesh in the glTF model
     * @param rnBuffers - Array of Rhodonite buffers
     * @param gltfModel - The glTF model data
     * @param rnMaterials - Array of Rhodonite materials
     * @param rnTextures - Array of Rhodonite textures
     * @param rnSamplers - Array of Rhodonite samplers
     * @returns Configured mesh entity
     */
    private static __setupMesh;
    /**
     * Sets sparse accessor data by applying sparse indices and values to the base accessor
     * @param accessor - The glTF accessor with sparse data
     * @param rnAccessor - The Rhodonite accessor to modify
     */
    static setSparseAccessor(accessor: RnM2Accessor, rnAccessor: Accessor): void;
    /**
     * Sets up VRM 1.0 material properties
     * @param gltfModel - The glTF model data
     * @param materialJson - The material JSON data
     * @param rnLoaderOptions - Loader options
     * @returns Configured material or undefined if not VRM 1.0
     */
    private static __setVRM1Material;
    /**
     * Sets MToon texture parameters for VRM materials
     * @param textures - Array of textures
     * @param materialProperties - VRM material properties
     * @param material - The material to configure
     * @param samplers - Array of samplers
     */
    private static setMToonTextures;
    /**
     * Sets up VRM 0.x material properties
     * @param gltfModel - The glTF model data
     * @param materialJson - The material JSON data
     * @param rnLoaderOptions - Loader options
     * @returns Configured material or undefined if not VRM 0.x
     */
    private static __setVRM0xMaterial;
    /**
     * Generates an appropriate material based on glTF material data and loader options
     * @param engine - The engine instance
     * @param gltfModel - The glTF model data
     * @param rnTextures - Array of loaded Rhodonite textures
     * @param rnSamplers - Array of loaded Rhodonite samplers
     * @param materialJson - The material JSON data (optional)
     * @returns Generated material
     */
    private static __generateAppropriateMaterial;
    /**
     * Determines if lighting should be enabled for a material
     * @param gltfModel - The glTF model data
     * @param materialJson - The material JSON data (optional)
     * @returns True if lighting should be enabled
     */
    private static __isLighting;
    /**
     * Determines if tangent attributes should be used for a primitive
     * @param gltfModel - The glTF model data
     * @param primitive - The glTF primitive data
     * @returns True if tangent attributes should be used
     */
    private static __useTangentAttribute;
    private static __useNormalTexture;
    private static __makeOutputSrgb;
    private static __setupMaterial;
    private static setParametersToMaterial;
    static _createSampler(engine: Engine, sampler: RnM2TextureSampler): Sampler;
    static _createTexture(engine: Engine, image: RnM2Image, gltfModel: RnM2, { autoDetectTransparency }?: {
        autoDetectTransparency?: boolean | undefined;
    }): Promise<Texture>;
    private static __needResizeToPowerOfTwoOnWebGl1;
    private static __sizeIsPowerOfTwo;
    private static __needParameterInitialization;
    private static _checkRnGltfLoaderOptionsExist;
    private static __rewrapWithTypedArray;
    static _checkBytesPerComponent(accessor: RnM2Accessor | RnM2SparseIndices): number;
    static _checkComponentNumber(accessor: RnM2Accessor): number;
    static _checkDataViewMethod(accessor: RnM2Accessor | RnM2SparseIndices): string;
    static _isSystemLittleEndian(): boolean;
    static _readBinaryFromAccessorAndSetItToAccessorExtras(engine: Engine, accessor: RnM2Accessor, rnBuffers?: Buffer[]): Float32Array;
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
    private static __copyRnAccessorAndBufferViewForMorphData;
    private static __takeRnBufferViewAndRnAccessorForDraco;
    private static __getRnBufferView;
    private static __getGeometryFromDracoBuffer;
    static __getIndicesFromDraco(draco: any, decoder: any, dracoGeometry: any, triangleStripDrawMode: boolean): Uint32Array<ArrayBufferLike> | undefined;
    private static __decodeDraco;
    static _setupTextureTransform(textureJson: RnM2TextureInfo, rnMaterial: Material, textureTransformScaleShaderSemantic: ShaderSemanticsName, textureTransformOffsetShaderSemantic: ShaderSemanticsName, textureTransformRotationShaderSemantic: ShaderSemanticsName): void;
    private static __createBufferForDecompressedData;
}
