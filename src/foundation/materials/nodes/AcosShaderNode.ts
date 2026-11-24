import AcosShaderityObjectGLSL_ from '../../../webgl/shaderity_shaders/nodes/Acos.glsl';
import AcosShaderityObjectWGSL_ from '../../../webgpu/shaderity_shaders/nodes/Acos.wgsl';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const AcosShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? AcosShaderityObjectGLSL_ : undefined;
const AcosShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? AcosShaderityObjectWGSL_ : undefined;

/**
 * A shader node that computes the arc cosine of its input.
 * Supports scalar, vec2, vec3 and vec4 float values.
 */
export class AcosShaderNode extends AbstractShaderNode {
  /**
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4)
   * @param componentType - The component type (Float)
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_acos', {
      codeGLSL: AcosShaderityObjectGLSL.code,
      codeWGSL: AcosShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket that accepts the value to compute the arc cosine of.
   */
  getSocketInputValue() {
    return this.__inputs[0];
  }

  /**
   * Gets the output socket that contains the computed arc cosine.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the platform-specific shader function name for the acos operation.
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
