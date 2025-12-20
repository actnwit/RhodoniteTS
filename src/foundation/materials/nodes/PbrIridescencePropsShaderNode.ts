import PbrIridescencePropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrIridescenceProps.glsl';
import PbrIridescencePropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrIridescenceProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Matrix33, Vector3 } from '../../math';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR iridescence properties operations.
 * @example
 * ```typescript
 * // Create an PBR iridescence props node for Vec4 float operations
 * const pbrIridescencePropsNode = new PbrIridescencePropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrIridescencePropsNode.getSocketOutput();
 * ```
 */
export class PbrIridescencePropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrIridescencePropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrIridescenceProps', {
      codeGLSL: PbrIridescencePropsShaderityObjectGLSL.code,
      codeWGSL: PbrIridescencePropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('iridescenceFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('iridescenceTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('iridescenceThicknessMinimum', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(100))
    );
    this.__inputs.push(
      new Socket('iridescenceThicknessMaximum', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(400))
    );
    this.__inputs.push(
      new Socket(
        'iridescenceThicknessTexture',
        CompositionType.Vec4,
        ComponentType.Float,
        Vector4.fromCopy4(1, 1, 1, 1)
      )
    );
    this.__inputs.push(
      new Socket('iridescenceIor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.3))
    );
    this.__inputs.push(new Socket('ior', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.5)));
    this.__inputs.push(
      new Socket('baseColor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('specularProps', CompositionType.SpecularProps, ComponentType.Unknown, {
        specularWeight: Scalar.fromCopyNumber(1.0),
        specularColor: Vector3.fromCopy3(1.0, 1.0, 1.0),
      })
    );
    this.__inputs.push(
      new Socket('positionInWorld', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0, 0, 0, 1))
    );
    this.__inputs.push(
      new Socket('normalInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 1))
    );
    this.__outputs.push(new Socket('outIridescenceProps', CompositionType.IridescenceProps, ComponentType.Float));
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
