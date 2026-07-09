import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs a logical AND operation on two boolean values.
 *
 * This node takes two boolean inputs and outputs the result of the logical AND operation.
 * The output is true only when both inputs are true.
 *
 * @example
 * ```typescript
 * // Create an AND node
 * const andNode = new AndShaderNode();
 * ```
 */
export declare class AndShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AndShaderNode instance.
     *
     * @remarks
     * The node will have two boolean inputs:
     * - `lhs`: Left-hand side operand (boolean)
     * - `rhs`: Right-hand side operand (boolean)
     *
     * The output is a boolean scalar indicating the AND result.
     */
    constructor();
    /**
     * Gets the input socket for the left-hand side boolean value.
     *
     * @returns The input socket for the left operand
     */
    getSocketInputLhs(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for the right-hand side boolean value.
     *
     * @returns The input socket for the right operand
     */
    getSocketInputRhs(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that provides the AND result.
     *
     * @returns The output socket containing the boolean AND result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
