import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import SplitVectorShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/SplitVector.glsl';
import SplitVectorShaderityObjectGLSL2 from '../../../webgl/shaderity_shaders/nodes/SplitVector2.glsl';

export class SplitVectorShaderNode extends AbstractShaderNode {
  constructor() {
    super('splitVector', {
      codeGLSL: SplitVectorShaderityObjectGLSL2.code,
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'xyzw',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'xyz',
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'xy',
    });

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'xyz',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'xy',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'zw',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'x',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'y',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'z',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'w',
    });
  }

  // getShaderFunctionNameDerivative() {
  //   if (this.inputConnections[0].inputNameOfThis === 'inXYZW') {
  //     // if ()
  //     return 'splitVector';
  //   }
  // }
}
