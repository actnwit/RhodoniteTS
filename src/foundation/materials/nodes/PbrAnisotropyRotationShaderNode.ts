import PbrAnisotropyRotationShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrAnisotropyRotation.glsl';
import PbrAnisotropyRotationShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrAnisotropyRotation.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR anisotropy rotation operations.
 * @example
 * ```typescript
 * // Create an PBR anisotropy rotation node for Vec2 float operations
 * const pbrAnisotropyRotationShaderNode = new PbrAnisotropyRotationShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrAnisotropyRotationShaderNode.getSocketOutput();
 * ```
 */
export class PbrAnisotropyRotationShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrAnisotropyRotationShaderNode with the specified composition and component types.
   */
  constructor() {
    super('pbrAnisotropyRotation', {
      codeGLSL: PbrAnisotropyRotationShaderityObjectGLSL.code,
      codeWGSL: PbrAnisotropyRotationShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('anisotropyRotation', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__outputs.push(
      new Socket('outAnisotropyRotation', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(1, 0))
    );
  }

  /**
   * Gets the output socket that contains the result of the anisotropy rotation operation.
   *
   * @returns The output socket containing the anisotropy rotation result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
