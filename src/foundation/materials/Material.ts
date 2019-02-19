import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import { AlphaMode } from "../definitions/AlphaMode";


export default class Material extends RnObject {
  private static readonly InvalidMaterialUid: MaterialUID = -1;
  private static __materialUidCount: MaterialUID = Material.InvalidMaterialUid;
  private __materialUid: MaterialUID;
  public baseColor: MutableColorRgb = new MutableColorRgb(1, 1, 1);
  public alpha: number = 1;
  public baseColorTexture?: Texture
  public metallicFactor = 1.0;
  public roughnessFactor = 1.0;
  public metallicRoughnessTexture?: Texture;
  public normalTexture?: Texture;
  public occlusionTexture? :Texture;
  public emissiveTexture?: Texture;
  public emissiveFactor = Vector3.zero();
  public alphaMode = AlphaMode.Opaque;
  public alphaCutoff = 0.5;
  public doubleSided = false;

  constructor() {
    super(true);
    this.__materialUid = ++Material.__materialUidCount;
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}
