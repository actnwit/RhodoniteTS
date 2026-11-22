import OutShadingColorShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/OutShadingColor.glsl';
import OutShadingColorShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/OutShadingColor.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector4 } from '../../../math/Vector4';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * Terminal node of the raymarching shading section.
 *
 * Nodes reachable from this node are emitted in a separate shading function that
 * runs once per hit fragment (with the hit position and normal available through
 * the RaymarchHitPosition / RaymarchHitNormal nodes), instead of inside the
 * distance function `map()`, which is evaluated many times per pixel.
 */
export class OutShadingColorShaderNode extends AbstractShaderNode {
  constructor() {
    super('outShadingColor', {
      codeGLSL: OutShadingColorShaderityObjectGLSL.code,
      codeWGSL: OutShadingColorShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(
      new Socket('value', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0.0, 0.0, 0.0, 1.0))
    );
  }

  /**
   * Gets the input socket that accepts the shading color (linear space).
   */
  getSocketInput() {
    return this.__inputs[0];
  }
}
