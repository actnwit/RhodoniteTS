import { RnObject } from '../core/RnObject';
import { PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { CGAPIResourceHandle, Size, Index } from '../../types/CommonTypes';
import { TextureDataFloat } from './TextureDataFloat';
import { ColorRgb } from '../math/ColorRgb';
import { ColorRgba } from '../math/ColorRgba';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
export declare abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
    protected __level: Index;
    protected __internalFormat: TextureParameterEnum;
    protected __format: PixelFormatEnum;
    protected __type: ComponentTypeEnum;
    protected __magFilter: TextureParameterEnum;
    protected __minFilter: TextureParameterEnum;
    protected __wrapS: TextureParameterEnum;
    protected __wrapT: TextureParameterEnum;
    protected __anisotropy: boolean;
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
    protected static __textureMap: Map<CGAPIResourceHandle, AbstractTexture>;
    _textureResourceUid: CGAPIResourceHandle;
    _samplerResourceUid: CGAPIResourceHandle;
    constructor();
    get textureUID(): number;
    get width(): Size;
    set width(val: Size);
    get height(): Size;
    set height(val: Size);
    get isTextureReady(): boolean;
    get startedToLoad(): boolean;
    get htmlImageElement(): HTMLImageElement | undefined;
    get htmlCanvasElement(): HTMLCanvasElement;
    get uri(): string | undefined;
    static getRhodoniteTexture(textureUid: CGAPIResourceHandle): AbstractTexture | undefined;
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
    get magFilter(): import("..").EnumIO;
    get minFilter(): import("..").EnumIO;
    get wrapS(): import("..").EnumIO;
    get wrapT(): import("..").EnumIO;
}
