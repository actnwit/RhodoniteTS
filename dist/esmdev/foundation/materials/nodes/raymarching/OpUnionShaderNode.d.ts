import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that performs union operations between two input values.
 * Outputs the smaller of the two inputs for each component.
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * This node creates two input sockets (in1 and in2) and one output socket,
 * all of the same composition and component type. The node generates shader code
 * for both WebGL (GLSL) and WebGPU (WGSL) backends.
 *
 * @example
 * ```typescript
 * // Create a min node for Vec3 float operations
 * const opUnionNode = new OpUnionShaderNode(CompositionType.Vec3, ComponentType.Float);
 *
 * // Connect inputs and get output
 * const lhsSocket = opUnionNode.getSocketInputLhs();
 * const rhsSocket = opUnionNode.getSocketInputRhs();
 * const outputSocket = opUnionNode.getSocketOutput();
 * ```
 */
export declare class OpUnionShaderNode extends AbstractShaderNode {
    /**
     * Creates a new OpUnionShaderNode with the specified composition and component types.
     *
     */
    constructor();
    /**
     * Gets the left-hand side input socket.
     * This socket represents the first operand in the union operation.
     *
     * @returns The left-hand side input socket
     */
    getSocketInputLhs(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
    /**
     * Gets the right-hand side input socket.
     * This socket represents the second operand in the union operation.
     *
     * @returns The right-hand side input socket
     */
    getSocketInputRhs(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the result of the union operation.
     *
     * @returns The output socket containing the union result
     */
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
