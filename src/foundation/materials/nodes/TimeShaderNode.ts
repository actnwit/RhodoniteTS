import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import TimeShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Time.glsl';
import TimeShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Time.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class TimeShaderNode extends AbstractShaderNode {
  constructor() {
    super('time', {
      codeGLSL: TimeShaderityObjectGLSL.code,
      codeWGSL: TimeShaderityObjectWGSL.code,
    });

    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
