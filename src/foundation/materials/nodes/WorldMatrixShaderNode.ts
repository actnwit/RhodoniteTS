import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import WorldMatrixShaderityObject from '../../../webgl/shaderity_shaders/nodes/WorldMatrix.vert'
import AbstractShaderNode from '../core/AbstractShaderNode';

export default class WorldMatrixShaderNode extends AbstractShaderNode {

  constructor() {
    super('worldMatrix', WorldMatrixShaderityObject.code);

    this.__outputs.push(
      {
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}
