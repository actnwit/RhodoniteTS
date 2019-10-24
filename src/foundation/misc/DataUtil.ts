
export default class DataUtil {

  static isNode() {
    let isNode = (window === void 0 && typeof process !== "undefined" && typeof require !== "undefined");
    return isNode;
  }

  static btoa(str: string) {
    let isNode = DataUtil.isNode();
    if (isNode) {
      let buffer;
      if (Buffer.isBuffer(str)) {
        buffer = str;
      }
      else {
        buffer = new Buffer(str.toString(), 'binary');
      }
      return buffer.toString('base64');
    } else {
      return btoa(str)
    }
  }

  static atob(str: string) {
    let isNode = DataUtil.isNode();
    if (isNode) {
      return new Buffer(str, 'base64').toString('binary');
    } else {
      return atob(str)
    }
  }

  static dataUriToArrayBuffer(dataUri: string) {
    let splittedDataUri = dataUri.split(',');
    // let type = splittedDataUri[0].split(':')[1].split(';')[0];
    let byteString = DataUtil.atob(splittedDataUri[1]);
    let byteStringLength = byteString.length;
    let arrayBuffer = new ArrayBuffer(byteStringLength);
    let uint8Array = new Uint8Array(arrayBuffer);
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
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    let imageData = ctx.createImageData(width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 0] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 0];
      imageData.data[i + 1] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 1];
      imageData.data[i + 2] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 2];
      imageData.data[i + 3] = uint8array[(height - Math.floor(i / (4 * width))) * (4 * width) + i % (4 * width) + 3];
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.remove();
    return canvas.toDataURL("image/png");
  }

  static loadResourceAsync(resourceUri: string, isBinary: boolean, resolveCallback: Function, rejectCallback: Function) {
    return new Promise<any>((resolve, reject) => {
      let isNode = DataUtil.isNode();

      if (isNode) {
        // let fs = require('fs');
        // let args: any[] = [resourceUri];
        // let func: Function = (err:any, response: any) => {
        //   if (err) {
        //     if (rejectCallback) {
        //       rejectCallback(reject, err);
        //     }
        //     return;
        //   }
        //   if (isBinary) {
        //     let buffer = new Buffer(response, 'binary');
        //     let uint8Buffer = new Uint8Array(buffer);
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
        // fs.readFile.apply(fs, args);
      } else {
        let xmlHttp = new XMLHttpRequest();
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
          xmlHttp.open("GET", resourceUri, true);
          xmlHttp.responseType = "arraybuffer";
        } else {
          xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4 && (Math.floor(xmlHttp.status / 100) === 2 || xmlHttp.status === 0)) {
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
          xmlHttp.open("GET", resourceUri, true);
        }

        xmlHttp.send(null);
      }
    });
  }

  static toCRC32(str: string) {
    var crc = 0, x: any = 0, y = 0;
    const crc32table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(' ');
    var table = crc32table;

    crc = crc ^ (-1);
    for (var i = 0, iTop = str.length; i < iTop; ++i) {
      y = (crc ^ str.charCodeAt(i)) & 0xff;
      x = "0x" + table[y];
      crc = (crc >>> 8) ^ x;
    }

    return (crc ^ (-1)) >>> 0;
  }

  static accessBinaryAsImage(bufferViewIndex: number, json: any, buffer: ArrayBuffer | Uint8Array, mimeType: string): string {
    const uint8BufferView = this.takeBufferViewAsUint8Array(json, bufferViewIndex, buffer);
    return this.accessArrayBufferAsImage(uint8BufferView, mimeType);
  }

  static createBlobImageUriFromUint8Array(uint8Array: Uint8Array, mimeType: string) {
    const blob = new Blob([uint8Array], { type: mimeType });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  }

  static takeBufferViewAsUint8Array(json: any, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array {
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = (bufferViewJson.byteOffset != null) ? bufferViewJson.byteOffset : 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer: ArrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }

  static accessArrayBufferAsImage(arrayBuffer: ArrayBuffer | Uint8Array, imageType: string): string {
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
      binaryData += String.fromCharCode.apply(this, charCodeArray.slice(i * constant, (i + 1) * constant));
    }
    return binaryData;
  }

  static getImageType(imageType: string): string {
    let imgSrc = null;
    if (imageType === 'image/jpeg' || imageType.toLowerCase() === 'jpg' || imageType.toLowerCase() === 'jpeg') {
      imgSrc = "data:image/jpeg;base64,";
    }
    else if (imageType == 'image/png' || imageType.toLowerCase() === 'png') {
      imgSrc = "data:image/png;base64,";
    }
    else if (imageType == 'image/gif' || imageType.toLowerCase() === 'gif') {
      imgSrc = "data:image/gif;base64,";
    }
    else if (imageType == 'image/bmp' || imageType.toLowerCase() === 'bmp') {
      imgSrc = "data:image/bmp;base64,";
    }
    else {
      imgSrc = "data:image/unknown;base64,";
    }
    return imgSrc;
  }

  static getMimeTypeFromExtension(extension: string): string {
    let imgSrc = null;
    if (extension.toLowerCase() === 'jpg' || extension.toLowerCase() === 'jpeg') {
      imgSrc = "image/jpeg";
    }
    else if (extension.toLowerCase() === 'png') {
      imgSrc = "image/png";
    }
    else if (extension.toLowerCase() === 'gif') {
      imgSrc = "image/gif";
    }
    else if (extension.toLowerCase() === 'bmp') {
      imgSrc = "image/bmp";
    }
    else {
      imgSrc = "image/unknown";
    }
    return imgSrc;
  }

  static getExtension(fileName: string): string {
    const splitted = fileName.split('.');
    const fileExtension = splitted[splitted.length - 1];
    return fileExtension;
  }


  static createUint8ArrayFromBufferViewInfo(json: any, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array {
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = (bufferViewJson.byteOffset != null) ? bufferViewJson.byteOffset : 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer: ArrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }

  static createImageFromUri(uri: string, mimeType: string): Promise<HTMLImageElement> {
    return new Promise(function (resolve) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      if (uri.match(/^blob:/) || uri.match(/^data:/)) {
        img.onload = () => {
          resolve(img);
        };
        img.src = uri;
      } else {
        const load = (img: HTMLImageElement, response: any) => {
          const bytes = new Uint8Array(response);
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(bytes, mimeType);
          img.onload = () => {
            resolve(img);
          }
          img.src = imageUri;
        }

        const loadBinaryImage = () => {
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = (function (_img) {
            return function () {
              if (xhr.readyState == 4 && xhr.status == 200) {
                load(_img, xhr.response);
              }
            }
          })(img);
          xhr.open('GET', uri);
          xhr.responseType = 'arraybuffer';
          xhr.send();
        }
        loadBinaryImage();

      }
    });

  }
}

