import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import Vector3AndScalarToVector4ShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Vector3AndScalarToVector4.glsl';
import Vector3AndScalarToVector4ShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Vector3AndScalarToVector4.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

export class Vector3AndScalarToVector4ShaderNode extends AbstractShaderNode {
  constructor() {
    super('vector3AndScalarToVector4', {
      codeGLSL: Vector3AndScalarToVector4ShaderityObjectGLSL.code,
      codeWGSL: Vector3AndScalarToVector4ShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      name: 'xyz',
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
