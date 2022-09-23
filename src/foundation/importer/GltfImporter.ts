import {detectFormatByArrayBuffers} from './FormatDetector';
import {Gltf2Importer} from './Gltf2Importer';
import {RnM2} from '../../types/RnM2';
import {ModelConverter} from './ModelConverter';
import {Gltf1Importer} from './Gltf1Importer';
import {DrcPointCloudImporter} from './DrcPointCloudImporter';
import {Expression} from '../renderer/Expression';
import {RenderPass} from '../renderer/RenderPass';
import {DataUtil} from '../misc/DataUtil';
import {FileType} from '../definitions/FileType';
import {glTF1} from '../../types/glTF1';
import {GltfFileBuffers, GltfLoadOption} from '../../types';
import {RnPromise, RnPromiseCallback} from '../misc/RnPromise';
import {VrmImporter} from './VrmImporter';

/**
 * Importer class which can import GLTF and VRM.
 */
export class GltfImporter {
  private constructor() {}

  /**
   * Import GLTF or VRM file.
   * @param uris uri or array of uri of glTF file
   * @param options options for loading process where the files property is ignored
   * @returns gltf expression where:
   *            renderPasses[0]: model entities
   *            renderPasses[1]: model outlines
   */
  static async import(
    uris: string | string[],
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    if (!Array.isArray(uris)) {
      uris = typeof uris === 'string' ? [uris] : [];
    }
    options = this.__initOptions(options);

    const renderPasses: RenderPass[] = await this.__importMultipleModelsFromUri(
      uris,
      options,
      callback
    );

    if (options && options.cameraComponent) {
      for (const renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    const expression = this.__setRenderPassesToExpression(
      renderPasses,
      options
    );
    return expression;
  }

  /**
   * Import GLTF or VRM file.
   * @param uris uri or array of uri of glTF file
   * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
   * @returns gltf expression where:
   *            renderPasses[0]: model entities
   *            renderPasses[1]: model outlines
   */
  static async importFromArrayBuffers(
    files: GltfFileBuffers,
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    options = this.__initOptions(options);

    const renderPasses: RenderPass[] =
      await this.__importMultipleModelsFromArrayBuffers(
        files,
        options,
        callback
      );

    if (options && options.cameraComponent) {
      for (const renderPass of renderPasses) {
        renderPass.cameraComponent = options.cameraComponent;
      }
    }

    return this.__setRenderPassesToExpression(renderPasses, options);
  }

  private static __initOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options == null) {
      options = DataUtil.createDefaultGltfOptions();
    } else {
      if (options.files == null) {
        options.files = {};
      }

      for (const file in options.files) {
        if (file.match(/.*\.vrm$/) == null) {
          continue;
        }

        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      if (Array.isArray(options.defaultMaterialHelperArgumentArray) === false) {
        options.defaultMaterialHelperArgumentArray = [{}];
      } else {
        // avoid needless processing
        if (
          options.defaultMaterialHelperArgumentArray![0].isMorphing === false
        ) {
          options.maxMorphTargetNumber = 0;
        }
      }
    }

    return options!;
  }

  private static __setRenderPassesToExpression(
    renderPasses: RenderPass[],
    options: GltfLoadOption
  ) {
    const expression = options.expression ?? new Expression();

    if (expression.renderPasses !== renderPasses) {
      expression.clearRenderPasses();
      expression.addRenderPasses(renderPasses);
    }

    return expression;
  }

  private static __importMultipleModelsFromUri(
    uris: string[],
    options: GltfLoadOption,
    callback?: RnPromiseCallback
  ): RnPromise<RenderPass[]> {
    const importPromises = [];
    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (const uri of uris) {
      // import the glTF file from uri of uris array
      if (uri !== '' && options.files![uri] == null) {
        importPromises.push(
          this.__importToRenderPassesFromUriPromise(uri, renderPasses, options)
        );
      }
    }

    return RnPromise.all(importPromises, callback).then(() => {
      return renderPasses;
    }) as RnPromise<RenderPass[]>;
  }

  private static __importMultipleModelsFromArrayBuffers(
    files: GltfFileBuffers,
    options: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<RenderPass[]> {
    const importPromises = [];
    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (const fileName in files) {
      // filename is uri
      const fileExtension = DataUtil.getExtension(fileName);
      if (this.__isValidExtension(fileExtension)) {
        importPromises.push(
          this.__importToRenderPassesFromArrayBufferPromise(
            fileName,
            renderPasses,
            options,
            fileName,
            callback
          )
        );
      }
    }

    return RnPromise.all(importPromises).then(() => {
      return renderPasses;
    });
  }

  private static __isValidExtension(fileExtension: string) {
    if (
      fileExtension === 'gltf' ||
      fileExtension === 'glb' ||
      fileExtension === 'vrm' ||
      fileExtension === 'drc'
    ) {
      return true;
    } else {
      return false;
    }
  }

  private static __importToRenderPassesFromUriPromise(
    uri: string,
    renderPasses: RenderPass[],
    options: GltfLoadOption
  ) {
    return DataUtil.fetchArrayBuffer(uri).then((arrayBuffer: ArrayBuffer) => {
      options.files![uri] = arrayBuffer;
      return this.__importToRenderPassesFromArrayBufferPromise(
        uri,
        renderPasses,
        options,
        uri
      );
    });
  }

  private static __isGlb(arrayBuffer: ArrayBuffer) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    // Magic field
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    // The 0x46546C67 means 'glTF' string in glb files.
    if (magic === 0x46546c67) {
      return true;
    } else {
      return false;
    }
  }

  private static __getGlbVersion(glbArrayBuffer: ArrayBuffer) {
    const dataView = new DataView(glbArrayBuffer, 0, 20);
    const isLittleEndian = true;
    const glbVer = dataView.getUint32(4, isLittleEndian);
    return glbVer;
  }

  private static __getGltfVersion(gltfJson: glTF1 | RnM2) {
    if ((gltfJson as RnM2).asset?.version?.charAt(0) === '2') {
      return 2;
    } else {
      return 1;
    }
  }

  private static __importToRenderPassesFromArrayBufferPromise(
    fileName: string,
    renderPasses: RenderPass[],
    options: GltfLoadOption,
    uri: string,
    callback?: RnPromiseCallback
  ) {
    const optionalFileType = options.fileType;

    const fileType = this.__getFileTypeFromFilePromise(
      fileName,
      options,
      optionalFileType
    );

    return new RnPromise((resolve, reject) => {
      const fileArrayBuffer = options.files![fileName];
      options.__isImportVRM = false;
      let glTFVer = 0; // 0: not glTF, 1: glTF1, 2: glTF2
      switch (fileType) {
        case FileType.Gltf:
          {
            const gotText = DataUtil.arrayBufferToString(fileArrayBuffer);
            const json = JSON.parse(gotText);
            glTFVer = this.__getGltfVersion(json);
            let importer;
            if (glTFVer === 1) {
              importer = Gltf1Importer;
            } else {
              importer = Gltf2Importer;
            }
            importer
              .importGltf(json, options.files!, options, fileName, callback)
              .then(gltfModel => {
                const rootGroup =
                  ModelConverter.convertToRhodoniteObject(gltfModel);
                renderPasses[0].addEntities([rootGroup]);
                resolve();
              });
          }
          break;
        case FileType.GltfBinary:
          {
            glTFVer = this.__getGlbVersion(fileArrayBuffer);
            let importer;
            if (glTFVer === 1) {
              importer = Gltf1Importer;
            } else {
              importer = Gltf2Importer;
            }
            importer
              .importGlb(fileArrayBuffer, options.files!, options)
              .then(gltfModel => {
                const rootGroup =
                  ModelConverter.convertToRhodoniteObject(gltfModel);
                renderPasses[0].addEntities([rootGroup]);
                resolve();
              });
          }
          break;
        case FileType.Draco:
          {
            const importer =
              DrcPointCloudImporter.getInstance() as DrcPointCloudImporter;
            importer
              .importArrayBuffer(uri, fileArrayBuffer, options)
              .then(gltfModel => {
                if (gltfModel == null) {
                  console.error('importArrayBuffer error is occurred');
                  reject();
                } else {
                  const rootGroup =
                    ModelConverter.convertToRhodoniteObject(gltfModel);
                  renderPasses[0].addEntities([rootGroup]);
                  resolve();
                }
              });
          }
          break;
        case FileType.VRM:
          options.__isImportVRM = true;
          VrmImporter.__importVRM(
            uri,
            fileArrayBuffer,
            renderPasses,
            options
          ).then(() => {
            resolve();
          });
          break;
        default:
          console.error('detect invalid format');
          reject();
      }
    }) as RnPromise<void>;
  }

  private static __getFileTypeFromFilePromise(
    fileName: string,
    options: GltfLoadOption,
    optionalFileType?: string
  ) {
    if (optionalFileType != null) {
      return FileType.fromString(optionalFileType);
    } else {
      const fileType = detectFormatByArrayBuffers({
        [fileName]: options.files![fileName],
      });
      return fileType;
    }
  }
}
