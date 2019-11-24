import AbstractTexture from "./AbstractTexture";
export default class Texture extends AbstractTexture {
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    constructor();
    private __getResizedCanvas;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }?: {
        level?: number | undefined;
        internalFormat?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
        format?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
        type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
        magFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        minFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapS?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapT?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
    }): void;
    generateTextureFromUri(imageUri: string, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }?: {
        level?: number | undefined;
        internalFormat?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
        format?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
        type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
        magFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        minFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapS?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapT?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        generateMipmap?: boolean | undefined;
        anisotropy?: boolean | undefined;
    }): Promise<unknown>;
    generate1x1TextureFrom(rgbaStr?: string): void;
}
