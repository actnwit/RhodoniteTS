import DataUtil from '../misc/DataUtil';
import {
  RnM2,
  GltfLoadOption,
  RnM2Image,
  GltfFileBuffers,
  RnM2Accessor,
} from '../../types/glTF';
import RnPromise from '../misc/RnPromise';
import {Is} from '../misc/Is';
import {ifDefinedThen} from '../misc/MiscUtil';

declare let Rn: any;

/**
 * The glTF2 Importer class.
 */
export default class Gltf2Importer {
  private static __instance: Gltf2Importer;

  private constructor() {}

  /**
   * Import glTF2 file
   * @param uri - uri of glTF file
   * @param options - options for loading process
   * @returns a glTF2 based JSON pre-processed
   */
  async import(
    uri: string,
    options?: GltfLoadOption
  ): Promise<RnM2 | undefined> {
    if (options && options.files) {
      for (const fileName in options.files) {
        const fileExtension = DataUtil.getExtension(fileName);

        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          return await this.importGltfOrGlbFromArrayBuffers(
            (options.files as any)[fileName],
            options.files,
            options,
            uri
          ).catch(err => {
            console.log('this.__loadFromArrayBuffer error', err);
            return undefined;
          });
        }
      }
    }

    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    const glTFJson = await this.importGltfOrGlbFromArrayBuffers(
      arrayBuffer,
      options?.files ?? {},
      options,
      uri
    ).catch(err => {
      console.log('this.__loadFromArrayBuffer error', err);
      return undefined;
    });
    return glTFJson;
  }

  async importGltfOrGlbFromFile(uri: string, options?: GltfLoadOption) {
    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    const glTFJson = await this.importGltfOrGlbFromArrayBuffers(
      arrayBuffer,
      {},
      options,
      uri
    ).catch(err => {
      console.log('this.__loadFromArrayBuffer error', err);
    });
    return glTFJson;
  }

  /**
   * Import glTF2 array buffer.
   * @param arrayBuffer .gltf/.glb file in ArrayBuffer
   * @param otherFiles other resource files data in ArrayBuffers
   * @param options options for loading process (Optional)
   * @param uri .gltf file's uri (Optional)
   * @returns a glTF2 based JSON pre-processed
   */
  async importGltfOrGlbFromArrayBuffers(
    arrayBuffer: ArrayBuffer,
    otherFiles: GltfFileBuffers,
    options?: GltfLoadOption,
    uri?: string
  ): Promise<RnM2 | undefined> {
    const dataView = new DataView(arrayBuffer, 0, 20);
    // Magic field
    const magic = dataView.getUint32(0, true);
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546c67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      const gltfJson = await this.importGltf(
        json,
        otherFiles,
        options as GltfLoadOption,
        uri
      ).catch(err => {
        console.log('this.__loadAsTextJson error', err);
        return undefined;
      });
      return gltfJson;
    } else {
      const gltfJson = await this.importGlb(
        arrayBuffer,
        otherFiles,
        options as GltfLoadOption
      ).catch(err => {
        console.log('this.__loadAsBinaryJson error', err);
        return undefined;
      });
      return gltfJson;
    }
  }

  _getOptions(defaultOptions: any, json: RnM2, options: any): GltfLoadOption {
    if (json.asset && json.asset.extras && json.asset.extras.rnLoaderOptions) {
      for (const optionName in json.asset.extras.rnLoaderOptions) {
        defaultOptions[optionName] = (json.asset.extras.rnLoaderOptions as any)[
          optionName
        ];
      }
    }

    for (const optionName in options) {
      defaultOptions[optionName] = options[optionName];
    }

    if (
      options &&
      options.loaderExtensionName &&
      typeof options.loaderExtensionName === 'string'
    ) {
      if (Rn[options.loaderExtensionName] != null) {
        defaultOptions.loaderExtension =
          Rn[options.loaderExtensionName].getInstance();
      } else {
        console.error(`${options.loaderExtensionName} not found!`);
        defaultOptions.loaderExtension = void 0;
      }
    }

    return defaultOptions;
  }

  async importGlb(
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
    const uint8ArrayJSonContent = new Uint8Array(
      arrayBuffer,
      20,
      lengthOfJSonChunkData
    );
    const gotText = DataUtil.uint8ArrayToString(uint8ArrayJSonContent);
    const gltfJson = JSON.parse(gotText);
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);
    const uint8array = new Uint8Array(
      arrayBuffer,
      20 + lengthOfJSonChunkData + 8
    );

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: 'glTF', version: '2'};
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;

    try {
      await this._loadInner(gltfJson, files, options, uint8array);
    } catch (err) {
      console.log('this._loadInner error in _loadAsBinaryJson', err);
    }
    return gltfJson;
  }

  async importGltf(
    gltfJson: RnM2,
    fileArrayBuffers: GltfFileBuffers,
    options: GltfLoadOption,
    uri?: string
  ): Promise<RnM2> {
    const basePath = uri?.substring(0, uri?.lastIndexOf('/')) + '/'; // location of model file as basePath
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: 'glTF', version: '2'};
    }

    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;

    try {
      await this._loadInner(
        gltfJson,
        fileArrayBuffers,
        options,
        undefined,
        basePath
      );
    } catch (err) {
      console.log('this._loadInner error in _loadAsTextJson', err);
    }
    return gltfJson;
  }

  _loadInner(
    gltfJson: RnM2,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    uint8array?: Uint8Array,
    basePath?: string
  ) {
    const promises = [];

    // Load resources to above resources object.
    promises.push(
      this._loadResources(uint8array!, gltfJson, files, options, basePath)
    );

    // Parse glTF JSON
    promises.push(
      new Promise((resolve, reject) => {
        this._loadJsonContent(gltfJson);
        resolve();
      }) as Promise<void>
    );

    return Promise.all(promises);
  }

  _loadJsonContent(gltfJson: RnM2) {
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

  _loadDependenciesOfScenes(gltfJson: RnM2) {
    for (const scene of gltfJson.scenes) {
      if (Is.undefined(scene.nodesObjects)) {
        scene.nodesObjects = [];
      }
      for (const i of scene.nodes!) {
        scene.nodesObjects![i] = gltfJson.nodes[scene.nodes![i]];
      }
    }
  }

  _loadDependenciesOfNodes(gltfJson: RnM2) {
    for (const node of gltfJson.nodes) {
      // Hierarchy
      node.childrenObjects = node.childrenObjects ?? [];
      if (node.children) {
        for (const i of node.children) {
          node.childrenObjects![i] = gltfJson.nodes[i];
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
        gltfJson.extensions !== void 0 &&
        gltfJson.extensions.KHR_lights_punctual !== void 0
      ) {
        node.extensions.KHR_lights_punctual.lightIndex =
          node.extensions.KHR_lights_punctual.light;
        node.extensions.KHR_lights_punctual.light =
          gltfJson.extensions.KHR_lights_punctual.lights[
            node.extensions.KHR_lights_punctual.lightIndex
          ];
      }
    }
  }

  _loadDependenciesOfMeshes(gltfJson: RnM2) {
    // Mesh
    for (const mesh of gltfJson.meshes) {
      for (const primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialObject = gltfJson.materials[primitive.material];
        }

        primitive.attributesObjects = {} as unknown as {
          [s: string]: RnM2Accessor;
        };
        for (const attributeName in primitive.attributes) {
          const accessorId = primitive.attributes[attributeName];
          const accessor = gltfJson.accessors[accessorId!];
          accessor.extras = {
            toGetAsTypedArray: true,
            attributeName: attributeName,
          };
          primitive.attributesObjects[attributeName] = accessor;
        }

        if (primitive.indices != null) {
          primitive.indicesObject = gltfJson.accessors[primitive.indices];
        }

        if (primitive.targets != null) {
          primitive.targetsObjects = [];
          for (const target of primitive.targets) {
            const attributes = {} as unknown as {[s: string]: RnM2Accessor};
            for (const attributeName in target) {
              const targetShapeTargetAccessorId = target[attributeName];
              if (targetShapeTargetAccessorId >= 0) {
                const accessor =
                  gltfJson.accessors[targetShapeTargetAccessorId];
                accessor.extras = {
                  toGetAsTypedArray: true,
                  attributeName: attributeName,
                };
                attributes[attributeName] = accessor;
              }
            }
            primitive.targetsObjects.push(attributes);
          }
        }
      }
    }
  }

  private _checkRnGltfLoaderOptionsExist(gltfModel: RnM2) {
    if (gltfModel.asset.extras && gltfModel.asset.extras.rnLoaderOptions) {
      return true;
    } else {
      return false;
    }
  }

  _loadDependenciesOfMaterials(gltfJson: RnM2) {
    if (!gltfJson.textures) gltfJson.textures = [];

    // Material
    if (gltfJson.materials) {
      for (const material of gltfJson.materials) {
        if (material.pbrMetallicRoughness) {
          const baseColorTexture =
            material.pbrMetallicRoughness.baseColorTexture;
          if (baseColorTexture !== void 0) {
            baseColorTexture.texture =
              gltfJson.textures[baseColorTexture.index];
          }
          const metallicRoughnessTexture =
            material.pbrMetallicRoughness.metallicRoughnessTexture;
          if (metallicRoughnessTexture !== void 0) {
            metallicRoughnessTexture.texture =
              gltfJson.textures[metallicRoughnessTexture.index];
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
          gltfJson.asset.extras!.rnLoaderOptions!.loaderExtension.setTextures(
            gltfJson,
            material
          );
        }
      }
    }
  }

  _loadDependenciesOfTextures(gltfJson: RnM2) {
    // Texture
    if (gltfJson.textures) {
      for (const texture of gltfJson.textures) {
        ifDefinedThen(
          v => (texture.samplerObject = gltfJson.samplers[v]),
          texture.sampler
        );

        if (texture.extensions?.KHR_texture_basisu?.source != null) {
          texture.extensions.KHR_texture_basisu.fallbackSourceIndex =
            texture.source;
          texture.source = texture.extensions.KHR_texture_basisu
            .source as number;
          texture.image = gltfJson.images[texture.source];
        } else if (texture.source !== void 0) {
          texture.image = gltfJson.images[texture.source!];
        }
      }
    }
  }

  _loadDependenciesOfJoints(gltfJson: RnM2) {
    if (gltfJson.skins) {
      for (const skin of gltfJson.skins) {
        skin.skeletonObject = gltfJson.nodes[skin.skeleton!];

        skin.inverseBindMatricesObject =
          gltfJson.accessors[skin.inverseBindMatrices!];

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

  _loadDependenciesOfAnimations(gltfJson: RnM2) {
    if (gltfJson.animations) {
      for (const animation of gltfJson.animations) {
        for (const channel of animation.channels) {
          if (Is.defined(channel.sampler)) {
            channel.samplerObject = animation.samplers[channel.sampler];
            channel.target!.nodeObject = gltfJson.nodes[channel.target!.node!];
            channel.samplerObject.inputObject =
              gltfJson.accessors[channel.samplerObject.input!];
            channel.samplerObject.outputObject =
              gltfJson.accessors[channel.samplerObject.output!];
            if (Is.undefined(channel.samplerObject.outputObject.extras)) {
              channel.samplerObject.outputObject.extras = {} as any;
            }
            if (channel.target!.path === 'weights') {
              let weightsArrayLength =
                channel.samplerObject.outputObject.count /
                channel.samplerObject.inputObject.count;
              if (channel.samplerObject.interpolation === 'CUBICSPLINE') {
                // divided by 3, because in glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
                weightsArrayLength =
                  channel.samplerObject.outputObject.count /
                  channel.samplerObject.inputObject.count /
                  3;
              }
              channel.samplerObject.outputObject.extras!.weightsArrayLength =
                weightsArrayLength;
            }
            if (channel.target!.path === 'rotation') {
              channel.samplerObject.outputObject.extras!.quaternionIfVec4 =
                true;
            }
          }
        }
      }
    }
  }

  _loadDependenciesOfAccessors(gltfJson: RnM2) {
    // Accessor
    for (const accessor of gltfJson.accessors) {
      if (accessor.bufferView == null) {
        accessor.bufferView = 0;
      }
      accessor.bufferViewObject = gltfJson.bufferViews[accessor.bufferView];

      if (Is.exist(accessor.sparse)) {
        const sparse = accessor.sparse;
        if (
          Is.exist(sparse) &&
          Is.exist(sparse.indices) &&
          Is.exist(sparse.values)
        ) {
          sparse.indices.bufferViewObject =
            gltfJson.bufferViews[sparse.indices.bufferView];
          sparse.values.bufferViewObject =
            gltfJson.bufferViews[sparse.values.bufferView];
        }
      }
    }
  }

  _loadDependenciesOfBufferViews(gltfJson: RnM2) {
    // BufferView
    for (const bufferView of gltfJson.bufferViews) {
      if (bufferView.buffer !== void 0) {
        bufferView.bufferObject = gltfJson.buffers[bufferView.buffer!];
      }
    }
  }

  _mergeExtendedJson(gltfJson: RnM2, extendedData: any) {
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

  _loadResources(
    uint8Array: Uint8Array,
    gltfJson: RnM2,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    basePath?: string
  ) {
    const promisesToLoadResources = [];

    // Buffers Async load
    let rnpArrayBuffer: RnPromise<ArrayBuffer>;
    for (const bufferInfo of gltfJson.buffers) {

      let filename = '';
      if (bufferInfo.uri) {
        const splitUri = bufferInfo.uri.split('/');
        filename = splitUri[splitUri.length - 1];
      }

      if (typeof bufferInfo.uri === 'undefined') {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          bufferInfo.buffer = uint8Array;
          resolve(uint8Array);
        });
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(bufferInfo.uri!);
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if (files && this.__containsFileName(files, filename)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(
          DataUtil.loadResourceAsync(
            basePath + bufferInfo.uri,
            true,
            (resolve: Function, response: ArrayBuffer) => {
              bufferInfo.buffer = new Uint8Array(response);
              resolve(response);
            },
            (reject: Function, error: any) => {}
          )
        );
      }
      bufferInfo.bufferPromise = rnpArrayBuffer;
      promisesToLoadResources.push(rnpArrayBuffer);
    }

    // Textures Async load
    for (const imageJson of gltfJson.images ?? []) {
      if (imageJson.uri == null) {
        if (uint8Array == null) {
          // need to wait for load gltfJson.buffer
          const bufferViewInfo = gltfJson.bufferViews[imageJson.bufferView!];
          let bufferInfo = bufferViewInfo.bufferObject!;
          if (!isNaN(bufferInfo as unknown as number)) {
            const bufferIndex = bufferInfo as unknown as number;
            bufferInfo = gltfJson.buffers[bufferIndex];
          }

          const bufferPromise =
            bufferInfo.bufferPromise as RnPromise<ArrayBuffer>;

          const loadImageAfterLoadingBuffer = new RnPromise(resolve => {
            bufferPromise.then((arraybuffer: ArrayBuffer) => {
              const imageUint8Array =
                DataUtil.createUint8ArrayFromBufferViewInfo(
                  gltfJson,
                  imageJson.bufferView!,
                  arraybuffer
                );
              const imageUri = DataUtil.createBlobImageUriFromUint8Array(
                imageUint8Array,
                imageJson.mimeType!
              );
              this.__loadImageUri(imageUri, imageJson, files).then(() => {
                resolve(arraybuffer);
              });
            });
          }) as RnPromise<ArrayBuffer>;

          const bufferPromiseIndex: number =
            promisesToLoadResources.indexOf(bufferPromise);
          promisesToLoadResources[bufferPromiseIndex] =
            loadImageAfterLoadingBuffer;
          bufferInfo.bufferPromise = loadImageAfterLoadingBuffer;
        } else {
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            imageJson.bufferView!,
            uint8Array
          );
          const imageUri = DataUtil.createBlobImageUriFromUint8Array(
            imageUint8Array,
            imageJson.mimeType!
          );
          promisesToLoadResources.push(
            this.__loadImageUri(imageUri, imageJson, files)
          );
        }
      } else {
        const imageFileStr = imageJson.uri;
        const splitUri = imageFileStr.split('/');
        const filename = splitUri[splitUri.length - 1];

        let imageUri;
        if (files && this.__containsFileName(files, filename)) {
          const fullPath = this.__getFullPathOfFileName(files, filename);
          const arrayBuffer = files[fullPath!];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(
            new Uint8Array(arrayBuffer),
            imageJson.mimeType!
          );
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }

        promisesToLoadResources.push(
          this.__loadImageUri(imageUri, imageJson, files)
        );
      }
    }

    if (options.defaultTextures) {
      const basePath = options.defaultTextures.basePath;
      const textureInfos = options.defaultTextures.textureInfos;

      for (const textureInfo of textureInfos) {
        const fileName = textureInfo.fileName;
        const uri = basePath + fileName;

        const fileExtension = DataUtil.getExtension(fileName);
        const mimeType = DataUtil.getMimeTypeFromExtension(fileExtension);
        const promise = DataUtil.createImageFromUri(uri, mimeType).then(
          image => {
            image.crossOrigin = 'Anonymous';
            textureInfo.image = {image: image};
          }
        );

        promisesToLoadResources.push(promise);
      }
    }

    return Promise.all(promisesToLoadResources).catch(err => {
      console.log('Promise.all error', err);
    });
  }

  private __containsFileName(
    optionsFiles: {[s: string]: ArrayBuffer},
    filename: string
  ) {
    for (const key in optionsFiles) {
      const split = key.split('/');
      const last = split[split.length - 1];
      if (last === filename) {
        return true;
      }
    }

    return false;
  }

  private __getFullPathOfFileName(
    optionsFiles: {[s: string]: ArrayBuffer},
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

  private __loadImageUri(
    imageUri: string,
    imageJson: RnM2Image,
    files: GltfFileBuffers
  ) {
    let loadImagePromise: Promise<void>;
    if (imageUri.match(/basis$/)) {
      // load basis file from uri
      loadImagePromise = new Promise(resolve => {
        fetch(imageUri, {mode: 'cors'}).then(response => {
          response.arrayBuffer().then(buffer => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.basis = uint8Array;
            resolve();
          });
        });
      });
    } else if (imageJson.uri?.match(/basis$/)) {
      // find basis file from files option
      loadImagePromise = new Promise(resolve => {
        imageJson.basis = new Uint8Array(files[imageJson.uri!]);
        resolve();
      });
    } else if (
      imageUri.match(/\.ktx2$/) ||
      imageUri.match(/^data:image\/ktx2/) ||
      (imageJson.bufferView != null && imageJson.mimeType === 'image/ktx2')
    ) {
      // load ktx2 file from uri(ktx2 file or data uri) or bufferView
      loadImagePromise = new Promise(resolve => {
        fetch(imageUri, {mode: 'cors'}).then(response => {
          response.arrayBuffer().then(buffer => {
            const uint8Array = new Uint8Array(buffer);
            imageJson.ktx2 = uint8Array;
            resolve();
          });
        });
      });
    } else if (imageJson.uri?.match(/ktx2$/)) {
      // find ktx2 file from files option
      loadImagePromise = new Promise(resolve => {
        imageJson.ktx2 = new Uint8Array(files[imageJson.uri!]);
        resolve();
      });
    } else {
      loadImagePromise = DataUtil.createImageFromUri(
        imageUri,
        imageJson.mimeType!
      ).then(image => {
        image.crossOrigin = 'Anonymous';
        imageJson.image = image;
      });
    }

    return loadImagePromise;
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new Gltf2Importer();
    }
    return this.__instance;
  }
}
