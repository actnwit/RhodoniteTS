import type { GltfFileBuffers, GltfLoadOption } from '../../types';
import { FileType } from '../definitions/FileType';
import { DataUtil } from '../misc/DataUtil';
import { assertIsErr, Err, Ok, type Result } from '../misc/Result';
import type { RnPromiseCallback } from '../misc/RnPromise';
import { Expression } from '../renderer/Expression';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import { DrcPointCloudImporter } from './DrcPointCloudImporter';
import { detectFormatByArrayBuffers } from './FormatDetector';
import { Gltf2Importer } from './Gltf2Importer';
import { ModelConverter } from './ModelConverter';
import { Vrm0xImporter } from './Vrm0xImporter';
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
   * @param engine - The engine instance
   * @param url - The URL of the glTF/VRM file to import
   * @param options - Optional loading configuration. The files property is ignored for URL imports
   * @param callback - Optional callback function for progress tracking
   * @returns A Promise that resolves to an Expression containing:
   *          - renderPasses[0]: model entities
   *          - renderPasses[1]: model outlines (if applicable)
   * @throws Will reject the promise if the file cannot be fetched or parsed
   */
  static async importFromUrl(
    engine: Engine,
    url: string,
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    const promise = new Promise<Expression>((resolve, reject) => {
      (async () => {
        options = this.__initOptions(options);

        const renderPasses = options.expression?.renderPasses || [];
        if (renderPasses.length === 0) {
          renderPasses.push(new RenderPass(engine));
        }

        const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);
        if (r_arrayBuffer.isErr()) {
          reject(r_arrayBuffer.getRnError());
          return;
        }

        options.files![url] = r_arrayBuffer.get();

        await this.__detectTheModelFileTypeAndImport(engine, url, renderPasses, options, url, callback);

        if (options?.cameraComponent) {
          for (const renderPass of renderPasses) {
            renderPass.cameraComponent = options.cameraComponent;
          }
        }

        const expression = this.__setRenderPassesToExpression(renderPasses, options);
        resolve(expression);
      })().catch(reject);
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
    engine: Engine,
    files: GltfFileBuffers,
    options?: GltfLoadOption,
    callback?: RnPromiseCallback
  ): Promise<Expression> {
    const promise = new Promise<Expression>((resolve, reject) => {
      (async () => {
        options = this.__initOptions(options);

        const renderPasses = options.expression?.renderPasses || [];
        if (renderPasses.length === 0) {
          renderPasses.push(new RenderPass(engine));
        }

        for (const fileName in files) {
          // filename is uri with file extension
          const fileExtension = DataUtil.getExtension(fileName);
          // if the file is main file type?
          if (this.__isValidExtension(fileExtension)) {
            await this.__detectTheModelFileTypeAndImport(engine, fileName, renderPasses, options, fileName, callback);
          }
        }

        if (options?.cameraComponent) {
          for (const renderPass of renderPasses) {
            renderPass.cameraComponent = options.cameraComponent;
          }
        }

        const expression = this.__setRenderPassesToExpression(renderPasses, options);

        resolve(expression);
      })().catch(reject);
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
          options.files[`${fileName}.glb`] = arraybuffer;
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
    if (
      fileExtension === 'gltf' ||
      fileExtension === 'glb' ||
      fileExtension === 'rnb' ||
      fileExtension === 'vrm' ||
      fileExtension === 'drc'
    ) {
      return true;
    }
    return false;
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
    engine: Engine,
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
    switch (fileType) {
      case FileType.Gltf: {
        const gotText = DataUtil.arrayBufferToString(fileArrayBuffer);
        const json = JSON.parse(gotText);
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGltf(json, options.files!, options, fileName, callback);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        options.__importedType = 'gltf2';
        return new Ok();
      }
      case FileType.GltfBinary: {
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGlb(fileArrayBuffer, options.files!, options);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
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
        }
        options.__importedType = 'draco';
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        return new Ok();
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
            await VrmImporter.__importVRM(engine, gltfModel, renderPasses);
          } else if (gltfModel.extensionsUsed.indexOf('VRM') >= 0) {
            options.__importedType = 'vrm0x';
            await Vrm0xImporter.__importVRM0x(engine, gltfModel, renderPasses);
          }
          return new Ok();
        }
        assertIsErr(result);
        return new Err({
          message: result.getRnError().message,
          error: undefined,
        });
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
    }
    const fileType = detectFormatByArrayBuffers({
      [fileName]: options.files![fileName],
    });
    return fileType;
  }
}
