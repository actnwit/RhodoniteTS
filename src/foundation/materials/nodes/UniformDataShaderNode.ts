import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { UniformDataShader } from '../../../webgl/shaders/nodes/UniformDataShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class UniformDataShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('uniformData', {});

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__commonPart = new UniformDataShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  setDefaultInputValue(inputName: string, value: any) {
    if (inputName === 'value') {
      (this.__commonPart as UniformDataShader).setDefaultValue(value);
    }
  }

  setUniformDataName(value: any) {
    (this.__commonPart as UniformDataShader).setVariableName(value);
  }
}
