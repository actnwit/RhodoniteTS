import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import DotProductShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/DotProduct.glsl';
import DotProductShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/DotProduct.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { EngineState } from '../../system/EngineState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that performs dot product operations between two vectors.
 * This node computes the dot product of two input vectors and returns a scalar result.
 *
 * The dot product is calculated as the sum of the products of corresponding components
 * of the two input vectors. This is commonly used in graphics programming for lighting
 * calculations, vector projections, and angle computations.
 *
 * @example
 * ```typescript
 * const dotProductNode = new DotProductShaderNode(CompositionType.Vec3, ComponentType.Float);
 * // This creates a node that computes dot product of two Vec3 inputs
 * ```
 */
export class DotProductShaderNode extends AbstractShaderNode {
  /**
   * Creates a new DotProductShaderNode instance.
   *
   * @param compositionType - The composition type of the input vectors (Vec2, Vec3, or Vec4)
   * @param componentType - The component type of the vector elements (typically Float)
   *
   * @remarks
   * The node sets up two inputs:
   * - `lhs`: Left-hand side vector with the specified composition and component type
   * - `rhs`: Right-hand side vector with the same composition type but Float component type
   *
   * The output is a scalar value with the same component type as the left-hand side input.
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('dotProduct', {
      codeGLSL: DotProductShaderityObjectGLSL.code,
      codeWGSL: DotProductShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: compositionType,
      componentType: ComponentType.Float,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'outValue',
    });
  }

  /**
   * Gets the appropriate shader function name based on the current process approach and input composition type.
   *
   * @returns The shader function name to be used in the generated shader code
   *
   * @throws {Error} Throws an error if the composition type is not supported
   *
   * @remarks
   * For WebGPU, this method returns type-specific function names:
   * - Vec2 inputs: "dotProductVec2f"
   * - Vec3 inputs: "dotProductVec3f"
   * - Vec4 inputs: "dotProductVec4f"
   *
   * For other process approaches (like WebGL), it returns the base shader function name.
   *
   * @example
   * ```typescript
   * const functionName = dotProductNode.getShaderFunctionNameDerivative();
   * // Returns "dotProductVec3f" for Vec3 inputs in WebGPU context
   * ```
   */
  getShaderFunctionNameDerivative(): string {
    if (EngineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return `${this.__shaderFunctionName}Vec2f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return `${this.__shaderFunctionName}Vec3f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return `${this.__shaderFunctionName}Vec4f`;
      }
      throw new Error('Not supported composition type.');
    }
    return this.__shaderFunctionName;
  }
}
