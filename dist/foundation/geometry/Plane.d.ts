import Primitive from "./Primitive";
import Material from "../materials/core/Material";
import { Size } from "../../types/CommonTypes";
export default class Plane extends Primitive {
    constructor();
    generate({ width, height, uSpan, vSpan, isUVRepeat, material }: {
        width: Size;
        height: Size;
        uSpan: Size;
        vSpan: Size;
        isUVRepeat: boolean;
        material?: Material;
    }): void;
}
