import RnObject from "../core/RnObject";
import { PixelFormat } from "../definitions/PixelFormat";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import { TextureParameter } from "../definitions/TextureParameter";
import ModuleManager from "../system/ModuleManager";
import ColorRgb from "../math/ColorRgb";
import ColorRgba from "../math/ColorRgba";
import Vector4 from "../math/Vector4";
import Vector3 from "../math/Vector3";
import MutableVector3 from "../math/MutableVector3";
import MutableVector4 from "../math/MutableVector4";

export default abstract class AbstractTexture extends RnObject {
  protected __width: Size = 0;
  protected __height: Size = 0;

  private static readonly InvalidTextureUid: TextureUID = -1;
  private static __textureUidCount: TextureUID = AbstractTexture.InvalidTextureUid;
  private __textureUid: TextureUID;
  protected __img?: HTMLImageElement;
  private __canvasContext?: CanvasRenderingContext2D;
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

  set width(val: Size) {
    this.__width = val;
  }

  get height() {
    return this.__height;
  }

  set height(val: Size) {
    this.__height = val;
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

  _getResizedCanvas(image: HTMLImageElement) {
    var canvas = document.createElement("canvas");
    canvas.width = this.__getNearestPowerOfTwo(image.width);
    canvas.height = this.__getNearestPowerOfTwo(image.height);

    this.__canvasContext = canvas.getContext("2d")!;
    this.__canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  generateTextureFromImage(image: HTMLImageElement) {
    this.__startedToLoad = true;
    this.__htmlImageElement = image;
    let imgCanvas = this._getResizedCanvas(image);
    this.__htmlCanvasElement = imgCanvas;

    this.__width = imgCanvas.width;
    this.__height = imgCanvas.height;

    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    let texture = webglModule.WebGLResourceRepository.getInstance().createTexture(
      imgCanvas, {
        level: 0, internalFormat: PixelFormat.RGBA, width: this.__width, height: this.__height,
        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear,
        wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: true, anisotropy: true
      });

    this.cgApiResourceUid = texture;
    this.__isTextureReady = true;
    this.__uri = image.src;

    AbstractTexture.__textureMap.set(texture, this);
  }

  generateTextureFromUri(imageUri: string) {
    this.__uri = imageUri;
    this.__startedToLoad = true;
    return new Promise((resolve, reject)=> {
      this.__img = new Image();
      if (!imageUri.match(/^data:/)) {
        this.__img.crossOrigin = 'Anonymous';
      }
      this.__img.onload = () => {
        this.__htmlImageElement = this.__img;
        let imgCanvas = this._getResizedCanvas(this.__img!);
        this.__htmlCanvasElement = imgCanvas;
        this.__width = imgCanvas.width;
        this.__height = imgCanvas.height;

        const moduleManager = ModuleManager.getInstance();
        const moduleName = 'webgl';
        const webglModule = (moduleManager.getModule(moduleName)! as any);
        let texture = webglModule.WebGLResourceRepository.getInstance().createTexture(
          imgCanvas, {
            level: 0, internalFormat: PixelFormat.RGBA, width: this.__width, height: this.__height,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: true, anisotropy: true
          });

        this.cgApiResourceUid = texture;
        this.__isTextureReady = true;
        AbstractTexture.__textureMap.set(texture, this);

        resolve();
      };

      this.__img.src = imageUri;
    });
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

  getImageData(x: Index, y:Index, width: Size, height: Size) {
    return this.__canvasContext!.getImageData(x, y, width, height);
  }

  getPixelAs(x: Index, y:Index, typeClass:
    typeof ColorRgb| typeof ColorRgba | typeof Vector3 | typeof MutableVector3 | typeof Vector4 | typeof MutableVector4) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    if (typeClass.compositionType === CompositionType.Vec4) {
      return new (typeClass as any)(data[0], data[1], data[2], data[3]);
    } else {
      return new (typeClass as any)(data[0], data[1], data[2]);
    }
  }

  getPixelAsArray(x: Index, y:Index) {
    const pixel = this.getImageData(x, y, 1, 1);
    return pixel.data;
  }

  setPixel(x: Index, y:Index, value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    for (let i=0; i<(value as any).compositionType.getNumberOfComponents(); i++) {
      data[i] = value.v[i];
    }
    this.__canvasContext!.putImageData(pixel, x, y);
  }

  setPixelAtChannel(x: Index, y:Index, channelIdx: Index, value: number) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    data[channelIdx] = value;
    this.__canvasContext!.putImageData(pixel, x, y);
  }
}
