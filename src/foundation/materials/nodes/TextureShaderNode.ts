import { TextureShader } from '../../../webgl/shaders/nodes/TextureShader';
import type { UniformDataShader } from '../../../webgl/shaders/nodes/UniformDataShader';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that provides uniform texture input functionality.
 * This node wraps UniformTextureShader to provide a standardized interface
 * for passing uniform textures to shader programs.
 */
export class TextureShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum) {
    super('texture', {});

    this.__shaderFunctionName += `_${this.__shaderNodeUid}`;

    this.__commonPart = new TextureShader(this.__shaderFunctionName, compositionType);

    this.__outputs.push(new Socket('outValue', CompositionType.Vec4, ComponentType.Float));
  }

  /**
   * Sets the default input value for the specified input parameter.
   * Currently only supports setting the default value for the 'value' input.
   *
   * @param inputName - The name of the input parameter to set the default value for
   * @param value - The default value to assign to the input parameter
   */
  setDefaultInputValue(inputName: string, value: any) {
    if (inputName === 'value') {
      (this.__commonPart as UniformDataShader).setDefaultValue(value);
    }
  }

  /**
   * Sets the uniform data variable name in the shader.
   * This name will be used to reference the uniform variable in the generated shader code.
   *
   * @param value - The variable name to use for the uniform data in the shader
   */
  setUniformDataName(value: any) {
    (this.__commonPart as UniformDataShader).setVariableName(value);
  }
}
