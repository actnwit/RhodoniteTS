import RaymarchRayDirectionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchRayDirection.glsl';
import RaymarchRayDirectionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchRayDirection.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that outputs the world-space direction of the ray at the hit point.
 * Only meaningful in the raymarching shading section.
 */
export class RaymarchRayDirectionShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchRayDirection', {
      codeGLSL: RaymarchRayDirectionShaderityObjectGLSL.code,
      codeWGSL: RaymarchRayDirectionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outValue', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, -1.0))
    );
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
