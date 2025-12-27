import SdSphereShaderityObjectGLSL from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdSphere.glsl';
import SdSphereShaderityObjectWGSL from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdSphere.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

/**
 * A shader node that computes the signed distance function of a sphere.
 * This node accepts a position and outputs the signed distance to the sphere.
 *
 * @example
 * ```typescript
 * // Create a sphere node
 * const sphereNode = new SdSphereShaderNode();
 * ```
 */
export class SdSphereShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdSphereShaderNode instance.
   */
  constructor() {
    super('sdSphere', {
      codeGLSL: SdSphereShaderityObjectGLSL.code,
      codeWGSL: SdSphereShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('radius', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outDistance', CompositionType.Scalar, ComponentType.Float));
  }
}
