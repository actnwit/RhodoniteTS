import { GltfLoadOption } from '../../types';
import { Byte, Size } from '../../types/CommonTypes';
import { glTF1 } from '../../types/glTF1';
import { RnM2 } from '../../types/RnM2';
import { Err, Result, Ok } from './Result';
import { RnPromise } from './RnPromise';

declare const URL: any;

export class DataUtil {
  static crc32table =
    '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D'.split(
      ' '
    );

  static isNode() {
    const isNode =
      window === void 0 && typeof process !== 'undefined' && typeof require !== 'undefined';
    return isNode;
  }

  static btoa(str: string) {
    const isNode = DataUtil.isNode();
    if (isNode) {
      let buffer;
      if (Buffer.isBuffer(str)) {
        buffer = str;
      } else {
        buffer = Buffer.from(str.toString(), 'binary');
      }
      return buffer.toString('base64');
    } else {
      return btoa(str);
    }
  }

  static atob(str: string) {
    const isNode = DataUtil.isNode();
    if (isNode) {
      return Buffer.from(str, 'base64').toString('binary');
    } else {
      return atob(str);
    }
  }

  static dataUriToArrayBuffer(dataUri: string) {
    const splitDataUri = dataUri.split(',');
    const byteString = DataUtil.atob(splitDataUri[1]);
    const byteStringLength = byteString.length;
    const arrayBuffer = new ArrayBuffer(byteStringLength);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteStringLength; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return arrayBuffer;
  }

  static arrayBufferToString(arrayBuffer: ArrayBuffer) {
    if (typeof TextDecoder !== 'undefined') {
      const textDecoder = new TextDecoder();
      return textDecoder.decode(arrayBuffer);
    } else {
      const bytes = new Uint8Array(arrayBuffer);
      const result = this.uint8ArrayToStringInner(bytes);
      return result;
    }
  }

  static uint8ArrayToString(uint8Array: Uint8Array) {
    if (typeof TextDecoder !== 'undefined') {
      const textDecoder = new TextDecoder();
      return textDecoder.decode(uint8Array);
    } else {
      const result = this.uint8ArrayToStringInner(uint8Array);
      return result;
    }
  }

  static stringToBase64(str: string) {
    let b64 = null;
    b64 = DataUtil.btoa(str);
    return b64;
  }

  static base64ToArrayBuffer(base64: string) {
    if (typeof window !== "undefined") {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    } else {
      throw new Error('This function works in browser environment.')
    }
  }

  static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 0] =
        uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + (i % (4 * width)) + 0];
      imageData.data[i + 1] =
        uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + (i % (4 * width)) + 1];
      imageData.data[i + 2] =
        uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + (i % (4 * width)) + 2];
      imageData.data[i + 3] =
        uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + (i % (4 * width)) + 3];
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.remove();
    return canvas.toDataURL('image/png');
  }

  static loadResourceAsync(
    resourceUri: string,
    isBinary: boolean,
    resolveCallback: Function,
    rejectCallback: Function
  ) {
    return new Promise<any>((resolve, reject) => {
      const isNode = DataUtil.isNode();

      if (isNode) {
        // const args: any[] = [resourceUri];
        // const func: Function = (err:any, response: any) => {
        //   if (err) {
        //     if (rejectCallback) {
        //       rejectCallback(reject, err);
        //     }
        //     return;
        //   }
        //   if (isBinary) {
        //     const buffer = new Buffer(response, 'binary');
        //     const uint8Buffer = new Uint8Array(buffer);
        //     response = uint8Buffer.buffer;
        //   }
        //   resolveCallback(resolve, response);
        // };
        // if (isBinary) {
        //   args.push(func);
        // } else {
        //   args.push('utf8');
        //   args.push(func);
        // }
        // fs.readFile(...args);
      } else {
        const xmlHttp = new XMLHttpRequest();
        if (isBinary) {
          xmlHttp.onload = (oEvent) => {
            let response = null;
            if (isBinary) {
              response = xmlHttp.response;
            } else {
              response = xmlHttp.responseText;
            }
            resolveCallback(resolve, response);
          };
          xmlHttp.open('GET', resourceUri, true);
          xmlHttp.responseType = 'arraybuffer';
        } else {
          xmlHttp.onreadystatechange = () => {
            if (
              xmlHttp.readyState === 4 &&
              (Math.floor(xmlHttp.status / 100) === 2 || xmlHttp.status === 0)
            ) {
              let response = null;
              if (isBinary) {
                response = xmlHttp.response;
              } else {
                response = xmlHttp.responseText;
              }
              resolveCallback(resolve, response);
            } else {
              if (rejectCallback) {
                rejectCallback(reject, xmlHttp.status);
              }
            }
          };
          xmlHttp.open('GET', resourceUri, true);
        }

        xmlHttp.send(null);
      }
    });
  }

  static toCRC32(str: string) {
    let crc = 0,
      x: any = 0,
      y = 0;
    const table = DataUtil.crc32table;

    crc = crc ^ -1;
    for (let i = 0, iTop = str.length; i < iTop; ++i) {
      y = (crc ^ str.charCodeAt(i)) & 0xff;
      x = '0x' + table[y];
      crc = (crc >>> 8) ^ x;
    }

    return (crc ^ -1) >>> 0;
  }

  static accessBinaryAsImage(
    bufferViewIndex: number,
    json: any,
    buffer: ArrayBuffer | Uint8Array,
    mimeType: string
  ): string {
    const uint8BufferView = this.takeBufferViewAsUint8Array(json, bufferViewIndex, buffer);
    return this.accessArrayBufferAsImage(uint8BufferView, mimeType);
  }

  static createBlobImageUriFromUint8Array(uint8Array: Uint8Array, mimeType: string): string {
    const blob = new Blob([uint8Array], { type: mimeType });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  }

  static takeBufferViewAsUint8Array(
    json: RnM2,
    bufferViewIndex: number,
    buffer: ArrayBuffer | Uint8Array
  ): Uint8Array {
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = bufferViewJson.byteOffset ?? 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer: ArrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }

  static accessArrayBufferAsImage(
    arrayBuffer: ArrayBuffer | Uint8Array,
    imageType: string
  ): string {
    const binaryData = this.uint8ArrayToStringInner(new Uint8Array(arrayBuffer));
    const imgSrc = this.getImageType(imageType);
    const dataUrl = imgSrc + DataUtil.btoa(binaryData);
    return dataUrl;
  }

  static uint8ArrayToStringInner(uint8: Uint8Array): string {
    const charCodeArray: number[] = new Array(uint8.byteLength);
    for (let i = 0; i < uint8.byteLength; i++) {
      charCodeArray[i] = uint8[i];
    }

    // the argument of String.fromCharCode has the limit of array length
    const constant = 1024;
    const divisionNumber = Math.ceil(charCodeArray.length / constant);

    let binaryData = '';
    for (let i = 0; i < divisionNumber; i++) {
      binaryData += String.fromCharCode.apply(
        this,
        charCodeArray.slice(i * constant, (i + 1) * constant)
      );
    }
    return binaryData;
  }

  static getImageType(imageType: string): string {
    let imgSrc = null;
    if (
      imageType === 'image/jpeg' ||
      imageType.toLowerCase() === 'jpg' ||
      imageType.toLowerCase() === 'jpeg'
    ) {
      imgSrc = 'data:image/jpeg;base64,';
    } else if (imageType === 'image/png' || imageType.toLowerCase() === 'png') {
      imgSrc = 'data:image/png;base64,';
    } else if (imageType === 'image/gif' || imageType.toLowerCase() === 'gif') {
      imgSrc = 'data:image/gif;base64,';
    } else if (imageType === 'image/bmp' || imageType.toLowerCase() === 'bmp') {
      imgSrc = 'data:image/bmp;base64,';
    } else {
      imgSrc = 'data:image/unknown;base64,';
    }
    return imgSrc;
  }

  static getMimeTypeFromExtension(extension: string): string {
    let imgSrc = null;
    if (extension.toLowerCase() === 'jpg' || extension.toLowerCase() === 'jpeg') {
      imgSrc = 'image/jpeg';
    } else if (extension.toLowerCase() === 'png') {
      imgSrc = 'image/png';
    } else if (extension.toLowerCase() === 'gif') {
      imgSrc = 'image/gif';
    } else if (extension.toLowerCase() === 'bmp') {
      imgSrc = 'image/bmp';
    } else {
      imgSrc = 'image/unknown';
    }
    return imgSrc;
  }

  static getExtension(fileName: string): string {
    const splitted = fileName.split('.');
    const fileExtension = splitted[splitted.length - 1];
    return fileExtension;
  }

  static createUint8ArrayFromBufferViewInfo(
    json: RnM2 | glTF1,
    bufferViewIndex: number,
    buffer: ArrayBuffer | Uint8Array
  ): Uint8Array {
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = bufferViewJson.byteOffset ?? 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer: ArrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }

  static createImageFromUri(uri: string, mimeType: string): RnPromise<HTMLImageElement> {
    return new RnPromise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      if (uri.match(/^blob:/) || uri.match(/^data:/)) {
        img.onload = () => {
          resolve(img);
        };
        img.src = uri;
      } else {
        const load = (img: HTMLImageElement, response: ArrayBuffer) => {
          const bytes = new Uint8Array(response);
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(bytes, mimeType);
          img.onload = () => {
            resolve(img);
            URL.revokeObjectURL(imageUri);
          };
          img.src = imageUri;
        };

        const loadBinaryImage = () => {
          const xhr = new XMLHttpRequest();
          xhr.onreadystatechange = (function (_img) {
            return function () {
              if (xhr.readyState === 4 && xhr.status === 200) {
                load(_img, xhr.response);
              }
            };
          })(img);
          xhr.open('GET', uri);
          xhr.responseType = 'arraybuffer';
          xhr.send();
        };
        loadBinaryImage();
      }
    });
  }

  static createDefaultGltfOptions(): GltfLoadOption {
    const defaultOptions: GltfLoadOption = {
      files: {
        //        "foo.gltf": content of file as ArrayBuffer,
        //        "foo.bin": content of file as ArrayBuffer,
        //        "boo.png": content of file as ArrayBuffer
      },
      loaderExtension: undefined,
      defaultMaterialHelperName: undefined,
      defaultMaterialHelperArgumentArray: [{}],
      statesOfElements: [
        {
          targets: [], //["name_foo", "name_boo"],
          states: {
            enable: [
              // 3042,  // BLEND
            ],
            functions: {
              //"blendFuncSeparate": [1, 0, 1, 0],
            },
          },
          isTransparent: true,
          opacity: 1.0,
          isTextureImageToLoadPreMultipliedAlpha: false,
        },
      ],
      tangentCalculationMode: 1,
      extendedJson: void 0, //   URI string / JSON Object / ArrayBuffer
      __importedType: 'undefined',
    };

    return defaultOptions;
  }

  static async fetchArrayBuffer(uri: string): Promise<Result<ArrayBuffer, unknown>> {
    const response = await fetch(uri, { mode: 'cors' });
    if (!response.ok) {
      return new Err({
        message: `fetchArrayBuffer failed. uri: ${uri}`,
        error: response.statusText,
      });
    }
    const arraybuffer = await response.arrayBuffer();
    return new Ok(arraybuffer);
  }

  static getResizedCanvas(image: HTMLImageElement, maxSize: Size): [HTMLCanvasElement, Size, Size] {
    const canvas = document.createElement('canvas');
    const potWidth = this.getNearestPowerOfTwo(image.width);
    const potHeight = this.getNearestPowerOfTwo(image.height);

    const aspect = potHeight / potWidth;
    let dstWidth = 0;
    let dstHeight = 0;
    if (potWidth > potHeight) {
      dstWidth = Math.min(potWidth, maxSize);
      dstHeight = dstWidth * aspect;
    } else {
      dstHeight = Math.min(potHeight, maxSize);
      dstWidth = dstHeight / aspect;
    }
    canvas.width = dstWidth;
    canvas.height = dstHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dstWidth, dstHeight);

    return [canvas, dstWidth, dstHeight];
  }

  static detectTransparentPixelExistence(
    image: HTMLImageElement | HTMLCanvasElement | ImageData,
    threshold = 1.0
  ): boolean {
    const dstWidth = image.width;
    const dstHeight = image.height;
    let ctx: CanvasRenderingContext2D;
    let imageData: ImageData;
    if (image instanceof ImageData) {
      imageData = image;
    } else if (image instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0)!;
      imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    } else {
      // must be HTMLCanvasHTML
      ctx = image.getContext('2d')!;
      ctx.drawImage(image, 0, 0)!;
      imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    }

    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const alpha = imageData.data[(x + y * dstWidth) * 4 + 3];
        if (alpha < threshold) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * get a value nearest power of two.
   *
   * @param x texture size.
   * @returns a value nearest power of two.
   */
  static getNearestPowerOfTwo(x: number): number {
    return Math.pow(2, Math.round(Math.log(x) / Math.LN2));
  }

  static calcPaddingBytes(originalByteLength: Byte, byteAlign: Byte) {
    if (originalByteLength % byteAlign !== 0) {
      const sizeToPadding = byteAlign - (originalByteLength % byteAlign);
      return sizeToPadding;
    }

    return 0;
  }

  static addPaddingBytes(originalByteLength: Byte, byteAlign: Byte) {
    return originalByteLength + this.calcPaddingBytes(originalByteLength, byteAlign);
  }

  static normalizedInt8ArrayToFloat32Array(from: Int8Array | number[]) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = Math.max(from[i] / 127.0, -1.0);
    }
    return float32Array;
  }

  static normalizedUint8ArrayToFloat32Array(from: Uint8Array | number[]) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = from[i] / 255.0;
    }
    return float32Array;
  }

  static normalizedInt16ArrayToFloat32Array(from: Int16Array | number[]) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = Math.max(from[i] / 32767.0, -1.0);
    }
    return float32Array;
  }

  static normalizedUint16ArrayToFloat32Array(from: Uint16Array | number[]) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = from[i] / 65535.0;
    }
    return float32Array;
  }

  /**
   * get a copy of the src arraybuffer
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static getCopy({
    src,
    srcByteOffset,
    copyByteLength,
    distByteOffset,
  }: {
    src: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    const dst = new ArrayBuffer(src.byteLength);
    const dist = new Uint8Array(dst, distByteOffset, copyByteLength);
    dist.set(new Uint8Array(src, srcByteOffset, copyByteLength));

    return dist.buffer;
  }

  /**
   * get a copy of the src arraybuffer
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static getCopyAs4Bytes({
    src,
    srcByteOffset,
    copyByteLength,
    distByteOffset,
  }: {
    src: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    if (srcByteOffset % 4 !== 0 || copyByteLength % 4 !== 0 || distByteOffset % 4 !== 0) {
      throw new Error('Invalid byte align for 4bytes unit copy operation.');
    }
    const dst = new ArrayBuffer(src.byteLength);
    const dist = new Int32Array(dst, distByteOffset, copyByteLength / 4);
    dist.set(new Int32Array(src, srcByteOffset, copyByteLength / 4));

    return dist.buffer;
  }

  /**
   * get a copy of the src arraybuffer
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static copyArrayBuffer({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset = 0,
  }: {
    src: ArrayBuffer;
    dist: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    const dst = new Uint8Array(dist, distByteOffset, copyByteLength);
    dst.set(new Uint8Array(src, srcByteOffset, copyByteLength));

    return dst.buffer;
  }

  /**
   * get a copy of the src arraybuffer
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static copyArrayBufferWithPadding({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset,
  }: {
    src: ArrayBuffer;
    dist: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    const dst = new Uint8Array(dist, distByteOffset, copyByteLength);
    const byteDiff = src.byteLength - srcByteOffset - copyByteLength;
    if (byteDiff < 0) {
      dst.set(new Uint8Array(src, srcByteOffset, src.byteLength - srcByteOffset));
      const byteCount = -byteDiff;
      const paddingArrayBuffer = new Uint8Array(byteCount);
      dst.set(paddingArrayBuffer);
    } else {
      dst.set(new Uint8Array(src, srcByteOffset, copyByteLength));
    }

    return dst.buffer;
  }

  /**
   * get a copy of the src arraybuffer
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static copyArrayBufferAs4Bytes({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset,
  }: {
    src: ArrayBuffer;
    dist: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    if (srcByteOffset % 4 !== 0 || copyByteLength % 4 !== 0 || distByteOffset % 4 !== 0) {
      throw new Error('Invalid byte align for 4bytes unit copy operation.');
    }
    const dst = new Int32Array(dist, distByteOffset, copyByteLength / 4);
    dst.set(new Int32Array(src, srcByteOffset, copyByteLength / 4));

    return dst.buffer;
  }

  /**
   * get a copy of the src arraybuffer with padding to be 4bytes aligined
   * @param param0 copy description
   * @returns copied memory as ArrayBuffer
   */
  static copyArrayBufferAs4BytesWithPadding({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset,
  }: {
    src: ArrayBuffer;
    dist: ArrayBuffer;
    srcByteOffset: Byte;
    copyByteLength: Byte;
    distByteOffset: Byte;
  }): ArrayBuffer {
    const dst = new Int32Array(dist, distByteOffset, copyByteLength / 4);
    const byteDiff = src.byteLength - srcByteOffset - copyByteLength;

    if (byteDiff < 0) {
      dst.set(new Int32Array(src, srcByteOffset, (src.byteLength - srcByteOffset) / 4));
      const byteCount = -byteDiff;
      const paddingArrayBuffer = new Uint8Array(byteCount);
      dst.set(paddingArrayBuffer);
    } else {
      dst.set(new Int32Array(src, srcByteOffset, copyByteLength / 4));
    }

    return dst.buffer;
  }

  static stringToBuffer(src: string): ArrayBuffer {
    const enc = new TextEncoder();
    return enc.encode(src).buffer;
  }
}
