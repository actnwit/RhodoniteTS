import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import AbstractMaterial from "./AbstractMaterial";
import { ShaderNode } from "../definitions/ShaderNode";
import AbstractMaterialNode from "./AbstractMaterialNode";
import { ShaderSemanticsEnum } from "../definitions/ShaderSemantics";


export default class Material extends RnObject {
  private __materialNodes: AbstractMaterialNode[] = [];

  constructor() {
    super(true);
  }

  setParameter(shaderSemantic: ShaderSemanticsEnum) {
    
  }
}
