import RnObject from "../core/Object";
import Vector3 from "../math/Vector3";
import ColorRgb from "../math/ColorRgb";


export default class Material extends RnObject {
  private static readonly InvalidMaterialUid: MaterialUID = -1;
  private static __materialUidCount: MaterialUID = Material.InvalidMaterialUid;
  private __materialUid: MaterialUID;
//  private __baseColor: ColorRgb;
//  private __alpha: number;

  constructor() {
    super(true);
    this.__materialUid = ++Material.__materialUidCount;
  }

}
