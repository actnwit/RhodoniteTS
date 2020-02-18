import { CGAPIResourceHandle, TextureUID, Size, Index, TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";

export default class TextureDataFloat {
  private __data: Float32Array;
  private __channels: number;
  private __width: number;
  private __height: number;

  constructor(width: number, height: number, channels: number) {
    this.__channels = channels;
    this.__width = width;
    this.__height = height;
    this.__data = new Float32Array(width * height * channels);
  }

  resize(width: number, height: number, channels: number) {
    this.__width = width;
    this.__height = height;
    this.__channels = channels;
    this.__data = new Float32Array(TextureDataFloat.transfer(this.__data.buffer, width * height * channels * 4));
  }

  setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number) {
    this.__data[y * this.__width * this.__channels + x * this.__channels + channelIdx] = value;
  }

  get width() {
    return this.__width;
  }

  get height() {
    return this.__height;
  }

  get data() {
    return this.__data;
  }

  getPixel(x: Index, y: Index, channelIdx: Index) {
    return this.__data[y * this.__width * this.__channels + x * this.__channels + channelIdx]
  }

  getPixelAs(x: Index, y:Index, channels: Size, typeClass: any) {
    if (channels === 3) {
      return new (typeClass as any)(
        this.__data[y * this.__width * this.__channels + x * this.__channels + 0],
        this.__data[y * this.__width * this.__channels + x * this.__channels + 1],
        this.__data[y * this.__width * this.__channels + x * this.__channels + 2],
        );
    } else if (channels === 4) { 
      return new (typeClass as any)(
        this.__data[y * this.__width * this.__channels + x * this.__channels + 0],
        this.__data[y * this.__width * this.__channels + x * this.__channels + 1],
        this.__data[y * this.__width * this.__channels + x * this.__channels + 2],
        this.__data[y * this.__width * this.__channels + x * this.__channels + 3],
        );
    }
  }

  getPixelAsArray(x: Index, y: Index) {
    const array = [];
    for (let i=0; i<this.__channels; i++) {
      array.push(
        this.__data[y * this.__width * this.__channels + x * this.__channels + i]
      );
    }
    return array;
  }

  initialize(width: number, height: number, channels: number) {
    this.__width = width;
    this.__height = height;
    this.__channels = channels;
    this.__data = new Float32Array(width * height * channels);
  }

  static transfer(source: any, length: number) {
    source = Object(source);
    var dest = new ArrayBuffer(length);
    if (!(source instanceof ArrayBuffer) || !(dest instanceof ArrayBuffer)) {
        throw new TypeError('Source and destination must be ArrayBuffer instances');
    }
    if (dest.byteLength >= source.byteLength) {
        var nextOffset = 0;
        var leftBytes = source.byteLength;
        var wordSizes = [8, 4, 2, 1];
        wordSizes.forEach(function(_wordSize_) {
            if (leftBytes >= _wordSize_) {
                var done = transferWith(_wordSize_, source, dest, nextOffset, leftBytes);
                nextOffset = done.nextOffset;
                leftBytes = done.leftBytes;
            }
        });
    }
    return dest;
    function transferWith(wordSize: number, source: any, dest: any, nextOffset: number, leftBytes: number) {
        var ViewClass: TypedArrayConstructor = Uint8Array;
        switch (wordSize) {
            case 8:
                ViewClass = Float64Array;
                break;
            case 4:
                ViewClass = Float32Array;
                break;
            case 2:
                ViewClass = Uint16Array;
                break;
            case 1:
                ViewClass = Uint8Array;
                break;
            default:
                ViewClass = Uint8Array;
                break;
        }
        var view_source = new ViewClass(source, nextOffset, Math.trunc(leftBytes / wordSize));
        var view_dest = new ViewClass(dest, nextOffset, Math.trunc(leftBytes / wordSize));
        for (var i = 0; i < view_dest.length; i++) {
            view_dest[i] = view_source[i];
        }
        return {
            nextOffset : view_source.byteOffset + view_source.byteLength,
            leftBytes : source.byteLength - (view_source.byteOffset + view_source.byteLength)
        }
    }
}
}