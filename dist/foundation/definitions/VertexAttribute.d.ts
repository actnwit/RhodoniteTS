import { EnumIO } from "../misc/EnumIO";
export interface VertexAttributeEnum extends EnumIO {
    getAttributeSlot(): Index;
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
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
