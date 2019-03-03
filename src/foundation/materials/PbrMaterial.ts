import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";
import AbstractMaterial from "./AbstractMaterial";
import { ShaderNode } from "../definitions/ShaderNode";


export default class PbrMaterial extends AbstractMaterial {
  public metallicFactor = 1.0;
  public roughnessFactor = 1.0;
  public metallicRoughnessTexture?: Texture;
  public normalTexture?: Texture;
  public occlusionTexture? :Texture;
  public emissiveTexture?: Texture;
  public emissiveFactor = Vector3.zero();

  constructor() {
    super(ShaderNode.PBRShading);
  }
}
