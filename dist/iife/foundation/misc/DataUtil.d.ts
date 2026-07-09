import type { GltfLoadOption } from '../../types';
import type { Byte, Size } from '../../types/CommonTypes';
import type { glTF1 } from '../../types/glTF1';
import type { RnM2 } from '../../types/RnM2';
import { type Result } from './Result';
import { RnPromise } from './RnPromise';
/**
 * Utility class for data manipulation, conversion, and processing operations.
 * Provides methods for handling various data formats including ArrayBuffer, Uint8Array,
 * base64 encoding/decoding, image processing, and file operations.
 */
export declare class DataUtil {
    private static __assertArrayBufferBacked;
    /**
     * CRC32 lookup table for checksum calculations.
     */
    static crc32table: string[];
    /**
     * Determines if the current environment is Node.js.
     * @returns True if running in Node.js environment, false otherwise
     */
    static isNode(): boolean;
    /**
     * Encodes a string to base64 format, compatible with both browser and Node.js environments.
     * @param str - The string to encode
     * @returns Base64 encoded string
     */
    static btoa(str: string): string;
    /**
     * Decodes a base64 string, compatible with both browser and Node.js environments.
     * @param str - The base64 string to decode
     * @returns Decoded binary string
     */
    static atob(str: string): string;
    /**
     * Converts a data URI to an ArrayBuffer.
     * @param dataUri - The data URI string to convert
     * @returns ArrayBuffer containing the decoded data
     */
    static dataUriToArrayBuffer(dataUri: string): ArrayBuffer;
    /**
     * Converts an ArrayBuffer to a string using TextDecoder when available.
     * @param arrayBuffer - The ArrayBuffer to convert
     * @returns String representation of the buffer data
     */
    static arrayBufferToString(arrayBuffer: ArrayBuffer): string;
    /**
     * Converts a Uint8Array to a string using TextDecoder when available.
     * @param uint8Array - The Uint8Array to convert
     * @returns String representation of the array data
     */
    static uint8ArrayToString(uint8Array: Uint8Array): string;
    /**
     * Converts a string to base64 encoding.
     * @param str - The string to encode
     * @returns Base64 encoded string
     */
    static stringToBase64(str: string): string;
    /**
     * Converts a base64 string to an ArrayBuffer (browser environment only).
     * @param base64 - The base64 string to convert
     * @returns ArrayBuffer containing the decoded data
     * @throws Error if not running in browser environment
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer;
    /**
     * Converts a Uint8Array to a data URL for image display.
     * @param uint8array - The image data as Uint8Array
     * @param width - Image width in pixels
     * @param height - Image height in pixels
     * @returns Data URL string for the image
     */
    static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number): string;
    /**
     * Loads a resource asynchronously with support for both binary and text data.
     * @param resourceUri - URI of the resource to load
     * @param isBinary - Whether to load as binary data
     * @param resolveCallback - Callback function for successful loading
     * @param rejectCallback - Callback function for error handling
     * @returns Promise that resolves with the loaded resource
     */
    static loadResourceAsync(resourceUri: string, isBinary: boolean, resolveCallback: Function, rejectCallback: Function): Promise<any>;
    /**
     * Calculates CRC32 checksum for a given string.
     * @param str - The string to calculate checksum for
     * @returns CRC32 checksum as unsigned 32-bit integer
     */
    static toCRC32(str: string): number;
    /**
     * Accesses binary data from a buffer view and converts it to an image data URL.
     * @param bufferViewIndex - Index of the buffer view in the JSON
     * @param json - JSON object containing buffer view information
     * @param buffer - The source buffer data
     * @param mimeType - MIME type of the image
     * @returns Data URL string for the image
     */
    static accessBinaryAsImage(bufferViewIndex: number, json: any, buffer: ArrayBuffer | Uint8Array, mimeType: string): string;
    /**
     * Creates a blob image URI from a Uint8Array.
     * @param uint8Array - The image data as Uint8Array
     * @param mimeType - MIME type of the image
     * @returns Blob URL string for the image
     */
    static createBlobImageUriFromUint8Array(uint8Array: Uint8Array, mimeType: string): string;
    /**
     * Extracts a Uint8Array from a buffer view based on JSON specification.
     * @param json - RnM2 JSON object containing buffer view information
     * @param bufferViewIndex - Index of the buffer view
     * @param buffer - The source buffer data
     * @returns Uint8Array view of the specified buffer region
     */
    static takeBufferViewAsUint8Array(json: RnM2, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    /**
     * Converts ArrayBuffer or Uint8Array to an image data URL.
     * @param arrayBuffer - The image data buffer
     * @param imageType - Type/format of the image
     * @returns Data URL string for the image
     */
    static accessArrayBufferAsImage(arrayBuffer: ArrayBuffer | Uint8Array, imageType: string): string;
    /**
     * Internal method to convert Uint8Array to string without TextDecoder.
     * @param uint8 - The Uint8Array to convert
     * @returns String representation of the array data
     */
    static uint8ArrayToStringInner(uint8: Uint8Array): string;
    /**
     * Gets the appropriate data URL prefix for a given image type.
     * @param imageType - The image type or MIME type
     * @returns Data URL prefix string
     */
    static getImageType(imageType: string): string;
    /**
     * Gets the MIME type from a file extension.
     * @param extension - The file extension
     * @returns MIME type string
     */
    static getMimeTypeFromExtension(extension: string): string;
    /**
     * Extracts the file extension from a filename.
     * @param fileName - The filename to extract extension from
     * @returns File extension string
     */
    static getExtension(fileName: string): string;
    /**
     * Creates a Uint8Array from buffer view information in glTF or RnM2 format.
     * @param json - The JSON object containing buffer view information
     * @param bufferViewIndex - Index of the buffer view
     * @param buffer - The source buffer data
     * @returns Uint8Array view of the specified buffer region
     */
    static createUint8ArrayFromBufferViewInfo(json: RnM2 | glTF1, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    /**
     * Creates an HTMLImageElement from a URI with proper CORS handling.
     * @param uri - The image URI
     * @param mimeType - MIME type of the image
     * @returns Promise that resolves to the loaded HTMLImageElement
     */
    static createImageFromUri(uri: string, mimeType: string): RnPromise<HTMLImageElement>;
    /**
     * Creates default options for glTF loading operations.
     * @returns Default GltfLoadOption configuration object
     */
    static createDefaultGltfOptions(): GltfLoadOption;
    /**
     * Fetches an ArrayBuffer from a URI using the Fetch API.
     * @param uri - The URI to fetch from
     * @returns Promise that resolves to a Result containing the ArrayBuffer or error
     */
    static fetchArrayBuffer(uri: string): Promise<Result<ArrayBuffer, unknown>>;
    /**
     * Resizes an image to fit within specified dimensions while maintaining aspect ratio.
     * @param image - The source HTMLImageElement
     * @param maxSize - Maximum size for the largest dimension
     * @returns Tuple containing the resized canvas, width, and height
     */
    static getResizedCanvas(image: HTMLImageElement, maxSize: Size): [HTMLCanvasElement, Size, Size];
    /**
     * Detects if an image contains transparent pixels below a specified threshold.
     * @param image - The image to analyze (HTMLImageElement, HTMLCanvasElement, or ImageData)
     * @param threshold - Alpha threshold value (default: 1.0)
     * @returns True if transparent pixels are found, false otherwise
     */
    static detectTransparentPixelExistence(image: HTMLImageElement | HTMLCanvasElement | ImageData, threshold?: number): boolean;
    /**
     * Gets the nearest power of two value for a given number.
     * @param x - The input value
     * @returns The nearest power of two value
     */
    static getNearestPowerOfTwo(x: number): number;
    /**
     * Calculates the number of padding bytes needed for byte alignment.
     * @param originalByteLength - The original byte length
     * @param byteAlign - The byte alignment requirement
     * @returns Number of padding bytes needed
     */
    static calcPaddingBytes(originalByteLength: Byte, byteAlign: Byte): number;
    /**
     * Adds padding bytes to achieve the specified byte alignment.
     * @param originalByteLength - The original byte length
     * @param byteAlign - The byte alignment requirement
     * @returns The padded byte length
     */
    static addPaddingBytes(originalByteLength: Byte, byteAlign: Byte): number;
    /**
     * Converts normalized Int8Array values to Float32Array.
     * @param from - Source Int8Array or number array
     * @returns Float32Array with normalized values
     */
    static normalizedInt8ArrayToFloat32Array(from: Int8Array | number[]): Float32Array<ArrayBuffer>;
    /**
     * Converts normalized Uint8Array values to Float32Array.
     * @param from - Source Uint8Array or number array
     * @returns Float32Array with normalized values
     */
    static normalizedUint8ArrayToFloat32Array(from: Uint8Array | number[]): Float32Array<ArrayBuffer>;
    /**
     * Converts normalized Int16Array values to Float32Array.
     * @param from - Source Int16Array or number array
     * @returns Float32Array with normalized values
     */
    static normalizedInt16ArrayToFloat32Array(from: Int16Array | number[]): Float32Array<ArrayBuffer>;
    /**
     * Converts normalized Uint16Array values to Float32Array.
     * @param from - Source Uint16Array or number array
     * @returns Float32Array with normalized values
     */
    static normalizedUint16ArrayToFloat32Array(from: Uint16Array | number[]): Float32Array<ArrayBuffer>;
    /**
     * Creates a copy of an ArrayBuffer with specified parameters.
     * @param param0 - Copy configuration object
     * @param param0.src - Source ArrayBuffer
     * @param param0.srcByteOffset - Byte offset in source buffer
     * @param param0.copyByteLength - Number of bytes to copy
     * @param param0.distByteOffset - Byte offset in destination buffer
     * @returns Copied ArrayBuffer
     */
    static getCopy({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
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
    static getCopyAs4Bytes({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
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
    static copyArrayBuffer({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
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
    static copyArrayBufferWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
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
    static copyArrayBufferAs4Bytes({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
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
    static copyArrayBufferAs4BytesWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte;
        copyByteLength: Byte;
        distByteOffset: Byte;
    }): ArrayBuffer;
    /**
     * Converts a string to an ArrayBuffer using TextEncoder.
     * @param src - The string to convert
     * @returns ArrayBuffer containing the encoded string data
     */
    static stringToBuffer(src: string): ArrayBuffer;
}
