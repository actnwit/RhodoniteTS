import RaymarchCameraPositionShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/RaymarchCameraPosition.glsl';
import RaymarchCameraPositionShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/RaymarchCameraPosition.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Vector3 } from '../../../math/Vector3';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that outputs the world-space camera position.
 * Only meaningful in the raymarching shading section.
 */
export class RaymarchCameraPositionShaderNode extends AbstractShaderNode {
  constructor() {
    super('raymarchCameraPosition', {
      codeGLSL: RaymarchCameraPositionShaderityObjectGLSL.code,
      codeWGSL: RaymarchCameraPositionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__outputs.push(
      new Socket('outValue', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0.0, 0.0, 0.0))
    );
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
