import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { IVector } from '../../math/IVector';
import { Socket } from '../core/Socket';

export abstract class ConstantVariableShaderNode<
  N extends CompositionTypeEnum,
  T extends ComponentTypeEnum
> extends AbstractShaderNode {
  constructor(compositionType: N, componentType: T) {
    super('constantVariable', undefined, undefined);

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  setDefaultInputValue(value: IVector) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
