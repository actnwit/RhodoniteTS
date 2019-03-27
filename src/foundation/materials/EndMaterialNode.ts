import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";

export default class EndMaterialNode extends AbstractMaterialNode {
  static readonly shader: EndShader = EndShader.getInstance();

  constructor() {
    super();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [
    ];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

    this.__pixelInputs.push(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'inColor',
      isImmediateValue: false
    });

    this.__vertexInputs.push(
      {
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        name: 'inPosition',
        isImmediateValue: false
      });
  }

  static async initDefaultTextures() {
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
