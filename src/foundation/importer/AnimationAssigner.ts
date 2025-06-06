import type { RnM2 } from '../../types/RnM2';
import { ModelConverter } from './ModelConverter';
import { EntityRepository } from '../core/EntityRepository';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import type { Index } from '../../types/CommonTypes';
import type { Vrm0x } from '../../types/VRM0x';
import { Is } from '../misc/Is';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AbsoluteAnimation, GlobalRetarget, type IAnimationRetarget } from '../components';
import type { Vrm1 } from '../../types/VRM1';
import type { AnimationSampler, AnimationTrackName, RnM2Vrma } from '../../types';
import { Vector3 } from '../math';
import { GlobalRetargetReverse } from '../components/Skeletal/AnimationRetarget/GlobalRetargetReverse';
import { AnimationStateComponent } from '../components/AnimationState/AnimationStateComponent';
import { Logger } from '../misc/Logger';
import { AnimatedQuaternion } from '../math/AnimatedQuaternion';
import { AnimatedVector3 } from '../math/AnimatedVector3';
import type { VRM } from '../../types/VRM';

type RetargetMode = 'none' | 'global' | 'absolute';

export class AnimationAssigner {
  private static __instance: AnimationAssigner;

  /**
   * Assigns animation data from a glTF model to a root entity with optional retargeting.
   * This method handles both same-skeleton and cross-skeleton animation assignment.
   *
   * @param rootEntity - The root entity of the model to which animation will be assigned
   * @param gltfModel - The glTF model containing animation data
   * @param vrmModel - The corresponding VRM model that provides humanoid bone mapping
   * @param isSameSkeleton - Whether the source and target skeletons are identical
   * @param retargetMode - The retargeting mode: 'none' for direct assignment, 'global' for global retargeting, 'absolute' for absolute animation
   * @returns The root entity with assigned animations
   */
  assignAnimation(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: VRM | Vrm1 | Vrm0x,
    isSameSkeleton: boolean,
    retargetMode: RetargetMode
  ) {
    this.__resetAnimationAndPose(rootEntity);

    this.__setupAnimationForSameSkeleton(rootEntity, gltfModel, vrmModel as VRM, isSameSkeleton, retargetMode);

    return rootEntity;
  }

  /**
   * Assigns animation data from a VRMA (VRM Animation) model to a root entity.
   * This method specifically handles VRM animation format with humanoid bone mapping.
   *
   * @param rootEntity - The root entity of the model to which animation will be assigned
   * @param vrmaModel - The VRMA model containing animation data and humanoid bone mappings
   * @param postfixToTrackName - Optional postfix to append to animation track names for identification
   * @returns An array of animation track names that were created
   */
  assignAnimationWithVrma(rootEntity: ISceneGraphEntity, vrmaModel: RnM2Vrma, postfixToTrackName?: string) {
    const entityVrma = ModelConverter.convertToRhodoniteObjectSimple(vrmaModel);

    this.__resetAnimationAndPose(rootEntity, postfixToTrackName);

    let trackNames: Set<string> = new Set();
    const setRetarget = (vrma: RnM2Vrma) => {
      if (vrma.animations == null || vrma.animations.length === 0) {
        return;
      }

      EntityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);

      for (const animation of vrma.animations) {
        for (const sampler of animation.samplers) {
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.inputObject!);
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.outputObject!);
        }
      }

      for (const animation of vrma.animations) {
        for (const channel of animation.channels) {
          // find the corresponding joint entity
          // const node = gltfModel.nodes[channel.target!.node!];
          const rnEntity = this.__getCorrespondingEntityWithVrma(rootEntity, vrma, channel.target!.node!);
          if (rnEntity) {
            const newRnEntity = EntityRepository.addComponentToEntity(AnimationComponent, rnEntity);
            const animationComponent = newRnEntity.getAnimation();

            const gltfEntity = vrma.extras.rnEntities[channel.target!.node!];
            const humanBones = vrma.extensions.VRMC_vrm_animation.humanoidBoneNameMap!;
            const humanoidBoneName = humanBones.get(channel.target!.node!)!;
            gltfEntity.tryToSetUniqueName(humanoidBoneName, true);

            let retarget: IAnimationRetarget | undefined;
            if (rootEntity.tryToGetVrm()!._version === '0.x') {
              retarget = new GlobalRetargetReverse(gltfEntity);
            } else if (rootEntity.tryToGetVrm()!._version === '1.0') {
              retarget = new GlobalRetarget(gltfEntity);
            }
            const names = animationComponent._setRetarget(retarget!, postfixToTrackName);
            names.forEach(name => {
              trackNames.add(name);
            });
          }
        }
      }
    };

    // Set retarget
    setRetarget(vrmaModel);

    EntityRepository.deleteEntityRecursively(entityVrma.entityUID);

    return Array.from(trackNames);
  }

  private constructor() {}

  /**
   * Resets animation tracks and restores entities to their rest pose.
   * This method recursively processes all child entities.
   *
   * @param rootEntity - The root entity to reset
   * @param postfixToTrackName - Optional postfix to identify specific animation tracks to reset
   */
  private __resetAnimationAndPose(rootEntity: ISceneGraphEntity, postfixToTrackName?: string) {
    function resetAnimationAndPose(entity: ISceneGraphEntity, postfixToTrackName?: string) {
      const animationComponent = entity.tryToGetAnimation();
      if (animationComponent != null) {
        if (postfixToTrackName != null) {
          animationComponent.resetAnimationTrackByPostfix(postfixToTrackName);
        } else {
          animationComponent.resetAnimationTracks();
        }
      }
      entity.getTransform()._restoreTransformFromRest();
      for (const child of entity.children) {
        resetAnimationAndPose(child.entity, postfixToTrackName);
      }
    }
    resetAnimationAndPose(rootEntity, postfixToTrackName);
  }

  /**
   * Gets the singleton instance of the AnimationAssigner class.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton instance of AnimationAssigner
   */
  static getInstance(): AnimationAssigner {
    if (!this.__instance) {
      this.__instance = new AnimationAssigner();
    }
    return this.__instance;
  }

  /**
   * Finds the corresponding entity in the target skeleton for a given node in the source model.
   * Handles both same-skeleton matching (by name) and cross-skeleton matching (by humanoid bone mapping).
   *
   * @param rootEntity - The root entity of the target skeleton
   * @param gltfModel - The source glTF model
   * @param vrmModel - The VRM model containing humanoid bone mappings
   * @param nodeIndex - The index of the node in the source model
   * @param nodeName - The name of the node in the source model
   * @param isSameSkeleton - Whether the source and target skeletons are identical
   * @returns The corresponding entity in the target skeleton, or undefined if not found
   */
  private __getCorrespondingEntity(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: VRM,
    nodeIndex: Index,
    nodeName: string | undefined,
    isSameSkeleton: boolean
  ) {
    if (isSameSkeleton) {
      // isSameSkeleton is true, so we find joints from joints name.
      const rnEntities = rootEntity.getTagValue('rnEntitiesByNames')! as Map<string, ISceneGraphEntity>;
      const node = gltfModel.nodes[nodeIndex];
      const rnEntity = rnEntities.get(node.name!);
      return rnEntity;
    } else {
      // isSameSkeleton is false, so we find joints from humanoid bone mapping data
      if (Is.exist(vrmModel.extensions.VRM)) {
        // VRM0.x
        const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
        let humanoidBoneName: string | undefined;
        const srcMapNodeIdName: Map<number, string> = new Map();
        const srcMapNodeNameName: Map<string, string> = new Map();
        for (const bone of humanBones) {
          srcMapNodeIdName.set(bone.node, bone.bone);
          srcMapNodeNameName.set(bone.name!, bone.bone);
        }
        if (nodeName != null) {
          humanoidBoneName = srcMapNodeNameName.get(nodeName);
          if (humanoidBoneName == null) {
            humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
          }
        }
        const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
        const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
        if (dstBoneNodeId != null) {
          const rnEntities = rootEntity.getTagValue('rnEntities')! as ISceneGraphEntity[];
          return rnEntities[dstBoneNodeId];
        } else {
          Logger.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}, nodeName: ${nodeName}`);
          return void 0;
        }
      } else if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
        // VRM1.0
        const humanBones = vrmModel.extensions.VRMC_vrm.humanoid.humanBones;
        let humanoidBoneName: string | undefined;
        const srcMapNodeIdName: Map<number, string> = new Map();
        for (const boneName in humanBones) {
          const bone = humanBones[boneName];
          srcMapNodeIdName.set(bone.node, boneName);
        }
        if (nodeName != null) {
          humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
        }
        const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
        const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
        if (dstBoneNodeId != null) {
          const rnEntities = rootEntity.getTagValue('rnEntities')! as ISceneGraphEntity[];
          return rnEntities[dstBoneNodeId];
        } else {
          Logger.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}, nodeName: ${nodeName}`);
          return void 0;
        }
      }
      return void 0;
    }
  }

  /**
   * Finds the corresponding entity in the target skeleton for a VRMA animation node.
   * Uses humanoid bone name mapping from the VRMA model to match bones.
   *
   * @param rootEntity - The root entity of the target skeleton
   * @param gltfModel - The VRMA model containing animation data
   * @param nodeIndex - The index of the node in the VRMA model
   * @returns The corresponding entity in the target skeleton, or undefined if not found
   */
  private __getCorrespondingEntityWithVrma(rootEntity: ISceneGraphEntity, gltfModel: RnM2Vrma, nodeIndex: Index) {
    // VRM1.0
    const humanBones = gltfModel.extensions.VRMC_vrm_animation.humanoidBoneNameMap!;
    const humanoidBoneName = humanBones.get(nodeIndex)!;
    const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
    const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
    if (dstBoneNodeId != null) {
      const rnEntities = rootEntity.getTagValue('rnEntities')! as ISceneGraphEntity[];
      const rnEntity = rnEntities[dstBoneNodeId];
      // if (humanoidBoneName === 'hips') {
      //   rnEntity.parent!.scale = Vector3.fromCopy3(100, 100, 100);
      // }

      return rnEntity;
    } else {
      Logger.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}`);
      return void 0;
    }
  }

  /**
   * Determines whether a given node represents the hips bone in the humanoid skeleton.
   * This is used for special handling of hip translation animations.
   *
   * @param rootEntity - The root entity containing humanoid bone mappings
   * @param vrmModel - The VRM model with humanoid bone definitions
   * @param nodeIndex - The index of the node to check
   * @returns True if the node represents the hips bone, false otherwise
   */
  private __isHips(rootEntity: ISceneGraphEntity, vrmModel: VRM, nodeIndex: Index) {
    const srcMapNodeIdName: Map<number, string> = new Map();
    if (Is.exist(vrmModel.extensions.VRM)) {
      const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
      for (const bone of humanBones) {
        srcMapNodeIdName.set(bone.node, bone.bone);
      }
    } else if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
      const humanBones = vrmModel.extensions.VRMC_vrm.humanoid.humanBones;
      for (const boneName in humanBones) {
        const bone = humanBones[boneName];
        srcMapNodeIdName.set(bone.node, boneName);
      }
    }
    const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
    const humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
    if (humanoidBoneName === 'hips') {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets up animation components and data for entities with the same skeleton structure.
   * Processes all animation channels and applies them to corresponding entities with optional retargeting.
   *
   * @param rootEntity - The root entity of the target skeleton
   * @param gltfModel - The source glTF model containing animation data
   * @param vrmModel - The VRM model with humanoid bone mappings
   * @param isSameSkeleton - Whether the source and target skeletons are identical
   * @param retargetMode - The retargeting mode to apply
   */
  private __setupAnimationForSameSkeleton(
    rootEntity: ISceneGraphEntity,
    gltfModel: RnM2,
    vrmModel: VRM,
    isSameSkeleton: boolean,
    retargetMode: RetargetMode
  ) {
    if (gltfModel.animations == null || gltfModel.animations.length === 0) {
      return;
    }

    EntityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);

    for (const animation of gltfModel.animations) {
      for (const sampler of animation.samplers) {
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.inputObject!);
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(sampler.outputObject!);
      }
    }

    for (const animation of gltfModel.animations) {
      for (const channel of animation.channels) {
        // get animation data
        const animInputArray = channel.samplerObject?.inputObject?.extras!.typedDataArray;
        const animOutputArray = channel.samplerObject?.outputObject?.extras!.typedDataArray;
        const interpolation =
          channel.samplerObject!.interpolation != null ? channel.samplerObject!.interpolation : 'LINEAR';

        // find the corresponding joint entity
        const node = gltfModel.nodes[channel.target!.node!];
        const rnEntity = this.__getCorrespondingEntity(
          rootEntity,
          gltfModel,
          vrmModel,
          channel.target!.node!,
          node.name,
          isSameSkeleton
        );
        if (rnEntity) {
          const newRnEntity = EntityRepository.addComponentToEntity(AnimationComponent, rnEntity);
          const animationComponent = newRnEntity.getAnimation();

          if (retargetMode === 'none') {
            // apply animation data to the target joint entity
            let animationAttributeType = 'translate';
            if (channel.target!.path === 'translation') {
              animationAttributeType = 'translate';
            } else if (channel.target!.path! === 'rotation') {
              animationAttributeType = 'quaternion';
            } else {
              animationAttributeType = channel.target!.path;
            }
            if (animationAttributeType === 'quaternion') {
              const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
              const trackName = Is.exist(animation.name) ? animation.name! : 'Untitled';
              animationSamplers.set(trackName, {
                input: animInputArray!,
                output: animOutputArray!,
                outputComponentN: 4, // Quaternion
                interpolationMethod: AnimationInterpolation.fromString(interpolation),
              });
              const newAnimatedValue = new AnimatedQuaternion(animationSamplers, trackName);
              animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
            } else if (
              animationAttributeType === 'translate' &&
              this.__isHips(rootEntity, vrmModel, channel.target!.node!)
            ) {
              const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
              const trackName = Is.exist(animation.name) ? animation.name! : 'Untitled';
              animationSamplers.set(trackName, {
                input: animInputArray!,
                output: animOutputArray!,
                outputComponentN: 3, // translate
                interpolationMethod: AnimationInterpolation.fromString(interpolation),
              });
              const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
              animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
            }
          } else {
            const gltfEntity = gltfModel.extras.rnEntities[channel.target!.node!];
            let retarget: IAnimationRetarget | undefined;
            if (retargetMode === 'global') {
              retarget = new GlobalRetarget(gltfEntity);
            } else if (retargetMode === 'absolute') {
              retarget = new AbsoluteAnimation(gltfEntity);
            } else {
              throw new Error('unknown retarget mode');
            }
            animationComponent._setRetarget(retarget);
          }
        }
      }
    }
  }
}
