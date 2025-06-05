import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../../../foundation/definitions/VertexAttribute';
import { CommonShaderPart } from '../CommonShaderPart';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ComponentTypeEnum, ComponentType } from '../../../foundation/definitions/ComponentType';
import { AttributeNames } from '../../types/CommonTypes';
import { IVector } from '../../../foundation/math/IVector';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { SystemState } from '../../../foundation/system/SystemState';

/**
 * A shader part that generates constant variable functions for both vertex and pixel shaders.
 * This class creates GLSL/WGSL functions that output constant values of specified composition and component types.
 *
 * @example
 * ```typescript
 * const constantShader = new ConstantVariableShader(
 *   'getConstantColor',
 *   CompositionType.Vec3,
 *   ComponentType.Float
 * );
 * constantShader.setConstantValue(Vector3.fromCopyArray([1.0, 0.5, 0.0]));
 * ```
 */
export class ConstantVariableShader extends CommonShaderPart {
  private __constantValueStr = '';

  /**
   * Creates a new ConstantVariableShader instance.
   *
   * @param __functionName - The name of the generated shader function
   * @param __compositionType - The composition type (scalar, vec2, vec3, vec4, etc.) of the constant
   * @param __componentType - The component type (float, int, bool) of the constant
   */
  constructor(
    private __functionName: string,
    private __compositionType: CompositionTypeEnum,
    private __componentType: ComponentTypeEnum
  ) {
    super();
  }

  /**
   * Sets the constant value that will be output by the generated shader function.
   * The value is converted to the appropriate GLSL/WGSL string representation based on the component type.
   *
   * @param value - The vector value to be used as the constant. The number of components used
   *                depends on the composition type specified in the constructor.
   *
   * @example
   * ```typescript
   * // For a Vec3 float constant
   * shader.setConstantValue(Vector3.fromCopyArray([1.0, 0.5, 0.0]));
   *
   * // For a scalar int constant
   * shader.setConstantValue(Scalar.fromCopyNumber(42));
   *
   * // For a boolean constant
   * shader.setConstantValue(Scalar.fromCopyNumber(1)); // true
   * ```
   */
  setConstantValue(value: IVector) {
    let constant = '';
    if (this.__componentType.isFloatingPoint()) {
      constant = value.glslStrAsFloat;
    } else if (this.__componentType.isInteger()) {
      constant = value.glslStrAsInt;
    } else if (this.__componentType === ComponentType.Bool) {
      constant = value.x ? 'true' : 'false';
    }
    this.__constantValueStr = constant;
  }

  /**
   * Generates the vertex shader function definition that outputs the constant value.
   * The generated function takes an output parameter and assigns the constant value to it.
   *
   * @returns The GLSL or WGSL function definition string for the vertex shader,
   *          depending on the current process approach (WebGL or WebGPU).
   *
   * @example
   * Generated GLSL:
   * ```glsl
   * void getConstantColor(out vec3 outValue) {
   *   outValue = vec3(1.0, 0.5, 0.0);
   * }
   * ```
   *
   * Generated WGSL:
   * ```wgsl
   * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
   *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
   * }
   * ```
   */
  get vertexShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn ${this.__functionName}(
        outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
        *outValue = ${this.__constantValueStr};
      }
      `;
    } else {
      return `
      void ${this.__functionName}(
        out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
        outValue = ${this.__constantValueStr};
      }
      `;
    }
  }

  /**
   * Generates the pixel shader function definition that outputs the constant value.
   * This is identical to the vertex shader definition as constant values are the same
   * regardless of shader stage.
   *
   * @returns The GLSL or WGSL function definition string for the pixel shader,
   *          depending on the current process approach (WebGL or WebGPU).
   *
   * @example
   * Generated GLSL:
   * ```glsl
   * void getConstantColor(out vec3 outValue) {
   *   outValue = vec3(1.0, 0.5, 0.0);
   * }
   * ```
   *
   * Generated WGSL:
   * ```wgsl
   * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
   *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
   * }
   * ```
   */
  get pixelShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn ${this.__functionName}(
        outValue: ptr<function, ${this.__compositionType.toWGSLType(this.__componentType)}>) {
        *outValue = ${this.__constantValueStr};
      }
      `;
    } else {
      return `
      void ${this.__functionName}(
        out ${this.__compositionType.getGlslStr(this.__componentType)} outValue) {
        outValue = ${this.__constantValueStr};
      }
      `;
    }
  }

  /**
   * Returns the attribute names required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no vertex attributes are needed for constant values.
   */
  get attributeNames(): AttributeNames {
    return [];
  }

  /**
   * Returns the vertex attribute semantics required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no vertex attribute semantics are needed for constant values.
   */
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  /**
   * Returns the attribute compositions required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no attribute compositions are needed for constant values.
   */
  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
