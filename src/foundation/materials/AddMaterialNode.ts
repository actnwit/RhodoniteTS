import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import AddShader from "../../webgl/shaders/AddShader";

export default class AddMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(AddShader.getInstance(), 'add');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'lhs',
        isImmediateValue: false
      });
    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'rhs',
        isImmediateValue: false
      });
    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
        isImmediateValue: false
      });

    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'lhs',
        isImmediateValue: false
      });
    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'rhs',
        isImmediateValue: false
      });
    this.__pixelOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'outValue',
        isImmediateValue: false
      });
  }

}
