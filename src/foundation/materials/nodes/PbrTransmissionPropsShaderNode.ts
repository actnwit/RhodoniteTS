import PbrTransmissionPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrTransmissionProps.glsl';
import PbrTransmissionPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrTransmissionProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR transmission properties operations.
 * @example
 * ```typescript
 * // Create an PBR transmission props node for Vec4 float operations
 * const pbrTransmissionPropsNode = new PbrTransmissionPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrTransmissionPropsNode.getSocketOutput();
 * ```
 */
export class PbrTransmissionPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrTransmissionPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrTransmissionProps', {
      codeGLSL: PbrTransmissionPropsShaderityObjectGLSL.code,
      codeWGSL: PbrTransmissionPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('transmissionFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('transmissionTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__outputs.push(new Socket('outTransmission', CompositionType.Scalar, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the transmission properties operation.
   *
   * @returns The output socket containing the transmission properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
