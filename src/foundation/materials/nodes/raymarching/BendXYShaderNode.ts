import BendXYShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendXY.glsl';
import BendXYShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendXY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const BendXYShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? BendXYShaderityObjectGLSL_ : undefined;
const BendXYShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? BendXYShaderityObjectWGSL_ : undefined;

/**
 * A domain node that bends the position in the XY plane.
 * The rotation angle grows with the position's X coordinate and the strength.
 */
export class BendXYShaderNode extends AbstractShaderNode {
  constructor() {
    super('bendXY', {
      codeGLSL: BendXYShaderityObjectGLSL.code,
      codeWGSL: BendXYShaderityObjectWGSL.code,
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
