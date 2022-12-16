import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { UniformDataShader } from '../../../webgl/shaders/nodes/UniformDataShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class UniformDataShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('uniformData');

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new UniformDataShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'outValue',
    });
  }

  setDefaultInputValue(inputName: string, value: any) {
    if (inputName === 'value') {
      (this.__shader as UniformDataShader).setDefaultValue(value);
    }
  }

  setUniformDataName(value: any) {
    (this.__shader as UniformDataShader).setVariableName(value);
  }
}
