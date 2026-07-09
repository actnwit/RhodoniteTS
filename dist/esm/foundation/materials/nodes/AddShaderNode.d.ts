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
 * A shader node that performs addition operations between two input values.
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * This node creates two input sockets (lhs and rhs) and one output socket,
 * all of the same composition and component type. The node generates shader code
 * for both WebGL (GLSL) and WebGPU (WGSL) backends.
 *
 * @example
 * ```typescript
 * // Create an add node for Vec3 float operations
 * const addNode = new AddShaderNode(CompositionType.Vec3, ComponentType.Float);
 *
 * // Connect inputs and get output
 * const lhsSocket = addNode.getSocketInputLhs();
 * const rhsSocket = addNode.getSocketInputRhs();
 * const outputSocket = addNode.getSocketOutput();
 * ```
 */
export declare class AddShaderNode extends AbstractShaderNode {
    /**
     * Creates a new AddShaderNode with the specified composition and component types.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
     * @param componentType - The component type (Float, Int, etc.)
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
     * Gets the left-hand side input socket.
     * This socket represents the first operand in the addition operation.
     *
     * @returns The left-hand side input socket
     */
    getSocketInputLhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the right-hand side input socket.
     * This socket represents the second operand in the addition operation.
     *
     * @returns The right-hand side input socket
     */
    getSocketInputRhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the result of the addition operation.
     *
     * @returns The output socket containing the addition result
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
