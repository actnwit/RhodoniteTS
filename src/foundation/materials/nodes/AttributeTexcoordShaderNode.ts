import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeTexcoordShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeTexcoord.vert';
import AttributeTexcoordShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeTexcoord.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeTexcoordShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributeTexcoord', {
      codeGLSL: AttributeTexcoordShaderityObjectGLSL.code,
      codeWGSL: AttributeTexcoordShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
