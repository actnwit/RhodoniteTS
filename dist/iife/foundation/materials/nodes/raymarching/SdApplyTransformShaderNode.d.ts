import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that applies a transform to a signed distance function.
 * This node accepts a position and a transform and outputs the signed distance to the transformed position.
 *
 * The generated function also records the transform's smallest axis scale in a
 * per-node global. A raymarching terminal node multiplies the distances of the
 * subtree that uses this transform by it, so scaling the node below 1 does not make
 * sphere tracing overshoot the surface.
 *
 * @example
 * ```typescript
 * // Create a transform node
 * const transformNode = new TransformShaderNode(CompositionType.Mat4, ComponentType.Float, CompositionType.Vec3, ComponentType.Float);
 * const sdApplyTransformNode = new SdApplyTransformShaderNode();
 * sdApplyTransformNode.setInput('position', transformNode.getOutput('outValue'));
 * sdApplyTransformNode.setInput('transform', transformNode.getOutput('outValue'));
 * sdApplyTransformNode.setOutput('outDistance', transformNode.getOutput('outValue'));
 * ```
 */
export declare class SdApplyTransformShaderNode extends AbstractShaderNode {
    private __scaleGlobalName;
    /**
     * Creates a new SdSphereShaderNode instance.
     */
    constructor();
    /**
     * Gets the global that receives this node's smallest axis scale. Raymarching
     * terminal nodes multiply the distances of their subtree by it.
     */
    get distanceScaleGlobalName(): string;
}
