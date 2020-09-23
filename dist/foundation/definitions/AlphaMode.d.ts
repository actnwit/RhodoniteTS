import { EnumIO } from "../misc/EnumIO";
export interface AlphaModeEnum extends EnumIO {
}
declare function from(index: number): AlphaModeEnum | undefined;
declare function fromString(str: string): AlphaModeEnum | undefined;
declare function fromGlTFString(str: string): AlphaModeEnum | undefined;
export declare const AlphaMode: Readonly<{
    Opaque: AlphaModeEnum;
    Mask: AlphaModeEnum;
    Translucent: AlphaModeEnum;
    Additive: AlphaModeEnum;
    from: typeof from;
    fromString: typeof fromString;
    fromGlTFString: typeof fromGlTFString;
}>;
export {};
