import SdRoundBoxShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRoundBox.glsl';
import SdRoundBoxShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRoundBox.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a box with rounded corners.
 * `size` is the half extent of the box and `radius` is the rounding radius.
 */
export class SdRoundBoxShaderNode extends AbstractShaderNode {
  constructor() {
    super('sdRoundBox', {
      codeGLSL: SdRoundBoxShaderityObjectGLSL.code,
      codeWGSL: SdRoundBoxShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(new Socket('size', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1.0, 1.0, 1.0)));
    this.__inputs.push(new Socket('radius', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.25)));
    this.__outputs.push(
      new Socket('outDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }
}
