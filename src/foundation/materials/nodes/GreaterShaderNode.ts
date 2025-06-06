import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { CompositionType, type CompositionTypeEnum } from '../../definitions/CompositionType';
import { ComponentType, type ComponentTypeEnum } from '../../definitions/ComponentType';
import GreaterShaderityObject from '../../../webgl/shaderity_shaders/nodes/Greater.glsl';

/**
 * A shader node that performs a greater-than comparison operation.
 *
 * This node compares two values and outputs a boolean result indicating whether
 * the left-hand side (lhs) is greater than the right-hand side (rhs).
 * The node accepts a left operand of any composition and component type,
 * and a right operand that must be a float scalar value.
 *
 * @example
 * ```typescript
 * // Create a greater-than comparison node for Vec3 values
 * const greaterNode = new GreaterShaderNode(CompositionType.Vec3, ComponentType.Float);
 * ```
 */
export class GreaterShaderNode extends AbstractShaderNode {
  /**
   * Creates a new GreaterShaderNode instance.
   *
   * @param compositionType - The composition type of the left-hand side input (e.g., Scalar, Vec2, Vec3, Vec4)
   * @param componentType - The component type of the left-hand side input (e.g., Float, Int, Bool)
   *
   * @remarks
   * The node will have two inputs:
   * - `lhs`: Left-hand side operand with the specified composition and component type
   * - `rhs`: Right-hand side operand, always a float scalar
   *
   * The output is always a boolean scalar indicating the comparison result.
   */
  constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    super('greater', {
      codeGLSL: GreaterShaderityObject.code,
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
      componentType: ComponentType.Bool,
      name: 'outValue',
    });
  }
}
