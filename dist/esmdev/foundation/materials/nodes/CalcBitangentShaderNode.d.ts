import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that calculates the bitangent vector from the tangent and normal vectors.
 * @example
 * ```typescript
 * // Create a calc bitangent node
 * const calcBitangentNode = new CalcBitangentShaderNode();
 *
 * // Connect inputs and get output
 * const lhsSocket = calcBitangentNode.getSocketInputLhs();
 * const rhsSocket = calcBitangentNode.getSocketInputRhs();
 * const outputSocket = calcBitangentNode.getSocketOutput();
 * ```
 */
export declare class CalcBitangentShaderNode extends AbstractShaderNode {
    /**
     * Creates a new CalcBitangentShaderNode with the specified composition and component types.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
     * @param componentType - The component type (Float, Int, etc.)
     *
     * @throws {Error} Throws an error if the composition type is not supported
     */
    constructor();
    /**
     * Gets the output socket that contains the tangent vector in world space.
     *
     * @returns The output socket containing the tangent vector in world space
     */
    getSocketOutputTangentInWorld(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the bitangent vector in world space.
     *
     * @returns The output socket containing the bitangent vector in world space
     */
    getSocketOutputBitangentInWorld(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
