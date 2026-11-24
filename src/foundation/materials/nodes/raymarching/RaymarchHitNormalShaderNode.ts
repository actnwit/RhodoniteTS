import RaymarchHitNormalShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchHitNormal.glsl';
import RaymarchHitNormalShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchHitNormal.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const RaymarchHitNormalShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? RaymarchHitNormalShaderityObjectGLSL_ : undefined;
const RaymarchHitNormalShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? RaymarchHitNormalShaderityObjectWGSL_ : undefined;

/**
 * A shader node that outputs the world-space surface normal of the raymarching hit point.
 *
 * The value is only meaningful in the raymarching shading section (the nodes
 * reachable from an OutShadingColor node), which runs once for each hit fragment.
 */
export class RaymarchHitNormalShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchHitNormal', {
      codeGLSL: RaymarchHitNormalShaderityObjectGLSL.code,
      codeWGSL: RaymarchHitNormalShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outNormal', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 1.0))
    );
  }

  /**
   * Gets the output socket that contains the hit normal in world space.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
