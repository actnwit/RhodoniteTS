import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo, ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import { CompositionTypeEnum, ComponentTypeEnum, VertexAttributeEnum } from "../main";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";

export type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;

export type ShaderSocket = {
  compositionType: CompositionTypeEnum,
  componentType: ComponentTypeEnum,
  name: ShaderAttributeOrSemanticsOrString,
  isImmediateValue: boolean,
  immediateValue?: string
}

type MaterialNodeUID = number;
type InputConnectionType = {materialNodeUid: number, outputName: string};

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

  constructor() {
    super();
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

  addVertexInputConnection(materialNode: AbstractMaterialNode, outputName: string) {
    this.__vertexInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputName: outputName});
  }

  addPixelInputConnection(materialNode: AbstractMaterialNode, outputName: string) {
    this.__pixelInputConnections.push({materialNodeUid: materialNode.materialNodeUid, outputName: outputName});
  }

}
