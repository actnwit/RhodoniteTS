import Primitive from "./Primitive";
import Material from "../materials/Material";
export default class Sphere extends Primitive {
    constructor();
    generate({ radius, widthSegments, heightSegments, material }: {
        radius: number;
        widthSegments: Size;
        heightSegments: Size;
        material?: Material;
    }): void;
}
