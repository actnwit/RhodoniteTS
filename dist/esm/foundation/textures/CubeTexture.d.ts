import { AbstractTexture } from './AbstractTexture';
import { Size, TypedArray } from '../../types/CommonTypes';
export declare class CubeTexture extends AbstractTexture implements Disposable {
    baseUriToLoad?: string;
    mipmapLevelNumber: number;
    hdriFormat: import("..").EnumIO;
    isNamePosNeg: boolean;
    private __onTextureLoadedArray;
    private static managedRegistry;
    constructor();
    private __setTextureResourceUid;
    registerOnTextureLoaded(func: () => void): void;
    loadTextureImages(): Promise<void>;
    loadTextureImagesAsync(): Promise<void>;
    loadTextureImagesFromBasis(uint8Array: Uint8Array, { magFilter, minFilter, wrapS, wrapT, }?: {
        magFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        minFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapS?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
        wrapT?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    }): void;
    load1x1Texture(rgbaStr?: string): void;
    /**
     * Generate cubemap texture object from typed array of cubemap images
     * @param typedArrays Array of typed array object for cubemap textures. The nth element is the nth mipmap reduction level(level 0 is the base image level).
     * @param width Texture width of the base image level texture
     * @param height Texture height of the base image level texture
     */
    generateTextureFromTypedArrays(typedArrayImages: Array<{
        posX: TypedArray;
        negX: TypedArray;
        posY: TypedArray;
        negY: TypedArray;
        posZ: TypedArray;
        negZ: TypedArray;
    }>, baseLevelWidth: Size, baseLevelHeight: Size): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    private static __deleteInternalTexture;
    destroy3DAPIResources(): void;
    [Symbol.dispose](): void;
    destroy(): void;
}
