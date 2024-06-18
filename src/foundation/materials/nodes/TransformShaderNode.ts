import { CompositionType } from '../../definitions/CompositionType';
import MultiplyShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Transform.glsl';
import MultiplyShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Transform.wgsl';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionTypeEnum } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';

export class TransformShaderNode extends AbstractShaderNode {
  constructor(
    lhsCompositionType: CompositionTypeEnum,
    lhsComponentType: ComponentTypeEnum,
    rhsCompositionType: CompositionTypeEnum,
    rhsComponentType: ComponentTypeEnum
  ) {
    super('transform', {
      codeGLSL: MultiplyShaderityObjectGLSL.code,
      codeWGSL: MultiplyShaderityObjectWGSL.code,
    });

    let outValueCompositionType: CompositionTypeEnum = CompositionType.Unknown;
    if (
      lhsCompositionType === CompositionType.Mat4 &&
      rhsCompositionType === CompositionType.Vec4
    ) {
      outValueCompositionType = CompositionType.Vec4;
    } else if (
      lhsCompositionType === CompositionType.Mat3 &&
      rhsCompositionType === CompositionType.Vec3
    ) {
      outValueCompositionType = CompositionType.Vec3;
    } else if (
      lhsCompositionType === CompositionType.Mat2 &&
      rhsCompositionType === CompositionType.Vec2
    ) {
      outValueCompositionType = CompositionType.Vec2;
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
        this.__inputs[0].compositionType === CompositionType.Mat2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return this.__shaderFunctionName + 'Mat2x2fVec2f';
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
