import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
import Texture from "../textures/Texture";


export default class Material extends RnObject {
  private static readonly InvalidMaterialUid: MaterialUID = -1;
  private static __materialUidCount: MaterialUID = Material.InvalidMaterialUid;
  private __materialUid: MaterialUID;
  public baseColor: MutableColorRgb = new MutableColorRgb(1, 1, 1);
  public alpha: number = 1;
  public baseColorTexture?: Texture

  constructor() {
    super(true);
    this.__materialUid = ++Material.__materialUidCount;
  }
}
