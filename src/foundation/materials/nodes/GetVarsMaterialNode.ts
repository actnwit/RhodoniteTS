import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum, ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode, { ShaderSocket } from "../core/AbstractMaterialNode";
import GetVarsShader from "../../../webgl/shaders/nodes/GetVarsShader";
import { VertexAttributeClass } from "../../definitions/VertexAttribute";
import { ShaderType } from "../../definitions/ShaderType";

export type ShaderImmediateValue = {
  isImmediateValue: boolean,
  immediateValue?: string
}

export default class GetVarsMaterialNode extends AbstractMaterialNode {
  constructor() {
    super(new GetVarsShader(), 'getVars');

  }

  addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket, immediateInfo: ShaderImmediateValue) {
    if (inShaderSocket.name instanceof VertexAttributeClass) {
      this.shader!.attributeSemantics.push(inShaderSocket.name);
      this.shader!.attributeNames.push(inShaderSocket.name.shaderStr);
      this.shader!.attributeCompositions.push(inShaderSocket.compositionType);
    }
    if (inShaderSocket.name instanceof ShaderSemanticsClass) {
      this.__semantics.push({
        semantic: inShaderSocket.name,
        stage: ShaderType.VertexShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,

        compositionType: inShaderSocket.compositionType,
        componentType: inShaderSocket.componentType,
        isSystem: false,
      });
    }
    this.__vertexOutputs.push(outShaderSocket);
    (this.shader as GetVarsShader).addVertexInputAndOutput(inShaderSocket, outShaderSocket, immediateInfo);
  }

  addPixelInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket, immediateInfo: ShaderImmediateValue) {
    if (inShaderSocket.name instanceof ShaderSemanticsClass) {
      this.__semantics.push({
        semantic: inShaderSocket.name,
        stage: ShaderType.PixelShader,
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,

        compositionType: inShaderSocket.compositionType,
        componentType: inShaderSocket.componentType,
        isSystem: false,
      });
    }
    this.__pixelOutputs.push(outShaderSocket);
    (this.shader as GetVarsShader).addPixelInputAndOutput(inShaderSocket, outShaderSocket, immediateInfo);
  }

}
