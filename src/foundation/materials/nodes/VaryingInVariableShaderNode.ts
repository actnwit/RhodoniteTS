import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentTypeEnum } from '../../definitions/ComponentType';
import { VaryingVariableShader } from '../../../webgl/shaders/nodes/VaryingVariableShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class VaryingInVariableShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('varyingInVariable');

    this.__shaderFunctionName += '_' + this.__shaderNodeUid;

    this.__shader = new VaryingVariableShader(
      this.__shaderFunctionName,
      compositionType,
      componentType
    );

    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  setVaryingVariableName(value: any) {
    (this.__shader as VaryingVariableShader).setVariableName(value);
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
