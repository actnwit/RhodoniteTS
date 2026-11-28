// src/foundation/exporter/Gltf2Exporter.ts
import {
  isSameGlTF2TextureSampler,
  TagKhrNodeVisibilityEnabled,
  TagKhrNodeVisibilityVisible
} from "../../types/glTF2.js";
import { VERSION } from "../../version.js";
import { SceneGraphComponent } from "../components/SceneGraph/SceneGraphComponent.js";
import { CameraType, LightType, TextureParameter } from "../definitions/index.js";
import { MathUtil } from "../math/MathUtil.js";
import { Quaternion } from "../math/Quaternion.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { createEffekseer } from "./Gltf2ExporterEffekseer.js";
import {
  __createBufferViewsAndAccessorsOfAnimation,
  __createBufferViewsAndAccessorsOfMesh,
  __createBufferViewsAndAccessorsOfSkin,
  __deleteEmptyArrays,
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
  __removeUnusedAccessorsAndBufferViews,
  generateGlbArrayBuffer,
  handleTextureImage,
  isNumericArrayBufferView,
  isRuntimeOnlyAnimationPath
} from "./Gltf2ExporterOps.js";
var GLTF2_EXPORT_GLTF = "glTF";
var GLTF2_EXPORT_GLB = "glTF-Binary";
var GLTF2_EXPORT_DRACO = "glTF-Draco";
var GLTF2_EXPORT_EMBEDDED = "glTF-Embedded";
var GLTF2_EXPORT_NO_DOWNLOAD = "No-Download";
var Gltf2Exporter = class {
  constructor() {
  }
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
  static async export(engine, filename, option = {
    entities: void 0,
    type: GLTF2_EXPORT_GLB
  }) {
    const { collectedEntities, topLevelEntities } = this.Yj(engine, option);
    this.Nj.clear();
    this.Pj.clear();
    this.Qj.clear();
    this.Rj.clear();
    this.Sj.clear();
    const { json, fileName } = this.Zj(filename);
    this._j(json, collectedEntities);
    this.$j(json, collectedEntities, topLevelEntities);
    await this.ak(json, collectedEntities, option);
    await this.bk(json, option);
    this.ck(json, collectedEntities);
    createEffekseer(json, collectedEntities);
    __removeUnusedAccessorsAndBufferViews(json);
    const arraybuffer = this.dk(json);
    __deleteEmptyArrays(json);
    const glbArrayBuffer = generateGlbArrayBuffer(json, arraybuffer);
    if (option.type === GLTF2_EXPORT_GLB) {
      this.ek(json, fileName, glbArrayBuffer);
    } else if (option.type === GLTF2_EXPORT_GLTF) {
      this.fk(json, fileName, arraybuffer);
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
  static Yj(engine, option) {
    const checkPassOrNotWithTags = (entity) => {
      if (Is.exist(option) && Is.exist(option.excludeTags)) {
        for (const tag of option.excludeTags) {
          if (entity.matchTag(tag.tag, tag.value)) {
            return false;
          }
        }
        if (entity.matchTag("Being", "gizmo")) {
          return true;
        }
      }
      return true;
    };
    const excludeWithTags = (entity) => {
      if (Is.exist(option) && Is.exist(option.excludeTags)) {
        for (const tag of option.excludeTags) {
          if (entity.matchTag(tag.tag, tag.value)) {
            return [];
          }
        }
      }
      return [entity];
    };
    const collectDescendants = (entity, root) => {
      const sg = entity.getSceneGraph();
      if (sg.children.length > 0) {
        const array = root ? [] : excludeWithTags(entity);
        for (let i = 0; i < sg.children.length; i++) {
          const child = sg.children[i];
          Array.prototype.push.apply(array, collectDescendants(child.entity, false));
        }
        return array;
      }
      return root ? [] : excludeWithTags(entity);
    };
    if (Is.exist(option) && Is.exist(option.entities) && option.entities.length > 0) {
      const collectedDescendants = option.entities.flatMap((entity) => collectDescendants(entity, true));
      let topLevelEntities2 = [];
      option.entities.forEach((entity) => {
        if (collectedDescendants.indexOf(entity) === -1 && checkPassOrNotWithTags(entity)) {
          topLevelEntities2.push(entity);
        }
      });
      let collectedEntities2 = option.entities.concat();
      Array.prototype.push.apply(collectedEntities2, collectedDescendants);
      collectedEntities2 = [...new Set(collectedEntities2)];
      if (topLevelEntities2.length === 0) {
        topLevelEntities2 = collectedEntities2;
      }
      return { collectedEntities: collectedEntities2, topLevelEntities: topLevelEntities2 };
    }
    let collectedEntities = engine.entityRepository._getEntities();
    collectedEntities = collectedEntities.filter((entity) => checkPassOrNotWithTags(entity));
    let topLevelEntities = SceneGraphComponent.getTopLevelComponents().flatMap((c) => c.entity);
    topLevelEntities = topLevelEntities.filter((entity) => checkPassOrNotWithTags(entity));
    collectedEntities = collectedEntities.flatMap((entity) => collectDescendants(entity, true));
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
  static Zj(filename) {
    const fileName = filename ? filename : `Rhodonite_${Date.now()}`;
    const json = {
      asset: {
        version: "2.0",
        generator: `Rhodonite (${VERSION.version})`
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
        bufferViewByteLengthAccumulatedArray: []
        // bufferViewByteLengthAccumulatedArray[0] for buffer 0
        // bufferViewByteLengthAccumulatedArray[1] for buffer 1
        // ...
      },
      cameras: [],
      samplers: []
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
  static _j(json, entities) {
    const existingUniqueRnBuffers = [];
    const existingUniqueRnBufferViews = [];
    const existingUniqueRnAccessors = [];
    __createBufferViewsAndAccessorsOfMesh(
      json,
      entities,
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );
    __createBufferViewsAndAccessorsOfSkin(
      json,
      entities,
      existingUniqueRnBuffers,
      existingUniqueRnBufferViews,
      existingUniqueRnAccessors
    );
  }
  static ck(json, entities) {
    const animationOptions = {
      resolveAnimationTarget: ({ channel, trackName }) => this.gk(json, channel, trackName)
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
  static $j(json, entities, topLevelEntities) {
    json.nodes = [];
    json.scenes = [{ nodes: [] }];
    const scene = json.scenes[0];
    const sceneNodeIndices = /* @__PURE__ */ new Set();
    const parentNodeIndices = new Array(entities.length);
    const skinnedMeshNodeIndices = [];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      entity.gltfNodeIndex = i;
    }
    let meshCount = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      json.nodes[i] = {};
      const node = json.nodes[i];
      node.name = entity.uniqueName;
      const sceneGraphComponent = entity.getSceneGraph();
      const children = sceneGraphComponent.children;
      if (children.length > 0) {
        node.children = [];
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          if (Is.exist(child.entity.gltfNodeIndex)) {
            const childNodeIdx = child.entity.gltfNodeIndex;
            node.children.push(childNodeIdx);
            parentNodeIndices[childNodeIdx] = i;
          }
        }
        if (node.children.length === 0) {
          node.children = void 0;
        }
      }
      if (sceneGraphComponent.isBillboard) {
        node.extensions = {
          RHODONITE_billboard: {
            isBillboard: true
          }
        };
        if (json.extensionsUsed.indexOf("RHODONITE_billboard") === -1) {
          json.extensionsUsed.push("RHODONITE_billboard");
        }
      }
      const localVisible = entity.getTagValue(TagKhrNodeVisibilityVisible);
      if (entity.getTagValue(TagKhrNodeVisibilityEnabled) === true && typeof localVisible === "boolean") {
        if (Is.not.exist(node.extensions)) {
          node.extensions = {};
        }
        node.extensions.KHR_node_visibility = {
          visible: localVisible
        };
        this.Mj(json, "KHR_node_visibility");
      }
      const transform = entity.getTransform();
      const normalizedQuaternion = Quaternion.normalize(transform.localRotationInner);
      const normalizedRotationArray = [
        normalizedQuaternion.x,
        normalizedQuaternion.y,
        normalizedQuaternion.z,
        normalizedQuaternion.w
      ];
      node.rotation = normalizedRotationArray.map((component) => Math.min(1, Math.max(-1, component)));
      node.scale = [transform.localScaleInner.x, transform.localScaleInner.y, transform.localScaleInner.z];
      node.translation = [
        transform.localPositionInner.x,
        transform.localPositionInner.y,
        transform.localPositionInner.z
      ];
      const meshComponent = entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        node.mesh = meshCount++;
      }
      const blendShapeComponent = entity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        const weights = blendShapeComponent.weights;
        if (weights.length > 0) {
          node.weights = weights;
        }
      }
      const skinComponent = entity.tryToGetSkeletal();
      if (Is.exist(skinComponent)) {
        const entityIdx = json.extras.rnSkins.indexOf(skinComponent.entity);
        if (entityIdx >= 0) {
          node.skin = entityIdx;
          if (Is.exist(node.mesh)) {
            skinnedMeshNodeIndices.push(i);
          }
        }
      }
      const cameraComponent = entity.tryToGetCamera();
      if (Is.exist(cameraComponent)) {
        let glTF2Camera;
        if (cameraComponent.type === CameraType.Perspective) {
          const originalAspect = cameraComponent.getTagValue("OriginalAspect");
          const originalFovY = cameraComponent.getTagValue("OriginalFovY");
          glTF2Camera = {
            name: cameraComponent.entity.uniqueName,
            type: "perspective",
            perspective: {
              aspectRatio: Is.exist(originalAspect) ? originalAspect : cameraComponent.aspect,
              yfov: Is.exist(originalFovY) ? MathUtil.degreeToRadian(originalFovY) : MathUtil.degreeToRadian(cameraComponent.fovy),
              znear: cameraComponent.zNear,
              zfar: cameraComponent.zFar
            }
          };
        } else if (cameraComponent.type === CameraType.Orthographic) {
          const originalXMag = cameraComponent.getTagValue("OriginalXMag");
          const originalYMag = cameraComponent.getTagValue("OriginalYMag");
          glTF2Camera = {
            name: cameraComponent.entity.uniqueName,
            type: "orthographic",
            orthographic: {
              xmag: Is.exist(originalXMag) ? originalXMag : cameraComponent.xMag,
              ymag: Is.exist(originalYMag) ? originalYMag : cameraComponent.yMag,
              znear: cameraComponent.zNear,
              zfar: cameraComponent.zFar
            }
          };
        }
        json.cameras.push(glTF2Camera);
        node.camera = json.cameras.length - 1;
        this.Qj.set(cameraComponent, node.camera);
      }
      this.hk(json, entity, node);
      this.ik(json, entity, node);
    }
    for (const nodeIndex of skinnedMeshNodeIndices) {
      const node = json.nodes[nodeIndex];
      const parentIdx = parentNodeIndices[nodeIndex];
      if (Is.exist(parentIdx)) {
        const parentNode = json.nodes[parentIdx];
        if (Is.exist(parentNode.children)) {
          parentNode.children = parentNode.children.filter((childIdx) => childIdx !== nodeIndex);
          if (parentNode.children.length === 0) {
            parentNode.children = void 0;
          }
        }
        parentNodeIndices[nodeIndex] = void 0;
      }
      const skinnedEntity = entities[nodeIndex];
      const worldMatrix = skinnedEntity.getSceneGraph().matrixInner;
      const worldTranslation = worldMatrix.getTranslate();
      const worldScale = worldMatrix.getScale();
      const worldQuaternion = Quaternion.normalize(Quaternion.fromMatrix(worldMatrix));
      node.translation = [worldTranslation.x, worldTranslation.y, worldTranslation.z];
      node.rotation = [
        Math.min(1, Math.max(-1, worldQuaternion.x)),
        Math.min(1, Math.max(-1, worldQuaternion.y)),
        Math.min(1, Math.max(-1, worldQuaternion.z)),
        Math.min(1, Math.max(-1, worldQuaternion.w))
      ];
      node.scale = [worldScale.x, worldScale.y, worldScale.z];
      if (!sceneNodeIndices.has(nodeIndex)) {
        scene.nodes.push(nodeIndex);
        sceneNodeIndices.add(nodeIndex);
      }
    }
    topLevelEntities.forEach((entity) => {
      const idx = entities.indexOf(entity);
      if (idx >= 0 && !sceneNodeIndices.has(idx)) {
        scene.nodes.push(idx);
        sceneNodeIndices.add(idx);
      }
    });
  }
  static hk(json, entity, node) {
    var _a, _b;
    const lightComponent = (_a = entity.tryToGetLight) == null ? void 0 : _a.call(entity);
    if (Is.not.exist(lightComponent) || lightComponent.enable !== true) {
      return;
    }
    let lightType;
    if (lightComponent.type === LightType.Point) {
      lightType = "point";
    } else if (lightComponent.type === LightType.Directional) {
      lightType = "directional";
    } else if (lightComponent.type === LightType.Spot) {
      lightType = "spot";
    }
    if (Is.not.exist(lightType)) {
      return;
    }
    const color = lightComponent.color;
    const colorArray = [
      Number.isFinite(color.x) ? color.x : 1,
      Number.isFinite(color.y) ? color.y : 1,
      Number.isFinite(color.z) ? color.z : 1
    ];
    const gltfLight = {
      type: lightType,
      color: colorArray
    };
    if (Is.exist(entity.uniqueName) && entity.uniqueName.length > 0) {
      gltfLight.name = entity.uniqueName;
    }
    const intensity = lightComponent.intensity;
    if (Number.isFinite(intensity)) {
      gltfLight.intensity = intensity;
    }
    if (lightType !== "directional") {
      const range = lightComponent.range;
      if (Number.isFinite(range) && range > 0) {
        gltfLight.range = range;
      }
    }
    if (lightType === "spot") {
      const outer = Number.isFinite(lightComponent.outerConeAngle) ? lightComponent.outerConeAngle : Math.PI / 4;
      const inner = Number.isFinite(lightComponent.innerConeAngle) ? lightComponent.innerConeAngle : 0;
      const clampedOuter = Math.max(0, Math.min(outer, Math.PI / 2));
      const clampedInner = Math.max(0, Math.min(inner, clampedOuter));
      gltfLight.spot = {
        innerConeAngle: clampedInner,
        outerConeAngle: clampedOuter
      };
    }
    const rhodoniteExtras = {
      castShadow: lightComponent.castShadow,
      pointLightShadowFarPlane: lightComponent.pointLightShadowFarPlane
    };
    if (!lightComponent.isShadowZNearForSpotLightAuto) {
      rhodoniteExtras.shadowZNearForSpotLight = lightComponent.shadowZNearForSpotLight;
    }
    gltfLight.extras = {
      ...(_b = gltfLight.extras) != null ? _b : {},
      rhodonite: rhodoniteExtras
    };
    const lightsExtension = this.jk(json);
    const lightIndex = lightsExtension.lights.length;
    lightsExtension.lights.push(gltfLight);
    this.Pj.set(lightComponent, lightIndex);
    this.Mj(json, "KHR_lights_punctual");
    if (Is.not.exist(node.extensions)) {
      node.extensions = {};
    }
    node.extensions.KHR_lights_punctual = {
      light: lightIndex
    };
  }
  static jk(json) {
    if (Is.not.exist(json.extensions)) {
      json.extensions = {};
    }
    const rootExtensions = json.extensions;
    if (Is.not.exist(rootExtensions.KHR_lights_punctual)) {
      rootExtensions.KHR_lights_punctual = {
        lights: []
      };
    }
    return rootExtensions.KHR_lights_punctual;
  }
  /**
   * Exports the graph of a RaymarchingComponent as a Rhodonite node extension.
   * The raymarching material is shared by every component and is rebuilt by the
   * editor from the graphs, so only the per-component graph is stored here.
   *
   * @param json - The output glTF JSON
   * @param entity - The entity to export
   * @param node - The glTF node of the entity
   */
  static ik(json, entity, node) {
    var _a, _b;
    const raymarchingComponent = (_a = entity.tryToGetRaymarching) == null ? void 0 : _a.call(entity);
    if (Is.not.exist(raymarchingComponent)) {
      return;
    }
    if (Is.not.exist(node.extensions)) {
      node.extensions = {};
    }
    node.extensions.RHODONITE_raymarching = {
      graph: (_b = raymarchingComponent.rrnJson) != null ? _b : null,
      sdfShapeType: raymarchingComponent.sdfShapeType.index,
      isPickable: raymarchingComponent.isPickable,
      castShadow: raymarchingComponent.castShadow
    };
    this.Mj(json, "RHODONITE_raymarching");
  }
  static Mj(json, extensionName) {
    if (json.extensionsUsed.indexOf(extensionName) === -1) {
      json.extensionsUsed.push(extensionName);
    }
  }
  static Tj(rnMaterial, materialIndex) {
    if (Is.not.exist(rnMaterial)) {
      return;
    }
    let indices = this.Nj.get(rnMaterial);
    if (Is.not.exist(indices)) {
      indices = [];
      this.Nj.set(rnMaterial, indices);
    }
    indices.push(materialIndex);
  }
  static Oj(trackName, pointer) {
    let exportedPointers = this.Rj.get(trackName);
    if (Is.not.exist(exportedPointers)) {
      exportedPointers = /* @__PURE__ */ new Set();
      this.Rj.set(trackName, exportedPointers);
    }
    if (exportedPointers.has(pointer)) {
      return false;
    }
    exportedPointers.add(pointer);
    return true;
  }
  static gk(json, channel, trackName) {
    const pathName = channel.target.pathName;
    if (typeof pathName !== "string") {
      return void 0;
    }
    if (isRuntimeOnlyAnimationPath(pathName)) {
      return null;
    }
    if (pathName.startsWith("material/")) {
      const semantic = pathName.substring("material/".length);
      return this.kk(json, channel, semantic, trackName);
    }
    if (pathName.startsWith("light_")) {
      return this.lk(json, channel, pathName, trackName);
    }
    if (pathName.startsWith("camera_")) {
      return this.mk(json, channel, pathName, trackName);
    }
    if (pathName === "visibility") {
      return this.nk(json, channel, trackName);
    }
    return void 0;
  }
  static nk(json, channel, trackName) {
    var _a;
    const nodeIndex = channel.target.entity.gltfNodeIndex;
    if (Is.not.exist(nodeIndex)) {
      return null;
    }
    const node = (_a = json.nodes) == null ? void 0 : _a[nodeIndex];
    if (Is.not.exist(node)) {
      return null;
    }
    const localVisible = channel.target.entity.getTagValue(TagKhrNodeVisibilityVisible);
    if (Is.not.exist(node.extensions)) {
      node.extensions = {};
    }
    node.extensions.KHR_node_visibility = {
      visible: typeof localVisible === "boolean" ? localVisible : channel.target.entity.getSceneGraph().isVisible
    };
    const pointer = `/nodes/${nodeIndex}/extensions/KHR_node_visibility/visible`;
    if (!this.Oj(trackName, pointer)) {
      return null;
    }
    this.Mj(json, "KHR_animation_pointer");
    this.Mj(json, "KHR_node_visibility");
    return {
      path: "pointer",
      extensions: {
        KHR_animation_pointer: {
          pointer
        }
      }
    };
  }
  static kk(json, channel, semantic, trackName) {
    const indices = this.ok(semantic, channel.animatedValue);
    if (indices.length === 0) {
      this.Uj(semantic, true);
      return null;
    }
    const pointerSuffix = this.pk(semantic);
    if (Is.not.exist(pointerSuffix)) {
      this.Uj(semantic, false);
      return null;
    }
    this.Mj(json, "KHR_animation_pointer");
    const targets = [];
    for (const materialIndex of indices) {
      const pointer = `/materials/${materialIndex}${pointerSuffix}`;
      if (!this.Oj(trackName, pointer)) {
        continue;
      }
      targets.push({
        path: "pointer",
        extensions: {
          KHR_animation_pointer: {
            pointer
          }
        }
      });
    }
    return targets.length > 0 ? targets : null;
  }
  static ok(semantic, animatedValue) {
    const indices = [];
    for (const [rnMaterial, gltfIndices] of this.Nj.entries()) {
      const parameter = rnMaterial.getParameter(semantic);
      if (parameter === animatedValue) {
        indices.push(...gltfIndices);
      }
    }
    return Array.from(new Set(indices));
  }
  static lk(json, channel, pathName, trackName) {
    var _a, _b;
    const lightComponent = (_b = (_a = channel.target.entity).tryToGetLight) == null ? void 0 : _b.call(_a);
    if (Is.not.exist(lightComponent)) {
      return null;
    }
    const lightIndex = this.Pj.get(lightComponent);
    if (Is.not.exist(lightIndex)) {
      return null;
    }
    const suffix = LIGHT_POINTER_SUFFIX_MAP[pathName];
    if (Is.not.exist(suffix)) {
      return null;
    }
    const pointer = `/extensions/KHR_lights_punctual/lights/${lightIndex}${suffix}`;
    if (!this.Oj(trackName, pointer)) {
      return null;
    }
    this.Mj(json, "KHR_animation_pointer");
    return {
      path: "pointer",
      extensions: {
        KHR_animation_pointer: {
          pointer
        }
      }
    };
  }
  static mk(json, channel, pathName, trackName) {
    var _a, _b;
    const cameraComponent = (_b = (_a = channel.target.entity).tryToGetCamera) == null ? void 0 : _b.call(_a);
    if (Is.not.exist(cameraComponent)) {
      return null;
    }
    const cameraIndex = this.Qj.get(cameraComponent);
    if (Is.not.exist(cameraIndex)) {
      return null;
    }
    const suffix = this.qk(pathName, cameraComponent);
    if (Is.not.exist(suffix)) {
      return null;
    }
    const pointer = `/cameras/${cameraIndex}${suffix}`;
    if (!this.Oj(trackName, pointer)) {
      return null;
    }
    this.Mj(json, "KHR_animation_pointer");
    return {
      path: "pointer",
      extensions: {
        KHR_animation_pointer: {
          pointer
        }
      }
    };
  }
  static pk(semantic) {
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
        return void 0;
      }
      const property = transformType.toLowerCase();
      return `${texturePath}/extensions/KHR_texture_transform/${property}`;
    }
    return void 0;
  }
  static Uj(semantic, missingMaterial) {
    if (this.Sj.has(semantic)) {
      return;
    }
    this.Sj.add(semantic);
    if (missingMaterial) {
      Logger.default.warn(`KHR_animation_pointer: No material parameter found for semantic "${semantic}".`);
    } else {
      Logger.default.warn(`KHR_animation_pointer: Unsupported material semantic "${semantic}". Animation skipped.`);
    }
  }
  static qk(pathName, cameraComponent) {
    const type = cameraComponent.type;
    switch (pathName) {
      case "camera_znear":
        return type === CameraType.Perspective ? "/perspective/znear" : "/orthographic/znear";
      case "camera_zfar":
        return type === CameraType.Perspective ? "/perspective/zfar" : "/orthographic/zfar";
      case "camera_fovy":
        return type === CameraType.Perspective ? "/perspective/yfov" : void 0;
      case "camera_xmag":
        return type === CameraType.Orthographic ? "/orthographic/xmag" : void 0;
      case "camera_ymag":
        return type === CameraType.Orthographic ? "/orthographic/ymag" : void 0;
      default:
        return void 0;
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
  static async ak(json, entities, option) {
    let countMesh = 0;
    const promises = [];
    const variantNameToIndex = /* @__PURE__ */ new Map();
    json.extras.bufferViewByteLengthAccumulatedArray.push(0);
    const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent == null ? void 0 : meshComponent.mesh) {
        const gltf2Mesh = json.meshes[countMesh++];
        await this.rk(
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
  static async rk(json, mesh, gltf2Mesh, promises, bufferIdx, option, variantNameToIndex) {
    const primitiveCount = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveCount; j++) {
      const rnPrimitive = mesh.getPrimitiveAt(j);
      const primitive = gltf2Mesh.primitives[j];
      const rnMaterial = rnPrimitive.material;
      const material = await this.Vj(json, rnMaterial, promises, bufferIdx, option);
      const materialIndex = json.materials.length;
      json.materials.push(material);
      primitive.material = materialIndex;
      this.Tj(rnMaterial, materialIndex);
      __pruneUnusedVertexAttributes(primitive, material);
      await this.sk(
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
  static async sk(json, rnPrimitive, primitive, promises, bufferIdx, option, variantNameToIndex, baseMaterialIndex) {
    var _a;
    const variantNames = rnPrimitive.getVariantNames();
    if (variantNames.length === 0) {
      return;
    }
    const mappings = [];
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
        const gltfVariantMaterial = await this.Vj(
          json,
          variantMaterial,
          promises,
          bufferIdx,
          option
        );
        materialIndex = json.materials.length;
        json.materials.push(gltfVariantMaterial);
        this.Tj(variantMaterial, materialIndex);
      }
      const variantIndex = this.tk(json, variantName, variantNameToIndex);
      mappings.push({
        material: materialIndex,
        variants: [variantIndex]
      });
    }
    if (mappings.length === 0) {
      return;
    }
    primitive.extensions = (_a = primitive.extensions) != null ? _a : {};
    const primitiveExtensions = primitive.extensions;
    if (Is.exist(primitiveExtensions.KHR_materials_variants)) {
      primitiveExtensions.KHR_materials_variants.mappings.push(...mappings);
    } else {
      primitiveExtensions.KHR_materials_variants = {
        mappings
      };
    }
    this.Mj(json, "KHR_materials_variants");
  }
  static tk(json, variantName, variantNameToIndex) {
    let variantIndex = variantNameToIndex.get(variantName);
    if (variantIndex !== void 0) {
      return variantIndex;
    }
    const materialVariantsExtension = this.uk(json);
    variantIndex = materialVariantsExtension.variants.length;
    materialVariantsExtension.variants.push({
      name: variantName
    });
    variantNameToIndex.set(variantName, variantIndex);
    return variantIndex;
  }
  static uk(json) {
    if (Is.not.exist(json.extensions)) {
      json.extensions = {};
    }
    const rootExtensions = json.extensions;
    if (Is.not.exist(rootExtensions.KHR_materials_variants)) {
      rootExtensions.KHR_materials_variants = {
        variants: []
      };
    }
    return rootExtensions.KHR_materials_variants;
  }
  static async Vj(json, rnMaterial, promises, bufferIdx, option) {
    const material = {
      pbrMetallicRoughness: {
        metallicFactor: 1,
        roughnessFactor: 1
      }
    };
    if (Is.exist(rnMaterial)) {
      if (rnMaterial.isNodeBasedMaterial && rnMaterial.shaderNodeJson != null) {
        await this.vk(material, rnMaterial, json, promises, bufferIdx, option);
      } else {
        await this.wk(material, rnMaterial, json, promises, bufferIdx, option);
      }
    }
    return material;
  }
  /**
   * Sets up the RHODONITE_materials_node extension for node-based materials.
   *
   * @param material - The glTF material to add the extension to
   * @param rnMaterial - The Rhodonite material containing node-based shader data
   * @param json - The glTF JSON document
   * @param promises - Array to collect async operations
   * @param bufferIdx - The buffer index for texture data
   * @param option - Export options
   */
  static async vk(material, rnMaterial, json, promises, bufferIdx, option) {
    var _a;
    const EXTENSION_NAME = "RHODONITE_materials_node";
    if (!material.extensions) {
      material.extensions = {};
    }
    const rmnFileName = (_a = rnMaterial.shaderNodeFileName) != null ? _a : `${rnMaterial.materialTypeName}_${rnMaterial.materialUID}.rmn`;
    const extensionData = {
      uri: `./${rmnFileName}`
    };
    if (rnMaterial.shaderNodeUniforms != null) {
      extensionData.uniforms = { ...rnMaterial.shaderNodeUniforms };
    }
    const textureUniforms = await this.Wj(
      rnMaterial,
      json,
      promises,
      bufferIdx,
      option
    );
    if (Object.keys(textureUniforms).length > 0) {
      if (!extensionData.uniforms) {
        extensionData.uniforms = {};
      }
      Object.assign(extensionData.uniforms, textureUniforms);
    }
    material.extensions[EXTENSION_NAME] = extensionData;
    this.Mj(json, EXTENSION_NAME);
  }
  /**
   * Processes texture parameters from a node-based material and exports them to glTF format.
   *
   * @param rnMaterial - The Rhodonite material containing texture parameters
   * @param json - The glTF JSON document
   * @param promises - Array to collect async operations
   * @param bufferIdx - The buffer index for texture data
   * @param option - Export options
   * @returns Object mapping texture names to their glTF texture indices
   */
  static async Wj(rnMaterial, json, promises, bufferIdx, option, semanticFilter = () => true) {
    const textureUniforms = {};
    const existedImages = [];
    const processSampler = (rnSampler) => {
      const gltf2TextureSampler = {
        magFilter: rnSampler != null ? rnSampler.magFilter.index : TextureParameter.Linear.index,
        minFilter: rnSampler != null ? rnSampler.minFilter.index : TextureParameter.Linear.index,
        wrapS: rnSampler != null ? rnSampler.wrapS.index : TextureParameter.TextureWrapS.index,
        wrapT: rnSampler != null ? rnSampler.wrapT.index : TextureParameter.TextureWrapT.index
      };
      let samplerIdx = json.samplers.findIndex((sampler) => {
        return isSameGlTF2TextureSampler(gltf2TextureSampler, sampler);
      });
      if (samplerIdx === -1) {
        json.samplers.push(gltf2TextureSampler);
        samplerIdx = json.samplers.length - 1;
      }
      return samplerIdx;
    };
    const processImage = (rnTexture) => {
      var _a;
      let imageIndex = json.images.length;
      let match = false;
      for (let k = 0; k < json.images.length; k++) {
        const image = json.images[k];
        const existingTextureUid = (_a = image.extras) == null ? void 0 : _a.rnTextureUID;
        if (Is.exist(existingTextureUid) && existingTextureUid === rnTexture.textureUID) {
          imageIndex = k;
          match = true;
        }
      }
      if (!match) {
        const glTF2ImageEx = {
          uri: rnTexture.name,
          // GLB exports drop the uri, so keep the texture name for the importer.
          name: rnTexture.name || void 0,
          extras: {
            rnTextureUID: rnTexture.textureUID
          }
        };
        if (existedImages.indexOf(rnTexture.name) !== -1) {
          glTF2ImageEx.uri += `_${rnTexture.textureUID}`;
        }
        existedImages.push(glTF2ImageEx.uri);
        if (Is.not.exist(glTF2ImageEx.uri.match(/\.(png)/))) {
          glTF2ImageEx.uri += ".png";
        }
        const htmlCanvasElement = rnTexture.htmlCanvasElement;
        if (htmlCanvasElement) {
          const promise = new Promise(
            (resolve, rejected) => {
              htmlCanvasElement.toBlob((blob) => {
                if (Is.exist(blob)) {
                  handleTextureImage(json, bufferIdx, blob, option, glTF2ImageEx, resolve, rejected, GLTF2_EXPORT_GLTF);
                } else {
                  throw Error("canvas to blob error!");
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
    const processTexture = (rnTexture, rnSampler) => {
      if (!rnTexture) {
        return void 0;
      }
      if (!rnTexture.isTextureReady || rnTexture.isDummyTexture || rnTexture.width < 1 || rnTexture.height < 1) {
        return void 0;
      }
      const samplerIdx = processSampler(rnSampler);
      const imageIndex = processImage(rnTexture);
      const gltf2Texture = {
        sampler: samplerIdx,
        source: imageIndex
      };
      let textureIdx = json.textures.findIndex(
        (t) => t.sampler === gltf2Texture.sampler && t.source === gltf2Texture.source
      );
      if (textureIdx === -1) {
        json.textures.push(gltf2Texture);
        textureIdx = json.textures.length - 1;
      }
      return textureIdx;
    };
    const fieldsInfo = rnMaterial.fieldsInfoArray;
    for (const info of fieldsInfo) {
      const compositionType = info.compositionType;
      if (!semanticFilter(info.semantic)) {
        continue;
      }
      if (compositionType.index === 7 || // Texture2D
      compositionType.index === 8 || // TextureCube
      compositionType.index === 16 || // Texture2DShadow
      compositionType.index === 17 || // Texture2DRect
      compositionType.index === 18) {
        const textureParam = rnMaterial.getTextureParameter(info.semantic);
        if (textureParam && Array.isArray(textureParam) && textureParam.length >= 2) {
          const texture = textureParam[1];
          const sampler = textureParam[2];
          if (texture && !texture.isDummyTexture) {
            const textureIdx = processTexture(texture, sampler);
            if (textureIdx != null) {
              textureUniforms[info.semantic] = { index: textureIdx };
            }
          }
        }
      }
    }
    return textureUniforms;
  }
  /**
   * Exports the user-assigned textures of the shared raymarching material.
   *
   * The raymarching material is shared by every raymarching component, so its texture parameters
   * live at the glTF root instead of the per-node RHODONITE_raymarching extension. The images are
   * written into the standard glTF images/textures/samplers arrays, and the extension maps each
   * shader semantic to its texture index. Only textures declared by Texture2D nodes in the
   * material's graph are exported; engine-managed textures (IBL, shadow maps, the sheen LUT and
   * the transmission back buffer) are not.
   *
   * @param json - The output glTF JSON
   * @param option - Export options, including the raymarching material to export
   */
  static async bk(json, option) {
    const componentMaterials = option.raymarchingComponentMaterials;
    if (componentMaterials != null && componentMaterials.length > 0) {
      await this.xk(json, componentMaterials, option);
      return;
    }
    const raymarchingMaterial = option.raymarchingMaterial;
    if (raymarchingMaterial == null) {
      return;
    }
    const textures = await this.Xj(json, raymarchingMaterial, option);
    if (textures == null) {
      return;
    }
    if (Is.not.exist(json.extensions)) {
      json.extensions = {};
    }
    json.extensions.RHODONITE_raymarching_materials = {
      textures
    };
    this.Mj(json, "RHODONITE_raymarching_materials");
  }
  /**
   * Exports each component's raymarching textures into its `RHODONITE_raymarching` node
   * extension.
   *
   * The node index of an entity is assigned by {@link __createNodes}, so this runs after the
   * nodes are written. Texture indices refer to the shared glTF `textures` array, and images
   * are deduplicated by the normal texture processing.
   *
   * @param json - The output glTF JSON
   * @param componentMaterials - The per-component materials to export
   * @param option - Export options
   */
  static async xk(json, componentMaterials, option) {
    var _a;
    for (const { entity, material } of componentMaterials) {
      const nodeIndex = entity.gltfNodeIndex;
      if (nodeIndex == null) {
        continue;
      }
      const node = (_a = json.nodes) == null ? void 0 : _a[nodeIndex];
      if (node == null) {
        continue;
      }
      const textures = await this.Xj(json, material, option);
      if (textures == null) {
        continue;
      }
      if (Is.not.exist(node.extensions)) {
        node.extensions = {};
      }
      const extensions = node.extensions;
      let raymarchingExtension = extensions.RHODONITE_raymarching;
      if (raymarchingExtension == null) {
        raymarchingExtension = {};
        extensions.RHODONITE_raymarching = raymarchingExtension;
      }
      raymarchingExtension.textures = textures;
      this.Mj(json, "RHODONITE_raymarching");
    }
  }
  /**
   * Exports the user-assigned Texture2D parameters of a raymarching material.
   *
   * Only textures declared by Texture2D nodes in the graph are user-authored. The material
   * also carries engine-managed textures (IBL, shadows, the sheen LUT, the transmission back
   * buffer), and exporting those would embed environment/shadow data into the scene.
   *
   * @param json - The output glTF JSON
   * @param material - The material whose textures are exported
   * @param option - Export options
   * @returns The semantic to texture-index map, or undefined when the material has none
   */
  static async Xj(json, material, option) {
    var _a, _b, _c;
    const shaderNodeJson = material.shaderNodeJson;
    const userTextureSemantics = /* @__PURE__ */ new Set();
    for (const node of (_a = shaderNodeJson == null ? void 0 : shaderNodeJson.nodes) != null ? _a : []) {
      if (node.name === "Texture2D") {
        const semantic = (_c = (_b = node.controls) == null ? void 0 : _b.name) == null ? void 0 : _c.value;
        if (typeof semantic === "string" && semantic.length > 0) {
          userTextureSemantics.add(semantic);
        }
      }
    }
    if (userTextureSemantics.size === 0) {
      return void 0;
    }
    const promises = [];
    json.extras.bufferViewByteLengthAccumulatedArray.push(0);
    const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;
    const textures = await this.Wj(
      material,
      json,
      promises,
      bufferIdx,
      option,
      (semantic) => userTextureSemantics.has(semantic)
    );
    await Promise.all(promises);
    return Object.keys(textures).length > 0 ? textures : void 0;
  }
  static async wk(material, rnMaterial, json, promises, bufferIdx, option) {
    const existedImages = [];
    const processSampler = (rnSampler) => {
      const gltf2TextureSampler = {
        magFilter: rnSampler != null ? rnSampler.magFilter.index : TextureParameter.Linear.index,
        minFilter: rnSampler != null ? rnSampler.minFilter.index : TextureParameter.Linear.index,
        wrapS: rnSampler != null ? rnSampler.wrapS.index : TextureParameter.TextureWrapS.index,
        wrapT: rnSampler != null ? rnSampler.wrapT.index : TextureParameter.TextureWrapT.index
      };
      let samplerIdx = json.samplers.findIndex((sampler) => {
        return isSameGlTF2TextureSampler(gltf2TextureSampler, sampler);
      });
      if (samplerIdx === -1) {
        json.samplers.push(gltf2TextureSampler);
        samplerIdx = json.samplers.length - 1;
      }
      return samplerIdx;
    };
    const processImage = (rnTexture) => {
      var _a;
      let imageIndex = json.images.length;
      let match = false;
      for (let k = 0; k < json.images.length; k++) {
        const image = json.images[k];
        const existingTextureUid = (_a = image.extras) == null ? void 0 : _a.rnTextureUID;
        if (Is.exist(existingTextureUid) && existingTextureUid === rnTexture.textureUID) {
          imageIndex = k;
          match = true;
        }
      }
      if (!match) {
        const glTF2ImageEx = {
          uri: rnTexture.name,
          // GLB exports drop the uri, so keep the texture name for the importer.
          name: rnTexture.name || void 0,
          extras: {
            rnTextureUID: rnTexture.textureUID
          }
        };
        if (existedImages.indexOf(rnTexture.name) !== -1) {
          glTF2ImageEx.uri += `_${rnTexture.textureUID}`;
        }
        existedImages.push(glTF2ImageEx.uri);
        if (Is.not.exist(glTF2ImageEx.uri.match(/\.(png)/))) {
          glTF2ImageEx.uri += ".png";
        }
        const htmlCanvasElement = rnTexture.htmlCanvasElement;
        if (htmlCanvasElement) {
          const promise = new Promise(
            (resolve, rejected) => {
              htmlCanvasElement.toBlob((blob) => {
                if (Is.exist(blob)) {
                  handleTextureImage(json, bufferIdx, blob, option, glTF2ImageEx, resolve, rejected, GLTF2_EXPORT_GLTF);
                } else {
                  throw Error("canvas to blob error!");
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
    const processTexture = (rnTexture, rnSampler) => {
      const texture = rnTexture;
      if (!texture) {
        return void 0;
      }
      if (!texture.isTextureReady || texture.isDummyTexture || texture.width < 1 || texture.height < 1) {
        return void 0;
      }
      const samplerIdx = processSampler(rnSampler);
      const imageIndex = processImage(texture);
      const gltf2Texture = {
        sampler: samplerIdx,
        source: imageIndex
      };
      const textureIdx = json.textures.indexOf(gltf2Texture);
      if (textureIdx === -1) {
        json.textures.push(gltf2Texture);
      }
      return json.textures.indexOf(gltf2Texture);
    };
    this.yk(json, material, rnMaterial, processTexture);
  }
  static yk(json, material, rnMaterial, processTexture) {
    const ensureExtensionUsed = (extensionName) => {
      if (json.extensionsUsed.indexOf(extensionName) === -1) {
        json.extensionsUsed.push(extensionName);
      }
    };
    const coerceNumber = (value) => {
      if (Is.not.exist(value)) {
        return void 0;
      }
      if (typeof value === "number") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : void 0;
      }
      if (typeof value === "object") {
        if (typeof value.x === "number" && typeof value.y === "undefined") {
          return value.x;
        }
        if (ArrayBuffer.isView(value)) {
          const view = value;
          if (isNumericArrayBufferView(view) && view.length > 0) {
            return view[0];
          }
        }
        const internal = value._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal;
          if (isNumericArrayBufferView(view) && view.length > 0) {
            return view[0];
          }
        }
        if (Array.isArray(internal)) {
          return internal.length > 0 ? internal[0] : void 0;
        }
      }
      return void 0;
    };
    const coerceVec2 = (value) => {
      if (Is.not.exist(value)) {
        return void 0;
      }
      if (Array.isArray(value)) {
        if (value.length >= 2) {
          return [value[0], value[1]];
        }
        if (value.length === 1) {
          return [value[0], value[0]];
        }
      }
      if (typeof value === "object") {
        if (typeof value.x === "number" && typeof value.y === "number") {
          return [value.x, value.y];
        }
        const internal = value._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal;
          if (isNumericArrayBufferView(view) && view.length >= 2) {
            return [view[0], view[1]];
          }
        }
        if (Array.isArray(internal) && internal.length >= 2) {
          return [internal[0], internal[1]];
        }
        if (ArrayBuffer.isView(value)) {
          const view = value;
          if (isNumericArrayBufferView(view) && view.length >= 2) {
            return [view[0], view[1]];
          }
        }
      }
      return void 0;
    };
    const coerceVec3 = (value) => {
      if (Is.not.exist(value)) {
        return void 0;
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
      if (typeof value === "object") {
        if (typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number") {
          return [value.x, value.y, value.z];
        }
        const internal = value._v;
        if (ArrayBuffer.isView(internal)) {
          const view = internal;
          if (isNumericArrayBufferView(view) && view.length >= 3) {
            return [view[0], view[1], view[2]];
          }
        }
        if (Array.isArray(internal) && internal.length >= 3) {
          return [internal[0], internal[1], internal[2]];
        }
        if (ArrayBuffer.isView(value)) {
          const view = value;
          if (isNumericArrayBufferView(view) && view.length >= 3) {
            return [view[0], view[1], view[2]];
          }
        }
      }
      return void 0;
    };
    const applyTexture = (paramName, options) => {
      var _a;
      const textureParam = rnMaterial.getTextureParameter(paramName);
      if (Is.not.exist(textureParam)) {
        return;
      }
      const rnTexture = textureParam[1];
      const rnSampler = textureParam[2];
      const textureIndex = processTexture(rnTexture, rnSampler);
      if (textureIndex == null) {
        return;
      }
      const info = {
        index: textureIndex
      };
      if (Is.exist(options.texCoordParam)) {
        const texCoordValue = coerceNumber(rnMaterial.getParameter(options.texCoordParam));
        if (Is.exist(texCoordValue)) {
          info.texCoord = texCoordValue;
        }
      }
      if (Is.exist(options.scaleParam)) {
        const scaleValue = coerceNumber(rnMaterial.getParameter(options.scaleParam));
        if (Is.exist(scaleValue)) {
          info.scale = scaleValue;
        }
      }
      if (Is.exist(options.strengthParam)) {
        const strengthValue = coerceNumber(rnMaterial.getParameter(options.strengthParam));
        if (Is.exist(strengthValue)) {
          info.strength = strengthValue;
        }
      }
      if (Is.exist(options.transform)) {
        const scale = Is.exist(options.transform.scale) ? coerceVec2(rnMaterial.getParameter(options.transform.scale)) : void 0;
        const offset = Is.exist(options.transform.offset) ? coerceVec2(rnMaterial.getParameter(options.transform.offset)) : void 0;
        const rotation = Is.exist(options.transform.rotation) ? coerceNumber(rnMaterial.getParameter(options.transform.rotation)) : void 0;
        if (Is.exist(scale) || Is.exist(offset) || Is.exist(rotation)) {
          const transform = {};
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
            info.extensions = (_a = info.extensions) != null ? _a : {};
            info.extensions.KHR_texture_transform = transform;
            ensureExtensionUsed("KHR_texture_transform");
          }
        }
      }
      options.onAssign(info);
    };
    const isUnlitMaterial = Is.false(rnMaterial.isLighting);
    __outputBaseMaterialInfo(rnMaterial, applyTexture, material, json, {
      skipAdditionalTextures: isUnlitMaterial
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
  static dk(json) {
    if (Is.undefined(json.accessors) || Is.undefined(json.bufferViews)) {
      return new ArrayBuffer(0);
    }
    const byteLengthOfUniteBuffer = json.bufferViews.reduce((sum, bufferView) => {
      var _a;
      const source = (_a = bufferView.extras) == null ? void 0 : _a.uint8Array;
      if (Is.not.exist(source)) {
        return sum + DataUtil.addPaddingBytes(bufferView.byteLength, 4);
      }
      return sum + DataUtil.addPaddingBytes(source.byteLength, 4);
    }, 0);
    if (byteLengthOfUniteBuffer > 0) {
      const buffer = json.buffers[0];
      buffer.byteLength = byteLengthOfUniteBuffer + DataUtil.calcPaddingBytes(byteLengthOfUniteBuffer, 4);
    }
    const arrayBuffer = new ArrayBuffer(json.buffers[0].byteLength);
    let lastCopiedByteLengthOfBufferView = 0;
    for (let i = 0; i < json.bufferViews.length; i++) {
      const bufferView = json.bufferViews[i];
      const uint8ArrayOfBufferView = bufferView.extras.uint8Array;
      bufferView.extras = void 0;
      const distByteOffset = lastCopiedByteLengthOfBufferView;
      DataUtil.copyArrayBufferWithPadding({
        src: uint8ArrayOfBufferView.buffer,
        dist: arrayBuffer,
        srcByteOffset: uint8ArrayOfBufferView.byteOffset,
        copyByteLength: uint8ArrayOfBufferView.byteLength,
        distByteOffset
      });
      lastCopiedByteLengthOfBufferView += DataUtil.addPaddingBytes(uint8ArrayOfBufferView.byteLength, 4);
      bufferView.byteOffset = distByteOffset;
      bufferView.buffer = 0;
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
  static ek(_json, filename, arraybuffer) {
    {
      const a = document.createElement("a");
      a.download = `${filename}.glb`;
      const blob = new Blob([arraybuffer], { type: "octet/stream" });
      const url = URL.createObjectURL(blob);
      a.href = url;
      const e = new MouseEvent("click");
      a.dispatchEvent(e);
    }
  }
  /**
   * Placeholder method for future glTF2 ArrayBuffer export functionality.
   *
   * This method is reserved for implementing glTF2 export that returns
   * an ArrayBuffer without triggering a download.
   */
  exportGlbAsArrayBuffer() {
  }
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
  static fk(json, filename, arraybuffer) {
    {
      const a = document.createElement("a");
      a.download = `${filename}.gltf`;
      const str = JSON.stringify(json, null, 2);
      a.href = `data:application/octet-stream,${encodeURIComponent(str)}`;
      const e = new MouseEvent("click");
      a.dispatchEvent(e);
    }
    {
      const a = document.createElement("a");
      a.download = `${filename}.bin`;
      const blob = new Blob([arraybuffer], { type: "octet/stream" });
      const url = URL.createObjectURL(blob);
      a.href = url;
      const e = new MouseEvent("click");
      a.dispatchEvent(e);
    }
  }
};
Gltf2Exporter.Nj = /* @__PURE__ */ new Map();
Gltf2Exporter.Pj = /* @__PURE__ */ new Map();
Gltf2Exporter.Qj = /* @__PURE__ */ new Map();
Gltf2Exporter.Rj = /* @__PURE__ */ new Map();
Gltf2Exporter.Sj = /* @__PURE__ */ new Set();
var MATERIAL_POINTER_SUFFIX_MAP = {
  baseColorFactor: "/pbrMetallicRoughness/baseColorFactor",
  metallicFactor: "/pbrMetallicRoughness/metallicFactor",
  roughnessFactor: "/pbrMetallicRoughness/roughnessFactor",
  emissiveFactor: "/emissiveFactor",
  emissiveStrength: "/extensions/KHR_materials_emissive_strength/emissiveStrength",
  diffuseTransmissionFactor: "/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor",
  diffuseTransmissionColorFactor: "/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor",
  transmissionFactor: "/extensions/KHR_materials_transmission/transmissionFactor",
  thicknessFactor: "/extensions/KHR_materials_volume/thicknessFactor",
  attenuationDistance: "/extensions/KHR_materials_volume/attenuationDistance",
  attenuationColor: "/extensions/KHR_materials_volume/attenuationColor",
  dispersion: "/extensions/KHR_materials_dispersion/dispersion",
  ior: "/extensions/KHR_materials_ior/ior",
  iridescenceFactor: "/extensions/KHR_materials_iridescence/iridescenceFactor",
  iridescenceIor: "/extensions/KHR_materials_iridescence/iridescenceIor",
  iridescenceThicknessMinimum: "/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum",
  iridescenceThicknessMaximum: "/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum",
  clearcoatFactor: "/extensions/KHR_materials_clearcoat/clearcoatFactor",
  clearcoatRoughnessFactor: "/extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor",
  clearcoatNormalScale: "/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale",
  clearcoatNormalTextureScale: "/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale",
  sheenColorFactor: "/extensions/KHR_materials_sheen/sheenColorFactor",
  sheenRoughnessFactor: "/extensions/KHR_materials_sheen/sheenRoughnessFactor",
  specularFactor: "/extensions/KHR_materials_specular/specularFactor",
  specularColorFactor: "/extensions/KHR_materials_specular/specularColorFactor",
  anisotropyStrength: "/extensions/KHR_materials_anisotropy/anisotropyStrength",
  anisotropyRotation: "/extensions/KHR_materials_anisotropy/anisotropyRotation",
  normalScale: "/normalTexture/scale",
  occlusionStrength: "/occlusionTexture/strength"
};
var MATERIAL_TEXTURE_PATHS = {
  baseColorTexture: "/pbrMetallicRoughness/baseColorTexture",
  metallicRoughnessTexture: "/pbrMetallicRoughness/metallicRoughnessTexture",
  normalTexture: "/normalTexture",
  occlusionTexture: "/occlusionTexture",
  emissiveTexture: "/emissiveTexture",
  diffuseTransmissionTexture: "/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture",
  diffuseTransmissionColorTexture: "/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture",
  transmissionTexture: "/extensions/KHR_materials_transmission/transmissionTexture",
  thicknessTexture: "/extensions/KHR_materials_volume/thicknessTexture",
  clearcoatTexture: "/extensions/KHR_materials_clearcoat/clearcoatTexture",
  clearcoatRoughnessTexture: "/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture",
  clearcoatNormalTexture: "/extensions/KHR_materials_clearcoat/clearcoatNormalTexture",
  sheenColorTexture: "/extensions/KHR_materials_sheen/sheenColorTexture",
  sheenRoughnessTexture: "/extensions/KHR_materials_sheen/sheenRoughnessTexture",
  specularTexture: "/extensions/KHR_materials_specular/specularTexture",
  specularColorTexture: "/extensions/KHR_materials_specular/specularColorTexture",
  iridescenceTexture: "/extensions/KHR_materials_iridescence/iridescenceTexture",
  iridescenceThicknessTexture: "/extensions/KHR_materials_iridescence/iridescenceThicknessTexture",
  anisotropyTexture: "/extensions/KHR_materials_anisotropy/anisotropyTexture"
};
var LIGHT_POINTER_SUFFIX_MAP = {
  light_color: "/color",
  light_intensity: "/intensity",
  light_range: "/range",
  light_spot_innerConeAngle: "/spot/innerConeAngle",
  light_spot_outerConeAngle: "/spot/outerConeAngle"
};
export {
  GLTF2_EXPORT_DRACO,
  GLTF2_EXPORT_EMBEDDED,
  GLTF2_EXPORT_GLB,
  GLTF2_EXPORT_GLTF,
  GLTF2_EXPORT_NO_DOWNLOAD,
  Gltf2Exporter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZXhwb3J0ZXIvR2x0ZjJFeHBvcnRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBbmltYXRpb25DaGFubmVsLCBBbmltYXRpb25QYXRoTmFtZSB9IGZyb20gJy4uLy4uL3R5cGVzL0FuaW1hdGlvblR5cGVzJztcbmltcG9ydCB7XG4gIHR5cGUgR2x0ZjIsXG4gIHR5cGUgR2x0ZjJDYW1lcmEsXG4gIHR5cGUgR2x0ZjJNZXNoLFxuICB0eXBlIEdsdGYyTm9kZSxcbiAgdHlwZSBHbHRmMlRleHR1cmUsXG4gIHR5cGUgR2x0ZjJUZXh0dXJlU2FtcGxlcixcbiAgaXNTYW1lR2xURjJUZXh0dXJlU2FtcGxlcixcbiAgdHlwZSBLSFJfbGlnaHRzX3B1bmN0dWFsLFxuICB0eXBlIEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQsXG4gIHR5cGUgS0hSX21hdGVyaWFsc192YXJpYW50cyxcbiAgdHlwZSBLSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzX1ByaW1pdGl2ZUV4dGVuc2lvbixcbiAgVGFnS2hyTm9kZVZpc2liaWxpdHlFbmFibGVkLFxuICBUYWdLaHJOb2RlVmlzaWJpbGl0eVZpc2libGUsXG59IGZyb20gJy4uLy4uL3R5cGVzL2dsVEYyJztcbmltcG9ydCB0eXBlIHsgR2x0ZjJFeCwgR2x0ZjJJbWFnZUV4LCBHbHRmMk1hdGVyaWFsRXggfSBmcm9tICcuLi8uLi90eXBlcy9nbFRGMkZvck91dHB1dCc7XG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSAnLi4vLi4vdmVyc2lvbic7XG5pbXBvcnQgdHlwZSB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IExpZ2h0Q29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9MaWdodC9MaWdodENvbXBvbmVudCc7XG5pbXBvcnQgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBUYWcgfSBmcm9tICcuLi9jb3JlL1JuT2JqZWN0JztcbmltcG9ydCB7IENhbWVyYVR5cGUsIExpZ2h0VHlwZSwgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uL2RlZmluaXRpb25zJztcbmltcG9ydCB0eXBlIHsgTWVzaCB9IGZyb20gJy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHR5cGUgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBJQW5pbWF0aW9uRW50aXR5LCBJTWVzaEVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHksIElTa2VsZXRhbEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB0eXBlIHsgTWF0ZXJpYWwgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IElBbmltYXRlZFZhbHVlIH0gZnJvbSAnLi4vbWF0aC9JQW5pbWF0ZWRWYWx1ZSc7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4uL21hdGgvTWF0aFV0aWwnO1xuaW1wb3J0IHsgUXVhdGVybmlvbiB9IGZyb20gJy4uL21hdGgvUXVhdGVybmlvbic7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc29yIH0gZnJvbSAnLi4vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyIH0gZnJvbSAnLi4vbWVtb3J5L0J1ZmZlcic7XG5pbXBvcnQgdHlwZSB7IEJ1ZmZlclZpZXcgfSBmcm9tICcuLi9tZW1vcnkvQnVmZmVyVmlldyc7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEFic3RyYWN0VGV4dHVyZSB9IGZyb20gJy4uL3RleHR1cmVzL0Fic3RyYWN0VGV4dHVyZSc7XG5pbXBvcnQgdHlwZSB7IFNhbXBsZXIgfSBmcm9tICcuLi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB0eXBlIHsgVGV4dHVyZSB9IGZyb20gJy4uL3RleHR1cmVzL1RleHR1cmUnO1xuaW1wb3J0IHsgY3JlYXRlRWZmZWtzZWVyIH0gZnJvbSAnLi9HbHRmMkV4cG9ydGVyRWZmZWtzZWVyJztcbmltcG9ydCB7XG4gIF9fY3JlYXRlQnVmZmVyVmlld3NBbmRBY2Nlc3NvcnNPZkFuaW1hdGlvbixcbiAgX19jcmVhdGVCdWZmZXJWaWV3c0FuZEFjY2Vzc29yc09mTWVzaCxcbiAgX19jcmVhdGVCdWZmZXJWaWV3c0FuZEFjY2Vzc29yc09mU2tpbixcbiAgX19kZWxldGVFbXB0eUFycmF5cyxcbiAgX19vdXRwdXRCYXNlTWF0ZXJpYWxJbmZvLFxuICBfX291dHB1dEtock1hdGVyaWFsc0FuaXNvdHJvcHlJbmZvLFxuICBfX291dHB1dEtock1hdGVyaWFsc0NsZWFyY29hdEluZm8sXG4gIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRGlmZnVzZVRyYW5zbWlzc2lvbkluZm8sXG4gIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRGlzcGVyc2lvbkluZm8sXG4gIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRW1pc3NpdmVTdHJlbmd0aEluZm8sXG4gIF9fb3V0cHV0S2hyTWF0ZXJpYWxzSW9ySW5mbyxcbiAgX19vdXRwdXRLaHJNYXRlcmlhbHNJcmlkZXNjZW5jZUluZm8sXG4gIF9fb3V0cHV0S2hyTWF0ZXJpYWxzU2hlZW5JbmZvLFxuICBfX291dHB1dEtock1hdGVyaWFsc1NwZWN1bGFySW5mbyxcbiAgX19vdXRwdXRLaHJNYXRlcmlhbHNUcmFuc21pc3Npb25JbmZvLFxuICBfX291dHB1dEtock1hdGVyaWFsc1ZvbHVtZUluZm8sXG4gIF9fcHJ1bmVVbnVzZWRWZXJ0ZXhBdHRyaWJ1dGVzLFxuICBfX3JlbW92ZVVudXNlZEFjY2Vzc29yc0FuZEJ1ZmZlclZpZXdzLFxuICB0eXBlIEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRPdmVycmlkZSxcbiAgdHlwZSBBbmltYXRpb25DaGFubmVsVGFyZ2V0UmVzb2x1dGlvbixcbiAgdHlwZSBBbmltYXRpb25FeHBvcnRPcHRpb25zLFxuICBnZW5lcmF0ZUdsYkFycmF5QnVmZmVyLFxuICBoYW5kbGVUZXh0dXJlSW1hZ2UsXG4gIGlzTnVtZXJpY0FycmF5QnVmZmVyVmlldyxcbiAgaXNSdW50aW1lT25seUFuaW1hdGlvblBhdGgsXG59IGZyb20gJy4vR2x0ZjJFeHBvcnRlck9wcyc7XG5cbmV4cG9ydCBjb25zdCBHTFRGMl9FWFBPUlRfR0xURiA9ICdnbFRGJztcbmV4cG9ydCBjb25zdCBHTFRGMl9FWFBPUlRfR0xCID0gJ2dsVEYtQmluYXJ5JztcbmV4cG9ydCBjb25zdCBHTFRGMl9FWFBPUlRfRFJBQ08gPSAnZ2xURi1EcmFjbyc7XG5leHBvcnQgY29uc3QgR0xURjJfRVhQT1JUX0VNQkVEREVEID0gJ2dsVEYtRW1iZWRkZWQnO1xuZXhwb3J0IGNvbnN0IEdMVEYyX0VYUE9SVF9OT19ET1dOTE9BRCA9ICdOby1Eb3dubG9hZCc7XG5cbi8qKlxuICogZ2xURjIgRXhwb3J0IFR5cGUgZGVmaW5pdGlvbnNcbiAqL1xuZXhwb3J0IHR5cGUgR2x0ZjJFeHBvcnRUeXBlID1cbiAgfCB0eXBlb2YgR0xURjJfRVhQT1JUX0dMVEZcbiAgfCB0eXBlb2YgR0xURjJfRVhQT1JUX0dMQlxuICB8IHR5cGVvZiBHTFRGMl9FWFBPUlRfRFJBQ09cbiAgfCB0eXBlb2YgR0xURjJfRVhQT1JUX0VNQkVEREVEXG4gIHwgdHlwZW9mIEdMVEYyX0VYUE9SVF9OT19ET1dOTE9BRDtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIGdsVEYyIGV4cG9ydCBwcm9jZXNzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2x0ZjJFeHBvcnRlckFyZ3VtZW50cyB7XG4gIC8qKiBUYXJnZXQgZW50aXRpZXMgdG8gZXhwb3J0LiBJZiBzcGVjaWZpZWQsIGluY2x1ZGVzIHRoZWlyIGRlc2NlbmRhbnRzIGluIHRoZSBvdXRwdXQgKi9cbiAgZW50aXRpZXM/OiBJU2NlbmVHcmFwaEVudGl0eVtdO1xuICAvKiogRXhwb3J0IGZvcm1hdCB0eXBlICovXG4gIHR5cGU6IEdsdGYyRXhwb3J0VHlwZTtcbiAgLyoqIFRhZ3MgdG8gZXhjbHVkZSBmcm9tIGV4cG9ydCAqL1xuICBleGNsdWRlVGFncz86IFRhZ1tdO1xuICAvKipcbiAgICogVGhlIHNoYXJlZCByYXltYXJjaGluZyBtYXRlcmlhbC4gSXRzIHVzZXItYXNzaWduZWQgVGV4dHVyZTJEIHBhcmFtZXRlcnMgYXJlIGV4cG9ydGVkIHRvIHRoZVxuICAgKiBSSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzIHJvb3QgZXh0ZW5zaW9uIHNvIHRoYXQgdGhleSBzdXJ2aXZlIGEgc2F2ZS9sb2FkIHJvdW5kIHRyaXAuXG4gICAqIElnbm9yZWQgd2hlbiBgcmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHNgIGlzIHByb3ZpZGVkLlxuICAgKi9cbiAgcmF5bWFyY2hpbmdNYXRlcmlhbD86IE1hdGVyaWFsO1xuICAvKipcbiAgICogUGVyLWNvbXBvbmVudCByYXltYXJjaGluZyBtYXRlcmlhbHMuIEVhY2ggbWF0ZXJpYWwncyB1c2VyLWFzc2lnbmVkIFRleHR1cmUyRCBwYXJhbWV0ZXJzIGFyZVxuICAgKiBleHBvcnRlZCBpbnRvIHRoYXQgY29tcG9uZW50J3MgYFJIT0RPTklURV9yYXltYXJjaGluZ2Agbm9kZSBleHRlbnNpb24sIHNvIGNvbXBvbmVudHMgd2l0aFxuICAgKiBkaWZmZXJlbnQgdGV4dHVyZXMgcm91bmQtdHJpcCBpbmRlcGVuZGVudGx5LiBXaGVuIHByb3ZpZGVkIChub24tZW1wdHkpLCB0aGUgcm9vdCBzaGFyZWRcbiAgICogdGV4dHVyZSBleHRlbnNpb24gaXMgbm90IHdyaXR0ZW4uXG4gICAqL1xuICByYXltYXJjaGluZ0NvbXBvbmVudE1hdGVyaWFscz86IHsgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eTsgbWF0ZXJpYWw6IE1hdGVyaWFsIH1bXTtcbn1cblxuLyoqXG4gKiBUaGUgZ2xURjIgZm9ybWF0IEV4cG9ydGVyIGNsYXNzLlxuICpcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgZnVuY3Rpb25hbGl0eSB0byBleHBvcnQgUmhvZG9uaXRlIHNjZW5lIGRhdGEgdG8gZ2xURiAyLjAgZm9ybWF0LlxuICogSXQgc3VwcG9ydHMgdmFyaW91cyBleHBvcnQgZm9ybWF0cyBpbmNsdWRpbmcgLmdsdGYsIC5nbGIsIGFuZCBlbWJlZGRlZCBmb3JtYXRzLlxuICovXG5leHBvcnQgY2xhc3MgR2x0ZjJFeHBvcnRlciB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbWF0ZXJpYWxUb0dsdGZNYXRlcmlhbEluZGljZXM6IE1hcDxNYXRlcmlhbCwgbnVtYmVyW10+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX2xpZ2h0Q29tcG9uZW50VG9MaWdodEluZGV4OiBNYXA8TGlnaHRDb21wb25lbnQsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fY2FtZXJhQ29tcG9uZW50VG9DYW1lcmFJbmRleDogTWFwPENhbWVyYUNvbXBvbmVudCwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19leHBvcnRlZFBvaW50ZXJUYXJnZXRzQnlUcmFjazogTWFwPHN0cmluZywgU2V0PHN0cmluZz4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3dhcm5lZE1hdGVyaWFsU2VtYW50aWNzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblxuICAvKipcbiAgICogRXhwb3J0cyBzY2VuZSBkYXRhIGZyb20gdGhlIFJob2Rvbml0ZSBzeXN0ZW0gaW4gZ2xURjIgZm9ybWF0LlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYWluIGVudHJ5IHBvaW50IGZvciBnbFRGMiBleHBvcnQgZnVuY3Rpb25hbGl0eS4gSXQgcHJvY2Vzc2VzXG4gICAqIHRoZSBzY2VuZSBncmFwaCwgbWF0ZXJpYWxzLCBhbmltYXRpb25zLCBhbmQgb3RoZXIgZGF0YSB0byBjcmVhdGUgYSBjb21wbGV0ZVxuICAgKiBnbFRGMiBvdXRwdXQgaW4gdGhlIHNwZWNpZmllZCBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWxlbmFtZSAtIFRoZSB0YXJnZXQgb3V0cHV0IGZpbGVuYW1lICh3aXRob3V0IGV4dGVuc2lvbilcbiAgICogQHBhcmFtIG9wdGlvbiAtIEV4cG9ydCBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBnZW5lcmF0ZWQgZ2xURjIgQXJyYXlCdWZmZXJcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBidWZmZXIgPSBhd2FpdCBHbHRmMkV4cG9ydGVyLmV4cG9ydCgnbXlTY2VuZScsIHtcbiAgICogICB0eXBlOiBHTFRGMl9FWFBPUlRfR0xCLFxuICAgKiAgIGVudGl0aWVzOiBbcm9vdEVudGl0eV1cbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGV4cG9ydChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBmaWxlbmFtZTogc3RyaW5nLFxuICAgIG9wdGlvbjogR2x0ZjJFeHBvcnRlckFyZ3VtZW50cyA9IHtcbiAgICAgIGVudGl0aWVzOiB1bmRlZmluZWQsXG4gICAgICB0eXBlOiBHTFRGMl9FWFBPUlRfR0xCLFxuICAgIH1cbiAgKSB7XG4gICAgY29uc3QgeyBjb2xsZWN0ZWRFbnRpdGllcywgdG9wTGV2ZWxFbnRpdGllcyB9ID0gdGhpcy5fX2NvbGxlY3RFbnRpdGllcyhlbmdpbmUsIG9wdGlvbik7XG5cbiAgICB0aGlzLl9fbWF0ZXJpYWxUb0dsdGZNYXRlcmlhbEluZGljZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9fbGlnaHRDb21wb25lbnRUb0xpZ2h0SW5kZXguY2xlYXIoKTtcbiAgICB0aGlzLl9fY2FtZXJhQ29tcG9uZW50VG9DYW1lcmFJbmRleC5jbGVhcigpO1xuICAgIHRoaXMuX19leHBvcnRlZFBvaW50ZXJUYXJnZXRzQnlUcmFjay5jbGVhcigpO1xuICAgIHRoaXMuX193YXJuZWRNYXRlcmlhbFNlbWFudGljcy5jbGVhcigpO1xuXG4gICAgY29uc3QgeyBqc29uLCBmaWxlTmFtZSB9OiB7IGpzb246IEdsdGYyRXg7IGZpbGVOYW1lOiBzdHJpbmcgfSA9IHRoaXMuX19jcmVhdGVKc29uQmFzZShmaWxlbmFtZSk7XG5cbiAgICB0aGlzLl9fY3JlYXRlQnVmZmVyVmlld3NBbmRBY2Nlc3NvcnMoanNvbiwgY29sbGVjdGVkRW50aXRpZXMpO1xuXG4gICAgdGhpcy5fX2NyZWF0ZU5vZGVzKGpzb24sIGNvbGxlY3RlZEVudGl0aWVzLCB0b3BMZXZlbEVudGl0aWVzKTtcblxuICAgIGF3YWl0IHRoaXMuX19jcmVhdGVNYXRlcmlhbHMoanNvbiwgY29sbGVjdGVkRW50aXRpZXMgYXMgdW5rbm93biBhcyBJTWVzaEVudGl0eVtdLCBvcHRpb24pO1xuICAgIGF3YWl0IHRoaXMuX19leHBvcnRSYXltYXJjaGluZ01hdGVyaWFscyhqc29uLCBvcHRpb24pO1xuXG4gICAgdGhpcy5fX2NyZWF0ZUFuaW1hdGlvbkRhdGEoanNvbiwgY29sbGVjdGVkRW50aXRpZXMgYXMgdW5rbm93biBhcyBJQW5pbWF0aW9uRW50aXR5W10pO1xuXG4gICAgY3JlYXRlRWZmZWtzZWVyKGpzb24sIGNvbGxlY3RlZEVudGl0aWVzKTtcblxuICAgIF9fcmVtb3ZlVW51c2VkQWNjZXNzb3JzQW5kQnVmZmVyVmlld3MoanNvbik7XG5cbiAgICBjb25zdCBhcnJheWJ1ZmZlciA9IHRoaXMuX19jcmVhdGVCaW5hcnkoanNvbik7XG5cbiAgICBfX2RlbGV0ZUVtcHR5QXJyYXlzKGpzb24pO1xuXG4gICAgY29uc3QgZ2xiQXJyYXlCdWZmZXIgPSBnZW5lcmF0ZUdsYkFycmF5QnVmZmVyKGpzb24sIGFycmF5YnVmZmVyKTtcblxuICAgIGlmIChvcHRpb24udHlwZSA9PT0gR0xURjJfRVhQT1JUX0dMQikge1xuICAgICAgdGhpcy5fX2Rvd25sb2FkR2xiKGpzb24sIGZpbGVOYW1lLCBnbGJBcnJheUJ1ZmZlcik7XG4gICAgfSBlbHNlIGlmIChvcHRpb24udHlwZSA9PT0gR0xURjJfRVhQT1JUX0dMVEYpIHtcbiAgICAgIHRoaXMuX19kb3dubG9hZEdsdGYoanNvbiwgZmlsZU5hbWUsIGFycmF5YnVmZmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2xiQXJyYXlCdWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGFyZ2V0IGVudGl0aWVzIGZvciBleHBvcnQsIGluY2x1ZGluZyB0aGVpciBkZXNjZW5kYW50cy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgcHJvY2Vzc2VzIHRoZSBlbnRpdHkgaGllcmFyY2h5IHRvIGRldGVybWluZSB3aGljaCBlbnRpdGllcyBzaG91bGRcbiAgICogYmUgaW5jbHVkZWQgaW4gdGhlIGV4cG9ydC4gSXQgaGFuZGxlcyB0YWctYmFzZWQgZmlsdGVyaW5nIGFuZCBlbnN1cmVzIHRoYXRcbiAgICogaGllcmFyY2hpY2FsIHJlbGF0aW9uc2hpcHMgYXJlIHByZXNlcnZlZC5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbiAtIEV4cG9ydCBjb25maWd1cmF0aW9uIG9wdGlvbnMgY29udGFpbmluZyBlbnRpdHkgZmlsdGVyc1xuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBjb2xsZWN0ZWQgZW50aXRpZXMgYW5kIHRvcC1sZXZlbCBlbnRpdGllc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb2xsZWN0RW50aXRpZXMoZW5naW5lOiBFbmdpbmUsIG9wdGlvbjogR2x0ZjJFeHBvcnRlckFyZ3VtZW50cyB8IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGNoZWNrUGFzc09yTm90V2l0aFRhZ3MgPSAoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkgPT4ge1xuICAgICAgaWYgKElzLmV4aXN0KG9wdGlvbikgJiYgSXMuZXhpc3Qob3B0aW9uLmV4Y2x1ZGVUYWdzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiBvcHRpb24uZXhjbHVkZVRhZ3MpIHtcbiAgICAgICAgICBpZiAoZW50aXR5Lm1hdGNoVGFnKHRhZy50YWcsIHRhZy52YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gZXhsdWRlc1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZW50aXR5Lm1hdGNoVGFnKCdCZWluZycsICdnaXptbycpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgY29uc3QgZXhjbHVkZVdpdGhUYWdzID0gKGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpID0+IHtcbiAgICAgIGlmIChJcy5leGlzdChvcHRpb24pICYmIElzLmV4aXN0KG9wdGlvbi5leGNsdWRlVGFncykpIHtcbiAgICAgICAgZm9yIChjb25zdCB0YWcgb2Ygb3B0aW9uLmV4Y2x1ZGVUYWdzKSB7XG4gICAgICAgICAgaWYgKGVudGl0eS5tYXRjaFRhZyh0YWcudGFnLCB0YWcudmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gW2VudGl0eV07XG4gICAgfTtcbiAgICBjb25zdCBjb2xsZWN0RGVzY2VuZGFudHMgPSAoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgcm9vdDogYm9vbGVhbik6IElTY2VuZUdyYXBoRW50aXR5W10gPT4ge1xuICAgICAgY29uc3Qgc2cgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICAgIGlmIChzZy5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGFycmF5OiBJU2NlbmVHcmFwaEVudGl0eVtdID0gcm9vdCA/IFtdIDogZXhjbHVkZVdpdGhUYWdzKGVudGl0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2cuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHNnLmNoaWxkcmVuW2ldO1xuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFycmF5LCBjb2xsZWN0RGVzY2VuZGFudHMoY2hpbGQuZW50aXR5LCBmYWxzZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByb290ID8gW10gOiBleGNsdWRlV2l0aFRhZ3MoZW50aXR5KTtcbiAgICB9O1xuICAgIGlmIChJcy5leGlzdChvcHRpb24pICYmIElzLmV4aXN0KG9wdGlvbi5lbnRpdGllcykgJiYgb3B0aW9uLmVudGl0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGNvbGxlY3RlZERlc2NlbmRhbnRzID0gb3B0aW9uLmVudGl0aWVzLmZsYXRNYXAoZW50aXR5ID0+IGNvbGxlY3REZXNjZW5kYW50cyhlbnRpdHksIHRydWUpKTtcblxuICAgICAgbGV0IHRvcExldmVsRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10gPSBbXTtcbiAgICAgIG9wdGlvbi5lbnRpdGllcy5mb3JFYWNoKGVudGl0eSA9PiB7XG4gICAgICAgIC8vIGlmIChjb2xsZWN0ZWREZXNjZW5kYW50cy5pbmRleE9mKGVudGl0eSkgPT09IC0xKSB7XG4gICAgICAgIGlmIChjb2xsZWN0ZWREZXNjZW5kYW50cy5pbmRleE9mKGVudGl0eSkgPT09IC0xICYmIGNoZWNrUGFzc09yTm90V2l0aFRhZ3MoZW50aXR5KSkge1xuICAgICAgICAgIHRvcExldmVsRW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGxldCBjb2xsZWN0ZWRFbnRpdGllcyA9IG9wdGlvbi5lbnRpdGllcy5jb25jYXQoKTtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGNvbGxlY3RlZEVudGl0aWVzLCBjb2xsZWN0ZWREZXNjZW5kYW50cyk7XG4gICAgICBjb2xsZWN0ZWRFbnRpdGllcyA9IFsuLi5uZXcgU2V0KGNvbGxlY3RlZEVudGl0aWVzKV07XG4gICAgICBpZiAodG9wTGV2ZWxFbnRpdGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdG9wTGV2ZWxFbnRpdGllcyA9IGNvbGxlY3RlZEVudGl0aWVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgY29sbGVjdGVkRW50aXRpZXMsIHRvcExldmVsRW50aXRpZXMgfTtcbiAgICB9XG4gICAgbGV0IGNvbGxlY3RlZEVudGl0aWVzID0gZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuX2dldEVudGl0aWVzKCkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eVtdO1xuICAgIGNvbGxlY3RlZEVudGl0aWVzID0gY29sbGVjdGVkRW50aXRpZXMuZmlsdGVyKGVudGl0eSA9PiBjaGVja1Bhc3NPck5vdFdpdGhUYWdzKGVudGl0eSkpO1xuICAgIGxldCB0b3BMZXZlbEVudGl0aWVzID0gU2NlbmVHcmFwaENvbXBvbmVudC5nZXRUb3BMZXZlbENvbXBvbmVudHMoKS5mbGF0TWFwKGMgPT4gYy5lbnRpdHkpO1xuICAgIHRvcExldmVsRW50aXRpZXMgPSB0b3BMZXZlbEVudGl0aWVzLmZpbHRlcihlbnRpdHkgPT4gY2hlY2tQYXNzT3JOb3RXaXRoVGFncyhlbnRpdHkpKTtcblxuICAgIGNvbGxlY3RlZEVudGl0aWVzID0gY29sbGVjdGVkRW50aXRpZXMuZmxhdE1hcChlbnRpdHkgPT4gY29sbGVjdERlc2NlbmRhbnRzKGVudGl0eSwgdHJ1ZSkpO1xuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGNvbGxlY3RlZEVudGl0aWVzLCB0b3BMZXZlbEVudGl0aWVzKTtcbiAgICBjb2xsZWN0ZWRFbnRpdGllcyA9IFsuLi5uZXcgU2V0KGNvbGxlY3RlZEVudGl0aWVzKV07XG5cbiAgICByZXR1cm4geyBjb2xsZWN0ZWRFbnRpdGllcywgdG9wTGV2ZWxFbnRpdGllcyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGJhc2Ugc3RydWN0dXJlIG9mIHRoZSBnbFRGMiBKU09OIGRvY3VtZW50LlxuICAgKlxuICAgKiBJbml0aWFsaXplcyB0aGUgZnVuZGFtZW50YWwgZ2xURjIgc3RydWN0dXJlIHdpdGggcmVxdWlyZWQgZmllbGRzIGxpa2UgYXNzZXQsXG4gICAqIGJ1ZmZlcnMsIGFuZCBlbXB0eSBhcnJheXMgZm9yIHZhcmlvdXMgZ2xURjIgY29tcG9uZW50cy4gU2V0cyB1cCB0aGUgbWV0YWRhdGFcbiAgICogYW5kIHByZXBhcmVzIHRoZSBkb2N1bWVudCBmb3IgY29udGVudCBwb3B1bGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsZW5hbWUgLSBUYXJnZXQgb3V0cHV0IGZpbGVuYW1lIGZvciBnZW5lcmF0aW5nIFVSSXNcbiAgICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGluaXRpYWxpemVkIEpTT04gc3RydWN0dXJlIGFuZCBwcm9jZXNzZWQgZmlsZW5hbWVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3JlYXRlSnNvbkJhc2UoZmlsZW5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZW5hbWUgPyBmaWxlbmFtZSA6IGBSaG9kb25pdGVfJHtEYXRlLm5vdygpfWA7XG4gICAgY29uc3QganNvbjogR2x0ZjJFeCA9IHtcbiAgICAgIGFzc2V0OiB7XG4gICAgICAgIHZlcnNpb246ICcyLjAnLFxuICAgICAgICBnZW5lcmF0b3I6IGBSaG9kb25pdGUgKCR7VkVSU0lPTi52ZXJzaW9ufSlgLFxuICAgICAgfSxcbiAgICAgIGJ1ZmZlcnM6IFt7IHVyaTogYCR7ZmlsZU5hbWV9LmJpbmAsIGJ5dGVMZW5ndGg6IDAgfV0sXG4gICAgICBidWZmZXJWaWV3czogW10sXG4gICAgICBhY2Nlc3NvcnM6IFtdLFxuICAgICAgYW5pbWF0aW9uczogW10sXG4gICAgICBtZXNoZXM6IFtdLFxuICAgICAgc2tpbnM6IFtdLFxuICAgICAgbWF0ZXJpYWxzOiBbXSxcbiAgICAgIHRleHR1cmVzOiBbXSxcbiAgICAgIGltYWdlczogW10sXG4gICAgICBleHRlbnNpb25zVXNlZDogW10sXG4gICAgICBleHRlbnNpb25zOiB7fSxcbiAgICAgIGV4dHJhczoge1xuICAgICAgICByblNraW5zOiBbXSxcbiAgICAgICAgYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5OiBbXSxcbiAgICAgICAgLy8gYnVmZmVyVmlld0J5dGVMZW5ndGhBY2N1bXVsYXRlZEFycmF5WzBdIGZvciBidWZmZXIgMFxuICAgICAgICAvLyBidWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXlbMV0gZm9yIGJ1ZmZlciAxXG4gICAgICAgIC8vIC4uLlxuICAgICAgfSxcbiAgICAgIGNhbWVyYXM6IFtdLFxuICAgICAgc2FtcGxlcnM6IFtdLFxuICAgIH07XG5cbiAgICByZXR1cm4geyBqc29uLCBmaWxlTmFtZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgZ2xURjIgQnVmZmVyVmlld3MgYW5kIEFjY2Vzc29ycyBmb3IgYWxsIGdlb21ldHJ5IGFuZCBhbmltYXRpb24gZGF0YS5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgcHJvY2Vzc2VzIG1lc2ggZ2VvbWV0cnksIGFuaW1hdGlvbiBkYXRhLCBhbmQgc2tlbGV0YWwgaW5mb3JtYXRpb25cbiAgICogdG8gY3JlYXRlIHRoZSBuZWNlc3NhcnkgYnVmZmVyIHZpZXdzIGFuZCBhY2Nlc3NvcnMgcmVxdWlyZWQgZm9yIGdsVEYyIGZvcm1hdC5cbiAgICogSXQgaGFuZGxlcyBkYXRhIGRlZHVwbGljYXRpb24gYW5kIHByb3BlciBtZW1vcnkgbGF5b3V0LlxuICAgKlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50IHRvIHBvcHVsYXRlXG4gICAqIEBwYXJhbSBlbnRpdGllcyAtIEFycmF5IG9mIGVudGl0aWVzIHRvIHByb2Nlc3MgZm9yIGJ1ZmZlciBjcmVhdGlvblxuICAgKi9cbiAgc3RhdGljIF9fY3JlYXRlQnVmZmVyVmlld3NBbmRBY2Nlc3NvcnMoanNvbjogR2x0ZjJFeCwgZW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pIHtcbiAgICBjb25zdCBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyczogQnVmZmVyW10gPSBbXTtcbiAgICBjb25zdCBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3M6IEJ1ZmZlclZpZXdbXSA9IFtdO1xuICAgIGNvbnN0IGV4aXN0aW5nVW5pcXVlUm5BY2Nlc3NvcnM6IEFjY2Vzc29yW10gPSBbXTtcblxuICAgIF9fY3JlYXRlQnVmZmVyVmlld3NBbmRBY2Nlc3NvcnNPZk1lc2goXG4gICAgICBqc29uLFxuICAgICAgZW50aXRpZXMgYXMgSU1lc2hFbnRpdHlbXSxcbiAgICAgIGV4aXN0aW5nVW5pcXVlUm5CdWZmZXJzLFxuICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlclZpZXdzLFxuICAgICAgZXhpc3RpbmdVbmlxdWVSbkFjY2Vzc29yc1xuICAgICk7XG5cbiAgICBfX2NyZWF0ZUJ1ZmZlclZpZXdzQW5kQWNjZXNzb3JzT2ZTa2luKFxuICAgICAganNvbixcbiAgICAgIGVudGl0aWVzIGFzIElTa2VsZXRhbEVudGl0eVtdLFxuICAgICAgZXhpc3RpbmdVbmlxdWVSbkJ1ZmZlcnMsXG4gICAgICBleGlzdGluZ1VuaXF1ZVJuQnVmZmVyVmlld3MsXG4gICAgICBleGlzdGluZ1VuaXF1ZVJuQWNjZXNzb3JzXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fY3JlYXRlQW5pbWF0aW9uRGF0YShqc29uOiBHbHRmMkV4LCBlbnRpdGllczogSUFuaW1hdGlvbkVudGl0eVtdKSB7XG4gICAgY29uc3QgYW5pbWF0aW9uT3B0aW9uczogQW5pbWF0aW9uRXhwb3J0T3B0aW9ucyA9IHtcbiAgICAgIHJlc29sdmVBbmltYXRpb25UYXJnZXQ6ICh7IGNoYW5uZWwsIHRyYWNrTmFtZSB9KSA9PiB0aGlzLl9fcmVzb2x2ZUFuaW1hdGlvblRhcmdldChqc29uLCBjaGFubmVsLCB0cmFja05hbWUpLFxuICAgIH07XG5cbiAgICBfX2NyZWF0ZUJ1ZmZlclZpZXdzQW5kQWNjZXNzb3JzT2ZBbmltYXRpb24oanNvbiwgZW50aXRpZXMsIGFuaW1hdGlvbk9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgZ2xURjIgbm9kZXMgcmVwcmVzZW50aW5nIHRoZSBzY2VuZSBncmFwaCBzdHJ1Y3R1cmUuXG4gICAqXG4gICAqIENvbnZlcnRzIFJob2Rvbml0ZSBlbnRpdGllcyBpbnRvIGdsVEYyIG5vZGVzLCBwcmVzZXJ2aW5nIGhpZXJhcmNoaWNhbCByZWxhdGlvbnNoaXBzLFxuICAgKiB0cmFuc2Zvcm1hdGlvbnMsIGFuZCBjb21wb25lbnQgYXNzb2NpYXRpb25zIChtZXNoZXMsIGNhbWVyYXMsIHNraW5zKS4gSGFuZGxlc1xuICAgKiBzcGVjaWFsIGNhc2VzIGxpa2UgYmlsbGJvYXJkIG5vZGVzIGFuZCBibGVuZCBzaGFwZSB3ZWlnaHRzLlxuICAgKlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50IHRvIHBvcHVsYXRlIHdpdGggbm9kZXNcbiAgICogQHBhcmFtIGVudGl0aWVzIC0gQWxsIGVudGl0aWVzIHRvIGNvbnZlcnQgdG8gbm9kZXNcbiAgICogQHBhcmFtIHRvcExldmVsRW50aXRpZXMgLSBSb290LWxldmVsIGVudGl0aWVzIGZvciB0aGUgc2NlbmVcbiAgICovXG4gIHN0YXRpYyBfX2NyZWF0ZU5vZGVzKGpzb246IEdsdGYyRXgsIGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLCB0b3BMZXZlbEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAganNvbi5ub2RlcyA9IFtdO1xuICAgIGpzb24uc2NlbmVzID0gW3sgbm9kZXM6IFtdIH1dO1xuICAgIGNvbnN0IHNjZW5lID0ganNvbi5zY2VuZXMhWzBdO1xuICAgIGNvbnN0IHNjZW5lTm9kZUluZGljZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICBjb25zdCBwYXJlbnROb2RlSW5kaWNlczogQXJyYXk8bnVtYmVyIHwgdW5kZWZpbmVkPiA9IG5ldyBBcnJheShlbnRpdGllcy5sZW5ndGgpO1xuICAgIGNvbnN0IHNraW5uZWRNZXNoTm9kZUluZGljZXM6IG51bWJlcltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbnRpdHkgPSBlbnRpdGllc1tpXTtcbiAgICAgIChlbnRpdHkgYXMgYW55KS5nbHRmTm9kZUluZGV4ID0gaTtcbiAgICB9XG5cbiAgICBsZXQgbWVzaENvdW50ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbnRpdHkgPSBlbnRpdGllc1tpXTtcbiAgICAgIC8vIG5vZGUgaWRzIG9mIHRoZSBvdXRwdXQgZ2xURjIgZGF0YSB3aWxsIGJlIHRoZSBpbmRpY2VzIG9mIGVudGl0aWVzIChzcGVjaWZpZWQgdGFyZ2V0IGVudGl0aWVzKVxuICAgICAganNvbi5ub2Rlc1tpXSA9IHt9O1xuICAgICAgY29uc3Qgbm9kZSA9IGpzb24ubm9kZXNbaV07XG5cbiAgICAgIC8vIG5vZGUubmFtZVxuICAgICAgbm9kZS5uYW1lID0gZW50aXR5LnVuaXF1ZU5hbWU7XG5cbiAgICAgIC8vIG5vZGUuY2hpbGRyZW5cbiAgICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gc2NlbmVHcmFwaENvbXBvbmVudC5jaGlsZHJlbjtcbiAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIG5vZGUuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5bal07XG4gICAgICAgICAgaWYgKElzLmV4aXN0KChjaGlsZC5lbnRpdHkgYXMgYW55KS5nbHRmTm9kZUluZGV4KSkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGROb2RlSWR4ID0gKGNoaWxkLmVudGl0eSBhcyBhbnkpLmdsdGZOb2RlSW5kZXg7XG4gICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGROb2RlSWR4KTtcbiAgICAgICAgICAgIHBhcmVudE5vZGVJbmRpY2VzW2NoaWxkTm9kZUlkeF0gPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBub2RlLmNoaWxkcmVuID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzY2VuZUdyYXBoQ29tcG9uZW50LmlzQmlsbGJvYXJkKSB7XG4gICAgICAgIG5vZGUuZXh0ZW5zaW9ucyA9IHtcbiAgICAgICAgICBSSE9ET05JVEVfYmlsbGJvYXJkOiB7XG4gICAgICAgICAgICBpc0JpbGxib2FyZDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChqc29uLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoJ1JIT0RPTklURV9iaWxsYm9hcmQnKSA9PT0gLTEpIHtcbiAgICAgICAgICBqc29uLmV4dGVuc2lvbnNVc2VkLnB1c2goJ1JIT0RPTklURV9iaWxsYm9hcmQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBsb2NhbFZpc2libGUgPSBlbnRpdHkuZ2V0VGFnVmFsdWUoVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlKTtcbiAgICAgIGlmIChlbnRpdHkuZ2V0VGFnVmFsdWUoVGFnS2hyTm9kZVZpc2liaWxpdHlFbmFibGVkKSA9PT0gdHJ1ZSAmJiB0eXBlb2YgbG9jYWxWaXNpYmxlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChub2RlLmV4dGVuc2lvbnMpKSB7XG4gICAgICAgICAgbm9kZS5leHRlbnNpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5leHRlbnNpb25zLktIUl9ub2RlX3Zpc2liaWxpdHkgPSB7XG4gICAgICAgICAgdmlzaWJsZTogbG9jYWxWaXNpYmxlLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCAnS0hSX25vZGVfdmlzaWJpbGl0eScpO1xuICAgICAgfVxuXG4gICAgICAvLyBtYXRyaXhcbiAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG4gICAgICAvLyBnbFRGIHJlcXVpcmVzIHVuaXQgcXVhdGVybmlvbnMsIHNvIG5vcm1hbGl6ZSBhbmQgY2xhbXAgdG8ga2VlcCB2YWx1ZXMgd2l0aGluIHRoZSBzcGVjIHJhbmdlXG4gICAgICBjb25zdCBub3JtYWxpemVkUXVhdGVybmlvbiA9IFF1YXRlcm5pb24ubm9ybWFsaXplKHRyYW5zZm9ybS5sb2NhbFJvdGF0aW9uSW5uZXIpO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZFJvdGF0aW9uQXJyYXkgPSBbXG4gICAgICAgIG5vcm1hbGl6ZWRRdWF0ZXJuaW9uLngsXG4gICAgICAgIG5vcm1hbGl6ZWRRdWF0ZXJuaW9uLnksXG4gICAgICAgIG5vcm1hbGl6ZWRRdWF0ZXJuaW9uLnosXG4gICAgICAgIG5vcm1hbGl6ZWRRdWF0ZXJuaW9uLncsXG4gICAgICBdO1xuICAgICAgbm9kZS5yb3RhdGlvbiA9IG5vcm1hbGl6ZWRSb3RhdGlvbkFycmF5Lm1hcChjb21wb25lbnQgPT4gTWF0aC5taW4oMSwgTWF0aC5tYXgoLTEsIGNvbXBvbmVudCkpKTtcbiAgICAgIG5vZGUuc2NhbGUgPSBbdHJhbnNmb3JtLmxvY2FsU2NhbGVJbm5lci54LCB0cmFuc2Zvcm0ubG9jYWxTY2FsZUlubmVyLnksIHRyYW5zZm9ybS5sb2NhbFNjYWxlSW5uZXIuel07XG4gICAgICBub2RlLnRyYW5zbGF0aW9uID0gW1xuICAgICAgICB0cmFuc2Zvcm0ubG9jYWxQb3NpdGlvbklubmVyLngsXG4gICAgICAgIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uSW5uZXIueSxcbiAgICAgICAgdHJhbnNmb3JtLmxvY2FsUG9zaXRpb25Jbm5lci56LFxuICAgICAgXTtcblxuICAgICAgLy8gbWVzaFxuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChJcy5leGlzdChtZXNoQ29tcG9uZW50KSAmJiBJcy5leGlzdChtZXNoQ29tcG9uZW50Lm1lc2gpKSB7XG4gICAgICAgIG5vZGUubWVzaCA9IG1lc2hDb3VudCsrO1xuICAgICAgfVxuXG4gICAgICAvLyBCbGVuZFNoYXBlXG4gICAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgICAgaWYgKElzLmV4aXN0KGJsZW5kU2hhcGVDb21wb25lbnQpKSB7XG4gICAgICAgIGNvbnN0IHdlaWdodHMgPSBibGVuZFNoYXBlQ29tcG9uZW50LndlaWdodHM7XG4gICAgICAgIGlmICh3ZWlnaHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBub2RlLndlaWdodHMgPSB3ZWlnaHRzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHNraW5cbiAgICAgIGNvbnN0IHNraW5Db21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgICAgaWYgKElzLmV4aXN0KHNraW5Db21wb25lbnQpKSB7XG4gICAgICAgIGNvbnN0IGVudGl0eUlkeCA9IGpzb24uZXh0cmFzLnJuU2tpbnMuaW5kZXhPZihza2luQ29tcG9uZW50LmVudGl0eSBhcyBhbnkpO1xuICAgICAgICBpZiAoZW50aXR5SWR4ID49IDApIHtcbiAgICAgICAgICBub2RlLnNraW4gPSBlbnRpdHlJZHg7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG5vZGUubWVzaCkpIHtcbiAgICAgICAgICAgIHNraW5uZWRNZXNoTm9kZUluZGljZXMucHVzaChpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY2FtZXJhXG4gICAgICBjb25zdCBjYW1lcmFDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRDYW1lcmEoKTtcbiAgICAgIGlmIChJcy5leGlzdChjYW1lcmFDb21wb25lbnQpKSB7XG4gICAgICAgIGxldCBnbFRGMkNhbWVyYTogR2x0ZjJDYW1lcmE7XG4gICAgICAgIGlmIChjYW1lcmFDb21wb25lbnQudHlwZSA9PT0gQ2FtZXJhVHlwZS5QZXJzcGVjdGl2ZSkge1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsQXNwZWN0ID0gY2FtZXJhQ29tcG9uZW50LmdldFRhZ1ZhbHVlKCdPcmlnaW5hbEFzcGVjdCcpO1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsRm92WSA9IGNhbWVyYUNvbXBvbmVudC5nZXRUYWdWYWx1ZSgnT3JpZ2luYWxGb3ZZJyk7XG4gICAgICAgICAgZ2xURjJDYW1lcmEgPSB7XG4gICAgICAgICAgICBuYW1lOiBjYW1lcmFDb21wb25lbnQuZW50aXR5LnVuaXF1ZU5hbWUsXG4gICAgICAgICAgICB0eXBlOiAncGVyc3BlY3RpdmUnLFxuICAgICAgICAgICAgcGVyc3BlY3RpdmU6IHtcbiAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IElzLmV4aXN0KG9yaWdpbmFsQXNwZWN0KSA/IG9yaWdpbmFsQXNwZWN0IDogY2FtZXJhQ29tcG9uZW50LmFzcGVjdCxcbiAgICAgICAgICAgICAgeWZvdjogSXMuZXhpc3Qob3JpZ2luYWxGb3ZZKVxuICAgICAgICAgICAgICAgID8gTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4ob3JpZ2luYWxGb3ZZKVxuICAgICAgICAgICAgICAgIDogTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oY2FtZXJhQ29tcG9uZW50LmZvdnkpLFxuICAgICAgICAgICAgICB6bmVhcjogY2FtZXJhQ29tcG9uZW50LnpOZWFyLFxuICAgICAgICAgICAgICB6ZmFyOiBjYW1lcmFDb21wb25lbnQuekZhcixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSBhcyBHbHRmMkNhbWVyYTtcbiAgICAgICAgfSBlbHNlIGlmIChjYW1lcmFDb21wb25lbnQudHlwZSA9PT0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWMpIHtcbiAgICAgICAgICBjb25zdCBvcmlnaW5hbFhNYWcgPSBjYW1lcmFDb21wb25lbnQuZ2V0VGFnVmFsdWUoJ09yaWdpbmFsWE1hZycpO1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsWU1hZyA9IGNhbWVyYUNvbXBvbmVudC5nZXRUYWdWYWx1ZSgnT3JpZ2luYWxZTWFnJyk7XG4gICAgICAgICAgZ2xURjJDYW1lcmEgPSB7XG4gICAgICAgICAgICBuYW1lOiBjYW1lcmFDb21wb25lbnQuZW50aXR5LnVuaXF1ZU5hbWUsXG4gICAgICAgICAgICB0eXBlOiAnb3J0aG9ncmFwaGljJyxcbiAgICAgICAgICAgIG9ydGhvZ3JhcGhpYzoge1xuICAgICAgICAgICAgICB4bWFnOiBJcy5leGlzdChvcmlnaW5hbFhNYWcpID8gb3JpZ2luYWxYTWFnIDogY2FtZXJhQ29tcG9uZW50LnhNYWcsXG4gICAgICAgICAgICAgIHltYWc6IElzLmV4aXN0KG9yaWdpbmFsWU1hZykgPyBvcmlnaW5hbFlNYWcgOiBjYW1lcmFDb21wb25lbnQueU1hZyxcbiAgICAgICAgICAgICAgem5lYXI6IGNhbWVyYUNvbXBvbmVudC56TmVhcixcbiAgICAgICAgICAgICAgemZhcjogY2FtZXJhQ29tcG9uZW50LnpGYXIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0gYXMgR2x0ZjJDYW1lcmE7XG4gICAgICAgIH1cbiAgICAgICAganNvbi5jYW1lcmFzLnB1c2goZ2xURjJDYW1lcmEhKTtcbiAgICAgICAgbm9kZS5jYW1lcmEgPSBqc29uLmNhbWVyYXMubGVuZ3RoIC0gMTtcbiAgICAgICAgdGhpcy5fX2NhbWVyYUNvbXBvbmVudFRvQ2FtZXJhSW5kZXguc2V0KGNhbWVyYUNvbXBvbmVudCwgbm9kZS5jYW1lcmEpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2V4cG9ydExpZ2h0KGpzb24sIGVudGl0eSwgbm9kZSBhcyBHbHRmMk5vZGUpO1xuICAgICAgdGhpcy5fX2V4cG9ydFJheW1hcmNoaW5nKGpzb24sIGVudGl0eSwgbm9kZSBhcyBHbHRmMk5vZGUpO1xuICAgIH1cblxuICAgIC8vIEFjY29yZGluZyB0byBnbFRGIHNwZWNpZmljYXRpb24sIG5vZGVzIHdpdGggYm90aCBza2luIGFuZCBtZXNoIHNob3VsZCBiZSBwbGFjZWQgZGlyZWN0bHkgdW5kZXIgdGhlIHJvb3QuXG4gICAgLy8gUmVtb3ZlIHRoZW0gZnJvbSB0aGVpciBwYXJlbnQncyBjaGlsZHJlbiwgcHJlc2VydmUgdGhlaXIgd29ybGQtc3BhY2UgVFJTLCBhbmQgcmVsb2NhdGUgdGhlbSB0byB0aGUgcm9vdCBub2RlIHNldC5cbiAgICBmb3IgKGNvbnN0IG5vZGVJbmRleCBvZiBza2lubmVkTWVzaE5vZGVJbmRpY2VzKSB7XG4gICAgICBjb25zdCBub2RlID0ganNvbi5ub2Rlc1tub2RlSW5kZXhdO1xuICAgICAgY29uc3QgcGFyZW50SWR4ID0gcGFyZW50Tm9kZUluZGljZXNbbm9kZUluZGV4XTtcbiAgICAgIGlmIChJcy5leGlzdChwYXJlbnRJZHgpKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBqc29uLm5vZGVzW3BhcmVudElkeF07XG4gICAgICAgIGlmIChJcy5leGlzdChwYXJlbnROb2RlLmNoaWxkcmVuKSkge1xuICAgICAgICAgIHBhcmVudE5vZGUuY2hpbGRyZW4gPSBwYXJlbnROb2RlLmNoaWxkcmVuLmZpbHRlcihjaGlsZElkeCA9PiBjaGlsZElkeCAhPT0gbm9kZUluZGV4KTtcbiAgICAgICAgICBpZiAocGFyZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhcmVudE5vZGVJbmRpY2VzW25vZGVJbmRleF0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNraW5uZWRFbnRpdHkgPSBlbnRpdGllc1tub2RlSW5kZXhdO1xuICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBza2lubmVkRW50aXR5LmdldFNjZW5lR3JhcGgoKSEubWF0cml4SW5uZXI7XG4gICAgICBjb25zdCB3b3JsZFRyYW5zbGF0aW9uID0gd29ybGRNYXRyaXguZ2V0VHJhbnNsYXRlKCk7XG4gICAgICBjb25zdCB3b3JsZFNjYWxlID0gd29ybGRNYXRyaXguZ2V0U2NhbGUoKTtcbiAgICAgIGNvbnN0IHdvcmxkUXVhdGVybmlvbiA9IFF1YXRlcm5pb24ubm9ybWFsaXplKFF1YXRlcm5pb24uZnJvbU1hdHJpeCh3b3JsZE1hdHJpeCkpO1xuXG4gICAgICBub2RlLnRyYW5zbGF0aW9uID0gW3dvcmxkVHJhbnNsYXRpb24ueCwgd29ybGRUcmFuc2xhdGlvbi55LCB3b3JsZFRyYW5zbGF0aW9uLnpdO1xuICAgICAgbm9kZS5yb3RhdGlvbiA9IFtcbiAgICAgICAgTWF0aC5taW4oMSwgTWF0aC5tYXgoLTEsIHdvcmxkUXVhdGVybmlvbi54KSksXG4gICAgICAgIE1hdGgubWluKDEsIE1hdGgubWF4KC0xLCB3b3JsZFF1YXRlcm5pb24ueSkpLFxuICAgICAgICBNYXRoLm1pbigxLCBNYXRoLm1heCgtMSwgd29ybGRRdWF0ZXJuaW9uLnopKSxcbiAgICAgICAgTWF0aC5taW4oMSwgTWF0aC5tYXgoLTEsIHdvcmxkUXVhdGVybmlvbi53KSksXG4gICAgICBdO1xuICAgICAgbm9kZS5zY2FsZSA9IFt3b3JsZFNjYWxlLngsIHdvcmxkU2NhbGUueSwgd29ybGRTY2FsZS56XTtcblxuICAgICAgaWYgKCFzY2VuZU5vZGVJbmRpY2VzLmhhcyhub2RlSW5kZXgpKSB7XG4gICAgICAgIHNjZW5lLm5vZGVzIS5wdXNoKG5vZGVJbmRleCk7XG4gICAgICAgIHNjZW5lTm9kZUluZGljZXMuYWRkKG5vZGVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVudGl0eSBoYXMgbm8gcGFyZW50LCBpdCBtdXN0IGJlIGEgdG9wIGxldmVsIGVudGl0eSBpbiB0aGUgc2NlbmUgZ3JhcGguXG4gICAgdG9wTGV2ZWxFbnRpdGllcy5mb3JFYWNoKGVudGl0eSA9PiB7XG4gICAgICBjb25zdCBpZHggPSBlbnRpdGllcy5pbmRleE9mKGVudGl0eSk7XG4gICAgICBpZiAoaWR4ID49IDAgJiYgIXNjZW5lTm9kZUluZGljZXMuaGFzKGlkeCkpIHtcbiAgICAgICAgc2NlbmUubm9kZXMhLnB1c2goaWR4KTtcbiAgICAgICAgc2NlbmVOb2RlSW5kaWNlcy5hZGQoaWR4KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZXhwb3J0TGlnaHQoanNvbjogR2x0ZjJFeCwgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgbm9kZTogR2x0ZjJOb2RlKSB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRMaWdodD8uKCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChsaWdodENvbXBvbmVudCkgfHwgbGlnaHRDb21wb25lbnQuZW5hYmxlICE9PSB0cnVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGxpZ2h0VHlwZTogS0hSX2xpZ2h0c19wdW5jdHVhbF9MaWdodFsndHlwZSddIHwgdW5kZWZpbmVkO1xuICAgIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuUG9pbnQpIHtcbiAgICAgIGxpZ2h0VHlwZSA9ICdwb2ludCc7XG4gICAgfSBlbHNlIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuRGlyZWN0aW9uYWwpIHtcbiAgICAgIGxpZ2h0VHlwZSA9ICdkaXJlY3Rpb25hbCc7XG4gICAgfSBlbHNlIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuU3BvdCkge1xuICAgICAgbGlnaHRUeXBlID0gJ3Nwb3QnO1xuICAgIH1cblxuICAgIGlmIChJcy5ub3QuZXhpc3QobGlnaHRUeXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbG9yID0gbGlnaHRDb21wb25lbnQuY29sb3I7XG4gICAgY29uc3QgY29sb3JBcnJheTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdID0gW1xuICAgICAgTnVtYmVyLmlzRmluaXRlKGNvbG9yLngpID8gY29sb3IueCA6IDEsXG4gICAgICBOdW1iZXIuaXNGaW5pdGUoY29sb3IueSkgPyBjb2xvci55IDogMSxcbiAgICAgIE51bWJlci5pc0Zpbml0ZShjb2xvci56KSA/IGNvbG9yLnogOiAxLFxuICAgIF07XG5cbiAgICBjb25zdCBnbHRmTGlnaHQ6IEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQgPSB7XG4gICAgICB0eXBlOiBsaWdodFR5cGUsXG4gICAgICBjb2xvcjogY29sb3JBcnJheSxcbiAgICB9O1xuXG4gICAgaWYgKElzLmV4aXN0KGVudGl0eS51bmlxdWVOYW1lKSAmJiBlbnRpdHkudW5pcXVlTmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICBnbHRmTGlnaHQubmFtZSA9IGVudGl0eS51bmlxdWVOYW1lO1xuICAgIH1cblxuICAgIGNvbnN0IGludGVuc2l0eSA9IGxpZ2h0Q29tcG9uZW50LmludGVuc2l0eTtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGludGVuc2l0eSkpIHtcbiAgICAgIGdsdGZMaWdodC5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XG4gICAgfVxuXG4gICAgaWYgKGxpZ2h0VHlwZSAhPT0gJ2RpcmVjdGlvbmFsJykge1xuICAgICAgY29uc3QgcmFuZ2UgPSBsaWdodENvbXBvbmVudC5yYW5nZTtcbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocmFuZ2UpICYmIHJhbmdlID4gMCkge1xuICAgICAgICBnbHRmTGlnaHQucmFuZ2UgPSByYW5nZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGlnaHRUeXBlID09PSAnc3BvdCcpIHtcbiAgICAgIGNvbnN0IG91dGVyID0gTnVtYmVyLmlzRmluaXRlKGxpZ2h0Q29tcG9uZW50Lm91dGVyQ29uZUFuZ2xlKSA/IGxpZ2h0Q29tcG9uZW50Lm91dGVyQ29uZUFuZ2xlIDogTWF0aC5QSSAvIDQ7XG4gICAgICBjb25zdCBpbm5lciA9IE51bWJlci5pc0Zpbml0ZShsaWdodENvbXBvbmVudC5pbm5lckNvbmVBbmdsZSkgPyBsaWdodENvbXBvbmVudC5pbm5lckNvbmVBbmdsZSA6IDA7XG4gICAgICBjb25zdCBjbGFtcGVkT3V0ZXIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvdXRlciwgTWF0aC5QSSAvIDIpKTtcbiAgICAgIGNvbnN0IGNsYW1wZWRJbm5lciA9IE1hdGgubWF4KDAsIE1hdGgubWluKGlubmVyLCBjbGFtcGVkT3V0ZXIpKTtcbiAgICAgIGdsdGZMaWdodC5zcG90ID0ge1xuICAgICAgICBpbm5lckNvbmVBbmdsZTogY2xhbXBlZElubmVyLFxuICAgICAgICBvdXRlckNvbmVBbmdsZTogY2xhbXBlZE91dGVyLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBSaG9kb25pdGUtc3BlY2lmaWMgbGlnaHQgc3RhdGUgdGhhdCBnbFRGIGRvZXMgbm90IHJlcHJlc2VudC4gVGhlIGVkaXRvciB1c2VzIHRoaXMgdG9cbiAgICAvLyByZXN0b3JlIHNoYWRvdyBjYXN0aW5nIGFuZCB0aGUgc2hhZG93IGNhbWVyYSBvdmVycmlkZXMgYWZ0ZXIgbG9hZGluZyBhIHNhdmVkIHNjZW5lLlxuICAgIGNvbnN0IHJob2Rvbml0ZUV4dHJhczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBjYXN0U2hhZG93OiBsaWdodENvbXBvbmVudC5jYXN0U2hhZG93LFxuICAgICAgcG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lOiBsaWdodENvbXBvbmVudC5wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUsXG4gICAgfTtcbiAgICBpZiAoIWxpZ2h0Q29tcG9uZW50LmlzU2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKSB7XG4gICAgICByaG9kb25pdGVFeHRyYXMuc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSBsaWdodENvbXBvbmVudC5zaGFkb3daTmVhckZvclNwb3RMaWdodDtcbiAgICB9XG4gICAgZ2x0ZkxpZ2h0LmV4dHJhcyA9IHtcbiAgICAgIC4uLihnbHRmTGlnaHQuZXh0cmFzID8/IHt9KSxcbiAgICAgIHJob2Rvbml0ZTogcmhvZG9uaXRlRXh0cmFzLFxuICAgIH07XG5cbiAgICBjb25zdCBsaWdodHNFeHRlbnNpb24gPSB0aGlzLl9fZW5zdXJlTGlnaHRzRXh0ZW5zaW9uKGpzb24pO1xuICAgIGNvbnN0IGxpZ2h0SW5kZXggPSBsaWdodHNFeHRlbnNpb24ubGlnaHRzLmxlbmd0aDtcbiAgICBsaWdodHNFeHRlbnNpb24ubGlnaHRzLnB1c2goZ2x0ZkxpZ2h0KTtcblxuICAgIHRoaXMuX19saWdodENvbXBvbmVudFRvTGlnaHRJbmRleC5zZXQobGlnaHRDb21wb25lbnQsIGxpZ2h0SW5kZXgpO1xuXG4gICAgdGhpcy5fX2Vuc3VyZUV4dGVuc2lvblVzZWQoanNvbiwgJ0tIUl9saWdodHNfcHVuY3R1YWwnKTtcblxuICAgIGlmIChJcy5ub3QuZXhpc3Qobm9kZS5leHRlbnNpb25zKSkge1xuICAgICAgbm9kZS5leHRlbnNpb25zID0ge307XG4gICAgfVxuICAgIG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsID0ge1xuICAgICAgbGlnaHQ6IGxpZ2h0SW5kZXgsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZW5zdXJlTGlnaHRzRXh0ZW5zaW9uKGpzb246IEdsdGYyRXgpOiBLSFJfbGlnaHRzX3B1bmN0dWFsIHtcbiAgICBpZiAoSXMubm90LmV4aXN0KGpzb24uZXh0ZW5zaW9ucykpIHtcbiAgICAgIGpzb24uZXh0ZW5zaW9ucyA9IHt9O1xuICAgIH1cbiAgICBjb25zdCByb290RXh0ZW5zaW9ucyA9IGpzb24uZXh0ZW5zaW9ucyBhcyB7XG4gICAgICBLSFJfbGlnaHRzX3B1bmN0dWFsPzogS0hSX2xpZ2h0c19wdW5jdHVhbDtcbiAgICAgIFtrZXk6IHN0cmluZ106IHVua25vd247XG4gICAgfTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHJvb3RFeHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwpKSB7XG4gICAgICByb290RXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsID0ge1xuICAgICAgICBsaWdodHM6IFtdLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHJvb3RFeHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwhO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgdGhlIGdyYXBoIG9mIGEgUmF5bWFyY2hpbmdDb21wb25lbnQgYXMgYSBSaG9kb25pdGUgbm9kZSBleHRlbnNpb24uXG4gICAqIFRoZSByYXltYXJjaGluZyBtYXRlcmlhbCBpcyBzaGFyZWQgYnkgZXZlcnkgY29tcG9uZW50IGFuZCBpcyByZWJ1aWx0IGJ5IHRoZVxuICAgKiBlZGl0b3IgZnJvbSB0aGUgZ3JhcGhzLCBzbyBvbmx5IHRoZSBwZXItY29tcG9uZW50IGdyYXBoIGlzIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBvdXRwdXQgZ2xURiBKU09OXG4gICAqIEBwYXJhbSBlbnRpdHkgLSBUaGUgZW50aXR5IHRvIGV4cG9ydFxuICAgKiBAcGFyYW0gbm9kZSAtIFRoZSBnbFRGIG5vZGUgb2YgdGhlIGVudGl0eVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19leHBvcnRSYXltYXJjaGluZyhqc29uOiBHbHRmMkV4LCBlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LCBub2RlOiBHbHRmMk5vZGUpIHtcbiAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldFJheW1hcmNoaW5nPy4oKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHJheW1hcmNoaW5nQ29tcG9uZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoSXMubm90LmV4aXN0KG5vZGUuZXh0ZW5zaW9ucykpIHtcbiAgICAgIG5vZGUuZXh0ZW5zaW9ucyA9IHt9O1xuICAgIH1cbiAgICBub2RlLmV4dGVuc2lvbnMuUkhPRE9OSVRFX3JheW1hcmNoaW5nID0ge1xuICAgICAgZ3JhcGg6IHJheW1hcmNoaW5nQ29tcG9uZW50LnJybkpzb24gPz8gbnVsbCxcbiAgICAgIHNkZlNoYXBlVHlwZTogcmF5bWFyY2hpbmdDb21wb25lbnQuc2RmU2hhcGVUeXBlLmluZGV4LFxuICAgICAgaXNQaWNrYWJsZTogcmF5bWFyY2hpbmdDb21wb25lbnQuaXNQaWNrYWJsZSxcbiAgICAgIGNhc3RTaGFkb3c6IHJheW1hcmNoaW5nQ29tcG9uZW50LmNhc3RTaGFkb3csXG4gICAgfTtcbiAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCAnUkhPRE9OSVRFX3JheW1hcmNoaW5nJyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2Vuc3VyZUV4dGVuc2lvblVzZWQoanNvbjogR2x0ZjJFeCwgZXh0ZW5zaW9uTmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKGpzb24uZXh0ZW5zaW9uc1VzZWQuaW5kZXhPZihleHRlbnNpb25OYW1lKSA9PT0gLTEpIHtcbiAgICAgIGpzb24uZXh0ZW5zaW9uc1VzZWQucHVzaChleHRlbnNpb25OYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3JlZ2lzdGVyTWF0ZXJpYWxJbmRleChybk1hdGVyaWFsOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCwgbWF0ZXJpYWxJbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdChybk1hdGVyaWFsKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgaW5kaWNlcyA9IHRoaXMuX19tYXRlcmlhbFRvR2x0Zk1hdGVyaWFsSW5kaWNlcy5nZXQocm5NYXRlcmlhbCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChpbmRpY2VzKSkge1xuICAgICAgaW5kaWNlcyA9IFtdO1xuICAgICAgdGhpcy5fX21hdGVyaWFsVG9HbHRmTWF0ZXJpYWxJbmRpY2VzLnNldChybk1hdGVyaWFsLCBpbmRpY2VzKTtcbiAgICB9XG4gICAgaW5kaWNlcy5wdXNoKG1hdGVyaWFsSW5kZXgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19zaG91bGRFbWl0UG9pbnRlclRhcmdldCh0cmFja05hbWU6IHN0cmluZywgcG9pbnRlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgbGV0IGV4cG9ydGVkUG9pbnRlcnMgPSB0aGlzLl9fZXhwb3J0ZWRQb2ludGVyVGFyZ2V0c0J5VHJhY2suZ2V0KHRyYWNrTmFtZSk7XG4gICAgaWYgKElzLm5vdC5leGlzdChleHBvcnRlZFBvaW50ZXJzKSkge1xuICAgICAgZXhwb3J0ZWRQb2ludGVycyA9IG5ldyBTZXQoKTtcbiAgICAgIHRoaXMuX19leHBvcnRlZFBvaW50ZXJUYXJnZXRzQnlUcmFjay5zZXQodHJhY2tOYW1lLCBleHBvcnRlZFBvaW50ZXJzKTtcbiAgICB9XG4gICAgaWYgKGV4cG9ydGVkUG9pbnRlcnMuaGFzKHBvaW50ZXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGV4cG9ydGVkUG9pbnRlcnMuYWRkKHBvaW50ZXIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZXNvbHZlQW5pbWF0aW9uVGFyZ2V0KFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICB0cmFja05hbWU6IHN0cmluZ1xuICApOiBBbmltYXRpb25DaGFubmVsVGFyZ2V0T3ZlcnJpZGUgfCBudWxsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBwYXRoTmFtZSA9IGNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lIGFzIEFuaW1hdGlvblBhdGhOYW1lO1xuICAgIGlmICh0eXBlb2YgcGF0aE5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChpc1J1bnRpbWVPbmx5QW5pbWF0aW9uUGF0aChwYXRoTmFtZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChwYXRoTmFtZS5zdGFydHNXaXRoKCdtYXRlcmlhbC8nKSkge1xuICAgICAgY29uc3Qgc2VtYW50aWMgPSBwYXRoTmFtZS5zdWJzdHJpbmcoJ21hdGVyaWFsLycubGVuZ3RoKTtcbiAgICAgIHJldHVybiB0aGlzLl9fcmVzb2x2ZU1hdGVyaWFsQW5pbWF0aW9uVGFyZ2V0KGpzb24sIGNoYW5uZWwsIHNlbWFudGljLCB0cmFja05hbWUpO1xuICAgIH1cblxuICAgIGlmIChwYXRoTmFtZS5zdGFydHNXaXRoKCdsaWdodF8nKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yZXNvbHZlTGlnaHRBbmltYXRpb25UYXJnZXQoanNvbiwgY2hhbm5lbCwgcGF0aE5hbWUsIHRyYWNrTmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKHBhdGhOYW1lLnN0YXJ0c1dpdGgoJ2NhbWVyYV8nKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yZXNvbHZlQ2FtZXJhQW5pbWF0aW9uVGFyZ2V0KGpzb24sIGNoYW5uZWwsIHBhdGhOYW1lLCB0cmFja05hbWUpO1xuICAgIH1cblxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ3Zpc2liaWxpdHknKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3Jlc29sdmVWaXNpYmlsaXR5QW5pbWF0aW9uVGFyZ2V0KGpzb24sIGNoYW5uZWwsIHRyYWNrTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb2x2ZVZpc2liaWxpdHlBbmltYXRpb25UYXJnZXQoXG4gICAganNvbjogR2x0ZjJFeCxcbiAgICBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsLFxuICAgIHRyYWNrTmFtZTogc3RyaW5nXG4gICk6IEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRPdmVycmlkZSB8IG51bGwge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IChjaGFubmVsLnRhcmdldC5lbnRpdHkgYXMgYW55KS5nbHRmTm9kZUluZGV4O1xuICAgIGlmIChJcy5ub3QuZXhpc3Qobm9kZUluZGV4KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9kZSA9IGpzb24ubm9kZXM/Lltub2RlSW5kZXhdO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qobm9kZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsb2NhbFZpc2libGUgPSBjaGFubmVsLnRhcmdldC5lbnRpdHkuZ2V0VGFnVmFsdWUoVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KG5vZGUuZXh0ZW5zaW9ucykpIHtcbiAgICAgIG5vZGUuZXh0ZW5zaW9ucyA9IHt9O1xuICAgIH1cbiAgICBub2RlLmV4dGVuc2lvbnMuS0hSX25vZGVfdmlzaWJpbGl0eSA9IHtcbiAgICAgIHZpc2libGU6IHR5cGVvZiBsb2NhbFZpc2libGUgPT09ICdib29sZWFuJyA/IGxvY2FsVmlzaWJsZSA6IGNoYW5uZWwudGFyZ2V0LmVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlLFxuICAgIH07XG5cbiAgICBjb25zdCBwb2ludGVyID0gYC9ub2Rlcy8ke25vZGVJbmRleH0vZXh0ZW5zaW9ucy9LSFJfbm9kZV92aXNpYmlsaXR5L3Zpc2libGVgO1xuICAgIGlmICghdGhpcy5fX3Nob3VsZEVtaXRQb2ludGVyVGFyZ2V0KHRyYWNrTmFtZSwgcG9pbnRlcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX19lbnN1cmVFeHRlbnNpb25Vc2VkKGpzb24sICdLSFJfYW5pbWF0aW9uX3BvaW50ZXInKTtcbiAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCAnS0hSX25vZGVfdmlzaWJpbGl0eScpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6ICdwb2ludGVyJyxcbiAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgS0hSX2FuaW1hdGlvbl9wb2ludGVyOiB7XG4gICAgICAgICAgcG9pbnRlcixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb2x2ZU1hdGVyaWFsQW5pbWF0aW9uVGFyZ2V0KFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBzZW1hbnRpYzogc3RyaW5nLFxuICAgIHRyYWNrTmFtZTogc3RyaW5nXG4gICk6IEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRPdmVycmlkZSB8IG51bGwge1xuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLl9fZmluZE1hdGVyaWFsSW5kaWNlc0ZvckFuaW1hdGVkVmFsdWUoc2VtYW50aWMsIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSk7XG4gICAgaWYgKGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9fbG9nVW5zdXBwb3J0ZWRNYXRlcmlhbFNlbWFudGljKHNlbWFudGljLCB0cnVlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHBvaW50ZXJTdWZmaXggPSB0aGlzLl9fZ2V0TWF0ZXJpYWxQb2ludGVyU3VmZml4KHNlbWFudGljKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHBvaW50ZXJTdWZmaXgpKSB7XG4gICAgICB0aGlzLl9fbG9nVW5zdXBwb3J0ZWRNYXRlcmlhbFNlbWFudGljKHNlbWFudGljLCBmYWxzZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCAnS0hSX2FuaW1hdGlvbl9wb2ludGVyJyk7XG5cbiAgICBjb25zdCB0YXJnZXRzOiBBbmltYXRpb25DaGFubmVsVGFyZ2V0UmVzb2x1dGlvbltdID0gW107XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbEluZGV4IG9mIGluZGljZXMpIHtcbiAgICAgIGNvbnN0IHBvaW50ZXIgPSBgL21hdGVyaWFscy8ke21hdGVyaWFsSW5kZXh9JHtwb2ludGVyU3VmZml4fWA7XG4gICAgICBpZiAoIXRoaXMuX19zaG91bGRFbWl0UG9pbnRlclRhcmdldCh0cmFja05hbWUsIHBvaW50ZXIpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGFyZ2V0cy5wdXNoKHtcbiAgICAgICAgcGF0aDogJ3BvaW50ZXInLFxuICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgS0hSX2FuaW1hdGlvbl9wb2ludGVyOiB7XG4gICAgICAgICAgICBwb2ludGVyLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0cy5sZW5ndGggPiAwID8gdGFyZ2V0cyA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2ZpbmRNYXRlcmlhbEluZGljZXNGb3JBbmltYXRlZFZhbHVlKHNlbWFudGljOiBzdHJpbmcsIGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlKSB7XG4gICAgY29uc3QgaW5kaWNlczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtybk1hdGVyaWFsLCBnbHRmSW5kaWNlc10gb2YgdGhpcy5fX21hdGVyaWFsVG9HbHRmTWF0ZXJpYWxJbmRpY2VzLmVudHJpZXMoKSkge1xuICAgICAgY29uc3QgcGFyYW1ldGVyID0gcm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIoc2VtYW50aWMpO1xuICAgICAgaWYgKHBhcmFtZXRlciA9PT0gYW5pbWF0ZWRWYWx1ZSkge1xuICAgICAgICBpbmRpY2VzLnB1c2goLi4uZ2x0ZkluZGljZXMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KGluZGljZXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb2x2ZUxpZ2h0QW5pbWF0aW9uVGFyZ2V0KFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBwYXRoTmFtZTogc3RyaW5nLFxuICAgIHRyYWNrTmFtZTogc3RyaW5nXG4gICk6IEFuaW1hdGlvbkNoYW5uZWxUYXJnZXRPdmVycmlkZSB8IG51bGwge1xuICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50ID0gY2hhbm5lbC50YXJnZXQuZW50aXR5LnRyeVRvR2V0TGlnaHQ/LigpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QobGlnaHRDb21wb25lbnQpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbGlnaHRJbmRleCA9IHRoaXMuX19saWdodENvbXBvbmVudFRvTGlnaHRJbmRleC5nZXQobGlnaHRDb21wb25lbnQgYXMgTGlnaHRDb21wb25lbnQpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QobGlnaHRJbmRleCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHN1ZmZpeCA9IExJR0hUX1BPSU5URVJfU1VGRklYX01BUFtwYXRoTmFtZV07XG4gICAgaWYgKElzLm5vdC5leGlzdChzdWZmaXgpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBwb2ludGVyID0gYC9leHRlbnNpb25zL0tIUl9saWdodHNfcHVuY3R1YWwvbGlnaHRzLyR7bGlnaHRJbmRleH0ke3N1ZmZpeH1gO1xuICAgIGlmICghdGhpcy5fX3Nob3VsZEVtaXRQb2ludGVyVGFyZ2V0KHRyYWNrTmFtZSwgcG9pbnRlcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX19lbnN1cmVFeHRlbnNpb25Vc2VkKGpzb24sICdLSFJfYW5pbWF0aW9uX3BvaW50ZXInKTtcblxuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiAncG9pbnRlcicsXG4gICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgIEtIUl9hbmltYXRpb25fcG9pbnRlcjoge1xuICAgICAgICAgIHBvaW50ZXIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Jlc29sdmVDYW1lcmFBbmltYXRpb25UYXJnZXQoXG4gICAganNvbjogR2x0ZjJFeCxcbiAgICBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsLFxuICAgIHBhdGhOYW1lOiBzdHJpbmcsXG4gICAgdHJhY2tOYW1lOiBzdHJpbmdcbiAgKTogQW5pbWF0aW9uQ2hhbm5lbFRhcmdldE92ZXJyaWRlIHwgbnVsbCB7XG4gICAgY29uc3QgY2FtZXJhQ29tcG9uZW50ID0gY2hhbm5lbC50YXJnZXQuZW50aXR5LnRyeVRvR2V0Q2FtZXJhPy4oKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNhbWVyYUNvbXBvbmVudCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjYW1lcmFJbmRleCA9IHRoaXMuX19jYW1lcmFDb21wb25lbnRUb0NhbWVyYUluZGV4LmdldChjYW1lcmFDb21wb25lbnQgYXMgQ2FtZXJhQ29tcG9uZW50KTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNhbWVyYUluZGV4KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc3VmZml4ID0gdGhpcy5fX2dldENhbWVyYVBvaW50ZXJTdWZmaXgocGF0aE5hbWUsIGNhbWVyYUNvbXBvbmVudCBhcyBDYW1lcmFDb21wb25lbnQpO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qoc3VmZml4KSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcG9pbnRlciA9IGAvY2FtZXJhcy8ke2NhbWVyYUluZGV4fSR7c3VmZml4fWA7XG4gICAgaWYgKCF0aGlzLl9fc2hvdWxkRW1pdFBvaW50ZXJUYXJnZXQodHJhY2tOYW1lLCBwb2ludGVyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fX2Vuc3VyZUV4dGVuc2lvblVzZWQoanNvbiwgJ0tIUl9hbmltYXRpb25fcG9pbnRlcicpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6ICdwb2ludGVyJyxcbiAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgS0hSX2FuaW1hdGlvbl9wb2ludGVyOiB7XG4gICAgICAgICAgcG9pbnRlcixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0TWF0ZXJpYWxQb2ludGVyU3VmZml4KHNlbWFudGljOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGRpcmVjdCA9IE1BVEVSSUFMX1BPSU5URVJfU1VGRklYX01BUFtzZW1hbnRpY107XG4gICAgaWYgKElzLmV4aXN0KGRpcmVjdCkpIHtcbiAgICAgIHJldHVybiBkaXJlY3Q7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmb3JtTWF0Y2ggPSBzZW1hbnRpYy5tYXRjaCgvXiguKilUcmFuc2Zvcm0oT2Zmc2V0fFNjYWxlfFJvdGF0aW9uKSQvKTtcbiAgICBpZiAodHJhbnNmb3JtTWF0Y2gpIHtcbiAgICAgIGNvbnN0IHRleHR1cmVOYW1lID0gdHJhbnNmb3JtTWF0Y2hbMV07XG4gICAgICBjb25zdCB0cmFuc2Zvcm1UeXBlID0gdHJhbnNmb3JtTWF0Y2hbMl07XG4gICAgICBjb25zdCB0ZXh0dXJlUGF0aCA9IE1BVEVSSUFMX1RFWFRVUkVfUEFUSFNbdGV4dHVyZU5hbWVdO1xuICAgICAgaWYgKElzLm5vdC5leGlzdCh0ZXh0dXJlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByb3BlcnR5ID0gdHJhbnNmb3JtVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgcmV0dXJuIGAke3RleHR1cmVQYXRofS9leHRlbnNpb25zL0tIUl90ZXh0dXJlX3RyYW5zZm9ybS8ke3Byb3BlcnR5fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbG9nVW5zdXBwb3J0ZWRNYXRlcmlhbFNlbWFudGljKHNlbWFudGljOiBzdHJpbmcsIG1pc3NpbmdNYXRlcmlhbDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLl9fd2FybmVkTWF0ZXJpYWxTZW1hbnRpY3MuaGFzKHNlbWFudGljKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fd2FybmVkTWF0ZXJpYWxTZW1hbnRpY3MuYWRkKHNlbWFudGljKTtcbiAgICBpZiAobWlzc2luZ01hdGVyaWFsKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKGBLSFJfYW5pbWF0aW9uX3BvaW50ZXI6IE5vIG1hdGVyaWFsIHBhcmFtZXRlciBmb3VuZCBmb3Igc2VtYW50aWMgXCIke3NlbWFudGljfVwiLmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKGBLSFJfYW5pbWF0aW9uX3BvaW50ZXI6IFVuc3VwcG9ydGVkIG1hdGVyaWFsIHNlbWFudGljIFwiJHtzZW1hbnRpY31cIi4gQW5pbWF0aW9uIHNraXBwZWQuYCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRDYW1lcmFQb2ludGVyU3VmZml4KHBhdGhOYW1lOiBzdHJpbmcsIGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB0eXBlID0gY2FtZXJhQ29tcG9uZW50LnR5cGU7XG4gICAgc3dpdGNoIChwYXRoTmFtZSkge1xuICAgICAgY2FzZSAnY2FtZXJhX3puZWFyJzpcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUgPyAnL3BlcnNwZWN0aXZlL3puZWFyJyA6ICcvb3J0aG9ncmFwaGljL3puZWFyJztcbiAgICAgIGNhc2UgJ2NhbWVyYV96ZmFyJzpcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUgPyAnL3BlcnNwZWN0aXZlL3pmYXInIDogJy9vcnRob2dyYXBoaWMvemZhcic7XG4gICAgICBjYXNlICdjYW1lcmFfZm92eSc6XG4gICAgICAgIHJldHVybiB0eXBlID09PSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlID8gJy9wZXJzcGVjdGl2ZS95Zm92JyA6IHVuZGVmaW5lZDtcbiAgICAgIGNhc2UgJ2NhbWVyYV94bWFnJzpcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljID8gJy9vcnRob2dyYXBoaWMveG1hZycgOiB1bmRlZmluZWQ7XG4gICAgICBjYXNlICdjYW1lcmFfeW1hZyc6XG4gICAgICAgIHJldHVybiB0eXBlID09PSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYyA/ICcvb3J0aG9ncmFwaGljL3ltYWcnIDogdW5kZWZpbmVkO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBnbFRGMiBtYXRlcmlhbHMgYW5kIHRleHR1cmVzIGZyb20gUmhvZG9uaXRlIG1hdGVyaWFscy5cbiAgICpcbiAgICogUHJvY2Vzc2VzIGFsbCBtYXRlcmlhbHMgdXNlZCBieSBtZXNoIGVudGl0aWVzLCBjb252ZXJ0aW5nIFJob2Rvbml0ZSBtYXRlcmlhbFxuICAgKiBwcm9wZXJ0aWVzIHRvIGdsVEYyIFBCUiBmb3JtYXQuIEhhbmRsZXMgdGV4dHVyZSBleHRyYWN0aW9uLCBvcHRpbWl6YXRpb24sXG4gICAqIGFuZCBwcm9wZXIgZm9ybWF0IGNvbnZlcnNpb24gaW5jbHVkaW5nIHN1cHBvcnQgZm9yIHZhcmlvdXMgbWF0ZXJpYWwgZXh0ZW5zaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudCB0byBwb3B1bGF0ZSB3aXRoIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gZW50aXRpZXMgLSBNZXNoIGVudGl0aWVzIGNvbnRhaW5pbmcgbWF0ZXJpYWxzIHRvIGNvbnZlcnRcbiAgICogQHBhcmFtIG9wdGlvbiAtIEV4cG9ydCBvcHRpb25zIGFmZmVjdGluZyBtYXRlcmlhbCBwcm9jZXNzaW5nXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCBtYXRlcmlhbHMgYW5kIHRleHR1cmVzIGFyZSBwcm9jZXNzZWRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBfX2NyZWF0ZU1hdGVyaWFscyhqc29uOiBHbHRmMkV4LCBlbnRpdGllczogSU1lc2hFbnRpdHlbXSwgb3B0aW9uOiBHbHRmMkV4cG9ydGVyQXJndW1lbnRzKSB7XG4gICAgbGV0IGNvdW50TWVzaCA9IDA7XG4gICAgY29uc3QgcHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG4gICAgY29uc3QgdmFyaWFudE5hbWVUb0luZGV4ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgICBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkucHVzaCgwKTtcbiAgICBjb25zdCBidWZmZXJJZHggPSBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkubGVuZ3RoIC0gMTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChtZXNoQ29tcG9uZW50Py5tZXNoKSB7XG4gICAgICAgIGNvbnN0IGdsdGYyTWVzaCA9IGpzb24ubWVzaGVzIVtjb3VudE1lc2grK107XG4gICAgICAgIGF3YWl0IHRoaXMuX19wcm9jZXNzTWVzaFByaW1pdGl2ZXMoXG4gICAgICAgICAganNvbixcbiAgICAgICAgICBtZXNoQ29tcG9uZW50Lm1lc2gsXG4gICAgICAgICAgZ2x0ZjJNZXNoLFxuICAgICAgICAgIHByb21pc2VzLFxuICAgICAgICAgIGJ1ZmZlcklkeCxcbiAgICAgICAgICBvcHRpb24sXG4gICAgICAgICAgdmFyaWFudE5hbWVUb0luZGV4XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fcHJvY2Vzc01lc2hQcmltaXRpdmVzKFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgbWVzaDogTWVzaCxcbiAgICBnbHRmMk1lc2g6IEdsdGYyTWVzaCxcbiAgICBwcm9taXNlczogUHJvbWlzZTxhbnk+W10sXG4gICAgYnVmZmVySWR4OiBudW1iZXIsXG4gICAgb3B0aW9uOiBHbHRmMkV4cG9ydGVyQXJndW1lbnRzLFxuICAgIHZhcmlhbnROYW1lVG9JbmRleDogTWFwPHN0cmluZywgbnVtYmVyPlxuICApIHtcbiAgICBjb25zdCBwcmltaXRpdmVDb3VudCA9IG1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmltaXRpdmVDb3VudDsgaisrKSB7XG4gICAgICBjb25zdCByblByaW1pdGl2ZSA9IG1lc2guZ2V0UHJpbWl0aXZlQXQoaik7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBnbHRmMk1lc2gucHJpbWl0aXZlc1tqXTtcbiAgICAgIGNvbnN0IHJuTWF0ZXJpYWwgPSByblByaW1pdGl2ZS5tYXRlcmlhbCE7XG5cbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gYXdhaXQgdGhpcy5fX2NyZWF0ZU1hdGVyaWFsRnJvbVJob2Rvbml0ZShqc29uLCBybk1hdGVyaWFsLCBwcm9taXNlcywgYnVmZmVySWR4LCBvcHRpb24pO1xuICAgICAgY29uc3QgbWF0ZXJpYWxJbmRleCA9IGpzb24ubWF0ZXJpYWxzLmxlbmd0aDtcbiAgICAgIGpzb24ubWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsID0gbWF0ZXJpYWxJbmRleDtcbiAgICAgIHRoaXMuX19yZWdpc3Rlck1hdGVyaWFsSW5kZXgocm5NYXRlcmlhbCwgbWF0ZXJpYWxJbmRleCk7XG4gICAgICBfX3BydW5lVW51c2VkVmVydGV4QXR0cmlidXRlcyhwcmltaXRpdmUsIG1hdGVyaWFsKTtcblxuICAgICAgYXdhaXQgdGhpcy5fX2V4cG9ydE1hdGVyaWFsVmFyaWFudHMoXG4gICAgICAgIGpzb24sXG4gICAgICAgIHJuUHJpbWl0aXZlLFxuICAgICAgICBwcmltaXRpdmUsXG4gICAgICAgIHByb21pc2VzLFxuICAgICAgICBidWZmZXJJZHgsXG4gICAgICAgIG9wdGlvbixcbiAgICAgICAgdmFyaWFudE5hbWVUb0luZGV4LFxuICAgICAgICBtYXRlcmlhbEluZGV4XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fZXhwb3J0TWF0ZXJpYWxWYXJpYW50cyhcbiAgICBqc29uOiBHbHRmMkV4LFxuICAgIHJuUHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgcHJpbWl0aXZlOiBHbHRmMk1lc2hbJ3ByaW1pdGl2ZXMnXVtudW1iZXJdLFxuICAgIHByb21pc2VzOiBQcm9taXNlPGFueT5bXSxcbiAgICBidWZmZXJJZHg6IG51bWJlcixcbiAgICBvcHRpb246IEdsdGYyRXhwb3J0ZXJBcmd1bWVudHMsXG4gICAgdmFyaWFudE5hbWVUb0luZGV4OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgIGJhc2VNYXRlcmlhbEluZGV4OiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgdmFyaWFudE5hbWVzID0gcm5QcmltaXRpdmUuZ2V0VmFyaWFudE5hbWVzKCk7XG4gICAgaWYgKHZhcmlhbnROYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBwaW5nczogS0hSX21hdGVyaWFsc192YXJpYW50c19QcmltaXRpdmVFeHRlbnNpb25bJ21hcHBpbmdzJ10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdmFyaWFudE5hbWUgb2YgdmFyaWFudE5hbWVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KHZhcmlhbnROYW1lKSB8fCB2YXJpYW50TmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCB2YXJpYW50TWF0ZXJpYWwgPSByblByaW1pdGl2ZS5nZXRWYXJpYW50TWF0ZXJpYWwodmFyaWFudE5hbWUpO1xuICAgICAgaWYgKHZhcmlhbnRNYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBsZXQgbWF0ZXJpYWxJbmRleCA9IGJhc2VNYXRlcmlhbEluZGV4O1xuICAgICAgaWYgKHZhcmlhbnRNYXRlcmlhbCAhPT0gcm5QcmltaXRpdmUubWF0ZXJpYWwpIHtcbiAgICAgICAgY29uc3QgZ2x0ZlZhcmlhbnRNYXRlcmlhbCA9IGF3YWl0IHRoaXMuX19jcmVhdGVNYXRlcmlhbEZyb21SaG9kb25pdGUoXG4gICAgICAgICAganNvbixcbiAgICAgICAgICB2YXJpYW50TWF0ZXJpYWwsXG4gICAgICAgICAgcHJvbWlzZXMsXG4gICAgICAgICAgYnVmZmVySWR4LFxuICAgICAgICAgIG9wdGlvblxuICAgICAgICApO1xuICAgICAgICBtYXRlcmlhbEluZGV4ID0ganNvbi5tYXRlcmlhbHMubGVuZ3RoO1xuICAgICAgICBqc29uLm1hdGVyaWFscy5wdXNoKGdsdGZWYXJpYW50TWF0ZXJpYWwpO1xuICAgICAgICB0aGlzLl9fcmVnaXN0ZXJNYXRlcmlhbEluZGV4KHZhcmlhbnRNYXRlcmlhbCwgbWF0ZXJpYWxJbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhcmlhbnRJbmRleCA9IHRoaXMuX19lbnN1cmVWYXJpYW50SW5kZXgoanNvbiwgdmFyaWFudE5hbWUsIHZhcmlhbnROYW1lVG9JbmRleCk7XG4gICAgICBtYXBwaW5ncy5wdXNoKHtcbiAgICAgICAgbWF0ZXJpYWw6IG1hdGVyaWFsSW5kZXgsXG4gICAgICAgIHZhcmlhbnRzOiBbdmFyaWFudEluZGV4XSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChtYXBwaW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwcmltaXRpdmUuZXh0ZW5zaW9ucyA9IHByaW1pdGl2ZS5leHRlbnNpb25zID8/IHt9O1xuICAgIGNvbnN0IHByaW1pdGl2ZUV4dGVuc2lvbnMgPSBwcmltaXRpdmUuZXh0ZW5zaW9ucyBhcyB7XG4gICAgICBLSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzPzogS0hSX21hdGVyaWFsc192YXJpYW50c19QcmltaXRpdmVFeHRlbnNpb247XG4gICAgICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xuICAgIH07XG5cbiAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlRXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzKSkge1xuICAgICAgcHJpbWl0aXZlRXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzIS5tYXBwaW5ncy5wdXNoKC4uLm1hcHBpbmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJpbWl0aXZlRXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzID0ge1xuICAgICAgICBtYXBwaW5ncyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fX2Vuc3VyZUV4dGVuc2lvblVzZWQoanNvbiwgJ0tIUl9tYXRlcmlhbHNfdmFyaWFudHMnKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZW5zdXJlVmFyaWFudEluZGV4KGpzb246IEdsdGYyRXgsIHZhcmlhbnROYW1lOiBzdHJpbmcsIHZhcmlhbnROYW1lVG9JbmRleDogTWFwPHN0cmluZywgbnVtYmVyPikge1xuICAgIGxldCB2YXJpYW50SW5kZXggPSB2YXJpYW50TmFtZVRvSW5kZXguZ2V0KHZhcmlhbnROYW1lKTtcbiAgICBpZiAodmFyaWFudEluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB2YXJpYW50SW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0ZXJpYWxWYXJpYW50c0V4dGVuc2lvbiA9IHRoaXMuX19lbnN1cmVNYXRlcmlhbFZhcmlhbnRzRXh0ZW5zaW9uKGpzb24pO1xuICAgIHZhcmlhbnRJbmRleCA9IG1hdGVyaWFsVmFyaWFudHNFeHRlbnNpb24udmFyaWFudHMubGVuZ3RoO1xuICAgIG1hdGVyaWFsVmFyaWFudHNFeHRlbnNpb24udmFyaWFudHMucHVzaCh7XG4gICAgICBuYW1lOiB2YXJpYW50TmFtZSxcbiAgICB9KTtcbiAgICB2YXJpYW50TmFtZVRvSW5kZXguc2V0KHZhcmlhbnROYW1lLCB2YXJpYW50SW5kZXgpO1xuICAgIHJldHVybiB2YXJpYW50SW5kZXg7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2Vuc3VyZU1hdGVyaWFsVmFyaWFudHNFeHRlbnNpb24oanNvbjogR2x0ZjJFeCk6IEtIUl9tYXRlcmlhbHNfdmFyaWFudHMge1xuICAgIGlmIChJcy5ub3QuZXhpc3QoanNvbi5leHRlbnNpb25zKSkge1xuICAgICAganNvbi5leHRlbnNpb25zID0ge307XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdEV4dGVuc2lvbnMgPSBqc29uLmV4dGVuc2lvbnMgYXMge1xuICAgICAgS0hSX21hdGVyaWFsc192YXJpYW50cz86IEtIUl9tYXRlcmlhbHNfdmFyaWFudHM7XG4gICAgICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xuICAgIH07XG5cbiAgICBpZiAoSXMubm90LmV4aXN0KHJvb3RFeHRlbnNpb25zLktIUl9tYXRlcmlhbHNfdmFyaWFudHMpKSB7XG4gICAgICByb290RXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzID0ge1xuICAgICAgICB2YXJpYW50czogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiByb290RXh0ZW5zaW9ucy5LSFJfbWF0ZXJpYWxzX3ZhcmlhbnRzO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19jcmVhdGVNYXRlcmlhbEZyb21SaG9kb25pdGUoXG4gICAganNvbjogR2x0ZjJFeCxcbiAgICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcm9taXNlczogUHJvbWlzZTxhbnk+W10sXG4gICAgYnVmZmVySWR4OiBudW1iZXIsXG4gICAgb3B0aW9uOiBHbHRmMkV4cG9ydGVyQXJndW1lbnRzXG4gICk6IFByb21pc2U8R2x0ZjJNYXRlcmlhbEV4PiB7XG4gICAgY29uc3QgbWF0ZXJpYWw6IEdsdGYyTWF0ZXJpYWxFeCA9IHtcbiAgICAgIHBick1ldGFsbGljUm91Z2huZXNzOiB7XG4gICAgICAgIG1ldGFsbGljRmFjdG9yOiAxLjAsXG4gICAgICAgIHJvdWdobmVzc0ZhY3RvcjogMS4wLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaWYgKElzLmV4aXN0KHJuTWF0ZXJpYWwpKSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgbm9kZS1iYXNlZCBjdXN0b20gc2hhZGVyIG1hdGVyaWFsXG4gICAgICBpZiAocm5NYXRlcmlhbC5pc05vZGVCYXNlZE1hdGVyaWFsICYmIHJuTWF0ZXJpYWwuc2hhZGVyTm9kZUpzb24gIT0gbnVsbCkge1xuICAgICAgICBhd2FpdCB0aGlzLl9fc2V0dXBOb2RlQmFzZWRNYXRlcmlhbEV4dGVuc2lvbihtYXRlcmlhbCwgcm5NYXRlcmlhbCwganNvbiwgcHJvbWlzZXMsIGJ1ZmZlcklkeCwgb3B0aW9uKTtcbiAgICAgICAgLy8gU2tpcCBub3JtYWwgUEJSIG1hdGVyaWFsIHNldHVwIGZvciBub2RlLWJhc2VkIG1hdGVyaWFsc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fX3NldHVwTWF0ZXJpYWwobWF0ZXJpYWwsIHJuTWF0ZXJpYWwsIGpzb24sIHByb21pc2VzLCBidWZmZXJJZHgsIG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGVyaWFsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIFJIT0RPTklURV9tYXRlcmlhbHNfbm9kZSBleHRlbnNpb24gZm9yIG5vZGUtYmFzZWQgbWF0ZXJpYWxzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgZ2xURiBtYXRlcmlhbCB0byBhZGQgdGhlIGV4dGVuc2lvbiB0b1xuICAgKiBAcGFyYW0gcm5NYXRlcmlhbCAtIFRoZSBSaG9kb25pdGUgbWF0ZXJpYWwgY29udGFpbmluZyBub2RlLWJhc2VkIHNoYWRlciBkYXRhXG4gICAqIEBwYXJhbSBqc29uIC0gVGhlIGdsVEYgSlNPTiBkb2N1bWVudFxuICAgKiBAcGFyYW0gcHJvbWlzZXMgLSBBcnJheSB0byBjb2xsZWN0IGFzeW5jIG9wZXJhdGlvbnNcbiAgICogQHBhcmFtIGJ1ZmZlcklkeCAtIFRoZSBidWZmZXIgaW5kZXggZm9yIHRleHR1cmUgZGF0YVxuICAgKiBAcGFyYW0gb3B0aW9uIC0gRXhwb3J0IG9wdGlvbnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fc2V0dXBOb2RlQmFzZWRNYXRlcmlhbEV4dGVuc2lvbihcbiAgICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4LFxuICAgIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgcHJvbWlzZXM6IFByb21pc2U8YW55PltdLFxuICAgIGJ1ZmZlcklkeDogbnVtYmVyLFxuICAgIG9wdGlvbjogR2x0ZjJFeHBvcnRlckFyZ3VtZW50c1xuICApIHtcbiAgICBjb25zdCBFWFRFTlNJT05fTkFNRSA9ICdSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGUnO1xuXG4gICAgLy8gRW5zdXJlIGV4dGVuc2lvbnMgb2JqZWN0IGV4aXN0cyBvbiBtYXRlcmlhbFxuICAgIGlmICghbWF0ZXJpYWwuZXh0ZW5zaW9ucykge1xuICAgICAgbWF0ZXJpYWwuZXh0ZW5zaW9ucyA9IHt9O1xuICAgIH1cblxuICAgIC8vIFVzZSBzaGFkZXJOb2RlRmlsZU5hbWUgaWYgc2V0LCBvdGhlcndpc2UgZ2VuZXJhdGUgYSBkZWZhdWx0IG5hbWVcbiAgICBjb25zdCBybW5GaWxlTmFtZSA9IHJuTWF0ZXJpYWwuc2hhZGVyTm9kZUZpbGVOYW1lID8/IGAke3JuTWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZX1fJHtybk1hdGVyaWFsLm1hdGVyaWFsVUlEfS5ybW5gO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBleHRlbnNpb24gZGF0YVxuICAgIGNvbnN0IGV4dGVuc2lvbkRhdGE6IHtcbiAgICAgIHVyaTogc3RyaW5nO1xuICAgICAgdW5pZm9ybXM/OiB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfCBudW1iZXJbXSB8IHsgaW5kZXg6IG51bWJlciB9IH07XG4gICAgfSA9IHtcbiAgICAgIHVyaTogYC4vJHtybW5GaWxlTmFtZX1gLFxuICAgIH07XG5cbiAgICAvLyBBZGQgdW5pZm9ybXMgaWYgdGhleSBleGlzdFxuICAgIGlmIChybk1hdGVyaWFsLnNoYWRlck5vZGVVbmlmb3JtcyAhPSBudWxsKSB7XG4gICAgICBleHRlbnNpb25EYXRhLnVuaWZvcm1zID0geyAuLi5ybk1hdGVyaWFsLnNoYWRlck5vZGVVbmlmb3JtcyB9O1xuICAgIH1cblxuICAgIC8vIFByb2Nlc3MgdGV4dHVyZSBwYXJhbWV0ZXJzIGZyb20gdGhlIG1hdGVyaWFsXG4gICAgY29uc3QgdGV4dHVyZVVuaWZvcm1zID0gYXdhaXQgdGhpcy5fX3Byb2Nlc3NOb2RlQmFzZWRNYXRlcmlhbFRleHR1cmVzKFxuICAgICAgcm5NYXRlcmlhbCxcbiAgICAgIGpzb24sXG4gICAgICBwcm9taXNlcyxcbiAgICAgIGJ1ZmZlcklkeCxcbiAgICAgIG9wdGlvblxuICAgICk7XG5cbiAgICAvLyBNZXJnZSB0ZXh0dXJlIHVuaWZvcm1zIGludG8gdGhlIGV4dGVuc2lvbiBkYXRhXG4gICAgaWYgKE9iamVjdC5rZXlzKHRleHR1cmVVbmlmb3JtcykubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFleHRlbnNpb25EYXRhLnVuaWZvcm1zKSB7XG4gICAgICAgIGV4dGVuc2lvbkRhdGEudW5pZm9ybXMgPSB7fTtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5hc3NpZ24oZXh0ZW5zaW9uRGF0YS51bmlmb3JtcywgdGV4dHVyZVVuaWZvcm1zKTtcbiAgICB9XG5cbiAgICBtYXRlcmlhbC5leHRlbnNpb25zW0VYVEVOU0lPTl9OQU1FXSA9IGV4dGVuc2lvbkRhdGE7XG5cbiAgICAvLyBFbnN1cmUgdGhlIGV4dGVuc2lvbiBpcyBsaXN0ZWQgaW4gZXh0ZW5zaW9uc1VzZWRcbiAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCBFWFRFTlNJT05fTkFNRSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIHRleHR1cmUgcGFyYW1ldGVycyBmcm9tIGEgbm9kZS1iYXNlZCBtYXRlcmlhbCBhbmQgZXhwb3J0cyB0aGVtIHRvIGdsVEYgZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0gcm5NYXRlcmlhbCAtIFRoZSBSaG9kb25pdGUgbWF0ZXJpYWwgY29udGFpbmluZyB0ZXh0dXJlIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURiBKU09OIGRvY3VtZW50XG4gICAqIEBwYXJhbSBwcm9taXNlcyAtIEFycmF5IHRvIGNvbGxlY3QgYXN5bmMgb3BlcmF0aW9uc1xuICAgKiBAcGFyYW0gYnVmZmVySWR4IC0gVGhlIGJ1ZmZlciBpbmRleCBmb3IgdGV4dHVyZSBkYXRhXG4gICAqIEBwYXJhbSBvcHRpb24gLSBFeHBvcnQgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBPYmplY3QgbWFwcGluZyB0ZXh0dXJlIG5hbWVzIHRvIHRoZWlyIGdsVEYgdGV4dHVyZSBpbmRpY2VzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX3Byb2Nlc3NOb2RlQmFzZWRNYXRlcmlhbFRleHR1cmVzKFxuICAgIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgcHJvbWlzZXM6IFByb21pc2U8YW55PltdLFxuICAgIGJ1ZmZlcklkeDogbnVtYmVyLFxuICAgIG9wdGlvbjogR2x0ZjJFeHBvcnRlckFyZ3VtZW50cyxcbiAgICBzZW1hbnRpY0ZpbHRlcjogKHNlbWFudGljOiBzdHJpbmcpID0+IGJvb2xlYW4gPSAoKSA9PiB0cnVlXG4gICk6IFByb21pc2U8eyBbbmFtZTogc3RyaW5nXTogeyBpbmRleDogbnVtYmVyIH0gfT4ge1xuICAgIGNvbnN0IHRleHR1cmVVbmlmb3JtczogeyBbbmFtZTogc3RyaW5nXTogeyBpbmRleDogbnVtYmVyIH0gfSA9IHt9O1xuICAgIGNvbnN0IGV4aXN0ZWRJbWFnZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvY2VzcyBzYW1wbGVyXG4gICAgY29uc3QgcHJvY2Vzc1NhbXBsZXIgPSAocm5TYW1wbGVyPzogU2FtcGxlcikgPT4ge1xuICAgICAgY29uc3QgZ2x0ZjJUZXh0dXJlU2FtcGxlcjogR2x0ZjJUZXh0dXJlU2FtcGxlciA9IHtcbiAgICAgICAgbWFnRmlsdGVyOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci5tYWdGaWx0ZXIuaW5kZXggOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhci5pbmRleCxcbiAgICAgICAgbWluRmlsdGVyOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci5taW5GaWx0ZXIuaW5kZXggOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhci5pbmRleCxcbiAgICAgICAgd3JhcFM6IHJuU2FtcGxlciAhPSBudWxsID8gcm5TYW1wbGVyLndyYXBTLmluZGV4IDogVGV4dHVyZVBhcmFtZXRlci5UZXh0dXJlV3JhcFMuaW5kZXgsXG4gICAgICAgIHdyYXBUOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci53cmFwVC5pbmRleCA6IFRleHR1cmVQYXJhbWV0ZXIuVGV4dHVyZVdyYXBULmluZGV4LFxuICAgICAgfTtcblxuICAgICAgbGV0IHNhbXBsZXJJZHggPSBqc29uLnNhbXBsZXJzLmZpbmRJbmRleChzYW1wbGVyID0+IHtcbiAgICAgICAgcmV0dXJuIGlzU2FtZUdsVEYyVGV4dHVyZVNhbXBsZXIoZ2x0ZjJUZXh0dXJlU2FtcGxlciwgc2FtcGxlcik7XG4gICAgICB9KTtcbiAgICAgIGlmIChzYW1wbGVySWR4ID09PSAtMSkge1xuICAgICAgICBqc29uLnNhbXBsZXJzLnB1c2goZ2x0ZjJUZXh0dXJlU2FtcGxlcik7XG4gICAgICAgIHNhbXBsZXJJZHggPSBqc29uLnNhbXBsZXJzLmxlbmd0aCAtIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2FtcGxlcklkeDtcbiAgICB9O1xuXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHByb2Nlc3MgaW1hZ2VcbiAgICBjb25zdCBwcm9jZXNzSW1hZ2UgPSAocm5UZXh0dXJlOiBBYnN0cmFjdFRleHR1cmUpID0+IHtcbiAgICAgIGxldCBpbWFnZUluZGV4ID0ganNvbi5pbWFnZXMubGVuZ3RoO1xuICAgICAgbGV0IG1hdGNoID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGpzb24uaW1hZ2VzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0ganNvbi5pbWFnZXMhW2tdO1xuICAgICAgICBjb25zdCBleGlzdGluZ1RleHR1cmVVaWQgPSBpbWFnZS5leHRyYXM/LnJuVGV4dHVyZVVJRDtcbiAgICAgICAgaWYgKElzLmV4aXN0KGV4aXN0aW5nVGV4dHVyZVVpZCkgJiYgZXhpc3RpbmdUZXh0dXJlVWlkID09PSByblRleHR1cmUudGV4dHVyZVVJRCkge1xuICAgICAgICAgIGltYWdlSW5kZXggPSBrO1xuICAgICAgICAgIG1hdGNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIGNvbnN0IGdsVEYySW1hZ2VFeDogR2x0ZjJJbWFnZUV4ID0ge1xuICAgICAgICAgIHVyaTogcm5UZXh0dXJlLm5hbWUsXG4gICAgICAgICAgLy8gR0xCIGV4cG9ydHMgZHJvcCB0aGUgdXJpLCBzbyBrZWVwIHRoZSB0ZXh0dXJlIG5hbWUgZm9yIHRoZSBpbXBvcnRlci5cbiAgICAgICAgICBuYW1lOiByblRleHR1cmUubmFtZSB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgZXh0cmFzOiB7XG4gICAgICAgICAgICByblRleHR1cmVVSUQ6IHJuVGV4dHVyZS50ZXh0dXJlVUlELFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGV4aXN0ZWRJbWFnZXMuaW5kZXhPZihyblRleHR1cmUubmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgZ2xURjJJbWFnZUV4LnVyaSArPSBgXyR7cm5UZXh0dXJlLnRleHR1cmVVSUR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4aXN0ZWRJbWFnZXMucHVzaChnbFRGMkltYWdlRXgudXJpISk7XG5cbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChnbFRGMkltYWdlRXgudXJpIS5tYXRjaCgvXFwuKHBuZykvKSkpIHtcbiAgICAgICAgICBnbFRGMkltYWdlRXgudXJpICs9ICcucG5nJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBodG1sQ2FudmFzRWxlbWVudCA9IHJuVGV4dHVyZS5odG1sQ2FudmFzRWxlbWVudDtcbiAgICAgICAgaWYgKGh0bWxDYW52YXNFbGVtZW50KSB7XG4gICAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKFxuICAgICAgICAgICAgKHJlc29sdmU6ICh2PzogQXJyYXlCdWZmZXIpID0+IHZvaWQsIHJlamVjdGVkOiAocmVhc29uPzogRE9NRXhjZXB0aW9uKSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICAgIGh0bWxDYW52YXNFbGVtZW50LnRvQmxvYihibG9iID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoSXMuZXhpc3QoYmxvYikpIHtcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVRleHR1cmVJbWFnZShqc29uLCBidWZmZXJJZHgsIGJsb2IsIG9wdGlvbiwgZ2xURjJJbWFnZUV4LCByZXNvbHZlLCByZWplY3RlZCwgR0xURjJfRVhQT1JUX0dMVEYpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignY2FudmFzIHRvIGJsb2IgZXJyb3IhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZSk7XG4gICAgICAgIH1cbiAgICAgICAganNvbi5pbWFnZXMucHVzaChnbFRGMkltYWdlRXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGltYWdlSW5kZXg7XG4gICAgfTtcblxuICAgIC8vIEhlbHBlciBmdW5jdGlvbiB0byBwcm9jZXNzIHRleHR1cmVcbiAgICBjb25zdCBwcm9jZXNzVGV4dHVyZSA9IChyblRleHR1cmU6IEFic3RyYWN0VGV4dHVyZSwgcm5TYW1wbGVyPzogU2FtcGxlcik6IG51bWJlciB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICBpZiAoIXJuVGV4dHVyZSkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgICAgaWYgKCFyblRleHR1cmUuaXNUZXh0dXJlUmVhZHkgfHwgcm5UZXh0dXJlLmlzRHVtbXlUZXh0dXJlIHx8IHJuVGV4dHVyZS53aWR0aCA8IDEgfHwgcm5UZXh0dXJlLmhlaWdodCA8IDEpIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2FtcGxlcklkeCA9IHByb2Nlc3NTYW1wbGVyKHJuU2FtcGxlcik7XG4gICAgICBjb25zdCBpbWFnZUluZGV4ID0gcHJvY2Vzc0ltYWdlKHJuVGV4dHVyZSk7XG5cbiAgICAgIGNvbnN0IGdsdGYyVGV4dHVyZTogR2x0ZjJUZXh0dXJlID0ge1xuICAgICAgICBzYW1wbGVyOiBzYW1wbGVySWR4LFxuICAgICAgICBzb3VyY2U6IGltYWdlSW5kZXgsXG4gICAgICB9O1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGlzIGV4YWN0IHRleHR1cmUgYWxyZWFkeSBleGlzdHNcbiAgICAgIGxldCB0ZXh0dXJlSWR4ID0ganNvbi50ZXh0dXJlcy5maW5kSW5kZXgoXG4gICAgICAgIHQgPT4gdC5zYW1wbGVyID09PSBnbHRmMlRleHR1cmUuc2FtcGxlciAmJiB0LnNvdXJjZSA9PT0gZ2x0ZjJUZXh0dXJlLnNvdXJjZVxuICAgICAgKTtcbiAgICAgIGlmICh0ZXh0dXJlSWR4ID09PSAtMSkge1xuICAgICAgICBqc29uLnRleHR1cmVzLnB1c2goZ2x0ZjJUZXh0dXJlKTtcbiAgICAgICAgdGV4dHVyZUlkeCA9IGpzb24udGV4dHVyZXMubGVuZ3RoIC0gMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRleHR1cmVJZHg7XG4gICAgfTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgZmllbGQgaW5mbyB0byBmaW5kIHRleHR1cmUgcGFyYW1ldGVyc1xuICAgIGNvbnN0IGZpZWxkc0luZm8gPSBybk1hdGVyaWFsLmZpZWxkc0luZm9BcnJheTtcbiAgICBmb3IgKGNvbnN0IGluZm8gb2YgZmllbGRzSW5mbykge1xuICAgICAgY29uc3QgY29tcG9zaXRpb25UeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGU7XG5cbiAgICAgIGlmICghc2VtYW50aWNGaWx0ZXIoaW5mby5zZW1hbnRpYykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoaXMgZmllbGQgaXMgYSB0ZXh0dXJlIHR5cGVcbiAgICAgIGlmIChcbiAgICAgICAgY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSA3IHx8IC8vIFRleHR1cmUyRFxuICAgICAgICBjb21wb3NpdGlvblR5cGUuaW5kZXggPT09IDggfHwgLy8gVGV4dHVyZUN1YmVcbiAgICAgICAgY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSAxNiB8fCAvLyBUZXh0dXJlMkRTaGFkb3dcbiAgICAgICAgY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSAxNyB8fCAvLyBUZXh0dXJlMkRSZWN0XG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZS5pbmRleCA9PT0gMTggLy8gVGV4dHVyZTJEQXJyYXlcbiAgICAgICkge1xuICAgICAgICBjb25zdCB0ZXh0dXJlUGFyYW0gPSBybk1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoaW5mby5zZW1hbnRpYyk7XG4gICAgICAgIGlmICh0ZXh0dXJlUGFyYW0gJiYgQXJyYXkuaXNBcnJheSh0ZXh0dXJlUGFyYW0pICYmIHRleHR1cmVQYXJhbS5sZW5ndGggPj0gMikge1xuICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB0ZXh0dXJlUGFyYW1bMV0gYXMgQWJzdHJhY3RUZXh0dXJlO1xuICAgICAgICAgIGNvbnN0IHNhbXBsZXIgPSB0ZXh0dXJlUGFyYW1bMl0gYXMgU2FtcGxlciB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgIGlmICh0ZXh0dXJlICYmICF0ZXh0dXJlLmlzRHVtbXlUZXh0dXJlKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0dXJlSWR4ID0gcHJvY2Vzc1RleHR1cmUodGV4dHVyZSwgc2FtcGxlcik7XG4gICAgICAgICAgICBpZiAodGV4dHVyZUlkeCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRleHR1cmVVbmlmb3Jtc1tpbmZvLnNlbWFudGljXSA9IHsgaW5kZXg6IHRleHR1cmVJZHggfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGV4dHVyZVVuaWZvcm1zO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgdGhlIHVzZXItYXNzaWduZWQgdGV4dHVyZXMgb2YgdGhlIHNoYXJlZCByYXltYXJjaGluZyBtYXRlcmlhbC5cbiAgICpcbiAgICogVGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsIGlzIHNoYXJlZCBieSBldmVyeSByYXltYXJjaGluZyBjb21wb25lbnQsIHNvIGl0cyB0ZXh0dXJlIHBhcmFtZXRlcnNcbiAgICogbGl2ZSBhdCB0aGUgZ2xURiByb290IGluc3RlYWQgb2YgdGhlIHBlci1ub2RlIFJIT0RPTklURV9yYXltYXJjaGluZyBleHRlbnNpb24uIFRoZSBpbWFnZXMgYXJlXG4gICAqIHdyaXR0ZW4gaW50byB0aGUgc3RhbmRhcmQgZ2xURiBpbWFnZXMvdGV4dHVyZXMvc2FtcGxlcnMgYXJyYXlzLCBhbmQgdGhlIGV4dGVuc2lvbiBtYXBzIGVhY2hcbiAgICogc2hhZGVyIHNlbWFudGljIHRvIGl0cyB0ZXh0dXJlIGluZGV4LiBPbmx5IHRleHR1cmVzIGRlY2xhcmVkIGJ5IFRleHR1cmUyRCBub2RlcyBpbiB0aGVcbiAgICogbWF0ZXJpYWwncyBncmFwaCBhcmUgZXhwb3J0ZWQ7IGVuZ2luZS1tYW5hZ2VkIHRleHR1cmVzIChJQkwsIHNoYWRvdyBtYXBzLCB0aGUgc2hlZW4gTFVUIGFuZFxuICAgKiB0aGUgdHJhbnNtaXNzaW9uIGJhY2sgYnVmZmVyKSBhcmUgbm90LlxuICAgKlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBvdXRwdXQgZ2xURiBKU09OXG4gICAqIEBwYXJhbSBvcHRpb24gLSBFeHBvcnQgb3B0aW9ucywgaW5jbHVkaW5nIHRoZSByYXltYXJjaGluZyBtYXRlcmlhbCB0byBleHBvcnRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fZXhwb3J0UmF5bWFyY2hpbmdNYXRlcmlhbHMoanNvbjogR2x0ZjJFeCwgb3B0aW9uOiBHbHRmMkV4cG9ydGVyQXJndW1lbnRzKSB7XG4gICAgY29uc3QgY29tcG9uZW50TWF0ZXJpYWxzID0gb3B0aW9uLnJheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzO1xuICAgIGlmIChjb21wb25lbnRNYXRlcmlhbHMgIT0gbnVsbCAmJiBjb21wb25lbnRNYXRlcmlhbHMubGVuZ3RoID4gMCkge1xuICAgICAgYXdhaXQgdGhpcy5fX2V4cG9ydFJheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzKGpzb24sIGNvbXBvbmVudE1hdGVyaWFscywgb3B0aW9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByYXltYXJjaGluZ01hdGVyaWFsID0gb3B0aW9uLnJheW1hcmNoaW5nTWF0ZXJpYWw7XG4gICAgaWYgKHJheW1hcmNoaW5nTWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHR1cmVzID0gYXdhaXQgdGhpcy5fX2V4cG9ydE1hdGVyaWFsVXNlclRleHR1cmVzKGpzb24sIHJheW1hcmNoaW5nTWF0ZXJpYWwsIG9wdGlvbik7XG4gICAgaWYgKHRleHR1cmVzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoSXMubm90LmV4aXN0KGpzb24uZXh0ZW5zaW9ucykpIHtcbiAgICAgIGpzb24uZXh0ZW5zaW9ucyA9IHt9O1xuICAgIH1cbiAgICAoanNvbi5leHRlbnNpb25zIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5SSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzID0ge1xuICAgICAgdGV4dHVyZXMsXG4gICAgfTtcbiAgICB0aGlzLl9fZW5zdXJlRXh0ZW5zaW9uVXNlZChqc29uLCAnUkhPRE9OSVRFX3JheW1hcmNoaW5nX21hdGVyaWFscycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgZWFjaCBjb21wb25lbnQncyByYXltYXJjaGluZyB0ZXh0dXJlcyBpbnRvIGl0cyBgUkhPRE9OSVRFX3JheW1hcmNoaW5nYCBub2RlXG4gICAqIGV4dGVuc2lvbi5cbiAgICpcbiAgICogVGhlIG5vZGUgaW5kZXggb2YgYW4gZW50aXR5IGlzIGFzc2lnbmVkIGJ5IHtAbGluayBfX2NyZWF0ZU5vZGVzfSwgc28gdGhpcyBydW5zIGFmdGVyIHRoZVxuICAgKiBub2RlcyBhcmUgd3JpdHRlbi4gVGV4dHVyZSBpbmRpY2VzIHJlZmVyIHRvIHRoZSBzaGFyZWQgZ2xURiBgdGV4dHVyZXNgIGFycmF5LCBhbmQgaW1hZ2VzXG4gICAqIGFyZSBkZWR1cGxpY2F0ZWQgYnkgdGhlIG5vcm1hbCB0ZXh0dXJlIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBqc29uIC0gVGhlIG91dHB1dCBnbFRGIEpTT05cbiAgICogQHBhcmFtIGNvbXBvbmVudE1hdGVyaWFscyAtIFRoZSBwZXItY29tcG9uZW50IG1hdGVyaWFscyB0byBleHBvcnRcbiAgICogQHBhcmFtIG9wdGlvbiAtIEV4cG9ydCBvcHRpb25zXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX2V4cG9ydFJheW1hcmNoaW5nQ29tcG9uZW50TWF0ZXJpYWxzKFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgY29tcG9uZW50TWF0ZXJpYWxzOiB7IGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7IG1hdGVyaWFsOiBNYXRlcmlhbCB9W10sXG4gICAgb3B0aW9uOiBHbHRmMkV4cG9ydGVyQXJndW1lbnRzXG4gICkge1xuICAgIGZvciAoY29uc3QgeyBlbnRpdHksIG1hdGVyaWFsIH0gb2YgY29tcG9uZW50TWF0ZXJpYWxzKSB7XG4gICAgICBjb25zdCBub2RlSW5kZXggPSAoZW50aXR5IGFzIHsgZ2x0Zk5vZGVJbmRleD86IG51bWJlciB9KS5nbHRmTm9kZUluZGV4O1xuICAgICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgbm9kZSA9IGpzb24ubm9kZXM/Lltub2RlSW5kZXhdO1xuICAgICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGV4dHVyZXMgPSBhd2FpdCB0aGlzLl9fZXhwb3J0TWF0ZXJpYWxVc2VyVGV4dHVyZXMoanNvbiwgbWF0ZXJpYWwsIG9wdGlvbik7XG4gICAgICBpZiAodGV4dHVyZXMgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKElzLm5vdC5leGlzdChub2RlLmV4dGVuc2lvbnMpKSB7XG4gICAgICAgIG5vZGUuZXh0ZW5zaW9ucyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgZXh0ZW5zaW9ucyA9IG5vZGUuZXh0ZW5zaW9ucyBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgICAgbGV0IHJheW1hcmNoaW5nRXh0ZW5zaW9uID0gZXh0ZW5zaW9ucy5SSE9ET05JVEVfcmF5bWFyY2hpbmcgYXMgUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChyYXltYXJjaGluZ0V4dGVuc2lvbiA9PSBudWxsKSB7XG4gICAgICAgIHJheW1hcmNoaW5nRXh0ZW5zaW9uID0ge307XG4gICAgICAgIGV4dGVuc2lvbnMuUkhPRE9OSVRFX3JheW1hcmNoaW5nID0gcmF5bWFyY2hpbmdFeHRlbnNpb247XG4gICAgICB9XG4gICAgICByYXltYXJjaGluZ0V4dGVuc2lvbi50ZXh0dXJlcyA9IHRleHR1cmVzO1xuICAgICAgdGhpcy5fX2Vuc3VyZUV4dGVuc2lvblVzZWQoanNvbiwgJ1JIT0RPTklURV9yYXltYXJjaGluZycpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSB1c2VyLWFzc2lnbmVkIFRleHR1cmUyRCBwYXJhbWV0ZXJzIG9mIGEgcmF5bWFyY2hpbmcgbWF0ZXJpYWwuXG4gICAqXG4gICAqIE9ubHkgdGV4dHVyZXMgZGVjbGFyZWQgYnkgVGV4dHVyZTJEIG5vZGVzIGluIHRoZSBncmFwaCBhcmUgdXNlci1hdXRob3JlZC4gVGhlIG1hdGVyaWFsXG4gICAqIGFsc28gY2FycmllcyBlbmdpbmUtbWFuYWdlZCB0ZXh0dXJlcyAoSUJMLCBzaGFkb3dzLCB0aGUgc2hlZW4gTFVULCB0aGUgdHJhbnNtaXNzaW9uIGJhY2tcbiAgICogYnVmZmVyKSwgYW5kIGV4cG9ydGluZyB0aG9zZSB3b3VsZCBlbWJlZCBlbnZpcm9ubWVudC9zaGFkb3cgZGF0YSBpbnRvIHRoZSBzY2VuZS5cbiAgICpcbiAgICogQHBhcmFtIGpzb24gLSBUaGUgb3V0cHV0IGdsVEYgSlNPTlxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgd2hvc2UgdGV4dHVyZXMgYXJlIGV4cG9ydGVkXG4gICAqIEBwYXJhbSBvcHRpb24gLSBFeHBvcnQgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgc2VtYW50aWMgdG8gdGV4dHVyZS1pbmRleCBtYXAsIG9yIHVuZGVmaW5lZCB3aGVuIHRoZSBtYXRlcmlhbCBoYXMgbm9uZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19leHBvcnRNYXRlcmlhbFVzZXJUZXh0dXJlcyhcbiAgICBqc29uOiBHbHRmMkV4LFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBvcHRpb246IEdsdGYyRXhwb3J0ZXJBcmd1bWVudHNcbiAgKTogUHJvbWlzZTx7IFtzZW1hbnRpYzogc3RyaW5nXTogeyBpbmRleDogbnVtYmVyIH0gfSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHNoYWRlck5vZGVKc29uID0gbWF0ZXJpYWwuc2hhZGVyTm9kZUpzb24gYXNcbiAgICAgIHwgeyBub2Rlcz86IHsgbmFtZT86IHN0cmluZzsgY29udHJvbHM/OiB7IG5hbWU/OiB7IHZhbHVlPzogc3RyaW5nIH0gfSB9W10gfVxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgdXNlclRleHR1cmVTZW1hbnRpY3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygc2hhZGVyTm9kZUpzb24/Lm5vZGVzID8/IFtdKSB7XG4gICAgICBpZiAobm9kZS5uYW1lID09PSAnVGV4dHVyZTJEJykge1xuICAgICAgICBjb25zdCBzZW1hbnRpYyA9IG5vZGUuY29udHJvbHM/Lm5hbWU/LnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHNlbWFudGljID09PSAnc3RyaW5nJyAmJiBzZW1hbnRpYy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdXNlclRleHR1cmVTZW1hbnRpY3MuYWRkKHNlbWFudGljKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodXNlclRleHR1cmVTZW1hbnRpY3Muc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcbiAgICBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkucHVzaCgwKTtcbiAgICBjb25zdCBidWZmZXJJZHggPSBqc29uLmV4dHJhcy5idWZmZXJWaWV3Qnl0ZUxlbmd0aEFjY3VtdWxhdGVkQXJyYXkubGVuZ3RoIC0gMTtcblxuICAgIGNvbnN0IHRleHR1cmVzID0gYXdhaXQgdGhpcy5fX3Byb2Nlc3NOb2RlQmFzZWRNYXRlcmlhbFRleHR1cmVzKFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICBqc29uLFxuICAgICAgcHJvbWlzZXMsXG4gICAgICBidWZmZXJJZHgsXG4gICAgICBvcHRpb24sXG4gICAgICBzZW1hbnRpYyA9PiB1c2VyVGV4dHVyZVNlbWFudGljcy5oYXMoc2VtYW50aWMpXG4gICAgKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG5cbiAgICByZXR1cm4gT2JqZWN0LmtleXModGV4dHVyZXMpLmxlbmd0aCA+IDAgPyB0ZXh0dXJlcyA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fc2V0dXBNYXRlcmlhbChcbiAgICBtYXRlcmlhbDogR2x0ZjJNYXRlcmlhbEV4LFxuICAgIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgcHJvbWlzZXM6IFByb21pc2U8YW55PltdLFxuICAgIGJ1ZmZlcklkeDogbnVtYmVyLFxuICAgIG9wdGlvbjogR2x0ZjJFeHBvcnRlckFyZ3VtZW50c1xuICApIHtcbiAgICBjb25zdCBleGlzdGVkSW1hZ2VzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgY29uc3QgcHJvY2Vzc1NhbXBsZXIgPSAocm5TYW1wbGVyPzogU2FtcGxlcikgPT4ge1xuICAgICAgY29uc3QgZ2x0ZjJUZXh0dXJlU2FtcGxlcjogR2x0ZjJUZXh0dXJlU2FtcGxlciA9IHtcbiAgICAgICAgbWFnRmlsdGVyOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci5tYWdGaWx0ZXIuaW5kZXggOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhci5pbmRleCxcbiAgICAgICAgbWluRmlsdGVyOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci5taW5GaWx0ZXIuaW5kZXggOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhci5pbmRleCxcbiAgICAgICAgd3JhcFM6IHJuU2FtcGxlciAhPSBudWxsID8gcm5TYW1wbGVyLndyYXBTLmluZGV4IDogVGV4dHVyZVBhcmFtZXRlci5UZXh0dXJlV3JhcFMuaW5kZXgsXG4gICAgICAgIHdyYXBUOiByblNhbXBsZXIgIT0gbnVsbCA/IHJuU2FtcGxlci53cmFwVC5pbmRleCA6IFRleHR1cmVQYXJhbWV0ZXIuVGV4dHVyZVdyYXBULmluZGV4LFxuICAgICAgfTtcblxuICAgICAgbGV0IHNhbXBsZXJJZHggPSBqc29uLnNhbXBsZXJzLmZpbmRJbmRleChzYW1wbGVyID0+IHtcbiAgICAgICAgcmV0dXJuIGlzU2FtZUdsVEYyVGV4dHVyZVNhbXBsZXIoZ2x0ZjJUZXh0dXJlU2FtcGxlciwgc2FtcGxlcik7XG4gICAgICB9KTtcbiAgICAgIGlmIChzYW1wbGVySWR4ID09PSAtMSkge1xuICAgICAgICBqc29uLnNhbXBsZXJzLnB1c2goZ2x0ZjJUZXh0dXJlU2FtcGxlcik7XG4gICAgICAgIHNhbXBsZXJJZHggPSBqc29uLnNhbXBsZXJzLmxlbmd0aCAtIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2FtcGxlcklkeDtcbiAgICB9O1xuXG4gICAgY29uc3QgcHJvY2Vzc0ltYWdlID0gKHJuVGV4dHVyZTogQWJzdHJhY3RUZXh0dXJlKSA9PiB7XG4gICAgICBsZXQgaW1hZ2VJbmRleCA9IGpzb24uaW1hZ2VzLmxlbmd0aDtcbiAgICAgIGxldCBtYXRjaCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBqc29uLmltYWdlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICBjb25zdCBpbWFnZSA9IGpzb24uaW1hZ2VzIVtrXTtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdUZXh0dXJlVWlkID0gaW1hZ2UuZXh0cmFzPy5yblRleHR1cmVVSUQ7XG4gICAgICAgIGlmIChJcy5leGlzdChleGlzdGluZ1RleHR1cmVVaWQpICYmIGV4aXN0aW5nVGV4dHVyZVVpZCA9PT0gcm5UZXh0dXJlLnRleHR1cmVVSUQpIHtcbiAgICAgICAgICBpbWFnZUluZGV4ID0gaztcbiAgICAgICAgICBtYXRjaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBjb25zdCBnbFRGMkltYWdlRXg6IEdsdGYySW1hZ2VFeCA9IHtcbiAgICAgICAgICB1cmk6IHJuVGV4dHVyZS5uYW1lLFxuICAgICAgICAgIC8vIEdMQiBleHBvcnRzIGRyb3AgdGhlIHVyaSwgc28ga2VlcCB0aGUgdGV4dHVyZSBuYW1lIGZvciB0aGUgaW1wb3J0ZXIuXG4gICAgICAgICAgbmFtZTogcm5UZXh0dXJlLm5hbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIGV4dHJhczoge1xuICAgICAgICAgICAgcm5UZXh0dXJlVUlEOiByblRleHR1cmUudGV4dHVyZVVJRCxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChleGlzdGVkSW1hZ2VzLmluZGV4T2Yocm5UZXh0dXJlLm5hbWUpICE9PSAtMSkge1xuICAgICAgICAgIGdsVEYySW1hZ2VFeC51cmkgKz0gYF8ke3JuVGV4dHVyZS50ZXh0dXJlVUlEfWA7XG4gICAgICAgIH1cblxuICAgICAgICBleGlzdGVkSW1hZ2VzLnB1c2goZ2xURjJJbWFnZUV4LnVyaSEpO1xuXG4gICAgICAgIGlmIChJcy5ub3QuZXhpc3QoZ2xURjJJbWFnZUV4LnVyaSEubWF0Y2goL1xcLihwbmcpLykpKSB7XG4gICAgICAgICAgZ2xURjJJbWFnZUV4LnVyaSArPSAnLnBuZyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaHRtbENhbnZhc0VsZW1lbnQgPSByblRleHR1cmUuaHRtbENhbnZhc0VsZW1lbnQ7XG4gICAgICAgIGlmIChodG1sQ2FudmFzRWxlbWVudCkge1xuICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShcbiAgICAgICAgICAgIChyZXNvbHZlOiAodj86IEFycmF5QnVmZmVyKSA9PiB2b2lkLCByZWplY3RlZDogKHJlYXNvbj86IERPTUV4Y2VwdGlvbikgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgICBodG1sQ2FudmFzRWxlbWVudC50b0Jsb2IoYmxvYiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKElzLmV4aXN0KGJsb2IpKSB7XG4gICAgICAgICAgICAgICAgICBoYW5kbGVUZXh0dXJlSW1hZ2UoanNvbiwgYnVmZmVySWR4LCBibG9iLCBvcHRpb24sIGdsVEYySW1hZ2VFeCwgcmVzb2x2ZSwgcmVqZWN0ZWQsIEdMVEYyX0VYUE9SVF9HTFRGKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ2NhbnZhcyB0byBibG9iIGVycm9yIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgICAgICB9XG4gICAgICAgIGpzb24uaW1hZ2VzLnB1c2goZ2xURjJJbWFnZUV4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbWFnZUluZGV4O1xuICAgIH07XG5cbiAgICBjb25zdCBwcm9jZXNzVGV4dHVyZSA9IChyblRleHR1cmU6IEFic3RyYWN0VGV4dHVyZSwgcm5TYW1wbGVyPzogU2FtcGxlcikgPT4ge1xuICAgICAgY29uc3QgdGV4dHVyZSA9IHJuVGV4dHVyZTtcbiAgICAgIGlmICghdGV4dHVyZSkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgICAgaWYgKCF0ZXh0dXJlLmlzVGV4dHVyZVJlYWR5IHx8IHRleHR1cmUuaXNEdW1teVRleHR1cmUgfHwgdGV4dHVyZS53aWR0aCA8IDEgfHwgdGV4dHVyZS5oZWlnaHQgPCAxKSB7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNhbXBsZXJJZHggPSBwcm9jZXNzU2FtcGxlcihyblNhbXBsZXIpO1xuICAgICAgY29uc3QgaW1hZ2VJbmRleCA9IHByb2Nlc3NJbWFnZSh0ZXh0dXJlKTtcblxuICAgICAgY29uc3QgZ2x0ZjJUZXh0dXJlOiBHbHRmMlRleHR1cmUgPSB7XG4gICAgICAgIHNhbXBsZXI6IHNhbXBsZXJJZHgsXG4gICAgICAgIHNvdXJjZTogaW1hZ2VJbmRleCxcbiAgICAgIH07XG4gICAgICBjb25zdCB0ZXh0dXJlSWR4ID0ganNvbi50ZXh0dXJlcy5pbmRleE9mKGdsdGYyVGV4dHVyZSk7XG4gICAgICBpZiAodGV4dHVyZUlkeCA9PT0gLTEpIHtcbiAgICAgICAganNvbi50ZXh0dXJlcy5wdXNoKGdsdGYyVGV4dHVyZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBqc29uLnRleHR1cmVzLmluZGV4T2YoZ2x0ZjJUZXh0dXJlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5fX3Byb2Nlc3NQYXJhbWV0ZXJzKGpzb24sIG1hdGVyaWFsLCBybk1hdGVyaWFsLCBwcm9jZXNzVGV4dHVyZSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Byb2Nlc3NQYXJhbWV0ZXJzKFxuICAgIGpzb246IEdsdGYyRXgsXG4gICAgbWF0ZXJpYWw6IEdsdGYyTWF0ZXJpYWxFeCxcbiAgICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBwcm9jZXNzVGV4dHVyZTogKHJuVGV4dHVyZTogQWJzdHJhY3RUZXh0dXJlLCByblNhbXBsZXI/OiBTYW1wbGVyKSA9PiBudW1iZXIgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgY29uc3QgZW5zdXJlRXh0ZW5zaW9uVXNlZCA9IChleHRlbnNpb25OYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChqc29uLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoZXh0ZW5zaW9uTmFtZSkgPT09IC0xKSB7XG4gICAgICAgIGpzb24uZXh0ZW5zaW9uc1VzZWQucHVzaChleHRlbnNpb25OYW1lKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgY29lcmNlTnVtYmVyID0gKHZhbHVlOiBhbnkpOiBudW1iZXIgfCB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKElzLm5vdC5leGlzdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlWzBdIDogdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZS54ID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsdWUueSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWUueDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IHZpZXcgPSB2YWx1ZSBhcyBBcnJheUJ1ZmZlclZpZXc7XG4gICAgICAgICAgaWYgKGlzTnVtZXJpY0FycmF5QnVmZmVyVmlldyh2aWV3KSAmJiB2aWV3Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB2aWV3WzBdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnRlcm5hbCA9ICh2YWx1ZSBhcyB7IF92PzogQXJyYXlMaWtlPG51bWJlcj4gfSkuX3Y7XG4gICAgICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoaW50ZXJuYWwpKSB7XG4gICAgICAgICAgY29uc3QgdmlldyA9IGludGVybmFsIGFzIEFycmF5QnVmZmVyVmlldztcbiAgICAgICAgICBpZiAoaXNOdW1lcmljQXJyYXlCdWZmZXJWaWV3KHZpZXcpICYmIHZpZXcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHZpZXdbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGludGVybmFsKSkge1xuICAgICAgICAgIHJldHVybiBpbnRlcm5hbC5sZW5ndGggPiAwID8gaW50ZXJuYWxbMF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvZXJjZVZlYzIgPSAodmFsdWU6IGFueSk6IFtudW1iZXIsIG51bWJlcl0gfCB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKElzLm5vdC5leGlzdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlWzBdLCB2YWx1ZVsxXV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiBbdmFsdWVbMF0sIHZhbHVlWzBdXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZS54ID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsdWUueSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlLngsIHZhbHVlLnldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludGVybmFsID0gKHZhbHVlIGFzIHsgX3Y/OiBBcnJheUxpa2U8bnVtYmVyPiB9KS5fdjtcbiAgICAgICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhpbnRlcm5hbCkpIHtcbiAgICAgICAgICBjb25zdCB2aWV3ID0gaW50ZXJuYWwgYXMgQXJyYXlCdWZmZXJWaWV3O1xuICAgICAgICAgIGlmIChpc051bWVyaWNBcnJheUJ1ZmZlclZpZXcodmlldykgJiYgdmlldy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgcmV0dXJuIFt2aWV3WzBdLCB2aWV3WzFdXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW50ZXJuYWwpICYmIGludGVybmFsLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgcmV0dXJuIFtpbnRlcm5hbFswXSwgaW50ZXJuYWxbMV1dO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgdmlldyA9IHZhbHVlIGFzIEFycmF5QnVmZmVyVmlldztcbiAgICAgICAgICBpZiAoaXNOdW1lcmljQXJyYXlCdWZmZXJWaWV3KHZpZXcpICYmIHZpZXcubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHJldHVybiBbdmlld1swXSwgdmlld1sxXV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBjb25zdCBjb2VyY2VWZWMzID0gKHZhbHVlOiBhbnkpOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gfCB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKElzLm5vdC5leGlzdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlWzBdLCB2YWx1ZVsxXSwgdmFsdWVbMl1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlWzBdLCB2YWx1ZVsxXSwgdmFsdWVbMV1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlWzBdLCB2YWx1ZVswXSwgdmFsdWVbMF1dO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlLnggPT09ICdudW1iZXInICYmIHR5cGVvZiB2YWx1ZS55ID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsdWUueiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICByZXR1cm4gW3ZhbHVlLngsIHZhbHVlLnksIHZhbHVlLnpdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludGVybmFsID0gKHZhbHVlIGFzIHsgX3Y/OiBBcnJheUxpa2U8bnVtYmVyPiB9KS5fdjtcbiAgICAgICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhpbnRlcm5hbCkpIHtcbiAgICAgICAgICBjb25zdCB2aWV3ID0gaW50ZXJuYWwgYXMgQXJyYXlCdWZmZXJWaWV3O1xuICAgICAgICAgIGlmIChpc051bWVyaWNBcnJheUJ1ZmZlclZpZXcodmlldykgJiYgdmlldy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgcmV0dXJuIFt2aWV3WzBdLCB2aWV3WzFdLCB2aWV3WzJdXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW50ZXJuYWwpICYmIGludGVybmFsLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgcmV0dXJuIFtpbnRlcm5hbFswXSwgaW50ZXJuYWxbMV0sIGludGVybmFsWzJdXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IHZpZXcgPSB2YWx1ZSBhcyBBcnJheUJ1ZmZlclZpZXc7XG4gICAgICAgICAgaWYgKGlzTnVtZXJpY0FycmF5QnVmZmVyVmlldyh2aWV3KSAmJiB2aWV3Lmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICByZXR1cm4gW3ZpZXdbMF0sIHZpZXdbMV0sIHZpZXdbMl1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xuXG4gICAgdHlwZSBUZXh0dXJlT3B0aW9ucyA9IHtcbiAgICAgIHRleENvb3JkUGFyYW0/OiBzdHJpbmc7XG4gICAgICB0cmFuc2Zvcm0/OiB7XG4gICAgICAgIHNjYWxlPzogc3RyaW5nO1xuICAgICAgICBvZmZzZXQ/OiBzdHJpbmc7XG4gICAgICAgIHJvdGF0aW9uPzogc3RyaW5nO1xuICAgICAgfTtcbiAgICAgIHNjYWxlUGFyYW0/OiBzdHJpbmc7XG4gICAgICBzdHJlbmd0aFBhcmFtPzogc3RyaW5nO1xuICAgICAgb25Bc3NpZ246IChpbmZvOiBhbnkpID0+IHZvaWQ7XG4gICAgfTtcblxuICAgIGNvbnN0IGFwcGx5VGV4dHVyZSA9IChwYXJhbU5hbWU6IHN0cmluZywgb3B0aW9uczogVGV4dHVyZU9wdGlvbnMpID0+IHtcbiAgICAgIGNvbnN0IHRleHR1cmVQYXJhbSA9IHJuTWF0ZXJpYWwuZ2V0VGV4dHVyZVBhcmFtZXRlcihwYXJhbU5hbWUpIGFzIGFueTtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QodGV4dHVyZVBhcmFtKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByblRleHR1cmUgPSB0ZXh0dXJlUGFyYW1bMV0gYXMgVGV4dHVyZTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHRleHR1cmVQYXJhbVsyXSBhcyBTYW1wbGVyIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3QgdGV4dHVyZUluZGV4ID0gcHJvY2Vzc1RleHR1cmUocm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHRleHR1cmVJbmRleCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5mbzogYW55ID0ge1xuICAgICAgICBpbmRleDogdGV4dHVyZUluZGV4LFxuICAgICAgfTtcblxuICAgICAgaWYgKElzLmV4aXN0KG9wdGlvbnMudGV4Q29vcmRQYXJhbSkpIHtcbiAgICAgICAgY29uc3QgdGV4Q29vcmRWYWx1ZSA9IGNvZXJjZU51bWJlcihybk1hdGVyaWFsLmdldFBhcmFtZXRlcihvcHRpb25zLnRleENvb3JkUGFyYW0hKSk7XG4gICAgICAgIGlmIChJcy5leGlzdCh0ZXhDb29yZFZhbHVlKSkge1xuICAgICAgICAgIGluZm8udGV4Q29vcmQgPSB0ZXhDb29yZFZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChJcy5leGlzdChvcHRpb25zLnNjYWxlUGFyYW0pKSB7XG4gICAgICAgIGNvbnN0IHNjYWxlVmFsdWUgPSBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIob3B0aW9ucy5zY2FsZVBhcmFtISkpO1xuICAgICAgICBpZiAoSXMuZXhpc3Qoc2NhbGVWYWx1ZSkpIHtcbiAgICAgICAgICBpbmZvLnNjYWxlID0gc2NhbGVWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoSXMuZXhpc3Qob3B0aW9ucy5zdHJlbmd0aFBhcmFtKSkge1xuICAgICAgICBjb25zdCBzdHJlbmd0aFZhbHVlID0gY29lcmNlTnVtYmVyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKG9wdGlvbnMuc3RyZW5ndGhQYXJhbSEpKTtcbiAgICAgICAgaWYgKElzLmV4aXN0KHN0cmVuZ3RoVmFsdWUpKSB7XG4gICAgICAgICAgaW5mby5zdHJlbmd0aCA9IHN0cmVuZ3RoVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKElzLmV4aXN0KG9wdGlvbnMudHJhbnNmb3JtKSkge1xuICAgICAgICBjb25zdCBzY2FsZSA9IElzLmV4aXN0KG9wdGlvbnMudHJhbnNmb3JtIS5zY2FsZSlcbiAgICAgICAgICA/IGNvZXJjZVZlYzIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIob3B0aW9ucy50cmFuc2Zvcm0hLnNjYWxlISkpXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IElzLmV4aXN0KG9wdGlvbnMudHJhbnNmb3JtIS5vZmZzZXQpXG4gICAgICAgICAgPyBjb2VyY2VWZWMyKHJuTWF0ZXJpYWwuZ2V0UGFyYW1ldGVyKG9wdGlvbnMudHJhbnNmb3JtIS5vZmZzZXQhKSlcbiAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSBJcy5leGlzdChvcHRpb25zLnRyYW5zZm9ybSEucm90YXRpb24pXG4gICAgICAgICAgPyBjb2VyY2VOdW1iZXIocm5NYXRlcmlhbC5nZXRQYXJhbWV0ZXIob3B0aW9ucy50cmFuc2Zvcm0hLnJvdGF0aW9uISkpXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKElzLmV4aXN0KHNjYWxlKSB8fCBJcy5leGlzdChvZmZzZXQpIHx8IElzLmV4aXN0KHJvdGF0aW9uKSkge1xuICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgICAgICAgICBpZiAoSXMuZXhpc3Qoc2NhbGUpKSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm0uc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG9mZnNldCkpIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybS5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChJcy5leGlzdChyb3RhdGlvbikpIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybS5yb3RhdGlvbiA9IHJvdGF0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModHJhbnNmb3JtKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpbmZvLmV4dGVuc2lvbnMgPSBpbmZvLmV4dGVuc2lvbnMgPz8ge307XG4gICAgICAgICAgICBpbmZvLmV4dGVuc2lvbnMuS0hSX3RleHR1cmVfdHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCgnS0hSX3RleHR1cmVfdHJhbnNmb3JtJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMub25Bc3NpZ24oaW5mbyk7XG4gICAgfTtcblxuICAgIGNvbnN0IGlzVW5saXRNYXRlcmlhbCA9IElzLmZhbHNlKHJuTWF0ZXJpYWwuaXNMaWdodGluZyk7XG5cbiAgICBfX291dHB1dEJhc2VNYXRlcmlhbEluZm8ocm5NYXRlcmlhbCwgYXBwbHlUZXh0dXJlLCBtYXRlcmlhbCwganNvbiwge1xuICAgICAgc2tpcEFkZGl0aW9uYWxUZXh0dXJlczogaXNVbmxpdE1hdGVyaWFsLFxuICAgIH0pO1xuXG4gICAgaWYgKGlzVW5saXRNYXRlcmlhbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRW1pc3NpdmVTdHJlbmd0aEluZm8oZW5zdXJlRXh0ZW5zaW9uVXNlZCwgY29lcmNlTnVtYmVyLCBybk1hdGVyaWFsLCBtYXRlcmlhbCk7XG5cbiAgICBfX291dHB1dEtock1hdGVyaWFsc0RpZmZ1c2VUcmFuc21pc3Npb25JbmZvKFxuICAgICAgZW5zdXJlRXh0ZW5zaW9uVXNlZCxcbiAgICAgIGNvZXJjZU51bWJlcixcbiAgICAgIGNvZXJjZVZlYzMsXG4gICAgICBybk1hdGVyaWFsLFxuICAgICAgYXBwbHlUZXh0dXJlLFxuICAgICAgbWF0ZXJpYWxcbiAgICApO1xuXG4gICAgX19vdXRwdXRLaHJNYXRlcmlhbHNUcmFuc21pc3Npb25JbmZvKGVuc3VyZUV4dGVuc2lvblVzZWQsIGNvZXJjZU51bWJlciwgcm5NYXRlcmlhbCwgYXBwbHlUZXh0dXJlLCBtYXRlcmlhbCk7XG5cbiAgICBfX291dHB1dEtock1hdGVyaWFsc1ZvbHVtZUluZm8oZW5zdXJlRXh0ZW5zaW9uVXNlZCwgY29lcmNlTnVtYmVyLCBjb2VyY2VWZWMzLCBybk1hdGVyaWFsLCBhcHBseVRleHR1cmUsIG1hdGVyaWFsKTtcblxuICAgIF9fb3V0cHV0S2hyTWF0ZXJpYWxzRGlzcGVyc2lvbkluZm8oZW5zdXJlRXh0ZW5zaW9uVXNlZCwgY29lcmNlTnVtYmVyLCBybk1hdGVyaWFsLCBtYXRlcmlhbCk7XG5cbiAgICBfX291dHB1dEtock1hdGVyaWFsc0lvckluZm8oZW5zdXJlRXh0ZW5zaW9uVXNlZCwgY29lcmNlTnVtYmVyLCBybk1hdGVyaWFsLCBtYXRlcmlhbCk7XG5cbiAgICBfX291dHB1dEtock1hdGVyaWFsc0lyaWRlc2NlbmNlSW5mbyhlbnN1cmVFeHRlbnNpb25Vc2VkLCBjb2VyY2VOdW1iZXIsIHJuTWF0ZXJpYWwsIGFwcGx5VGV4dHVyZSwgbWF0ZXJpYWwpO1xuXG4gICAgX19vdXRwdXRLaHJNYXRlcmlhbHNDbGVhcmNvYXRJbmZvKGVuc3VyZUV4dGVuc2lvblVzZWQsIGNvZXJjZU51bWJlciwgcm5NYXRlcmlhbCwgYXBwbHlUZXh0dXJlLCBtYXRlcmlhbCk7XG5cbiAgICBfX291dHB1dEtock1hdGVyaWFsc1NoZWVuSW5mbyhlbnN1cmVFeHRlbnNpb25Vc2VkLCBjb2VyY2VOdW1iZXIsIGNvZXJjZVZlYzMsIHJuTWF0ZXJpYWwsIGFwcGx5VGV4dHVyZSwgbWF0ZXJpYWwpO1xuXG4gICAgX19vdXRwdXRLaHJNYXRlcmlhbHNTcGVjdWxhckluZm8oZW5zdXJlRXh0ZW5zaW9uVXNlZCwgY29lcmNlTnVtYmVyLCBjb2VyY2VWZWMzLCBybk1hdGVyaWFsLCBhcHBseVRleHR1cmUsIG1hdGVyaWFsKTtcblxuICAgIF9fb3V0cHV0S2hyTWF0ZXJpYWxzQW5pc290cm9weUluZm8oXG4gICAgICBlbnN1cmVFeHRlbnNpb25Vc2VkLFxuICAgICAgY29lcmNlTnVtYmVyLFxuICAgICAgY29lcmNlVmVjMixcbiAgICAgIHJuTWF0ZXJpYWwsXG4gICAgICBhcHBseVRleHR1cmUsXG4gICAgICBtYXRlcmlhbFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0aGUgYmluYXJ5IGJ1ZmZlciBjb250YWluaW5nIGFsbCBtZXNoLCBhbmltYXRpb24sIGFuZCB0ZXh0dXJlIGRhdGEuXG4gICAqXG4gICAqIENvbnNvbGlkYXRlcyBhbGwgYnVmZmVyIHZpZXdzIGludG8gYSBzaW5nbGUgYmluYXJ5IGJ1ZmZlciB3aXRoIHByb3BlclxuICAgKiBhbGlnbm1lbnQgYW5kIHBhZGRpbmcgYWNjb3JkaW5nIHRvIGdsVEYyIHNwZWNpZmljYXRpb24uIEhhbmRsZXMgZGF0YVxuICAgKiBjb3B5aW5nIGFuZCBtZW1vcnkgbGF5b3V0IG9wdGltaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURjIgSlNPTiBkb2N1bWVudCBjb250YWluaW5nIGJ1ZmZlciB2aWV3IGRlZmluaXRpb25zXG4gICAqIEByZXR1cm5zIEFycmF5QnVmZmVyIGNvbnRhaW5pbmcgdGhlIGNvbnNvbGlkYXRlZCBiaW5hcnkgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVCaW5hcnkoanNvbjogR2x0ZjJFeCkge1xuICAgIC8vIHdyaXRlIGFsbCBkYXRhIG9mIGFjY2Vzc29ycyB0byB0aGUgRGF0YVZpZXcgKHRvdGFsIGRhdGEgYXJlYSlcbiAgICBpZiAoSXMudW5kZWZpbmVkKGpzb24uYWNjZXNzb3JzKSB8fCBJcy51bmRlZmluZWQoanNvbi5idWZmZXJWaWV3cykpIHtcbiAgICAgIHJldHVybiBuZXcgQXJyYXlCdWZmZXIoMCk7XG4gICAgfVxuXG4gICAgY29uc3QgYnl0ZUxlbmd0aE9mVW5pdGVCdWZmZXIgPSBqc29uLmJ1ZmZlclZpZXdzLnJlZHVjZSgoc3VtLCBidWZmZXJWaWV3KSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBidWZmZXJWaWV3LmV4dHJhcz8udWludDhBcnJheTtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3Qoc291cmNlKSkge1xuICAgICAgICByZXR1cm4gc3VtICsgRGF0YVV0aWwuYWRkUGFkZGluZ0J5dGVzKGJ1ZmZlclZpZXcuYnl0ZUxlbmd0aCwgNCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VtICsgRGF0YVV0aWwuYWRkUGFkZGluZ0J5dGVzKHNvdXJjZS5ieXRlTGVuZ3RoLCA0KTtcbiAgICB9LCAwKTtcblxuICAgIGlmIChieXRlTGVuZ3RoT2ZVbml0ZUJ1ZmZlciA+IDApIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGpzb24uYnVmZmVycyFbMF07XG4gICAgICBidWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhPZlVuaXRlQnVmZmVyICsgRGF0YVV0aWwuY2FsY1BhZGRpbmdCeXRlcyhieXRlTGVuZ3RoT2ZVbml0ZUJ1ZmZlciwgNCk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHRoZSBBcnJheUJ1ZmZlciBvZiB1bml0ZSBCdWZmZXIgKGNvbnNpc3Qgb2YgbXVsdGlwbGUgQnVmZmVycylcbiAgICBjb25zdCBhcnJheUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihqc29uLmJ1ZmZlcnMhWzBdLmJ5dGVMZW5ndGgpO1xuXG4gICAgLy8gY29weSBCdWZmZXJWaWV3cyBpbiBtdWx0aXBsZSBCdWZmZXIgdG8gdGhlIFVuaXRlIEJ1ZmZlclxuICAgIGxldCBsYXN0Q29waWVkQnl0ZUxlbmd0aE9mQnVmZmVyVmlldyA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBqc29uLmJ1ZmZlclZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBidWZmZXJWaWV3ID0ganNvbi5idWZmZXJWaWV3c1tpXTtcbiAgICAgIGNvbnN0IHVpbnQ4QXJyYXlPZkJ1ZmZlclZpZXcgPSBidWZmZXJWaWV3LmV4dHJhcyEudWludDhBcnJheSE7XG4gICAgICAoYnVmZmVyVmlldyBhcyB1bmtub3duIGFzIEdsdGYyKS5leHRyYXMgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGNvbnN0IGRpc3RCeXRlT2Zmc2V0ID0gbGFzdENvcGllZEJ5dGVMZW5ndGhPZkJ1ZmZlclZpZXc7XG4gICAgICBEYXRhVXRpbC5jb3B5QXJyYXlCdWZmZXJXaXRoUGFkZGluZyh7XG4gICAgICAgIHNyYzogdWludDhBcnJheU9mQnVmZmVyVmlldy5idWZmZXIgYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgIGRpc3Q6IGFycmF5QnVmZmVyLFxuICAgICAgICBzcmNCeXRlT2Zmc2V0OiB1aW50OEFycmF5T2ZCdWZmZXJWaWV3LmJ5dGVPZmZzZXQsXG4gICAgICAgIGNvcHlCeXRlTGVuZ3RoOiB1aW50OEFycmF5T2ZCdWZmZXJWaWV3LmJ5dGVMZW5ndGgsXG4gICAgICAgIGRpc3RCeXRlT2Zmc2V0LFxuICAgICAgfSk7XG4gICAgICBsYXN0Q29waWVkQnl0ZUxlbmd0aE9mQnVmZmVyVmlldyArPSBEYXRhVXRpbC5hZGRQYWRkaW5nQnl0ZXModWludDhBcnJheU9mQnVmZmVyVmlldy5ieXRlTGVuZ3RoLCA0KTtcbiAgICAgIGJ1ZmZlclZpZXcuYnl0ZU9mZnNldCA9IGRpc3RCeXRlT2Zmc2V0O1xuICAgICAgYnVmZmVyVmlldy5idWZmZXIgPSAwOyAvLyByZXdyaXRlIGJ1ZmZlciBpbmRleCB0byAwIChUaGUgVW5pdGUgQnVmZmVyKVxuICAgIH1cblxuICAgIHJldHVybiBhcnJheUJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgZG93bmxvYWQgb2YgdGhlIGV4cG9ydGVkIGdsVEYyIGRhdGEgYXMgYSAuZ2xiIGZpbGUuXG4gICAqXG4gICAqIENyZWF0ZXMgYSBkb3dubG9hZGFibGUgLmdsYiBmaWxlIGNvbnRhaW5pbmcgdGhlIGNvbXBsZXRlIGdsVEYyIHNjZW5lXG4gICAqIGluIGJpbmFyeSBmb3JtYXQuIFVzZXMgYnJvd3NlciBkb3dubG9hZCBBUEkgdG8gc2F2ZSB0aGUgZmlsZSBsb2NhbGx5LlxuICAgKlxuICAgKiBAcGFyYW0ganNvbiAtIFRoZSBnbFRGMiBKU09OIGRvY3VtZW50XG4gICAqIEBwYXJhbSBmaWxlbmFtZSAtIEJhc2UgZmlsZW5hbWUgZm9yIHRoZSBkb3dubG9hZFxuICAgKiBAcGFyYW0gYXJyYXlidWZmZXIgLSBCaW5hcnkgZGF0YSBidWZmZXIgY29udGFpbmluZyB0aGUgLmdsYiBmaWxlXG4gICAqL1xuICBzdGF0aWMgX19kb3dubG9hZEdsYihfanNvbjogR2x0ZjIsIGZpbGVuYW1lOiBzdHJpbmcsIGFycmF5YnVmZmVyOiBBcnJheUJ1ZmZlcik6IHZvaWQge1xuICAgIHtcbiAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICBhLmRvd25sb2FkID0gYCR7ZmlsZW5hbWV9LmdsYmA7XG4gICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2FycmF5YnVmZmVyXSwgeyB0eXBlOiAnb2N0ZXQvc3RyZWFtJyB9KTtcbiAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICBhLmhyZWYgPSB1cmw7XG5cbiAgICAgIGNvbnN0IGUgPSBuZXcgTW91c2VFdmVudCgnY2xpY2snKTtcbiAgICAgIGEuZGlzcGF0Y2hFdmVudChlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGxhY2Vob2xkZXIgbWV0aG9kIGZvciBmdXR1cmUgZ2xURjIgQXJyYXlCdWZmZXIgZXhwb3J0IGZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIHJlc2VydmVkIGZvciBpbXBsZW1lbnRpbmcgZ2xURjIgZXhwb3J0IHRoYXQgcmV0dXJuc1xuICAgKiBhbiBBcnJheUJ1ZmZlciB3aXRob3V0IHRyaWdnZXJpbmcgYSBkb3dubG9hZC5cbiAgICovXG4gIGV4cG9ydEdsYkFzQXJyYXlCdWZmZXIoKSB7fVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZXMgZG93bmxvYWQgb2YgdGhlIGV4cG9ydGVkIGdsVEYyIGRhdGEgYXMgc2VwYXJhdGUgLmdsdGYgYW5kIC5iaW4gZmlsZXMuXG4gICAqXG4gICAqIENyZWF0ZXMgZG93bmxvYWRhYmxlIC5nbHRmIChKU09OKSBhbmQgLmJpbiAoYmluYXJ5KSBmaWxlcyByZXByZXNlbnRpbmdcbiAgICogdGhlIGNvbXBsZXRlIGdsVEYyIHNjZW5lIGluIHRleHQgZm9ybWF0IHdpdGggZXh0ZXJuYWwgYmluYXJ5IHJlZmVyZW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBqc29uIC0gVGhlIGdsVEYyIEpTT04gZG9jdW1lbnRcbiAgICogQHBhcmFtIGZpbGVuYW1lIC0gQmFzZSBmaWxlbmFtZSBmb3IgdGhlIGRvd25sb2Fkc1xuICAgKiBAcGFyYW0gYXJyYXlidWZmZXIgLSBCaW5hcnkgZGF0YSBidWZmZXIgZm9yIHRoZSAuYmluIGZpbGVcbiAgICovXG4gIHN0YXRpYyBfX2Rvd25sb2FkR2x0Zihqc29uOiBHbHRmMiwgZmlsZW5hbWU6IHN0cmluZywgYXJyYXlidWZmZXI6IEFycmF5QnVmZmVyKTogdm9pZCB7XG4gICAge1xuICAgICAgLy8gLmdsdGYgZmlsZVxuICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuICAgICAgYS5kb3dubG9hZCA9IGAke2ZpbGVuYW1lfS5nbHRmYDtcbiAgICAgIGNvbnN0IHN0ciA9IEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpO1xuICAgICAgYS5ocmVmID0gYGRhdGE6YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtLCR7ZW5jb2RlVVJJQ29tcG9uZW50KHN0cil9YDtcblxuICAgICAgY29uc3QgZSA9IG5ldyBNb3VzZUV2ZW50KCdjbGljaycpO1xuICAgICAgYS5kaXNwYXRjaEV2ZW50KGUpO1xuICAgIH1cbiAgICB7XG4gICAgICAvLyAuYmluIGZpbGVcbiAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICBhLmRvd25sb2FkID0gYCR7ZmlsZW5hbWV9LmJpbmA7XG4gICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2FycmF5YnVmZmVyXSwgeyB0eXBlOiAnb2N0ZXQvc3RyZWFtJyB9KTtcbiAgICAgIGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICBhLmhyZWYgPSB1cmw7XG4gICAgICBjb25zdCBlID0gbmV3IE1vdXNlRXZlbnQoJ2NsaWNrJyk7XG4gICAgICBhLmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IE1BVEVSSUFMX1BPSU5URVJfU1VGRklYX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgYmFzZUNvbG9yRmFjdG9yOiAnL3Bick1ldGFsbGljUm91Z2huZXNzL2Jhc2VDb2xvckZhY3RvcicsXG4gIG1ldGFsbGljRmFjdG9yOiAnL3Bick1ldGFsbGljUm91Z2huZXNzL21ldGFsbGljRmFjdG9yJyxcbiAgcm91Z2huZXNzRmFjdG9yOiAnL3Bick1ldGFsbGljUm91Z2huZXNzL3JvdWdobmVzc0ZhY3RvcicsXG4gIGVtaXNzaXZlRmFjdG9yOiAnL2VtaXNzaXZlRmFjdG9yJyxcbiAgZW1pc3NpdmVTdHJlbmd0aDogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGgvZW1pc3NpdmVTdHJlbmd0aCcsXG4gIGRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3I6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uL2RpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3InLFxuICBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3I6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uL2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvcicsXG4gIHRyYW5zbWlzc2lvbkZhY3RvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uL3RyYW5zbWlzc2lvbkZhY3RvcicsXG4gIHRoaWNrbmVzc0ZhY3RvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfdm9sdW1lL3RoaWNrbmVzc0ZhY3RvcicsXG4gIGF0dGVudWF0aW9uRGlzdGFuY2U6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX3ZvbHVtZS9hdHRlbnVhdGlvbkRpc3RhbmNlJyxcbiAgYXR0ZW51YXRpb25Db2xvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfdm9sdW1lL2F0dGVudWF0aW9uQ29sb3InLFxuICBkaXNwZXJzaW9uOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uL2Rpc3BlcnNpb24nLFxuICBpb3I6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2lvci9pb3InLFxuICBpcmlkZXNjZW5jZUZhY3RvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UvaXJpZGVzY2VuY2VGYWN0b3InLFxuICBpcmlkZXNjZW5jZUlvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UvaXJpZGVzY2VuY2VJb3InLFxuICBpcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW06ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlL2lyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bScsXG4gIGlyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bTogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UvaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtJyxcbiAgY2xlYXJjb2F0RmFjdG9yOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19jbGVhcmNvYXQvY2xlYXJjb2F0RmFjdG9yJyxcbiAgY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19jbGVhcmNvYXQvY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yJyxcbiAgY2xlYXJjb2F0Tm9ybWFsU2NhbGU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC9jbGVhcmNvYXROb3JtYWxUZXh0dXJlL3NjYWxlJyxcbiAgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVNjYWxlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19jbGVhcmNvYXQvY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS9zY2FsZScsXG4gIHNoZWVuQ29sb3JGYWN0b3I6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX3NoZWVuL3NoZWVuQ29sb3JGYWN0b3InLFxuICBzaGVlblJvdWdobmVzc0ZhY3RvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfc2hlZW4vc2hlZW5Sb3VnaG5lc3NGYWN0b3InLFxuICBzcGVjdWxhckZhY3RvcjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfc3BlY3VsYXIvc3BlY3VsYXJGYWN0b3InLFxuICBzcGVjdWxhckNvbG9yRmFjdG9yOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19zcGVjdWxhci9zcGVjdWxhckNvbG9yRmFjdG9yJyxcbiAgYW5pc290cm9weVN0cmVuZ3RoOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5L2FuaXNvdHJvcHlTdHJlbmd0aCcsXG4gIGFuaXNvdHJvcHlSb3RhdGlvbjogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfYW5pc290cm9weS9hbmlzb3Ryb3B5Um90YXRpb24nLFxuICBub3JtYWxTY2FsZTogJy9ub3JtYWxUZXh0dXJlL3NjYWxlJyxcbiAgb2NjbHVzaW9uU3RyZW5ndGg6ICcvb2NjbHVzaW9uVGV4dHVyZS9zdHJlbmd0aCcsXG59O1xuXG5jb25zdCBNQVRFUklBTF9URVhUVVJFX1BBVEhTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBiYXNlQ29sb3JUZXh0dXJlOiAnL3Bick1ldGFsbGljUm91Z2huZXNzL2Jhc2VDb2xvclRleHR1cmUnLFxuICBtZXRhbGxpY1JvdWdobmVzc1RleHR1cmU6ICcvcGJyTWV0YWxsaWNSb3VnaG5lc3MvbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlJyxcbiAgbm9ybWFsVGV4dHVyZTogJy9ub3JtYWxUZXh0dXJlJyxcbiAgb2NjbHVzaW9uVGV4dHVyZTogJy9vY2NsdXNpb25UZXh0dXJlJyxcbiAgZW1pc3NpdmVUZXh0dXJlOiAnL2VtaXNzaXZlVGV4dHVyZScsXG4gIGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi9kaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZScsXG4gIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uL2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUnLFxuICB0cmFuc21pc3Npb25UZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24vdHJhbnNtaXNzaW9uVGV4dHVyZScsXG4gIHRoaWNrbmVzc1RleHR1cmU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX3ZvbHVtZS90aGlja25lc3NUZXh0dXJlJyxcbiAgY2xlYXJjb2F0VGV4dHVyZTogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfY2xlYXJjb2F0L2NsZWFyY29hdFRleHR1cmUnLFxuICBjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19jbGVhcmNvYXQvY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZScsXG4gIGNsZWFyY29hdE5vcm1hbFRleHR1cmU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC9jbGVhcmNvYXROb3JtYWxUZXh0dXJlJyxcbiAgc2hlZW5Db2xvclRleHR1cmU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX3NoZWVuL3NoZWVuQ29sb3JUZXh0dXJlJyxcbiAgc2hlZW5Sb3VnaG5lc3NUZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19zaGVlbi9zaGVlblJvdWdobmVzc1RleHR1cmUnLFxuICBzcGVjdWxhclRleHR1cmU6ICcvZXh0ZW5zaW9ucy9LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyL3NwZWN1bGFyVGV4dHVyZScsXG4gIHNwZWN1bGFyQ29sb3JUZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19zcGVjdWxhci9zcGVjdWxhckNvbG9yVGV4dHVyZScsXG4gIGlyaWRlc2NlbmNlVGV4dHVyZTogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UvaXJpZGVzY2VuY2VUZXh0dXJlJyxcbiAgaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlOiAnL2V4dGVuc2lvbnMvS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS9pcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUnLFxuICBhbmlzb3Ryb3B5VGV4dHVyZTogJy9leHRlbnNpb25zL0tIUl9tYXRlcmlhbHNfYW5pc290cm9weS9hbmlzb3Ryb3B5VGV4dHVyZScsXG59O1xuXG5jb25zdCBMSUdIVF9QT0lOVEVSX1NVRkZJWF9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGxpZ2h0X2NvbG9yOiAnL2NvbG9yJyxcbiAgbGlnaHRfaW50ZW5zaXR5OiAnL2ludGVuc2l0eScsXG4gIGxpZ2h0X3JhbmdlOiAnL3JhbmdlJyxcbiAgbGlnaHRfc3BvdF9pbm5lckNvbmVBbmdsZTogJy9zcG90L2lubmVyQ29uZUFuZ2xlJyxcbiAgbGlnaHRfc3BvdF9vdXRlckNvbmVBbmdsZTogJy9zcG90L291dGVyQ29uZUFuZ2xlJyxcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0E7QUFBQSxFQU9FO0FBQUEsRUFLQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBRVAsU0FBUyxlQUFlO0FBR3hCLFNBQVMsMkJBQTJCO0FBRXBDLFNBQVMsWUFBWSxXQUFXLHdCQUF3QjtBQU14RCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGtCQUFrQjtBQUkzQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxjQUFjO0FBS3ZCLFNBQVMsdUJBQXVCO0FBQ2hDO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFJQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0s7QUFFQSxJQUFNLG9CQUFvQjtBQUMxQixJQUFNLG1CQUFtQjtBQUN6QixJQUFNLHFCQUFxQjtBQUMzQixJQUFNLHdCQUF3QjtBQUM5QixJQUFNLDJCQUEyQjtBQTJDakMsSUFBTSxnQkFBTixNQUFvQjtBQUFBLEVBQ2pCLGNBQWM7QUFBQSxFQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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RUFDbEIsMkJBQTJCO0FBQUEsRUFDM0Isd0JBQXdCO0FBQUEsRUFDeEIsbUJBQW1CO0FBQUEsRUFDbkIsdUJBQXVCO0FBQUEsRUFDdkIsaUJBQWlCO0FBQUEsRUFDakIsc0JBQXNCO0FBQUEsRUFDdEIsb0JBQW9CO0FBQUEsRUFDcEIsNkJBQTZCO0FBQUEsRUFDN0IsbUJBQW1CO0FBQ3JCO0FBRUEsSUFBTSwyQkFBbUQ7QUFBQSxFQUN2RCxhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixhQUFhO0FBQUEsRUFDYiwyQkFBMkI7QUFBQSxFQUMzQiwyQkFBMkI7QUFDN0I7IiwKICAibmFtZXMiOiBbIl9fY29sbGVjdEVudGl0aWVzIiwgIl9fbWF0ZXJpYWxUb0dsdGZNYXRlcmlhbEluZGljZXMiLCAiX19saWdodENvbXBvbmVudFRvTGlnaHRJbmRleCIsICJfX2NhbWVyYUNvbXBvbmVudFRvQ2FtZXJhSW5kZXgiLCAiX19leHBvcnRlZFBvaW50ZXJUYXJnZXRzQnlUcmFjayIsICJfX3dhcm5lZE1hdGVyaWFsU2VtYW50aWNzIiwgIl9fY3JlYXRlSnNvbkJhc2UiLCAiX19jcmVhdGVCdWZmZXJWaWV3c0FuZEFjY2Vzc29ycyIsICJfX2NyZWF0ZU5vZGVzIiwgIl9fY3JlYXRlTWF0ZXJpYWxzIiwgIl9fZXhwb3J0UmF5bWFyY2hpbmdNYXRlcmlhbHMiLCAiX19jcmVhdGVBbmltYXRpb25EYXRhIiwgIl9fY3JlYXRlQmluYXJ5IiwgIl9fZG93bmxvYWRHbGIiLCAiX19kb3dubG9hZEdsdGYiLCAidG9wTGV2ZWxFbnRpdGllcyIsICJjb2xsZWN0ZWRFbnRpdGllcyIsICJfX3Jlc29sdmVBbmltYXRpb25UYXJnZXQiLCAiX19lbnN1cmVFeHRlbnNpb25Vc2VkIiwgIl9fZXhwb3J0TGlnaHQiLCAiX19leHBvcnRSYXltYXJjaGluZyIsICJfX2Vuc3VyZUxpZ2h0c0V4dGVuc2lvbiIsICJfX3JlZ2lzdGVyTWF0ZXJpYWxJbmRleCIsICJfX3Nob3VsZEVtaXRQb2ludGVyVGFyZ2V0IiwgIl9fcmVzb2x2ZU1hdGVyaWFsQW5pbWF0aW9uVGFyZ2V0IiwgIl9fcmVzb2x2ZUxpZ2h0QW5pbWF0aW9uVGFyZ2V0IiwgIl9fcmVzb2x2ZUNhbWVyYUFuaW1hdGlvblRhcmdldCIsICJfX3Jlc29sdmVWaXNpYmlsaXR5QW5pbWF0aW9uVGFyZ2V0IiwgIl9fZmluZE1hdGVyaWFsSW5kaWNlc0ZvckFuaW1hdGVkVmFsdWUiLCAiX19sb2dVbnN1cHBvcnRlZE1hdGVyaWFsU2VtYW50aWMiLCAiX19nZXRNYXRlcmlhbFBvaW50ZXJTdWZmaXgiLCAiX19nZXRDYW1lcmFQb2ludGVyU3VmZml4IiwgIl9fcHJvY2Vzc01lc2hQcmltaXRpdmVzIiwgIl9fY3JlYXRlTWF0ZXJpYWxGcm9tUmhvZG9uaXRlIiwgIl9fZXhwb3J0TWF0ZXJpYWxWYXJpYW50cyIsICJfX2Vuc3VyZVZhcmlhbnRJbmRleCIsICJfX2Vuc3VyZU1hdGVyaWFsVmFyaWFudHNFeHRlbnNpb24iLCAiX19zZXR1cE5vZGVCYXNlZE1hdGVyaWFsRXh0ZW5zaW9uIiwgIl9fc2V0dXBNYXRlcmlhbCIsICJfX3Byb2Nlc3NOb2RlQmFzZWRNYXRlcmlhbFRleHR1cmVzIiwgIl9fZXhwb3J0UmF5bWFyY2hpbmdDb21wb25lbnRNYXRlcmlhbHMiLCAiX19leHBvcnRNYXRlcmlhbFVzZXJUZXh0dXJlcyIsICJfX3Byb2Nlc3NQYXJhbWV0ZXJzIl0KfQo=
