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
  static Xp(engine, gltfModel) {
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
  static iq(engine, gltfModel) {
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
  static jq(engine, gltfModel) {
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
  static kq(engine, gltfModel) {
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
  static $p(engine, gltfModel, rnTextures, rnSamplers) {
    const rnMaterials = [];
    if (gltfModel.materials != null) {
      for (const material of gltfModel.materials) {
        const rnMaterial = this.pk(engine, gltfModel, rnTextures, rnSamplers, material);
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
  static async lq(gltfModel) {
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
   * Sets up textures from the glTF model asynchronously
   * @param gltfModel - The glTF model data
   * @returns Promise resolving to array of Rhodonite textures
   */
  static async mq(engine, gltfModel) {
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
  static nq(engine, gltfModel) {
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
    const rnBuffers = this.aq(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = [];
    const rnSamplers = [];
    const rnMaterials = this.$p(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.bq(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.Xp(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.cq(gltfModel, rnEntities);
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
    const rnBuffers = this.aq(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = await this.mq(engine, gltfModel);
    const rnSamplers = this.nq(engine, gltfModel);
    await this.lq(gltfModel);
    await RhodoniteImportExtension.preloadNodeBasedMaterialSupport(gltfModel);
    await this.preloadRaymarchingSupport(gltfModel);
    const rnMaterials = this.$p(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.bq(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.Xp(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    await preloadKhrPhysicsSupport(gltfModel);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.cq(gltfModel, rnEntities);
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
  static aq(gltfModel) {
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
  static cq(gltfModel, rnEntities) {
    var _a, _b, _c;
    const visitedNodeIndices = /* @__PURE__ */ new Set();
    const sceneRootNodeIndices = (_c = (_b = (_a = gltfModel.scenes) == null ? void 0 : _a[0]) == null ? void 0 : _b.nodes) != null ? _c : [];
    for (const nodeIndex of sceneRootNodeIndices) {
      this.Yp(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
    }
    for (const nodeIndexString in gltfModel.nodes) {
      const nodeIndex = Number.parseInt(nodeIndexString, 10);
      if (!visitedNodeIndices.has(nodeIndex)) {
        this.Yp(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
      }
    }
  }
  static Yp(gltfModel, rnEntities, nodeIndex, parentVisible, visitedNodeIndices) {
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
    const localVisible = this.oq(node);
    entity.tryToSetTag({ tag: TagKhrNodeVisibilityVisible, value: localVisible });
    if (Is.exist((_a = node.extensions) == null ? void 0 : _a.KHR_node_visibility)) {
      entity.tryToSetTag({ tag: TagKhrNodeVisibilityEnabled, value: true });
    }
    entity.getSceneGraph().isVisible = parentVisible && localVisible;
    for (const childNodeIndex of (_b = node.children) != null ? _b : []) {
      this.Yp(
        gltfModel,
        rnEntities,
        childNodeIndex,
        parentVisible && localVisible,
        visitedNodeIndices
      );
    }
  }
  static oq(node) {
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
            _ModelConverter.pq(
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
            _ModelConverter.qq(
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
  static pq(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType, rnMaterials, gltfModel) {
    const pointer = channel.target.extensions.KHR_animation_pointer.pointer;
    const matchNodes = pointer.match(/^\/nodes\/([0-9]+)\//);
    const matchMaterials = pointer.match(/^\/materials\/([0-9]+)\//);
    const matchLights = pointer.match(/^\/extensions\/KHR_lights_punctual\/lights\/([0-9]+)\//);
    const matchCameras = pointer.match(/^\/cameras\/([0-9]+)\//);
    if (matchMaterials) {
      _ModelConverter.rq(
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
      _ModelConverter.sq(
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
      _ModelConverter.tq(
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
      _ModelConverter.uq(
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
  static uq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
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
  static tq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
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
  static sq(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
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
  static rq(match, rnMaterials, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
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
  static qq(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType) {
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
        const rnAccessorOfInverseBindMat = Is.exist(inverseBindMatAccessor) ? this.Up(engine, inverseBindMatAccessor, rnBuffers) : void 0;
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
        const skeletonRoot = Is.exist(node.skinObject.skeleton) ? rnEntities[node.skinObject.skeleton].getSceneGraph() : this.vq(joints);
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
  static vq(joints) {
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
  static wq(engine, primitive, indicesAccessor) {
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
  static bq(engine, gltfModel, rnBuffers, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e, _f, _g;
    const rnEntities = [];
    const rnEntitiesByNames = /* @__PURE__ */ new Map();
    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[Number.parseInt(node_i, 10)];
      let entity;
      if (node.mesh != null) {
        const meshIdx = node.mesh;
        const meshEntity = this.xq(
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
        const cameraEntity = this.yq(engine, node.cameraObject, gltfModel);
        let entityWithOptionalLight = cameraEntity;
        if (((_b = node.extensions) == null ? void 0 : _b.KHR_lights_punctual) != null) {
          const lightEntity = engine.entityRepository.addComponentToEntity(
            LightComponent,
            cameraEntity
          );
          this.dq(lightEntity.getLight(), node.extensions.KHR_lights_punctual.light);
          lightEntity.getCamera().isSyncToLight = true;
          entityWithOptionalLight = lightEntity;
        }
        if (node.name) {
          entityWithOptionalLight.tryToSetUniqueName(node.name, true);
        }
        entity = entityWithOptionalLight;
      } else if ((_c = node.extensions) == null ? void 0 : _c.KHR_lights_punctual) {
        const lightEntity = this.zq(engine, node.extensions.KHR_lights_punctual.light, gltfModel);
        entity = lightEntity;
      } else {
        const group = this.Xp(engine, gltfModel);
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
      if (this.Aq(node, gltfModel)) {
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
  static Aq(node, gltfModel) {
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
  static zq(engine, light, gltfModel) {
    const lightEntity = this.kq(engine, gltfModel);
    const lightComponent = lightEntity.getComponent(LightComponent);
    this.dq(lightComponent, light);
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
  static dq(lightComponent, light) {
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
  static yq(engine, camera, gltfModel) {
    const cameraEntity = this.jq(engine, gltfModel);
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
  static xq(engine, mesh, meshIndex, rnBuffers, gltfModel, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e;
    const meshEntity = this.iq(engine, gltfModel);
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
        const rnMaterial = primitive.material != null ? rnMaterials[primitive.material] : this.pk(engine, gltfModel, rnTextures, rnSamplers);
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
          indicesRnAccessor = this.qp(engine, primitive, rnBuffers, gltfModel, map);
          if (Is.not.exist(indicesRnAccessor)) {
            break;
          }
        } else {
          if (Is.exist(primitive.indices)) {
            indicesRnAccessor = this.Up(engine, primitive.indicesObject, rnBuffers);
          }
          const rnBufferViewMap = /* @__PURE__ */ new Map();
          for (const attributeName in primitive.attributesObjects) {
            const rnm2attribute = primitive.attributesObjects[attributeName];
            const rnBuffer = rnBuffers[rnm2attribute.bufferViewObject.buffer];
            let rnBufferView;
            if (Is.exist(rnm2attribute.bufferView)) {
              rnBufferView = rnBufferViewMap.get(rnm2attribute.bufferView);
              if (Is.not.exist(rnBufferView)) {
                rnBufferView = this.Vp(rnm2attribute.bufferViewObject, rnBuffer);
                rnBufferViewMap.set(rnm2attribute.bufferView, rnBufferView);
              }
            } else {
              rnBufferView = rnBuffer.takeBufferView({
                byteLengthToNeed: 0,
                byteStride: 0
              }).unwrapForce();
            }
            const attributeRnAccessor = this.Wp(engine, rnm2attribute, rnBufferView);
            const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
              VertexAttribute.fromString(attributeName)
            );
            map.set(joinedString, attributeRnAccessor);
          }
        }
        rnPrimitive.setData(map, rnPrimitiveMode, rnMaterial, indicesRnAccessor);
        this.wq(engine, rnPrimitive, indicesRnAccessor);
        if (primitive.targets != null) {
          const targets = [];
          for (let i2 = 0; i2 < primitive.targetsObjects.length; i2++) {
            const target = primitive.targetsObjects[i2];
            const targetMap = /* @__PURE__ */ new Map();
            for (const attributeName in target) {
              const attributeAccessor = target[attributeName];
              const attributeRnAccessor = this.Up(engine, attributeAccessor, rnBuffers);
              const attributeRnAccessorInGPUVertexData = this.Bq(
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
  static Cq(engine, gltfModel, materialJson, rnLoaderOptions) {
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
      const isLighting = this.Zp(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this._p(gltfModel);
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
  static Dq(engine, gltfModel, materialJson, rnLoaderOptions) {
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
      const isLighting = this.Zp(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this._p(gltfModel);
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
  static Eq(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
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
      if (rnLoaderOptions2.Ip) {
        const material2 = this.Dq(engine, gltfModel, materialJson, rnLoaderOptions2);
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
    const isLighting = this.Zp(gltfModel, materialJson);
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
        const material2 = this.Cq(engine, gltfModel, materialJson, rnLoaderOptions2);
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
      const makeOutputSrgb = this._p(gltfModel);
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
  static Zp(gltfModel, materialJson) {
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
  static Hq(gltfModel, primitive) {
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
  static Iq(gltfModel) {
    var _a, _b, _c, _d, _e, _f;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    if ((argument == null ? void 0 : argument.useNormalTexture) === false) {
      return false;
    }
    return ((_f = (_e = (_d = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _d.extras) == null ? void 0 : _e.rnLoaderOptions) == null ? void 0 : _f.tangentCalculationMode) !== 0;
  }
  static _p(gltfModel) {
    var _a, _b, _c;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    return argument == null ? void 0 : argument.makeOutputSrgb;
  }
  static pk(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
    var _a;
    const material = this.Eq(
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
      if (material.alphaMode === AlphaMode.Mask && !((_e = (_d = gltfModel.asset.extras) == null ? void 0 : _d.rnLoaderOptions) == null ? void 0 : _e.Ip)) {
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
    return this.eq(gltfModel, extension == null ? void 0 : extension.textures);
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
      for (const assignment of this.eq(gltfModel, extension == null ? void 0 : extension.textures)) {
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
  static eq(gltfModel, textures) {
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
      const created = await this.fq(engine, gltfModel, textureIndex, samplerIndex);
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
      const created = await this.fq(engine, gltfModel, textureIndex, samplerIndex);
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
  static async fq(engine, gltfModel, textureIndex, samplerIndex) {
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
  static Jq(textureOption) {
    if (textureOption.wrapS !== TextureParameter.ClampToEdge || textureOption.wrapT !== TextureParameter.ClampToEdge || textureOption.minFilter !== TextureParameter.Linear && textureOption.minFilter !== TextureParameter.Nearest) {
      return true;
    }
    return false;
  }
  static Kq(image) {
    const width = image.width;
    const height = image.height;
    if ((width & width - 1) === 0 && (height & height - 1) === 0) {
      return true;
    }
    return false;
  }
  static Lq(materialJson, _materialTypeName) {
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
  static Tp(typedArrayClass, uint8Array, byteOffset, length) {
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
      const rnBufferView = this.Vp(bufferView, rnBuffer);
      const rnAccessor = this.Wp(engine, accessor, rnBufferView);
      uint8Array = rnAccessor.getUint8Array();
      byteOffsetFromBuffer = 0;
    }
    let float32Array = new Float32Array();
    const numberArray = [];
    if (_ModelConverter._isSystemLittleEndian()) {
      let typedDataArray = new Float32Array();
      if (dataViewMethod === "getFloat32") {
        typedDataArray = this.Tp(
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
        typedDataArray = this.Tp(
          Int16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint16") {
        typedDataArray = this.Tp(
          Uint16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getInt32") {
        typedDataArray = this.Tp(
          Int32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint32") {
        typedDataArray = this.Tp(
          Uint32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      }
      float32Array = this.gq(dataViewMethod, typedDataArray);
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
      float32Array = this.gq(dataViewMethod, numberArray);
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
  static gq(dataViewMethod, numberArray) {
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
  static Mq(meshComponent) {
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
  static Wp(engine, accessor, rnBufferView) {
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
  static Up(engine, accessor, rnBuffers) {
    const gltfBufferView = accessor.bufferViewObject;
    let rnBufferView;
    if (gltfBufferView != null) {
      const rnBuffer = rnBuffers[gltfBufferView.buffer];
      rnBufferView = this.Vp(gltfBufferView, rnBuffer);
    }
    const rnAccessor = this.Wp(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static Bq(engine, srcRnAccessor) {
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
  static hq(engine, accessor, compositionNum, rnBuffer) {
    const rnBufferView = rnBuffer.takeBufferView({
      byteLengthToNeed: accessor.count * compositionNum * 4,
      byteStride: 0
    }).unwrapForce();
    const rnAccessor = this.Wp(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static Vp(rnm2bufferView, rnBuffer) {
    var _a, _b;
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: rnm2bufferView.byteLength,
      byteStride: (_a = rnm2bufferView.byteStride) != null ? _a : 0,
      byteOffset: (_b = rnm2bufferView.byteOffset) != null ? _b : 0
    }).unwrapForce();
    return rnBufferView;
  }
  static rp(draco, decoder, arrayBuffer) {
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
  static Fq(draco, decoder, dracoGeometry, triangleStripDrawMode) {
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
  static qp(engine, primitive, rnBuffers, gltfModel, map) {
    var _a, _b;
    const bufferView = gltfModel.bufferViews[(_a = primitive.extensions) == null ? void 0 : _a.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.Vp(bufferView, rnBuffers[bufferView.buffer]);
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array()).buffer;
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.rp(draco, decoder, arraybufferOfBufferView);
    if (dracoGeometry == null) {
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }
    const numPoints = dracoGeometry.num_points();
    const rnBufferForDraco = this.Gq(primitive, numPoints);
    const primitiveMode = PrimitiveMode.from(primitive.mode);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }
    const indices = this.Fq(draco, decoder, dracoGeometry, isTriangleStrip);
    const indicesRnAccessor = this.hq(
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
        attributeRnAccessor = this.Up(engine, attributeGltf2Accessor, rnBuffers);
      } else {
        const compositionNum = CompositionType.fromString(attributeGltf2Accessor.type).getNumberOfComponents();
        attributeRnAccessor = this.hq(
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
  static Gq(primitive, numPoints) {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvTW9kZWxDb252ZXJ0ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQW5pbWF0aW9uUGF0aE5hbWUsIEFuaW1hdGlvblNhbXBsZXIsIEFuaW1hdGlvblRyYWNrTmFtZSB9IGZyb20gJy4uLy4uL3R5cGVzL0FuaW1hdGlvblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQXJyYXkzLCBCeXRlLCBDb3VudCwgSW5kZXgsIFNpemUsIFR5cGVkQXJyYXksIFZlY3RvckNvbXBvbmVudE4gfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQge1xuICB0eXBlIEdsdGZMb2FkT3B0aW9uLFxuICB0eXBlIEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQsXG4gIHR5cGUgS0hSX25vZGVfdmlzaWJpbGl0eSxcbiAgVGFnR2x0ZjJOb2RlSW5kZXgsXG4gIFRhZ0tock5vZGVWaXNpYmlsaXR5RW5hYmxlZCxcbiAgVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlLFxufSBmcm9tICcuLi8uLi90eXBlcy9nbFRGMic7XG5pbXBvcnQgdHlwZSB7IE5vZGVKU09OIH0gZnJvbSAnLi4vLi4vdHlwZXMvTm9kZUpTT04nO1xuaW1wb3J0IHR5cGUge1xuICBSbk0yLFxuICBSbk0yQWNjZXNzb3IsXG4gIFJuTTJBbmltYXRpb24sXG4gIFJuTTJBbmltYXRpb25DaGFubmVsLFxuICBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgUm5NMkJ1ZmZlclZpZXcsXG4gIFJuTTJDYW1lcmEsXG4gIFJuTTJJbWFnZSxcbiAgUm5NMk1hdGVyaWFsLFxuICBSbk0yTWVzaCxcbiAgUm5NMk5vZGUsXG4gIFJuTTJQYnJNZXRhbGxpY1JvdWdobmVzcyxcbiAgUm5NMlByaW1pdGl2ZSxcbiAgUm5NMlNwYXJzZUluZGljZXMsXG4gIFJuTTJUZXh0dXJlSW5mbyxcbiAgUm5NMlRleHR1cmVTYW1wbGVyLFxufSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB0eXBlIHsgVnJtMHhNYXRlcmlhbFByb3BlcnR5IH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNMHgnO1xuaW1wb3J0IHR5cGUgeyBWcm0xX01hdGVyaWFsIH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNQ19tYXRlcmlhbHNfbXRvb24nO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb25TdGF0ZS9BbmltYXRpb25TdGF0ZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJQmxlbmRTaGFwZUVudGl0eU1ldGhvZHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0JsZW5kU2hhcGUvSUJsZW5kU2hhcGVFbnRpdHknO1xuaW1wb3J0IHsgY3JlYXRlQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmEvY3JlYXRlQ2FtZXJhRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUxpZ2h0RW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9MaWdodC9jcmVhdGVMaWdodEVudGl0eSc7XG5pbXBvcnQgeyBMaWdodENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTGlnaHQvTGlnaHRDb21wb25lbnQnO1xuaW1wb3J0IHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IGNyZWF0ZU1lc2hFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9jcmVhdGVNZXNoRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUdyb3VwRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9TY2VuZUdyYXBoL2NyZWF0ZUdyb3VwRW50aXR5JztcbmltcG9ydCB0eXBlIHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFNrZWxldGFsQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudCc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQW5pbWF0aW9uSW50ZXJwb2xhdGlvbiB9IGZyb20gJy4uL2RlZmluaXRpb25zL0FuaW1hdGlvbkludGVycG9sYXRpb24nO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENhbWVyYVR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9DYW1lcmFUeXBlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBMaWdodFR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9MaWdodFR5cGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgU2RmU2hhcGVUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvU2RmU2hhcGVUeXBlJztcbmltcG9ydCB0eXBlIHsgU2hhZGVyU2VtYW50aWNzTmFtZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgeyBTaGFkaW5nTW9kZWwgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9TaGFkaW5nTW9kZWwnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uL2RlZmluaXRpb25zL1RleHR1cmVQYXJhbWV0ZXInO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlLCB0eXBlIFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZyB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSAnLi4vZ2VvbWV0cnkvTWVzaCc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUge1xuICBJQW5pbWF0aW9uRW50aXR5LFxuICBJQ2FtZXJhRW50aXR5LFxuICBJTGlnaHRFbnRpdHksXG4gIElNZXNoRW50aXR5LFxuICBJUmF5bWFyY2hpbmdFbnRpdHksXG4gIElTY2VuZUdyYXBoRW50aXR5LFxufSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBhdHRhY2hMaWdodFNoYWRvd0NhbWVyYSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwgfSBmcm9tICcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsJztcbmltcG9ydCB7IGNyZWF0ZVBiclViZXJNYXRlcmlhbCB9IGZyb20gJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZVBiclViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHsgQW5pbWF0ZWRRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vbWF0aC9BbmltYXRlZFF1YXRlcm5pb24nO1xuaW1wb3J0IHsgQW5pbWF0ZWRTY2FsYXIgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkU2NhbGFyJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yMiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3IyJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3IzJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3I0JztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yTiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRWZWN0b3JOJztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGVkVmFsdWUgfSBmcm9tICcuLi9tYXRoL0lBbmltYXRlZFZhbHVlJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi4vbWF0aC9NYXRoVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjIgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3IyJztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gJy4uL21hdGgvVmVjdG9yMic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICcuLi9tZW1vcnkvQnVmZmVyJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyVmlldyB9IGZyb20gJy4uL21lbW9yeS9CdWZmZXJWaWV3JztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBSZW5kZXJQYXNzIH0gZnJvbSAnLi4vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgU2FtcGxlciB9IGZyb20gJy4uL3RleHR1cmVzL1NhbXBsZXInO1xuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gJy4uL3RleHR1cmVzL1RleHR1cmUnO1xuaW1wb3J0IHsgZGV0ZWN0Qm9uZURhdGFUeXBlRm9yU2tpbiB9IGZyb20gJy4vQm9uZURhdGFUeXBlRGV0ZWN0b3InO1xuaW1wb3J0IHsgcHJlbG9hZEtoclBoeXNpY3NTdXBwb3J0LCBzZXR1cEtoclN0YXRpY0NvbGxpZGVycyB9IGZyb20gJy4vS2hyUGh5c2ljc0ltcG9ydGVyJztcbmltcG9ydCB7IFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbiB9IGZyb20gJy4vUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uJztcblxuZGVjbGFyZSBsZXQgRHJhY29EZWNvZGVyTW9kdWxlOiBhbnk7XG5cbnR5cGUgQ3JlYXRlTVRvb24weE1hdGVyaWFsID0gdHlwZW9mIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24weE1hdGVyaWFsJykuY3JlYXRlTVRvb24weE1hdGVyaWFsO1xudHlwZSBDcmVhdGVNVG9vbjFNYXRlcmlhbCA9IHR5cGVvZiBpbXBvcnQoJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZU1Ub29uMU1hdGVyaWFsJykuY3JlYXRlTVRvb24xTWF0ZXJpYWw7XG5cbi8qKlxuICogTVRvb24gbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIGFyZSBsb2FkZWQgb24gZGVtYW5kLiBUaGV5IHB1bGwgaW4gdGhlIE1Ub29uIHNoYWRlcnMgYW5kIG1hdGVyaWFsIGNvbnRlbnRzLCB3aGljaFxuICogYSBwbGFpbiBnbFRGIG1vZGVsIG5ldmVyIHVzZXMuIFRoZSBpbXBvcnRlciBwcmVsb2FkcyB0aGVtIGJlZm9yZSBnZW5lcmF0aW5nIG1hdGVyaWFscyB3aGVuIHRoZSBtb2RlbCBhY3R1YWxseVxuICogY29udGFpbnMgVlJNIG1hdGVyaWFscywgc28gdGhlIHN5bmNocm9ub3VzIG1hdGVyaWFsIGZ1bmN0aW9ucyBjYW4gY2FsbCB0aGVtIHRocm91Z2ggdGhlc2UgdmFyaWFibGVzLlxuICovXG5sZXQgY3JlYXRlTVRvb24weE1hdGVyaWFsSW1wbDogQ3JlYXRlTVRvb24weE1hdGVyaWFsIHwgdW5kZWZpbmVkO1xubGV0IGNyZWF0ZU1Ub29uMU1hdGVyaWFsSW1wbDogQ3JlYXRlTVRvb24xTWF0ZXJpYWwgfCB1bmRlZmluZWQ7XG5cbnR5cGUgUmF5bWFyY2hpbmdDb21wb25lbnRDbGFzcyA9IHR5cGVvZiBpbXBvcnQoJy4uL2NvbXBvbmVudHMvUmF5bWFyY2hpbmcvUmF5bWFyY2hpbmdDb21wb25lbnQnKS5SYXltYXJjaGluZ0NvbXBvbmVudDtcblxuLyoqXG4gKiBUaGUgcmF5bWFyY2hpbmcgY29tcG9uZW50IChhbmQgaXRzIFNERiBldmFsdWF0b3IpIGlzIGxvYWRlZCBvbmx5IGZvciBtb2RlbHMgdGhhdCB1c2UgdGhlIFJIT0RPTklURV9yYXltYXJjaGluZ1xuICogZXh0ZW5zaW9uLiBBIHBsYWluIGdsVEYgYXBwbGljYXRpb24gbmV2ZXIgcGF5cyBmb3IgaXQuXG4gKi9cbmxldCByYXltYXJjaGluZ0NvbXBvbmVudENsYXNzOiBSYXltYXJjaGluZ0NvbXBvbmVudENsYXNzIHwgdW5kZWZpbmVkO1xubGV0IHJheW1hcmNoaW5nQ29tcG9uZW50UHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIGNvbnZlcnRlciBjbGFzcyBmcm9tIGdsVEYyIG1vZGVsIHRvIFJob2Rvbml0ZSBOYXRpdmUgZGF0YVxuICovXG5leHBvcnQgY2xhc3MgTW9kZWxDb252ZXJ0ZXIge1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgZ3JvdXAgZW50aXR5IGZvciB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBBIHNjZW5lIGdyYXBoIGVudGl0eSBjb25maWd1cmVkIGFzIGEgZ3JvdXBcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVHcm91cEVudGl0eShlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogSVNjZW5lR3JhcGhFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgc291cmNlIHR5cGUgYW5kIHZlcnNpb24gdGFncyB0byBhbiBlbnRpdHkgYmFzZWQgb24gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGVudGl0eSAtIFRoZSBlbnRpdHkgdG8gYWRkIHRhZ3MgdG9cbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGNvbnRhaW5pbmcgYXNzZXQgaW5mb3JtYXRpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFkZFRhZ3MoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgZW50aXR5LnRyeVRvU2V0VGFnKHtcbiAgICAgIHRhZzogJ1NvdXJjZVR5cGUnLFxuICAgICAgdmFsdWU6IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLmZpbGVUeXBlISxcbiAgICB9KTtcbiAgICBlbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAnU291cmNlVHlwZVZlcnNpb24nLFxuICAgICAgdmFsdWU6IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnZlcnNpb24hLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIG1lc2ggZW50aXR5IGZvciB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcmV0dXJucyBBIG1lc2ggZW50aXR5IHdpdGggYXBwcm9wcmlhdGUgdGFnc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZU1lc2hFbnRpdHkoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IElNZXNoRW50aXR5IHtcbiAgICBjb25zdCBlbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIGNhbWVyYSBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgY2FtZXJhIGVudGl0eSB3aXRoIGFwcHJvcHJpYXRlIHRhZ3NcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVDYW1lcmFFbnRpdHkoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IElDYW1lcmFFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIHRydWUpO1xuICAgIHRoaXMuYWRkVGFncyhlbnRpdHksIGdsdGZNb2RlbCk7XG4gICAgcmV0dXJuIGVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBsaWdodCBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgbGlnaHQgZW50aXR5IHdpdGggYXBwcm9wcmlhdGUgdGFnc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZUxpZ2h0RW50aXR5KGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpOiBJTGlnaHRFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZUxpZ2h0RW50aXR5KGVuZ2luZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgbWF0ZXJpYWxzIGZyb20gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAgICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAgICogQHJldHVybnMgQXJyYXkgb2YgY29uZmlndXJlZCBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTWF0ZXJpYWxzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIsIHJuVGV4dHVyZXM6IFRleHR1cmVbXSwgcm5TYW1wbGVyczogU2FtcGxlcltdKSB7XG4gICAgY29uc3Qgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10gPSBbXTtcbiAgICBpZiAoZ2x0Zk1vZGVsLm1hdGVyaWFscyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IG1hdGVyaWFsIG9mIGdsdGZNb2RlbC5tYXRlcmlhbHMpIHtcbiAgICAgICAgY29uc3Qgcm5NYXRlcmlhbCA9IHRoaXMuX19zZXR1cE1hdGVyaWFsKGVuZ2luZSwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzLCBtYXRlcmlhbCk7XG4gICAgICAgIHJuTWF0ZXJpYWxzLnB1c2gocm5NYXRlcmlhbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBybk1hdGVyaWFscztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgTVRvb24gbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIG9ubHkgd2hlbiB0aGUgbW9kZWwgYWN0dWFsbHkgdXNlcyBWUk0gbWF0ZXJpYWxzLlxuICAgKiBUaGlzIGtlZXBzIHRoZSBNVG9vbiBtYXRlcmlhbCBjb250ZW50cyBhbmQgc2hhZGVycyBvdXQgb2YgcGxhaW4gZ2xURiBhcHBsaWNhdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhIHRvIGluc3BlY3RcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX3ByZWxvYWRNVG9vbk1hdGVyaWFsU3VwcG9ydChnbHRmTW9kZWw6IFJuTTIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtYXRlcmlhbHMgPSBnbHRmTW9kZWwubWF0ZXJpYWxzID8/IFtdO1xuICAgIGNvbnN0IG5lZWRzTVRvb24xID0gbWF0ZXJpYWxzLnNvbWUobWF0ZXJpYWwgPT4gbWF0ZXJpYWwuZXh0ZW5zaW9ucz8uVlJNQ19tYXRlcmlhbHNfbXRvb24gIT0gbnVsbCk7XG4gICAgY29uc3QgbmVlZHNNVG9vbjB4ID0gbWF0ZXJpYWxzLnNvbWUobWF0ZXJpYWwgPT4ge1xuICAgICAgY29uc3QgbWF0ZXJpYWxQcm9wZXJ0aWVzID0gbWF0ZXJpYWwuZXh0cmFzPy52cm0weE1hdGVyaWFsUHJvcGVydHkgYXMgVnJtMHhNYXRlcmlhbFByb3BlcnR5IHwgdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIG1hdGVyaWFsUHJvcGVydGllcz8uc2hhZGVyID09PSAnVlJNL01Ub29uJztcbiAgICB9KTtcblxuICAgIGNvbnN0IGxvYWRzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcbiAgICBpZiAobmVlZHNNVG9vbjEgJiYgY3JlYXRlTVRvb24xTWF0ZXJpYWxJbXBsID09IG51bGwpIHtcbiAgICAgIGxvYWRzLnB1c2goXG4gICAgICAgIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24xTWF0ZXJpYWwnKS50aGVuKG1vZHVsZSA9PiB7XG4gICAgICAgICAgY3JlYXRlTVRvb24xTWF0ZXJpYWxJbXBsID0gbW9kdWxlLmNyZWF0ZU1Ub29uMU1hdGVyaWFsO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG5lZWRzTVRvb24weCAmJiBjcmVhdGVNVG9vbjB4TWF0ZXJpYWxJbXBsID09IG51bGwpIHtcbiAgICAgIGxvYWRzLnB1c2goXG4gICAgICAgIGltcG9ydCgnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlTVRvb24weE1hdGVyaWFsJykudGhlbihtb2R1bGUgPT4ge1xuICAgICAgICAgIGNyZWF0ZU1Ub29uMHhNYXRlcmlhbEltcGwgPSBtb2R1bGUuY3JlYXRlTVRvb24weE1hdGVyaWFsO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwobG9hZHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSByYXltYXJjaGluZyBjb21wb25lbnQgb25seSB3aGVuIGEgbm9kZSB1c2VzIHRoZSBSSE9ET05JVEVfcmF5bWFyY2hpbmcgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YSB0byBpbnNwZWN0XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHByZWxvYWRSYXltYXJjaGluZ1N1cHBvcnQoZ2x0Zk1vZGVsOiBSbk0yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXNlc1JheW1hcmNoaW5nID0gKGdsdGZNb2RlbC5ub2RlcyA/PyBbXSkuc29tZShub2RlID0+IHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbnMgPSBub2RlLmV4dGVuc2lvbnMgYXMgeyBSSE9ET05JVEVfcmF5bWFyY2hpbmc/OiB1bmtub3duIH0gfCB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gZXh0ZW5zaW9ucz8uUkhPRE9OSVRFX3JheW1hcmNoaW5nICE9IG51bGw7XG4gICAgfSk7XG4gICAgaWYgKCF1c2VzUmF5bWFyY2hpbmcgfHwgcmF5bWFyY2hpbmdDb21wb25lbnRDbGFzcyAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyYXltYXJjaGluZ0NvbXBvbmVudFByb21pc2UgPT0gbnVsbCkge1xuICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnRQcm9taXNlID0gaW1wb3J0KCcuLi9jb21wb25lbnRzL1JheW1hcmNoaW5nL1JheW1hcmNoaW5nQ29tcG9uZW50JykudGhlbihtb2R1bGUgPT4ge1xuICAgICAgICByYXltYXJjaGluZ0NvbXBvbmVudENsYXNzID0gbW9kdWxlLlJheW1hcmNoaW5nQ29tcG9uZW50O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGF3YWl0IHJheW1hcmNoaW5nQ29tcG9uZW50UHJvbWlzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRleHR1cmVzIGZyb20gdGhlIGdsVEYgbW9kZWwgYXN5bmNocm9ub3VzbHlcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gYXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX3NldHVwVGV4dHVyZXMoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMikge1xuICAgIGNvbnN0IHJuVGV4dHVyZXM6IFRleHR1cmVbXSA9IFtdO1xuICAgIGlmIChnbHRmTW9kZWwuaW1hZ2VzICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgaW1hZ2Ugb2YgZ2x0Zk1vZGVsLmltYWdlcykge1xuICAgICAgICBjb25zdCByblRleHR1cmUgPSBhd2FpdCB0aGlzLl9jcmVhdGVUZXh0dXJlKGVuZ2luZSwgaW1hZ2UsIGdsdGZNb2RlbCk7XG4gICAgICAgIHJuVGV4dHVyZXMucHVzaChyblRleHR1cmUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcm5UZXh0dXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHNhbXBsZXJzIGZyb20gdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVNhbXBsZXJzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCByblNhbXBsZXJzOiBTYW1wbGVyW10gPSBbXTtcbiAgICBpZiAoZ2x0Zk1vZGVsLnNhbXBsZXJzICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3Qgc2FtcGxlciBvZiBnbHRmTW9kZWwuc2FtcGxlcnMpIHtcbiAgICAgICAgY29uc3Qgcm5TYW1wbGVyID0gdGhpcy5fY3JlYXRlU2FtcGxlcihlbmdpbmUsIHNhbXBsZXIpO1xuICAgICAgICByblNhbXBsZXJzLnB1c2gocm5TYW1wbGVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJuU2FtcGxlcnM7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBnbFRGIG1vZGVsIHRvIFJob2Rvbml0ZSBvYmplY3RzIHN5bmNocm9ub3VzbHkgKHdpdGhvdXQgdGV4dHVyZSBsb2FkaW5nKVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YSB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIFRoZSByb290IGdyb3VwIGVudGl0eSBjb250YWluaW5nIHRoZSBjb252ZXJ0ZWQgc2NlbmVcbiAgICovXG4gIHN0YXRpYyBjb252ZXJ0VG9SaG9kb25pdGVPYmplY3RTaW1wbGUoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMikge1xuICAgIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIGFzIGFueSkucm5NZXNoZXNBdEdsdE1lc2hJZHggPSBbXTtcblxuICAgIGNvbnN0IHJuQnVmZmVycyA9IHRoaXMuX19jcmVhdGVSbkJ1ZmZlcihnbHRmTW9kZWwpO1xuICAgIGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTWF0ZXJpYWxzID0ge307XG5cbiAgICBjb25zdCByblRleHR1cmVzOiBUZXh0dXJlW10gPSBbXTtcbiAgICBjb25zdCByblNhbXBsZXJzOiBTYW1wbGVyW10gPSBbXTtcblxuICAgIC8vIE1hdGVyaWFsc1xuICAgIGNvbnN0IHJuTWF0ZXJpYWxzID0gdGhpcy5fX3NldHVwTWF0ZXJpYWxzKGVuZ2luZSwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICAgIC8vIE1lc2gsIENhbWVyYSwgR3JvdXAsIC4uLlxuICAgIGNvbnN0IHsgcm5FbnRpdGllcywgcm5FbnRpdGllc0J5TmFtZXMgfSA9IHRoaXMuX19zZXR1cE9iamVjdHMoXG4gICAgICBlbmdpbmUsXG4gICAgICBnbHRmTW9kZWwsXG4gICAgICBybkJ1ZmZlcnMsXG4gICAgICBybk1hdGVyaWFscyxcbiAgICAgIHJuVGV4dHVyZXMsXG4gICAgICByblNhbXBsZXJzXG4gICAgKTtcbiAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkVudGl0aWVzID0gcm5FbnRpdGllcztcblxuICAgIC8vIFRyYW5zZm9ybVxuICAgIHRoaXMuX3NldHVwVHJhbnNmb3JtKGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBjb25zdCByb290R3JvdXAgPSB0aGlzLl9fZ2VuZXJhdGVHcm91cEVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG5cbiAgICAvLyBBbmltYXRpb25cbiAgICB0aGlzLl9zZXR1cEFuaW1hdGlvbihlbmdpbmUsIGdsdGZNb2RlbCwgcm5FbnRpdGllcywgcm5CdWZmZXJzLCByb290R3JvdXAsIHJuTWF0ZXJpYWxzKTtcblxuICAgIC8vIFNrZWxldG9uXG4gICAgdGhpcy5fc2V0dXBTa2VsZXRvbihlbmdpbmUsIGdsdGZNb2RlbCwgcm5FbnRpdGllcywgcm5CdWZmZXJzKTtcblxuICAgIC8vIEhpZXJhcmNoeVxuICAgIHRoaXMuX3NldHVwSGllcmFyY2h5KGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBzZXR1cEtoclN0YXRpY0NvbGxpZGVycyhnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgdGhpcy5fX3NldHVwTm9kZVZpc2liaWxpdHkoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIGlmIChnbHRmTW9kZWwuc2NlbmVzWzBdLm5vZGVzKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vZGVzSW5kZXggb2YgZ2x0Zk1vZGVsLnNjZW5lc1swXS5ub2Rlcykge1xuICAgICAgICBjb25zdCBzZyA9IHJuRW50aXRpZXNbbm9kZXNJbmRleF0uZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICByb290R3JvdXAuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHNnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSXMubm90LmV4aXN0KGdsdGZNb2RlbC5leHRyYXMpKSB7XG4gICAgICAoZ2x0Zk1vZGVsIGFzIGFueSkuZXh0cmFzID0ge307XG4gICAgfVxuICAgIGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllcyA9IHJuRW50aXRpZXM7XG4gICAgZ2x0Zk1vZGVsLmV4dHJhcy5ybkVudGl0aWVzQnlOYW1lcyA9IHJuRW50aXRpZXNCeU5hbWVzO1xuXG4gICAgcmV0dXJuIHJvb3RHcm91cDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIGdsVEYgbW9kZWwgdG8gUmhvZG9uaXRlIG9iamVjdHMgYXN5bmNocm9ub3VzbHkgKHdpdGggZnVsbCB0ZXh0dXJlIGxvYWRpbmcpXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhIHRvIGNvbnZlcnRcbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHJvb3QgZ3JvdXAgZW50aXR5IGNvbnRhaW5pbmcgdGhlIGNvbnZlcnRlZCBzY2VuZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgKGdsdGZNb2RlbC5hc3NldC5leHRyYXMgYXMgYW55KS5ybk1lc2hlc0F0R2x0TWVzaElkeCA9IFtdO1xuXG4gICAgY29uc3Qgcm5CdWZmZXJzID0gdGhpcy5fX2NyZWF0ZVJuQnVmZmVyKGdsdGZNb2RlbCk7XG4gICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5NYXRlcmlhbHMgPSB7fTtcblxuICAgIGNvbnN0IHJuVGV4dHVyZXMgPSBhd2FpdCB0aGlzLl9fc2V0dXBUZXh0dXJlcyhlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3Qgcm5TYW1wbGVycyA9IHRoaXMuX19jcmVhdGVTYW1wbGVycyhlbmdpbmUsIGdsdGZNb2RlbCk7XG5cbiAgICAvLyBPcHRpb25hbCBtYXRlcmlhbCBpbXBsZW1lbnRhdGlvbnMgYW5kIHRoZSByYXltYXJjaGluZyBjb21wb25lbnQgc3RheSBvdXQgb2YgYXBwbGljYXRpb25zIHRoYXQgZG8gbm90IHVzZSB0aGVtLlxuICAgIGF3YWl0IHRoaXMuX19wcmVsb2FkTVRvb25NYXRlcmlhbFN1cHBvcnQoZ2x0Zk1vZGVsKTtcbiAgICBhd2FpdCBSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24ucHJlbG9hZE5vZGVCYXNlZE1hdGVyaWFsU3VwcG9ydChnbHRmTW9kZWwpO1xuICAgIGF3YWl0IHRoaXMucHJlbG9hZFJheW1hcmNoaW5nU3VwcG9ydChnbHRmTW9kZWwpO1xuXG4gICAgLy8gTWF0ZXJpYWxzXG4gICAgY29uc3Qgcm5NYXRlcmlhbHMgPSB0aGlzLl9fc2V0dXBNYXRlcmlhbHMoZW5naW5lLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gICAgLy8gTWVzaCwgQ2FtZXJhLCBHcm91cCwgLi4uXG4gICAgY29uc3QgeyBybkVudGl0aWVzLCBybkVudGl0aWVzQnlOYW1lcyB9ID0gdGhpcy5fX3NldHVwT2JqZWN0cyhcbiAgICAgIGVuZ2luZSxcbiAgICAgIGdsdGZNb2RlbCxcbiAgICAgIHJuQnVmZmVycyxcbiAgICAgIHJuTWF0ZXJpYWxzLFxuICAgICAgcm5UZXh0dXJlcyxcbiAgICAgIHJuU2FtcGxlcnNcbiAgICApO1xuICAgIGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuRW50aXRpZXMgPSBybkVudGl0aWVzO1xuXG4gICAgLy8gVHJhbnNmb3JtXG4gICAgdGhpcy5fc2V0dXBUcmFuc2Zvcm0oZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIGNvbnN0IHJvb3RHcm91cCA9IHRoaXMuX19nZW5lcmF0ZUdyb3VwRW50aXR5KGVuZ2luZSwgZ2x0Zk1vZGVsKTtcblxuICAgIC8vIEFuaW1hdGlvblxuICAgIHRoaXMuX3NldHVwQW5pbWF0aW9uKGVuZ2luZSwgZ2x0Zk1vZGVsLCBybkVudGl0aWVzLCBybkJ1ZmZlcnMsIHJvb3RHcm91cCwgcm5NYXRlcmlhbHMpO1xuXG4gICAgLy8gU2tlbGV0b25cbiAgICB0aGlzLl9zZXR1cFNrZWxldG9uKGVuZ2luZSwgZ2x0Zk1vZGVsLCBybkVudGl0aWVzLCBybkJ1ZmZlcnMpO1xuXG4gICAgLy8gSGllcmFyY2h5XG4gICAgdGhpcy5fc2V0dXBIaWVyYXJjaHkoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIC8vIFJhcGllciBpcyBsb2FkZWQgb25seSBmb3IgbW9kZWxzIHRoYXQgdXNlIEtIUl9waHlzaWNzX3JpZ2lkX2JvZGllcy5cbiAgICBhd2FpdCBwcmVsb2FkS2hyUGh5c2ljc1N1cHBvcnQoZ2x0Zk1vZGVsKTtcbiAgICBzZXR1cEtoclN0YXRpY0NvbGxpZGVycyhnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgdGhpcy5fX3NldHVwTm9kZVZpc2liaWxpdHkoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIHJvb3RHcm91cC50cnlUb1NldFVuaXF1ZU5hbWUoJ0ZpbGVSb290JywgdHJ1ZSk7XG4gICAgcm9vdEdyb3VwLnRyeVRvU2V0VGFnKHsgdGFnOiAnT2JqZWN0VHlwZScsIHZhbHVlOiAndG9wJyB9KTtcbiAgICBpZiAoZ2x0Zk1vZGVsLnNjZW5lc1swXS5ub2Rlcykge1xuICAgICAgZm9yIChjb25zdCBub2Rlc0luZGV4IG9mIGdsdGZNb2RlbC5zY2VuZXNbMF0ubm9kZXMpIHtcbiAgICAgICAgY29uc3Qgc2cgPSBybkVudGl0aWVzW25vZGVzSW5kZXhdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcm9vdEdyb3VwLmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChzZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucykge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTG9hZGVyT3B0aW9ucztcbiAgICAgIGlmIChvcHRpb25zPy5sb2FkZXJFeHRlbnNpb24/LmxvYWRFeHRlbnNpb25JbmZvQW5kU2V0VG9Sb290R3JvdXApIHtcbiAgICAgICAgb3B0aW9ucy5sb2FkZXJFeHRlbnNpb24ubG9hZEV4dGVuc2lvbkluZm9BbmRTZXRUb1Jvb3RHcm91cChyb290R3JvdXAsIGdsdGZNb2RlbCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucz8uZXhwcmVzc2lvbikge1xuICAgICAgICBvcHRpb25zLmV4cHJlc3Npb24udHJ5VG9TZXRUYWcoe1xuICAgICAgICAgIHRhZzogJ2dsdGZNb2RlbCcsXG4gICAgICAgICAgdmFsdWU6IGdsdGZNb2RlbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcm9vdEdyb3VwLmFsbE1lc2hlcyA9IHJvb3RHcm91cC5zZWFyY2hFbGVtZW50c0J5VHlwZShNX01lc2gpO1xuICAgIHJvb3RHcm91cC50cnlUb1NldFRhZyh7IHRhZzogJ3JuRW50aXRpZXMnLCB2YWx1ZTogcm5FbnRpdGllcyB9KTtcbiAgICByb290R3JvdXAudHJ5VG9TZXRUYWcoeyB0YWc6ICdybkVudGl0aWVzQnlOYW1lcycsIHZhbHVlOiBybkVudGl0aWVzQnlOYW1lcyB9KTtcbiAgICByb290R3JvdXAudHJ5VG9TZXRUYWcoeyB0YWc6ICdnbHRmTW9kZWwnLCB2YWx1ZTogZ2x0Zk1vZGVsIH0pO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoZ2x0Zk1vZGVsLmV4dHJhcykpIHtcbiAgICAgIChnbHRmTW9kZWwgYXMgYW55KS5leHRyYXMgPSB7fTtcbiAgICB9XG4gICAgZ2x0Zk1vZGVsLmV4dHJhcy5ybkVudGl0aWVzID0gcm5FbnRpdGllcztcbiAgICBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXNCeU5hbWVzID0gcm5FbnRpdGllc0J5TmFtZXM7XG5cbiAgICAvLyBFZmZla3NlZXJcbiAgICBSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24uaW1wb3J0RWZmZWN0KHJvb3RHcm91cC5lbmdpbmUsIGdsdGZNb2RlbCwgcm9vdEdyb3VwKTtcblxuICAgIC8vIEJpbGxib2FyZFxuICAgIFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbi5pbXBvcnRCaWxsYm9hcmQoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIGlmIChJcy5leGlzdChnbHRmTW9kZWwuZXh0ZW5zaW9uc1VzZWQpKSB7XG4gICAgICBpZiAoZ2x0Zk1vZGVsLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoJ1ZSTUNfdnJtJykgPiAwKSB7XG4gICAgICAgIC8vIHRoaXMuX19nZW5lcmF0ZVZybU5vcm1hbGl6ZWRTa2VsZXRvbihnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByb290R3JvdXA7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBSaG9kb25pdGUgYnVmZmVycyBmcm9tIGdsVEYgYnVmZmVyIGRhdGFcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGNvbnRhaW5pbmcgYnVmZmVyIGRhdGFcbiAgICogQHJldHVybnMgQXJyYXkgb2YgUmhvZG9uaXRlIEJ1ZmZlciBvYmplY3RzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVJuQnVmZmVyKGdsdGZNb2RlbDogUm5NMik6IEJ1ZmZlcltdIHtcbiAgICBjb25zdCBybkJ1ZmZlcnMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBnbHRmTW9kZWwuYnVmZmVycyA/PyBbXSkge1xuICAgICAgY29uc3Qgcm5CdWZmZXIgPSBuZXcgQnVmZmVyKHtcbiAgICAgICAgYnl0ZUxlbmd0aDogYnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgIGJ1ZmZlcjogYnVmZmVyLmJ1ZmZlciBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICBuYW1lOiBgZ2x0ZjJCdWZmZXJfMF8oJHtidWZmZXIudXJpfSlgLFxuICAgICAgICBieXRlQWxpZ246IDQsXG4gICAgICAgIGJ1ZmZlclVzYWdlOiBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICAgICAgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlOiAwLFxuICAgICAgfSk7XG4gICAgICBybkJ1ZmZlcnMucHVzaChybkJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBybkJ1ZmZlcnM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0cmFuc2Zvcm0gcHJvcGVydGllcyBmb3IgZW50aXRpZXMgZnJvbSBnbFRGIG5vZGUgZGF0YVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gZ3JvdXBzIC0gQXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXMgdG8gYXBwbHkgdHJhbnNmb3JtcyB0b1xuICAgKi9cbiAgc3RhdGljIF9zZXR1cFRyYW5zZm9ybShnbHRmTW9kZWw6IFJuTTIsIGdyb3VwczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICAgIGZvciAoY29uc3Qgbm9kZV9pIGluIGdsdGZNb2RlbC5ub2Rlcykge1xuICAgICAgY29uc3QgZ3JvdXAgPSBncm91cHNbbm9kZV9pXTtcbiAgICAgIGNvbnN0IG5vZGVKc29uID0gZ2x0Zk1vZGVsLm5vZGVzW25vZGVfaV07XG4gICAgICBjb25zdCBncm91cFRyYW5zZm9ybSA9IGdyb3VwLmdldFRyYW5zZm9ybSgpITtcbiAgICAgIGlmIChub2RlSnNvbi50cmFuc2xhdGlvbikge1xuICAgICAgICBncm91cFRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgICAgICBub2RlSnNvbi50cmFuc2xhdGlvblswXSxcbiAgICAgICAgICBub2RlSnNvbi50cmFuc2xhdGlvblsxXSxcbiAgICAgICAgICBub2RlSnNvbi50cmFuc2xhdGlvblsyXSxcbiAgICAgICAgXSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZUpzb24uc2NhbGUpIHtcbiAgICAgICAgZ3JvdXBUcmFuc2Zvcm0ubG9jYWxTY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbbm9kZUpzb24uc2NhbGVbMF0sIG5vZGVKc29uLnNjYWxlWzFdLCBub2RlSnNvbi5zY2FsZVsyXV0pO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVKc29uLnJvdGF0aW9uKSB7XG4gICAgICAgIGdyb3VwVHJhbnNmb3JtLmxvY2FsUm90YXRpb24gPSBRdWF0ZXJuaW9uLmZyb21Db3B5NChcbiAgICAgICAgICBub2RlSnNvbi5yb3RhdGlvblswXSxcbiAgICAgICAgICBub2RlSnNvbi5yb3RhdGlvblsxXSxcbiAgICAgICAgICBub2RlSnNvbi5yb3RhdGlvblsyXSxcbiAgICAgICAgICBub2RlSnNvbi5yb3RhdGlvblszXVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVKc29uLm1hdHJpeCkge1xuICAgICAgICBncm91cFRyYW5zZm9ybS5sb2NhbE1hdHJpeCA9IE1hdHJpeDQ0LmZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihub2RlSnNvbi5tYXRyaXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBoaWVyYXJjaHkgcmVsYXRpb25zaGlwcyBiZXR3ZWVuIGVudGl0aWVzIGJhc2VkIG9uIGdsVEYgbm9kZSBzdHJ1Y3R1cmVcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXMgdG8gb3JnYW5pemUgaW4gaGllcmFyY2h5XG4gICAqL1xuICBzdGF0aWMgX3NldHVwSGllcmFyY2h5KGdsdGZNb2RlbDogUm5NMiwgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICAgIGNvbnN0IGdyb3VwU2NlbmVDb21wb25lbnRzID0gcm5FbnRpdGllcy5tYXAoZ3JvdXAgPT4ge1xuICAgICAgcmV0dXJuIGdyb3VwLmdldFNjZW5lR3JhcGgoKSE7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IG5vZGVfaSBpbiBnbHRmTW9kZWwubm9kZXMpIHtcbiAgICAgIGNvbnN0IHBhcmVudE5vZGVfaSA9IE51bWJlci5wYXJzZUludChub2RlX2ksIDEwKTtcbiAgICAgIGNvbnN0IGdsVEYyUGFyZW50Tm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1twYXJlbnROb2RlX2ldO1xuICAgICAgaWYgKElzLmV4aXN0KGdsVEYyUGFyZW50Tm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgY29uc3Qgcm5QYXJlbnRTY2VuZUdyYXBoQ29tcG9uZW50ID0gZ3JvdXBTY2VuZUNvbXBvbmVudHNbcGFyZW50Tm9kZV9pXTtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGVfaSBvZiBnbFRGMlBhcmVudE5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICBjb25zdCBybkNoaWxkU2NlbmVHcmFwaENvbXBvbmVudCA9IGdyb3VwU2NlbmVDb21wb25lbnRzW2NoaWxkTm9kZV9pXTtcbiAgICAgICAgICByblBhcmVudFNjZW5lR3JhcGhDb21wb25lbnQuYWRkQ2hpbGQocm5DaGlsZFNjZW5lR3JhcGhDb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cE5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbDogUm5NMiwgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICAgIGNvbnN0IHZpc2l0ZWROb2RlSW5kaWNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGNvbnN0IHNjZW5lUm9vdE5vZGVJbmRpY2VzID0gZ2x0Zk1vZGVsLnNjZW5lcz8uWzBdPy5ub2RlcyA/PyBbXTtcblxuICAgIGZvciAoY29uc3Qgbm9kZUluZGV4IG9mIHNjZW5lUm9vdE5vZGVJbmRpY2VzKSB7XG4gICAgICB0aGlzLl9fYXBwbHlOb2RlVmlzaWJpbGl0eShnbHRmTW9kZWwsIHJuRW50aXRpZXMsIG5vZGVJbmRleCwgdHJ1ZSwgdmlzaXRlZE5vZGVJbmRpY2VzKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG5vZGVJbmRleFN0cmluZyBpbiBnbHRmTW9kZWwubm9kZXMpIHtcbiAgICAgIGNvbnN0IG5vZGVJbmRleCA9IE51bWJlci5wYXJzZUludChub2RlSW5kZXhTdHJpbmcsIDEwKTtcbiAgICAgIGlmICghdmlzaXRlZE5vZGVJbmRpY2VzLmhhcyhub2RlSW5kZXgpKSB7XG4gICAgICAgIHRoaXMuX19hcHBseU5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbCwgcm5FbnRpdGllcywgbm9kZUluZGV4LCB0cnVlLCB2aXNpdGVkTm9kZUluZGljZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fYXBwbHlOb2RlVmlzaWJpbGl0eShcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBub2RlSW5kZXg6IG51bWJlcixcbiAgICBwYXJlbnRWaXNpYmxlOiBib29sZWFuLFxuICAgIHZpc2l0ZWROb2RlSW5kaWNlczogU2V0PG51bWJlcj5cbiAgKSB7XG4gICAgaWYgKHZpc2l0ZWROb2RlSW5kaWNlcy5oYXMobm9kZUluZGV4KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2aXNpdGVkTm9kZUluZGljZXMuYWRkKG5vZGVJbmRleCk7XG5cbiAgICBjb25zdCBub2RlID0gZ2x0Zk1vZGVsLm5vZGVzW25vZGVJbmRleF07XG4gICAgY29uc3QgZW50aXR5ID0gcm5FbnRpdGllc1tub2RlSW5kZXhdO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qobm9kZSkgfHwgSXMubm90LmV4aXN0KGVudGl0eSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsb2NhbFZpc2libGUgPSB0aGlzLl9fZ2V0Tm9kZVZpc2liaWxpdHkobm9kZSk7XG4gICAgZW50aXR5LnRyeVRvU2V0VGFnKHsgdGFnOiBUYWdLaHJOb2RlVmlzaWJpbGl0eVZpc2libGUsIHZhbHVlOiBsb2NhbFZpc2libGUgfSk7XG4gICAgaWYgKElzLmV4aXN0KG5vZGUuZXh0ZW5zaW9ucz8uS0hSX25vZGVfdmlzaWJpbGl0eSkpIHtcbiAgICAgIGVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogVGFnS2hyTm9kZVZpc2liaWxpdHlFbmFibGVkLCB2YWx1ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgZW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUgPSBwYXJlbnRWaXNpYmxlICYmIGxvY2FsVmlzaWJsZTtcblxuICAgIGZvciAoY29uc3QgY2hpbGROb2RlSW5kZXggb2Ygbm9kZS5jaGlsZHJlbiA/PyBbXSkge1xuICAgICAgdGhpcy5fX2FwcGx5Tm9kZVZpc2liaWxpdHkoXG4gICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgY2hpbGROb2RlSW5kZXgsXG4gICAgICAgIHBhcmVudFZpc2libGUgJiYgbG9jYWxWaXNpYmxlLFxuICAgICAgICB2aXNpdGVkTm9kZUluZGljZXNcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXROb2RlVmlzaWJpbGl0eShub2RlOiBSbk0yTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IG5vZGUuZXh0ZW5zaW9ucz8uS0hSX25vZGVfdmlzaWJpbGl0eSBhcyBLSFJfbm9kZV92aXNpYmlsaXR5IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiBleHRlbnNpb24/LnZpc2libGUgPz8gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGFuaW1hdGlvbiBkYXRhIGZyb20gZ2xURiBhbmltYXRpb25zXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBybkJ1ZmZlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgYnVmZmVyc1xuICAgKiBAcGFyYW0gcm9vdEdyb3VwIC0gVGhlIHJvb3QgZ3JvdXAgZW50aXR5XG4gICAqIEBwYXJhbSBybk1hdGVyaWFscyAtIEFycmF5IG9mIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX3NldHVwQW5pbWF0aW9uKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIHJuQnVmZmVyczogQnVmZmVyW10sXG4gICAgcm9vdEdyb3VwOiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICBybk1hdGVyaWFsczogTWF0ZXJpYWxbXVxuICApIHtcbiAgICBpZiAoZ2x0Zk1vZGVsLmFuaW1hdGlvbnMgPT0gbnVsbCB8fCBnbHRmTW9kZWwuYW5pbWF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByb290R3JvdXAuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uU3RhdGVDb21wb25lbnQsIHJvb3RHcm91cCk7XG5cbiAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBnbHRmTW9kZWwuYW5pbWF0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBzYW1wbGVyIG9mIGFuaW1hdGlvbi5zYW1wbGVycykge1xuICAgICAgICB0aGlzLl9yZWFkQmluYXJ5RnJvbUFjY2Vzc29yQW5kU2V0SXRUb0FjY2Vzc29yRXh0cmFzKGVuZ2luZSwgc2FtcGxlci5pbnB1dE9iamVjdCEsIHJuQnVmZmVycyk7XG4gICAgICAgIHRoaXMuX3JlYWRCaW5hcnlGcm9tQWNjZXNzb3JBbmRTZXRJdFRvQWNjZXNzb3JFeHRyYXMoZW5naW5lLCBzYW1wbGVyLm91dHB1dE9iamVjdCEsIHJuQnVmZmVycyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhbmltYXRpb24gb2YgZ2x0Zk1vZGVsLmFuaW1hdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgY2hhbm5lbCBvZiBhbmltYXRpb24uY2hhbm5lbHMpIHtcbiAgICAgICAgaWYgKElzLmV4aXN0KGNoYW5uZWwuc2FtcGxlck9iamVjdCkpIHtcbiAgICAgICAgICBjb25zdCBzYW1wbGVyT2JqZWN0ID0gY2hhbm5lbC5zYW1wbGVyT2JqZWN0O1xuICAgICAgICAgIGNvbnN0IGFuaW1JbnB1dEFycmF5ID0gc2FtcGxlck9iamVjdC5pbnB1dE9iamVjdCEuZXh0cmFzIS50eXBlZERhdGFBcnJheSE7XG4gICAgICAgICAgY29uc3QgYW5pbU91dHB1dEFycmF5ID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEudHlwZWREYXRhQXJyYXkhO1xuICAgICAgICAgIGNvbnN0IGludGVycG9sYXRpb24gPSBzYW1wbGVyT2JqZWN0LmludGVycG9sYXRpb24gPz8gJ0xJTkVBUic7XG5cbiAgICAgICAgICBsZXQgYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWUgPSAndW5kZWZpbmVkJztcbiAgICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3RyYW5zbGF0aW9uJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9ICd0cmFuc2xhdGUnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3JvdGF0aW9uJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9ICdxdWF0ZXJuaW9uJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICdwb2ludGVyJykge1xuICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9ICdtYXRlcmlhbC8nO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID0gY2hhbm5lbC50YXJnZXQucGF0aCBhcyBBbmltYXRpb25QYXRoTmFtZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICAgICAgICBNb2RlbENvbnZlcnRlci5fX3NldFBvaW50ZXJBbmltYXRpb24oXG4gICAgICAgICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgICAgICAgIGNoYW5uZWwsXG4gICAgICAgICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSxcbiAgICAgICAgICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICAgICAgICAgIGdsdGZNb2RlbFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXROb3JtYWxBbmltYXRpb24oXG4gICAgICAgICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgICAgICAgIGNoYW5uZWwsXG4gICAgICAgICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBwb2ludGVyLWJhc2VkIGFuaW1hdGlvbiBmb3IgbWF0ZXJpYWxzLCBub2RlcywgbGlnaHRzLCBhbmQgY2FtZXJhc1xuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gY2hhbm5lbCAtIEFuaW1hdGlvbiBjaGFubmVsIGRhdGFcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqIEBwYXJhbSBybk1hdGVyaWFscyAtIEFycmF5IG9mIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UG9pbnRlckFuaW1hdGlvbihcbiAgICBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIGNoYW5uZWw6IFJuTTJBbmltYXRpb25DaGFubmVsLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZSxcbiAgICBybk1hdGVyaWFsczogTWF0ZXJpYWxbXSxcbiAgICBnbHRmTW9kZWw6IFJuTTJcbiAgKSB7XG4gICAgY29uc3QgcG9pbnRlciA9IGNoYW5uZWwudGFyZ2V0LmV4dGVuc2lvbnMhLktIUl9hbmltYXRpb25fcG9pbnRlci5wb2ludGVyIGFzIHN0cmluZztcbiAgICBjb25zdCBtYXRjaE5vZGVzID0gcG9pbnRlci5tYXRjaCgvXlxcL25vZGVzXFwvKFswLTldKylcXC8vKTtcbiAgICBjb25zdCBtYXRjaE1hdGVyaWFscyA9IHBvaW50ZXIubWF0Y2goL15cXC9tYXRlcmlhbHNcXC8oWzAtOV0rKVxcLy8pO1xuICAgIGNvbnN0IG1hdGNoTGlnaHRzID0gcG9pbnRlci5tYXRjaCgvXlxcL2V4dGVuc2lvbnNcXC9LSFJfbGlnaHRzX3B1bmN0dWFsXFwvbGlnaHRzXFwvKFswLTldKylcXC8vKTtcbiAgICBjb25zdCBtYXRjaENhbWVyYXMgPSBwb2ludGVyLm1hdGNoKC9eXFwvY2FtZXJhc1xcLyhbMC05XSspXFwvLyk7XG4gICAgaWYgKG1hdGNoTWF0ZXJpYWxzKSB7XG4gICAgICBNb2RlbENvbnZlcnRlci5fX3NldFBvaW50ZXJBbmltYXRpb25NYXRlcmlhbHMoXG4gICAgICAgIG1hdGNoTWF0ZXJpYWxzLFxuICAgICAgICBybk1hdGVyaWFscyxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hOb2Rlcykge1xuICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXRQb2ludGVyQW5pbWF0aW9uTm9kZXMoXG4gICAgICAgIG1hdGNoTm9kZXMsXG4gICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoTGlnaHRzKSB7XG4gICAgICBNb2RlbENvbnZlcnRlci5fX3NldFBvaW50ZXJBbmltYXRpb25MaWdodHMoXG4gICAgICAgIG1hdGNoTGlnaHRzLFxuICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICBhbmltYXRpb24sXG4gICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsXG4gICAgICAgIGdsdGZNb2RlbFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoQ2FtZXJhcykge1xuICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXRQb2ludGVyQW5pbWF0aW9uQ2FtZXJhcyhcbiAgICAgICAgbWF0Y2hDYW1lcmFzLFxuICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICBhbmltYXRpb24sXG4gICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsXG4gICAgICAgIGdsdGZNb2RlbFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbygnTm90IFN1cHBvcnRlZCBBbmltYXRpb24gUG9pbnRlciBUeXBlJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgcG9pbnRlciBhbmltYXRpb24gZm9yIGNhbWVyYSBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBtYXRjaCAtIFJlZ2V4IG1hdGNoIHJlc3VsdCBjb250YWluaW5nIGNhbWVyYSBpbmRleFxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gcG9pbnRlciAtIEFuaW1hdGlvbiBwb2ludGVyIHN0cmluZ1xuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UG9pbnRlckFuaW1hdGlvbkNhbWVyYXMoXG4gICAgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXksXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBwb2ludGVyOiBzdHJpbmcsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIF9hbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZSxcbiAgICBnbHRmTW9kZWw6IFJuTTJcbiAgKSB7XG4gICAgY29uc3QgY2FtZXJhSW5kZXggPSBOdW1iZXIucGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBjb25zdCBub2RlcyA9IGdsdGZNb2RlbC5ub2RlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICBpZiAobm9kZS5jYW1lcmEgPT09IGNhbWVyYUluZGV4KSB7XG4gICAgICAgIGNvbnN0IHJuRW50aXR5ID0gcm5FbnRpdGllc1tpXTtcbiAgICAgICAgY29uc3QgY2FtZXJhQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRDYW1lcmEoKTtcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChjYW1lcmFDb21wb25lbnQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW1lcmFDb21wb25lbnQgbm90IGZvdW5kOiAke3BvaW50ZXJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3V0cHV0Q29tcG9uZW50TiA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLmNvbXBvbmVudE4hO1xuICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICBjb25zdCB0cmFja05hbWUgPSBJcy5leGlzdChhbmltYXRpb24ubmFtZSkgPyBhbmltYXRpb24ubmFtZSA6ICdVbnRpdGxlZF9BbmltYXRpb24nO1xuICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVyID0ge1xuICAgICAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgICBvdXRwdXQ6IGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgICBvdXRwdXRDb21wb25lbnROOiBvdXRwdXRDb21wb25lbnROIGFzIFZlY3RvckNvbXBvbmVudE4sXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgICAgICB9O1xuICAgICAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCBhbmltYXRpb25TYW1wbGVyKTtcblxuICAgICAgICBsZXQgYW5pbWF0ZWRWYWx1ZTogSUFuaW1hdGVkVmFsdWU7XG4gICAgICAgIGlmIChvdXRwdXRDb21wb25lbnROID09PSAxKSB7XG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAyKSB7XG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMykge1xuICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDQpIHtcbiAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yNChhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGNvbXBvbmVudCBudW1iZXI6ICR7b3V0cHV0Q29tcG9uZW50Tn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgICAgICBjb25zdCBuZXdSbkVudGl0eSA9IHJuRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvbkNvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3puZWFyJykpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdjYW1lcmFfem5lYXInLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd6ZmFyJykpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdjYW1lcmFfemZhcicsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3lmb3YnKSkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2NhbWVyYV9mb3Z5JywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygneG1hZycpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignY2FtZXJhX3htYWcnLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd5bWFnJykpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdjYW1lcmFfeW1hZycsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgcG9pbnRlciBhbmltYXRpb24gZm9yIGxpZ2h0IHByb3BlcnRpZXNcbiAgICogQHBhcmFtIG1hdGNoIC0gUmVnZXggbWF0Y2ggcmVzdWx0IGNvbnRhaW5pbmcgbGlnaHQgaW5kZXhcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIHBvaW50ZXIgLSBBbmltYXRpb24gcG9pbnRlciBzdHJpbmdcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFBvaW50ZXJBbmltYXRpb25MaWdodHMoXG4gICAgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXksXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBwb2ludGVyOiBzdHJpbmcsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIF9hbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZSxcbiAgICBnbHRmTW9kZWw6IFJuTTJcbiAgKSB7XG4gICAgY29uc3QgbGlnaHRJbmRleCA9IE51bWJlci5wYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgIGNvbnN0IG5vZGVzID0gZ2x0Zk1vZGVsLm5vZGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgIGlmIChub2RlLmV4dGVuc2lvbnM/LktIUl9saWdodHNfcHVuY3R1YWwpIHtcbiAgICAgICAgY29uc3QgbGlnaHRJZHggPSBub2RlLmV4dGVuc2lvbnMuS0hSX2xpZ2h0c19wdW5jdHVhbC5saWdodEluZGV4O1xuICAgICAgICBpZiAobGlnaHRJZHggPT09IGxpZ2h0SW5kZXgpIHtcbiAgICAgICAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXNbaV07XG4gICAgICAgICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldExpZ2h0KCk7XG4gICAgICAgICAgaWYgKElzLm5vdC5leGlzdChsaWdodENvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTGlnaHRDb21wb25lbnQgbm90IGZvdW5kOiAke3BvaW50ZXJ9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IG91dHB1dENvbXBvbmVudE4gPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS5jb21wb25lbnROITtcbiAgICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lIDogJ1VudGl0bGVkX0FuaW1hdGlvbic7XG4gICAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICAgICAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5LFxuICAgICAgICAgICAgb3V0cHV0Q29tcG9uZW50Tjogb3V0cHV0Q29tcG9uZW50TiBhcyBWZWN0b3JDb21wb25lbnROLFxuICAgICAgICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgICAgICAgIH07XG4gICAgICAgICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwgYW5pbWF0aW9uU2FtcGxlcik7XG5cbiAgICAgICAgICBsZXQgYW5pbWF0ZWRWYWx1ZTogSUFuaW1hdGVkVmFsdWU7XG4gICAgICAgICAgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDEpIHtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRTY2FsYXIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAyKSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDMpIHtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjQoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY29tcG9uZW50IG51bWJlcjogJHtvdXRwdXRDb21wb25lbnROfWApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBybkVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldEFuaW1hdGlvbigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCdjb2xvcicpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdsaWdodF9jb2xvcicsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnaW50ZW5zaXR5JykpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2xpZ2h0X2ludGVuc2l0eScsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygncmFuZ2UnKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignbGlnaHRfcmFuZ2UnLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3Nwb3QvaW5uZXJDb25lQW5nbGUnKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignbGlnaHRfc3BvdF9pbm5lckNvbmVBbmdsZScsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnc3BvdC9vdXRlckNvbmVBbmdsZScpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdsaWdodF9zcG90X291dGVyQ29uZUFuZ2xlJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgcG9pbnRlciBhbmltYXRpb24gZm9yIG5vZGUgcHJvcGVydGllcyAodHJhbnNmb3JtLCB3ZWlnaHRzKVxuICAgKiBAcGFyYW0gbWF0Y2ggLSBSZWdleCBtYXRjaCByZXN1bHQgY29udGFpbmluZyBub2RlIGluZGV4XG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBwb2ludGVyIC0gQW5pbWF0aW9uIHBvaW50ZXIgc3RyaW5nXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRQb2ludGVyQW5pbWF0aW9uTm9kZXMoXG4gICAgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXksXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBwb2ludGVyOiBzdHJpbmcsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIF9hbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZVxuICApIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBOdW1iZXIucGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHJuRW50aXR5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlIG5vdCBmb3VuZDogJHtwb2ludGVyfWApO1xuICAgIH1cbiAgICBsZXQgb3V0cHV0Q29tcG9uZW50TiA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLmNvbXBvbmVudE4hO1xuICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCd3ZWlnaHRzJykpIHtcbiAgICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEJsZW5kU2hhcGUoKTtcbiAgICAgIGlmIChJcy5leGlzdChibGVuZFNoYXBlQ29tcG9uZW50KSkge1xuICAgICAgICBvdXRwdXRDb21wb25lbnROID0gYmxlbmRTaGFwZUNvbXBvbmVudC53ZWlnaHRzLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQmxlbmRTaGFwZUNvbXBvbmVudCBub3QgZm91bmQ6ICR7cG9pbnRlcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICBjb25zdCB0cmFja05hbWUgPSBJcy5leGlzdChhbmltYXRpb24ubmFtZSkgPyBhbmltYXRpb24ubmFtZSA6ICdVbnRpdGxlZF9BbmltYXRpb24nO1xuICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXIgPSB7XG4gICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXksXG4gICAgICBvdXRwdXQ6IGFuaW1PdXRwdXRBcnJheSxcbiAgICAgIG91dHB1dENvbXBvbmVudE46IG91dHB1dENvbXBvbmVudE4gYXMgVmVjdG9yQ29tcG9uZW50TixcbiAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICB9O1xuICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIGFuaW1hdGlvblNhbXBsZXIpO1xuXG4gICAgbGV0IGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlO1xuXG4gICAgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3dlaWdodHMnKSkge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3Rvck4oYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAxKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkU2NhbGFyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMikge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAzKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDQpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3I0KGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGNvbXBvbmVudCBudW1iZXI6ICR7b3V0cHV0Q29tcG9uZW50Tn1gKTtcbiAgICB9XG4gICAgbGV0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICBjb25zdCBuZXdSbkVudGl0eSA9IHJuRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvbkNvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgfVxuICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCdyb3RhdGlvbicpKSB7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdxdWF0ZXJuaW9uJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd0cmFuc2xhdGlvbicpKSB7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCd0cmFuc2xhdGUnLCBhbmltYXRlZFZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3NjYWxlJykpIHtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ3NjYWxlJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd3ZWlnaHRzJykpIHtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ3dlaWdodHMnLCBhbmltYXRlZFZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ0tIUl9ub2RlX3Zpc2liaWxpdHkvdmlzaWJsZScpKSB7XG4gICAgICBybkVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogVGFnS2hyTm9kZVZpc2liaWxpdHlFbmFibGVkLCB2YWx1ZTogdHJ1ZSB9KTtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ3Zpc2liaWxpdHknLCBhbmltYXRlZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBwb2ludGVyIGFuaW1hdGlvbiBmb3IgbWF0ZXJpYWwgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0Y2ggLSBSZWdleCBtYXRjaCByZXN1bHQgY29udGFpbmluZyBtYXRlcmlhbCBpbmRleFxuICAgKiBAcGFyYW0gcm5NYXRlcmlhbHMgLSBBcnJheSBvZiBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqIEBwYXJhbSBwb2ludGVyIC0gQW5pbWF0aW9uIHBvaW50ZXIgc3RyaW5nXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRQb2ludGVyQW5pbWF0aW9uTWF0ZXJpYWxzKFxuICAgIG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5LFxuICAgIHJuTWF0ZXJpYWxzOiBNYXRlcmlhbFtdLFxuICAgIHBvaW50ZXI6IHN0cmluZyxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgX2FuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lXG4gICkge1xuICAgIGNvbnN0IG1hdGVyaWFsSW5kZXggPSBOdW1iZXIucGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBjb25zdCBtYXRlcmlhbCA9IHJuTWF0ZXJpYWxzW21hdGVyaWFsSW5kZXhdO1xuICAgIGlmIChJcy5ub3QuZXhpc3QobWF0ZXJpYWwpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1hdGVyaWFsIG5vdCBmb3VuZDogJHtwb2ludGVyfWApO1xuICAgIH1cbiAgICBjb25zdCBvdXRwdXRDb21wb25lbnROID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEuY29tcG9uZW50TiE7XG4gICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICBjb25zdCB0cmFja05hbWUgPSBJcy5leGlzdChhbmltYXRpb24ubmFtZSkgPyBhbmltYXRpb24ubmFtZSA6ICdVbnRpdGxlZF9BbmltYXRpb24nO1xuICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXIgPSB7XG4gICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXksXG4gICAgICBvdXRwdXQ6IGFuaW1PdXRwdXRBcnJheSxcbiAgICAgIG91dHB1dENvbXBvbmVudE46IG91dHB1dENvbXBvbmVudE4gYXMgVmVjdG9yQ29tcG9uZW50TixcbiAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICB9O1xuICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIGFuaW1hdGlvblNhbXBsZXIpO1xuXG4gICAgbGV0IGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlO1xuICAgIGlmIChvdXRwdXRDb21wb25lbnROID09PSAxKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkU2NhbGFyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMikge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAzKSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDQpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3I0KGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGNvbXBvbmVudCBudW1iZXI6ICR7b3V0cHV0Q29tcG9uZW50Tn1gKTtcbiAgICB9XG4gICAgbGV0IHNoYWRlclNlbWFudGljTmFtZSA9ICcnO1xuICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCdLSFJfdGV4dHVyZV90cmFuc2Zvcm0nKSkge1xuICAgICAgY29uc3Qgc3BsaXQgPSBwb2ludGVyLnNwbGl0KCcvJyk7XG4gICAgICBjb25zdCB0ZXh0dXJlTmFtZSA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDRdO1xuICAgICAgY29uc3QgdHJhbnNmb3JtVHlwZSA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgY2FwaXRhbGl6ZWRUcmFuc2Zvcm1UeXBlID0gdHJhbnNmb3JtVHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRyYW5zZm9ybVR5cGUuc2xpY2UoMSk7XG4gICAgICBzaGFkZXJTZW1hbnRpY05hbWUgPSBgJHt0ZXh0dXJlTmFtZX1UcmFuc2Zvcm0ke2NhcGl0YWxpemVkVHJhbnNmb3JtVHlwZX1gO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnbm9ybWFsVGV4dHVyZS9zY2FsZScpKSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY05hbWUgPSAnbm9ybWFsU2NhbGUnO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnb2NjbHVzaW9uVGV4dHVyZS9zdHJlbmd0aCcpKSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY05hbWUgPSAnb2NjbHVzaW9uU3RyZW5ndGgnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY05hbWUgPSBwb2ludGVyLnNwbGl0KCcvJykucG9wKCkhO1xuICAgIH1cbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoc2hhZGVyU2VtYW50aWNOYW1lLCBhbmltYXRlZFZhbHVlKTtcblxuICAgIGNvbnN0IHByaW1pdGl2ZXMgPSBtYXRlcmlhbC5nZXRCZWxvbmdQcmltaXRpdmVzKCk7XG4gICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2YgcHJpbWl0aXZlcy52YWx1ZXMoKSkge1xuICAgICAgaWYgKElzLmV4aXN0KHByaW1pdGl2ZS5tZXNoKSkge1xuICAgICAgICBjb25zdCBtZXNoID0gcHJpbWl0aXZlLm1lc2ggYXMgTWVzaDtcbiAgICAgICAgY29uc3QgbWVzaEVudGl0aWVzID0gbWVzaC5tZXNoRW50aXRpZXNJbm5lcjtcbiAgICAgICAgZm9yIChjb25zdCBybkVudGl0eSBvZiBtZXNoRW50aXRpZXMpIHtcbiAgICAgICAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICAgICAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gcm5FbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbihgbWF0ZXJpYWwvJHtzaGFkZXJTZW1hbnRpY05hbWV9YCwgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBzdGFuZGFyZCBhbmltYXRpb24gKG5vbi1wb2ludGVyIGJhc2VkKSBmb3IgdHJhbnNmb3JtIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIGNoYW5uZWwgLSBBbmltYXRpb24gY2hhbm5lbCBkYXRhXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXROb3JtYWxBbmltYXRpb24oXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBjaGFubmVsOiBSbk0yQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWVcbiAgKSB7XG4gICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzW2NoYW5uZWwudGFyZ2V0Lm5vZGUhXSBhcyBJQW5pbWF0aW9uRW50aXR5O1xuICAgIGlmIChJcy5leGlzdChybkVudGl0eSkpIHtcbiAgICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gcm5FbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldEFuaW1hdGlvbigpO1xuICAgICAgfVxuICAgICAgaWYgKElzLmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0Q29tcG9uZW50TiA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLmNvbXBvbmVudE4hO1xuICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICBjb25zdCB0cmFja05hbWUgPSBJcy5leGlzdChhbmltYXRpb24ubmFtZSkgPyBhbmltYXRpb24ubmFtZSA6ICdVbnRpdGxlZF9BbmltYXRpb24nO1xuICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVyID0ge1xuICAgICAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgICBvdXRwdXQ6IGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgICBvdXRwdXRDb21wb25lbnROOiBvdXRwdXRDb21wb25lbnROIGFzIFZlY3RvckNvbXBvbmVudE4sXG4gICAgICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgICAgICB9O1xuICAgICAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCBhbmltYXRpb25TYW1wbGVyKTtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPT09ICd0cmFuc2xhdGUnKSB7XG4gICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbihhbmltYXRpb25BdHRyaWJ1dGVUeXBlLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhbmltYXRpb25BdHRyaWJ1dGVUeXBlID09PSAncXVhdGVybmlvbicpIHtcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkUXVhdGVybmlvbihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPT09ICdzY2FsZScpIHtcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHdlaWdodFxuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3JOKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYW5pbWF0aW9uQXR0cmlidXRlVHlwZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBza2VsZXRhbCBhbmltYXRpb24gYW5kIGpvaW50IGhpZXJhcmNoaWVzIGZyb20gZ2xURiBza2luIGRhdGFcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIHJuQnVmZmVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBidWZmZXJzXG4gICAqL1xuICBzdGF0aWMgX3NldHVwU2tlbGV0b24oZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMiwgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSwgcm5CdWZmZXJzOiBCdWZmZXJbXSkge1xuICAgIGlmIChnbHRmTW9kZWwuc2tpbnMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZvcmNlZEJvbmVEYXRhVHlwZSA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uYm9uZURhdGFUeXBlO1xuXG4gICAgZm9yIChjb25zdCBub2RlX2kgaW4gZ2x0Zk1vZGVsLm5vZGVzKSB7XG4gICAgICBjb25zdCBub2RlID0gZ2x0Zk1vZGVsLm5vZGVzW25vZGVfaV07XG4gICAgICBjb25zdCBfc2cgPSBybkVudGl0aWVzW25vZGVfaV0uZ2V0U2NlbmVHcmFwaCgpITtcbiAgICAgIGxldCBza2VsZXRhbENvbXBvbmVudDogU2tlbGV0YWxDb21wb25lbnQ7XG4gICAgICBpZiAoSXMuZXhpc3Qobm9kZS5za2luT2JqZWN0KSkge1xuICAgICAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXNbbm9kZV9pXTtcbiAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBlbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShTa2VsZXRhbENvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgICBza2VsZXRhbENvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldFNrZWxldGFsKCk7XG5cbiAgICAgICAgY29uc3QgaW52ZXJzZUJpbmRNYXRBY2Nlc3NvciA9IG5vZGUuc2tpbk9iamVjdC5pbnZlcnNlQmluZE1hdHJpY2VzT2JqZWN0O1xuICAgICAgICBjb25zdCBybkFjY2Vzc29yT2ZJbnZlcnNlQmluZE1hdCA9IElzLmV4aXN0KGludmVyc2VCaW5kTWF0QWNjZXNzb3IpXG4gICAgICAgICAgPyB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvcihlbmdpbmUsIGludmVyc2VCaW5kTWF0QWNjZXNzb3IsIHJuQnVmZmVycylcbiAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBDaG9vc2UgdGhlIGJvbmUgZGF0YSB0eXBlIGJlZm9yZSBzZXRKb2ludHMoKSBzbyB0aGF0IHRoZSBHUFUgYm9uZSBkYXRhIGlzIGFsbG9jYXRlZCBvbmx5IG9uY2UuXG4gICAgICAgIC8vIE1hdDQzeDEgaXMgdXNlZCBvbmx5IHdoZW4gc3BlY2lmaWVkIGV4cGxpY2l0bHkgYnkgdGhlIGxvYWRlciBvcHRpb24gKG9yIENvbmZpZy5ib25lRGF0YVR5cGUpLlxuICAgICAgICBpZiAoZm9yY2VkQm9uZURhdGFUeXBlICE9IG51bGwpIHtcbiAgICAgICAgICBza2VsZXRhbENvbXBvbmVudC5zZXRCb25lRGF0YVR5cGUoZm9yY2VkQm9uZURhdGFUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBBbiBhdXRvbWF0aWNhbGx5IHNlbGVjdGVkIFZlYzR4MSBpcyBzd2l0Y2hlZCB0byBWZWM0eDIgaWYgYSBub24tdW5pZm9ybSBzY2FsZSBhcHBlYXJzIGF0IHJ1bnRpbWVcbiAgICAgICAgICBjb25zdCBpc0F1dG9TZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgc2tlbGV0YWxDb21wb25lbnQuc2V0Qm9uZURhdGFUeXBlKFxuICAgICAgICAgICAgZGV0ZWN0Qm9uZURhdGFUeXBlRm9yU2tpbihcbiAgICAgICAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICAgICAgICBub2RlLnNraW5PYmplY3QsXG4gICAgICAgICAgICAgIE51bWJlcihub2RlX2kpLFxuICAgICAgICAgICAgICBybkFjY2Vzc29yT2ZJbnZlcnNlQmluZE1hdD8uZ2V0VHlwZWRBcnJheSgpXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgaXNBdXRvU2VsZWN0ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKElzLmV4aXN0KG5vZGUuc2tpbk9iamVjdC5iaW5kU2hhcGVNYXRyaXgpKSB7XG4gICAgICAgICAgc2tlbGV0YWxDb21wb25lbnQuX2JpbmRTaGFwZU1hdHJpeCA9IE1hdHJpeDQ0LmZyb21Db3B5QXJyYXlDb2x1bW5NYWpvcihub2RlLnNraW5PYmplY3QuYmluZFNoYXBlTWF0cml4KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGpvaW50X2kgb2Ygbm9kZS5za2luT2JqZWN0LmpvaW50cykge1xuICAgICAgICAgIGNvbnN0IHNnID0gcm5FbnRpdGllc1tqb2ludF9pXS5nZXRTY2VuZUdyYXBoKCkhO1xuICAgICAgICAgIHNnLmpvaW50SW5kZXggPSBqb2ludF9pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGBza2luLnNrZWxldG9uYCBpcyBvcHRpb25hbCBpbiBnbFRGLiBUaGUgam9pbnRzIGFuZCB0aGVpciBib25lIGRhdGEgbXVzdCBiZSBzZXRcbiAgICAgICAgLy8gdXAgcmVnYXJkbGVzczsgd2hlbiB0aGUgc2tlbGV0b24gcm9vdCBpcyBvbWl0dGVkLCB0aGUgY29tbW9uIGFuY2VzdG9yIG9mIHRoZVxuICAgICAgICAvLyBqb2ludHMgaXMgdGhlIHJvb3Qgb2YgdGhlIGpvaW50IGhpZXJhcmNoeS5cbiAgICAgICAgY29uc3Qgam9pbnRzID0gbm9kZS5za2luT2JqZWN0LmpvaW50cy5tYXAoaSA9PiBybkVudGl0aWVzW2ldLmdldFNjZW5lR3JhcGgoKSEpO1xuICAgICAgICBza2VsZXRhbENvbXBvbmVudC5zZXRKb2ludHMoam9pbnRzKTtcbiAgICAgICAgY29uc3Qgc2tlbGV0b25Sb290ID0gSXMuZXhpc3Qobm9kZS5za2luT2JqZWN0LnNrZWxldG9uKVxuICAgICAgICAgID8gcm5FbnRpdGllc1tub2RlLnNraW5PYmplY3Quc2tlbGV0b25dLmdldFNjZW5lR3JhcGgoKVxuICAgICAgICAgIDogdGhpcy5fX2dldENvbW1vbkFuY2VzdG9yT2ZKb2ludHMoam9pbnRzKTtcbiAgICAgICAgc2tlbGV0YWxDb21wb25lbnQudG9wT2ZKb2ludHNIaWVyYXJjaHkgPSBza2VsZXRvblJvb3QgPz8gam9pbnRzWzBdO1xuICAgICAgICBpZiAoc2tlbGV0b25Sb290ICE9IG51bGwpIHtcbiAgICAgICAgICBza2VsZXRvblJvb3QuaXNSb290Sm9pbnQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKElzLmV4aXN0KHJuQWNjZXNzb3JPZkludmVyc2VCaW5kTWF0KSkge1xuICAgICAgICAgIHNrZWxldGFsQ29tcG9uZW50IS5zZXRJbnZlcnNlQmluZE1hdHJpY2VzQWNjZXNzb3Iocm5BY2Nlc3Nvck9mSW52ZXJzZUJpbmRNYXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxvd2VzdCBjb21tb24gYW5jZXN0b3Igb2YgdGhlIGdpdmVuIGpvaW50cyBpbiB0aGUgc2NlbmUgZ3JhcGguXG4gICAqIGdsVEYncyBgc2tpbi5za2VsZXRvbmAgaXMgb3B0aW9uYWw7IHdoZW4gaXQgaXMgb21pdHRlZCwgdGhlIGNvbW1vbiByb290IG9mIHRoZVxuICAgKiBqb2ludHMgaXMgdGhlIHJvb3Qgb2YgdGhlIHNraW4ncyBqb2ludCBoaWVyYXJjaHkuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldENvbW1vbkFuY2VzdG9yT2ZKb2ludHMoam9pbnRzOiBTY2VuZUdyYXBoQ29tcG9uZW50W10pOiBTY2VuZUdyYXBoQ29tcG9uZW50IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoam9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgYW5jZXN0b3JDaGFpbiA9IG5ldyBTZXQ8U2NlbmVHcmFwaENvbXBvbmVudD4oKTtcbiAgICBsZXQgY3VycmVudDogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCA9IGpvaW50c1swXTtcbiAgICB3aGlsZSAoY3VycmVudCAhPSBudWxsKSB7XG4gICAgICBhbmNlc3RvckNoYWluLmFkZChjdXJyZW50KTtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICB9XG4gICAgbGV0IGNvbW1vbjogU2NlbmVHcmFwaENvbXBvbmVudCA9IGpvaW50c1swXTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGpvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG5vZGU6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQgPSBqb2ludHNbaV07XG4gICAgICB3aGlsZSAobm9kZSAhPSBudWxsICYmICFhbmNlc3RvckNoYWluLmhhcyhub2RlKSkge1xuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSAhPT0gY29tbW9uKSB7XG4gICAgICAgIGNvbW1vbiA9IG5vZGU7XG4gICAgICAgIGFuY2VzdG9yQ2hhaW4uY2xlYXIoKTtcbiAgICAgICAgbGV0IGFuY2VzdG9yOiBTY2VuZUdyYXBoQ29tcG9uZW50IHwgdW5kZWZpbmVkID0gY29tbW9uO1xuICAgICAgICB3aGlsZSAoYW5jZXN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgIGFuY2VzdG9yQ2hhaW4uYWRkKGFuY2VzdG9yKTtcbiAgICAgICAgICBhbmNlc3RvciA9IGFuY2VzdG9yLnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29tbW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBzbW9vdGggdmVydGV4IG5vcm1hbHMgZm9yIHByaW1pdGl2ZXMgdGhhdCBoYXZlIG5vIE5PUk1BTCBhdHRyaWJ1dGUuXG4gICAqIGdsVEYgcmVxdWlyZXMgaW1wbGVtZW50YXRpb25zIHRvIGNhbGN1bGF0ZSBub3JtYWxzIHdoZW4gdGhleSBhcmUgYWJzZW50OyB3aXRob3V0XG4gICAqIHRoZW0gbGl0IG1hdGVyaWFscyByZWNlaXZlIGEgemVybyBub3JtYWwgYW5kIHNoYWRlIGluY29ycmVjdGx5IChibGFjayBvciBOYU4pLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZU5vcm1hbHNJZk1pc3NpbmcoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgcHJpbWl0aXZlOiBQcmltaXRpdmUsXG4gICAgaW5kaWNlc0FjY2Vzc29yOiBBY2Nlc3NvciB8IHVuZGVmaW5lZFxuICApOiB2b2lkIHtcbiAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlLmdldEF0dHJpYnV0ZShWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWikpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG1vZGUgPSBwcmltaXRpdmUucHJpbWl0aXZlTW9kZTtcbiAgICBpZiAoXG4gICAgICBtb2RlICE9PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcyAmJlxuICAgICAgbW9kZSAhPT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZVN0cmlwICYmXG4gICAgICBtb2RlICE9PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlRmFuXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSBwcmltaXRpdmUuZ2V0QXR0cmlidXRlKFZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVopO1xuICAgIGlmICghSXMuZXhpc3QocG9zaXRpb25BY2Nlc3NvcikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSBwb3NpdGlvbkFjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgICBpZiAodmVydGV4Q291bnQgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIDMpO1xuICAgIGNvbnN0IGluZGV4Q291bnQgPSBpbmRpY2VzQWNjZXNzb3IgIT0gbnVsbCA/IGluZGljZXNBY2Nlc3Nvci5lbGVtZW50Q291bnQgOiB2ZXJ0ZXhDb3VudDtcbiAgICBjb25zdCBnZXRWZXJ0ZXhJbmRleCA9IChpOiBudW1iZXIpID0+IChpbmRpY2VzQWNjZXNzb3IgIT0gbnVsbCA/IGluZGljZXNBY2Nlc3Nvci5nZXRTY2FsYXIoaSwge30pIDogaSk7XG4gICAgY29uc3QgYWNjdW11bGF0ZVRyaWFuZ2xlID0gKGlhOiBudW1iZXIsIGliOiBudW1iZXIsIGljOiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IGEgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaWEsIHt9KTtcbiAgICAgIGNvbnN0IGIgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaWIsIHt9KTtcbiAgICAgIGNvbnN0IGMgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMoaWMsIHt9KTtcbiAgICAgIGNvbnN0IGFieCA9IGIueCAtIGEueDtcbiAgICAgIGNvbnN0IGFieSA9IGIueSAtIGEueTtcbiAgICAgIGNvbnN0IGFieiA9IGIueiAtIGEuejtcbiAgICAgIGNvbnN0IGFjeCA9IGMueCAtIGEueDtcbiAgICAgIGNvbnN0IGFjeSA9IGMueSAtIGEueTtcbiAgICAgIGNvbnN0IGFjeiA9IGMueiAtIGEuejtcbiAgICAgIC8vIEFyZWEgd2VpZ2h0ZWQgZmFjZSBub3JtYWw7IHRoZSBhY2N1bXVsYXRlZCByZXN1bHQgaXMgbm9ybWFsaXplZCBhdCB0aGUgZW5kLlxuICAgICAgY29uc3QgbnggPSBhYnkgKiBhY3ogLSBhYnogKiBhY3k7XG4gICAgICBjb25zdCBueSA9IGFieiAqIGFjeCAtIGFieCAqIGFjejtcbiAgICAgIGNvbnN0IG56ID0gYWJ4ICogYWN5IC0gYWJ5ICogYWN4O1xuICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBbaWEsIGliLCBpY10pIHtcbiAgICAgICAgbm9ybWFsc1tpbmRleCAqIDNdICs9IG54O1xuICAgICAgICBub3JtYWxzW2luZGV4ICogMyArIDFdICs9IG55O1xuICAgICAgICBub3JtYWxzW2luZGV4ICogMyArIDJdICs9IG56O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAobW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpICsgMiA8IGluZGV4Q291bnQ7IGkgKz0gMykge1xuICAgICAgICBhY2N1bXVsYXRlVHJpYW5nbGUoZ2V0VmVydGV4SW5kZXgoaSksIGdldFZlcnRleEluZGV4KGkgKyAxKSwgZ2V0VmVydGV4SW5kZXgoaSArIDIpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgKyAyIDwgaW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmIChpICUgMiA9PT0gMCkge1xuICAgICAgICAgIGFjY3VtdWxhdGVUcmlhbmdsZShnZXRWZXJ0ZXhJbmRleChpKSwgZ2V0VmVydGV4SW5kZXgoaSArIDEpLCBnZXRWZXJ0ZXhJbmRleChpICsgMikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjY3VtdWxhdGVUcmlhbmdsZShnZXRWZXJ0ZXhJbmRleChpICsgMSksIGdldFZlcnRleEluZGV4KGkpLCBnZXRWZXJ0ZXhJbmRleChpICsgMikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpICsgMSA8IGluZGV4Q291bnQ7IGkrKykge1xuICAgICAgICBhY2N1bXVsYXRlVHJpYW5nbGUoZ2V0VmVydGV4SW5kZXgoMCksIGdldFZlcnRleEluZGV4KGkpLCBnZXRWZXJ0ZXhJbmRleChpICsgMSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJ5dGVMZW5ndGggPSB2ZXJ0ZXhDb3VudCAqIDMgKiA0O1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5DUFVHZW5lcmljLCBieXRlTGVuZ3RoLCA0KTtcbiAgICBjb25zdCBidWZmZXJWaWV3ID0gYnVmZmVyLnRha2VCdWZmZXJWaWV3KHsgYnl0ZUxlbmd0aFRvTmVlZDogYnl0ZUxlbmd0aCwgYnl0ZVN0cmlkZTogMCB9KS51bndyYXBGb3JjZSgpO1xuICAgIGNvbnN0IG5vcm1hbEFjY2Vzc29yID0gYnVmZmVyVmlld1xuICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvdW50OiB2ZXJ0ZXhDb3VudCxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRleENvdW50OyBpKyspIHtcbiAgICAgIGxldCB4ID0gbm9ybWFsc1tpICogM107XG4gICAgICBsZXQgeSA9IG5vcm1hbHNbaSAqIDMgKyAxXTtcbiAgICAgIGxldCB6ID0gbm9ybWFsc1tpICogMyArIDJdO1xuICAgICAgY29uc3QgbGVuZ3RoID0gTWF0aC5oeXBvdCh4LCB5LCB6KTtcbiAgICAgIGlmIChsZW5ndGggPiAwKSB7XG4gICAgICAgIHggLz0gbGVuZ3RoO1xuICAgICAgICB5IC89IGxlbmd0aDtcbiAgICAgICAgeiAvPSBsZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEZWdlbmVyYXRlIHZlcnRleDogdXNlIGEgdmFsaWQgbm9ybWFsIHNvIGxpZ2h0aW5nIGRvZXMgbm90IHByb2R1Y2UgTmFOLlxuICAgICAgICB4ID0gMDtcbiAgICAgICAgeSA9IDE7XG4gICAgICAgIHogPSAwO1xuICAgICAgfVxuICAgICAgbm9ybWFsQWNjZXNzb3Iuc2V0VmVjMyhpLCB4LCB5LCB6LCB7fSk7XG4gICAgfVxuICAgIHByaW1pdGl2ZS5zZXRWZXJ0ZXhBdHRyaWJ1dGUobm9ybWFsQWNjZXNzb3IsIFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGFsbCBvYmplY3RzIChtZXNoZXMsIGNhbWVyYXMsIGxpZ2h0cywgZ3JvdXBzKSBmcm9tIGdsVEYgbm9kZXNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuQnVmZmVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBidWZmZXJzXG4gICAqIEBwYXJhbSBybk1hdGVyaWFscyAtIEFycmF5IG9mIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAgICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAgICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgYXJyYXlzIG9mIGVudGl0aWVzIGFuZCBlbnRpdGllcyBieSBuYW1lXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwT2JqZWN0cyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5CdWZmZXJzOiBCdWZmZXJbXSxcbiAgICBybk1hdGVyaWFsczogTWF0ZXJpYWxbXSxcbiAgICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gICAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4gICkge1xuICAgIGNvbnN0IHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10gPSBbXTtcbiAgICBjb25zdCBybkVudGl0aWVzQnlOYW1lczogTWFwPHN0cmluZywgSVNjZW5lR3JhcGhFbnRpdHk+ID0gbmV3IE1hcCgpO1xuXG4gICAgZm9yIChjb25zdCBub2RlX2kgaW4gZ2x0Zk1vZGVsLm5vZGVzKSB7XG4gICAgICBjb25zdCBub2RlID0gZ2x0Zk1vZGVsLm5vZGVzW051bWJlci5wYXJzZUludChub2RlX2ksIDEwKV0gYXMgUm5NMk5vZGU7XG4gICAgICBsZXQgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eTtcbiAgICAgIGlmIChub2RlLm1lc2ggIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXNoSWR4ID0gbm9kZS5tZXNoO1xuICAgICAgICBjb25zdCBtZXNoRW50aXR5ID0gdGhpcy5fX3NldHVwTWVzaChcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgbm9kZS5tZXNoT2JqZWN0ISxcbiAgICAgICAgICBtZXNoSWR4LFxuICAgICAgICAgIHJuQnVmZmVycyxcbiAgICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICAgICAgcm5UZXh0dXJlcyxcbiAgICAgICAgICByblNhbXBsZXJzXG4gICAgICAgICk7XG4gICAgICAgIGlmIChub2RlLm5hbWUpIHtcbiAgICAgICAgICBtZXNoRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZShub2RlLm5hbWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLm1lc2hPYmplY3Q/Lm5hbWUpIHtcbiAgICAgICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gbWVzaEVudGl0eS5nZXRDb21wb25lbnQoTWVzaENvbXBvbmVudCkhO1xuICAgICAgICAgIG1lc2hDb21wb25lbnQudHJ5VG9TZXRVbmlxdWVOYW1lKG5vZGUubWVzaE9iamVjdC5uYW1lLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbnRpdHkgPSBtZXNoRW50aXR5O1xuICAgICAgfSBlbHNlIGlmIChub2RlLmNhbWVyYU9iamVjdCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGNhbWVyYUVudGl0eSA9IHRoaXMuX19zZXR1cENhbWVyYShlbmdpbmUsIG5vZGUuY2FtZXJhT2JqZWN0LCBnbHRmTW9kZWwpO1xuICAgICAgICBsZXQgZW50aXR5V2l0aE9wdGlvbmFsTGlnaHQ6IElTY2VuZUdyYXBoRW50aXR5ID0gY2FtZXJhRW50aXR5O1xuICAgICAgICAvLyBBIGdsVEYgbm9kZSBjYW4gY2FycnkgYm90aCBhIGNhbWVyYSBhbmQgYSBsaWdodC4gRWRpdG9yLWNyZWF0ZWQgbGlnaHRzIGFyZSBzdWNoXG4gICAgICAgIC8vIG5vZGVzOiBjcmVhdGVMaWdodFdpdGhDYW1lcmFFbnRpdHkgYXR0YWNoZXMgdGhlIGxpZ2h0IGNhbWVyYSB0byB0aGUgbGlnaHQgZW50aXR5LlxuICAgICAgICBpZiAobm9kZS5leHRlbnNpb25zPy5LSFJfbGlnaHRzX3B1bmN0dWFsICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBsaWdodEVudGl0eSA9IGVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFxuICAgICAgICAgICAgTGlnaHRDb21wb25lbnQsXG4gICAgICAgICAgICBjYW1lcmFFbnRpdHlcbiAgICAgICAgICApIGFzIHVua25vd24gYXMgSUNhbWVyYUVudGl0eSAmIElMaWdodEVudGl0eTtcbiAgICAgICAgICB0aGlzLl9fY29uZmlndXJlTGlnaHRDb21wb25lbnQobGlnaHRFbnRpdHkuZ2V0TGlnaHQoKSwgbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHQpO1xuICAgICAgICAgIGxpZ2h0RW50aXR5LmdldENhbWVyYSgpLmlzU3luY1RvTGlnaHQgPSB0cnVlO1xuICAgICAgICAgIGVudGl0eVdpdGhPcHRpb25hbExpZ2h0ID0gbGlnaHRFbnRpdHkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5uYW1lKSB7XG4gICAgICAgICAgZW50aXR5V2l0aE9wdGlvbmFsTGlnaHQudHJ5VG9TZXRVbmlxdWVOYW1lKG5vZGUubmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZW50aXR5ID0gZW50aXR5V2l0aE9wdGlvbmFsTGlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUuZXh0ZW5zaW9ucz8uS0hSX2xpZ2h0c19wdW5jdHVhbCkge1xuICAgICAgICBjb25zdCBsaWdodEVudGl0eSA9IHRoaXMuX19zZXR1cExpZ2h0KGVuZ2luZSwgbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHQsIGdsdGZNb2RlbCk7XG4gICAgICAgIGVudGl0eSA9IGxpZ2h0RW50aXR5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLl9fZ2VuZXJhdGVHcm91cEVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgICAgIGlmIChub2RlLm5hbWUpIHtcbiAgICAgICAgICBncm91cC50cnlUb1NldFVuaXF1ZU5hbWUobm9kZS5uYW1lLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbnRpdHkgPSBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gUmhvZG9uaXRlIHJheW1hcmNoaW5nIGNvbXBvbmVudC4gVGhlIHNoYXJlZCByYXltYXJjaGluZyBtYXRlcmlhbCBpcyBidWlsdCBieSB0aGVcbiAgICAgIC8vIGFwcGxpY2F0aW9uICh0aGUgZWRpdG9yJ3Mgbm9kZSBlZGl0b3IpIGZyb20gdGhlIHJlc3RvcmVkIGdyYXBoLlxuICAgICAgY29uc3QgcmF5bWFyY2hpbmdFeHRlbnNpb24gPSAoXG4gICAgICAgIG5vZGUuZXh0ZW5zaW9ucyBhc1xuICAgICAgICAgIHwge1xuICAgICAgICAgICAgICBSSE9ET05JVEVfcmF5bWFyY2hpbmc/OiB7XG4gICAgICAgICAgICAgICAgZ3JhcGg/OiBOb2RlSlNPTiB8IG51bGw7XG4gICAgICAgICAgICAgICAgc2RmU2hhcGVUeXBlPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgIGlzUGlja2FibGU/OiBib29sZWFuO1xuICAgICAgICAgICAgICAgIGNhc3RTaGFkb3c/OiBib29sZWFuO1xuICAgICAgICAgICAgICAgIC8vIFBlci1jb21wb25lbnQgVGV4dHVyZTJEIGFzc2lnbm1lbnRzLCBjb25zdW1lZCBieSB0aGUgYXBwbGljYXRpb24gd2hlbiBpdFxuICAgICAgICAgICAgICAgIC8vIHJlYnVpbGRzIHRoZSBjb21wb25lbnQncyBtYXRlcmlhbCAoc2VlIGdldFJheW1hcmNoaW5nQ29tcG9uZW50VGV4dHVyZUFzc2lnbm1lbnRzKS5cbiAgICAgICAgICAgICAgICB0ZXh0dXJlcz86IHsgW3NlbWFudGljOiBzdHJpbmddOiB7IGluZGV4PzogbnVtYmVyIH0gfTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB8IHVuZGVmaW5lZFxuICAgICAgKT8uUkhPRE9OSVRFX3JheW1hcmNoaW5nO1xuICAgICAgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uICE9IG51bGwgJiYgZW50aXR5LnRyeVRvR2V0UmF5bWFyY2hpbmcoKSA9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IFJheW1hcmNoaW5nQ29tcG9uZW50ID0gcmF5bWFyY2hpbmdDb21wb25lbnRDbGFzcztcbiAgICAgICAgaWYgKFJheW1hcmNoaW5nQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAgICAgJ1JIT0RPTklURV9yYXltYXJjaGluZzogUmF5bWFyY2hpbmcgc3VwcG9ydCBpcyBub3QgbG9hZGVkLiBJbXBvcnQgdGhlIG1vZGVsIHRocm91Z2ggdGhlIGFzeW5jaHJvbm91cyAnICtcbiAgICAgICAgICAgICAgJ01vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdCgpLCBvciBhd2FpdCBNb2RlbENvbnZlcnRlci5wcmVsb2FkUmF5bWFyY2hpbmdTdXBwb3J0KCkgZmlyc3QuJ1xuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcmF5bWFyY2hpbmdFbnRpdHkgPSBlbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShcbiAgICAgICAgICAgIFJheW1hcmNoaW5nQ29tcG9uZW50LFxuICAgICAgICAgICAgZW50aXR5XG4gICAgICAgICAgKSBhcyB1bmtub3duIGFzIElSYXltYXJjaGluZ0VudGl0eTtcbiAgICAgICAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHJheW1hcmNoaW5nRW50aXR5LmdldFJheW1hcmNoaW5nKCk7XG4gICAgICAgICAgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uLmdyYXBoICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJheW1hcmNoaW5nQ29tcG9uZW50LnJybkpzb24gPSByYXltYXJjaGluZ0V4dGVuc2lvbi5ncmFwaDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uLnNkZlNoYXBlVHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByYXltYXJjaGluZ0NvbXBvbmVudC5zZGZTaGFwZVR5cGUgPSBTZGZTaGFwZVR5cGUuZnJvbShyYXltYXJjaGluZ0V4dGVuc2lvbi5zZGZTaGFwZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24uaXNQaWNrYWJsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByYXltYXJjaGluZ0NvbXBvbmVudC5pc1BpY2thYmxlID0gcmF5bWFyY2hpbmdFeHRlbnNpb24uaXNQaWNrYWJsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uLmNhc3RTaGFkb3cgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnQuY2FzdFNoYWRvdyA9IHJheW1hcmNoaW5nRXh0ZW5zaW9uLmNhc3RTaGFkb3c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVudGl0eSA9IHJheW1hcmNoaW5nRW50aXR5IGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX19pc01vcnBoaW5nKG5vZGUsIGdsdGZNb2RlbCkpIHtcbiAgICAgICAgbGV0IHdlaWdodHM6IG51bWJlcltdID0gW107XG4gICAgICAgIGlmIChub2RlLndlaWdodHMpIHtcbiAgICAgICAgICB3ZWlnaHRzID0gbm9kZS53ZWlnaHRzO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubWVzaE9iamVjdD8ud2VpZ2h0cykge1xuICAgICAgICAgIHdlaWdodHMgPSBub2RlLm1lc2hPYmplY3Qud2VpZ2h0cztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgdGFyZ2V0TnVtID0gMDtcbiAgICAgICAgICAvLyBnZXQgbWF4aW11bSB0YXJnZXQgbnVtXG4gICAgICAgICAgZm9yIChjb25zdCBwcmltaXRpdmUgb2Ygbm9kZS5tZXNoT2JqZWN0IS5wcmltaXRpdmVzKSB7XG4gICAgICAgICAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlLnRhcmdldHMpKSB7XG4gICAgICAgICAgICAgIGlmIChwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGggPiB0YXJnZXROdW0pIHtcbiAgICAgICAgICAgICAgICB0YXJnZXROdW0gPSBwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2VpZ2h0cyA9IG5ldyBBcnJheSh0YXJnZXROdW0pLmZpbGwoMCk7XG4gICAgICAgIH1cbiAgICAgICAgZW50aXR5ID0gZW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEJsZW5kU2hhcGVDb21wb25lbnQsIGVudGl0eSk7XG4gICAgICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSAoZW50aXR5IGFzIHVua25vd24gYXMgSUJsZW5kU2hhcGVFbnRpdHlNZXRob2RzKS5nZXRCbGVuZFNoYXBlKCk7XG4gICAgICAgIGJsZW5kU2hhcGVDb21wb25lbnQud2VpZ2h0cyA9IHdlaWdodHM7XG4gICAgICAgIGlmIChub2RlLm1lc2hPYmplY3Q/LnByaW1pdGl2ZXNbMF0uZXh0cmFzPy50YXJnZXROYW1lcykge1xuICAgICAgICAgIGJsZW5kU2hhcGVDb21wb25lbnQudGFyZ2V0TmFtZXMgPSBub2RlLm1lc2hPYmplY3QucHJpbWl0aXZlc1swXS5leHRyYXMudGFyZ2V0TmFtZXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogVGFnR2x0ZjJOb2RlSW5kZXgsIHZhbHVlOiBub2RlX2kgfSk7XG5cbiAgICAgIHJuRW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgICAgcm5FbnRpdGllc0J5TmFtZXMuc2V0KG5vZGUubmFtZSEsIGVudGl0eSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcm5FbnRpdGllcywgcm5FbnRpdGllc0J5TmFtZXMgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBub2RlIGhhcyBtb3JwaGluZyAoYmxlbmQgc2hhcGUpIGNhcGFiaWxpdGllc1xuICAgKiBAcGFyYW0gbm9kZSAtIFRoZSBnbFRGIG5vZGUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbm9kZSBzdXBwb3J0cyBtb3JwaGluZ1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc01vcnBoaW5nKG5vZGU6IFJuTTJOb2RlLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCBhcmd1bWVudCA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG4gICAgaWYgKGFyZ3VtZW50Py5pc01vcnBoaW5nID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5tZXNoT2JqZWN0Py5wcmltaXRpdmVzWzBdLnRhcmdldHMgIT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGEgbGlnaHQgZW50aXR5IGZyb20gZ2xURiBsaWdodCBkYXRhXG4gICAqIEBwYXJhbSBsaWdodCAtIFRoZSBnbFRGIGxpZ2h0IGRhdGFcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgQ29uZmlndXJlZCBsaWdodCBlbnRpdHlcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBMaWdodChlbmdpbmU6IEVuZ2luZSwgbGlnaHQ6IEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQsIGdsdGZNb2RlbDogUm5NMik6IElMaWdodEVudGl0eSB7XG4gICAgY29uc3QgbGlnaHRFbnRpdHkgPSB0aGlzLl9fZ2VuZXJhdGVMaWdodEVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSBsaWdodEVudGl0eS5nZXRDb21wb25lbnQoTGlnaHRDb21wb25lbnQpISBhcyBMaWdodENvbXBvbmVudDtcbiAgICB0aGlzLl9fY29uZmlndXJlTGlnaHRDb21wb25lbnQobGlnaHRDb21wb25lbnQsIGxpZ2h0KTtcbiAgICAvLyBTcG90IGFuZCBkaXJlY3Rpb25hbCBzaGFkb3cgbWFwcyBhcmUgcmVuZGVyZWQgZnJvbSBhIGNhbWVyYSBzeW5jaHJvbml6ZWQgdG8gdGhlIGxpZ2h0IChTaGFkb3dNYXAgdXNlc1xuICAgIC8vIGxpZ2h0RW50aXR5LmdldENhbWVyYSgpKS4gQXR0YWNoIGl0IG9ubHkgdG8gdGhlIGxpZ2h0cyB0aGF0IGNhc3Qgc2hhZG93czogdGhlIGltcG9ydCBhcHBsaWVzIGNhc3RzU2hhZG93IGZyb21cbiAgICAvLyB0aGUgUmhvZG9uaXRlIGV4dHJhcywgYW5kIFNoYWRvd1N5c3RlbSBhdHRhY2hlcyBpdCBsYXppbHkgd2hlbiBhIGxpZ2h0IHN0YXJ0cyBjYXN0aW5nIHNoYWRvd3MuIEF0dGFjaGluZyBpdCB0b1xuICAgIC8vIGV2ZXJ5IGltcG9ydGVkIHNwb3QvZGlyZWN0aW9uYWwgbGlnaHQgYWRkcyBvbmUgY2FtZXJhIGNvbXBvbmVudCBwZXIgbGlnaHQsIGFuZCB0aGUgZ2VuZXJhdGVkIHNoYWRlcnMga2VlcCBhblxuICAgIC8vIG9mZnNldCBlbnRyeSBwZXIgY2FtZXJhLCB3aGljaCBtYWtlcyB0aGVtIGxhcmdlIGFuZCBzbG93IChlLmcuIGEgc2NlbmUgd2l0aCBodW5kcmVkcyBvZiBsaWdodHMpLlxuICAgIGlmIChsaWdodENvbXBvbmVudC5jYXN0U2hhZG93KSB7XG4gICAgICBhdHRhY2hMaWdodFNoYWRvd0NhbWVyYShlbmdpbmUsIGxpZ2h0RW50aXR5IGFzIElMaWdodEVudGl0eSk7XG4gICAgfVxuICAgIHJldHVybiBsaWdodEVudGl0eSBhcyBJTGlnaHRFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBnbFRGIGxpZ2h0IGRhdGEgdG8gYSBMaWdodENvbXBvbmVudC4gVGhpcyBpcyB1c2VkIGZvciBub2RlcyB0aGF0IGNvbnRhaW4gb25seSBhXG4gICAqIGxpZ2h0IGFuZCBmb3Igbm9kZXMgdGhhdCBjb250YWluIGJvdGggYSBjYW1lcmEgYW5kIGEgbGlnaHQuXG4gICAqIEBwYXJhbSBsaWdodENvbXBvbmVudCAtIFRoZSBjb21wb25lbnQgdG8gY29uZmlndXJlXG4gICAqIEBwYXJhbSBsaWdodCAtIFRoZSBnbFRGIGxpZ2h0IGRhdGFcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fY29uZmlndXJlTGlnaHRDb21wb25lbnQobGlnaHRDb21wb25lbnQ6IExpZ2h0Q29tcG9uZW50LCBsaWdodDogS0hSX2xpZ2h0c19wdW5jdHVhbF9MaWdodCkge1xuICAgIGlmIChsaWdodC5uYW1lICE9IG51bGwpIHtcbiAgICAgIGxpZ2h0Q29tcG9uZW50LnRyeVRvU2V0VW5pcXVlTmFtZShsaWdodC5uYW1lLCB0cnVlKTtcbiAgICB9XG4gICAgbGlnaHRDb21wb25lbnQudHlwZSA9IExpZ2h0VHlwZS5mcm9tU3RyaW5nKGxpZ2h0LnR5cGUpO1xuICAgIGxldCBjb2xvciA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoWzEsIDEsIDFdKTtcbiAgICBsZXQgaW50ZW5zaXR5ID0gMTtcbiAgICBpZiAobGlnaHQuY29sb3IgIT0gbnVsbCkge1xuICAgICAgY29sb3IgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKGxpZ2h0LmNvbG9yKTtcbiAgICB9XG4gICAgaWYgKGxpZ2h0LmludGVuc2l0eSAhPSBudWxsKSB7XG4gICAgICBpbnRlbnNpdHkgPSBsaWdodC5pbnRlbnNpdHk7XG4gICAgfVxuICAgIGxpZ2h0Q29tcG9uZW50LmNvbG9yID0gY29sb3I7XG4gICAgbGlnaHRDb21wb25lbnQuaW50ZW5zaXR5ID0gaW50ZW5zaXR5O1xuICAgIGlmIChsaWdodC5yYW5nZSAhPSBudWxsKSB7XG4gICAgICBsaWdodENvbXBvbmVudC5yYW5nZSA9IGxpZ2h0LnJhbmdlO1xuICAgIH1cbiAgICBpZiAobGlnaHQudHlwZSA9PT0gJ3Nwb3QnKSB7XG4gICAgICBpZiAobGlnaHQuc3BvdD8uaW5uZXJDb25lQW5nbGUgIT0gbnVsbCkge1xuICAgICAgICBsaWdodENvbXBvbmVudC5pbm5lckNvbmVBbmdsZSA9IGxpZ2h0LnNwb3QuaW5uZXJDb25lQW5nbGU7XG4gICAgICB9XG4gICAgICBpZiAobGlnaHQuc3BvdD8ub3V0ZXJDb25lQW5nbGUgIT0gbnVsbCkge1xuICAgICAgICBsaWdodENvbXBvbmVudC5vdXRlckNvbmVBbmdsZSA9IGxpZ2h0LnNwb3Qub3V0ZXJDb25lQW5nbGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVzdG9yZSB0aGUgUmhvZG9uaXRlLXNwZWNpZmljIGxpZ2h0IHN0YXRlIHN0b3JlZCBieSBHbHRmMkV4cG9ydGVyLlxuICAgIGNvbnN0IHJob2Rvbml0ZUV4dHJhcyA9IChcbiAgICAgIGxpZ2h0LmV4dHJhcyBhc1xuICAgICAgICB8IHtcbiAgICAgICAgICAgIHJob2Rvbml0ZT86IHtcbiAgICAgICAgICAgICAgY2FzdFNoYWRvdz86IGJvb2xlYW47XG4gICAgICAgICAgICAgIHBvaW50TGlnaHRTaGFkb3dGYXJQbGFuZT86IG51bWJlcjtcbiAgICAgICAgICAgICAgc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQ/OiBudW1iZXI7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfCB1bmRlZmluZWRcbiAgICApPy5yaG9kb25pdGU7XG4gICAgaWYgKHJob2Rvbml0ZUV4dHJhcyAhPSBudWxsKSB7XG4gICAgICBpZiAocmhvZG9uaXRlRXh0cmFzLmNhc3RTaGFkb3cgIT0gbnVsbCkge1xuICAgICAgICBsaWdodENvbXBvbmVudC5jYXN0U2hhZG93ID0gcmhvZG9uaXRlRXh0cmFzLmNhc3RTaGFkb3c7XG4gICAgICB9XG4gICAgICBpZiAocmhvZG9uaXRlRXh0cmFzLnBvaW50TGlnaHRTaGFkb3dGYXJQbGFuZSAhPSBudWxsKSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LnBvaW50TGlnaHRTaGFkb3dGYXJQbGFuZSA9IHJob2Rvbml0ZUV4dHJhcy5wb2ludExpZ2h0U2hhZG93RmFyUGxhbmU7XG4gICAgICB9XG4gICAgICBpZiAocmhvZG9uaXRlRXh0cmFzLnNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgbGlnaHRDb21wb25lbnQuc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSByaG9kb25pdGVFeHRyYXMuc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBjYW1lcmEgZW50aXR5IGZyb20gZ2xURiBjYW1lcmEgZGF0YVxuICAgKiBAcGFyYW0gY2FtZXJhIC0gVGhlIGdsVEYgY2FtZXJhIGRhdGFcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgQ29uZmlndXJlZCBjYW1lcmEgZW50aXR5XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwQ2FtZXJhKGVuZ2luZTogRW5naW5lLCBjYW1lcmE6IFJuTTJDYW1lcmEsIGdsdGZNb2RlbDogUm5NMik6IElDYW1lcmFFbnRpdHkge1xuICAgIGNvbnN0IGNhbWVyYUVudGl0eSA9IHRoaXMuX19nZW5lcmF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3QgY2FtZXJhQ29tcG9uZW50ID0gY2FtZXJhRW50aXR5LmdldENhbWVyYSgpO1xuICAgIGNhbWVyYUNvbXBvbmVudC5kaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIC0xXSk7XG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldCAmJiAoZ2x0Zk1vZGVsLmFzc2V0IGFzIGFueSkuTGFzdFNhdmVkX0FwcGxpY2F0aW9uVmVuZG9yKSB7XG4gICAgICAvLyBGb3IgYW4gb2xkIGV4cG9ydGVyIGNvbXBhdGliaWxpdHlcbiAgICAgIGNhbWVyYUNvbXBvbmVudC5kaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzEsIDAsIDBdKTtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC5kaXJlY3Rpb25Jbm5lciA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMSwgMCwgMF0pO1xuICAgIH1cbiAgICBjYW1lcmFDb21wb25lbnQudXAgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDEsIDBdKTtcbiAgICBjYW1lcmFDb21wb25lbnQudHlwZSA9IENhbWVyYVR5cGUuZnJvbVN0cmluZyhjYW1lcmEudHlwZSk7XG4gICAgaWYgKGNhbWVyYUNvbXBvbmVudC50eXBlID09PSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQuYXNwZWN0ID0gY2FtZXJhLnBlcnNwZWN0aXZlIS5hc3BlY3RSYXRpbyA/IGNhbWVyYS5wZXJzcGVjdGl2ZSEuYXNwZWN0UmF0aW8gOiAxO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aChNYXRoVXRpbC5yYWRpYW5Ub0RlZ3JlZShjYW1lcmEucGVyc3BlY3RpdmUhLnlmb3YpKTtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC56TmVhciA9IGNhbWVyYS5wZXJzcGVjdGl2ZSEuem5lYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQuekZhciA9IGNhbWVyYS5wZXJzcGVjdGl2ZSEuemZhciA/IGNhbWVyYS5wZXJzcGVjdGl2ZSEuemZhciA6IDEwMDAwMDtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC50cnlUb1NldFRhZyh7XG4gICAgICAgIHRhZzogJ09yaWdpbmFsRm92WScsXG4gICAgICAgIHZhbHVlOiBjYW1lcmFDb21wb25lbnQuZm92eSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoY2FtZXJhQ29tcG9uZW50LnR5cGUgPT09IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljKSB7XG4gICAgICBjYW1lcmFDb21wb25lbnQueE1hZyA9IGNhbWVyYS5vcnRob2dyYXBoaWMhLnhtYWc7XG4gICAgICBjYW1lcmFDb21wb25lbnQueU1hZyA9IGNhbWVyYS5vcnRob2dyYXBoaWMhLnltYWc7XG4gICAgICBjYW1lcmFDb21wb25lbnQuek5lYXIgPSBjYW1lcmEub3J0aG9ncmFwaGljIS56bmVhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC56RmFyID0gY2FtZXJhLm9ydGhvZ3JhcGhpYyEuemZhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC50cnlUb1NldFRhZyh7XG4gICAgICAgIHRhZzogJ09yaWdpbmFsWE1hZycsXG4gICAgICAgIHZhbHVlOiBjYW1lcmFDb21wb25lbnQueE1hZyxcbiAgICAgIH0pO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnRyeVRvU2V0VGFnKHtcbiAgICAgICAgdGFnOiAnT3JpZ2luYWxZTWFnJyxcbiAgICAgICAgdmFsdWU6IGNhbWVyYUNvbXBvbmVudC55TWFnLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNhbWVyYUNvbXBvbmVudC50cnlUb1NldFRhZyh7XG4gICAgICB0YWc6ICdPcmlnaW5hbEFzcGVjdCcsXG4gICAgICB2YWx1ZTogY2FtZXJhQ29tcG9uZW50LmFzcGVjdCxcbiAgICB9KTtcbiAgICByZXR1cm4gY2FtZXJhRW50aXR5IGFzIElDYW1lcmFFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhIG1lc2ggZW50aXR5IGZyb20gZ2xURiBtZXNoIGRhdGFcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIG1lc2ggLSBUaGUgZ2xURiBtZXNoIGRhdGFcbiAgICogQHBhcmFtIG1lc2hJbmRleCAtIEluZGV4IG9mIHRoZSBtZXNoIGluIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBybkJ1ZmZlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgYnVmZmVyc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5NYXRlcmlhbHMgLSBBcnJheSBvZiBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gICAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gICAqIEByZXR1cm5zIENvbmZpZ3VyZWQgbWVzaCBlbnRpdHlcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBNZXNoKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIG1lc2g6IFJuTTJNZXNoLFxuICAgIG1lc2hJbmRleDogSW5kZXgsXG4gICAgcm5CdWZmZXJzOiBCdWZmZXJbXSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10sXG4gICAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICAgIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuICApIHtcbiAgICBjb25zdCBtZXNoRW50aXR5ID0gdGhpcy5fX2dlbmVyYXRlTWVzaEVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3QgZXhpc3RpbmdSbk1lc2ggPSAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyBhcyBhbnkpLnJuTWVzaGVzQXRHbHRNZXNoSWR4W21lc2hJbmRleF0/LmRlcmVmKCkgYXMgTWVzaCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgcm5QcmltaXRpdmVNb2RlID0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZXM7XG4gICAgY29uc3QgbWVzaENvbXBvbmVudCA9IG1lc2hFbnRpdHkuZ2V0TWVzaCgpO1xuXG4gICAgaWYgKGV4aXN0aW5nUm5NZXNoICE9IG51bGwpIHtcbiAgICAgIG1lc2hDb21wb25lbnQuc2V0TWVzaChleGlzdGluZ1JuTWVzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJuTWVzaCA9IG5ldyBNZXNoKGVuZ2luZSk7XG4gICAgICAvLyBzZXQgZmxhZyB0byBybk1lc2ggd2l0aCBvcHRpb25zXG4gICAgICBjb25zdCBybkxvYWRlck9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkxvYWRlck9wdGlvbnM7XG4gICAgICBpZiAocm5Mb2FkZXJPcHRpb25zPy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlICE9IG51bGwpIHtcbiAgICAgICAgcm5NZXNoLnRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgPSBybkxvYWRlck9wdGlvbnMudGFuZ2VudENhbGN1bGF0aW9uTW9kZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2V0dXBNYXRlcmlhbFZhcmlhbnRzID0gKHJuUHJpbWl0aXZlOiBQcmltaXRpdmUsIHByaW1pdGl2ZTogUm5NMlByaW1pdGl2ZSkgPT4ge1xuICAgICAgICBjb25zdCBtYXRlcmlhbFZhcmlhbnRzID0gcHJpbWl0aXZlLm1hdGVyaWFsVmFyaWFudHM7XG4gICAgICAgIGlmIChJcy5ub3QuZXhpc3QobWF0ZXJpYWxWYXJpYW50cykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBtYXRlcmlhbFZhcmlhbnQgb2YgbWF0ZXJpYWxWYXJpYW50cykge1xuICAgICAgICAgIGNvbnN0IG1hdGVyaWFsID0gcm5NYXRlcmlhbHNbbWF0ZXJpYWxWYXJpYW50Lm1hdGVyaWFsXTtcblxuICAgICAgICAgIGZvciAoY29uc3QgdmFyaWFudE5hbWUgb2YgbWF0ZXJpYWxWYXJpYW50LnZhcmlhbnRzKSB7XG4gICAgICAgICAgICByblByaW1pdGl2ZS5zZXRNYXRlcmlhbFZhcmlhbnQodmFyaWFudE5hbWUsIG1hdGVyaWFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGZvciAoY29uc3QgaSBpbiBtZXNoLnByaW1pdGl2ZXMpIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaC5wcmltaXRpdmVzW2ldIGFzIFJuTTJQcmltaXRpdmU7XG4gICAgICAgIGlmIChwcmltaXRpdmUubW9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgcm5QcmltaXRpdmVNb2RlID0gUHJpbWl0aXZlTW9kZS5mcm9tKHByaW1pdGl2ZS5tb2RlKSE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByblByaW1pdGl2ZSA9IG5ldyBQcmltaXRpdmUoZW5naW5lKTtcblxuICAgICAgICBjb25zdCBybk1hdGVyaWFsID1cbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwgIT0gbnVsbFxuICAgICAgICAgICAgPyBybk1hdGVyaWFsc1twcmltaXRpdmUubWF0ZXJpYWxdXG4gICAgICAgICAgICA6IHRoaXMuX19zZXR1cE1hdGVyaWFsKGVuZ2luZSwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcbiAgICAgICAgc2V0dXBNYXRlcmlhbFZhcmlhbnRzKHJuUHJpbWl0aXZlLCBwcmltaXRpdmUpO1xuXG4gICAgICAgIGlmIChybk1hdGVyaWFsLm1hdGVyaWFsVHlwZU5hbWUuaW5kZXhPZignTVRvb24nKSAhPT0gLTEpIHtcbiAgICAgICAgICBjb25zdCBWUk1Qcm9wZXJ0aWVzID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNO1xuICAgICAgICAgIGlmIChWUk1Qcm9wZXJ0aWVzPy5ybkV4dGVuc2lvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBybkV4dGVuc2lvbiA9IFZSTVByb3BlcnRpZXMucm5FeHRlbnNpb247XG4gICAgICAgICAgICBjb25zdCByZW5kZXJQYXNzT3V0bGluZSA9IHJuRXh0ZW5zaW9uLnJlbmRlclBhc3NPdXRsaW5lO1xuICAgICAgICAgICAgY29uc3Qgb3V0bGluZU1hdGVyaWFsID0gcHJpbWl0aXZlLm1hdGVyaWFsT2JqZWN0Py5leHRyYXM/Lm91dGxpbmVNYXRlcmlhbD8uZGVyZWYoKTtcbiAgICAgICAgICAgIGlmIChvdXRsaW5lTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZW5kZXJQYXNzT3V0bGluZS5zZXRNYXRlcmlhbEZvclByaW1pdGl2ZShvdXRsaW5lTWF0ZXJpYWwsIHJuUHJpbWl0aXZlKTtcbiAgICAgICAgICAgICAgcm5QcmltaXRpdmUuc2V0TWF0ZXJpYWxWYXJpYW50KCdvdXRsaW5lJywgb3V0bGluZU1hdGVyaWFsKTsgLy8gVG8gYXR0YWNoIGFuIG91dGxpbmVNYXRlcmlhbCByZWZlcmVuY2UgdG8gdGhlIHByaW1pdGl2ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluZGljZXNcbiAgICAgICAgbGV0IGluZGljZXNSbkFjY2Vzc29yOiBBY2Nlc3NvciB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgbWFwOiBNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj4gPSBuZXcgTWFwKCk7XG4gICAgICAgIGlmIChwcmltaXRpdmUuZXh0ZW5zaW9ucz8uS0hSX2RyYWNvX21lc2hfY29tcHJlc3Npb24pIHtcbiAgICAgICAgICBpbmRpY2VzUm5BY2Nlc3NvciA9IHRoaXMuX19kZWNvZGVEcmFjbyhlbmdpbmUsIHByaW1pdGl2ZSwgcm5CdWZmZXJzLCBnbHRmTW9kZWwsIG1hcCk7XG5cbiAgICAgICAgICBpZiAoSXMubm90LmV4aXN0KGluZGljZXNSbkFjY2Vzc29yKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGluZGljZXNcbiAgICAgICAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlLmluZGljZXMpKSB7XG4gICAgICAgICAgICBpbmRpY2VzUm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yKGVuZ2luZSwgcHJpbWl0aXZlLmluZGljZXNPYmplY3QhLCBybkJ1ZmZlcnMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGF0dHJpYnV0ZXNcbiAgICAgICAgICBjb25zdCBybkJ1ZmZlclZpZXdNYXA6IE1hcDxudW1iZXIsIEJ1ZmZlclZpZXc+ID0gbmV3IE1hcCgpO1xuICAgICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBwcmltaXRpdmUuYXR0cmlidXRlc09iamVjdHMhKSB7XG4gICAgICAgICAgICBjb25zdCBybm0yYXR0cmlidXRlID0gcHJpbWl0aXZlLmF0dHJpYnV0ZXNPYmplY3RzW2F0dHJpYnV0ZU5hbWVdITtcbiAgICAgICAgICAgIGNvbnN0IHJuQnVmZmVyID0gcm5CdWZmZXJzW3JubTJhdHRyaWJ1dGUuYnVmZmVyVmlld09iamVjdCEuYnVmZmVyIV07XG4gICAgICAgICAgICBsZXQgcm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKElzLmV4aXN0KHJubTJhdHRyaWJ1dGUuYnVmZmVyVmlldykpIHtcbiAgICAgICAgICAgICAgcm5CdWZmZXJWaWV3ID0gcm5CdWZmZXJWaWV3TWFwLmdldChybm0yYXR0cmlidXRlLmJ1ZmZlclZpZXcpO1xuICAgICAgICAgICAgICBpZiAoSXMubm90LmV4aXN0KHJuQnVmZmVyVmlldykpIHtcbiAgICAgICAgICAgICAgICBybkJ1ZmZlclZpZXcgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3KHJubTJhdHRyaWJ1dGUuYnVmZmVyVmlld09iamVjdCEsIHJuQnVmZmVyKTtcbiAgICAgICAgICAgICAgICBybkJ1ZmZlclZpZXdNYXAuc2V0KHJubTJhdHRyaWJ1dGUuYnVmZmVyVmlldywgcm5CdWZmZXJWaWV3KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcm5CdWZmZXJWaWV3ID0gcm5CdWZmZXJcbiAgICAgICAgICAgICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICAgICAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogMCxcbiAgICAgICAgICAgICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudW53cmFwRm9yY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZVJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5BY2Nlc3NvcihlbmdpbmUsIHJubTJhdHRyaWJ1dGUsIHJuQnVmZmVyVmlldyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGpvaW5lZFN0cmluZyA9IFZlcnRleEF0dHJpYnV0ZS50b1ZlcnRleEF0dHJpYnV0ZVNlbWFudGljSm9pbmVkU3RyaW5nQXNHbHRmU3R5bGUoXG4gICAgICAgICAgICAgIFZlcnRleEF0dHJpYnV0ZS5mcm9tU3RyaW5nKGF0dHJpYnV0ZU5hbWUpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWFwLnNldChqb2luZWRTdHJpbmcsIGF0dHJpYnV0ZVJuQWNjZXNzb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJuUHJpbWl0aXZlLnNldERhdGEobWFwLCByblByaW1pdGl2ZU1vZGUsIHJuTWF0ZXJpYWwsIGluZGljZXNSbkFjY2Vzc29yKTtcbiAgICAgICAgdGhpcy5fX2dlbmVyYXRlTm9ybWFsc0lmTWlzc2luZyhlbmdpbmUsIHJuUHJpbWl0aXZlLCBpbmRpY2VzUm5BY2Nlc3Nvcik7XG5cbiAgICAgICAgLy8gbW9ycGggdGFyZ2V0c1xuICAgICAgICBpZiAocHJpbWl0aXZlLnRhcmdldHMgIT0gbnVsbCkge1xuICAgICAgICAgIC8vIHNldCBkZWZhdWx0IG51bWJlclxuICAgICAgICAgIGNvbnN0IHRhcmdldHM6IEFycmF5PE1hcDxWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcsIEFjY2Vzc29yPj4gPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZS50YXJnZXRzT2JqZWN0cyEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHByaW1pdGl2ZS50YXJnZXRzT2JqZWN0cyFbaV07XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRNYXA6IE1hcDxWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcsIEFjY2Vzc29yPiA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlQWNjZXNzb3IgPSB0YXJnZXRbYXR0cmlidXRlTmFtZV07XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZVJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvcihlbmdpbmUsIGF0dHJpYnV0ZUFjY2Vzc29yLCBybkJ1ZmZlcnMpO1xuICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVSbkFjY2Vzc29ySW5HUFVWZXJ0ZXhEYXRhID0gdGhpcy5fX2NvcHlSbkFjY2Vzc29yQW5kQnVmZmVyVmlld0Zvck1vcnBoRGF0YShcbiAgICAgICAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3NvclxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhBdHRyaWJ1dGUgPSBWZXJ0ZXhBdHRyaWJ1dGUuZnJvbVN0cmluZyhhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgICAgICAgY29uc3Qgam9pbmVkU3RyaW5nID0gVmVydGV4QXR0cmlidXRlLnRvVmVydGV4QXR0cmlidXRlU2VtYW50aWNKb2luZWRTdHJpbmdBc0dsdGZTdHlsZSh2ZXJ0ZXhBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICB0YXJnZXRNYXAuc2V0KGpvaW5lZFN0cmluZywgYXR0cmlidXRlUm5BY2Nlc3NvckluR1BVVmVydGV4RGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXJnZXRzLnB1c2godGFyZ2V0TWFwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByblByaW1pdGl2ZS5zZXRCbGVuZFNoYXBlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgICAgICAgfVxuICAgICAgICBybk1lc2guYWRkUHJpbWl0aXZlKHJuUHJpbWl0aXZlKTtcbiAgICAgIH1cblxuICAgICAgbWVzaENvbXBvbmVudC5zZXRNZXNoKHJuTWVzaCk7XG4gICAgICAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyBhcyBhbnkpLnJuTWVzaGVzQXRHbHRNZXNoSWR4W21lc2hJbmRleF0gPSBuZXcgV2Vha1JlZihybk1lc2gpO1xuICAgIH1cblxuICAgIHJldHVybiBtZXNoRW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgc3BhcnNlIGFjY2Vzc29yIGRhdGEgYnkgYXBwbHlpbmcgc3BhcnNlIGluZGljZXMgYW5kIHZhbHVlcyB0byB0aGUgYmFzZSBhY2Nlc3NvclxuICAgKiBAcGFyYW0gYWNjZXNzb3IgLSBUaGUgZ2xURiBhY2Nlc3NvciB3aXRoIHNwYXJzZSBkYXRhXG4gICAqIEBwYXJhbSBybkFjY2Vzc29yIC0gVGhlIFJob2Rvbml0ZSBhY2Nlc3NvciB0byBtb2RpZnlcbiAgICovXG4gIHN0YXRpYyBzZXRTcGFyc2VBY2Nlc3NvcihhY2Nlc3NvcjogUm5NMkFjY2Vzc29yLCBybkFjY2Vzc29yOiBBY2Nlc3Nvcik6IHZvaWQge1xuICAgIGNvbnN0IGNvdW50ID0gYWNjZXNzb3Iuc3BhcnNlIS5jb3VudDtcblxuICAgIC8vIGdldCBzcGFyc2UgaW5kaWNlc1xuICAgIGNvbnN0IHNwYXJzZUluZGljZXMgPSBhY2Nlc3Nvci5zcGFyc2UhLmluZGljZXMhO1xuICAgIGNvbnN0IGluZGljZXNCdWZmZXJWaWV3ID0gc3BhcnNlSW5kaWNlcy5idWZmZXJWaWV3T2JqZWN0O1xuICAgIGxldCBidWZmZXI6IFVpbnQ4QXJyYXkgPSBzcGFyc2VJbmRpY2VzLmJ1ZmZlclZpZXdPYmplY3QuYnVmZmVyT2JqZWN0IS5idWZmZXIhO1xuICAgIGNvbnN0IGJ5dGVPZmZzZXRCdWZmZXJWaWV3QW5kU3BhcnNlSW5kaWNlczogbnVtYmVyID1cbiAgICAgIChpbmRpY2VzQnVmZmVyVmlldy5ieXRlT2Zmc2V0ID8/IDApICsgKHNwYXJzZUluZGljZXMuYnl0ZU9mZnNldCA/PyAwKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudEJ5dGVzSW5kaWNlcyA9IHRoaXMuX2NoZWNrQnl0ZXNQZXJDb21wb25lbnQoc3BhcnNlSW5kaWNlcyk7XG4gICAgY29uc3QgYnl0ZUxlbmd0aEluZGljZXMgPSBjb21wb25lbnRCeXRlc0luZGljZXMgKiBjb3VudDsgLy8gaW5kZXggaXMgc2NhbGFyXG4gICAgY29uc3QgZGF0YVZpZXdJbmRpY2VzOiBhbnkgPSBuZXcgRGF0YVZpZXcoXG4gICAgICBidWZmZXIuYnVmZmVyLFxuICAgICAgYnl0ZU9mZnNldEJ1ZmZlclZpZXdBbmRTcGFyc2VJbmRpY2VzICsgYnVmZmVyLmJ5dGVPZmZzZXQsXG4gICAgICBieXRlTGVuZ3RoSW5kaWNlc1xuICAgICk7XG5cbiAgICBjb25zdCBkYXRhVmlld01ldGhvZEluZGljZXMgPSB0aGlzLl9jaGVja0RhdGFWaWV3TWV0aG9kKHNwYXJzZUluZGljZXMpO1xuXG4gICAgLy8gZ2V0IHNwYXJzZSB2YWx1ZXNcbiAgICBjb25zdCBzcGFyc2VWYWx1ZXMgPSBhY2Nlc3Nvci5zcGFyc2UhLnZhbHVlcyE7XG4gICAgY29uc3QgdmFsdWVCdWZmZXJWaWV3ID0gc3BhcnNlVmFsdWVzLmJ1ZmZlclZpZXdPYmplY3Q7XG4gICAgYnVmZmVyID0gc3BhcnNlVmFsdWVzLmJ1ZmZlclZpZXdPYmplY3QuYnVmZmVyT2JqZWN0IS5idWZmZXIhO1xuICAgIGNvbnN0IGJ5dGVPZmZzZXRCdWZmZXJWaWV3QW5kQWNjZXNzb3JWYWx1ZXM6IG51bWJlciA9XG4gICAgICAodmFsdWVCdWZmZXJWaWV3LmJ5dGVPZmZzZXQgPz8gMCkgKyAoc3BhcnNlVmFsdWVzLmJ5dGVPZmZzZXQgPz8gMCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRCeXRlc1ZhbHVlcyA9IHRoaXMuX2NoZWNrQnl0ZXNQZXJDb21wb25lbnQoYWNjZXNzb3IpO1xuICAgIGNvbnN0IGNvbXBvbmVudE5WYWx1ZXMgPSB0aGlzLl9jaGVja0NvbXBvbmVudE51bWJlcihhY2Nlc3Nvcik7XG4gICAgY29uc3QgYnl0ZUxlbmd0aFZhbHVlcyA9IGNvbXBvbmVudEJ5dGVzVmFsdWVzICogY29tcG9uZW50TlZhbHVlcyAqIGNvdW50O1xuICAgIGNvbnN0IGRhdGFWaWV3VmFsdWVzOiBhbnkgPSBuZXcgRGF0YVZpZXcoXG4gICAgICBidWZmZXIuYnVmZmVyLFxuICAgICAgYnl0ZU9mZnNldEJ1ZmZlclZpZXdBbmRBY2Nlc3NvclZhbHVlcyArIGJ1ZmZlci5ieXRlT2Zmc2V0LFxuICAgICAgYnl0ZUxlbmd0aFZhbHVlc1xuICAgICk7XG4gICAgY29uc3QgZGF0YVZpZXdNZXRob2RWYWx1ZXMgPSB0aGlzLl9jaGVja0RhdGFWaWV3TWV0aG9kKGFjY2Vzc29yKTtcblxuICAgIC8vIHNldCBzcGFyc2UgdmFsdWVzIHRvIHJuQWNjZXNzb3JcbiAgICBjb25zdCB0eXBlZEFycmF5ID0gcm5BY2Nlc3Nvci5nZXRUeXBlZEFycmF5KCk7XG4gICAgY29uc3QgbGl0dGxlRW5kaWFuID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZGF0YVZpZXdJbmRpY2VzW2RhdGFWaWV3TWV0aG9kSW5kaWNlc10oY29tcG9uZW50Qnl0ZXNJbmRpY2VzICogaSwgbGl0dGxlRW5kaWFuKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29tcG9uZW50TlZhbHVlczsgaisrKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YVZpZXdWYWx1ZXNbZGF0YVZpZXdNZXRob2RWYWx1ZXNdKFxuICAgICAgICAgIGNvbXBvbmVudEJ5dGVzVmFsdWVzICogY29tcG9uZW50TlZhbHVlcyAqIGkgKyBjb21wb25lbnRCeXRlc1ZhbHVlcyAqIGosXG4gICAgICAgICAgbGl0dGxlRW5kaWFuXG4gICAgICAgICk7XG4gICAgICAgIHR5cGVkQXJyYXlbaW5kZXggKiBjb21wb25lbnROVmFsdWVzICsgal0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJuQWNjZXNzb3Iuc2V0VHlwZWRBcnJheSh0eXBlZEFycmF5KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBWUk0gMS4wIG1hdGVyaWFsIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAgICogQHBhcmFtIHJuTG9hZGVyT3B0aW9ucyAtIExvYWRlciBvcHRpb25zXG4gICAqIEByZXR1cm5zIENvbmZpZ3VyZWQgbWF0ZXJpYWwgb3IgdW5kZWZpbmVkIGlmIG5vdCBWUk0gMS4wXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFZSTTFNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgbWF0ZXJpYWxKc29uOiBWcm0xX01hdGVyaWFsLFxuICAgIHJuTG9hZGVyT3B0aW9uczogR2x0ZkxvYWRPcHRpb25cbiAgKTogTWF0ZXJpYWwgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IFZSTVByb3BlcnRpZXMgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk07XG5cbiAgICBjb25zdCBWUk1DX21hdGVyaWFsc19tdG9vbiA9IG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5WUk1DX21hdGVyaWFsc19tdG9vbjtcbiAgICBpZiAoVlJNQ19tYXRlcmlhbHNfbXRvb24gIT0gbnVsbCkge1xuICAgICAgY29uc3QgY3JlYXRlTVRvb24xTWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjFNYXRlcmlhbEltcGw7XG4gICAgICBpZiAoY3JlYXRlTVRvb24xTWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICAgICAnVlJNIDEuMCBtYXRlcmlhbCBzdXBwb3J0IGlzIG5vdCBsb2FkZWQuIEltcG9ydCB0aGUgbW9kZWwgdGhyb3VnaCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoKS4nXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGFyZ3VtZW50XG4gICAgICBjb25zdCBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudCA9IHJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcblxuICAgICAgY29uc3QgYWRkaXRpb25hbE5hbWUgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5hZGRpdGlvbmFsTmFtZTtcbiAgICAgIGNvbnN0IGlzTW9ycGhpbmcgPSB0cnVlOyAvL3RoaXMuX19pc01vcnBoaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgICBjb25zdCBpc1NraW5uaW5nID0gdHJ1ZTsgLy8gdGhpcy5fX2lzU2tpbm5pbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICAgIGNvbnN0IGlzTGlnaHRpbmcgPSB0aGlzLl9faXNMaWdodGluZyhnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbik7XG4gICAgICBjb25zdCB1c2VUYW5nZW50QXR0cmlidXRlID0gdHJ1ZTsgLy8gdGhpcy5fX3VzZVRhbmdlbnRBdHRyaWJ1dGUoZ2x0Zk1vZGVsLCBwcmltaXRpdmUpO1xuICAgICAgY29uc3QgdGV4dHVyZXMgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC50ZXh0dXJlcztcbiAgICAgIGNvbnN0IHNhbXBsZXJzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuc2FtcGxlcnM7XG4gICAgICBjb25zdCBkZWJ1Z01vZGUgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5kZWJ1Z01vZGU7XG4gICAgICBjb25zdCBtYXhJbnN0YW5jZXNOdW1iZXIgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5tYXhJbnN0YW5jZXNOdW1iZXI7XG4gICAgICBjb25zdCBtYWtlT3V0cHV0U3JnYiA9IHRoaXMuX19tYWtlT3V0cHV0U3JnYihnbHRmTW9kZWwpO1xuXG4gICAgICAvLyBvdXRsaW5lXG4gICAgICBsZXQgcmVuZGVyUGFzc091dGxpbmU6IFJlbmRlclBhc3MgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoSXMuZXhpc3QoVlJNUHJvcGVydGllcz8ucm5FeHRlbnNpb24pKSB7XG4gICAgICAgIGNvbnN0IHJuRXh0ZW5zaW9uID0gVlJNUHJvcGVydGllcy5ybkV4dGVuc2lvbjtcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUgPSBybkV4dGVuc2lvbi5yZW5kZXJQYXNzT3V0bGluZSBhcyBSZW5kZXJQYXNzO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZS5pc1ZyUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUudHJ5VG9TZXRVbmlxdWVOYW1lKCdWUk0gT3V0bGluZSBSZW5kZXJQYXNzJywgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vZXhpc3Qgb3V0bGluZVxuICAgICAgaWYgKHJlbmRlclBhc3NPdXRsaW5lICE9IG51bGwpIHtcbiAgICAgICAgbGV0IG91dGxpbmVNYXRlcmlhbDogTWF0ZXJpYWwgfCB1bmRlZmluZWQ7XG4gICAgICAgIC8vIFRoZSBWUk0gMS4wIHNwZWNpZmljYXRpb24gZGVmYXVsdHMgb3V0bGluZVdpZHRoTW9kZSB0byBcIm5vbmVcIiB3aGVuIGl0IGlzIG9taXR0ZWQuXG4gICAgICAgIGNvbnN0IG91dGxpbmVXaWR0aE1vZGUgPSBWUk1DX21hdGVyaWFsc19tdG9vbi5vdXRsaW5lV2lkdGhNb2RlO1xuICAgICAgICBpZiAob3V0bGluZVdpZHRoTW9kZSA9PT0gJ3dvcmxkQ29vcmRpbmF0ZXMnIHx8IG91dGxpbmVXaWR0aE1vZGUgPT09ICdzY3JlZW5Db29yZGluYXRlcycpIHtcbiAgICAgICAgICBvdXRsaW5lTWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjFNYXRlcmlhbChlbmdpbmUsIHtcbiAgICAgICAgICAgIGFkZGl0aW9uYWxOYW1lLFxuICAgICAgICAgICAgaXNNb3JwaGluZyxcbiAgICAgICAgICAgIGlzU2tpbm5pbmcsXG4gICAgICAgICAgICBpc0xpZ2h0aW5nLFxuICAgICAgICAgICAgdXNlVGFuZ2VudEF0dHJpYnV0ZSxcbiAgICAgICAgICAgIGlzT3V0bGluZTogdHJ1ZSxcbiAgICAgICAgICAgIG1hdGVyaWFsSnNvbixcbiAgICAgICAgICAgIHRleHR1cmVzLFxuICAgICAgICAgICAgc2FtcGxlcnMsXG4gICAgICAgICAgICBkZWJ1Z01vZGUsXG4gICAgICAgICAgICBtYXhJbnN0YW5jZXNOdW1iZXIsXG4gICAgICAgICAgICBtYWtlT3V0cHV0U3JnYixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChJcy5leGlzdChvdXRsaW5lTWF0ZXJpYWwpKSB7XG4gICAgICAgICAgbWF0ZXJpYWxKc29uLmV4dHJhcyEub3V0bGluZU1hdGVyaWFsID0gbmV3IFdlYWtSZWYob3V0bGluZU1hdGVyaWFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMU1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgICBhZGRpdGlvbmFsTmFtZSxcbiAgICAgICAgaXNNb3JwaGluZyxcbiAgICAgICAgaXNTa2lubmluZyxcbiAgICAgICAgaXNMaWdodGluZyxcbiAgICAgICAgdXNlVGFuZ2VudEF0dHJpYnV0ZSxcbiAgICAgICAgaXNPdXRsaW5lOiBmYWxzZSxcbiAgICAgICAgbWF0ZXJpYWxKc29uLFxuICAgICAgICB0ZXh0dXJlcyxcbiAgICAgICAgc2FtcGxlcnMsXG4gICAgICAgIGRlYnVnTW9kZSxcbiAgICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyLFxuICAgICAgICBtYWtlT3V0cHV0U3JnYixcbiAgICAgIH0pO1xuXG4gICAgICAvLyBNb2RlbENvbnZlcnRlci5zZXRNVG9vblRleHR1cmVzKHRleHR1cmVzLCBtYXRlcmlhbFByb3BlcnRpZXMsIG1hdGVyaWFsLCBzYW1wbGVycyk7XG5cbiAgICAgIC8vIGRpc2FibGUgdW5saXRcbiAgICAgIChtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucyBhcyBhbnkpLktIUl9tYXRlcmlhbHNfdW5saXQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICAvLyB1c2UgYW5vdGhlciBtYXRlcmlhbFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBNVG9vbiB0ZXh0dXJlIHBhcmFtZXRlcnMgZm9yIFZSTSBtYXRlcmlhbHNcbiAgICogQHBhcmFtIHRleHR1cmVzIC0gQXJyYXkgb2YgdGV4dHVyZXNcbiAgICogQHBhcmFtIG1hdGVyaWFsUHJvcGVydGllcyAtIFZSTSBtYXRlcmlhbCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAgICogQHBhcmFtIHNhbXBsZXJzIC0gQXJyYXkgb2Ygc2FtcGxlcnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIHNldE1Ub29uVGV4dHVyZXMoXG4gICAgdGV4dHVyZXM6IGFueSxcbiAgICBtYXRlcmlhbFByb3BlcnRpZXM6IFZybTB4TWF0ZXJpYWxQcm9wZXJ0eSxcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgc2FtcGxlcnM6IGFueVxuICApIHtcbiAgICBjb25zdCBsaXRDb2xvclRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX01haW5UZXhdO1xuICAgIGlmIChsaXRDb2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ2xpdENvbG9yVGV4dHVyZScsXG4gICAgICAgIGxpdENvbG9yVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9NYWluVGV4XVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgc2hhZGVDb2xvclRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NoYWRlVGV4dHVyZV07XG4gICAgaWYgKHNoYWRlQ29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdzaGFkZUNvbG9yVGV4dHVyZScsXG4gICAgICAgIHNoYWRlQ29sb3JUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NoYWRlVGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlY2VpdmVTaGFkb3dUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9SZWNlaXZlU2hhZG93VGV4dHVyZV07XG4gICAgaWYgKHJlY2VpdmVTaGFkb3dUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdyZWNlaXZlU2hhZG93VGV4dHVyZScsXG4gICAgICAgIHJlY2VpdmVTaGFkb3dUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1JlY2VpdmVTaGFkb3dUZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgc2hhZGluZ0dyYWRlVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fU2hhZGluZ0dyYWRlVGV4dHVyZV07XG4gICAgaWYgKHNoYWRpbmdHcmFkZVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ3NoYWRpbmdHcmFkZVRleHR1cmUnLFxuICAgICAgICBzaGFkaW5nR3JhZGVUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NoYWRpbmdHcmFkZVRleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCByaW1UZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9SaW1UZXh0dXJlXTtcbiAgICBpZiAocmltVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAncmltVGV4dHVyZScsXG4gICAgICAgIHJpbVRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fUmltVGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG1hdENhcFRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NwaGVyZUFkZF07XG4gICAgaWYgKG1hdENhcFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ21hdENhcFRleHR1cmUnLFxuICAgICAgICBtYXRDYXBUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NwaGVyZUFkZF1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGVtaXNzaW9uVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fRW1pc3Npb25NYXBdO1xuICAgIGlmIChlbWlzc2lvblRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ2VtaXNzaW9uVGV4dHVyZScsXG4gICAgICAgIGVtaXNzaW9uVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9FbWlzc2lvbk1hcF1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG5vcm1hbFRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX0J1bXBNYXBdO1xuICAgIGlmIChub3JtYWxUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdub3JtYWxUZXh0dXJlJyxcbiAgICAgICAgbm9ybWFsVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9CdW1wTWFwXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgb3V0bGluZVdpZHRoVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fT3V0bGluZVdpZHRoVGV4dHVyZV07XG4gICAgaWYgKG91dGxpbmVXaWR0aFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ291dGxpbmVXaWR0aFRleHR1cmUnLFxuICAgICAgICBvdXRsaW5lV2lkdGhUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX091dGxpbmVXaWR0aFRleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9VdkFuaW1NYXNrVGV4dHVyZV07XG4gICAgaWYgKHV2QW5pbWF0aW9uTWFza1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ3V2QW5pbWF0aW9uTWFza1RleHR1cmUnLFxuICAgICAgICB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1V2QW5pbU1hc2tUZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBWUk0gMC54IG1hdGVyaWFsIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAgICogQHBhcmFtIHJuTG9hZGVyT3B0aW9ucyAtIExvYWRlciBvcHRpb25zXG4gICAqIEByZXR1cm5zIENvbmZpZ3VyZWQgbWF0ZXJpYWwgb3IgdW5kZWZpbmVkIGlmIG5vdCBWUk0gMC54XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFZSTTB4TWF0ZXJpYWwoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICAgIHJuTG9hZGVyT3B0aW9uczogR2x0ZkxvYWRPcHRpb25cbiAgKTogTWF0ZXJpYWwgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IFZSTVByb3BlcnRpZXMgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk07XG5cbiAgICBjb25zdCBtYXRlcmlhbFByb3BlcnRpZXMgPSBtYXRlcmlhbEpzb24uZXh0cmFzIS52cm0weE1hdGVyaWFsUHJvcGVydHkgYXMgVnJtMHhNYXRlcmlhbFByb3BlcnR5O1xuICAgIGNvbnN0IHNoYWRlck5hbWUgPSBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyO1xuICAgIGlmIChzaGFkZXJOYW1lID09PSAnVlJNL01Ub29uJykge1xuICAgICAgY29uc3QgY3JlYXRlTVRvb24weE1hdGVyaWFsID0gY3JlYXRlTVRvb24weE1hdGVyaWFsSW1wbDtcbiAgICAgIGlmIChjcmVhdGVNVG9vbjB4TWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICAgICAnVlJNIDAueCBtYXRlcmlhbCBzdXBwb3J0IGlzIG5vdCBsb2FkZWQuIEltcG9ydCB0aGUgbW9kZWwgdGhyb3VnaCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoKS4nXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGFyZ3VtZW50XG4gICAgICBjb25zdCBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudCA9IHJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcblxuICAgICAgY29uc3QgYWRkaXRpb25hbE5hbWUgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5hZGRpdGlvbmFsTmFtZTtcbiAgICAgIGNvbnN0IGlzTW9ycGhpbmcgPSB0cnVlOyAvL3RoaXMuX19pc01vcnBoaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgICBjb25zdCBpc1NraW5uaW5nID0gdHJ1ZTsgLy90aGlzLl9faXNTa2lubmluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgICAgY29uc3QgaXNMaWdodGluZyA9IHRoaXMuX19pc0xpZ2h0aW5nKGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uKTtcbiAgICAgIGNvbnN0IHVzZVRhbmdlbnRBdHRyaWJ1dGUgPSB0cnVlO1xuICAgICAgY29uc3QgdGV4dHVyZXMgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC50ZXh0dXJlcztcbiAgICAgIGNvbnN0IHNhbXBsZXJzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuc2FtcGxlcnM7XG4gICAgICBjb25zdCBkZWJ1Z01vZGUgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5kZWJ1Z01vZGU7XG4gICAgICBjb25zdCBtYXhJbnN0YW5jZXNOdW1iZXIgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudC5tYXhJbnN0YW5jZXNOdW1iZXI7XG4gICAgICBjb25zdCBtYWtlT3V0cHV0U3JnYiA9IHRoaXMuX19tYWtlT3V0cHV0U3JnYihnbHRmTW9kZWwpO1xuXG4gICAgICAvLyBvdXRsaW5lXG4gICAgICBsZXQgcmVuZGVyUGFzc091dGxpbmU6IFJlbmRlclBhc3MgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoSXMuZXhpc3QoVlJNUHJvcGVydGllcz8ucm5FeHRlbnNpb24pKSB7XG4gICAgICAgIGNvbnN0IHJuRXh0ZW5zaW9uID0gVlJNUHJvcGVydGllcy5ybkV4dGVuc2lvbjtcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUgPSBybkV4dGVuc2lvbi5yZW5kZXJQYXNzT3V0bGluZSBhcyBSZW5kZXJQYXNzO1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZS5pc1ZyUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUudHJ5VG9TZXRVbmlxdWVOYW1lKCdWUk0gT3V0bGluZSBSZW5kZXJQYXNzJywgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vZXhpc3Qgb3V0bGluZVxuICAgICAgaWYgKHJlbmRlclBhc3NPdXRsaW5lICE9IG51bGwpIHtcbiAgICAgICAgbGV0IG91dGxpbmVNYXRlcmlhbDogTWF0ZXJpYWwgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChtYXRlcmlhbFByb3BlcnRpZXMuZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhNb2RlICE9PSAwKSB7XG4gICAgICAgICAgb3V0bGluZU1hdGVyaWFsID0gY3JlYXRlTVRvb24weE1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgICAgICAgYWRkaXRpb25hbE5hbWUsXG4gICAgICAgICAgICBpc01vcnBoaW5nLFxuICAgICAgICAgICAgaXNTa2lubmluZyxcbiAgICAgICAgICAgIGlzTGlnaHRpbmcsXG4gICAgICAgICAgICB1c2VUYW5nZW50QXR0cmlidXRlLFxuICAgICAgICAgICAgaXNPdXRsaW5lOiB0cnVlLFxuICAgICAgICAgICAgbWF0ZXJpYWxQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgdGV4dHVyZXMsXG4gICAgICAgICAgICBzYW1wbGVycyxcbiAgICAgICAgICAgIGRlYnVnTW9kZSxcbiAgICAgICAgICAgIG1heEluc3RhbmNlc051bWJlcixcbiAgICAgICAgICAgIG1ha2VPdXRwdXRTcmdiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKElzLmV4aXN0KG91dGxpbmVNYXRlcmlhbCkpIHtcbiAgICAgICAgICBNb2RlbENvbnZlcnRlci5zZXRNVG9vblRleHR1cmVzKHRleHR1cmVzLCBtYXRlcmlhbFByb3BlcnRpZXMsIG91dGxpbmVNYXRlcmlhbCwgc2FtcGxlcnMpO1xuICAgICAgICAgIG1hdGVyaWFsSnNvbi5leHRyYXMhLm91dGxpbmVNYXRlcmlhbCA9IG5ldyBXZWFrUmVmKG91dGxpbmVNYXRlcmlhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjB4TWF0ZXJpYWwoZW5naW5lLCB7XG4gICAgICAgIGFkZGl0aW9uYWxOYW1lLFxuICAgICAgICBpc01vcnBoaW5nLFxuICAgICAgICBpc1NraW5uaW5nLFxuICAgICAgICBpc0xpZ2h0aW5nLFxuICAgICAgICB1c2VUYW5nZW50QXR0cmlidXRlLFxuICAgICAgICBpc091dGxpbmU6IGZhbHNlLFxuICAgICAgICBtYXRlcmlhbFByb3BlcnRpZXMsXG4gICAgICAgIHRleHR1cmVzLFxuICAgICAgICBzYW1wbGVycyxcbiAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICBtYXhJbnN0YW5jZXNOdW1iZXIsXG4gICAgICAgIG1ha2VPdXRwdXRTcmdiLFxuICAgICAgfSk7XG5cbiAgICAgIE1vZGVsQ29udmVydGVyLnNldE1Ub29uVGV4dHVyZXModGV4dHVyZXMsIG1hdGVyaWFsUHJvcGVydGllcywgbWF0ZXJpYWwsIHNhbXBsZXJzKTtcblxuICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgIH1cblxuICAgIC8vIHVzZSBhbm90aGVyIG1hdGVyaWFsXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYW4gYXBwcm9wcmlhdGUgbWF0ZXJpYWwgYmFzZWQgb24gZ2xURiBtYXRlcmlhbCBkYXRhIGFuZCBsb2FkZXIgb3B0aW9uc1xuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIGxvYWRlZCBSaG9kb25pdGUgdGV4dHVyZXNcbiAgICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBsb2FkZWQgUmhvZG9uaXRlIHNhbXBsZXJzXG4gICAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhIChvcHRpb25hbClcbiAgICogQHJldHVybnMgR2VuZXJhdGVkIG1hdGVyaWFsXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlQXBwcm9wcmlhdGVNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICAgIHJuU2FtcGxlcnM6IFNhbXBsZXJbXSxcbiAgICBtYXRlcmlhbEpzb24/OiBSbk0yTWF0ZXJpYWxcbiAgKTogTWF0ZXJpYWwge1xuICAgIGNvbnN0IGlzVHJhbnNsdWNlbnQgPSBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKTtcbiAgICAvLyBpZiBybkxvYWRlck9wdGlvbnMgaXMgc2V0IHNvbWV0aGluZywgZG8gc3BlY2lhbCBkZWFsXG4gICAgaWYgKGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkxvYWRlck9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzLnJuTG9hZGVyT3B0aW9ucztcblxuICAgICAgLy8gRm9yIHNwZWNpZmllZCBsb2FkZXIgZXh0ZW5zaW9uXG4gICAgICBpZiAocm5Mb2FkZXJPcHRpb25zLmxvYWRlckV4dGVuc2lvbj8uaXNOZWVkZWRUb1VzZVRoaXNNYXRlcmlhbD8uKGdsdGZNb2RlbCkpIHtcbiAgICAgICAgY29uc3QgbG9hZGVyRXh0ZW5zaW9uID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5sb2FkZXJFeHRlbnNpb247XG4gICAgICAgIGlmIChsb2FkZXJFeHRlbnNpb24/LmdlbmVyYXRlTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBsb2FkZXJFeHRlbnNpb24uZ2VuZXJhdGVNYXRlcmlhbChtYXRlcmlhbEpzb24hKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGb3IgVlJNMHhcbiAgICAgIGlmIChybkxvYWRlck9wdGlvbnMuX19pc0ltcG9ydFZSTTB4KSB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fX3NldFZSTTB4TWF0ZXJpYWwoZW5naW5lLCBnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbiEsIHJuTG9hZGVyT3B0aW9ucyk7XG4gICAgICAgIGlmIChJcy5leGlzdChtYXRlcmlhbCkpIHtcbiAgICAgICAgICBtYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gaXNUcmFuc2x1Y2VudDtcbiAgICAgICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRm9yIHNwZWNpZmllZCBkZWZhdWx0IG1hdGVyaWFsIGhlbHBlclxuICAgICAgY29uc3QgbWF0ZXJpYWxIZWxwZXIgPSBybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyO1xuICAgICAgaWYgKG1hdGVyaWFsSGVscGVyICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG1hdGVyaWFsSGVscGVyKGVuZ2luZSwgLi4uKHJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID8/IFtdKSk7XG4gICAgICB9XG4gICAgICBpZiAocm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlck5hbWUgIT0gbnVsbCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihcbiAgICAgICAgICBgZGVmYXVsdE1hdGVyaWFsSGVscGVyTmFtZSAoXCIke3JuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJOYW1lfVwiKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiBgICtcbiAgICAgICAgICAgICdQYXNzIHRoZSBmdW5jdGlvbiB3aXRoIGRlZmF1bHRNYXRlcmlhbEhlbHBlciBpbnN0ZWFkLCBlLmcuIGRlZmF1bHRNYXRlcmlhbEhlbHBlcjogY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbC4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcHJlIGRhdGFcbiAgICBjb25zdCBpc01vcnBoaW5nID0gdHJ1ZTsgLy8gdGhpcy5fX2lzTW9ycGhpbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBpc1NraW5uaW5nID0gdHJ1ZTsgLy90aGlzLl9faXNTa2lubmluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGlzTGlnaHRpbmcgPSB0aGlzLl9faXNMaWdodGluZyhnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbik7XG4gICAgY29uc3QgYWRkaXRpb25hbE5hbWUgPSAnJztcblxuICAgIGNvbnN0IHJuTG9hZGVyT3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucyA/PyB7fTtcbiAgICBjb25zdCB1c2VOb3JtYWxUZXh0dXJlID0gbWF0ZXJpYWxKc29uPy5ub3JtYWxUZXh0dXJlICE9IG51bGw7XG4gICAgY29uc3QgbWF4TWF0ZXJpYWxJbnN0YW5jZU51bWJlcjogbnVtYmVyID0gZW5naW5lLmNvbmZpZy5tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldztcbiAgICBjb25zdCBwYnJVYmVyTWF0ZXJpYWxPcHRpb25zID0ge1xuICAgICAgaXNNb3JwaGluZyxcbiAgICAgIGlzU2tpbm5pbmcsXG4gICAgICBpc0xpZ2h0aW5nLFxuICAgICAgaXNPY2NsdXNpb246IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8ub2NjbHVzaW9uVGV4dHVyZSksXG4gICAgICBpc0VtaXNzaXZlOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmVtaXNzaXZlVGV4dHVyZSksXG4gICAgICBpc0NsZWFyY29hdDogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdCksXG4gICAgICBpc1RyYW5zbWlzc2lvbjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiksXG4gICAgICBpc1ZvbHVtZTogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3ZvbHVtZSksXG4gICAgICBpc1NoZWVuOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfc2hlZW4pLFxuICAgICAgaXNTcGVjdWxhcjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyKSxcbiAgICAgIGlzSXJpZGVzY2VuY2U6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSksXG4gICAgICBpc0FuaXNvdHJvcHk6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5KSxcbiAgICAgIGlzRGlzcGVyc2lvbjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24pLFxuICAgICAgaXNFbWlzc2l2ZVN0cmVuZ3RoOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGgpLFxuICAgICAgaXNEaWZmdXNlVHJhbnNtaXNzaW9uOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24pLFxuICAgICAgaXNTaGFkb3c6ICEhcm5Mb2FkZXJPcHRpb25zLnNoYWRvdyxcbiAgICAgIHVzZU5vcm1hbFRleHR1cmUsXG4gICAgICBhZGRpdGlvbmFsTmFtZTogYWRkaXRpb25hbE5hbWUsXG4gICAgICBtYXhJbnN0YW5jZXNOdW1iZXI6IG1heE1hdGVyaWFsSW5zdGFuY2VOdW1iZXIsXG4gICAgfTtcblxuICAgIGlmIChJcy5leGlzdChtYXRlcmlhbEpzb24pKSB7XG4gICAgICBpZiAobWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LlZSTUNfbWF0ZXJpYWxzX210b29uICE9IG51bGwpIHtcbiAgICAgICAgY29uc3Qgcm5Mb2FkZXJPcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zITtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSB0aGlzLl9fc2V0VlJNMU1hdGVyaWFsKGVuZ2luZSwgZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24gYXMgVnJtMV9NYXRlcmlhbCwgcm5Mb2FkZXJPcHRpb25zKTtcbiAgICAgICAgaWYgKElzLmV4aXN0KG1hdGVyaWFsKSkge1xuICAgICAgICAgIG1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBpc1RyYW5zbHVjZW50O1xuICAgICAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGb3IgUkhPRE9OSVRFX21hdGVyaWFsc19ub2RlIGV4dGVuc2lvbiAobm9kZS1iYXNlZCBzaGFkZXIgbWF0ZXJpYWxzKVxuICAgICAgaWYgKFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbi5oYXNOb2RlQmFzZWRNYXRlcmlhbEV4dGVuc2lvbihtYXRlcmlhbEpzb24pKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhbmQgcmV0dXJuIG5vZGUtYmFzZWQgY3VzdG9tIG1hdGVyaWFsXG4gICAgICAgIGNvbnN0IGN1c3RvbU1hdGVyaWFsID0gUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLmNyZWF0ZU5vZGVCYXNlZE1hdGVyaWFsKFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgICAgbWF0ZXJpYWxKc29uLFxuICAgICAgICAgIHJuVGV4dHVyZXMgPz8gW10sXG4gICAgICAgICAgcm5TYW1wbGVycyA/PyBbXSxcbiAgICAgICAgICBwYnJVYmVyTWF0ZXJpYWxPcHRpb25zXG4gICAgICAgICk7XG4gICAgICAgIGlmIChJcy5leGlzdChjdXN0b21NYXRlcmlhbCkpIHtcbiAgICAgICAgICBjdXN0b21NYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gaXNUcmFuc2x1Y2VudDtcbiAgICAgICAgICByZXR1cm4gY3VzdG9tTWF0ZXJpYWw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIG5vZGUtYmFzZWQgbWF0ZXJpYWwgaW1wbGVtZW50YXRpb24gaXMgbG9hZGVkIG9uIGRlbWFuZC4gRmFsbGluZyBiYWNrIHRvIHRoZSBkZWZhdWx0IG1hdGVyaWFsXG4gICAgICAgIC8vIGtlZXBzIHRoZSBzeW5jaHJvbm91cyBjb252ZXJ0VG9SaG9kb25pdGVPYmplY3RTaW1wbGUoKSBwYXRoIHVzYWJsZS5cbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgJ1JIT0RPTklURV9tYXRlcmlhbHNfbm9kZTogRmFpbGVkIHRvIGNyZWF0ZSBhIG5vZGUtYmFzZWQgbWF0ZXJpYWwuIEZhbGxpbmcgYmFjayB0byB0aGUgZGVmYXVsdCBtYXRlcmlhbC4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE51bWJlci5wYXJzZUZsb2F0KGdsdGZNb2RlbC5hc3NldD8udmVyc2lvbikgPj0gMikge1xuICAgICAgLy8gRm9yIGdsVEYgMlxuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVQYnJVYmVyTWF0ZXJpYWwoZW5naW5lLCBwYnJVYmVyTWF0ZXJpYWxPcHRpb25zKTtcbiAgICAgIGNvbnN0IG1ha2VPdXRwdXRTcmdiID0gdGhpcy5fX21ha2VPdXRwdXRTcmdiKGdsdGZNb2RlbCk7XG4gICAgICBpZiAoSXMuZXhpc3QobWFrZU91dHB1dFNyZ2IpKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbWFrZU91dHB1dFNyZ2InLCBtYWtlT3V0cHV0U3JnYik7XG4gICAgICB9XG4gICAgICBtYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gaXNUcmFuc2x1Y2VudDtcbiAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG4gICAgLy8gRm9yIGdsVEYgMVxuICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbChlbmdpbmUsIHtcbiAgICAgIGlzU2tpbm5pbmcsXG4gICAgICBpc0xpZ2h0aW5nLFxuICAgICAgYWRkaXRpb25hbE5hbWU6IGFkZGl0aW9uYWxOYW1lLFxuICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyOiBtYXhNYXRlcmlhbEluc3RhbmNlTnVtYmVyLFxuICAgIH0pO1xuICAgIG1hdGVyaWFsLmlzVHJhbnNsdWNlbnQgPSBpc1RyYW5zbHVjZW50O1xuICAgIHJldHVybiBtYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIGxpZ2h0aW5nIHNob3VsZCBiZSBlbmFibGVkIGZvciBhIG1hdGVyaWFsXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhIChvcHRpb25hbClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBsaWdodGluZyBzaG91bGQgYmUgZW5hYmxlZFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pc0xpZ2h0aW5nKGdsdGZNb2RlbDogUm5NMiwgbWF0ZXJpYWxKc29uPzogUm5NMk1hdGVyaWFsKSB7XG4gICAgY29uc3QgYXJndW1lbnQgPSBnbHRmTW9kZWw/LmFzc2V0Py5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG4gICAgaWYgKGFyZ3VtZW50Py5pc0xpZ2h0aW5nICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudC5pc0xpZ2h0aW5nIGFzIGJvb2xlYW47XG4gICAgfVxuICAgIHJldHVybiBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdW5saXQgPT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRhbmdlbnQgYXR0cmlidXRlcyBzaG91bGQgYmUgdXNlZCBmb3IgYSBwcmltaXRpdmVcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHByaW1pdGl2ZSAtIFRoZSBnbFRGIHByaW1pdGl2ZSBkYXRhXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGFuZ2VudCBhdHRyaWJ1dGVzIHNob3VsZCBiZSB1c2VkXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3VzZVRhbmdlbnRBdHRyaWJ1dGUoZ2x0Zk1vZGVsOiBSbk0yLCBwcmltaXRpdmU6IFJuTTJQcmltaXRpdmUpIHtcbiAgICBjb25zdCB0YW5nZW50Q2FsY3VsYXRpb25Nb2RlID0gZ2x0Zk1vZGVsPy5hc3NldD8uZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LnRhbmdlbnRDYWxjdWxhdGlvbk1vZGU7XG5cbiAgICBzd2l0Y2ggKHRhbmdlbnRDYWxjdWxhdGlvbk1vZGUpIHtcbiAgICAgIGNhc2UgMDogLy8gZG8gbm90IHVzZSBub3JtYWwgbWFwXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGNhc2UgMTogLy8gdGFuZ2VudCBhdHRyaWJ1dGUgKyBjYWxjdWxhdGVkIHRhbmdlbnQgaW4gc2hhZGVyXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOiAvLyB0YW5nZW50IGF0dHJpYnV0ZSArIHByZS1jYWxjdWxhdGVkIHRhbmdlbnRcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIDM6IC8vIGZvcmNlIGNhbGMgaW4gc2hhZGVyXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGNhc2UgNDogLy8gZm9yY2UgcHJlLWNhbGNcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBkZWZhdWx0OlxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIGluIHByaW1pdGl2ZS5hdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoYXR0cmlidXRlID09PSAnVEFOR0VOVCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fdXNlTm9ybWFsVGV4dHVyZShnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCBhcmd1bWVudCA9IGdsdGZNb2RlbD8uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5IVswXTtcbiAgICBpZiAoYXJndW1lbnQ/LnVzZU5vcm1hbFRleHR1cmUgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBnbHRmTW9kZWw/LmFzc2V0Py5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8udGFuZ2VudENhbGN1bGF0aW9uTW9kZSAhPT0gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbWFrZU91dHB1dFNyZ2IoZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgY29uc3QgYXJndW1lbnQgPSBnbHRmTW9kZWw/LmFzc2V0Py5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG4gICAgcmV0dXJuIGFyZ3VtZW50Py5tYWtlT3V0cHV0U3JnYiBhcyBib29sZWFuIHwgdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cE1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gICAgcm5TYW1wbGVyczogU2FtcGxlcltdLFxuICAgIG1hdGVyaWFsSnNvbj86IFJuTTJNYXRlcmlhbFxuICApOiBNYXRlcmlhbCB7XG4gICAgY29uc3QgbWF0ZXJpYWw6IE1hdGVyaWFsID0gdGhpcy5fX2dlbmVyYXRlQXBwcm9wcmlhdGVNYXRlcmlhbChcbiAgICAgIGVuZ2luZSxcbiAgICAgIGdsdGZNb2RlbCxcbiAgICAgIHJuVGV4dHVyZXMsXG4gICAgICByblNhbXBsZXJzLFxuICAgICAgbWF0ZXJpYWxKc29uXG4gICAgKTtcbiAgICBpZiAobWF0ZXJpYWxKc29uID09IG51bGwpIHJldHVybiBtYXRlcmlhbDtcblxuICAgIE1vZGVsQ29udmVydGVyLnNldFBhcmFtZXRlcnNUb01hdGVyaWFsKG1hdGVyaWFsSnNvbiwgZ2x0Zk1vZGVsLCBtYXRlcmlhbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycywgZmFsc2UpO1xuXG4gICAgaWYgKG1hdGVyaWFsSnNvbi5leHRyYXM/Lm91dGxpbmVNYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICBNb2RlbENvbnZlcnRlci5zZXRQYXJhbWV0ZXJzVG9NYXRlcmlhbChcbiAgICAgICAgbWF0ZXJpYWxKc29uLFxuICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgIG1hdGVyaWFsSnNvbi5leHRyYXMub3V0bGluZU1hdGVyaWFsLmRlcmVmKCksXG4gICAgICAgIHJuVGV4dHVyZXMsXG4gICAgICAgIHJuU2FtcGxlcnMsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGVyaWFsO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgc2V0UGFyYW1ldGVyc1RvTWF0ZXJpYWwoXG4gICAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gICAgcm5TYW1wbGVyczogU2FtcGxlcltdLFxuICAgIGlzT3V0bGluZTogYm9vbGVhblxuICApIHtcbiAgICBjb25zdCBpc1VubGl0ID0gbWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdW5saXQgIT0gbnVsbDtcbiAgICBjb25zdCBvcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zO1xuICAgIGNvbnN0IHBick1ldGFsbGljUm91Z2huZXNzID0gbWF0ZXJpYWxKc29uLnBick1ldGFsbGljUm91Z2huZXNzO1xuICAgIGlmIChwYnJNZXRhbGxpY1JvdWdobmVzcyAhPSBudWxsKSB7XG4gICAgICAvLyBCYXNlQ29sb3IgRmFjdG9yXG4gICAgICBzZXR1cFBick1ldGFsbGljUm91Z2huZXNzKFxuICAgICAgICBwYnJNZXRhbGxpY1JvdWdobmVzcyxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgbWF0ZXJpYWxKc29uLFxuICAgICAgICByblRleHR1cmVzLFxuICAgICAgICByblNhbXBsZXJzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW06IEluZGV4ID0gU2hhZGluZ01vZGVsLlBob25nLmluZGV4O1xuICAgICAgaWYgKG1hdGVyaWFsSnNvbj8uZXh0cmFzPy50ZWNobmlxdWUpIHtcbiAgICAgICAgc3dpdGNoIChtYXRlcmlhbEpzb24uZXh0cmFzLnRlY2huaXF1ZSkge1xuICAgICAgICAgIGNhc2UgU2hhZGluZ01vZGVsLkNvbnN0YW50LnN0cjpcbiAgICAgICAgICAgIHBhcmFtID0gU2hhZGluZ01vZGVsLkNvbnN0YW50LmluZGV4O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBTaGFkaW5nTW9kZWwuTGFtYmVydC5zdHI6XG4gICAgICAgICAgICBwYXJhbSA9IFNoYWRpbmdNb2RlbC5MYW1iZXJ0LmluZGV4O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBTaGFkaW5nTW9kZWwuQmxpbm5QaG9uZy5zdHI6XG4gICAgICAgICAgICBwYXJhbSA9IFNoYWRpbmdNb2RlbC5CbGlublBob25nLmluZGV4O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBTaGFkaW5nTW9kZWwuUGhvbmcuc3RyOlxuICAgICAgICAgICAgcGFyYW0gPSBTaGFkaW5nTW9kZWwuUGhvbmcuaW5kZXg7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRpbmdNb2RlbCcsIFNjYWxhci5mcm9tQ29weU51bWJlcihwYXJhbSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGVtaXNzaXZlRmFjdG9yID0gaXNVbmxpdCA/IChbMCwgMCwgMF0gYXMgQXJyYXkzPG51bWJlcj4pIDogbWF0ZXJpYWxKc29uLmVtaXNzaXZlRmFjdG9yO1xuICAgIGlmIChlbWlzc2l2ZUZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2VtaXNzaXZlRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhlbWlzc2l2ZUZhY3RvcikpO1xuICAgIH1cblxuICAgIGNvbnN0IGVtaXNzaXZlVGV4dHVyZSA9IG1hdGVyaWFsSnNvbi5lbWlzc2l2ZVRleHR1cmU7XG4gICAgaWYgKGVtaXNzaXZlVGV4dHVyZSAhPSBudWxsICYmIElzLmZhbHN5KGlzVW5saXQpKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW2VtaXNzaXZlVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbZW1pc3NpdmVUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2VtaXNzaXZlVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChOdW1iZXIucGFyc2VGbG9hdChnbHRmTW9kZWwuYXNzZXQ/LnZlcnNpb24pID49IDIgJiYgZW1pc3NpdmVUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdlbWlzc2l2ZVRleGNvb3JkSW5kZXgnLCBlbWlzc2l2ZVRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgZW1pc3NpdmVUZXh0dXJlISxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdlbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdlbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cblxuICAgIGxldCBhbHBoYU1vZGUgPSBtYXRlcmlhbEpzb24uYWxwaGFNb2RlO1xuICAgIGlmIChvcHRpb25zPy5hbHBoYU1vZGUpIHtcbiAgICAgIGFscGhhTW9kZSA9IG9wdGlvbnMuYWxwaGFNb2RlO1xuICAgIH1cbiAgICBpZiAoYWxwaGFNb2RlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5mcm9tR2xURlN0cmluZyhhbHBoYU1vZGUpITtcblxuICAgICAgLy8gc2V0IGFscGhhIHRocmVzaG9sZCBleGNlcHQgZm9yIFZSTVxuICAgICAgaWYgKG1hdGVyaWFsLmFscGhhTW9kZSA9PT0gQWxwaGFNb2RlLk1hc2sgJiYgIWdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uX19pc0ltcG9ydFZSTTB4KSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYWxwaGFDdXRvZmYnLCBTY2FsYXIuZnJvbUNvcHlOdW1iZXIobWF0ZXJpYWxKc29uLmFscGhhQ3V0b2ZmID8/IDAuNSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBtYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gSXMuZXhpc3QobWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKTtcblxuICAgIGNvbnN0IGRvdWJsZVNpZGVkID0gbWF0ZXJpYWxKc29uLmRvdWJsZVNpZGVkO1xuICAgIGlmIChkb3VibGVTaWRlZCAhPSBudWxsICYmICFpc091dGxpbmUpIHtcbiAgICAgIG1hdGVyaWFsLmN1bGxGYWNlID0gIWRvdWJsZVNpZGVkO1xuICAgIH1cblxuICAgIGNvbnN0IG5vcm1hbFRleHR1cmUgPSBtYXRlcmlhbEpzb24ubm9ybWFsVGV4dHVyZTtcbiAgICBpZiAobm9ybWFsVGV4dHVyZSAhPSBudWxsICYmIElzLmZhbHN5KGlzVW5saXQpKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW25vcm1hbFRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW25vcm1hbFRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignbm9ybWFsVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChOdW1iZXIucGFyc2VGbG9hdChnbHRmTW9kZWwuYXNzZXQ/LnZlcnNpb24pID49IDIpIHtcbiAgICAgICAgaWYgKG5vcm1hbFRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbm9ybWFsVGV4Y29vcmRJbmRleCcsIG5vcm1hbFRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbFRleHR1cmUuc2NhbGUgIT0gbnVsbCkge1xuICAgICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbm9ybWFsU2NhbGUnLCBub3JtYWxUZXh0dXJlLnNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgbm9ybWFsVGV4dHVyZSEsXG4gICAgICBtYXRlcmlhbCxcbiAgICAgICdub3JtYWxUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgJ25vcm1hbFRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgJ25vcm1hbFRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICApO1xuXG4gICAgLy8gRm9yIEV4dGVuc2lvblxuICAgIGlmICh0aGlzLl9jaGVja1JuR2x0ZkxvYWRlck9wdGlvbnNFeGlzdChnbHRmTW9kZWwpKSB7XG4gICAgICBjb25zdCBsb2FkZXJFeHRlbnNpb24gPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmxvYWRlckV4dGVuc2lvbjtcbiAgICAgIGlmIChsb2FkZXJFeHRlbnNpb24/LnNldHVwTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgICBsb2FkZXJFeHRlbnNpb24uc2V0dXBNYXRlcmlhbChnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uVlJNQ19tYXRlcmlhbHNfbXRvb24gIT0gbnVsbCkge1xuICAgICAgc2V0dXBNVG9vbjEobWF0ZXJpYWwsIGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uIGFzIFZybTFfTWF0ZXJpYWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBfY3JlYXRlU2FtcGxlcihlbmdpbmU6IEVuZ2luZSwgc2FtcGxlcjogUm5NMlRleHR1cmVTYW1wbGVyKSB7XG4gICAgY29uc3Qgcm5TYW1wbGVyID0gbmV3IFNhbXBsZXIoZW5naW5lLCB7XG4gICAgICBtYWdGaWx0ZXI6IElzLmV4aXN0KHNhbXBsZXIubWFnRmlsdGVyKSA/IFRleHR1cmVQYXJhbWV0ZXIuZnJvbShzYW1wbGVyLm1hZ0ZpbHRlcikgOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgIG1pbkZpbHRlcjogSXMuZXhpc3Qoc2FtcGxlci5taW5GaWx0ZXIpID8gVGV4dHVyZVBhcmFtZXRlci5mcm9tKHNhbXBsZXIubWluRmlsdGVyKSA6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgd3JhcFM6IElzLmV4aXN0KHNhbXBsZXIud3JhcFMpID8gVGV4dHVyZVBhcmFtZXRlci5mcm9tKHNhbXBsZXIud3JhcFMpIDogVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQsXG4gICAgICB3cmFwVDogSXMuZXhpc3Qoc2FtcGxlci53cmFwVCkgPyBUZXh0dXJlUGFyYW1ldGVyLmZyb20oc2FtcGxlci53cmFwVCkgOiBUZXh0dXJlUGFyYW1ldGVyLlJlcGVhdCxcbiAgICB9KTtcbiAgICByblNhbXBsZXIuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gcm5TYW1wbGVyO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIF9jcmVhdGVUZXh0dXJlKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGltYWdlOiBSbk0ySW1hZ2UsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHsgYXV0b0RldGVjdFRyYW5zcGFyZW5jeSA9IGZhbHNlIH0gPSB7fVxuICApIHtcbiAgICBjb25zdCBfb3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucztcblxuICAgIGNvbnN0IHJuVGV4dHVyZSA9IG5ldyBUZXh0dXJlKGVuZ2luZSk7XG4gICAgcm5UZXh0dXJlLmF1dG9EZXRlY3RUcmFuc3BhcmVuY3kgPSBhdXRvRGV0ZWN0VHJhbnNwYXJlbmN5O1xuXG4gICAgaWYgKGltYWdlLmltYWdlKSB7XG4gICAgICBjb25zdCBpbWFnZUVsZW0gPSBpbWFnZS5pbWFnZSBhcyBIVE1MSW1hZ2VFbGVtZW50O1xuICAgICAgYXdhaXQgcm5UZXh0dXJlLmdlbmVyYXRlVGV4dHVyZUZyb21JbWFnZShpbWFnZUVsZW0pO1xuICAgIH0gZWxzZSBpZiAoaW1hZ2UuYmFzaXMpIHtcbiAgICAgIGF3YWl0IHJuVGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tQmFzaXMoaW1hZ2UuYmFzaXMsIHt9KTtcbiAgICB9IGVsc2UgaWYgKGltYWdlLmt0eDIpIHtcbiAgICAgIGF3YWl0IHJuVGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tS1RYMihpbWFnZS5rdHgyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBpbWFnZSBmb3VuZCcpO1xuICAgIH1cblxuICAgIGlmIChpbWFnZS51cmkpIHtcbiAgICAgIHJuVGV4dHVyZS5uYW1lID0gaW1hZ2UudXJpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleHQgPSBpbWFnZS5taW1lVHlwZT8uc3BsaXQoJy8nKVsxXTtcbiAgICAgIHJuVGV4dHVyZS5uYW1lID0gaW1hZ2UubmFtZSA/PyBgVW50aXRsZWQuJHtleHR9YDtcbiAgICB9XG4gICAgcm5UZXh0dXJlLnRyeVRvU2V0VW5pcXVlTmFtZShyblRleHR1cmUubmFtZSwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gcm5UZXh0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgdGV4dHVyZSBhc3NpZ25tZW50cyBvZiB0aGUgUkhPRE9OSVRFX3JheW1hcmNoaW5nX21hdGVyaWFscyBleHRlbnNpb24uXG4gICAqXG4gICAqIFRoZSBleHRlbnNpb24gbWFwcyBhIHNoYWRlciBzZW1hbnRpYyB0byBhIGdsVEYgdGV4dHVyZSBpbmRleC4gQXBwbGljYXRpb25zIHJlYnVpbGQgdGhlXG4gICAqIHNoYXJlZCByYXltYXJjaGluZyBtYXRlcmlhbCBmcm9tIHRoZSBub2RlIGdyYXBocyBhZnRlciBpbXBvcnQgYW5kIHRoZW4gYXBwbHkgdGhlIHRleHR1cmVzXG4gICAqIHdpdGggTWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihzZW1hbnRpYywgdGV4dHVyZSwgc2FtcGxlcikuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcmV0dXJucyBPbmUgZW50cnkgcGVyIHZhbGlkIGFzc2lnbm1lbnQsIGluIGV4dGVuc2lvbiBvcmRlclxuICAgKi9cbiAgc3RhdGljIGdldFJheW1hcmNoaW5nTWF0ZXJpYWxUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsOiBSbk0yKToge1xuICAgIHNlbWFudGljOiBzdHJpbmc7XG4gICAgdGV4dHVyZUluZGV4OiBudW1iZXI7XG4gICAgc2FtcGxlckluZGV4PzogbnVtYmVyO1xuICB9W10ge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IChcbiAgICAgIGdsdGZNb2RlbC5leHRlbnNpb25zIGFzXG4gICAgICAgIHwge1xuICAgICAgICAgICAgUkhPRE9OSVRFX3JheW1hcmNoaW5nX21hdGVyaWFscz86IHtcbiAgICAgICAgICAgICAgdGV4dHVyZXM/OiB7IFtzZW1hbnRpYzogc3RyaW5nXTogeyBpbmRleD86IG51bWJlciB9IH07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfCB1bmRlZmluZWRcbiAgICApPy5SSE9ET05JVEVfcmF5bWFyY2hpbmdfbWF0ZXJpYWxzO1xuICAgIHJldHVybiB0aGlzLl9fZ2V0VmFsaWRSYXltYXJjaGluZ1RleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWwsIGV4dGVuc2lvbj8udGV4dHVyZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgcGVyLWNvbXBvbmVudCB0ZXh0dXJlIGFzc2lnbm1lbnRzIHN0b3JlZCBpbiB0aGUgYFJIT0RPTklURV9yYXltYXJjaGluZ2Agbm9kZVxuICAgKiBleHRlbnNpb25zLlxuICAgKlxuICAgKiBFYWNoIGFzc2lnbm1lbnQga2VlcHMgdGhlIGdsVEYgbm9kZSBpbmRleCwgd2hpY2ggdGhlIGltcG9ydGVyIGFsc28gc3RvcmVzIG9uIHRoZSBlbnRpdHlcbiAgICogKGBUYWdHbHRmMk5vZGVJbmRleGApLCBzbyBhbiBhcHBsaWNhdGlvbiBjYW4gYXBwbHkgdGhlIHRleHR1cmVzIHRvIHRoZSBtYXRlcmlhbCBpdCByZWJ1aWxkc1xuICAgKiBmb3IgdGhhdCBjb21wb25lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcmV0dXJucyBPbmUgZW50cnkgcGVyIHZhbGlkIGFzc2lnbm1lbnQsIGluIG5vZGUgYW5kIGV4dGVuc2lvbiBvcmRlclxuICAgKi9cbiAgc3RhdGljIGdldFJheW1hcmNoaW5nQ29tcG9uZW50VGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbDogUm5NMik6IHtcbiAgICBub2RlSW5kZXg6IG51bWJlcjtcbiAgICBzZW1hbnRpYzogc3RyaW5nO1xuICAgIHRleHR1cmVJbmRleDogbnVtYmVyO1xuICAgIHNhbXBsZXJJbmRleD86IG51bWJlcjtcbiAgfVtdIHtcbiAgICBjb25zdCByZXN1bHQ6IHsgbm9kZUluZGV4OiBudW1iZXI7IHNlbWFudGljOiBzdHJpbmc7IHRleHR1cmVJbmRleDogbnVtYmVyOyBzYW1wbGVySW5kZXg/OiBudW1iZXIgfVtdID0gW107XG4gICAgY29uc3Qgbm9kZXMgPSBnbHRmTW9kZWwubm9kZXMgPz8gW107XG4gICAgZm9yIChsZXQgbm9kZUluZGV4ID0gMDsgbm9kZUluZGV4IDwgbm9kZXMubGVuZ3RoOyBub2RlSW5kZXgrKykge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gKFxuICAgICAgICBub2Rlc1tub2RlSW5kZXhdLmV4dGVuc2lvbnMgYXNcbiAgICAgICAgICB8IHtcbiAgICAgICAgICAgICAgUkhPRE9OSVRFX3JheW1hcmNoaW5nPzoge1xuICAgICAgICAgICAgICAgIHRleHR1cmVzPzogeyBbc2VtYW50aWM6IHN0cmluZ106IHsgaW5kZXg/OiBudW1iZXIgfSB9O1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHwgdW5kZWZpbmVkXG4gICAgICApPy5SSE9ET05JVEVfcmF5bWFyY2hpbmc7XG4gICAgICBmb3IgKGNvbnN0IGFzc2lnbm1lbnQgb2YgdGhpcy5fX2dldFZhbGlkUmF5bWFyY2hpbmdUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsLCBleHRlbnNpb24/LnRleHR1cmVzKSkge1xuICAgICAgICByZXN1bHQucHVzaCh7IG5vZGVJbmRleCwgLi4uYXNzaWdubWVudCB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIGEgc2VtYW50aWMgdG8gdGV4dHVyZS1pbmRleCBtYXAgZG93biB0byBhc3NpZ25tZW50cyB3aG9zZSB0ZXh0dXJlIGFuZCBpbWFnZSBleGlzdC5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSB0ZXh0dXJlcyAtIFRoZSBleHRlbnNpb24ncyB0ZXh0dXJlIG1hcFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRWYWxpZFJheW1hcmNoaW5nVGV4dHVyZUFzc2lnbm1lbnRzKFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICB0ZXh0dXJlczogeyBbc2VtYW50aWM6IHN0cmluZ106IHsgaW5kZXg/OiBudW1iZXIgfSB9IHwgdW5kZWZpbmVkXG4gICk6IHsgc2VtYW50aWM6IHN0cmluZzsgdGV4dHVyZUluZGV4OiBudW1iZXI7IHNhbXBsZXJJbmRleD86IG51bWJlciB9W10ge1xuICAgIGlmICh0ZXh0dXJlcyA9PSBudWxsIHx8IHR5cGVvZiB0ZXh0dXJlcyAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgYXNzaWdubWVudHM6IHsgc2VtYW50aWM6IHN0cmluZzsgdGV4dHVyZUluZGV4OiBudW1iZXI7IHNhbXBsZXJJbmRleD86IG51bWJlciB9W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHNlbWFudGljIG9mIE9iamVjdC5rZXlzKHRleHR1cmVzKSkge1xuICAgICAgY29uc3QgdGV4dHVyZUluZGV4ID0gdGV4dHVyZXNbc2VtYW50aWNdPy5pbmRleDtcbiAgICAgIGlmICh0ZXh0dXJlSW5kZXggPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGdsdGZUZXh0dXJlID0gZ2x0Zk1vZGVsLnRleHR1cmVzPy5bdGV4dHVyZUluZGV4XTtcbiAgICAgIGNvbnN0IGltYWdlID0gZ2x0ZlRleHR1cmU/LnNvdXJjZSAhPSBudWxsID8gZ2x0Zk1vZGVsLmltYWdlcz8uW2dsdGZUZXh0dXJlLnNvdXJjZV0gOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoZ2x0ZlRleHR1cmUgPT0gbnVsbCB8fCBpbWFnZSA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYXNzaWdubWVudHMucHVzaCh7XG4gICAgICAgIHNlbWFudGljLFxuICAgICAgICB0ZXh0dXJlSW5kZXgsXG4gICAgICAgIHNhbXBsZXJJbmRleDogZ2x0ZlRleHR1cmUuc2FtcGxlcixcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXNzaWdubWVudHM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBSaG9kb25pdGUgdGV4dHVyZXMgYW5kIHNhbXBsZXJzIGZvciB0aGUgc2hhcmVkIHJheW1hcmNoaW5nIG1hdGVyaWFsJ3MgdGV4dHVyZVxuICAgKiBhc3NpZ25tZW50cyBzYXZlZCBpbiB0aGUgUkhPRE9OSVRFX3JheW1hcmNoaW5nX21hdGVyaWFscyBleHRlbnNpb24uXG4gICAqXG4gICAqIEFwcGx5IHRoZSByZXR1cm5lZCB0ZXh0dXJlcyB0byB0aGUgcmVidWlsdCBtYXRlcmlhbCB3aXRoXG4gICAqIE1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoc2VtYW50aWMsIHRleHR1cmUsIHNhbXBsZXIpLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgdGV4dHVyZXMgYW5kIHNhbXBsZXJzIGtleWVkIGJ5IHNoYWRlciBzZW1hbnRpY1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVJheW1hcmNoaW5nTWF0ZXJpYWxUZXh0dXJlcyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTJcbiAgKTogUHJvbWlzZTxNYXA8c3RyaW5nLCB7IHRleHR1cmU6IFRleHR1cmU7IHNhbXBsZXI/OiBTYW1wbGVyIH0+PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxzdHJpbmcsIHsgdGV4dHVyZTogVGV4dHVyZTsgc2FtcGxlcj86IFNhbXBsZXIgfT4oKTtcbiAgICBjb25zdCBhc3NpZ25tZW50cyA9IHRoaXMuZ2V0UmF5bWFyY2hpbmdNYXRlcmlhbFRleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWwpO1xuICAgIGZvciAoY29uc3QgeyBzZW1hbnRpYywgdGV4dHVyZUluZGV4LCBzYW1wbGVySW5kZXggfSBvZiBhc3NpZ25tZW50cykge1xuICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHRoaXMuX19jcmVhdGVSYXltYXJjaGluZ1RleHR1cmUoZW5naW5lLCBnbHRmTW9kZWwsIHRleHR1cmVJbmRleCwgc2FtcGxlckluZGV4KTtcbiAgICAgIGlmIChjcmVhdGVkICE9IG51bGwpIHtcbiAgICAgICAgcmVzdWx0LnNldChzZW1hbnRpYywgY3JlYXRlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBSaG9kb25pdGUgdGV4dHVyZXMgYW5kIHNhbXBsZXJzIGZvciB0aGUgcGVyLWNvbXBvbmVudCBhc3NpZ25tZW50cyBzYXZlZCBpbiBlYWNoXG4gICAqIGBSSE9ET05JVEVfcmF5bWFyY2hpbmdgIG5vZGUgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBUaGUgcmV0dXJuZWQgbWFwIGlzIGtleWVkIGJ5IGdsVEYgbm9kZSBpbmRleCAodGhlIGVudGl0eSdzIGBUYWdHbHRmMk5vZGVJbmRleGApLCB0aGVuIGJ5XG4gICAqIHNoYWRlciBzZW1hbnRpYy4gQXBwbHkgdGhlbSB0byB0aGUgbWF0ZXJpYWwgcmVidWlsdCBmb3IgdGhhdCBjb21wb25lbnQgd2l0aFxuICAgKiBNYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKHNlbWFudGljLCB0ZXh0dXJlLCBzYW1wbGVyKS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIHRleHR1cmVzIGFuZCBzYW1wbGVycyBrZXllZCBieSBub2RlIGluZGV4IGFuZCBzaGFkZXIgc2VtYW50aWNcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVSYXltYXJjaGluZ0NvbXBvbmVudFRleHR1cmVzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMlxuICApOiBQcm9taXNlPE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIHsgdGV4dHVyZTogVGV4dHVyZTsgc2FtcGxlcj86IFNhbXBsZXIgfT4+PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxudW1iZXIsIE1hcDxzdHJpbmcsIHsgdGV4dHVyZTogVGV4dHVyZTsgc2FtcGxlcj86IFNhbXBsZXIgfT4+KCk7XG4gICAgY29uc3QgYXNzaWdubWVudHMgPSB0aGlzLmdldFJheW1hcmNoaW5nQ29tcG9uZW50VGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbCk7XG4gICAgZm9yIChjb25zdCB7IG5vZGVJbmRleCwgc2VtYW50aWMsIHRleHR1cmVJbmRleCwgc2FtcGxlckluZGV4IH0gb2YgYXNzaWdubWVudHMpIHtcbiAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0aGlzLl9fY3JlYXRlUmF5bWFyY2hpbmdUZXh0dXJlKGVuZ2luZSwgZ2x0Zk1vZGVsLCB0ZXh0dXJlSW5kZXgsIHNhbXBsZXJJbmRleCk7XG4gICAgICBpZiAoY3JlYXRlZCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbGV0IG5vZGVUZXh0dXJlcyA9IHJlc3VsdC5nZXQobm9kZUluZGV4KTtcbiAgICAgIGlmIChub2RlVGV4dHVyZXMgPT0gbnVsbCkge1xuICAgICAgICBub2RlVGV4dHVyZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHJlc3VsdC5zZXQobm9kZUluZGV4LCBub2RlVGV4dHVyZXMpO1xuICAgICAgfVxuICAgICAgbm9kZVRleHR1cmVzLnNldChzZW1hbnRpYywgY3JlYXRlZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBvbmUgUmhvZG9uaXRlIHRleHR1cmUgKGFuZCBzYW1wbGVyKSBmcm9tIGEgZ2xURiB0ZXh0dXJlIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIHRleHR1cmVJbmRleCAtIFRoZSBnbFRGIHRleHR1cmUgaW5kZXhcbiAgICogQHBhcmFtIHNhbXBsZXJJbmRleCAtIFRoZSBnbFRGIHNhbXBsZXIgaW5kZXggb2YgdGhlIHRleHR1cmVcbiAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgdGV4dHVyZSBhbmQgc2FtcGxlciwgb3IgbnVsbCB3aGVuIGNyZWF0aW9uIGZhaWxzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyBfX2NyZWF0ZVJheW1hcmNoaW5nVGV4dHVyZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgdGV4dHVyZUluZGV4OiBudW1iZXIsXG4gICAgc2FtcGxlckluZGV4PzogbnVtYmVyXG4gICk6IFByb21pc2U8eyB0ZXh0dXJlOiBUZXh0dXJlOyBzYW1wbGVyPzogU2FtcGxlciB9IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBnbHRmVGV4dHVyZSA9IGdsdGZNb2RlbC50ZXh0dXJlcyFbdGV4dHVyZUluZGV4XTtcbiAgICAgIGNvbnN0IGltYWdlID0gZ2x0Zk1vZGVsLmltYWdlcyFbZ2x0ZlRleHR1cmUuc291cmNlIV07XG4gICAgICBjb25zdCB0ZXh0dXJlID0gYXdhaXQgdGhpcy5fY3JlYXRlVGV4dHVyZShlbmdpbmUsIGltYWdlLCBnbHRmTW9kZWwpO1xuICAgICAgbGV0IHNhbXBsZXI6IFNhbXBsZXIgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2FtcGxlckluZGV4ICE9IG51bGwgJiYgZ2x0Zk1vZGVsLnNhbXBsZXJzPy5bc2FtcGxlckluZGV4XSAhPSBudWxsKSB7XG4gICAgICAgIHNhbXBsZXIgPSB0aGlzLl9jcmVhdGVTYW1wbGVyKGVuZ2luZSwgZ2x0Zk1vZGVsLnNhbXBsZXJzW3NhbXBsZXJJbmRleF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgdGV4dHVyZSwgc2FtcGxlciB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSB0aGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgdGV4dHVyZSBmb3IgdGV4dHVyZSAke3RleHR1cmVJbmRleH06ICR7U3RyaW5nKGVycm9yKX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19uZWVkUmVzaXplVG9Qb3dlck9mVHdvT25XZWJHbDEodGV4dHVyZU9wdGlvbjogYW55KSB7XG4gICAgaWYgKFxuICAgICAgdGV4dHVyZU9wdGlvbi53cmFwUyAhPT0gVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSB8fFxuICAgICAgdGV4dHVyZU9wdGlvbi53cmFwVCAhPT0gVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSB8fFxuICAgICAgKHRleHR1cmVPcHRpb24ubWluRmlsdGVyICE9PSBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhciAmJiB0ZXh0dXJlT3B0aW9uLm1pbkZpbHRlciAhPT0gVGV4dHVyZVBhcmFtZXRlci5OZWFyZXN0KVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19zaXplSXNQb3dlck9mVHdvKGltYWdlOiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgY29uc3Qgd2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG5cbiAgICBpZiAoKHdpZHRoICYgKHdpZHRoIC0gMSkpID09PSAwICYmIChoZWlnaHQgJiAoaGVpZ2h0IC0gMSkpID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19uZWVkUGFyYW1ldGVySW5pdGlhbGl6YXRpb24obWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsIF9tYXRlcmlhbFR5cGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAobWF0ZXJpYWxKc29uID09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX2NoZWNrUm5HbHRmTG9hZGVyT3B0aW9uc0V4aXN0KGdsdGZNb2RlbDogUm5NMikge1xuICAgIGlmIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Jld3JhcFdpdGhUeXBlZEFycmF5KHR5cGVkQXJyYXlDbGFzczogYW55LCB1aW50OEFycmF5OiBVaW50OEFycmF5LCBieXRlT2Zmc2V0OiBCeXRlLCBsZW5ndGg6IFNpemUpIHtcbiAgICByZXR1cm4gbmV3IHR5cGVkQXJyYXlDbGFzcyh1aW50OEFycmF5LmJ1ZmZlciBhcyBBcnJheUJ1ZmZlciwgYnl0ZU9mZnNldCArIHVpbnQ4QXJyYXkuYnl0ZU9mZnNldCwgbGVuZ3RoKTtcbiAgfVxuXG4gIHN0YXRpYyBfY2hlY2tCeXRlc1BlckNvbXBvbmVudChhY2Nlc3NvcjogUm5NMkFjY2Vzc29yIHwgUm5NMlNwYXJzZUluZGljZXMpIHtcbiAgICBsZXQgYnl0ZXNQZXJDb21wb25lbnQgPSAwO1xuICAgIHN3aXRjaCAoYWNjZXNzb3IuY29tcG9uZW50VHlwZSkge1xuICAgICAgY2FzZSA1MTIwOiAvLyBnbC5CWVRFXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjE6IC8vIGdsLlVOU0lHTkVEX0JZVEVcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMjogLy8gZ2wuU0hPUlRcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSAyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMzogLy8gZ2wuVU5TSUdORURfU0hPUlRcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSAyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNDogLy8gZ2wuSU5UXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjU6IC8vIGdsLlVOU0lHTkVEX0lOVFxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI2OiAvLyBnbC5GTE9BVFxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBieXRlc1BlckNvbXBvbmVudDtcbiAgfVxuXG4gIHN0YXRpYyBfY2hlY2tDb21wb25lbnROdW1iZXIoYWNjZXNzb3I6IFJuTTJBY2Nlc3Nvcikge1xuICAgIGxldCBjb21wb25lbnROID0gMDtcbiAgICBzd2l0Y2ggKGFjY2Vzc29yLnR5cGUpIHtcbiAgICAgIGNhc2UgJ1NDQUxBUic6XG4gICAgICAgIGNvbXBvbmVudE4gPSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1ZFQzInOlxuICAgICAgICBjb21wb25lbnROID0gMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdWRUMzJzpcbiAgICAgICAgY29tcG9uZW50TiA9IDM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnVkVDNCc6XG4gICAgICAgIGNvbXBvbmVudE4gPSA0O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ01BVDQnOlxuICAgICAgICBjb21wb25lbnROID0gMTY7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBjb21wb25lbnROO1xuICB9XG5cbiAgc3RhdGljIF9jaGVja0RhdGFWaWV3TWV0aG9kKGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IgfCBSbk0yU3BhcnNlSW5kaWNlcykge1xuICAgIGxldCBkYXRhVmlld01ldGhvZCA9ICcnO1xuICAgIHN3aXRjaCAoYWNjZXNzb3IuY29tcG9uZW50VHlwZSkge1xuICAgICAgY2FzZSA1MTIwOiAvLyBnbC5CWVRFXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldEludDgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMTogLy8gZ2wuVU5TSUdORURfQllURVxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRVaW50OCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIyOiAvLyBnbC5TSE9SVFxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRJbnQxNic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIzOiAvLyBnbC5VTlNJR05FRF9TSE9SVFxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRVaW50MTYnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNDogLy8gZ2wuSU5UXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldEludDMyJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjU6IC8vIGdsLlVOU0lHTkVEX0lOVFxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRVaW50MzInO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNjogLy8gZ2wuRkxPQVRcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0RmxvYXQzMic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBkYXRhVmlld01ldGhvZDtcbiAgfVxuXG4gIHN0YXRpYyBfaXNTeXN0ZW1MaXR0bGVFbmRpYW4oKSB7XG4gICAgcmV0dXJuICEhbmV3IFVpbnQ4QXJyYXkobmV3IFVpbnQxNkFycmF5KFsweDAwZmZdKS5idWZmZXIpWzBdO1xuICB9XG5cbiAgc3RhdGljIF9yZWFkQmluYXJ5RnJvbUFjY2Vzc29yQW5kU2V0SXRUb0FjY2Vzc29yRXh0cmFzKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IsXG4gICAgcm5CdWZmZXJzPzogQnVmZmVyW11cbiAgKTogRmxvYXQzMkFycmF5IHtcbiAgICBjb25zdCBidWZmZXJWaWV3ID0gYWNjZXNzb3IuYnVmZmVyVmlld09iamVjdCE7XG4gICAgbGV0IGJ5dGVPZmZzZXRGcm9tQnVmZmVyOiBudW1iZXIgPSAoYnVmZmVyVmlldy5ieXRlT2Zmc2V0ID8/IDApICsgKGFjY2Vzc29yLmJ5dGVPZmZzZXQgPz8gMCk7XG4gICAgY29uc3QgYnVmZmVyID0gYnVmZmVyVmlldy5idWZmZXJPYmplY3QhO1xuICAgIGxldCB1aW50OEFycmF5OiBVaW50OEFycmF5ID0gYnVmZmVyLmJ1ZmZlciE7XG5cbiAgICBjb25zdCBjb21wb25lbnROID0gdGhpcy5fY2hlY2tDb21wb25lbnROdW1iZXIoYWNjZXNzb3IpO1xuICAgIGNvbnN0IGNvbXBvbmVudEJ5dGVzID0gdGhpcy5fY2hlY2tCeXRlc1BlckNvbXBvbmVudChhY2Nlc3Nvcik7XG4gICAgY29uc3QgZGF0YVZpZXdNZXRob2QgPSB0aGlzLl9jaGVja0RhdGFWaWV3TWV0aG9kKGFjY2Vzc29yKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGFjY2Vzc29yLmV4dHJhcykpIHtcbiAgICAgIGFjY2Vzc29yLmV4dHJhcyA9IHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXk6IG5ldyBGbG9hdDMyQXJyYXkoKSxcbiAgICAgICAgY29tcG9uZW50TjogMCxcbiAgICAgICAgY29tcG9uZW50Qnl0ZXM6IDQsXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kOiAnJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZm9yIHdlaWdodHMgYW5pbWF0aW9uIGFjY2Vzc29yLCBzZXQgY29tcG9uZW50TiBhcyB3ZWlnaHRzQXJyYXlMZW5ndGhcbiAgICBhY2Nlc3Nvci5leHRyYXMuY29tcG9uZW50TiA9IElzLmV4aXN0KGFjY2Vzc29yLmV4dHJhcz8ud2VpZ2h0c0FycmF5TGVuZ3RoKVxuICAgICAgPyBhY2Nlc3Nvci5leHRyYXMhLndlaWdodHNBcnJheUxlbmd0aFxuICAgICAgOiBjb21wb25lbnROO1xuICAgIGFjY2Vzc29yLmV4dHJhcy5jb21wb25lbnRCeXRlcyA9IGNvbXBvbmVudEJ5dGVzO1xuICAgIGFjY2Vzc29yLmV4dHJhcy5kYXRhVmlld01ldGhvZCA9IGRhdGFWaWV3TWV0aG9kO1xuXG4gICAgY29uc3QgYnl0ZUxlbmd0aCA9IGNvbXBvbmVudEJ5dGVzICogY29tcG9uZW50TiAqIGFjY2Vzc29yLmNvdW50O1xuXG4gICAgaWYgKElzLmV4aXN0KHJuQnVmZmVycykpIHtcbiAgICAgIGNvbnN0IHJuQnVmZmVyID0gcm5CdWZmZXJzW2FjY2Vzc29yLmJ1ZmZlclZpZXdPYmplY3QhLmJ1ZmZlciFdO1xuICAgICAgY29uc3Qgcm5CdWZmZXJWaWV3ID0gdGhpcy5fX2dldFJuQnVmZmVyVmlldyhidWZmZXJWaWV3LCBybkJ1ZmZlcik7XG4gICAgICBjb25zdCBybkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQWNjZXNzb3IoZW5naW5lLCBhY2Nlc3Nvciwgcm5CdWZmZXJWaWV3KTtcbiAgICAgIHVpbnQ4QXJyYXkgPSBybkFjY2Vzc29yLmdldFVpbnQ4QXJyYXkoKTtcbiAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyID0gMDtcbiAgICB9XG5cbiAgICBsZXQgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpIGFzIEZsb2F0MzJBcnJheTtcbiAgICBjb25zdCBudW1iZXJBcnJheTogbnVtYmVyW10gPSBbXTtcblxuICAgIGlmIChNb2RlbENvbnZlcnRlci5faXNTeXN0ZW1MaXR0bGVFbmRpYW4oKSkge1xuICAgICAgLy8gSWYgdGhpcyBwbGF0Zm9ybSBpcyBMaXR0bGUgRW5kaWFuIFN5c3RlbSxcbiAgICAgIC8vICAgdGhlIHVpbnQ4YXJyYXkgY2FuXG4gICAgICBsZXQgdHlwZWREYXRhQXJyYXk6IFR5cGVkQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KCk7XG4gICAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRGbG9hdDMyJykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IHRoaXMuX19yZXdyYXBXaXRoVHlwZWRBcnJheShcbiAgICAgICAgICBGbG9hdDMyQXJyYXksXG4gICAgICAgICAgdWludDhBcnJheSxcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQ4Jykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IG5ldyBJbnQ4QXJyYXkoXG4gICAgICAgICAgdWludDhBcnJheSBhcyB1bmtub3duIGFzIEFycmF5QnVmZmVyLFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQ4Jykge1xuICAgICAgICB0eXBlZERhdGFBcnJheSA9IG5ldyBVaW50OEFycmF5KFxuICAgICAgICAgIHVpbnQ4QXJyYXkgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQxNicpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSB0aGlzLl9fcmV3cmFwV2l0aFR5cGVkQXJyYXkoXG4gICAgICAgICAgSW50MTZBcnJheSxcbiAgICAgICAgICB1aW50OEFycmF5LFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQxNicpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSB0aGlzLl9fcmV3cmFwV2l0aFR5cGVkQXJyYXkoXG4gICAgICAgICAgVWludDE2QXJyYXksXG4gICAgICAgICAgdWludDhBcnJheSxcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQzMicpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSB0aGlzLl9fcmV3cmFwV2l0aFR5cGVkQXJyYXkoXG4gICAgICAgICAgSW50MzJBcnJheSxcbiAgICAgICAgICB1aW50OEFycmF5LFxuICAgICAgICAgIGJ5dGVPZmZzZXRGcm9tQnVmZmVyLFxuICAgICAgICAgIGJ5dGVMZW5ndGggLyBjb21wb25lbnRCeXRlc1xuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQzMicpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSB0aGlzLl9fcmV3cmFwV2l0aFR5cGVkQXJyYXkoXG4gICAgICAgICAgVWludDMyQXJyYXksXG4gICAgICAgICAgdWludDhBcnJheSxcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGZsb2F0MzJBcnJheSA9IHRoaXMuX19ub3JtYWxpemVUeXBlZEFycmF5VG9GbG9hdDMyQXJyYXkoZGF0YVZpZXdNZXRob2QsIHR5cGVkRGF0YUFycmF5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm9yIEJpZ0VuZGlhbiBwcm9jZXNzXG4gICAgICBjb25zdCBkYXRhVmlldzogYW55ID0gbmV3IERhdGFWaWV3KHVpbnQ4QXJyYXkuYnVmZmVyLCBieXRlT2Zmc2V0RnJvbUJ1ZmZlciArIHVpbnQ4QXJyYXkuYnl0ZU9mZnNldCwgYnl0ZUxlbmd0aCk7XG4gICAgICBjb25zdCBieXRlRGVsdGEgPSBjb21wb25lbnRCeXRlcyAqIGNvbXBvbmVudE47XG4gICAgICBjb25zdCBsaXR0bGVFbmRpYW4gPSB0cnVlO1xuICAgICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgYnl0ZUxlbmd0aDsgcG9zICs9IGJ5dGVEZWx0YSkge1xuICAgICAgICBzd2l0Y2ggKGFjY2Vzc29yLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdTQ0FMQVInOlxuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1ZFQzInOlxuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcyArIGNvbXBvbmVudEJ5dGVzLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1ZFQzMnOlxuICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcyArIGNvbXBvbmVudEJ5dGVzLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcyArIGNvbXBvbmVudEJ5dGVzICogMiwgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdWRUM0JzpcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcyArIGNvbXBvbmVudEJ5dGVzICogaSwgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdNQVQ0JzpcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MgKyBjb21wb25lbnRCeXRlcyAqIGksIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZsb2F0MzJBcnJheSA9IHRoaXMuX19ub3JtYWxpemVUeXBlZEFycmF5VG9GbG9hdDMyQXJyYXkoZGF0YVZpZXdNZXRob2QsIG51bWJlckFycmF5KTtcbiAgICB9XG5cbiAgICBhY2Nlc3Nvci5leHRyYXMhLnR5cGVkRGF0YUFycmF5ID0gZmxvYXQzMkFycmF5O1xuXG4gICAgcmV0dXJuIGZsb2F0MzJBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBub3JtYWxpemUgdmFsdWVzIG9mIFR5cGVkQXJyYXkgdG8gRmxvYXQzMkFycmF5XG4gICAqIFNlZTogdGhlIGxhc3QgcGFydCBvZiAzLjExLkFuaW1hdGlvbiBhdCBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI2FuaW1hdGlvbnNcbiAgICogQHBhcmFtIGRhdGFWaWV3TWV0aG9kXG4gICAqIEBwYXJhbSBudW1iZXJBcnJheVxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19ub3JtYWxpemVUeXBlZEFycmF5VG9GbG9hdDMyQXJyYXkoXG4gICAgZGF0YVZpZXdNZXRob2Q6IHN0cmluZyxcbiAgICBudW1iZXJBcnJheTogbnVtYmVyW10gfCBUeXBlZEFycmF5XG4gICk6IEZsb2F0MzJBcnJheSB7XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50OCcpIHtcbiAgICAgIHJldHVybiBEYXRhVXRpbC5ub3JtYWxpemVkSW50OEFycmF5VG9GbG9hdDMyQXJyYXkobnVtYmVyQXJyYXkgYXMgdW5rbm93biBhcyBJbnQ4QXJyYXkpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50OCcpIHtcbiAgICAgIHJldHVybiBEYXRhVXRpbC5ub3JtYWxpemVkVWludDhBcnJheVRvRmxvYXQzMkFycmF5KG51bWJlckFycmF5IGFzIHVua25vd24gYXMgVWludDhBcnJheSk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDE2Jykge1xuICAgICAgcmV0dXJuIERhdGFVdGlsLm5vcm1hbGl6ZWRJbnQxNkFycmF5VG9GbG9hdDMyQXJyYXkobnVtYmVyQXJyYXkgYXMgdW5rbm93biBhcyBJbnQxNkFycmF5KTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDE2Jykge1xuICAgICAgcmV0dXJuIERhdGFVdGlsLm5vcm1hbGl6ZWRVaW50MTZBcnJheVRvRmxvYXQzMkFycmF5KG51bWJlckFycmF5IGFzIHVua25vd24gYXMgVWludDE2QXJyYXkpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQzMicpIHtcbiAgICAgIC8vIHR5cGVkRGF0YUFycmF5ID0gbmV3IEludDMyQXJyYXkobnVtYmVyQXJyYXkpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ05vdCBjb25zaWRlcmVkJyk7XG4gICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSgpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50MzInKSB7XG4gICAgICAvLyB0eXBlZERhdGFBcnJheSA9IG5ldyBVaW50MzJBcnJheShudW1iZXJBcnJheSk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignTm90IGNvbnNpZGVyZWQnKTtcbiAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KCk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEZsb2F0MzInKSB7XG4gICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShudW1iZXJBcnJheSk7XG4gICAgfVxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb3QgY29uc2lkZXJlZCcpO1xuICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KCk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2FkZE9mZnNldFRvSW5kaWNlcyhtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgY29uc3QgcHJpbWl0aXZlTnVtYmVyID0gbWVzaENvbXBvbmVudC5tZXNoIS5nZXRQcmltaXRpdmVOdW1iZXIoKTtcbiAgICBsZXQgb2Zmc2V0U3VtID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByaW1pdGl2ZU51bWJlcjsgaSsrKSB7XG4gICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoQ29tcG9uZW50Lm1lc2ghLmdldFByaW1pdGl2ZUF0KGkpO1xuICAgICAgY29uc3QgaW5kaWNlc0FjY2Vzc29yID0gcHJpbWl0aXZlLmluZGljZXNBY2Nlc3NvcjtcbiAgICAgIGlmIChpbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudE51bWJlciA9IGluZGljZXNBY2Nlc3Nvci5lbGVtZW50Q291bnQ7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZWxlbWVudE51bWJlcjsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGosIHt9KTtcbiAgICAgICAgICBpbmRpY2VzQWNjZXNzb3Iuc2V0U2NhbGFyKGosIGluZGV4ICsgb2Zmc2V0U3VtLCB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgb2Zmc2V0U3VtICs9IGVsZW1lbnROdW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2UgYSBSbi5BY2Nlc3NvciBmcm9tIHRoZSBSbi5CdWZmZXJcbiAgICogIGZyb20gdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBHbHRmMkJ1ZmZlciwgR2x0ZjJCdWZmZXJWaWV3LCBhbmQgR2x0ZjJBY2Nlc3Nvci5cbiAgICogQHBhcmFtIGFjY2Vzc29yXG4gICAqIEBwYXJhbSBybkJ1ZmZlclxuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSbkFjY2Vzc29yKGVuZ2luZTogRW5naW5lLCBhY2Nlc3NvcjogUm5NMkFjY2Vzc29yLCBybkJ1ZmZlclZpZXc/OiBCdWZmZXJWaWV3KSB7XG4gICAgbGV0IHJuQWNjZXNzb3I6IEFjY2Vzc29yO1xuICAgIGlmIChybkJ1ZmZlclZpZXcgIT0gbnVsbCkge1xuICAgICAgcm5BY2Nlc3NvciA9IHJuQnVmZmVyVmlld1xuICAgICAgICAudGFrZUFjY2Vzc29yV2l0aEJ5dGVPZmZzZXQoe1xuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLmZyb21TdHJpbmcoYWNjZXNzb3IudHlwZSksXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5mcm9tKGFjY2Vzc29yLmNvbXBvbmVudFR5cGUpLFxuICAgICAgICAgIGNvdW50OiBhY2Nlc3Nvci5jb3VudCxcbiAgICAgICAgICBieXRlT2Zmc2V0SW5CdWZmZXJWaWV3OiBhY2Nlc3Nvci5ieXRlT2Zmc2V0ID8/IDAsXG4gICAgICAgICAgYnl0ZVN0cmlkZTogYWNjZXNzb3IuYnl0ZVN0cmlkZSxcbiAgICAgICAgICBtYXg6IGFjY2Vzc29yLm1heCxcbiAgICAgICAgICBtaW46IGFjY2Vzc29yLm1pbixcbiAgICAgICAgICBub3JtYWxpemVkOiBhY2Nlc3Nvci5ub3JtYWxpemVkLFxuICAgICAgICB9KVxuICAgICAgICAudW53cmFwRm9yY2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgYWNjZXNzb3IuYnVmZmVyVmlldyBpcyBub3QgZGVmaW5lZCwgdGhlIGFjY2Vzc29yIE1VU1QgYmUgaW5pdGlhbGl6ZWQgd2l0aCB6ZXJvcy5cbiAgICAgIC8vIFNlZTogaHR0cHM6Ly9yZWdpc3RyeS5raHJvbm9zLm9yZy9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI19hY2Nlc3Nvcl9idWZmZXJ2aWV3XG4gICAgICBjb25zdCBjb21wb3NpdGlvblR5cGUgPSBDb21wb3NpdGlvblR5cGUuZnJvbVN0cmluZyhhY2Nlc3Nvci50eXBlKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLmZyb20oYWNjZXNzb3IuY29tcG9uZW50VHlwZSk7XG4gICAgICBjb25zdCBieXRlTGVuZ3RoVG9OZWVkID1cbiAgICAgICAgYWNjZXNzb3IuY291bnQgKiBjb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgKiBjb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCk7XG4gICAgICBjb25zdCBybkJ1ZmZlciA9IGVuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5DUFVHZW5lcmljLCBieXRlTGVuZ3RoVG9OZWVkLCA0KTtcbiAgICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHJuQnVmZmVyXG4gICAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogYnl0ZUxlbmd0aFRvTmVlZCxcbiAgICAgICAgICBieXRlU3RyaWRlOiBjb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgKiBjb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCksXG4gICAgICAgIH0pXG4gICAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgICBybkFjY2Vzc29yID0gcm5CdWZmZXJWaWV3XG4gICAgICAgIC50YWtlQWNjZXNzb3Ioe1xuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogY29tcG9zaXRpb25UeXBlLFxuICAgICAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICAgICAgY291bnQ6IGFjY2Vzc29yLmNvdW50LFxuICAgICAgICAgIG1heDogYWNjZXNzb3IubWF4LFxuICAgICAgICAgIG1pbjogYWNjZXNzb3IubWluLFxuICAgICAgICAgIG5vcm1hbGl6ZWQ6IGFjY2Vzc29yLm5vcm1hbGl6ZWQsXG4gICAgICAgIH0pXG4gICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgIH1cblxuICAgIGlmIChJcy5leGlzdChhY2Nlc3Nvci5zcGFyc2UpKSB7XG4gICAgICB0aGlzLnNldFNwYXJzZUFjY2Vzc29yKGFjY2Vzc29yLCBybkFjY2Vzc29yKTtcbiAgICB9XG4gICAgcmV0dXJuIHJuQWNjZXNzb3I7XG4gIH1cblxuICAvKipcbiAgICogVGFrZSBhIFJuLkJ1ZmZlclZpZXcgYW5kIGEgUm4uQWNjZXNzb3IgZnJvbSB0aGUgUm4uQnVmZmVyXG4gICAqICBmcm9tIHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgR2x0ZjJCdWZmZXIsIEdsdGYyQnVmZmVyVmlldywgYW5kIEdsdGYyQWNjZXNzb3IuXG4gICAqIEBwYXJhbSBhY2Nlc3NvclxuICAgKiBAcGFyYW0gcm5CdWZmZXJcbiAgICogQHJldHVybnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvcihlbmdpbmU6IEVuZ2luZSwgYWNjZXNzb3I6IFJuTTJBY2Nlc3Nvciwgcm5CdWZmZXJzOiBCdWZmZXJbXSkge1xuICAgIGNvbnN0IGdsdGZCdWZmZXJWaWV3ID0gYWNjZXNzb3IuYnVmZmVyVmlld09iamVjdDtcbiAgICBsZXQgcm5CdWZmZXJWaWV3OiBCdWZmZXJWaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChnbHRmQnVmZmVyVmlldyAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkJ1ZmZlciA9IHJuQnVmZmVyc1tnbHRmQnVmZmVyVmlldy5idWZmZXIhXTtcbiAgICAgIHJuQnVmZmVyVmlldyA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXcoZ2x0ZkJ1ZmZlclZpZXcsIHJuQnVmZmVyKTtcbiAgICB9XG4gICAgY29uc3Qgcm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkFjY2Vzc29yKGVuZ2luZSwgYWNjZXNzb3IsIHJuQnVmZmVyVmlldyk7XG4gICAgcmV0dXJuIHJuQWNjZXNzb3I7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NvcHlSbkFjY2Vzc29yQW5kQnVmZmVyVmlld0Zvck1vcnBoRGF0YShlbmdpbmU6IEVuZ2luZSwgc3JjUm5BY2Nlc3NvcjogQWNjZXNzb3IpIHtcbiAgICBjb25zdCBieXRlU2l6ZSA9IHNyY1JuQWNjZXNzb3IuZWxlbWVudENvdW50ICogMyAvKiB2ZWM0ICovICogNDsgLyogYnl0ZXMgKi9cbiAgICBjb25zdCBkc3RSbkJ1ZmZlciA9IGVuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5HUFVWZXJ0ZXhEYXRhLCBieXRlU2l6ZSwgMTYpO1xuICAgIGNvbnN0IGRzdFJuQnVmZmVyVmlldyA9IGRzdFJuQnVmZmVyXG4gICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBieXRlU2l6ZSxcbiAgICAgICAgYnl0ZVN0cmlkZTogMyAvKiB2ZWM0ICovICogNCAvKiBieXRlcyAqLyxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgIGNvbnN0IGRzdFJuQWNjZXNzb3IgPSBkc3RSbkJ1ZmZlclZpZXdcbiAgICAgIC50YWtlQWNjZXNzb3Ioe1xuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb3VudDogc3JjUm5BY2Nlc3Nvci5lbGVtZW50Q291bnQsXG4gICAgICAgIG1heDogc3JjUm5BY2Nlc3Nvci5tYXgsXG4gICAgICAgIG1pbjogc3JjUm5BY2Nlc3Nvci5taW4sXG4gICAgICAgIG5vcm1hbGl6ZWQ6IHNyY1JuQWNjZXNzb3Iubm9ybWFsaXplZCxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgIGRzdFJuQWNjZXNzb3IuY29weUJ1ZmZlcihzcmNSbkFjY2Vzc29yKTtcblxuICAgIHJldHVybiBkc3RSbkFjY2Vzc29yO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190YWtlUm5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvckZvckRyYWNvKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IsXG4gICAgY29tcG9zaXRpb25OdW06IENvdW50LFxuICAgIHJuQnVmZmVyOiBCdWZmZXJcbiAgKSB7XG4gICAgY29uc3Qgcm5CdWZmZXJWaWV3ID0gcm5CdWZmZXJcbiAgICAgIC50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGFjY2Vzc29yLmNvdW50ICogY29tcG9zaXRpb25OdW0gKiA0LFxuICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgY29uc3Qgcm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkFjY2Vzc29yKGVuZ2luZSwgYWNjZXNzb3IsIHJuQnVmZmVyVmlldyk7XG4gICAgcmV0dXJuIHJuQWNjZXNzb3I7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldFJuQnVmZmVyVmlldyhybm0yYnVmZmVyVmlldzogUm5NMkJ1ZmZlclZpZXcsIHJuQnVmZmVyOiBCdWZmZXIpIHtcbiAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSBybkJ1ZmZlclxuICAgICAgLnRha2VCdWZmZXJWaWV3V2l0aEJ5dGVPZmZzZXQoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBybm0yYnVmZmVyVmlldy5ieXRlTGVuZ3RoLFxuICAgICAgICBieXRlU3RyaWRlOiBybm0yYnVmZmVyVmlldy5ieXRlU3RyaWRlID8/IDAsXG4gICAgICAgIGJ5dGVPZmZzZXQ6IHJubTJidWZmZXJWaWV3LmJ5dGVPZmZzZXQgPz8gMCxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgIHJldHVybiBybkJ1ZmZlclZpZXc7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEdlb21ldHJ5RnJvbURyYWNvQnVmZmVyKGRyYWNvOiBhbnksIGRlY29kZXI6IGFueSwgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSB7XG4gICAgY29uc3QgYnVmZmVyID0gbmV3IGRyYWNvLkRlY29kZXJCdWZmZXIoKTtcbiAgICBidWZmZXIuSW5pdChuZXcgSW50OEFycmF5KGFycmF5QnVmZmVyKSwgYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCk7XG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gZGVjb2Rlci5HZXRFbmNvZGVkR2VvbWV0cnlUeXBlKGJ1ZmZlcik7XG4gICAgbGV0IGRyYWNvR2VvbWV0cnk6IGFueTtcbiAgICBsZXQgZGVjb2RpbmdTdGF0dXM6IGFueTtcbiAgICBpZiAoZ2VvbWV0cnlUeXBlID09PSBkcmFjby5UUklBTkdVTEFSX01FU0gpIHtcbiAgICAgIGRyYWNvR2VvbWV0cnkgPSBuZXcgZHJhY28uTWVzaCgpO1xuICAgICAgZGVjb2RpbmdTdGF0dXMgPSBkZWNvZGVyLkRlY29kZUJ1ZmZlclRvTWVzaChidWZmZXIsIGRyYWNvR2VvbWV0cnkpO1xuICAgIH0gZWxzZSBpZiAoZ2VvbWV0cnlUeXBlID09PSBkcmFjby5QT0lOVF9DTE9VRCkge1xuICAgICAgZHJhY29HZW9tZXRyeSA9IG5ldyBkcmFjby5Qb2ludENsb3VkKCk7XG4gICAgICBkZWNvZGluZ1N0YXR1cyA9IGRlY29kZXIuRGVjb2RlQnVmZmVyVG9Qb2ludENsb3VkKGJ1ZmZlciwgZHJhY29HZW9tZXRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gJ1Vua25vd24gZ2VvbWV0cnkgdHlwZS4nO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoZXJyb3JNc2cpO1xuICAgIH1cblxuICAgIGRyYWNvR2VvbWV0cnkuZ2VvbWV0cnlUeXBlID0gZ2VvbWV0cnlUeXBlOyAvLyBzdG9yZVxuXG4gICAgaWYgKCFkZWNvZGluZ1N0YXR1cy5vaygpIHx8IGRyYWNvR2VvbWV0cnkucHRyID09PSAwKSB7XG4gICAgICBsZXQgZXJyb3JNc2cgPSAnRGVjb2RpbmcgZmFpbGVkOiAnO1xuICAgICAgZXJyb3JNc2cgKz0gZGVjb2RpbmdTdGF0dXMuZXJyb3JfbXNnKCk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcihlcnJvck1zZyk7XG4gICAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuICAgICAgZHJhY28uZGVzdHJveShkcmFjb0dlb21ldHJ5KTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIGRyYWNvLmRlc3Ryb3koYnVmZmVyKTtcblxuICAgIHJldHVybiBkcmFjb0dlb21ldHJ5O1xuICB9XG5cbiAgc3RhdGljIF9fZ2V0SW5kaWNlc0Zyb21EcmFjbyhkcmFjbzogYW55LCBkZWNvZGVyOiBhbnksIGRyYWNvR2VvbWV0cnk6IGFueSwgdHJpYW5nbGVTdHJpcERyYXdNb2RlOiBib29sZWFuKSB7XG4gICAgLy8gRm9yIG1lc2gsIHdlIG5lZWQgdG8gZ2VuZXJhdGUgdGhlIGZhY2VzLlxuICAgIGNvbnN0IGdlb21ldHJ5VHlwZSA9IGRyYWNvR2VvbWV0cnkuZ2VvbWV0cnlUeXBlO1xuICAgIGlmIChnZW9tZXRyeVR5cGUgIT09IGRyYWNvLlRSSUFOR1VMQVJfTUVTSCkge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG5cbiAgICBsZXQgaW5kaWNlczogVWludDMyQXJyYXkgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHJpYW5nbGVTdHJpcERyYXdNb2RlKSB7XG4gICAgICBjb25zdCBzdHJpcHNBcnJheSA9IG5ldyBkcmFjby5EcmFjb0ludDMyQXJyYXkoKTtcbiAgICAgIGRlY29kZXIuR2V0VHJpYW5nbGVTdHJpcHNGcm9tTWVzaChkcmFjb0dlb21ldHJ5LCBzdHJpcHNBcnJheSk7XG4gICAgICBpbmRpY2VzID0gbmV3IFVpbnQzMkFycmF5KHN0cmlwc0FycmF5LnNpemUoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmlwc0FycmF5LnNpemUoKTsgKytpKSB7XG4gICAgICAgIGluZGljZXNbaV0gPSBzdHJpcHNBcnJheS5HZXRWYWx1ZShpKTtcbiAgICAgIH1cbiAgICAgIGRyYWNvLmRlc3Ryb3koc3RyaXBzQXJyYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUUklBTkdMRVNcbiAgICAgIGNvbnN0IG51bUZhY2VzID0gZHJhY29HZW9tZXRyeS5udW1fZmFjZXMoKTtcbiAgICAgIGNvbnN0IG51bUluZGljZXMgPSBudW1GYWNlcyAqIDM7XG4gICAgICBpbmRpY2VzID0gbmV3IFVpbnQzMkFycmF5KG51bUluZGljZXMpO1xuICAgICAgY29uc3QgaWEgPSBuZXcgZHJhY28uRHJhY29JbnQzMkFycmF5KCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUZhY2VzOyArK2kpIHtcbiAgICAgICAgZGVjb2Rlci5HZXRGYWNlRnJvbU1lc2goZHJhY29HZW9tZXRyeSwgaSwgaWEpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGkgKiAzO1xuICAgICAgICBpbmRpY2VzW2luZGV4XSA9IGlhLkdldFZhbHVlKDApO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSBpYS5HZXRWYWx1ZSgxKTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDJdID0gaWEuR2V0VmFsdWUoMik7XG4gICAgICB9XG4gICAgICBkcmFjby5kZXN0cm95KGlhKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2RlY29kZURyYWNvKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByaW1pdGl2ZTogUm5NMlByaW1pdGl2ZSxcbiAgICBybkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBtYXA6IE1hcDxWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcsIEFjY2Vzc29yPlxuICApIHtcbiAgICBjb25zdCBidWZmZXJWaWV3ID0gZ2x0Zk1vZGVsLmJ1ZmZlclZpZXdzW3ByaW1pdGl2ZS5leHRlbnNpb25zPy5LSFJfZHJhY29fbWVzaF9jb21wcmVzc2lvbi5idWZmZXJWaWV3XTtcbiAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3KGJ1ZmZlclZpZXcsIHJuQnVmZmVyc1tidWZmZXJWaWV3LmJ1ZmZlciFdKTtcbiAgICBjb25zdCBhcnJheWJ1ZmZlck9mQnVmZmVyVmlldyA9IG5ldyBVaW50OEFycmF5KHJuQnVmZmVyVmlldy5nZXRVaW50OEFycmF5KCkpLmJ1ZmZlcjtcblxuICAgIGNvbnN0IGRyYWNvID0gbmV3IERyYWNvRGVjb2Rlck1vZHVsZSgpO1xuICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgZHJhY28uRGVjb2RlcigpO1xuICAgIGNvbnN0IGRyYWNvR2VvbWV0cnkgPSB0aGlzLl9fZ2V0R2VvbWV0cnlGcm9tRHJhY29CdWZmZXIoZHJhY28sIGRlY29kZXIsIGFycmF5YnVmZmVyT2ZCdWZmZXJWaWV3KTtcbiAgICBpZiAoZHJhY29HZW9tZXRyeSA9PSBudWxsKSB7XG4gICAgICBkcmFjby5kZXN0cm95KGRyYWNvR2VvbWV0cnkpO1xuICAgICAgZHJhY28uZGVzdHJveShkZWNvZGVyKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuXG4gICAgY29uc3QgbnVtUG9pbnRzID0gZHJhY29HZW9tZXRyeS5udW1fcG9pbnRzKCk7XG4gICAgY29uc3Qgcm5CdWZmZXJGb3JEcmFjbyA9IHRoaXMuX19jcmVhdGVCdWZmZXJGb3JEZWNvbXByZXNzZWREYXRhKHByaW1pdGl2ZSwgbnVtUG9pbnRzKTtcblxuICAgIC8vIGRlY29kZSBpbmRpY2VzXG4gICAgY29uc3QgcHJpbWl0aXZlTW9kZSA9IFByaW1pdGl2ZU1vZGUuZnJvbShwcmltaXRpdmUubW9kZSEpO1xuICAgIGxldCBpc1RyaWFuZ2xlU3RyaXAgPSBmYWxzZTtcbiAgICBpZiAocHJpbWl0aXZlTW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZVN0cmlwKSB7XG4gICAgICBpc1RyaWFuZ2xlU3RyaXAgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLl9fZ2V0SW5kaWNlc0Zyb21EcmFjbyhkcmFjbywgZGVjb2RlciwgZHJhY29HZW9tZXRyeSwgaXNUcmlhbmdsZVN0cmlwKSE7XG4gICAgY29uc3QgaW5kaWNlc1JuQWNjZXNzb3IgPSB0aGlzLl9fdGFrZVJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3JGb3JEcmFjbyhcbiAgICAgIGVuZ2luZSxcbiAgICAgIHByaW1pdGl2ZS5pbmRpY2VzT2JqZWN0ISxcbiAgICAgIDEsXG4gICAgICBybkJ1ZmZlckZvckRyYWNvXG4gICAgKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGluZGljZXNSbkFjY2Vzc29yLnNldFNjYWxhcihpLCBpbmRpY2VzW2ldLCB7fSk7XG4gICAgfVxuXG4gICAgLy8gZGVjb2RlIGF0dHJpYnV0ZXNcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGRyYWNvQXR0cmlidXRlSWQgPSBwcmltaXRpdmUuZXh0ZW5zaW9ucz8uS0hSX2RyYWNvX21lc2hfY29tcHJlc3Npb24uYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcblxuICAgICAgY29uc3QgYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVzT2JqZWN0cyFbYXR0cmlidXRlTmFtZV07XG4gICAgICBsZXQgYXR0cmlidXRlUm5BY2Nlc3NvcjogQWNjZXNzb3IgfCB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChJcy5ub3QuZXhpc3QoZHJhY29BdHRyaWJ1dGVJZCkpIHtcbiAgICAgICAgLy8gbm9uLWVuY29kZWQgZGF0YVxuXG4gICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvcihlbmdpbmUsIGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IhLCBybkJ1ZmZlcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZW5jb2RlZCBkYXRhXG5cbiAgICAgICAgY29uc3QgY29tcG9zaXRpb25OdW0gPSBDb21wb3NpdGlvblR5cGUuZnJvbVN0cmluZyhhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yIS50eXBlKS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3NvciA9IHRoaXMuX190YWtlUm5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvckZvckRyYWNvKFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICBhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yISxcbiAgICAgICAgICBjb21wb3NpdGlvbk51bSxcbiAgICAgICAgICBybkJ1ZmZlckZvckRyYWNvXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZHJhY29BdHRyaWJ1dGVQb2ludGVyID0gZGVjb2Rlci5HZXRBdHRyaWJ1dGVCeVVuaXF1ZUlkKGRyYWNvR2VvbWV0cnksIGRyYWNvQXR0cmlidXRlSWQpO1xuICAgICAgICBjb25zdCBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhID0gbmV3IGRyYWNvLkRyYWNvRmxvYXQzMkFycmF5KCk7XG4gICAgICAgIGRlY29kZXIuR2V0QXR0cmlidXRlRmxvYXRGb3JBbGxQb2ludHMoZHJhY29HZW9tZXRyeSwgZHJhY29BdHRyaWJ1dGVQb2ludGVyLCBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVBvaW50czsgaSsrKSB7XG4gICAgICAgICAgaWYgKGNvbXBvc2l0aW9uTnVtID09PSAxKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yLnNldFNjYWxhcihpLCBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSksIHt9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBvc2l0aW9uTnVtID09PSAyKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yLnNldFZlYzIoXG4gICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAxKSxcbiAgICAgICAgICAgICAge31cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjb21wb3NpdGlvbk51bSA9PT0gMykge1xuICAgICAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3Nvci5zZXRWZWMzKFxuICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMSksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMiksXG4gICAgICAgICAgICAgIHt9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25OdW0gPT09IDQpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3Iuc2V0VmVjNChcbiAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0pLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDEpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDIpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDMpLFxuICAgICAgICAgICAgICB7fVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkcmFjby5kZXN0cm95KGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEpO1xuICAgICAgfVxuXG4gICAgICBpZiAoSXMuZXhpc3QoYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciEuc3BhcnNlKSkge1xuICAgICAgICB0aGlzLnNldFNwYXJzZUFjY2Vzc29yKGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IhLCBhdHRyaWJ1dGVSbkFjY2Vzc29yISk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGpvaW5lZFN0cmluZyA9IFZlcnRleEF0dHJpYnV0ZS50b1ZlcnRleEF0dHJpYnV0ZVNlbWFudGljSm9pbmVkU3RyaW5nQXNHbHRmU3R5bGUoXG4gICAgICAgIFZlcnRleEF0dHJpYnV0ZS5mcm9tU3RyaW5nKGF0dHJpYnV0ZU5hbWUpXG4gICAgICApO1xuICAgICAgbWFwLnNldChqb2luZWRTdHJpbmcsIGF0dHJpYnV0ZVJuQWNjZXNzb3IhKTtcbiAgICB9XG5cbiAgICBkcmFjby5kZXN0cm95KGRyYWNvR2VvbWV0cnkpO1xuICAgIGRyYWNvLmRlc3Ryb3koZGVjb2Rlcik7XG5cbiAgICByZXR1cm4gaW5kaWNlc1JuQWNjZXNzb3I7XG4gIH1cblxuICBzdGF0aWMgX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICB0ZXh0dXJlSnNvbjogUm5NMlRleHR1cmVJbmZvLFxuICAgIHJuTWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIHRleHR1cmVUcmFuc2Zvcm1TY2FsZVNoYWRlclNlbWFudGljOiBTaGFkZXJTZW1hbnRpY3NOYW1lLFxuICAgIHRleHR1cmVUcmFuc2Zvcm1PZmZzZXRTaGFkZXJTZW1hbnRpYzogU2hhZGVyU2VtYW50aWNzTmFtZSxcbiAgICB0ZXh0dXJlVHJhbnNmb3JtUm90YXRpb25TaGFkZXJTZW1hbnRpYzogU2hhZGVyU2VtYW50aWNzTmFtZVxuICApIHtcbiAgICBpZiAodGV4dHVyZUpzb24/LmV4dGVuc2lvbnM/LktIUl90ZXh0dXJlX3RyYW5zZm9ybSkge1xuICAgICAgY29uc3QgdHJhbnNmb3JtU2NhbGUgPSBNdXRhYmxlVmVjdG9yMi5mcm9tQ29weUFycmF5KFsxLjAsIDEuMF0pO1xuICAgICAgY29uc3QgdHJhbnNmb3JtT2Zmc2V0ID0gTXV0YWJsZVZlY3RvcjIuZnJvbUNvcHlBcnJheShbMC4wLCAwLjBdKTtcbiAgICAgIGxldCByb3RhdGlvbiA9IDA7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybUpzb24gPSB0ZXh0dXJlSnNvbi5leHRlbnNpb25zLktIUl90ZXh0dXJlX3RyYW5zZm9ybTtcbiAgICAgIGlmICh0cmFuc2Zvcm1Kc29uLnNjYWxlICE9IG51bGwpIHtcbiAgICAgICAgdHJhbnNmb3JtU2NhbGUueCA9IHRyYW5zZm9ybUpzb24uc2NhbGVbMF07XG4gICAgICAgIHRyYW5zZm9ybVNjYWxlLnkgPSB0cmFuc2Zvcm1Kc29uLnNjYWxlWzFdO1xuICAgICAgfVxuICAgICAgaWYgKHRyYW5zZm9ybUpzb24ub2Zmc2V0ICE9IG51bGwpIHtcbiAgICAgICAgdHJhbnNmb3JtT2Zmc2V0LnggPSB0cmFuc2Zvcm1Kc29uLm9mZnNldFswXTtcbiAgICAgICAgdHJhbnNmb3JtT2Zmc2V0LnkgPSB0cmFuc2Zvcm1Kc29uLm9mZnNldFsxXTtcbiAgICAgIH1cbiAgICAgIGlmICh0cmFuc2Zvcm1Kc29uLnJvdGF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1Kc29uLnJvdGF0aW9uO1xuICAgICAgfVxuXG4gICAgICBybk1hdGVyaWFsLnNldFBhcmFtZXRlcih0ZXh0dXJlVHJhbnNmb3JtU2NhbGVTaGFkZXJTZW1hbnRpYywgdHJhbnNmb3JtU2NhbGUpO1xuICAgICAgcm5NYXRlcmlhbC5zZXRQYXJhbWV0ZXIodGV4dHVyZVRyYW5zZm9ybU9mZnNldFNoYWRlclNlbWFudGljLCB0cmFuc2Zvcm1PZmZzZXQpO1xuICAgICAgcm5NYXRlcmlhbC5zZXRQYXJhbWV0ZXIodGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uU2hhZGVyU2VtYW50aWMsIHJvdGF0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZUJ1ZmZlckZvckRlY29tcHJlc3NlZERhdGEocHJpbWl0aXZlOiBSbk0yUHJpbWl0aXZlLCBudW1Qb2ludHM6IG51bWJlcik6IEJ1ZmZlciB7XG4gICAgbGV0IGJ5dGVMZW5ndGhPZkJ1ZmZlckZvckRyYWNvID0gMDtcblxuICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUuaW5kaWNlcykpIHtcbiAgICAgIGNvbnN0IGNvdW50ID0gcHJpbWl0aXZlLmluZGljZXNPYmplY3QhLmNvdW50O1xuICAgICAgYnl0ZUxlbmd0aE9mQnVmZmVyRm9yRHJhY28gKz0gY291bnQgKiA0O1xuICAgIH1cblxuICAgIGNvbnN0IGRyY0F0dHJpYnV0ZXMgPSBwcmltaXRpdmUuZXh0ZW5zaW9ucz8uS0hSX2RyYWNvX21lc2hfY29tcHJlc3Npb24uYXR0cmlidXRlcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmIChkcmNBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID09IG51bGwpIHtcbiAgICAgICAgLy8gbm9uLWVuY29kZWQgZGF0YVxuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhY2Nlc3NvciA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVzT2JqZWN0cyFbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBjb21wb3NpdGlvbk51bSA9IENvbXBvc2l0aW9uVHlwZS5mcm9tU3RyaW5nKGFjY2Vzc29yIS50eXBlKS5nZXROdW1iZXJPZkNvbXBvbmVudHMoKTtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZUJ5dGVMZW5ndGggPSBudW1Qb2ludHMgKiBjb21wb3NpdGlvbk51bSAqIDQ7XG4gICAgICBieXRlTGVuZ3RoT2ZCdWZmZXJGb3JEcmFjbyArPSBhdHRyaWJ1dGVCeXRlTGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQnVmZmVyKHtcbiAgICAgIGJ5dGVMZW5ndGg6IGJ5dGVMZW5ndGhPZkJ1ZmZlckZvckRyYWNvLFxuICAgICAgYnVmZmVyOiBuZXcgQXJyYXlCdWZmZXIoYnl0ZUxlbmd0aE9mQnVmZmVyRm9yRHJhY28pLFxuICAgICAgbmFtZTogJ0RyYWNvJyxcbiAgICAgIGJ5dGVBbGlnbjogNCxcbiAgICAgIGJ1ZmZlclVzYWdlOiBCdWZmZXJVc2UuQ1BVR2VuZXJpYyxcbiAgICAgIGluZGV4T2ZUaGVCdWZmZXJVc2FnZTogMCxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgTVRvb24gMS4wIG1hdGVyaWFsIHBhcmFtZXRlcnMgZnJvbSBWUk0gbWF0ZXJpYWwgZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgVlJNIDEuMCBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cE1Ub29uMShcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICBtYXRlcmlhbEpzb246IFZybTFfTWF0ZXJpYWwsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgbVRvb24gPSBtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucy5WUk1DX21hdGVyaWFsc19tdG9vbjtcblxuICB7XG4gICAgY29uc3Qgc2hhZGVDb2xvckZhY3RvciA9IG1Ub29uLnNoYWRlQ29sb3JGYWN0b3I7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkZUNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhzaGFkZUNvbG9yRmFjdG9yKSk7XG4gIH1cblxuICB7XG4gICAgY29uc3Qgc2hhZGVNdWx0aXBseVRleHR1cmUgPSBtVG9vbi5zaGFkZU11bHRpcGx5VGV4dHVyZTtcbiAgICBpZiAoc2hhZGVNdWx0aXBseVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tzaGFkZU11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc2hhZGVNdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc2hhZGVNdWx0aXBseVRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc2hhZGVNdWx0aXBseVRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRlTXVsdGlwbHlUZXhjb29yZEluZGV4Jywgc2hhZGVNdWx0aXBseVRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBjb25zdCBzaGFkaW5nU2hpZnRGYWN0b3IgPSBtVG9vbi5zaGFkaW5nU2hpZnRGYWN0b3I7XG4gICAgaWYgKHNoYWRpbmdTaGlmdEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRpbmdTaGlmdEZhY3RvcicsIHNoYWRpbmdTaGlmdEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBzaGFkaW5nU2hpZnRUZXh0dXJlID0gbVRvb24uc2hhZGluZ1NoaWZ0VGV4dHVyZTtcbiAgICBpZiAoc2hhZGluZ1NoaWZ0VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW3NoYWRpbmdTaGlmdFRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NoYWRpbmdTaGlmdFRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc2hhZGluZ1NoaWZ0VGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzaGFkaW5nU2hpZnRUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkaW5nU2hpZnRUZXhjb29yZEluZGV4Jywgc2hhZGluZ1NoaWZ0VGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUgPSBzaGFkaW5nU2hpZnRUZXh0dXJlLnNjYWxlO1xuICAgICAgaWYgKHNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZSAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlJywgc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHNoYWRpbmdUb29ueUZhY3RvciA9IG1Ub29uLnNoYWRpbmdUb29ueUZhY3RvcjtcbiAgICBpZiAoc2hhZGluZ1Rvb255RmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGluZ1Rvb255RmFjdG9yJywgc2hhZGluZ1Rvb255RmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IGdpRXF1YWxpemF0aW9uRmFjdG9yID0gbVRvb24uZ2lFcXVhbGl6YXRpb25GYWN0b3I7XG4gICAgaWYgKGdpRXF1YWxpemF0aW9uRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZ2lFcXVhbGl6YXRpb25GYWN0b3InLCBnaUVxdWFsaXphdGlvbkZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBtYXRjYXBUZXh0dXJlID0gbVRvb24ubWF0Y2FwVGV4dHVyZTtcbiAgICBpZiAobWF0Y2FwVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW21hdGNhcFRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW21hdGNhcFRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignbWF0Y2FwVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChtYXRjYXBUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdtYXRjYXBUZXhjb29yZEluZGV4JywgbWF0Y2FwVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBtYXRjYXBGYWN0b3IgPSBtVG9vbi5tYXRjYXBGYWN0b3I7XG4gICAgaWYgKG1hdGNhcEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21hdGNhcEZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMobWF0Y2FwRmFjdG9yKSk7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBwYXJhbWV0cmljUmltQ29sb3JGYWN0b3IgPSBtVG9vbi5wYXJhbWV0cmljUmltQ29sb3JGYWN0b3I7XG4gICAgaWYgKHBhcmFtZXRyaWNSaW1Db2xvckZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3BhcmFtZXRyaWNSaW1Db2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMocGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yKSk7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yID0gbVRvb24ucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcjtcbiAgICBpZiAocGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3BhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3InLCBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yID0gbVRvb24ucGFyYW1ldHJpY1JpbUxpZnRGYWN0b3I7XG4gICAgaWYgKHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncGFyYW1ldHJpY1JpbUxpZnRGYWN0b3InLCBwYXJhbWV0cmljUmltTGlmdEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCByaW1NdWx0aXBseVRleHR1cmUgPSBtVG9vbi5yaW1NdWx0aXBseVRleHR1cmU7XG4gICAgaWYgKHJpbU11bHRpcGx5VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW3JpbU11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbcmltTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3JpbU11bHRpcGx5VGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChyaW1NdWx0aXBseVRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3JpbU11bHRpcGx5VGV4Y29vcmRJbmRleCcsIHJpbU11bHRpcGx5VGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCByaW1MaWdodGluZ01peEZhY3RvciA9IG1Ub29uLnJpbUxpZ2h0aW5nTWl4RmFjdG9yO1xuICAgIGlmIChyaW1MaWdodGluZ01peEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3JpbUxpZ2h0aW5nTWl4RmFjdG9yJywgcmltTGlnaHRpbmdNaXhGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgb3V0bGluZVdpZHRoTW9kZSA9IG1Ub29uLm91dGxpbmVXaWR0aE1vZGU7XG4gICAgaWYgKG91dGxpbmVXaWR0aE1vZGUgIT0gbnVsbCkge1xuICAgICAgaWYgKG91dGxpbmVXaWR0aE1vZGUgPT09ICdub25lJykge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVXaWR0aE1vZGUnLCAwKTtcbiAgICAgIH0gZWxzZSBpZiAob3V0bGluZVdpZHRoTW9kZSA9PT0gJ3dvcmxkQ29vcmRpbmF0ZXMnKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZVdpZHRoTW9kZScsIDEpO1xuICAgICAgfSBlbHNlIGlmIChvdXRsaW5lV2lkdGhNb2RlID09PSAnc2NyZWVuQ29vcmRpbmF0ZXMnKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZVdpZHRoTW9kZScsIDIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgb3V0bGluZVdpZHRoRmFjdG9yID0gbVRvb24ub3V0bGluZVdpZHRoRmFjdG9yO1xuICAgIGlmIChvdXRsaW5lV2lkdGhGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lV2lkdGhGYWN0b3InLCBvdXRsaW5lV2lkdGhGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlID0gbVRvb24ub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlO1xuICAgIGlmIChvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW291dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBvdXRsaW5lQ29sb3JGYWN0b3IgPSBtVG9vbi5vdXRsaW5lQ29sb3JGYWN0b3I7XG4gICAgaWYgKG91dGxpbmVDb2xvckZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVDb2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMob3V0bGluZUNvbG9yRmFjdG9yKSk7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IgPSBtVG9vbi5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3I7XG4gICAgaWYgKG91dGxpbmVMaWdodGluZ01peEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVMaWdodGluZ01peEZhY3RvcicsIG91dGxpbmVMaWdodGluZ01peEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlID0gbVRvb24udXZBbmltYXRpb25NYXNrVGV4dHVyZTtcbiAgICBpZiAodXZBbmltYXRpb25NYXNrVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblRleHR1cmUgPSByblRleHR1cmVzW3V2QW5pbWF0aW9uTWFza1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3V2QW5pbWF0aW9uTWFza1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcigndXZBbmltYXRpb25NYXNrVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmICh1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd1dkFuaW1hdGlvbk1hc2tUZXhjb29yZEluZGV4JywgdXZBbmltYXRpb25NYXNrVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCB1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvciA9IG1Ub29uLnV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yO1xuICAgIGlmICh1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3V2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yJywgdXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgdXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgPSBtVG9vbi51dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcjtcbiAgICBpZiAodXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcicsIHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvciA9IG1Ub29uLnV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcjtcbiAgICBpZiAodXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yJywgdXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIFBCUiBtZXRhbGxpYy1yb3VnaG5lc3MgbWF0ZXJpYWwgcGFyYW1ldGVyc1xuICogQHBhcmFtIHBick1ldGFsbGljUm91Z2huZXNzIC0gVGhlIFBCUiBtZXRhbGxpYy1yb3VnaG5lc3MgZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSBvcHRpb25zIC0gTG9hZGVyIG9wdGlvbnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBQYnJNZXRhbGxpY1JvdWdobmVzcyhcbiAgcGJyTWV0YWxsaWNSb3VnaG5lc3M6IFJuTTJQYnJNZXRhbGxpY1JvdWdobmVzcyxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBnbHRmTW9kZWw6IFJuTTIsXG4gIG9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uIHwgdW5kZWZpbmVkLFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBpc1VubGl0ID0gbWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdW5saXQgIT0gbnVsbDtcblxuICBjb25zdCBiYXNlQ29sb3JGYWN0b3IgPSBwYnJNZXRhbGxpY1JvdWdobmVzcy5iYXNlQ29sb3JGYWN0b3I7XG4gIGlmIChiYXNlQ29sb3JGYWN0b3IgIT0gbnVsbCkge1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYmFzZUNvbG9yRmFjdG9yJywgVmVjdG9yNC5mcm9tQ29weUFycmF5NChiYXNlQ29sb3JGYWN0b3IpKTtcbiAgfVxuXG4gIC8vIEJhc2VDb2xvciBUZXh0dXJlXG4gIGNvbnN0IGJhc2VDb2xvclRleHR1cmUgPSBwYnJNZXRhbGxpY1JvdWdobmVzcy5iYXNlQ29sb3JUZXh0dXJlO1xuICBpZiAoYmFzZUNvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tiYXNlQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbYmFzZUNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignYmFzZUNvbG9yVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICBpZiAoYmFzZUNvbG9yVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2Jhc2VDb2xvclRleGNvb3JkSW5kZXgnLCBiYXNlQ29sb3JUZXh0dXJlLnRleENvb3JkKTtcbiAgICB9XG4gICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgIGJhc2VDb2xvclRleHR1cmUhLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICAnYmFzZUNvbG9yVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICdiYXNlQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICdiYXNlQ29sb3JUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgKTtcbiAgfVxuXG4gIC8vIEFtYmllbnQgT2NjbHVzaW9uIFRleHR1cmVcbiAgY29uc3Qgb2NjbHVzaW9uVGV4dHVyZSA9IG1hdGVyaWFsSnNvbi5vY2NsdXNpb25UZXh0dXJlO1xuICBpZiAob2NjbHVzaW9uVGV4dHVyZSAhPSBudWxsICYmIElzLmZhbHN5KGlzVW5saXQpKSB7XG4gICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tvY2NsdXNpb25UZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbb2NjbHVzaW9uVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignb2NjbHVzaW9uVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICBpZiAob2NjbHVzaW9uVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ29jY2x1c2lvblRleGNvb3JkSW5kZXgnLCBvY2NsdXNpb25UZXh0dXJlLnRleENvb3JkKTtcbiAgICB9XG4gICAgaWYgKG9jY2x1c2lvblRleHR1cmUuc3RyZW5ndGggIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvY2NsdXNpb25TdHJlbmd0aCcsIG9jY2x1c2lvblRleHR1cmUuc3RyZW5ndGgpO1xuICAgIH1cbiAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgb2NjbHVzaW9uVGV4dHVyZSxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgJ29jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAnb2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAnb2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICk7XG4gIH1cblxuICAvLyBNZXRhbGxpYyBGYWN0b3JcbiAgbGV0IG1ldGFsbGljRmFjdG9yID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MubWV0YWxsaWNGYWN0b3I7XG4gIG1ldGFsbGljRmFjdG9yID0gaXNVbmxpdCA/IDAgOiAobWV0YWxsaWNGYWN0b3IgPz8gMSk7XG4gIGxldCByb3VnaG5lc3NGYWN0b3IgPSBwYnJNZXRhbGxpY1JvdWdobmVzcy5yb3VnaG5lc3NGYWN0b3I7XG4gIHJvdWdobmVzc0ZhY3RvciA9IGlzVW5saXQgPyAxIDogKHJvdWdobmVzc0ZhY3RvciA/PyAxKTtcbiAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdtZXRhbGxpY0ZhY3RvcicsIG1ldGFsbGljRmFjdG9yKTtcbiAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyb3VnaG5lc3NGYWN0b3InLCByb3VnaG5lc3NGYWN0b3IpO1xuXG4gIC8vIE1ldGFsbGljIHJvdWdobmVzcyB0ZXh0dXJlXG4gIGNvbnN0IG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSA9IHBick1ldGFsbGljUm91Z2huZXNzLm1ldGFsbGljUm91Z2huZXNzVGV4dHVyZTtcbiAgaWYgKG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSAhPSBudWxsICYmIElzLmZhbHN5KGlzVW5saXQpKSB7XG4gICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1ttZXRhbGxpY1JvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1ttZXRhbGxpY1JvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZScsIHJuVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICBpZiAobWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbWV0YWxsaWNSb3VnaG5lc3NUZXhjb29yZEluZGV4JywgbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkKTtcbiAgICB9XG4gICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgIG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSEsXG4gICAgICBtYXRlcmlhbCxcbiAgICAgICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAnbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICApO1xuICB9XG5cbiAgLy8gaWYgKElzLmV4aXN0KG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZT8udGV4dHVyZT8uaW1hZ2U/LmltYWdlKSkge1xuICAvLyAgIGNvbnN0IGltYWdlID0gbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlIS50ZXh0dXJlIS5pbWFnZSEuaW1hZ2U7XG4gIC8vICAgY29uc3Qgd2lkdGggPSBpbWFnZS53aWR0aDtcbiAgLy8gICBjb25zdCBoZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG5cbiAgLy8gICBjb25zdCBtZXRhbGxpY1JvdWdobmVzc0NhbnZhcyA9IGNvbnZlcnRIVE1MSW1hZ2VFbGVtZW50VG9DYW52YXMoaW1hZ2UsIHdpZHRoLCBoZWlnaHQpO1xuICAvLyB9XG5cbiAgLy8gQ2xlYXJDb2F0XG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfY2xlYXJjb2F0KG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgLy8gVHJhbnNtaXNzaW9uXG4gIGNvbnN0IHRyYW5zbWlzc2lvbiA9IHNldHVwX0tIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG4gIGlmICghb3B0aW9ucyEudHJhbnNtaXNzaW9uKSB7XG4gICAgb3B0aW9ucyEudHJhbnNtaXNzaW9uID0gdHJhbnNtaXNzaW9uO1xuICB9XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc192b2x1bWUobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX3NoZWVuKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19zcGVjdWxhcihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfaW9yKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZShtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfYW5pc290cm9weShtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGgobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24obWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqIEByZXR1cm5zIFRydWUgaWYgdHJhbnNtaXNzaW9uIHdhcyBjb25maWd1cmVkXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uID0gbWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24pKSB7XG4gICAgY29uc3QgdHJhbnNtaXNzaW9uRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24udHJhbnNtaXNzaW9uRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbi50cmFuc21pc3Npb25GYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndHJhbnNtaXNzaW9uRmFjdG9yJywgdHJhbnNtaXNzaW9uRmFjdG9yKTtcblxuICAgIGNvbnN0IHRyYW5zbWlzc2lvblRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbi50cmFuc21pc3Npb25UZXh0dXJlO1xuICAgIGlmIChJcy5leGlzdCh0cmFuc21pc3Npb25UZXh0dXJlKSkge1xuICAgICAgY29uc3Qgcm5UcmFuc21pc3Npb25UZXh0dXJlID0gcm5UZXh0dXJlc1t0cmFuc21pc3Npb25UZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1t0cmFuc21pc3Npb25UZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3RyYW5zbWlzc2lvblRleHR1cmUnLCByblRyYW5zbWlzc2lvblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAodHJhbnNtaXNzaW9uVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndHJhbnNtaXNzaW9uVGV4Y29vcmRJbmRleCcsIHRyYW5zbWlzc2lvblRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgdHJhbnNtaXNzaW9uVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICd0cmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAndHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICd0cmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdCBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19jbGVhcmNvYXQoXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19jbGVhcmNvYXQgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfY2xlYXJjb2F0O1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19jbGVhcmNvYXQpKSB7XG4gICAgLy8gQ2xlYXJDb2F0IEZhY3RvclxuICAgIGNvbnN0IGNsZWFyY29hdEZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdEZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0RmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdEZhY3RvcicsIGNsZWFyY29hdEZhY3Rvcik7XG4gICAgLy8gQ2xlYXJDb2F0IFRleHR1cmVcbiAgICBjb25zdCBjbGVhcmNvYXRUZXh0dXJlID0gS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0VGV4dHVyZTtcbiAgICBpZiAoY2xlYXJjb2F0VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkNsZWFyQ29hdFRleHR1cmUgPSByblRleHR1cmVzW2NsZWFyY29hdFRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2NsZWFyY29hdFRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignY2xlYXJjb2F0VGV4dHVyZScsIHJuQ2xlYXJDb2F0VGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChjbGVhcmNvYXRUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdjbGVhcmNvYXRUZXhjb29yZEluZGV4JywgY2xlYXJjb2F0VGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBDbGVhckNvYXQgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGNsZWFyY29hdFRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnY2xlYXJjb2F0VGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2NsZWFyY29hdFRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnY2xlYXJjb2F0VGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgLy8gQ2xlYXJDb2F0IFJvdWdobmVzcyBGYWN0b3JcbiAgICBjb25zdCBjbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdFJvdWdobmVzc0ZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdjbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3InLCBjbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3IpO1xuICAgIC8vIENsZWFyQ29hdCBSb3VnaG5lc3MgVGV4dHVyZVxuICAgIGNvbnN0IGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlO1xuICAgIGlmIChjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZSA9IHJuVGV4dHVyZXNbY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlJywgcm5DbGVhckNvYXRSb3VnaG5lc3NUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdFJvdWdobmVzc1RleGNvb3JkSW5kZXgnLCBjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIENsZWFyQ29hdCBSb3VnaG5lc3MgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGNsZWFyY29hdFJvdWdobmVzc1RleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgLy8gQ2xlYXJDb2F0IE5vcm1hbCBUZXh0dXJlXG4gICAgY29uc3QgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdE5vcm1hbFRleHR1cmU7XG4gICAgaWYgKGNsZWFyY29hdE5vcm1hbFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5DbGVhckNvYXROb3JtYWxUZXh0dXJlID0gcm5UZXh0dXJlc1tjbGVhcmNvYXROb3JtYWxUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tjbGVhcmNvYXROb3JtYWxUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2NsZWFyY29hdE5vcm1hbFRleHR1cmUnLCBybkNsZWFyQ29hdE5vcm1hbFRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2xlYXJjb2F0Tm9ybWFsVGV4Y29vcmRJbmRleCcsIGNsZWFyY29hdE5vcm1hbFRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gQ2xlYXJDb2F0IE5vcm1hbCBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdjbGVhcmNvYXROb3JtYWxUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdjbGVhcmNvYXROb3JtYWxUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc192b2x1bWUgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfdm9sdW1lKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKTogdm9pZCB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfdm9sdW1lID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3ZvbHVtZTtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfdm9sdW1lKSkge1xuICAgIGNvbnN0IHRoaWNrbmVzc0ZhY3RvciA9IEtIUl9tYXRlcmlhbHNfdm9sdW1lLnRoaWNrbmVzc0ZhY3RvciA/IEtIUl9tYXRlcmlhbHNfdm9sdW1lLnRoaWNrbmVzc0ZhY3RvciA6IDAuMDtcbiAgICBpZiAodGhpY2tuZXNzRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndGhpY2tuZXNzRmFjdG9yJywgdGhpY2tuZXNzRmFjdG9yKTtcbiAgICB9XG4gICAgY29uc3QgdGhpY2tuZXNzVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfdm9sdW1lLnRoaWNrbmVzc1RleHR1cmU7XG4gICAgaWYgKHRoaWNrbmVzc1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UaGlja25lc3NUZXh0dXJlID0gcm5UZXh0dXJlc1t0aGlja25lc3NUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1t0aGlja25lc3NUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3RoaWNrbmVzc1RleHR1cmUnLCByblRoaWNrbmVzc1RleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAodGhpY2tuZXNzVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndGhpY2tuZXNzVGV4Y29vcmRJbmRleCcsIHRoaWNrbmVzc1RleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gVGhpY2tuZXNzIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICB0aGlja25lc3NUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3RoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICd0aGlja25lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3RoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IElORiA9IDFlMjA7XG4gICAgY29uc3QgYXR0ZW51YXRpb25EaXN0YW5jZSA9IEtIUl9tYXRlcmlhbHNfdm9sdW1lLmF0dGVudWF0aW9uRGlzdGFuY2VcbiAgICAgID8gS0hSX21hdGVyaWFsc192b2x1bWUuYXR0ZW51YXRpb25EaXN0YW5jZVxuICAgICAgOiBJTkY7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhdHRlbnVhdGlvbkRpc3RhbmNlJywgYXR0ZW51YXRpb25EaXN0YW5jZSk7XG4gICAgY29uc3QgYXR0ZW51YXRpb25Db2xvciA9IEtIUl9tYXRlcmlhbHNfdm9sdW1lLmF0dGVudWF0aW9uQ29sb3JcbiAgICAgID8gVmVjdG9yMy5mcm9tQ29weUFycmF5MyhLSFJfbWF0ZXJpYWxzX3ZvbHVtZS5hdHRlbnVhdGlvbkNvbG9yKVxuICAgICAgOiBWZWN0b3IzLmZyb21Db3B5MygxLjAsIDEuMCwgMS4wKTtcbiAgICBpZiAoYXR0ZW51YXRpb25Db2xvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2F0dGVudWF0aW9uQ29sb3InLCBhdHRlbnVhdGlvbkNvbG9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfc2hlZW4gZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfc2hlZW4oXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19zaGVlbiA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19zaGVlbjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc2hlZW4pKSB7XG4gICAgY29uc3Qgc2hlZW5Db2xvckZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Db2xvckZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlbkNvbG9yRmFjdG9yXG4gICAgICA6IFswLjAsIDAuMCwgMC4wXTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoZWVuQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKHNoZWVuQ29sb3JGYWN0b3IpKTtcbiAgICBjb25zdCBzaGVlbkNvbG9yVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Db2xvclRleHR1cmU7XG4gICAgaWYgKHNoZWVuQ29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuU2hlZW5Db2xvclRleHR1cmUgPSByblRleHR1cmVzW3NoZWVuQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzaGVlbkNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzaGVlbkNvbG9yVGV4dHVyZScsIHJuU2hlZW5Db2xvclRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc2hlZW5Db2xvclRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoZWVuQ29sb3JUZXhjb29yZEluZGV4Jywgc2hlZW5Db2xvclRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gU2hlZW4gQ29sb3IgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHNoZWVuQ29sb3JUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3NoZWVuQ29sb3JUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnc2hlZW5Db2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnc2hlZW5Db2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNoZWVuUm91Z2huZXNzRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlblJvdWdobmVzc0ZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlblJvdWdobmVzc0ZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGVlblJvdWdobmVzc0ZhY3RvcicsIHNoZWVuUm91Z2huZXNzRmFjdG9yKTtcbiAgICBjb25zdCBzaGVlblJvdWdobmVzc1RleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuUm91Z2huZXNzVGV4dHVyZTtcbiAgICBpZiAoc2hlZW5Sb3VnaG5lc3NUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuU2hlZW5Sb3VnaG5lc3NUZXh0dXJlID0gcm5UZXh0dXJlc1tzaGVlblJvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NoZWVuUm91Z2huZXNzVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzaGVlblJvdWdobmVzc1RleHR1cmUnLCByblNoZWVuUm91Z2huZXNzVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzaGVlblJvdWdobmVzc1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoZWVuUm91Z2huZXNzVGV4Y29vcmRJbmRleCcsIHNoZWVuUm91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBTaGVlbiBSb3VnaG5lc3MgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHNoZWVuUm91Z2huZXNzVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdzaGVlblJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdzaGVlblJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19zcGVjdWxhciBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19zcGVjdWxhcihcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3NwZWN1bGFyO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zcGVjdWxhcikpIHtcbiAgICBjb25zdCBzcGVjdWxhckZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJGYWN0b3JcbiAgICAgIDogMS4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc3BlY3VsYXJGYWN0b3InLCBzcGVjdWxhckZhY3Rvcik7XG4gICAgY29uc3Qgc3BlY3VsYXJUZXh0dXJlID0gS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhclRleHR1cmU7XG4gICAgaWYgKHNwZWN1bGFyVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblNwZWN1bGFyVGV4dHVyZSA9IHJuVGV4dHVyZXNbc3BlY3VsYXJUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzcGVjdWxhclRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc3BlY3VsYXJUZXh0dXJlJywgcm5TcGVjdWxhclRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc3BlY3VsYXJUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzcGVjdWxhclRleGNvb3JkSW5kZXgnLCBzcGVjdWxhclRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gU3BlY3VsYXIgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHNwZWN1bGFyVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdzcGVjdWxhclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdzcGVjdWxhclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnc3BlY3VsYXJUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBzcGVjdWxhckNvbG9yRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhckNvbG9yRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyQ29sb3JGYWN0b3JcbiAgICAgIDogWzEuMCwgMS4wLCAxLjBdO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc3BlY3VsYXJDb2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoc3BlY3VsYXJDb2xvckZhY3RvcikpO1xuICAgIGNvbnN0IHNwZWN1bGFyQ29sb3JUZXh0dXJlID0gS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhckNvbG9yVGV4dHVyZTtcbiAgICBpZiAoc3BlY3VsYXJDb2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5TcGVjdWxhckNvbG9yVGV4dHVyZSA9IHJuVGV4dHVyZXNbc3BlY3VsYXJDb2xvclRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NwZWN1bGFyQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NwZWN1bGFyQ29sb3JUZXh0dXJlJywgcm5TcGVjdWxhckNvbG9yVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChzcGVjdWxhckNvbG9yVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc3BlY3VsYXJDb2xvclRleGNvb3JkSW5kZXgnLCBzcGVjdWxhckNvbG9yVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBTcGVjdWxhciBDb2xvciBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgc3BlY3VsYXJDb2xvclRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnc3BlY3VsYXJDb2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdzcGVjdWxhckNvbG9yVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdzcGVjdWxhckNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfaW9yIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19pb3IobWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsIG1hdGVyaWFsOiBNYXRlcmlhbCwgX2dsdGZNb2RlbDogUm5NMikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2lvciA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19pb3I7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lvcikpIHtcbiAgICBjb25zdCBpb3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lvci5pb3IpID8gS0hSX21hdGVyaWFsc19pb3IuaW9yIDogMS41O1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaW9yJywgaW9yKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZShcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSkpIHtcbiAgICBjb25zdCBpcmlkZXNjZW5jZUZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VGYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VGYWN0b3InLCBpcmlkZXNjZW5jZUZhY3Rvcik7XG4gICAgY29uc3QgaXJpZGVzY2VuY2VUZXh0dXJlID0gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRleHR1cmU7XG4gICAgaWYgKGlyaWRlc2NlbmNlVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybklyaWRlc2NlbmNlVGV4dHVyZSA9IHJuVGV4dHVyZXNbaXJpZGVzY2VuY2VUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tpcmlkZXNjZW5jZVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignaXJpZGVzY2VuY2VUZXh0dXJlJywgcm5JcmlkZXNjZW5jZVRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoaXJpZGVzY2VuY2VUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRleGNvb3JkSW5kZXgnLCBpcmlkZXNjZW5jZVRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gSXJpZGVzY2VuY2UgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGlyaWRlc2NlbmNlVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdpcmlkZXNjZW5jZVRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnaXJpZGVzY2VuY2VUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBpcmlkZXNjZW5jZUlvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VJb3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VJb3JcbiAgICAgIDogMS4zO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VJb3InLCBpcmlkZXNjZW5jZUlvcik7XG5cbiAgICBjb25zdCBpcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0gPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bSlcbiAgICAgID8gS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW1cbiAgICAgIDogMTAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0nLCBpcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0pO1xuXG4gICAgY29uc3QgaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0pXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtXG4gICAgICA6IDQwMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtJywgaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtKTtcblxuICAgIGNvbnN0IGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlO1xuICAgIGlmIChpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5JcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUgPSByblRleHR1cmVzW2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZScsIHJuSXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VUaGlja25lc3NUZXhjb29yZEluZGV4JywgaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIElyaWRlc2NlbmNlIFRoaWNrbmVzcyBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfYW5pc290cm9weShcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfYW5pc290cm9weTtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfYW5pc290cm9weSkpIHtcbiAgICBjb25zdCBhbmlzb3Ryb3B5U3RyZW5ndGggPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkuYW5pc290cm9weVN0cmVuZ3RoKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkuYW5pc290cm9weVN0cmVuZ3RoXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2FuaXNvdHJvcHlTdHJlbmd0aCcsIGFuaXNvdHJvcHlTdHJlbmd0aCk7XG4gICAgY29uc3QgYW5pc290cm9weVJvdGF0aW9uID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5LmFuaXNvdHJvcHlSb3RhdGlvbilcbiAgICAgID8gS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5LmFuaXNvdHJvcHlSb3RhdGlvblxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKFxuICAgICAgJ2FuaXNvdHJvcHlSb3RhdGlvbicsXG4gICAgICBWZWN0b3IyLmZyb21Db3B5MihNYXRoLmNvcyhhbmlzb3Ryb3B5Um90YXRpb24pLCBNYXRoLnNpbihhbmlzb3Ryb3B5Um90YXRpb24pKVxuICAgICk7XG5cbiAgICBjb25zdCBhbmlzb3Ryb3B5VGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5VGV4dHVyZTtcbiAgICBpZiAoYW5pc290cm9weVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5Bbmlzb3Ryb3B5VGV4dHVyZSA9IHJuVGV4dHVyZXNbYW5pc290cm9weVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2FuaXNvdHJvcHlUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2FuaXNvdHJvcHlUZXh0dXJlJywgcm5Bbmlzb3Ryb3B5VGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChhbmlzb3Ryb3B5VGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYW5pc290cm9weVRleGNvb3JkSW5kZXgnLCBhbmlzb3Ryb3B5VGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBBbmlzb3Ryb3B5IFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBhbmlzb3Ryb3B5VGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdhbmlzb3Ryb3B5VGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2FuaXNvdHJvcHlUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2FuaXNvdHJvcHlUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aCBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGgobWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsIG1hdGVyaWFsOiBNYXRlcmlhbCwgX2dsdGZNb2RlbDogUm5NMikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aCkpIHtcbiAgICBjb25zdCBlbWlzc2l2ZVN0cmVuZ3RoID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aC5lbWlzc2l2ZVN0cmVuZ3RoKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoLmVtaXNzaXZlU3RyZW5ndGhcbiAgICAgIDogMS4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZW1pc3NpdmVTdHJlbmd0aCcsIGVtaXNzaXZlU3RyZW5ndGgpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24gZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24obWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsIG1hdGVyaWFsOiBNYXRlcmlhbCwgX2dsdGZNb2RlbDogUm5NMikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24gPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbikpIHtcbiAgICBjb25zdCBkaXNwZXJzaW9uID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uLmRpc3BlcnNpb24pID8gS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uLmRpc3BlcnNpb24gOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaXNwZXJzaW9uJywgZGlzcGVyc2lvbik7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24gZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24oXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbiA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24pKSB7XG4gICAgY29uc3QgZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3InLCBkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yKTtcbiAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmU7XG4gICAgaWYgKGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuRGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUgPSByblRleHR1cmVzW2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZScsIHJuRGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXhjb29yZEluZGV4JywgZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gRGlmZnVzZSBUcmFuc21pc3Npb24gVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvclxuICAgICAgOiBbMS4wLCAxLjAsIDEuMF07XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvcikpO1xuICAgIGNvbnN0IGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmU7XG4gICAgaWYgKGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5EaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlID0gcm5UZXh0dXJlc1tkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUnLCBybkRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4Y29vcmRJbmRleCcsIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gRGlmZnVzZSBUcmFuc21pc3Npb24gQ29sb3IgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQTtBQUFBLEVBSUU7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BQ0s7QUFzQlAsU0FBUywwQkFBMEI7QUFDbkMsU0FBUywrQkFBK0I7QUFDeEMsU0FBUywyQkFBMkI7QUFFcEMsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyx5QkFBeUI7QUFFbEMsU0FBUyx5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TUFBTztBQUMzRixZQUFNLFlBQVksV0FBVywyQkFBMkIsUUFBUyxPQUFRO0FBQ3pFLGVBQVMsb0JBQW9CLDhCQUE4Qiw4QkFBOEIsU0FBUztBQUNsRyxVQUFJLDJCQUEyQixZQUFZLE1BQU07QUFDL0MsaUJBQVMsYUFBYSxvQ0FBb0MsMkJBQTJCLFFBQVE7QUFBQSxNQUMvRjtBQUVBLHFCQUFlO0FBQUEsUUFDYjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFVBQU0saUNBQWlDLEdBQUcsTUFBTSxtQ0FBbUMsOEJBQThCLElBQzdHLG1DQUFtQyxpQ0FDbkMsQ0FBQyxHQUFLLEdBQUssQ0FBRztBQUNsQixhQUFTLGFBQWEsa0NBQWtDLFFBQVEsZUFBZSw4QkFBOEIsQ0FBQztBQUM5RyxVQUFNLGtDQUFrQyxtQ0FBbUM7QUFDM0UsUUFBSSxtQ0FBbUMsTUFBTTtBQUMzQyxZQUFNLG9DQUFvQyxXQUFXLGdDQUFnQyxRQUFTLE1BQU87QUFDckcsWUFBTSxZQUFZLFdBQVcsZ0NBQWdDLFFBQVMsT0FBUTtBQUM5RSxlQUFTLG9CQUFvQixtQ0FBbUMsbUNBQW1DLFNBQVM7QUFDNUcsVUFBSSxnQ0FBZ0MsWUFBWSxNQUFNO0FBQ3BELGlCQUFTLGFBQWEseUNBQXlDLGdDQUFnQyxRQUFRO0FBQUEsTUFDekc7QUFFQSxxQkFBZTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fZ2VuZXJhdGVHcm91cEVudGl0eSIsICJfX2dlbmVyYXRlTWVzaEVudGl0eSIsICJfX2dlbmVyYXRlQ2FtZXJhRW50aXR5IiwgIl9fZ2VuZXJhdGVMaWdodEVudGl0eSIsICJfX3NldHVwTWF0ZXJpYWxzIiwgIl9fc2V0dXBNYXRlcmlhbCIsICJfX3ByZWxvYWRNVG9vbk1hdGVyaWFsU3VwcG9ydCIsICJfYSIsICJfX3NldHVwVGV4dHVyZXMiLCAiX19jcmVhdGVTYW1wbGVycyIsICJfX2NyZWF0ZVJuQnVmZmVyIiwgIl9fc2V0dXBPYmplY3RzIiwgIl9fc2V0dXBOb2RlVmlzaWJpbGl0eSIsICJfX2FwcGx5Tm9kZVZpc2liaWxpdHkiLCAiX19nZXROb2RlVmlzaWJpbGl0eSIsICJfX3NldFBvaW50ZXJBbmltYXRpb24iLCAiX19zZXROb3JtYWxBbmltYXRpb24iLCAiX19zZXRQb2ludGVyQW5pbWF0aW9uTWF0ZXJpYWxzIiwgIl9fc2V0UG9pbnRlckFuaW1hdGlvbk5vZGVzIiwgIl9fc2V0UG9pbnRlckFuaW1hdGlvbkxpZ2h0cyIsICJfX3NldFBvaW50ZXJBbmltYXRpb25DYW1lcmFzIiwgIl9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvciIsICJfX2dldENvbW1vbkFuY2VzdG9yT2ZKb2ludHMiLCAiX19nZW5lcmF0ZU5vcm1hbHNJZk1pc3NpbmciLCAiX19zZXR1cE1lc2giLCAiX19zZXR1cENhbWVyYSIsICJfX2NvbmZpZ3VyZUxpZ2h0Q29tcG9uZW50IiwgIl9fc2V0dXBMaWdodCIsICJfX2lzTW9ycGhpbmciLCAiX19kZWNvZGVEcmFjbyIsICJfX2dldFJuQnVmZmVyVmlldyIsICJfX2dldFJuQWNjZXNzb3IiLCAiaSIsICJfX2NvcHlSbkFjY2Vzc29yQW5kQnVmZmVyVmlld0Zvck1vcnBoRGF0YSIsICJfX3NldFZSTTFNYXRlcmlhbCIsICJfX2lzTGlnaHRpbmciLCAiX19tYWtlT3V0cHV0U3JnYiIsICJfX3NldFZSTTB4TWF0ZXJpYWwiLCAiX19nZW5lcmF0ZUFwcHJvcHJpYXRlTWF0ZXJpYWwiLCAicm5Mb2FkZXJPcHRpb25zIiwgIl9faXNJbXBvcnRWUk0weCIsICJtYXRlcmlhbCIsICJfX3VzZVRhbmdlbnRBdHRyaWJ1dGUiLCAiX191c2VOb3JtYWxUZXh0dXJlIiwgIl9fZ2V0VmFsaWRSYXltYXJjaGluZ1RleHR1cmVBc3NpZ25tZW50cyIsICJfX2NyZWF0ZVJheW1hcmNoaW5nVGV4dHVyZSIsICJfX25lZWRSZXNpemVUb1Bvd2VyT2ZUd29PbldlYkdsMSIsICJfX3NpemVJc1Bvd2VyT2ZUd28iLCAiX19uZWVkUGFyYW1ldGVySW5pdGlhbGl6YXRpb24iLCAiX19yZXdyYXBXaXRoVHlwZWRBcnJheSIsICJfX25vcm1hbGl6ZVR5cGVkQXJyYXlUb0Zsb2F0MzJBcnJheSIsICJfX2FkZE9mZnNldFRvSW5kaWNlcyIsICJybkJ1ZmZlclZpZXciLCAiX190YWtlUm5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvckZvckRyYWNvIiwgIl9fZ2V0R2VvbWV0cnlGcm9tRHJhY29CdWZmZXIiLCAiX19nZXRJbmRpY2VzRnJvbURyYWNvIiwgIl9fY3JlYXRlQnVmZmVyRm9yRGVjb21wcmVzc2VkRGF0YSJdCn0K
