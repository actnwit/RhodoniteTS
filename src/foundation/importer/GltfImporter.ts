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
import {Vrm0xImporter} from './Vrm0xImporter';
import {Is} from '../misc';

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
    uri: string,
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    options = this.__initOptions(options);

    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    options.files![uri] = arrayBuffer;

    await this.__detectTheModelFileTypeAndImport(
      uri,
      renderPasses,
      options,
      uri,
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
   * Import GLTF or VRM from ArrayBuffers.
   * @param files ArrayBuffers of glTF/VRM files
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

    const renderPasses = options.expression?.renderPasses || [];
    if (renderPasses.length === 0) {
      renderPasses.push(new RenderPass());
    }

    for (const fileName in files) {
      // filename is uri with file extension
      const fileExtension = DataUtil.getExtension(fileName);
      // if the file is main file type?
      if (this.__isValidExtension(fileExtension)) {
        await this.__detectTheModelFileTypeAndImport(
          fileName,
          renderPasses,
          options,
          fileName,
          callback
        );
      }
    }

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

  private static async __detectTheModelFileTypeAndImport(
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
          const gltfModel = await importer.importGltf(
            json,
            options.files!,
            options,
            fileName,
            callback
          );
          const rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
          renderPasses[0].addEntities([rootGroup]);
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
          const gltfModel = await importer.importGlb(
            fileArrayBuffer,
            options.files!,
            options
          );
          const rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
          renderPasses[0].addEntities([rootGroup]);
        }
        break;
      case FileType.Draco:
        {
          const importer =
            DrcPointCloudImporter.getInstance() as DrcPointCloudImporter;
          const gltfModel = await importer.importArrayBuffer(
            uri,
            fileArrayBuffer,
            options
          );
          if (gltfModel == null) {
            console.error('importArrayBuffer error is occurred');
          } else {
            const rootGroup =
              ModelConverter.convertToRhodoniteObject(gltfModel);
            renderPasses[0].addEntities([rootGroup]);
          }
        }
        break;
      case FileType.VRM:
        {
          options.__isImportVRM = true;
          const gltfModel =
            await Gltf2Importer._importGltfOrGlbFromArrayBuffers(
              fileArrayBuffer,
              options.files!,
              options
            );
          if (Is.not.exist(gltfModel)) {
            return;
          }
          if (gltfModel.extensionsUsed.indexOf('VRMC_vrm') > 0) {
            // TODO: support VRM1.0
            console.error('VRM1.0 is not supported yet');
          } else if (gltfModel.extensionsUsed.indexOf('VRM') > 0) {
            await Vrm0xImporter.__importVRM0x(gltfModel, renderPasses);
          }
        }
        break;
      default:
        console.error('detect invalid format');
    }
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
