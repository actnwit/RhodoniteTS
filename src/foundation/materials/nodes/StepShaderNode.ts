import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import StepShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Step.glsl';
import StepShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Step.wgsl';
import { Socket } from '../core/Socket';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';

export class StepShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('_step', {
      codeGLSL: StepShaderityObjectGLSL.code,
      codeWGSL: StepShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('value', compositionType, componentType));
    this.__inputs.push(new Socket('edge', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  getSocketInputValue() {
    return this.__inputs[0];
  }

  getSocketOutput() {
    return this.__outputs[0];
  }

  getShaderFunctionNameDerivative() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__inputs[0].compositionType === CompositionType.Scalar) {
        return this.__shaderFunctionName + 'F32';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec2) {
        return this.__shaderFunctionName + 'Vec2f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec3) {
        return this.__shaderFunctionName + 'Vec3f';
      } else if (this.__inputs[0].compositionType === CompositionType.Vec4) {
        return this.__shaderFunctionName + 'Vec4f';
      } else {
        throw new Error('Not implemented');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
