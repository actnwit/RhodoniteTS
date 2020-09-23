import { EnumClass, EnumIO } from "../misc/EnumIO";
import { Index } from "../../commontypes/CommonTypes";
export interface VertexAttributeEnum extends EnumIO {
    getAttributeSlot(): Index;
    shaderStr: string;
}
export declare class VertexAttributeClass extends EnumClass implements VertexAttributeEnum {
    private __attributeSlot;
    private __shaderStr;
    constructor({ index, str, shaderStr, attributeSlot }: {
        index: number;
        str: string;
        shaderStr: string;
        attributeSlot: Index;
    });
    getAttributeSlot(): Index;
    get shaderStr(): string;
}
declare function from(index: number): VertexAttributeEnum;
declare function fromString(str: string): VertexAttributeEnum;
export declare const VertexAttribute: Readonly<{
    Unknown: VertexAttributeEnum;
    Position: VertexAttributeEnum;
    Normal: VertexAttributeEnum;
    Tangent: VertexAttributeEnum;
    Texcoord0: VertexAttributeEnum;
    Texcoord1: VertexAttributeEnum;
    Color0: VertexAttributeEnum;
    Joints0: VertexAttributeEnum;
    Weights0: VertexAttributeEnum;
    Instance: VertexAttributeEnum;
    FaceNormal: VertexAttributeEnum;
    BaryCentricCoord: VertexAttributeEnum;
    AttributeTypeNumber: number;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
