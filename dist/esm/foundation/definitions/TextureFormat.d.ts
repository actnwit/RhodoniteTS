import { EnumIO } from '../misc/EnumIO';
export interface TextureFormatEnum extends EnumIO {
    webgpu: string;
}
declare function from(index: number): TextureFormatEnum;
export declare const TextureFormat: Readonly<{
    RGB8: TextureFormatEnum;
    RGBA8: TextureFormatEnum;
    RGB10_A2: TextureFormatEnum;
    RG16F: TextureFormatEnum;
    RG32F: TextureFormatEnum;
    RGB16F: TextureFormatEnum;
    RGB32F: TextureFormatEnum;
    RGBA16F: TextureFormatEnum;
    RGBA32F: TextureFormatEnum;
    R11F_G11F_B10F: TextureFormatEnum;
    Depth16: TextureFormatEnum;
    Depth24: TextureFormatEnum;
    Depth32F: TextureFormatEnum;
    Depth24Stencil8: TextureFormatEnum;
    Depth32FStencil8: TextureFormatEnum;
    from: typeof from;
}>;
export {};
