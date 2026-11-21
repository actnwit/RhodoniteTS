import Atan2ShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Atan2.glsl';
import Atan2ShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Atan2.wgsl';
import type { ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that computes atan2(y, x).
 * Supports scalar, vec2, vec3 and vec4 float values.
 *
 * The inputs are named `y` and `x` in the argument order of atan2.
 */
export class Atan2ShaderNode extends AbstractShaderNode {
  /**
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, Vec4)
   * @param componentType - The component type (Float)
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_atan2', {
      codeGLSL: Atan2ShaderityObjectGLSL.code,
      codeWGSL: Atan2ShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('y', compositionType, componentType));
    this.__inputs.push(new Socket('x', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Gets the input socket for the numerator (y) of atan2.
   */
  getSocketInputY() {
    return this.__inputs[0];
  }

  /**
   * Gets the input socket for the denominator (x) of atan2.
   */
  getSocketInputX() {
    return this.__inputs[1];
  }

  /**
   * Gets the output socket that contains the computed angle.
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Gets the platform-specific shader function name for the atan2 operation.
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
