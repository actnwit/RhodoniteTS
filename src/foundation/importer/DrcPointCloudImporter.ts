import { DataUtil } from '../misc/DataUtil';
import {Primitive} from '../geometry/Primitive';
import {MaterialHelper} from '../helpers/MaterialHelper';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../definitions/CompositionType';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {
  VertexAttribute,
  VertexAttributeSemanticsJoinedString,
} from '../definitions/VertexAttribute';
import {TypedArray} from '../../types/CommonTypes';
import {RnM2, GltfLoadOption, RnM2Image, RnM2Accessor} from '../../types/RnM2';
import {RnPromise} from '../misc/RnPromise';
import {Is} from '../misc/Is';
import {ifDefinedThen} from '../misc/MiscUtil';
import {ifUndefinedThen} from '../misc/MiscUtil';

declare let DracoDecoderModule: any;
declare let Rn: any;

/**
 * The draco Importer class.
 */
export class DrcPointCloudImporter {
  private static __instance: DrcPointCloudImporter;

  private constructor() {}

  /**
   * Import draco file of point cloud type
   * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
   * @param uri - uri of drc file
   * @param options - options for loading process
   * @returns a glTF2 based JSON pre-processed
   */
  async importPointCloud(
    uri: string,
    options?: GltfLoadOption
  ): Promise<void | RnM2> {
    const basePath = uri.substring(0, uri.lastIndexOf('/')) + '/'; // location of model file as basePath
    const defaultOptions = DataUtil.createDefaultGltfOptions();

    if (options && options.files) {
      for (const fileName in options.files) {
        const fileExtension = DataUtil.getExtension(fileName);

        if (fileExtension === 'drc') {
          return await this.__decodeDraco(
            (options.files as any)[fileName],
            defaultOptions,
            basePath,
            options
          ).catch(err => {
            console.log('this.__decodeDraco error', err);
          });
        }
      }
    }

    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    return await this.__decodeDraco(
      arrayBuffer,
      defaultOptions,
      basePath,
      options
    ).catch(err => {
      console.log('this.__decodeDraco error', err);
    });
  }

  /**
   * Import the specified array buffer of draco file where the type must be point cloud.
   * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
   * @param uri - uri of drc file
   * @param arrayBuffer - fetched array buffer of drc file
   * @param options - options for loading process
   * @returns a glTF2 based JSON pre-processed
   */
  importArrayBuffer(
    uri: string,
    arrayBuffer: ArrayBuffer,
    options?: GltfLoadOption
  ) {
    const basePath = uri.substring(0, uri.lastIndexOf('/')) + '/'; // location of model file as basePath
    const defaultOptions = DataUtil.createDefaultGltfOptions();
    return this.__decodeDraco(
      arrayBuffer,
      defaultOptions,
      basePath,
      options
    ).catch(err => {
      console.log('__loadFromArrayBuffer error', err);
    });
  }

  private async __loadFromArrayBuffer(
    arrayBuffer: ArrayBuffer,
    defaultOptions: GltfLoadOption,
    basePath: string,
    options?: {}
  ) {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const isLittleEndian = true;
    // Magic field
    const magic = dataView.getUint32(0, isLittleEndian);
    let result;
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546c67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      result = await this._loadAsTextJson(
        json,
        options as GltfLoadOption,
        defaultOptions,
        basePath
      ).catch(err => {
        console.log('this.__loadAsTextJson error', err);
      });
    } else {
      result = await this._loadAsBinaryJson(
        dataView,
        isLittleEndian,
        arrayBuffer,
        options as GltfLoadOption,
        defaultOptions,
        basePath
      ).catch(err => {
        console.log('this.__loadAsBinaryJson error', err);
      });
    }
    return result;
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

  async _loadAsBinaryJson(
    dataView: DataView,
    isLittleEndian: boolean,
    arrayBuffer: ArrayBuffer,
    options: GltfLoadOption,
    defaultOptions: GltfLoadOption,
    basePath: string
  ) {
    const lengthOfJSonChunkData = dataView.getUint32(12, isLittleEndian);
    const chunkType = dataView.getUint32(16, isLittleEndian);
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
      await this._loadInner(uint8array, basePath, gltfJson, options);
    } catch (err) {
      console.log('this._loadInner error in _loadAsBinaryJson', err);
    }
    return gltfJson;
  }

  async _loadAsTextJson(
    gltfJson: RnM2,
    options: GltfLoadOption,
    defaultOptions: GltfLoadOption,
    basePath: string
  ) {
    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: 'glTF', version: '2'};
    }

    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson);
    gltfJson.asset.extras.rnLoaderOptions = options;

    try {
      await this._loadInner(undefined, basePath, gltfJson, options);
    } catch (err) {
      console.log('this._loadInner error in _loadAsTextJson', err);
    }
    return gltfJson;
  }

  _loadInner(
    uint8array: Uint8Array | undefined,
    basePath: string,
    gltfJson: RnM2,
    options: GltfLoadOption
  ) {
    const promises = [];

    const resources = {
      shaders: [],
      buffers: [],
      images: [],
    };
    promises.push(
      this._loadResources(uint8array!, basePath, gltfJson, options, resources)
    );
    promises.push(
      new Promise((resolve, reject) => {
        this._loadJsonContent(gltfJson, options);
        resolve();
      }) as Promise<void>
    );

    return Promise.all(promises);
  }

  _loadJsonContent(gltfJson: RnM2, options: GltfLoadOption) {
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
      for (const i in scene.nodes!) {
        scene.nodesObjects![i] = gltfJson.nodes[scene.nodes![i]];
      }
    }
  }

  _loadDependenciesOfNodes(gltfJson: RnM2) {
    for (const node of gltfJson.nodes) {
      // Hierarchy
      if (node.children) {
        if (Is.not.exist(node.childrenObjects)) {
          node.childrenObjects = [];
        }
        for (const i in node.children) {
          node.childrenObjects![i] = gltfJson.nodes[node.children[i]];
        }
      }

      // Mesh
      if (node.mesh !== void 0 && gltfJson.meshes !== void 0) {
        node.meshObject = gltfJson.meshes[node.mesh!];
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        node.skinObject = gltfJson.skins[node.skin];
        if (node.meshObject!.extras === void 0) {
          node.meshObject!.extras = {};
        }
        node.meshObject!.extras._skin = node.skin;
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

        for (const attributeName in primitive.attributes!) {
          const accessorId = primitive.attributes[attributeName];
          const accessor = gltfJson.accessors[accessorId];
          accessor.extras = {
            toGetAsTypedArray: true,
            attributeName: attributeName,
          };
          primitive.attributesObjects![attributeName] = accessor;
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
        ifDefinedThen(v => {
          texture.samplerObject = gltfJson.samplers[v];
        }, texture.sampler);

        if (texture.source !== void 0) {
          texture.image = gltfJson.images[texture.source];
        }
      }
    }
  }

  _loadDependenciesOfJoints(gltfJson: RnM2) {
    if (gltfJson.skins) {
      for (const skin of gltfJson.skins) {
        if (Is.exist(skin.skeleton)) {
          skin.skeletonObject = gltfJson.nodes[skin.skeleton];

          ifDefinedThen(
            v => (skin.inverseBindMatricesObject = gltfJson.accessors[v]),
            skin.inverseBindMatrices
          );

          ifUndefinedThen(
            () => (skin.skeletonObject = gltfJson.nodes[skin.joints[0]]),
            skin.skeleton
          );

          skin.jointsObjects = [];
          for (const jointIndex of skin.joints) {
            skin.jointsObjects.push(gltfJson.nodes[jointIndex]);
          }
        }
      }
    }
  }

  _loadDependenciesOfAnimations(gltfJson: RnM2) {
    if (gltfJson.animations) {
      for (const animation of gltfJson.animations) {
        for (const channel of animation.channels) {
          channel.samplerObject = animation.samplers[channel.sampler];

          channel.target!.nodeObject = gltfJson.nodes[channel.target!.node!];
        }
        for (const channel of animation.channels) {
          if (Is.exist(channel.samplerObject)) {
            channel.samplerObject.inputObject =
              gltfJson.accessors[channel.samplerObject.input];
            channel.samplerObject.outputObject =
              gltfJson.accessors[channel.samplerObject.output];
            if (channel.samplerObject.outputObject.extras === void 0) {
              channel.samplerObject.outputObject.extras = {} as any;
            }
            if (channel.target!.path === 'rotation') {
              channel.samplerObject.outputObject.extras!.quaternionIfVec4 =
                true;
            }
            if (channel.target!.path === 'weights') {
              const weightsArrayLength =
                channel.samplerObject.outputObject.count /
                channel.samplerObject.inputObject.count;
              channel.samplerObject.outputObject.extras!.weightsArrayLength =
                weightsArrayLength;
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

      if (accessor.sparse != null) {
        const sparse = accessor.sparse;
        sparse.indices!.bufferViewObject =
          gltfJson.bufferViews[sparse.indices!.bufferView];
        sparse.values!.bufferViewObject =
          gltfJson.bufferViews[sparse.values!.bufferView];
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
    basePath: string,
    gltfJson: RnM2,
    options: GltfLoadOption,
    resources: {
      shaders: any[];
      buffers: any[];
      images: any[];
    }
  ) {
    const promisesToLoadResources = [];

    // Shaders Async load

    // for (let _i in gltfJson.shaders) {
    //   const i = _i as any as number;
    //   resources.shaders[i] = {};

    //   let shaderJson = gltfJson.shaders[i];
    //   let shaderType = shaderJson.type;
    //   if (typeof shaderJson.extensions !== 'undefined' && typeof shaderJson.extensions.KHR_binary_glTF !== 'undefined') {
    //     resources.shaders[i].shaderText = this._accessBinaryAsShader(shaderJson.extensions.KHR_binary_glTF.bufferView, gltfJson, arrayBufferBinary);
    //     resources.shaders[i].shaderType = shaderType;
    //     continue;
    //   }

    //   let shaderUri = shaderJson.uri;

    //   if (options.files) {
    //     const splitted = shaderUri.split('/');
    //     const filename = splitted[splitted.length - 1];
    //     if (options.files[filename]) {
    //       const arrayBuffer = options.files[filename];
    //       resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //       resources.shaders[i].shaderType = shaderType;
    //       continue;
    //     }
    //   }

    //   if (shaderUri.match(/^data:/)) {
    //     promisesToLoadResources.push(
    //       new Promise((resolve, rejected) => {
    //         let arrayBuffer = DataUtil.dataUriToArrayBuffer(shaderUri);
    //         resources.shaders[i].shaderText = DataUtil.arrayBufferToString(arrayBuffer);
    //         resources.shaders[i].shaderType = shaderType;
    //         resolve();
    //       })
    //     );
    //   } else {
    //     shaderUri = basePath + shaderUri;
    //     promisesToLoadResources.push(
    //       DataUtil.loadResourceAsync(shaderUri, false,
    //         (resolve:Function, response:any)=>{
    //           resources.shaders[i].shaderText = response;
    //           resources.shaders[i].shaderType = shaderType;
    //           resolve(gltfJson);
    //         },
    //         (reject:Function, error:any)=>{

    //         }
    //       )
    //     );
    //   }
    // }

    // Buffers Async load
    let rnpArrayBuffer: RnPromise<ArrayBuffer>;
    for (const i in gltfJson.buffers) {
      const bufferInfo = gltfJson.buffers[i];

      let splitted: string[];
      let filename: string;
      if (bufferInfo.uri) {
        splitted = bufferInfo.uri.split('/');
        filename = splitted[splitted.length - 1];
      }
      if (typeof bufferInfo.uri === 'undefined') {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          resources.buffers[i] = uint8Array;
          bufferInfo.buffer = uint8Array;
          resolve(uint8Array);
        });
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          const arrayBuffer = DataUtil.dataUriToArrayBuffer(bufferInfo.uri!);
          resources.buffers[i] = new Uint8Array(arrayBuffer);
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else if (options.files && options.files[filename!]) {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>((resolve, rejected) => {
          const arrayBuffer = options.files![filename];
          resources.buffers[i] = new Uint8Array(arrayBuffer);
          bufferInfo.buffer = new Uint8Array(arrayBuffer);
          resolve(arrayBuffer);
        });
      } else {
        rnpArrayBuffer = new RnPromise<ArrayBuffer>(
          DataUtil.loadResourceAsync(
            basePath + bufferInfo.uri,
            true,
            (resolve: Function, response: ArrayBuffer) => {
              resources.buffers[i] = new Uint8Array(response);
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
    for (const _i in gltfJson.images) {
      const i = _i as any as number;
      const imageJson = gltfJson.images[i] as RnM2Image;
      //let imageJson = gltfJson.images[textureJson.source];
      //let samplerJson = gltfJson.samplers[textureJson.sampler];

      let imageUri: string;

      if (typeof imageJson.uri === 'undefined') {
        let arrayBuffer = uint8Array;
        if (uint8Array == null) {
          const bufferView = gltfJson.bufferViews[imageJson.bufferView!];
          arrayBuffer = bufferView.bufferObject!.buffer!;
        }
        const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
          gltfJson,
          imageJson.bufferView!,
          uint8Array
        );
        imageUri = DataUtil.createBlobImageUriFromUint8Array(
          imageUint8Array,
          imageJson.mimeType!
        );
      } else {
        const imageFileStr = imageJson.uri;
        const splitted = imageFileStr.split('/');
        const filename = splitted[splitted.length - 1];
        if (options.files && options.files[filename]) {
          const arrayBuffer = options.files[filename];
          imageUri = DataUtil.createBlobImageUriFromUint8Array(
            new Uint8Array(arrayBuffer),
            imageJson.mimeType!
          );
        } else if (imageFileStr.match(/^data:/)) {
          imageUri = imageFileStr;
        } else {
          imageUri = basePath + imageFileStr;
        }
      }

      // if (options.extensionLoader && options.extensionLoader.setUVTransformToTexture) {
      //   options.extensionLoader.setUVTransformToTexture(texture, samplerJson);
      // }

      const promise = DataUtil.createImageFromUri(
        imageUri,
        imageJson.mimeType!
      ).then(image => {
        image.crossOrigin = 'Anonymous';
        resources.images[i] = image;
        imageJson.image = image;
      });
      promisesToLoadResources.push(promise);
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

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new DrcPointCloudImporter();
    }
    return this.__instance;
  }

  private __decodeDraco(
    arrayBuffer: ArrayBuffer,
    defaultOptions: GltfLoadOption,
    basePath: string,
    options?: {}
  ) {
    return this.__decodeBuffer(arrayBuffer).then((json: any) => {
      const gotText = JSON.stringify(json);
      const gltfJson = JSON.parse(gotText);
      return this._loadAsTextJson(
        gltfJson,
        options as GltfLoadOption,
        defaultOptions,
        basePath
      ).catch(err => {
        console.log('this.__loadAsTextJson error', err);
      });
    });
  }

  private __decodeBuffer(arrayBuffer: ArrayBuffer) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(
      draco,
      decoder,
      arrayBuffer
    );
    if (dracoGeometry == null) {
      throw new Error('invalid dracoGeometry.');
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error('invalid geometryType of drc file.');
    }

    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error('Draco: No position attribute found.');
    }

    const attributeNames = [
      'POSITION',
      'NORMAL',
      'COLOR',
      'TEX_COORD',
      'GENERIC',
    ];
    const numPoints = dracoGeometry.num_points();

    const attributeDataAll: any[] = [];
    const attributeComponents: number[] = [];
    let bufferLength = 0;
    for (let i = 0; i < attributeNames.length; i++) {
      const attId = decoder.GetAttributeId(
        dracoGeometry,
        draco[attributeNames[i]]
      );
      if (attId === -1) {
        attributeNames.splice(i, 1);
        i--;
        continue;
      }

      const attribute = decoder.GetAttribute(dracoGeometry, attId);
      const attributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(
        dracoGeometry,
        attribute,
        attributeData
      );
      attributeDataAll[i] = attributeData;

      const numComponent = attribute.num_components();
      attributeComponents[i] = numComponent;
      if (attributeNames[i] === 'COLOR') {
        bufferLength += numPoints * 4;
      } else {
        bufferLength += numPoints * numComponent;
      }
    }

    const buffer = new Float32Array(bufferLength);
    for (let i = 0, currentBufferIndex = 0; i < attributeNames.length; i++) {
      if (attributeNames[i] === 'COLOR' && attributeComponents[i] === 3) {
        for (let j = 0; j < numPoints; currentBufferIndex += 4, j += 3) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(j);
          buffer[currentBufferIndex + 1] = attributeDataAll[i].GetValue(j + 1);
          buffer[currentBufferIndex + 2] = attributeDataAll[i].GetValue(j + 2);
          buffer[currentBufferIndex + 3] = 1.0; // alpha value
        }
      } else if (attributeNames[i] === 'TEX_COORD') {
        for (let j = 0; j < numPoints; currentBufferIndex += 2, j++) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(2 * j);
          buffer[currentBufferIndex + 1] =
            1.0 - attributeDataAll[i].GetValue(2 * j + 1);
        }
      } else {
        for (
          let j = 0;
          j < numPoints * attributeComponents[i];
          currentBufferIndex++, j++
        ) {
          buffer[currentBufferIndex] = attributeDataAll[i].GetValue(j);
        }
      }
      draco.destroy(attributeDataAll[i]);
    }
    draco.destroy(decoder);
    draco.destroy(dracoGeometry);

    return this.__decodedBufferToJSON(
      buffer,
      numPoints,
      attributeNames,
      attributeComponents
    );
  }

  private async __decodedBufferToJSON(
    buffer: Float32Array,
    numPoints: number,
    attributeNames: string[],
    attributeComponents: number[]
  ) {
    const json: any = {
      asset: {
        version: '2.0',
      },
      extensionsUsed: ['KHR_materials_unlit'],
      extensionsRequired: ['KHR_materials_unlit'],
      nodes: [
        {
          name: 'Node',
          mesh: 0,
        },
      ],
      scenes: [
        {
          nodes: [0],
        },
      ],
      materials: [
        {
          name: 'point-cloud_material',
          pbrMetallicRoughness: {
            baseColorFactor: [1.0, 1.0, 1.0, 1.0],
          },
          extensions: {
            KHR_materials_unlit: {},
          },
        },
      ],
    };

    await this.__setBuffersToJSON(buffer, json);
    this.__setAccessorsAndBufferViewsToJSON(
      numPoints,
      attributeNames,
      attributeComponents,
      json
    );
    this.__setMeshesToJSON(attributeNames, json);

    return new Promise((resolve, reject) => {
      resolve(json);
    });
  }

  private __setBuffersToJSON(buffer: Float32Array, json: any) {
    return this.__convertBufferToURI(buffer.buffer)
      .then(uri => {
        json['buffers'] = [
          {
            name: 'input',
            byteLength: buffer.byteLength,
            uri: uri,
          },
        ];
      })
      .catch(err => {
        console.log('this.__convertBufferToURI error:', err);
      });
  }

  private __convertBufferToURI(arrayBuffer: ArrayBuffer) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer], {type: 'application/octet-stream'});
      const fr = new FileReader();

      fr.onload = () => {
        resolve(fr.result!);
      };
      fr.onerror = () => {
        reject(fr.error);
      };
      fr.readAsDataURL(blob);
    });
  }

  private __setAccessorsAndBufferViewsToJSON(
    numPoints: number,
    attributeNames: string[],
    attributeComponents: number[],
    json: any
  ) {
    const accessors = [];
    const bufferViews = [];

    let byteOffsetOfBufferView = 0;
    for (
      let i = 0, indexOfBufferView = 0;
      i < attributeNames.length;
      indexOfBufferView++
    ) {
      const numOfComponents = attributeComponents[i];

      let type;
      if (numOfComponents === 1) {
        type = 'SCALAR';
      } else {
        type = 'VEC' + numOfComponents;
      }

      let byteOffsetOfAccessor = 0;
      const attributeName = attributeNames[i];
      while (i < attributeNames.length) {
        accessors.push({
          name: 'point-cloud_' + attributeName + '_' + i,
          componentType: 5126, // gl.FLOAT
          count: numPoints,
          type: type,
          bufferView: indexOfBufferView,
          byteOffset: byteOffsetOfAccessor,
        });

        if (attributeNames[i] === 'COLOR') {
          byteOffsetOfAccessor += numPoints * 4 * 4;
        } else {
          byteOffsetOfAccessor += numPoints * numOfComponents * 4;
        }

        i++;
        if (attributeName != attributeNames[i]) {
          break;
        }
      }

      bufferViews[indexOfBufferView] = {
        name: 'bufferView_' + attributeName,
        buffer: 0,
        byteLength: byteOffsetOfAccessor,
        byteOffset: byteOffsetOfBufferView,
        byteStride: numOfComponents * 4,
        target: 34962, // gl.ARRAY_BUFFER
      };
      byteOffsetOfBufferView += byteOffsetOfAccessor;
    }

    json['accessors'] = accessors;
    json['bufferViews'] = bufferViews;
  }

  private __setMeshesToJSON(attributeNames: string[], json: any) {
    const attributes: any = {};

    for (let i = 0; i < attributeNames.length; i++) {
      if (attributeNames[i] === 'TEX_COORD') {
        attributes['TEXCOORD_0'] = i;
      } else if (attributeNames[i] === 'GENERIC') {
        attributes['TANGENT'] = i;
      } else {
        attributes[attributeNames[i]] = i;
      }
    }

    const mesh: any = {
      name: 'Node-Mesh',
      primitives: [
        {
          mode: 0,
          material: 0,
          attributes: attributes,
        },
      ],
    };

    json['meshes'] = [mesh];
  }

  /**
   * Import Draco file of point cloud type.
   * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
   * @param uri - uri of glTF file
   * @returns a primitive of Rhodonite object
   */
  async importPointCloudToPrimitive(uri: string): Promise<Primitive> {
    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    return this.__decodeDracoToPrimitive(arrayBuffer);
  }

  // tangent is not available
  private __decodeDracoToPrimitive(arrayBuffer: ArrayBuffer) {
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(
      draco,
      decoder,
      arrayBuffer
    );
    if (dracoGeometry == null) {
      throw new Error('invalid dracoGeometry.');
    }
    if (dracoGeometry.geometryType !== draco.POINT_CLOUD) {
      throw new Error('invalid geometryType of drc file.');
    }

    const attributeCompositionTypes: Array<CompositionTypeEnum> = [];
    const attributeSemantics: Array<VertexAttributeSemanticsJoinedString> = [];
    const attributes: Array<TypedArray> = [];

    this.__getPositions(
      draco,
      decoder,
      dracoGeometry,
      attributeCompositionTypes,
      attributeSemantics,
      attributes
    );
    this.__getColors(
      draco,
      decoder,
      dracoGeometry,
      attributeCompositionTypes,
      attributeSemantics,
      attributes
    );
    this.__getNormals(
      draco,
      decoder,
      dracoGeometry,
      attributeCompositionTypes,
      attributeSemantics,
      attributes
    );
    this.__getTextureCoords(
      draco,
      decoder,
      dracoGeometry,
      attributeCompositionTypes,
      attributeSemantics,
      attributes
    );

    const primitive = Primitive.createPrimitive({
      attributeSemantics: attributeSemantics,
      attributes: attributes,
      material: MaterialHelper.createClassicUberMaterial({
        isSkinning: false,
        isLighting: true,
      }),
      primitiveMode: PrimitiveMode.Points,
    });

    draco.destroy(decoder);
    draco.destroy(dracoGeometry);

    return primitive;
  }

  private __getGeometryFromDracoBuffer(
    draco: any,
    decoder: any,
    arrayBuffer: ArrayBuffer
  ) {
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
      const errorMsg = 'Unknown geometry type.';
      console.error(errorMsg);
    }

    dracoGeometry.geometryType = geometryType; // store

    if (!decodingStatus.ok() || dracoGeometry.ptr == 0) {
      let errorMsg = 'Decoding failed: ';
      errorMsg += decodingStatus.error_msg();
      console.error(errorMsg);
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      return void 0;
    }
    draco.destroy(buffer);

    return dracoGeometry;
  }

  private __getPositions(
    draco: any,
    decoder: any,
    dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeSemanticsJoinedString>,
    attributes: Array<TypedArray>
  ) {
    const posAttId = decoder.GetAttributeId(dracoGeometry, draco.POSITION);
    if (posAttId === -1) {
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      throw new Error('Draco: No position attribute found.');
    }

    const posAttribute = decoder.GetAttribute(dracoGeometry, posAttId);
    const posAttributeData = new draco.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(
      dracoGeometry,
      posAttribute,
      posAttributeData
    );

    const numPoints = dracoGeometry.num_points();
    const numVertices = numPoints * 3;
    const positions = new Float32Array(numVertices);

    for (let i = 0; i < numVertices; i += 1) {
      positions[i] = posAttributeData.GetValue(i); // XYZ XYZ
    }

    attributeCompositionTypes.push(CompositionType.Vec3);
    attributeSemantics.push(VertexAttribute.Position.XYZ);
    attributes.push(positions);

    draco.destroy(posAttributeData);
    return positions;
  }

  private __getColors(
    draco: any,
    decoder: any,
    dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeSemanticsJoinedString>,
    attributes: Array<TypedArray>
  ) {
    // Get color attributes if exists.
    const colorAttId = decoder.GetAttributeId(dracoGeometry, draco.COLOR);
    if (colorAttId === -1) {
      return null;
    } else {
      //console.log('Loaded color attribute.');

      const colAttribute = decoder.GetAttribute(dracoGeometry, colorAttId);
      const colAttributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(
        dracoGeometry,
        colAttribute,
        colAttributeData
      );

      const numPoints = dracoGeometry.num_points();
      const numComponents = colAttribute.num_components();
      const numVertices = numPoints * 4;
      const colors = new Float32Array(numVertices);
      for (let i = 0; i < numVertices; i += numComponents) {
        colors[i] = colAttributeData.GetValue(i);
        colors[i + 1] = colAttributeData.GetValue(i + 1);
        colors[i + 2] = colAttributeData.GetValue(i + 2);
        if (numComponents == 4) {
          colors[i + 3] = colAttributeData.GetValue(i + 3);
        } else {
          colors[i + 3] = 1.0;
        }
      }

      attributeCompositionTypes.push(CompositionType.Vec3);
      attributeSemantics.push(VertexAttribute.Color0.XYZ);
      attributes.push(colors);

      draco.destroy(colAttributeData);
      return colors;
    }
  }

  private __getNormals(
    draco: any,
    decoder: any,
    dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeSemanticsJoinedString>,
    attributes: Array<TypedArray>
  ) {
    // Get normal attributes if exists.
    const normalAttId = decoder.GetAttributeId(dracoGeometry, draco.NORMAL);
    if (normalAttId === -1) {
      return null;
    } else {
      //console.log('Loaded normal attribute.');

      const norAttribute = decoder.GetAttribute(dracoGeometry, normalAttId);
      const norAttributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(
        dracoGeometry,
        norAttribute,
        norAttributeData
      );

      const numPoints = dracoGeometry.num_points();
      const numVertices = numPoints * 3;
      const normals = new Float32Array(numVertices);
      for (let i = 0; i < numVertices; i += 1) {
        normals[i] = norAttributeData.GetValue(i); // XYZ XYZ
      }
      attributeCompositionTypes.push(CompositionType.Vec3);
      attributeSemantics.push(VertexAttribute.Normal.XYZ);
      attributes.push(normals);

      draco.destroy(norAttributeData);
      return normals;
    }
  }

  private __getTextureCoords(
    draco: any,
    decoder: any,
    dracoGeometry: any,
    attributeCompositionTypes: Array<CompositionTypeEnum>,
    attributeSemantics: Array<VertexAttributeSemanticsJoinedString>,
    attributes: Array<TypedArray>
  ) {
    // Get texture coordinate attributes if exists.
    const texCoordAttId = decoder.GetAttributeId(
      dracoGeometry,
      draco.TEX_COORD
    );
    if (texCoordAttId === -1) {
      return null;
    } else {
      const texCoordAttribute = decoder.GetAttribute(
        dracoGeometry,
        texCoordAttId
      );
      const texCoordAttributeData = new draco.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(
        dracoGeometry,
        texCoordAttribute,
        texCoordAttributeData
      );

      const numPoints = dracoGeometry.num_points();
      const numVertices = numPoints * 2;
      const texCoords = new Float32Array(numVertices);
      for (let i = 0; i < numVertices; i += 1) {
        texCoords[i] = texCoordAttributeData.GetValue(i); // XYZ XYZ
      }
      attributeCompositionTypes.push(CompositionType.Vec2);
      attributeSemantics.push(VertexAttribute.Texcoord0.XY);
      attributes.push(texCoords);

      draco.destroy(texCoordAttributeData);
      return texCoords;
    }
  }
}
