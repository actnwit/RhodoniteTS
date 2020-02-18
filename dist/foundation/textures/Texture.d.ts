import { PixelFormatEnum } from "../definitions/PixelFormat";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import AbstractTexture from "./AbstractTexture";
import { TypedArray } from "../../commontypes/CommonTypes";
export default class Texture extends AbstractTexture {
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    constructor();
    private __getResizedCanvas;
    generateTextureFromBasis(uint8Array: Uint8Array, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }?: {
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
    }): Promise<void>;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }?: {
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
    }): void;
    generateTextureFromUri(imageUri: string, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }?: {
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
    }): Promise<unknown>;
    generate1x1TextureFrom(rgbaStr?: string): void;
    generateTextureFromTypedArray(typedArray: TypedArray, { level, internalFormat, format, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }: {
        level: number;
        internalFormat: PixelFormatEnum;
        format: PixelFormatEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap: boolean;
        anisotropy: boolean;
    }): void;
}
