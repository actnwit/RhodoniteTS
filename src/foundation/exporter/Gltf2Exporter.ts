import EntityRepository from '../core/EntityRepository';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import AbstractTexture from '../textures/AbstractTexture';
import {Is} from '../misc/Is';
import {
  Gltf2,
  Gltf2AccessorCompositionTypeString,
  Gltf2Animation,
  Gltf2AnimationChannel,
  Gltf2AnimationSampler,
  Gltf2BufferViewEx,
  Gltf2Mesh,
  Gltf2Primitive,
  Gltf2AnimationPathName,
  Gltf2Skin,
  Gltf2Image,
  Gltf2TextureSampler,
  isSameGlTF2TextureSampler,
  Gltf2Texture,
} from '../../types/glTF2';
import {
  ComponentType,
  Gltf2AccessorComponentType,
} from '../definitions/ComponentType';
import {
  Gltf2AccessorEx,
  Gltf2Ex,
  Gltf2MaterialEx,
} from '../../types/glTF2ForOutput';
import BufferView from '../memory/BufferView';
import DataUtil from '../misc/DataUtil';
import Accessor from '../memory/Accessor';
import {
  Array1to4,
  Byte,
  Count,
  Index,
  VectorAndSquareMatrixComponentN,
} from '../../types/CommonTypes';
import Buffer from '../memory/Buffer';
import {
  GL_ARRAY_BUFFER,
  GL_ELEMENT_ARRAY_BUFFER,
  GL_LINEAR,
  GL_LINEAR_MIPMAP_LINEAR,
  GL_REPEAT,
} from '../../types/WebGLConstants';
import {AnimationChannel, AnimationPathName} from '../../types/AnimationTypes';
import {CompositionType} from '../definitions/CompositionType';
import {ComponentTypeEnum, CompositionTypeEnum} from '../..';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import {
  IAnimationEntity,
  IGroupEntity,
  IMeshEntity,
  ISkeletalEntity,
} from '../helpers/EntityHelper';
import { createEffekseer } from './Gltf2ExporterEffekseer';
const _VERSION = require('./../../../VERSION-FILE').default;

export const GLTF2_EXPORT_GLTF = 'glTF';
export const GLTF2_EXPORT_GLB = 'glTF-Binary';
export const GLTF2_EXPORT_DRACO = 'glTF-Draco';
export const GLTF2_EXPORT_EMBEDDED = 'glTF-Embedded';

export type Gltf2ExportType =
  | typeof GLTF2_EXPORT_GLTF
  | typeof GLTF2_EXPORT_GLB
  | typeof GLTF2_EXPORT_DRACO
  | typeof GLTF2_EXPORT_EMBEDDED;
export interface Gltf2ExporterArguments {
  entities?: IGroupEntity[]; // The target entities. This exporter includes their descendants for the output.
  type: Gltf2ExportType;
}

/**
 * The glTF2 format Exporter class.
 */
export default class Gltf2Exporter {
  private static __entityRepository = EntityRepository.getInstance();

  private constructor() {}

  /**
   * Exports scene data in the rhodonite system in glTF2 format.
   * @param filename the target output path
   * @param option a option config
   */
  static async export(
    filename: string,
    option: Gltf2ExporterArguments = {
      entities: undefined,
      type: GLTF2_EXPORT_GLB,
    }
  ) {
    const {collectedEntities, topLevelEntities} =
      this.__collectEntities(option);

    const {json, fileName}: {json: Gltf2Ex; fileName: string} =
      this.__createJsonBase(filename);

    this.__createBufferViewsAndAccessors(json, collectedEntities);

    this.__createNodes(json, collectedEntities, topLevelEntities);

    await this.__createMaterials(
      json,
      collectedEntities as unknown as IMeshEntity[],
      option
    );

    createEffekseer(json, collectedEntities);

    const arraybuffer = this.__createBinary(json);

    this.__deleteEmptyArrays(json);

    if (option.type === GLTF2_EXPORT_GLB) {
      this.__downloadGlb(json, fileName, arraybuffer);
    } else if (option.type === GLTF2_EXPORT_GLTF) {
      this.__downloadGltf(json, fileName, arraybuffer);
    }
  }

  private static __deleteEmptyArrays(json: Gltf2Ex) {
    if (json.accessors.length === 0) {
      delete (json as Gltf2).accessors;
    }
    if (json.bufferViews.length === 0) {
      delete (json as Gltf2).bufferViews;
    }
    if (json.materials.length === 0) {
      delete (json as Gltf2).materials;
    }
    if (json.meshes.length === 0) {
      delete (json as Gltf2).meshes;
    }
    if (json.skins.length === 0) {
      delete (json as Gltf2).skins;
    }
    if (json.textures.length === 0) {
      delete (json as Gltf2).textures;
    }
    if (json.images.length === 0) {
      delete (json as Gltf2).images;
    }
    if (json.animations.length === 0) {
      delete (json as Gltf2).animations;
    }
    delete (json as Gltf2).extras;
  }

  /**
   * collect target entities. This exporter includes their descendants for the output.
   * @param option an option config
   * @returns target entities
   */
  private static __collectEntities(option: Gltf2ExporterArguments | undefined) {
    if (
      Is.exist(option) &&
      Is.exist(option.entities) &&
      option.entities.length > 0
    ) {
      const collectDescendants = (
        entity: IGroupEntity,
        root: boolean
      ): IGroupEntity[] => {
        const sg = entity.getSceneGraph()!;
        if (sg.children.length > 0) {
          const array: IGroupEntity[] = root ? [] : [entity];
          for (let i = 0; i < sg.children.length; i++) {
            const child = sg.children[i];
            Array.prototype.push.apply(
              array,
              collectDescendants(child.entity, false)
            );
          }
          return array;
        } else {
          return [entity];
        }
      };
      const collectedDescendants = option.entities.flatMap(entity =>
        collectDescendants(entity, true)
      );

      const topLevelEntities: IGroupEntity[] = [];
      option.entities.forEach(entity => {
        if (collectedDescendants.indexOf(entity) === -1) {
          topLevelEntities.push(entity);
        }
      });
      const collectedEntities = option.entities.concat();
      Array.prototype.push.apply(collectedEntities, collectedDescendants);
      return {collectedEntities, topLevelEntities};
    }
    const collectedEntities =
      Gltf2Exporter.__entityRepository._getEntities() as unknown as IGroupEntity[];
    const topLevelEntities =
      SceneGraphComponent.getTopLevelComponents().flatMap(c => c.entity);

    return {collectedEntities, topLevelEntities};
  }

  /**
   * create the base of glTF2 JSON
   * @param filename target output path
   * @returns the json and fileName in a object
   */
  private static __createJsonBase(filename: string) {
    const fileName = filename ? filename : 'Rhodonite_' + new Date().getTime();
    const json: Gltf2Ex = {
      asset: {
        version: '2.0',
        generator: `Rhodonite (${_VERSION.version})`,
      },
      buffers: [{uri: fileName + '.bin', byteLength: 0}],
      bufferViews: [],
      accessors: [],
      animations: [],
      meshes: [],
      skins: [],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [1.0, 1.0, 1.0, 1.0],
          },
        },
      ],
      textures: [],
      images: [],
      extensionsUsed: ['RHODONITE_effekseer'],
      extensions: {
        RHODONITE_effekseer: {
          effects: [],
        },
      },
      extras: {
        rnSkins: [],
        bufferViewByteLengthAccumulatedArray: [],
        // bufferViewByteLengthAccumulatedArray[0] for buffer 0
        // bufferViewByteLengthAccumulatedArray[1] for buffer 1
        // ...
      },
      samplers: [],
    };

    return {json, fileName};
  }

  /**
   * create Gltf2BufferViews and Gltf2Accessors for the output glTF2 JSON
   * @param json
   * @param entities
   */
  static __createBufferViewsAndAccessors(
    json: Gltf2Ex,
    entities: IGroupEntity[]
  ) {
    const existingUniqueRnBuffers: Buffer[] = [];
    const existingUniqueRnBufferViews: BufferView[] = [];
    const existingUniqueRnAccessors: Accessor[] = [];

    __createBufferViewsAndAccessorsOfMesh(
      json,
      entities as IMeshEntity[],
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );

    __createBufferViewsAndAccessorsOfAnimation(
      json,
      entities as IAnimationEntity[]
    );

    __createBufferViewsAndAccessorsOfSkin(
      json,
      entities as ISkeletalEntity[],
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );
  }

  /**
   * create Gltf2Nodes for the output glTF2 JSON
   * @param json a glTF2 JSON
   * @param entities target entities
   * @param indicesOfGltfMeshes the indices of Gltf2Meshes
   */
  static __createNodes(
    json: Gltf2Ex,
    entities: IGroupEntity[],
    topLevelEntities: IGroupEntity[]
  ) {
    json.nodes = [];
    json.scenes = [{nodes: []}];
    const scene = json.scenes![0];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      (entity as any).gltfNodeIndex = i;
    }

    let meshCount = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      // node ids of the output glTF2 data will be the indices of entities (specified target entities)
      json.nodes[i] = {};
      const node = json.nodes[i];

      // node.name
      node.name = entity.uniqueName;

      // node.children
      const sceneGraphComponent = entity.getSceneGraph()!;
      const children = sceneGraphComponent.children;
      if (children.length > 0) {
        node.children = [];
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          node.children.push((child.entity as any).gltfNodeIndex);
        }
      }

      // matrix
      const transform = entity.getTransform()!;
      node.rotation = [
        transform.quaternionInner.x,
        transform.quaternionInner.y,
        transform.quaternionInner.z,
        transform.quaternionInner.w,
      ];
      node.scale = [
        transform.scaleInner.x,
        transform.scaleInner.y,
        transform.scaleInner.z,
      ];
      node.translation = [
        transform.translateInner.x,
        transform.translateInner.y,
        transform.translateInner.z,
      ];

      // mesh
      const meshComponent = entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        node.mesh = meshCount++;
      }

      // skin
      const skinComponent = entity.tryToGetSkeletal();
      if (Is.exist(skinComponent)) {
        const entityIdx = json.extras.rnSkins.indexOf(
          skinComponent.entity as any
        );
        if (entityIdx >= 0) {
          node.skin = entityIdx;
        }
      }
    }

    // If the entity has no parent, it must be a top level entity in the scene graph.
    topLevelEntities.forEach((entity, i) => {
      const idx = entities.indexOf(entity);
      if (idx >= 0) {
        scene.nodes!.push(idx);
      }
    });
  }

  /**
   * create Gltf2Materials and set them to Gltf2Primitives for the output glTF2 JSON
   * @param json a glTF2 JSON
   * @param entities all target entities
   */
  static async __createMaterials(
    json: Gltf2Ex,
    entities: IMeshEntity[],
    option: Gltf2ExporterArguments
  ) {
    let countMesh = 0;
    const promises: Promise<any>[] = [];
    json.extras.bufferViewByteLengthAccumulatedArray.push(0);
    const bufferIdx =
      json.extras.bufferViewByteLengthAccumulatedArray.length - 1;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent && meshComponent.mesh) {
        const gltf2Mesh = json.meshes![countMesh++];
        const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveCount; j++) {
          const rnPrimitive = meshComponent.mesh.getPrimitiveAt(j);
          const primitive = gltf2Mesh.primitives[j];
          const rnMaterial = rnPrimitive.material!;

          const material: Gltf2MaterialEx = {
            pbrMetallicRoughness: {
              metallicFactor: 1.0,
              roughnessFactor: 1.0,
            },
          };

          let colorParam;
          if (Is.exist(rnMaterial)) {
            colorParam = rnMaterial.getParameter(
              ShaderSemantics.BaseColorFactor
            );
            if (colorParam == null) {
              colorParam = rnMaterial.getParameter(
                ShaderSemantics.DiffuseColorFactor
              );
            } else {
              material.pbrMetallicRoughness.metallicFactor =
                rnMaterial.getParameter(
                  ShaderSemantics.MetallicRoughnessFactor
                ).x;
              material.pbrMetallicRoughness.roughnessFactor =
                rnMaterial.getParameter(
                  ShaderSemantics.MetallicRoughnessFactor
                ).y;
            }
            material.pbrMetallicRoughness.baseColorFactor =
              Array.prototype.slice.call(colorParam._v);

            material.alphaMode = rnMaterial.alphaMode.str;

            const existedImages: string[] = [];

            const processTexture = (rnTexture: AbstractTexture) => {
              if (rnTexture && rnTexture.width > 1 && rnTexture.height > 1) {
                let imageIndex = json.images.length;
                let match = false;
                for (let k = 0; k < json.images.length; k++) {
                  const image = json.images![k];
                  if (image.uri === rnTexture.name) {
                    imageIndex = k;
                    match = true;
                  }
                }

                // Sampler
                let samplerIdx = -1;
                {
                  const gltf2TextureSampler: Gltf2TextureSampler = {
                    magFilter: rnTexture.magFilter.index,
                    minFilter: rnTexture.minFilter.index,
                    wrapS: rnTexture.wrapS.index,
                    wrapT: rnTexture.wrapT.index,
                  };

                  samplerIdx = json.samplers.findIndex(sampler => {
                    return isSameGlTF2TextureSampler(
                      gltf2TextureSampler,
                      sampler
                    );
                  });
                  if (samplerIdx === -1) {
                    json.samplers.push(gltf2TextureSampler);
                    samplerIdx = json.samplers.length - 1;
                  }
                }

                if (!match) {
                  // Image
                  const glTF2ImageEx = {
                    uri: rnTexture.name,
                  };

                  if (existedImages.indexOf(rnTexture.name) !== -1) {
                    glTF2ImageEx.uri += '_' + rnTexture.textureUID;
                  }

                  existedImages.push(glTF2ImageEx.uri!);

                  if (Is.not.exist(glTF2ImageEx.uri!.match(/\.(png)/))) {
                    glTF2ImageEx.uri += '.png';
                  }
                  const htmlCanvasElement = rnTexture.htmlCanvasElement;
                  if (htmlCanvasElement) {
                    const promise = new Promise(
                      (
                        resolve: (v?: ArrayBuffer) => void,
                        rejected: (reason?: DOMException) => void
                      ) => {
                        htmlCanvasElement.toBlob(blob => {
                          if (Is.exist(blob)) {
                            handleTextureImage(
                              json,
                              bufferIdx,
                              blob,
                              option,
                              glTF2ImageEx,
                              resolve,
                              rejected
                            );
                          } else {
                            throw Error('canvas to blob error!');
                          }
                        });
                      }
                    );
                    promises.push(promise);
                  }
                  json.images.push(glTF2ImageEx);
                }

                const gltf2Texture: Gltf2Texture = {
                  sampler: samplerIdx,
                  source: imageIndex,
                };
                const textureIdx = json.textures.indexOf(gltf2Texture);
                if (textureIdx === -1) {
                  json.textures.push(gltf2Texture);
                }

                return json.textures.indexOf(gltf2Texture);
              }
              return void 0;
            };

            let textureParam = rnMaterial.getParameter(
              ShaderSemantics.BaseColorTexture
            );
            let rnTexture;
            let textureIndex;
            if (textureParam != null) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.pbrMetallicRoughness.baseColorTexture = {
                  index: textureIndex,
                };
              }
            } else {
              textureParam = rnMaterial.getParameter(
                ShaderSemantics.DiffuseColorTexture
              );
              if (textureParam != null) {
                const rnTexture = textureParam[1];
                const textureIndex = processTexture(rnTexture!);
                if (textureIndex != null) {
                  material.pbrMetallicRoughness.diffuseColorTexture = {
                    index: textureIndex,
                  };
                }
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.MetallicRoughnessTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.pbrMetallicRoughness.metallicRoughnessTexture = {
                  index: textureIndex,
                };
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.NormalTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.normalTexture = {index: textureIndex};
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.OcclusionTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.occlusionTexture = {index: textureIndex};
              }
            }

            textureParam = rnMaterial.getParameter(
              ShaderSemantics.EmissiveTexture
            ) as AbstractTexture;
            if (textureParam) {
              rnTexture = textureParam[1];
              textureIndex = processTexture(rnTexture!);
              if (textureIndex != null) {
                material.emissiveTexture = {index: textureIndex};
              }
            }
          }

          const imageIdx = json.materials.indexOf(material);
          if (imageIdx === -1) {
            json.materials.push(material);
          }
          primitive.material = json.materials.indexOf(material);
        }
      }
    }
    return Promise.all(promises);
  }

  /**
   * create the arraybuffer of the glTF2 .bin file and write all accessors data to the arraybuffer
   * @param json a glTF2 JSON
   * @returns A arraybuffer
   */
  private static __createBinary(json: Gltf2Ex) {
    // write all data of accessors to the DataView (total data area)
    if (Is.undefined(json.accessors) || Is.undefined(json.bufferViews)) {
      return new ArrayBuffer(0);
    }

    // calc total sum of BufferViews in multiple Buffers
    const byteLengthOfUniteBuffer =
      json.extras.bufferViewByteLengthAccumulatedArray.reduce(
        (sum, val) => sum + val
      );
    if (byteLengthOfUniteBuffer > 0) {
      const buffer = json.buffers![0];
      buffer.byteLength =
        byteLengthOfUniteBuffer +
        DataUtil.calcPaddingBytes(byteLengthOfUniteBuffer, 4);
    }

    // create the ArrayBuffer of unite Buffer (consist of multiple Buffers)
    const arrayBuffer = new ArrayBuffer(json.buffers![0].byteLength);

    // copy BufferViews in multiple Buffer to the Unite Buffer
    let lastCopiedByteLengthOfBufferView = 0;
    for (let i = 0; i < json.bufferViews.length; i++) {
      const bufferView = json.bufferViews[i];
      const uint8ArrayOfBufferView = bufferView.extras!.uint8Array!;
      delete (bufferView as unknown as Gltf2).extras;

      const distByteOffset = lastCopiedByteLengthOfBufferView;
      DataUtil.copyArrayBufferWithPadding({
        src: uint8ArrayOfBufferView.buffer,
        dist: arrayBuffer,
        srcByteOffset: uint8ArrayOfBufferView.byteOffset,
        copyByteLength: uint8ArrayOfBufferView.byteLength,
        distByteOffset,
      });
      lastCopiedByteLengthOfBufferView += DataUtil.addPaddingBytes(
        uint8ArrayOfBufferView.byteLength,
        4
      );
      bufferView.byteOffset = distByteOffset;
      bufferView.buffer = 0; // rewrite buffer index to 0 (The Unite Buffer)
    }

    return arrayBuffer;
  }

  /**
   * download the glTF2 files
   * @param json a glTF2 JSON
   * @param filename target output path
   * @param arraybuffer an ArrayBuffer of the .bin file
   */
  static __downloadGlb(
    json: Gltf2,
    filename: string,
    arraybuffer: ArrayBuffer
  ): void {
    {
      const headerBytes = 12; // 12byte-header

      // .glb file
      delete json.buffers![0].uri;
      let jsonStr = JSON.stringify(json, null, 2);
      let jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
      const paddingBytes = DataUtil.calcPaddingBytes(
        jsonArrayBuffer.byteLength,
        4
      );
      if (paddingBytes > 0) {
        for (let i = 0; i < paddingBytes; i++) {
          jsonStr += ' ';
        }
        jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
      }
      const jsonChunkLength = jsonArrayBuffer.byteLength;
      const headerAndChunk0 = headerBytes + 4 + 4 + jsonChunkLength; // Chunk-0
      const totalBytes = headerAndChunk0 + 4 + 4 + arraybuffer.byteLength; // Chunk-1

      const glbArrayBuffer = new ArrayBuffer(totalBytes);
      const dataView = new DataView(glbArrayBuffer);
      dataView.setUint32(0, 0x46546c67, true);
      dataView.setUint32(4, 2, true);
      dataView.setUint32(8, totalBytes, true);
      dataView.setUint32(12, jsonArrayBuffer.byteLength, true);
      dataView.setUint32(16, 0x4e4f534a, true);

      DataUtil.copyArrayBufferAs4Bytes({
        src: jsonArrayBuffer,
        dist: glbArrayBuffer,
        srcByteOffset: 0,
        copyByteLength: jsonArrayBuffer.byteLength,
        distByteOffset: 20,
      });
      DataUtil.copyArrayBufferAs4Bytes({
        src: arraybuffer,
        dist: glbArrayBuffer,
        srcByteOffset: 0,
        copyByteLength: arraybuffer.byteLength,
        distByteOffset: 20 + jsonChunkLength + 8,
      });
      dataView.setUint32(headerAndChunk0, arraybuffer.byteLength, true);
      dataView.setUint32(headerAndChunk0 + 4, 0x004e4942, true);

      const a = document.createElement('a');
      a.download = filename + '.glb';
      const blob = new Blob([glbArrayBuffer], {type: 'octet/stream'});
      const url = URL.createObjectURL(blob);
      a.href = url;

      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
  }

  /**
   * download the glTF2 files
   * @param json a glTF2 JSON
   * @param filename target output path
   * @param arraybuffer an ArrayBuffer of the .bin file
   */
  static __downloadGltf(
    json: Gltf2,
    filename: string,
    arraybuffer: ArrayBuffer
  ): void {
    {
      // .gltf file
      const a = document.createElement('a');

      a.download = filename + '.gltf';
      const str = JSON.stringify(json, null, 2);
      a.href = 'data:application/octet-stream,' + encodeURIComponent(str);

      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
    {
      // .bin file
      const a = document.createElement('a');
      a.download = filename + '.bin';
      const blob = new Blob([arraybuffer], {type: 'octet/stream'});
      const url = URL.createObjectURL(blob);
      a.href = url;
      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
  }
}

/**
 * create Gltf2Skins
 * @param json a glTF2 JSON
 * @param entities all target entities
 */
function __createBufferViewsAndAccessorsOfSkin(
  json: Gltf2Ex,
  entities: ISkeletalEntity[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
) {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const skeletalComponent = entity.tryToGetSkeletal();
    if (Is.not.exist(skeletalComponent)) {
      continue;
    }
    json.extras.rnSkins.push(skeletalComponent.entity as any);
    const jointSceneComponentsOfTheEntity = skeletalComponent.getJoints();
    const jointIndicesOfTheEntity: Index[] = [];
    for (const jointSceneComponent of jointSceneComponentsOfTheEntity) {
      entities.forEach((entityObj, j) => {
        if (jointSceneComponent.entity === entityObj) {
          jointIndicesOfTheEntity.push(j);
        }
      });
    }

    const inverseBindMatRnAccessor =
      skeletalComponent.getInverseBindMatricesAccessor();
    if (Is.exist(inverseBindMatRnAccessor)) {
      createOrReuseGltf2BufferView(
        json,
        existingUniqueRnBuffers,
        existingUniqueRnBufferViews,
        inverseBindMatRnAccessor.bufferView
      );

      createOrReuseGltf2Accessor(
        json,
        json.bufferViews.length - 1,
        existingUniqueRnAccessors,
        inverseBindMatRnAccessor
      );
    }

    const topOfJointsSkeletonSceneComponent =
      skeletalComponent.topOfJointsHierarchy;
    const bindShapeMatrix = skeletalComponent._bindShapeMatrix;
    let skeletalIdx = -1;
    if (Is.exist(topOfJointsSkeletonSceneComponent)) {
      const skeletalEntity =
        topOfJointsSkeletonSceneComponent.entity as ISkeletalEntity;
      skeletalIdx = entities.indexOf(skeletalEntity);
    } else {
      skeletalIdx = jointIndicesOfTheEntity[0];
    }
    const skinJson: Gltf2Skin = {
      joints: jointIndicesOfTheEntity,
      inverseBindMatrices: json.accessors.length - 1,
      skeleton: skeletalIdx >= 0 ? skeletalIdx : undefined,
      bindShapeMatrix: bindShapeMatrix?.flattenAsArray(),
    };

    json.skins.push(skinJson);
  }
}

/**
 * create BufferViews and Accessors of mesh
 * @param entity
 * @param json
 * @param bufferViewByteLengthAccumulated
 * @param bufferViewCount
 * @param accessorCount
 * @returns
 */
function __createBufferViewsAndAccessorsOfMesh(
  json: Gltf2Ex,
  entities: IMeshEntity[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const meshComponent = entity.tryToGetMesh();
    if (Is.exist(meshComponent) && meshComponent.mesh) {
      const mesh: Gltf2Mesh = {primitives: []};
      const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveCount; j++) {
        const rnPrimitive = meshComponent.mesh.getPrimitiveAt(j);
        const primitive: Gltf2Primitive = {
          attributes: {},
          mode: rnPrimitive.primitiveMode.index,
        };

        // Vertex Indices
        // For indices accessor
        const rnIndicesAccessor = rnPrimitive.indicesAccessor;
        if (Is.exist(rnIndicesAccessor)) {
          const rnBufferView = rnIndicesAccessor.bufferView;
          const gltf2BufferView = createOrReuseGltf2BufferView(
            json,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            GL_ELEMENT_ARRAY_BUFFER
          );

          const gltf2Accessor = createOrReuseGltf2Accessor(
            json,
            json.bufferViews.indexOf(gltf2BufferView),
            existingUniqueRnAccessors,
            rnIndicesAccessor
          );
          const accessorIdx = json.accessors.indexOf(gltf2Accessor);
          primitive.indices = accessorIdx;
        }

        // Vertex Attributes
        // For each attribute accessor
        const attributeAccessors = rnPrimitive.attributeAccessors;
        for (let j = 0; j < attributeAccessors.length; j++) {
          const rnAttributeAccessor = attributeAccessors[j];
          // create a Gltf2BufferView
          const rnBufferView = rnAttributeAccessor.bufferView;

          const gltf2BufferView =
            createOrReuseGltf2BufferViewForVertexAttributeBuffer(
              json,
              existingUniqueRnBuffers,
              existingUniqueRnBufferViews,
              rnBufferView,
              rnAttributeAccessor
            );
          const gltf2Accessor = createOrReuseGltf2Accessor(
            json,
            json.bufferViews.indexOf(gltf2BufferView),
            existingUniqueRnAccessors,
            rnAttributeAccessor
          );

          const accessorIdx = json.accessors.indexOf(gltf2Accessor);
          const attributeJoinedString = rnPrimitive.attributeSemantics[j];
          if (Is.exist(attributeJoinedString)) {
            const attribute = attributeJoinedString.split('.')[0];
            primitive.attributes[attribute] = accessorIdx;
          }
        }
        mesh.primitives[j] = primitive;
      }
      json.meshes.push(mesh);
    }
  }
}

/**
 * create BufferViews and Accessors of animation
 * @param json
 * @param entities
 */
function __createBufferViewsAndAccessorsOfAnimation(
  json: Gltf2Ex,
  entities: IAnimationEntity[]
): void {
  let sumOfBufferViewByteLengthAccumulated = 0;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length;
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const animationComponent = entity.tryToGetAnimation();
    if (Is.exist(animationComponent)) {
      const trackNames = animationComponent.getAnimationTrackNames();
      for (const trackName of trackNames) {
        // AnimationTrack (Gltf2Animation)
        const animation: Gltf2Animation = {
          channels: [],
          samplers: [],
        };
        json.animations.push(animation);
        let samplerIdx = 0;
        // Rhodonite AnimationTrack is corresponding to Gltf2Animation
        const rnAnimationTrack =
          animationComponent.getAnimationChannelsOfTrack(trackName);
        if (Is.exist(rnAnimationTrack)) {
          const rnChannels = rnAnimationTrack.values();
          for (const rnChannel of rnChannels) {
            // create and register Gltf2BufferView and Gltf2Accessor
            //   and set Input animation data as Uint8Array to the Gltf2Accessor
            const {inputAccessorIdx, inputBufferViewByteLengthAccumulated} =
              createGltf2BufferViewAndGltf2AccessorForInput(
                json,
                rnChannel,
                bufferIdx,
                sumOfBufferViewByteLengthAccumulated
              );

            sumOfBufferViewByteLengthAccumulated +=
              inputBufferViewByteLengthAccumulated;
            // create and register Gltf2BufferView and Gltf2Accessor
            //   and set Output animation data as Uint8Array to the Gltf2Accessor
            const {outputAccessorIdx, outputBufferViewByteLengthAccumulated} =
              createGltf2BufferViewAndGltf2AccessorForOutput(
                json,
                rnChannel,
                bufferIdx,
                sumOfBufferViewByteLengthAccumulated
              );
            sumOfBufferViewByteLengthAccumulated +=
              outputBufferViewByteLengthAccumulated;

            // Create Gltf2AnimationChannel
            samplerIdx = createGltf2AnimationChannel(
              rnChannel,
              samplerIdx,
              animation,
              i
            );

            // Create Gltf2AnimationSampler
            createGltf2AnimationSampler(
              inputAccessorIdx,
              outputAccessorIdx,
              rnChannel,
              animation
            );
          }
        }
      }
    }
  }
  json.extras.bufferViewByteLengthAccumulatedArray.push(
    sumOfBufferViewByteLengthAccumulated
  );
}

function calcAccessorIdxToSet(
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
) {
  // let accessorIdxToSet = -1;
  const accessorIdx = existingUniqueRnAccessors.findIndex(accessor => {
    return accessor.isSame(rnAccessor);
  });
  // if (accessorIdx !== -1) {
  //   // if the Rhodonite RnAccessor is in existingUniqueAccessors already,
  //   //   reuse the corresponding Gltf2Accessor
  //   accessorIdxToSet = accessorIdx;
  // } else {
  //   // if not, create a Gltf2Accessor and put it into existingUniqueAccessors
  //   // if the accessor is new one...
  //   accessorIdxToSet = existingUniqueRnAccessors.length;
  // }
  return accessorIdx;
}

function createOrReuseGltf2BufferViewForVertexAttributeBuffer(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  rnAccessor: Accessor
) {
  const bufferViewIdx = findBufferViewIdx(
    existingUniqueRnBufferViews,
    rnBufferView
  );
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(
      existingUniqueRnBuffers,
      rnBufferView.buffer
    );
    const gltf2BufferView: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    gltf2BufferView.target = GL_ARRAY_BUFFER;

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] =
      accumulateBufferViewByteLength(
        json.extras.bufferViewByteLengthAccumulatedArray,
        bufferIdxToSet,
        gltf2BufferView
      );

    if (Is.exist(gltf2BufferView.target)) {
      gltf2BufferView.byteStride = rnAccessor.elementSizeInBytes;
    }
    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView);
    return gltf2BufferView;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
  const {fixedBufferViewByteLength, fixedBufferViewByteOffset} =
    calcBufferViewByteLengthAndByteOffset({
      accessorByteOffset: rnAccessor.byteOffsetInBufferView,
      accessorCount: rnAccessor.elementCount,
      bufferViewByteOffset: gltf2BufferView.byteOffset,
      bufferViewByteStride: gltf2BufferView.byteStride!,
      sizeOfComponent: rnAccessor.componentType.getSizeInBytes(),
      numberOfComponents: rnAccessor.compositionType.getNumberOfComponents(),
    });
  gltf2BufferView.byteLength = fixedBufferViewByteLength;
  // gltf2BufferView.byteOffset = fixedBufferViewByteOffset;
  return gltf2BufferView;
}

function findBufferViewIdx(
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView
) {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex(bufferView =>
    bufferView.isSame(rnBufferView)
  );
  return bufferViewIdx;
}

function calcBufferIdxToSet(
  existingUniqueRnBuffers: Buffer[],
  rnBuffer: Buffer
) {
  if (existingUniqueRnBuffers.length === 0) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  const bufferIdx = existingUniqueRnBuffers.findIndex(buffer =>
    buffer.isSame(rnBuffer)
  );
  const bufferIdxToSet =
    bufferIdx === -1 ? existingUniqueRnBuffers.length : bufferIdx;
  if (bufferIdx === -1) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  return bufferIdxToSet;
}

function accumulateBufferViewByteLength(
  bufferViewByteLengthAccumulatedArray: number[],
  bufferIdxToSet: number,
  gltf2BufferView: Gltf2BufferViewEx
) {
  const bufferViewLengthAligned = Is.exist(
    bufferViewByteLengthAccumulatedArray[bufferIdxToSet]
  )
    ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] +
      DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4)
    : DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4);

  return bufferViewLengthAligned;
}

function convertToGltfAnimationPathName(
  path: AnimationPathName
): Gltf2AnimationPathName {
  switch (path) {
    case 'translate':
      return 'translation';
    case 'quaternion':
      return 'rotation';
    case 'scale':
      return 'scale';
    case 'weights':
      return 'weights';
    default:
      throw new Error('Invalid Path Name');
  }
}

function createGltf2AnimationChannel(
  channel: AnimationChannel,
  samplerIdx: Index,
  animation: Gltf2Animation,
  entityIdx: Index
) {
  const pathName = channel.target.pathName as AnimationPathName;

  const channelJson: Gltf2AnimationChannel = {
    sampler: samplerIdx++,
    target: {
      path: convertToGltfAnimationPathName(pathName),
      node: entityIdx,
    },
  };
  animation.channels.push(channelJson);
  return samplerIdx;
}

function createGltf2AnimationSampler(
  inputAccessorIdx: number,
  outputAccessorIdx: number,
  channel: AnimationChannel,
  animation: Gltf2Animation
) {
  const samplerJson: Gltf2AnimationSampler = {
    input: inputAccessorIdx,
    output: outputAccessorIdx,
    interpolation: channel.sampler.interpolationMethod.GltfString,
  };
  animation.samplers.push(samplerJson);
}

function createGltf2BufferViewAndGltf2AccessorForInput(
  json: Gltf2Ex,
  rnChannel: AnimationChannel,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
) {
  const componentType = ComponentType.fromTypedArray(rnChannel.sampler.input);
  const accessorCount = rnChannel.sampler.input.length;
  // create a Gltf2BufferView
  const gltf2BufferView: Gltf2BufferViewEx = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: ComponentType.Float.getSizeInBytes(),
    componentType,
    compositionType: CompositionType.Scalar,
    uint8Array: new Uint8Array(rnChannel.sampler.input.buffer),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType: CompositionType.Scalar,
    min: [rnChannel.sampler.input[0]],
    max: [rnChannel.sampler.input[rnChannel.sampler.input.length - 1]],
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(
    bufferViewByteLengthAccumulated,
    gltf2BufferView
  );
  const inputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    inputAccessorIdx,
    inputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

function createGltf2BufferViewAndGltf2AccessorForOutput(
  json: Gltf2Ex,
  rnChannel: AnimationChannel,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
) {
  const componentType = ComponentType.fromTypedArray(rnChannel.sampler.output);
  const accessorCount =
    rnChannel.sampler.output.length / rnChannel.sampler.outputComponentN;
  // create a Gltf2BufferView
  const gltf2BufferView = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride:
      componentType.getSizeInBytes() * rnChannel.sampler.outputComponentN,
    componentType,
    compositionType: CompositionType.toGltf2AnimationAccessorCompositionType(
      rnChannel.sampler.outputComponentN
    ),
    uint8Array: new Uint8Array(rnChannel.sampler.output.buffer),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType: CompositionType.toGltf2AnimationAccessorCompositionType(
      rnChannel.sampler.outputComponentN
    ),
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(
    bufferViewByteLengthAccumulated,
    gltf2BufferView
  );
  const outputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    outputAccessorIdx,
    outputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

type BufferViewByteLengthDesc = {
  accessorByteOffset: Byte;
  accessorCount: Count;
  bufferViewByteStride: Byte;
  bufferViewByteOffset: Byte;
  sizeOfComponent: Byte;
  numberOfComponents: number;
};

function alignBufferViewByteLength(
  bufferViewByteLengthAccumulated: number,
  bufferView: Gltf2BufferViewEx
) {
  bufferViewByteLengthAccumulated =
    bufferView.byteLength + DataUtil.calcPaddingBytes(bufferView.byteLength, 4);
  return bufferViewByteLengthAccumulated;
}

/**
 * calc BufferView byte length
 *
 *
 *  See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 * @param accessorByteOffset
 * @param accessorCount
 * @param effectiveByteStride
 * @param sizeOfComponent
 * @param numberOfComponents
 * @returns
 */
function calcBufferViewByteLengthAndByteOffset({
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  bufferViewByteOffset,
  sizeOfComponent,
  numberOfComponents,
}: BufferViewByteLengthDesc): {
  fixedBufferViewByteLength: Byte;
  fixedBufferViewByteOffset: Byte;
} {
  // When byteStride of the referenced bufferView is not defined,
  // it means that accessor elements are tightly packed,
  //   i.e., effective stride equals the size of the element.
  const effectiveByteStride =
    bufferViewByteStride === 0
      ? sizeOfComponent * numberOfComponents
      : bufferViewByteStride;

  // When byteStride is defined,
  //   it MUST be a multiple of the size of the accessor’s component type.
  if (bufferViewByteStride % sizeOfComponent !== 0) {
    throw Error(
      'glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor’s component type.'
    );
  }

  // MUST be 4 bytes aligned
  const effectiveByteStrideAligned =
    alignBufferViewByteStrideTo4Bytes(effectiveByteStride);
  // MUST be 4 bytes aligned
  const alignedAccessorByteOffset =
    alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  // calc BufferView byteLength as following,
  //
  //  Each accessor MUST fit its bufferView, i.e.,
  //  ```
  //  accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
  //  ```
  //   MUST be less than or equal to bufferView.length.
  const bufferViewByteLength =
    alignedAccessorByteOffset +
    effectiveByteStrideAligned * (accessorCount - 1) +
    sizeOfComponent * numberOfComponents;

  // The offset of an accessor into a bufferView (i.e., accessor.byteOffset)
  //   and the offset of an accessor into a buffer (i.e., accessor.byteOffset + bufferView.byteOffset)
  //     MUST be a multiple of the size of the accessor’s component type.
  const valByteLength = sizeOfComponent * numberOfComponents;
  const sumByteOffset = alignedAccessorByteOffset + bufferViewByteOffset;
  const paddingByte = valByteLength - (sumByteOffset % valByteLength);
  const fixedBufferViewByteOffset = bufferViewByteOffset + paddingByte;

  // MUST be 4 bytes aligned
  const alignedBufferViewByteOffset = alignAccessorByteOffsetTo4Bytes(
    fixedBufferViewByteOffset
  );

  const fixedBufferViewByteLength = bufferViewByteLength + paddingByte;
  return {
    fixedBufferViewByteLength,
    fixedBufferViewByteOffset: alignedBufferViewByteOffset,
  };
}

/**
 * fix the passed byteOffset to 4 bytes aligned
 * For performance and compatibility reasons, each element of a vertex attribute
 *   MUST be aligned to 4-byte boundaries inside a bufferView
 *     (i.e., accessor.byteOffset and bufferView.byteStride MUST be multiples of 4).
 *
 *  See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 * @param byteOffset ByteOffset of Accessor, which is not algined yet
 * @returns algined byteOffset
 */
function alignAccessorByteOffsetTo4Bytes(byteOffset: Byte): Byte {
  const alignSize = 4;
  if (byteOffset % 4 === 0) {
    return byteOffset;
  }
  return byteOffset + (alignSize - (byteOffset % alignSize));
}

/**
 * fix the passed byteOffset to 4 bytes aligned
 * For performance and compatibility reasons, each element of a vertex attribute
 *   MUST be aligned to 4-byte boundaries inside a bufferView
 *     (i.e., accessor.byteOffset and bufferView.byteStride MUST be multiples of 4).
 *
 *  See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 * @param byteOffset ByteOffset of Accessor, which is not algined yet
 * @returns algined byteOffset
 */
function alignBufferViewByteStrideTo4Bytes(byteStride: Byte): Byte {
  const alignSize = 4;
  if (byteStride % 4 === 0) {
    return byteStride;
  }
  const byteStrideAlgined = byteStride + (alignSize - (byteStride % alignSize));

  return byteStrideAlgined;
}

async function handleTextureImage(
  json: Gltf2Ex,
  bufferIdx: Index,
  blob: Blob,
  option: Gltf2ExporterArguments,
  glTF2ImageEx: Gltf2Image,
  resolve: (v?: ArrayBuffer) => void,
  rejected: (reason?: DOMException) => void
) {
  if (option.type === GLTF2_EXPORT_GLB) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const gltf2BufferView = createAndAddGltf2BufferView(
        json,
        bufferIdx,
        new Uint8ClampedArray(arrayBuffer) as unknown as Uint8Array
      );
      glTF2ImageEx.bufferView = json.bufferViews.indexOf(gltf2BufferView);
      glTF2ImageEx.mimeType = 'image/png';
      delete glTF2ImageEx.uri;
      resolve();
    });
    reader.addEventListener('error', () => {
      rejected(reader.error as DOMException);
    });
    reader.readAsArrayBuffer(blob);
  } else {
    setTimeout(() => {
      const a = document.createElement('a');
      const e = new MouseEvent('click');
      a.href = URL.createObjectURL(blob!);
      a.download = glTF2ImageEx.uri!;
      a.dispatchEvent(e);
      URL.revokeObjectURL(a.href);
    }, Math.random() * 5000);
    resolve();
  }
}

///
/// BufferView and Accessor Creaters
///

interface Gltf2AccessorDesc {
  bufferViewIdx: Index;
  accessorByteOffset: Byte;
  componentType: ComponentTypeEnum;
  count: Count;
  compositionType: CompositionTypeEnum;
  min?: Array1to4<number>;
  max?: Array1to4<number>;
}

interface Gltf2BufferViewDesc {
  bufferIdx: Index;
  bufferViewByteOffset: Byte;
  accessorByteOffset: Byte;
  accessorCount: Count;
  bufferViewByteStride: Byte;
  componentType: ComponentTypeEnum;
  compositionType: CompositionTypeEnum;
  uint8Array: Uint8Array;
}

export function createAndAddGltf2BufferView(
  json: Gltf2Ex,
  bufferIdx: Index,
  uint8Array: Uint8Array
): Gltf2BufferViewEx {
  const bufferViewByteLengthAccumulated =
    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx];
  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: uint8Array.byteLength,
    byteOffset: bufferViewByteLengthAccumulated,
    extras: {
      uint8Array,
    },
  };

  const nextBufferViewBytesLengthAccumulated =
    DataUtil.addPaddingBytes(gltfBufferViewEx.byteLength, 4) +
    bufferViewByteLengthAccumulated;

  json.bufferViews.push(gltfBufferViewEx);
  json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx] =
    nextBufferViewBytesLengthAccumulated;
  return gltfBufferViewEx;
}

function createGltf2BufferViewForAnimation({
  bufferIdx,
  bufferViewByteOffset,
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  componentType,
  compositionType,
  uint8Array,
}: Gltf2BufferViewDesc): Gltf2BufferViewEx {
  const alignedAccessorByteOffset =
    alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const {fixedBufferViewByteLength, fixedBufferViewByteOffset} =
    calcBufferViewByteLengthAndByteOffset({
      accessorByteOffset: alignedAccessorByteOffset,
      accessorCount: accessorCount,
      bufferViewByteStride,
      bufferViewByteOffset,
      sizeOfComponent: componentType.getSizeInBytes(),
      numberOfComponents: compositionType.getNumberOfComponents(),
    });

  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: fixedBufferViewByteLength,
    byteOffset: fixedBufferViewByteOffset,
    byteStride: bufferViewByteStride,
    extras: {
      uint8Array,
    },
  };

  return gltfBufferViewEx;
}

function createGltf2AccessorForAnimation({
  bufferViewIdx,
  accessorByteOffset,
  componentType,
  count,
  compositionType,
  min,
  max,
}: Gltf2AccessorDesc): Gltf2AccessorEx {
  const alignedAccessorByteOffset =
    alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  const gltf2AccessorEx = {
    bufferView: bufferViewIdx,
    byteOffset: alignedAccessorByteOffset,
    componentType: ComponentType.toGltf2AccessorComponentType(componentType),
    count,
    type: compositionType.str as Gltf2AccessorCompositionTypeString,
    min,
    max,
    extras: {},
  };
  return gltf2AccessorEx;
}

function createOrReuseGltf2BufferView(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  target?: number
) {
  const bufferViewIdx = findBufferViewIdx(
    existingUniqueRnBufferViews,
    rnBufferView
  );
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(
      existingUniqueRnBuffers,
      rnBufferView.buffer
    );
    const gltf2BufferView: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    if (Is.exist(target)) {
      gltf2BufferView.target = target;
    }

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] =
      accumulateBufferViewByteLength(
        json.extras.bufferViewByteLengthAccumulatedArray,
        bufferIdxToSet,
        gltf2BufferView
      );
    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView);
    return gltf2BufferView;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
  return gltf2BufferView;
}

function createOrReuseGltf2Accessor(
  json: Gltf2Ex,
  bufferViewIdxToSet: Index,
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
) {
  const accessorIdx = calcAccessorIdxToSet(
    existingUniqueRnAccessors,
    rnAccessor
  );
  if (accessorIdx === -1) {
    // create a Gltf2Accessor
    rnAccessor.calcMinMax();
    const gltf2Accessor: Gltf2AccessorEx = {
      bufferView: bufferViewIdxToSet,
      byteOffset: rnAccessor.byteOffsetInBufferView,
      componentType: ComponentType.toGltf2AccessorComponentType(
        rnAccessor.componentType as Gltf2AccessorComponentType
      ),
      count: rnAccessor.elementCount,
      type: CompositionType.toGltf2AccessorCompositionTypeString(
        rnAccessor.compositionType.getNumberOfComponents() as VectorAndSquareMatrixComponentN
      ),
      extras: {
        uint8Array: undefined,
      },
    };
    if (rnAccessor.compositionType.getNumberOfComponents() <= 4) {
      gltf2Accessor.max = rnAccessor.max;
      gltf2Accessor.min = rnAccessor.min;
    }
    existingUniqueRnAccessors.push(rnAccessor);
    json.accessors.push(gltf2Accessor);
    return gltf2Accessor;
  }
  const gltf2Accessor = json.accessors[accessorIdx];
  return gltf2Accessor;
}
