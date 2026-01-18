import PbrNormalPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrNormalProps.glsl';
import PbrNormalPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrNormalProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR normal properties operations.
 * @example
 * ```typescript
 * // Create an PBR normal props node for Vec3 float operations
 * const pbrNormalPropsNode = new PbrNormalPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrNormalPropsNode.getSocketOutput();
 * ```
 */
export class PbrNormalPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrNormalPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrNormalProps', {
      codeGLSL: PbrNormalPropsShaderityObjectGLSL.code,
      codeWGSL: PbrNormalPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('positionInWorld', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0, 0, 0, 1))
    );
    this.__inputs.push(
      new Socket('normalInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 1))
    );
    this.__inputs.push(
      new Socket('tangentInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1, 0, 0))
    );
    this.__inputs.push(
      new Socket('bitangentInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 1, 0))
    );
    this.__inputs.push(
      new Socket('normalTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0.5, 0.5, 1.0, 1))
    );
    this.__inputs.push(new Socket('normalTexUv', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(0, 0)));
    this.__inputs.push(
      new Socket('normalScale', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.0))
    );
    this.__outputs.push(new Socket('outNormalInWorld', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('outGeomNormalInWorld', CompositionType.Vec3, ComponentType.Float));
    this.__outputs.push(new Socket('outTBN', CompositionType.Mat3, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the PBR normal properties operation.
   *
   * @returns The output socket containing the PBR normal properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
