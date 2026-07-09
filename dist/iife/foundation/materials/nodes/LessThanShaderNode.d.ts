import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs a less-than comparison operation.
 *
 * This node compares two values and outputs a boolean result indicating whether
 * the left-hand side (lhs) is less than the right-hand side (rhs).
 * Both operands must be of the same component type (float, int, or uint).
 *
 * @example
 * ```typescript
 * // Create a less-than comparison node for float values
 * const lessThanNode = new LessThanShaderNode(ComponentType.Float);
 * ```
 */
export declare class LessThanShaderNode extends AbstractShaderNode {
    /**
     * Creates a new LessThanShaderNode instance.
     *
     * @param componentType - The component type of the inputs (Float, Int, or UnsignedInt)
     *
     * @remarks
     * The node will have two inputs:
     * - `lhs`: Left-hand side operand with Scalar composition and the specified component type
     * - `rhs`: Right-hand side operand with Scalar composition and the specified component type
     *
     * The output is always a boolean scalar indicating the comparison result.
     */
    constructor(componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the left-hand side value.
     *
     * @returns The input socket for the left operand
     */
    getSocketInputLhs(): Socket<string, import("../..").CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for the right-hand side value.
     *
     * @returns The input socket for the right operand
     */
    getSocketInputRhs(): Socket<string, import("../..").CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that provides the comparison result.
     *
     * @returns The output socket containing the boolean comparison result
     */
    getSocketOutput(): Socket<string, import("../..").CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the appropriate shader function name based on the current rendering approach and input type.
     * For WebGPU, returns a type-specific function name (e.g., '_lessThanF32', '_lessThanI32').
     * For WebGL, returns the base function name 'lessThan'.
     *
     * @param engine - The engine instance
     * @returns The shader function name to use in the generated shader code
     * @throws {Error} Throws an error if the component type is not supported for WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
