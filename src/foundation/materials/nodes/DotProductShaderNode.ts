import DotProductShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/DotProduct.glsl';
import DotProductShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/DotProduct.wgsl';
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class DotProductShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('dotProduct', {
      codeGLSL: DotProductShaderityObjectGLSL.code,
      codeWGSL: DotProductShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: compositionType,
      componentType: ComponentType.Float,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: CompositionType.Scalar,
      componentType: componentType,
      name: 'outValue',
    });
  }

  getShaderFunctionNameDerivative(): string {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return this.__shaderFunctionName + 'Vec2f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return this.__shaderFunctionName + 'Vec3f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return this.__shaderFunctionName + 'Vec4f';
      } else {
        throw new Error('Not supported composition type.');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
