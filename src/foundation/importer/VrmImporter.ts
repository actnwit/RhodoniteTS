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
import { Vrm1 } from '../../types/VRM1';
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
import { TextureParameter } from '../definitions/TextureParameter';
import { Vrm1_Materials_MToon } from '../../types/VRMC_materials_mtoon';

export class VrmImporter {
  private constructor() {}

  static async __importVRM(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray =
      gltfModel.asset.extras?.rnLoaderOptions?.defaultMaterialHelperArgumentArray;
    const textures = await this._createTextures(gltfModel);
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

      rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = await ModelConverter.convertToRhodoniteObject(gltfModel);
    }

    const renderPassMain = renderPasses[0];
    renderPassMain.tryToSetUniqueName('VRM Main RenderPass', true);
    renderPassMain.addEntities([rootGroup]);

    this._readSpringBone(gltfModel as Vrm1);
    this._readVRMHumanoidInfo(gltfModel as Vrm1, rootGroup);
    this._readExpressions(gltfModel as Vrm1, rootGroup);
    this._readConstraints(gltfModel as Vrm1);

    if (gltfModel.asset.extras?.rnLoaderOptions != null) {
      // remove reference to defaultMaterialHelperArgumentArray
      gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray = [];
    }
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

        if (spring.center != null && spring.center !== -1) {
          vrmSpring.center = gltfModel.asset.extras!.rnEntities![spring.center].getSceneGraph();
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

  static async _createTextures(gltfModel: RnM2): Promise<Texture[]> {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnTextures: Texture[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnTexture = await ModelConverter._createTexture(gltfTextures[i].sourceObject!, gltfModel);
      rnTextures[i] = rnTexture;
    }

    const dummyWhiteTexture = new Texture();
    await dummyWhiteTexture.generate1x1TextureFrom();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    await dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  static _createSamplers(gltfModel: RnM2): Sampler[] {
    if (!gltfModel.textures) gltfModel.textures = [];

    const gltfTextures = gltfModel.textures;
    const rnSamplers: Sampler[] = [];
    for (let i = 0; i < gltfTextures.length; i++) {
      const rnSampler = ModelConverter._createSampler(gltfTextures[i].samplerObject!);
      rnSamplers[i] = rnSampler;
    }

    const dummySampler = new Sampler({
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
    });
    dummySampler.create();
    rnSamplers.push(dummySampler);
    rnSamplers.push(dummySampler);

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

      if (Is.not.exist(material.extras)) {
        material.extras = {};
      }

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
  ): Promise<Vrm1> {
    const promise = new Promise<Vrm1>(async (resolve, reject) => {
      options = this._getOptions(options);

      try {
        const result = await Gltf2Importer.importFromUri(uri, options);
        VrmImporter._readVRMHumanoidInfo(result as Vrm1);
        resolve(result as Vrm1);
      } catch (error) {
        reject(error);
      }
    });

    return promise;
  }
}
