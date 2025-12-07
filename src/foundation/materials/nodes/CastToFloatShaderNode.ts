import CastToFloatShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/CastToFloat.glsl';
import CastToFloatShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/CastToFloat.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that casts bool, int, or uint types to float.
 * Supports scalar and vector types (Vec2, Vec3, Vec4).
 *
 * This node is useful for converting integer-based data (like joint indices)
 * to floating-point values for use in shader calculations.
 *
 * @example
 * ```typescript
 * const castNode = new CastToFloatShaderNode(CompositionType.Vec4, ComponentType.UnsignedInt);
 * // Converts uvec4 to vec4<float>
 * ```
 */
export class CastToFloatShaderNode extends AbstractShaderNode {
  private __inputComponentType: ComponentTypeEnum;
  private __compositionType: CompositionTypeEnum;

  /**
   * Creates a new CastToFloatShaderNode instance.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
   * @param inputComponentType - The input component type (Bool, Int, or UnsignedInt)
   */
  constructor(compositionType: CompositionTypeEnum, inputComponentType: ComponentTypeEnum) {
    super('castToFloat', {
      codeGLSL: CastToFloatShaderityObjectGLSL.code,
      codeWGSL: CastToFloatShaderityObjectWGSL.code,
    });

    this.__inputComponentType = inputComponentType;
    this.__compositionType = compositionType;

    this.__inputs.push({
      compositionType: compositionType,
      componentType: inputComponentType,
      name: 'value',
    });

    this.__outputs.push({
      compositionType: compositionType,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }

  /**
   * Gets the derivative shader function name based on the current process approach,
   * composition type, and input component type.
   *
   * For WebGPU, it generates specialized function names like:
   * - castToFloatBoolScalar, castToFloatIntScalar, castToFloatUintScalar
   * - castToFloatBoolVec2, castToFloatIntVec2, castToFloatUintVec2
   * - etc.
   *
   * For WebGL, it returns the base function name (uses GLSL function overloading).
   *
   * @param engine - The engine instance
   * @returns The appropriate shader function name for the current context
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let typeSuffix = '';
      if (this.__inputComponentType === ComponentType.Bool) {
        typeSuffix = 'Bool';
      } else if (this.__inputComponentType === ComponentType.Int) {
        typeSuffix = 'Int';
      } else if (this.__inputComponentType === ComponentType.UnsignedInt) {
        typeSuffix = 'Uint';
      }

      let vecSuffix = '';
      if (this.__compositionType === CompositionType.Scalar) {
        vecSuffix = 'Scalar';
      } else if (this.__compositionType === CompositionType.Vec2) {
        vecSuffix = 'Vec2';
      } else if (this.__compositionType === CompositionType.Vec3) {
        vecSuffix = 'Vec3';
      } else if (this.__compositionType === CompositionType.Vec4) {
        vecSuffix = 'Vec4';
      }

      return `${this.__shaderFunctionName}${typeSuffix}${vecSuffix}`;
    }
    return this.__shaderFunctionName;
  }
}
