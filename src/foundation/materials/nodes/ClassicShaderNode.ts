import ClassicShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/ClassicShader.glsl';
import ClassicShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/ClassicShader.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { Vector4 } from '../../math/Vector4';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs classic shading operations.
 * @example
 * ```typescript
 * // Create an classic node for Vec3 float operations
 * const classicNode = new ClassicShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = classicNode.getSocketOutput();
 * ```
 */
export class ClassicShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AddShaderNode with the specified composition and component types.
   */
  constructor() {
    super('classicShader', {
      codeGLSL: ClassicShaderityObjectGLSL.code,
      codeWGSL: ClassicShaderityObjectWGSL.code,
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
