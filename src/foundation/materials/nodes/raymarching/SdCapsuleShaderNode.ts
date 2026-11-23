import SdCapsuleShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdCapsule.glsl';
import SdCapsuleShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdCapsule.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a capsule.
 * The capsule is the set of points within `radius` of the line segment
 * from `pointA` to `pointB`.
 */
export class SdCapsuleShaderNode extends AbstractShaderNode {
  constructor() {
    super('sdCapsule', {
      codeGLSL: SdCapsuleShaderityObjectGLSL.code,
      codeWGSL: SdCapsuleShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('position', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
    this.__inputs.push(
      new Socket('pointA', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, -0.5, 0.0))
    );
    this.__inputs.push(
      new Socket('pointB', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.5, 0.0))
    );
    this.__inputs.push(new Socket('radius', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.5)));
    this.__outputs.push(
      new Socket('outDistance', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0.0))
    );
  }
}
