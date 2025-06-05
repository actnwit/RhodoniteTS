import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributePositionShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributePosition.vert';
import AttributePositionShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributePosition.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that provides access to vertex position attributes.
 * This node outputs the position attribute data from the vertex buffer,
 * typically used as input for vertex transformations in the rendering pipeline.
 */
export class AttributePositionShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AttributePositionShaderNode instance.
   * Initializes the node with position attribute shader code for both GLSL and WGSL,
   * sets up the vertex shader stage, and configures the output socket for Vec4 position data.
   */
  constructor() {
    super('attributePosition', {
      codeGLSL: AttributePositionShaderityObjectGLSL.code,
      codeWGSL: AttributePositionShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push(new Socket('outValue', CompositionType.Vec4, ComponentType.Float));
  }

  /**
   * Gets the output socket of this attribute position node.
   * The output socket provides a Vec4 value representing the vertex position attribute.
   *
   * @returns The output socket containing the position attribute data
   */
  getSocketOutput() {
    return this.__outputs[0];
  }
}
