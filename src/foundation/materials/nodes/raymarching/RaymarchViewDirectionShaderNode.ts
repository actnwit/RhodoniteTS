import RaymarchViewDirectionShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchViewDirection.glsl';
import RaymarchViewDirectionShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchViewDirection.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const RaymarchViewDirectionShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? RaymarchViewDirectionShaderityObjectGLSL_ : undefined;
const RaymarchViewDirectionShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? RaymarchViewDirectionShaderityObjectWGSL_ : undefined;

/**
 * A shader node that outputs the world-space direction from the hit point to the
 * camera. Only meaningful in the raymarching shading section.
 */
export class RaymarchViewDirectionShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchViewDirection', {
      codeGLSL: RaymarchViewDirectionShaderityObjectGLSL.code,
      codeWGSL: RaymarchViewDirectionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outValue', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 1.0))
    );
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
