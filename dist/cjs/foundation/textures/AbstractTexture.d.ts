import { RnObject } from '../core/RnObject';
import { PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { CGAPIResourceHandle, Size, Index } from '../../types/CommonTypes';
import { TextureDataFloat } from './TextureDataFloat';
import { ColorRgb } from '../math/ColorRgb';
import { ColorRgba } from '../math/ColorRgba';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Sampler } from './Sampler';
import { TextureFormatEnum } from '../definitions/TextureFormat';
export declare abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
    protected __level: Index;
    protected __mipLevelCount: Index;
    protected __internalFormat: TextureFormatEnum;
    protected __format: PixelFormatEnum;
    protected __type: ComponentTypeEnum;
    protected __hasTransparentPixels: boolean;
    private static readonly InvalidTextureUid;
    private static __textureUidCount;
    private __textureUid;
    protected __img?: HTMLImageElement;
    protected __isTextureReady: boolean;
    protected __startedToLoad: boolean;
    protected __htmlImageElement?: HTMLImageElement;
    protected __htmlCanvasElement?: HTMLCanvasElement;
    protected __canvasContext?: CanvasRenderingContext2D;
    protected __uri?: string;
    protected __name: string;
    _textureResourceUid: CGAPIResourceHandle;
    _samplerResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    _recommendedTextureSampler?: Sampler;
    constructor();
    get textureUID(): number;
    get width(): Size;
    getWidthAtMipLevel(mipLevel: Index): number;
    getHeightAtMipLevel(mipLevel: Index): number;
    set width(val: Size);
    get height(): Size;
    set height(val: Size);
    get isTextureReady(): boolean;
    get startedToLoad(): boolean;
    get htmlImageElement(): HTMLImageElement | undefined;
    get htmlCanvasElement(): HTMLCanvasElement;
    get uri(): string | undefined;
    set name(name: string);
    get name(): string;
    getImageData(x: Index, y: Index, width: Size, height: Size): ImageData;
    getPixelAs(x: Index, y: Index, typeClass: typeof ColorRgb | typeof ColorRgba | typeof Vector3 | typeof MutableVector3 | typeof Vector4 | typeof MutableVector4): any;
    /**
     * get the pixel data at (x,y) in the Texture as Uint8Clamped Array
     * @param x x position in the texture
     * @param y y position in the texture
     * @returns a pixel data as Uint8Clamped Array
     */
    getPixelAsArray(x: Index, y: Index): Uint8ClampedArray;
    setPixel(x: Index, y: Index, value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4): void;
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    get isTransparent(): boolean;
    createInternalCanvasContext(): void;
    getTextureDataFloat(channels: Size): TextureDataFloat;
}
