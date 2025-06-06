import TimeShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Time.glsl';
import TimeShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Time.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides time-based functionality for shaders.
 * This node outputs the current time value as a scalar float, which can be used
 * for animations, procedural effects, and time-dependent calculations in shaders.
 *
 * The node includes both GLSL and WGSL implementations to support different
 * graphics APIs (WebGL and WebGPU).
 *
 * @example
 * ```typescript
 * const timeNode = new TimeShaderNode();
 * // Use timeNode.outValue in your shader graph for time-based effects
 * ```
 */
export class TimeShaderNode extends AbstractShaderNode {
  /**
   * Creates a new TimeShaderNode instance.
   *
   * Initializes the node with:
   * - GLSL and WGSL shader code for time functionality
   * - A single scalar float output named 'outValue' that represents the current time
   *
   * The output can be connected to other shader nodes to create time-dependent
   * effects such as animations, oscillations, or procedural variations.
   */
  constructor() {
    super('time', {
      codeGLSL: TimeShaderityObjectGLSL.code,
      codeWGSL: TimeShaderityObjectWGSL.code,
    });

    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
