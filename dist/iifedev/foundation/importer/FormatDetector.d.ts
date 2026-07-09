import { type FileTypeEnum } from '../../foundation/definitions/FileType';
/**
 * Detects the file format based on file extensions from a collection of ArrayBuffers.
 *
 * @param files - An object containing filename-ArrayBuffer pairs
 * @returns The detected file type as FileTypeEnum, or FileType.Unknown if no supported format is detected
 *
 * @example
 * ```typescript
 * const files = { 'model.gltf': arrayBuffer };
 * const format = detectFormatByArrayBuffers(files);
 * console.log(format); // FileType.Gltf
 * ```
 */
export declare function detectFormatByArrayBuffers(files: {
    [s: string]: ArrayBuffer;
}): FileTypeEnum;
/**
 * Detects the file format based on the URI's file extension.
 *
 * @param uri - The URI string to analyze for format detection
 * @returns A string representing the detected format name, or 'Unknown' if no supported format is detected
 *
 * @example
 * ```typescript
 * const format = detectFormatByUri('path/to/model.gltf');
 * console.log(format); // 'glTF'
 * ```
 */
export declare function detectFormatByUri(uri: string): string;
/**
 * Checks the version of a glTF file by analyzing its ArrayBuffer content.
 * Supports both binary (.glb) and text (.gltf) formats.
 *
 * @param arrayBuffer - The ArrayBuffer containing the glTF file data
 * @returns A string indicating the glTF format and version (e.g., 'glTF2.0', 'glTF1.0')
 *
 * @internal
 * This function distinguishes between binary glTF (GLB) and regular glTF by checking
 * the magic number at the beginning of the file. For GLB files, it reads the version
 * directly from the header. For regular glTF files, it parses the JSON to extract
 * the version from the asset.version field.
 */
export declare function checkVersionOfGltf(arrayBuffer: ArrayBuffer): string;
