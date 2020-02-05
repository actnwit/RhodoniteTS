import { VertexAttributeEnum, VertexAttribute, VertexAttributeClass } from "../../../foundation/definitions/VertexAttribute";
import GLSLShader from "../GLSLShader";
import { ShaderNode } from "../../../foundation/definitions/ShaderNode";
import { ShaderSocket } from "../../../foundation/materials/core/AbstractMaterialNode";
import { CompositionTypeEnum, CompositionType } from "../../../foundation/definitions/CompositionType";
import { ShaderSemanticsEnum, ShaderSemanticsClass } from "../../../foundation/definitions/ShaderSemantics";

export type AttributeNames = Array<string>;

export default class GetVarsShader extends GLSLShader {
  static __instance: GetVarsShader;
  public static readonly materialElement = ShaderNode.PBRShading;

  private __vertexInputs: ShaderSocket[] = [];
  private __vertexOutputs: ShaderSocket[] = [];
  private __pixelInputs: ShaderSocket[] = [];
  private __pixelOutputs: ShaderSocket[] = [];
  private __attributeNames: AttributeNames = [];
  private __attributeSemantics: Array<VertexAttributeEnum> = [];
  private __attributeCompositions: Array<CompositionTypeEnum> = []

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
    const startArgs = `void getVars(
  `;

    let args = '';
    for (let i=0; i<this.__vertexInputs.length; i++) {
      const input = this.__vertexInputs[i];
      if (i!=0) {
        args += ',\n  ';
      }
      if (!(input.isImmediateValue ||
        input.name instanceof VertexAttributeClass ||
        input.name instanceof ShaderSemanticsClass)) {
        const inputType = input.compositionType.getGlslStr(input.componentType);
        const inputName = GLSLShader.getStringFromShaderAnyDataType(input.name);
        const inputRowStr = `in ${inputType} ${inputName}`;
        args += inputRowStr;
        args += ',\n  ';
      }

      const output = this.__vertexOutputs[i];
      const outputType = output.compositionType.getGlslStr(output.componentType);
      const outputName = GLSLShader.getStringFromShaderAnyDataType(output.name);
      const outputRowStr = `out ${outputType} ${outputName}`;
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
      let inputName;
      if (input.isImmediateValue) {
        inputName = input.immediateValue;
      } else {
        inputName = GLSLShader.getStringFromShaderAnyDataType(input.name);
      }
      const outputName = GLSLShader.getStringFromShaderAnyDataType(output.name);
      let rowStr = `${outputName} = ${inputName};\n`;
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


  get pixelShaderDefinitions() {
  const startArgs = `void getVars(
  `;

    let args = '';
    for (let i=0; i<this.__pixelInputs.length; i++) {
      const input = this.__pixelInputs[i];
      if (i!=0) {
        args += ',\n  ';
      }
      if (!(input.isImmediateValue ||
        input.name instanceof VertexAttributeClass ||
        input.name instanceof ShaderSemanticsClass)) {
        const inputType = input.compositionType.getGlslStr(input.componentType);
        const inputName = GLSLShader.getStringFromShaderAnyDataType(input.name);
        const inputRowStr = `in ${inputType} ${inputName}`;
        args += inputRowStr;
        args += ',\n  ';
      }
      const output = this.__pixelOutputs[i];
      const outputType = output.compositionType.getGlslStr(output.componentType);
      const outputName = GLSLShader.getStringFromShaderAnyDataType(output.name);
      const outputRowStr = `out ${outputType} ${outputName}`;
      args += outputRowStr;
    }

    const endArgs = `
)
{
  `;

    let processStr = '';
    for (let i=0; i<this.__pixelInputs.length; i++) {
      const input = this.__pixelInputs[i];
      const output = this.__pixelOutputs[i];
      let inputName;
      if (input.isImmediateValue) {
        inputName = input.immediateValue;
      } else {
        inputName = GLSLShader.getStringFromShaderAnyDataType(input.name);
      }
      const outputName = GLSLShader.getStringFromShaderAnyDataType(output.name);
      let rowStr = `${outputName} = ${inputName};\n`;
      if (i !== this.__pixelInputs.length - 1) {
        rowStr += '  ';
      }
      processStr += rowStr;
    }

    const end = `}`;

    return startArgs + args + endArgs + processStr + end;

  }

  get pixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return this.__attributeNames;
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return this.__attributeSemantics;
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return this.__attributeCompositions;
  }
}
