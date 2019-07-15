export default class DataUtil {
    static isNode(): boolean;
    static btoa(str: string): string;
    static atob(str: string): string;
    static base64ToArrayBuffer(dataUri: string): ArrayBuffer;
    static arrayBufferToString(arrayBuffer: ArrayBuffer): string;
    static stringToBase64(str: string): string;
    static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number): string;
    static loadResourceAsync(resourceUri: string, isBinary: boolean, resolveCallback: Function, rejectCallback: Function): Promise<unknown>;
}
