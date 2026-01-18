import PbrAnisotropyPropsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrAnisotropyProps.glsl';
import PbrAnisotropyPropsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrAnisotropyProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR anisotropy properties operations.
 * @example
 * ```typescript
 * // Create an PBR anisotropy props node for Vec3 float operations
 * const pbrAnisotropyPropsShaderNode = new PbrAnisotropyPropsShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrAnisotropyPropsShaderNode.getSocketOutput();
 * ```
 */
export class PbrAnisotropyPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrAnisotropyPropsShaderNode with the specified composition and component types.
   */
  constructor() {
    super('pbrAnisotropyProps', {
      codeGLSL: PbrAnisotropyPropsShaderityObjectGLSL.code,
      codeWGSL: PbrAnisotropyPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('anisotropyStrength', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(0))
    );
    this.__inputs.push(
      new Socket('anisotropyRotation', CompositionType.Vec2, ComponentType.Float, Vector2.fromCopy2(1, 0))
    );
    this.__inputs.push(
      new Socket('anisotropyTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__outputs.push(new Socket('outAnisotropyProps', CompositionType.AnisotropyProps, ComponentType.Unknown));
  }

  /**
   * Gets the output socket that contains the result of the anisotropy properties operation.
   *
   * @returns The output socket containing the anisotropy properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
