import BendZXShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendZX.glsl';
import BendZXShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendZX.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const BendZXShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? BendZXShaderityObjectGLSL_ : undefined;
const BendZXShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? BendZXShaderityObjectWGSL_ : undefined;

/**
 * A domain node that bends the position in the ZX plane.
 * The rotation angle grows with the position's Z coordinate and the strength.
 */
export class BendZXShaderNode extends AbstractShaderNode {
  constructor() {
    super('bendZX', {
      codeGLSL: BendZXShaderityObjectGLSL.code,
      codeWGSL: BendZXShaderityObjectWGSL.code,
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
