import TwistXShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/TwistX.glsl';
import TwistXShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/TwistX.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A domain node that twists the position around the X axis.
 * The rotation angle grows with the position's X coordinate and the strength.
 */
export class TwistXShaderNode extends AbstractShaderNode {
  constructor() {
    super('twistX', {
      codeGLSL: TwistXShaderityObjectGLSL.code,
      codeWGSL: TwistXShaderityObjectWGSL.code,
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
