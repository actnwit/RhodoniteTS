import { detectFormatByArrayBuffers } from './FormatDetector';
import { Gltf2Importer } from './Gltf2Importer';
import type { RnM2 } from '../../types/RnM2';
import { ModelConverter } from './ModelConverter';
import { DrcPointCloudImporter } from './DrcPointCloudImporter';
import { Expression } from '../renderer/Expression';
import { RenderPass } from '../renderer/RenderPass';
import { DataUtil } from '../misc/DataUtil';
import { FileType } from '../definitions/FileType';
import type { glTF1 } from '../../types/glTF1';
import type { GltfFileBuffers, GltfLoadOption } from '../../types';
import type { RnPromiseCallback } from '../misc/RnPromise';
import { Vrm0xImporter } from './Vrm0xImporter';
import { Err, type Result, Ok, assertIsErr } from '../misc/Result';
import { VrmImporter } from './VrmImporter';

/**
 * Importer class which can import GLTF and VRM files.
 * Supports multiple formats including glTF 1.0/2.0, GLB, VRM 0.x/1.0, and Draco compressed files.
 */
export class GltfImporter {
  /**
   * Private constructor to prevent direct instantiation.
   * This class is designed to be used as a static utility class.
   */
  private constructor() {}

  /**
   * Import GLTF or VRM file from a URL.
   * Automatically detects the file format and uses the appropriate importer.
   *
   * @param url - The URL of the glTF/VRM file to import
   * @param options - Optional loading configuration. The files property is ignored for URL imports
   * @param callback - Optional callback function for progress tracking
   * @returns A Promise that resolves to an Expression containing:
   *          - renderPasses[0]: model entities
   *          - renderPasses[1]: model outlines (if applicable)
   * @throws Will reject the promise if the file cannot be fetched or parsed
   */
  static async importFromUrl(url: string, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression> {
    const promise = new Promise<Expression>(async (resolve, reject) => {
      options = this.__initOptions(options);

      const renderPasses = options.expression?.renderPasses || [];
      if (renderPasses.length === 0) {
        renderPasses.push(new RenderPass());
      }

      const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);
      if (r_arrayBuffer.isErr()) {
        reject(r_arrayBuffer.getRnError());
        return;
      }

      options.files![url] = r_arrayBuffer.get();

      await this.__detectTheModelFileTypeAndImport(url, renderPasses, options, url, callback);

      if (options && options.cameraComponent) {
        for (const renderPass of renderPasses) {
          renderPass.cameraComponent = options.cameraComponent;
        }
      }

      const expression = this.__setRenderPassesToExpression(renderPasses, options);
      resolve(expression);
    });

    return promise;
  }

  /**
   * Import GLTF or VRM from pre-loaded ArrayBuffers.
   * Useful when you have already loaded the file data and want to avoid additional network requests.
   *
   * @param files - A map of file names to ArrayBuffers. File names should include extensions and match URIs used in the glTF
   * @param options - Optional loading configuration. If using the files option, keys must match the URIs of the ArrayBuffer values
   * @param callback - Optional callback function for progress tracking
   * @returns A Promise that resolves to an Expression containing:
   *          - renderPasses[0]: model entities
   *          - renderPasses[1]: model outlines (if applicable)
   * @throws Will reject the promise if the files cannot be parsed or are in an unsupported format
   */
  static async importFromArrayBuffers(
    files: GltfFileBuffers,
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    const promise = new Promise<Expression>(async (resolve, reject) => {
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
          await this.__detectTheModelFileTypeAndImport(fileName, renderPasses, options, fileName, callback);
        }
      }

      if (options && options.cameraComponent) {
        for (const renderPass of renderPasses) {
          renderPass.cameraComponent = options.cameraComponent;
        }
      }

      const expression = this.__setRenderPassesToExpression(renderPasses, options);

      resolve(expression);
    });

    return promise;
  }

  /**
   * Initialize and validate the loading options.
   * Sets default values for missing options and performs necessary transformations.
   *
   * @param options - The original options object, may be undefined
   * @returns A fully initialized GltfLoadOption object with all required properties
   * @private
   */
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
        if (options.defaultMaterialHelperArgumentArray![0].isMorphing === false) {
          options.maxMorphTargetNumber = 0;
        }
      }
    }

    return options!;
  }

  /**
   * Set render passes to the expression object.
   * Creates a new expression if one doesn't exist, or updates the existing one.
   *
   * @param renderPasses - Array of render passes to add to the expression
   * @param options - Loading options containing the optional expression
   * @returns The expression object with render passes configured
   * @private
   */
  private static __setRenderPassesToExpression(renderPasses: RenderPass[], options: GltfLoadOption) {
    const expression = options.expression ?? new Expression();

    if (expression.renderPasses !== renderPasses) {
      expression.clearRenderPasses();
      expression.addRenderPasses(renderPasses);
    }

    return expression;
  }

  /**
   * Check if the given file extension is supported by the importer.
   *
   * @param fileExtension - The file extension to validate (without the dot)
   * @returns True if the extension is supported (gltf, glb, vrm, drc), false otherwise
   * @private
   */
  private static __isValidExtension(fileExtension: string) {
    if (fileExtension === 'gltf' || fileExtension === 'glb' || fileExtension === 'vrm' || fileExtension === 'drc') {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Determine if an ArrayBuffer contains GLB (binary glTF) data.
   * Checks the magic number at the beginning of the buffer.
   *
   * @param arrayBuffer - The ArrayBuffer to examine
   * @returns True if the buffer contains GLB data, false otherwise
   * @private
   */
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

  /**
   * Extract the glTF version from a GLB ArrayBuffer.
   * Reads the version field from the GLB header.
   *
   * @param glbArrayBuffer - The GLB ArrayBuffer to examine
   * @returns The glTF version number (typically 1 or 2)
   * @private
   */
  private static __getGlbVersion(glbArrayBuffer: ArrayBuffer) {
    const dataView = new DataView(glbArrayBuffer, 0, 20);
    const isLittleEndian = true;
    const glbVer = dataView.getUint32(4, isLittleEndian);
    return glbVer;
  }

  /**
   * Determine the glTF version from parsed JSON data.
   * Examines the asset.version field to determine if it's glTF 1.0 or 2.0.
   *
   * @param gltfJson - The parsed glTF JSON object
   * @returns 2 for glTF 2.0, 1 for glTF 1.0 or older versions
   * @private
   */
  private static __getGltfVersion(gltfJson: glTF1 | RnM2) {
    if ((gltfJson as RnM2).asset?.version?.charAt(0) === '2') {
      return 2;
    } else {
      return 1;
    }
  }

  /**
   * Detect the model file type and import using the appropriate importer.
   * Handles different file formats including glTF, GLB, VRM, and Draco compressed files.
   *
   * @param fileName - Name of the file being imported
   * @param renderPasses - Array of render passes to add imported entities to
   * @param options - Loading options and configuration
   * @param uri - URI of the file for reference
   * @param callback - Optional callback for progress tracking
   * @returns A Result indicating success or failure of the import operation
   * @private
   */
  private static async __detectTheModelFileTypeAndImport(
    fileName: string,
    renderPasses: RenderPass[],
    options: GltfLoadOption,
    uri: string,
    callback?: RnPromiseCallback
  ): Promise<Result<void, undefined>> {
    const optionalFileType = options.fileType;

    const fileType = this.__getFileTypeFromFilePromise(fileName, options, optionalFileType);

    const fileArrayBuffer = options.files![fileName];
    options.__isImportVRM0x = false;
    let glTFVer = 0; // 0: not glTF, 1: glTF1, 2: glTF2
    switch (fileType) {
      case FileType.Gltf: {
        const gotText = DataUtil.arrayBufferToString(fileArrayBuffer);
        const json = JSON.parse(gotText);
        glTFVer = this.__getGltfVersion(json);
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGltf(json, options.files!, options, fileName, callback);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        options.__importedType = 'gltf2';
        return new Ok();
      }
      case FileType.GltfBinary: {
        glTFVer = this.__getGlbVersion(fileArrayBuffer);
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGlb(fileArrayBuffer, options.files!, options);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        options.__importedType = 'glb2';
        return new Ok();
      }
      case FileType.Draco: {
        const importer = DrcPointCloudImporter.getInstance() as DrcPointCloudImporter;
        const gltfModel = await importer.importArrayBuffer(uri, fileArrayBuffer, options);
        if (gltfModel == null) {
          return new Err({
            message: 'importArrayBuffer error is occurred',
            error: undefined,
          });
        } else {
          options.__importedType = 'draco';
          const rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
          renderPasses[0].addEntities([rootGroup]);
          return new Ok();
        }
      }
      case FileType.VRM: {
        options.__isImportVRM0x = true;
        const result = await Gltf2Importer._importGltfOrGlbFromArrayBuffers(fileArrayBuffer, options.files!, options);

        if (result.isOk()) {
          const gltfModel = result.get();
          if (gltfModel.extensionsUsed.indexOf('VRMC_vrm') >= 0) {
            options.__isImportVRM0x = false;
            gltfModel.asset.extras!.rnLoaderOptions!.__isImportVRM0x = false;
            options.__importedType = 'vrm1';
            await VrmImporter.__importVRM(gltfModel, renderPasses);
          } else if (gltfModel.extensionsUsed.indexOf('VRM') >= 0) {
            options.__importedType = 'vrm0x';
            await Vrm0xImporter.__importVRM0x(gltfModel, renderPasses);
          }
          return new Ok();
        } else {
          assertIsErr(result);
          return new Err({
            message: result.getRnError().message,
            error: undefined,
          });
        }
      }
      default:
        return new Err({
          message: 'detect invalid format',
          error: undefined,
        });
    }
  }

  /**
   * Determine the file type from the file name and options.
   * Uses either the explicitly provided file type or auto-detects from the file content.
   *
   * @param fileName - Name of the file to analyze
   * @param options - Loading options containing file data
   * @param optionalFileType - Optional explicit file type override
   * @returns The detected or specified FileType
   * @private
   */
  private static __getFileTypeFromFilePromise(fileName: string, options: GltfLoadOption, optionalFileType?: string) {
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
