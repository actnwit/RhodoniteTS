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
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import type { Mesh } from '../geometry/Mesh';
import type { Primitive } from '../geometry/Primitive';
import type { IAnimationEntity, IMeshEntity, ISceneGraphEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import { MathUtil } from '../math/MathUtil';
import { Quaternion } from '../math/Quaternion';
import type { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Accessor } from '../memory/Accessor';
import { Buffer } from '../memory/Buffer';
import { BufferView } from '../memory/BufferView';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';
import { createEffekseer } from './Gltf2ExporterEffekseer';
import { createAndAddGltf2BufferView } from './Gltf2ExporterOps';

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
          delete node.children;
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

    // According to glTF specification, nodes with both skin and mesh should be placed directly under the root without local transforms.
    // Remove them from their parent's children, strip TRS properties, and relocate them to the root node set.
    for (const nodeIndex of skinnedMeshNodeIndices) {
      const node = json.nodes[nodeIndex];
      const parentIdx = parentNodeIndices[nodeIndex];
      if (Is.exist(parentIdx)) {
        const parentNode = json.nodes[parentIdx];
        if (Is.exist(parentNode.children)) {
          parentNode.children = parentNode.children.filter(childIdx => childIdx !== nodeIndex);
          if (parentNode.children.length === 0) {
            delete parentNode.children;
          }
        }
        parentNodeIndices[nodeIndex] = undefined;
      }

      delete node.translation;
      delete node.rotation;
      delete node.scale;

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
      delete attributes.TANGENT;
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
    return Is.exist(clearcoatExtension?.clearcoatNormalTexture);
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
      if (rnTexture && rnTexture.width > 1 && rnTexture.height > 1) {
        const samplerIdx = processSampler(rnSampler);
        const imageIndex = processImage(rnTexture);

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

    Gltf2Exporter.__outputKhrMaterialsClearcoatInfo(
      ensureExtensionUsed,
      coerceNumber,
      rnMaterial,
      applyTexture,
      material
    );
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

    const usedAccessorIndices = new Set<number>();
    const registerAccessor = (candidate: unknown) => {
      if (typeof candidate === 'number' && candidate >= 0) {
        usedAccessorIndices.add(candidate);
      }
    };

    if (Is.exist(json.meshes)) {
      for (const mesh of json.meshes) {
        if (Is.not.exist(mesh?.primitives)) {
          continue;
        }
        for (const primitive of mesh.primitives) {
          registerAccessor(primitive.indices);
          const attributes = primitive.attributes as Record<string, number | undefined> | undefined;
          if (Is.exist(attributes)) {
            for (const key of Object.keys(attributes)) {
              registerAccessor(attributes[key]);
            }
          }
          if (Array.isArray(primitive.targets)) {
            for (const target of primitive.targets) {
              const targetAttributes = target as Record<string, number | undefined>;
              for (const key of Object.keys(targetAttributes)) {
                registerAccessor(targetAttributes[key]);
              }
            }
          }
        }
      }
    }

    if (Is.exist(json.skins)) {
      for (const skin of json.skins) {
        registerAccessor(skin.inverseBindMatrices);
      }
    }

    if (Is.exist(json.animations)) {
      for (const animation of json.animations) {
        if (Is.not.exist(animation?.samplers)) {
          continue;
        }
        for (const sampler of animation.samplers) {
          registerAccessor(sampler.input);
          registerAccessor(sampler.output);
        }
      }
    }

    const accessorIndexMap = new Map<number, number>();
    const filteredAccessors: typeof json.accessors = [];
    json.accessors.forEach((accessor, idx) => {
      if (usedAccessorIndices.has(idx)) {
        accessorIndexMap.set(idx, filteredAccessors.length);
        filteredAccessors.push(accessor);
      }
    });

    if (filteredAccessors.length !== json.accessors.length) {
      json.accessors = filteredAccessors;

      const mapAccessorIndex = (candidate: unknown): number | undefined => {
        if (typeof candidate !== 'number') {
          return undefined;
        }
        return accessorIndexMap.get(candidate);
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
            if (Is.exist(attributes)) {
              for (const key of Object.keys(attributes)) {
                const mapped = mapAccessorIndex(attributes[key]);
                if (typeof mapped === 'number') {
                  attributes[key] = mapped;
                } else {
                  delete attributes[key];
                }
              }
            }
            if (Array.isArray(primitive.targets)) {
              for (const target of primitive.targets) {
                const targetAttributes = target as Record<string, number | undefined>;
                for (const key of Object.keys(targetAttributes)) {
                  const mapped = mapAccessorIndex(targetAttributes[key]);
                  if (typeof mapped === 'number') {
                    targetAttributes[key] = mapped;
                  } else {
                    delete targetAttributes[key];
                  }
                }
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

    if (json.bufferViews.length === 0) {
      this.__recalculateBufferViewAccumulators(json);
      return;
    }

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

    const bufferViewIndexMap = new Map<number, number>();
    const filteredBufferViews: typeof json.bufferViews = [];
    json.bufferViews.forEach((bufferView, idx) => {
      if (usedBufferViewIndices.has(idx)) {
        bufferViewIndexMap.set(idx, filteredBufferViews.length);
        filteredBufferViews.push(bufferView);
      }
    });

    if (filteredBufferViews.length !== json.bufferViews.length) {
      json.bufferViews = filteredBufferViews;

      for (const accessor of json.accessors) {
        if (typeof accessor.bufferView === 'number') {
          const mapped = bufferViewIndexMap.get(accessor.bufferView);
          accessor.bufferView = typeof mapped === 'number' ? mapped : undefined;
        }
      }

      if (Is.exist(json.images)) {
        for (const image of json.images) {
          if (typeof image.bufferView === 'number') {
            const mapped = bufferViewIndexMap.get(image.bufferView);
            image.bufferView = typeof mapped === 'number' ? mapped : undefined;
          }
        }
      }
    }

    this.__recalculateBufferViewAccumulators(json);
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

type NumericArrayBufferView = ArrayBufferView & { length: number; [index: number]: number };

function isNumericArrayBufferView(view: ArrayBufferView): view is NumericArrayBufferView {
  return typeof (view as any).length === 'number';
}

/**
 * Generates a complete glTF2 Binary (.glb) ArrayBuffer from JSON and binary data.
 *
 * Combines the glTF2 JSON document and binary buffer into a single .glb file
 * following the glTF2 binary format specification. Handles proper chunk
 * alignment and header construction.
 *
 * @param json - The glTF2 JSON document to embed
 * @param arraybuffer - Binary data buffer to include
 * @returns Complete .glb file as ArrayBuffer
 */
function generateGlbArrayBuffer(json: Gltf2, arraybuffer: ArrayBuffer) {
  const headerBytes = 12; // 12byte-header

  // .glb file
  json.buffers![0].uri = undefined;
  let jsonStr = JSON.stringify(json, null, 2);
  let jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  const paddingBytes = DataUtil.calcPaddingBytes(jsonArrayBuffer.byteLength, 4);
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
  return glbArrayBuffer;
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
          const attributeJoinedString = rnPrimitive.attributeSemantics[j] as string;
          const attributeName = attributeJoinedString.split('.')[0];
          if (attributeName === 'BARY_CENTRIC_COORD') {
            continue;
          }
          // create a Gltf2BufferView
          const rnAttributeAccessor = attributeAccessors[j];

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
 * Sets up blend shape (morph target) data for a primitive.
 *
 * Processes blend shape targets from Rhodonite format to glTF2 morph targets,
 * creating the necessary accessors and buffer views for vertex attribute deltas.
 *
 * @param entity - The mesh entity containing blend shape data
 * @param rnPrimitive - The Rhodonite primitive with blend shape targets
 * @param primitive - The glTF2 primitive to populate with morph targets
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 */
function setupBlendShapeData(
  entity: IMeshEntity,
  rnPrimitive: Primitive,
  primitive: Gltf2Primitive,
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  existingUniqueRnAccessors: Accessor[]
) {
  const blendShapeComponent = entity.tryToGetBlendShape();
  if (Is.exist(blendShapeComponent)) {
    const targets = rnPrimitive.getBlendShapeTargets();
    if (Is.not.exist(primitive.targets)) {
      primitive.targets = [] as Gltf2AttributeBlendShapes;
    }

    const targetNames = blendShapeComponent.targetNames;
    if (targets.length > 0) {
      const limitedTargetNames = targets.map((_, idx) => targetNames[idx] ?? `MorphTarget_${idx}`);
      primitive.extras = primitive.extras ?? {};
      primitive.extras.targetNames = limitedTargetNames;
    }

    for (const target of targets) {
      const targetJson = {} as Gltf2Attributes;
      for (const [attributeName, rnAccessor] of target.entries()) {
        const gltf2BufferView = createOrReuseGltf2BufferView(
          json,
          existingUniqueRnBuffers,
          existingUniqueRnBufferViews,
          rnAccessor.bufferView,
          GL_ARRAY_BUFFER
        );

        const gltf2Accessor = createOrReuseGltf2Accessor(
          json,
          json.bufferViews.indexOf(gltf2BufferView),
          existingUniqueRnAccessors,
          rnAccessor
        );
        const accessorIdx = json.accessors.indexOf(gltf2Accessor);
        const attributeJoinedString = attributeName;
        const attribute = attributeJoinedString.split('.')[0];
        targetJson[attribute] = accessorIdx;
      }
      primitive.targets.push(targetJson);
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
 * Calculates the appropriate accessor index for deduplication.
 *
 * Searches for an existing accessor that matches the provided one to avoid
 * creating duplicate accessors in the glTF2 output.
 *
 * @param existingUniqueRnAccessors - Array of unique accessors already processed
 * @param rnAccessor - The accessor to find or add
 * @returns Index of existing accessor or -1 if not found
 */
function calcAccessorIdxToSet(existingUniqueRnAccessors: Accessor[], rnAccessor: Accessor) {
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

/**
 * Creates or reuses a glTF2 BufferView for vertex attribute data.
 *
 * Optimizes buffer view creation by checking for existing compatible buffer views
 * and creating new ones only when necessary. Handles proper stride calculation
 * for vertex attributes.
 *
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param rnBufferView - The Rhodonite buffer view to convert
 * @param rnAccessor - The accessor that will use this buffer view
 * @returns The created or existing glTF2 buffer view
 */
function createOrReuseGltf2BufferViewForVertexAttributeBuffer(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  rnAccessor: Accessor
) {
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
    const gltf2BufferView: Gltf2BufferViewEx = {
      buffer: bufferIdxToSet,
      byteLength: rnBufferView.byteLength,
      byteOffset: rnBufferView.byteOffsetInBuffer,
      extras: {
        uint8Array: rnBufferView.getUint8Array(),
      },
    };
    gltf2BufferView.target = GL_ARRAY_BUFFER;

    const resolvedByteStride = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
    if (Is.exist(resolvedByteStride)) {
      gltf2BufferView.byteStride = resolvedByteStride;
    }

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView
    );

    existingUniqueRnBufferViews.push(rnBufferView);
    json.bufferViews.push(gltf2BufferView);
    // const {fixedBufferViewByteLength, fixedBufferViewByteOffset} =
    //   calcBufferViewByteLengthAndByteOffset({
    //     accessorByteOffset: rnAccessor.byteOffsetInBufferView,
    //     accessorCount: rnAccessor.elementCount,
    //     bufferViewByteOffset: gltf2BufferView.byteOffset,
    //     bufferViewByteStride: gltf2BufferView.byteStride!,
    //     sizeOfComponent: rnAccessor.componentType.getSizeInBytes(),
    //     numberOfComponents: rnAccessor.compositionType.getNumberOfComponents(),
    //   });
    // gltf2BufferView.byteLength = fixedBufferViewByteLength;
    return gltf2BufferView;
  }
  const gltf2BufferView = json.bufferViews[bufferViewIdx] as Gltf2BufferViewEx;
  const resolvedByteStride = resolveVertexAttributeByteStride(rnBufferView, rnAccessor);
  if (Is.exist(resolvedByteStride)) {
    const currentStride = gltf2BufferView.byteStride ?? 0;
    if (currentStride === 0 || currentStride < resolvedByteStride) {
      gltf2BufferView.byteStride = resolvedByteStride;
    }
  }
  return gltf2BufferView;
}

/**
 * Finds the index of an existing buffer view in the cache.
 *
 * @param existingUniqueRnBufferViews - Array of unique buffer views
 * @param rnBufferView - The buffer view to search for
 * @returns Index of the buffer view or -1 if not found
 */
function findBufferViewIdx(existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView) {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex(bufferView => bufferView.isSame(rnBufferView));
  return bufferViewIdx;
}

/**
 * Calculates the buffer index for deduplication purposes.
 *
 * @param existingUniqueRnBuffers - Array of unique buffers
 * @param rnBuffer - The buffer to find or add
 * @returns Index where the buffer should be placed
 */
function calcBufferIdxToSet(existingUniqueRnBuffers: Buffer[], rnBuffer: Buffer) {
  if (existingUniqueRnBuffers.length === 0) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  const bufferIdx = existingUniqueRnBuffers.findIndex(buffer => buffer.isSame(rnBuffer));
  const bufferIdxToSet = bufferIdx === -1 ? existingUniqueRnBuffers.length : bufferIdx;
  if (bufferIdx === -1) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  return bufferIdxToSet;
}

/**
 * Accumulates buffer view byte length for proper memory layout.
 *
 * @param bufferViewByteLengthAccumulatedArray - Array tracking accumulated lengths
 * @param bufferIdxToSet - Index of the buffer being processed
 * @param gltf2BufferView - The buffer view to add
 * @returns Updated accumulated byte length
 */
function accumulateBufferViewByteLength(
  bufferViewByteLengthAccumulatedArray: number[],
  bufferIdxToSet: number,
  gltf2BufferView: Gltf2BufferViewEx
) {
  const bufferViewLengthAligned = Is.exist(bufferViewByteLengthAccumulatedArray[bufferIdxToSet])
    ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] + DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4)
    : DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4);

  return bufferViewLengthAligned;
}

/**
 * Converts Rhodonite animation path names to glTF2 format.
 *
 * @param path - The Rhodonite animation path name
 * @returns The corresponding glTF2 animation path name
 * @throws Error if the path name is invalid
 */
function convertToGltfAnimationPathName(path: AnimationPathName): Gltf2AnimationPathName {
  switch (path) {
    case 'translate':
      return 'translation';
    case 'quaternion':
      return 'rotation';
    case 'scale':
      return 'scale';
    case 'weights':
      return 'weights';
    // case 'effekseer':
    //   return 'effekseer';
    default:
      throw new Error('Invalid Path Name');
  }
}

/**
 * Creates a glTF2 animation channel from Rhodonite animation data.
 *
 * @param channel - The Rhodonite animation channel
 * @param samplerIdx - Current sampler index
 * @param animation - The glTF2 animation to add the channel to
 * @param entityIdx - Index of the target entity
 * @returns Updated sampler index
 */
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

/**
 * Creates a glTF2 animation sampler from Rhodonite sampler data.
 *
 * @param inputAccessorIdx - Index of the input (time) accessor
 * @param outputAccessorIdx - Index of the output (value) accessor
 * @param sampler - The Rhodonite animation sampler
 * @param animation - The glTF2 animation to add the sampler to
 */
function createGltf2AnimationSampler(
  inputAccessorIdx: number,
  outputAccessorIdx: number,
  sampler: AnimationSampler,
  animation: Gltf2Animation
) {
  const samplerJson: Gltf2AnimationSampler = {
    input: inputAccessorIdx,
    output: outputAccessorIdx,
    interpolation: sampler.interpolationMethod.GltfString,
  };
  animation.samplers.push(samplerJson);
}

/**
 * Creates BufferView and Accessor for animation input (time) data.
 *
 * @param json - The glTF2 JSON document
 * @param sampler - The animation sampler containing input data
 * @param bufferIdx - Index of the target buffer
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @returns Object containing accessor index and updated byte length
 */
function createGltf2BufferViewAndGltf2AccessorForInput(
  json: Gltf2Ex,
  sampler: AnimationSampler,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
) {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.input) ? sampler.input : new Float32Array(sampler.input)
  );
  const accessorCount = sampler.input.length;
  // create a Gltf2BufferView
  const gltf2BufferView: Gltf2BufferViewEx = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: ComponentType.Float.getSizeInBytes(),
    componentType,
    compositionType: CompositionType.Scalar,
    uint8Array: new Uint8Array(
      ArrayBuffer.isView(sampler.input) ? sampler.input.buffer : new Float32Array(sampler.input).buffer
    ),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType: CompositionType.Scalar,
    min: [sampler.input[0]],
    max: [sampler.input[sampler.input.length - 1]],
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const inputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    inputAccessorIdx,
    inputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

/**
 * Creates BufferView and Accessor for animation output (value) data.
 *
 * @param json - The glTF2 JSON document
 * @param sampler - The animation sampler containing output data
 * @param pathName - The animation path name
 * @param bufferIdx - Index of the target buffer
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @returns Object containing accessor index and updated byte length
 */
function createGltf2BufferViewAndGltf2AccessorForOutput(
  json: Gltf2Ex,
  sampler: AnimationSampler,
  pathName: AnimationPathName,
  bufferIdx: Index,
  bufferViewByteLengthAccumulated: Byte
) {
  const componentType = ComponentType.fromTypedArray(
    ArrayBuffer.isView(sampler.output) ? sampler.output : new Float32Array(sampler.output)
  );

  const compositionType =
    pathName === 'weights'
      ? CompositionType.Scalar
      : CompositionType.toGltf2AnimationAccessorCompositionType(sampler.outputComponentN);
  const accessorCount =
    pathName === 'weights' ? sampler.output.length : sampler.output.length / sampler.outputComponentN;

  // create a Gltf2BufferView
  const gltf2BufferView = createGltf2BufferViewForAnimation({
    bufferIdx,
    bufferViewByteOffset: bufferViewByteLengthAccumulated,
    accessorByteOffset: 0,
    accessorCount,
    bufferViewByteStride: componentType.getSizeInBytes() * sampler.outputComponentN,
    componentType,
    compositionType,
    uint8Array: new Uint8Array(
      ArrayBuffer.isView(sampler.output) ? sampler.output.buffer : new Float32Array(sampler.output).buffer
    ),
  });
  json.bufferViews.push(gltf2BufferView);

  // create a Gltf2Accessor
  const gltf2Accessor: Gltf2AccessorEx = createGltf2AccessorForAnimation({
    bufferViewIdx: json.bufferViews.indexOf(gltf2BufferView),
    accessorByteOffset: 0,
    componentType,
    count: accessorCount,
    compositionType,
  });
  json.accessors.push(gltf2Accessor);

  // register
  bufferViewByteLengthAccumulated = alignBufferViewByteLength(bufferViewByteLengthAccumulated, gltf2BufferView);
  const outputAccessorIdx = json.accessors.indexOf(gltf2Accessor);
  return {
    outputAccessorIdx,
    outputBufferViewByteLengthAccumulated: bufferViewByteLengthAccumulated,
  };
}

/**
 * Type definition for buffer view byte length calculation parameters.
 */
type BufferViewByteLengthDesc = {
  /** Byte offset of the accessor within the buffer view */
  accessorByteOffset: Byte;
  /** Number of elements in the accessor */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Byte offset of the buffer view within the buffer */
  bufferViewByteOffset: Byte;
  /** Size in bytes of each component */
  sizeOfComponent: Byte;
  /** Number of components per element */
  numberOfComponents: number;
};

/**
 * Aligns buffer view byte length to proper boundaries.
 *
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @param bufferView - The buffer view to align
 * @returns Aligned byte length with padding
 */
function alignBufferViewByteLength(bufferViewByteLengthAccumulated: number, bufferView: Gltf2BufferViewEx) {
  const bufferViewEnd = bufferView.byteOffset + bufferView.byteLength;
  const alignedEnd = bufferViewEnd + DataUtil.calcPaddingBytes(bufferViewEnd, 4);
  const delta = alignedEnd - bufferViewByteLengthAccumulated;
  return delta >= 0 ? delta : 0;
}

/**
 * Calculates BufferView byte length and byte offset according to glTF2 specification.
 *
 * Ensures proper data alignment for performance and compatibility. Each element
 * of a vertex attribute must be aligned to 4-byte boundaries inside a bufferView.
 *
 * @param params - Parameters for calculation including offsets and sizes
 * @returns Object containing fixed byte length and offset values
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
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
  const effectiveByteStride = bufferViewByteStride === 0 ? sizeOfComponent * numberOfComponents : bufferViewByteStride;

  // When byteStride is defined,
  //   it MUST be a multiple of the size of the accessor's component type.
  if (bufferViewByteStride % sizeOfComponent !== 0) {
    throw Error(
      "glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor's component type."
    );
  }

  // MUST be 4 bytes aligned
  const effectiveByteStrideAligned = alignBufferViewByteStrideTo4Bytes(effectiveByteStride);
  // MUST be 4 bytes aligned
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  // calc BufferView byteLength as following,
  //
  //  Each accessor MUST fit its bufferView, i.e.,
  //  ```
  //  accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
  //  ```
  //   MUST be less than or equal to bufferView.length.
  const bufferViewByteLength =
    alignedAccessorByteOffset + effectiveByteStrideAligned * (accessorCount - 1) + sizeOfComponent * numberOfComponents;

  // The offset of an accessor into a bufferView (i.e., accessor.byteOffset)
  //   and the offset of an accessor into a buffer (i.e., accessor.byteOffset + bufferView.byteOffset)
  //     MUST be a multiple of the size of the accessor's component type.
  const valByteLength = sizeOfComponent * numberOfComponents;
  const sumByteOffset = alignedAccessorByteOffset + bufferViewByteOffset;
  const paddingByte = valByteLength - (sumByteOffset % valByteLength);
  const fixedBufferViewByteOffset = bufferViewByteOffset + paddingByte;

  // MUST be 4 bytes aligned
  const alignedBufferViewByteOffset = alignAccessorByteOffsetTo4Bytes(fixedBufferViewByteOffset);

  const fixedBufferViewByteLength = bufferViewByteLength;
  return {
    fixedBufferViewByteLength,
    fixedBufferViewByteOffset: alignedBufferViewByteOffset,
  };
}

/**
 * Aligns accessor byte offset to 4-byte boundaries.
 *
 * For performance and compatibility reasons, each element of a vertex attribute
 * must be aligned to 4-byte boundaries inside a bufferView.
 *
 * @param byteOffset - Byte offset that may not be aligned
 * @returns Aligned byte offset
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
function alignAccessorByteOffsetTo4Bytes(byteOffset: Byte): Byte {
  const alignSize = 4;
  if (byteOffset % 4 === 0) {
    return byteOffset;
  }
  return byteOffset + (alignSize - (byteOffset % alignSize));
}

/**
 * Aligns buffer view byte stride to 4-byte boundaries.
 *
 * For performance and compatibility reasons, bufferView.byteStride must be
 * a multiple of 4 for vertex attributes.
 *
 * @param byteStride - Byte stride that may not be aligned
 * @returns Aligned byte stride
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
function alignBufferViewByteStrideTo4Bytes(byteStride: Byte): Byte {
  const alignSize = 4;
  if (byteStride % 4 === 0) {
    return byteStride;
  }
  const byteStrideAlgined = byteStride + (alignSize - (byteStride % alignSize));

  return byteStrideAlgined;
}

/**
 * Resolves the byteStride to be written to a glTF bufferView for vertex attributes.
 *
 * Prefers the bufferView's explicit stride or accessor stride when available and
 * guarantees the result is large enough for the accessor's element width and aligned
 * to 4 bytes to satisfy glTF requirements.
 *
 * @param rnBufferView - Source buffer view
 * @param rnAccessor - Accessor that references the buffer view
 * @returns The resolved stride in bytes or undefined when stride should be omitted
 */
function resolveVertexAttributeByteStride(rnBufferView: BufferView, rnAccessor: Accessor): Byte | undefined {
  const candidates: number[] = [];
  const defaultStride = rnBufferView.defaultByteStride;
  if (defaultStride > 0) {
    candidates.push(defaultStride);
  }
  const accessorStride = rnAccessor.byteStride;
  if (accessorStride > 0) {
    candidates.push(accessorStride);
  }
  const elementSize = rnAccessor.elementSizeInBytes;
  if (elementSize > 0) {
    candidates.push(elementSize);
  }

  if (candidates.length === 0) {
    return undefined;
  }

  const resolved = Math.max(...candidates);
  const aligned = alignBufferViewByteStrideTo4Bytes(resolved as Byte);

  return aligned < elementSize ? elementSize : aligned;
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

/**
 * Parameters for creating a glTF2 accessor.
 */
interface Gltf2AccessorDesc {
  /** Index of the buffer view */
  bufferViewIdx: Index;
  /** Byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Component type (e.g., FLOAT, UNSIGNED_SHORT) */
  componentType: ComponentTypeEnum;
  /** Number of elements */
  count: Count;
  /** Composition type (e.g., VEC3, MAT4) */
  compositionType: CompositionTypeEnum;
  /** Minimum values for each component */
  min?: Array1to4<number>;
  /** Maximum values for each component */
  max?: Array1to4<number>;
}

/**
 * Parameters for creating a glTF2 buffer view.
 */
interface Gltf2BufferViewDesc {
  /** Index of the buffer */
  bufferIdx: Index;
  /** Byte offset within the buffer */
  bufferViewByteOffset: Byte;
  /** Accessor byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Number of accessor elements */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Component type */
  componentType: ComponentTypeEnum;
  /** Composition type */
  compositionType: CompositionTypeEnum;
  /** Raw data as Uint8Array */
  uint8Array: Uint8Array;
}

/**
 * Creates a glTF2 BufferView for animation data.
 *
 * @param params - Parameters for buffer view creation
 * @returns Created glTF2 buffer view with proper alignment
 */
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
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const { fixedBufferViewByteLength, fixedBufferViewByteOffset } = calcBufferViewByteLengthAndByteOffset({
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
    extras: {
      uint8Array,
    },
  };

  return gltfBufferViewEx;
}

/**
 * Creates a glTF2 Accessor for animation data.
 *
 * @param params - Parameters for accessor creation
 * @returns Created glTF2 accessor with proper type information
 */
function createGltf2AccessorForAnimation({
  bufferViewIdx,
  accessorByteOffset,
  componentType,
  count,
  compositionType,
  min,
  max,
}: Gltf2AccessorDesc): Gltf2AccessorEx {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

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

/**
 * Creates or reuses a glTF2 BufferView for general use.
 *
 * @param json - The glTF2 JSON document
 * @param existingUniqueRnBuffers - Buffer deduplication cache
 * @param existingUniqueRnBufferViews - BufferView deduplication cache
 * @param rnBufferView - The Rhodonite buffer view to convert
 * @param target - Optional target binding (e.g., ARRAY_BUFFER)
 * @returns The created or existing glTF2 buffer view
 */
function createOrReuseGltf2BufferView(
  json: Gltf2Ex,
  existingUniqueRnBuffers: Buffer[],
  existingUniqueRnBufferViews: BufferView[],
  rnBufferView: BufferView,
  target?: number
) {
  const bufferViewIdx = findBufferViewIdx(existingUniqueRnBufferViews, rnBufferView);
  if (bufferViewIdx === -1) {
    const bufferIdxToSet = calcBufferIdxToSet(existingUniqueRnBuffers, rnBufferView.buffer);
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

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
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

/**
 * Creates or reuses a glTF2 Accessor with deduplication.
 *
 * @param json - The glTF2 JSON document
 * @param bufferViewIdxToSet - Index of the buffer view to use
 * @param existingUniqueRnAccessors - Accessor deduplication cache
 * @param rnAccessor - The Rhodonite accessor to convert
 * @returns The created or existing glTF2 accessor
 */
function createOrReuseGltf2Accessor(
  json: Gltf2Ex,
  bufferViewIdxToSet: Index,
  existingUniqueRnAccessors: Accessor[],
  rnAccessor: Accessor
) {
  const accessorIdx = calcAccessorIdxToSet(existingUniqueRnAccessors, rnAccessor);
  if (accessorIdx === -1) {
    // create a Gltf2Accessor
    const gltf2Accessor: Gltf2AccessorEx = {
      bufferView: bufferViewIdxToSet,
      byteOffset: rnAccessor.byteOffsetInBufferView,
      componentType: ComponentType.toGltf2AccessorComponentType(rnAccessor.componentType as Gltf2AccessorComponentType),
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

/**
 * Normalizes normal vectors in an accessor.
 *
 * Creates a new accessor with normalized normal vectors from the input accessor.
 * Each normal vector is normalized to unit length.
 *
 * @param accessor - The accessor containing normal vectors to normalize
 * @returns A new accessor with normalized normal vectors
 */
function normalizeNormals(accessor: Accessor): Accessor {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;

  // Read the normal data
  const normalData = new Float32Array(elementCount * componentCount);
  if (componentCount === 3) {
    // VEC3
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec3(i, {});
      normalData[i * 3 + 0] = vec.x;
      normalData[i * 3 + 1] = vec.y;
      normalData[i * 3 + 2] = vec.z;
    }
  } else if (componentCount === 2) {
    // VEC2
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec2(i, {});
      normalData[i * 2 + 0] = vec.x;
      normalData[i * 2 + 1] = vec.y;
    }
  } else if (componentCount === 4) {
    // VEC4
    for (let i = 0; i < elementCount; i++) {
      const vec = accessor.getVec4(i, {});
      normalData[i * 4 + 0] = vec.x;
      normalData[i * 4 + 1] = vec.y;
      normalData[i * 4 + 2] = vec.z;
      normalData[i * 4 + 3] = vec.w;
    }
  } else {
    // Fallback: scalar
    for (let i = 0; i < elementCount; i++) {
      normalData[i] = accessor.getScalar(i, {});
    }
  }

  // Normalize each normal vector
  for (let i = 0; i < elementCount; i++) {
    const offset = i * componentCount;
    let length = 0;

    // Calculate length
    for (let j = 0; j < componentCount; j++) {
      const value = normalData[offset + j];
      length += value * value;
    }
    length = Math.sqrt(length);

    // Normalize if length is not zero
    if (length > 0) {
      for (let j = 0; j < componentCount; j++) {
        normalData[offset + j] /= length;
      }
    }
  }

  // Create new buffer and buffer view with normalized data
  const arrayBuffer = normalData.buffer;
  const newBuffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'NormalizedNormalsBuffer',
    byteAlign: 4,
  });
  const newBufferView = new BufferView({
    buffer: newBuffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: normalData.byteLength,
    raw: arrayBuffer,
  });

  // Create new accessor with the same properties but different data
  const newAccessor = new Accessor({
    bufferView: newBufferView,
    byteOffsetInBufferView: 0,
    compositionType: accessor.compositionType,
    componentType: accessor.componentType,
    byteStride: 0,
    count: elementCount,
    raw: arrayBuffer,
    arrayLength: 1,
    normalized: false,
  });

  return newAccessor;
}

type WeightTypedArray = Float32Array | Uint8Array | Uint16Array | Uint32Array;

function normalizeSkinWeights(accessor: Accessor): Accessor {
  const componentCount = accessor.compositionType.getNumberOfComponents();
  const elementCount = accessor.elementCount;
  if (componentCount === 0 || elementCount === 0) {
    return accessor;
  }

  const treatAsNormalizedUnsignedInt =
    accessor.normalized &&
    (accessor.componentType === ComponentType.UnsignedByte ||
      accessor.componentType === ComponentType.UnsignedShort ||
      accessor.componentType === ComponentType.UnsignedInt);

  const floatData = new Float32Array(elementCount * componentCount);
  const sumEpsilon = 1e-6;
  const diffEpsilon = 1e-6;
  const residualTolerance = 1e-6;
  let mutated = false;
  const normalizationDenominator = treatAsNormalizedUnsignedInt
    ? getNormalizedUnsignedComponentMax(accessor.componentType)
    : 1;

  for (let i = 0; i < elementCount; i++) {
    const baseIndex = i * componentCount;
    let sum = 0;

    for (let j = 0; j < componentCount; j++) {
      const rawValue = accessor.getScalarAt(i, j * accessor.componentSizeInBytes, {});
      let weight = treatAsNormalizedUnsignedInt ? rawValue / normalizationDenominator : rawValue;
      if (!Number.isFinite(weight) || weight < 0) {
        if (weight !== 0) {
          mutated = true;
        }
        weight = 0;
      }
      if (weight > 1) {
        mutated = true;
        weight = 1;
      }
      floatData[baseIndex + j] = weight;
      sum += weight;
    }

    if (sum > sumEpsilon) {
      if (Math.abs(sum - 1) > diffEpsilon) {
        const invSum = 1 / sum;
        let normalizedSum = 0;
        for (let j = 0; j < componentCount; j++) {
          const normalized = Math.fround(floatData[baseIndex + j] * invSum);
          floatData[baseIndex + j] = normalized;
          normalizedSum += normalized;
        }
        const residual = 1 - normalizedSum;
        adjustWeightsForResidual(floatData, baseIndex, componentCount, residual, residualTolerance);
        mutated = true;
      }
    } else if (sum !== 0) {
      for (let j = 0; j < componentCount; j++) {
        floatData[baseIndex + j] = 0;
      }
      mutated = true;
    }
  }

  if (!mutated) {
    return accessor;
  }

  if (treatAsNormalizedUnsignedInt) {
    const typedArray = createUnsignedTypedArray(accessor.componentType, floatData.length);
    const maxValue = normalizationDenominator;

    for (let i = 0; i < elementCount; i++) {
      const baseIndex = i * componentCount;
      const scaled = new Array<number>(componentCount);
      let total = 0;

      for (let j = 0; j < componentCount; j++) {
        const clamped = Math.max(0, Math.min(floatData[baseIndex + j], 1));
        const value = Math.round(clamped * maxValue);
        scaled[j] = value;
        total += value;
      }

      let diff = maxValue - total;
      if (diff !== 0) {
        const indices = [...Array(componentCount).keys()].sort(
          (a, b) => floatData[baseIndex + b] - floatData[baseIndex + a]
        );
        for (const idx of indices) {
          if (diff === 0) {
            break;
          }
          if (diff > 0) {
            const available = maxValue - scaled[idx];
            if (available <= 0) {
              continue;
            }
            const delta = Math.min(available, diff);
            scaled[idx] += delta;
            diff -= delta;
          } else {
            const available = scaled[idx];
            if (available <= 0) {
              continue;
            }
            const delta = Math.min(available, -diff);
            scaled[idx] -= delta;
            diff += delta;
          }
        }
        if (diff !== 0 && indices.length > 0) {
          const idx = indices[0];
          const baseValue = scaled[idx];
          const newValue = Math.max(0, Math.min(maxValue, baseValue + diff));
          diff -= newValue - baseValue;
          scaled[idx] = newValue;
        }
      }

      for (let j = 0; j < componentCount; j++) {
        typedArray[baseIndex + j] = scaled[j];
      }
    }

    return createAccessorFromWeightsTypedArray(typedArray, accessor, accessor.componentType, true);
  }

  const componentTypeForFloat = accessor.componentType.isFloatingPoint() ? accessor.componentType : ComponentType.Float;
  const normalizedFlagForFloat = componentTypeForFloat === accessor.componentType ? accessor.normalized : false;
  return createAccessorFromWeightsTypedArray(floatData, accessor, componentTypeForFloat, normalizedFlagForFloat);
}

function getNormalizedUnsignedComponentMax(componentType: ComponentTypeEnum): number {
  if (componentType === ComponentType.UnsignedByte) {
    return 255;
  }
  if (componentType === ComponentType.UnsignedShort) {
    return 65535;
  }
  if (componentType === ComponentType.UnsignedInt) {
    return 4294967295;
  }
  return 1;
}

function createUnsignedTypedArray(
  componentType: ComponentTypeEnum,
  length: number
): Uint8Array | Uint16Array | Uint32Array {
  if (componentType === ComponentType.UnsignedByte) {
    return new Uint8Array(length);
  }
  if (componentType === ComponentType.UnsignedShort) {
    return new Uint16Array(length);
  }
  if (componentType === ComponentType.UnsignedInt) {
    return new Uint32Array(length);
  }
  throw new Error('Unsupported component type for normalized weights');
}

function createAccessorFromWeightsTypedArray(
  typedArray: WeightTypedArray,
  baseAccessor: Accessor,
  componentType: ComponentTypeEnum,
  normalized: boolean
): Accessor {
  const arrayBuffer = typedArray.buffer as ArrayBuffer;
  const buffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'NormalizedSkinWeightsBuffer',
    byteAlign: 4,
  });
  const bufferView = new BufferView({
    buffer,
    byteOffsetInBuffer: 0,
    defaultByteStride: 0,
    byteLength: arrayBuffer.byteLength,
    raw: arrayBuffer,
  });

  const newAccessor = new Accessor({
    bufferView,
    byteOffsetInBufferView: 0,
    compositionType: baseAccessor.compositionType,
    componentType,
    byteStride: 0,
    count: baseAccessor.elementCount,
    raw: arrayBuffer,
    arrayLength: 1,
    normalized,
  });

  return newAccessor;
}

function adjustWeightsForResidual(
  data: Float32Array,
  offset: number,
  componentCount: number,
  residual: number,
  tolerance: number
) {
  if (componentCount === 0 || Math.abs(residual) <= tolerance) {
    return;
  }

  const indices = Array.from({ length: componentCount }, (_, idx) => idx).sort(
    (a, b) => data[offset + b] - data[offset + a]
  );

  let remaining = residual;
  for (const localIndex of indices) {
    if (Math.abs(remaining) <= tolerance) {
      break;
    }
    const idx = offset + localIndex;
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
    remaining -= candidate - before;
  }

  if (Math.abs(remaining) > tolerance) {
    const idx = offset + indices[0];
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
  }
}

function clampWeight(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
