import { ComponentType, type ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import MultiplyShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Multiply.glsl';
import MultiplyShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Multiply.wgsl';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that performs multiplication operations between two inputs.
 * Supports various data types including scalars, vectors, and matrices for both WebGL and WebGPU.
 *
 * @example
 * ```typescript
 * // Create a multiplication node for two Vec3 float values
 * const multiplyNode = new MultiplyShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export class MultiplyShaderNode extends AbstractShaderNode {
  /**
   * Creates a new MultiplyShaderNode instance.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4) for both inputs and output
   * @param componentType - The component type (Float, Int, etc.) for both inputs and output
   *
   * @remarks
   * The node will have two inputs ('lhs' and 'rhs') and one output ('outValue'),
   * all sharing the same composition and component types.
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('multiply', {
      codeGLSL: MultiplyShaderityObjectGLSL.code,
      codeWGSL: MultiplyShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'outValue',
    });
  }

  /**
   * Gets the platform-specific shader function name for the multiplication operation.
   *
   * @returns The appropriate shader function name based on the current process approach and input types
   *
   * @throws {Error} Throws an error if the combination of composition and component types is not implemented
   *
   * @remarks
   * For WebGPU, returns type-specific function names (e.g., 'multiplyF32F32', 'multiplyVec3fVec3f').
   * For WebGL, returns the generic function name 'multiply'.
   *
   * Supported WebGPU type combinations:
   * - Scalar: Float-Float (F32F32), Int-Int (I32I32)
   * - Vec2, Vec3, Vec4: Float vectors
   * - Mat2, Mat3, Mat4: Float matrices
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (
        this.__inputs[0].compositionType === CompositionType.Scalar &&
        this.__inputs[1].compositionType === CompositionType.Scalar
      ) {
        if (
          this.__inputs[0].componentType === ComponentType.Float &&
          this.__inputs[1].componentType === ComponentType.Float
        ) {
          return `${this.__shaderFunctionName}F32F32`;
        }
        if (
          this.__inputs[0].componentType === ComponentType.Int &&
          this.__inputs[1].componentType === ComponentType.Int
        ) {
          return `${this.__shaderFunctionName}I32I32`;
        }
        throw new Error('Not implemented');
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return `${this.__shaderFunctionName}Vec2fVec2f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return `${this.__shaderFunctionName}Vec3fVec3f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec4 &&
        this.__inputs[1].compositionType === CompositionType.Vec4
      ) {
        return `${this.__shaderFunctionName}Vec4fVec4f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Mat2 &&
        this.__inputs[1].compositionType === CompositionType.Mat2
      ) {
        return `${this.__shaderFunctionName}Mat2x2fMat2x2f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Mat3 &&
        this.__inputs[1].compositionType === CompositionType.Mat3
      ) {
        return `${this.__shaderFunctionName}Mat3x3fMat3x3f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Mat4 &&
        this.__inputs[1].compositionType === CompositionType.Mat4
      ) {
        return `${this.__shaderFunctionName}Mat4x4fMat4x4f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}
