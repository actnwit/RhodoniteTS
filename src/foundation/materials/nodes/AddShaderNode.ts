import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import AddShaderityObject from '../../../webgl/shaderity_shaders/nodes/Add.glsl';
import { Socket } from '../core/Socket';

export class AddShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('add', AddShaderityObject.code);

    this.__inputs.push(new Socket('lhs', compositionType, componentType));
    this.__inputs.push(new Socket('rhs', compositionType, ComponentType.Float));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  getSocketInputLhs() {
    return this.__inputs[0];
  }

  getSocketInputRhs() {
    return this.__inputs[1];
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
