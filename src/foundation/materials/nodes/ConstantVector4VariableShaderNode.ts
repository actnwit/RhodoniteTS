import { ConstantVariableShader } from '../../../webgl/shaders/nodes/ConstantVariableShader';
import { CompositionType } from '../../definitions';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { IVector4 } from '../../math/IVector';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class ConstantVector4VariableShaderNode<
  T extends ComponentTypeEnum
> extends AbstractShaderNode {
  private __componentType: T;

  constructor(componentType: T) {
    super('constantVector4Variable', undefined, undefined);
    this.__componentType = componentType;
    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      CompositionType.Vec4,
      componentType
    );
  }

  setDefaultInputValue(value: IVector4) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }

  getSocketOutput() {
    return new Socket('outValue', CompositionType.Vec4, this.__componentType);
  }
}
