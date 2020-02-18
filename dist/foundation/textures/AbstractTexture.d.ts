import RnObject from "../core/RnObject";
import { PixelFormatEnum } from "../definitions/PixelFormat";
import { ComponentTypeEnum } from "../definitions/ComponentType";
import { TextureParameterEnum } from "../definitions/TextureParameter";
import { CGAPIResourceHandle, Size, Index } from "../../commontypes/CommonTypes";
import TextureDataFloat from "./TextureDataFloat";
export default abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
    protected __level: Index;
    protected __internalFormat: PixelFormatEnum;
    protected __format: PixelFormatEnum;
    protected __type: ComponentTypeEnum;
    protected __magFilter: TextureParameterEnum;
    protected __minFilter: TextureParameterEnum;
    protected __wrapS: TextureParameterEnum;
    protected __wrapT: TextureParameterEnum;
    protected __hasTransparentPixels: boolean;
    private static readonly InvalidTextureUid;
    private static __textureUidCount;
    private __textureUid;
    protected __img?: HTMLImageElement;
    cgApiResourceUid: CGAPIResourceHandle;
    protected __isTextureReady: boolean;
    protected __startedToLoad: boolean;
    protected __htmlImageElement?: HTMLImageElement;
    protected __htmlCanvasElement?: HTMLCanvasElement;
    protected __canvasContext?: CanvasRenderingContext2D;
    protected __uri?: string;
    protected __name: string;
    protected static __textureMap: Map<CGAPIResourceHandle, AbstractTexture>;
    constructor();
    get textureUID(): number;
    get width(): number;
    get height(): number;
    get isTextureReady(): boolean;
    get startedToLoad(): boolean;
    /**
     * get a value nearest power of two.
     *
     * @param x texture size.
     * @returns a value nearest power of two.
     */
    protected __getNearestPowerOfTwo(x: number): number;
    get htmlImageElement(): HTMLImageElement | undefined;
    get htmlCanvasElement(): HTMLCanvasElement;
    get uri(): string | undefined;
    static getRhodoniteTexture(textureUid: CGAPIResourceHandle): AbstractTexture | undefined;
    set name(name: string);
    get name(): string;
    getImageData(x: Index, y: Index, width: Size, height: Size): ImageData;
    get isTransparent(): boolean;
    createInternalCanvasContext(): void;
    getTextureDataFloat(channels: Size): TextureDataFloat;
}
