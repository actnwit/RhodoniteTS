import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import AbstractMaterialNode, { ShaderSocket } from "./AbstractMaterialNode";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import EndShader from "../../webgl/shaders/EndShader";
import GetVarsShader from "../../webgl/shaders/GetVarsShader";
import { AttributeNames } from "../../webgl/shaders/GLSLShader";
import { VertexAttributeEnum } from "../main";
import { VertexAttributeClass } from "../definitions/VertexAttribute";

export default class GetVarsMaterialNode extends AbstractMaterialNode {
  private __attributeNames: AttributeNames = [];
  private __attributeSemantics: Array<VertexAttributeEnum> = [];
  private __shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];
  constructor() {
    super(new GetVarsShader(), 'getVars');

    this.setShaderSemanticsInfoArray(this.__shaderSemanticsInfoArray);

  }

  addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    if (inShaderSocket.name instanceof VertexAttributeClass) {
      this.__attributeSemantics.push(inShaderSocket.name);
      this.__attributeNames.push(inShaderSocket.name.shaderStr);
    }
    if (inShaderSocket.name instanceof ShaderSemanticsClass) {
      this.__shaderSemanticsInfoArray.push({
        semantic: inShaderSocket.name,
        isPlural: false,
        compositionType: inShaderSocket.compositionType,
        componentType: inShaderSocket.componentType,
        isSystem: false,
      });
    }
    this.__vertexOutputs.push(outShaderSocket);
    (this.shader as GetVarsShader).addVertexInputAndOutput(inShaderSocket, outShaderSocket);
  }

  addPixelInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    if (inShaderSocket.name instanceof ShaderSemanticsClass) {
      this.__shaderSemanticsInfoArray.push({
        semantic: inShaderSocket.name,
        isPlural: false,
        compositionType: inShaderSocket.compositionType,
        componentType: inShaderSocket.componentType,
        isSystem: false,
      });
    }
    this.__pixelOutputs.push(outShaderSocket);
    (this.shader as GetVarsShader).addPixelInputAndOutput(inShaderSocket, outShaderSocket);
  }

  get attributeNames() {
    return this.__attributeNames;
  }

  get attributeSemantics() {
    return this.__attributeSemantics;
  }

  convertValue(shaderSemantic: ShaderSemanticsEnum, value: any) {
  }
}
