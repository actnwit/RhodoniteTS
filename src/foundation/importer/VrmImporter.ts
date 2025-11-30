import { type GltfLoadOption, type RnM2, Vrm0x, Vrm0xMaterialProperty } from '../../types';
import type { Vrm1 } from '../../types/VRM1';
import type { Vrm1_Materials_MToon } from '../../types/VRMC_materials_mtoon';
import { VrmComponent, type VrmExpression, type VrmExpressionMorphBind } from '../components';
import { ConstraintComponent } from '../components/Constraint';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { VrmAimConstraint } from '../constraints/VrmAimConstraint';
import { VrmRollConstraint } from '../constraints/VrmRollConstraint';
import { VrmRotationConstraint } from '../constraints/VrmRotationConstraint';
import { EntityRepository } from '../core/EntityRepository';
import { TextureParameter } from '../definitions/TextureParameter';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Err, Ok, Result, assertIsOk } from '../misc/Result';
import { CapsuleCollider } from '../physics/VRMSpring/CapsuleCollider';
import { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import { VRMColliderGroup } from '../physics/VRMSpring/VRMColliderGroup';
import { VRMSpring } from '../physics/VRMSpring/VRMSpring';
import { VRMSpringBone } from '../physics/VRMSpring/VRMSpringBone';
import { VRMSpringBonePhysicsStrategy } from '../physics/VRMSpring/VRMSpringBonePhysicsStrategy';
import { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import { Sampler } from '../textures/Sampler';
import { Texture } from '../textures/Texture';
import { Gltf2Importer } from './Gltf2Importer';
/* eslint-disable prettier/prettier */
import { ModelConverter } from './ModelConverter';

/**
 * A utility class for importing and processing VRM (Virtual Reality Model) files.
 * This class handles the conversion of VRM data into Rhodonite's internal representation,
 * including materials, spring bones, expressions, constraints, and humanoid structures.
 */
export class VrmImporter {
  private constructor() {}

  /**
   * Imports a VRM model from a glTF structure and sets up all VRM-specific components.
   * This method processes materials, spring bones, expressions, constraints, and humanoid data.
   *
   * @param engine - The engine instance
   * @param gltfModel - The parsed glTF model containing VRM extensions
   * @param renderPasses - Array of render passes to add the imported model to
   * @returns Promise that resolves when the import process is complete
   */
  static async __importVRM(engine: Engine, gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void> {
    // process defaultMaterialHelperArgumentArray
    const defaultMaterialHelperArgumentArray = gltfModel.asset.extras?.rnLoaderOptions
      ?.defaultMaterialHelperArgumentArray ?? [{}];
    const textures = await this._createTextures(gltfModel);
    const samplers = this._createSamplers(gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = defaultMaterialHelperArgumentArray[0].textures ?? textures;
      defaultMaterialHelperArgumentArray[0].samplers = defaultMaterialHelperArgumentArray[0].samplers ?? samplers;
      defaultMaterialHelperArgumentArray[0].isLighting = defaultMaterialHelperArgumentArray[0].isLighting ?? true;
    }
    const existOutline = this.__initializeMToonMaterialProperties(gltfModel, textures.length);

    // get rootGroup
    let rootGroup: ISceneGraphEntity;
    if (existOutline) {
      renderPasses[1] = renderPasses[1] ?? new RenderPass();
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM = {};
      gltfModel.extensions.VRM.rnExtension = {
        renderPassOutline: renderPassOutline,
      };

      rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
      renderPassOutline.addEntities([rootGroup]);
    } else {
      rootGroup = await ModelConverter.convertToRhodoniteObject(engine, gltfModel);
    }

    const renderPassMain = renderPasses[0];
    renderPassMain.tryToSetUniqueName('VRM Main RenderPass', true);
    renderPassMain.addEntities([rootGroup]);

    this._readSpringBone(engine, gltfModel as Vrm1);
    this._readVRMHumanoidInfo(gltfModel as Vrm1, rootGroup);
    this._readExpressions(gltfModel as Vrm1, rootGroup);
    this._readConstraints(gltfModel as Vrm1);

    if (gltfModel.asset.extras?.rnLoaderOptions != null) {
      // remove reference to defaultMaterialHelperArgumentArray
      gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray = [];
    }
  }

  /**
   * Reads and processes VRM constraint data from the model.
   * Supports roll, aim, and rotation constraints as defined in the VRMC_node_constraint extension.
   *
   * @param gltfModel - The VRM model containing constraint data
   */
  static _readConstraints(gltfModel: Vrm1) {
    for (let i = 0; i < gltfModel.nodes.length; i++) {
      const node = gltfModel.nodes[i];
      const constraint = node.extensions?.VRMC_node_constraint?.constraint;
      if (Is.exist(constraint)) {
        if (Is.exist(constraint.roll)) {
          const roll = constraint.roll;
          const dstEntity_ = gltfModel.extras.rnEntities[i];
          const srcEntity = gltfModel.extras.rnEntities[roll.source];
          const dstEntity = dstEntity_.engine.entityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
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
          const dstEntity = dstEntity_.engine.entityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
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
          const dstEntity = dstEntity_.engine.entityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
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

  /**
   * Reads and processes VRM facial expressions (blend shapes) from the model.
   * Creates VrmExpression objects and attaches them to the root entity's VrmComponent.
   *
   * @param gltfModel - The VRM model containing expression data
   * @param rootEntity - The root entity to attach the VRM component to
   */
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
        binds = expression.morphTargetBinds.map(bind => {
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
    const vrmEntity = rootEntity.engine.entityRepository.addComponentToEntity(VrmComponent, rootEntity);
    vrmEntity.getVrm().setVrmExpressions(vrmExpressions);
    vrmEntity.getVrm()._version = '1.0';
  }

  /**
   * Reads and processes VRM humanoid bone mapping information.
   * Creates a mapping between bone names and node indices for humanoid structure.
   *
   * @param gltfModel - The VRM model containing humanoid data
   * @param rootEntity - Optional root entity to tag with humanoid information
   */
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

  /**
   * Reads and processes VRM spring bone physics data from the model.
   * Sets up collider groups, spring bones, and physics components for dynamic hair and cloth simulation.
   *
   * @param engine - The engine instance
   * @param gltfModel - The VRM model containing spring bone data
   */
  static _readSpringBone(engine: Engine, gltfModel: Vrm1): void {
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
            const sphereCollider = new SphereCollider(
              engine,
              Vector3.fromCopyArray([
                collider.shape.sphere.offset[0],
                collider.shape.sphere.offset[1],
                collider.shape.sphere.offset[2],
              ]),
              collider.shape.sphere.radius,
              baseSg
            );
            vrmColliderGroup.sphereColliders.push(sphereCollider);
          } else if (Is.exist(collider.shape.capsule)) {
            const capsuleCollider = new CapsuleCollider(
              engine,
              Vector3.fromCopyArray([
                collider.shape.capsule.offset[0],
                collider.shape.capsule.offset[1],
                collider.shape.capsule.offset[2],
              ]),
              collider.shape.capsule.radius,
              Vector3.fromCopyArray([
                collider.shape.capsule.tail[0],
                collider.shape.capsule.tail[1],
                collider.shape.capsule.tail[2],
              ]),
              baseSg
            );
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
        vrmSpring.colliderGroups = colliderGroupIndices.map(colliderGroupIdx => {
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
            ? Vector3.fromCopyArray3([joint.gravityDir[0], joint.gravityDir[1], joint.gravityDir[2]])
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

  /**
   * Recursively adds spring bone components to all child entities in the hierarchy.
   * This ensures that all bones in a spring bone chain are properly configured.
   *
   * @param vrmSpring - The VRM spring object to add bones to
   * @param entity - The current entity to process
   * @param addedEntities - Array of entities that have already been processed
   */
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

  /**
   * Adds a physics component with VRM spring bone strategy to an entity.
   * This enables physics simulation for the spring bone system.
   *
   * @param spring - The VRM spring configuration
   * @param sg - The scene graph component to add physics to
   */
  private static __addPhysicsComponent(spring: VRMSpring, sg: SceneGraphComponent): void {
    const entity = sg.entity;
    const newEntity = entity.engine.entityRepository.addComponentToEntity(PhysicsComponent, entity);
    const physicsComponent = newEntity.getPhysics();
    const strategy = new VRMSpringBonePhysicsStrategy();
    strategy.setSpring(spring);
    physicsComponent.setStrategy(strategy);
  }

  /**
   * Creates texture objects from the glTF model data.
   * Also generates dummy white and black textures for default material properties.
   *
   * @param gltfModel - The glTF model containing texture data
   * @returns Promise resolving to an array of created Texture objects
   */
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
    dummyWhiteTexture.markAsDummyTexture();
    rnTextures.push(dummyWhiteTexture);
    const dummyBlackTexture = new Texture();
    await dummyBlackTexture.generate1x1TextureFrom('rgba(0, 0, 0, 1)');
    dummyBlackTexture.markAsDummyTexture();
    rnTextures.push(dummyBlackTexture);

    return rnTextures;
  }

  /**
   * Creates sampler objects from the glTF model data.
   * Also generates dummy samplers for default texture sampling configuration.
   *
   * @param gltfModel - The glTF model containing sampler data
   * @returns Array of created Sampler objects
   */
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

  /**
   * Initializes MToon material properties and determines if outline rendering is needed.
   * MToon is the standard toon shader used in VRM models.
   *
   * @param gltfModel - The glTF model containing material data
   * @param texturesLength - The number of textures in the model
   * @returns True if any material requires outline rendering, false otherwise
   */
  private static __initializeMToonMaterialProperties(gltfModel: RnM2, _texturesLength: number): boolean {
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

  /**
   * Processes and validates import options for VRM files.
   * Converts .vrm file extensions to .glb and sets up default material helper arguments.
   *
   * @param options - Optional import configuration
   * @returns Processed and validated import options
   */
  static _getOptions(options?: GltfLoadOption): GltfLoadOption {
    if (options != null) {
      for (const file in options.files) {
        const fileName = file.split('.vrm')[0];
        if (fileName) {
          const arraybuffer = options.files[file];
          options.files[`${fileName}.glb`] = arraybuffer;
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
        defaultMaterialHelperArgumentArray: [{ isLighting: true, isMorphing: true, isSkinning: true }],
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
   * Imports only the JSON data structure of a VRM file without processing the full model.
   * This is useful for extracting metadata and structure information without full rendering setup.
   *
   * @param uri - The URI or path to the VRM file
   * @param options - Optional import configuration
   * @returns Promise resolving to the VRM JSON structure
   */
  static async importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm1> {
    options = this._getOptions(options);
    const result = await Gltf2Importer.importFromUrl(uri, options);
    VrmImporter._readVRMHumanoidInfo(result as Vrm1);
    return result as Vrm1;
  }
}
