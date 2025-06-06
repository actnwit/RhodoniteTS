import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeWeightShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeWeight.vert.glsl';
import AttributeWeightShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeWeight.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that handles attribute weight calculations in vertex shaders.
 * This node outputs a Vec4 float value representing vertex attribute weights,
 * which can be used for various rendering techniques such as skinning or morphing.
 *
 * The node operates in the vertex shader stage and provides both GLSL and WGSL
 * implementations for cross-platform compatibility.
 *
 * @example
 * ```typescript
 * const attributeWeightNode = new AttributeWeightShaderNode();
 * // Use the node's output in shader composition
 * ```
 */
export class AttributeWeightShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AttributeWeightShaderNode instance.
   *
   * Initializes the shader node with the appropriate GLSL and WGSL code,
   * sets it to operate in the vertex shader stage, and defines its output
   * as a Vec4 float value named 'outValue'.
   *
   * The output represents attribute weights that can be used for various
   * vertex transformations and calculations in the rendering pipeline.
   */
  constructor() {
    super('attributeWeight', {
      codeGLSL: AttributeWeightShaderityObjectGLSL.code,
      codeWGSL: AttributeWeightShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
