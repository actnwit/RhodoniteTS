import { GltfLoadOption } from "../../commontypes/glTF";
export default class DataUtil {
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
    static takeBufferViewAsUint8Array(json: any, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static accessArrayBufferAsImage(arrayBuffer: ArrayBuffer | Uint8Array, imageType: string): string;
    static uint8ArrayToStringInner(uint8: Uint8Array): string;
    static getImageType(imageType: string): string;
    static getMimeTypeFromExtension(extension: string): string;
    static getExtension(fileName: string): string;
    static createUint8ArrayFromBufferViewInfo(json: any, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static createImageFromUri(uri: string, mimeType: string): Promise<HTMLImageElement>;
    static createDefaultGltfOptions(): GltfLoadOption;
    static fetchArrayBuffer(uri: string): Promise<ArrayBuffer>;
}
