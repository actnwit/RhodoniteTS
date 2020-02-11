import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import MultiplyShaderityObject from "../../../webgl/shaderity_shaders/nodes/Multiply.glsl"
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";

export default class MultiplyMaterialNode extends AbstractMaterialNode {

  constructor(
    lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum,
    rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum,
    ) {
    super(null, 'multiply', {}, MultiplyShaderityObject, MultiplyShaderityObject);


    let outValueCompositionType = CompositionType.Unknown;
    if (lhsCompositionType === CompositionType.Mat4 && rhsCompositionType === CompositionType.Mat4) {
      outValueCompositionType = CompositionType.Mat4;
    } else if (lhsCompositionType === CompositionType.Mat4 && rhsCompositionType === CompositionType.Vec4) {
      outValueCompositionType = CompositionType.Vec4;
    } else if (lhsCompositionType === CompositionType.Scalar && rhsCompositionType === CompositionType.Scalar) {
      outValueCompositionType = CompositionType.Scalar;
    }
    this.__vertexInputs.push(
      {
        compositionType: lhsCompositionType,
        componentType: lhsComponentType,
        name: 'lhs',
      });
    this.__vertexInputs.push(
      {
        compositionType: rhsCompositionType,
        componentType: rhsComponentType,
        name: 'rhs',
      });
    this.__vertexOutputs.push(
      {
        compositionType: outValueCompositionType,
        componentType: lhsComponentType,
        name: 'outValue',
      });

    this.__pixelInputs.push(
      {
        compositionType: lhsCompositionType,
        componentType: lhsComponentType,
        name: 'lhs',
      });
    this.__pixelInputs.push(
      {
        compositionType: rhsCompositionType,
        componentType: rhsComponentType,
        name: 'rhs',
      });
    this.__pixelOutputs.push(
      {
        compositionType: outValueCompositionType,
        componentType: lhsComponentType,
        name: 'outValue',
      });

  }

}

