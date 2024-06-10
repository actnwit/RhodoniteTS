import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { EndShader } from '../../../webgl/shaders/nodes/EndShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class OutPositionShaderNode extends AbstractShaderNode {
  constructor() {
    super('outPosition', undefined, EndShader.getInstance());

    this.__inputs.push(new Socket('value', CompositionType.Vec4, ComponentType.Float));
  }

  getSocketInput() {
    return this.__inputs[0];
  }
}
