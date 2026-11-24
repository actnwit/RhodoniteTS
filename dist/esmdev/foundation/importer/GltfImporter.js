// src/foundation/importer/GltfImporter.ts
import { FileType } from "../definitions/FileType.js";
import { DataUtil } from "../misc/DataUtil.js";
import { assertIsErr, Err, Ok } from "../misc/Result.js";
import { Expression } from "../renderer/Expression.js";
import { RenderPass } from "../renderer/RenderPass.js";
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
        const { DrcPointCloudImporter: DrcPointCloudImporterClass } = await import("./DrcPointCloudImporter.js");
        const importer = DrcPointCloudImporterClass.getInstance();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvR2x0ZkltcG9ydGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEdsdGZGaWxlQnVmZmVycywgR2x0ZkxvYWRPcHRpb24gfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IGdsVEYxIH0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xURjEnO1xuaW1wb3J0IHR5cGUgeyBSbk0yIH0gZnJvbSAnLi4vLi4vdHlwZXMvUm5NMic7XG5pbXBvcnQgeyBGaWxlVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0ZpbGVUeXBlJztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBhc3NlcnRJc0VyciwgRXJyLCBPaywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi9taXNjL1Jlc3VsdCc7XG5pbXBvcnQgdHlwZSB7IFJuUHJvbWlzZUNhbGxiYWNrIH0gZnJvbSAnLi4vbWlzYy9SblByb21pc2UnO1xuaW1wb3J0IHsgRXhwcmVzc2lvbiB9IGZyb20gJy4uL3JlbmRlcmVyL0V4cHJlc3Npb24nO1xuaW1wb3J0IHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgRHJjUG9pbnRDbG91ZEltcG9ydGVyIH0gZnJvbSAnLi9EcmNQb2ludENsb3VkSW1wb3J0ZXInO1xuaW1wb3J0IHsgZGV0ZWN0Rm9ybWF0QnlBcnJheUJ1ZmZlcnMgfSBmcm9tICcuL0Zvcm1hdERldGVjdG9yJztcbmltcG9ydCB7IEdsdGYySW1wb3J0ZXIgfSBmcm9tICcuL0dsdGYySW1wb3J0ZXInO1xuaW1wb3J0IHsgTW9kZWxDb252ZXJ0ZXIgfSBmcm9tICcuL01vZGVsQ29udmVydGVyJztcbmltcG9ydCB7IFZybTB4SW1wb3J0ZXIgfSBmcm9tICcuL1ZybTB4SW1wb3J0ZXInO1xuaW1wb3J0IHsgVnJtSW1wb3J0ZXIgfSBmcm9tICcuL1ZybUltcG9ydGVyJztcblxuLyoqXG4gKiBJbXBvcnRlciBjbGFzcyB3aGljaCBjYW4gaW1wb3J0IEdMVEYgYW5kIFZSTSBmaWxlcy5cbiAqIFN1cHBvcnRzIG11bHRpcGxlIGZvcm1hdHMgaW5jbHVkaW5nIGdsVEYgMS4wLzIuMCwgR0xCLCBWUk0gMC54LzEuMCwgYW5kIERyYWNvIGNvbXByZXNzZWQgZmlsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBHbHRmSW1wb3J0ZXIge1xuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3RvciB0byBwcmV2ZW50IGRpcmVjdCBpbnN0YW50aWF0aW9uLlxuICAgKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgYXMgYSBzdGF0aWMgdXRpbGl0eSBjbGFzcy5cbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgR0xURiBvciBWUk0gZmlsZSBmcm9tIGEgVVJMLlxuICAgKiBBdXRvbWF0aWNhbGx5IGRldGVjdHMgdGhlIGZpbGUgZm9ybWF0IGFuZCB1c2VzIHRoZSBhcHByb3ByaWF0ZSBpbXBvcnRlci5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHVybCAtIFRoZSBVUkwgb2YgdGhlIGdsVEYvVlJNIGZpbGUgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgbG9hZGluZyBjb25maWd1cmF0aW9uLiBUaGUgZmlsZXMgcHJvcGVydHkgaXMgaWdub3JlZCBmb3IgVVJMIGltcG9ydHNcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gT3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHByb2dyZXNzIHRyYWNraW5nXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIEV4cHJlc3Npb24gY29udGFpbmluZzpcbiAgICogICAgICAgICAgLSByZW5kZXJQYXNzZXNbMF06IG1vZGVsIGVudGl0aWVzXG4gICAqICAgICAgICAgIC0gcmVuZGVyUGFzc2VzWzFdOiBtb2RlbCBvdXRsaW5lcyAoaWYgYXBwbGljYWJsZSlcbiAgICogQHRocm93cyBXaWxsIHJlamVjdCB0aGUgcHJvbWlzZSBpZiB0aGUgZmlsZSBjYW5ub3QgYmUgZmV0Y2hlZCBvciBwYXJzZWRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbXBvcnRGcm9tVXJsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvbixcbiAgICBjYWxsYmFjaz86IFJuUHJvbWlzZUNhbGxiYWNrXG4gICk6IFByb21pc2U8RXhwcmVzc2lvbj4ge1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxFeHByZXNzaW9uPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBvcHRpb25zID0gdGhpcy5fX2luaXRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlclBhc3NlcyA9IG9wdGlvbnMuZXhwcmVzc2lvbj8ucmVuZGVyUGFzc2VzIHx8IFtdO1xuICAgICAgICBpZiAocmVuZGVyUGFzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJlbmRlclBhc3Nlcy5wdXNoKG5ldyBSZW5kZXJQYXNzKGVuZ2luZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcl9hcnJheUJ1ZmZlciA9IGF3YWl0IERhdGFVdGlsLmZldGNoQXJyYXlCdWZmZXIodXJsKTtcbiAgICAgICAgaWYgKHJfYXJyYXlCdWZmZXIuaXNFcnIoKSkge1xuICAgICAgICAgIHJlamVjdChyX2FycmF5QnVmZmVyLmdldFJuRXJyb3IoKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5maWxlcyFbdXJsXSA9IHJfYXJyYXlCdWZmZXIuZ2V0KCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fX2RldGVjdFRoZU1vZGVsRmlsZVR5cGVBbmRJbXBvcnQoZW5naW5lLCB1cmwsIHJlbmRlclBhc3Nlcywgb3B0aW9ucywgdXJsLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnM/LmNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiByZW5kZXJQYXNzZXMpIHtcbiAgICAgICAgICAgIHJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50ID0gb3B0aW9ucy5jYW1lcmFDb21wb25lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IHRoaXMuX19zZXRSZW5kZXJQYXNzZXNUb0V4cHJlc3Npb24ocmVuZGVyUGFzc2VzLCBvcHRpb25zKTtcbiAgICAgICAgcmVzb2x2ZShleHByZXNzaW9uKTtcbiAgICAgIH0pKCkuY2F0Y2gocmVqZWN0KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBHTFRGIG9yIFZSTSBmcm9tIHByZS1sb2FkZWQgQXJyYXlCdWZmZXJzLlxuICAgKiBVc2VmdWwgd2hlbiB5b3UgaGF2ZSBhbHJlYWR5IGxvYWRlZCB0aGUgZmlsZSBkYXRhIGFuZCB3YW50IHRvIGF2b2lkIGFkZGl0aW9uYWwgbmV0d29yayByZXF1ZXN0cy5cbiAgICpcbiAgICogQHBhcmFtIGZpbGVzIC0gQSBtYXAgb2YgZmlsZSBuYW1lcyB0byBBcnJheUJ1ZmZlcnMuIEZpbGUgbmFtZXMgc2hvdWxkIGluY2x1ZGUgZXh0ZW5zaW9ucyBhbmQgbWF0Y2ggVVJJcyB1c2VkIGluIHRoZSBnbFRGXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgbG9hZGluZyBjb25maWd1cmF0aW9uLiBJZiB1c2luZyB0aGUgZmlsZXMgb3B0aW9uLCBrZXlzIG11c3QgbWF0Y2ggdGhlIFVSSXMgb2YgdGhlIEFycmF5QnVmZmVyIHZhbHVlc1xuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBPcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiBmb3IgcHJvZ3Jlc3MgdHJhY2tpbmdcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gRXhwcmVzc2lvbiBjb250YWluaW5nOlxuICAgKiAgICAgICAgICAtIHJlbmRlclBhc3Nlc1swXTogbW9kZWwgZW50aXRpZXNcbiAgICogICAgICAgICAgLSByZW5kZXJQYXNzZXNbMV06IG1vZGVsIG91dGxpbmVzIChpZiBhcHBsaWNhYmxlKVxuICAgKiBAdGhyb3dzIFdpbGwgcmVqZWN0IHRoZSBwcm9taXNlIGlmIHRoZSBmaWxlcyBjYW5ub3QgYmUgcGFyc2VkIG9yIGFyZSBpbiBhbiB1bnN1cHBvcnRlZCBmb3JtYXRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbXBvcnRGcm9tQXJyYXlCdWZmZXJzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGZpbGVzOiBHbHRmRmlsZUJ1ZmZlcnMsXG4gICAgb3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uLFxuICAgIGNhbGxiYWNrPzogUm5Qcm9taXNlQ2FsbGJhY2tcbiAgKTogUHJvbWlzZTxFeHByZXNzaW9uPiB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPEV4cHJlc3Npb24+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLl9faW5pdE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICAgICAgY29uc3QgcmVuZGVyUGFzc2VzID0gb3B0aW9ucy5leHByZXNzaW9uPy5yZW5kZXJQYXNzZXMgfHwgW107XG4gICAgICAgIGlmIChyZW5kZXJQYXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmVuZGVyUGFzc2VzLnB1c2gobmV3IFJlbmRlclBhc3MoZW5naW5lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGZpbGVOYW1lIGluIGZpbGVzKSB7XG4gICAgICAgICAgLy8gZmlsZW5hbWUgaXMgdXJpIHdpdGggZmlsZSBleHRlbnNpb25cbiAgICAgICAgICBjb25zdCBmaWxlRXh0ZW5zaW9uID0gRGF0YVV0aWwuZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lKTtcbiAgICAgICAgICAvLyBpZiB0aGUgZmlsZSBpcyBtYWluIGZpbGUgdHlwZT9cbiAgICAgICAgICBpZiAodGhpcy5fX2lzVmFsaWRFeHRlbnNpb24oZmlsZUV4dGVuc2lvbikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX19kZXRlY3RUaGVNb2RlbEZpbGVUeXBlQW5kSW1wb3J0KGVuZ2luZSwgZmlsZU5hbWUsIHJlbmRlclBhc3Nlcywgb3B0aW9ucywgZmlsZU5hbWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucz8uY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIHJlbmRlclBhc3Nlcykge1xuICAgICAgICAgICAgcmVuZGVyUGFzcy5jYW1lcmFDb21wb25lbnQgPSBvcHRpb25zLmNhbWVyYUNvbXBvbmVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gdGhpcy5fX3NldFJlbmRlclBhc3Nlc1RvRXhwcmVzc2lvbihyZW5kZXJQYXNzZXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHJlc29sdmUoZXhwcmVzc2lvbik7XG4gICAgICB9KSgpLmNhdGNoKHJlamVjdCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGFuZCB2YWxpZGF0ZSB0aGUgbG9hZGluZyBvcHRpb25zLlxuICAgKiBTZXRzIGRlZmF1bHQgdmFsdWVzIGZvciBtaXNzaW5nIG9wdGlvbnMgYW5kIHBlcmZvcm1zIG5lY2Vzc2FyeSB0cmFuc2Zvcm1hdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIG9yaWdpbmFsIG9wdGlvbnMgb2JqZWN0LCBtYXkgYmUgdW5kZWZpbmVkXG4gICAqIEByZXR1cm5zIEEgZnVsbHkgaW5pdGlhbGl6ZWQgR2x0ZkxvYWRPcHRpb24gb2JqZWN0IHdpdGggYWxsIHJlcXVpcmVkIHByb3BlcnRpZXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faW5pdE9wdGlvbnMob3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uKTogR2x0ZkxvYWRPcHRpb24ge1xuICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMgPSBEYXRhVXRpbC5jcmVhdGVEZWZhdWx0R2x0Zk9wdGlvbnMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMuZmlsZXMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zLmZpbGVzID0ge307XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgZmlsZSBpbiBvcHRpb25zLmZpbGVzKSB7XG4gICAgICAgIGlmIChmaWxlLm1hdGNoKC8uKlxcLnZybSQvKSA9PSBudWxsKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGUuc3BsaXQoJy52cm0nKVswXTtcbiAgICAgICAgaWYgKGZpbGVOYW1lKSB7XG4gICAgICAgICAgY29uc3QgYXJyYXlidWZmZXIgPSBvcHRpb25zLmZpbGVzW2ZpbGVdO1xuICAgICAgICAgIG9wdGlvbnMuZmlsZXNbYCR7ZmlsZU5hbWV9LmdsYmBdID0gYXJyYXlidWZmZXI7XG4gICAgICAgICAgZGVsZXRlIG9wdGlvbnMuZmlsZXNbZmlsZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID0gW3t9XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGF2b2lkIG5lZWRsZXNzIHByb2Nlc3NpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF0uaXNNb3JwaGluZyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBvcHRpb25zLm1heE1vcnBoVGFyZ2V0TnVtYmVyID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zITtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcmVuZGVyIHBhc3NlcyB0byB0aGUgZXhwcmVzc2lvbiBvYmplY3QuXG4gICAqIENyZWF0ZXMgYSBuZXcgZXhwcmVzc2lvbiBpZiBvbmUgZG9lc24ndCBleGlzdCwgb3IgdXBkYXRlcyB0aGUgZXhpc3Rpbmcgb25lLlxuICAgKlxuICAgKiBAcGFyYW0gcmVuZGVyUGFzc2VzIC0gQXJyYXkgb2YgcmVuZGVyIHBhc3NlcyB0byBhZGQgdG8gdGhlIGV4cHJlc3Npb25cbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMb2FkaW5nIG9wdGlvbnMgY29udGFpbmluZyB0aGUgb3B0aW9uYWwgZXhwcmVzc2lvblxuICAgKiBAcmV0dXJucyBUaGUgZXhwcmVzc2lvbiBvYmplY3Qgd2l0aCByZW5kZXIgcGFzc2VzIGNvbmZpZ3VyZWRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UmVuZGVyUGFzc2VzVG9FeHByZXNzaW9uKHJlbmRlclBhc3NlczogUmVuZGVyUGFzc1tdLCBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbikge1xuICAgIGNvbnN0IGV4cHJlc3Npb24gPSBvcHRpb25zLmV4cHJlc3Npb24gPz8gbmV3IEV4cHJlc3Npb24oKTtcblxuICAgIGlmIChleHByZXNzaW9uLnJlbmRlclBhc3NlcyAhPT0gcmVuZGVyUGFzc2VzKSB7XG4gICAgICBleHByZXNzaW9uLmNsZWFyUmVuZGVyUGFzc2VzKCk7XG4gICAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhyZW5kZXJQYXNzZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBleHByZXNzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBnaXZlbiBmaWxlIGV4dGVuc2lvbiBpcyBzdXBwb3J0ZWQgYnkgdGhlIGltcG9ydGVyLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsZUV4dGVuc2lvbiAtIFRoZSBmaWxlIGV4dGVuc2lvbiB0byB2YWxpZGF0ZSAod2l0aG91dCB0aGUgZG90KVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBleHRlbnNpb24gaXMgc3VwcG9ydGVkIChnbHRmLCBnbGIsIHZybSwgZHJjKSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2lzVmFsaWRFeHRlbnNpb24oZmlsZUV4dGVuc2lvbjogc3RyaW5nKSB7XG4gICAgaWYgKFxuICAgICAgZmlsZUV4dGVuc2lvbiA9PT0gJ2dsdGYnIHx8XG4gICAgICBmaWxlRXh0ZW5zaW9uID09PSAnZ2xiJyB8fFxuICAgICAgZmlsZUV4dGVuc2lvbiA9PT0gJ3JuYicgfHxcbiAgICAgIGZpbGVFeHRlbnNpb24gPT09ICd2cm0nIHx8XG4gICAgICBmaWxlRXh0ZW5zaW9uID09PSAnZHJjJ1xuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgYW4gQXJyYXlCdWZmZXIgY29udGFpbnMgR0xCIChiaW5hcnkgZ2xURikgZGF0YS5cbiAgICogQ2hlY2tzIHRoZSBtYWdpYyBudW1iZXIgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgdG8gZXhhbWluZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBidWZmZXIgY29udGFpbnMgR0xCIGRhdGEsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc0dsYihhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhhcnJheUJ1ZmZlciwgMCwgMjApO1xuICAgIGNvbnN0IGlzTGl0dGxlRW5kaWFuID0gdHJ1ZTtcbiAgICAvLyBNYWdpYyBmaWVsZFxuICAgIGNvbnN0IG1hZ2ljID0gZGF0YVZpZXcuZ2V0VWludDMyKDAsIGlzTGl0dGxlRW5kaWFuKTtcbiAgICAvLyBUaGUgMHg0NjU0NkM2NyBtZWFucyAnZ2xURicgc3RyaW5nIGluIGdsYiBmaWxlcy5cbiAgICBpZiAobWFnaWMgPT09IDB4NDY1NDZjNjcpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdCB0aGUgZ2xURiB2ZXJzaW9uIGZyb20gYSBHTEIgQXJyYXlCdWZmZXIuXG4gICAqIFJlYWRzIHRoZSB2ZXJzaW9uIGZpZWxkIGZyb20gdGhlIEdMQiBoZWFkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBnbGJBcnJheUJ1ZmZlciAtIFRoZSBHTEIgQXJyYXlCdWZmZXIgdG8gZXhhbWluZVxuICAgKiBAcmV0dXJucyBUaGUgZ2xURiB2ZXJzaW9uIG51bWJlciAodHlwaWNhbGx5IDEgb3IgMilcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0R2xiVmVyc2lvbihnbGJBcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhnbGJBcnJheUJ1ZmZlciwgMCwgMjApO1xuICAgIGNvbnN0IGlzTGl0dGxlRW5kaWFuID0gdHJ1ZTtcbiAgICBjb25zdCBnbGJWZXIgPSBkYXRhVmlldy5nZXRVaW50MzIoNCwgaXNMaXR0bGVFbmRpYW4pO1xuICAgIHJldHVybiBnbGJWZXI7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBnbFRGIHZlcnNpb24gZnJvbSBwYXJzZWQgSlNPTiBkYXRhLlxuICAgKiBFeGFtaW5lcyB0aGUgYXNzZXQudmVyc2lvbiBmaWVsZCB0byBkZXRlcm1pbmUgaWYgaXQncyBnbFRGIDEuMCBvciAyLjAuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBwYXJzZWQgZ2xURiBKU09OIG9iamVjdFxuICAgKiBAcmV0dXJucyAyIGZvciBnbFRGIDIuMCwgMSBmb3IgZ2xURiAxLjAgb3Igb2xkZXIgdmVyc2lvbnNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0R2x0ZlZlcnNpb24oZ2x0Zkpzb246IGdsVEYxIHwgUm5NMikge1xuICAgIGlmICgoZ2x0Zkpzb24gYXMgUm5NMikuYXNzZXQ/LnZlcnNpb24/LmNoYXJBdCgwKSA9PT0gJzInKSB7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZWN0IHRoZSBtb2RlbCBmaWxlIHR5cGUgYW5kIGltcG9ydCB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaW1wb3J0ZXIuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW50IGZpbGUgZm9ybWF0cyBpbmNsdWRpbmcgZ2xURiwgR0xCLCBWUk0sIGFuZCBEcmFjbyBjb21wcmVzc2VkIGZpbGVzLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgLSBOYW1lIG9mIHRoZSBmaWxlIGJlaW5nIGltcG9ydGVkXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzZXMgLSBBcnJheSBvZiByZW5kZXIgcGFzc2VzIHRvIGFkZCBpbXBvcnRlZCBlbnRpdGllcyB0b1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRpbmcgb3B0aW9ucyBhbmQgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gdXJpIC0gVVJJIG9mIHRoZSBmaWxlIGZvciByZWZlcmVuY2VcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gT3B0aW9uYWwgY2FsbGJhY2sgZm9yIHByb2dyZXNzIHRyYWNraW5nXG4gICAqIEByZXR1cm5zIEEgUmVzdWx0IGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlIG9mIHRoZSBpbXBvcnQgb3BlcmF0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX2RldGVjdFRoZU1vZGVsRmlsZVR5cGVBbmRJbXBvcnQoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZmlsZU5hbWU6IHN0cmluZyxcbiAgICByZW5kZXJQYXNzZXM6IFJlbmRlclBhc3NbXSxcbiAgICBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbixcbiAgICB1cmk6IHN0cmluZyxcbiAgICBjYWxsYmFjaz86IFJuUHJvbWlzZUNhbGxiYWNrXG4gICk6IFByb21pc2U8UmVzdWx0PHZvaWQsIHVuZGVmaW5lZD4+IHtcbiAgICBjb25zdCBvcHRpb25hbEZpbGVUeXBlID0gb3B0aW9ucy5maWxlVHlwZTtcblxuICAgIGNvbnN0IGZpbGVUeXBlID0gdGhpcy5fX2dldEZpbGVUeXBlRnJvbUZpbGVQcm9taXNlKGZpbGVOYW1lLCBvcHRpb25zLCBvcHRpb25hbEZpbGVUeXBlKTtcblxuICAgIGNvbnN0IGZpbGVBcnJheUJ1ZmZlciA9IG9wdGlvbnMuZmlsZXMhW2ZpbGVOYW1lXTtcbiAgICBvcHRpb25zLl9faXNJbXBvcnRWUk0weCA9IGZhbHNlO1xuICAgIHN3aXRjaCAoZmlsZVR5cGUpIHtcbiAgICAgIGNhc2UgRmlsZVR5cGUuR2x0Zjoge1xuICAgICAgICBjb25zdCBnb3RUZXh0ID0gRGF0YVV0aWwuYXJyYXlCdWZmZXJUb1N0cmluZyhmaWxlQXJyYXlCdWZmZXIpO1xuICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShnb3RUZXh0KTtcbiAgICAgICAgY29uc3QgaW1wb3J0ZXIgPSBHbHRmMkltcG9ydGVyO1xuICAgICAgICBjb25zdCBnbHRmTW9kZWwgPSBhd2FpdCBpbXBvcnRlci5faW1wb3J0R2x0Zihqc29uLCBvcHRpb25zLmZpbGVzISwgb3B0aW9ucywgZmlsZU5hbWUsIGNhbGxiYWNrKTtcbiAgICAgICAgY29uc3Qgcm9vdEdyb3VwID0gYXdhaXQgTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICAgICAgcmVuZGVyUGFzc2VzWzBdLmFkZEVudGl0aWVzKFtyb290R3JvdXBdKTtcbiAgICAgICAgb3B0aW9ucy5fX2ltcG9ydGVkVHlwZSA9ICdnbHRmMic7XG4gICAgICAgIHJldHVybiBuZXcgT2soKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgRmlsZVR5cGUuR2x0ZkJpbmFyeToge1xuICAgICAgICBjb25zdCBpbXBvcnRlciA9IEdsdGYySW1wb3J0ZXI7XG4gICAgICAgIGNvbnN0IGdsdGZNb2RlbCA9IGF3YWl0IGltcG9ydGVyLl9pbXBvcnRHbGIoZmlsZUFycmF5QnVmZmVyLCBvcHRpb25zLmZpbGVzISwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IHJvb3RHcm91cCA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgICAgIHJlbmRlclBhc3Nlc1swXS5hZGRFbnRpdGllcyhbcm9vdEdyb3VwXSk7XG4gICAgICAgIG9wdGlvbnMuX19pbXBvcnRlZFR5cGUgPSAnZ2xiMic7XG4gICAgICAgIHJldHVybiBuZXcgT2soKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgRmlsZVR5cGUuRHJhY286IHtcbiAgICAgICAgLy8gVGhlIERyYWNvIGRlY29kZXIgaXMgb25seSBsb2FkZWQgZm9yIERyYWNvIGZpbGVzLlxuICAgICAgICBjb25zdCB7IERyY1BvaW50Q2xvdWRJbXBvcnRlcjogRHJjUG9pbnRDbG91ZEltcG9ydGVyQ2xhc3MgfSA9IGF3YWl0IGltcG9ydCgnLi9EcmNQb2ludENsb3VkSW1wb3J0ZXInKTtcbiAgICAgICAgY29uc3QgaW1wb3J0ZXIgPSBEcmNQb2ludENsb3VkSW1wb3J0ZXJDbGFzcy5nZXRJbnN0YW5jZSgpIGFzIERyY1BvaW50Q2xvdWRJbXBvcnRlcjtcbiAgICAgICAgY29uc3QgZ2x0Zk1vZGVsID0gYXdhaXQgaW1wb3J0ZXIuaW1wb3J0QXJyYXlCdWZmZXIodXJpLCBmaWxlQXJyYXlCdWZmZXIsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoZ2x0Zk1vZGVsID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IEVycih7XG4gICAgICAgICAgICBtZXNzYWdlOiAnaW1wb3J0QXJyYXlCdWZmZXIgZXJyb3IgaXMgb2NjdXJyZWQnLFxuICAgICAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLl9faW1wb3J0ZWRUeXBlID0gJ2RyYWNvJztcbiAgICAgICAgY29uc3Qgcm9vdEdyb3VwID0gYXdhaXQgTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICAgICAgcmVuZGVyUGFzc2VzWzBdLmFkZEVudGl0aWVzKFtyb290R3JvdXBdKTtcbiAgICAgICAgcmV0dXJuIG5ldyBPaygpO1xuICAgICAgfVxuICAgICAgY2FzZSBGaWxlVHlwZS5WUk06IHtcbiAgICAgICAgb3B0aW9ucy5fX2lzSW1wb3J0VlJNMHggPSB0cnVlO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBHbHRmMkltcG9ydGVyLl9pbXBvcnRHbHRmT3JHbGJGcm9tQXJyYXlCdWZmZXJzKGZpbGVBcnJheUJ1ZmZlciwgb3B0aW9ucy5maWxlcyEsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChyZXN1bHQuaXNPaygpKSB7XG4gICAgICAgICAgY29uc3QgZ2x0Zk1vZGVsID0gcmVzdWx0LmdldCgpO1xuICAgICAgICAgIGlmIChnbHRmTW9kZWwuZXh0ZW5zaW9uc1VzZWQuaW5kZXhPZignVlJNQ192cm0nKSA+PSAwKSB7XG4gICAgICAgICAgICBvcHRpb25zLl9faXNJbXBvcnRWUk0weCA9IGZhbHNlO1xuICAgICAgICAgICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zIS5fX2lzSW1wb3J0VlJNMHggPSBmYWxzZTtcbiAgICAgICAgICAgIG9wdGlvbnMuX19pbXBvcnRlZFR5cGUgPSAndnJtMSc7XG4gICAgICAgICAgICBhd2FpdCBWcm1JbXBvcnRlci5fX2ltcG9ydFZSTShlbmdpbmUsIGdsdGZNb2RlbCwgcmVuZGVyUGFzc2VzKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsdGZNb2RlbC5leHRlbnNpb25zVXNlZC5pbmRleE9mKCdWUk0nKSA+PSAwKSB7XG4gICAgICAgICAgICBvcHRpb25zLl9faW1wb3J0ZWRUeXBlID0gJ3ZybTB4JztcbiAgICAgICAgICAgIGF3YWl0IFZybTB4SW1wb3J0ZXIuX19pbXBvcnRWUk0weChlbmdpbmUsIGdsdGZNb2RlbCwgcmVuZGVyUGFzc2VzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBPaygpO1xuICAgICAgICB9XG4gICAgICAgIGFzc2VydElzRXJyKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgICBtZXNzYWdlOiByZXN1bHQuZ2V0Um5FcnJvcigpLm1lc3NhZ2UsXG4gICAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbmV3IEVycih7XG4gICAgICAgICAgbWVzc2FnZTogJ2RldGVjdCBpbnZhbGlkIGZvcm1hdCcsXG4gICAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSB0aGUgZmlsZSB0eXBlIGZyb20gdGhlIGZpbGUgbmFtZSBhbmQgb3B0aW9ucy5cbiAgICogVXNlcyBlaXRoZXIgdGhlIGV4cGxpY2l0bHkgcHJvdmlkZWQgZmlsZSB0eXBlIG9yIGF1dG8tZGV0ZWN0cyBmcm9tIHRoZSBmaWxlIGNvbnRlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlTmFtZSAtIE5hbWUgb2YgdGhlIGZpbGUgdG8gYW5hbHl6ZVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRpbmcgb3B0aW9ucyBjb250YWluaW5nIGZpbGUgZGF0YVxuICAgKiBAcGFyYW0gb3B0aW9uYWxGaWxlVHlwZSAtIE9wdGlvbmFsIGV4cGxpY2l0IGZpbGUgdHlwZSBvdmVycmlkZVxuICAgKiBAcmV0dXJucyBUaGUgZGV0ZWN0ZWQgb3Igc3BlY2lmaWVkIEZpbGVUeXBlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEZpbGVUeXBlRnJvbUZpbGVQcm9taXNlKGZpbGVOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uLCBvcHRpb25hbEZpbGVUeXBlPzogc3RyaW5nKSB7XG4gICAgaWYgKG9wdGlvbmFsRmlsZVR5cGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIEZpbGVUeXBlLmZyb21TdHJpbmcob3B0aW9uYWxGaWxlVHlwZSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVUeXBlID0gZGV0ZWN0Rm9ybWF0QnlBcnJheUJ1ZmZlcnMoe1xuICAgICAgW2ZpbGVOYW1lXTogb3B0aW9ucy5maWxlcyFbZmlsZU5hbWVdLFxuICAgIH0pO1xuICAgIHJldHVybiBmaWxlVHlwZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUdBLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsYUFBYSxLQUFLLFVBQXVCO0FBRWxELFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsa0JBQWtCO0FBRzNCLFNBQVMsa0NBQWtDO0FBQzND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
