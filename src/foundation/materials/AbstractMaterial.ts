import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";
import { AlphaMode } from "../definitions/AlphaMode";
import { MaterialElementEnum } from "../definitions/MaterialElement";


export default abstract class AbstractMaterial extends RnObject {
  private static readonly InvalidMaterialUid: MaterialUID = -1;
  private static __materialUidCount: MaterialUID = AbstractMaterial.InvalidMaterialUid;
  private __materialUid: MaterialUID;

  public alpha: number = 1;
  public alphaMode = AlphaMode.Opaque;
  public alphaCutoff = 0.5;
  public doubleSided = false;
  public isWireframe = false;
  public isWireframeOnShade = false;
  public wireframeWidth = 1.0;

  public materialElement: MaterialElementEnum;

  public baseColor: MutableColorRgb = new MutableColorRgb(1, 1, 1);
  public baseColorTexture?: Texture

  constructor(materialElement: MaterialElementEnum) {
    super(true);
    this.__materialUid = ++AbstractMaterial.__materialUidCount;
    this.materialElement = materialElement;
  }

  isBlend() {
    if (this.alphaMode === AlphaMode.Blend) {
      return true;
    } else {
      return false;
    }
  }
}
