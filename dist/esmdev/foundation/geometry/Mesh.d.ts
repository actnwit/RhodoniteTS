import { Primitive } from './Primitive';
import { AABB } from '../math/AABB';
import { Index, CGAPIResourceHandle } from '../../types/CommonTypes';
import { IVector3 } from '../math/IVector';
import { IMesh, RaycastResultEx1 } from './types/GeometryTypes';
import { IMeshEntity } from '../helpers/EntityHelper';
import { MeshComponent } from '../components/Mesh/MeshComponent';
/**
 * The Mesh class.
 * This mesh object has primitives (geometries) or a reference of 'original mesh'.
 * If the latter, this mesh object is an 'instanced mesh', which has no primitives.
 * Instanced meshes refer original mesh's primitives when drawing.
 */
export declare class Mesh implements IMesh {
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
    constructor();
    getVaoUids(index: Index): CGAPIResourceHandle;
    getVaoUidsByPrimitiveUid(primitiveUid: Index): CGAPIResourceHandle;
    get meshEntitiesInner(): IMeshEntity[];
    _belongToMeshComponent(meshComponent: MeshComponent): void;
    /**
     * Adds primitive.
     * @param primitive The primitive object.
     */
    addPrimitive(primitive: Primitive): void;
    private __setPrimitives;
    isExistOpaque(): boolean;
    isExistTranslucent(): boolean;
    isExistBlendWithZWrite(): boolean;
    isExistBlendWithoutZWrite(): boolean;
    getPrimitiveAt(i: number): Primitive;
    getPrimitiveNumber(): number;
    /**
     * @internal
     * @returns true: updated, false: not changed (not dirty)
     */
    updateVariationVBO(): boolean;
    /**
     * @internal
     * @returns true: updated, false: not changed (not dirty)
     */
    deleteVariationVBO(): boolean;
    updateVAO(): void;
    deleteVAO(): void;
    castRay(srcPointInLocal: IVector3, directionInLocal: IVector3, dotThreshold?: number): RaycastResultEx1;
    get primitives(): Primitive[];
    get meshUID(): number;
    /**
     * @internal
     */
    get _variationVBOUid(): CGAPIResourceHandle;
    _onPrimitivePositionUpdated(): void;
    get primitivePositionUpdateCount(): number;
    /**
     * Gets AABB in local space.
     */
    get AABB(): AABB;
    private __calcMorphPrimitives;
    /**
     * @internal
     */
    _calcTangents(): void;
    /**
     * @internal
     */
    private __calcTangentFor3Vertices;
    private __calcTangentPerVertex;
    private __usePreCalculatedTangent;
    /**
     * @internal
     */
    _calcBaryCentricCoord(): void;
    /**
     * @internal
     */
    _calcFaceNormalsIfNonNormal(): void;
    private __calcFaceNormalFor3Vertices;
    getPrimitiveIndexInMesh(primitive: Primitive): number;
    /**
     * Apply a material variant to the mesh
     * @param variantName a variant name
     */
    applyMaterialVariant(variantName: string): void;
    getCurrentVariantName(): string;
    getVariantNames(): string[];
    isSetUpDone(): boolean;
}
