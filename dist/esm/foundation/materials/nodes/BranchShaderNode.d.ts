import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that performs conditional branching based on a boolean condition.
 *
 * This node selects between two input values based on a boolean condition:
 * - If condition is true, outputs the ifTrue value
 * - If condition is false, outputs the ifFalse value
 *
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * @example
 * ```typescript
 * // Create a branch node for Vec4 float operations
 * const branchNode = new BranchShaderNode(CompositionType.Vec4, ComponentType.Float);
 * ```
 */
export declare class BranchShaderNode extends AbstractShaderNode {
    /**
     * Creates a new BranchShaderNode with the specified composition and component types.
     *
     * @param compositionType - The composition type for ifTrue/ifFalse/output (Scalar, Vec2, Vec3, or Vec4)
     * @param componentType - The component type for ifTrue/ifFalse/output (Float, Int, etc.)
     *
     * @throws {Error} Throws an error if the composition type is not supported
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Returns the default value for a given composition type.
     * This is used to initialize input sockets with appropriate zero values.
     *
     * @param compositionType - The composition type to get the default value for
     * @returns The default value (zero) for the specified composition type
     *
     * @throws {Error} Throws an error if the composition type is not implemented
     */
    getDefaultValue(compositionType: CompositionTypeEnum): Scalar | Vector2 | Vector3 | Vector4;
    /**
     * Gets the condition input socket (boolean).
     *
     * @returns The condition input socket
     */
    getSocketInputCondition(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the ifTrue input socket.
     * This value is selected when condition is true.
     *
     * @returns The ifTrue input socket
     */
    getSocketInputIfTrue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the ifFalse input socket.
     * This value is selected when condition is false.
     *
     * @returns The ifFalse input socket
     */
    getSocketInputIfFalse(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the result of the branch operation.
     *
     * @returns The output socket containing the selected value
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Generates the appropriate shader function name derivative based on the current
     * rendering backend and input socket types.
     *
     * For WebGPU, this method generates type-specific function names to handle
     * different combinations of composition and component types. For WebGL,
     * it returns the base shader function name.
     *
     * @returns The shader function name derivative for the current configuration
     *
     * @throws {Error} Throws an error if the input socket type combination is not implemented
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
