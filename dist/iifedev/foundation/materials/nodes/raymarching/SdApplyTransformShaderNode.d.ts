import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * A shader node that applies a transform to a signed distance function.
 * This node accepts a position and a transform and outputs the signed distance to the transformed position.
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
    /**
     * Creates a new SdSphereShaderNode instance.
     */
    constructor();
}
