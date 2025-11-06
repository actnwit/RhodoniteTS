import {
  type Gltf2,
  type Gltf2Camera,
  type Gltf2Mesh,
  type Gltf2Texture,
  type Gltf2TextureSampler,
  isSameGlTF2TextureSampler,
} from '../../types/glTF2';
import type { Gltf2Ex, Gltf2ImageEx, Gltf2MaterialEx } from '../../types/glTF2ForOutput';
import { VERSION } from '../../version';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { EntityRepository } from '../core/EntityRepository';
import type { Tag } from '../core/RnObject';
import { CameraType, TextureParameter } from '../definitions';
import type { Mesh } from '../geometry/Mesh';
import type { IAnimationEntity, IMeshEntity, ISceneGraphEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import { MathUtil } from '../math/MathUtil';
import { Quaternion } from '../math/Quaternion';
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
  __collectAccessorIndicesFromAnimations,
  __collectAccessorIndicesFromMeshes,
  __collectAccessorIndicesFromSkins,
  __collectUsedAccessorIndices,
  __collectUsedBufferViewIndices,
  __collectUsedTexCoordSetIndices,
  __createBufferViewsAndAccessorsOfAnimation,
  __createBufferViewsAndAccessorsOfMesh,
  __createBufferViewsAndAccessorsOfSkin,
  __deleteEmptyArrays,
  __doesMaterialRequireTangents,
  __extractScalarParameter,
  __filterItemsByUsage,
  __outputBaseMaterialInfo,
  __outputKhrMaterialsAnisotropyInfo,
  __outputKhrMaterialsClearcoatInfo,
  __outputKhrMaterialsDispersionInfo,
  __outputKhrMaterialsIorInfo,
  __outputKhrMaterialsIridescenceInfo,
  __outputKhrMaterialsSheenInfo,
  __outputKhrMaterialsTransmissionInfo,
  __outputKhrMaterialsVolumeInfo,
  __pruneUnusedVertexAttributes,
  __recalculateBufferViewAccumulators,
  __remapAccessorAttributeRecord,
  __remapAccessorReferences,
  __remapBufferViewReferences,
  __removeUnusedAccessors,
  __removeUnusedAccessorsAndBufferViews,
  __removeUnusedBufferViews,
  generateGlbArrayBuffer,
  handleTextureImage,
  isNumericArrayBufferView,
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

    __removeUnusedAccessorsAndBufferViews(json);

    const arraybuffer = this.__createBinary(json);

    __deleteEmptyArrays(json);

    const glbArrayBuffer = generateGlbArrayBuffer(json, arraybuffer);

    if (option.type === GLTF2_EXPORT_GLB) {
      this.__downloadGlb(json, fileName, glbArrayBuffer);
    } else if (option.type === GLTF2_EXPORT_GLTF) {
      this.__downloadGltf(json, fileName, arraybuffer);
    }

    return glbArrayBuffer;
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
      __pruneUnusedVertexAttributes(primitive, material);
    }
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
                  handleTextureImage(json, bufferIdx, blob, option, glTF2ImageEx, resolve, rejected, GLTF2_EXPORT_GLTF);
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

    __outputBaseMaterialInfo(rnMaterial, applyTexture, material, json);

    __outputKhrMaterialsTransmissionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsVolumeInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material);

    __outputKhrMaterialsDispersionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    __outputKhrMaterialsIorInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    __outputKhrMaterialsIridescenceInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsClearcoatInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsSheenInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material);

    __outputKhrMaterialsAnisotropyInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec2,
      rnMaterial,
      applyTexture,
      material
    );
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
