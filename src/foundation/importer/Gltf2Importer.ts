import type { GltfFileBuffers, GltfLoadOption } from '../../types';
import type { RnM2, RnM2Accessor, RnM2ExtensionRhodoniteMaterialsNode, RnM2Image } from '../../types/RnM2';
import type { Vrm1_Materials_MToon } from '../../types/VRMC_materials_mtoon';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { ifDefinedThen } from '../misc/MiscUtil';
import { Err, Ok, type Result } from '../misc/Result';
import { RnPromise, type RnPromiseCallback } from '../misc/RnPromise';

declare let Rn: any;

/**
 * The glTF2 Importer class for loading and processing glTF 2.0 files.
 * Supports both .gltf (JSON) and .glb (binary) formats with comprehensive
 * extension support and resource loading capabilities.
 */
export class Gltf2Importer {
  private constructor() {}

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
  public static async importFromUrl(url: string, options?: GltfLoadOption): Promise<RnM2> {
    const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);

    if (r_arrayBuffer.isErr()) {
      throw r_arrayBuffer.getRnError();
    }

    const result = await this._importGltfOrGlbFromArrayBuffers(r_arrayBuffer.get(), options?.files ?? {}, options, url);
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
  public static async importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption): Promise<RnM2> {
    for (const fileName in files) {
      const fileExtension = DataUtil.getExtension(fileName);

      if (fileExtension === 'gltf' || fileExtension === 'glb' || fileExtension === 'rnb') {
        const result = await this._importGltfOrGlbFromArrayBuffers(files[fileName], files, options);
        return result.unwrapForce();
      }
    }
    throw new Error('no gltf or glb file found');
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
  public static async _importGltfOrGlbFromArrayBuffers(
    arrayBuffer: ArrayBuffer,
    otherFiles: GltfFileBuffers,
    options?: GltfLoadOption,
    uri?: string
  ): Promise<Result<RnM2, undefined>> {
    const dataView = new DataView(arrayBuffer, 0, 20);
    // Magic field
    const magic = dataView.getUint32(0, true);
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546c67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      try {
        const gltfJson = await this._importGltf(json, otherFiles, options!, uri);
        return new Ok(gltfJson);
      } catch {
        return new Err({
          message: 'this.__importGltf error',
          error: undefined,
        });
      }
    } else {
      try {
        const gltfJson = await this._importGlb(arrayBuffer, otherFiles, options!);
        return new Ok(gltfJson);
      } catch {
        return new Err({
          message: 'this.importGlb error',
          error: undefined,
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
  static _getOptions(defaultOptions: GltfLoadOption, json: RnM2, options: GltfLoadOption): GltfLoadOption {
    if (json.asset?.extras?.rnLoaderOptions != null) {
      for (const optionName in json.asset.extras.rnLoaderOptions) {
        (defaultOptions as any)[optionName as keyof GltfLoadOption] = json.asset.extras.rnLoaderOptions[
          optionName as keyof GltfLoadOption
        ] as any;
      }
    }

    for (const optionName in options) {
      (defaultOptions as any)[optionName as keyof GltfLoadOption] = options[optionName as keyof GltfLoadOption] as any;
    }

    if (options?.loaderExtensionName && typeof options.loaderExtensionName === 'string') {
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
  static async _importGlb(arrayBuffer: ArrayBuffer, files: GltfFileBuffers, options: GltfLoadOption): Promise<RnM2> {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const gltfVer = dataView.getUint32(4, true);
    if (gltfVer !== 2) {
      throw new Error('invalid version field in this binary glTF file.');
    }
    const lengthOfJSonChunkData = dataView.getUint32(12, true);
    const chunkType = dataView.getUint32(16, true);
    // 0x4E4F534A means JSON format (0x4E4F534A is 'JSON' in ASCII codes)
    if (chunkType !== 0x4e4f534a) {
      throw new Error('invalid chunkType of chunk0 in this binary glTF file.');
    }
    const uint8ArrayJSonContent = new Uint8Array(arrayBuffer, 20, lengthOfJSonChunkData);
    const gotText = DataUtil.uint8ArrayToString(uint8ArrayJSonContent);
    const gltfJson = JSON.parse(gotText);
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);
    const uint8array = new Uint8Array(arrayBuffer, 20 + lengthOfJSonChunkData + 8);

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = { fileType: 'glTF', version: '2' };
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson!);
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
  public static async _importGltf(
    gltfJson: RnM2,
    fileArrayBuffers: GltfFileBuffers,
    options: GltfLoadOption,
    uri?: string,
    callback?: RnPromiseCallback
  ): Promise<RnM2> {
    const basePath = `${uri?.substring(0, uri?.lastIndexOf('/'))}/`; // location of model file as basePath
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = { fileType: 'glTF', version: '2' };
    }

    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson!);
    gltfJson.asset.extras.rnLoaderOptions = options;

    try {
      await this._loadInner(gltfJson, fileArrayBuffers, options, undefined, basePath, callback);
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
  static _loadInner(
    gltfJson: RnM2,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    uint8arrayOfGlb?: Uint8Array,
    basePath?: string,
    callback?: RnPromiseCallback
  ): RnPromise<any[]> {
    const promises = [];

    // Load resources to above resources object.
    promises.push(this._loadResources(uint8arrayOfGlb!, gltfJson, files, options, basePath, callback));

    // Parse glTF JSON
    promises.push(
      new RnPromise(resolve => {
        this._loadJsonContent(gltfJson);
        resolve();
      }) as RnPromise<void>
    );

    return RnPromise.all(promises);
  }

  /**
   * Processes the glTF JSON content by resolving all internal dependencies.
   * Sets up object references between scenes, nodes, meshes, materials, textures, etc.
   *
   * @param gltfJson - The glTF JSON data to process
   *
   * @internal
   */
  static _loadJsonContent(gltfJson: RnM2) {
    // Scene
    this._loadDependenciesOfScenes(gltfJson);

    // Node
    this._loadDependenciesOfNodes(gltfJson);

    // Mesh
    this._loadDependenciesOfMeshes(gltfJson);

    // Material
    this._loadDependenciesOfMaterials(gltfJson);

    // Texture
    this._loadDependenciesOfTextures(gltfJson);

    // Joint
    this._loadDependenciesOfJoints(gltfJson);

    // Animation
    this._loadDependenciesOfAnimations(gltfJson);

    // Accessor
    this._loadDependenciesOfAccessors(gltfJson);

    // BufferView
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
  static _loadDependenciesOfScenes(gltfJson: RnM2) {
    for (const scene of gltfJson.scenes) {
      if (Is.undefined(scene.nodesObjects)) {
        scene.nodesObjects = [];
      }
      for (const i of scene.nodes!) {
        scene.nodesObjects![i] = gltfJson.nodes[scene.nodes![i]];
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
  static _loadDependenciesOfNodes(gltfJson: RnM2) {
    for (const node_i in gltfJson.nodes) {
      const node = gltfJson.nodes[node_i];

      // Hierarchy
      node.childrenObjects = node.childrenObjects ?? [];
      if (node.children) {
        for (const child_i of node.children) {
          node.childrenObjects![child_i] = gltfJson.nodes[child_i];
          gltfJson.nodes[child_i].parent = Number.parseInt(node_i, 10);
          gltfJson.nodes[child_i].parentObject = node;
        }
      }

      // Mesh
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshObject = gltfJson.meshes[node.mesh!];
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinObject = gltfJson.skins[node.skin];
        if (Is.exist(node.skinObject)) {
          if (Is.not.exist(node.meshObject?.extras)) {
            node.meshObject!.extras = {};
          }

          node.meshObject!.extras._skin = node.skin;
        }
      }

      // Camera
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraObject = gltfJson.cameras[node.camera];
      }

      // Lights
      if (
        node.extensions !== void 0 &&
        node.extensions.KHR_lights_punctual !== void 0 &&
        gltfJson.extensions !== void 0 &&
        gltfJson.extensions.KHR_lights_punctual !== void 0
      ) {
        node.extensions.KHR_lights_punctual.lightIndex = node.extensions.KHR_lights_punctual.light;
        node.extensions.KHR_lights_punctual.light =
          gltfJson.extensions.KHR_lights_punctual.lights[node.extensions.KHR_lights_punctual.lightIndex];
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
  static _loadDependenciesOfMeshes(gltfJson: RnM2) {
    // Mesh
    if (Is.not.exist(gltfJson.meshes)) {
      return;
    }
    for (const mesh of gltfJson.meshes) {
      for (const primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialObject = gltfJson.materials[primitive.material];
        }

        if (primitive.extensions?.KHR_materials_variants != null) {
          primitive.materialVariants = [];
          const mappings = primitive.extensions.KHR_materials_variants.mappings;
          const variantNames = gltfJson.extensions.KHR_materials_variants.variants;
          for (const mapping of mappings) {
            const variants = mapping.variants.map((variantIdx: number) => {
              return variantNames[variantIdx].name;
            });

            const materialVariant = {
              materialObject: gltfJson.materials[mapping.material],
              material: mapping.material,
              variants: variants,
            };

            primitive.materialVariants.push(materialVariant);
          }
        }

        primitive.attributesObjects = {} as unknown as {
          [s: string]: RnM2Accessor;
        };
        for (const attributeName in primitive.attributes) {
          const accessorId = primitive.attributes[attributeName];
          const accessor = gltfJson.accessors[accessorId!];
          accessor.extras = {};
          primitive.attributesObjects[attributeName] = accessor;
        }

        if (primitive.indices != null) {
          primitive.indicesObject = gltfJson.accessors[primitive.indices];
        }

        if (primitive.targets != null) {
          primitive.targetsObjects = [];
          for (const target of primitive.targets) {
            const attributes = {} as unknown as { [s: string]: RnM2Accessor };
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
  private static _checkRnGltfLoaderOptionsExist(gltfModel: RnM2) {
    if (gltfModel.asset.extras?.rnLoaderOptions) {
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
  static _loadDependenciesOfMaterials(gltfJson: RnM2) {
    if (!gltfJson.textures) gltfJson.textures = [];

    if (gltfJson.materials) {
      for (const material of gltfJson.materials) {
        this._loadBasicMaterialTextures(gltfJson, material);
        this._loadMaterialExtensions(gltfJson, material);
      }
    }
  }

  private static _loadBasicMaterialTextures(gltfJson: RnM2, material: any) {
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

    if (
      this._checkRnGltfLoaderOptionsExist(gltfJson) &&
      gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension &&
      gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension.setTextures
    ) {
      gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension.setTextures(gltfJson, material);
    }
  }

  private static _loadMaterialExtensions(gltfJson: RnM2, material: any) {
    if (Is.exist(material.extensions)) {
      const extensions = material.extensions;
      this._loadKHRExtensions(gltfJson, extensions);
      this._loadVRMCExtensions(gltfJson, extensions);
    }
  }

  private static _loadKHRExtensions(gltfJson: RnM2, extensions: any) {
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
      const diffuseTransmissionColorTexture =
        extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture;
      if (diffuseTransmissionColorTexture !== void 0) {
        diffuseTransmissionColorTexture.texture = gltfJson.textures[diffuseTransmissionColorTexture.index];
      }
    }
  }

  private static _loadVRMCExtensions(gltfJson: RnM2, extensions: any) {
    if (Is.exist(extensions.VRMC_materials_mtoon)) {
      const mToon = extensions.VRMC_materials_mtoon as Vrm1_Materials_MToon;
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
  static _loadDependenciesOfTextures(gltfJson: RnM2) {
    // Texture
    if (gltfJson.textures) {
      for (const texture of gltfJson.textures) {
        ifDefinedThen(v => {
          texture.samplerObject = gltfJson.samplers[v];
        }, texture.sampler);

        if (texture.extensions?.KHR_texture_basisu?.source != null) {
          texture.extensions.KHR_texture_basisu.fallbackSourceIndex = texture.source;
          texture.source = texture.extensions.KHR_texture_basisu.source as number;
          texture.sourceObject = gltfJson.images[texture.source];
        } else if (texture.source !== void 0) {
          texture.sourceObject = gltfJson.images[texture.source!];
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
  static _loadDependenciesOfJoints(gltfJson: RnM2) {
    if (gltfJson.skins) {
      for (const skin of gltfJson.skins) {
        skin.skeletonObject = gltfJson.nodes[skin.skeleton!];

        skin.inverseBindMatricesObject = gltfJson.accessors[skin.inverseBindMatrices!];

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
  static _loadDependenciesOfAnimations(gltfJson: RnM2) {
    if (gltfJson.animations) {
      for (const animation of gltfJson.animations) {
        for (const channel of animation.channels) {
          if (Is.exist(channel.sampler)) {
            channel.samplerObject = animation.samplers[channel.sampler];
            channel.target.nodeObject = gltfJson.nodes[channel.target.node!];
            channel.samplerObject.inputObject = gltfJson.accessors[channel.samplerObject.input!];
            channel.samplerObject.outputObject = gltfJson.accessors[channel.samplerObject.output!];
            if (Is.undefined(channel.samplerObject.outputObject.extras)) {
              channel.samplerObject.outputObject.extras = {} as any;
            }
            if (channel.target.path === 'weights') {
              let weightsArrayLength =
                channel.samplerObject.outputObject.count / channel.samplerObject.inputObject.count;
              if (channel.samplerObject.interpolation === 'CUBICSPLINE') {
                // divided by 3, because in glTF CUBICSPLINE interpolation,
                //   tangents (ak, bk) and values (vk) are grouped
                //       within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
                weightsArrayLength =
                  channel.samplerObject.outputObject.count / channel.samplerObject.inputObject.count / 3;
              }
              channel.samplerObject.outputObject.extras!.weightsArrayLength = weightsArrayLength;
            }
            if (channel.target.path === 'rotation') {
              channel.samplerObject.outputObject.extras!.quaternionIfVec4 = true;
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
  static _loadDependenciesOfAccessors(gltfJson: RnM2) {
    // Accessor
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
  static _loadDependenciesOfBufferViews(gltfJson: RnM2) {
    // BufferView
    for (const bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferObject = gltfJson.buffers[bufferView.buffer!];
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
  static _mergeExtendedJson(gltfJson: RnM2, extendedData: ArrayBuffer | string | object) {
    let extendedJson = null;
    if (extendedData instanceof ArrayBuffer) {
      const extendedJsonStr = DataUtil.arrayBufferToString(extendedData);
      extendedJson = JSON.parse(extendedJsonStr);
    } else if (typeof extendedData === 'string') {
      extendedJson = JSON.parse(extendedData);
    } else if (typeof extendedData === 'object') {
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
  static _loadResources(
    uint8ArrayOfGlb: Uint8Array,
    gltfJson: RnM2,
    files: GltfFileBuffers,
    _options: GltfLoadOption,
    basePath?: string,
    callback?: RnPromiseCallback
  ) {
    const promisesToLoadResources: RnPromise<ArrayBuffer | RnM2Image>[] = [];

    // Buffers Async load
    let rnpArrayBuffer: RnPromise<ArrayBuffer>;
    for (const rnm2Buffer of gltfJson.buffers) {
      let filename = '';
      if (rnm2Buffer.uri) {
        const splitUri = rnm2Buffer.uri.split('/');
        filename = splitUri[splitUri.length - 1];
      }

      if (typeof rnm2Buffer.uri === 'undefined') {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(resolve => {
          rnm2Buffer.buffer = uint8ArrayOfGlb;
          resolve(uint8ArrayOfGlb as unknown as ArrayBuffer);
        });
      } else if (rnm2Buffer.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(resolve => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(rnm2Buffer.uri!);
          rnm2Buffer.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if (files && this.__containsFileName(files, filename)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(resolve => {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          rnm2Buffer.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(
          DataUtil.loadResourceAsync(
            basePath + rnm2Buffer.uri,
            true,
            (resolve: Function, response: ArrayBuffer) => {
              rnm2Buffer.buffer = new Uint8Array(response);
              resolve(response);
            },
            (reject: Function, error: number) => {
              reject(`HTTP Error Status:${error}`);
            }
          )
        );
      }
      rnm2Buffer.bufferPromise = rnpArrayBuffer;
      promisesToLoadResources.push(rnpArrayBuffer);
    }

    // Textures Async load
    for (const rnm2Image of gltfJson.images ?? []) {
      if (rnm2Image.uri == null) {
        if (Is.exist(uint8ArrayOfGlb)) {
          // Glb
          // Load Texture from gltfJson.buffer
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            rnm2Image.bufferView!,
            uint8ArrayOfGlb
          );
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(imageUint8Array, rnm2Image.mimeType!);
          promisesToLoadResources.push(this.__loadImageUri(imageUri, rnm2Image, files));
        } else {
          // glTF+bin
          // Load Texture from gltfJson.buffer
          const rnm2BufferView = gltfJson.bufferViews[rnm2Image.bufferView!];
          const bufferInfo = rnm2BufferView.bufferObject;
          if (Is.not.exist(bufferInfo)) {
            Logger.default.error('gltf2BufferView.bufferObject not found');
            continue;
          }

          const bufferPromise = bufferInfo.bufferPromise as RnPromise<ArrayBuffer>;

          const loadImageAfterLoadingBuffer = new RnPromise(resolve => {
            bufferPromise.then((arraybuffer: ArrayBuffer) => {
              const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
                gltfJson,
                rnm2Image.bufferView!,
                arraybuffer
              );
              const imageUri = DataUtil.createBlobImageUriFromUint8Array(imageUint8Array, rnm2Image.mimeType!);
              this.__loadImageUri(imageUri, rnm2Image, files).then(() => {
                resolve(arraybuffer);
              });
            });
          }) as RnPromise<ArrayBuffer>;

          const bufferPromiseIndex: number = promisesToLoadResources.indexOf(bufferPromise);
          promisesToLoadResources[bufferPromiseIndex] = loadImageAfterLoadingBuffer;
          bufferInfo.bufferPromise = loadImageAfterLoadingBuffer;
        }
      } else {
        // Load Texture from URI
        const imageFileStr = rnm2Image.uri;
        const splitUri = imageFileStr.split('/');
        const filename = splitUri[splitUri.length - 1];

        let imageUri: string;
        if (files && this.__containsFileName(files, filename)) {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(new Uint8Array(arrayBuffer), rnm2Image.mimeType!);
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }

        promisesToLoadResources.push(this.__loadImageUri(imageUri, rnm2Image, files));
      }
    }

    // RHODONITE_materials_node extension - Load .rmn shader node files
    const rmnPromises = this.__loadRhodoniteMaterialsNodeResources(gltfJson, files, basePath);
    for (const promise of rmnPromises) {
      promisesToLoadResources.push(promise as RnPromise<ArrayBuffer | RnM2Image>);
    }

    return RnPromise.all(promisesToLoadResources, callback).catch((err: any) => {
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
  private static __loadRhodoniteMaterialsNodeResources(
    gltfJson: RnM2,
    files: GltfFileBuffers,
    basePath?: string
  ): RnPromise<unknown>[] {
    const promises: RnPromise<unknown>[] = [];
    const EXTENSION_NAME = 'RHODONITE_materials_node';

    // Check if the extension is used
    if (!gltfJson.extensionsUsed?.includes(EXTENSION_NAME)) {
      return promises;
    }

    // Process each material with the extension
    for (const material of gltfJson.materials ?? []) {
      const extension = material.extensions?.[EXTENSION_NAME] as RnM2ExtensionRhodoniteMaterialsNode | undefined;
      if (!extension?.uri) {
        continue;
      }

      const rmnUri = extension.uri;
      const splitUri = rmnUri.split('/');
      const filename = splitUri[splitUri.length - 1];

      let loadPromise: RnPromise<unknown>;

      if (rmnUri.match(/^data:application\/json;base64,/)) {
        // Handle base64 encoded data URI
        loadPromise = new RnPromise(resolve => {
          const jsonStr = DataUtil.arrayBufferToString(DataUtil.dataUriToArrayBuffer(rmnUri));
          extension.shaderNodeJson = JSON.parse(jsonStr);
          resolve(extension.shaderNodeJson);
        });
      } else if (files && this.__containsFileName(files, filename)) {
        // Load from files collection
        loadPromise = new RnPromise(resolve => {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          const jsonStr = DataUtil.arrayBufferToString(arrayBuffer);
          extension.shaderNodeJson = JSON.parse(jsonStr);
          resolve(extension.shaderNodeJson);
        });
      } else {
        // Load from URL
        const fullUri = basePath ? basePath + rmnUri : rmnUri;
        loadPromise = new RnPromise((resolve, reject) => {
          fetch(fullUri)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP Error Status: ${response.status}`);
              }
              return response.json();
            })
            .then(json => {
              extension.shaderNodeJson = json;
              resolve(json);
            })
            .catch(error => {
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
  private static __containsFileName(optionsFiles: { [s: string]: ArrayBuffer }, filename: string) {
    for (const key in optionsFiles) {
      const split = key.split('/');
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
  private static __getFullPathOfFileName(optionsFiles: { [s: string]: ArrayBuffer }, filename: string) {
    for (const key in optionsFiles) {
      const split = key.split('/');
      const last = split[split.length - 1];
      if (last === filename) {
        return key;
      }
    }

    return undefined;
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
  private static __loadImageUri(imageUri: string, imageJson: RnM2Image, files: GltfFileBuffers): RnPromise<RnM2Image> {
    let loadImagePromise: RnPromise<RnM2Image>;
    if (imageUri.match(/basis$/)) {
      // load basis file from uri
      loadImagePromise = new RnPromise(resolve => {
        fetch(imageUri, { mode: 'cors' }).then(response => {
          response.arrayBuffer().then(buffer => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.basis = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if (imageJson.uri?.match(/basis$/)) {
      // find basis file from files option
      loadImagePromise = new RnPromise(resolve => {
        imageJson.basis = new Uint8Array(files[imageJson.uri!]);
        resolve(imageJson);
      });
    } else if (
      imageUri.match(/\.ktx2$/) ||
      imageUri.match(/^data:image\/ktx2/) ||
      (imageJson.bufferView != null && imageJson.mimeType === 'image/ktx2')
    ) {
      // load ktx2 file from uri(ktx2 file or data uri) or bufferView
      loadImagePromise = new RnPromise(resolve => {
        fetch(imageUri, { mode: 'cors' }).then(response => {
          response.arrayBuffer().then(buffer => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.ktx2 = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if (imageJson.uri?.match(/ktx2$/)) {
      // find ktx2 file from files option
      loadImagePromise = new RnPromise(resolve => {
        imageJson.ktx2 = new Uint8Array(files[imageJson.uri!]);
        resolve(imageJson);
      });
    } else {
      loadImagePromise = new RnPromise(async resolve => {
        const image = await DataUtil.createImageFromUri(imageUri, imageJson.mimeType!);
        image.crossOrigin = 'Anonymous';
        imageJson.image = image;
        resolve(imageJson);
      });
    }

    return loadImagePromise;
  }
}
