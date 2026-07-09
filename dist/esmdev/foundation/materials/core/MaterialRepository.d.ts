import type { Count, IndexOf16Bytes, MaterialSID } from '../../../types/CommonTypes';
import type { ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import type { Engine } from '../../system/Engine';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import type { MaterialTypeName, ShaderVariable } from './MaterialTypes';
/**
 * Repository class for managing material types and instances.
 * Handles registration, creation, and lifecycle management of materials.
 */
export declare class MaterialRepository {
    private __materialMap;
    private __instances;
    private __materialTids;
    private __materialInstanceCountOfType;
    private __materialNodes;
    private __materialCountPerBufferViewMap;
    private __bufferViews;
    private __accessors;
    /** Tracks version incremented when a new buffer view is allocated for a material type. */
    private __bufferViewVersions;
    /** Solo datum fields for each material type (engine-specific, not shared across engines) */
    _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsName, ShaderVariable>>;
    /** State version counter for tracking material changes (engine-specific) */
    private __stateVersion;
    private static __materialTidCount;
    private static __materialUidCount;
    /**
     * Registers a new material type with the repository.
     * This method creates the necessary data structures and allocates memory for the material type.
     * If the material type is already registered, the registration will be skipped.
     *
     * @param materialTypeName - The unique name identifier for the material type
     * @param materialNode - The material content definition containing shader semantics and properties
     * @param materialCountPerBufferView - The number of materials per buffer view
     * @returns True if the material type was successfully registered, false if it was already registered
     */
    registerMaterial(engine: Engine, materialTypeName: string, materialNode: AbstractMaterialContent, materialCountPerBufferView?: number): boolean;
    /**
     * Forcibly registers a material type, overwriting any existing registration.
     * This method bypasses the duplicate check and always performs the registration.
     * Use with caution as it can replace existing material type definitions.
     *
     * @param materialTypeName - The unique name identifier for the material type
     * @param materialNode - The material content definition containing shader semantics and properties
     * @param materialCountPerBufferView - The number of materials per buffer view
     * @returns Always returns true as the registration is forced
     */
    forceRegisterMaterial(engine: Engine, materialTypeName: string, materialNode: AbstractMaterialContent, materialCountPerBufferView?: number): boolean;
    /**
     * Checks if a material type is already registered in the repository.
     *
     * @param materialTypeName - The name of the material type to check
     * @returns True if the material type is registered, false otherwise
     */
    isRegisteredMaterialType(materialTypeName: string): boolean;
    /**
     * Retrieves a material instance by its unique identifier.
     * Returns undefined if the material doesn't exist or has been garbage collected.
     *
     * @param materialUid - The unique identifier of the material to retrieve
     * @returns The material instance if found and still alive, undefined otherwise
     */
    getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined;
    /**
     * Gets all currently active material instances from the repository.
     * Returns an array of WeakRef objects that may contain undefined values
     * if materials have been garbage collected.
     *
     * @returns Array of WeakRef objects pointing to all registered materials
     */
    getAllMaterials(): WeakRef<Material>[];
    /**
     * Creates a new material instance of the specified type.
     * The material type must be registered before calling this method.
     * This method handles instance counting and initialization.
     *
     * @param materialTypeName - The name of the registered material type
     * @param materialNode - The material content definition for this specific instance
     * @returns A new Material instance with proper initialization
     * @throws Error if the material type is not registered or maximum instances exceeded
     */
    createMaterial(engine: Engine, materialTypeName: string, materialNode: AbstractMaterialContent): Material;
    /**
     * Determines if a new material node is compatible with an existing material.
     * Compatibility is checked by comparing shader semantics information arrays.
     * Materials are compatible if they have identical shader semantic structures.
     *
     * @param currentMaterial - The existing material to compare against
     * @param newMaterialNode - The new material node to check for compatibility
     * @returns True if the materials are compatible, false otherwise
     */
    isMaterialCompatible(currentMaterial: Material, newMaterialNode: AbstractMaterialContent): boolean;
    /**
     * Initializes a newly created material instance with proper data structures and memory allocation.
     * This method sets up the material's shader variables, semantic information, and registers
     * the material in the repository's tracking maps.
     *
     * @param material - The material instance to initialize
     * @param countOfThisType - The current count of instances for this material type
     * @private
     */
    private __initializeMaterial;
    /**
     * Gets the memory location offset for a specific property of a material type.
     * The offset is calculated in 16-byte aligned units for GPU buffer access.
     * This is used for efficient GPU memory access in shaders.
     *
     * @param engine - The engine instance
     * @param materialTypeName - The name of the material type
     * @param propertyName - The shader semantic name of the property
     * @returns The byte offset divided by 16 (IndexOf16Bytes) for the property location
     */
    getLocationOffsetOfMemberOfMaterial(engine: Engine, materialTypeName: string, propertyName: ShaderSemanticsName): IndexOf16Bytes[];
    /**
     * Internal method that performs the actual material type registration.
     * This method sets up the material type ID, allocates buffer views,
     * and initializes all necessary data structures.
     *
     * @param materialTypeName - The unique name identifier for the material type
     * @param materialNode - The material content definition
     * @param materialCountPerBufferView - The number of materials per buffer view
     * @private
     */
    private __registerInner;
    /**
     * Allocates GPU buffer memory for a material type based on its shader semantics.
     * This method calculates the total memory requirements, creates buffer views,
     * and sets up accessors for efficient GPU data access.
     *
     * @param materialTypeName - The name of the material type to allocate memory for
     * @param materialNode - The material node containing semantic information
     * @returns Whether a new BufferView was allocated (true) or an existing one was reused (false)
     * @private
     */
    private __allocateBufferView;
    _getMaterialCountPerBufferView(materialTypeName: string): Count | undefined;
    _getBufferViewVersion(materialTypeName: string): number;
    /**
     * Invalidates all shader programs for all registered materials.
     * This method is typically called when global shader settings change
     * and all materials need to recompile their shaders.
     *
     * @internal
     */
    _makeShaderInvalidateToAllMaterials(): void;
    /**
     * Invalidates shader programs only for materials that are affected by morph changes.
     * Affected materials are those that support morphing and are currently used by primitives
     * with morph targets.
     *
     * @internal
     */
    _makeShaderInvalidateToMorphMaterials(): void;
    private __makeShaderInvalidateForMaterialType;
    /**
     * Gets the current state version for materials in this repository.
     * This version is incremented whenever any material's state changes.
     * @returns The current state version number
     */
    get stateVersion(): number;
    /**
     * Increments the state version counter.
     * Called when a material's state changes.
     * @internal
     */
    _incrementStateVersion(): void;
}
