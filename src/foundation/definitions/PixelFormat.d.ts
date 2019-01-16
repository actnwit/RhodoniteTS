import { EnumIO } from "../misc/EnumIO";
export interface PixelFormatEnum extends EnumIO {
}
export declare const PixelFormat: Readonly<{
    DepthComponent: PixelFormatEnum;
    Alpha: PixelFormatEnum;
    RGB: PixelFormatEnum;
    RGBA: PixelFormatEnum;
    Luminance: PixelFormatEnum;
    LuminanceAlpha: PixelFormatEnum;
}>;
