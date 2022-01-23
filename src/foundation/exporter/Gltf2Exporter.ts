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
  PathType,
} from '../../types/glTF2';
import {
  ComponentType,
  Gltf2AccessorComponentType,
} from '../definitions/ComponentType';
import {Gltf2AccessorEx, Gltf2Ex} from '../../types/glTF2ForOutput';
import BufferView from '../memory/BufferView';
import DataUtil from '../misc/DataUtil';
import Accessor from '../memory/Accessor';
import {Byte, Count, Index, VectorComponentN} from '../../types/CommonTypes';
import Buffer from '../memory/Buffer';
import {
  GL_ARRAY_BUFFER,
  GL_ELEMENT_ARRAY_BUFFER,
} from '../../types/WebGLConstants';
import {AnimationChannel} from '../../types/AnimationTypes';
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

    this.__download(json, fileName, arraybuffer);
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
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [1.0, 1.0, 1.0, 1.0],
          },
        },
      ],
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

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      createBufferViewsAndAccessorsOfMesh(
        entity,
        json,
        bufferViewByteLengthAccumulatedArray,
        existingUniqueRnBuffers,
        existingUniqueRnBufferViews,
        existingUniqueRnAccessors
      );
    }

    const bufferIdx = bufferViewByteLengthAccumulatedArray.length;
    const sumOfAnimationBufferViewByteLength =
      createBufferViewsAndAccessorsOfAnimation(json, bufferIdx, entities);
    bufferViewByteLengthAccumulatedArray.push(
      sumOfAnimationBufferViewByteLength
    );
  }

  /**
   * create Gltf2Nodes for the output glTF2 JSON
   * @param json a glTF2 JSON
   * @param entities target entities
   * @param indicesOfGltfMeshes the indices of Gltf2Meshes
   */
  static __createNodes(json: Gltf2, entities: Entity[]) {
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
      node.children = [];
      const sceneGraphComponent = entity.getSceneGraph();
      const children = sceneGraphComponent.children;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        node.children.push((child.entity as any).gltfNodeIndex);
      }

      // matrix
      node.matrix = Array.prototype.slice.call(entity.getTransform().matrix._v);

      // mesh
      const meshComponent = entity.getMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        node.mesh = meshCount++;
      }

      // If the entity has no parent, it must be a top level entity in the scene graph.
      if (Is.not.exist(sceneGraphComponent.parent)) {
        scene.nodes!.push(i);
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

          const material: any = {
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
      buffer.byteLength = byteLengthOfUniteBuffer;
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
      DataUtil.copyArrayBufferAs4BytesWithPadding({
        src: uint8ArrayOfBufferView.buffer,
        dist: arrayBuffer,
        srcByteOffset: uint8ArrayOfBufferView.byteOffset,
        copyByteLength: uint8ArrayOfBufferView.byteLength,
        distByteOffset,
      });
      lastCopiedByteLengthOfBufferView += uint8ArrayOfBufferView.byteLength;
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
  entity: Entity,
  json: Gltf2Ex,
  bufferViewByteLengthAccumulatedArray: Byte[],
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
): void {
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
        const bufferViewIdxToSet = createOrReuseBufferView(
          json.bufferViews,
          bufferViewByteLengthAccumulatedArray,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          rnBufferView,
          GL_ELEMENT_ARRAY_BUFFER
        );

        const accessorIdxToSet = createOrReuseAccessor(
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
        const bufferViewIdxToSet = createOrReuseBufferView(
          json.bufferViews,
          bufferViewByteLengthAccumulatedArray,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          rnBufferView,
          GL_ARRAY_BUFFER
        );

        const accessorIdxToSet = createOrReuseAccessor(
          json.accessors,
          bufferViewIdxToSet,
          existingUniqueRnAccessors,
          rnAttributeAccessor
        );
        const attributeEnum = rnPrimitive.attributeSemantics[j];
        if (Is.exist(attributeEnum)) {
          primitive.attributes[attributeEnum.str] = accessorIdxToSet;
        }
      }
      mesh.primitives[j] = primitive;
    }
    json.meshes!.push(mesh);
  }
}

function createOrReuseAccessor(
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
    accessors[accessorIdxToSet] = {
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

function createOrReuseBufferView(
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
      byteStride: rnBufferView.defaultByteStride,
      target,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
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
 * @param entity
 * @param json
 * @param bufferViewByteLengthAccumulated
 * @param bufferViewCount
 * @param accessorCount
 * @returns
 */
function createBufferViewsAndAccessorsOfAnimation(
  json: Gltf2Ex,
  bufferIdx: Index,
  entities: Entity[]
): Byte {
  let bufferViewByteLengthAccumulated = 0;
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
            const inputAccessorIdx =
              createGltf2BufferViewAndGltf2AccessorForInput(
                rnChannel,
                bufferIdx
              );

            // create and register Gltf2BufferView and Gltf2Accessor
            //   and set Output animation data as Uint8Array to the Gltf2Accessor
            const outputAccessorIdx =
              createGltf2BufferViewAndGltf2AccessorForOutput(
                rnChannel,
                bufferIdx
              );

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

  return bufferViewByteLengthAccumulated;

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

  function createGltf2AnimationChannel(
    channel: AnimationChannel,
    samplerIdx: Index,
    animation: Gltf2Animation,
    entityIdx: Index
  ) {
    const pathName = channel.target.pathName as PathType;
    const channelJson: Gltf2AnimationChannel = {
      sampler: samplerIdx++,
      target: {
        path: pathName,
        node: entityIdx,
      },
    };
    animation.channels.push(channelJson);
    return samplerIdx;
  }

  function createGltf2BufferViewAndGltf2AccessorForInput(
    rnChannel: AnimationChannel,
    bufferIdx: Index
  ) {
    // create a Gltf2BufferView
    const bufferView = {
      buffer: bufferIdx,
      byteLength: rnChannel.sampler.input.byteLength,
      byteOffset: bufferViewByteLengthAccumulated,
      byteStride: 0,
      extras: {
        uint8Array: new Uint8Array(rnChannel.sampler.input.buffer),
      },
    };
    json.bufferViews.push(bufferView);
    bufferViewByteLengthAccumulated += bufferView.byteLength;

    // create a Gltf2Accessor
    const componentType = ComponentType.fromTypedArray(rnChannel.sampler.input);
    json.accessors.push({
      bufferView: json.bufferViews.length - 1,
      byteOffset: 0,
      componentType: ComponentType.toGltf2AccessorComponentType(componentType),
      count: rnChannel.sampler.input.length,
      type: 'SCALAR',
      extras: {},
    });
    const inputAccessorIdx = json.accessors.length - 1;
    return inputAccessorIdx;
  }

  function createGltf2BufferViewAndGltf2AccessorForOutput(
    rnChannel: AnimationChannel,
    bufferIdx: Index
  ) {
    const componentType = ComponentType.fromTypedArray(rnChannel.sampler.input);
    // create a Gltf2Accessor
    const accessorJson: Gltf2AccessorEx = createGltf2Accessor({
      bufferViewIdx: json.bufferViews.length,
      byteOffset: 0,
      componentType,
      count:
        rnChannel.sampler.output.length / rnChannel.sampler.outputComponentN,
      compositionType: CompositionType.toGltf2AnimationAccessorCompositionType(
        rnChannel.sampler.outputComponentN
      ),
    });

    // create a Gltf2BufferView
    const bufferViewByteLength = calcBufferViewByteLength({
      accessorByteOffset: accessorJson.byteOffset!,
      accessorCount: accessorJson.count,
      byteStride: 0,
      sizeOfComponent: componentType.getSizeInBytes(),
      numberOfComponents: rnChannel.sampler.outputComponentN,
    });
    const bufferView: Gltf2BufferViewEx = {
      buffer: bufferIdx,
      byteLength: bufferViewByteLength,
      byteOffset: bufferViewByteLengthAccumulated,
      byteStride: 0,
      extras: {
        uint8Array: new Uint8Array(rnChannel.sampler.output.buffer),
      },
    };

    // register
    json.bufferViews.push(bufferView);
    json.accessors.push(accessorJson);
    bufferViewByteLengthAccumulated += bufferView.byteLength;
    const outputAccessorIdx = json.accessors.length - 1;
    return outputAccessorIdx;
  }
}

type BufferViewByteLengthDesc = {
  accessorByteOffset: Byte;
  accessorCount: Count;
  byteStride: Byte;
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
function calcBufferViewByteLength({
  accessorByteOffset,
  accessorCount,
  byteStride,
  sizeOfComponent,
  numberOfComponents,
}: BufferViewByteLengthDesc) {
  // When byteStride of the referenced bufferView is not defined,
  // it means that accessor elements are tightly packed,
  //   i.e., effective stride equals the size of the element.
  const effectiveByteStride =
    byteStride === 0 ? sizeOfComponent * sizeOfComponent : byteStride;

  // When byteStride is defined,
  //   it MUST be a multiple of the size of the accessor’s component type.
  if (byteStride % sizeOfComponent !== 0) {
    throw Error(
      'glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor’s component type.'
    );
  }

  // MUST be 4 bytes aligned
  const effectiveByteStrideAligned =
    alignBufferViewByteStride(effectiveByteStride);

  // calc BufferView byteLength as following,
  //
  //  Each accessor MUST fit its bufferView, i.e.,
  //  ```
  //  accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
  //  ```
  //   MUST be less than or equal to bufferView.length.
  const bufferViewByteLength =
    accessorByteOffset +
    effectiveByteStrideAligned * (accessorCount - 1) +
    sizeOfComponent * numberOfComponents;

  return bufferViewByteLength;
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
function alignAccessorByteOffset(byteOffset: Byte): Byte {
  const alignSize = 4;

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
function alignBufferViewByteStride(byteStride: Byte): Byte {
  const alignSize = 4;
  const byteStrideAlgined = byteStride + (alignSize - (byteStride % alignSize));

  return byteStrideAlgined;
}

interface Gltf2AccessorDesc {
  bufferViewIdx: Index;
  byteOffset: Byte;
  componentType: ComponentTypeEnum;
  count: Count;
  compositionType: CompositionTypeEnum;
}

function createGltf2Accessor({
  bufferViewIdx,
  byteOffset,
  componentType,
  count,
  compositionType,
}: Gltf2AccessorDesc): Gltf2AccessorEx {
  const accessor = {
    bufferView: bufferViewIdx,
    byteOffset: alignAccessorByteOffset(byteOffset),
    componentType: ComponentType.toGltf2AccessorComponentType(componentType),
    count,
    type: compositionType.str as Gltf2AccessorCompositionTypeString,
    extras: {},
  };
  return accessor;
}
