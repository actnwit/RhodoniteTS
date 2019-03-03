import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import AbstractMaterial from "./AbstractMaterial";
import { ShaderNode } from "../definitions/ShaderNode";


export default class ClassicMaterial extends AbstractMaterial {
  public specularColor = new Vector3(1, 1, 1);
  public specularPower = 10.0;
  public specularMapTexture?: Texture;
  public normalTexture?: Texture;
  public occlusionTexture? :Texture;
  public emissiveTexture?: Texture;
  public emissiveFactor = Vector3.zero();

  constructor() {
    super(ShaderNode.ClassicShading);
  }
}
