import Primitive from "./Primitive";
import Material from "../materials/Material";
import { Size } from "../../types/CommonTypes";
export default class Sphere extends Primitive {
    constructor();
    generate({ radius, widthSegments, heightSegments, material }: {
        radius: number;
        widthSegments: Size;
        heightSegments: Size;
        material?: Material;
    }): void;
}
