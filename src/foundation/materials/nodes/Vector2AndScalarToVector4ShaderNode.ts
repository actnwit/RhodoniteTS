import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import Vector2AndScalarToVector4ShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Vector2AndScalarToVector4.glsl';
import Vector2AndScalarToVector4ShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Vector2AndScalarToVector4.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class Vector2AndScalarToVector4ShaderNode extends AbstractShaderNode {
  constructor() {
    super('vector2AndScalarToVector4', {
      codeGLSL: Vector2AndScalarToVector4ShaderityObjectGLSL.code,
      codeWGSL: Vector2AndScalarToVector4ShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType: ComponentType.Float,
      name: 'xy',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'z',
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.Float,
      name: 'w',
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
