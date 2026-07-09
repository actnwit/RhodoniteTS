import type { GltfLoadOption, RnM2 } from '../../types';
import type { Vrm0x } from '../../types/VRM0x';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { type Err, type Result } from '../misc/Result';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import { Sampler } from '../textures/Sampler';
import { Texture } from '../textures/Texture';
/**
 * The VRM 0.x format importer class.
 * This class provides functionality to import and process VRM 0.x files,
 * including humanoid bone mapping, spring bone physics, and expression blending.
 * It extends the GLTF2 importer with VRM-specific features.
 */
export declare class Vrm0xImporter {
    private constructor();
    /**
     * Imports a VRM file from the specified URL and converts it to Rhodonite scene graph entities.
     * This method handles the complete VRM import pipeline including textures, materials,
     * spring bone physics, humanoid mapping, and expression setup.
     *
     * @param url - The URL of the VRM file to import
     * @param options - Optional loading configuration including material helpers and render states
     * @returns A promise that resolves to an array of scene graph entities (main + optional outline)
     */
    static importFromUrl(engine: Engine, url: string, options?: GltfLoadOption): Promise<Result<ISceneGraphEntity[], Err<RnM2, undefined>>>;
    /**
     * Imports only the JSON data from a VRM file without creating scene graph entities.
     * This is useful for extracting VRM metadata, humanoid bone mappings, and other
     * configuration data without the overhead of full scene construction.
     *
     * @param uri - The URI of the VRM file to import
     * @param options - Optional loading configuration
     * @returns A promise that resolves to the VRM JSON data structure
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm0x>;
    /**
     * Internal method for importing VRM 0.x data into existing render passes.
     * This method handles the complete VRM processing pipeline including material setup,
     * outline rendering, spring bone physics, and humanoid configuration.
     *
     * @param engine - The engine instance
     * @param gltfModel - The loaded GLTF model data with VRM extensions
     * @param renderPasses - Array of render passes to add the VRM entities to
     */
    static __importVRM0x(engine: Engine, gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    /**
     * Processes VRM blend shape groups and converts them to Rhodonite VRM expressions.
     * This method extracts facial expressions, eye blinks, and other morph target animations
     * from the VRM blend shape master and creates the corresponding VRM component.
     *
     * @param gltfModel - The VRM model data containing blend shape information
     * @param rootEntity - The root entity to attach the VRM component to
     */
    static _readBlendShapeGroup(gltfModel: Vrm0x, rootEntity: ISceneGraphEntity): void;
    /**
     * Extracts and processes VRM humanoid bone mapping information.
     * This method creates a mapping between VRM standard bone names and the actual
     * scene graph nodes, which is essential for animation retargeting and IK.
     *
     * @param gltfModel - The VRM model data containing humanoid bone definitions
     * @param rootEntity - Optional root entity to attach the bone mapping metadata to
     */
    static _readVRMHumanoidInfo(gltfModel: Vrm0x, rootEntity?: ISceneGraphEntity): void;
    /**
     * Processes VRM spring bone physics configuration and creates the physics simulation setup.
     * This method handles collider groups, spring bone chains, and physics parameters
     * to enable realistic secondary motion for hair, clothing, and accessories.
     *
     * @param engine - The engine instance
     * @param gltfModel - The VRM model data containing spring bone and collider definitions
     */
    static _readSpringBone(engine: Engine, gltfModel: Vrm0x): void;
    /**
     * Recursively adds spring bone physics to a bone chain and its children.
     * This method traverses the bone hierarchy and applies spring physics parameters
     * to create natural secondary motion effects.
     *
     * @param vrmSpring - The VRM spring bone group to add bones to
     * @param entity - The current entity in the bone hierarchy
     * @param boneGroup - The VRM bone group configuration data
     * @param addedEntities - Array to track already processed entities to avoid duplicates
     */
    private static __addSpringBoneRecursively;
    /**
     * Adds a physics component with VRM spring bone strategy to an entity.
     * This method sets up the physics simulation for spring bone motion,
     * attaching the appropriate strategy and configuration.
     *
     * @param boneGroup - The VRM spring bone group containing physics parameters
     * @param sg - The scene graph component to attach physics to
     */
    private static __addPhysicsComponent;
    /**
     * Creates Rhodonite texture objects from GLTF texture data.
     * This method processes all textures in the GLTF model and creates additional
     * dummy textures (white and black) commonly used in VRM materials.
     *
     * @param gltfModel - The GLTF model containing texture definitions
     * @returns A promise that resolves to an array of created textures
     */
    static _createTextures(engine: Engine, gltfModel: RnM2): Promise<Texture[]>;
    /**
     * Creates Rhodonite sampler objects from GLTF sampler data.
     * This method processes texture sampling configuration and creates additional
     * dummy samplers for textures that don't specify sampling parameters.
     *
     * @param gltfModel - The GLTF model containing sampler definitions
     * @returns An array of created sampler objects
     */
    static _createSamplers(engine: Engine, gltfModel: RnM2): Sampler[];
    /**
     * Checks if any materials in the VRM have outline rendering enabled.
     * This method examines material properties to determine if a separate
     * outline render pass is needed for toon-style rendering effects.
     *
     * @param extensionsVRM - The VRM extension data containing material properties
     * @returns True if outline materials are present, false otherwise
     */
    static _existOutlineMaterial(extensionsVRM: any): boolean;
    /**
     * Initializes VRM material properties with default values for missing parameters.
     * This method ensures all VRM materials have complete property sets,
     * particularly for MToon shader materials commonly used in VRM models.
     *
     * @param gltfModel - The GLTF model to process materials for
     * @param texturesLength - The total number of textures for dummy texture indexing
     */
    static _initializeMaterialProperties(gltfModel: RnM2, texturesLength: number): void;
    /**
     * Initializes MToon material properties with comprehensive default values.
     * MToon is the standard toon shader for VRM, and this method ensures all
     * required properties are set with appropriate defaults for proper rendering.
     *
     * @param gltfModel - The GLTF model containing MToon materials
     * @param texturesLength - The total number of textures for dummy texture assignment
     */
    private static __initializeMToonMaterialProperties;
    /**
     * Sets a default value for an object property if it's currently undefined.
     * This utility method is used throughout material initialization to ensure
     * all required properties have valid values.
     *
     * @param object - The object to check and potentially modify
     * @param propertyName - The name of the property to check
     * @param initialValue - The default value to set if the property is undefined
     */
    private static __initializeForUndefinedProperty;
    /**
     * Processes and validates GLTF load options for VRM import.
     * This method handles file extension conversion (.vrm to .glb), sets up
     * default material helpers, and configures VRM-specific import flags.
     *
     * @param options - The input load options to process
     * @returns Processed and validated load options with VRM-specific defaults
     */
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
}
