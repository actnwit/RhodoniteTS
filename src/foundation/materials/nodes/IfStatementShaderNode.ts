import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { IfStatementShader } from '../../../webgl/shaders/nodes/IfStatementShader';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class IfStatementShaderNode extends AbstractShaderNode {
  constructor() {
    super('ifStatement', {
      commonPart: new IfStatementShader(),
    });

    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Bool,
      name: 'condition',
    });
    this.__outputs.push({
      compositionType: CompositionType.Unknown,
      componentType: ComponentType.Unknown,
      name: 'ifStart',
    });
  }
}
