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
    private __terminalTransformScaleCache;
    private __distanceScaleFactor;
    private __usesWorldMatrix;
    /**
     * Creates an evaluator for one raymarching component.
     * @param nodeJson - The node graph stored in `RaymarchingComponent.rrnJson`
     * @param worldMatrix - The component entity's world matrix (`sceneGraph.matrixInner`)
     * @param uniformValueProvider - Optional resolver for Uniform node values
     */
    constructor(nodeJson: NodeJSON, worldMatrix: IMatrix44, uniformValueProvider?: RaymarchingUniformValueProvider);
    /**
     * Returns true when the distance subtree of a node contains SdApplyWorldMatrix.
     * The rendering shader applies the world-space distance correction to a component
     * whose graph uses it, so the CPU evaluator does the same.
     * @param node - Root of the distance subtree
     * @param visited - Node ids already visited
     */
    private __distanceNodeUsesWorldMatrix;
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
     *
     * When the graph is evaluated through `SdApplyWorldMatrix`, the returned value is
     * converted into a conservative world-space distance (the local distance times a
     * lower bound of the smallest singular value of the component's world matrix),
     * matching the distance the raymarching shader marches with. `SdApplyTransform`
     * nodes in a terminal's subtree scale its distance by their smallest axis scale,
     * again matching the shader.
     *
     * @param pointInWorld - The point to evaluate
     * @returns The signed distance, or null when the graph is unsupported
     */
    evalDistanceAt(pointInWorld: Vector3): number | null;
    /**
     * Input ports that carry the SDF's spatial data (position or distance). The same
     * set is followed by the shared shader when it links `SdApplyTransform` scale
     * globals to a terminal.
     */
    private static readonly __SPATIAL_INPUT_PORTS;
    /**
     * Returns the conservative local-to-world scale of the `SdApplyTransform` nodes
     * that feed a terminal node's distance subtree.
     *
     * A transform node scaled below 1 makes the distances of its subtree larger than
     * the matching world distances. The factor is the product of the reachable nodes'
     * smallest axis scales (a valid lower bound for nested chains), clamped to [1e-4, 1].
     *
     * @param terminal - The OutUnion / OutDistance node
     * @returns The scale, or null when a transform scale cannot be evaluated
     */
    private __terminalTransformScale;
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
     * Returns true when a position chain contains a non-linear domain node
     * (TwistX/Y/Z or BendXY/XZ/YZ/YX/ZX/ZY), which cannot be represented by a matrix.
     */
    private __positionChainHasNonLinearNode;
    /**
     * Expands primitive bounds for non-linear domain nodes in the position chain.
     * The chain folds them in as identity, so the extents of the rotated axis pair
     * are widened to the radius around the rotation axis (a conservative bound for
     * any angle).
     */
    private __expandBoundsForNonLinearChain;
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
