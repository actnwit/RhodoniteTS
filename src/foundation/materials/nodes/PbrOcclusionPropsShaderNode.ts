import PbrOcclusionPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrOcclusionProps.glsl';
import PbrOcclusionPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrOcclusionProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR occlusion properties operations.
 * @example
 * ```typescript
 * // Create an PBR occlusion props node for Vec4 float operations
 * const pbrOcclusionPropsNode = new PbrOcclusionPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrOcclusionPropsNode.getSocketOutput();
 * ```
 */
export class PbrOcclusionPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrOcclusionPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrOcclusionProps', {
      codeGLSL: PbrOcclusionPropsShaderityObjectGLSL.code,
      codeWGSL: PbrOcclusionPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('occlusionTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('occlusionStrength', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1))
    );
    this.__outputs.push(new Socket('outOcclusionProps', CompositionType.OcclusionProps, ComponentType.Unknown));
  }

  /**
   * Gets the output socket that contains the result of the PBR shading operation.
   *
   * @returns The output socket containing the PBR shading result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
