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

  }

  addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    this.__vertexOutputs.push(outShaderSocket);

    const input = {
      conpositionType: inShaderSocket.compositionType,
      componentType: inShaderSocket.componentType,
      name: inShaderSocket
    }
//    this.shader.addVertexInputAndOutput()
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
