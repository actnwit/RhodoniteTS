/* eslint-disable prettier/prettier */
import {ModelConverter} from './ModelConverter';
import {Is} from '../misc/Is';
import {ISceneGraphEntity} from '../helpers/EntityHelper';
import {GltfLoadOption, RnM2, Vrm0xMaterialProperty} from '../../types';
import {RenderPass} from '../renderer/RenderPass';
import {Texture} from '../textures/Texture';
import {EntityRepository} from '../core/EntityRepository';
import {VRMSpringBonePhysicsStrategy} from '../physics/VRMSpringBonePhysicsStrategy';
import {PhysicsComponent} from '../components/Physics/PhysicsComponent';
import {SceneGraphComponent} from '../components/SceneGraph/SceneGraphComponent';
import {SphereCollider} from '../physics/SphereCollider';
import {Vector3} from '../math/Vector3';
import {VRMColliderGroup} from '../physics/VRMColliderGroup';
import {VRMSpringBoneGroup} from '../physics/VRMSpringBoneGroup';
import {Vrm1, Vrm1_Materials_MToon} from '../../types/VRM1';

export class VrmImporter {
  private constructor() {}

  static async __importVRM(
    gltfModel: RnM2,
    renderPasses: RenderPass[]
  ): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions
        ?.defaultMaterialHelperArgumentArray;
    const textures = this._createTextures(gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures =
        defaultMaterialHelperArgumentArray[0].textures ??
        textures;
      defaultMaterialHelperArgumentArray[0].isLighting =
        defaultMaterialHelperArgumentArray[0].isLighting ?? true;
    }
    const existOutline = this.__initializeMToonMaterialProperties(
        gltfModel,
        textures.length
      );

    // get rootGroup
    let rootGroup;
    if (existOutline) {
      renderPasses[1] = renderPasses[1] ?? new RenderPass();
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM = {};
      gltfModel.extensions.VRM.rnExtension = {
        renderPassOutline: renderPassOutline,
      };

      rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = ModelConverter.convertToRhodoniteObject(gltfModel);
    }

    const renderPassMain = renderPasses[0];
    renderPassMain.addEntities([rootGroup]);

    this._readSpringBone(gltfModel as Vrm1);
    this._readVRMHumanoidInfo(gltfModel as Vrm1, rootGroup);
  }

  static _readVRMHumanoidInfo(
    gltfModel: Vrm1,
    rootEntity?: ISceneGraphEntity
  ): void {
    const humanBones = gltfModel.extensions.VRMC_vrm.humanoid.humanBones;
    const mapNameNodeId: Map<string, number> = new Map();
    for (const boneName in humanBones) {
      const bone = humanBones[boneName];
      mapNameNodeId.set(boneName, bone.node);
    }
    if (rootEntity != null) {
      rootEntity.tryToSetTag({
        tag: 'humanoid_map_name_nodeId',
        value: mapNameNodeId,
      });
    }
  }

  static _readSpringBone(gltfModel: Vrm1): void {
    const boneGroups: VRMSpringBoneGroup[] = [];
    for (const spring of gltfModel.extensions.VRMC_springBone.springs) {
      const vrmSpringBoneGroup = new VRMSpringBoneGroup();
      vrmSpringBoneGroup.tryToSetUniqueName(spring.name, true);
      vrmSpringBoneGroup.colliderGroupIndices = Is.exist(spring.colliderGroups) ? spring.colliderGroups : [];
      for (const jointIdx in spring.joints) {
        const joint = spring.joints[jointIdx];
        vrmSpringBoneGroup.dragForce = joint.dragForce;
        vrmSpringBoneGroup.stiffnessForce = joint.stiffness;
        vrmSpringBoneGroup.gravityPower = Is.exist(joint.gravityPower) ? joint.gravityPower : 1;
        vrmSpringBoneGroup.gravityDir = Is.exist(joint.gravityDir) ? Vector3.fromCopyArray3([
          joint.gravityDir[0],
          joint.gravityDir[1],
          joint.gravityDir[2],
        ]) : Vector3.fromCopyArray3([0, -1, 0]);
        vrmSpringBoneGroup.hitRadius = joint.hitRadius;
        const entity = gltfModel.asset.extras!.rnEntities![joint.node];
        vrmSpringBoneGroup.rootBones.push(entity.getSceneGraph()!);

        // const boneNodeIndex = boneGroup.bones[idxOfArray];
        // const entity = gltfModel.asset.extras!.rnEntities![boneNodeIndex];
        // entityRepository.addComponentToEntity(PhysicsComponent, entity.entityUID);
      }
      boneGroups.push(vrmSpringBoneGroup);
    }

    VRMSpringBonePhysicsStrategy.setBoneGroups(boneGroups);
    for (const boneGroup of boneGroups) {
      for (const sg of boneGroup.rootBones) {
        this.__addPhysicsComponentRecursively(EntityRepository, sg);
      }
    }

    const colliderGroups: VRMColliderGroup[] = [];
    for (const colliderGroupIdx in gltfModel.extensions.VRMC_springBone
      .colliderGroups) {
      const colliderGroup =
        gltfModel.extensions.VRMC_springBone.colliderGroups[colliderGroupIdx];

      const vrmColliderGroup = new VRMColliderGroup();
      colliderGroups.push(vrmColliderGroup);
      const colliders: SphereCollider[] = [];
      for (const colliderIdx of colliderGroup.colliders) {
        const collider =
          gltfModel.extensions.VRMC_springBone.colliders[colliderIdx];

        if (collider.shape.sphere) {
          const sphereCollider = new SphereCollider();
          sphereCollider.position = Vector3.fromCopyArray([
            collider.shape.sphere.offset[0],
            collider.shape.sphere.offset[1],
            collider.shape.sphere.offset[2],
          ]);
          sphereCollider.radius = collider.shape.sphere.radius;
          colliders.push(sphereCollider);
          const baseSg =
            gltfModel.asset.extras!.rnEntities![collider.node].getSceneGraph();
          sphereCollider.baseSceneGraph = baseSg;
          vrmColliderGroup.baseSceneGraph = baseSg;
        }
      }
      vrmColliderGroup.colliders = colliders;
      VRMSpringBonePhysicsStrategy.addColliderGroup(
        parseInt(colliderGroupIdx),
        vrmColliderGroup
      );
    }
  }

  private static __addPhysicsComponentRecursively(
    entityRepository: EntityRepository,
    sg: SceneGraphComponent
  ): void {
    const entity = sg.entity;
    EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    VRMSpringBonePhysicsStrategy.initialize(sg);
    if (sg.children.length > 0) {
      for (const child of sg.children) {
        this.__addPhysicsComponentRecursively(entityRepository, child);
      }
    }
  }

  static _createTextures(gltfModel: RnM2): Texture[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture(
        gltfTextures[i],
        gltfModel
      );
      rnTextures[i] = rnTexture;
    }

    const dummyWhiteTexture = new Texture();
    dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  private static __initializeMToonMaterialProperties(
    gltfModel: RnM2,
    texturesLength: number
  ): boolean {
    let isOutline = false;
    for (const material of gltfModel.materials) {
      const mtoonMaterial: Vrm1_Materials_MToon = material.extensions?.VRMC_materials_mtoon;
      if (mtoonMaterial == null) {
        continue;
      }
      const dummyWhiteTextureNumber = texturesLength - 2;
      const dummyBlackTextureNumber = texturesLength - 1;

      const vrm0xMaterialProperty: Vrm0xMaterialProperty = {
        name: 'vrm0xMaterialProperty',
        renderQueue: 0, // dummy value
        shader: 'VRM/MToon',
        floatProperties: {
          _BlendMode: Is.not.exist(material.alphaMode) ? 0 :
            (material.alphaMode === 'OPAQUE' ? 0 :
              (material.alphaMode === 'MASK' ? 1 :
                (material.alphaMode === 'BLEND' ? 2 : 3))),
          _CullMode: Is.not.exist(material.doubleSided) ? 2 :
            (material.doubleSided ? 0 : 2),
          _BumpScale: 1.0,
          _Cutoff: Is.not.exist(material.alphaCutoff) ? 0.5 : material.alphaCutoff,
          _DebugMode: 0,
          _SrcBlend: 5,
          _DstBlend: 10,
          _IndirectLightIntensity: 0.1,
          _LightColorAttenuation: 0.0,
          _OutlineColorMode: 1,
          _OutlineCullMode: 1,
          _OutlineLightingMix: mtoonMaterial.outlineLightingMixFactor,
          _OutlineScaledMaxDistance: 1.0,
          _OutlineWidth: mtoonMaterial.outlineWidthFactor,
          _OutlineWidthMode: (mtoonMaterial.outlineWidthMode === 'worldCoordinates') ? 1 :
            (mtoonMaterial.outlineWidthMode === 'screenCoordinates' ? 2 : 0),
          _ReceiveShadowRate: 1.0,
          _RimFresnelPower: mtoonMaterial.parametricRimFresnelPowerFactor,
          _RimLift: mtoonMaterial.parametricRimLiftFactor,
          _RimLightingMix: mtoonMaterial.parametricRimLiftFactor,
          _ShadeShift: mtoonMaterial.shadingShiftFactor,
          _ShadeToony: mtoonMaterial.shadingToonyFactor,
          _ShadingGradeRate: 1.0,
          _ZWrite: mtoonMaterial.transparentWithZWrite ? 1 : 0,
        },
        vectorProperties: {
          _Color: Is.not.exist(material.pbrMetallicRoughness?.baseColorFactor) ? [1, 1, 1, 1] : material.pbrMetallicRoughness!.baseColorFactor,
          _EmissionColor: Is.not.exist(material.emissiveFactor) ? [0, 0, 0] : material.emissiveFactor,
          _OutlineColor: mtoonMaterial.outlineColorFactor,
          _ShadeColor: mtoonMaterial.shadeColorFactor,
          _RimColor: mtoonMaterial.parametricRimColorFactor,
          _BumpMap: [0, 0, 1, 1],
          _EmissionMap: [0, 0, 1, 1],
          _MainTex: [0, 0, 1, 1],
          _OutlineWidthTexture: [0, 0, 1, 1],
          _ReceiveShadowTexture: [0, 0, 1, 1],
          _ShadeTexture: [0, 0, 1, 1],
          _ShadingGradeTexture: [0, 0, 1, 1],
          _SphereAdd: [0, 0, 1, 1],
        },
        textureProperties: {
          _BumpMap: Is.not.exist(material.normalTexture) ? dummyWhiteTextureNumber : material.normalTexture.index,
          _EmissionMap: Is.not.exist(material.emissiveTexture) ? dummyBlackTextureNumber : material.emissiveTexture.index,
          _MainTex: Is.not.exist(material.pbrMetallicRoughness?.baseColorTexture) ? dummyWhiteTextureNumber : material.pbrMetallicRoughness!.baseColorTexture.index,
          _OutlineWidthTexture: Is.not.exist(mtoonMaterial.outlineWidthMultiplyTexture) ? dummyWhiteTextureNumber : mtoonMaterial.outlineWidthMultiplyTexture.index,
          _ReceiveShadowTexture: dummyWhiteTextureNumber,
          _ShadeTexture: Is.not.exist(mtoonMaterial.shadeMultiplyTexture) ? dummyWhiteTextureNumber : mtoonMaterial.shadeMultiplyTexture.index,
          _RimTexture: Is.not.exist(mtoonMaterial.rimMultiplyTexture) ? dummyWhiteTextureNumber : mtoonMaterial.rimMultiplyTexture.index,
          _ShadingGradeTexture: dummyWhiteTextureNumber,
          _SphereAdd: dummyBlackTextureNumber
        }
      }

      if (Is.not.exist(material.extras)) {
        material.extras = {};
      }
      material.extras.vrm0xMaterialProperty = vrm0xMaterialProperty;

      if (mtoonMaterial.outlineWidthMode !== 'none') {
        isOutline = true;
      }
    }

    return isOutline;
  }

  static _getOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options != null) {
      for (const file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[fileName + '.glb'] = arraybuffer;
          delete options.files[file];
        }
      }

      //set default values
      options.__isImportVRM = true;
      if (options.defaultMaterialHelperArgumentArray == null) {
        options.defaultMaterialHelperArgumentArray = [{}];
      }

      if (!options.defaultMaterialHelperArgumentArray[0].isMorphing) {
        options.maxMorphTargetNumber = 0;
      }
    } else {
      options = {
        files: {},
        loaderExtension: undefined,
        defaultMaterialHelperName: undefined,
        defaultMaterialHelperArgumentArray: [
          {isLighting: true, isMorphing: true, isSkinning: true},
        ],
        statesOfElements: [
          {
            targets: [],
            states: {
              enable: [],
              functions: {},
            },
            isTransparent: true,
            opacity: 1.0,
            isTextureImageToLoadPreMultipliedAlpha: false,
          },
        ],
        __isImportVRM: true,
      };
    }

    return options;
  }
}
