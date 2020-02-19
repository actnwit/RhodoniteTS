
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import IfStatementShader from "../../../webgl/shaders/nodes/IfStatementShader";

export default class BlockEndMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(new IfStatementShader(), 'blockEnd');

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'blockEnd',
      });

    this.__pixelInputs.push(
      {
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        name: 'blockEnd',
      });

  }

}
