import FlatShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/FlatShader.glsl';
import FlatShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/FlatShader.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs flat shading operations.
 * @example
 * ```typescript
 * // Create an flat node for Vec3 float operations
 * const flatNode = new FlatShaderNode();
 *
 * // Connect inputs and get output
 * const outputSocket = flatNode.getSocketOutput();
 * ```
 */
export class FlatShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AddShaderNode with the specified composition and component types.
   */
  constructor() {
    super('flatShader', {
      codeGLSL: FlatShaderityObjectGLSL.code,
      codeWGSL: FlatShaderityObjectWGSL.code,
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
