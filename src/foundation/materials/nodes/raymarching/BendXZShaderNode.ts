import BendXZShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendXZ.glsl';
import BendXZShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendXZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const BendXZShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? BendXZShaderityObjectGLSL_ : undefined;
const BendXZShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? BendXZShaderityObjectWGSL_ : undefined;

/**
 * A domain node that bends the position in the XZ plane.
 * The rotation angle grows with the position's X coordinate and the strength.
 */
export class BendXZShaderNode extends AbstractShaderNode {
  constructor() {
    super('bendXZ', {
      codeGLSL: BendXZShaderityObjectGLSL.code,
      codeWGSL: BendXZShaderityObjectWGSL.code,
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
