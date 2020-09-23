import Primitive from "./Primitive";
import Material from "../materials/core/Material";
import { Size } from "../../commontypes/CommonTypes";
export default class Plane extends Primitive {
    constructor();
    /**
     * Generates a plane object
     * @param width the length of U(X)-axis direction
     * @param height the length of V(Y)-axis direction
     * @param uSpan number of spans in U(X)-axis direction
     * @param vSpan number of spans in V(Y)-axis direction
     * @param isUVRepeat draw uSpan times vSpan number of textures
     * @param flipTextureCoordinateY draw textures by flipping on the V(Y)-axis
     * @param material attach a rhodonite material to this plane(the default material is the classicUberMaterial)
     */
    generate({ width, height, uSpan, vSpan, isUVRepeat, flipTextureCoordinateY, material }: {
        width: Size;
        height: Size;
        uSpan: Size;
        vSpan: Size;
        isUVRepeat: boolean;
        flipTextureCoordinateY?: boolean;
        material?: Material;
    }): void;
}
