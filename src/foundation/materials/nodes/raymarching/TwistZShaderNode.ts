import TwistZShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/TwistZ.glsl';
import TwistZShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/TwistZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const TwistZShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? TwistZShaderityObjectGLSL_ : undefined;
const TwistZShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? TwistZShaderityObjectWGSL_ : undefined;

/**
 * A domain node that twists the position around the Z axis.
 * The rotation angle grows with the position's Z coordinate and the strength.
 */
export class TwistZShaderNode extends AbstractShaderNode {
  constructor() {
    super('twistZ', {
      codeGLSL: TwistZShaderityObjectGLSL.code,
      codeWGSL: TwistZShaderityObjectWGSL.code,
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
