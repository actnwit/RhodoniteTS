import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs a logical OR operation on two boolean values.
 *
 * This node takes two boolean inputs and outputs the result of the logical OR operation.
 * The output is true when at least one of the inputs is true.
 *
 * @example
 * ```typescript
 * // Create an OR node
 * const orNode = new OrShaderNode();
 * ```
 */
export declare class OrShaderNode extends AbstractShaderNode {
    /**
     * Creates a new OrShaderNode instance.
     *
     * @remarks
     * The node will have two boolean inputs:
     * - `lhs`: Left-hand side operand (boolean)
     * - `rhs`: Right-hand side operand (boolean)
     *
     * The output is a boolean scalar indicating the OR result.
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
     * Gets the output socket that provides the OR result.
     *
     * @returns The output socket containing the boolean OR result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
