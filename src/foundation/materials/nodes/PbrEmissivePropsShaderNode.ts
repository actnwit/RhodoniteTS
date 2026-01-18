import PbrEmissivePropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrEmissiveProps.glsl';
import PbrEmissivePropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrEmissiveProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR emissive properties operations.
 * @example
 * ```typescript
 * // Create an PBR emissive props node for Vec4 float operations
 * const pbrEmissivePropsNode = new PbrEmissivePropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrEmissivePropsNode.getSocketOutput();
 * ```
 */
export class PbrEmissivePropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrEmissivePropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrEmissiveProps', {
      codeGLSL: PbrEmissivePropsShaderityObjectGLSL.code,
      codeWGSL: PbrEmissivePropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('emissiveFactor', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 0))
    );
    this.__inputs.push(
      new Socket('emissiveTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('emissiveStrength', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1))
    );
    this.__outputs.push(new Socket('outEmissiveProps', CompositionType.EmissiveProps, ComponentType.Unknown));
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
