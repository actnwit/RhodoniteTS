// src/foundation/importer/GltfImporter.ts
import { FileType } from "../definitions/FileType.js";
import { DataUtil } from "../misc/DataUtil.js";
import { assertIsErr, Err, Ok } from "../misc/Result.js";
import { Expression } from "../renderer/Expression.js";
import { RenderPass } from "../renderer/RenderPass.js";
import { DrcPointCloudImporter } from "./DrcPointCloudImporter.js";
import { detectFormatByArrayBuffers } from "./FormatDetector.js";
import { Gltf2Importer } from "./Gltf2Importer.js";
import { ModelConverter } from "./ModelConverter.js";
import { Vrm0xImporter } from "./Vrm0xImporter.js";
import { VrmImporter } from "./VrmImporter.js";
var GltfImporter = class {
  /**
   * Private constructor to prevent direct instantiation.
   * This class is designed to be used as a static utility class.
   */
  constructor() {
  }
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
  static async importFromUrl(engine, url, options, callback) {
    const promise = new Promise((resolve, reject) => {
      (async () => {
        var _a;
        options = this.__initOptions(options);
        const renderPasses = ((_a = options.expression) == null ? void 0 : _a.renderPasses) || [];
        if (renderPasses.length === 0) {
          renderPasses.push(new RenderPass(engine));
        }
        const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);
        if (r_arrayBuffer.isErr()) {
          reject(r_arrayBuffer.getRnError());
          return;
        }
        options.files[url] = r_arrayBuffer.get();
        await this.__detectTheModelFileTypeAndImport(engine, url, renderPasses, options, url, callback);
        if (options == null ? void 0 : options.cameraComponent) {
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
  static async importFromArrayBuffers(engine, files, options, callback) {
    const promise = new Promise((resolve, reject) => {
      (async () => {
        var _a;
        options = this.__initOptions(options);
        const renderPasses = ((_a = options.expression) == null ? void 0 : _a.renderPasses) || [];
        if (renderPasses.length === 0) {
          renderPasses.push(new RenderPass(engine));
        }
        for (const fileName in files) {
          const fileExtension = DataUtil.getExtension(fileName);
          if (this.__isValidExtension(fileExtension)) {
            await this.__detectTheModelFileTypeAndImport(engine, fileName, renderPasses, options, fileName, callback);
          }
        }
        if (options == null ? void 0 : options.cameraComponent) {
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
  static __initOptions(options) {
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
        const fileName = file.split(".vrm")[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[`${fileName}.glb`] = arraybuffer;
          delete options.files[file];
        }
      }
      if (Array.isArray(options.defaultMaterialHelperArgumentArray) === false) {
        options.defaultMaterialHelperArgumentArray = [{}];
      } else {
        if (options.defaultMaterialHelperArgumentArray[0].isMorphing === false) {
          options.maxMorphTargetNumber = 0;
        }
      }
    }
    return options;
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
  static __setRenderPassesToExpression(renderPasses, options) {
    var _a;
    const expression = (_a = options.expression) != null ? _a : new Expression();
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
  static __isValidExtension(fileExtension) {
    if (fileExtension === "gltf" || fileExtension === "glb" || fileExtension === "rnb" || fileExtension === "vrm" || fileExtension === "drc") {
      return true;
    }
    return false;
  }
  /**
   * Determine if an ArrayBuffer contains GLB (binary glTF) data.
   * Checks the magic number at the beginning of the buffer.
   *
   * @param arrayBuffer - The ArrayBuffer to examine
   * @returns True if the buffer contains GLB data, false otherwise
   * @private
   */
  static __isGlb(arrayBuffer) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    const magic = dataView.getUint32(0, isLittleEndian);
    if (magic === 1179937895) {
      return true;
    }
    return false;
  }
  /**
   * Extract the glTF version from a GLB ArrayBuffer.
   * Reads the version field from the GLB header.
   *
   * @param glbArrayBuffer - The GLB ArrayBuffer to examine
   * @returns The glTF version number (typically 1 or 2)
   * @private
   */
  static __getGlbVersion(glbArrayBuffer) {
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
  static __getGltfVersion(gltfJson) {
    var _a, _b;
    if (((_b = (_a = gltfJson.asset) == null ? void 0 : _a.version) == null ? void 0 : _b.charAt(0)) === "2") {
      return 2;
    }
    return 1;
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
  static async __detectTheModelFileTypeAndImport(engine, fileName, renderPasses, options, uri, callback) {
    const optionalFileType = options.fileType;
    const fileType = this.__getFileTypeFromFilePromise(fileName, options, optionalFileType);
    const fileArrayBuffer = options.files[fileName];
    options.__isImportVRM0x = false;
    switch (fileType) {
      case FileType.Gltf: {
        const gotText = DataUtil.arrayBufferToString(fileArrayBuffer);
        const json = JSON.parse(gotText);
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGltf(json, options.files, options, fileName, callback);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        options.__importedType = "gltf2";
        return new Ok();
      }
      case FileType.GltfBinary: {
        const importer = Gltf2Importer;
        const gltfModel = await importer._importGlb(fileArrayBuffer, options.files, options);
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        options.__importedType = "glb2";
        return new Ok();
      }
      case FileType.Draco: {
        const importer = DrcPointCloudImporter.getInstance();
        const gltfModel = await importer.importArrayBuffer(uri, fileArrayBuffer, options);
        if (gltfModel == null) {
          return new Err({
            message: "importArrayBuffer error is occurred",
            error: void 0
          });
        }
        options.__importedType = "draco";
        const rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
        renderPasses[0].addEntities([rootGroup]);
        return new Ok();
      }
      case FileType.VRM: {
        options.__isImportVRM0x = true;
        const result = await Gltf2Importer._importGltfOrGlbFromArrayBuffers(fileArrayBuffer, options.files, options);
        if (result.isOk()) {
          const gltfModel = result.get();
          if (gltfModel.extensionsUsed.indexOf("VRMC_vrm") >= 0) {
            options.__isImportVRM0x = false;
            gltfModel.asset.extras.rnLoaderOptions.__isImportVRM0x = false;
            options.__importedType = "vrm1";
            await VrmImporter.__importVRM(engine, gltfModel, renderPasses);
          } else if (gltfModel.extensionsUsed.indexOf("VRM") >= 0) {
            options.__importedType = "vrm0x";
            await Vrm0xImporter.__importVRM0x(engine, gltfModel, renderPasses);
          }
          return new Ok();
        }
        assertIsErr(result);
        return new Err({
          message: result.getRnError().message,
          error: void 0
        });
      }
      default:
        return new Err({
          message: "detect invalid format",
          error: void 0
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
  static __getFileTypeFromFilePromise(fileName, options, optionalFileType) {
    if (optionalFileType != null) {
      return FileType.fromString(optionalFileType);
    }
    const fileType = detectFormatByArrayBuffers({
      [fileName]: options.files[fileName]
    });
    return fileType;
  }
};
export {
  GltfImporter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvR2x0ZkltcG9ydGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEdsdGZGaWxlQnVmZmVycywgR2x0ZkxvYWRPcHRpb24gfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IGdsVEYxIH0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xURjEnO1xuaW1wb3J0IHR5cGUgeyBSbk0yIH0gZnJvbSAnLi4vLi4vdHlwZXMvUm5NMic7XG5pbXBvcnQgeyBGaWxlVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0ZpbGVUeXBlJztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBhc3NlcnRJc0VyciwgRXJyLCBPaywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi9taXNjL1Jlc3VsdCc7XG5pbXBvcnQgdHlwZSB7IFJuUHJvbWlzZUNhbGxiYWNrIH0gZnJvbSAnLi4vbWlzYy9SblByb21pc2UnO1xuaW1wb3J0IHsgRXhwcmVzc2lvbiB9IGZyb20gJy4uL3JlbmRlcmVyL0V4cHJlc3Npb24nO1xuaW1wb3J0IHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IERyY1BvaW50Q2xvdWRJbXBvcnRlciB9IGZyb20gJy4vRHJjUG9pbnRDbG91ZEltcG9ydGVyJztcbmltcG9ydCB7IGRldGVjdEZvcm1hdEJ5QXJyYXlCdWZmZXJzIH0gZnJvbSAnLi9Gb3JtYXREZXRlY3Rvcic7XG5pbXBvcnQgeyBHbHRmMkltcG9ydGVyIH0gZnJvbSAnLi9HbHRmMkltcG9ydGVyJztcbmltcG9ydCB7IE1vZGVsQ29udmVydGVyIH0gZnJvbSAnLi9Nb2RlbENvbnZlcnRlcic7XG5pbXBvcnQgeyBWcm0weEltcG9ydGVyIH0gZnJvbSAnLi9Wcm0weEltcG9ydGVyJztcbmltcG9ydCB7IFZybUltcG9ydGVyIH0gZnJvbSAnLi9Wcm1JbXBvcnRlcic7XG5cbi8qKlxuICogSW1wb3J0ZXIgY2xhc3Mgd2hpY2ggY2FuIGltcG9ydCBHTFRGIGFuZCBWUk0gZmlsZXMuXG4gKiBTdXBwb3J0cyBtdWx0aXBsZSBmb3JtYXRzIGluY2x1ZGluZyBnbFRGIDEuMC8yLjAsIEdMQiwgVlJNIDAueC8xLjAsIGFuZCBEcmFjbyBjb21wcmVzc2VkIGZpbGVzLlxuICovXG5leHBvcnQgY2xhc3MgR2x0ZkltcG9ydGVyIHtcbiAgLyoqXG4gICAqIFByaXZhdGUgY29uc3RydWN0b3IgdG8gcHJldmVudCBkaXJlY3QgaW5zdGFudGlhdGlvbi5cbiAgICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIGFzIGEgc3RhdGljIHV0aWxpdHkgY2xhc3MuXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogSW1wb3J0IEdMVEYgb3IgVlJNIGZpbGUgZnJvbSBhIFVSTC5cbiAgICogQXV0b21hdGljYWxseSBkZXRlY3RzIHRoZSBmaWxlIGZvcm1hdCBhbmQgdXNlcyB0aGUgYXBwcm9wcmlhdGUgaW1wb3J0ZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB1cmwgLSBUaGUgVVJMIG9mIHRoZSBnbFRGL1ZSTSBmaWxlIHRvIGltcG9ydFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIGxvYWRpbmcgY29uZmlndXJhdGlvbi4gVGhlIGZpbGVzIHByb3BlcnR5IGlzIGlnbm9yZWQgZm9yIFVSTCBpbXBvcnRzXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIE9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBwcm9ncmVzcyB0cmFja2luZ1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBFeHByZXNzaW9uIGNvbnRhaW5pbmc6XG4gICAqICAgICAgICAgIC0gcmVuZGVyUGFzc2VzWzBdOiBtb2RlbCBlbnRpdGllc1xuICAgKiAgICAgICAgICAtIHJlbmRlclBhc3Nlc1sxXTogbW9kZWwgb3V0bGluZXMgKGlmIGFwcGxpY2FibGUpXG4gICAqIEB0aHJvd3MgV2lsbCByZWplY3QgdGhlIHByb21pc2UgaWYgdGhlIGZpbGUgY2Fubm90IGJlIGZldGNoZWQgb3IgcGFyc2VkXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaW1wb3J0RnJvbVVybChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICB1cmw6IHN0cmluZyxcbiAgICBvcHRpb25zPzogR2x0ZkxvYWRPcHRpb24sXG4gICAgY2FsbGJhY2s/OiBSblByb21pc2VDYWxsYmFja1xuICApOiBQcm9taXNlPEV4cHJlc3Npb24+IHtcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8RXhwcmVzc2lvbj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgb3B0aW9ucyA9IHRoaXMuX19pbml0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICBjb25zdCByZW5kZXJQYXNzZXMgPSBvcHRpb25zLmV4cHJlc3Npb24/LnJlbmRlclBhc3NlcyB8fCBbXTtcbiAgICAgICAgaWYgKHJlbmRlclBhc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZW5kZXJQYXNzZXMucHVzaChuZXcgUmVuZGVyUGFzcyhlbmdpbmUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJfYXJyYXlCdWZmZXIgPSBhd2FpdCBEYXRhVXRpbC5mZXRjaEFycmF5QnVmZmVyKHVybCk7XG4gICAgICAgIGlmIChyX2FycmF5QnVmZmVyLmlzRXJyKCkpIHtcbiAgICAgICAgICByZWplY3Qocl9hcnJheUJ1ZmZlci5nZXRSbkVycm9yKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMuZmlsZXMhW3VybF0gPSByX2FycmF5QnVmZmVyLmdldCgpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX19kZXRlY3RUaGVNb2RlbEZpbGVUeXBlQW5kSW1wb3J0KGVuZ2luZSwgdXJsLCByZW5kZXJQYXNzZXMsIG9wdGlvbnMsIHVybCwgY2FsbGJhY2spO1xuXG4gICAgICAgIGlmIChvcHRpb25zPy5jYW1lcmFDb21wb25lbnQpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJlbmRlclBhc3Mgb2YgcmVuZGVyUGFzc2VzKSB7XG4gICAgICAgICAgICByZW5kZXJQYXNzLmNhbWVyYUNvbXBvbmVudCA9IG9wdGlvbnMuY2FtZXJhQ29tcG9uZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLl9fc2V0UmVuZGVyUGFzc2VzVG9FeHByZXNzaW9uKHJlbmRlclBhc3Nlcywgb3B0aW9ucyk7XG4gICAgICAgIHJlc29sdmUoZXhwcmVzc2lvbik7XG4gICAgICB9KSgpLmNhdGNoKHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgR0xURiBvciBWUk0gZnJvbSBwcmUtbG9hZGVkIEFycmF5QnVmZmVycy5cbiAgICogVXNlZnVsIHdoZW4geW91IGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhlIGZpbGUgZGF0YSBhbmQgd2FudCB0byBhdm9pZCBhZGRpdGlvbmFsIG5ldHdvcmsgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlcyAtIEEgbWFwIG9mIGZpbGUgbmFtZXMgdG8gQXJyYXlCdWZmZXJzLiBGaWxlIG5hbWVzIHNob3VsZCBpbmNsdWRlIGV4dGVuc2lvbnMgYW5kIG1hdGNoIFVSSXMgdXNlZCBpbiB0aGUgZ2xURlxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIGxvYWRpbmcgY29uZmlndXJhdGlvbi4gSWYgdXNpbmcgdGhlIGZpbGVzIG9wdGlvbiwga2V5cyBtdXN0IG1hdGNoIHRoZSBVUklzIG9mIHRoZSBBcnJheUJ1ZmZlciB2YWx1ZXNcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gT3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHByb2dyZXNzIHRyYWNraW5nXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIEV4cHJlc3Npb24gY29udGFpbmluZzpcbiAgICogICAgICAgICAgLSByZW5kZXJQYXNzZXNbMF06IG1vZGVsIGVudGl0aWVzXG4gICAqICAgICAgICAgIC0gcmVuZGVyUGFzc2VzWzFdOiBtb2RlbCBvdXRsaW5lcyAoaWYgYXBwbGljYWJsZSlcbiAgICogQHRocm93cyBXaWxsIHJlamVjdCB0aGUgcHJvbWlzZSBpZiB0aGUgZmlsZXMgY2Fubm90IGJlIHBhcnNlZCBvciBhcmUgaW4gYW4gdW5zdXBwb3J0ZWQgZm9ybWF0XG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaW1wb3J0RnJvbUFycmF5QnVmZmVycyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBmaWxlczogR2x0ZkZpbGVCdWZmZXJzLFxuICAgIG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvbixcbiAgICBjYWxsYmFjaz86IFJuUHJvbWlzZUNhbGxiYWNrXG4gICk6IFByb21pc2U8RXhwcmVzc2lvbj4ge1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxFeHByZXNzaW9uPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBvcHRpb25zID0gdGhpcy5fX2luaXRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlclBhc3NlcyA9IG9wdGlvbnMuZXhwcmVzc2lvbj8ucmVuZGVyUGFzc2VzIHx8IFtdO1xuICAgICAgICBpZiAocmVuZGVyUGFzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJlbmRlclBhc3Nlcy5wdXNoKG5ldyBSZW5kZXJQYXNzKGVuZ2luZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBmaWxlTmFtZSBpbiBmaWxlcykge1xuICAgICAgICAgIC8vIGZpbGVuYW1lIGlzIHVyaSB3aXRoIGZpbGUgZXh0ZW5zaW9uXG4gICAgICAgICAgY29uc3QgZmlsZUV4dGVuc2lvbiA9IERhdGFVdGlsLmdldEV4dGVuc2lvbihmaWxlTmFtZSk7XG4gICAgICAgICAgLy8gaWYgdGhlIGZpbGUgaXMgbWFpbiBmaWxlIHR5cGU/XG4gICAgICAgICAgaWYgKHRoaXMuX19pc1ZhbGlkRXh0ZW5zaW9uKGZpbGVFeHRlbnNpb24pKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9fZGV0ZWN0VGhlTW9kZWxGaWxlVHlwZUFuZEltcG9ydChlbmdpbmUsIGZpbGVOYW1lLCByZW5kZXJQYXNzZXMsIG9wdGlvbnMsIGZpbGVOYW1lLCBjYWxsYmFjayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnM/LmNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiByZW5kZXJQYXNzZXMpIHtcbiAgICAgICAgICAgIHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50ID0gb3B0aW9ucy5jYW1lcmFDb21wb25lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IHRoaXMuX19zZXRSZW5kZXJQYXNzZXNUb0V4cHJlc3Npb24ocmVuZGVyUGFzc2VzLCBvcHRpb25zKTtcblxuICAgICAgICByZXNvbHZlKGV4cHJlc3Npb24pO1xuICAgICAgfSkoKS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhbmQgdmFsaWRhdGUgdGhlIGxvYWRpbmcgb3B0aW9ucy5cbiAgICogU2V0cyBkZWZhdWx0IHZhbHVlcyBmb3IgbWlzc2luZyBvcHRpb25zIGFuZCBwZXJmb3JtcyBuZWNlc3NhcnkgdHJhbnNmb3JtYXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBvcmlnaW5hbCBvcHRpb25zIG9iamVjdCwgbWF5IGJlIHVuZGVmaW5lZFxuICAgKiBAcmV0dXJucyBBIGZ1bGx5IGluaXRpYWxpemVkIEdsdGZMb2FkT3B0aW9uIG9iamVjdCB3aXRoIGFsbCByZXF1aXJlZCBwcm9wZXJ0aWVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2luaXRPcHRpb25zKG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvbik6IEdsdGZMb2FkT3B0aW9uIHtcbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zID0gRGF0YVV0aWwuY3JlYXRlRGVmYXVsdEdsdGZPcHRpb25zKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcHRpb25zLmZpbGVzID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5maWxlcyA9IHt9O1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGZpbGUgaW4gb3B0aW9ucy5maWxlcykge1xuICAgICAgICBpZiAoZmlsZS5tYXRjaCgvLipcXC52cm0kLykgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlLnNwbGl0KCcudnJtJylbMF07XG4gICAgICAgIGlmIChmaWxlTmFtZSkge1xuICAgICAgICAgIGNvbnN0IGFycmF5YnVmZmVyID0gb3B0aW9ucy5maWxlc1tmaWxlXTtcbiAgICAgICAgICBvcHRpb25zLmZpbGVzW2Ake2ZpbGVOYW1lfS5nbGJgXSA9IGFycmF5YnVmZmVyO1xuICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmZpbGVzW2ZpbGVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSkgPT09IGZhbHNlKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSA9IFt7fV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhdm9pZCBuZWVkbGVzcyBwcm9jZXNzaW5nXG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdLmlzTW9ycGhpbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgb3B0aW9ucy5tYXhNb3JwaFRhcmdldE51bWJlciA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucyE7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHJlbmRlciBwYXNzZXMgdG8gdGhlIGV4cHJlc3Npb24gb2JqZWN0LlxuICAgKiBDcmVhdGVzIGEgbmV3IGV4cHJlc3Npb24gaWYgb25lIGRvZXNuJ3QgZXhpc3QsIG9yIHVwZGF0ZXMgdGhlIGV4aXN0aW5nIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHJlbmRlclBhc3NlcyAtIEFycmF5IG9mIHJlbmRlciBwYXNzZXMgdG8gYWRkIHRvIHRoZSBleHByZXNzaW9uXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGluZyBvcHRpb25zIGNvbnRhaW5pbmcgdGhlIG9wdGlvbmFsIGV4cHJlc3Npb25cbiAgICogQHJldHVybnMgVGhlIGV4cHJlc3Npb24gb2JqZWN0IHdpdGggcmVuZGVyIHBhc3NlcyBjb25maWd1cmVkXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFJlbmRlclBhc3Nlc1RvRXhwcmVzc2lvbihyZW5kZXJQYXNzZXM6IFJlbmRlclBhc3NbXSwgb3B0aW9uczogR2x0ZkxvYWRPcHRpb24pIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gb3B0aW9ucy5leHByZXNzaW9uID8/IG5ldyBFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAoZXhwcmVzc2lvbi5yZW5kZXJQYXNzZXMgIT09IHJlbmRlclBhc3Nlcykge1xuICAgICAgZXhwcmVzc2lvbi5jbGVhclJlbmRlclBhc3NlcygpO1xuICAgICAgZXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMocmVuZGVyUGFzc2VzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gZmlsZSBleHRlbnNpb24gaXMgc3VwcG9ydGVkIGJ5IHRoZSBpbXBvcnRlci5cbiAgICpcbiAgICogQHBhcmFtIGZpbGVFeHRlbnNpb24gLSBUaGUgZmlsZSBleHRlbnNpb24gdG8gdmFsaWRhdGUgKHdpdGhvdXQgdGhlIGRvdClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgZXh0ZW5zaW9uIGlzIHN1cHBvcnRlZCAoZ2x0ZiwgZ2xiLCB2cm0sIGRyYyksIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc1ZhbGlkRXh0ZW5zaW9uKGZpbGVFeHRlbnNpb246IHN0cmluZykge1xuICAgIGlmIChcbiAgICAgIGZpbGVFeHRlbnNpb24gPT09ICdnbHRmJyB8fFxuICAgICAgZmlsZUV4dGVuc2lvbiA9PT0gJ2dsYicgfHxcbiAgICAgIGZpbGVFeHRlbnNpb24gPT09ICdybmInIHx8XG4gICAgICBmaWxlRXh0ZW5zaW9uID09PSAndnJtJyB8fFxuICAgICAgZmlsZUV4dGVuc2lvbiA9PT0gJ2RyYydcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIGFuIEFycmF5QnVmZmVyIGNvbnRhaW5zIEdMQiAoYmluYXJ5IGdsVEYpIGRhdGEuXG4gICAqIENoZWNrcyB0aGUgbWFnaWMgbnVtYmVyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIHRvIGV4YW1pbmVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgYnVmZmVyIGNvbnRhaW5zIEdMQiBkYXRhLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faXNHbGIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSB7XG4gICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoYXJyYXlCdWZmZXIsIDAsIDIwKTtcbiAgICBjb25zdCBpc0xpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgLy8gTWFnaWMgZmllbGRcbiAgICBjb25zdCBtYWdpYyA9IGRhdGFWaWV3LmdldFVpbnQzMigwLCBpc0xpdHRsZUVuZGlhbik7XG4gICAgLy8gVGhlIDB4NDY1NDZDNjcgbWVhbnMgJ2dsVEYnIHN0cmluZyBpbiBnbGIgZmlsZXMuXG4gICAgaWYgKG1hZ2ljID09PSAweDQ2NTQ2YzY3KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgdGhlIGdsVEYgdmVyc2lvbiBmcm9tIGEgR0xCIEFycmF5QnVmZmVyLlxuICAgKiBSZWFkcyB0aGUgdmVyc2lvbiBmaWVsZCBmcm9tIHRoZSBHTEIgaGVhZGVyLlxuICAgKlxuICAgKiBAcGFyYW0gZ2xiQXJyYXlCdWZmZXIgLSBUaGUgR0xCIEFycmF5QnVmZmVyIHRvIGV4YW1pbmVcbiAgICogQHJldHVybnMgVGhlIGdsVEYgdmVyc2lvbiBudW1iZXIgKHR5cGljYWxseSAxIG9yIDIpXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEdsYlZlcnNpb24oZ2xiQXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSB7XG4gICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoZ2xiQXJyYXlCdWZmZXIsIDAsIDIwKTtcbiAgICBjb25zdCBpc0xpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgY29uc3QgZ2xiVmVyID0gZGF0YVZpZXcuZ2V0VWludDMyKDQsIGlzTGl0dGxlRW5kaWFuKTtcbiAgICByZXR1cm4gZ2xiVmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSB0aGUgZ2xURiB2ZXJzaW9uIGZyb20gcGFyc2VkIEpTT04gZGF0YS5cbiAgICogRXhhbWluZXMgdGhlIGFzc2V0LnZlcnNpb24gZmllbGQgdG8gZGV0ZXJtaW5lIGlmIGl0J3MgZ2xURiAxLjAgb3IgMi4wLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgcGFyc2VkIGdsVEYgSlNPTiBvYmplY3RcbiAgICogQHJldHVybnMgMiBmb3IgZ2xURiAyLjAsIDEgZm9yIGdsVEYgMS4wIG9yIG9sZGVyIHZlcnNpb25zXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEdsdGZWZXJzaW9uKGdsdGZKc29uOiBnbFRGMSB8IFJuTTIpIHtcbiAgICBpZiAoKGdsdGZKc29uIGFzIFJuTTIpLmFzc2V0Py52ZXJzaW9uPy5jaGFyQXQoMCkgPT09ICcyJykge1xuICAgICAgcmV0dXJuIDI7XG4gICAgfVxuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVjdCB0aGUgbW9kZWwgZmlsZSB0eXBlIGFuZCBpbXBvcnQgdXNpbmcgdGhlIGFwcHJvcHJpYXRlIGltcG9ydGVyLlxuICAgKiBIYW5kbGVzIGRpZmZlcmVudCBmaWxlIGZvcm1hdHMgaW5jbHVkaW5nIGdsVEYsIEdMQiwgVlJNLCBhbmQgRHJhY28gY29tcHJlc3NlZCBmaWxlcy5cbiAgICpcbiAgICogQHBhcmFtIGZpbGVOYW1lIC0gTmFtZSBvZiB0aGUgZmlsZSBiZWluZyBpbXBvcnRlZFxuICAgKiBAcGFyYW0gcmVuZGVyUGFzc2VzIC0gQXJyYXkgb2YgcmVuZGVyIHBhc3NlcyB0byBhZGQgaW1wb3J0ZWQgZW50aXRpZXMgdG9cbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMb2FkaW5nIG9wdGlvbnMgYW5kIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHVyaSAtIFVSSSBvZiB0aGUgZmlsZSBmb3IgcmVmZXJlbmNlXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIE9wdGlvbmFsIGNhbGxiYWNrIGZvciBwcm9ncmVzcyB0cmFja2luZ1xuICAgKiBAcmV0dXJucyBBIFJlc3VsdCBpbmRpY2F0aW5nIHN1Y2Nlc3Mgb3IgZmFpbHVyZSBvZiB0aGUgaW1wb3J0IG9wZXJhdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19kZXRlY3RUaGVNb2RlbEZpbGVUeXBlQW5kSW1wb3J0KFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGZpbGVOYW1lOiBzdHJpbmcsXG4gICAgcmVuZGVyUGFzc2VzOiBSZW5kZXJQYXNzW10sXG4gICAgb3B0aW9uczogR2x0ZkxvYWRPcHRpb24sXG4gICAgdXJpOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBSblByb21pc2VDYWxsYmFja1xuICApOiBQcm9taXNlPFJlc3VsdDx2b2lkLCB1bmRlZmluZWQ+PiB7XG4gICAgY29uc3Qgb3B0aW9uYWxGaWxlVHlwZSA9IG9wdGlvbnMuZmlsZVR5cGU7XG5cbiAgICBjb25zdCBmaWxlVHlwZSA9IHRoaXMuX19nZXRGaWxlVHlwZUZyb21GaWxlUHJvbWlzZShmaWxlTmFtZSwgb3B0aW9ucywgb3B0aW9uYWxGaWxlVHlwZSk7XG5cbiAgICBjb25zdCBmaWxlQXJyYXlCdWZmZXIgPSBvcHRpb25zLmZpbGVzIVtmaWxlTmFtZV07XG4gICAgb3B0aW9ucy5fX2lzSW1wb3J0VlJNMHggPSBmYWxzZTtcbiAgICBzd2l0Y2ggKGZpbGVUeXBlKSB7XG4gICAgICBjYXNlIEZpbGVUeXBlLkdsdGY6IHtcbiAgICAgICAgY29uc3QgZ290VGV4dCA9IERhdGFVdGlsLmFycmF5QnVmZmVyVG9TdHJpbmcoZmlsZUFycmF5QnVmZmVyKTtcbiAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZ290VGV4dCk7XG4gICAgICAgIGNvbnN0IGltcG9ydGVyID0gR2x0ZjJJbXBvcnRlcjtcbiAgICAgICAgY29uc3QgZ2x0Zk1vZGVsID0gYXdhaXQgaW1wb3J0ZXIuX2ltcG9ydEdsdGYoanNvbiwgb3B0aW9ucy5maWxlcyEsIG9wdGlvbnMsIGZpbGVOYW1lLCBjYWxsYmFjayk7XG4gICAgICAgIGNvbnN0IHJvb3RHcm91cCA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgICAgIHJlbmRlclBhc3Nlc1swXS5hZGRFbnRpdGllcyhbcm9vdEdyb3VwXSk7XG4gICAgICAgIG9wdGlvbnMuX19pbXBvcnRlZFR5cGUgPSAnZ2x0ZjInO1xuICAgICAgICByZXR1cm4gbmV3IE9rKCk7XG4gICAgICB9XG4gICAgICBjYXNlIEZpbGVUeXBlLkdsdGZCaW5hcnk6IHtcbiAgICAgICAgY29uc3QgaW1wb3J0ZXIgPSBHbHRmMkltcG9ydGVyO1xuICAgICAgICBjb25zdCBnbHRmTW9kZWwgPSBhd2FpdCBpbXBvcnRlci5faW1wb3J0R2xiKGZpbGVBcnJheUJ1ZmZlciwgb3B0aW9ucy5maWxlcyEsIG9wdGlvbnMpO1xuICAgICAgICBjb25zdCByb290R3JvdXAgPSBhd2FpdCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgICAgICByZW5kZXJQYXNzZXNbMF0uYWRkRW50aXRpZXMoW3Jvb3RHcm91cF0pO1xuICAgICAgICBvcHRpb25zLl9faW1wb3J0ZWRUeXBlID0gJ2dsYjInO1xuICAgICAgICByZXR1cm4gbmV3IE9rKCk7XG4gICAgICB9XG4gICAgICBjYXNlIEZpbGVUeXBlLkRyYWNvOiB7XG4gICAgICAgIGNvbnN0IGltcG9ydGVyID0gRHJjUG9pbnRDbG91ZEltcG9ydGVyLmdldEluc3RhbmNlKCkgYXMgRHJjUG9pbnRDbG91ZEltcG9ydGVyO1xuICAgICAgICBjb25zdCBnbHRmTW9kZWwgPSBhd2FpdCBpbXBvcnRlci5pbXBvcnRBcnJheUJ1ZmZlcih1cmksIGZpbGVBcnJheUJ1ZmZlciwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChnbHRmTW9kZWwgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdpbXBvcnRBcnJheUJ1ZmZlciBlcnJvciBpcyBvY2N1cnJlZCcsXG4gICAgICAgICAgICBlcnJvcjogdW5kZWZpbmVkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMuX19pbXBvcnRlZFR5cGUgPSAnZHJhY28nO1xuICAgICAgICBjb25zdCByb290R3JvdXAgPSBhd2FpdCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgICAgICByZW5kZXJQYXNzZXNbMF0uYWRkRW50aXRpZXMoW3Jvb3RHcm91cF0pO1xuICAgICAgICByZXR1cm4gbmV3IE9rKCk7XG4gICAgICB9XG4gICAgICBjYXNlIEZpbGVUeXBlLlZSTToge1xuICAgICAgICBvcHRpb25zLl9faXNJbXBvcnRWUk0weCA9IHRydWU7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEdsdGYySW1wb3J0ZXIuX2ltcG9ydEdsdGZPckdsYkZyb21BcnJheUJ1ZmZlcnMoZmlsZUFycmF5QnVmZmVyLCBvcHRpb25zLmZpbGVzISwgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5pc09rKCkpIHtcbiAgICAgICAgICBjb25zdCBnbHRmTW9kZWwgPSByZXN1bHQuZ2V0KCk7XG4gICAgICAgICAgaWYgKGdsdGZNb2RlbC5leHRlbnNpb25zVXNlZC5pbmRleE9mKCdWUk1DX3ZybScpID49IDApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuX19pc0ltcG9ydFZSTTB4ID0gZmFsc2U7XG4gICAgICAgICAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkxvYWRlck9wdGlvbnMhLl9faXNJbXBvcnRWUk0weCA9IGZhbHNlO1xuICAgICAgICAgICAgb3B0aW9ucy5fX2ltcG9ydGVkVHlwZSA9ICd2cm0xJztcbiAgICAgICAgICAgIGF3YWl0IFZybUltcG9ydGVyLl9faW1wb3J0VlJNKGVuZ2luZSwgZ2x0Zk1vZGVsLCByZW5kZXJQYXNzZXMpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZ2x0Zk1vZGVsLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoJ1ZSTScpID49IDApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuX19pbXBvcnRlZFR5cGUgPSAndnJtMHgnO1xuICAgICAgICAgICAgYXdhaXQgVnJtMHhJbXBvcnRlci5fX2ltcG9ydFZSTTB4KGVuZ2luZSwgZ2x0Zk1vZGVsLCByZW5kZXJQYXNzZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IE9rKCk7XG4gICAgICAgIH1cbiAgICAgICAgYXNzZXJ0SXNFcnIocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdC5nZXRSbkVycm9yKCkubWVzc2FnZSxcbiAgICAgICAgICBlcnJvcjogdW5kZWZpbmVkLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgICBtZXNzYWdlOiAnZGV0ZWN0IGludmFsaWQgZm9ybWF0JyxcbiAgICAgICAgICBlcnJvcjogdW5kZWZpbmVkLFxuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBmaWxlIHR5cGUgZnJvbSB0aGUgZmlsZSBuYW1lIGFuZCBvcHRpb25zLlxuICAgKiBVc2VzIGVpdGhlciB0aGUgZXhwbGljaXRseSBwcm92aWRlZCBmaWxlIHR5cGUgb3IgYXV0by1kZXRlY3RzIGZyb20gdGhlIGZpbGUgY29udGVudC5cbiAgICpcbiAgICogQHBhcmFtIGZpbGVOYW1lIC0gTmFtZSBvZiB0aGUgZmlsZSB0byBhbmFseXplXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGluZyBvcHRpb25zIGNvbnRhaW5pbmcgZmlsZSBkYXRhXG4gICAqIEBwYXJhbSBvcHRpb25hbEZpbGVUeXBlIC0gT3B0aW9uYWwgZXhwbGljaXQgZmlsZSB0eXBlIG92ZXJyaWRlXG4gICAqIEByZXR1cm5zIFRoZSBkZXRlY3RlZCBvciBzcGVjaWZpZWQgRmlsZVR5cGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0RmlsZVR5cGVGcm9tRmlsZVByb21pc2UoZmlsZU5hbWU6IHN0cmluZywgb3B0aW9uczogR2x0ZkxvYWRPcHRpb24sIG9wdGlvbmFsRmlsZVR5cGU/OiBzdHJpbmcpIHtcbiAgICBpZiAob3B0aW9uYWxGaWxlVHlwZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gRmlsZVR5cGUuZnJvbVN0cmluZyhvcHRpb25hbEZpbGVUeXBlKTtcbiAgICB9XG4gICAgY29uc3QgZmlsZVR5cGUgPSBkZXRlY3RGb3JtYXRCeUFycmF5QnVmZmVycyh7XG4gICAgICBbZmlsZU5hbWVdOiBvcHRpb25zLmZpbGVzIVtmaWxlTmFtZV0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbGVUeXBlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBR0EsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxhQUFhLEtBQUssVUFBdUI7QUFFbEQsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxrQkFBa0I7QUFFM0IsU0FBUyw2QkFBNkI7QUFDdEMsU0FBUyxrQ0FBa0M7QUFDM0MsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxtQkFBbUI7QUFNckIsSUFBTSxlQUFOLE1BQW1CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtoQixjQUFjO0FBQUEsRUFBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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
