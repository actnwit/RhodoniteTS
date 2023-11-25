import { EnumIO } from '../misc/EnumIO';
export interface PrimitiveModeEnum extends EnumIO {
    getWebGPUTypeStr(): string;
}
declare function from(index: number): PrimitiveModeEnum | undefined;
export declare const PrimitiveMode: Readonly<{
    Unknown: PrimitiveModeEnum;
    Points: PrimitiveModeEnum;
    Lines: PrimitiveModeEnum;
    LineLoop: PrimitiveModeEnum;
    LineStrip: PrimitiveModeEnum;
    Triangles: PrimitiveModeEnum;
    TriangleStrip: PrimitiveModeEnum;
    TriangleFan: PrimitiveModeEnum;
    from: typeof from;
}>;
export {};
