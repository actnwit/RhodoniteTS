import SdTorusShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdTorus.glsl';
import SdTorusShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdTorus.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a torus around the Y axis.
 * `radius` is the distance from the center to the center of the tube and
 * `tubeRadius` is the radius of the tube itself.
 */
export class SdTorusShaderNode extends AbstractShaderNode {
  constructor() {
    super('sdTorus', {
      codeGLSL: SdTorusShaderityObjectGLSL.code,
      codeWGSL: SdTorusShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(new Socket('radius', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0)));
    this.__inputs.push(
      new Socket('tubeRadius', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.25))
    );
    this.__outputs.push(
      new Socket('outDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }
}
