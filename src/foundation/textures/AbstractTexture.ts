import { RnObject } from '../core/RnObject';
import { PixelFormat, PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentType, ComponentTypeEnum } from '../definitions/ComponentType';
import { TextureParameter, TextureParameterEnum } from '../definitions/TextureParameter';
import { CGAPIResourceHandle, TextureUID, Size, Index } from '../../types/CommonTypes';
import { TextureDataFloat } from './TextureDataFloat';
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';
import { ColorRgb } from '../math/ColorRgb';
import { ColorRgba } from '../math/ColorRgba';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Sampler } from './Sampler';

export abstract class AbstractTexture extends RnObject {
  protected __width: Size = 0;
  protected __height: Size = 0;
  protected __level: Index = 0;
  protected __internalFormat: TextureParameterEnum = TextureParameter.RGBA8;
  protected __format: PixelFormatEnum = PixelFormat.RGBA;
  protected __type: ComponentTypeEnum = ComponentType.UnsignedByte;

  protected __hasTransparentPixels = false;

  private static readonly InvalidTextureUid: TextureUID = -1;
  private static __textureUidCount: TextureUID = AbstractTexture.InvalidTextureUid;
  private __textureUid: TextureUID;
  protected __img?: HTMLImageElement;
  protected __isTextureReady = false;
  protected __startedToLoad = false;
  protected __htmlImageElement?: HTMLImageElement;
  protected __htmlCanvasElement?: HTMLCanvasElement;
  protected __canvasContext?: CanvasRenderingContext2D;
  protected __uri?: string;
  protected __name = 'untitled';
  protected static __textureMap: Map<CGAPIResourceHandle, AbstractTexture> = new Map();
  public _textureResourceUid: CGAPIResourceHandle = -1;
  public _samplerResourceUid: CGAPIResourceHandle = -1;
  public _textureViewResourceUid: CGAPIResourceHandle = -1;
  public _recommendedTextureSampler?: Sampler;

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

  get htmlImageElement() {
    return this.__htmlImageElement;
  }

  get htmlCanvasElement() {
    const canvas = document.createElement('canvas');
    const ctx = canvas?.getContext('2d');
    this.__htmlCanvasElement = canvas;
    if (Is.exist(ctx) && Is.exist(this.__htmlImageElement)) {
      canvas.width = this.__htmlImageElement.width;
      canvas.height = this.__htmlImageElement.height;
      ctx.drawImage(
        this.__htmlImageElement,
        0,
        0,
        this.__htmlImageElement.width,
        this.__htmlImageElement.height
      );
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
    if (this.__canvasContext === undefined) {
      this.createInternalCanvasContext();
    }

    return (this.__canvasContext as CanvasRenderingContext2D).getImageData(x, y, width, height);
  }

  getPixelAs(
    x: Index,
    y: Index,
    typeClass:
      | typeof ColorRgb
      | typeof ColorRgba
      | typeof Vector3
      | typeof MutableVector3
      | typeof Vector4
      | typeof MutableVector4
  ) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    if (typeClass.compositionType === CompositionType.Vec4) {
      return new (typeClass as any)(new Float32Array([data[0], data[1], data[2], data[3]]));
    } else {
      return new (typeClass as any)(new Float32Array([data[0], data[1], data[2]]));
    }
  }

  /**
   * get the pixel data at (x,y) in the Texture as Uint8Clamped Array
   * @param x x position in the texture
   * @param y y position in the texture
   * @returns a pixel data as Uint8Clamped Array
   */
  getPixelAsArray(x: Index, y: Index): Uint8ClampedArray {
    const pixel = this.getImageData(x, y, 1, 1);
    return pixel.data;
  }

  setPixel(
    x: Index,
    y: Index,
    value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4
  ) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    const classOfValue = value.constructor as unknown as {
      compositionType: CompositionTypeEnum; // value.constructor needs to have compositionType only
    };

    const numberOfComponents = classOfValue.compositionType.getNumberOfComponents();
    for (let i = 0; i < numberOfComponents; i++) {
      data[i] = value.at(i);
    }
    this.__canvasContext!.putImageData(pixel, x, y);
  }

  setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number) {
    const pixel = this.getImageData(x, y, 1, 1);
    const data = pixel.data;
    data[channelIdx] = value;
    this.__canvasContext!.putImageData(pixel, x, y);
  }

  get isTransparent() {
    return this.__hasTransparentPixels;
  }

  createInternalCanvasContext() {
    let canvas;
    if (this.__htmlCanvasElement != null) {
      canvas = this.__htmlCanvasElement;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
    }
    this.__htmlCanvasElement = canvas;
    this.__canvasContext = canvas.getContext('2d')!;
  }

  getTextureDataFloat(channels: Size): TextureDataFloat {
    const pixel = this.getImageData(0, 0, this.width, this.height);
    const textureDataFloat = new TextureDataFloat(this.width, this.height, channels);
    const data = pixel.data;
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < channels; k++) {
          textureDataFloat.setPixelAtChannel(j, i, k, data[i * this.width * 4 + j * 4 + k] / 255);
        }
      }
    }
    return textureDataFloat;
  }
}
