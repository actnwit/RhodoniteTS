import EntityRepository from '../core/EntityRepository';
import Entity from '../core/Entity';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import AbstractTexture from '../textures/AbstractTexture';
import {Is} from '../misc/Is';
import {
  Gltf2,
  Gltf2Accessor,
  Gltf2AccessorCompositionTypeString,
  Gltf2Animation,
  Gltf2AnimationChannel,
  Gltf2AnimationSampler,
  Gltf2BufferView,
  Gltf2BufferViewEx,
  Gltf2Mesh,
  Gltf2Primitive,
  Gltf2AnimationPathName,
  Gltf2Skin,
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
  VectorComponentN,
} from '../../types/CommonTypes';
import Buffer from '../memory/Buffer';
import {
  GL_ARRAY_BUFFER,
  GL_ELEMENT_ARRAY_BUFFER,
} from '../../types/WebGLConstants';
import {AnimationChannel, AnimationPathName} from '../../types/AnimationTypes';
import {CompositionType} from '../definitions/CompositionType';
import {ComponentTypeEnum, CompositionTypeEnum} from '../..';
const _VERSION = require('./../../../VERSION-FILE').default;

interface Gltf2ExporterArguments {
  entities: Entity[]; // The target entities. This exporter includes their descendants for the output.
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
  static export(filename: string, option?: Gltf2ExporterArguments) {
    const entities = this.__collectEntities(option);

    const {json, fileName}: {json: Gltf2Ex; fileName: string} =
      this.__createJsonBase(filename);

    const bufferViewByteLengthAccumulatedArray: Byte[] = [];

    this.__createBufferViewsAndAccessors(
      json,
      entities,
      bufferViewByteLengthAccumulatedArray
    );

    this.__createNodes(json, entities);

    this.__createMaterials(json, entities);

    const arraybuffer = this.__createBinary(
      json,
      bufferViewByteLengthAccumulatedArray
    );

    this.__deleteEmptyArrays(json);

    this.__download(json, fileName, arraybuffer);
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
  }

  /**
   * collect target entities. This exporter includes their descendants for the output.
   * @param option an option config
   * @returns target entities
   */
  private static __collectEntities(option: Gltf2ExporterArguments | undefined) {
    let entities = Gltf2Exporter.__entityRepository._getEntities();
    if (Is.exist(option) && option.entities.length > 0) {
      const collectChildren = (entity: Entity): Entity[] => {
        const sg = entity.getSceneGraph();
        let array = [entity];
        for (let i = 0; i < sg.children.length; i++) {
          const child = sg.children[i];
          array = array.concat(collectChildren(child.entity));
        }
        return array;
      };
      entities = option.entities.flatMap(e => collectChildren(e));
    }
    return entities;
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
      extras: {
        rnSkins: [],
      }
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
    entities: Entity[],
    bufferViewByteLengthAccumulatedArray: Byte[]
  ) {
    const existingUniqueRnBuffers: Buffer[] = [];
    const existingUniqueRnBufferViews: BufferView[] = [];
    const existingUniqueRnAccessors: Accessor[] = [];

    createBufferViewsAndAccessorsOfMesh(
      json,
      entities,
      bufferViewByteLengthAccumulatedArray,
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );

    createBufferViewsAndAccessorsOfAnimation(
      json,
      bufferViewByteLengthAccumulatedArray,
      entities
    );

    this.__createSkins(
      json,
      entities,
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews
    );
  }

  static getNextBufferIdx(bufferViewByteLengthAccumulatedArray: number[]) {
    return bufferViewByteLengthAccumulatedArray.length;
  }

  /**
   * create Gltf2Nodes for the output glTF2 JSON
   * @param json a glTF2 JSON
   * @param entities target entities
   * @param indicesOfGltfMeshes the indices of Gltf2Meshes
   */
  static __createNodes(json: Gltf2Ex, entities: Entity[]) {
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
      const sceneGraphComponent = entity.getSceneGraph();
      const children = sceneGraphComponent.children;
      if (children.length > 0) {
        node.children = [];
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          node.children.push((child.entity as any).gltfNodeIndex);
        }
      }

      // matrix
      const transform = entity.getTransform();
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
      const meshComponent = entity.getMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        node.mesh = meshCount++;
      }

      // skin
      const skinComponent = entity.getSkeletal();
      if (Is.exist(skinComponent)) {
        const entityIdx = json.extras.rnSkins.indexOf(skinComponent.entity);
        if (entityIdx > 0) {
          node.skin = entityIdx;
        }
      }

      // If the entity has no parent, it must be a top level entity in the scene graph.
      if (Is.not.exist(sceneGraphComponent.parent)) {
        scene.nodes!.push(i);
      }
    }
  }

  /**
   * create Gltf2Skins
   * @param json a glTF2 JSON
   * @param entities all target entities
   */
  static __createSkins(
    json: Gltf2Ex,
    entities: Entity[],
    existingUniqueRnBuffers: Buffer[],
    existingUniqueRnBufferViews: BufferView[]
  ) {
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const skeletalComponent = entity.getSkeletal();
      if (Is.not.exist(skeletalComponent)) {
        continue;
      }
      json.extras.rnSkins.push(skeletalComponent.entity);
      const jointSceneComponentsOfTheEntity = skeletalComponent.getJoints();
      const jointIndicesOfTheEntity: Index[] = [];
      entities.forEach((entity, j) => {
        for (const jointSceneComponent of jointSceneComponentsOfTheEntity) {
          if (jointSceneComponent.entity === entity) {
            jointIndicesOfTheEntity.push(j);
          }
        }
      });

      const inverseBindMatAccessor =
        skeletalComponent.getInverseBindMatricesAccessor();
      if (Is.exist(inverseBindMatAccessor)) {
        const bufferIdxToSet = calcBufferIdxToSet(
          existingUniqueRnBuffers,
          inverseBindMatAccessor.bufferView.buffer
        );
        const gltf2BufferView = createGltf2BufferView({
          bufferIdx: bufferIdxToSet,
          bufferViewByteOffset:
            inverseBindMatAccessor.bufferView.byteOffsetInBuffer,
          accessorByteOffset: inverseBindMatAccessor.byteOffsetInBufferView,
          accessorCount: inverseBindMatAccessor.elementCount,
          bufferViewByteStride:
            inverseBindMatAccessor.bufferView.defaultByteStride,
          componentType: inverseBindMatAccessor.componentType,
          compositionType: inverseBindMatAccessor.compositionType,
          uint8Array: inverseBindMatAccessor.getUint8Array(),
        });
        const {bufferViewIdx, bufferViewIdxToSet} = calcBufferViewIdxToSet(
          existingUniqueRnBufferViews,
          inverseBindMatAccessor.bufferView
        );
        const gltf2Accessor = createGltf2Accessor({
          bufferViewIdx: bufferViewIdxToSet,
          accessorByteOffset: inverseBindMatAccessor.byteOffsetInBufferView,
          componentType: inverseBindMatAccessor.componentType,
          compositionType: inverseBindMatAccessor.compositionType,
          count: inverseBindMatAccessor.elementCount,
        });
        json.bufferViews.push(gltf2BufferView);
        json.accessors.push(gltf2Accessor);
        const skeletonSceneComponent = skeletalComponent.topOfJointsHierarchy;
        const bindShapeMatrix = skeletalComponent._bindShapeMatrix;
        let skeletalIdx = -1;
        if (Is.exist(skeletonSceneComponent)) {
          const skeletalEntity = skeletalComponent.entity;
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
  }

  /**
   * create Gltf2Materials and set them to Gltf2Primitives for the output glTF2 JSON
   * @param json a glTF2 JSON
   * @param entities all target entities
   */
  static __createMaterials(json: Gltf2, entities: Entity[]) {
    let countMesh = 0;
    let countMaterial = 0;
    let countTexture = 0;
    let countImage = 0;
    json.materials = [];
    json.textures = [];
    json.samplers = [];
    json.images = [];
    json.samplers[0] = {
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497,
      wrapT: 10497,
    };

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.getMesh();
      if (meshComponent && meshComponent.mesh) {
        const mesh = json.meshes![countMesh++];
        const primitiveCount = meshComponent.mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveCount; j++) {
          const rnPrimitive = meshComponent.mesh.getPrimitiveAt(j);
          const primitive = mesh.primitives[j];
          const rnMaterial = rnPrimitive.material!;

          const material: Gltf2MaterialEx = {
            pbrMetallicRoughness: {},
          };

          let colorParam;
          let metallic = 1.0;
          let roughness = 1.0;
          if (rnMaterial != null) {
            colorParam = rnMaterial.getParameter(
              ShaderSemantics.BaseColorFactor
            );
            if (colorParam == null) {
              colorParam = rnMaterial.getParameter(
                ShaderSemantics.DiffuseColorFactor
              );
            } else {
              metallic = rnMaterial.getParameter(
                ShaderSemantics.MetallicRoughnessFactor
              ).x;
              roughness = rnMaterial.getParameter(
                ShaderSemantics.MetallicRoughnessFactor
              ).y;
            }
          }

          if (colorParam) {
            material.pbrMetallicRoughness.baseColorFactor =
              Array.prototype.slice.call(colorParam._v);
          }
          material.pbrMetallicRoughness.metallicFactor = metallic;
          material.pbrMetallicRoughness.roughnessFactor = roughness;

          if (rnMaterial) {
            material.alphaMode = rnMaterial.alphaMode.str;

            const existedImages: string[] = [];

            const processTexture = (rnTexture: AbstractTexture) => {
              if (rnTexture && rnTexture.width > 1 && rnTexture.height > 1) {
                let imageIndex = countImage;
                let match = false;
                for (let k = 0; k < json.images!.length; k++) {
                  const image = json.images![k];
                  if (image.uri === rnTexture.name) {
                    imageIndex = k;
                    match = true;
                  }
                }
                if (!match) {
                  const imageJson = {
                    uri: rnTexture.name,
                  };

                  if (existedImages.indexOf(rnTexture.name) !== -1) {
                    imageJson.uri += '_' + rnTexture.textureUID;
                  }

                  existedImages.push(imageJson.uri);

                  if (Is.not.exist(imageJson.uri.match(/\.(png|jpg|jpeg)/))) {
                    imageJson.uri += '.png';
                  }
                  const htmlCanvasElement = rnTexture.htmlCanvasElement;
                  if (htmlCanvasElement) {
                    htmlCanvasElement.toBlob((blob: Blob | null) => {
                      setTimeout(() => {
                        const a = document.createElement('a');
                        const e = new MouseEvent('click');
                        a.href = URL.createObjectURL(blob!);
                        a.download = imageJson.uri;
                        a.dispatchEvent(e);
                      }, Math.random() * 10000);
                    });
                  }
                  json.images![countImage++] = imageJson;
                }

                json.textures![countTexture] = {
                  sampler: 0,
                  source: imageIndex,
                };

                return countTexture++;
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

          json.materials.push(material);
          primitive.material = countMaterial++;
        }
      }
    }
  }

  /**
   * create the arraybuffer of the glTF2 .bin file and write all accessors data to the arraybuffer
   * @param json a glTF2 JSON
   * @returns A arraybuffer
   */
  private static __createBinary(
    json: Gltf2,
    bufferViewByteLengthAccumulatedArray: Byte[]
  ) {
    // write all data of accessors to the DataView (total data area)
    if (Is.undefined(json.accessors) || Is.undefined(json.bufferViews)) {
      return new ArrayBuffer(0);
    }

    // calc total sum of BufferViews in multiple Buffers
    const byteLengthOfUniteBuffer = bufferViewByteLengthAccumulatedArray.reduce(
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
      const uint8ArrayOfBufferView = bufferView.extras!.uint8Array;
      delete bufferView.extras;

      // const bufferIdx = bufferView.buffer!;
      // const byteOffsetOfTheBuffer =
      //   bufferIdx === 0
      //     ? 0
      //     : bufferViewByteLengthAccumulatedArray[bufferIdx - 1];

      const distByteOffset = lastCopiedByteLengthOfBufferView;
      const copyByteLength =
        uint8ArrayOfBufferView.byteLength +
        DataUtil.calcPaddingBytes(uint8ArrayOfBufferView.byteLength, 4);
      DataUtil.copyArrayBufferAs4Bytes({
        src: uint8ArrayOfBufferView.buffer,
        dist: arrayBuffer,
        srcByteOffset: uint8ArrayOfBufferView.byteOffset,
        copyByteLength: copyByteLength,
        distByteOffset,
      });
      lastCopiedByteLengthOfBufferView += copyByteLength;
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
  static __download(json: Gltf2, filename: string, arraybuffer: ArrayBuffer) {
    {
      const a = document.createElement('a');

      a.download = filename + '.gltf';
      const str = JSON.stringify(json, null, 2);
      a.href = 'data:application/octet-stream,' + encodeURIComponent(str);

      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
    {
      const a = document.createElement('a');
      const blob = new Blob([arraybuffer], {type: 'octet/stream'}),
        url = URL.createObjectURL(blob);
      a.download = filename + '.bin';
      a.href = url;
      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
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
function createBufferViewsAndAccessorsOfMesh(
  json: Gltf2Ex,
  entities: Entity[],
  bufferViewByteLengthAccumulatedArray: Byte[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const meshComponent = entity.getMesh();
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
          const bufferViewIdxToSet = createOrReuseGltf2BufferView(
            json.bufferViews,
            bufferViewByteLengthAccumulatedArray,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            GL_ELEMENT_ARRAY_BUFFER
          );

          const accessorIdxToSet = createOrReuseGltf2Accessor(
            json.accessors,
            bufferViewIdxToSet,
            existingUniqueRnAccessors,
            rnIndicesAccessor
          );
          primitive.indices = accessorIdxToSet;
        }

        // Vertex Attributes
        // For each attribute accessor
        const attributeAccessors = rnPrimitive.attributeAccessors;
        for (let j = 0; j < attributeAccessors.length; j++) {
          const rnAttributeAccessor = attributeAccessors[j];
          // create a Gltf2BufferView
          const rnBufferView = rnAttributeAccessor.bufferView;
          const bufferViewIdxToSet = createOrReuseGltf2BufferView(
            json.bufferViews,
            bufferViewByteLengthAccumulatedArray,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            GL_ARRAY_BUFFER
          );

          const accessorIdxToSet = createOrReuseGltf2Accessor(
            json.accessors,
            bufferViewIdxToSet,
            existingUniqueRnAccessors,
            rnAttributeAccessor
          );
          const attributeJoinedString = rnPrimitive.attributeSemantics[j];
          if (Is.exist(attributeJoinedString)) {
            const attribute = attributeJoinedString.split('.')[0];
            primitive.attributes[attribute] = accessorIdxToSet;
          }
        }
        mesh.primitives[j] = primitive;
      }
      json.meshes!.push(mesh);
    }
  }
}

function createOrReuseGltf2Accessor(
  accessors: Gltf2Accessor[],
  bufferViewIdxToSet: Index,
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
): Index {
  const {accessorIdx, accessorIdxToSet} = calcAccessorIdxToSet(
    existingUniqueRnAccessors,
    rnAccessor
  );
  if (accessorIdx === -1) {
    // create a Gltf2Accessor
    rnAccessor.calcMinMax();
    const gltfAccessor = {
      bufferView: bufferViewIdxToSet,
      byteOffset: rnAccessor.byteOffsetInBufferView,
      componentType: ComponentType.toGltf2AccessorComponentType(
        rnAccessor.componentType as Gltf2AccessorComponentType
      ),
      count: rnAccessor.elementCount,
      max: rnAccessor.max,
      min: rnAccessor.min,
      type: CompositionType.toGltf2AccessorCompositionTypeString(
        rnAccessor.compositionType.getNumberOfComponents() as VectorComponentN
      ),
    };
    accessors[accessorIdxToSet] = gltfAccessor;
    existingUniqueRnAccessors.push(rnAccessor);
  }

  return accessorIdxToSet;
}

function calcAccessorIdxToSet(
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
) {
  let accessorIdxToSet = -1;
  const accessorIdx = existingUniqueRnAccessors.findIndex(accessor => {
    return accessor.isSame(rnAccessor);
  });
  if (accessorIdx !== -1) {
    // if the Rhodonite RnAccessor is in existingUniqueAccessors already,
    //   reuse the corresponding Gltf2Accessor
    accessorIdxToSet = accessorIdx;
  } else {
    // if not, create a Gltf2Accessor and put it into existingUniqueAccessors
    // if the accessor is new one...
    accessorIdxToSet = existingUniqueRnAccessors.length;
  }
  return {accessorIdx, accessorIdxToSet};
}

function createOrReuseGltf2BufferView(
  bufferViews: Gltf2BufferView[],
  bufferViewByteLengthAccumulatedArray: Byte[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  target: number
): Index {
  const {bufferViewIdx, bufferViewIdxToSet} = calcBufferViewIdxToSet(
    existingUniqueRnBufferViews,
    rnBufferView
  );
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(
      existingUniqueRnBuffers,
      rnBufferView.buffer
    );
    const bufferViewJson: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      target,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    if (rnBufferView.defaultByteStride !== 0) {
      bufferViewJson.byteStride = rnBufferView.defaultByteStride;
    }

    accmulateBufferViewByteLength(
      bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      bufferViewJson
    );
    existingUniqueRnBufferViews.push(rnBufferView);
    bufferViews[bufferViewIdxToSet] = bufferViewJson;
  }

  return bufferViewIdxToSet;
}

function calcBufferViewIdxToSet(
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView
) {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex(bufferView =>
    bufferView.isSame(rnBufferView)
  );
  let bufferViewIdxToSet = -1;
  if (bufferViewIdx !== -1) {
    // if the Rhodonite BufferView is in existingUniqueBufferViews already,
    //   reuse the corresponding Gltf2BufferView
    bufferViewIdxToSet = bufferViewIdx;
  } else {
    // if not, create a Gltf2BufferView and put it into existingUniqueBufferViews
    bufferViewIdxToSet = existingUniqueRnBufferViews.length;
  }
  return {bufferViewIdx, bufferViewIdxToSet};
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

function accmulateBufferViewByteLength(
  bufferViewByteLengthAccumulatedArray: number[],
  bufferIdxToSet: number,
  bufferViewJson: Gltf2BufferViewEx
) {
  bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = Is.exist(
    bufferViewByteLengthAccumulatedArray[bufferIdxToSet]
  )
    ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] +
      bufferViewJson.byteLength
    : bufferViewJson.byteLength;
}

/**
 * create BufferViews and Accessors of animation
 * @param json
 * @param bufferViewByteLengthAccumulatedArray
 * @param entities
 */
function createBufferViewsAndAccessorsOfAnimation(
  json: Gltf2Ex,
  bufferViewByteLengthAccumulatedArray: Byte[],
  entities: Entity[]
): void {
  let sumOfBufferViewByteLengthAccumulated = 0;
  const bufferIdx = Gltf2Exporter.getNextBufferIdx(
    bufferViewByteLengthAccumulatedArray
  );
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const animationComponent = entity.getAnimation();
    if (Is.exist(animationComponent)) {
      const trackNames = animationComponent.getAnimationTrackNames();
      for (const trackName of trackNames) {
        // AnimationTrack (Gltf2Animation)
        let samplerIdx = 0;
        const animation: Gltf2Animation = {
          channels: [],
          samplers: [],
        };
        json.animations.push(animation);
        // Rhodonite AnimationTrack is corresponding to Gltf2Animation
        const rnAnimationTrack =
          animationComponent.getAnimationChannelsOfTrack(trackName);
        if (Is.exist(rnAnimationTrack)) {
          for (const rnChannel of rnAnimationTrack.values()) {
            // create and register Gltf2BufferView and Gltf2Accessor
            //   and set Input animation data as Uint8Array to the Gltf2Accessor
            const {inputAccessorIdx, inputBufferViewByteLengthAccumulated} =
              createGltf2BufferViewAndGltf2AccessorForInput(
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
    bufferViewByteLengthAccumulatedArray.push(
      sumOfBufferViewByteLengthAccumulated
    );
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

  function createGltf2BufferViewAndGltf2AccessorForInput(
    rnChannel: AnimationChannel,
    bufferIdx: Index,
    bufferViewByteLengthAccumulated: Byte
  ) {
    const componentType = ComponentType.fromTypedArray(rnChannel.sampler.input);
    // create a Gltf2Accessor
    const accessorJson: Gltf2AccessorEx = createGltf2Accessor({
      bufferViewIdx: json.bufferViews.length,
      accessorByteOffset: 0,
      componentType,
      count: rnChannel.sampler.input.length,
      compositionType: CompositionType.Scalar,
      min: [rnChannel.sampler.input[0]],
      max: [rnChannel.sampler.input[rnChannel.sampler.input.length - 1]],
    });

    // create a Gltf2BufferView
    const bufferView: Gltf2BufferViewEx = createGltf2BufferView({
      bufferIdx,
      bufferViewByteOffset: bufferViewByteLengthAccumulated,
      accessorByteOffset: accessorJson.byteOffset!,
      accessorCount: accessorJson.count,
      bufferViewByteStride: ComponentType.Float.getSizeInBytes(),
      componentType,
      compositionType: CompositionType.Scalar,
      uint8Array: new Uint8Array(rnChannel.sampler.input.buffer),
    });

    // register
    json.bufferViews.push(bufferView);
    json.accessors.push(accessorJson);
    bufferViewByteLengthAccumulated +=
      bufferView.byteLength +
      DataUtil.calcPaddingBytes(bufferView.byteLength, 4);
    const inputAccessorIdx = json.accessors.length - 1;
    return {
      inputAccessorIdx,
      inputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
    };
  }

  function createGltf2BufferViewAndGltf2AccessorForOutput(
    rnChannel: AnimationChannel,
    bufferIdx: Index,
    bufferViewByteLengthAccumulated: Byte
  ) {
    const componentType = ComponentType.fromTypedArray(rnChannel.sampler.input);
    // create a Gltf2Accessor
    const accessorJson: Gltf2AccessorEx = createGltf2Accessor({
      bufferViewIdx: json.bufferViews.length,
      accessorByteOffset: 0,
      componentType,
      count:
        rnChannel.sampler.output.length / rnChannel.sampler.outputComponentN,
      compositionType: CompositionType.toGltf2AnimationAccessorCompositionType(
        rnChannel.sampler.outputComponentN
      ),
    });

    // create a Gltf2BufferView
    const bufferView = createGltf2BufferView({
      bufferIdx,
      bufferViewByteOffset: bufferViewByteLengthAccumulated,
      accessorByteOffset: accessorJson.byteOffset!,
      accessorCount: accessorJson.count,
      bufferViewByteStride:
        componentType.getSizeInBytes() * rnChannel.sampler.outputComponentN,
      componentType,
      compositionType: CompositionType.toGltf2AnimationAccessorCompositionType(
        rnChannel.sampler.outputComponentN
      ),
      uint8Array: new Uint8Array(rnChannel.sampler.output.buffer),
    });

    // register
    json.bufferViews.push(bufferView);
    json.accessors.push(accessorJson);
    bufferViewByteLengthAccumulated += bufferView.byteLength;
    // bufferView.byteLength +
    // DataUtil.calcPaddingBytes(bufferView.byteLength, 4);
    const outputAccessorIdx = json.accessors.length - 1;
    return {
      outputAccessorIdx,
      outputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
    };
  }
}

type BufferViewByteLengthDesc = {
  accessorByteOffset: Byte;
  accessorCount: Count;
  bufferViewByteStride: Byte;
  bufferViewByteOffset: Byte;
  sizeOfComponent: Byte;
  numberOfComponents: number;
};

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

function createGltf2BufferView({
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

function createGltf2Accessor({
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
