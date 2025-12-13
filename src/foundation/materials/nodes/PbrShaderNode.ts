import PbrShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/PbrShader.glsl';
import PbrShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/PbrShader.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs PBR shading operations.
 * @example
 * ```typescript
 * // Create an PBR node for Vec3 float operations
 * const pbrNode = new PbrShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = pbrNode.getSocketOutput();
 * ```
 */
export class PbrShaderNode extends AbstractShaderNode {
  /**
   * Creates a new PbrShaderNode with the specified composition and component types.
   */
  constructor() {
    super('pbrShader', {
      codeGLSL: PbrShaderityObjectGLSL.code,
      codeWGSL: PbrShaderityObjectWGSL.code,
    });

    this.__inputs.push(
      new Socket('vertexColor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('diffuseColorFactor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('diffuseTextureColor', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(1, 1, 1, 1))
    );
    this.__inputs.push(
      new Socket('shadingModel', CompositionType.Scalar, ComponentType.UnsignedInt, Scalar.fromCopyNumber(2))
    );
    this.__inputs.push(
      new Socket('shininess', CompositionType.Scalar, ComponentType.Float, Scalar.fromCopyNumber(10.0))
    );
    this.__inputs.push(
      new Socket('positionInWorld', CompositionType.Vec4, ComponentType.Float, Vector4.fromCopy4(0, 0, 0, 1))
    );
    this.__inputs.push(
      new Socket('normalInWorld', CompositionType.Vec3, ComponentType.Float, Vector3.fromCopy3(0, 0, 1))
    );
    this.__outputs.push(new Socket('outColor', CompositionType.Vec4, ComponentType.Float));
  }

  /**
   * Gets the output socket that contains the result of the addition operation.
   *
   * @returns The output socket containing the addition result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
