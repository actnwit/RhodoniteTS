import { PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
export declare type VideoTextureArguments = {
    level: number;
    internalFormat: PixelFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    generateMipmap: boolean;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
    mutedAutoPlay: boolean;
    playButtonDomElement?: HTMLElement;
};
export declare class VideoTexture extends AbstractTexture {
    #private;
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    constructor();
    private __getResizedCanvas;
    generateTextureFromVideo(video: HTMLVideoElement, { level, internalFormat, format, type, generateMipmap, mutedAutoPlay, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        generateMipmap?: boolean | undefined;
        mutedAutoPlay?: boolean | undefined;
    }): void;
    generateTextureFromUri(videoUri: string, { level, internalFormat, format, type, generateMipmap, mutedAutoPlay, playButtonDomElement, }?: {
        level?: number | undefined;
        internalFormat?: import("..").EnumIO | undefined;
        format?: import("..").EnumIO | undefined;
        type?: ComponentTypeEnum | undefined;
        generateMipmap?: boolean | undefined;
        mutedAutoPlay?: boolean | undefined;
        playButtonDomElement?: undefined;
    }): Promise<void>;
    updateTexture(): void;
    getCurrentFramePixelData(): (number | Uint8Array | undefined)[];
    set playbackRate(value: number);
    get playbackRate(): number;
    play(): void;
    pause(): void;
}
