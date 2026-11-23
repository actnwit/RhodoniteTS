import BendXYShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/BendXY.glsl';
import BendXYShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/BendXY.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

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
