import type { AnimationPathName, AnimationSampler, AnimationTrackName, RnM2Vrma } from '../../types';
import type { Index } from '../../types/CommonTypes';
import type { RnM2, RnM2Animation, RnM2AnimationChannel } from '../../types/RnM2';
import type { VRM } from '../../types/VRM';
import type { Vrm0x } from '../../types/VRM0x';
import type { Vrm1 } from '../../types/VRM1';
import type { HumanBoneNames, NodeId, VrmaExpressionName } from '../../types/VRMC_vrm_animation';
import { AbsoluteAnimation, GlobalRetarget, type IAnimationRetarget } from '../components';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationStateComponent } from '../components/AnimationState/AnimationStateComponent';
import type {
  CharacterAnimationMapping,
  CharacterAnimationSemantic,
} from '../components/CharacterController/CharacterAnimationController';
import { GlobalRetargetReverse } from '../components/Skeletal/AnimationRetarget/GlobalRetargetReverse';
import { AnimationInterpolation } from '../definitions/AnimationInterpolation';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { AnimatedQuaternion } from '../math/AnimatedQuaternion';
import { AnimatedScalar } from '../math/AnimatedScalar';
import { AnimatedVector3 } from '../math/AnimatedVector3';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import type { Engine } from '../system/Engine';
import { ModelConverter } from './ModelConverter';
import { VrmaImporter } from './VrmaImporter';

type RetargetMode = 'none' | 'global' | 'absolute';

const characterAnimationSemantics: readonly CharacterAnimationSemantic[] = [
  'idle',
  'walk',
  'run',
  'jump',
  'fall',
  'landing',
  'slide',
];

const vrmaPresetNameToVrm0xPresetName: Readonly<Record<string, string>> = {
  happy: 'joy',
  sad: 'sorrow',
  relaxed: 'fun',
  aa: 'a',
  ih: 'i',
  ou: 'u',
  ee: 'e',
  oh: 'o',
  blinkLeft: 'blink_l',
  blinkRight: 'blink_r',
  lookUp: 'lookup',
  lookDown: 'lookdown',
  lookLeft: 'lookleft',
  lookRight: 'lookright',
};

/** Controls how a VRMA's hips translation is handled during retargeting. */
export type VrmaRootMotionPolicy = 'preserve' | 'ignoreHipsTranslation';

/** Optional behavior for a single VRMA assignment. */
export interface VrmaAnimationAssignmentOptions {
  /**
   * Whether translation channels that target the humanoid hips are retargeted.
   * Defaults to `preserve` for compatibility with the existing VRMA assignment API.
   */
  rootMotion?: VrmaRootMotionPolicy;
}

/** VRMA files to assign to one or more character controller semantic motion states. */
export type CharacterVrmaAnimationSet = Readonly<Partial<Record<CharacterAnimationSemantic, RnM2Vrma>>>;

/** Optional behavior for assigning a character VRMA set. */
export interface CharacterVrmaAnimationAssignmentOptions {
  /**
   * Defaults to `ignoreHipsTranslation` so the physics character controller remains
   * the sole authority for the character's world position.
   */
  rootMotion?: VrmaRootMotionPolicy;
}

/** The controller mapping and concrete tracks created from a character VRMA set. */
export interface CharacterVrmaAnimationAssignmentResult {
  mapping: CharacterAnimationMapping;
  trackNames: Readonly<Partial<Record<CharacterAnimationSemantic, readonly AnimationTrackName[]>>>;
}

export class AnimationAssigner {
  constructor(private readonly __engine: Engine) {}
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
   * This method handles humanoid retargeting and expression-weight animation.
   *
   * @param rootEntity - The root entity of the model to which animation will be assigned
   * @param vrmaModel - The VRMA model containing animation data and humanoid bone mappings
   * @param postfixToTrackName - Optional postfix to append to animation track names for identification
   * @param options - Optional root-motion behavior. Existing callers preserve hips translation by default.
   * @returns An array of animation track names that were created
   */
  assignAnimationWithVrma(
    rootEntity: ISceneGraphEntity,
    vrmaModel: RnM2Vrma,
    postfixToTrackName?: string,
    options: VrmaAnimationAssignmentOptions = {}
  ) {
    const rootVrm = rootEntity.tryToGetVrm();
    if (rootVrm == null) {
      throw new Error('VRMA animation assignment requires a VRM root entity.');
    }
    if (rootVrm._version !== '0.x' && rootVrm._version !== '1.0') {
      throw new Error(`Unsupported VRM version '${rootVrm._version}' for VRMA animation assignment.`);
    }

    const firstActiveAnimationTrackName =
      postfixToTrackName != null ? this.__getFirstActiveAnimationTrackName(rootEntity) : undefined;
    const secondActiveAnimationTrackName =
      postfixToTrackName != null ? this.__getSecondActiveAnimationTrackName(rootEntity) : undefined;
    const entityVrma = ModelConverter.convertToRhodoniteObjectSimple(this.__engine, vrmaModel);
    const rootMotion = options.rootMotion ?? 'preserve';
    const trackNames = new Set<AnimationTrackName>();
    const setRetarget = (vrma: RnM2Vrma) => {
      if (vrma.animations == null || vrma.animations.length === 0) {
        return;
      }

      rootEntity.tryToGetAnimationState() ??
        this.__engine.entityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);

      for (const animation of vrma.animations) {
        for (const sampler of animation.samplers) {
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.__engine, sampler.inputObject!);
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.__engine, sampler.outputObject!);
        }
      }

      for (const animation of vrma.animations) {
        for (const channel of animation.channels) {
          const nodeIndex = channel.target?.node;
          if (nodeIndex == null) {
            continue;
          }

          const humanBones = this.__getVrmaHumanoidBoneNameMap(vrma);
          const humanoidBoneName = humanBones?.get(nodeIndex);
          const expressionNames = this.__getVrmaExpressionNamesMap(vrma)?.get(nodeIndex);
          if (channel.target.path === 'translation' && expressionNames != null) {
            this.__setVrmaExpressionAnimation(
              rootEntity,
              animation,
              channel,
              expressionNames,
              postfixToTrackName,
              trackNames
            );
          }
          if (
            rootMotion === 'ignoreHipsTranslation' &&
            humanoidBoneName === 'hips' &&
            channel.target?.path === 'translation'
          ) {
            continue;
          }

          // find the corresponding joint entity
          // const node = gltfModel.nodes[channel.target!.node!];
          const rnEntity = this.__getCorrespondingEntityWithVrma(rootEntity, vrma, nodeIndex);
          if (rnEntity) {
            const newRnEntity = this.__engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
            const animationComponent = newRnEntity.getAnimation();

            const gltfEntity = vrma.extras.rnEntities[nodeIndex];
            if (humanoidBoneName == null) {
              continue;
            }
            gltfEntity.tryToSetUniqueName(humanoidBoneName, true);

            let retarget: IAnimationRetarget | undefined;
            if (rootVrm._version === '0.x') {
              retarget = new GlobalRetargetReverse(gltfEntity);
            } else if (rootVrm._version === '1.0') {
              retarget = new GlobalRetarget(gltfEntity);
            }
            const excludedPathNames: readonly AnimationPathName[] | undefined =
              rootMotion === 'ignoreHipsTranslation' && humanoidBoneName === 'hips' ? ['translate'] : undefined;
            const names = animationComponent._setRetarget(retarget!, postfixToTrackName, excludedPathNames);
            names.forEach(name => {
              trackNames.add(name);
            });
          }
        }
      }
    };

    try {
      this.__resetAnimationAndPose(rootEntity, postfixToTrackName);
      setRetarget(vrmaModel);
      const firstActiveAnimationTrackWasReset =
        firstActiveAnimationTrackName != null &&
        postfixToTrackName != null &&
        firstActiveAnimationTrackName.endsWith(postfixToTrackName);
      const firstActiveAnimationTrackStillExists =
        firstActiveAnimationTrackName != null &&
        this.__hasAnimationTrackName(rootEntity, firstActiveAnimationTrackName);
      const requiresFirstActiveAnimationTrackRebind =
        firstActiveAnimationTrackName != null &&
        (firstActiveAnimationTrackWasReset || !firstActiveAnimationTrackStillExists);
      const secondActiveAnimationTrackWasReset =
        secondActiveAnimationTrackName != null &&
        postfixToTrackName != null &&
        secondActiveAnimationTrackName.endsWith(postfixToTrackName);
      const secondActiveAnimationTrackStillExists =
        secondActiveAnimationTrackName != null &&
        this.__hasAnimationTrackName(rootEntity, secondActiveAnimationTrackName);
      const requiresSecondActiveAnimationTrackRebind =
        secondActiveAnimationTrackName != null &&
        (secondActiveAnimationTrackWasReset || !secondActiveAnimationTrackStillExists);
      const fallbackAnimationTrackName =
        trackNames.values().next().value ?? this.__getFirstAnimationTrackName(rootEntity);
      const expressionFirstActiveAnimationTrackName =
        firstActiveAnimationTrackName != null && firstActiveAnimationTrackStillExists
          ? firstActiveAnimationTrackName
          : fallbackAnimationTrackName;
      const replacementSecondActiveAnimationTrackName =
        secondActiveAnimationTrackName != null && secondActiveAnimationTrackStillExists
          ? secondActiveAnimationTrackName
          : fallbackAnimationTrackName;
      this.__fillMissingVrmaExpressionTracks(
        rootEntity,
        expressionFirstActiveAnimationTrackName,
        secondActiveAnimationTrackName != null ? replacementSecondActiveAnimationTrackName : undefined
      );
      const animationState = rootEntity.tryToGetAnimationState();
      if (
        requiresFirstActiveAnimationTrackRebind &&
        firstActiveAnimationTrackName != null &&
        expressionFirstActiveAnimationTrackName != null
      ) {
        animationState?.replaceFirstActiveAnimationTrack(
          firstActiveAnimationTrackName,
          expressionFirstActiveAnimationTrackName
        );
      }
      if (
        requiresSecondActiveAnimationTrackRebind &&
        secondActiveAnimationTrackName != null &&
        replacementSecondActiveAnimationTrackName != null
      ) {
        animationState?.replaceSecondActiveAnimationTrack(
          secondActiveAnimationTrackName,
          replacementSecondActiveAnimationTrackName
        );
      }
    } finally {
      this.__engine.entityRepository.deleteEntityRecursively(entityVrma.entityUID);
    }

    return Array.from(trackNames);
  }

  /**
   * Retargets the supplied semantic character motions and returns a mapping that can be
   * passed directly to {@link CharacterAnimationController}.
   *
   * Every source track receives a stable semantic suffix, so unnamed or identically named
   * animations in separate VRMA files do not collide. The suffix is scoped to the target root
   * entity so tracks from multiple characters also remain distinct. Each supplied semantic VRMA
   * must create exactly one track; omitted semantics use `CharacterAnimationController` fallback
   * behavior. The default root-motion policy keeps
   * hips translation out of the target skeleton, leaving position and collision resolution to
   * the physics character controller.
   */
  assignCharacterAnimationsWithVrma(
    rootEntity: ISceneGraphEntity,
    vrmaAnimations: CharacterVrmaAnimationSet,
    options: CharacterVrmaAnimationAssignmentOptions = {}
  ): CharacterVrmaAnimationAssignmentResult {
    const rootMotion = options.rootMotion ?? 'ignoreHipsTranslation';
    const suppliedSemantics = characterAnimationSemantics.filter(semantic => vrmaAnimations[semantic] != null);
    if (suppliedSemantics.length === 0) {
      throw new Error('Character VRMA animation assignment requires at least one semantic VRMA animation.');
    }
    this.__validateCharacterVrmaAnimationSet(rootEntity, vrmaAnimations, suppliedSemantics, rootMotion);

    const mapping: CharacterAnimationMapping = {};
    const trackNames: Partial<Record<CharacterAnimationSemantic, readonly AnimationTrackName[]>> = {};
    const assignedPostfixes: string[] = [];

    try {
      for (const semantic of suppliedSemantics) {
        const postfix = `__character_${rootEntity.entityUID}_${semantic}`;
        assignedPostfixes.push(postfix);
        const names = this.assignAnimationWithVrma(rootEntity, vrmaAnimations[semantic]!, postfix, { rootMotion });
        if (names.length !== 1) {
          throw new Error(
            `Character VRMA animation '${semantic}' must create exactly one retargeted track, but created ${names.length}.`
          );
        }
        mapping[semantic] = names;
        trackNames[semantic] = names;
      }
    } catch (error) {
      for (const postfix of assignedPostfixes) {
        this.__resetAnimationAndPose(rootEntity, postfix);
      }
      throw error;
    }

    return { mapping, trackNames };
  }

  /**
   * Resets animation tracks and restores entities to their rest pose.
   * This method recursively processes all child entities.
   *
   * @param rootEntity - The root entity to reset
   * @param postfixToTrackName - Optional postfix to identify specific animation tracks to reset
   */
  private __resetAnimationAndPose(rootEntity: ISceneGraphEntity, postfixToTrackName?: string) {
    const vrmComponent = rootEntity.tryToGetVrm();
    const animationComponent = rootEntity.tryToGetAnimation();
    if (vrmComponent != null && animationComponent != null) {
      const expressionPathPrefix = 'vrmExpression/';
      for (const [pathName, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        if (!pathName.startsWith(expressionPathPrefix)) {
          continue;
        }
        const trackNames = channel.animatedValue.getAllTrackNames();
        const firstActiveTrackName = channel.animatedValue.getFirstActiveAnimationTrackName();
        const secondActiveTrackName = channel.animatedValue.getSecondActiveAnimationTrackName();
        const removesEverySampler =
          postfixToTrackName == null ||
          (trackNames.length > 0 && trackNames.every(trackName => trackName.endsWith(postfixToTrackName)));
        const removesAnActiveSampler =
          postfixToTrackName != null &&
          (firstActiveTrackName.endsWith(postfixToTrackName) ||
            secondActiveTrackName?.endsWith(postfixToTrackName) === true);
        if (removesEverySampler || removesAnActiveSampler) {
          vrmComponent.setExpressionWeight(pathName.slice(expressionPathPrefix.length), 0);
        }
      }
    }

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
    }
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
      }
      Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}, nodeName: ${nodeName}`);
      return void 0;
    }
    if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
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
      }
      Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}, nodeName: ${nodeName}`);
      return void 0;
    }
    return void 0;
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
    const humanBones = this.__getVrmaHumanoidBoneNameMap(gltfModel);
    const humanoidBoneName = humanBones?.get(nodeIndex);
    if (humanoidBoneName == null) {
      return void 0;
    }
    const dstMapNameNodeId = rootEntity.getTagValue('humanoid_map_name_nodeId')! as Map<string, number>;
    const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName!);
    if (dstBoneNodeId != null) {
      const rnEntities = rootEntity.getTagValue('rnEntities') as ISceneGraphEntity[] | undefined;
      const rnEntity = rnEntities?.[dstBoneNodeId];
      if (rnEntity == null) {
        Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}`);
        return void 0;
      }
      // if (humanoidBoneName === 'hips') {
      //   rnEntity.parent!.scale = Vector3.fromCopy3(100, 100, 100);
      // }

      return rnEntity;
    }
    Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}`);
    return void 0;
  }

  private __getVrmaHumanoidBoneNameMap(vrmaModel: RnM2Vrma): Map<NodeId, HumanBoneNames> | undefined {
    const vrmaExtension = vrmaModel.extensions?.VRMC_vrm_animation;
    if (vrmaExtension == null) {
      return void 0;
    }

    if (vrmaExtension.humanoidBoneNameMap != null) {
      return vrmaExtension.humanoidBoneNameMap;
    }

    const humanBones = vrmaExtension.humanoid?.humanBones;
    if (humanBones == null) {
      return void 0;
    }

    const humanoidBoneNameMap = new Map<NodeId, HumanBoneNames>();
    for (const boneName in humanBones) {
      const bone = humanBones[boneName as HumanBoneNames];
      humanoidBoneNameMap.set(bone.node, boneName as HumanBoneNames);
    }
    vrmaExtension.humanoidBoneNameMap = humanoidBoneNameMap;
    return humanoidBoneNameMap;
  }

  private __getVrmaExpressionNamesMap(vrmaModel: RnM2Vrma): Map<NodeId, VrmaExpressionName[]> | undefined {
    const vrmaExtension = vrmaModel.extensions?.VRMC_vrm_animation;
    if (vrmaExtension == null) {
      return void 0;
    }

    if (vrmaExtension.expressionNamesMap == null) {
      VrmaImporter.readExpressions(vrmaModel);
    }
    return vrmaExtension.expressionNamesMap;
  }

  private __setVrmaExpressionAnimation(
    rootEntity: ISceneGraphEntity,
    animation: RnM2Animation,
    channel: RnM2AnimationChannel,
    expressionNames: readonly VrmaExpressionName[],
    postfixToTrackName: string | undefined,
    trackNames: Set<AnimationTrackName>
  ): void {
    const samplerObject = channel.samplerObject;
    const input = samplerObject?.inputObject?.extras?.typedDataArray;
    const output = samplerObject?.outputObject?.extras?.typedDataArray;
    if (samplerObject == null || input == null || output == null) {
      return;
    }

    const scalarOutput = new Float32Array(output.length / 3);
    for (let i = 0; i < scalarOutput.length; i++) {
      scalarOutput[i] = output[i * 3];
    }

    const rootVrm = rootEntity.tryToGetVrm()!;
    const trackName = `${animation.name ?? 'Untitled_Animation'}${postfixToTrackName ?? ''}`;
    let animationComponent = rootEntity.tryToGetAnimation();
    for (const { name: expressionName, isPreset } of expressionNames) {
      const targetExpressionName =
        rootVrm._version === '0.x' && isPreset && Object.hasOwn(vrmaPresetNameToVrm0xPresetName, expressionName)
          ? vrmaPresetNameToVrm0xPresetName[expressionName]
          : expressionName;
      if (rootVrm.getExpressionWeight(targetExpressionName) == null) {
        Logger.default.info(`VRMA expression '${expressionName}' is not available on the target VRM.`);
        continue;
      }

      if (animationComponent == null) {
        const animationEntity = this.__engine.entityRepository.addComponentToEntity(AnimationComponent, rootEntity);
        animationComponent = animationEntity.getAnimation();
      }
      const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
      animationSamplers.set(trackName, {
        input,
        output: scalarOutput,
        outputComponentN: 1,
        interpolationMethod: AnimationInterpolation.fromString(samplerObject.interpolation ?? 'LINEAR'),
      });
      animationComponent.setAnimation(
        `vrmExpression/${targetExpressionName}`,
        new AnimatedScalar(animationSamplers, trackName)
      );
      trackNames.add(trackName);
    }
  }

  /**
   * Adds zero-valued samplers for expression paths that are absent from some assigned VRMA tracks.
   *
   * Animation track activation is switched across every channel at once. Without a sampler for the
   * newly active track, AnimatedScalar keeps its previous sampler and the previous clip's expression
   * can remain active.
   */
  private __fillMissingVrmaExpressionTracks(
    rootEntity: ISceneGraphEntity,
    firstActiveAnimationTrackName: AnimationTrackName | undefined,
    secondActiveAnimationTrackName?: AnimationTrackName
  ): void {
    const trackTimeRanges = new Map<
      AnimationTrackName,
      {
        minStartInputTime: number;
        maxEndInputTime: number;
        interpolationMethod: AnimationSampler['interpolationMethod'];
      }
    >();
    // Humanoid animation samplers live on bone entities, so collect them recursively from the hierarchy.
    const collectSamplers = (entity: ISceneGraphEntity) => {
      const animationComponent = entity.tryToGetAnimation();
      if (animationComponent != null) {
        for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
          for (const trackName of channel.animatedValue.getAllTrackNames()) {
            const sampler = channel.animatedValue.getAnimationSampler(trackName);
            if (sampler.input.length === 0) {
              continue;
            }
            const startInputTime = sampler.input[0];
            const endInputTime = sampler.input[sampler.input.length - 1];
            const existingRange = trackTimeRanges.get(trackName);
            if (existingRange == null) {
              trackTimeRanges.set(trackName, {
                minStartInputTime: startInputTime,
                maxEndInputTime: endInputTime,
                interpolationMethod: sampler.interpolationMethod,
              });
            } else {
              existingRange.minStartInputTime = Math.min(existingRange.minStartInputTime, startInputTime);
              existingRange.maxEndInputTime = Math.max(existingRange.maxEndInputTime, endInputTime);
            }
          }
        }
      }
      for (const child of entity.children) {
        collectSamplers(child.entity);
      }
    };
    collectSamplers(rootEntity);

    const rootAnimation = rootEntity.tryToGetAnimation();
    if (rootAnimation == null) {
      return;
    }

    const animationChannels = rootAnimation.getAnimationChannelsOfTrack();
    const expressionChannels = Array.from(animationChannels).filter(([pathName]) =>
      pathName.startsWith('vrmExpression/')
    );
    const availableExpressionChannels: typeof expressionChannels = [];
    const rootVrm = rootEntity.tryToGetVrm();
    for (const [pathName, channel] of expressionChannels) {
      if (channel.animatedValue.getAllTrackNames().length === 0) {
        animationChannels.delete(pathName);
        rootVrm?.setExpressionWeight(pathName.slice('vrmExpression/'.length), 0);
      } else {
        availableExpressionChannels.push([pathName, channel]);
      }
    }
    if (trackTimeRanges.size === 0) {
      return;
    }

    const extendSamplerToEnd = (sampler: AnimationSampler, endInputTime: number) => {
      const keyFrameCount = sampler.input.length;
      if (keyFrameCount === 0 || sampler.input[keyFrameCount - 1] >= endInputTime) {
        return;
      }

      const input = new Float32Array(keyFrameCount + 1);
      input.set(sampler.input);
      input[keyFrameCount] = endInputTime;

      const isCubicSpline = sampler.interpolationMethod === AnimationInterpolation.CubicSpline;
      const keyFrameStride = sampler.outputComponentN * (isCubicSpline ? 3 : 1);
      const output = new Float32Array(sampler.output.length + keyFrameStride);
      output.set(sampler.output);
      const lastKeyFrameOffset = (keyFrameCount - 1) * keyFrameStride;
      const appendedKeyFrameOffset = keyFrameCount * keyFrameStride;
      if (isCubicSpline) {
        const lastValueOffset = lastKeyFrameOffset + sampler.outputComponentN;
        const lastOutTangentOffset = lastKeyFrameOffset + sampler.outputComponentN * 2;
        output.fill(0, lastOutTangentOffset, lastOutTangentOffset + sampler.outputComponentN);
        output.set(
          sampler.output.subarray(lastValueOffset, lastValueOffset + sampler.outputComponentN),
          appendedKeyFrameOffset + sampler.outputComponentN
        );
      } else {
        output.set(
          sampler.output.subarray(lastKeyFrameOffset, lastKeyFrameOffset + sampler.outputComponentN),
          appendedKeyFrameOffset
        );
      }

      sampler.input = input;
      sampler.output = output;
    };

    for (const [pathName, channel] of availableExpressionChannels) {
      const existingTrackNames = new Set(channel.animatedValue.getAllTrackNames());
      for (const [trackName, trackTimeRange] of trackTimeRanges) {
        if (existingTrackNames.has(trackName)) {
          extendSamplerToEnd(channel.animatedValue.getAnimationSampler(trackName), trackTimeRange.maxEndInputTime);
          continue;
        }

        const input =
          trackTimeRange.minStartInputTime === trackTimeRange.maxEndInputTime
            ? new Float32Array([trackTimeRange.minStartInputTime])
            : new Float32Array([trackTimeRange.minStartInputTime, trackTimeRange.maxEndInputTime]);
        const outputElementCount =
          trackTimeRange.interpolationMethod === AnimationInterpolation.CubicSpline ? input.length * 3 : input.length;
        const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
        animationSamplers.set(trackName, {
          input,
          output: new Float32Array(outputElementCount),
          outputComponentN: 1,
          interpolationMethod: trackTimeRange.interpolationMethod,
        });
        rootAnimation.setAnimation(pathName, new AnimatedScalar(animationSamplers, trackName));
      }

      if (
        firstActiveAnimationTrackName != null &&
        channel.animatedValue.getAllTrackNames().includes(firstActiveAnimationTrackName)
      ) {
        channel.animatedValue.setFirstActiveAnimationTrackName(firstActiveAnimationTrackName);
      }
      if (
        secondActiveAnimationTrackName != null &&
        channel.animatedValue.getAllTrackNames().includes(secondActiveAnimationTrackName)
      ) {
        channel.animatedValue.setSecondActiveAnimationTrackName(secondActiveAnimationTrackName);
      }
    }
  }

  private __getFirstActiveAnimationTrackName(rootEntity: ISceneGraphEntity): AnimationTrackName | undefined {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        return channel.animatedValue.getFirstActiveAnimationTrackName();
      }
    }

    for (const child of rootEntity.children) {
      const firstActiveAnimationTrackName = this.__getFirstActiveAnimationTrackName(child.entity);
      if (firstActiveAnimationTrackName != null) {
        return firstActiveAnimationTrackName;
      }
    }

    return undefined;
  }

  private __getSecondActiveAnimationTrackName(rootEntity: ISceneGraphEntity): AnimationTrackName | undefined {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        const secondActiveAnimationTrackName = channel.animatedValue.getSecondActiveAnimationTrackName();
        if (secondActiveAnimationTrackName != null) {
          return secondActiveAnimationTrackName;
        }
      }
    }

    for (const child of rootEntity.children) {
      const secondActiveAnimationTrackName = this.__getSecondActiveAnimationTrackName(child.entity);
      if (secondActiveAnimationTrackName != null) {
        return secondActiveAnimationTrackName;
      }
    }

    return undefined;
  }

  private __getFirstAnimationTrackName(rootEntity: ISceneGraphEntity): AnimationTrackName | undefined {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        const animationTrackName = channel.animatedValue.getAllTrackNames()[0];
        if (animationTrackName != null) {
          return animationTrackName;
        }
      }
    }

    for (const child of rootEntity.children) {
      const animationTrackName = this.__getFirstAnimationTrackName(child.entity);
      if (animationTrackName != null) {
        return animationTrackName;
      }
    }

    return undefined;
  }

  private __hasAnimationTrackName(rootEntity: ISceneGraphEntity, trackName: AnimationTrackName): boolean {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        if (channel.animatedValue.getAllTrackNames().includes(trackName)) {
          return true;
        }
      }
    }

    for (const child of rootEntity.children) {
      if (this.__hasAnimationTrackName(child.entity, trackName)) {
        return true;
      }
    }

    return false;
  }

  private __validateCharacterVrmaAnimationSet(
    rootEntity: ISceneGraphEntity,
    vrmaAnimations: CharacterVrmaAnimationSet,
    suppliedSemantics: readonly CharacterAnimationSemantic[],
    rootMotion: VrmaRootMotionPolicy
  ): void {
    const rootVrm = rootEntity.tryToGetVrm();
    if (rootVrm == null) {
      throw new Error('Character VRMA animation assignment requires a VRM root entity.');
    }
    if (rootVrm._version !== '0.x' && rootVrm._version !== '1.0') {
      throw new Error(`Unsupported VRM version '${rootVrm._version}' for character VRMA animation assignment.`);
    }

    const targetHumanoidBoneMap = rootEntity.getTagValue('humanoid_map_name_nodeId') as Map<string, number> | undefined;
    if (targetHumanoidBoneMap == null) {
      throw new Error('Character VRMA animation assignment requires humanoid bone mappings on the VRM root entity.');
    }
    const targetEntities = rootEntity.getTagValue('rnEntities') as ISceneGraphEntity[] | undefined;
    if (targetEntities == null) {
      throw new Error('Character VRMA animation assignment requires humanoid entities on the VRM root entity.');
    }

    for (const semantic of suppliedSemantics) {
      const vrmaModel = vrmaAnimations[semantic]!;
      if (vrmaModel.animations == null || vrmaModel.animations.length === 0) {
        throw new Error(`Character VRMA animation '${semantic}' does not contain any animations.`);
      }

      const humanoidBoneMap = this.__getVrmaHumanoidBoneNameMap(vrmaModel);
      if (humanoidBoneMap == null) {
        throw new Error(`Character VRMA animation '${semantic}' does not define VRMC_vrm_animation humanoid bones.`);
      }

      const hasRetargetableChannel = vrmaModel.animations.some(animation =>
        animation.channels.some(channel => {
          const nodeIndex = channel.target?.node;
          const humanoidBoneName = nodeIndex == null ? undefined : humanoidBoneMap.get(nodeIndex);
          const path = channel.target?.path;
          if (path !== 'translation' && path !== 'rotation' && path !== 'scale') {
            return false;
          }
          if (rootMotion === 'ignoreHipsTranslation' && humanoidBoneName === 'hips' && path === 'translation') {
            return false;
          }
          if (humanoidBoneName == null) {
            return false;
          }
          const targetNodeIndex = targetHumanoidBoneMap.get(humanoidBoneName);
          return targetNodeIndex != null && targetEntities[targetNodeIndex] != null;
        })
      );
      if (!hasRetargetableChannel) {
        throw new Error(
          `Character VRMA animation '${semantic}' does not target a humanoid bone available on the VRM root entity.`
        );
      }
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
  private __isHips(_rootEntity: ISceneGraphEntity, vrmModel: VRM, nodeIndex: Index) {
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
    const humanoidBoneName = srcMapNodeIdName.get(nodeIndex)!;
    if (humanoidBoneName === 'hips') {
      return true;
    }
    return false;
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

    this.__engine.entityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);

    for (const animation of gltfModel.animations) {
      for (const sampler of animation.samplers) {
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.__engine, sampler.inputObject!);
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.__engine, sampler.outputObject!);
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
          const newRnEntity = this.__engine.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
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
