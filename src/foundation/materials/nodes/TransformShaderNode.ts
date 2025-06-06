import { CompositionType } from '../../definitions/CompositionType';
import MultiplyShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Transform.glsl';
import MultiplyShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Transform.wgsl';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

/**
 * A shader node that performs matrix-vector transformation operations.
 * This node multiplies a matrix (left-hand side) with a vector (right-hand side)
 * to produce a transformed vector output. Supports Mat2x2*Vec2, Mat3x3*Vec3, and Mat4x4*Vec4 operations.
 */
export class TransformShaderNode extends AbstractShaderNode {
  /**
   * Creates a new TransformShaderNode instance.
   *
   * @param lhsCompositionType - The composition type of the left-hand side operand (matrix)
   * @param lhsComponentType - The component type of the left-hand side operand
   * @param rhsCompositionType - The composition type of the right-hand side operand (vector)
   * @param rhsComponentType - The component type of the right-hand side operand
   *
   * @throws {Error} When unsupported matrix-vector combinations are provided
   */
  constructor(
    lhsCompositionType: CompositionTypeEnum,
    lhsComponentType: ComponentTypeEnum,
    rhsCompositionType: CompositionTypeEnum,
    rhsComponentType: ComponentTypeEnum
  ) {
    super('transform', {
      codeGLSL: MultiplyShaderityObjectGLSL.code,
      codeWGSL: MultiplyShaderityObjectWGSL.code,
    });

    /**
     * Determines the output composition type based on input matrix and vector types.
     * - Mat4 * Vec4 = Vec4
     * - Mat3 * Vec3 = Vec3
     * - Mat2 * Vec2 = Vec2
     */
    let outValueCompositionType: CompositionTypeEnum = CompositionType.Unknown;
    if (lhsCompositionType === CompositionType.Mat4 && rhsCompositionType === CompositionType.Vec4) {
      outValueCompositionType = CompositionType.Vec4;
    } else if (lhsCompositionType === CompositionType.Mat3 && rhsCompositionType === CompositionType.Vec3) {
      outValueCompositionType = CompositionType.Vec3;
    } else if (lhsCompositionType === CompositionType.Mat2 && rhsCompositionType === CompositionType.Vec2) {
      outValueCompositionType = CompositionType.Vec2;
    }
    this.__inputs.push({
      compositionType: lhsCompositionType,
      componentType: lhsComponentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: rhsCompositionType,
      componentType: rhsComponentType,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: outValueCompositionType,
      componentType: lhsComponentType,
      name: 'outValue',
    });
  }

  /**
   * Gets the appropriate shader function name derivative based on the current process approach.
   * For WebGPU, returns a specific function name based on matrix and vector dimensions.
   * For other approaches, returns the base shader function name.
   *
   * @returns The shader function name to use for this transformation
   * @throws {Error} When the matrix-vector combination is not implemented for WebGPU
   */
  getShaderFunctionNameDerivative(): string {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (
        this.__inputs[0].compositionType === CompositionType.Mat2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return this.__shaderFunctionName + 'Mat2x2fVec2f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return this.__shaderFunctionName + 'Mat3x3fVec3f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat4 &&
        this.__inputs[1].compositionType === CompositionType.Vec4
      ) {
        return this.__shaderFunctionName + 'Mat4x4fVec4f';
      } else {
        throw new Error('Not implemented');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
