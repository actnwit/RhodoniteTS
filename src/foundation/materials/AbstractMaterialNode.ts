import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import { CompositionTypeEnum, ComponentTypeEnum, VertexAttributeEnum } from "../main";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import GLSLShader from "../../webgl/shaders/GLSLShader";

export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;

export type ShaderSocket = {
  compositionType: CompositionTypeEnum,
  componentType: ComponentTypeEnum,
  name: ShaderAttributeOrSemanticsOrString,
  isImmediateValue: boolean,
  immediateValue?: string
}

type MaterialNodeUID = number;
type InputConnectionType = {materialNodeUid: number, outputNameOfPrev: string, inputNameOfThis: string};

export default abstract class AbstractMaterialNode extends RnObject {
  private __semantics: ShaderSemanticsInfo[] = [];
  private __shaderNode: ShaderNodeEnum[] = [];
  protected __vertexInputs: ShaderSocket[] = [];
  protected __pixelInputs: ShaderSocket[] = [];
  protected __vertexOutputs: ShaderSocket[] = [];
  protected __pixelOutputs: ShaderSocket[] = [];
  private static readonly __invalidMaterialNodeUid = -1;
  private static __invalidMaterialNodeCount = -1;
  private __materialNodeUid: MaterialNodeUID;
  protected __vertexInputConnections: InputConnectionType[] = [];
  protected __pixelInputConnections: InputConnectionType[] = [];
  static materialNodes: AbstractMaterialNode[] = [];
  public readonly shader: GLSLShader;
  public readonly shaderFunctionName: string;

  constructor(shader: GLSLShader, shaderFunctionName: string) {
    super();
    this.shader = shader;
    this.shaderFunctionName = shaderFunctionName;
    this.__materialNodeUid = ++AbstractMaterialNode.__invalidMaterialNodeCount;
    AbstractMaterialNode.materialNodes[AbstractMaterialNode.__invalidMaterialNodeCount] = this;
  }

  static getMaterialNode(materialNodeUid: MaterialNodeUID) {
    return AbstractMaterialNode.materialNodes[materialNodeUid];
  }

  get materialNodeUid() {
    return this.__materialNodeUid;
  }

  get _semanticsInfoArray() {
    return this.__semantics;
  }

  setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]) {
    this.__semantics = shaderSemanticsInfoArray;
  }

  addVertexInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string) {
    this.__vertexInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputNameOfPrev: outputNameOfPrev, inputNameOfThis: inputNameOfThis});
  }

  addPixelInputConnection(materialNode: AbstractMaterialNode, outputNameOfPrev: string, inputNameOfThis: string) {
    this.__pixelInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputNameOfPrev: outputNameOfPrev, inputNameOfThis: inputNameOfThis});
  }

  get vertexInputConnections(): InputConnectionType[] {
    return this.__vertexInputConnections;
  }

  get pixelInputConnections(): InputConnectionType[] {
    return this.__pixelInputConnections;
  }

  getVertexInput(name:string): ShaderSocket|undefined {
    for (let input of this.__vertexInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getVertexOutput(name:string): ShaderSocket|undefined {
    for (let output of this.__vertexOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }

  getPixelInput(name:string): ShaderSocket|undefined {
    for (let input of this.__pixelInputs) {
      if (input.name === name) {
        return input;
      }
    }
    return void 0;
  }

  getPixelOutput(name:string): ShaderSocket|undefined {
    for (let output of this.__pixelOutputs) {
      if (output.name === name) {
        return output;
      }
    }
    return void 0;
  }
}
