import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that implements the step function.
 *
 * The step function returns 0.0 if the value is less than the edge, and 1.0 otherwise.
 * This is commonly used for creating sharp transitions and thresholding operations in shaders.
 *
 * @example
 * ```typescript
 * const stepNode = new StepShaderNode(CompositionType.Scalar, ComponentType.Float);
 * ```
 */
export declare class StepShaderNode extends AbstractShaderNode {
    /**
     * Creates a new StepShaderNode instance.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4) for the inputs and output
     * @param componentType - The component type (Float, Int, etc.) for the inputs and output
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the value parameter.
     *
     * The value socket represents the input value to be compared against the edge.
     *
     * @returns The value input socket
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that provides the result of the step function.
     *
     * The output will be 0.0 if value < edge, and 1.0 if value >= edge.
     *
     * @returns The output socket containing the step function result
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the appropriate shader function name based on the current graphics API and composition type.
     *
     * For WebGPU, returns a type-specific function name (e.g., '_stepF32', '_stepVec2f').
     * For other APIs (WebGL), returns the base function name.
     *
     * @param engine - The engine instance
     * @returns The shader function name to use in the generated shader code
     * @throws {Error} Throws an error if the composition type is not implemented for WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
