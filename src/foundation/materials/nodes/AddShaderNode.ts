import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import AddShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Add.glsl';
import AddShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Add.wgsl';
import { Socket } from '../core/Socket';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';

export class AddShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('add', {
      codeGLSL: AddShaderityObjectGLSL.code,
      codeWGSL: AddShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('lhs', compositionType, componentType));
    this.__inputs.push(new Socket('rhs', compositionType, componentType));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  getSocketInputLhs() {
    return this.__inputs[0];
  }

  getSocketInputRhs() {
    return this.__inputs[1];
  }

  getSocketOutput() {
    return this.__outputs[0];
  }

  getShaderFunctionNameDerivative() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (
        this.__inputs[0].compositionType === CompositionType.Scalar &&
        this.__inputs[1].compositionType === CompositionType.Scalar
      ) {
        if (
          this.__inputs[0].componentType === ComponentType.Float &&
          this.__inputs[1].componentType === ComponentType.Float
        ) {
          return this.__shaderFunctionName + 'F32F32';
        } else if (
          this.__inputs[0].componentType === ComponentType.Int &&
          this.__inputs[1].componentType === ComponentType.Int
        ) {
          return this.__shaderFunctionName + 'I32I32';
        } else {
          throw new Error('Not implemented');
        }
      } else if (
        this.__inputs[0].compositionType === CompositionType.Vec2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return this.__shaderFunctionName + 'Vec2fVec2f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Vec3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return this.__shaderFunctionName + 'Vec3fVec3f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Vec4 &&
        this.__inputs[1].compositionType === CompositionType.Vec4
      ) {
        return this.__shaderFunctionName + 'Vec4fVec4f';
      } else {
        throw new Error('Not implemented');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
