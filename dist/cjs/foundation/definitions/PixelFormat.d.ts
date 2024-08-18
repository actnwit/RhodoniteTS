import { EnumIO } from '../misc/EnumIO';
export type PixelFormatEnum = EnumIO;
declare function getCompositionNumFromPixelFormat(pixelFormat: PixelFormatEnum): number;
declare function from(index: number): PixelFormatEnum;
export declare const PixelFormat: Readonly<{
    DepthComponent: EnumIO;
    DepthStencil: EnumIO;
    Alpha: EnumIO;
    RG: EnumIO;
    RGB: EnumIO;
    RGBA: EnumIO;
    Luminance: EnumIO;
    LuminanceAlpha: EnumIO;
    from: typeof from;
    getCompositionNumFromPixelFormat: typeof getCompositionNumFromPixelFormat;
}>;
export {};
