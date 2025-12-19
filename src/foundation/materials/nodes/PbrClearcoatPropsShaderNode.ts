import PbrClearcoatPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrClearcoatProps.glsl';
import PbrClearcoatPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrClearcoatProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Matrix33, Vector3 } from '../../math';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR clearcoat properties operations.
 * @example
 * ```typescript
 * // Create an PBR clearcoat props node for Vec4 float operations
 * const pbrClearcoatPropsNode = new PbrClearcoatPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrClearcoatPropsNode.getSocketOutput();
 * ```
 */
export class PbrClearcoatPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrClearcoatPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrClearcoatProps', {
      codeGLSL: PbrClearcoatPropsShaderityObjectGLSL.code,
      codeWGSL: PbrClearcoatPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('clearcoatFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('clearcoatTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('clearcoatRoughnessFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('clearcoatRoughnessTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('clearcoatNormalTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0.5, 0.5, 1, 1))
    );
    this.__inputs.push(new Socket('TBN', CompositionType.Mat3, ComponentType.Float, Matrix33.identity() as Matrix33));
    this.__inputs.push(
      new Socket('positionInWorld', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0, 0, 0, 1))
    );
    this.__inputs.push(new Socket('ior', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1.5)));
    this.__outputs.push(new Socket('outColor', CompositionType.Vec4, ComponentType.Float));
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
