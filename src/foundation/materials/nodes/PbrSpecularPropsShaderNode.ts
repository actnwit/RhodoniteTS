import PbrSpecularPropsShaderityObjectGLSL_ from '../../../webgl/shaderity_shaders/nodes/PbrSpecularProps.glsl';
import PbrSpecularPropsShaderityObjectWGSL_ from '../../../webgpu/shaderity_shaders/nodes/PbrSpecularProps.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const PbrSpecularPropsShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? PbrSpecularPropsShaderityObjectGLSL_ : undefined;
const PbrSpecularPropsShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? PbrSpecularPropsShaderityObjectWGSL_ : undefined;

/**
 * A shader node that performs PBR specular properties operations.
 * @example
 * ```typescript
 * // Create an PBR node for Vec3 float operations
 * const pbrSpecularPropsNode = new PbrSpecularPropsNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrSpecularPropsNode.getSocketOutput();
 * ```
 */
export class PbrSpecularPropsShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrSpecularPropsNode with the specified composition and component types.
   */
  constructor() {
    super('pbrSpecularProps', {
      codeGLSL: PbrSpecularPropsShaderityObjectGLSL.code,
      codeWGSL: PbrSpecularPropsShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('specularFactor', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(1))
    );
    this.__inputs.push(
      new Socket('specularTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('specularColorFactor', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(1, 1, 1))
    );
    this.__inputs.push(
      new Socket('specularColorTexture', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__outputs.push(new Socket('outSpecularProps', CompositionType.SpecularProps, ComponentType.Unknown));
  }

  /**
   * Gets the output socket that contains the result of the specular properties operation.
   *
   * @returns The output socket containing the specular properties result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
