// src/foundation/importer/Gltf2Importer.ts
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { ifDefinedThen } from "../misc/MiscUtil.js";
import { Err, Ok } from "../misc/Result.js";
import { RnPromise } from "../misc/RnPromise.js";
var Gltf2Importer = class {
  constructor() {
  }
  /**
   * Imports a glTF2 file from a URL and processes it into RnM2 format.
   * Automatically detects whether the file is in .gltf or .glb format.
   *
   * @param url - The URL of the glTF file to import
   * @param options - Optional configuration for the loading process
   * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
   * @throws Will reject if the file cannot be fetched or processed
   *
   * @example
   * ```typescript
   * const gltfData = await Gltf2Importer.importFromUrl('path/to/model.gltf', {
   *   cameraComponent: CameraComponent,
   *   lightComponent: LightComponent
   * });
   * ```
   */
  static async importFromUrl(url, options) {
    var _a;
    const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);
    if (r_arrayBuffer.isErr()) {
      throw r_arrayBuffer.getRnError();
    }
    const result = await this._importGltfOrGlbFromArrayBuffers(r_arrayBuffer.get(), (_a = options == null ? void 0 : options.files) != null ? _a : {}, options, url);
    return result.unwrapForce();
  }
  /**
   * Imports glTF2 data from a collection of ArrayBuffer files.
   * Automatically identifies the main glTF or GLB file from the provided files.
   *
   * @param files - A collection of file buffers where keys are filenames and values are ArrayBuffers
   * @param options - Optional configuration for the loading process
   * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
   * @throws Will reject if no glTF or GLB file is found in the provided files
   *
   * @example
   * ```typescript
   * const files = {
   *   'model.gltf': gltfBuffer,
   *   'texture.jpg': textureBuffer
   * };
   * const gltfData = await Gltf2Importer.importFromArrayBuffers(files);
   * ```
   */
  static async importFromArrayBuffers(files, options) {
    for (const fileName in files) {
      const fileExtension = DataUtil.getExtension(fileName);
      if (fileExtension === "gltf" || fileExtension === "glb" || fileExtension === "rnb") {
        const result = await this._importGltfOrGlbFromArrayBuffers(files[fileName], files, options);
        return result.unwrapForce();
      }
    }
    throw new Error("no gltf or glb file found");
  }
  /**
   * Internal method to import glTF2 data from ArrayBuffer, handling both .gltf and .glb formats.
   * Determines the file format by checking the magic number and processes accordingly.
   *
   * @param arrayBuffer - The main glTF/GLB file as ArrayBuffer
   * @param otherFiles - Additional resource files (textures, bins) as ArrayBuffers
   * @param options - Optional configuration for the loading process
   * @param uri - Optional URI of the glTF file for resolving relative paths
   * @returns A Result containing the processed RnM2 data or an error
   *
   * @internal
   */
  static async _importGltfOrGlbFromArrayBuffers(arrayBuffer, otherFiles, options, uri) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const magic = dataView.getUint32(0, true);
    if (magic !== 1179937895) {
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      try {
        const gltfJson = await this._importGltf(json, otherFiles, options, uri);
        return new Ok(gltfJson);
      } catch {
        return new Err({
          message: "this.__importGltf error",
          error: void 0
        });
      }
    } else {
      try {
        const gltfJson = await this._importGlb(arrayBuffer, otherFiles, options);
        return new Ok(gltfJson);
      } catch {
        return new Err({
          message: "this.importGlb error",
          error: void 0
        });
      }
    }
  }
  /**
   * Merges default options with glTF asset extras and user-provided options.
   * Handles loader extension initialization based on the extension name.
   *
   * @param defaultOptions - The base default options to merge into
   * @param json - The glTF JSON data that may contain loader options in asset.extras
   * @param options - User-provided options to override defaults
   * @returns The merged and processed options object
   *
   * @internal
   */
  static _getOptions(defaultOptions, json, options) {
    var _a, _b;
    if (((_b = (_a = json.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) != null) {
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
   * Imports and processes a binary glTF (.glb) file from ArrayBuffer.
   * Validates the GLB format, extracts JSON and binary chunks, and processes the content.
   *
   * @param arrayBuffer - The GLB file data as ArrayBuffer
   * @param files - Additional resource files for resolving dependencies
   * @param options - Configuration options for the loading process
   * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
   * @throws Will throw if the GLB format is invalid or unsupported
   *
   * @internal
   */
  static async _importGlb(arrayBuffer, files, options) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const gltfVer = dataView.getUint32(4, true);
    if (gltfVer !== 2) {
      throw new Error("invalid version field in this binary glTF file.");
    }
    const lengthOfJSonChunkData = dataView.getUint32(12, true);
    const chunkType = dataView.getUint32(16, true);
    if (chunkType !== 1313821514) {
      throw new Error("invalid chunkType of chunk0 in this binary glTF file.");
    }
    const uint8ArrayJSonContent = new Uint8Array(arrayBuffer, 20, lengthOfJSonChunkData);
    const gotText = DataUtil.uint8ArrayToString(uint8ArrayJSonContent);
    const gltfJson = JSON.parse(gotText);
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);
    const uint8array = new Uint8Array(arrayBuffer, 20 + lengthOfJSonChunkData + 8);
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;
    try {
      await this._loadInner(gltfJson, files, options, uint8array);
    } catch (err) {
      Logger.default.info(`this._loadInner error in _loadAsBinaryJson: ${err}`);
    }
    return gltfJson;
  }
  /**
   * Imports and processes a JSON glTF (.gltf) file with external resources.
   * Handles resource loading from external files and applies processing options.
   *
   * @param gltfJson - The parsed glTF JSON data
   * @param fileArrayBuffers - Collection of external resource files
   * @param options - Configuration options for the loading process
   * @param uri - Optional base URI for resolving relative resource paths
   * @param callback - Optional callback for progress tracking
   * @returns A Promise that resolves to the processed glTF2 data in RnM2 format
   *
   * @internal
   */
  static async _importGltf(gltfJson, fileArrayBuffers, options, uri, callback) {
    const basePath = `${uri == null ? void 0 : uri.substring(0, uri == null ? void 0 : uri.lastIndexOf("/"))}/`;
    if (gltfJson.asset.extras === void 0) {
      gltfJson.asset.extras = { fileType: "glTF", version: "2" };
    }
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;
    try {
      await this._loadInner(gltfJson, fileArrayBuffers, options, void 0, basePath, callback);
    } catch (err) {
      Logger.default.error(`this._loadInner error in _loadAsTextJson: ${err}`);
    }
    return gltfJson;
  }
  /**
   * Orchestrates the loading of resources and JSON content processing.
   * Creates promises for both resource loading and JSON dependency resolution.
   *
   * @param gltfJson - The glTF JSON data to process
   * @param files - Collection of resource files
   * @param options - Loading configuration options
   * @param uint8arrayOfGlb - Optional binary data from GLB file
   * @param basePath - Optional base path for resolving relative URIs
   * @param callback - Optional progress callback
   * @returns A Promise that resolves when all loading operations complete
   *
   * @internal
   */
  static _loadInner(gltfJson, files, options, uint8arrayOfGlb, basePath, callback) {
    this._normalizeOptionalArrays(gltfJson);
    const promises = [];
    promises.push(this._loadResources(uint8arrayOfGlb, gltfJson, files, options, basePath, callback));
    promises.push(
      new RnPromise((resolve) => {
        this._loadJsonContent(gltfJson);
        resolve();
      })
    );
    return RnPromise.all(promises);
  }
  /**
   * Normalizes optional glTF collection properties for the internal RnM2
   * processing pipeline. A valid glTF document may omit every collection that
   * it does not use, including buffers for collision-only scenes.
   */
  static _normalizeOptionalArrays(gltfJson) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    (_a = gltfJson.accessors) != null ? _a : gltfJson.accessors = [];
    (_b = gltfJson.animations) != null ? _b : gltfJson.animations = [];
    (_c = gltfJson.buffers) != null ? _c : gltfJson.buffers = [];
    (_d = gltfJson.bufferViews) != null ? _d : gltfJson.bufferViews = [];
    (_e = gltfJson.cameras) != null ? _e : gltfJson.cameras = [];
    (_f = gltfJson.images) != null ? _f : gltfJson.images = [];
    (_g = gltfJson.materials) != null ? _g : gltfJson.materials = [];
    (_h = gltfJson.meshes) != null ? _h : gltfJson.meshes = [];
    (_i = gltfJson.nodes) != null ? _i : gltfJson.nodes = [];
    (_j = gltfJson.samplers) != null ? _j : gltfJson.samplers = [];
    (_k = gltfJson.skins) != null ? _k : gltfJson.skins = [];
    (_l = gltfJson.textures) != null ? _l : gltfJson.textures = [];
    (_m = gltfJson.extensionsUsed) != null ? _m : gltfJson.extensionsUsed = [];
    (_n = gltfJson.extensionsRequired) != null ? _n : gltfJson.extensionsRequired = [];
    (_o = gltfJson.extensions) != null ? _o : gltfJson.extensions = {};
    (_p = gltfJson.scenes) != null ? _p : gltfJson.scenes = [{ nodes: [] }];
    (_q = gltfJson.scene) != null ? _q : gltfJson.scene = 0;
  }
  /**
   * Processes the glTF JSON content by resolving all internal dependencies.
   * Sets up object references between scenes, nodes, meshes, materials, textures, etc.
   *
   * @param gltfJson - The glTF JSON data to process
   *
   * @internal
   */
  static _loadJsonContent(gltfJson) {
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
   * Resolves dependencies for glTF scenes by linking node references.
   * Creates nodesObjects array with direct references to node objects.
   *
   * @param gltfJson - The glTF JSON data containing scenes
   *
   * @internal
   */
  static _loadDependenciesOfScenes(gltfJson) {
    for (const scene of gltfJson.scenes) {
      if (Is.undefined(scene.nodesObjects)) {
        scene.nodesObjects = [];
      }
      for (const i of scene.nodes) {
        scene.nodesObjects[i] = gltfJson.nodes[scene.nodes[i]];
      }
    }
  }
  /**
   * Resolves dependencies for glTF nodes including hierarchy, meshes, skins, cameras, and lights.
   * Establishes parent-child relationships and links to associated objects.
   *
   * @param gltfJson - The glTF JSON data containing nodes
   *
   * @internal
   */
  static _loadDependenciesOfNodes(gltfJson) {
    var _a, _b;
    for (const node_i in gltfJson.nodes) {
      const node = gltfJson.nodes[node_i];
      node.childrenObjects = (_a = node.childrenObjects) != null ? _a : [];
      if (node.children) {
        for (const child_i of node.children) {
          node.childrenObjects[child_i] = gltfJson.nodes[child_i];
          gltfJson.nodes[child_i].parent = Number.parseInt(node_i, 10);
          gltfJson.nodes[child_i].parentObject = node;
        }
      }
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshObject = gltfJson.meshes[node.mesh];
      }
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinObject = gltfJson.skins[node.skin];
        if (Is.exist(node.skinObject)) {
          if (Is.not.exist((_b = node.meshObject) == null ? void 0 : _b.extras)) {
            node.meshObject.extras = {};
          }
          node.meshObject.extras._skin = node.skin;
        }
      }
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraObject = gltfJson.cameras[node.camera];
      }
      if (node.extensions !== void 0 && node.extensions.KHR_lights_punctual !== void 0 && gltfJson.extensions !== void 0 && gltfJson.extensions.KHR_lights_punctual !== void 0) {
        node.extensions.KHR_lights_punctual.lightIndex = node.extensions.KHR_lights_punctual.light;
        node.extensions.KHR_lights_punctual.light = gltfJson.extensions.KHR_lights_punctual.lights[node.extensions.KHR_lights_punctual.lightIndex];
      }
    }
  }
  /**
   * Resolves dependencies for glTF meshes including materials, attributes, indices, and morph targets.
   * Handles material variants and creates direct object references for efficient access.
   *
   * @param gltfJson - The glTF JSON data containing meshes
   *
   * @internal
   */
  static _loadDependenciesOfMeshes(gltfJson) {
    var _a;
    if (Is.not.exist(gltfJson.meshes)) {
      return;
    }
    for (const mesh of gltfJson.meshes) {
      for (const primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialObject = gltfJson.materials[primitive.material];
        }
        if (((_a = primitive.extensions) == null ? void 0 : _a.KHR_materials_variants) != null) {
          primitive.materialVariants = [];
          const mappings = primitive.extensions.KHR_materials_variants.mappings;
          const variantNames = gltfJson.extensions.KHR_materials_variants.variants;
          for (const mapping of mappings) {
            const variants = mapping.variants.map((variantIdx) => {
              return variantNames[variantIdx].name;
            });
            const materialVariant = {
              materialObject: gltfJson.materials[mapping.material],
              material: mapping.material,
              variants
            };
            primitive.materialVariants.push(materialVariant);
          }
        }
        primitive.attributesObjects = {};
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
   * Checks if the glTF model contains Rhodonite-specific loader options in asset extras.
   *
   * @param gltfModel - The glTF model to check
   * @returns True if rnLoaderOptions exist in asset.extras, false otherwise
   *
   * @internal
   */
  static _checkRnGltfLoaderOptionsExist(gltfModel) {
    var _a;
    if ((_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) {
      return true;
    }
    return false;
  }
  /**
   * Resolves dependencies for glTF materials including all texture references.
   * Handles PBR textures, normal maps, occlusion, emissive, and various extensions
   * like clearcoat, transmission, sheen, specular, iridescence, anisotropy, and MToon.
   *
   * @param gltfJson - The glTF JSON data containing materials
   *
   * @internal
   */
  static _loadDependenciesOfMaterials(gltfJson) {
    if (!gltfJson.textures) gltfJson.textures = [];
    if (gltfJson.materials) {
      for (const material of gltfJson.materials) {
        this._loadBasicMaterialTextures(gltfJson, material);
        this._loadMaterialExtensions(gltfJson, material);
      }
    }
  }
  static _loadBasicMaterialTextures(gltfJson, material) {
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
  static _loadMaterialExtensions(gltfJson, material) {
    if (Is.exist(material.extensions)) {
      const extensions = material.extensions;
      this._loadKHRExtensions(gltfJson, extensions);
      this._loadVRMCExtensions(gltfJson, extensions);
    }
  }
  static _loadKHRExtensions(gltfJson, extensions) {
    if (Is.exist(extensions.KHR_materials_clearcoat)) {
      const clearcoatTexture = extensions.KHR_materials_clearcoat.clearcoatTexture;
      if (clearcoatTexture !== void 0) {
        clearcoatTexture.texture = gltfJson.textures[clearcoatTexture.index];
      }
      const clearcoatRoughnessTexture = extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture;
      if (clearcoatRoughnessTexture !== void 0) {
        clearcoatRoughnessTexture.texture = gltfJson.textures[clearcoatRoughnessTexture.index];
      }
      const clearcoatNormalTexture = extensions.KHR_materials_clearcoat.clearcoatNormalTexture;
      if (clearcoatNormalTexture !== void 0) {
        clearcoatNormalTexture.texture = gltfJson.textures[clearcoatNormalTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_transmission)) {
      const transmissionTexture = extensions.KHR_materials_transmission.transmissionTexture;
      if (transmissionTexture !== void 0) {
        transmissionTexture.texture = gltfJson.textures[transmissionTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_volume)) {
      const thicknessTexture = extensions.KHR_materials_volume.thicknessTexture;
      if (thicknessTexture !== void 0) {
        thicknessTexture.texture = gltfJson.textures[thicknessTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_sheen)) {
      const sheenColorTexture = extensions.KHR_materials_sheen.sheenColorTexture;
      if (sheenColorTexture !== void 0) {
        sheenColorTexture.texture = gltfJson.textures[sheenColorTexture.index];
      }
      const sheenRoughnessTexture = extensions.KHR_materials_sheen.sheenRoughnessTexture;
      if (sheenRoughnessTexture !== void 0) {
        sheenRoughnessTexture.texture = gltfJson.textures[sheenRoughnessTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_specular)) {
      const specularTexture = extensions.KHR_materials_specular.specularTexture;
      if (specularTexture !== void 0) {
        specularTexture.texture = gltfJson.textures[specularTexture.index];
      }
      const specularColorTexture = extensions.KHR_materials_specular.specularColorTexture;
      if (specularColorTexture !== void 0) {
        specularColorTexture.texture = gltfJson.textures[specularColorTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_iridescence)) {
      const iridescenceTexture = extensions.KHR_materials_iridescence.iridescenceTexture;
      if (iridescenceTexture !== void 0) {
        iridescenceTexture.texture = gltfJson.textures[iridescenceTexture.index];
      }
      const iridescenceThicknessTexture = extensions.KHR_materials_iridescence.iridescenceThicknessTexture;
      if (iridescenceThicknessTexture !== void 0) {
        iridescenceThicknessTexture.texture = gltfJson.textures[iridescenceThicknessTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_anisotropy)) {
      const anisotropyTexture = extensions.KHR_materials_anisotropy.anisotropyTexture;
      if (anisotropyTexture !== void 0) {
        anisotropyTexture.texture = gltfJson.textures[anisotropyTexture.index];
      }
    }
    if (Is.exist(extensions.KHR_materials_diffuse_transmission)) {
      const diffuseTransmissionTexture = extensions.KHR_materials_diffuse_transmission.diffuseTransmissionTexture;
      if (diffuseTransmissionTexture !== void 0) {
        diffuseTransmissionTexture.texture = gltfJson.textures[diffuseTransmissionTexture.index];
      }
      const diffuseTransmissionColorTexture = extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture;
      if (diffuseTransmissionColorTexture !== void 0) {
        diffuseTransmissionColorTexture.texture = gltfJson.textures[diffuseTransmissionColorTexture.index];
      }
    }
  }
  static _loadVRMCExtensions(gltfJson, extensions) {
    if (Is.exist(extensions.VRMC_materials_mtoon)) {
      const mToon = extensions.VRMC_materials_mtoon;
      const shadeMultiplyTexture = mToon.shadeMultiplyTexture;
      if (shadeMultiplyTexture != null) {
        shadeMultiplyTexture.texture = gltfJson.textures[shadeMultiplyTexture.index];
      }
      const shadingShiftTexture = mToon.shadingShiftTexture;
      if (shadingShiftTexture != null) {
        shadingShiftTexture.texture = gltfJson.textures[shadingShiftTexture.index];
      }
      const matcapTexture = mToon.matcapTexture;
      if (matcapTexture != null) {
        matcapTexture.texture = gltfJson.textures[matcapTexture.index];
      }
      const rimMultiplyTexture = mToon.rimMultiplyTexture;
      if (rimMultiplyTexture != null) {
        rimMultiplyTexture.texture = gltfJson.textures[rimMultiplyTexture.index];
      }
      const outlineWidthMultiplyTexture = mToon.outlineWidthMultiplyTexture;
      if (outlineWidthMultiplyTexture != null) {
        outlineWidthMultiplyTexture.texture = gltfJson.textures[outlineWidthMultiplyTexture.index];
      }
      const uvAnimationMaskTexture = mToon.uvAnimationMaskTexture;
      if (uvAnimationMaskTexture != null) {
        uvAnimationMaskTexture.texture = gltfJson.textures[uvAnimationMaskTexture.index];
      }
    }
  }
  /**
   * Resolves dependencies for glTF textures including samplers and image sources.
   * Handles KHR_texture_basisu extension for Basis Universal texture compression.
   *
   * @param gltfJson - The glTF JSON data containing textures
   *
   * @internal
   */
  static _loadDependenciesOfTextures(gltfJson) {
    var _a, _b;
    if (gltfJson.textures) {
      for (const texture of gltfJson.textures) {
        ifDefinedThen((v) => {
          texture.samplerObject = gltfJson.samplers[v];
        }, texture.sampler);
        if (((_b = (_a = texture.extensions) == null ? void 0 : _a.KHR_texture_basisu) == null ? void 0 : _b.source) != null) {
          texture.extensions.KHR_texture_basisu.fallbackSourceIndex = texture.source;
          texture.source = texture.extensions.KHR_texture_basisu.source;
          texture.sourceObject = gltfJson.images[texture.source];
        } else if (texture.source !== void 0) {
          texture.sourceObject = gltfJson.images[texture.source];
        }
      }
    }
  }
  /**
   * Resolves dependencies for glTF skins including skeleton, joints, and inverse bind matrices.
   * Sets up the skeletal animation structure with proper object references.
   *
   * @param gltfJson - The glTF JSON data containing skins
   *
   * @internal
   */
  static _loadDependenciesOfJoints(gltfJson) {
    if (gltfJson.skins) {
      for (const skin of gltfJson.skins) {
        skin.skeletonObject = gltfJson.nodes[skin.skeleton];
        skin.inverseBindMatricesObject = gltfJson.accessors[skin.inverseBindMatrices];
        if (Is.not.exist(skin.skeleton)) {
          skin.skeleton = skin.joints[0];
          skin.skeletonObject = gltfJson.nodes[skin.skeleton];
        }
        skin.jointsObjects = [];
        for (const jointIndex of skin.joints) {
          skin.jointsObjects.push(gltfJson.nodes[jointIndex]);
        }
      }
    }
  }
  /**
   * Resolves dependencies for glTF animations including channels, samplers, and targets.
   * Handles different interpolation modes and sets up animation data structures.
   *
   * @param gltfJson - The glTF JSON data containing animations
   *
   * @internal
   */
  static _loadDependenciesOfAnimations(gltfJson) {
    if (gltfJson.animations) {
      for (const animation of gltfJson.animations) {
        for (const channel of animation.channels) {
          if (Is.exist(channel.sampler)) {
            channel.samplerObject = animation.samplers[channel.sampler];
            channel.target.nodeObject = gltfJson.nodes[channel.target.node];
            channel.samplerObject.inputObject = gltfJson.accessors[channel.samplerObject.input];
            channel.samplerObject.outputObject = gltfJson.accessors[channel.samplerObject.output];
            if (Is.undefined(channel.samplerObject.outputObject.extras)) {
              channel.samplerObject.outputObject.extras = {};
            }
            if (channel.target.path === "weights") {
              let weightsArrayLength = channel.samplerObject.outputObject.count / channel.samplerObject.inputObject.count;
              if (channel.samplerObject.interpolation === "CUBICSPLINE") {
                weightsArrayLength = channel.samplerObject.outputObject.count / channel.samplerObject.inputObject.count / 3;
              }
              channel.samplerObject.outputObject.extras.weightsArrayLength = weightsArrayLength;
            }
            if (channel.target.path === "rotation") {
              channel.samplerObject.outputObject.extras.quaternionIfVec4 = true;
            }
          }
        }
      }
    }
  }
  /**
   * Resolves dependencies for glTF accessors including buffer views and sparse data.
   * Links accessors to their underlying buffer data for vertex attributes and indices.
   *
   * @param gltfJson - The glTF JSON data containing accessors
   *
   * @internal
   */
  static _loadDependenciesOfAccessors(gltfJson) {
    for (const accessor of gltfJson.accessors) {
      if (accessor.bufferView != null) {
        accessor.bufferViewObject = gltfJson.bufferViews[accessor.bufferView];
      }
      if (Is.exist(accessor.sparse)) {
        const sparse = accessor.sparse;
        if (Is.exist(sparse) && Is.exist(sparse.indices) && Is.exist(sparse.values)) {
          sparse.indices.bufferViewObject = gltfJson.bufferViews[sparse.indices.bufferView];
          sparse.values.bufferViewObject = gltfJson.bufferViews[sparse.values.bufferView];
        }
      }
    }
  }
  /**
   * Resolves dependencies for glTF buffer views by linking them to their buffers.
   * Establishes the connection between buffer views and the actual buffer data.
   *
   * @param gltfJson - The glTF JSON data containing buffer views
   *
   * @internal
   */
  static _loadDependenciesOfBufferViews(gltfJson) {
    for (const bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferObject = gltfJson.buffers[bufferView.buffer];
      }
    }
  }
  /**
   * Merges extended JSON data into the main glTF JSON structure.
   * Supports ArrayBuffer, string, or object formats for extended data.
   *
   * @param gltfJson - The main glTF JSON to merge into
   * @param extendedData - Additional data to merge (ArrayBuffer, string, or object)
   *
   * @internal
   */
  static _mergeExtendedJson(gltfJson, extendedData) {
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
   * Loads all external resources referenced by the glTF file including buffers and images.
   * Handles various URI formats including data URIs, file references, and embedded data.
   * Supports multiple image formats including Basis Universal and KTX2 compression.
   *
   * @param uint8ArrayOfGlb - Binary data from GLB file (if applicable)
   * @param gltfJson - The glTF JSON data containing resource references
   * @param files - Collection of external files to load from
   * @param options - Loading configuration options
   * @param basePath - Base path for resolving relative URIs
   * @param callback - Optional progress callback
   * @returns A Promise that resolves when all resources are loaded
   *
   * @internal
   */
  static _loadResources(uint8ArrayOfGlb, gltfJson, files, _options, basePath, callback) {
    var _a;
    const promisesToLoadResources = [];
    let rnpArrayBuffer;
    for (const rnm2Buffer of gltfJson.buffers) {
      let filename = "";
      if (rnm2Buffer.uri) {
        const splitUri = rnm2Buffer.uri.split("/");
        filename = splitUri[splitUri.length - 1];
      }
      if (typeof rnm2Buffer.uri === "undefined") {
        rnpArrayBuffer = new RnPromise((resolve) => {
          rnm2Buffer.buffer = uint8ArrayOfGlb;
          resolve(uint8ArrayOfGlb);
        });
      } else if (rnm2Buffer.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise((resolve) => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(rnm2Buffer.uri);
          rnm2Buffer.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if (files && this.Ep(files, filename)) {
        rnpArrayBuffer = new RnPromise((resolve) => {
          const fullPath = this.Fp(files, filename);
          const arrayBuffer = files[fullPath];
          rnm2Buffer.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else {
        rnpArrayBuffer = new RnPromise(
          DataUtil.loadResourceAsync(
            basePath + rnm2Buffer.uri,
            true,
            (resolve, response) => {
              rnm2Buffer.buffer = new Uint8Array(response);
              resolve(response);
            },
            (reject, error) => {
              reject(`HTTP Error Status:${error}`);
            }
          )
        );
      }
      rnm2Buffer.bufferPromise = rnpArrayBuffer;
      promisesToLoadResources.push(rnpArrayBuffer);
    }
    for (const rnm2Image of (_a = gltfJson.images) != null ? _a : []) {
      if (rnm2Image.uri == null) {
        if (Is.exist(uint8ArrayOfGlb)) {
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            rnm2Image.bufferView,
            uint8ArrayOfGlb
          );
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(imageUint8Array, rnm2Image.mimeType);
          promisesToLoadResources.push(this.Gp(imageUri, rnm2Image, files));
        } else {
          const rnm2BufferView = gltfJson.bufferViews[rnm2Image.bufferView];
          const bufferInfo = rnm2BufferView.bufferObject;
          if (Is.not.exist(bufferInfo)) {
            Logger.default.error("gltf2BufferView.bufferObject not found");
            continue;
          }
          const bufferPromise = bufferInfo.bufferPromise;
          const loadImageAfterLoadingBuffer = new RnPromise((resolve) => {
            bufferPromise.then((arraybuffer) => {
              const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
                gltfJson,
                rnm2Image.bufferView,
                arraybuffer
              );
              const imageUri = DataUtil.createBlobImageUriFromUint8Array(imageUint8Array, rnm2Image.mimeType);
              this.Gp(imageUri, rnm2Image, files).then(() => {
                resolve(arraybuffer);
              });
            });
          });
          const bufferPromiseIndex = promisesToLoadResources.indexOf(bufferPromise);
          promisesToLoadResources[bufferPromiseIndex] = loadImageAfterLoadingBuffer;
          bufferInfo.bufferPromise = loadImageAfterLoadingBuffer;
        }
      } else {
        const imageFileStr = rnm2Image.uri;
        const splitUri = imageFileStr.split("/");
        const filename = splitUri[splitUri.length - 1];
        let imageUri;
        if (files && this.Ep(files, filename)) {
          const fullPath = this.Fp(files, filename);
          const arrayBuffer = files[fullPath];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(new Uint8Array(arrayBuffer), rnm2Image.mimeType);
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }
        promisesToLoadResources.push(this.Gp(imageUri, rnm2Image, files));
      }
    }
    const rmnPromises = this.Hp(gltfJson, files, basePath);
    for (const promise of rmnPromises) {
      promisesToLoadResources.push(promise);
    }
    return RnPromise.all(promisesToLoadResources, callback).catch((err) => {
      Logger.default.error(`Promise.all error: ${err}`);
    });
  }
  /**
   * Loads .rmn shader node JSON files for RHODONITE_materials_node extension.
   *
   * @param gltfJson - The glTF JSON data containing materials with the extension
   * @param files - Collection of external files that may contain .rmn data
   * @param basePath - Base path for resolving relative URIs
   * @returns Array of promises that resolve when .rmn files are loaded
   *
   * @private
   * @internal
   */
  static Hp(gltfJson, files, basePath) {
    var _a, _b, _c;
    const promises = [];
    const EXTENSION_NAME = "RHODONITE_materials_node";
    if (!((_a = gltfJson.extensionsUsed) == null ? void 0 : _a.includes(EXTENSION_NAME))) {
      return promises;
    }
    for (const material of (_b = gltfJson.materials) != null ? _b : []) {
      const extension = (_c = material.extensions) == null ? void 0 : _c[EXTENSION_NAME];
      if (!(extension == null ? void 0 : extension.uri)) {
        continue;
      }
      const rmnUri = extension.uri;
      const splitUri = rmnUri.split("/");
      const filename = splitUri[splitUri.length - 1];
      let loadPromise;
      if (rmnUri.match(/^data:application\/json;base64,/)) {
        loadPromise = new RnPromise((resolve) => {
          const jsonStr = DataUtil.arrayBufferToString(DataUtil.dataUriToArrayBuffer(rmnUri));
          extension.shaderNodeJson = JSON.parse(jsonStr);
          resolve(extension.shaderNodeJson);
        });
      } else if (files && this.Ep(files, filename)) {
        loadPromise = new RnPromise((resolve) => {
          const fullPath = this.Fp(files, filename);
          const arrayBuffer = files[fullPath];
          const jsonStr = DataUtil.arrayBufferToString(arrayBuffer);
          extension.shaderNodeJson = JSON.parse(jsonStr);
          resolve(extension.shaderNodeJson);
        });
      } else {
        const fullUri = basePath ? basePath + rmnUri : rmnUri;
        loadPromise = new RnPromise((resolve, reject) => {
          fetch(fullUri).then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP Error Status: ${response.status}`);
            }
            return response.json();
          }).then((json) => {
            extension.shaderNodeJson = json;
            resolve(json);
          }).catch((error) => {
            Logger.default.error(`Failed to load .rmn file: ${fullUri}, ${error}`);
            reject(error);
          });
        });
      }
      promises.push(loadPromise);
    }
    return promises;
  }
  /**
   * Checks if a specific filename exists in the provided files collection.
   * Compares only the filename part, ignoring directory paths.
   *
   * @param optionsFiles - Collection of files to search in
   * @param filename - The filename to search for
   * @returns True if the filename is found, false otherwise
   *
   * @private
   * @internal
   */
  static Ep(optionsFiles, filename) {
    for (const key in optionsFiles) {
      const split = key.split("/");
      const last = split[split.length - 1];
      if (last === filename) {
        return true;
      }
    }
    return false;
  }
  /**
   * Retrieves the full path of a file by its filename from the files collection.
   * Returns the complete key (path) that corresponds to the given filename.
   *
   * @param optionsFiles - Collection of files to search in
   * @param filename - The filename to find the full path for
   * @returns The full path if found, undefined otherwise
   *
   * @private
   * @internal
   */
  static Fp(optionsFiles, filename) {
    for (const key in optionsFiles) {
      const split = key.split("/");
      const last = split[split.length - 1];
      if (last === filename) {
        return key;
      }
    }
    return void 0;
  }
  /**
   * Loads an image from a URI and processes it based on the image format.
   * Supports standard images, Basis Universal (.basis), and KTX2 compressed textures.
   * Handles both direct URIs and data embedded in the files collection.
   *
   * @param imageUri - The URI of the image to load
   * @param imageJson - The glTF image object to populate with loaded data
   * @param files - Collection of files that may contain the image data
   * @returns A Promise that resolves to the populated image object
   *
   * @private
   * @internal
   */
  static Gp(imageUri, imageJson, files) {
    var _a, _b;
    let loadImagePromise;
    if (imageUri.match(/basis$/)) {
      loadImagePromise = new RnPromise((resolve) => {
        fetch(imageUri, { mode: "cors" }).then((response) => {
          response.arrayBuffer().then((buffer) => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.basis = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if ((_a = imageJson.uri) == null ? void 0 : _a.match(/basis$/)) {
      loadImagePromise = new RnPromise((resolve) => {
        imageJson.basis = new Uint8Array(files[imageJson.uri]);
        resolve(imageJson);
      });
    } else if (imageUri.match(/\.ktx2$/) || imageUri.match(/^data:image\/ktx2/) || imageJson.bufferView != null && imageJson.mimeType === "image/ktx2") {
      loadImagePromise = new RnPromise((resolve) => {
        fetch(imageUri, { mode: "cors" }).then((response) => {
          response.arrayBuffer().then((buffer) => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.ktx2 = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if ((_b = imageJson.uri) == null ? void 0 : _b.match(/ktx2$/)) {
      loadImagePromise = new RnPromise((resolve) => {
        imageJson.ktx2 = new Uint8Array(files[imageJson.uri]);
        resolve(imageJson);
      });
    } else {
      loadImagePromise = new RnPromise(async (resolve) => {
        const image = await DataUtil.createImageFromUri(imageUri, imageJson.mimeType);
        image.crossOrigin = "Anonymous";
        imageJson.image = image;
        resolve(imageJson);
      });
    }
    return loadImagePromise;
  }
};
export {
  Gltf2Importer
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvR2x0ZjJJbXBvcnRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBHbHRmRmlsZUJ1ZmZlcnMsIEdsdGZMb2FkT3B0aW9uIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSbk0yLCBSbk0yQWNjZXNzb3IsIFJuTTJFeHRlbnNpb25SaG9kb25pdGVNYXRlcmlhbHNOb2RlLCBSbk0ySW1hZ2UgfSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB0eXBlIHsgVnJtMV9NYXRlcmlhbHNfTVRvb24gfSBmcm9tICcuLi8uLi90eXBlcy9WUk1DX21hdGVyaWFsc19tdG9vbic7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IGlmRGVmaW5lZFRoZW4gfSBmcm9tICcuLi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB7IEVyciwgT2ssIHR5cGUgUmVzdWx0IH0gZnJvbSAnLi4vbWlzYy9SZXN1bHQnO1xuaW1wb3J0IHsgUm5Qcm9taXNlLCB0eXBlIFJuUHJvbWlzZUNhbGxiYWNrIH0gZnJvbSAnLi4vbWlzYy9SblByb21pc2UnO1xuXG5kZWNsYXJlIGxldCBSbjogYW55O1xuXG4vKipcbiAqIFRoZSBnbFRGMiBJbXBvcnRlciBjbGFzcyBmb3IgbG9hZGluZyBhbmQgcHJvY2Vzc2luZyBnbFRGIDIuMCBmaWxlcy5cbiAqIFN1cHBvcnRzIGJvdGggLmdsdGYgKEpTT04pIGFuZCAuZ2xiIChiaW5hcnkpIGZvcm1hdHMgd2l0aCBjb21wcmVoZW5zaXZlXG4gKiBleHRlbnNpb24gc3VwcG9ydCBhbmQgcmVzb3VyY2UgbG9hZGluZyBjYXBhYmlsaXRpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBHbHRmMkltcG9ydGVyIHtcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgLyoqXG4gICAqIEltcG9ydHMgYSBnbFRGMiBmaWxlIGZyb20gYSBVUkwgYW5kIHByb2Nlc3NlcyBpdCBpbnRvIFJuTTIgZm9ybWF0LlxuICAgKiBBdXRvbWF0aWNhbGx5IGRldGVjdHMgd2hldGhlciB0aGUgZmlsZSBpcyBpbiAuZ2x0ZiBvciAuZ2xiIGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIHVybCAtIFRoZSBVUkwgb2YgdGhlIGdsVEYgZmlsZSB0byBpbXBvcnRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25hbCBjb25maWd1cmF0aW9uIGZvciB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBwcm9jZXNzZWQgZ2xURjIgZGF0YSBpbiBSbk0yIGZvcm1hdFxuICAgKiBAdGhyb3dzIFdpbGwgcmVqZWN0IGlmIHRoZSBmaWxlIGNhbm5vdCBiZSBmZXRjaGVkIG9yIHByb2Nlc3NlZFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGdsdGZEYXRhID0gYXdhaXQgR2x0ZjJJbXBvcnRlci5pbXBvcnRGcm9tVXJsKCdwYXRoL3RvL21vZGVsLmdsdGYnLCB7XG4gICAqICAgY2FtZXJhQ29tcG9uZW50OiBDYW1lcmFDb21wb25lbnQsXG4gICAqICAgbGlnaHRDb21wb25lbnQ6IExpZ2h0Q29tcG9uZW50XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgaW1wb3J0RnJvbVVybCh1cmw6IHN0cmluZywgb3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uKTogUHJvbWlzZTxSbk0yPiB7XG4gICAgY29uc3Qgcl9hcnJheUJ1ZmZlciA9IGF3YWl0IERhdGFVdGlsLmZldGNoQXJyYXlCdWZmZXIodXJsKTtcblxuICAgIGlmIChyX2FycmF5QnVmZmVyLmlzRXJyKCkpIHtcbiAgICAgIHRocm93IHJfYXJyYXlCdWZmZXIuZ2V0Um5FcnJvcigpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2ltcG9ydEdsdGZPckdsYkZyb21BcnJheUJ1ZmZlcnMocl9hcnJheUJ1ZmZlci5nZXQoKSwgb3B0aW9ucz8uZmlsZXMgPz8ge30sIG9wdGlvbnMsIHVybCk7XG4gICAgcmV0dXJuIHJlc3VsdC51bndyYXBGb3JjZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydHMgZ2xURjIgZGF0YSBmcm9tIGEgY29sbGVjdGlvbiBvZiBBcnJheUJ1ZmZlciBmaWxlcy5cbiAgICogQXV0b21hdGljYWxseSBpZGVudGlmaWVzIHRoZSBtYWluIGdsVEYgb3IgR0xCIGZpbGUgZnJvbSB0aGUgcHJvdmlkZWQgZmlsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlcyAtIEEgY29sbGVjdGlvbiBvZiBmaWxlIGJ1ZmZlcnMgd2hlcmUga2V5cyBhcmUgZmlsZW5hbWVzIGFuZCB2YWx1ZXMgYXJlIEFycmF5QnVmZmVyc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2FkaW5nIHByb2Nlc3NcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHByb2Nlc3NlZCBnbFRGMiBkYXRhIGluIFJuTTIgZm9ybWF0XG4gICAqIEB0aHJvd3MgV2lsbCByZWplY3QgaWYgbm8gZ2xURiBvciBHTEIgZmlsZSBpcyBmb3VuZCBpbiB0aGUgcHJvdmlkZWQgZmlsZXNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBmaWxlcyA9IHtcbiAgICogICAnbW9kZWwuZ2x0Zic6IGdsdGZCdWZmZXIsXG4gICAqICAgJ3RleHR1cmUuanBnJzogdGV4dHVyZUJ1ZmZlclxuICAgKiB9O1xuICAgKiBjb25zdCBnbHRmRGF0YSA9IGF3YWl0IEdsdGYySW1wb3J0ZXIuaW1wb3J0RnJvbUFycmF5QnVmZmVycyhmaWxlcyk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBpbXBvcnRGcm9tQXJyYXlCdWZmZXJzKGZpbGVzOiBHbHRmRmlsZUJ1ZmZlcnMsIG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvbik6IFByb21pc2U8Um5NMj4ge1xuICAgIGZvciAoY29uc3QgZmlsZU5hbWUgaW4gZmlsZXMpIHtcbiAgICAgIGNvbnN0IGZpbGVFeHRlbnNpb24gPSBEYXRhVXRpbC5nZXRFeHRlbnNpb24oZmlsZU5hbWUpO1xuXG4gICAgICBpZiAoZmlsZUV4dGVuc2lvbiA9PT0gJ2dsdGYnIHx8IGZpbGVFeHRlbnNpb24gPT09ICdnbGInIHx8IGZpbGVFeHRlbnNpb24gPT09ICdybmInKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX2ltcG9ydEdsdGZPckdsYkZyb21BcnJheUJ1ZmZlcnMoZmlsZXNbZmlsZU5hbWVdLCBmaWxlcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiByZXN1bHQudW53cmFwRm9yY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdubyBnbHRmIG9yIGdsYiBmaWxlIGZvdW5kJyk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIGltcG9ydCBnbFRGMiBkYXRhIGZyb20gQXJyYXlCdWZmZXIsIGhhbmRsaW5nIGJvdGggLmdsdGYgYW5kIC5nbGIgZm9ybWF0cy5cbiAgICogRGV0ZXJtaW5lcyB0aGUgZmlsZSBmb3JtYXQgYnkgY2hlY2tpbmcgdGhlIG1hZ2ljIG51bWJlciBhbmQgcHJvY2Vzc2VzIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgbWFpbiBnbFRGL0dMQiBmaWxlIGFzIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBvdGhlckZpbGVzIC0gQWRkaXRpb25hbCByZXNvdXJjZSBmaWxlcyAodGV4dHVyZXMsIGJpbnMpIGFzIEFycmF5QnVmZmVyc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsb2FkaW5nIHByb2Nlc3NcbiAgICogQHBhcmFtIHVyaSAtIE9wdGlvbmFsIFVSSSBvZiB0aGUgZ2xURiBmaWxlIGZvciByZXNvbHZpbmcgcmVsYXRpdmUgcGF0aHNcbiAgICogQHJldHVybnMgQSBSZXN1bHQgY29udGFpbmluZyB0aGUgcHJvY2Vzc2VkIFJuTTIgZGF0YSBvciBhbiBlcnJvclxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgX2ltcG9ydEdsdGZPckdsYkZyb21BcnJheUJ1ZmZlcnMoXG4gICAgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyLFxuICAgIG90aGVyRmlsZXM6IEdsdGZGaWxlQnVmZmVycyxcbiAgICBvcHRpb25zPzogR2x0ZkxvYWRPcHRpb24sXG4gICAgdXJpPzogc3RyaW5nXG4gICk6IFByb21pc2U8UmVzdWx0PFJuTTIsIHVuZGVmaW5lZD4+IHtcbiAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhhcnJheUJ1ZmZlciwgMCwgMjApO1xuICAgIC8vIE1hZ2ljIGZpZWxkXG4gICAgY29uc3QgbWFnaWMgPSBkYXRhVmlldy5nZXRVaW50MzIoMCwgdHJ1ZSk7XG4gICAgLy8gMHg0NjU0NkM2NyBpcyAnZ2xURicgaW4gQVNDSUkgY29kZXMuXG4gICAgaWYgKG1hZ2ljICE9PSAweDQ2NTQ2YzY3KSB7XG4gICAgICAvL2NvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBjb25zdCBnb3RUZXh0ID0gRGF0YVV0aWwuYXJyYXlCdWZmZXJUb1N0cmluZyhhcnJheUJ1ZmZlcik7XG4gICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShnb3RUZXh0KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGdsdGZKc29uID0gYXdhaXQgdGhpcy5faW1wb3J0R2x0Zihqc29uLCBvdGhlckZpbGVzLCBvcHRpb25zISwgdXJpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBPayhnbHRmSnNvbik7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICAgIG1lc3NhZ2U6ICd0aGlzLl9faW1wb3J0R2x0ZiBlcnJvcicsXG4gICAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGdsdGZKc29uID0gYXdhaXQgdGhpcy5faW1wb3J0R2xiKGFycmF5QnVmZmVyLCBvdGhlckZpbGVzLCBvcHRpb25zISk7XG4gICAgICAgIHJldHVybiBuZXcgT2soZ2x0Zkpzb24pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyKHtcbiAgICAgICAgICBtZXNzYWdlOiAndGhpcy5pbXBvcnRHbGIgZXJyb3InLFxuICAgICAgICAgIGVycm9yOiB1bmRlZmluZWQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZXMgZGVmYXVsdCBvcHRpb25zIHdpdGggZ2xURiBhc3NldCBleHRyYXMgYW5kIHVzZXItcHJvdmlkZWQgb3B0aW9ucy5cbiAgICogSGFuZGxlcyBsb2FkZXIgZXh0ZW5zaW9uIGluaXRpYWxpemF0aW9uIGJhc2VkIG9uIHRoZSBleHRlbnNpb24gbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGRlZmF1bHRPcHRpb25zIC0gVGhlIGJhc2UgZGVmYXVsdCBvcHRpb25zIHRvIG1lcmdlIGludG9cbiAgICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURiBKU09OIGRhdGEgdGhhdCBtYXkgY29udGFpbiBsb2FkZXIgb3B0aW9ucyBpbiBhc3NldC5leHRyYXNcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBVc2VyLXByb3ZpZGVkIG9wdGlvbnMgdG8gb3ZlcnJpZGUgZGVmYXVsdHNcbiAgICogQHJldHVybnMgVGhlIG1lcmdlZCBhbmQgcHJvY2Vzc2VkIG9wdGlvbnMgb2JqZWN0XG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9nZXRPcHRpb25zKGRlZmF1bHRPcHRpb25zOiBHbHRmTG9hZE9wdGlvbiwganNvbjogUm5NMiwgb3B0aW9uczogR2x0ZkxvYWRPcHRpb24pOiBHbHRmTG9hZE9wdGlvbiB7XG4gICAgaWYgKGpzb24uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3Qgb3B0aW9uTmFtZSBpbiBqc29uLmFzc2V0LmV4dHJhcy5ybkxvYWRlck9wdGlvbnMpIHtcbiAgICAgICAgKGRlZmF1bHRPcHRpb25zIGFzIGFueSlbb3B0aW9uTmFtZSBhcyBrZXlvZiBHbHRmTG9hZE9wdGlvbl0gPSBqc29uLmFzc2V0LmV4dHJhcy5ybkxvYWRlck9wdGlvbnNbXG4gICAgICAgICAgb3B0aW9uTmFtZSBhcyBrZXlvZiBHbHRmTG9hZE9wdGlvblxuICAgICAgICBdIGFzIGFueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgKGRlZmF1bHRPcHRpb25zIGFzIGFueSlbb3B0aW9uTmFtZSBhcyBrZXlvZiBHbHRmTG9hZE9wdGlvbl0gPSBvcHRpb25zW29wdGlvbk5hbWUgYXMga2V5b2YgR2x0ZkxvYWRPcHRpb25dIGFzIGFueTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucz8ubG9hZGVyRXh0ZW5zaW9uTmFtZSAmJiB0eXBlb2Ygb3B0aW9ucy5sb2FkZXJFeHRlbnNpb25OYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKFJuW29wdGlvbnMubG9hZGVyRXh0ZW5zaW9uTmFtZV0gIT0gbnVsbCkge1xuICAgICAgICBkZWZhdWx0T3B0aW9ucy5sb2FkZXJFeHRlbnNpb24gPSBSbltvcHRpb25zLmxvYWRlckV4dGVuc2lvbk5hbWVdLmdldEluc3RhbmNlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgJHtvcHRpb25zLmxvYWRlckV4dGVuc2lvbk5hbWV9IG5vdCBmb3VuZCFgKTtcbiAgICAgICAgZGVmYXVsdE9wdGlvbnMubG9hZGVyRXh0ZW5zaW9uID0gdm9pZCAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0T3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnRzIGFuZCBwcm9jZXNzZXMgYSBiaW5hcnkgZ2xURiAoLmdsYikgZmlsZSBmcm9tIEFycmF5QnVmZmVyLlxuICAgKiBWYWxpZGF0ZXMgdGhlIEdMQiBmb3JtYXQsIGV4dHJhY3RzIEpTT04gYW5kIGJpbmFyeSBjaHVua3MsIGFuZCBwcm9jZXNzZXMgdGhlIGNvbnRlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBHTEIgZmlsZSBkYXRhIGFzIEFycmF5QnVmZmVyXG4gICAqIEBwYXJhbSBmaWxlcyAtIEFkZGl0aW9uYWwgcmVzb3VyY2UgZmlsZXMgZm9yIHJlc29sdmluZyBkZXBlbmRlbmNpZXNcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBsb2FkaW5nIHByb2Nlc3NcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHByb2Nlc3NlZCBnbFRGMiBkYXRhIGluIFJuTTIgZm9ybWF0XG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBpZiB0aGUgR0xCIGZvcm1hdCBpcyBpbnZhbGlkIG9yIHVuc3VwcG9ydGVkXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIF9pbXBvcnRHbGIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyLCBmaWxlczogR2x0ZkZpbGVCdWZmZXJzLCBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbik6IFByb21pc2U8Um5NMj4ge1xuICAgIGNvbnN0IGRhdGFWaWV3ID0gbmV3IERhdGFWaWV3KGFycmF5QnVmZmVyLCAwLCAyMCk7XG4gICAgY29uc3QgZ2x0ZlZlciA9IGRhdGFWaWV3LmdldFVpbnQzMig0LCB0cnVlKTtcbiAgICBpZiAoZ2x0ZlZlciAhPT0gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHZlcnNpb24gZmllbGQgaW4gdGhpcyBiaW5hcnkgZ2xURiBmaWxlLicpO1xuICAgIH1cbiAgICBjb25zdCBsZW5ndGhPZkpTb25DaHVua0RhdGEgPSBkYXRhVmlldy5nZXRVaW50MzIoMTIsIHRydWUpO1xuICAgIGNvbnN0IGNodW5rVHlwZSA9IGRhdGFWaWV3LmdldFVpbnQzMigxNiwgdHJ1ZSk7XG4gICAgLy8gMHg0RTRGNTM0QSBtZWFucyBKU09OIGZvcm1hdCAoMHg0RTRGNTM0QSBpcyAnSlNPTicgaW4gQVNDSUkgY29kZXMpXG4gICAgaWYgKGNodW5rVHlwZSAhPT0gMHg0ZTRmNTM0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGNodW5rVHlwZSBvZiBjaHVuazAgaW4gdGhpcyBiaW5hcnkgZ2xURiBmaWxlLicpO1xuICAgIH1cbiAgICBjb25zdCB1aW50OEFycmF5SlNvbkNvbnRlbnQgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlciwgMjAsIGxlbmd0aE9mSlNvbkNodW5rRGF0YSk7XG4gICAgY29uc3QgZ290VGV4dCA9IERhdGFVdGlsLnVpbnQ4QXJyYXlUb1N0cmluZyh1aW50OEFycmF5SlNvbkNvbnRlbnQpO1xuICAgIGNvbnN0IGdsdGZKc29uID0gSlNPTi5wYXJzZShnb3RUZXh0KTtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IERhdGFVdGlsLmNyZWF0ZURlZmF1bHRHbHRmT3B0aW9ucygpO1xuICAgIG9wdGlvbnMgPSB0aGlzLl9nZXRPcHRpb25zKGRlZmF1bHRPcHRpb25zLCBnbHRmSnNvbiwgb3B0aW9ucyk7XG4gICAgY29uc3QgdWludDhhcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyLCAyMCArIGxlbmd0aE9mSlNvbkNodW5rRGF0YSArIDgpO1xuXG4gICAgaWYgKGdsdGZKc29uLmFzc2V0LmV4dHJhcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbHRmSnNvbi5hc3NldC5leHRyYXMgPSB7IGZpbGVUeXBlOiAnZ2xURicsIHZlcnNpb246ICcyJyB9O1xuICAgIH1cbiAgICB0aGlzLl9tZXJnZUV4dGVuZGVkSnNvbihnbHRmSnNvbiwgb3B0aW9ucy5leHRlbmRlZEpzb24hKTtcbiAgICBnbHRmSnNvbi5hc3NldC5leHRyYXMucm5Mb2FkZXJPcHRpb25zID0gb3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLl9sb2FkSW5uZXIoZ2x0Zkpzb24sIGZpbGVzLCBvcHRpb25zLCB1aW50OGFycmF5KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oYHRoaXMuX2xvYWRJbm5lciBlcnJvciBpbiBfbG9hZEFzQmluYXJ5SnNvbjogJHtlcnJ9YCk7XG4gICAgfVxuICAgIHJldHVybiBnbHRmSnNvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnRzIGFuZCBwcm9jZXNzZXMgYSBKU09OIGdsVEYgKC5nbHRmKSBmaWxlIHdpdGggZXh0ZXJuYWwgcmVzb3VyY2VzLlxuICAgKiBIYW5kbGVzIHJlc291cmNlIGxvYWRpbmcgZnJvbSBleHRlcm5hbCBmaWxlcyBhbmQgYXBwbGllcyBwcm9jZXNzaW5nIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBwYXJzZWQgZ2xURiBKU09OIGRhdGFcbiAgICogQHBhcmFtIGZpbGVBcnJheUJ1ZmZlcnMgLSBDb2xsZWN0aW9uIG9mIGV4dGVybmFsIHJlc291cmNlIGZpbGVzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAqIEBwYXJhbSB1cmkgLSBPcHRpb25hbCBiYXNlIFVSSSBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIHJlc291cmNlIHBhdGhzXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIE9wdGlvbmFsIGNhbGxiYWNrIGZvciBwcm9ncmVzcyB0cmFja2luZ1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgcHJvY2Vzc2VkIGdsVEYyIGRhdGEgaW4gUm5NMiBmb3JtYXRcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIF9pbXBvcnRHbHRmKFxuICAgIGdsdGZKc29uOiBSbk0yLFxuICAgIGZpbGVBcnJheUJ1ZmZlcnM6IEdsdGZGaWxlQnVmZmVycyxcbiAgICBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbixcbiAgICB1cmk/OiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBSblByb21pc2VDYWxsYmFja1xuICApOiBQcm9taXNlPFJuTTI+IHtcbiAgICBjb25zdCBiYXNlUGF0aCA9IGAke3VyaT8uc3Vic3RyaW5nKDAsIHVyaT8ubGFzdEluZGV4T2YoJy8nKSl9L2A7IC8vIGxvY2F0aW9uIG9mIG1vZGVsIGZpbGUgYXMgYmFzZVBhdGhcbiAgICBpZiAoZ2x0Zkpzb24uYXNzZXQuZXh0cmFzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsdGZKc29uLmFzc2V0LmV4dHJhcyA9IHsgZmlsZVR5cGU6ICdnbFRGJywgdmVyc2lvbjogJzInIH07XG4gICAgfVxuXG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSBEYXRhVXRpbC5jcmVhdGVEZWZhdWx0R2x0Zk9wdGlvbnMoKTtcbiAgICBvcHRpb25zID0gdGhpcy5fZ2V0T3B0aW9ucyhkZWZhdWx0T3B0aW9ucywgZ2x0Zkpzb24sIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fbWVyZ2VFeHRlbmRlZEpzb24oZ2x0Zkpzb24sIG9wdGlvbnMuZXh0ZW5kZWRKc29uISk7XG4gICAgZ2x0Zkpzb24uYXNzZXQuZXh0cmFzLnJuTG9hZGVyT3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5fbG9hZElubmVyKGdsdGZKc29uLCBmaWxlQXJyYXlCdWZmZXJzLCBvcHRpb25zLCB1bmRlZmluZWQsIGJhc2VQYXRoLCBjYWxsYmFjayk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgdGhpcy5fbG9hZElubmVyIGVycm9yIGluIF9sb2FkQXNUZXh0SnNvbjogJHtlcnJ9YCk7XG4gICAgfVxuICAgIHJldHVybiBnbHRmSnNvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcmNoZXN0cmF0ZXMgdGhlIGxvYWRpbmcgb2YgcmVzb3VyY2VzIGFuZCBKU09OIGNvbnRlbnQgcHJvY2Vzc2luZy5cbiAgICogQ3JlYXRlcyBwcm9taXNlcyBmb3IgYm90aCByZXNvdXJjZSBsb2FkaW5nIGFuZCBKU09OIGRlcGVuZGVuY3kgcmVzb2x1dGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIHRvIHByb2Nlc3NcbiAgICogQHBhcmFtIGZpbGVzIC0gQ29sbGVjdGlvbiBvZiByZXNvdXJjZSBmaWxlc1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRpbmcgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB1aW50OGFycmF5T2ZHbGIgLSBPcHRpb25hbCBiaW5hcnkgZGF0YSBmcm9tIEdMQiBmaWxlXG4gICAqIEBwYXJhbSBiYXNlUGF0aCAtIE9wdGlvbmFsIGJhc2UgcGF0aCBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIFVSSXNcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gT3B0aW9uYWwgcHJvZ3Jlc3MgY2FsbGJhY2tcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBhbGwgbG9hZGluZyBvcGVyYXRpb25zIGNvbXBsZXRlXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkSW5uZXIoXG4gICAgZ2x0Zkpzb246IFJuTTIsXG4gICAgZmlsZXM6IEdsdGZGaWxlQnVmZmVycyxcbiAgICBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbixcbiAgICB1aW50OGFycmF5T2ZHbGI/OiBVaW50OEFycmF5LFxuICAgIGJhc2VQYXRoPzogc3RyaW5nLFxuICAgIGNhbGxiYWNrPzogUm5Qcm9taXNlQ2FsbGJhY2tcbiAgKTogUm5Qcm9taXNlPGFueVtdPiB7XG4gICAgdGhpcy5fbm9ybWFsaXplT3B0aW9uYWxBcnJheXMoZ2x0Zkpzb24pO1xuICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICAvLyBMb2FkIHJlc291cmNlcyB0byBhYm92ZSByZXNvdXJjZXMgb2JqZWN0LlxuICAgIHByb21pc2VzLnB1c2godGhpcy5fbG9hZFJlc291cmNlcyh1aW50OGFycmF5T2ZHbGIhLCBnbHRmSnNvbiwgZmlsZXMsIG9wdGlvbnMsIGJhc2VQYXRoLCBjYWxsYmFjaykpO1xuXG4gICAgLy8gUGFyc2UgZ2xURiBKU09OXG4gICAgcHJvbWlzZXMucHVzaChcbiAgICAgIG5ldyBSblByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHRoaXMuX2xvYWRKc29uQ29udGVudChnbHRmSnNvbik7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pIGFzIFJuUHJvbWlzZTx2b2lkPlxuICAgICk7XG5cbiAgICByZXR1cm4gUm5Qcm9taXNlLmFsbChwcm9taXNlcyk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplcyBvcHRpb25hbCBnbFRGIGNvbGxlY3Rpb24gcHJvcGVydGllcyBmb3IgdGhlIGludGVybmFsIFJuTTJcbiAgICogcHJvY2Vzc2luZyBwaXBlbGluZS4gQSB2YWxpZCBnbFRGIGRvY3VtZW50IG1heSBvbWl0IGV2ZXJ5IGNvbGxlY3Rpb24gdGhhdFxuICAgKiBpdCBkb2VzIG5vdCB1c2UsIGluY2x1ZGluZyBidWZmZXJzIGZvciBjb2xsaXNpb24tb25seSBzY2VuZXMuXG4gICAqL1xuICBzdGF0aWMgX25vcm1hbGl6ZU9wdGlvbmFsQXJyYXlzKGdsdGZKc29uOiBSbk0yKTogdm9pZCB7XG4gICAgZ2x0Zkpzb24uYWNjZXNzb3JzID8/PSBbXTtcbiAgICBnbHRmSnNvbi5hbmltYXRpb25zID8/PSBbXTtcbiAgICBnbHRmSnNvbi5idWZmZXJzID8/PSBbXTtcbiAgICBnbHRmSnNvbi5idWZmZXJWaWV3cyA/Pz0gW107XG4gICAgZ2x0Zkpzb24uY2FtZXJhcyA/Pz0gW107XG4gICAgZ2x0Zkpzb24uaW1hZ2VzID8/PSBbXTtcbiAgICBnbHRmSnNvbi5tYXRlcmlhbHMgPz89IFtdO1xuICAgIGdsdGZKc29uLm1lc2hlcyA/Pz0gW107XG4gICAgZ2x0Zkpzb24ubm9kZXMgPz89IFtdO1xuICAgIGdsdGZKc29uLnNhbXBsZXJzID8/PSBbXTtcbiAgICBnbHRmSnNvbi5za2lucyA/Pz0gW107XG4gICAgZ2x0Zkpzb24udGV4dHVyZXMgPz89IFtdO1xuICAgIGdsdGZKc29uLmV4dGVuc2lvbnNVc2VkID8/PSBbXTtcbiAgICBnbHRmSnNvbi5leHRlbnNpb25zUmVxdWlyZWQgPz89IFtdO1xuICAgIGdsdGZKc29uLmV4dGVuc2lvbnMgPz89IHt9O1xuICAgIGdsdGZKc29uLnNjZW5lcyA/Pz0gW3sgbm9kZXM6IFtdIH1dO1xuICAgIGdsdGZKc29uLnNjZW5lID8/PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3NlcyB0aGUgZ2xURiBKU09OIGNvbnRlbnQgYnkgcmVzb2x2aW5nIGFsbCBpbnRlcm5hbCBkZXBlbmRlbmNpZXMuXG4gICAqIFNldHMgdXAgb2JqZWN0IHJlZmVyZW5jZXMgYmV0d2VlbiBzY2VuZXMsIG5vZGVzLCBtZXNoZXMsIG1hdGVyaWFscywgdGV4dHVyZXMsIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIHRvIHByb2Nlc3NcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2xvYWRKc29uQ29udGVudChnbHRmSnNvbjogUm5NMikge1xuICAgIC8vIFNjZW5lXG4gICAgdGhpcy5fbG9hZERlcGVuZGVuY2llc09mU2NlbmVzKGdsdGZKc29uKTtcblxuICAgIC8vIE5vZGVcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZOb2RlcyhnbHRmSnNvbik7XG5cbiAgICAvLyBNZXNoXG4gICAgdGhpcy5fbG9hZERlcGVuZGVuY2llc09mTWVzaGVzKGdsdGZKc29uKTtcblxuICAgIC8vIE1hdGVyaWFsXG4gICAgdGhpcy5fbG9hZERlcGVuZGVuY2llc09mTWF0ZXJpYWxzKGdsdGZKc29uKTtcblxuICAgIC8vIFRleHR1cmVcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZUZXh0dXJlcyhnbHRmSnNvbik7XG5cbiAgICAvLyBKb2ludFxuICAgIHRoaXMuX2xvYWREZXBlbmRlbmNpZXNPZkpvaW50cyhnbHRmSnNvbik7XG5cbiAgICAvLyBBbmltYXRpb25cbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZBbmltYXRpb25zKGdsdGZKc29uKTtcblxuICAgIC8vIEFjY2Vzc29yXG4gICAgdGhpcy5fbG9hZERlcGVuZGVuY2llc09mQWNjZXNzb3JzKGdsdGZKc29uKTtcblxuICAgIC8vIEJ1ZmZlclZpZXdcbiAgICB0aGlzLl9sb2FkRGVwZW5kZW5jaWVzT2ZCdWZmZXJWaWV3cyhnbHRmSnNvbik7XG5cbiAgICBpZiAoZ2x0Zkpzb24uYXNzZXQuZXh0cmFzID09PSB2b2lkIDApIHtcbiAgICAgIGdsdGZKc29uLmFzc2V0LmV4dHJhcyA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBkZXBlbmRlbmNpZXMgZm9yIGdsVEYgc2NlbmVzIGJ5IGxpbmtpbmcgbm9kZSByZWZlcmVuY2VzLlxuICAgKiBDcmVhdGVzIG5vZGVzT2JqZWN0cyBhcnJheSB3aXRoIGRpcmVjdCByZWZlcmVuY2VzIHRvIG5vZGUgb2JqZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgc2NlbmVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkRGVwZW5kZW5jaWVzT2ZTY2VuZXMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICBmb3IgKGNvbnN0IHNjZW5lIG9mIGdsdGZKc29uLnNjZW5lcykge1xuICAgICAgaWYgKElzLnVuZGVmaW5lZChzY2VuZS5ub2Rlc09iamVjdHMpKSB7XG4gICAgICAgIHNjZW5lLm5vZGVzT2JqZWN0cyA9IFtdO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBpIG9mIHNjZW5lLm5vZGVzISkge1xuICAgICAgICBzY2VuZS5ub2Rlc09iamVjdHMhW2ldID0gZ2x0Zkpzb24ubm9kZXNbc2NlbmUubm9kZXMhW2ldXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgZGVwZW5kZW5jaWVzIGZvciBnbFRGIG5vZGVzIGluY2x1ZGluZyBoaWVyYXJjaHksIG1lc2hlcywgc2tpbnMsIGNhbWVyYXMsIGFuZCBsaWdodHMuXG4gICAqIEVzdGFibGlzaGVzIHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXBzIGFuZCBsaW5rcyB0byBhc3NvY2lhdGVkIG9iamVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gZGF0YSBjb250YWluaW5nIG5vZGVzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkRGVwZW5kZW5jaWVzT2ZOb2RlcyhnbHRmSnNvbjogUm5NMikge1xuICAgIGZvciAoY29uc3Qgbm9kZV9pIGluIGdsdGZKc29uLm5vZGVzKSB7XG4gICAgICBjb25zdCBub2RlID0gZ2x0Zkpzb24ubm9kZXNbbm9kZV9pXTtcblxuICAgICAgLy8gSGllcmFyY2h5XG4gICAgICBub2RlLmNoaWxkcmVuT2JqZWN0cyA9IG5vZGUuY2hpbGRyZW5PYmplY3RzID8/IFtdO1xuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZF9pIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICBub2RlLmNoaWxkcmVuT2JqZWN0cyFbY2hpbGRfaV0gPSBnbHRmSnNvbi5ub2Rlc1tjaGlsZF9pXTtcbiAgICAgICAgICBnbHRmSnNvbi5ub2Rlc1tjaGlsZF9pXS5wYXJlbnQgPSBOdW1iZXIucGFyc2VJbnQobm9kZV9pLCAxMCk7XG4gICAgICAgICAgZ2x0Zkpzb24ubm9kZXNbY2hpbGRfaV0ucGFyZW50T2JqZWN0ID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXNoXG4gICAgICBpZiAobm9kZS5tZXNoICE9PSB2b2lkIDAgJiYgZ2x0Zkpzb24ubWVzaGVzICE9PSB2b2lkIDApIHtcbiAgICAgICAgbm9kZS5tZXNoT2JqZWN0ID0gZ2x0Zkpzb24ubWVzaGVzW25vZGUubWVzaCFdO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2luXG4gICAgICBpZiAobm9kZS5za2luICE9PSB2b2lkIDAgJiYgZ2x0Zkpzb24uc2tpbnMgIT09IHZvaWQgMCkge1xuICAgICAgICBub2RlLnNraW5PYmplY3QgPSBnbHRmSnNvbi5za2luc1tub2RlLnNraW5dO1xuICAgICAgICBpZiAoSXMuZXhpc3Qobm9kZS5za2luT2JqZWN0KSkge1xuICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3Qobm9kZS5tZXNoT2JqZWN0Py5leHRyYXMpKSB7XG4gICAgICAgICAgICBub2RlLm1lc2hPYmplY3QhLmV4dHJhcyA9IHt9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5vZGUubWVzaE9iamVjdCEuZXh0cmFzLl9za2luID0gbm9kZS5za2luO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENhbWVyYVxuICAgICAgaWYgKG5vZGUuY2FtZXJhICE9PSB2b2lkIDAgJiYgZ2x0Zkpzb24uY2FtZXJhcyAhPT0gdm9pZCAwKSB7XG4gICAgICAgIG5vZGUuY2FtZXJhT2JqZWN0ID0gZ2x0Zkpzb24uY2FtZXJhc1tub2RlLmNhbWVyYV07XG4gICAgICB9XG5cbiAgICAgIC8vIExpZ2h0c1xuICAgICAgaWYgKFxuICAgICAgICBub2RlLmV4dGVuc2lvbnMgIT09IHZvaWQgMCAmJlxuICAgICAgICBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbCAhPT0gdm9pZCAwICYmXG4gICAgICAgIGdsdGZKc29uLmV4dGVuc2lvbnMgIT09IHZvaWQgMCAmJlxuICAgICAgICBnbHRmSnNvbi5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwgIT09IHZvaWQgMFxuICAgICAgKSB7XG4gICAgICAgIG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0SW5kZXggPSBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodDtcbiAgICAgICAgbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHQgPVxuICAgICAgICAgIGdsdGZKc29uLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodHNbbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHRJbmRleF07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGRlcGVuZGVuY2llcyBmb3IgZ2xURiBtZXNoZXMgaW5jbHVkaW5nIG1hdGVyaWFscywgYXR0cmlidXRlcywgaW5kaWNlcywgYW5kIG1vcnBoIHRhcmdldHMuXG4gICAqIEhhbmRsZXMgbWF0ZXJpYWwgdmFyaWFudHMgYW5kIGNyZWF0ZXMgZGlyZWN0IG9iamVjdCByZWZlcmVuY2VzIGZvciBlZmZpY2llbnQgYWNjZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIGRhdGEgY29udGFpbmluZyBtZXNoZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2xvYWREZXBlbmRlbmNpZXNPZk1lc2hlcyhnbHRmSnNvbjogUm5NMikge1xuICAgIC8vIE1lc2hcbiAgICBpZiAoSXMubm90LmV4aXN0KGdsdGZKc29uLm1lc2hlcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBtZXNoIG9mIGdsdGZKc29uLm1lc2hlcykge1xuICAgICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgbWVzaC5wcmltaXRpdmVzKSB7XG4gICAgICAgIGlmIChwcmltaXRpdmUubWF0ZXJpYWwgIT09IHZvaWQgMCkge1xuICAgICAgICAgIHByaW1pdGl2ZS5tYXRlcmlhbE9iamVjdCA9IGdsdGZKc29uLm1hdGVyaWFsc1twcmltaXRpdmUubWF0ZXJpYWxdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByaW1pdGl2ZS5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzICE9IG51bGwpIHtcbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWxWYXJpYW50cyA9IFtdO1xuICAgICAgICAgIGNvbnN0IG1hcHBpbmdzID0gcHJpbWl0aXZlLmV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc192YXJpYW50cy5tYXBwaW5ncztcbiAgICAgICAgICBjb25zdCB2YXJpYW50TmFtZXMgPSBnbHRmSnNvbi5leHRlbnNpb25zLktIUl9tYXRlcmlhbHNfdmFyaWFudHMudmFyaWFudHM7XG4gICAgICAgICAgZm9yIChjb25zdCBtYXBwaW5nIG9mIG1hcHBpbmdzKSB7XG4gICAgICAgICAgICBjb25zdCB2YXJpYW50cyA9IG1hcHBpbmcudmFyaWFudHMubWFwKCh2YXJpYW50SWR4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhbnROYW1lc1t2YXJpYW50SWR4XS5uYW1lO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsVmFyaWFudCA9IHtcbiAgICAgICAgICAgICAgbWF0ZXJpYWxPYmplY3Q6IGdsdGZKc29uLm1hdGVyaWFsc1ttYXBwaW5nLm1hdGVyaWFsXSxcbiAgICAgICAgICAgICAgbWF0ZXJpYWw6IG1hcHBpbmcubWF0ZXJpYWwsXG4gICAgICAgICAgICAgIHZhcmlhbnRzOiB2YXJpYW50cyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHByaW1pdGl2ZS5tYXRlcmlhbFZhcmlhbnRzLnB1c2gobWF0ZXJpYWxWYXJpYW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcmltaXRpdmUuYXR0cmlidXRlc09iamVjdHMgPSB7fSBhcyB1bmtub3duIGFzIHtcbiAgICAgICAgICBbczogc3RyaW5nXTogUm5NMkFjY2Vzc29yO1xuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICBjb25zdCBhY2Nlc3NvcklkID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgICAgY29uc3QgYWNjZXNzb3IgPSBnbHRmSnNvbi5hY2Nlc3NvcnNbYWNjZXNzb3JJZCFdO1xuICAgICAgICAgIGFjY2Vzc29yLmV4dHJhcyA9IHt9O1xuICAgICAgICAgIHByaW1pdGl2ZS5hdHRyaWJ1dGVzT2JqZWN0c1thdHRyaWJ1dGVOYW1lXSA9IGFjY2Vzc29yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByaW1pdGl2ZS5pbmRpY2VzICE9IG51bGwpIHtcbiAgICAgICAgICBwcmltaXRpdmUuaW5kaWNlc09iamVjdCA9IGdsdGZKc29uLmFjY2Vzc29yc1twcmltaXRpdmUuaW5kaWNlc107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJpbWl0aXZlLnRhcmdldHMgIT0gbnVsbCkge1xuICAgICAgICAgIHByaW1pdGl2ZS50YXJnZXRzT2JqZWN0cyA9IFtdO1xuICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHByaW1pdGl2ZS50YXJnZXRzKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0ge30gYXMgdW5rbm93biBhcyB7IFtzOiBzdHJpbmddOiBSbk0yQWNjZXNzb3IgfTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0U2hhcGVUYXJnZXRBY2Nlc3NvcklkID0gdGFyZ2V0W2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICAgICAgICBpZiAodGFyZ2V0U2hhcGVUYXJnZXRBY2Nlc3NvcklkID49IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NvciA9IGdsdGZKc29uLmFjY2Vzc29yc1t0YXJnZXRTaGFwZVRhcmdldEFjY2Vzc29ySWRdO1xuICAgICAgICAgICAgICAgIGFjY2Vzc29yLmV4dHJhcyA9IHt9O1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhY2Nlc3NvcjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJpbWl0aXZlLnRhcmdldHNPYmplY3RzLnB1c2goYXR0cmlidXRlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgZ2xURiBtb2RlbCBjb250YWlucyBSaG9kb25pdGUtc3BlY2lmaWMgbG9hZGVyIG9wdGlvbnMgaW4gYXNzZXQgZXh0cmFzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBybkxvYWRlck9wdGlvbnMgZXhpc3QgaW4gYXNzZXQuZXh0cmFzLCBmYWxzZSBvdGhlcndpc2VcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBkZXBlbmRlbmNpZXMgZm9yIGdsVEYgbWF0ZXJpYWxzIGluY2x1ZGluZyBhbGwgdGV4dHVyZSByZWZlcmVuY2VzLlxuICAgKiBIYW5kbGVzIFBCUiB0ZXh0dXJlcywgbm9ybWFsIG1hcHMsIG9jY2x1c2lvbiwgZW1pc3NpdmUsIGFuZCB2YXJpb3VzIGV4dGVuc2lvbnNcbiAgICogbGlrZSBjbGVhcmNvYXQsIHRyYW5zbWlzc2lvbiwgc2hlZW4sIHNwZWN1bGFyLCBpcmlkZXNjZW5jZSwgYW5pc290cm9weSwgYW5kIE1Ub29uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIGRhdGEgY29udGFpbmluZyBtYXRlcmlhbHNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2xvYWREZXBlbmRlbmNpZXNPZk1hdGVyaWFscyhnbHRmSnNvbjogUm5NMikge1xuICAgIGlmICghZ2x0Zkpzb24udGV4dHVyZXMpIGdsdGZKc29uLnRleHR1cmVzID0gW107XG5cbiAgICBpZiAoZ2x0Zkpzb24ubWF0ZXJpYWxzKSB7XG4gICAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIGdsdGZKc29uLm1hdGVyaWFscykge1xuICAgICAgICB0aGlzLl9sb2FkQmFzaWNNYXRlcmlhbFRleHR1cmVzKGdsdGZKc29uLCBtYXRlcmlhbCk7XG4gICAgICAgIHRoaXMuX2xvYWRNYXRlcmlhbEV4dGVuc2lvbnMoZ2x0Zkpzb24sIG1hdGVyaWFsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfbG9hZEJhc2ljTWF0ZXJpYWxUZXh0dXJlcyhnbHRmSnNvbjogUm5NMiwgbWF0ZXJpYWw6IGFueSkge1xuICAgIGlmIChtYXRlcmlhbC5wYnJNZXRhbGxpY1JvdWdobmVzcykge1xuICAgICAgY29uc3QgYmFzZUNvbG9yVGV4dHVyZSA9IG1hdGVyaWFsLnBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmU7XG4gICAgICBpZiAoYmFzZUNvbG9yVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGJhc2VDb2xvclRleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW2Jhc2VDb2xvclRleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgICAgY29uc3QgbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlID0gbWF0ZXJpYWwucGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlO1xuICAgICAgaWYgKG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxUZXh0dXJlID0gbWF0ZXJpYWwubm9ybWFsVGV4dHVyZTtcbiAgICBpZiAobm9ybWFsVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICBub3JtYWxUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tub3JtYWxUZXh0dXJlLmluZGV4XTtcbiAgICB9XG5cbiAgICBjb25zdCBvY2NsdXNpb25UZXh0dXJlID0gbWF0ZXJpYWwub2NjbHVzaW9uVGV4dHVyZTtcbiAgICBpZiAob2NjbHVzaW9uVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICBvY2NsdXNpb25UZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tvY2NsdXNpb25UZXh0dXJlLmluZGV4XTtcbiAgICB9XG5cbiAgICBjb25zdCBlbWlzc2l2ZVRleHR1cmUgPSBtYXRlcmlhbC5lbWlzc2l2ZVRleHR1cmU7XG4gICAgaWYgKGVtaXNzaXZlVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICBlbWlzc2l2ZVRleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW2VtaXNzaXZlVGV4dHVyZS5pbmRleF07XG4gICAgfVxuXG4gICAgY29uc3QgbG9hZGVyRXh0ZW5zaW9uID0gdGhpcy5fY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zkpzb24pXG4gICAgICA/IGdsdGZKc29uLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zIS5sb2FkZXJFeHRlbnNpb25cbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGlmIChsb2FkZXJFeHRlbnNpb24/LnNldFRleHR1cmVzKSB7XG4gICAgICBsb2FkZXJFeHRlbnNpb24uc2V0VGV4dHVyZXMoZ2x0Zkpzb24sIG1hdGVyaWFsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfbG9hZE1hdGVyaWFsRXh0ZW5zaW9ucyhnbHRmSnNvbjogUm5NMiwgbWF0ZXJpYWw6IGFueSkge1xuICAgIGlmIChJcy5leGlzdChtYXRlcmlhbC5leHRlbnNpb25zKSkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9ucyA9IG1hdGVyaWFsLmV4dGVuc2lvbnM7XG4gICAgICB0aGlzLl9sb2FkS0hSRXh0ZW5zaW9ucyhnbHRmSnNvbiwgZXh0ZW5zaW9ucyk7XG4gICAgICB0aGlzLl9sb2FkVlJNQ0V4dGVuc2lvbnMoZ2x0Zkpzb24sIGV4dGVuc2lvbnMpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9sb2FkS0hSRXh0ZW5zaW9ucyhnbHRmSnNvbjogUm5NMiwgZXh0ZW5zaW9uczogYW55KSB7XG4gICAgaWYgKElzLmV4aXN0KGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19jbGVhcmNvYXQpKSB7XG4gICAgICBjb25zdCBjbGVhcmNvYXRUZXh0dXJlID0gZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRUZXh0dXJlO1xuICAgICAgaWYgKGNsZWFyY29hdFRleHR1cmUgIT09IHZvaWQgMCkge1xuICAgICAgICBjbGVhcmNvYXRUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tjbGVhcmNvYXRUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUgPSBleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdFJvdWdobmVzc1RleHR1cmU7XG4gICAgICBpZiAoY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgICAgY29uc3QgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZTtcbiAgICAgIGlmIChjbGVhcmNvYXROb3JtYWxUZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChJcy5leGlzdChleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKSkge1xuICAgICAgY29uc3QgdHJhbnNtaXNzaW9uVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24udHJhbnNtaXNzaW9uVGV4dHVyZTtcbiAgICAgIGlmICh0cmFuc21pc3Npb25UZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgdHJhbnNtaXNzaW9uVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbdHJhbnNtaXNzaW9uVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChJcy5leGlzdChleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfdm9sdW1lKSkge1xuICAgICAgY29uc3QgdGhpY2tuZXNzVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc192b2x1bWUudGhpY2tuZXNzVGV4dHVyZTtcbiAgICAgIGlmICh0aGlja25lc3NUZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgdGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbdGhpY2tuZXNzVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChJcy5leGlzdChleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfc2hlZW4pKSB7XG4gICAgICBjb25zdCBzaGVlbkNvbG9yVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlbkNvbG9yVGV4dHVyZTtcbiAgICAgIGlmIChzaGVlbkNvbG9yVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHNoZWVuQ29sb3JUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tzaGVlbkNvbG9yVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCBzaGVlblJvdWdobmVzc1RleHR1cmUgPSBleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Sb3VnaG5lc3NUZXh0dXJlO1xuICAgICAgaWYgKHNoZWVuUm91Z2huZXNzVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHNoZWVuUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19zcGVjdWxhcikpIHtcbiAgICAgIGNvbnN0IHNwZWN1bGFyVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhclRleHR1cmU7XG4gICAgICBpZiAoc3BlY3VsYXJUZXh0dXJlICE9PSB2b2lkIDApIHtcbiAgICAgICAgc3BlY3VsYXJUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tzcGVjdWxhclRleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3BlY3VsYXJDb2xvclRleHR1cmUgPSBleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJDb2xvclRleHR1cmU7XG4gICAgICBpZiAoc3BlY3VsYXJDb2xvclRleHR1cmUgIT09IHZvaWQgMCkge1xuICAgICAgICBzcGVjdWxhckNvbG9yVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbc3BlY3VsYXJDb2xvclRleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QoZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlKSkge1xuICAgICAgY29uc3QgaXJpZGVzY2VuY2VUZXh0dXJlID0gZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGV4dHVyZTtcbiAgICAgIGlmIChpcmlkZXNjZW5jZVRleHR1cmUgIT09IHZvaWQgMCkge1xuICAgICAgICBpcmlkZXNjZW5jZVRleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW2lyaWRlc2NlbmNlVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCBpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUgPSBleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlO1xuICAgICAgaWYgKGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5KSkge1xuICAgICAgY29uc3QgYW5pc290cm9weVRleHR1cmUgPSBleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5VGV4dHVyZTtcbiAgICAgIGlmIChhbmlzb3Ryb3B5VGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGFuaXNvdHJvcHlUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1thbmlzb3Ryb3B5VGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChJcy5leGlzdChleHRlbnNpb25zLktIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24pKSB7XG4gICAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSA9IGV4dGVuc2lvbnMuS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZTtcbiAgICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlID1cbiAgICAgICAgZXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmU7XG4gICAgICBpZiAoZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUudGV4dHVyZSA9IGdsdGZKc29uLnRleHR1cmVzW2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9sb2FkVlJNQ0V4dGVuc2lvbnMoZ2x0Zkpzb246IFJuTTIsIGV4dGVuc2lvbnM6IGFueSkge1xuICAgIGlmIChJcy5leGlzdChleHRlbnNpb25zLlZSTUNfbWF0ZXJpYWxzX210b29uKSkge1xuICAgICAgY29uc3QgbVRvb24gPSBleHRlbnNpb25zLlZSTUNfbWF0ZXJpYWxzX210b29uIGFzIFZybTFfTWF0ZXJpYWxzX01Ub29uO1xuICAgICAgY29uc3Qgc2hhZGVNdWx0aXBseVRleHR1cmUgPSBtVG9vbi5zaGFkZU11bHRpcGx5VGV4dHVyZTtcbiAgICAgIGlmIChzaGFkZU11bHRpcGx5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICAgIHNoYWRlTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tzaGFkZU11bHRpcGx5VGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCBzaGFkaW5nU2hpZnRUZXh0dXJlID0gbVRvb24uc2hhZGluZ1NoaWZ0VGV4dHVyZTtcbiAgICAgIGlmIChzaGFkaW5nU2hpZnRUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgICAgc2hhZGluZ1NoaWZ0VGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbc2hhZGluZ1NoaWZ0VGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCBtYXRjYXBUZXh0dXJlID0gbVRvb24ubWF0Y2FwVGV4dHVyZTtcbiAgICAgIGlmIChtYXRjYXBUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgICAgbWF0Y2FwVGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbbWF0Y2FwVGV4dHVyZS5pbmRleF07XG4gICAgICB9XG4gICAgICBjb25zdCByaW1NdWx0aXBseVRleHR1cmUgPSBtVG9vbi5yaW1NdWx0aXBseVRleHR1cmU7XG4gICAgICBpZiAocmltTXVsdGlwbHlUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgICAgcmltTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1tyaW1NdWx0aXBseVRleHR1cmUuaW5kZXhdO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlID0gbVRvb24ub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlO1xuICAgICAgaWYgKG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICAgIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS50ZXh0dXJlID0gZ2x0Zkpzb24udGV4dHVyZXNbb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHV2QW5pbWF0aW9uTWFza1RleHR1cmUgPSBtVG9vbi51dkFuaW1hdGlvbk1hc2tUZXh0dXJlO1xuICAgICAgaWYgKHV2QW5pbWF0aW9uTWFza1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgICB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnRleHR1cmUgPSBnbHRmSnNvbi50ZXh0dXJlc1t1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLmluZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgZGVwZW5kZW5jaWVzIGZvciBnbFRGIHRleHR1cmVzIGluY2x1ZGluZyBzYW1wbGVycyBhbmQgaW1hZ2Ugc291cmNlcy5cbiAgICogSGFuZGxlcyBLSFJfdGV4dHVyZV9iYXNpc3UgZXh0ZW5zaW9uIGZvciBCYXNpcyBVbml2ZXJzYWwgdGV4dHVyZSBjb21wcmVzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgdGV4dHVyZXNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2xvYWREZXBlbmRlbmNpZXNPZlRleHR1cmVzKGdsdGZKc29uOiBSbk0yKSB7XG4gICAgLy8gVGV4dHVyZVxuICAgIGlmIChnbHRmSnNvbi50ZXh0dXJlcykge1xuICAgICAgZm9yIChjb25zdCB0ZXh0dXJlIG9mIGdsdGZKc29uLnRleHR1cmVzKSB7XG4gICAgICAgIGlmRGVmaW5lZFRoZW4odiA9PiB7XG4gICAgICAgICAgdGV4dHVyZS5zYW1wbGVyT2JqZWN0ID0gZ2x0Zkpzb24uc2FtcGxlcnNbdl07XG4gICAgICAgIH0sIHRleHR1cmUuc2FtcGxlcik7XG5cbiAgICAgICAgaWYgKHRleHR1cmUuZXh0ZW5zaW9ucz8uS0hSX3RleHR1cmVfYmFzaXN1Py5zb3VyY2UgIT0gbnVsbCkge1xuICAgICAgICAgIHRleHR1cmUuZXh0ZW5zaW9ucy5LSFJfdGV4dHVyZV9iYXNpc3UuZmFsbGJhY2tTb3VyY2VJbmRleCA9IHRleHR1cmUuc291cmNlO1xuICAgICAgICAgIHRleHR1cmUuc291cmNlID0gdGV4dHVyZS5leHRlbnNpb25zLktIUl90ZXh0dXJlX2Jhc2lzdS5zb3VyY2UgYXMgbnVtYmVyO1xuICAgICAgICAgIHRleHR1cmUuc291cmNlT2JqZWN0ID0gZ2x0Zkpzb24uaW1hZ2VzW3RleHR1cmUuc291cmNlXTtcbiAgICAgICAgfSBlbHNlIGlmICh0ZXh0dXJlLnNvdXJjZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgdGV4dHVyZS5zb3VyY2VPYmplY3QgPSBnbHRmSnNvbi5pbWFnZXNbdGV4dHVyZS5zb3VyY2UhXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBkZXBlbmRlbmNpZXMgZm9yIGdsVEYgc2tpbnMgaW5jbHVkaW5nIHNrZWxldG9uLCBqb2ludHMsIGFuZCBpbnZlcnNlIGJpbmQgbWF0cmljZXMuXG4gICAqIFNldHMgdXAgdGhlIHNrZWxldGFsIGFuaW1hdGlvbiBzdHJ1Y3R1cmUgd2l0aCBwcm9wZXIgb2JqZWN0IHJlZmVyZW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBnbFRGIEpTT04gZGF0YSBjb250YWluaW5nIHNraW5zXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkRGVwZW5kZW5jaWVzT2ZKb2ludHMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICBpZiAoZ2x0Zkpzb24uc2tpbnMpIHtcbiAgICAgIGZvciAoY29uc3Qgc2tpbiBvZiBnbHRmSnNvbi5za2lucykge1xuICAgICAgICBza2luLnNrZWxldG9uT2JqZWN0ID0gZ2x0Zkpzb24ubm9kZXNbc2tpbi5za2VsZXRvbiFdO1xuXG4gICAgICAgIHNraW4uaW52ZXJzZUJpbmRNYXRyaWNlc09iamVjdCA9IGdsdGZKc29uLmFjY2Vzc29yc1tza2luLmludmVyc2VCaW5kTWF0cmljZXMhXTtcblxuICAgICAgICBpZiAoSXMubm90LmV4aXN0KHNraW4uc2tlbGV0b24pKSB7XG4gICAgICAgICAgc2tpbi5za2VsZXRvbiA9IHNraW4uam9pbnRzWzBdO1xuICAgICAgICAgIHNraW4uc2tlbGV0b25PYmplY3QgPSBnbHRmSnNvbi5ub2Rlc1tza2luLnNrZWxldG9uXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNraW4uam9pbnRzT2JqZWN0cyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGpvaW50SW5kZXggb2Ygc2tpbi5qb2ludHMpIHtcbiAgICAgICAgICBza2luLmpvaW50c09iamVjdHMucHVzaChnbHRmSnNvbi5ub2Rlc1tqb2ludEluZGV4XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgZGVwZW5kZW5jaWVzIGZvciBnbFRGIGFuaW1hdGlvbnMgaW5jbHVkaW5nIGNoYW5uZWxzLCBzYW1wbGVycywgYW5kIHRhcmdldHMuXG4gICAqIEhhbmRsZXMgZGlmZmVyZW50IGludGVycG9sYXRpb24gbW9kZXMgYW5kIHNldHMgdXAgYW5pbWF0aW9uIGRhdGEgc3RydWN0dXJlcy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgYW5pbWF0aW9uc1xuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfbG9hZERlcGVuZGVuY2llc09mQW5pbWF0aW9ucyhnbHRmSnNvbjogUm5NMikge1xuICAgIGlmIChnbHRmSnNvbi5hbmltYXRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBnbHRmSnNvbi5hbmltYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hhbm5lbCBvZiBhbmltYXRpb24uY2hhbm5lbHMpIHtcbiAgICAgICAgICBpZiAoSXMuZXhpc3QoY2hhbm5lbC5zYW1wbGVyKSkge1xuICAgICAgICAgICAgY2hhbm5lbC5zYW1wbGVyT2JqZWN0ID0gYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl07XG4gICAgICAgICAgICBjaGFubmVsLnRhcmdldC5ub2RlT2JqZWN0ID0gZ2x0Zkpzb24ubm9kZXNbY2hhbm5lbC50YXJnZXQubm9kZSFdO1xuICAgICAgICAgICAgY2hhbm5lbC5zYW1wbGVyT2JqZWN0LmlucHV0T2JqZWN0ID0gZ2x0Zkpzb24uYWNjZXNzb3JzW2NoYW5uZWwuc2FtcGxlck9iamVjdC5pbnB1dCFdO1xuICAgICAgICAgICAgY2hhbm5lbC5zYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCA9IGdsdGZKc29uLmFjY2Vzc29yc1tjaGFubmVsLnNhbXBsZXJPYmplY3Qub3V0cHV0IV07XG4gICAgICAgICAgICBpZiAoSXMudW5kZWZpbmVkKGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QuZXh0cmFzKSkge1xuICAgICAgICAgICAgICBjaGFubmVsLnNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0LmV4dHJhcyA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGFubmVsLnRhcmdldC5wYXRoID09PSAnd2VpZ2h0cycpIHtcbiAgICAgICAgICAgICAgbGV0IHdlaWdodHNBcnJheUxlbmd0aCA9XG4gICAgICAgICAgICAgICAgY2hhbm5lbC5zYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdC5jb3VudCAvIGNoYW5uZWwuc2FtcGxlck9iamVjdC5pbnB1dE9iamVjdC5jb3VudDtcbiAgICAgICAgICAgICAgaWYgKGNoYW5uZWwuc2FtcGxlck9iamVjdC5pbnRlcnBvbGF0aW9uID09PSAnQ1VCSUNTUExJTkUnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlZCBieSAzLCBiZWNhdXNlIGluIGdsVEYgQ1VCSUNTUExJTkUgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICAgICAgICAvLyAgIHRhbmdlbnRzIChhaywgYmspIGFuZCB2YWx1ZXMgKHZrKSBhcmUgZ3JvdXBlZFxuICAgICAgICAgICAgICAgIC8vICAgICAgIHdpdGhpbiBrZXlmcmFtZXM6IGExLGEyLFx1MjAyNmFuLHYxLHYyLFx1MjAyNnZuLGIxLGIyLFx1MjAyNmJuXG4gICAgICAgICAgICAgICAgd2VpZ2h0c0FycmF5TGVuZ3RoID1cbiAgICAgICAgICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QuY291bnQgLyBjaGFubmVsLnNhbXBsZXJPYmplY3QuaW5wdXRPYmplY3QuY291bnQgLyAzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QuZXh0cmFzIS53ZWlnaHRzQXJyYXlMZW5ndGggPSB3ZWlnaHRzQXJyYXlMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3JvdGF0aW9uJykge1xuICAgICAgICAgICAgICBjaGFubmVsLnNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0LmV4dHJhcyEucXVhdGVybmlvbklmVmVjNCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGRlcGVuZGVuY2llcyBmb3IgZ2xURiBhY2Nlc3NvcnMgaW5jbHVkaW5nIGJ1ZmZlciB2aWV3cyBhbmQgc3BhcnNlIGRhdGEuXG4gICAqIExpbmtzIGFjY2Vzc29ycyB0byB0aGVpciB1bmRlcmx5aW5nIGJ1ZmZlciBkYXRhIGZvciB2ZXJ0ZXggYXR0cmlidXRlcyBhbmQgaW5kaWNlcy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgYWNjZXNzb3JzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkRGVwZW5kZW5jaWVzT2ZBY2Nlc3NvcnMoZ2x0Zkpzb246IFJuTTIpIHtcbiAgICAvLyBBY2Nlc3NvclxuICAgIGZvciAoY29uc3QgYWNjZXNzb3Igb2YgZ2x0Zkpzb24uYWNjZXNzb3JzKSB7XG4gICAgICBpZiAoYWNjZXNzb3IuYnVmZmVyVmlldyAhPSBudWxsKSB7XG4gICAgICAgIGFjY2Vzc29yLmJ1ZmZlclZpZXdPYmplY3QgPSBnbHRmSnNvbi5idWZmZXJWaWV3c1thY2Nlc3Nvci5idWZmZXJWaWV3XTtcbiAgICAgIH1cblxuICAgICAgaWYgKElzLmV4aXN0KGFjY2Vzc29yLnNwYXJzZSkpIHtcbiAgICAgICAgY29uc3Qgc3BhcnNlID0gYWNjZXNzb3Iuc3BhcnNlO1xuICAgICAgICBpZiAoSXMuZXhpc3Qoc3BhcnNlKSAmJiBJcy5leGlzdChzcGFyc2UuaW5kaWNlcykgJiYgSXMuZXhpc3Qoc3BhcnNlLnZhbHVlcykpIHtcbiAgICAgICAgICBzcGFyc2UuaW5kaWNlcy5idWZmZXJWaWV3T2JqZWN0ID0gZ2x0Zkpzb24uYnVmZmVyVmlld3Nbc3BhcnNlLmluZGljZXMuYnVmZmVyVmlld107XG4gICAgICAgICAgc3BhcnNlLnZhbHVlcy5idWZmZXJWaWV3T2JqZWN0ID0gZ2x0Zkpzb24uYnVmZmVyVmlld3Nbc3BhcnNlLnZhbHVlcy5idWZmZXJWaWV3XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBkZXBlbmRlbmNpZXMgZm9yIGdsVEYgYnVmZmVyIHZpZXdzIGJ5IGxpbmtpbmcgdGhlbSB0byB0aGVpciBidWZmZXJzLlxuICAgKiBFc3RhYmxpc2hlcyB0aGUgY29ubmVjdGlvbiBiZXR3ZWVuIGJ1ZmZlciB2aWV3cyBhbmQgdGhlIGFjdHVhbCBidWZmZXIgZGF0YS5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgYnVmZmVyIHZpZXdzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkRGVwZW5kZW5jaWVzT2ZCdWZmZXJWaWV3cyhnbHRmSnNvbjogUm5NMikge1xuICAgIC8vIEJ1ZmZlclZpZXdcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlclZpZXcgb2YgZ2x0Zkpzb24uYnVmZmVyVmlld3MpIHtcbiAgICAgIGlmIChidWZmZXJWaWV3LmJ1ZmZlciAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGJ1ZmZlclZpZXcuYnVmZmVyT2JqZWN0ID0gZ2x0Zkpzb24uYnVmZmVyc1tidWZmZXJWaWV3LmJ1ZmZlciFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZXMgZXh0ZW5kZWQgSlNPTiBkYXRhIGludG8gdGhlIG1haW4gZ2xURiBKU09OIHN0cnVjdHVyZS5cbiAgICogU3VwcG9ydHMgQXJyYXlCdWZmZXIsIHN0cmluZywgb3Igb2JqZWN0IGZvcm1hdHMgZm9yIGV4dGVuZGVkIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmSnNvbiAtIFRoZSBtYWluIGdsVEYgSlNPTiB0byBtZXJnZSBpbnRvXG4gICAqIEBwYXJhbSBleHRlbmRlZERhdGEgLSBBZGRpdGlvbmFsIGRhdGEgdG8gbWVyZ2UgKEFycmF5QnVmZmVyLCBzdHJpbmcsIG9yIG9iamVjdClcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX21lcmdlRXh0ZW5kZWRKc29uKGdsdGZKc29uOiBSbk0yLCBleHRlbmRlZERhdGE6IEFycmF5QnVmZmVyIHwgc3RyaW5nIHwgb2JqZWN0KSB7XG4gICAgbGV0IGV4dGVuZGVkSnNvbiA9IG51bGw7XG4gICAgaWYgKGV4dGVuZGVkRGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICBjb25zdCBleHRlbmRlZEpzb25TdHIgPSBEYXRhVXRpbC5hcnJheUJ1ZmZlclRvU3RyaW5nKGV4dGVuZGVkRGF0YSk7XG4gICAgICBleHRlbmRlZEpzb24gPSBKU09OLnBhcnNlKGV4dGVuZGVkSnNvblN0cik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXh0ZW5kZWREYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgZXh0ZW5kZWRKc29uID0gSlNPTi5wYXJzZShleHRlbmRlZERhdGEpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4dGVuZGVkRGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGV4dGVuZGVkSnNvbiA9IGV4dGVuZGVkRGF0YTtcbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKGdsdGZKc29uLCBleHRlbmRlZEpzb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGFsbCBleHRlcm5hbCByZXNvdXJjZXMgcmVmZXJlbmNlZCBieSB0aGUgZ2xURiBmaWxlIGluY2x1ZGluZyBidWZmZXJzIGFuZCBpbWFnZXMuXG4gICAqIEhhbmRsZXMgdmFyaW91cyBVUkkgZm9ybWF0cyBpbmNsdWRpbmcgZGF0YSBVUklzLCBmaWxlIHJlZmVyZW5jZXMsIGFuZCBlbWJlZGRlZCBkYXRhLlxuICAgKiBTdXBwb3J0cyBtdWx0aXBsZSBpbWFnZSBmb3JtYXRzIGluY2x1ZGluZyBCYXNpcyBVbml2ZXJzYWwgYW5kIEtUWDIgY29tcHJlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB1aW50OEFycmF5T2ZHbGIgLSBCaW5hcnkgZGF0YSBmcm9tIEdMQiBmaWxlIChpZiBhcHBsaWNhYmxlKVxuICAgKiBAcGFyYW0gZ2x0Zkpzb24gLSBUaGUgZ2xURiBKU09OIGRhdGEgY29udGFpbmluZyByZXNvdXJjZSByZWZlcmVuY2VzXG4gICAqIEBwYXJhbSBmaWxlcyAtIENvbGxlY3Rpb24gb2YgZXh0ZXJuYWwgZmlsZXMgdG8gbG9hZCBmcm9tXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGluZyBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIGJhc2VQYXRoIC0gQmFzZSBwYXRoIGZvciByZXNvbHZpbmcgcmVsYXRpdmUgVVJJc1xuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBPcHRpb25hbCBwcm9ncmVzcyBjYWxsYmFja1xuICAgKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCByZXNvdXJjZXMgYXJlIGxvYWRlZFxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfbG9hZFJlc291cmNlcyhcbiAgICB1aW50OEFycmF5T2ZHbGI6IFVpbnQ4QXJyYXksXG4gICAgZ2x0Zkpzb246IFJuTTIsXG4gICAgZmlsZXM6IEdsdGZGaWxlQnVmZmVycyxcbiAgICBfb3B0aW9uczogR2x0ZkxvYWRPcHRpb24sXG4gICAgYmFzZVBhdGg/OiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBSblByb21pc2VDYWxsYmFja1xuICApIHtcbiAgICBjb25zdCBwcm9taXNlc1RvTG9hZFJlc291cmNlczogUm5Qcm9taXNlPEFycmF5QnVmZmVyIHwgUm5NMkltYWdlPltdID0gW107XG5cbiAgICAvLyBCdWZmZXJzIEFzeW5jIGxvYWRcbiAgICBsZXQgcm5wQXJyYXlCdWZmZXI6IFJuUHJvbWlzZTxBcnJheUJ1ZmZlcj47XG4gICAgZm9yIChjb25zdCBybm0yQnVmZmVyIG9mIGdsdGZKc29uLmJ1ZmZlcnMpIHtcbiAgICAgIGxldCBmaWxlbmFtZSA9ICcnO1xuICAgICAgaWYgKHJubTJCdWZmZXIudXJpKSB7XG4gICAgICAgIGNvbnN0IHNwbGl0VXJpID0gcm5tMkJ1ZmZlci51cmkuc3BsaXQoJy8nKTtcbiAgICAgICAgZmlsZW5hbWUgPSBzcGxpdFVyaVtzcGxpdFVyaS5sZW5ndGggLSAxXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBybm0yQnVmZmVyLnVyaSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcm5wQXJyYXlCdWZmZXIgPSBuZXcgUm5Qcm9taXNlPEFycmF5QnVmZmVyPihyZXNvbHZlID0+IHtcbiAgICAgICAgICBybm0yQnVmZmVyLmJ1ZmZlciA9IHVpbnQ4QXJyYXlPZkdsYjtcbiAgICAgICAgICByZXNvbHZlKHVpbnQ4QXJyYXlPZkdsYiBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHJubTJCdWZmZXIudXJpLm1hdGNoKC9eZGF0YTphcHBsaWNhdGlvblxcLyguKik7YmFzZTY0LC8pKSB7XG4gICAgICAgIHJucEFycmF5QnVmZmVyID0gbmV3IFJuUHJvbWlzZTxBcnJheUJ1ZmZlcj4ocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBEYXRhVXRpbC5kYXRhVXJpVG9BcnJheUJ1ZmZlcihybm0yQnVmZmVyLnVyaSEpO1xuICAgICAgICAgIHJubTJCdWZmZXIuYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgICAgIHJlc29sdmUoYXJyYXlCdWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZXMgJiYgdGhpcy5fX2NvbnRhaW5zRmlsZU5hbWUoZmlsZXMsIGZpbGVuYW1lKSkge1xuICAgICAgICBybnBBcnJheUJ1ZmZlciA9IG5ldyBSblByb21pc2U8QXJyYXlCdWZmZXI+KHJlc29sdmUgPT4ge1xuICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gdGhpcy5fX2dldEZ1bGxQYXRoT2ZGaWxlTmFtZShmaWxlcywgZmlsZW5hbWUpO1xuICAgICAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0gZmlsZXNbZnVsbFBhdGghXTtcbiAgICAgICAgICBybm0yQnVmZmVyLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgICAgICByZXNvbHZlKGFycmF5QnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBybnBBcnJheUJ1ZmZlciA9IG5ldyBSblByb21pc2U8QXJyYXlCdWZmZXI+KFxuICAgICAgICAgIERhdGFVdGlsLmxvYWRSZXNvdXJjZUFzeW5jKFxuICAgICAgICAgICAgYmFzZVBhdGggKyBybm0yQnVmZmVyLnVyaSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAocmVzb2x2ZTogRnVuY3Rpb24sIHJlc3BvbnNlOiBBcnJheUJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICBybm0yQnVmZmVyLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKHJlamVjdDogRnVuY3Rpb24sIGVycm9yOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgcmVqZWN0KGBIVFRQIEVycm9yIFN0YXR1czoke2Vycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJubTJCdWZmZXIuYnVmZmVyUHJvbWlzZSA9IHJucEFycmF5QnVmZmVyO1xuICAgICAgcHJvbWlzZXNUb0xvYWRSZXNvdXJjZXMucHVzaChybnBBcnJheUJ1ZmZlcik7XG4gICAgfVxuXG4gICAgLy8gVGV4dHVyZXMgQXN5bmMgbG9hZFxuICAgIGZvciAoY29uc3Qgcm5tMkltYWdlIG9mIGdsdGZKc29uLmltYWdlcyA/PyBbXSkge1xuICAgICAgaWYgKHJubTJJbWFnZS51cmkgPT0gbnVsbCkge1xuICAgICAgICBpZiAoSXMuZXhpc3QodWludDhBcnJheU9mR2xiKSkge1xuICAgICAgICAgIC8vIEdsYlxuICAgICAgICAgIC8vIExvYWQgVGV4dHVyZSBmcm9tIGdsdGZKc29uLmJ1ZmZlclxuICAgICAgICAgIGNvbnN0IGltYWdlVWludDhBcnJheSA9IERhdGFVdGlsLmNyZWF0ZVVpbnQ4QXJyYXlGcm9tQnVmZmVyVmlld0luZm8oXG4gICAgICAgICAgICBnbHRmSnNvbixcbiAgICAgICAgICAgIHJubTJJbWFnZS5idWZmZXJWaWV3ISxcbiAgICAgICAgICAgIHVpbnQ4QXJyYXlPZkdsYlxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc3QgaW1hZ2VVcmkgPSBEYXRhVXRpbC5jcmVhdGVCbG9iSW1hZ2VVcmlGcm9tVWludDhBcnJheShpbWFnZVVpbnQ4QXJyYXksIHJubTJJbWFnZS5taW1lVHlwZSEpO1xuICAgICAgICAgIHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzLnB1c2godGhpcy5fX2xvYWRJbWFnZVVyaShpbWFnZVVyaSwgcm5tMkltYWdlLCBmaWxlcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGdsVEYrYmluXG4gICAgICAgICAgLy8gTG9hZCBUZXh0dXJlIGZyb20gZ2x0Zkpzb24uYnVmZmVyXG4gICAgICAgICAgY29uc3Qgcm5tMkJ1ZmZlclZpZXcgPSBnbHRmSnNvbi5idWZmZXJWaWV3c1tybm0ySW1hZ2UuYnVmZmVyVmlldyFdO1xuICAgICAgICAgIGNvbnN0IGJ1ZmZlckluZm8gPSBybm0yQnVmZmVyVmlldy5idWZmZXJPYmplY3Q7XG4gICAgICAgICAgaWYgKElzLm5vdC5leGlzdChidWZmZXJJbmZvKSkge1xuICAgICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2dsdGYyQnVmZmVyVmlldy5idWZmZXJPYmplY3Qgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJQcm9taXNlID0gYnVmZmVySW5mby5idWZmZXJQcm9taXNlIGFzIFJuUHJvbWlzZTxBcnJheUJ1ZmZlcj47XG5cbiAgICAgICAgICBjb25zdCBsb2FkSW1hZ2VBZnRlckxvYWRpbmdCdWZmZXIgPSBuZXcgUm5Qcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgYnVmZmVyUHJvbWlzZS50aGVuKChhcnJheWJ1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VVaW50OEFycmF5ID0gRGF0YVV0aWwuY3JlYXRlVWludDhBcnJheUZyb21CdWZmZXJWaWV3SW5mbyhcbiAgICAgICAgICAgICAgICBnbHRmSnNvbixcbiAgICAgICAgICAgICAgICBybm0ySW1hZ2UuYnVmZmVyVmlldyEsXG4gICAgICAgICAgICAgICAgYXJyYXlidWZmZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgY29uc3QgaW1hZ2VVcmkgPSBEYXRhVXRpbC5jcmVhdGVCbG9iSW1hZ2VVcmlGcm9tVWludDhBcnJheShpbWFnZVVpbnQ4QXJyYXksIHJubTJJbWFnZS5taW1lVHlwZSEpO1xuICAgICAgICAgICAgICB0aGlzLl9fbG9hZEltYWdlVXJpKGltYWdlVXJpLCBybm0ySW1hZ2UsIGZpbGVzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGFycmF5YnVmZmVyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KSBhcyBSblByb21pc2U8QXJyYXlCdWZmZXI+O1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyUHJvbWlzZUluZGV4OiBudW1iZXIgPSBwcm9taXNlc1RvTG9hZFJlc291cmNlcy5pbmRleE9mKGJ1ZmZlclByb21pc2UpO1xuICAgICAgICAgIHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzW2J1ZmZlclByb21pc2VJbmRleF0gPSBsb2FkSW1hZ2VBZnRlckxvYWRpbmdCdWZmZXI7XG4gICAgICAgICAgYnVmZmVySW5mby5idWZmZXJQcm9taXNlID0gbG9hZEltYWdlQWZ0ZXJMb2FkaW5nQnVmZmVyO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBMb2FkIFRleHR1cmUgZnJvbSBVUklcbiAgICAgICAgY29uc3QgaW1hZ2VGaWxlU3RyID0gcm5tMkltYWdlLnVyaTtcbiAgICAgICAgY29uc3Qgc3BsaXRVcmkgPSBpbWFnZUZpbGVTdHIuc3BsaXQoJy8nKTtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBzcGxpdFVyaVtzcGxpdFVyaS5sZW5ndGggLSAxXTtcblxuICAgICAgICBsZXQgaW1hZ2VVcmk6IHN0cmluZztcbiAgICAgICAgaWYgKGZpbGVzICYmIHRoaXMuX19jb250YWluc0ZpbGVOYW1lKGZpbGVzLCBmaWxlbmFtZSkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHRoaXMuX19nZXRGdWxsUGF0aE9mRmlsZU5hbWUoZmlsZXMsIGZpbGVuYW1lKTtcbiAgICAgICAgICBjb25zdCBhcnJheUJ1ZmZlciA9IGZpbGVzW2Z1bGxQYXRoIV07XG4gICAgICAgICAgaW1hZ2VVcmkgPSBEYXRhVXRpbC5jcmVhdGVCbG9iSW1hZ2VVcmlGcm9tVWludDhBcnJheShuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlciksIHJubTJJbWFnZS5taW1lVHlwZSEpO1xuICAgICAgICB9IGVsc2UgaWYgKGltYWdlRmlsZVN0ci5tYXRjaCgvXmRhdGE6LykpIHtcbiAgICAgICAgICBpbWFnZVVyaSA9IGltYWdlRmlsZVN0cjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVyaSA9IGJhc2VQYXRoICsgaW1hZ2VGaWxlU3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZXNUb0xvYWRSZXNvdXJjZXMucHVzaCh0aGlzLl9fbG9hZEltYWdlVXJpKGltYWdlVXJpLCBybm0ySW1hZ2UsIGZpbGVzKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlIGV4dGVuc2lvbiAtIExvYWQgLnJtbiBzaGFkZXIgbm9kZSBmaWxlc1xuICAgIGNvbnN0IHJtblByb21pc2VzID0gdGhpcy5fX2xvYWRSaG9kb25pdGVNYXRlcmlhbHNOb2RlUmVzb3VyY2VzKGdsdGZKc29uLCBmaWxlcywgYmFzZVBhdGgpO1xuICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiBybW5Qcm9taXNlcykge1xuICAgICAgcHJvbWlzZXNUb0xvYWRSZXNvdXJjZXMucHVzaChwcm9taXNlIGFzIFJuUHJvbWlzZTxBcnJheUJ1ZmZlciB8IFJuTTJJbWFnZT4pO1xuICAgIH1cblxuICAgIHJldHVybiBSblByb21pc2UuYWxsKHByb21pc2VzVG9Mb2FkUmVzb3VyY2VzLCBjYWxsYmFjaykuY2F0Y2goKGVycjogYW55KSA9PiB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihgUHJvbWlzZS5hbGwgZXJyb3I6ICR7ZXJyfWApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIC5ybW4gc2hhZGVyIG5vZGUgSlNPTiBmaWxlcyBmb3IgUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlIGV4dGVuc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZKc29uIC0gVGhlIGdsVEYgSlNPTiBkYXRhIGNvbnRhaW5pbmcgbWF0ZXJpYWxzIHdpdGggdGhlIGV4dGVuc2lvblxuICAgKiBAcGFyYW0gZmlsZXMgLSBDb2xsZWN0aW9uIG9mIGV4dGVybmFsIGZpbGVzIHRoYXQgbWF5IGNvbnRhaW4gLnJtbiBkYXRhXG4gICAqIEBwYXJhbSBiYXNlUGF0aCAtIEJhc2UgcGF0aCBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIFVSSXNcbiAgICogQHJldHVybnMgQXJyYXkgb2YgcHJvbWlzZXMgdGhhdCByZXNvbHZlIHdoZW4gLnJtbiBmaWxlcyBhcmUgbG9hZGVkXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19sb2FkUmhvZG9uaXRlTWF0ZXJpYWxzTm9kZVJlc291cmNlcyhcbiAgICBnbHRmSnNvbjogUm5NMixcbiAgICBmaWxlczogR2x0ZkZpbGVCdWZmZXJzLFxuICAgIGJhc2VQYXRoPzogc3RyaW5nXG4gICk6IFJuUHJvbWlzZTx1bmtub3duPltdIHtcbiAgICBjb25zdCBwcm9taXNlczogUm5Qcm9taXNlPHVua25vd24+W10gPSBbXTtcbiAgICBjb25zdCBFWFRFTlNJT05fTkFNRSA9ICdSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGUnO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV4dGVuc2lvbiBpcyB1c2VkXG4gICAgaWYgKCFnbHRmSnNvbi5leHRlbnNpb25zVXNlZD8uaW5jbHVkZXMoRVhURU5TSU9OX05BTUUpKSB7XG4gICAgICByZXR1cm4gcHJvbWlzZXM7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBlYWNoIG1hdGVyaWFsIHdpdGggdGhlIGV4dGVuc2lvblxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgZ2x0Zkpzb24ubWF0ZXJpYWxzID8/IFtdKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBtYXRlcmlhbC5leHRlbnNpb25zPy5bRVhURU5TSU9OX05BTUVdIGFzIFJuTTJFeHRlbnNpb25SaG9kb25pdGVNYXRlcmlhbHNOb2RlIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKCFleHRlbnNpb24/LnVyaSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgcm1uVXJpID0gZXh0ZW5zaW9uLnVyaTtcbiAgICAgIGNvbnN0IHNwbGl0VXJpID0gcm1uVXJpLnNwbGl0KCcvJyk7XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IHNwbGl0VXJpW3NwbGl0VXJpLmxlbmd0aCAtIDFdO1xuXG4gICAgICBsZXQgbG9hZFByb21pc2U6IFJuUHJvbWlzZTx1bmtub3duPjtcblxuICAgICAgaWYgKHJtblVyaS5tYXRjaCgvXmRhdGE6YXBwbGljYXRpb25cXC9qc29uO2Jhc2U2NCwvKSkge1xuICAgICAgICAvLyBIYW5kbGUgYmFzZTY0IGVuY29kZWQgZGF0YSBVUklcbiAgICAgICAgbG9hZFByb21pc2UgPSBuZXcgUm5Qcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBEYXRhVXRpbC5hcnJheUJ1ZmZlclRvU3RyaW5nKERhdGFVdGlsLmRhdGFVcmlUb0FycmF5QnVmZmVyKHJtblVyaSkpO1xuICAgICAgICAgIGV4dGVuc2lvbi5zaGFkZXJOb2RlSnNvbiA9IEpTT04ucGFyc2UoanNvblN0cik7XG4gICAgICAgICAgcmVzb2x2ZShleHRlbnNpb24uc2hhZGVyTm9kZUpzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZXMgJiYgdGhpcy5fX2NvbnRhaW5zRmlsZU5hbWUoZmlsZXMsIGZpbGVuYW1lKSkge1xuICAgICAgICAvLyBMb2FkIGZyb20gZmlsZXMgY29sbGVjdGlvblxuICAgICAgICBsb2FkUHJvbWlzZSA9IG5ldyBSblByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgY29uc3QgZnVsbFBhdGggPSB0aGlzLl9fZ2V0RnVsbFBhdGhPZkZpbGVOYW1lKGZpbGVzLCBmaWxlbmFtZSk7XG4gICAgICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBmaWxlc1tmdWxsUGF0aCFdO1xuICAgICAgICAgIGNvbnN0IGpzb25TdHIgPSBEYXRhVXRpbC5hcnJheUJ1ZmZlclRvU3RyaW5nKGFycmF5QnVmZmVyKTtcbiAgICAgICAgICBleHRlbnNpb24uc2hhZGVyTm9kZUpzb24gPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgIHJlc29sdmUoZXh0ZW5zaW9uLnNoYWRlck5vZGVKc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBMb2FkIGZyb20gVVJMXG4gICAgICAgIGNvbnN0IGZ1bGxVcmkgPSBiYXNlUGF0aCA/IGJhc2VQYXRoICsgcm1uVXJpIDogcm1uVXJpO1xuICAgICAgICBsb2FkUHJvbWlzZSA9IG5ldyBSblByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGZldGNoKGZ1bGxVcmkpXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgRXJyb3IgU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGpzb24gPT4ge1xuICAgICAgICAgICAgICBleHRlbnNpb24uc2hhZGVyTm9kZUpzb24gPSBqc29uO1xuICAgICAgICAgICAgICByZXNvbHZlKGpzb24pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGBGYWlsZWQgdG8gbG9hZCAucm1uIGZpbGU6ICR7ZnVsbFVyaX0sICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHByb21pc2VzLnB1c2gobG9hZFByb21pc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBzcGVjaWZpYyBmaWxlbmFtZSBleGlzdHMgaW4gdGhlIHByb3ZpZGVkIGZpbGVzIGNvbGxlY3Rpb24uXG4gICAqIENvbXBhcmVzIG9ubHkgdGhlIGZpbGVuYW1lIHBhcnQsIGlnbm9yaW5nIGRpcmVjdG9yeSBwYXRocy5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnNGaWxlcyAtIENvbGxlY3Rpb24gb2YgZmlsZXMgdG8gc2VhcmNoIGluXG4gICAqIEBwYXJhbSBmaWxlbmFtZSAtIFRoZSBmaWxlbmFtZSB0byBzZWFyY2ggZm9yXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGZpbGVuYW1lIGlzIGZvdW5kLCBmYWxzZSBvdGhlcndpc2VcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NvbnRhaW5zRmlsZU5hbWUob3B0aW9uc0ZpbGVzOiB7IFtzOiBzdHJpbmddOiBBcnJheUJ1ZmZlciB9LCBmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb3B0aW9uc0ZpbGVzKSB7XG4gICAgICBjb25zdCBzcGxpdCA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgY29uc3QgbGFzdCA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGxhc3QgPT09IGZpbGVuYW1lKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIGZ1bGwgcGF0aCBvZiBhIGZpbGUgYnkgaXRzIGZpbGVuYW1lIGZyb20gdGhlIGZpbGVzIGNvbGxlY3Rpb24uXG4gICAqIFJldHVybnMgdGhlIGNvbXBsZXRlIGtleSAocGF0aCkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgZ2l2ZW4gZmlsZW5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zRmlsZXMgLSBDb2xsZWN0aW9uIG9mIGZpbGVzIHRvIHNlYXJjaCBpblxuICAgKiBAcGFyYW0gZmlsZW5hbWUgLSBUaGUgZmlsZW5hbWUgdG8gZmluZCB0aGUgZnVsbCBwYXRoIGZvclxuICAgKiBAcmV0dXJucyBUaGUgZnVsbCBwYXRoIGlmIGZvdW5kLCB1bmRlZmluZWQgb3RoZXJ3aXNlXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRGdWxsUGF0aE9mRmlsZU5hbWUob3B0aW9uc0ZpbGVzOiB7IFtzOiBzdHJpbmddOiBBcnJheUJ1ZmZlciB9LCBmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb3B0aW9uc0ZpbGVzKSB7XG4gICAgICBjb25zdCBzcGxpdCA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgY29uc3QgbGFzdCA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGxhc3QgPT09IGZpbGVuYW1lKSB7XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBpbWFnZSBmcm9tIGEgVVJJIGFuZCBwcm9jZXNzZXMgaXQgYmFzZWQgb24gdGhlIGltYWdlIGZvcm1hdC5cbiAgICogU3VwcG9ydHMgc3RhbmRhcmQgaW1hZ2VzLCBCYXNpcyBVbml2ZXJzYWwgKC5iYXNpcyksIGFuZCBLVFgyIGNvbXByZXNzZWQgdGV4dHVyZXMuXG4gICAqIEhhbmRsZXMgYm90aCBkaXJlY3QgVVJJcyBhbmQgZGF0YSBlbWJlZGRlZCBpbiB0aGUgZmlsZXMgY29sbGVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGltYWdlVXJpIC0gVGhlIFVSSSBvZiB0aGUgaW1hZ2UgdG8gbG9hZFxuICAgKiBAcGFyYW0gaW1hZ2VKc29uIC0gVGhlIGdsVEYgaW1hZ2Ugb2JqZWN0IHRvIHBvcHVsYXRlIHdpdGggbG9hZGVkIGRhdGFcbiAgICogQHBhcmFtIGZpbGVzIC0gQ29sbGVjdGlvbiBvZiBmaWxlcyB0aGF0IG1heSBjb250YWluIHRoZSBpbWFnZSBkYXRhXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBwb3B1bGF0ZWQgaW1hZ2Ugb2JqZWN0XG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19sb2FkSW1hZ2VVcmkoaW1hZ2VVcmk6IHN0cmluZywgaW1hZ2VKc29uOiBSbk0ySW1hZ2UsIGZpbGVzOiBHbHRmRmlsZUJ1ZmZlcnMpOiBSblByb21pc2U8Um5NMkltYWdlPiB7XG4gICAgbGV0IGxvYWRJbWFnZVByb21pc2U6IFJuUHJvbWlzZTxSbk0ySW1hZ2U+O1xuICAgIGlmIChpbWFnZVVyaS5tYXRjaCgvYmFzaXMkLykpIHtcbiAgICAgIC8vIGxvYWQgYmFzaXMgZmlsZSBmcm9tIHVyaVxuICAgICAgbG9hZEltYWdlUHJvbWlzZSA9IG5ldyBSblByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGZldGNoKGltYWdlVXJpLCB7IG1vZGU6ICdjb3JzJyB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICByZXNwb25zZS5hcnJheUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgICAgICAgaW1hZ2VKc29uLmJhc2lzID0gdWludDhBcnJheTtcbiAgICAgICAgICAgIHJlc29sdmUoaW1hZ2VKc29uKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGltYWdlSnNvbi51cmk/Lm1hdGNoKC9iYXNpcyQvKSkge1xuICAgICAgLy8gZmluZCBiYXNpcyBmaWxlIGZyb20gZmlsZXMgb3B0aW9uXG4gICAgICBsb2FkSW1hZ2VQcm9taXNlID0gbmV3IFJuUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgaW1hZ2VKc29uLmJhc2lzID0gbmV3IFVpbnQ4QXJyYXkoZmlsZXNbaW1hZ2VKc29uLnVyaSFdKTtcbiAgICAgICAgcmVzb2x2ZShpbWFnZUpzb24pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGltYWdlVXJpLm1hdGNoKC9cXC5rdHgyJC8pIHx8XG4gICAgICBpbWFnZVVyaS5tYXRjaCgvXmRhdGE6aW1hZ2VcXC9rdHgyLykgfHxcbiAgICAgIChpbWFnZUpzb24uYnVmZmVyVmlldyAhPSBudWxsICYmIGltYWdlSnNvbi5taW1lVHlwZSA9PT0gJ2ltYWdlL2t0eDInKVxuICAgICkge1xuICAgICAgLy8gbG9hZCBrdHgyIGZpbGUgZnJvbSB1cmkoa3R4MiBmaWxlIG9yIGRhdGEgdXJpKSBvciBidWZmZXJWaWV3XG4gICAgICBsb2FkSW1hZ2VQcm9taXNlID0gbmV3IFJuUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgZmV0Y2goaW1hZ2VVcmksIHsgbW9kZTogJ2NvcnMnIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLmFycmF5QnVmZmVyKCkudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgdWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgICAgICAgICBpbWFnZUpzb24ua3R4MiA9IHVpbnQ4QXJyYXk7XG4gICAgICAgICAgICByZXNvbHZlKGltYWdlSnNvbik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpbWFnZUpzb24udXJpPy5tYXRjaCgva3R4MiQvKSkge1xuICAgICAgLy8gZmluZCBrdHgyIGZpbGUgZnJvbSBmaWxlcyBvcHRpb25cbiAgICAgIGxvYWRJbWFnZVByb21pc2UgPSBuZXcgUm5Qcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBpbWFnZUpzb24ua3R4MiA9IG5ldyBVaW50OEFycmF5KGZpbGVzW2ltYWdlSnNvbi51cmkhXSk7XG4gICAgICAgIHJlc29sdmUoaW1hZ2VKc29uKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkSW1hZ2VQcm9taXNlID0gbmV3IFJuUHJvbWlzZShhc3luYyByZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCBEYXRhVXRpbC5jcmVhdGVJbWFnZUZyb21VcmkoaW1hZ2VVcmksIGltYWdlSnNvbi5taW1lVHlwZSEpO1xuICAgICAgICBpbWFnZS5jcm9zc09yaWdpbiA9ICdBbm9ueW1vdXMnO1xuICAgICAgICBpbWFnZUpzb24uaW1hZ2UgPSBpbWFnZTtcbiAgICAgICAgcmVzb2x2ZShpbWFnZUpzb24pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvYWRJbWFnZVByb21pc2U7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsS0FBSyxVQUF1QjtBQUNyQyxTQUFTLGlCQUF5QztBQVMzQyxJQUFNLGdCQUFOLE1BQW9CO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFtQnZCLGFBQW9CLGNBQWMsS0FBYSxTQUF5QztBQXJDMUY7QUFzQ0ksVUFBTSxnQkFBZ0IsTUFBTSxTQUFTLGlCQUFpQixHQUFHO0FBRXpELFFBQUksY0FBYyxNQUFNLEdBQUc7QUFDekIsWUFBTSxjQUFjLFdBQVc7QUFBQSxJQUNqQztBQUVBLFVBQU0sU0FBUyxNQUFNLEtBQUssaUNBQWlDLGNBQWMsSUFBSSxJQUFHLHdDQUFTLFVBQVQsWUFBa0IsQ0FBQyxHQUFHLFNBQVMsR0FBRztBQUNsSCxXQUFPLE9BQU8sWUFBWTtBQUFBLEVBQzVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFvQkEsYUFBb0IsdUJBQXVCLE9BQXdCLFNBQXlDO0FBQzFHLGVBQVcsWUFBWSxPQUFPO0FBQzVCLFlBQU0sZ0JBQWdCLFNBQVMsYUFBYSxRQUFRO0FBRXBELFVBQUksa0JBQWtCLFVBQVUsa0JBQWtCLFNBQVMs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
