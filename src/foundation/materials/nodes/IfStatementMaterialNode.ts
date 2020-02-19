
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";

export default class IfStatementMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(new IfStatementShader(), 'ifStatement');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'condition',
      });
    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Unknown,
        componentType: ComponentType.Unknown,
        name: 'ifStart',
      });

    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'condition',
      });
    this.__pixelOutputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'ifStart',
      });

  }

}
