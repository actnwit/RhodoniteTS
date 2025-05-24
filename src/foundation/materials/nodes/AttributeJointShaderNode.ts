import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributeJointShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/AttributeJoint.vert.glsl';
import AttributeJointShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/AttributeJoint.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class AttributeJointShaderNode extends AbstractShaderNode {
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

