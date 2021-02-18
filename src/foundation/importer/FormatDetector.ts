import DataUtil from '../misc/DataUtil';
import { FileType, FileTypeEnum } from '../../foundation/definitions/FileType';

export function detectFormatByArrayBuffers(files: { [s: string]: ArrayBuffer }) : FileTypeEnum
{
  for (let fileName in files) {
    const fileExtension = DataUtil.getExtension(fileName);

    if (fileExtension === 'gltf') {
      return FileType.Gltf
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

export function detectFormatByUri(uri: string) : string
{
  const split = uri.split('.');
  const fileExtension = split[split.length - 1];

  if (fileExtension === 'efk') {
    return 'Effekseer';
  } else if (fileExtension === 'drc') {
    return 'Draco';
  } else if (fileExtension === 'vrm') {
    return 'VRM';
  } else if (fileExtension === 'gltf') {
    return 'glTF'
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

function checkVersionOfGltf(arrayBuffer: ArrayBuffer) {
  const isLittleEndian = true;

  const dataView = new DataView(arrayBuffer, 0, 20);
  // Magic field
  const magic = dataView.getUint32(0, isLittleEndian);

  // 0x46546C67 is 'glTF' in ASCII codes.
  if (magic !== 0x46546C67) {
    // It must be normal glTF (NOT binary) file...
    let gotText = DataUtil.arrayBufferToString(arrayBuffer);

    let gltfJson = JSON.parse(gotText);

    let glTFVer = checkGLTFVersion(gltfJson);

    return "glTF" + glTFVer;

  } else {
    let glTFVer = dataView.getUint32(4, isLittleEndian);
    return "glTF" + glTFVer;
  }
}

function checkGLTFVersion(gltfJson: any) {
  let glTFVer = 1.0;
  if (gltfJson.asset && gltfJson.asset.version) {
    glTFVer = parseFloat(gltfJson.asset.version);
  }
  return glTFVer;
}
