import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption, glTF2 } from "../../types/glTF";
import ModelConverter from "./ModelConverter";
import PhysicsComponent from "../components/PhysicsComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import SphereCollider from "../physics/SphereCollider";
import Texture from "../textures/Texture";
import Vector3 from "../math/Vector3";
import VRMColliderGroup from "../physics/VRMColliderGroup";
import VRMSpringBoneGroup from "../physics/VRMSpringBoneGroup";
import VRMSpringBonePhysicsStrategy from "../physics/VRMSpringBonePhysicsStrategy";
import { VRM } from "../../types/VRM";

/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export default class VRMImporter {
  private static __instance: VRMImporter;

  private constructor() { }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new VRMImporter();
    }
    return this.__instance;
  }


  async importJsonOnly(uri: string, options?: GltfLoadOption): Promise<VRM> {
    options = this.getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    return gltf2Importer.import(uri, options);
  }

  /**
   * Import VRM file.
   */
  async import(uri: string, options?: GltfLoadOption) {
    options = this.getOptions(options);

    const gltf2Importer = Gltf2Importer.getInstance();
    const gltfModel = await gltf2Importer.import(uri, options);

    const textures = this.__createTextures(gltfModel);
    this.__attachRnExtensionToGLTFModel(gltfModel, textures.length);
    const existOutline = this.__existOutlineMaterial(gltfModel.extensions.VRM);

    const helperArgument0 = gltfModel.asset.extras!.rnLoaderOptions!.defaultMaterialHelperArgumentArray[0];
    helperArgument0["textures"] = textures;


    const rootGroups = [];
    const modelConverter = ModelConverter.getInstance();

    helperArgument0["isOutline"] = false;
    const rootGroupMain = modelConverter.convertToRhodoniteObject(gltfModel);
    this.readSpringBone(rootGroupMain, gltfModel);
    this.readVRMHumanoidInfo(rootGroupMain, gltfModel);
    rootGroups.push(rootGroupMain);

    if (existOutline) {
      helperArgument0["isOutline"] = true;
      const rootGroupOutline = modelConverter.convertToRhodoniteObject(gltfModel);
      this.readVRMHumanoidInfo(rootGroupOutline, gltfModel);
      rootGroups.push(rootGroupOutline);
    }

    return rootGroups;
  }


  private getOptions(options: GltfLoadOption | undefined) {
    if (options != null) {
      for (let file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }
      options.isImportVRM = true;
      if (options.defaultMaterialHelperArgumentArray == null) {
        options.defaultMaterialHelperArgumentArray = [{}];
      }
    }
    else {
      options = {
        files: {},
        loaderExtension: null,
        defaultMaterialHelperName: null,
        defaultMaterialHelperArgumentArray: [{}],
        statesOfElements: [
          {
            targets: [],
            states: {
              enable: [],
              functions: {}
            },
            isTransparent: true,
            opacity: 1.0,
            isTextureImageToLoadPreMultipliedAlpha: false,
          }
        ],
        isImportVRM: true
      };
    }
    return options;
  }

  readVRMHumanoidInfo(rootEntity: Entity, gltfModel: VRM) {
    const humanBones = gltfModel.extensions.VRM.humanoid.humanBones;
    const mapNameNodeId: Map<string, number> = new Map();
    for (let bone of humanBones) {
      mapNameNodeId.set(bone.bone, bone.node);
    }
    rootEntity.tryToSetTag({
      tag: 'humanoid_map_name_nodeId',
      value: mapNameNodeId
    });
  }

  readSpringBone(rootEntity: Entity, gltfModel: VRM) {
    const entityRepository = EntityRepository.getInstance();
    const boneGroups: VRMSpringBoneGroup[] = [];
    for (let boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      const vrmSpringBoneGroup = new VRMSpringBoneGroup();
      vrmSpringBoneGroup.tryToSetUniqueName(boneGroup.comment, true);
      vrmSpringBoneGroup.dragForce = boneGroup.dragForce;
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffness;
      vrmSpringBoneGroup.gravityPower = boneGroup.gravityPower;
      vrmSpringBoneGroup.gravityDir = new Vector3(boneGroup.gravityDir.x, boneGroup.gravityDir.y, boneGroup.gravityDir.z);
      vrmSpringBoneGroup.colliderGroupIndices = boneGroup.colliderGroups;
      vrmSpringBoneGroup.hitRadius = boneGroup.hitRadius;
      for (let idxOfArray in boneGroup.bones) {
        const boneNodeIndex = boneGroup.bones[idxOfArray];
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        vrmSpringBoneGroup.rootBones.push(entity.getSceneGraph());
        // const boneNodeIndex = boneGroup.bones[idxOfArray];
        // const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        // entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
      }
      boneGroups.push(vrmSpringBoneGroup);
    }

    VRMSpringBonePhysicsStrategy.setBoneGroups(boneGroups)
    for (let boneGroup of boneGroups) {
      for (let sg of boneGroup.rootBones) {
        this.addPhysicsComponentRecursively(entityRepository, sg);
      }
    }

    const colliderGroups: VRMColliderGroup[] = [];
    for (let colliderGroupIdx in gltfModel.extensions.VRM.secondaryAnimation.colliderGroups) {
      const colliderGroup = gltfModel.extensions.VRM.secondaryAnimation.colliderGroups[colliderGroupIdx]
      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      for (let collider of colliderGroup.colliders) {
        const sphereCollider = new SphereCollider();
        sphereCollider.position = new Vector3(collider.offset.x, collider.offset.y, collider.offset.z);
        sphereCollider.radius = collider.radius;
        colliders.push(sphereCollider);
      }
      vrmColliderGroup.colliders = colliders;
      const baseSg = gltfModel.asset.extras!.rnEntities![colliderGroup.node].getSceneGraph();
      vrmColliderGroup.baseSceneGraph = baseSg;
      VRMSpringBonePhysicsStrategy.addColliderGroup(parseInt(colliderGroupIdx), vrmColliderGroup);
    }

  }

  addPhysicsComponentRecursively(entityRepository: EntityRepository, sg: SceneGraphComponent) {
    const entity = sg.entity;
    entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (let child of sg.children) {
        this.addPhysicsComponentRecursively(entityRepository, child);
      }
    }
  }

  private __createTextures(gltfModel: glTF2) {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: any = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture({ texture: gltfTextures[i] }, gltfModel);
      rnTextures.push(rnTexture);
    }

    const dummyWhiteTexture = new Texture();
    dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    dummyBlackTexture.generate1x1TextureFrom("rgba(0, 0, 0, 1)");
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  private __existOutlineMaterial(extensionsVRM: any) {
    const materialProperties = extensionsVRM.materialProperties;
    if (materialProperties != null) {
      for (let materialProperty of materialProperties) {
        if (materialProperty.floatProperties._OutlineWidthMode !== 0) {
          return true;
        }
      }
    }

    return false;
  }

  private __attachRnExtensionToGLTFModel(gltfModel: glTF2, texturesLength: number) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    for (let materialProperty of materialProperties) {
      if (materialProperty.shader === "VRM/MToon") {
        this.__initializeMToonMaterialProperties(gltfModel, texturesLength);
        break;
      }
    }
  }

  private __initializeMToonMaterialProperties(gltfModel: glTF2, texturesLength: number) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;

    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;

    for (let i = 0; i < materialProperties.length; i++) {
      const floatProperties = materialProperties[i].floatProperties;
      this.__initializeForUndefinedProperty(floatProperties, "_BlendMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_BumpScale", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_CullMode", 2.0);
      this.__initializeForUndefinedProperty(floatProperties, "_Cutoff", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_DebugMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_DstBlend", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_IndirectLightIntensity", 0.1);
      this.__initializeForUndefinedProperty(floatProperties, "_LightColorAttenuation", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineColorMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineCullMode", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineLightingMix", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineScaledMaxDistance", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidth", 0.5);
      this.__initializeForUndefinedProperty(floatProperties, "_OutlineWidthMode", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ReceiveShadowRate", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimFresnelPower", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLift", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_RimLightingMix", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeShift", 0.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadeToony", 0.9);
      this.__initializeForUndefinedProperty(floatProperties, "_ShadingGradeRate", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_SrcBlend", 1.0);
      this.__initializeForUndefinedProperty(floatProperties, "_ZWrite", 1.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollX", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimScrollY", 0.0);
      // this.__initializeForUndefinedProperty(floatProperties,"_UvAnimRotation", 0.0);

      const vectorProperties = materialProperties[i].vectorProperties;
      this.__initializeForUndefinedProperty(vectorProperties, "_Color", [1, 1, 1, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_EmissionColor", [0, 0, 0]);
      this.__initializeForUndefinedProperty(vectorProperties, "_OutlineColor", [0, 0, 0, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_ShadeColor", [0.97, 0.81, 0.86, 1]);
      this.__initializeForUndefinedProperty(vectorProperties, "_RimColor", [0, 0, 0]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_BumpMap", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_EmissionMap", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_MainTex", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_OutlineWidthTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ReceiveShadowTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ShadeTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_ShadingGradeTexture", [0, 0, 1, 1]);
      // this.__initializeForUndefinedProperty(vectorProperties, "_SphereAdd", [0, 0, 1, 1]);

      // set num of texture array
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
      // this.__initializeForUndefinedProperty(textureProperties, "_UvAnimMaskTexture", dummyWhiteTextureNumber);
    }
  }

  private __initializeForUndefinedProperty(object: any, propertyName: string, initialValue: any) {
    if (object[propertyName] == null) object[propertyName] = initialValue;
  }
}