import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType, CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from '../../definitions/ComponentType';
import AddShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Add.glsl';
import AddShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Add.wgsl';
import { Socket } from '../core/Socket';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { SystemState } from '../../system/SystemState';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';

export class AddShaderNode extends AbstractShaderNode {
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('add', {
      codeGLSL: AddShaderityObjectGLSL.code,
      codeWGSL: AddShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('lhs', compositionType, componentType, this.getDefaultValue(compositionType)));
    this.__inputs.push(new Socket('rhs', compositionType, componentType, this.getDefaultValue(compositionType)));
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  getDefaultValue(compositionType: CompositionTypeEnum) {
    if (compositionType === CompositionType.Scalar) {
      return Scalar.fromCopyNumber(0);
    } else if (compositionType === CompositionType.Vec2) {
      return Vector2.zero();
    } else if (compositionType === CompositionType.Vec3) {
      return Vector3.zero();
    } else if (compositionType === CompositionType.Vec4) {
      return Vector4.zero();
    } else {
      throw new Error('Not implemented');
    }
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
