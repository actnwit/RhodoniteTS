import NormalizeShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Normalize.glsl';
import NormalizeShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Normalize.wgsl';
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../../foundation/definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class NormalizeShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_normalize', {
      codeGLSL: NormalizeShaderityObjectGLSL.code,
      codeWGSL: NormalizeShaderityObjectWGSL.code,
    });

    this.__inputs.push({
      compositionType: compositionType,
      componentType: componentType,
      name: 'value',
    });
    this.__outputs.push({
      compositionType: compositionType,
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
