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
import { RaymarchingComponent } from "../components/Raymarching/RaymarchingComponent.js";
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
var ModelConverter = class _ModelConverter {
  constructor() {
  }
  /**
   * Generates a group entity for the glTF model
   * @param gltfModel - The glTF model data
   * @returns A scene graph entity configured as a group
   */
  static __generateGroupEntity(engine, gltfModel) {
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
  static __generateMeshEntity(engine, gltfModel) {
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
  static __generateCameraEntity(engine, gltfModel) {
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
  static __generateLightEntity(engine, gltfModel) {
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
  static __setupMaterials(engine, gltfModel, rnTextures, rnSamplers) {
    const rnMaterials = [];
    if (gltfModel.materials != null) {
      for (const material of gltfModel.materials) {
        const rnMaterial = this.__setupMaterial(engine, gltfModel, rnTextures, rnSamplers, material);
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
  static async __preloadMToonMaterialSupport(gltfModel) {
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
   * Sets up textures from the glTF model asynchronously
   * @param gltfModel - The glTF model data
   * @returns Promise resolving to array of Rhodonite textures
   */
  static async __setupTextures(engine, gltfModel) {
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
  static __createSamplers(engine, gltfModel) {
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
    const rnBuffers = this.__createRnBuffer(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = [];
    const rnSamplers = [];
    const rnMaterials = this.__setupMaterials(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.__setupObjects(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.__generateGroupEntity(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.__setupNodeVisibility(gltfModel, rnEntities);
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
    const rnBuffers = this.__createRnBuffer(gltfModel);
    gltfModel.asset.extras.rnMaterials = {};
    const rnTextures = await this.__setupTextures(engine, gltfModel);
    const rnSamplers = this.__createSamplers(engine, gltfModel);
    await this.__preloadMToonMaterialSupport(gltfModel);
    await RhodoniteImportExtension.preloadNodeBasedMaterialSupport(gltfModel);
    const rnMaterials = this.__setupMaterials(engine, gltfModel, rnTextures, rnSamplers);
    const { rnEntities, rnEntitiesByNames } = this.__setupObjects(
      engine,
      gltfModel,
      rnBuffers,
      rnMaterials,
      rnTextures,
      rnSamplers
    );
    gltfModel.asset.extras.rnEntities = rnEntities;
    this._setupTransform(gltfModel, rnEntities);
    const rootGroup = this.__generateGroupEntity(engine, gltfModel);
    this._setupAnimation(engine, gltfModel, rnEntities, rnBuffers, rootGroup, rnMaterials);
    this._setupSkeleton(engine, gltfModel, rnEntities, rnBuffers);
    this._setupHierarchy(gltfModel, rnEntities);
    await preloadKhrPhysicsSupport(gltfModel);
    setupKhrStaticColliders(gltfModel, rnEntities);
    this.__setupNodeVisibility(gltfModel, rnEntities);
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
  static __createRnBuffer(gltfModel) {
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
  static __setupNodeVisibility(gltfModel, rnEntities) {
    var _a, _b, _c;
    const visitedNodeIndices = /* @__PURE__ */ new Set();
    const sceneRootNodeIndices = (_c = (_b = (_a = gltfModel.scenes) == null ? void 0 : _a[0]) == null ? void 0 : _b.nodes) != null ? _c : [];
    for (const nodeIndex of sceneRootNodeIndices) {
      this.__applyNodeVisibility(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
    }
    for (const nodeIndexString in gltfModel.nodes) {
      const nodeIndex = Number.parseInt(nodeIndexString, 10);
      if (!visitedNodeIndices.has(nodeIndex)) {
        this.__applyNodeVisibility(gltfModel, rnEntities, nodeIndex, true, visitedNodeIndices);
      }
    }
  }
  static __applyNodeVisibility(gltfModel, rnEntities, nodeIndex, parentVisible, visitedNodeIndices) {
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
    const localVisible = this.__getNodeVisibility(node);
    entity.tryToSetTag({ tag: TagKhrNodeVisibilityVisible, value: localVisible });
    if (Is.exist((_a = node.extensions) == null ? void 0 : _a.KHR_node_visibility)) {
      entity.tryToSetTag({ tag: TagKhrNodeVisibilityEnabled, value: true });
    }
    entity.getSceneGraph().isVisible = parentVisible && localVisible;
    for (const childNodeIndex of (_b = node.children) != null ? _b : []) {
      this.__applyNodeVisibility(
        gltfModel,
        rnEntities,
        childNodeIndex,
        parentVisible && localVisible,
        visitedNodeIndices
      );
    }
  }
  static __getNodeVisibility(node) {
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
            _ModelConverter.__setPointerAnimation(
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
            _ModelConverter.__setNormalAnimation(
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
  static __setPointerAnimation(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType, rnMaterials, gltfModel) {
    const pointer = channel.target.extensions.KHR_animation_pointer.pointer;
    const matchNodes = pointer.match(/^\/nodes\/([0-9]+)\//);
    const matchMaterials = pointer.match(/^\/materials\/([0-9]+)\//);
    const matchLights = pointer.match(/^\/extensions\/KHR_lights_punctual\/lights\/([0-9]+)\//);
    const matchCameras = pointer.match(/^\/cameras\/([0-9]+)\//);
    if (matchMaterials) {
      _ModelConverter.__setPointerAnimationMaterials(
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
      _ModelConverter.__setPointerAnimationNodes(
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
      _ModelConverter.__setPointerAnimationLights(
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
      _ModelConverter.__setPointerAnimationCameras(
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
  static __setPointerAnimationCameras(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
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
  static __setPointerAnimationLights(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType, gltfModel) {
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
  static __setPointerAnimationNodes(match, rnEntities, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
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
  static __setPointerAnimationMaterials(match, rnMaterials, pointer, samplerObject, animation, animInputArray, animOutputArray, interpolation, _animationAttributeType) {
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
  static __setNormalAnimation(rnEntities, channel, samplerObject, animation, animInputArray, animOutputArray, interpolation, animationAttributeType) {
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
        const rnAccessorOfInverseBindMat = Is.exist(inverseBindMatAccessor) ? this.__getRnBufferViewAndRnAccessor(engine, inverseBindMatAccessor, rnBuffers) : void 0;
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
        const skeletonRoot = Is.exist(node.skinObject.skeleton) ? rnEntities[node.skinObject.skeleton].getSceneGraph() : this.__getCommonAncestorOfJoints(joints);
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
  static __getCommonAncestorOfJoints(joints) {
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
  static __generateNormalsIfMissing(engine, primitive, indicesAccessor) {
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
  static __setupObjects(engine, gltfModel, rnBuffers, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e, _f, _g;
    const rnEntities = [];
    const rnEntitiesByNames = /* @__PURE__ */ new Map();
    for (const node_i in gltfModel.nodes) {
      const node = gltfModel.nodes[Number.parseInt(node_i, 10)];
      let entity;
      if (node.mesh != null) {
        const meshIdx = node.mesh;
        const meshEntity = this.__setupMesh(
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
        const cameraEntity = this.__setupCamera(engine, node.cameraObject, gltfModel);
        let entityWithOptionalLight = cameraEntity;
        if (((_b = node.extensions) == null ? void 0 : _b.KHR_lights_punctual) != null) {
          const lightEntity = engine.entityRepository.addComponentToEntity(
            LightComponent,
            cameraEntity
          );
          this.__configureLightComponent(lightEntity.getLight(), node.extensions.KHR_lights_punctual.light);
          lightEntity.getCamera().isSyncToLight = true;
          entityWithOptionalLight = lightEntity;
        }
        if (node.name) {
          entityWithOptionalLight.tryToSetUniqueName(node.name, true);
        }
        entity = entityWithOptionalLight;
      } else if ((_c = node.extensions) == null ? void 0 : _c.KHR_lights_punctual) {
        const lightEntity = this.__setupLight(engine, node.extensions.KHR_lights_punctual.light, gltfModel);
        entity = lightEntity;
      } else {
        const group = this.__generateGroupEntity(engine, gltfModel);
        if (node.name) {
          group.tryToSetUniqueName(node.name, true);
        }
        entity = group;
      }
      const raymarchingExtension = (_d = node.extensions) == null ? void 0 : _d.RHODONITE_raymarching;
      if (raymarchingExtension != null && entity.tryToGetRaymarching() == null) {
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
      if (this.__isMorphing(node, gltfModel)) {
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
  static __isMorphing(node, gltfModel) {
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
  static __setupLight(engine, light, gltfModel) {
    const lightEntity = this.__generateLightEntity(engine, gltfModel);
    const lightComponent = lightEntity.getComponent(LightComponent);
    this.__configureLightComponent(lightComponent, light);
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
  static __configureLightComponent(lightComponent, light) {
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
  static __setupCamera(engine, camera, gltfModel) {
    const cameraEntity = this.__generateCameraEntity(engine, gltfModel);
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
  static __setupMesh(engine, mesh, meshIndex, rnBuffers, gltfModel, rnMaterials, rnTextures, rnSamplers) {
    var _a, _b, _c, _d, _e;
    const meshEntity = this.__generateMeshEntity(engine, gltfModel);
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
        const rnMaterial = primitive.material != null ? rnMaterials[primitive.material] : this.__setupMaterial(engine, gltfModel, rnTextures, rnSamplers);
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
          indicesRnAccessor = this.__decodeDraco(engine, primitive, rnBuffers, gltfModel, map);
          if (Is.not.exist(indicesRnAccessor)) {
            break;
          }
        } else {
          if (Is.exist(primitive.indices)) {
            indicesRnAccessor = this.__getRnBufferViewAndRnAccessor(engine, primitive.indicesObject, rnBuffers);
          }
          const rnBufferViewMap = /* @__PURE__ */ new Map();
          for (const attributeName in primitive.attributesObjects) {
            const rnm2attribute = primitive.attributesObjects[attributeName];
            const rnBuffer = rnBuffers[rnm2attribute.bufferViewObject.buffer];
            let rnBufferView;
            if (Is.exist(rnm2attribute.bufferView)) {
              rnBufferView = rnBufferViewMap.get(rnm2attribute.bufferView);
              if (Is.not.exist(rnBufferView)) {
                rnBufferView = this.__getRnBufferView(rnm2attribute.bufferViewObject, rnBuffer);
                rnBufferViewMap.set(rnm2attribute.bufferView, rnBufferView);
              }
            } else {
              rnBufferView = rnBuffer.takeBufferView({
                byteLengthToNeed: 0,
                byteStride: 0
              }).unwrapForce();
            }
            const attributeRnAccessor = this.__getRnAccessor(engine, rnm2attribute, rnBufferView);
            const joinedString = VertexAttribute.toVertexAttributeSemanticJoinedStringAsGltfStyle(
              VertexAttribute.fromString(attributeName)
            );
            map.set(joinedString, attributeRnAccessor);
          }
        }
        rnPrimitive.setData(map, rnPrimitiveMode, rnMaterial, indicesRnAccessor);
        this.__generateNormalsIfMissing(engine, rnPrimitive, indicesRnAccessor);
        if (primitive.targets != null) {
          const targets = [];
          for (let i2 = 0; i2 < primitive.targetsObjects.length; i2++) {
            const target = primitive.targetsObjects[i2];
            const targetMap = /* @__PURE__ */ new Map();
            for (const attributeName in target) {
              const attributeAccessor = target[attributeName];
              const attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(engine, attributeAccessor, rnBuffers);
              const attributeRnAccessorInGPUVertexData = this.__copyRnAccessorAndBufferViewForMorphData(
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
  static __setVRM1Material(engine, gltfModel, materialJson, rnLoaderOptions) {
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
      const isLighting = this.__isLighting(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);
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
  static __setVRM0xMaterial(engine, gltfModel, materialJson, rnLoaderOptions) {
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
      const isLighting = this.__isLighting(gltfModel, materialJson);
      const useTangentAttribute = true;
      const textures = defaultMaterialHelperArgument.textures;
      const samplers = defaultMaterialHelperArgument.samplers;
      const debugMode = defaultMaterialHelperArgument.debugMode;
      const maxInstancesNumber = defaultMaterialHelperArgument.maxInstancesNumber;
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);
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
  static __generateAppropriateMaterial(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
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
      if (rnLoaderOptions2.__isImportVRM0x) {
        const material2 = this.__setVRM0xMaterial(engine, gltfModel, materialJson, rnLoaderOptions2);
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
    const isLighting = this.__isLighting(gltfModel, materialJson);
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
        const material2 = this.__setVRM1Material(engine, gltfModel, materialJson, rnLoaderOptions2);
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
      const makeOutputSrgb = this.__makeOutputSrgb(gltfModel);
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
  static __isLighting(gltfModel, materialJson) {
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
  static __useTangentAttribute(gltfModel, primitive) {
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
  static __useNormalTexture(gltfModel) {
    var _a, _b, _c, _d, _e, _f;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    if ((argument == null ? void 0 : argument.useNormalTexture) === false) {
      return false;
    }
    return ((_f = (_e = (_d = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _d.extras) == null ? void 0 : _e.rnLoaderOptions) == null ? void 0 : _f.tangentCalculationMode) !== 0;
  }
  static __makeOutputSrgb(gltfModel) {
    var _a, _b, _c;
    const argument = (_c = (_b = (_a = gltfModel == null ? void 0 : gltfModel.asset) == null ? void 0 : _a.extras) == null ? void 0 : _b.rnLoaderOptions) == null ? void 0 : _c.defaultMaterialHelperArgumentArray[0];
    return argument == null ? void 0 : argument.makeOutputSrgb;
  }
  static __setupMaterial(engine, gltfModel, rnTextures, rnSamplers, materialJson) {
    var _a;
    const material = this.__generateAppropriateMaterial(
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
      if (material.alphaMode === AlphaMode.Mask && !((_e = (_d = gltfModel.asset.extras) == null ? void 0 : _d.rnLoaderOptions) == null ? void 0 : _e.__isImportVRM0x)) {
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
    return this.__getValidRaymarchingTextureAssignments(gltfModel, extension == null ? void 0 : extension.textures);
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
      for (const assignment of this.__getValidRaymarchingTextureAssignments(gltfModel, extension == null ? void 0 : extension.textures)) {
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
  static __getValidRaymarchingTextureAssignments(gltfModel, textures) {
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
      const created = await this.__createRaymarchingTexture(engine, gltfModel, textureIndex, samplerIndex);
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
      const created = await this.__createRaymarchingTexture(engine, gltfModel, textureIndex, samplerIndex);
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
  static async __createRaymarchingTexture(engine, gltfModel, textureIndex, samplerIndex) {
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
  static __needResizeToPowerOfTwoOnWebGl1(textureOption) {
    if (textureOption.wrapS !== TextureParameter.ClampToEdge || textureOption.wrapT !== TextureParameter.ClampToEdge || textureOption.minFilter !== TextureParameter.Linear && textureOption.minFilter !== TextureParameter.Nearest) {
      return true;
    }
    return false;
  }
  static __sizeIsPowerOfTwo(image) {
    const width = image.width;
    const height = image.height;
    if ((width & width - 1) === 0 && (height & height - 1) === 0) {
      return true;
    }
    return false;
  }
  static __needParameterInitialization(materialJson, _materialTypeName) {
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
  static __rewrapWithTypedArray(typedArrayClass, uint8Array, byteOffset, length) {
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
      const rnBufferView = this.__getRnBufferView(bufferView, rnBuffer);
      const rnAccessor = this.__getRnAccessor(engine, accessor, rnBufferView);
      uint8Array = rnAccessor.getUint8Array();
      byteOffsetFromBuffer = 0;
    }
    let float32Array = new Float32Array();
    const numberArray = [];
    if (_ModelConverter._isSystemLittleEndian()) {
      let typedDataArray = new Float32Array();
      if (dataViewMethod === "getFloat32") {
        typedDataArray = this.__rewrapWithTypedArray(
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
        typedDataArray = this.__rewrapWithTypedArray(
          Int16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint16") {
        typedDataArray = this.__rewrapWithTypedArray(
          Uint16Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getInt32") {
        typedDataArray = this.__rewrapWithTypedArray(
          Int32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      } else if (dataViewMethod === "getUint32") {
        typedDataArray = this.__rewrapWithTypedArray(
          Uint32Array,
          uint8Array,
          byteOffsetFromBuffer,
          byteLength / componentBytes
        );
      }
      float32Array = this.__normalizeTypedArrayToFloat32Array(dataViewMethod, typedDataArray);
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
      float32Array = this.__normalizeTypedArrayToFloat32Array(dataViewMethod, numberArray);
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
  static __normalizeTypedArrayToFloat32Array(dataViewMethod, numberArray) {
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
  static __addOffsetToIndices(meshComponent) {
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
  static __getRnAccessor(engine, accessor, rnBufferView) {
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
  static __getRnBufferViewAndRnAccessor(engine, accessor, rnBuffers) {
    const gltfBufferView = accessor.bufferViewObject;
    let rnBufferView;
    if (gltfBufferView != null) {
      const rnBuffer = rnBuffers[gltfBufferView.buffer];
      rnBufferView = this.__getRnBufferView(gltfBufferView, rnBuffer);
    }
    const rnAccessor = this.__getRnAccessor(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static __copyRnAccessorAndBufferViewForMorphData(engine, srcRnAccessor) {
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
  static __takeRnBufferViewAndRnAccessorForDraco(engine, accessor, compositionNum, rnBuffer) {
    const rnBufferView = rnBuffer.takeBufferView({
      byteLengthToNeed: accessor.count * compositionNum * 4,
      byteStride: 0
    }).unwrapForce();
    const rnAccessor = this.__getRnAccessor(engine, accessor, rnBufferView);
    return rnAccessor;
  }
  static __getRnBufferView(rnm2bufferView, rnBuffer) {
    var _a, _b;
    const rnBufferView = rnBuffer.takeBufferViewWithByteOffset({
      byteLengthToNeed: rnm2bufferView.byteLength,
      byteStride: (_a = rnm2bufferView.byteStride) != null ? _a : 0,
      byteOffset: (_b = rnm2bufferView.byteOffset) != null ? _b : 0
    }).unwrapForce();
    return rnBufferView;
  }
  static __getGeometryFromDracoBuffer(draco, decoder, arrayBuffer) {
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
  static __getIndicesFromDraco(draco, decoder, dracoGeometry, triangleStripDrawMode) {
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
  static __decodeDraco(engine, primitive, rnBuffers, gltfModel, map) {
    var _a, _b;
    const bufferView = gltfModel.bufferViews[(_a = primitive.extensions) == null ? void 0 : _a.KHR_draco_mesh_compression.bufferView];
    const rnBufferView = this.__getRnBufferView(bufferView, rnBuffers[bufferView.buffer]);
    const arraybufferOfBufferView = new Uint8Array(rnBufferView.getUint8Array()).buffer;
    const draco = new DracoDecoderModule();
    const decoder = new draco.Decoder();
    const dracoGeometry = this.__getGeometryFromDracoBuffer(draco, decoder, arraybufferOfBufferView);
    if (dracoGeometry == null) {
      draco.destroy(dracoGeometry);
      draco.destroy(decoder);
      return void 0;
    }
    const numPoints = dracoGeometry.num_points();
    const rnBufferForDraco = this.__createBufferForDecompressedData(primitive, numPoints);
    const primitiveMode = PrimitiveMode.from(primitive.mode);
    let isTriangleStrip = false;
    if (primitiveMode === PrimitiveMode.TriangleStrip) {
      isTriangleStrip = true;
    }
    const indices = this.__getIndicesFromDraco(draco, decoder, dracoGeometry, isTriangleStrip);
    const indicesRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
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
        attributeRnAccessor = this.__getRnBufferViewAndRnAccessor(engine, attributeGltf2Accessor, rnBuffers);
      } else {
        const compositionNum = CompositionType.fromString(attributeGltf2Accessor.type).getNumberOfComponents();
        attributeRnAccessor = this.__takeRnBufferViewAndRnAccessorForDraco(
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
  static __createBufferForDecompressedData(primitive, numPoints) {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvTW9kZWxDb252ZXJ0ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQW5pbWF0aW9uUGF0aE5hbWUsIEFuaW1hdGlvblNhbXBsZXIsIEFuaW1hdGlvblRyYWNrTmFtZSB9IGZyb20gJy4uLy4uL3R5cGVzL0FuaW1hdGlvblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQXJyYXkzLCBCeXRlLCBDb3VudCwgSW5kZXgsIFNpemUsIFR5cGVkQXJyYXksIFZlY3RvckNvbXBvbmVudE4gfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQge1xuICB0eXBlIEdsdGZMb2FkT3B0aW9uLFxuICB0eXBlIEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQsXG4gIHR5cGUgS0hSX25vZGVfdmlzaWJpbGl0eSxcbiAgVGFnR2x0ZjJOb2RlSW5kZXgsXG4gIFRhZ0tock5vZGVWaXNpYmlsaXR5RW5hYmxlZCxcbiAgVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlLFxufSBmcm9tICcuLi8uLi90eXBlcy9nbFRGMic7XG5pbXBvcnQgdHlwZSB7IE5vZGVKU09OIH0gZnJvbSAnLi4vLi4vdHlwZXMvTm9kZUpTT04nO1xuaW1wb3J0IHR5cGUge1xuICBSbk0yLFxuICBSbk0yQWNjZXNzb3IsXG4gIFJuTTJBbmltYXRpb24sXG4gIFJuTTJBbmltYXRpb25DaGFubmVsLFxuICBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgUm5NMkJ1ZmZlclZpZXcsXG4gIFJuTTJDYW1lcmEsXG4gIFJuTTJJbWFnZSxcbiAgUm5NMk1hdGVyaWFsLFxuICBSbk0yTWVzaCxcbiAgUm5NMk5vZGUsXG4gIFJuTTJQYnJNZXRhbGxpY1JvdWdobmVzcyxcbiAgUm5NMlByaW1pdGl2ZSxcbiAgUm5NMlNwYXJzZUluZGljZXMsXG4gIFJuTTJUZXh0dXJlSW5mbyxcbiAgUm5NMlRleHR1cmVTYW1wbGVyLFxufSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB0eXBlIHsgVnJtMHhNYXRlcmlhbFByb3BlcnR5IH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNMHgnO1xuaW1wb3J0IHR5cGUgeyBWcm0xX01hdGVyaWFsIH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNQ19tYXRlcmlhbHNfbXRvb24nO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb25TdGF0ZS9BbmltYXRpb25TdGF0ZUNvbXBvbmVudCc7XG5pbXBvcnQgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJQmxlbmRTaGFwZUVudGl0eU1ldGhvZHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0JsZW5kU2hhcGUvSUJsZW5kU2hhcGVFbnRpdHknO1xuaW1wb3J0IHsgY3JlYXRlQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmEvY3JlYXRlQ2FtZXJhRW50aXR5JztcbmltcG9ydCB7IGNyZWF0ZUxpZ2h0RW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9MaWdodC9jcmVhdGVMaWdodEVudGl0eSc7XG5pbXBvcnQgeyBMaWdodENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTGlnaHQvTGlnaHRDb21wb25lbnQnO1xuaW1wb3J0IHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IGNyZWF0ZU1lc2hFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9jcmVhdGVNZXNoRW50aXR5JztcbmltcG9ydCB7IFJheW1hcmNoaW5nQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9SYXltYXJjaGluZy9SYXltYXJjaGluZ0NvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgdHlwZSB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBTa2VsZXRhbENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2tlbGV0YWwvU2tlbGV0YWxDb21wb25lbnQnO1xuaW1wb3J0IHsgQWxwaGFNb2RlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQWxwaGFNb2RlJztcbmltcG9ydCB7IEFuaW1hdGlvbkludGVycG9sYXRpb24gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbmltYXRpb25JbnRlcnBvbGF0aW9uJztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDYW1lcmFUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTGlnaHRUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFNkZlNoYXBlVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1NkZlNoYXBlVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc05hbWUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3MnO1xuaW1wb3J0IHsgU2hhZGluZ01vZGVsIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvU2hhZGluZ01vZGVsJztcbmltcG9ydCB7IFRleHR1cmVQYXJhbWV0ZXIgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9UZXh0dXJlUGFyYW1ldGVyJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSwgdHlwZSBWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB0eXBlIHtcbiAgSUFuaW1hdGlvbkVudGl0eSxcbiAgSUNhbWVyYUVudGl0eSxcbiAgSUxpZ2h0RW50aXR5LFxuICBJTWVzaEVudGl0eSxcbiAgSVJheW1hcmNoaW5nRW50aXR5LFxuICBJU2NlbmVHcmFwaEVudGl0eSxcbn0gZnJvbSAnLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgYXR0YWNoTGlnaHRTaGFkb3dDYW1lcmEgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsIH0gZnJvbSAnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCc7XG5pbXBvcnQgeyBjcmVhdGVQYnJVYmVyTWF0ZXJpYWwgfSBmcm9tICcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVQYnJVYmVyTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL21hdGVyaWFscy9jb3JlL01hdGVyaWFsJztcbmltcG9ydCB7IEFuaW1hdGVkUXVhdGVybmlvbiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRRdWF0ZXJuaW9uJztcbmltcG9ydCB7IEFuaW1hdGVkU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9BbmltYXRlZFNjYWxhcic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjIgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkVmVjdG9yMic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkVmVjdG9yMyc7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkVmVjdG9yNCc7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3Rvck4gfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkVmVjdG9yTic7XG5pbXBvcnQgdHlwZSB7IElBbmltYXRlZFZhbHVlIH0gZnJvbSAnLi4vbWF0aC9JQW5pbWF0ZWRWYWx1ZSc7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4uL21hdGgvTWF0aFV0aWwnO1xuaW1wb3J0IHsgTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL01hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vbWF0aC9RdWF0ZXJuaW9uJztcbmltcG9ydCB7IFNjYWxhciB9IGZyb20gJy4uL21hdGgvU2NhbGFyJztcbmltcG9ydCB7IFZlY3RvcjIgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgQWNjZXNzb3IgfSBmcm9tICcuLi9tZW1vcnkvQWNjZXNzb3InO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnLi4vbWVtb3J5L0J1ZmZlcic7XG5pbXBvcnQgdHlwZSB7IEJ1ZmZlclZpZXcgfSBmcm9tICcuLi9tZW1vcnkvQnVmZmVyVmlldyc7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IFNhbXBsZXIgfSBmcm9tICcuLi90ZXh0dXJlcy9TYW1wbGVyJztcbmltcG9ydCB7IFRleHR1cmUgfSBmcm9tICcuLi90ZXh0dXJlcy9UZXh0dXJlJztcbmltcG9ydCB7IGRldGVjdEJvbmVEYXRhVHlwZUZvclNraW4gfSBmcm9tICcuL0JvbmVEYXRhVHlwZURldGVjdG9yJztcbmltcG9ydCB7IHByZWxvYWRLaHJQaHlzaWNzU3VwcG9ydCwgc2V0dXBLaHJTdGF0aWNDb2xsaWRlcnMgfSBmcm9tICcuL0toclBoeXNpY3NJbXBvcnRlcic7XG5pbXBvcnQgeyBSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24gfSBmcm9tICcuL1Job2Rvbml0ZUltcG9ydEV4dGVuc2lvbic7XG5cbmRlY2xhcmUgbGV0IERyYWNvRGVjb2Rlck1vZHVsZTogYW55O1xuXG50eXBlIENyZWF0ZU1Ub29uMHhNYXRlcmlhbCA9IHR5cGVvZiBpbXBvcnQoJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZU1Ub29uMHhNYXRlcmlhbCcpLmNyZWF0ZU1Ub29uMHhNYXRlcmlhbDtcbnR5cGUgQ3JlYXRlTVRvb24xTWF0ZXJpYWwgPSB0eXBlb2YgaW1wb3J0KCcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVNVG9vbjFNYXRlcmlhbCcpLmNyZWF0ZU1Ub29uMU1hdGVyaWFsO1xuXG4vKipcbiAqIE1Ub29uIG1hdGVyaWFsIGltcGxlbWVudGF0aW9ucyBhcmUgbG9hZGVkIG9uIGRlbWFuZC4gVGhleSBwdWxsIGluIHRoZSBNVG9vbiBzaGFkZXJzIGFuZCBtYXRlcmlhbCBjb250ZW50cywgd2hpY2hcbiAqIGEgcGxhaW4gZ2xURiBtb2RlbCBuZXZlciB1c2VzLiBUaGUgaW1wb3J0ZXIgcHJlbG9hZHMgdGhlbSBiZWZvcmUgZ2VuZXJhdGluZyBtYXRlcmlhbHMgd2hlbiB0aGUgbW9kZWwgYWN0dWFsbHlcbiAqIGNvbnRhaW5zIFZSTSBtYXRlcmlhbHMsIHNvIHRoZSBzeW5jaHJvbm91cyBtYXRlcmlhbCBmdW5jdGlvbnMgY2FuIGNhbGwgdGhlbSB0aHJvdWdoIHRoZXNlIHZhcmlhYmxlcy5cbiAqL1xubGV0IGNyZWF0ZU1Ub29uMHhNYXRlcmlhbEltcGw6IENyZWF0ZU1Ub29uMHhNYXRlcmlhbCB8IHVuZGVmaW5lZDtcbmxldCBjcmVhdGVNVG9vbjFNYXRlcmlhbEltcGw6IENyZWF0ZU1Ub29uMU1hdGVyaWFsIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgY29udmVydGVyIGNsYXNzIGZyb20gZ2xURjIgbW9kZWwgdG8gUmhvZG9uaXRlIE5hdGl2ZSBkYXRhXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2RlbENvbnZlcnRlciB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBncm91cCBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgc2NlbmUgZ3JhcGggZW50aXR5IGNvbmZpZ3VyZWQgYXMgYSBncm91cFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZUdyb3VwRW50aXR5KGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpOiBJU2NlbmVHcmFwaEVudGl0eSB7XG4gICAgY29uc3QgZW50aXR5ID0gY3JlYXRlR3JvdXBFbnRpdHkoZW5naW5lKTtcbiAgICB0aGlzLmFkZFRhZ3MoZW50aXR5LCBnbHRmTW9kZWwpO1xuICAgIHJldHVybiBlbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBzb3VyY2UgdHlwZSBhbmQgdmVyc2lvbiB0YWdzIHRvIGFuIGVudGl0eSBiYXNlZCBvbiB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZW50aXR5IC0gVGhlIGVudGl0eSB0byBhZGQgdGFncyB0b1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgY29udGFpbmluZyBhc3NldCBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYWRkVGFncyhlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBlbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAnU291cmNlVHlwZScsXG4gICAgICB2YWx1ZTogZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEuZmlsZVR5cGUhLFxuICAgIH0pO1xuICAgIGVudGl0eS50cnlUb1NldFRhZyh7XG4gICAgICB0YWc6ICdTb3VyY2VUeXBlVmVyc2lvbicsXG4gICAgICB2YWx1ZTogZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEudmVyc2lvbiEsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgbWVzaCBlbnRpdHkgZm9yIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEEgbWVzaCBlbnRpdHkgd2l0aCBhcHByb3ByaWF0ZSB0YWdzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlTWVzaEVudGl0eShlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogSU1lc2hFbnRpdHkge1xuICAgIGNvbnN0IGVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkoZW5naW5lKTtcbiAgICB0aGlzLmFkZFRhZ3MoZW50aXR5LCBnbHRmTW9kZWwpO1xuICAgIHJldHVybiBlbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgY2FtZXJhIGVudGl0eSBmb3IgdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgQSBjYW1lcmEgZW50aXR5IHdpdGggYXBwcm9wcmlhdGUgdGFnc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZUNhbWVyYUVudGl0eShlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogSUNhbWVyYUVudGl0eSB7XG4gICAgY29uc3QgZW50aXR5ID0gY3JlYXRlQ2FtZXJhRW50aXR5KGVuZ2luZSwgdHJ1ZSk7XG4gICAgdGhpcy5hZGRUYWdzKGVudGl0eSwgZ2x0Zk1vZGVsKTtcbiAgICByZXR1cm4gZW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIGxpZ2h0IGVudGl0eSBmb3IgdGhlIGdsVEYgbW9kZWxcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHJldHVybnMgQSBsaWdodCBlbnRpdHkgd2l0aCBhcHByb3ByaWF0ZSB0YWdzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlTGlnaHRFbnRpdHkoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IElMaWdodEVudGl0eSB7XG4gICAgY29uc3QgZW50aXR5ID0gY3JlYXRlTGlnaHRFbnRpdHkoZW5naW5lKTtcbiAgICB0aGlzLmFkZFRhZ3MoZW50aXR5LCBnbHRmTW9kZWwpO1xuICAgIHJldHVybiBlbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBtYXRlcmlhbHMgZnJvbSB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjb25maWd1cmVkIFJob2Rvbml0ZSBtYXRlcmlhbHNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBNYXRlcmlhbHMoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMiwgcm5UZXh0dXJlczogVGV4dHVyZVtdLCByblNhbXBsZXJzOiBTYW1wbGVyW10pIHtcbiAgICBjb25zdCBybk1hdGVyaWFsczogTWF0ZXJpYWxbXSA9IFtdO1xuICAgIGlmIChnbHRmTW9kZWwubWF0ZXJpYWxzICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgZ2x0Zk1vZGVsLm1hdGVyaWFscykge1xuICAgICAgICBjb25zdCBybk1hdGVyaWFsID0gdGhpcy5fX3NldHVwTWF0ZXJpYWwoZW5naW5lLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMsIG1hdGVyaWFsKTtcbiAgICAgICAgcm5NYXRlcmlhbHMucHVzaChybk1hdGVyaWFsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJuTWF0ZXJpYWxzO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBNVG9vbiBtYXRlcmlhbCBpbXBsZW1lbnRhdGlvbnMgb25seSB3aGVuIHRoZSBtb2RlbCBhY3R1YWxseSB1c2VzIFZSTSBtYXRlcmlhbHMuXG4gICAqIFRoaXMga2VlcHMgdGhlIE1Ub29uIG1hdGVyaWFsIGNvbnRlbnRzIGFuZCBzaGFkZXJzIG91dCBvZiBwbGFpbiBnbFRGIGFwcGxpY2F0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGEgdG8gaW5zcGVjdFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9fcHJlbG9hZE1Ub29uTWF0ZXJpYWxTdXBwb3J0KGdsdGZNb2RlbDogUm5NMik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1hdGVyaWFscyA9IGdsdGZNb2RlbC5tYXRlcmlhbHMgPz8gW107XG4gICAgY29uc3QgbmVlZHNNVG9vbjEgPSBtYXRlcmlhbHMuc29tZShtYXRlcmlhbCA9PiBtYXRlcmlhbC5leHRlbnNpb25zPy5WUk1DX21hdGVyaWFsc19tdG9vbiAhPSBudWxsKTtcbiAgICBjb25zdCBuZWVkc01Ub29uMHggPSBtYXRlcmlhbHMuc29tZShtYXRlcmlhbCA9PiB7XG4gICAgICBjb25zdCBtYXRlcmlhbFByb3BlcnRpZXMgPSBtYXRlcmlhbC5leHRyYXM/LnZybTB4TWF0ZXJpYWxQcm9wZXJ0eSBhcyBWcm0weE1hdGVyaWFsUHJvcGVydHkgfCB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gbWF0ZXJpYWxQcm9wZXJ0aWVzPy5zaGFkZXIgPT09ICdWUk0vTVRvb24nO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbG9hZHM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuICAgIGlmIChuZWVkc01Ub29uMSAmJiBjcmVhdGVNVG9vbjFNYXRlcmlhbEltcGwgPT0gbnVsbCkge1xuICAgICAgbG9hZHMucHVzaChcbiAgICAgICAgaW1wb3J0KCcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVNVG9vbjFNYXRlcmlhbCcpLnRoZW4obW9kdWxlID0+IHtcbiAgICAgICAgICBjcmVhdGVNVG9vbjFNYXRlcmlhbEltcGwgPSBtb2R1bGUuY3JlYXRlTVRvb24xTWF0ZXJpYWw7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAobmVlZHNNVG9vbjB4ICYmIGNyZWF0ZU1Ub29uMHhNYXRlcmlhbEltcGwgPT0gbnVsbCkge1xuICAgICAgbG9hZHMucHVzaChcbiAgICAgICAgaW1wb3J0KCcuLi9oZWxwZXJzL21hdGVyaWFscy9jcmVhdGVNVG9vbjB4TWF0ZXJpYWwnKS50aGVuKG1vZHVsZSA9PiB7XG4gICAgICAgICAgY3JlYXRlTVRvb24weE1hdGVyaWFsSW1wbCA9IG1vZHVsZS5jcmVhdGVNVG9vbjB4TWF0ZXJpYWw7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cbiAgICBhd2FpdCBQcm9taXNlLmFsbChsb2Fkcyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0ZXh0dXJlcyBmcm9tIHRoZSBnbFRGIG1vZGVsIGFzeW5jaHJvbm91c2x5XG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19zZXR1cFRleHR1cmVzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBjb25zdCByblRleHR1cmVzOiBUZXh0dXJlW10gPSBbXTtcbiAgICBpZiAoZ2x0Zk1vZGVsLmltYWdlcyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIGdsdGZNb2RlbC5pbWFnZXMpIHtcbiAgICAgICAgY29uc3Qgcm5UZXh0dXJlID0gYXdhaXQgdGhpcy5fY3JlYXRlVGV4dHVyZShlbmdpbmUsIGltYWdlLCBnbHRmTW9kZWwpO1xuICAgICAgICByblRleHR1cmVzLnB1c2gocm5UZXh0dXJlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJuVGV4dHVyZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBzYW1wbGVycyBmcm9tIHRoZSBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVTYW1wbGVycyhlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgY29uc3Qgcm5TYW1wbGVyczogU2FtcGxlcltdID0gW107XG4gICAgaWYgKGdsdGZNb2RlbC5zYW1wbGVycyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IHNhbXBsZXIgb2YgZ2x0Zk1vZGVsLnNhbXBsZXJzKSB7XG4gICAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHRoaXMuX2NyZWF0ZVNhbXBsZXIoZW5naW5lLCBzYW1wbGVyKTtcbiAgICAgICAgcm5TYW1wbGVycy5wdXNoKHJuU2FtcGxlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByblNhbXBsZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgZ2xURiBtb2RlbCB0byBSaG9kb25pdGUgb2JqZWN0cyBzeW5jaHJvbm91c2x5ICh3aXRob3V0IHRleHR1cmUgbG9hZGluZylcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGEgdG8gY29udmVydFxuICAgKiBAcmV0dXJucyBUaGUgcm9vdCBncm91cCBlbnRpdHkgY29udGFpbmluZyB0aGUgY29udmVydGVkIHNjZW5lXG4gICAqL1xuICBzdGF0aWMgY29udmVydFRvUmhvZG9uaXRlT2JqZWN0U2ltcGxlKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyBhcyBhbnkpLnJuTWVzaGVzQXRHbHRNZXNoSWR4ID0gW107XG5cbiAgICBjb25zdCBybkJ1ZmZlcnMgPSB0aGlzLl9fY3JlYXRlUm5CdWZmZXIoZ2x0Zk1vZGVsKTtcbiAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybk1hdGVyaWFscyA9IHt9O1xuXG4gICAgY29uc3Qgcm5UZXh0dXJlczogVGV4dHVyZVtdID0gW107XG4gICAgY29uc3Qgcm5TYW1wbGVyczogU2FtcGxlcltdID0gW107XG5cbiAgICAvLyBNYXRlcmlhbHNcbiAgICBjb25zdCBybk1hdGVyaWFscyA9IHRoaXMuX19zZXR1cE1hdGVyaWFscyhlbmdpbmUsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgICAvLyBNZXNoLCBDYW1lcmEsIEdyb3VwLCAuLi5cbiAgICBjb25zdCB7IHJuRW50aXRpZXMsIHJuRW50aXRpZXNCeU5hbWVzIH0gPSB0aGlzLl9fc2V0dXBPYmplY3RzKFxuICAgICAgZW5naW5lLFxuICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgcm5CdWZmZXJzLFxuICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICByblRleHR1cmVzLFxuICAgICAgcm5TYW1wbGVyc1xuICAgICk7XG4gICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyA9IHJuRW50aXRpZXM7XG5cbiAgICAvLyBUcmFuc2Zvcm1cbiAgICB0aGlzLl9zZXR1cFRyYW5zZm9ybShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgY29uc3Qgcm9vdEdyb3VwID0gdGhpcy5fX2dlbmVyYXRlR3JvdXBFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuXG4gICAgLy8gQW5pbWF0aW9uXG4gICAgdGhpcy5fc2V0dXBBbmltYXRpb24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycywgcm9vdEdyb3VwLCBybk1hdGVyaWFscyk7XG5cbiAgICAvLyBTa2VsZXRvblxuICAgIHRoaXMuX3NldHVwU2tlbGV0b24oZW5naW5lLCBnbHRmTW9kZWwsIHJuRW50aXRpZXMsIHJuQnVmZmVycyk7XG5cbiAgICAvLyBIaWVyYXJjaHlcbiAgICB0aGlzLl9zZXR1cEhpZXJhcmNoeShnbHRmTW9kZWwsIHJuRW50aXRpZXMpO1xuXG4gICAgc2V0dXBLaHJTdGF0aWNDb2xsaWRlcnMoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIHRoaXMuX19zZXR1cE5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBpZiAoZ2x0Zk1vZGVsLnNjZW5lc1swXS5ub2Rlcykge1xuICAgICAgZm9yIChjb25zdCBub2Rlc0luZGV4IG9mIGdsdGZNb2RlbC5zY2VuZXNbMF0ubm9kZXMpIHtcbiAgICAgICAgY29uc3Qgc2cgPSBybkVudGl0aWVzW25vZGVzSW5kZXhdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgcm9vdEdyb3VwLmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChzZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKElzLm5vdC5leGlzdChnbHRmTW9kZWwuZXh0cmFzKSkge1xuICAgICAgKGdsdGZNb2RlbCBhcyBhbnkpLmV4dHJhcyA9IHt9O1xuICAgIH1cbiAgICBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXMgPSBybkVudGl0aWVzO1xuICAgIGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc0J5TmFtZXMgPSBybkVudGl0aWVzQnlOYW1lcztcblxuICAgIHJldHVybiByb290R3JvdXA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBnbFRGIG1vZGVsIHRvIFJob2Rvbml0ZSBvYmplY3RzIGFzeW5jaHJvbm91c2x5ICh3aXRoIGZ1bGwgdGV4dHVyZSBsb2FkaW5nKVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YSB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSByb290IGdyb3VwIGVudGl0eSBjb250YWluaW5nIHRoZSBjb252ZXJ0ZWQgc2NlbmVcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMikge1xuICAgIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIGFzIGFueSkucm5NZXNoZXNBdEdsdE1lc2hJZHggPSBbXTtcblxuICAgIGNvbnN0IHJuQnVmZmVycyA9IHRoaXMuX19jcmVhdGVSbkJ1ZmZlcihnbHRmTW9kZWwpO1xuICAgIGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTWF0ZXJpYWxzID0ge307XG5cbiAgICBjb25zdCByblRleHR1cmVzID0gYXdhaXQgdGhpcy5fX3NldHVwVGV4dHVyZXMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IHJuU2FtcGxlcnMgPSB0aGlzLl9fY3JlYXRlU2FtcGxlcnMoZW5naW5lLCBnbHRmTW9kZWwpO1xuXG4gICAgLy8gT3B0aW9uYWwgbWF0ZXJpYWwgaW1wbGVtZW50YXRpb25zIHN0YXkgb3V0IG9mIGFwcGxpY2F0aW9ucyB0aGF0IGRvIG5vdCB1c2UgdGhlbS5cbiAgICBhd2FpdCB0aGlzLl9fcHJlbG9hZE1Ub29uTWF0ZXJpYWxTdXBwb3J0KGdsdGZNb2RlbCk7XG4gICAgYXdhaXQgUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLnByZWxvYWROb2RlQmFzZWRNYXRlcmlhbFN1cHBvcnQoZ2x0Zk1vZGVsKTtcblxuICAgIC8vIE1hdGVyaWFsc1xuICAgIGNvbnN0IHJuTWF0ZXJpYWxzID0gdGhpcy5fX3NldHVwTWF0ZXJpYWxzKGVuZ2luZSwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICAgIC8vIE1lc2gsIENhbWVyYSwgR3JvdXAsIC4uLlxuICAgIGNvbnN0IHsgcm5FbnRpdGllcywgcm5FbnRpdGllc0J5TmFtZXMgfSA9IHRoaXMuX19zZXR1cE9iamVjdHMoXG4gICAgICBlbmdpbmUsXG4gICAgICBnbHRmTW9kZWwsXG4gICAgICBybkJ1ZmZlcnMsXG4gICAgICBybk1hdGVyaWFscyxcbiAgICAgIHJuVGV4dHVyZXMsXG4gICAgICByblNhbXBsZXJzXG4gICAgKTtcbiAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkVudGl0aWVzID0gcm5FbnRpdGllcztcblxuICAgIC8vIFRyYW5zZm9ybVxuICAgIHRoaXMuX3NldHVwVHJhbnNmb3JtKGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBjb25zdCByb290R3JvdXAgPSB0aGlzLl9fZ2VuZXJhdGVHcm91cEVudGl0eShlbmdpbmUsIGdsdGZNb2RlbCk7XG5cbiAgICAvLyBBbmltYXRpb25cbiAgICB0aGlzLl9zZXR1cEFuaW1hdGlvbihlbmdpbmUsIGdsdGZNb2RlbCwgcm5FbnRpdGllcywgcm5CdWZmZXJzLCByb290R3JvdXAsIHJuTWF0ZXJpYWxzKTtcblxuICAgIC8vIFNrZWxldG9uXG4gICAgdGhpcy5fc2V0dXBTa2VsZXRvbihlbmdpbmUsIGdsdGZNb2RlbCwgcm5FbnRpdGllcywgcm5CdWZmZXJzKTtcblxuICAgIC8vIEhpZXJhcmNoeVxuICAgIHRoaXMuX3NldHVwSGllcmFyY2h5KGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICAvLyBSYXBpZXIgaXMgbG9hZGVkIG9ubHkgZm9yIG1vZGVscyB0aGF0IHVzZSBLSFJfcGh5c2ljc19yaWdpZF9ib2RpZXMuXG4gICAgYXdhaXQgcHJlbG9hZEtoclBoeXNpY3NTdXBwb3J0KGdsdGZNb2RlbCk7XG4gICAgc2V0dXBLaHJTdGF0aWNDb2xsaWRlcnMoZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcblxuICAgIHRoaXMuX19zZXR1cE5vZGVWaXNpYmlsaXR5KGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICByb290R3JvdXAudHJ5VG9TZXRVbmlxdWVOYW1lKCdGaWxlUm9vdCcsIHRydWUpO1xuICAgIHJvb3RHcm91cC50cnlUb1NldFRhZyh7IHRhZzogJ09iamVjdFR5cGUnLCB2YWx1ZTogJ3RvcCcgfSk7XG4gICAgaWYgKGdsdGZNb2RlbC5zY2VuZXNbMF0ubm9kZXMpIHtcbiAgICAgIGZvciAoY29uc3Qgbm9kZXNJbmRleCBvZiBnbHRmTW9kZWwuc2NlbmVzWzBdLm5vZGVzKSB7XG4gICAgICAgIGNvbnN0IHNnID0gcm5FbnRpdGllc1tub2Rlc0luZGV4XS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIHJvb3RHcm91cC5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQoc2cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkxvYWRlck9wdGlvbnM7XG4gICAgICBpZiAob3B0aW9ucz8ubG9hZGVyRXh0ZW5zaW9uPy5sb2FkRXh0ZW5zaW9uSW5mb0FuZFNldFRvUm9vdEdyb3VwKSB7XG4gICAgICAgIG9wdGlvbnMubG9hZGVyRXh0ZW5zaW9uLmxvYWRFeHRlbnNpb25JbmZvQW5kU2V0VG9Sb290R3JvdXAocm9vdEdyb3VwLCBnbHRmTW9kZWwpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnM/LmV4cHJlc3Npb24pIHtcbiAgICAgICAgb3B0aW9ucy5leHByZXNzaW9uLnRyeVRvU2V0VGFnKHtcbiAgICAgICAgICB0YWc6ICdnbHRmTW9kZWwnLFxuICAgICAgICAgIHZhbHVlOiBnbHRmTW9kZWwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJvb3RHcm91cC5hbGxNZXNoZXMgPSByb290R3JvdXAuc2VhcmNoRWxlbWVudHNCeVR5cGUoTV9NZXNoKTtcbiAgICByb290R3JvdXAudHJ5VG9TZXRUYWcoeyB0YWc6ICdybkVudGl0aWVzJywgdmFsdWU6IHJuRW50aXRpZXMgfSk7XG4gICAgcm9vdEdyb3VwLnRyeVRvU2V0VGFnKHsgdGFnOiAncm5FbnRpdGllc0J5TmFtZXMnLCB2YWx1ZTogcm5FbnRpdGllc0J5TmFtZXMgfSk7XG4gICAgcm9vdEdyb3VwLnRyeVRvU2V0VGFnKHsgdGFnOiAnZ2x0Zk1vZGVsJywgdmFsdWU6IGdsdGZNb2RlbCB9KTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGdsdGZNb2RlbC5leHRyYXMpKSB7XG4gICAgICAoZ2x0Zk1vZGVsIGFzIGFueSkuZXh0cmFzID0ge307XG4gICAgfVxuICAgIGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllcyA9IHJuRW50aXRpZXM7XG4gICAgZ2x0Zk1vZGVsLmV4dHJhcy5ybkVudGl0aWVzQnlOYW1lcyA9IHJuRW50aXRpZXNCeU5hbWVzO1xuXG4gICAgLy8gRWZmZWtzZWVyXG4gICAgUmhvZG9uaXRlSW1wb3J0RXh0ZW5zaW9uLmltcG9ydEVmZmVjdChyb290R3JvdXAuZW5naW5lLCBnbHRmTW9kZWwsIHJvb3RHcm91cCk7XG5cbiAgICAvLyBCaWxsYm9hcmRcbiAgICBSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24uaW1wb3J0QmlsbGJvYXJkKGdsdGZNb2RlbCwgcm5FbnRpdGllcyk7XG5cbiAgICBpZiAoSXMuZXhpc3QoZ2x0Zk1vZGVsLmV4dGVuc2lvbnNVc2VkKSkge1xuICAgICAgaWYgKGdsdGZNb2RlbC5leHRlbnNpb25zVXNlZC5pbmRleE9mKCdWUk1DX3ZybScpID4gMCkge1xuICAgICAgICAvLyB0aGlzLl9fZ2VuZXJhdGVWcm1Ob3JtYWxpemVkU2tlbGV0b24oZ2x0Zk1vZGVsLCBybkVudGl0aWVzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcm9vdEdyb3VwO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgUmhvZG9uaXRlIGJ1ZmZlcnMgZnJvbSBnbFRGIGJ1ZmZlciBkYXRhXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBjb250YWluaW5nIGJ1ZmZlciBkYXRhXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIFJob2Rvbml0ZSBCdWZmZXIgb2JqZWN0c1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVSbkJ1ZmZlcihnbHRmTW9kZWw6IFJuTTIpOiBCdWZmZXJbXSB7XG4gICAgY29uc3Qgcm5CdWZmZXJzID0gW107XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgZ2x0Zk1vZGVsLmJ1ZmZlcnMgPz8gW10pIHtcbiAgICAgIGNvbnN0IHJuQnVmZmVyID0gbmV3IEJ1ZmZlcih7XG4gICAgICAgIGJ5dGVMZW5ndGg6IGJ1ZmZlci5ieXRlTGVuZ3RoLFxuICAgICAgICBidWZmZXI6IGJ1ZmZlci5idWZmZXIgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgbmFtZTogYGdsdGYyQnVmZmVyXzBfKCR7YnVmZmVyLnVyaX0pYCxcbiAgICAgICAgYnl0ZUFsaWduOiA0LFxuICAgICAgICBidWZmZXJVc2FnZTogQnVmZmVyVXNlLkNQVUdlbmVyaWMsXG4gICAgICAgIGluZGV4T2ZUaGVCdWZmZXJVc2FnZTogMCxcbiAgICAgIH0pO1xuICAgICAgcm5CdWZmZXJzLnB1c2gocm5CdWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gcm5CdWZmZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgdHJhbnNmb3JtIHByb3BlcnRpZXMgZm9yIGVudGl0aWVzIGZyb20gZ2xURiBub2RlIGRhdGFcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIGdyb3VwcyAtIEFycmF5IG9mIHNjZW5lIGdyYXBoIGVudGl0aWVzIHRvIGFwcGx5IHRyYW5zZm9ybXMgdG9cbiAgICovXG4gIHN0YXRpYyBfc2V0dXBUcmFuc2Zvcm0oZ2x0Zk1vZGVsOiBSbk0yLCBncm91cHM6IElTY2VuZUdyYXBoRW50aXR5W10pIHtcbiAgICBmb3IgKGNvbnN0IG5vZGVfaSBpbiBnbHRmTW9kZWwubm9kZXMpIHtcbiAgICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBzW25vZGVfaV07XG4gICAgICBjb25zdCBub2RlSnNvbiA9IGdsdGZNb2RlbC5ub2Rlc1tub2RlX2ldO1xuICAgICAgY29uc3QgZ3JvdXBUcmFuc2Zvcm0gPSBncm91cC5nZXRUcmFuc2Zvcm0oKSE7XG4gICAgICBpZiAobm9kZUpzb24udHJhbnNsYXRpb24pIHtcbiAgICAgICAgZ3JvdXBUcmFuc2Zvcm0ubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICAgICAgbm9kZUpzb24udHJhbnNsYXRpb25bMF0sXG4gICAgICAgICAgbm9kZUpzb24udHJhbnNsYXRpb25bMV0sXG4gICAgICAgICAgbm9kZUpzb24udHJhbnNsYXRpb25bMl0sXG4gICAgICAgIF0pO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVKc29uLnNjYWxlKSB7XG4gICAgICAgIGdyb3VwVHJhbnNmb3JtLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW25vZGVKc29uLnNjYWxlWzBdLCBub2RlSnNvbi5zY2FsZVsxXSwgbm9kZUpzb24uc2NhbGVbMl1dKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlSnNvbi5yb3RhdGlvbikge1xuICAgICAgICBncm91cFRyYW5zZm9ybS5sb2NhbFJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tQ29weTQoXG4gICAgICAgICAgbm9kZUpzb24ucm90YXRpb25bMF0sXG4gICAgICAgICAgbm9kZUpzb24ucm90YXRpb25bMV0sXG4gICAgICAgICAgbm9kZUpzb24ucm90YXRpb25bMl0sXG4gICAgICAgICAgbm9kZUpzb24ucm90YXRpb25bM11cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlSnNvbi5tYXRyaXgpIHtcbiAgICAgICAgZ3JvdXBUcmFuc2Zvcm0ubG9jYWxNYXRyaXggPSBNYXRyaXg0NC5mcm9tQ29weUFycmF5Q29sdW1uTWFqb3Iobm9kZUpzb24ubWF0cml4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgaGllcmFyY2h5IHJlbGF0aW9uc2hpcHMgYmV0d2VlbiBlbnRpdGllcyBiYXNlZCBvbiBnbFRGIG5vZGUgc3RydWN0dXJlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzIHRvIG9yZ2FuaXplIGluIGhpZXJhcmNoeVxuICAgKi9cbiAgc3RhdGljIF9zZXR1cEhpZXJhcmNoeShnbHRmTW9kZWw6IFJuTTIsIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pIHtcbiAgICBjb25zdCBncm91cFNjZW5lQ29tcG9uZW50cyA9IHJuRW50aXRpZXMubWFwKGdyb3VwID0+IHtcbiAgICAgIHJldHVybiBncm91cC5nZXRTY2VuZUdyYXBoKCkhO1xuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBub2RlX2kgaW4gZ2x0Zk1vZGVsLm5vZGVzKSB7XG4gICAgICBjb25zdCBwYXJlbnROb2RlX2kgPSBOdW1iZXIucGFyc2VJbnQobm9kZV9pLCAxMCk7XG4gICAgICBjb25zdCBnbFRGMlBhcmVudE5vZGUgPSBnbHRmTW9kZWwubm9kZXNbcGFyZW50Tm9kZV9pXTtcbiAgICAgIGlmIChJcy5leGlzdChnbFRGMlBhcmVudE5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgIGNvbnN0IHJuUGFyZW50U2NlbmVHcmFwaENvbXBvbmVudCA9IGdyb3VwU2NlbmVDb21wb25lbnRzW3BhcmVudE5vZGVfaV07XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGROb2RlX2kgb2YgZ2xURjJQYXJlbnROb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgY29uc3Qgcm5DaGlsZFNjZW5lR3JhcGhDb21wb25lbnQgPSBncm91cFNjZW5lQ29tcG9uZW50c1tjaGlsZE5vZGVfaV07XG4gICAgICAgICAgcm5QYXJlbnRTY2VuZUdyYXBoQ29tcG9uZW50LmFkZENoaWxkKHJuQ2hpbGRTY2VuZUdyYXBoQ29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBOb2RlVmlzaWJpbGl0eShnbHRmTW9kZWw6IFJuTTIsIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pIHtcbiAgICBjb25zdCB2aXNpdGVkTm9kZUluZGljZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICBjb25zdCBzY2VuZVJvb3ROb2RlSW5kaWNlcyA9IGdsdGZNb2RlbC5zY2VuZXM/LlswXT8ubm9kZXMgPz8gW107XG5cbiAgICBmb3IgKGNvbnN0IG5vZGVJbmRleCBvZiBzY2VuZVJvb3ROb2RlSW5kaWNlcykge1xuICAgICAgdGhpcy5fX2FwcGx5Tm9kZVZpc2liaWxpdHkoZ2x0Zk1vZGVsLCBybkVudGl0aWVzLCBub2RlSW5kZXgsIHRydWUsIHZpc2l0ZWROb2RlSW5kaWNlcyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBub2RlSW5kZXhTdHJpbmcgaW4gZ2x0Zk1vZGVsLm5vZGVzKSB7XG4gICAgICBjb25zdCBub2RlSW5kZXggPSBOdW1iZXIucGFyc2VJbnQobm9kZUluZGV4U3RyaW5nLCAxMCk7XG4gICAgICBpZiAoIXZpc2l0ZWROb2RlSW5kaWNlcy5oYXMobm9kZUluZGV4KSkge1xuICAgICAgICB0aGlzLl9fYXBwbHlOb2RlVmlzaWJpbGl0eShnbHRmTW9kZWwsIHJuRW50aXRpZXMsIG5vZGVJbmRleCwgdHJ1ZSwgdmlzaXRlZE5vZGVJbmRpY2VzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2FwcGx5Tm9kZVZpc2liaWxpdHkoXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgcGFyZW50VmlzaWJsZTogYm9vbGVhbixcbiAgICB2aXNpdGVkTm9kZUluZGljZXM6IFNldDxudW1iZXI+XG4gICkge1xuICAgIGlmICh2aXNpdGVkTm9kZUluZGljZXMuaGFzKG5vZGVJbmRleCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmlzaXRlZE5vZGVJbmRpY2VzLmFkZChub2RlSW5kZXgpO1xuXG4gICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tub2RlSW5kZXhdO1xuICAgIGNvbnN0IGVudGl0eSA9IHJuRW50aXRpZXNbbm9kZUluZGV4XTtcbiAgICBpZiAoSXMubm90LmV4aXN0KG5vZGUpIHx8IElzLm5vdC5leGlzdChlbnRpdHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbG9jYWxWaXNpYmxlID0gdGhpcy5fX2dldE5vZGVWaXNpYmlsaXR5KG5vZGUpO1xuICAgIGVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlLCB2YWx1ZTogbG9jYWxWaXNpYmxlIH0pO1xuICAgIGlmIChJcy5leGlzdChub2RlLmV4dGVuc2lvbnM/LktIUl9ub2RlX3Zpc2liaWxpdHkpKSB7XG4gICAgICBlbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6IFRhZ0tock5vZGVWaXNpYmlsaXR5RW5hYmxlZCwgdmFsdWU6IHRydWUgfSk7XG4gICAgfVxuICAgIGVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlID0gcGFyZW50VmlzaWJsZSAmJiBsb2NhbFZpc2libGU7XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkTm9kZUluZGV4IG9mIG5vZGUuY2hpbGRyZW4gPz8gW10pIHtcbiAgICAgIHRoaXMuX19hcHBseU5vZGVWaXNpYmlsaXR5KFxuICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgIHJuRW50aXRpZXMsXG4gICAgICAgIGNoaWxkTm9kZUluZGV4LFxuICAgICAgICBwYXJlbnRWaXNpYmxlICYmIGxvY2FsVmlzaWJsZSxcbiAgICAgICAgdmlzaXRlZE5vZGVJbmRpY2VzXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0Tm9kZVZpc2liaWxpdHkobm9kZTogUm5NMk5vZGUpOiBib29sZWFuIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBub2RlLmV4dGVuc2lvbnM/LktIUl9ub2RlX3Zpc2liaWxpdHkgYXMgS0hSX25vZGVfdmlzaWJpbGl0eSB8IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gZXh0ZW5zaW9uPy52aXNpYmxlID8/IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhbmltYXRpb24gZGF0YSBmcm9tIGdsVEYgYW5pbWF0aW9uc1xuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gcm5CdWZmZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGJ1ZmZlcnNcbiAgICogQHBhcmFtIHJvb3RHcm91cCAtIFRoZSByb290IGdyb3VwIGVudGl0eVxuICAgKiBAcGFyYW0gcm5NYXRlcmlhbHMgLSBBcnJheSBvZiBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9zZXR1cEFuaW1hdGlvbihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBybkJ1ZmZlcnM6IEJ1ZmZlcltdLFxuICAgIHJvb3RHcm91cDogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW11cbiAgKSB7XG4gICAgaWYgKGdsdGZNb2RlbC5hbmltYXRpb25zID09IG51bGwgfHwgZ2x0Zk1vZGVsLmFuaW1hdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcm9vdEdyb3VwLmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvblN0YXRlQ29tcG9uZW50LCByb290R3JvdXApO1xuXG4gICAgZm9yIChjb25zdCBhbmltYXRpb24gb2YgZ2x0Zk1vZGVsLmFuaW1hdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3Qgc2FtcGxlciBvZiBhbmltYXRpb24uc2FtcGxlcnMpIHtcbiAgICAgICAgdGhpcy5fcmVhZEJpbmFyeUZyb21BY2Nlc3NvckFuZFNldEl0VG9BY2Nlc3NvckV4dHJhcyhlbmdpbmUsIHNhbXBsZXIuaW5wdXRPYmplY3QhLCBybkJ1ZmZlcnMpO1xuICAgICAgICB0aGlzLl9yZWFkQmluYXJ5RnJvbUFjY2Vzc29yQW5kU2V0SXRUb0FjY2Vzc29yRXh0cmFzKGVuZ2luZSwgc2FtcGxlci5vdXRwdXRPYmplY3QhLCBybkJ1ZmZlcnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYW5pbWF0aW9uIG9mIGdsdGZNb2RlbC5hbmltYXRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoYW5uZWwgb2YgYW5pbWF0aW9uLmNoYW5uZWxzKSB7XG4gICAgICAgIGlmIChJcy5leGlzdChjaGFubmVsLnNhbXBsZXJPYmplY3QpKSB7XG4gICAgICAgICAgY29uc3Qgc2FtcGxlck9iamVjdCA9IGNoYW5uZWwuc2FtcGxlck9iamVjdDtcbiAgICAgICAgICBjb25zdCBhbmltSW5wdXRBcnJheSA9IHNhbXBsZXJPYmplY3QuaW5wdXRPYmplY3QhLmV4dHJhcyEudHlwZWREYXRhQXJyYXkhO1xuICAgICAgICAgIGNvbnN0IGFuaW1PdXRwdXRBcnJheSA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLnR5cGVkRGF0YUFycmF5ITtcbiAgICAgICAgICBjb25zdCBpbnRlcnBvbGF0aW9uID0gc2FtcGxlck9iamVjdC5pbnRlcnBvbGF0aW9uID8/ICdMSU5FQVInO1xuXG4gICAgICAgICAgbGV0IGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lID0gJ3VuZGVmaW5lZCc7XG4gICAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICd0cmFuc2xhdGlvbicpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSAndHJhbnNsYXRlJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICdyb3RhdGlvbicpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSAncXVhdGVybmlvbic7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaGFubmVsLnRhcmdldC5wYXRoID09PSAncG9pbnRlcicpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSAnbWF0ZXJpYWwvJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9IGNoYW5uZWwudGFyZ2V0LnBhdGggYXMgQW5pbWF0aW9uUGF0aE5hbWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICdwb2ludGVyJykge1xuICAgICAgICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXRQb2ludGVyQW5pbWF0aW9uKFxuICAgICAgICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICAgICAgICBjaGFubmVsLFxuICAgICAgICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICAgICAgICBhbmltYXRpb24sXG4gICAgICAgICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsXG4gICAgICAgICAgICAgIHJuTWF0ZXJpYWxzLFxuICAgICAgICAgICAgICBnbHRmTW9kZWxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0Tm9ybWFsQW5pbWF0aW9uKFxuICAgICAgICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICAgICAgICBjaGFubmVsLFxuICAgICAgICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICAgICAgICBhbmltYXRpb24sXG4gICAgICAgICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGVcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgcG9pbnRlci1iYXNlZCBhbmltYXRpb24gZm9yIG1hdGVyaWFscywgbm9kZXMsIGxpZ2h0cywgYW5kIGNhbWVyYXNcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIGNoYW5uZWwgLSBBbmltYXRpb24gY2hhbm5lbCBkYXRhXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gcm5NYXRlcmlhbHMgLSBBcnJheSBvZiBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFBvaW50ZXJBbmltYXRpb24oXG4gICAgcm5FbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBjaGFubmVsOiBSbk0yQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBzYW1wbGVyT2JqZWN0OiBSbk0yQW5pbWF0aW9uU2FtcGxlcixcbiAgICBhbmltYXRpb246IFJuTTJBbmltYXRpb24sXG4gICAgYW5pbUlucHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBhbmltT3V0cHV0QXJyYXk6IEZsb2F0MzJBcnJheSxcbiAgICBpbnRlcnBvbGF0aW9uOiBzdHJpbmcsXG4gICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWUsXG4gICAgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10sXG4gICAgZ2x0Zk1vZGVsOiBSbk0yXG4gICkge1xuICAgIGNvbnN0IHBvaW50ZXIgPSBjaGFubmVsLnRhcmdldC5leHRlbnNpb25zIS5LSFJfYW5pbWF0aW9uX3BvaW50ZXIucG9pbnRlciBhcyBzdHJpbmc7XG4gICAgY29uc3QgbWF0Y2hOb2RlcyA9IHBvaW50ZXIubWF0Y2goL15cXC9ub2Rlc1xcLyhbMC05XSspXFwvLyk7XG4gICAgY29uc3QgbWF0Y2hNYXRlcmlhbHMgPSBwb2ludGVyLm1hdGNoKC9eXFwvbWF0ZXJpYWxzXFwvKFswLTldKylcXC8vKTtcbiAgICBjb25zdCBtYXRjaExpZ2h0cyA9IHBvaW50ZXIubWF0Y2goL15cXC9leHRlbnNpb25zXFwvS0hSX2xpZ2h0c19wdW5jdHVhbFxcL2xpZ2h0c1xcLyhbMC05XSspXFwvLyk7XG4gICAgY29uc3QgbWF0Y2hDYW1lcmFzID0gcG9pbnRlci5tYXRjaCgvXlxcL2NhbWVyYXNcXC8oWzAtOV0rKVxcLy8pO1xuICAgIGlmIChtYXRjaE1hdGVyaWFscykge1xuICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXRQb2ludGVyQW5pbWF0aW9uTWF0ZXJpYWxzKFxuICAgICAgICBtYXRjaE1hdGVyaWFscyxcbiAgICAgICAgcm5NYXRlcmlhbHMsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIHNhbXBsZXJPYmplY3QsXG4gICAgICAgIGFuaW1hdGlvbixcbiAgICAgICAgYW5pbUlucHV0QXJyYXksXG4gICAgICAgIGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgICAgYW5pbWF0aW9uQXR0cmlidXRlVHlwZVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoTm9kZXMpIHtcbiAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0UG9pbnRlckFuaW1hdGlvbk5vZGVzKFxuICAgICAgICBtYXRjaE5vZGVzLFxuICAgICAgICBybkVudGl0aWVzLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBzYW1wbGVyT2JqZWN0LFxuICAgICAgICBhbmltYXRpb24sXG4gICAgICAgIGFuaW1JbnB1dEFycmF5LFxuICAgICAgICBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgIGludGVycG9sYXRpb24sXG4gICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGVcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChtYXRjaExpZ2h0cykge1xuICAgICAgTW9kZWxDb252ZXJ0ZXIuX19zZXRQb2ludGVyQW5pbWF0aW9uTGlnaHRzKFxuICAgICAgICBtYXRjaExpZ2h0cyxcbiAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlLFxuICAgICAgICBnbHRmTW9kZWxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChtYXRjaENhbWVyYXMpIHtcbiAgICAgIE1vZGVsQ29udmVydGVyLl9fc2V0UG9pbnRlckFuaW1hdGlvbkNhbWVyYXMoXG4gICAgICAgIG1hdGNoQ2FtZXJhcyxcbiAgICAgICAgcm5FbnRpdGllcyxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgc2FtcGxlck9iamVjdCxcbiAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICBhbmltSW5wdXRBcnJheSxcbiAgICAgICAgYW5pbU91dHB1dEFycmF5LFxuICAgICAgICBpbnRlcnBvbGF0aW9uLFxuICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlLFxuICAgICAgICBnbHRmTW9kZWxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oJ05vdCBTdXBwb3J0ZWQgQW5pbWF0aW9uIFBvaW50ZXIgVHlwZScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHBvaW50ZXIgYW5pbWF0aW9uIGZvciBjYW1lcmEgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0Y2ggLSBSZWdleCBtYXRjaCByZXN1bHQgY29udGFpbmluZyBjYW1lcmEgaW5kZXhcbiAgICogQHBhcmFtIHJuRW50aXRpZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgZW50aXRpZXNcbiAgICogQHBhcmFtIHBvaW50ZXIgLSBBbmltYXRpb24gcG9pbnRlciBzdHJpbmdcbiAgICogQHBhcmFtIHNhbXBsZXJPYmplY3QgLSBBbmltYXRpb24gc2FtcGxlciBvYmplY3RcbiAgICogQHBhcmFtIGFuaW1hdGlvbiAtIEFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSBhbmltSW5wdXRBcnJheSAtIElucHV0IHRpbWUgdmFsdWVzXG4gICAqIEBwYXJhbSBhbmltT3V0cHV0QXJyYXkgLSBPdXRwdXQgYW5pbWF0aW9uIHZhbHVlc1xuICAgKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiAtIEludGVycG9sYXRpb24gbWV0aG9kXG4gICAqIEBwYXJhbSBhbmltYXRpb25BdHRyaWJ1dGVUeXBlIC0gVHlwZSBvZiBhbmltYXRpb24gYXR0cmlidXRlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldFBvaW50ZXJBbmltYXRpb25DYW1lcmFzKFxuICAgIG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5LFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgcG9pbnRlcjogc3RyaW5nLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBfYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yXG4gICkge1xuICAgIGNvbnN0IGNhbWVyYUluZGV4ID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgY29uc3Qgbm9kZXMgPSBnbHRmTW9kZWwubm9kZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGUuY2FtZXJhID09PSBjYW1lcmFJbmRleCkge1xuICAgICAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXNbaV07XG4gICAgICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0Q2FtZXJhKCk7XG4gICAgICAgIGlmIChJcy5ub3QuZXhpc3QoY2FtZXJhQ29tcG9uZW50KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2FtZXJhQ29tcG9uZW50IG5vdCBmb3VuZDogJHtwb2ludGVyfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG91dHB1dENvbXBvbmVudE4gPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS5jb21wb25lbnROITtcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUgOiAnVW50aXRsZWRfQW5pbWF0aW9uJztcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICAgICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXksXG4gICAgICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgICAgb3V0cHV0Q29tcG9uZW50Tjogb3V0cHV0Q29tcG9uZW50TiBhcyBWZWN0b3JDb21wb25lbnROLFxuICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICAgICAgfTtcbiAgICAgICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwgYW5pbWF0aW9uU2FtcGxlcik7XG5cbiAgICAgICAgbGV0IGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlO1xuICAgICAgICBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRTY2FsYXIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMikge1xuICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDMpIHtcbiAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSA0KSB7XG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjQoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb25lbnQgbnVtYmVyOiAke291dHB1dENvbXBvbmVudE59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBybkVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCd6bmVhcicpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignY2FtZXJhX3puZWFyJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnemZhcicpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignY2FtZXJhX3pmYXInLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCd5Zm92JykpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdjYW1lcmFfZm92eScsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3htYWcnKSkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2NhbWVyYV94bWFnJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygneW1hZycpKSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignY2FtZXJhX3ltYWcnLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHBvaW50ZXIgYW5pbWF0aW9uIGZvciBsaWdodCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBtYXRjaCAtIFJlZ2V4IG1hdGNoIHJlc3VsdCBjb250YWluaW5nIGxpZ2h0IGluZGV4XG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBwb2ludGVyIC0gQW5pbWF0aW9uIHBvaW50ZXIgc3RyaW5nXG4gICAqIEBwYXJhbSBzYW1wbGVyT2JqZWN0IC0gQW5pbWF0aW9uIHNhbXBsZXIgb2JqZWN0XG4gICAqIEBwYXJhbSBhbmltYXRpb24gLSBBbmltYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYW5pbUlucHV0QXJyYXkgLSBJbnB1dCB0aW1lIHZhbHVlc1xuICAgKiBAcGFyYW0gYW5pbU91dHB1dEFycmF5IC0gT3V0cHV0IGFuaW1hdGlvbiB2YWx1ZXNcbiAgICogQHBhcmFtIGludGVycG9sYXRpb24gLSBJbnRlcnBvbGF0aW9uIG1ldGhvZFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uQXR0cmlidXRlVHlwZSAtIFR5cGUgb2YgYW5pbWF0aW9uIGF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRQb2ludGVyQW5pbWF0aW9uTGlnaHRzKFxuICAgIG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5LFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgcG9pbnRlcjogc3RyaW5nLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBfYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yXG4gICkge1xuICAgIGNvbnN0IGxpZ2h0SW5kZXggPSBOdW1iZXIucGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBjb25zdCBub2RlcyA9IGdsdGZNb2RlbC5ub2RlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICBpZiAobm9kZS5leHRlbnNpb25zPy5LSFJfbGlnaHRzX3B1bmN0dWFsKSB7XG4gICAgICAgIGNvbnN0IGxpZ2h0SWR4ID0gbm9kZS5leHRlbnNpb25zLktIUl9saWdodHNfcHVuY3R1YWwubGlnaHRJbmRleDtcbiAgICAgICAgaWYgKGxpZ2h0SWR4ID09PSBsaWdodEluZGV4KSB7XG4gICAgICAgICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzW2ldO1xuICAgICAgICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRMaWdodCgpO1xuICAgICAgICAgIGlmIChJcy5ub3QuZXhpc3QobGlnaHRDb21wb25lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExpZ2h0Q29tcG9uZW50IG5vdCBmb3VuZDogJHtwb2ludGVyfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBvdXRwdXRDb21wb25lbnROID0gc2FtcGxlck9iamVjdC5vdXRwdXRPYmplY3QhLmV4dHJhcyEuY29tcG9uZW50TiE7XG4gICAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgICBjb25zdCB0cmFja05hbWUgPSBJcy5leGlzdChhbmltYXRpb24ubmFtZSkgPyBhbmltYXRpb24ubmFtZSA6ICdVbnRpdGxlZF9BbmltYXRpb24nO1xuICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXIgPSB7XG4gICAgICAgICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXksXG4gICAgICAgICAgICBvdXRwdXQ6IGFuaW1PdXRwdXRBcnJheSxcbiAgICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IG91dHB1dENvbXBvbmVudE4gYXMgVmVjdG9yQ29tcG9uZW50TixcbiAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIGFuaW1hdGlvblNhbXBsZXIpO1xuXG4gICAgICAgICAgbGV0IGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlO1xuICAgICAgICAgIGlmIChvdXRwdXRDb21wb25lbnROID09PSAxKSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkU2NhbGFyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMikge1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjIoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSAzKSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDQpIHtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3I0KGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGNvbXBvbmVudCBudW1iZXI6ICR7b3V0cHV0Q29tcG9uZW50Tn1gKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICAgICAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gcm5FbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocG9pbnRlci5pbmNsdWRlcygnY29sb3InKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignbGlnaHRfY29sb3InLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ2ludGVuc2l0eScpKSB7XG4gICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdsaWdodF9pbnRlbnNpdHknLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3JhbmdlJykpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2xpZ2h0X3JhbmdlJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdzcG90L2lubmVyQ29uZUFuZ2xlJykpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oJ2xpZ2h0X3Nwb3RfaW5uZXJDb25lQW5nbGUnLCBhbmltYXRlZFZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ3Nwb3Qvb3V0ZXJDb25lQW5nbGUnKSkge1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbignbGlnaHRfc3BvdF9vdXRlckNvbmVBbmdsZScsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHBvaW50ZXIgYW5pbWF0aW9uIGZvciBub2RlIHByb3BlcnRpZXMgKHRyYW5zZm9ybSwgd2VpZ2h0cylcbiAgICogQHBhcmFtIG1hdGNoIC0gUmVnZXggbWF0Y2ggcmVzdWx0IGNvbnRhaW5pbmcgbm9kZSBpbmRleFxuICAgKiBAcGFyYW0gcm5FbnRpdGllcyAtIEFycmF5IG9mIFJob2Rvbml0ZSBlbnRpdGllc1xuICAgKiBAcGFyYW0gcG9pbnRlciAtIEFuaW1hdGlvbiBwb2ludGVyIHN0cmluZ1xuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UG9pbnRlckFuaW1hdGlvbk5vZGVzKFxuICAgIG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5LFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgcG9pbnRlcjogc3RyaW5nLFxuICAgIHNhbXBsZXJPYmplY3Q6IFJuTTJBbmltYXRpb25TYW1wbGVyLFxuICAgIGFuaW1hdGlvbjogUm5NMkFuaW1hdGlvbixcbiAgICBhbmltSW5wdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGFuaW1PdXRwdXRBcnJheTogRmxvYXQzMkFycmF5LFxuICAgIGludGVycG9sYXRpb246IHN0cmluZyxcbiAgICBfYW5pbWF0aW9uQXR0cmlidXRlVHlwZTogQW5pbWF0aW9uUGF0aE5hbWVcbiAgKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzW25vZGVJbmRleF07XG4gICAgaWYgKElzLm5vdC5leGlzdChybkVudGl0eSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQ6ICR7cG9pbnRlcn1gKTtcbiAgICB9XG4gICAgbGV0IG91dHB1dENvbXBvbmVudE4gPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS5jb21wb25lbnROITtcbiAgICBpZiAocG9pbnRlci5pbmNsdWRlcygnd2VpZ2h0cycpKSB7XG4gICAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRCbGVuZFNoYXBlKCk7XG4gICAgICBpZiAoSXMuZXhpc3QoYmxlbmRTaGFwZUNvbXBvbmVudCkpIHtcbiAgICAgICAgb3V0cHV0Q29tcG9uZW50TiA9IGJsZW5kU2hhcGVDb21wb25lbnQud2VpZ2h0cy5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJsZW5kU2hhcGVDb21wb25lbnQgbm90IGZvdW5kOiAke3BvaW50ZXJ9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUgOiAnVW50aXRsZWRfQW5pbWF0aW9uJztcbiAgICBjb25zdCBhbmltYXRpb25TYW1wbGVyID0ge1xuICAgICAgaW5wdXQ6IGFuaW1JbnB1dEFycmF5LFxuICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXksXG4gICAgICBvdXRwdXRDb21wb25lbnROOiBvdXRwdXRDb21wb25lbnROIGFzIFZlY3RvckNvbXBvbmVudE4sXG4gICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBBbmltYXRpb25JbnRlcnBvbGF0aW9uLmZyb21TdHJpbmcoaW50ZXJwb2xhdGlvbiksXG4gICAgfTtcbiAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCBhbmltYXRpb25TYW1wbGVyKTtcblxuICAgIGxldCBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZTtcblxuICAgIGlmIChwb2ludGVyLmluY2x1ZGVzKCd3ZWlnaHRzJykpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3JOKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDIpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMykge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSA0KSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yNChhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb25lbnQgbnVtYmVyOiAke291dHB1dENvbXBvbmVudE59YCk7XG4gICAgfVxuICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSBybkVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSBybkVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudCA9IG5ld1JuRW50aXR5LmdldEFuaW1hdGlvbigpO1xuICAgIH1cbiAgICBpZiAocG9pbnRlci5pbmNsdWRlcygncm90YXRpb24nKSkge1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbigncXVhdGVybmlvbicsIGFuaW1hdGVkVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygndHJhbnNsYXRpb24nKSkge1xuICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbigndHJhbnNsYXRlJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdzY2FsZScpKSB7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCdzY2FsZScsIGFuaW1hdGVkVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlci5pbmNsdWRlcygnd2VpZ2h0cycpKSB7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCd3ZWlnaHRzJywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChwb2ludGVyLmluY2x1ZGVzKCdLSFJfbm9kZV92aXNpYmlsaXR5L3Zpc2libGUnKSkge1xuICAgICAgcm5FbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6IFRhZ0tock5vZGVWaXNpYmlsaXR5RW5hYmxlZCwgdmFsdWU6IHRydWUgfSk7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKCd2aXNpYmlsaXR5JywgYW5pbWF0ZWRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgcG9pbnRlciBhbmltYXRpb24gZm9yIG1hdGVyaWFsIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIG1hdGNoIC0gUmVnZXggbWF0Y2ggcmVzdWx0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgaW5kZXhcbiAgICogQHBhcmFtIHJuTWF0ZXJpYWxzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gcG9pbnRlciAtIEFuaW1hdGlvbiBwb2ludGVyIHN0cmluZ1xuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0UG9pbnRlckFuaW1hdGlvbk1hdGVyaWFscyhcbiAgICBtYXRjaDogUmVnRXhwTWF0Y2hBcnJheSxcbiAgICBybk1hdGVyaWFsczogTWF0ZXJpYWxbXSxcbiAgICBwb2ludGVyOiBzdHJpbmcsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIF9hbmltYXRpb25BdHRyaWJ1dGVUeXBlOiBBbmltYXRpb25QYXRoTmFtZVxuICApIHtcbiAgICBjb25zdCBtYXRlcmlhbEluZGV4ID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgY29uc3QgbWF0ZXJpYWwgPSBybk1hdGVyaWFsc1ttYXRlcmlhbEluZGV4XTtcbiAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNYXRlcmlhbCBub3QgZm91bmQ6ICR7cG9pbnRlcn1gKTtcbiAgICB9XG4gICAgY29uc3Qgb3V0cHV0Q29tcG9uZW50TiA9IHNhbXBsZXJPYmplY3Qub3V0cHV0T2JqZWN0IS5leHRyYXMhLmNvbXBvbmVudE4hO1xuICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUgOiAnVW50aXRsZWRfQW5pbWF0aW9uJztcbiAgICBjb25zdCBhbmltYXRpb25TYW1wbGVyID0ge1xuICAgICAgaW5wdXQ6IGFuaW1JbnB1dEFycmF5LFxuICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXksXG4gICAgICBvdXRwdXRDb21wb25lbnROOiBvdXRwdXRDb21wb25lbnROIGFzIFZlY3RvckNvbXBvbmVudE4sXG4gICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBBbmltYXRpb25JbnRlcnBvbGF0aW9uLmZyb21TdHJpbmcoaW50ZXJwb2xhdGlvbiksXG4gICAgfTtcbiAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCBhbmltYXRpb25TYW1wbGVyKTtcblxuICAgIGxldCBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZTtcbiAgICBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMSkge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dENvbXBvbmVudE4gPT09IDIpIHtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IyKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgIH0gZWxzZSBpZiAob3V0cHV0Q29tcG9uZW50TiA9PT0gMykge1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvdXRwdXRDb21wb25lbnROID09PSA0KSB7XG4gICAgICBhbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yNChhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjb21wb25lbnQgbnVtYmVyOiAke291dHB1dENvbXBvbmVudE59YCk7XG4gICAgfVxuICAgIGxldCBzaGFkZXJTZW1hbnRpY05hbWUgPSAnJztcbiAgICBpZiAocG9pbnRlci5pbmNsdWRlcygnS0hSX3RleHR1cmVfdHJhbnNmb3JtJykpIHtcbiAgICAgIGNvbnN0IHNwbGl0ID0gcG9pbnRlci5zcGxpdCgnLycpO1xuICAgICAgY29uc3QgdGV4dHVyZU5hbWUgPSBzcGxpdFtzcGxpdC5sZW5ndGggLSA0XTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybVR5cGUgPSBzcGxpdFtzcGxpdC5sZW5ndGggLSAxXTtcbiAgICAgIGNvbnN0IGNhcGl0YWxpemVkVHJhbnNmb3JtVHlwZSA9IHRyYW5zZm9ybVR5cGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0cmFuc2Zvcm1UeXBlLnNsaWNlKDEpO1xuICAgICAgc2hhZGVyU2VtYW50aWNOYW1lID0gYCR7dGV4dHVyZU5hbWV9VHJhbnNmb3JtJHtjYXBpdGFsaXplZFRyYW5zZm9ybVR5cGV9YDtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ25vcm1hbFRleHR1cmUvc2NhbGUnKSkge1xuICAgICAgc2hhZGVyU2VtYW50aWNOYW1lID0gJ25vcm1hbFNjYWxlJztcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXIuaW5jbHVkZXMoJ29jY2x1c2lvblRleHR1cmUvc3RyZW5ndGgnKSkge1xuICAgICAgc2hhZGVyU2VtYW50aWNOYW1lID0gJ29jY2x1c2lvblN0cmVuZ3RoJztcbiAgICB9IGVsc2Uge1xuICAgICAgc2hhZGVyU2VtYW50aWNOYW1lID0gcG9pbnRlci5zcGxpdCgnLycpLnBvcCgpITtcbiAgICB9XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHNoYWRlclNlbWFudGljTmFtZSwgYW5pbWF0ZWRWYWx1ZSk7XG5cbiAgICBjb25zdCBwcmltaXRpdmVzID0gbWF0ZXJpYWwuZ2V0QmVsb25nUHJpbWl0aXZlcygpO1xuICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHByaW1pdGl2ZXMudmFsdWVzKCkpIHtcbiAgICAgIGlmIChJcy5leGlzdChwcmltaXRpdmUubWVzaCkpIHtcbiAgICAgICAgY29uc3QgbWVzaCA9IHByaW1pdGl2ZS5tZXNoIGFzIE1lc2g7XG4gICAgICAgIGNvbnN0IG1lc2hFbnRpdGllcyA9IG1lc2gubWVzaEVudGl0aWVzSW5uZXI7XG4gICAgICAgIGZvciAoY29uc3Qgcm5FbnRpdHkgb2YgbWVzaEVudGl0aWVzKSB7XG4gICAgICAgICAgbGV0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJuRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICAgICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdSbkVudGl0eSA9IHJuRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvbkNvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYG1hdGVyaWFsLyR7c2hhZGVyU2VtYW50aWNOYW1lfWAsIGFuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgc3RhbmRhcmQgYW5pbWF0aW9uIChub24tcG9pbnRlciBiYXNlZCkgZm9yIHRyYW5zZm9ybSBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBjaGFubmVsIC0gQW5pbWF0aW9uIGNoYW5uZWwgZGF0YVxuICAgKiBAcGFyYW0gc2FtcGxlck9iamVjdCAtIEFuaW1hdGlvbiBzYW1wbGVyIG9iamVjdFxuICAgKiBAcGFyYW0gYW5pbWF0aW9uIC0gQW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIGFuaW1JbnB1dEFycmF5IC0gSW5wdXQgdGltZSB2YWx1ZXNcbiAgICogQHBhcmFtIGFuaW1PdXRwdXRBcnJheSAtIE91dHB1dCBhbmltYXRpb24gdmFsdWVzXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uIC0gSW50ZXJwb2xhdGlvbiBtZXRob2RcbiAgICogQHBhcmFtIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgLSBUeXBlIG9mIGFuaW1hdGlvbiBhdHRyaWJ1dGVcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0Tm9ybWFsQW5pbWF0aW9uKFxuICAgIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgY2hhbm5lbDogUm5NMkFuaW1hdGlvbkNoYW5uZWwsXG4gICAgc2FtcGxlck9iamVjdDogUm5NMkFuaW1hdGlvblNhbXBsZXIsXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGFuaW1JbnB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgYW5pbU91dHB1dEFycmF5OiBGbG9hdDMyQXJyYXksXG4gICAgaW50ZXJwb2xhdGlvbjogc3RyaW5nLFxuICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGU6IEFuaW1hdGlvblBhdGhOYW1lXG4gICkge1xuICAgIGNvbnN0IHJuRW50aXR5ID0gcm5FbnRpdGllc1tjaGFubmVsLnRhcmdldC5ub2RlIV0gYXMgSUFuaW1hdGlvbkVudGl0eTtcbiAgICBpZiAoSXMuZXhpc3Qocm5FbnRpdHkpKSB7XG4gICAgICBsZXQgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm5FbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QoYW5pbWF0aW9uQ29tcG9uZW50KSkge1xuICAgICAgICBjb25zdCBuZXdSbkVudGl0eSA9IHJuRW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KEFuaW1hdGlvbkNvbXBvbmVudCwgcm5FbnRpdHkpO1xuICAgICAgICBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcbiAgICAgIH1cbiAgICAgIGlmIChJcy5leGlzdChhbmltYXRpb25Db21wb25lbnQpKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dENvbXBvbmVudE4gPSBzYW1wbGVyT2JqZWN0Lm91dHB1dE9iamVjdCEuZXh0cmFzIS5jb21wb25lbnROITtcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUgOiAnVW50aXRsZWRfQW5pbWF0aW9uJztcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlciA9IHtcbiAgICAgICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXksXG4gICAgICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXksXG4gICAgICAgICAgb3V0cHV0Q29tcG9uZW50Tjogb3V0cHV0Q29tcG9uZW50TiBhcyBWZWN0b3JDb21wb25lbnROLFxuICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICAgICAgfTtcbiAgICAgICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwgYW5pbWF0aW9uU2FtcGxlcik7XG4gICAgICAgIGlmIChhbmltYXRpb25BdHRyaWJ1dGVUeXBlID09PSAndHJhbnNsYXRlJykge1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYW5pbWF0aW9uQXR0cmlidXRlVHlwZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9PT0gJ3F1YXRlcm5pb24nKSB7XG4gICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFF1YXRlcm5pb24oYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbihhbmltYXRpb25BdHRyaWJ1dGVUeXBlLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChhbmltYXRpb25BdHRyaWJ1dGVUeXBlID09PSAnc2NhbGUnKSB7XG4gICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFZlY3RvcjMoYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldEFuaW1hdGlvbihhbmltYXRpb25BdHRyaWJ1dGVUeXBlLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB3ZWlnaHRcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yTihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgc2tlbGV0YWwgYW5pbWF0aW9uIGFuZCBqb2ludCBoaWVyYXJjaGllcyBmcm9tIGdsVEYgc2tpbiBkYXRhXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBybkVudGl0aWVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGVudGl0aWVzXG4gICAqIEBwYXJhbSBybkJ1ZmZlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgYnVmZmVyc1xuICAgKi9cbiAgc3RhdGljIF9zZXR1cFNrZWxldG9uKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIsIHJuRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sIHJuQnVmZmVyczogQnVmZmVyW10pIHtcbiAgICBpZiAoZ2x0Zk1vZGVsLnNraW5zID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmb3JjZWRCb25lRGF0YVR5cGUgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmJvbmVEYXRhVHlwZTtcblxuICAgIGZvciAoY29uc3Qgbm9kZV9pIGluIGdsdGZNb2RlbC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tub2RlX2ldO1xuICAgICAgY29uc3QgX3NnID0gcm5FbnRpdGllc1tub2RlX2ldLmdldFNjZW5lR3JhcGgoKSE7XG4gICAgICBsZXQgc2tlbGV0YWxDb21wb25lbnQ6IFNrZWxldGFsQ29tcG9uZW50O1xuICAgICAgaWYgKElzLmV4aXN0KG5vZGUuc2tpbk9iamVjdCkpIHtcbiAgICAgICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzW25vZGVfaV07XG4gICAgICAgIGNvbnN0IG5ld1JuRW50aXR5ID0gZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoU2tlbGV0YWxDb21wb25lbnQsIHJuRW50aXR5KTtcbiAgICAgICAgc2tlbGV0YWxDb21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRTa2VsZXRhbCgpO1xuXG4gICAgICAgIGNvbnN0IGludmVyc2VCaW5kTWF0QWNjZXNzb3IgPSBub2RlLnNraW5PYmplY3QuaW52ZXJzZUJpbmRNYXRyaWNlc09iamVjdDtcbiAgICAgICAgY29uc3Qgcm5BY2Nlc3Nvck9mSW52ZXJzZUJpbmRNYXQgPSBJcy5leGlzdChpbnZlcnNlQmluZE1hdEFjY2Vzc29yKVxuICAgICAgICAgID8gdGhpcy5fX2dldFJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3IoZW5naW5lLCBpbnZlcnNlQmluZE1hdEFjY2Vzc29yLCBybkJ1ZmZlcnMpXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gQ2hvb3NlIHRoZSBib25lIGRhdGEgdHlwZSBiZWZvcmUgc2V0Sm9pbnRzKCkgc28gdGhhdCB0aGUgR1BVIGJvbmUgZGF0YSBpcyBhbGxvY2F0ZWQgb25seSBvbmNlLlxuICAgICAgICAvLyBNYXQ0M3gxIGlzIHVzZWQgb25seSB3aGVuIHNwZWNpZmllZCBleHBsaWNpdGx5IGJ5IHRoZSBsb2FkZXIgb3B0aW9uIChvciBDb25maWcuYm9uZURhdGFUeXBlKS5cbiAgICAgICAgaWYgKGZvcmNlZEJvbmVEYXRhVHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgc2tlbGV0YWxDb21wb25lbnQuc2V0Qm9uZURhdGFUeXBlKGZvcmNlZEJvbmVEYXRhVHlwZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQW4gYXV0b21hdGljYWxseSBzZWxlY3RlZCBWZWM0eDEgaXMgc3dpdGNoZWQgdG8gVmVjNHgyIGlmIGEgbm9uLXVuaWZvcm0gc2NhbGUgYXBwZWFycyBhdCBydW50aW1lXG4gICAgICAgICAgY29uc3QgaXNBdXRvU2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIHNrZWxldGFsQ29tcG9uZW50LnNldEJvbmVEYXRhVHlwZShcbiAgICAgICAgICAgIGRldGVjdEJvbmVEYXRhVHlwZUZvclNraW4oXG4gICAgICAgICAgICAgIGdsdGZNb2RlbCxcbiAgICAgICAgICAgICAgbm9kZS5za2luT2JqZWN0LFxuICAgICAgICAgICAgICBOdW1iZXIobm9kZV9pKSxcbiAgICAgICAgICAgICAgcm5BY2Nlc3Nvck9mSW52ZXJzZUJpbmRNYXQ/LmdldFR5cGVkQXJyYXkoKVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIGlzQXV0b1NlbGVjdGVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChJcy5leGlzdChub2RlLnNraW5PYmplY3QuYmluZFNoYXBlTWF0cml4KSkge1xuICAgICAgICAgIHNrZWxldGFsQ29tcG9uZW50Ll9iaW5kU2hhcGVNYXRyaXggPSBNYXRyaXg0NC5mcm9tQ29weUFycmF5Q29sdW1uTWFqb3Iobm9kZS5za2luT2JqZWN0LmJpbmRTaGFwZU1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBqb2ludF9pIG9mIG5vZGUuc2tpbk9iamVjdC5qb2ludHMpIHtcbiAgICAgICAgICBjb25zdCBzZyA9IHJuRW50aXRpZXNbam9pbnRfaV0uZ2V0U2NlbmVHcmFwaCgpITtcbiAgICAgICAgICBzZy5qb2ludEluZGV4ID0gam9pbnRfaTtcbiAgICAgICAgfVxuICAgICAgICAvLyBgc2tpbi5za2VsZXRvbmAgaXMgb3B0aW9uYWwgaW4gZ2xURi4gVGhlIGpvaW50cyBhbmQgdGhlaXIgYm9uZSBkYXRhIG11c3QgYmUgc2V0XG4gICAgICAgIC8vIHVwIHJlZ2FyZGxlc3M7IHdoZW4gdGhlIHNrZWxldG9uIHJvb3QgaXMgb21pdHRlZCwgdGhlIGNvbW1vbiBhbmNlc3RvciBvZiB0aGVcbiAgICAgICAgLy8gam9pbnRzIGlzIHRoZSByb290IG9mIHRoZSBqb2ludCBoaWVyYXJjaHkuXG4gICAgICAgIGNvbnN0IGpvaW50cyA9IG5vZGUuc2tpbk9iamVjdC5qb2ludHMubWFwKGkgPT4gcm5FbnRpdGllc1tpXS5nZXRTY2VuZUdyYXBoKCkhKTtcbiAgICAgICAgc2tlbGV0YWxDb21wb25lbnQuc2V0Sm9pbnRzKGpvaW50cyk7XG4gICAgICAgIGNvbnN0IHNrZWxldG9uUm9vdCA9IElzLmV4aXN0KG5vZGUuc2tpbk9iamVjdC5za2VsZXRvbilcbiAgICAgICAgICA/IHJuRW50aXRpZXNbbm9kZS5za2luT2JqZWN0LnNrZWxldG9uXS5nZXRTY2VuZUdyYXBoKClcbiAgICAgICAgICA6IHRoaXMuX19nZXRDb21tb25BbmNlc3Rvck9mSm9pbnRzKGpvaW50cyk7XG4gICAgICAgIHNrZWxldGFsQ29tcG9uZW50LnRvcE9mSm9pbnRzSGllcmFyY2h5ID0gc2tlbGV0b25Sb290ID8/IGpvaW50c1swXTtcbiAgICAgICAgaWYgKHNrZWxldG9uUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgc2tlbGV0b25Sb290LmlzUm9vdEpvaW50ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChJcy5leGlzdChybkFjY2Vzc29yT2ZJbnZlcnNlQmluZE1hdCkpIHtcbiAgICAgICAgICBza2VsZXRhbENvbXBvbmVudCEuc2V0SW52ZXJzZUJpbmRNYXRyaWNlc0FjY2Vzc29yKHJuQWNjZXNzb3JPZkludmVyc2VCaW5kTWF0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsb3dlc3QgY29tbW9uIGFuY2VzdG9yIG9mIHRoZSBnaXZlbiBqb2ludHMgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICAgKiBnbFRGJ3MgYHNraW4uc2tlbGV0b25gIGlzIG9wdGlvbmFsOyB3aGVuIGl0IGlzIG9taXR0ZWQsIHRoZSBjb21tb24gcm9vdCBvZiB0aGVcbiAgICogam9pbnRzIGlzIHRoZSByb290IG9mIHRoZSBza2luJ3Mgam9pbnQgaGllcmFyY2h5LlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRDb21tb25BbmNlc3Rvck9mSm9pbnRzKGpvaW50czogU2NlbmVHcmFwaENvbXBvbmVudFtdKTogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGpvaW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGFuY2VzdG9yQ2hhaW4gPSBuZXcgU2V0PFNjZW5lR3JhcGhDb21wb25lbnQ+KCk7XG4gICAgbGV0IGN1cnJlbnQ6IFNjZW5lR3JhcGhDb21wb25lbnQgfCB1bmRlZmluZWQgPSBqb2ludHNbMF07XG4gICAgd2hpbGUgKGN1cnJlbnQgIT0gbnVsbCkge1xuICAgICAgYW5jZXN0b3JDaGFpbi5hZGQoY3VycmVudCk7XG4gICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgfVxuICAgIGxldCBjb21tb246IFNjZW5lR3JhcGhDb21wb25lbnQgPSBqb2ludHNbMF07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBqb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBub2RlOiBTY2VuZUdyYXBoQ29tcG9uZW50IHwgdW5kZWZpbmVkID0gam9pbnRzW2ldO1xuICAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCAmJiAhYW5jZXN0b3JDaGFpbi5oYXMobm9kZSkpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgIT09IGNvbW1vbikge1xuICAgICAgICBjb21tb24gPSBub2RlO1xuICAgICAgICBhbmNlc3RvckNoYWluLmNsZWFyKCk7XG4gICAgICAgIGxldCBhbmNlc3RvcjogU2NlbmVHcmFwaENvbXBvbmVudCB8IHVuZGVmaW5lZCA9IGNvbW1vbjtcbiAgICAgICAgd2hpbGUgKGFuY2VzdG9yICE9IG51bGwpIHtcbiAgICAgICAgICBhbmNlc3RvckNoYWluLmFkZChhbmNlc3Rvcik7XG4gICAgICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbW1vbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgc21vb3RoIHZlcnRleCBub3JtYWxzIGZvciBwcmltaXRpdmVzIHRoYXQgaGF2ZSBubyBOT1JNQUwgYXR0cmlidXRlLlxuICAgKiBnbFRGIHJlcXVpcmVzIGltcGxlbWVudGF0aW9ucyB0byBjYWxjdWxhdGUgbm9ybWFscyB3aGVuIHRoZXkgYXJlIGFic2VudDsgd2l0aG91dFxuICAgKiB0aGVtIGxpdCBtYXRlcmlhbHMgcmVjZWl2ZSBhIHplcm8gbm9ybWFsIGFuZCBzaGFkZSBpbmNvcnJlY3RseSAoYmxhY2sgb3IgTmFOKS5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVOb3JtYWxzSWZNaXNzaW5nKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHByaW1pdGl2ZTogUHJpbWl0aXZlLFxuICAgIGluZGljZXNBY2Nlc3NvcjogQWNjZXNzb3IgfCB1bmRlZmluZWRcbiAgKTogdm9pZCB7XG4gICAgaWYgKElzLmV4aXN0KHByaW1pdGl2ZS5nZXRBdHRyaWJ1dGUoVmVydGV4QXR0cmlidXRlLk5vcm1hbC5YWVopKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBtb2RlID0gcHJpbWl0aXZlLnByaW1pdGl2ZU1vZGU7XG4gICAgaWYgKFxuICAgICAgbW9kZSAhPT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZXMgJiZcbiAgICAgIG1vZGUgIT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCAmJlxuICAgICAgbW9kZSAhPT0gUHJpbWl0aXZlTW9kZS5UcmlhbmdsZUZhblxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gcHJpbWl0aXZlLmdldEF0dHJpYnV0ZShWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaKTtcbiAgICBpZiAoIUlzLmV4aXN0KHBvc2l0aW9uQWNjZXNzb3IpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZlcnRleENvdW50ID0gcG9zaXRpb25BY2Nlc3Nvci5lbGVtZW50Q291bnQ7XG4gICAgaWYgKHZlcnRleENvdW50ID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkodmVydGV4Q291bnQgKiAzKTtcbiAgICBjb25zdCBpbmRleENvdW50ID0gaW5kaWNlc0FjY2Vzc29yICE9IG51bGwgPyBpbmRpY2VzQWNjZXNzb3IuZWxlbWVudENvdW50IDogdmVydGV4Q291bnQ7XG4gICAgY29uc3QgZ2V0VmVydGV4SW5kZXggPSAoaTogbnVtYmVyKSA9PiAoaW5kaWNlc0FjY2Vzc29yICE9IG51bGwgPyBpbmRpY2VzQWNjZXNzb3IuZ2V0U2NhbGFyKGksIHt9KSA6IGkpO1xuICAgIGNvbnN0IGFjY3VtdWxhdGVUcmlhbmdsZSA9IChpYTogbnVtYmVyLCBpYjogbnVtYmVyLCBpYzogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBhID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGlhLCB7fSk7XG4gICAgICBjb25zdCBiID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGliLCB7fSk7XG4gICAgICBjb25zdCBjID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKGljLCB7fSk7XG4gICAgICBjb25zdCBhYnggPSBiLnggLSBhLng7XG4gICAgICBjb25zdCBhYnkgPSBiLnkgLSBhLnk7XG4gICAgICBjb25zdCBhYnogPSBiLnogLSBhLno7XG4gICAgICBjb25zdCBhY3ggPSBjLnggLSBhLng7XG4gICAgICBjb25zdCBhY3kgPSBjLnkgLSBhLnk7XG4gICAgICBjb25zdCBhY3ogPSBjLnogLSBhLno7XG4gICAgICAvLyBBcmVhIHdlaWdodGVkIGZhY2Ugbm9ybWFsOyB0aGUgYWNjdW11bGF0ZWQgcmVzdWx0IGlzIG5vcm1hbGl6ZWQgYXQgdGhlIGVuZC5cbiAgICAgIGNvbnN0IG54ID0gYWJ5ICogYWN6IC0gYWJ6ICogYWN5O1xuICAgICAgY29uc3QgbnkgPSBhYnogKiBhY3ggLSBhYnggKiBhY3o7XG4gICAgICBjb25zdCBueiA9IGFieCAqIGFjeSAtIGFieSAqIGFjeDtcbiAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgW2lhLCBpYiwgaWNdKSB7XG4gICAgICAgIG5vcm1hbHNbaW5kZXggKiAzXSArPSBueDtcbiAgICAgICAgbm9ybWFsc1tpbmRleCAqIDMgKyAxXSArPSBueTtcbiAgICAgICAgbm9ybWFsc1tpbmRleCAqIDMgKyAyXSArPSBuejtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSArIDIgPCBpbmRleENvdW50OyBpICs9IDMpIHtcbiAgICAgICAgYWNjdW11bGF0ZVRyaWFuZ2xlKGdldFZlcnRleEluZGV4KGkpLCBnZXRWZXJ0ZXhJbmRleChpICsgMSksIGdldFZlcnRleEluZGV4KGkgKyAyKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpICsgMiA8IGluZGV4Q291bnQ7IGkrKykge1xuICAgICAgICBpZiAoaSAlIDIgPT09IDApIHtcbiAgICAgICAgICBhY2N1bXVsYXRlVHJpYW5nbGUoZ2V0VmVydGV4SW5kZXgoaSksIGdldFZlcnRleEluZGV4KGkgKyAxKSwgZ2V0VmVydGV4SW5kZXgoaSArIDIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhY2N1bXVsYXRlVHJpYW5nbGUoZ2V0VmVydGV4SW5kZXgoaSArIDEpLCBnZXRWZXJ0ZXhJbmRleChpKSwgZ2V0VmVydGV4SW5kZXgoaSArIDIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSArIDEgPCBpbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgYWNjdW11bGF0ZVRyaWFuZ2xlKGdldFZlcnRleEluZGV4KDApLCBnZXRWZXJ0ZXhJbmRleChpKSwgZ2V0VmVydGV4SW5kZXgoaSArIDEpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBieXRlTGVuZ3RoID0gdmVydGV4Q291bnQgKiAzICogNDtcbiAgICBjb25zdCBidWZmZXIgPSBlbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChCdWZmZXJVc2UuQ1BVR2VuZXJpYywgYnl0ZUxlbmd0aCwgNCk7XG4gICAgY29uc3QgYnVmZmVyVmlldyA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7IGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVMZW5ndGgsIGJ5dGVTdHJpZGU6IDAgfSkudW53cmFwRm9yY2UoKTtcbiAgICBjb25zdCBub3JtYWxBY2Nlc3NvciA9IGJ1ZmZlclZpZXdcbiAgICAgIC50YWtlQWNjZXNzb3Ioe1xuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb3VudDogdmVydGV4Q291bnQsXG4gICAgICB9KVxuICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2ZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICBsZXQgeCA9IG5vcm1hbHNbaSAqIDNdO1xuICAgICAgbGV0IHkgPSBub3JtYWxzW2kgKiAzICsgMV07XG4gICAgICBsZXQgeiA9IG5vcm1hbHNbaSAqIDMgKyAyXTtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGguaHlwb3QoeCwgeSwgeik7XG4gICAgICBpZiAobGVuZ3RoID4gMCkge1xuICAgICAgICB4IC89IGxlbmd0aDtcbiAgICAgICAgeSAvPSBsZW5ndGg7XG4gICAgICAgIHogLz0gbGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRGVnZW5lcmF0ZSB2ZXJ0ZXg6IHVzZSBhIHZhbGlkIG5vcm1hbCBzbyBsaWdodGluZyBkb2VzIG5vdCBwcm9kdWNlIE5hTi5cbiAgICAgICAgeCA9IDA7XG4gICAgICAgIHkgPSAxO1xuICAgICAgICB6ID0gMDtcbiAgICAgIH1cbiAgICAgIG5vcm1hbEFjY2Vzc29yLnNldFZlYzMoaSwgeCwgeSwgeiwge30pO1xuICAgIH1cbiAgICBwcmltaXRpdmUuc2V0VmVydGV4QXR0cmlidXRlKG5vcm1hbEFjY2Vzc29yLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhbGwgb2JqZWN0cyAobWVzaGVzLCBjYW1lcmFzLCBsaWdodHMsIGdyb3VwcykgZnJvbSBnbFRGIG5vZGVzXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBybkJ1ZmZlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgYnVmZmVyc1xuICAgKiBAcGFyYW0gcm5NYXRlcmlhbHMgLSBBcnJheSBvZiBSaG9kb25pdGUgbWF0ZXJpYWxzXG4gICAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gICAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGFycmF5cyBvZiBlbnRpdGllcyBhbmQgZW50aXRpZXMgYnkgbmFtZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cE9iamVjdHMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuQnVmZmVyczogQnVmZmVyW10sXG4gICAgcm5NYXRlcmlhbHM6IE1hdGVyaWFsW10sXG4gICAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICAgIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuICApIHtcbiAgICBjb25zdCBybkVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdID0gW107XG4gICAgY29uc3Qgcm5FbnRpdGllc0J5TmFtZXM6IE1hcDxzdHJpbmcsIElTY2VuZUdyYXBoRW50aXR5PiA9IG5ldyBNYXAoKTtcblxuICAgIGZvciAoY29uc3Qgbm9kZV9pIGluIGdsdGZNb2RlbC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tOdW1iZXIucGFyc2VJbnQobm9kZV9pLCAxMCldIGFzIFJuTTJOb2RlO1xuICAgICAgbGV0IGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgICBpZiAobm9kZS5tZXNoICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWVzaElkeCA9IG5vZGUubWVzaDtcbiAgICAgICAgY29uc3QgbWVzaEVudGl0eSA9IHRoaXMuX19zZXR1cE1lc2goXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIG5vZGUubWVzaE9iamVjdCEsXG4gICAgICAgICAgbWVzaElkeCxcbiAgICAgICAgICBybkJ1ZmZlcnMsXG4gICAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICAgIHJuTWF0ZXJpYWxzLFxuICAgICAgICAgIHJuVGV4dHVyZXMsXG4gICAgICAgICAgcm5TYW1wbGVyc1xuICAgICAgICApO1xuICAgICAgICBpZiAobm9kZS5uYW1lKSB7XG4gICAgICAgICAgbWVzaEVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUobm9kZS5uYW1lLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5tZXNoT2JqZWN0Py5uYW1lKSB7XG4gICAgICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IG1lc2hFbnRpdHkuZ2V0Q29tcG9uZW50KE1lc2hDb21wb25lbnQpITtcbiAgICAgICAgICBtZXNoQ29tcG9uZW50LnRyeVRvU2V0VW5pcXVlTmFtZShub2RlLm1lc2hPYmplY3QubmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZW50aXR5ID0gbWVzaEVudGl0eTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5jYW1lcmFPYmplY3QgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjYW1lcmFFbnRpdHkgPSB0aGlzLl9fc2V0dXBDYW1lcmEoZW5naW5lLCBub2RlLmNhbWVyYU9iamVjdCwgZ2x0Zk1vZGVsKTtcbiAgICAgICAgbGV0IGVudGl0eVdpdGhPcHRpb25hbExpZ2h0OiBJU2NlbmVHcmFwaEVudGl0eSA9IGNhbWVyYUVudGl0eTtcbiAgICAgICAgLy8gQSBnbFRGIG5vZGUgY2FuIGNhcnJ5IGJvdGggYSBjYW1lcmEgYW5kIGEgbGlnaHQuIEVkaXRvci1jcmVhdGVkIGxpZ2h0cyBhcmUgc3VjaFxuICAgICAgICAvLyBub2RlczogY3JlYXRlTGlnaHRXaXRoQ2FtZXJhRW50aXR5IGF0dGFjaGVzIHRoZSBsaWdodCBjYW1lcmEgdG8gdGhlIGxpZ2h0IGVudGl0eS5cbiAgICAgICAgaWYgKG5vZGUuZXh0ZW5zaW9ucz8uS0hSX2xpZ2h0c19wdW5jdHVhbCAhPSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbGlnaHRFbnRpdHkgPSBlbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShcbiAgICAgICAgICAgIExpZ2h0Q29tcG9uZW50LFxuICAgICAgICAgICAgY2FtZXJhRW50aXR5XG4gICAgICAgICAgKSBhcyB1bmtub3duIGFzIElDYW1lcmFFbnRpdHkgJiBJTGlnaHRFbnRpdHk7XG4gICAgICAgICAgdGhpcy5fX2NvbmZpZ3VyZUxpZ2h0Q29tcG9uZW50KGxpZ2h0RW50aXR5LmdldExpZ2h0KCksIG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0KTtcbiAgICAgICAgICBsaWdodEVudGl0eS5nZXRDYW1lcmEoKS5pc1N5bmNUb0xpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICBlbnRpdHlXaXRoT3B0aW9uYWxMaWdodCA9IGxpZ2h0RW50aXR5IGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICAgIGVudGl0eVdpdGhPcHRpb25hbExpZ2h0LnRyeVRvU2V0VW5pcXVlTmFtZShub2RlLm5hbWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVudGl0eSA9IGVudGl0eVdpdGhPcHRpb25hbExpZ2h0O1xuICAgICAgfSBlbHNlIGlmIChub2RlLmV4dGVuc2lvbnM/LktIUl9saWdodHNfcHVuY3R1YWwpIHtcbiAgICAgICAgY29uc3QgbGlnaHRFbnRpdHkgPSB0aGlzLl9fc2V0dXBMaWdodChlbmdpbmUsIG5vZGUuZXh0ZW5zaW9ucy5LSFJfbGlnaHRzX3B1bmN0dWFsLmxpZ2h0LCBnbHRmTW9kZWwpO1xuICAgICAgICBlbnRpdHkgPSBsaWdodEVudGl0eTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fX2dlbmVyYXRlR3JvdXBFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgICAgICBpZiAobm9kZS5uYW1lKSB7XG4gICAgICAgICAgZ3JvdXAudHJ5VG9TZXRVbmlxdWVOYW1lKG5vZGUubmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZW50aXR5ID0gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIFJob2Rvbml0ZSByYXltYXJjaGluZyBjb21wb25lbnQuIFRoZSBzaGFyZWQgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgaXMgYnVpbHQgYnkgdGhlXG4gICAgICAvLyBhcHBsaWNhdGlvbiAodGhlIGVkaXRvcidzIG5vZGUgZWRpdG9yKSBmcm9tIHRoZSByZXN0b3JlZCBncmFwaC5cbiAgICAgIGNvbnN0IHJheW1hcmNoaW5nRXh0ZW5zaW9uID0gKFxuICAgICAgICBub2RlLmV4dGVuc2lvbnMgYXNcbiAgICAgICAgICB8IHtcbiAgICAgICAgICAgICAgUkhPRE9OSVRFX3JheW1hcmNoaW5nPzoge1xuICAgICAgICAgICAgICAgIGdyYXBoPzogTm9kZUpTT04gfCBudWxsO1xuICAgICAgICAgICAgICAgIHNkZlNoYXBlVHlwZT86IG51bWJlcjtcbiAgICAgICAgICAgICAgICBpc1BpY2thYmxlPzogYm9vbGVhbjtcbiAgICAgICAgICAgICAgICBjYXN0U2hhZG93PzogYm9vbGVhbjtcbiAgICAgICAgICAgICAgICAvLyBQZXItY29tcG9uZW50IFRleHR1cmUyRCBhc3NpZ25tZW50cywgY29uc3VtZWQgYnkgdGhlIGFwcGxpY2F0aW9uIHdoZW4gaXRcbiAgICAgICAgICAgICAgICAvLyByZWJ1aWxkcyB0aGUgY29tcG9uZW50J3MgbWF0ZXJpYWwgKHNlZSBnZXRSYXltYXJjaGluZ0NvbXBvbmVudFRleHR1cmVBc3NpZ25tZW50cykuXG4gICAgICAgICAgICAgICAgdGV4dHVyZXM/OiB7IFtzZW1hbnRpYzogc3RyaW5nXTogeyBpbmRleD86IG51bWJlciB9IH07XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfCB1bmRlZmluZWRcbiAgICAgICk/LlJIT0RPTklURV9yYXltYXJjaGluZztcbiAgICAgIGlmIChyYXltYXJjaGluZ0V4dGVuc2lvbiAhPSBudWxsICYmIGVudGl0eS50cnlUb0dldFJheW1hcmNoaW5nKCkgPT0gbnVsbCkge1xuICAgICAgICBjb25zdCByYXltYXJjaGluZ0VudGl0eSA9IGVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFxuICAgICAgICAgIFJheW1hcmNoaW5nQ29tcG9uZW50LFxuICAgICAgICAgIGVudGl0eVxuICAgICAgICApIGFzIHVua25vd24gYXMgSVJheW1hcmNoaW5nRW50aXR5O1xuICAgICAgICBjb25zdCByYXltYXJjaGluZ0NvbXBvbmVudCA9IHJheW1hcmNoaW5nRW50aXR5LmdldFJheW1hcmNoaW5nKCk7XG4gICAgICAgIGlmIChyYXltYXJjaGluZ0V4dGVuc2lvbi5ncmFwaCAhPSBudWxsKSB7XG4gICAgICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnQucnJuSnNvbiA9IHJheW1hcmNoaW5nRXh0ZW5zaW9uLmdyYXBoO1xuICAgICAgICB9IGVsc2UgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uLnNkZlNoYXBlVHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnQuc2RmU2hhcGVUeXBlID0gU2RmU2hhcGVUeXBlLmZyb20ocmF5bWFyY2hpbmdFeHRlbnNpb24uc2RmU2hhcGVUeXBlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmF5bWFyY2hpbmdFeHRlbnNpb24uaXNQaWNrYWJsZSAhPSBudWxsKSB7XG4gICAgICAgICAgcmF5bWFyY2hpbmdDb21wb25lbnQuaXNQaWNrYWJsZSA9IHJheW1hcmNoaW5nRXh0ZW5zaW9uLmlzUGlja2FibGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJheW1hcmNoaW5nRXh0ZW5zaW9uLmNhc3RTaGFkb3cgIT0gbnVsbCkge1xuICAgICAgICAgIHJheW1hcmNoaW5nQ29tcG9uZW50LmNhc3RTaGFkb3cgPSByYXltYXJjaGluZ0V4dGVuc2lvbi5jYXN0U2hhZG93O1xuICAgICAgICB9XG4gICAgICAgIGVudGl0eSA9IHJheW1hcmNoaW5nRW50aXR5IGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9faXNNb3JwaGluZyhub2RlLCBnbHRmTW9kZWwpKSB7XG4gICAgICAgIGxldCB3ZWlnaHRzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICBpZiAobm9kZS53ZWlnaHRzKSB7XG4gICAgICAgICAgd2VpZ2h0cyA9IG5vZGUud2VpZ2h0cztcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm1lc2hPYmplY3Q/LndlaWdodHMpIHtcbiAgICAgICAgICB3ZWlnaHRzID0gbm9kZS5tZXNoT2JqZWN0LndlaWdodHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHRhcmdldE51bSA9IDA7XG4gICAgICAgICAgLy8gZ2V0IG1heGltdW0gdGFyZ2V0IG51bVxuICAgICAgICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIG5vZGUubWVzaE9iamVjdCEucHJpbWl0aXZlcykge1xuICAgICAgICAgICAgaWYgKElzLmV4aXN0KHByaW1pdGl2ZS50YXJnZXRzKSkge1xuICAgICAgICAgICAgICBpZiAocHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoID4gdGFyZ2V0TnVtKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TnVtID0gcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHdlaWdodHMgPSBuZXcgQXJyYXkodGFyZ2V0TnVtKS5maWxsKDApO1xuICAgICAgICB9XG4gICAgICAgIGVudGl0eSA9IGVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShCbGVuZFNoYXBlQ29tcG9uZW50LCBlbnRpdHkpO1xuICAgICAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gKGVudGl0eSBhcyB1bmtub3duIGFzIElCbGVuZFNoYXBlRW50aXR5TWV0aG9kcykuZ2V0QmxlbmRTaGFwZSgpO1xuICAgICAgICBibGVuZFNoYXBlQ29tcG9uZW50LndlaWdodHMgPSB3ZWlnaHRzO1xuICAgICAgICBpZiAobm9kZS5tZXNoT2JqZWN0Py5wcmltaXRpdmVzWzBdLmV4dHJhcz8udGFyZ2V0TmFtZXMpIHtcbiAgICAgICAgICBibGVuZFNoYXBlQ29tcG9uZW50LnRhcmdldE5hbWVzID0gbm9kZS5tZXNoT2JqZWN0LnByaW1pdGl2ZXNbMF0uZXh0cmFzLnRhcmdldE5hbWVzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6IFRhZ0dsdGYyTm9kZUluZGV4LCB2YWx1ZTogbm9kZV9pIH0pO1xuXG4gICAgICBybkVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICAgIHJuRW50aXRpZXNCeU5hbWVzLnNldChub2RlLm5hbWUhLCBlbnRpdHkpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHJuRW50aXRpZXMsIHJuRW50aXRpZXNCeU5hbWVzIH07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgbm9kZSBoYXMgbW9ycGhpbmcgKGJsZW5kIHNoYXBlKSBjYXBhYmlsaXRpZXNcbiAgICogQHBhcmFtIG5vZGUgLSBUaGUgZ2xURiBub2RlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG5vZGUgc3VwcG9ydHMgbW9ycGhpbmdcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faXNNb3JwaGluZyhub2RlOiBSbk0yTm9kZSwgZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgY29uc3QgYXJndW1lbnQgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuICAgIGlmIChhcmd1bWVudD8uaXNNb3JwaGluZyA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUubWVzaE9iamVjdD8ucHJpbWl0aXZlc1swXS50YXJnZXRzICE9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhIGxpZ2h0IGVudGl0eSBmcm9tIGdsVEYgbGlnaHQgZGF0YVxuICAgKiBAcGFyYW0gbGlnaHQgLSBUaGUgZ2xURiBsaWdodCBkYXRhXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIENvbmZpZ3VyZWQgbGlnaHQgZW50aXR5XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTGlnaHQoZW5naW5lOiBFbmdpbmUsIGxpZ2h0OiBLSFJfbGlnaHRzX3B1bmN0dWFsX0xpZ2h0LCBnbHRmTW9kZWw6IFJuTTIpOiBJTGlnaHRFbnRpdHkge1xuICAgIGNvbnN0IGxpZ2h0RW50aXR5ID0gdGhpcy5fX2dlbmVyYXRlTGlnaHRFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50ID0gbGlnaHRFbnRpdHkuZ2V0Q29tcG9uZW50KExpZ2h0Q29tcG9uZW50KSEgYXMgTGlnaHRDb21wb25lbnQ7XG4gICAgdGhpcy5fX2NvbmZpZ3VyZUxpZ2h0Q29tcG9uZW50KGxpZ2h0Q29tcG9uZW50LCBsaWdodCk7XG4gICAgLy8gU3BvdCBhbmQgZGlyZWN0aW9uYWwgc2hhZG93IG1hcHMgYXJlIHJlbmRlcmVkIGZyb20gYSBjYW1lcmEgc3luY2hyb25pemVkIHRvIHRoZSBsaWdodCAoU2hhZG93TWFwIHVzZXNcbiAgICAvLyBsaWdodEVudGl0eS5nZXRDYW1lcmEoKSkuIEF0dGFjaCBpdCBvbmx5IHRvIHRoZSBsaWdodHMgdGhhdCBjYXN0IHNoYWRvd3M6IHRoZSBpbXBvcnQgYXBwbGllcyBjYXN0c1NoYWRvdyBmcm9tXG4gICAgLy8gdGhlIFJob2Rvbml0ZSBleHRyYXMsIGFuZCBTaGFkb3dTeXN0ZW0gYXR0YWNoZXMgaXQgbGF6aWx5IHdoZW4gYSBsaWdodCBzdGFydHMgY2FzdGluZyBzaGFkb3dzLiBBdHRhY2hpbmcgaXQgdG9cbiAgICAvLyBldmVyeSBpbXBvcnRlZCBzcG90L2RpcmVjdGlvbmFsIGxpZ2h0IGFkZHMgb25lIGNhbWVyYSBjb21wb25lbnQgcGVyIGxpZ2h0LCBhbmQgdGhlIGdlbmVyYXRlZCBzaGFkZXJzIGtlZXAgYW5cbiAgICAvLyBvZmZzZXQgZW50cnkgcGVyIGNhbWVyYSwgd2hpY2ggbWFrZXMgdGhlbSBsYXJnZSBhbmQgc2xvdyAoZS5nLiBhIHNjZW5lIHdpdGggaHVuZHJlZHMgb2YgbGlnaHRzKS5cbiAgICBpZiAobGlnaHRDb21wb25lbnQuY2FzdFNoYWRvdykge1xuICAgICAgYXR0YWNoTGlnaHRTaGFkb3dDYW1lcmEoZW5naW5lLCBsaWdodEVudGl0eSBhcyBJTGlnaHRFbnRpdHkpO1xuICAgIH1cbiAgICByZXR1cm4gbGlnaHRFbnRpdHkgYXMgSUxpZ2h0RW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgZ2xURiBsaWdodCBkYXRhIHRvIGEgTGlnaHRDb21wb25lbnQuIFRoaXMgaXMgdXNlZCBmb3Igbm9kZXMgdGhhdCBjb250YWluIG9ubHkgYVxuICAgKiBsaWdodCBhbmQgZm9yIG5vZGVzIHRoYXQgY29udGFpbiBib3RoIGEgY2FtZXJhIGFuZCBhIGxpZ2h0LlxuICAgKiBAcGFyYW0gbGlnaHRDb21wb25lbnQgLSBUaGUgY29tcG9uZW50IHRvIGNvbmZpZ3VyZVxuICAgKiBAcGFyYW0gbGlnaHQgLSBUaGUgZ2xURiBsaWdodCBkYXRhXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NvbmZpZ3VyZUxpZ2h0Q29tcG9uZW50KGxpZ2h0Q29tcG9uZW50OiBMaWdodENvbXBvbmVudCwgbGlnaHQ6IEtIUl9saWdodHNfcHVuY3R1YWxfTGlnaHQpIHtcbiAgICBpZiAobGlnaHQubmFtZSAhPSBudWxsKSB7XG4gICAgICBsaWdodENvbXBvbmVudC50cnlUb1NldFVuaXF1ZU5hbWUobGlnaHQubmFtZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGxpZ2h0Q29tcG9uZW50LnR5cGUgPSBMaWdodFR5cGUuZnJvbVN0cmluZyhsaWdodC50eXBlKTtcbiAgICBsZXQgY29sb3IgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKFsxLCAxLCAxXSk7XG4gICAgbGV0IGludGVuc2l0eSA9IDE7XG4gICAgaWYgKGxpZ2h0LmNvbG9yICE9IG51bGwpIHtcbiAgICAgIGNvbG9yID0gVmVjdG9yMy5mcm9tQ29weUFycmF5MyhsaWdodC5jb2xvcik7XG4gICAgfVxuICAgIGlmIChsaWdodC5pbnRlbnNpdHkgIT0gbnVsbCkge1xuICAgICAgaW50ZW5zaXR5ID0gbGlnaHQuaW50ZW5zaXR5O1xuICAgIH1cbiAgICBsaWdodENvbXBvbmVudC5jb2xvciA9IGNvbG9yO1xuICAgIGxpZ2h0Q29tcG9uZW50LmludGVuc2l0eSA9IGludGVuc2l0eTtcbiAgICBpZiAobGlnaHQucmFuZ2UgIT0gbnVsbCkge1xuICAgICAgbGlnaHRDb21wb25lbnQucmFuZ2UgPSBsaWdodC5yYW5nZTtcbiAgICB9XG4gICAgaWYgKGxpZ2h0LnR5cGUgPT09ICdzcG90Jykge1xuICAgICAgaWYgKGxpZ2h0LnNwb3Q/LmlubmVyQ29uZUFuZ2xlICE9IG51bGwpIHtcbiAgICAgICAgbGlnaHRDb21wb25lbnQuaW5uZXJDb25lQW5nbGUgPSBsaWdodC5zcG90LmlubmVyQ29uZUFuZ2xlO1xuICAgICAgfVxuICAgICAgaWYgKGxpZ2h0LnNwb3Q/Lm91dGVyQ29uZUFuZ2xlICE9IG51bGwpIHtcbiAgICAgICAgbGlnaHRDb21wb25lbnQub3V0ZXJDb25lQW5nbGUgPSBsaWdodC5zcG90Lm91dGVyQ29uZUFuZ2xlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlc3RvcmUgdGhlIFJob2Rvbml0ZS1zcGVjaWZpYyBsaWdodCBzdGF0ZSBzdG9yZWQgYnkgR2x0ZjJFeHBvcnRlci5cbiAgICBjb25zdCByaG9kb25pdGVFeHRyYXMgPSAoXG4gICAgICBsaWdodC5leHRyYXMgYXNcbiAgICAgICAgfCB7XG4gICAgICAgICAgICByaG9kb25pdGU/OiB7XG4gICAgICAgICAgICAgIGNhc3RTaGFkb3c/OiBib29sZWFuO1xuICAgICAgICAgICAgICBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmU/OiBudW1iZXI7XG4gICAgICAgICAgICAgIHNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0PzogbnVtYmVyO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIHwgdW5kZWZpbmVkXG4gICAgKT8ucmhvZG9uaXRlO1xuICAgIGlmIChyaG9kb25pdGVFeHRyYXMgIT0gbnVsbCkge1xuICAgICAgaWYgKHJob2Rvbml0ZUV4dHJhcy5jYXN0U2hhZG93ICE9IG51bGwpIHtcbiAgICAgICAgbGlnaHRDb21wb25lbnQuY2FzdFNoYWRvdyA9IHJob2Rvbml0ZUV4dHJhcy5jYXN0U2hhZG93O1xuICAgICAgfVxuICAgICAgaWYgKHJob2Rvbml0ZUV4dHJhcy5wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUgIT0gbnVsbCkge1xuICAgICAgICBsaWdodENvbXBvbmVudC5wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUgPSByaG9kb25pdGVFeHRyYXMucG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lO1xuICAgICAgfVxuICAgICAgaWYgKHJob2Rvbml0ZUV4dHJhcy5zaGFkb3daTmVhckZvclNwb3RMaWdodCAhPSBudWxsKSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LnNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0ID0gcmhvZG9uaXRlRXh0cmFzLnNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGEgY2FtZXJhIGVudGl0eSBmcm9tIGdsVEYgY2FtZXJhIGRhdGFcbiAgICogQHBhcmFtIGNhbWVyYSAtIFRoZSBnbFRGIGNhbWVyYSBkYXRhXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEByZXR1cm5zIENvbmZpZ3VyZWQgY2FtZXJhIGVudGl0eVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXR1cENhbWVyYShlbmdpbmU6IEVuZ2luZSwgY2FtZXJhOiBSbk0yQ2FtZXJhLCBnbHRmTW9kZWw6IFJuTTIpOiBJQ2FtZXJhRW50aXR5IHtcbiAgICBjb25zdCBjYW1lcmFFbnRpdHkgPSB0aGlzLl9fZ2VuZXJhdGVDYW1lcmFFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKTtcbiAgICBjYW1lcmFDb21wb25lbnQuZGlyZWN0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAtMV0pO1xuICAgIGlmIChnbHRmTW9kZWwuYXNzZXQgJiYgKGdsdGZNb2RlbC5hc3NldCBhcyBhbnkpLkxhc3RTYXZlZF9BcHBsaWNhdGlvblZlbmRvcikge1xuICAgICAgLy8gRm9yIGFuIG9sZCBleHBvcnRlciBjb21wYXRpYmlsaXR5XG4gICAgICBjYW1lcmFDb21wb25lbnQuZGlyZWN0aW9uID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsxLCAwLCAwXSk7XG4gICAgICBjYW1lcmFDb21wb25lbnQuZGlyZWN0aW9uSW5uZXIgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzEsIDAsIDBdKTtcbiAgICB9XG4gICAgY2FtZXJhQ29tcG9uZW50LnVwID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAxLCAwXSk7XG4gICAgY2FtZXJhQ29tcG9uZW50LnR5cGUgPSBDYW1lcmFUeXBlLmZyb21TdHJpbmcoY2FtZXJhLnR5cGUpO1xuICAgIGlmIChjYW1lcmFDb21wb25lbnQudHlwZSA9PT0gQ2FtZXJhVHlwZS5QZXJzcGVjdGl2ZSkge1xuICAgICAgY2FtZXJhQ29tcG9uZW50LmFzcGVjdCA9IGNhbWVyYS5wZXJzcGVjdGl2ZSEuYXNwZWN0UmF0aW8gPyBjYW1lcmEucGVyc3BlY3RpdmUhLmFzcGVjdFJhdGlvIDogMTtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC5zZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoY2FtZXJhLnBlcnNwZWN0aXZlIS55Zm92KSk7XG4gICAgICBjYW1lcmFDb21wb25lbnQuek5lYXIgPSBjYW1lcmEucGVyc3BlY3RpdmUhLnpuZWFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpGYXIgPSBjYW1lcmEucGVyc3BlY3RpdmUhLnpmYXIgPyBjYW1lcmEucGVyc3BlY3RpdmUhLnpmYXIgOiAxMDAwMDA7XG4gICAgICBjYW1lcmFDb21wb25lbnQudHJ5VG9TZXRUYWcoe1xuICAgICAgICB0YWc6ICdPcmlnaW5hbEZvdlknLFxuICAgICAgICB2YWx1ZTogY2FtZXJhQ29tcG9uZW50LmZvdnksXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGNhbWVyYUNvbXBvbmVudC50eXBlID09PSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYykge1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnhNYWcgPSBjYW1lcmEub3J0aG9ncmFwaGljIS54bWFnO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnlNYWcgPSBjYW1lcmEub3J0aG9ncmFwaGljIS55bWFnO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpOZWFyID0gY2FtZXJhLm9ydGhvZ3JhcGhpYyEuem5lYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQuekZhciA9IGNhbWVyYS5vcnRob2dyYXBoaWMhLnpmYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQudHJ5VG9TZXRUYWcoe1xuICAgICAgICB0YWc6ICdPcmlnaW5hbFhNYWcnLFxuICAgICAgICB2YWx1ZTogY2FtZXJhQ29tcG9uZW50LnhNYWcsXG4gICAgICB9KTtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC50cnlUb1NldFRhZyh7XG4gICAgICAgIHRhZzogJ09yaWdpbmFsWU1hZycsXG4gICAgICAgIHZhbHVlOiBjYW1lcmFDb21wb25lbnQueU1hZyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjYW1lcmFDb21wb25lbnQudHJ5VG9TZXRUYWcoe1xuICAgICAgdGFnOiAnT3JpZ2luYWxBc3BlY3QnLFxuICAgICAgdmFsdWU6IGNhbWVyYUNvbXBvbmVudC5hc3BlY3QsXG4gICAgfSk7XG4gICAgcmV0dXJuIGNhbWVyYUVudGl0eSBhcyBJQ2FtZXJhRW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYSBtZXNoIGVudGl0eSBmcm9tIGdsVEYgbWVzaCBkYXRhXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBtZXNoIC0gVGhlIGdsVEYgbWVzaCBkYXRhXG4gICAqIEBwYXJhbSBtZXNoSW5kZXggLSBJbmRleCBvZiB0aGUgbWVzaCBpbiB0aGUgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gcm5CdWZmZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIGJ1ZmZlcnNcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuTWF0ZXJpYWxzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICAgKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKiBAcmV0dXJucyBDb25maWd1cmVkIG1lc2ggZW50aXR5XG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwTWVzaChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBtZXNoOiBSbk0yTWVzaCxcbiAgICBtZXNoSW5kZXg6IEluZGV4LFxuICAgIHJuQnVmZmVyczogQnVmZmVyW10sXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuTWF0ZXJpYWxzOiBNYXRlcmlhbFtdLFxuICAgIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICByblNhbXBsZXJzOiBTYW1wbGVyW11cbiAgKSB7XG4gICAgY29uc3QgbWVzaEVudGl0eSA9IHRoaXMuX19nZW5lcmF0ZU1lc2hFbnRpdHkoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGV4aXN0aW5nUm5NZXNoID0gKGdsdGZNb2RlbC5hc3NldC5leHRyYXMgYXMgYW55KS5ybk1lc2hlc0F0R2x0TWVzaElkeFttZXNoSW5kZXhdPy5kZXJlZigpIGFzIE1lc2ggfCB1bmRlZmluZWQ7XG4gICAgbGV0IHJuUHJpbWl0aXZlTW9kZSA9IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzO1xuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBtZXNoRW50aXR5LmdldE1lc2goKTtcblxuICAgIGlmIChleGlzdGluZ1JuTWVzaCAhPSBudWxsKSB7XG4gICAgICBtZXNoQ29tcG9uZW50LnNldE1lc2goZXhpc3RpbmdSbk1lc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBybk1lc2ggPSBuZXcgTWVzaChlbmdpbmUpO1xuICAgICAgLy8gc2V0IGZsYWcgdG8gcm5NZXNoIHdpdGggb3B0aW9uc1xuICAgICAgY29uc3Qgcm5Mb2FkZXJPcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5Mb2FkZXJPcHRpb25zO1xuICAgICAgaWYgKHJuTG9hZGVyT3B0aW9ucz8udGFuZ2VudENhbGN1bGF0aW9uTW9kZSAhPSBudWxsKSB7XG4gICAgICAgIHJuTWVzaC50YW5nZW50Q2FsY3VsYXRpb25Nb2RlID0gcm5Mb2FkZXJPcHRpb25zLnRhbmdlbnRDYWxjdWxhdGlvbk1vZGU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNldHVwTWF0ZXJpYWxWYXJpYW50cyA9IChyblByaW1pdGl2ZTogUHJpbWl0aXZlLCBwcmltaXRpdmU6IFJuTTJQcmltaXRpdmUpID0+IHtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWxWYXJpYW50cyA9IHByaW1pdGl2ZS5tYXRlcmlhbFZhcmlhbnRzO1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KG1hdGVyaWFsVmFyaWFudHMpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgbWF0ZXJpYWxWYXJpYW50IG9mIG1hdGVyaWFsVmFyaWFudHMpIHtcbiAgICAgICAgICBjb25zdCBtYXRlcmlhbCA9IHJuTWF0ZXJpYWxzW21hdGVyaWFsVmFyaWFudC5tYXRlcmlhbF07XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhbnROYW1lIG9mIG1hdGVyaWFsVmFyaWFudC52YXJpYW50cykge1xuICAgICAgICAgICAgcm5QcmltaXRpdmUuc2V0TWF0ZXJpYWxWYXJpYW50KHZhcmlhbnROYW1lLCBtYXRlcmlhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKGNvbnN0IGkgaW4gbWVzaC5wcmltaXRpdmVzKSB7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2gucHJpbWl0aXZlc1tpXSBhcyBSbk0yUHJpbWl0aXZlO1xuICAgICAgICBpZiAocHJpbWl0aXZlLm1vZGUgIT0gbnVsbCkge1xuICAgICAgICAgIHJuUHJpbWl0aXZlTW9kZSA9IFByaW1pdGl2ZU1vZGUuZnJvbShwcmltaXRpdmUubW9kZSkhO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm5QcmltaXRpdmUgPSBuZXcgUHJpbWl0aXZlKGVuZ2luZSk7XG5cbiAgICAgICAgY29uc3Qgcm5NYXRlcmlhbCA9XG4gICAgICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsICE9IG51bGxcbiAgICAgICAgICAgID8gcm5NYXRlcmlhbHNbcHJpbWl0aXZlLm1hdGVyaWFsXVxuICAgICAgICAgICAgOiB0aGlzLl9fc2V0dXBNYXRlcmlhbChlbmdpbmUsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG4gICAgICAgIHNldHVwTWF0ZXJpYWxWYXJpYW50cyhyblByaW1pdGl2ZSwgcHJpbWl0aXZlKTtcblxuICAgICAgICBpZiAocm5NYXRlcmlhbC5tYXRlcmlhbFR5cGVOYW1lLmluZGV4T2YoJ01Ub29uJykgIT09IC0xKSB7XG4gICAgICAgICAgY29uc3QgVlJNUHJvcGVydGllcyA9IGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTTtcbiAgICAgICAgICBpZiAoVlJNUHJvcGVydGllcz8ucm5FeHRlbnNpb24gIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3Qgcm5FeHRlbnNpb24gPSBWUk1Qcm9wZXJ0aWVzLnJuRXh0ZW5zaW9uO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGFzc091dGxpbmUgPSBybkV4dGVuc2lvbi5yZW5kZXJQYXNzT3V0bGluZTtcbiAgICAgICAgICAgIGNvbnN0IG91dGxpbmVNYXRlcmlhbCA9IHByaW1pdGl2ZS5tYXRlcmlhbE9iamVjdD8uZXh0cmFzPy5vdXRsaW5lTWF0ZXJpYWw/LmRlcmVmKCk7XG4gICAgICAgICAgICBpZiAob3V0bGluZU1hdGVyaWFsICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmVuZGVyUGFzc091dGxpbmUuc2V0TWF0ZXJpYWxGb3JQcmltaXRpdmUob3V0bGluZU1hdGVyaWFsLCByblByaW1pdGl2ZSk7XG4gICAgICAgICAgICAgIHJuUHJpbWl0aXZlLnNldE1hdGVyaWFsVmFyaWFudCgnb3V0bGluZScsIG91dGxpbmVNYXRlcmlhbCk7IC8vIFRvIGF0dGFjaCBhbiBvdXRsaW5lTWF0ZXJpYWwgcmVmZXJlbmNlIHRvIHRoZSBwcmltaXRpdmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbmRpY2VzXG4gICAgICAgIGxldCBpbmRpY2VzUm5BY2Nlc3NvcjogQWNjZXNzb3IgfCB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IG1hcDogTWFwPFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZywgQWNjZXNzb3I+ID0gbmV3IE1hcCgpO1xuICAgICAgICBpZiAocHJpbWl0aXZlLmV4dGVuc2lvbnM/LktIUl9kcmFjb19tZXNoX2NvbXByZXNzaW9uKSB7XG4gICAgICAgICAgaW5kaWNlc1JuQWNjZXNzb3IgPSB0aGlzLl9fZGVjb2RlRHJhY28oZW5naW5lLCBwcmltaXRpdmUsIHJuQnVmZmVycywgZ2x0Zk1vZGVsLCBtYXApO1xuXG4gICAgICAgICAgaWYgKElzLm5vdC5leGlzdChpbmRpY2VzUm5BY2Nlc3NvcikpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpbmRpY2VzXG4gICAgICAgICAgaWYgKElzLmV4aXN0KHByaW1pdGl2ZS5pbmRpY2VzKSkge1xuICAgICAgICAgICAgaW5kaWNlc1JuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3QW5kUm5BY2Nlc3NvcihlbmdpbmUsIHByaW1pdGl2ZS5pbmRpY2VzT2JqZWN0ISwgcm5CdWZmZXJzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBhdHRyaWJ1dGVzXG4gICAgICAgICAgY29uc3Qgcm5CdWZmZXJWaWV3TWFwOiBNYXA8bnVtYmVyLCBCdWZmZXJWaWV3PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gcHJpbWl0aXZlLmF0dHJpYnV0ZXNPYmplY3RzISkge1xuICAgICAgICAgICAgY29uc3Qgcm5tMmF0dHJpYnV0ZSA9IHByaW1pdGl2ZS5hdHRyaWJ1dGVzT2JqZWN0c1thdHRyaWJ1dGVOYW1lXSE7XG4gICAgICAgICAgICBjb25zdCBybkJ1ZmZlciA9IHJuQnVmZmVyc1tybm0yYXR0cmlidXRlLmJ1ZmZlclZpZXdPYmplY3QhLmJ1ZmZlciFdO1xuICAgICAgICAgICAgbGV0IHJuQnVmZmVyVmlldzogQnVmZmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChJcy5leGlzdChybm0yYXR0cmlidXRlLmJ1ZmZlclZpZXcpKSB7XG4gICAgICAgICAgICAgIHJuQnVmZmVyVmlldyA9IHJuQnVmZmVyVmlld01hcC5nZXQocm5tMmF0dHJpYnV0ZS5idWZmZXJWaWV3KTtcbiAgICAgICAgICAgICAgaWYgKElzLm5vdC5leGlzdChybkJ1ZmZlclZpZXcpKSB7XG4gICAgICAgICAgICAgICAgcm5CdWZmZXJWaWV3ID0gdGhpcy5fX2dldFJuQnVmZmVyVmlldyhybm0yYXR0cmlidXRlLmJ1ZmZlclZpZXdPYmplY3QhLCBybkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgcm5CdWZmZXJWaWV3TWFwLnNldChybm0yYXR0cmlidXRlLmJ1ZmZlclZpZXcsIHJuQnVmZmVyVmlldyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJuQnVmZmVyVmlldyA9IHJuQnVmZmVyXG4gICAgICAgICAgICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgICAgICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IDAsXG4gICAgICAgICAgICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVSbkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQWNjZXNzb3IoZW5naW5lLCBybm0yYXR0cmlidXRlLCBybkJ1ZmZlclZpZXcpO1xuXG4gICAgICAgICAgICBjb25zdCBqb2luZWRTdHJpbmcgPSBWZXJ0ZXhBdHRyaWJ1dGUudG9WZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY0pvaW5lZFN0cmluZ0FzR2x0ZlN0eWxlKFxuICAgICAgICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGUuZnJvbVN0cmluZyhhdHRyaWJ1dGVOYW1lKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG1hcC5zZXQoam9pbmVkU3RyaW5nLCBhdHRyaWJ1dGVSbkFjY2Vzc29yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByblByaW1pdGl2ZS5zZXREYXRhKG1hcCwgcm5QcmltaXRpdmVNb2RlLCBybk1hdGVyaWFsLCBpbmRpY2VzUm5BY2Nlc3Nvcik7XG4gICAgICAgIHRoaXMuX19nZW5lcmF0ZU5vcm1hbHNJZk1pc3NpbmcoZW5naW5lLCByblByaW1pdGl2ZSwgaW5kaWNlc1JuQWNjZXNzb3IpO1xuXG4gICAgICAgIC8vIG1vcnBoIHRhcmdldHNcbiAgICAgICAgaWYgKHByaW1pdGl2ZS50YXJnZXRzICE9IG51bGwpIHtcbiAgICAgICAgICAvLyBzZXQgZGVmYXVsdCBudW1iZXJcbiAgICAgICAgICBjb25zdCB0YXJnZXRzOiBBcnJheTxNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj4+ID0gW107XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmUudGFyZ2V0c09iamVjdHMhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBwcmltaXRpdmUudGFyZ2V0c09iamVjdHMhW2ldO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0TWFwOiBNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZUFjY2Vzc29yID0gdGFyZ2V0W2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVSbkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3IoZW5naW5lLCBhdHRyaWJ1dGVBY2Nlc3Nvciwgcm5CdWZmZXJzKTtcbiAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUm5BY2Nlc3NvckluR1BVVmVydGV4RGF0YSA9IHRoaXMuX19jb3B5Um5BY2Nlc3NvckFuZEJ1ZmZlclZpZXdGb3JNb3JwaERhdGEoXG4gICAgICAgICAgICAgICAgZW5naW5lLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3JcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgY29uc3QgdmVydGV4QXR0cmlidXRlID0gVmVydGV4QXR0cmlidXRlLmZyb21TdHJpbmcoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgICAgICAgIGNvbnN0IGpvaW5lZFN0cmluZyA9IFZlcnRleEF0dHJpYnV0ZS50b1ZlcnRleEF0dHJpYnV0ZVNlbWFudGljSm9pbmVkU3RyaW5nQXNHbHRmU3R5bGUodmVydGV4QXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgdGFyZ2V0TWFwLnNldChqb2luZWRTdHJpbmcsIGF0dHJpYnV0ZVJuQWNjZXNzb3JJbkdQVVZlcnRleERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFyZ2V0cy5wdXNoKHRhcmdldE1hcCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcm5QcmltaXRpdmUuc2V0QmxlbmRTaGFwZVRhcmdldHModGFyZ2V0cyk7XG4gICAgICAgIH1cbiAgICAgICAgcm5NZXNoLmFkZFByaW1pdGl2ZShyblByaW1pdGl2ZSk7XG4gICAgICB9XG5cbiAgICAgIG1lc2hDb21wb25lbnQuc2V0TWVzaChybk1lc2gpO1xuICAgICAgKGdsdGZNb2RlbC5hc3NldC5leHRyYXMgYXMgYW55KS5ybk1lc2hlc0F0R2x0TWVzaElkeFttZXNoSW5kZXhdID0gbmV3IFdlYWtSZWYocm5NZXNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzaEVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHNwYXJzZSBhY2Nlc3NvciBkYXRhIGJ5IGFwcGx5aW5nIHNwYXJzZSBpbmRpY2VzIGFuZCB2YWx1ZXMgdG8gdGhlIGJhc2UgYWNjZXNzb3JcbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIGdsVEYgYWNjZXNzb3Igd2l0aCBzcGFyc2UgZGF0YVxuICAgKiBAcGFyYW0gcm5BY2Nlc3NvciAtIFRoZSBSaG9kb25pdGUgYWNjZXNzb3IgdG8gbW9kaWZ5XG4gICAqL1xuICBzdGF0aWMgc2V0U3BhcnNlQWNjZXNzb3IoYWNjZXNzb3I6IFJuTTJBY2Nlc3Nvciwgcm5BY2Nlc3NvcjogQWNjZXNzb3IpOiB2b2lkIHtcbiAgICBjb25zdCBjb3VudCA9IGFjY2Vzc29yLnNwYXJzZSEuY291bnQ7XG5cbiAgICAvLyBnZXQgc3BhcnNlIGluZGljZXNcbiAgICBjb25zdCBzcGFyc2VJbmRpY2VzID0gYWNjZXNzb3Iuc3BhcnNlIS5pbmRpY2VzITtcbiAgICBjb25zdCBpbmRpY2VzQnVmZmVyVmlldyA9IHNwYXJzZUluZGljZXMuYnVmZmVyVmlld09iamVjdDtcbiAgICBsZXQgYnVmZmVyOiBVaW50OEFycmF5ID0gc3BhcnNlSW5kaWNlcy5idWZmZXJWaWV3T2JqZWN0LmJ1ZmZlck9iamVjdCEuYnVmZmVyITtcbiAgICBjb25zdCBieXRlT2Zmc2V0QnVmZmVyVmlld0FuZFNwYXJzZUluZGljZXM6IG51bWJlciA9XG4gICAgICAoaW5kaWNlc0J1ZmZlclZpZXcuYnl0ZU9mZnNldCA/PyAwKSArIChzcGFyc2VJbmRpY2VzLmJ5dGVPZmZzZXQgPz8gMCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRCeXRlc0luZGljZXMgPSB0aGlzLl9jaGVja0J5dGVzUGVyQ29tcG9uZW50KHNwYXJzZUluZGljZXMpO1xuICAgIGNvbnN0IGJ5dGVMZW5ndGhJbmRpY2VzID0gY29tcG9uZW50Qnl0ZXNJbmRpY2VzICogY291bnQ7IC8vIGluZGV4IGlzIHNjYWxhclxuICAgIGNvbnN0IGRhdGFWaWV3SW5kaWNlczogYW55ID0gbmV3IERhdGFWaWV3KFxuICAgICAgYnVmZmVyLmJ1ZmZlcixcbiAgICAgIGJ5dGVPZmZzZXRCdWZmZXJWaWV3QW5kU3BhcnNlSW5kaWNlcyArIGJ1ZmZlci5ieXRlT2Zmc2V0LFxuICAgICAgYnl0ZUxlbmd0aEluZGljZXNcbiAgICApO1xuXG4gICAgY29uc3QgZGF0YVZpZXdNZXRob2RJbmRpY2VzID0gdGhpcy5fY2hlY2tEYXRhVmlld01ldGhvZChzcGFyc2VJbmRpY2VzKTtcblxuICAgIC8vIGdldCBzcGFyc2UgdmFsdWVzXG4gICAgY29uc3Qgc3BhcnNlVmFsdWVzID0gYWNjZXNzb3Iuc3BhcnNlIS52YWx1ZXMhO1xuICAgIGNvbnN0IHZhbHVlQnVmZmVyVmlldyA9IHNwYXJzZVZhbHVlcy5idWZmZXJWaWV3T2JqZWN0O1xuICAgIGJ1ZmZlciA9IHNwYXJzZVZhbHVlcy5idWZmZXJWaWV3T2JqZWN0LmJ1ZmZlck9iamVjdCEuYnVmZmVyITtcbiAgICBjb25zdCBieXRlT2Zmc2V0QnVmZmVyVmlld0FuZEFjY2Vzc29yVmFsdWVzOiBudW1iZXIgPVxuICAgICAgKHZhbHVlQnVmZmVyVmlldy5ieXRlT2Zmc2V0ID8/IDApICsgKHNwYXJzZVZhbHVlcy5ieXRlT2Zmc2V0ID8/IDApO1xuXG4gICAgY29uc3QgY29tcG9uZW50Qnl0ZXNWYWx1ZXMgPSB0aGlzLl9jaGVja0J5dGVzUGVyQ29tcG9uZW50KGFjY2Vzc29yKTtcbiAgICBjb25zdCBjb21wb25lbnROVmFsdWVzID0gdGhpcy5fY2hlY2tDb21wb25lbnROdW1iZXIoYWNjZXNzb3IpO1xuICAgIGNvbnN0IGJ5dGVMZW5ndGhWYWx1ZXMgPSBjb21wb25lbnRCeXRlc1ZhbHVlcyAqIGNvbXBvbmVudE5WYWx1ZXMgKiBjb3VudDtcbiAgICBjb25zdCBkYXRhVmlld1ZhbHVlczogYW55ID0gbmV3IERhdGFWaWV3KFxuICAgICAgYnVmZmVyLmJ1ZmZlcixcbiAgICAgIGJ5dGVPZmZzZXRCdWZmZXJWaWV3QW5kQWNjZXNzb3JWYWx1ZXMgKyBidWZmZXIuYnl0ZU9mZnNldCxcbiAgICAgIGJ5dGVMZW5ndGhWYWx1ZXNcbiAgICApO1xuICAgIGNvbnN0IGRhdGFWaWV3TWV0aG9kVmFsdWVzID0gdGhpcy5fY2hlY2tEYXRhVmlld01ldGhvZChhY2Nlc3Nvcik7XG5cbiAgICAvLyBzZXQgc3BhcnNlIHZhbHVlcyB0byBybkFjY2Vzc29yXG4gICAgY29uc3QgdHlwZWRBcnJheSA9IHJuQWNjZXNzb3IuZ2V0VHlwZWRBcnJheSgpO1xuICAgIGNvbnN0IGxpdHRsZUVuZGlhbiA9IHRydWU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGRhdGFWaWV3SW5kaWNlc1tkYXRhVmlld01ldGhvZEluZGljZXNdKGNvbXBvbmVudEJ5dGVzSW5kaWNlcyAqIGksIGxpdHRsZUVuZGlhbik7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbXBvbmVudE5WYWx1ZXM7IGorKykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGRhdGFWaWV3VmFsdWVzW2RhdGFWaWV3TWV0aG9kVmFsdWVzXShcbiAgICAgICAgICBjb21wb25lbnRCeXRlc1ZhbHVlcyAqIGNvbXBvbmVudE5WYWx1ZXMgKiBpICsgY29tcG9uZW50Qnl0ZXNWYWx1ZXMgKiBqLFxuICAgICAgICAgIGxpdHRsZUVuZGlhblxuICAgICAgICApO1xuICAgICAgICB0eXBlZEFycmF5W2luZGV4ICogY29tcG9uZW50TlZhbHVlcyArIGpdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBybkFjY2Vzc29yLnNldFR5cGVkQXJyYXkodHlwZWRBcnJheSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgVlJNIDEuMCBtYXRlcmlhbCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gICAqIEBwYXJhbSBybkxvYWRlck9wdGlvbnMgLSBMb2FkZXIgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBDb25maWd1cmVkIG1hdGVyaWFsIG9yIHVuZGVmaW5lZCBpZiBub3QgVlJNIDEuMFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRWUk0xTWF0ZXJpYWwoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIG1hdGVyaWFsSnNvbjogVnJtMV9NYXRlcmlhbCxcbiAgICBybkxvYWRlck9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uXG4gICk6IE1hdGVyaWFsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBWUk1Qcm9wZXJ0aWVzID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNO1xuXG4gICAgY29uc3QgVlJNQ19tYXRlcmlhbHNfbXRvb24gPSBtYXRlcmlhbEpzb24uZXh0ZW5zaW9ucz8uVlJNQ19tYXRlcmlhbHNfbXRvb247XG4gICAgaWYgKFZSTUNfbWF0ZXJpYWxzX210b29uICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGNyZWF0ZU1Ub29uMU1hdGVyaWFsID0gY3JlYXRlTVRvb24xTWF0ZXJpYWxJbXBsO1xuICAgICAgaWYgKGNyZWF0ZU1Ub29uMU1hdGVyaWFsID09IG51bGwpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgJ1ZSTSAxLjAgbWF0ZXJpYWwgc3VwcG9ydCBpcyBub3QgbG9hZGVkLiBJbXBvcnQgdGhlIG1vZGVsIHRocm91Z2ggTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0KCkuJ1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBhcmd1bWVudFxuICAgICAgY29uc3QgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQgPSBybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG5cbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxOYW1lID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuYWRkaXRpb25hbE5hbWU7XG4gICAgICBjb25zdCBpc01vcnBoaW5nID0gdHJ1ZTsgLy90aGlzLl9faXNNb3JwaGluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgICAgY29uc3QgaXNTa2lubmluZyA9IHRydWU7IC8vIHRoaXMuX19pc1NraW5uaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgICBjb25zdCBpc0xpZ2h0aW5nID0gdGhpcy5fX2lzTGlnaHRpbmcoZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24pO1xuICAgICAgY29uc3QgdXNlVGFuZ2VudEF0dHJpYnV0ZSA9IHRydWU7IC8vIHRoaXMuX191c2VUYW5nZW50QXR0cmlidXRlKGdsdGZNb2RlbCwgcHJpbWl0aXZlKTtcbiAgICAgIGNvbnN0IHRleHR1cmVzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQudGV4dHVyZXM7XG4gICAgICBjb25zdCBzYW1wbGVycyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LnNhbXBsZXJzO1xuICAgICAgY29uc3QgZGVidWdNb2RlID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuZGVidWdNb2RlO1xuICAgICAgY29uc3QgbWF4SW5zdGFuY2VzTnVtYmVyID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQubWF4SW5zdGFuY2VzTnVtYmVyO1xuICAgICAgY29uc3QgbWFrZU91dHB1dFNyZ2IgPSB0aGlzLl9fbWFrZU91dHB1dFNyZ2IoZ2x0Zk1vZGVsKTtcblxuICAgICAgLy8gb3V0bGluZVxuICAgICAgbGV0IHJlbmRlclBhc3NPdXRsaW5lOiBSZW5kZXJQYXNzIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKElzLmV4aXN0KFZSTVByb3BlcnRpZXM/LnJuRXh0ZW5zaW9uKSkge1xuICAgICAgICBjb25zdCBybkV4dGVuc2lvbiA9IFZSTVByb3BlcnRpZXMucm5FeHRlbnNpb247XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lID0gcm5FeHRlbnNpb24ucmVuZGVyUGFzc091dGxpbmUgYXMgUmVuZGVyUGFzcztcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUuaXNWclJlbmRlcmluZyA9IHRydWU7XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lLnRyeVRvU2V0VW5pcXVlTmFtZSgnVlJNIE91dGxpbmUgUmVuZGVyUGFzcycsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICAvL2V4aXN0IG91dGxpbmVcbiAgICAgIGlmIChyZW5kZXJQYXNzT3V0bGluZSAhPSBudWxsKSB7XG4gICAgICAgIGxldCBvdXRsaW5lTWF0ZXJpYWw6IE1hdGVyaWFsIHwgdW5kZWZpbmVkO1xuICAgICAgICAvLyBUaGUgVlJNIDEuMCBzcGVjaWZpY2F0aW9uIGRlZmF1bHRzIG91dGxpbmVXaWR0aE1vZGUgdG8gXCJub25lXCIgd2hlbiBpdCBpcyBvbWl0dGVkLlxuICAgICAgICBjb25zdCBvdXRsaW5lV2lkdGhNb2RlID0gVlJNQ19tYXRlcmlhbHNfbXRvb24ub3V0bGluZVdpZHRoTW9kZTtcbiAgICAgICAgaWYgKG91dGxpbmVXaWR0aE1vZGUgPT09ICd3b3JsZENvb3JkaW5hdGVzJyB8fCBvdXRsaW5lV2lkdGhNb2RlID09PSAnc2NyZWVuQ29vcmRpbmF0ZXMnKSB7XG4gICAgICAgICAgb3V0bGluZU1hdGVyaWFsID0gY3JlYXRlTVRvb24xTWF0ZXJpYWwoZW5naW5lLCB7XG4gICAgICAgICAgICBhZGRpdGlvbmFsTmFtZSxcbiAgICAgICAgICAgIGlzTW9ycGhpbmcsXG4gICAgICAgICAgICBpc1NraW5uaW5nLFxuICAgICAgICAgICAgaXNMaWdodGluZyxcbiAgICAgICAgICAgIHVzZVRhbmdlbnRBdHRyaWJ1dGUsXG4gICAgICAgICAgICBpc091dGxpbmU6IHRydWUsXG4gICAgICAgICAgICBtYXRlcmlhbEpzb24sXG4gICAgICAgICAgICB0ZXh0dXJlcyxcbiAgICAgICAgICAgIHNhbXBsZXJzLFxuICAgICAgICAgICAgZGVidWdNb2RlLFxuICAgICAgICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyLFxuICAgICAgICAgICAgbWFrZU91dHB1dFNyZ2IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoSXMuZXhpc3Qob3V0bGluZU1hdGVyaWFsKSkge1xuICAgICAgICAgIG1hdGVyaWFsSnNvbi5leHRyYXMhLm91dGxpbmVNYXRlcmlhbCA9IG5ldyBXZWFrUmVmKG91dGxpbmVNYXRlcmlhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVNVG9vbjFNYXRlcmlhbChlbmdpbmUsIHtcbiAgICAgICAgYWRkaXRpb25hbE5hbWUsXG4gICAgICAgIGlzTW9ycGhpbmcsXG4gICAgICAgIGlzU2tpbm5pbmcsXG4gICAgICAgIGlzTGlnaHRpbmcsXG4gICAgICAgIHVzZVRhbmdlbnRBdHRyaWJ1dGUsXG4gICAgICAgIGlzT3V0bGluZTogZmFsc2UsXG4gICAgICAgIG1hdGVyaWFsSnNvbixcbiAgICAgICAgdGV4dHVyZXMsXG4gICAgICAgIHNhbXBsZXJzLFxuICAgICAgICBkZWJ1Z01vZGUsXG4gICAgICAgIG1heEluc3RhbmNlc051bWJlcixcbiAgICAgICAgbWFrZU91dHB1dFNyZ2IsXG4gICAgICB9KTtcblxuICAgICAgLy8gTW9kZWxDb252ZXJ0ZXIuc2V0TVRvb25UZXh0dXJlcyh0ZXh0dXJlcywgbWF0ZXJpYWxQcm9wZXJ0aWVzLCBtYXRlcmlhbCwgc2FtcGxlcnMpO1xuXG4gICAgICAvLyBkaXNhYmxlIHVubGl0XG4gICAgICAobWF0ZXJpYWxKc29uLmV4dGVuc2lvbnMgYXMgYW55KS5LSFJfbWF0ZXJpYWxzX3VubGl0ID0gdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfVxuXG4gICAgLy8gdXNlIGFub3RoZXIgbWF0ZXJpYWxcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgTVRvb24gdGV4dHVyZSBwYXJhbWV0ZXJzIGZvciBWUk0gbWF0ZXJpYWxzXG4gICAqIEBwYXJhbSB0ZXh0dXJlcyAtIEFycmF5IG9mIHRleHR1cmVzXG4gICAqIEBwYXJhbSBtYXRlcmlhbFByb3BlcnRpZXMgLSBWUk0gbWF0ZXJpYWwgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gICAqIEBwYXJhbSBzYW1wbGVycyAtIEFycmF5IG9mIHNhbXBsZXJzXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBzZXRNVG9vblRleHR1cmVzKFxuICAgIHRleHR1cmVzOiBhbnksXG4gICAgbWF0ZXJpYWxQcm9wZXJ0aWVzOiBWcm0weE1hdGVyaWFsUHJvcGVydHksXG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICAgIHNhbXBsZXJzOiBhbnlcbiAgKSB7XG4gICAgY29uc3QgbGl0Q29sb3JUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9NYWluVGV4XTtcbiAgICBpZiAobGl0Q29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdsaXRDb2xvclRleHR1cmUnLFxuICAgICAgICBsaXRDb2xvclRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fTWFpblRleF1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNoYWRlQ29sb3JUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TaGFkZVRleHR1cmVdO1xuICAgIGlmIChzaGFkZUNvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnc2hhZGVDb2xvclRleHR1cmUnLFxuICAgICAgICBzaGFkZUNvbG9yVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TaGFkZVRleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCByZWNlaXZlU2hhZG93VGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fUmVjZWl2ZVNoYWRvd1RleHR1cmVdO1xuICAgIGlmIChyZWNlaXZlU2hhZG93VGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAncmVjZWl2ZVNoYWRvd1RleHR1cmUnLFxuICAgICAgICByZWNlaXZlU2hhZG93VGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9SZWNlaXZlU2hhZG93VGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNoYWRpbmdHcmFkZVRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1NoYWRpbmdHcmFkZVRleHR1cmVdO1xuICAgIGlmIChzaGFkaW5nR3JhZGVUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdzaGFkaW5nR3JhZGVUZXh0dXJlJyxcbiAgICAgICAgc2hhZGluZ0dyYWRlVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TaGFkaW5nR3JhZGVUZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmltVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fUmltVGV4dHVyZV07XG4gICAgaWYgKHJpbVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihcbiAgICAgICAgJ3JpbVRleHR1cmUnLFxuICAgICAgICByaW1UZXh0dXJlLFxuICAgICAgICBzYW1wbGVyc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX1JpbVRleHR1cmVdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBtYXRDYXBUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TcGhlcmVBZGRdO1xuICAgIGlmIChtYXRDYXBUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdtYXRDYXBUZXh0dXJlJyxcbiAgICAgICAgbWF0Q2FwVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9TcGhlcmVBZGRdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBlbWlzc2lvblRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX0VtaXNzaW9uTWFwXTtcbiAgICBpZiAoZW1pc3Npb25UZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdlbWlzc2lvblRleHR1cmUnLFxuICAgICAgICBlbWlzc2lvblRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fRW1pc3Npb25NYXBdXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBub3JtYWxUZXh0dXJlID0gdGV4dHVyZXNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9CdW1wTWFwXTtcbiAgICBpZiAobm9ybWFsVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAnbm9ybWFsVGV4dHVyZScsXG4gICAgICAgIG5vcm1hbFRleHR1cmUsXG4gICAgICAgIHNhbXBsZXJzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fQnVtcE1hcF1cbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG91dGxpbmVXaWR0aFRleHR1cmUgPSB0ZXh0dXJlc1ttYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXMuX091dGxpbmVXaWR0aFRleHR1cmVdO1xuICAgIGlmIChvdXRsaW5lV2lkdGhUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICdvdXRsaW5lV2lkdGhUZXh0dXJlJyxcbiAgICAgICAgb3V0bGluZVdpZHRoVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhUZXh0dXJlXVxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgdXZBbmltYXRpb25NYXNrVGV4dHVyZSA9IHRleHR1cmVzW21hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcy5fVXZBbmltTWFza1RleHR1cmVdO1xuICAgIGlmICh1dkFuaW1hdGlvbk1hc2tUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoXG4gICAgICAgICd1dkFuaW1hdGlvbk1hc2tUZXh0dXJlJyxcbiAgICAgICAgdXZBbmltYXRpb25NYXNrVGV4dHVyZSxcbiAgICAgICAgc2FtcGxlcnNbbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzLl9VdkFuaW1NYXNrVGV4dHVyZV1cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgVlJNIDAueCBtYXRlcmlhbCBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gICAqIEBwYXJhbSBybkxvYWRlck9wdGlvbnMgLSBMb2FkZXIgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBDb25maWd1cmVkIG1hdGVyaWFsIG9yIHVuZGVmaW5lZCBpZiBub3QgVlJNIDAueFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zZXRWUk0weE1hdGVyaWFsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgICBybkxvYWRlck9wdGlvbnM6IEdsdGZMb2FkT3B0aW9uXG4gICk6IE1hdGVyaWFsIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBWUk1Qcm9wZXJ0aWVzID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNO1xuXG4gICAgY29uc3QgbWF0ZXJpYWxQcm9wZXJ0aWVzID0gbWF0ZXJpYWxKc29uLmV4dHJhcyEudnJtMHhNYXRlcmlhbFByb3BlcnR5IGFzIFZybTB4TWF0ZXJpYWxQcm9wZXJ0eTtcbiAgICBjb25zdCBzaGFkZXJOYW1lID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLnNoYWRlcjtcbiAgICBpZiAoc2hhZGVyTmFtZSA9PT0gJ1ZSTS9NVG9vbicpIHtcbiAgICAgIGNvbnN0IGNyZWF0ZU1Ub29uMHhNYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMHhNYXRlcmlhbEltcGw7XG4gICAgICBpZiAoY3JlYXRlTVRvb24weE1hdGVyaWFsID09IG51bGwpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgJ1ZSTSAwLnggbWF0ZXJpYWwgc3VwcG9ydCBpcyBub3QgbG9hZGVkLiBJbXBvcnQgdGhlIG1vZGVsIHRocm91Z2ggTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0KCkuJ1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBhcmd1bWVudFxuICAgICAgY29uc3QgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQgPSBybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG5cbiAgICAgIGNvbnN0IGFkZGl0aW9uYWxOYW1lID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuYWRkaXRpb25hbE5hbWU7XG4gICAgICBjb25zdCBpc01vcnBoaW5nID0gdHJ1ZTsgLy90aGlzLl9faXNNb3JwaGluZyhub2RlLCBnbHRmTW9kZWwpO1xuICAgICAgY29uc3QgaXNTa2lubmluZyA9IHRydWU7IC8vdGhpcy5fX2lzU2tpbm5pbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICAgIGNvbnN0IGlzTGlnaHRpbmcgPSB0aGlzLl9faXNMaWdodGluZyhnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbik7XG4gICAgICBjb25zdCB1c2VUYW5nZW50QXR0cmlidXRlID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHRleHR1cmVzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQudGV4dHVyZXM7XG4gICAgICBjb25zdCBzYW1wbGVycyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50LnNhbXBsZXJzO1xuICAgICAgY29uc3QgZGVidWdNb2RlID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQuZGVidWdNb2RlO1xuICAgICAgY29uc3QgbWF4SW5zdGFuY2VzTnVtYmVyID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnQubWF4SW5zdGFuY2VzTnVtYmVyO1xuICAgICAgY29uc3QgbWFrZU91dHB1dFNyZ2IgPSB0aGlzLl9fbWFrZU91dHB1dFNyZ2IoZ2x0Zk1vZGVsKTtcblxuICAgICAgLy8gb3V0bGluZVxuICAgICAgbGV0IHJlbmRlclBhc3NPdXRsaW5lOiBSZW5kZXJQYXNzIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKElzLmV4aXN0KFZSTVByb3BlcnRpZXM/LnJuRXh0ZW5zaW9uKSkge1xuICAgICAgICBjb25zdCBybkV4dGVuc2lvbiA9IFZSTVByb3BlcnRpZXMucm5FeHRlbnNpb247XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lID0gcm5FeHRlbnNpb24ucmVuZGVyUGFzc091dGxpbmUgYXMgUmVuZGVyUGFzcztcbiAgICAgICAgcmVuZGVyUGFzc091dGxpbmUuaXNWclJlbmRlcmluZyA9IHRydWU7XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lLnRyeVRvU2V0VW5pcXVlTmFtZSgnVlJNIE91dGxpbmUgUmVuZGVyUGFzcycsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICAvL2V4aXN0IG91dGxpbmVcbiAgICAgIGlmIChyZW5kZXJQYXNzT3V0bGluZSAhPSBudWxsKSB7XG4gICAgICAgIGxldCBvdXRsaW5lTWF0ZXJpYWw6IE1hdGVyaWFsIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAobWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcy5fT3V0bGluZVdpZHRoTW9kZSAhPT0gMCkge1xuICAgICAgICAgIG91dGxpbmVNYXRlcmlhbCA9IGNyZWF0ZU1Ub29uMHhNYXRlcmlhbChlbmdpbmUsIHtcbiAgICAgICAgICAgIGFkZGl0aW9uYWxOYW1lLFxuICAgICAgICAgICAgaXNNb3JwaGluZyxcbiAgICAgICAgICAgIGlzU2tpbm5pbmcsXG4gICAgICAgICAgICBpc0xpZ2h0aW5nLFxuICAgICAgICAgICAgdXNlVGFuZ2VudEF0dHJpYnV0ZSxcbiAgICAgICAgICAgIGlzT3V0bGluZTogdHJ1ZSxcbiAgICAgICAgICAgIG1hdGVyaWFsUHJvcGVydGllcyxcbiAgICAgICAgICAgIHRleHR1cmVzLFxuICAgICAgICAgICAgc2FtcGxlcnMsXG4gICAgICAgICAgICBkZWJ1Z01vZGUsXG4gICAgICAgICAgICBtYXhJbnN0YW5jZXNOdW1iZXIsXG4gICAgICAgICAgICBtYWtlT3V0cHV0U3JnYixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChJcy5leGlzdChvdXRsaW5lTWF0ZXJpYWwpKSB7XG4gICAgICAgICAgTW9kZWxDb252ZXJ0ZXIuc2V0TVRvb25UZXh0dXJlcyh0ZXh0dXJlcywgbWF0ZXJpYWxQcm9wZXJ0aWVzLCBvdXRsaW5lTWF0ZXJpYWwsIHNhbXBsZXJzKTtcbiAgICAgICAgICBtYXRlcmlhbEpzb24uZXh0cmFzIS5vdXRsaW5lTWF0ZXJpYWwgPSBuZXcgV2Vha1JlZihvdXRsaW5lTWF0ZXJpYWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlTVRvb24weE1hdGVyaWFsKGVuZ2luZSwge1xuICAgICAgICBhZGRpdGlvbmFsTmFtZSxcbiAgICAgICAgaXNNb3JwaGluZyxcbiAgICAgICAgaXNTa2lubmluZyxcbiAgICAgICAgaXNMaWdodGluZyxcbiAgICAgICAgdXNlVGFuZ2VudEF0dHJpYnV0ZSxcbiAgICAgICAgaXNPdXRsaW5lOiBmYWxzZSxcbiAgICAgICAgbWF0ZXJpYWxQcm9wZXJ0aWVzLFxuICAgICAgICB0ZXh0dXJlcyxcbiAgICAgICAgc2FtcGxlcnMsXG4gICAgICAgIGRlYnVnTW9kZSxcbiAgICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyLFxuICAgICAgICBtYWtlT3V0cHV0U3JnYixcbiAgICAgIH0pO1xuXG4gICAgICBNb2RlbENvbnZlcnRlci5zZXRNVG9vblRleHR1cmVzKHRleHR1cmVzLCBtYXRlcmlhbFByb3BlcnRpZXMsIG1hdGVyaWFsLCBzYW1wbGVycyk7XG5cbiAgICAgIHJldHVybiBtYXRlcmlhbDtcbiAgICB9XG5cbiAgICAvLyB1c2UgYW5vdGhlciBtYXRlcmlhbFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGFuIGFwcHJvcHJpYXRlIG1hdGVyaWFsIGJhc2VkIG9uIGdsVEYgbWF0ZXJpYWwgZGF0YSBhbmQgbG9hZGVyIG9wdGlvbnNcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAgICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBsb2FkZWQgUmhvZG9uaXRlIHRleHR1cmVzXG4gICAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgbG9hZGVkIFJob2Rvbml0ZSBzYW1wbGVyc1xuICAgKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm5zIEdlbmVyYXRlZCBtYXRlcmlhbFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZUFwcHJvcHJpYXRlTWF0ZXJpYWwoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICByblNhbXBsZXJzOiBTYW1wbGVyW10sXG4gICAgbWF0ZXJpYWxKc29uPzogUm5NMk1hdGVyaWFsXG4gICk6IE1hdGVyaWFsIHtcbiAgICBjb25zdCBpc1RyYW5zbHVjZW50ID0gSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbik7XG4gICAgLy8gaWYgcm5Mb2FkZXJPcHRpb25zIGlzIHNldCBzb21ldGhpbmcsIGRvIHNwZWNpYWwgZGVhbFxuICAgIGlmIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5Mb2FkZXJPcHRpb25zID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcy5ybkxvYWRlck9wdGlvbnM7XG5cbiAgICAgIC8vIEZvciBzcGVjaWZpZWQgbG9hZGVyIGV4dGVuc2lvblxuICAgICAgaWYgKHJuTG9hZGVyT3B0aW9ucy5sb2FkZXJFeHRlbnNpb24/LmlzTmVlZGVkVG9Vc2VUaGlzTWF0ZXJpYWw/LihnbHRmTW9kZWwpKSB7XG4gICAgICAgIGNvbnN0IGxvYWRlckV4dGVuc2lvbiA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8ubG9hZGVyRXh0ZW5zaW9uO1xuICAgICAgICBpZiAobG9hZGVyRXh0ZW5zaW9uPy5nZW5lcmF0ZU1hdGVyaWFsICE9IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbG9hZGVyRXh0ZW5zaW9uLmdlbmVyYXRlTWF0ZXJpYWwobWF0ZXJpYWxKc29uISk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRm9yIFZSTTB4XG4gICAgICBpZiAocm5Mb2FkZXJPcHRpb25zLl9faXNJbXBvcnRWUk0weCkge1xuICAgICAgICBjb25zdCBtYXRlcmlhbCA9IHRoaXMuX19zZXRWUk0weE1hdGVyaWFsKGVuZ2luZSwgZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24hLCBybkxvYWRlck9wdGlvbnMpO1xuICAgICAgICBpZiAoSXMuZXhpc3QobWF0ZXJpYWwpKSB7XG4gICAgICAgICAgbWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IGlzVHJhbnNsdWNlbnQ7XG4gICAgICAgICAgcmV0dXJuIG1hdGVyaWFsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBzcGVjaWZpZWQgZGVmYXVsdCBtYXRlcmlhbCBoZWxwZXJcbiAgICAgIGNvbnN0IG1hdGVyaWFsSGVscGVyID0gcm5Mb2FkZXJPcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlcjtcbiAgICAgIGlmIChtYXRlcmlhbEhlbHBlciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBtYXRlcmlhbEhlbHBlcihlbmdpbmUsIC4uLihybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSA/PyBbXSkpO1xuICAgICAgfVxuICAgICAgaWYgKHJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJOYW1lICE9IG51bGwpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgYGRlZmF1bHRNYXRlcmlhbEhlbHBlck5hbWUgKFwiJHtybkxvYWRlck9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyTmFtZX1cIikgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gYCArXG4gICAgICAgICAgICAnUGFzcyB0aGUgZnVuY3Rpb24gd2l0aCBkZWZhdWx0TWF0ZXJpYWxIZWxwZXIgaW5zdGVhZCwgZS5nLiBkZWZhdWx0TWF0ZXJpYWxIZWxwZXI6IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwuJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHByZSBkYXRhXG4gICAgY29uc3QgaXNNb3JwaGluZyA9IHRydWU7IC8vIHRoaXMuX19pc01vcnBoaW5nKG5vZGUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3QgaXNTa2lubmluZyA9IHRydWU7IC8vdGhpcy5fX2lzU2tpbm5pbmcobm9kZSwgZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBpc0xpZ2h0aW5nID0gdGhpcy5fX2lzTGlnaHRpbmcoZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24pO1xuICAgIGNvbnN0IGFkZGl0aW9uYWxOYW1lID0gJyc7XG5cbiAgICBjb25zdCBybkxvYWRlck9wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnMgPz8ge307XG4gICAgY29uc3QgdXNlTm9ybWFsVGV4dHVyZSA9IG1hdGVyaWFsSnNvbj8ubm9ybWFsVGV4dHVyZSAhPSBudWxsO1xuICAgIGNvbnN0IG1heE1hdGVyaWFsSW5zdGFuY2VOdW1iZXI6IG51bWJlciA9IGVuZ2luZS5jb25maWcubWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXc7XG4gICAgY29uc3QgcGJyVWJlck1hdGVyaWFsT3B0aW9ucyA9IHtcbiAgICAgIGlzTW9ycGhpbmcsXG4gICAgICBpc1NraW5uaW5nLFxuICAgICAgaXNMaWdodGluZyxcbiAgICAgIGlzT2NjbHVzaW9uOiBJcy5leGlzdChtYXRlcmlhbEpzb24/Lm9jY2x1c2lvblRleHR1cmUpLFxuICAgICAgaXNFbWlzc2l2ZTogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5lbWlzc2l2ZVRleHR1cmUpLFxuICAgICAgaXNDbGVhcmNvYXQ6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19jbGVhcmNvYXQpLFxuICAgICAgaXNUcmFuc21pc3Npb246IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24pLFxuICAgICAgaXNWb2x1bWU6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc192b2x1bWUpLFxuICAgICAgaXNTaGVlbjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3NoZWVuKSxcbiAgICAgIGlzU3BlY3VsYXI6IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19zcGVjdWxhciksXG4gICAgICBpc0lyaWRlc2NlbmNlOiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UpLFxuICAgICAgaXNBbmlzb3Ryb3B5OiBJcy5leGlzdChtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfYW5pc290cm9weSksXG4gICAgICBpc0Rpc3BlcnNpb246IElzLmV4aXN0KG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uKSxcbiAgICAgIGlzRW1pc3NpdmVTdHJlbmd0aDogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoKSxcbiAgICAgIGlzRGlmZnVzZVRyYW5zbWlzc2lvbjogSXMuZXhpc3QobWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uKSxcbiAgICAgIGlzU2hhZG93OiAhIXJuTG9hZGVyT3B0aW9ucy5zaGFkb3csXG4gICAgICB1c2VOb3JtYWxUZXh0dXJlLFxuICAgICAgYWRkaXRpb25hbE5hbWU6IGFkZGl0aW9uYWxOYW1lLFxuICAgICAgbWF4SW5zdGFuY2VzTnVtYmVyOiBtYXhNYXRlcmlhbEluc3RhbmNlTnVtYmVyLFxuICAgIH07XG5cbiAgICBpZiAoSXMuZXhpc3QobWF0ZXJpYWxKc29uKSkge1xuICAgICAgaWYgKG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5WUk1DX21hdGVyaWFsc19tdG9vbiAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHJuTG9hZGVyT3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTG9hZGVyT3B0aW9ucyE7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fX3NldFZSTTFNYXRlcmlhbChlbmdpbmUsIGdsdGZNb2RlbCwgbWF0ZXJpYWxKc29uIGFzIFZybTFfTWF0ZXJpYWwsIHJuTG9hZGVyT3B0aW9ucyk7XG4gICAgICAgIGlmIChJcy5leGlzdChtYXRlcmlhbCkpIHtcbiAgICAgICAgICBtYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gaXNUcmFuc2x1Y2VudDtcbiAgICAgICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRm9yIFJIT0RPTklURV9tYXRlcmlhbHNfbm9kZSBleHRlbnNpb24gKG5vZGUtYmFzZWQgc2hhZGVyIG1hdGVyaWFscylcbiAgICAgIGlmIChSaG9kb25pdGVJbXBvcnRFeHRlbnNpb24uaGFzTm9kZUJhc2VkTWF0ZXJpYWxFeHRlbnNpb24obWF0ZXJpYWxKc29uKSkge1xuICAgICAgICAvLyBDcmVhdGUgYW5kIHJldHVybiBub2RlLWJhc2VkIGN1c3RvbSBtYXRlcmlhbFxuICAgICAgICBjb25zdCBjdXN0b21NYXRlcmlhbCA9IFJob2Rvbml0ZUltcG9ydEV4dGVuc2lvbi5jcmVhdGVOb2RlQmFzZWRNYXRlcmlhbChcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICAgIG1hdGVyaWFsSnNvbixcbiAgICAgICAgICByblRleHR1cmVzID8/IFtdLFxuICAgICAgICAgIHJuU2FtcGxlcnMgPz8gW10sXG4gICAgICAgICAgcGJyVWJlck1hdGVyaWFsT3B0aW9uc1xuICAgICAgICApO1xuICAgICAgICBpZiAoSXMuZXhpc3QoY3VzdG9tTWF0ZXJpYWwpKSB7XG4gICAgICAgICAgY3VzdG9tTWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IGlzVHJhbnNsdWNlbnQ7XG4gICAgICAgICAgcmV0dXJuIGN1c3RvbU1hdGVyaWFsO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBub2RlLWJhc2VkIG1hdGVyaWFsIGltcGxlbWVudGF0aW9uIGlzIGxvYWRlZCBvbiBkZW1hbmQuIEZhbGxpbmcgYmFjayB0byB0aGUgZGVmYXVsdCBtYXRlcmlhbFxuICAgICAgICAvLyBrZWVwcyB0aGUgc3luY2hyb25vdXMgY29udmVydFRvUmhvZG9uaXRlT2JqZWN0U2ltcGxlKCkgcGF0aCB1c2FibGUuXG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKFxuICAgICAgICAgICdSSE9ET05JVEVfbWF0ZXJpYWxzX25vZGU6IEZhaWxlZCB0byBjcmVhdGUgYSBub2RlLWJhc2VkIG1hdGVyaWFsLiBGYWxsaW5nIGJhY2sgdG8gdGhlIGRlZmF1bHQgbWF0ZXJpYWwuJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChOdW1iZXIucGFyc2VGbG9hdChnbHRmTW9kZWwuYXNzZXQ/LnZlcnNpb24pID49IDIpIHtcbiAgICAgIC8vIEZvciBnbFRGIDJcbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlUGJyVWJlck1hdGVyaWFsKGVuZ2luZSwgcGJyVWJlck1hdGVyaWFsT3B0aW9ucyk7XG4gICAgICBjb25zdCBtYWtlT3V0cHV0U3JnYiA9IHRoaXMuX19tYWtlT3V0cHV0U3JnYihnbHRmTW9kZWwpO1xuICAgICAgaWYgKElzLmV4aXN0KG1ha2VPdXRwdXRTcmdiKSkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21ha2VPdXRwdXRTcmdiJywgbWFrZU91dHB1dFNyZ2IpO1xuICAgICAgfVxuICAgICAgbWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IGlzVHJhbnNsdWNlbnQ7XG4gICAgICByZXR1cm4gbWF0ZXJpYWw7XG4gICAgfVxuICAgIC8vIEZvciBnbFRGIDFcbiAgICBjb25zdCBtYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwoZW5naW5lLCB7XG4gICAgICBpc1NraW5uaW5nLFxuICAgICAgaXNMaWdodGluZyxcbiAgICAgIGFkZGl0aW9uYWxOYW1lOiBhZGRpdGlvbmFsTmFtZSxcbiAgICAgIG1heEluc3RhbmNlc051bWJlcjogbWF4TWF0ZXJpYWxJbnN0YW5jZU51bWJlcixcbiAgICB9KTtcbiAgICBtYXRlcmlhbC5pc1RyYW5zbHVjZW50ID0gaXNUcmFuc2x1Y2VudDtcbiAgICByZXR1cm4gbWF0ZXJpYWw7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiBsaWdodGluZyBzaG91bGQgYmUgZW5hYmxlZCBmb3IgYSBtYXRlcmlhbFxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm5zIFRydWUgaWYgbGlnaHRpbmcgc2hvdWxkIGJlIGVuYWJsZWRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faXNMaWdodGluZyhnbHRmTW9kZWw6IFJuTTIsIG1hdGVyaWFsSnNvbj86IFJuTTJNYXRlcmlhbCkge1xuICAgIGNvbnN0IGFyZ3VtZW50ID0gZ2x0Zk1vZGVsPy5hc3NldD8uZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuICAgIGlmIChhcmd1bWVudD8uaXNMaWdodGluZyAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gYXJndW1lbnQuaXNMaWdodGluZyBhcyBib29sZWFuO1xuICAgIH1cbiAgICByZXR1cm4gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3VubGl0ID09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0YW5nZW50IGF0dHJpYnV0ZXMgc2hvdWxkIGJlIHVzZWQgZm9yIGEgcHJpbWl0aXZlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gICAqIEBwYXJhbSBwcmltaXRpdmUgLSBUaGUgZ2xURiBwcmltaXRpdmUgZGF0YVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRhbmdlbnQgYXR0cmlidXRlcyBzaG91bGQgYmUgdXNlZFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX191c2VUYW5nZW50QXR0cmlidXRlKGdsdGZNb2RlbDogUm5NMiwgcHJpbWl0aXZlOiBSbk0yUHJpbWl0aXZlKSB7XG4gICAgY29uc3QgdGFuZ2VudENhbGN1bGF0aW9uTW9kZSA9IGdsdGZNb2RlbD8uYXNzZXQ/LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy50YW5nZW50Q2FsY3VsYXRpb25Nb2RlO1xuXG4gICAgc3dpdGNoICh0YW5nZW50Q2FsY3VsYXRpb25Nb2RlKSB7XG4gICAgICBjYXNlIDA6IC8vIGRvIG5vdCB1c2Ugbm9ybWFsIG1hcFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBjYXNlIDE6IC8vIHRhbmdlbnQgYXR0cmlidXRlICsgY2FsY3VsYXRlZCB0YW5nZW50IGluIHNoYWRlclxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjogLy8gdGFuZ2VudCBhdHRyaWJ1dGUgKyBwcmUtY2FsY3VsYXRlZCB0YW5nZW50XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAzOiAvLyBmb3JjZSBjYWxjIGluIHNoYWRlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBjYXNlIDQ6IC8vIGZvcmNlIHByZS1jYWxjXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBpbiBwcmltaXRpdmUuYXR0cmlidXRlcykge1xuICAgICAgaWYgKGF0dHJpYnV0ZSA9PT0gJ1RBTkdFTlQnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3VzZU5vcm1hbFRleHR1cmUoZ2x0Zk1vZGVsOiBSbk0yKSB7XG4gICAgY29uc3QgYXJndW1lbnQgPSBnbHRmTW9kZWw/LmFzc2V0Py5leHRyYXM/LnJuTG9hZGVyT3B0aW9ucz8uZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSFbMF07XG4gICAgaWYgKGFyZ3VtZW50Py51c2VOb3JtYWxUZXh0dXJlID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZ2x0Zk1vZGVsPy5hc3NldD8uZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LnRhbmdlbnRDYWxjdWxhdGlvbk1vZGUgIT09IDA7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX21ha2VPdXRwdXRTcmdiKGdsdGZNb2RlbDogUm5NMikge1xuICAgIGNvbnN0IGFyZ3VtZW50ID0gZ2x0Zk1vZGVsPy5hc3NldD8uZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/LmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkhWzBdO1xuICAgIHJldHVybiBhcmd1bWVudD8ubWFrZU91dHB1dFNyZ2IgYXMgYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2V0dXBNYXRlcmlhbChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICAgIHJuU2FtcGxlcnM6IFNhbXBsZXJbXSxcbiAgICBtYXRlcmlhbEpzb24/OiBSbk0yTWF0ZXJpYWxcbiAgKTogTWF0ZXJpYWwge1xuICAgIGNvbnN0IG1hdGVyaWFsOiBNYXRlcmlhbCA9IHRoaXMuX19nZW5lcmF0ZUFwcHJvcHJpYXRlTWF0ZXJpYWwoXG4gICAgICBlbmdpbmUsXG4gICAgICBnbHRmTW9kZWwsXG4gICAgICByblRleHR1cmVzLFxuICAgICAgcm5TYW1wbGVycyxcbiAgICAgIG1hdGVyaWFsSnNvblxuICAgICk7XG4gICAgaWYgKG1hdGVyaWFsSnNvbiA9PSBudWxsKSByZXR1cm4gbWF0ZXJpYWw7XG5cbiAgICBNb2RlbENvbnZlcnRlci5zZXRQYXJhbWV0ZXJzVG9NYXRlcmlhbChtYXRlcmlhbEpzb24sIGdsdGZNb2RlbCwgbWF0ZXJpYWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMsIGZhbHNlKTtcblxuICAgIGlmIChtYXRlcmlhbEpzb24uZXh0cmFzPy5vdXRsaW5lTWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgTW9kZWxDb252ZXJ0ZXIuc2V0UGFyYW1ldGVyc1RvTWF0ZXJpYWwoXG4gICAgICAgIG1hdGVyaWFsSnNvbixcbiAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICBtYXRlcmlhbEpzb24uZXh0cmFzLm91dGxpbmVNYXRlcmlhbC5kZXJlZigpLFxuICAgICAgICByblRleHR1cmVzLFxuICAgICAgICByblNhbXBsZXJzLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRlcmlhbDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHNldFBhcmFtZXRlcnNUb01hdGVyaWFsKFxuICAgIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gICAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICAgIHJuU2FtcGxlcnM6IFNhbXBsZXJbXSxcbiAgICBpc091dGxpbmU6IGJvb2xlYW5cbiAgKSB7XG4gICAgY29uc3QgaXNVbmxpdCA9IG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3VubGl0ICE9IG51bGw7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuTG9hZGVyT3B0aW9ucztcbiAgICBjb25zdCBwYnJNZXRhbGxpY1JvdWdobmVzcyA9IG1hdGVyaWFsSnNvbi5wYnJNZXRhbGxpY1JvdWdobmVzcztcbiAgICBpZiAocGJyTWV0YWxsaWNSb3VnaG5lc3MgIT0gbnVsbCkge1xuICAgICAgLy8gQmFzZUNvbG9yIEZhY3RvclxuICAgICAgc2V0dXBQYnJNZXRhbGxpY1JvdWdobmVzcyhcbiAgICAgICAgcGJyTWV0YWxsaWNSb3VnaG5lc3MsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICBnbHRmTW9kZWwsXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgIG1hdGVyaWFsSnNvbixcbiAgICAgICAgcm5UZXh0dXJlcyxcbiAgICAgICAgcm5TYW1wbGVyc1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBhcmFtOiBJbmRleCA9IFNoYWRpbmdNb2RlbC5QaG9uZy5pbmRleDtcbiAgICAgIGlmIChtYXRlcmlhbEpzb24/LmV4dHJhcz8udGVjaG5pcXVlKSB7XG4gICAgICAgIHN3aXRjaCAobWF0ZXJpYWxKc29uLmV4dHJhcy50ZWNobmlxdWUpIHtcbiAgICAgICAgICBjYXNlIFNoYWRpbmdNb2RlbC5Db25zdGFudC5zdHI6XG4gICAgICAgICAgICBwYXJhbSA9IFNoYWRpbmdNb2RlbC5Db25zdGFudC5pbmRleDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgU2hhZGluZ01vZGVsLkxhbWJlcnQuc3RyOlxuICAgICAgICAgICAgcGFyYW0gPSBTaGFkaW5nTW9kZWwuTGFtYmVydC5pbmRleDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgU2hhZGluZ01vZGVsLkJsaW5uUGhvbmcuc3RyOlxuICAgICAgICAgICAgcGFyYW0gPSBTaGFkaW5nTW9kZWwuQmxpbm5QaG9uZy5pbmRleDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgU2hhZGluZ01vZGVsLlBob25nLnN0cjpcbiAgICAgICAgICAgIHBhcmFtID0gU2hhZGluZ01vZGVsLlBob25nLmluZGV4O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkaW5nTW9kZWwnLCBTY2FsYXIuZnJvbUNvcHlOdW1iZXIocGFyYW0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBlbWlzc2l2ZUZhY3RvciA9IGlzVW5saXQgPyAoWzAsIDAsIDBdIGFzIEFycmF5MzxudW1iZXI+KSA6IG1hdGVyaWFsSnNvbi5lbWlzc2l2ZUZhY3RvcjtcbiAgICBpZiAoZW1pc3NpdmVGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdlbWlzc2l2ZUZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoZW1pc3NpdmVGYWN0b3IpKTtcbiAgICB9XG5cbiAgICBjb25zdCBlbWlzc2l2ZVRleHR1cmUgPSBtYXRlcmlhbEpzb24uZW1pc3NpdmVUZXh0dXJlO1xuICAgIGlmIChlbWlzc2l2ZVRleHR1cmUgIT0gbnVsbCAmJiBJcy5mYWxzeShpc1VubGl0KSkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tlbWlzc2l2ZVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2VtaXNzaXZlVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdlbWlzc2l2ZVRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoTnVtYmVyLnBhcnNlRmxvYXQoZ2x0Zk1vZGVsLmFzc2V0Py52ZXJzaW9uKSA+PSAyICYmIGVtaXNzaXZlVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZW1pc3NpdmVUZXhjb29yZEluZGV4JywgZW1pc3NpdmVUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGVtaXNzaXZlVGV4dHVyZSEsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnZW1pc3NpdmVUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2VtaXNzaXZlVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgYWxwaGFNb2RlID0gbWF0ZXJpYWxKc29uLmFscGhhTW9kZTtcbiAgICBpZiAob3B0aW9ucz8uYWxwaGFNb2RlKSB7XG4gICAgICBhbHBoYU1vZGUgPSBvcHRpb25zLmFscGhhTW9kZTtcbiAgICB9XG4gICAgaWYgKGFscGhhTW9kZSAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5hbHBoYU1vZGUgPSBBbHBoYU1vZGUuZnJvbUdsVEZTdHJpbmcoYWxwaGFNb2RlKSE7XG5cbiAgICAgIC8vIHNldCBhbHBoYSB0aHJlc2hvbGQgZXhjZXB0IGZvciBWUk1cbiAgICAgIGlmIChtYXRlcmlhbC5hbHBoYU1vZGUgPT09IEFscGhhTW9kZS5NYXNrICYmICFnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM/Ll9faXNJbXBvcnRWUk0weCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2FscGhhQ3V0b2ZmJywgU2NhbGFyLmZyb21Db3B5TnVtYmVyKG1hdGVyaWFsSnNvbi5hbHBoYUN1dG9mZiA/PyAwLjUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWF0ZXJpYWwuaXNUcmFuc2x1Y2VudCA9IElzLmV4aXN0KG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbik7XG5cbiAgICBjb25zdCBkb3VibGVTaWRlZCA9IG1hdGVyaWFsSnNvbi5kb3VibGVTaWRlZDtcbiAgICBpZiAoZG91YmxlU2lkZWQgIT0gbnVsbCAmJiAhaXNPdXRsaW5lKSB7XG4gICAgICBtYXRlcmlhbC5jdWxsRmFjZSA9ICFkb3VibGVTaWRlZDtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxUZXh0dXJlID0gbWF0ZXJpYWxKc29uLm5vcm1hbFRleHR1cmU7XG4gICAgaWYgKG5vcm1hbFRleHR1cmUgIT0gbnVsbCAmJiBJcy5mYWxzeShpc1VubGl0KSkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tub3JtYWxUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tub3JtYWxUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ25vcm1hbFRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoTnVtYmVyLnBhcnNlRmxvYXQoZ2x0Zk1vZGVsLmFzc2V0Py52ZXJzaW9uKSA+PSAyKSB7XG4gICAgICAgIGlmIChub3JtYWxUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ25vcm1hbFRleGNvb3JkSW5kZXgnLCBub3JtYWxUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxUZXh0dXJlLnNjYWxlICE9IG51bGwpIHtcbiAgICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ25vcm1hbFNjYWxlJywgbm9ybWFsVGV4dHVyZS5zY2FsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgIG5vcm1hbFRleHR1cmUhLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICAnbm9ybWFsVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICdub3JtYWxUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICdub3JtYWxUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgKTtcblxuICAgIC8vIEZvciBFeHRlbnNpb25cbiAgICBpZiAodGhpcy5fY2hlY2tSbkdsdGZMb2FkZXJPcHRpb25zRXhpc3QoZ2x0Zk1vZGVsKSkge1xuICAgICAgY29uc3QgbG9hZGVyRXh0ZW5zaW9uID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5sb2FkZXJFeHRlbnNpb247XG4gICAgICBpZiAobG9hZGVyRXh0ZW5zaW9uPy5zZXR1cE1hdGVyaWFsICE9IG51bGwpIHtcbiAgICAgICAgbG9hZGVyRXh0ZW5zaW9uLnNldHVwTWF0ZXJpYWwoZ2x0Zk1vZGVsLCBtYXRlcmlhbEpzb24sIG1hdGVyaWFsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWF0ZXJpYWxKc29uLmV4dGVuc2lvbnM/LlZSTUNfbWF0ZXJpYWxzX210b29uICE9IG51bGwpIHtcbiAgICAgIHNldHVwTVRvb24xKG1hdGVyaWFsLCBnbHRmTW9kZWwsIG1hdGVyaWFsSnNvbiBhcyBWcm0xX01hdGVyaWFsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgX2NyZWF0ZVNhbXBsZXIoZW5naW5lOiBFbmdpbmUsIHNhbXBsZXI6IFJuTTJUZXh0dXJlU2FtcGxlcikge1xuICAgIGNvbnN0IHJuU2FtcGxlciA9IG5ldyBTYW1wbGVyKGVuZ2luZSwge1xuICAgICAgbWFnRmlsdGVyOiBJcy5leGlzdChzYW1wbGVyLm1hZ0ZpbHRlcikgPyBUZXh0dXJlUGFyYW1ldGVyLmZyb20oc2FtcGxlci5tYWdGaWx0ZXIpIDogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICBtaW5GaWx0ZXI6IElzLmV4aXN0KHNhbXBsZXIubWluRmlsdGVyKSA/IFRleHR1cmVQYXJhbWV0ZXIuZnJvbShzYW1wbGVyLm1pbkZpbHRlcikgOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgIHdyYXBTOiBJcy5leGlzdChzYW1wbGVyLndyYXBTKSA/IFRleHR1cmVQYXJhbWV0ZXIuZnJvbShzYW1wbGVyLndyYXBTKSA6IFRleHR1cmVQYXJhbWV0ZXIuUmVwZWF0LFxuICAgICAgd3JhcFQ6IElzLmV4aXN0KHNhbXBsZXIud3JhcFQpID8gVGV4dHVyZVBhcmFtZXRlci5mcm9tKHNhbXBsZXIud3JhcFQpIDogVGV4dHVyZVBhcmFtZXRlci5SZXBlYXQsXG4gICAgfSk7XG4gICAgcm5TYW1wbGVyLmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIHJuU2FtcGxlcjtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBfY3JlYXRlVGV4dHVyZShcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBpbWFnZTogUm5NMkltYWdlLFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICB7IGF1dG9EZXRlY3RUcmFuc3BhcmVuY3kgPSBmYWxzZSB9ID0ge31cbiAgKSB7XG4gICAgY29uc3QgX29wdGlvbnMgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnM7XG5cbiAgICBjb25zdCByblRleHR1cmUgPSBuZXcgVGV4dHVyZShlbmdpbmUpO1xuICAgIHJuVGV4dHVyZS5hdXRvRGV0ZWN0VHJhbnNwYXJlbmN5ID0gYXV0b0RldGVjdFRyYW5zcGFyZW5jeTtcblxuICAgIGlmIChpbWFnZS5pbWFnZSkge1xuICAgICAgY29uc3QgaW1hZ2VFbGVtID0gaW1hZ2UuaW1hZ2UgYXMgSFRNTEltYWdlRWxlbWVudDtcbiAgICAgIGF3YWl0IHJuVGV4dHVyZS5nZW5lcmF0ZVRleHR1cmVGcm9tSW1hZ2UoaW1hZ2VFbGVtKTtcbiAgICB9IGVsc2UgaWYgKGltYWdlLmJhc2lzKSB7XG4gICAgICBhd2FpdCByblRleHR1cmUuZ2VuZXJhdGVUZXh0dXJlRnJvbUJhc2lzKGltYWdlLmJhc2lzLCB7fSk7XG4gICAgfSBlbHNlIGlmIChpbWFnZS5rdHgyKSB7XG4gICAgICBhd2FpdCByblRleHR1cmUuZ2VuZXJhdGVUZXh0dXJlRnJvbUtUWDIoaW1hZ2Uua3R4Mik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gaW1hZ2UgZm91bmQnKTtcbiAgICB9XG5cbiAgICBpZiAoaW1hZ2UudXJpKSB7XG4gICAgICByblRleHR1cmUubmFtZSA9IGltYWdlLnVyaTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXh0ID0gaW1hZ2UubWltZVR5cGU/LnNwbGl0KCcvJylbMV07XG4gICAgICByblRleHR1cmUubmFtZSA9IGltYWdlLm5hbWUgPz8gYFVudGl0bGVkLiR7ZXh0fWA7XG4gICAgfVxuICAgIHJuVGV4dHVyZS50cnlUb1NldFVuaXF1ZU5hbWUocm5UZXh0dXJlLm5hbWUsIHRydWUpO1xuXG4gICAgcmV0dXJuIHJuVGV4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIHRleHR1cmUgYXNzaWdubWVudHMgb2YgdGhlIFJIT0RPTklURV9yYXltYXJjaGluZ19tYXRlcmlhbHMgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBUaGUgZXh0ZW5zaW9uIG1hcHMgYSBzaGFkZXIgc2VtYW50aWMgdG8gYSBnbFRGIHRleHR1cmUgaW5kZXguIEFwcGxpY2F0aW9ucyByZWJ1aWxkIHRoZVxuICAgKiBzaGFyZWQgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgZnJvbSB0aGUgbm9kZSBncmFwaHMgYWZ0ZXIgaW1wb3J0IGFuZCB0aGVuIGFwcGx5IHRoZSB0ZXh0dXJlc1xuICAgKiB3aXRoIE1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoc2VtYW50aWMsIHRleHR1cmUsIHNhbXBsZXIpLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHJldHVybnMgT25lIGVudHJ5IHBlciB2YWxpZCBhc3NpZ25tZW50LCBpbiBleHRlbnNpb24gb3JkZXJcbiAgICovXG4gIHN0YXRpYyBnZXRSYXltYXJjaGluZ01hdGVyaWFsVGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbDogUm5NMik6IHtcbiAgICBzZW1hbnRpYzogc3RyaW5nO1xuICAgIHRleHR1cmVJbmRleDogbnVtYmVyO1xuICAgIHNhbXBsZXJJbmRleD86IG51bWJlcjtcbiAgfVtdIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSAoXG4gICAgICBnbHRmTW9kZWwuZXh0ZW5zaW9ucyBhc1xuICAgICAgICB8IHtcbiAgICAgICAgICAgIFJIT0RPTklURV9yYXltYXJjaGluZ19tYXRlcmlhbHM/OiB7XG4gICAgICAgICAgICAgIHRleHR1cmVzPzogeyBbc2VtYW50aWM6IHN0cmluZ106IHsgaW5kZXg/OiBudW1iZXIgfSB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIHwgdW5kZWZpbmVkXG4gICAgKT8uUkhPRE9OSVRFX3JheW1hcmNoaW5nX21hdGVyaWFscztcbiAgICByZXR1cm4gdGhpcy5fX2dldFZhbGlkUmF5bWFyY2hpbmdUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsLCBleHRlbnNpb24/LnRleHR1cmVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIHBlci1jb21wb25lbnQgdGV4dHVyZSBhc3NpZ25tZW50cyBzdG9yZWQgaW4gdGhlIGBSSE9ET05JVEVfcmF5bWFyY2hpbmdgIG5vZGVcbiAgICogZXh0ZW5zaW9ucy5cbiAgICpcbiAgICogRWFjaCBhc3NpZ25tZW50IGtlZXBzIHRoZSBnbFRGIG5vZGUgaW5kZXgsIHdoaWNoIHRoZSBpbXBvcnRlciBhbHNvIHN0b3JlcyBvbiB0aGUgZW50aXR5XG4gICAqIChgVGFnR2x0ZjJOb2RlSW5kZXhgKSwgc28gYW4gYXBwbGljYXRpb24gY2FuIGFwcGx5IHRoZSB0ZXh0dXJlcyB0byB0aGUgbWF0ZXJpYWwgaXQgcmVidWlsZHNcbiAgICogZm9yIHRoYXQgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGltcG9ydGVkIGdsVEYgbW9kZWxcbiAgICogQHJldHVybnMgT25lIGVudHJ5IHBlciB2YWxpZCBhc3NpZ25tZW50LCBpbiBub2RlIGFuZCBleHRlbnNpb24gb3JkZXJcbiAgICovXG4gIHN0YXRpYyBnZXRSYXltYXJjaGluZ0NvbXBvbmVudFRleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWw6IFJuTTIpOiB7XG4gICAgbm9kZUluZGV4OiBudW1iZXI7XG4gICAgc2VtYW50aWM6IHN0cmluZztcbiAgICB0ZXh0dXJlSW5kZXg6IG51bWJlcjtcbiAgICBzYW1wbGVySW5kZXg/OiBudW1iZXI7XG4gIH1bXSB7XG4gICAgY29uc3QgcmVzdWx0OiB7IG5vZGVJbmRleDogbnVtYmVyOyBzZW1hbnRpYzogc3RyaW5nOyB0ZXh0dXJlSW5kZXg6IG51bWJlcjsgc2FtcGxlckluZGV4PzogbnVtYmVyIH1bXSA9IFtdO1xuICAgIGNvbnN0IG5vZGVzID0gZ2x0Zk1vZGVsLm5vZGVzID8/IFtdO1xuICAgIGZvciAobGV0IG5vZGVJbmRleCA9IDA7IG5vZGVJbmRleCA8IG5vZGVzLmxlbmd0aDsgbm9kZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IChcbiAgICAgICAgbm9kZXNbbm9kZUluZGV4XS5leHRlbnNpb25zIGFzXG4gICAgICAgICAgfCB7XG4gICAgICAgICAgICAgIFJIT0RPTklURV9yYXltYXJjaGluZz86IHtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlcz86IHsgW3NlbWFudGljOiBzdHJpbmddOiB7IGluZGV4PzogbnVtYmVyIH0gfTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB8IHVuZGVmaW5lZFxuICAgICAgKT8uUkhPRE9OSVRFX3JheW1hcmNoaW5nO1xuICAgICAgZm9yIChjb25zdCBhc3NpZ25tZW50IG9mIHRoaXMuX19nZXRWYWxpZFJheW1hcmNoaW5nVGV4dHVyZUFzc2lnbm1lbnRzKGdsdGZNb2RlbCwgZXh0ZW5zaW9uPy50ZXh0dXJlcykpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goeyBub2RlSW5kZXgsIC4uLmFzc2lnbm1lbnQgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyBhIHNlbWFudGljIHRvIHRleHR1cmUtaW5kZXggbWFwIGRvd24gdG8gYXNzaWdubWVudHMgd2hvc2UgdGV4dHVyZSBhbmQgaW1hZ2UgZXhpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gdGV4dHVyZXMgLSBUaGUgZXh0ZW5zaW9uJ3MgdGV4dHVyZSBtYXBcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0VmFsaWRSYXltYXJjaGluZ1RleHR1cmVBc3NpZ25tZW50cyhcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgdGV4dHVyZXM6IHsgW3NlbWFudGljOiBzdHJpbmddOiB7IGluZGV4PzogbnVtYmVyIH0gfSB8IHVuZGVmaW5lZFxuICApOiB7IHNlbWFudGljOiBzdHJpbmc7IHRleHR1cmVJbmRleDogbnVtYmVyOyBzYW1wbGVySW5kZXg/OiBudW1iZXIgfVtdIHtcbiAgICBpZiAodGV4dHVyZXMgPT0gbnVsbCB8fCB0eXBlb2YgdGV4dHVyZXMgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGFzc2lnbm1lbnRzOiB7IHNlbWFudGljOiBzdHJpbmc7IHRleHR1cmVJbmRleDogbnVtYmVyOyBzYW1wbGVySW5kZXg/OiBudW1iZXIgfVtdID0gW107XG4gICAgZm9yIChjb25zdCBzZW1hbnRpYyBvZiBPYmplY3Qua2V5cyh0ZXh0dXJlcykpIHtcbiAgICAgIGNvbnN0IHRleHR1cmVJbmRleCA9IHRleHR1cmVzW3NlbWFudGljXT8uaW5kZXg7XG4gICAgICBpZiAodGV4dHVyZUluZGV4ID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBnbHRmVGV4dHVyZSA9IGdsdGZNb2RlbC50ZXh0dXJlcz8uW3RleHR1cmVJbmRleF07XG4gICAgICBjb25zdCBpbWFnZSA9IGdsdGZUZXh0dXJlPy5zb3VyY2UgIT0gbnVsbCA/IGdsdGZNb2RlbC5pbWFnZXM/LltnbHRmVGV4dHVyZS5zb3VyY2VdIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKGdsdGZUZXh0dXJlID09IG51bGwgfHwgaW1hZ2UgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGFzc2lnbm1lbnRzLnB1c2goe1xuICAgICAgICBzZW1hbnRpYyxcbiAgICAgICAgdGV4dHVyZUluZGV4LFxuICAgICAgICBzYW1wbGVySW5kZXg6IGdsdGZUZXh0dXJlLnNhbXBsZXIsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFzc2lnbm1lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgUmhvZG9uaXRlIHRleHR1cmVzIGFuZCBzYW1wbGVycyBmb3IgdGhlIHNoYXJlZCByYXltYXJjaGluZyBtYXRlcmlhbCdzIHRleHR1cmVcbiAgICogYXNzaWdubWVudHMgc2F2ZWQgaW4gdGhlIFJIT0RPTklURV9yYXltYXJjaGluZ19tYXRlcmlhbHMgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBBcHBseSB0aGUgcmV0dXJuZWQgdGV4dHVyZXMgdG8gdGhlIHJlYnVpbHQgbWF0ZXJpYWwgd2l0aFxuICAgKiBNYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKHNlbWFudGljLCB0ZXh0dXJlLCBzYW1wbGVyKS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIHRleHR1cmVzIGFuZCBzYW1wbGVycyBrZXllZCBieSBzaGFkZXIgc2VtYW50aWNcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVSYXltYXJjaGluZ01hdGVyaWFsVGV4dHVyZXMoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yXG4gICk6IFByb21pc2U8TWFwPHN0cmluZywgeyB0ZXh0dXJlOiBUZXh0dXJlOyBzYW1wbGVyPzogU2FtcGxlciB9Pj4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBNYXA8c3RyaW5nLCB7IHRleHR1cmU6IFRleHR1cmU7IHNhbXBsZXI/OiBTYW1wbGVyIH0+KCk7XG4gICAgY29uc3QgYXNzaWdubWVudHMgPSB0aGlzLmdldFJheW1hcmNoaW5nTWF0ZXJpYWxUZXh0dXJlQXNzaWdubWVudHMoZ2x0Zk1vZGVsKTtcbiAgICBmb3IgKGNvbnN0IHsgc2VtYW50aWMsIHRleHR1cmVJbmRleCwgc2FtcGxlckluZGV4IH0gb2YgYXNzaWdubWVudHMpIHtcbiAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0aGlzLl9fY3JlYXRlUmF5bWFyY2hpbmdUZXh0dXJlKGVuZ2luZSwgZ2x0Zk1vZGVsLCB0ZXh0dXJlSW5kZXgsIHNhbXBsZXJJbmRleCk7XG4gICAgICBpZiAoY3JlYXRlZCAhPSBudWxsKSB7XG4gICAgICAgIHJlc3VsdC5zZXQoc2VtYW50aWMsIGNyZWF0ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgUmhvZG9uaXRlIHRleHR1cmVzIGFuZCBzYW1wbGVycyBmb3IgdGhlIHBlci1jb21wb25lbnQgYXNzaWdubWVudHMgc2F2ZWQgaW4gZWFjaFxuICAgKiBgUkhPRE9OSVRFX3JheW1hcmNoaW5nYCBub2RlIGV4dGVuc2lvbi5cbiAgICpcbiAgICogVGhlIHJldHVybmVkIG1hcCBpcyBrZXllZCBieSBnbFRGIG5vZGUgaW5kZXggKHRoZSBlbnRpdHkncyBgVGFnR2x0ZjJOb2RlSW5kZXhgKSwgdGhlbiBieVxuICAgKiBzaGFkZXIgc2VtYW50aWMuIEFwcGx5IHRoZW0gdG8gdGhlIG1hdGVyaWFsIHJlYnVpbHQgZm9yIHRoYXQgY29tcG9uZW50IHdpdGhcbiAgICogTWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcihzZW1hbnRpYywgdGV4dHVyZSwgc2FtcGxlcikuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgaW1wb3J0ZWQgZ2xURiBtb2RlbFxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCB0ZXh0dXJlcyBhbmQgc2FtcGxlcnMga2V5ZWQgYnkgbm9kZSBpbmRleCBhbmQgc2hhZGVyIHNlbWFudGljXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgY3JlYXRlUmF5bWFyY2hpbmdDb21wb25lbnRUZXh0dXJlcyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBnbHRmTW9kZWw6IFJuTTJcbiAgKTogUHJvbWlzZTxNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCB7IHRleHR1cmU6IFRleHR1cmU7IHNhbXBsZXI/OiBTYW1wbGVyIH0+Pj4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBNYXA8bnVtYmVyLCBNYXA8c3RyaW5nLCB7IHRleHR1cmU6IFRleHR1cmU7IHNhbXBsZXI/OiBTYW1wbGVyIH0+PigpO1xuICAgIGNvbnN0IGFzc2lnbm1lbnRzID0gdGhpcy5nZXRSYXltYXJjaGluZ0NvbXBvbmVudFRleHR1cmVBc3NpZ25tZW50cyhnbHRmTW9kZWwpO1xuICAgIGZvciAoY29uc3QgeyBub2RlSW5kZXgsIHNlbWFudGljLCB0ZXh0dXJlSW5kZXgsIHNhbXBsZXJJbmRleCB9IG9mIGFzc2lnbm1lbnRzKSB7XG4gICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5fX2NyZWF0ZVJheW1hcmNoaW5nVGV4dHVyZShlbmdpbmUsIGdsdGZNb2RlbCwgdGV4dHVyZUluZGV4LCBzYW1wbGVySW5kZXgpO1xuICAgICAgaWYgKGNyZWF0ZWQgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBub2RlVGV4dHVyZXMgPSByZXN1bHQuZ2V0KG5vZGVJbmRleCk7XG4gICAgICBpZiAobm9kZVRleHR1cmVzID09IG51bGwpIHtcbiAgICAgICAgbm9kZVRleHR1cmVzID0gbmV3IE1hcCgpO1xuICAgICAgICByZXN1bHQuc2V0KG5vZGVJbmRleCwgbm9kZVRleHR1cmVzKTtcbiAgICAgIH1cbiAgICAgIG5vZGVUZXh0dXJlcy5zZXQoc2VtYW50aWMsIGNyZWF0ZWQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgb25lIFJob2Rvbml0ZSB0ZXh0dXJlIChhbmQgc2FtcGxlcikgZnJvbSBhIGdsVEYgdGV4dHVyZSBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBpbXBvcnRlZCBnbFRGIG1vZGVsXG4gICAqIEBwYXJhbSB0ZXh0dXJlSW5kZXggLSBUaGUgZ2xURiB0ZXh0dXJlIGluZGV4XG4gICAqIEBwYXJhbSBzYW1wbGVySW5kZXggLSBUaGUgZ2xURiBzYW1wbGVyIGluZGV4IG9mIHRoZSB0ZXh0dXJlXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIHRleHR1cmUgYW5kIHNhbXBsZXIsIG9yIG51bGwgd2hlbiBjcmVhdGlvbiBmYWlsc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgX19jcmVhdGVSYXltYXJjaGluZ1RleHR1cmUoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHRleHR1cmVJbmRleDogbnVtYmVyLFxuICAgIHNhbXBsZXJJbmRleD86IG51bWJlclxuICApOiBQcm9taXNlPHsgdGV4dHVyZTogVGV4dHVyZTsgc2FtcGxlcj86IFNhbXBsZXIgfSB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZ2x0ZlRleHR1cmUgPSBnbHRmTW9kZWwudGV4dHVyZXMhW3RleHR1cmVJbmRleF07XG4gICAgICBjb25zdCBpbWFnZSA9IGdsdGZNb2RlbC5pbWFnZXMhW2dsdGZUZXh0dXJlLnNvdXJjZSFdO1xuICAgICAgY29uc3QgdGV4dHVyZSA9IGF3YWl0IHRoaXMuX2NyZWF0ZVRleHR1cmUoZW5naW5lLCBpbWFnZSwgZ2x0Zk1vZGVsKTtcbiAgICAgIGxldCBzYW1wbGVyOiBTYW1wbGVyIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKHNhbXBsZXJJbmRleCAhPSBudWxsICYmIGdsdGZNb2RlbC5zYW1wbGVycz8uW3NhbXBsZXJJbmRleF0gIT0gbnVsbCkge1xuICAgICAgICBzYW1wbGVyID0gdGhpcy5fY3JlYXRlU2FtcGxlcihlbmdpbmUsIGdsdGZNb2RlbC5zYW1wbGVyc1tzYW1wbGVySW5kZXhdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHRleHR1cmUsIHNhbXBsZXIgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihcbiAgICAgICAgYEZhaWxlZCB0byBjcmVhdGUgdGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsIHRleHR1cmUgZm9yIHRleHR1cmUgJHt0ZXh0dXJlSW5kZXh9OiAke1N0cmluZyhlcnJvcil9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbmVlZFJlc2l6ZVRvUG93ZXJPZlR3b09uV2ViR2wxKHRleHR1cmVPcHRpb246IGFueSkge1xuICAgIGlmIChcbiAgICAgIHRleHR1cmVPcHRpb24ud3JhcFMgIT09IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UgfHxcbiAgICAgIHRleHR1cmVPcHRpb24ud3JhcFQgIT09IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UgfHxcbiAgICAgICh0ZXh0dXJlT3B0aW9uLm1pbkZpbHRlciAhPT0gVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIgJiYgdGV4dHVyZU9wdGlvbi5taW5GaWx0ZXIgIT09IFRleHR1cmVQYXJhbWV0ZXIuTmVhcmVzdClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2l6ZUlzUG93ZXJPZlR3byhpbWFnZTogSFRNTEltYWdlRWxlbWVudCkge1xuICAgIGNvbnN0IHdpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuXG4gICAgaWYgKCh3aWR0aCAmICh3aWR0aCAtIDEpKSA9PT0gMCAmJiAoaGVpZ2h0ICYgKGhlaWdodCAtIDEpKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fbmVlZFBhcmFtZXRlckluaXRpYWxpemF0aW9uKG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLCBfbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKG1hdGVyaWFsSnNvbiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9jaGVja1JuR2x0ZkxvYWRlck9wdGlvbnNFeGlzdChnbHRmTW9kZWw6IFJuTTIpIHtcbiAgICBpZiAoZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZXdyYXBXaXRoVHlwZWRBcnJheSh0eXBlZEFycmF5Q2xhc3M6IGFueSwgdWludDhBcnJheTogVWludDhBcnJheSwgYnl0ZU9mZnNldDogQnl0ZSwgbGVuZ3RoOiBTaXplKSB7XG4gICAgcmV0dXJuIG5ldyB0eXBlZEFycmF5Q2xhc3ModWludDhBcnJheS5idWZmZXIgYXMgQXJyYXlCdWZmZXIsIGJ5dGVPZmZzZXQgKyB1aW50OEFycmF5LmJ5dGVPZmZzZXQsIGxlbmd0aCk7XG4gIH1cblxuICBzdGF0aWMgX2NoZWNrQnl0ZXNQZXJDb21wb25lbnQoYWNjZXNzb3I6IFJuTTJBY2Nlc3NvciB8IFJuTTJTcGFyc2VJbmRpY2VzKSB7XG4gICAgbGV0IGJ5dGVzUGVyQ29tcG9uZW50ID0gMDtcbiAgICBzd2l0Y2ggKGFjY2Vzc29yLmNvbXBvbmVudFR5cGUpIHtcbiAgICAgIGNhc2UgNTEyMDogLy8gZ2wuQllURVxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTIxOiAvLyBnbC5VTlNJR05FRF9CWVRFXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjI6IC8vIGdsLlNIT1JUXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjM6IC8vIGdsLlVOU0lHTkVEX1NIT1JUXG4gICAgICAgIGJ5dGVzUGVyQ29tcG9uZW50ID0gMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjQ6IC8vIGdsLklOVFxuICAgICAgICBieXRlc1BlckNvbXBvbmVudCA9IDQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI1OiAvLyBnbC5VTlNJR05FRF9JTlRcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSA0O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyNjogLy8gZ2wuRkxPQVRcbiAgICAgICAgYnl0ZXNQZXJDb21wb25lbnQgPSA0O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gYnl0ZXNQZXJDb21wb25lbnQ7XG4gIH1cblxuICBzdGF0aWMgX2NoZWNrQ29tcG9uZW50TnVtYmVyKGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IpIHtcbiAgICBsZXQgY29tcG9uZW50TiA9IDA7XG4gICAgc3dpdGNoIChhY2Nlc3Nvci50eXBlKSB7XG4gICAgICBjYXNlICdTQ0FMQVInOlxuICAgICAgICBjb21wb25lbnROID0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdWRUMyJzpcbiAgICAgICAgY29tcG9uZW50TiA9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnVkVDMyc6XG4gICAgICAgIGNvbXBvbmVudE4gPSAzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1ZFQzQnOlxuICAgICAgICBjb21wb25lbnROID0gNDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNQVQ0JzpcbiAgICAgICAgY29tcG9uZW50TiA9IDE2O1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gY29tcG9uZW50TjtcbiAgfVxuXG4gIHN0YXRpYyBfY2hlY2tEYXRhVmlld01ldGhvZChhY2Nlc3NvcjogUm5NMkFjY2Vzc29yIHwgUm5NMlNwYXJzZUluZGljZXMpIHtcbiAgICBsZXQgZGF0YVZpZXdNZXRob2QgPSAnJztcbiAgICBzd2l0Y2ggKGFjY2Vzc29yLmNvbXBvbmVudFR5cGUpIHtcbiAgICAgIGNhc2UgNTEyMDogLy8gZ2wuQllURVxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRJbnQ4JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjE6IC8vIGdsLlVOU0lHTkVEX0JZVEVcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0VWludDgnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMjogLy8gZ2wuU0hPUlRcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0SW50MTYnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTEyMzogLy8gZ2wuVU5TSUdORURfU0hPUlRcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0VWludDE2JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjQ6IC8vIGdsLklOVFxuICAgICAgICBkYXRhVmlld01ldGhvZCA9ICdnZXRJbnQzMic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1MTI1OiAvLyBnbC5VTlNJR05FRF9JTlRcbiAgICAgICAgZGF0YVZpZXdNZXRob2QgPSAnZ2V0VWludDMyJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDUxMjY6IC8vIGdsLkZMT0FUXG4gICAgICAgIGRhdGFWaWV3TWV0aG9kID0gJ2dldEZsb2F0MzInO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YVZpZXdNZXRob2Q7XG4gIH1cblxuICBzdGF0aWMgX2lzU3lzdGVtTGl0dGxlRW5kaWFuKCkge1xuICAgIHJldHVybiAhIW5ldyBVaW50OEFycmF5KG5ldyBVaW50MTZBcnJheShbMHgwMGZmXSkuYnVmZmVyKVswXTtcbiAgfVxuXG4gIHN0YXRpYyBfcmVhZEJpbmFyeUZyb21BY2Nlc3NvckFuZFNldEl0VG9BY2Nlc3NvckV4dHJhcyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBhY2Nlc3NvcjogUm5NMkFjY2Vzc29yLFxuICAgIHJuQnVmZmVycz86IEJ1ZmZlcltdXG4gICk6IEZsb2F0MzJBcnJheSB7XG4gICAgY29uc3QgYnVmZmVyVmlldyA9IGFjY2Vzc29yLmJ1ZmZlclZpZXdPYmplY3QhO1xuICAgIGxldCBieXRlT2Zmc2V0RnJvbUJ1ZmZlcjogbnVtYmVyID0gKGJ1ZmZlclZpZXcuYnl0ZU9mZnNldCA/PyAwKSArIChhY2Nlc3Nvci5ieXRlT2Zmc2V0ID8/IDApO1xuICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlclZpZXcuYnVmZmVyT2JqZWN0ITtcbiAgICBsZXQgdWludDhBcnJheTogVWludDhBcnJheSA9IGJ1ZmZlci5idWZmZXIhO1xuXG4gICAgY29uc3QgY29tcG9uZW50TiA9IHRoaXMuX2NoZWNrQ29tcG9uZW50TnVtYmVyKGFjY2Vzc29yKTtcbiAgICBjb25zdCBjb21wb25lbnRCeXRlcyA9IHRoaXMuX2NoZWNrQnl0ZXNQZXJDb21wb25lbnQoYWNjZXNzb3IpO1xuICAgIGNvbnN0IGRhdGFWaWV3TWV0aG9kID0gdGhpcy5fY2hlY2tEYXRhVmlld01ldGhvZChhY2Nlc3Nvcik7XG4gICAgaWYgKElzLm5vdC5leGlzdChhY2Nlc3Nvci5leHRyYXMpKSB7XG4gICAgICBhY2Nlc3Nvci5leHRyYXMgPSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5OiBuZXcgRmxvYXQzMkFycmF5KCksXG4gICAgICAgIGNvbXBvbmVudE46IDAsXG4gICAgICAgIGNvbXBvbmVudEJ5dGVzOiA0LFxuICAgICAgICBkYXRhVmlld01ldGhvZDogJycsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIGZvciB3ZWlnaHRzIGFuaW1hdGlvbiBhY2Nlc3Nvciwgc2V0IGNvbXBvbmVudE4gYXMgd2VpZ2h0c0FycmF5TGVuZ3RoXG4gICAgYWNjZXNzb3IuZXh0cmFzLmNvbXBvbmVudE4gPSBJcy5leGlzdChhY2Nlc3Nvci5leHRyYXM/LndlaWdodHNBcnJheUxlbmd0aClcbiAgICAgID8gYWNjZXNzb3IuZXh0cmFzIS53ZWlnaHRzQXJyYXlMZW5ndGhcbiAgICAgIDogY29tcG9uZW50TjtcbiAgICBhY2Nlc3Nvci5leHRyYXMuY29tcG9uZW50Qnl0ZXMgPSBjb21wb25lbnRCeXRlcztcbiAgICBhY2Nlc3Nvci5leHRyYXMuZGF0YVZpZXdNZXRob2QgPSBkYXRhVmlld01ldGhvZDtcblxuICAgIGNvbnN0IGJ5dGVMZW5ndGggPSBjb21wb25lbnRCeXRlcyAqIGNvbXBvbmVudE4gKiBhY2Nlc3Nvci5jb3VudDtcblxuICAgIGlmIChJcy5leGlzdChybkJ1ZmZlcnMpKSB7XG4gICAgICBjb25zdCBybkJ1ZmZlciA9IHJuQnVmZmVyc1thY2Nlc3Nvci5idWZmZXJWaWV3T2JqZWN0IS5idWZmZXIhXTtcbiAgICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHRoaXMuX19nZXRSbkJ1ZmZlclZpZXcoYnVmZmVyVmlldywgcm5CdWZmZXIpO1xuICAgICAgY29uc3Qgcm5BY2Nlc3NvciA9IHRoaXMuX19nZXRSbkFjY2Vzc29yKGVuZ2luZSwgYWNjZXNzb3IsIHJuQnVmZmVyVmlldyk7XG4gICAgICB1aW50OEFycmF5ID0gcm5BY2Nlc3Nvci5nZXRVaW50OEFycmF5KCk7XG4gICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlciA9IDA7XG4gICAgfVxuXG4gICAgbGV0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoKSBhcyBGbG9hdDMyQXJyYXk7XG4gICAgY29uc3QgbnVtYmVyQXJyYXk6IG51bWJlcltdID0gW107XG5cbiAgICBpZiAoTW9kZWxDb252ZXJ0ZXIuX2lzU3lzdGVtTGl0dGxlRW5kaWFuKCkpIHtcbiAgICAgIC8vIElmIHRoaXMgcGxhdGZvcm0gaXMgTGl0dGxlIEVuZGlhbiBTeXN0ZW0sXG4gICAgICAvLyAgIHRoZSB1aW50OGFycmF5IGNhblxuICAgICAgbGV0IHR5cGVkRGF0YUFycmF5OiBUeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpO1xuICAgICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0RmxvYXQzMicpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSB0aGlzLl9fcmV3cmFwV2l0aFR5cGVkQXJyYXkoXG4gICAgICAgICAgRmxvYXQzMkFycmF5LFxuICAgICAgICAgIHVpbnQ4QXJyYXksXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50OCcpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSBuZXcgSW50OEFycmF5KFxuICAgICAgICAgIHVpbnQ4QXJyYXkgYXMgdW5rbm93biBhcyBBcnJheUJ1ZmZlcixcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50OCcpIHtcbiAgICAgICAgdHlwZWREYXRhQXJyYXkgPSBuZXcgVWludDhBcnJheShcbiAgICAgICAgICB1aW50OEFycmF5IGFzIHVua25vd24gYXMgQXJyYXlCdWZmZXIsXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50MTYnKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gdGhpcy5fX3Jld3JhcFdpdGhUeXBlZEFycmF5KFxuICAgICAgICAgIEludDE2QXJyYXksXG4gICAgICAgICAgdWludDhBcnJheSxcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50MTYnKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gdGhpcy5fX3Jld3JhcFdpdGhUeXBlZEFycmF5KFxuICAgICAgICAgIFVpbnQxNkFycmF5LFxuICAgICAgICAgIHVpbnQ4QXJyYXksXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50MzInKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gdGhpcy5fX3Jld3JhcFdpdGhUeXBlZEFycmF5KFxuICAgICAgICAgIEludDMyQXJyYXksXG4gICAgICAgICAgdWludDhBcnJheSxcbiAgICAgICAgICBieXRlT2Zmc2V0RnJvbUJ1ZmZlcixcbiAgICAgICAgICBieXRlTGVuZ3RoIC8gY29tcG9uZW50Qnl0ZXNcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRVaW50MzInKSB7XG4gICAgICAgIHR5cGVkRGF0YUFycmF5ID0gdGhpcy5fX3Jld3JhcFdpdGhUeXBlZEFycmF5KFxuICAgICAgICAgIFVpbnQzMkFycmF5LFxuICAgICAgICAgIHVpbnQ4QXJyYXksXG4gICAgICAgICAgYnl0ZU9mZnNldEZyb21CdWZmZXIsXG4gICAgICAgICAgYnl0ZUxlbmd0aCAvIGNvbXBvbmVudEJ5dGVzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBmbG9hdDMyQXJyYXkgPSB0aGlzLl9fbm9ybWFsaXplVHlwZWRBcnJheVRvRmxvYXQzMkFycmF5KGRhdGFWaWV3TWV0aG9kLCB0eXBlZERhdGFBcnJheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZvciBCaWdFbmRpYW4gcHJvY2Vzc1xuICAgICAgY29uc3QgZGF0YVZpZXc6IGFueSA9IG5ldyBEYXRhVmlldyh1aW50OEFycmF5LmJ1ZmZlciwgYnl0ZU9mZnNldEZyb21CdWZmZXIgKyB1aW50OEFycmF5LmJ5dGVPZmZzZXQsIGJ5dGVMZW5ndGgpO1xuICAgICAgY29uc3QgYnl0ZURlbHRhID0gY29tcG9uZW50Qnl0ZXMgKiBjb21wb25lbnROO1xuICAgICAgY29uc3QgbGl0dGxlRW5kaWFuID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGJ5dGVMZW5ndGg7IHBvcyArPSBieXRlRGVsdGEpIHtcbiAgICAgICAgc3dpdGNoIChhY2Nlc3Nvci50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnU0NBTEFSJzpcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcywgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdWRUMyJzpcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcywgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MgKyBjb21wb25lbnRCeXRlcywgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdWRUMzJzpcbiAgICAgICAgICAgIG51bWJlckFycmF5LnB1c2goZGF0YVZpZXdbZGF0YVZpZXdNZXRob2RdKHBvcywgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MgKyBjb21wb25lbnRCeXRlcywgbGl0dGxlRW5kaWFuKSk7XG4gICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MgKyBjb21wb25lbnRCeXRlcyAqIDIsIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnVkVDNCc6XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICBudW1iZXJBcnJheS5wdXNoKGRhdGFWaWV3W2RhdGFWaWV3TWV0aG9kXShwb3MgKyBjb21wb25lbnRCeXRlcyAqIGksIGxpdHRsZUVuZGlhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnTUFUNCc6XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgICAgbnVtYmVyQXJyYXkucHVzaChkYXRhVmlld1tkYXRhVmlld01ldGhvZF0ocG9zICsgY29tcG9uZW50Qnl0ZXMgKiBpLCBsaXR0bGVFbmRpYW4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmbG9hdDMyQXJyYXkgPSB0aGlzLl9fbm9ybWFsaXplVHlwZWRBcnJheVRvRmxvYXQzMkFycmF5KGRhdGFWaWV3TWV0aG9kLCBudW1iZXJBcnJheSk7XG4gICAgfVxuXG4gICAgYWNjZXNzb3IuZXh0cmFzIS50eXBlZERhdGFBcnJheSA9IGZsb2F0MzJBcnJheTtcblxuICAgIHJldHVybiBmbG9hdDMyQXJyYXk7XG4gIH1cblxuICAvKipcbiAgICogbm9ybWFsaXplIHZhbHVlcyBvZiBUeXBlZEFycmF5IHRvIEZsb2F0MzJBcnJheVxuICAgKiBTZWU6IHRoZSBsYXN0IHBhcnQgb2YgMy4xMS5BbmltYXRpb24gYXQgaHR0cHM6Ly93d3cua2hyb25vcy5vcmcvcmVnaXN0cnkvZ2xURi9zcGVjcy8yLjAvZ2xURi0yLjAuaHRtbCNhbmltYXRpb25zXG4gICAqIEBwYXJhbSBkYXRhVmlld01ldGhvZFxuICAgKiBAcGFyYW0gbnVtYmVyQXJyYXlcbiAgICogQHJldHVybnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fbm9ybWFsaXplVHlwZWRBcnJheVRvRmxvYXQzMkFycmF5KFxuICAgIGRhdGFWaWV3TWV0aG9kOiBzdHJpbmcsXG4gICAgbnVtYmVyQXJyYXk6IG51bWJlcltdIHwgVHlwZWRBcnJheVxuICApOiBGbG9hdDMyQXJyYXkge1xuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldEludDgnKSB7XG4gICAgICByZXR1cm4gRGF0YVV0aWwubm9ybWFsaXplZEludDhBcnJheVRvRmxvYXQzMkFycmF5KG51bWJlckFycmF5IGFzIHVua25vd24gYXMgSW50OEFycmF5KTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDgnKSB7XG4gICAgICByZXR1cm4gRGF0YVV0aWwubm9ybWFsaXplZFVpbnQ4QXJyYXlUb0Zsb2F0MzJBcnJheShudW1iZXJBcnJheSBhcyB1bmtub3duIGFzIFVpbnQ4QXJyYXkpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRJbnQxNicpIHtcbiAgICAgIHJldHVybiBEYXRhVXRpbC5ub3JtYWxpemVkSW50MTZBcnJheVRvRmxvYXQzMkFycmF5KG51bWJlckFycmF5IGFzIHVua25vd24gYXMgSW50MTZBcnJheSk7XG4gICAgfVxuICAgIGlmIChkYXRhVmlld01ldGhvZCA9PT0gJ2dldFVpbnQxNicpIHtcbiAgICAgIHJldHVybiBEYXRhVXRpbC5ub3JtYWxpemVkVWludDE2QXJyYXlUb0Zsb2F0MzJBcnJheShudW1iZXJBcnJheSBhcyB1bmtub3duIGFzIFVpbnQxNkFycmF5KTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0SW50MzInKSB7XG4gICAgICAvLyB0eXBlZERhdGFBcnJheSA9IG5ldyBJbnQzMkFycmF5KG51bWJlckFycmF5KTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb3QgY29uc2lkZXJlZCcpO1xuICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoKTtcbiAgICB9XG4gICAgaWYgKGRhdGFWaWV3TWV0aG9kID09PSAnZ2V0VWludDMyJykge1xuICAgICAgLy8gdHlwZWREYXRhQXJyYXkgPSBuZXcgVWludDMyQXJyYXkobnVtYmVyQXJyYXkpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ05vdCBjb25zaWRlcmVkJyk7XG4gICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSgpO1xuICAgIH1cbiAgICBpZiAoZGF0YVZpZXdNZXRob2QgPT09ICdnZXRGbG9hdDMyJykge1xuICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkobnVtYmVyQXJyYXkpO1xuICAgIH1cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignTm90IGNvbnNpZGVyZWQnKTtcbiAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19hZGRPZmZzZXRUb0luZGljZXMobWVzaENvbXBvbmVudDogTWVzaENvbXBvbmVudCkge1xuICAgIGNvbnN0IHByaW1pdGl2ZU51bWJlciA9IG1lc2hDb21wb25lbnQubWVzaCEuZ2V0UHJpbWl0aXZlTnVtYmVyKCk7XG4gICAgbGV0IG9mZnNldFN1bSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmltaXRpdmVOdW1iZXI7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gbWVzaENvbXBvbmVudC5tZXNoIS5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgIGNvbnN0IGluZGljZXNBY2Nlc3NvciA9IHByaW1pdGl2ZS5pbmRpY2VzQWNjZXNzb3I7XG4gICAgICBpZiAoaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnROdW1iZXIgPSBpbmRpY2VzQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZW1lbnROdW1iZXI7IGorKykge1xuICAgICAgICAgIGNvbnN0IGluZGV4ID0gaW5kaWNlc0FjY2Vzc29yLmdldFNjYWxhcihqLCB7fSk7XG4gICAgICAgICAgaW5kaWNlc0FjY2Vzc29yLnNldFNjYWxhcihqLCBpbmRleCArIG9mZnNldFN1bSwge30pO1xuICAgICAgICB9XG4gICAgICAgIG9mZnNldFN1bSArPSBlbGVtZW50TnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlIGEgUm4uQWNjZXNzb3IgZnJvbSB0aGUgUm4uQnVmZmVyXG4gICAqICBmcm9tIHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgR2x0ZjJCdWZmZXIsIEdsdGYyQnVmZmVyVmlldywgYW5kIEdsdGYyQWNjZXNzb3IuXG4gICAqIEBwYXJhbSBhY2Nlc3NvclxuICAgKiBAcGFyYW0gcm5CdWZmZXJcbiAgICogQHJldHVybnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0Um5BY2Nlc3NvcihlbmdpbmU6IEVuZ2luZSwgYWNjZXNzb3I6IFJuTTJBY2Nlc3Nvciwgcm5CdWZmZXJWaWV3PzogQnVmZmVyVmlldykge1xuICAgIGxldCBybkFjY2Vzc29yOiBBY2Nlc3NvcjtcbiAgICBpZiAocm5CdWZmZXJWaWV3ICE9IG51bGwpIHtcbiAgICAgIHJuQWNjZXNzb3IgPSBybkJ1ZmZlclZpZXdcbiAgICAgICAgLnRha2VBY2Nlc3NvcldpdGhCeXRlT2Zmc2V0KHtcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5mcm9tU3RyaW5nKGFjY2Vzc29yLnR5cGUpLFxuICAgICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuZnJvbShhY2Nlc3Nvci5jb21wb25lbnRUeXBlKSxcbiAgICAgICAgICBjb3VudDogYWNjZXNzb3IuY291bnQsXG4gICAgICAgICAgYnl0ZU9mZnNldEluQnVmZmVyVmlldzogYWNjZXNzb3IuYnl0ZU9mZnNldCA/PyAwLFxuICAgICAgICAgIGJ5dGVTdHJpZGU6IGFjY2Vzc29yLmJ5dGVTdHJpZGUsXG4gICAgICAgICAgbWF4OiBhY2Nlc3Nvci5tYXgsXG4gICAgICAgICAgbWluOiBhY2Nlc3Nvci5taW4sXG4gICAgICAgICAgbm9ybWFsaXplZDogYWNjZXNzb3Iubm9ybWFsaXplZCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIGFjY2Vzc29yLmJ1ZmZlclZpZXcgaXMgbm90IGRlZmluZWQsIHRoZSBhY2Nlc3NvciBNVVNUIGJlIGluaXRpYWxpemVkIHdpdGggemVyb3MuXG4gICAgICAvLyBTZWU6IGh0dHBzOi8vcmVnaXN0cnkua2hyb25vcy5vcmcvZ2xURi9zcGVjcy8yLjAvZ2xURi0yLjAuaHRtbCNfYWNjZXNzb3JfYnVmZmVydmlld1xuICAgICAgY29uc3QgY29tcG9zaXRpb25UeXBlID0gQ29tcG9zaXRpb25UeXBlLmZyb21TdHJpbmcoYWNjZXNzb3IudHlwZSk7XG4gICAgICBjb25zdCBjb21wb25lbnRUeXBlID0gQ29tcG9uZW50VHlwZS5mcm9tKGFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuICAgICAgY29uc3QgYnl0ZUxlbmd0aFRvTmVlZCA9XG4gICAgICAgIGFjY2Vzc29yLmNvdW50ICogY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpO1xuICAgICAgY29uc3Qgcm5CdWZmZXIgPSBlbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChCdWZmZXJVc2UuQ1BVR2VuZXJpYywgYnl0ZUxlbmd0aFRvTmVlZCwgNCk7XG4gICAgICBjb25zdCBybkJ1ZmZlclZpZXcgPSBybkJ1ZmZlclxuICAgICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVMZW5ndGhUb05lZWQsXG4gICAgICAgICAgYnl0ZVN0cmlkZTogY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpICogY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpLFxuICAgICAgICB9KVxuICAgICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgICAgcm5BY2Nlc3NvciA9IHJuQnVmZmVyVmlld1xuICAgICAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IGNvbXBvc2l0aW9uVHlwZSxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgICAgIGNvdW50OiBhY2Nlc3Nvci5jb3VudCxcbiAgICAgICAgICBtYXg6IGFjY2Vzc29yLm1heCxcbiAgICAgICAgICBtaW46IGFjY2Vzc29yLm1pbixcbiAgICAgICAgICBub3JtYWxpemVkOiBhY2Nlc3Nvci5ub3JtYWxpemVkLFxuICAgICAgICB9KVxuICAgICAgICAudW53cmFwRm9yY2UoKTtcbiAgICB9XG5cbiAgICBpZiAoSXMuZXhpc3QoYWNjZXNzb3Iuc3BhcnNlKSkge1xuICAgICAgdGhpcy5zZXRTcGFyc2VBY2Nlc3NvcihhY2Nlc3Nvciwgcm5BY2Nlc3Nvcik7XG4gICAgfVxuICAgIHJldHVybiBybkFjY2Vzc29yO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2UgYSBSbi5CdWZmZXJWaWV3IGFuZCBhIFJuLkFjY2Vzc29yIGZyb20gdGhlIFJuLkJ1ZmZlclxuICAgKiAgZnJvbSB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIEdsdGYyQnVmZmVyLCBHbHRmMkJ1ZmZlclZpZXcsIGFuZCBHbHRmMkFjY2Vzc29yLlxuICAgKiBAcGFyYW0gYWNjZXNzb3JcbiAgICogQHBhcmFtIHJuQnVmZmVyXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3IoZW5naW5lOiBFbmdpbmUsIGFjY2Vzc29yOiBSbk0yQWNjZXNzb3IsIHJuQnVmZmVyczogQnVmZmVyW10pIHtcbiAgICBjb25zdCBnbHRmQnVmZmVyVmlldyA9IGFjY2Vzc29yLmJ1ZmZlclZpZXdPYmplY3Q7XG4gICAgbGV0IHJuQnVmZmVyVmlldzogQnVmZmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZ2x0ZkJ1ZmZlclZpZXcgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5CdWZmZXIgPSBybkJ1ZmZlcnNbZ2x0ZkJ1ZmZlclZpZXcuYnVmZmVyIV07XG4gICAgICBybkJ1ZmZlclZpZXcgPSB0aGlzLl9fZ2V0Um5CdWZmZXJWaWV3KGdsdGZCdWZmZXJWaWV3LCBybkJ1ZmZlcik7XG4gICAgfVxuICAgIGNvbnN0IHJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5BY2Nlc3NvcihlbmdpbmUsIGFjY2Vzc29yLCBybkJ1ZmZlclZpZXcpO1xuICAgIHJldHVybiBybkFjY2Vzc29yO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jb3B5Um5BY2Nlc3NvckFuZEJ1ZmZlclZpZXdGb3JNb3JwaERhdGEoZW5naW5lOiBFbmdpbmUsIHNyY1JuQWNjZXNzb3I6IEFjY2Vzc29yKSB7XG4gICAgY29uc3QgYnl0ZVNpemUgPSBzcmNSbkFjY2Vzc29yLmVsZW1lbnRDb3VudCAqIDMgLyogdmVjNCAqLyAqIDQ7IC8qIGJ5dGVzICovXG4gICAgY29uc3QgZHN0Um5CdWZmZXIgPSBlbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChCdWZmZXJVc2UuR1BVVmVydGV4RGF0YSwgYnl0ZVNpemUsIDE2KTtcbiAgICBjb25zdCBkc3RSbkJ1ZmZlclZpZXcgPSBkc3RSbkJ1ZmZlclxuICAgICAgLnRha2VCdWZmZXJWaWV3KHtcbiAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogYnl0ZVNpemUsXG4gICAgICAgIGJ5dGVTdHJpZGU6IDMgLyogdmVjNCAqLyAqIDQgLyogYnl0ZXMgKi8sXG4gICAgICB9KVxuICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICBjb25zdCBkc3RSbkFjY2Vzc29yID0gZHN0Um5CdWZmZXJWaWV3XG4gICAgICAudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY291bnQ6IHNyY1JuQWNjZXNzb3IuZWxlbWVudENvdW50LFxuICAgICAgICBtYXg6IHNyY1JuQWNjZXNzb3IubWF4LFxuICAgICAgICBtaW46IHNyY1JuQWNjZXNzb3IubWluLFxuICAgICAgICBub3JtYWxpemVkOiBzcmNSbkFjY2Vzc29yLm5vcm1hbGl6ZWQsXG4gICAgICB9KVxuICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICBkc3RSbkFjY2Vzc29yLmNvcHlCdWZmZXIoc3JjUm5BY2Nlc3Nvcik7XG5cbiAgICByZXR1cm4gZHN0Um5BY2Nlc3NvcjtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fdGFrZVJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3JGb3JEcmFjbyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBhY2Nlc3NvcjogUm5NMkFjY2Vzc29yLFxuICAgIGNvbXBvc2l0aW9uTnVtOiBDb3VudCxcbiAgICBybkJ1ZmZlcjogQnVmZmVyXG4gICkge1xuICAgIGNvbnN0IHJuQnVmZmVyVmlldyA9IHJuQnVmZmVyXG4gICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBhY2Nlc3Nvci5jb3VudCAqIGNvbXBvc2l0aW9uTnVtICogNCxcbiAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgIGNvbnN0IHJuQWNjZXNzb3IgPSB0aGlzLl9fZ2V0Um5BY2Nlc3NvcihlbmdpbmUsIGFjY2Vzc29yLCBybkJ1ZmZlclZpZXcpO1xuICAgIHJldHVybiBybkFjY2Vzc29yO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSbkJ1ZmZlclZpZXcocm5tMmJ1ZmZlclZpZXc6IFJuTTJCdWZmZXJWaWV3LCBybkJ1ZmZlcjogQnVmZmVyKSB7XG4gICAgY29uc3Qgcm5CdWZmZXJWaWV3ID0gcm5CdWZmZXJcbiAgICAgIC50YWtlQnVmZmVyVmlld1dpdGhCeXRlT2Zmc2V0KHtcbiAgICAgICAgYnl0ZUxlbmd0aFRvTmVlZDogcm5tMmJ1ZmZlclZpZXcuYnl0ZUxlbmd0aCxcbiAgICAgICAgYnl0ZVN0cmlkZTogcm5tMmJ1ZmZlclZpZXcuYnl0ZVN0cmlkZSA/PyAwLFxuICAgICAgICBieXRlT2Zmc2V0OiBybm0yYnVmZmVyVmlldy5ieXRlT2Zmc2V0ID8/IDAsXG4gICAgICB9KVxuICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICByZXR1cm4gcm5CdWZmZXJWaWV3O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRHZW9tZXRyeUZyb21EcmFjb0J1ZmZlcihkcmFjbzogYW55LCBkZWNvZGVyOiBhbnksIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBkcmFjby5EZWNvZGVyQnVmZmVyKCk7XG4gICAgYnVmZmVyLkluaXQobmV3IEludDhBcnJheShhcnJheUJ1ZmZlciksIGFycmF5QnVmZmVyLmJ5dGVMZW5ndGgpO1xuICAgIGNvbnN0IGdlb21ldHJ5VHlwZSA9IGRlY29kZXIuR2V0RW5jb2RlZEdlb21ldHJ5VHlwZShidWZmZXIpO1xuICAgIGxldCBkcmFjb0dlb21ldHJ5OiBhbnk7XG4gICAgbGV0IGRlY29kaW5nU3RhdHVzOiBhbnk7XG4gICAgaWYgKGdlb21ldHJ5VHlwZSA9PT0gZHJhY28uVFJJQU5HVUxBUl9NRVNIKSB7XG4gICAgICBkcmFjb0dlb21ldHJ5ID0gbmV3IGRyYWNvLk1lc2goKTtcbiAgICAgIGRlY29kaW5nU3RhdHVzID0gZGVjb2Rlci5EZWNvZGVCdWZmZXJUb01lc2goYnVmZmVyLCBkcmFjb0dlb21ldHJ5KTtcbiAgICB9IGVsc2UgaWYgKGdlb21ldHJ5VHlwZSA9PT0gZHJhY28uUE9JTlRfQ0xPVUQpIHtcbiAgICAgIGRyYWNvR2VvbWV0cnkgPSBuZXcgZHJhY28uUG9pbnRDbG91ZCgpO1xuICAgICAgZGVjb2RpbmdTdGF0dXMgPSBkZWNvZGVyLkRlY29kZUJ1ZmZlclRvUG9pbnRDbG91ZChidWZmZXIsIGRyYWNvR2VvbWV0cnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9ICdVbmtub3duIGdlb21ldHJ5IHR5cGUuJztcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBkcmFjb0dlb21ldHJ5Lmdlb21ldHJ5VHlwZSA9IGdlb21ldHJ5VHlwZTsgLy8gc3RvcmVcblxuICAgIGlmICghZGVjb2RpbmdTdGF0dXMub2soKSB8fCBkcmFjb0dlb21ldHJ5LnB0ciA9PT0gMCkge1xuICAgICAgbGV0IGVycm9yTXNnID0gJ0RlY29kaW5nIGZhaWxlZDogJztcbiAgICAgIGVycm9yTXNnICs9IGRlY29kaW5nU3RhdHVzLmVycm9yX21zZygpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoZXJyb3JNc2cpO1xuICAgICAgZHJhY28uZGVzdHJveShkZWNvZGVyKTtcbiAgICAgIGRyYWNvLmRlc3Ryb3koZHJhY29HZW9tZXRyeSk7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgICBkcmFjby5kZXN0cm95KGJ1ZmZlcik7XG5cbiAgICByZXR1cm4gZHJhY29HZW9tZXRyeTtcbiAgfVxuXG4gIHN0YXRpYyBfX2dldEluZGljZXNGcm9tRHJhY28oZHJhY286IGFueSwgZGVjb2RlcjogYW55LCBkcmFjb0dlb21ldHJ5OiBhbnksIHRyaWFuZ2xlU3RyaXBEcmF3TW9kZTogYm9vbGVhbikge1xuICAgIC8vIEZvciBtZXNoLCB3ZSBuZWVkIHRvIGdlbmVyYXRlIHRoZSBmYWNlcy5cbiAgICBjb25zdCBnZW9tZXRyeVR5cGUgPSBkcmFjb0dlb21ldHJ5Lmdlb21ldHJ5VHlwZTtcbiAgICBpZiAoZ2VvbWV0cnlUeXBlICE9PSBkcmFjby5UUklBTkdVTEFSX01FU0gpIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuXG4gICAgbGV0IGluZGljZXM6IFVpbnQzMkFycmF5IHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKHRyaWFuZ2xlU3RyaXBEcmF3TW9kZSkge1xuICAgICAgY29uc3Qgc3RyaXBzQXJyYXkgPSBuZXcgZHJhY28uRHJhY29JbnQzMkFycmF5KCk7XG4gICAgICBkZWNvZGVyLkdldFRyaWFuZ2xlU3RyaXBzRnJvbU1lc2goZHJhY29HZW9tZXRyeSwgc3RyaXBzQXJyYXkpO1xuICAgICAgaW5kaWNlcyA9IG5ldyBVaW50MzJBcnJheShzdHJpcHNBcnJheS5zaXplKCkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpcHNBcnJheS5zaXplKCk7ICsraSkge1xuICAgICAgICBpbmRpY2VzW2ldID0gc3RyaXBzQXJyYXkuR2V0VmFsdWUoaSk7XG4gICAgICB9XG4gICAgICBkcmFjby5kZXN0cm95KHN0cmlwc0FycmF5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVFJJQU5HTEVTXG4gICAgICBjb25zdCBudW1GYWNlcyA9IGRyYWNvR2VvbWV0cnkubnVtX2ZhY2VzKCk7XG4gICAgICBjb25zdCBudW1JbmRpY2VzID0gbnVtRmFjZXMgKiAzO1xuICAgICAgaW5kaWNlcyA9IG5ldyBVaW50MzJBcnJheShudW1JbmRpY2VzKTtcbiAgICAgIGNvbnN0IGlhID0gbmV3IGRyYWNvLkRyYWNvSW50MzJBcnJheSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1GYWNlczsgKytpKSB7XG4gICAgICAgIGRlY29kZXIuR2V0RmFjZUZyb21NZXNoKGRyYWNvR2VvbWV0cnksIGksIGlhKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSBpICogMztcbiAgICAgICAgaW5kaWNlc1tpbmRleF0gPSBpYS5HZXRWYWx1ZSgwKTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0gaWEuR2V0VmFsdWUoMSk7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAyXSA9IGlhLkdldFZhbHVlKDIpO1xuICAgICAgfVxuICAgICAgZHJhY28uZGVzdHJveShpYSk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWNvZGVEcmFjbyhcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBwcmltaXRpdmU6IFJuTTJQcmltaXRpdmUsXG4gICAgcm5CdWZmZXJzOiBCdWZmZXJbXSxcbiAgICBnbHRmTW9kZWw6IFJuTTIsXG4gICAgbWFwOiBNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj5cbiAgKSB7XG4gICAgY29uc3QgYnVmZmVyVmlldyA9IGdsdGZNb2RlbC5idWZmZXJWaWV3c1twcmltaXRpdmUuZXh0ZW5zaW9ucz8uS0hSX2RyYWNvX21lc2hfY29tcHJlc3Npb24uYnVmZmVyVmlld107XG4gICAgY29uc3Qgcm5CdWZmZXJWaWV3ID0gdGhpcy5fX2dldFJuQnVmZmVyVmlldyhidWZmZXJWaWV3LCBybkJ1ZmZlcnNbYnVmZmVyVmlldy5idWZmZXIhXSk7XG4gICAgY29uc3QgYXJyYXlidWZmZXJPZkJ1ZmZlclZpZXcgPSBuZXcgVWludDhBcnJheShybkJ1ZmZlclZpZXcuZ2V0VWludDhBcnJheSgpKS5idWZmZXI7XG5cbiAgICBjb25zdCBkcmFjbyA9IG5ldyBEcmFjb0RlY29kZXJNb2R1bGUoKTtcbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IGRyYWNvLkRlY29kZXIoKTtcbiAgICBjb25zdCBkcmFjb0dlb21ldHJ5ID0gdGhpcy5fX2dldEdlb21ldHJ5RnJvbURyYWNvQnVmZmVyKGRyYWNvLCBkZWNvZGVyLCBhcnJheWJ1ZmZlck9mQnVmZmVyVmlldyk7XG4gICAgaWYgKGRyYWNvR2VvbWV0cnkgPT0gbnVsbCkge1xuICAgICAgZHJhY28uZGVzdHJveShkcmFjb0dlb21ldHJ5KTtcbiAgICAgIGRyYWNvLmRlc3Ryb3koZGVjb2Rlcik7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cblxuICAgIGNvbnN0IG51bVBvaW50cyA9IGRyYWNvR2VvbWV0cnkubnVtX3BvaW50cygpO1xuICAgIGNvbnN0IHJuQnVmZmVyRm9yRHJhY28gPSB0aGlzLl9fY3JlYXRlQnVmZmVyRm9yRGVjb21wcmVzc2VkRGF0YShwcmltaXRpdmUsIG51bVBvaW50cyk7XG5cbiAgICAvLyBkZWNvZGUgaW5kaWNlc1xuICAgIGNvbnN0IHByaW1pdGl2ZU1vZGUgPSBQcmltaXRpdmVNb2RlLmZyb20ocHJpbWl0aXZlLm1vZGUhKTtcbiAgICBsZXQgaXNUcmlhbmdsZVN0cmlwID0gZmFsc2U7XG4gICAgaWYgKHByaW1pdGl2ZU1vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCkge1xuICAgICAgaXNUcmlhbmdsZVN0cmlwID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5fX2dldEluZGljZXNGcm9tRHJhY28oZHJhY28sIGRlY29kZXIsIGRyYWNvR2VvbWV0cnksIGlzVHJpYW5nbGVTdHJpcCkhO1xuICAgIGNvbnN0IGluZGljZXNSbkFjY2Vzc29yID0gdGhpcy5fX3Rha2VSbkJ1ZmZlclZpZXdBbmRSbkFjY2Vzc29yRm9yRHJhY28oXG4gICAgICBlbmdpbmUsXG4gICAgICBwcmltaXRpdmUuaW5kaWNlc09iamVjdCEsXG4gICAgICAxLFxuICAgICAgcm5CdWZmZXJGb3JEcmFjb1xuICAgICk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpbmRpY2VzUm5BY2Nlc3Nvci5zZXRTY2FsYXIoaSwgaW5kaWNlc1tpXSwge30pO1xuICAgIH1cblxuICAgIC8vIGRlY29kZSBhdHRyaWJ1dGVzXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHByaW1pdGl2ZS5hdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBkcmFjb0F0dHJpYnV0ZUlkID0gcHJpbWl0aXZlLmV4dGVuc2lvbnM/LktIUl9kcmFjb19tZXNoX2NvbXByZXNzaW9uLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlc09iamVjdHMhW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgbGV0IGF0dHJpYnV0ZVJuQWNjZXNzb3I6IEFjY2Vzc29yIHwgdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoSXMubm90LmV4aXN0KGRyYWNvQXR0cmlidXRlSWQpKSB7XG4gICAgICAgIC8vIG5vbi1lbmNvZGVkIGRhdGFcblxuICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yID0gdGhpcy5fX2dldFJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3IoZW5naW5lLCBhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yISwgcm5CdWZmZXJzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVuY29kZWQgZGF0YVxuXG4gICAgICAgIGNvbnN0IGNvbXBvc2l0aW9uTnVtID0gQ29tcG9zaXRpb25UeXBlLmZyb21TdHJpbmcoYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciEudHlwZSkuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3IgPSB0aGlzLl9fdGFrZVJuQnVmZmVyVmlld0FuZFJuQWNjZXNzb3JGb3JEcmFjbyhcbiAgICAgICAgICBlbmdpbmUsXG4gICAgICAgICAgYXR0cmlidXRlR2x0ZjJBY2Nlc3NvciEsXG4gICAgICAgICAgY29tcG9zaXRpb25OdW0sXG4gICAgICAgICAgcm5CdWZmZXJGb3JEcmFjb1xuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGRyYWNvQXR0cmlidXRlUG9pbnRlciA9IGRlY29kZXIuR2V0QXR0cmlidXRlQnlVbmlxdWVJZChkcmFjb0dlb21ldHJ5LCBkcmFjb0F0dHJpYnV0ZUlkKTtcbiAgICAgICAgY29uc3QgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YSA9IG5ldyBkcmFjby5EcmFjb0Zsb2F0MzJBcnJheSgpO1xuICAgICAgICBkZWNvZGVyLkdldEF0dHJpYnV0ZUZsb2F0Rm9yQWxsUG9pbnRzKGRyYWNvR2VvbWV0cnksIGRyYWNvQXR0cmlidXRlUG9pbnRlciwgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YSk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Qb2ludHM7IGkrKykge1xuICAgICAgICAgIGlmIChjb21wb3NpdGlvbk51bSA9PT0gMSkge1xuICAgICAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3Nvci5zZXRTY2FsYXIoaSwgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0pLCB7fSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjb21wb3NpdGlvbk51bSA9PT0gMikge1xuICAgICAgICAgICAgYXR0cmlidXRlUm5BY2Nlc3Nvci5zZXRWZWMyKFxuICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtICsgMSksXG4gICAgICAgICAgICAgIHt9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25OdW0gPT09IDMpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVJuQWNjZXNzb3Iuc2V0VmVjMyhcbiAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0pLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDEpLFxuICAgICAgICAgICAgICBkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhLkdldFZhbHVlKGkgKiBjb21wb3NpdGlvbk51bSArIDIpLFxuICAgICAgICAgICAgICB7fVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBvc2l0aW9uTnVtID09PSA0KSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVSbkFjY2Vzc29yLnNldFZlYzQoXG4gICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgIGRlY29tcHJlc3NlZEF0dHJpYnV0ZURhdGEuR2V0VmFsdWUoaSAqIGNvbXBvc2l0aW9uTnVtKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAxKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAyKSxcbiAgICAgICAgICAgICAgZGVjb21wcmVzc2VkQXR0cmlidXRlRGF0YS5HZXRWYWx1ZShpICogY29tcG9zaXRpb25OdW0gKyAzKSxcbiAgICAgICAgICAgICAge31cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZHJhY28uZGVzdHJveShkZWNvbXByZXNzZWRBdHRyaWJ1dGVEYXRhKTtcbiAgICAgIH1cblxuICAgICAgaWYgKElzLmV4aXN0KGF0dHJpYnV0ZUdsdGYyQWNjZXNzb3IhLnNwYXJzZSkpIHtcbiAgICAgICAgdGhpcy5zZXRTcGFyc2VBY2Nlc3NvcihhdHRyaWJ1dGVHbHRmMkFjY2Vzc29yISwgYXR0cmlidXRlUm5BY2Nlc3NvciEpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBqb2luZWRTdHJpbmcgPSBWZXJ0ZXhBdHRyaWJ1dGUudG9WZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY0pvaW5lZFN0cmluZ0FzR2x0ZlN0eWxlKFxuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGUuZnJvbVN0cmluZyhhdHRyaWJ1dGVOYW1lKVxuICAgICAgKTtcbiAgICAgIG1hcC5zZXQoam9pbmVkU3RyaW5nLCBhdHRyaWJ1dGVSbkFjY2Vzc29yISk7XG4gICAgfVxuXG4gICAgZHJhY28uZGVzdHJveShkcmFjb0dlb21ldHJ5KTtcbiAgICBkcmFjby5kZXN0cm95KGRlY29kZXIpO1xuXG4gICAgcmV0dXJuIGluZGljZXNSbkFjY2Vzc29yO1xuICB9XG5cbiAgc3RhdGljIF9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgdGV4dHVyZUpzb246IFJuTTJUZXh0dXJlSW5mbyxcbiAgICBybk1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgICB0ZXh0dXJlVHJhbnNmb3JtU2NhbGVTaGFkZXJTZW1hbnRpYzogU2hhZGVyU2VtYW50aWNzTmFtZSxcbiAgICB0ZXh0dXJlVHJhbnNmb3JtT2Zmc2V0U2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWUsXG4gICAgdGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uU2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc05hbWVcbiAgKSB7XG4gICAgaWYgKHRleHR1cmVKc29uPy5leHRlbnNpb25zPy5LSFJfdGV4dHVyZV90cmFuc2Zvcm0pIHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybVNjYWxlID0gTXV0YWJsZVZlY3RvcjIuZnJvbUNvcHlBcnJheShbMS4wLCAxLjBdKTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybU9mZnNldCA9IE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkoWzAuMCwgMC4wXSk7XG4gICAgICBsZXQgcm90YXRpb24gPSAwO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1Kc29uID0gdGV4dHVyZUpzb24uZXh0ZW5zaW9ucy5LSFJfdGV4dHVyZV90cmFuc2Zvcm07XG4gICAgICBpZiAodHJhbnNmb3JtSnNvbi5zY2FsZSAhPSBudWxsKSB7XG4gICAgICAgIHRyYW5zZm9ybVNjYWxlLnggPSB0cmFuc2Zvcm1Kc29uLnNjYWxlWzBdO1xuICAgICAgICB0cmFuc2Zvcm1TY2FsZS55ID0gdHJhbnNmb3JtSnNvbi5zY2FsZVsxXTtcbiAgICAgIH1cbiAgICAgIGlmICh0cmFuc2Zvcm1Kc29uLm9mZnNldCAhPSBudWxsKSB7XG4gICAgICAgIHRyYW5zZm9ybU9mZnNldC54ID0gdHJhbnNmb3JtSnNvbi5vZmZzZXRbMF07XG4gICAgICAgIHRyYW5zZm9ybU9mZnNldC55ID0gdHJhbnNmb3JtSnNvbi5vZmZzZXRbMV07XG4gICAgICB9XG4gICAgICBpZiAodHJhbnNmb3JtSnNvbi5yb3RhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtSnNvbi5yb3RhdGlvbjtcbiAgICAgIH1cblxuICAgICAgcm5NYXRlcmlhbC5zZXRQYXJhbWV0ZXIodGV4dHVyZVRyYW5zZm9ybVNjYWxlU2hhZGVyU2VtYW50aWMsIHRyYW5zZm9ybVNjYWxlKTtcbiAgICAgIHJuTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHRleHR1cmVUcmFuc2Zvcm1PZmZzZXRTaGFkZXJTZW1hbnRpYywgdHJhbnNmb3JtT2Zmc2V0KTtcbiAgICAgIHJuTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvblNoYWRlclNlbWFudGljLCByb3RhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVCdWZmZXJGb3JEZWNvbXByZXNzZWREYXRhKHByaW1pdGl2ZTogUm5NMlByaW1pdGl2ZSwgbnVtUG9pbnRzOiBudW1iZXIpOiBCdWZmZXIge1xuICAgIGxldCBieXRlTGVuZ3RoT2ZCdWZmZXJGb3JEcmFjbyA9IDA7XG5cbiAgICBpZiAoSXMuZXhpc3QocHJpbWl0aXZlLmluZGljZXMpKSB7XG4gICAgICBjb25zdCBjb3VudCA9IHByaW1pdGl2ZS5pbmRpY2VzT2JqZWN0IS5jb3VudDtcbiAgICAgIGJ5dGVMZW5ndGhPZkJ1ZmZlckZvckRyYWNvICs9IGNvdW50ICogNDtcbiAgICB9XG5cbiAgICBjb25zdCBkcmNBdHRyaWJ1dGVzID0gcHJpbWl0aXZlLmV4dGVuc2lvbnM/LktIUl9kcmFjb19tZXNoX2NvbXByZXNzaW9uLmF0dHJpYnV0ZXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHByaW1pdGl2ZS5hdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoZHJjQXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9PSBudWxsKSB7XG4gICAgICAgIC8vIG5vbi1lbmNvZGVkIGRhdGFcblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYWNjZXNzb3IgPSBwcmltaXRpdmUuYXR0cmlidXRlc09iamVjdHMhW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgY29tcG9zaXRpb25OdW0gPSBDb21wb3NpdGlvblR5cGUuZnJvbVN0cmluZyhhY2Nlc3NvciEudHlwZSkuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVCeXRlTGVuZ3RoID0gbnVtUG9pbnRzICogY29tcG9zaXRpb25OdW0gKiA0O1xuICAgICAgYnl0ZUxlbmd0aE9mQnVmZmVyRm9yRHJhY28gKz0gYXR0cmlidXRlQnl0ZUxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEJ1ZmZlcih7XG4gICAgICBieXRlTGVuZ3RoOiBieXRlTGVuZ3RoT2ZCdWZmZXJGb3JEcmFjbyxcbiAgICAgIGJ1ZmZlcjogbmV3IEFycmF5QnVmZmVyKGJ5dGVMZW5ndGhPZkJ1ZmZlckZvckRyYWNvKSxcbiAgICAgIG5hbWU6ICdEcmFjbycsXG4gICAgICBieXRlQWxpZ246IDQsXG4gICAgICBidWZmZXJVc2FnZTogQnVmZmVyVXNlLkNQVUdlbmVyaWMsXG4gICAgICBpbmRleE9mVGhlQnVmZmVyVXNhZ2U6IDAsXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIE1Ub29uIDEuMCBtYXRlcmlhbCBwYXJhbWV0ZXJzIGZyb20gVlJNIG1hdGVyaWFsIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIFZSTSAxLjAgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gcm5UZXh0dXJlcyAtIEFycmF5IG9mIFJob2Rvbml0ZSB0ZXh0dXJlc1xuICogQHBhcmFtIHJuU2FtcGxlcnMgLSBBcnJheSBvZiBSaG9kb25pdGUgc2FtcGxlcnNcbiAqL1xuZnVuY3Rpb24gc2V0dXBNVG9vbjEoXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgbWF0ZXJpYWxKc29uOiBWcm0xX01hdGVyaWFsLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IG1Ub29uID0gbWF0ZXJpYWxKc29uLmV4dGVuc2lvbnMuVlJNQ19tYXRlcmlhbHNfbXRvb247XG5cbiAge1xuICAgIGNvbnN0IHNoYWRlQ29sb3JGYWN0b3IgPSBtVG9vbi5zaGFkZUNvbG9yRmFjdG9yO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGVDb2xvckZhY3RvcicsIFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoc2hhZGVDb2xvckZhY3RvcikpO1xuICB9XG5cbiAge1xuICAgIGNvbnN0IHNoYWRlTXVsdGlwbHlUZXh0dXJlID0gbVRvb24uc2hhZGVNdWx0aXBseVRleHR1cmU7XG4gICAgaWYgKHNoYWRlTXVsdGlwbHlUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbc2hhZGVNdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3NoYWRlTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NoYWRlTXVsdGlwbHlUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNoYWRlTXVsdGlwbHlUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkZU11bHRpcGx5VGV4Y29vcmRJbmRleCcsIHNoYWRlTXVsdGlwbHlUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB7XG4gICAgY29uc3Qgc2hhZGluZ1NoaWZ0RmFjdG9yID0gbVRvb24uc2hhZGluZ1NoaWZ0RmFjdG9yO1xuICAgIGlmIChzaGFkaW5nU2hpZnRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGFkaW5nU2hpZnRGYWN0b3InLCBzaGFkaW5nU2hpZnRGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgc2hhZGluZ1NoaWZ0VGV4dHVyZSA9IG1Ub29uLnNoYWRpbmdTaGlmdFRleHR1cmU7XG4gICAgaWYgKHNoYWRpbmdTaGlmdFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tzaGFkaW5nU2hpZnRUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzaGFkaW5nU2hpZnRUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NoYWRpbmdTaGlmdFRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc2hhZGluZ1NoaWZ0VGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hhZGluZ1NoaWZ0VGV4Y29vcmRJbmRleCcsIHNoYWRpbmdTaGlmdFRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlID0gc2hhZGluZ1NoaWZ0VGV4dHVyZS5zY2FsZTtcbiAgICAgIGlmIChzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRpbmdTaGlmdFRleHR1cmVTY2FsZScsIHNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBzaGFkaW5nVG9vbnlGYWN0b3IgPSBtVG9vbi5zaGFkaW5nVG9vbnlGYWN0b3I7XG4gICAgaWYgKHNoYWRpbmdUb29ueUZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NoYWRpbmdUb29ueUZhY3RvcicsIHNoYWRpbmdUb29ueUZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBnaUVxdWFsaXphdGlvbkZhY3RvciA9IG1Ub29uLmdpRXF1YWxpemF0aW9uRmFjdG9yO1xuICAgIGlmIChnaUVxdWFsaXphdGlvbkZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2dpRXF1YWxpemF0aW9uRmFjdG9yJywgZ2lFcXVhbGl6YXRpb25GYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgbWF0Y2FwVGV4dHVyZSA9IG1Ub29uLm1hdGNhcFRleHR1cmU7XG4gICAgaWYgKG1hdGNhcFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1ttYXRjYXBUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1ttYXRjYXBUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ21hdGNhcFRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAobWF0Y2FwVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbWF0Y2FwVGV4Y29vcmRJbmRleCcsIG1hdGNhcFRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgbWF0Y2FwRmFjdG9yID0gbVRvb24ubWF0Y2FwRmFjdG9yO1xuICAgIGlmIChtYXRjYXBGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdtYXRjYXBGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKG1hdGNhcEZhY3RvcikpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yID0gbVRvb24ucGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yO1xuICAgIGlmIChwYXJhbWV0cmljUmltQ29sb3JGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwYXJhbWV0cmljUmltQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKHBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcikpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvciA9IG1Ub29uLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I7XG4gICAgaWYgKHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yJywgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCBwYXJhbWV0cmljUmltTGlmdEZhY3RvciA9IG1Ub29uLnBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yO1xuICAgIGlmIChwYXJhbWV0cmljUmltTGlmdEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3BhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yJywgcGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgcmltTXVsdGlwbHlUZXh0dXJlID0gbVRvb24ucmltTXVsdGlwbHlUZXh0dXJlO1xuICAgIGlmIChyaW1NdWx0aXBseVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1tyaW1NdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW3JpbU11bHRpcGx5VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdyaW1NdWx0aXBseVRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAocmltTXVsdGlwbHlUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyaW1NdWx0aXBseVRleGNvb3JkSW5kZXgnLCByaW1NdWx0aXBseVRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgcmltTGlnaHRpbmdNaXhGYWN0b3IgPSBtVG9vbi5yaW1MaWdodGluZ01peEZhY3RvcjtcbiAgICBpZiAocmltTGlnaHRpbmdNaXhGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdyaW1MaWdodGluZ01peEZhY3RvcicsIHJpbUxpZ2h0aW5nTWl4RmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG91dGxpbmVXaWR0aE1vZGUgPSBtVG9vbi5vdXRsaW5lV2lkdGhNb2RlO1xuICAgIGlmIChvdXRsaW5lV2lkdGhNb2RlICE9IG51bGwpIHtcbiAgICAgIGlmIChvdXRsaW5lV2lkdGhNb2RlID09PSAnbm9uZScpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lV2lkdGhNb2RlJywgMCk7XG4gICAgICB9IGVsc2UgaWYgKG91dGxpbmVXaWR0aE1vZGUgPT09ICd3b3JsZENvb3JkaW5hdGVzJykge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVXaWR0aE1vZGUnLCAxKTtcbiAgICAgIH0gZWxzZSBpZiAob3V0bGluZVdpZHRoTW9kZSA9PT0gJ3NjcmVlbkNvb3JkaW5hdGVzJykge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ291dGxpbmVXaWR0aE1vZGUnLCAyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG91dGxpbmVXaWR0aEZhY3RvciA9IG1Ub29uLm91dGxpbmVXaWR0aEZhY3RvcjtcbiAgICBpZiAob3V0bGluZVdpZHRoRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb3V0bGluZVdpZHRoRmFjdG9yJywgb3V0bGluZVdpZHRoRmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSA9IG1Ub29uLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZTtcbiAgICBpZiAob3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlJywgcm5UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgb3V0bGluZUNvbG9yRmFjdG9yID0gbVRvb24ub3V0bGluZUNvbG9yRmFjdG9yO1xuICAgIGlmIChvdXRsaW5lQ29sb3JGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKG91dGxpbmVDb2xvckZhY3RvcikpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3Qgb3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yID0gbVRvb24ub3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yO1xuICAgIGlmIChvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3InLCBvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IpO1xuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgdXZBbmltYXRpb25NYXNrVGV4dHVyZSA9IG1Ub29uLnV2QW5pbWF0aW9uTWFza1RleHR1cmU7XG4gICAgaWYgKHV2QW5pbWF0aW9uTWFza1RleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gcm5UZXh0dXJlc1t1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1t1dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3V2QW5pbWF0aW9uTWFza1RleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAodXZBbmltYXRpb25NYXNrVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndXZBbmltYXRpb25NYXNrVGV4Y29vcmRJbmRleCcsIHV2QW5pbWF0aW9uTWFza1RleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB7XG4gICAgY29uc3QgdXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3IgPSBtVG9vbi51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcjtcbiAgICBpZiAodXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCd1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcicsIHV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yKTtcbiAgICB9XG4gIH1cbiAge1xuICAgIGNvbnN0IHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yID0gbVRvb24udXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3I7XG4gICAgaWYgKHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigndXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3InLCB1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3Rvcik7XG4gICAgfVxuICB9XG4gIHtcbiAgICBjb25zdCB1dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IgPSBtVG9vbi51dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3I7XG4gICAgaWYgKHV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3V2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcicsIHV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3Rvcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBQQlIgbWV0YWxsaWMtcm91Z2huZXNzIG1hdGVyaWFsIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBwYnJNZXRhbGxpY1JvdWdobmVzcyAtIFRoZSBQQlIgbWV0YWxsaWMtcm91Z2huZXNzIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKiBAcGFyYW0gb3B0aW9ucyAtIExvYWRlciBvcHRpb25zXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwUGJyTWV0YWxsaWNSb3VnaG5lc3MoXG4gIHBick1ldGFsbGljUm91Z2huZXNzOiBSbk0yUGJyTWV0YWxsaWNSb3VnaG5lc3MsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgZ2x0Zk1vZGVsOiBSbk0yLFxuICBvcHRpb25zOiBHbHRmTG9hZE9wdGlvbiB8IHVuZGVmaW5lZCxcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgaXNVbmxpdCA9IG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3VubGl0ICE9IG51bGw7XG5cbiAgY29uc3QgYmFzZUNvbG9yRmFjdG9yID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yRmFjdG9yO1xuICBpZiAoYmFzZUNvbG9yRmFjdG9yICE9IG51bGwpIHtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2Jhc2VDb2xvckZhY3RvcicsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoYmFzZUNvbG9yRmFjdG9yKSk7XG4gIH1cblxuICAvLyBCYXNlQ29sb3IgVGV4dHVyZVxuICBjb25zdCBiYXNlQ29sb3JUZXh0dXJlID0gcGJyTWV0YWxsaWNSb3VnaG5lc3MuYmFzZUNvbG9yVGV4dHVyZTtcbiAgaWYgKGJhc2VDb2xvclRleHR1cmUgIT0gbnVsbCkge1xuICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbYmFzZUNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2Jhc2VDb2xvclRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2Jhc2VDb2xvclRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgaWYgKGJhc2VDb2xvclRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdiYXNlQ29sb3JUZXhjb29yZEluZGV4JywgYmFzZUNvbG9yVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgfVxuICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICBiYXNlQ29sb3JUZXh0dXJlISxcbiAgICAgIG1hdGVyaWFsLFxuICAgICAgJ2Jhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAnYmFzZUNvbG9yVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAnYmFzZUNvbG9yVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICk7XG4gIH1cblxuICAvLyBBbWJpZW50IE9jY2x1c2lvbiBUZXh0dXJlXG4gIGNvbnN0IG9jY2x1c2lvblRleHR1cmUgPSBtYXRlcmlhbEpzb24ub2NjbHVzaW9uVGV4dHVyZTtcbiAgaWYgKG9jY2x1c2lvblRleHR1cmUgIT0gbnVsbCAmJiBJcy5mYWxzeShpc1VubGl0KSkge1xuICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbb2NjbHVzaW9uVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW29jY2x1c2lvblRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ29jY2x1c2lvblRleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgaWYgKG9jY2x1c2lvblRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdvY2NsdXNpb25UZXhjb29yZEluZGV4Jywgb2NjbHVzaW9uVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgfVxuICAgIGlmIChvY2NsdXNpb25UZXh0dXJlLnN0cmVuZ3RoICE9IG51bGwpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignb2NjbHVzaW9uU3RyZW5ndGgnLCBvY2NsdXNpb25UZXh0dXJlLnN0cmVuZ3RoKTtcbiAgICB9XG4gICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgIG9jY2x1c2lvblRleHR1cmUsXG4gICAgICBtYXRlcmlhbCxcbiAgICAgICdvY2NsdXNpb25UZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgJ29jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgJ29jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICApO1xuICB9XG5cbiAgLy8gTWV0YWxsaWMgRmFjdG9yXG4gIGxldCBtZXRhbGxpY0ZhY3RvciA9IHBick1ldGFsbGljUm91Z2huZXNzLm1ldGFsbGljRmFjdG9yO1xuICBtZXRhbGxpY0ZhY3RvciA9IGlzVW5saXQgPyAwIDogKG1ldGFsbGljRmFjdG9yID8/IDEpO1xuICBsZXQgcm91Z2huZXNzRmFjdG9yID0gcGJyTWV0YWxsaWNSb3VnaG5lc3Mucm91Z2huZXNzRmFjdG9yO1xuICByb3VnaG5lc3NGYWN0b3IgPSBpc1VubGl0ID8gMSA6IChyb3VnaG5lc3NGYWN0b3IgPz8gMSk7XG4gIG1hdGVyaWFsLnNldFBhcmFtZXRlcignbWV0YWxsaWNGYWN0b3InLCBtZXRhbGxpY0ZhY3Rvcik7XG4gIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncm91Z2huZXNzRmFjdG9yJywgcm91Z2huZXNzRmFjdG9yKTtcblxuICAvLyBNZXRhbGxpYyByb3VnaG5lc3MgdGV4dHVyZVxuICBjb25zdCBtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUgPSBwYnJNZXRhbGxpY1JvdWdobmVzcy5tZXRhbGxpY1JvdWdobmVzc1RleHR1cmU7XG4gIGlmIChtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUgIT0gbnVsbCAmJiBJcy5mYWxzeShpc1VubGl0KSkge1xuICAgIGNvbnN0IHJuVGV4dHVyZSA9IHJuVGV4dHVyZXNbbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUnLCByblRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgaWYgKG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ21ldGFsbGljUm91Z2huZXNzVGV4Y29vcmRJbmRleCcsIG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgfVxuICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICBtZXRhbGxpY1JvdWdobmVzc1RleHR1cmUhLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgICAnbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAnbWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgKTtcbiAgfVxuXG4gIC8vIGlmIChJcy5leGlzdChtZXRhbGxpY1JvdWdobmVzc1RleHR1cmU/LnRleHR1cmU/LmltYWdlPy5pbWFnZSkpIHtcbiAgLy8gICBjb25zdCBpbWFnZSA9IG1ldGFsbGljUm91Z2huZXNzVGV4dHVyZSEudGV4dHVyZSEuaW1hZ2UhLmltYWdlO1xuICAvLyAgIGNvbnN0IHdpZHRoID0gaW1hZ2Uud2lkdGg7XG4gIC8vICAgY29uc3QgaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuXG4gIC8vICAgY29uc3QgbWV0YWxsaWNSb3VnaG5lc3NDYW52YXMgPSBjb252ZXJ0SFRNTEltYWdlRWxlbWVudFRvQ2FudmFzKGltYWdlLCB3aWR0aCwgaGVpZ2h0KTtcbiAgLy8gfVxuXG4gIC8vIENsZWFyQ29hdFxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdChtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIC8vIFRyYW5zbWlzc2lvblxuICBjb25zdCB0cmFuc21pc3Npb24gPSBzZXR1cF9LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuICBpZiAoIW9wdGlvbnMhLnRyYW5zbWlzc2lvbikge1xuICAgIG9wdGlvbnMhLnRyYW5zbWlzc2lvbiA9IHRyYW5zbWlzc2lvbjtcbiAgfVxuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfdm9sdW1lKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCwgcm5UZXh0dXJlcywgcm5TYW1wbGVycyk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19zaGVlbihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfc3BlY3VsYXIobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2lvcihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwpO1xuXG4gIHNldHVwX0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkobWF0ZXJpYWxKc29uLCBtYXRlcmlhbCwgZ2x0Zk1vZGVsLCByblRleHR1cmVzLCByblNhbXBsZXJzKTtcblxuICBzZXR1cF9LSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uKG1hdGVyaWFsSnNvbiwgbWF0ZXJpYWwsIGdsdGZNb2RlbCk7XG5cbiAgc2V0dXBfS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbihtYXRlcmlhbEpzb24sIG1hdGVyaWFsLCBnbHRmTW9kZWwsIHJuVGV4dHVyZXMsIHJuU2FtcGxlcnMpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24gZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRyYW5zbWlzc2lvbiB3YXMgY29uZmlndXJlZFxuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbihcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbikge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiA9IG1hdGVyaWFsSnNvbi5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uKSkge1xuICAgIGNvbnN0IHRyYW5zbWlzc2lvbkZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfdHJhbnNtaXNzaW9uLnRyYW5zbWlzc2lvbkZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24udHJhbnNtaXNzaW9uRmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3RyYW5zbWlzc2lvbkZhY3RvcicsIHRyYW5zbWlzc2lvbkZhY3Rvcik7XG5cbiAgICBjb25zdCB0cmFuc21pc3Npb25UZXh0dXJlID0gS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24udHJhbnNtaXNzaW9uVGV4dHVyZTtcbiAgICBpZiAoSXMuZXhpc3QodHJhbnNtaXNzaW9uVGV4dHVyZSkpIHtcbiAgICAgIGNvbnN0IHJuVHJhbnNtaXNzaW9uVGV4dHVyZSA9IHJuVGV4dHVyZXNbdHJhbnNtaXNzaW9uVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbdHJhbnNtaXNzaW9uVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCd0cmFuc21pc3Npb25UZXh0dXJlJywgcm5UcmFuc21pc3Npb25UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHRyYW5zbWlzc2lvblRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3RyYW5zbWlzc2lvblRleGNvb3JkSW5kZXgnLCB0cmFuc21pc3Npb25UZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHRyYW5zbWlzc2lvblRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAndHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3RyYW5zbWlzc2lvblRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAndHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19jbGVhcmNvYXQgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfY2xlYXJjb2F0KFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0ID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2NsZWFyY29hdDtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0KSkge1xuICAgIC8vIENsZWFyQ29hdCBGYWN0b3JcbiAgICBjb25zdCBjbGVhcmNvYXRGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdEZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdjbGVhcmNvYXRGYWN0b3InLCBjbGVhcmNvYXRGYWN0b3IpO1xuICAgIC8vIENsZWFyQ29hdCBUZXh0dXJlXG4gICAgY29uc3QgY2xlYXJjb2F0VGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfY2xlYXJjb2F0LmNsZWFyY29hdFRleHR1cmU7XG4gICAgaWYgKGNsZWFyY29hdFRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5DbGVhckNvYXRUZXh0dXJlID0gcm5UZXh0dXJlc1tjbGVhcmNvYXRUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tjbGVhcmNvYXRUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2NsZWFyY29hdFRleHR1cmUnLCBybkNsZWFyQ29hdFRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoY2xlYXJjb2F0VGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2xlYXJjb2F0VGV4Y29vcmRJbmRleCcsIGNsZWFyY29hdFRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gQ2xlYXJDb2F0IFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBjbGVhcmNvYXRUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2NsZWFyY29hdFRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdjbGVhcmNvYXRUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2NsZWFyY29hdFRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIC8vIENsZWFyQ29hdCBSb3VnaG5lc3MgRmFjdG9yXG4gICAgY29uc3QgY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXRSb3VnaG5lc3NGYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yJywgY2xlYXJjb2F0Um91Z2huZXNzRmFjdG9yKTtcbiAgICAvLyBDbGVhckNvYXQgUm91Z2huZXNzIFRleHR1cmVcbiAgICBjb25zdCBjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlID0gS0hSX21hdGVyaWFsc19jbGVhcmNvYXQuY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZTtcbiAgICBpZiAoY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkNsZWFyQ29hdFJvdWdobmVzc1RleHR1cmUgPSByblRleHR1cmVzW2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZScsIHJuQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdjbGVhcmNvYXRSb3VnaG5lc3NUZXhjb29yZEluZGV4JywgY2xlYXJjb2F0Um91Z2huZXNzVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBDbGVhckNvYXQgUm91Z2huZXNzIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdjbGVhcmNvYXRSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2NsZWFyY29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICAgIC8vIENsZWFyQ29hdCBOb3JtYWwgVGV4dHVyZVxuICAgIGNvbnN0IGNsZWFyY29hdE5vcm1hbFRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2NsZWFyY29hdC5jbGVhcmNvYXROb3JtYWxUZXh0dXJlO1xuICAgIGlmIChjbGVhcmNvYXROb3JtYWxUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuQ2xlYXJDb2F0Tm9ybWFsVGV4dHVyZSA9IHJuVGV4dHVyZXNbY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdjbGVhcmNvYXROb3JtYWxUZXh0dXJlJywgcm5DbGVhckNvYXROb3JtYWxUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGNsZWFyY29hdE5vcm1hbFRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2NsZWFyY29hdE5vcm1hbFRleGNvb3JkSW5kZXgnLCBjbGVhcmNvYXROb3JtYWxUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIENsZWFyQ29hdCBOb3JtYWwgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGNsZWFyY29hdE5vcm1hbFRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2NsZWFyY29hdE5vcm1hbFRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnY2xlYXJjb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfdm9sdW1lIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX3ZvbHVtZShcbiAgbWF0ZXJpYWxKc29uOiBSbk0yTWF0ZXJpYWwsXG4gIG1hdGVyaWFsOiBNYXRlcmlhbCxcbiAgX2dsdGZNb2RlbDogUm5NMixcbiAgcm5UZXh0dXJlczogVGV4dHVyZVtdLFxuICByblNhbXBsZXJzOiBTYW1wbGVyW11cbik6IHZvaWQge1xuICBjb25zdCBLSFJfbWF0ZXJpYWxzX3ZvbHVtZSA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc192b2x1bWU7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3ZvbHVtZSkpIHtcbiAgICBjb25zdCB0aGlja25lc3NGYWN0b3IgPSBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS50aGlja25lc3NGYWN0b3IgPyBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS50aGlja25lc3NGYWN0b3IgOiAwLjA7XG4gICAgaWYgKHRoaWNrbmVzc0ZhY3RvciAhPSBudWxsKSB7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3RoaWNrbmVzc0ZhY3RvcicsIHRoaWNrbmVzc0ZhY3Rvcik7XG4gICAgfVxuICAgIGNvbnN0IHRoaWNrbmVzc1RleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS50aGlja25lc3NUZXh0dXJlO1xuICAgIGlmICh0aGlja25lc3NUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuVGhpY2tuZXNzVGV4dHVyZSA9IHJuVGV4dHVyZXNbdGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbdGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCd0aGlja25lc3NUZXh0dXJlJywgcm5UaGlja25lc3NUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHRoaWNrbmVzc1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3RoaWNrbmVzc1RleGNvb3JkSW5kZXgnLCB0aGlja25lc3NUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIFRoaWNrbmVzcyBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgdGhpY2tuZXNzVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICd0aGlja25lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAndGhpY2tuZXNzVGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICd0aGlja25lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBJTkYgPSAxZTIwO1xuICAgIGNvbnN0IGF0dGVudWF0aW9uRGlzdGFuY2UgPSBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS5hdHRlbnVhdGlvbkRpc3RhbmNlXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfdm9sdW1lLmF0dGVudWF0aW9uRGlzdGFuY2VcbiAgICAgIDogSU5GO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignYXR0ZW51YXRpb25EaXN0YW5jZScsIGF0dGVudWF0aW9uRGlzdGFuY2UpO1xuICAgIGNvbnN0IGF0dGVudWF0aW9uQ29sb3IgPSBLSFJfbWF0ZXJpYWxzX3ZvbHVtZS5hdHRlbnVhdGlvbkNvbG9yXG4gICAgICA/IFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoS0hSX21hdGVyaWFsc192b2x1bWUuYXR0ZW51YXRpb25Db2xvcilcbiAgICAgIDogVmVjdG9yMy5mcm9tQ29weTMoMS4wLCAxLjAsIDEuMCk7XG4gICAgaWYgKGF0dGVudWF0aW9uQ29sb3IgIT0gbnVsbCkge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhdHRlbnVhdGlvbkNvbG9yJywgYXR0ZW51YXRpb25Db2xvcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX3NoZWVuIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX3NoZWVuKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfc2hlZW4gPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfc2hlZW47XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NoZWVuKSkge1xuICAgIGNvbnN0IHNoZWVuQ29sb3JGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuQ29sb3JGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Db2xvckZhY3RvclxuICAgICAgOiBbMC4wLCAwLjAsIDAuMF07XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGVlbkNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhzaGVlbkNvbG9yRmFjdG9yKSk7XG4gICAgY29uc3Qgc2hlZW5Db2xvclRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX3NoZWVuLnNoZWVuQ29sb3JUZXh0dXJlO1xuICAgIGlmIChzaGVlbkNvbG9yVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblNoZWVuQ29sb3JUZXh0dXJlID0gcm5UZXh0dXJlc1tzaGVlbkNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc2hlZW5Db2xvclRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc2hlZW5Db2xvclRleHR1cmUnLCByblNoZWVuQ29sb3JUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNoZWVuQ29sb3JUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGVlbkNvbG9yVGV4Y29vcmRJbmRleCcsIHNoZWVuQ29sb3JUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIFNoZWVuIENvbG9yIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBzaGVlbkNvbG9yVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdzaGVlbkNvbG9yVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ3NoZWVuQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3NoZWVuQ29sb3JUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBzaGVlblJvdWdobmVzc0ZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Sb3VnaG5lc3NGYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfc2hlZW4uc2hlZW5Sb3VnaG5lc3NGYWN0b3JcbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc2hlZW5Sb3VnaG5lc3NGYWN0b3InLCBzaGVlblJvdWdobmVzc0ZhY3Rvcik7XG4gICAgY29uc3Qgc2hlZW5Sb3VnaG5lc3NUZXh0dXJlID0gS0hSX21hdGVyaWFsc19zaGVlbi5zaGVlblJvdWdobmVzc1RleHR1cmU7XG4gICAgaWYgKHNoZWVuUm91Z2huZXNzVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCByblNoZWVuUm91Z2huZXNzVGV4dHVyZSA9IHJuVGV4dHVyZXNbc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzaGVlblJvdWdobmVzc1RleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignc2hlZW5Sb3VnaG5lc3NUZXh0dXJlJywgcm5TaGVlblJvdWdobmVzc1RleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc2hlZW5Sb3VnaG5lc3NUZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdzaGVlblJvdWdobmVzc1RleGNvb3JkSW5kZXgnLCBzaGVlblJvdWdobmVzc1RleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gU2hlZW4gUm91Z2huZXNzIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBzaGVlblJvdWdobmVzc1RleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnc2hlZW5Sb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3NoZWVuUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfc3BlY3VsYXIoXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19zcGVjdWxhciA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19zcGVjdWxhcjtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIpKSB7XG4gICAgY29uc3Qgc3BlY3VsYXJGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX3NwZWN1bGFyLnNwZWN1bGFyRmFjdG9yXG4gICAgICA6IDEuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NwZWN1bGFyRmFjdG9yJywgc3BlY3VsYXJGYWN0b3IpO1xuICAgIGNvbnN0IHNwZWN1bGFyVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJUZXh0dXJlO1xuICAgIGlmIChzcGVjdWxhclRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5TcGVjdWxhclRleHR1cmUgPSByblRleHR1cmVzW3NwZWN1bGFyVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbc3BlY3VsYXJUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3NwZWN1bGFyVGV4dHVyZScsIHJuU3BlY3VsYXJUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKHNwZWN1bGFyVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignc3BlY3VsYXJUZXhjb29yZEluZGV4Jywgc3BlY3VsYXJUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIFNwZWN1bGFyIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBzcGVjdWxhclRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnc3BlY3VsYXJUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnc3BlY3VsYXJUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ3NwZWN1bGFyVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3Qgc3BlY3VsYXJDb2xvckZhY3RvciA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJDb2xvckZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19zcGVjdWxhci5zcGVjdWxhckNvbG9yRmFjdG9yXG4gICAgICA6IFsxLjAsIDEuMCwgMS4wXTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NwZWN1bGFyQ29sb3JGYWN0b3InLCBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKHNwZWN1bGFyQ29sb3JGYWN0b3IpKTtcbiAgICBjb25zdCBzcGVjdWxhckNvbG9yVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfc3BlY3VsYXIuc3BlY3VsYXJDb2xvclRleHR1cmU7XG4gICAgaWYgKHNwZWN1bGFyQ29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuU3BlY3VsYXJDb2xvclRleHR1cmUgPSByblRleHR1cmVzW3NwZWN1bGFyQ29sb3JUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1tzcGVjdWxhckNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdzcGVjdWxhckNvbG9yVGV4dHVyZScsIHJuU3BlY3VsYXJDb2xvclRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoc3BlY3VsYXJDb2xvclRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ3NwZWN1bGFyQ29sb3JUZXhjb29yZEluZGV4Jywgc3BlY3VsYXJDb2xvclRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gU3BlY3VsYXIgQ29sb3IgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIHNwZWN1bGFyQ29sb3JUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ3NwZWN1bGFyQ29sb3JUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnc3BlY3VsYXJDb2xvclRleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnc3BlY3VsYXJDb2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2lvciBleHRlbnNpb24gcGFyYW1ldGVyc1xuICogQHBhcmFtIG1hdGVyaWFsSnNvbiAtIFRoZSBtYXRlcmlhbCBKU09OIGRhdGFcbiAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCB0byBjb25maWd1cmVcbiAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBkYXRhXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfaW9yKG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLCBtYXRlcmlhbDogTWF0ZXJpYWwsIF9nbHRmTW9kZWw6IFJuTTIpIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19pb3IgPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfaW9yO1xuICBpZiAoSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pb3IpKSB7XG4gICAgY29uc3QgaW9yID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pb3IuaW9yKSA/IEtIUl9tYXRlcmlhbHNfaW9yLmlvciA6IDEuNTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lvcicsIGlvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UgZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICogQHBhcmFtIHJuVGV4dHVyZXMgLSBBcnJheSBvZiBSaG9kb25pdGUgdGV4dHVyZXNcbiAqIEBwYXJhbSByblNhbXBsZXJzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHNhbXBsZXJzXG4gKi9cbmZ1bmN0aW9uIHNldHVwX0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UoXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZTtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UpKSB7XG4gICAgY29uc3QgaXJpZGVzY2VuY2VGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlRmFjdG9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlRmFjdG9yXG4gICAgICA6IDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlRmFjdG9yJywgaXJpZGVzY2VuY2VGYWN0b3IpO1xuICAgIGNvbnN0IGlyaWRlc2NlbmNlVGV4dHVyZSA9IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUZXh0dXJlO1xuICAgIGlmIChpcmlkZXNjZW5jZVRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5JcmlkZXNjZW5jZVRleHR1cmUgPSByblRleHR1cmVzW2lyaWRlc2NlbmNlVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbaXJpZGVzY2VuY2VUZXh0dXJlLnRleHR1cmUhLnNhbXBsZXIhXTtcbiAgICAgIG1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGV4dHVyZScsIHJuSXJpZGVzY2VuY2VUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGlyaWRlc2NlbmNlVGV4dHVyZS50ZXhDb29yZCAhPSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VUZXhjb29yZEluZGV4JywgaXJpZGVzY2VuY2VUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIElyaWRlc2NlbmNlIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBpcmlkZXNjZW5jZVRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnaXJpZGVzY2VuY2VUZXh0dXJlVHJhbnNmb3JtU2NhbGUnLFxuICAgICAgICAnaXJpZGVzY2VuY2VUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2lyaWRlc2NlbmNlVGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgaXJpZGVzY2VuY2VJb3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlSW9yKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlSW9yXG4gICAgICA6IDEuMztcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlSW9yJywgaXJpZGVzY2VuY2VJb3IpO1xuXG4gICAgY29uc3QgaXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZS5pcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0pXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtXG4gICAgICA6IDEwMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtJywgaXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtKTtcblxuICAgIGNvbnN0IGlyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bSA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UuaXJpZGVzY2VuY2VUaGlja25lc3NNYXhpbXVtKVxuICAgICAgPyBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bVxuICAgICAgOiA0MDAuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bScsIGlyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bSk7XG5cbiAgICBjb25zdCBpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlLmlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZTtcbiAgICBpZiAoaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuSXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlID0gcm5UZXh0dXJlc1tpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUudGV4dHVyZSEuc291cmNlIV07XG4gICAgICBjb25zdCByblNhbXBsZXIgPSByblNhbXBsZXJzW2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUnLCBybklyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSwgcm5TYW1wbGVyKTtcbiAgICAgIGlmIChpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4Y29vcmRJbmRleCcsIGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZS50ZXhDb29yZCk7XG4gICAgICB9XG4gICAgICAvLyBJcmlkZXNjZW5jZSBUaGlja25lc3MgVGV4dHVyZSBUcmFuc2Zvcm1cbiAgICAgIE1vZGVsQ29udmVydGVyLl9zZXR1cFRleHR1cmVUcmFuc2Zvcm0oXG4gICAgICAgIGlyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdpcmlkZXNjZW5jZVRoaWNrbmVzc1RleHR1cmVUcmFuc2Zvcm1PZmZzZXQnLFxuICAgICAgICAnaXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5IGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkoXG4gIG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLFxuICBtYXRlcmlhbDogTWF0ZXJpYWwsXG4gIF9nbHRmTW9kZWw6IFJuTTIsXG4gIHJuVGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgcm5TYW1wbGVyczogU2FtcGxlcltdXG4pIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5ID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHk7XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkpKSB7XG4gICAgY29uc3QgYW5pc290cm9weVN0cmVuZ3RoID0gSXMuZXhpc3QoS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5LmFuaXNvdHJvcHlTdHJlbmd0aClcbiAgICAgID8gS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5LmFuaXNvdHJvcHlTdHJlbmd0aFxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhbmlzb3Ryb3B5U3RyZW5ndGgnLCBhbmlzb3Ryb3B5U3RyZW5ndGgpO1xuICAgIGNvbnN0IGFuaXNvdHJvcHlSb3RhdGlvbiA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5Um90YXRpb24pXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfYW5pc290cm9weS5hbmlzb3Ryb3B5Um90YXRpb25cbiAgICAgIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcihcbiAgICAgICdhbmlzb3Ryb3B5Um90YXRpb24nLFxuICAgICAgVmVjdG9yMi5mcm9tQ29weTIoTWF0aC5jb3MoYW5pc290cm9weVJvdGF0aW9uKSwgTWF0aC5zaW4oYW5pc290cm9weVJvdGF0aW9uKSlcbiAgICApO1xuXG4gICAgY29uc3QgYW5pc290cm9weVRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2FuaXNvdHJvcHkuYW5pc290cm9weVRleHR1cmU7XG4gICAgaWYgKGFuaXNvdHJvcHlUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuQW5pc290cm9weVRleHR1cmUgPSByblRleHR1cmVzW2FuaXNvdHJvcHlUZXh0dXJlLnRleHR1cmUhLnNvdXJjZSFdO1xuICAgICAgY29uc3Qgcm5TYW1wbGVyID0gcm5TYW1wbGVyc1thbmlzb3Ryb3B5VGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdhbmlzb3Ryb3B5VGV4dHVyZScsIHJuQW5pc290cm9weVRleHR1cmUsIHJuU2FtcGxlcik7XG4gICAgICBpZiAoYW5pc290cm9weVRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2FuaXNvdHJvcHlUZXhjb29yZEluZGV4JywgYW5pc290cm9weVRleHR1cmUudGV4Q29vcmQpO1xuICAgICAgfVxuICAgICAgLy8gQW5pc290cm9weSBUZXh0dXJlIFRyYW5zZm9ybVxuICAgICAgTW9kZWxDb252ZXJ0ZXIuX3NldHVwVGV4dHVyZVRyYW5zZm9ybShcbiAgICAgICAgYW5pc290cm9weVRleHR1cmUsXG4gICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAnYW5pc290cm9weVRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdhbmlzb3Ryb3B5VGV4dHVyZVRyYW5zZm9ybU9mZnNldCcsXG4gICAgICAgICdhbmlzb3Ryb3B5VGV4dHVyZVRyYW5zZm9ybVJvdGF0aW9uJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIEtIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGggZXh0ZW5zaW9uIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSBtYXRlcmlhbEpzb24gLSBUaGUgbWF0ZXJpYWwgSlNPTiBkYXRhXG4gKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gY29uZmlndXJlXG4gKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgZGF0YVxuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2VtaXNzaXZlX3N0cmVuZ3RoKG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLCBtYXRlcmlhbDogTWF0ZXJpYWwsIF9nbHRmTW9kZWw6IFJuTTIpIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aCA9IG1hdGVyaWFsSnNvbj8uZXh0ZW5zaW9ucz8uS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aDtcbiAgaWYgKElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGgpKSB7XG4gICAgY29uc3QgZW1pc3NpdmVTdHJlbmd0aCA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZW1pc3NpdmVfc3RyZW5ndGguZW1pc3NpdmVTdHJlbmd0aClcbiAgICAgID8gS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aC5lbWlzc2l2ZVN0cmVuZ3RoXG4gICAgICA6IDEuMDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2VtaXNzaXZlU3RyZW5ndGgnLCBlbWlzc2l2ZVN0cmVuZ3RoKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqL1xuZnVuY3Rpb24gc2V0dXBfS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uKG1hdGVyaWFsSnNvbjogUm5NMk1hdGVyaWFsLCBtYXRlcmlhbDogTWF0ZXJpYWwsIF9nbHRmTW9kZWw6IFJuTTIpIHtcbiAgY29uc3QgS0hSX21hdGVyaWFsc19kaXNwZXJzaW9uID0gbWF0ZXJpYWxKc29uPy5leHRlbnNpb25zPy5LSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb247XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2Rpc3BlcnNpb24pKSB7XG4gICAgY29uc3QgZGlzcGVyc2lvbiA9IElzLmV4aXN0KEtIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbi5kaXNwZXJzaW9uKSA/IEtIUl9tYXRlcmlhbHNfZGlzcGVyc2lvbi5kaXNwZXJzaW9uIDogMC4wO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlzcGVyc2lvbicsIGRpc3BlcnNpb24pO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uIGV4dGVuc2lvbiBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gbWF0ZXJpYWxKc29uIC0gVGhlIG1hdGVyaWFsIEpTT04gZGF0YVxuICogQHBhcmFtIG1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGNvbmZpZ3VyZVxuICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGRhdGFcbiAqIEBwYXJhbSByblRleHR1cmVzIC0gQXJyYXkgb2YgUmhvZG9uaXRlIHRleHR1cmVzXG4gKiBAcGFyYW0gcm5TYW1wbGVycyAtIEFycmF5IG9mIFJob2Rvbml0ZSBzYW1wbGVyc1xuICovXG5mdW5jdGlvbiBzZXR1cF9LSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uKFxuICBtYXRlcmlhbEpzb246IFJuTTJNYXRlcmlhbCxcbiAgbWF0ZXJpYWw6IE1hdGVyaWFsLFxuICBfZ2x0Zk1vZGVsOiBSbk0yLFxuICByblRleHR1cmVzOiBUZXh0dXJlW10sXG4gIHJuU2FtcGxlcnM6IFNhbXBsZXJbXVxuKSB7XG4gIGNvbnN0IEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24gPSBtYXRlcmlhbEpzb24/LmV4dGVuc2lvbnM/LktIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb247XG4gIGlmIChJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uKSkge1xuICAgIGNvbnN0IGRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25GYWN0b3IpXG4gICAgICA/IEtIUl9tYXRlcmlhbHNfZGlmZnVzZV90cmFuc21pc3Npb24uZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3RvclxuICAgICAgOiAwLjA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uRmFjdG9yJywgZGlmZnVzZVRyYW5zbWlzc2lvbkZhY3Rvcik7XG4gICAgY29uc3QgZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUgPSBLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlO1xuICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBybkRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlID0gcm5UZXh0dXJlc1tkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUudGV4dHVyZSEuc2FtcGxlciFdO1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvblRleHR1cmUnLCBybkRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLnRleENvb3JkICE9IG51bGwpIHtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4Y29vcmRJbmRleCcsIGRpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIERpZmZ1c2UgVHJhbnNtaXNzaW9uIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZSxcbiAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uVGV4dHVyZVRyYW5zZm9ybVNjYWxlJyxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25UZXh0dXJlVHJhbnNmb3JtUm90YXRpb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3IgPSBJcy5leGlzdChLSFJfbWF0ZXJpYWxzX2RpZmZ1c2VfdHJhbnNtaXNzaW9uLmRpZmZ1c2VUcmFuc21pc3Npb25Db2xvckZhY3RvcilcbiAgICAgID8gS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3JcbiAgICAgIDogWzEuMCwgMS4wLCAxLjBdO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yRmFjdG9yJywgVmVjdG9yMy5mcm9tQ29weUFycmF5MyhkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JGYWN0b3IpKTtcbiAgICBjb25zdCBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlID0gS0hSX21hdGVyaWFsc19kaWZmdXNlX3RyYW5zbWlzc2lvbi5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlO1xuICAgIGlmIChkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuRGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZSA9IHJuVGV4dHVyZXNbZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zb3VyY2UhXTtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IHJuU2FtcGxlcnNbZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yVGV4dHVyZS50ZXh0dXJlIS5zYW1wbGVyIV07XG4gICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKCdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlJywgcm5EaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLCByblNhbXBsZXIpO1xuICAgICAgaWYgKGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmUudGV4Q29vcmQgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleGNvb3JkSW5kZXgnLCBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLnRleENvb3JkKTtcbiAgICAgIH1cbiAgICAgIC8vIERpZmZ1c2UgVHJhbnNtaXNzaW9uIENvbG9yIFRleHR1cmUgVHJhbnNmb3JtXG4gICAgICBNb2RlbENvbnZlcnRlci5fc2V0dXBUZXh0dXJlVHJhbnNmb3JtKFxuICAgICAgICBkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlLFxuICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmVUcmFuc2Zvcm1TY2FsZScsXG4gICAgICAgICdkaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3JUZXh0dXJlVHJhbnNmb3JtT2Zmc2V0JyxcbiAgICAgICAgJ2RpZmZ1c2VUcmFuc21pc3Npb25Db2xvclRleHR1cmVUcmFuc2Zvcm1Sb3RhdGlvbidcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUE7QUFBQSxFQUlFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBc0JQLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsK0JBQStCO0FBQ3hDLFNBQVMsMkJBQTJCO0FBRXBDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMs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O0FBQ3RDLFVBQU0sYUFBYSxHQUFHLE1BQU0seUJBQXlCLFVBQVUsSUFBSSx5QkFBeUIsYUFBYTtBQUN6RyxhQUFTLGFBQWEsY0FBYyxVQUFVO0FBQUEsRUFDaEQ7QUFDRjtBQVVBLFNBQVMseUNBQ1AsY0FDQSxVQUNBLFlBQ0EsWUFDQSxZQUNBO0FBMWxJRjtBQTJsSUUsUUFBTSxzQ0FBcUMsa0RBQWMsZUFBZCxtQkFBMEI7QUFDckUsTUFBSSxHQUFHLE1BQU0sa0NBQWtDLEdBQUc7QUFDaEQsVUFBTSw0QkFBNEIsR0FBRyxNQUFNLG1DQUFtQyx5QkFBeUIsSUFDbkcsbUNBQW1DLDRCQUNuQztBQUNKLGFBQVMsYUFBYSw2QkFBNkIseUJBQXlCO0FBQzVFLFVBQU0sNkJBQTZCLG1DQUFtQztBQUN0RSxRQUFJLDhCQUE4QixNQUFNO0FBQ3RDLFlBQU0sK0JBQStCLFdBQVcsMkJBQTJCLFFBQVMsTUFBTztBQUMzRixZQUFNLFlBQVksV0FBVywyQkFBMkIsUUFBUyxPQUFRO0FBQ3pFLGVBQVMsb0JBQW9CLDhCQUE4Qiw4QkFBOEIsU0FBUztBQUNsRyxVQUFJLDJCQUEyQixZQUFZLE1BQU07QUFDL0MsaUJBQVMsYUFBYSxvQ0FBb0MsMkJBQTJCLFFBQVE7QUFBQSxNQUMvRjtBQUVBLHFCQUFlO0FBQUEsUUFDYjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFVBQU0saUNBQWlDLEdBQUcsTUFBTSxtQ0FBbUMsOEJBQThCLElBQzdHLG1DQUFtQyxpQ0FDbkMsQ0FBQyxHQUFLLEdBQUssQ0FBRztBQUNsQixhQUFTLGFBQWEsa0NBQWtDLFFBQVEsZUFBZSw4QkFBOEIsQ0FBQztBQUM5RyxVQUFNLGtDQUFrQyxtQ0FBbUM7QUFDM0UsUUFBSSxtQ0FBbUMsTUFBTTtBQUMzQyxZQUFNLG9DQUFvQyxXQUFXLGdDQUFnQyxRQUFTLE1BQU87QUFDckcsWUFBTSxZQUFZLFdBQVcsZ0NBQWdDLFFBQVMsT0FBUTtBQUM5RSxlQUFTLG9CQUFvQixtQ0FBbUMsbUNBQW1DLFNBQVM7QUFDNUcsVUFBSSxnQ0FBZ0MsWUFBWSxNQUFNO0FBQ3BELGlCQUFTLGFBQWEseUNBQXlDLGdDQUFnQyxRQUFRO0FBQUEsTUFDekc7QUFFQSxxQkFBZTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9hIiwgImkiLCAicm5Mb2FkZXJPcHRpb25zIiwgIm1hdGVyaWFsIiwgInJuQnVmZmVyVmlldyJdCn0K
