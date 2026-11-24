import BendZYShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendZY.glsl';
import BendZYShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendZY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const BendZYShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? BendZYShaderityObjectGLSL_ : undefined;
const BendZYShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? BendZYShaderityObjectWGSL_ : undefined;

/**
 * A domain node that bends the position in the ZY plane.
 * The rotation angle grows with the position's Z coordinate and the strength.
 */
export class BendZYShaderNode extends AbstractShaderNode {
  constructor() {
    super('bendZY', {
      codeGLSL: BendZYShaderityObjectGLSL.code,
      codeWGSL: BendZYShaderityObjectWGSL.code,
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
