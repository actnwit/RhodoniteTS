import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";

export default class GetVarsNode extends AbstractMaterialNode {
  static readonly shader: EndShader = EndShader.getInstance();

  constructor() {

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    super(shaderSemanticsInfoArray);

    this.__pixelInputs.push(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'inColor'
    });

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'inPosition'
      });
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
