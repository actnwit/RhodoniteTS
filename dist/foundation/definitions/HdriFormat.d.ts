import { EnumIO } from "../misc/EnumIO";
export interface HdriFormatEnum extends EnumIO {
}
export declare const HdriFormat: Readonly<{
    LDR_SRGB: HdriFormatEnum;
    LDR_LINEAR: HdriFormatEnum;
    HDR: HdriFormatEnum;
    RGBE_PNG: HdriFormatEnum;
    RGB9_E5_PNG: HdriFormatEnum;
    OpenEXR: HdriFormatEnum;
}>;
