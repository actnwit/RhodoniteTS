import { EnumIO } from '../misc/EnumIO';
export interface TextureParameterEnum extends EnumIO {
    webgpu: string;
}
declare function from(index: number): TextureParameterEnum;
declare function migrateToWebGL1InternalFormat(tp: TextureParameterEnum): TextureParameterEnum;
export declare const TextureParameter: Readonly<{
    Nearest: TextureParameterEnum;
    Linear: TextureParameterEnum;
    NearestMipmapNearest: TextureParameterEnum;
    LinearMipmapNearest: TextureParameterEnum;
    NearestMipmapLinear: TextureParameterEnum;
    LinearMipmapLinear: TextureParameterEnum;
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
    MirroredRepeat: TextureParameterEnum;
    RGB8: TextureParameterEnum;
    RGBA8: TextureParameterEnum;
    RGB10_A2: TextureParameterEnum;
    RG16F: TextureParameterEnum;
    RG32F: TextureParameterEnum;
    RGB16F: TextureParameterEnum;
    RGB32F: TextureParameterEnum;
    RGBA16F: TextureParameterEnum;
    RGBA32F: TextureParameterEnum;
    Depth16: TextureParameterEnum;
    Depth24: TextureParameterEnum;
    Depth32F: TextureParameterEnum;
    Depth24Stencil8: TextureParameterEnum;
    Depth32FStencil8: TextureParameterEnum;
    from: typeof from;
    migrateToWebGL1InternalFormat: typeof migrateToWebGL1InternalFormat;
}>;
export {};
