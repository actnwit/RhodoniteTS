import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import ScalarToVector4ShaderityObject from '../../../webgl/shaderity_shaders/nodes/ScalarToVector4.glsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class ScalarToVector4ShaderNode extends AbstractShaderNode {
  constructor() {
    super('scalarToVector4', ScalarToVector4ShaderityObject.code);

    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'x',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'y',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'z',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'w',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
  getSocketX() {
    return new Socket('x', CompositionType.Scalar, ComponentType.Float);
  }
  getSocketY() {
    return new Socket('y', CompositionType.Scalar, ComponentType.Float);
  }
  getSocketZ() {
    return new Socket('z', CompositionType.Scalar, ComponentType.Float);
  }
  getSocketW() {
    return new Socket('w', CompositionType.Scalar, ComponentType.Float);
  }

  getSocketOutput() {
    return new Socket('outValue', CompositionType.Vec4, ComponentType.Float);
  }
}
