import PbrDiffuseTransmissionPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrDiffuseTransmissionProps.glsl';
import PbrDiffuseTransmissionPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrDiffuseTransmissionProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR diffuse transmission properties operations.
 * @example
 * ```typescript
 * // Create an PBR diffuse transmission props node for Scalar float operations
 * const pbrDiffuseTransmissionPropsShaderNode = new PbrDiffuseTransmissionPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrDiffuseTransmissionPropsShaderNode.getSocketOutput();
 * ```
 */
export class PbrDiffuseTransmissionPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrDiffuseTransmissionPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrDiffuseTransmissionProps', {
      codeGLSL: PbrDiffuseTransmissionPropsShaderityObjectGLSL.code,
      codeWGSL: PbrDiffuseTransmissionPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('diffuseTransmissionFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('diffuseTransmissionTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket(
        'diffuseTransmissionColorFactor',
        CompositionType.Vec3,
        ComponentType.Float,
        Vector3.fromCopy3(1, 1, 1)
      )
    );
    this.__inputs.push(
      new Socket(
        'diffuseTransmissionColorTexture',
        CompositionType.Vec4,
        ComponentType.Float,
        Vector4.fromCopy4(1, 1, 1, 1)
      )
    );
    this.__outputs.push(
      new Socket('outDiffuseTransmissionProps', CompositionType.DiffuseTransmissionProps, ComponentType.Unknown)
    );
  }

  /**
   * Gets the output socket that contains the result of the diffuse transmission properties operation.
   *
   * @returns The output socket containing the diffuse transmission properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
