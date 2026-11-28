// src/foundation/importer/DrcPointCloudImporter.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Primitive } from "../geometry/Primitive.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { ifDefinedThen, ifUndefinedThen } from "../misc/MiscUtil.js";
import { Err, Ok } from "../misc/Result.js";
import { RnPromise } from "../misc/RnPromise.js";
var DrcPointCloudImporter = class _DrcPointCloudImporter {
  /**
   * Private constructor to enforce singleton pattern.
   */
  constructor() {
  }
  /**
   * Imports a Draco point cloud file from a URI and converts it to glTF2 format.
   * This method supports both direct file URIs and file collections passed through options.
   *
   * @param uri - The URI of the .drc file to import
   * @param options - Optional loading configuration including file collections and processing options
   * @returns A Promise that resolves to a Result containing the glTF2 JSON or an error
   *
   * @example
   * ```typescript
   * const importer = DrcPointCloudImporter.getInstance();
   * const result = await importer.importPointCloud('path/to/pointcloud.drc');
   * if (result.isOk()) {
   *   const gltfJson = result.get();
   *   // Process the glTF JSON
   * }
   * ```
   */
  async importPointCloud(uri, options) {
    const basePath = `${uri.substring(0, uri.lastIndexOf("/"))}/`;
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    if (options == null ? void 0 : options.files) {
      for (const fileName in options.files) {
        const fileExtension = DataUtil.getExtension(fileName);
        if (fileExtension === "drc") {
          const rnm22 = await this.yp(options.files[fileName], defaultOptions, basePath, options);
          return new Ok(rnm22);
        }
      }
    }
    const r_arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    if (r_arrayBuffer.isErr()) {
      return new Err({
        message: "fetchArrayBuffer failed",
        error: r_arrayBuffer
      });
    }
    const rnm2 = await this.yp(r_arrayBuffer.get(), defaultOptions, basePath, options);
    return new Ok(rnm2);
  }
  /**
   * Imports a Draco point cloud from an ArrayBuffer and converts it to glTF2 format.
   * This method is useful when you already have the file data in memory.
   *
   * @param uri - The original URI of the file (used for base path calculation)
   * @param arrayBuffer - The ArrayBuffer containing the Draco file data
   * @param options - Optional loading configuration
   * @returns A Promise that resolves to the glTF2 JSON or rejects with an error
   *
   * @example
   * ```typescript
   * const importer = DrcPointCloudImporter.getInstance();
   * const buffer = await fetch('pointcloud.drc').then(r => r.arrayBuffer());
   * const gltfJson = await importer.importArrayBuffer('pointcloud.drc', buffer);
   * ```
   */
  importArrayBuffer(uri, arrayBuffer, options) {
    const basePath = `${uri.substring(0, uri.lastIndexOf("/"))}/`;
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    return this.yp(arrayBuffer, defaultOptions, basePath, options).catch((err) => {
      Logger.default.error(`__loadFromArrayBuffer error: ${err}`);
    });
  }
  /**
   * Internal method to load and process ArrayBuffer data.
   * Determines whether the data is binary glTF or text JSON format and processes accordingly.
   *
   * @param arrayBuffer - The ArrayBuffer containing the file data
   * @param defaultOptions - Default loading options
   * @param basePath - Base path for resolving relative URIs
   * @param options - Additional loading options
   * @returns A Promise that resolves to the processed glTF JSON
   * @private
   */
  async Lp(arrayBuffer, defaultOptions, basePath, options) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    if (magic !== 1179937895) {
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      result = await this._loadAsTextJson(json, options, defaultOptions, basePath).catch((err) => {
        Logger.default.error(`this.__loadAsTextJson error: ${err}`);
      });
    } else {
      result = await this._loadAsBinaryJson(
        dataView,
        isLittleEndian,
        arrayBuffer,
        options,
        defaultOptions,
        basePath
      ).catch((err) => {
        Logger.default.error(`this.__loadAsBinaryJson error: ${err}`);
      });
    }
    return result;
  }
  /**
   * Merges default options with JSON-embedded options and user-provided options.
   * Priority: user options > JSON embedded options > default options.
   *
   * @param defaultOptions - The default loading options
   * @param json - The glTF JSON that may contain embedded options
   * @param options - User-provided options
   * @returns The merged options object
   * @private
   */
  _getOptions(defaultOptions, json, options) {
    var _a, _b;
    if ((_b = (_a = json.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) {
      for (const optionName in json.asset.extras.rnLoaderOptions) {
        defaultOptions[optionName] = json.asset.extras.rnLoaderOptions[optionName];
      }
    }
    for (const optionName in options) {
      defaultOptions[optionName] = options[optionName];
    }
    if ((options == null ? void 0 : options.loaderExtensionName) && typeof options.loaderExtensionName === "string") {
      if (Rn[options.loaderExtensionName] != null) {
        defaultOptions.loaderExtension = Rn[options.loaderExtensionName].getInstance();
      } else {
        Logger.default.error(`${options.loaderExtensionName} not found!`);
        defaultOptions.loaderExtension = void 0;
      }
    }
    return defaultOptions;
  }
  /**
   * Processes binary glTF data by extracting JSON chunk and binary data.
   * Validates the glTF binary format and delegates to appropriate loading methods.
   *
   * @param dataView - DataView for reading binary data
   * @param isLittleEndian - Whether the data is in little-endian format
   * @param arrayBuffer - The complete ArrayBuffer containing the glTF data
   * @param options - Loading options
   * @param defaultOptions - Default loading options
   * @param basePath - Base path for resolving relative URIs
   * @returns A Promise that resolves to the processed glTF JSON
   * @private
   */
  async _loadAsBinaryJson(dataView, isLittleEndian, arrayBuffer, options, defaultOptions, basePath) {
    const lengthOfJSonChunkData = dataView.getUint32(12, isLittleEndian);
    const chunkType = dataView.getUint32(16, isLittleEndian);
    if (chunkType !== 1313821514) {
      throw new Error("invalid chunkType of chunk0 in this binary glTF file.");
    }
    const uint8ArrayJSonContent = new Uint8Array(arrayBuffer, 20, lengthOfJSonChunkData);
    const gotText = DataUtil.uint8ArrayToString(uint8ArrayJSonContent);
    const gltfJson = JSON.parse(gotText);
    options = this._getOptions(defaultOptions, gltfJson, options);
    const uint8array = new Uint8Array(arrayBuffer, 20 + lengthOfJSonChunkData + 8);
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;
    try {
      await this._loadInner(uint8array, basePath, gltfJson, options);
    } catch (err) {
      Logger.default.error(`this._loadInner error in _loadAsBinaryJson: ${err}`);
    }
    return gltfJson;
  }
  /**
   * Processes text-based glTF JSON data.
   * Sets up asset information and delegates to internal loading methods.
   *
   * @param gltfJson - The parsed glTF JSON object
   * @param options - Loading options
   * @param defaultOptions - Default loading options
   * @param basePath - Base path for resolving relative URIs
   * @returns A Promise that resolves to the processed glTF JSON
   * @private
   */
  async _loadAsTextJson(gltfJson, options, defaultOptions, basePath) {
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }
    options = this._getOptions(defaultOptions, gltfJson, options);
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;
    try {
      await this._loadInner(void 0, basePath, gltfJson, options);
    } catch (err) {
      Logger.default.error(`this._loadInner error in _loadAsTextJson: ${err}`);
    }
    return gltfJson;
  }
  /**
   * Internal loading method that coordinates resource loading and JSON content processing.
   * Runs resource loading and JSON processing in parallel for better performance.
   *
   * @param uint8array - Binary data for embedded resources (optional)
   * @param basePath - Base path for resolving relative URIs
   * @param gltfJson - The glTF JSON object to process
   * @param options - Loading options
   * @returns A Promise that resolves when all loading is complete
   * @private
   */
  _loadInner(uint8array, basePath, gltfJson, options) {
    const promises = [];
    const resources = {
      shaders: [],
      buffers: [],
      images: []
    };
    promises.push(this._loadResources(uint8array, basePath, gltfJson, options, resources));
    promises.push(
      new Promise((resolve) => {
        this._loadJsonContent(gltfJson, options);
        resolve();
      })
    );
    return Promise.all(promises);
  }
  /**
   * Processes glTF JSON content by loading dependencies for all major components.
   * This method establishes object references between different glTF components.
   *
   * @param gltfJson - The glTF JSON object to process
   * @param options - Loading options
   * @private
   */
  _loadJsonContent(gltfJson, _options) {
    this._loadDependenciesOfScenes(gltfJson);
    this._loadDependenciesOfNodes(gltfJson);
    this._loadDependenciesOfMeshes(gltfJson);
    this._loadDependenciesOfMaterials(gltfJson);
    this._loadDependenciesOfTextures(gltfJson);
    this._loadDependenciesOfJoints(gltfJson);
    this._loadDependenciesOfAnimations(gltfJson);
    this._loadDependenciesOfAccessors(gltfJson);
    this._loadDependenciesOfBufferViews(gltfJson);
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = {};
    }
  }
  /**
   * Establishes object references between scenes and their nodes.
   * Populates the nodesObjects array with actual node objects.
   *
   * @param gltfJson - The glTF JSON object containing scenes
   * @private
   */
  _loadDependenciesOfScenes(gltfJson) {
    for (const scene of gltfJson.scenes) {
      for (const i in scene.nodes) {
        scene.nodesObjects[i] = gltfJson.nodes[scene.nodes[i]];
      }
    }
  }
  /**
   * Establishes object references for nodes including hierarchy, meshes, skins, cameras, and lights.
   * This method creates the complete node dependency graph.
   *
   * @param gltfJson - The glTF JSON object containing nodes
   * @private
   */
  _loadDependenciesOfNodes(gltfJson) {
    for (const node of gltfJson.nodes) {
      if (node.children) {
        if (Is.not.exist(node.childrenObjects)) {
          node.childrenObjects = [];
        }
        for (const i in node.children) {
          node.childrenObjects[i] = gltfJson.nodes[node.children[i]];
        }
      }
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshObject = gltfJson.meshes[node.mesh];
      }
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinObject = gltfJson.skins[node.skin];
        if (node.meshObject.extras === void 0) {
          node.meshObject.extras = {};
        }
        node.meshObject.extras._skin = node.skin;
      }
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraObject = gltfJson.cameras[node.camera];
      }
      if (node.extensions !== void 0 && gltfJson.extensions !== void 0 && gltfJson.extensions.KHR_lights_punctual !== void 0) {
        node.extensions.KHR_lights_punctual.lightIndex = node.extensions.KHR_lights_punctual.light;
        node.extensions.KHR_lights_punctual.light = gltfJson.extensions.KHR_lights_punctual.lights[node.extensions.KHR_lights_punctual.lightIndex];
      }
    }
  }
  /**
   * Establishes object references for meshes and their primitives.
   * Links materials, attributes, indices, and morph targets to their respective objects.
   *
   * @param gltfJson - The glTF JSON object containing meshes
   * @private
   */
  _loadDependenciesOfMeshes(gltfJson) {
    for (const mesh of gltfJson.meshes) {
      for (const primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialObject = gltfJson.materials[primitive.material];
        }
        for (const attributeName in primitive.attributes) {
          const accessorId = primitive.attributes[attributeName];
          const accessor = gltfJson.accessors[accessorId];
          accessor.extras = {};
          primitive.attributesObjects[attributeName] = accessor;
        }
        if (primitive.indices != null) {
          primitive.indicesObject = gltfJson.accessors[primitive.indices];
        }
        if (primitive.targets != null) {
          primitive.targetsObjects = [];
          for (const target of primitive.targets) {
            const attributes = {};
            for (const attributeName in target) {
              const targetShapeTargetAccessorId = target[attributeName];
              if (targetShapeTargetAccessorId >= 0) {
                const accessor = gltfJson.accessors[targetShapeTargetAccessorId];
                accessor.extras = {};
                attributes[attributeName] = accessor;
              }
            }
            primitive.targetsObjects.push(attributes);
          }
        }
      }
    }
  }
  /**
   * Checks if Rhodonite-specific glTF loader options exist in the asset extras.
   *
   * @param gltfModel - The glTF model to check
   * @returns True if Rhodonite loader options exist, false otherwise
   * @private
   */
  _checkRnGltfLoaderOptionsExist(gltfModel) {
    var _a;
    if ((_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) {
      return true;
    }
    return false;
  }
  /**
   * Establishes object references for materials and their textures.
   * Links PBR textures, normal maps, occlusion maps, and emissive textures.
   * Also handles extension-specific texture processing.
   *
   * @param gltfJson - The glTF JSON object containing materials
   * @private
   */
  _loadDependenciesOfMaterials(gltfJson) {
    if (!gltfJson.textures) gltfJson.textures = [];
    if (gltfJson.materials) {
      for (const material of gltfJson.materials) {
        if (material.pbrMetallicRoughness) {
          const baseColorTexture = material.pbrMetallicRoughness.baseColorTexture;
          if (baseColorTexture !== void 0) {
            baseColorTexture.texture = gltfJson.textures[baseColorTexture.index];
          }
          const metallicRoughnessTexture = material.pbrMetallicRoughness.metallicRoughnessTexture;
          if (metallicRoughnessTexture !== void 0) {
            metallicRoughnessTexture.texture = gltfJson.textures[metallicRoughnessTexture.index];
          }
        }
        const normalTexture = material.normalTexture;
        if (normalTexture !== void 0) {
          normalTexture.texture = gltfJson.textures[normalTexture.index];
        }
        const occlusionTexture = material.occlusionTexture;
        if (occlusionTexture !== void 0) {
          occlusionTexture.texture = gltfJson.textures[occlusionTexture.index];
        }
        const emissiveTexture = material.emissiveTexture;
        if (emissiveTexture !== void 0) {
          emissiveTexture.texture = gltfJson.textures[emissiveTexture.index];
        }
        const loaderExtension = this._checkRnGltfLoaderOptionsExist(gltfJson) ? gltfJson.asset.extras.rnLoaderOptions.loaderExtension : void 0;
        if (loaderExtension == null ? void 0 : loaderExtension.setTextures) {
          loaderExtension.setTextures(gltfJson, material);
        }
      }
    }
  }
  /**
   * Establishes object references for textures, linking samplers and image sources.
   *
   * @param gltfJson - The glTF JSON object containing textures
   * @private
   */
  _loadDependenciesOfTextures(gltfJson) {
    if (gltfJson.textures) {
      for (const texture of gltfJson.textures) {
        ifDefinedThen((v) => {
          texture.samplerObject = gltfJson.samplers[v];
        }, texture.sampler);
        if (texture.source !== void 0) {
          texture.sourceObject = gltfJson.images[texture.source];
        }
      }
    }
  }
  /**
   * Establishes object references for skeletal animation joints and skins.
   * Links skeleton nodes, inverse bind matrices, and joint hierarchies.
   *
   * @param gltfJson - The glTF JSON object containing skins
   * @private
   */
  _loadDependenciesOfJoints(gltfJson) {
    if (gltfJson.skins) {
      for (const skin of gltfJson.skins) {
        if (Is.exist(skin.skeleton)) {
          skin.skeletonObject = gltfJson.nodes[skin.skeleton];
          ifDefinedThen((v) => {
            skin.inverseBindMatricesObject = gltfJson.accessors[v];
          }, skin.inverseBindMatrices);
          ifUndefinedThen(() => {
            skin.skeletonObject = gltfJson.nodes[skin.joints[0]];
          }, skin.skeleton);
          skin.jointsObjects = [];
          for (const jointIndex of skin.joints) {
            skin.jointsObjects.push(gltfJson.nodes[jointIndex]);
          }
        }
      }
    }
  }
  /**
   * Establishes object references for animations, channels, and samplers.
   * Links animation data with target nodes and handles special cases for rotations and weights.
   *
   * @param gltfJson - The glTF JSON object containing animations
   * @private
   */
  _loadDependenciesOfAnimations(gltfJson) {
    if (gltfJson.animations) {
      for (const animation of gltfJson.animations) {
        for (const channel of animation.channels) {
          channel.samplerObject = animation.samplers[channel.sampler];
          channel.target.nodeObject = gltfJson.nodes[channel.target.node];
        }
        for (const channel of animation.channels) {
          if (Is.exist(channel.samplerObject)) {
            channel.samplerObject.inputObject = gltfJson.accessors[channel.samplerObject.input];
            channel.samplerObject.outputObject = gltfJson.accessors[channel.samplerObject.output];
            if (channel.samplerObject.outputObject.extras === void 0) {
              channel.samplerObject.outputObject.extras = {};
            }
            if (channel.target.path === "rotation") {
              channel.samplerObject.outputObject.extras.quaternionIfVec4 = true;
            }
            if (channel.target.path === "weights") {
              const weightsArrayLength = channel.samplerObject.outputObject.count / channel.samplerObject.inputObject.count;
              channel.samplerObject.outputObject.extras.weightsArrayLength = weightsArrayLength;
            }
          }
        }
      }
    }
  }
  /**
   * Establishes object references for accessors and their buffer views.
   * Also handles sparse accessor data if present.
   *
   * @param gltfJson - The glTF JSON object containing accessors
   * @private
   */
  _loadDependenciesOfAccessors(gltfJson) {
    for (const accessor of gltfJson.accessors) {
      if (accessor.bufferView == null) {
        accessor.bufferView = 0;
      }
      accessor.bufferViewObject = gltfJson.bufferViews[accessor.bufferView];
      if (accessor.sparse != null) {
        const sparse = accessor.sparse;
        sparse.indices.bufferViewObject = gltfJson.bufferViews[sparse.indices.bufferView];
        sparse.values.bufferViewObject = gltfJson.bufferViews[sparse.values.bufferView];
      }
    }
  }
  /**
   * Establishes object references between buffer views and their underlying buffers.
   *
   * @param gltfJson - The glTF JSON object containing buffer views
   * @private
   */
  _loadDependenciesOfBufferViews(gltfJson) {
    for (const bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferObject = gltfJson.buffers[bufferView.buffer];
      }
    }
  }
  /**
   * Merges extended JSON data into the main glTF JSON object.
   * Supports ArrayBuffer, string, or object formats for extended data.
   *
   * @param gltfJson - The main glTF JSON object to merge into
   * @param extendedData - Additional data to merge (ArrayBuffer, string, or object)
   * @private
   */
  _mergeExtendedJson(gltfJson, extendedData) {
    let extendedJson = null;
    if (extendedData instanceof ArrayBuffer) {
      const extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
      extendedJson = JSON.parse(extendedJsonStr);
    } else if (typeof extendedData === "string") {
      extendedJson = JSON.parse(extendedData);
    } else if (typeof extendedData === "object") {
      extendedJson = extendedData;
    }
    Object.assign(gltfJson, extendedJson);
  }
  /**
   * Loads external resources (buffers and images) referenced by the glTF JSON.
   * Handles various URI formats including data URIs, file references, and embedded binary data.
   *
   * @param uint8Array - Binary data for embedded resources
   * @param basePath - Base path for resolving relative URIs
   * @param gltfJson - The glTF JSON object containing resource references
   * @param options - Loading options including file collections
   * @param resources - Object to store loaded resources
   * @returns A Promise that resolves when all resources are loaded
   * @private
   */
  _loadResources(uint8Array, basePath, gltfJson, options, resources) {
    var _a, _b;
    const promisesToLoadResources = [];
    let rnpArrayBuffer;
    for (const i in gltfJson.buffers) {
      const bufferInfo = gltfJson.buffers[i];
      let splitted;
      let filename;
      if (bufferInfo.uri) {
        splitted = bufferInfo.uri.split("/");
        filename = splitted[splitted.length - 1];
      }
      if (typeof bufferInfo.uri === "undefined") {
        rnpArrayBuffer = new RnPromise((resolve) => {
          resources.buffers[i] = uint8Array;
          bufferInfo.buffer = uint8Array;
          resolve(uint8Array.buffer);
        });
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise((resolve) => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(bufferInfo.uri);
          resources.buffers[i] = new Uint8Array(arrayBuffer);
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if ((_a = options.files) == null ? void 0 : _a[filename]) {
        rnpArrayBuffer = new RnPromise((resolve) => {
          const arrayBuffer = options.files[filename];
          resources.buffers[i] = new Uint8Array(arrayBuffer);
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else {
        rnpArrayBuffer = new RnPromise(
          DataUtil.loadResourceAsync(
            basePath + bufferInfo.uri,
            true,
            (resolve, response) => {
              resources.buffers[i] = new Uint8Array(response);
              bufferInfo.buffer = new Uint8Array(response);
              resolve(response);
            },
            (_reject, _error) => {
            }
          )
        );
      }
      bufferInfo.bufferPromise = rnpArrayBuffer;
      promisesToLoadResources.push(rnpArrayBuffer);
    }
    for (const _i in gltfJson.images) {
      const i = _i;
      const imageJson = gltfJson.images[i];
      let imageUri;
      if (typeof imageJson.uri === "undefined") {
        const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
          gltfJson,
          imageJson.bufferView,
          uint8Array
        );
        imageUri = DataUtil.createBlobImageUriFromUint8Array(imageUint8Array, imageJson.mimeType);
      } else {
        const imageFileStr = imageJson.uri;
        const splitted = imageFileStr.split("/");
        const filename = splitted[splitted.length - 1];
        if ((_b = options.files) == null ? void 0 : _b[filename]) {
          const arrayBuffer = options.files[filename];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(new Uint8Array(arrayBuffer), imageJson.mimeType);
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }
      }
      const promise = DataUtil.createImageFromUri(imageUri, imageJson.mimeType).then((image) => {
        image.crossOrigin = "Anonymous";
        resources.images[i] = image;
        imageJson.image = image;
      });
      promisesToLoadResources.push(promise);
    }
    return Promise.all(promisesToLoadResources).catch((err) => {
      Logger.default.error(`Promise.all error: ${err}`);
    });
  }
  /**
   * Gets the singleton instance of the DrcPointCloudImporter.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton instance of DrcPointCloudImporter
   */
  static getInstance() {
    if (!this.dj) {
      this.dj = new _DrcPointCloudImporter();
    }
    return this.dj;
  }
  /**
   * Decodes a Draco compressed file and converts it to glTF2 format.
   * This is the main entry point for Draco decoding operations.
   *
   * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
   * @param defaultOptions - Default loading options
   * @param basePath - Base path for resolving relative URIs
   * @param options - Additional loading options
   * @returns A Promise that resolves to the glTF2 JSON object
   * @private
   */
  yp(arrayBuffer, defaultOptions, basePath, options) {
    return this.Ap(arrayBuffer).then((json) => {
      const gotText = JSON.stringify(json);
      const gltfJson = JSON.parse(gotText);
      return this._loadAsTextJson(gltfJson, options, defaultOptions, basePath).catch((err) => {
        Logger.default.error(`this.__loadAsTextJson error: ${err}`);
      });
    });
  }
  /**
   * Decodes a Draco compressed buffer and extracts geometry data.
   * Handles both point cloud and mesh geometry types, but only supports point clouds.
   *
   * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
   * @returns A Promise that resolves to the decoded geometry data as JSON
   * @private
   */
  Ap(arrayBuffer) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.zp(draco, decoder, arrayBuffer);
    if (dracoGeometry == null) {
      throw new Error("invalid dracoGeometry.");
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error("invalid geometryType of drc file.");
    }
    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error("Draco: No position attribute found.");
    }
    const attributeNames = ["POSITION", "NORMAL", "COLOR", "TEX_COORD", "GENERIC"];
    const numPoints = dracoGeometry.num_points();
    const attributeDataAll = [];
    const attributeComponents = [];
    let bufferLength = 0;
    for (let i = 0; i < attributeNames.length; i++) {
      const attId = decoder.GetAttributeId(dracoGeometry, draco[attributeNames[i]]);
      if (attId === -1) {
        attributeNames.splice(i, 1);
        i--;
        continue;
      }
      const attribute = decoder.GetAttribute(dracoGeometry, attId);
      const attributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(dracoGeometry, attribute, attributeData);
      attributeDataAll[i] = attributeData;
      const numComponent = attribute.num_components();
      attributeComponents[i] = numComponent;
      if (attributeNames[i] === "COLOR") {
        bufferLength += numPoints * 4;
      } else {
        bufferLength += numPoints * numComponent;
      }
    }
    const buffer = new Float32Array(bufferLength);
    for (let i = 0, currentBufferIndex = 0; i < attributeNames.length; i++) {
      if (attributeNames[i] === "COLOR" && attributeComponents[i] === 3) {
        for (let j = 0; j < numPoints; currentBufferIndex += 4, j += 3) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(j);
          buffer[currentBufferIndex + 1] = attributeDataAll[i].GetValue(j + 1);
          buffer[currentBufferIndex + 2] = attributeDataAll[i].GetValue(j + 2);
          buffer[currentBufferIndex + 3] = 1;
        }
      } else if (attributeNames[i] === "TEX_COORD") {
        for (let j = 0; j < numPoints; currentBufferIndex += 2, j++) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(2 * j);
          buffer[currentBufferIndex + 1] = 1 - attributeDataAll[i].GetValue(2 * j + 1);
        }
      } else {
        for (let j = 0; j < numPoints * attributeComponents[i]; currentBufferIndex++, j++) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(j);
        }
      }
      draco.destroy(attributeDataAll[i]);
    }
    draco.destroy(decoder);
    draco.destroy(dracoGeometry);
    return this.Bp(buffer, numPoints, attributeNames, attributeComponents);
  }
  /**
   * Converts decoded Draco buffer data to glTF2 JSON format.
   * Creates a complete glTF2 structure with nodes, scenes, materials, and geometry data.
   *
   * @param buffer - The decoded Float32Array containing vertex data
   * @param numPoints - Number of points in the point cloud
   * @param attributeNames - Array of attribute names (POSITION, COLOR, etc.)
   * @param attributeComponents - Array of component counts for each attribute
   * @returns A Promise that resolves to the glTF2 JSON object
   * @private
   */
  async Bp(buffer, numPoints, attributeNames, attributeComponents) {
    const json = {
      asset: {
        version: "2.0"
      },
      extensionsUsed: ["KHR_materials_unlit"],
      extensionsRequired: ["KHR_materials_unlit"],
      nodes: [
        {
          name: "Node",
          mesh: 0
        }
      ],
      scenes: [
        {
          nodes: [0]
        }
      ],
      materials: [
        {
          name: "point-cloud_material",
          pbrMetallicRoughness: {
            baseColorFactor: [1, 1, 1, 1]
          },
          extensions: {
            KHR_materials_unlit: {}
          }
        }
      ]
    };
    await this.Cp(buffer.buffer, json);
    this.Dp(numPoints, attributeNames, attributeComponents, json);
    this.Ep(attributeNames, json);
    return new Promise((resolve, _reject) => {
      resolve(json);
    });
  }
  /**
   * Sets buffer data in the glTF JSON by converting the Float32Array to a data URI.
   *
   * @param buffer - The Float32Array containing vertex data
   * @param json - The glTF JSON object to modify
   * @returns A Promise that resolves when the buffer is set
   * @private
   */
  Cp(buffer, json) {
    return this.Fp(buffer).then((uri) => {
      json.buffers = [
        {
          name: "input",
          byteLength: buffer.byteLength,
          uri
        }
      ];
    }).catch((err) => {
      Logger.default.error(`this.__convertBufferToURI error: ${err}`);
    });
  }
  /**
   * Converts an ArrayBuffer to a data URI for embedding in glTF JSON.
   *
   * @param arrayBuffer - The ArrayBuffer to convert
   * @returns A Promise that resolves to the data URI string
   * @private
   */
  Fp(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = () => {
        reject(fr.error);
      };
      fr.readAsDataURL(blob);
    });
  }
  /**
   * Creates accessor and buffer view definitions for the glTF JSON.
   * Defines how to interpret the binary data for each vertex attribute.
   *
   * @param numPoints - Number of points in the point cloud
   * @param attributeNames - Array of attribute names
   * @param attributeComponents - Array of component counts for each attribute
   * @param json - The glTF JSON object to modify
   * @private
   */
  Dp(numPoints, attributeNames, attributeComponents, json) {
    const accessors = [];
    const bufferViews = [];
    let byteOffsetOfBufferView = 0;
    for (let i = 0, indexOfBufferView = 0; i < attributeNames.length; indexOfBufferView++) {
      const numOfComponents = attributeComponents[i];
      let type;
      if (numOfComponents === 1) {
        type = "SCALAR";
      } else {
        type = `VEC${numOfComponents}`;
      }
      let byteOffsetOfAccessor = 0;
      const attributeName = attributeNames[i];
      while (i < attributeNames.length) {
        accessors.push({
          name: `point-cloud_${attributeName}_${i}`,
          componentType: 5126,
          // gl.FLOAT
          count: numPoints,
          type,
          bufferView: indexOfBufferView,
          byteOffset: byteOffsetOfAccessor
        });
        if (attributeNames[i] === "COLOR") {
          byteOffsetOfAccessor += numPoints * 4 * 4;
        } else {
          byteOffsetOfAccessor += numPoints * numOfComponents * 4;
        }
        i++;
        if (attributeName !== attributeNames[i]) {
          break;
        }
      }
      bufferViews[indexOfBufferView] = {
        name: `bufferView_${attributeName}`,
        buffer: 0,
        byteLength: byteOffsetOfAccessor,
        byteOffset: byteOffsetOfBufferView,
        byteStride: numOfComponents * 4,
        target: 34962
        // gl.ARRAY_BUFFER
      };
      byteOffsetOfBufferView += byteOffsetOfAccessor;
    }
    json.accessors = accessors;
    json.bufferViews = bufferViews;
  }
  /**
   * Creates mesh definitions for the glTF JSON with point cloud primitives.
   * Maps Draco attribute names to glTF attribute semantics.
   *
   * @param attributeNames - Array of attribute names from Draco
   * @param json - The glTF JSON object to modify
   * @private
   */
  Ep(attributeNames, json) {
    const attributes = {};
    for (let i = 0; i < attributeNames.length; i++) {
      if (attributeNames[i] === "TEX_COORD") {
        attributes.TEXCOORD_0 = i;
      } else if (attributeNames[i] === "GENERIC") {
        attributes.TANGENT = i;
      } else {
        attributes[attributeNames[i]] = i;
      }
    }
    const mesh = {
      name: "Node-Mesh",
      primitives: [
        {
          mode: 0,
          material: 0,
          attributes
        }
      ]
    };
    json.meshes = [mesh];
  }
  /**
   * Imports a Draco point cloud file and converts it directly to a Rhodonite Primitive.
   * This method bypasses glTF conversion for direct primitive creation.
   *
   * @param uri - The URI of the .drc file to import
   * @returns A Promise that resolves to a Rhodonite Primitive object
   *
   * @example
   * ```typescript
   * const importer = DrcPointCloudImporter.getInstance();
   * const primitive = await importer.importPointCloudToPrimitive('path/to/pointcloud.drc');
   * // Use the primitive directly in Rhodonite
   * ```
   */
  async importPointCloudToPrimitive(engine, uri) {
    const r_arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    return this.Gp(engine, r_arrayBuffer.unwrapForce());
  }
  /**
   * Decodes a Draco compressed ArrayBuffer directly to a Rhodonite Primitive.
   * This method provides the most direct path from Draco data to Rhodonite geometry.
   * Note: Tangent attributes are not currently supported.
   *
   * @param arrayBuffer - The ArrayBuffer containing Draco compressed data
   * @returns The decoded Rhodonite Primitive
   * @private
   */
  Gp(engine, arrayBuffer) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.zp(draco, decoder, arrayBuffer);
    if (dracoGeometry == null) {
      throw new Error("invalid dracoGeometry.");
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error("invalid geometryType of drc file.");
    }
    const attributeCompositionTypes = [];
    const attributeSemantics = [];
    const attributes = [];
    this.Hp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes);
    this.Ip(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes);
    this.Jp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes);
    this.Kp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes);
    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics,
      attributes,
      material: createClassicUberMaterial(engine, {
        isSkinning: false,
        isLighting: true
      }),
      primitiveMode: PrimitiveMode.Points
    });
    draco.destroy(decoder);
    draco.destroy(dracoGeometry);
    return primitive;
  }
  /**
   * Extracts and validates Draco geometry from a compressed buffer.
   * Supports both triangular mesh and point cloud geometry types.
   *
   * @param draco - The Draco decoder module instance
   * @param decoder - The Draco decoder instance
   * @param arrayBuffer - The ArrayBuffer containing compressed geometry
   * @returns The decoded Draco geometry object, or undefined if decoding fails
   * @private
   */
  zp(draco, decoder, arrayBuffer) {
    const buffer = new draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);
    const geometryType = decoder.GetEncodedGeometryType(buffer);
    let dracoGeometry;
    let decodingStatus;
    if (geometryType === draco.TRIANGULAR_MESH) {
      dracoGeometry = new draco.Mesh();
      decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    } else if (geometryType === draco.POINT_CLOUD) {
      dracoGeometry = new draco.PointCloud();
      decodingStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
    } else {
      const errorMsg = "Unknown geometry type.";
      Logger.default.error(errorMsg);
    }
    dracoGeometry.geometryType = geometryType;
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
      let errorMsg = "Decoding failed: ";
      errorMsg += decodingStatus.error_msg();
      Logger.default.error(errorMsg);
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      return void 0;
    }
    draco.destroy(buffer);
    return dracoGeometry;
  }
  /**
   * Extracts position attribute data from Draco geometry.
   * Position data is required for all point clouds.
   *
   * @param draco - The Draco decoder module instance
   * @param decoder - The Draco decoder instance
   * @param dracoGeometry - The decoded Draco geometry
   * @param attributeCompositionTypes - Array to store composition types
   * @param attributeSemantics - Array to store attribute semantics
   * @param attributes - Array to store attribute data
   * @returns The extracted position data as Float32Array
   * @private
   */
  Hp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes) {
    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error("Draco: No position attribute found.");
    }
    const posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);
    const posAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(dracoGeometry, posAttribute, posAttributeData);
    const numPoints = dracoGeometry.num_points();
    const numVertices = numPoints * 3;
    const positions = new Float32Array(numVertices);
    for (let i = 0; i < numVertices; i += 1) {
      positions[i] = posAttributeData.GetValue(i);
    }
    attributeCompositionTypes.push(CompositionType.Vec3);
    attributeSemantics.push(VertexAttribute.Position.XYZ);
    attributes.push(positions);
    draco.destroy(posAttributeData);
    return positions;
  }
  /**
   * Extracts color attribute data from Draco geometry if present.
   * Handles both RGB and RGBA color formats, ensuring RGBA output.
   *
   * @param draco - The Draco decoder module instance
   * @param decoder - The Draco decoder instance
   * @param dracoGeometry - The decoded Draco geometry
   * @param attributeCompositionTypes - Array to store composition types
   * @param attributeSemantics - Array to store attribute semantics
   * @param attributes - Array to store attribute data
   * @returns The extracted color data as Float32Array, or null if not present
   * @private
   */
  Ip(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes) {
    const colorAttId = decoder.GetAttributeId(dracoGeometry, draco.COLOR);
    if (colorAttId === -1) {
      return null;
    }
    const colAttribute = decoder.GetAttribute(dracoGeometry, colorAttId);
    const colAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(dracoGeometry, colAttribute, colAttributeData);
    const numPoints = dracoGeometry.num_points();
    const numComponents = colAttribute.num_components();
    const numVertices = numPoints * 4;
    const colors = new Float32Array(numVertices);
    for (let i = 0; i < numVertices; i += numComponents) {
      colors[i] = colAttributeData.GetValue(i);
      colors[i + 1] = colAttributeData.GetValue(i + 1);
      colors[i + 2] = colAttributeData.GetValue(i + 2);
      if (numComponents === 4) {
        colors[i + 3] = colAttributeData.GetValue(i + 3);
      } else {
        colors[i + 3] = 1;
      }
    }
    attributeCompositionTypes.push(CompositionType.Vec3);
    attributeSemantics.push(VertexAttribute.Color0.XYZ);
    attributes.push(colors);
    draco.destroy(colAttributeData);
    return colors;
  }
  /**
   * Extracts normal attribute data from Draco geometry if present.
   * Normal vectors are used for lighting calculations.
   *
   * @param draco - The Draco decoder module instance
   * @param decoder - The Draco decoder instance
   * @param dracoGeometry - The decoded Draco geometry
   * @param attributeCompositionTypes - Array to store composition types
   * @param attributeSemantics - Array to store attribute semantics
   * @param attributes - Array to store attribute data
   * @returns The extracted normal data as Float32Array, or null if not present
   * @private
   */
  Jp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes) {
    const normalAttId = decoder.GetAttributeId(dracoGeometry, draco.NORMAL);
    if (normalAttId === -1) {
      return null;
    }
    const norAttribute = decoder.GetAttribute(dracoGeometry, normalAttId);
    const norAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(dracoGeometry, norAttribute, norAttributeData);
    const numPoints = dracoGeometry.num_points();
    const numVertices = numPoints * 3;
    const normals = new Float32Array(numVertices);
    for (let i = 0; i < numVertices; i += 1) {
      normals[i] = norAttributeData.GetValue(i);
    }
    attributeCompositionTypes.push(CompositionType.Vec3);
    attributeSemantics.push(VertexAttribute.Normal.XYZ);
    attributes.push(normals);
    draco.destroy(norAttributeData);
    return normals;
  }
  /**
   * Extracts texture coordinate attribute data from Draco geometry if present.
   * Texture coordinates are used for mapping textures onto geometry.
   *
   * @param draco - The Draco decoder module instance
   * @param decoder - The Draco decoder instance
   * @param dracoGeometry - The decoded Draco geometry
   * @param attributeCompositionTypes - Array to store composition types
   * @param attributeSemantics - Array to store attribute semantics
   * @param attributes - Array to store attribute data
   * @returns The extracted texture coordinate data as Float32Array, or null if not present
   * @private
   */
  Kp(draco, decoder, dracoGeometry, attributeCompositionTypes, attributeSemantics, attributes) {
    const texCoordAttId = decoder.GetAttributeId(dracoGeometry, draco.TEX_COORD);
    if (texCoordAttId === -1) {
      return null;
    }
    const texCoordAttribute = decoder.GetAttribute(dracoGeometry, texCoordAttId);
    const texCoordAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(dracoGeometry, texCoordAttribute, texCoordAttributeData);
    const numPoints = dracoGeometry.num_points();
    const numVertices = numPoints * 2;
    const texCoords = new Float32Array(numVertices);
    for (let i = 0; i < numVertices; i += 1) {
      texCoords[i] = texCoordAttributeData.GetValue(i);
    }
    attributeCompositionTypes.push(CompositionType.Vec2);
    attributeSemantics.push(VertexAttribute.Texcoord0.XY);
    attributes.push(texCoords);
    draco.destroy(texCoordAttributeData);
    return texCoords;
  }
};
export {
  DrcPointCloudImporter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvRHJjUG9pbnRDbG91ZEltcG9ydGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEdsdGZMb2FkT3B0aW9uIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSbk0yLCBSbk0yQWNjZXNzb3IsIFJuTTJJbWFnZSB9IGZyb20gJy4uLy4uL3R5cGVzL1JuTTInO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlLCB0eXBlIENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlLCB0eXBlIFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZyB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCB9IGZyb20gJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwnO1xuaW1wb3J0IHsgRGF0YVV0aWwgfSBmcm9tICcuLi9taXNjL0RhdGFVdGlsJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgeyBpZkRlZmluZWRUaGVuLCBpZlVuZGVmaW5lZFRoZW4gfSBmcm9tICcuLi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB7IEVyciwgT2ssIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vbWlzYy9SZXN1bHQnO1xuaW1wb3J0IHsgUm5Qcm9taXNlIH0gZnJvbSAnLi4vbWlzYy9SblByb21pc2UnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcblxuZGVjbGFyZSBsZXQgRHJhY29EZWNvZGVyTW9kdWxlOiBhbnk7XG5kZWNsYXJlIGxldCBSbjogYW55O1xuXG4vKipcbiAqIFRoZSBEcmFjbyBQb2ludCBDbG91ZCBJbXBvcnRlciBjbGFzcyBmb3IgaW1wb3J0aW5nIGFuZCBkZWNvZGluZyBEcmFjbyBjb21wcmVzc2VkIHBvaW50IGNsb3VkIGZpbGVzLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIGltcG9ydCBEcmFjbyBmaWxlcyBhbmQgY29udmVydCB0aGVtIHRvIGdsVEYyIGZvcm1hdCBvciBSaG9kb25pdGUgcHJpbWl0aXZlcy5cbiAqIEN1cnJlbnRseSBzdXBwb3J0cyBwb2ludCBjbG91ZCBnZW9tZXRyeSBvbmx5IC0gbWVzaCB0eXBlcywgV0VJR0hUU18wLCBhbmQgSk9JTlRTXzAgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERyY1BvaW50Q2xvdWRJbXBvcnRlciB7XG4gIHByaXZhdGUgc3RhdGljIF9faW5zdGFuY2U6IERyY1BvaW50Q2xvdWRJbXBvcnRlcjtcblxuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3RvciB0byBlbmZvcmNlIHNpbmdsZXRvbiBwYXR0ZXJuLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgLyoqXG4gICAqIEltcG9ydHMgYSBEcmFjbyBwb2ludCBjbG91ZCBmaWxlIGZyb20gYSBVUkkgYW5kIGNvbnZlcnRzIGl0IHRvIGdsVEYyIGZvcm1hdC5cbiAgICogVGhpcyBtZXRob2Qgc3VwcG9ydHMgYm90aCBkaXJlY3QgZmlsZSBVUklzIGFuZCBmaWxlIGNvbGxlY3Rpb25zIHBhc3NlZCB0aHJvdWdoIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJJIG9mIHRoZSAuZHJjIGZpbGUgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgbG9hZGluZyBjb25maWd1cmF0aW9uIGluY2x1ZGluZyBmaWxlIGNvbGxlY3Rpb25zIGFuZCBwcm9jZXNzaW5nIG9wdGlvbnNcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBSZXN1bHQgY29udGFpbmluZyB0aGUgZ2xURjIgSlNPTiBvciBhbiBlcnJvclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGltcG9ydGVyID0gRHJjUG9pbnRDbG91ZEltcG9ydGVyLmdldEluc3RhbmNlKCk7XG4gICAqIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGltcG9ydGVyLmltcG9ydFBvaW50Q2xvdWQoJ3BhdGgvdG8vcG9pbnRjbG91ZC5kcmMnKTtcbiAgICogaWYgKHJlc3VsdC5pc09rKCkpIHtcbiAgICogICBjb25zdCBnbHRmSnNvbiA9IHJlc3VsdC5nZXQoKTtcbiAgICogICAvLyBQcm9jZXNzIHRoZSBnbFRGIEpTT05cbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGltcG9ydFBvaW50Q2xvdWQodXJpOiBzdHJpbmcsIG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvbik6IFByb21pc2U8UmVzdWx0PFJuTTIsIEVycjxBcnJheUJ1ZmZlciwgdW5rbm93bj4+PiB7XG4gICAgY29uc3QgYmFzZVBhdGggPSBgJHt1cmkuc3Vic3RyaW5nKDAsIHVyaS5sYXN0SW5kZXhPZignLycpKX0vYDsgLy8gbG9jYXRpb24gb2YgbW9kZWwgZmlsZSBhcyBiYXNlUGF0aFxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0gRGF0YVV0aWwuY3JlYXRlRGVmYXVsdEdsdGZPcHRpb25zKCk7XG5cbiAgICBpZiAob3B0aW9ucz8uZmlsZXMpIHtcbiAgICAgIGZvciAoY29uc3QgZmlsZU5hbWUgaW4gb3B0aW9ucy5maWxlcykge1xuICAgICAgICBjb25zdCBmaWxlRXh0ZW5zaW9uID0gRGF0YVV0aWwuZ2V0RXh0ZW5zaW9uKGZpbGVOYW1lKTtcblxuICAgICAgICBpZiAoZmlsZUV4dGVuc2lvbiA9PT0gJ2RyYycpIHtcbiAgICAgICAgICBjb25zdCBybm0yID0gYXdhaXQgdGhpcy5fX2RlY29kZURyYWNvKChvcHRpb25zLmZpbGVzIGFzIGFueSlbZmlsZU5hbWVdLCBkZWZhdWx0T3B0aW9ucywgYmFzZVBhdGgsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBPayhybm0yISk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByX2FycmF5QnVmZmVyID0gYXdhaXQgRGF0YVV0aWwuZmV0Y2hBcnJheUJ1ZmZlcih1cmkpO1xuICAgIGlmIChyX2FycmF5QnVmZmVyLmlzRXJyKCkpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgbWVzc2FnZTogJ2ZldGNoQXJyYXlCdWZmZXIgZmFpbGVkJyxcbiAgICAgICAgZXJyb3I6IHJfYXJyYXlCdWZmZXIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBybm0yID0gYXdhaXQgdGhpcy5fX2RlY29kZURyYWNvKHJfYXJyYXlCdWZmZXIuZ2V0KCksIGRlZmF1bHRPcHRpb25zLCBiYXNlUGF0aCwgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gbmV3IE9rKHJubTIhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnRzIGEgRHJhY28gcG9pbnQgY2xvdWQgZnJvbSBhbiBBcnJheUJ1ZmZlciBhbmQgY29udmVydHMgaXQgdG8gZ2xURjIgZm9ybWF0LlxuICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VmdWwgd2hlbiB5b3UgYWxyZWFkeSBoYXZlIHRoZSBmaWxlIGRhdGEgaW4gbWVtb3J5LlxuICAgKlxuICAgKiBAcGFyYW0gdXJpIC0gVGhlIG9yaWdpbmFsIFVSSSBvZiB0aGUgZmlsZSAodXNlZCBmb3IgYmFzZSBwYXRoIGNhbGN1bGF0aW9uKVxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgY29udGFpbmluZyB0aGUgRHJhY28gZmlsZSBkYXRhXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgbG9hZGluZyBjb25maWd1cmF0aW9uXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBnbFRGMiBKU09OIG9yIHJlamVjdHMgd2l0aCBhbiBlcnJvclxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGltcG9ydGVyID0gRHJjUG9pbnRDbG91ZEltcG9ydGVyLmdldEluc3RhbmNlKCk7XG4gICAqIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGZldGNoKCdwb2ludGNsb3VkLmRyYycpLnRoZW4ociA9PiByLmFycmF5QnVmZmVyKCkpO1xuICAgKiBjb25zdCBnbHRmSnNvbiA9IGF3YWl0IGltcG9ydGVyLmltcG9ydEFycmF5QnVmZmVyKCdwb2ludGNsb3VkLmRyYycsIGJ1ZmZlcik7XG4gICAqIGBgYFxuICAgKi9cbiAgaW1wb3J0QXJyYXlCdWZmZXIodXJpOiBzdHJpbmcsIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciwgb3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uKSB7XG4gICAgY29uc3QgYmFzZVBhdGggPSBgJHt1cmkuc3Vic3RyaW5nKDAsIHVyaS5sYXN0SW5kZXhPZignLycpKX0vYDsgLy8gbG9jYXRpb24gb2YgbW9kZWwgZmlsZSBhcyBiYXNlUGF0aFxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0gRGF0YVV0aWwuY3JlYXRlRGVmYXVsdEdsdGZPcHRpb25zKCk7XG4gICAgcmV0dXJuIHRoaXMuX19kZWNvZGVEcmFjbyhhcnJheUJ1ZmZlciwgZGVmYXVsdE9wdGlvbnMsIGJhc2VQYXRoLCBvcHRpb25zKS5jYXRjaChlcnIgPT4ge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYF9fbG9hZEZyb21BcnJheUJ1ZmZlciBlcnJvcjogJHtlcnJ9YCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIGxvYWQgYW5kIHByb2Nlc3MgQXJyYXlCdWZmZXIgZGF0YS5cbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBkYXRhIGlzIGJpbmFyeSBnbFRGIG9yIHRleHQgSlNPTiBmb3JtYXQgYW5kIHByb2Nlc3NlcyBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGZpbGUgZGF0YVxuICAgKiBAcGFyYW0gZGVmYXVsdE9wdGlvbnMgLSBEZWZhdWx0IGxvYWRpbmcgb3B0aW9uc1xuICAgKiBAcGFyYW0gYmFzZVBhdGggLSBCYXNlIHBhdGggZm9yIHJlc29sdmluZyByZWxhdGl2ZSBVUklzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQWRkaXRpb25hbCBsb2FkaW5nIG9wdGlvbnNcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHByb2Nlc3NlZCBnbFRGIEpTT05cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgX19sb2FkRnJvbUFycmF5QnVmZmVyKFxuICAgIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcixcbiAgICBkZWZhdWx0T3B0aW9uczogR2x0ZkxvYWRPcHRpb24sXG4gICAgYmFzZVBhdGg6IHN0cmluZyxcbiAgICBvcHRpb25zPzoge31cbiAgKSB7XG4gICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoYXJyYXlCdWZmZXIsIDAsIDIwKTtcbiAgICBjb25zdCBpc0xpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgLy8gTWFnaWMgZmllbGRcbiAgICBjb25zdCBtYWdpYyA9IGRhdGFWaWV3LmdldFVpbnQzMigwLCBpc0xpdHRsZUVuZGlhbik7XG4gICAgbGV0IHJlc3VsdDogYW55O1xuICAgIC8vIDB4NDY1NDZDNjcgaXMgJ2dsVEYnIGluIEFTQ0lJIGNvZGVzLlxuICAgIGlmIChtYWdpYyAhPT0gMHg0NjU0NmM2Nykge1xuICAgICAgLy9jb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgY29uc3QgZ290VGV4dCA9IERhdGFVdGlsLmFycmF5QnVmZmVyVG9TdHJpbmcoYXJyYXlCdWZmZXIpO1xuICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZ290VGV4dCk7XG4gICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9sb2FkQXNUZXh0SnNvbihqc29uLCBvcHRpb25zIGFzIEdsdGZMb2FkT3B0aW9uLCBkZWZhdWx0T3B0aW9ucywgYmFzZVBhdGgpLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGB0aGlzLl9fbG9hZEFzVGV4dEpzb24gZXJyb3I6ICR7ZXJyfWApO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuX2xvYWRBc0JpbmFyeUpzb24oXG4gICAgICAgIGRhdGFWaWV3LFxuICAgICAgICBpc0xpdHRsZUVuZGlhbixcbiAgICAgICAgYXJyYXlCdWZmZXIsXG4gICAgICAgIG9wdGlvbnMgYXMgR2x0ZkxvYWRPcHRpb24sXG4gICAgICAgIGRlZmF1bHRPcHRpb25zLFxuICAgICAgICBiYXNlUGF0aFxuICAgICAgKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgdGhpcy5fX2xvYWRBc0JpbmFyeUpzb24gZXJyb3I6ICR7ZXJyfWApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogTWVyZ2VzIGRlZmF1bHQgb3B0aW9ucyB3aXRoIEpTT04tZW1iZWRkZWQgb3B0aW9ucyBhbmQgdXNlci1wcm92aWRlZCBvcHRpb25zLlxuICAgKiBQcmlvcml0eTogdXNlciBvcHRpb25zID4gSlNPTiBlbWJlZGRlZCBvcHRpb25zID4gZGVmYXVsdCBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZGVmYXVsdE9wdGlvbnMgLSBUaGUgZGVmYXVsdCBsb2FkaW5nIG9wdGlvbnNcbiAgICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURiBKU09OIHRoYXQgbWF5IGNvbnRhaW4gZW1iZWRkZWQgb3B0aW9uc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIFVzZXItcHJvdmlkZWQgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgbWVyZ2VkIG9wdGlvbnMgb2JqZWN0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZ2V0T3B0aW9ucyhkZWZhdWx0T3B0aW9uczogYW55LCBqc29uOiBSbk0yLCBvcHRpb25zOiBhbnkpOiBHbHRmTG9hZE9wdGlvbiB7XG4gICAgaWYgKGpzb24uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgaW4ganNvbi5hc3NldC5leHRyYXMucm5Mb2FkZXJPcHRpb25zKSB7XG4gICAgICAgIGRlZmF1bHRPcHRpb25zW29wdGlvbk5hbWVdID0gKGpzb24uYXNzZXQuZXh0cmFzLnJuTG9hZGVyT3B0aW9ucyBhcyBhbnkpW29wdGlvbk5hbWVdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgb3B0aW9uTmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICBkZWZhdWx0T3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvbnNbb3B0aW9uTmFtZV07XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnM/LmxvYWRlckV4dGVuc2lvbk5hbWUgJiYgdHlwZW9mIG9wdGlvbnMubG9hZGVyRXh0ZW5zaW9uTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChSbltvcHRpb25zLmxvYWRlckV4dGVuc2lvbk5hbWVdICE9IG51bGwpIHtcbiAgICAgICAgZGVmYXVsdE9wdGlvbnMubG9hZGVyRXh0ZW5zaW9uID0gUm5bb3B0aW9ucy5sb2FkZXJFeHRlbnNpb25OYW1lXS5nZXRJbnN0YW5jZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYCR7b3B0aW9ucy5sb2FkZXJFeHRlbnNpb25OYW1lfSBub3QgZm91bmQhYCk7XG4gICAgICAgIGRlZmF1bHRPcHRpb25zLmxvYWRlckV4dGVuc2lvbiA9IHZvaWQgMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmYXVsdE9wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIGJpbmFyeSBnbFRGIGRhdGEgYnkgZXh0cmFjdGluZyBKU09OIGNodW5rIGFuZCBiaW5hcnkgZGF0YS5cbiAgICogVmFsaWRhdGVzIHRoZSBnbFRGIGJpbmFyeSBmb3JtYXQgYW5kIGRlbGVnYXRlcyB0byBhcHByb3ByaWF0ZSBsb2FkaW5nIG1ldGhvZHMuXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhVmlldyAtIERhdGFWaWV3IGZvciByZWFkaW5nIGJpbmFyeSBkYXRhXG4gICAqIEBwYXJhbSBpc0xpdHRsZUVuZGlhbiAtIFdoZXRoZXIgdGhlIGRhdGEgaXMgaW4gbGl0dGxlLWVuZGlhbiBmb3JtYXRcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIGNvbXBsZXRlIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGdsVEYgZGF0YVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRpbmcgb3B0aW9uc1xuICAgKiBAcGFyYW0gZGVmYXVsdE9wdGlvbnMgLSBEZWZhdWx0IGxvYWRpbmcgb3B0aW9uc1xuICAgKiBAcGFyYW0gYmFzZVBhdGggLSBCYXNlIHBhdGggZm9yIHJlc29sdmluZyByZWxhdGl2ZSBVUklzXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBwcm9jZXNzZWQgZ2xURiBKU09OXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhc3luYyBfbG9hZEFzQmluYXJ5SnNvbihcbiAgICBkYXRhVmlldzogRGF0YVZpZXcsXG4gICAgaXNMaXR0bGVFbmRpYW46IGJvb2xlYW4sXG4gICAgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyLFxuICAgIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uLFxuICAgIGRlZmF1bHRPcHRpb25zOiBHbHRmTG9hZE9wdGlvbixcbiAgICBiYXNlUGF0aDogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IGxlbmd0aE9mSlNvbkNodW5rRGF0YSA9IGRhdGFWaWV3LmdldFVpbnQzMigxMiwgaXNMaXR0bGVFbmRpYW4pO1xuICAgIGNvbnN0IGNodW5rVHlwZSA9IGRhdGFWaWV3LmdldFVpbnQzMigxNiwgaXNMaXR0bGVFbmRpYW4pO1xuICAgIC8vIDB4NEU0RjUzNEEgbWVhbnMgSlNPTiBmb3JtYXQgKDB4NEU0RjUzNEEgaXMgJ0pTT04nIGluIEFTQ0lJIGNvZGVzKVxuICAgIGlmIChjaHVua1R5cGUgIT09IDB4NGU0ZjUzNGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBjaHVua1R5cGUgb2YgY2h1bmswIGluIHRoaXMgYmluYXJ5IGdsVEYgZmlsZS4nKTtcbiAgICB9XG4gICAgY29uc3QgdWludDhBcnJheUpTb25Db250ZW50ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIsIDIwLCBsZW5ndGhPZkpTb25DaHVua0RhdGEpO1xuICAgIGNvbnN0IGdvdFRleHQgPSBEYXRhVXRpbC51aW50OEFycmF5VG9TdHJpbmcodWludDhBcnJheUpTb25Db250ZW50KTtcbiAgICBjb25zdCBnbHRmSnNvbiA9IEpTT04ucGFyc2UoZ290VGV4dCk7XG4gICAgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMoZGVmYXVsdE9wdGlvbnMsIGdsdGZKc29uLCBvcHRpb25zKTtcbiAgICBjb25zdCB1aW50OGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIsIDIwICsgbGVuZ3RoT2ZKU29uQ2h1bmtEYXRhICsgOCk7XG5cbiAgICBpZiAoZ2x0Zkpzb24uYXNzZXQuZXh0cmFzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsdGZKc29uLmFzc2V0LmV4dHJhcyA9IHsgZmlsZVR5cGU6ICdnbFRGJywgdmVyc2lvbjogJzInIH07XG4gICAgfVxuICAgIHRoaXMuX21lcmdlRXh0ZW5kZWRKc29uKGdsdGZKc29uLCBvcHRpb25zLmV4dGVuZGVkSnNvbik7XG4gICAgZ2x0Zkpzb24uYXNzZXQuZXh0cmFzLnJuTG9hZGVyT3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5fbG9hZElubmVyKHVpbnQ4YXJyYXksIGJhc2VQYXRoLCBnbHRmSnNvbiwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgdGhpcy5fbG9hZElubmVyIGVycm9yIGluIF9sb2FkQXNCaW5hcnlKc29uOiAke2Vycn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGdsdGZKc29uO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3NlcyB0ZXh0LWJhc2VkIGdsVEYgSlNPTiBkYXRhLlxuICAgKiBTZXRzIHVwIGFzc2V0IGluZm9ybWF0aW9uIGFuZCBkZWxlZ2F0ZXMgdG8gaW50ZXJuYWwgbG9hZGluZyBtZXRob2RzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgcGFyc2VkIGdsVEYgSlNPTiBvYmplY3RcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMb2FkaW5nIG9wdGlvbnNcbiAgICogQHBhcmFtIGRlZmF1bHRPcHRpb25zIC0gRGVmYXVsdCBsb2FkaW5nIG9wdGlvbnNcbiAgICogQHBhcmFtIGJhc2VQYXRoIC0gQmFzZSBwYXRoIGZvciByZXNvbHZpbmcgcmVsYXRpdmUgVVJJc1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgcHJvY2Vzc2VkIGdsVEYgSlNPTlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgX2xvYWRBc1RleHRKc29uKFxuICAgIGdsdGZKc29uOiBSbk0yLFxuICAgIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uLFxuICAgIGRlZmF1bHRPcHRpb25zOiBHbHRmTG9hZE9wdGlvbixcbiAgICBiYXNlUGF0aDogc3RyaW5nXG4gICk6IFByb21pc2U8Um5NMj4ge1xuICAgIGlmIChnbHRmSnNvbi5hc3NldC5leHRyYXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2x0Zkpzb24uYXNzZXQuZXh0cmFzID0geyBmaWxlVHlwZTogJ2dsVEYnLCB2ZXJzaW9uOiAnMicgfTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gdGhpcy5fZ2V0T3B0aW9ucyhkZWZhdWx0T3B0aW9ucywgZ2x0Zkpzb24sIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fbWVyZ2VFeHRlbmRlZEpzb24oZ2x0Zkpzb24sIG9wdGlvbnMuZXh0ZW5kZWRKc29uKTtcbiAgICBnbHRmSnNvbi5hc3NldC5leHRyYXMucm5Mb2FkZXJPcHRpb25zID0gb3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLl9sb2FkSW5uZXIodW5kZWZpbmVkLCBiYXNlUGF0aCwgZ2x0Zkpzb24sIG9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYHRoaXMuX2xvYWRJbm5lciBlcnJvciBpbiBfbG9hZEFzVGV4dEpzb246ICR7ZXJyfWApO1xuICAgIH1cbiAgICByZXR1cm4gZ2x0Zkpzb247XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbG9hZGluZyBtZXRob2QgdGhhdCBjb29yZGluYXRlcyByZXNvdXJjZSBsb2FkaW5nIGFuZCBKU09OIGNvbnRlbnQgcHJvY2Vzc2luZy5cbiAgICogUnVucyByZXNvdXJjZSBsb2FkaW5nIGFuZCBKU09OIHByb2Nlc3NpbmcgaW4gcGFyYWxsZWwgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHVpbnQ4YXJyYXkgLSBCaW5hcnkgZGF0YSBmb3IgZW1iZWRkZWQgcmVzb3VyY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIGJhc2VQYXRoIC0gQmFzZSBwYXRoIGZvciByZXNvbHZpbmcgcmVsYXRpdmUgVVJJc1xuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIG9iamVjdCB0byBwcm9jZXNzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGluZyBvcHRpb25zXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gYWxsIGxvYWRpbmcgaXMgY29tcGxldGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9sb2FkSW5uZXIodWludDhhcnJheTogVWludDhBcnJheSB8IHVuZGVmaW5lZCwgYmFzZVBhdGg6IHN0cmluZywgZ2x0Zkpzb246IFJuTTIsIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uKSB7XG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgIGNvbnN0IHJlc291cmNlcyA9IHtcbiAgICAgIHNoYWRlcnM6IFtdLFxuICAgICAgYnVmZmVyczogW10sXG4gICAgICBpbWFnZXM6IFtdLFxuICAgIH07XG4gICAgcHJvbWlzZXMucHVzaCh0aGlzLl9sb2FkUmVzb3VyY2VzKHVpbnQ4YXJyYXkhLCBiYXNlUGF0aCwgZ2x0Zkpzb24sIG9wdGlvbnMsIHJlc291cmNlcykpO1xuICAgIHByb21pc2VzLnB1c2goXG4gICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgdGhpcy5fbG9hZEpzb25Db250ZW50KGdsdGZKc29uLCBvcHRpb25zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSkgYXMgUHJvbWlzZTx2b2lkPlxuICAgICk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3NlcyBnbFRGIEpTT04gY29udGVudCBieSBsb2FkaW5nIGRlcGVuZGVuY2llcyBmb3IgYWxsIG1ham9yIGNvbXBvbmVudHMuXG4gICAqIFRoaXMgbWV0aG9kIGVzdGFibGlzaGVzIG9iamVjdCByZWZlcmVuY2VzIGJldHdlZW4gZGlmZmVyZW50IGdsVEYgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBvYmplY3QgdG8gcHJvY2Vzc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRpbmcgb3B0aW9uc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2xvYWRKc29uQ29udGVudChnbHRmSnNvbjogUm5NMiwgX29wdGlvbnM6IEdsdGZMb2FkT3B0aW9uKSB7XG4gICAgLy8gU2NlbmVcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZTY2VuZXMoZ2x0Zkpzb24pO1xuXG4gICAgLy8gTm9kZVxuICAgIHRoaXMuX2xvYWREZXBlbmRlbmNpZXNPZk5vZGVzKGdsdGZKc29uKTtcblxuICAgIC8vIE1lc2hcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZNZXNoZXMoZ2x0Zkpzb24pO1xuXG4gICAgLy8gTWF0ZXJpYWxcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZNYXRlcmlhbHMoZ2x0Zkpzb24pO1xuXG4gICAgLy8gVGV4dHVyZVxuICAgIHRoaXMuX2xvYWREZXBlbmRlbmNpZXNPZlRleHR1cmVzKGdsdGZKc29uKTtcblxuICAgIC8vIEpvaW50XG4gICAgdGhpcy5fbG9hZERlcGVuZGVuY2llc09mSm9pbnRzKGdsdGZKc29uKTtcblxuICAgIC8vIEFuaW1hdGlvblxuICAgIHRoaXMuX2xvYWREZXBlbmRlbmNpZXNPZkFuaW1hdGlvbnMoZ2x0Zkpzb24pO1xuXG4gICAgLy8gQWNjZXNzb3JcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZBY2Nlc3NvcnMoZ2x0Zkpzb24pO1xuXG4gICAgLy8gQnVmZmVyVmlld1xuICAgIHRoaXMuX2xvYWREZXBlbmRlbmNpZXNPZkJ1ZmZlclZpZXdzKGdsdGZKc29uKTtcblxuICAgIGlmIChnbHRmSnNvbi5hc3NldC5leHRyYXMgPT09IHZvaWQgMCkge1xuICAgICAgZ2x0Zkpzb24uYXNzZXQuZXh0cmFzID0ge307XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVzdGFibGlzaGVzIG9iamVjdCByZWZlcmVuY2VzIGJldHdlZW4gc2NlbmVzIGFuZCB0aGVpciBub2Rlcy5cbiAgICogUG9wdWxhdGVzIHRoZSBub2Rlc09iamVjdHMgYXJyYXkgd2l0aCBhY3R1YWwgbm9kZSBvYmplY3RzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIG9iamVjdCBjb250YWluaW5nIHNjZW5lc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2xvYWREZXBlbmRlbmNpZXNPZlNjZW5lcyhnbHRmSnNvbjogUm5NMikge1xuICAgIGZvciAoY29uc3Qgc2NlbmUgb2YgZ2x0Zkpzb24uc2NlbmVzKSB7XG4gICAgICBmb3IgKGNvbnN0IGkgaW4gc2NlbmUubm9kZXMhKSB7XG4gICAgICAgIHNjZW5lLm5vZGVzT2JqZWN0cyFbaV0gPSBnbHRmSnNvbi5ub2Rlc1tzY2VuZS5ub2RlcyFbaV1dO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFc3RhYmxpc2hlcyBvYmplY3QgcmVmZXJlbmNlcyBmb3Igbm9kZXMgaW5jbHVkaW5nIGhpZXJhcmNoeSwgbWVzaGVzLCBza2lucywgY2FtZXJhcywgYW5kIGxpZ2h0cy5cbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyB0aGUgY29tcGxldGUgbm9kZSBkZXBlbmRlbmN5IGdyYXBoLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIG9iamVjdCBjb250YWluaW5nIG5vZGVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbG9hZERlcGVuZGVuY2llc09mTm9kZXMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZ2x0Zkpzb24ubm9kZXMpIHtcbiAgICAgIC8vIEhpZXJhcmNoeVxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChub2RlLmNoaWxkcmVuT2JqZWN0cykpIHtcbiAgICAgICAgICBub2RlLmNoaWxkcmVuT2JqZWN0cyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgbm9kZS5jaGlsZHJlbk9iamVjdHMhW2ldID0gZ2x0Zkpzb24ubm9kZXNbbm9kZS5jaGlsZHJlbltpXV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVzaFxuICAgICAgaWYgKG5vZGUubWVzaCAhPT0gdm9pZCAwICYmIGdsdGZKc29uLm1lc2hlcyAhPT0gdm9pZCAwKSB7XG4gICAgICAgIG5vZGUubWVzaE9iamVjdCA9IGdsdGZKc29uLm1lc2hlc1tub2RlLm1lc2ghXTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpblxuICAgICAgaWYgKG5vZGUuc2tpbiAhPT0gdm9pZCAwICYmIGdsdGZKc29uLnNraW5zICE9PSB2b2lkIDApIHtcbiAgICAgICAgbm9kZS5za2luT2JqZWN0ID0gZ2x0Zkpzb24uc2tpbnNbbm9kZS5za2luXTtcbiAgICAgICAgaWYgKG5vZGUubWVzaE9iamVjdCEuZXh0cmFzID09PSB2b2lkIDApIHtcbiAgICAgICAgICBub2RlLm1lc2hPYmplY3QhLmV4dHJhcyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIG5vZGUubWVzaE9iamVjdCEuZXh0cmFzLl9za2luID0gbm9kZS5za2luO1xuICAgICAgfVxuXG4gICAgICAvLyBDYW1lcmFcbiAgICAgIGlmIChub2RlLmNhbWVyYSAhPT0gdm9pZCAwICYmIGdsdGZKc29uLmNhbWVyYXMgIT09IHZvaWQgMCkge1xuICAgICAgICBub2RlLmNhbWVyYU9iamVjdCA9IGdsdGZKc29uLmNhbWVyYXNbbm9kZS5jYW1lcmFdO1xuICAgICAgfVxuXG4gICAgICAvLyBMaWdodHNcbiAgICAgIGlmIChcbiAgICAgICAgbm9kZS5leHRlbnNpb25zICE9PSB2b2lkIDAgJiZcbiAgICAgICAgZ2x0Zkpzb24uZXh0ZW5zaW9ucyAhPT0gdm9pZCAwICYmXG4gICAgICAgIGdsdGZKc29uLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbCAhPT0gdm9pZCAwXG4gICAgICApIHtcbiAgICAgICAgbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHRJbmRleCA9IG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0O1xuICAgICAgICBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodCA9XG4gICAgICAgICAgZ2x0Zkpzb24uZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0c1tub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodEluZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXN0YWJsaXNoZXMgb2JqZWN0IHJlZmVyZW5jZXMgZm9yIG1lc2hlcyBhbmQgdGhlaXIgcHJpbWl0aXZlcy5cbiAgICogTGlua3MgbWF0ZXJpYWxzLCBhdHRyaWJ1dGVzLCBpbmRpY2VzLCBhbmQgbW9ycGggdGFyZ2V0cyB0byB0aGVpciByZXNwZWN0aXZlIG9iamVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgbWVzaGVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbG9hZERlcGVuZGVuY2llc09mTWVzaGVzKGdsdGZKc29uOiBSbk0yKSB7XG4gICAgLy8gTWVzaFxuICAgIGZvciAoY29uc3QgbWVzaCBvZiBnbHRmSnNvbi5tZXNoZXMpIHtcbiAgICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIG1lc2gucHJpbWl0aXZlcykge1xuICAgICAgICBpZiAocHJpbWl0aXZlLm1hdGVyaWFsICE9PSB2b2lkIDApIHtcbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWxPYmplY3QgPSBnbHRmSnNvbi5tYXRlcmlhbHNbcHJpbWl0aXZlLm1hdGVyaWFsXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBwcmltaXRpdmUuYXR0cmlidXRlcyEpIHtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NvcklkID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgICAgY29uc3QgYWNjZXNzb3IgPSBnbHRmSnNvbi5hY2Nlc3NvcnNbYWNjZXNzb3JJZF07XG4gICAgICAgICAgYWNjZXNzb3IuZXh0cmFzID0ge307XG4gICAgICAgICAgcHJpbWl0aXZlLmF0dHJpYnV0ZXNPYmplY3RzIVthdHRyaWJ1dGVOYW1lXSA9IGFjY2Vzc29yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByaW1pdGl2ZS5pbmRpY2VzICE9IG51bGwpIHtcbiAgICAgICAgICBwcmltaXRpdmUuaW5kaWNlc09iamVjdCA9IGdsdGZKc29uLmFjY2Vzc29yc1twcmltaXRpdmUuaW5kaWNlc107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJpbWl0aXZlLnRhcmdldHMgIT0gbnVsbCkge1xuICAgICAgICAgIHByaW1pdGl2ZS50YXJnZXRzT2JqZWN0cyA9IFtdO1xuICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByaW1pdGl2ZS50YXJnZXRzKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge30gYXMgdW5rbm93biBhcyB7IFtzOiBzdHJpbmddOiBSbk0yQWNjZXNzb3IgfTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0U2hhcGVUYXJnZXRBY2Nlc3NvcklkID0gdGFyZ2V0W2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICAgICAgICBpZiAodGFyZ2V0U2hhcGVUYXJnZXRBY2Nlc3NvcklkID49IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NvciA9IGdsdGZKc29uLmFjY2Vzc29yc1t0YXJnZXRTaGFwZVRhcmdldEFjY2Vzc29ySWRdO1xuICAgICAgICAgICAgICAgIGFjY2Vzc29yLmV4dHJhcyA9IHt9O1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhY2Nlc3NvcjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJpbWl0aXZlLnRhcmdldHNPYmplY3RzLnB1c2goYXR0cmlidXRlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBSaG9kb25pdGUtc3BlY2lmaWMgZ2xURiBsb2FkZXIgb3B0aW9ucyBleGlzdCBpbiB0aGUgYXNzZXQgZXh0cmFzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBSaG9kb25pdGUgbG9hZGVyIG9wdGlvbnMgZXhpc3QsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFc3RhYmxpc2hlcyBvYmplY3QgcmVmZXJlbmNlcyBmb3IgbWF0ZXJpYWxzIGFuZCB0aGVpciB0ZXh0dXJlcy5cbiAgICogTGlua3MgUEJSIHRleHR1cmVzLCBub3JtYWwgbWFwcywgb2NjbHVzaW9uIG1hcHMsIGFuZCBlbWlzc2l2ZSB0ZXh0dXJlcy5cbiAgICogQWxzbyBoYW5kbGVzIGV4dGVuc2lvbi1zcGVjaWZpYyB0ZXh0dXJlIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWxzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbG9hZERlcGVuZGVuY2llc09mTWF0ZXJpYWxzKGdsdGZKc29uOiBSbk0yKSB7XG4gICAgaWYgKCFnbHRmSnNvbi50ZXh0dXJlcykgZ2x0Zkpzb24udGV4dHVyZXMgPSBbXTtcblxuICAgIC8vIE1hdGVyaWFsXG4gICAgaWYgKGdsdGZKc29uLm1hdGVyaWFscykge1xuICAgICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiBnbHRmSnNvbi5tYXRlcmlhbHMpIHtcbiAgICAgICAgaWYgKG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzKSB7XG4gICAgICAgICAgY29uc3QgYmFzZUNvbG9yVGV4dHVyZSA9IG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmU7XG4gICAgICAgICAgaWYgKGJhc2VDb2xvclRleHR1cmUgIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgYmFzZUNvbG9yVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbYmFzZUNvbG9yVGV4dHVyZS5pbmRleF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSA9IG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzLm1ldGFsbGljUm91Z2huZXNzVGV4dHVyZTtcbiAgICAgICAgICBpZiAobWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgICAgIG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLmluZGV4XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub3JtYWxUZXh0dXJlID0gbWF0ZXJpYWwubm9ybWFsVGV4dHVyZTtcbiAgICAgICAgaWYgKG5vcm1hbFRleHR1cmUgIT09IHZvaWQgMCkge1xuICAgICAgICAgIG5vcm1hbFRleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW25vcm1hbFRleHR1cmUuaW5kZXhdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb2NjbHVzaW9uVGV4dHVyZSA9IG1hdGVyaWFsLm9jY2x1c2lvblRleHR1cmU7XG4gICAgICAgIGlmIChvY2NsdXNpb25UZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgICBvY2NsdXNpb25UZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tvY2NsdXNpb25UZXh0dXJlLmluZGV4XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVtaXNzaXZlVGV4dHVyZSA9IG1hdGVyaWFsLmVtaXNzaXZlVGV4dHVyZTtcbiAgICAgICAgaWYgKGVtaXNzaXZlVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgZW1pc3NpdmVUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tlbWlzc2l2ZVRleHR1cmUuaW5kZXhdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbG9hZGVyRXh0ZW5zaW9uID0gdGhpcy5fY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zkpzb24pXG4gICAgICAgICAgPyBnbHRmSnNvbi5hc3NldC5leHRyYXMhLnJuTG9hZGVyT3B0aW9ucyEubG9hZGVyRXh0ZW5zaW9uXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChsb2FkZXJFeHRlbnNpb24/LnNldFRleHR1cmVzKSB7XG4gICAgICAgICAgbG9hZGVyRXh0ZW5zaW9uLnNldFRleHR1cmVzKGdsdGZKc29uLCBtYXRlcmlhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXN0YWJsaXNoZXMgb2JqZWN0IHJlZmVyZW5jZXMgZm9yIHRleHR1cmVzLCBsaW5raW5nIHNhbXBsZXJzIGFuZCBpbWFnZSBzb3VyY2VzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIG9iamVjdCBjb250YWluaW5nIHRleHR1cmVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbG9hZERlcGVuZGVuY2llc09mVGV4dHVyZXMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICAvLyBUZXh0dXJlXG4gICAgaWYgKGdsdGZKc29uLnRleHR1cmVzKSB7XG4gICAgICBmb3IgKGNvbnN0IHRleHR1cmUgb2YgZ2x0Zkpzb24udGV4dHVyZXMpIHtcbiAgICAgICAgaWZEZWZpbmVkVGhlbih2ID0+IHtcbiAgICAgICAgICB0ZXh0dXJlLnNhbXBsZXJPYmplY3QgPSBnbHRmSnNvbi5zYW1wbGVyc1t2XTtcbiAgICAgICAgfSwgdGV4dHVyZS5zYW1wbGVyKTtcblxuICAgICAgICBpZiAodGV4dHVyZS5zb3VyY2UgIT09IHZvaWQgMCkge1xuICAgICAgICAgIHRleHR1cmUuc291cmNlT2JqZWN0ID0gZ2x0Zkpzb24uaW1hZ2VzW3RleHR1cmUuc291cmNlXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFc3RhYmxpc2hlcyBvYmplY3QgcmVmZXJlbmNlcyBmb3Igc2tlbGV0YWwgYW5pbWF0aW9uIGpvaW50cyBhbmQgc2tpbnMuXG4gICAqIExpbmtzIHNrZWxldG9uIG5vZGVzLCBpbnZlcnNlIGJpbmQgbWF0cmljZXMsIGFuZCBqb2ludCBoaWVyYXJjaGllcy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBvYmplY3QgY29udGFpbmluZyBza2luc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2xvYWREZXBlbmRlbmNpZXNPZkpvaW50cyhnbHRmSnNvbjogUm5NMikge1xuICAgIGlmIChnbHRmSnNvbi5za2lucykge1xuICAgICAgZm9yIChjb25zdCBza2luIG9mIGdsdGZKc29uLnNraW5zKSB7XG4gICAgICAgIGlmIChJcy5leGlzdChza2luLnNrZWxldG9uKSkge1xuICAgICAgICAgIHNraW4uc2tlbGV0b25PYmplY3QgPSBnbHRmSnNvbi5ub2Rlc1tza2luLnNrZWxldG9uXTtcblxuICAgICAgICAgIGlmRGVmaW5lZFRoZW4odiA9PiB7XG4gICAgICAgICAgICBza2luLmludmVyc2VCaW5kTWF0cmljZXNPYmplY3QgPSBnbHRmSnNvbi5hY2Nlc3NvcnNbdl07XG4gICAgICAgICAgfSwgc2tpbi5pbnZlcnNlQmluZE1hdHJpY2VzKTtcblxuICAgICAgICAgIGlmVW5kZWZpbmVkVGhlbigoKSA9PiB7XG4gICAgICAgICAgICBza2luLnNrZWxldG9uT2JqZWN0ID0gZ2x0Zkpzb24ubm9kZXNbc2tpbi5qb2ludHNbMF1dO1xuICAgICAgICAgIH0sIHNraW4uc2tlbGV0b24pO1xuXG4gICAgICAgICAgc2tpbi5qb2ludHNPYmplY3RzID0gW107XG4gICAgICAgICAgZm9yIChjb25zdCBqb2ludEluZGV4IG9mIHNraW4uam9pbnRzKSB7XG4gICAgICAgICAgICBza2luLmpvaW50c09iamVjdHMucHVzaChnbHRmSnNvbi5ub2Rlc1tqb2ludEluZGV4XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVzdGFibGlzaGVzIG9iamVjdCByZWZlcmVuY2VzIGZvciBhbmltYXRpb25zLCBjaGFubmVscywgYW5kIHNhbXBsZXJzLlxuICAgKiBMaW5rcyBhbmltYXRpb24gZGF0YSB3aXRoIHRhcmdldCBub2RlcyBhbmQgaGFuZGxlcyBzcGVjaWFsIGNhc2VzIGZvciByb3RhdGlvbnMgYW5kIHdlaWdodHMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgYW5pbWF0aW9uc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2xvYWREZXBlbmRlbmNpZXNPZkFuaW1hdGlvbnMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICBpZiAoZ2x0Zkpzb24uYW5pbWF0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBhbmltYXRpb24gb2YgZ2x0Zkpzb24uYW5pbWF0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGNoYW5uZWwgb2YgYW5pbWF0aW9uLmNoYW5uZWxzKSB7XG4gICAgICAgICAgY2hhbm5lbC5zYW1wbGVyT2JqZWN0ID0gYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl07XG5cbiAgICAgICAgICBjaGFubmVsLnRhcmdldCEubm9kZU9iamVjdCA9IGdsdGZKc29uLm5vZGVzW2NoYW5uZWwudGFyZ2V0IS5ub2RlIV07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBjaGFubmVsIG9mIGFuaW1hdGlvbi5jaGFubmVscykge1xuICAgICAgICAgIGlmIChJcy5leGlzdChjaGFubmVsLnNhbXBsZXJPYmplY3QpKSB7XG4gICAgICAgICAgICBjaGFubmVsLnNhbXBsZXJPYmplY3QuaW5wdXRPYmplY3QgPSBnbHRmSnNvbi5hY2Nlc3NvcnNbY2hhbm5lbC5zYW1wbGVyT2JqZWN0LmlucHV0XTtcbiAgICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QgPSBnbHRmSnNvbi5hY2Nlc3NvcnNbY2hhbm5lbC5zYW1wbGVyT2JqZWN0Lm91dHB1dF07XG4gICAgICAgICAgICBpZiAoY2hhbm5lbC5zYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdC5leHRyYXMgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICBjaGFubmVsLnNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0LmV4dHJhcyA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGFubmVsLnRhcmdldCEucGF0aCA9PT0gJ3JvdGF0aW9uJykge1xuICAgICAgICAgICAgICBjaGFubmVsLnNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0LmV4dHJhcyEucXVhdGVybmlvbklmVmVjNCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQhLnBhdGggPT09ICd3ZWlnaHRzJykge1xuICAgICAgICAgICAgICBjb25zdCB3ZWlnaHRzQXJyYXlMZW5ndGggPVxuICAgICAgICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QuY291bnQgLyBjaGFubmVsLnNhbXBsZXJPYmplY3QuaW5wdXRPYmplY3QuY291bnQ7XG4gICAgICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QuZXh0cmFzIS53ZWlnaHRzQXJyYXlMZW5ndGggPSB3ZWlnaHRzQXJyYXlMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVzdGFibGlzaGVzIG9iamVjdCByZWZlcmVuY2VzIGZvciBhY2Nlc3NvcnMgYW5kIHRoZWlyIGJ1ZmZlciB2aWV3cy5cbiAgICogQWxzbyBoYW5kbGVzIHNwYXJzZSBhY2Nlc3NvciBkYXRhIGlmIHByZXNlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgYWNjZXNzb3JzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbG9hZERlcGVuZGVuY2llc09mQWNjZXNzb3JzKGdsdGZKc29uOiBSbk0yKSB7XG4gICAgLy8gQWNjZXNzb3JcbiAgICBmb3IgKGNvbnN0IGFjY2Vzc29yIG9mIGdsdGZKc29uLmFjY2Vzc29ycykge1xuICAgICAgaWYgKGFjY2Vzc29yLmJ1ZmZlclZpZXcgPT0gbnVsbCkge1xuICAgICAgICBhY2Nlc3Nvci5idWZmZXJWaWV3ID0gMDtcbiAgICAgIH1cbiAgICAgIGFjY2Vzc29yLmJ1ZmZlclZpZXdPYmplY3QgPSBnbHRmSnNvbi5idWZmZXJWaWV3c1thY2Nlc3Nvci5idWZmZXJWaWV3XTtcblxuICAgICAgaWYgKGFjY2Vzc29yLnNwYXJzZSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHNwYXJzZSA9IGFjY2Vzc29yLnNwYXJzZTtcbiAgICAgICAgc3BhcnNlLmluZGljZXMhLmJ1ZmZlclZpZXdPYmplY3QgPSBnbHRmSnNvbi5idWZmZXJWaWV3c1tzcGFyc2UuaW5kaWNlcyEuYnVmZmVyVmlld107XG4gICAgICAgIHNwYXJzZS52YWx1ZXMhLmJ1ZmZlclZpZXdPYmplY3QgPSBnbHRmSnNvbi5idWZmZXJWaWV3c1tzcGFyc2UudmFsdWVzIS5idWZmZXJWaWV3XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXN0YWJsaXNoZXMgb2JqZWN0IHJlZmVyZW5jZXMgYmV0d2VlbiBidWZmZXIgdmlld3MgYW5kIHRoZWlyIHVuZGVybHlpbmcgYnVmZmVycy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBvYmplY3QgY29udGFpbmluZyBidWZmZXIgdmlld3NcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9sb2FkRGVwZW5kZW5jaWVzT2ZCdWZmZXJWaWV3cyhnbHRmSnNvbjogUm5NMikge1xuICAgIC8vIEJ1ZmZlclZpZXdcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlclZpZXcgb2YgZ2x0Zkpzb24uYnVmZmVyVmlld3MpIHtcbiAgICAgIGlmIChidWZmZXJWaWV3LmJ1ZmZlciAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGJ1ZmZlclZpZXcuYnVmZmVyT2JqZWN0ID0gZ2x0Zkpzb24uYnVmZmVyc1tidWZmZXJWaWV3LmJ1ZmZlciFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZXMgZXh0ZW5kZWQgSlNPTiBkYXRhIGludG8gdGhlIG1haW4gZ2xURiBKU09OIG9iamVjdC5cbiAgICogU3VwcG9ydHMgQXJyYXlCdWZmZXIsIHN0cmluZywgb3Igb2JqZWN0IGZvcm1hdHMgZm9yIGV4dGVuZGVkIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBtYWluIGdsVEYgSlNPTiBvYmplY3QgdG8gbWVyZ2UgaW50b1xuICAgKiBAcGFyYW0gZXh0ZW5kZWREYXRhIC0gQWRkaXRpb25hbCBkYXRhIHRvIG1lcmdlIChBcnJheUJ1ZmZlciwgc3RyaW5nLCBvciBvYmplY3QpXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWVyZ2VFeHRlbmRlZEpzb24oZ2x0Zkpzb246IFJuTTIsIGV4dGVuZGVkRGF0YTogYW55KSB7XG4gICAgbGV0IGV4dGVuZGVkSnNvbiA9IG51bGw7XG4gICAgaWYgKGV4dGVuZGVkRGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICBjb25zdCBleHRlbmRlZEpzb25TdHIgPSBEYXRhVXRpbC5hcnJheUJ1ZmZlclRvU3RyaW5nKGV4dGVuZGVkRGF0YSk7XG4gICAgICBleHRlbmRlZEpzb24gPSBKU09OLnBhcnNlKGV4dGVuZGVkSnNvblN0cik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXh0ZW5kZWREYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgZXh0ZW5kZWRKc29uID0gSlNPTi5wYXJzZShleHRlbmRlZERhdGEpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4dGVuZGVkRGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGV4dGVuZGVkSnNvbiA9IGV4dGVuZGVkRGF0YTtcbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKGdsdGZKc29uLCBleHRlbmRlZEpzb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGV4dGVybmFsIHJlc291cmNlcyAoYnVmZmVycyBhbmQgaW1hZ2VzKSByZWZlcmVuY2VkIGJ5IHRoZSBnbFRGIEpTT04uXG4gICAqIEhhbmRsZXMgdmFyaW91cyBVUkkgZm9ybWF0cyBpbmNsdWRpbmcgZGF0YSBVUklzLCBmaWxlIHJlZmVyZW5jZXMsIGFuZCBlbWJlZGRlZCBiaW5hcnkgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIHVpbnQ4QXJyYXkgLSBCaW5hcnkgZGF0YSBmb3IgZW1iZWRkZWQgcmVzb3VyY2VzXG4gICAqIEBwYXJhbSBiYXNlUGF0aCAtIEJhc2UgcGF0aCBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIFVSSXNcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBvYmplY3QgY29udGFpbmluZyByZXNvdXJjZSByZWZlcmVuY2VzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGluZyBvcHRpb25zIGluY2x1ZGluZyBmaWxlIGNvbGxlY3Rpb25zXG4gICAqIEBwYXJhbSByZXNvdXJjZXMgLSBPYmplY3QgdG8gc3RvcmUgbG9hZGVkIHJlc291cmNlc1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCByZXNvdXJjZXMgYXJlIGxvYWRlZFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2xvYWRSZXNvdXJjZXMoXG4gICAgdWludDhBcnJheTogVWludDhBcnJheSxcbiAgICBiYXNlUGF0aDogc3RyaW5nLFxuICAgIGdsdGZKc29uOiBSbk0yLFxuICAgIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uLFxuICAgIHJlc291cmNlczoge1xuICAgICAgc2hhZGVyczogYW55W107XG4gICAgICBidWZmZXJzOiBhbnlbXTtcbiAgICAgIGltYWdlczogYW55W107XG4gICAgfVxuICApIHtcbiAgICBjb25zdCBwcm9taXNlc1RvTG9hZFJlc291cmNlcyA9IFtdO1xuXG4gICAgLy8gU2hhZGVycyBBc3luYyBsb2FkXG5cbiAgICAvLyBmb3IgKGxldCBfaSBpbiBnbHRmSnNvbi5zaGFkZXJzKSB7XG4gICAgLy8gICBjb25zdCBpID0gX2kgYXMgYW55IGFzIG51bWJlcjtcbiAgICAvLyAgIHJlc291cmNlcy5zaGFkZXJzW2ldID0ge307XG5cbiAgICAvLyAgIGxldCBzaGFkZXJKc29uID0gZ2x0Zkpzb24uc2hhZGVyc1tpXTtcbiAgICAvLyAgIGxldCBzaGFkZXJUeXBlID0gc2hhZGVySnNvbi50eXBlO1xuICAgIC8vICAgaWYgKHR5cGVvZiBzaGFkZXJKc29uLmV4dGVuc2lvbnMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBzaGFkZXJKc29uLmV4dGVuc2lvbnMuS0hSX2JpbmFyeV9nbFRGICE9PSAndW5kZWZpbmVkJykge1xuICAgIC8vICAgICByZXNvdXJjZXMuc2hhZGVyc1tpXS5zaGFkZXJUZXh0ID0gdGhpcy5fYWNjZXNzQmluYXJ5QXNTaGFkZXIoc2hhZGVySnNvbi5leHRlbnNpb25zLktIUl9iaW5hcnlfZ2xURi5idWZmZXJWaWV3LCBnbHRmSnNvbiwgYXJyYXlCdWZmZXJCaW5hcnkpO1xuICAgIC8vICAgICByZXNvdXJjZXMuc2hhZGVyc1tpXS5zaGFkZXJUeXBlID0gc2hhZGVyVHlwZTtcbiAgICAvLyAgICAgY29udGludWU7XG4gICAgLy8gICB9XG5cbiAgICAvLyAgIGxldCBzaGFkZXJVcmkgPSBzaGFkZXJKc29uLnVyaTtcblxuICAgIC8vICAgaWYgKG9wdGlvbnMuZmlsZXMpIHtcbiAgICAvLyAgICAgY29uc3Qgc3BsaXR0ZWQgPSBzaGFkZXJVcmkuc3BsaXQoJy8nKTtcbiAgICAvLyAgICAgY29uc3QgZmlsZW5hbWUgPSBzcGxpdHRlZFtzcGxpdHRlZC5sZW5ndGggLSAxXTtcbiAgICAvLyAgICAgaWYgKG9wdGlvbnMuZmlsZXNbZmlsZW5hbWVdKSB7XG4gICAgLy8gICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBvcHRpb25zLmZpbGVzW2ZpbGVuYW1lXTtcbiAgICAvLyAgICAgICByZXNvdXJjZXMuc2hhZGVyc1tpXS5zaGFkZXJUZXh0ID0gRGF0YVV0aWwuYXJyYXlCdWZmZXJUb1N0cmluZyhhcnJheUJ1ZmZlcik7XG4gICAgLy8gICAgICAgcmVzb3VyY2VzLnNoYWRlcnNbaV0uc2hhZGVyVHlwZSA9IHNoYWRlclR5cGU7XG4gICAgLy8gICAgICAgY29udGludWU7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cblxuICAgIC8vICAgaWYgKHNoYWRlclVyaS5tYXRjaCgvXmRhdGE6LykpIHtcbiAgICAvLyAgICAgcHJvbWlzZXNUb0xvYWRSZXNvdXJjZXMucHVzaChcbiAgICAvLyAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0ZWQpID0+IHtcbiAgICAvLyAgICAgICAgIGxldCBhcnJheUJ1ZmZlciA9IERhdGFVdGlsLmRhdGFVcmlUb0FycmF5QnVmZmVyKHNoYWRlclVyaSk7XG4gICAgLy8gICAgICAgICByZXNvdXJjZXMuc2hhZGVyc1tpXS5zaGFkZXJUZXh0ID0gRGF0YVV0aWwuYXJyYXlCdWZmZXJUb1N0cmluZyhhcnJheUJ1ZmZlcik7XG4gICAgLy8gICAgICAgICByZXNvdXJjZXMuc2hhZGVyc1tpXS5zaGFkZXJUeXBlID0gc2hhZGVyVHlwZTtcbiAgICAvLyAgICAgICAgIHJlc29sdmUoKTtcbiAgICAvLyAgICAgICB9KVxuICAgIC8vICAgICApO1xuICAgIC8vICAgfSBlbHNlIHtcbiAgICAvLyAgICAgc2hhZGVyVXJpID0gYmFzZVBhdGggKyBzaGFkZXJVcmk7XG4gICAgLy8gICAgIHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzLnB1c2goXG4gICAgLy8gICAgICAgRGF0YVV0aWwubG9hZFJlc291cmNlQXN5bmMoc2hhZGVyVXJpLCBmYWxzZSxcbiAgICAvLyAgICAgICAgIChyZXNvbHZlOkZ1bmN0aW9uLCByZXNwb25zZTphbnkpPT57XG4gICAgLy8gICAgICAgICAgIHJlc291cmNlcy5zaGFkZXJzW2ldLnNoYWRlclRleHQgPSByZXNwb25zZTtcbiAgICAvLyAgICAgICAgICAgcmVzb3VyY2VzLnNoYWRlcnNbaV0uc2hhZGVyVHlwZSA9IHNoYWRlclR5cGU7XG4gICAgLy8gICAgICAgICAgIHJlc29sdmUoZ2x0Zkpzb24pO1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIChyZWplY3Q6RnVuY3Rpb24sIGVycm9yOmFueSk9PntcblxuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICAgIClcbiAgICAvLyAgICAgKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBCdWZmZXJzIEFzeW5jIGxvYWRcbiAgICBsZXQgcm5wQXJyYXlCdWZmZXI6IFJuUHJvbWlzZTxBcnJheUJ1ZmZlcj47XG4gICAgZm9yIChjb25zdCBpIGluIGdsdGZKc29uLmJ1ZmZlcnMpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlckluZm8gPSBnbHRmSnNvbi5idWZmZXJzW2ldO1xuXG4gICAgICBsZXQgc3BsaXR0ZWQ6IHN0cmluZ1tdO1xuICAgICAgbGV0IGZpbGVuYW1lOiBzdHJpbmc7XG4gICAgICBpZiAoYnVmZmVySW5mby51cmkpIHtcbiAgICAgICAgc3BsaXR0ZWQgPSBidWZmZXJJbmZvLnVyaS5zcGxpdCgnLycpO1xuICAgICAgICBmaWxlbmFtZSA9IHNwbGl0dGVkW3NwbGl0dGVkLmxlbmd0aCAtIDFdO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBidWZmZXJJbmZvLnVyaSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcm5wQXJyYXlCdWZmZXIgPSBuZXcgUm5Qcm9taXNlPEFycmF5QnVmZmVyPihyZXNvbHZlID0+IHtcbiAgICAgICAgICByZXNvdXJjZXMuYnVmZmVyc1tpXSA9IHVpbnQ4QXJyYXk7XG4gICAgICAgICAgYnVmZmVySW5mby5idWZmZXIgPSB1aW50OEFycmF5O1xuICAgICAgICAgIHJlc29sdmUodWludDhBcnJheS5idWZmZXIgYXMgQXJyYXlCdWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoYnVmZmVySW5mby51cmkubWF0Y2goL15kYXRhOmFwcGxpY2F0aW9uXFwvKC4qKTtiYXNlNjQsLykpIHtcbiAgICAgICAgcm5wQXJyYXlCdWZmZXIgPSBuZXcgUm5Qcm9taXNlPEFycmF5QnVmZmVyPihyZXNvbHZlID0+IHtcbiAgICAgICAgICBjb25zdCBhcnJheUJ1ZmZlciA9IERhdGFVdGlsLmRhdGFVcmlUb0FycmF5QnVmZmVyKGJ1ZmZlckluZm8udXJpISk7XG4gICAgICAgICAgcmVzb3VyY2VzLmJ1ZmZlcnNbaV0gPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgYnVmZmVySW5mby5idWZmZXIgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgcmVzb2x2ZShhcnJheUJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmZpbGVzPy5bZmlsZW5hbWUhXSkge1xuICAgICAgICBybnBBcnJheUJ1ZmZlciA9IG5ldyBSblByb21pc2U8QXJyYXlCdWZmZXI+KHJlc29sdmUgPT4ge1xuICAgICAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0gb3B0aW9ucy5maWxlcyFbZmlsZW5hbWVdO1xuICAgICAgICAgIHJlc291cmNlcy5idWZmZXJzW2ldID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgICAgIGJ1ZmZlckluZm8uYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgICAgIHJlc29sdmUoYXJyYXlCdWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJucEFycmF5QnVmZmVyID0gbmV3IFJuUHJvbWlzZTxBcnJheUJ1ZmZlcj4oXG4gICAgICAgICAgRGF0YVV0aWwubG9hZFJlc291cmNlQXN5bmMoXG4gICAgICAgICAgICBiYXNlUGF0aCArIGJ1ZmZlckluZm8udXJpLFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIChyZXNvbHZlOiBGdW5jdGlvbiwgcmVzcG9uc2U6IEFycmF5QnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgIHJlc291cmNlcy5idWZmZXJzW2ldID0gbmV3IFVpbnQ4QXJyYXkocmVzcG9uc2UpO1xuICAgICAgICAgICAgICBidWZmZXJJbmZvLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKF9yZWplY3Q6IEZ1bmN0aW9uLCBfZXJyb3I6IGFueSkgPT4ge31cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBidWZmZXJJbmZvLmJ1ZmZlclByb21pc2UgPSBybnBBcnJheUJ1ZmZlcjtcbiAgICAgIHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzLnB1c2gocm5wQXJyYXlCdWZmZXIpO1xuICAgIH1cblxuICAgIC8vIFRleHR1cmVzIEFzeW5jIGxvYWRcbiAgICBmb3IgKGNvbnN0IF9pIGluIGdsdGZKc29uLmltYWdlcykge1xuICAgICAgY29uc3QgaSA9IF9pIGFzIGFueSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBpbWFnZUpzb24gPSBnbHRmSnNvbi5pbWFnZXNbaV0gYXMgUm5NMkltYWdlO1xuICAgICAgLy9sZXQgaW1hZ2VKc29uID0gZ2x0Zkpzb24uaW1hZ2VzW3RleHR1cmVKc29uLnNvdXJjZV07XG4gICAgICAvL2xldCBzYW1wbGVySnNvbiA9IGdsdGZKc29uLnNhbXBsZXJzW3RleHR1cmVKc29uLnNhbXBsZXJdO1xuXG4gICAgICBsZXQgaW1hZ2VVcmk6IHN0cmluZztcblxuICAgICAgaWYgKHR5cGVvZiBpbWFnZUpzb24udXJpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBjb25zdCBpbWFnZVVpbnQ4QXJyYXkgPSBEYXRhVXRpbC5jcmVhdGVVaW50OEFycmF5RnJvbUJ1ZmZlclZpZXdJbmZvKFxuICAgICAgICAgIGdsdGZKc29uLFxuICAgICAgICAgIGltYWdlSnNvbi5idWZmZXJWaWV3ISxcbiAgICAgICAgICB1aW50OEFycmF5XG4gICAgICAgICk7XG4gICAgICAgIGltYWdlVXJpID0gRGF0YVV0aWwuY3JlYXRlQmxvYkltYWdlVXJpRnJvbVVpbnQ4QXJyYXkoaW1hZ2VVaW50OEFycmF5LCBpbWFnZUpzb24ubWltZVR5cGUhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGltYWdlRmlsZVN0ciA9IGltYWdlSnNvbi51cmk7XG4gICAgICAgIGNvbnN0IHNwbGl0dGVkID0gaW1hZ2VGaWxlU3RyLnNwbGl0KCcvJyk7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gc3BsaXR0ZWRbc3BsaXR0ZWQubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChvcHRpb25zLmZpbGVzPy5bZmlsZW5hbWVdKSB7XG4gICAgICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBvcHRpb25zLmZpbGVzW2ZpbGVuYW1lXTtcbiAgICAgICAgICBpbWFnZVVyaSA9IERhdGFVdGlsLmNyZWF0ZUJsb2JJbWFnZVVyaUZyb21VaW50OEFycmF5KG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKSwgaW1hZ2VKc29uLm1pbWVUeXBlISk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW1hZ2VGaWxlU3RyLm1hdGNoKC9eZGF0YTovKSkge1xuICAgICAgICAgIGltYWdlVXJpID0gaW1hZ2VGaWxlU3RyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltYWdlVXJpID0gYmFzZVBhdGggKyBpbWFnZUZpbGVTdHI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gaWYgKG9wdGlvbnMuZXh0ZW5zaW9uTG9hZGVyICYmIG9wdGlvbnMuZXh0ZW5zaW9uTG9hZGVyLnNldFVWVHJhbnNmb3JtVG9UZXh0dXJlKSB7XG4gICAgICAvLyAgIG9wdGlvbnMuZXh0ZW5zaW9uTG9hZGVyLnNldFVWVHJhbnNmb3JtVG9UZXh0dXJlKHRleHR1cmUsIHNhbXBsZXJKc29uKTtcbiAgICAgIC8vIH1cblxuICAgICAgY29uc3QgcHJvbWlzZSA9IERhdGFVdGlsLmNyZWF0ZUltYWdlRnJvbVVyaShpbWFnZVVyaSwgaW1hZ2VKc29uLm1pbWVUeXBlISkudGhlbihpbWFnZSA9PiB7XG4gICAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gJ0Fub255bW91cyc7XG4gICAgICAgIHJlc291cmNlcy5pbWFnZXNbaV0gPSBpbWFnZTtcbiAgICAgICAgaW1hZ2VKc29uLmltYWdlID0gaW1hZ2U7XG4gICAgICB9KTtcbiAgICAgIHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzLnB1c2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzKS5jYXRjaChlcnIgPT4ge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYFByb21pc2UuYWxsIGVycm9yOiAke2Vycn1gKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIERyY1BvaW50Q2xvdWRJbXBvcnRlci5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBEcmNQb2ludENsb3VkSW1wb3J0ZXJcbiAgICovXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcbiAgICBpZiAoIXRoaXMuX19pbnN0YW5jZSkge1xuICAgICAgdGhpcy5fX2luc3RhbmNlID0gbmV3IERyY1BvaW50Q2xvdWRJbXBvcnRlcigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2luc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY29kZXMgYSBEcmFjbyBjb21wcmVzc2VkIGZpbGUgYW5kIGNvbnZlcnRzIGl0IHRvIGdsVEYyIGZvcm1hdC5cbiAgICogVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgRHJhY28gZGVjb2Rpbmcgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgRHJhY28gY29tcHJlc3NlZCBkYXRhXG4gICAqIEBwYXJhbSBkZWZhdWx0T3B0aW9ucyAtIERlZmF1bHQgbG9hZGluZyBvcHRpb25zXG4gICAqIEBwYXJhbSBiYXNlUGF0aCAtIEJhc2UgcGF0aCBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIFVSSXNcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBBZGRpdGlvbmFsIGxvYWRpbmcgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgZ2xURjIgSlNPTiBvYmplY3RcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19kZWNvZGVEcmFjbyhhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIsIGRlZmF1bHRPcHRpb25zOiBHbHRmTG9hZE9wdGlvbiwgYmFzZVBhdGg6IHN0cmluZywgb3B0aW9ucz86IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuX19kZWNvZGVCdWZmZXIoYXJyYXlCdWZmZXIpLnRoZW4oKGpzb246IGFueSkgPT4ge1xuICAgICAgY29uc3QgZ290VGV4dCA9IEpTT04uc3RyaW5naWZ5KGpzb24pO1xuICAgICAgY29uc3QgZ2x0Zkpzb24gPSBKU09OLnBhcnNlKGdvdFRleHQpO1xuICAgICAgcmV0dXJuIHRoaXMuX2xvYWRBc1RleHRKc29uKGdsdGZKc29uLCBvcHRpb25zIGFzIEdsdGZMb2FkT3B0aW9uLCBkZWZhdWx0T3B0aW9ucywgYmFzZVBhdGgpLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGB0aGlzLl9fbG9hZEFzVGV4dEpzb24gZXJyb3I6ICR7ZXJyfWApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVjb2RlcyBhIERyYWNvIGNvbXByZXNzZWQgYnVmZmVyIGFuZCBleHRyYWN0cyBnZW9tZXRyeSBkYXRhLlxuICAgKiBIYW5kbGVzIGJvdGggcG9pbnQgY2xvdWQgYW5kIG1lc2ggZ2VvbWV0cnkgdHlwZXMsIGJ1dCBvbmx5IHN1cHBvcnRzIHBvaW50IGNsb3Vkcy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgRHJhY28gY29tcHJlc3NlZCBkYXRhXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBkZWNvZGVkIGdlb21ldHJ5IGRhdGEgYXMgSlNPTlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2RlY29kZUJ1ZmZlcihhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBjb25zdCBkcmFjbyA9IG5ldyBEcmFjb0RlY29kZXJNb2R1bGUoKTtcbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IGRyYWNvLkRlY29kZXIoKTtcbiAgICBjb25zdCBkcmFjb0dlb21ldHJ5ID0gdGhpcy5fX2dldEdlb21ldHJ5RnJvbURyYWNvQnVmZmVyKGRyYWNvLCBkZWNvZGVyLCBhcnJheUJ1ZmZlcik7XG4gICAgaWYgKGRyYWNvR2VvbWV0cnkgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGRyYWNvR2VvbWV0cnkuJyk7XG4gICAgfVxuICAgIGlmIChkcmFjb0dlb21ldHJ5Lmdlb21ldHJ5VHlwZSAhPT0gZHJhY28uUE9JTlRfQ0xPVUQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBnZW9tZXRyeVR5cGUgb2YgZHJjIGZpbGUuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcG9zQXR0SWQgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvLlBPU0lUSU9OKTtcbiAgICBpZiAocG9zQXR0SWQgPT09IC0xKSB7XG4gICAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgICAgZHJhY28uZGVzdHJveShkcmFjb0dlb21ldHJ5KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRHJhY286IE5vIHBvc2l0aW9uIGF0dHJpYnV0ZSBmb3VuZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lcyA9IFsnUE9TSVRJT04nLCAnTk9STUFMJywgJ0NPTE9SJywgJ1RFWF9DT09SRCcsICdHRU5FUklDJ107XG4gICAgY29uc3QgbnVtUG9pbnRzID0gZHJhY29HZW9tZXRyeS5udW1fcG9pbnRzKCk7XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVEYXRhQWxsOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IGF0dHJpYnV0ZUNvbXBvbmVudHM6IG51bWJlcltdID0gW107XG4gICAgbGV0IGJ1ZmZlckxlbmd0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXR0SWQgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvW2F0dHJpYnV0ZU5hbWVzW2ldXSk7XG4gICAgICBpZiAoYXR0SWQgPT09IC0xKSB7XG4gICAgICAgIGF0dHJpYnV0ZU5hbWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaS0tO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXR0cmlidXRlID0gZGVjb2Rlci5HZXRBdHRyaWJ1dGUoZHJhY29HZW9tZXRyeSwgYXR0SWQpO1xuICAgICAgY29uc3QgYXR0cmlidXRlRGF0YSA9IG5ldyBkcmFjby5EcmFjb0Zsb2F0MzJBcnJheSgpO1xuICAgICAgZGVjb2Rlci5HZXRBdHRyaWJ1dGVGbG9hdEZvckFsbFBvaW50cyhkcmFjb0dlb21ldHJ5LCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZURhdGEpO1xuICAgICAgYXR0cmlidXRlRGF0YUFsbFtpXSA9IGF0dHJpYnV0ZURhdGE7XG5cbiAgICAgIGNvbnN0IG51bUNvbXBvbmVudCA9IGF0dHJpYnV0ZS5udW1fY29tcG9uZW50cygpO1xuICAgICAgYXR0cmlidXRlQ29tcG9uZW50c1tpXSA9IG51bUNvbXBvbmVudDtcbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lc1tpXSA9PT0gJ0NPTE9SJykge1xuICAgICAgICBidWZmZXJMZW5ndGggKz0gbnVtUG9pbnRzICogNDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1ZmZlckxlbmd0aCArPSBudW1Qb2ludHMgKiBudW1Db21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXJMZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBjdXJyZW50QnVmZmVySW5kZXggPSAwOyBpIDwgYXR0cmlidXRlTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lc1tpXSA9PT0gJ0NPTE9SJyAmJiBhdHRyaWJ1dGVDb21wb25lbnRzW2ldID09PSAzKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtUG9pbnRzOyBjdXJyZW50QnVmZmVySW5kZXggKz0gNCwgaiArPSAzKSB7XG4gICAgICAgICAgYnVmZmVyW2N1cnJlbnRCdWZmZXJJbmRleF0gPSBhdHRyaWJ1dGVEYXRhQWxsW2ldLkdldFZhbHVlKGopO1xuICAgICAgICAgIGJ1ZmZlcltjdXJyZW50QnVmZmVySW5kZXggKyAxXSA9IGF0dHJpYnV0ZURhdGFBbGxbaV0uR2V0VmFsdWUoaiArIDEpO1xuICAgICAgICAgIGJ1ZmZlcltjdXJyZW50QnVmZmVySW5kZXggKyAyXSA9IGF0dHJpYnV0ZURhdGFBbGxbaV0uR2V0VmFsdWUoaiArIDIpO1xuICAgICAgICAgIGJ1ZmZlcltjdXJyZW50QnVmZmVySW5kZXggKyAzXSA9IDEuMDsgLy8gYWxwaGEgdmFsdWVcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGVOYW1lc1tpXSA9PT0gJ1RFWF9DT09SRCcpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1Qb2ludHM7IGN1cnJlbnRCdWZmZXJJbmRleCArPSAyLCBqKyspIHtcbiAgICAgICAgICBidWZmZXJbY3VycmVudEJ1ZmZlckluZGV4XSA9IGF0dHJpYnV0ZURhdGFBbGxbaV0uR2V0VmFsdWUoMiAqIGopO1xuICAgICAgICAgIGJ1ZmZlcltjdXJyZW50QnVmZmVySW5kZXggKyAxXSA9IDEuMCAtIGF0dHJpYnV0ZURhdGFBbGxbaV0uR2V0VmFsdWUoMiAqIGogKyAxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1Qb2ludHMgKiBhdHRyaWJ1dGVDb21wb25lbnRzW2ldOyBjdXJyZW50QnVmZmVySW5kZXgrKywgaisrKSB7XG4gICAgICAgICAgYnVmZmVyW2N1cnJlbnRCdWZmZXJJbmRleF0gPSBhdHRyaWJ1dGVEYXRhQWxsW2ldLkdldFZhbHVlKGopO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkcmFjby5kZXN0cm95KGF0dHJpYnV0ZURhdGFBbGxbaV0pO1xuICAgIH1cbiAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG5cbiAgICByZXR1cm4gdGhpcy5fX2RlY29kZWRCdWZmZXJUb0pTT04oYnVmZmVyLCBudW1Qb2ludHMsIGF0dHJpYnV0ZU5hbWVzLCBhdHRyaWJ1dGVDb21wb25lbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBkZWNvZGVkIERyYWNvIGJ1ZmZlciBkYXRhIHRvIGdsVEYyIEpTT04gZm9ybWF0LlxuICAgKiBDcmVhdGVzIGEgY29tcGxldGUgZ2xURjIgc3RydWN0dXJlIHdpdGggbm9kZXMsIHNjZW5lcywgbWF0ZXJpYWxzLCBhbmQgZ2VvbWV0cnkgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmZlciAtIFRoZSBkZWNvZGVkIEZsb2F0MzJBcnJheSBjb250YWluaW5nIHZlcnRleCBkYXRhXG4gICAqIEBwYXJhbSBudW1Qb2ludHMgLSBOdW1iZXIgb2YgcG9pbnRzIGluIHRoZSBwb2ludCBjbG91ZFxuICAgKiBAcGFyYW0gYXR0cmlidXRlTmFtZXMgLSBBcnJheSBvZiBhdHRyaWJ1dGUgbmFtZXMgKFBPU0lUSU9OLCBDT0xPUiwgZXRjLilcbiAgICogQHBhcmFtIGF0dHJpYnV0ZUNvbXBvbmVudHMgLSBBcnJheSBvZiBjb21wb25lbnQgY291bnRzIGZvciBlYWNoIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgZ2xURjIgSlNPTiBvYmplY3RcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgX19kZWNvZGVkQnVmZmVyVG9KU09OKFxuICAgIGJ1ZmZlcjogRmxvYXQzMkFycmF5LFxuICAgIG51bVBvaW50czogbnVtYmVyLFxuICAgIGF0dHJpYnV0ZU5hbWVzOiBzdHJpbmdbXSxcbiAgICBhdHRyaWJ1dGVDb21wb25lbnRzOiBudW1iZXJbXVxuICApIHtcbiAgICBjb25zdCBqc29uOiBhbnkgPSB7XG4gICAgICBhc3NldDoge1xuICAgICAgICB2ZXJzaW9uOiAnMi4wJyxcbiAgICAgIH0sXG4gICAgICBleHRlbnNpb25zVXNlZDogWydLSFJfbWF0ZXJpYWxzX3VubGl0J10sXG4gICAgICBleHRlbnNpb25zUmVxdWlyZWQ6IFsnS0hSX21hdGVyaWFsc191bmxpdCddLFxuICAgICAgbm9kZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdOb2RlJyxcbiAgICAgICAgICBtZXNoOiAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHNjZW5lczogW1xuICAgICAgICB7XG4gICAgICAgICAgbm9kZXM6IFswXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBtYXRlcmlhbHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdwb2ludC1jbG91ZF9tYXRlcmlhbCcsXG4gICAgICAgICAgcGJyTWV0YWxsaWNSb3VnaG5lc3M6IHtcbiAgICAgICAgICAgIGJhc2VDb2xvckZhY3RvcjogWzEuMCwgMS4wLCAxLjAsIDEuMF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgICBLSFJfbWF0ZXJpYWxzX3VubGl0OiB7fSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5fX3NldEJ1ZmZlcnNUb0pTT04oYnVmZmVyLmJ1ZmZlciBhcyBBcnJheUJ1ZmZlciwganNvbik7XG4gICAgdGhpcy5fX3NldEFjY2Vzc29yc0FuZEJ1ZmZlclZpZXdzVG9KU09OKG51bVBvaW50cywgYXR0cmlidXRlTmFtZXMsIGF0dHJpYnV0ZUNvbXBvbmVudHMsIGpzb24pO1xuICAgIHRoaXMuX19zZXRNZXNoZXNUb0pTT04oYXR0cmlidXRlTmFtZXMsIGpzb24pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGpzb24pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYnVmZmVyIGRhdGEgaW4gdGhlIGdsVEYgSlNPTiBieSBjb252ZXJ0aW5nIHRoZSBGbG9hdDMyQXJyYXkgdG8gYSBkYXRhIFVSSS5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmZlciAtIFRoZSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyB2ZXJ0ZXggZGF0YVxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IHRvIG1vZGlmeVxuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBidWZmZXIgaXMgc2V0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fc2V0QnVmZmVyc1RvSlNPTihidWZmZXI6IEFycmF5QnVmZmVyLCBqc29uOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbnZlcnRCdWZmZXJUb1VSSShidWZmZXIpXG4gICAgICAudGhlbih1cmkgPT4ge1xuICAgICAgICBqc29uLmJ1ZmZlcnMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2lucHV0JyxcbiAgICAgICAgICAgIGJ5dGVMZW5ndGg6IGJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgICAgICAgICAgdXJpOiB1cmksXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYHRoaXMuX19jb252ZXJ0QnVmZmVyVG9VUkkgZXJyb3I6ICR7ZXJyfWApO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gQXJyYXlCdWZmZXIgdG8gYSBkYXRhIFVSSSBmb3IgZW1iZWRkaW5nIGluIGdsVEYgSlNPTi5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIHRvIGNvbnZlcnRcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGRhdGEgVVJJIHN0cmluZ1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NvbnZlcnRCdWZmZXJUb1VSSShhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFthcnJheUJ1ZmZlcl0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScgfSk7XG4gICAgICBjb25zdCBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgIGZyLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZShmci5yZXN1bHQhKTtcbiAgICAgIH07XG4gICAgICBmci5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICByZWplY3QoZnIuZXJyb3IpO1xuICAgICAgfTtcbiAgICAgIGZyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhY2Nlc3NvciBhbmQgYnVmZmVyIHZpZXcgZGVmaW5pdGlvbnMgZm9yIHRoZSBnbFRGIEpTT04uXG4gICAqIERlZmluZXMgaG93IHRvIGludGVycHJldCB0aGUgYmluYXJ5IGRhdGEgZm9yIGVhY2ggdmVydGV4IGF0dHJpYnV0ZS5cbiAgICpcbiAgICogQHBhcmFtIG51bVBvaW50cyAtIE51bWJlciBvZiBwb2ludHMgaW4gdGhlIHBvaW50IGNsb3VkXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVOYW1lcyAtIEFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lc1xuICAgKiBAcGFyYW0gYXR0cmlidXRlQ29tcG9uZW50cyAtIEFycmF5IG9mIGNvbXBvbmVudCBjb3VudHMgZm9yIGVhY2ggYXR0cmlidXRlXG4gICAqIEBwYXJhbSBqc29uIC0gVGhlIGdsVEYgSlNPTiBvYmplY3QgdG8gbW9kaWZ5XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fc2V0QWNjZXNzb3JzQW5kQnVmZmVyVmlld3NUb0pTT04oXG4gICAgbnVtUG9pbnRzOiBudW1iZXIsXG4gICAgYXR0cmlidXRlTmFtZXM6IHN0cmluZ1tdLFxuICAgIGF0dHJpYnV0ZUNvbXBvbmVudHM6IG51bWJlcltdLFxuICAgIGpzb246IGFueVxuICApIHtcbiAgICBjb25zdCBhY2Nlc3NvcnMgPSBbXTtcbiAgICBjb25zdCBidWZmZXJWaWV3cyA9IFtdO1xuXG4gICAgbGV0IGJ5dGVPZmZzZXRPZkJ1ZmZlclZpZXcgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbmRleE9mQnVmZmVyVmlldyA9IDA7IGkgPCBhdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGluZGV4T2ZCdWZmZXJWaWV3KyspIHtcbiAgICAgIGNvbnN0IG51bU9mQ29tcG9uZW50cyA9IGF0dHJpYnV0ZUNvbXBvbmVudHNbaV07XG5cbiAgICAgIGxldCB0eXBlOiBzdHJpbmc7XG4gICAgICBpZiAobnVtT2ZDb21wb25lbnRzID09PSAxKSB7XG4gICAgICAgIHR5cGUgPSAnU0NBTEFSJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR5cGUgPSBgVkVDJHtudW1PZkNvbXBvbmVudHN9YDtcbiAgICAgIH1cblxuICAgICAgbGV0IGJ5dGVPZmZzZXRPZkFjY2Vzc29yID0gMDtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGVOYW1lc1tpXTtcbiAgICAgIHdoaWxlIChpIDwgYXR0cmlidXRlTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgIGFjY2Vzc29ycy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBgcG9pbnQtY2xvdWRfJHthdHRyaWJ1dGVOYW1lfV8ke2l9YCxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiA1MTI2LCAvLyBnbC5GTE9BVFxuICAgICAgICAgIGNvdW50OiBudW1Qb2ludHMsXG4gICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICBidWZmZXJWaWV3OiBpbmRleE9mQnVmZmVyVmlldyxcbiAgICAgICAgICBieXRlT2Zmc2V0OiBieXRlT2Zmc2V0T2ZBY2Nlc3NvcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWVzW2ldID09PSAnQ09MT1InKSB7XG4gICAgICAgICAgYnl0ZU9mZnNldE9mQWNjZXNzb3IgKz0gbnVtUG9pbnRzICogNCAqIDQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnl0ZU9mZnNldE9mQWNjZXNzb3IgKz0gbnVtUG9pbnRzICogbnVtT2ZDb21wb25lbnRzICogNDtcbiAgICAgICAgfVxuXG4gICAgICAgIGkrKztcbiAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgIT09IGF0dHJpYnV0ZU5hbWVzW2ldKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYnVmZmVyVmlld3NbaW5kZXhPZkJ1ZmZlclZpZXddID0ge1xuICAgICAgICBuYW1lOiBgYnVmZmVyVmlld18ke2F0dHJpYnV0ZU5hbWV9YCxcbiAgICAgICAgYnVmZmVyOiAwLFxuICAgICAgICBieXRlTGVuZ3RoOiBieXRlT2Zmc2V0T2ZBY2Nlc3NvcixcbiAgICAgICAgYnl0ZU9mZnNldDogYnl0ZU9mZnNldE9mQnVmZmVyVmlldyxcbiAgICAgICAgYnl0ZVN0cmlkZTogbnVtT2ZDb21wb25lbnRzICogNCxcbiAgICAgICAgdGFyZ2V0OiAzNDk2MiwgLy8gZ2wuQVJSQVlfQlVGRkVSXG4gICAgICB9O1xuICAgICAgYnl0ZU9mZnNldE9mQnVmZmVyVmlldyArPSBieXRlT2Zmc2V0T2ZBY2Nlc3NvcjtcbiAgICB9XG5cbiAgICBqc29uLmFjY2Vzc29ycyA9IGFjY2Vzc29ycztcbiAgICBqc29uLmJ1ZmZlclZpZXdzID0gYnVmZmVyVmlld3M7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBtZXNoIGRlZmluaXRpb25zIGZvciB0aGUgZ2xURiBKU09OIHdpdGggcG9pbnQgY2xvdWQgcHJpbWl0aXZlcy5cbiAgICogTWFwcyBEcmFjbyBhdHRyaWJ1dGUgbmFtZXMgdG8gZ2xURiBhdHRyaWJ1dGUgc2VtYW50aWNzLlxuICAgKlxuICAgKiBAcGFyYW0gYXR0cmlidXRlTmFtZXMgLSBBcnJheSBvZiBhdHRyaWJ1dGUgbmFtZXMgZnJvbSBEcmFjb1xuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGIEpTT04gb2JqZWN0IHRvIG1vZGlmeVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldE1lc2hlc1RvSlNPTihhdHRyaWJ1dGVOYW1lczogc3RyaW5nW10sIGpzb246IGFueSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IGFueSA9IHt9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWVzW2ldID09PSAnVEVYX0NPT1JEJykge1xuICAgICAgICBhdHRyaWJ1dGVzLlRFWENPT1JEXzAgPSBpO1xuICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGVOYW1lc1tpXSA9PT0gJ0dFTkVSSUMnKSB7XG4gICAgICAgIGF0dHJpYnV0ZXMuVEFOR0VOVCA9IGk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVzW2ldXSA9IGk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWVzaDogYW55ID0ge1xuICAgICAgbmFtZTogJ05vZGUtTWVzaCcsXG4gICAgICBwcmltaXRpdmVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtb2RlOiAwLFxuICAgICAgICAgIG1hdGVyaWFsOiAwLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICBqc29uLm1lc2hlcyA9IFttZXNoXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnRzIGEgRHJhY28gcG9pbnQgY2xvdWQgZmlsZSBhbmQgY29udmVydHMgaXQgZGlyZWN0bHkgdG8gYSBSaG9kb25pdGUgUHJpbWl0aXZlLlxuICAgKiBUaGlzIG1ldGhvZCBieXBhc3NlcyBnbFRGIGNvbnZlcnNpb24gZm9yIGRpcmVjdCBwcmltaXRpdmUgY3JlYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJJIG9mIHRoZSAuZHJjIGZpbGUgdG8gaW1wb3J0XG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgUmhvZG9uaXRlIFByaW1pdGl2ZSBvYmplY3RcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBpbXBvcnRlciA9IERyY1BvaW50Q2xvdWRJbXBvcnRlci5nZXRJbnN0YW5jZSgpO1xuICAgKiBjb25zdCBwcmltaXRpdmUgPSBhd2FpdCBpbXBvcnRlci5pbXBvcnRQb2ludENsb3VkVG9QcmltaXRpdmUoJ3BhdGgvdG8vcG9pbnRjbG91ZC5kcmMnKTtcbiAgICogLy8gVXNlIHRoZSBwcmltaXRpdmUgZGlyZWN0bHkgaW4gUmhvZG9uaXRlXG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0UG9pbnRDbG91ZFRvUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lLCB1cmk6IHN0cmluZyk6IFByb21pc2U8UHJpbWl0aXZlPiB7XG4gICAgY29uc3Qgcl9hcnJheUJ1ZmZlciA9IGF3YWl0IERhdGFVdGlsLmZldGNoQXJyYXlCdWZmZXIodXJpKTtcbiAgICByZXR1cm4gdGhpcy5fX2RlY29kZURyYWNvVG9QcmltaXRpdmUoZW5naW5lLCByX2FycmF5QnVmZmVyLnVud3JhcEZvcmNlKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY29kZXMgYSBEcmFjbyBjb21wcmVzc2VkIEFycmF5QnVmZmVyIGRpcmVjdGx5IHRvIGEgUmhvZG9uaXRlIFByaW1pdGl2ZS5cbiAgICogVGhpcyBtZXRob2QgcHJvdmlkZXMgdGhlIG1vc3QgZGlyZWN0IHBhdGggZnJvbSBEcmFjbyBkYXRhIHRvIFJob2Rvbml0ZSBnZW9tZXRyeS5cbiAgICogTm90ZTogVGFuZ2VudCBhdHRyaWJ1dGVzIGFyZSBub3QgY3VycmVudGx5IHN1cHBvcnRlZC5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5QnVmZmVyIC0gVGhlIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgRHJhY28gY29tcHJlc3NlZCBkYXRhXG4gICAqIEByZXR1cm5zIFRoZSBkZWNvZGVkIFJob2Rvbml0ZSBQcmltaXRpdmVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19kZWNvZGVEcmFjb1RvUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lLCBhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBjb25zdCBkcmFjbyA9IG5ldyBEcmFjb0RlY29kZXJNb2R1bGUoKTtcbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IGRyYWNvLkRlY29kZXIoKTtcbiAgICBjb25zdCBkcmFjb0dlb21ldHJ5ID0gdGhpcy5fX2dldEdlb21ldHJ5RnJvbURyYWNvQnVmZmVyKGRyYWNvLCBkZWNvZGVyLCBhcnJheUJ1ZmZlcik7XG4gICAgaWYgKGRyYWNvR2VvbWV0cnkgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGRyYWNvR2VvbWV0cnkuJyk7XG4gICAgfVxuICAgIGlmIChkcmFjb0dlb21ldHJ5Lmdlb21ldHJ5VHlwZSAhPT0gZHJhY28uUE9JTlRfQ0xPVUQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBnZW9tZXRyeVR5cGUgb2YgZHJjIGZpbGUuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlQ29tcG9zaXRpb25UeXBlczogQXJyYXk8Q29tcG9zaXRpb25UeXBlRW51bT4gPSBbXTtcbiAgICBjb25zdCBhdHRyaWJ1dGVTZW1hbnRpY3M6IEFycmF5PFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiBBcnJheTxUeXBlZEFycmF5PiA9IFtdO1xuXG4gICAgdGhpcy5fX2dldFBvc2l0aW9ucyhkcmFjbywgZGVjb2RlciwgZHJhY29HZW9tZXRyeSwgYXR0cmlidXRlQ29tcG9zaXRpb25UeXBlcywgYXR0cmlidXRlU2VtYW50aWNzLCBhdHRyaWJ1dGVzKTtcbiAgICB0aGlzLl9fZ2V0Q29sb3JzKGRyYWNvLCBkZWNvZGVyLCBkcmFjb0dlb21ldHJ5LCBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MsIGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuX19nZXROb3JtYWxzKGRyYWNvLCBkZWNvZGVyLCBkcmFjb0dlb21ldHJ5LCBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MsIGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuX19nZXRUZXh0dXJlQ29vcmRzKGRyYWNvLCBkZWNvZGVyLCBkcmFjb0dlb21ldHJ5LCBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MsIGF0dHJpYnV0ZXMpO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmNyZWF0ZVByaW1pdGl2ZShlbmdpbmUsIHtcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogYXR0cmlidXRlU2VtYW50aWNzLFxuICAgICAgYXR0cmlidXRlczogYXR0cmlidXRlcyxcbiAgICAgIG1hdGVyaWFsOiBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgICBpc1NraW5uaW5nOiBmYWxzZSxcbiAgICAgICAgaXNMaWdodGluZzogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgcHJpbWl0aXZlTW9kZTogUHJpbWl0aXZlTW9kZS5Qb2ludHMsXG4gICAgfSk7XG5cbiAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG5cbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIGFuZCB2YWxpZGF0ZXMgRHJhY28gZ2VvbWV0cnkgZnJvbSBhIGNvbXByZXNzZWQgYnVmZmVyLlxuICAgKiBTdXBwb3J0cyBib3RoIHRyaWFuZ3VsYXIgbWVzaCBhbmQgcG9pbnQgY2xvdWQgZ2VvbWV0cnkgdHlwZXMuXG4gICAqXG4gICAqIEBwYXJhbSBkcmFjbyAtIFRoZSBEcmFjbyBkZWNvZGVyIG1vZHVsZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZGVjb2RlciAtIFRoZSBEcmFjbyBkZWNvZGVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBBcnJheUJ1ZmZlciBjb250YWluaW5nIGNvbXByZXNzZWQgZ2VvbWV0cnlcbiAgICogQHJldHVybnMgVGhlIGRlY29kZWQgRHJhY28gZ2VvbWV0cnkgb2JqZWN0LCBvciB1bmRlZmluZWQgaWYgZGVjb2RpbmcgZmFpbHNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19nZXRHZW9tZXRyeUZyb21EcmFjb0J1ZmZlcihkcmFjbzogYW55LCBkZWNvZGVyOiBhbnksIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBkcmFjby5EZWNvZGVyQnVmZmVyKCk7XG4gICAgYnVmZmVyLkluaXQobmV3IEludDhBcnJheShhcnJheUJ1ZmZlciksIGFycmF5QnVmZmVyLmJ5dGVMZW5ndGgpO1xuICAgIGNvbnN0IGdlb21ldHJ5VHlwZSA9IGRlY29kZXIuR2V0RW5jb2RlZEdlb21ldHJ5VHlwZShidWZmZXIpO1xuICAgIGxldCBkcmFjb0dlb21ldHJ5OiBhbnk7XG4gICAgbGV0IGRlY29kaW5nU3RhdHVzOiBhbnk7XG4gICAgaWYgKGdlb21ldHJ5VHlwZSA9PT0gZHJhY28uVFJJQU5HVUxBUl9NRVNIKSB7XG4gICAgICBkcmFjb0dlb21ldHJ5ID0gbmV3IGRyYWNvLk1lc2goKTtcbiAgICAgIGRlY29kaW5nU3RhdHVzID0gZGVjb2Rlci5EZWNvZGVCdWZmZXJUb01lc2goYnVmZmVyLCBkcmFjb0dlb21ldHJ5KTtcbiAgICB9IGVsc2UgaWYgKGdlb21ldHJ5VHlwZSA9PT0gZHJhY28uUE9JTlRfQ0xPVUQpIHtcbiAgICAgIGRyYWNvR2VvbWV0cnkgPSBuZXcgZHJhY28uUG9pbnRDbG91ZCgpO1xuICAgICAgZGVjb2RpbmdTdGF0dXMgPSBkZWNvZGVyLkRlY29kZUJ1ZmZlclRvUG9pbnRDbG91ZChidWZmZXIsIGRyYWNvR2VvbWV0cnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9ICdVbmtub3duIGdlb21ldHJ5IHR5cGUuJztcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBkcmFjb0dlb21ldHJ5Lmdlb21ldHJ5VHlwZSA9IGdlb21ldHJ5VHlwZTsgLy8gc3RvcmVcblxuICAgIGlmICghZGVjb2RpbmdTdGF0dXMub2soKSB8fCBkcmFjb0dlb21ldHJ5LnB0ciA9PT0gMCkge1xuICAgICAgbGV0IGVycm9yTXNnID0gJ0RlY29kaW5nIGZhaWxlZDogJztcbiAgICAgIGVycm9yTXNnICs9IGRlY29kaW5nU3RhdHVzLmVycm9yX21zZygpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoZXJyb3JNc2cpO1xuICAgICAgZHJhY28uZGVzdHJveShkZWNvZGVyKTtcbiAgICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgICBkcmFjby5kZXN0cm95KGJ1ZmZlcik7XG5cbiAgICByZXR1cm4gZHJhY29HZW9tZXRyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyBwb3NpdGlvbiBhdHRyaWJ1dGUgZGF0YSBmcm9tIERyYWNvIGdlb21ldHJ5LlxuICAgKiBQb3NpdGlvbiBkYXRhIGlzIHJlcXVpcmVkIGZvciBhbGwgcG9pbnQgY2xvdWRzLlxuICAgKlxuICAgKiBAcGFyYW0gZHJhY28gLSBUaGUgRHJhY28gZGVjb2RlciBtb2R1bGUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGRlY29kZXIgLSBUaGUgRHJhY28gZGVjb2RlciBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZHJhY29HZW9tZXRyeSAtIFRoZSBkZWNvZGVkIERyYWNvIGdlb21ldHJ5XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzIC0gQXJyYXkgdG8gc3RvcmUgY29tcG9zaXRpb24gdHlwZXNcbiAgICogQHBhcmFtIGF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IHRvIHN0b3JlIGF0dHJpYnV0ZSBzZW1hbnRpY3NcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBBcnJheSB0byBzdG9yZSBhdHRyaWJ1dGUgZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgZXh0cmFjdGVkIHBvc2l0aW9uIGRhdGEgYXMgRmxvYXQzMkFycmF5XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0UG9zaXRpb25zKFxuICAgIGRyYWNvOiBhbnksXG4gICAgZGVjb2RlcjogYW55LFxuICAgIGRyYWNvR2VvbWV0cnk6IGFueSxcbiAgICBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPixcbiAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IEFycmF5PFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZz4sXG4gICAgYXR0cmlidXRlczogQXJyYXk8VHlwZWRBcnJheT5cbiAgKSB7XG4gICAgY29uc3QgcG9zQXR0SWQgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvLlBPU0lUSU9OKTtcbiAgICBpZiAocG9zQXR0SWQgPT09IC0xKSB7XG4gICAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgICAgZHJhY28uZGVzdHJveShkcmFjb0dlb21ldHJ5KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRHJhY286IE5vIHBvc2l0aW9uIGF0dHJpYnV0ZSBmb3VuZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NBdHRyaWJ1dGUgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZShkcmFjb0dlb21ldHJ5LCBwb3NBdHRJZCk7XG4gICAgY29uc3QgcG9zQXR0cmlidXRlRGF0YSA9IG5ldyBkcmFjby5EcmFjb0Zsb2F0MzJBcnJheSgpO1xuICAgIGRlY29kZXIuR2V0QXR0cmlidXRlRmxvYXRGb3JBbGxQb2ludHMoZHJhY29HZW9tZXRyeSwgcG9zQXR0cmlidXRlLCBwb3NBdHRyaWJ1dGVEYXRhKTtcblxuICAgIGNvbnN0IG51bVBvaW50cyA9IGRyYWNvR2VvbWV0cnkubnVtX3BvaW50cygpO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gbnVtUG9pbnRzICogMztcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXM7IGkgKz0gMSkge1xuICAgICAgcG9zaXRpb25zW2ldID0gcG9zQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpKTsgLy8gWFlaIFhZWlxuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXMucHVzaChDb21wb3NpdGlvblR5cGUuVmVjMyk7XG4gICAgYXR0cmlidXRlU2VtYW50aWNzLnB1c2goVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgYXR0cmlidXRlcy5wdXNoKHBvc2l0aW9ucyk7XG5cbiAgICBkcmFjby5kZXN0cm95KHBvc0F0dHJpYnV0ZURhdGEpO1xuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgY29sb3IgYXR0cmlidXRlIGRhdGEgZnJvbSBEcmFjbyBnZW9tZXRyeSBpZiBwcmVzZW50LlxuICAgKiBIYW5kbGVzIGJvdGggUkdCIGFuZCBSR0JBIGNvbG9yIGZvcm1hdHMsIGVuc3VyaW5nIFJHQkEgb3V0cHV0LlxuICAgKlxuICAgKiBAcGFyYW0gZHJhY28gLSBUaGUgRHJhY28gZGVjb2RlciBtb2R1bGUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGRlY29kZXIgLSBUaGUgRHJhY28gZGVjb2RlciBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZHJhY29HZW9tZXRyeSAtIFRoZSBkZWNvZGVkIERyYWNvIGdlb21ldHJ5XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzIC0gQXJyYXkgdG8gc3RvcmUgY29tcG9zaXRpb24gdHlwZXNcbiAgICogQHBhcmFtIGF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IHRvIHN0b3JlIGF0dHJpYnV0ZSBzZW1hbnRpY3NcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBBcnJheSB0byBzdG9yZSBhdHRyaWJ1dGUgZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgZXh0cmFjdGVkIGNvbG9yIGRhdGEgYXMgRmxvYXQzMkFycmF5LCBvciBudWxsIGlmIG5vdCBwcmVzZW50XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0Q29sb3JzKFxuICAgIGRyYWNvOiBhbnksXG4gICAgZGVjb2RlcjogYW55LFxuICAgIGRyYWNvR2VvbWV0cnk6IGFueSxcbiAgICBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPixcbiAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IEFycmF5PFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZz4sXG4gICAgYXR0cmlidXRlczogQXJyYXk8VHlwZWRBcnJheT5cbiAgKSB7XG4gICAgLy8gR2V0IGNvbG9yIGF0dHJpYnV0ZXMgaWYgZXhpc3RzLlxuICAgIGNvbnN0IGNvbG9yQXR0SWQgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvLkNPTE9SKTtcbiAgICBpZiAoY29sb3JBdHRJZCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKCdMb2FkZWQgY29sb3IgYXR0cmlidXRlLicpO1xuXG4gICAgY29uc3QgY29sQXR0cmlidXRlID0gZGVjb2Rlci5HZXRBdHRyaWJ1dGUoZHJhY29HZW9tZXRyeSwgY29sb3JBdHRJZCk7XG4gICAgY29uc3QgY29sQXR0cmlidXRlRGF0YSA9IG5ldyBkcmFjby5EcmFjb0Zsb2F0MzJBcnJheSgpO1xuICAgIGRlY29kZXIuR2V0QXR0cmlidXRlRmxvYXRGb3JBbGxQb2ludHMoZHJhY29HZW9tZXRyeSwgY29sQXR0cmlidXRlLCBjb2xBdHRyaWJ1dGVEYXRhKTtcblxuICAgIGNvbnN0IG51bVBvaW50cyA9IGRyYWNvR2VvbWV0cnkubnVtX3BvaW50cygpO1xuICAgIGNvbnN0IG51bUNvbXBvbmVudHMgPSBjb2xBdHRyaWJ1dGUubnVtX2NvbXBvbmVudHMoKTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IG51bVBvaW50cyAqIDQ7XG4gICAgY29uc3QgY29sb3JzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1WZXJ0aWNlczsgaSArPSBudW1Db21wb25lbnRzKSB7XG4gICAgICBjb2xvcnNbaV0gPSBjb2xBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkpO1xuICAgICAgY29sb3JzW2kgKyAxXSA9IGNvbEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSArIDEpO1xuICAgICAgY29sb3JzW2kgKyAyXSA9IGNvbEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSArIDIpO1xuICAgICAgaWYgKG51bUNvbXBvbmVudHMgPT09IDQpIHtcbiAgICAgICAgY29sb3JzW2kgKyAzXSA9IGNvbEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSArIDMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29sb3JzW2kgKyAzXSA9IDEuMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzLnB1c2goQ29tcG9zaXRpb25UeXBlLlZlYzMpO1xuICAgIGF0dHJpYnV0ZVNlbWFudGljcy5wdXNoKFZlcnRleEF0dHJpYnV0ZS5Db2xvcjAuWFlaKTtcbiAgICBhdHRyaWJ1dGVzLnB1c2goY29sb3JzKTtcblxuICAgIGRyYWNvLmRlc3Ryb3koY29sQXR0cmlidXRlRGF0YSk7XG4gICAgcmV0dXJuIGNvbG9ycztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyBub3JtYWwgYXR0cmlidXRlIGRhdGEgZnJvbSBEcmFjbyBnZW9tZXRyeSBpZiBwcmVzZW50LlxuICAgKiBOb3JtYWwgdmVjdG9ycyBhcmUgdXNlZCBmb3IgbGlnaHRpbmcgY2FsY3VsYXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZHJhY28gLSBUaGUgRHJhY28gZGVjb2RlciBtb2R1bGUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGRlY29kZXIgLSBUaGUgRHJhY28gZGVjb2RlciBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZHJhY29HZW9tZXRyeSAtIFRoZSBkZWNvZGVkIERyYWNvIGdlb21ldHJ5XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzIC0gQXJyYXkgdG8gc3RvcmUgY29tcG9zaXRpb24gdHlwZXNcbiAgICogQHBhcmFtIGF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IHRvIHN0b3JlIGF0dHJpYnV0ZSBzZW1hbnRpY3NcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBBcnJheSB0byBzdG9yZSBhdHRyaWJ1dGUgZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgZXh0cmFjdGVkIG5vcm1hbCBkYXRhIGFzIEZsb2F0MzJBcnJheSwgb3IgbnVsbCBpZiBub3QgcHJlc2VudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldE5vcm1hbHMoXG4gICAgZHJhY286IGFueSxcbiAgICBkZWNvZGVyOiBhbnksXG4gICAgZHJhY29HZW9tZXRyeTogYW55LFxuICAgIGF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXM6IEFycmF5PENvbXBvc2l0aW9uVHlwZUVudW0+LFxuICAgIGF0dHJpYnV0ZVNlbWFudGljczogQXJyYXk8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nPixcbiAgICBhdHRyaWJ1dGVzOiBBcnJheTxUeXBlZEFycmF5PlxuICApIHtcbiAgICAvLyBHZXQgbm9ybWFsIGF0dHJpYnV0ZXMgaWYgZXhpc3RzLlxuICAgIGNvbnN0IG5vcm1hbEF0dElkID0gZGVjb2Rlci5HZXRBdHRyaWJ1dGVJZChkcmFjb0dlb21ldHJ5LCBkcmFjby5OT1JNQUwpO1xuICAgIGlmIChub3JtYWxBdHRJZCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKCdMb2FkZWQgbm9ybWFsIGF0dHJpYnV0ZS4nKTtcblxuICAgIGNvbnN0IG5vckF0dHJpYnV0ZSA9IGRlY29kZXIuR2V0QXR0cmlidXRlKGRyYWNvR2VvbWV0cnksIG5vcm1hbEF0dElkKTtcbiAgICBjb25zdCBub3JBdHRyaWJ1dGVEYXRhID0gbmV3IGRyYWNvLkRyYWNvRmxvYXQzMkFycmF5KCk7XG4gICAgZGVjb2Rlci5HZXRBdHRyaWJ1dGVGbG9hdEZvckFsbFBvaW50cyhkcmFjb0dlb21ldHJ5LCBub3JBdHRyaWJ1dGUsIG5vckF0dHJpYnV0ZURhdGEpO1xuXG4gICAgY29uc3QgbnVtUG9pbnRzID0gZHJhY29HZW9tZXRyeS5udW1fcG9pbnRzKCk7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBudW1Qb2ludHMgKiAzO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVZlcnRpY2VzOyBpICs9IDEpIHtcbiAgICAgIG5vcm1hbHNbaV0gPSBub3JBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkpOyAvLyBYWVogWFlaXG4gICAgfVxuICAgIGF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXMucHVzaChDb21wb3NpdGlvblR5cGUuVmVjMyk7XG4gICAgYXR0cmlidXRlU2VtYW50aWNzLnB1c2goVmVydGV4QXR0cmlidXRlLk5vcm1hbC5YWVopO1xuICAgIGF0dHJpYnV0ZXMucHVzaChub3JtYWxzKTtcblxuICAgIGRyYWNvLmRlc3Ryb3kobm9yQXR0cmlidXRlRGF0YSk7XG4gICAgcmV0dXJuIG5vcm1hbHM7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgdGV4dHVyZSBjb29yZGluYXRlIGF0dHJpYnV0ZSBkYXRhIGZyb20gRHJhY28gZ2VvbWV0cnkgaWYgcHJlc2VudC5cbiAgICogVGV4dHVyZSBjb29yZGluYXRlcyBhcmUgdXNlZCBmb3IgbWFwcGluZyB0ZXh0dXJlcyBvbnRvIGdlb21ldHJ5LlxuICAgKlxuICAgKiBAcGFyYW0gZHJhY28gLSBUaGUgRHJhY28gZGVjb2RlciBtb2R1bGUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGRlY29kZXIgLSBUaGUgRHJhY28gZGVjb2RlciBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZHJhY29HZW9tZXRyeSAtIFRoZSBkZWNvZGVkIERyYWNvIGdlb21ldHJ5XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzIC0gQXJyYXkgdG8gc3RvcmUgY29tcG9zaXRpb24gdHlwZXNcbiAgICogQHBhcmFtIGF0dHJpYnV0ZVNlbWFudGljcyAtIEFycmF5IHRvIHN0b3JlIGF0dHJpYnV0ZSBzZW1hbnRpY3NcbiAgICogQHBhcmFtIGF0dHJpYnV0ZXMgLSBBcnJheSB0byBzdG9yZSBhdHRyaWJ1dGUgZGF0YVxuICAgKiBAcmV0dXJucyBUaGUgZXh0cmFjdGVkIHRleHR1cmUgY29vcmRpbmF0ZSBkYXRhIGFzIEZsb2F0MzJBcnJheSwgb3IgbnVsbCBpZiBub3QgcHJlc2VudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFRleHR1cmVDb29yZHMoXG4gICAgZHJhY286IGFueSxcbiAgICBkZWNvZGVyOiBhbnksXG4gICAgZHJhY29HZW9tZXRyeTogYW55LFxuICAgIGF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXM6IEFycmF5PENvbXBvc2l0aW9uVHlwZUVudW0+LFxuICAgIGF0dHJpYnV0ZVNlbWFudGljczogQXJyYXk8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nPixcbiAgICBhdHRyaWJ1dGVzOiBBcnJheTxUeXBlZEFycmF5PlxuICApIHtcbiAgICAvLyBHZXQgdGV4dHVyZSBjb29yZGluYXRlIGF0dHJpYnV0ZXMgaWYgZXhpc3RzLlxuICAgIGNvbnN0IHRleENvb3JkQXR0SWQgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvLlRFWF9DT09SRCk7XG4gICAgaWYgKHRleENvb3JkQXR0SWQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgdGV4Q29vcmRBdHRyaWJ1dGUgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZShkcmFjb0dlb21ldHJ5LCB0ZXhDb29yZEF0dElkKTtcbiAgICBjb25zdCB0ZXhDb29yZEF0dHJpYnV0ZURhdGEgPSBuZXcgZHJhY28uRHJhY29GbG9hdDMyQXJyYXkoKTtcbiAgICBkZWNvZGVyLkdldEF0dHJpYnV0ZUZsb2F0Rm9yQWxsUG9pbnRzKGRyYWNvR2VvbWV0cnksIHRleENvb3JkQXR0cmlidXRlLCB0ZXhDb29yZEF0dHJpYnV0ZURhdGEpO1xuXG4gICAgY29uc3QgbnVtUG9pbnRzID0gZHJhY29HZW9tZXRyeS5udW1fcG9pbnRzKCk7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSBudW1Qb2ludHMgKiAyO1xuICAgIGNvbnN0IHRleENvb3JkcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXM7IGkgKz0gMSkge1xuICAgICAgdGV4Q29vcmRzW2ldID0gdGV4Q29vcmRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkpOyAvLyBYWVogWFlaXG4gICAgfVxuICAgIGF0dHJpYnV0ZUNvbXBvc2l0aW9uVHlwZXMucHVzaChDb21wb3NpdGlvblR5cGUuVmVjMik7XG4gICAgYXR0cmlidXRlU2VtYW50aWNzLnB1c2goVmVydGV4QXR0cmlidXRlLlRleGNvb3JkMC5YWSk7XG4gICAgYXR0cmlidXRlcy5wdXNoKHRleENvb3Jkcyk7XG5cbiAgICBkcmFjby5kZXN0cm95KHRleENvb3JkQXR0cmlidXRlRGF0YSk7XG4gICAgcmV0dXJuIHRleENvb3JkcztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUdBLFNBQVMsdUJBQWlEO0FBQzFELFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQWtFO0FBQzNFLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsaUNBQWlDO0FBQzFDLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxlQUFlLHVCQUF1QjtBQUMvQyxTQUFTLEtBQUssVUFBdUI7QUFDckMsU0FBUyxpQkFBaUI7QUFXbkIsSUFBTSx3QkFBTixNQUFNLHVCQUFzQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTXpCLGNBQWM7QUFBQSxFQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFvQnZCLE1BQU0saUJBQWlCLEtBQWEsU0FBNEU7QUFDOUcsVUFBTSxXQUFXLEdBQUcsSUFBSSxVQUFVLEdBQUcsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBQzFELFVBQU0saUJBQWlCLFNBQVMseUJBQXlCO0FBRXpELFFBQUksbUNBQVMsT0FBTztBQUNsQixp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QWEsS0FBSyxHQUFHO0FBQ3ZDLGNBQVEsQ0FBQyxJQUFJLGlCQUFpQixTQUFTLENBQUM7QUFBQSxJQUMxQztBQUNBLDhCQUEwQixLQUFLLGdCQUFnQixJQUFJO0FBQ25ELHVCQUFtQixLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFDbEQsZUFBVyxLQUFLLE9BQU87QUFFdkIsVUFBTSxRQUFRLGdCQUFnQjtBQUM5QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFlUUMsR0FDTixPQUNBLFNBQ0EsZUFDQSwyQkFDQSxvQkFDQSxZQUNBO0FBRUEsVUFBTSxnQkFBZ0IsUUFBUSxlQUFlLGVBQWUsTUFBTSxTQUFTO0FBQzNFLFFBQUksa0JBQWtCLElBQUk7QUFDeEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLG9CQUFvQixRQUFRLGFBQWEsZUFBZSxhQUFhO0FBQzNFLFVBQU0sd0JBQXdCLElBQUksTUFBTSxrQkFBa0I7QUFDMUQsWUFBUSw4QkFBOEIsZUFBZSxtQkFBbUIscUJBQXFCO0FBRTdGLFVBQU0sWUFBWSxjQUFjLFdBQVc7QUFDM0MsVUFBTSxjQUFjLFlBQVk7QUFDaEMsVUFBTSxZQUFZLElBQUksYUFBYSxXQUFXO0FBQzlDLGFBQVMsSUFBSSxHQUFHLElBQUksYUFBYSxLQUFLLEdBQUc7QUFDdkMsZ0JBQVUsQ0FBQyxJQUFJLHNCQUFzQixTQUFTLENBQUM7QUFBQSxJQUNqRDtBQUNBLDhCQUEwQixLQUFLLGdCQUFnQixJQUFJO0FBQ25ELHVCQUFtQixLQUFLLGdCQUFnQixVQUFVLEVBQUU7QUFDcEQsZUFBVyxLQUFLLFNBQVM7QUFFekIsVUFBTSxRQUFRLHFCQUFxQjtBQUNuQyxXQUFPO0FBQUEsRUFDVDtBQUNGOyIsCiAgIm5hbWVzIjogWyJybm0yIiwgIl9fZGVjb2RlRHJhY28iLCAiX19sb2FkRnJvbUFycmF5QnVmZmVyIiwgIl9faW5zdGFuY2UiLCAiX19kZWNvZGVCdWZmZXIiLCAiX19nZXRHZW9tZXRyeUZyb21EcmFjb0J1ZmZlciIsICJfX2RlY29kZWRCdWZmZXJUb0pTT04iLCAiX19zZXRCdWZmZXJzVG9KU09OIiwgIl9fc2V0QWNjZXNzb3JzQW5kQnVmZmVyVmlld3NUb0pTT04iLCAiX19zZXRNZXNoZXNUb0pTT04iLCAiX19jb252ZXJ0QnVmZmVyVG9VUkkiLCAiX19kZWNvZGVEcmFjb1RvUHJpbWl0aXZlIiwgIl9fZ2V0UG9zaXRpb25zIiwgIl9fZ2V0Q29sb3JzIiwgIl9fZ2V0Tm9ybWFscyIsICJfX2dldFRleHR1cmVDb29yZHMiXQp9Cg==
