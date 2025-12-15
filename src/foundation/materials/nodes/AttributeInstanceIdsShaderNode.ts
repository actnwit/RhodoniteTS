import AttributeInstanceIdsShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeInstanceIds.vert.glsl';
import AttributeInstanceIdsShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeInstanceIds.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides instance IDs attribute functionality.
 * This node outputs a Vec4 instance IDs attribute value that can be used in vertex shaders
 * for instance-based operations such as accessing per-instance data.
 *
 * The node supports both WebGL (GLSL) and WebGPU (WGSL) shader backends.
 *
 * @example
 * ```typescript
 * const instanceIdsNode = new AttributeInstanceIdsShaderNode();
 * // Use in a material's shader graph for accessing instance-specific data
 * ```
 */
export class AttributeInstanceIdsShaderNode extends AbstractShaderNode {
  /**
   * Constructs a new AttributeInstanceIdsShaderNode.
   *
   * Initializes the node with instance IDs attribute shader code for both GLSL and WGSL,
   * sets it as a vertex stage shader, and configures the output to be a Vec4 unsigned int
   * representing instance IDs.
   */
  constructor() {
    super('attributeInstanceIds', {
      codeGLSL: AttributeInstanceIdsShaderityObjectGLSL.code,
      codeWGSL: AttributeInstanceIdsShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.UnsignedInt,
      name: 'outValue',
    });
  }
}
