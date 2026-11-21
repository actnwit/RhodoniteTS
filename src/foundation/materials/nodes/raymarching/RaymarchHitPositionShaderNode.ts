import RaymarchHitPositionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchHitPosition.glsl';
import RaymarchHitPositionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchHitPosition.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector4 } from '../../../math/Vector4';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that outputs the world position of the raymarching hit point.
 *
 * The value is only meaningful in the raymarching shading section (the nodes
 * reachable from an OutShadingColor node), which runs once for each hit fragment.
 */
export class RaymarchHitPositionShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchHitPosition', {
      codeGLSL: RaymarchHitPositionShaderityObjectGLSL.code,
      codeWGSL: RaymarchHitPositionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outPosition', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0.0, 0.0, 0.0, 1.0))
    );
  }

  /**
   * Gets the output socket that contains the hit position in world space.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
