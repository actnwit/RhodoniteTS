import type { AnimationChannel, AnimationPathName, AnimationSampler } from '../../types/AnimationTypes';
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
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorFactor: [1.0, 1.0, 1.0, 1.0],
          },
        },
      ],
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
            node.children.push((child.entity as any).gltfNodeIndex);
          }
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
      node.rotation = [
        transform.localRotationInner.x,
        transform.localRotationInner.y,
        transform.localRotationInner.z,
        transform.localRotationInner.w,
      ];
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

    // If the entity has no parent, it must be a top level entity in the scene graph.
    topLevelEntities.forEach(entity => {
      const idx = entities.indexOf(entity);
      if (idx >= 0) {
        scene.nodes!.push(idx);
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
      this.__setupMaterialBasicProperties(material, rnMaterial, json);
      await this.__setupMaterialTextures(material, rnMaterial, json, promises, bufferIdx, option);
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

    material.alphaMode = rnMaterial.alphaMode.toGltfString();
  }

  private static async __setupMaterialTextures(
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
        if (Is.exist(image.rnTextureUID) && image.rnTextureUID === rnTexture.textureUID) {
          imageIndex = k;
          match = true;
        }
      }

      if (!match) {
        const glTF2ImageEx: Gltf2ImageEx = {
          uri: rnTexture.name,
        };
        glTF2ImageEx.rnTextureUID = rnTexture.textureUID;

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

    this.__processTextureParameters(material, rnMaterial, processTexture);
  }

  private static __processTextureParameters(
    material: Gltf2MaterialEx,
    rnMaterial: Material,
    processTexture: (rnTexture: AbstractTexture, rnSampler?: Sampler) => number | undefined
  ) {
    let textureParam = rnMaterial.getParameter('baseColorTexture');
    let textureIndex: number | undefined;
    if (textureParam != null) {
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex != null) {
        material.pbrMetallicRoughness.baseColorTexture = {
          index: textureIndex,
        };
      }
    } else {
      textureParam = rnMaterial.getParameter('diffuseColorTexture');
      if (textureParam != null) {
        const rnTexture = textureParam[1] as Texture;
        const rnSampler = textureParam[2] as Sampler | undefined;
        const textureIndex = processTexture(rnTexture, rnSampler);
        if (textureIndex != null) {
          material.pbrMetallicRoughness.baseColorTexture = {
            index: textureIndex,
          };
        }
      }
    }

    textureParam = rnMaterial.getParameter('metallicRoughnessTexture') as AbstractTexture;
    if (textureParam) {
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex != null) {
        material.pbrMetallicRoughness.metallicRoughnessTexture = {
          index: textureIndex,
        };
      }
    }

    textureParam = rnMaterial.getParameter('normalTexture') as AbstractTexture;
    if (textureParam) {
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex != null) {
        material.normalTexture = { index: textureIndex };
      }
    }

    textureParam = rnMaterial.getParameter('occlusionTexture') as AbstractTexture;
    if (textureParam) {
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex != null) {
        material.occlusionTexture = { index: textureIndex };
      }
    }

    textureParam = rnMaterial.getParameter('emissiveTexture') as AbstractTexture;
    if (textureParam) {
      const rnTexture = textureParam[1] as Texture;
      const rnSampler = textureParam[2] as Sampler | undefined;
      textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex != null) {
        material.emissiveTexture = { index: textureIndex };
      }
    }
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

    // calc total sum of BufferViews in multiple Buffers
    const byteLengthOfUniteBuffer = json.extras.bufferViewByteLengthAccumulatedArray.reduce((sum, val) => sum + val);
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
          const rnBufferView = rnAttributeAccessor.bufferView;
          const gltf2BufferView = createOrReuseGltf2BufferViewForVertexAttributeBuffer(
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
          primitive.attributes[attributeName] = accessorIdx;
        }
        // BlendShape
        setupBlandShapeData(
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
function setupBlandShapeData(
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
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const animationComponent = entity.tryToGetAnimation();
    if (Is.exist(animationComponent)) {
      // AnimationTrack (Gltf2Animation)
      const animation: Gltf2Animation = {
        channels: [],
        samplers: [],
      };
      json.animations.push(animation);
      let samplerIdx = 0;
      // Rhodonite AnimationTrack is corresponding to Gltf2Animation
      const rnAnimationTrack = animationComponent.getAnimationChannelsOfTrack();
      const rnChannels = rnAnimationTrack.values();
      for (const rnChannel of rnChannels) {
        if (rnChannel.target.pathName === 'effekseer') {
          continue;
        }

        const animatedValue = rnChannel.animatedValue;
        const trackNames = animatedValue.getAllTrackNames();
        for (const trackName of trackNames) {
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
          samplerIdx = createGltf2AnimationChannel(rnChannel, samplerIdx, animation, i);

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

    json.extras.bufferViewByteLengthAccumulatedArray[bufferIdxToSet] = accumulateBufferViewByteLength(
      json.extras.bufferViewByteLengthAccumulatedArray,
      bufferIdxToSet,
      gltf2BufferView
    );

    if (Is.exist(gltf2BufferView.target)) {
      gltf2BufferView.byteStride = rnAccessor.elementSizeInBytes;
    }
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
  const gltf2BufferView = json.bufferViews[bufferViewIdx];
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

  let compositionType = CompositionType.toGltf2AnimationAccessorCompositionType(sampler.outputComponentN);
  let accessorCount = sampler.output.length / sampler.outputComponentN;
  if (pathName === 'weights') {
    compositionType = CompositionType.Scalar;
    accessorCount = sampler.output.length;
  }

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
