import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode, { ShaderSocket } from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";
import GetVarsShader from "../../webgl/shaders/GetVarsShader";

export default class GetVarsNode extends AbstractMaterialNode {
  shader: GetVarsShader = new GetVarsShader();

  constructor() {
    super();

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];
    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);

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

  addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    this.__vertexOutputs.push(outShaderSocket);
    this.shader
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
