import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import NormalizeShaderityObjectGLSL_ from '../../../webgl/shaderity_shaders/nodes/Normalize.glsl';
import NormalizeShaderityObjectWGSL_ from '../../../webgpu/shaderity_shaders/nodes/Normalize.wgsl';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const NormalizeShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? NormalizeShaderityObjectGLSL_ : undefined;
const NormalizeShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? NormalizeShaderityObjectWGSL_ : undefined;

/**
 * A shader node that normalizes vectors by dividing each component by the vector's magnitude.
 * This node provides normalize functionality for Vec2, Vec3, and Vec4 compositions,
 * supporting both WebGL (GLSL) and WebGPU (WGSL) shader languages.
 */
export class NormalizeShaderNode extends AbstractShaderNode {
  /**
   * Creates a new NormalizeShaderNode instance.
   *
   * @param compositionType - The composition type (Vec2, Vec3, or Vec4) of the input and output values
   * @param componentType - The component type (e.g., Float32) of the vector components
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_normalize', {
      codeGLSL: NormalizeShaderityObjectGLSL.code,
      codeWGSL: NormalizeShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'value',
    });
    this.__outputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'outValue',
    });
  }

  /**
   * Gets the shader function name derivative based on the current process approach and composition type.
   * For WebGPU, it appends the vector type suffix (Vec2f, Vec3f, Vec4f) to the function name.
   * For other approaches (WebGL), it returns the base function name without modification.
   *
   * @returns The appropriate shader function name for the current context
   * @throws {Error} When an unsupported composition type is used with WebGPU
   */
  getShaderFunctionNameDerivative(engine: Engine): string {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
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
