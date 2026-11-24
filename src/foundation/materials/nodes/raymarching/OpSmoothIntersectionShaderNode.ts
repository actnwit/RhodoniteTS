import OpSmoothIntersectionShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/OpSmoothIntersection.glsl';
import OpSmoothIntersectionShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OpSmoothIntersection.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const OpSmoothIntersectionShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? OpSmoothIntersectionShaderityObjectGLSL_ : undefined;
const OpSmoothIntersectionShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? OpSmoothIntersectionShaderityObjectWGSL_ : undefined;

/**
 * A shader node that intersects two distance values with a smooth transition.
 */
export class OpSmoothIntersectionShaderNode extends AbstractShaderNode {
  constructor() {
    super('opSmoothIntersection', {
      codeGLSL: OpSmoothIntersectionShaderityObjectGLSL.code,
      codeWGSL: OpSmoothIntersectionShaderityObjectWGSL.code,
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
