import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that implements the smoothstep function for smooth interpolation between two edge values.
 *
 * The smoothstep function performs smooth Hermite interpolation between 0 and 1 when edge0 < x < edge1.
 * This is useful for creating smooth transitions and gradients in shaders.
 *
 * @example
 * ```typescript
 * const smoothStepNode = new SmoothStepShaderNode(
 *   CompositionType.Vec3,
 *   ComponentType.Float
 * );
 * ```
 */
export declare class SmoothStepShaderNode extends AbstractShaderNode {
    /**
     * Creates a new SmoothStepShaderNode instance.
     *
     * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4) for the shader node
     * @param componentType - The component type (Float, Int, etc.) for the shader node
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the input socket for the value parameter of the smoothstep function.
     *
     * This is the value to be interpolated between edge0 and edge1.
     *
     * @returns The input socket for the value parameter
     */
    getSocketInputValue(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket that contains the result of the smoothstep operation.
     *
     * The output will be a smoothly interpolated value between 0 and 1 based on
     * where the input value falls relative to edge0 and edge1.
     *
     * @returns The output socket containing the smoothstep result
     */
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the appropriate shader function name based on the current process approach and composition type.
     *
     * For WebGPU, the function name includes a type suffix (F32, Vec2f, Vec3f, Vec4f) to match
     * WGSL naming conventions. For other approaches (WebGL), the base function name is used.
     *
     * @param engine - The engine instance
     * @returns The shader function name with appropriate type suffix for the current context
     * @throws {Error} If the composition type is not supported
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
