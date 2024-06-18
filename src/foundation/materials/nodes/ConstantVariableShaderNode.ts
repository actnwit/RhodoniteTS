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
  constructor(nodeName: string, compositionType: N, componentType: T) {
    super(nodeName, {});

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__commonPart = new ConstantVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  setDefaultInputValue(value: IVector) {
    (this.__commonPart as ConstantVariableShader).setConstantValue(value);
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
