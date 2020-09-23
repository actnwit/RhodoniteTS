import { PixelFormatEnum } from "../definitions/PixelFormat";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import AbstractTexture from "./AbstractTexture";
import { TypedArray, Count } from "../../commontypes/CommonTypes";
import { ComponentTypeEnum } from "../../rhodonite";
export default class Texture extends AbstractTexture {
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    private static __BasisFile?;
    constructor();
    private __getResizedCanvas;
    generateTextureFromBasis(uint8Array: Uint8Array, options?: {
        level?: Count;
        internalFormat?: PixelFormatEnum;
        format?: PixelFormatEnum;
        type?: ComponentTypeEnum;
        magFilter?: TextureParameterEnum;
        minFilter?: TextureParameterEnum;
        wrapS?: TextureParameterEnum;
        wrapT?: TextureParameterEnum;
        generateMipmap?: boolean;
        anisotropy?: boolean;
        isPremultipliedAlpha?: boolean;
    }): void;
    private __setBasisTexture;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha }?: {
        level?: number | undefined;
        internalFormat?: PixelFormatEnum | undefined;
        format?: PixelFormatEnum | undefined;
        type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): void;
    generateTextureFromUri(imageUri: string, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha }?: {
        level?: number | undefined;
        internalFormat?: PixelFormatEnum | undefined;
        format?: PixelFormatEnum | undefined;
        type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): Promise<unknown>;
    generate1x1TextureFrom(rgbaStr?: string): void;
    generateTextureFromTypedArray(typedArray: TypedArray, { level, internalFormat, format, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha }?: {
        level?: number | undefined;
        internalFormat?: PixelFormatEnum | undefined;
        format?: PixelFormatEnum | undefined;
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
        isPremultipliedAlpha?: boolean | undefined;
    }): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
}
