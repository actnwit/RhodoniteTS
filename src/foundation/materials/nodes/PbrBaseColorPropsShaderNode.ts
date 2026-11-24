import PbrBaseColorPropsShaderityObjectGLSL_ from '../../../webgl/shaderity_shaders/nodes/PbrBaseColorProps.glsl';
import PbrBaseColorPropsShaderityObjectWGSL_ from '../../../webgpu/shaderity_shaders/nodes/PbrBaseColorProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const PbrBaseColorPropsShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PbrBaseColorPropsShaderityObjectGLSL_ : undefined;
const PbrBaseColorPropsShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PbrBaseColorPropsShaderityObjectWGSL_ : undefined;

/**
 * A shader node that performs PBR base color properties operations.
 * @example
 * ```typescript
 * // Create an PBR base color props node for Vec4 float operations
 * const pbrBaseColorPropsNode = new PbrBaseColorPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrBaseColorPropsNode.getSocketOutput();
 * ```
 */
export class PbrBaseColorPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrBaseColorPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrBaseColorProps', {
      codeGLSL: PbrBaseColorPropsShaderityObjectGLSL.code,
      codeWGSL: PbrBaseColorPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('vertexColor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('baseColorFactor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('baseColorTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
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
