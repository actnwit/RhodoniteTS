import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that computes the length (magnitude) of a vector.
 * This node accepts a single vector input and outputs a scalar value
 * representing the Euclidean length of the vector.
 *
 * The length is calculated as sqrt(x² + y² + ...) for all components
 * of the input vector. This is commonly used in graphics programming
 * for distance calculations, normalization, and various lighting computations.
 *
 * @example
 * ```typescript
 * // Create a length node for a vec3 float value
 * const lengthNode = new LengthShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export declare class LengthShaderNode extends AbstractShaderNode {
    /**
     * Creates a new LengthShaderNode instance.
     *
     * @param compositionType - The composition type of the input vector (Vec2, Vec3, or Vec4)
     * @param componentType - The component type of the vector elements (typically Float)
     *
     * @remarks
     * The node sets up one input:
     * - `value`: The input vector with the specified composition and component type
     *
     * The output is a scalar value with Float component type.
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the vector value to compute the length of.
     * This is the socket where the input vector should be connected.
     *
     * @returns The input socket that accepts the vector for length computation
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that provides the computed length value.
     * This socket outputs the scalar result of the length function.
     *
     * @returns The output socket containing the length computation result
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the appropriate shader function name based on the current rendering approach and input type.
     * For WebGPU, returns a type-specific function name (e.g., '_lengthVec2f', '_lengthVec3f').
     * For WebGL, returns the base function name '_length'.
     *
     * This method ensures that the correct shader function is called based on the
     * composition type and the target graphics API.
     *
     * @param engine - The engine instance
     * @returns The shader function name to use in the generated shader code
     * @throws {Error} Throws an error if the composition type is not supported for WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
