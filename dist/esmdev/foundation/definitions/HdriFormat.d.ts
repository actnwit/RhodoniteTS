import { EnumIO } from '../misc/EnumIO';
export type HdriFormatEnum = EnumIO;
declare function from(index: number): HdriFormatEnum;
declare function fromString(str: string): HdriFormatEnum;
export declare const HdriFormat: Readonly<{
    LDR_SRGB: EnumIO;
    LDR_LINEAR: EnumIO;
    HDR_LINEAR: EnumIO;
    RGBE_PNG: EnumIO;
    RGB9_E5_PNG: EnumIO;
    OpenEXR: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
