import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import AbstractMaterial from "./AbstractMaterial";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import { CompositionType } from "../definitions/CompositionType";
import MathClassUtil from "../math/MathClassUtil";


export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];
  private __fields: Map<ShaderSemanticsEnum, any> = new Map();

  constructor(materialNodes: AbstractMaterialNode[]) {
    super(true);
    this.__materialNodes = materialNodes;

    this.initialize();
  }

  initialize() {
    this.__materialNodes.forEach((materialNode)=>{
      const semanticsInfoArray = materialNode._semanticsInfoArray;
      semanticsInfoArray.forEach((semanticsInfo)=>{
        this.__fields.set(semanticsInfo.semantic!, semanticsInfo.initialValue);
      });
    });
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum, value: any) {
    this.__fields.set(shaderSemantic, value);
  }

  getParameter(shaderSemantic: ShaderSemanticsEnum) {
    return this.__fields.get(shaderSemantic);
  }
}
