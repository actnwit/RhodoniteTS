import { DataUtil } from '../misc/DataUtil';
import { RnM2, RnM2Image, RnM2Accessor } from '../../types/RnM2';
import { RnPromise, RnPromiseCallback } from '../misc/RnPromise';
import { Is } from '../misc/Is';
import { ifDefinedThen } from '../misc/MiscUtil';
import { GltfFileBuffers, GltfLoadOption } from '../../types';
import { Err, Result, Ok } from '../misc/Result';
import { Logger } from '../misc/Logger';
import { Vrm1_Materials_MToon } from '../../types/VRMC_materials_mtoon';

declare let Rn: any;

/**
 * The glTF2 Importer class.
 */
export class Gltf2Importer {
  private constructor() {}

  /**
   * Import glTF2 file
   * @param url - url of glTF file
   * @param options - options for loading process
   * @returns a glTF2 based JSON pre-processed
   */
  public static async importFromUrl(
    url: string,
    options?: GltfLoadOption
  ): Promise<RnM2> {
    const promise = new Promise<RnM2>(async (resolve, reject) => {

      const r_arrayBuffer = await DataUtil.fetchArrayBuffer(url);

      if (r_arrayBuffer.isErr()) {
        reject(r_arrayBuffer.getRnError());
        return;
      }

      const result = await this._importGltfOrGlbFromArrayBuffers(
        r_arrayBuffer.get(),
        options?.files ?? {},
        options,
        url
      );
      resolve(result.unwrapForce());

    });

    return promise;
  }

  public static async importFromArrayBuffers(
    files: GltfFileBuffers,
    options?: GltfLoadOption
  ): Promise<RnM2> {
    const promise = new Promise<RnM2>(async (resolve, reject) => {
      for (const fileName in files) {
        const fileExtension = DataUtil.getExtension(fileName);

        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          const result = await this._importGltfOrGlbFromArrayBuffers(files[fileName], files, options);
          resolve(result.unwrapForce());
          return;
        }
      }
      reject(new Error('no gltf or glb file found'));
    });

    return promise;
  }

  /**
   * Import glTF2 array buffer.
   * @param arrayBuffer .gltf/.glb file in ArrayBuffer
   * @param otherFiles other resource files data in ArrayBuffers
   * @param options options for loading process (Optional)
   * @param uri .gltf file's uri (Optional)
   * @returns a glTF2 based JSON pre-processed
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
      } catch (err) {
        return new Err({
          message: 'this.__importGltf error',
          error: undefined,
        });
      }
    } else {
      try {
        const gltfJson = await this._importGlb(arrayBuffer, otherFiles, options!);
        return new Ok(gltfJson);
      } catch (err) {
        return new Err({
          message: 'this.importGlb error',
          error: undefined,
        });
      }
    }
  }

  static _getOptions(
    defaultOptions: GltfLoadOption,
    json: RnM2,
    options: GltfLoadOption
  ): GltfLoadOption {
    if (json.asset?.extras?.rnLoaderOptions != null) {
      for (const optionName in json.asset.extras.rnLoaderOptions) {
        (defaultOptions as any)[optionName as keyof GltfLoadOption] = json.asset.extras
          .rnLoaderOptions[optionName as keyof GltfLoadOption] as any;
      }
    }

    for (const optionName in options) {
      (defaultOptions as any)[optionName as keyof GltfLoadOption] = options[
        optionName as keyof GltfLoadOption
      ] as any;
    }

    if (options && options.loaderExtensionName && typeof options.loaderExtensionName === 'string') {
      if (Rn[options.loaderExtensionName] != null) {
        defaultOptions.loaderExtension = Rn[options.loaderExtensionName].getInstance();
      } else {
        Logger.error(`${options.loaderExtensionName} not found!`);
        defaultOptions.loaderExtension = void 0;
      }
    }

    return defaultOptions;
  }

  static async _importGlb(
    arrayBuffer: ArrayBuffer,
    files: GltfFileBuffers,
    options: GltfLoadOption
  ): Promise<RnM2> {
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
      Logger.info('this._loadInner error in _loadAsBinaryJson: ' + err);
    }
    return gltfJson;
  }

  public static async _importGltf(
    gltfJson: RnM2,
    fileArrayBuffers: GltfFileBuffers,
    options: GltfLoadOption,
    uri?: string,
    callback?: RnPromiseCallback
  ): Promise<RnM2> {
    const basePath = uri?.substring(0, uri?.lastIndexOf('/')) + '/'; // location of model file as basePath
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
      Logger.error('this._loadInner error in _loadAsTextJson: ' + err);
    }
    return gltfJson;
  }

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
    promises.push(
      this._loadResources(uint8arrayOfGlb!, gltfJson, files, options, basePath, callback)
    );

    // Parse glTF JSON
    promises.push(
      new RnPromise((resolve) => {
        this._loadJsonContent(gltfJson);
        resolve();
      }) as RnPromise<void>
    );

    return RnPromise.all(promises);
  }

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

  static _loadDependenciesOfNodes(gltfJson: RnM2) {
    for (const node_i in gltfJson.nodes) {
      const node = gltfJson.nodes[node_i];

      // Hierarchy
      node.childrenObjects = node.childrenObjects ?? [];
      if (node.children) {
        for (const child_i of node.children) {
          node.childrenObjects![child_i] = gltfJson.nodes[child_i];
          gltfJson.nodes[child_i].parent = parseInt(node_i);
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
          gltfJson.extensions.KHR_lights_punctual.lights[
            node.extensions.KHR_lights_punctual.lightIndex
          ];
      }
    }
  }

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

  private static _checkRnGltfLoaderOptionsExist(gltfModel: RnM2) {
    if (gltfModel.asset.extras && gltfModel.asset.extras.rnLoaderOptions) {
      return true;
    } else {
      return false;
    }
  }

  static _loadDependenciesOfMaterials(gltfJson: RnM2) {
    if (!gltfJson.textures) gltfJson.textures = [];

    // Material
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

        if (
          this._checkRnGltfLoaderOptionsExist(gltfJson) &&
          gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension &&
          gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension.setTextures
        ) {
          gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension.setTextures(gltfJson, material);
        }

        if (Is.exist(material.extensions)) {
          const extensions = material.extensions;
          if (Is.exist(extensions.KHR_materials_clearcoat)) {
            const clearcoatTexture = extensions.KHR_materials_clearcoat.clearcoatTexture;
            if (clearcoatTexture !== void 0) {
              clearcoatTexture.texture = gltfJson.textures[clearcoatTexture.index];
            }
            const clearcoatRoughnessTexture =
              extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture;
            if (clearcoatRoughnessTexture !== void 0) {
              clearcoatRoughnessTexture.texture =
                gltfJson.textures[clearcoatRoughnessTexture.index];
            }
            const clearcoatNormalTexture =
              extensions.KHR_materials_clearcoat.clearcoatNormalTexture;
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
            const iridescenceThicknessTexture =
              extensions.KHR_materials_iridescence.iridescenceThicknessTexture;
            if (iridescenceThicknessTexture !== void 0) {
              iridescenceThicknessTexture.texture =
                gltfJson.textures[iridescenceThicknessTexture.index];
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
              outlineWidthMultiplyTexture.texture =
                gltfJson.textures[outlineWidthMultiplyTexture.index];
            }
            const uvAnimationMaskTexture = mToon.uvAnimationMaskTexture;
            if (uvAnimationMaskTexture != null) {
              uvAnimationMaskTexture.texture = gltfJson.textures[uvAnimationMaskTexture.index];
            }
          }
        }
      }
    }
  }

  static _loadDependenciesOfTextures(gltfJson: RnM2) {
    // Texture
    if (gltfJson.textures) {
      for (const texture of gltfJson.textures) {
        ifDefinedThen((v) => (texture.samplerObject = gltfJson.samplers[v]), texture.sampler);

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
                  channel.samplerObject.outputObject.count /
                  channel.samplerObject.inputObject.count /
                  3;
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

  static _loadDependenciesOfBufferViews(gltfJson: RnM2) {
    // BufferView
    for (const bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferObject = gltfJson.buffers[bufferView.buffer!];
      }
    }
  }

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

  static _loadResources(
    uint8ArrayOfGlb: Uint8Array,
    gltfJson: RnM2,
    files: GltfFileBuffers,
    options: GltfLoadOption,
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
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve) => {
          rnm2Buffer.buffer = uint8ArrayOfGlb;
          resolve(uint8ArrayOfGlb);
        });
      } else if (rnm2Buffer.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve) => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(rnm2Buffer.uri!);
          rnm2Buffer.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if (files && this.__containsFileName(files, filename)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve) => {
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
              reject('HTTP Error Status:' + error);
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
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(
            imageUint8Array,
            rnm2Image.mimeType!
          );
          promisesToLoadResources.push(this.__loadImageUri(imageUri, rnm2Image, files));
        } else {
          // glTF+bin
          // Load Texture from gltfJson.buffer
          const rnm2BufferView = gltfJson.bufferViews[rnm2Image.bufferView!];
          const bufferInfo = rnm2BufferView.bufferObject;
          if (Is.not.exist(bufferInfo)) {
            Logger.error('gltf2BufferView.bufferObject not found');
            continue;
          }

          const bufferPromise = bufferInfo.bufferPromise as RnPromise<ArrayBuffer>;

          const loadImageAfterLoadingBuffer = new RnPromise((resolve) => {
            bufferPromise.then((arraybuffer: ArrayBuffer) => {
              const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
                gltfJson,
                rnm2Image.bufferView!,
                arraybuffer
              );
              const imageUri = DataUtil.createBlobImageUriFromUint8Array(
                imageUint8Array,
                rnm2Image.mimeType!
              );
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

        let imageUri;
        if (files && this.__containsFileName(files, filename)) {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(
            new Uint8Array(arrayBuffer),
            rnm2Image.mimeType!
          );
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }

        promisesToLoadResources.push(this.__loadImageUri(imageUri, rnm2Image, files));
      }
    }

    return RnPromise.all(promisesToLoadResources, callback).catch((err: any) => {
      Logger.error('Promise.all error: ' + err);
    });
  }

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

  private static __getFullPathOfFileName(
    optionsFiles: { [s: string]: ArrayBuffer },
    filename: string
  ) {
    for (const key in optionsFiles) {
      const split = key.split('/');
      const last = split[split.length - 1];
      if (last === filename) {
        return key;
      }
    }

    return undefined;
  }

  private static __loadImageUri(
    imageUri: string,
    imageJson: RnM2Image,
    files: GltfFileBuffers
  ): RnPromise<RnM2Image> {
    let loadImagePromise: RnPromise<RnM2Image>;
    if (imageUri.match(/basis$/)) {
      // load basis file from uri
      loadImagePromise = new RnPromise((resolve) => {
        fetch(imageUri, { mode: 'cors' }).then((response) => {
          response.arrayBuffer().then((buffer) => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.basis = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if (imageJson.uri?.match(/basis$/)) {
      // find basis file from files option
      loadImagePromise = new RnPromise((resolve) => {
        imageJson.basis = new Uint8Array(files[imageJson.uri!]);
        resolve(imageJson);
      });
    } else if (
      imageUri.match(/\.ktx2$/) ||
      imageUri.match(/^data:image\/ktx2/) ||
      (imageJson.bufferView != null && imageJson.mimeType === 'image/ktx2')
    ) {
      // load ktx2 file from uri(ktx2 file or data uri) or bufferView
      loadImagePromise = new RnPromise((resolve) => {
        fetch(imageUri, { mode: 'cors' }).then((response) => {
          response.arrayBuffer().then((buffer) => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.ktx2 = uint8Array;
            resolve(imageJson);
          });
        });
      });
    } else if (imageJson.uri?.match(/ktx2$/)) {
      // find ktx2 file from files option
      loadImagePromise = new RnPromise((resolve) => {
        imageJson.ktx2 = new Uint8Array(files[imageJson.uri!]);
        resolve(imageJson);
      });
    } else {
      loadImagePromise = new RnPromise(async (resolve) => {
      const image = await DataUtil.createImageFromUri(imageUri, imageJson.mimeType!);
        image.crossOrigin = 'Anonymous';
        imageJson.image = image;
          resolve(imageJson);
      });
    }

    return loadImagePromise;
  }
}
