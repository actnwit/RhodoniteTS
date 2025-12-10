import RemapShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Remap.glsl';
import RemapShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Remap.wgsl';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that remaps a value from one range to another.
 *
 * The remap function takes a value from the source range [sourceMin, sourceMax]
 * and maps it to the target range [targetMin, targetMax].
 * Formula: outValue = targetMin + ((value - sourceMin) / (sourceMax - sourceMin)) * (targetMax - targetMin)
 *
 * @example
 * ```typescript
 * const remapNode = new RemapShaderNode(
 *   CompositionType.Vec3,
 *   ComponentType.Float
 * );
 * ```
 */
export class RemapShaderNode extends AbstractShaderNode {
  /**
   * Creates a new RemapShaderNode instance.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4) for the shader node
   * @param componentType - The component type (Float, Int, etc.) for the shader node
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_remap', {
      codeGLSL: RemapShaderityObjectGLSL.code,
      codeWGSL: RemapShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__inputs.push(new Socket('sourceMin', compositionType, componentType));
    this.__inputs.push(new Socket('sourceMax', compositionType, componentType));
    this.__inputs.push(new Socket('targetMin', compositionType, componentType));
    this.__inputs.push(new Socket('targetMax', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket for the value parameter of the remap function.
   *
   * This is the value to be remapped from source range to target range.
   *
   * @returns The input socket for the value parameter
   */
  getSocketInputValue() {
    return this.__inputs[0];
  }

  /**
   * Gets the output socket that contains the result of the remap operation.
   *
   * The output will be the input value remapped from [sourceMin, sourceMax] to [targetMin, targetMax].
   *
   * @returns The output socket containing the remap result
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the appropriate shader function name based on the current process approach and composition type.
   *
   * For WebGPU, the function name includes a type suffix (F32, Vec2f, Vec3f, Vec4f) to match
   * WGSL naming conventions. For other approaches (WebGL), the base function name is used.
   *
   * @param engine - The engine instance
   * @returns The shader function name with appropriate type suffix for the current context
   * @throws {Error} If the composition type is not supported
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Scalar) {
        return `${this.__shaderFunctionName}F32`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return `${this.__shaderFunctionName}Vec2f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return `${this.__shaderFunctionName}Vec3f`;
      }
      if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return `${this.__shaderFunctionName}Vec4f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}
