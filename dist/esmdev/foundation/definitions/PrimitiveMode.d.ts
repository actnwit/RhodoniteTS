import { EnumIO } from '../misc/EnumIO';
export declare type PrimitiveModeEnum = EnumIO;
declare function from(index: number): PrimitiveModeEnum | undefined;
export declare const PrimitiveMode: Readonly<{
    Unknown: EnumIO;
    Points: EnumIO;
    Lines: EnumIO;
    LineLoop: EnumIO;
    LineStrip: EnumIO;
    Triangles: EnumIO;
    TriangleStrip: EnumIO;
    TriangleFan: EnumIO;
    from: typeof from;
}>;
export {};
