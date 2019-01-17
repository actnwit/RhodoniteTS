import { EnumIO } from "../misc/EnumIO";
export interface TextureParameterEnum extends EnumIO {
}
export declare const TextureParameter: Readonly<{
    Nearest: TextureParameterEnum;
    Linear: TextureParameterEnum;
    TextureMagFilter: TextureParameterEnum;
    TextureMinFilter: TextureParameterEnum;
    TextureWrapS: TextureParameterEnum;
    TextureWrapT: TextureParameterEnum;
    Texture2D: TextureParameterEnum;
    Texture: TextureParameterEnum;
    Texture0: TextureParameterEnum;
    Texture1: TextureParameterEnum;
    ActiveTexture: TextureParameterEnum;
    Repeat: TextureParameterEnum;
    ClampToEdge: TextureParameterEnum;
    RGB8: TextureParameterEnum;
    RGBA8: TextureParameterEnum;
    RGB10_A2: TextureParameterEnum;
    RGB16F: TextureParameterEnum;
    RGB32F: TextureParameterEnum;
    RGBA16F: TextureParameterEnum;
    RGBA32F: TextureParameterEnum;
}>;
