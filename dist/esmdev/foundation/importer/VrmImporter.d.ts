import type { GltfLoadOption, RnM2 } from '../../types';
import type { Vrm1 } from '../../types/VRM1';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import { Sampler } from '../textures/Sampler';
import { Texture } from '../textures/Texture';
/**
 * A utility class for importing and processing VRM (Virtual Reality Model) files.
 * This class handles the conversion of VRM data into Rhodonite's internal representation,
 * including materials, spring bones, expressions, constraints, and humanoid structures.
 */
export declare class VrmImporter {
    private constructor();
    /**
     * Imports a VRM model from a glTF structure and sets up all VRM-specific components.
     * This method processes materials, spring bones, expressions, constraints, and humanoid data.
     *
     * @param engine - The engine instance
     * @param gltfModel - The parsed glTF model containing VRM extensions
     * @param renderPasses - Array of render passes to add the imported model to
     * @returns Promise that resolves when the import process is complete
     */
    static __importVRM(engine: Engine, gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    /**
     * Reads and processes VRM constraint data from the model.
     * Supports roll, aim, and rotation constraints as defined in the VRMC_node_constraint extension.
     *
     * @param gltfModel - The VRM model containing constraint data
     */
    static _readConstraints(gltfModel: Vrm1): void;
    /**
     * Reads and processes VRM facial expressions (blend shapes) from the model.
     * Creates VrmExpression objects and attaches them to the root entity's VrmComponent.
     *
     * @param gltfModel - The VRM model containing expression data
     * @param rootEntity - The root entity to attach the VRM component to
     */
    static _readExpressions(gltfModel: Vrm1, rootEntity: ISceneGraphEntity): void;
    /**
     * Reads and processes VRM humanoid bone mapping information.
     * Creates a mapping between bone names and node indices for humanoid structure.
     *
     * @param gltfModel - The VRM model containing humanoid data
     * @param rootEntity - Optional root entity to tag with humanoid information
     */
    static _readVRMHumanoidInfo(gltfModel: Vrm1, rootEntity?: ISceneGraphEntity): void;
    /**
     * Reads and processes VRM spring bone physics data from the model.
     * Sets up collider groups, spring bones, and physics components for dynamic hair and cloth simulation.
     *
     * @param engine - The engine instance
     * @param gltfModel - The VRM model containing spring bone data
     */
    static _readSpringBone(engine: Engine, gltfModel: Vrm1): void;
    /**
     * Recursively adds spring bone components to all child entities in the hierarchy.
     * This ensures that all bones in a spring bone chain are properly configured.
     *
     * @param vrmSpring - The VRM spring object to add bones to
     * @param entity - The current entity to process
     * @param addedEntities - Array of entities that have already been processed
     */
    private static __addSpringBoneRecursively;
    /**
     * Adds a physics component with VRM spring bone strategy to an entity.
     * This enables physics simulation for the spring bone system.
     *
     * @param spring - The VRM spring configuration
     * @param sg - The scene graph component to add physics to
     */
    private static __addPhysicsComponent;
    /**
     * Creates texture objects from the glTF model data.
     * Also generates dummy white and black textures for default material properties.
     *
     * @param gltfModel - The glTF model containing texture data
     * @returns Promise resolving to an array of created Texture objects
     */
    static _createTextures(engine: Engine, gltfModel: RnM2): Promise<Texture[]>;
    /**
     * Creates sampler objects from the glTF model data.
     * Also generates dummy samplers for default texture sampling configuration.
     *
     * @param gltfModel - The glTF model containing sampler data
     * @returns Array of created Sampler objects
     */
    static _createSamplers(engine: Engine, gltfModel: RnM2): Sampler[];
    /**
     * Initializes MToon material properties and determines if outline rendering is needed.
     * MToon is the standard toon shader used in VRM models.
     *
     * @param gltfModel - The glTF model containing material data
     * @param texturesLength - The number of textures in the model
     * @returns True if any material requires outline rendering, false otherwise
     */
    private static __initializeMToonMaterialProperties;
    /**
     * Processes and validates import options for VRM files.
     * Converts .vrm file extensions to .glb and sets up default material helper arguments.
     *
     * @param options - Optional import configuration
     * @returns Processed and validated import options
     */
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
    /**
     * Imports only the JSON data structure of a VRM file without processing the full model.
     * This is useful for extracting metadata and structure information without full rendering setup.
     *
     * @param uri - The URI or path to the VRM file
     * @param options - Optional import configuration
     * @returns Promise resolving to the VRM JSON structure
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm1>;
}
