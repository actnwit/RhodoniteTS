import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that marks the beginning of a conditional block in a node-based shader graph.
 * This node acts as a conditional gateway that can pass through multiple values based on a boolean condition.
 * It dynamically manages input and output sockets for different data types and compositions.
 *
 * The node generates GLSL/WGSL code that implements a conditional block start function,
 * where values are passed through to outputs based on the blockStart boolean input.
 *
 * @example
 * ```typescript
 * const blockBeginNode = new BlockBeginShaderNode();
 * blockBeginNode.addInputAndOutput(CompositionType.Vec3, ComponentType.Float);
 * blockBeginNode.addInputAndOutput(CompositionType.Scalar, ComponentType.Int);
 * ```
 */
export declare class BlockBeginShaderNode extends AbstractShaderNode {
    /** Array of input sockets for value data (excluding the blockStart boolean input) */
    private __valueInputs;
    /** Array of output sockets corresponding to the value inputs */
    private __valueOutputs;
    /**
     * Creates a new BlockBeginShaderNode instance.
     * Initializes the node with a default boolean input socket named 'blockStart'
     * and sets up the underlying shader function with a unique name.
     */
    constructor();
    /**
     * Dynamically adds a matching input and output socket pair to the node.
     * This allows the node to handle additional data types that should be passed through
     * the conditional block. The input and output will have matching composition and component types.
     *
     * @param compositionType - The composition type (e.g., Scalar, Vec2, Vec3, Vec4, Mat3, Mat4) for the new socket pair
     * @param componentType - The component type (e.g., Float, Int, Bool) for the new socket pair
     *
     * @remarks
     * - Input sockets are named as `value_${index}` where index is the current count of value inputs
     * - Output sockets are named as `outValue_${index}` where index is the current count of value outputs
     * - The sockets are automatically added to both the node's input/output arrays and the internal value arrays
     *
     * @example
     * ```typescript
     * // Add a Vec3 float input/output pair
     * node.addInputAndOutput(CompositionType.Vec3, ComponentType.Float);
     *
     * // Add a scalar integer input/output pair
     * node.addInputAndOutput(CompositionType.Scalar, ComponentType.Int);
     * ```
     */
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}
