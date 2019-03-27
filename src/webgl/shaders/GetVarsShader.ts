import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { ShaderSocket } from "../../foundation/materials/AbstractMaterialNode";
import { CompositionType } from "../../foundation/definitions/CompositionType";

export type AttributeNames = Array<string>;

export default class GetVarsShader extends GLSLShader {
  static __instance: GetVarsShader;
  public static readonly materialElement = ShaderNode.PBRShading;

  private __vertexInputs: ShaderSocket[] = [];
  private __vertexOutputs: ShaderSocket[] = [];
  private __pixelInputs: ShaderSocket[] = [];
  private __pixelOutputs: ShaderSocket[] = [];


  constructor() {
    super();
  }

  addVertexInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    if (inShaderSocket.componentType !== outShaderSocket.componentType ||
      inShaderSocket.compositionType !== outShaderSocket.compositionType) {
        console.error('input and output type miss match!');
        return;
    }
    this.__vertexInputs.push(inShaderSocket);
    this.__vertexOutputs.push(outShaderSocket);
  }
  addPixelInputAndOutput(inShaderSocket: ShaderSocket, outShaderSocket: ShaderSocket) {
    if (inShaderSocket.componentType !== outShaderSocket.componentType ||
      inShaderSocket.compositionType !== outShaderSocket.compositionType) {
        console.error('input and output type miss match!');
        return;
    }
    this.__pixelInputs.push(inShaderSocket);
    this.__pixelOutputs.push(outShaderSocket);
  }

  get vertexShaderDefinitions() {
    const startArgs = `function getVers(
  `;

    let args = '';
    for (let i=0; i<this.__vertexInputs.length; i++) {
      if (i!=0) {
        args += ',\n  ';
      }
      const input = this.__vertexInputs[i];
      const inputType = input.compositionType.getGlslStr(input.componentType);
      const inputRowStr = `in ${inputType} ${input.name}`;
      args += inputRowStr;

      args += ',\n  ';

      const output = this.__vertexOutputs[i];
      const outputType = output.compositionType.getGlslStr(output.componentType);
      const outputRowStr = `out ${outputType} ${output.name}`;
      args += outputRowStr;
    }

    const endArgs = `
)
{
  `;

    let processStr = '';
    for (let i=0; i<this.__vertexInputs.length; i++) {
      const input = this.__vertexInputs[i];
      const output = this.__vertexOutputs[i];
      let rowStr = `${output.name} = ${input.name};\n`;
      if (i !== this.__vertexInputs.length - 1) {
        rowStr += '  ';
      }
      processStr += rowStr;
    }

    const end = `}`;

    return startArgs + args + endArgs + processStr + end;
  };

  get vertexShaderBody() {
    return `

    `;
  }


  get fragmentShaderDefinitions() {
    const _def_fragColor = this.glsl_fragColor;
    return `
    function endPixel(in vec4 inColor) {
      rt0 = inColor;
      ${_def_fragColor}
    }
    `;
  }

  get fragmentShaderBody() {
    return '';
  }

  static attributeNames: AttributeNames = [];
  static attributeSemantics: Array<VertexAttributeEnum> = [];
}
