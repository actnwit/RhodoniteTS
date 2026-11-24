import TwistYShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/TwistY.glsl';
import TwistYShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/TwistY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const TwistYShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? TwistYShaderityObjectGLSL_ : undefined;
const TwistYShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? TwistYShaderityObjectWGSL_ : undefined;

/**
 * A domain node that twists the position around the Y axis.
 * The rotation angle grows with the position's Y coordinate and the strength.
 */
export class TwistYShaderNode extends AbstractShaderNode {
  constructor() {
    super('twistY', {
      codeGLSL: TwistYShaderityObjectGLSL.code,
      codeWGSL: TwistYShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('strength', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.5)));
    this.__outputs.push(new Socket('outPosition', CompositionType.Vec3, ComponentType.Float));
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
