import { CompositionType } from '../../definitions/CompositionType';
import MultiplyShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Multiply.glsl';
import MultiplyShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Multiply.wgsl';
import { ComponentType, ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class MultiplyShaderNode extends AbstractShaderNode {
  constructor(
    lhsCompositionType: CompositionTypeEnum,
    lhsComponentType: ComponentTypeEnum,
    rhsCompositionType: CompositionTypeEnum,
    rhsComponentType: ComponentTypeEnum
  ) {
    super('multiply', {
      codeGLSL: MultiplyShaderityObjectGLSL.code,
      codeWGSL: MultiplyShaderityObjectWGSL.code,
    });

    let outValueCompositionType: CompositionTypeEnum = CompositionType.Unknown;
    if (
      lhsCompositionType === CompositionType.Mat4 &&
      rhsCompositionType === CompositionType.Mat4
    ) {
      outValueCompositionType = CompositionType.Mat4;
    } else if (
      lhsCompositionType === CompositionType.Mat4 &&
      rhsCompositionType === CompositionType.Vec4
    ) {
      outValueCompositionType = CompositionType.Vec4;
    } else if (
      lhsCompositionType === CompositionType.Scalar &&
      rhsCompositionType === CompositionType.Scalar
    ) {
      outValueCompositionType = CompositionType.Scalar;
    }
    this.__inputs.push({
      compositionType: lhsCompositionType,
      componentType: lhsComponentType,
      name: 'lhs',
    });
    this.__inputs.push({
      compositionType: rhsCompositionType,
      componentType: rhsComponentType,
      name: 'rhs',
    });
    this.__outputs.push({
      compositionType: outValueCompositionType,
      componentType: lhsComponentType,
      name: 'outValue',
    });
  }

  getShaderFunctionNameDerivative(): string {
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
        this.__inputs[0].compositionType === CompositionType.Mat2 &&
        this.__inputs[1].compositionType === CompositionType.Mat2
      ) {
        return this.__shaderFunctionName + 'Mat2x2fMat2x2f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat3 &&
        this.__inputs[1].compositionType === CompositionType.Mat3
      ) {
        return this.__shaderFunctionName + 'Mat3x3fMat3x3f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat4 &&
        this.__inputs[1].compositionType === CompositionType.Mat4
      ) {
        return this.__shaderFunctionName + 'Mat4x4fMat4x4f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return this.__shaderFunctionName + 'Mat3x3fVec3f';
      } else if (
        this.__inputs[0].compositionType === CompositionType.Mat4 &&
        this.__inputs[1].compositionType === CompositionType.Vec4
      ) {
        return this.__shaderFunctionName + 'Mat4x4fVec4f';
      } else {
        throw new Error('Not implemented');
      }
    } else {
      return this.__shaderFunctionName;
    }
  }
}
