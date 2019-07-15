import RnObject from "../core/RnObject";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { TextureParameter } from "../definitions/TextureParameter";
import ModuleManager from "../system/ModuleManager";
import { CGAPIResourceHandle, TextureUID, Size } from "../../types/CommonTypes";

export default abstract class AbstractTexture extends RnObject {
  protected __width: Size = 0;
  protected __height: Size = 0;

  private static readonly InvalidTextureUid: TextureUID = -1;
  private static __textureUidCount: TextureUID = AbstractTexture.InvalidTextureUid;
  private __textureUid: TextureUID;
  protected __img?: HTMLImageElement;
  public cgApiResourceUid: CGAPIResourceHandle = -1;
  protected __isTextureReady = false;
  protected __startedToLoad = false;
  protected __htmlImageElement?: HTMLImageElement;
  protected __htmlCanvasElement?: HTMLCanvasElement;
  protected __uri?: string;
  protected __name: string = 'untitled';
  protected static __textureMap: Map<CGAPIResourceHandle, AbstractTexture> = new Map();

  constructor() {
    super();
    this.__textureUid = ++AbstractTexture.__textureUidCount;
  }

  get textureUID() {
    return this.__textureUid;
  }

  get width() {
    return this.__width;
  }

  get height() {
    return this.__height;
  }

  get isTextureReady() {
    return this.__isTextureReady;
  }

  get startedToLoad() {
    return this.__startedToLoad;
  }

  /**
   * get a value nearest power of two.
   *
   * @param x texture size.
   * @returns a value nearest power of two.
   */
  protected __getNearestPowerOfTwo(x: number): number {
    return Math.pow( 2, Math.round( Math.log( x ) / Math.LN2 ) );
  }

  get htmlImageElement() {
    return this.__htmlImageElement;
  }

  get htmlCanvasElement() {
    return this.__htmlCanvasElement;
  }

  get uri() {
    return this.__uri;
  }

  static getRhodoniteTexture(textureUid: CGAPIResourceHandle) {
    return this.__textureMap.get(textureUid);
  }

  set name(name: string) {
    this.__name = name;
  }

  get name(): string {
    return this.__name;
  }
}
