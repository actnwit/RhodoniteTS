import type { CGAPIResourceHandle, Index } from '../../types/CommonTypes';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import type { IMeshEntity } from '../helpers/EntityHelper';
import { AABB } from '../math/AABB';
import type { IVector3 } from '../math/IVector';
import type { Engine } from '../system/Engine';
import type { Primitive } from './Primitive';
import { type IMesh, type RaycastResultEx1 } from './types/GeometryTypes';
/**
 * The Mesh class.
 * This mesh object has primitives (geometries) or a reference of 'original mesh'.
 * If the latter, this mesh object is an 'instanced mesh', which has no primitives.
 * Instanced meshes refer original mesh's primitives when drawing.
 */
export declare class Mesh implements IMesh {
    private readonly __engine;
    private readonly __meshUID;
    static readonly invalidateMeshUID = -1;
    static __mesh_uid_count: number;
    private __primitives;
    private __opaquePrimitives;
    private __translucentPrimitives;
    private __blendWithZWritePrimitives;
    private __blendWithoutZWritePrimitives;
    private __morphPrimitives;
    private __localAABB;
    private __vaoUids;
    private __variationVBOUid;
    private __latestPrimitivePositionAccessorVersionForAABB;
    private __latestPrimitivePositionAccessorVersionForSetUpDone;
    private __belongToEntities;
    /**
     * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
     * 0: Not calculate tangent (not apply normal texture)
     * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
     * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
     * 3: Calculate all tangent in a shader.
     * 4: Precalculate all tangent in the javascript
     */
    tangentCalculationMode: Index;
    private __hasFaceNormal;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpVec3_2;
    private static __tmpVec3_3;
    private static __tmpVec3_4;
    private static __tmpVec3_5;
    private static __tmpVec3_6;
    private static __tmpVec3_7;
    private static __tmpVec3_8;
    private static __tmpVec3_9;
    private static __tmpVec3_10;
    private static __tmpVec3_11;
    private static __tmpReturnVec3_0;
    private static __tmpReturnVec3_1;
    private static __tmpReturnVec3_2;
    private __primitivePositionUpdateCount;
    /**
     * Constructor
     */
    constructor(engine: Engine);
    /**
     * Gets the VAO (Vertex Array Object) UID for the specified index.
     * @param index - The index of the primitive
     * @returns The VAO resource handle
     */
    getVaoUids(index: Index): CGAPIResourceHandle;
    /**
     * Gets the VAO (Vertex Array Object) UID for the specified primitive UID.
     * @param primitiveUid - The UID of the primitive
     * @returns The VAO resource handle
     */
    getVaoUidsByPrimitiveUid(primitiveUid: Index): CGAPIResourceHandle;
    /**
     * Gets the inner mesh entities that belong to this mesh.
     * @returns Array of mesh entities
     */
    get meshEntitiesInner(): IMeshEntity[];
    /**
     * Registers this mesh as belonging to a mesh component.
     * @param meshComponent - The mesh component that owns this mesh
     * @internal
     */
    _belongToMeshComponent(meshComponent: MeshComponent): void;
    /**
     * Removes the association with a mesh component.
     * @param meshComponent - The mesh component to remove
     * @internal
     */
    _removeMeshComponent(meshComponent: MeshComponent): void;
    /**
     * Adds primitive.
     * @param primitive The primitive object.
     */
    addPrimitive(primitive: Primitive): void;
    /**
     * Sets the array of primitives for this mesh.
     * @param primitives - Array of primitives to set
     * @private
     */
    private __setPrimitives;
    /**
     * Checks if this mesh has opaque primitives.
     * @returns True if opaque primitives exist, false otherwise
     */
    isExistOpaque(): boolean;
    /**
     * Checks if this mesh has translucent primitives.
     * @returns True if translucent primitives exist, false otherwise
     */
    isExistTranslucent(): boolean;
    /**
     * Checks if this mesh has blend-with-z-write primitives.
     * @returns True if blend-with-z-write primitives exist, false otherwise
     */
    isExistBlendWithZWrite(): boolean;
    /**
     * Checks if this mesh has blend-without-z-write primitives.
     * @returns True if blend-without-z-write primitives exist, false otherwise
     */
    isExistBlendWithoutZWrite(): boolean;
    /**
     * Gets the primitive at the specified index.
     * @param i - The index of the primitive to retrieve
     * @returns The primitive at the specified index
     */
    getPrimitiveAt(i: number): Primitive;
    /**
     * Gets the total number of primitives in this mesh.
     * @returns The number of primitives
     */
    getPrimitiveNumber(): number;
    /**
     * Updates the variation VBO (Vertex Buffer Object) for instancing.
     * @returns True if updated, false if not changed (not dirty)
     * @internal
     */
    updateVariationVBO(): boolean;
    /**
     * Deletes the variation VBO (Vertex Buffer Object).
     * @returns True if updated, false if not changed (not dirty)
     * @internal
     */
    deleteVariationVBO(): boolean;
    /**
     * Updates the VAO (Vertex Array Object) for all primitives in this mesh.
     */
    updateVAO(): void;
    /**
     * Deletes all VAO (Vertex Array Object) resources for this mesh.
     */
    deleteVAO(): void;
    /**
     * Performs ray casting against this mesh to find intersection points.
     * @param srcPointInLocal - The ray origin point in local space
     * @param directionInLocal - The ray direction in local space
     * @param dotThreshold - The dot product threshold for back-face culling (default: 0)
     * @returns Ray casting result with intersection information
     */
    castRay(srcPointInLocal: IVector3, directionInLocal: IVector3, dotThreshold?: number): RaycastResultEx1;
    /**
     * Gets the array of primitives in this mesh.
     * @returns Array of primitives
     */
    get primitives(): Primitive[];
    /**
     * Gets the unique identifier for this mesh.
     * @returns The mesh UID
     */
    get meshUID(): number;
    /**
     * Gets the variation VBO UID for internal use.
     * @returns The variation VBO resource handle
     * @internal
     */
    get _variationVBOUid(): CGAPIResourceHandle;
    /**
     * Called when primitive position data is updated.
     * Updates the position update counter and moves related entities to Load stage.
     * @internal
     */
    _onPrimitivePositionUpdated(): void;
    /**
     * Gets the primitive position update count.
     * @returns The number of times primitive positions have been updated
     */
    get primitivePositionUpdateCount(): number;
    /**
     * Gets AABB in local space.
     */
    get AABB(): AABB;
    /**
     * Calculates morph target primitives by blending vertex attributes.
     * @private
     */
    private __calcMorphPrimitives;
    /**
     * @internal
     */
    _calcTangents(): void;
    /**
     * Calculates tangent vectors for a triangle consisting of 3 vertices.
     * @param i - The starting vertex index
     * @param pos0 - Position of the first vertex
     * @param pos1 - Position of the second vertex
     * @param pos2 - Position of the third vertex
     * @param uv0 - UV coordinates of the first vertex
     * @param uv1 - UV coordinates of the second vertex
     * @param uv2 - UV coordinates of the third vertex
     * @param norm0 - Normal vector of the first vertex
     * @param tangentAccessor - Accessor for writing tangent data
     * @param indicesAccessor - Optional indices accessor
     * @private
     * @internal
     */
    private __calcTangentFor3Vertices;
    /**
     * Calculates the tangent vector for a single vertex.
     * @param pos0Vec3 - Position of the target vertex
     * @param pos1Vec3 - Position of the second vertex
     * @param pos2Vec3 - Position of the third vertex
     * @param uv0Vec2 - UV coordinates of the target vertex
     * @param uv1Vec2 - UV coordinates of the second vertex
     * @param uv2Vec2 - UV coordinates of the third vertex
     * @param norm0Vec3 - Normal vector of the target vertex
     * @param returnVec3 - Mutable vector to store the result
     * @returns The calculated tangent vector
     * @private
     */
    private __calcTangentPerVertex;
    /**
     * Determines whether to use pre-calculated tangent vectors based on the tangent calculation mode.
     * @returns True if tangent vectors should be pre-calculated, false otherwise
     * @private
     */
    private __usePreCalculatedTangent;
    /**
     * Calculates barycentric coordinates for all primitives in this mesh.
     * @internal
     */
    _calcBaryCentricCoord(): void;
    /**
     * Calculates face normals for primitives that don't have normal attributes.
     * @internal
     */
    _calcFaceNormalsIfNonNormal(): void;
    /**
     * Calculates face normals for a triangle consisting of 3 vertices.
     * @param i - The starting vertex index
     * @param pos0 - Position of the first vertex
     * @param pos1 - Position of the second vertex
     * @param pos2 - Position of the third vertex
     * @param normalAccessor - Accessor for writing normal data
     * @param indicesAccessor - Optional indices accessor
     * @private
     */
    private __calcFaceNormalFor3Vertices;
    /**
     * Gets the index of a primitive within this mesh.
     * @param primitive - The primitive to find the index of
     * @returns The index of the primitive in the mesh
     */
    getPrimitiveIndexInMesh(primitive: Primitive): number;
    /**
     * Apply a material variant to the mesh
     * @param variantName a variant name
     */
    applyMaterialVariant(variantName: string): void;
    /**
     * Gets the current material variant name applied to this mesh.
     * Returns empty string if no variant is applied or if primitives have different variants.
     * @returns The current variant name or empty string
     */
    getCurrentVariantName(): string;
    /**
     * Gets all available material variant names for this mesh.
     * @returns Array of variant names from all primitives
     */
    getVariantNames(): string[];
    /**
     * Checks if this mesh setup is completed and ready for rendering.
     * @returns True if setup is done, false otherwise
     */
    isSetUpDone(): boolean;
    /**
     * Updates VBO (Vertex Buffer Object) and VAO (Vertex Array Object) for all primitives.
     * @internal
     */
    _updateVBOAndVAO(): void;
    /**
     * Deletes all 3D API vertex data for this mesh.
     */
    delete3DAPIVertexData(): void;
}
