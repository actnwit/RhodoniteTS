import OpSmoothUnionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OpSmoothUnion.glsl';
import OpSmoothUnionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OpSmoothUnion.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that blends two distance values with a smooth union.
 *
 * The smoothness controls the width of the blend. Values close to zero behave
 * like a hard union.
 */
export class OpSmoothUnionShaderNode extends AbstractShaderNode {
  constructor() {
    super('opSmoothUnion', {
      codeGLSL: OpSmoothUnionShaderityObjectGLSL.code,
      codeWGSL: OpSmoothUnionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('lhs', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(new Socket('rhs', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(
      new Socket('smoothness', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.1))
    );
    this.__outputs.push(
      new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
