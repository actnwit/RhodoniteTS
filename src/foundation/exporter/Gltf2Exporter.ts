import type { AnimationChannel, AnimationPathName } from '../../types/AnimationTypes';
import {
  type Gltf2,
  type Gltf2Camera,
  type Gltf2Mesh,
  type Gltf2Node,
  type Gltf2Texture,
  type Gltf2TextureSampler,
  type KHR_lights_punctual,
  type KHR_lights_punctual_Light,
  type KHR_materials_variants,
  type KHR_materials_variants_PrimitiveExtension,
  isSameGlTF2TextureSampler,
} from '../../types/glTF2';
import type { Gltf2Ex, Gltf2ImageEx, Gltf2MaterialEx } from '../../types/glTF2ForOutput';
import { VERSION } from '../../version';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import type { LightComponent } from '../components/Light/LightComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { EntityRepository } from '../core/EntityRepository';
import type { Tag } from '../core/RnObject';
import { CameraType, LightType, TextureParameter } from '../definitions';
import type { Mesh } from '../geometry/Mesh';
import type { Primitive } from '../geometry/Primitive';
import type { IAnimationEntity, IMeshEntity, ISceneGraphEntity, ISkeletalEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';
import type { IAnimatedValue } from '../math/IAnimatedValue';
import { MathUtil } from '../math/MathUtil';
import { Quaternion } from '../math/Quaternion';
import type { Accessor } from '../memory/Accessor';
import type { Buffer } from '../memory/Buffer';
import type { BufferView } from '../memory/BufferView';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import type { Engine } from '../system/Engine';
import type { AbstractTexture } from '../textures/AbstractTexture';
import type { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';
import { createEffekseer } from './Gltf2ExporterEffekseer';
import {
  type AnimationChannelTargetOverride,
  type AnimationChannelTargetResolution,
  type AnimationExportOptions,
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
  __outputKhrMaterialsDiffuseTransmissionInfo,
  __outputKhrMaterialsDispersionInfo,
  __outputKhrMaterialsEmissiveStrengthInfo,
  __outputKhrMaterialsIorInfo,
  __outputKhrMaterialsIridescenceInfo,
  __outputKhrMaterialsSheenInfo,
  __outputKhrMaterialsSpecularInfo,
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

  private static __materialToGltfMaterialIndices: Map<Material, number[]> = new Map();
  private static __lightComponentToLightIndex: Map<LightComponent, number> = new Map();
  private static __cameraComponentToCameraIndex: Map<CameraComponent, number> = new Map();
  private static __exportedPointerTargetsByTrack: Map<string, Set<string>> = new Map();
  private static __warnedMaterialSemantics: Set<string> = new Set();

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
    engine: Engine,
    filename: string,
    option: Gltf2ExporterArguments = {
      entities: undefined,
      type: GLTF2_EXPORT_GLB,
    }
  ) {
    const { collectedEntities, topLevelEntities } = this.__collectEntities(engine, option);

    this.__materialToGltfMaterialIndices.clear();
    this.__lightComponentToLightIndex.clear();
    this.__cameraComponentToCameraIndex.clear();
    this.__exportedPointerTargetsByTrack.clear();
    this.__warnedMaterialSemantics.clear();

    const { json, fileName }: { json: Gltf2Ex; fileName: string } = this.__createJsonBase(filename);

    this.__createBufferViewsAndAccessors(json, collectedEntities);

    this.__createNodes(json, collectedEntities, topLevelEntities);

    await this.__createMaterials(json, collectedEntities as unknown as IMeshEntity[], option);

    this.__createAnimationData(json, collectedEntities as unknown as IAnimationEntity[]);

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
  private static __collectEntities(engine: Engine, option: Gltf2ExporterArguments | undefined) {
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
    let collectedEntities = engine.entityRepository._getEntities() as unknown as ISceneGraphEntity[];
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

    __createBufferViewsAndAccessorsOfSkin(
      json,
      entities as ISkeletalEntity[],
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );
  }

  private static __createAnimationData(json: Gltf2Ex, entities: IAnimationEntity[]) {
    const animationOptions: AnimationExportOptions = {
      resolveAnimationTarget: ({ channel, trackName }) => this.__resolveAnimationTarget(json, channel, trackName),
    };

    __createBufferViewsAndAccessorsOfAnimation(json, entities, animationOptions);
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
        this.__cameraComponentToCameraIndex.set(cameraComponent, node.camera);
      }
      this.__exportLight(json, entity, node as Gltf2Node);
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

  private static __exportLight(json: Gltf2Ex, entity: ISceneGraphEntity, node: Gltf2Node) {
    const lightComponent = entity.tryToGetLight?.();
    if (Is.not.exist(lightComponent) || lightComponent.enable !== true) {
      return;
    }

    let lightType: KHR_lights_punctual_Light['type'] | undefined;
    if (lightComponent.type === LightType.Point) {
      lightType = 'point';
    } else if (lightComponent.type === LightType.Directional) {
      lightType = 'directional';
    } else if (lightComponent.type === LightType.Spot) {
      lightType = 'spot';
    }

    if (Is.not.exist(lightType)) {
      return;
    }

    const color = lightComponent.color;
    const colorArray: [number, number, number] = [
      Number.isFinite(color.x) ? color.x : 1,
      Number.isFinite(color.y) ? color.y : 1,
      Number.isFinite(color.z) ? color.z : 1,
    ];

    const gltfLight: KHR_lights_punctual_Light = {
      type: lightType,
      color: colorArray,
    };

    if (Is.exist(entity.uniqueName) && entity.uniqueName.length > 0) {
      gltfLight.name = entity.uniqueName;
    }

    const intensity = lightComponent.intensity;
    if (Number.isFinite(intensity)) {
      gltfLight.intensity = intensity;
    }

    if (lightType !== 'directional') {
      const range = lightComponent.range;
      if (Number.isFinite(range) && range > 0) {
        gltfLight.range = range;
      }
    }

    if (lightType === 'spot') {
      const outer = Number.isFinite(lightComponent.outerConeAngle) ? lightComponent.outerConeAngle : Math.PI / 4;
      const inner = Number.isFinite(lightComponent.innerConeAngle) ? lightComponent.innerConeAngle : 0;
      const clampedOuter = Math.max(0, Math.min(outer, Math.PI / 2));
      const clampedInner = Math.max(0, Math.min(inner, clampedOuter));
      gltfLight.spot = {
        innerConeAngle: clampedInner,
        outerConeAngle: clampedOuter,
      };
    }

    const lightsExtension = this.__ensureLightsExtension(json);
    const lightIndex = lightsExtension.lights.length;
    lightsExtension.lights.push(gltfLight);

    this.__lightComponentToLightIndex.set(lightComponent, lightIndex);

    this.__ensureExtensionUsed(json, 'KHR_lights_punctual');

    if (Is.not.exist(node.extensions)) {
      node.extensions = {};
    }
    node.extensions.KHR_lights_punctual = {
      light: lightIndex,
    };
  }

  private static __ensureLightsExtension(json: Gltf2Ex): KHR_lights_punctual {
    if (Is.not.exist(json.extensions)) {
      json.extensions = {};
    }
    const rootExtensions = json.extensions as {
      KHR_lights_punctual?: KHR_lights_punctual;
      [key: string]: unknown;
    };
    if (Is.not.exist(rootExtensions.KHR_lights_punctual)) {
      rootExtensions.KHR_lights_punctual = {
        lights: [],
      };
    }
    return rootExtensions.KHR_lights_punctual!;
  }

  private static __ensureExtensionUsed(json: Gltf2Ex, extensionName: string) {
    if (json.extensionsUsed.indexOf(extensionName) === -1) {
      json.extensionsUsed.push(extensionName);
    }
  }

  private static __registerMaterialIndex(rnMaterial: Material | undefined, materialIndex: number) {
    if (Is.not.exist(rnMaterial)) {
      return;
    }
    let indices = this.__materialToGltfMaterialIndices.get(rnMaterial);
    if (Is.not.exist(indices)) {
      indices = [];
      this.__materialToGltfMaterialIndices.set(rnMaterial, indices);
    }
    indices.push(materialIndex);
  }

  private static __shouldEmitPointerTarget(trackName: string, pointer: string): boolean {
    let exportedPointers = this.__exportedPointerTargetsByTrack.get(trackName);
    if (Is.not.exist(exportedPointers)) {
      exportedPointers = new Set();
      this.__exportedPointerTargetsByTrack.set(trackName, exportedPointers);
    }
    if (exportedPointers.has(pointer)) {
      return false;
    }
    exportedPointers.add(pointer);
    return true;
  }

  private static __resolveAnimationTarget(
    json: Gltf2Ex,
    channel: AnimationChannel,
    trackName: string
  ): AnimationChannelTargetOverride | null | undefined {
    const pathName = channel.target.pathName as AnimationPathName;
    if (typeof pathName !== 'string') {
      return undefined;
    }

    if (pathName.startsWith('material/')) {
      const semantic = pathName.substring('material/'.length);
      return this.__resolveMaterialAnimationTarget(json, channel, semantic, trackName);
    }

    if (pathName.startsWith('light_')) {
      return this.__resolveLightAnimationTarget(json, channel, pathName, trackName);
    }

    if (pathName.startsWith('camera_')) {
      return this.__resolveCameraAnimationTarget(json, channel, pathName, trackName);
    }

    return undefined;
  }

  private static __resolveMaterialAnimationTarget(
    json: Gltf2Ex,
    channel: AnimationChannel,
    semantic: string,
    trackName: string
  ): AnimationChannelTargetOverride | null {
    const indices = this.__findMaterialIndicesForAnimatedValue(semantic, channel.animatedValue);
    if (indices.length === 0) {
      this.__logUnsupportedMaterialSemantic(semantic, true);
      return null;
    }

    const pointerSuffix = this.__getMaterialPointerSuffix(semantic);
    if (Is.not.exist(pointerSuffix)) {
      this.__logUnsupportedMaterialSemantic(semantic, false);
      return null;
    }

    this.__ensureExtensionUsed(json, 'KHR_animation_pointer');

    const targets: AnimationChannelTargetResolution[] = [];
    for (const materialIndex of indices) {
      const pointer = `/materials/${materialIndex}${pointerSuffix}`;
      if (!this.__shouldEmitPointerTarget(trackName, pointer)) {
        continue;
      }
      targets.push({
        path: 'pointer',
        extensions: {
          KHR_animation_pointer: {
            pointer,
          },
        },
      });
    }

    return targets.length > 0 ? targets : null;
  }

  private static __findMaterialIndicesForAnimatedValue(semantic: string, animatedValue: IAnimatedValue) {
    const indices: number[] = [];
    for (const [rnMaterial, gltfIndices] of this.__materialToGltfMaterialIndices.entries()) {
      const parameter = rnMaterial.getParameter(semantic);
      if (parameter === animatedValue) {
        indices.push(...gltfIndices);
      }
    }
    return Array.from(new Set(indices));
  }

  private static __resolveLightAnimationTarget(
    json: Gltf2Ex,
    channel: AnimationChannel,
    pathName: string,
    trackName: string
  ): AnimationChannelTargetOverride | null {
    const lightComponent = channel.target.entity.tryToGetLight?.();
    if (Is.not.exist(lightComponent)) {
      return null;
    }
    const lightIndex = this.__lightComponentToLightIndex.get(lightComponent as LightComponent);
    if (Is.not.exist(lightIndex)) {
      return null;
    }

    const suffix = LIGHT_POINTER_SUFFIX_MAP[pathName];
    if (Is.not.exist(suffix)) {
      return null;
    }

    const pointer = `/extensions/KHR_lights_punctual/lights/${lightIndex}${suffix}`;
    if (!this.__shouldEmitPointerTarget(trackName, pointer)) {
      return null;
    }

    this.__ensureExtensionUsed(json, 'KHR_animation_pointer');

    return {
      path: 'pointer',
      extensions: {
        KHR_animation_pointer: {
          pointer,
        },
      },
    };
  }

  private static __resolveCameraAnimationTarget(
    json: Gltf2Ex,
    channel: AnimationChannel,
    pathName: string,
    trackName: string
  ): AnimationChannelTargetOverride | null {
    const cameraComponent = channel.target.entity.tryToGetCamera?.();
    if (Is.not.exist(cameraComponent)) {
      return null;
    }
    const cameraIndex = this.__cameraComponentToCameraIndex.get(cameraComponent as CameraComponent);
    if (Is.not.exist(cameraIndex)) {
      return null;
    }

    const suffix = this.__getCameraPointerSuffix(pathName, cameraComponent as CameraComponent);
    if (Is.not.exist(suffix)) {
      return null;
    }

    const pointer = `/cameras/${cameraIndex}${suffix}`;
    if (!this.__shouldEmitPointerTarget(trackName, pointer)) {
      return null;
    }

    this.__ensureExtensionUsed(json, 'KHR_animation_pointer');

    return {
      path: 'pointer',
      extensions: {
        KHR_animation_pointer: {
          pointer,
        },
      },
    };
  }

  private static __getMaterialPointerSuffix(semantic: string): string | undefined {
    const direct = MATERIAL_POINTER_SUFFIX_MAP[semantic];
    if (Is.exist(direct)) {
      return direct;
    }

    const transformMatch = semantic.match(/^(.*)Transform(Offset|Scale|Rotation)$/);
    if (transformMatch) {
      const textureName = transformMatch[1];
      const transformType = transformMatch[2];
      const texturePath = MATERIAL_TEXTURE_PATHS[textureName];
      if (Is.not.exist(texturePath)) {
        return undefined;
      }
      const property = transformType.toLowerCase();
      return `${texturePath}/extensions/KHR_texture_transform/${property}`;
    }

    return undefined;
  }

  private static __logUnsupportedMaterialSemantic(semantic: string, missingMaterial: boolean) {
    if (this.__warnedMaterialSemantics.has(semantic)) {
      return;
    }
    this.__warnedMaterialSemantics.add(semantic);
    if (missingMaterial) {
      Logger.warn(`KHR_animation_pointer: No material parameter found for semantic "${semantic}".`);
    } else {
      Logger.warn(`KHR_animation_pointer: Unsupported material semantic "${semantic}". Animation skipped.`);
    }
  }

  private static __getCameraPointerSuffix(pathName: string, cameraComponent: CameraComponent): string | undefined {
    const type = cameraComponent.type;
    switch (pathName) {
      case 'camera_znear':
        return type === CameraType.Perspective ? '/perspective/znear' : '/orthographic/znear';
      case 'camera_zfar':
        return type === CameraType.Perspective ? '/perspective/zfar' : '/orthographic/zfar';
      case 'camera_fovy':
        return type === CameraType.Perspective ? '/perspective/yfov' : undefined;
      case 'camera_xmag':
        return type === CameraType.Orthographic ? '/orthographic/xmag' : undefined;
      case 'camera_ymag':
        return type === CameraType.Orthographic ? '/orthographic/ymag' : undefined;
      default:
        return undefined;
    }
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
    const variantNameToIndex = new Map<string, number>();
    json.extras.bufferViewByteLengthAccumulatedArray.push(0);
    const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent?.mesh) {
        const gltf2Mesh = json.meshes![countMesh++];
        await this.__processMeshPrimitives(
          json,
          meshComponent.mesh,
          gltf2Mesh,
          promises,
          bufferIdx,
          option,
          variantNameToIndex
        );
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
    option: Gltf2ExporterArguments,
    variantNameToIndex: Map<string, number>
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
      this.__registerMaterialIndex(rnMaterial, materialIndex);
      __pruneUnusedVertexAttributes(primitive, material);

      await this.__exportMaterialVariants(
        json,
        rnPrimitive,
        primitive,
        promises,
        bufferIdx,
        option,
        variantNameToIndex,
        materialIndex
      );
    }
  }

  private static async __exportMaterialVariants(
    json: Gltf2Ex,
    rnPrimitive: Primitive,
    primitive: Gltf2Mesh['primitives'][number],
    promises: Promise<any>[],
    bufferIdx: number,
    option: Gltf2ExporterArguments,
    variantNameToIndex: Map<string, number>,
    baseMaterialIndex: number
  ) {
    const variantNames = rnPrimitive.getVariantNames();
    if (variantNames.length === 0) {
      return;
    }

    const mappings: KHR_materials_variants_PrimitiveExtension['mappings'] = [];

    for (const variantName of variantNames) {
      if (Is.not.exist(variantName) || variantName.length === 0) {
        continue;
      }
      const variantMaterial = rnPrimitive.getVariantMaterial(variantName);
      if (variantMaterial == null) {
        continue;
      }

      let materialIndex = baseMaterialIndex;
      if (variantMaterial !== rnPrimitive.material) {
        const gltfVariantMaterial = await this.__createMaterialFromRhodonite(
          json,
          variantMaterial,
          promises,
          bufferIdx,
          option
        );
        materialIndex = json.materials.length;
        json.materials.push(gltfVariantMaterial);
        this.__registerMaterialIndex(variantMaterial, materialIndex);
      }

      const variantIndex = this.__ensureVariantIndex(json, variantName, variantNameToIndex);
      mappings.push({
        material: materialIndex,
        variants: [variantIndex],
      });
    }

    if (mappings.length === 0) {
      return;
    }

    primitive.extensions = primitive.extensions ?? {};
    const primitiveExtensions = primitive.extensions as {
      KHR_materials_variants?: KHR_materials_variants_PrimitiveExtension;
      [key: string]: unknown;
    };

    if (Is.exist(primitiveExtensions.KHR_materials_variants)) {
      primitiveExtensions.KHR_materials_variants!.mappings.push(...mappings);
    } else {
      primitiveExtensions.KHR_materials_variants = {
        mappings,
      };
    }

    this.__ensureExtensionUsed(json, 'KHR_materials_variants');
  }

  private static __ensureVariantIndex(json: Gltf2Ex, variantName: string, variantNameToIndex: Map<string, number>) {
    let variantIndex = variantNameToIndex.get(variantName);
    if (variantIndex !== undefined) {
      return variantIndex;
    }

    const materialVariantsExtension = this.__ensureMaterialVariantsExtension(json);
    variantIndex = materialVariantsExtension.variants.length;
    materialVariantsExtension.variants.push({
      name: variantName,
    });
    variantNameToIndex.set(variantName, variantIndex);
    return variantIndex;
  }

  private static __ensureMaterialVariantsExtension(json: Gltf2Ex): KHR_materials_variants {
    if (Is.not.exist(json.extensions)) {
      json.extensions = {};
    }

    const rootExtensions = json.extensions as {
      KHR_materials_variants?: KHR_materials_variants;
      [key: string]: unknown;
    };

    if (Is.not.exist(rootExtensions.KHR_materials_variants)) {
      rootExtensions.KHR_materials_variants = {
        variants: [],
      };
    }

    return rootExtensions.KHR_materials_variants;
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

    const isUnlitMaterial = Is.false(rnMaterial.isLighting);

    __outputBaseMaterialInfo(rnMaterial, applyTexture, material, json, {
      skipAdditionalTextures: isUnlitMaterial,
    });

    if (isUnlitMaterial) {
      return;
    }

    __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    __outputKhrMaterialsDiffuseTransmissionInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec3,
      rnMaterial,
      applyTexture,
      material
    );

    __outputKhrMaterialsTransmissionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsVolumeInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material);

    __outputKhrMaterialsDispersionInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    __outputKhrMaterialsIorInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    __outputKhrMaterialsIridescenceInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsClearcoatInfo(ensureExtensionUsed, coerceNumber, rnMaterial, applyTexture, material);

    __outputKhrMaterialsSheenInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material);

    __outputKhrMaterialsSpecularInfo(ensureExtensionUsed, coerceNumber, coerceVec3, rnMaterial, applyTexture, material);

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

const MATERIAL_POINTER_SUFFIX_MAP: Record<string, string> = {
  baseColorFactor: '/pbrMetallicRoughness/baseColorFactor',
  metallicFactor: '/pbrMetallicRoughness/metallicFactor',
  roughnessFactor: '/pbrMetallicRoughness/roughnessFactor',
  emissiveFactor: '/emissiveFactor',
  emissiveStrength: '/extensions/KHR_materials_emissive_strength/emissiveStrength',
  diffuseTransmissionFactor: '/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor',
  diffuseTransmissionColorFactor: '/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor',
  transmissionFactor: '/extensions/KHR_materials_transmission/transmissionFactor',
  thicknessFactor: '/extensions/KHR_materials_volume/thicknessFactor',
  attenuationDistance: '/extensions/KHR_materials_volume/attenuationDistance',
  attenuationColor: '/extensions/KHR_materials_volume/attenuationColor',
  dispersion: '/extensions/KHR_materials_dispersion/dispersion',
  ior: '/extensions/KHR_materials_ior/ior',
  iridescenceFactor: '/extensions/KHR_materials_iridescence/iridescenceFactor',
  iridescenceIor: '/extensions/KHR_materials_iridescence/iridescenceIor',
  iridescenceThicknessMinimum: '/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum',
  iridescenceThicknessMaximum: '/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum',
  clearcoatFactor: '/extensions/KHR_materials_clearcoat/clearcoatFactor',
  clearcoatRoughnessFactor: '/extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor',
  clearcoatNormalScale: '/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale',
  clearcoatNormalTextureScale: '/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale',
  sheenColorFactor: '/extensions/KHR_materials_sheen/sheenColorFactor',
  sheenRoughnessFactor: '/extensions/KHR_materials_sheen/sheenRoughnessFactor',
  specularFactor: '/extensions/KHR_materials_specular/specularFactor',
  specularColorFactor: '/extensions/KHR_materials_specular/specularColorFactor',
  anisotropyStrength: '/extensions/KHR_materials_anisotropy/anisotropyStrength',
  anisotropyRotation: '/extensions/KHR_materials_anisotropy/anisotropyRotation',
  normalScale: '/normalTexture/scale',
  occlusionStrength: '/occlusionTexture/strength',
};

const MATERIAL_TEXTURE_PATHS: Record<string, string> = {
  baseColorTexture: '/pbrMetallicRoughness/baseColorTexture',
  metallicRoughnessTexture: '/pbrMetallicRoughness/metallicRoughnessTexture',
  normalTexture: '/normalTexture',
  occlusionTexture: '/occlusionTexture',
  emissiveTexture: '/emissiveTexture',
  diffuseTransmissionTexture: '/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture',
  diffuseTransmissionColorTexture: '/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture',
  transmissionTexture: '/extensions/KHR_materials_transmission/transmissionTexture',
  thicknessTexture: '/extensions/KHR_materials_volume/thicknessTexture',
  clearcoatTexture: '/extensions/KHR_materials_clearcoat/clearcoatTexture',
  clearcoatRoughnessTexture: '/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture',
  clearcoatNormalTexture: '/extensions/KHR_materials_clearcoat/clearcoatNormalTexture',
  sheenColorTexture: '/extensions/KHR_materials_sheen/sheenColorTexture',
  sheenRoughnessTexture: '/extensions/KHR_materials_sheen/sheenRoughnessTexture',
  specularTexture: '/extensions/KHR_materials_specular/specularTexture',
  specularColorTexture: '/extensions/KHR_materials_specular/specularColorTexture',
  iridescenceTexture: '/extensions/KHR_materials_iridescence/iridescenceTexture',
  iridescenceThicknessTexture: '/extensions/KHR_materials_iridescence/iridescenceThicknessTexture',
  anisotropyTexture: '/extensions/KHR_materials_anisotropy/anisotropyTexture',
};

const LIGHT_POINTER_SUFFIX_MAP: Record<string, string> = {
  light_color: '/color',
  light_intensity: '/intensity',
  light_range: '/range',
  light_spot_innerConeAngle: '/spot/innerConeAngle',
  light_spot_outerConeAngle: '/spot/outerConeAngle',
};
