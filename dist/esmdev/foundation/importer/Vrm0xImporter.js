// src/foundation/importer/Vrm0xImporter.ts
import { PhysicsComponent } from "../components/Physics/PhysicsComponent.js";
import { VrmComponent } from "../components/Vrm/VrmComponent.js";
import { TextureParameter } from "../definitions/index.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
import { Ok } from "../misc/Result.js";
import { SphereCollider } from "../physics/VRMSpring/SphereCollider.js";
import { VRMColliderGroup } from "../physics/VRMSpring/VRMColliderGroup.js";
import { VRMSpring } from "../physics/VRMSpring/VRMSpring.js";
import { VRMSpringBone } from "../physics/VRMSpring/VRMSpringBone.js";
import { VRMSpringBonePhysicsStrategy } from "../physics/VRMSpring/VRMSpringBonePhysicsStrategy.js";
import { RenderPass } from "../renderer/RenderPass.js";
import { Sampler } from "../textures/Sampler.js";
import { Texture } from "../textures/Texture.js";
import { Gltf2Importer } from "./Gltf2Importer.js";
import { ModelConverter } from "./ModelConverter.js";
var Vrm0xImporter = class _Vrm0xImporter {
  constructor() {
  }
  /**
   * Imports a VRM file from the specified URL and converts it to Rhodonite scene graph entities.
   * This method handles the complete VRM import pipeline including textures, materials,
   * spring bone physics, humanoid mapping, and expression setup.
   *
   * @param url - The URL of the VRM file to import
   * @param options - Optional loading configuration including material helpers and render states
   * @returns A promise that resolves to an array of scene graph entities (main + optional outline)
   */
  static async importFromUrl(engine, url, options) {
    var _a, _b;
    options = this._getOptions(options);
    const result = await Gltf2Importer.importFromUrl(url, options);
    const gltfModel = result;
    const textures = await _Vrm0xImporter._createTextures(engine, gltfModel);
    const samplers = _Vrm0xImporter._createSamplers(engine, gltfModel);
    const defaultMaterialHelperArgumentArray = (_b = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) == null ? void 0 : _b.defaultMaterialHelperArgumentArray;
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = textures;
      defaultMaterialHelperArgumentArray[0].samplers = samplers;
    }
    _Vrm0xImporter._initializeMaterialProperties(gltfModel, textures.length);
    let rootGroups;
    const rootGroupMain = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
    const existOutline = _Vrm0xImporter._existOutlineMaterial(gltfModel.extensions.VRM);
    if (existOutline) {
      if (Is.exist(defaultMaterialHelperArgumentArray)) {
        defaultMaterialHelperArgumentArray[0].isOutline = true;
      }
      const rootGroupOutline = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
      rootGroups = [rootGroupMain, rootGroupOutline];
    } else {
      rootGroups = [rootGroupMain];
    }
    _Vrm0xImporter._readSpringBone(engine, gltfModel);
    _Vrm0xImporter._readVRMHumanoidInfo(gltfModel, rootGroupMain);
    return new Ok(rootGroups);
  }
  /**
   * Imports only the JSON data from a VRM file without creating scene graph entities.
   * This is useful for extracting VRM metadata, humanoid bone mappings, and other
   * configuration data without the overhead of full scene construction.
   *
   * @param uri - The URI of the VRM file to import
   * @param options - Optional loading configuration
   * @returns A promise that resolves to the VRM JSON data structure
   */
  static async importJsonOfVRM(uri, options) {
    options = this._getOptions(options);
    const result = await Gltf2Importer.importFromUrl(uri, options);
    _Vrm0xImporter._readVRMHumanoidInfo(result);
    return result;
  }
  /**
   * Internal method for importing VRM 0.x data into existing render passes.
   * This method handles the complete VRM processing pipeline including material setup,
   * outline rendering, spring bone physics, and humanoid configuration.
   *
   * @param engine - The engine instance
   * @param gltfModel - The loaded GLTF model data with VRM extensions
   * @param renderPasses - Array of render passes to add the VRM entities to
   */
  static async __importVRM0x(engine, gltfModel, renderPasses) {
    var _a, _b, _c, _d, _e, _f;
    const defaultMaterialHelperArgumentArray = (_b = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) == null ? void 0 : _b.defaultMaterialHelperArgumentArray;
    const textures = await this._createTextures(engine, gltfModel);
    const samplers = this._createSamplers(engine, gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = (_c = defaultMaterialHelperArgumentArray[0].textures) != null ? _c : textures;
      defaultMaterialHelperArgumentArray[0].samplers = (_d = defaultMaterialHelperArgumentArray[0].samplers) != null ? _d : samplers;
      defaultMaterialHelperArgumentArray[0].isLighting = (_e = defaultMaterialHelperArgumentArray[0].isLighting) != null ? _e : true;
    }
    this._initializeMaterialProperties(gltfModel, textures.length);
    let rootGroup;
    const existOutline = this._existOutlineMaterial(gltfModel.extensions.VRM);
    if (existOutline) {
      renderPasses[1] = (_f = renderPasses[1]) != null ? _f : new RenderPass(engine);
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM.rnExtension = {
        renderPassOutline
      };
      rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
    }
    const renderPassMain = renderPasses[0];
    renderPassMain.tryToSetUniqueName("VRM Main RenderPass", true);
    renderPassMain.addEntities([rootGroup]);
    this._readSpringBone(engine, gltfModel);
    this._readVRMHumanoidInfo(gltfModel, rootGroup);
    this._readBlendShapeGroup(gltfModel, rootGroup);
    rootGroup.localEulerAngles = Vector3.fromCopyArray([0, Math.PI, 0]);
  }
  /**
   * Processes VRM blend shape groups and converts them to Rhodonite VRM expressions.
   * This method extracts facial expressions, eye blinks, and other morph target animations
   * from the VRM blend shape master and creates the corresponding VRM component.
   *
   * @param gltfModel - The VRM model data containing blend shape information
   * @param rootEntity - The root entity to attach the VRM component to
   */
  static _readBlendShapeGroup(gltfModel, rootEntity) {
    const vrmExpressions = [];
    const blendShapeGroups = gltfModel.extensions.VRM.blendShapeMaster.blendShapeGroups;
    for (const blendShapeGroup of blendShapeGroups) {
      const vrmExpression = {
        name: blendShapeGroup.presetName === "unknown" ? blendShapeGroup.name : blendShapeGroup.presetName,
        isBinary: blendShapeGroup.isBinary,
        binds: blendShapeGroup.binds.map((bind) => {
          for (let i = 0; i < gltfModel.nodes.length; i++) {
            const node = gltfModel.nodes[i];
            if (node.mesh === bind.mesh) {
              const rnEntity = gltfModel.extras.rnEntities[i];
              return {
                entityIdx: rnEntity.entityUID,
                blendShapeIdx: bind.index,
                weight: bind.weight / 100
              };
            }
          }
          throw new Error("Not Found node in blendShapeGroup Process");
        })
      };
      vrmExpressions.push(vrmExpression);
    }
    const vrmEntity = rootEntity.engine.entityRepository.addComponentToEntity(VrmComponent, rootEntity);
    vrmEntity.getVrm().setVrmExpressions(vrmExpressions);
    vrmEntity.getVrm()._version = "0.x";
  }
  /**
   * Extracts and processes VRM humanoid bone mapping information.
   * This method creates a mapping between VRM standard bone names and the actual
   * scene graph nodes, which is essential for animation retargeting and IK.
   *
   * @param gltfModel - The VRM model data containing humanoid bone definitions
   * @param rootEntity - Optional root entity to attach the bone mapping metadata to
   */
  static _readVRMHumanoidInfo(gltfModel, rootEntity) {
    const humanBones = gltfModel.extensions.VRM.humanoid.humanBones;
    const mapNameNodeId = /* @__PURE__ */ new Map();
    for (const bone of humanBones) {
      mapNameNodeId.set(bone.bone, bone.node);
      const boneNode = gltfModel.nodes[bone.node];
      bone.name = boneNode.name;
    }
    if (rootEntity != null) {
      rootEntity.tryToSetTag({
        tag: "humanoid_map_name_nodeId",
        value: mapNameNodeId
      });
    }
  }
  /**
   * Processes VRM spring bone physics configuration and creates the physics simulation setup.
   * This method handles collider groups, spring bone chains, and physics parameters
   * to enable realistic secondary motion for hair, clothing, and accessories.
   *
   * @param engine - The engine instance
   * @param gltfModel - The VRM model data containing spring bone and collider definitions
   */
  static _readSpringBone(engine, gltfModel) {
    const colliderGroups = [];
    for (const colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation.colliderGroups) {
      const colliderGroup = gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[colliderGroupIdx];
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders = [];
      const baseSg = gltfModel.asset.extras.rnEntities[colliderGroup.node].getSceneGraph();
      for (const collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider(
          engine,
          Vector3.fromCopyArray([
            collider.offset.x,
            collider.offset.y,
            -collider.offset.z
            // z is opposite in VRM0.x
          ]),
          collider.radius,
          baseSg
        );
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.sphereColliders = colliders;
    }
    const boneGroups = [];
    for (const boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      if (boneGroup.bones == null || boneGroup.bones.length === 0) continue;
      const jointRootIndex = boneGroup.bones[0];
      const jointRootEntity = gltfModel.asset.extras.rnEntities[jointRootIndex];
      const vrmSpringBoneGroup = new VRMSpring(jointRootEntity.getSceneGraph());
      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.colliderGroups = boneGroup.colliderGroups.map((colliderGroupIndex) => {
        return colliderGroups[colliderGroupIndex];
      });
      const addedEntities = [];
      for (const idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras.rnEntities[boneNodeIndex];
        this.__addSpringBoneRecursively(vrmSpringBoneGroup, entity, boneGroup, addedEntities);
      }
      if (boneGroup.center != null && boneGroup.center !== -1) {
        vrmSpringBoneGroup.center = gltfModel.asset.extras.rnEntities[boneGroup.center].getSceneGraph();
      }
      boneGroups.push(vrmSpringBoneGroup);
    }
    for (const boneGroup of boneGroups) {
      this.__addPhysicsComponent(boneGroup, boneGroup.rootBone);
    }
  }
  /**
   * Recursively adds spring bone physics to a bone chain and its children.
   * This method traverses the bone hierarchy and applies spring physics parameters
   * to create natural secondary motion effects.
   *
   * @param vrmSpring - The VRM spring bone group to add bones to
   * @param entity - The current entity in the bone hierarchy
   * @param boneGroup - The VRM bone group configuration data
   * @param addedEntities - Array to track already processed entities to avoid duplicates
   */
  static __addSpringBoneRecursively(vrmSpring, entity, boneGroup, addedEntities) {
    const sg = entity.getSceneGraph();
    const children = sg.children;
    if (!addedEntities.includes(entity)) {
      const springBone = new VRMSpringBone(entity);
      springBone.dragForce = boneGroup.dragForce;
      springBone.stiffnessForce = boneGroup.stiffiness;
      springBone.gravityPower = boneGroup.gravityPower;
      springBone.gravityDir = Vector3.fromCopyArray([
        boneGroup.gravityDir.x,
        boneGroup.gravityDir.y,
        boneGroup.gravityDir.z
      ]);
      springBone.hitRadius = boneGroup.hitRadius;
      vrmSpring.bones.push(springBone);
      addedEntities.push(entity);
    }
    for (const child of children) {
      this.__addSpringBoneRecursively(vrmSpring, child.entity, boneGroup, addedEntities);
    }
  }
  /**
   * Adds a physics component with VRM spring bone strategy to an entity.
   * This method sets up the physics simulation for spring bone motion,
   * attaching the appropriate strategy and configuration.
   *
   * @param boneGroup - The VRM spring bone group containing physics parameters
   * @param sg - The scene graph component to attach physics to
   */
  static __addPhysicsComponent(boneGroup, sg) {
    const entity = sg.entity;
    const newEntity = entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new VRMSpringBonePhysicsStrategy();
    strategy.setSpring(boneGroup);
    physicsComponent.setStrategy(strategy);
  }
  /**
   * Creates Rhodonite texture objects from GLTF texture data.
   * This method processes all textures in the GLTF model and creates additional
   * dummy textures (white and black) commonly used in VRM materials.
   *
   * @param gltfModel - The GLTF model containing texture definitions
   * @returns A promise that resolves to an array of created textures
   */
  static async _createTextures(engine, gltfModel) {
    if (!gltfModel.textures) gltfModel.textures = [];
    const gltfTextures = gltfModel.textures;
    const rnTextures = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = await ModelConverter._createTexture(engine, gltfTextures[i].sourceObject, gltfModel);
      rnTextures[i] = rnTexture;
    }
    const dummyWhiteTexture = new Texture(engine);
    await dummyWhiteTexture.generate1x1TextureFrom();
    dummyWhiteTexture.markAsDummyTexture();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture(engine);
    await dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    dummyBlackTexture.markAsDummyTexture();
    rnTextures.push(dummyBlackTexture);
    return rnTextures;
  }
  /**
   * Creates Rhodonite sampler objects from GLTF sampler data.
   * This method processes texture sampling configuration and creates additional
   * dummy samplers for textures that don't specify sampling parameters.
   *
   * @param gltfModel - The GLTF model containing sampler definitions
   * @returns An array of created sampler objects
   */
  static _createSamplers(engine, gltfModel) {
    if (!gltfModel.textures) gltfModel.textures = [];
    const gltfTextures = gltfModel.textures;
    const rnSamplers = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnSampler = ModelConverter._createSampler(engine, gltfTextures[i].samplerObject);
      rnSamplers[i] = rnSampler;
    }
    const dummySampler = new Sampler(engine, {
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear
    });
    dummySampler.create();
    rnSamplers.push(dummySampler);
    rnSamplers.push(dummySampler);
    return rnSamplers;
  }
  /**
   * Checks if any materials in the VRM have outline rendering enabled.
   * This method examines material properties to determine if a separate
   * outline render pass is needed for toon-style rendering effects.
   *
   * @param extensionsVRM - The VRM extension data containing material properties
   * @returns True if outline materials are present, false otherwise
   */
  static _existOutlineMaterial(extensionsVRM) {
    const materialProperties = extensionsVRM.materialProperties;
    if (materialProperties != null) {
      for (const materialProperty of materialProperties) {
        if (materialProperty.floatProperties._OutlineWidthMode !== 0) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Initializes VRM material properties with default values for missing parameters.
   * This method ensures all VRM materials have complete property sets,
   * particularly for MToon shader materials commonly used in VRM models.
   *
   * @param gltfModel - The GLTF model to process materials for
   * @param texturesLength - The total number of textures for dummy texture indexing
   */
  static _initializeMaterialProperties(gltfModel, texturesLength) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;
    for (const materialProperty of materialProperties) {
      if (materialProperty.shader === "VRM/MToon") {
        this.__initializeMToonMaterialProperties(gltfModel, texturesLength);
        break;
      }
    }
  }
  /**
   * Initializes MToon material properties with comprehensive default values.
   * MToon is the standard toon shader for VRM, and this method ensures all
   * required properties are set with appropriate defaults for proper rendering.
   *
   * @param gltfModel - The GLTF model containing MToon materials
   * @param texturesLength - The total number of textures for dummy texture assignment
   */
  static __initializeMToonMaterialProperties(gltfModel, texturesLength) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;
    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;
    for (let i = 0; i < materialProperties.length; i++) {
      const floatProperties = materialProperties[i].floatProperties;
      this.__initializeForUndefinedProperty(floatProperties, "_BlendMode", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_BumpScale", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_CullMode", 2);
      this.__initializeForUndefinedProperty(floatProperties, "_Cutoff", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_DebugMode", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_DstBlend", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_IndirectLightIntensity", 0.1);
      this.__initializeForUndefinedProperty(floatProperties, "_LightColorAttenuation", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineColorMode", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineCullMode", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineLightingMix", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineScaledMaxDistance", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidth", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidthMode", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_ReceiveShadowRate", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_RimFresnelPower", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLift", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLightingMix", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeShift", 0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeToony", 0.9);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadingGradeRate", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_SrcBlend", 1);
      this.__initializeForUndefinedProperty(floatProperties, "_ZWrite", 1);
      const vectorProperties = materialProperties[i].vectorProperties;
      this.__initializeForUndefinedProperty(vectorProperties, "_Color", [1, 1, 1, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_EmissionColor", [0, 0, 0]);
      this.__initializeForUndefinedProperty(vectorProperties, "_OutlineColor", [0, 0, 0, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_ShadeColor", [0.97, 0.81, 0.86, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_RimColor", [0, 0, 0]);
      const textureProperties = materialProperties[i].textureProperties;
      this.__initializeForUndefinedProperty(textureProperties, "_BumpMap", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_EmissionMap", dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_MainTex", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_OutlineWidthTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ReceiveShadowTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_RimTexture", dummyBlackTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ShadeTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_ShadingGradeTexture", dummyWhiteTextureNumber);
      this.__initializeForUndefinedProperty(textureProperties, "_SphereAdd", dummyBlackTextureNumber);
    }
    for (let i = 0; i < gltfModel.materials.length; i++) {
      const material = gltfModel.materials[i];
      if (material.extras == null) {
        material.extras = {};
      }
      material.extras.vrm0xMaterialProperty = materialProperties[i];
    }
  }
  /**
   * Sets a default value for an object property if it's currently undefined.
   * This utility method is used throughout material initialization to ensure
   * all required properties have valid values.
   *
   * @param object - The object to check and potentially modify
   * @param propertyName - The name of the property to check
   * @param initialValue - The default value to set if the property is undefined
   */
  static __initializeForUndefinedProperty(object, propertyName, initialValue) {
    if (object[propertyName] == null) object[propertyName] = initialValue;
  }
  /**
   * Processes and validates GLTF load options for VRM import.
   * This method handles file extension conversion (.vrm to .glb), sets up
   * default material helpers, and configures VRM-specific import flags.
   *
   * @param options - The input load options to process
   * @returns Processed and validated load options with VRM-specific defaults
   */
  static _getOptions(options) {
    if (options != null) {
      for (const file in options.files) {
        const fileName = file.split(".vrm")[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[`${fileName}.glb`] = arraybuffer;
          delete options.files[file];
        }
      }
      options.__isImportVRM0x = true;
      if (options.defaultMaterialHelperArgumentArray == null) {
        options.defaultMaterialHelperArgumentArray = [{}];
      }
      if (!options.defaultMaterialHelperArgumentArray[0].isMorphing) {
        options.maxMorphTargetNumber = 0;
      }
    } else {
      options = {
        files: {},
        loaderExtension: void 0,
        defaultMaterialHelperName: void 0,
        defaultMaterialHelperArgumentArray: [{ isLighting: true, isMorphing: true, isSkinning: true }],
        statesOfElements: [
          {
            targets: [],
            states: {
              enable: [],
              functions: {}
            },
            isTransparent: true,
            opacity: 1,
            isTextureImageToLoadPreMultipliedAlpha: false
          }
        ],
        __isImportVRM0x: true,
        __importedType: "vrm0x"
      };
    }
    return options;
  }
};
export {
  Vrm0xImporter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvVnJtMHhJbXBvcnRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBHbHRmTG9hZE9wdGlvbiwgUm5NMiB9IGZyb20gJy4uLy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHsgVnJtMHgsIFZybTB4Qm9uZUdyb3VwIH0gZnJvbSAnLi4vLi4vdHlwZXMvVlJNMHgnO1xuaW1wb3J0IHsgUGh5c2ljc0NvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvUGh5c2ljcy9QaHlzaWNzQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFZybUNvbXBvbmVudCwgdHlwZSBWcm1FeHByZXNzaW9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy9Wcm0vVnJtQ29tcG9uZW50JztcbmltcG9ydCB7IFRleHR1cmVQYXJhbWV0ZXIgfSBmcm9tICcuLi9kZWZpbml0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgdHlwZSBFcnIsIE9rLCB0eXBlIFJlc3VsdCB9IGZyb20gJy4uL21pc2MvUmVzdWx0JztcbmltcG9ydCB7IFNwaGVyZUNvbGxpZGVyIH0gZnJvbSAnLi4vcGh5c2ljcy9WUk1TcHJpbmcvU3BoZXJlQ29sbGlkZXInO1xuaW1wb3J0IHsgVlJNQ29sbGlkZXJHcm91cCB9IGZyb20gJy4uL3BoeXNpY3MvVlJNU3ByaW5nL1ZSTUNvbGxpZGVyR3JvdXAnO1xuaW1wb3J0IHsgVlJNU3ByaW5nIH0gZnJvbSAnLi4vcGh5c2ljcy9WUk1TcHJpbmcvVlJNU3ByaW5nJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmUgfSBmcm9tICcuLi9waHlzaWNzL1ZSTVNwcmluZy9WUk1TcHJpbmdCb25lJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVQaHlzaWNzU3RyYXRlZ3kgfSBmcm9tICcuLi9waHlzaWNzL1ZSTVNwcmluZy9WUk1TcHJpbmdCb25lUGh5c2ljc1N0cmF0ZWd5JztcbmltcG9ydCB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBTYW1wbGVyIH0gZnJvbSAnLi4vdGV4dHVyZXMvU2FtcGxlcic7XG5pbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSAnLi4vdGV4dHVyZXMvVGV4dHVyZSc7XG5pbXBvcnQgeyBHbHRmMkltcG9ydGVyIH0gZnJvbSAnLi9HbHRmMkltcG9ydGVyJztcbmltcG9ydCB7IE1vZGVsQ29udmVydGVyIH0gZnJvbSAnLi9Nb2RlbENvbnZlcnRlcic7XG5cbi8qKlxuICogVGhlIFZSTSAwLnggZm9ybWF0IGltcG9ydGVyIGNsYXNzLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IHRvIGltcG9ydCBhbmQgcHJvY2VzcyBWUk0gMC54IGZpbGVzLFxuICogaW5jbHVkaW5nIGh1bWFub2lkIGJvbmUgbWFwcGluZywgc3ByaW5nIGJvbmUgcGh5c2ljcywgYW5kIGV4cHJlc3Npb24gYmxlbmRpbmcuXG4gKiBJdCBleHRlbmRzIHRoZSBHTFRGMiBpbXBvcnRlciB3aXRoIFZSTS1zcGVjaWZpYyBmZWF0dXJlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFZybTB4SW1wb3J0ZXIge1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogSW1wb3J0cyBhIFZSTSBmaWxlIGZyb20gdGhlIHNwZWNpZmllZCBVUkwgYW5kIGNvbnZlcnRzIGl0IHRvIFJob2Rvbml0ZSBzY2VuZSBncmFwaCBlbnRpdGllcy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUgY29tcGxldGUgVlJNIGltcG9ydCBwaXBlbGluZSBpbmNsdWRpbmcgdGV4dHVyZXMsIG1hdGVyaWFscyxcbiAgICogc3ByaW5nIGJvbmUgcGh5c2ljcywgaHVtYW5vaWQgbWFwcGluZywgYW5kIGV4cHJlc3Npb24gc2V0dXAuXG4gICAqXG4gICAqIEBwYXJhbSB1cmwgLSBUaGUgVVJMIG9mIHRoZSBWUk0gZmlsZSB0byBpbXBvcnRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25hbCBsb2FkaW5nIGNvbmZpZ3VyYXRpb24gaW5jbHVkaW5nIG1hdGVyaWFsIGhlbHBlcnMgYW5kIHJlbmRlciBzdGF0ZXNcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXMgKG1haW4gKyBvcHRpb25hbCBvdXRsaW5lKVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBpbXBvcnRGcm9tVXJsKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBHbHRmTG9hZE9wdGlvblxuICApOiBQcm9taXNlPFJlc3VsdDxJU2NlbmVHcmFwaEVudGl0eVtdLCBFcnI8Um5NMiwgdW5kZWZpbmVkPj4+IHtcbiAgICBvcHRpb25zID0gdGhpcy5fZ2V0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEdsdGYySW1wb3J0ZXIuaW1wb3J0RnJvbVVybCh1cmwsIG9wdGlvbnMpO1xuXG4gICAgY29uc3QgZ2x0Zk1vZGVsID0gcmVzdWx0O1xuICAgIGNvbnN0IHRleHR1cmVzID0gYXdhaXQgVnJtMHhJbXBvcnRlci5fY3JlYXRlVGV4dHVyZXMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IHNhbXBsZXJzID0gVnJtMHhJbXBvcnRlci5fY3JlYXRlU2FtcGxlcnMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkgPVxuICAgICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5O1xuICAgIGlmIChJcy5leGlzdChkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5KSkge1xuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS50ZXh0dXJlcyA9IHRleHR1cmVzO1xuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS5zYW1wbGVycyA9IHNhbXBsZXJzO1xuICAgIH1cblxuICAgIFZybTB4SW1wb3J0ZXIuX2luaXRpYWxpemVNYXRlcmlhbFByb3BlcnRpZXMoZ2x0Zk1vZGVsLCB0ZXh0dXJlcy5sZW5ndGgpO1xuXG4gICAgLy8gc2V0dXAgcm9vdEdyb3VwXG4gICAgbGV0IHJvb3RHcm91cHM6IElTY2VuZUdyYXBoRW50aXR5W107XG4gICAgY29uc3Qgcm9vdEdyb3VwTWFpbiA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCEpO1xuXG4gICAgY29uc3QgZXhpc3RPdXRsaW5lID0gVnJtMHhJbXBvcnRlci5fZXhpc3RPdXRsaW5lTWF0ZXJpYWwoZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNKTtcbiAgICBpZiAoZXhpc3RPdXRsaW5lKSB7XG4gICAgICBpZiAoSXMuZXhpc3QoZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSkpIHtcbiAgICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS5pc091dGxpbmUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgcm9vdEdyb3VwT3V0bGluZSA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCk7XG5cbiAgICAgIHJvb3RHcm91cHMgPSBbcm9vdEdyb3VwTWFpbiwgcm9vdEdyb3VwT3V0bGluZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3RHcm91cHMgPSBbcm9vdEdyb3VwTWFpbl07XG4gICAgfVxuICAgIFZybTB4SW1wb3J0ZXIuX3JlYWRTcHJpbmdCb25lKGVuZ2luZSwgZ2x0Zk1vZGVsIGFzIFZybTB4KTtcbiAgICBWcm0weEltcG9ydGVyLl9yZWFkVlJNSHVtYW5vaWRJbmZvKGdsdGZNb2RlbCBhcyBWcm0weCwgcm9vdEdyb3VwTWFpbik7XG5cbiAgICByZXR1cm4gbmV3IE9rKHJvb3RHcm91cHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydHMgb25seSB0aGUgSlNPTiBkYXRhIGZyb20gYSBWUk0gZmlsZSB3aXRob3V0IGNyZWF0aW5nIHNjZW5lIGdyYXBoIGVudGl0aWVzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgZXh0cmFjdGluZyBWUk0gbWV0YWRhdGEsIGh1bWFub2lkIGJvbmUgbWFwcGluZ3MsIGFuZCBvdGhlclxuICAgKiBjb25maWd1cmF0aW9uIGRhdGEgd2l0aG91dCB0aGUgb3ZlcmhlYWQgb2YgZnVsbCBzY2VuZSBjb25zdHJ1Y3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJJIG9mIHRoZSBWUk0gZmlsZSB0byBpbXBvcnRcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25hbCBsb2FkaW5nIGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIFZSTSBKU09OIGRhdGEgc3RydWN0dXJlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaW1wb3J0SnNvbk9mVlJNKHVyaTogc3RyaW5nLCBvcHRpb25zPzogR2x0ZkxvYWRPcHRpb24pOiBQcm9taXNlPFZybTB4PiB7XG4gICAgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgR2x0ZjJJbXBvcnRlci5pbXBvcnRGcm9tVXJsKHVyaSwgb3B0aW9ucyk7XG4gICAgVnJtMHhJbXBvcnRlci5fcmVhZFZSTUh1bWFub2lkSW5mbyhyZXN1bHQgYXMgVnJtMHgpO1xuICAgIHJldHVybiByZXN1bHQgYXMgVnJtMHg7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIGZvciBpbXBvcnRpbmcgVlJNIDAueCBkYXRhIGludG8gZXhpc3RpbmcgcmVuZGVyIHBhc3Nlcy5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUgY29tcGxldGUgVlJNIHByb2Nlc3NpbmcgcGlwZWxpbmUgaW5jbHVkaW5nIG1hdGVyaWFsIHNldHVwLFxuICAgKiBvdXRsaW5lIHJlbmRlcmluZywgc3ByaW5nIGJvbmUgcGh5c2ljcywgYW5kIGh1bWFub2lkIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgbG9hZGVkIEdMVEYgbW9kZWwgZGF0YSB3aXRoIFZSTSBleHRlbnNpb25zXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzZXMgLSBBcnJheSBvZiByZW5kZXIgcGFzc2VzIHRvIGFkZCB0aGUgVlJNIGVudGl0aWVzIHRvXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgX19pbXBvcnRWUk0weChlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yLCByZW5kZXJQYXNzZXM6IFJlbmRlclBhc3NbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIHByb2Nlc3MgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVxuICAgIGNvbnN0IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkgPVxuICAgICAgZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcz8ucm5Mb2FkZXJPcHRpb25zPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5O1xuICAgIGNvbnN0IHRleHR1cmVzID0gYXdhaXQgdGhpcy5fY3JlYXRlVGV4dHVyZXMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGNvbnN0IHNhbXBsZXJzID0gdGhpcy5fY3JlYXRlU2FtcGxlcnMoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIGlmIChJcy5leGlzdChkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5KSkge1xuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS50ZXh0dXJlcyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXlbMF0udGV4dHVyZXMgPz8gdGV4dHVyZXM7XG4gICAgICBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5WzBdLnNhbXBsZXJzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS5zYW1wbGVycyA/PyBzYW1wbGVycztcbiAgICAgIGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXlbMF0uaXNMaWdodGluZyA9IGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXlbMF0uaXNMaWdodGluZyA/PyB0cnVlO1xuICAgIH1cbiAgICB0aGlzLl9pbml0aWFsaXplTWF0ZXJpYWxQcm9wZXJ0aWVzKGdsdGZNb2RlbCwgdGV4dHVyZXMubGVuZ3RoKTtcblxuICAgIC8vIGdldCByb290R3JvdXBcbiAgICBsZXQgcm9vdEdyb3VwOiBJU2NlbmVHcmFwaEVudGl0eTtcbiAgICBjb25zdCBleGlzdE91dGxpbmUgPSB0aGlzLl9leGlzdE91dGxpbmVNYXRlcmlhbChnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0pO1xuICAgIGlmIChleGlzdE91dGxpbmUpIHtcbiAgICAgIHJlbmRlclBhc3Nlc1sxXSA9IHJlbmRlclBhc3Nlc1sxXSA/PyBuZXcgUmVuZGVyUGFzcyhlbmdpbmUpO1xuICAgICAgY29uc3QgcmVuZGVyUGFzc091dGxpbmUgPSByZW5kZXJQYXNzZXNbMV07XG4gICAgICByZW5kZXJQYXNzT3V0bGluZS50b0NsZWFyQ29sb3JCdWZmZXIgPSBmYWxzZTtcbiAgICAgIHJlbmRlclBhc3NPdXRsaW5lLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuICAgICAgZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNLnJuRXh0ZW5zaW9uID0ge1xuICAgICAgICByZW5kZXJQYXNzT3V0bGluZTogcmVuZGVyUGFzc091dGxpbmUsXG4gICAgICB9O1xuXG4gICAgICByb290R3JvdXAgPSBhd2FpdCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgICAgcmVuZGVyUGFzc091dGxpbmUuYWRkRW50aXRpZXMoW3Jvb3RHcm91cF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByb290R3JvdXAgPSBhd2FpdCBNb2RlbENvbnZlcnRlci5jb252ZXJ0VG9SaG9kb25pdGVPYmplY3QoZW5naW5lLCBnbHRmTW9kZWwpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbmRlclBhc3NNYWluID0gcmVuZGVyUGFzc2VzWzBdO1xuICAgIHJlbmRlclBhc3NNYWluLnRyeVRvU2V0VW5pcXVlTmFtZSgnVlJNIE1haW4gUmVuZGVyUGFzcycsIHRydWUpO1xuICAgIHJlbmRlclBhc3NNYWluLmFkZEVudGl0aWVzKFtyb290R3JvdXBdKTtcblxuICAgIHRoaXMuX3JlYWRTcHJpbmdCb25lKGVuZ2luZSwgZ2x0Zk1vZGVsIGFzIFZybTB4KTtcbiAgICB0aGlzLl9yZWFkVlJNSHVtYW5vaWRJbmZvKGdsdGZNb2RlbCBhcyBWcm0weCwgcm9vdEdyb3VwKTtcbiAgICB0aGlzLl9yZWFkQmxlbmRTaGFwZUdyb3VwKGdsdGZNb2RlbCBhcyBWcm0weCwgcm9vdEdyb3VwKTtcblxuICAgIHJvb3RHcm91cC5sb2NhbEV1bGVyQW5nbGVzID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCBNYXRoLlBJLCAwLjBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgVlJNIGJsZW5kIHNoYXBlIGdyb3VwcyBhbmQgY29udmVydHMgdGhlbSB0byBSaG9kb25pdGUgVlJNIGV4cHJlc3Npb25zLlxuICAgKiBUaGlzIG1ldGhvZCBleHRyYWN0cyBmYWNpYWwgZXhwcmVzc2lvbnMsIGV5ZSBibGlua3MsIGFuZCBvdGhlciBtb3JwaCB0YXJnZXQgYW5pbWF0aW9uc1xuICAgKiBmcm9tIHRoZSBWUk0gYmxlbmQgc2hhcGUgbWFzdGVyIGFuZCBjcmVhdGVzIHRoZSBjb3JyZXNwb25kaW5nIFZSTSBjb21wb25lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGRhdGEgY29udGFpbmluZyBibGVuZCBzaGFwZSBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gcm9vdEVudGl0eSAtIFRoZSByb290IGVudGl0eSB0byBhdHRhY2ggdGhlIFZSTSBjb21wb25lbnQgdG9cbiAgICovXG4gIHN0YXRpYyBfcmVhZEJsZW5kU2hhcGVHcm91cChnbHRmTW9kZWw6IFZybTB4LCByb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSk6IHZvaWQge1xuICAgIGNvbnN0IHZybUV4cHJlc3Npb25zOiBWcm1FeHByZXNzaW9uW10gPSBbXTtcblxuICAgIGNvbnN0IGJsZW5kU2hhcGVHcm91cHMgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0uYmxlbmRTaGFwZU1hc3Rlci5ibGVuZFNoYXBlR3JvdXBzO1xuICAgIGZvciAoY29uc3QgYmxlbmRTaGFwZUdyb3VwIG9mIGJsZW5kU2hhcGVHcm91cHMpIHtcbiAgICAgIGNvbnN0IHZybUV4cHJlc3Npb246IFZybUV4cHJlc3Npb24gPSB7XG4gICAgICAgIG5hbWU6IGJsZW5kU2hhcGVHcm91cC5wcmVzZXROYW1lID09PSAndW5rbm93bicgPyBibGVuZFNoYXBlR3JvdXAubmFtZSA6IGJsZW5kU2hhcGVHcm91cC5wcmVzZXROYW1lLFxuICAgICAgICBpc0JpbmFyeTogYmxlbmRTaGFwZUdyb3VwLmlzQmluYXJ5LFxuICAgICAgICBiaW5kczogYmxlbmRTaGFwZUdyb3VwLmJpbmRzLm1hcChiaW5kID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdsdGZNb2RlbC5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChub2RlLm1lc2ggPT09IGJpbmQubWVzaCkge1xuICAgICAgICAgICAgICBjb25zdCBybkVudGl0eSA9IGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc1tpXTtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBlbnRpdHlJZHg6IHJuRW50aXR5LmVudGl0eVVJRCxcbiAgICAgICAgICAgICAgICBibGVuZFNoYXBlSWR4OiBiaW5kLmluZGV4LFxuICAgICAgICAgICAgICAgIHdlaWdodDogYmluZC53ZWlnaHQgLyAxMDAsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IEZvdW5kIG5vZGUgaW4gYmxlbmRTaGFwZUdyb3VwIFByb2Nlc3MnKTtcbiAgICAgICAgfSksXG4gICAgICB9O1xuICAgICAgdnJtRXhwcmVzc2lvbnMucHVzaCh2cm1FeHByZXNzaW9uKTtcbiAgICB9XG4gICAgY29uc3QgdnJtRW50aXR5ID0gcm9vdEVudGl0eS5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShWcm1Db21wb25lbnQsIHJvb3RFbnRpdHkpO1xuICAgIHZybUVudGl0eS5nZXRWcm0oKS5zZXRWcm1FeHByZXNzaW9ucyh2cm1FeHByZXNzaW9ucyk7XG4gICAgdnJtRW50aXR5LmdldFZybSgpLl92ZXJzaW9uID0gJzAueCc7XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdHMgYW5kIHByb2Nlc3NlcyBWUk0gaHVtYW5vaWQgYm9uZSBtYXBwaW5nIGluZm9ybWF0aW9uLlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGEgbWFwcGluZyBiZXR3ZWVuIFZSTSBzdGFuZGFyZCBib25lIG5hbWVzIGFuZCB0aGUgYWN0dWFsXG4gICAqIHNjZW5lIGdyYXBoIG5vZGVzLCB3aGljaCBpcyBlc3NlbnRpYWwgZm9yIGFuaW1hdGlvbiByZXRhcmdldGluZyBhbmQgSUsuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGRhdGEgY29udGFpbmluZyBodW1hbm9pZCBib25lIGRlZmluaXRpb25zXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gT3B0aW9uYWwgcm9vdCBlbnRpdHkgdG8gYXR0YWNoIHRoZSBib25lIG1hcHBpbmcgbWV0YWRhdGEgdG9cbiAgICovXG4gIHN0YXRpYyBfcmVhZFZSTUh1bWFub2lkSW5mbyhnbHRmTW9kZWw6IFZybTB4LCByb290RW50aXR5PzogSVNjZW5lR3JhcGhFbnRpdHkpOiB2b2lkIHtcbiAgICBjb25zdCBodW1hbkJvbmVzID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNLmh1bWFub2lkLmh1bWFuQm9uZXM7XG4gICAgY29uc3QgbWFwTmFtZU5vZGVJZDogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgICAvLyBjb25zdCBtYXBOYW1lTm9kZU5hbWU6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgZm9yIChjb25zdCBib25lIG9mIGh1bWFuQm9uZXMpIHtcbiAgICAgIG1hcE5hbWVOb2RlSWQuc2V0KGJvbmUuYm9uZSwgYm9uZS5ub2RlKTtcbiAgICAgIGNvbnN0IGJvbmVOb2RlID0gZ2x0Zk1vZGVsLm5vZGVzW2JvbmUubm9kZV07XG4gICAgICBib25lLm5hbWUgPSBib25lTm9kZS5uYW1lO1xuICAgIH1cbiAgICBpZiAocm9vdEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByb290RW50aXR5LnRyeVRvU2V0VGFnKHtcbiAgICAgICAgdGFnOiAnaHVtYW5vaWRfbWFwX25hbWVfbm9kZUlkJyxcbiAgICAgICAgdmFsdWU6IG1hcE5hbWVOb2RlSWQsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIFZSTSBzcHJpbmcgYm9uZSBwaHlzaWNzIGNvbmZpZ3VyYXRpb24gYW5kIGNyZWF0ZXMgdGhlIHBoeXNpY3Mgc2ltdWxhdGlvbiBzZXR1cC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBjb2xsaWRlciBncm91cHMsIHNwcmluZyBib25lIGNoYWlucywgYW5kIHBoeXNpY3MgcGFyYW1ldGVyc1xuICAgKiB0byBlbmFibGUgcmVhbGlzdGljIHNlY29uZGFyeSBtb3Rpb24gZm9yIGhhaXIsIGNsb3RoaW5nLCBhbmQgYWNjZXNzb3JpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGRhdGEgY29udGFpbmluZyBzcHJpbmcgYm9uZSBhbmQgY29sbGlkZXIgZGVmaW5pdGlvbnNcbiAgICovXG4gIHN0YXRpYyBfcmVhZFNwcmluZ0JvbmUoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogVnJtMHgpOiB2b2lkIHtcbiAgICBjb25zdCBjb2xsaWRlckdyb3VwczogVlJNQ29sbGlkZXJHcm91cFtdID0gW107XG4gICAgZm9yIChjb25zdCBjb2xsaWRlckdyb3VwSWR4IGluIGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTS5zZWNvbmRhcnlBbmltYXRpb24uY29sbGlkZXJHcm91cHMpIHtcbiAgICAgIGNvbnN0IGNvbGxpZGVyR3JvdXAgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0uc2Vjb25kYXJ5QW5pbWF0aW9uLmNvbGxpZGVyR3JvdXBzW2NvbGxpZGVyR3JvdXBJZHhdO1xuICAgICAgY29uc3QgdnJtQ29sbGlkZXJHcm91cCA9IG5ldyBWUk1Db2xsaWRlckdyb3VwKCk7XG4gICAgICBjb2xsaWRlckdyb3Vwcy5wdXNoKHZybUNvbGxpZGVyR3JvdXApO1xuICAgICAgY29uc3QgY29sbGlkZXJzOiBTcGhlcmVDb2xsaWRlcltdID0gW107XG4gICAgICBjb25zdCBiYXNlU2cgPSBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzIS5ybkVudGl0aWVzIVtjb2xsaWRlckdyb3VwLm5vZGVdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgIGZvciAoY29uc3QgY29sbGlkZXIgb2YgY29sbGlkZXJHcm91cC5jb2xsaWRlcnMpIHtcbiAgICAgICAgY29uc3Qgc3BoZXJlQ29sbGlkZXIgPSBuZXcgU3BoZXJlQ29sbGlkZXIoXG4gICAgICAgICAgZW5naW5lLFxuICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICAgICAgICBjb2xsaWRlci5vZmZzZXQueCxcbiAgICAgICAgICAgIGNvbGxpZGVyLm9mZnNldC55LFxuICAgICAgICAgICAgLWNvbGxpZGVyLm9mZnNldC56LCAvLyB6IGlzIG9wcG9zaXRlIGluIFZSTTAueFxuICAgICAgICAgIF0pLFxuICAgICAgICAgIGNvbGxpZGVyLnJhZGl1cyxcbiAgICAgICAgICBiYXNlU2dcbiAgICAgICAgKTtcbiAgICAgICAgY29sbGlkZXJzLnB1c2goc3BoZXJlQ29sbGlkZXIpO1xuICAgICAgfVxuICAgICAgdnJtQ29sbGlkZXJHcm91cC5zcGhlcmVDb2xsaWRlcnMgPSBjb2xsaWRlcnM7XG4gICAgfVxuXG4gICAgY29uc3QgYm9uZUdyb3VwczogVlJNU3ByaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJvbmVHcm91cCBvZiBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0uc2Vjb25kYXJ5QW5pbWF0aW9uLmJvbmVHcm91cHMpIHtcbiAgICAgIGlmIChib25lR3JvdXAuYm9uZXMgPT0gbnVsbCB8fCBib25lR3JvdXAuYm9uZXMubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGpvaW50Um9vdEluZGV4ID0gYm9uZUdyb3VwLmJvbmVzWzBdO1xuICAgICAgY29uc3Qgam9pbnRSb290RW50aXR5ID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyFbam9pbnRSb290SW5kZXhdO1xuICAgICAgY29uc3QgdnJtU3ByaW5nQm9uZUdyb3VwID0gbmV3IFZSTVNwcmluZyhqb2ludFJvb3RFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgICAgdnJtU3ByaW5nQm9uZUdyb3VwLnRyeVRvU2V0VW5pcXVlTmFtZShib25lR3JvdXAuY29tbWVudCwgdHJ1ZSk7XG4gICAgICB2cm1TcHJpbmdCb25lR3JvdXAuY29sbGlkZXJHcm91cHMgPSBib25lR3JvdXAuY29sbGlkZXJHcm91cHMubWFwKGNvbGxpZGVyR3JvdXBJbmRleCA9PiB7XG4gICAgICAgIHJldHVybiBjb2xsaWRlckdyb3Vwc1tjb2xsaWRlckdyb3VwSW5kZXhdO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGFkZGVkRW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgaWR4T2ZBcnJheSBpbiBib25lR3JvdXAuYm9uZXMpIHtcbiAgICAgICAgY29uc3QgYm9uZU5vZGVJbmRleCA9IGJvbmVHcm91cC5ib25lc1tpZHhPZkFycmF5XTtcbiAgICAgICAgY29uc3QgZW50aXR5ID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyFbYm9uZU5vZGVJbmRleF07XG5cbiAgICAgICAgLy8gRmluZCBhbmQgYWRkIHRoZSBtaXNzaW5nIGpvaW50cyBmcm9tIHNwcmluZy5qb2ludHMuXG4gICAgICAgIHRoaXMuX19hZGRTcHJpbmdCb25lUmVjdXJzaXZlbHkodnJtU3ByaW5nQm9uZUdyb3VwLCBlbnRpdHksIGJvbmVHcm91cCwgYWRkZWRFbnRpdGllcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChib25lR3JvdXAuY2VudGVyICE9IG51bGwgJiYgYm9uZUdyb3VwLmNlbnRlciAhPT0gLTEpIHtcbiAgICAgICAgdnJtU3ByaW5nQm9uZUdyb3VwLmNlbnRlciA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuRW50aXRpZXMhW2JvbmVHcm91cC5jZW50ZXJdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgIH1cblxuICAgICAgYm9uZUdyb3Vwcy5wdXNoKHZybVNwcmluZ0JvbmVHcm91cCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBib25lR3JvdXAgb2YgYm9uZUdyb3Vwcykge1xuICAgICAgdGhpcy5fX2FkZFBoeXNpY3NDb21wb25lbnQoYm9uZUdyb3VwLCBib25lR3JvdXAucm9vdEJvbmUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBhZGRzIHNwcmluZyBib25lIHBoeXNpY3MgdG8gYSBib25lIGNoYWluIGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqIFRoaXMgbWV0aG9kIHRyYXZlcnNlcyB0aGUgYm9uZSBoaWVyYXJjaHkgYW5kIGFwcGxpZXMgc3ByaW5nIHBoeXNpY3MgcGFyYW1ldGVyc1xuICAgKiB0byBjcmVhdGUgbmF0dXJhbCBzZWNvbmRhcnkgbW90aW9uIGVmZmVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSB2cm1TcHJpbmcgLSBUaGUgVlJNIHNwcmluZyBib25lIGdyb3VwIHRvIGFkZCBib25lcyB0b1xuICAgKiBAcGFyYW0gZW50aXR5IC0gVGhlIGN1cnJlbnQgZW50aXR5IGluIHRoZSBib25lIGhpZXJhcmNoeVxuICAgKiBAcGFyYW0gYm9uZUdyb3VwIC0gVGhlIFZSTSBib25lIGdyb3VwIGNvbmZpZ3VyYXRpb24gZGF0YVxuICAgKiBAcGFyYW0gYWRkZWRFbnRpdGllcyAtIEFycmF5IHRvIHRyYWNrIGFscmVhZHkgcHJvY2Vzc2VkIGVudGl0aWVzIHRvIGF2b2lkIGR1cGxpY2F0ZXNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fYWRkU3ByaW5nQm9uZVJlY3Vyc2l2ZWx5KFxuICAgIHZybVNwcmluZzogVlJNU3ByaW5nLFxuICAgIGVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgYm9uZUdyb3VwOiBWcm0weEJvbmVHcm91cCxcbiAgICBhZGRlZEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNnID0gZW50aXR5LmdldFNjZW5lR3JhcGgoKTtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHNnLmNoaWxkcmVuO1xuXG4gICAgaWYgKCFhZGRlZEVudGl0aWVzLmluY2x1ZGVzKGVudGl0eSkpIHtcbiAgICAgIGNvbnN0IHNwcmluZ0JvbmUgPSBuZXcgVlJNU3ByaW5nQm9uZShlbnRpdHkpO1xuICAgICAgc3ByaW5nQm9uZS5kcmFnRm9yY2UgPSBib25lR3JvdXAuZHJhZ0ZvcmNlO1xuICAgICAgc3ByaW5nQm9uZS5zdGlmZm5lc3NGb3JjZSA9IGJvbmVHcm91cC5zdGlmZmluZXNzO1xuICAgICAgc3ByaW5nQm9uZS5ncmF2aXR5UG93ZXIgPSBib25lR3JvdXAuZ3Jhdml0eVBvd2VyO1xuICAgICAgc3ByaW5nQm9uZS5ncmF2aXR5RGlyID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgICAgYm9uZUdyb3VwLmdyYXZpdHlEaXIueCxcbiAgICAgICAgYm9uZUdyb3VwLmdyYXZpdHlEaXIueSxcbiAgICAgICAgYm9uZUdyb3VwLmdyYXZpdHlEaXIueixcbiAgICAgIF0pO1xuICAgICAgc3ByaW5nQm9uZS5oaXRSYWRpdXMgPSBib25lR3JvdXAuaGl0UmFkaXVzO1xuICAgICAgdnJtU3ByaW5nLmJvbmVzLnB1c2goc3ByaW5nQm9uZSk7XG4gICAgICBhZGRlZEVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9fYWRkU3ByaW5nQm9uZVJlY3Vyc2l2ZWx5KHZybVNwcmluZywgY2hpbGQuZW50aXR5LCBib25lR3JvdXAsIGFkZGVkRW50aXRpZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcGh5c2ljcyBjb21wb25lbnQgd2l0aCBWUk0gc3ByaW5nIGJvbmUgc3RyYXRlZ3kgdG8gYW4gZW50aXR5LlxuICAgKiBUaGlzIG1ldGhvZCBzZXRzIHVwIHRoZSBwaHlzaWNzIHNpbXVsYXRpb24gZm9yIHNwcmluZyBib25lIG1vdGlvbixcbiAgICogYXR0YWNoaW5nIHRoZSBhcHByb3ByaWF0ZSBzdHJhdGVneSBhbmQgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGJvbmVHcm91cCAtIFRoZSBWUk0gc3ByaW5nIGJvbmUgZ3JvdXAgY29udGFpbmluZyBwaHlzaWNzIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHNnIC0gVGhlIHNjZW5lIGdyYXBoIGNvbXBvbmVudCB0byBhdHRhY2ggcGh5c2ljcyB0b1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hZGRQaHlzaWNzQ29tcG9uZW50KGJvbmVHcm91cDogVlJNU3ByaW5nLCBzZzogU2NlbmVHcmFwaENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGVudGl0eSA9IHNnLmVudGl0eTtcbiAgICBjb25zdCBuZXdFbnRpdHkgPSBlbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoUGh5c2ljc0NvbXBvbmVudCwgZW50aXR5KTtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gbmV3RW50aXR5LmdldFBoeXNpY3MoKTtcbiAgICBjb25zdCBzdHJhdGVneSA9IG5ldyBWUk1TcHJpbmdCb25lUGh5c2ljc1N0cmF0ZWd5KCk7XG4gICAgc3RyYXRlZ3kuc2V0U3ByaW5nKGJvbmVHcm91cCk7XG4gICAgcGh5c2ljc0NvbXBvbmVudC5zZXRTdHJhdGVneShzdHJhdGVneSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBSaG9kb25pdGUgdGV4dHVyZSBvYmplY3RzIGZyb20gR0xURiB0ZXh0dXJlIGRhdGEuXG4gICAqIFRoaXMgbWV0aG9kIHByb2Nlc3NlcyBhbGwgdGV4dHVyZXMgaW4gdGhlIEdMVEYgbW9kZWwgYW5kIGNyZWF0ZXMgYWRkaXRpb25hbFxuICAgKiBkdW1teSB0ZXh0dXJlcyAod2hpdGUgYW5kIGJsYWNrKSBjb21tb25seSB1c2VkIGluIFZSTSBtYXRlcmlhbHMuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgR0xURiBtb2RlbCBjb250YWluaW5nIHRleHR1cmUgZGVmaW5pdGlvbnNcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2YgY3JlYXRlZCB0ZXh0dXJlc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIF9jcmVhdGVUZXh0dXJlcyhlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogUHJvbWlzZTxUZXh0dXJlW10+IHtcbiAgICBpZiAoIWdsdGZNb2RlbC50ZXh0dXJlcykgZ2x0Zk1vZGVsLnRleHR1cmVzID0gW107XG5cbiAgICBjb25zdCBnbHRmVGV4dHVyZXMgPSBnbHRmTW9kZWwudGV4dHVyZXM7XG4gICAgY29uc3Qgcm5UZXh0dXJlczogVGV4dHVyZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnbHRmVGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJuVGV4dHVyZSA9IGF3YWl0IE1vZGVsQ29udmVydGVyLl9jcmVhdGVUZXh0dXJlKGVuZ2luZSwgZ2x0ZlRleHR1cmVzW2ldLnNvdXJjZU9iamVjdCEsIGdsdGZNb2RlbCk7XG4gICAgICByblRleHR1cmVzW2ldID0gcm5UZXh0dXJlO1xuICAgIH1cblxuICAgIGNvbnN0IGR1bW15V2hpdGVUZXh0dXJlID0gbmV3IFRleHR1cmUoZW5naW5lKTtcbiAgICBhd2FpdCBkdW1teVdoaXRlVGV4dHVyZS5nZW5lcmF0ZTF4MVRleHR1cmVGcm9tKCk7XG4gICAgZHVtbXlXaGl0ZVRleHR1cmUubWFya0FzRHVtbXlUZXh0dXJlKCk7XG4gICAgcm5UZXh0dXJlcy5wdXNoKGR1bW15V2hpdGVUZXh0dXJlKTtcbiAgICBjb25zdCBkdW1teUJsYWNrVGV4dHVyZSA9IG5ldyBUZXh0dXJlKGVuZ2luZSk7XG4gICAgYXdhaXQgZHVtbXlCbGFja1RleHR1cmUuZ2VuZXJhdGUxeDFUZXh0dXJlRnJvbSgncmdiYSgwLCAwLCAwLCAxKScpO1xuICAgIGR1bW15QmxhY2tUZXh0dXJlLm1hcmtBc0R1bW15VGV4dHVyZSgpO1xuICAgIHJuVGV4dHVyZXMucHVzaChkdW1teUJsYWNrVGV4dHVyZSk7XG5cbiAgICByZXR1cm4gcm5UZXh0dXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIFJob2Rvbml0ZSBzYW1wbGVyIG9iamVjdHMgZnJvbSBHTFRGIHNhbXBsZXIgZGF0YS5cbiAgICogVGhpcyBtZXRob2QgcHJvY2Vzc2VzIHRleHR1cmUgc2FtcGxpbmcgY29uZmlndXJhdGlvbiBhbmQgY3JlYXRlcyBhZGRpdGlvbmFsXG4gICAqIGR1bW15IHNhbXBsZXJzIGZvciB0ZXh0dXJlcyB0aGF0IGRvbid0IHNwZWNpZnkgc2FtcGxpbmcgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBHTFRGIG1vZGVsIGNvbnRhaW5pbmcgc2FtcGxlciBkZWZpbml0aW9uc1xuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBjcmVhdGVkIHNhbXBsZXIgb2JqZWN0c1xuICAgKi9cbiAgc3RhdGljIF9jcmVhdGVTYW1wbGVycyhlbmdpbmU6IEVuZ2luZSwgZ2x0Zk1vZGVsOiBSbk0yKTogU2FtcGxlcltdIHtcbiAgICBpZiAoIWdsdGZNb2RlbC50ZXh0dXJlcykgZ2x0Zk1vZGVsLnRleHR1cmVzID0gW107XG5cbiAgICBjb25zdCBnbHRmVGV4dHVyZXMgPSBnbHRmTW9kZWwudGV4dHVyZXM7XG4gICAgY29uc3Qgcm5TYW1wbGVyczogU2FtcGxlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnbHRmVGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJuU2FtcGxlciA9IE1vZGVsQ29udmVydGVyLl9jcmVhdGVTYW1wbGVyKGVuZ2luZSwgZ2x0ZlRleHR1cmVzW2ldLnNhbXBsZXJPYmplY3QhKTtcbiAgICAgIHJuU2FtcGxlcnNbaV0gPSByblNhbXBsZXI7XG4gICAgfVxuXG4gICAgY29uc3QgZHVtbXlTYW1wbGVyID0gbmV3IFNhbXBsZXIoZW5naW5lLCB7XG4gICAgICB3cmFwUzogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICAgIHdyYXBUOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgIG1hZ0ZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgfSk7XG4gICAgZHVtbXlTYW1wbGVyLmNyZWF0ZSgpO1xuICAgIHJuU2FtcGxlcnMucHVzaChkdW1teVNhbXBsZXIpO1xuICAgIHJuU2FtcGxlcnMucHVzaChkdW1teVNhbXBsZXIpO1xuXG4gICAgcmV0dXJuIHJuU2FtcGxlcnM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGFueSBtYXRlcmlhbHMgaW4gdGhlIFZSTSBoYXZlIG91dGxpbmUgcmVuZGVyaW5nIGVuYWJsZWQuXG4gICAqIFRoaXMgbWV0aG9kIGV4YW1pbmVzIG1hdGVyaWFsIHByb3BlcnRpZXMgdG8gZGV0ZXJtaW5lIGlmIGEgc2VwYXJhdGVcbiAgICogb3V0bGluZSByZW5kZXIgcGFzcyBpcyBuZWVkZWQgZm9yIHRvb24tc3R5bGUgcmVuZGVyaW5nIGVmZmVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSBleHRlbnNpb25zVlJNIC0gVGhlIFZSTSBleHRlbnNpb24gZGF0YSBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXNcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBvdXRsaW5lIG1hdGVyaWFscyBhcmUgcHJlc2VudCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgX2V4aXN0T3V0bGluZU1hdGVyaWFsKGV4dGVuc2lvbnNWUk06IGFueSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1hdGVyaWFsUHJvcGVydGllcyA9IGV4dGVuc2lvbnNWUk0ubWF0ZXJpYWxQcm9wZXJ0aWVzO1xuICAgIGlmIChtYXRlcmlhbFByb3BlcnRpZXMgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBtYXRlcmlhbFByb3BlcnR5IG9mIG1hdGVyaWFsUHJvcGVydGllcykge1xuICAgICAgICBpZiAobWF0ZXJpYWxQcm9wZXJ0eS5mbG9hdFByb3BlcnRpZXMuX091dGxpbmVXaWR0aE1vZGUgIT09IDApIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBWUk0gbWF0ZXJpYWwgcHJvcGVydGllcyB3aXRoIGRlZmF1bHQgdmFsdWVzIGZvciBtaXNzaW5nIHBhcmFtZXRlcnMuXG4gICAqIFRoaXMgbWV0aG9kIGVuc3VyZXMgYWxsIFZSTSBtYXRlcmlhbHMgaGF2ZSBjb21wbGV0ZSBwcm9wZXJ0eSBzZXRzLFxuICAgKiBwYXJ0aWN1bGFybHkgZm9yIE1Ub29uIHNoYWRlciBtYXRlcmlhbHMgY29tbW9ubHkgdXNlZCBpbiBWUk0gbW9kZWxzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIEdMVEYgbW9kZWwgdG8gcHJvY2VzcyBtYXRlcmlhbHMgZm9yXG4gICAqIEBwYXJhbSB0ZXh0dXJlc0xlbmd0aCAtIFRoZSB0b3RhbCBudW1iZXIgb2YgdGV4dHVyZXMgZm9yIGR1bW15IHRleHR1cmUgaW5kZXhpbmdcbiAgICovXG4gIHN0YXRpYyBfaW5pdGlhbGl6ZU1hdGVyaWFsUHJvcGVydGllcyhnbHRmTW9kZWw6IFJuTTIsIHRleHR1cmVzTGVuZ3RoOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBtYXRlcmlhbFByb3BlcnRpZXMgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0ubWF0ZXJpYWxQcm9wZXJ0aWVzO1xuXG4gICAgZm9yIChjb25zdCBtYXRlcmlhbFByb3BlcnR5IG9mIG1hdGVyaWFsUHJvcGVydGllcykge1xuICAgICAgaWYgKG1hdGVyaWFsUHJvcGVydHkuc2hhZGVyID09PSAnVlJNL01Ub29uJykge1xuICAgICAgICB0aGlzLl9faW5pdGlhbGl6ZU1Ub29uTWF0ZXJpYWxQcm9wZXJ0aWVzKGdsdGZNb2RlbCwgdGV4dHVyZXNMZW5ndGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgTVRvb24gbWF0ZXJpYWwgcHJvcGVydGllcyB3aXRoIGNvbXByZWhlbnNpdmUgZGVmYXVsdCB2YWx1ZXMuXG4gICAqIE1Ub29uIGlzIHRoZSBzdGFuZGFyZCB0b29uIHNoYWRlciBmb3IgVlJNLCBhbmQgdGhpcyBtZXRob2QgZW5zdXJlcyBhbGxcbiAgICogcmVxdWlyZWQgcHJvcGVydGllcyBhcmUgc2V0IHdpdGggYXBwcm9wcmlhdGUgZGVmYXVsdHMgZm9yIHByb3BlciByZW5kZXJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgR0xURiBtb2RlbCBjb250YWluaW5nIE1Ub29uIG1hdGVyaWFsc1xuICAgKiBAcGFyYW0gdGV4dHVyZXNMZW5ndGggLSBUaGUgdG90YWwgbnVtYmVyIG9mIHRleHR1cmVzIGZvciBkdW1teSB0ZXh0dXJlIGFzc2lnbm1lbnRcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faW5pdGlhbGl6ZU1Ub29uTWF0ZXJpYWxQcm9wZXJ0aWVzKGdsdGZNb2RlbDogUm5NMiwgdGV4dHVyZXNMZW5ndGg6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IG1hdGVyaWFsUHJvcGVydGllcyA9IGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTS5tYXRlcmlhbFByb3BlcnRpZXM7XG5cbiAgICBjb25zdCBkdW1teVdoaXRlVGV4dHVyZU51bWJlciA9IHRleHR1cmVzTGVuZ3RoIC0gMjtcbiAgICBjb25zdCBkdW1teUJsYWNrVGV4dHVyZU51bWJlciA9IHRleHR1cmVzTGVuZ3RoIC0gMTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0ZXJpYWxQcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBmbG9hdFByb3BlcnRpZXMgPSBtYXRlcmlhbFByb3BlcnRpZXNbaV0uZmxvYXRQcm9wZXJ0aWVzO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfQmxlbmRNb2RlJywgMC4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX0J1bXBTY2FsZScsIDEuMCk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KGZsb2F0UHJvcGVydGllcywgJ19DdWxsTW9kZScsIDIuMCk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KGZsb2F0UHJvcGVydGllcywgJ19DdXRvZmYnLCAwLjUpO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfRGVidWdNb2RlJywgMC4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX0RzdEJsZW5kJywgMC4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX0luZGlyZWN0TGlnaHRJbnRlbnNpdHknLCAwLjEpO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfTGlnaHRDb2xvckF0dGVudWF0aW9uJywgMC4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX091dGxpbmVDb2xvck1vZGUnLCAwLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfT3V0bGluZUN1bGxNb2RlJywgMS4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX091dGxpbmVMaWdodGluZ01peCcsIDEuMCk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KGZsb2F0UHJvcGVydGllcywgJ19PdXRsaW5lU2NhbGVkTWF4RGlzdGFuY2UnLCAxLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfT3V0bGluZVdpZHRoJywgMC41KTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX091dGxpbmVXaWR0aE1vZGUnLCAwLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfUmVjZWl2ZVNoYWRvd1JhdGUnLCAxLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfUmltRnJlc25lbFBvd2VyJywgMS4wKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX1JpbUxpZnQnLCAwLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfUmltTGlnaHRpbmdNaXgnLCAwLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfU2hhZGVTaGlmdCcsIDAuMCk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KGZsb2F0UHJvcGVydGllcywgJ19TaGFkZVRvb255JywgMC45KTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLCAnX1NoYWRpbmdHcmFkZVJhdGUnLCAxLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfU3JjQmxlbmQnLCAxLjApO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eShmbG9hdFByb3BlcnRpZXMsICdfWldyaXRlJywgMS4wKTtcbiAgICAgIC8vIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLFwiX1V2QW5pbVNjcm9sbFhcIiwgMC4wKTtcbiAgICAgIC8vIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLFwiX1V2QW5pbVNjcm9sbFlcIiwgMC4wKTtcbiAgICAgIC8vIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkoZmxvYXRQcm9wZXJ0aWVzLFwiX1V2QW5pbVJvdGF0aW9uXCIsIDAuMCk7XG5cbiAgICAgIGNvbnN0IHZlY3RvclByb3BlcnRpZXMgPSBtYXRlcmlhbFByb3BlcnRpZXNbaV0udmVjdG9yUHJvcGVydGllcztcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodmVjdG9yUHJvcGVydGllcywgJ19Db2xvcicsIFsxLCAxLCAxLCAxXSk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsICdfRW1pc3Npb25Db2xvcicsIFswLCAwLCAwXSk7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsICdfT3V0bGluZUNvbG9yJywgWzAsIDAsIDAsIDFdKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodmVjdG9yUHJvcGVydGllcywgJ19TaGFkZUNvbG9yJywgWzAuOTcsIDAuODEsIDAuODYsIDFdKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodmVjdG9yUHJvcGVydGllcywgJ19SaW1Db2xvcicsIFswLCAwLCAwXSk7XG4gICAgICAvLyB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsIFwiX0J1bXBNYXBcIiwgWzAsIDAsIDEsIDFdKTtcbiAgICAgIC8vIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodmVjdG9yUHJvcGVydGllcywgXCJfRW1pc3Npb25NYXBcIiwgWzAsIDAsIDEsIDFdKTtcbiAgICAgIC8vIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodmVjdG9yUHJvcGVydGllcywgXCJfTWFpblRleFwiLCBbMCwgMCwgMSwgMV0pO1xuICAgICAgLy8gdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eSh2ZWN0b3JQcm9wZXJ0aWVzLCBcIl9PdXRsaW5lV2lkdGhUZXh0dXJlXCIsIFswLCAwLCAxLCAxXSk7XG4gICAgICAvLyB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsIFwiX1JlY2VpdmVTaGFkb3dUZXh0dXJlXCIsIFswLCAwLCAxLCAxXSk7XG4gICAgICAvLyB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsIFwiX1NoYWRlVGV4dHVyZVwiLCBbMCwgMCwgMSwgMV0pO1xuICAgICAgLy8gdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eSh2ZWN0b3JQcm9wZXJ0aWVzLCBcIl9TaGFkaW5nR3JhZGVUZXh0dXJlXCIsIFswLCAwLCAxLCAxXSk7XG4gICAgICAvLyB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHZlY3RvclByb3BlcnRpZXMsIFwiX1NwaGVyZUFkZFwiLCBbMCwgMCwgMSwgMV0pO1xuXG4gICAgICAvLyBzZXQgbnVtIG9mIHRleHR1cmUgYXJyYXlcbiAgICAgIGNvbnN0IHRleHR1cmVQcm9wZXJ0aWVzID0gbWF0ZXJpYWxQcm9wZXJ0aWVzW2ldLnRleHR1cmVQcm9wZXJ0aWVzO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eSh0ZXh0dXJlUHJvcGVydGllcywgJ19CdW1wTWFwJywgZHVtbXlXaGl0ZVRleHR1cmVOdW1iZXIpO1xuICAgICAgdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eSh0ZXh0dXJlUHJvcGVydGllcywgJ19FbWlzc2lvbk1hcCcsIGR1bW15QmxhY2tUZXh0dXJlTnVtYmVyKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodGV4dHVyZVByb3BlcnRpZXMsICdfTWFpblRleCcsIGR1bW15V2hpdGVUZXh0dXJlTnVtYmVyKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodGV4dHVyZVByb3BlcnRpZXMsICdfT3V0bGluZVdpZHRoVGV4dHVyZScsIGR1bW15V2hpdGVUZXh0dXJlTnVtYmVyKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodGV4dHVyZVByb3BlcnRpZXMsICdfUmVjZWl2ZVNoYWRvd1RleHR1cmUnLCBkdW1teVdoaXRlVGV4dHVyZU51bWJlcik7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHRleHR1cmVQcm9wZXJ0aWVzLCAnX1JpbVRleHR1cmUnLCBkdW1teUJsYWNrVGV4dHVyZU51bWJlcik7XG4gICAgICB0aGlzLl9faW5pdGlhbGl6ZUZvclVuZGVmaW5lZFByb3BlcnR5KHRleHR1cmVQcm9wZXJ0aWVzLCAnX1NoYWRlVGV4dHVyZScsIGR1bW15V2hpdGVUZXh0dXJlTnVtYmVyKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodGV4dHVyZVByb3BlcnRpZXMsICdfU2hhZGluZ0dyYWRlVGV4dHVyZScsIGR1bW15V2hpdGVUZXh0dXJlTnVtYmVyKTtcbiAgICAgIHRoaXMuX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkodGV4dHVyZVByb3BlcnRpZXMsICdfU3BoZXJlQWRkJywgZHVtbXlCbGFja1RleHR1cmVOdW1iZXIpO1xuICAgICAgLy8gdGhpcy5fX2luaXRpYWxpemVGb3JVbmRlZmluZWRQcm9wZXJ0eSh0ZXh0dXJlUHJvcGVydGllcywgXCJfVXZBbmltTWFza1RleHR1cmVcIiwgZHVtbXlXaGl0ZVRleHR1cmVOdW1iZXIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2x0Zk1vZGVsLm1hdGVyaWFscy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBnbHRmTW9kZWwubWF0ZXJpYWxzW2ldO1xuICAgICAgaWYgKG1hdGVyaWFsLmV4dHJhcyA9PSBudWxsKSB7XG4gICAgICAgIG1hdGVyaWFsLmV4dHJhcyA9IHt9O1xuICAgICAgfVxuICAgICAgbWF0ZXJpYWwuZXh0cmFzLnZybTB4TWF0ZXJpYWxQcm9wZXJ0eSA9IG1hdGVyaWFsUHJvcGVydGllc1tpXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGRlZmF1bHQgdmFsdWUgZm9yIGFuIG9iamVjdCBwcm9wZXJ0eSBpZiBpdCdzIGN1cnJlbnRseSB1bmRlZmluZWQuXG4gICAqIFRoaXMgdXRpbGl0eSBtZXRob2QgaXMgdXNlZCB0aHJvdWdob3V0IG1hdGVyaWFsIGluaXRpYWxpemF0aW9uIHRvIGVuc3VyZVxuICAgKiBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyBoYXZlIHZhbGlkIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gY2hlY2sgYW5kIHBvdGVudGlhbGx5IG1vZGlmeVxuICAgKiBAcGFyYW0gcHJvcGVydHlOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrXG4gICAqIEBwYXJhbSBpbml0aWFsVmFsdWUgLSBUaGUgZGVmYXVsdCB2YWx1ZSB0byBzZXQgaWYgdGhlIHByb3BlcnR5IGlzIHVuZGVmaW5lZFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19pbml0aWFsaXplRm9yVW5kZWZpbmVkUHJvcGVydHkob2JqZWN0OiBhbnksIHByb3BlcnR5TmFtZTogc3RyaW5nLCBpbml0aWFsVmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmIChvYmplY3RbcHJvcGVydHlOYW1lXSA9PSBudWxsKSBvYmplY3RbcHJvcGVydHlOYW1lXSA9IGluaXRpYWxWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgYW5kIHZhbGlkYXRlcyBHTFRGIGxvYWQgb3B0aW9ucyBmb3IgVlJNIGltcG9ydC5cbiAgICogVGhpcyBtZXRob2QgaGFuZGxlcyBmaWxlIGV4dGVuc2lvbiBjb252ZXJzaW9uICgudnJtIHRvIC5nbGIpLCBzZXRzIHVwXG4gICAqIGRlZmF1bHQgbWF0ZXJpYWwgaGVscGVycywgYW5kIGNvbmZpZ3VyZXMgVlJNLXNwZWNpZmljIGltcG9ydCBmbGFncy5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBUaGUgaW5wdXQgbG9hZCBvcHRpb25zIHRvIHByb2Nlc3NcbiAgICogQHJldHVybnMgUHJvY2Vzc2VkIGFuZCB2YWxpZGF0ZWQgbG9hZCBvcHRpb25zIHdpdGggVlJNLXNwZWNpZmljIGRlZmF1bHRzXG4gICAqL1xuICBzdGF0aWMgX2dldE9wdGlvbnMob3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uKTogR2x0ZkxvYWRPcHRpb24ge1xuICAgIGlmIChvcHRpb25zICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBpbiBvcHRpb25zLmZpbGVzKSB7XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZS5zcGxpdCgnLnZybScpWzBdO1xuICAgICAgICBpZiAoZmlsZU5hbWUpIHtcbiAgICAgICAgICBjb25zdCBhcnJheWJ1ZmZlciA9IG9wdGlvbnMuZmlsZXNbZmlsZV07XG4gICAgICAgICAgb3B0aW9ucy5maWxlc1tgJHtmaWxlTmFtZX0uZ2xiYF0gPSBhcnJheWJ1ZmZlcjtcbiAgICAgICAgICBkZWxldGUgb3B0aW9ucy5maWxlc1tmaWxlXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL3NldCBkZWZhdWx0IHZhbHVlc1xuICAgICAgb3B0aW9ucy5fX2lzSW1wb3J0VlJNMHggPSB0cnVlO1xuICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMuZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSA9IFt7fV07XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5WzBdLmlzTW9ycGhpbmcpIHtcbiAgICAgICAgb3B0aW9ucy5tYXhNb3JwaFRhcmdldE51bWJlciA9IDA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgIGZpbGVzOiB7fSxcbiAgICAgICAgbG9hZGVyRXh0ZW5zaW9uOiB1bmRlZmluZWQsXG4gICAgICAgIGRlZmF1bHRNYXRlcmlhbEhlbHBlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheTogW3sgaXNMaWdodGluZzogdHJ1ZSwgaXNNb3JwaGluZzogdHJ1ZSwgaXNTa2lubmluZzogdHJ1ZSB9XSxcbiAgICAgICAgc3RhdGVzT2ZFbGVtZW50czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRhcmdldHM6IFtdLFxuICAgICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICAgIGVuYWJsZTogW10sXG4gICAgICAgICAgICAgIGZ1bmN0aW9uczoge30sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNUcmFuc3BhcmVudDogdHJ1ZSxcbiAgICAgICAgICAgIG9wYWNpdHk6IDEuMCxcbiAgICAgICAgICAgIGlzVGV4dHVyZUltYWdlVG9Mb2FkUHJlTXVsdGlwbGllZEFscGhhOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBfX2lzSW1wb3J0VlJNMHg6IHRydWUsXG4gICAgICAgIF9faW1wb3J0ZWRUeXBlOiAndnJtMHgnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMsb0JBQXdDO0FBQ2pELFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMsZUFBZTtBQUN4QixTQUFTLFVBQVU7QUFDbkIsU0FBbUIsVUFBdUI7QUFDMUMsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQ0FBb0M7QUFDN0MsU0FBUyxrQkFBa0I7QUFFM0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHNCQUFzQjtBQVF4QixJQUFNLGdCQUFOLE1BQU0sZUFBYztBQUFBLEVBQ2pCLGNBQWM7QUFBQSxFQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXdkIsYUFBb0IsY0FDbEIsUUFDQSxLQUNBLFNBQzREO0FBNUNoRTtBQTZDSSxjQUFVLEtBQUss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
