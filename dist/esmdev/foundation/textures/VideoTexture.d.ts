import { type ComponentTypeEnum } from '../definitions/ComponentType';
import { type PixelFormatEnum } from '../definitions/PixelFormat';
import type { TextureParameterEnum } from '../definitions/TextureParameter';
import { AbstractTexture } from './AbstractTexture';
/**
 * Configuration options for VideoTexture creation and processing.
 */
export type VideoTextureArguments = {
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
/**
 * A texture class that handles video content as texture data.
 * Extends AbstractTexture to provide video-specific functionality including
 * video loading, playback control, and real-time texture updates.
 *
 * @example
 * ```typescript
 * const videoTexture = new VideoTexture();
 * await videoTexture.generateTextureFromUri('path/to/video.mp4');
 * videoTexture.play();
 * ```
 */
export declare class VideoTexture extends AbstractTexture {
    #private;
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    /**
     * Creates a resized canvas from an image, maintaining aspect ratio and ensuring power-of-two dimensions.
     * Optionally detects transparency in the image data.
     *
     * @param image - The source image to resize
     * @param maxSize - Maximum size constraint for the output canvas
     * @returns A canvas element containing the resized image
     * @private
     */
    private __getResizedCanvas;
    /**
     * Generates a texture from an existing HTMLVideoElement.
     * Sets up the video element for playback and creates the corresponding WebGL texture.
     *
     * @param video - The HTMLVideoElement to use as texture source
     * @param options - Configuration options for texture generation
     * @param options.level - Mipmap level (default: 0)
     * @param options.internalFormat - Internal pixel format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: false)
     * @param options.mutedAutoPlay - Whether to enable muted autoplay (default: true)
     *
     * @example
     * ```typescript
     * const video = document.getElementById('myVideo') as HTMLVideoElement;
     * await videoTexture.generateTextureFromVideo(video, {
     *   generateMipmap: true,
     *   mutedAutoPlay: false
     * });
     * ```
     */
    generateTextureFromVideo(video: HTMLVideoElement, { _level, internalFormat, format, type, generateMipmap, mutedAutoPlay, }?: {
        _level?: number | undefined;
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        internalFormat?: import("..").TextureFormatEnum | undefined;
        mutedAutoPlay?: boolean | undefined;
        type?: {
            toString(): string;
            toJSON(): number;
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            get wgsl(): string;
            get webgpu(): string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
        } | undefined;
    }): Promise<void>;
    /**
     * Generates a texture from a video file URI.
     * Creates a video element, loads the specified video, and sets up texture generation.
     * Supports both automatic playback and manual playback via a play button.
     *
     * @param videoUri - URI of the video file to load
     * @param options - Configuration options for texture generation
     * @param options.level - Mipmap level (default: 0)
     * @param options.internalFormat - Internal pixel format (default: RGBA8)
     * @param options.format - Pixel format (default: RGBA)
     * @param options.type - Component type (default: UnsignedByte)
     * @param options.generateMipmap - Whether to generate mipmaps (default: false)
     * @param options.mutedAutoPlay - Whether to enable muted autoplay (default: true)
     * @param options.playButtonDomElement - Optional button element to trigger manual playback
     * @returns Promise that resolves when the texture is ready
     *
     * @example
     * ```typescript
     * const playButton = document.getElementById('playBtn');
     * await videoTexture.generateTextureFromUri('video.mp4', {
     *   mutedAutoPlay: false,
     *   playButtonDomElement: playButton
     * });
     * ```
     */
    generateTextureFromUri(videoUri: string, { _level, internalFormat, format, type, generateMipmap, mutedAutoPlay, playButtonDomElement, }?: {
        _level?: number | undefined;
        format?: import("..").EnumIO | undefined;
        generateMipmap?: boolean | undefined;
        internalFormat?: import("..").TextureFormatEnum | undefined;
        mutedAutoPlay?: boolean | undefined;
        playButtonDomElement?: undefined;
        type?: {
            toString(): string;
            toJSON(): number;
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            get wgsl(): string;
            get webgpu(): string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
        } | undefined;
    }): Promise<void>;
    /**
     * Updates the texture with the current video frame.
     * Should be called regularly (e.g., in a render loop) to keep the texture
     * synchronized with the video playback.
     *
     * @example
     * ```typescript
     * // In render loop
     * function render() {
     *   videoTexture.updateTexture();
     *   // ... other rendering code
     *   requestAnimationFrame(render);
     * }
     * ```
     */
    updateTexture(): void;
    /**
     * Retrieves the pixel data of the current video frame.
     * Useful for image processing or analysis of video content.
     *
     * @returns A tuple containing [pixelData, width, height] where pixelData is a Uint8Array
     *          of RGBA values, or [undefined, width, height] if texture is not ready
     *
     * @example
     * ```typescript
     * const [pixels, width, height] = videoTexture.getCurrentFramePixelData();
     * if (pixels) {
     *   // Process pixel data
     *   console.log(`Frame size: ${width}x${height}, pixels: ${pixels.length}`);
     * }
     * ```
     */
    getCurrentFramePixelData(): (number | Uint8Array<ArrayBufferLike> | undefined)[];
    /**
     * Sets the playback rate of the video.
     *
     * @param value - Playback rate multiplier (1.0 = normal speed, 2.0 = double speed, 0.5 = half speed)
     *
     * @example
     * ```typescript
     * videoTexture.playbackRate = 2.0; // Play at double speed
     * ```
     */
    set playbackRate(value: number);
    /**
     * Gets the current playback rate of the video.
     *
     * @returns The current playback rate, or 1 if no video element is available
     *
     * @example
     * ```typescript
     * const currentRate = videoTexture.playbackRate;
     * console.log(`Current playback rate: ${currentRate}`);
     * ```
     */
    get playbackRate(): number;
    /**
     * Starts or resumes video playback.
     *
     * @example
     * ```typescript
     * videoTexture.play();
     * ```
     */
    play(): void;
    /**
     * Pauses video playback.
     *
     * @example
     * ```typescript
     * videoTexture.pause();
     * ```
     */
    pause(): void;
}
