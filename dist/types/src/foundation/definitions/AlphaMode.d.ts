import { EnumIO } from "../misc/EnumIO";
export interface AlphaModeEnum extends EnumIO {
}
declare function from(index: number): AlphaModeEnum;
declare function fromString(str: string): AlphaModeEnum;
export declare const AlphaMode: Readonly<{
    Opaque: AlphaModeEnum;
    Mask: AlphaModeEnum;
    Blend: AlphaModeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
