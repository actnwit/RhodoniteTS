import { EnumIO } from "../misc/EnumIO";
export interface BasisCompressionTypeEnum extends EnumIO {
}
declare function from(index: number): BasisCompressionTypeEnum;
declare function fromString(str: string): BasisCompressionTypeEnum;
export declare const BasisCompressionType: Readonly<{
    ETC1: BasisCompressionTypeEnum;
    ETC2: BasisCompressionTypeEnum;
    BC1: BasisCompressionTypeEnum;
    BC3: BasisCompressionTypeEnum;
    BC4: BasisCompressionTypeEnum;
    BC5: BasisCompressionTypeEnum;
    BC7_M5: BasisCompressionTypeEnum;
    BC7_M6_OPAQUE: BasisCompressionTypeEnum;
    PVRTC1_RGB: BasisCompressionTypeEnum;
    PVRTC1_RGBA: BasisCompressionTypeEnum;
    ASTC: BasisCompressionTypeEnum;
    ATC_RGB: BasisCompressionTypeEnum;
    ATC_RGBA: BasisCompressionTypeEnum;
    RGBA32: BasisCompressionTypeEnum;
    RGB565: BasisCompressionTypeEnum;
    BGR565: BasisCompressionTypeEnum;
    RGBA4444: BasisCompressionTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
