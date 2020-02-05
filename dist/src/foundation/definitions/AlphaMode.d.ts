import { EnumIO } from "../misc/EnumIO";
export interface AlphaModeEnum extends EnumIO {
}
declare function from(index: number): AlphaModeEnum | undefined;
declare function fromString(str: string): AlphaModeEnum | undefined;
export declare const AlphaMode: Readonly<{
    Opaque: AlphaModeEnum;
    Mask: AlphaModeEnum;
    Blend: AlphaModeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
