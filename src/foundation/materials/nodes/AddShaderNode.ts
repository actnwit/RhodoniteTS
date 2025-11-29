import AddShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/Add.glsl';
import AddShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/Add.wgsl';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { EngineState } from '../../system/EngineState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that performs addition operations between two input values.
 * Supports scalar, Vec2, Vec3, and Vec4 compositions with appropriate component types.
 *
 * This node creates two input sockets (lhs and rhs) and one output socket,
 * all of the same composition and component type. The node generates shader code
 * for both WebGL (GLSL) and WebGPU (WGSL) backends.
 *
 * @example
 * ```typescript
 * // Create an add node for Vec3 float operations
 * const addNode = new AddShaderNode(CompositionType.Vec3, ComponentType.Float);
 *
 * // Connect inputs and get output
 * const lhsSocket = addNode.getSocketInputLhs();
 * const rhsSocket = addNode.getSocketInputRhs();
 * const outputSocket = addNode.getSocketOutput();
 * ```
 */
export class AddShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AddShaderNode with the specified composition and component types.
   *
   * @param compositionType - The composition type (Scalar, Vec2, Vec3, or Vec4)
   * @param componentType - The component type (Float, Int, etc.)
   *
   * @throws {Error} Throws an error if the composition type is not supported
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('add', {
      codeGLSL: AddShaderityObjectGLSL.code,
      codeWGSL: AddShaderityObjectWGSL.code,
    });

    this.__inputs.push(new Socket('lhs', compositionType, componentType, this.getDefaultValue(compositionType)));
    this.__inputs.push(new Socket('rhs', compositionType, componentType, this.getDefaultValue(compositionType)));
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
   * Gets the left-hand side input socket.
   * This socket represents the first operand in the addition operation.
   *
   * @returns The left-hand side input socket
   */
  getSocketInputLhs() {
    return this.__inputs[0];
  }

  /**
   * Gets the right-hand side input socket.
   * This socket represents the second operand in the addition operation.
   *
   * @returns The right-hand side input socket
   */
  getSocketInputRhs() {
    return this.__inputs[1];
  }

  /**
   * Gets the output socket that contains the result of the addition operation.
   *
   * @returns The output socket containing the addition result
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
  getShaderFunctionNameDerivative() {
    if (EngineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (
        this.__inputs[0].compositionType === CompositionType.Scalar &&
        this.__inputs[1].compositionType === CompositionType.Scalar
      ) {
        if (
          this.__inputs[0].componentType === ComponentType.Float &&
          this.__inputs[1].componentType === ComponentType.Float
        ) {
          return `${this.__shaderFunctionName}F32F32`;
        }
        if (
          this.__inputs[0].componentType === ComponentType.Int &&
          this.__inputs[1].componentType === ComponentType.Int
        ) {
          return `${this.__shaderFunctionName}I32I32`;
        }
        throw new Error('Not implemented');
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec2 &&
        this.__inputs[1].compositionType === CompositionType.Vec2
      ) {
        return `${this.__shaderFunctionName}Vec2fVec2f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec3 &&
        this.__inputs[1].compositionType === CompositionType.Vec3
      ) {
        return `${this.__shaderFunctionName}Vec3fVec3f`;
      }
      if (
        this.__inputs[0].compositionType === CompositionType.Vec4 &&
        this.__inputs[1].compositionType === CompositionType.Vec4
      ) {
        return `${this.__shaderFunctionName}Vec4fVec4f`;
      }
      throw new Error('Not implemented');
    }
    return this.__shaderFunctionName;
  }
}
