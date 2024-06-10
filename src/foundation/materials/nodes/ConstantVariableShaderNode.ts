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
  private __outValueSocket: Socket<string, N, T>;

  constructor(compositionType: N, componentType: T) {
    super('constantVariable', undefined, undefined);

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new ConstantVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    const outValueSocket = new Socket('outValue', compositionType, componentType);
    this.__outputs.push(outValueSocket);
    this.__outValueSocket = outValueSocket;
  }

  setDefaultInputValue(value: IVector) {
    (this.__shader as ConstantVariableShader).setConstantValue(value);
  }

  getSocketOutput() {
    return this.__outValueSocket;
  }
}
