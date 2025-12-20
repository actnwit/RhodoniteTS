import PbrMetallicRoughnessPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrMetallicRoughnessProps.glsl';
import PbrMetallicRoughnessPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrMetallicRoughnessProps.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR metallic roughness properties operations.
 * @example
 * ```typescript
 * // Create an PBR metallic roughness props node for Vec4 float operations
 * const pbrMetallicRoughnessPropsNode = new PbrMetallicRoughnessPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrMetallicRoughnessPropsNode.getSocketOutput();
 * ```
 */
export class PbrMetallicRoughnessPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrMetallicRoughnessPropsShaderNode with the specified composition and component types.
   */
  constructor() {
    super('pbrMetallicRoughnessProps', {
      codeGLSL: PbrMetallicRoughnessPropsShaderityObjectGLSL.code,
      codeWGSL: PbrMetallicRoughnessPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('metallicFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1))
    );
    this.__inputs.push(
      new Socket('roughnessFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1))
    );
    this.__inputs.push(
      new Socket('metallicRoughnessTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__outputs.push(new Socket('outMetallic', CompositionType.Scalar, ComponentType.Float));
    this.__outputs.push(new Socket('outRoughness', CompositionType.Scalar, ComponentType.Float));
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
