import RaymarchHitDistanceShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchHitDistance.glsl';
import RaymarchHitDistanceShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchHitDistance.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that outputs the distance from the camera to the hit point.
 * Only meaningful in the raymarching shading section.
 */
export class RaymarchHitDistanceShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchHitDistance', {
      codeGLSL: RaymarchHitDistanceShaderityObjectGLSL.code,
      codeWGSL: RaymarchHitDistanceShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(new Socket('outValue', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0)));
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
