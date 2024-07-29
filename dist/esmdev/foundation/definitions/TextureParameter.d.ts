import { EnumIO } from '../misc/EnumIO';
export interface TextureParameterEnum extends EnumIO {
    webgpu: string;
}
declare function from(index: number): TextureParameterEnum;
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
    from: typeof from;
}>;
export {};
