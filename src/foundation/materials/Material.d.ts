import RnObject from "../core/Object";
import MutableColorRgb from "../math/MutableColorRgb";
export default class Material extends RnObject {
    private static readonly InvalidMaterialUid;
    private static __materialUidCount;
    private __materialUid;
    baseColor: MutableColorRgb;
    alpha: number;
    constructor();
}
