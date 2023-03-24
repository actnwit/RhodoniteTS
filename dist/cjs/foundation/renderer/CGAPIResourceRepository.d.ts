import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { Index, Size, TypedArray, WebGLResourceHandle } from '../../types/CommonTypes';
import type { PixelFormatEnum } from '../definitions/PixelFormat';
import type { ComponentTypeEnum } from '../definitions/ComponentType';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
export declare type DirectTextureData = TypedArray | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
export declare type ImageBitmapData = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
export declare abstract class CGAPIResourceRepository {
    static readonly InvalidCGAPIResourceUid = -1;
    static getWebGLResourceRepository(): WebGLResourceRepository;
}
export interface ICGAPIResourceRepository {
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy, isPremultipliedAlpha, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        generateMipmap: boolean;
        anisotropy: boolean;
        isPremultipliedAlpha: boolean;
    }): {
        textureHandle: WebGLResourceHandle;
        samplerHandle: WebGLResourceHandle;
    };
}
