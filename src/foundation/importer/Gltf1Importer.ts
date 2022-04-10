import DataUtil from '../misc/DataUtil';
import {
  RnM2,
  RnM2Accessor,
  RnM2Animation,
  RnM2BufferView,
  RnM2Image,
  RnM2Material,
  GltfFileBuffers,
  GltfLoadOption,
} from '../../types/RnM2';
import {Is} from '../misc/Is';
import {glTF1} from '../../types/glTF1';

declare let Rn: any;

export class Gltf1Importer {
  private constructor() {}

  /**
   * the method to load glTF1 file.
   * @param uri - uri of glTF file
   * @param options - options for loading process
   * @returns a glTF2 based JSON pre-processed
   */
  public static async import(
    uri: string,
    options?: GltfLoadOption
  ): Promise<RnM2> {
    if (options && options.files) {
      for (const fileName in options.files) {
        const fileExtension = DataUtil.getExtension(fileName);

        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          return await this.importGltfOrGlbFromArrayBuffers(
            (options.files as GltfFileBuffers)[fileName],
            options.files,
            options,
            uri
          );
        }
      }
    }

    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    return await this.importGltfOrGlbFromArrayBuffers(
      arrayBuffer,
      options?.files ?? {},
      options,
      uri
    );
  }

  public static async importGltfOrGlbFromFile(
    uri: string,
    options?: GltfLoadOption
  ): Promise<RnM2 | undefined> {
    const arrayBuffer = await DataUtil.fetchArrayBuffer(uri);
    const glTFJson = await this.importGltfOrGlbFromArrayBuffers(
      arrayBuffer,
      {},
      options,
      uri
    ).catch(err => {
      console.log('this.__loadFromArrayBuffer error', err);
      return undefined;
    });
    return glTFJson;
  }

  /**
   * Import glTF1 array buffer.
   * @param arrayBuffer .gltf/.glb file in ArrayBuffer
   * @param otherFiles other resource files data in ArrayBuffers
   * @param options options for loading process (Optional)
   * @param uri .gltf file's uri (Optional)
   * @returns a glTF2 based JSON pre-processed
   */
  public static async importGltfOrGlbFromArrayBuffers(
    arrayBuffer: ArrayBuffer,
    otherFiles: GltfFileBuffers,
    options?: GltfLoadOption,
    uri?: string
  ): Promise<RnM2> {
    const dataView = new DataView(arrayBuffer, 0, 20);
    // Magic field
    const magic = dataView.getUint32(0, true);
    // 0x46546C67 is 'glTF' in ASCII codes.
    if (magic !== 0x46546c67) {
      //const json = await response.json();
      const gotText = DataUtil.arrayBufferToString(arrayBuffer);
      const json = JSON.parse(gotText);
      const gltfJson = await this.importGltf(json, otherFiles, options!, uri);
      return gltfJson;
    } else {
      const gltfJson = await this.importGlb(arrayBuffer, otherFiles, options!);
      return gltfJson;
    }
  }

  static _getOptions(
    defaultOptions: GltfLoadOption,
    json: glTF1,
    options: GltfLoadOption
  ): GltfLoadOption {
    if (json.asset?.extras?.rnLoaderOptions != null) {
      for (const optionName in json.asset.extras.rnLoaderOptions) {
        defaultOptions[optionName as keyof GltfLoadOption] =
          json.asset.extras.rnLoaderOptions[optionName];
      }
    }

    for (const optionName in options) {
      defaultOptions[optionName as keyof GltfLoadOption] = options[
        optionName as keyof GltfLoadOption
      ] as any;
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

  public static async importGlb(
    arrayBuffer: ArrayBuffer,
    files: GltfFileBuffers,
    options: GltfLoadOption
  ): Promise<RnM2> {
    const dataView = new DataView(arrayBuffer, 0, 20);
    const gltfVer = dataView.getUint32(4, true);
    if (gltfVer !== 1) {
      throw new Error('invalid version field in this binary glTF file.');
    }
    const lengthOfJSonChunkData = dataView.getUint32(12, true);
    const chunkType = dataView.getUint32(16, true);
    // 0 means JSON format
    if (chunkType !== 0) {
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
    const uint8array = new Uint8Array(arrayBuffer, 20 + lengthOfJSonChunkData);

    if (gltfJson.asset === undefined) {
      gltfJson.asset = {};
    }

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: 'glTF', version: '1'};
    }
    this._mergeExtendedJson(gltfJson, options.extendedJson!);
    gltfJson.asset.extras.rnLoaderOptions = options;

    const result = await this._loadInner(gltfJson, files, options, uint8array);

    return result[0][0] as unknown as RnM2;
  }

  public static async importGltf(
    gltfJson: glTF1,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    uri?: string
  ): Promise<RnM2> {
    const basePath = uri?.substring(0, uri?.lastIndexOf('/')) + '/'; // location of model file as basePath
    if (gltfJson.asset === undefined) {
      gltfJson.asset = {};
    }

    if (gltfJson.asset.extras === undefined) {
      gltfJson.asset.extras = {fileType: 'glTF', version: '1'};
    }

    const defaultOptions = DataUtil.createDefaultGltfOptions();
    options = this._getOptions(defaultOptions, gltfJson, options);

    this._mergeExtendedJson(gltfJson, options.extendedJson!);
    gltfJson.asset.extras.rnLoaderOptions = options;

    const result = await this._loadInner(
      gltfJson,
      files,
      options,
      undefined,
      basePath
    );

    return result[0][0] as unknown as RnM2;
  }

  static _loadInner(
    gltfJson: glTF1,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    uint8array?: Uint8Array,
    basePath?: string
  ): Promise<(glTF1 | void)[][]> {
    const promises: Promise<(glTF1 | void)[]>[] = [];

    promises.push(
      this._loadResources(uint8array!, gltfJson, files, options, basePath)
    );
    promises.push(
      new Promise(resolve => {
        this._loadJsonContent(gltfJson);
        resolve([]);
      })
    );

    return Promise.all(promises);
  }

  static _loadJsonContent(gltfJson: glTF1) {
    this._convertToGltf2LikeStructure(gltfJson);

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
  }

  private static _convertToGltf2LikeStructure(gltfJson: glTF1) {
    gltfJson.bufferDic = gltfJson.buffers;
    this.__createProperty(gltfJson, gltfJson.bufferDic, 'buffers');

    gltfJson.sceneDic = gltfJson.scenes;
    this.__createProperty(gltfJson, gltfJson.sceneDic, 'scenes');

    gltfJson.meshDic = gltfJson.meshes;
    this.__createProperty(gltfJson, gltfJson.meshDic, 'meshes');

    {
      let count = 0;
      gltfJson.nodeDic = gltfJson.nodes;
      gltfJson.nodes = [];
      gltfJson.nodesIndices = [];
      for (const nodeName in gltfJson.nodeDic) {
        gltfJson.nodesIndices.push(count);
        const node = gltfJson.nodeDic[nodeName];
        node._index = count++;
        gltfJson.nodes.push(node);
      }
    }

    gltfJson.skinDic = gltfJson.skins;
    this.__createProperty(gltfJson, gltfJson.skinDic, 'skins');

    gltfJson.materialDic = gltfJson.materials;
    this.__createProperty(gltfJson, gltfJson.materialDic, 'materials');

    gltfJson.animationDic = gltfJson.animations as any;
    this.__createProperty(gltfJson, gltfJson.animationDic, 'animations');

    gltfJson.accessorDic = gltfJson.accessors;
    this.__createProperty(gltfJson, gltfJson.accessorDic, 'accessors');

    gltfJson.bufferViewDic = gltfJson.bufferViews;
    this.__createProperty(gltfJson, gltfJson.bufferViewDic, 'bufferViews');
    gltfJson.cameraDic = gltfJson.cameras;
    gltfJson.imageDic = gltfJson.images;
    gltfJson.samplerDic = gltfJson.samplers;
    gltfJson.shaderDic = gltfJson.shaders;
    gltfJson.textureDic = gltfJson.textures;
  }

  private static __createProperty(
    gltfJson: glTF1,
    gltfPropertyDic: any,
    gltfPropertyName: string
  ) {
    if ((gltfJson as any)[gltfPropertyName] == null) {
      return;
    }

    const propertyNumber = Object.keys(gltfPropertyDic).length;
    const propertyArray = ((gltfJson as any)[gltfPropertyName] = new Array(
      propertyNumber
    ));

    let i = 0;
    for (const propertyName in gltfPropertyDic) {
      propertyArray[i] = gltfPropertyDic[propertyName];
      i++;
    }
  }

  static _loadDependenciesOfScenes(gltfJson: glTF1) {
    for (const sceneName in gltfJson.sceneDic) {
      const scene = gltfJson.sceneDic[sceneName];
      scene.nodeNames = scene.nodes;
      scene.nodes = [];
      scene.nodesObjects = [];
      for (const name of scene.nodeNames) {
        scene.nodesObjects.push(gltfJson.nodeDic[name]);

        // calc index of 'name' in gltfJson.nodeDic enumerate
        let count = 0;
        for (const nodeName in gltfJson.nodeDic) {
          if (nodeName === name) {
            break;
          }
          count++;
        }
        scene.nodes.push(count);
      }
    }
  }

  static _loadDependenciesOfNodes(gltfJson: glTF1) {
    for (const node of gltfJson.nodes) {
      //const node = (gltfJson.nodeDic as any)[nodeName];
      // Hierarchy
      if (Is.exist(node.children)) {
        node.childrenNames = node.children.concat();
        node.children = [];
        node.childrenIndices = [];
        for (const name of node.childrenNames) {
          const childNode = (gltfJson.nodeDic as any)[name];
          node.children.push(childNode);
          node.childrenIndices.push(childNode._index);
        }
      }

      // Mesh
      if (node.meshes !== void 0 && gltfJson.meshes !== void 0) {
        node.meshNames = node.meshes;
        node.meshes = [];

        for (const name of node.meshNames) {
          node.meshes.push((gltfJson.meshDic as any)[name]);
        }
        node.meshObject = node.meshes[1];

        if (node.meshes == null || node.meshes.length === 0) {
          node.meshObject = node.meshes[0];
        } else {
          const mergedMesh = {
            name: '',
            primitives: [],
          };
          for (let i = 0; i < node.meshes.length; i++) {
            mergedMesh.name += '_' + node.meshes[i].name;
            Array.prototype.push.apply(
              mergedMesh.primitives,
              node.meshes[i].primitives
            );
          }
          mergedMesh.name += '_merged';
          node.meshObject = mergedMesh;
          node.meshes = void 0;
          gltfJson.meshes.push(node.meshObject);
        }
        node.mesh = gltfJson.meshes.indexOf(node.meshObject);
      }

      // Skin
      if (node.skin !== void 0 && gltfJson.skins !== void 0) {
        if (typeof node.skin === 'string') {
          node.skinName = node.skin;
          node.skin = (gltfJson.skinDic as any)[node.skinName];
        }
        // if (node.mesh.extras === void 0) {
        //   node.mesh.extras = {};
        // }

        //node.mesh.extras._skin = node.skin;
      }

      // Camera
      if (node.camera !== void 0 && gltfJson.cameras !== void 0) {
        node.cameraName = node.camera;
        node.camera = (gltfJson.cameraDic as any)[node.cameraName];
      }
    }
  }

  static _loadDependenciesOfMeshes(gltfJson: glTF1) {
    // Mesh
    for (const meshName in gltfJson.meshDic) {
      const mesh = gltfJson.meshDic[meshName];
      for (const primitive of mesh.primitives) {
        if (primitive.material !== void 0) {
          primitive.materialName = primitive.material;
          primitive.materialObject =
            gltfJson.materialDic[primitive.materialName!];
          primitive.material = gltfJson.materials.indexOf(
            primitive.materialObject
          );
        }

        primitive.attributesNames = Object.assign({}, primitive.attributes);
        primitive.attributes = [];
        primitive.attributesObjects = {};
        for (let attributeName in primitive.attributesNames) {
          if (primitive.attributesNames[attributeName] != null) {
            const accessorName = primitive.attributesNames[attributeName];
            const accessor = (gltfJson.accessorDic as any)[accessorName];

            if (attributeName === 'JOINT') {
              attributeName = 'JOINTS_0';
              delete primitive.attributes['JOINT'];
            } else if (attributeName === 'WEIGHT') {
              attributeName = 'WEIGHTS_0';
              delete primitive.attributes['WEIGHT'];
            }

            accessor.extras = {
              toGetAsTypedArray: true,
              attributeName: attributeName,
            };
            primitive.attributesObjects![attributeName] = accessor;
          } else {
            //primitive.attributes[attributeName] = void 0;
          }
        }

        if (primitive.indices !== void 0) {
          primitive.indicesName = primitive.indices;
          primitive.indicesObject = (gltfJson.accessorDic as any)[
            primitive.indicesName
          ];
          primitive.indices = gltfJson.accessors.indexOf(
            primitive.indicesObject
          );
        }
      }
    }
  }

  static _isKHRMaterialsCommon(materialJson: RnM2Material) {
    if (
      typeof materialJson.extensions !== 'undefined' &&
      typeof materialJson.extensions.KHR_materials_common !== 'undefined'
    ) {
      return true;
    } else {
      return false;
    }
  }

  static _loadDependenciesOfMaterials(gltfJson: glTF1) {
    // Material
    if (gltfJson.materials) {
      for (const materialStr in gltfJson.materials) {
        let material = gltfJson.materials[materialStr];

        const origMaterial = material;
        if (this._isKHRMaterialsCommon(material)) {
          material = material.extensions.KHR_materials_common;
        }

        const setParameters = (values: any[], isParameter: boolean) => {
          for (const valueName in values) {
            let value = null;
            if (isParameter) {
              value = values[valueName].value;
              if (typeof value === 'undefined') {
                continue;
              }
            } else {
              value = values[valueName];
            }

            if (typeof value === 'string') {
              const textureStr = value;
              let texturePurpose;
              if (
                valueName === 'diffuse' ||
                (material.technique === 'CONSTANT' && valueName === 'ambient')
              ) {
                origMaterial.diffuseColorTexture = {};
                origMaterial.diffuseColorTexture.texture = (
                  gltfJson.textures as any
                )[value];
              } else if (
                valueName === 'emission' &&
                textureStr.match(/_normal$/)
              ) {
                origMaterial.emissionTexture = {};
                origMaterial.emissionTexture.texture = (
                  gltfJson.textures as any
                )[value];
              }
              origMaterial.extras = {};
              origMaterial.extras.technique = material.technique;
            } else {
              if (valueName === 'diffuse') {
                origMaterial.diffuseColorFactor = value;
              }
            }
          }
        };
        setParameters(material.values, false);
        if (material.technique && gltfJson.techniques) {
          if (typeof gltfJson.techniques[material.technique] !== 'undefined') {
            setParameters(
              gltfJson.techniques[material.technique].parameters,
              true
            );
          }
        }
      }
    }
  }

  static _loadDependenciesOfTextures(gltfJson: glTF1) {
    // Texture
    if (gltfJson.textures) {
      for (const textureName in gltfJson.textureDic) {
        const texture = (gltfJson.textureDic as any)[textureName];
        if (texture.sampler !== void 0) {
          texture.samplerName = texture.sampler;
          texture.samplerObject = (gltfJson.samplerDic as any)[
            texture.samplerName
          ];
        }
        if (texture.source !== void 0) {
          texture.sourceName = texture.source;
          texture.image = (gltfJson.imageDic as any)[texture.sourceName];
        }
      }
    }
  }

  static _loadDependenciesOfJoints(gltfJson: glTF1) {
    if (gltfJson.skins) {
      for (const skinName in gltfJson.skinDic) {
        const skin = (gltfJson.skinDic as any)[skinName];
        skin.joints = [];
        skin.jointsIndices = [];
        for (const jointName of skin.jointNames) {
          const joint = (gltfJson.nodeDic as any)[jointName];
          skin.joints.push(joint);
          skin.jointsIndices.push(joint._index);
        }

        skin.skeletonNames = skin.skeletons;
        if (skin.skeletonNames) {
          for (const name of skin.skeletonNames) {
            skin.skeleton = skin.skeletons.push(
              (gltfJson.nodeDic as any)[name]
            );
          }
        } else {
          skin.skeleton = skin.joints[0];
        }
        skin.skeletonIndex = skin.skeleton._index;

        skin.inverseBindMatricesName = skin.inverseBindMatrices;
        skin.inverseBindMatrices = (gltfJson.accessorDic as any)[
          skin.inverseBindMatricesName
        ];

        skin.joints_tmp = skin.joints;
        skin.joints = [];
        for (const joint of skin.joints_tmp) {
          skin.joints.push((gltfJson.nodeDic as any)[joint.name]);
        }
        skin.joints_tmp = void 0;
      }
    }
  }

  static _loadDependenciesOfAnimations(gltfJson: glTF1) {
    if (gltfJson.animations) {
      for (const animationName in gltfJson.animationDic) {
        const animation = gltfJson.animationDic[animationName] as RnM2Animation;
        const samplerDic = animation.samplers;
        animation.samplers = [];
        for (const channel of animation.channels) {
          channel.samplerObject = samplerDic[channel.sampler];

          channel.target!.nodeObject =
            gltfJson.nodeDic[(channel.target as any)!.id];

          channel.samplerObject.inputObject =
            gltfJson.accessorDic[animation.parameters['TIME']];
          channel.samplerObject.outputObject =
            gltfJson.accessorDic[
              (animation as any).parameters[channel.target!.path]
            ];

          animation.samplers.push(channel.samplerObject);

          if (channel.target!.path === 'rotation') {
            if (channel.samplerObject!.outputObject!.extras === void 0) {
              channel.samplerObject!.outputObject!.extras = {} as any;
            }
            channel.samplerObject!.outputObject!.extras!.quaternionIfVec4 =
              true;
          }
        }
      }
    }
  }

  static _loadDependenciesOfAccessors(gltfJson: glTF1) {
    // Accessor
    for (const accessorName in gltfJson.accessorDic) {
      const accessor = gltfJson.accessorDic[accessorName] as RnM2Accessor;
      if (accessor.bufferView !== void 0) {
        accessor.bufferViewName = accessor.bufferView as unknown as string;
        accessor.bufferViewObject =
          gltfJson.bufferViewDic[accessor.bufferViewName!];
      }
    }
  }

  static _loadDependenciesOfBufferViews(gltfJson: glTF1) {
    // BufferView
    for (const bufferViewName in gltfJson.bufferViewDic) {
      const bufferView = gltfJson.bufferViewDic[
        bufferViewName
      ] as RnM2BufferView;
      if (bufferView.buffer !== void 0) {
        bufferView.bufferName = bufferView.buffer as unknown as string;
        bufferView.bufferObject = gltfJson.bufferDic[bufferView.bufferName!];
        let bufferIdx = 0;
        for (const bufferName in gltfJson.bufferDic) {
          if (bufferName === bufferView.bufferName) {
            bufferView.buffer = bufferIdx;
          }
          bufferIdx++;
        }
      }
    }
  }

  static _mergeExtendedJson(
    gltfJson: glTF1,
    extendedData: ArrayBuffer | string | object
  ) {
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
    uint8Array: Uint8Array,
    gltfJson: glTF1,
    files: GltfFileBuffers,
    options: GltfLoadOption,
    basePath?: string
  ): Promise<(glTF1 | void)[]> {
    const promisesToLoadResources: Promise<glTF1 | void>[] = [];

    // Buffers Async load
    for (const i in gltfJson.buffers) {
      const bufferInfo = gltfJson.buffers[i];

      let filename = '';
      if (bufferInfo.uri) {
        const splitUri = bufferInfo.uri.split('/');
        filename = splitUri[splitUri.length - 1];
      }

      if (typeof bufferInfo.uri === 'undefined') {
        promisesToLoadResources.push(
          new Promise(resolve => {
            bufferInfo.buffer = uint8Array;
            resolve(gltfJson);
          })
        );
      } else if (bufferInfo.uri === '' || bufferInfo.uri === 'data:,') {
        promisesToLoadResources.push(
          new Promise(resolve => {
            bufferInfo.buffer = uint8Array;
            resolve(gltfJson);
          })
        );
      } else if (bufferInfo.uri.match(/^data:application\/(.*);base64,/)) {
        promisesToLoadResources.push(
          new Promise(resolve => {
            const arrayBuffer = DataUtil.dataUriToArrayBuffer(bufferInfo.uri);
            bufferInfo.buffer = new Uint8Array(arrayBuffer);
            resolve(gltfJson);
          })
        );
      } else if (files && this.__containsFileName(files, filename)) {
        promisesToLoadResources.push(
          new Promise(resolve => {
            const fullPath = this.__getFullPathOfFileName(files, filename);
            const arrayBuffer = files[fullPath!];
            bufferInfo.buffer = new Uint8Array(arrayBuffer);
            resolve(gltfJson);
          })
        );
      } else {
        // Need to async load other files
        promisesToLoadResources.push(
          DataUtil.loadResourceAsync(
            basePath + bufferInfo.uri,
            true,
            (resolve: Function, response: ArrayBuffer) => {
              bufferInfo.buffer = new Uint8Array(response);
              resolve(gltfJson);
            },
            (reject: Function, error: number) => {
              reject('HTTP Error Status:' + error);
            }
          )
        );
      }
    }

    // Textures Async load
    for (const imageJson of gltfJson.images ?? []) {
      let imageUri: string;

      if (
        typeof imageJson.extensions !== 'undefined' &&
        typeof imageJson.extensions.KHR_binary_glTF !== 'undefined'
      ) {
        const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
          gltfJson,
          imageJson.extensions.KHR_binary_glTF.bufferView,
          uint8Array
        );
        imageUri = DataUtil.createBlobImageUriFromUint8Array(
          imageUint8Array,
          imageJson.extensions.KHR_binary_glTF.mimeType!
        );
      } else if (typeof imageJson.uri === 'undefined') {
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
        const splitUri = imageFileStr.split('/');
        const filename = splitUri[splitUri.length - 1];

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
      }

      promisesToLoadResources.push(
        this.__loadImageUri(imageUri, imageJson, files)
      );
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

    return Promise.all(promisesToLoadResources);
  }

  private static __containsFileName(
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

  private static __getFullPathOfFileName(
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

  private static __loadImageUri(
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
      imageUri.match(/ktx2$/) ||
      (imageJson.bufferView != null && imageJson.mimeType === 'image/ktx2')
    ) {
      // load ktx2 file from uri or bufferView
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
}
