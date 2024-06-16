import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import AttributePositionShaderityObject from '../../../webgl/shaderity_shaders/nodes/AttributePosition.vert';
import AttributePositionShaderityObjectWebGPU from '../../../webgpu/shaderity_shaders/nodes/AttributePosition.vert';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

export class AttributePositionShaderNode extends AbstractShaderNode {
  constructor() {
    super('attributePosition', {
      codeGLSL: AttributePositionShaderityObject.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push(new Socket('outValue', CompositionType.Vec4, ComponentType.Float));
  }

  getSocketOutput() {
    return this.__outputs[0];
  }
}
