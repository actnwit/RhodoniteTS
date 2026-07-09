import { type ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that applies premultiplied alpha transformation to a vec4 color.
 * This node multiplies the RGB components by the alpha component.
 * Formula: outColor = vec4(inColor.rgb * inColor.a, inColor.a)
 *
 * This is commonly used for correct alpha blending in compositing operations.
 */
export declare class PremultipliedAlphaShaderNode extends AbstractShaderNode {
    /**
     * Creates a new PremultipliedAlphaShaderNode instance.
     *
     * @param componentType - The component type (typically Float32) of the vector components
     */
    constructor(componentType?: ComponentTypeEnum);
    /**
     * Gets the shader function name derivative based on the current process approach.
     * For WebGPU, it appends the Vec4f suffix to the function name.
     * For other approaches (WebGL), it returns the base function name without modification.
     *
     * @returns The appropriate shader function name for the current context
     */
    getShaderFunctionNameDerivative(engine: Engine): string;
}
