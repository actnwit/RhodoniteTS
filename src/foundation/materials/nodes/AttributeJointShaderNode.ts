import AttributeJointShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeJoint.vert.glsl';
import AttributeJointShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeJoint.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides joint attribute functionality for skeletal animation.
 * This node outputs a Vec4 joint attribute value that can be used in vertex shaders
 * for bone skinning operations.
 *
 * The node supports both WebGL (GLSL) and WebGPU (WGSL) shader backends.
 *
 * @example
 * ```typescript
 * const jointNode = new AttributeJointShaderNode();
 * // Use in a material's shader graph for skeletal animation
 * ```
 */
export class AttributeJointShaderNode extends AbstractShaderNode {
  /**
   * Constructs a new AttributeJointShaderNode.
   *
   * Initializes the node with joint attribute shader code for both GLSL and WGSL,
   * sets it as a vertex stage shader, and configures the output to be a Vec4 float
   * representing joint indices or weights.
   */
  constructor() {
    super('attributeJoint', {
      codeGLSL: AttributeJointShaderityObjectGLSL.code,
      codeWGSL: AttributeJointShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
