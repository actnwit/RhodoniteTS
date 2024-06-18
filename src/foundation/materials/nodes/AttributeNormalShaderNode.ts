import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeNormalShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeNormal.vert';
import AttributeNormalShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeNormal.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeNormalShaderNode extends AbstractShaderNode {
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
