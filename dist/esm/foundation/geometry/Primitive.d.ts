import type { Count, Index, Offset, PrimitiveUID, TypedArray } from '../../types/CommonTypes';
import type { VertexHandles } from '../../webgl/WebGLResourceRepository';
import { RnObject } from '../core/RnObject';
import { type ComponentTypeEnum } from '../definitions/ComponentType';
import { type CompositionTypeEnum } from '../definitions/CompositionType';
import { type PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { type VertexAttributeSemanticsJoinedString } from '../definitions/VertexAttribute';
import type { Material } from '../materials/core/Material';
import { AABB } from '../math/AABB';
import type { IVector3 } from '../math/IVector';
import type { Accessor } from '../memory/Accessor';
import type { Engine } from '../system/Engine';
import type { Mesh } from './Mesh';
import { type IMesh, type PrimitiveSortKey, type PrimitiveSortKeyLength, type PrimitiveSortKeyOffset, type RaycastResultEx1 } from './types/GeometryTypes';
export type Attributes = Map<VertexAttributeSemanticsJoinedString, Accessor>;
export interface IAnyPrimitiveDescriptor {
    /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
    material?: Material;
}
export interface PrimitiveDescriptor extends IAnyPrimitiveDescriptor {
    attributes: TypedArray[];
    attributeSemantics: VertexAttributeSemanticsJoinedString[];
    primitiveMode: PrimitiveModeEnum;
    indices?: TypedArray;
}
/**
 * Represents a geometric primitive with vertex attributes, materials, and rendering data.
 * A primitive is the basic building block for rendering 3D geometry.
 */
export declare class Primitive extends RnObject {
    private __engine;
    private __mode;
    private static __defaultMaterial?;
    private __material;
    private __materialVariants;
    private __currentVariantName;
    _prevMaterial: WeakRef<Material>;
    private __attributes;
    private __oIndices;
    private static __primitiveCount;
    private __primitiveUid;
    private __aabb;
    private __targets;
    private __vertexHandles?;
    private __mesh?;
    private static __primitives;
    _sortkey: PrimitiveSortKey;
    _viewDepth: number;
    private static __primitiveUidIdxHasMorph;
    private static __idxPrimitiveUidHasMorph;
    private static __primitiveCountHasMorph;
    private static __tmpVec3_0;
    private __latestPositionAccessorVersion;
    private __positionAccessorVersion;
    private static __variantUpdateCount;
    private __fingerPrint;
    /**
     * Creates a new Primitive instance.
     * Initializes the primitive with a default material if none exists.
     */
    constructor(engine: Engine);
    /**
     * Calculates a unique fingerprint string for the primitive based on its properties.
     * The fingerprint includes mode, indices, targets, and attributes configuration.
     * This is used for efficient primitive comparison and caching.
     */
    calcFingerPrint(): void;
    /**
     * Gets the cached fingerprint string of the primitive.
     * @returns The fingerprint string used for primitive identification
     */
    _getFingerPrint(): string;
    /**
     * Gets the index of a primitive with morph targets by its UID.
     * @param primitiveUid - The unique identifier of the primitive
     * @returns The index if the primitive has morph targets, otherwise undefined
     */
    static getPrimitiveIdxHasMorph(primitiveUid: PrimitiveUID): Index | undefined;
    /**
     * Gets a primitive with morph targets by its index.
     * @param primitiveIdx - The index of the primitive in the morph targets collection
     * @returns The primitive if found and still exists, otherwise undefined
     */
    static getPrimitiveHasMorph(primitiveIdx: Index): Primitive | undefined;
    /**
     * Determines the bit size required for indices based on the index accessor type.
     * @returns 'uint16' for unsigned short/byte indices, 'uint32' for unsigned int indices
     * @throws Error if no index accessor exists or the component type is unsupported
     */
    getIndexBitSize(): 'uint16' | 'uint32';
    /**
     * Gets the vertex handles associated with this primitive for GPU resources.
     * @returns The vertex handles if they exist, otherwise undefined
     */
    get _vertexHandles(): VertexHandles | undefined;
    /**
     * Gets the current count of material variant updates across all primitives.
     * This counter is incremented whenever material variants are modified.
     * @returns The number of material variant updates since application start
     */
    static get variantUpdateCount(): number;
    /**
     * Registers a material variant for this primitive with a specific name.
     * Material variants allow switching between different materials at runtime.
     * @param variantName - The unique name for this material variant
     * @param material - The material to associate with the variant name
     */
    setMaterialVariant(variantName: string, material: Material): void;
    /**
     * Applies a previously registered material variant by its name.
     * Changes the current material to the variant if it exists.
     * @param variantName - The name of the variant to apply
     */
    applyMaterialVariant(variantName: string): void;
    /**
     * Gets the name of the currently applied material variant.
     * @returns The name of the active variant, or an empty string if no variant is active
     */
    getCurrentVariantName(): string;
    /**
     * Gets all registered variant names for this primitive.
     * @returns An array containing all variant names
     */
    getVariantNames(): string[];
    /**
     * Gets the material associated with a specific variant name.
     * @param variantName - The name of the variant to look up
     * @returns The material for the variant, or undefined if the variant doesn't exist
     */
    getVariantMaterial(variantName: string): Material | undefined;
    /**
     * Sets the material for this primitive and updates rendering sort keys.
     * The sort key is updated based on material properties for efficient rendering order.
     * @param mat - The material to assign to this primitive
     */
    set material(mat: Material);
    /**
     * Gets the current material assigned to this primitive.
     * @returns The material currently in use
     */
    get material(): Material;
    /**
     * Updates the sort key by setting a specific bit range with a value.
     * Sort keys are used to optimize rendering order for transparency and material batching.
     * @param offset - The bit offset position where to start writing
     * @param length - The number of bits to write
     * @param value - The value to encode in the specified bit range
     */
    setSortKey(offset: PrimitiveSortKeyOffset, length: PrimitiveSortKeyLength, value: number): void;
    /**
     * Sets the render queue value of this primitive.
     * Higher values draw later within the same translucency bucket.
     * The queue is encoded into the viewport-layer bits of the sort key.
     * @param queue - Value between 0 and 2^3-1 representing relative draw order
     */
    setRenderQueue(queue: number): void;
    /**
     * Associates this primitive with a parent mesh.
     * This establishes the hierarchical relationship between mesh and primitive.
     * @param mesh - The mesh that this primitive belongs to
     * @internal
     */
    _belongToMesh(mesh: Mesh): void;
    /**
     * Gets the mesh that this primitive belongs to.
     * @returns The parent mesh if it exists, otherwise undefined
     */
    get mesh(): IMesh | undefined;
    /**
     * Creates a backup of the current material for later restoration.
     * Used internally for material switching operations.
     * @internal
     */
    _backupMaterial(): void;
    /**
     * Restores the previously backed-up material if it still exists.
     * Used internally for reverting material changes.
     * @internal
     */
    _restoreMaterial(): void;
    /**
     * Retrieves a primitive instance by its unique identifier.
     * @param primitiveUid - The unique identifier of the primitive to find
     * @returns The primitive if found and still exists, otherwise undefined
     */
    static getPrimitive(primitiveUid: PrimitiveUID): Primitive | undefined;
    /**
     * Gets the total number of primitives created in the application.
     * @returns The total count of primitives
     */
    static getPrimitiveCount(): number;
    /**
     * Notifies the primitive that its position accessor has been updated.
     * This triggers recalculation of bounding boxes and mesh updates.
     * @param accessorVersion - The new version number of the updated accessor
     */
    onAccessorUpdated(accessorVersion: number): void;
    /**
     * Sets the vertex and index data for this primitive.
     * This is the main method for configuring primitive geometry and rendering properties.
     * @param attributes - Map of vertex attributes with their semantic meanings
     * @param mode - The primitive rendering mode (triangles, triangle strip, etc.)
     * @param material - Optional material to assign (uses default if not provided)
     * @param indicesAccessor - Optional index accessor for indexed rendering
     */
    setData(attributes: Attributes, mode: PrimitiveModeEnum, material?: Material, indicesAccessor?: Accessor): void;
    /**
     * Copies vertex data from a descriptor into this primitive.
     * Creates appropriate buffers and accessors for the provided data.
     * @param desc - Descriptor containing arrays of vertex data and configuration
     */
    copyVertexData({ attributes, attributeSemantics, primitiveMode, indices, material }: PrimitiveDescriptor): void;
    /**
     * Creates a new primitive from a descriptor containing vertex data.
     * This is a factory method that creates and initializes a primitive in one step.
     * @param desc - The primitive descriptor with vertex data and configuration
     * @returns A new primitive instance with the specified data
     */
    static createPrimitive(engine: Engine, desc: PrimitiveDescriptor): Primitive;
    /**
     * Gets the index accessor for this primitive.
     * @returns The index accessor if indices are used, otherwise undefined
     */
    get indicesAccessor(): Accessor | undefined;
    /**
     * Gets the vertex count for indexed primitives.
     * For indexed rendering, this returns the number of indices.
     * @returns The number of indices if indexed, otherwise the vertex count
     */
    getVertexCountAsIndicesBased(): number;
    /**
     * Gets the vertex count based on vertex buffer data.
     * @returns The number of vertices in the vertex buffers
     */
    getVertexCountAsVerticesBased(): Count;
    /**
     * Calculates the triangle count for indexed primitives.
     * The count depends on the primitive mode (triangles, triangle strip, etc.).
     * @returns The number of triangles that will be rendered with indices
     */
    getTriangleCountAsIndicesBased(): Count;
    /**
     * Calculates the triangle count for non-indexed primitives.
     * The count depends on the primitive mode and vertex count.
     * @returns The number of triangles that will be rendered from vertices
     */
    getTriangleCountAsVerticesBased(): Count;
    /**
     * Checks if this primitive uses index-based rendering.
     * @returns True if the primitive has an index buffer, false otherwise
     */
    hasIndices(): boolean;
    /**
     * Gets all vertex attribute accessors for this primitive.
     * @returns An array of all attribute accessors
     */
    get attributeAccessors(): Array<Accessor>;
    /**
     * Gets a specific vertex attribute by its semantic meaning.
     * @param semantic - The semantic identifier for the attribute
     * @returns The accessor for the attribute, or undefined if not found
     */
    getAttribute(semantic: VertexAttributeSemanticsJoinedString): Accessor | undefined;
    /**
     * Gets all vertex attribute semantic identifiers.
     * @returns An array of all attribute semantic strings
     */
    get attributeSemantics(): Array<VertexAttributeSemanticsJoinedString>;
    /**
     * Gets an iterator for all attribute entries (semantic, accessor pairs).
     * @returns An iterator over attribute map entries
     */
    get attributeEntries(): MapIterator<[VertexAttributeSemanticsJoinedString, Accessor]>;
    /**
     * Gets the composition types of all vertex attributes.
     * @returns An array of composition types (Vec2, Vec3, Vec4, Scalar, etc.)
     */
    get attributeCompositionTypes(): Array<CompositionTypeEnum>;
    /**
     * Gets the component types of all vertex attributes.
     * @returns An array of component types (Float, UnsignedByte, etc.)
     */
    get attributeComponentTypes(): Array<ComponentTypeEnum>;
    /**
     * Gets the primitive rendering mode.
     * @returns The primitive mode enum (Triangles, TriangleStrip, etc.)
     */
    get primitiveMode(): PrimitiveModeEnum;
    /**
     * Gets the unique identifier for this primitive.
     * @returns The primitive's UID
     */
    get primitiveUid(): PrimitiveUID;
    /**
     * Gets the version number of the position accessor.
     * Used to track when position data has been updated.
     * @returns The current position accessor version
     */
    get positionAccessorVersion(): number;
    /**
     * Gets the axis-aligned bounding box for this primitive.
     * The AABB is calculated from position data and cached until positions change.
     * @returns The bounding box containing all vertices
     */
    get AABB(): AABB;
    /**
     * Sets or updates a vertex attribute for this primitive.
     * @param accessor - The accessor containing the attribute data
     * @param vertexSemantic - The semantic meaning of the attribute
     */
    setVertexAttribute(accessor: Accessor, vertexSemantic: VertexAttributeSemanticsJoinedString): void;
    /**
     * Removes the index buffer from this primitive, converting it to non-indexed rendering.
     */
    removeIndices(): void;
    /**
     * Sets the index buffer for this primitive, enabling indexed rendering.
     * @param accessor - The accessor containing index data
     */
    setIndices(accessor: Accessor): void;
    /**
     * Sets blend shape (morph) targets for this primitive.
     * Blend shapes allow vertex animation by interpolating between target positions.
     * @param targets - Array of attribute maps representing morph targets
     */
    setBlendShapeTargets(targets: Array<Attributes>): void;
    static getMorphUniformDataTargetNumbers(): Count[];
    static getMorphUniformDataOffsets(): Offset[];
    static getPrimitiveCountHasMorph(): number;
    /**
     * Gets a copy of the blend shape targets for this primitive.
     * @returns A copy of the morph target array
     */
    getBlendShapeTargets(): Attributes[];
    /**
     * Gets the blend shape targets array.
     * @returns The array of morph target attributes
     */
    get targets(): Array<Attributes>;
    /**
     * Checks if this primitive uses blending (transparency) for rendering.
     * @returns True if the material has blending enabled, false otherwise
     */
    isBlend(): boolean;
    /**
     * Checks if this primitive is opaque (not transparent).
     * @returns True if the primitive is opaque, false if it uses blending
     */
    isOpaque(): boolean;
    /**
     * Creates GPU vertex and index buffers for this primitive.
     * This prepares the primitive for rendering by uploading data to the GPU.
     * @returns True if buffers were created, false if they already exist
     */
    create3DAPIVertexData(): boolean;
    /**
     * Updates the GPU vertex and index buffers with current data.
     * Used when vertex data has been modified and needs to be re-uploaded.
     * @returns True if buffers were updated, false if no buffers exist
     */
    update3DAPIVertexData(): boolean;
    /**
     * Deletes the GPU vertex and index buffers for this primitive.
     * Frees GPU memory when the primitive is no longer needed.
     * @returns True if buffers were deleted, false if no buffers exist
     */
    delete3DAPIVertexData(): boolean;
    /**
     * Gets the GPU resource handles for this primitive.
     * @returns The vertex handles for GPU resources, or undefined if not created
     */
    get vertexHandles(): VertexHandles | undefined;
    /**
     * Converts this indexed primitive to non-indexed geometry.
     * Expands vertex data by duplicating vertices according to indices.
     * This can increase memory usage but simplifies some rendering operations.
     */
    convertToUnindexedGeometry(): void;
    /**
     * Performs ray casting against this primitive's geometry.
     * Tests intersection between a ray and the triangles of this primitive.
     * @param origVec3 - The origin point of the ray
     * @param dirVec3 - The direction vector of the ray (should be normalized)
     * @param isFrontFacePickable - Whether front-facing triangles can be hit
     * @param isBackFacePickable - Whether back-facing triangles can be hit
     * @param dotThreshold - Threshold for determining front/back face orientation
     * @param hasFaceNormal - Whether to use face normals for culling
     * @returns Ray casting result with intersection data or failure indication
     */
    castRay(origVec3: IVector3, dirVec3: IVector3, isFrontFacePickable: boolean, isBackFacePickable: boolean, dotThreshold: number, hasFaceNormal: boolean): RaycastResultEx1;
    /**
     * Internal ray-triangle intersection test using Tomas Möller algorithm.
     * @param origVec3 - Ray origin
     * @param dirVec3 - Ray direction
     * @param i - Triangle index
     * @param pos0IndexBase - First vertex index
     * @param pos1IndexBase - Second vertex index
     * @param pos2IndexBase - Third vertex index
     * @param isFrontFacePickable - Whether front faces are pickable
     * @param isBackFacePickable - Whether back faces are pickable
     * @param dotThreshold - Normal dot product threshold
     * @param hasFaceNormal - Whether to use face normals
     * @returns Intersection result with barycentric coordinates
     * @private
     */
    private __castRayInnerTomasMoller;
    /**
     * Calculates the normal vector from UV coordinates
     * @param pos0IndexBase Index of first position
     * @param pos1IndexBase Index of second position
     * @param pos2IndexBase Index of third position
     * @param u U coordinate
     * @param v V coordinate
     * @returns The calculated normal vector
     */
    private __calcNormalFromUV;
}
