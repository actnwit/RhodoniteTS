// src/foundation/importer/VrmImporter.ts
import { VrmComponent } from "../components/index.js";
import { ConstraintComponent } from "../components/Constraint/index.js";
import { PhysicsComponent } from "../components/Physics/PhysicsComponent.js";
import { VrmAimConstraint } from "../constraints/VrmAimConstraint.js";
import { VrmRollConstraint } from "../constraints/VrmRollConstraint.js";
import { VrmRotationConstraint } from "../constraints/VrmRotationConstraint.js";
import { TextureParameter } from "../definitions/TextureParameter.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
import { CapsuleCollider } from "../physics/VRMSpring/CapsuleCollider.js";
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
var VrmImporter = class _VrmImporter {
  constructor() {
  }
  /**
   * Imports a VRM model from a glTF structure and sets up all VRM-specific components.
   * This method processes materials, spring bones, expressions, constraints, and humanoid data.
   *
   * @param engine - The engine instance
   * @param gltfModel - The parsed glTF model containing VRM extensions
   * @param renderPasses - Array of render passes to add the imported model to
   * @returns Promise that resolves when the import process is complete
   */
  static async Rp(engine, gltfModel, renderPasses) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const defaultMaterialHelperArgumentArray = (_c = (_b = (_a = gltfModel.asset.extras) == null ? void 0 : _a.rnLoaderOptions) == null ? void 0 : _b.defaultMaterialHelperArgumentArray) != null ? _c : [{}];
    const textures = await this._createTextures(engine, gltfModel);
    const samplers = this._createSamplers(engine, gltfModel);
    if (Is.exist(defaultMaterialHelperArgumentArray)) {
      defaultMaterialHelperArgumentArray[0].textures = (_d = defaultMaterialHelperArgumentArray[0].textures) != null ? _d : textures;
      defaultMaterialHelperArgumentArray[0].samplers = (_e = defaultMaterialHelperArgumentArray[0].samplers) != null ? _e : samplers;
      defaultMaterialHelperArgumentArray[0].isLighting = (_f = defaultMaterialHelperArgumentArray[0].isLighting) != null ? _f : true;
    }
    const existOutline = this.Tq(gltfModel, textures.length);
    let rootGroup;
    if (existOutline) {
      renderPasses[1] = (_g = renderPasses[1]) != null ? _g : new RenderPass(engine);
      const renderPassOutline = renderPasses[1];
      renderPassOutline.toClearColorBuffer = false;
      renderPassOutline.toClearDepthBuffer = false;
      gltfModel.extensions.VRM = {};
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
    this._readExpressions(gltfModel, rootGroup);
    this._readConstraints(gltfModel);
    if (((_h = gltfModel.asset.extras) == null ? void 0 : _h.rnLoaderOptions) != null) {
      gltfModel.asset.extras.rnLoaderOptions.defaultMaterialHelperArgumentArray = [];
    }
  }
  /**
   * Reads and processes VRM constraint data from the model.
   * Supports roll, aim, and rotation constraints as defined in the VRMC_node_constraint extension.
   *
   * @param gltfModel - The VRM model containing constraint data
   */
  static _readConstraints(gltfModel) {
    var _a, _b;
    for (let i = 0; i < gltfModel.nodes.length; i++) {
      const node = gltfModel.nodes[i];
      const constraint = (_b = (_a = node.extensions) == null ? void 0 : _a.VRMC_node_constraint) == null ? void 0 : _b.constraint;
      if (Is.exist(constraint)) {
        if (Is.exist(constraint.roll)) {
          const roll = constraint.roll;
          const dstEntity_ = gltfModel.extras.rnEntities[i];
          const srcEntity = gltfModel.extras.rnEntities[roll.source];
          const dstEntity = dstEntity_.engine.entityRepository.addComponentToEntity(ConstraintComponent, dstEntity_);
          const rollConstraint = new VrmRollConstraint(
            srcEntity,
            roll.rollAxis,
            Is.exist(roll.weight) ? roll.weight : 1,
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
            Is.exist(aim.weight) ? aim.weight : 1,
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
            Is.exist(rotation.weight) ? rotation.weight : 1,
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
  static _readExpressions(gltfModel, rootEntity) {
    var _a, _b, _c, _d, _e;
    const vrmExpressions = [];
    const expressionGroups = [
      (_b = (_a = gltfModel.extensions.VRMC_vrm) == null ? void 0 : _a.expressions) == null ? void 0 : _b.preset,
      (_d = (_c = gltfModel.extensions.VRMC_vrm) == null ? void 0 : _c.expressions) == null ? void 0 : _d.custom
    ];
    if (expressionGroups.every(Is.not.exist)) {
      return;
    }
    for (const expressions of expressionGroups) {
      if (Is.not.exist(expressions)) {
        continue;
      }
      for (const expressionName in expressions) {
        const expression = expressions[expressionName];
        let binds = [];
        if (Is.exist(expression.morphTargetBinds)) {
          binds = expression.morphTargetBinds.map((bind) => {
            const rnEntity = gltfModel.extras.rnEntities[bind.node];
            return {
              entityIdx: rnEntity.entityUID,
              blendShapeIdx: bind.index,
              weight: bind.weight
            };
          });
        }
        const vrmExpression = {
          name: expressionName,
          isBinary: (_e = expression.isBinary) != null ? _e : false,
          binds
        };
        vrmExpressions.push(vrmExpression);
      }
    }
    const vrmEntity = rootEntity.engine.entityRepository.addComponentToEntity(VrmComponent, rootEntity);
    vrmEntity.getVrm().setVrmExpressions(vrmExpressions);
    vrmEntity.getVrm()._version = "1.0";
  }
  /**
   * Reads and processes VRM humanoid bone mapping information.
   * Creates a mapping between bone names and node indices for humanoid structure.
   *
   * @param gltfModel - The VRM model containing humanoid data
   * @param rootEntity - Optional root entity to tag with humanoid information
   */
  static _readVRMHumanoidInfo(gltfModel, rootEntity) {
    const humanBones = gltfModel.extensions.VRMC_vrm.humanoid.humanBones;
    const mapNameNodeId = /* @__PURE__ */ new Map();
    for (const boneName in humanBones) {
      const bone = humanBones[boneName];
      mapNameNodeId.set(boneName, bone.node);
    }
    if (rootEntity != null) {
      rootEntity.tryToSetTag({
        tag: "humanoid_map_name_nodeId",
        value: mapNameNodeId
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
  static _readSpringBone(engine, gltfModel) {
    var _a, _b;
    const colliderGroups = [];
    if (Is.exist((_a = gltfModel.extensions.VRMC_springBone) == null ? void 0 : _a.colliderGroups)) {
      for (const colliderGroupIdx in gltfModel.extensions.VRMC_springBone.colliderGroups) {
        const colliderGroup = gltfModel.extensions.VRMC_springBone.colliderGroups[colliderGroupIdx];
        const vrmColliderGroup = new VRMColliderGroup();
        colliderGroups.push(vrmColliderGroup);
        for (const colliderIdx of colliderGroup.colliders) {
          const collider = gltfModel.extensions.VRMC_springBone.colliders[colliderIdx];
          const baseSg = gltfModel.asset.extras.rnEntities[collider.node].getSceneGraph();
          if (Is.exist(collider.shape.sphere)) {
            const sphereCollider = new SphereCollider(
              engine,
              Vector3.fromCopyArray([
                collider.shape.sphere.offset[0],
                collider.shape.sphere.offset[1],
                collider.shape.sphere.offset[2]
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
                collider.shape.capsule.offset[2]
              ]),
              collider.shape.capsule.radius,
              Vector3.fromCopyArray([
                collider.shape.capsule.tail[0],
                collider.shape.capsule.tail[1],
                collider.shape.capsule.tail[2]
              ]),
              baseSg
            );
            vrmColliderGroup.capsuleColliders.push(capsuleCollider);
          }
        }
      }
    }
    const springs = [];
    if (Is.exist((_b = gltfModel.extensions.VRMC_springBone) == null ? void 0 : _b.springs)) {
      for (const spring of gltfModel.extensions.VRMC_springBone.springs) {
        const jointRoot = spring.joints[0];
        const jointRootEntity = gltfModel.asset.extras.rnEntities[jointRoot.node];
        const vrmSpring = new VRMSpring(jointRootEntity.getSceneGraph());
        vrmSpring.tryToSetUniqueName(spring.name, true);
        const colliderGroupIndices = Is.exist(spring.colliderGroups) ? spring.colliderGroups : [];
        vrmSpring.colliderGroups = colliderGroupIndices.map((colliderGroupIdx) => {
          return colliderGroups[colliderGroupIdx];
        });
        const addedEntities = [];
        for (const jointIdx in spring.joints) {
          const joint = spring.joints[jointIdx];
          const entity = gltfModel.asset.extras.rnEntities[joint.node];
          const springBone = new VRMSpringBone(entity);
          springBone.dragForce = Is.exist(joint.dragForce) ? joint.dragForce : 0.4;
          springBone.stiffnessForce = Is.exist(joint.stiffness) ? joint.stiffness : 1;
          springBone.gravityPower = Is.exist(joint.gravityPower) ? joint.gravityPower : 1;
          springBone.gravityDir = Is.exist(joint.gravityDir) ? Vector3.fromCopyArray3([joint.gravityDir[0], joint.gravityDir[1], joint.gravityDir[2]]) : Vector3.fromCopyArray3([0, -1, 0]);
          springBone.hitRadius = Is.exist(joint.hitRadius) ? joint.hitRadius : 0.02;
          vrmSpring.bones.push(springBone);
          addedEntities.push(entity);
        }
        if (spring.center != null && spring.center !== -1) {
          vrmSpring.center = gltfModel.asset.extras.rnEntities[spring.center].getSceneGraph();
        }
        this.Rq(vrmSpring, jointRootEntity, addedEntities);
        springs.push(vrmSpring);
      }
    }
    for (const spring of springs) {
      this.Sq(spring, spring.rootBone);
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
  static Rq(vrmSpring, entity, addedEntities) {
    const sg = entity.getSceneGraph();
    const children = sg.children;
    if (!addedEntities.includes(entity)) {
      const springBone = new VRMSpringBone(entity);
      vrmSpring.bones.push(springBone);
      addedEntities.push(entity);
    }
    for (const child of children) {
      this.Rq(vrmSpring, child.entity, addedEntities);
    }
  }
  /**
   * Adds a physics component with VRM spring bone strategy to an entity.
   * This enables physics simulation for the spring bone system.
   *
   * @param spring - The VRM spring configuration
   * @param sg - The scene graph component to add physics to
   */
  static Sq(spring, sg) {
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
   * Creates sampler objects from the glTF model data.
   * Also generates dummy samplers for default texture sampling configuration.
   *
   * @param gltfModel - The glTF model containing sampler data
   * @returns Array of created Sampler objects
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
   * Initializes MToon material properties and determines if outline rendering is needed.
   * MToon is the standard toon shader used in VRM models.
   *
   * @param gltfModel - The glTF model containing material data
   * @param texturesLength - The number of textures in the model
   * @returns True if any material requires outline rendering, false otherwise
   */
  static Tq(gltfModel, _texturesLength) {
    var _a;
    let isOutline = false;
    for (const material of gltfModel.materials) {
      const mtoonMaterial = (_a = material.extensions) == null ? void 0 : _a.VRMC_materials_mtoon;
      if (mtoonMaterial == null) {
        continue;
      }
      if (Is.not.exist(material.extras)) {
        material.extras = {};
      }
      const outlineWidthMode = mtoonMaterial.outlineWidthMode;
      if (outlineWidthMode === "worldCoordinates" || outlineWidthMode === "screenCoordinates") {
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
      options.Ip = true;
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
        Ip: true,
        __importedType: "vrm1"
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
  static async importJsonOfVRM(uri, options) {
    options = this._getOptions(options);
    const result = await Gltf2Importer.importFromUrl(uri, options);
    _VrmImporter._readVRMHumanoidInfo(result);
    return result;
  }
};
export {
  VrmImporter
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvVnJtSW1wb3J0ZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgR2x0ZkxvYWRPcHRpb24sIFJuTTIgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IFZybTEgfSBmcm9tICcuLi8uLi90eXBlcy9WUk0xJztcbmltcG9ydCB0eXBlIHsgVnJtMV9NYXRlcmlhbHNfTVRvb24gfSBmcm9tICcuLi8uLi90eXBlcy9WUk1DX21hdGVyaWFsc19tdG9vbic7XG5pbXBvcnQgeyBWcm1Db21wb25lbnQsIHR5cGUgVnJtRXhwcmVzc2lvbiwgdHlwZSBWcm1FeHByZXNzaW9uTW9ycGhCaW5kIH0gZnJvbSAnLi4vY29tcG9uZW50cyc7XG5pbXBvcnQgeyBDb25zdHJhaW50Q29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Db25zdHJhaW50JztcbmltcG9ydCB7IFBoeXNpY3NDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1BoeXNpY3MvUGh5c2ljc0NvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1NjZW5lR3JhcGgvU2NlbmVHcmFwaENvbXBvbmVudCc7XG5pbXBvcnQgeyBWcm1BaW1Db25zdHJhaW50IH0gZnJvbSAnLi4vY29uc3RyYWludHMvVnJtQWltQ29uc3RyYWludCc7XG5pbXBvcnQgeyBWcm1Sb2xsQ29uc3RyYWludCB9IGZyb20gJy4uL2NvbnN0cmFpbnRzL1ZybVJvbGxDb25zdHJhaW50JztcbmltcG9ydCB7IFZybVJvdGF0aW9uQ29uc3RyYWludCB9IGZyb20gJy4uL2NvbnN0cmFpbnRzL1ZybVJvdGF0aW9uQ29uc3RyYWludCc7XG5pbXBvcnQgeyBUZXh0dXJlUGFyYW1ldGVyIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVGV4dHVyZVBhcmFtZXRlcic7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgQ2Fwc3VsZUNvbGxpZGVyIH0gZnJvbSAnLi4vcGh5c2ljcy9WUk1TcHJpbmcvQ2Fwc3VsZUNvbGxpZGVyJztcbmltcG9ydCB7IFNwaGVyZUNvbGxpZGVyIH0gZnJvbSAnLi4vcGh5c2ljcy9WUk1TcHJpbmcvU3BoZXJlQ29sbGlkZXInO1xuaW1wb3J0IHsgVlJNQ29sbGlkZXJHcm91cCB9IGZyb20gJy4uL3BoeXNpY3MvVlJNU3ByaW5nL1ZSTUNvbGxpZGVyR3JvdXAnO1xuaW1wb3J0IHsgVlJNU3ByaW5nIH0gZnJvbSAnLi4vcGh5c2ljcy9WUk1TcHJpbmcvVlJNU3ByaW5nJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmUgfSBmcm9tICcuLi9waHlzaWNzL1ZSTVNwcmluZy9WUk1TcHJpbmdCb25lJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVQaHlzaWNzU3RyYXRlZ3kgfSBmcm9tICcuLi9waHlzaWNzL1ZSTVNwcmluZy9WUk1TcHJpbmdCb25lUGh5c2ljc1N0cmF0ZWd5JztcbmltcG9ydCB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBTYW1wbGVyIH0gZnJvbSAnLi4vdGV4dHVyZXMvU2FtcGxlcic7XG5pbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSAnLi4vdGV4dHVyZXMvVGV4dHVyZSc7XG5pbXBvcnQgeyBHbHRmMkltcG9ydGVyIH0gZnJvbSAnLi9HbHRmMkltcG9ydGVyJztcbi8qIGVzbGludC1kaXNhYmxlIHByZXR0aWVyL3ByZXR0aWVyICovXG5pbXBvcnQgeyBNb2RlbENvbnZlcnRlciB9IGZyb20gJy4vTW9kZWxDb252ZXJ0ZXInO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBjbGFzcyBmb3IgaW1wb3J0aW5nIGFuZCBwcm9jZXNzaW5nIFZSTSAoVmlydHVhbCBSZWFsaXR5IE1vZGVsKSBmaWxlcy5cbiAqIFRoaXMgY2xhc3MgaGFuZGxlcyB0aGUgY29udmVyc2lvbiBvZiBWUk0gZGF0YSBpbnRvIFJob2Rvbml0ZSdzIGludGVybmFsIHJlcHJlc2VudGF0aW9uLFxuICogaW5jbHVkaW5nIG1hdGVyaWFscywgc3ByaW5nIGJvbmVzLCBleHByZXNzaW9ucywgY29uc3RyYWludHMsIGFuZCBodW1hbm9pZCBzdHJ1Y3R1cmVzLlxuICovXG5leHBvcnQgY2xhc3MgVnJtSW1wb3J0ZXIge1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogSW1wb3J0cyBhIFZSTSBtb2RlbCBmcm9tIGEgZ2xURiBzdHJ1Y3R1cmUgYW5kIHNldHMgdXAgYWxsIFZSTS1zcGVjaWZpYyBjb21wb25lbnRzLlxuICAgKiBUaGlzIG1ldGhvZCBwcm9jZXNzZXMgbWF0ZXJpYWxzLCBzcHJpbmcgYm9uZXMsIGV4cHJlc3Npb25zLCBjb25zdHJhaW50cywgYW5kIGh1bWFub2lkIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgcGFyc2VkIGdsVEYgbW9kZWwgY29udGFpbmluZyBWUk0gZXh0ZW5zaW9uc1xuICAgKiBAcGFyYW0gcmVuZGVyUGFzc2VzIC0gQXJyYXkgb2YgcmVuZGVyIHBhc3NlcyB0byBhZGQgdGhlIGltcG9ydGVkIG1vZGVsIHRvXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBpbXBvcnQgcHJvY2VzcyBpcyBjb21wbGV0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIF9faW1wb3J0VlJNKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIsIHJlbmRlclBhc3NlczogUmVuZGVyUGFzc1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gcHJvY2VzcyBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5XG4gICAgY29uc3QgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheSA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXM/LnJuTG9hZGVyT3B0aW9uc1xuICAgICAgPy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID8/IFt7fV07XG4gICAgY29uc3QgdGV4dHVyZXMgPSBhd2FpdCB0aGlzLl9jcmVhdGVUZXh0dXJlcyhlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgY29uc3Qgc2FtcGxlcnMgPSB0aGlzLl9jcmVhdGVTYW1wbGVycyhlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgaWYgKElzLmV4aXN0KGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXkpKSB7XG4gICAgICBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5WzBdLnRleHR1cmVzID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS50ZXh0dXJlcyA/PyB0ZXh0dXJlcztcbiAgICAgIGRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXlbMF0uc2FtcGxlcnMgPSBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5WzBdLnNhbXBsZXJzID8/IHNhbXBsZXJzO1xuICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS5pc0xpZ2h0aW5nID0gZGVmYXVsdE1hdGVyaWFsSGVscGVyQXJndW1lbnRBcnJheVswXS5pc0xpZ2h0aW5nID8/IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGV4aXN0T3V0bGluZSA9IHRoaXMuX19pbml0aWFsaXplTVRvb25NYXRlcmlhbFByb3BlcnRpZXMoZ2x0Zk1vZGVsLCB0ZXh0dXJlcy5sZW5ndGgpO1xuXG4gICAgLy8gZ2V0IHJvb3RHcm91cFxuICAgIGxldCByb290R3JvdXA6IElTY2VuZUdyYXBoRW50aXR5O1xuICAgIGlmIChleGlzdE91dGxpbmUpIHtcbiAgICAgIHJlbmRlclBhc3Nlc1sxXSA9IHJlbmRlclBhc3Nlc1sxXSA/PyBuZXcgUmVuZGVyUGFzcyhlbmdpbmUpO1xuICAgICAgY29uc3QgcmVuZGVyUGFzc091dGxpbmUgPSByZW5kZXJQYXNzZXNbMV07XG4gICAgICByZW5kZXJQYXNzT3V0bGluZS50b0NsZWFyQ29sb3JCdWZmZXIgPSBmYWxzZTtcbiAgICAgIHJlbmRlclBhc3NPdXRsaW5lLnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IGZhbHNlO1xuICAgICAgZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNID0ge307XG4gICAgICBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk0ucm5FeHRlbnNpb24gPSB7XG4gICAgICAgIHJlbmRlclBhc3NPdXRsaW5lOiByZW5kZXJQYXNzT3V0bGluZSxcbiAgICAgIH07XG5cbiAgICAgIHJvb3RHcm91cCA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgICByZW5kZXJQYXNzT3V0bGluZS5hZGRFbnRpdGllcyhbcm9vdEdyb3VwXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3RHcm91cCA9IGF3YWl0IE1vZGVsQ29udmVydGVyLmNvbnZlcnRUb1Job2Rvbml0ZU9iamVjdChlbmdpbmUsIGdsdGZNb2RlbCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVuZGVyUGFzc01haW4gPSByZW5kZXJQYXNzZXNbMF07XG4gICAgcmVuZGVyUGFzc01haW4udHJ5VG9TZXRVbmlxdWVOYW1lKCdWUk0gTWFpbiBSZW5kZXJQYXNzJywgdHJ1ZSk7XG4gICAgcmVuZGVyUGFzc01haW4uYWRkRW50aXRpZXMoW3Jvb3RHcm91cF0pO1xuXG4gICAgdGhpcy5fcmVhZFNwcmluZ0JvbmUoZW5naW5lLCBnbHRmTW9kZWwgYXMgVnJtMSk7XG4gICAgdGhpcy5fcmVhZFZSTUh1bWFub2lkSW5mbyhnbHRmTW9kZWwgYXMgVnJtMSwgcm9vdEdyb3VwKTtcbiAgICB0aGlzLl9yZWFkRXhwcmVzc2lvbnMoZ2x0Zk1vZGVsIGFzIFZybTEsIHJvb3RHcm91cCk7XG4gICAgdGhpcy5fcmVhZENvbnN0cmFpbnRzKGdsdGZNb2RlbCBhcyBWcm0xKTtcblxuICAgIGlmIChnbHRmTW9kZWwuYXNzZXQuZXh0cmFzPy5ybkxvYWRlck9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgLy8gcmVtb3ZlIHJlZmVyZW5jZSB0byBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5XG4gICAgICBnbHRmTW9kZWwuYXNzZXQuZXh0cmFzLnJuTG9hZGVyT3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIGFuZCBwcm9jZXNzZXMgVlJNIGNvbnN0cmFpbnQgZGF0YSBmcm9tIHRoZSBtb2RlbC5cbiAgICogU3VwcG9ydHMgcm9sbCwgYWltLCBhbmQgcm90YXRpb24gY29uc3RyYWludHMgYXMgZGVmaW5lZCBpbiB0aGUgVlJNQ19ub2RlX2NvbnN0cmFpbnQgZXh0ZW5zaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIFZSTSBtb2RlbCBjb250YWluaW5nIGNvbnN0cmFpbnQgZGF0YVxuICAgKi9cbiAgc3RhdGljIF9yZWFkQ29uc3RyYWludHMoZ2x0Zk1vZGVsOiBWcm0xKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnbHRmTW9kZWwubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBnbHRmTW9kZWwubm9kZXNbaV07XG4gICAgICBjb25zdCBjb25zdHJhaW50ID0gbm9kZS5leHRlbnNpb25zPy5WUk1DX25vZGVfY29uc3RyYWludD8uY29uc3RyYWludDtcbiAgICAgIGlmIChJcy5leGlzdChjb25zdHJhaW50KSkge1xuICAgICAgICBpZiAoSXMuZXhpc3QoY29uc3RyYWludC5yb2xsKSkge1xuICAgICAgICAgIGNvbnN0IHJvbGwgPSBjb25zdHJhaW50LnJvbGw7XG4gICAgICAgICAgY29uc3QgZHN0RW50aXR5XyA9IGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc1tpXTtcbiAgICAgICAgICBjb25zdCBzcmNFbnRpdHkgPSBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXNbcm9sbC5zb3VyY2VdO1xuICAgICAgICAgIGNvbnN0IGRzdEVudGl0eSA9IGRzdEVudGl0eV8uZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQ29uc3RyYWludENvbXBvbmVudCwgZHN0RW50aXR5Xyk7XG4gICAgICAgICAgY29uc3Qgcm9sbENvbnN0cmFpbnQgPSBuZXcgVnJtUm9sbENvbnN0cmFpbnQoXG4gICAgICAgICAgICBzcmNFbnRpdHksXG4gICAgICAgICAgICByb2xsLnJvbGxBeGlzLFxuICAgICAgICAgICAgSXMuZXhpc3Qocm9sbC53ZWlnaHQpID8gcm9sbC53ZWlnaHQgOiAxLjAsXG4gICAgICAgICAgICBkc3RFbnRpdHlcbiAgICAgICAgICApO1xuICAgICAgICAgIGRzdEVudGl0eS5nZXRDb25zdHJhaW50KCkuc2V0Q29uc3RyYWludChyb2xsQ29uc3RyYWludCk7XG4gICAgICAgIH0gZWxzZSBpZiAoSXMuZXhpc3QoY29uc3RyYWludC5haW0pKSB7XG4gICAgICAgICAgY29uc3QgYWltID0gY29uc3RyYWludC5haW07XG4gICAgICAgICAgY29uc3QgZHN0RW50aXR5XyA9IGdsdGZNb2RlbC5leHRyYXMucm5FbnRpdGllc1tpXTtcbiAgICAgICAgICBjb25zdCBzcmNFbnRpdHkgPSBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXNbYWltLnNvdXJjZV07XG4gICAgICAgICAgY29uc3QgZHN0RW50aXR5ID0gZHN0RW50aXR5Xy5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShDb25zdHJhaW50Q29tcG9uZW50LCBkc3RFbnRpdHlfKTtcbiAgICAgICAgICBjb25zdCBhaW1Db25zdHJhaW50ID0gbmV3IFZybUFpbUNvbnN0cmFpbnQoXG4gICAgICAgICAgICBzcmNFbnRpdHksXG4gICAgICAgICAgICBhaW0uYWltQXhpcyxcbiAgICAgICAgICAgIElzLmV4aXN0KGFpbS53ZWlnaHQpID8gYWltLndlaWdodCA6IDEuMCxcbiAgICAgICAgICAgIGRzdEVudGl0eVxuICAgICAgICAgICk7XG4gICAgICAgICAgZHN0RW50aXR5LmdldENvbnN0cmFpbnQoKS5zZXRDb25zdHJhaW50KGFpbUNvbnN0cmFpbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKElzLmV4aXN0KGNvbnN0cmFpbnQucm90YXRpb24pKSB7XG4gICAgICAgICAgY29uc3Qgcm90YXRpb24gPSBjb25zdHJhaW50LnJvdGF0aW9uO1xuICAgICAgICAgIGNvbnN0IGRzdEVudGl0eV8gPSBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXNbaV07XG4gICAgICAgICAgY29uc3Qgc3JjRW50aXR5ID0gZ2x0Zk1vZGVsLmV4dHJhcy5ybkVudGl0aWVzW3JvdGF0aW9uLnNvdXJjZV07XG4gICAgICAgICAgY29uc3QgZHN0RW50aXR5ID0gZHN0RW50aXR5Xy5lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShDb25zdHJhaW50Q29tcG9uZW50LCBkc3RFbnRpdHlfKTtcbiAgICAgICAgICBjb25zdCByb3RhdGlvbkNvbnN0cmFpbnQgPSBuZXcgVnJtUm90YXRpb25Db25zdHJhaW50KFxuICAgICAgICAgICAgc3JjRW50aXR5LFxuICAgICAgICAgICAgSXMuZXhpc3Qocm90YXRpb24ud2VpZ2h0KSA/IHJvdGF0aW9uLndlaWdodCA6IDEuMCxcbiAgICAgICAgICAgIGRzdEVudGl0eVxuICAgICAgICAgICk7XG4gICAgICAgICAgZHN0RW50aXR5LmdldENvbnN0cmFpbnQoKS5zZXRDb25zdHJhaW50KHJvdGF0aW9uQ29uc3RyYWludCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVhZHMgYW5kIHByb2Nlc3NlcyBWUk0gZmFjaWFsIGV4cHJlc3Npb25zIChibGVuZCBzaGFwZXMpIGZyb20gdGhlIG1vZGVsLlxuICAgKiBDcmVhdGVzIFZybUV4cHJlc3Npb24gb2JqZWN0cyBhbmQgYXR0YWNoZXMgdGhlbSB0byB0aGUgcm9vdCBlbnRpdHkncyBWcm1Db21wb25lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGNvbnRhaW5pbmcgZXhwcmVzc2lvbiBkYXRhXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IHRvIGF0dGFjaCB0aGUgVlJNIGNvbXBvbmVudCB0b1xuICAgKi9cbiAgc3RhdGljIF9yZWFkRXhwcmVzc2lvbnMoZ2x0Zk1vZGVsOiBWcm0xLCByb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkge1xuICAgIGNvbnN0IHZybUV4cHJlc3Npb25zOiBWcm1FeHByZXNzaW9uW10gPSBbXTtcblxuICAgIGNvbnN0IGV4cHJlc3Npb25Hcm91cHMgPSBbXG4gICAgICBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk1DX3ZybT8uZXhwcmVzc2lvbnM/LnByZXNldCxcbiAgICAgIGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTUNfdnJtPy5leHByZXNzaW9ucz8uY3VzdG9tLFxuICAgIF07XG4gICAgaWYgKGV4cHJlc3Npb25Hcm91cHMuZXZlcnkoSXMubm90LmV4aXN0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbnMgb2YgZXhwcmVzc2lvbkdyb3Vwcykge1xuICAgICAgaWYgKElzLm5vdC5leGlzdChleHByZXNzaW9ucykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGV4cHJlc3Npb25OYW1lIGluIGV4cHJlc3Npb25zKSB7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBleHByZXNzaW9uc1tleHByZXNzaW9uTmFtZV07XG4gICAgICAgIGxldCBiaW5kczogVnJtRXhwcmVzc2lvbk1vcnBoQmluZFtdID0gW107XG4gICAgICAgIGlmIChJcy5leGlzdChleHByZXNzaW9uLm1vcnBoVGFyZ2V0QmluZHMpKSB7XG4gICAgICAgICAgYmluZHMgPSBleHByZXNzaW9uLm1vcnBoVGFyZ2V0QmluZHMubWFwKGJpbmQgPT4ge1xuICAgICAgICAgICAgY29uc3Qgcm5FbnRpdHkgPSBnbHRmTW9kZWwuZXh0cmFzLnJuRW50aXRpZXNbYmluZC5ub2RlXTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGVudGl0eUlkeDogcm5FbnRpdHkuZW50aXR5VUlELFxuICAgICAgICAgICAgICBibGVuZFNoYXBlSWR4OiBiaW5kLmluZGV4LFxuICAgICAgICAgICAgICB3ZWlnaHQ6IGJpbmQud2VpZ2h0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZybUV4cHJlc3Npb246IFZybUV4cHJlc3Npb24gPSB7XG4gICAgICAgICAgbmFtZTogZXhwcmVzc2lvbk5hbWUsXG4gICAgICAgICAgaXNCaW5hcnk6IGV4cHJlc3Npb24uaXNCaW5hcnkgPz8gZmFsc2UsXG4gICAgICAgICAgYmluZHM6IGJpbmRzLFxuICAgICAgICB9O1xuICAgICAgICB2cm1FeHByZXNzaW9ucy5wdXNoKHZybUV4cHJlc3Npb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB2cm1FbnRpdHkgPSByb290RW50aXR5LmVuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5KFZybUNvbXBvbmVudCwgcm9vdEVudGl0eSk7XG4gICAgdnJtRW50aXR5LmdldFZybSgpLnNldFZybUV4cHJlc3Npb25zKHZybUV4cHJlc3Npb25zKTtcbiAgICB2cm1FbnRpdHkuZ2V0VnJtKCkuX3ZlcnNpb24gPSAnMS4wJztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBhbmQgcHJvY2Vzc2VzIFZSTSBodW1hbm9pZCBib25lIG1hcHBpbmcgaW5mb3JtYXRpb24uXG4gICAqIENyZWF0ZXMgYSBtYXBwaW5nIGJldHdlZW4gYm9uZSBuYW1lcyBhbmQgbm9kZSBpbmRpY2VzIGZvciBodW1hbm9pZCBzdHJ1Y3R1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGNvbnRhaW5pbmcgaHVtYW5vaWQgZGF0YVxuICAgKiBAcGFyYW0gcm9vdEVudGl0eSAtIE9wdGlvbmFsIHJvb3QgZW50aXR5IHRvIHRhZyB3aXRoIGh1bWFub2lkIGluZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgX3JlYWRWUk1IdW1hbm9pZEluZm8oZ2x0Zk1vZGVsOiBWcm0xLCByb290RW50aXR5PzogSVNjZW5lR3JhcGhFbnRpdHkpOiB2b2lkIHtcbiAgICBjb25zdCBodW1hbkJvbmVzID0gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNQ192cm0uaHVtYW5vaWQuaHVtYW5Cb25lcztcbiAgICBjb25zdCBtYXBOYW1lTm9kZUlkOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgYm9uZU5hbWUgaW4gaHVtYW5Cb25lcykge1xuICAgICAgY29uc3QgYm9uZSA9IGh1bWFuQm9uZXNbYm9uZU5hbWVdO1xuICAgICAgbWFwTmFtZU5vZGVJZC5zZXQoYm9uZU5hbWUsIGJvbmUubm9kZSk7XG4gICAgfVxuICAgIGlmIChyb290RW50aXR5ICE9IG51bGwpIHtcbiAgICAgIHJvb3RFbnRpdHkudHJ5VG9TZXRUYWcoe1xuICAgICAgICB0YWc6ICdodW1hbm9pZF9tYXBfbmFtZV9ub2RlSWQnLFxuICAgICAgICB2YWx1ZTogbWFwTmFtZU5vZGVJZCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBhbmQgcHJvY2Vzc2VzIFZSTSBzcHJpbmcgYm9uZSBwaHlzaWNzIGRhdGEgZnJvbSB0aGUgbW9kZWwuXG4gICAqIFNldHMgdXAgY29sbGlkZXIgZ3JvdXBzLCBzcHJpbmcgYm9uZXMsIGFuZCBwaHlzaWNzIGNvbXBvbmVudHMgZm9yIGR5bmFtaWMgaGFpciBhbmQgY2xvdGggc2ltdWxhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBWUk0gbW9kZWwgY29udGFpbmluZyBzcHJpbmcgYm9uZSBkYXRhXG4gICAqL1xuICBzdGF0aWMgX3JlYWRTcHJpbmdCb25lKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFZybTEpOiB2b2lkIHtcbiAgICBjb25zdCBjb2xsaWRlckdyb3VwczogVlJNQ29sbGlkZXJHcm91cFtdID0gW107XG4gICAgaWYgKElzLmV4aXN0KGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTUNfc3ByaW5nQm9uZT8uY29sbGlkZXJHcm91cHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGNvbGxpZGVyR3JvdXBJZHggaW4gZ2x0Zk1vZGVsLmV4dGVuc2lvbnMuVlJNQ19zcHJpbmdCb25lLmNvbGxpZGVyR3JvdXBzKSB7XG4gICAgICAgIGNvbnN0IGNvbGxpZGVyR3JvdXAgPSBnbHRmTW9kZWwuZXh0ZW5zaW9ucy5WUk1DX3NwcmluZ0JvbmUuY29sbGlkZXJHcm91cHNbY29sbGlkZXJHcm91cElkeF07XG5cbiAgICAgICAgY29uc3QgdnJtQ29sbGlkZXJHcm91cCA9IG5ldyBWUk1Db2xsaWRlckdyb3VwKCk7XG4gICAgICAgIGNvbGxpZGVyR3JvdXBzLnB1c2godnJtQ29sbGlkZXJHcm91cCk7XG4gICAgICAgIGZvciAoY29uc3QgY29sbGlkZXJJZHggb2YgY29sbGlkZXJHcm91cC5jb2xsaWRlcnMpIHtcbiAgICAgICAgICBjb25zdCBjb2xsaWRlciA9IGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTUNfc3ByaW5nQm9uZS5jb2xsaWRlcnNbY29sbGlkZXJJZHhdO1xuXG4gICAgICAgICAgY29uc3QgYmFzZVNnID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyFbY29sbGlkZXIubm9kZV0uZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICAgIGlmIChJcy5leGlzdChjb2xsaWRlci5zaGFwZS5zcGhlcmUpKSB7XG4gICAgICAgICAgICBjb25zdCBzcGhlcmVDb2xsaWRlciA9IG5ldyBTcGhlcmVDb2xsaWRlcihcbiAgICAgICAgICAgICAgZW5naW5lLFxuICAgICAgICAgICAgICBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgICAgICAgICAgIGNvbGxpZGVyLnNoYXBlLnNwaGVyZS5vZmZzZXRbMF0sXG4gICAgICAgICAgICAgICAgY29sbGlkZXIuc2hhcGUuc3BoZXJlLm9mZnNldFsxXSxcbiAgICAgICAgICAgICAgICBjb2xsaWRlci5zaGFwZS5zcGhlcmUub2Zmc2V0WzJdLFxuICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgY29sbGlkZXIuc2hhcGUuc3BoZXJlLnJhZGl1cyxcbiAgICAgICAgICAgICAgYmFzZVNnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdnJtQ29sbGlkZXJHcm91cC5zcGhlcmVDb2xsaWRlcnMucHVzaChzcGhlcmVDb2xsaWRlcik7XG4gICAgICAgICAgfSBlbHNlIGlmIChJcy5leGlzdChjb2xsaWRlci5zaGFwZS5jYXBzdWxlKSkge1xuICAgICAgICAgICAgY29uc3QgY2Fwc3VsZUNvbGxpZGVyID0gbmV3IENhcHN1bGVDb2xsaWRlcihcbiAgICAgICAgICAgICAgZW5naW5lLFxuICAgICAgICAgICAgICBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgICAgICAgICAgIGNvbGxpZGVyLnNoYXBlLmNhcHN1bGUub2Zmc2V0WzBdLFxuICAgICAgICAgICAgICAgIGNvbGxpZGVyLnNoYXBlLmNhcHN1bGUub2Zmc2V0WzFdLFxuICAgICAgICAgICAgICAgIGNvbGxpZGVyLnNoYXBlLmNhcHN1bGUub2Zmc2V0WzJdLFxuICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgY29sbGlkZXIuc2hhcGUuY2Fwc3VsZS5yYWRpdXMsXG4gICAgICAgICAgICAgIFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICAgICAgICAgICAgY29sbGlkZXIuc2hhcGUuY2Fwc3VsZS50YWlsWzBdLFxuICAgICAgICAgICAgICAgIGNvbGxpZGVyLnNoYXBlLmNhcHN1bGUudGFpbFsxXSxcbiAgICAgICAgICAgICAgICBjb2xsaWRlci5zaGFwZS5jYXBzdWxlLnRhaWxbMl0sXG4gICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICBiYXNlU2dcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2cm1Db2xsaWRlckdyb3VwLmNhcHN1bGVDb2xsaWRlcnMucHVzaChjYXBzdWxlQ29sbGlkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNwcmluZ3M6IFZSTVNwcmluZ1tdID0gW107XG4gICAgaWYgKElzLmV4aXN0KGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTUNfc3ByaW5nQm9uZT8uc3ByaW5ncykpIHtcbiAgICAgIGZvciAoY29uc3Qgc3ByaW5nIG9mIGdsdGZNb2RlbC5leHRlbnNpb25zLlZSTUNfc3ByaW5nQm9uZS5zcHJpbmdzKSB7XG4gICAgICAgIGNvbnN0IGpvaW50Um9vdCA9IHNwcmluZy5qb2ludHNbMF07XG4gICAgICAgIGNvbnN0IGpvaW50Um9vdEVudGl0eSA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuRW50aXRpZXMhW2pvaW50Um9vdC5ub2RlXTtcbiAgICAgICAgY29uc3QgdnJtU3ByaW5nID0gbmV3IFZSTVNwcmluZyhqb2ludFJvb3RFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICAgICAgdnJtU3ByaW5nLnRyeVRvU2V0VW5pcXVlTmFtZShzcHJpbmcubmFtZSwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IGNvbGxpZGVyR3JvdXBJbmRpY2VzID0gSXMuZXhpc3Qoc3ByaW5nLmNvbGxpZGVyR3JvdXBzKSA/IHNwcmluZy5jb2xsaWRlckdyb3VwcyA6IFtdO1xuICAgICAgICB2cm1TcHJpbmcuY29sbGlkZXJHcm91cHMgPSBjb2xsaWRlckdyb3VwSW5kaWNlcy5tYXAoY29sbGlkZXJHcm91cElkeCA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbGxpZGVyR3JvdXBzW2NvbGxpZGVyR3JvdXBJZHhdO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhZGRlZEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgam9pbnRJZHggaW4gc3ByaW5nLmpvaW50cykge1xuICAgICAgICAgIGNvbnN0IGpvaW50ID0gc3ByaW5nLmpvaW50c1tqb2ludElkeF07XG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZ2x0Zk1vZGVsLmFzc2V0LmV4dHJhcyEucm5FbnRpdGllcyFbam9pbnQubm9kZV07XG4gICAgICAgICAgY29uc3Qgc3ByaW5nQm9uZSA9IG5ldyBWUk1TcHJpbmdCb25lKGVudGl0eSk7XG4gICAgICAgICAgc3ByaW5nQm9uZS5kcmFnRm9yY2UgPSBJcy5leGlzdChqb2ludC5kcmFnRm9yY2UpID8gam9pbnQuZHJhZ0ZvcmNlIDogMC40O1xuICAgICAgICAgIHNwcmluZ0JvbmUuc3RpZmZuZXNzRm9yY2UgPSBJcy5leGlzdChqb2ludC5zdGlmZm5lc3MpID8gam9pbnQuc3RpZmZuZXNzIDogMTtcbiAgICAgICAgICBzcHJpbmdCb25lLmdyYXZpdHlQb3dlciA9IElzLmV4aXN0KGpvaW50LmdyYXZpdHlQb3dlcikgPyBqb2ludC5ncmF2aXR5UG93ZXIgOiAxO1xuICAgICAgICAgIHNwcmluZ0JvbmUuZ3Jhdml0eURpciA9IElzLmV4aXN0KGpvaW50LmdyYXZpdHlEaXIpXG4gICAgICAgICAgICA/IFZlY3RvcjMuZnJvbUNvcHlBcnJheTMoW2pvaW50LmdyYXZpdHlEaXJbMF0sIGpvaW50LmdyYXZpdHlEaXJbMV0sIGpvaW50LmdyYXZpdHlEaXJbMl1dKVxuICAgICAgICAgICAgOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkzKFswLCAtMSwgMF0pO1xuICAgICAgICAgIHNwcmluZ0JvbmUuaGl0UmFkaXVzID0gSXMuZXhpc3Qoam9pbnQuaGl0UmFkaXVzKSA/IGpvaW50LmhpdFJhZGl1cyA6IDAuMDI7XG4gICAgICAgICAgdnJtU3ByaW5nLmJvbmVzLnB1c2goc3ByaW5nQm9uZSk7XG4gICAgICAgICAgYWRkZWRFbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ByaW5nLmNlbnRlciAhPSBudWxsICYmIHNwcmluZy5jZW50ZXIgIT09IC0xKSB7XG4gICAgICAgICAgdnJtU3ByaW5nLmNlbnRlciA9IGdsdGZNb2RlbC5hc3NldC5leHRyYXMhLnJuRW50aXRpZXMhW3NwcmluZy5jZW50ZXJdLmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpbmQgYW5kIGFkZCB0aGUgbWlzc2luZyBqb2ludHMgZnJvbSBzcHJpbmcuam9pbnRzLlxuICAgICAgICB0aGlzLl9fYWRkU3ByaW5nQm9uZVJlY3Vyc2l2ZWx5KHZybVNwcmluZywgam9pbnRSb290RW50aXR5LCBhZGRlZEVudGl0aWVzKTtcbiAgICAgICAgc3ByaW5ncy5wdXNoKHZybVNwcmluZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzcHJpbmcgb2Ygc3ByaW5ncykge1xuICAgICAgdGhpcy5fX2FkZFBoeXNpY3NDb21wb25lbnQoc3ByaW5nLCBzcHJpbmcucm9vdEJvbmUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBhZGRzIHNwcmluZyBib25lIGNvbXBvbmVudHMgdG8gYWxsIGNoaWxkIGVudGl0aWVzIGluIHRoZSBoaWVyYXJjaHkuXG4gICAqIFRoaXMgZW5zdXJlcyB0aGF0IGFsbCBib25lcyBpbiBhIHNwcmluZyBib25lIGNoYWluIGFyZSBwcm9wZXJseSBjb25maWd1cmVkLlxuICAgKlxuICAgKiBAcGFyYW0gdnJtU3ByaW5nIC0gVGhlIFZSTSBzcHJpbmcgb2JqZWN0IHRvIGFkZCBib25lcyB0b1xuICAgKiBAcGFyYW0gZW50aXR5IC0gVGhlIGN1cnJlbnQgZW50aXR5IHRvIHByb2Nlc3NcbiAgICogQHBhcmFtIGFkZGVkRW50aXRpZXMgLSBBcnJheSBvZiBlbnRpdGllcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIHByb2Nlc3NlZFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hZGRTcHJpbmdCb25lUmVjdXJzaXZlbHkoXG4gICAgdnJtU3ByaW5nOiBWUk1TcHJpbmcsXG4gICAgZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICBhZGRlZEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNnID0gZW50aXR5LmdldFNjZW5lR3JhcGgoKTtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHNnLmNoaWxkcmVuO1xuXG4gICAgaWYgKCFhZGRlZEVudGl0aWVzLmluY2x1ZGVzKGVudGl0eSkpIHtcbiAgICAgIGNvbnN0IHNwcmluZ0JvbmUgPSBuZXcgVlJNU3ByaW5nQm9uZShlbnRpdHkpO1xuICAgICAgdnJtU3ByaW5nLmJvbmVzLnB1c2goc3ByaW5nQm9uZSk7XG4gICAgICBhZGRlZEVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9fYWRkU3ByaW5nQm9uZVJlY3Vyc2l2ZWx5KHZybVNwcmluZywgY2hpbGQuZW50aXR5LCBhZGRlZEVudGl0aWVzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHBoeXNpY3MgY29tcG9uZW50IHdpdGggVlJNIHNwcmluZyBib25lIHN0cmF0ZWd5IHRvIGFuIGVudGl0eS5cbiAgICogVGhpcyBlbmFibGVzIHBoeXNpY3Mgc2ltdWxhdGlvbiBmb3IgdGhlIHNwcmluZyBib25lIHN5c3RlbS5cbiAgICpcbiAgICogQHBhcmFtIHNwcmluZyAtIFRoZSBWUk0gc3ByaW5nIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHNnIC0gVGhlIHNjZW5lIGdyYXBoIGNvbXBvbmVudCB0byBhZGQgcGh5c2ljcyB0b1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hZGRQaHlzaWNzQ29tcG9uZW50KHNwcmluZzogVlJNU3ByaW5nLCBzZzogU2NlbmVHcmFwaENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGVudGl0eSA9IHNnLmVudGl0eTtcbiAgICBjb25zdCBuZXdFbnRpdHkgPSBlbnRpdHkuZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoUGh5c2ljc0NvbXBvbmVudCwgZW50aXR5KTtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gbmV3RW50aXR5LmdldFBoeXNpY3MoKTtcbiAgICBjb25zdCBzdHJhdGVneSA9IG5ldyBWUk1TcHJpbmdCb25lUGh5c2ljc1N0cmF0ZWd5KCk7XG4gICAgc3RyYXRlZ3kuc2V0U3ByaW5nKHNwcmluZyk7XG4gICAgcGh5c2ljc0NvbXBvbmVudC5zZXRTdHJhdGVneShzdHJhdGVneSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0ZXh0dXJlIG9iamVjdHMgZnJvbSB0aGUgZ2xURiBtb2RlbCBkYXRhLlxuICAgKiBBbHNvIGdlbmVyYXRlcyBkdW1teSB3aGl0ZSBhbmQgYmxhY2sgdGV4dHVyZXMgZm9yIGRlZmF1bHQgbWF0ZXJpYWwgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBnbFRGIG1vZGVsIGNvbnRhaW5pbmcgdGV4dHVyZSBkYXRhXG4gICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGFuIGFycmF5IG9mIGNyZWF0ZWQgVGV4dHVyZSBvYmplY3RzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgX2NyZWF0ZVRleHR1cmVzKGVuZ2luZTogRW5naW5lLCBnbHRmTW9kZWw6IFJuTTIpOiBQcm9taXNlPFRleHR1cmVbXT4ge1xuICAgIGlmICghZ2x0Zk1vZGVsLnRleHR1cmVzKSBnbHRmTW9kZWwudGV4dHVyZXMgPSBbXTtcblxuICAgIGNvbnN0IGdsdGZUZXh0dXJlcyA9IGdsdGZNb2RlbC50ZXh0dXJlcztcbiAgICBjb25zdCByblRleHR1cmVzOiBUZXh0dXJlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdsdGZUZXh0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgcm5UZXh0dXJlID0gYXdhaXQgTW9kZWxDb252ZXJ0ZXIuX2NyZWF0ZVRleHR1cmUoZW5naW5lLCBnbHRmVGV4dHVyZXNbaV0uc291cmNlT2JqZWN0ISwgZ2x0Zk1vZGVsKTtcbiAgICAgIHJuVGV4dHVyZXNbaV0gPSByblRleHR1cmU7XG4gICAgfVxuXG4gICAgY29uc3QgZHVtbXlXaGl0ZVRleHR1cmUgPSBuZXcgVGV4dHVyZShlbmdpbmUpO1xuICAgIGF3YWl0IGR1bW15V2hpdGVUZXh0dXJlLmdlbmVyYXRlMXgxVGV4dHVyZUZyb20oKTtcbiAgICBkdW1teVdoaXRlVGV4dHVyZS5tYXJrQXNEdW1teVRleHR1cmUoKTtcbiAgICByblRleHR1cmVzLnB1c2goZHVtbXlXaGl0ZVRleHR1cmUpO1xuICAgIGNvbnN0IGR1bW15QmxhY2tUZXh0dXJlID0gbmV3IFRleHR1cmUoZW5naW5lKTtcbiAgICBhd2FpdCBkdW1teUJsYWNrVGV4dHVyZS5nZW5lcmF0ZTF4MVRleHR1cmVGcm9tKCdyZ2JhKDAsIDAsIDAsIDEpJyk7XG4gICAgZHVtbXlCbGFja1RleHR1cmUubWFya0FzRHVtbXlUZXh0dXJlKCk7XG4gICAgcm5UZXh0dXJlcy5wdXNoKGR1bW15QmxhY2tUZXh0dXJlKTtcblxuICAgIHJldHVybiByblRleHR1cmVzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgc2FtcGxlciBvYmplY3RzIGZyb20gdGhlIGdsVEYgbW9kZWwgZGF0YS5cbiAgICogQWxzbyBnZW5lcmF0ZXMgZHVtbXkgc2FtcGxlcnMgZm9yIGRlZmF1bHQgdGV4dHVyZSBzYW1wbGluZyBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgY29udGFpbmluZyBzYW1wbGVyIGRhdGFcbiAgICogQHJldHVybnMgQXJyYXkgb2YgY3JlYXRlZCBTYW1wbGVyIG9iamVjdHNcbiAgICovXG4gIHN0YXRpYyBfY3JlYXRlU2FtcGxlcnMoZW5naW5lOiBFbmdpbmUsIGdsdGZNb2RlbDogUm5NMik6IFNhbXBsZXJbXSB7XG4gICAgaWYgKCFnbHRmTW9kZWwudGV4dHVyZXMpIGdsdGZNb2RlbC50ZXh0dXJlcyA9IFtdO1xuXG4gICAgY29uc3QgZ2x0ZlRleHR1cmVzID0gZ2x0Zk1vZGVsLnRleHR1cmVzO1xuICAgIGNvbnN0IHJuU2FtcGxlcnM6IFNhbXBsZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2x0ZlRleHR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByblNhbXBsZXIgPSBNb2RlbENvbnZlcnRlci5fY3JlYXRlU2FtcGxlcihlbmdpbmUsIGdsdGZUZXh0dXJlc1tpXS5zYW1wbGVyT2JqZWN0ISk7XG4gICAgICByblNhbXBsZXJzW2ldID0gcm5TYW1wbGVyO1xuICAgIH1cblxuICAgIGNvbnN0IGR1bW15U2FtcGxlciA9IG5ldyBTYW1wbGVyKGVuZ2luZSwge1xuICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICAgIG1pbkZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgIH0pO1xuICAgIGR1bW15U2FtcGxlci5jcmVhdGUoKTtcbiAgICByblNhbXBsZXJzLnB1c2goZHVtbXlTYW1wbGVyKTtcbiAgICByblNhbXBsZXJzLnB1c2goZHVtbXlTYW1wbGVyKTtcblxuICAgIHJldHVybiByblNhbXBsZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIE1Ub29uIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGRldGVybWluZXMgaWYgb3V0bGluZSByZW5kZXJpbmcgaXMgbmVlZGVkLlxuICAgKiBNVG9vbiBpcyB0aGUgc3RhbmRhcmQgdG9vbiBzaGFkZXIgdXNlZCBpbiBWUk0gbW9kZWxzLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0Zk1vZGVsIC0gVGhlIGdsVEYgbW9kZWwgY29udGFpbmluZyBtYXRlcmlhbCBkYXRhXG4gICAqIEBwYXJhbSB0ZXh0dXJlc0xlbmd0aCAtIFRoZSBudW1iZXIgb2YgdGV4dHVyZXMgaW4gdGhlIG1vZGVsXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYW55IG1hdGVyaWFsIHJlcXVpcmVzIG91dGxpbmUgcmVuZGVyaW5nLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faW5pdGlhbGl6ZU1Ub29uTWF0ZXJpYWxQcm9wZXJ0aWVzKGdsdGZNb2RlbDogUm5NMiwgX3RleHR1cmVzTGVuZ3RoOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBsZXQgaXNPdXRsaW5lID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiBnbHRmTW9kZWwubWF0ZXJpYWxzKSB7XG4gICAgICBjb25zdCBtdG9vbk1hdGVyaWFsOiBWcm0xX01hdGVyaWFsc19NVG9vbiA9IG1hdGVyaWFsLmV4dGVuc2lvbnM/LlZSTUNfbWF0ZXJpYWxzX210b29uO1xuICAgICAgaWYgKG10b29uTWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKElzLm5vdC5leGlzdChtYXRlcmlhbC5leHRyYXMpKSB7XG4gICAgICAgIG1hdGVyaWFsLmV4dHJhcyA9IHt9O1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgVlJNIDEuMCBzcGVjaWZpY2F0aW9uIGRlZmF1bHRzIG91dGxpbmVXaWR0aE1vZGUgdG8gXCJub25lXCIgd2hlbiBpdCBpcyBvbWl0dGVkLlxuICAgICAgY29uc3Qgb3V0bGluZVdpZHRoTW9kZSA9IG10b29uTWF0ZXJpYWwub3V0bGluZVdpZHRoTW9kZTtcbiAgICAgIGlmIChvdXRsaW5lV2lkdGhNb2RlID09PSAnd29ybGRDb29yZGluYXRlcycgfHwgb3V0bGluZVdpZHRoTW9kZSA9PT0gJ3NjcmVlbkNvb3JkaW5hdGVzJykge1xuICAgICAgICBpc091dGxpbmUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpc091dGxpbmU7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIGFuZCB2YWxpZGF0ZXMgaW1wb3J0IG9wdGlvbnMgZm9yIFZSTSBmaWxlcy5cbiAgICogQ29udmVydHMgLnZybSBmaWxlIGV4dGVuc2lvbnMgdG8gLmdsYiBhbmQgc2V0cyB1cCBkZWZhdWx0IG1hdGVyaWFsIGhlbHBlciBhcmd1bWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgaW1wb3J0IGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgUHJvY2Vzc2VkIGFuZCB2YWxpZGF0ZWQgaW1wb3J0IG9wdGlvbnNcbiAgICovXG4gIHN0YXRpYyBfZ2V0T3B0aW9ucyhvcHRpb25zPzogR2x0ZkxvYWRPcHRpb24pOiBHbHRmTG9hZE9wdGlvbiB7XG4gICAgaWYgKG9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBmaWxlIGluIG9wdGlvbnMuZmlsZXMpIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlLnNwbGl0KCcudnJtJylbMF07XG4gICAgICAgIGlmIChmaWxlTmFtZSkge1xuICAgICAgICAgIGNvbnN0IGFycmF5YnVmZmVyID0gb3B0aW9ucy5maWxlc1tmaWxlXTtcbiAgICAgICAgICBvcHRpb25zLmZpbGVzW2Ake2ZpbGVOYW1lfS5nbGJgXSA9IGFycmF5YnVmZmVyO1xuICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmZpbGVzW2ZpbGVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vc2V0IGRlZmF1bHQgdmFsdWVzXG4gICAgICBvcHRpb25zLl9faXNJbXBvcnRWUk0weCA9IHRydWU7XG4gICAgICBpZiAob3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID09IG51bGwpIHtcbiAgICAgICAgb3B0aW9ucy5kZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5ID0gW3t9XTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvcHRpb25zLmRlZmF1bHRNYXRlcmlhbEhlbHBlckFyZ3VtZW50QXJyYXlbMF0uaXNNb3JwaGluZykge1xuICAgICAgICBvcHRpb25zLm1heE1vcnBoVGFyZ2V0TnVtYmVyID0gMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgZmlsZXM6IHt9LFxuICAgICAgICBsb2FkZXJFeHRlbnNpb246IHVuZGVmaW5lZCxcbiAgICAgICAgZGVmYXVsdE1hdGVyaWFsSGVscGVyTmFtZTogdW5kZWZpbmVkLFxuICAgICAgICBkZWZhdWx0TWF0ZXJpYWxIZWxwZXJBcmd1bWVudEFycmF5OiBbeyBpc0xpZ2h0aW5nOiB0cnVlLCBpc01vcnBoaW5nOiB0cnVlLCBpc1NraW5uaW5nOiB0cnVlIH1dLFxuICAgICAgICBzdGF0ZXNPZkVsZW1lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGFyZ2V0czogW10sXG4gICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgZW5hYmxlOiBbXSxcbiAgICAgICAgICAgICAgZnVuY3Rpb25zOiB7fSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1RyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICAgICAgb3BhY2l0eTogMS4wLFxuICAgICAgICAgICAgaXNUZXh0dXJlSW1hZ2VUb0xvYWRQcmVNdWx0aXBsaWVkQWxwaGE6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIF9faXNJbXBvcnRWUk0weDogdHJ1ZSxcbiAgICAgICAgX19pbXBvcnRlZFR5cGU6ICd2cm0xJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBvbmx5IHRoZSBKU09OIGRhdGEgc3RydWN0dXJlIG9mIGEgVlJNIGZpbGUgd2l0aG91dCBwcm9jZXNzaW5nIHRoZSBmdWxsIG1vZGVsLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgZXh0cmFjdGluZyBtZXRhZGF0YSBhbmQgc3RydWN0dXJlIGluZm9ybWF0aW9uIHdpdGhvdXQgZnVsbCByZW5kZXJpbmcgc2V0dXAuXG4gICAqXG4gICAqIEBwYXJhbSB1cmkgLSBUaGUgVVJJIG9yIHBhdGggdG8gdGhlIFZSTSBmaWxlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgaW1wb3J0IGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgUHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIFZSTSBKU09OIHN0cnVjdHVyZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGltcG9ydEpzb25PZlZSTSh1cmk6IHN0cmluZywgb3B0aW9ucz86IEdsdGZMb2FkT3B0aW9uKTogUHJvbWlzZTxWcm0xPiB7XG4gICAgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgR2x0ZjJJbXBvcnRlci5pbXBvcnRGcm9tVXJsKHVyaSwgb3B0aW9ucyk7XG4gICAgVnJtSW1wb3J0ZXIuX3JlYWRWUk1IdW1hbm9pZEluZm8ocmVzdWx0IGFzIFZybTEpO1xuICAgIHJldHVybiByZXN1bHQgYXMgVnJtMTtcbiAg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QSxNQUNqQztBQUFBLElBQ0YsT0FBTztBQUNMLGdCQUFVO0FBQUEsUUFDUixPQUFPLENBQUM7QUFBQSxRQUNSLGlCQUFpQjtBQUFBLFFBQ2pCLDJCQUEyQjtBQUFBLFFBQzNCLG9DQUFvQyxDQUFDLEVBQUUsWUFBWSxNQUFNLFlBQVksTUFBTSxZQUFZLEtBQUssQ0FBQztBQUFBLFFBQzdGLGtCQUFrQjtBQUFBLFVBQ2hCO0FBQUEsWUFDRSxTQUFTLENBQUM7QUFBQSxZQUNWLFFBQVE7QUFBQSxjQUNOLFFBQVEsQ0FBQztBQUFBLGNBQ1QsV0FBVyxDQUFDO0FBQUEsWUFDZDtBQUFBLFlBQ0EsZUFBZTtBQUFBLFlBQ2YsU0FBUztBQUFBLFlBQ1Qsd0NBQXdDO0FBQUEsVUFDMUM7QUFBQSxRQUNGO0FBQUEsUUFDQUEsSUFBaUI7QUFBQSxRQUNqQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLGFBQWEsZ0JBQWdCLEtBQWEsU0FBeUM7QUFDakYsY0FBVSxLQUFLLFlBQVksT0FBTztBQUNsQyxVQUFNLFNBQVMsTUFBTSxjQUFjLGNBQWMsS0FBSyxPQUFPO0FBQzdELGlCQUFZLHFCQUFxQixNQUFjO0FBQy9DLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9faW1wb3J0VlJNIiwgIl9faW5pdGlhbGl6ZU1Ub29uTWF0ZXJpYWxQcm9wZXJ0aWVzIiwgIl9fYWRkU3ByaW5nQm9uZVJlY3Vyc2l2ZWx5IiwgIl9fYWRkUGh5c2ljc0NvbXBvbmVudCIsICJfX2lzSW1wb3J0VlJNMHgiXQp9Cg==
