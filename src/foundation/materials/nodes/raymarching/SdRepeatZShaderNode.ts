import SdRepeatZShaderityObjectGLSL_ from '../../../../webgl/shaderity_shaders/nodes/raymarching/SdRepeatZ.glsl';
import SdRepeatZShaderityObjectWGSL_ from '../../../../webgpu/shaderity_shaders/nodes/raymarching/SdRepeatZ.wgsl';
import { ComponentType } from '../../../definitions/ComponentType';
import { CompositionType } from '../../../definitions/CompositionType';
import { Scalar } from '../../../math/Scalar';
import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const SdRepeatZShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? SdRepeatZShaderityObjectGLSL_ : undefined;
const SdRepeatZShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? SdRepeatZShaderityObjectWGSL_ : undefined;

/**
 * A shader node that repeats a distance function along the Z plane.
 *
 * @example
 * ```typescript
 * // Create a repeat node along the Z plane
 * const repeatNode = new SdRepeatZShaderNode();
 * ```
 */
export class SdRepeatZShaderNode extends AbstractShaderNode {
  /**
   * Creates a new SdRepeatZShaderNode.
   *
   */
  constructor() {
    super('sdRepeatZ', {
      codeGLSL: SdRepeatZShaderityObjectGLSL.code,
      codeWGSL: SdRepeatZShaderityObjectWGSL.code,
    });

    this.setShaderStage('Fragment');

    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('interval', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0)));
    this.__outputs.push(new Socket('outPosition', CompositionType.Vec3, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the subtraction operation.
   *
   * @returns The output socket containing the subtraction result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
