import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeNormal.vert';
import AttributeNormalShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeNormal.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides access to vertex normal attributes.
 * This node outputs the normal vector attribute of vertices for use in shader computations.
 * It supports both WebGL (GLSL) and WebGPU (WGSL) rendering backends.
 *
 * @example
 * ```typescript
 * const normalNode = new AttributeNormalShaderNode();
 * // Use the normal output in other shader nodes
 * const normalOutput = normalNode.getOutput('outValue');
 * ```
 */
export class AttributeNormalShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AttributeNormalShaderNode instance.
   *
   * Initializes the shader node with vertex stage shader code for both GLSL and WGSL,
   * and sets up a Vec3 float output for the normal vector attribute.
   * The output represents the normal vector in 3D space with floating-point precision.
   */
  constructor() {
    super('attributeNormal', {
      codeGLSL: AttributeNormalShaderityObjectGLSL.code,
      codeWGSL: AttributeNormalShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
