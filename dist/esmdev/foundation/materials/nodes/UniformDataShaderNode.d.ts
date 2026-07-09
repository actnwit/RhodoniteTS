import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import type { CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that provides uniform data input functionality.
 * This node wraps UniformDataShader to provide a standardized interface
 * for passing uniform values to shader programs.
 */
export declare class UniformDataShaderNode extends AbstractShaderNode {
    /**
     * Creates a new UniformDataShaderNode instance.
     *
     * @param compositionType - The composition type that defines the structure of the data (scalar, vector, matrix, etc.)
     * @param componentType - The component type that defines the data type (float, int, etc.)
     */
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    /**
     * Sets the default input value for the specified input parameter.
     * Currently only supports setting the default value for the 'value' input.
     *
     * @param inputName - The name of the input parameter to set the default value for
     * @param value - The default value to assign to the input parameter
     */
    setDefaultInputValue(inputName: string, value: any): void;
    /**
     * Sets the uniform data variable name in the shader.
     * This name will be used to reference the uniform variable in the generated shader code.
     *
     * @param value - The variable name to use for the uniform data in the shader
     */
    setUniformDataName(value: any): void;
}
