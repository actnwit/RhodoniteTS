import BendYZShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendYZ.glsl';
import BendYZShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendYZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const BendYZShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? BendYZShaderityObjectGLSL_ : undefined;
const BendYZShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? BendYZShaderityObjectWGSL_ : undefined;

/**
 * A domain node that bends the position in the YZ plane.
 * The rotation angle grows with the position's Y coordinate and the strength.
 */
export class BendYZShaderNode extends AbstractShaderNode {
  constructor() {
    super('bendYZ', {
      codeGLSL: BendYZShaderityObjectGLSL.code,
      codeWGSL: BendYZShaderityObjectWGSL.code,
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
