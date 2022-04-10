import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import { EndShader } from '../../../webgl/shaders/nodes/EndShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class OutColorShaderNode extends AbstractShaderNode {
  constructor() {
    super('outColor', undefined, EndShader.getInstance());

    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'value',
    });
  }
}
