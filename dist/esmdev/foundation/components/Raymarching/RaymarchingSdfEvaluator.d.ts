import type { NodeJSON } from '../../../types/NodeJSON';
import { AABB } from '../../math/AABB';
import type { IMatrix44 } from '../../math/IMatrix';
import { Vector3 } from '../../math/Vector3';
/**
 * Resolves a material parameter used by a Uniform shader node.
 *
 * The raymarching material is owned by the application, so the engine cannot
 * look it up directly. Applications that change uniform values at runtime can
 * provide this callback to keep the CPU-side SDF evaluation in sync.
 */
export type RaymarchingUniformValueProvider = (name: string) => unknown;
/**
 * Options for {@link RaymarchingSdfEvaluator.marchRay}.
 */
export type RaymarchingRaycastOptions = {
    /** Maximum distance along the ray to march. Defaults to 10000. */
    maxDistance?: number;
    /** Maximum number of sphere-tracing steps. Defaults to 256. */
    maxSteps?: number;
    /** Distance threshold that counts as a surface hit. Defaults to 0.001. */
    epsilon?: number;
};
/**
 * Result of a CPU-side SDF raycast.
 */
export type RaymarchingRaycastHit = {
    /** Distance along the ray from the origin. */
    t: number;
    /** Hit position in world space. */
    position: Vector3;
};
/**
 * A single sphere primitive extracted from an SDF graph.
 */
export type RaymarchingSpherePrimitive = {
    /** Sphere center in the evaluator's output space. */
    center: Vector3;
    /** Conservative sphere radius in the evaluator's output space. */
    radius: number;
    /** Whether the sphere's position chain contains SdApplyWorldMatrix. */
    usesWorldMatrix: boolean;
};
/**
 * Evaluates the SDF graph stored in `RaymarchingComponent.rrnJson`.
 *
 * The graph is evaluated in the same space as the raymarching shader:
 * `InitialPosition` is the world-space ray position, and
 * `SdApplyWorldMatrix` maps positions into the component entity's local space
 * with the inverse world matrix. The evaluator supports the SDF node set that
 * the raymarching node editor exposes.
 *
 * Bounds are conservative. A graph that contains an infinite primitive
 * (`SdBar*`, `SdTube*`) or an infinite repetition (`SdRepeat*`) has no finite
 * bounds and {@link calcBounds} returns null. Picking still works for those
 * graphs because sphere tracing does not require bounds.
 */
export declare class RaymarchingSdfEvaluator {
    private __nodes;
    private __inputLinks;
    private __outputNodes;
    private __worldMatrix;
    private __inverseWorldMatrix;
    private __uniformValueProvider?;
    private __scalarCache;
    private __vec3Cache;
    private __transformCache;
    private __inverseTransformCache;
    private __boundsCache;
    private __positionChainCache;
    /**
     * Creates an evaluator for one raymarching component.
     * @param nodeJson - The node graph stored in `RaymarchingComponent.rrnJson`
     * @param worldMatrix - The component entity's world matrix (`sceneGraph.matrixInner`)
     * @param uniformValueProvider - Optional resolver for Uniform node values
     */
    constructor(nodeJson: NodeJSON, worldMatrix: IMatrix44, uniformValueProvider?: RaymarchingUniformValueProvider);
    /**
     * Calculates a conservative world-space AABB of the SDF graph.
     * @returns The world-space bounds, or null when the graph is unbounded or
     * contains a node the evaluator does not understand.
     */
    calcBounds(): AABB | null;
    /**
     * Returns the sphere primitive when the graph evaluates to a single sphere.
     *
     * The center and radius are expressed in the evaluator's output space
     * (the space produced by this evaluator's world matrix). Any transform chain
     * before the sphere is folded into the result. A non-uniform local scale is
     * approximated by the largest axis scale so the returned sphere contains the
     * resulting ellipsoid.
     *
     * @returns The sphere primitive, or null for any other graph
     */
    calcSphere(): RaymarchingSpherePrimitive | null;
    /**
     * Evaluates the signed distance at a world-space point.
     * @param pointInWorld - The point to evaluate
     * @returns The signed distance, or null when the graph is unsupported
     */
    evalDistanceAt(pointInWorld: Vector3): number | null;
    /**
     * Marches a ray against the SDF graph.
     * @param originInWorld - Ray origin in world space
     * @param directionInWorld - Ray direction in world space
     * @param options - Marching options
     * @returns The hit, null for a miss, or undefined when the graph is unsupported
     */
    marchRay(originInWorld: Vector3, directionInWorld: Vector3, options?: RaymarchingRaycastOptions): RaymarchingRaycastHit | null | undefined;
    private __inputNode;
    private __controlValue;
    private __toNumber;
    private __toVector3;
    private __uniformValue;
    private __readScalarNodeValue;
    private __readVec3NodeValue;
    private __readScalarInput;
    private __readVec3Input;
    private __getTransform;
    private __getInverseTransform;
    private __evalPositionForDistance;
    private __evalPositionOutput;
    private __evalDistanceNode;
    private __evalBoundsNode;
    /**
     * Returns the exact AABB of a sphere transformed by the position chain.
     * The transformed shape is an ellipsoid, whose extent along each world axis
     * is the radius times the length of the corresponding row of the linear part.
     */
    private __evalSphereBounds;
    private __evalPrimitiveBounds;
    /**
     * Returns true when a position chain contains SdApplyWorldMatrix.
     * A graph without this node is authored in world space and does not follow
     * the component entity transform.
     */
    private __positionChainUsesWorldMatrix;
    /**
     * Returns the matrix that maps the output space of a position node to world space.
     * `SdApplyTransform` and `SdApplyWorldMatrix` store the inverse transform in the
     * position chain, so the forward transform is the composition `parent * transform`.
     */
    private __positionChainToWorld;
    /**
     * Intersects a normalized ray with an AABB.
     * @returns The entry and exit distances, or null when the ray misses
     */
    static intersectRayAabb(origin: Vector3, direction: Vector3, aabb: AABB): [number, number] | null;
}
