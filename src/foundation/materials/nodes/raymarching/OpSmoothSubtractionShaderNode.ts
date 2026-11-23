import OpSmoothSubtractionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OpSmoothSubtraction.glsl';
import OpSmoothSubtractionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OpSmoothSubtraction.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that subtracts the subtractor distance from the base distance
 * with a smooth transition (smooth difference), matching OpSubtraction's
 * base / subtractor semantics.
 */
export class OpSmoothSubtractionShaderNode extends AbstractShaderNode {
  constructor() {
    super('opSmoothSubtraction', {
      codeGLSL: OpSmoothSubtractionShaderityObjectGLSL.code,
      codeWGSL: OpSmoothSubtractionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('base', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0)));
    this.__inputs.push(
      new Socket('subtractor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
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
