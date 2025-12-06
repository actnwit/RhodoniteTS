import BranchShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Branch.glsl';
import BranchShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Branch.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs conditional branching based on a boolean condition.
 *
 * This node selects between two input values based on a boolean condition:
 * - If condition is true, outputs the ifTrue value
 * - If condition is false, outputs the ifFalse value
 *
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * @example
 * ```typescript
 * // Create a branch node for Vec4 float operations
 * const branchNode = new BranchShaderNode(CompositionType.Vec4, ComponentType.Float);
 * ```
 */
export class BranchShaderNode extends AbstractShaderNode {
  /**
   * Creates a new BranchShaderNode with the specified composition and component types.
   *
   * @param compositionType - The composition type for ifTrue/ifFalse/output (Scalar, Vec2, Vec3, or Vec4)
   * @param componentType - The component type for ifTrue/ifFalse/output (Float, Int, etc.)
   *
   * @throws {Error} Throws an error if the composition type is not supported
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('branch', {
      codeGLSL: BranchShaderityObjectGLSL.code,
      codeWGSL: BranchShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('condition', CompositionType.Scalar, ComponentType.Bool));
    this.__inputs.push(
      new Socket('ifTrue', compositionType, componentType, this.getDefaultValue(compositionType))
    );
    this.__inputs.push(
      new Socket('ifFalse', compositionType, componentType, this.getDefaultValue(compositionType))
    );
    this.__outputs.push(new Socket('outValue', compositionType, componentType));
  }

  /**
   * Returns the default value for a given composition type.
   * This is used to initialize input sockets with appropriate zero values.
   *
   * @param compositionType - The composition type to get the default value for
   * @returns The default value (zero) for the specified composition type
   *
   * @throws {Error} Throws an error if the composition type is not implemented
   */
  getDefaultValue(compositionType: CompositionTypeEnum) {
    if (compositionType === CompositionType.Scalar) {
      return Scalar.fromCopyNumber(0);
    }
    if (compositionType === CompositionType.Vec2) {
      return Vector2.zero();
    }
    if (compositionType === CompositionType.Vec3) {
      return Vector3.zero();
    }
    if (compositionType === CompositionType.Vec4) {
      return Vector4.zero();
    }
    throw new Error('Not implemented');
  }

  /**
   * Gets the condition input socket (boolean).
   *
   * @returns The condition input socket
   */
  getSocketInputCondition() {
    return this.__inputs[0];
  }

  /**
   * Gets the ifTrue input socket.
   * This value is selected when condition is true.
   *
   * @returns The ifTrue input socket
   */
  getSocketInputIfTrue() {
    return this.__inputs[1];
  }

  /**
   * Gets the ifFalse input socket.
   * This value is selected when condition is false.
   *
   * @returns The ifFalse input socket
   */
  getSocketInputIfFalse() {
    return this.__inputs[2];
  }

  /**
   * Gets the output socket that contains the result of the branch operation.
   *
   * @returns The output socket containing the selected value
   */
  getSocketOutput() {
    return this.__outputs[0];
  }

  /**
   * Generates the appropriate shader function name derivative based on the current
   * rendering backend and input socket types.
   *
   * For WebGPU, this method generates type-specific function names to handle
   * different combinations of composition and component types. For WebGL,
   * it returns the base shader function name.
   *
   * @returns The shader function name derivative for the current configuration
   *
   * @throws {Error} Throws an error if the input socket type combination is not implemented
   */
  getShaderFunctionNameDerivative(engine: Engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      const ifTrueSocket = this.__inputs[1];
      if (ifTrueSocket.compositionType === CompositionType.Scalar) {
        if (ifTrueSocket.componentType === ComponentType.Float) {
          return `${this.__shaderFunctionName}F32`;
        }
        if (ifTrueSocket.componentType === ComponentType.Int) {
          return `${this.__shaderFunctionName}I32`;
        }
        throw new Error('Not implemented');
      }
      if (ifTrueSocket.compositionType === CompositionType.Vec2) {
        return `${this.__shaderFunctionName}Vec2f`;
      }
      if (ifTrueSocket.compositionType === CompositionType.Vec3) {
        return `${this.__shaderFunctionName}Vec3f`;
      }
      if (ifTrueSocket.compositionType === CompositionType.Vec4) {
        return `${this.__shaderFunctionName}Vec4f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}

