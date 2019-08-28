import Gltf2Importer from "./Gltf2Importer";
import { GltfLoadOption, glTF2 } from "../../types/glTF";
import ModelConverter from "./ModelConverter";
import Entity from "../core/Entity";
import Rn from "../main";
import RnObject from "../core/RnObject";
import EntityRepository from "../core/EntityRepository";
import PhysicsComponent from "../components/PhysicsComponent";
import VRMSpringBonePhysicsStrategy from "../physics/VRMSpringBonePhysicsStrategy";
import Vector3 from "../math/Vector3";

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

  private constructor() {
  }

  /**
   * Import VRM file.
   */
  async import(uri: string, options?: GltfLoadOption) {
    const gltf2Importer = Gltf2Importer.getInstance();

    if (options) {
      for (let file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName+'.glb'] = arraybuffer;
          delete options.files[file];
        }
      }
    }

    const gltfModel = await gltf2Importer.import(uri, options);
    const modelConverter = ModelConverter.getInstance();
    const rootEntity = modelConverter.convertToRhodoniteObject(gltfModel);
    this.readSpringBone(rootEntity, gltfModel);

    return rootEntity;
  }

  readSpringBone(rootEntity: Entity, gltfModel: VRM) {
    const entityRepository = EntityRepository.getInstance();
    for (let boneGroup of gltfModel.extensions.VRM.secondaryAnimation.boneGroups) {
      for (let boneNodeIndex of boneGroup.bones) {
        const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        entityRepository.addComponentsToEntity([PhysicsComponent], entity.entityUID);
        const physicsComponent = entity.getComponent(PhysicsComponent) as PhysicsComponent;
        const vrmSprintBone = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
        const sceneGraph = entity.getSceneGraph();
        const transform = entity.getTransform();
        vrmSprintBone.initialize(sceneGraph.parent!,
            new Vector3(
            transform.translate.x * transform.scale.x,
            transform.translate.y * transform.scale.y,
            transform.translate.z * transform.scale.z
          ),
          void 0);
      }
    }
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new VRMImporter();
    }
    return this.__instance;
  }

}
