import RnObject from "../core/RnObject";
import { CGAPIResourceHandle, Size } from "../../types/CommonTypes";
export default abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
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
    get isTransparent(): boolean;
}
