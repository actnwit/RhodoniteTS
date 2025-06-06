import { DataUtil } from '../misc/DataUtil';
import { FileType, type FileTypeEnum } from '../../foundation/definitions/FileType';

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
export function detectFormatByArrayBuffers(files: { [s: string]: ArrayBuffer }): FileTypeEnum {
  for (const fileName in files) {
    const fileExtension = DataUtil.getExtension(fileName);

    if (fileExtension === 'gltf') {
      return FileType.Gltf;
    } else if (fileExtension === 'glb') {
      return FileType.GltfBinary;
    } else if (fileExtension === 'vrm') {
      return FileType.VRM;
    } else if (fileExtension === 'drc') {
      return FileType.Draco;
    }
  }
  return FileType.Unknown;
}

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
export function detectFormatByUri(uri: string): string {
  const split = uri.split('.');
  const fileExtension = split[split.length - 1];

  if (fileExtension === 'efk') {
    return 'Effekseer';
  } else if (fileExtension === 'drc') {
    return 'Draco';
  } else if (fileExtension === 'vrm') {
    return 'VRM';
  } else if (fileExtension === 'gltf') {
    return 'glTF';
  }

  return 'Unknown';

  // // glTF
  // return DataUtil.loadResourceAsync(uri, true,
  //   (resolve: Function, response: any) => {
  //     const arrayBuffer = response;
  //     checkVersionOfGltf(arrayBuffer);
  //     console.warn('discard downloaded arrayBuffer');
  //   }, (rejects: any, status: any) => {
  //     console.log(status);
  //   }
  // );
}

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
function checkVersionOfGltf(arrayBuffer: ArrayBuffer) {
  const isLittleEndian = true;

  const dataView = new DataView(arrayBuffer, 0, 20);
  // Magic field
  const magic = dataView.getUint32(0, isLittleEndian);

  // 0x46546C67 is 'glTF' in ASCII codes.
  if (magic !== 0x46546c67) {
    // It must be normal glTF (NOT binary) file...
    const gotText = DataUtil.arrayBufferToString(arrayBuffer);

    const gltfJson = JSON.parse(gotText);

    const glTFVer = checkGLTFVersion(gltfJson);

    return 'glTF' + glTFVer;
  } else {
    const glTFVer = dataView.getUint32(4, isLittleEndian);
    return 'glTF' + glTFVer;
  }
}

/**
 * Extracts the glTF version number from a parsed glTF JSON object.
 *
 * @param gltfJson - The parsed glTF JSON object
 * @returns The glTF version as a number (defaults to 1.0 if version is not specified)
 *
 * @internal
 * This function looks for the version information in the asset.version field
 * of the glTF JSON structure. If no version is found, it defaults to 1.0
 * for backward compatibility.
 */
function checkGLTFVersion(gltfJson: any) {
  let glTFVer = 1.0;
  if (gltfJson.asset && gltfJson.asset.version) {
    glTFVer = Number.parseFloat(gltfJson.asset.version);
  }
  return glTFVer;
}
