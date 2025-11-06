import type {
  AnimationChannel,
  AnimationPathName,
  AnimationSampler,
  AnimationTrackName,
} from '../../types/AnimationTypes';
import type { Array1to4, Byte, Count, Index, VectorAndSquareMatrixComponentN } from '../../types/CommonTypes';
import { GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER } from '../../types/WebGLConstants';
import {
  type Gltf2,
  type Gltf2AccessorCompositionTypeString,
  type Gltf2Animation,
  type Gltf2AnimationChannel,
  type Gltf2AnimationPathName,
  type Gltf2AnimationSampler,
  type Gltf2AttributeBlendShapes,
  type Gltf2Attributes,
  type Gltf2Camera,
  type Gltf2Image,
  type Gltf2Mesh,
  type Gltf2Primitive,
  type Gltf2Skin,
  type Gltf2Texture,
  type Gltf2TextureSampler,
  isSameGlTF2TextureSampler,
} from '../../types/glTF2';
import type {
  Gltf2AccessorEx,
  Gltf2BufferViewEx,
  Gltf2Ex,
  Gltf2ImageEx,
  Gltf2MaterialEx,
} from '../../types/glTF2ForOutput';
import { VERSION } from '../../version';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { EntityRepository } from '../core/EntityRepository';
import type { Tag } from '../core/RnObject';
import { CameraType, type ComponentTypeEnum, type CompositionTypeEnum, TextureParameter } from '../definitions';
import { ComponentType, type Gltf2AccessorComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import type { VertexAttributeSemanticsJoinedString } from '../definitions/VertexAttribute';
import type { Mesh } from '../geometry/Mesh';
import type { Primitive } from '../geometry/Primitive';
import type { IAnimationEntity, IMeshEntity, ISceneGraphEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import { MathUtil } from '../math/MathUtil';
import { Quaternion } from '../math/Quaternion';
import type { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import type { Accessor } from '../memory/Accessor';
import type { Buffer } from '../memory/Buffer';
import type { BufferView } from '../memory/BufferView';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';
import { createEffekseer } from './Gltf2ExporterEffekseer';
import {
  type BufferViewByteLengthDesc,
  type Gltf2AccessorDesc,
  type Gltf2BufferViewDesc,
  type NumericArrayBufferView,
  SKIN_WEIGHT_DIFF_EPSILON,
  SKIN_WEIGHT_RESIDUAL_TOLERANCE,
  SKIN_WEIGHT_SUM_EPSILON,
  TANGENT_EPSILON,
  type WeightTypedArray,
  accumulateBufferViewByteLength,
  accumulateVector3,
  adjustWeightsForResidual,
  alignAccessorByteOffsetTo4Bytes,
  alignBufferViewByteLength,
  alignBufferViewByteStrideTo4Bytes,
  buildOrthonormalVector,
  calcAccessorIdxToSet,
  calcBufferIdxToSet,
  calcBufferViewByteLengthAndByteOffset,
  clampWeight,
  convertNormalizedWeightsToUnsigned,
  convertToGltfAnimationPathName,
  createAccessorFromWeightsTypedArray,
  createAndAddGltf2BufferView,
  createComputedTangentAccessor,
  createGltf2AccessorForAnimation,
  createGltf2AnimationChannel,
  createGltf2AnimationSampler,
  createGltf2BufferViewAndGltf2AccessorForInput,
  createGltf2BufferViewAndGltf2AccessorForOutput,
  createGltf2BufferViewForAnimation,
  createNormalizedFloatWeights,
  createNormalizedTangentAccessor,
  createOrReuseGltf2Accessor,
  createOrReuseGltf2BufferView,
  createOrReuseGltf2BufferViewForVertexAttributeBuffer,
  createTemporaryVec4Accessor,
  createUnsignedTypedArray,
  doesRhodoniteMaterialRequireTangents,
  findBufferViewIdx,
  findPrimaryTexcoordAccessor,
  generateGlbArrayBuffer,
  getExportTangentAccessorForPrimitive,
  getNormalizedUnsignedComponentMax,
  isNumericArrayBufferView,
  normalizeNormals,
  normalizeSkinWeightElement,
  normalizeSkinWeights,
  normalizeTangentVector,
  processSkinWeightElement,
  rebalanceScaledSkinWeights,
  resolveVertexAttributeByteStride,
  sanitizeSkinWeight,
  scaleSkinWeightElementToUnsigned,
  setupBlendShapeData,
} from './Gltf2ExporterOps';

export const GLTF2_EXPORT_GLTF = 'glTF';
export const GLTF2_EXPORT_GLB = 'glTF-Binary';
export const GLTF2_EXPORT_DRACO = 'glTF-Draco';
export const GLTF2_EXPORT_EMBEDDED = 'glTF-Embedded';
export const GLTF2_EXPORT_NO_DOWNLOAD = 'No-Download';

/**
 * glTF2 Export Type definitions
 */
export type Gltf2ExportType =
  | typeof GLTF2_EXPORT_GLTF
  | typeof GLTF2_EXPORT_GLB
  | typeof GLTF2_EXPORT_DRACO
  | typeof GLTF2_EXPORT_EMBEDDED
  | typeof GLTF2_EXPORT_NO_DOWNLOAD;

/**
 * Configuration options for glTF2 export process
 */
export interface Gltf2ExporterArguments {
  /** Target entities to export. If specified, includes their descendants in the output */
  entities?: ISceneGraphEntity[];
  /** Export format type */
  type: Gltf2ExportType;
  /** Tags to exclude from export */
  excludeTags?: Tag[];
}

/**
 * The glTF2 format Exporter class.
 *
 * This class provides functionality to export Rhodonite scene data to glTF 2.0 format.
 * It supports various export formats including .gltf, .glb, and embedded formats.
 */
export class Gltf2Exporter {
  private constructor() {}

  /**
   * Exports scene data from the Rhodonite system in glTF2 format.
   *
   * This is the main entry point for glTF2 export functionality. It processes
   * the scene graph, materials, animations, and other data to create a complete
   * glTF2 output in the specified format.
   *
   * @param filename - The target output filename (without extension)
   * @param option - Export configuration options
   * @returns Promise that resolves to the generated glTF2 ArrayBuffer
   *
   * @example
   * ```typescript
   * const buffer = await Gltf2Exporter.export('myScene', {
   *   type: GLTF2_EXPORT_GLB,
   *   entities: [rootEntity]
   * });
   * ```
   */
  static async export(
    filename: string,
    option: Gltf2ExporterArguments = {
      entities: undefined,
      type: GLTF2_EXPORT_GLB,
    }
  ) {
    const { collectedEntities, topLevelEntities } = this.__collectEntities(option);

    const { json, fileName }: { json: Gltf2Ex; fileName: string } = this.__createJsonBase(filename);

    this.__createBufferViewsAndAccessors(json, collectedEntities);

    this.__createNodes(json, collectedEntities, topLevelEntities);

    await this.__createMaterials(json, collectedEntities as unknown as IMeshEntity[], option);

    createEffekseer(json, collectedEntities);

    this.__removeUnusedAccessorsAndBufferViews(json);

    const arraybuffer = this.__createBinary(json);

    this.__deleteEmptyArrays(json);

    const glbArrayBuffer = generateGlbArrayBuffer(json, arraybuffer);

    if (option.type === GLTF2_EXPORT_GLB) {
      this.__downloadGlb(json, fileName, glbArrayBuffer);
    } else if (option.type === GLTF2_EXPORT_GLTF) {
      this.__downloadGltf(json, fileName, arraybuffer);
    }

    return glbArrayBuffer;
  }

  /**
   * Removes empty arrays from the glTF2 JSON to optimize output size.
   *
   * According to glTF2 specification, empty arrays should be omitted rather than
   * included as empty arrays to reduce file size and improve parsing performance.
   *
   * @param json - The glTF2 JSON object to clean up
   */
  private static __deleteEmptyArrays(json: Gltf2Ex) {
    if (json.accessors.length === 0) {
      (json as Gltf2).accessors = undefined;
    }
    if (json.bufferViews.length === 0) {
      (json as Gltf2).bufferViews = undefined;
    }
    if (json.materials.length === 0) {
      (json as Gltf2).materials = undefined;
    }
    if (json.meshes.length === 0) {
      (json as Gltf2).meshes = undefined;
    }
    if (json.skins.length === 0) {
      (json as Gltf2).skins = undefined;
    }
    if (json.textures.length === 0) {
      (json as Gltf2).textures = undefined;
    }
    if (json.images.length === 0) {
      (json as Gltf2).images = undefined;
    }
    if (json.animations.length === 0) {
      (json as Gltf2).animations = undefined;
    }
    if (Is.exist(json.extensionsUsed) && json.extensionsUsed.length === 0) {
      (json as Gltf2).extensionsUsed = undefined;
    }
    if (json.cameras.length === 0) {
      (json as Gltf2).cameras = undefined;
    }
    (json as Gltf2).extras = undefined;
  }

  /**
   * Collects target entities for export, including their descendants.
   *
   * This method processes the entity hierarchy to determine which entities should
   * be included in the export. It handles tag-based filtering and ensures that
   * hierarchical relationships are preserved.
   *
   * @param option - Export configuration options containing entity filters
   * @returns Object containing collected entities and top-level entities
   */
  private static __collectEntities(option: Gltf2ExporterArguments | undefined) {
    const checkPassOrNotWithTags = (entity: ISceneGraphEntity) => {
      if (Is.exist(option) && Is.exist(option.excludeTags)) {
        for (const tag of option.excludeTags) {
          if (entity.matchTag(tag.tag, tag.value)) {
            return false; // exludes
          }
        }
        if (entity.matchTag('Being', 'gizmo')) {
          return true;
        }
      }
      return true;
    };
    const excludeWithTags = (entity: ISceneGraphEntity) => {
      if (Is.exist(option) && Is.exist(option.excludeTags)) {
        for (const tag of option.excludeTags) {
          if (entity.matchTag(tag.tag, tag.value)) {
            return [];
          }
        }
      }
      return [entity];
    };
    const collectDescendants = (entity: ISceneGraphEntity, root: boolean): ISceneGraphEntity[] => {
      const sg = entity.getSceneGraph()!;
      if (sg.children.length > 0) {
        const array: ISceneGraphEntity[] = root ? [] : excludeWithTags(entity);
        for (let i = 0; i < sg.children.length; i++) {
          const child = sg.children[i];
          Array.prototype.push.apply(array, collectDescendants(child.entity, false));
        }
        return array;
      }
      return root ? [] : excludeWithTags(entity);
    };
    if (Is.exist(option) && Is.exist(option.entities) && option.entities.length > 0) {
      const collectedDescendants = option.entities.flatMap(entity => collectDescendants(entity, true));

      let topLevelEntities: ISceneGraphEntity[] = [];
      option.entities.forEach(entity => {
        // if (collectedDescendants.indexOf(entity) === -1) {
        if (collectedDescendants.indexOf(entity) === -1 && checkPassOrNotWithTags(entity)) {
          topLevelEntities.push(entity);
        }
      });
      let collectedEntities = option.entities.concat();
      Array.prototype.push.apply(collectedEntities, collectedDescendants);
      collectedEntities = [...new Set(collectedEntities)];
      if (topLevelEntities.length === 0) {
        topLevelEntities = collectedEntities;
      }
      return { collectedEntities, topLevelEntities };
    }
    let collectedEntities = EntityRepository._getEntities() as unknown as ISceneGraphEntity[];
    collectedEntities = collectedEntities.filter(entity => checkPassOrNotWithTags(entity));
    let topLevelEntities = SceneGraphComponent.getTopLevelComponents().flatMap(c => c.entity);
    topLevelEntities = topLevelEntities.filter(entity => checkPassOrNotWithTags(entity));

    collectedEntities = collectedEntities.flatMap(entity => collectDescendants(entity, true));
    Array.prototype.push.apply(collectedEntities, topLevelEntities);
    collectedEntities = [...new Set(collectedEntities)];

    return { collectedEntities, topLevelEntities };
  }

  /**
   * Creates the base structure of the glTF2 JSON document.
   *
   * Initializes the fundamental glTF2 structure with required fields like asset,
   * buffers, and empty arrays for various glTF2 components. Sets up the metadata
   * and prepares the document for content population.
   *
   * @param filename - Target output filename for generating URIs
   * @returns Object containing the initialized JSON structure and processed filename
   */
  private static __createJsonBase(filename: string) {
    const fileName = filename ? filename : `Rhodonite_${new Date().getTime()}`;
    const json: Gltf2Ex = {
      asset: {
        version: '2.0',
        generator: `Rhodonite (${VERSION.version})`,
      },
      buffers: [{ uri: `${fileName}.bin`, byteLength: 0 }],
      bufferViews: [],
      accessors: [],
      animations: [],
      meshes: [],
      skins: [],
      materials: [],
      textures: [],
      images: [],
      extensionsUsed: [],
      extensions: {},
      extras: {
        rnSkins: [],
        bufferViewByteLengthAccumulatedArray: [],
        // bufferViewByteLengthAccumulatedArray[0] for buffer 0
        // bufferViewByteLengthAccumulatedArray[1] for buffer 1
        // ...
      },
      cameras: [],
      samplers: [],
    };

    return { json, fileName };
  }

  /**
   * Creates glTF2 BufferViews and Accessors for all geometry and animation data.
   *
   * This method processes mesh geometry, animation data, and skeletal information
   * to create the necessary buffer views and accessors required for glTF2 format.
   * It handles data deduplication and proper memory layout.
   *
   * @param json - The glTF2 JSON document to populate
   * @param entities - Array of entities to process for buffer creation
   */
  static __createBufferViewsAndAccessors(json: Gltf2Ex, entities: ISceneGraphEntity[]) {
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

    __createBufferViewsAndAccessorsOfAnimation(json, entities as IAnimationEntity[]);

    __createBufferViewsAndAccessorsOfSkin(
      json,
      entities as ISkeletalEntity[],
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );
  }

  /**
   * Creates glTF2 nodes representing the scene graph structure.
   *
   * Converts Rhodonite entities into glTF2 nodes, preserving hierarchical relationships,
   * transformations, and component associations (meshes, cameras, skins). Handles
   * special cases like billboard nodes and blend shape weights.
   *
   * @param json - The glTF2 JSON document to populate with nodes
   * @param entities - All entities to convert to nodes
   * @param topLevelEntities - Root-level entities for the scene
   */
  static __createNodes(json: Gltf2Ex, entities: ISceneGraphEntity[], topLevelEntities: ISceneGraphEntity[]) {
    json.nodes = [];
    json.scenes = [{ nodes: [] }];
    const scene = json.scenes![0];
    const sceneNodeIndices = new Set<number>();
    const parentNodeIndices: Array<number | undefined> = new Array(entities.length);
    const skinnedMeshNodeIndices: number[] = [];
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
          if (Is.exist((child.entity as any).gltfNodeIndex)) {
            const childNodeIdx = (child.entity as any).gltfNodeIndex;
            node.children.push(childNodeIdx);
            parentNodeIndices[childNodeIdx] = i;
          }
        }
        if (node.children.length === 0) {
          node.children = undefined;
        }
      }

      if (sceneGraphComponent.isBillboard) {
        node.extensions = {
          RHODONITE_billboard: {
            isBillboard: true,
          },
        };

        if (json.extensionsUsed.indexOf('RHODONITE_billboard') === -1) {
          json.extensionsUsed.push('RHODONITE_billboard');
        }
      }

      // matrix
      const transform = entity.getTransform()!;
      // glTF requires unit quaternions, so normalize and clamp to keep values within the spec range
      const normalizedQuaternion = Quaternion.normalize(transform.localRotationInner);
      const normalizedRotationArray = [
        normalizedQuaternion.x,
        normalizedQuaternion.y,
        normalizedQuaternion.z,
        normalizedQuaternion.w,
      ];
      node.rotation = normalizedRotationArray.map(component => Math.min(1, Math.max(-1, component)));
      node.scale = [transform.localScaleInner.x, transform.localScaleInner.y, transform.localScaleInner.z];
      node.translation = [
        transform.localPositionInner.x,
        transform.localPositionInner.y,
        transform.localPositionInner.z,
      ];

      // mesh
      const meshComponent = entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        node.mesh = meshCount++;
      }

      // BlendShape
      const blendShapeComponent = entity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        const weights = blendShapeComponent.weights;
        if (weights.length > 0) {
          node.weights = weights;
        }
      }

      // skin
      const skinComponent = entity.tryToGetSkeletal();
      if (Is.exist(skinComponent)) {
        const entityIdx = json.extras.rnSkins.indexOf(skinComponent.entity as any);
        if (entityIdx >= 0) {
          node.skin = entityIdx;
          if (Is.exist(node.mesh)) {
            skinnedMeshNodeIndices.push(i);
          }
        }
      }

      // camera
      const cameraComponent = entity.tryToGetCamera();
      if (Is.exist(cameraComponent)) {
        let glTF2Camera: Gltf2Camera;
        if (cameraComponent.type === CameraType.Perspective) {
          const originalAspect = cameraComponent.getTagValue('OriginalAspect');
          const originalFovY = cameraComponent.getTagValue('OriginalFovY');
          glTF2Camera = {
            name: cameraComponent.entity.uniqueName,
            type: 'perspective',
            perspective: {
              aspectRatio: Is.exist(originalAspect) ? originalAspect : cameraComponent.aspect,
              yfov: Is.exist(originalFovY)
                ? MathUtil.degreeToRadian(originalFovY)
                : MathUtil.degreeToRadian(cameraComponent.fovy),
              znear: cameraComponent.zNear,
              zfar: cameraComponent.zFar,
            },
          } as Gltf2Camera;
        } else if (cameraComponent.type === CameraType.Orthographic) {
          const originalXMag = cameraComponent.getTagValue('OriginalXMag');
          const originalYMag = cameraComponent.getTagValue('OriginalYMag');
          glTF2Camera = {
            name: cameraComponent.entity.uniqueName,
            type: 'orthographic',
            orthographic: {
              xmag: Is.exist(originalXMag) ? originalXMag : cameraComponent.xMag,
              ymag: Is.exist(originalYMag) ? originalYMag : cameraComponent.yMag,
              znear: cameraComponent.zNear,
              zfar: cameraComponent.zFar,
            },
          } as Gltf2Camera;
        }
        json.cameras.push(glTF2Camera!);
        node.camera = json.cameras.length - 1;
      }
    }

    // According to glTF specification, nodes with both skin and mesh should be placed directly under the root.
    // Remove them from their parent's children, preserve their world-space TRS, and relocate them to the root node set.
    for (const nodeIndex of skinnedMeshNodeIndices) {
      const node = json.nodes[nodeIndex];
      const parentIdx = parentNodeIndices[nodeIndex];
      if (Is.exist(parentIdx)) {
        const parentNode = json.nodes[parentIdx];
        if (Is.exist(parentNode.children)) {
          parentNode.children = parentNode.children.filter(childIdx => childIdx !== nodeIndex);
          if (parentNode.children.length === 0) {
            parentNode.children = undefined;
          }
        }
        parentNodeIndices[nodeIndex] = undefined;
      }

      const skinnedEntity = entities[nodeIndex];
      const worldMatrix = skinnedEntity.getSceneGraph()!.matrixInner;
      const worldTranslation = worldMatrix.getTranslate();
      const worldScale = worldMatrix.getScale();
      const worldQuaternion = Quaternion.normalize(Quaternion.fromMatrix(worldMatrix));

      node.translation = [worldTranslation.x, worldTranslation.y, worldTranslation.z];
      node.rotation = [
        Math.min(1, Math.max(-1, worldQuaternion.x)),
        Math.min(1, Math.max(-1, worldQuaternion.y)),
        Math.min(1, Math.max(-1, worldQuaternion.z)),
        Math.min(1, Math.max(-1, worldQuaternion.w)),
      ];
      node.scale = [worldScale.x, worldScale.y, worldScale.z];

      if (!sceneNodeIndices.has(nodeIndex)) {
        scene.nodes!.push(nodeIndex);
        sceneNodeIndices.add(nodeIndex);
      }
    }

    // If the entity has no parent, it must be a top level entity in the scene graph.
    topLevelEntities.forEach(entity => {
      const idx = entities.indexOf(entity);
      if (idx >= 0 && !sceneNodeIndices.has(idx)) {
        scene.nodes!.push(idx);
        sceneNodeIndices.add(idx);
      }
    });
  }

  /**
   * Creates glTF2 materials and textures from Rhodonite materials.
   *
   * Processes all materials used by mesh entities, converting Rhodonite material
   * properties to glTF2 PBR format. Handles texture extraction, optimization,
   * and proper format conversion including support for various material extensions.
   *
   * @param json - The glTF2 JSON document to populate with materials
   * @param entities - Mesh entities containing materials to convert
   * @param option - Export options affecting material processing
   * @returns Promise that resolves when all materials and textures are processed
   */
  static async __createMaterials(json: Gltf2Ex, entities: IMeshEntity[], option: Gltf2ExporterArguments) {
    let countMesh = 0;
    const promises: Promise<any>[] = [];
    json.extras.bufferViewByteLengthAccumulatedArray.push(0);
    const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent?.mesh) {
        const gltf2Mesh = json.meshes![countMesh++];
        await this.__processMeshPrimitives(json, meshComponent.mesh, gltf2Mesh, promises, bufferIdx, option);
      }
    }

    return Promise.all(promises);
  }

  private static async __processMeshPrimitives(
    json: Gltf2Ex,
    mesh: Mesh,
    gltf2Mesh: Gltf2Mesh,
    promises: Promise<any>[],
    bufferIdx: number,
    option: Gltf2ExporterArguments
  ) {
    const primitiveCount = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveCount; j++) {
      const rnPrimitive = mesh.getPrimitiveAt(j);
      const primitive = gltf2Mesh.primitives[j];
      const rnMaterial = rnPrimitive.material!;

      const material = await this.__createMaterialFromRhodonite(json, rnMaterial, promises, bufferIdx, option);
      const materialIndex = json.materials.length;
      json.materials.push(material);
      primitive.material = materialIndex;
      this.__pruneUnusedVertexAttributes(primitive, material);
    }
  }

  private static __pruneUnusedVertexAttributes(primitive: Gltf2Primitive, material: Gltf2MaterialEx) {
    const attributes = primitive.attributes as Record<string, number | undefined>;

    if (!this.__doesMaterialRequireTangents(material) && Is.exist(attributes.TANGENT)) {
      attributes.TANGENT = undefined;
    }

    const usedTexCoords = this.__collectUsedTexCoordSetIndices(material);
    if (usedTexCoords.size === 0) {
      for (const attributeName of Object.keys(attributes)) {
        if (attributeName.startsWith('TEXCOORD_')) {
          delete attributes[attributeName];
        }
      }
      return;
    }

    for (const attributeName of Object.keys(attributes)) {
      if (!attributeName.startsWith('TEXCOORD_')) {
        continue;
      }
      const texCoordIndex = Number(attributeName.substring('TEXCOORD_'.length));
      if (Number.isNaN(texCoordIndex) || !usedTexCoords.has(texCoordIndex)) {
        delete attributes[attributeName];
      }
    }
  }

  private static __doesMaterialRequireTangents(material: Gltf2MaterialEx): boolean {
    if (Is.exist(material.normalTexture)) {
      return true;
    }
    const extensions = material.extensions as Record<string, any> | undefined;
    const clearcoatExtension = extensions?.KHR_materials_clearcoat as { clearcoatNormalTexture?: unknown } | undefined;
    if (Is.exist(clearcoatExtension?.clearcoatNormalTexture)) {
      return true;
    }
    const anisotropyExtension = extensions?.KHR_materials_anisotropy as {
      anisotropyTexture?: unknown;
      anisotropyStrength?: number;
    };
    if (Is.exist(anisotropyExtension)) {
      if (Is.exist(anisotropyExtension.anisotropyTexture)) {
        return true;
      }
      if (Is.exist(anisotropyExtension.anisotropyStrength) && anisotropyExtension.anisotropyStrength !== 0) {
        return true;
      }
    }
    return false;
  }

  private static __collectUsedTexCoordSetIndices(material: Gltf2MaterialEx): Set<number> {
    const usedTexCoords = new Set<number>();
    const registerTexcoord = (info: { texCoord?: number; index?: number } | undefined) => {
      if (Is.not.exist(info) || typeof info.index !== 'number') {
        return;
      }
      const texCoord = typeof info.texCoord === 'number' ? info.texCoord : 0;
      usedTexCoords.add(texCoord);
    };

    const pbr = material.pbrMetallicRoughness;
    if (Is.exist(pbr)) {
      registerTexcoord(pbr.baseColorTexture);
      registerTexcoord(pbr.metallicRoughnessTexture);
    }

    registerTexcoord(material.normalTexture);
    registerTexcoord(material.occlusionTexture);
    registerTexcoord(material.emissiveTexture);

    const extensions = material.extensions as Record<string, any> | undefined;
    const clearcoatExtension = extensions?.KHR_materials_clearcoat as {
      clearcoatTexture?: { texCoord?: number; index?: number };
      clearcoatRoughnessTexture?: { texCoord?: number; index?: number };
      clearcoatNormalTexture?: { texCoord?: number; index?: number };
    };
    if (Is.exist(clearcoatExtension)) {
      registerTexcoord(clearcoatExtension.clearcoatTexture);
      registerTexcoord(clearcoatExtension.clearcoatRoughnessTexture);
      registerTexcoord(clearcoatExtension.clearcoatNormalTexture);
    }

    const transmissionExtension = extensions?.KHR_materials_transmission as {
      transmissionTexture?: { texCoord?: number; index?: number };
    };
    if (Is.exist(transmissionExtension)) {
      registerTexcoord(transmissionExtension.transmissionTexture);
    }

    const volumeExtension = extensions?.KHR_materials_volume as {
      thicknessTexture?: { texCoord?: number; index?: number };
    };
    if (Is.exist(volumeExtension)) {
      registerTexcoord(volumeExtension.thicknessTexture);
    }

    const sheenExtension = extensions?.KHR_materials_sheen as {
      sheenColorTexture?: { texCoord?: number; index?: number };
      sheenRoughnessTexture?: { texCoord?: number; index?: number };
    };
    if (Is.exist(sheenExtension)) {
      registerTexcoord(sheenExtension.sheenColorTexture);
      registerTexcoord(sheenExtension.sheenRoughnessTexture);
    }

    const anisotropyExtension = extensions?.KHR_materials_anisotropy as {
      anisotropyTexture?: { texCoord?: number; index?: number };
    };
    if (Is.exist(anisotropyExtension)) {
      registerTexcoord(anisotropyExtension.anisotropyTexture);
    }

    return usedTexCoords;
  }

  private static async __createMaterialFromRhodonite(
    json: Gltf2Ex,
    rnMaterial: Material,
    promises: Promise<any>[],
    bufferIdx: number,
    option: Gltf2ExporterArguments
  ): Promise<Gltf2MaterialEx> {
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {
        metallicFactor: 1.0,
        roughnessFactor: 1.0,
      },
    };

    if (Is.exist(rnMaterial)) {
      await this.__setupMaterial(material, rnMaterial, json, promises, bufferIdx, option);
    }

    return material;
  }

  private static __extractScalarParameter(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value;
    }

    const candidateWithX = (value as { x?: number })?.x;
    if (typeof candidateWithX === 'number') {
      return candidateWithX;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
      return value[0];
    }

    if (ArrayBuffer.isView(value)) {
      const view = value as ArrayBufferView;
      if (isNumericArrayBufferView(view) && view.length > 0) {
        return view[0];
      }
    }

    const internal = (value as { _v?: unknown })._v;
    if (Array.isArray(internal) && internal.length > 0 && typeof internal[0] === 'number') {
      return internal[0];
    }
    if (ArrayBuffer.isView(internal)) {
      const view = internal as ArrayBufferView;
      if (isNumericArrayBufferView(view) && view.length > 0) {
        return view[0];
      }
    }

    return undefined;
  }

  private static __setupMaterialBasicProperties(material: Gltf2MaterialEx, rnMaterial: Material, json: Gltf2Ex) {
    if (Is.false(rnMaterial.isLighting)) {
      if (Is.not.exist(material.extensions)) {
        material.extensions = {};
      }
      material.extensions.KHR_materials_unlit = {};
      if (json.extensionsUsed.indexOf('KHR_materials_unlit') < 0) {
        json.extensionsUsed.push('KHR_materials_unlit');
      }
    }

    const baseColorParam =
      (rnMaterial.getParameter('baseColorFactor') as Vector4 | undefined) ??
      (rnMaterial.getParameter('diffuseColorFactor') as Vector4 | undefined) ??
      Vector4.fromCopy4(1, 1, 1, 1);
    material.pbrMetallicRoughness.baseColorFactor = [
      baseColorParam.x,
      baseColorParam.y,
      baseColorParam.z,
      baseColorParam.w,
    ];

    const metallicValue = this.__extractScalarParameter(rnMaterial.getParameter('metallicFactor'));
    if (Is.exist(metallicValue)) {
      material.pbrMetallicRoughness.metallicFactor = metallicValue as number;
    }

    const roughnessValue = this.__extractScalarParameter(rnMaterial.getParameter('roughnessFactor'));
    if (Is.exist(roughnessValue)) {
      material.pbrMetallicRoughness.roughnessFactor = roughnessValue as number;
    }

    const emissiveParam = rnMaterial.getParameter('emissiveFactor') as Vector3 | undefined;
    if (Is.exist(emissiveParam)) {
      material.emissiveFactor = [emissiveParam.x, emissiveParam.y, emissiveParam.z];
    }

    material.alphaMode = rnMaterial.alphaMode.toGltfString();
  }

  private static async __setupMaterial(
    material: Gltf2MaterialEx,
    rnMaterial: Material,
    json: Gltf2Ex,
    promises: Promise<any>[],
    bufferIdx: number,
    option: Gltf2ExporterArguments
  ) {
    const existedImages: string[] = [];

    const processSampler = (rnSampler?: Sampler) => {
      const gltf2TextureSampler: Gltf2TextureSampler = {
        magFilter: rnSampler != null ? rnSampler.magFilter.index : TextureParameter.Linear.index,
        minFilter: rnSampler != null ? rnSampler.minFilter.index : TextureParameter.Linear.index,
        wrapS: rnSampler != null ? rnSampler.wrapS.index : TextureParameter.TextureWrapS.index,
        wrapT: rnSampler != null ? rnSampler.wrapT.index : TextureParameter.TextureWrapT.index,
      };

      let samplerIdx = json.samplers.findIndex(sampler => {
        return isSameGlTF2TextureSampler(gltf2TextureSampler, sampler);
      });
      if (samplerIdx === -1) {
        json.samplers.push(gltf2TextureSampler);
        samplerIdx = json.samplers.length - 1;
      }
      return samplerIdx;
    };

    const processImage = (rnTexture: AbstractTexture) => {
      let imageIndex = json.images.length;
      let match = false;
      for (let k = 0; k < json.images.length; k++) {
        const image = json.images![k];
        const existingTextureUid = image.extras?.rnTextureUID;
        if (Is.exist(existingTextureUid) && existingTextureUid === rnTexture.textureUID) {
          imageIndex = k;
          match = true;
        }
      }

      if (!match) {
        const glTF2ImageEx: Gltf2ImageEx = {
          uri: rnTexture.name,
          extras: {
            rnTextureUID: rnTexture.textureUID,
          },
        };

        if (existedImages.indexOf(rnTexture.name) !== -1) {
          glTF2ImageEx.uri += `_${rnTexture.textureUID}`;
        }

        existedImages.push(glTF2ImageEx.uri!);

        if (Is.not.exist(glTF2ImageEx.uri!.match(/\.(png)/))) {
          glTF2ImageEx.uri += '.png';
        }
        const htmlCanvasElement = rnTexture.htmlCanvasElement;
        if (htmlCanvasElement) {
          const promise = new Promise(
            (resolve: (v?: ArrayBuffer) => void, rejected: (reason?: DOMException) => void) => {
              htmlCanvasElement.toBlob(blob => {
                if (Is.exist(blob)) {
                  handleTextureImage(json, bufferIdx, blob, option, glTF2ImageEx, resolve, rejected);
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
      return imageIndex;
    };

    const processTexture = (rnTexture: AbstractTexture, rnSampler?: Sampler) => {
      const texture = rnTexture;
      if (!texture) {
        return void 0;
      }
      if (!texture.isTextureReady || texture.isDummyTexture || texture.width < 1 || texture.height < 1) {
        return void 0;
      }

      const samplerIdx = processSampler(rnSampler);
      const imageIndex = processImage(texture);

      const gltf2Texture: Gltf2Texture = {
        sampler: samplerIdx,
        source: imageIndex,
      };
      const textureIdx = json.textures.indexOf(gltf2Texture);
      if (textureIdx === -1) {
        json.textures.push(gltf2Texture);
      }

      return json.textures.indexOf(gltf2Texture);
    };

    this.__processParameters(json, material, rnMaterial, processTexture);
  }

  private static __processParameters(
    json: Gltf2Ex,
    material: Gltf2MaterialEx,
    rnMaterial: Material,
    processTexture: (rnTexture: AbstractTexture, rnSampler?: Sampler) => number | undefined
  ) {
    const ensureExtensionUsed = (extensionName: string) => {
      if (json.extensionsUsed.indexOf(extensionName) === -1) {
        json.extensionsUsed.push(extensionName);
      }
    };

    const coerceNumber = (value: any): number | undefined => {
      if (Is.not.exist(value)) {
        return undefined;
      }
      if (typeof value === 'number') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : undefined;
      }
      if (typeof value === 'object') {
        if (typeof value.x === 'number' && typeof value.y === 'undefined') {
          return value.x;
        }
        if (ArrayBuffer.isView(value)) {
          const view = value as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length > 0) {
            return view[0];
          }
        }
        const internal = (value as { _v?: ArrayLike<number> })._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length > 0) {
            return view[0];
          }
        }
        if (Array.isArray(internal)) {
          return internal.length > 0 ? internal[0] : undefined;
        }
      }
      return undefined;
    };

    const coerceVec2 = (value: any): [number, number] | undefined => {
      if (Is.not.exist(value)) {
        return undefined;
      }
      if (Array.isArray(value)) {
        if (value.length >= 2) {
          return [value[0], value[1]];
        }
        if (value.length === 1) {
          return [value[0], value[0]];
        }
      }
      if (typeof value === 'object') {
        if (typeof value.x === 'number' && typeof value.y === 'number') {
          return [value.x, value.y];
        }
        const internal = (value as { _v?: ArrayLike<number> })._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length >= 2) {
            return [view[0], view[1]];
          }
        }
        if (Array.isArray(internal) && internal.length >= 2) {
          return [internal[0], internal[1]];
        }
        if (ArrayBuffer.isView(value)) {
          const view = value as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length >= 2) {
            return [view[0], view[1]];
          }
        }
      }
      return undefined;
    };

    const coerceVec3 = (value: any): [number, number, number] | undefined => {
      if (Is.not.exist(value)) {
        return undefined;
      }
      if (Array.isArray(value)) {
        if (value.length >= 3) {
          return [value[0], value[1], value[2]];
        }
        if (value.length === 2) {
          return [value[0], value[1], value[1]];
        }
        if (value.length === 1) {
          return [value[0], value[0], value[0]];
        }
      }
      if (typeof value === 'object') {
        if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
          return [value.x, value.y, value.z];
        }
        const internal = (value as { _v?: ArrayLike<number> })._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length >= 3) {
            return [view[0], view[1], view[2]];
          }
        }
        if (Array.isArray(internal) && internal.length >= 3) {
          return [internal[0], internal[1], internal[2]];
        }
        if (ArrayBuffer.isView(value)) {
          const view = value as ArrayBufferView;
          if (isNumericArrayBufferView(view) && view.length >= 3) {
            return [view[0], view[1], view[2]];
          }
        }
      }
      return undefined;
    };

    type TextureOptions = {
      texCoordParam?: string;
      transform?: {
        scale?: string;
        offset?: string;
        rotation?: string;
      };
      scaleParam?: string;
      strengthParam?: string;
      onAssign: (info: any) => void;
    };

    const applyTexture = (paramName: string, options: TextureOptions) => {
      const textureParam = rnMaterial.getTextureParameter(paramName) as any;
      if (Is.not.exist(textureParam)) {
        return;
      }
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      const textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex == null) {
        return;
      }

      const info: any = {
        index: textureIndex,
      };

      if (Is.exist(options.texCoordParam)) {
        const texCoordValue = coerceNumber(rnMaterial.getParameter(options.texCoordParam!));
        if (Is.exist(texCoordValue)) {
          info.texCoord = texCoordValue;
        }
      }

      if (Is.exist(options.scaleParam)) {
        const scaleValue = coerceNumber(rnMaterial.getParameter(options.scaleParam!));
        if (Is.exist(scaleValue)) {
          info.scale = scaleValue;
        }
      }

      if (Is.exist(options.strengthParam)) {
        const strengthValue = coerceNumber(rnMaterial.getParameter(options.strengthParam!));
        if (Is.exist(strengthValue)) {
          info.strength = strengthValue;
        }
      }

      if (Is.exist(options.transform)) {
        const scale = Is.exist(options.transform!.scale)
          ? coerceVec2(rnMaterial.getParameter(options.transform!.scale!))
          : undefined;
        const offset = Is.exist(options.transform!.offset)
          ? coerceVec2(rnMaterial.getParameter(options.transform!.offset!))
          : undefined;
        const rotation = Is.exist(options.transform!.rotation)
          ? coerceNumber(rnMaterial.getParameter(options.transform!.rotation!))
          : undefined;

        if (Is.exist(scale) || Is.exist(offset) || Is.exist(rotation)) {
          const transform: Record<string, unknown> = {};
          if (Is.exist(scale)) {
            transform.scale = scale;
          }
          if (Is.exist(offset)) {
            transform.offset = offset;
          }
          if (Is.exist(rotation)) {
            transform.rotation = rotation;
          }
          if (Object.keys(transform).length > 0) {
            info.extensions = info.extensions ?? {};
            info.extensions.KHR_texture_transform = transform;
            ensureExtensionUsed('KHR_texture_transform');
          }
        }
      }

      options.onAssign(info);
    };

    Gltf2Exporter.__outputBaseMaterialInfo(rnMaterial, applyTexture, material, json);

    Gltf2Exporter.__outputKhrMaterialsTransmissionInfo(
      ensureExtensionUsed,
      coerceNumber,
      rnMaterial,
      applyTexture,
      material
    );

    Gltf2Exporter.__outputKhrMaterialsVolumeInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec3,
      rnMaterial,
      applyTexture,
      material
    );

    Gltf2Exporter.__outputKhrMaterialsIorInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    Gltf2Exporter.__outputKhrMaterialsClearcoatInfo(
      ensureExtensionUsed,
      coerceNumber,
      rnMaterial,
      applyTexture,
      material
    );

    Gltf2Exporter.__outputKhrMaterialsSheenInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec3,
      rnMaterial,
      applyTexture,
      material
    );

    Gltf2Exporter.__outputKhrMaterialsAnisotropyInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec2,
      rnMaterial,
      applyTexture,
      material
    );
  }

  private static __outputKhrMaterialsTransmissionInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx
  ) {
    const transmissionExtension: Record<string, unknown> = {};
    let transmissionExtensionUsed = false;
    const markTransmissionExtensionUsed = () => {
      if (!transmissionExtensionUsed) {
        transmissionExtensionUsed = true;
        ensureExtensionUsed('KHR_materials_transmission');
      }
    };

    const transmissionFactor = coerceNumber(rnMaterial.getParameter('transmissionFactor'));
    if (Is.exist(transmissionFactor)) {
      transmissionExtension.transmissionFactor = transmissionFactor;
      if (transmissionFactor !== 0) {
        markTransmissionExtensionUsed();
      }
    }

    applyTexture('transmissionTexture', {
      texCoordParam: 'transmissionTexcoordIndex',
      transform: {
        scale: 'transmissionTextureTransformScale',
        offset: 'transmissionTextureTransformOffset',
        rotation: 'transmissionTextureTransformRotation',
      },
      onAssign: info => {
        transmissionExtension.transmissionTexture = info;
        markTransmissionExtensionUsed();
      },
    });

    const shouldAttachTransmissionExtension =
      transmissionExtensionUsed || Is.exist(transmissionExtension.transmissionTexture);
    if (shouldAttachTransmissionExtension) {
      material.extensions = material.extensions ?? {};
      material.extensions.KHR_materials_transmission = transmissionExtension;
      ensureExtensionUsed('KHR_materials_transmission');
    }
  }

  private static __outputKhrMaterialsVolumeInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    coerceVec3: (value: any) => [number, number, number] | undefined,
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx
  ) {
    const volumeExtension: Record<string, unknown> = {};
    let volumeExtensionUsed = false;
    const markVolumeExtensionUsed = () => {
      if (!volumeExtensionUsed) {
        volumeExtensionUsed = true;
        ensureExtensionUsed('KHR_materials_volume');
      }
    };

    const thicknessFactor = coerceNumber(rnMaterial.getParameter('thicknessFactor'));
    if (Is.exist(thicknessFactor)) {
      volumeExtension.thicknessFactor = thicknessFactor;
      if (thicknessFactor !== 0) {
        markVolumeExtensionUsed();
      }
    }

    applyTexture('thicknessTexture', {
      texCoordParam: 'thicknessTexcoordIndex',
      transform: {
        scale: 'thicknessTextureTransformScale',
        offset: 'thicknessTextureTransformOffset',
        rotation: 'thicknessTextureTransformRotation',
      },
      onAssign: info => {
        volumeExtension.thicknessTexture = info;
        markVolumeExtensionUsed();
      },
    });

    const attenuationDistance = coerceNumber(rnMaterial.getParameter('attenuationDistance'));
    if (Is.exist(attenuationDistance)) {
      volumeExtension.attenuationDistance = attenuationDistance;
      if (attenuationDistance !== 0) {
        markVolumeExtensionUsed();
      }
    }

    const attenuationColor = coerceVec3(rnMaterial.getParameter('attenuationColor'));
    if (Is.exist(attenuationColor)) {
      volumeExtension.attenuationColor = attenuationColor;
      if (attenuationColor.some(v => v !== 1)) {
        markVolumeExtensionUsed();
      }
    }

    const shouldAttachVolumeExtension =
      volumeExtensionUsed ||
      Is.exist(volumeExtension.thicknessTexture) ||
      (Is.exist(volumeExtension.thicknessFactor) && (volumeExtension.thicknessFactor as number) !== 0) ||
      (Is.exist(volumeExtension.attenuationDistance) && (volumeExtension.attenuationDistance as number) !== 0) ||
      (Is.exist(volumeExtension.attenuationColor) &&
        (volumeExtension.attenuationColor as [number, number, number]).some(v => v !== 1));
    if (shouldAttachVolumeExtension) {
      material.extensions = material.extensions ?? {};
      material.extensions.KHR_materials_volume = volumeExtension;
      ensureExtensionUsed('KHR_materials_volume');
    }
  }

  private static __outputKhrMaterialsIorInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    rnMaterial: Material,
    material: Gltf2MaterialEx
  ) {
    const rawIor = coerceNumber(rnMaterial.getParameter('ior'));
    if (Is.not.exist(rawIor)) {
      return;
    }

    const clampedIor = Math.max(1.0, rawIor);
    const defaultIor = 1.5;
    if (Math.abs(clampedIor - defaultIor) < 1e-6) {
      return;
    }

    material.extensions = material.extensions ?? {};
    material.extensions.KHR_materials_ior = {
      ior: clampedIor,
    };
    ensureExtensionUsed('KHR_materials_ior');
  }

  private static __outputKhrMaterialsClearcoatInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx
  ) {
    const clearcoatExtension: Record<string, unknown> = {};
    let clearcoatExtensionUsed = false;
    const markClearcoatExtensionUsed = () => {
      if (!clearcoatExtensionUsed) {
        clearcoatExtensionUsed = true;
        ensureExtensionUsed('KHR_materials_clearcoat');
      }
    };

    const clearcoatFactor = coerceNumber(rnMaterial.getParameter('clearcoatFactor'));
    if (Is.exist(clearcoatFactor)) {
      clearcoatExtension.clearcoatFactor = clearcoatFactor;
      if (clearcoatFactor !== 0) {
        markClearcoatExtensionUsed();
      }
    }

    const clearcoatRoughnessFactor = coerceNumber(rnMaterial.getParameter('clearcoatRoughnessFactor'));
    if (Is.exist(clearcoatRoughnessFactor)) {
      clearcoatExtension.clearcoatRoughnessFactor = clearcoatRoughnessFactor;
      if (clearcoatRoughnessFactor !== 0) {
        markClearcoatExtensionUsed();
      }
    }

    applyTexture('clearcoatTexture', {
      texCoordParam: 'clearcoatTexcoordIndex',
      transform: {
        scale: 'clearcoatTextureTransformScale',
        offset: 'clearcoatTextureTransformOffset',
        rotation: 'clearcoatTextureTransformRotation',
      },
      onAssign: info => {
        clearcoatExtension.clearcoatTexture = info;
        markClearcoatExtensionUsed();
      },
    });

    applyTexture('clearcoatRoughnessTexture', {
      texCoordParam: 'clearcoatRoughnessTexcoordIndex',
      transform: {
        scale: 'clearcoatRoughnessTextureTransformScale',
        offset: 'clearcoatRoughnessTextureTransformOffset',
        rotation: 'clearcoatRoughnessTextureTransformRotation',
      },
      onAssign: info => {
        clearcoatExtension.clearcoatRoughnessTexture = info;
        markClearcoatExtensionUsed();
      },
    });

    applyTexture('clearcoatNormalTexture', {
      texCoordParam: 'clearcoatNormalTexcoordIndex',
      transform: {
        scale: 'clearcoatNormalTextureTransformScale',
        offset: 'clearcoatNormalTextureTransformOffset',
        rotation: 'clearcoatNormalTextureTransformRotation',
      },
      onAssign: info => {
        const clearcoatNormalScale =
          coerceNumber(rnMaterial.getParameter('clearcoatNormalScale')) ??
          coerceNumber(rnMaterial.getParameter('clearcoatNormalTextureScale'));
        if (Is.exist(clearcoatNormalScale)) {
          info.scale = clearcoatNormalScale;
        }
        clearcoatExtension.clearcoatNormalTexture = info;
        markClearcoatExtensionUsed();
      },
    });

    const shouldAttachClearcoatExtension =
      clearcoatExtensionUsed ||
      Is.exist(clearcoatExtension.clearcoatTexture) ||
      Is.exist(clearcoatExtension.clearcoatRoughnessTexture) ||
      Is.exist(clearcoatExtension.clearcoatNormalTexture);
    if (shouldAttachClearcoatExtension) {
      material.extensions = material.extensions ?? {};
      material.extensions.KHR_materials_clearcoat = clearcoatExtension;
      ensureExtensionUsed('KHR_materials_clearcoat');
    }
  }

  private static __outputKhrMaterialsSheenInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    coerceVec3: (value: any) => [number, number, number] | undefined,
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx
  ) {
    const sheenExtension: Record<string, unknown> = {};
    let sheenExtensionUsed = false;
    const markSheenExtensionUsed = () => {
      if (!sheenExtensionUsed) {
        sheenExtensionUsed = true;
        ensureExtensionUsed('KHR_materials_sheen');
      }
    };

    const sheenColorFactor = coerceVec3(rnMaterial.getParameter('sheenColorFactor'));
    if (Is.exist(sheenColorFactor)) {
      sheenExtension.sheenColorFactor = sheenColorFactor;
      if (sheenColorFactor.some(v => v !== 0)) {
        markSheenExtensionUsed();
      }
    }

    const sheenRoughnessFactor = coerceNumber(rnMaterial.getParameter('sheenRoughnessFactor'));
    if (Is.exist(sheenRoughnessFactor)) {
      sheenExtension.sheenRoughnessFactor = sheenRoughnessFactor;
      if (sheenRoughnessFactor !== 0) {
        markSheenExtensionUsed();
      }
    }

    applyTexture('sheenColorTexture', {
      texCoordParam: 'sheenColorTexcoordIndex',
      transform: {
        scale: 'sheenColorTextureTransformScale',
        offset: 'sheenColorTextureTransformOffset',
        rotation: 'sheenColorTextureTransformRotation',
      },
      onAssign: info => {
        sheenExtension.sheenColorTexture = info;
        markSheenExtensionUsed();
      },
    });

    applyTexture('sheenRoughnessTexture', {
      texCoordParam: 'sheenRoughnessTexcoordIndex',
      transform: {
        scale: 'sheenRoughnessTextureTransformScale',
        offset: 'sheenRoughnessTextureTransformOffset',
        rotation: 'sheenRoughnessTextureTransformRotation',
      },
      onAssign: info => {
        sheenExtension.sheenRoughnessTexture = info;
        markSheenExtensionUsed();
      },
    });

    const shouldAttachSheenExtension =
      sheenExtensionUsed ||
      Is.exist(sheenExtension.sheenColorTexture) ||
      Is.exist(sheenExtension.sheenRoughnessTexture);
    if (shouldAttachSheenExtension) {
      material.extensions = material.extensions ?? {};
      material.extensions.KHR_materials_sheen = sheenExtension;
      ensureExtensionUsed('KHR_materials_sheen');
    }
  }

  private static __outputKhrMaterialsAnisotropyInfo(
    ensureExtensionUsed: (extensionName: string) => void,
    coerceNumber: (value: any) => number | undefined,
    coerceVec2: (value: any) => [number, number] | undefined,
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx
  ) {
    const anisotropyExtension: Record<string, unknown> = {};
    let anisotropyExtensionUsed = false;
    const markAnisotropyExtensionUsed = () => {
      if (!anisotropyExtensionUsed) {
        anisotropyExtensionUsed = true;
        ensureExtensionUsed('KHR_materials_anisotropy');
      }
    };

    const anisotropyStrength = coerceNumber(rnMaterial.getParameter('anisotropyStrength'));
    if (Is.exist(anisotropyStrength)) {
      anisotropyExtension.anisotropyStrength = anisotropyStrength;
      if (anisotropyStrength !== 0) {
        markAnisotropyExtensionUsed();
      }
    }

    const anisotropyRotationVector = coerceVec2(rnMaterial.getParameter('anisotropyRotation'));
    if (Is.exist(anisotropyRotationVector)) {
      const [x, y] = anisotropyRotationVector;
      const rotation = Math.atan2(y, x);
      if (Number.isFinite(rotation)) {
        anisotropyExtension.anisotropyRotation = rotation;
        if (rotation !== 0) {
          markAnisotropyExtensionUsed();
        }
      }
    }

    applyTexture('anisotropyTexture', {
      texCoordParam: 'anisotropyTexcoordIndex',
      transform: {
        scale: 'anisotropyTextureTransformScale',
        offset: 'anisotropyTextureTransformOffset',
        rotation: 'anisotropyTextureTransformRotation',
      },
      onAssign: info => {
        anisotropyExtension.anisotropyTexture = info;
        markAnisotropyExtensionUsed();
      },
    });

    const shouldAttachAnisotropyExtension =
      anisotropyExtensionUsed ||
      Is.exist(anisotropyExtension.anisotropyTexture) ||
      (Is.exist(anisotropyExtension.anisotropyStrength) && (anisotropyExtension.anisotropyStrength as number) !== 0) ||
      (Is.exist(anisotropyExtension.anisotropyRotation) && (anisotropyExtension.anisotropyRotation as number) !== 0);
    if (shouldAttachAnisotropyExtension) {
      material.extensions = material.extensions ?? {};
      material.extensions.KHR_materials_anisotropy = anisotropyExtension;
      ensureExtensionUsed('KHR_materials_anisotropy');
    }
  }

  private static __outputBaseMaterialInfo(
    rnMaterial: Material,
    applyTexture: (
      paramName: string,
      options: {
        texCoordParam?: string;
        transform?: {
          scale?: string;
          offset?: string;
          rotation?: string;
        };
        scaleParam?: string;
        strengthParam?: string;
        onAssign: (info: any) => void;
      }
    ) => void,
    material: Gltf2MaterialEx,
    json: Gltf2Ex
  ) {
    Gltf2Exporter.__setupMaterialBasicProperties(material, rnMaterial, json);

    const hasBaseColorTexture = Is.exist(rnMaterial.getTextureParameter('baseColorTexture'));

    applyTexture('baseColorTexture', {
      texCoordParam: 'baseColorTexcoordIndex',
      transform: {
        scale: 'baseColorTextureTransformScale',
        offset: 'baseColorTextureTransformOffset',
        rotation: 'baseColorTextureTransformRotation',
      },
      onAssign: info => {
        material.pbrMetallicRoughness.baseColorTexture = info;
      },
    });

    if (!hasBaseColorTexture) {
      applyTexture('diffuseColorTexture', {
        texCoordParam: 'baseColorTexcoordIndex',
        transform: {
          scale: 'baseColorTextureTransformScale',
          offset: 'baseColorTextureTransformOffset',
          rotation: 'baseColorTextureTransformRotation',
        },
        onAssign: info => {
          if (Is.not.exist(material.pbrMetallicRoughness.baseColorTexture)) {
            material.pbrMetallicRoughness.baseColorTexture = info;
          }
        },
      });
    }

    applyTexture('metallicRoughnessTexture', {
      texCoordParam: 'metallicRoughnessTexcoordIndex',
      transform: {
        scale: 'metallicRoughnessTextureTransformScale',
        offset: 'metallicRoughnessTextureTransformOffset',
        rotation: 'metallicRoughnessTextureTransformRotation',
      },
      onAssign: info => {
        material.pbrMetallicRoughness.metallicRoughnessTexture = info;
      },
    });

    applyTexture('normalTexture', {
      texCoordParam: 'normalTexcoordIndex',
      transform: {
        scale: 'normalTextureTransformScale',
        offset: 'normalTextureTransformOffset',
        rotation: 'normalTextureTransformRotation',
      },
      scaleParam: 'normalScale',
      onAssign: info => {
        material.normalTexture = info;
      },
    });

    applyTexture('occlusionTexture', {
      texCoordParam: 'occlusionTexcoordIndex',
      transform: {
        scale: 'occlusionTextureTransformScale',
        offset: 'occlusionTextureTransformOffset',
        rotation: 'occlusionTextureTransformRotation',
      },
      strengthParam: 'occlusionStrength',
      onAssign: info => {
        material.occlusionTexture = info;
      },
    });

    applyTexture('emissiveTexture', {
      texCoordParam: 'emissiveTexcoordIndex',
      transform: {
        scale: 'emissiveTextureTransformScale',
        offset: 'emissiveTextureTransformOffset',
        rotation: 'emissiveTextureTransformRotation',
      },
      onAssign: info => {
        material.emissiveTexture = info;
      },
    });
  }

  private static __removeUnusedAccessorsAndBufferViews(json: Gltf2Ex) {
    if (json.accessors.length === 0) {
      this.__recalculateBufferViewAccumulators(json);
      return;
    }

    this.__removeUnusedAccessors(json);

    if (json.bufferViews.length === 0) {
      this.__recalculateBufferViewAccumulators(json);
      return;
    }

    this.__removeUnusedBufferViews(json);
    this.__recalculateBufferViewAccumulators(json);
  }

  private static __removeUnusedAccessors(json: Gltf2Ex) {
    const usedAccessorIndices = this.__collectUsedAccessorIndices(json);
    const result = this.__filterItemsByUsage(json.accessors, usedAccessorIndices);
    if (!result) {
      return;
    }

    const { filtered, indexMap } = result;
    json.accessors = filtered;
    this.__remapAccessorReferences(json, indexMap);
  }

  private static __collectUsedAccessorIndices(json: Gltf2Ex) {
    const usedAccessorIndices = new Set<number>();
    const registerAccessor = (candidate: unknown) => {
      if (typeof candidate === 'number' && candidate >= 0) {
        usedAccessorIndices.add(candidate);
      }
    };

    this.__collectAccessorIndicesFromMeshes(json, registerAccessor);
    this.__collectAccessorIndicesFromSkins(json, registerAccessor);
    this.__collectAccessorIndicesFromAnimations(json, registerAccessor);

    return usedAccessorIndices;
  }

  private static __collectAccessorIndicesFromMeshes(json: Gltf2Ex, register: (candidate: unknown) => void) {
    if (Is.not.exist(json.meshes)) {
      return;
    }
    for (const mesh of json.meshes) {
      if (Is.not.exist(mesh?.primitives)) {
        continue;
      }
      for (const primitive of mesh.primitives) {
        register(primitive.indices);
        const attributes = primitive.attributes as Record<string, number | undefined> | undefined;
        if (Is.exist(attributes)) {
          for (const key of Object.keys(attributes)) {
            register(attributes[key]);
          }
        }
        if (Array.isArray(primitive.targets)) {
          for (const target of primitive.targets) {
            const targetAttributes = target as Record<string, number | undefined>;
            for (const key of Object.keys(targetAttributes)) {
              register(targetAttributes[key]);
            }
          }
        }
      }
    }
  }

  private static __collectAccessorIndicesFromSkins(json: Gltf2Ex, register: (candidate: unknown) => void) {
    if (Is.not.exist(json.skins)) {
      return;
    }
    for (const skin of json.skins) {
      register(skin.inverseBindMatrices);
    }
  }

  private static __collectAccessorIndicesFromAnimations(json: Gltf2Ex, register: (candidate: unknown) => void) {
    if (Is.not.exist(json.animations)) {
      return;
    }
    for (const animation of json.animations) {
      if (Is.not.exist(animation?.samplers)) {
        continue;
      }
      for (const sampler of animation.samplers) {
        register(sampler.input);
        register(sampler.output);
      }
    }
  }

  private static __remapAccessorReferences(json: Gltf2Ex, indexMap: Map<number, number>) {
    const mapAccessorIndex = (candidate: unknown): number | undefined => {
      if (typeof candidate !== 'number') {
        return undefined;
      }
      return indexMap.get(candidate);
    };

    if (Is.exist(json.meshes)) {
      for (const mesh of json.meshes) {
        if (Is.not.exist(mesh?.primitives)) {
          continue;
        }
        for (const primitive of mesh.primitives) {
          if (typeof primitive.indices === 'number') {
            const mapped = mapAccessorIndex(primitive.indices);
            primitive.indices = typeof mapped === 'number' ? mapped : undefined;
          }
          const attributes = primitive.attributes as Record<string, number | undefined> | undefined;
          this.__remapAccessorAttributeRecord(attributes, mapAccessorIndex);
          if (Array.isArray(primitive.targets)) {
            for (const target of primitive.targets) {
              this.__remapAccessorAttributeRecord(target as Record<string, number | undefined>, mapAccessorIndex);
            }
          }
        }
      }
    }

    if (Is.exist(json.skins)) {
      for (const skin of json.skins) {
        if (typeof skin.inverseBindMatrices === 'number') {
          const mapped = mapAccessorIndex(skin.inverseBindMatrices);
          skin.inverseBindMatrices = typeof mapped === 'number' ? mapped : undefined;
        }
      }
    }

    if (Is.exist(json.animations)) {
      for (const animation of json.animations) {
        if (Is.not.exist(animation?.samplers)) {
          continue;
        }
        for (const sampler of animation.samplers) {
          const mappedInput = mapAccessorIndex(sampler.input);
          const mappedOutput = mapAccessorIndex(sampler.output);
          if (typeof mappedInput === 'number') {
            sampler.input = mappedInput;
          }
          if (typeof mappedOutput === 'number') {
            sampler.output = mappedOutput;
          }
        }
      }
    }
  }

  private static __remapAccessorAttributeRecord(
    attributes: Record<string, number | undefined> | undefined,
    mapAccessorIndex: (candidate: unknown) => number | undefined
  ) {
    if (Is.not.exist(attributes)) {
      return;
    }
    for (const key of Object.keys(attributes)) {
      const mapped = mapAccessorIndex(attributes[key]);
      if (typeof mapped === 'number') {
        attributes[key] = mapped;
      } else {
        delete attributes[key];
      }
    }
  }

  private static __removeUnusedBufferViews(json: Gltf2Ex) {
    const usedBufferViewIndices = this.__collectUsedBufferViewIndices(json);
    const result = this.__filterItemsByUsage(json.bufferViews, usedBufferViewIndices);
    if (!result) {
      return;
    }

    const { filtered, indexMap } = result;
    json.bufferViews = filtered;
    this.__remapBufferViewReferences(json, indexMap);
  }

  private static __collectUsedBufferViewIndices(json: Gltf2Ex) {
    const usedBufferViewIndices = new Set<number>();
    for (const accessor of json.accessors) {
      if (typeof accessor.bufferView === 'number') {
        usedBufferViewIndices.add(accessor.bufferView);
      }
    }
    if (Is.exist(json.images)) {
      for (const image of json.images) {
        if (typeof image.bufferView === 'number') {
          usedBufferViewIndices.add(image.bufferView);
        }
      }
    }
    return usedBufferViewIndices;
  }

  private static __remapBufferViewReferences(json: Gltf2Ex, indexMap: Map<number, number>) {
    for (const accessor of json.accessors) {
      if (typeof accessor.bufferView === 'number') {
        const mapped = indexMap.get(accessor.bufferView);
        accessor.bufferView = typeof mapped === 'number' ? mapped : undefined;
      }
    }

    if (Is.exist(json.images)) {
      for (const image of json.images) {
        if (typeof image.bufferView === 'number') {
          const mapped = indexMap.get(image.bufferView);
          image.bufferView = typeof mapped === 'number' ? mapped : undefined;
        }
      }
    }
  }

  private static __filterItemsByUsage<T>(
    items: T[],
    usedIndices: Set<number>
  ): { filtered: T[]; indexMap: Map<number, number> } | undefined {
    if (usedIndices.size === items.length) {
      return undefined;
    }

    const filtered: T[] = [];
    const indexMap = new Map<number, number>();
    items.forEach((item, idx) => {
      if (usedIndices.has(idx)) {
        indexMap.set(idx, filtered.length);
        filtered.push(item);
      }
    });

    return { filtered, indexMap };
  }

  private static __recalculateBufferViewAccumulators(json: Gltf2Ex) {
    if (Is.not.exist(json.buffers) || json.buffers.length === 0) {
      json.extras.bufferViewByteLengthAccumulatedArray = [];
      return;
    }

    const accumulators = new Array(json.buffers.length).fill(0);
    for (const bufferView of json.bufferViews) {
      const bufferIdx = typeof bufferView.buffer === 'number' ? bufferView.buffer : 0;
      const sourceLength = bufferView.extras?.uint8Array?.byteLength;
      const effectiveLength = Math.max(bufferView.byteLength, Is.exist(sourceLength) ? sourceLength! : 0);
      const alignedLength = DataUtil.addPaddingBytes(effectiveLength, 4);
      accumulators[bufferIdx] += alignedLength;
    }
    json.extras.bufferViewByteLengthAccumulatedArray = accumulators;
  }

  /**
   * Creates the binary buffer containing all mesh, animation, and texture data.
   *
   * Consolidates all buffer views into a single binary buffer with proper
   * alignment and padding according to glTF2 specification. Handles data
   * copying and memory layout optimization.
   *
   * @param json - The glTF2 JSON document containing buffer view definitions
   * @returns ArrayBuffer containing the consolidated binary data
   */
  private static __createBinary(json: Gltf2Ex) {
    // write all data of accessors to the DataView (total data area)
    if (Is.undefined(json.accessors) || Is.undefined(json.bufferViews)) {
      return new ArrayBuffer(0);
    }

    const byteLengthOfUniteBuffer = json.bufferViews.reduce((sum, bufferView) => {
      const source = bufferView.extras?.uint8Array;
      if (Is.not.exist(source)) {
        return sum + DataUtil.addPaddingBytes(bufferView.byteLength, 4);
      }
      return sum + DataUtil.addPaddingBytes(source.byteLength, 4);
    }, 0);

    if (byteLengthOfUniteBuffer > 0) {
      const buffer = json.buffers![0];
      buffer.byteLength = byteLengthOfUniteBuffer + DataUtil.calcPaddingBytes(byteLengthOfUniteBuffer, 4);
    }

    // create the ArrayBuffer of unite Buffer (consist of multiple Buffers)
    const arrayBuffer = new ArrayBuffer(json.buffers![0].byteLength);

    // copy BufferViews in multiple Buffer to the Unite Buffer
    let lastCopiedByteLengthOfBufferView = 0;
    for (let i = 0; i < json.bufferViews.length; i++) {
      const bufferView = json.bufferViews[i];
      const uint8ArrayOfBufferView = bufferView.extras!.uint8Array!;
      (bufferView as unknown as Gltf2).extras = undefined;

      const distByteOffset = lastCopiedByteLengthOfBufferView;
      DataUtil.copyArrayBufferWithPadding({
        src: uint8ArrayOfBufferView.buffer as ArrayBuffer,
        dist: arrayBuffer,
        srcByteOffset: uint8ArrayOfBufferView.byteOffset,
        copyByteLength: uint8ArrayOfBufferView.byteLength,
        distByteOffset,
      });
      lastCopiedByteLengthOfBufferView += DataUtil.addPaddingBytes(uint8ArrayOfBufferView.byteLength, 4);
      bufferView.byteOffset = distByteOffset;
      bufferView.buffer = 0; // rewrite buffer index to 0 (The Unite Buffer)
    }

    return arrayBuffer;
  }

  /**
   * Initiates download of the exported glTF2 data as a .glb file.
   *
   * Creates a downloadable .glb file containing the complete glTF2 scene
   * in binary format. Uses browser download API to save the file locally.
   *
   * @param json - The glTF2 JSON document
   * @param filename - Base filename for the download
   * @param arraybuffer - Binary data buffer containing the .glb file
   */
  static __downloadGlb(_json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void {
    {
      const a = document.createElement('a');
      a.download = `${filename}.glb`;
      const blob = new Blob([arraybuffer], { type: 'octet/stream' });
      const url = URL.createObjectURL(blob);
      a.href = url;

      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
  }

  /**
   * Placeholder method for future glTF2 ArrayBuffer export functionality.
   *
   * This method is reserved for implementing glTF2 export that returns
   * an ArrayBuffer without triggering a download.
   */
  exportGlbAsArrayBuffer() {}

  /**
   * Initiates download of the exported glTF2 data as separate .gltf and .bin files.
   *
   * Creates downloadable .gltf (JSON) and .bin (binary) files representing
   * the complete glTF2 scene in text format with external binary references.
   *
   * @param json - The glTF2 JSON document
   * @param filename - Base filename for the downloads
   * @param arraybuffer - Binary data buffer for the .bin file
   */
  static __downloadGltf(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void {
    {
      // .gltf file
      const a = document.createElement('a');

      a.download = `${filename}.gltf`;
      const str = JSON.stringify(json, null, 2);
      a.href = `data:application/octet-stream,${encodeURIComponent(str)}`;

      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
    {
      // .bin file
      const a = document.createElement('a');
      a.download = `${filename}.bin`;
      const blob = new Blob([arraybuffer], { type: 'octet/stream' });
      const url = URL.createObjectURL(blob);
      a.href = url;
      const e = new MouseEvent('click');
      a.dispatchEvent(e);
    }
  }
}

/**
 * Creates glTF2 skins from skeletal animation data.
 *
 * Processes skeletal entities to create glTF2 skin objects containing joint
 * hierarchies, inverse bind matrices, and skeletal structure information
 * required for proper skeletal animation in glTF2 format.
 *
 * @param json - The glTF2 JSON document to populate with skin data
 * @param entities - Skeletal entities to process
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
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

    const inverseBindMatRnAccessor = skeletalComponent.getInverseBindMatricesAccessor();
    if (Is.exist(inverseBindMatRnAccessor)) {
      const gltf2BufferView = createOrReuseGltf2BufferView(
        json,
        existingUniqueRnBuffers,
        existingUniqueRnBufferViews,
        inverseBindMatRnAccessor.bufferView
      );

      createOrReuseGltf2Accessor(
        json,
        json.bufferViews.indexOf(gltf2BufferView),
        existingUniqueRnAccessors,
        inverseBindMatRnAccessor
      );
    }

    const topOfJointsSkeletonSceneComponent = skeletalComponent.topOfJointsHierarchy;
    const bindShapeMatrix = skeletalComponent._bindShapeMatrix;
    let skeletalIdx = -1;
    if (Is.exist(topOfJointsSkeletonSceneComponent)) {
      const skeletalEntity = topOfJointsSkeletonSceneComponent.entity as ISkeletalEntity;
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
 * Creates BufferViews and Accessors for mesh geometry data.
 *
 * Processes mesh entities to extract vertex attributes, indices, and blend shape
 * data, creating the necessary glTF2 buffer views and accessors. Handles
 * deduplication and proper memory layout for efficient storage.
 *
 * @param json - The glTF2 JSON document to populate
 * @param entities - Mesh entities to process
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
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
      const mesh: Gltf2Mesh = { primitives: [] };
      const rnMesh = meshComponent.mesh;
      const primitiveCount = rnMesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveCount; j++) {
        const rnPrimitive = rnMesh.getPrimitiveAt(j);
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
        const exportAttributeSemantics = rnPrimitive.attributeSemantics.concat();
        const exportAttributeAccessors = rnPrimitive.attributeAccessors.concat();

        const needsTangents = doesRhodoniteMaterialRequireTangents(rnPrimitive.material);
        if (needsTangents) {
          const tangentSemanticIndex = exportAttributeSemantics.findIndex(semantic => semantic.startsWith('TANGENT'));
          const exportTangentAccessor = getExportTangentAccessorForPrimitive(rnPrimitive);
          if (Is.exist(exportTangentAccessor)) {
            if (tangentSemanticIndex >= 0) {
              exportAttributeAccessors[tangentSemanticIndex] = exportTangentAccessor;
            } else {
              exportAttributeSemantics.push(VertexAttribute.Tangent.XYZ);
              exportAttributeAccessors.push(exportTangentAccessor);
            }
          }
        }

        for (let attrIndex = 0; attrIndex < exportAttributeAccessors.length; attrIndex++) {
          const attributeJoinedString = exportAttributeSemantics[attrIndex] as string;
          const attributeName = attributeJoinedString.split('.')[0];
          if (attributeName === 'BARY_CENTRIC_COORD') {
            continue;
          }
          // create a Gltf2BufferView
          const rnAttributeAccessor = exportAttributeAccessors[attrIndex];

          // Normalize normals if needed
          let normalizedAccessor = rnAttributeAccessor;
          if (attributeName === 'NORMAL') {
            normalizedAccessor = normalizeNormals(rnAttributeAccessor);
          } else if (attributeName === 'WEIGHTS_0') {
            normalizedAccessor = normalizeSkinWeights(rnAttributeAccessor);
          }

          const rnBufferView = normalizedAccessor.bufferView;
          const gltf2BufferView = createOrReuseGltf2BufferViewForVertexAttributeBuffer(
            json,
            existingUniqueRnBuffers,
            existingUniqueRnBufferViews,
            rnBufferView,
            normalizedAccessor
          );
          const gltf2Accessor = createOrReuseGltf2Accessor(
            json,
            json.bufferViews.indexOf(gltf2BufferView),
            existingUniqueRnAccessors,
            normalizedAccessor
          );

          const accessorIdx = json.accessors.indexOf(gltf2Accessor);
          primitive.attributes[attributeName] = accessorIdx;
        }
        // BlendShape
        setupBlendShapeData(
          entity,
          rnPrimitive,
          primitive,
          json,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          existingUniqueRnAccessors
        );
        mesh.primitives[j] = primitive;
      }
      json.meshes.push(mesh);
    }
  }
}

/**
 * Creates BufferViews and Accessors for animation data.
 *
 * Processes animation entities to extract keyframe data, creating the necessary
 * glTF2 animation samplers, channels, and associated buffer views and accessors
 * for proper animation playback.
 *
 * @param json - The glTF2 JSON document to populate with animation data
 * @param entities - Animation entities to process
 */
function __createBufferViewsAndAccessorsOfAnimation(json: Gltf2Ex, entities: IAnimationEntity[]): void {
  let sumOfBufferViewByteLengthAccumulated = 0;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length;
  const animationRegistry = new Map<AnimationTrackName, { animation: Gltf2Animation; samplerIdx: number }>();

  const acquireAnimation = (trackName: AnimationTrackName) => {
    let entry = animationRegistry.get(trackName);
    if (Is.not.exist(entry)) {
      const animation: Gltf2Animation = {
        name: trackName,
        channels: [],
        samplers: [],
      };
      json.animations.push(animation);
      entry = { animation, samplerIdx: 0 };
      animationRegistry.set(trackName, entry);
    }
    return entry;
  };

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const animationComponent = entity.tryToGetAnimation();
    if (Is.exist(animationComponent)) {
      const rnAnimationTrack = animationComponent.getAnimationChannelsOfTrack();
      const rnChannels = rnAnimationTrack.values();
      for (const rnChannel of rnChannels) {
        if (rnChannel.target.pathName === 'effekseer') {
          continue;
        }

        const animatedValue = rnChannel.animatedValue;
        const trackNames = animatedValue.getAllTrackNames();
        for (const trackName of trackNames) {
          const animationEntry = acquireAnimation(trackName);
          const animation = animationEntry.animation;

          // create and register Gltf2BufferView and Gltf2Accessor
          //   and set Input animation data as Uint8Array to the Gltf2Accessor
          const { inputAccessorIdx, inputBufferViewByteLengthAccumulated } =
            createGltf2BufferViewAndGltf2AccessorForInput(
              json,
              animatedValue.getAnimationSampler(trackName),
              bufferIdx,
              sumOfBufferViewByteLengthAccumulated
            );

          sumOfBufferViewByteLengthAccumulated += inputBufferViewByteLengthAccumulated;

          // create and register Gltf2BufferView and Gltf2Accessor
          //   and set Output animation data as Uint8Array to the Gltf2Accessor
          const { outputAccessorIdx, outputBufferViewByteLengthAccumulated } =
            createGltf2BufferViewAndGltf2AccessorForOutput(
              json,
              animatedValue.getAnimationSampler(trackName),
              rnChannel.target.pathName,
              bufferIdx,
              sumOfBufferViewByteLengthAccumulated
            );
          sumOfBufferViewByteLengthAccumulated += outputBufferViewByteLengthAccumulated;

          // Create Gltf2AnimationChannel
          animationEntry.samplerIdx = createGltf2AnimationChannel(rnChannel, animationEntry.samplerIdx, animation, i);

          // Create Gltf2AnimationSampler
          createGltf2AnimationSampler(
            inputAccessorIdx,
            outputAccessorIdx,
            animatedValue.getAnimationSampler(trackName),
            animation
          );
        }
      }
    }
  }
  json.extras.bufferViewByteLengthAccumulatedArray.push(sumOfBufferViewByteLengthAccumulated);
}

/**
 * Handles texture image processing for different export formats.
 *
 * Processes texture images for inclusion in glTF2 export, handling both
 * separate file downloads and embedded binary formats depending on export type.
 *
 * @param json - The glTF2 JSON document
 * @param bufferIdx - Index of the target buffer
 * @param blob - Image data as a Blob
 * @param option - Export options affecting image handling
 * @param glTF2ImageEx - The glTF2 image object to populate
 * @param resolve - Promise resolve callback
 * @param rejected - Promise reject callback
 */
async function handleTextureImage(
  json: Gltf2Ex,
  bufferIdx: Index,
  blob: Blob,
  option: Gltf2ExporterArguments,
  glTF2ImageEx: Gltf2Image,
  resolve: (v?: ArrayBuffer) => void,
  rejected: (reason?: DOMException) => void
) {
  if (option.type === GLTF2_EXPORT_GLTF) {
    setTimeout(() => {
      const a = document.createElement('a');
      const e = new MouseEvent('click');
      a.href = URL.createObjectURL(blob!);
      a.download = glTF2ImageEx.uri!;
      a.dispatchEvent(e);
      URL.revokeObjectURL(a.href);
    }, Math.random() * 5000);
    resolve();
  } else {
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
      glTF2ImageEx.uri = undefined;
      resolve();
    });
    reader.addEventListener('error', () => {
      rejected(reader.error as DOMException);
    });
    reader.readAsArrayBuffer(blob);
  }
}

///
/// BufferView and Accessor Creaters
///
