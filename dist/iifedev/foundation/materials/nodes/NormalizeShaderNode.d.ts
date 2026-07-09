import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { type CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that normalizes vectors by dividing each component by the vector's magnitude.
 * This node provides normalize functionality for Vec2, Vec3, and Vec4 compositions,
 * supporting both WebGL (GLSL) and WebGPU (WGSL) shader languages.
 */
export declare class NormalizeShaderNode extends AbstractShaderNode {
    /**
     * Creates a new NormalizeShaderNode instance.
     *
     * @param compositionType - The composition type (Vec2, Vec3, or Vec4) of the input and output values
     * @param componentType - The component type (e.g., Float32) of the vector components
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Gets the shader function name derivative based on the current process approach and composition type.
     * For WebGPU, it appends the vector type suffix (Vec2f, Vec3f, Vec4f) to the function name.
     * For other approaches (WebGL), it returns the base function name without modification.
     *
     * @returns The appropriate shader function name for the current context
     * @throws {Error} When an unsupported composition type is used with WebGPU
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
