import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { EndShader } from '../../../webgl/shaders/nodes/EndShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class OutColorShaderNode extends AbstractShaderNode {
  constructor() {
    super('outColor', {
      commonPart: EndShader.getInstance(),
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('value', CompositionType.Vec4, ComponentType.Float));
  }

  getSocketInput() {
    return this.__inputs[0];
  }
}
