import AttributeTexcoordShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeTexcoord.vert';
import AttributeTexcoordShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeTexcoord.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Scalar } from '../../math/Scalar';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that provides texture coordinate attributes from vertex data.
 * This node outputs UV coordinates for texture mapping operations.
 *
 * @extends AbstractShaderNode
 */
export class AttributeTexcoordShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AttributeTexcoordShaderNode instance.
   * Initializes the node with GLSL and WGSL shader codes for texture coordinate attributes.
   * Sets up the vertex shader stage and configures the output as a Vec3 float value.
   */
  constructor() {
    super('attributeTexcoord', {
      codeGLSL: AttributeTexcoordShaderityObjectGLSL.code,
      codeWGSL: AttributeTexcoordShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__inputs.push(
      new Socket('texcoordIndex', CompositionType.Scalar, ComponentType.UnsignedInt, Scalar.fromCopyNumber(0))
    );

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
