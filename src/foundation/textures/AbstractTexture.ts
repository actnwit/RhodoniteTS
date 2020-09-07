import RnObject from "../core/RnObject";
import { PixelFormat, PixelFormatEnum } from "../definitions/PixelFormat";
import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { TextureParameter, TextureParameterEnum } from "../definitions/TextureParameter";
import { CGAPIResourceHandle, TextureUID, Size, Index } from "../../commontypes/CommonTypes";
import TextureDataFloat from "./TextureDataFloat";

export default abstract class AbstractTexture extends RnObject {
  protected __width: Size = 0;
  protected __height: Size = 0;
  protected __level: Index = 0;
  protected __internalFormat: PixelFormatEnum = PixelFormat.RGBA;
  protected __format: PixelFormatEnum = PixelFormat.RGBA;
  protected __type: ComponentTypeEnum = ComponentType.UnsignedByte;
  protected __magFilter: TextureParameterEnum = TextureParameter.Linear;
  protected __minFilter: TextureParameterEnum = TextureParameter.Linear;
  protected __wrapS: TextureParameterEnum = TextureParameter.ClampToEdge;
  protected __wrapT: TextureParameterEnum = TextureParameter.ClampToEdge;

  protected __hasTransparentPixels = false;

  private static readonly InvalidTextureUid: TextureUID = -1;
  private static __textureUidCount: TextureUID = AbstractTexture.InvalidTextureUid;
  private __textureUid: TextureUID;
  protected __img?: HTMLImageElement;
  public cgApiResourceUid: CGAPIResourceHandle = -1;
  protected __isTextureReady = false;
  protected __startedToLoad = false;
  protected __htmlImageElement?: HTMLImageElement;
  protected __htmlCanvasElement?: HTMLCanvasElement;
  protected __canvasContext?: CanvasRenderingContext2D;
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
    return Math.pow(2, Math.round(Math.log(x) / Math.LN2));
  }

  get htmlImageElement() {
    return this.__htmlImageElement;
  }

  get htmlCanvasElement() {
    if (this.__htmlCanvasElement == null) {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d")!;
      ctx.drawImage(this.__htmlImageElement!, 0, 0, this.__htmlImageElement!.width, this.__htmlImageElement!.height);
      this.__htmlCanvasElement = canvas;
    }
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

  getImageData(x: Index, y: Index, width: Size, height: Size) {
    return this.__canvasContext!.getImageData(x, y, width, height);
  }

  get isTransparent() {
    return this.__hasTransparentPixels;
  }

  createInternalCanvasContext() {
    let canvas;
    if (this.__htmlCanvasElement != null) {
      canvas = this.__htmlCanvasElement;
    } else {
      canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
    }
    this.__htmlCanvasElement = canvas;
    this.__canvasContext = canvas.getContext("2d")!;
  }

  getTextureDataFloat(channels: Size) {
    const pixel = this.getImageData(0, 0, this.width, this.height);
    const textureDataFloat = new TextureDataFloat(this.width, this.height, channels);
    const data = pixel.data;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < channels; k++) {
          textureDataFloat.setPixelAtChannel(j, i, k, data[(i * this.width * 4) + (j * 4) + k] / 255);
        }
      }
    }
    return textureDataFloat;
  }
}
