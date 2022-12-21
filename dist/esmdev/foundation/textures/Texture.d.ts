import { PixelFormatEnum } from '../definitions/PixelFormat';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
import { TypedArray, Count } from '../../types/CommonTypes';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { CompressionTextureTypeEnum } from '../definitions/CompressionTextureType';
import { TextureData } from '../../webgl/WebGLResourceRepository';
export declare class Texture extends AbstractTexture {
    autoResize: boolean;
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    private static __BasisFile?;
    constructor();
    generateTextureFromBasis(uint8Array: Uint8Array, options: {
        level?: Count;
        internalFormat?: PixelFormatEnum;
        format?: PixelFormatEnum;
        type?: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap?: boolean;
        anisotropy?: boolean;
        isPremultipliedAlpha?: boolean;
    }): void;
    private __setBasisTexture;
    generateTextureFromKTX2(uint8Array: Uint8Array, { magFilter, minFilter, wrapS, wrapT, anisotropy, }?: {
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        anisotropy?: boolean | undefined;
    }): Promise<void>;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): void;
    generateTextureFromUri(imageUri: string, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): Promise<void>;
    generate1x1TextureFrom(rgbaStr?: string): void;
    generateTextureFromTypedArray(typedArray: TypedArray, { level, internalFormat, format, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): void;
    generateCompressedTextureFromTypedArray(typedArray: TypedArray, width: number, height: number, compressionTextureType: CompressionTextureTypeEnum, { magFilter, minFilter, wrapS, wrapT, anisotropy, }?: {
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        anisotropy?: boolean | undefined;
    }): void;
    generateCompressedTextureWithMipmapFromTypedArray(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum, { magFilter, minFilter, wrapS, wrapT, anisotropy, }?: {
        magFilter?: import("..").EnumIO | undefined;
        minFilter?: import("..").EnumIO | undefined;
        wrapS?: import("..").EnumIO | undefined;
        wrapT?: import("..").EnumIO | undefined;
        anisotropy?: boolean | undefined;
    }): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    destroy3DAPIResources(): boolean;
}
