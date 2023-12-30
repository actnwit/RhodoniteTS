import { GltfLoadOption } from '../../types';
import { Byte, Size } from '../../types/CommonTypes';
import { glTF1 } from '../../types/glTF1';
import { RnM2 } from '../../types/RnM2';
import { Result } from './Result';
import { RnPromise } from './RnPromise';
export declare class DataUtil {
    static crc32table: string[];
    static isNode(): boolean;
    static btoa(str: string): string;
    static atob(str: string): string;
    static dataUriToArrayBuffer(dataUri: string): ArrayBuffer;
    static arrayBufferToString(arrayBuffer: ArrayBuffer): string;
    static uint8ArrayToString(uint8Array: Uint8Array): string;
    static stringToBase64(str: string): string;
    static base64ToArrayBuffer(base64: string): ArrayBufferLike;
    static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number): string;
    static loadResourceAsync(resourceUri: string, isBinary: boolean, resolveCallback: Function, rejectCallback: Function): Promise<any>;
    static toCRC32(str: string): number;
    static accessBinaryAsImage(bufferViewIndex: number, json: any, buffer: ArrayBuffer | Uint8Array, mimeType: string): string;
    static createBlobImageUriFromUint8Array(uint8Array: Uint8Array, mimeType: string): string;
    static takeBufferViewAsUint8Array(json: RnM2, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static accessArrayBufferAsImage(arrayBuffer: ArrayBuffer | Uint8Array, imageType: string): string;
    static uint8ArrayToStringInner(uint8: Uint8Array): string;
    static getImageType(imageType: string): string;
    static getMimeTypeFromExtension(extension: string): string;
    static getExtension(fileName: string): string;
    static createUint8ArrayFromBufferViewInfo(json: RnM2 | glTF1, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static createImageFromUri(uri: string, mimeType: string): RnPromise<HTMLImageElement>;
    static createDefaultGltfOptions(): GltfLoadOption;
    static fetchArrayBuffer(uri: string): Promise<Result<ArrayBuffer, unknown>>;
    static getResizedCanvas(image: HTMLImageElement, maxSize: Size): [HTMLCanvasElement, Size, Size];
    static detectTransparentPixelExistence(image: HTMLImageElement | HTMLCanvasElement | ImageData, threshold?: number): boolean;
    /**
     * get a value nearest power of two.
     *
     * @param x texture size.
     * @returns a value nearest power of two.
     */
    static getNearestPowerOfTwo(x: number): number;
    static calcPaddingBytes(originalByteLength: Byte, byteAlign: Byte): number;
    static addPaddingBytes(originalByteLength: Byte, byteAlign: Byte): number;
    static normalizedInt8ArrayToFloat32Array(from: Int8Array | number[]): Float32Array;
    static normalizedUint8ArrayToFloat32Array(from: Uint8Array | number[]): Float32Array;
    static normalizedInt16ArrayToFloat32Array(from: Int16Array | number[]): Float32Array;
    static normalizedUint16ArrayToFloat32Array(from: Uint16Array | number[]): Float32Array;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static getCopy({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static getCopyAs4Bytes({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBuffer({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferAs4Bytes({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer with padding to be 4bytes aligined
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferAs4BytesWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    static stringToBuffer(src: string): ArrayBuffer;
}
