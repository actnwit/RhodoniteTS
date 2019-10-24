import DataUtil from "../misc/DataUtil";

export default async function detectFormat(uri: string, files?: { [s: string]: ArrayBuffer }) {

  if (files) {
    for (let fileName in files) {
      const fileExtension = DataUtil.getExtension(fileName);

      if (fileExtension === 'gltf' || fileExtension === 'glb') {
        return new Promise((resolve, reject) => {
          checkArrayBufferOfGltf(files[fileName], resolve);
        });
      } else if (fileExtension === 'drc') {
        return new Promise((resolve, reject) => {
          resolve('Draco');
        });
      } else if (fileExtension === 'vrm') {
        return new Promise((resolve, reject) => {
          resolve('VRM');
        });
      }
    }
  }

  const splitted = uri.split('.');
  const fileExtension = splitted[splitted.length - 1];

  if (fileExtension === 'efk') {
    return new Promise((resolve, reject) => {
      resolve('Effekseer');
    });
  } else if (fileExtension === 'drc') {
    return new Promise((resolve, reject) => {
      resolve('Draco');
    });
  } else if (fileExtension === 'vrm') {
    return new Promise((resolve, reject) => {
      resolve('VRM');
    });
  }

  // glTF
  return DataUtil.loadResourceAsync(uri, true,
    (resolve: Function, response: any) => {
      const arrayBuffer = response;
      checkArrayBufferOfGltf(arrayBuffer, resolve);
    }, (rejects: any, status: any) => {
      console.log(status);
    }
  );

}

function checkArrayBufferOfGltf(arrayBuffer: ArrayBuffer, resolve: Function) {
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

    resolve("glTF" + glTFVer);

    return;
  }

  let glTFVer = dataView.getUint32(4, isLittleEndian);
  resolve("glTF" + glTFVer);
}

function checkGLTFVersion(gltfJson: any) {
  let glTFVer = 1.0;
  if (gltfJson.asset && gltfJson.asset.version) {
    glTFVer = parseFloat(gltfJson.asset.version);
  }
  return glTFVer;
}
