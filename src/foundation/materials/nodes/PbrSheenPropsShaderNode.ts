import PbrSheenPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrSheenProps.glsl';
import PbrSheenPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrSheenProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Matrix33, Vector3 } from '../../math';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR sheen properties operations.
 * @example
 * ```typescript
 * // Create an PBR sheen props node for Vec4 float operations
 * const pbrSheenPropsNode = new PbrSheenPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrSheenPropsNode.getSocketOutput();
 * ```
 */
export class PbrSheenPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrSheenPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrSheenProps', {
      codeGLSL: PbrSheenPropsShaderityObjectGLSL.code,
      codeWGSL: PbrSheenPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('sheenColorFactor', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 0))
    );
    this.__inputs.push(
      new Socket('sheenColorTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('sheenRoughnessFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('sheenRoughnessTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__outputs.push(new Socket('outSheenProps', CompositionType.SheenProps, ComponentType.Unknown));
  }

  /**
   * Gets the output socket that contains the result of the PBR sheen properties operation.
   *
   * @returns The output socket containing the PBR sheen properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
