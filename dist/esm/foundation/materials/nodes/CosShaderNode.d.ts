import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that computes the cosine function of its input value.
 * This node accepts a single input value and outputs the cosine of that value.
 * The computation is performed in shader code (GLSL/WGSL) and supports
 * scalar, vector2, vector3, and vector4 input types.
 *
 * @example
 * ```typescript
 * // Create a cosine node for a scalar float value
 * const cosNode = new CosShaderNode(CompositionType.Scalar, ComponentType.Float);
 *
 * // Create a cosine node for a vec3 float value
 * const cosVec3Node = new CosShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export declare class CosShaderNode extends AbstractShaderNode {
    /**
     * Creates a new CosShaderNode instance with the specified composition and component types.
     * The node will have one input socket named 'value' and one output socket named 'outValue',
     * both configured with the provided types.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4) that defines the structure of the input/output data
     * @param componentType - The component type (Float, Int, etc.) that defines the data type of each component
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the value to compute the cosine of.
     * This is the socket where the input value should be connected.
     *
     * @returns The input socket that accepts the value for cosine computation
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that provides the computed cosine value.
     * This socket outputs the result of the cosine function applied to the input value.
     *
     * @returns The output socket containing the cosine computation result
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the appropriate shader function name based on the current rendering approach and input type.
     * For WebGPU, returns a type-specific function name (e.g., '_cosF32', '_cosVec2f').
     * For WebGL, returns the base function name '_cos'.
     *
     * This method ensures that the correct shader function is called based on the
     * composition type and the target graphics API.
     *
     * @param engine - The engine instance
     * @returns The shader function name to use in the generated shader code
     * @throws {Error} Throws an error if the composition type is not implemented for WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
