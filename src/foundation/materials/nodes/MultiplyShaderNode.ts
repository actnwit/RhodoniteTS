import { CompositionType } from "../../definitions/CompositionType";
import MultiplyShaderityObject from "../../../webgl/shaderity_shaders/nodes/Multiply.glsl"
import { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import AbstractShaderNode from "../core/AbstractShaderNode";

export default class MultiplyShaderNode extends AbstractShaderNode {

  constructor(
    lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum,
    rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum,
    ) {
    super('multiply', MultiplyShaderityObject.code);


    let outValueCompositionType = CompositionType.Unknown;
    if (lhsCompositionType === CompositionType.Mat4 && rhsCompositionType === CompositionType.Mat4) {
      outValueCompositionType = CompositionType.Mat4;
    } else if (lhsCompositionType === CompositionType.Mat4 && rhsCompositionType === CompositionType.Vec4) {
      outValueCompositionType = CompositionType.Vec4;
    } else if (lhsCompositionType === CompositionType.Scalar && rhsCompositionType === CompositionType.Scalar) {
      outValueCompositionType = CompositionType.Scalar;
    }
    this.__inputs.push(
      {
        compositionType: lhsCompositionType,
        componentType: lhsComponentType,
        name: 'lhs',
      });
    this.__inputs.push(
      {
        compositionType: rhsCompositionType,
        componentType: rhsComponentType,
        name: 'rhs',
      });
    this.__outputs.push(
      {
        compositionType: outValueCompositionType,
        componentType: lhsComponentType,
        name: 'outValue',
      });

  }

}

