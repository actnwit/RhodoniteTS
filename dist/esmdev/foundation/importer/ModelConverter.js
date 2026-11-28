// src/foundation/importer/ModelConverter.ts
import {
  TagGltf2NodeIndex,
  TagKhrNodeVisibilityEnabled,
  TagKhrNodeVisibilityVisible
} from "../../types/glTF2.js";
import { AnimationComponent } from "../components/Animation/AnimationComponent.js";
import { AnimationStateComponent } from "../components/AnimationState/AnimationStateComponent.js";
import { BlendShapeComponent } from "../components/BlendShape/BlendShapeComponent.js";
import { createCameraEntity } from "../components/Camera/createCameraEntity.js";
import { createLightEntity } from "../components/Light/createLightEntity.js";
import { LightComponent } from "../components/Light/LightComponent.js";
import { MeshComponent } from "../components/Mesh/MeshComponent.js";
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { createGroupEntity } from "../components/SceneGraph/createGroupEntity.js";
import { SkeletalComponent } from "../components/Skeletal/SkeletalComponent.js";
import { AlphaMode } from "../definitions/AlphaMode.js";
import { AnimationInterpolation } from "../definitions/AnimationInterpolation.js";
import { BufferUse } from "../definitions/BufferUse.js";
import { CameraType } from "../definitions/CameraType.js";
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { LightType } from "../definitions/LightType.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { SdfShapeType } from "../definitions/SdfShapeType.js";
import { ShadingModel } from "../definitions/ShadingModel.js";
import { TextureParameter } from "../definitions/TextureParameter.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { attachLightShadowCamera } from "../helpers/EntityHelper.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { createPbrUberMaterial } from "../helpers/materials/createPbrUberMaterial.js";
import { AnimatedQuaternion } from "../math/AnimatedQuaternion.js";
import { AnimatedScalar } from "../math/AnimatedScalar.js";
import { AnimatedVector2 } from "../math/AnimatedVector2.js";
import { AnimatedVector3 } from "../math/AnimatedVector3.js";
import { AnimatedVector4 } from "../math/AnimatedVector4.js";
import { AnimatedVectorN } from "../math/AnimatedVectorN.js";
import { MathUtil } from "../math/MathUtil.js";
import { Matrix44 } from "../math/Matrix44.js";
import { MutableVector2 } from "../math/MutableVector2.js";
import { Quaternion } from "../math/Quaternion.js";
import { Scalar } from "../math/Scalar.js";
import { Vector2 } from "../math/Vector2.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Buffer } from "../memory/Buffer.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { Sampler } from "../textures/Sampler.js";
import { Texture } from "../textures/Texture.js";
import { detectBoneDataTypeForSkin } from "./BoneDataTypeDetector.js";
import { preloadKhrPhysicsSupport, setupKhrStaticColliders } from "./KhrPhysicsImporter.js";
import { RhodoniteImportExtension } from "./RhodoniteImportExtension.js";
var createMToon0xMaterialImpl;
var createMToon1MaterialImpl;
var raymarchingComponentClass;
var raymarchingComponentPromise;
var ModelConverter = class _ModelConverter {
  constructor() {
  }
  /**
   * Generates a group entity for the glTF model
   * @param gltfModel - The glTF model data
   * @returns A scene graph entity configured as a group
   */
  static dq(engine, gltfModel) {
    const entity = createGroupEntity(engine);
    this.addTags(entity, gltfModel);
    return entity;
  }
  /**
   * Adds source type and version tags to an entity based on the glTF model
   * @param entity - The entity to add tags to
   * @param gltfModel - The glTF model containing asset information
   */
  static addTags(entity, gltfModel) {
    entity.tryToSetTag({
      tag: "SourceType",
      value: gltfModel.asset.extras.fileType
    });
    entity.tryToSetTag({
      tag: "SourceTypeVersion",
      value: gltfModel.asset.extras.version
    });
  }
  /**
   * Generates a mesh entity for the glTF model
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data
   * @returns A mesh entity with appropriate tags
   */
  static qq(engine, gltfModel) {
    const entity = createMeshEntity(engine);
    this.addTags(entity, gltfModel);
    return entity;
  }
  /**
   * Generates a camera entity for the glTF model
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data
   * @returns A camera entity with appropriate tags
   */
  static rq(engine, gltfModel) {
    const entity = createCameraEntity(engine, true);
    this.addTags(entity, gltfModel);
    return entity;
  }
  /**
   * Generates a light entity for the glTF model
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data
   * @returns A light entity with appropriate tags
   */
  static sq(engine, gltfModel) {
    const entity = createLightEntity(engine);
    this.addTags(entity, gltfModel);
    return entity;
  }
  /**
   * Sets up materials from the glTF model
   * @param gltfModel - The glTF model data
   * @param rnTextures - Array of Rhodonite textures
   * @param rnSamplers - Array of Rhodonite samplers
   * @returns Array of configured Rhodonite materials
   */
  static hq(engine, gltfModel, rnTextures, rnSamplers) {
    const rnMaterials = [];
    if (gltfModel.materials != null) {
      for (const material of gltfModel.materials) {
        const rnMaterial = this.wk(engine, gltfModel, rnTextures, rnSamplers, material);
        rnMaterials.push(rnMaterial);
      }
    }
    return rnMaterials;
  }
  /**
   * Loads the MToon material implementations only when the model actually uses VRM materials.
   * This keeps the MToon material contents and shaders out of plain glTF applications.
   *
   * @param gltfModel - The glTF model data to inspect
   * @internal
   */
  static async tq(gltfModel) {
    var _a;
    const materials = (_a = gltfModel.materials) != null ? _a : [];
    const needsMToon1 = materials.some((material) => {
      var _a2;
      return ((_a2 = material.extensions) == null ? void 0 : _a2.VRMC_materials_mtoon) != null;
    });
    const needsMToon0x = materials.some((material) => {
      var _a2;
      const materialProperties = (_a2 = material.extras) == null ? void 0 : _a2.vrm0xMaterialProperty;
      return (materialProperties == null ? void 0 : materialProperties.shader) === "VRM/MToon";
    });
    const loads = [];
    if (needsMToon1 && createMToon1MaterialImpl == null) {
      loads.push(
        import("../helpers/materials/createMToon1Material.js").then((module) => {
          createMToon1MaterialImpl = module.createMToon1Material;
        })
      );
    }
    if (needsMToon0x && createMToon0xMaterialImpl == null) {
      loads.push(
        import("../helpers/materials/createMToon0xMaterial.js").then((module) => {
          createMToon0xMaterialImpl = module.createMToon0xMaterial;
        })
      );
    }
    await Promise.all(loads);
  }
  /**
   * Loads the raymarching component only when a node uses the RHODONITE_raymarching extension.
   *
   * @param gltfModel - The glTF model data to inspect
   * @internal
   */
  static async preloadRaymarchingSupport(gltfModel) {
    var _a;
    const usesRaymarching = ((_a = gltfModel.nodes) != null ? _a : []).some((node) => {
      const extensions = node.extensions;
      return (extensions == null ? void 0 : extensions.RHODONITE_raymarching) != null;
    });
    if (!usesRaymarching || raymarchingComponentClass != null) {
      return;
    }
    if (raymarchingComponentPromise == null) {
      raymarchingComponentPromise = import("../components/Raymarching/RaymarchingComponent.js").then((module) => {
        raymarchingComponentClass = module.RaymarchingComponent;
      });
    }
    await raymarchingComponentPromise;
  }
  /**
   * Loads the sheen LUT before materials are created when the model uses KHR_materials_sheen.
   *
   * A WebGPU bind group created while the LUT texture has no GPU resource keeps the placeholder binding, so
   * the importer waits for the texture instead of relying on the lazy background load in the material factory.
   *
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data to inspect
   * @internal
   */
  static async uq(engine, gltfModel) {
    var _a;
    const materials = (_a = gltfModel.materials) != null ? _a : [];
    const usesSheen = materials.some((material) => {
      var _a2;
      return ((_a2 = material.extensions) == null ? void 0 : _a2.KHR_materials_sheen) != null;
    });
    if (!usesSheen) {
      return;
    }
    try {
      await engine.dummyTextures.loadSheenLutTexture();
    } catch (error) {
      Logger.default.warn(`Failed to load the sheen LUT texture: ${error}`);
    }
  }
  /**
   * Sets up textures from the glTF model asynchronously
   * @param gltfModel - The glTF model data
   * @returns Promise resolving to array of Rhodonite textures
   */
  static async vq(engine, gltfModel) {
    const rnTextures = [];
    if (gltfModel.images != null) {
      for (const image of gltfModel.images) {
        const rnTexture = await this._createTexture(engine, image, gltfModel);
        rnTextures.push(rnTexture);
      }
    }
    return rnTextures;
  }
  /**
   * Creates samplers from the glTF model
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data
   * @returns Array of Rhodonite samplers
   */
  static wq(engine, gltfModel) {
    const rnSamplers = [];
    if (gltfModel.samplers != null) {
      for (const sampler of gltfModel.samplers) {
        const rnSampler = this._createSampler(engine, sampler);
        rnSamplers.push(rnSampler);
      }
    }
    return rnSamplers;
  }
  /**
   * Converts a glTF model to Rhodonite objects synchronously (without texture loading)
   * @param gltfModel - The glTF model data to convert
   * @returns The root group entity containing the converted scene
   */
  static convertToRhodoniteObjectSimple(engine, gltfModel) {
    gltfModel.asset.extras.rnMeshesAtGltMeshIdx = [];
    const rnBuffers = this.iq(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = [];
    const rnSamplers = [];
    const rnMaterials = this.hq(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.jq(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.dq(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.kq(gltfModel, rnEntities);
    if (gltfModel.scenes[0].nodes) {
      for (const nodesIndex of gltfModel.scenes[0].nodes) {
        const sg = rnEntities[nodesIndex].getSceneGraph();
        rootGroup.getSceneGraph().addChild(sg);
      }
    }
    if (Is.not.exist(gltfModel.extras)) {
      gltfModel.extras = {};
    }
    gltfModel.extras.rnEntities = rnEntities;
    gltfModel.extras.rnEntitiesByNames = rnEntitiesByNames;
    return rootGroup;
  }
  /**
   * Converts a glTF model to Rhodonite objects asynchronously (with full texture loading)
   * @param gltfModel - The glTF model data to convert
   * @returns Promise resolving to the root group entity containing the converted scene
   */
  static async convertToRhodoniteObject(engine, gltfModel) {
    var _a, _b;
    gltfModel.asset.extras.rnMeshesAtGltMeshIdx = [];
    const rnBuffers = this.iq(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = await this.vq(engine, gltfModel);
    const rnSamplers = this.wq(engine, gltfModel);
    await this.tq(gltfModel);
    await RhodoniteImportExtension.preloadNodeBasedMaterialSupport(gltfModel);
    await this.preloadRaymarchingSupport(gltfModel);
    await this.uq(engine, gltfModel);
    const rnMaterials = this.hq(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.jq(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.dq(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    await preloadKhrPhysicsSupport(gltfModel);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.kq(gltfModel, rnEntities);
    rootGroup.tryToSetUniqueName("FileRoot", true);
    rootGroup.tryToSetTag({ tag: "ObjectType", value: "top" });
    if (gltfModel.scenes[0].nodes) {
      for (const nodesIndex of gltfModel.scenes[0].nodes) {
        const sg = rnEntities[nodesIndex].getSceneGraph();
        rootGroup.getSceneGraph().addChild(sg);
      }
    }
    if ((_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) {
      const options = gltfModel.asset.extras.rnLoaderOptions;
      if ((_b = options == null ? void 0 : options.loaderExtension) == null ? void 0 : _b.loadExtensionInfoAndSetToRootGroup) {
        options.loaderExtension.loadExtensionInfoAndSetToRootGroup(rootGroup, gltfModel);
      }
      if (options == null ? void 0 : options.expression) {
        options.expression.tryToSetTag({
          tag: "gltfModel",
          value: gltfModel
        });
      }
    }
    rootGroup.tryToSetTag({ tag: "rnEntities", value: rnEntities });
    rootGroup.tryToSetTag({ tag: "rnEntitiesByNames", value: rnEntitiesByNames });
    rootGroup.tryToSetTag({ tag: "gltfModel", value: gltfModel });
    if (Is.not.exist(gltfModel.extras)) {
      gltfModel.extras = {};
    }
    gltfModel.extras.rnEntities = rnEntities;
    gltfModel.extras.rnEntitiesByNames = rnEntitiesByNames;
    RhodoniteImportExtension.importEffect(rootGroup.engine, gltfModel, rootGroup);
    RhodoniteImportExtension.importBillboard(gltfModel, rnEntities);
    if (Is.exist(gltfModel.extensionsUsed)) {
      if (gltfModel.extensionsUsed.indexOf("VRMC_vrm") > 0) {
      }
    }
    return rootGroup;
  }
  /**
   * Creates Rhodonite buffers from glTF buffer data
   * @param gltfModel - The glTF model containing buffer data
   * @returns Array of Rhodonite Buffer objects
   */
  static iq(gltfModel) {
    var _a;
    const rnBuffers = [];
    for (const buffer of (_a = gltfModel.buffers) != null ? _a : []) {
      const rnBuffer = new Buffer({
        byteLength: buffer.byteLength,
        buffer: buffer.buffer,
        name: `gltf2Buffer_0_(${buffer.uri})`,
        byteAlign: 4,
        bufferUsage: BufferUse.CPUGeneric,
        indexOfTheBufferUsage: 0
      });
      rnBuffers.push(rnBuffer);
    }
    return rnBuffers;
  }
  /**
   * Sets up transform properties for entities from glTF node data
   * @param gltfModel - The glTF model data
   * @param groups - Array of scene graph entities to apply transforms to
   */
  static _setupTransform(gltfModel, groups) {
    for (const node_i in gltfModel.nodes) {
      const group = groups[node_i];
      const nodeJson = gltfModel.nodes[node_i];
      const groupTransform = group.getTransform();
      if (nodeJson.translation) {
        groupTransform.localPosition = Vector3.fromCopyArray([
          nodeJson.translation[0],
          nodeJson.translation[1],
          nodeJson.translation[2]
        ]);
      }
      if (nodeJson.scale) {
        groupTransform.localScale = Vector3.fromCopyArray([nodeJson.scale[0], nodeJson.scale[1], nodeJson.scale[2]]);
      }
      if (nodeJson.rotation) {
        groupTransform.localRotation = Quaternion.fromCopy4(
          nodeJson.rotation[0],
          nodeJson.rotation[1],
          nodeJson.rotation[2],
          nodeJson.rotation[3]
        );
      }
      if (nodeJson.matrix) {
        groupTransform.localMatrix = Matrix44.fromCopyArrayColumnMajor(nodeJson.matrix);
      }
    }
  }
  /**
   * Sets up the hierarchy relationships between entities based on glTF node structure
   * @param gltfModel - The glTF model data
   * @param rnEntities - Array of Rhodonite entities to organize in hierarchy
   */
  static _setupHierarchy(gltfModel, rnEntities) {
    const groupSceneComponents = rnEntities.map((group) => {
      return group.getSceneGraph();
    });
    for (const node_i in gltfModel.nodes) {
      const parentNode_i = Number.parseInt(node_i, 10);
      const glTF2ParentNode = gltfModel.nodes[parentNode_i];
      if (Is.exist(glTF2ParentNode.children)) {
        const rnParentSceneGraphComponent = groupSceneComponents[parentNode_i];
        for (const childNode_i of glTF2ParentNode.children) {
          const rnChildSceneGraphComponent = groupSceneComponents[childNode_i];
          rnParentSceneGraphComponent.addChild(rnChildSceneGraphComponent);
        }
      }
    }
  }
  static kq(gltfModel, rnEntities) {
    var _a, _b, _c;
    const visitedNodeIndices = /* @__PURE__ */ new Set();
    const sceneRootNodeIndices = (_c = (_b = (_a = gltfModel.scenes) == null ? void 0 : _a[0]) == null ? void 0 : _b.nodes) != null ? _c : [];
    for (const nodeIndex of sceneRootNodeIndices) {
      this.eq(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
    }
    for (const nodeIndexString in gltfModel.nodes) {
      const nodeIndex = Number.parseInt(nodeIndexString, 10);
      if (!visitedNodeIndices.has(nodeIndex)) {
        this.eq(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
      }
    }
  }
  static eq(gltfModel, rnEntities, nodeIndex, parentVisible, visitedNodeIndices) {
    var _a, _b;
    if (visitedNodeIndices.has(nodeIndex)) {
      return;
    }
    visitedNodeIndices.add(nodeIndex);
    const node = gltfModel.nodes[nodeIndex];
    const entity = rnEntities[nodeIndex];
    if (Is.not.exist(node) || Is.not.exist(entity)) {
      return;
    }
    const localVisible = this.xq(node);
    entity.tryToSetTag({ tag: TagKhrNodeVisibilityVisible, value: localVisible });
    if (Is.exist((_a = node.extensions) == null ? void 0 : _a.KHR_node_visibility)) {
      entity.tryToSetTag({ tag: TagKhrNodeVisibilityEnabled, value: true });
    }
    entity.getSceneGraph().isVisible = parentVisible && localVisible;
    for (const childNodeIndex of (_b = node.children) != null ? _b : []) {
      this.eq(
        gltfModel,
        rnEntities,
        childNodeIndex,
        parentVisible && localVisible,
        visitedNodeIndices
      );
    }
  }
  static xq(node) {
    var _a, _b;
    const extension = (_a = node.extensions) == null ? void 0 : _a.KHR_node_visibility;
    return (_b = extension == null ? void 0 : extension.visible) != null ? _b : true;
  }
  /**
   * Sets up animation data from glTF animations
   * @param gltfModel - The glTF model data
   * @param rnEntities - Array of Rhodonite entities
   * @param rnBuffers - Array of Rhodonite buffers
   * @param rootGroup - The root group entity
   * @param rnMaterials - Array of Rhodonite materials
   * @internal
   */
  static _setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials) {
    var _a;
    if (gltfModel.animations == null || gltfModel.animations.length === 0) {
      return;
    }
    rootGroup.engine.entityRepository.addComponentToEntity(AnimationStateComponent, rootGroup);
    for (const animation of gltfModel.animations) {
      for (const sampler of animation.samplers) {
        this._readBinaryFromAccessorAndSetItToAccessorExtras(engine, sampler.inputObject, rnBuffers);
        this._readBinaryFromAccessorAndSetItToAccessorExtras(engine, sampler.outputObject, rnBuffers);
      }
    }
    for (const animation of gltfModel.animations) {
      for (const channel of animation.channels) {
        if (Is.exist(channel.samplerObject)) {
          const samplerObject = channel.samplerObject;
          const animInputArray = samplerObject.inputObject.extras.typedDataArray;
          const animOutputArray = samplerObject.outputObject.extras.typedDataArray;
          const interpolation = (_a = samplerObject.interpolation) != null ? _a : "LINEAR";
          let animationAttributeType = "undefined";
          if (channel.target.path === "translation") {
            animationAttributeType = "translate";
          } else if (channel.target.path === "rotation") {
            animationAttributeType = "quaternion";
          } else if (channel.target.path === "pointer") {
            animationAttributeType = "material/";
          } else {
            animationAttributeType = channel.target.path;
          }
          if (channel.target.path === "pointer") {
            _ModelConverter.yq(
              rnEntities,
              channel,
              samplerObject,
              animation,
              animInputArray,
              animOutputArray,
              interpolation,
              animationAttributeType,
              rnMaterials,
              gltfModel
            );
          } else {
            _ModelConverter.zq(
              rnEntities,
              channel,
              samplerObject,
              animation,
              animInputArray,
              animOutputArray,
              interpolation,
              animationAttributeType
            );
          }
        }
      }
    }
  }
  /**
   * Sets up pointer-based animation for materials, nodes, lights, and cameras
   * @param rnEntities - Array of Rhodonite entities
   * @param channel - Animation channel data
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   * @param rnMaterials - Array of Rhodonite materials
   * @param gltfModel - The glTF model data
   */
  static yq(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType, rnMaterials, gltfModel) {
    const pointer = channel.target.extensions.KHR_animation_pointer.pointer;
    const matchNodes = pointer.match(/^\/nodes\/([0-9]+)\//);
    const matchMaterials = pointer.match(/^\/materials\/([0-9]+)\//);
    const matchLights = pointer.match(/^\/extensions\/KHR_lights_punctual\/lights\/([0-9]+)\//);
    const matchCameras = pointer.match(/^\/cameras\/([0-9]+)\//);
    if (matchMaterials) {
      _ModelConverter.Aq(
        matchMaterials,
        rnMaterials,
        pointer,
        samplerObject,
        animation,
        animInputArray,
        animOutputArray,
        interpolation,
        animationAttributeType
      );
    } else if (matchNodes) {
      _ModelConverter.Bq(
        matchNodes,
        rnEntities,
        pointer,
        samplerObject,
        animation,
        animInputArray,
        animOutputArray,
        interpolation,
        animationAttributeType
      );
    } else if (matchLights) {
      _ModelConverter.Cq(
        matchLights,
        rnEntities,
        pointer,
        samplerObject,
        animation,
        animInputArray,
        animOutputArray,
        interpolation,
        animationAttributeType,
        gltfModel
      );
    } else if (matchCameras) {
      _ModelConverter.Dq(
        matchCameras,
        rnEntities,
        pointer,
        samplerObject,
        animation,
        animInputArray,
        animOutputArray,
        interpolation,
        animationAttributeType,
        gltfModel
      );
    } else {
      Logger.default.info("Not Supported Animation Pointer Type");
    }
  }
  /**
   * Sets up pointer animation for camera properties
   * @param match - Regex match result containing camera index
   * @param rnEntities - Array of Rhodonite entities
   * @param pointer - Animation pointer string
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   * @param gltfModel - The glTF model data
   */
  static Dq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
    const cameraIndex = Number.parseInt(match[1], 10);
    const nodes = gltfModel.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.camera === cameraIndex) {
        const rnEntity = rnEntities[i];
        const cameraComponent = rnEntity.tryToGetCamera();
        if (Is.not.exist(cameraComponent)) {
          throw new Error(`CameraComponent not found: ${pointer}`);
        }
        const outputComponentN = samplerObject.outputObject.extras.componentN;
        const animationSamplers = /* @__PURE__ */ new Map();
        const trackName = Is.exist(animation.name) ? animation.name : "Untitled_Animation";
        const animationSampler = {
          input: animInputArray,
          output: animOutputArray,
          outputComponentN,
          interpolationMethod: AnimationInterpolation.fromString(interpolation)
        };
        animationSamplers.set(trackName, animationSampler);
        let animatedValue;
        if (outputComponentN === 1) {
          animatedValue = new AnimatedScalar(animationSamplers, trackName);
        } else if (outputComponentN === 2) {
          animatedValue = new AnimatedVector2(animationSamplers, trackName);
        } else if (outputComponentN === 3) {
          animatedValue = new AnimatedVector3(animationSamplers, trackName);
        } else if (outputComponentN === 4) {
          animatedValue = new AnimatedVector4(animationSamplers, trackName);
        } else {
          throw new Error(`Unsupported component number: ${outputComponentN}`);
        }
        let animationComponent = rnEntity.tryToGetAnimation();
        if (Is.not.exist(animationComponent)) {
          const newRnEntity = rnEntity.engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
          animationComponent = newRnEntity.getAnimation();
        }
        if (pointer.includes("znear")) {
          animationComponent.setAnimation("camera_znear", animatedValue);
        } else if (pointer.includes("zfar")) {
          animationComponent.setAnimation("camera_zfar", animatedValue);
        } else if (pointer.includes("yfov")) {
          animationComponent.setAnimation("camera_fovy", animatedValue);
        } else if (pointer.includes("xmag")) {
          animationComponent.setAnimation("camera_xmag", animatedValue);
        } else if (pointer.includes("ymag")) {
          animationComponent.setAnimation("camera_ymag", animatedValue);
        }
      }
    }
  }
  /**
   * Sets up pointer animation for light properties
   * @param match - Regex match result containing light index
   * @param rnEntities - Array of Rhodonite entities
   * @param pointer - Animation pointer string
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   * @param gltfModel - The glTF model data
   */
  static Cq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
    var _a;
    const lightIndex = Number.parseInt(match[1], 10);
    const nodes = gltfModel.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if ((_a = node.extensions) == null ? void 0 : _a.KHR_lights_punctual) {
        const lightIdx = node.extensions.KHR_lights_punctual.lightIndex;
        if (lightIdx === lightIndex) {
          const rnEntity = rnEntities[i];
          const lightComponent = rnEntity.tryToGetLight();
          if (Is.not.exist(lightComponent)) {
            throw new Error(`LightComponent not found: ${pointer}`);
          }
          const outputComponentN = samplerObject.outputObject.extras.componentN;
          const animationSamplers = /* @__PURE__ */ new Map();
          const trackName = Is.exist(animation.name) ? animation.name : "Untitled_Animation";
          const animationSampler = {
            input: animInputArray,
            output: animOutputArray,
            outputComponentN,
            interpolationMethod: AnimationInterpolation.fromString(interpolation)
          };
          animationSamplers.set(trackName, animationSampler);
          let animatedValue;
          if (outputComponentN === 1) {
            animatedValue = new AnimatedScalar(animationSamplers, trackName);
          } else if (outputComponentN === 2) {
            animatedValue = new AnimatedVector2(animationSamplers, trackName);
          } else if (outputComponentN === 3) {
            animatedValue = new AnimatedVector3(animationSamplers, trackName);
          } else if (outputComponentN === 4) {
            animatedValue = new AnimatedVector4(animationSamplers, trackName);
          } else {
            throw new Error(`Unsupported component number: ${outputComponentN}`);
          }
          let animationComponent = rnEntity.tryToGetAnimation();
          if (Is.not.exist(animationComponent)) {
            const newRnEntity = rnEntity.engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
            animationComponent = newRnEntity.getAnimation();
          }
          if (pointer.includes("color")) {
            animationComponent.setAnimation("light_color", animatedValue);
          } else if (pointer.includes("intensity")) {
            animationComponent.setAnimation("light_intensity", animatedValue);
          } else if (pointer.includes("range")) {
            animationComponent.setAnimation("light_range", animatedValue);
          } else if (pointer.includes("spot/innerConeAngle")) {
            animationComponent.setAnimation("light_spot_innerConeAngle", animatedValue);
          } else if (pointer.includes("spot/outerConeAngle")) {
            animationComponent.setAnimation("light_spot_outerConeAngle", animatedValue);
          }
        }
      }
    }
  }
  /**
   * Sets up pointer animation for node properties (transform, weights)
   * @param match - Regex match result containing node index
   * @param rnEntities - Array of Rhodonite entities
   * @param pointer - Animation pointer string
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   */
  static Bq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
    const nodeIndex = Number.parseInt(match[1], 10);
    const rnEntity = rnEntities[nodeIndex];
    if (Is.not.exist(rnEntity)) {
      throw new Error(`Node not found: ${pointer}`);
    }
    let outputComponentN = samplerObject.outputObject.extras.componentN;
    if (pointer.includes("weights")) {
      const blendShapeComponent = rnEntity.tryToGetBlendShape();
      if (Is.exist(blendShapeComponent)) {
        outputComponentN = blendShapeComponent.weights.length;
      } else {
        throw new Error(`BlendShapeComponent not found: ${pointer}`);
      }
    }
    const animationSamplers = /* @__PURE__ */ new Map();
    const trackName = Is.exist(animation.name) ? animation.name : "Untitled_Animation";
    const animationSampler = {
      input: animInputArray,
      output: animOutputArray,
      outputComponentN,
      interpolationMethod: AnimationInterpolation.fromString(interpolation)
    };
    animationSamplers.set(trackName, animationSampler);
    let animatedValue;
    if (pointer.includes("weights")) {
      animatedValue = new AnimatedVectorN(animationSamplers, trackName);
    } else if (outputComponentN === 1) {
      animatedValue = new AnimatedScalar(animationSamplers, trackName);
    } else if (outputComponentN === 2) {
      animatedValue = new AnimatedVector2(animationSamplers, trackName);
    } else if (outputComponentN === 3) {
      animatedValue = new AnimatedVector3(animationSamplers, trackName);
    } else if (outputComponentN === 4) {
      animatedValue = new AnimatedVector4(animationSamplers, trackName);
    } else {
      throw new Error(`Unsupported component number: ${outputComponentN}`);
    }
    let animationComponent = rnEntity.tryToGetAnimation();
    if (Is.not.exist(animationComponent)) {
      const newRnEntity = rnEntity.engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
      animationComponent = newRnEntity.getAnimation();
    }
    if (pointer.includes("rotation")) {
      animationComponent.setAnimation("quaternion", animatedValue);
    } else if (pointer.includes("translation")) {
      animationComponent.setAnimation("translate", animatedValue);
    } else if (pointer.includes("scale")) {
      animationComponent.setAnimation("scale", animatedValue);
    } else if (pointer.includes("weights")) {
      animationComponent.setAnimation("weights", animatedValue);
    } else if (pointer.includes("KHR_node_visibility/visible")) {
      rnEntity.tryToSetTag({ tag: TagKhrNodeVisibilityEnabled, value: true });
      animationComponent.setAnimation("visibility", animatedValue);
    }
  }
  /**
   * Sets up pointer animation for material properties
   * @param match - Regex match result containing material index
   * @param rnMaterials - Array of Rhodonite materials
   * @param pointer - Animation pointer string
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   */
  static Aq(match, rnMaterials, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
    const materialIndex = Number.parseInt(match[1], 10);
    const material = rnMaterials[materialIndex];
    if (Is.not.exist(material)) {
      throw new Error(`Material not found: ${pointer}`);
    }
    const outputComponentN = samplerObject.outputObject.extras.componentN;
    const animationSamplers = /* @__PURE__ */ new Map();
    const trackName = Is.exist(animation.name) ? animation.name : "Untitled_Animation";
    const animationSampler = {
      input: animInputArray,
      output: animOutputArray,
      outputComponentN,
      interpolationMethod: AnimationInterpolation.fromString(interpolation)
    };
    animationSamplers.set(trackName, animationSampler);
    let animatedValue;
    if (outputComponentN === 1) {
      animatedValue = new AnimatedScalar(animationSamplers, trackName);
    } else if (outputComponentN === 2) {
      animatedValue = new AnimatedVector2(animationSamplers, trackName);
    } else if (outputComponentN === 3) {
      animatedValue = new AnimatedVector3(animationSamplers, trackName);
    } else if (outputComponentN === 4) {
      animatedValue = new AnimatedVector4(animationSamplers, trackName);
    } else {
      throw new Error(`Unsupported component number: ${outputComponentN}`);
    }
    let shaderSemanticName = "";
    if (pointer.includes("KHR_texture_transform")) {
      const split = pointer.split("/");
      const textureName = split[split.length - 4];
      const transformType = split[split.length - 1];
      const capitalizedTransformType = transformType.charAt(0).toUpperCase() + transformType.slice(1);
      shaderSemanticName = `${textureName}Transform${capitalizedTransformType}`;
    } else if (pointer.includes("normalTexture/scale")) {
      shaderSemanticName = "normalScale";
    } else if (pointer.includes("occlusionTexture/strength")) {
      shaderSemanticName = "occlusionStrength";
    } else {
      shaderSemanticName = pointer.split("/").pop();
    }
    material.setParameter(shaderSemanticName, animatedValue);
    const primitives = material.getBelongPrimitives();
    for (const primitive of primitives.values()) {
      if (Is.exist(primitive.mesh)) {
        const mesh = primitive.mesh;
        const meshEntities = mesh.meshEntitiesInner;
        for (const rnEntity of meshEntities) {
          let animationComponent = rnEntity.tryToGetAnimation();
          if (Is.not.exist(animationComponent)) {
            const newRnEntity = rnEntity.engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
            animationComponent = newRnEntity.getAnimation();
          }
          animationComponent.setAnimation(`material/${shaderSemanticName}`, animatedValue);
        }
      }
    }
  }
  /**
   * Sets up standard animation (non-pointer based) for transform properties
   * @param rnEntities - Array of Rhodonite entities
   * @param channel - Animation channel data
   * @param samplerObject - Animation sampler object
   * @param animation - Animation data
   * @param animInputArray - Input time values
   * @param animOutputArray - Output animation values
   * @param interpolation - Interpolation method
   * @param animationAttributeType - Type of animation attribute
   */
  static zq(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType) {
    const rnEntity = rnEntities[channel.target.node];
    if (Is.exist(rnEntity)) {
      let animationComponent = rnEntity.tryToGetAnimation();
      if (Is.not.exist(animationComponent)) {
        const newRnEntity = rnEntity.engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
        animationComponent = newRnEntity.getAnimation();
      }
      if (Is.exist(animationComponent)) {
        const outputComponentN = samplerObject.outputObject.extras.componentN;
        const animationSamplers = /* @__PURE__ */ new Map();
        const trackName = Is.exist(animation.name) ? animation.name : "Untitled_Animation";
        const animationSampler = {
          input: animInputArray,
          output: animOutputArray,
          outputComponentN,
          interpolationMethod: AnimationInterpolation.fromString(interpolation)
        };
        animationSamplers.set(trackName, animationSampler);
        if (animationAttributeType === "translate") {
          const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
          animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
        } else if (animationAttributeType === "quaternion") {
          const newAnimatedValue = new AnimatedQuaternion(animationSamplers, trackName);
          animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
        } else if (animationAttributeType === "scale") {
          const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
          animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
        } else {
          const newAnimatedValue = new AnimatedVectorN(animationSamplers, trackName);
          animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
        }
      }
    }
  }
  /**
   * Sets up skeletal animation and joint hierarchies from glTF skin data
   * @param gltfModel - The glTF model data
   * @param rnEntities - Array of Rhodonite entities
   * @param rnBuffers - Array of Rhodonite buffers
   */
  static _setupSkeleton(engine, gltfModel, rnEntities, rnBuffers) {
    var _a, _b;
    if (gltfModel.skins == null) {
      return;
    }
    const forcedBoneDataType = (_b = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) == null ? void 0 : _b.boneDataType;
    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[node_i];
      const _sg = rnEntities[node_i].getSceneGraph();
      let skeletalComponent;
      if (Is.exist(node.skinObject)) {
        const rnEntity = rnEntities[node_i];
        const newRnEntity = engine.entityRepository.addComponentToEntity(SkeletalComponent, rnEntity);
        skeletalComponent = newRnEntity.getSkeletal();
        const inverseBindMatAccessor = node.skinObject.inverseBindMatricesObject;
        const rnAccessorOfInverseBindMat = Is.exist(inverseBindMatAccessor) ? this.aq(engine, inverseBindMatAccessor, rnBuffers) : void 0;
        if (forcedBoneDataType != null) {
          skeletalComponent.setBoneDataType(forcedBoneDataType);
        } else {
          const isAutoSelected = true;
          skeletalComponent.setBoneDataType(
            detectBoneDataTypeForSkin(
              gltfModel,
              node.skinObject,
              Number(node_i),
              rnAccessorOfInverseBindMat == null ? void 0 : rnAccessorOfInverseBindMat.getTypedArray()
            ),
            isAutoSelected
          );
        }
        if (Is.exist(node.skinObject.bindShapeMatrix)) {
          skeletalComponent._bindShapeMatrix = Matrix44.fromCopyArrayColumnMajor(node.skinObject.bindShapeMatrix);
        }
        for (const joint_i of node.skinObject.joints) {
          const sg = rnEntities[joint_i].getSceneGraph();
          sg.jointIndex = joint_i;
        }
        const joints = node.skinObject.joints.map((i) => rnEntities[i].getSceneGraph());
        skeletalComponent.setJoints(joints);
        const skeletonRoot = Is.exist(node.skinObject.skeleton) ? rnEntities[node.skinObject.skeleton].getSceneGraph() : this.Eq(joints);
        skeletalComponent.topOfJointsHierarchy = skeletonRoot != null ? skeletonRoot : joints[0];
        if (skeletonRoot != null) {
          skeletonRoot.isRootJoint = true;
        }
        if (Is.exist(rnAccessorOfInverseBindMat)) {
          skeletalComponent.setInverseBindMatricesAccessor(rnAccessorOfInverseBindMat);
        }
      }
    }
  }
  /**
   * Returns the lowest common ancestor of the given joints in the scene graph.
   * glTF's `skin.skeleton` is optional; when it is omitted, the common root of the
   * joints is the root of the skin's joint hierarchy.
   */
  static Eq(joints) {
    if (joints.length === 0) {
      return void 0;
    }
    const ancestorChain = /* @__PURE__ */ new Set();
    let current = joints[0];
    while (current != null) {
      ancestorChain.add(current);
      current = current.parent;
    }
    let common = joints[0];
    for (let i = 1; i < joints.length; i++) {
      let node = joints[i];
      while (node != null && !ancestorChain.has(node)) {
        node = node.parent;
      }
      if (node == null) {
        return void 0;
      }
      if (node !== common) {
        common = node;
        ancestorChain.clear();
        let ancestor = common;
        while (ancestor != null) {
          ancestorChain.add(ancestor);
          ancestor = ancestor.parent;
        }
      }
    }
    return common;
  }
  /**
   * Generates smooth vertex normals for primitives that have no NORMAL attribute.
   * glTF requires implementations to calculate normals when they are absent; without
   * them lit materials receive a zero normal and shade incorrectly (black or NaN).
   */
  static Fq(engine, primitive, indicesAccessor) {
    if (Is.exist(primitive.getAttribute(VertexAttribute.Normal.XYZ))) {
      return;
    }
    const mode = primitive.primitiveMode;
    if (mode !== PrimitiveMode.Triangles && mode !== PrimitiveMode.TriangleStrip && mode !== PrimitiveMode.TriangleFan) {
      return;
    }
    const positionAccessor = primitive.getAttribute(VertexAttribute.Position.XYZ);
    if (!Is.exist(positionAccessor)) {
      return;
    }
    const vertexCount = positionAccessor.elementCount;
    if (vertexCount === 0) {
      return;
    }
    const normals = new Float32Array(vertexCount * 3);
    const indexCount = indicesAccessor != null ? indicesAccessor.elementCount : vertexCount;
    const getVertexIndex = (i) => indicesAccessor != null ? indicesAccessor.getScalar(i, {}) : i;
    const accumulateTriangle = (ia, ib, ic) => {
      const a = positionAccessor.getVec3(ia, {});
      const b = positionAccessor.getVec3(ib, {});
      const c = positionAccessor.getVec3(ic, {});
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const abz = b.z - a.z;
      const acx = c.x - a.x;
      const acy = c.y - a.y;
      const acz = c.z - a.z;
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      for (const index of [ia, ib, ic]) {
        normals[index * 3] += nx;
        normals[index * 3 + 1] += ny;
        normals[index * 3 + 2] += nz;
      }
    };
    if (mode === PrimitiveMode.Triangles) {
      for (let i = 0; i + 2 < indexCount; i += 3) {
        accumulateTriangle(getVertexIndex(i), getVertexIndex(i + 1), getVertexIndex(i + 2));
      }
    } else if (mode === PrimitiveMode.TriangleStrip) {
      for (let i = 0; i + 2 < indexCount; i++) {
        if (i % 2 === 0) {
          accumulateTriangle(getVertexIndex(i), getVertexIndex(i + 1), getVertexIndex(i + 2));
        } else {
          accumulateTriangle(getVertexIndex(i + 1), getVertexIndex(i), getVertexIndex(i + 2));
        }
      }
    } else {
      for (let i = 1; i + 1 < indexCount; i++) {
        accumulateTriangle(getVertexIndex(0), getVertexIndex(i), getVertexIndex(i + 1));
      }
    }
    const byteLength = vertexCount * 3 * 4;
    const buffer = engine.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, byteLength, 4);
    const bufferView = buffer.takeBufferView({ byteLengthToNeed: byteLength, byteStride: 0 }).unwrapForce();
    const normalAccessor = bufferView.takeAccessor({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      count: vertexCount
    }).unwrapForce();
    for (let i = 0; i < vertexCount; i++) {
      let x = normals[i * 3];
      let y = normals[i * 3 + 1];
      let z = normals[i * 3 + 2];
      const length = Math.hypot(x, y, z);
      if (length > 0) {
        x /= length;
        y /= length;
        z /= length;
      } else {
        x = 0;
        y = 1;
        z = 0;
      }
      normalAccessor.setVec3(i, x, y, z, {});
    }
    primitive.setVertexAttribute(normalAccessor, VertexAttribute.Normal.XYZ);
  }
  /**
   * Sets up all objects (meshes, cameras, lights, groups) from glTF nodes
   * @param gltfModel - The glTF model data
   * @param rnBuffers - Array of Rhodonite buffers
   * @param rnMaterials - Array of Rhodonite materials
   * @param rnTextures - Array of Rhodonite textures
   * @param rnSamplers - Array of Rhodonite samplers
   * @returns Object containing arrays of entities and entities by name
   */
  static jq(engine, gltfModel, rnBuffers, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e, _f, _g;
    const rnEntities = [];
    const rnEntitiesByNames = /* @__PURE__ */ new Map();
    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[Number.parseInt(node_i, 10)];
      let entity;
      if (node.mesh != null) {
        const meshIdx = node.mesh;
        const meshEntity = this.Gq(
          engine,
          node.meshObject,
          meshIdx,
          rnBuffers,
          gltfModel,
          rnMaterials,
          rnTextures,
          rnSamplers
        );
        if (node.name) {
          meshEntity.tryToSetUniqueName(node.name, true);
        }
        if ((_a = node.meshObject) == null ? void 0 : _a.name) {
          const meshComponent = meshEntity.getComponent(MeshComponent);
          meshComponent.tryToSetUniqueName(node.meshObject.name, true);
        }
        entity = meshEntity;
      } else if (node.cameraObject != null) {
        const cameraEntity = this.Hq(engine, node.cameraObject, gltfModel);
        let entityWithOptionalLight = cameraEntity;
        if (((_b = node.extensions) == null ? void 0 : _b.KHR_lights_punctual) != null) {
          const lightEntity = engine.entityRepository.addComponentToEntity(
            LightComponent,
            cameraEntity
          );
          this.lq(lightEntity.getLight(), node.extensions.KHR_lights_punctual.light);
          lightEntity.getCamera().isSyncToLight = true;
          entityWithOptionalLight = lightEntity;
        }
        if (node.name) {
          entityWithOptionalLight.tryToSetUniqueName(node.name, true);
        }
        entity = entityWithOptionalLight;
      } else if ((_c = node.extensions) == null ? void 0 : _c.KHR_lights_punctual) {
        const lightEntity = this.Iq(engine, node.extensions.KHR_lights_punctual.light, gltfModel);
        entity = lightEntity;
      } else {
        const group = this.dq(engine, gltfModel);
        if (node.name) {
          group.tryToSetUniqueName(node.name, true);
        }
        entity = group;
      }
      const raymarchingExtension = (_d = node.extensions) == null ? void 0 : _d.RHODONITE_raymarching;
      if (raymarchingExtension != null && entity.tryToGetRaymarching() == null) {
        const RaymarchingComponent = raymarchingComponentClass;
        if (RaymarchingComponent == null) {
          Logger.default.warn(
            "RHODONITE_raymarching: Raymarching support is not loaded. Import the model through the asynchronous ModelConverter.convertToRhodoniteObject(), or await ModelConverter.preloadRaymarchingSupport() first."
          );
        } else {
          const raymarchingEntity = engine.entityRepository.addComponentToEntity(
            RaymarchingComponent,
            entity
          );
          const raymarchingComponent = raymarchingEntity.getRaymarching();
          if (raymarchingExtension.graph != null) {
            raymarchingComponent.rrnJson = raymarchingExtension.graph;
          } else if (raymarchingExtension.sdfShapeType != null) {
            raymarchingComponent.sdfShapeType = SdfShapeType.from(raymarchingExtension.sdfShapeType);
          }
          if (raymarchingExtension.isPickable != null) {
            raymarchingComponent.isPickable = raymarchingExtension.isPickable;
          }
          if (raymarchingExtension.castShadow != null) {
            raymarchingComponent.castShadow = raymarchingExtension.castShadow;
          }
          entity = raymarchingEntity;
        }
      }
      if (this.Jq(node, gltfModel)) {
        let weights = [];
        if (node.weights) {
          weights = node.weights;
        } else if ((_e = node.meshObject) == null ? void 0 : _e.weights) {
          weights = node.meshObject.weights;
        } else {
          let targetNum = 0;
          for (const primitive of node.meshObject.primitives) {
            if (Is.exist(primitive.targets)) {
              if (primitive.targets.length > targetNum) {
                targetNum = primitive.targets.length;
              }
            }
          }
          weights = new Array(targetNum).fill(0);
        }
        entity = entity.engine.entityRepository.addComponentToEntity(BlendShapeComponent, entity);
        const blendShapeComponent = entity.getBlendShape();
        blendShapeComponent.weights = weights;
        if ((_g = (_f = node.meshObject) == null ? void 0 : _f.primitives[0].extras) == null ? void 0 : _g.targetNames) {
          blendShapeComponent.targetNames = node.meshObject.primitives[0].extras.targetNames;
        }
      }
      entity.tryToSetTag({ tag: TagGltf2NodeIndex, value: node_i });
      rnEntities.push(entity);
      rnEntitiesByNames.set(node.name, entity);
    }
    return { rnEntities, rnEntitiesByNames };
  }
  /**
   * Checks if a node has morphing (blend shape) capabilities
   * @param node - The glTF node to check
   * @param gltfModel - The glTF model data
   * @returns True if the node supports morphing
   */
  static Jq(node, gltfModel) {
    var _a, _b, _c;
    const argument = (_b = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) == null ? void 0 : _b.defaultMaterialHelperArgumentArray[0];
    if ((argument == null ? void 0 : argument.isMorphing) === false) {
      return false;
    }
    return ((_c = node.meshObject) == null ? void 0 : _c.primitives[0].targets) != null;
  }
  /**
   * Sets up a light entity from glTF light data
   * @param light - The glTF light data
   * @param gltfModel - The glTF model data
   * @returns Configured light entity
   */
  static Iq(engine, light, gltfModel) {
    const lightEntity = this.sq(engine, gltfModel);
    const lightComponent = lightEntity.getComponent(LightComponent);
    this.lq(lightComponent, light);
    if (lightComponent.castShadow) {
      attachLightShadowCamera(engine, lightEntity);
    }
    return lightEntity;
  }
  /**
   * Applies glTF light data to a LightComponent. This is used for nodes that contain only a
   * light and for nodes that contain both a camera and a light.
   * @param lightComponent - The component to configure
   * @param light - The glTF light data
   */
  static lq(lightComponent, light) {
    var _a, _b, _c;
    if (light.name != null) {
      lightComponent.tryToSetUniqueName(light.name, true);
    }
    lightComponent.type = LightType.fromString(light.type);
    let color = Vector3.fromCopyArray3([1, 1, 1]);
    let intensity = 1;
    if (light.color != null) {
      color = Vector3.fromCopyArray3(light.color);
    }
    if (light.intensity != null) {
      intensity = light.intensity;
    }
    lightComponent.color = color;
    lightComponent.intensity = intensity;
    if (light.range != null) {
      lightComponent.range = light.range;
    }
    if (light.type === "spot") {
      if (((_a = light.spot) == null ? void 0 : _a.innerConeAngle) != null) {
        lightComponent.innerConeAngle = light.spot.innerConeAngle;
      }
      if (((_b = light.spot) == null ? void 0 : _b.outerConeAngle) != null) {
        lightComponent.outerConeAngle = light.spot.outerConeAngle;
      }
    }
    const rhodoniteExtras = (_c = light.extras) == null ? void 0 : _c.rhodonite;
    if (rhodoniteExtras != null) {
      if (rhodoniteExtras.castShadow != null) {
        lightComponent.castShadow = rhodoniteExtras.castShadow;
      }
      if (rhodoniteExtras.pointLightShadowFarPlane != null) {
        lightComponent.pointLightShadowFarPlane = rhodoniteExtras.pointLightShadowFarPlane;
      }
      if (rhodoniteExtras.shadowZNearForSpotLight != null) {
        lightComponent.shadowZNearForSpotLight = rhodoniteExtras.shadowZNearForSpotLight;
      }
    }
  }
  /**
   * Sets up a camera entity from glTF camera data
   * @param camera - The glTF camera data
   * @param gltfModel - The glTF model data
   * @returns Configured camera entity
   */
  static Hq(engine, camera, gltfModel) {
    const cameraEntity = this.rq(engine, gltfModel);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.direction = Vector3.fromCopyArray([0, 0, -1]);
    if (gltfModel.asset && gltfModel.asset.LastSaved_ApplicationVendor) {
      cameraComponent.direction = Vector3.fromCopyArray([1, 0, 0]);
      cameraComponent.directionInner = Vector3.fromCopyArray([1, 0, 0]);
    }
    cameraComponent.up = Vector3.fromCopyArray([0, 1, 0]);
    cameraComponent.type = CameraType.fromString(camera.type);
    if (cameraComponent.type === CameraType.Perspective) {
      cameraComponent.aspect = camera.perspective.aspectRatio ? camera.perspective.aspectRatio : 1;
      cameraComponent.setFovyAndChangeFocalLength(MathUtil.radianToDegree(camera.perspective.yfov));
      cameraComponent.zNear = camera.perspective.znear;
      cameraComponent.zFar = camera.perspective.zfar ? camera.perspective.zfar : 1e5;
      cameraComponent.tryToSetTag({
        tag: "OriginalFovY",
        value: cameraComponent.fovy
      });
    } else if (cameraComponent.type === CameraType.Orthographic) {
      cameraComponent.xMag = camera.orthographic.xmag;
      cameraComponent.yMag = camera.orthographic.ymag;
      cameraComponent.zNear = camera.orthographic.znear;
      cameraComponent.zFar = camera.orthographic.zfar;
      cameraComponent.tryToSetTag({
        tag: "OriginalXMag",
        value: cameraComponent.xMag
      });
      cameraComponent.tryToSetTag({
        tag: "OriginalYMag",
        value: cameraComponent.yMag
      });
    }
    cameraComponent.tryToSetTag({
      tag: "OriginalAspect",
      value: cameraComponent.aspect
    });
    return cameraEntity;
  }
  /**
   * Sets up a mesh entity from glTF mesh data
   * @param engine - The engine instance
   * @param mesh - The glTF mesh data
   * @param meshIndex - Index of the mesh in the glTF model
   * @param rnBuffers - Array of Rhodonite buffers
   * @param gltfModel - The glTF model data
   * @param rnMaterials - Array of Rhodonite materials
   * @param rnTextures - Array of Rhodonite textures
   * @param rnSamplers - Array of Rhodonite samplers
   * @returns Configured mesh entity
   */
  static Gq(engine, mesh, meshIndex, rnBuffers, gltfModel, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e;
    const meshEntity = this.qq(engine, gltfModel);
    const existingRnMesh = (_a = gltfModel.asset.extras.rnMeshesAtGltMeshIdx[meshIndex]) == null ? void 0 : _a.deref();
    let rnPrimitiveMode = PrimitiveMode.Triangles;
    const meshComponent = meshEntity.getMesh();
    if (existingRnMesh != null) {
      meshComponent.setMesh(existingRnMesh);
    } else {
      const rnMesh = new Mesh(engine);
      const rnLoaderOptions = gltfModel.asset.extras.rnLoaderOptions;
      if ((rnLoaderOptions == null ? void 0 : rnLoaderOptions.tangentCalculationMode) != null) {
        rnMesh.tangentCalculationMode = rnLoaderOptions.tangentCalculationMode;
      }
      const setupMaterialVariants = (rnPrimitive, primitive) => {
        const materialVariants = primitive.materialVariants;
        if (Is.not.exist(materialVariants)) {
          return;
        }
        for (const materialVariant of materialVariants) {
          const material = rnMaterials[materialVariant.material];
          for (const variantName of materialVariant.variants) {
            rnPrimitive.setMaterialVariant(variantName, material);
          }
        }
      };
      for (const i in mesh.primitives) {
        const primitive = mesh.primitives[i];
        if (primitive.mode != null) {
          rnPrimitiveMode = PrimitiveMode.from(primitive.mode);
        }
        const rnPrimitive = new Primitive(engine);
        const rnMaterial = primitive.material != null ? rnMaterials[primitive.material] : this.wk(engine, gltfModel, rnTextures, rnSamplers);
        setupMaterialVariants(rnPrimitive, primitive);
        if (rnMaterial.materialTypeName.indexOf("MToon") !== -1) {
          const VRMProperties = gltfModel.extensions.VRM;
          if ((VRMProperties == null ? void 0 : VRMProperties.rnExtension) != null) {
            const rnExtension = VRMProperties.rnExtension;
            const renderPassOutline = rnExtension.renderPassOutline;
            const outlineMaterial = (_d = (_c = (_b = primitive.materialObject) == null ? void 0 : _b.extras) == null ? void 0 : _c.outlineMaterial) == null ? void 0 : _d.deref();
            if (outlineMaterial != null) {
              renderPassOutline.setMaterialForPrimitive(outlineMaterial, rnPrimitive);
              rnPrimitive.setMaterialVariant("outline", outlineMaterial);
            }
          }
        }
        let indicesRnAccessor;
        const map = /* @__PURE__ */ new Map();
        if ((_e = primitive.extensions) == null ? void 0 : _e.KHR_draco_mesh_compression) {
          indicesRnAccessor = this.yp(engine, primitive, rnBuffers, gltfModel, map);
          if (Is.not.exist(indicesRnAccessor)) {
            break;
          }
        } else {
          if (Is.exist(primitive.indices)) {
            indicesRnAccessor = this.aq(engine, primitive.indicesObject, rnBuffers);
          }
          const rnBufferViewMap = /* @__PURE__ */ new Map();
          for (const attributeName in primitive.attributesObjects) {
            const rnm2attribute = primitive.attributesObjects[attributeName];
            const rnBuffer = rnBuffers[rnm2attribute.bufferViewObject.buffer];
            let rnBufferView;
            if (Is.exist(rnm2attribute.bufferView)) {
              rnBufferView = rnBufferViewMap.get(rnm2attribute.bufferView);
              if (Is.not.exist(rnBufferView)) {
                rnBufferView = this.bq(rnm2attribute.bufferViewObject, rnBuffer);
                rnBufferViewMap.set(rnm2attribute.bufferView, rnBufferView);
              }
            } else {
              rnBufferView = rnBuffer.takeBufferView({
                byteLengthToNeed: 0,
                byteStride: 0
              }).unwrapForce();
            }
            const attributeRnAccessor = this.cq(engine, rnm2attribute, rnBufferView);
            const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
              VertexAttribute.fromString(attributeName)
            );
            map.set(joinedString, attributeRnAccessor);
          }
        }
        rnPrimitive.setData(map, rnPrimitiveMode, rnMaterial, indicesRnAccessor);
        this.Fq(engine, rnPrimitive, indicesRnAccessor);
        if (primitive.targets != null) {
          const targets = [];
          for (let i2 = 0; i2 < primitive.targetsObjects.length; i2++) {
            const target = primitive.targetsObjects[i2];
            const targetMap = /* @__PURE__ */ new Map();
            for (const attributeName in target) {
              const attributeAccessor = target[attributeName];
              const attributeRnAccessor = this.aq(engine, attributeAccessor, rnBuffers);
              const attributeRnAccessorInGPUVertexData = this.Kq(
                engine,
                attributeRnAccessor
              );
              const vertexAttribute = VertexAttribute.fromString(attributeName);
              const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(vertexAttribute);
              targetMap.set(joinedString, attributeRnAccessorInGPUVertexData);
            }
            targets.push(targetMap);
          }
          rnPrimitive.setBlendShapeTargets(targets);
        }
        rnMesh.addPrimitive(rnPrimitive);
      }
      meshComponent.setMesh(rnMesh);
      gltfModel.asset.extras.rnMeshesAtGltMeshIdx[meshIndex] = new WeakRef(rnMesh);
    }
    return meshEntity;
  }
  /**
   * Sets sparse accessor data by applying sparse indices and values to the base accessor
   * @param accessor - The glTF accessor with sparse data
   * @param rnAccessor - The Rhodonite accessor to modify
   */
  static setSparseAccessor(accessor, rnAccessor) {
    var _a, _b, _c, _d;
    const count = accessor.sparse.count;
    const sparseIndices = accessor.sparse.indices;
    const indicesBufferView = sparseIndices.bufferViewObject;
    let buffer = sparseIndices.bufferViewObject.bufferObject.buffer;
    const byteOffsetBufferViewAndSparseIndices = ((_a = indicesBufferView.byteOffset) != null ? _a : 0) + ((_b = sparseIndices.byteOffset) != null ? _b : 0);
    const componentBytesIndices = this._checkBytesPerComponent(sparseIndices);
    const byteLengthIndices = componentBytesIndices * count;
    const dataViewIndices = new DataView(
      buffer.buffer,
      byteOffsetBufferViewAndSparseIndices + buffer.byteOffset,
      byteLengthIndices
    );
    const dataViewMethodIndices = this._checkDataViewMethod(sparseIndices);
    const sparseValues = accessor.sparse.values;
    const valueBufferView = sparseValues.bufferViewObject;
    buffer = sparseValues.bufferViewObject.bufferObject.buffer;
    const byteOffsetBufferViewAndAccessorValues = ((_c = valueBufferView.byteOffset) != null ? _c : 0) + ((_d = sparseValues.byteOffset) != null ? _d : 0);
    const componentBytesValues = this._checkBytesPerComponent(accessor);
    const componentNValues = this._checkComponentNumber(accessor);
    const byteLengthValues = componentBytesValues * componentNValues * count;
    const dataViewValues = new DataView(
      buffer.buffer,
      byteOffsetBufferViewAndAccessorValues + buffer.byteOffset,
      byteLengthValues
    );
    const dataViewMethodValues = this._checkDataViewMethod(accessor);
    const typedArray = rnAccessor.getTypedArray();
    const littleEndian = true;
    for (let i = 0; i < count; i++) {
      const index = dataViewIndices[dataViewMethodIndices](componentBytesIndices * i, littleEndian);
      for (let j = 0; j < componentNValues; j++) {
        const value = dataViewValues[dataViewMethodValues](
          componentBytesValues * componentNValues * i + componentBytesValues * j,
          littleEndian
        );
        typedArray[index * componentNValues + j] = value;
      }
      rnAccessor.setTypedArray(typedArray);
    }
  }
  /**
   * Sets up VRM 1.0 material properties
   * @param gltfModel - The glTF model data
   * @param materialJson - The material JSON data
   * @param rnLoaderOptions - Loader options
   * @returns Configured material or undefined if not VRM 1.0
   */
  static Lq(engine, gltfModel, materialJson, rnLoaderOptions) {
    var _a;
    const VRMProperties = gltfModel.extensions.VRM;
    const VRMC_materials_mtoon = (_a = materialJson.extensions) == null ? void 0 : _a.VRMC_materials_mtoon;
    if (VRMC_materials_mtoon != null) {
      const createMToon1Material = createMToon1MaterialImpl;
      if (createMToon1Material == null) {
        Logger.default.error(
          "VRM 1.0 material support is not loaded. Import the model through ModelConverter.convertToRhodoniteObject()."
        );
        return void 0;
      }
      const defaultMaterialHelperArgument = rnLoaderOptions.defaultMaterialHelperArgumentArray[0];
      const additionalName = defaultMaterialHelperArgument.additionalName;
      const isMorphing = true;
      const isSkinning = true;
      const isLighting = this.fq(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.gq(gltfModel);
      let renderPassOutline;
      if (Is.exist(VRMProperties == null ? void 0 : VRMProperties.rnExtension)) {
        const rnExtension = VRMProperties.rnExtension;
        renderPassOutline = rnExtension.renderPassOutline;
        renderPassOutline.isVrRendering = true;
        renderPassOutline.tryToSetUniqueName("VRM Outline RenderPass", true);
      }
      if (renderPassOutline != null) {
        let outlineMaterial;
        const outlineWidthMode = VRMC_materials_mtoon.outlineWidthMode;
        if (outlineWidthMode === "worldCoordinates" || outlineWidthMode === "screenCoordinates") {
          outlineMaterial = createMToon1Material(engine, {
            additionalName,
            isMorphing,
            isSkinning,
            isLighting,
            useTangentAttribute,
            isOutline: true,
            materialJson,
            textures,
            samplers,
            debugMode,
            maxInstancesNumber,
            makeOutputSrgb
          });
        }
        if (Is.exist(outlineMaterial)) {
          materialJson.extras.outlineMaterial = new WeakRef(outlineMaterial);
        }
      }
      const material = createMToon1Material(engine, {
        additionalName,
        isMorphing,
        isSkinning,
        isLighting,
        useTangentAttribute,
        isOutline: false,
        materialJson,
        textures,
        samplers,
        debugMode,
        maxInstancesNumber,
        makeOutputSrgb
      });
      materialJson.extensions.KHR_materials_unlit = void 0;
      return material;
    }
    return void 0;
  }
  /**
   * Sets MToon texture parameters for VRM materials
   * @param textures - Array of textures
   * @param materialProperties - VRM material properties
   * @param material - The material to configure
   * @param samplers - Array of samplers
   */
  static setMToonTextures(textures, materialProperties, material, samplers) {
    const litColorTexture = textures[materialProperties.textureProperties._MainTex];
    if (litColorTexture != null) {
      material.setTextureParameter(
        "litColorTexture",
        litColorTexture,
        samplers[materialProperties.textureProperties._MainTex]
      );
    }
    const shadeColorTexture = textures[materialProperties.textureProperties._ShadeTexture];
    if (shadeColorTexture != null) {
      material.setTextureParameter(
        "shadeColorTexture",
        shadeColorTexture,
        samplers[materialProperties.textureProperties._ShadeTexture]
      );
    }
    const receiveShadowTexture = textures[materialProperties.textureProperties._ReceiveShadowTexture];
    if (receiveShadowTexture != null) {
      material.setTextureParameter(
        "receiveShadowTexture",
        receiveShadowTexture,
        samplers[materialProperties.textureProperties._ReceiveShadowTexture]
      );
    }
    const shadingGradeTexture = textures[materialProperties.textureProperties._ShadingGradeTexture];
    if (shadingGradeTexture != null) {
      material.setTextureParameter(
        "shadingGradeTexture",
        shadingGradeTexture,
        samplers[materialProperties.textureProperties._ShadingGradeTexture]
      );
    }
    const rimTexture = textures[materialProperties.textureProperties._RimTexture];
    if (rimTexture != null) {
      material.setTextureParameter(
        "rimTexture",
        rimTexture,
        samplers[materialProperties.textureProperties._RimTexture]
      );
    }
    const matCapTexture = textures[materialProperties.textureProperties._SphereAdd];
    if (matCapTexture != null) {
      material.setTextureParameter(
        "matCapTexture",
        matCapTexture,
        samplers[materialProperties.textureProperties._SphereAdd]
      );
    }
    const emissionTexture = textures[materialProperties.textureProperties._EmissionMap];
    if (emissionTexture != null) {
      material.setTextureParameter(
        "emissionTexture",
        emissionTexture,
        samplers[materialProperties.textureProperties._EmissionMap]
      );
    }
    const normalTexture = textures[materialProperties.textureProperties._BumpMap];
    if (normalTexture != null) {
      material.setTextureParameter(
        "normalTexture",
        normalTexture,
        samplers[materialProperties.textureProperties._BumpMap]
      );
    }
    const outlineWidthTexture = textures[materialProperties.textureProperties._OutlineWidthTexture];
    if (outlineWidthTexture != null) {
      material.setTextureParameter(
        "outlineWidthTexture",
        outlineWidthTexture,
        samplers[materialProperties.textureProperties._OutlineWidthTexture]
      );
    }
    const uvAnimationMaskTexture = textures[materialProperties.textureProperties._UvAnimMaskTexture];
    if (uvAnimationMaskTexture != null) {
      material.setTextureParameter(
        "uvAnimationMaskTexture",
        uvAnimationMaskTexture,
        samplers[materialProperties.textureProperties._UvAnimMaskTexture]
      );
    }
  }
  /**
   * Sets up VRM 0.x material properties
   * @param gltfModel - The glTF model data
   * @param materialJson - The material JSON data
   * @param rnLoaderOptions - Loader options
   * @returns Configured material or undefined if not VRM 0.x
   */
  static Mq(engine, gltfModel, materialJson, rnLoaderOptions) {
    const VRMProperties = gltfModel.extensions.VRM;
    const materialProperties = materialJson.extras.vrm0xMaterialProperty;
    const shaderName = materialProperties.shader;
    if (shaderName === "VRM/MToon") {
      const createMToon0xMaterial = createMToon0xMaterialImpl;
      if (createMToon0xMaterial == null) {
        Logger.default.error(
          "VRM 0.x material support is not loaded. Import the model through ModelConverter.convertToRhodoniteObject()."
        );
        return void 0;
      }
      const defaultMaterialHelperArgument = rnLoaderOptions.defaultMaterialHelperArgumentArray[0];
      const additionalName = defaultMaterialHelperArgument.additionalName;
      const isMorphing = true;
      const isSkinning = true;
      const isLighting = this.fq(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.gq(gltfModel);
      let renderPassOutline;
      if (Is.exist(VRMProperties == null ? void 0 : VRMProperties.rnExtension)) {
        const rnExtension = VRMProperties.rnExtension;
        renderPassOutline = rnExtension.renderPassOutline;
        renderPassOutline.isVrRendering = true;
        renderPassOutline.tryToSetUniqueName("VRM Outline RenderPass", true);
      }
      if (renderPassOutline != null) {
        let outlineMaterial;
        if (materialProperties.floatProperties._OutlineWidthMode !== 0) {
          outlineMaterial = createMToon0xMaterial(engine, {
            additionalName,
            isMorphing,
            isSkinning,
            isLighting,
            useTangentAttribute,
            isOutline: true,
            materialProperties,
            textures,
            samplers,
            debugMode,
            maxInstancesNumber,
            makeOutputSrgb
          });
        }
        if (Is.exist(outlineMaterial)) {
          _ModelConverter.setMToonTextures(textures, materialProperties, outlineMaterial, samplers);
          materialJson.extras.outlineMaterial = new WeakRef(outlineMaterial);
        }
      }
      const material = createMToon0xMaterial(engine, {
        additionalName,
        isMorphing,
        isSkinning,
        isLighting,
        useTangentAttribute,
        isOutline: false,
        materialProperties,
        textures,
        samplers,
        debugMode,
        maxInstancesNumber,
        makeOutputSrgb
      });
      _ModelConverter.setMToonTextures(textures, materialProperties, material, samplers);
      return material;
    }
    return void 0;
  }
  /**
   * Generates an appropriate material based on glTF material data and loader options
   * @param engine - The engine instance
   * @param gltfModel - The glTF model data
   * @param rnTextures - Array of loaded Rhodonite textures
   * @param rnSamplers - Array of loaded Rhodonite samplers
   * @param materialJson - The material JSON data (optional)
   * @returns Generated material
   */
  static Nq(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
    const isTranslucent = Is.exist((_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_transmission);
    if (((_b = gltfModel.asset.extras) == null ? void 0 : _b.rnLoaderOptions) != null) {
      const rnLoaderOptions2 = gltfModel.asset.extras.rnLoaderOptions;
      if ((_d = (_c = rnLoaderOptions2.loaderExtension) == null ? void 0 : _c.isNeededToUseThisMaterial) == null ? void 0 : _d.call(_c, gltfModel)) {
        const loaderExtension = (_f = (_e = gltfModel.asset.extras) == null ? void 0 : _e.rnLoaderOptions) == null ? void 0 : _f.loaderExtension;
        if ((loaderExtension == null ? void 0 : loaderExtension.generateMaterial) != null) {
          return loaderExtension.generateMaterial(materialJson);
        }
      }
      if (rnLoaderOptions2.Qp) {
        const material2 = this.Mq(engine, gltfModel, materialJson, rnLoaderOptions2);
        if (Is.exist(material2)) {
          material2.isTranslucent = isTranslucent;
          return material2;
        }
      }
      const materialHelper = rnLoaderOptions2.defaultMaterialHelper;
      if (materialHelper != null) {
        return materialHelper(engine, ...(_g = rnLoaderOptions2.defaultMaterialHelperArgumentArray) != null ? _g : []);
      }
      if (rnLoaderOptions2.defaultMaterialHelperName != null) {
        Logger.default.error(
          `defaultMaterialHelperName ("${rnLoaderOptions2.defaultMaterialHelperName}") is no longer supported. Pass the function with defaultMaterialHelper instead, e.g. defaultMaterialHelper: createClassicUberMaterial.`
        );
      }
    }
    const isMorphing = true;
    const isSkinning = true;
    const isLighting = this.fq(gltfModel, materialJson);
    const additionalName = "";
    const rnLoaderOptions = (_i = (_h = gltfModel.asset.extras) == null ? void 0 : _h.rnLoaderOptions) != null ? _i : {};
    const useNormalTexture = (materialJson == null ? void 0 : materialJson.normalTexture) != null;
    const maxMaterialInstanceNumber = engine.config.materialCountPerBufferView;
    const pbrUberMaterialOptions = {
      isMorphing,
      isSkinning,
      isLighting,
      isOcclusion: Is.exist(materialJson == null ? void 0 : materialJson.occlusionTexture),
      isEmissive: Is.exist(materialJson == null ? void 0 : materialJson.emissiveTexture),
      isClearcoat: Is.exist((_j = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _j.KHR_materials_clearcoat),
      isTransmission: Is.exist((_k = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _k.KHR_materials_transmission),
      isVolume: Is.exist((_l = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _l.KHR_materials_volume),
      isSheen: Is.exist((_m = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _m.KHR_materials_sheen),
      isSpecular: Is.exist((_n = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _n.KHR_materials_specular),
      isIridescence: Is.exist((_o = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _o.KHR_materials_iridescence),
      isAnisotropy: Is.exist((_p = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _p.KHR_materials_anisotropy),
      isDispersion: Is.exist((_q = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _q.KHR_materials_dispersion),
      isEmissiveStrength: Is.exist((_r = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _r.KHR_materials_emissive_strength),
      isDiffuseTransmission: Is.exist((_s = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _s.KHR_materials_diffuse_transmission),
      isShadow: !!rnLoaderOptions.shadow,
      useNormalTexture,
      additionalName,
      maxInstancesNumber: maxMaterialInstanceNumber
    };
    if (Is.exist(materialJson)) {
      if (((_t = materialJson.extensions) == null ? void 0 : _t.VRMC_materials_mtoon) != null) {
        const rnLoaderOptions2 = gltfModel.asset.extras.rnLoaderOptions;
        const material2 = this.Lq(engine, gltfModel, materialJson, rnLoaderOptions2);
        if (Is.exist(material2)) {
          material2.isTranslucent = isTranslucent;
          return material2;
        }
      }
      if (RhodoniteImportExtension.hasNodeBasedMaterialExtension(materialJson)) {
        const customMaterial = RhodoniteImportExtension.createNodeBasedMaterial(
          engine,
          gltfModel,
          materialJson,
          rnTextures != null ? rnTextures : [],
          rnSamplers != null ? rnSamplers : [],
          pbrUberMaterialOptions
        );
        if (Is.exist(customMaterial)) {
          customMaterial.isTranslucent = isTranslucent;
          return customMaterial;
        }
        Logger.default.error(
          "RHODONITE_materials_node: Failed to create a node-based material. Falling back to the default material."
        );
      }
    }
    if (Number.parseFloat((_u = gltfModel.asset) == null ? void 0 : _u.version) >= 2) {
      const material2 = createPbrUberMaterial(engine, pbrUberMaterialOptions);
      const makeOutputSrgb = this.gq(gltfModel);
      if (Is.exist(makeOutputSrgb)) {
        material2.setParameter("makeOutputSrgb", makeOutputSrgb);
      }
      material2.isTranslucent = isTranslucent;
      return material2;
    }
    const material = createClassicUberMaterial(engine, {
      isSkinning,
      isLighting,
      additionalName,
      maxInstancesNumber: maxMaterialInstanceNumber
    });
    material.isTranslucent = isTranslucent;
    return material;
  }
  /**
   * Determines if lighting should be enabled for a material
   * @param gltfModel - The glTF model data
   * @param materialJson - The material JSON data (optional)
   * @returns True if lighting should be enabled
   */
  static fq(gltfModel, materialJson) {
    var _a, _b, _c, _d;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    if ((argument == null ? void 0 : argument.isLighting) != null) {
      return argument.isLighting;
    }
    return ((_d = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _d.KHR_materials_unlit) == null;
  }
  /**
   * Determines if tangent attributes should be used for a primitive
   * @param gltfModel - The glTF model data
   * @param primitive - The glTF primitive data
   * @returns True if tangent attributes should be used
   */
  static Qq(gltfModel, primitive) {
    var _a, _b, _c;
    const tangentCalculationMode = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.tangentCalculationMode;
    switch (tangentCalculationMode) {
      case 0:
        return false;
      case 1:
        break;
      case 2:
        return true;
      case 3:
        return false;
      case 4:
        return true;
      default:
    }
    for (const attribute in primitive.attributes) {
      if (attribute === "TANGENT") {
        return true;
      }
    }
    return false;
  }
  static Rq(gltfModel) {
    var _a, _b, _c, _d, _e, _f;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    if ((argument == null ? void 0 : argument.useNormalTexture) === false) {
      return false;
    }
    return ((_f = (_e = (_d = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _d.extras) == null ? void 0 : _e.rnLoaderOptions) == null ? void 0 : _f.tangentCalculationMode) !== 0;
  }
  static gq(gltfModel) {
    var _a, _b, _c;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    return argument == null ? void 0 : argument.makeOutputSrgb;
  }
  static wk(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
    var _a;
    const material = this.Nq(
      engine,
      gltfModel,
      rnTextures,
      rnSamplers,
      materialJson
    );
    if (materialJson == null) return material;
    _ModelConverter.setParametersToMaterial(materialJson, gltfModel, material, rnTextures, rnSamplers, false);
    if (((_a = materialJson.extras) == null ? void 0 : _a.outlineMaterial) != null) {
      _ModelConverter.setParametersToMaterial(
        materialJson,
        gltfModel,
        materialJson.extras.outlineMaterial.deref(),
        rnTextures,
        rnSamplers,
        true
      );
    }
    return material;
  }
  static setParametersToMaterial(materialJson, gltfModel, material, rnTextures, rnSamplers, isOutline) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const isUnlit = ((_a = materialJson.extensions) == null ? void 0 : _a.KHR_materials_unlit) != null;
    const options = gltfModel.asset.extras.rnLoaderOptions;
    const pbrMetallicRoughness = materialJson.pbrMetallicRoughness;
    if (pbrMetallicRoughness != null) {
      setupPbrMetallicRoughness(
        pbrMetallicRoughness,
        material,
        gltfModel,
        options,
        materialJson,
        rnTextures,
        rnSamplers
      );
    } else {
      let param = ShadingModel.Phong.index;
      if ((_b = materialJson == null ? void 0 : materialJson.extras) == null ? void 0 : _b.technique) {
        switch (materialJson.extras.technique) {
          case ShadingModel.Constant.str:
            param = ShadingModel.Constant.index;
            break;
          case ShadingModel.Lambert.str:
            param = ShadingModel.Lambert.index;
            break;
          case ShadingModel.BlinnPhong.str:
            param = ShadingModel.BlinnPhong.index;
            break;
          case ShadingModel.Phong.str:
            param = ShadingModel.Phong.index;
            break;
        }
        material.setParameter("shadingModel", Scalar.fromCopyNumber(param));
      }
    }
    const emissiveFactor = isUnlit ? [0, 0, 0] : materialJson.emissiveFactor;
    if (emissiveFactor != null) {
      material.setParameter("emissiveFactor", Vector3.fromCopyArray3(emissiveFactor));
    }
    const emissiveTexture = materialJson.emissiveTexture;
    if (emissiveTexture != null && Is.falsy(isUnlit)) {
      const rnTexture = rnTextures[emissiveTexture.texture.source];
      const rnSampler = rnSamplers[emissiveTexture.texture.sampler];
      material.setTextureParameter("emissiveTexture", rnTexture, rnSampler);
      if (Number.parseFloat((_c = gltfModel.asset) == null ? void 0 : _c.version) >= 2 && emissiveTexture.texCoord != null) {
        material.setParameter("emissiveTexcoordIndex", emissiveTexture.texCoord);
      }
      _ModelConverter._setupTextureTransform(
        emissiveTexture,
        material,
        "emissiveTextureTransformScale",
        "emissiveTextureTransformOffset",
        "emissiveTextureTransformRotation"
      );
    }
    let alphaMode = materialJson.alphaMode;
    if (options == null ? void 0 : options.alphaMode) {
      alphaMode = options.alphaMode;
    }
    if (alphaMode != null) {
      material.alphaMode = AlphaMode.fromGlTFString(alphaMode);
      if (material.alphaMode === AlphaMode.Mask && !((_e = (_d = gltfModel.asset.extras) == null ? void 0 : _d.rnLoaderOptions) == null ? void 0 : _e.Qp)) {
        material.setParameter("alphaCutoff", Scalar.fromCopyNumber((_f = materialJson.alphaCutoff) != null ? _f : 0.5));
      }
    }
    material.isTranslucent = Is.exist((_g = materialJson.extensions) == null ? void 0 : _g.KHR_materials_transmission);
    const doubleSided = materialJson.doubleSided;
    if (doubleSided != null && !isOutline) {
      material.cullFace = !doubleSided;
    }
    const normalTexture = materialJson.normalTexture;
    if (normalTexture != null && Is.falsy(isUnlit)) {
      const rnTexture = rnTextures[normalTexture.texture.source];
      const rnSampler = rnSamplers[normalTexture.texture.sampler];
      material.setTextureParameter("normalTexture", rnTexture, rnSampler);
      if (Number.parseFloat((_h = gltfModel.asset) == null ? void 0 : _h.version) >= 2) {
        if (normalTexture.texCoord != null) {
          material.setParameter("normalTexcoordIndex", normalTexture.texCoord);
        }
        if (normalTexture.scale != null) {
          material.setParameter("normalScale", normalTexture.scale);
        }
      }
    }
    _ModelConverter._setupTextureTransform(
      normalTexture,
      material,
      "normalTextureTransformScale",
      "normalTextureTransformOffset",
      "normalTextureTransformRotation"
    );
    if (this._checkRnGltfLoaderOptionsExist(gltfModel)) {
      const loaderExtension = (_j = (_i = gltfModel.asset.extras) == null ? void 0 : _i.rnLoaderOptions) == null ? void 0 : _j.loaderExtension;
      if ((loaderExtension == null ? void 0 : loaderExtension.setupMaterial) != null) {
        loaderExtension.setupMaterial(gltfModel, materialJson, material);
      }
    }
    if (((_k = materialJson.extensions) == null ? void 0 : _k.VRMC_materials_mtoon) != null) {
      setupMToon1(material, gltfModel, materialJson, rnTextures, rnSamplers);
    }
  }
  static _createSampler(engine, sampler) {
    const rnSampler = new Sampler(engine, {
      magFilter: Is.exist(sampler.magFilter) ? TextureParameter.from(sampler.magFilter) : TextureParameter.Linear,
      minFilter: Is.exist(sampler.minFilter) ? TextureParameter.from(sampler.minFilter) : TextureParameter.Linear,
      wrapS: Is.exist(sampler.wrapS) ? TextureParameter.from(sampler.wrapS) : TextureParameter.Repeat,
      wrapT: Is.exist(sampler.wrapT) ? TextureParameter.from(sampler.wrapT) : TextureParameter.Repeat
    });
    rnSampler.create();
    return rnSampler;
  }
  static async _createTexture(engine, image, gltfModel, { autoDetectTransparency = false } = {}) {
    var _a, _b, _c;
    const _options = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions;
    const rnTexture = new Texture(engine);
    rnTexture.autoDetectTransparency = autoDetectTransparency;
    if (image.image) {
      const imageElem = image.image;
      await rnTexture.generateTextureFromImage(imageElem);
    } else if (image.basis) {
      await rnTexture.generateTextureFromBasis(image.basis, {});
    } else if (image.ktx2) {
      await rnTexture.generateTextureFromKTX2(image.ktx2);
    } else {
      throw new Error("No image found");
    }
    if (image.uri) {
      rnTexture.name = image.uri;
    } else {
      const ext = (_b = image.mimeType) == null ? void 0 : _b.split("/")[1];
      rnTexture.name = (_c = image.name) != null ? _c : `Untitled.${ext}`;
    }
    rnTexture.tryToSetUniqueName(rnTexture.name, true);
    return rnTexture;
  }
  /**
   * Parses the texture assignments of the RHODONITE_raymarching_materials extension.
   *
   * The extension maps a shader semantic to a glTF texture index. Applications rebuild the
   * shared raymarching material from the node graphs after import and then apply the textures
   * with Material.setTextureParameter(semantic, texture, sampler).
   *
   * @param gltfModel - The imported glTF model
   * @returns One entry per valid assignment, in extension order
   */
  static getRaymarchingMaterialTextureAssignments(gltfModel) {
    var _a;
    const extension = (_a = gltfModel.extensions) == null ? void 0 : _a.RHODONITE_raymarching_materials;
    return this.mq(gltfModel, extension == null ? void 0 : extension.textures);
  }
  /**
   * Parses the per-component texture assignments stored in the `RHODONITE_raymarching` node
   * extensions.
   *
   * Each assignment keeps the glTF node index, which the importer also stores on the entity
   * (`TagGltf2NodeIndex`), so an application can apply the textures to the material it rebuilds
   * for that component.
   *
   * @param gltfModel - The imported glTF model
   * @returns One entry per valid assignment, in node and extension order
   */
  static getRaymarchingComponentTextureAssignments(gltfModel) {
    var _a, _b;
    const result = [];
    const nodes = (_a = gltfModel.nodes) != null ? _a : [];
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const extension = (_b = nodes[nodeIndex].extensions) == null ? void 0 : _b.RHODONITE_raymarching;
      for (const assignment of this.mq(gltfModel, extension == null ? void 0 : extension.textures)) {
        result.push({ nodeIndex, ...assignment });
      }
    }
    return result;
  }
  /**
   * Filters a semantic to texture-index map down to assignments whose texture and image exist.
   *
   * @param gltfModel - The imported glTF model
   * @param textures - The extension's texture map
   */
  static mq(gltfModel, textures) {
    var _a, _b, _c;
    if (textures == null || typeof textures !== "object") {
      return [];
    }
    const assignments = [];
    for (const semantic of Object.keys(textures)) {
      const textureIndex = (_a = textures[semantic]) == null ? void 0 : _a.index;
      if (textureIndex == null) {
        continue;
      }
      const gltfTexture = (_b = gltfModel.textures) == null ? void 0 : _b[textureIndex];
      const image = (gltfTexture == null ? void 0 : gltfTexture.source) != null ? (_c = gltfModel.images) == null ? void 0 : _c[gltfTexture.source] : void 0;
      if (gltfTexture == null || image == null) {
        continue;
      }
      assignments.push({
        semantic,
        textureIndex,
        samplerIndex: gltfTexture.sampler
      });
    }
    return assignments;
  }
  /**
   * Creates Rhodonite textures and samplers for the shared raymarching material's texture
   * assignments saved in the RHODONITE_raymarching_materials extension.
   *
   * Apply the returned textures to the rebuilt material with
   * Material.setTextureParameter(semantic, texture, sampler).
   *
   * @param engine - The engine instance
   * @param gltfModel - The imported glTF model
   * @returns The created textures and samplers keyed by shader semantic
   */
  static async createRaymarchingMaterialTextures(engine, gltfModel) {
    const result = /* @__PURE__ */ new Map();
    const assignments = this.getRaymarchingMaterialTextureAssignments(gltfModel);
    for (const { semantic, textureIndex, samplerIndex } of assignments) {
      const created = await this.nq(engine, gltfModel, textureIndex, samplerIndex);
      if (created != null) {
        result.set(semantic, created);
      }
    }
    return result;
  }
  /**
   * Creates Rhodonite textures and samplers for the per-component assignments saved in each
   * `RHODONITE_raymarching` node extension.
   *
   * The returned map is keyed by glTF node index (the entity's `TagGltf2NodeIndex`), then by
   * shader semantic. Apply them to the material rebuilt for that component with
   * Material.setTextureParameter(semantic, texture, sampler).
   *
   * @param engine - The engine instance
   * @param gltfModel - The imported glTF model
   * @returns The created textures and samplers keyed by node index and shader semantic
   */
  static async createRaymarchingComponentTextures(engine, gltfModel) {
    const result = /* @__PURE__ */ new Map();
    const assignments = this.getRaymarchingComponentTextureAssignments(gltfModel);
    for (const { nodeIndex, semantic, textureIndex, samplerIndex } of assignments) {
      const created = await this.nq(engine, gltfModel, textureIndex, samplerIndex);
      if (created == null) {
        continue;
      }
      let nodeTextures = result.get(nodeIndex);
      if (nodeTextures == null) {
        nodeTextures = /* @__PURE__ */ new Map();
        result.set(nodeIndex, nodeTextures);
      }
      nodeTextures.set(semantic, created);
    }
    return result;
  }
  /**
   * Creates one Rhodonite texture (and sampler) from a glTF texture index.
   *
   * @param engine - The engine instance
   * @param gltfModel - The imported glTF model
   * @param textureIndex - The glTF texture index
   * @param samplerIndex - The glTF sampler index of the texture
   * @returns The created texture and sampler, or null when creation fails
   */
  static async nq(engine, gltfModel, textureIndex, samplerIndex) {
    var _a;
    try {
      const gltfTexture = gltfModel.textures[textureIndex];
      const image = gltfModel.images[gltfTexture.source];
      const texture = await this._createTexture(engine, image, gltfModel);
      let sampler;
      if (samplerIndex != null && ((_a = gltfModel.samplers) == null ? void 0 : _a[samplerIndex]) != null) {
        sampler = this._createSampler(engine, gltfModel.samplers[samplerIndex]);
      }
      return { texture, sampler };
    } catch (error) {
      Logger.default.warn(
        `Failed to create the raymarching material texture for texture ${textureIndex}: ${String(error)}`
      );
      return null;
    }
  }
  static Sq(textureOption) {
    if (textureOption.wrapS !== TextureParameter.ClampToEdge || textureOption.wrapT !== TextureParameter.ClampToEdge || textureOption.minFilter !== TextureParameter.Linear && textureOption.minFilter !== TextureParameter.Nearest) {
      return true;
    }
    return false;
  }
  static Tq(image) {
    const width = image.width;
    const height = image.height;
    if ((width & width - 1) === 0 && (height & height - 1) === 0) {
      return true;
    }
    return false;
  }
  static Uq(materialJson, _materialTypeName) {
    if (materialJson == null) return false;
    return true;
  }
  static _checkRnGltfLoaderOptionsExist(gltfModel) {
    var _a;
    if ((_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) {
      return true;
    }
    return false;
  }
  static $p(typedArrayClass, uint8Array, byteOffset, length) {
    return new typedArrayClass(uint8Array.buffer, byteOffset + uint8Array.byteOffset, length);
  }
  static _checkBytesPerComponent(accessor) {
    let bytesPerComponent = 0;
    switch (accessor.componentType) {
      case 5120:
        bytesPerComponent = 1;
        break;
      case 5121:
        bytesPerComponent = 1;
        break;
      case 5122:
        bytesPerComponent = 2;
        break;
      case 5123:
        bytesPerComponent = 2;
        break;
      case 5124:
        bytesPerComponent = 4;
        break;
      case 5125:
        bytesPerComponent = 4;
        break;
      case 5126:
        bytesPerComponent = 4;
        break;
      default:
        break;
    }
    return bytesPerComponent;
  }
  static _checkComponentNumber(accessor) {
    let componentN = 0;
    switch (accessor.type) {
      case "SCALAR":
        componentN = 1;
        break;
      case "VEC2":
        componentN = 2;
        break;
      case "VEC3":
        componentN = 3;
        break;
      case "VEC4":
        componentN = 4;
        break;
      case "MAT4":
        componentN = 16;
        break;
    }
    return componentN;
  }
  static _checkDataViewMethod(accessor) {
    let dataViewMethod = "";
    switch (accessor.componentType) {
      case 5120:
        dataViewMethod = "getInt8";
        break;
      case 5121:
        dataViewMethod = "getUint8";
        break;
      case 5122:
        dataViewMethod = "getInt16";
        break;
      case 5123:
        dataViewMethod = "getUint16";
        break;
      case 5124:
        dataViewMethod = "getInt32";
        break;
      case 5125:
        dataViewMethod = "getUint32";
        break;
      case 5126:
        dataViewMethod = "getFloat32";
        break;
      default:
        break;
    }
    return dataViewMethod;
  }
  static _isSystemLittleEndian() {
    return !!new Uint8Array(new Uint16Array([255]).buffer)[0];
  }
  static _readBinaryFromAccessorAndSetItToAccessorExtras(engine, accessor, rnBuffers) {
    var _a, _b, _c;
    const bufferView = accessor.bufferViewObject;
    let byteOffsetFromBuffer = ((_a = bufferView.byteOffset) != null ? _a : 0) + ((_b = accessor.byteOffset) != null ? _b : 0);
    const buffer = bufferView.bufferObject;
    let uint8Array = buffer.buffer;
    const componentN = this._checkComponentNumber(accessor);
    const componentBytes = this._checkBytesPerComponent(accessor);
    const dataViewMethod = this._checkDataViewMethod(accessor);
    if (Is.not.exist(accessor.extras)) {
      accessor.extras = {
        typedDataArray: new Float32Array(),
        componentN: 0,
        componentBytes: 4,
        dataViewMethod: ""
      };
    }
    accessor.extras.componentN = Is.exist((_c = accessor.extras) == null ? void 0 : _c.weightsArrayLength) ? accessor.extras.weightsArrayLength : componentN;
    accessor.extras.componentBytes = componentBytes;
    accessor.extras.dataViewMethod = dataViewMethod;
    const byteLength = componentBytes * componentN * accessor.count;
    if (Is.exist(rnBuffers)) {
      const rnBuffer = rnBuffers[accessor.bufferViewObject.buffer];
      const rnBufferView = this.bq(bufferView, rnBuffer);
      const rnAccessor = this.cq(engine, accessor, rnBufferView);
      uint8Array = rnAccessor.getUint8Array();
      byteOffsetFromBuffer = 0;
    }
    let float32Array = new Float32Array();
    const numberArray = [];
    if (_ModelConverter._isSystemLittleEndian()) {
      let typedDataArray = new Float32Array();
      if (dataViewMethod === "getFloat32") {
        typedDataArray = this.$p(
          Float32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getInt8") {
        typedDataArray = new Int8Array(
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint8") {
        typedDataArray = new Uint8Array(
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getInt16") {
        typedDataArray = this.$p(
          Int16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint16") {
        typedDataArray = this.$p(
          Uint16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getInt32") {
        typedDataArray = this.$p(
          Int32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint32") {
        typedDataArray = this.$p(
          Uint32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      }
      float32Array = this.oq(dataViewMethod, typedDataArray);
    } else {
      const dataView = new DataView(uint8Array.buffer, byteOffsetFromBuffer + uint8Array.byteOffset, byteLength);
      const byteDelta = componentBytes * componentN;
      const littleEndian = true;
      for (let pos = 0; pos < byteLength; pos += byteDelta) {
        switch (accessor.type) {
          case "SCALAR":
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            break;
          case "VEC2":
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            numberArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
            break;
          case "VEC3":
            numberArray.push(dataView[dataViewMethod](pos, littleEndian));
            numberArray.push(dataView[dataViewMethod](pos + componentBytes, littleEndian));
            numberArray.push(dataView[dataViewMethod](pos + componentBytes * 2, littleEndian));
            break;
          case "VEC4":
            for (let i = 0; i < 4; i++) {
              numberArray.push(dataView[dataViewMethod](pos + componentBytes * i, littleEndian));
            }
            break;
          case "MAT4":
            for (let i = 0; i < 16; i++) {
              numberArray.push(dataView[dataViewMethod](pos + componentBytes * i, littleEndian));
            }
            break;
        }
      }
      float32Array = this.oq(dataViewMethod, numberArray);
    }
    accessor.extras.typedDataArray = float32Array;
    return float32Array;
  }
  /**
   * normalize values of TypedArray to Float32Array
   * See: the last part of 3.11.Animation at https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
   * @param dataViewMethod
   * @param numberArray
   * @returns
   */
  static oq(dataViewMethod, numberArray) {
    if (dataViewMethod === "getInt8") {
      return DataUtil.normalizedInt8ArrayToFloat32Array(numberArray);
    }
    if (dataViewMethod === "getUint8") {
      return DataUtil.normalizedUint8ArrayToFloat32Array(numberArray);
    }
    if (dataViewMethod === "getInt16") {
      return DataUtil.normalizedInt16ArrayToFloat32Array(numberArray);
    }
    if (dataViewMethod === "getUint16") {
      return DataUtil.normalizedUint16ArrayToFloat32Array(numberArray);
    }
    if (dataViewMethod === "getInt32") {
      Logger.default.error("Not considered");
      return new Float32Array();
    }
    if (dataViewMethod === "getUint32") {
      Logger.default.error("Not considered");
      return new Float32Array();
    }
    if (dataViewMethod === "getFloat32") {
      return new Float32Array(numberArray);
    }
    Logger.default.error("Not considered");
    return new Float32Array();
  }
  static Vq(meshComponent) {
    const primitiveNumber = meshComponent.mesh.getPrimitiveNumber();
    let offsetSum = 0;
    for (let i = 0; i < primitiveNumber; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const indicesAccessor = primitive.indicesAccessor;
      if (indicesAccessor) {
        const elementNumber = indicesAccessor.elementCount;
        for (let j = 0; j < elementNumber; j++) {
          const index = indicesAccessor.getScalar(j, {});
          indicesAccessor.setScalar(j, index + offsetSum, {});
        }
        offsetSum += elementNumber;
      }
    }
  }
  /**
   * Take a Rn.Accessor from the Rn.Buffer
   *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
   * @param accessor
   * @param rnBuffer
   * @returns
   */
  static cq(engine, accessor, rnBufferView) {
    var _a;
    let rnAccessor;
    if (rnBufferView != null) {
      rnAccessor = rnBufferView.takeAccessorWithByteOffset({
        compositionType: CompositionType.fromString(accessor.type),
        componentType: ComponentType.from(accessor.componentType),
        count: accessor.count,
        byteOffsetInBufferView: (_a = accessor.byteOffset) != null ? _a : 0,
        byteStride: accessor.byteStride,
        max: accessor.max,
        min: accessor.min,
        normalized: accessor.normalized
      }).unwrapForce();
    } else {
      const compositionType = CompositionType.fromString(accessor.type);
      const componentType = ComponentType.from(accessor.componentType);
      const byteLengthToNeed = accessor.count * compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
      const rnBuffer = engine.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, byteLengthToNeed, 4);
      const rnBufferView2 = rnBuffer.takeBufferView({
        byteLengthToNeed,
        byteStride: compositionType.getNumberOfComponents() * componentType.getSizeInBytes()
      }).unwrapForce();
      rnAccessor = rnBufferView2.takeAccessor({
        compositionType,
        componentType,
        count: accessor.count,
        max: accessor.max,
        min: accessor.min,
        normalized: accessor.normalized
      }).unwrapForce();
    }
    if (Is.exist(accessor.sparse)) {
      this.setSparseAccessor(accessor, rnAccessor);
    }
    return rnAccessor;
  }
  /**
   * Take a Rn.BufferView and a Rn.Accessor from the Rn.Buffer
   *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
   * @param accessor
   * @param rnBuffer
   * @returns
   */
  static aq(engine, accessor, rnBuffers) {
    const gltfBufferView = accessor.bufferViewObject;
    let rnBufferView;
    if (gltfBufferView != null) {
      const rnBuffer = rnBuffers[gltfBufferView.buffer];
      rnBufferView = this.bq(gltfBufferView, rnBuffer);
    }
    const rnAccessor = this.cq(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static Kq(engine, srcRnAccessor) {
    const byteSize = srcRnAccessor.elementCount * 3 * 4;
    const dstRnBuffer = engine.memoryManager.createBufferOnDemand(BufferUse.GPUVertexData, byteSize, 16);
    const dstRnBufferView = dstRnBuffer.takeBufferView({
      byteLengthToNeed: byteSize,
      byteStride: 3 * 4
    }).unwrapForce();
    const dstRnAccessor = dstRnBufferView.takeAccessor({
      compositionType: CompositionType.Vec3,
      componentType: ComponentType.Float,
      count: srcRnAccessor.elementCount,
      max: srcRnAccessor.max,
      min: srcRnAccessor.min,
      normalized: srcRnAccessor.normalized
    }).unwrapForce();
    dstRnAccessor.copyBuffer(srcRnAccessor);
    return dstRnAccessor;
  }
  static pq(engine, accessor, compositionNum, rnBuffer) {
    const rnBufferView = rnBuffer.takeBufferView({
      byteLengthToNeed: accessor.count * compositionNum * 4,
      byteStride: 0
    }).unwrapForce();
    const rnAccessor = this.cq(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static bq(rnm2bufferView, rnBuffer) {
    var _a, _b;
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: rnm2bufferView.byteLength,
      byteStride: (_a = rnm2bufferView.byteStride) != null ? _a : 0,
      byteOffset: (_b = rnm2bufferView.byteOffset) != null ? _b : 0
    }).unwrapForce();
    return rnBufferView;
  }
  static zp(draco, decoder, arrayBuffer) {
    const buffer = new draco.DecoderBuffer();
    buffer.Init(new Int8Array(arrayBuffer), arrayBuffer.byteLength);
    const geometryType = decoder.GetEncodedGeometryType(buffer);
    let dracoGeometry;
    let decodingStatus;
    if (geometryType === draco.TRIANGULAR_MESH) {
      dracoGeometry = new draco.Mesh();
      decodingStatus = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    } else if (geometryType === draco.POINT_CLOUD) {
      dracoGeometry = new draco.PointCloud();
      decodingStatus = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
    } else {
      const errorMsg = "Unknown geometry type.";
      Logger.default.error(errorMsg);
    }
    dracoGeometry.geometryType = geometryType;
    if (!decodingStatus.ok() || dracoGeometry.ptr === 0) {
      let errorMsg = "Decoding failed: ";
      errorMsg += decodingStatus.error_msg();
      Logger.default.error(errorMsg);
      draco.destroy(decoder);
      draco.destroy(dracoGeometry);
      return void 0;
    }
    draco.destroy(buffer);
    return dracoGeometry;
  }
  static Oq(draco, decoder, dracoGeometry, triangleStripDrawMode) {
    const geometryType = dracoGeometry.geometryType;
    if (geometryType !== draco.TRIANGULAR_MESH) {
      return void 0;
    }
    let indices;
    if (triangleStripDrawMode) {
      const stripsArray = new draco.DracoInt32Array();
      decoder.GetTriangleStripsFromMesh(dracoGeometry, stripsArray);
      indices = new Uint32Array(stripsArray.size());
      for (let i = 0; i < stripsArray.size(); ++i) {
        indices[i] = stripsArray.GetValue(i);
      }
      draco.destroy(stripsArray);
    } else {
      const numFaces = dracoGeometry.num_faces();
      const numIndices = numFaces * 3;
      indices = new Uint32Array(numIndices);
      const ia = new draco.DracoInt32Array();
      for (let i = 0; i < numFaces; ++i) {
        decoder.GetFaceFromMesh(dracoGeometry, i, ia);
        const index = i * 3;
        indices[index] = ia.GetValue(0);
        indices[index + 1] = ia.GetValue(1);
        indices[index + 2] = ia.GetValue(2);
      }
      draco.destroy(ia);
    }
    return indices;
  }
  static yp(engine, primitive, rnBuffers, gltfModel, map) {
    var _a, _b;
    const bufferView = gltfModel.bufferViews[(_a = primitive.extensions) == null ? void 0 : _a.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.bq(bufferView, rnBuffers[bufferView.buffer]);
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array()).buffer;
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.zp(draco, decoder, arraybufferOfBufferView);
    if (dracoGeometry == null) {
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }
    const numPoints = dracoGeometry.num_points();
    const rnBufferForDraco = this.Pq(primitive, numPoints);
    const primitiveMode = PrimitiveMode.from(primitive.mode);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }
    const indices = this.Oq(draco, decoder, dracoGeometry, isTriangleStrip);
    const indicesRnAccessor = this.pq(
      engine,
      primitive.indicesObject,
      1,
      rnBufferForDraco
    );
    for (let i = 0; i < indices.length; i++) {
      indicesRnAccessor.setScalar(i, indices[i], {});
    }
    for (const attributeName in primitive.attributes) {
      const dracoAttributeId = (_b = primitive.extensions) == null ? void 0 : _b.KHR_draco_mesh_compression.attributes[attributeName];
      const attributeGltf2Accessor = primitive.attributesObjects[attributeName];
      let attributeRnAccessor;
      if (Is.not.exist(dracoAttributeId)) {
        attributeRnAccessor = this.aq(engine, attributeGltf2Accessor, rnBuffers);
      } else {
        const compositionNum = CompositionType.fromString(attributeGltf2Accessor.type).getNumberOfComponents();
        attributeRnAccessor = this.pq(
          engine,
          attributeGltf2Accessor,
          compositionNum,
          rnBufferForDraco
        );
        const dracoAttributePointer = decoder.GetAttributeByUniqueId(dracoGeometry, dracoAttributeId);
        const decompressedAttributeData = new draco.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(dracoGeometry, dracoAttributePointer, decompressedAttributeData);
        for (let i = 0; i < numPoints; i++) {
          if (compositionNum === 1) {
            attributeRnAccessor.setScalar(i, decompressedAttributeData.GetValue(i * compositionNum), {});
          } else if (compositionNum === 2) {
            attributeRnAccessor.setVec2(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              {}
            );
          } else if (compositionNum === 3) {
            attributeRnAccessor.setVec3(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              decompressedAttributeData.GetValue(i * compositionNum + 2),
              {}
            );
          } else if (compositionNum === 4) {
            attributeRnAccessor.setVec4(
              i,
              decompressedAttributeData.GetValue(i * compositionNum),
              decompressedAttributeData.GetValue(i * compositionNum + 1),
              decompressedAttributeData.GetValue(i * compositionNum + 2),
              decompressedAttributeData.GetValue(i * compositionNum + 3),
              {}
            );
          }
        }
        draco.destroy(decompressedAttributeData);
      }
      if (Is.exist(attributeGltf2Accessor.sparse)) {
        this.setSparseAccessor(attributeGltf2Accessor, attributeRnAccessor);
      }
      const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
        VertexAttribute.fromString(attributeName)
      );
      map.set(joinedString, attributeRnAccessor);
    }
    draco.destroy(dracoGeometry);
    draco.destroy(decoder);
    return indicesRnAccessor;
  }
  static _setupTextureTransform(textureJson, rnMaterial, textureTransformScaleShaderSemantic, textureTransformOffsetShaderSemantic, textureTransformRotationShaderSemantic) {
    var _a;
    if ((_a = textureJson == null ? void 0 : textureJson.extensions) == null ? void 0 : _a.KHR_texture_transform) {
      const transformScale = MutableVector2.fromCopyArray([1, 1]);
      const transformOffset = MutableVector2.fromCopyArray([0, 0]);
      let rotation = 0;
      const transformJson = textureJson.extensions.KHR_texture_transform;
      if (transformJson.scale != null) {
        transformScale.x = transformJson.scale[0];
        transformScale.y = transformJson.scale[1];
      }
      if (transformJson.offset != null) {
        transformOffset.x = transformJson.offset[0];
        transformOffset.y = transformJson.offset[1];
      }
      if (transformJson.rotation != null) {
        rotation = transformJson.rotation;
      }
      rnMaterial.setParameter(textureTransformScaleShaderSemantic, transformScale);
      rnMaterial.setParameter(textureTransformOffsetShaderSemantic, transformOffset);
      rnMaterial.setParameter(textureTransformRotationShaderSemantic, rotation);
    }
  }
  static Pq(primitive, numPoints) {
    var _a;
    let byteLengthOfBufferForDraco = 0;
    if (Is.exist(primitive.indices)) {
      const count = primitive.indicesObject.count;
      byteLengthOfBufferForDraco += count * 4;
    }
    const drcAttributes = (_a = primitive.extensions) == null ? void 0 : _a.KHR_draco_mesh_compression.attributes;
    for (const attributeName in primitive.attributes) {
      if (drcAttributes[attributeName] == null) {
        continue;
      }
      const accessor = primitive.attributesObjects[attributeName];
      const compositionNum = CompositionType.fromString(accessor.type).getNumberOfComponents();
      const attributeByteLength = numPoints * compositionNum * 4;
      byteLengthOfBufferForDraco += attributeByteLength;
    }
    return new Buffer({
      byteLength: byteLengthOfBufferForDraco,
      buffer: new ArrayBuffer(byteLengthOfBufferForDraco),
      name: "Draco",
      byteAlign: 4,
      bufferUsage: BufferUse.CPUGeneric,
      indexOfTheBufferUsage: 0
    });
  }
};
function setupMToon1(material, _gltfModel, materialJson, rnTextures, rnSamplers) {
  const mToon = materialJson.extensions.VRMC_materials_mtoon;
  {
    const shadeColorFactor = mToon.shadeColorFactor;
    material.setParameter("shadeColorFactor", Vector3.fromCopyArray3(shadeColorFactor));
  }
  {
    const shadeMultiplyTexture = mToon.shadeMultiplyTexture;
    if (shadeMultiplyTexture != null) {
      const rnTexture = rnTextures[shadeMultiplyTexture.texture.source];
      const rnSampler = rnSamplers[shadeMultiplyTexture.texture.sampler];
      material.setTextureParameter("shadeMultiplyTexture", rnTexture, rnSampler);
      if (shadeMultiplyTexture.texCoord != null) {
        material.setParameter("shadeMultiplyTexcoordIndex", shadeMultiplyTexture.texCoord);
      }
    }
  }
  {
    const shadingShiftFactor = mToon.shadingShiftFactor;
    if (shadingShiftFactor != null) {
      material.setParameter("shadingShiftFactor", shadingShiftFactor);
    }
  }
  {
    const shadingShiftTexture = mToon.shadingShiftTexture;
    if (shadingShiftTexture != null) {
      const rnTexture = rnTextures[shadingShiftTexture.texture.source];
      const rnSampler = rnSamplers[shadingShiftTexture.texture.sampler];
      material.setTextureParameter("shadingShiftTexture", rnTexture, rnSampler);
      if (shadingShiftTexture.texCoord != null) {
        material.setParameter("shadingShiftTexcoordIndex", shadingShiftTexture.texCoord);
      }
      const shadingShiftTextureScale = shadingShiftTexture.scale;
      if (shadingShiftTextureScale != null) {
        material.setParameter("shadingShiftTextureScale", shadingShiftTextureScale);
      }
    }
  }
  {
    const shadingToonyFactor = mToon.shadingToonyFactor;
    if (shadingToonyFactor != null) {
      material.setParameter("shadingToonyFactor", shadingToonyFactor);
    }
  }
  {
    const giEqualizationFactor = mToon.giEqualizationFactor;
    if (giEqualizationFactor != null) {
      material.setParameter("giEqualizationFactor", giEqualizationFactor);
    }
  }
  {
    const matcapTexture = mToon.matcapTexture;
    if (matcapTexture != null) {
      const rnTexture = rnTextures[matcapTexture.texture.source];
      const rnSampler = rnSamplers[matcapTexture.texture.sampler];
      material.setTextureParameter("matcapTexture", rnTexture, rnSampler);
      if (matcapTexture.texCoord != null) {
        material.setParameter("matcapTexcoordIndex", matcapTexture.texCoord);
      }
    }
  }
  {
    const matcapFactor = mToon.matcapFactor;
    if (matcapFactor != null) {
      material.setParameter("matcapFactor", Vector3.fromCopyArray3(matcapFactor));
    }
  }
  {
    const parametricRimColorFactor = mToon.parametricRimColorFactor;
    if (parametricRimColorFactor != null) {
      material.setParameter("parametricRimColorFactor", Vector3.fromCopyArray3(parametricRimColorFactor));
    }
  }
  {
    const parametricRimFresnelPowerFactor = mToon.parametricRimFresnelPowerFactor;
    if (parametricRimFresnelPowerFactor != null) {
      material.setParameter("parametricRimFresnelPowerFactor", parametricRimFresnelPowerFactor);
    }
  }
  {
    const parametricRimLiftFactor = mToon.parametricRimLiftFactor;
    if (parametricRimLiftFactor != null) {
      material.setParameter("parametricRimLiftFactor", parametricRimLiftFactor);
    }
  }
  {
    const rimMultiplyTexture = mToon.rimMultiplyTexture;
    if (rimMultiplyTexture != null) {
      const rnTexture = rnTextures[rimMultiplyTexture.texture.source];
      const rnSampler = rnSamplers[rimMultiplyTexture.texture.sampler];
      material.setTextureParameter("rimMultiplyTexture", rnTexture, rnSampler);
      if (rimMultiplyTexture.texCoord != null) {
        material.setParameter("rimMultiplyTexcoordIndex", rimMultiplyTexture.texCoord);
      }
    }
  }
  {
    const rimLightingMixFactor = mToon.rimLightingMixFactor;
    if (rimLightingMixFactor != null) {
      material.setParameter("rimLightingMixFactor", rimLightingMixFactor);
    }
  }
  {
    const outlineWidthMode = mToon.outlineWidthMode;
    if (outlineWidthMode != null) {
      if (outlineWidthMode === "none") {
        material.setParameter("outlineWidthMode", 0);
      } else if (outlineWidthMode === "worldCoordinates") {
        material.setParameter("outlineWidthMode", 1);
      } else if (outlineWidthMode === "screenCoordinates") {
        material.setParameter("outlineWidthMode", 2);
      }
    }
  }
  {
    const outlineWidthFactor = mToon.outlineWidthFactor;
    if (outlineWidthFactor != null) {
      material.setParameter("outlineWidthFactor", outlineWidthFactor);
    }
  }
  {
    const outlineWidthMultiplyTexture = mToon.outlineWidthMultiplyTexture;
    if (outlineWidthMultiplyTexture != null) {
      const rnTexture = rnTextures[outlineWidthMultiplyTexture.texture.source];
      const rnSampler = rnSamplers[outlineWidthMultiplyTexture.texture.sampler];
      material.setTextureParameter("outlineWidthMultiplyTexture", rnTexture, rnSampler);
    }
  }
  {
    const outlineColorFactor = mToon.outlineColorFactor;
    if (outlineColorFactor != null) {
      material.setParameter("outlineColorFactor", Vector3.fromCopyArray3(outlineColorFactor));
    }
  }
  {
    const outlineLightingMixFactor = mToon.outlineLightingMixFactor;
    if (outlineLightingMixFactor != null) {
      material.setParameter("outlineLightingMixFactor", outlineLightingMixFactor);
    }
  }
  {
    const uvAnimationMaskTexture = mToon.uvAnimationMaskTexture;
    if (uvAnimationMaskTexture != null) {
      const rnTexture = rnTextures[uvAnimationMaskTexture.texture.source];
      const rnSampler = rnSamplers[uvAnimationMaskTexture.texture.sampler];
      material.setTextureParameter("uvAnimationMaskTexture", rnTexture, rnSampler);
      if (uvAnimationMaskTexture.texCoord != null) {
        material.setParameter("uvAnimationMaskTexcoordIndex", uvAnimationMaskTexture.texCoord);
      }
    }
  }
  {
    const uvAnimationScrollXSpeedFactor = mToon.uvAnimationScrollXSpeedFactor;
    if (uvAnimationScrollXSpeedFactor != null) {
      material.setParameter("uvAnimationScrollXSpeedFactor", uvAnimationScrollXSpeedFactor);
    }
  }
  {
    const uvAnimationScrollYSpeedFactor = mToon.uvAnimationScrollYSpeedFactor;
    if (uvAnimationScrollYSpeedFactor != null) {
      material.setParameter("uvAnimationScrollYSpeedFactor", uvAnimationScrollYSpeedFactor);
    }
  }
  {
    const uvAnimationRotationSpeedFactor = mToon.uvAnimationRotationSpeedFactor;
    if (uvAnimationRotationSpeedFactor != null) {
      material.setParameter("uvAnimationRotationSpeedFactor", uvAnimationRotationSpeedFactor);
    }
  }
}
function setupPbrMetallicRoughness(pbrMetallicRoughness, material, gltfModel, options, materialJson, rnTextures, rnSamplers) {
  var _a;
  const isUnlit = ((_a = materialJson.extensions) == null ? void 0 : _a.KHR_materials_unlit) != null;
  const baseColorFactor = pbrMetallicRoughness.baseColorFactor;
  if (baseColorFactor != null) {
    material.setParameter("baseColorFactor", Vector4.fromCopyArray4(baseColorFactor));
  }
  const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
  if (baseColorTexture != null) {
    const rnTexture = rnTextures[baseColorTexture.texture.source];
    const rnSampler = rnSamplers[baseColorTexture.texture.sampler];
    material.setTextureParameter("baseColorTexture", rnTexture, rnSampler);
    if (baseColorTexture.texCoord != null) {
      material.setParameter("baseColorTexcoordIndex", baseColorTexture.texCoord);
    }
    ModelConverter._setupTextureTransform(
      baseColorTexture,
      material,
      "baseColorTextureTransformScale",
      "baseColorTextureTransformOffset",
      "baseColorTextureTransformRotation"
    );
  }
  const occlusionTexture = materialJson.occlusionTexture;
  if (occlusionTexture != null && Is.falsy(isUnlit)) {
    const rnTexture = rnTextures[occlusionTexture.texture.source];
    const rnSampler = rnSamplers[occlusionTexture.texture.sampler];
    material.setTextureParameter("occlusionTexture", rnTexture, rnSampler);
    if (occlusionTexture.texCoord != null) {
      material.setParameter("occlusionTexcoordIndex", occlusionTexture.texCoord);
    }
    if (occlusionTexture.strength != null) {
      material.setParameter("occlusionStrength", occlusionTexture.strength);
    }
    ModelConverter._setupTextureTransform(
      occlusionTexture,
      material,
      "occlusionTextureTransformScale",
      "occlusionTextureTransformOffset",
      "occlusionTextureTransformRotation"
    );
  }
  let metallicFactor = pbrMetallicRoughness.metallicFactor;
  metallicFactor = isUnlit ? 0 : metallicFactor != null ? metallicFactor : 1;
  let roughnessFactor = pbrMetallicRoughness.roughnessFactor;
  roughnessFactor = isUnlit ? 1 : roughnessFactor != null ? roughnessFactor : 1;
  material.setParameter("metallicFactor", metallicFactor);
  material.setParameter("roughnessFactor", roughnessFactor);
  const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
  if (metallicRoughnessTexture != null && Is.falsy(isUnlit)) {
    const rnTexture = rnTextures[metallicRoughnessTexture.texture.source];
    const rnSampler = rnSamplers[metallicRoughnessTexture.texture.sampler];
    material.setTextureParameter("metallicRoughnessTexture", rnTexture, rnSampler);
    if (metallicRoughnessTexture.texCoord != null) {
      material.setParameter("metallicRoughnessTexcoordIndex", metallicRoughnessTexture.texCoord);
    }
    ModelConverter._setupTextureTransform(
      metallicRoughnessTexture,
      material,
      "metallicRoughnessTextureTransformScale",
      "metallicRoughnessTextureTransformOffset",
      "metallicRoughnessTextureTransformRotation"
    );
  }
  setup_KHR_materials_clearcoat(materialJson, material, gltfModel, rnTextures, rnSamplers);
  const transmission = setup_KHR_materials_transmission(materialJson, material, gltfModel, rnTextures, rnSamplers);
  if (!options.transmission) {
    options.transmission = transmission;
  }
  setup_KHR_materials_volume(materialJson, material, gltfModel, rnTextures, rnSamplers);
  setup_KHR_materials_sheen(materialJson, material, gltfModel, rnTextures, rnSamplers);
  setup_KHR_materials_specular(materialJson, material, gltfModel, rnTextures, rnSamplers);
  setup_KHR_materials_ior(materialJson, material, gltfModel);
  setup_KHR_materials_iridescence(materialJson, material, gltfModel, rnTextures, rnSamplers);
  setup_KHR_materials_anisotropy(materialJson, material, gltfModel, rnTextures, rnSamplers);
  setup_KHR_materials_emissive_strength(materialJson, material, gltfModel);
  setup_KHR_materials_dispersion(materialJson, material, gltfModel);
  setup_KHR_materials_diffuse_transmission(materialJson, material, gltfModel, rnTextures, rnSamplers);
}
function setup_KHR_materials_transmission(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_transmission = (_a = materialJson.extensions) == null ? void 0 : _a.KHR_materials_transmission;
  if (Is.exist(KHR_materials_transmission)) {
    const transmissionFactor = Is.exist(KHR_materials_transmission.transmissionFactor) ? KHR_materials_transmission.transmissionFactor : 0;
    material.setParameter("transmissionFactor", transmissionFactor);
    const transmissionTexture = KHR_materials_transmission.transmissionTexture;
    if (Is.exist(transmissionTexture)) {
      const rnTransmissionTexture = rnTextures[transmissionTexture.texture.source];
      const rnSampler = rnSamplers[transmissionTexture.texture.sampler];
      material.setTextureParameter("transmissionTexture", rnTransmissionTexture, rnSampler);
      if (transmissionTexture.texCoord != null) {
        material.setParameter("transmissionTexcoordIndex", transmissionTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        transmissionTexture,
        material,
        "transmissionTextureTransformScale",
        "transmissionTextureTransformOffset",
        "transmissionTextureTransformRotation"
      );
    }
    return true;
  }
  return false;
}
function setup_KHR_materials_clearcoat(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_clearcoat = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_clearcoat;
  if (Is.exist(KHR_materials_clearcoat)) {
    const clearcoatFactor = Is.exist(KHR_materials_clearcoat.clearcoatFactor) ? KHR_materials_clearcoat.clearcoatFactor : 0;
    material.setParameter("clearcoatFactor", clearcoatFactor);
    const clearcoatTexture = KHR_materials_clearcoat.clearcoatTexture;
    if (clearcoatTexture != null) {
      const rnClearCoatTexture = rnTextures[clearcoatTexture.texture.source];
      const rnSampler = rnSamplers[clearcoatTexture.texture.sampler];
      material.setTextureParameter("clearcoatTexture", rnClearCoatTexture, rnSampler);
      if (clearcoatTexture.texCoord != null) {
        material.setParameter("clearcoatTexcoordIndex", clearcoatTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        clearcoatTexture,
        material,
        "clearcoatTextureTransformScale",
        "clearcoatTextureTransformOffset",
        "clearcoatTextureTransformRotation"
      );
    }
    const clearcoatRoughnessFactor = Is.exist(KHR_materials_clearcoat.clearcoatRoughnessFactor) ? KHR_materials_clearcoat.clearcoatRoughnessFactor : 0;
    material.setParameter("clearcoatRoughnessFactor", clearcoatRoughnessFactor);
    const clearcoatRoughnessTexture = KHR_materials_clearcoat.clearcoatRoughnessTexture;
    if (clearcoatRoughnessTexture != null) {
      const rnClearCoatRoughnessTexture = rnTextures[clearcoatRoughnessTexture.texture.source];
      const rnSampler = rnSamplers[clearcoatRoughnessTexture.texture.sampler];
      material.setTextureParameter("clearcoatRoughnessTexture", rnClearCoatRoughnessTexture, rnSampler);
      if (clearcoatRoughnessTexture.texCoord != null) {
        material.setParameter("clearcoatRoughnessTexcoordIndex", clearcoatRoughnessTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        clearcoatRoughnessTexture,
        material,
        "clearcoatRoughnessTextureTransformScale",
        "clearcoatRoughnessTextureTransformOffset",
        "clearcoatRoughnessTextureTransformRotation"
      );
    }
    const clearcoatNormalTexture = KHR_materials_clearcoat.clearcoatNormalTexture;
    if (clearcoatNormalTexture != null) {
      const rnClearCoatNormalTexture = rnTextures[clearcoatNormalTexture.texture.source];
      const rnSampler = rnSamplers[clearcoatNormalTexture.texture.sampler];
      material.setTextureParameter("clearcoatNormalTexture", rnClearCoatNormalTexture, rnSampler);
      if (clearcoatNormalTexture.texCoord != null) {
        material.setParameter("clearcoatNormalTexcoordIndex", clearcoatNormalTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        clearcoatNormalTexture,
        material,
        "clearcoatNormalTextureTransformScale",
        "clearcoatNormalTextureTransformOffset",
        "clearcoatNormalTextureTransformRotation"
      );
    }
  }
}
function setup_KHR_materials_volume(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_volume = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_volume;
  if (Is.exist(KHR_materials_volume)) {
    const thicknessFactor = KHR_materials_volume.thicknessFactor ? KHR_materials_volume.thicknessFactor : 0;
    if (thicknessFactor != null) {
      material.setParameter("thicknessFactor", thicknessFactor);
    }
    const thicknessTexture = KHR_materials_volume.thicknessTexture;
    if (thicknessTexture != null) {
      const rnThicknessTexture = rnTextures[thicknessTexture.texture.source];
      const rnSampler = rnSamplers[thicknessTexture.texture.sampler];
      material.setTextureParameter("thicknessTexture", rnThicknessTexture, rnSampler);
      if (thicknessTexture.texCoord != null) {
        material.setParameter("thicknessTexcoordIndex", thicknessTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        thicknessTexture,
        material,
        "thicknessTextureTransformScale",
        "thicknessTextureTransformOffset",
        "thicknessTextureTransformRotation"
      );
    }
    const INF = 1e20;
    const attenuationDistance = KHR_materials_volume.attenuationDistance ? KHR_materials_volume.attenuationDistance : INF;
    material.setParameter("attenuationDistance", attenuationDistance);
    const attenuationColor = KHR_materials_volume.attenuationColor ? Vector3.fromCopyArray3(KHR_materials_volume.attenuationColor) : Vector3.fromCopy3(1, 1, 1);
    if (attenuationColor != null) {
      material.setParameter("attenuationColor", attenuationColor);
    }
  }
}
function setup_KHR_materials_sheen(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_sheen = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_sheen;
  if (Is.exist(KHR_materials_sheen)) {
    const sheenColorFactor = Is.exist(KHR_materials_sheen.sheenColorFactor) ? KHR_materials_sheen.sheenColorFactor : [0, 0, 0];
    material.setParameter("sheenColorFactor", Vector3.fromCopyArray3(sheenColorFactor));
    const sheenColorTexture = KHR_materials_sheen.sheenColorTexture;
    if (sheenColorTexture != null) {
      const rnSheenColorTexture = rnTextures[sheenColorTexture.texture.source];
      const rnSampler = rnSamplers[sheenColorTexture.texture.sampler];
      material.setTextureParameter("sheenColorTexture", rnSheenColorTexture, rnSampler);
      if (sheenColorTexture.texCoord != null) {
        material.setParameter("sheenColorTexcoordIndex", sheenColorTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        sheenColorTexture,
        material,
        "sheenColorTextureTransformScale",
        "sheenColorTextureTransformOffset",
        "sheenColorTextureTransformRotation"
      );
    }
    const sheenRoughnessFactor = Is.exist(KHR_materials_sheen.sheenRoughnessFactor) ? KHR_materials_sheen.sheenRoughnessFactor : 0;
    material.setParameter("sheenRoughnessFactor", sheenRoughnessFactor);
    const sheenRoughnessTexture = KHR_materials_sheen.sheenRoughnessTexture;
    if (sheenRoughnessTexture != null) {
      const rnSheenRoughnessTexture = rnTextures[sheenRoughnessTexture.texture.source];
      const rnSampler = rnSamplers[sheenRoughnessTexture.texture.sampler];
      material.setTextureParameter("sheenRoughnessTexture", rnSheenRoughnessTexture, rnSampler);
      if (sheenRoughnessTexture.texCoord != null) {
        material.setParameter("sheenRoughnessTexcoordIndex", sheenRoughnessTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        sheenRoughnessTexture,
        material,
        "sheenRoughnessTextureTransformScale",
        "sheenRoughnessTextureTransformOffset",
        "sheenRoughnessTextureTransformRotation"
      );
    }
  }
}
function setup_KHR_materials_specular(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_specular = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_specular;
  if (Is.exist(KHR_materials_specular)) {
    const specularFactor = Is.exist(KHR_materials_specular.specularFactor) ? KHR_materials_specular.specularFactor : 1;
    material.setParameter("specularFactor", specularFactor);
    const specularTexture = KHR_materials_specular.specularTexture;
    if (specularTexture != null) {
      const rnSpecularTexture = rnTextures[specularTexture.texture.source];
      const rnSampler = rnSamplers[specularTexture.texture.sampler];
      material.setTextureParameter("specularTexture", rnSpecularTexture, rnSampler);
      if (specularTexture.texCoord != null) {
        material.setParameter("specularTexcoordIndex", specularTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        specularTexture,
        material,
        "specularTextureTransformScale",
        "specularTextureTransformOffset",
        "specularTextureTransformRotation"
      );
    }
    const specularColorFactor = Is.exist(KHR_materials_specular.specularColorFactor) ? KHR_materials_specular.specularColorFactor : [1, 1, 1];
    material.setParameter("specularColorFactor", Vector3.fromCopyArray3(specularColorFactor));
    const specularColorTexture = KHR_materials_specular.specularColorTexture;
    if (specularColorTexture != null) {
      const rnSpecularColorTexture = rnTextures[specularColorTexture.texture.source];
      const rnSampler = rnSamplers[specularColorTexture.texture.sampler];
      material.setTextureParameter("specularColorTexture", rnSpecularColorTexture, rnSampler);
      if (specularColorTexture.texCoord != null) {
        material.setParameter("specularColorTexcoordIndex", specularColorTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        specularColorTexture,
        material,
        "specularColorTextureTransformScale",
        "specularColorTextureTransformOffset",
        "specularColorTextureTransformRotation"
      );
    }
  }
}
function setup_KHR_materials_ior(materialJson, material, _gltfModel) {
  var _a;
  const KHR_materials_ior = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_ior;
  if (Is.exist(KHR_materials_ior)) {
    const ior = Is.exist(KHR_materials_ior.ior) ? KHR_materials_ior.ior : 1.5;
    material.setParameter("ior", ior);
  }
}
function setup_KHR_materials_iridescence(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_iridescence = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_iridescence;
  if (Is.exist(KHR_materials_iridescence)) {
    const iridescenceFactor = Is.exist(KHR_materials_iridescence.iridescenceFactor) ? KHR_materials_iridescence.iridescenceFactor : 0;
    material.setParameter("iridescenceFactor", iridescenceFactor);
    const iridescenceTexture = KHR_materials_iridescence.iridescenceTexture;
    if (iridescenceTexture != null) {
      const rnIridescenceTexture = rnTextures[iridescenceTexture.texture.source];
      const rnSampler = rnSamplers[iridescenceTexture.texture.sampler];
      material.setTextureParameter("iridescenceTexture", rnIridescenceTexture, rnSampler);
      if (iridescenceTexture.texCoord != null) {
        material.setParameter("iridescenceTexcoordIndex", iridescenceTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        iridescenceTexture,
        material,
        "iridescenceTextureTransformScale",
        "iridescenceTextureTransformOffset",
        "iridescenceTextureTransformRotation"
      );
    }
    const iridescenceIor = Is.exist(KHR_materials_iridescence.iridescenceIor) ? KHR_materials_iridescence.iridescenceIor : 1.3;
    material.setParameter("iridescenceIor", iridescenceIor);
    const iridescenceThicknessMinimum = Is.exist(KHR_materials_iridescence.iridescenceThicknessMinimum) ? KHR_materials_iridescence.iridescenceThicknessMinimum : 100;
    material.setParameter("iridescenceThicknessMinimum", iridescenceThicknessMinimum);
    const iridescenceThicknessMaximum = Is.exist(KHR_materials_iridescence.iridescenceThicknessMaximum) ? KHR_materials_iridescence.iridescenceThicknessMaximum : 400;
    material.setParameter("iridescenceThicknessMaximum", iridescenceThicknessMaximum);
    const iridescenceThicknessTexture = KHR_materials_iridescence.iridescenceThicknessTexture;
    if (iridescenceThicknessTexture != null) {
      const rnIridescenceThicknessTexture = rnTextures[iridescenceThicknessTexture.texture.source];
      const rnSampler = rnSamplers[iridescenceThicknessTexture.texture.sampler];
      material.setTextureParameter("iridescenceThicknessTexture", rnIridescenceThicknessTexture, rnSampler);
      if (iridescenceThicknessTexture.texCoord != null) {
        material.setParameter("iridescenceThicknessTexcoordIndex", iridescenceThicknessTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        iridescenceThicknessTexture,
        material,
        "iridescenceThicknessTextureTransformScale",
        "iridescenceThicknessTextureTransformOffset",
        "iridescenceThicknessTextureTransformRotation"
      );
    }
  }
}
function setup_KHR_materials_anisotropy(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_anisotropy = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_anisotropy;
  if (Is.exist(KHR_materials_anisotropy)) {
    const anisotropyStrength = Is.exist(KHR_materials_anisotropy.anisotropyStrength) ? KHR_materials_anisotropy.anisotropyStrength : 0;
    material.setParameter("anisotropyStrength", anisotropyStrength);
    const anisotropyRotation = Is.exist(KHR_materials_anisotropy.anisotropyRotation) ? KHR_materials_anisotropy.anisotropyRotation : 0;
    material.setParameter(
      "anisotropyRotation",
      Vector2.fromCopy2(Math.cos(anisotropyRotation), Math.sin(anisotropyRotation))
    );
    const anisotropyTexture = KHR_materials_anisotropy.anisotropyTexture;
    if (anisotropyTexture != null) {
      const rnAnisotropyTexture = rnTextures[anisotropyTexture.texture.source];
      const rnSampler = rnSamplers[anisotropyTexture.texture.sampler];
      material.setTextureParameter("anisotropyTexture", rnAnisotropyTexture, rnSampler);
      if (anisotropyTexture.texCoord != null) {
        material.setParameter("anisotropyTexcoordIndex", anisotropyTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        anisotropyTexture,
        material,
        "anisotropyTextureTransformScale",
        "anisotropyTextureTransformOffset",
        "anisotropyTextureTransformRotation"
      );
    }
  }
}
function setup_KHR_materials_emissive_strength(materialJson, material, _gltfModel) {
  var _a;
  const KHR_materials_emissive_strength = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_emissive_strength;
  if (Is.exist(KHR_materials_emissive_strength)) {
    const emissiveStrength = Is.exist(KHR_materials_emissive_strength.emissiveStrength) ? KHR_materials_emissive_strength.emissiveStrength : 1;
    material.setParameter("emissiveStrength", emissiveStrength);
  }
}
function setup_KHR_materials_dispersion(materialJson, material, _gltfModel) {
  var _a;
  const KHR_materials_dispersion = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_dispersion;
  if (Is.exist(KHR_materials_dispersion)) {
    const dispersion = Is.exist(KHR_materials_dispersion.dispersion) ? KHR_materials_dispersion.dispersion : 0;
    material.setParameter("dispersion", dispersion);
  }
}
function setup_KHR_materials_diffuse_transmission(materialJson, material, _gltfModel, rnTextures, rnSamplers) {
  var _a;
  const KHR_materials_diffuse_transmission = (_a = materialJson == null ? void 0 : materialJson.extensions) == null ? void 0 : _a.KHR_materials_diffuse_transmission;
  if (Is.exist(KHR_materials_diffuse_transmission)) {
    const diffuseTransmissionFactor = Is.exist(KHR_materials_diffuse_transmission.diffuseTransmissionFactor) ? KHR_materials_diffuse_transmission.diffuseTransmissionFactor : 0;
    material.setParameter("diffuseTransmissionFactor", diffuseTransmissionFactor);
    const diffuseTransmissionTexture = KHR_materials_diffuse_transmission.diffuseTransmissionTexture;
    if (diffuseTransmissionTexture != null) {
      const rnDiffuseTransmissionTexture = rnTextures[diffuseTransmissionTexture.texture.source];
      const rnSampler = rnSamplers[diffuseTransmissionTexture.texture.sampler];
      material.setTextureParameter("diffuseTransmissionTexture", rnDiffuseTransmissionTexture, rnSampler);
      if (diffuseTransmissionTexture.texCoord != null) {
        material.setParameter("diffuseTransmissionTexcoordIndex", diffuseTransmissionTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        diffuseTransmissionTexture,
        material,
        "diffuseTransmissionTextureTransformScale",
        "diffuseTransmissionTextureTransformOffset",
        "diffuseTransmissionTextureTransformRotation"
      );
    }
    const diffuseTransmissionColorFactor = Is.exist(KHR_materials_diffuse_transmission.diffuseTransmissionColorFactor) ? KHR_materials_diffuse_transmission.diffuseTransmissionColorFactor : [1, 1, 1];
    material.setParameter("diffuseTransmissionColorFactor", Vector3.fromCopyArray3(diffuseTransmissionColorFactor));
    const diffuseTransmissionColorTexture = KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture;
    if (diffuseTransmissionColorTexture != null) {
      const rnDiffuseTransmissionColorTexture = rnTextures[diffuseTransmissionColorTexture.texture.source];
      const rnSampler = rnSamplers[diffuseTransmissionColorTexture.texture.sampler];
      material.setTextureParameter("diffuseTransmissionColorTexture", rnDiffuseTransmissionColorTexture, rnSampler);
      if (diffuseTransmissionColorTexture.texCoord != null) {
        material.setParameter("diffuseTransmissionColorTexcoordIndex", diffuseTransmissionColorTexture.texCoord);
      }
      ModelConverter._setupTextureTransform(
        diffuseTransmissionColorTexture,
        material,
        "diffuseTransmissionColorTextureTransformScale",
        "diffuseTransmissionColorTextureTransformOffset",
        "diffuseTransmissionColorTextureTransformRotation"
      );
    }
  }
}
export {
  ModelConverter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvTW9kZWxDb252ZXJ0ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQW5pbWF0aW9uUGF0aE5hbWUsIEFuaW1hdGlvblNhbXBsZXIsIEFuaW1hdGlvblRyYWNrTmFtZSB9IGZyb20gJy4uLy4uL3R5cGVzL0FuaW1hdGlvblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQXJyYXkzLCBCeXRlLCBDb3VudCwgSW5kZXgsIFNpemUsIFR5cGVkQXJyYXksIFZlY3RvckNvbXBvbmVudE4gfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQge1xuICB0eXBlIEdsdGZMb2FkT3B0aW9uLFxuICB0eXBlIEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQsXG4gIHR5cGUgS0hSX25vZGVfdmlzaWJpbGl0eSxcbiAgVGFnR2x0ZjJOb2RlSW5kZXgsXG4gIFRhZ0tock5vZGVWaXNpYmlsaXR5RW5hYmxlZCxcbiAgVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlLFxufSBmcm9tICcuLi8uLi90eXBlcy9nbFRGMic7XG5pbXBvcnQgdHlwZSB7IE5vZGVKU09OIH0gZnJvbSAnLi4vLi4vdHlwZXMvTm9kZUpTT04nO1xuaW1wb3J0IHR5cGUge1xuICBSbk0yLFxuICBSbk0yQWNjZXNzb3IsXG4gIFJuTTJBbmltYXRpb24sXG4gIFJuTTJBbmltYXRpb25DaGFubmVsLFxuICBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgUm5NMkJ1ZmZlclZpZXcsXG4gIFJuTTJDYW1lcmEsXG4gIFJuTTJJbWFnZSxcbiAgUm5NMk1hdGVyaWFsLFxuICBSbk0yTWVzaCxcbiAgUm5NMk5vZGUsXG4gIFJuTTJQYnJNZXRhbGxpY1JvdWdobmVzcyxcbiAgUm5NMlByaW1pdGl2ZSxcbiAgUm5NMlNwYXJzZUluZGljZXMsXG4gIFJuTTJUZXh0dXJlSW5mbyxcbiAgUm5NMlRleHR1cmVTYW1wbGVyLFxufSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB0eXBlIHsgVnJtMHhNYXRlcmlhbFByb3BlcnR5IH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNMHgnO1xuaW1wb3J0IHR5cGUgeyBWcm0xX01hdGVyaWFsIH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNQ19tYXRlcmlhbHNfbXRvb24nO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb25TdGF0ZS9BbmltYXRpb25TdGF0ZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJQmxlbmRTaGFwZUVudGl0eU1ldGhvZHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0JsZW5kU2hhcGUvSUJsZW5kU2hhcGVFbnRpdHknO1xuaW1wb3J0IHsgY3JlYXRlQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmEvY3JlYXRlQ2FtZXJhRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUxpZ2h0RW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9MaWdodC9jcmVhdGVMaWdodEVudGl0eSc7XG5pbXBvcnQgeyBMaWdodENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTGlnaHQvTGlnaHRDb21wb25lbnQnO1xuaW1wb3J0IHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IGNyZWF0ZU1lc2hFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9jcmVhdGVNZXNoRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUdyb3VwRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL2NyZWF0ZUdyb3VwRW50aXR5JztcbmltcG9ydCB0eXBlIHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFNrZWxldGFsQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudCc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQW5pbWF0aW9uSW50ZXJwb2xhdGlvbiB9IGZyb20gJy4uL2RlZmluaXRpb25zL0FuaW1hdGlvbkludGVycG9sYXRpb24nO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENhbWVyYVR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9DYW1lcmFUeXBlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBMaWdodFR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9MaWdodFR5cGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgU2RmU2hhcGVUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvU2RmU2hhcGVUeXBlJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzTmFtZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgeyBTaGFkaW5nTW9kZWwgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9TaGFkaW5nTW9kZWwnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uL2RlZmluaXRpb25zL1RleHR1cmVQYXJhbWV0ZXInO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlLCB0eXBlIFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZyB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSAnLi4vZ2VvbWV0cnkvTWVzaCc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUge1xuICBJQW5pbWF0aW9uRW50aXR5LFxuICBJQ2FtZXJhRW50aXR5LFxuICBJTGlnaHRFbnRpdHksXG4gIElNZXNoRW50aXR5LFxuICBJUmF5bWFyY2hpbmdFbnRpdHksXG4gIElTY2VuZUdyYXBoRW50aXR5LFxufSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBhdHRhY2hMaWdodFNoYWRvd0NhbWVyYSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwgfSBmcm9tICcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsJztcbmltcG9ydCB7IGNyZWF0ZVBiclViZXJNYXRlcmlhbCB9IGZyb20gJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZVBiclViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHsgQW5pbWF0ZWRRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vbWF0aC9BbmltYXRlZFF1YXRlcm5pb24nO1xuaW1wb3J0IHsgQW5pbWF0ZWRTY2FsYXIgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkU2NhbGFyJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yMiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3IyJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3IzJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3I0JztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yTiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3JOJztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGVkVmFsdWUgfSBmcm9tICcuLi9tYXRoL0lBbmltYXRlZFZhbHVlJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi4vbWF0aC9NYXRoVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjIgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3IyJztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gJy4uL21hdGgvVmVjdG9yMic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICcuLi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyVmlldyB9IGZyb20gJy4uL21lbW9yeS9CdWZmZXJWaWV3JztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJQYXNzIH0gZnJvbSAnLi4vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgU2FtcGxlciB9IGZyb20gJy4uL3RleHR1cmVzL1NhbXBsZXInO1xuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gJy4uL3RleHR1cmVzL1RleHR1cmUnO1xuaW1wb3J0IHsgZGV0ZWN0Qm9uZURhdGFUeXBlRm9yU2tpbiB9IGZyb20gJy4vQm9uZURhdGFUeXBlRGV0ZWN0b3InO1xuaW1wb3J0IHsgcHJlbG9hZEtoclBoeXNpY3NTdXBwb3J0LCBzZXR1cEtoclN0YXRpY0NvbGxpZGVycyB9IGZyb20gJy4vS2hyUGh5c2ljc0ltcG9ydGVyJztcbmltcG9ydCB7IFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbiB9IGZyb20gJy4vUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uJztcblxuZGVjbGFyZSBsZXQgRHJhY29EZWNvZGVyTW9kdWxlOiBhbnk7XG5cbnR5cGUgQ3JlYXRlTVRvb24weE1hdGVyaWFsID0gdHlwZW9mIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24weE1hdGVyaWFsJykuY3JlYXRlTVRvb24weE1hdGVyaWFsO1xudHlwZSBDcmVhdGVNVG9vbjFNYXRlcmlhbCA9IHR5cGVvZiBpbXBvcnQoJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZU1Ub29uMU1hdGVyaWFsJykuY3JlYXRlTVRvb24xTWF0ZXJpYWw7XG5cbi8qKlxuICogTVRvb24gbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIGFyZSBsb2FkZWQgb24gZGVtYW5kLiBUaGV5IHB1bGwgaW4gdGhlIE1Ub29uIHNoYWRlcnMgYW5kIG1hdGVyaWFsIGNvbnRlbnRzLCB3aGljaFxuICogYSBwbGFpbiBnbFRGIG1vZGVsIG5ldmVyIHVzZXMuIFRoZSBpbXBvcnRlciBwcmVsb2FkcyB0aGVtIGJlZm9yZSBnZW5lcmF0aW5nIG1hdGVyaWFscyB3aGVuIHRoZSBtb2RlbCBhY3R1YWxseVxuICogY29udGFpbnMgVlJNIG1hdGVyaWFscywgc28gdGhlIHN5bmNocm9ub3VzIG1hdGVyaWFsIGZ1bmN0aW9ucyBjYW4gY2FsbCB0aGVtIHRocm91Z2ggdGhlc2UgdmFyaWFibGVzLlxuICovXG5sZXQgY3JlYXRlTVRvb24weE1hdGVyaWFsSW1wbDogQ3JlYXRlTVRvb24weE1hdGVyaWFsIHwgdW5kZWZpbmVkO1xubGV0IGNyZWF0ZU1Ub29uMU1hdGVyaWFsSW1wbDogQ3JlYXRlTVRvb24xTWF0ZXJpYWwgfCB1bmRlZmluZWQ7XG5cbnR5cGUgUmF5bWFyY2hpbmdDb21wb25lbnRDbGFzcyA9IHR5cGVvZiBpbXBvcnQoJy4uL2NvbXBvbmVudHMvUmF5bWFyY2hpbmcvUmF5bWFyY2hpbmdDb21wb25lbnQnKS5SYXltYXJjaGluZ0NvbXBvbmVudDtcblxuLyoqXG4gKiBUaGUgcmF5bWFyY2hpbmcgY29tcG9uZW50IChhbmQgaXRzIFNERiBldmFsdWF0b3IpIGlzIGxvYWRlZCBvbmx5IGZvciBtb2RlbHMgdGhhdCB1c2UgdGhlIFJIT0RPTklURV9yYXltYXJjaGluZ1xuICogZXh0ZW5zaW9uLiBBIHBsYWluIGdsVEYgYXBwbGljYXRpb24gbmV2ZXIgcGF5cyBmb3IgaXQuXG4gKi9cbmxldCByYXltYXJjaGluZ0NvbXBvbmVudENsYXNzOiBSYXltYXJjaGluZ0NvbXBvbmVudENsYXNzIHwgdW5kZWZpbmVkO1xubGV0IHJheW1hcmNoaW5nQ29tcG9uZW50UHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIGNvbnZlcnRlciBjbGFzcyBmcm9tIGdsVEYyIG1vZGVsIHRvIFJob2Rvbml0ZSBOYXRpdmUgZGF0YVxuICovXG5leHBvcnQgY2xhc3MgTW9kZWxDb252ZXJ0ZXIge1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgZ3JvdXAgZW50aXR5IGZvciB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBBIHNjZW5lIGdyYXBoIGVudGl0eSBjb25maWd1cmVkIGFzIGEgZ3JvdXBcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVHcm91cEVudGl0eShlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogSVNjZW5lR3JhcGhFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgc291cmNlIHR5cGUgYW5kIHZlcnNpb24gdGFncyB0byBhbiBlbnRpdHkgYmFzZWQgb24gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGVudGl0eSAtIFRoZSBlbnRpdHkgdG8gYWRkIHRhZ3MgdG9cbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGNvbnRhaW5pbmcgYXNzZXQgaW5mb3JtYXRpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFkZFRhZ3MoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgZW50aXR5LnRyeVRvU2V0VGFnKHtcbiAgICAgIHRhZzogJ1NvdXJjZVR5cGUnLFxuICAgICAgdmFsdWU6IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLmZpbGVUeXBlISxcbiAgICB9KTtcbiAgICBlbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAnU291cmNlVHlwZVZlcnNpb24nLFxuICAgICAgdmFsdWU6IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnZlcnNpb24hLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIG1lc2ggZW50aXR5IGZvciB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBBIG1lc2ggZW50aXR5IHdpdGggYXBwcm9wcmlhdGUgdGFnc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZU1lc2hFbnRpdHkoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IElNZXNoRW50aXR5IHtcbiAgICBjb25zdCBlbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIGNhbWVyYSBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgY2FtZXJhIGVudGl0eSB3aXRoIGFwcHJvcHJpYXRlIHRhZ3NcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVDYW1lcmFFbnRpdHkoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IElDYW1lcmFFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIHRydWUpO1xuICAgIHRoaXMuYWRkVGFncyhlbnRpdHksIGdsdGZNb2RlbCk7XG4gICAgcmV0dXJuIGVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBsaWdodCBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgbGlnaHQgZW50aXR5IHdpdGggYXBwcm9wcmlhdGUgdGFnc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZUxpZ2h0RW50aXR5KGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpOiBJTGlnaHRFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUxpZ2h0RW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgbWF0ZXJpYWxzIGZyb20gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAgICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAgICogQHJldHVybnMgQXJyYXkgb2YgY29uZmlndXJlZCBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTWF0ZXJpYWxzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIsIHJuVGV4dHVyZXM6IFRleHR1cmVbXSwgcm5TYW1wbGVyczogU2FtcGxlcltdKSB7XG4gICAgY29uc3Qgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10gPSBbXTtcbiAgICBpZiAoZ2x0Zk1vZGVsLm1hdGVyaWFscyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIGdsdGZNb2RlbC5tYXRlcmlhbHMpIHtcbiAgICAgICAgY29uc3Qgcm5NYXRlcmlhbCA9IHRoaXMuX19zZXR1cE1hdGVyaWFsKGVuZ2luZSwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzLCBtYXRlcmlhbCk7XG4gICAgICAgIHJuTWF0ZXJpYWxzLnB1c2gocm5NYXRlcmlhbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBybk1hdGVyaWFscztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgTVRvb24gbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIG9ubHkgd2hlbiB0aGUgbW9kZWwgYWN0dWFsbHkgdXNlcyBWUk0gbWF0ZXJpYWxzLlxuICAgKiBUaGlzIGtlZXBzIHRoZSBNVG9vbiBtYXRlcmlhbCBjb250ZW50cyBhbmQgc2hhZGVycyBvdXQgb2YgcGxhaW4gZ2xURiBhcHBsaWNhdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhIHRvIGluc3BlY3RcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX3ByZWxvYWRNVG9vbk1hdGVyaWFsU3VwcG9ydChnbHRmTW9kZWw6IFJuTTIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYXRlcmlhbHMgPSBnbHRmTW9kZWwubWF0ZXJpYWxzID8/IFtdO1xuICAgIGNvbnN0IG5lZWRzTVRvb24xID0gbWF0ZXJpYWxzLnNvbWUobWF0ZXJpYWwgPT4gbWF0ZXJpYWwuZXh0ZW5zaW9ucz8uVlJNQ19tYXRlcmlhbHNfbXRvb24gIT0gbnVsbCk7XG4gICAgY29uc3QgbmVlZHNNVG9vbjB4ID0gbWF0ZXJpYWxzLnNvbWUobWF0ZXJpYWwgPT4ge1xuICAgICAgY29uc3QgbWF0ZXJpYWxQcm9wZXJ0aWVzID0gbWF0ZXJpYWwuZXh0cmFzPy52cm0weE1hdGVyaWFsUHJvcGVydHkgYXMgVnJtMHhNYXRlcmlhbFByb3BlcnR5IHwgdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIG1hdGVyaWFsUHJvcGVydGllcz8uc2hhZGVyID09PSAnVlJNL01Ub29uJztcbiAgICB9KTtcblxuICAgIGNvbnN0IGxvYWRzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcbiAgICBpZiAobmVlZHNNVG9vbjEgJiYgY3JlYXRlTVRvb24xTWF0ZXJpYWxJbXBsID09IG51bGwpIHtcbiAgICAgIGxvYWRzLnB1c2goXG4gICAgICAgIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24xTWF0ZXJpYWwnKS50aGVuKG1vZHVsZSA9PiB7XG4gICAgICAgICAgY3JlYXRlTVRvb24xTWF0ZXJpYWxJbXBsID0gbW9kdWxlLmNyZWF0ZU1Ub29uMU1hdGVyaWFsO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG5lZWRzTVRvb24weCAmJiBjcmVhdGVNVG9vbjB4TWF0ZXJpYWxJbXBsID09IG51bGwpIHtcbiAgICAgIGxvYWRzLnB1c2goXG4gICAgICAgIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24weE1hdGVyaWFsJykudGhlbihtb2R1bGUgPT4ge1xuICAgICAgICAgIGNyZWF0ZU1Ub29uMHhNYXRlcmlhbEltcGwgPSBtb2R1bGUuY3JlYXRlTVRvb24weE1hdGVyaWFsO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwobG9hZHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSByYXltYXJjaGluZyBjb21wb25lbnQgb25seSB3aGVuIGEgbm9kZSB1c2VzIHRoZSBSSE9ET05JVEVfcmF5bWFyY2hpbmcgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YSB0byBpbnNwZWN0XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHByZWxvYWRSYXltYXJjaGluZ1N1cHBvcnQoZ2x0Zk1vZGVsOiBSbk0yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXNlc1JheW1hcmNoaW5nID0gKGdsdGZNb2RlbC5ub2RlcyA/PyBbXSkuc29tZShub2RlID0+IHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbnMgPSBub2RlLmV4dGVuc2lvbnMgYXMgeyBSSE9ET05JVEVfcmF5bWFyY2hpbmc/OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gZXh0ZW5zaW9ucz8uUkhPRE9OSVRFX3JheW1hcmNoaW5nICE9IG51bGw7XG4gICAgfSk7XG4gICAgaWYgKCF1c2VzUmF5bWFyY2hpbmcgfHwgcmF5bWFyY2hpbmdDb21wb25lbnRDbGFzcyAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyYXltYXJjaGluZ0NvbXBvbmVudFByb21pc2UgPT0gbnVsbCkge1xuICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnRQcm9taXNlID0gaW1wb3J0KCcuLi9jb21wb25lbnRzL1JheW1hcmNoaW5nL1JheW1hcmNoaW5nQ29tcG9uZW50JykudGhlbihtb2R1bGUgPT4ge1xuICAgICAgICByYXltYXJjaGluZ0NvbXBvbmVudENsYXNzID0gbW9kdWxlLlJheW1hcmNoaW5nQ29tcG9uZW50O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGF3YWl0IHJheW1hcmNoaW5nQ29tcG9uZW50UHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgc2hlZW4gTFVUIGJlZm9yZSBtYXRlcmlhbHMgYXJlIGNyZWF0ZWQgd2hlbiB0aGUgbW9kZWwgdXNlcyBLSFJfbWF0ZXJpYWxzX3NoZWVuLlxuICAgKlxuICAgKiBBIFdlYkdQVSBiaW5kIGdyb3VwIGNyZWF0ZWQgd2hpbGUgdGhlIExVVCB0ZXh0dXJlIGhhcyBubyBHUFUgcmVzb3VyY2Uga2VlcHMgdGhlIHBsYWNlaG9sZGVyIGJpbmRpbmcsIHNvXG4gICAqIHRoZSBpbXBvcnRlciB3YWl0cyBmb3IgdGhlIHRleHR1cmUgaW5zdGVhZCBvZiByZWx5aW5nIG9uIHRoZSBsYXp5IGJhY2tncm91bmQgbG9hZCBpbiB0aGUgbWF0ZXJpYWwgZmFjdG9yeS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGEgdG8gaW5zcGVjdFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fcHJlbG9hZFNoZWVuTHV0VGV4dHVyZShlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbWF0ZXJpYWxzID0gZ2x0Zk1vZGVsLm1hdGVyaWFscyA/PyBbXTtcbiAgICBjb25zdCB1c2VzU2hlZW4gPSBtYXRlcmlhbHMuc29tZShtYXRlcmlhbCA9PiBtYXRlcmlhbC5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3NoZWVuICE9IG51bGwpO1xuICAgIGlmICghdXNlc1NoZWVuKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBlbmdpbmUuZHVtbXlUZXh0dXJlcy5sb2FkU2hlZW5MdXRUZXh0dXJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oYEZhaWxlZCB0byBsb2FkIHRoZSBzaGVlbiBMVVQgdGV4dHVyZTogJHtlcnJvcn1gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0ZXh0dXJlcyBmcm9tIHRoZSBnbFRGIG1vZGVsIGFzeW5jaHJvbm91c2x5XG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19zZXR1cFRleHR1cmVzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCByblRleHR1cmVzOiBUZXh0dXJlW10gPSBbXTtcbiAgICBpZiAoZ2x0Zk1vZGVsLmltYWdlcyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIGdsdGZNb2RlbC5pbWFnZXMpIHtcbiAgICAgICAgY29uc3Qgcm5UZXh0dXJlID0gYXdhaXQgdGhpcy5fY3JlYXRlVGV4dHVyZShlbmdpbmUsIGltYWdlLCBnbHRmTW9kZWwpO1xuICAgICAgICByblRleHR1cmVzLnB1c2gocm5UZXh0dXJlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJuVGV4dHVyZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBzYW1wbGVycyBmcm9tIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVTYW1wbGVycyhlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgY29uc3Qgcm5TYW1wbGVyczogU2FtcGxlcltdID0gW107XG4gICAgaWYgKGdsdGZNb2RlbC5zYW1wbGVycyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IHNhbXBsZXIgb2YgZ2x0Zk1vZGVsLnNhbXBsZXJzKSB7XG4gICAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHRoaXMuX2NyZWF0ZVNhbXBsZXIoZW5naW5lLCBzYW1wbGVyKTtcbiAgICAgICAgcm5TYW1wbGVycy5wdXNoKHJuU2FtcGxlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByblNhbXBsZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgZ2xURiBtb2RlbCB0byBSaG9kb25pdGUgb2JqZWN0cyBzeW5jaHJvbm91c2x5ICh3aXRob3V0IHRleHR1cmUgbG9hZGluZylcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGEgdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBUaGUgcm9vdCBncm91cCBlbnRpdHkgY29udGFpbmluZyB0aGUgY29udmVydGVkIHNjZW5lXG4gICAqL1xuICBzdGF0aWMgY29udmVydFRvUmhvZG9uaXRlT2JqZWN0U2ltcGxlKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyBhcyBhbnkpLnJuTWVzaGVzQXRHbHRNZXNoSWR4ID0gW107XG5cbiAgICBjb25zdCBybkJ1ZmZlcnMgPSB0aGlzLl9fY3JlYXRlUm5CdWZmZXIoZ2x0Zk1vZGVsKTtcbiAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybk1hdGVyaWFscyA9IHt9O1xuXG4gICAgY29uc3Qgcm5UZXh0dXJlczogVGV4dHVyZVtdID0gW107XG4gICAgY29uc3Qgcm5TYW1wbGVyczogU2FtcGxlcltdID0gW107XG5cbiAgICAvLyBNYXRlcmlhbHNcbiAgICBjb25zdCBybk1hdGVyaWFscyA9IHRoaXMuX19zZXR1cE1hdGVyaWFscyhlbmdpbmUsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgICAvLyBNZXNoLCBDYW1lcmEsIEdyb3VwLCAuLi5cbiAgICBjb25zdCB7IHJuRW50aXRpZXMsIHJuRW50aXRpZXNCeU5hbWVzIH0gPSB0aGlzLl9fc2V0dXBPYmplY3RzKFxuICAgICAgZW5naW5lLFxuICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgcm5CdWZmZXJzLFxuICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICByblRleHR1cmVzLFxuICAgICAgcm5TYW1wbGVyc1xuICAgICk7XG4gICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyA9IHJuRW50aXRpZXM7XG5cbiAgICAvLyBUcmFuc2Zvcm1cbiAgICB0aGlzLl9zZXR1cFRyYW5zZm9ybShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgY29uc3Qgcm9vdEdyb3VwID0gdGhpcy5fX2dlbmVyYXRlR3JvdXBFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuXG4gICAgLy8gQW5pbWF0aW9uXG4gICAgdGhpcy5fc2V0dXBBbmltYXRpb24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycywgcm9vdEdyb3VwLCBybk1hdGVyaWFscyk7XG5cbiAgICAvLyBTa2VsZXRvblxuICAgIHRoaXMuX3NldHVwU2tlbGV0b24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycyk7XG5cbiAgICAvLyBIaWVyYXJjaHlcbiAgICB0aGlzLl9zZXR1cEhpZXJhcmNoeShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgc2V0dXBLaHJTdGF0aWNDb2xsaWRlcnMoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIHRoaXMuX19zZXR1cE5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBpZiAoZ2x0Zk1vZGVsLnNjZW5lc1swXS5ub2Rlcykge1xuICAgICAgZm9yIChjb25zdCBub2Rlc0luZGV4IG9mIGdsdGZNb2RlbC5zY2VuZXNbMF0ubm9kZXMpIHtcbiAgICAgICAgY29uc3Qgc2cgPSBybkVudGl0aWVzW25vZGVzSW5kZXhdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcm9vdEdyb3VwLmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChzZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKElzLm5vdC5leGlzdChnbHRmTW9kZWwuZXh0cmFzKSkge1xuICAgICAgKGdsdGZNb2RlbCBhcyBhbnkpLmV4dHJhcyA9IHt9O1xuICAgIH1cbiAgICBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXMgPSBybkVudGl0aWVzO1xuICAgIGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc0J5TmFtZXMgPSBybkVudGl0aWVzQnlOYW1lcztcblxuICAgIHJldHVybiByb290R3JvdXA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBnbFRGIG1vZGVsIHRvIFJob2Rvbml0ZSBvYmplY3RzIGFzeW5jaHJvbm91c2x5ICh3aXRoIGZ1bGwgdGV4dHVyZSBsb2FkaW5nKVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YSB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSByb290IGdyb3VwIGVudGl0eSBjb250YWluaW5nIHRoZSBjb252ZXJ0ZWQgc2NlbmVcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMikge1xuICAgIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIGFzIGFueSkucm5NZXNoZXNBdEdsdE1lc2hJZHggPSBbXTtcblxuICAgIGNvbnN0IHJuQnVmZmVycyA9IHRoaXMuX19jcmVhdGVSbkJ1ZmZlcihnbHRmTW9kZWwpO1xuICAgIGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTWF0ZXJpYWxzID0ge307XG5cbiAgICBjb25zdCByblRleHR1cmVzID0gYXdhaXQgdGhpcy5fX3NldHVwVGV4dHVyZXMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IHJuU2FtcGxlcnMgPSB0aGlzLl9fY3JlYXRlU2FtcGxlcnMoZW5naW5lLCBnbHRmTW9kZWwpO1xuXG4gICAgLy8gT3B0aW9uYWwgbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIGFuZCB0aGUgcmF5bWFyY2hpbmcgY29tcG9uZW50IHN0YXkgb3V0IG9mIGFwcGxpY2F0aW9ucyB0aGF0IGRvIG5vdCB1c2UgdGhlbS5cbiAgICBhd2FpdCB0aGlzLl9fcHJlbG9hZE1Ub29uTWF0ZXJpYWxTdXBwb3J0KGdsdGZNb2RlbCk7XG4gICAgYXdhaXQgUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLnByZWxvYWROb2RlQmFzZWRNYXRlcmlhbFN1cHBvcnQoZ2x0Zk1vZGVsKTtcbiAgICBhd2FpdCB0aGlzLnByZWxvYWRSYXltYXJjaGluZ1N1cHBvcnQoZ2x0Zk1vZGVsKTtcbiAgICBhd2FpdCB0aGlzLl9fcHJlbG9hZFNoZWVuTHV0VGV4dHVyZShlbmdpbmUsIGdsdGZNb2RlbCk7XG5cbiAgICAvLyBNYXRlcmlhbHNcbiAgICBjb25zdCBybk1hdGVyaWFscyA9IHRoaXMuX19zZXR1cE1hdGVyaWFscyhlbmdpbmUsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgICAvLyBNZXNoLCBDYW1lcmEsIEdyb3VwLCAuLi5cbiAgICBjb25zdCB7IHJuRW50aXRpZXMsIHJuRW50aXRpZXNCeU5hbWVzIH0gPSB0aGlzLl9fc2V0dXBPYmplY3RzKFxuICAgICAgZW5naW5lLFxuICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgcm5CdWZmZXJzLFxuICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICByblRleHR1cmVzLFxuICAgICAgcm5TYW1wbGVyc1xuICAgICk7XG4gICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyA9IHJuRW50aXRpZXM7XG5cbiAgICAvLyBUcmFuc2Zvcm1cbiAgICB0aGlzLl9zZXR1cFRyYW5zZm9ybShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgY29uc3Qgcm9vdEdyb3VwID0gdGhpcy5fX2dlbmVyYXRlR3JvdXBFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuXG4gICAgLy8gQW5pbWF0aW9uXG4gICAgdGhpcy5fc2V0dXBBbmltYXRpb24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycywgcm9vdEdyb3VwLCBybk1hdGVyaWFscyk7XG5cbiAgICAvLyBTa2VsZXRvblxuICAgIHRoaXMuX3NldHVwU2tlbGV0b24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycyk7XG5cbiAgICAvLyBIaWVyYXJjaHlcbiAgICB0aGlzLl9zZXR1cEhpZXJhcmNoeShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgLy8gUmFwaWVyIGlzIGxvYWRlZCBvbmx5IGZvciBtb2RlbHMgdGhhdCB1c2UgS0hSX3BoeXNpY3NfcmlnaWRfYm9kaWVzLlxuICAgIGF3YWl0IHByZWxvYWRLaHJQaHlzaWNzU3VwcG9ydChnbHRmTW9kZWwpO1xuICAgIHNldHVwS2hyU3RhdGljQ29sbGlkZXJzKGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICB0aGlzLl9fc2V0dXBOb2RlVmlzaWJpbGl0eShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgcm9vdEdyb3VwLnRyeVRvU2V0VW5pcXVlTmFtZSgnRmlsZVJvb3QnLCB0cnVlKTtcbiAgICByb290R3JvdXAudHJ5VG9TZXRUYWcoeyB0YWc6ICdPYmplY3RUeXBlJywgdmFsdWU6ICd0b3AnIH0pO1xuICAgIGlmIChnbHRmTW9kZWwuc2NlbmVzWzBdLm5vZGVzKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vZGVzSW5kZXggb2YgZ2x0Zk1vZGVsLnNjZW5lc1swXS5ub2Rlcykge1xuICAgICAgICBjb25zdCBzZyA9IHJuRW50aXRpZXNbbm9kZXNJbmRleF0uZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByb290R3JvdXAuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHNnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zO1xuICAgICAgaWYgKG9wdGlvbnM/LmxvYWRlckV4dGVuc2lvbj8ubG9hZEV4dGVuc2lvbkluZm9BbmRTZXRUb1Jvb3RHcm91cCkge1xuICAgICAgICBvcHRpb25zLmxvYWRlckV4dGVuc2lvbi5sb2FkRXh0ZW5zaW9uSW5mb0FuZFNldFRvUm9vdEdyb3VwKHJvb3RHcm91cCwgZ2x0Zk1vZGVsKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zPy5leHByZXNzaW9uKSB7XG4gICAgICAgIG9wdGlvbnMuZXhwcmVzc2lvbi50cnlUb1NldFRhZyh7XG4gICAgICAgICAgdGFnOiAnZ2x0Zk1vZGVsJyxcbiAgICAgICAgICB2YWx1ZTogZ2x0Zk1vZGVsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByb290R3JvdXAuYWxsTWVzaGVzID0gcm9vdEdyb3VwLnNlYXJjaEVsZW1lbnRzQnlUeXBlKE1fTWVzaCk7XG4gICAgcm9vdEdyb3VwLnRyeVRvU2V0VGFnKHsgdGFnOiAncm5FbnRpdGllcycsIHZhbHVlOiBybkVudGl0aWVzIH0pO1xuICAgIHJvb3RHcm91cC50cnlUb1NldFRhZyh7IHRhZzogJ3JuRW50aXRpZXNCeU5hbWVzJywgdmFsdWU6IHJuRW50aXRpZXNCeU5hbWVzIH0pO1xuICAgIHJvb3RHcm91cC50cnlUb1NldFRhZyh7IHRhZzogJ2dsdGZNb2RlbCcsIHZhbHVlOiBnbHRmTW9kZWwgfSk7XG4gICAgaWYgKElzLm5vdC5leGlzdChnbHRmTW9kZWwuZXh0cmFzKSkge1xuICAgICAgKGdsdGZNb2RlbCBhcyBhbnkpLmV4dHJhcyA9IHt9O1xuICAgIH1cbiAgICBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXMgPSBybkVudGl0aWVzO1xuICAgIGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc0J5TmFtZXMgPSBybkVudGl0aWVzQnlOYW1lcztcblxuICAgIC8vIEVmZmVrc2VlclxuICAgIFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbi5pbXBvcnRFZmZlY3Qocm9vdEdyb3VwLmVuZ2luZSwgZ2x0Zk1vZGVsLCByb290R3JvdXApO1xuXG4gICAgLy8gQmlsbGJvYXJkXG4gICAgUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLmltcG9ydEJpbGxib2FyZChnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgaWYgKElzLmV4aXN0KGdsdGZNb2RlbC5leHRlbnNpb25zVXNlZCkpIHtcbiAgICAgIGlmIChnbHRmTW9kZWwuZXh0ZW5zaW9uc1VzZWQuaW5kZXhPZignVlJNQ192cm0nKSA+IDApIHtcbiAgICAgICAgLy8gdGhpcy5fX2dlbmVyYXRlVnJtTm9ybWFsaXplZFNrZWxldG9uKGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3RHcm91cDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFJob2Rvbml0ZSBidWZmZXJzIGZyb20gZ2xURiBidWZmZXIgZGF0YVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgY29udGFpbmluZyBidWZmZXIgZGF0YVxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBSaG9kb25pdGUgQnVmZmVyIG9iamVjdHNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY3JlYXRlUm5CdWZmZXIoZ2x0Zk1vZGVsOiBSbk0yKTogQnVmZmVyW10ge1xuICAgIGNvbnN0IHJuQnVmZmVycyA9IFtdO1xuICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGdsdGZNb2RlbC5idWZmZXJzID8/IFtdKSB7XG4gICAgICBjb25zdCBybkJ1ZmZlciA9IG5ldyBCdWZmZXIoe1xuICAgICAgICBieXRlTGVuZ3RoOiBidWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgICAgYnVmZmVyOiBidWZmZXIuYnVmZmVyIGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgIG5hbWU6IGBnbHRmMkJ1ZmZlcl8wXygke2J1ZmZlci51cml9KWAsXG4gICAgICAgIGJ5dGVBbGlnbjogNCxcbiAgICAgICAgYnVmZmVyVXNhZ2U6IEJ1ZmZlclVzZS5DUFVHZW5lcmljLFxuICAgICAgICBpbmRleE9mVGhlQnVmZmVyVXNhZ2U6IDAsXG4gICAgICB9KTtcbiAgICAgIHJuQnVmZmVycy5wdXNoKHJuQnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJuQnVmZmVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGZvciBlbnRpdGllcyBmcm9tIGdsVEYgbm9kZSBkYXRhXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBncm91cHMgLSBBcnJheSBvZiBzY2VuZSBncmFwaCBlbnRpdGllcyB0byBhcHBseSB0cmFuc2Zvcm1zIHRvXG4gICAqL1xuICBzdGF0aWMgX3NldHVwVHJhbnNmb3JtKGdsdGZNb2RlbDogUm5NMiwgZ3JvdXBzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgZm9yIChjb25zdCBub2RlX2kgaW4gZ2x0Zk1vZGVsLm5vZGVzKSB7XG4gICAgICBjb25zdCBncm91cCA9IGdyb3Vwc1tub2RlX2ldO1xuICAgICAgY29uc3Qgbm9kZUpzb24gPSBnbHRmTW9kZWwubm9kZXNbbm9kZV9pXTtcbiAgICAgIGNvbnN0IGdyb3VwVHJhbnNmb3JtID0gZ3JvdXAuZ2V0VHJhbnNmb3JtKCkhO1xuICAgICAgaWYgKG5vZGVKc29uLnRyYW5zbGF0aW9uKSB7XG4gICAgICAgIGdyb3VwVHJhbnNmb3JtLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgICAgIG5vZGVKc29uLnRyYW5zbGF0aW9uWzBdLFxuICAgICAgICAgIG5vZGVKc29uLnRyYW5zbGF0aW9uWzFdLFxuICAgICAgICAgIG5vZGVKc29uLnRyYW5zbGF0aW9uWzJdLFxuICAgICAgICBdKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlSnNvbi5zY2FsZSkge1xuICAgICAgICBncm91cFRyYW5zZm9ybS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtub2RlSnNvbi5zY2FsZVswXSwgbm9kZUpzb24uc2NhbGVbMV0sIG5vZGVKc29uLnNjYWxlWzJdXSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZUpzb24ucm90YXRpb24pIHtcbiAgICAgICAgZ3JvdXBUcmFuc2Zvcm0ubG9jYWxSb3RhdGlvbiA9IFF1YXRlcm5pb24uZnJvbUNvcHk0KFxuICAgICAgICAgIG5vZGVKc29uLnJvdGF0aW9uWzBdLFxuICAgICAgICAgIG5vZGVKc29uLnJvdGF0aW9uWzFdLFxuICAgICAgICAgIG5vZGVKc29uLnJvdGF0aW9uWzJdLFxuICAgICAgICAgIG5vZGVKc29uLnJvdGF0aW9uWzNdXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZUpzb24ubWF0cml4KSB7XG4gICAgICAgIGdyb3VwVHJhbnNmb3JtLmxvY2FsTWF0cml4ID0gTWF0cml4NDQuZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKG5vZGVKc29uLm1hdHJpeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdGhlIGhpZXJhcmNoeSByZWxhdGlvbnNoaXBzIGJldHdlZW4gZW50aXRpZXMgYmFzZWQgb24gZ2xURiBub2RlIHN0cnVjdHVyZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllcyB0byBvcmdhbml6ZSBpbiBoaWVyYXJjaHlcbiAgICovXG4gIHN0YXRpYyBfc2V0dXBIaWVyYXJjaHkoZ2x0Zk1vZGVsOiBSbk0yLCBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgY29uc3QgZ3JvdXBTY2VuZUNvbXBvbmVudHMgPSBybkVudGl0aWVzLm1hcChncm91cCA9PiB7XG4gICAgICByZXR1cm4gZ3JvdXAuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICB9KTtcblxuICAgIGZvciAoY29uc3Qgbm9kZV9pIGluIGdsdGZNb2RlbC5ub2Rlcykge1xuICAgICAgY29uc3QgcGFyZW50Tm9kZV9pID0gTnVtYmVyLnBhcnNlSW50KG5vZGVfaSwgMTApO1xuICAgICAgY29uc3QgZ2xURjJQYXJlbnROb2RlID0gZ2x0Zk1vZGVsLm5vZGVzW3BhcmVudE5vZGVfaV07XG4gICAgICBpZiAoSXMuZXhpc3QoZ2xURjJQYXJlbnROb2RlLmNoaWxkcmVuKSkge1xuICAgICAgICBjb25zdCByblBhcmVudFNjZW5lR3JhcGhDb21wb25lbnQgPSBncm91cFNjZW5lQ29tcG9uZW50c1twYXJlbnROb2RlX2ldO1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkTm9kZV9pIG9mIGdsVEYyUGFyZW50Tm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgIGNvbnN0IHJuQ2hpbGRTY2VuZUdyYXBoQ29tcG9uZW50ID0gZ3JvdXBTY2VuZUNvbXBvbmVudHNbY2hpbGROb2RlX2ldO1xuICAgICAgICAgIHJuUGFyZW50U2NlbmVHcmFwaENvbXBvbmVudC5hZGRDaGlsZChybkNoaWxkU2NlbmVHcmFwaENvbXBvbmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTm9kZVZpc2liaWxpdHkoZ2x0Zk1vZGVsOiBSbk0yLCBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgY29uc3QgdmlzaXRlZE5vZGVJbmRpY2VzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgY29uc3Qgc2NlbmVSb290Tm9kZUluZGljZXMgPSBnbHRmTW9kZWwuc2NlbmVzPy5bMF0/Lm5vZGVzID8/IFtdO1xuXG4gICAgZm9yIChjb25zdCBub2RlSW5kZXggb2Ygc2NlbmVSb290Tm9kZUluZGljZXMpIHtcbiAgICAgIHRoaXMuX19hcHBseU5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbCwgcm5FbnRpdGllcywgbm9kZUluZGV4LCB0cnVlLCB2aXNpdGVkTm9kZUluZGljZXMpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgbm9kZUluZGV4U3RyaW5nIGluIGdsdGZNb2RlbC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZUluZGV4ID0gTnVtYmVyLnBhcnNlSW50KG5vZGVJbmRleFN0cmluZywgMTApO1xuICAgICAgaWYgKCF2aXNpdGVkTm9kZUluZGljZXMuaGFzKG5vZGVJbmRleCkpIHtcbiAgICAgICAgdGhpcy5fX2FwcGx5Tm9kZVZpc2liaWxpdHkoZ2x0Zk1vZGVsLCBybkVudGl0aWVzLCBub2RlSW5kZXgsIHRydWUsIHZpc2l0ZWROb2RlSW5kaWNlcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19hcHBseU5vZGVWaXNpYmlsaXR5KFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIG5vZGVJbmRleDogbnVtYmVyLFxuICAgIHBhcmVudFZpc2libGU6IGJvb2xlYW4sXG4gICAgdmlzaXRlZE5vZGVJbmRpY2VzOiBTZXQ8bnVtYmVyPlxuICApIHtcbiAgICBpZiAodmlzaXRlZE5vZGVJbmRpY2VzLmhhcyhub2RlSW5kZXgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZpc2l0ZWROb2RlSW5kaWNlcy5hZGQobm9kZUluZGV4KTtcblxuICAgIGNvbnN0IG5vZGUgPSBnbHRmTW9kZWwubm9kZXNbbm9kZUluZGV4XTtcbiAgICBjb25zdCBlbnRpdHkgPSBybkVudGl0aWVzW25vZGVJbmRleF07XG4gICAgaWYgKElzLm5vdC5leGlzdChub2RlKSB8fCBJcy5ub3QuZXhpc3QoZW50aXR5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxvY2FsVmlzaWJsZSA9IHRoaXMuX19nZXROb2RlVmlzaWJpbGl0eShub2RlKTtcbiAgICBlbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6IFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSwgdmFsdWU6IGxvY2FsVmlzaWJsZSB9KTtcbiAgICBpZiAoSXMuZXhpc3Qobm9kZS5leHRlbnNpb25zPy5LSFJfbm9kZV92aXNpYmlsaXR5KSkge1xuICAgICAgZW50aXR5LnRyeVRvU2V0VGFnKHsgdGFnOiBUYWdLaHJOb2RlVmlzaWJpbGl0eUVuYWJsZWQsIHZhbHVlOiB0cnVlIH0pO1xuICAgIH1cbiAgICBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSA9IHBhcmVudFZpc2libGUgJiYgbG9jYWxWaXNpYmxlO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZE5vZGVJbmRleCBvZiBub2RlLmNoaWxkcmVuID8/IFtdKSB7XG4gICAgICB0aGlzLl9fYXBwbHlOb2RlVmlzaWJpbGl0eShcbiAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICBjaGlsZE5vZGVJbmRleCxcbiAgICAgICAgcGFyZW50VmlzaWJsZSAmJiBsb2NhbFZpc2libGUsXG4gICAgICAgIHZpc2l0ZWROb2RlSW5kaWNlc1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldE5vZGVWaXNpYmlsaXR5KG5vZGU6IFJuTTJOb2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gbm9kZS5leHRlbnNpb25zPy5LSFJfbm9kZV92aXNpYmlsaXR5IGFzIEtIUl9ub2RlX3Zpc2liaWxpdHkgfCB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGV4dGVuc2lvbj8udmlzaWJsZSA/PyB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYW5pbWF0aW9uIGRhdGEgZnJvbSBnbFRGIGFuaW1hdGlvbnNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIHJuQnVmZmVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBidWZmZXJzXG4gICAqIEBwYXJhbSByb290R3JvdXAgLSBUaGUgcm9vdCBncm91cCBlbnRpdHlcbiAgICogQHBhcmFtIHJuTWF0ZXJpYWxzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIG1hdGVyaWFsc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfc2V0dXBBbmltYXRpb24oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgcm5CdWZmZXJzOiBCdWZmZXJbXSxcbiAgICByb290R3JvdXA6IElTY2VuZUdyYXBoRW50aXR5LFxuICAgIHJuTWF0ZXJpYWxzOiBNYXRlcmlhbFtdXG4gICkge1xuICAgIGlmIChnbHRmTW9kZWwuYW5pbWF0aW9ucyA9PSBudWxsIHx8IGdsdGZNb2RlbC5hbmltYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJvb3RHcm91cC5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25TdGF0ZUNvbXBvbmVudCwgcm9vdEdyb3VwKTtcblxuICAgIGZvciAoY29uc3QgYW5pbWF0aW9uIG9mIGdsdGZNb2RlbC5hbmltYXRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IHNhbXBsZXIgb2YgYW5pbWF0aW9uLnNhbXBsZXJzKSB7XG4gICAgICAgIHRoaXMuX3JlYWRCaW5hcnlGcm9tQWNjZXNzb3JBbmRTZXRJdFRvQWNjZXNzb3JFeHRyYXMoZW5naW5lLCBzYW1wbGVyLmlucHV0T2JqZWN0ISwgcm5CdWZmZXJzKTtcbiAgICAgICAgdGhpcy5fcmVhZEJpbmFyeUZyb21BY2Nlc3NvckFuZFNldEl0VG9BY2Nlc3NvckV4dHJhcyhlbmdpbmUsIHNhbXBsZXIub3V0cHV0T2JqZWN0ISwgcm5CdWZmZXJzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBnbHRmTW9kZWwuYW5pbWF0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBjaGFubmVsIG9mIGFuaW1hdGlvbi5jaGFubmVscykge1xuICAgICAgICBpZiAoSXMuZXhpc3QoY2hhbm5lbC5zYW1wbGVyT2JqZWN0KSkge1xuICAgICAgICAgIGNvbnN0IHNhbXBsZXJPYmplY3QgPSBjaGFubmVsLnNhbXBsZXJPYmplY3Q7XG4gICAgICAgICAgY29uc3QgYW5pbUlucHV0QXJyYXkgPSBzYW1wbGVyT2JqZWN0LmlucHV0T2JqZWN0IS5leHRyYXMhLnR5cGVkRGF0YUFycmF5ITtcbiAgICAgICAgICBjb25zdCBhbmltT3V0cHV0QXJyYXkgPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS50eXBlZERhdGFBcnJheSE7XG4gICAgICAgICAgY29uc3QgaW50ZXJwb2xhdGlvbiA9IHNhbXBsZXJPYmplY3QuaW50ZXJwb2xhdGlvbiA/PyAnTElORUFSJztcblxuICAgICAgICAgIGxldCBhbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZSA9ICd1bmRlZmluZWQnO1xuICAgICAgICAgIGlmIChjaGFubmVsLnRhcmdldC5wYXRoID09PSAndHJhbnNsYXRpb24nKSB7XG4gICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID0gJ3RyYW5zbGF0ZSc7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaGFubmVsLnRhcmdldC5wYXRoID09PSAncm90YXRpb24nKSB7XG4gICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID0gJ3F1YXRlcm5pb24nO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID0gJ21hdGVyaWFsLyc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSBjaGFubmVsLnRhcmdldC5wYXRoIGFzIEFuaW1hdGlvblBhdGhOYW1lO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaGFubmVsLnRhcmdldC5wYXRoID09PSAncG9pbnRlcicpIHtcbiAgICAgICAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0UG9pbnRlckFuaW1hdGlvbihcbiAgICAgICAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgICAgICAgY2hhbm5lbCxcbiAgICAgICAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlLFxuICAgICAgICAgICAgICBybk1hdGVyaWFscyxcbiAgICAgICAgICAgICAgZ2x0Zk1vZGVsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBNb2RlbENvbnZlcnRlci5fX3NldE5vcm1hbEFuaW1hdGlvbihcbiAgICAgICAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgICAgICAgY2hhbm5lbCxcbiAgICAgICAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHBvaW50ZXItYmFzZWQgYW5pbWF0aW9uIGZvciBtYXRlcmlhbHMsIG5vZGVzLCBsaWdodHMsIGFuZCBjYW1lcmFzXG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBjaGFubmVsIC0gQW5pbWF0aW9uIGNoYW5uZWwgZGF0YVxuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICogQHBhcmFtIHJuTWF0ZXJpYWxzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRQb2ludGVyQW5pbWF0aW9uKFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgY2hhbm5lbDogUm5NMkFuaW1hdGlvbkNoYW5uZWwsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lLFxuICAgIHJuTWF0ZXJpYWxzOiBNYXRlcmlhbFtdLFxuICAgIGdsdGZNb2RlbDogUm5NMlxuICApIHtcbiAgICBjb25zdCBwb2ludGVyID0gY2hhbm5lbC50YXJnZXQuZXh0ZW5zaW9ucyEuS0hSX2FuaW1hdGlvbl9wb2ludGVyLnBvaW50ZXIgYXMgc3RyaW5nO1xuICAgIGNvbnN0IG1hdGNoTm9kZXMgPSBwb2ludGVyLm1hdGNoKC9eXFwvbm9kZXNcXC8oWzAtOV0rKVxcLy8pO1xuICAgIGNvbnN0IG1hdGNoTWF0ZXJpYWxzID0gcG9pbnRlci5tYXRjaCgvXlxcL21hdGVyaWFsc1xcLyhbMC05XSspXFwvLyk7XG4gICAgY29uc3QgbWF0Y2hMaWdodHMgPSBwb2ludGVyLm1hdGNoKC9eXFwvZXh0ZW5zaW9uc1xcL0tIUl9saWdodHNfcHVuY3R1YWxcXC9saWdodHNcXC8oWzAtOV0rKVxcLy8pO1xuICAgIGNvbnN0IG1hdGNoQ2FtZXJhcyA9IHBvaW50ZXIubWF0Y2goL15cXC9jYW1lcmFzXFwvKFswLTldKylcXC8vKTtcbiAgICBpZiAobWF0Y2hNYXRlcmlhbHMpIHtcbiAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0UG9pbnRlckFuaW1hdGlvbk1hdGVyaWFscyhcbiAgICAgICAgbWF0Y2hNYXRlcmlhbHMsXG4gICAgICAgIHJuTWF0ZXJpYWxzLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICBhbmltYXRpb24sXG4gICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGVcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChtYXRjaE5vZGVzKSB7XG4gICAgICBNb2RlbENvbnZlcnRlci5fX3NldFBvaW50ZXJBbmltYXRpb25Ob2RlcyhcbiAgICAgICAgbWF0Y2hOb2RlcyxcbiAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hMaWdodHMpIHtcbiAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0UG9pbnRlckFuaW1hdGlvbkxpZ2h0cyhcbiAgICAgICAgbWF0Y2hMaWdodHMsXG4gICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSxcbiAgICAgICAgZ2x0Zk1vZGVsXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hDYW1lcmFzKSB7XG4gICAgICBNb2RlbENvbnZlcnRlci5fX3NldFBvaW50ZXJBbmltYXRpb25DYW1lcmFzKFxuICAgICAgICBtYXRjaENhbWVyYXMsXG4gICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSxcbiAgICAgICAgZ2x0Zk1vZGVsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKCdOb3QgU3VwcG9ydGVkIEFuaW1hdGlvbiBQb2ludGVyIFR5cGUnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBwb2ludGVyIGFuaW1hdGlvbiBmb3IgY2FtZXJhIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIG1hdGNoIC0gUmVnZXggbWF0Y2ggcmVzdWx0IGNvbnRhaW5pbmcgY2FtZXJhIGluZGV4XG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBwb2ludGVyIC0gQW5pbWF0aW9uIHBvaW50ZXIgc3RyaW5nXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRQb2ludGVyQW5pbWF0aW9uQ2FtZXJhcyhcbiAgICBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSxcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIHBvaW50ZXI6IHN0cmluZyxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgX2FuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lLFxuICAgIGdsdGZNb2RlbDogUm5NMlxuICApIHtcbiAgICBjb25zdCBjYW1lcmFJbmRleCA9IE51bWJlci5wYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgIGNvbnN0IG5vZGVzID0gZ2x0Zk1vZGVsLm5vZGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlLmNhbWVyYSA9PT0gY2FtZXJhSW5kZXgpIHtcbiAgICAgICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzW2ldO1xuICAgICAgICBjb25zdCBjYW1lcmFDb21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldENhbWVyYSgpO1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KGNhbWVyYUNvbXBvbmVudCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbWVyYUNvbXBvbmVudCBub3QgZm91bmQ6ICR7cG9pbnRlcn1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvdXRwdXRDb21wb25lbnROID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEuY29tcG9uZW50TiE7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lIDogJ1VudGl0bGVkX0FuaW1hdGlvbic7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXIgPSB7XG4gICAgICAgICAgaW5wdXQ6IGFuaW1JbnB1dEFycmF5LFxuICAgICAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5LFxuICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IG91dHB1dENvbXBvbmVudE4gYXMgVmVjdG9yQ29tcG9uZW50TixcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBBbmltYXRpb25JbnRlcnBvbGF0aW9uLmZyb21TdHJpbmcoaW50ZXJwb2xhdGlvbiksXG4gICAgICAgIH07XG4gICAgICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIGFuaW1hdGlvblNhbXBsZXIpO1xuXG4gICAgICAgIGxldCBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZTtcbiAgICAgICAgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDEpIHtcbiAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkU2NhbGFyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDIpIHtcbiAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAzKSB7XG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3I0KGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9uZW50IG51bWJlcjogJHtvdXRwdXRDb21wb25lbnROfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gcm5FbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9pbnRlci5pbmNsdWRlcygnem5lYXInKSkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2NhbWVyYV96bmVhcicsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3pmYXInKSkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2NhbWVyYV96ZmFyJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygneWZvdicpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignY2FtZXJhX2ZvdnknLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd4bWFnJykpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdjYW1lcmFfeG1hZycsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3ltYWcnKSkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2NhbWVyYV95bWFnJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBwb2ludGVyIGFuaW1hdGlvbiBmb3IgbGlnaHQgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0Y2ggLSBSZWdleCBtYXRjaCByZXN1bHQgY29udGFpbmluZyBsaWdodCBpbmRleFxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gcG9pbnRlciAtIEFuaW1hdGlvbiBwb2ludGVyIHN0cmluZ1xuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UG9pbnRlckFuaW1hdGlvbkxpZ2h0cyhcbiAgICBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSxcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIHBvaW50ZXI6IHN0cmluZyxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgX2FuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lLFxuICAgIGdsdGZNb2RlbDogUm5NMlxuICApIHtcbiAgICBjb25zdCBsaWdodEluZGV4ID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgY29uc3Qgbm9kZXMgPSBnbHRmTW9kZWwubm9kZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGUuZXh0ZW5zaW9ucz8uS0hSX2xpZ2h0c19wdW5jdHVhbCkge1xuICAgICAgICBjb25zdCBsaWdodElkeCA9IG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0SW5kZXg7XG4gICAgICAgIGlmIChsaWdodElkeCA9PT0gbGlnaHRJbmRleCkge1xuICAgICAgICAgIGNvbnN0IHJuRW50aXR5ID0gcm5FbnRpdGllc1tpXTtcbiAgICAgICAgICBjb25zdCBsaWdodENvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0TGlnaHQoKTtcbiAgICAgICAgICBpZiAoSXMubm90LmV4aXN0KGxpZ2h0Q29tcG9uZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBMaWdodENvbXBvbmVudCBub3QgZm91bmQ6ICR7cG9pbnRlcn1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgb3V0cHV0Q29tcG9uZW50TiA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLmNvbXBvbmVudE4hO1xuICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgICAgICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUgOiAnVW50aXRsZWRfQW5pbWF0aW9uJztcbiAgICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVyID0ge1xuICAgICAgICAgICAgaW5wdXQ6IGFuaW1JbnB1dEFycmF5LFxuICAgICAgICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgICAgICBvdXRwdXRDb21wb25lbnROOiBvdXRwdXRDb21wb25lbnROIGFzIFZlY3RvckNvbXBvbmVudE4sXG4gICAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBBbmltYXRpb25JbnRlcnBvbGF0aW9uLmZyb21TdHJpbmcoaW50ZXJwb2xhdGlvbiksXG4gICAgICAgICAgfTtcbiAgICAgICAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCBhbmltYXRpb25TYW1wbGVyKTtcblxuICAgICAgICAgIGxldCBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZTtcbiAgICAgICAgICBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDIpIHtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMykge1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSA0KSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yNChhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb25lbnQgbnVtYmVyOiAke291dHB1dENvbXBvbmVudE59YCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICAgICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdSbkVudGl0eSA9IHJuRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvbkNvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ2NvbG9yJykpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2xpZ2h0X2NvbG9yJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdpbnRlbnNpdHknKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignbGlnaHRfaW50ZW5zaXR5JywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdyYW5nZScpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdsaWdodF9yYW5nZScsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnc3BvdC9pbm5lckNvbmVBbmdsZScpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdsaWdodF9zcG90X2lubmVyQ29uZUFuZ2xlJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdzcG90L291dGVyQ29uZUFuZ2xlJykpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2xpZ2h0X3Nwb3Rfb3V0ZXJDb25lQW5nbGUnLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBwb2ludGVyIGFuaW1hdGlvbiBmb3Igbm9kZSBwcm9wZXJ0aWVzICh0cmFuc2Zvcm0sIHdlaWdodHMpXG4gICAqIEBwYXJhbSBtYXRjaCAtIFJlZ2V4IG1hdGNoIHJlc3VsdCBjb250YWluaW5nIG5vZGUgaW5kZXhcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIHBvaW50ZXIgLSBBbmltYXRpb24gcG9pbnRlciBzdHJpbmdcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFBvaW50ZXJBbmltYXRpb25Ob2RlcyhcbiAgICBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSxcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIHBvaW50ZXI6IHN0cmluZyxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgX2FuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lXG4gICkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IE51bWJlci5wYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgIGNvbnN0IHJuRW50aXR5ID0gcm5FbnRpdGllc1tub2RlSW5kZXhdO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qocm5FbnRpdHkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgbm90IGZvdW5kOiAke3BvaW50ZXJ9YCk7XG4gICAgfVxuICAgIGxldCBvdXRwdXRDb21wb25lbnROID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEuY29tcG9uZW50TiE7XG4gICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3dlaWdodHMnKSkge1xuICAgICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgICAgaWYgKElzLmV4aXN0KGJsZW5kU2hhcGVDb21wb25lbnQpKSB7XG4gICAgICAgIG91dHB1dENvbXBvbmVudE4gPSBibGVuZFNoYXBlQ29tcG9uZW50LndlaWdodHMubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCbGVuZFNoYXBlQ29tcG9uZW50IG5vdCBmb3VuZDogJHtwb2ludGVyfWApO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lIDogJ1VudGl0bGVkX0FuaW1hdGlvbic7XG4gICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSxcbiAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5LFxuICAgICAgb3V0cHV0Q29tcG9uZW50Tjogb3V0cHV0Q29tcG9uZW50TiBhcyBWZWN0b3JDb21wb25lbnROLFxuICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgIH07XG4gICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwgYW5pbWF0aW9uU2FtcGxlcik7XG5cbiAgICBsZXQgYW5pbWF0ZWRWYWx1ZTogSUFuaW1hdGVkVmFsdWU7XG5cbiAgICBpZiAocG9pbnRlci5pbmNsdWRlcygnd2VpZ2h0cycpKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yTihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDEpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRTY2FsYXIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAyKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDMpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjQoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9uZW50IG51bWJlcjogJHtvdXRwdXRDb21wb25lbnROfWApO1xuICAgIH1cbiAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gcm5FbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcbiAgICB9XG4gICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3JvdGF0aW9uJykpIHtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ3F1YXRlcm5pb24nLCBhbmltYXRlZFZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3RyYW5zbGF0aW9uJykpIHtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ3RyYW5zbGF0ZScsIGFuaW1hdGVkVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnc2NhbGUnKSkge1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignc2NhbGUnLCBhbmltYXRlZFZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3dlaWdodHMnKSkge1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignd2VpZ2h0cycsIGFuaW1hdGVkVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnS0hSX25vZGVfdmlzaWJpbGl0eS92aXNpYmxlJykpIHtcbiAgICAgIHJuRW50aXR5LnRyeVRvU2V0VGFnKHsgdGFnOiBUYWdLaHJOb2RlVmlzaWJpbGl0eUVuYWJsZWQsIHZhbHVlOiB0cnVlIH0pO1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbigndmlzaWJpbGl0eScsIGFuaW1hdGVkVmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHBvaW50ZXIgYW5pbWF0aW9uIGZvciBtYXRlcmlhbCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBtYXRjaCAtIFJlZ2V4IG1hdGNoIHJlc3VsdCBjb250YWluaW5nIG1hdGVyaWFsIGluZGV4XG4gICAqIEBwYXJhbSBybk1hdGVyaWFscyAtIEFycmF5IG9mIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICogQHBhcmFtIHBvaW50ZXIgLSBBbmltYXRpb24gcG9pbnRlciBzdHJpbmdcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFBvaW50ZXJBbmltYXRpb25NYXRlcmlhbHMoXG4gICAgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXksXG4gICAgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10sXG4gICAgcG9pbnRlcjogc3RyaW5nLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBfYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWVcbiAgKSB7XG4gICAgY29uc3QgbWF0ZXJpYWxJbmRleCA9IE51bWJlci5wYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgIGNvbnN0IG1hdGVyaWFsID0gcm5NYXRlcmlhbHNbbWF0ZXJpYWxJbmRleF07XG4gICAgaWYgKElzLm5vdC5leGlzdChtYXRlcmlhbCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWF0ZXJpYWwgbm90IGZvdW5kOiAke3BvaW50ZXJ9YCk7XG4gICAgfVxuICAgIGNvbnN0IG91dHB1dENvbXBvbmVudE4gPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS5jb21wb25lbnROITtcbiAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lIDogJ1VudGl0bGVkX0FuaW1hdGlvbic7XG4gICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSxcbiAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5LFxuICAgICAgb3V0cHV0Q29tcG9uZW50Tjogb3V0cHV0Q29tcG9uZW50TiBhcyBWZWN0b3JDb21wb25lbnROLFxuICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgIH07XG4gICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwgYW5pbWF0aW9uU2FtcGxlcik7XG5cbiAgICBsZXQgYW5pbWF0ZWRWYWx1ZTogSUFuaW1hdGVkVmFsdWU7XG4gICAgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDEpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRTY2FsYXIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAyKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDMpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjQoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9uZW50IG51bWJlcjogJHtvdXRwdXRDb21wb25lbnROfWApO1xuICAgIH1cbiAgICBsZXQgc2hhZGVyU2VtYW50aWNOYW1lID0gJyc7XG4gICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ0tIUl90ZXh0dXJlX3RyYW5zZm9ybScpKSB7XG4gICAgICBjb25zdCBzcGxpdCA9IHBvaW50ZXIuc3BsaXQoJy8nKTtcbiAgICAgIGNvbnN0IHRleHR1cmVOYW1lID0gc3BsaXRbc3BsaXQubGVuZ3RoIC0gNF07XG4gICAgICBjb25zdCB0cmFuc2Zvcm1UeXBlID0gc3BsaXRbc3BsaXQubGVuZ3RoIC0gMV07XG4gICAgICBjb25zdCBjYXBpdGFsaXplZFRyYW5zZm9ybVR5cGUgPSB0cmFuc2Zvcm1UeXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHJhbnNmb3JtVHlwZS5zbGljZSgxKTtcbiAgICAgIHNoYWRlclNlbWFudGljTmFtZSA9IGAke3RleHR1cmVOYW1lfVRyYW5zZm9ybSR7Y2FwaXRhbGl6ZWRUcmFuc2Zvcm1UeXBlfWA7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdub3JtYWxUZXh0dXJlL3NjYWxlJykpIHtcbiAgICAgIHNoYWRlclNlbWFudGljTmFtZSA9ICdub3JtYWxTY2FsZSc7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdvY2NsdXNpb25UZXh0dXJlL3N0cmVuZ3RoJykpIHtcbiAgICAgIHNoYWRlclNlbWFudGljTmFtZSA9ICdvY2NsdXNpb25TdHJlbmd0aCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNoYWRlclNlbWFudGljTmFtZSA9IHBvaW50ZXIuc3BsaXQoJy8nKS5wb3AoKSE7XG4gICAgfVxuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcihzaGFkZXJTZW1hbnRpY05hbWUsIGFuaW1hdGVkVmFsdWUpO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlcyA9IG1hdGVyaWFsLmdldEJlbG9uZ1ByaW1pdGl2ZXMoKTtcbiAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiBwcmltaXRpdmVzLnZhbHVlcygpKSB7XG4gICAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlLm1lc2gpKSB7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBwcmltaXRpdmUubWVzaCBhcyBNZXNoO1xuICAgICAgICBjb25zdCBtZXNoRW50aXRpZXMgPSBtZXNoLm1lc2hFbnRpdGllc0lubmVyO1xuICAgICAgICBmb3IgKGNvbnN0IHJuRW50aXR5IG9mIG1lc2hFbnRpdGllcykge1xuICAgICAgICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBybkVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldEFuaW1hdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGBtYXRlcmlhbC8ke3NoYWRlclNlbWFudGljTmFtZX1gLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHN0YW5kYXJkIGFuaW1hdGlvbiAobm9uLXBvaW50ZXIgYmFzZWQpIGZvciB0cmFuc2Zvcm0gcHJvcGVydGllc1xuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gY2hhbm5lbCAtIEFuaW1hdGlvbiBjaGFubmVsIGRhdGFcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldE5vcm1hbEFuaW1hdGlvbihcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIGNoYW5uZWw6IFJuTTJBbmltYXRpb25DaGFubmVsLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZVxuICApIHtcbiAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXNbY2hhbm5lbC50YXJnZXQubm9kZSFdIGFzIElBbmltYXRpb25FbnRpdHk7XG4gICAgaWYgKElzLmV4aXN0KHJuRW50aXR5KSkge1xuICAgICAgbGV0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBybkVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgICB9XG4gICAgICBpZiAoSXMuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgICBjb25zdCBvdXRwdXRDb21wb25lbnROID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEuY29tcG9uZW50TiE7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lIDogJ1VudGl0bGVkX0FuaW1hdGlvbic7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXIgPSB7XG4gICAgICAgICAgaW5wdXQ6IGFuaW1JbnB1dEFycmF5LFxuICAgICAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5LFxuICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IG91dHB1dENvbXBvbmVudE4gYXMgVmVjdG9yQ29tcG9uZW50TixcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBBbmltYXRpb25JbnRlcnBvbGF0aW9uLmZyb21TdHJpbmcoaW50ZXJwb2xhdGlvbiksXG4gICAgICAgIH07XG4gICAgICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIGFuaW1hdGlvblNhbXBsZXIpO1xuICAgICAgICBpZiAoYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9PT0gJ3RyYW5zbGF0ZScpIHtcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPT09ICdxdWF0ZXJuaW9uJykge1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRRdWF0ZXJuaW9uKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYW5pbWF0aW9uQXR0cmlidXRlVHlwZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9PT0gJ3NjYWxlJykge1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYW5pbWF0aW9uQXR0cmlidXRlVHlwZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gd2VpZ2h0XG4gICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3Rvck4oYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbihhbmltYXRpb25BdHRyaWJ1dGVUeXBlLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHNrZWxldGFsIGFuaW1hdGlvbiBhbmQgam9pbnQgaGllcmFyY2hpZXMgZnJvbSBnbFRGIHNraW4gZGF0YVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gcm5CdWZmZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGJ1ZmZlcnNcbiAgICovXG4gIHN0YXRpYyBfc2V0dXBTa2VsZXRvbihlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yLCBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLCBybkJ1ZmZlcnM6IEJ1ZmZlcltdKSB7XG4gICAgaWYgKGdsdGZNb2RlbC5za2lucyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZm9yY2VkQm9uZURhdGFUeXBlID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5ib25lRGF0YVR5cGU7XG5cbiAgICBmb3IgKGNvbnN0IG5vZGVfaSBpbiBnbHRmTW9kZWwubm9kZXMpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBnbHRmTW9kZWwubm9kZXNbbm9kZV9pXTtcbiAgICAgIGNvbnN0IF9zZyA9IHJuRW50aXRpZXNbbm9kZV9pXS5nZXRTY2VuZUdyYXBoKCkhO1xuICAgICAgbGV0IHNrZWxldGFsQ29tcG9uZW50OiBTa2VsZXRhbENvbXBvbmVudDtcbiAgICAgIGlmIChJcy5leGlzdChub2RlLnNraW5PYmplY3QpKSB7XG4gICAgICAgIGNvbnN0IHJuRW50aXR5ID0gcm5FbnRpdGllc1tub2RlX2ldO1xuICAgICAgICBjb25zdCBuZXdSbkVudGl0eSA9IGVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFNrZWxldGFsQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgIHNrZWxldGFsQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0U2tlbGV0YWwoKTtcblxuICAgICAgICBjb25zdCBpbnZlcnNlQmluZE1hdEFjY2Vzc29yID0gbm9kZS5za2luT2JqZWN0LmludmVyc2VCaW5kTWF0cmljZXNPYmplY3Q7XG4gICAgICAgIGNvbnN0IHJuQWNjZXNzb3JPZkludmVyc2VCaW5kTWF0ID0gSXMuZXhpc3QoaW52ZXJzZUJpbmRNYXRBY2Nlc3NvcilcbiAgICAgICAgICA/IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yKGVuZ2luZSwgaW52ZXJzZUJpbmRNYXRBY2Nlc3Nvciwgcm5CdWZmZXJzKVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIENob29zZSB0aGUgYm9uZSBkYXRhIHR5cGUgYmVmb3JlIHNldEpvaW50cygpIHNvIHRoYXQgdGhlIEdQVSBib25lIGRhdGEgaXMgYWxsb2NhdGVkIG9ubHkgb25jZS5cbiAgICAgICAgLy8gTWF0NDN4MSBpcyB1c2VkIG9ubHkgd2hlbiBzcGVjaWZpZWQgZXhwbGljaXRseSBieSB0aGUgbG9hZGVyIG9wdGlvbiAob3IgQ29uZmlnLmJvbmVEYXRhVHlwZSkuXG4gICAgICAgIGlmIChmb3JjZWRCb25lRGF0YVR5cGUgIT0gbnVsbCkge1xuICAgICAgICAgIHNrZWxldGFsQ29tcG9uZW50LnNldEJvbmVEYXRhVHlwZShmb3JjZWRCb25lRGF0YVR5cGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFuIGF1dG9tYXRpY2FsbHkgc2VsZWN0ZWQgVmVjNHgxIGlzIHN3aXRjaGVkIHRvIFZlYzR4MiBpZiBhIG5vbi11bmlmb3JtIHNjYWxlIGFwcGVhcnMgYXQgcnVudGltZVxuICAgICAgICAgIGNvbnN0IGlzQXV0b1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICBza2VsZXRhbENvbXBvbmVudC5zZXRCb25lRGF0YVR5cGUoXG4gICAgICAgICAgICBkZXRlY3RCb25lRGF0YVR5cGVGb3JTa2luKFxuICAgICAgICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgICAgICAgIG5vZGUuc2tpbk9iamVjdCxcbiAgICAgICAgICAgICAgTnVtYmVyKG5vZGVfaSksXG4gICAgICAgICAgICAgIHJuQWNjZXNzb3JPZkludmVyc2VCaW5kTWF0Py5nZXRUeXBlZEFycmF5KClcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBpc0F1dG9TZWxlY3RlZFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSXMuZXhpc3Qobm9kZS5za2luT2JqZWN0LmJpbmRTaGFwZU1hdHJpeCkpIHtcbiAgICAgICAgICBza2VsZXRhbENvbXBvbmVudC5fYmluZFNoYXBlTWF0cml4ID0gTWF0cml4NDQuZnJvbUNvcHlBcnJheUNvbHVtbk1ham9yKG5vZGUuc2tpbk9iamVjdC5iaW5kU2hhcGVNYXRyaXgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3Qgam9pbnRfaSBvZiBub2RlLnNraW5PYmplY3Quam9pbnRzKSB7XG4gICAgICAgICAgY29uc3Qgc2cgPSBybkVudGl0aWVzW2pvaW50X2ldLmdldFNjZW5lR3JhcGgoKSE7XG4gICAgICAgICAgc2cuam9pbnRJbmRleCA9IGpvaW50X2k7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYHNraW4uc2tlbGV0b25gIGlzIG9wdGlvbmFsIGluIGdsVEYuIFRoZSBqb2ludHMgYW5kIHRoZWlyIGJvbmUgZGF0YSBtdXN0IGJlIHNldFxuICAgICAgICAvLyB1cCByZWdhcmRsZXNzOyB3aGVuIHRoZSBza2VsZXRvbiByb290IGlzIG9taXR0ZWQsIHRoZSBjb21tb24gYW5jZXN0b3Igb2YgdGhlXG4gICAgICAgIC8vIGpvaW50cyBpcyB0aGUgcm9vdCBvZiB0aGUgam9pbnQgaGllcmFyY2h5LlxuICAgICAgICBjb25zdCBqb2ludHMgPSBub2RlLnNraW5PYmplY3Quam9pbnRzLm1hcChpID0+IHJuRW50aXRpZXNbaV0uZ2V0U2NlbmVHcmFwaCgpISk7XG4gICAgICAgIHNrZWxldGFsQ29tcG9uZW50LnNldEpvaW50cyhqb2ludHMpO1xuICAgICAgICBjb25zdCBza2VsZXRvblJvb3QgPSBJcy5leGlzdChub2RlLnNraW5PYmplY3Quc2tlbGV0b24pXG4gICAgICAgICAgPyBybkVudGl0aWVzW25vZGUuc2tpbk9iamVjdC5za2VsZXRvbl0uZ2V0U2NlbmVHcmFwaCgpXG4gICAgICAgICAgOiB0aGlzLl9fZ2V0Q29tbW9uQW5jZXN0b3JPZkpvaW50cyhqb2ludHMpO1xuICAgICAgICBza2VsZXRhbENvbXBvbmVudC50b3BPZkpvaW50c0hpZXJhcmNoeSA9IHNrZWxldG9uUm9vdCA/PyBqb2ludHNbMF07XG4gICAgICAgIGlmIChza2VsZXRvblJvb3QgIT0gbnVsbCkge1xuICAgICAgICAgIHNrZWxldG9uUm9vdC5pc1Jvb3RKb2ludCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSXMuZXhpc3Qocm5BY2Nlc3Nvck9mSW52ZXJzZUJpbmRNYXQpKSB7XG4gICAgICAgICAgc2tlbGV0YWxDb21wb25lbnQhLnNldEludmVyc2VCaW5kTWF0cmljZXNBY2Nlc3NvcihybkFjY2Vzc29yT2ZJbnZlcnNlQmluZE1hdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbG93ZXN0IGNvbW1vbiBhbmNlc3RvciBvZiB0aGUgZ2l2ZW4gam9pbnRzIGluIHRoZSBzY2VuZSBncmFwaC5cbiAgICogZ2xURidzIGBza2luLnNrZWxldG9uYCBpcyBvcHRpb25hbDsgd2hlbiBpdCBpcyBvbWl0dGVkLCB0aGUgY29tbW9uIHJvb3Qgb2YgdGhlXG4gICAqIGpvaW50cyBpcyB0aGUgcm9vdCBvZiB0aGUgc2tpbidzIGpvaW50IGhpZXJhcmNoeS5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0Q29tbW9uQW5jZXN0b3JPZkpvaW50cyhqb2ludHM6IFNjZW5lR3JhcGhDb21wb25lbnRbXSk6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQge1xuICAgIGlmIChqb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBhbmNlc3RvckNoYWluID0gbmV3IFNldDxTY2VuZUdyYXBoQ29tcG9uZW50PigpO1xuICAgIGxldCBjdXJyZW50OiBTY2VuZUdyYXBoQ29tcG9uZW50IHwgdW5kZWZpbmVkID0gam9pbnRzWzBdO1xuICAgIHdoaWxlIChjdXJyZW50ICE9IG51bGwpIHtcbiAgICAgIGFuY2VzdG9yQ2hhaW4uYWRkKGN1cnJlbnQpO1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgIH1cbiAgICBsZXQgY29tbW9uOiBTY2VuZUdyYXBoQ29tcG9uZW50ID0gam9pbnRzWzBdO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgam9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbm9kZTogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCA9IGpvaW50c1tpXTtcbiAgICAgIHdoaWxlIChub2RlICE9IG51bGwgJiYgIWFuY2VzdG9yQ2hhaW4uaGFzKG5vZGUpKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlICE9PSBjb21tb24pIHtcbiAgICAgICAgY29tbW9uID0gbm9kZTtcbiAgICAgICAgYW5jZXN0b3JDaGFpbi5jbGVhcigpO1xuICAgICAgICBsZXQgYW5jZXN0b3I6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQgPSBjb21tb247XG4gICAgICAgIHdoaWxlIChhbmNlc3RvciAhPSBudWxsKSB7XG4gICAgICAgICAgYW5jZXN0b3JDaGFpbi5hZGQoYW5jZXN0b3IpO1xuICAgICAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb21tb247XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNtb290aCB2ZXJ0ZXggbm9ybWFscyBmb3IgcHJpbWl0aXZlcyB0aGF0IGhhdmUgbm8gTk9STUFMIGF0dHJpYnV0ZS5cbiAgICogZ2xURiByZXF1aXJlcyBpbXBsZW1lbnRhdGlvbnMgdG8gY2FsY3VsYXRlIG5vcm1hbHMgd2hlbiB0aGV5IGFyZSBhYnNlbnQ7IHdpdGhvdXRcbiAgICogdGhlbSBsaXQgbWF0ZXJpYWxzIHJlY2VpdmUgYSB6ZXJvIG5vcm1hbCBhbmQgc2hhZGUgaW5jb3JyZWN0bHkgKGJsYWNrIG9yIE5hTikuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlTm9ybWFsc0lmTWlzc2luZyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBwcmltaXRpdmU6IFByaW1pdGl2ZSxcbiAgICBpbmRpY2VzQWNjZXNzb3I6IEFjY2Vzc29yIHwgdW5kZWZpbmVkXG4gICk6IHZvaWQge1xuICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUuZ2V0QXR0cmlidXRlKFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbW9kZSA9IHByaW1pdGl2ZS5wcmltaXRpdmVNb2RlO1xuICAgIGlmIChcbiAgICAgIG1vZGUgIT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzICYmXG4gICAgICBtb2RlICE9PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXAgJiZcbiAgICAgIG1vZGUgIT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVGYW5cbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcG9zaXRpb25BY2Nlc3NvciA9IHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWik7XG4gICAgaWYgKCFJcy5leGlzdChwb3NpdGlvbkFjY2Vzc29yKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHBvc2l0aW9uQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgIGlmICh2ZXJ0ZXhDb3VudCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRleENvdW50ICogMyk7XG4gICAgY29uc3QgaW5kZXhDb3VudCA9IGluZGljZXNBY2Nlc3NvciAhPSBudWxsID8gaW5kaWNlc0FjY2Vzc29yLmVsZW1lbnRDb3VudCA6IHZlcnRleENvdW50O1xuICAgIGNvbnN0IGdldFZlcnRleEluZGV4ID0gKGk6IG51bWJlcikgPT4gKGluZGljZXNBY2Nlc3NvciAhPSBudWxsID8gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihpLCB7fSkgOiBpKTtcbiAgICBjb25zdCBhY2N1bXVsYXRlVHJpYW5nbGUgPSAoaWE6IG51bWJlciwgaWI6IG51bWJlciwgaWM6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgYSA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpYSwge30pO1xuICAgICAgY29uc3QgYiA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpYiwge30pO1xuICAgICAgY29uc3QgYyA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhpYywge30pO1xuICAgICAgY29uc3QgYWJ4ID0gYi54IC0gYS54O1xuICAgICAgY29uc3QgYWJ5ID0gYi55IC0gYS55O1xuICAgICAgY29uc3QgYWJ6ID0gYi56IC0gYS56O1xuICAgICAgY29uc3QgYWN4ID0gYy54IC0gYS54O1xuICAgICAgY29uc3QgYWN5ID0gYy55IC0gYS55O1xuICAgICAgY29uc3QgYWN6ID0gYy56IC0gYS56O1xuICAgICAgLy8gQXJlYSB3ZWlnaHRlZCBmYWNlIG5vcm1hbDsgdGhlIGFjY3VtdWxhdGVkIHJlc3VsdCBpcyBub3JtYWxpemVkIGF0IHRoZSBlbmQuXG4gICAgICBjb25zdCBueCA9IGFieSAqIGFjeiAtIGFieiAqIGFjeTtcbiAgICAgIGNvbnN0IG55ID0gYWJ6ICogYWN4IC0gYWJ4ICogYWN6O1xuICAgICAgY29uc3QgbnogPSBhYnggKiBhY3kgLSBhYnkgKiBhY3g7XG4gICAgICBmb3IgKGNvbnN0IGluZGV4IG9mIFtpYSwgaWIsIGljXSkge1xuICAgICAgICBub3JtYWxzW2luZGV4ICogM10gKz0gbng7XG4gICAgICAgIG5vcm1hbHNbaW5kZXggKiAzICsgMV0gKz0gbnk7XG4gICAgICAgIG5vcm1hbHNbaW5kZXggKiAzICsgMl0gKz0gbno7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChtb2RlID09PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgKyAyIDwgaW5kZXhDb3VudDsgaSArPSAzKSB7XG4gICAgICAgIGFjY3VtdWxhdGVUcmlhbmdsZShnZXRWZXJ0ZXhJbmRleChpKSwgZ2V0VmVydGV4SW5kZXgoaSArIDEpLCBnZXRWZXJ0ZXhJbmRleChpICsgMikpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZVN0cmlwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSArIDIgPCBpbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgaWYgKGkgJSAyID09PSAwKSB7XG4gICAgICAgICAgYWNjdW11bGF0ZVRyaWFuZ2xlKGdldFZlcnRleEluZGV4KGkpLCBnZXRWZXJ0ZXhJbmRleChpICsgMSksIGdldFZlcnRleEluZGV4KGkgKyAyKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWNjdW11bGF0ZVRyaWFuZ2xlKGdldFZlcnRleEluZGV4KGkgKyAxKSwgZ2V0VmVydGV4SW5kZXgoaSksIGdldFZlcnRleEluZGV4KGkgKyAyKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgKyAxIDwgaW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgIGFjY3VtdWxhdGVUcmlhbmdsZShnZXRWZXJ0ZXhJbmRleCgwKSwgZ2V0VmVydGV4SW5kZXgoaSksIGdldFZlcnRleEluZGV4KGkgKyAxKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYnl0ZUxlbmd0aCA9IHZlcnRleENvdW50ICogMyAqIDQ7XG4gICAgY29uc3QgYnVmZmVyID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuY3JlYXRlQnVmZmVyT25EZW1hbmQoQnVmZmVyVXNlLkNQVUdlbmVyaWMsIGJ5dGVMZW5ndGgsIDQpO1xuICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBidWZmZXIudGFrZUJ1ZmZlclZpZXcoeyBieXRlTGVuZ3RoVG9OZWVkOiBieXRlTGVuZ3RoLCBieXRlU3RyaWRlOiAwIH0pLnVud3JhcEZvcmNlKCk7XG4gICAgY29uc3Qgbm9ybWFsQWNjZXNzb3IgPSBidWZmZXJWaWV3XG4gICAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY291bnQ6IHZlcnRleENvdW50LFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgbGV0IHggPSBub3JtYWxzW2kgKiAzXTtcbiAgICAgIGxldCB5ID0gbm9ybWFsc1tpICogMyArIDFdO1xuICAgICAgbGV0IHogPSBub3JtYWxzW2kgKiAzICsgMl07XG4gICAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHgsIHksIHopO1xuICAgICAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICAgICAgeCAvPSBsZW5ndGg7XG4gICAgICAgIHkgLz0gbGVuZ3RoO1xuICAgICAgICB6IC89IGxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlZ2VuZXJhdGUgdmVydGV4OiB1c2UgYSB2YWxpZCBub3JtYWwgc28gbGlnaHRpbmcgZG9lcyBub3QgcHJvZHVjZSBOYU4uXG4gICAgICAgIHggPSAwO1xuICAgICAgICB5ID0gMTtcbiAgICAgICAgeiA9IDA7XG4gICAgICB9XG4gICAgICBub3JtYWxBY2Nlc3Nvci5zZXRWZWMzKGksIHgsIHksIHosIHt9KTtcbiAgICB9XG4gICAgcHJpbWl0aXZlLnNldFZlcnRleEF0dHJpYnV0ZShub3JtYWxBY2Nlc3NvciwgVmVydGV4QXR0cmlidXRlLk5vcm1hbC5YWVopO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYWxsIG9iamVjdHMgKG1lc2hlcywgY2FtZXJhcywgbGlnaHRzLCBncm91cHMpIGZyb20gZ2xURiBub2Rlc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5CdWZmZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGJ1ZmZlcnNcbiAgICogQHBhcmFtIHJuTWF0ZXJpYWxzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBhcnJheXMgb2YgZW50aXRpZXMgYW5kIGVudGl0aWVzIGJ5IG5hbWVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBPYmplY3RzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBybkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICAgIHJuTWF0ZXJpYWxzOiBNYXRlcmlhbFtdLFxuICAgIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICByblNhbXBsZXJzOiBTYW1wbGVyW11cbiAgKSB7XG4gICAgY29uc3Qgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSA9IFtdO1xuICAgIGNvbnN0IHJuRW50aXRpZXNCeU5hbWVzOiBNYXA8c3RyaW5nLCBJU2NlbmVHcmFwaEVudGl0eT4gPSBuZXcgTWFwKCk7XG5cbiAgICBmb3IgKGNvbnN0IG5vZGVfaSBpbiBnbHRmTW9kZWwubm9kZXMpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBnbHRmTW9kZWwubm9kZXNbTnVtYmVyLnBhcnNlSW50KG5vZGVfaSwgMTApXSBhcyBSbk0yTm9kZTtcbiAgICAgIGxldCBlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5O1xuICAgICAgaWYgKG5vZGUubWVzaCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1lc2hJZHggPSBub2RlLm1lc2g7XG4gICAgICAgIGNvbnN0IG1lc2hFbnRpdHkgPSB0aGlzLl9fc2V0dXBNZXNoKFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICBub2RlLm1lc2hPYmplY3QhLFxuICAgICAgICAgIG1lc2hJZHgsXG4gICAgICAgICAgcm5CdWZmZXJzLFxuICAgICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgICBybk1hdGVyaWFscyxcbiAgICAgICAgICByblRleHR1cmVzLFxuICAgICAgICAgIHJuU2FtcGxlcnNcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICAgIG1lc2hFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKG5vZGUubmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUubWVzaE9iamVjdD8ubmFtZSkge1xuICAgICAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoRW50aXR5LmdldENvbXBvbmVudChNZXNoQ29tcG9uZW50KSE7XG4gICAgICAgICAgbWVzaENvbXBvbmVudC50cnlUb1NldFVuaXF1ZU5hbWUobm9kZS5tZXNoT2JqZWN0Lm5hbWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVudGl0eSA9IG1lc2hFbnRpdHk7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUuY2FtZXJhT2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgY2FtZXJhRW50aXR5ID0gdGhpcy5fX3NldHVwQ2FtZXJhKGVuZ2luZSwgbm9kZS5jYW1lcmFPYmplY3QsIGdsdGZNb2RlbCk7XG4gICAgICAgIGxldCBlbnRpdHlXaXRoT3B0aW9uYWxMaWdodDogSVNjZW5lR3JhcGhFbnRpdHkgPSBjYW1lcmFFbnRpdHk7XG4gICAgICAgIC8vIEEgZ2xURiBub2RlIGNhbiBjYXJyeSBib3RoIGEgY2FtZXJhIGFuZCBhIGxpZ2h0LiBFZGl0b3ItY3JlYXRlZCBsaWdodHMgYXJlIHN1Y2hcbiAgICAgICAgLy8gbm9kZXM6IGNyZWF0ZUxpZ2h0V2l0aENhbWVyYUVudGl0eSBhdHRhY2hlcyB0aGUgbGlnaHQgY2FtZXJhIHRvIHRoZSBsaWdodCBlbnRpdHkuXG4gICAgICAgIGlmIChub2RlLmV4dGVuc2lvbnM/LktIUl9saWdodHNfcHVuY3R1YWwgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGxpZ2h0RW50aXR5ID0gZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoXG4gICAgICAgICAgICBMaWdodENvbXBvbmVudCxcbiAgICAgICAgICAgIGNhbWVyYUVudGl0eVxuICAgICAgICAgICkgYXMgdW5rbm93biBhcyBJQ2FtZXJhRW50aXR5ICYgSUxpZ2h0RW50aXR5O1xuICAgICAgICAgIHRoaXMuX19jb25maWd1cmVMaWdodENvbXBvbmVudChsaWdodEVudGl0eS5nZXRMaWdodCgpLCBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodCk7XG4gICAgICAgICAgbGlnaHRFbnRpdHkuZ2V0Q2FtZXJhKCkuaXNTeW5jVG9MaWdodCA9IHRydWU7XG4gICAgICAgICAgZW50aXR5V2l0aE9wdGlvbmFsTGlnaHQgPSBsaWdodEVudGl0eSBhcyB1bmtub3duIGFzIElTY2VuZUdyYXBoRW50aXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLm5hbWUpIHtcbiAgICAgICAgICBlbnRpdHlXaXRoT3B0aW9uYWxMaWdodC50cnlUb1NldFVuaXF1ZU5hbWUobm9kZS5uYW1lLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbnRpdHkgPSBlbnRpdHlXaXRoT3B0aW9uYWxMaWdodDtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5leHRlbnNpb25zPy5LSFJfbGlnaHRzX3B1bmN0dWFsKSB7XG4gICAgICAgIGNvbnN0IGxpZ2h0RW50aXR5ID0gdGhpcy5fX3NldHVwTGlnaHQoZW5naW5lLCBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodCwgZ2x0Zk1vZGVsKTtcbiAgICAgICAgZW50aXR5ID0gbGlnaHRFbnRpdHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBncm91cCA9IHRoaXMuX19nZW5lcmF0ZUdyb3VwRW50aXR5KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICAgIGdyb3VwLnRyeVRvU2V0VW5pcXVlTmFtZShub2RlLm5hbWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVudGl0eSA9IGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBSaG9kb25pdGUgcmF5bWFyY2hpbmcgY29tcG9uZW50LiBUaGUgc2hhcmVkIHJheW1hcmNoaW5nIG1hdGVyaWFsIGlzIGJ1aWx0IGJ5IHRoZVxuICAgICAgLy8gYXBwbGljYXRpb24gKHRoZSBlZGl0b3IncyBub2RlIGVkaXRvcikgZnJvbSB0aGUgcmVzdG9yZWQgZ3JhcGguXG4gICAgICBjb25zdCByYXltYXJjaGluZ0V4dGVuc2lvbiA9IChcbiAgICAgICAgbm9kZS5leHRlbnNpb25zIGFzXG4gICAgICAgICAgfCB7XG4gICAgICAgICAgICAgIFJIT0RPTklURV9yYXltYXJjaGluZz86IHtcbiAgICAgICAgICAgICAgICBncmFwaD86IE5vZGVKU09OIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBzZGZTaGFwZVR5cGU/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgaXNQaWNrYWJsZT86IGJvb2xlYW47XG4gICAgICAgICAgICAgICAgY2FzdFNoYWRvdz86IGJvb2xlYW47XG4gICAgICAgICAgICAgICAgLy8gUGVyLWNvbXBvbmVudCBUZXh0dXJlMkQgYXNzaWdubWVudHMsIGNvbnN1bWVkIGJ5IHRoZSBhcHBsaWNhdGlvbiB3aGVuIGl0XG4gICAgICAgICAgICAgICAgLy8gcmVidWlsZHMgdGhlIGNvbXBvbmVudCdzIG1hdGVyaWFsIChzZWUgZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRUZXh0dXJlQXNzaWdubWVudHMpLlxuICAgICAgICAgICAgICAgIHRleHR1cmVzPzogeyBbc2VtYW50aWM6IHN0cmluZ106IHsgaW5kZXg/OiBudW1iZXIgfSB9O1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHwgdW5kZWZpbmVkXG4gICAgICApPy5SSE9ET05JVEVfcmF5bWFyY2hpbmc7XG4gICAgICBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24gIT0gbnVsbCAmJiBlbnRpdHkudHJ5VG9HZXRSYXltYXJjaGluZygpID09IG51bGwpIHtcbiAgICAgICAgY29uc3QgUmF5bWFyY2hpbmdDb21wb25lbnQgPSByYXltYXJjaGluZ0NvbXBvbmVudENsYXNzO1xuICAgICAgICBpZiAoUmF5bWFyY2hpbmdDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgICAgICAnUkhPRE9OSVRFX3JheW1hcmNoaW5nOiBSYXltYXJjaGluZyBzdXBwb3J0IGlzIG5vdCBsb2FkZWQuIEltcG9ydCB0aGUgbW9kZWwgdGhyb3VnaCB0aGUgYXN5bmNocm9ub3VzICcgK1xuICAgICAgICAgICAgICAnTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0KCksIG9yIGF3YWl0IE1vZGVsQ29udmVydGVyLnByZWxvYWRSYXltYXJjaGluZ1N1cHBvcnQoKSBmaXJzdC4nXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCByYXltYXJjaGluZ0VudGl0eSA9IGVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFxuICAgICAgICAgICAgUmF5bWFyY2hpbmdDb21wb25lbnQsXG4gICAgICAgICAgICBlbnRpdHlcbiAgICAgICAgICApIGFzIHVua25vd24gYXMgSVJheW1hcmNoaW5nRW50aXR5O1xuICAgICAgICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50ID0gcmF5bWFyY2hpbmdFbnRpdHkuZ2V0UmF5bWFyY2hpbmcoKTtcbiAgICAgICAgICBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24uZ3JhcGggIT0gbnVsbCkge1xuICAgICAgICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnQucnJuSnNvbiA9IHJheW1hcmNoaW5nRXh0ZW5zaW9uLmdyYXBoO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24uc2RmU2hhcGVUeXBlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJheW1hcmNoaW5nQ29tcG9uZW50LnNkZlNoYXBlVHlwZSA9IFNkZlNoYXBlVHlwZS5mcm9tKHJheW1hcmNoaW5nRXh0ZW5zaW9uLnNkZlNoYXBlVHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyYXltYXJjaGluZ0V4dGVuc2lvbi5pc1BpY2thYmxlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJheW1hcmNoaW5nQ29tcG9uZW50LmlzUGlja2FibGUgPSByYXltYXJjaGluZ0V4dGVuc2lvbi5pc1BpY2thYmxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24uY2FzdFNoYWRvdyAhPSBudWxsKSB7XG4gICAgICAgICAgICByYXltYXJjaGluZ0NvbXBvbmVudC5jYXN0U2hhZG93ID0gcmF5bWFyY2hpbmdFeHRlbnNpb24uY2FzdFNoYWRvdztcbiAgICAgICAgICB9XG4gICAgICAgICAgZW50aXR5ID0gcmF5bWFyY2hpbmdFbnRpdHkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fX2lzTW9ycGhpbmcobm9kZSwgZ2x0Zk1vZGVsKSkge1xuICAgICAgICBsZXQgd2VpZ2h0czogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgaWYgKG5vZGUud2VpZ2h0cykge1xuICAgICAgICAgIHdlaWdodHMgPSBub2RlLndlaWdodHM7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5tZXNoT2JqZWN0Py53ZWlnaHRzKSB7XG4gICAgICAgICAgd2VpZ2h0cyA9IG5vZGUubWVzaE9iamVjdC53ZWlnaHRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB0YXJnZXROdW0gPSAwO1xuICAgICAgICAgIC8vIGdldCBtYXhpbXVtIHRhcmdldCBudW1cbiAgICAgICAgICBmb3IgKGNvbnN0IHByaW1pdGl2ZSBvZiBub2RlLm1lc2hPYmplY3QhLnByaW1pdGl2ZXMpIHtcbiAgICAgICAgICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUudGFyZ2V0cykpIHtcbiAgICAgICAgICAgICAgaWYgKHByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aCA+IHRhcmdldE51bSkge1xuICAgICAgICAgICAgICAgIHRhcmdldE51bSA9IHByaW1pdGl2ZS50YXJnZXRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB3ZWlnaHRzID0gbmV3IEFycmF5KHRhcmdldE51bSkuZmlsbCgwKTtcbiAgICAgICAgfVxuICAgICAgICBlbnRpdHkgPSBlbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQmxlbmRTaGFwZUNvbXBvbmVudCwgZW50aXR5KTtcbiAgICAgICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IChlbnRpdHkgYXMgdW5rbm93biBhcyBJQmxlbmRTaGFwZUVudGl0eU1ldGhvZHMpLmdldEJsZW5kU2hhcGUoKTtcbiAgICAgICAgYmxlbmRTaGFwZUNvbXBvbmVudC53ZWlnaHRzID0gd2VpZ2h0cztcbiAgICAgICAgaWYgKG5vZGUubWVzaE9iamVjdD8ucHJpbWl0aXZlc1swXS5leHRyYXM/LnRhcmdldE5hbWVzKSB7XG4gICAgICAgICAgYmxlbmRTaGFwZUNvbXBvbmVudC50YXJnZXROYW1lcyA9IG5vZGUubWVzaE9iamVjdC5wcmltaXRpdmVzWzBdLmV4dHJhcy50YXJnZXROYW1lcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZW50aXR5LnRyeVRvU2V0VGFnKHsgdGFnOiBUYWdHbHRmMk5vZGVJbmRleCwgdmFsdWU6IG5vZGVfaSB9KTtcblxuICAgICAgcm5FbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gICAgICBybkVudGl0aWVzQnlOYW1lcy5zZXQobm9kZS5uYW1lISwgZW50aXR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBybkVudGl0aWVzLCBybkVudGl0aWVzQnlOYW1lcyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIG5vZGUgaGFzIG1vcnBoaW5nIChibGVuZCBzaGFwZSkgY2FwYWJpbGl0aWVzXG4gICAqIEBwYXJhbSBub2RlIC0gVGhlIGdsVEYgbm9kZSB0byBjaGVja1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBub2RlIHN1cHBvcnRzIG1vcnBoaW5nXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2lzTW9ycGhpbmcobm9kZTogUm5NMk5vZGUsIGdsdGZNb2RlbDogUm5NMikge1xuICAgIGNvbnN0IGFyZ3VtZW50ID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcbiAgICBpZiAoYXJndW1lbnQ/LmlzTW9ycGhpbmcgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBub2RlLm1lc2hPYmplY3Q/LnByaW1pdGl2ZXNbMF0udGFyZ2V0cyAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBsaWdodCBlbnRpdHkgZnJvbSBnbFRGIGxpZ2h0IGRhdGFcbiAgICogQHBhcmFtIGxpZ2h0IC0gVGhlIGdsVEYgbGlnaHQgZGF0YVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBDb25maWd1cmVkIGxpZ2h0IGVudGl0eVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cExpZ2h0KGVuZ2luZTogRW5naW5lLCBsaWdodDogS0hSX2xpZ2h0c19wdW5jdHVhbF9MaWdodCwgZ2x0Zk1vZGVsOiBSbk0yKTogSUxpZ2h0RW50aXR5IHtcbiAgICBjb25zdCBsaWdodEVudGl0eSA9IHRoaXMuX19nZW5lcmF0ZUxpZ2h0RW50aXR5KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBsaWdodENvbXBvbmVudCA9IGxpZ2h0RW50aXR5LmdldENvbXBvbmVudChMaWdodENvbXBvbmVudCkhIGFzIExpZ2h0Q29tcG9uZW50O1xuICAgIHRoaXMuX19jb25maWd1cmVMaWdodENvbXBvbmVudChsaWdodENvbXBvbmVudCwgbGlnaHQpO1xuICAgIC8vIFNwb3QgYW5kIGRpcmVjdGlvbmFsIHNoYWRvdyBtYXBzIGFyZSByZW5kZXJlZCBmcm9tIGEgY2FtZXJhIHN5bmNocm9uaXplZCB0byB0aGUgbGlnaHQgKFNoYWRvd01hcCB1c2VzXG4gICAgLy8gbGlnaHRFbnRpdHkuZ2V0Q2FtZXJhKCkpLiBBdHRhY2ggaXQgb25seSB0byB0aGUgbGlnaHRzIHRoYXQgY2FzdCBzaGFkb3dzOiB0aGUgaW1wb3J0IGFwcGxpZXMgY2FzdHNTaGFkb3cgZnJvbVxuICAgIC8vIHRoZSBSaG9kb25pdGUgZXh0cmFzLCBhbmQgU2hhZG93U3lzdGVtIGF0dGFjaGVzIGl0IGxhemlseSB3aGVuIGEgbGlnaHQgc3RhcnRzIGNhc3Rpbmcgc2hhZG93cy4gQXR0YWNoaW5nIGl0IHRvXG4gICAgLy8gZXZlcnkgaW1wb3J0ZWQgc3BvdC9kaXJlY3Rpb25hbCBsaWdodCBhZGRzIG9uZSBjYW1lcmEgY29tcG9uZW50IHBlciBsaWdodCwgYW5kIHRoZSBnZW5lcmF0ZWQgc2hhZGVycyBrZWVwIGFuXG4gICAgLy8gb2Zmc2V0IGVudHJ5IHBlciBjYW1lcmEsIHdoaWNoIG1ha2VzIHRoZW0gbGFyZ2UgYW5kIHNsb3cgKGUuZy4gYSBzY2VuZSB3aXRoIGh1bmRyZWRzIG9mIGxpZ2h0cykuXG4gICAgaWYgKGxpZ2h0Q29tcG9uZW50LmNhc3RTaGFkb3cpIHtcbiAgICAgIGF0dGFjaExpZ2h0U2hhZG93Q2FtZXJhKGVuZ2luZSwgbGlnaHRFbnRpdHkgYXMgSUxpZ2h0RW50aXR5KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpZ2h0RW50aXR5IGFzIElMaWdodEVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGdsVEYgbGlnaHQgZGF0YSB0byBhIExpZ2h0Q29tcG9uZW50LiBUaGlzIGlzIHVzZWQgZm9yIG5vZGVzIHRoYXQgY29udGFpbiBvbmx5IGFcbiAgICogbGlnaHQgYW5kIGZvciBub2RlcyB0aGF0IGNvbnRhaW4gYm90aCBhIGNhbWVyYSBhbmQgYSBsaWdodC5cbiAgICogQHBhcmFtIGxpZ2h0Q29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB0byBjb25maWd1cmVcbiAgICogQHBhcmFtIGxpZ2h0IC0gVGhlIGdsVEYgbGlnaHQgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb25maWd1cmVMaWdodENvbXBvbmVudChsaWdodENvbXBvbmVudDogTGlnaHRDb21wb25lbnQsIGxpZ2h0OiBLSFJfbGlnaHRzX3B1bmN0dWFsX0xpZ2h0KSB7XG4gICAgaWYgKGxpZ2h0Lm5hbWUgIT0gbnVsbCkge1xuICAgICAgbGlnaHRDb21wb25lbnQudHJ5VG9TZXRVbmlxdWVOYW1lKGxpZ2h0Lm5hbWUsIHRydWUpO1xuICAgIH1cbiAgICBsaWdodENvbXBvbmVudC50eXBlID0gTGlnaHRUeXBlLmZyb21TdHJpbmcobGlnaHQudHlwZSk7XG4gICAgbGV0IGNvbG9yID0gVmVjdG9yMy5mcm9tQ29weUFycmF5MyhbMSwgMSwgMV0pO1xuICAgIGxldCBpbnRlbnNpdHkgPSAxO1xuICAgIGlmIChsaWdodC5jb2xvciAhPSBudWxsKSB7XG4gICAgICBjb2xvciA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheTMobGlnaHQuY29sb3IpO1xuICAgIH1cbiAgICBpZiAobGlnaHQuaW50ZW5zaXR5ICE9IG51bGwpIHtcbiAgICAgIGludGVuc2l0eSA9IGxpZ2h0LmludGVuc2l0eTtcbiAgICB9XG4gICAgbGlnaHRDb21wb25lbnQuY29sb3IgPSBjb2xvcjtcbiAgICBsaWdodENvbXBvbmVudC5pbnRlbnNpdHkgPSBpbnRlbnNpdHk7XG4gICAgaWYgKGxpZ2h0LnJhbmdlICE9IG51bGwpIHtcbiAgICAgIGxpZ2h0Q29tcG9uZW50LnJhbmdlID0gbGlnaHQucmFuZ2U7XG4gICAgfVxuICAgIGlmIChsaWdodC50eXBlID09PSAnc3BvdCcpIHtcbiAgICAgIGlmIChsaWdodC5zcG90Py5pbm5lckNvbmVBbmdsZSAhPSBudWxsKSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LmlubmVyQ29uZUFuZ2xlID0gbGlnaHQuc3BvdC5pbm5lckNvbmVBbmdsZTtcbiAgICAgIH1cbiAgICAgIGlmIChsaWdodC5zcG90Py5vdXRlckNvbmVBbmdsZSAhPSBudWxsKSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50Lm91dGVyQ29uZUFuZ2xlID0gbGlnaHQuc3BvdC5vdXRlckNvbmVBbmdsZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXN0b3JlIHRoZSBSaG9kb25pdGUtc3BlY2lmaWMgbGlnaHQgc3RhdGUgc3RvcmVkIGJ5IEdsdGYyRXhwb3J0ZXIuXG4gICAgY29uc3QgcmhvZG9uaXRlRXh0cmFzID0gKFxuICAgICAgbGlnaHQuZXh0cmFzIGFzXG4gICAgICAgIHwge1xuICAgICAgICAgICAgcmhvZG9uaXRlPzoge1xuICAgICAgICAgICAgICBjYXN0U2hhZG93PzogYm9vbGVhbjtcbiAgICAgICAgICAgICAgcG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lPzogbnVtYmVyO1xuICAgICAgICAgICAgICBzaGFkb3daTmVhckZvclNwb3RMaWdodD86IG51bWJlcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB8IHVuZGVmaW5lZFxuICAgICk/LnJob2Rvbml0ZTtcbiAgICBpZiAocmhvZG9uaXRlRXh0cmFzICE9IG51bGwpIHtcbiAgICAgIGlmIChyaG9kb25pdGVFeHRyYXMuY2FzdFNoYWRvdyAhPSBudWxsKSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LmNhc3RTaGFkb3cgPSByaG9kb25pdGVFeHRyYXMuY2FzdFNoYWRvdztcbiAgICAgIH1cbiAgICAgIGlmIChyaG9kb25pdGVFeHRyYXMucG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lICE9IG51bGwpIHtcbiAgICAgICAgbGlnaHRDb21wb25lbnQucG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lID0gcmhvZG9uaXRlRXh0cmFzLnBvaW50TGlnaHRTaGFkb3dGYXJQbGFuZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaG9kb25pdGVFeHRyYXMuc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgIT0gbnVsbCkge1xuICAgICAgICBsaWdodENvbXBvbmVudC5zaGFkb3daTmVhckZvclNwb3RMaWdodCA9IHJob2Rvbml0ZUV4dHJhcy5zaGFkb3daTmVhckZvclNwb3RMaWdodDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhIGNhbWVyYSBlbnRpdHkgZnJvbSBnbFRGIGNhbWVyYSBkYXRhXG4gICAqIEBwYXJhbSBjYW1lcmEgLSBUaGUgZ2xURiBjYW1lcmEgZGF0YVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBDb25maWd1cmVkIGNhbWVyYSBlbnRpdHlcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBDYW1lcmEoZW5naW5lOiBFbmdpbmUsIGNhbWVyYTogUm5NMkNhbWVyYSwgZ2x0Zk1vZGVsOiBSbk0yKTogSUNhbWVyYUVudGl0eSB7XG4gICAgY29uc3QgY2FtZXJhRW50aXR5ID0gdGhpcy5fX2dlbmVyYXRlQ2FtZXJhRW50aXR5KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBjYW1lcmFDb21wb25lbnQgPSBjYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCk7XG4gICAgY2FtZXJhQ29tcG9uZW50LmRpcmVjdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgLTFdKTtcbiAgICBpZiAoZ2x0Zk1vZGVsLmFzc2V0ICYmIChnbHRmTW9kZWwuYXNzZXQgYXMgYW55KS5MYXN0U2F2ZWRfQXBwbGljYXRpb25WZW5kb3IpIHtcbiAgICAgIC8vIEZvciBhbiBvbGQgZXhwb3J0ZXIgY29tcGF0aWJpbGl0eVxuICAgICAgY2FtZXJhQ29tcG9uZW50LmRpcmVjdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMSwgMCwgMF0pO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LmRpcmVjdGlvbklubmVyID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsxLCAwLCAwXSk7XG4gICAgfVxuICAgIGNhbWVyYUNvbXBvbmVudC51cCA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMSwgMF0pO1xuICAgIGNhbWVyYUNvbXBvbmVudC50eXBlID0gQ2FtZXJhVHlwZS5mcm9tU3RyaW5nKGNhbWVyYS50eXBlKTtcbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50LnR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUpIHtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC5hc3BlY3QgPSBjYW1lcmEucGVyc3BlY3RpdmUhLmFzcGVjdFJhdGlvID8gY2FtZXJhLnBlcnNwZWN0aXZlIS5hc3BlY3RSYXRpbyA6IDE7XG4gICAgICBjYW1lcmFDb21wb25lbnQuc2V0Rm92eUFuZENoYW5nZUZvY2FsTGVuZ3RoKE1hdGhVdGlsLnJhZGlhblRvRGVncmVlKGNhbWVyYS5wZXJzcGVjdGl2ZSEueWZvdikpO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpOZWFyID0gY2FtZXJhLnBlcnNwZWN0aXZlIS56bmVhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC56RmFyID0gY2FtZXJhLnBlcnNwZWN0aXZlIS56ZmFyID8gY2FtZXJhLnBlcnNwZWN0aXZlIS56ZmFyIDogMTAwMDAwO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnRyeVRvU2V0VGFnKHtcbiAgICAgICAgdGFnOiAnT3JpZ2luYWxGb3ZZJyxcbiAgICAgICAgdmFsdWU6IGNhbWVyYUNvbXBvbmVudC5mb3Z5LFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChjYW1lcmFDb21wb25lbnQudHlwZSA9PT0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWMpIHtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC54TWFnID0gY2FtZXJhLm9ydGhvZ3JhcGhpYyEueG1hZztcbiAgICAgIGNhbWVyYUNvbXBvbmVudC55TWFnID0gY2FtZXJhLm9ydGhvZ3JhcGhpYyEueW1hZztcbiAgICAgIGNhbWVyYUNvbXBvbmVudC56TmVhciA9IGNhbWVyYS5vcnRob2dyYXBoaWMhLnpuZWFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpGYXIgPSBjYW1lcmEub3J0aG9ncmFwaGljIS56ZmFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnRyeVRvU2V0VGFnKHtcbiAgICAgICAgdGFnOiAnT3JpZ2luYWxYTWFnJyxcbiAgICAgICAgdmFsdWU6IGNhbWVyYUNvbXBvbmVudC54TWFnLFxuICAgICAgfSk7XG4gICAgICBjYW1lcmFDb21wb25lbnQudHJ5VG9TZXRUYWcoe1xuICAgICAgICB0YWc6ICdPcmlnaW5hbFlNYWcnLFxuICAgICAgICB2YWx1ZTogY2FtZXJhQ29tcG9uZW50LnlNYWcsXG4gICAgICB9KTtcbiAgICB9XG4gICAgY2FtZXJhQ29tcG9uZW50LnRyeVRvU2V0VGFnKHtcbiAgICAgIHRhZzogJ09yaWdpbmFsQXNwZWN0JyxcbiAgICAgIHZhbHVlOiBjYW1lcmFDb21wb25lbnQuYXNwZWN0LFxuICAgIH0pO1xuICAgIHJldHVybiBjYW1lcmFFbnRpdHkgYXMgSUNhbWVyYUVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGEgbWVzaCBlbnRpdHkgZnJvbSBnbFRGIG1lc2ggZGF0YVxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gbWVzaCAtIFRoZSBnbFRGIG1lc2ggZGF0YVxuICAgKiBAcGFyYW0gbWVzaEluZGV4IC0gSW5kZXggb2YgdGhlIG1lc2ggaW4gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIHJuQnVmZmVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBidWZmZXJzXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBybk1hdGVyaWFscyAtIEFycmF5IG9mIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAgICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAgICogQHJldHVybnMgQ29uZmlndXJlZCBtZXNoIGVudGl0eVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cE1lc2goXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgbWVzaDogUm5NMk1lc2gsXG4gICAgbWVzaEluZGV4OiBJbmRleCxcbiAgICBybkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBybk1hdGVyaWFsczogTWF0ZXJpYWxbXSxcbiAgICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gICAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4gICkge1xuICAgIGNvbnN0IG1lc2hFbnRpdHkgPSB0aGlzLl9fZ2VuZXJhdGVNZXNoRW50aXR5KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBleGlzdGluZ1JuTWVzaCA9IChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIGFzIGFueSkucm5NZXNoZXNBdEdsdE1lc2hJZHhbbWVzaEluZGV4XT8uZGVyZWYoKSBhcyBNZXNoIHwgdW5kZWZpbmVkO1xuICAgIGxldCByblByaW1pdGl2ZU1vZGUgPSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcztcbiAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gbWVzaEVudGl0eS5nZXRNZXNoKCk7XG5cbiAgICBpZiAoZXhpc3RpbmdSbk1lc2ggIT0gbnVsbCkge1xuICAgICAgbWVzaENvbXBvbmVudC5zZXRNZXNoKGV4aXN0aW5nUm5NZXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgcm5NZXNoID0gbmV3IE1lc2goZW5naW5lKTtcbiAgICAgIC8vIHNldCBmbGFnIHRvIHJuTWVzaCB3aXRoIG9wdGlvbnNcbiAgICAgIGNvbnN0IHJuTG9hZGVyT3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTG9hZGVyT3B0aW9ucztcbiAgICAgIGlmIChybkxvYWRlck9wdGlvbnM/LnRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgIT0gbnVsbCkge1xuICAgICAgICBybk1lc2gudGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9IHJuTG9hZGVyT3B0aW9ucy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzZXR1cE1hdGVyaWFsVmFyaWFudHMgPSAocm5QcmltaXRpdmU6IFByaW1pdGl2ZSwgcHJpbWl0aXZlOiBSbk0yUHJpbWl0aXZlKSA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsVmFyaWFudHMgPSBwcmltaXRpdmUubWF0ZXJpYWxWYXJpYW50cztcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChtYXRlcmlhbFZhcmlhbnRzKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IG1hdGVyaWFsVmFyaWFudCBvZiBtYXRlcmlhbFZhcmlhbnRzKSB7XG4gICAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBybk1hdGVyaWFsc1ttYXRlcmlhbFZhcmlhbnQubWF0ZXJpYWxdO1xuXG4gICAgICAgICAgZm9yIChjb25zdCB2YXJpYW50TmFtZSBvZiBtYXRlcmlhbFZhcmlhbnQudmFyaWFudHMpIHtcbiAgICAgICAgICAgIHJuUHJpbWl0aXZlLnNldE1hdGVyaWFsVmFyaWFudCh2YXJpYW50TmFtZSwgbWF0ZXJpYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZm9yIChjb25zdCBpIGluIG1lc2gucHJpbWl0aXZlcykge1xuICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoLnByaW1pdGl2ZXNbaV0gYXMgUm5NMlByaW1pdGl2ZTtcbiAgICAgICAgaWYgKHByaW1pdGl2ZS5tb2RlICE9IG51bGwpIHtcbiAgICAgICAgICByblByaW1pdGl2ZU1vZGUgPSBQcmltaXRpdmVNb2RlLmZyb20ocHJpbWl0aXZlLm1vZGUpITtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJuUHJpbWl0aXZlID0gbmV3IFByaW1pdGl2ZShlbmdpbmUpO1xuXG4gICAgICAgIGNvbnN0IHJuTWF0ZXJpYWwgPVxuICAgICAgICAgIHByaW1pdGl2ZS5tYXRlcmlhbCAhPSBudWxsXG4gICAgICAgICAgICA/IHJuTWF0ZXJpYWxzW3ByaW1pdGl2ZS5tYXRlcmlhbF1cbiAgICAgICAgICAgIDogdGhpcy5fX3NldHVwTWF0ZXJpYWwoZW5naW5lLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuICAgICAgICBzZXR1cE1hdGVyaWFsVmFyaWFudHMocm5QcmltaXRpdmUsIHByaW1pdGl2ZSk7XG5cbiAgICAgICAgaWYgKHJuTWF0ZXJpYWwubWF0ZXJpYWxUeXBlTmFtZS5pbmRleE9mKCdNVG9vbicpICE9PSAtMSkge1xuICAgICAgICAgIGNvbnN0IFZSTVByb3BlcnRpZXMgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk07XG4gICAgICAgICAgaWYgKFZSTVByb3BlcnRpZXM/LnJuRXh0ZW5zaW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHJuRXh0ZW5zaW9uID0gVlJNUHJvcGVydGllcy5ybkV4dGVuc2lvbjtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclBhc3NPdXRsaW5lID0gcm5FeHRlbnNpb24ucmVuZGVyUGFzc091dGxpbmU7XG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lTWF0ZXJpYWwgPSBwcmltaXRpdmUubWF0ZXJpYWxPYmplY3Q/LmV4dHJhcz8ub3V0bGluZU1hdGVyaWFsPy5kZXJlZigpO1xuICAgICAgICAgICAgaWYgKG91dGxpbmVNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHJlbmRlclBhc3NPdXRsaW5lLnNldE1hdGVyaWFsRm9yUHJpbWl0aXZlKG91dGxpbmVNYXRlcmlhbCwgcm5QcmltaXRpdmUpO1xuICAgICAgICAgICAgICByblByaW1pdGl2ZS5zZXRNYXRlcmlhbFZhcmlhbnQoJ291dGxpbmUnLCBvdXRsaW5lTWF0ZXJpYWwpOyAvLyBUbyBhdHRhY2ggYW4gb3V0bGluZU1hdGVyaWFsIHJlZmVyZW5jZSB0byB0aGUgcHJpbWl0aXZlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW5kaWNlc1xuICAgICAgICBsZXQgaW5kaWNlc1JuQWNjZXNzb3I6IEFjY2Vzc29yIHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBtYXA6IE1hcDxWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcsIEFjY2Vzc29yPiA9IG5ldyBNYXAoKTtcbiAgICAgICAgaWYgKHByaW1pdGl2ZS5leHRlbnNpb25zPy5LSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbikge1xuICAgICAgICAgIGluZGljZXNSbkFjY2Vzc29yID0gdGhpcy5fX2RlY29kZURyYWNvKGVuZ2luZSwgcHJpbWl0aXZlLCBybkJ1ZmZlcnMsIGdsdGZNb2RlbCwgbWFwKTtcblxuICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3QoaW5kaWNlc1JuQWNjZXNzb3IpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaW5kaWNlc1xuICAgICAgICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUuaW5kaWNlcykpIHtcbiAgICAgICAgICAgIGluZGljZXNSbkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3IoZW5naW5lLCBwcmltaXRpdmUuaW5kaWNlc09iamVjdCEsIHJuQnVmZmVycyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gYXR0cmlidXRlc1xuICAgICAgICAgIGNvbnN0IHJuQnVmZmVyVmlld01hcDogTWFwPG51bWJlciwgQnVmZmVyVmlldz4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHByaW1pdGl2ZS5hdHRyaWJ1dGVzT2JqZWN0cyEpIHtcbiAgICAgICAgICAgIGNvbnN0IHJubTJhdHRyaWJ1dGUgPSBwcmltaXRpdmUuYXR0cmlidXRlc09iamVjdHNbYXR0cmlidXRlTmFtZV0hO1xuICAgICAgICAgICAgY29uc3Qgcm5CdWZmZXIgPSBybkJ1ZmZlcnNbcm5tMmF0dHJpYnV0ZS5idWZmZXJWaWV3T2JqZWN0IS5idWZmZXIhXTtcbiAgICAgICAgICAgIGxldCBybkJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXcgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoSXMuZXhpc3Qocm5tMmF0dHJpYnV0ZS5idWZmZXJWaWV3KSkge1xuICAgICAgICAgICAgICBybkJ1ZmZlclZpZXcgPSBybkJ1ZmZlclZpZXdNYXAuZ2V0KHJubTJhdHRyaWJ1dGUuYnVmZmVyVmlldyk7XG4gICAgICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3Qocm5CdWZmZXJWaWV3KSkge1xuICAgICAgICAgICAgICAgIHJuQnVmZmVyVmlldyA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXcocm5tMmF0dHJpYnV0ZS5idWZmZXJWaWV3T2JqZWN0ISwgcm5CdWZmZXIpO1xuICAgICAgICAgICAgICAgIHJuQnVmZmVyVmlld01hcC5zZXQocm5tMmF0dHJpYnV0ZS5idWZmZXJWaWV3LCBybkJ1ZmZlclZpZXcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBybkJ1ZmZlclZpZXcgPSBybkJ1ZmZlclxuICAgICAgICAgICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiAwLFxuICAgICAgICAgICAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkFjY2Vzc29yKGVuZ2luZSwgcm5tMmF0dHJpYnV0ZSwgcm5CdWZmZXJWaWV3KTtcblxuICAgICAgICAgICAgY29uc3Qgam9pbmVkU3RyaW5nID0gVmVydGV4QXR0cmlidXRlLnRvVmVydGV4QXR0cmlidXRlU2VtYW50aWNKb2luZWRTdHJpbmdBc0dsdGZTdHlsZShcbiAgICAgICAgICAgICAgVmVydGV4QXR0cmlidXRlLmZyb21TdHJpbmcoYXR0cmlidXRlTmFtZSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtYXAuc2V0KGpvaW5lZFN0cmluZywgYXR0cmlidXRlUm5BY2Nlc3Nvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcm5QcmltaXRpdmUuc2V0RGF0YShtYXAsIHJuUHJpbWl0aXZlTW9kZSwgcm5NYXRlcmlhbCwgaW5kaWNlc1JuQWNjZXNzb3IpO1xuICAgICAgICB0aGlzLl9fZ2VuZXJhdGVOb3JtYWxzSWZNaXNzaW5nKGVuZ2luZSwgcm5QcmltaXRpdmUsIGluZGljZXNSbkFjY2Vzc29yKTtcblxuICAgICAgICAvLyBtb3JwaCB0YXJnZXRzXG4gICAgICAgIGlmIChwcmltaXRpdmUudGFyZ2V0cyAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gc2V0IGRlZmF1bHQgbnVtYmVyXG4gICAgICAgICAgY29uc3QgdGFyZ2V0czogQXJyYXk8TWFwPFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZywgQWNjZXNzb3I+PiA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlLnRhcmdldHNPYmplY3RzIS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gcHJpbWl0aXZlLnRhcmdldHNPYmplY3RzIVtpXTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE1hcDogTWFwPFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZywgQWNjZXNzb3I+ID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHRhcmdldCkge1xuICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVBY2Nlc3NvciA9IHRhcmdldFthdHRyaWJ1dGVOYW1lXTtcbiAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yKGVuZ2luZSwgYXR0cmlidXRlQWNjZXNzb3IsIHJuQnVmZmVycyk7XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZVJuQWNjZXNzb3JJbkdQVVZlcnRleERhdGEgPSB0aGlzLl9fY29weVJuQWNjZXNzb3JBbmRCdWZmZXJWaWV3Rm9yTW9ycGhEYXRhKFxuICAgICAgICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGNvbnN0IHZlcnRleEF0dHJpYnV0ZSA9IFZlcnRleEF0dHJpYnV0ZS5mcm9tU3RyaW5nKGF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICAgICAgICBjb25zdCBqb2luZWRTdHJpbmcgPSBWZXJ0ZXhBdHRyaWJ1dGUudG9WZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY0pvaW5lZFN0cmluZ0FzR2x0ZlN0eWxlKHZlcnRleEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgIHRhcmdldE1hcC5zZXQoam9pbmVkU3RyaW5nLCBhdHRyaWJ1dGVSbkFjY2Vzc29ySW5HUFVWZXJ0ZXhEYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldHMucHVzaCh0YXJnZXRNYXApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJuUHJpbWl0aXZlLnNldEJsZW5kU2hhcGVUYXJnZXRzKHRhcmdldHMpO1xuICAgICAgICB9XG4gICAgICAgIHJuTWVzaC5hZGRQcmltaXRpdmUocm5QcmltaXRpdmUpO1xuICAgICAgfVxuXG4gICAgICBtZXNoQ29tcG9uZW50LnNldE1lc2gocm5NZXNoKTtcbiAgICAgIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIGFzIGFueSkucm5NZXNoZXNBdEdsdE1lc2hJZHhbbWVzaEluZGV4XSA9IG5ldyBXZWFrUmVmKHJuTWVzaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc2hFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBzcGFyc2UgYWNjZXNzb3IgZGF0YSBieSBhcHBseWluZyBzcGFyc2UgaW5kaWNlcyBhbmQgdmFsdWVzIHRvIHRoZSBiYXNlIGFjY2Vzc29yXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBnbFRGIGFjY2Vzc29yIHdpdGggc3BhcnNlIGRhdGFcbiAgICogQHBhcmFtIHJuQWNjZXNzb3IgLSBUaGUgUmhvZG9uaXRlIGFjY2Vzc29yIHRvIG1vZGlmeVxuICAgKi9cbiAgc3RhdGljIHNldFNwYXJzZUFjY2Vzc29yKGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IsIHJuQWNjZXNzb3I6IEFjY2Vzc29yKTogdm9pZCB7XG4gICAgY29uc3QgY291bnQgPSBhY2Nlc3Nvci5zcGFyc2UhLmNvdW50O1xuXG4gICAgLy8gZ2V0IHNwYXJzZSBpbmRpY2VzXG4gICAgY29uc3Qgc3BhcnNlSW5kaWNlcyA9IGFjY2Vzc29yLnNwYXJzZSEuaW5kaWNlcyE7XG4gICAgY29uc3QgaW5kaWNlc0J1ZmZlclZpZXcgPSBzcGFyc2VJbmRpY2VzLmJ1ZmZlclZpZXdPYmplY3Q7XG4gICAgbGV0IGJ1ZmZlcjogVWludDhBcnJheSA9IHNwYXJzZUluZGljZXMuYnVmZmVyVmlld09iamVjdC5idWZmZXJPYmplY3QhLmJ1ZmZlciE7XG4gICAgY29uc3QgYnl0ZU9mZnNldEJ1ZmZlclZpZXdBbmRTcGFyc2VJbmRpY2VzOiBudW1iZXIgPVxuICAgICAgKGluZGljZXNCdWZmZXJWaWV3LmJ5dGVPZmZzZXQgPz8gMCkgKyAoc3BhcnNlSW5kaWNlcy5ieXRlT2Zmc2V0ID8/IDApO1xuXG4gICAgY29uc3QgY29tcG9uZW50Qnl0ZXNJbmRpY2VzID0gdGhpcy5fY2hlY2tCeXRlc1BlckNvbXBvbmVudChzcGFyc2VJbmRpY2VzKTtcbiAgICBjb25zdCBieXRlTGVuZ3RoSW5kaWNlcyA9IGNvbXBvbmVudEJ5dGVzSW5kaWNlcyAqIGNvdW50OyAvLyBpbmRleCBpcyBzY2FsYXJcbiAgICBjb25zdCBkYXRhVmlld0luZGljZXM6IGFueSA9IG5ldyBEYXRhVmlldyhcbiAgICAgIGJ1ZmZlci5idWZmZXIsXG4gICAgICBieXRlT2Zmc2V0QnVmZmVyVmlld0FuZFNwYXJzZUluZGljZXMgKyBidWZmZXIuYnl0ZU9mZnNldCxcbiAgICAgIGJ5dGVMZW5ndGhJbmRpY2VzXG4gICAgKTtcblxuICAgIGNvbnN0IGRhdGFWaWV3TWV0aG9kSW5kaWNlcyA9IHRoaXMuX2NoZWNrRGF0YVZpZXdNZXRob2Qoc3BhcnNlSW5kaWNlcyk7XG5cbiAgICAvLyBnZXQgc3BhcnNlIHZhbHVlc1xuICAgIGNvbnN0IHNwYXJzZVZhbHVlcyA9IGFjY2Vzc29yLnNwYXJzZSEudmFsdWVzITtcbiAgICBjb25zdCB2YWx1ZUJ1ZmZlclZpZXcgPSBzcGFyc2VWYWx1ZXMuYnVmZmVyVmlld09iamVjdDtcbiAgICBidWZmZXIgPSBzcGFyc2VWYWx1ZXMuYnVmZmVyVmlld09iamVjdC5idWZmZXJPYmplY3QhLmJ1ZmZlciE7XG4gICAgY29uc3QgYnl0ZU9mZnNldEJ1ZmZlclZpZXdBbmRBY2Nlc3NvclZhbHVlczogbnVtYmVyID1cbiAgICAgICh2YWx1ZUJ1ZmZlclZpZXcuYnl0ZU9mZnNldCA/PyAwKSArIChzcGFyc2VWYWx1ZXMuYnl0ZU9mZnNldCA/PyAwKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudEJ5dGVzVmFsdWVzID0gdGhpcy5fY2hlY2tCeXRlc1BlckNvbXBvbmVudChhY2Nlc3Nvcik7XG4gICAgY29uc3QgY29tcG9uZW50TlZhbHVlcyA9IHRoaXMuX2NoZWNrQ29tcG9uZW50TnVtYmVyKGFjY2Vzc29yKTtcbiAgICBjb25zdCBieXRlTGVuZ3RoVmFsdWVzID0gY29tcG9uZW50Qnl0ZXNWYWx1ZXMgKiBjb21wb25lbnROVmFsdWVzICogY291bnQ7XG4gICAgY29uc3QgZGF0YVZpZXdWYWx1ZXM6IGFueSA9IG5ldyBEYXRhVmlldyhcbiAgICAgIGJ1ZmZlci5idWZmZXIsXG4gICAgICBieXRlT2Zmc2V0QnVmZmVyVmlld0FuZEFjY2Vzc29yVmFsdWVzICsgYnVmZmVyLmJ5dGVPZmZzZXQsXG4gICAgICBieXRlTGVuZ3RoVmFsdWVzXG4gICAgKTtcbiAgICBjb25zdCBkYXRhVmlld01ldGhvZFZhbHVlcyA9IHRoaXMuX2NoZWNrRGF0YVZpZXdNZXRob2QoYWNjZXNzb3IpO1xuXG4gICAgLy8gc2V0IHNwYXJzZSB2YWx1ZXMgdG8gcm5BY2Nlc3NvclxuICAgIGNvbnN0IHR5cGVkQXJyYXkgPSBybkFjY2Vzc29yLmdldFR5cGVkQXJyYXkoKTtcbiAgICBjb25zdCBsaXR0bGVFbmRpYW4gPSB0cnVlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgY29uc3QgaW5kZXggPSBkYXRhVmlld0luZGljZXNbZGF0YVZpZXdNZXRob2RJbmRpY2VzXShjb21wb25lbnRCeXRlc0luZGljZXMgKiBpLCBsaXR0bGVFbmRpYW4pO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb21wb25lbnROVmFsdWVzOyBqKyspIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkYXRhVmlld1ZhbHVlc1tkYXRhVmlld01ldGhvZFZhbHVlc10oXG4gICAgICAgICAgY29tcG9uZW50Qnl0ZXNWYWx1ZXMgKiBjb21wb25lbnROVmFsdWVzICogaSArIGNvbXBvbmVudEJ5dGVzVmFsdWVzICogaixcbiAgICAgICAgICBsaXR0bGVFbmRpYW5cbiAgICAgICAgKTtcbiAgICAgICAgdHlwZWRBcnJheVtpbmRleCAqIGNvbXBvbmVudE5WYWx1ZXMgKyBqXSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgcm5BY2Nlc3Nvci5zZXRUeXBlZEFycmF5KHR5cGVkQXJyYXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIFZSTSAxLjAgbWF0ZXJpYWwgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICAgKiBAcGFyYW0gcm5Mb2FkZXJPcHRpb25zIC0gTG9hZGVyIG9wdGlvbnNcbiAgICogQHJldHVybnMgQ29uZmlndXJlZCBtYXRlcmlhbCBvciB1bmRlZmluZWQgaWYgbm90IFZSTSAxLjBcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0VlJNMU1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBtYXRlcmlhbEpzb246IFZybTFfTWF0ZXJpYWwsXG4gICAgcm5Mb2FkZXJPcHRpb25zOiBHbHRmTG9hZE9wdGlvblxuICApOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgVlJNUHJvcGVydGllcyA9IGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTTtcblxuICAgIGNvbnN0IFZSTUNfbWF0ZXJpYWxzX210b29uID0gbWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LlZSTUNfbWF0ZXJpYWxzX210b29uO1xuICAgIGlmIChWUk1DX21hdGVyaWFsc19tdG9vbiAhPSBudWxsKSB7XG4gICAgICBjb25zdCBjcmVhdGVNVG9vbjFNYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMU1hdGVyaWFsSW1wbDtcbiAgICAgIGlmIChjcmVhdGVNVG9vbjFNYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgICAgICdWUk0gMS4wIG1hdGVyaWFsIHN1cHBvcnQgaXMgbm90IGxvYWRlZC4gSW1wb3J0IHRoZSBtb2RlbCB0aHJvdWdoIE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdCgpLidcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgLy8gYXJndW1lbnRcbiAgICAgIGNvbnN0IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50ID0gcm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTmFtZSA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LmFkZGl0aW9uYWxOYW1lO1xuICAgICAgY29uc3QgaXNNb3JwaGluZyA9IHRydWU7IC8vdGhpcy5fX2lzTW9ycGhpbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICAgIGNvbnN0IGlzU2tpbm5pbmcgPSB0cnVlOyAvLyB0aGlzLl9faXNTa2lubmluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgICAgY29uc3QgaXNMaWdodGluZyA9IHRoaXMuX19pc0xpZ2h0aW5nKGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uKTtcbiAgICAgIGNvbnN0IHVzZVRhbmdlbnRBdHRyaWJ1dGUgPSB0cnVlOyAvLyB0aGlzLl9fdXNlVGFuZ2VudEF0dHJpYnV0ZShnbHRmTW9kZWwsIHByaW1pdGl2ZSk7XG4gICAgICBjb25zdCB0ZXh0dXJlcyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LnRleHR1cmVzO1xuICAgICAgY29uc3Qgc2FtcGxlcnMgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5zYW1wbGVycztcbiAgICAgIGNvbnN0IGRlYnVnTW9kZSA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LmRlYnVnTW9kZTtcbiAgICAgIGNvbnN0IG1heEluc3RhbmNlc051bWJlciA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50Lm1heEluc3RhbmNlc051bWJlcjtcbiAgICAgIGNvbnN0IG1ha2VPdXRwdXRTcmdiID0gdGhpcy5fX21ha2VPdXRwdXRTcmdiKGdsdGZNb2RlbCk7XG5cbiAgICAgIC8vIG91dGxpbmVcbiAgICAgIGxldCByZW5kZXJQYXNzT3V0bGluZTogUmVuZGVyUGFzcyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChJcy5leGlzdChWUk1Qcm9wZXJ0aWVzPy5ybkV4dGVuc2lvbikpIHtcbiAgICAgICAgY29uc3Qgcm5FeHRlbnNpb24gPSBWUk1Qcm9wZXJ0aWVzLnJuRXh0ZW5zaW9uO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZSA9IHJuRXh0ZW5zaW9uLnJlbmRlclBhc3NPdXRsaW5lIGFzIFJlbmRlclBhc3M7XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lLmlzVnJSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZS50cnlUb1NldFVuaXF1ZU5hbWUoJ1ZSTSBPdXRsaW5lIFJlbmRlclBhc3MnLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy9leGlzdCBvdXRsaW5lXG4gICAgICBpZiAocmVuZGVyUGFzc091dGxpbmUgIT0gbnVsbCkge1xuICAgICAgICBsZXQgb3V0bGluZU1hdGVyaWFsOiBNYXRlcmlhbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgLy8gVGhlIFZSTSAxLjAgc3BlY2lmaWNhdGlvbiBkZWZhdWx0cyBvdXRsaW5lV2lkdGhNb2RlIHRvIFwibm9uZVwiIHdoZW4gaXQgaXMgb21pdHRlZC5cbiAgICAgICAgY29uc3Qgb3V0bGluZVdpZHRoTW9kZSA9IFZSTUNfbWF0ZXJpYWxzX210b29uLm91dGxpbmVXaWR0aE1vZGU7XG4gICAgICAgIGlmIChvdXRsaW5lV2lkdGhNb2RlID09PSAnd29ybGRDb29yZGluYXRlcycgfHwgb3V0bGluZVdpZHRoTW9kZSA9PT0gJ3NjcmVlbkNvb3JkaW5hdGVzJykge1xuICAgICAgICAgIG91dGxpbmVNYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMU1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgICAgICAgYWRkaXRpb25hbE5hbWUsXG4gICAgICAgICAgICBpc01vcnBoaW5nLFxuICAgICAgICAgICAgaXNTa2lubmluZyxcbiAgICAgICAgICAgIGlzTGlnaHRpbmcsXG4gICAgICAgICAgICB1c2VUYW5nZW50QXR0cmlidXRlLFxuICAgICAgICAgICAgaXNPdXRsaW5lOiB0cnVlLFxuICAgICAgICAgICAgbWF0ZXJpYWxKc29uLFxuICAgICAgICAgICAgdGV4dHVyZXMsXG4gICAgICAgICAgICBzYW1wbGVycyxcbiAgICAgICAgICAgIGRlYnVnTW9kZSxcbiAgICAgICAgICAgIG1heEluc3RhbmNlc051bWJlcixcbiAgICAgICAgICAgIG1ha2VPdXRwdXRTcmdiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKElzLmV4aXN0KG91dGxpbmVNYXRlcmlhbCkpIHtcbiAgICAgICAgICBtYXRlcmlhbEpzb24uZXh0cmFzIS5vdXRsaW5lTWF0ZXJpYWwgPSBuZXcgV2Vha1JlZihvdXRsaW5lTWF0ZXJpYWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlTVRvb24xTWF0ZXJpYWwoZW5naW5lLCB7XG4gICAgICAgIGFkZGl0aW9uYWxOYW1lLFxuICAgICAgICBpc01vcnBoaW5nLFxuICAgICAgICBpc1NraW5uaW5nLFxuICAgICAgICBpc0xpZ2h0aW5nLFxuICAgICAgICB1c2VUYW5nZW50QXR0cmlidXRlLFxuICAgICAgICBpc091dGxpbmU6IGZhbHNlLFxuICAgICAgICBtYXRlcmlhbEpzb24sXG4gICAgICAgIHRleHR1cmVzLFxuICAgICAgICBzYW1wbGVycyxcbiAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICBtYXhJbnN0YW5jZXNOdW1iZXIsXG4gICAgICAgIG1ha2VPdXRwdXRTcmdiLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1vZGVsQ29udmVydGVyLnNldE1Ub29uVGV4dHVyZXModGV4dHVyZXMsIG1hdGVyaWFsUHJvcGVydGllcywgbWF0ZXJpYWwsIHNhbXBsZXJzKTtcblxuICAgICAgLy8gZGlzYWJsZSB1bmxpdFxuICAgICAgKG1hdGVyaWFsSnNvbi5leHRlbnNpb25zIGFzIGFueSkuS0hSX21hdGVyaWFsc191bmxpdCA9IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgIH1cblxuICAgIC8vIHVzZSBhbm90aGVyIG1hdGVyaWFsXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIE1Ub29uIHRleHR1cmUgcGFyYW1ldGVycyBmb3IgVlJNIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gdGV4dHVyZXMgLSBBcnJheSBvZiB0ZXh0dXJlc1xuICAgKiBAcGFyYW0gbWF0ZXJpYWxQcm9wZXJ0aWVzIC0gVlJNIG1hdGVyaWFsIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICAgKiBAcGFyYW0gc2FtcGxlcnMgLSBBcnJheSBvZiBzYW1wbGVyc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgc2V0TVRvb25UZXh0dXJlcyhcbiAgICB0ZXh0dXJlczogYW55LFxuICAgIG1hdGVyaWFsUHJvcGVydGllczogVnJtMHhNYXRlcmlhbFByb3BlcnR5LFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICBzYW1wbGVyczogYW55XG4gICkge1xuICAgIGNvbnN0IGxpdENvbG9yVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fTWFpblRleF07XG4gICAgaWYgKGxpdENvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnbGl0Q29sb3JUZXh0dXJlJyxcbiAgICAgICAgbGl0Q29sb3JUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX01haW5UZXhdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBzaGFkZUNvbG9yVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU2hhZGVUZXh0dXJlXTtcbiAgICBpZiAoc2hhZGVDb2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ3NoYWRlQ29sb3JUZXh0dXJlJyxcbiAgICAgICAgc2hhZGVDb2xvclRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU2hhZGVUZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVjZWl2ZVNoYWRvd1RleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1JlY2VpdmVTaGFkb3dUZXh0dXJlXTtcbiAgICBpZiAocmVjZWl2ZVNoYWRvd1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ3JlY2VpdmVTaGFkb3dUZXh0dXJlJyxcbiAgICAgICAgcmVjZWl2ZVNoYWRvd1RleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fUmVjZWl2ZVNoYWRvd1RleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBzaGFkaW5nR3JhZGVUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TaGFkaW5nR3JhZGVUZXh0dXJlXTtcbiAgICBpZiAoc2hhZGluZ0dyYWRlVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnc2hhZGluZ0dyYWRlVGV4dHVyZScsXG4gICAgICAgIHNoYWRpbmdHcmFkZVRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU2hhZGluZ0dyYWRlVGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJpbVRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1JpbVRleHR1cmVdO1xuICAgIGlmIChyaW1UZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdyaW1UZXh0dXJlJyxcbiAgICAgICAgcmltVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9SaW1UZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgbWF0Q2FwVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU3BoZXJlQWRkXTtcbiAgICBpZiAobWF0Q2FwVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnbWF0Q2FwVGV4dHVyZScsXG4gICAgICAgIG1hdENhcFRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU3BoZXJlQWRkXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgZW1pc3Npb25UZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9FbWlzc2lvbk1hcF07XG4gICAgaWYgKGVtaXNzaW9uVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnZW1pc3Npb25UZXh0dXJlJyxcbiAgICAgICAgZW1pc3Npb25UZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX0VtaXNzaW9uTWFwXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fQnVtcE1hcF07XG4gICAgaWYgKG5vcm1hbFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ25vcm1hbFRleHR1cmUnLFxuICAgICAgICBub3JtYWxUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX0J1bXBNYXBdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBvdXRsaW5lV2lkdGhUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhUZXh0dXJlXTtcbiAgICBpZiAob3V0bGluZVdpZHRoVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnb3V0bGluZVdpZHRoVGV4dHVyZScsXG4gICAgICAgIG91dGxpbmVXaWR0aFRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fT3V0bGluZVdpZHRoVGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHV2QW5pbWF0aW9uTWFza1RleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1V2QW5pbU1hc2tUZXh0dXJlXTtcbiAgICBpZiAodXZBbmltYXRpb25NYXNrVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAndXZBbmltYXRpb25NYXNrVGV4dHVyZScsXG4gICAgICAgIHV2QW5pbWF0aW9uTWFza1RleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fVXZBbmltTWFza1RleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIFZSTSAwLnggbWF0ZXJpYWwgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICAgKiBAcGFyYW0gcm5Mb2FkZXJPcHRpb25zIC0gTG9hZGVyIG9wdGlvbnNcbiAgICogQHJldHVybnMgQ29uZmlndXJlZCBtYXRlcmlhbCBvciB1bmRlZmluZWQgaWYgbm90IFZSTSAwLnhcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0VlJNMHhNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gICAgcm5Mb2FkZXJPcHRpb25zOiBHbHRmTG9hZE9wdGlvblxuICApOiBNYXRlcmlhbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgVlJNUHJvcGVydGllcyA9IGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTTtcblxuICAgIGNvbnN0IG1hdGVyaWFsUHJvcGVydGllcyA9IG1hdGVyaWFsSnNvbi5leHRyYXMhLnZybTB4TWF0ZXJpYWxQcm9wZXJ0eSBhcyBWcm0weE1hdGVyaWFsUHJvcGVydHk7XG4gICAgY29uc3Qgc2hhZGVyTmFtZSA9IG1hdGVyaWFsUHJvcGVydGllcy5zaGFkZXI7XG4gICAgaWYgKHNoYWRlck5hbWUgPT09ICdWUk0vTVRvb24nKSB7XG4gICAgICBjb25zdCBjcmVhdGVNVG9vbjB4TWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjB4TWF0ZXJpYWxJbXBsO1xuICAgICAgaWYgKGNyZWF0ZU1Ub29uMHhNYXRlcmlhbCA9PSBudWxsKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgICAgICdWUk0gMC54IG1hdGVyaWFsIHN1cHBvcnQgaXMgbm90IGxvYWRlZC4gSW1wb3J0IHRoZSBtb2RlbCB0aHJvdWdoIE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdCgpLidcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgLy8gYXJndW1lbnRcbiAgICAgIGNvbnN0IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50ID0gcm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTmFtZSA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LmFkZGl0aW9uYWxOYW1lO1xuICAgICAgY29uc3QgaXNNb3JwaGluZyA9IHRydWU7IC8vdGhpcy5fX2lzTW9ycGhpbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICAgIGNvbnN0IGlzU2tpbm5pbmcgPSB0cnVlOyAvL3RoaXMuX19pc1NraW5uaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgICBjb25zdCBpc0xpZ2h0aW5nID0gdGhpcy5fX2lzTGlnaHRpbmcoZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24pO1xuICAgICAgY29uc3QgdXNlVGFuZ2VudEF0dHJpYnV0ZSA9IHRydWU7XG4gICAgICBjb25zdCB0ZXh0dXJlcyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LnRleHR1cmVzO1xuICAgICAgY29uc3Qgc2FtcGxlcnMgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5zYW1wbGVycztcbiAgICAgIGNvbnN0IGRlYnVnTW9kZSA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LmRlYnVnTW9kZTtcbiAgICAgIGNvbnN0IG1heEluc3RhbmNlc051bWJlciA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50Lm1heEluc3RhbmNlc051bWJlcjtcbiAgICAgIGNvbnN0IG1ha2VPdXRwdXRTcmdiID0gdGhpcy5fX21ha2VPdXRwdXRTcmdiKGdsdGZNb2RlbCk7XG5cbiAgICAgIC8vIG91dGxpbmVcbiAgICAgIGxldCByZW5kZXJQYXNzT3V0bGluZTogUmVuZGVyUGFzcyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChJcy5leGlzdChWUk1Qcm9wZXJ0aWVzPy5ybkV4dGVuc2lvbikpIHtcbiAgICAgICAgY29uc3Qgcm5FeHRlbnNpb24gPSBWUk1Qcm9wZXJ0aWVzLnJuRXh0ZW5zaW9uO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZSA9IHJuRXh0ZW5zaW9uLnJlbmRlclBhc3NPdXRsaW5lIGFzIFJlbmRlclBhc3M7XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lLmlzVnJSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZS50cnlUb1NldFVuaXF1ZU5hbWUoJ1ZSTSBPdXRsaW5lIFJlbmRlclBhc3MnLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy9leGlzdCBvdXRsaW5lXG4gICAgICBpZiAocmVuZGVyUGFzc091dGxpbmUgIT0gbnVsbCkge1xuICAgICAgICBsZXQgb3V0bGluZU1hdGVyaWFsOiBNYXRlcmlhbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXMuX091dGxpbmVXaWR0aE1vZGUgIT09IDApIHtcbiAgICAgICAgICBvdXRsaW5lTWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjB4TWF0ZXJpYWwoZW5naW5lLCB7XG4gICAgICAgICAgICBhZGRpdGlvbmFsTmFtZSxcbiAgICAgICAgICAgIGlzTW9ycGhpbmcsXG4gICAgICAgICAgICBpc1NraW5uaW5nLFxuICAgICAgICAgICAgaXNMaWdodGluZyxcbiAgICAgICAgICAgIHVzZVRhbmdlbnRBdHRyaWJ1dGUsXG4gICAgICAgICAgICBpc091dGxpbmU6IHRydWUsXG4gICAgICAgICAgICBtYXRlcmlhbFByb3BlcnRpZXMsXG4gICAgICAgICAgICB0ZXh0dXJlcyxcbiAgICAgICAgICAgIHNhbXBsZXJzLFxuICAgICAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyLFxuICAgICAgICAgICAgbWFrZU91dHB1dFNyZ2IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSXMuZXhpc3Qob3V0bGluZU1hdGVyaWFsKSkge1xuICAgICAgICAgIE1vZGVsQ29udmVydGVyLnNldE1Ub29uVGV4dHVyZXModGV4dHVyZXMsIG1hdGVyaWFsUHJvcGVydGllcywgb3V0bGluZU1hdGVyaWFsLCBzYW1wbGVycyk7XG4gICAgICAgICAgbWF0ZXJpYWxKc29uLmV4dHJhcyEub3V0bGluZU1hdGVyaWFsID0gbmV3IFdlYWtSZWYob3V0bGluZU1hdGVyaWFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMHhNYXRlcmlhbChlbmdpbmUsIHtcbiAgICAgICAgYWRkaXRpb25hbE5hbWUsXG4gICAgICAgIGlzTW9ycGhpbmcsXG4gICAgICAgIGlzU2tpbm5pbmcsXG4gICAgICAgIGlzTGlnaHRpbmcsXG4gICAgICAgIHVzZVRhbmdlbnRBdHRyaWJ1dGUsXG4gICAgICAgIGlzT3V0bGluZTogZmFsc2UsXG4gICAgICAgIG1hdGVyaWFsUHJvcGVydGllcyxcbiAgICAgICAgdGV4dHVyZXMsXG4gICAgICAgIHNhbXBsZXJzLFxuICAgICAgICBkZWJ1Z01vZGUsXG4gICAgICAgIG1heEluc3RhbmNlc051bWJlcixcbiAgICAgICAgbWFrZU91dHB1dFNyZ2IsXG4gICAgICB9KTtcblxuICAgICAgTW9kZWxDb252ZXJ0ZXIuc2V0TVRvb25UZXh0dXJlcyh0ZXh0dXJlcywgbWF0ZXJpYWxQcm9wZXJ0aWVzLCBtYXRlcmlhbCwgc2FtcGxlcnMpO1xuXG4gICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfVxuXG4gICAgLy8gdXNlIGFub3RoZXIgbWF0ZXJpYWxcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhbiBhcHByb3ByaWF0ZSBtYXRlcmlhbCBiYXNlZCBvbiBnbFRGIG1hdGVyaWFsIGRhdGEgYW5kIGxvYWRlciBvcHRpb25zXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgbG9hZGVkIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIGxvYWRlZCBSaG9kb25pdGUgc2FtcGxlcnNcbiAgICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGEgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyBHZW5lcmF0ZWQgbWF0ZXJpYWxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVBcHByb3ByaWF0ZU1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gICAgcm5TYW1wbGVyczogU2FtcGxlcltdLFxuICAgIG1hdGVyaWFsSnNvbj86IFJuTTJNYXRlcmlhbFxuICApOiBNYXRlcmlhbCB7XG4gICAgY29uc3QgaXNUcmFuc2x1Y2VudCA9IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24pO1xuICAgIC8vIGlmIHJuTG9hZGVyT3B0aW9ucyBpcyBzZXQgc29tZXRoaW5nLCBkbyBzcGVjaWFsIGRlYWxcbiAgICBpZiAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuTG9hZGVyT3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMucm5Mb2FkZXJPcHRpb25zO1xuXG4gICAgICAvLyBGb3Igc3BlY2lmaWVkIGxvYWRlciBleHRlbnNpb25cbiAgICAgIGlmIChybkxvYWRlck9wdGlvbnMubG9hZGVyRXh0ZW5zaW9uPy5pc05lZWRlZFRvVXNlVGhpc01hdGVyaWFsPy4oZ2x0Zk1vZGVsKSkge1xuICAgICAgICBjb25zdCBsb2FkZXJFeHRlbnNpb24gPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmxvYWRlckV4dGVuc2lvbjtcbiAgICAgICAgaWYgKGxvYWRlckV4dGVuc2lvbj8uZ2VuZXJhdGVNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGxvYWRlckV4dGVuc2lvbi5nZW5lcmF0ZU1hdGVyaWFsKG1hdGVyaWFsSnNvbiEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBWUk0weFxuICAgICAgaWYgKHJuTG9hZGVyT3B0aW9ucy5fX2lzSW1wb3J0VlJNMHgpIHtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSB0aGlzLl9fc2V0VlJNMHhNYXRlcmlhbChlbmdpbmUsIGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uISwgcm5Mb2FkZXJPcHRpb25zKTtcbiAgICAgICAgaWYgKElzLmV4aXN0KG1hdGVyaWFsKSkge1xuICAgICAgICAgIG1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBpc1RyYW5zbHVjZW50O1xuICAgICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGb3Igc3BlY2lmaWVkIGRlZmF1bHQgbWF0ZXJpYWwgaGVscGVyXG4gICAgICBjb25zdCBtYXRlcmlhbEhlbHBlciA9IHJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXI7XG4gICAgICBpZiAobWF0ZXJpYWxIZWxwZXIgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbWF0ZXJpYWxIZWxwZXIoZW5naW5lLCAuLi4ocm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkgPz8gW10pKTtcbiAgICAgIH1cbiAgICAgIGlmIChybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyTmFtZSAhPSBudWxsKSB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgICAgIGBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJOYW1lIChcIiR7cm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlck5hbWV9XCIpIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuIGAgK1xuICAgICAgICAgICAgJ1Bhc3MgdGhlIGZ1bmN0aW9uIHdpdGggZGVmYXVsdE1hdGVyaWFsSGVscGVyIGluc3RlYWQsIGUuZy4gZGVmYXVsdE1hdGVyaWFsSGVscGVyOiBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsLidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcmUgZGF0YVxuICAgIGNvbnN0IGlzTW9ycGhpbmcgPSB0cnVlOyAvLyB0aGlzLl9faXNNb3JwaGluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGlzU2tpbm5pbmcgPSB0cnVlOyAvL3RoaXMuX19pc1NraW5uaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3QgaXNMaWdodGluZyA9IHRoaXMuX19pc0xpZ2h0aW5nKGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uKTtcbiAgICBjb25zdCBhZGRpdGlvbmFsTmFtZSA9ICcnO1xuXG4gICAgY29uc3Qgcm5Mb2FkZXJPcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zID8/IHt9O1xuICAgIGNvbnN0IHVzZU5vcm1hbFRleHR1cmUgPSBtYXRlcmlhbEpzb24/Lm5vcm1hbFRleHR1cmUgIT0gbnVsbDtcbiAgICBjb25zdCBtYXhNYXRlcmlhbEluc3RhbmNlTnVtYmVyOiBudW1iZXIgPSBlbmdpbmUuY29uZmlnLm1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3O1xuICAgIGNvbnN0IHBiclViZXJNYXRlcmlhbE9wdGlvbnMgPSB7XG4gICAgICBpc01vcnBoaW5nLFxuICAgICAgaXNTa2lubmluZyxcbiAgICAgIGlzTGlnaHRpbmcsXG4gICAgICBpc09jY2x1c2lvbjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5vY2NsdXNpb25UZXh0dXJlKSxcbiAgICAgIGlzRW1pc3NpdmU6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZW1pc3NpdmVUZXh0dXJlKSxcbiAgICAgIGlzQ2xlYXJjb2F0OiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfY2xlYXJjb2F0KSxcbiAgICAgIGlzVHJhbnNtaXNzaW9uOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKSxcbiAgICAgIGlzVm9sdW1lOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdm9sdW1lKSxcbiAgICAgIGlzU2hlZW46IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19zaGVlbiksXG4gICAgICBpc1NwZWN1bGFyOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfc3BlY3VsYXIpLFxuICAgICAgaXNJcmlkZXNjZW5jZTogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlKSxcbiAgICAgIGlzQW5pc290cm9weTogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkpLFxuICAgICAgaXNEaXNwZXJzaW9uOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbiksXG4gICAgICBpc0VtaXNzaXZlU3RyZW5ndGg6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aCksXG4gICAgICBpc0RpZmZ1c2VUcmFuc21pc3Npb246IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbiksXG4gICAgICBpc1NoYWRvdzogISFybkxvYWRlck9wdGlvbnMuc2hhZG93LFxuICAgICAgdXNlTm9ybWFsVGV4dHVyZSxcbiAgICAgIGFkZGl0aW9uYWxOYW1lOiBhZGRpdGlvbmFsTmFtZSxcbiAgICAgIG1heEluc3RhbmNlc051bWJlcjogbWF4TWF0ZXJpYWxJbnN0YW5jZU51bWJlcixcbiAgICB9O1xuXG4gICAgaWYgKElzLmV4aXN0KG1hdGVyaWFsSnNvbikpIHtcbiAgICAgIGlmIChtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uVlJNQ19tYXRlcmlhbHNfbXRvb24gIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBybkxvYWRlck9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkxvYWRlck9wdGlvbnMhO1xuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IHRoaXMuX19zZXRWUk0xTWF0ZXJpYWwoZW5naW5lLCBnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbiBhcyBWcm0xX01hdGVyaWFsLCBybkxvYWRlck9wdGlvbnMpO1xuICAgICAgICBpZiAoSXMuZXhpc3QobWF0ZXJpYWwpKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IGlzVHJhbnNsdWNlbnQ7XG4gICAgICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGUgZXh0ZW5zaW9uIChub2RlLWJhc2VkIHNoYWRlciBtYXRlcmlhbHMpXG4gICAgICBpZiAoUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLmhhc05vZGVCYXNlZE1hdGVyaWFsRXh0ZW5zaW9uKG1hdGVyaWFsSnNvbikpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGFuZCByZXR1cm4gbm9kZS1iYXNlZCBjdXN0b20gbWF0ZXJpYWxcbiAgICAgICAgY29uc3QgY3VzdG9tTWF0ZXJpYWwgPSBSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24uY3JlYXRlTm9kZUJhc2VkTWF0ZXJpYWwoXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgICBtYXRlcmlhbEpzb24sXG4gICAgICAgICAgcm5UZXh0dXJlcyA/PyBbXSxcbiAgICAgICAgICByblNhbXBsZXJzID8/IFtdLFxuICAgICAgICAgIHBiclViZXJNYXRlcmlhbE9wdGlvbnNcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKElzLmV4aXN0KGN1c3RvbU1hdGVyaWFsKSkge1xuICAgICAgICAgIGN1c3RvbU1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBpc1RyYW5zbHVjZW50O1xuICAgICAgICAgIHJldHVybiBjdXN0b21NYXRlcmlhbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgbm9kZS1iYXNlZCBtYXRlcmlhbCBpbXBsZW1lbnRhdGlvbiBpcyBsb2FkZWQgb24gZGVtYW5kLiBGYWxsaW5nIGJhY2sgdG8gdGhlIGRlZmF1bHQgbWF0ZXJpYWxcbiAgICAgICAgLy8ga2VlcHMgdGhlIHN5bmNocm9ub3VzIGNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdFNpbXBsZSgpIHBhdGggdXNhYmxlLlxuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICAgICAnUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlOiBGYWlsZWQgdG8gY3JlYXRlIGEgbm9kZS1iYXNlZCBtYXRlcmlhbC4gRmFsbGluZyBiYWNrIHRvIHRoZSBkZWZhdWx0IG1hdGVyaWFsLidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoTnVtYmVyLnBhcnNlRmxvYXQoZ2x0Zk1vZGVsLmFzc2V0Py52ZXJzaW9uKSA+PSAyKSB7XG4gICAgICAvLyBGb3IgZ2xURiAyXG4gICAgICBjb25zdCBtYXRlcmlhbCA9IGNyZWF0ZVBiclViZXJNYXRlcmlhbChlbmdpbmUsIHBiclViZXJNYXRlcmlhbE9wdGlvbnMpO1xuICAgICAgY29uc3QgbWFrZU91dHB1dFNyZ2IgPSB0aGlzLl9fbWFrZU91dHB1dFNyZ2IoZ2x0Zk1vZGVsKTtcbiAgICAgIGlmIChJcy5leGlzdChtYWtlT3V0cHV0U3JnYikpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdtYWtlT3V0cHV0U3JnYicsIG1ha2VPdXRwdXRTcmdiKTtcbiAgICAgIH1cbiAgICAgIG1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBpc1RyYW5zbHVjZW50O1xuICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgIH1cbiAgICAvLyBGb3IgZ2xURiAxXG4gICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgaXNTa2lubmluZyxcbiAgICAgIGlzTGlnaHRpbmcsXG4gICAgICBhZGRpdGlvbmFsTmFtZTogYWRkaXRpb25hbE5hbWUsXG4gICAgICBtYXhJbnN0YW5jZXNOdW1iZXI6IG1heE1hdGVyaWFsSW5zdGFuY2VOdW1iZXIsXG4gICAgfSk7XG4gICAgbWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IGlzVHJhbnNsdWNlbnQ7XG4gICAgcmV0dXJuIG1hdGVyaWFsO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgbGlnaHRpbmcgc2hvdWxkIGJlIGVuYWJsZWQgZm9yIGEgbWF0ZXJpYWxcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGEgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGxpZ2h0aW5nIHNob3VsZCBiZSBlbmFibGVkXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2lzTGlnaHRpbmcoZ2x0Zk1vZGVsOiBSbk0yLCBtYXRlcmlhbEpzb24/OiBSbk0yTWF0ZXJpYWwpIHtcbiAgICBjb25zdCBhcmd1bWVudCA9IGdsdGZNb2RlbD8uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcbiAgICBpZiAoYXJndW1lbnQ/LmlzTGlnaHRpbmcgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50LmlzTGlnaHRpbmcgYXMgYm9vbGVhbjtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc191bmxpdCA9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGFuZ2VudCBhdHRyaWJ1dGVzIHNob3VsZCBiZSB1c2VkIGZvciBhIHByaW1pdGl2ZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcHJpbWl0aXZlIC0gVGhlIGdsVEYgcHJpbWl0aXZlIGRhdGFcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0YW5nZW50IGF0dHJpYnV0ZXMgc2hvdWxkIGJlIHVzZWRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fdXNlVGFuZ2VudEF0dHJpYnV0ZShnbHRmTW9kZWw6IFJuTTIsIHByaW1pdGl2ZTogUm5NMlByaW1pdGl2ZSkge1xuICAgIGNvbnN0IHRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgPSBnbHRmTW9kZWw/LmFzc2V0Py5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8udGFuZ2VudENhbGN1bGF0aW9uTW9kZTtcblxuICAgIHN3aXRjaCAodGFuZ2VudENhbGN1bGF0aW9uTW9kZSkge1xuICAgICAgY2FzZSAwOiAvLyBkbyBub3QgdXNlIG5vcm1hbCBtYXBcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSAxOiAvLyB0YW5nZW50IGF0dHJpYnV0ZSArIGNhbGN1bGF0ZWQgdGFuZ2VudCBpbiBzaGFkZXJcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6IC8vIHRhbmdlbnQgYXR0cmlidXRlICsgcHJlLWNhbGN1bGF0ZWQgdGFuZ2VudFxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgMzogLy8gZm9yY2UgY2FsYyBpbiBzaGFkZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSA0OiAvLyBmb3JjZSBwcmUtY2FsY1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmIChhdHRyaWJ1dGUgPT09ICdUQU5HRU5UJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX191c2VOb3JtYWxUZXh0dXJlKGdsdGZNb2RlbDogUm5NMikge1xuICAgIGNvbnN0IGFyZ3VtZW50ID0gZ2x0Zk1vZGVsPy5hc3NldD8uZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuICAgIGlmIChhcmd1bWVudD8udXNlTm9ybWFsVGV4dHVyZSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGdsdGZNb2RlbD8uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlICE9PSAwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19tYWtlT3V0cHV0U3JnYihnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCBhcmd1bWVudCA9IGdsdGZNb2RlbD8uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcbiAgICByZXR1cm4gYXJndW1lbnQ/Lm1ha2VPdXRwdXRTcmdiIGFzIGJvb2xlYW4gfCB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTWF0ZXJpYWwoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICByblNhbXBsZXJzOiBTYW1wbGVyW10sXG4gICAgbWF0ZXJpYWxKc29uPzogUm5NMk1hdGVyaWFsXG4gICk6IE1hdGVyaWFsIHtcbiAgICBjb25zdCBtYXRlcmlhbDogTWF0ZXJpYWwgPSB0aGlzLl9fZ2VuZXJhdGVBcHByb3ByaWF0ZU1hdGVyaWFsKFxuICAgICAgZW5naW5lLFxuICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgcm5UZXh0dXJlcyxcbiAgICAgIHJuU2FtcGxlcnMsXG4gICAgICBtYXRlcmlhbEpzb25cbiAgICApO1xuICAgIGlmIChtYXRlcmlhbEpzb24gPT0gbnVsbCkgcmV0dXJuIG1hdGVyaWFsO1xuXG4gICAgTW9kZWxDb252ZXJ0ZXIuc2V0UGFyYW1ldGVyc1RvTWF0ZXJpYWwobWF0ZXJpYWxKc29uLCBnbHRmTW9kZWwsIG1hdGVyaWFsLCByblRleHR1cmVzLCByblNhbXBsZXJzLCBmYWxzZSk7XG5cbiAgICBpZiAobWF0ZXJpYWxKc29uLmV4dHJhcz8ub3V0bGluZU1hdGVyaWFsICE9IG51bGwpIHtcbiAgICAgIE1vZGVsQ29udmVydGVyLnNldFBhcmFtZXRlcnNUb01hdGVyaWFsKFxuICAgICAgICBtYXRlcmlhbEpzb24sXG4gICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgbWF0ZXJpYWxKc29uLmV4dHJhcy5vdXRsaW5lTWF0ZXJpYWwuZGVyZWYoKSxcbiAgICAgICAgcm5UZXh0dXJlcyxcbiAgICAgICAgcm5TYW1wbGVycyxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0ZXJpYWw7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBzZXRQYXJhbWV0ZXJzVG9NYXRlcmlhbChcbiAgICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICByblNhbXBsZXJzOiBTYW1wbGVyW10sXG4gICAgaXNPdXRsaW5lOiBib29sZWFuXG4gICkge1xuICAgIGNvbnN0IGlzVW5saXQgPSBtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc191bmxpdCAhPSBudWxsO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkxvYWRlck9wdGlvbnM7XG4gICAgY29uc3QgcGJyTWV0YWxsaWNSb3VnaG5lc3MgPSBtYXRlcmlhbEpzb24ucGJyTWV0YWxsaWNSb3VnaG5lc3M7XG4gICAgaWYgKHBick1ldGFsbGljUm91Z2huZXNzICE9IG51bGwpIHtcbiAgICAgIC8vIEJhc2VDb2xvciBGYWN0b3JcbiAgICAgIHNldHVwUGJyTWV0YWxsaWNSb3VnaG5lc3MoXG4gICAgICAgIHBick1ldGFsbGljUm91Z2huZXNzLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICBvcHRpb25zLFxuICAgICAgICBtYXRlcmlhbEpzb24sXG4gICAgICAgIHJuVGV4dHVyZXMsXG4gICAgICAgIHJuU2FtcGxlcnNcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbTogSW5kZXggPSBTaGFkaW5nTW9kZWwuUGhvbmcuaW5kZXg7XG4gICAgICBpZiAobWF0ZXJpYWxKc29uPy5leHRyYXM/LnRlY2huaXF1ZSkge1xuICAgICAgICBzd2l0Y2ggKG1hdGVyaWFsSnNvbi5leHRyYXMudGVjaG5pcXVlKSB7XG4gICAgICAgICAgY2FzZSBTaGFkaW5nTW9kZWwuQ29uc3RhbnQuc3RyOlxuICAgICAgICAgICAgcGFyYW0gPSBTaGFkaW5nTW9kZWwuQ29uc3RhbnQuaW5kZXg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFNoYWRpbmdNb2RlbC5MYW1iZXJ0LnN0cjpcbiAgICAgICAgICAgIHBhcmFtID0gU2hhZGluZ01vZGVsLkxhbWJlcnQuaW5kZXg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFNoYWRpbmdNb2RlbC5CbGlublBob25nLnN0cjpcbiAgICAgICAgICAgIHBhcmFtID0gU2hhZGluZ01vZGVsLkJsaW5uUGhvbmcuaW5kZXg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFNoYWRpbmdNb2RlbC5QaG9uZy5zdHI6XG4gICAgICAgICAgICBwYXJhbSA9IFNoYWRpbmdNb2RlbC5QaG9uZy5pbmRleDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGluZ01vZGVsJywgU2NhbGFyLmZyb21Db3B5TnVtYmVyKHBhcmFtKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZW1pc3NpdmVGYWN0b3IgPSBpc1VubGl0ID8gKFswLCAwLCAwXSBhcyBBcnJheTM8bnVtYmVyPikgOiBtYXRlcmlhbEpzb24uZW1pc3NpdmVGYWN0b3I7XG4gICAgaWYgKGVtaXNzaXZlRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZW1pc3NpdmVGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKGVtaXNzaXZlRmFjdG9yKSk7XG4gICAgfVxuXG4gICAgY29uc3QgZW1pc3NpdmVUZXh0dXJlID0gbWF0ZXJpYWxKc29uLmVtaXNzaXZlVGV4dHVyZTtcbiAgICBpZiAoZW1pc3NpdmVUZXh0dXJlICE9IG51bGwgJiYgSXMuZmFsc3koaXNVbmxpdCkpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbZW1pc3NpdmVUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tlbWlzc2l2ZVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignZW1pc3NpdmVUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKE51bWJlci5wYXJzZUZsb2F0KGdsdGZNb2RlbC5hc3NldD8udmVyc2lvbikgPj0gMiAmJiBlbWlzc2l2ZVRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2VtaXNzaXZlVGV4Y29vcmRJbmRleCcsIGVtaXNzaXZlVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBlbWlzc2l2ZVRleHR1cmUhLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2VtaXNzaXZlVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2VtaXNzaXZlVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdlbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IGFscGhhTW9kZSA9IG1hdGVyaWFsSnNvbi5hbHBoYU1vZGU7XG4gICAgaWYgKG9wdGlvbnM/LmFscGhhTW9kZSkge1xuICAgICAgYWxwaGFNb2RlID0gb3B0aW9ucy5hbHBoYU1vZGU7XG4gICAgfVxuICAgIGlmIChhbHBoYU1vZGUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuYWxwaGFNb2RlID0gQWxwaGFNb2RlLmZyb21HbFRGU3RyaW5nKGFscGhhTW9kZSkhO1xuXG4gICAgICAvLyBzZXQgYWxwaGEgdGhyZXNob2xkIGV4Y2VwdCBmb3IgVlJNXG4gICAgICBpZiAobWF0ZXJpYWwuYWxwaGFNb2RlID09PSBBbHBoYU1vZGUuTWFzayAmJiAhZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5fX2lzSW1wb3J0VlJNMHgpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhbHBoYUN1dG9mZicsIFNjYWxhci5mcm9tQ29weU51bWJlcihtYXRlcmlhbEpzb24uYWxwaGFDdXRvZmYgPz8gMC41KSk7XG4gICAgICB9XG4gICAgfVxuICAgIG1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBJcy5leGlzdChtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24pO1xuXG4gICAgY29uc3QgZG91YmxlU2lkZWQgPSBtYXRlcmlhbEpzb24uZG91YmxlU2lkZWQ7XG4gICAgaWYgKGRvdWJsZVNpZGVkICE9IG51bGwgJiYgIWlzT3V0bGluZSkge1xuICAgICAgbWF0ZXJpYWwuY3VsbEZhY2UgPSAhZG91YmxlU2lkZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsVGV4dHVyZSA9IG1hdGVyaWFsSnNvbi5ub3JtYWxUZXh0dXJlO1xuICAgIGlmIChub3JtYWxUZXh0dXJlICE9IG51bGwgJiYgSXMuZmFsc3koaXNVbmxpdCkpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbbm9ybWFsVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbbm9ybWFsVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdub3JtYWxUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKE51bWJlci5wYXJzZUZsb2F0KGdsdGZNb2RlbC5hc3NldD8udmVyc2lvbikgPj0gMikge1xuICAgICAgICBpZiAobm9ybWFsVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdub3JtYWxUZXhjb29yZEluZGV4Jywgbm9ybWFsVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsVGV4dHVyZS5zY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdub3JtYWxTY2FsZScsIG5vcm1hbFRleHR1cmUuc2NhbGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICBub3JtYWxUZXh0dXJlISxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgJ25vcm1hbFRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAnbm9ybWFsVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAnbm9ybWFsVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICk7XG5cbiAgICAvLyBGb3IgRXh0ZW5zaW9uXG4gICAgaWYgKHRoaXMuX2NoZWNrUm5HbHRmTG9hZGVyT3B0aW9uc0V4aXN0KGdsdGZNb2RlbCkpIHtcbiAgICAgIGNvbnN0IGxvYWRlckV4dGVuc2lvbiA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8ubG9hZGVyRXh0ZW5zaW9uO1xuICAgICAgaWYgKGxvYWRlckV4dGVuc2lvbj8uc2V0dXBNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICAgIGxvYWRlckV4dGVuc2lvbi5zZXR1cE1hdGVyaWFsKGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uLCBtYXRlcmlhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5WUk1DX21hdGVyaWFsc19tdG9vbiAhPSBudWxsKSB7XG4gICAgICBzZXR1cE1Ub29uMShtYXRlcmlhbCwgZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24gYXMgVnJtMV9NYXRlcmlhbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIF9jcmVhdGVTYW1wbGVyKGVuZ2luZTogRW5naW5lLCBzYW1wbGVyOiBSbk0yVGV4dHVyZVNhbXBsZXIpIHtcbiAgICBjb25zdCByblNhbXBsZXIgPSBuZXcgU2FtcGxlcihlbmdpbmUsIHtcbiAgICAgIG1hZ0ZpbHRlcjogSXMuZXhpc3Qoc2FtcGxlci5tYWdGaWx0ZXIpID8gVGV4dHVyZVBhcmFtZXRlci5mcm9tKHNhbXBsZXIubWFnRmlsdGVyKSA6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgbWluRmlsdGVyOiBJcy5leGlzdChzYW1wbGVyLm1pbkZpbHRlcikgPyBUZXh0dXJlUGFyYW1ldGVyLmZyb20oc2FtcGxlci5taW5GaWx0ZXIpIDogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICB3cmFwUzogSXMuZXhpc3Qoc2FtcGxlci53cmFwUykgPyBUZXh0dXJlUGFyYW1ldGVyLmZyb20oc2FtcGxlci53cmFwUykgOiBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICAgIHdyYXBUOiBJcy5leGlzdChzYW1wbGVyLndyYXBUKSA/IFRleHR1cmVQYXJhbWV0ZXIuZnJvbShzYW1wbGVyLndyYXBUKSA6IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgIH0pO1xuICAgIHJuU2FtcGxlci5jcmVhdGUoKTtcblxuICAgIHJldHVybiByblNhbXBsZXI7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgX2NyZWF0ZVRleHR1cmUoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgaW1hZ2U6IFJuTTJJbWFnZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgeyBhdXRvRGV0ZWN0VHJhbnNwYXJlbmN5ID0gZmFsc2UgfSA9IHt9XG4gICkge1xuICAgIGNvbnN0IF9vcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zO1xuXG4gICAgY29uc3Qgcm5UZXh0dXJlID0gbmV3IFRleHR1cmUoZW5naW5lKTtcbiAgICByblRleHR1cmUuYXV0b0RldGVjdFRyYW5zcGFyZW5jeSA9IGF1dG9EZXRlY3RUcmFuc3BhcmVuY3k7XG5cbiAgICBpZiAoaW1hZ2UuaW1hZ2UpIHtcbiAgICAgIGNvbnN0IGltYWdlRWxlbSA9IGltYWdlLmltYWdlIGFzIEhUTUxJbWFnZUVsZW1lbnQ7XG4gICAgICBhd2FpdCByblRleHR1cmUuZ2VuZXJhdGVUZXh0dXJlRnJvbUltYWdlKGltYWdlRWxlbSk7XG4gICAgfSBlbHNlIGlmIChpbWFnZS5iYXNpcykge1xuICAgICAgYXdhaXQgcm5UZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21CYXNpcyhpbWFnZS5iYXNpcywge30pO1xuICAgIH0gZWxzZSBpZiAoaW1hZ2Uua3R4Mikge1xuICAgICAgYXdhaXQgcm5UZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21LVFgyKGltYWdlLmt0eDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGltYWdlIGZvdW5kJyk7XG4gICAgfVxuXG4gICAgaWYgKGltYWdlLnVyaSkge1xuICAgICAgcm5UZXh0dXJlLm5hbWUgPSBpbWFnZS51cmk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV4dCA9IGltYWdlLm1pbWVUeXBlPy5zcGxpdCgnLycpWzFdO1xuICAgICAgcm5UZXh0dXJlLm5hbWUgPSBpbWFnZS5uYW1lID8/IGBVbnRpdGxlZC4ke2V4dH1gO1xuICAgIH1cbiAgICByblRleHR1cmUudHJ5VG9TZXRVbmlxdWVOYW1lKHJuVGV4dHVyZS5uYW1lLCB0cnVlKTtcblxuICAgIHJldHVybiByblRleHR1cmU7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIHRoZSB0ZXh0dXJlIGFzc2lnbm1lbnRzIG9mIHRoZSBSSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzIGV4dGVuc2lvbi5cbiAgICpcbiAgICogVGhlIGV4dGVuc2lvbiBtYXBzIGEgc2hhZGVyIHNlbWFudGljIHRvIGEgZ2xURiB0ZXh0dXJlIGluZGV4LiBBcHBsaWNhdGlvbnMgcmVidWlsZCB0aGVcbiAgICogc2hhcmVkIHJheW1hcmNoaW5nIG1hdGVyaWFsIGZyb20gdGhlIG5vZGUgZ3JhcGhzIGFmdGVyIGltcG9ydCBhbmQgdGhlbiBhcHBseSB0aGUgdGV4dHVyZXNcbiAgICogd2l0aCBNYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKHNlbWFudGljLCB0ZXh0dXJlLCBzYW1wbGVyKS5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEByZXR1cm5zIE9uZSBlbnRyeSBwZXIgdmFsaWQgYXNzaWdubWVudCwgaW4gZXh0ZW5zaW9uIG9yZGVyXG4gICAqL1xuICBzdGF0aWMgZ2V0UmF5bWFyY2hpbmdNYXRlcmlhbFRleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWw6IFJuTTIpOiB7XG4gICAgc2VtYW50aWM6IHN0cmluZztcbiAgICB0ZXh0dXJlSW5kZXg6IG51bWJlcjtcbiAgICBzYW1wbGVySW5kZXg/OiBudW1iZXI7XG4gIH1bXSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gKFxuICAgICAgZ2x0Zk1vZGVsLmV4dGVuc2lvbnMgYXNcbiAgICAgICAgfCB7XG4gICAgICAgICAgICBSSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzPzoge1xuICAgICAgICAgICAgICB0ZXh0dXJlcz86IHsgW3NlbWFudGljOiBzdHJpbmddOiB7IGluZGV4PzogbnVtYmVyIH0gfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB8IHVuZGVmaW5lZFxuICAgICk/LlJIT0RPTklURV9yYXltYXJjaGluZ19tYXRlcmlhbHM7XG4gICAgcmV0dXJuIHRoaXMuX19nZXRWYWxpZFJheW1hcmNoaW5nVGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbCwgZXh0ZW5zaW9uPy50ZXh0dXJlcyk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIHRoZSBwZXItY29tcG9uZW50IHRleHR1cmUgYXNzaWdubWVudHMgc3RvcmVkIGluIHRoZSBgUkhPRE9OSVRFX3JheW1hcmNoaW5nYCBub2RlXG4gICAqIGV4dGVuc2lvbnMuXG4gICAqXG4gICAqIEVhY2ggYXNzaWdubWVudCBrZWVwcyB0aGUgZ2xURiBub2RlIGluZGV4LCB3aGljaCB0aGUgaW1wb3J0ZXIgYWxzbyBzdG9yZXMgb24gdGhlIGVudGl0eVxuICAgKiAoYFRhZ0dsdGYyTm9kZUluZGV4YCksIHNvIGFuIGFwcGxpY2F0aW9uIGNhbiBhcHBseSB0aGUgdGV4dHVyZXMgdG8gdGhlIG1hdGVyaWFsIGl0IHJlYnVpbGRzXG4gICAqIGZvciB0aGF0IGNvbXBvbmVudC5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEByZXR1cm5zIE9uZSBlbnRyeSBwZXIgdmFsaWQgYXNzaWdubWVudCwgaW4gbm9kZSBhbmQgZXh0ZW5zaW9uIG9yZGVyXG4gICAqL1xuICBzdGF0aWMgZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsOiBSbk0yKToge1xuICAgIG5vZGVJbmRleDogbnVtYmVyO1xuICAgIHNlbWFudGljOiBzdHJpbmc7XG4gICAgdGV4dHVyZUluZGV4OiBudW1iZXI7XG4gICAgc2FtcGxlckluZGV4PzogbnVtYmVyO1xuICB9W10ge1xuICAgIGNvbnN0IHJlc3VsdDogeyBub2RlSW5kZXg6IG51bWJlcjsgc2VtYW50aWM6IHN0cmluZzsgdGV4dHVyZUluZGV4OiBudW1iZXI7IHNhbXBsZXJJbmRleD86IG51bWJlciB9W10gPSBbXTtcbiAgICBjb25zdCBub2RlcyA9IGdsdGZNb2RlbC5ub2RlcyA/PyBbXTtcbiAgICBmb3IgKGxldCBub2RlSW5kZXggPSAwOyBub2RlSW5kZXggPCBub2Rlcy5sZW5ndGg7IG5vZGVJbmRleCsrKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSAoXG4gICAgICAgIG5vZGVzW25vZGVJbmRleF0uZXh0ZW5zaW9ucyBhc1xuICAgICAgICAgIHwge1xuICAgICAgICAgICAgICBSSE9ET05JVEVfcmF5bWFyY2hpbmc/OiB7XG4gICAgICAgICAgICAgICAgdGV4dHVyZXM/OiB7IFtzZW1hbnRpYzogc3RyaW5nXTogeyBpbmRleD86IG51bWJlciB9IH07XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfCB1bmRlZmluZWRcbiAgICAgICk/LlJIT0RPTklURV9yYXltYXJjaGluZztcbiAgICAgIGZvciAoY29uc3QgYXNzaWdubWVudCBvZiB0aGlzLl9fZ2V0VmFsaWRSYXltYXJjaGluZ1RleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWwsIGV4dGVuc2lvbj8udGV4dHVyZXMpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHsgbm9kZUluZGV4LCAuLi5hc3NpZ25tZW50IH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgYSBzZW1hbnRpYyB0byB0ZXh0dXJlLWluZGV4IG1hcCBkb3duIHRvIGFzc2lnbm1lbnRzIHdob3NlIHRleHR1cmUgYW5kIGltYWdlIGV4aXN0LlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIHRleHR1cmVzIC0gVGhlIGV4dGVuc2lvbidzIHRleHR1cmUgbWFwXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFZhbGlkUmF5bWFyY2hpbmdUZXh0dXJlQXNzaWdubWVudHMoXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHRleHR1cmVzOiB7IFtzZW1hbnRpYzogc3RyaW5nXTogeyBpbmRleD86IG51bWJlciB9IH0gfCB1bmRlZmluZWRcbiAgKTogeyBzZW1hbnRpYzogc3RyaW5nOyB0ZXh0dXJlSW5kZXg6IG51bWJlcjsgc2FtcGxlckluZGV4PzogbnVtYmVyIH1bXSB7XG4gICAgaWYgKHRleHR1cmVzID09IG51bGwgfHwgdHlwZW9mIHRleHR1cmVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBhc3NpZ25tZW50czogeyBzZW1hbnRpYzogc3RyaW5nOyB0ZXh0dXJlSW5kZXg6IG51bWJlcjsgc2FtcGxlckluZGV4PzogbnVtYmVyIH1bXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgc2VtYW50aWMgb2YgT2JqZWN0LmtleXModGV4dHVyZXMpKSB7XG4gICAgICBjb25zdCB0ZXh0dXJlSW5kZXggPSB0ZXh0dXJlc1tzZW1hbnRpY10/LmluZGV4O1xuICAgICAgaWYgKHRleHR1cmVJbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgZ2x0ZlRleHR1cmUgPSBnbHRmTW9kZWwudGV4dHVyZXM/Llt0ZXh0dXJlSW5kZXhdO1xuICAgICAgY29uc3QgaW1hZ2UgPSBnbHRmVGV4dHVyZT8uc291cmNlICE9IG51bGwgPyBnbHRmTW9kZWwuaW1hZ2VzPy5bZ2x0ZlRleHR1cmUuc291cmNlXSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmIChnbHRmVGV4dHVyZSA9PSBudWxsIHx8IGltYWdlID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBhc3NpZ25tZW50cy5wdXNoKHtcbiAgICAgICAgc2VtYW50aWMsXG4gICAgICAgIHRleHR1cmVJbmRleCxcbiAgICAgICAgc2FtcGxlckluZGV4OiBnbHRmVGV4dHVyZS5zYW1wbGVyLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhc3NpZ25tZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFJob2Rvbml0ZSB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMgZm9yIHRoZSBzaGFyZWQgcmF5bWFyY2hpbmcgbWF0ZXJpYWwncyB0ZXh0dXJlXG4gICAqIGFzc2lnbm1lbnRzIHNhdmVkIGluIHRoZSBSSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzIGV4dGVuc2lvbi5cbiAgICpcbiAgICogQXBwbHkgdGhlIHJldHVybmVkIHRleHR1cmVzIHRvIHRoZSByZWJ1aWx0IG1hdGVyaWFsIHdpdGhcbiAgICogTWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihzZW1hbnRpYywgdGV4dHVyZSwgc2FtcGxlcikuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMga2V5ZWQgYnkgc2hhZGVyIHNlbWFudGljXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlUmF5bWFyY2hpbmdNYXRlcmlhbFRleHR1cmVzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMlxuICApOiBQcm9taXNlPE1hcDxzdHJpbmcsIHsgdGV4dHVyZTogVGV4dHVyZTsgc2FtcGxlcj86IFNhbXBsZXIgfT4+IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgeyB0ZXh0dXJlOiBUZXh0dXJlOyBzYW1wbGVyPzogU2FtcGxlciB9PigpO1xuICAgIGNvbnN0IGFzc2lnbm1lbnRzID0gdGhpcy5nZXRSYXltYXJjaGluZ01hdGVyaWFsVGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbCk7XG4gICAgZm9yIChjb25zdCB7IHNlbWFudGljLCB0ZXh0dXJlSW5kZXgsIHNhbXBsZXJJbmRleCB9IG9mIGFzc2lnbm1lbnRzKSB7XG4gICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5fX2NyZWF0ZVJheW1hcmNoaW5nVGV4dHVyZShlbmdpbmUsIGdsdGZNb2RlbCwgdGV4dHVyZUluZGV4LCBzYW1wbGVySW5kZXgpO1xuICAgICAgaWYgKGNyZWF0ZWQgIT0gbnVsbCkge1xuICAgICAgICByZXN1bHQuc2V0KHNlbWFudGljLCBjcmVhdGVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFJob2Rvbml0ZSB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMgZm9yIHRoZSBwZXItY29tcG9uZW50IGFzc2lnbm1lbnRzIHNhdmVkIGluIGVhY2hcbiAgICogYFJIT0RPTklURV9yYXltYXJjaGluZ2Agbm9kZSBleHRlbnNpb24uXG4gICAqXG4gICAqIFRoZSByZXR1cm5lZCBtYXAgaXMga2V5ZWQgYnkgZ2xURiBub2RlIGluZGV4ICh0aGUgZW50aXR5J3MgYFRhZ0dsdGYyTm9kZUluZGV4YCksIHRoZW4gYnlcbiAgICogc2hhZGVyIHNlbWFudGljLiBBcHBseSB0aGVtIHRvIHRoZSBtYXRlcmlhbCByZWJ1aWx0IGZvciB0aGF0IGNvbXBvbmVudCB3aXRoXG4gICAqIE1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoc2VtYW50aWMsIHRleHR1cmUsIHNhbXBsZXIpLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgdGV4dHVyZXMgYW5kIHNhbXBsZXJzIGtleWVkIGJ5IG5vZGUgaW5kZXggYW5kIHNoYWRlciBzZW1hbnRpY1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVJheW1hcmNoaW5nQ29tcG9uZW50VGV4dHVyZXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yXG4gICk6IFByb21pc2U8TWFwPG51bWJlciwgTWFwPHN0cmluZywgeyB0ZXh0dXJlOiBUZXh0dXJlOyBzYW1wbGVyPzogU2FtcGxlciB9Pj4+IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPG51bWJlciwgTWFwPHN0cmluZywgeyB0ZXh0dXJlOiBUZXh0dXJlOyBzYW1wbGVyPzogU2FtcGxlciB9Pj4oKTtcbiAgICBjb25zdCBhc3NpZ25tZW50cyA9IHRoaXMuZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsKTtcbiAgICBmb3IgKGNvbnN0IHsgbm9kZUluZGV4LCBzZW1hbnRpYywgdGV4dHVyZUluZGV4LCBzYW1wbGVySW5kZXggfSBvZiBhc3NpZ25tZW50cykge1xuICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHRoaXMuX19jcmVhdGVSYXltYXJjaGluZ1RleHR1cmUoZW5naW5lLCBnbHRmTW9kZWwsIHRleHR1cmVJbmRleCwgc2FtcGxlckluZGV4KTtcbiAgICAgIGlmIChjcmVhdGVkID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgbm9kZVRleHR1cmVzID0gcmVzdWx0LmdldChub2RlSW5kZXgpO1xuICAgICAgaWYgKG5vZGVUZXh0dXJlcyA9PSBudWxsKSB7XG4gICAgICAgIG5vZGVUZXh0dXJlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgcmVzdWx0LnNldChub2RlSW5kZXgsIG5vZGVUZXh0dXJlcyk7XG4gICAgICB9XG4gICAgICBub2RlVGV4dHVyZXMuc2V0KHNlbWFudGljLCBjcmVhdGVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIG9uZSBSaG9kb25pdGUgdGV4dHVyZSAoYW5kIHNhbXBsZXIpIGZyb20gYSBnbFRGIHRleHR1cmUgaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gdGV4dHVyZUluZGV4IC0gVGhlIGdsVEYgdGV4dHVyZSBpbmRleFxuICAgKiBAcGFyYW0gc2FtcGxlckluZGV4IC0gVGhlIGdsVEYgc2FtcGxlciBpbmRleCBvZiB0aGUgdGV4dHVyZVxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCB0ZXh0dXJlIGFuZCBzYW1wbGVyLCBvciBudWxsIHdoZW4gY3JlYXRpb24gZmFpbHNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fY3JlYXRlUmF5bWFyY2hpbmdUZXh0dXJlKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICB0ZXh0dXJlSW5kZXg6IG51bWJlcixcbiAgICBzYW1wbGVySW5kZXg/OiBudW1iZXJcbiAgKTogUHJvbWlzZTx7IHRleHR1cmU6IFRleHR1cmU7IHNhbXBsZXI/OiBTYW1wbGVyIH0gfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGdsdGZUZXh0dXJlID0gZ2x0Zk1vZGVsLnRleHR1cmVzIVt0ZXh0dXJlSW5kZXhdO1xuICAgICAgY29uc3QgaW1hZ2UgPSBnbHRmTW9kZWwuaW1hZ2VzIVtnbHRmVGV4dHVyZS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHRleHR1cmUgPSBhd2FpdCB0aGlzLl9jcmVhdGVUZXh0dXJlKGVuZ2luZSwgaW1hZ2UsIGdsdGZNb2RlbCk7XG4gICAgICBsZXQgc2FtcGxlcjogU2FtcGxlciB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChzYW1wbGVySW5kZXggIT0gbnVsbCAmJiBnbHRmTW9kZWwuc2FtcGxlcnM/LltzYW1wbGVySW5kZXhdICE9IG51bGwpIHtcbiAgICAgICAgc2FtcGxlciA9IHRoaXMuX2NyZWF0ZVNhbXBsZXIoZW5naW5lLCBnbHRmTW9kZWwuc2FtcGxlcnNbc2FtcGxlckluZGV4XSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyB0ZXh0dXJlLCBzYW1wbGVyIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oXG4gICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIHRoZSByYXltYXJjaGluZyBtYXRlcmlhbCB0ZXh0dXJlIGZvciB0ZXh0dXJlICR7dGV4dHVyZUluZGV4fTogJHtTdHJpbmcoZXJyb3IpfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX25lZWRSZXNpemVUb1Bvd2VyT2ZUd29PbldlYkdsMSh0ZXh0dXJlT3B0aW9uOiBhbnkpIHtcbiAgICBpZiAoXG4gICAgICB0ZXh0dXJlT3B0aW9uLndyYXBTICE9PSBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlIHx8XG4gICAgICB0ZXh0dXJlT3B0aW9uLndyYXBUICE9PSBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlIHx8XG4gICAgICAodGV4dHVyZU9wdGlvbi5taW5GaWx0ZXIgIT09IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyICYmIHRleHR1cmVPcHRpb24ubWluRmlsdGVyICE9PSBUZXh0dXJlUGFyYW1ldGVyLk5lYXJlc3QpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3NpemVJc1Bvd2VyT2ZUd28oaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICBjb25zdCB3aWR0aCA9IGltYWdlLndpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAgIGlmICgod2lkdGggJiAod2lkdGggLSAxKSkgPT09IDAgJiYgKGhlaWdodCAmIChoZWlnaHQgLSAxKSkgPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX25lZWRQYXJhbWV0ZXJJbml0aWFsaXphdGlvbihtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCwgX21hdGVyaWFsVHlwZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChtYXRlcmlhbEpzb24gPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fcmV3cmFwV2l0aFR5cGVkQXJyYXkodHlwZWRBcnJheUNsYXNzOiBhbnksIHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXksIGJ5dGVPZmZzZXQ6IEJ5dGUsIGxlbmd0aDogU2l6ZSkge1xuICAgIHJldHVybiBuZXcgdHlwZWRBcnJheUNsYXNzKHVpbnQ4QXJyYXkuYnVmZmVyIGFzIEFycmF5QnVmZmVyLCBieXRlT2Zmc2V0ICsgdWludDhBcnJheS5ieXRlT2Zmc2V0LCBsZW5ndGgpO1xuICB9XG5cbiAgc3RhdGljIF9jaGVja0J5dGVzUGVyQ29tcG9uZW50KGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IgfCBSbk0yU3BhcnNlSW5kaWNlcykge1xuICAgIGxldCBieXRlc1BlckNvbXBvbmVudCA9IDA7XG4gICAgc3dpdGNoIChhY2Nlc3Nvci5jb21wb25lbnRUeXBlKSB7XG4gICAgICBjYXNlIDUxMjA6IC8vIGdsLkJZVEVcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMTogLy8gZ2wuVU5TSUdORURfQllURVxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIyOiAvLyBnbC5TSE9SVFxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIzOiAvLyBnbC5VTlNJR05FRF9TSE9SVFxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI0OiAvLyBnbC5JTlRcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSA0O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNTogLy8gZ2wuVU5TSUdORURfSU5UXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjY6IC8vIGdsLkZMT0FUXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGJ5dGVzUGVyQ29tcG9uZW50O1xuICB9XG5cbiAgc3RhdGljIF9jaGVja0NvbXBvbmVudE51bWJlcihhY2Nlc3NvcjogUm5NMkFjY2Vzc29yKSB7XG4gICAgbGV0IGNvbXBvbmVudE4gPSAwO1xuICAgIHN3aXRjaCAoYWNjZXNzb3IudHlwZSkge1xuICAgICAgY2FzZSAnU0NBTEFSJzpcbiAgICAgICAgY29tcG9uZW50TiA9IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnVkVDMic6XG4gICAgICAgIGNvbXBvbmVudE4gPSAyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1ZFQzMnOlxuICAgICAgICBjb21wb25lbnROID0gMztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdWRUM0JzpcbiAgICAgICAgY29tcG9uZW50TiA9IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTUFUNCc6XG4gICAgICAgIGNvbXBvbmVudE4gPSAxNjtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBvbmVudE47XG4gIH1cblxuICBzdGF0aWMgX2NoZWNrRGF0YVZpZXdNZXRob2QoYWNjZXNzb3I6IFJuTTJBY2Nlc3NvciB8IFJuTTJTcGFyc2VJbmRpY2VzKSB7XG4gICAgbGV0IGRhdGFWaWV3TWV0aG9kID0gJyc7XG4gICAgc3dpdGNoIChhY2Nlc3Nvci5jb21wb25lbnRUeXBlKSB7XG4gICAgICBjYXNlIDUxMjA6IC8vIGdsLkJZVEVcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0SW50OCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIxOiAvLyBnbC5VTlNJR05FRF9CWVRFXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldFVpbnQ4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjI6IC8vIGdsLlNIT1JUXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldEludDE2JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjM6IC8vIGdsLlVOU0lHTkVEX1NIT1JUXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldFVpbnQxNic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI0OiAvLyBnbC5JTlRcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0SW50MzInO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNTogLy8gZ2wuVU5TSUdORURfSU5UXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldFVpbnQzMic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI2OiAvLyBnbC5GTE9BVFxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRGbG9hdDMyJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGRhdGFWaWV3TWV0aG9kO1xuICB9XG5cbiAgc3RhdGljIF9pc1N5c3RlbUxpdHRsZUVuZGlhbigpIHtcbiAgICByZXR1cm4gISFuZXcgVWludDhBcnJheShuZXcgVWludDE2QXJyYXkoWzB4MDBmZl0pLmJ1ZmZlcilbMF07XG4gIH1cblxuICBzdGF0aWMgX3JlYWRCaW5hcnlGcm9tQWNjZXNzb3JBbmRTZXRJdFRvQWNjZXNzb3JFeHRyYXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgYWNjZXNzb3I6IFJuTTJBY2Nlc3NvcixcbiAgICBybkJ1ZmZlcnM/OiBCdWZmZXJbXVxuICApOiBGbG9hdDMyQXJyYXkge1xuICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBhY2Nlc3Nvci5idWZmZXJWaWV3T2JqZWN0ITtcbiAgICBsZXQgYnl0ZU9mZnNldEZyb21CdWZmZXI6IG51bWJlciA9IChidWZmZXJWaWV3LmJ5dGVPZmZzZXQgPz8gMCkgKyAoYWNjZXNzb3IuYnl0ZU9mZnNldCA/PyAwKTtcbiAgICBjb25zdCBidWZmZXIgPSBidWZmZXJWaWV3LmJ1ZmZlck9iamVjdCE7XG4gICAgbGV0IHVpbnQ4QXJyYXk6IFVpbnQ4QXJyYXkgPSBidWZmZXIuYnVmZmVyITtcblxuICAgIGNvbnN0IGNvbXBvbmVudE4gPSB0aGlzLl9jaGVja0NvbXBvbmVudE51bWJlcihhY2Nlc3Nvcik7XG4gICAgY29uc3QgY29tcG9uZW50Qnl0ZXMgPSB0aGlzLl9jaGVja0J5dGVzUGVyQ29tcG9uZW50KGFjY2Vzc29yKTtcbiAgICBjb25zdCBkYXRhVmlld01ldGhvZCA9IHRoaXMuX2NoZWNrRGF0YVZpZXdNZXRob2QoYWNjZXNzb3IpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoYWNjZXNzb3IuZXh0cmFzKSkge1xuICAgICAgYWNjZXNzb3IuZXh0cmFzID0ge1xuICAgICAgICB0eXBlZERhdGFBcnJheTogbmV3IEZsb2F0MzJBcnJheSgpLFxuICAgICAgICBjb21wb25lbnROOiAwLFxuICAgICAgICBjb21wb25lbnRCeXRlczogNCxcbiAgICAgICAgZGF0YVZpZXdNZXRob2Q6ICcnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBmb3Igd2VpZ2h0cyBhbmltYXRpb24gYWNjZXNzb3IsIHNldCBjb21wb25lbnROIGFzIHdlaWdodHNBcnJheUxlbmd0aFxuICAgIGFjY2Vzc29yLmV4dHJhcy5jb21wb25lbnROID0gSXMuZXhpc3QoYWNjZXNzb3IuZXh0cmFzPy53ZWlnaHRzQXJyYXlMZW5ndGgpXG4gICAgICA/IGFjY2Vzc29yLmV4dHJhcyEud2VpZ2h0c0FycmF5TGVuZ3RoXG4gICAgICA6IGNvbXBvbmVudE47XG4gICAgYWNjZXNzb3IuZXh0cmFzLmNvbXBvbmVudEJ5dGVzID0gY29tcG9uZW50Qnl0ZXM7XG4gICAgYWNjZXNzb3IuZXh0cmFzLmRhdGFWaWV3TWV0aG9kID0gZGF0YVZpZXdNZXRob2Q7XG5cbiAgICBjb25zdCBieXRlTGVuZ3RoID0gY29tcG9uZW50Qnl0ZXMgKiBjb21wb25lbnROICogYWNjZXNzb3IuY291bnQ7XG5cbiAgICBpZiAoSXMuZXhpc3Qocm5CdWZmZXJzKSkge1xuICAgICAgY29uc3Qgcm5CdWZmZXIgPSBybkJ1ZmZlcnNbYWNjZXNzb3IuYnVmZmVyVmlld09iamVjdCEuYnVmZmVyIV07XG4gICAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3KGJ1ZmZlclZpZXcsIHJuQnVmZmVyKTtcbiAgICAgIGNvbnN0IHJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5BY2Nlc3NvcihlbmdpbmUsIGFjY2Vzc29yLCBybkJ1ZmZlclZpZXcpO1xuICAgICAgdWludDhBcnJheSA9IHJuQWNjZXNzb3IuZ2V0VWludDhBcnJheSgpO1xuICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIgPSAwO1xuICAgIH1cblxuICAgIGxldCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCkgYXMgRmxvYXQzMkFycmF5O1xuICAgIGNvbnN0IG51bWJlckFycmF5OiBudW1iZXJbXSA9IFtdO1xuXG4gICAgaWYgKE1vZGVsQ29udmVydGVyLl9pc1N5c3RlbUxpdHRsZUVuZGlhbigpKSB7XG4gICAgICAvLyBJZiB0aGlzIHBsYXRmb3JtIGlzIExpdHRsZSBFbmRpYW4gU3lzdGVtLFxuICAgICAgLy8gICB0aGUgdWludDhhcnJheSBjYW5cbiAgICAgIGxldCB0eXBlZERhdGFBcnJheTogVHlwZWRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoKTtcbiAgICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEZsb2F0MzInKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gdGhpcy5fX3Jld3JhcFdpdGhUeXBlZEFycmF5KFxuICAgICAgICAgIEZsb2F0MzJBcnJheSxcbiAgICAgICAgICB1aW50OEFycmF5LFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDgnKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gbmV3IEludDhBcnJheShcbiAgICAgICAgICB1aW50OEFycmF5IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDgnKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoXG4gICAgICAgICAgdWludDhBcnJheSBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDE2Jykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IHRoaXMuX19yZXdyYXBXaXRoVHlwZWRBcnJheShcbiAgICAgICAgICBJbnQxNkFycmF5LFxuICAgICAgICAgIHVpbnQ4QXJyYXksXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDE2Jykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IHRoaXMuX19yZXdyYXBXaXRoVHlwZWRBcnJheShcbiAgICAgICAgICBVaW50MTZBcnJheSxcbiAgICAgICAgICB1aW50OEFycmF5LFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDMyJykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IHRoaXMuX19yZXdyYXBXaXRoVHlwZWRBcnJheShcbiAgICAgICAgICBJbnQzMkFycmF5LFxuICAgICAgICAgIHVpbnQ4QXJyYXksXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDMyJykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IHRoaXMuX19yZXdyYXBXaXRoVHlwZWRBcnJheShcbiAgICAgICAgICBVaW50MzJBcnJheSxcbiAgICAgICAgICB1aW50OEFycmF5LFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZmxvYXQzMkFycmF5ID0gdGhpcy5fX25vcm1hbGl6ZVR5cGVkQXJyYXlUb0Zsb2F0MzJBcnJheShkYXRhVmlld01ldGhvZCwgdHlwZWREYXRhQXJyYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3IgQmlnRW5kaWFuIHByb2Nlc3NcbiAgICAgIGNvbnN0IGRhdGFWaWV3OiBhbnkgPSBuZXcgRGF0YVZpZXcodWludDhBcnJheS5idWZmZXIsIGJ5dGVPZmZzZXRGcm9tQnVmZmVyICsgdWludDhBcnJheS5ieXRlT2Zmc2V0LCBieXRlTGVuZ3RoKTtcbiAgICAgIGNvbnN0IGJ5dGVEZWx0YSA9IGNvbXBvbmVudEJ5dGVzICogY29tcG9uZW50TjtcbiAgICAgIGNvbnN0IGxpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBieXRlTGVuZ3RoOyBwb3MgKz0gYnl0ZURlbHRhKSB7XG4gICAgICAgIHN3aXRjaCAoYWNjZXNzb3IudHlwZSkge1xuICAgICAgICAgIGNhc2UgJ1NDQUxBUic6XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnVkVDMic6XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zICsgY29tcG9uZW50Qnl0ZXMsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnVkVDMyc6XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zICsgY29tcG9uZW50Qnl0ZXMsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zICsgY29tcG9uZW50Qnl0ZXMgKiAyLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1ZFQzQnOlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zICsgY29tcG9uZW50Qnl0ZXMgKiBpLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ01BVDQnOlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcyArIGNvbXBvbmVudEJ5dGVzICogaSwgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZmxvYXQzMkFycmF5ID0gdGhpcy5fX25vcm1hbGl6ZVR5cGVkQXJyYXlUb0Zsb2F0MzJBcnJheShkYXRhVmlld01ldGhvZCwgbnVtYmVyQXJyYXkpO1xuICAgIH1cblxuICAgIGFjY2Vzc29yLmV4dHJhcyEudHlwZWREYXRhQXJyYXkgPSBmbG9hdDMyQXJyYXk7XG5cbiAgICByZXR1cm4gZmxvYXQzMkFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIG5vcm1hbGl6ZSB2YWx1ZXMgb2YgVHlwZWRBcnJheSB0byBGbG9hdDMyQXJyYXlcbiAgICogU2VlOiB0aGUgbGFzdCBwYXJ0IG9mIDMuMTEuQW5pbWF0aW9uIGF0IGh0dHBzOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L2dsVEYvc3BlY3MvMi4wL2dsVEYtMi4wLmh0bWwjYW5pbWF0aW9uc1xuICAgKiBAcGFyYW0gZGF0YVZpZXdNZXRob2RcbiAgICogQHBhcmFtIG51bWJlckFycmF5XG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX25vcm1hbGl6ZVR5cGVkQXJyYXlUb0Zsb2F0MzJBcnJheShcbiAgICBkYXRhVmlld01ldGhvZDogc3RyaW5nLFxuICAgIG51bWJlckFycmF5OiBudW1iZXJbXSB8IFR5cGVkQXJyYXlcbiAgKTogRmxvYXQzMkFycmF5IHtcbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQ4Jykge1xuICAgICAgcmV0dXJuIERhdGFVdGlsLm5vcm1hbGl6ZWRJbnQ4QXJyYXlUb0Zsb2F0MzJBcnJheShudW1iZXJBcnJheSBhcyB1bmtub3duIGFzIEludDhBcnJheSk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQ4Jykge1xuICAgICAgcmV0dXJuIERhdGFVdGlsLm5vcm1hbGl6ZWRVaW50OEFycmF5VG9GbG9hdDMyQXJyYXkobnVtYmVyQXJyYXkgYXMgdW5rbm93biBhcyBVaW50OEFycmF5KTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50MTYnKSB7XG4gICAgICByZXR1cm4gRGF0YVV0aWwubm9ybWFsaXplZEludDE2QXJyYXlUb0Zsb2F0MzJBcnJheShudW1iZXJBcnJheSBhcyB1bmtub3duIGFzIEludDE2QXJyYXkpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50MTYnKSB7XG4gICAgICByZXR1cm4gRGF0YVV0aWwubm9ybWFsaXplZFVpbnQxNkFycmF5VG9GbG9hdDMyQXJyYXkobnVtYmVyQXJyYXkgYXMgdW5rbm93biBhcyBVaW50MTZBcnJheSk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDMyJykge1xuICAgICAgLy8gdHlwZWREYXRhQXJyYXkgPSBuZXcgSW50MzJBcnJheShudW1iZXJBcnJheSk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignTm90IGNvbnNpZGVyZWQnKTtcbiAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KCk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQzMicpIHtcbiAgICAgIC8vIHR5cGVkRGF0YUFycmF5ID0gbmV3IFVpbnQzMkFycmF5KG51bWJlckFycmF5KTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb3QgY29uc2lkZXJlZCcpO1xuICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoKTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0RmxvYXQzMicpIHtcbiAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KG51bWJlckFycmF5KTtcbiAgICB9XG4gICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ05vdCBjb25zaWRlcmVkJyk7XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fYWRkT2Zmc2V0VG9JbmRpY2VzKG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQpIHtcbiAgICBjb25zdCBwcmltaXRpdmVOdW1iZXIgPSBtZXNoQ29tcG9uZW50Lm1lc2ghLmdldFByaW1pdGl2ZU51bWJlcigpO1xuICAgIGxldCBvZmZzZXRTdW0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlTnVtYmVyOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2hDb21wb25lbnQubWVzaCEuZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgICBjb25zdCBpbmRpY2VzQWNjZXNzb3IgPSBwcmltaXRpdmUuaW5kaWNlc0FjY2Vzc29yO1xuICAgICAgaWYgKGluZGljZXNBY2Nlc3Nvcikge1xuICAgICAgICBjb25zdCBlbGVtZW50TnVtYmVyID0gaW5kaWNlc0FjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBlbGVtZW50TnVtYmVyOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaiwge30pO1xuICAgICAgICAgIGluZGljZXNBY2Nlc3Nvci5zZXRTY2FsYXIoaiwgaW5kZXggKyBvZmZzZXRTdW0sIHt9KTtcbiAgICAgICAgfVxuICAgICAgICBvZmZzZXRTdW0gKz0gZWxlbWVudE51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGFrZSBhIFJuLkFjY2Vzc29yIGZyb20gdGhlIFJuLkJ1ZmZlclxuICAgKiAgZnJvbSB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIEdsdGYyQnVmZmVyLCBHbHRmMkJ1ZmZlclZpZXcsIGFuZCBHbHRmMkFjY2Vzc29yLlxuICAgKiBAcGFyYW0gYWNjZXNzb3JcbiAgICogQHBhcmFtIHJuQnVmZmVyXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJuQWNjZXNzb3IoZW5naW5lOiBFbmdpbmUsIGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IsIHJuQnVmZmVyVmlldz86IEJ1ZmZlclZpZXcpIHtcbiAgICBsZXQgcm5BY2Nlc3NvcjogQWNjZXNzb3I7XG4gICAgaWYgKHJuQnVmZmVyVmlldyAhPSBudWxsKSB7XG4gICAgICBybkFjY2Vzc29yID0gcm5CdWZmZXJWaWV3XG4gICAgICAgIC50YWtlQWNjZXNzb3JXaXRoQnl0ZU9mZnNldCh7XG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuZnJvbVN0cmluZyhhY2Nlc3Nvci50eXBlKSxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLmZyb20oYWNjZXNzb3IuY29tcG9uZW50VHlwZSksXG4gICAgICAgICAgY291bnQ6IGFjY2Vzc29yLmNvdW50LFxuICAgICAgICAgIGJ5dGVPZmZzZXRJbkJ1ZmZlclZpZXc6IGFjY2Vzc29yLmJ5dGVPZmZzZXQgPz8gMCxcbiAgICAgICAgICBieXRlU3RyaWRlOiBhY2Nlc3Nvci5ieXRlU3RyaWRlLFxuICAgICAgICAgIG1heDogYWNjZXNzb3IubWF4LFxuICAgICAgICAgIG1pbjogYWNjZXNzb3IubWluLFxuICAgICAgICAgIG5vcm1hbGl6ZWQ6IGFjY2Vzc29yLm5vcm1hbGl6ZWQsXG4gICAgICAgIH0pXG4gICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBhY2Nlc3Nvci5idWZmZXJWaWV3IGlzIG5vdCBkZWZpbmVkLCB0aGUgYWNjZXNzb3IgTVVTVCBiZSBpbml0aWFsaXplZCB3aXRoIHplcm9zLlxuICAgICAgLy8gU2VlOiBodHRwczovL3JlZ2lzdHJ5Lmtocm9ub3Mub3JnL2dsVEYvc3BlY3MvMi4wL2dsVEYtMi4wLmh0bWwjX2FjY2Vzc29yX2J1ZmZlcnZpZXdcbiAgICAgIGNvbnN0IGNvbXBvc2l0aW9uVHlwZSA9IENvbXBvc2l0aW9uVHlwZS5mcm9tU3RyaW5nKGFjY2Vzc29yLnR5cGUpO1xuICAgICAgY29uc3QgY29tcG9uZW50VHlwZSA9IENvbXBvbmVudFR5cGUuZnJvbShhY2Nlc3Nvci5jb21wb25lbnRUeXBlKTtcbiAgICAgIGNvbnN0IGJ5dGVMZW5ndGhUb05lZWQgPVxuICAgICAgICBhY2Nlc3Nvci5jb3VudCAqIGNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSAqIGNvbXBvbmVudFR5cGUuZ2V0U2l6ZUluQnl0ZXMoKTtcbiAgICAgIGNvbnN0IHJuQnVmZmVyID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuY3JlYXRlQnVmZmVyT25EZW1hbmQoQnVmZmVyVXNlLkNQVUdlbmVyaWMsIGJ5dGVMZW5ndGhUb05lZWQsIDQpO1xuICAgICAgY29uc3Qgcm5CdWZmZXJWaWV3ID0gcm5CdWZmZXJcbiAgICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBieXRlTGVuZ3RoVG9OZWVkLFxuICAgICAgICAgIGJ5dGVTdHJpZGU6IGNvbXBvc2l0aW9uVHlwZS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKSAqIGNvbXBvbmVudFR5cGUuZ2V0U2l6ZUluQnl0ZXMoKSxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICAgIHJuQWNjZXNzb3IgPSBybkJ1ZmZlclZpZXdcbiAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBjb21wb3NpdGlvblR5cGUsXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgICAgICBjb3VudDogYWNjZXNzb3IuY291bnQsXG4gICAgICAgICAgbWF4OiBhY2Nlc3Nvci5tYXgsXG4gICAgICAgICAgbWluOiBhY2Nlc3Nvci5taW4sXG4gICAgICAgICAgbm9ybWFsaXplZDogYWNjZXNzb3Iubm9ybWFsaXplZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgfVxuXG4gICAgaWYgKElzLmV4aXN0KGFjY2Vzc29yLnNwYXJzZSkpIHtcbiAgICAgIHRoaXMuc2V0U3BhcnNlQWNjZXNzb3IoYWNjZXNzb3IsIHJuQWNjZXNzb3IpO1xuICAgIH1cbiAgICByZXR1cm4gcm5BY2Nlc3NvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlIGEgUm4uQnVmZmVyVmlldyBhbmQgYSBSbi5BY2Nlc3NvciBmcm9tIHRoZSBSbi5CdWZmZXJcbiAgICogIGZyb20gdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBHbHRmMkJ1ZmZlciwgR2x0ZjJCdWZmZXJWaWV3LCBhbmQgR2x0ZjJBY2Nlc3Nvci5cbiAgICogQHBhcmFtIGFjY2Vzc29yXG4gICAqIEBwYXJhbSBybkJ1ZmZlclxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yKGVuZ2luZTogRW5naW5lLCBhY2Nlc3NvcjogUm5NMkFjY2Vzc29yLCBybkJ1ZmZlcnM6IEJ1ZmZlcltdKSB7XG4gICAgY29uc3QgZ2x0ZkJ1ZmZlclZpZXcgPSBhY2Nlc3Nvci5idWZmZXJWaWV3T2JqZWN0O1xuICAgIGxldCBybkJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGdsdGZCdWZmZXJWaWV3ICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuQnVmZmVyID0gcm5CdWZmZXJzW2dsdGZCdWZmZXJWaWV3LmJ1ZmZlciFdO1xuICAgICAgcm5CdWZmZXJWaWV3ID0gdGhpcy5fX2dldFJuQnVmZmVyVmlldyhnbHRmQnVmZmVyVmlldywgcm5CdWZmZXIpO1xuICAgIH1cbiAgICBjb25zdCBybkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQWNjZXNzb3IoZW5naW5lLCBhY2Nlc3Nvciwgcm5CdWZmZXJWaWV3KTtcbiAgICByZXR1cm4gcm5BY2Nlc3NvcjtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fY29weVJuQWNjZXNzb3JBbmRCdWZmZXJWaWV3Rm9yTW9ycGhEYXRhKGVuZ2luZTogRW5naW5lLCBzcmNSbkFjY2Vzc29yOiBBY2Nlc3Nvcikge1xuICAgIGNvbnN0IGJ5dGVTaXplID0gc3JjUm5BY2Nlc3Nvci5lbGVtZW50Q291bnQgKiAzIC8qIHZlYzQgKi8gKiA0OyAvKiBieXRlcyAqL1xuICAgIGNvbnN0IGRzdFJuQnVmZmVyID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuY3JlYXRlQnVmZmVyT25EZW1hbmQoQnVmZmVyVXNlLkdQVVZlcnRleERhdGEsIGJ5dGVTaXplLCAxNik7XG4gICAgY29uc3QgZHN0Um5CdWZmZXJWaWV3ID0gZHN0Um5CdWZmZXJcbiAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVTaXplLFxuICAgICAgICBieXRlU3RyaWRlOiAzIC8qIHZlYzQgKi8gKiA0IC8qIGJ5dGVzICovLFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgY29uc3QgZHN0Um5BY2Nlc3NvciA9IGRzdFJuQnVmZmVyVmlld1xuICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvdW50OiBzcmNSbkFjY2Vzc29yLmVsZW1lbnRDb3VudCxcbiAgICAgICAgbWF4OiBzcmNSbkFjY2Vzc29yLm1heCxcbiAgICAgICAgbWluOiBzcmNSbkFjY2Vzc29yLm1pbixcbiAgICAgICAgbm9ybWFsaXplZDogc3JjUm5BY2Nlc3Nvci5ub3JtYWxpemVkLFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgZHN0Um5BY2Nlc3Nvci5jb3B5QnVmZmVyKHNyY1JuQWNjZXNzb3IpO1xuXG4gICAgcmV0dXJuIGRzdFJuQWNjZXNzb3I7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Rha2VSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yRm9yRHJhY28oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgYWNjZXNzb3I6IFJuTTJBY2Nlc3NvcixcbiAgICBjb21wb3NpdGlvbk51bTogQ291bnQsXG4gICAgcm5CdWZmZXI6IEJ1ZmZlclxuICApIHtcbiAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSBybkJ1ZmZlclxuICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogYWNjZXNzb3IuY291bnQgKiBjb21wb3NpdGlvbk51bSAqIDQsXG4gICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICB9KVxuICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICBjb25zdCBybkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQWNjZXNzb3IoZW5naW5lLCBhY2Nlc3Nvciwgcm5CdWZmZXJWaWV3KTtcbiAgICByZXR1cm4gcm5BY2Nlc3NvcjtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0Um5CdWZmZXJWaWV3KHJubTJidWZmZXJWaWV3OiBSbk0yQnVmZmVyVmlldywgcm5CdWZmZXI6IEJ1ZmZlcikge1xuICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHJuQnVmZmVyXG4gICAgICAudGFrZUJ1ZmZlclZpZXdXaXRoQnl0ZU9mZnNldCh7XG4gICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IHJubTJidWZmZXJWaWV3LmJ5dGVMZW5ndGgsXG4gICAgICAgIGJ5dGVTdHJpZGU6IHJubTJidWZmZXJWaWV3LmJ5dGVTdHJpZGUgPz8gMCxcbiAgICAgICAgYnl0ZU9mZnNldDogcm5tMmJ1ZmZlclZpZXcuYnl0ZU9mZnNldCA/PyAwLFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgcmV0dXJuIHJuQnVmZmVyVmlldztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0R2VvbWV0cnlGcm9tRHJhY29CdWZmZXIoZHJhY286IGFueSwgZGVjb2RlcjogYW55LCBhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgZHJhY28uRGVjb2RlckJ1ZmZlcigpO1xuICAgIGJ1ZmZlci5Jbml0KG5ldyBJbnQ4QXJyYXkoYXJyYXlCdWZmZXIpLCBhcnJheUJ1ZmZlci5ieXRlTGVuZ3RoKTtcbiAgICBjb25zdCBnZW9tZXRyeVR5cGUgPSBkZWNvZGVyLkdldEVuY29kZWRHZW9tZXRyeVR5cGUoYnVmZmVyKTtcbiAgICBsZXQgZHJhY29HZW9tZXRyeTogYW55O1xuICAgIGxldCBkZWNvZGluZ1N0YXR1czogYW55O1xuICAgIGlmIChnZW9tZXRyeVR5cGUgPT09IGRyYWNvLlRSSUFOR1VMQVJfTUVTSCkge1xuICAgICAgZHJhY29HZW9tZXRyeSA9IG5ldyBkcmFjby5NZXNoKCk7XG4gICAgICBkZWNvZGluZ1N0YXR1cyA9IGRlY29kZXIuRGVjb2RlQnVmZmVyVG9NZXNoKGJ1ZmZlciwgZHJhY29HZW9tZXRyeSk7XG4gICAgfSBlbHNlIGlmIChnZW9tZXRyeVR5cGUgPT09IGRyYWNvLlBPSU5UX0NMT1VEKSB7XG4gICAgICBkcmFjb0dlb21ldHJ5ID0gbmV3IGRyYWNvLlBvaW50Q2xvdWQoKTtcbiAgICAgIGRlY29kaW5nU3RhdHVzID0gZGVjb2Rlci5EZWNvZGVCdWZmZXJUb1BvaW50Q2xvdWQoYnVmZmVyLCBkcmFjb0dlb21ldHJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPSAnVW5rbm93biBnZW9tZXRyeSB0eXBlLic7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgZHJhY29HZW9tZXRyeS5nZW9tZXRyeVR5cGUgPSBnZW9tZXRyeVR5cGU7IC8vIHN0b3JlXG5cbiAgICBpZiAoIWRlY29kaW5nU3RhdHVzLm9rKCkgfHwgZHJhY29HZW9tZXRyeS5wdHIgPT09IDApIHtcbiAgICAgIGxldCBlcnJvck1zZyA9ICdEZWNvZGluZyBmYWlsZWQ6ICc7XG4gICAgICBlcnJvck1zZyArPSBkZWNvZGluZ1N0YXR1cy5lcnJvcl9tc2coKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGVycm9yTXNnKTtcbiAgICAgIGRyYWNvLmRlc3Ryb3koZGVjb2Rlcik7XG4gICAgICBkcmFjby5kZXN0cm95KGRyYWNvR2VvbWV0cnkpO1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgZHJhY28uZGVzdHJveShidWZmZXIpO1xuXG4gICAgcmV0dXJuIGRyYWNvR2VvbWV0cnk7XG4gIH1cblxuICBzdGF0aWMgX19nZXRJbmRpY2VzRnJvbURyYWNvKGRyYWNvOiBhbnksIGRlY29kZXI6IGFueSwgZHJhY29HZW9tZXRyeTogYW55LCB0cmlhbmdsZVN0cmlwRHJhd01vZGU6IGJvb2xlYW4pIHtcbiAgICAvLyBGb3IgbWVzaCwgd2UgbmVlZCB0byBnZW5lcmF0ZSB0aGUgZmFjZXMuXG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gZHJhY29HZW9tZXRyeS5nZW9tZXRyeVR5cGU7XG4gICAgaWYgKGdlb21ldHJ5VHlwZSAhPT0gZHJhY28uVFJJQU5HVUxBUl9NRVNIKSB7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cblxuICAgIGxldCBpbmRpY2VzOiBVaW50MzJBcnJheSB8IHVuZGVmaW5lZDtcblxuICAgIGlmICh0cmlhbmdsZVN0cmlwRHJhd01vZGUpIHtcbiAgICAgIGNvbnN0IHN0cmlwc0FycmF5ID0gbmV3IGRyYWNvLkRyYWNvSW50MzJBcnJheSgpO1xuICAgICAgZGVjb2Rlci5HZXRUcmlhbmdsZVN0cmlwc0Zyb21NZXNoKGRyYWNvR2VvbWV0cnksIHN0cmlwc0FycmF5KTtcbiAgICAgIGluZGljZXMgPSBuZXcgVWludDMyQXJyYXkoc3RyaXBzQXJyYXkuc2l6ZSgpKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaXBzQXJyYXkuc2l6ZSgpOyArK2kpIHtcbiAgICAgICAgaW5kaWNlc1tpXSA9IHN0cmlwc0FycmF5LkdldFZhbHVlKGkpO1xuICAgICAgfVxuICAgICAgZHJhY28uZGVzdHJveShzdHJpcHNBcnJheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRSSUFOR0xFU1xuICAgICAgY29uc3QgbnVtRmFjZXMgPSBkcmFjb0dlb21ldHJ5Lm51bV9mYWNlcygpO1xuICAgICAgY29uc3QgbnVtSW5kaWNlcyA9IG51bUZhY2VzICogMztcbiAgICAgIGluZGljZXMgPSBuZXcgVWludDMyQXJyYXkobnVtSW5kaWNlcyk7XG4gICAgICBjb25zdCBpYSA9IG5ldyBkcmFjby5EcmFjb0ludDMyQXJyYXkoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtRmFjZXM7ICsraSkge1xuICAgICAgICBkZWNvZGVyLkdldEZhY2VGcm9tTWVzaChkcmFjb0dlb21ldHJ5LCBpLCBpYSk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaSAqIDM7XG4gICAgICAgIGluZGljZXNbaW5kZXhdID0gaWEuR2V0VmFsdWUoMCk7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAxXSA9IGlhLkdldFZhbHVlKDEpO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSBpYS5HZXRWYWx1ZSgyKTtcbiAgICAgIH1cbiAgICAgIGRyYWNvLmRlc3Ryb3koaWEpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZGVjb2RlRHJhY28oXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcHJpbWl0aXZlOiBSbk0yUHJpbWl0aXZlLFxuICAgIHJuQnVmZmVyczogQnVmZmVyW10sXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIG1hcDogTWFwPFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZywgQWNjZXNzb3I+XG4gICkge1xuICAgIGNvbnN0IGJ1ZmZlclZpZXcgPSBnbHRmTW9kZWwuYnVmZmVyVmlld3NbcHJpbWl0aXZlLmV4dGVuc2lvbnM/LktIUl9kcmFjb19tZXNoX2NvbXByZXNzaW9uLmJ1ZmZlclZpZXddO1xuICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXcoYnVmZmVyVmlldywgcm5CdWZmZXJzW2J1ZmZlclZpZXcuYnVmZmVyIV0pO1xuICAgIGNvbnN0IGFycmF5YnVmZmVyT2ZCdWZmZXJWaWV3ID0gbmV3IFVpbnQ4QXJyYXkocm5CdWZmZXJWaWV3LmdldFVpbnQ4QXJyYXkoKSkuYnVmZmVyO1xuXG4gICAgY29uc3QgZHJhY28gPSBuZXcgRHJhY29EZWNvZGVyTW9kdWxlKCk7XG4gICAgY29uc3QgZGVjb2RlciA9IG5ldyBkcmFjby5EZWNvZGVyKCk7XG4gICAgY29uc3QgZHJhY29HZW9tZXRyeSA9IHRoaXMuX19nZXRHZW9tZXRyeUZyb21EcmFjb0J1ZmZlcihkcmFjbywgZGVjb2RlciwgYXJyYXlidWZmZXJPZkJ1ZmZlclZpZXcpO1xuICAgIGlmIChkcmFjb0dlb21ldHJ5ID09IG51bGwpIHtcbiAgICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG4gICAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG5cbiAgICBjb25zdCBudW1Qb2ludHMgPSBkcmFjb0dlb21ldHJ5Lm51bV9wb2ludHMoKTtcbiAgICBjb25zdCBybkJ1ZmZlckZvckRyYWNvID0gdGhpcy5fX2NyZWF0ZUJ1ZmZlckZvckRlY29tcHJlc3NlZERhdGEocHJpbWl0aXZlLCBudW1Qb2ludHMpO1xuXG4gICAgLy8gZGVjb2RlIGluZGljZXNcbiAgICBjb25zdCBwcmltaXRpdmVNb2RlID0gUHJpbWl0aXZlTW9kZS5mcm9tKHByaW1pdGl2ZS5tb2RlISk7XG4gICAgbGV0IGlzVHJpYW5nbGVTdHJpcCA9IGZhbHNlO1xuICAgIGlmIChwcmltaXRpdmVNb2RlID09PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXApIHtcbiAgICAgIGlzVHJpYW5nbGVTdHJpcCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuX19nZXRJbmRpY2VzRnJvbURyYWNvKGRyYWNvLCBkZWNvZGVyLCBkcmFjb0dlb21ldHJ5LCBpc1RyaWFuZ2xlU3RyaXApITtcbiAgICBjb25zdCBpbmRpY2VzUm5BY2Nlc3NvciA9IHRoaXMuX190YWtlUm5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvckZvckRyYWNvKFxuICAgICAgZW5naW5lLFxuICAgICAgcHJpbWl0aXZlLmluZGljZXNPYmplY3QhLFxuICAgICAgMSxcbiAgICAgIHJuQnVmZmVyRm9yRHJhY29cbiAgICApO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaW5kaWNlc1JuQWNjZXNzb3Iuc2V0U2NhbGFyKGksIGluZGljZXNbaV0sIHt9KTtcbiAgICB9XG5cbiAgICAvLyBkZWNvZGUgYXR0cmlidXRlc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBwcmltaXRpdmUuYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgZHJhY29BdHRyaWJ1dGVJZCA9IHByaW1pdGl2ZS5leHRlbnNpb25zPy5LSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbi5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXNPYmplY3RzIVthdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGxldCBhdHRyaWJ1dGVSbkFjY2Vzc29yOiBBY2Nlc3NvciB8IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKElzLm5vdC5leGlzdChkcmFjb0F0dHJpYnV0ZUlkKSkge1xuICAgICAgICAvLyBub24tZW5jb2RlZCBkYXRhXG5cbiAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yKGVuZ2luZSwgYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciEsIHJuQnVmZmVycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlbmNvZGVkIGRhdGFcblxuICAgICAgICBjb25zdCBjb21wb3NpdGlvbk51bSA9IENvbXBvc2l0aW9uVHlwZS5mcm9tU3RyaW5nKGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IhLnR5cGUpLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yID0gdGhpcy5fX3Rha2VSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yRm9yRHJhY28oXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IhLFxuICAgICAgICAgIGNvbXBvc2l0aW9uTnVtLFxuICAgICAgICAgIHJuQnVmZmVyRm9yRHJhY29cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBkcmFjb0F0dHJpYnV0ZVBvaW50ZXIgPSBkZWNvZGVyLkdldEF0dHJpYnV0ZUJ5VW5pcXVlSWQoZHJhY29HZW9tZXRyeSwgZHJhY29BdHRyaWJ1dGVJZCk7XG4gICAgICAgIGNvbnN0IGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEgPSBuZXcgZHJhY28uRHJhY29GbG9hdDMyQXJyYXkoKTtcbiAgICAgICAgZGVjb2Rlci5HZXRBdHRyaWJ1dGVGbG9hdEZvckFsbFBvaW50cyhkcmFjb0dlb21ldHJ5LCBkcmFjb0F0dHJpYnV0ZVBvaW50ZXIsIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUG9pbnRzOyBpKyspIHtcbiAgICAgICAgICBpZiAoY29tcG9zaXRpb25OdW0gPT09IDEpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3Iuc2V0U2NhbGFyKGksIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtKSwge30pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25OdW0gPT09IDIpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3Iuc2V0VmVjMihcbiAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0pLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDEpLFxuICAgICAgICAgICAgICB7fVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBvc2l0aW9uTnVtID09PSAzKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yLnNldFZlYzMoXG4gICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAxKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAyKSxcbiAgICAgICAgICAgICAge31cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjb21wb3NpdGlvbk51bSA9PT0gNCkge1xuICAgICAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3Nvci5zZXRWZWM0KFxuICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMSksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMiksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMyksXG4gICAgICAgICAgICAgIHt9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRyYWNvLmRlc3Ryb3koZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChJcy5leGlzdChhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yIS5zcGFyc2UpKSB7XG4gICAgICAgIHRoaXMuc2V0U3BhcnNlQWNjZXNzb3IoYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciEsIGF0dHJpYnV0ZVJuQWNjZXNzb3IhKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgam9pbmVkU3RyaW5nID0gVmVydGV4QXR0cmlidXRlLnRvVmVydGV4QXR0cmlidXRlU2VtYW50aWNKb2luZWRTdHJpbmdBc0dsdGZTdHlsZShcbiAgICAgICAgVmVydGV4QXR0cmlidXRlLmZyb21TdHJpbmcoYXR0cmlidXRlTmFtZSlcbiAgICAgICk7XG4gICAgICBtYXAuc2V0KGpvaW5lZFN0cmluZywgYXR0cmlidXRlUm5BY2Nlc3NvciEpO1xuICAgIH1cblxuICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG4gICAgZHJhY28uZGVzdHJveShkZWNvZGVyKTtcblxuICAgIHJldHVybiBpbmRpY2VzUm5BY2Nlc3NvcjtcbiAgfVxuXG4gIHN0YXRpYyBfc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgIHRleHR1cmVKc29uOiBSbk0yVGV4dHVyZUluZm8sXG4gICAgcm5NYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgdGV4dHVyZVRyYW5zZm9ybVNjYWxlU2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWUsXG4gICAgdGV4dHVyZVRyYW5zZm9ybU9mZnNldFNoYWRlclNlbWFudGljOiBTaGFkZXJTZW1hbnRpY3NOYW1lLFxuICAgIHRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvblNoYWRlclNlbWFudGljOiBTaGFkZXJTZW1hbnRpY3NOYW1lXG4gICkge1xuICAgIGlmICh0ZXh0dXJlSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX3RleHR1cmVfdHJhbnNmb3JtKSB7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1TY2FsZSA9IE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkoWzEuMCwgMS4wXSk7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1PZmZzZXQgPSBNdXRhYmxlVmVjdG9yMi5mcm9tQ29weUFycmF5KFswLjAsIDAuMF0pO1xuICAgICAgbGV0IHJvdGF0aW9uID0gMDtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtSnNvbiA9IHRleHR1cmVKc29uLmV4dGVuc2lvbnMuS0hSX3RleHR1cmVfdHJhbnNmb3JtO1xuICAgICAgaWYgKHRyYW5zZm9ybUpzb24uc2NhbGUgIT0gbnVsbCkge1xuICAgICAgICB0cmFuc2Zvcm1TY2FsZS54ID0gdHJhbnNmb3JtSnNvbi5zY2FsZVswXTtcbiAgICAgICAgdHJhbnNmb3JtU2NhbGUueSA9IHRyYW5zZm9ybUpzb24uc2NhbGVbMV07XG4gICAgICB9XG4gICAgICBpZiAodHJhbnNmb3JtSnNvbi5vZmZzZXQgIT0gbnVsbCkge1xuICAgICAgICB0cmFuc2Zvcm1PZmZzZXQueCA9IHRyYW5zZm9ybUpzb24ub2Zmc2V0WzBdO1xuICAgICAgICB0cmFuc2Zvcm1PZmZzZXQueSA9IHRyYW5zZm9ybUpzb24ub2Zmc2V0WzFdO1xuICAgICAgfVxuICAgICAgaWYgKHRyYW5zZm9ybUpzb24ucm90YXRpb24gIT0gbnVsbCkge1xuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybUpzb24ucm90YXRpb247XG4gICAgICB9XG5cbiAgICAgIHJuTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHRleHR1cmVUcmFuc2Zvcm1TY2FsZVNoYWRlclNlbWFudGljLCB0cmFuc2Zvcm1TY2FsZSk7XG4gICAgICBybk1hdGVyaWFsLnNldFBhcmFtZXRlcih0ZXh0dXJlVHJhbnNmb3JtT2Zmc2V0U2hhZGVyU2VtYW50aWMsIHRyYW5zZm9ybU9mZnNldCk7XG4gICAgICBybk1hdGVyaWFsLnNldFBhcmFtZXRlcih0ZXh0dXJlVHJhbnNmb3JtUm90YXRpb25TaGFkZXJTZW1hbnRpYywgcm90YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fY3JlYXRlQnVmZmVyRm9yRGVjb21wcmVzc2VkRGF0YShwcmltaXRpdmU6IFJuTTJQcmltaXRpdmUsIG51bVBvaW50czogbnVtYmVyKTogQnVmZmVyIHtcbiAgICBsZXQgYnl0ZUxlbmd0aE9mQnVmZmVyRm9yRHJhY28gPSAwO1xuXG4gICAgaWYgKElzLmV4aXN0KHByaW1pdGl2ZS5pbmRpY2VzKSkge1xuICAgICAgY29uc3QgY291bnQgPSBwcmltaXRpdmUuaW5kaWNlc09iamVjdCEuY291bnQ7XG4gICAgICBieXRlTGVuZ3RoT2ZCdWZmZXJGb3JEcmFjbyArPSBjb3VudCAqIDQ7XG4gICAgfVxuXG4gICAgY29uc3QgZHJjQXR0cmlidXRlcyA9IHByaW1pdGl2ZS5leHRlbnNpb25zPy5LSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbi5hdHRyaWJ1dGVzO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBwcmltaXRpdmUuYXR0cmlidXRlcykge1xuICAgICAgaWYgKGRyY0F0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPT0gbnVsbCkge1xuICAgICAgICAvLyBub24tZW5jb2RlZCBkYXRhXG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFjY2Vzc29yID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXNPYmplY3RzIVthdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGNvbXBvc2l0aW9uTnVtID0gQ29tcG9zaXRpb25UeXBlLmZyb21TdHJpbmcoYWNjZXNzb3IhLnR5cGUpLmdldE51bWJlck9mQ29tcG9uZW50cygpO1xuICAgICAgY29uc3QgYXR0cmlidXRlQnl0ZUxlbmd0aCA9IG51bVBvaW50cyAqIGNvbXBvc2l0aW9uTnVtICogNDtcbiAgICAgIGJ5dGVMZW5ndGhPZkJ1ZmZlckZvckRyYWNvICs9IGF0dHJpYnV0ZUJ5dGVMZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoe1xuICAgICAgYnl0ZUxlbmd0aDogYnl0ZUxlbmd0aE9mQnVmZmVyRm9yRHJhY28sXG4gICAgICBidWZmZXI6IG5ldyBBcnJheUJ1ZmZlcihieXRlTGVuZ3RoT2ZCdWZmZXJGb3JEcmFjbyksXG4gICAgICBuYW1lOiAnRHJhY28nLFxuICAgICAgYnl0ZUFsaWduOiA0LFxuICAgICAgYnVmZmVyVXNhZ2U6IEJ1ZmZlclVzZS5DUFVHZW5lcmljLFxuICAgICAgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlOiAwLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBNVG9vbiAxLjAgbWF0ZXJpYWwgcGFyYW1ldGVycyBmcm9tIFZSTSBtYXRlcmlhbCBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBWUk0gMS4wIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwTVRvb24xKFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIG1hdGVyaWFsSnNvbjogVnJtMV9NYXRlcmlhbCxcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBtVG9vbiA9IG1hdGVyaWFsSnNvbi5leHRlbnNpb25zLlZSTUNfbWF0ZXJpYWxzX210b29uO1xuXG4gIHtcbiAgICBjb25zdCBzaGFkZUNvbG9yRmFjdG9yID0gbVRvb24uc2hhZGVDb2xvckZhY3RvcjtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRlQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKHNoYWRlQ29sb3JGYWN0b3IpKTtcbiAgfVxuXG4gIHtcbiAgICBjb25zdCBzaGFkZU11bHRpcGx5VGV4dHVyZSA9IG1Ub29uLnNoYWRlTXVsdGlwbHlUZXh0dXJlO1xuICAgIGlmIChzaGFkZU11bHRpcGx5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW3NoYWRlTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzaGFkZU11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzaGFkZU11bHRpcGx5VGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzaGFkZU11bHRpcGx5VGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGVNdWx0aXBseVRleGNvb3JkSW5kZXgnLCBzaGFkZU11bHRpcGx5VGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGNvbnN0IHNoYWRpbmdTaGlmdEZhY3RvciA9IG1Ub29uLnNoYWRpbmdTaGlmdEZhY3RvcjtcbiAgICBpZiAoc2hhZGluZ1NoaWZ0RmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGluZ1NoaWZ0RmFjdG9yJywgc2hhZGluZ1NoaWZ0RmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHNoYWRpbmdTaGlmdFRleHR1cmUgPSBtVG9vbi5zaGFkaW5nU2hpZnRUZXh0dXJlO1xuICAgIGlmIChzaGFkaW5nU2hpZnRUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbc2hhZGluZ1NoaWZ0VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc2hhZGluZ1NoaWZ0VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzaGFkaW5nU2hpZnRUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNoYWRpbmdTaGlmdFRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRpbmdTaGlmdFRleGNvb3JkSW5kZXgnLCBzaGFkaW5nU2hpZnRUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZSA9IHNoYWRpbmdTaGlmdFRleHR1cmUuc2NhbGU7XG4gICAgICBpZiAoc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUnLCBzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgc2hhZGluZ1Rvb255RmFjdG9yID0gbVRvb24uc2hhZGluZ1Rvb255RmFjdG9yO1xuICAgIGlmIChzaGFkaW5nVG9vbnlGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkaW5nVG9vbnlGYWN0b3InLCBzaGFkaW5nVG9vbnlGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgZ2lFcXVhbGl6YXRpb25GYWN0b3IgPSBtVG9vbi5naUVxdWFsaXphdGlvbkZhY3RvcjtcbiAgICBpZiAoZ2lFcXVhbGl6YXRpb25GYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdnaUVxdWFsaXphdGlvbkZhY3RvcicsIGdpRXF1YWxpemF0aW9uRmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG1hdGNhcFRleHR1cmUgPSBtVG9vbi5tYXRjYXBUZXh0dXJlO1xuICAgIGlmIChtYXRjYXBUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbbWF0Y2FwVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbbWF0Y2FwVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdtYXRjYXBUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKG1hdGNhcFRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21hdGNhcFRleGNvb3JkSW5kZXgnLCBtYXRjYXBUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG1hdGNhcEZhY3RvciA9IG1Ub29uLm1hdGNhcEZhY3RvcjtcbiAgICBpZiAobWF0Y2FwRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbWF0Y2FwRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhtYXRjYXBGYWN0b3IpKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1Db2xvckZhY3RvciA9IG1Ub29uLnBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcjtcbiAgICBpZiAocGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhwYXJhbWV0cmljUmltQ29sb3JGYWN0b3IpKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgPSBtVG9vbi5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yO1xuICAgIGlmIChwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcicsIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IgPSBtVG9vbi5wYXJhbWV0cmljUmltTGlmdEZhY3RvcjtcbiAgICBpZiAocGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwYXJhbWV0cmljUmltTGlmdEZhY3RvcicsIHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHJpbU11bHRpcGx5VGV4dHVyZSA9IG1Ub29uLnJpbU11bHRpcGx5VGV4dHVyZTtcbiAgICBpZiAocmltTXVsdGlwbHlUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbcmltTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tyaW1NdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcigncmltTXVsdGlwbHlUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHJpbU11bHRpcGx5VGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncmltTXVsdGlwbHlUZXhjb29yZEluZGV4JywgcmltTXVsdGlwbHlUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHJpbUxpZ2h0aW5nTWl4RmFjdG9yID0gbVRvb24ucmltTGlnaHRpbmdNaXhGYWN0b3I7XG4gICAgaWYgKHJpbUxpZ2h0aW5nTWl4RmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncmltTGlnaHRpbmdNaXhGYWN0b3InLCByaW1MaWdodGluZ01peEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBvdXRsaW5lV2lkdGhNb2RlID0gbVRvb24ub3V0bGluZVdpZHRoTW9kZTtcbiAgICBpZiAob3V0bGluZVdpZHRoTW9kZSAhPSBudWxsKSB7XG4gICAgICBpZiAob3V0bGluZVdpZHRoTW9kZSA9PT0gJ25vbmUnKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZVdpZHRoTW9kZScsIDApO1xuICAgICAgfSBlbHNlIGlmIChvdXRsaW5lV2lkdGhNb2RlID09PSAnd29ybGRDb29yZGluYXRlcycpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lV2lkdGhNb2RlJywgMSk7XG4gICAgICB9IGVsc2UgaWYgKG91dGxpbmVXaWR0aE1vZGUgPT09ICdzY3JlZW5Db29yZGluYXRlcycpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lV2lkdGhNb2RlJywgMik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBvdXRsaW5lV2lkdGhGYWN0b3IgPSBtVG9vbi5vdXRsaW5lV2lkdGhGYWN0b3I7XG4gICAgaWYgKG91dGxpbmVXaWR0aEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVXaWR0aEZhY3RvcicsIG91dGxpbmVXaWR0aEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgPSBtVG9vbi5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmU7XG4gICAgaWYgKG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW291dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ291dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG91dGxpbmVDb2xvckZhY3RvciA9IG1Ub29uLm91dGxpbmVDb2xvckZhY3RvcjtcbiAgICBpZiAob3V0bGluZUNvbG9yRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZUNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhvdXRsaW5lQ29sb3JGYWN0b3IpKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG91dGxpbmVMaWdodGluZ01peEZhY3RvciA9IG1Ub29uLm91dGxpbmVMaWdodGluZ01peEZhY3RvcjtcbiAgICBpZiAob3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yJywgb3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHV2QW5pbWF0aW9uTWFza1RleHR1cmUgPSBtVG9vbi51dkFuaW1hdGlvbk1hc2tUZXh0dXJlO1xuICAgIGlmICh1dkFuaW1hdGlvbk1hc2tUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbdXZBbmltYXRpb25NYXNrVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbdXZBbmltYXRpb25NYXNrVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCd1dkFuaW1hdGlvbk1hc2tUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHV2QW5pbWF0aW9uTWFza1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3V2QW5pbWF0aW9uTWFza1RleGNvb3JkSW5kZXgnLCB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yID0gbVRvb24udXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3I7XG4gICAgaWYgKHV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3InLCB1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCB1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvciA9IG1Ub29uLnV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yO1xuICAgIGlmICh1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3V2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yJywgdXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgdXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yID0gbVRvb24udXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yO1xuICAgIGlmICh1dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd1dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3InLCB1dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgUEJSIG1ldGFsbGljLXJvdWdobmVzcyBtYXRlcmlhbCBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gcGJyTWV0YWxsaWNSb3VnaG5lc3MgLSBUaGUgUEJSIG1ldGFsbGljLXJvdWdobmVzcyBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIG9wdGlvbnMgLSBMb2FkZXIgb3B0aW9uc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cFBick1ldGFsbGljUm91Z2huZXNzKFxuICBwYnJNZXRhbGxpY1JvdWdobmVzczogUm5NMlBick1ldGFsbGljUm91Z2huZXNzLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIGdsdGZNb2RlbDogUm5NMixcbiAgb3B0aW9uczogR2x0ZkxvYWRPcHRpb24gfCB1bmRlZmluZWQsXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IGlzVW5saXQgPSBtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc191bmxpdCAhPSBudWxsO1xuXG4gIGNvbnN0IGJhc2VDb2xvckZhY3RvciA9IHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvckZhY3RvcjtcbiAgaWYgKGJhc2VDb2xvckZhY3RvciAhPSBudWxsKSB7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdiYXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KGJhc2VDb2xvckZhY3RvcikpO1xuICB9XG5cbiAgLy8gQmFzZUNvbG9yIFRleHR1cmVcbiAgY29uc3QgYmFzZUNvbG9yVGV4dHVyZSA9IHBick1ldGFsbGljUm91Z2huZXNzLmJhc2VDb2xvclRleHR1cmU7XG4gIGlmIChiYXNlQ29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW2Jhc2VDb2xvclRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tiYXNlQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdiYXNlQ29sb3JUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgIGlmIChiYXNlQ29sb3JUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYmFzZUNvbG9yVGV4Y29vcmRJbmRleCcsIGJhc2VDb2xvclRleHR1cmUudGV4Q29vcmQpO1xuICAgIH1cbiAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgYmFzZUNvbG9yVGV4dHVyZSEsXG4gICAgICBtYXRlcmlhbCxcbiAgICAgICdiYXNlQ29sb3JUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICApO1xuICB9XG5cbiAgLy8gQW1iaWVudCBPY2NsdXNpb24gVGV4dHVyZVxuICBjb25zdCBvY2NsdXNpb25UZXh0dXJlID0gbWF0ZXJpYWxKc29uLm9jY2x1c2lvblRleHR1cmU7XG4gIGlmIChvY2NsdXNpb25UZXh0dXJlICE9IG51bGwgJiYgSXMuZmFsc3koaXNVbmxpdCkpIHtcbiAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW29jY2x1c2lvblRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tvY2NsdXNpb25UZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdvY2NsdXNpb25UZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgIGlmIChvY2NsdXNpb25UZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb2NjbHVzaW9uVGV4Y29vcmRJbmRleCcsIG9jY2x1c2lvblRleHR1cmUudGV4Q29vcmQpO1xuICAgIH1cbiAgICBpZiAob2NjbHVzaW9uVGV4dHVyZS5zdHJlbmd0aCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ29jY2x1c2lvblN0cmVuZ3RoJywgb2NjbHVzaW9uVGV4dHVyZS5zdHJlbmd0aCk7XG4gICAgfVxuICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICBvY2NsdXNpb25UZXh0dXJlLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICAnb2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICdvY2NsdXNpb25UZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICdvY2NsdXNpb25UZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgKTtcbiAgfVxuXG4gIC8vIE1ldGFsbGljIEZhY3RvclxuICBsZXQgbWV0YWxsaWNGYWN0b3IgPSBwYnJNZXRhbGxpY1JvdWdobmVzcy5tZXRhbGxpY0ZhY3RvcjtcbiAgbWV0YWxsaWNGYWN0b3IgPSBpc1VubGl0ID8gMCA6IChtZXRhbGxpY0ZhY3RvciA/PyAxKTtcbiAgbGV0IHJvdWdobmVzc0ZhY3RvciA9IHBick1ldGFsbGljUm91Z2huZXNzLnJvdWdobmVzc0ZhY3RvcjtcbiAgcm91Z2huZXNzRmFjdG9yID0gaXNVbmxpdCA/IDEgOiAocm91Z2huZXNzRmFjdG9yID8/IDEpO1xuICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21ldGFsbGljRmFjdG9yJywgbWV0YWxsaWNGYWN0b3IpO1xuICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3JvdWdobmVzc0ZhY3RvcicsIHJvdWdobmVzc0ZhY3Rvcik7XG5cbiAgLy8gTWV0YWxsaWMgcm91Z2huZXNzIHRleHR1cmVcbiAgY29uc3QgbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlO1xuICBpZiAobWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlICE9IG51bGwgJiYgSXMuZmFsc3koaXNVbmxpdCkpIHtcbiAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW21ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW21ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgIGlmIChtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdtZXRhbGxpY1JvdWdobmVzc1RleGNvb3JkSW5kZXgnLCBtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUudGV4Q29vcmQpO1xuICAgIH1cbiAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlISxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICk7XG4gIH1cblxuICAvLyBpZiAoSXMuZXhpc3QobWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlPy50ZXh0dXJlPy5pbWFnZT8uaW1hZ2UpKSB7XG4gIC8vICAgY29uc3QgaW1hZ2UgPSBtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUhLnRleHR1cmUhLmltYWdlIS5pbWFnZTtcbiAgLy8gICBjb25zdCB3aWR0aCA9IGltYWdlLndpZHRoO1xuICAvLyAgIGNvbnN0IGhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAvLyAgIGNvbnN0IG1ldGFsbGljUm91Z2huZXNzQ2FudmFzID0gY29udmVydEhUTUxJbWFnZUVsZW1lbnRUb0NhbnZhcyhpbWFnZSwgd2lkdGgsIGhlaWdodCk7XG4gIC8vIH1cblxuICAvLyBDbGVhckNvYXRcbiAgc2V0dXBfS0hSX21hdGVyaWFsc19jbGVhcmNvYXQobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICAvLyBUcmFuc21pc3Npb25cbiAgY29uc3QgdHJhbnNtaXNzaW9uID0gc2V0dXBfS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24obWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcbiAgaWYgKCFvcHRpb25zIS50cmFuc21pc3Npb24pIHtcbiAgICBvcHRpb25zIS50cmFuc21pc3Npb24gPSB0cmFuc21pc3Npb247XG4gIH1cblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX3ZvbHVtZShtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfc2hlZW4obWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19pb3IobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5KG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aChtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24obWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICogQHJldHVybnMgVHJ1ZSBpZiB0cmFuc21pc3Npb24gd2FzIGNvbmZpZ3VyZWRcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24oXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24gPSBtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc190cmFuc21pc3Npb247XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbikpIHtcbiAgICBjb25zdCB0cmFuc21pc3Npb25GYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbi50cmFuc21pc3Npb25GYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uLnRyYW5zbWlzc2lvbkZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd0cmFuc21pc3Npb25GYWN0b3InLCB0cmFuc21pc3Npb25GYWN0b3IpO1xuXG4gICAgY29uc3QgdHJhbnNtaXNzaW9uVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uLnRyYW5zbWlzc2lvblRleHR1cmU7XG4gICAgaWYgKElzLmV4aXN0KHRyYW5zbWlzc2lvblRleHR1cmUpKSB7XG4gICAgICBjb25zdCByblRyYW5zbWlzc2lvblRleHR1cmUgPSByblRleHR1cmVzW3RyYW5zbWlzc2lvblRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3RyYW5zbWlzc2lvblRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcigndHJhbnNtaXNzaW9uVGV4dHVyZScsIHJuVHJhbnNtaXNzaW9uVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmICh0cmFuc21pc3Npb25UZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd0cmFuc21pc3Npb25UZXhjb29yZEluZGV4JywgdHJhbnNtaXNzaW9uVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICB0cmFuc21pc3Npb25UZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3RyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICd0cmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3RyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0IGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdChcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdCA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19jbGVhcmNvYXQ7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdCkpIHtcbiAgICAvLyBDbGVhckNvYXQgRmFjdG9yXG4gICAgY29uc3QgY2xlYXJjb2F0RmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0RmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRGYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2xlYXJjb2F0RmFjdG9yJywgY2xlYXJjb2F0RmFjdG9yKTtcbiAgICAvLyBDbGVhckNvYXQgVGV4dHVyZVxuICAgIGNvbnN0IGNsZWFyY29hdFRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRUZXh0dXJlO1xuICAgIGlmIChjbGVhcmNvYXRUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuQ2xlYXJDb2F0VGV4dHVyZSA9IHJuVGV4dHVyZXNbY2xlYXJjb2F0VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbY2xlYXJjb2F0VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdjbGVhcmNvYXRUZXh0dXJlJywgcm5DbGVhckNvYXRUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGNsZWFyY29hdFRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdFRleGNvb3JkSW5kZXgnLCBjbGVhcmNvYXRUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIENsZWFyQ29hdCBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgY2xlYXJjb2F0VGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdjbGVhcmNvYXRUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnY2xlYXJjb2F0VGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdjbGVhcmNvYXRUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICAvLyBDbGVhckNvYXQgUm91Z2huZXNzIEZhY3RvclxuICAgIGNvbnN0IGNsZWFyY29hdFJvdWdobmVzc0ZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdFJvdWdobmVzc0ZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdFJvdWdobmVzc0ZhY3RvcicsIGNsZWFyY29hdFJvdWdobmVzc0ZhY3Rvcik7XG4gICAgLy8gQ2xlYXJDb2F0IFJvdWdobmVzcyBUZXh0dXJlXG4gICAgY29uc3QgY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdFJvdWdobmVzc1RleHR1cmU7XG4gICAgaWYgKGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5DbGVhckNvYXRSb3VnaG5lc3NUZXh0dXJlID0gcm5UZXh0dXJlc1tjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmUnLCBybkNsZWFyQ29hdFJvdWdobmVzc1RleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2xlYXJjb2F0Um91Z2huZXNzVGV4Y29vcmRJbmRleCcsIGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gQ2xlYXJDb2F0IFJvdWdobmVzcyBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICAvLyBDbGVhckNvYXQgTm9ybWFsIFRleHR1cmVcbiAgICBjb25zdCBjbGVhcmNvYXROb3JtYWxUZXh0dXJlID0gS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZTtcbiAgICBpZiAoY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkNsZWFyQ29hdE5vcm1hbFRleHR1cmUgPSByblRleHR1cmVzW2NsZWFyY29hdE5vcm1hbFRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2NsZWFyY29hdE5vcm1hbFRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZScsIHJuQ2xlYXJDb2F0Tm9ybWFsVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChjbGVhcmNvYXROb3JtYWxUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdjbGVhcmNvYXROb3JtYWxUZXhjb29yZEluZGV4JywgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBDbGVhckNvYXQgTm9ybWFsIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBjbGVhcmNvYXROb3JtYWxUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2NsZWFyY29hdE5vcm1hbFRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdjbGVhcmNvYXROb3JtYWxUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2NsZWFyY29hdE5vcm1hbFRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX3ZvbHVtZSBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc192b2x1bWUoXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pOiB2b2lkIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc192b2x1bWUgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdm9sdW1lO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc192b2x1bWUpKSB7XG4gICAgY29uc3QgdGhpY2tuZXNzRmFjdG9yID0gS0hSX21hdGVyaWFsc192b2x1bWUudGhpY2tuZXNzRmFjdG9yID8gS0hSX21hdGVyaWFsc192b2x1bWUudGhpY2tuZXNzRmFjdG9yIDogMC4wO1xuICAgIGlmICh0aGlja25lc3NGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd0aGlja25lc3NGYWN0b3InLCB0aGlja25lc3NGYWN0b3IpO1xuICAgIH1cbiAgICBjb25zdCB0aGlja25lc3NUZXh0dXJlID0gS0hSX21hdGVyaWFsc192b2x1bWUudGhpY2tuZXNzVGV4dHVyZTtcbiAgICBpZiAodGhpY2tuZXNzVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRoaWNrbmVzc1RleHR1cmUgPSByblRleHR1cmVzW3RoaWNrbmVzc1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3RoaWNrbmVzc1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcigndGhpY2tuZXNzVGV4dHVyZScsIHJuVGhpY2tuZXNzVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmICh0aGlja25lc3NUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd0aGlja25lc3NUZXhjb29yZEluZGV4JywgdGhpY2tuZXNzVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBUaGlja25lc3MgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHRoaWNrbmVzc1RleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAndGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3RoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAndGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgSU5GID0gMWUyMDtcbiAgICBjb25zdCBhdHRlbnVhdGlvbkRpc3RhbmNlID0gS0hSX21hdGVyaWFsc192b2x1bWUuYXR0ZW51YXRpb25EaXN0YW5jZVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS5hdHRlbnVhdGlvbkRpc3RhbmNlXG4gICAgICA6IElORjtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2F0dGVudWF0aW9uRGlzdGFuY2UnLCBhdHRlbnVhdGlvbkRpc3RhbmNlKTtcbiAgICBjb25zdCBhdHRlbnVhdGlvbkNvbG9yID0gS0hSX21hdGVyaWFsc192b2x1bWUuYXR0ZW51YXRpb25Db2xvclxuICAgICAgPyBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKEtIUl9tYXRlcmlhbHNfdm9sdW1lLmF0dGVudWF0aW9uQ29sb3IpXG4gICAgICA6IFZlY3RvcjMuZnJvbUNvcHkzKDEuMCwgMS4wLCAxLjApO1xuICAgIGlmIChhdHRlbnVhdGlvbkNvbG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYXR0ZW51YXRpb25Db2xvcicsIGF0dGVudWF0aW9uQ29sb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19zaGVlbiBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19zaGVlbihcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX3NoZWVuID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3NoZWVuO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zaGVlbikpIHtcbiAgICBjb25zdCBzaGVlbkNvbG9yRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlbkNvbG9yRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuQ29sb3JGYWN0b3JcbiAgICAgIDogWzAuMCwgMC4wLCAwLjBdO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hlZW5Db2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoc2hlZW5Db2xvckZhY3RvcikpO1xuICAgIGNvbnN0IHNoZWVuQ29sb3JUZXh0dXJlID0gS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlbkNvbG9yVGV4dHVyZTtcbiAgICBpZiAoc2hlZW5Db2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5TaGVlbkNvbG9yVGV4dHVyZSA9IHJuVGV4dHVyZXNbc2hlZW5Db2xvclRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NoZWVuQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NoZWVuQ29sb3JUZXh0dXJlJywgcm5TaGVlbkNvbG9yVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzaGVlbkNvbG9yVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hlZW5Db2xvclRleGNvb3JkSW5kZXgnLCBzaGVlbkNvbG9yVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBTaGVlbiBDb2xvciBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgc2hlZW5Db2xvclRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnc2hlZW5Db2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdzaGVlbkNvbG9yVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdzaGVlbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgc2hlZW5Sb3VnaG5lc3NGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuUm91Z2huZXNzRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuUm91Z2huZXNzRmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoZWVuUm91Z2huZXNzRmFjdG9yJywgc2hlZW5Sb3VnaG5lc3NGYWN0b3IpO1xuICAgIGNvbnN0IHNoZWVuUm91Z2huZXNzVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Sb3VnaG5lc3NUZXh0dXJlO1xuICAgIGlmIChzaGVlblJvdWdobmVzc1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5TaGVlblJvdWdobmVzc1RleHR1cmUgPSByblRleHR1cmVzW3NoZWVuUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NoZWVuUm91Z2huZXNzVGV4dHVyZScsIHJuU2hlZW5Sb3VnaG5lc3NUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNoZWVuUm91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hlZW5Sb3VnaG5lc3NUZXhjb29yZEluZGV4Jywgc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIFNoZWVuIFJvdWdobmVzcyBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3NoZWVuUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3NoZWVuUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdzaGVlblJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfc3BlY3VsYXI7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyKSkge1xuICAgIGNvbnN0IHNwZWN1bGFyRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhckZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhckZhY3RvclxuICAgICAgOiAxLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzcGVjdWxhckZhY3RvcicsIHNwZWN1bGFyRmFjdG9yKTtcbiAgICBjb25zdCBzcGVjdWxhclRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyVGV4dHVyZTtcbiAgICBpZiAoc3BlY3VsYXJUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuU3BlY3VsYXJUZXh0dXJlID0gcm5UZXh0dXJlc1tzcGVjdWxhclRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NwZWN1bGFyVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzcGVjdWxhclRleHR1cmUnLCByblNwZWN1bGFyVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzcGVjdWxhclRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NwZWN1bGFyVGV4Y29vcmRJbmRleCcsIHNwZWN1bGFyVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBTcGVjdWxhciBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgc3BlY3VsYXJUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdzcGVjdWxhclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNwZWN1bGFyQ29sb3JGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyQ29sb3JGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJDb2xvckZhY3RvclxuICAgICAgOiBbMS4wLCAxLjAsIDEuMF07XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzcGVjdWxhckNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhzcGVjdWxhckNvbG9yRmFjdG9yKSk7XG4gICAgY29uc3Qgc3BlY3VsYXJDb2xvclRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyQ29sb3JUZXh0dXJlO1xuICAgIGlmIChzcGVjdWxhckNvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblNwZWN1bGFyQ29sb3JUZXh0dXJlID0gcm5UZXh0dXJlc1tzcGVjdWxhckNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc3BlY3VsYXJDb2xvclRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc3BlY3VsYXJDb2xvclRleHR1cmUnLCByblNwZWN1bGFyQ29sb3JUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNwZWN1bGFyQ29sb3JUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzcGVjdWxhckNvbG9yVGV4Y29vcmRJbmRleCcsIHNwZWN1bGFyQ29sb3JUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIFNwZWN1bGFyIENvbG9yIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBzcGVjdWxhckNvbG9yVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdzcGVjdWxhckNvbG9yVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3NwZWN1bGFyQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3NwZWN1bGFyQ29sb3JUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19pb3IgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2lvcihtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCwgbWF0ZXJpYWw6IE1hdGVyaWFsLCBfZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfaW9yID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2lvcjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaW9yKSkge1xuICAgIGNvbnN0IGlvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaW9yLmlvcikgPyBLSFJfbWF0ZXJpYWxzX2lvci5pb3IgOiAxLjU7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpb3InLCBpb3IpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2U7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlKSkge1xuICAgIGNvbnN0IGlyaWRlc2NlbmNlRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZUZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZUZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZUZhY3RvcicsIGlyaWRlc2NlbmNlRmFjdG9yKTtcbiAgICBjb25zdCBpcmlkZXNjZW5jZVRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGV4dHVyZTtcbiAgICBpZiAoaXJpZGVzY2VuY2VUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuSXJpZGVzY2VuY2VUZXh0dXJlID0gcm5UZXh0dXJlc1tpcmlkZXNjZW5jZVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2lyaWRlc2NlbmNlVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRleHR1cmUnLCBybklyaWRlc2NlbmNlVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChpcmlkZXNjZW5jZVRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGV4Y29vcmRJbmRleCcsIGlyaWRlc2NlbmNlVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBJcmlkZXNjZW5jZSBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgaXJpZGVzY2VuY2VUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGlyaWRlc2NlbmNlSW9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZUlvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZUlvclxuICAgICAgOiAxLjM7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZUlvcicsIGlyaWRlc2NlbmNlSW9yKTtcblxuICAgIGNvbnN0IGlyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bSA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bVxuICAgICAgOiAxMDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bScsIGlyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bSk7XG5cbiAgICBjb25zdCBpcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0gPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bSlcbiAgICAgID8gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW1cbiAgICAgIDogNDAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0nLCBpcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0pO1xuXG4gICAgY29uc3QgaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlID0gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmU7XG4gICAgaWYgKGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybklyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSA9IHJuVGV4dHVyZXNbaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlJywgcm5JcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleGNvb3JkSW5kZXgnLCBpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gSXJpZGVzY2VuY2UgVGhpY2tuZXNzIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfYW5pc290cm9weSBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5KFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfYW5pc290cm9weSA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5O1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5KSkge1xuICAgIGNvbnN0IGFuaXNvdHJvcHlTdHJlbmd0aCA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5U3RyZW5ndGgpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5U3RyZW5ndGhcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYW5pc290cm9weVN0cmVuZ3RoJywgYW5pc290cm9weVN0cmVuZ3RoKTtcbiAgICBjb25zdCBhbmlzb3Ryb3B5Um90YXRpb24gPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkuYW5pc290cm9weVJvdGF0aW9uKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkuYW5pc290cm9weVJvdGF0aW9uXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoXG4gICAgICAnYW5pc290cm9weVJvdGF0aW9uJyxcbiAgICAgIFZlY3RvcjIuZnJvbUNvcHkyKE1hdGguY29zKGFuaXNvdHJvcHlSb3RhdGlvbiksIE1hdGguc2luKGFuaXNvdHJvcHlSb3RhdGlvbikpXG4gICAgKTtcblxuICAgIGNvbnN0IGFuaXNvdHJvcHlUZXh0dXJlID0gS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5LmFuaXNvdHJvcHlUZXh0dXJlO1xuICAgIGlmIChhbmlzb3Ryb3B5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkFuaXNvdHJvcHlUZXh0dXJlID0gcm5UZXh0dXJlc1thbmlzb3Ryb3B5VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbYW5pc290cm9weVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignYW5pc290cm9weVRleHR1cmUnLCBybkFuaXNvdHJvcHlUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGFuaXNvdHJvcHlUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhbmlzb3Ryb3B5VGV4Y29vcmRJbmRleCcsIGFuaXNvdHJvcHlUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIEFuaXNvdHJvcHkgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGFuaXNvdHJvcHlUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2FuaXNvdHJvcHlUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnYW5pc290cm9weVRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnYW5pc290cm9weVRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aChtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCwgbWF0ZXJpYWw6IE1hdGVyaWFsLCBfZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGggPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGg7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoKSkge1xuICAgIGNvbnN0IGVtaXNzaXZlU3RyZW5ndGggPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoLmVtaXNzaXZlU3RyZW5ndGgpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGguZW1pc3NpdmVTdHJlbmd0aFxuICAgICAgOiAxLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdlbWlzc2l2ZVN0cmVuZ3RoJywgZW1pc3NpdmVTdHJlbmd0aCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbiBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbihtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCwgbWF0ZXJpYWw6IE1hdGVyaWFsLCBfZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbiA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uKSkge1xuICAgIGNvbnN0IGRpc3BlcnNpb24gPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24uZGlzcGVyc2lvbikgPyBLSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24uZGlzcGVyc2lvbiA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2Rpc3BlcnNpb24nLCBkaXNwZXJzaW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbiBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbihcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbikpIHtcbiAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3RvcicsIGRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3IpO1xuICAgIGNvbnN0IGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlID0gS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZTtcbiAgICBpZiAoZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5EaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSA9IHJuVGV4dHVyZXNbZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlJywgcm5EaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvblRleGNvb3JkSW5kZXgnLCBkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBEaWZmdXNlIFRyYW5zbWlzc2lvbiBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yXG4gICAgICA6IFsxLjAsIDEuMCwgMS4wXTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yKSk7XG4gICAgY29uc3QgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZTtcbiAgICBpZiAoZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUgPSByblRleHR1cmVzW2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZScsIHJuRGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXhjb29yZEluZGV4JywgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBEaWZmdXNlIFRyYW5zbWlzc2lvbiBDb2xvciBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBO0FBQUEsRUFJRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsT0FDSztBQXNCUCxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLCtCQUErQjtBQUN4QyxTQUFTLDJCQUEyQjtBQUVwQyxTQUFTLDBCQUEwQjtBQUNu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O0FBQzNFLFFBQUksbUNBQW1DLE1BQU07QUFDM0MsWUFBTSxvQ0FBb0MsV0FBVyxnQ0FBZ0MsUUFBUyxNQUFPO0FBQ3JHLFlBQU0sWUFBWSxXQUFXLGdDQUFnQyxRQUFTLE9BQVE7QUFDOUUsZUFBUyxvQkFBb0IsbUNBQW1DLG1DQUFtQyxTQUFTO0FBQzVHLFVBQUksZ0NBQWdDLFlBQVksTUFBTTtBQUNwRCxpQkFBUyxhQUFhLHlDQUF5QyxnQ0FBZ0MsUUFBUTtBQUFBLE1BQ3pHO0FBRUEscUJBQWU7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2dlbmVyYXRlR3JvdXBFbnRpdHkiLCAiX19nZW5lcmF0ZU1lc2hFbnRpdHkiLCAiX19nZW5lcmF0ZUNhbWVyYUVudGl0eSIsICJfX2dlbmVyYXRlTGlnaHRFbnRpdHkiLCAiX19zZXR1cE1hdGVyaWFscyIsICJfX3NldHVwTWF0ZXJpYWwiLCAiX19wcmVsb2FkTVRvb25NYXRlcmlhbFN1cHBvcnQiLCAiX2EiLCAiX19wcmVsb2FkU2hlZW5MdXRUZXh0dXJlIiwgIl9fc2V0dXBUZXh0dXJlcyIsICJfX2NyZWF0ZVNhbXBsZXJzIiwgIl9fY3JlYXRlUm5CdWZmZXIiLCAiX19zZXR1cE9iamVjdHMiLCAiX19zZXR1cE5vZGVWaXNpYmlsaXR5IiwgIl9fYXBwbHlOb2RlVmlzaWJpbGl0eSIsICJfX2dldE5vZGVWaXNpYmlsaXR5IiwgIl9fc2V0UG9pbnRlckFuaW1hdGlvbiIsICJfX3NldE5vcm1hbEFuaW1hdGlvbiIsICJfX3NldFBvaW50ZXJBbmltYXRpb25NYXRlcmlhbHMiLCAiX19zZXRQb2ludGVyQW5pbWF0aW9uTm9kZXMiLCAiX19zZXRQb2ludGVyQW5pbWF0aW9uTGlnaHRzIiwgIl9fc2V0UG9pbnRlckFuaW1hdGlvbkNhbWVyYXMiLCAiX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yIiwgIl9fZ2V0Q29tbW9uQW5jZXN0b3JPZkpvaW50cyIsICJfX2dlbmVyYXRlTm9ybWFsc0lmTWlzc2luZyIsICJfX3NldHVwTWVzaCIsICJfX3NldHVwQ2FtZXJhIiwgIl9fY29uZmlndXJlTGlnaHRDb21wb25lbnQiLCAiX19zZXR1cExpZ2h0IiwgIl9faXNNb3JwaGluZyIsICJfX2RlY29kZURyYWNvIiwgIl9fZ2V0Um5CdWZmZXJWaWV3IiwgIl9fZ2V0Um5BY2Nlc3NvciIsICJpIiwgIl9fY29weVJuQWNjZXNzb3JBbmRCdWZmZXJWaWV3Rm9yTW9ycGhEYXRhIiwgIl9fc2V0VlJNMU1hdGVyaWFsIiwgIl9faXNMaWdodGluZyIsICJfX21ha2VPdXRwdXRTcmdiIiwgIl9fc2V0VlJNMHhNYXRlcmlhbCIsICJfX2dlbmVyYXRlQXBwcm9wcmlhdGVNYXRlcmlhbCIsICJybkxvYWRlck9wdGlvbnMiLCAiX19pc0ltcG9ydFZSTTB4IiwgIm1hdGVyaWFsIiwgIl9fdXNlVGFuZ2VudEF0dHJpYnV0ZSIsICJfX3VzZU5vcm1hbFRleHR1cmUiLCAiX19nZXRWYWxpZFJheW1hcmNoaW5nVGV4dHVyZUFzc2lnbm1lbnRzIiwgIl9fY3JlYXRlUmF5bWFyY2hpbmdUZXh0dXJlIiwgIl9fbmVlZFJlc2l6ZVRvUG93ZXJPZlR3b09uV2ViR2wxIiwgIl9fc2l6ZUlzUG93ZXJPZlR3byIsICJfX25lZWRQYXJhbWV0ZXJJbml0aWFsaXphdGlvbiIsICJfX3Jld3JhcFdpdGhUeXBlZEFycmF5IiwgIl9fbm9ybWFsaXplVHlwZWRBcnJheVRvRmxvYXQzMkFycmF5IiwgIl9fYWRkT2Zmc2V0VG9JbmRpY2VzIiwgInJuQnVmZmVyVmlldyIsICJfX3Rha2VSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yRm9yRHJhY28iLCAiX19nZXRHZW9tZXRyeUZyb21EcmFjb0J1ZmZlciIsICJfX2dldEluZGljZXNGcm9tRHJhY28iLCAiX19jcmVhdGVCdWZmZXJGb3JEZWNvbXByZXNzZWREYXRhIl0KfQo=
