/* eslint-disable prettier/prettier */
import { ModelConverter } from './ModelConverter';
import { Is } from '../misc/Is';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { GltfLoadOption, RnM2, Vrm0x, Vrm0xMaterialProperty } from '../../types';
import { RenderPass } from '../renderer/RenderPass';
import { Texture } from '../textures/Texture';
import { EntityRepository } from '../core/EntityRepository';
import { VRMSpringBonePhysicsStrategy } from '../physics/VRMSpring/VRMSpringBonePhysicsStrategy';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import { Vector3 } from '../math/Vector3';
import { VRMColliderGroup } from '../physics/VRMSpring/VRMColliderGroup';
import { VRMSpring } from '../physics/VRMSpring/VRMSpring';
import { Vrm1, Vrm1_Materials_MToon } from '../../types/VRM1';
import { assertIsOk, Err, Result, Ok } from '../misc/Result';
import { Gltf2Importer } from './Gltf2Importer';
import { Sampler } from '../textures/Sampler';
import { VrmComponent, VrmExpression, VrmExpressionMorphBind } from '../components';
import { VRMSpringBone } from '../physics/VRMSpring/VRMSpringBone';
import { CapsuleCollider } from '../physics/VRMSpring/CapsuleCollider';
import { ConstraintComponent } from '../components/Constraint';
import { VrmRollConstraint } from '../constraints/VrmRollConstraint';
import { VrmAimConstraint } from '../constraints/VrmAimConstraint';
import { VrmRotationConstraint } from '../constraints/VrmRotationConstraint';

export class VrmImporter {
  private constructor() {}

  static async __importVRM(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    const textures = this._createTextures(gltfModel);
    const samplers = this._createSamplers(gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures =
        defaultMaterialHelperArgumentArray[0].textures ?? textures;
      defaultMaterialHelperArgumentArray[0].samplers =
        defaultMaterialHelperArgumentArray[0].samplers ?? samplers;
      defaultMaterialHelperArgumentArray[0].isLighting =
        defaultMaterialHelperArgumentArray[0].isLighting ?? true;
    }
    const existOutline = this.__initializeMToonMaterialProperties(gltfModel, textures.length);

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
    this._readExpressions(gltfModel as Vrm1, rootGroup);
    this._readConstraints(gltfModel as Vrm1);
  }

  static _readConstraints(gltfModel: Vrm1) {
    for (let i = 0; i < gltfModel.nodes.length; i++) {
      const node = gltfModel.nodes[i];
      const constraint = node.extensions?.VRMC_node_constraint?.constraint;
      if (Is.exist(constraint)) {
        if (Is.exist(constraint.roll)) {
          const roll = constraint.roll;
          const dstEntity_ = gltfModel.extras.rnEntities[i];
          const srcEntity = gltfModel.extras.rnEntities[roll.source];
          const dstEntity = EntityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
          const rollConstraint = new VrmRollConstraint(
            srcEntity,
            roll.rollAxis,
            Is.exist(roll.weight) ? roll.weight : 1.0,
            dstEntity
          );
          dstEntity.getConstraint().setConstraint(rollConstraint);
        } else if (Is.exist(constraint.aim)) {
          const aim = constraint.aim;
          const dstEntity_ = gltfModel.extras.rnEntities[i];
          const srcEntity = gltfModel.extras.rnEntities[aim.source];
          const dstEntity = EntityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
          const aimConstraint = new VrmAimConstraint(
            srcEntity,
            aim.aimAxis,
            Is.exist(aim.weight) ? aim.weight : 1.0,
            dstEntity
          );
          dstEntity.getConstraint().setConstraint(aimConstraint);
        } else if (Is.exist(constraint.rotation)) {
          const rotation = constraint.rotation;
          const dstEntity_ = gltfModel.extras.rnEntities[i];
          const srcEntity = gltfModel.extras.rnEntities[rotation.source];
          const dstEntity = EntityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
          const rotationConstraint = new VrmRotationConstraint(
            srcEntity,
            Is.exist(rotation.weight) ? rotation.weight : 1.0,
            dstEntity
          );
          dstEntity.getConstraint().setConstraint(rotationConstraint);
        }
      }
    }
  }

  static _readExpressions(gltfModel: Vrm1, rootEntity: ISceneGraphEntity) {
    const vrmExpressions: VrmExpression[] = [];

    if (Is.not.exist(gltfModel.extensions.VRMC_vrm?.expressions?.preset)) {
      return;
    }

    const expressions = gltfModel.extensions.VRMC_vrm.expressions.preset;
    for (const expressionName in expressions) {
      const expression = expressions[expressionName];
      let binds: VrmExpressionMorphBind[] = [];
      if (Is.exist(expression.morphTargetBinds)) {
        binds = expression.morphTargetBinds.map((bind) => {
          const rnEntity = gltfModel.extras.rnEntities[bind.node];
          return {
            entityIdx: rnEntity.entityUID,
            blendShapeIdx: bind.index,
            weight: bind.weight,
          };
        });
      }

      const vrmExpression: VrmExpression = {
        name: expressionName,
        isBinary: expression.isBinary,
        binds: binds,
      };
      vrmExpressions.push(vrmExpression);
    }
    const vrmEntity = EntityRepository.addComponentToEntity(VrmComponent, rootEntity);
    vrmEntity.getVrm().setVrmExpressions(vrmExpressions);
    vrmEntity.getVrm()._version = '1.0';
  }

  static _readVRMHumanoidInfo(gltfModel: Vrm1, rootEntity?: ISceneGraphEntity): void {
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
    const colliderGroups: VRMColliderGroup[] = [];
    if (Is.exist(gltfModel.extensions.VRMC_springBone?.colliderGroups)) {
      for (const colliderGroupIdx in gltfModel.extensions.VRMC_springBone.colliderGroups) {
        const colliderGroup = gltfModel.extensions.VRMC_springBone.colliderGroups[colliderGroupIdx];

        const vrmColliderGroup = new VRMColliderGroup();
        colliderGroups.push(vrmColliderGroup);
        for (const colliderIdx of colliderGroup.colliders) {
          const collider = gltfModel.extensions.VRMC_springBone.colliders[colliderIdx];

          const baseSg = gltfModel.asset.extras!.rnEntities![collider.node].getSceneGraph();
          if (Is.exist(collider.shape.sphere)) {
            const sphereCollider = new SphereCollider();
            sphereCollider.baseSceneGraph = baseSg;
            sphereCollider.position = Vector3.fromCopyArray([
              collider.shape.sphere.offset[0],
              collider.shape.sphere.offset[1],
              collider.shape.sphere.offset[2],
            ]);
            sphereCollider.radius = collider.shape.sphere.radius;
            vrmColliderGroup.sphereColliders.push(sphereCollider);
          } else if (Is.exist(collider.shape.capsule)) {
            const capsuleCollider = new CapsuleCollider();
            capsuleCollider.baseSceneGraph = baseSg;
            capsuleCollider.position = Vector3.fromCopyArray([
              collider.shape.capsule.offset[0],
              collider.shape.capsule.offset[1],
              collider.shape.capsule.offset[2],
            ]);
            capsuleCollider.radius = collider.shape.capsule.radius;
            capsuleCollider.tail = Vector3.fromCopyArray([
              collider.shape.capsule.tail[0],
              collider.shape.capsule.tail[1],
              collider.shape.capsule.tail[2],
            ]);
            vrmColliderGroup.capsuleColliders.push(capsuleCollider);
          }
        }
      }
    }

    const springs: VRMSpring[] = [];
    if (Is.exist(gltfModel.extensions.VRMC_springBone?.springs)) {
      for (const spring of gltfModel.extensions.VRMC_springBone.springs) {
        const jointRoot = spring.joints[0];
        const jointRootEntity = gltfModel.asset.extras!.rnEntities![jointRoot.node];
        const vrmSpring = new VRMSpring(jointRootEntity.getSceneGraph());
        vrmSpring.tryToSetUniqueName(spring.name, true);
        const colliderGroupIndices = Is.exist(spring.colliderGroups) ? spring.colliderGroups : [];
        vrmSpring.colliderGroups = colliderGroupIndices.map((colliderGroupIdx) => {
          return colliderGroups[colliderGroupIdx];
        });

        const addedEntities: ISceneGraphEntity[] = [];
        for (const jointIdx in spring.joints) {
          const joint = spring.joints[jointIdx];
          const entity = gltfModel.asset.extras!.rnEntities![joint.node];
          const springBone = new VRMSpringBone(entity);
          springBone.dragForce = joint.dragForce;
          springBone.stiffnessForce = joint.stiffness;
          springBone.gravityPower = Is.exist(joint.gravityPower) ? joint.gravityPower : 1;
          springBone.gravityDir = Is.exist(joint.gravityDir)
            ? Vector3.fromCopyArray3([
                joint.gravityDir[0],
                joint.gravityDir[1],
                joint.gravityDir[2],
              ])
            : Vector3.fromCopyArray3([0, -1, 0]);
          springBone.hitRadius = joint.hitRadius;
          vrmSpring.bones.push(springBone);
          addedEntities.push(entity);
        }

        // Find and add the missing joints from spring.joints.
        this.__addSpringBoneRecursively(vrmSpring, jointRootEntity, addedEntities);
        springs.push(vrmSpring);
      }
    }

    for (const spring of springs) {
      this.__addPhysicsComponent(spring, spring.rootBone);
    }
  }

  private static __addSpringBoneRecursively(
    vrmSpring: VRMSpring,
    entity: ISceneGraphEntity,
    addedEntities: ISceneGraphEntity[]
  ): void {
    const sg = entity.getSceneGraph();
    const children = sg.children;

    if (!addedEntities.includes(entity)) {
      const springBone = new VRMSpringBone(entity);
      vrmSpring.bones.push(springBone);
      addedEntities.push(entity);
    }

    for (const child of children) {
      this.__addSpringBoneRecursively(vrmSpring, child.entity, addedEntities);
    }
  }

  private static __addPhysicsComponent(spring: VRMSpring, sg: SceneGraphComponent): void {
    const entity = sg.entity;
    const newEntity = EntityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new VRMSpringBonePhysicsStrategy();
    strategy.setSpring(spring);
    physicsComponent.setStrategy(strategy);
  }

  static _createTextures(gltfModel: RnM2): Texture[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createTexture(gltfTextures[i], gltfModel);
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

  static _createSamplers(gltfModel: RnM2): Sampler[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnSamplers: Sampler[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = ModelConverter._createSampler(gltfTextures[i]);
      rnSamplers[i] = rnTexture;
    }
    return rnSamplers;
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
          _BlendMode: Is.not.exist(material.alphaMode)
            ? 0
            : material.alphaMode === 'OPAQUE'
            ? 0
            : material.alphaMode === 'MASK'
            ? 1
            : material.alphaMode === 'BLEND'
            ? 2
            : 3,
          _CullMode: Is.not.exist(material.doubleSided) ? 2 : material.doubleSided ? 0 : 2,
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
          _OutlineWidthMode:
            mtoonMaterial.outlineWidthMode === 'worldCoordinates'
              ? 1
              : mtoonMaterial.outlineWidthMode === 'screenCoordinates'
              ? 2
              : 0,
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
          _Color: Is.not.exist(material.pbrMetallicRoughness?.baseColorFactor)
            ? [1, 1, 1, 1]
            : material.pbrMetallicRoughness!.baseColorFactor,
          _EmissionColor: Is.not.exist(material.emissiveFactor)
            ? [0, 0, 0]
            : material.emissiveFactor,
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
          _BumpMap: Is.not.exist(material.normalTexture)
            ? dummyWhiteTextureNumber
            : material.normalTexture.index,
          _EmissionMap: Is.not.exist(material.emissiveTexture)
            ? dummyBlackTextureNumber
            : material.emissiveTexture.index,
          _MainTex: Is.not.exist(material.pbrMetallicRoughness?.baseColorTexture)
            ? dummyWhiteTextureNumber
            : material.pbrMetallicRoughness!.baseColorTexture.index,
          _OutlineWidthTexture: Is.not.exist(mtoonMaterial.outlineWidthMultiplyTexture)
            ? dummyWhiteTextureNumber
            : mtoonMaterial.outlineWidthMultiplyTexture.index,
          _ReceiveShadowTexture: dummyWhiteTextureNumber,
          _ShadeTexture: Is.not.exist(mtoonMaterial.shadeMultiplyTexture)
            ? dummyWhiteTextureNumber
            : mtoonMaterial.shadeMultiplyTexture.index,
          _RimTexture: Is.not.exist(mtoonMaterial.rimMultiplyTexture)
            ? dummyBlackTextureNumber
            : mtoonMaterial.rimMultiplyTexture.index,
          _ShadingGradeTexture: dummyWhiteTextureNumber,
          _SphereAdd: dummyBlackTextureNumber,
        },
      };

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
        loaderExtension: undefined,
        defaultMaterialHelperName: undefined,
        defaultMaterialHelperArgumentArray: [
          { isLighting: true, isMorphing: true, isSkinning: true },
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
        __isImportVRM0x: true,
        __importedType: 'vrm1',
      };
    }

    return options;
  }

  /**
   * For VRM file only
   * Generate JSON.
   */
  static async importJsonOfVRM(
    uri: string,
    options?: GltfLoadOption
  ): Promise<Result<Vrm1, Err<RnM2, undefined>>> {
    options = this._getOptions(options);

    const result = await Gltf2Importer.importFromUri(uri, options);
    if (result.isErr()) {
      return new Err({
        message: 'Failed to import VRM file.',
        error: result,
      });
    }

    assertIsOk(result);
    const gltfJson = result.get();
    VrmImporter._readVRMHumanoidInfo(gltfJson as Vrm1);

    return new Ok(gltfJson as Vrm1);
  }

  static async __importVRM0x(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    const textures = this._createTextures(gltfModel);
    const samplers = this._createSamplers(gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures =
        defaultMaterialHelperArgumentArray[0].textures ?? textures;
      defaultMaterialHelperArgumentArray[0].samplers =
        defaultMaterialHelperArgumentArray[0].samplers ?? samplers;
      defaultMaterialHelperArgumentArray[0].isLighting =
        defaultMaterialHelperArgumentArray[0].isLighting ?? true;
    }
    const existOutline = this.__initializeMToonMaterialProperties(gltfModel, textures.length);

    // get rootGroup
    let rootGroup;
    if (existOutline) {
      renderPasses[1] = renderPasses[1] ?? new RenderPass();
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
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
}
