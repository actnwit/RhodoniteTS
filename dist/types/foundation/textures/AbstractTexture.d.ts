import RnObject from "../core/RnObject";
import { CGAPIResourceHandle, Size } from "../../types/CommonTypes";
export default abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
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
    readonly textureUID: number;
    readonly width: number;
    readonly height: number;
    readonly isTextureReady: boolean;
    readonly startedToLoad: boolean;
    /**
     * get a value nearest power of two.
     *
     * @param x texture size.
     * @returns a value nearest power of two.
     */
    protected __getNearestPowerOfTwo(x: number): number;
    readonly htmlImageElement: HTMLImageElement | undefined;
    readonly htmlCanvasElement: HTMLCanvasElement | undefined;
    readonly uri: string | undefined;
    static getRhodoniteTexture(textureUid: CGAPIResourceHandle): AbstractTexture | undefined;
    name: string;
}
