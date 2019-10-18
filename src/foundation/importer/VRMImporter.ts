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

type HumanBone = {
  bone: string,
  node: number,
  useDefaultValues: boolean
};

type LookAt = {
  curve: number[],
  xRange: number,
  yRange: number
};

type BlendShapeBind = {
  mesh: number,
  index: number,
  weight: number
};

type BlendShapeGroup = {
  name: string,
  presetName: string,
  binds: BlendShapeBind[],
  materialValues: []
};

type BoneGroup = {
  comment: string,
  stiffiness: number,
  gravityPower: number,
  gravityDir: {
    x: number,
    y: number,
    z: number
  },
  dragForce: number,
  center: number,
  hitRadius: number,
  bones: number[],
  colliderGroups: number[]
}

type Collider = {
  offset: {
    x: number,
    y: number,
    z: number
  },
  radius: number
}

type ColliderGroup = {
  node: number,
  colliders: Collider[]
}

type MaterialProperty = {
  name: string,
  renderQueue: number,
  shader: string,
  floatProperties: {
    _Cutoff: number,
    _BumpScale: number,
    _ReceiveShadowRate: number,
    _ShadingGradeRate: number,
    _ShadeShift: number,
    _ShadeToony: number,
    _LightColorAttenuation: number,
    _IndirectLightIntensity: number,
    _OutlineWidth: number,
    _OutlineScaledMaxDistance: number,
    _OutlineLightingMix: number,
    _DebugMode: number,
    _BlendMode: number,
    _OutlineWidthMode: number,
    _OutlineColorMode: number,
    _CullMode: number,
    _OutlineCullMode: number,
    _SrcBlend: number,
    _DstBlend: number,
    _ZWrite: number
  },
  vectorProperties: {
    _Color: number[],
    _ShadeColor: number[],
    _MainTex: number[],
    _ShadeTexture: number[],
    _BumpMap: number[],
    _ReceiveShadowTexture: number[],
    _ShadingGradeTexture: number[],
    _SphereAdd: number[],
    _EmissionColor: number[],
    _EmissionMap: number[],
    _OutlineWidthTexture: number[],
    _OutlineColor: number[]
  },
  textureProperties: {
    _MainTex: number,
    _ShadeTexture: number,
    _BumpMap: number,
    _SphereAdd: number,
    _EmissionMap: number
  },
  keywordMap: {
    _NORMALMAP: boolean
  },
  tagMap: {
    RenderType: string
  }
}

export type VRM = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption,
      rnEntities?: Entity[],
      basePath?: string,
      version?: string,
      fileType?: string,
    }
  },
  buffers: any[],
  scenes: any[],
  meshes: any[],
  nodes: any[],
  skins: any[],
  materials: any[],
  cameras: any[],
  shaders?: any[],
  images: any[],
  animations: Array<{
    channels: any[],
    samplers: any[]
  }>,
  textures: any[],
  samplers: any[],
  accessors: any[],
  bufferViews: any[],
  buffer: any[],
  extensionsUsed?: any,
  extensions: {
    VRM: {
      exporterVersion: string,
      meta: {
        version: string,
        author: string,
        contactInformation: string,
        reference: string,
        title: string,
        texture: 30,
        allowedUserName: string,
        violentUssageName: string,
        sexualUssageName: string,
        commercialUssageName: string,
        otherPermissionUrl: string,
        licenseName: string,
        otherLicenseUrl: string
      }
      humanoid: {
        humanBones: HumanBone[],
        armStretch: number,
        legStretch: number,
        upperArmTwist: number,
        lowerArmTwist: number,
        upperLegTwist: number,
        lowerLegTwist: number,
        feetSpacing: number,
        hasTranslationDoF: false
      },
      firstPerson: {
        firstPersonBone: number,
        firstPersonBoneOffset: {
          x: number,
          y: number,
          z: number
        },
        meshAnnotations: [],
        lookAtTypeName: string,
        lookAtHorizontalInner: LookAt,
        lookAtHorizontalOuter: LookAt,
        lookAtVerticalDown: LookAt,
        lookAtVerticalUP: LookAt,
      },
      blendShapeMaster: {
        blendShapeGroups: BlendShapeGroup[]
      },
      secondaryAnimation: {
        boneGroups: BoneGroup[],
        colliderGroups: ColliderGroup[]
      },
      materialProperties: MaterialProperty[]
    }
  }
};
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
    const modelConverter = ModelConverter.getInstance();


    const gltfModel = await gltf2Importer.import(uri, options);

    const textures = this.__createTextures(gltfModel);
    const helperArgument0 = gltfModel.asset.extras!.rnLoaderOptions!.defaultMaterialHelperArgumentArray[0];
    helperArgument0["textures"] = textures;

    const materialPropertiesArray = this.__createMaterialPropertiesArray(gltfModel, textures.length);
    gltfModel.extensions.VRM["rnExtension"] = { materialPropertiesArray: materialPropertiesArray };

    let existOutline = false;
    for (let materialProperties of materialPropertiesArray) {
      if (materialProperties[0][13] !== 0) {
        existOutline = true;
        break;
      }
    }


    const rootGroups = [];

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
      if (options.defaultMaterialHelperName === "createMToonMaterial") {
        options.defaultMaterialHelperName = null;
      }
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
      vrmSpringBoneGroup.stiffnessForce = boneGroup.stiffiness;
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

  private __createMaterialPropertiesArray(gltfModel: glTF2, texturesLength: number) {
    const materialProperties = gltfModel.extensions.VRM.materialProperties;
    const materialPropertiesArray: any = [];

    const dummyWhiteTextureNumber = texturesLength - 2;
    const dummyBlackTextureNumber = texturesLength - 1;

    for (let i = 0; i < materialProperties.length; i++) {
      const floatProperties = materialProperties[i].floatProperties;
      const floatPropertiesArray: number[] = [];
      floatPropertiesArray[0] = (floatProperties["_BlendMode"] != null ? floatProperties["_BlendMode"] : 0.0);
      floatPropertiesArray[1] = (floatProperties["_BumpScale"] != null ? floatProperties["_BumpScale"] : 1.0);
      floatPropertiesArray[2] = (floatProperties["_CullMode"] != null ? floatProperties["_CullMode"] : 2.0);
      floatPropertiesArray[3] = (floatProperties["_Cutoff"] != null ? floatProperties["_Cutoff"] : 0.5);
      floatPropertiesArray[4] = (floatProperties["_DebugMode"] != null ? floatProperties["_DebugMode"] : 0.0);
      floatPropertiesArray[5] = (floatProperties["_DstBlend"] != null ? floatProperties["_DstBlend"] : 0.0);
      floatPropertiesArray[6] = (floatProperties["_IndirectLightIntensity"] != null ? floatProperties["_IndirectLightIntensity"] : 0.1);
      floatPropertiesArray[7] = (floatProperties["_LightColorAttenuation"] != null ? floatProperties["_LightColorAttenuation"] : 0.0);
      floatPropertiesArray[8] = (floatProperties["_OutlineColorMode"] != null ? floatProperties["_OutlineColorMode"] : 0.0);
      floatPropertiesArray[9] = (floatProperties["_OutlineCullMode"] != null ? floatProperties["_OutlineCullMode"] : 1.0);
      floatPropertiesArray[10] = (floatProperties["_OutlineLightingMix"] != null ? floatProperties["_OutlineLightingMix"] : 1.0);
      floatPropertiesArray[11] = (floatProperties["_OutlineScaledMaxDistance"] != null ? floatProperties["_OutlineScaledMaxDistance"] : 1.0);
      floatPropertiesArray[12] = (floatProperties["_OutlineWidth"] != null ? floatProperties["_OutlineWidth"] : 0.5);
      floatPropertiesArray[13] = (floatProperties["_OutlineWidthMode"] != null ? floatProperties["_OutlineWidthMode"] : 0.0);
      floatPropertiesArray[14] = (floatProperties["_ReceiveShadowRate"] != null ? floatProperties["_ReceiveShadowRate"] : 1.0);
      floatPropertiesArray[15] = (floatProperties["_RimFresnelPower"] != null ? floatProperties["_RimFresnelPower"] : 1.0);
      floatPropertiesArray[16] = (floatProperties["_RimLift"] != null ? floatProperties["_RimLift"] : 0.0);
      floatPropertiesArray[17] = (floatProperties["_RimLightingMix"] != null ? floatProperties["_RimLightingMix"] : 0.0);
      floatPropertiesArray[18] = (floatProperties["_ShadeShift"] != null ? floatProperties["_ShadeShift"] : 0.0);
      floatPropertiesArray[19] = (floatProperties["_ShadeToony"] != null ? floatProperties["_ShadeToony"] : 0.9);
      floatPropertiesArray[20] = (floatProperties["_ShadingGradeRate"] != null ? floatProperties["_ShadingGradeRate"] : 1.0);
      floatPropertiesArray[21] = (floatProperties["_SrcBlend"] != null ? floatProperties["_SrcBlend"] : 1.0);
      floatPropertiesArray[22] = (floatProperties["_ZWrite"] != null ? floatProperties["_ZWrite"] : 1.0);
      // floatPropertiesArray[23] = (floatProperties["_UvAnimScrollX"] != null ? floatProperties["_UvAnimScrollX"] : 0.0);
      // floatPropertiesArray[24] = (floatProperties["_UvAnimScrollY"] != null ? floatProperties["_UvAnimScrollY"] : 0.0);
      // floatPropertiesArray[25] = (floatProperties["_UvAnimRotation"] != null ? floatProperties["_UvAnimRotation"] : 0.0);

      const vectorProperties = materialProperties[i].vectorProperties;
      const vectorPropertiesArray: any[] = [];
      vectorPropertiesArray[0] = (vectorProperties["_Color"] != null ? vectorProperties["_Color"] : [1, 1, 1, 1]);
      vectorPropertiesArray[1] = (vectorProperties["_EmissionColor"] != null ? vectorProperties["_EmissionColor"] : [0, 0, 0]);
      vectorPropertiesArray[2] = (vectorProperties["_OutlineColor"] != null ? vectorProperties["_OutlineColor"] : [0, 0, 0, 1]);
      vectorPropertiesArray[3] = (vectorProperties["_ShadeColor"] != null ? vectorProperties["_ShadeColor"] : [0.97, 0.81, 0.86, 1]);
      vectorPropertiesArray[4] = (vectorProperties["_RimColor"] != null ? vectorProperties["_RimColor"] : [0, 0, 0]);
      // vectorPropertiesArray[5] = (vectorProperties["_BumpMap"] != null ? vectorProperties["_BumpMap"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[6] = (vectorProperties["_EmissionMap"] != null ? vectorProperties["_EmissionMap"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[7] = (vectorProperties["_MainTex"] != null ? vectorProperties["_MainTex"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[8] = (vectorProperties["_OutlineWidthTexture"] != null ? vectorProperties["_OutlineWidthTexture"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[9] = (vectorProperties["_ReceiveShadowTexture"] != null ? vectorProperties["_ReceiveShadowTexture"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[10] = (vectorProperties["_ShadeTexture"] != null ? vectorProperties["_ShadeTexture"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[11] = (vectorProperties["_ShadingGradeTexture"] != null ? vectorProperties["_ShadingGradeTexture"] : [0, 0, 1, 1]);
      // vectorPropertiesArray[12] = (vectorProperties["_SphereAdd"] != null ? vectorProperties["_SphereAdd"] : [0, 0, 1, 1]);

      // do not set initial value
      const textureProperties = materialProperties[i].textureProperties;
      const texturePropertiesArray: any[] = [];
      texturePropertiesArray[0] = (textureProperties["_BumpMap"] != null ? textureProperties["_BumpMap"] : dummyWhiteTextureNumber);
      texturePropertiesArray[1] = (textureProperties["_EmissionMap"] != null ? textureProperties["_EmissionMap"] : dummyBlackTextureNumber);
      texturePropertiesArray[2] = (textureProperties["_MainTex"] != null ? textureProperties["_MainTex"] : dummyWhiteTextureNumber);
      texturePropertiesArray[3] = (textureProperties["_OutlineWidthTexture"] != null ? textureProperties["_OutlineWidthTexture"] : dummyWhiteTextureNumber);
      texturePropertiesArray[4] = (textureProperties["_ReceiveShadowTexture"] != null ? textureProperties["_ReceiveShadowTexture"] : dummyWhiteTextureNumber);
      texturePropertiesArray[5] = (textureProperties["_RimTexture"] != null ? textureProperties["_RimTexture"] : dummyBlackTextureNumber);
      texturePropertiesArray[6] = (textureProperties["_ShadeTexture"] != null ? textureProperties["_ShadeTexture"] : dummyWhiteTextureNumber);
      texturePropertiesArray[7] = (textureProperties["_ShadingGradeTexture"] != null ? textureProperties["_ShadingGradeTexture"] : dummyWhiteTextureNumber);
      texturePropertiesArray[8] = (textureProperties["_SphereAdd"] != null ? textureProperties["_SphereAdd"] : dummyBlackTextureNumber);
      // texturePropertiesArray[9] = (textureProperties["_UvAnimMaskTexture"] != null ? textureProperties["_UvAnimMaskTexture"] : dummyWhiteTextureNumber);

      materialPropertiesArray.push([floatPropertiesArray, vectorPropertiesArray, texturePropertiesArray]);
    }
    return materialPropertiesArray;
  }

}