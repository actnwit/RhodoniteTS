var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/foundation/misc/DataUtil.ts
import { Err, Ok } from "./Result.js";
import { RnPromise } from "./RnPromise.js";
var _DataUtil = class _DataUtil {
  static yu(view, message) {
    if (!(view.buffer instanceof ArrayBuffer)) {
      throw new Error(message);
    }
  }
  /**
   * Determines if the current environment is Node.js.
   * @returns True if running in Node.js environment, false otherwise
   */
  static isNode() {
    const isNode = window === void 0 && typeof process !== "undefined" && typeof __require !== "undefined";
    return isNode;
  }
  /**
   * Encodes a string to base64 format, compatible with both browser and Node.js environments.
   * @param str - The string to encode
   * @returns Base64 encoded string
   */
  static btoa(str) {
    const isNode = _DataUtil.isNode();
    if (isNode) {
      let buffer;
      if (Buffer.isBuffer(str)) {
        buffer = str;
      } else {
        buffer = Buffer.from(str.toString(), "binary");
      }
      return buffer.toString("base64");
    }
    return btoa(str);
  }
  /**
   * Decodes a base64 string, compatible with both browser and Node.js environments.
   * @param str - The base64 string to decode
   * @returns Decoded binary string
   */
  static atob(str) {
    const isNode = _DataUtil.isNode();
    if (isNode) {
      return Buffer.from(str, "base64").toString("binary");
    }
    return atob(str);
  }
  /**
   * Converts a data URI to an ArrayBuffer.
   * @param dataUri - The data URI string to convert
   * @returns ArrayBuffer containing the decoded data
   */
  static dataUriToArrayBuffer(dataUri) {
    const splitDataUri = dataUri.split(",");
    const byteString = _DataUtil.atob(splitDataUri[1]);
    const byteStringLength = byteString.length;
    const arrayBuffer = new ArrayBuffer(byteStringLength);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteStringLength; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return arrayBuffer;
  }
  /**
   * Converts an ArrayBuffer to a string using TextDecoder when available.
   * @param arrayBuffer - The ArrayBuffer to convert
   * @returns String representation of the buffer data
   */
  static arrayBufferToString(arrayBuffer) {
    if (typeof TextDecoder !== "undefined") {
      const textDecoder = new TextDecoder();
      return textDecoder.decode(arrayBuffer);
    }
    const bytes = new Uint8Array(arrayBuffer);
    const result = this.uint8ArrayToStringInner(bytes);
    return result;
  }
  /**
   * Converts a Uint8Array to a string using TextDecoder when available.
   * @param uint8Array - The Uint8Array to convert
   * @returns String representation of the array data
   */
  static uint8ArrayToString(uint8Array) {
    if (typeof TextDecoder !== "undefined") {
      const textDecoder = new TextDecoder();
      return textDecoder.decode(uint8Array);
    }
    const result = this.uint8ArrayToStringInner(uint8Array);
    return result;
  }
  /**
   * Converts a string to base64 encoding.
   * @param str - The string to encode
   * @returns Base64 encoded string
   */
  static stringToBase64(str) {
    let b64 = null;
    b64 = _DataUtil.btoa(str);
    return b64;
  }
  /**
   * Converts a base64 string to an ArrayBuffer (browser environment only).
   * @param base64 - The base64 string to convert
   * @returns ArrayBuffer containing the decoded data
   * @throws Error if not running in browser environment
   */
  static base64ToArrayBuffer(base64) {
    if (typeof window !== "undefined") {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }
    throw new Error("This function works in browser environment.");
  }
  /**
   * Converts a Uint8Array to a data URL for image display.
   * @param uint8array - The image data as Uint8Array
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @returns Data URL string for the image
   */
  static UInt8ArrayToDataURL(uint8array, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
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
  /**
   * Loads a resource asynchronously with support for both binary and text data.
   * @param resourceUri - URI of the resource to load
   * @param isBinary - Whether to load as binary data
   * @param resolveCallback - Callback function for successful loading
   * @param rejectCallback - Callback function for error handling
   * @returns Promise that resolves with the loaded resource
   */
  static loadResourceAsync(resourceUri, isBinary, resolveCallback, rejectCallback) {
    return new Promise((resolve, reject) => {
      const isNode = _DataUtil.isNode();
      if (isNode) {
      } else {
        const xmlHttp = new XMLHttpRequest();
        if (isBinary) {
          xmlHttp.onload = () => {
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
  /**
   * Calculates CRC32 checksum for a given string.
   * @param str - The string to calculate checksum for
   * @returns CRC32 checksum as unsigned 32-bit integer
   */
  static toCRC32(str) {
    let crc = 0;
    let x = 0;
    let y = 0;
    const table = _DataUtil.crc32table;
    crc = crc ^ -1;
    for (let i = 0, iTop = str.length; i < iTop; ++i) {
      y = (crc ^ str.charCodeAt(i)) & 255;
      x = `0x${table[y]}`;
      crc = crc >>> 8 ^ x;
    }
    return (crc ^ -1) >>> 0;
  }
  /**
   * Accesses binary data from a buffer view and converts it to an image data URL.
   * @param bufferViewIndex - Index of the buffer view in the JSON
   * @param json - JSON object containing buffer view information
   * @param buffer - The source buffer data
   * @param mimeType - MIME type of the image
   * @returns Data URL string for the image
   */
  static accessBinaryAsImage(bufferViewIndex, json, buffer, mimeType) {
    const uint8BufferView = this.takeBufferViewAsUint8Array(json, bufferViewIndex, buffer);
    return this.accessArrayBufferAsImage(uint8BufferView, mimeType);
  }
  /**
   * Creates a blob image URI from a Uint8Array.
   * @param uint8Array - The image data as Uint8Array
   * @param mimeType - MIME type of the image
   * @returns Blob URL string for the image
   */
  static createBlobImageUriFromUint8Array(uint8Array, mimeType) {
    _DataUtil.yu(uint8Array, "SharedArrayBuffer is not supported when creating blob image URIs.");
    const blob = new Blob([uint8Array], { type: mimeType });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  }
  /**
   * Extracts a Uint8Array from a buffer view based on JSON specification.
   * @param json - RnM2 JSON object containing buffer view information
   * @param bufferViewIndex - Index of the buffer view
   * @param buffer - The source buffer data
   * @returns Uint8Array view of the specified buffer region
   */
  static takeBufferViewAsUint8Array(json, bufferViewIndex, buffer) {
    var _a;
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = (_a = bufferViewJson.byteOffset) != null ? _a : 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }
  /**
   * Converts ArrayBuffer or Uint8Array to an image data URL.
   * @param arrayBuffer - The image data buffer
   * @param imageType - Type/format of the image
   * @returns Data URL string for the image
   */
  static accessArrayBufferAsImage(arrayBuffer, imageType) {
    const binaryData = this.uint8ArrayToStringInner(new Uint8Array(arrayBuffer));
    const imgSrc = this.getImageType(imageType);
    const dataUrl = imgSrc + _DataUtil.btoa(binaryData);
    return dataUrl;
  }
  /**
   * Internal method to convert Uint8Array to string without TextDecoder.
   * @param uint8 - The Uint8Array to convert
   * @returns String representation of the array data
   */
  static uint8ArrayToStringInner(uint8) {
    const charCodeArray = new Array(uint8.byteLength);
    for (let i = 0; i < uint8.byteLength; i++) {
      charCodeArray[i] = uint8[i];
    }
    const constant = 1024;
    const divisionNumber = Math.ceil(charCodeArray.length / constant);
    let binaryData = "";
    for (let i = 0; i < divisionNumber; i++) {
      binaryData += String.fromCharCode.apply(this, charCodeArray.slice(i * constant, (i + 1) * constant));
    }
    return binaryData;
  }
  /**
   * Gets the appropriate data URL prefix for a given image type.
   * @param imageType - The image type or MIME type
   * @returns Data URL prefix string
   */
  static getImageType(imageType) {
    let imgSrc = null;
    if (imageType === "image/jpeg" || imageType.toLowerCase() === "jpg" || imageType.toLowerCase() === "jpeg") {
      imgSrc = "data:image/jpeg;base64,";
    } else if (imageType === "image/png" || imageType.toLowerCase() === "png") {
      imgSrc = "data:image/png;base64,";
    } else if (imageType === "image/gif" || imageType.toLowerCase() === "gif") {
      imgSrc = "data:image/gif;base64,";
    } else if (imageType === "image/bmp" || imageType.toLowerCase() === "bmp") {
      imgSrc = "data:image/bmp;base64,";
    } else {
      imgSrc = "data:image/unknown;base64,";
    }
    return imgSrc;
  }
  /**
   * Gets the MIME type from a file extension.
   * @param extension - The file extension
   * @returns MIME type string
   */
  static getMimeTypeFromExtension(extension) {
    let imgSrc = null;
    if (extension.toLowerCase() === "jpg" || extension.toLowerCase() === "jpeg") {
      imgSrc = "image/jpeg";
    } else if (extension.toLowerCase() === "png") {
      imgSrc = "image/png";
    } else if (extension.toLowerCase() === "gif") {
      imgSrc = "image/gif";
    } else if (extension.toLowerCase() === "bmp") {
      imgSrc = "image/bmp";
    } else {
      imgSrc = "image/unknown";
    }
    return imgSrc;
  }
  /**
   * Extracts the file extension from a filename.
   * @param fileName - The filename to extract extension from
   * @returns File extension string
   */
  static getExtension(fileName) {
    const splitted = fileName.split(".");
    const fileExtension = splitted[splitted.length - 1];
    return fileExtension;
  }
  /**
   * Creates a Uint8Array from buffer view information in glTF or RnM2 format.
   * @param json - The JSON object containing buffer view information
   * @param bufferViewIndex - Index of the buffer view
   * @param buffer - The source buffer data
   * @returns Uint8Array view of the specified buffer region
   */
  static createUint8ArrayFromBufferViewInfo(json, bufferViewIndex, buffer) {
    var _a;
    const bufferViewJson = json.bufferViews[bufferViewIndex];
    let byteOffset = (_a = bufferViewJson.byteOffset) != null ? _a : 0;
    const byteLength = bufferViewJson.byteLength;
    let arrayBuffer = buffer;
    if (buffer instanceof Uint8Array) {
      arrayBuffer = buffer.buffer;
      byteOffset += buffer.byteOffset;
    }
    const uint8BufferView = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    return uint8BufferView;
  }
  /**
   * Creates an HTMLImageElement from a URI with proper CORS handling.
   * @param uri - The image URI
   * @param mimeType - MIME type of the image
   * @returns Promise that resolves to the loaded HTMLImageElement
   */
  static createImageFromUri(uri, mimeType) {
    return new RnPromise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      if (uri.match(/^blob:/) || uri.match(/^data:/)) {
        img.onload = () => {
          resolve(img);
        };
        img.src = uri;
      } else {
        const load = (img2, response) => {
          const bytes = new Uint8Array(response);
          const imageUri = _DataUtil.createBlobImageUriFromUint8Array(bytes, mimeType);
          img2.onload = () => {
            resolve(img2);
            URL.revokeObjectURL(imageUri);
          };
          img2.src = imageUri;
        };
        const loadBinaryImage = () => {
          const xhr = new XMLHttpRequest();
          xhr.onreadystatechange = /* @__PURE__ */ ((_img) => () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
              load(_img, xhr.response);
            }
          })(img);
          xhr.open("GET", uri);
          xhr.responseType = "arraybuffer";
          xhr.send();
        };
        loadBinaryImage();
      }
    });
  }
  /**
   * Creates default options for glTF loading operations.
   * @returns Default GltfLoadOption configuration object
   */
  static createDefaultGltfOptions() {
    const defaultOptions = {
      files: {
        //        "foo.gltf": content of file as ArrayBuffer,
        //        "foo.bin": content of file as ArrayBuffer,
        //        "boo.png": content of file as ArrayBuffer
      },
      loaderExtension: void 0,
      defaultMaterialHelperName: void 0,
      defaultMaterialHelperArgumentArray: [{}],
      statesOfElements: [
        {
          targets: [],
          //["name_foo", "name_boo"],
          states: {
            enable: [
              // 3042,  // BLEND
            ],
            functions: {
              //"blendFuncSeparate": [1, 0, 1, 0],
            }
          },
          isTransparent: true,
          opacity: 1,
          isTextureImageToLoadPreMultipliedAlpha: false
        }
      ],
      tangentCalculationMode: 1,
      extendedJson: void 0,
      //   URI string / JSON Object / ArrayBuffer
      __importedType: "undefined"
    };
    return defaultOptions;
  }
  /**
   * Fetches an ArrayBuffer from a URI using the Fetch API.
   * @param uri - The URI to fetch from
   * @returns Promise that resolves to a Result containing the ArrayBuffer or error
   */
  static async fetchArrayBuffer(uri) {
    const response = await fetch(uri, { mode: "cors" });
    if (!response.ok) {
      return new Err({
        message: `fetchArrayBuffer failed. uri: ${uri}`,
        error: response.statusText
      });
    }
    const arraybuffer = await response.arrayBuffer();
    return new Ok(arraybuffer);
  }
  /**
   * Resizes an image to fit within specified dimensions while maintaining aspect ratio.
   * @param image - The source HTMLImageElement
   * @param maxSize - Maximum size for the largest dimension
   * @returns Tuple containing the resized canvas, width, and height
   */
  static getResizedCanvas(image, maxSize) {
    const canvas = document.createElement("canvas");
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
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dstWidth, dstHeight);
    return [canvas, dstWidth, dstHeight];
  }
  /**
   * Detects if an image contains transparent pixels below a specified threshold.
   * @param image - The image to analyze (HTMLImageElement, HTMLCanvasElement, or ImageData)
   * @param threshold - Alpha threshold value (default: 1.0)
   * @returns True if transparent pixels are found, false otherwise
   */
  static detectTransparentPixelExistence(image, threshold = 1) {
    const dstWidth = image.width;
    const dstHeight = image.height;
    let ctx;
    let imageData;
    if (image instanceof ImageData) {
      imageData = image;
    } else if (image instanceof HTMLImageElement) {
      const canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      imageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    } else {
      ctx = image.getContext("2d");
      ctx.drawImage(image, 0, 0);
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
   * Gets the nearest power of two value for a given number.
   * @param x - The input value
   * @returns The nearest power of two value
   */
  static getNearestPowerOfTwo(x) {
    return 2 ** Math.round(Math.log(x) / Math.LN2);
  }
  /**
   * Calculates the number of padding bytes needed for byte alignment.
   * @param originalByteLength - The original byte length
   * @param byteAlign - The byte alignment requirement
   * @returns Number of padding bytes needed
   */
  static calcPaddingBytes(originalByteLength, byteAlign) {
    if (originalByteLength % byteAlign !== 0) {
      const sizeToPadding = byteAlign - originalByteLength % byteAlign;
      return sizeToPadding;
    }
    return 0;
  }
  /**
   * Adds padding bytes to achieve the specified byte alignment.
   * @param originalByteLength - The original byte length
   * @param byteAlign - The byte alignment requirement
   * @returns The padded byte length
   */
  static addPaddingBytes(originalByteLength, byteAlign) {
    return originalByteLength + this.calcPaddingBytes(originalByteLength, byteAlign);
  }
  /**
   * Converts normalized Int8Array values to Float32Array.
   * @param from - Source Int8Array or number array
   * @returns Float32Array with normalized values
   */
  static normalizedInt8ArrayToFloat32Array(from) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = Math.max(from[i] / 127, -1);
    }
    return float32Array;
  }
  /**
   * Converts normalized Uint8Array values to Float32Array.
   * @param from - Source Uint8Array or number array
   * @returns Float32Array with normalized values
   */
  static normalizedUint8ArrayToFloat32Array(from) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = from[i] / 255;
    }
    return float32Array;
  }
  /**
   * Converts normalized Int16Array values to Float32Array.
   * @param from - Source Int16Array or number array
   * @returns Float32Array with normalized values
   */
  static normalizedInt16ArrayToFloat32Array(from) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = Math.max(from[i] / 32767, -1);
    }
    return float32Array;
  }
  /**
   * Converts normalized Uint16Array values to Float32Array.
   * @param from - Source Uint16Array or number array
   * @returns Float32Array with normalized values
   */
  static normalizedUint16ArrayToFloat32Array(from) {
    const float32Array = new Float32Array(from.length);
    for (let i = 0; i < from.length; i++) {
      float32Array[i] = from[i] / 65535;
    }
    return float32Array;
  }
  /**
   * Creates a copy of an ArrayBuffer with specified parameters.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer
   * @param param0.copyByteLength - Number of bytes to copy
   * @param param0.distByteOffset - Byte offset in destination buffer
   * @returns Copied ArrayBuffer
   */
  static getCopy({
    src,
    srcByteOffset,
    copyByteLength,
    distByteOffset
  }) {
    const dst = new ArrayBuffer(src.byteLength);
    const dist = new Uint8Array(dst, distByteOffset, copyByteLength);
    dist.set(new Uint8Array(src, srcByteOffset, copyByteLength));
    return dist.buffer;
  }
  /**
   * Creates a copy of an ArrayBuffer using 4-byte aligned operations.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer (must be 4-byte aligned)
   * @param param0.copyByteLength - Number of bytes to copy (must be 4-byte aligned)
   * @param param0.distByteOffset - Byte offset in destination buffer (must be 4-byte aligned)
   * @returns Copied ArrayBuffer
   * @throws Error if byte offsets are not 4-byte aligned
   */
  static getCopyAs4Bytes({
    src,
    srcByteOffset,
    copyByteLength,
    distByteOffset
  }) {
    if (srcByteOffset % 4 !== 0 || copyByteLength % 4 !== 0 || distByteOffset % 4 !== 0) {
      throw new Error("Invalid byte align for 4bytes unit copy operation.");
    }
    const dst = new ArrayBuffer(src.byteLength);
    const dist = new Int32Array(dst, distByteOffset, copyByteLength / 4);
    dist.set(new Int32Array(src, srcByteOffset, copyByteLength / 4));
    return dist.buffer;
  }
  /**
   * Copies data from source ArrayBuffer to destination ArrayBuffer.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.dist - Destination ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer
   * @param param0.copyByteLength - Number of bytes to copy
   * @param param0.distByteOffset - Byte offset in destination buffer (default: 0)
   * @returns The destination ArrayBuffer
   */
  static copyArrayBuffer({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset = 0
  }) {
    const dst = new Uint8Array(dist, distByteOffset, copyByteLength);
    dst.set(new Uint8Array(src, srcByteOffset, copyByteLength));
    return dst.buffer;
  }
  /**
   * Copies data from source ArrayBuffer to destination ArrayBuffer with padding if needed.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.dist - Destination ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer
   * @param param0.copyByteLength - Number of bytes to copy
   * @param param0.distByteOffset - Byte offset in destination buffer
   * @returns The destination ArrayBuffer
   */
  static copyArrayBufferWithPadding({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset
  }) {
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
   * Copies data using 4-byte aligned operations from source to destination ArrayBuffer.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.dist - Destination ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer (must be 4-byte aligned)
   * @param param0.copyByteLength - Number of bytes to copy (must be 4-byte aligned)
   * @param param0.distByteOffset - Byte offset in destination buffer (must be 4-byte aligned)
   * @returns The destination ArrayBuffer
   * @throws Error if byte offsets are not 4-byte aligned
   */
  static copyArrayBufferAs4Bytes({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset
  }) {
    if (srcByteOffset % 4 !== 0 || copyByteLength % 4 !== 0 || distByteOffset % 4 !== 0) {
      throw new Error("Invalid byte align for 4bytes unit copy operation.");
    }
    const dst = new Int32Array(dist, distByteOffset, copyByteLength / 4);
    dst.set(new Int32Array(src, srcByteOffset, copyByteLength / 4));
    return dst.buffer;
  }
  /**
   * Copies data using 4-byte aligned operations with padding to achieve 4-byte alignment.
   * @param param0 - Copy configuration object
   * @param param0.src - Source ArrayBuffer
   * @param param0.dist - Destination ArrayBuffer
   * @param param0.srcByteOffset - Byte offset in source buffer
   * @param param0.copyByteLength - Number of bytes to copy
   * @param param0.distByteOffset - Byte offset in destination buffer
   * @returns The destination ArrayBuffer
   */
  static copyArrayBufferAs4BytesWithPadding({
    src,
    dist,
    srcByteOffset,
    copyByteLength,
    distByteOffset
  }) {
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
  /**
   * Converts a string to an ArrayBuffer using TextEncoder.
   * @param src - The string to convert
   * @returns ArrayBuffer containing the encoded string data
   */
  static stringToBuffer(src) {
    const enc = new TextEncoder();
    return enc.encode(src).buffer;
  }
};
/**
 * CRC32 lookup table for checksum calculations.
 */
_DataUtil.crc32table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(
  " "
);
var DataUtil = _DataUtil;
export {
  DataUtil
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9EYXRhVXRpbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBHbHRmTG9hZE9wdGlvbiB9IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHsgQnl0ZSwgU2l6ZSB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgZ2xURjEgfSBmcm9tICcuLi8uLi90eXBlcy9nbFRGMSc7XG5pbXBvcnQgdHlwZSB7IFJuTTIgfSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB7IEVyciwgT2ssIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi9SZXN1bHQnO1xuaW1wb3J0IHsgUm5Qcm9taXNlIH0gZnJvbSAnLi9SblByb21pc2UnO1xuXG5kZWNsYXJlIGNvbnN0IFVSTDogYW55O1xuXG4vKipcbiAqIFV0aWxpdHkgY2xhc3MgZm9yIGRhdGEgbWFuaXB1bGF0aW9uLCBjb252ZXJzaW9uLCBhbmQgcHJvY2Vzc2luZyBvcGVyYXRpb25zLlxuICogUHJvdmlkZXMgbWV0aG9kcyBmb3IgaGFuZGxpbmcgdmFyaW91cyBkYXRhIGZvcm1hdHMgaW5jbHVkaW5nIEFycmF5QnVmZmVyLCBVaW50OEFycmF5LFxuICogYmFzZTY0IGVuY29kaW5nL2RlY29kaW5nLCBpbWFnZSBwcm9jZXNzaW5nLCBhbmQgZmlsZSBvcGVyYXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgRGF0YVV0aWwge1xuICBwcml2YXRlIHN0YXRpYyBfX2Fzc2VydEFycmF5QnVmZmVyQmFja2VkPFQgZXh0ZW5kcyBBcnJheUJ1ZmZlclZpZXc8QXJyYXlCdWZmZXJMaWtlPj4oXG4gICAgdmlldzogVCxcbiAgICBtZXNzYWdlOiBzdHJpbmdcbiAgKTogYXNzZXJ0cyB2aWV3IGlzIEFycmF5QnVmZmVyVmlldzxBcnJheUJ1ZmZlcj4gJiBUIHtcbiAgICBpZiAoISh2aWV3LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ1JDMzIgbG9va3VwIHRhYmxlIGZvciBjaGVja3N1bSBjYWxjdWxhdGlvbnMuXG4gICAqL1xuICBzdGF0aWMgY3JjMzJ0YWJsZSA9XG4gICAgJzAwMDAwMDAwIDc3MDczMDk2IEVFMEU2MTJDIDk5MDk1MUJBIDA3NkRDNDE5IDcwNkFGNDhGIEU5NjNBNTM1IDlFNjQ5NUEzIDBFREI4ODMyIDc5RENCOEE0IEUwRDVFOTFFIDk3RDJEOTg4IDA5QjY0QzJCIDdFQjE3Q0JEIEU3QjgyRDA3IDkwQkYxRDkxIDFEQjcxMDY0IDZBQjAyMEYyIEYzQjk3MTQ4IDg0QkU0MURFIDFBREFENDdEIDZERERFNEVCIEY0RDRCNTUxIDgzRDM4NUM3IDEzNkM5ODU2IDY0NkJBOEMwIEZENjJGOTdBIDhBNjVDOUVDIDE0MDE1QzRGIDYzMDY2Q0Q5IEZBMEYzRDYzIDhEMDgwREY1IDNCNkUyMEM4IDRDNjkxMDVFIEQ1NjA0MUU0IEEyNjc3MTcyIDNDMDNFNEQxIDRCMDRENDQ3IEQyMEQ4NUZEIEE1MEFCNTZCIDM1QjVBOEZBIDQyQjI5ODZDIERCQkJDOUQ2IEFDQkNGOTQwIDMyRDg2Q0UzIDQ1REY1Qzc1IERDRDYwRENGIEFCRDEzRDU5IDI2RDkzMEFDIDUxREUwMDNBIEM4RDc1MTgwIEJGRDA2MTE2IDIxQjRGNEI1IDU2QjNDNDIzIENGQkE5NTk5IEI4QkRBNTBGIDI4MDJCODlFIDVGMDU4ODA4IEM2MENEOUIyIEIxMEJFOTI0IDJGNkY3Qzg3IDU4Njg0QzExIEMxNjExREFCIEI2NjYyRDNEIDc2REM0MTkwIDAxREI3MTA2IDk4RDIyMEJDIEVGRDUxMDJBIDcxQjE4NTg5IDA2QjZCNTFGIDlGQkZFNEE1IEU4QjhENDMzIDc4MDdDOUEyIDBGMDBGOTM0IDk2MDlBODhFIEUxMEU5ODE4IDdGNkEwREJCIDA4NkQzRDJEIDkxNjQ2Qzk3IEU2NjM1QzAxIDZCNkI1MUY0IDFDNkM2MTYyIDg1NjUzMEQ4IEYyNjIwMDRFIDZDMDY5NUVEIDFCMDFBNTdCIDgyMDhGNEMxIEY1MEZDNDU3IDY1QjBEOUM2IDEyQjdFOTUwIDhCQkVCOEVBIEZDQjk4ODdDIDYyREQxRERGIDE1REEyRDQ5IDhDRDM3Q0YzIEZCRDQ0QzY1IDREQjI2MTU4IDNBQjU1MUNFIEEzQkMwMDc0IEQ0QkIzMEUyIDRBREZBNTQxIDNERDg5NUQ3IEE0RDFDNDZEIEQzRDZGNEZCIDQzNjlFOTZBIDM0NkVEOUZDIEFENjc4ODQ2IERBNjBCOEQwIDQ0MDQyRDczIDMzMDMxREU1IEFBMEE0QzVGIEREMEQ3Q0M5IDUwMDU3MTNDIDI3MDI0MUFBIEJFMEIxMDEwIEM5MEMyMDg2IDU3NjhCNTI1IDIwNkY4NUIzIEI5NjZENDA5IENFNjFFNDlGIDVFREVGOTBFIDI5RDlDOTk4IEIwRDA5ODIyIEM3RDdBOEI0IDU5QjMzRDE3IDJFQjQwRDgxIEI3QkQ1QzNCIEMwQkE2Q0FEIEVEQjg4MzIwIDlBQkZCM0I2IDAzQjZFMjBDIDc0QjFEMjlBIEVBRDU0NzM5IDlERDI3N0FGIDA0REIyNjE1IDczREMxNjgzIEUzNjMwQjEyIDk0NjQzQjg0IDBENkQ2QTNFIDdBNkE1QUE4IEU0MEVDRjBCIDkzMDlGRjlEIDBBMDBBRTI3IDdEMDc5RUIxIEYwMEY5MzQ0IDg3MDhBM0QyIDFFMDFGMjY4IDY5MDZDMkZFIEY3NjI1NzVEIDgwNjU2N0NCIDE5NkMzNjcxIDZFNkIwNkU3IEZFRDQxQjc2IDg5RDMyQkUwIDEwREE3QTVBIDY3REQ0QUNDIEY5QjlERjZGIDhFQkVFRkY5IDE3QjdCRTQzIDYwQjA4RUQ1IEQ2RDZBM0U4IEExRDE5MzdFIDM4RDhDMkM0IDRGREZGMjUyIEQxQkI2N0YxIEE2QkM1NzY3IDNGQjUwNkREIDQ4QjIzNjRCIEQ4MEQyQkRBIEFGMEExQjRDIDM2MDM0QUY2IDQxMDQ3QTYwIERGNjBFRkMzIEE4NjdERjU1IDMxNkU4RUVGIDQ2NjlCRTc5IENCNjFCMzhDIEJDNjY4MzFBIDI1NkZEMkEwIDUyNjhFMjM2IENDMEM3Nzk1IEJCMEI0NzAzIDIyMDIxNkI5IDU1MDUyNjJGIEM1QkEzQkJFIEIyQkQwQjI4IDJCQjQ1QTkyIDVDQjM2QTA0IEMyRDdGRkE3IEI1RDBDRjMxIDJDRDk5RThCIDVCREVBRTFEIDlCNjRDMkIwIEVDNjNGMjI2IDc1NkFBMzlDIDAyNkQ5MzBBIDlDMDkwNkE5IEVCMEUzNjNGIDcyMDc2Nzg1IDA1MDA1NzEzIDk1QkY0QTgyIEUyQjg3QTE0IDdCQjEyQkFFIDBDQjYxQjM4IDkyRDI4RTlCIEU1RDVCRTBEIDdDRENFRkI3IDBCREJERjIxIDg2RDNEMkQ0IEYxRDRFMjQyIDY4RERCM0Y4IDFGREE4MzZFIDgxQkUxNkNEIEY2QjkyNjVCIDZGQjA3N0UxIDE4Qjc0Nzc3IDg4MDg1QUU2IEZGMEY2QTcwIDY2MDYzQkNBIDExMDEwQjVDIDhGNjU5RUZGIEY4NjJBRTY5IDYxNkJGRkQzIDE2NkNDRjQ1IEEwMEFFMjc4IEQ3MEREMkVFIDRFMDQ4MzU0IDM5MDNCM0MyIEE3NjcyNjYxIEQwNjAxNkY3IDQ5Njk0NzREIDNFNkU3N0RCIEFFRDE2QTRBIEQ5RDY1QURDIDQwREYwQjY2IDM3RDgzQkYwIEE5QkNBRTUzIERFQkI5RUM1IDQ3QjJDRjdGIDMwQjVGRkU5IEJEQkRGMjFDIENBQkFDMjhBIDUzQjM5MzMwIDI0QjRBM0E2IEJBRDAzNjA1IENERDcwNjkzIDU0REU1NzI5IDIzRDk2N0JGIEIzNjY3QTJFIEM0NjE0QUI4IDVENjgxQjAyIDJBNkYyQjk0IEI0MEJCRTM3IEMzMEM4RUExIDVBMDVERjFCIDJEMDJFRjhEJy5zcGxpdChcbiAgICAgICcgJ1xuICAgICk7XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgaXMgTm9kZS5qcy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBydW5uaW5nIGluIE5vZGUuanMgZW52aXJvbm1lbnQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzTm9kZSgpIHtcbiAgICBjb25zdCBpc05vZGUgPSB3aW5kb3cgPT09IHZvaWQgMCAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnO1xuICAgIHJldHVybiBpc05vZGU7XG4gIH1cblxuICAvKipcbiAgICogRW5jb2RlcyBhIHN0cmluZyB0byBiYXNlNjQgZm9ybWF0LCBjb21wYXRpYmxlIHdpdGggYm90aCBicm93c2VyIGFuZCBOb2RlLmpzIGVudmlyb25tZW50cy5cbiAgICogQHBhcmFtIHN0ciAtIFRoZSBzdHJpbmcgdG8gZW5jb2RlXG4gICAqIEByZXR1cm5zIEJhc2U2NCBlbmNvZGVkIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGJ0b2Eoc3RyOiBzdHJpbmcpIHtcbiAgICBjb25zdCBpc05vZGUgPSBEYXRhVXRpbC5pc05vZGUoKTtcbiAgICBpZiAoaXNOb2RlKSB7XG4gICAgICBsZXQgYnVmZmVyOiBCdWZmZXI7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cikpIHtcbiAgICAgICAgYnVmZmVyID0gc3RyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnVmZmVyID0gQnVmZmVyLmZyb20oc3RyLnRvU3RyaW5nKCksICdiaW5hcnknKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgIH1cbiAgICByZXR1cm4gYnRvYShzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY29kZXMgYSBiYXNlNjQgc3RyaW5nLCBjb21wYXRpYmxlIHdpdGggYm90aCBicm93c2VyIGFuZCBOb2RlLmpzIGVudmlyb25tZW50cy5cbiAgICogQHBhcmFtIHN0ciAtIFRoZSBiYXNlNjQgc3RyaW5nIHRvIGRlY29kZVxuICAgKiBAcmV0dXJucyBEZWNvZGVkIGJpbmFyeSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhdG9iKHN0cjogc3RyaW5nKSB7XG4gICAgY29uc3QgaXNOb2RlID0gRGF0YVV0aWwuaXNOb2RlKCk7XG4gICAgaWYgKGlzTm9kZSkge1xuICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHN0ciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCdiaW5hcnknKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0b2Ioc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIGRhdGEgVVJJIHRvIGFuIEFycmF5QnVmZmVyLlxuICAgKiBAcGFyYW0gZGF0YVVyaSAtIFRoZSBkYXRhIFVSSSBzdHJpbmcgdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBBcnJheUJ1ZmZlciBjb250YWluaW5nIHRoZSBkZWNvZGVkIGRhdGFcbiAgICovXG4gIHN0YXRpYyBkYXRhVXJpVG9BcnJheUJ1ZmZlcihkYXRhVXJpOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzcGxpdERhdGFVcmkgPSBkYXRhVXJpLnNwbGl0KCcsJyk7XG4gICAgY29uc3QgYnl0ZVN0cmluZyA9IERhdGFVdGlsLmF0b2Ioc3BsaXREYXRhVXJpWzFdKTtcbiAgICBjb25zdCBieXRlU3RyaW5nTGVuZ3RoID0gYnl0ZVN0cmluZy5sZW5ndGg7XG4gICAgY29uc3QgYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoYnl0ZVN0cmluZ0xlbmd0aCk7XG4gICAgY29uc3QgdWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVTdHJpbmdMZW5ndGg7IGkrKykge1xuICAgICAgdWludDhBcnJheVtpXSA9IGJ5dGVTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5QnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIEFycmF5QnVmZmVyIHRvIGEgc3RyaW5nIHVzaW5nIFRleHREZWNvZGVyIHdoZW4gYXZhaWxhYmxlLlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGJ1ZmZlciBkYXRhXG4gICAqL1xuICBzdGF0aWMgYXJyYXlCdWZmZXJUb1N0cmluZyhhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBpZiAodHlwZW9mIFRleHREZWNvZGVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgICAgIHJldHVybiB0ZXh0RGVjb2Rlci5kZWNvZGUoYXJyYXlCdWZmZXIpO1xuICAgIH1cbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnVpbnQ4QXJyYXlUb1N0cmluZ0lubmVyKGJ5dGVzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgVWludDhBcnJheSB0byBhIHN0cmluZyB1c2luZyBUZXh0RGVjb2RlciB3aGVuIGF2YWlsYWJsZS5cbiAgICogQHBhcmFtIHVpbnQ4QXJyYXkgLSBUaGUgVWludDhBcnJheSB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYXJyYXkgZGF0YVxuICAgKi9cbiAgc3RhdGljIHVpbnQ4QXJyYXlUb1N0cmluZyh1aW50OEFycmF5OiBVaW50OEFycmF5KSB7XG4gICAgaWYgKHR5cGVvZiBUZXh0RGVjb2RlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnN0IHRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gICAgICByZXR1cm4gdGV4dERlY29kZXIuZGVjb2RlKHVpbnQ4QXJyYXkpO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnVpbnQ4QXJyYXlUb1N0cmluZ0lubmVyKHVpbnQ4QXJyYXkpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBzdHJpbmcgdG8gYmFzZTY0IGVuY29kaW5nLlxuICAgKiBAcGFyYW0gc3RyIC0gVGhlIHN0cmluZyB0byBlbmNvZGVcbiAgICogQHJldHVybnMgQmFzZTY0IGVuY29kZWQgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgc3RyaW5nVG9CYXNlNjQoc3RyOiBzdHJpbmcpIHtcbiAgICBsZXQgYjY0ID0gbnVsbDtcbiAgICBiNjQgPSBEYXRhVXRpbC5idG9hKHN0cik7XG4gICAgcmV0dXJuIGI2NDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIGJhc2U2NCBzdHJpbmcgdG8gYW4gQXJyYXlCdWZmZXIgKGJyb3dzZXIgZW52aXJvbm1lbnQgb25seSkuXG4gICAqIEBwYXJhbSBiYXNlNjQgLSBUaGUgYmFzZTY0IHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGRlY29kZWQgZGF0YVxuICAgKiBAdGhyb3dzIEVycm9yIGlmIG5vdCBydW5uaW5nIGluIGJyb3dzZXIgZW52aXJvbm1lbnRcbiAgICovXG4gIHN0YXRpYyBiYXNlNjRUb0FycmF5QnVmZmVyKGJhc2U2NDogc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zdCBiaW5hcnlfc3RyaW5nID0gd2luZG93LmF0b2IoYmFzZTY0KTtcbiAgICAgIGNvbnN0IGxlbiA9IGJpbmFyeV9zdHJpbmcubGVuZ3RoO1xuICAgICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShsZW4pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBieXRlc1tpXSA9IGJpbmFyeV9zdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBieXRlcy5idWZmZXI7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBmdW5jdGlvbiB3b3JrcyBpbiBicm93c2VyIGVudmlyb25tZW50LicpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgVWludDhBcnJheSB0byBhIGRhdGEgVVJMIGZvciBpbWFnZSBkaXNwbGF5LlxuICAgKiBAcGFyYW0gdWludDhhcnJheSAtIFRoZSBpbWFnZSBkYXRhIGFzIFVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHdpZHRoIC0gSW1hZ2Ugd2lkdGggaW4gcGl4ZWxzXG4gICAqIEBwYXJhbSBoZWlnaHQgLSBJbWFnZSBoZWlnaHQgaW4gcGl4ZWxzXG4gICAqIEByZXR1cm5zIERhdGEgVVJMIHN0cmluZyBmb3IgdGhlIGltYWdlXG4gICAqL1xuICBzdGF0aWMgVUludDhBcnJheVRvRGF0YVVSTCh1aW50OGFycmF5OiBVaW50OEFycmF5LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgY29uc3QgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG4gICAgY29uc3QgaW1hZ2VEYXRhID0gY3R4LmNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VEYXRhLmRhdGEubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAwXSA9IHVpbnQ4YXJyYXlbKGhlaWdodCAtIE1hdGguZmxvb3IoaSAvICg0ICogd2lkdGgpKSkgKiAoNCAqIHdpZHRoKSArIChpICUgKDQgKiB3aWR0aCkpICsgMF07XG4gICAgICBpbWFnZURhdGEuZGF0YVtpICsgMV0gPSB1aW50OGFycmF5WyhoZWlnaHQgLSBNYXRoLmZsb29yKGkgLyAoNCAqIHdpZHRoKSkpICogKDQgKiB3aWR0aCkgKyAoaSAlICg0ICogd2lkdGgpKSArIDFdO1xuICAgICAgaW1hZ2VEYXRhLmRhdGFbaSArIDJdID0gdWludDhhcnJheVsoaGVpZ2h0IC0gTWF0aC5mbG9vcihpIC8gKDQgKiB3aWR0aCkpKSAqICg0ICogd2lkdGgpICsgKGkgJSAoNCAqIHdpZHRoKSkgKyAyXTtcbiAgICAgIGltYWdlRGF0YS5kYXRhW2kgKyAzXSA9IHVpbnQ4YXJyYXlbKGhlaWdodCAtIE1hdGguZmxvb3IoaSAvICg0ICogd2lkdGgpKSkgKiAoNCAqIHdpZHRoKSArIChpICUgKDQgKiB3aWR0aCkpICsgM107XG4gICAgfVxuXG4gICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICAgIGNhbnZhcy5yZW1vdmUoKTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSByZXNvdXJjZSBhc3luY2hyb25vdXNseSB3aXRoIHN1cHBvcnQgZm9yIGJvdGggYmluYXJ5IGFuZCB0ZXh0IGRhdGEuXG4gICAqIEBwYXJhbSByZXNvdXJjZVVyaSAtIFVSSSBvZiB0aGUgcmVzb3VyY2UgdG8gbG9hZFxuICAgKiBAcGFyYW0gaXNCaW5hcnkgLSBXaGV0aGVyIHRvIGxvYWQgYXMgYmluYXJ5IGRhdGFcbiAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uIGZvciBzdWNjZXNzZnVsIGxvYWRpbmdcbiAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24gZm9yIGVycm9yIGhhbmRsaW5nXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBsb2FkZWQgcmVzb3VyY2VcbiAgICovXG4gIHN0YXRpYyBsb2FkUmVzb3VyY2VBc3luYyhcbiAgICByZXNvdXJjZVVyaTogc3RyaW5nLFxuICAgIGlzQmluYXJ5OiBib29sZWFuLFxuICAgIHJlc29sdmVDYWxsYmFjazogRnVuY3Rpb24sXG4gICAgcmVqZWN0Q2FsbGJhY2s6IEZ1bmN0aW9uXG4gICkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGlzTm9kZSA9IERhdGFVdGlsLmlzTm9kZSgpO1xuXG4gICAgICBpZiAoaXNOb2RlKSB7XG4gICAgICAgIC8vIGNvbnN0IGFyZ3M6IGFueVtdID0gW3Jlc291cmNlVXJpXTtcbiAgICAgICAgLy8gY29uc3QgZnVuYzogRnVuY3Rpb24gPSAoZXJyOmFueSwgcmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAvLyAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGlmIChyZWplY3RDYWxsYmFjaykge1xuICAgICAgICAvLyAgICAgICByZWplY3RDYWxsYmFjayhyZWplY3QsIGVycik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICByZXR1cm47XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAvLyAgICAgY29uc3QgYnVmZmVyID0gbmV3IEJ1ZmZlcihyZXNwb25zZSwgJ2JpbmFyeScpO1xuICAgICAgICAvLyAgICAgY29uc3QgdWludDhCdWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgICAvLyAgICAgcmVzcG9uc2UgPSB1aW50OEJ1ZmZlci5idWZmZXI7XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyAgIHJlc29sdmVDYWxsYmFjayhyZXNvbHZlLCByZXNwb25zZSk7XG4gICAgICAgIC8vIH07XG4gICAgICAgIC8vIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAvLyAgIGFyZ3MucHVzaChmdW5jKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICBhcmdzLnB1c2goJ3V0ZjgnKTtcbiAgICAgICAgLy8gICBhcmdzLnB1c2goZnVuYyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZnMucmVhZEZpbGUoLi4uYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB4bWxIdHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAgIHhtbEh0dHAub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAgICAgICByZXNwb25zZSA9IHhtbEh0dHAucmVzcG9uc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNwb25zZSA9IHhtbEh0dHAucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKHJlc29sdmUsIHJlc3BvbnNlKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHhtbEh0dHAub3BlbignR0VUJywgcmVzb3VyY2VVcmksIHRydWUpO1xuICAgICAgICAgIHhtbEh0dHAucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4bWxIdHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh4bWxIdHRwLnJlYWR5U3RhdGUgPT09IDQgJiYgKE1hdGguZmxvb3IoeG1sSHR0cC5zdGF0dXMgLyAxMDApID09PSAyIHx8IHhtbEh0dHAuc3RhdHVzID09PSAwKSkge1xuICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBudWxsO1xuICAgICAgICAgICAgICBpZiAoaXNCaW5hcnkpIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IHhtbEh0dHAucmVzcG9uc2U7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB4bWxIdHRwLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2socmVzb2x2ZSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKHJlamVjdENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2socmVqZWN0LCB4bWxIdHRwLnN0YXR1cyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHhtbEh0dHAub3BlbignR0VUJywgcmVzb3VyY2VVcmksIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1sSHR0cC5zZW5kKG51bGwpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgQ1JDMzIgY2hlY2tzdW0gZm9yIGEgZ2l2ZW4gc3RyaW5nLlxuICAgKiBAcGFyYW0gc3RyIC0gVGhlIHN0cmluZyB0byBjYWxjdWxhdGUgY2hlY2tzdW0gZm9yXG4gICAqIEByZXR1cm5zIENSQzMyIGNoZWNrc3VtIGFzIHVuc2lnbmVkIDMyLWJpdCBpbnRlZ2VyXG4gICAqL1xuICBzdGF0aWMgdG9DUkMzMihzdHI6IHN0cmluZykge1xuICAgIGxldCBjcmMgPSAwO1xuICAgIGxldCB4OiBhbnkgPSAwO1xuICAgIGxldCB5ID0gMDtcbiAgICBjb25zdCB0YWJsZSA9IERhdGFVdGlsLmNyYzMydGFibGU7XG5cbiAgICBjcmMgPSBjcmMgXiAtMTtcbiAgICBmb3IgKGxldCBpID0gMCwgaVRvcCA9IHN0ci5sZW5ndGg7IGkgPCBpVG9wOyArK2kpIHtcbiAgICAgIHkgPSAoY3JjIF4gc3RyLmNoYXJDb2RlQXQoaSkpICYgMHhmZjtcbiAgICAgIHggPSBgMHgke3RhYmxlW3ldfWA7XG4gICAgICBjcmMgPSAoY3JjID4+PiA4KSBeIHg7XG4gICAgfVxuXG4gICAgcmV0dXJuIChjcmMgXiAtMSkgPj4+IDA7XG4gIH1cblxuICAvKipcbiAgICogQWNjZXNzZXMgYmluYXJ5IGRhdGEgZnJvbSBhIGJ1ZmZlciB2aWV3IGFuZCBjb252ZXJ0cyBpdCB0byBhbiBpbWFnZSBkYXRhIFVSTC5cbiAgICogQHBhcmFtIGJ1ZmZlclZpZXdJbmRleCAtIEluZGV4IG9mIHRoZSBidWZmZXIgdmlldyBpbiB0aGUgSlNPTlxuICAgKiBAcGFyYW0ganNvbiAtIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgYnVmZmVyIHZpZXcgaW5mb3JtYXRpb25cbiAgICogQHBhcmFtIGJ1ZmZlciAtIFRoZSBzb3VyY2UgYnVmZmVyIGRhdGFcbiAgICogQHBhcmFtIG1pbWVUeXBlIC0gTUlNRSB0eXBlIG9mIHRoZSBpbWFnZVxuICAgKiBAcmV0dXJucyBEYXRhIFVSTCBzdHJpbmcgZm9yIHRoZSBpbWFnZVxuICAgKi9cbiAgc3RhdGljIGFjY2Vzc0JpbmFyeUFzSW1hZ2UoXG4gICAgYnVmZmVyVmlld0luZGV4OiBudW1iZXIsXG4gICAganNvbjogYW55LFxuICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIgfCBVaW50OEFycmF5LFxuICAgIG1pbWVUeXBlOiBzdHJpbmdcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCB1aW50OEJ1ZmZlclZpZXcgPSB0aGlzLnRha2VCdWZmZXJWaWV3QXNVaW50OEFycmF5KGpzb24sIGJ1ZmZlclZpZXdJbmRleCwgYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcy5hY2Nlc3NBcnJheUJ1ZmZlckFzSW1hZ2UodWludDhCdWZmZXJWaWV3LCBtaW1lVHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGJsb2IgaW1hZ2UgVVJJIGZyb20gYSBVaW50OEFycmF5LlxuICAgKiBAcGFyYW0gdWludDhBcnJheSAtIFRoZSBpbWFnZSBkYXRhIGFzIFVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIG1pbWVUeXBlIC0gTUlNRSB0eXBlIG9mIHRoZSBpbWFnZVxuICAgKiBAcmV0dXJucyBCbG9iIFVSTCBzdHJpbmcgZm9yIHRoZSBpbWFnZVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZUJsb2JJbWFnZVVyaUZyb21VaW50OEFycmF5KHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXksIG1pbWVUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIERhdGFVdGlsLl9fYXNzZXJ0QXJyYXlCdWZmZXJCYWNrZWQodWludDhBcnJheSwgJ1NoYXJlZEFycmF5QnVmZmVyIGlzIG5vdCBzdXBwb3J0ZWQgd2hlbiBjcmVhdGluZyBibG9iIGltYWdlIFVSSXMuJyk7XG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFt1aW50OEFycmF5XSwgeyB0eXBlOiBtaW1lVHlwZSB9KTtcbiAgICBjb25zdCBpbWFnZVVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgcmV0dXJuIGltYWdlVXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIGEgVWludDhBcnJheSBmcm9tIGEgYnVmZmVyIHZpZXcgYmFzZWQgb24gSlNPTiBzcGVjaWZpY2F0aW9uLlxuICAgKiBAcGFyYW0ganNvbiAtIFJuTTIgSlNPTiBvYmplY3QgY29udGFpbmluZyBidWZmZXIgdmlldyBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gYnVmZmVyVmlld0luZGV4IC0gSW5kZXggb2YgdGhlIGJ1ZmZlciB2aWV3XG4gICAqIEBwYXJhbSBidWZmZXIgLSBUaGUgc291cmNlIGJ1ZmZlciBkYXRhXG4gICAqIEByZXR1cm5zIFVpbnQ4QXJyYXkgdmlldyBvZiB0aGUgc3BlY2lmaWVkIGJ1ZmZlciByZWdpb25cbiAgICovXG4gIHN0YXRpYyB0YWtlQnVmZmVyVmlld0FzVWludDhBcnJheShqc29uOiBSbk0yLCBidWZmZXJWaWV3SW5kZXg6IG51bWJlciwgYnVmZmVyOiBBcnJheUJ1ZmZlciB8IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBidWZmZXJWaWV3SnNvbiA9IGpzb24uYnVmZmVyVmlld3NbYnVmZmVyVmlld0luZGV4XTtcbiAgICBsZXQgYnl0ZU9mZnNldCA9IGJ1ZmZlclZpZXdKc29uLmJ5dGVPZmZzZXQgPz8gMDtcbiAgICBjb25zdCBieXRlTGVuZ3RoID0gYnVmZmVyVmlld0pzb24uYnl0ZUxlbmd0aDtcbiAgICBsZXQgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyID0gYnVmZmVyIGFzIEFycmF5QnVmZmVyO1xuICAgIGlmIChidWZmZXIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBhcnJheUJ1ZmZlciA9IGJ1ZmZlci5idWZmZXIgYXMgQXJyYXlCdWZmZXI7XG4gICAgICBieXRlT2Zmc2V0ICs9IGJ1ZmZlci5ieXRlT2Zmc2V0O1xuICAgIH1cbiAgICBjb25zdCB1aW50OEJ1ZmZlclZpZXcgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlciwgYnl0ZU9mZnNldCwgYnl0ZUxlbmd0aCk7XG4gICAgcmV0dXJuIHVpbnQ4QnVmZmVyVmlldztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IHRvIGFuIGltYWdlIGRhdGEgVVJMLlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgaW1hZ2UgZGF0YSBidWZmZXJcbiAgICogQHBhcmFtIGltYWdlVHlwZSAtIFR5cGUvZm9ybWF0IG9mIHRoZSBpbWFnZVxuICAgKiBAcmV0dXJucyBEYXRhIFVSTCBzdHJpbmcgZm9yIHRoZSBpbWFnZVxuICAgKi9cbiAgc3RhdGljIGFjY2Vzc0FycmF5QnVmZmVyQXNJbWFnZShhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIgfCBVaW50OEFycmF5LCBpbWFnZVR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYmluYXJ5RGF0YSA9IHRoaXMudWludDhBcnJheVRvU3RyaW5nSW5uZXIobmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpKTtcbiAgICBjb25zdCBpbWdTcmMgPSB0aGlzLmdldEltYWdlVHlwZShpbWFnZVR5cGUpO1xuICAgIGNvbnN0IGRhdGFVcmwgPSBpbWdTcmMgKyBEYXRhVXRpbC5idG9hKGJpbmFyeURhdGEpO1xuICAgIHJldHVybiBkYXRhVXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCB0byBjb252ZXJ0IFVpbnQ4QXJyYXkgdG8gc3RyaW5nIHdpdGhvdXQgVGV4dERlY29kZXIuXG4gICAqIEBwYXJhbSB1aW50OCAtIFRoZSBVaW50OEFycmF5IHRvIGNvbnZlcnRcbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhcnJheSBkYXRhXG4gICAqL1xuICBzdGF0aWMgdWludDhBcnJheVRvU3RyaW5nSW5uZXIodWludDg6IFVpbnQ4QXJyYXkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNoYXJDb2RlQXJyYXk6IG51bWJlcltdID0gbmV3IEFycmF5KHVpbnQ4LmJ5dGVMZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWludDguYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyQ29kZUFycmF5W2ldID0gdWludDhbaV07XG4gICAgfVxuXG4gICAgLy8gdGhlIGFyZ3VtZW50IG9mIFN0cmluZy5mcm9tQ2hhckNvZGUgaGFzIHRoZSBsaW1pdCBvZiBhcnJheSBsZW5ndGhcbiAgICBjb25zdCBjb25zdGFudCA9IDEwMjQ7XG4gICAgY29uc3QgZGl2aXNpb25OdW1iZXIgPSBNYXRoLmNlaWwoY2hhckNvZGVBcnJheS5sZW5ndGggLyBjb25zdGFudCk7XG5cbiAgICBsZXQgYmluYXJ5RGF0YSA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGl2aXNpb25OdW1iZXI7IGkrKykge1xuICAgICAgYmluYXJ5RGF0YSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KHRoaXMsIGNoYXJDb2RlQXJyYXkuc2xpY2UoaSAqIGNvbnN0YW50LCAoaSArIDEpICogY29uc3RhbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJpbmFyeURhdGE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYXBwcm9wcmlhdGUgZGF0YSBVUkwgcHJlZml4IGZvciBhIGdpdmVuIGltYWdlIHR5cGUuXG4gICAqIEBwYXJhbSBpbWFnZVR5cGUgLSBUaGUgaW1hZ2UgdHlwZSBvciBNSU1FIHR5cGVcbiAgICogQHJldHVybnMgRGF0YSBVUkwgcHJlZml4IHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGdldEltYWdlVHlwZShpbWFnZVR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IGltZ1NyYyA9IG51bGw7XG4gICAgaWYgKGltYWdlVHlwZSA9PT0gJ2ltYWdlL2pwZWcnIHx8IGltYWdlVHlwZS50b0xvd2VyQ2FzZSgpID09PSAnanBnJyB8fCBpbWFnZVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ2pwZWcnKSB7XG4gICAgICBpbWdTcmMgPSAnZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwnO1xuICAgIH0gZWxzZSBpZiAoaW1hZ2VUeXBlID09PSAnaW1hZ2UvcG5nJyB8fCBpbWFnZVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3BuZycpIHtcbiAgICAgIGltZ1NyYyA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJztcbiAgICB9IGVsc2UgaWYgKGltYWdlVHlwZSA9PT0gJ2ltYWdlL2dpZicgfHwgaW1hZ2VUeXBlLnRvTG93ZXJDYXNlKCkgPT09ICdnaWYnKSB7XG4gICAgICBpbWdTcmMgPSAnZGF0YTppbWFnZS9naWY7YmFzZTY0LCc7XG4gICAgfSBlbHNlIGlmIChpbWFnZVR5cGUgPT09ICdpbWFnZS9ibXAnIHx8IGltYWdlVHlwZS50b0xvd2VyQ2FzZSgpID09PSAnYm1wJykge1xuICAgICAgaW1nU3JjID0gJ2RhdGE6aW1hZ2UvYm1wO2Jhc2U2NCwnO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbWdTcmMgPSAnZGF0YTppbWFnZS91bmtub3duO2Jhc2U2NCwnO1xuICAgIH1cbiAgICByZXR1cm4gaW1nU3JjO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIE1JTUUgdHlwZSBmcm9tIGEgZmlsZSBleHRlbnNpb24uXG4gICAqIEBwYXJhbSBleHRlbnNpb24gLSBUaGUgZmlsZSBleHRlbnNpb25cbiAgICogQHJldHVybnMgTUlNRSB0eXBlIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGdldE1pbWVUeXBlRnJvbUV4dGVuc2lvbihleHRlbnNpb246IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IGltZ1NyYyA9IG51bGw7XG4gICAgaWYgKGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSAnanBnJyB8fCBleHRlbnNpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2pwZWcnKSB7XG4gICAgICBpbWdTcmMgPSAnaW1hZ2UvanBlZyc7XG4gICAgfSBlbHNlIGlmIChleHRlbnNpb24udG9Mb3dlckNhc2UoKSA9PT0gJ3BuZycpIHtcbiAgICAgIGltZ1NyYyA9ICdpbWFnZS9wbmcnO1xuICAgIH0gZWxzZSBpZiAoZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09ICdnaWYnKSB7XG4gICAgICBpbWdTcmMgPSAnaW1hZ2UvZ2lmJztcbiAgICB9IGVsc2UgaWYgKGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSAnYm1wJykge1xuICAgICAgaW1nU3JjID0gJ2ltYWdlL2JtcCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGltZ1NyYyA9ICdpbWFnZS91bmtub3duJztcbiAgICB9XG4gICAgcmV0dXJuIGltZ1NyYztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyB0aGUgZmlsZSBleHRlbnNpb24gZnJvbSBhIGZpbGVuYW1lLlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgLSBUaGUgZmlsZW5hbWUgdG8gZXh0cmFjdCBleHRlbnNpb24gZnJvbVxuICAgKiBAcmV0dXJucyBGaWxlIGV4dGVuc2lvbiBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBnZXRFeHRlbnNpb24oZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3BsaXR0ZWQgPSBmaWxlTmFtZS5zcGxpdCgnLicpO1xuICAgIGNvbnN0IGZpbGVFeHRlbnNpb24gPSBzcGxpdHRlZFtzcGxpdHRlZC5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gZmlsZUV4dGVuc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgVWludDhBcnJheSBmcm9tIGJ1ZmZlciB2aWV3IGluZm9ybWF0aW9uIGluIGdsVEYgb3IgUm5NMiBmb3JtYXQuXG4gICAqIEBwYXJhbSBqc29uIC0gVGhlIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgYnVmZmVyIHZpZXcgaW5mb3JtYXRpb25cbiAgICogQHBhcmFtIGJ1ZmZlclZpZXdJbmRleCAtIEluZGV4IG9mIHRoZSBidWZmZXIgdmlld1xuICAgKiBAcGFyYW0gYnVmZmVyIC0gVGhlIHNvdXJjZSBidWZmZXIgZGF0YVxuICAgKiBAcmV0dXJucyBVaW50OEFycmF5IHZpZXcgb2YgdGhlIHNwZWNpZmllZCBidWZmZXIgcmVnaW9uXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlVWludDhBcnJheUZyb21CdWZmZXJWaWV3SW5mbyhcbiAgICBqc29uOiBSbk0yIHwgZ2xURjEsXG4gICAgYnVmZmVyVmlld0luZGV4OiBudW1iZXIsXG4gICAgYnVmZmVyOiBBcnJheUJ1ZmZlciB8IFVpbnQ4QXJyYXlcbiAgKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnVmZmVyVmlld0pzb24gPSBqc29uLmJ1ZmZlclZpZXdzW2J1ZmZlclZpZXdJbmRleF07XG4gICAgbGV0IGJ5dGVPZmZzZXQgPSBidWZmZXJWaWV3SnNvbi5ieXRlT2Zmc2V0ID8/IDA7XG4gICAgY29uc3QgYnl0ZUxlbmd0aCA9IGJ1ZmZlclZpZXdKc29uLmJ5dGVMZW5ndGg7XG4gICAgbGV0IGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciA9IGJ1ZmZlciBhcyBBcnJheUJ1ZmZlcjtcbiAgICBpZiAoYnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgYXJyYXlCdWZmZXIgPSBidWZmZXIuYnVmZmVyIGFzIEFycmF5QnVmZmVyO1xuICAgICAgYnl0ZU9mZnNldCArPSBidWZmZXIuYnl0ZU9mZnNldDtcbiAgICB9XG4gICAgY29uc3QgdWludDhCdWZmZXJWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIsIGJ5dGVPZmZzZXQsIGJ5dGVMZW5ndGgpO1xuICAgIHJldHVybiB1aW50OEJ1ZmZlclZpZXc7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBIVE1MSW1hZ2VFbGVtZW50IGZyb20gYSBVUkkgd2l0aCBwcm9wZXIgQ09SUyBoYW5kbGluZy5cbiAgICogQHBhcmFtIHVyaSAtIFRoZSBpbWFnZSBVUklcbiAgICogQHBhcmFtIG1pbWVUeXBlIC0gTUlNRSB0eXBlIG9mIHRoZSBpbWFnZVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGxvYWRlZCBIVE1MSW1hZ2VFbGVtZW50XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlSW1hZ2VGcm9tVXJpKHVyaTogc3RyaW5nLCBtaW1lVHlwZTogc3RyaW5nKTogUm5Qcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcbiAgICByZXR1cm4gbmV3IFJuUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1nLmNyb3NzT3JpZ2luID0gJ0Fub255bW91cyc7XG5cbiAgICAgIGlmICh1cmkubWF0Y2goL15ibG9iOi8pIHx8IHVyaS5tYXRjaCgvXmRhdGE6LykpIHtcbiAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGltZyk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5zcmMgPSB1cmk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsb2FkID0gKGltZzogSFRNTEltYWdlRWxlbWVudCwgcmVzcG9uc2U6IEFycmF5QnVmZmVyKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShyZXNwb25zZSk7XG4gICAgICAgICAgY29uc3QgaW1hZ2VVcmkgPSBEYXRhVXRpbC5jcmVhdGVCbG9iSW1hZ2VVcmlGcm9tVWludDhBcnJheShieXRlcywgbWltZVR5cGUpO1xuICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKGltZyk7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGltYWdlVXJpKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGltZy5zcmMgPSBpbWFnZVVyaTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBsb2FkQmluYXJ5SW1hZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChfaW1nID0+ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCAmJiB4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgbG9hZChfaW1nLCB4aHIucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKGltZyk7XG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVyaSk7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgfTtcbiAgICAgICAgbG9hZEJpbmFyeUltYWdlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBkZWZhdWx0IG9wdGlvbnMgZm9yIGdsVEYgbG9hZGluZyBvcGVyYXRpb25zLlxuICAgKiBAcmV0dXJucyBEZWZhdWx0IEdsdGZMb2FkT3B0aW9uIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlRGVmYXVsdEdsdGZPcHRpb25zKCk6IEdsdGZMb2FkT3B0aW9uIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogR2x0ZkxvYWRPcHRpb24gPSB7XG4gICAgICBmaWxlczoge1xuICAgICAgICAvLyAgICAgICAgXCJmb28uZ2x0ZlwiOiBjb250ZW50IG9mIGZpbGUgYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgIC8vICAgICAgICBcImZvby5iaW5cIjogY29udGVudCBvZiBmaWxlIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAvLyAgICAgICAgXCJib28ucG5nXCI6IGNvbnRlbnQgb2YgZmlsZSBhcyBBcnJheUJ1ZmZlclxuICAgICAgfSxcbiAgICAgIGxvYWRlckV4dGVuc2lvbjogdW5kZWZpbmVkLFxuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyTmFtZTogdW5kZWZpbmVkLFxuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheTogW3t9XSxcbiAgICAgIHN0YXRlc09mRWxlbWVudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRhcmdldHM6IFtdLCAvL1tcIm5hbWVfZm9vXCIsIFwibmFtZV9ib29cIl0sXG4gICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICBlbmFibGU6IFtcbiAgICAgICAgICAgICAgLy8gMzA0MiwgIC8vIEJMRU5EXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZnVuY3Rpb25zOiB7XG4gICAgICAgICAgICAgIC8vXCJibGVuZEZ1bmNTZXBhcmF0ZVwiOiBbMSwgMCwgMSwgMF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaXNUcmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgICAgICBvcGFjaXR5OiAxLjAsXG4gICAgICAgICAgaXNUZXh0dXJlSW1hZ2VUb0xvYWRQcmVNdWx0aXBsaWVkQWxwaGE6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHRhbmdlbnRDYWxjdWxhdGlvbk1vZGU6IDEsXG4gICAgICBleHRlbmRlZEpzb246IHZvaWQgMCwgLy8gICBVUkkgc3RyaW5nIC8gSlNPTiBPYmplY3QgLyBBcnJheUJ1ZmZlclxuICAgICAgX19pbXBvcnRlZFR5cGU6ICd1bmRlZmluZWQnLFxuICAgIH07XG5cbiAgICByZXR1cm4gZGVmYXVsdE9wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbiBBcnJheUJ1ZmZlciBmcm9tIGEgVVJJIHVzaW5nIHRoZSBGZXRjaCBBUEkuXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJJIHRvIGZldGNoIGZyb21cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgUmVzdWx0IGNvbnRhaW5pbmcgdGhlIEFycmF5QnVmZmVyIG9yIGVycm9yXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZmV0Y2hBcnJheUJ1ZmZlcih1cmk6IHN0cmluZyk6IFByb21pc2U8UmVzdWx0PEFycmF5QnVmZmVyLCB1bmtub3duPj4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJpLCB7IG1vZGU6ICdjb3JzJyB9KTtcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICByZXR1cm4gbmV3IEVycih7XG4gICAgICAgIG1lc3NhZ2U6IGBmZXRjaEFycmF5QnVmZmVyIGZhaWxlZC4gdXJpOiAke3VyaX1gLFxuICAgICAgICBlcnJvcjogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBhcnJheWJ1ZmZlciA9IGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCk7XG4gICAgcmV0dXJuIG5ldyBPayhhcnJheWJ1ZmZlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplcyBhbiBpbWFnZSB0byBmaXQgd2l0aGluIHNwZWNpZmllZCBkaW1lbnNpb25zIHdoaWxlIG1haW50YWluaW5nIGFzcGVjdCByYXRpby5cbiAgICogQHBhcmFtIGltYWdlIC0gVGhlIHNvdXJjZSBIVE1MSW1hZ2VFbGVtZW50XG4gICAqIEBwYXJhbSBtYXhTaXplIC0gTWF4aW11bSBzaXplIGZvciB0aGUgbGFyZ2VzdCBkaW1lbnNpb25cbiAgICogQHJldHVybnMgVHVwbGUgY29udGFpbmluZyB0aGUgcmVzaXplZCBjYW52YXMsIHdpZHRoLCBhbmQgaGVpZ2h0XG4gICAqL1xuICBzdGF0aWMgZ2V0UmVzaXplZENhbnZhcyhpbWFnZTogSFRNTEltYWdlRWxlbWVudCwgbWF4U2l6ZTogU2l6ZSk6IFtIVE1MQ2FudmFzRWxlbWVudCwgU2l6ZSwgU2l6ZV0ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNvbnN0IHBvdFdpZHRoID0gdGhpcy5nZXROZWFyZXN0UG93ZXJPZlR3byhpbWFnZS53aWR0aCk7XG4gICAgY29uc3QgcG90SGVpZ2h0ID0gdGhpcy5nZXROZWFyZXN0UG93ZXJPZlR3byhpbWFnZS5oZWlnaHQpO1xuXG4gICAgY29uc3QgYXNwZWN0ID0gcG90SGVpZ2h0IC8gcG90V2lkdGg7XG4gICAgbGV0IGRzdFdpZHRoID0gMDtcbiAgICBsZXQgZHN0SGVpZ2h0ID0gMDtcbiAgICBpZiAocG90V2lkdGggPiBwb3RIZWlnaHQpIHtcbiAgICAgIGRzdFdpZHRoID0gTWF0aC5taW4ocG90V2lkdGgsIG1heFNpemUpO1xuICAgICAgZHN0SGVpZ2h0ID0gZHN0V2lkdGggKiBhc3BlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRzdEhlaWdodCA9IE1hdGgubWluKHBvdEhlaWdodCwgbWF4U2l6ZSk7XG4gICAgICBkc3RXaWR0aCA9IGRzdEhlaWdodCAvIGFzcGVjdDtcbiAgICB9XG4gICAgY2FudmFzLndpZHRoID0gZHN0V2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGRzdEhlaWdodDtcblxuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0LCAwLCAwLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcblxuICAgIHJldHVybiBbY2FudmFzLCBkc3RXaWR0aCwgZHN0SGVpZ2h0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlY3RzIGlmIGFuIGltYWdlIGNvbnRhaW5zIHRyYW5zcGFyZW50IHBpeGVscyBiZWxvdyBhIHNwZWNpZmllZCB0aHJlc2hvbGQuXG4gICAqIEBwYXJhbSBpbWFnZSAtIFRoZSBpbWFnZSB0byBhbmFseXplIChIVE1MSW1hZ2VFbGVtZW50LCBIVE1MQ2FudmFzRWxlbWVudCwgb3IgSW1hZ2VEYXRhKVxuICAgKiBAcGFyYW0gdGhyZXNob2xkIC0gQWxwaGEgdGhyZXNob2xkIHZhbHVlIChkZWZhdWx0OiAxLjApXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdHJhbnNwYXJlbnQgcGl4ZWxzIGFyZSBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgZGV0ZWN0VHJhbnNwYXJlbnRQaXhlbEV4aXN0ZW5jZShcbiAgICBpbWFnZTogSFRNTEltYWdlRWxlbWVudCB8IEhUTUxDYW52YXNFbGVtZW50IHwgSW1hZ2VEYXRhLFxuICAgIHRocmVzaG9sZCA9IDEuMFxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCBkc3RXaWR0aCA9IGltYWdlLndpZHRoO1xuICAgIGNvbnN0IGRzdEhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICBsZXQgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgbGV0IGltYWdlRGF0YTogSW1hZ2VEYXRhO1xuICAgIGlmIChpbWFnZSBpbnN0YW5jZW9mIEltYWdlRGF0YSkge1xuICAgICAgaW1hZ2VEYXRhID0gaW1hZ2U7XG4gICAgfSBlbHNlIGlmIChpbWFnZSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgMCwgMCkhO1xuICAgICAgaW1hZ2VEYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBkc3RXaWR0aCwgZHN0SGVpZ2h0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbXVzdCBiZSBIVE1MQ2FudmFzSFRNTFxuICAgICAgY3R4ID0gaW1hZ2UuZ2V0Q29udGV4dCgnMmQnKSE7XG4gICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCAwLCAwKSE7XG4gICAgICBpbWFnZURhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRzdFdpZHRoLCBkc3RIZWlnaHQpO1xuICAgIH1cblxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgZHN0SGVpZ2h0OyB5KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgZHN0V2lkdGg7IHgrKykge1xuICAgICAgICBjb25zdCBhbHBoYSA9IGltYWdlRGF0YS5kYXRhWyh4ICsgeSAqIGRzdFdpZHRoKSAqIDQgKyAzXTtcbiAgICAgICAgaWYgKGFscGhhIDwgdGhyZXNob2xkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5lYXJlc3QgcG93ZXIgb2YgdHdvIHZhbHVlIGZvciBhIGdpdmVuIG51bWJlci5cbiAgICogQHBhcmFtIHggLSBUaGUgaW5wdXQgdmFsdWVcbiAgICogQHJldHVybnMgVGhlIG5lYXJlc3QgcG93ZXIgb2YgdHdvIHZhbHVlXG4gICAqL1xuICBzdGF0aWMgZ2V0TmVhcmVzdFBvd2VyT2ZUd28oeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMiAqKiBNYXRoLnJvdW5kKE1hdGgubG9nKHgpIC8gTWF0aC5MTjIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBwYWRkaW5nIGJ5dGVzIG5lZWRlZCBmb3IgYnl0ZSBhbGlnbm1lbnQuXG4gICAqIEBwYXJhbSBvcmlnaW5hbEJ5dGVMZW5ndGggLSBUaGUgb3JpZ2luYWwgYnl0ZSBsZW5ndGhcbiAgICogQHBhcmFtIGJ5dGVBbGlnbiAtIFRoZSBieXRlIGFsaWdubWVudCByZXF1aXJlbWVudFxuICAgKiBAcmV0dXJucyBOdW1iZXIgb2YgcGFkZGluZyBieXRlcyBuZWVkZWRcbiAgICovXG4gIHN0YXRpYyBjYWxjUGFkZGluZ0J5dGVzKG9yaWdpbmFsQnl0ZUxlbmd0aDogQnl0ZSwgYnl0ZUFsaWduOiBCeXRlKSB7XG4gICAgaWYgKG9yaWdpbmFsQnl0ZUxlbmd0aCAlIGJ5dGVBbGlnbiAhPT0gMCkge1xuICAgICAgY29uc3Qgc2l6ZVRvUGFkZGluZyA9IGJ5dGVBbGlnbiAtIChvcmlnaW5hbEJ5dGVMZW5ndGggJSBieXRlQWxpZ24pO1xuICAgICAgcmV0dXJuIHNpemVUb1BhZGRpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBwYWRkaW5nIGJ5dGVzIHRvIGFjaGlldmUgdGhlIHNwZWNpZmllZCBieXRlIGFsaWdubWVudC5cbiAgICogQHBhcmFtIG9yaWdpbmFsQnl0ZUxlbmd0aCAtIFRoZSBvcmlnaW5hbCBieXRlIGxlbmd0aFxuICAgKiBAcGFyYW0gYnl0ZUFsaWduIC0gVGhlIGJ5dGUgYWxpZ25tZW50IHJlcXVpcmVtZW50XG4gICAqIEByZXR1cm5zIFRoZSBwYWRkZWQgYnl0ZSBsZW5ndGhcbiAgICovXG4gIHN0YXRpYyBhZGRQYWRkaW5nQnl0ZXMob3JpZ2luYWxCeXRlTGVuZ3RoOiBCeXRlLCBieXRlQWxpZ246IEJ5dGUpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxCeXRlTGVuZ3RoICsgdGhpcy5jYWxjUGFkZGluZ0J5dGVzKG9yaWdpbmFsQnl0ZUxlbmd0aCwgYnl0ZUFsaWduKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBub3JtYWxpemVkIEludDhBcnJheSB2YWx1ZXMgdG8gRmxvYXQzMkFycmF5LlxuICAgKiBAcGFyYW0gZnJvbSAtIFNvdXJjZSBJbnQ4QXJyYXkgb3IgbnVtYmVyIGFycmF5XG4gICAqIEByZXR1cm5zIEZsb2F0MzJBcnJheSB3aXRoIG5vcm1hbGl6ZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplZEludDhBcnJheVRvRmxvYXQzMkFycmF5KGZyb206IEludDhBcnJheSB8IG51bWJlcltdKSB7XG4gICAgY29uc3QgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmcm9tLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcm9tLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbG9hdDMyQXJyYXlbaV0gPSBNYXRoLm1heChmcm9tW2ldIC8gMTI3LjAsIC0xLjApO1xuICAgIH1cbiAgICByZXR1cm4gZmxvYXQzMkFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIG5vcm1hbGl6ZWQgVWludDhBcnJheSB2YWx1ZXMgdG8gRmxvYXQzMkFycmF5LlxuICAgKiBAcGFyYW0gZnJvbSAtIFNvdXJjZSBVaW50OEFycmF5IG9yIG51bWJlciBhcnJheVxuICAgKiBAcmV0dXJucyBGbG9hdDMyQXJyYXkgd2l0aCBub3JtYWxpemVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZWRVaW50OEFycmF5VG9GbG9hdDMyQXJyYXkoZnJvbTogVWludDhBcnJheSB8IG51bWJlcltdKSB7XG4gICAgY29uc3QgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmcm9tLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcm9tLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbG9hdDMyQXJyYXlbaV0gPSBmcm9tW2ldIC8gMjU1LjA7XG4gICAgfVxuICAgIHJldHVybiBmbG9hdDMyQXJyYXk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgbm9ybWFsaXplZCBJbnQxNkFycmF5IHZhbHVlcyB0byBGbG9hdDMyQXJyYXkuXG4gICAqIEBwYXJhbSBmcm9tIC0gU291cmNlIEludDE2QXJyYXkgb3IgbnVtYmVyIGFycmF5XG4gICAqIEByZXR1cm5zIEZsb2F0MzJBcnJheSB3aXRoIG5vcm1hbGl6ZWQgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplZEludDE2QXJyYXlUb0Zsb2F0MzJBcnJheShmcm9tOiBJbnQxNkFycmF5IHwgbnVtYmVyW10pIHtcbiAgICBjb25zdCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZyb20ubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyb20ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZsb2F0MzJBcnJheVtpXSA9IE1hdGgubWF4KGZyb21baV0gLyAzMjc2Ny4wLCAtMS4wKTtcbiAgICB9XG4gICAgcmV0dXJuIGZsb2F0MzJBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBub3JtYWxpemVkIFVpbnQxNkFycmF5IHZhbHVlcyB0byBGbG9hdDMyQXJyYXkuXG4gICAqIEBwYXJhbSBmcm9tIC0gU291cmNlIFVpbnQxNkFycmF5IG9yIG51bWJlciBhcnJheVxuICAgKiBAcmV0dXJucyBGbG9hdDMyQXJyYXkgd2l0aCBub3JtYWxpemVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZWRVaW50MTZBcnJheVRvRmxvYXQzMkFycmF5KGZyb206IFVpbnQxNkFycmF5IHwgbnVtYmVyW10pIHtcbiAgICBjb25zdCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZyb20ubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyb20ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZsb2F0MzJBcnJheVtpXSA9IGZyb21baV0gLyA2NTUzNS4wO1xuICAgIH1cbiAgICByZXR1cm4gZmxvYXQzMkFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjb3B5IG9mIGFuIEFycmF5QnVmZmVyIHdpdGggc3BlY2lmaWVkIHBhcmFtZXRlcnMuXG4gICAqIEBwYXJhbSBwYXJhbTAgLSBDb3B5IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjIC0gU291cmNlIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjQnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIHNvdXJjZSBidWZmZXJcbiAgICogQHBhcmFtIHBhcmFtMC5jb3B5Qnl0ZUxlbmd0aCAtIE51bWJlciBvZiBieXRlcyB0byBjb3B5XG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdEJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBkZXN0aW5hdGlvbiBidWZmZXJcbiAgICogQHJldHVybnMgQ29waWVkIEFycmF5QnVmZmVyXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29weSh7XG4gICAgc3JjLFxuICAgIHNyY0J5dGVPZmZzZXQsXG4gICAgY29weUJ5dGVMZW5ndGgsXG4gICAgZGlzdEJ5dGVPZmZzZXQsXG4gIH06IHtcbiAgICBzcmM6IEFycmF5QnVmZmVyO1xuICAgIHNyY0J5dGVPZmZzZXQ6IEJ5dGU7XG4gICAgY29weUJ5dGVMZW5ndGg6IEJ5dGU7XG4gICAgZGlzdEJ5dGVPZmZzZXQ6IEJ5dGU7XG4gIH0pOiBBcnJheUJ1ZmZlciB7XG4gICAgY29uc3QgZHN0ID0gbmV3IEFycmF5QnVmZmVyKHNyYy5ieXRlTGVuZ3RoKTtcbiAgICBjb25zdCBkaXN0ID0gbmV3IFVpbnQ4QXJyYXkoZHN0LCBkaXN0Qnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGgpO1xuICAgIGRpc3Quc2V0KG5ldyBVaW50OEFycmF5KHNyYywgc3JjQnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGgpKTtcblxuICAgIHJldHVybiBkaXN0LmJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY29weSBvZiBhbiBBcnJheUJ1ZmZlciB1c2luZyA0LWJ5dGUgYWxpZ25lZCBvcGVyYXRpb25zLlxuICAgKiBAcGFyYW0gcGFyYW0wIC0gQ29weSBjb25maWd1cmF0aW9uIG9iamVjdFxuICAgKiBAcGFyYW0gcGFyYW0wLnNyYyAtIFNvdXJjZSBBcnJheUJ1ZmZlclxuICAgKiBAcGFyYW0gcGFyYW0wLnNyY0J5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBzb3VyY2UgYnVmZmVyIChtdXN0IGJlIDQtYnl0ZSBhbGlnbmVkKVxuICAgKiBAcGFyYW0gcGFyYW0wLmNvcHlCeXRlTGVuZ3RoIC0gTnVtYmVyIG9mIGJ5dGVzIHRvIGNvcHkgKG11c3QgYmUgNC1ieXRlIGFsaWduZWQpXG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdEJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBkZXN0aW5hdGlvbiBidWZmZXIgKG11c3QgYmUgNC1ieXRlIGFsaWduZWQpXG4gICAqIEByZXR1cm5zIENvcGllZCBBcnJheUJ1ZmZlclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIGJ5dGUgb2Zmc2V0cyBhcmUgbm90IDQtYnl0ZSBhbGlnbmVkXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29weUFzNEJ5dGVzKHtcbiAgICBzcmMsXG4gICAgc3JjQnl0ZU9mZnNldCxcbiAgICBjb3B5Qnl0ZUxlbmd0aCxcbiAgICBkaXN0Qnl0ZU9mZnNldCxcbiAgfToge1xuICAgIHNyYzogQXJyYXlCdWZmZXI7XG4gICAgc3JjQnl0ZU9mZnNldDogQnl0ZTtcbiAgICBjb3B5Qnl0ZUxlbmd0aDogQnl0ZTtcbiAgICBkaXN0Qnl0ZU9mZnNldDogQnl0ZTtcbiAgfSk6IEFycmF5QnVmZmVyIHtcbiAgICBpZiAoc3JjQnl0ZU9mZnNldCAlIDQgIT09IDAgfHwgY29weUJ5dGVMZW5ndGggJSA0ICE9PSAwIHx8IGRpc3RCeXRlT2Zmc2V0ICUgNCAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJ5dGUgYWxpZ24gZm9yIDRieXRlcyB1bml0IGNvcHkgb3BlcmF0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCBkc3QgPSBuZXcgQXJyYXlCdWZmZXIoc3JjLmJ5dGVMZW5ndGgpO1xuICAgIGNvbnN0IGRpc3QgPSBuZXcgSW50MzJBcnJheShkc3QsIGRpc3RCeXRlT2Zmc2V0LCBjb3B5Qnl0ZUxlbmd0aCAvIDQpO1xuICAgIGRpc3Quc2V0KG5ldyBJbnQzMkFycmF5KHNyYywgc3JjQnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGggLyA0KSk7XG5cbiAgICByZXR1cm4gZGlzdC5idWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGRhdGEgZnJvbSBzb3VyY2UgQXJyYXlCdWZmZXIgdG8gZGVzdGluYXRpb24gQXJyYXlCdWZmZXIuXG4gICAqIEBwYXJhbSBwYXJhbTAgLSBDb3B5IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjIC0gU291cmNlIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdCAtIERlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjQnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIHNvdXJjZSBidWZmZXJcbiAgICogQHBhcmFtIHBhcmFtMC5jb3B5Qnl0ZUxlbmd0aCAtIE51bWJlciBvZiBieXRlcyB0byBjb3B5XG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdEJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBkZXN0aW5hdGlvbiBidWZmZXIgKGRlZmF1bHQ6IDApXG4gICAqIEByZXR1cm5zIFRoZSBkZXN0aW5hdGlvbiBBcnJheUJ1ZmZlclxuICAgKi9cbiAgc3RhdGljIGNvcHlBcnJheUJ1ZmZlcih7XG4gICAgc3JjLFxuICAgIGRpc3QsXG4gICAgc3JjQnl0ZU9mZnNldCxcbiAgICBjb3B5Qnl0ZUxlbmd0aCxcbiAgICBkaXN0Qnl0ZU9mZnNldCA9IDAsXG4gIH06IHtcbiAgICBzcmM6IEFycmF5QnVmZmVyO1xuICAgIGRpc3Q6IEFycmF5QnVmZmVyO1xuICAgIHNyY0J5dGVPZmZzZXQ6IEJ5dGU7XG4gICAgY29weUJ5dGVMZW5ndGg6IEJ5dGU7XG4gICAgZGlzdEJ5dGVPZmZzZXQ6IEJ5dGU7XG4gIH0pOiBBcnJheUJ1ZmZlciB7XG4gICAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoZGlzdCwgZGlzdEJ5dGVPZmZzZXQsIGNvcHlCeXRlTGVuZ3RoKTtcbiAgICBkc3Quc2V0KG5ldyBVaW50OEFycmF5KHNyYywgc3JjQnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGgpKTtcblxuICAgIHJldHVybiBkc3QuYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBkYXRhIGZyb20gc291cmNlIEFycmF5QnVmZmVyIHRvIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyIHdpdGggcGFkZGluZyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSBwYXJhbTAgLSBDb3B5IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjIC0gU291cmNlIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdCAtIERlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjQnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIHNvdXJjZSBidWZmZXJcbiAgICogQHBhcmFtIHBhcmFtMC5jb3B5Qnl0ZUxlbmd0aCAtIE51bWJlciBvZiBieXRlcyB0byBjb3B5XG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdEJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBkZXN0aW5hdGlvbiBidWZmZXJcbiAgICogQHJldHVybnMgVGhlIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqL1xuICBzdGF0aWMgY29weUFycmF5QnVmZmVyV2l0aFBhZGRpbmcoe1xuICAgIHNyYyxcbiAgICBkaXN0LFxuICAgIHNyY0J5dGVPZmZzZXQsXG4gICAgY29weUJ5dGVMZW5ndGgsXG4gICAgZGlzdEJ5dGVPZmZzZXQsXG4gIH06IHtcbiAgICBzcmM6IEFycmF5QnVmZmVyO1xuICAgIGRpc3Q6IEFycmF5QnVmZmVyO1xuICAgIHNyY0J5dGVPZmZzZXQ6IEJ5dGU7XG4gICAgY29weUJ5dGVMZW5ndGg6IEJ5dGU7XG4gICAgZGlzdEJ5dGVPZmZzZXQ6IEJ5dGU7XG4gIH0pOiBBcnJheUJ1ZmZlciB7XG4gICAgY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoZGlzdCwgZGlzdEJ5dGVPZmZzZXQsIGNvcHlCeXRlTGVuZ3RoKTtcbiAgICBjb25zdCBieXRlRGlmZiA9IHNyYy5ieXRlTGVuZ3RoIC0gc3JjQnl0ZU9mZnNldCAtIGNvcHlCeXRlTGVuZ3RoO1xuICAgIGlmIChieXRlRGlmZiA8IDApIHtcbiAgICAgIGRzdC5zZXQobmV3IFVpbnQ4QXJyYXkoc3JjLCBzcmNCeXRlT2Zmc2V0LCBzcmMuYnl0ZUxlbmd0aCAtIHNyY0J5dGVPZmZzZXQpKTtcbiAgICAgIGNvbnN0IGJ5dGVDb3VudCA9IC1ieXRlRGlmZjtcbiAgICAgIGNvbnN0IHBhZGRpbmdBcnJheUJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ5dGVDb3VudCk7XG4gICAgICBkc3Quc2V0KHBhZGRpbmdBcnJheUJ1ZmZlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRzdC5zZXQobmV3IFVpbnQ4QXJyYXkoc3JjLCBzcmNCeXRlT2Zmc2V0LCBjb3B5Qnl0ZUxlbmd0aCkpO1xuICAgIH1cblxuICAgIHJldHVybiBkc3QuYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBkYXRhIHVzaW5nIDQtYnl0ZSBhbGlnbmVkIG9wZXJhdGlvbnMgZnJvbSBzb3VyY2UgdG8gZGVzdGluYXRpb24gQXJyYXlCdWZmZXIuXG4gICAqIEBwYXJhbSBwYXJhbTAgLSBDb3B5IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjIC0gU291cmNlIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdCAtIERlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjQnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIHNvdXJjZSBidWZmZXIgKG11c3QgYmUgNC1ieXRlIGFsaWduZWQpXG4gICAqIEBwYXJhbSBwYXJhbTAuY29weUJ5dGVMZW5ndGggLSBOdW1iZXIgb2YgYnl0ZXMgdG8gY29weSAobXVzdCBiZSA0LWJ5dGUgYWxpZ25lZClcbiAgICogQHBhcmFtIHBhcmFtMC5kaXN0Qnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIGRlc3RpbmF0aW9uIGJ1ZmZlciAobXVzdCBiZSA0LWJ5dGUgYWxpZ25lZClcbiAgICogQHJldHVybnMgVGhlIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgYnl0ZSBvZmZzZXRzIGFyZSBub3QgNC1ieXRlIGFsaWduZWRcbiAgICovXG4gIHN0YXRpYyBjb3B5QXJyYXlCdWZmZXJBczRCeXRlcyh7XG4gICAgc3JjLFxuICAgIGRpc3QsXG4gICAgc3JjQnl0ZU9mZnNldCxcbiAgICBjb3B5Qnl0ZUxlbmd0aCxcbiAgICBkaXN0Qnl0ZU9mZnNldCxcbiAgfToge1xuICAgIHNyYzogQXJyYXlCdWZmZXI7XG4gICAgZGlzdDogQXJyYXlCdWZmZXI7XG4gICAgc3JjQnl0ZU9mZnNldDogQnl0ZTtcbiAgICBjb3B5Qnl0ZUxlbmd0aDogQnl0ZTtcbiAgICBkaXN0Qnl0ZU9mZnNldDogQnl0ZTtcbiAgfSk6IEFycmF5QnVmZmVyIHtcbiAgICBpZiAoc3JjQnl0ZU9mZnNldCAlIDQgIT09IDAgfHwgY29weUJ5dGVMZW5ndGggJSA0ICE9PSAwIHx8IGRpc3RCeXRlT2Zmc2V0ICUgNCAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJ5dGUgYWxpZ24gZm9yIDRieXRlcyB1bml0IGNvcHkgb3BlcmF0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCBkc3QgPSBuZXcgSW50MzJBcnJheShkaXN0LCBkaXN0Qnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGggLyA0KTtcbiAgICBkc3Quc2V0KG5ldyBJbnQzMkFycmF5KHNyYywgc3JjQnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGggLyA0KSk7XG5cbiAgICByZXR1cm4gZHN0LmJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgZGF0YSB1c2luZyA0LWJ5dGUgYWxpZ25lZCBvcGVyYXRpb25zIHdpdGggcGFkZGluZyB0byBhY2hpZXZlIDQtYnl0ZSBhbGlnbm1lbnQuXG4gICAqIEBwYXJhbSBwYXJhbTAgLSBDb3B5IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjIC0gU291cmNlIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdCAtIERlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBwYXJhbTAuc3JjQnl0ZU9mZnNldCAtIEJ5dGUgb2Zmc2V0IGluIHNvdXJjZSBidWZmZXJcbiAgICogQHBhcmFtIHBhcmFtMC5jb3B5Qnl0ZUxlbmd0aCAtIE51bWJlciBvZiBieXRlcyB0byBjb3B5XG4gICAqIEBwYXJhbSBwYXJhbTAuZGlzdEJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBpbiBkZXN0aW5hdGlvbiBidWZmZXJcbiAgICogQHJldHVybnMgVGhlIGRlc3RpbmF0aW9uIEFycmF5QnVmZmVyXG4gICAqL1xuICBzdGF0aWMgY29weUFycmF5QnVmZmVyQXM0Qnl0ZXNXaXRoUGFkZGluZyh7XG4gICAgc3JjLFxuICAgIGRpc3QsXG4gICAgc3JjQnl0ZU9mZnNldCxcbiAgICBjb3B5Qnl0ZUxlbmd0aCxcbiAgICBkaXN0Qnl0ZU9mZnNldCxcbiAgfToge1xuICAgIHNyYzogQXJyYXlCdWZmZXI7XG4gICAgZGlzdDogQXJyYXlCdWZmZXI7XG4gICAgc3JjQnl0ZU9mZnNldDogQnl0ZTtcbiAgICBjb3B5Qnl0ZUxlbmd0aDogQnl0ZTtcbiAgICBkaXN0Qnl0ZU9mZnNldDogQnl0ZTtcbiAgfSk6IEFycmF5QnVmZmVyIHtcbiAgICBjb25zdCBkc3QgPSBuZXcgSW50MzJBcnJheShkaXN0LCBkaXN0Qnl0ZU9mZnNldCwgY29weUJ5dGVMZW5ndGggLyA0KTtcbiAgICBjb25zdCBieXRlRGlmZiA9IHNyYy5ieXRlTGVuZ3RoIC0gc3JjQnl0ZU9mZnNldCAtIGNvcHlCeXRlTGVuZ3RoO1xuXG4gICAgaWYgKGJ5dGVEaWZmIDwgMCkge1xuICAgICAgZHN0LnNldChuZXcgSW50MzJBcnJheShzcmMsIHNyY0J5dGVPZmZzZXQsIChzcmMuYnl0ZUxlbmd0aCAtIHNyY0J5dGVPZmZzZXQpIC8gNCkpO1xuICAgICAgY29uc3QgYnl0ZUNvdW50ID0gLWJ5dGVEaWZmO1xuICAgICAgY29uc3QgcGFkZGluZ0FycmF5QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZUNvdW50KTtcbiAgICAgIGRzdC5zZXQocGFkZGluZ0FycmF5QnVmZmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZHN0LnNldChuZXcgSW50MzJBcnJheShzcmMsIHNyY0J5dGVPZmZzZXQsIGNvcHlCeXRlTGVuZ3RoIC8gNCkpO1xuICAgIH1cblxuICAgIHJldHVybiBkc3QuYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgc3RyaW5nIHRvIGFuIEFycmF5QnVmZmVyIHVzaW5nIFRleHRFbmNvZGVyLlxuICAgKiBAcGFyYW0gc3JjIC0gVGhlIHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGVuY29kZWQgc3RyaW5nIGRhdGFcbiAgICovXG4gIHN0YXRpYyBzdHJpbmdUb0J1ZmZlcihzcmM6IHN0cmluZyk6IEFycmF5QnVmZmVyIHtcbiAgICBjb25zdCBlbmMgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICByZXR1cm4gZW5jLmVuY29kZShzcmMpLmJ1ZmZlciBhcyBBcnJheUJ1ZmZlcjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFJQSxTQUFTLEtBQUssVUFBdUI7QUFDckMsU0FBUyxpQkFBaUI7QUFTbkIsSUFBTSxZQUFOLE1BQU0sVUFBUztBQUFBLEVBQ3BCLE9BQWVBLEdBQ2IsTUFDQSxTQUNrRDtBQUNsRCxRQUFJLEVBQUUsS0FBSyxrQkFBa0IsY0FBYztBQUN6QyxZQUFNLElBQUksTUFBTSxPQUFPO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLE9BQU8sU0FBUztBQUNkLFVBQU0sU0FBUyxXQUFXLFVBQVUsT0FBTyxZQUFZLGVBQWUsT0FBTyxjQUFZO0FBQ3pGLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxLQUFLLEtBQWE7QUFDdkIsVUFBTSxTQUFTLFVBQVMsT0FB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QUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEdBTWdCO0FBQ2QsVUFBTSxNQUFNLElBQUksV0FBVyxNQUFNLGdCQUFnQixpQkFBaUIsQ0FBQztBQUNuRSxVQUFNLFdBQVcsSUFBSSxhQUFhLGdCQUFnQjtBQUVsRCxRQUFJLFdBQVcsR0FBRztBQUNoQixVQUFJLElBQUksSUFBSSxXQUFXLEtBQUssZ0JBQWdCLElBQUksYUFBYSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2hGLFlBQU0sWUFBWSxDQUFDO0FBQ25CLFlBQU0scUJBQXFCLElBQUksV0FBVyxTQUFTO0FBQ25ELFVBQUksSUFBSSxrQkFBa0I7QUFBQSxJQUM1QixPQUFPO0FBQ0wsVUFBSSxJQUFJLElBQUksV0FBVyxLQUFLLGVBQWUsaUJBQWlCLENBQUMsQ0FBQztBQUFBLElBQ2hFO0FBRUEsV0FBTyxJQUFJO0FBQUEsRUFDYjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sZUFBZSxLQUEwQjtBQUM5QyxVQUFNLE1BQU0sSUFBSSxZQUFZO0FBQzVCLFdBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRTtBQUFBLEVBQ3pCO0FBQ0Y7QUFBQTtBQUFBO0FBQUE7QUEvMkJhLFVBWUosYUFDTCxrd0VBQWt3RTtBQUFBLEVBQ2h3RTtBQUNGO0FBZkcsSUFBTSxXQUFOOyIsCiAgIm5hbWVzIjogWyJfX2Fzc2VydEFycmF5QnVmZmVyQmFja2VkIiwgImltZyJdCn0K
