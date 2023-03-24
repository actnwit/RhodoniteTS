import { PixelFormatEnum } from '../definitions/PixelFormat';
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
        generateMipmap?: boolean;
    }): void;
    private __setBasisTexture;
    generateTextureFromKTX2(uint8Array: Uint8Array): Promise<void>;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        generateMipmap?: boolean | undefined;
    }): void;
    generateTextureFromUri(imageUri: string, { level, internalFormat, format, type, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        generateMipmap?: boolean | undefined;
    }): Promise<void>;
    generate1x1TextureFrom(rgbaStr?: string): void;
    generateSheenLutTextureFromDataUri(): Promise<void>;
    generateTextureFromTypedArray(typedArray: TypedArray, { level, internalFormat, format, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
    }): void;
    generateCompressedTextureFromTypedArray(typedArray: TypedArray, width: number, height: number, compressionTextureType: CompressionTextureTypeEnum): void;
    generateCompressedTextureWithMipmapFromTypedArray(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    destroy3DAPIResources(): boolean;
}
