// src/foundation/importer/AnimationAssigner.ts
import { AbsoluteAnimation, GlobalRetarget } from "../components/index.js";
import { AnimationComponent } from "../components/Animation/AnimationComponent.js";
import { AnimationStateRepository } from "../components/Animation/AnimationStateRepository.js";
import { AnimationStateComponent } from "../components/AnimationState/AnimationStateComponent.js";
import { GlobalRetargetReverse } from "../components/Skeletal/AnimationRetarget/GlobalRetargetReverse.js";
import { AnimationInterpolation } from "../definitions/AnimationInterpolation.js";
import { AnimatedQuaternion } from "../math/AnimatedQuaternion.js";
import { AnimatedScalar } from "../math/AnimatedScalar.js";
import { AnimatedVector3 } from "../math/AnimatedVector3.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { ModelConverter } from "./ModelConverter.js";
import { VrmaImporter } from "./VrmaImporter.js";
var characterAnimationSemantics = [
  "idle",
  "walk",
  "run",
  "jump",
  "fall",
  "landing",
  "slide"
];
var vrmaPresetNameToVrm0xPresetName = {
  happy: "joy",
  sad: "sorrow",
  relaxed: "fun",
  aa: "a",
  ih: "i",
  ou: "u",
  ee: "e",
  oh: "o",
  blinkLeft: "blink_l",
  blinkRight: "blink_r",
  lookUp: "lookup",
  lookDown: "lookdown",
  lookLeft: "lookleft",
  lookRight: "lookright"
};
var AnimationAssigner = class {
  constructor(__engine) {
    this.c = __engine;
  }
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
  assignAnimation(rootEntity, gltfModel, vrmModel, isSameSkeleton, retargetMode) {
    this.$o(rootEntity);
    this.gp(rootEntity, gltfModel, vrmModel, isSameSkeleton, retargetMode);
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
  assignAnimationWithVrma(rootEntity, vrmaModel, postfixToTrackName, options = {}) {
    var _a, _b;
    const rootVrm = rootEntity.tryToGetVrm();
    if (rootVrm == null) {
      throw new Error("VRMA animation assignment requires a VRM root entity.");
    }
    if (rootVrm._version !== "0.x" && rootVrm._version !== "1.0") {
      throw new Error(`Unsupported VRM version '${rootVrm._version}' for VRMA animation assignment.`);
    }
    const firstActiveAnimationTrackName = postfixToTrackName != null ? this.cp(rootEntity) : void 0;
    const secondActiveAnimationTrackName = postfixToTrackName != null ? this.dp(rootEntity) : void 0;
    const activeSamplerBindings = postfixToTrackName != null ? this.hp(rootEntity, postfixToTrackName) : [];
    const entityVrma = ModelConverter.convertToRhodoniteObjectSimple(this.c, vrmaModel);
    const rootMotion = (_a = options.rootMotion) != null ? _a : "preserve";
    const trackNames = /* @__PURE__ */ new Set();
    const setRetarget = (vrma) => {
      var _a2, _b2, _c, _d;
      if (vrma.animations == null || vrma.animations.length === 0) {
        return;
      }
      (_a2 = rootEntity.tryToGetAnimationState()) != null ? _a2 : this.c.entityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);
      for (const animation of vrma.animations) {
        for (const sampler of animation.samplers) {
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.c, sampler.inputObject);
          ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.c, sampler.outputObject);
        }
      }
      for (const animation of vrma.animations) {
        for (const channel of animation.channels) {
          const nodeIndex = (_b2 = channel.target) == null ? void 0 : _b2.node;
          if (nodeIndex == null) {
            continue;
          }
          const humanBones = this.ap(vrma);
          const humanoidBoneName = humanBones == null ? void 0 : humanBones.get(nodeIndex);
          const expressionNames = (_c = this.ip(vrma)) == null ? void 0 : _c.get(nodeIndex);
          if (channel.target.path === "translation" && expressionNames != null) {
            this.jp(
              rootEntity,
              animation,
              channel,
              expressionNames,
              postfixToTrackName,
              trackNames
            );
          }
          if (rootMotion === "ignoreHipsTranslation" && humanoidBoneName === "hips" && ((_d = channel.target) == null ? void 0 : _d.path) === "translation") {
            continue;
          }
          const rnEntity = this.kp(rootEntity, vrma, nodeIndex);
          if (rnEntity) {
            const newRnEntity = this.c.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
            const animationComponent = newRnEntity.getAnimation();
            const gltfEntity = vrma.extras.rnEntities[nodeIndex];
            if (humanoidBoneName == null) {
              continue;
            }
            gltfEntity.tryToSetUniqueName(humanoidBoneName, true);
            let retarget;
            if (rootVrm._version === "0.x") {
              retarget = new GlobalRetargetReverse(gltfEntity);
            } else if (rootVrm._version === "1.0") {
              retarget = new GlobalRetarget(gltfEntity);
            }
            const excludedPathNames = rootMotion === "ignoreHipsTranslation" && humanoidBoneName === "hips" ? ["translate"] : void 0;
            const names = animationComponent._setRetarget(retarget, postfixToTrackName, excludedPathNames);
            names.forEach((name) => {
              trackNames.add(name);
            });
          }
        }
      }
    };
    try {
      this.$o(rootEntity, postfixToTrackName);
      setRetarget(vrmaModel);
      const firstActiveAnimationTrackWasReset = firstActiveAnimationTrackName != null && postfixToTrackName != null && firstActiveAnimationTrackName.endsWith(postfixToTrackName);
      const firstActiveAnimationTrackStillExists = firstActiveAnimationTrackName != null && this.bp(rootEntity, firstActiveAnimationTrackName);
      const requiresFirstActiveAnimationTrackRebind = firstActiveAnimationTrackName != null && (firstActiveAnimationTrackWasReset || !firstActiveAnimationTrackStillExists);
      const secondActiveAnimationTrackWasReset = secondActiveAnimationTrackName != null && postfixToTrackName != null && secondActiveAnimationTrackName.endsWith(postfixToTrackName);
      const secondActiveAnimationTrackStillExists = secondActiveAnimationTrackName != null && this.bp(rootEntity, secondActiveAnimationTrackName);
      const requiresSecondActiveAnimationTrackRebind = secondActiveAnimationTrackName != null && (secondActiveAnimationTrackWasReset || !secondActiveAnimationTrackStillExists);
      const fallbackAnimationTrackName = (_b = trackNames.values().next().value) != null ? _b : this.ep(rootEntity);
      const expressionFirstActiveAnimationTrackName = firstActiveAnimationTrackName != null && firstActiveAnimationTrackStillExists ? firstActiveAnimationTrackName : fallbackAnimationTrackName;
      const replacementSecondActiveAnimationTrackName = secondActiveAnimationTrackName != null && secondActiveAnimationTrackStillExists ? secondActiveAnimationTrackName : fallbackAnimationTrackName;
      this.lp(
        rootEntity,
        expressionFirstActiveAnimationTrackName,
        secondActiveAnimationTrackName != null ? replacementSecondActiveAnimationTrackName : void 0
      );
      if (postfixToTrackName != null) {
        this.mp(activeSamplerBindings, trackNames, postfixToTrackName);
      }
      const animationState = rootEntity.tryToGetAnimationState();
      if (requiresFirstActiveAnimationTrackRebind && firstActiveAnimationTrackName != null && expressionFirstActiveAnimationTrackName != null) {
        animationState == null ? void 0 : animationState.replaceFirstActiveAnimationTrack(
          firstActiveAnimationTrackName,
          expressionFirstActiveAnimationTrackName
        );
      }
      if (requiresSecondActiveAnimationTrackRebind && secondActiveAnimationTrackName != null && replacementSecondActiveAnimationTrackName != null) {
        animationState == null ? void 0 : animationState.replaceSecondActiveAnimationTrack(
          secondActiveAnimationTrackName,
          replacementSecondActiveAnimationTrackName
        );
      }
    } finally {
      this.c.entityRepository.deleteEntityRecursively(entityVrma.entityUID);
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
  assignCharacterAnimationsWithVrma(rootEntity, vrmaAnimations, options = {}) {
    var _a;
    const rootMotion = (_a = options.rootMotion) != null ? _a : "ignoreHipsTranslation";
    const suppliedSemantics = characterAnimationSemantics.filter((semantic) => vrmaAnimations[semantic] != null);
    if (suppliedSemantics.length === 0) {
      throw new Error("Character VRMA animation assignment requires at least one semantic VRMA animation.");
    }
    this.np(rootEntity, vrmaAnimations, suppliedSemantics, rootMotion);
    const mapping = {};
    const trackNames = {};
    const assignedPostfixes = [];
    try {
      for (const semantic of suppliedSemantics) {
        const postfix = `__character_${rootEntity.entityUID}_${semantic}`;
        assignedPostfixes.push(postfix);
        const names = this.assignAnimationWithVrma(rootEntity, vrmaAnimations[semantic], postfix, { rootMotion });
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
        this.$o(rootEntity, postfix);
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
  $o(rootEntity, postfixToTrackName) {
    const vrmComponent = rootEntity.tryToGetVrm();
    const animationComponent = rootEntity.tryToGetAnimation();
    if (vrmComponent != null && animationComponent != null) {
      const expressionPathPrefix = "vrmExpression/";
      const blendingRatio = animationComponent.animationBlendingRatio;
      for (const [pathName, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        if (!pathName.startsWith(expressionPathPrefix)) {
          continue;
        }
        const trackNames = channel.animatedValue.getAllTrackNames();
        const firstActiveSamplerTrackName = channel.animatedValue.getFirstActiveAnimationSamplerTrackName();
        const secondActiveSamplerTrackName = channel.animatedValue.getSecondActiveAnimationSamplerTrackName();
        const hasSecondActiveSampler = secondActiveSamplerTrackName != null;
        const removesEverySampler = postfixToTrackName == null || trackNames.length > 0 && trackNames.every((trackName) => trackName.endsWith(postfixToTrackName));
        const removesAContributingSampler = postfixToTrackName != null && ((!hasSecondActiveSampler || blendingRatio !== 1) && firstActiveSamplerTrackName.endsWith(postfixToTrackName) || hasSecondActiveSampler && blendingRatio !== 0 && secondActiveSamplerTrackName.endsWith(postfixToTrackName));
        if (removesEverySampler || removesAContributingSampler) {
          vrmComponent.setExpressionWeight(pathName.slice(expressionPathPrefix.length), 0);
        }
      }
    }
    function resetAnimationAndPose(entity, postfixToTrackName2) {
      const animationComponent2 = entity.tryToGetAnimation();
      if (animationComponent2 != null) {
        if (postfixToTrackName2 != null) {
          animationComponent2.resetAnimationTrackByPostfix(postfixToTrackName2);
        } else {
          animationComponent2.resetAnimationTracks();
        }
      }
      entity.getTransform()._restoreTransformFromRest();
      for (const child of entity.children) {
        resetAnimationAndPose(child.entity, postfixToTrackName2);
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
  op(rootEntity, gltfModel, vrmModel, nodeIndex, nodeName, isSameSkeleton) {
    if (isSameSkeleton) {
      const rnEntities = rootEntity.getTagValue("rnEntitiesByNames");
      const node = gltfModel.nodes[nodeIndex];
      const rnEntity = rnEntities.get(node.name);
      return rnEntity;
    }
    if (Is.exist(vrmModel.extensions.VRM)) {
      const humanBones = vrmModel.extensions.VRM.humanoid.humanBones;
      let humanoidBoneName;
      const srcMapNodeIdName = /* @__PURE__ */ new Map();
      const srcMapNodeNameName = /* @__PURE__ */ new Map();
      for (const bone of humanBones) {
        srcMapNodeIdName.set(bone.node, bone.bone);
        srcMapNodeNameName.set(bone.name, bone.bone);
      }
      if (nodeName != null) {
        humanoidBoneName = srcMapNodeNameName.get(nodeName);
        if (humanoidBoneName == null) {
          humanoidBoneName = srcMapNodeIdName.get(nodeIndex);
        }
      }
      const dstMapNameNodeId = rootEntity.getTagValue("humanoid_map_name_nodeId");
      const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName);
      if (dstBoneNodeId != null) {
        const rnEntities = rootEntity.getTagValue("rnEntities");
        return rnEntities[dstBoneNodeId];
      }
      Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}, nodeName: ${nodeName}`);
      return void 0;
    }
    if (Is.exist(vrmModel.extensions.VRMC_vrm)) {
      const humanBones = vrmModel.extensions.VRMC_vrm.humanoid.humanBones;
      let humanoidBoneName;
      const srcMapNodeIdName = /* @__PURE__ */ new Map();
      for (const boneName in humanBones) {
        const bone = humanBones[boneName];
        srcMapNodeIdName.set(bone.node, boneName);
      }
      if (nodeName != null) {
        humanoidBoneName = srcMapNodeIdName.get(nodeIndex);
      }
      const dstMapNameNodeId = rootEntity.getTagValue("humanoid_map_name_nodeId");
      const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName);
      if (dstBoneNodeId != null) {
        const rnEntities = rootEntity.getTagValue("rnEntities");
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
  kp(rootEntity, gltfModel, nodeIndex) {
    const humanBones = this.ap(gltfModel);
    const humanoidBoneName = humanBones == null ? void 0 : humanBones.get(nodeIndex);
    if (humanoidBoneName == null) {
      return void 0;
    }
    const dstMapNameNodeId = rootEntity.getTagValue("humanoid_map_name_nodeId");
    const dstBoneNodeId = dstMapNameNodeId.get(humanoidBoneName);
    if (dstBoneNodeId != null) {
      const rnEntities = rootEntity.getTagValue("rnEntities");
      const rnEntity = rnEntities == null ? void 0 : rnEntities[dstBoneNodeId];
      if (rnEntity == null) {
        Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}`);
        return void 0;
      }
      return rnEntity;
    }
    Logger.default.info(`humanoidBoneName: ${humanoidBoneName}, nodeIndex: ${nodeIndex}`);
    return void 0;
  }
  ap(vrmaModel) {
    var _a, _b;
    const vrmaExtension = (_a = vrmaModel.extensions) == null ? void 0 : _a.VRMC_vrm_animation;
    if (vrmaExtension == null) {
      return void 0;
    }
    if (vrmaExtension.humanoidBoneNameMap != null) {
      return vrmaExtension.humanoidBoneNameMap;
    }
    const humanBones = (_b = vrmaExtension.humanoid) == null ? void 0 : _b.humanBones;
    if (humanBones == null) {
      return void 0;
    }
    const humanoidBoneNameMap = /* @__PURE__ */ new Map();
    for (const boneName in humanBones) {
      const bone = humanBones[boneName];
      humanoidBoneNameMap.set(bone.node, boneName);
    }
    vrmaExtension.humanoidBoneNameMap = humanoidBoneNameMap;
    return humanoidBoneNameMap;
  }
  ip(vrmaModel) {
    var _a;
    const vrmaExtension = (_a = vrmaModel.extensions) == null ? void 0 : _a.VRMC_vrm_animation;
    if (vrmaExtension == null) {
      return void 0;
    }
    if (vrmaExtension.expressionNamesMap == null) {
      VrmaImporter.readExpressions(vrmaModel);
    }
    return vrmaExtension.expressionNamesMap;
  }
  jp(rootEntity, animation, channel, expressionNames, postfixToTrackName, trackNames) {
    var _a, _b, _c, _d, _e, _f;
    const samplerObject = channel.samplerObject;
    const input = (_b = (_a = samplerObject == null ? void 0 : samplerObject.inputObject) == null ? void 0 : _a.extras) == null ? void 0 : _b.typedDataArray;
    const output = (_d = (_c = samplerObject == null ? void 0 : samplerObject.outputObject) == null ? void 0 : _c.extras) == null ? void 0 : _d.typedDataArray;
    if (samplerObject == null || input == null || output == null) {
      return;
    }
    const scalarOutput = new Float32Array(output.length / 3);
    for (let i = 0; i < scalarOutput.length; i++) {
      scalarOutput[i] = output[i * 3];
    }
    const rootVrm = rootEntity.tryToGetVrm();
    const trackName = `${(_e = animation.name) != null ? _e : "Untitled_Animation"}${postfixToTrackName != null ? postfixToTrackName : ""}`;
    let animationComponent = rootEntity.tryToGetAnimation();
    const playbackStateSource = animationComponent == null ? this.fp(rootEntity) : void 0;
    for (const { name: expressionName, isPreset } of expressionNames) {
      const targetExpressionName = rootVrm._version === "0.x" && isPreset && Object.hasOwn(vrmaPresetNameToVrm0xPresetName, expressionName) ? vrmaPresetNameToVrm0xPresetName[expressionName] : expressionName;
      if (rootVrm.getExpressionWeight(targetExpressionName) == null) {
        Logger.default.info(`VRMA expression '${expressionName}' is not available on the target VRM.`);
        continue;
      }
      if (animationComponent == null) {
        const animationEntity = this.c.entityRepository.addComponentToEntity(AnimationComponent, rootEntity);
        animationComponent = animationEntity.getAnimation();
        if (playbackStateSource != null) {
          animationComponent.useGlobalTime = playbackStateSource.useGlobalTime;
          animationComponent.time = playbackStateSource.time;
          animationComponent.isLoop = playbackStateSource.isLoop;
          animationComponent.setIsAnimating(playbackStateSource.isAnimating);
        }
      }
      const animationSamplers = /* @__PURE__ */ new Map();
      animationSamplers.set(trackName, {
        input,
        output: scalarOutput,
        outputComponentN: 1,
        interpolationMethod: AnimationInterpolation.fromString((_f = samplerObject.interpolation) != null ? _f : "LINEAR")
      });
      animationComponent.setAnimation(
        `vrmExpression/${targetExpressionName}`,
        new AnimatedScalar(animationSamplers, trackName)
      );
      trackNames.add(trackName);
    }
    if (animationComponent != null && playbackStateSource != null) {
      animationComponent._setAnimationBlendingRatioWithoutApplying(playbackStateSource.animationBlendingRatio);
    }
  }
  /**
   * Adds zero-valued samplers for expression paths that are absent from some assigned VRMA tracks.
   *
   * Animation track activation is switched across every channel at once. Without a sampler for the
   * newly active track, AnimatedScalar keeps its previous sampler and the previous clip's expression
   * can remain active.
   */
  lp(rootEntity, firstActiveAnimationTrackName, secondActiveAnimationTrackName) {
    var _a, _b;
    const trackTimeRanges = /* @__PURE__ */ new Map();
    const collectSamplers = (entity) => {
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
                interpolationMethod: sampler.interpolationMethod
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
    const expressionChannels = Array.from(animationChannels).filter(
      ([pathName]) => pathName.startsWith("vrmExpression/")
    );
    const availableExpressionChannels = [];
    const rootVrm = rootEntity.tryToGetVrm();
    for (const [pathName, channel] of expressionChannels) {
      if (channel.animatedValue.getAllTrackNames().length === 0) {
        animationChannels.delete(pathName);
        AnimationStateRepository.markAnimationBindingChanged();
        rootVrm == null ? void 0 : rootVrm.setExpressionWeight(pathName.slice("vrmExpression/".length), 0);
      } else {
        availableExpressionChannels.push([pathName, channel]);
      }
    }
    if (trackTimeRanges.size === 0) {
      return;
    }
    const extendSamplerToEnd = (sampler, endInputTime) => {
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
          (_b = (_a = channel.animatedValue).invalidateAnimationCache) == null ? void 0 : _b.call(_a);
          continue;
        }
        const input = trackTimeRange.minStartInputTime === trackTimeRange.maxEndInputTime ? new Float32Array([trackTimeRange.minStartInputTime]) : new Float32Array([trackTimeRange.minStartInputTime, trackTimeRange.maxEndInputTime]);
        const outputElementCount = trackTimeRange.interpolationMethod === AnimationInterpolation.CubicSpline ? input.length * 3 : input.length;
        const animationSamplers = /* @__PURE__ */ new Map();
        animationSamplers.set(trackName, {
          input,
          output: new Float32Array(outputElementCount),
          outputComponentN: 1,
          interpolationMethod: trackTimeRange.interpolationMethod
        });
        rootAnimation.setAnimation(pathName, new AnimatedScalar(animationSamplers, trackName));
      }
      if (firstActiveAnimationTrackName != null && channel.animatedValue.getAllTrackNames().includes(firstActiveAnimationTrackName)) {
        channel.animatedValue.setFirstActiveAnimationTrackName(firstActiveAnimationTrackName);
      }
      if (secondActiveAnimationTrackName != null && channel.animatedValue.getAllTrackNames().includes(secondActiveAnimationTrackName)) {
        channel.animatedValue.setSecondActiveAnimationTrackName(secondActiveAnimationTrackName);
      }
    }
  }
  hp(rootEntity, postfixToTrackName) {
    const bindings = [];
    const collectBindings = (entity) => {
      const animationComponent = entity.tryToGetAnimation();
      if (animationComponent != null) {
        for (const [pathName, channel] of animationComponent.getAnimationChannelsOfTrack()) {
          const animatedValue = channel.animatedValue;
          const firstSamplerTrackName = animatedValue.getFirstActiveAnimationSamplerTrackName();
          const secondSamplerTrackName = animatedValue.getSecondActiveAnimationSamplerTrackName();
          const first = firstSamplerTrackName.endsWith(postfixToTrackName) ? {
            requestedTrackName: animatedValue.getFirstActiveAnimationTrackName(),
            samplerTrackName: firstSamplerTrackName
          } : void 0;
          const second = (secondSamplerTrackName == null ? void 0 : secondSamplerTrackName.endsWith(postfixToTrackName)) ? {
            requestedTrackName: animatedValue.getSecondActiveAnimationTrackName(),
            samplerTrackName: secondSamplerTrackName
          } : void 0;
          if (first != null || second != null) {
            bindings.push({ animationComponent, pathName, first, second });
          }
        }
      }
      for (const child of entity.children) {
        collectBindings(child.entity);
      }
    };
    collectBindings(rootEntity);
    return bindings;
  }
  mp(bindings, assignedTrackNames, postfixToTrackName) {
    for (const binding of bindings) {
      const animatedValue = binding.animationComponent.getAnimation(binding.pathName);
      if (animatedValue == null) {
        continue;
      }
      const availableTrackNames = new Set(animatedValue.getAllTrackNames());
      const restoreBinding = (activeSamplerBinding, setActiveTrackName) => {
        var _a;
        if (activeSamplerBinding == null) {
          return;
        }
        const replacementTrackName = assignedTrackNames.has(activeSamplerBinding.samplerTrackName) && availableTrackNames.has(activeSamplerBinding.samplerTrackName) ? activeSamplerBinding.samplerTrackName : Array.from(assignedTrackNames).find(
          (trackName) => trackName.endsWith(postfixToTrackName) && availableTrackNames.has(trackName)
        );
        if (replacementTrackName != null && availableTrackNames.has(replacementTrackName)) {
          setActiveTrackName(replacementTrackName);
        }
        const preservedRequestedTrackName = ((_a = activeSamplerBinding.requestedTrackName) == null ? void 0 : _a.endsWith(postfixToTrackName)) ? void 0 : activeSamplerBinding.requestedTrackName;
        if (preservedRequestedTrackName != null && preservedRequestedTrackName !== replacementTrackName) {
          setActiveTrackName(preservedRequestedTrackName);
        }
      };
      restoreBinding(binding.first, (trackName) => animatedValue.setFirstActiveAnimationTrackName(trackName));
      restoreBinding(binding.second, (trackName) => animatedValue.setSecondActiveAnimationTrackName(trackName));
    }
  }
  cp(rootEntity) {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        return channel.animatedValue.getFirstActiveAnimationTrackName();
      }
    }
    for (const child of rootEntity.children) {
      const firstActiveAnimationTrackName = this.cp(child.entity);
      if (firstActiveAnimationTrackName != null) {
        return firstActiveAnimationTrackName;
      }
    }
    return void 0;
  }
  fp(rootEntity) {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      return animationComponent;
    }
    for (const child of rootEntity.children) {
      const childAnimationComponent = this.fp(child.entity);
      if (childAnimationComponent != null) {
        return childAnimationComponent;
      }
    }
    return void 0;
  }
  dp(rootEntity) {
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
      const secondActiveAnimationTrackName = this.dp(child.entity);
      if (secondActiveAnimationTrackName != null) {
        return secondActiveAnimationTrackName;
      }
    }
    return void 0;
  }
  ep(rootEntity) {
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
      const animationTrackName = this.ep(child.entity);
      if (animationTrackName != null) {
        return animationTrackName;
      }
    }
    return void 0;
  }
  bp(rootEntity, trackName) {
    const animationComponent = rootEntity.tryToGetAnimation();
    if (animationComponent != null) {
      for (const [, channel] of animationComponent.getAnimationChannelsOfTrack()) {
        if (channel.animatedValue.getAllTrackNames().includes(trackName)) {
          return true;
        }
      }
    }
    for (const child of rootEntity.children) {
      if (this.bp(child.entity, trackName)) {
        return true;
      }
    }
    return false;
  }
  np(rootEntity, vrmaAnimations, suppliedSemantics, rootMotion) {
    const rootVrm = rootEntity.tryToGetVrm();
    if (rootVrm == null) {
      throw new Error("Character VRMA animation assignment requires a VRM root entity.");
    }
    if (rootVrm._version !== "0.x" && rootVrm._version !== "1.0") {
      throw new Error(`Unsupported VRM version '${rootVrm._version}' for character VRMA animation assignment.`);
    }
    const targetHumanoidBoneMap = rootEntity.getTagValue("humanoid_map_name_nodeId");
    if (targetHumanoidBoneMap == null) {
      throw new Error("Character VRMA animation assignment requires humanoid bone mappings on the VRM root entity.");
    }
    const targetEntities = rootEntity.getTagValue("rnEntities");
    if (targetEntities == null) {
      throw new Error("Character VRMA animation assignment requires humanoid entities on the VRM root entity.");
    }
    for (const semantic of suppliedSemantics) {
      const vrmaModel = vrmaAnimations[semantic];
      if (vrmaModel.animations == null || vrmaModel.animations.length === 0) {
        throw new Error(`Character VRMA animation '${semantic}' does not contain any animations.`);
      }
      const humanoidBoneMap = this.ap(vrmaModel);
      if (humanoidBoneMap == null) {
        throw new Error(`Character VRMA animation '${semantic}' does not define VRMC_vrm_animation humanoid bones.`);
      }
      const hasRetargetableChannel = vrmaModel.animations.some(
        (animation) => animation.channels.some((channel) => {
          var _a, _b;
          const nodeIndex = (_a = channel.target) == null ? void 0 : _a.node;
          const humanoidBoneName = nodeIndex == null ? void 0 : humanoidBoneMap.get(nodeIndex);
          const path = (_b = channel.target) == null ? void 0 : _b.path;
          if (path !== "translation" && path !== "rotation" && path !== "scale") {
            return false;
          }
          if (rootMotion === "ignoreHipsTranslation" && humanoidBoneName === "hips" && path === "translation") {
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
  pp(_rootEntity, vrmModel, nodeIndex) {
    const srcMapNodeIdName = /* @__PURE__ */ new Map();
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
    const humanoidBoneName = srcMapNodeIdName.get(nodeIndex);
    if (humanoidBoneName === "hips") {
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
  gp(rootEntity, gltfModel, vrmModel, isSameSkeleton, retargetMode) {
    var _a, _b, _c, _d;
    if (gltfModel.animations == null || gltfModel.animations.length === 0) {
      return;
    }
    this.c.entityRepository.addComponentToEntity(AnimationStateComponent, rootEntity);
    for (const animation of gltfModel.animations) {
      for (const sampler of animation.samplers) {
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.c, sampler.inputObject);
        ModelConverter._readBinaryFromAccessorAndSetItToAccessorExtras(this.c, sampler.outputObject);
      }
    }
    for (const animation of gltfModel.animations) {
      for (const channel of animation.channels) {
        const animInputArray = (_b = (_a = channel.samplerObject) == null ? void 0 : _a.inputObject) == null ? void 0 : _b.extras.typedDataArray;
        const animOutputArray = (_d = (_c = channel.samplerObject) == null ? void 0 : _c.outputObject) == null ? void 0 : _d.extras.typedDataArray;
        const interpolation = channel.samplerObject.interpolation != null ? channel.samplerObject.interpolation : "LINEAR";
        const node = gltfModel.nodes[channel.target.node];
        const rnEntity = this.op(
          rootEntity,
          gltfModel,
          vrmModel,
          channel.target.node,
          node.name,
          isSameSkeleton
        );
        if (rnEntity) {
          const newRnEntity = this.c.entityRepository.addComponentToEntity(AnimationComponent, rnEntity);
          const animationComponent = newRnEntity.getAnimation();
          if (retargetMode === "none") {
            let animationAttributeType = "translate";
            if (channel.target.path === "translation") {
              animationAttributeType = "translate";
            } else if (channel.target.path === "rotation") {
              animationAttributeType = "quaternion";
            } else {
              animationAttributeType = channel.target.path;
            }
            if (animationAttributeType === "quaternion") {
              const animationSamplers = /* @__PURE__ */ new Map();
              const trackName = Is.exist(animation.name) ? animation.name : "Untitled";
              animationSamplers.set(trackName, {
                input: animInputArray,
                output: animOutputArray,
                outputComponentN: 4,
                // Quaternion
                interpolationMethod: AnimationInterpolation.fromString(interpolation)
              });
              const newAnimatedValue = new AnimatedQuaternion(animationSamplers, trackName);
              animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
            } else if (animationAttributeType === "translate" && this.pp(rootEntity, vrmModel, channel.target.node)) {
              const animationSamplers = /* @__PURE__ */ new Map();
              const trackName = Is.exist(animation.name) ? animation.name : "Untitled";
              animationSamplers.set(trackName, {
                input: animInputArray,
                output: animOutputArray,
                outputComponentN: 3,
                // translate
                interpolationMethod: AnimationInterpolation.fromString(interpolation)
              });
              const newAnimatedValue = new AnimatedVector3(animationSamplers, trackName);
              animationComponent.setAnimation(animationAttributeType, newAnimatedValue);
            }
          } else {
            const gltfEntity = gltfModel.extras.rnEntities[channel.target.node];
            let retarget;
            if (retargetMode === "global") {
              retarget = new GlobalRetarget(gltfEntity);
            } else if (retargetMode === "absolute") {
              retarget = new AbsoluteAnimation(gltfEntity);
            } else {
              throw new Error("unknown retarget mode");
            }
            animationComponent._setRetarget(retarget);
          }
        }
      }
    }
  }
};
export {
  AnimationAssigner
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaW1wb3J0ZXIvQW5pbWF0aW9uQXNzaWduZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQW5pbWF0aW9uUGF0aE5hbWUsIEFuaW1hdGlvblNhbXBsZXIsIEFuaW1hdGlvblRyYWNrTmFtZSwgUm5NMlZybWEgfSBmcm9tICcuLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEluZGV4IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSbk0yLCBSbk0yQW5pbWF0aW9uLCBSbk0yQW5pbWF0aW9uQ2hhbm5lbCB9IGZyb20gJy4uLy4uL3R5cGVzL1JuTTInO1xuaW1wb3J0IHR5cGUgeyBWUk0gfSBmcm9tICcuLi8uLi90eXBlcy9WUk0nO1xuaW1wb3J0IHR5cGUgeyBWcm0weCB9IGZyb20gJy4uLy4uL3R5cGVzL1ZSTTB4JztcbmltcG9ydCB0eXBlIHsgVnJtMSB9IGZyb20gJy4uLy4uL3R5cGVzL1ZSTTEnO1xuaW1wb3J0IHR5cGUgeyBIdW1hbkJvbmVOYW1lcywgTm9kZUlkLCBWcm1hRXhwcmVzc2lvbk5hbWUgfSBmcm9tICcuLi8uLi90eXBlcy9WUk1DX3ZybV9hbmltYXRpb24nO1xuaW1wb3J0IHsgQWJzb2x1dGVBbmltYXRpb24sIEdsb2JhbFJldGFyZ2V0LCB0eXBlIElBbmltYXRpb25SZXRhcmdldCB9IGZyb20gJy4uL2NvbXBvbmVudHMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50JztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvbXBvbmVudHMvQW5pbWF0aW9uL0FuaW1hdGlvblN0YXRlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBBbmltYXRpb25TdGF0ZUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQW5pbWF0aW9uU3RhdGUvQW5pbWF0aW9uU3RhdGVDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUge1xuICBDaGFyYWN0ZXJBbmltYXRpb25NYXBwaW5nLFxuICBDaGFyYWN0ZXJBbmltYXRpb25TZW1hbnRpYyxcbn0gZnJvbSAnLi4vY29tcG9uZW50cy9DaGFyYWN0ZXJDb250cm9sbGVyL0NoYXJhY3RlckFuaW1hdGlvbkNvbnRyb2xsZXInO1xuaW1wb3J0IHsgR2xvYmFsUmV0YXJnZXRSZXZlcnNlIH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9BbmltYXRpb25SZXRhcmdldC9HbG9iYWxSZXRhcmdldFJldmVyc2UnO1xuaW1wb3J0IHsgQW5pbWF0aW9uSW50ZXJwb2xhdGlvbiB9IGZyb20gJy4uL2RlZmluaXRpb25zL0FuaW1hdGlvbkludGVycG9sYXRpb24nO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEFuaW1hdGVkUXVhdGVybmlvbiB9IGZyb20gJy4uL21hdGgvQW5pbWF0ZWRRdWF0ZXJuaW9uJztcbmltcG9ydCB7IEFuaW1hdGVkU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9BbmltYXRlZFNjYWxhcic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL0FuaW1hdGVkVmVjdG9yMyc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IE1vZGVsQ29udmVydGVyIH0gZnJvbSAnLi9Nb2RlbENvbnZlcnRlcic7XG5pbXBvcnQgeyBWcm1hSW1wb3J0ZXIgfSBmcm9tICcuL1ZybWFJbXBvcnRlcic7XG5cbnR5cGUgUmV0YXJnZXRNb2RlID0gJ25vbmUnIHwgJ2dsb2JhbCcgfCAnYWJzb2x1dGUnO1xuXG5jb25zdCBjaGFyYWN0ZXJBbmltYXRpb25TZW1hbnRpY3M6IHJlYWRvbmx5IENoYXJhY3RlckFuaW1hdGlvblNlbWFudGljW10gPSBbXG4gICdpZGxlJyxcbiAgJ3dhbGsnLFxuICAncnVuJyxcbiAgJ2p1bXAnLFxuICAnZmFsbCcsXG4gICdsYW5kaW5nJyxcbiAgJ3NsaWRlJyxcbl07XG5cbmNvbnN0IHZybWFQcmVzZXROYW1lVG9Wcm0weFByZXNldE5hbWU6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIHN0cmluZz4+ID0ge1xuICBoYXBweTogJ2pveScsXG4gIHNhZDogJ3NvcnJvdycsXG4gIHJlbGF4ZWQ6ICdmdW4nLFxuICBhYTogJ2EnLFxuICBpaDogJ2knLFxuICBvdTogJ3UnLFxuICBlZTogJ2UnLFxuICBvaDogJ28nLFxuICBibGlua0xlZnQ6ICdibGlua19sJyxcbiAgYmxpbmtSaWdodDogJ2JsaW5rX3InLFxuICBsb29rVXA6ICdsb29rdXAnLFxuICBsb29rRG93bjogJ2xvb2tkb3duJyxcbiAgbG9va0xlZnQ6ICdsb29rbGVmdCcsXG4gIGxvb2tSaWdodDogJ2xvb2tyaWdodCcsXG59O1xuXG4vKiogQ29udHJvbHMgaG93IGEgVlJNQSdzIGhpcHMgdHJhbnNsYXRpb24gaXMgaGFuZGxlZCBkdXJpbmcgcmV0YXJnZXRpbmcuICovXG5leHBvcnQgdHlwZSBWcm1hUm9vdE1vdGlvblBvbGljeSA9ICdwcmVzZXJ2ZScgfCAnaWdub3JlSGlwc1RyYW5zbGF0aW9uJztcblxuLyoqIE9wdGlvbmFsIGJlaGF2aW9yIGZvciBhIHNpbmdsZSBWUk1BIGFzc2lnbm1lbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIFZybWFBbmltYXRpb25Bc3NpZ25tZW50T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRyYW5zbGF0aW9uIGNoYW5uZWxzIHRoYXQgdGFyZ2V0IHRoZSBodW1hbm9pZCBoaXBzIGFyZSByZXRhcmdldGVkLlxuICAgKiBEZWZhdWx0cyB0byBgcHJlc2VydmVgIGZvciBjb21wYXRpYmlsaXR5IHdpdGggdGhlIGV4aXN0aW5nIFZSTUEgYXNzaWdubWVudCBBUEkuXG4gICAqL1xuICByb290TW90aW9uPzogVnJtYVJvb3RNb3Rpb25Qb2xpY3k7XG59XG5cbi8qKiBWUk1BIGZpbGVzIHRvIGFzc2lnbiB0byBvbmUgb3IgbW9yZSBjaGFyYWN0ZXIgY29udHJvbGxlciBzZW1hbnRpYyBtb3Rpb24gc3RhdGVzLiAqL1xuZXhwb3J0IHR5cGUgQ2hhcmFjdGVyVnJtYUFuaW1hdGlvblNldCA9IFJlYWRvbmx5PFBhcnRpYWw8UmVjb3JkPENoYXJhY3RlckFuaW1hdGlvblNlbWFudGljLCBSbk0yVnJtYT4+PjtcblxuLyoqIE9wdGlvbmFsIGJlaGF2aW9yIGZvciBhc3NpZ25pbmcgYSBjaGFyYWN0ZXIgVlJNQSBzZXQuICovXG5leHBvcnQgaW50ZXJmYWNlIENoYXJhY3RlclZybWFBbmltYXRpb25Bc3NpZ25tZW50T3B0aW9ucyB7XG4gIC8qKlxuICAgKiBEZWZhdWx0cyB0byBgaWdub3JlSGlwc1RyYW5zbGF0aW9uYCBzbyB0aGUgcGh5c2ljcyBjaGFyYWN0ZXIgY29udHJvbGxlciByZW1haW5zXG4gICAqIHRoZSBzb2xlIGF1dGhvcml0eSBmb3IgdGhlIGNoYXJhY3RlcidzIHdvcmxkIHBvc2l0aW9uLlxuICAgKi9cbiAgcm9vdE1vdGlvbj86IFZybWFSb290TW90aW9uUG9saWN5O1xufVxuXG4vKiogVGhlIGNvbnRyb2xsZXIgbWFwcGluZyBhbmQgY29uY3JldGUgdHJhY2tzIGNyZWF0ZWQgZnJvbSBhIGNoYXJhY3RlciBWUk1BIHNldC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhcmFjdGVyVnJtYUFuaW1hdGlvbkFzc2lnbm1lbnRSZXN1bHQge1xuICBtYXBwaW5nOiBDaGFyYWN0ZXJBbmltYXRpb25NYXBwaW5nO1xuICB0cmFja05hbWVzOiBSZWFkb25seTxQYXJ0aWFsPFJlY29yZDxDaGFyYWN0ZXJBbmltYXRpb25TZW1hbnRpYywgcmVhZG9ubHkgQW5pbWF0aW9uVHJhY2tOYW1lW10+Pj47XG59XG5cbnR5cGUgQWN0aXZlU2FtcGxlckJpbmRpbmcgPSB7XG4gIHJlcXVlc3RlZFRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lIHwgdW5kZWZpbmVkO1xuICBzYW1wbGVyVHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWU7XG59O1xuXG50eXBlIEFuaW1hdGlvbkNoYW5uZWxBY3RpdmVTYW1wbGVyQmluZGluZ3MgPSB7XG4gIGFuaW1hdGlvbkNvbXBvbmVudDogQW5pbWF0aW9uQ29tcG9uZW50O1xuICBwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWU7XG4gIGZpcnN0PzogQWN0aXZlU2FtcGxlckJpbmRpbmc7XG4gIHNlY29uZD86IEFjdGl2ZVNhbXBsZXJCaW5kaW5nO1xufTtcblxuZXhwb3J0IGNsYXNzIEFuaW1hdGlvbkFzc2lnbmVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfX2VuZ2luZTogRW5naW5lKSB7fVxuICAvKipcbiAgICogQXNzaWducyBhbmltYXRpb24gZGF0YSBmcm9tIGEgZ2xURiBtb2RlbCB0byBhIHJvb3QgZW50aXR5IHdpdGggb3B0aW9uYWwgcmV0YXJnZXRpbmcuXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgYm90aCBzYW1lLXNrZWxldG9uIGFuZCBjcm9zcy1za2VsZXRvbiBhbmltYXRpb24gYXNzaWdubWVudC5cbiAgICpcbiAgICogQHBhcmFtIHJvb3RFbnRpdHkgLSBUaGUgcm9vdCBlbnRpdHkgb2YgdGhlIG1vZGVsIHRvIHdoaWNoIGFuaW1hdGlvbiB3aWxsIGJlIGFzc2lnbmVkXG4gICAqIEBwYXJhbSBnbHRmTW9kZWwgLSBUaGUgZ2xURiBtb2RlbCBjb250YWluaW5nIGFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSB2cm1Nb2RlbCAtIFRoZSBjb3JyZXNwb25kaW5nIFZSTSBtb2RlbCB0aGF0IHByb3ZpZGVzIGh1bWFub2lkIGJvbmUgbWFwcGluZ1xuICAgKiBAcGFyYW0gaXNTYW1lU2tlbGV0b24gLSBXaGV0aGVyIHRoZSBzb3VyY2UgYW5kIHRhcmdldCBza2VsZXRvbnMgYXJlIGlkZW50aWNhbFxuICAgKiBAcGFyYW0gcmV0YXJnZXRNb2RlIC0gVGhlIHJldGFyZ2V0aW5nIG1vZGU6ICdub25lJyBmb3IgZGlyZWN0IGFzc2lnbm1lbnQsICdnbG9iYWwnIGZvciBnbG9iYWwgcmV0YXJnZXRpbmcsICdhYnNvbHV0ZScgZm9yIGFic29sdXRlIGFuaW1hdGlvblxuICAgKiBAcmV0dXJucyBUaGUgcm9vdCBlbnRpdHkgd2l0aCBhc3NpZ25lZCBhbmltYXRpb25zXG4gICAqL1xuICBhc3NpZ25BbmltYXRpb24oXG4gICAgcm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHZybU1vZGVsOiBWUk0gfCBWcm0xIHwgVnJtMHgsXG4gICAgaXNTYW1lU2tlbGV0b246IGJvb2xlYW4sXG4gICAgcmV0YXJnZXRNb2RlOiBSZXRhcmdldE1vZGVcbiAgKSB7XG4gICAgdGhpcy5fX3Jlc2V0QW5pbWF0aW9uQW5kUG9zZShyb290RW50aXR5KTtcblxuICAgIHRoaXMuX19zZXR1cEFuaW1hdGlvbkZvclNhbWVTa2VsZXRvbihyb290RW50aXR5LCBnbHRmTW9kZWwsIHZybU1vZGVsIGFzIFZSTSwgaXNTYW1lU2tlbGV0b24sIHJldGFyZ2V0TW9kZSk7XG5cbiAgICByZXR1cm4gcm9vdEVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIGFuaW1hdGlvbiBkYXRhIGZyb20gYSBWUk1BIChWUk0gQW5pbWF0aW9uKSBtb2RlbCB0byBhIHJvb3QgZW50aXR5LlxuICAgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIGh1bWFub2lkIHJldGFyZ2V0aW5nIGFuZCBleHByZXNzaW9uLXdlaWdodCBhbmltYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IG9mIHRoZSBtb2RlbCB0byB3aGljaCBhbmltYXRpb24gd2lsbCBiZSBhc3NpZ25lZFxuICAgKiBAcGFyYW0gdnJtYU1vZGVsIC0gVGhlIFZSTUEgbW9kZWwgY29udGFpbmluZyBhbmltYXRpb24gZGF0YSBhbmQgaHVtYW5vaWQgYm9uZSBtYXBwaW5nc1xuICAgKiBAcGFyYW0gcG9zdGZpeFRvVHJhY2tOYW1lIC0gT3B0aW9uYWwgcG9zdGZpeCB0byBhcHBlbmQgdG8gYW5pbWF0aW9uIHRyYWNrIG5hbWVzIGZvciBpZGVudGlmaWNhdGlvblxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbmFsIHJvb3QtbW90aW9uIGJlaGF2aW9yLiBFeGlzdGluZyBjYWxsZXJzIHByZXNlcnZlIGhpcHMgdHJhbnNsYXRpb24gYnkgZGVmYXVsdC5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgYW5pbWF0aW9uIHRyYWNrIG5hbWVzIHRoYXQgd2VyZSBjcmVhdGVkXG4gICAqL1xuICBhc3NpZ25BbmltYXRpb25XaXRoVnJtYShcbiAgICByb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICB2cm1hTW9kZWw6IFJuTTJWcm1hLFxuICAgIHBvc3RmaXhUb1RyYWNrTmFtZT86IHN0cmluZyxcbiAgICBvcHRpb25zOiBWcm1hQW5pbWF0aW9uQXNzaWdubWVudE9wdGlvbnMgPSB7fVxuICApIHtcbiAgICBjb25zdCByb290VnJtID0gcm9vdEVudGl0eS50cnlUb0dldFZybSgpO1xuICAgIGlmIChyb290VnJtID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlJNQSBhbmltYXRpb24gYXNzaWdubWVudCByZXF1aXJlcyBhIFZSTSByb290IGVudGl0eS4nKTtcbiAgICB9XG4gICAgaWYgKHJvb3RWcm0uX3ZlcnNpb24gIT09ICcwLngnICYmIHJvb3RWcm0uX3ZlcnNpb24gIT09ICcxLjAnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIFZSTSB2ZXJzaW9uICcke3Jvb3RWcm0uX3ZlcnNpb259JyBmb3IgVlJNQSBhbmltYXRpb24gYXNzaWdubWVudC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSA9XG4gICAgICBwb3N0Zml4VG9UcmFja05hbWUgIT0gbnVsbCA/IHRoaXMuX19nZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZShyb290RW50aXR5KSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgPVxuICAgICAgcG9zdGZpeFRvVHJhY2tOYW1lICE9IG51bGwgPyB0aGlzLl9fZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKHJvb3RFbnRpdHkpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFjdGl2ZVNhbXBsZXJCaW5kaW5ncyA9XG4gICAgICBwb3N0Zml4VG9UcmFja05hbWUgIT0gbnVsbCA/IHRoaXMuX19jYXB0dXJlQWN0aXZlU2FtcGxlckJpbmRpbmdzQnlQb3N0Zml4KHJvb3RFbnRpdHksIHBvc3RmaXhUb1RyYWNrTmFtZSkgOiBbXTtcbiAgICBjb25zdCBlbnRpdHlWcm1hID0gTW9kZWxDb252ZXJ0ZXIuY29udmVydFRvUmhvZG9uaXRlT2JqZWN0U2ltcGxlKHRoaXMuX19lbmdpbmUsIHZybWFNb2RlbCk7XG4gICAgY29uc3Qgcm9vdE1vdGlvbiA9IG9wdGlvbnMucm9vdE1vdGlvbiA/PyAncHJlc2VydmUnO1xuICAgIGNvbnN0IHRyYWNrTmFtZXMgPSBuZXcgU2V0PEFuaW1hdGlvblRyYWNrTmFtZT4oKTtcbiAgICBjb25zdCBzZXRSZXRhcmdldCA9ICh2cm1hOiBSbk0yVnJtYSkgPT4ge1xuICAgICAgaWYgKHZybWEuYW5pbWF0aW9ucyA9PSBudWxsIHx8IHZybWEuYW5pbWF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByb290RW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uU3RhdGUoKSA/P1xuICAgICAgICB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uU3RhdGVDb21wb25lbnQsIHJvb3RFbnRpdHkpO1xuXG4gICAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiB2cm1hLmFuaW1hdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBzYW1wbGVyIG9mIGFuaW1hdGlvbi5zYW1wbGVycykge1xuICAgICAgICAgIE1vZGVsQ29udmVydGVyLl9yZWFkQmluYXJ5RnJvbUFjY2Vzc29yQW5kU2V0SXRUb0FjY2Vzc29yRXh0cmFzKHRoaXMuX19lbmdpbmUsIHNhbXBsZXIuaW5wdXRPYmplY3QhKTtcbiAgICAgICAgICBNb2RlbENvbnZlcnRlci5fcmVhZEJpbmFyeUZyb21BY2Nlc3NvckFuZFNldEl0VG9BY2Nlc3NvckV4dHJhcyh0aGlzLl9fZW5naW5lLCBzYW1wbGVyLm91dHB1dE9iamVjdCEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgYW5pbWF0aW9uIG9mIHZybWEuYW5pbWF0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGNoYW5uZWwgb2YgYW5pbWF0aW9uLmNoYW5uZWxzKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gY2hhbm5lbC50YXJnZXQ/Lm5vZGU7XG4gICAgICAgICAgaWYgKG5vZGVJbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBodW1hbkJvbmVzID0gdGhpcy5fX2dldFZybWFIdW1hbm9pZEJvbmVOYW1lTWFwKHZybWEpO1xuICAgICAgICAgIGNvbnN0IGh1bWFub2lkQm9uZU5hbWUgPSBodW1hbkJvbmVzPy5nZXQobm9kZUluZGV4KTtcbiAgICAgICAgICBjb25zdCBleHByZXNzaW9uTmFtZXMgPSB0aGlzLl9fZ2V0VnJtYUV4cHJlc3Npb25OYW1lc01hcCh2cm1hKT8uZ2V0KG5vZGVJbmRleCk7XG4gICAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGggPT09ICd0cmFuc2xhdGlvbicgJiYgZXhwcmVzc2lvbk5hbWVzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX19zZXRWcm1hRXhwcmVzc2lvbkFuaW1hdGlvbihcbiAgICAgICAgICAgICAgcm9vdEVudGl0eSxcbiAgICAgICAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICAgICAgICBjaGFubmVsLFxuICAgICAgICAgICAgICBleHByZXNzaW9uTmFtZXMsXG4gICAgICAgICAgICAgIHBvc3RmaXhUb1RyYWNrTmFtZSxcbiAgICAgICAgICAgICAgdHJhY2tOYW1lc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgcm9vdE1vdGlvbiA9PT0gJ2lnbm9yZUhpcHNUcmFuc2xhdGlvbicgJiZcbiAgICAgICAgICAgIGh1bWFub2lkQm9uZU5hbWUgPT09ICdoaXBzJyAmJlxuICAgICAgICAgICAgY2hhbm5lbC50YXJnZXQ/LnBhdGggPT09ICd0cmFuc2xhdGlvbidcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGZpbmQgdGhlIGNvcnJlc3BvbmRpbmcgam9pbnQgZW50aXR5XG4gICAgICAgICAgLy8gY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tjaGFubmVsLnRhcmdldCEubm9kZSFdO1xuICAgICAgICAgIGNvbnN0IHJuRW50aXR5ID0gdGhpcy5fX2dldENvcnJlc3BvbmRpbmdFbnRpdHlXaXRoVnJtYShyb290RW50aXR5LCB2cm1hLCBub2RlSW5kZXgpO1xuICAgICAgICAgIGlmIChybkVudGl0eSkge1xuICAgICAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgICAgICBjb25zdCBhbmltYXRpb25Db21wb25lbnQgPSBuZXdSbkVudGl0eS5nZXRBbmltYXRpb24oKTtcblxuICAgICAgICAgICAgY29uc3QgZ2x0ZkVudGl0eSA9IHZybWEuZXh0cmFzLnJuRW50aXRpZXNbbm9kZUluZGV4XTtcbiAgICAgICAgICAgIGlmIChodW1hbm9pZEJvbmVOYW1lID09IG51bGwpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnbHRmRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZShodW1hbm9pZEJvbmVOYW1lLCB0cnVlKTtcblxuICAgICAgICAgICAgbGV0IHJldGFyZ2V0OiBJQW5pbWF0aW9uUmV0YXJnZXQgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAocm9vdFZybS5fdmVyc2lvbiA9PT0gJzAueCcpIHtcbiAgICAgICAgICAgICAgcmV0YXJnZXQgPSBuZXcgR2xvYmFsUmV0YXJnZXRSZXZlcnNlKGdsdGZFbnRpdHkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyb290VnJtLl92ZXJzaW9uID09PSAnMS4wJykge1xuICAgICAgICAgICAgICByZXRhcmdldCA9IG5ldyBHbG9iYWxSZXRhcmdldChnbHRmRW50aXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGV4Y2x1ZGVkUGF0aE5hbWVzOiByZWFkb25seSBBbmltYXRpb25QYXRoTmFtZVtdIHwgdW5kZWZpbmVkID1cbiAgICAgICAgICAgICAgcm9vdE1vdGlvbiA9PT0gJ2lnbm9yZUhpcHNUcmFuc2xhdGlvbicgJiYgaHVtYW5vaWRCb25lTmFtZSA9PT0gJ2hpcHMnID8gWyd0cmFuc2xhdGUnXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNvbnN0IG5hbWVzID0gYW5pbWF0aW9uQ29tcG9uZW50Ll9zZXRSZXRhcmdldChyZXRhcmdldCEsIHBvc3RmaXhUb1RyYWNrTmFtZSwgZXhjbHVkZWRQYXRoTmFtZXMpO1xuICAgICAgICAgICAgbmFtZXMuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgICAgICAgdHJhY2tOYW1lcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX19yZXNldEFuaW1hdGlvbkFuZFBvc2Uocm9vdEVudGl0eSwgcG9zdGZpeFRvVHJhY2tOYW1lKTtcbiAgICAgIHNldFJldGFyZ2V0KHZybWFNb2RlbCk7XG4gICAgICBjb25zdCBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrV2FzUmVzZXQgPVxuICAgICAgICBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHBvc3RmaXhUb1RyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIGZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lLmVuZHNXaXRoKHBvc3RmaXhUb1RyYWNrTmFtZSk7XG4gICAgICBjb25zdCBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrU3RpbGxFeGlzdHMgPVxuICAgICAgICBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHRoaXMuX19oYXNBbmltYXRpb25UcmFja05hbWUocm9vdEVudGl0eSwgZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUpO1xuICAgICAgY29uc3QgcmVxdWlyZXNGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrUmViaW5kID1cbiAgICAgICAgZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCAmJlxuICAgICAgICAoZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja1dhc1Jlc2V0IHx8ICFmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrU3RpbGxFeGlzdHMpO1xuICAgICAgY29uc3Qgc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tXYXNSZXNldCA9XG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHBvc3RmaXhUb1RyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZS5lbmRzV2l0aChwb3N0Zml4VG9UcmFja05hbWUpO1xuICAgICAgY29uc3Qgc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tTdGlsbEV4aXN0cyA9XG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHRoaXMuX19oYXNBbmltYXRpb25UcmFja05hbWUocm9vdEVudGl0eSwgc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKTtcbiAgICAgIGNvbnN0IHJlcXVpcmVzU2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tSZWJpbmQgPVxuICAgICAgICBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCAmJlxuICAgICAgICAoc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tXYXNSZXNldCB8fCAhc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tTdGlsbEV4aXN0cyk7XG4gICAgICBjb25zdCBmYWxsYmFja0FuaW1hdGlvblRyYWNrTmFtZSA9XG4gICAgICAgIHRyYWNrTmFtZXMudmFsdWVzKCkubmV4dCgpLnZhbHVlID8/IHRoaXMuX19nZXRGaXJzdEFuaW1hdGlvblRyYWNrTmFtZShyb290RW50aXR5KTtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb25GaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSA9XG4gICAgICAgIGZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lICE9IG51bGwgJiYgZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja1N0aWxsRXhpc3RzXG4gICAgICAgICAgPyBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZVxuICAgICAgICAgIDogZmFsbGJhY2tBbmltYXRpb25UcmFja05hbWU7XG4gICAgICBjb25zdCByZXBsYWNlbWVudFNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSA9XG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrU3RpbGxFeGlzdHNcbiAgICAgICAgICA/IHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZVxuICAgICAgICAgIDogZmFsbGJhY2tBbmltYXRpb25UcmFja05hbWU7XG4gICAgICB0aGlzLl9fZmlsbE1pc3NpbmdWcm1hRXhwcmVzc2lvblRyYWNrcyhcbiAgICAgICAgcm9vdEVudGl0eSxcbiAgICAgICAgZXhwcmVzc2lvbkZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lLFxuICAgICAgICBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCA/IHJlcGxhY2VtZW50U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lIDogdW5kZWZpbmVkXG4gICAgICApO1xuICAgICAgaWYgKHBvc3RmaXhUb1RyYWNrTmFtZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX19yZXN0b3JlQWN0aXZlU2FtcGxlckJpbmRpbmdzKGFjdGl2ZVNhbXBsZXJCaW5kaW5ncywgdHJhY2tOYW1lcywgcG9zdGZpeFRvVHJhY2tOYW1lKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFuaW1hdGlvblN0YXRlID0gcm9vdEVudGl0eS50cnlUb0dldEFuaW1hdGlvblN0YXRlKCk7XG4gICAgICBpZiAoXG4gICAgICAgIHJlcXVpcmVzRmlyc3RBY3RpdmVBbmltYXRpb25UcmFja1JlYmluZCAmJlxuICAgICAgICBmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIGV4cHJlc3Npb25GaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsXG4gICAgICApIHtcbiAgICAgICAgYW5pbWF0aW9uU3RhdGU/LnJlcGxhY2VGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrKFxuICAgICAgICAgIGZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lLFxuICAgICAgICAgIGV4cHJlc3Npb25GaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICByZXF1aXJlc1NlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrUmViaW5kICYmXG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIHJlcGxhY2VtZW50U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lICE9IG51bGxcbiAgICAgICkge1xuICAgICAgICBhbmltYXRpb25TdGF0ZT8ucmVwbGFjZVNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrKFxuICAgICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSxcbiAgICAgICAgICByZXBsYWNlbWVudFNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuZGVsZXRlRW50aXR5UmVjdXJzaXZlbHkoZW50aXR5VnJtYS5lbnRpdHlVSUQpO1xuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKHRyYWNrTmFtZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldGFyZ2V0cyB0aGUgc3VwcGxpZWQgc2VtYW50aWMgY2hhcmFjdGVyIG1vdGlvbnMgYW5kIHJldHVybnMgYSBtYXBwaW5nIHRoYXQgY2FuIGJlXG4gICAqIHBhc3NlZCBkaXJlY3RseSB0byB7QGxpbmsgQ2hhcmFjdGVyQW5pbWF0aW9uQ29udHJvbGxlcn0uXG4gICAqXG4gICAqIEV2ZXJ5IHNvdXJjZSB0cmFjayByZWNlaXZlcyBhIHN0YWJsZSBzZW1hbnRpYyBzdWZmaXgsIHNvIHVubmFtZWQgb3IgaWRlbnRpY2FsbHkgbmFtZWRcbiAgICogYW5pbWF0aW9ucyBpbiBzZXBhcmF0ZSBWUk1BIGZpbGVzIGRvIG5vdCBjb2xsaWRlLiBUaGUgc3VmZml4IGlzIHNjb3BlZCB0byB0aGUgdGFyZ2V0IHJvb3RcbiAgICogZW50aXR5IHNvIHRyYWNrcyBmcm9tIG11bHRpcGxlIGNoYXJhY3RlcnMgYWxzbyByZW1haW4gZGlzdGluY3QuIEVhY2ggc3VwcGxpZWQgc2VtYW50aWMgVlJNQVxuICAgKiBtdXN0IGNyZWF0ZSBleGFjdGx5IG9uZSB0cmFjazsgb21pdHRlZCBzZW1hbnRpY3MgdXNlIGBDaGFyYWN0ZXJBbmltYXRpb25Db250cm9sbGVyYCBmYWxsYmFja1xuICAgKiBiZWhhdmlvci4gVGhlIGRlZmF1bHQgcm9vdC1tb3Rpb24gcG9saWN5IGtlZXBzXG4gICAqIGhpcHMgdHJhbnNsYXRpb24gb3V0IG9mIHRoZSB0YXJnZXQgc2tlbGV0b24sIGxlYXZpbmcgcG9zaXRpb24gYW5kIGNvbGxpc2lvbiByZXNvbHV0aW9uIHRvXG4gICAqIHRoZSBwaHlzaWNzIGNoYXJhY3RlciBjb250cm9sbGVyLlxuICAgKi9cbiAgYXNzaWduQ2hhcmFjdGVyQW5pbWF0aW9uc1dpdGhWcm1hKFxuICAgIHJvb3RFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LFxuICAgIHZybWFBbmltYXRpb25zOiBDaGFyYWN0ZXJWcm1hQW5pbWF0aW9uU2V0LFxuICAgIG9wdGlvbnM6IENoYXJhY3RlclZybWFBbmltYXRpb25Bc3NpZ25tZW50T3B0aW9ucyA9IHt9XG4gICk6IENoYXJhY3RlclZybWFBbmltYXRpb25Bc3NpZ25tZW50UmVzdWx0IHtcbiAgICBjb25zdCByb290TW90aW9uID0gb3B0aW9ucy5yb290TW90aW9uID8/ICdpZ25vcmVIaXBzVHJhbnNsYXRpb24nO1xuICAgIGNvbnN0IHN1cHBsaWVkU2VtYW50aWNzID0gY2hhcmFjdGVyQW5pbWF0aW9uU2VtYW50aWNzLmZpbHRlcihzZW1hbnRpYyA9PiB2cm1hQW5pbWF0aW9uc1tzZW1hbnRpY10gIT0gbnVsbCk7XG4gICAgaWYgKHN1cHBsaWVkU2VtYW50aWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgVlJNQSBhbmltYXRpb24gYXNzaWdubWVudCByZXF1aXJlcyBhdCBsZWFzdCBvbmUgc2VtYW50aWMgVlJNQSBhbmltYXRpb24uJyk7XG4gICAgfVxuICAgIHRoaXMuX192YWxpZGF0ZUNoYXJhY3RlclZybWFBbmltYXRpb25TZXQocm9vdEVudGl0eSwgdnJtYUFuaW1hdGlvbnMsIHN1cHBsaWVkU2VtYW50aWNzLCByb290TW90aW9uKTtcblxuICAgIGNvbnN0IG1hcHBpbmc6IENoYXJhY3RlckFuaW1hdGlvbk1hcHBpbmcgPSB7fTtcbiAgICBjb25zdCB0cmFja05hbWVzOiBQYXJ0aWFsPFJlY29yZDxDaGFyYWN0ZXJBbmltYXRpb25TZW1hbnRpYywgcmVhZG9ubHkgQW5pbWF0aW9uVHJhY2tOYW1lW10+PiA9IHt9O1xuICAgIGNvbnN0IGFzc2lnbmVkUG9zdGZpeGVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZvciAoY29uc3Qgc2VtYW50aWMgb2Ygc3VwcGxpZWRTZW1hbnRpY3MpIHtcbiAgICAgICAgY29uc3QgcG9zdGZpeCA9IGBfX2NoYXJhY3Rlcl8ke3Jvb3RFbnRpdHkuZW50aXR5VUlEfV8ke3NlbWFudGljfWA7XG4gICAgICAgIGFzc2lnbmVkUG9zdGZpeGVzLnB1c2gocG9zdGZpeCk7XG4gICAgICAgIGNvbnN0IG5hbWVzID0gdGhpcy5hc3NpZ25BbmltYXRpb25XaXRoVnJtYShyb290RW50aXR5LCB2cm1hQW5pbWF0aW9uc1tzZW1hbnRpY10hLCBwb3N0Zml4LCB7IHJvb3RNb3Rpb24gfSk7XG4gICAgICAgIGlmIChuYW1lcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgQ2hhcmFjdGVyIFZSTUEgYW5pbWF0aW9uICcke3NlbWFudGljfScgbXVzdCBjcmVhdGUgZXhhY3RseSBvbmUgcmV0YXJnZXRlZCB0cmFjaywgYnV0IGNyZWF0ZWQgJHtuYW1lcy5sZW5ndGh9LmBcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIG1hcHBpbmdbc2VtYW50aWNdID0gbmFtZXM7XG4gICAgICAgIHRyYWNrTmFtZXNbc2VtYW50aWNdID0gbmFtZXM7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGZvciAoY29uc3QgcG9zdGZpeCBvZiBhc3NpZ25lZFBvc3RmaXhlcykge1xuICAgICAgICB0aGlzLl9fcmVzZXRBbmltYXRpb25BbmRQb3NlKHJvb3RFbnRpdHksIHBvc3RmaXgpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgbWFwcGluZywgdHJhY2tOYW1lcyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyBhbmltYXRpb24gdHJhY2tzIGFuZCByZXN0b3JlcyBlbnRpdGllcyB0byB0aGVpciByZXN0IHBvc2UuXG4gICAqIFRoaXMgbWV0aG9kIHJlY3Vyc2l2ZWx5IHByb2Nlc3NlcyBhbGwgY2hpbGQgZW50aXRpZXMuXG4gICAqXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IHRvIHJlc2V0XG4gICAqIEBwYXJhbSBwb3N0Zml4VG9UcmFja05hbWUgLSBPcHRpb25hbCBwb3N0Zml4IHRvIGlkZW50aWZ5IHNwZWNpZmljIGFuaW1hdGlvbiB0cmFja3MgdG8gcmVzZXRcbiAgICovXG4gIHByaXZhdGUgX19yZXNldEFuaW1hdGlvbkFuZFBvc2Uocm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksIHBvc3RmaXhUb1RyYWNrTmFtZT86IHN0cmluZykge1xuICAgIGNvbnN0IHZybUNvbXBvbmVudCA9IHJvb3RFbnRpdHkudHJ5VG9HZXRWcm0oKTtcbiAgICBjb25zdCBhbmltYXRpb25Db21wb25lbnQgPSByb290RW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgaWYgKHZybUNvbXBvbmVudCAhPSBudWxsICYmIGFuaW1hdGlvbkNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICBjb25zdCBleHByZXNzaW9uUGF0aFByZWZpeCA9ICd2cm1FeHByZXNzaW9uLyc7XG4gICAgICBjb25zdCBibGVuZGluZ1JhdGlvID0gYW5pbWF0aW9uQ29tcG9uZW50LmFuaW1hdGlvbkJsZW5kaW5nUmF0aW87XG4gICAgICBmb3IgKGNvbnN0IFtwYXRoTmFtZSwgY2hhbm5lbF0gb2YgYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpKSB7XG4gICAgICAgIGlmICghcGF0aE5hbWUuc3RhcnRzV2l0aChleHByZXNzaW9uUGF0aFByZWZpeCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0cmFja05hbWVzID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKTtcbiAgICAgICAgY29uc3QgZmlyc3RBY3RpdmVTYW1wbGVyVHJhY2tOYW1lID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEZpcnN0QWN0aXZlQW5pbWF0aW9uU2FtcGxlclRyYWNrTmFtZSgpO1xuICAgICAgICBjb25zdCBzZWNvbmRBY3RpdmVTYW1wbGVyVHJhY2tOYW1lID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldFNlY29uZEFjdGl2ZUFuaW1hdGlvblNhbXBsZXJUcmFja05hbWUoKTtcbiAgICAgICAgY29uc3QgaGFzU2Vjb25kQWN0aXZlU2FtcGxlciA9IHNlY29uZEFjdGl2ZVNhbXBsZXJUcmFja05hbWUgIT0gbnVsbDtcbiAgICAgICAgY29uc3QgcmVtb3Zlc0V2ZXJ5U2FtcGxlciA9XG4gICAgICAgICAgcG9zdGZpeFRvVHJhY2tOYW1lID09IG51bGwgfHxcbiAgICAgICAgICAodHJhY2tOYW1lcy5sZW5ndGggPiAwICYmIHRyYWNrTmFtZXMuZXZlcnkodHJhY2tOYW1lID0+IHRyYWNrTmFtZS5lbmRzV2l0aChwb3N0Zml4VG9UcmFja05hbWUpKSk7XG4gICAgICAgIGNvbnN0IHJlbW92ZXNBQ29udHJpYnV0aW5nU2FtcGxlciA9XG4gICAgICAgICAgcG9zdGZpeFRvVHJhY2tOYW1lICE9IG51bGwgJiZcbiAgICAgICAgICAoKCghaGFzU2Vjb25kQWN0aXZlU2FtcGxlciB8fCBibGVuZGluZ1JhdGlvICE9PSAxKSAmJlxuICAgICAgICAgICAgZmlyc3RBY3RpdmVTYW1wbGVyVHJhY2tOYW1lLmVuZHNXaXRoKHBvc3RmaXhUb1RyYWNrTmFtZSkpIHx8XG4gICAgICAgICAgICAoaGFzU2Vjb25kQWN0aXZlU2FtcGxlciAmJlxuICAgICAgICAgICAgICBibGVuZGluZ1JhdGlvICE9PSAwICYmXG4gICAgICAgICAgICAgIHNlY29uZEFjdGl2ZVNhbXBsZXJUcmFja05hbWUuZW5kc1dpdGgocG9zdGZpeFRvVHJhY2tOYW1lKSkpO1xuICAgICAgICBpZiAocmVtb3Zlc0V2ZXJ5U2FtcGxlciB8fCByZW1vdmVzQUNvbnRyaWJ1dGluZ1NhbXBsZXIpIHtcbiAgICAgICAgICB2cm1Db21wb25lbnQuc2V0RXhwcmVzc2lvbldlaWdodChwYXRoTmFtZS5zbGljZShleHByZXNzaW9uUGF0aFByZWZpeC5sZW5ndGgpLCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0QW5pbWF0aW9uQW5kUG9zZShlbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LCBwb3N0Zml4VG9UcmFja05hbWU/OiBzdHJpbmcpIHtcbiAgICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgICAgaWYgKGFuaW1hdGlvbkNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgIGlmIChwb3N0Zml4VG9UcmFja05hbWUgIT0gbnVsbCkge1xuICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5yZXNldEFuaW1hdGlvblRyYWNrQnlQb3N0Zml4KHBvc3RmaXhUb1RyYWNrTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnJlc2V0QW5pbWF0aW9uVHJhY2tzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVudGl0eS5nZXRUcmFuc2Zvcm0oKS5fcmVzdG9yZVRyYW5zZm9ybUZyb21SZXN0KCk7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVudGl0eS5jaGlsZHJlbikge1xuICAgICAgICByZXNldEFuaW1hdGlvbkFuZFBvc2UoY2hpbGQuZW50aXR5LCBwb3N0Zml4VG9UcmFja05hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXNldEFuaW1hdGlvbkFuZFBvc2Uocm9vdEVudGl0eSwgcG9zdGZpeFRvVHJhY2tOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgY29ycmVzcG9uZGluZyBlbnRpdHkgaW4gdGhlIHRhcmdldCBza2VsZXRvbiBmb3IgYSBnaXZlbiBub2RlIGluIHRoZSBzb3VyY2UgbW9kZWwuXG4gICAqIEhhbmRsZXMgYm90aCBzYW1lLXNrZWxldG9uIG1hdGNoaW5nIChieSBuYW1lKSBhbmQgY3Jvc3Mtc2tlbGV0b24gbWF0Y2hpbmcgKGJ5IGh1bWFub2lkIGJvbmUgbWFwcGluZykuXG4gICAqXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IG9mIHRoZSB0YXJnZXQgc2tlbGV0b25cbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBzb3VyY2UgZ2xURiBtb2RlbFxuICAgKiBAcGFyYW0gdnJtTW9kZWwgLSBUaGUgVlJNIG1vZGVsIGNvbnRhaW5pbmcgaHVtYW5vaWQgYm9uZSBtYXBwaW5nc1xuICAgKiBAcGFyYW0gbm9kZUluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBzb3VyY2UgbW9kZWxcbiAgICogQHBhcmFtIG5vZGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG5vZGUgaW4gdGhlIHNvdXJjZSBtb2RlbFxuICAgKiBAcGFyYW0gaXNTYW1lU2tlbGV0b24gLSBXaGV0aGVyIHRoZSBzb3VyY2UgYW5kIHRhcmdldCBza2VsZXRvbnMgYXJlIGlkZW50aWNhbFxuICAgKiBAcmV0dXJucyBUaGUgY29ycmVzcG9uZGluZyBlbnRpdHkgaW4gdGhlIHRhcmdldCBza2VsZXRvbiwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldENvcnJlc3BvbmRpbmdFbnRpdHkoXG4gICAgcm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgZ2x0Zk1vZGVsOiBSbk0yLFxuICAgIHZybU1vZGVsOiBWUk0sXG4gICAgbm9kZUluZGV4OiBJbmRleCxcbiAgICBub2RlTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIGlzU2FtZVNrZWxldG9uOiBib29sZWFuXG4gICkge1xuICAgIGlmIChpc1NhbWVTa2VsZXRvbikge1xuICAgICAgLy8gaXNTYW1lU2tlbGV0b24gaXMgdHJ1ZSwgc28gd2UgZmluZCBqb2ludHMgZnJvbSBqb2ludHMgbmFtZS5cbiAgICAgIGNvbnN0IHJuRW50aXRpZXMgPSByb290RW50aXR5LmdldFRhZ1ZhbHVlKCdybkVudGl0aWVzQnlOYW1lcycpISBhcyBNYXA8c3RyaW5nLCBJU2NlbmVHcmFwaEVudGl0eT47XG4gICAgICBjb25zdCBub2RlID0gZ2x0Zk1vZGVsLm5vZGVzW25vZGVJbmRleF07XG4gICAgICBjb25zdCBybkVudGl0eSA9IHJuRW50aXRpZXMuZ2V0KG5vZGUubmFtZSEpO1xuICAgICAgcmV0dXJuIHJuRW50aXR5O1xuICAgIH1cbiAgICAvLyBpc1NhbWVTa2VsZXRvbiBpcyBmYWxzZSwgc28gd2UgZmluZCBqb2ludHMgZnJvbSBodW1hbm9pZCBib25lIG1hcHBpbmcgZGF0YVxuICAgIGlmIChJcy5leGlzdCh2cm1Nb2RlbC5leHRlbnNpb25zLlZSTSkpIHtcbiAgICAgIC8vIFZSTTAueFxuICAgICAgY29uc3QgaHVtYW5Cb25lcyA9IHZybU1vZGVsLmV4dGVuc2lvbnMuVlJNLmh1bWFub2lkLmh1bWFuQm9uZXM7XG4gICAgICBsZXQgaHVtYW5vaWRCb25lTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3Qgc3JjTWFwTm9kZUlkTmFtZTogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICAgIGNvbnN0IHNyY01hcE5vZGVOYW1lTmFtZTogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICAgIGZvciAoY29uc3QgYm9uZSBvZiBodW1hbkJvbmVzKSB7XG4gICAgICAgIHNyY01hcE5vZGVJZE5hbWUuc2V0KGJvbmUubm9kZSwgYm9uZS5ib25lKTtcbiAgICAgICAgc3JjTWFwTm9kZU5hbWVOYW1lLnNldChib25lLm5hbWUhLCBib25lLmJvbmUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGVOYW1lICE9IG51bGwpIHtcbiAgICAgICAgaHVtYW5vaWRCb25lTmFtZSA9IHNyY01hcE5vZGVOYW1lTmFtZS5nZXQobm9kZU5hbWUpO1xuICAgICAgICBpZiAoaHVtYW5vaWRCb25lTmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgaHVtYW5vaWRCb25lTmFtZSA9IHNyY01hcE5vZGVJZE5hbWUuZ2V0KG5vZGVJbmRleCkhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBkc3RNYXBOYW1lTm9kZUlkID0gcm9vdEVudGl0eS5nZXRUYWdWYWx1ZSgnaHVtYW5vaWRfbWFwX25hbWVfbm9kZUlkJykhIGFzIE1hcDxzdHJpbmcsIG51bWJlcj47XG4gICAgICBjb25zdCBkc3RCb25lTm9kZUlkID0gZHN0TWFwTmFtZU5vZGVJZC5nZXQoaHVtYW5vaWRCb25lTmFtZSEpO1xuICAgICAgaWYgKGRzdEJvbmVOb2RlSWQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBybkVudGl0aWVzID0gcm9vdEVudGl0eS5nZXRUYWdWYWx1ZSgncm5FbnRpdGllcycpISBhcyBJU2NlbmVHcmFwaEVudGl0eVtdO1xuICAgICAgICByZXR1cm4gcm5FbnRpdGllc1tkc3RCb25lTm9kZUlkXTtcbiAgICAgIH1cbiAgICAgIExvZ2dlci5kZWZhdWx0LmluZm8oYGh1bWFub2lkQm9uZU5hbWU6ICR7aHVtYW5vaWRCb25lTmFtZX0sIG5vZGVJbmRleDogJHtub2RlSW5kZXh9LCBub2RlTmFtZTogJHtub2RlTmFtZX1gKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIGlmIChJcy5leGlzdCh2cm1Nb2RlbC5leHRlbnNpb25zLlZSTUNfdnJtKSkge1xuICAgICAgLy8gVlJNMS4wXG4gICAgICBjb25zdCBodW1hbkJvbmVzID0gdnJtTW9kZWwuZXh0ZW5zaW9ucy5WUk1DX3ZybS5odW1hbm9pZC5odW1hbkJvbmVzO1xuICAgICAgbGV0IGh1bWFub2lkQm9uZU5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHNyY01hcE5vZGVJZE5hbWU6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGNvbnN0IGJvbmVOYW1lIGluIGh1bWFuQm9uZXMpIHtcbiAgICAgICAgY29uc3QgYm9uZSA9IGh1bWFuQm9uZXNbYm9uZU5hbWVdO1xuICAgICAgICBzcmNNYXBOb2RlSWROYW1lLnNldChib25lLm5vZGUsIGJvbmVOYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlTmFtZSAhPSBudWxsKSB7XG4gICAgICAgIGh1bWFub2lkQm9uZU5hbWUgPSBzcmNNYXBOb2RlSWROYW1lLmdldChub2RlSW5kZXgpITtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRzdE1hcE5hbWVOb2RlSWQgPSByb290RW50aXR5LmdldFRhZ1ZhbHVlKCdodW1hbm9pZF9tYXBfbmFtZV9ub2RlSWQnKSEgYXMgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgICAgIGNvbnN0IGRzdEJvbmVOb2RlSWQgPSBkc3RNYXBOYW1lTm9kZUlkLmdldChodW1hbm9pZEJvbmVOYW1lISk7XG4gICAgICBpZiAoZHN0Qm9uZU5vZGVJZCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHJuRW50aXRpZXMgPSByb290RW50aXR5LmdldFRhZ1ZhbHVlKCdybkVudGl0aWVzJykhIGFzIElTY2VuZUdyYXBoRW50aXR5W107XG4gICAgICAgIHJldHVybiBybkVudGl0aWVzW2RzdEJvbmVOb2RlSWRdO1xuICAgICAgfVxuICAgICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyhgaHVtYW5vaWRCb25lTmFtZTogJHtodW1hbm9pZEJvbmVOYW1lfSwgbm9kZUluZGV4OiAke25vZGVJbmRleH0sIG5vZGVOYW1lOiAke25vZGVOYW1lfWApO1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgY29ycmVzcG9uZGluZyBlbnRpdHkgaW4gdGhlIHRhcmdldCBza2VsZXRvbiBmb3IgYSBWUk1BIGFuaW1hdGlvbiBub2RlLlxuICAgKiBVc2VzIGh1bWFub2lkIGJvbmUgbmFtZSBtYXBwaW5nIGZyb20gdGhlIFZSTUEgbW9kZWwgdG8gbWF0Y2ggYm9uZXMuXG4gICAqXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IG9mIHRoZSB0YXJnZXQgc2tlbGV0b25cbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBWUk1BIG1vZGVsIGNvbnRhaW5pbmcgYW5pbWF0aW9uIGRhdGFcbiAgICogQHBhcmFtIG5vZGVJbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgVlJNQSBtb2RlbFxuICAgKiBAcmV0dXJucyBUaGUgY29ycmVzcG9uZGluZyBlbnRpdHkgaW4gdGhlIHRhcmdldCBza2VsZXRvbiwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldENvcnJlc3BvbmRpbmdFbnRpdHlXaXRoVnJtYShyb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgZ2x0Zk1vZGVsOiBSbk0yVnJtYSwgbm9kZUluZGV4OiBJbmRleCkge1xuICAgIC8vIFZSTTEuMFxuICAgIGNvbnN0IGh1bWFuQm9uZXMgPSB0aGlzLl9fZ2V0VnJtYUh1bWFub2lkQm9uZU5hbWVNYXAoZ2x0Zk1vZGVsKTtcbiAgICBjb25zdCBodW1hbm9pZEJvbmVOYW1lID0gaHVtYW5Cb25lcz8uZ2V0KG5vZGVJbmRleCk7XG4gICAgaWYgKGh1bWFub2lkQm9uZU5hbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgY29uc3QgZHN0TWFwTmFtZU5vZGVJZCA9IHJvb3RFbnRpdHkuZ2V0VGFnVmFsdWUoJ2h1bWFub2lkX21hcF9uYW1lX25vZGVJZCcpISBhcyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICAgIGNvbnN0IGRzdEJvbmVOb2RlSWQgPSBkc3RNYXBOYW1lTm9kZUlkLmdldChodW1hbm9pZEJvbmVOYW1lISk7XG4gICAgaWYgKGRzdEJvbmVOb2RlSWQgIT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5FbnRpdGllcyA9IHJvb3RFbnRpdHkuZ2V0VGFnVmFsdWUoJ3JuRW50aXRpZXMnKSBhcyBJU2NlbmVHcmFwaEVudGl0eVtdIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3Qgcm5FbnRpdHkgPSBybkVudGl0aWVzPy5bZHN0Qm9uZU5vZGVJZF07XG4gICAgICBpZiAocm5FbnRpdHkgPT0gbnVsbCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKGBodW1hbm9pZEJvbmVOYW1lOiAke2h1bWFub2lkQm9uZU5hbWV9LCBub2RlSW5kZXg6ICR7bm9kZUluZGV4fWApO1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgICAgLy8gaWYgKGh1bWFub2lkQm9uZU5hbWUgPT09ICdoaXBzJykge1xuICAgICAgLy8gICBybkVudGl0eS5wYXJlbnQhLnNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTMoMTAwLCAxMDAsIDEwMCk7XG4gICAgICAvLyB9XG5cbiAgICAgIHJldHVybiBybkVudGl0eTtcbiAgICB9XG4gICAgTG9nZ2VyLmRlZmF1bHQuaW5mbyhgaHVtYW5vaWRCb25lTmFtZTogJHtodW1hbm9pZEJvbmVOYW1lfSwgbm9kZUluZGV4OiAke25vZGVJbmRleH1gKTtcbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFZybWFIdW1hbm9pZEJvbmVOYW1lTWFwKHZybWFNb2RlbDogUm5NMlZybWEpOiBNYXA8Tm9kZUlkLCBIdW1hbkJvbmVOYW1lcz4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHZybWFFeHRlbnNpb24gPSB2cm1hTW9kZWwuZXh0ZW5zaW9ucz8uVlJNQ192cm1fYW5pbWF0aW9uO1xuICAgIGlmICh2cm1hRXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuXG4gICAgaWYgKHZybWFFeHRlbnNpb24uaHVtYW5vaWRCb25lTmFtZU1hcCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdnJtYUV4dGVuc2lvbi5odW1hbm9pZEJvbmVOYW1lTWFwO1xuICAgIH1cblxuICAgIGNvbnN0IGh1bWFuQm9uZXMgPSB2cm1hRXh0ZW5zaW9uLmh1bWFub2lkPy5odW1hbkJvbmVzO1xuICAgIGlmIChodW1hbkJvbmVzID09IG51bGwpIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuXG4gICAgY29uc3QgaHVtYW5vaWRCb25lTmFtZU1hcCA9IG5ldyBNYXA8Tm9kZUlkLCBIdW1hbkJvbmVOYW1lcz4oKTtcbiAgICBmb3IgKGNvbnN0IGJvbmVOYW1lIGluIGh1bWFuQm9uZXMpIHtcbiAgICAgIGNvbnN0IGJvbmUgPSBodW1hbkJvbmVzW2JvbmVOYW1lIGFzIEh1bWFuQm9uZU5hbWVzXTtcbiAgICAgIGh1bWFub2lkQm9uZU5hbWVNYXAuc2V0KGJvbmUubm9kZSwgYm9uZU5hbWUgYXMgSHVtYW5Cb25lTmFtZXMpO1xuICAgIH1cbiAgICB2cm1hRXh0ZW5zaW9uLmh1bWFub2lkQm9uZU5hbWVNYXAgPSBodW1hbm9pZEJvbmVOYW1lTWFwO1xuICAgIHJldHVybiBodW1hbm9pZEJvbmVOYW1lTWFwO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFZybWFFeHByZXNzaW9uTmFtZXNNYXAodnJtYU1vZGVsOiBSbk0yVnJtYSk6IE1hcDxOb2RlSWQsIFZybWFFeHByZXNzaW9uTmFtZVtdPiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgdnJtYUV4dGVuc2lvbiA9IHZybWFNb2RlbC5leHRlbnNpb25zPy5WUk1DX3ZybV9hbmltYXRpb247XG4gICAgaWYgKHZybWFFeHRlbnNpb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG5cbiAgICBpZiAodnJtYUV4dGVuc2lvbi5leHByZXNzaW9uTmFtZXNNYXAgPT0gbnVsbCkge1xuICAgICAgVnJtYUltcG9ydGVyLnJlYWRFeHByZXNzaW9ucyh2cm1hTW9kZWwpO1xuICAgIH1cbiAgICByZXR1cm4gdnJtYUV4dGVuc2lvbi5leHByZXNzaW9uTmFtZXNNYXA7XG4gIH1cblxuICBwcml2YXRlIF9fc2V0VnJtYUV4cHJlc3Npb25BbmltYXRpb24oXG4gICAgcm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgYW5pbWF0aW9uOiBSbk0yQW5pbWF0aW9uLFxuICAgIGNoYW5uZWw6IFJuTTJBbmltYXRpb25DaGFubmVsLFxuICAgIGV4cHJlc3Npb25OYW1lczogcmVhZG9ubHkgVnJtYUV4cHJlc3Npb25OYW1lW10sXG4gICAgcG9zdGZpeFRvVHJhY2tOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgdHJhY2tOYW1lczogU2V0PEFuaW1hdGlvblRyYWNrTmFtZT5cbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2FtcGxlck9iamVjdCA9IGNoYW5uZWwuc2FtcGxlck9iamVjdDtcbiAgICBjb25zdCBpbnB1dCA9IHNhbXBsZXJPYmplY3Q/LmlucHV0T2JqZWN0Py5leHRyYXM/LnR5cGVkRGF0YUFycmF5O1xuICAgIGNvbnN0IG91dHB1dCA9IHNhbXBsZXJPYmplY3Q/Lm91dHB1dE9iamVjdD8uZXh0cmFzPy50eXBlZERhdGFBcnJheTtcbiAgICBpZiAoc2FtcGxlck9iamVjdCA9PSBudWxsIHx8IGlucHV0ID09IG51bGwgfHwgb3V0cHV0ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY2FsYXJPdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dC5sZW5ndGggLyAzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjYWxhck91dHB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgc2NhbGFyT3V0cHV0W2ldID0gb3V0cHV0W2kgKiAzXTtcbiAgICB9XG5cbiAgICBjb25zdCByb290VnJtID0gcm9vdEVudGl0eS50cnlUb0dldFZybSgpITtcbiAgICBjb25zdCB0cmFja05hbWUgPSBgJHthbmltYXRpb24ubmFtZSA/PyAnVW50aXRsZWRfQW5pbWF0aW9uJ30ke3Bvc3RmaXhUb1RyYWNrTmFtZSA/PyAnJ31gO1xuICAgIGxldCBhbmltYXRpb25Db21wb25lbnQgPSByb290RW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgY29uc3QgcGxheWJhY2tTdGF0ZVNvdXJjZSA9XG4gICAgICBhbmltYXRpb25Db21wb25lbnQgPT0gbnVsbCA/IHRoaXMuX19maW5kQW5pbWF0aW9uQ29tcG9uZW50SW5IaWVyYXJjaHkocm9vdEVudGl0eSkgOiB1bmRlZmluZWQ7XG4gICAgZm9yIChjb25zdCB7IG5hbWU6IGV4cHJlc3Npb25OYW1lLCBpc1ByZXNldCB9IG9mIGV4cHJlc3Npb25OYW1lcykge1xuICAgICAgY29uc3QgdGFyZ2V0RXhwcmVzc2lvbk5hbWUgPVxuICAgICAgICByb290VnJtLl92ZXJzaW9uID09PSAnMC54JyAmJiBpc1ByZXNldCAmJiBPYmplY3QuaGFzT3duKHZybWFQcmVzZXROYW1lVG9Wcm0weFByZXNldE5hbWUsIGV4cHJlc3Npb25OYW1lKVxuICAgICAgICAgID8gdnJtYVByZXNldE5hbWVUb1ZybTB4UHJlc2V0TmFtZVtleHByZXNzaW9uTmFtZV1cbiAgICAgICAgICA6IGV4cHJlc3Npb25OYW1lO1xuICAgICAgaWYgKHJvb3RWcm0uZ2V0RXhwcmVzc2lvbldlaWdodCh0YXJnZXRFeHByZXNzaW9uTmFtZSkgPT0gbnVsbCkge1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5pbmZvKGBWUk1BIGV4cHJlc3Npb24gJyR7ZXhwcmVzc2lvbk5hbWV9JyBpcyBub3QgYXZhaWxhYmxlIG9uIHRoZSB0YXJnZXQgVlJNLmApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFuaW1hdGlvbkNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbkVudGl0eSA9IHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25Db21wb25lbnQsIHJvb3RFbnRpdHkpO1xuICAgICAgICBhbmltYXRpb25Db21wb25lbnQgPSBhbmltYXRpb25FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG4gICAgICAgIGlmIChwbGF5YmFja1N0YXRlU291cmNlICE9IG51bGwpIHtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQudXNlR2xvYmFsVGltZSA9IHBsYXliYWNrU3RhdGVTb3VyY2UudXNlR2xvYmFsVGltZTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQudGltZSA9IHBsYXliYWNrU3RhdGVTb3VyY2UudGltZTtcbiAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuaXNMb29wID0gcGxheWJhY2tTdGF0ZVNvdXJjZS5pc0xvb3A7XG4gICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50LnNldElzQW5pbWF0aW5nKHBsYXliYWNrU3RhdGVTb3VyY2UuaXNBbmltYXRpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwge1xuICAgICAgICBpbnB1dCxcbiAgICAgICAgb3V0cHV0OiBzY2FsYXJPdXRwdXQsXG4gICAgICAgIG91dHB1dENvbXBvbmVudE46IDEsXG4gICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhzYW1wbGVyT2JqZWN0LmludGVycG9sYXRpb24gPz8gJ0xJTkVBUicpLFxuICAgICAgfSk7XG4gICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKFxuICAgICAgICBgdnJtRXhwcmVzc2lvbi8ke3RhcmdldEV4cHJlc3Npb25OYW1lfWAsXG4gICAgICAgIG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKVxuICAgICAgKTtcbiAgICAgIHRyYWNrTmFtZXMuYWRkKHRyYWNrTmFtZSk7XG4gICAgfVxuICAgIGlmIChhbmltYXRpb25Db21wb25lbnQgIT0gbnVsbCAmJiBwbGF5YmFja1N0YXRlU291cmNlICE9IG51bGwpIHtcbiAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5fc2V0QW5pbWF0aW9uQmxlbmRpbmdSYXRpb1dpdGhvdXRBcHBseWluZyhwbGF5YmFja1N0YXRlU291cmNlLmFuaW1hdGlvbkJsZW5kaW5nUmF0aW8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHplcm8tdmFsdWVkIHNhbXBsZXJzIGZvciBleHByZXNzaW9uIHBhdGhzIHRoYXQgYXJlIGFic2VudCBmcm9tIHNvbWUgYXNzaWduZWQgVlJNQSB0cmFja3MuXG4gICAqXG4gICAqIEFuaW1hdGlvbiB0cmFjayBhY3RpdmF0aW9uIGlzIHN3aXRjaGVkIGFjcm9zcyBldmVyeSBjaGFubmVsIGF0IG9uY2UuIFdpdGhvdXQgYSBzYW1wbGVyIGZvciB0aGVcbiAgICogbmV3bHkgYWN0aXZlIHRyYWNrLCBBbmltYXRlZFNjYWxhciBrZWVwcyBpdHMgcHJldmlvdXMgc2FtcGxlciBhbmQgdGhlIHByZXZpb3VzIGNsaXAncyBleHByZXNzaW9uXG4gICAqIGNhbiByZW1haW4gYWN0aXZlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2ZpbGxNaXNzaW5nVnJtYUV4cHJlc3Npb25UcmFja3MoXG4gICAgcm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksXG4gICAgZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSB8IHVuZGVmaW5lZCxcbiAgICBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWU/OiBBbmltYXRpb25UcmFja05hbWVcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgdHJhY2tUaW1lUmFuZ2VzID0gbmV3IE1hcDxcbiAgICAgIEFuaW1hdGlvblRyYWNrTmFtZSxcbiAgICAgIHtcbiAgICAgICAgbWluU3RhcnRJbnB1dFRpbWU6IG51bWJlcjtcbiAgICAgICAgbWF4RW5kSW5wdXRUaW1lOiBudW1iZXI7XG4gICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvblNhbXBsZXJbJ2ludGVycG9sYXRpb25NZXRob2QnXTtcbiAgICAgIH1cbiAgICA+KCk7XG4gICAgLy8gSHVtYW5vaWQgYW5pbWF0aW9uIHNhbXBsZXJzIGxpdmUgb24gYm9uZSBlbnRpdGllcywgc28gY29sbGVjdCB0aGVtIHJlY3Vyc2l2ZWx5IGZyb20gdGhlIGhpZXJhcmNoeS5cbiAgICBjb25zdCBjb2xsZWN0U2FtcGxlcnMgPSAoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkgPT4ge1xuICAgICAgY29uc3QgYW5pbWF0aW9uQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChjb25zdCBbLCBjaGFubmVsXSBvZiBhbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uQ2hhbm5lbHNPZlRyYWNrKCkpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKSB7XG4gICAgICAgICAgICBjb25zdCBzYW1wbGVyID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKTtcbiAgICAgICAgICAgIGlmIChzYW1wbGVyLmlucHV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0SW5wdXRUaW1lID0gc2FtcGxlci5pbnB1dFswXTtcbiAgICAgICAgICAgIGNvbnN0IGVuZElucHV0VGltZSA9IHNhbXBsZXIuaW5wdXRbc2FtcGxlci5pbnB1dC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nUmFuZ2UgPSB0cmFja1RpbWVSYW5nZXMuZ2V0KHRyYWNrTmFtZSk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdSYW5nZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRyYWNrVGltZVJhbmdlcy5zZXQodHJhY2tOYW1lLCB7XG4gICAgICAgICAgICAgICAgbWluU3RhcnRJbnB1dFRpbWU6IHN0YXJ0SW5wdXRUaW1lLFxuICAgICAgICAgICAgICAgIG1heEVuZElucHV0VGltZTogZW5kSW5wdXRUaW1lLFxuICAgICAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IHNhbXBsZXIuaW50ZXJwb2xhdGlvbk1ldGhvZCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBleGlzdGluZ1JhbmdlLm1pblN0YXJ0SW5wdXRUaW1lID0gTWF0aC5taW4oZXhpc3RpbmdSYW5nZS5taW5TdGFydElucHV0VGltZSwgc3RhcnRJbnB1dFRpbWUpO1xuICAgICAgICAgICAgICBleGlzdGluZ1JhbmdlLm1heEVuZElucHV0VGltZSA9IE1hdGgubWF4KGV4aXN0aW5nUmFuZ2UubWF4RW5kSW5wdXRUaW1lLCBlbmRJbnB1dFRpbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBlbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgY29sbGVjdFNhbXBsZXJzKGNoaWxkLmVudGl0eSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb2xsZWN0U2FtcGxlcnMocm9vdEVudGl0eSk7XG5cbiAgICBjb25zdCByb290QW5pbWF0aW9uID0gcm9vdEVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgIGlmIChyb290QW5pbWF0aW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRpb25DaGFubmVscyA9IHJvb3RBbmltYXRpb24uZ2V0QW5pbWF0aW9uQ2hhbm5lbHNPZlRyYWNrKCk7XG4gICAgY29uc3QgZXhwcmVzc2lvbkNoYW5uZWxzID0gQXJyYXkuZnJvbShhbmltYXRpb25DaGFubmVscykuZmlsdGVyKChbcGF0aE5hbWVdKSA9PlxuICAgICAgcGF0aE5hbWUuc3RhcnRzV2l0aCgndnJtRXhwcmVzc2lvbi8nKVxuICAgICk7XG4gICAgY29uc3QgYXZhaWxhYmxlRXhwcmVzc2lvbkNoYW5uZWxzOiB0eXBlb2YgZXhwcmVzc2lvbkNoYW5uZWxzID0gW107XG4gICAgY29uc3Qgcm9vdFZybSA9IHJvb3RFbnRpdHkudHJ5VG9HZXRWcm0oKTtcbiAgICBmb3IgKGNvbnN0IFtwYXRoTmFtZSwgY2hhbm5lbF0gb2YgZXhwcmVzc2lvbkNoYW5uZWxzKSB7XG4gICAgICBpZiAoY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYW5pbWF0aW9uQ2hhbm5lbHMuZGVsZXRlKHBhdGhOYW1lKTtcbiAgICAgICAgQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5Lm1hcmtBbmltYXRpb25CaW5kaW5nQ2hhbmdlZCgpO1xuICAgICAgICByb290VnJtPy5zZXRFeHByZXNzaW9uV2VpZ2h0KHBhdGhOYW1lLnNsaWNlKCd2cm1FeHByZXNzaW9uLycubGVuZ3RoKSwgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdmFpbGFibGVFeHByZXNzaW9uQ2hhbm5lbHMucHVzaChbcGF0aE5hbWUsIGNoYW5uZWxdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRyYWNrVGltZVJhbmdlcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXh0ZW5kU2FtcGxlclRvRW5kID0gKHNhbXBsZXI6IEFuaW1hdGlvblNhbXBsZXIsIGVuZElucHV0VGltZTogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBrZXlGcmFtZUNvdW50ID0gc2FtcGxlci5pbnB1dC5sZW5ndGg7XG4gICAgICBpZiAoa2V5RnJhbWVDb3VudCA9PT0gMCB8fCBzYW1wbGVyLmlucHV0W2tleUZyYW1lQ291bnQgLSAxXSA+PSBlbmRJbnB1dFRpbWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoa2V5RnJhbWVDb3VudCArIDEpO1xuICAgICAgaW5wdXQuc2V0KHNhbXBsZXIuaW5wdXQpO1xuICAgICAgaW5wdXRba2V5RnJhbWVDb3VudF0gPSBlbmRJbnB1dFRpbWU7XG5cbiAgICAgIGNvbnN0IGlzQ3ViaWNTcGxpbmUgPSBzYW1wbGVyLmludGVycG9sYXRpb25NZXRob2QgPT09IEFuaW1hdGlvbkludGVycG9sYXRpb24uQ3ViaWNTcGxpbmU7XG4gICAgICBjb25zdCBrZXlGcmFtZVN0cmlkZSA9IHNhbXBsZXIub3V0cHV0Q29tcG9uZW50TiAqIChpc0N1YmljU3BsaW5lID8gMyA6IDEpO1xuICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShzYW1wbGVyLm91dHB1dC5sZW5ndGggKyBrZXlGcmFtZVN0cmlkZSk7XG4gICAgICBvdXRwdXQuc2V0KHNhbXBsZXIub3V0cHV0KTtcbiAgICAgIGNvbnN0IGxhc3RLZXlGcmFtZU9mZnNldCA9IChrZXlGcmFtZUNvdW50IC0gMSkgKiBrZXlGcmFtZVN0cmlkZTtcbiAgICAgIGNvbnN0IGFwcGVuZGVkS2V5RnJhbWVPZmZzZXQgPSBrZXlGcmFtZUNvdW50ICoga2V5RnJhbWVTdHJpZGU7XG4gICAgICBpZiAoaXNDdWJpY1NwbGluZSkge1xuICAgICAgICBjb25zdCBsYXN0VmFsdWVPZmZzZXQgPSBsYXN0S2V5RnJhbWVPZmZzZXQgKyBzYW1wbGVyLm91dHB1dENvbXBvbmVudE47XG4gICAgICAgIGNvbnN0IGxhc3RPdXRUYW5nZW50T2Zmc2V0ID0gbGFzdEtleUZyYW1lT2Zmc2V0ICsgc2FtcGxlci5vdXRwdXRDb21wb25lbnROICogMjtcbiAgICAgICAgb3V0cHV0LmZpbGwoMCwgbGFzdE91dFRhbmdlbnRPZmZzZXQsIGxhc3RPdXRUYW5nZW50T2Zmc2V0ICsgc2FtcGxlci5vdXRwdXRDb21wb25lbnROKTtcbiAgICAgICAgb3V0cHV0LnNldChcbiAgICAgICAgICBzYW1wbGVyLm91dHB1dC5zdWJhcnJheShsYXN0VmFsdWVPZmZzZXQsIGxhc3RWYWx1ZU9mZnNldCArIHNhbXBsZXIub3V0cHV0Q29tcG9uZW50TiksXG4gICAgICAgICAgYXBwZW5kZWRLZXlGcmFtZU9mZnNldCArIHNhbXBsZXIub3V0cHV0Q29tcG9uZW50TlxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnNldChcbiAgICAgICAgICBzYW1wbGVyLm91dHB1dC5zdWJhcnJheShsYXN0S2V5RnJhbWVPZmZzZXQsIGxhc3RLZXlGcmFtZU9mZnNldCArIHNhbXBsZXIub3V0cHV0Q29tcG9uZW50TiksXG4gICAgICAgICAgYXBwZW5kZWRLZXlGcmFtZU9mZnNldFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzYW1wbGVyLmlucHV0ID0gaW5wdXQ7XG4gICAgICBzYW1wbGVyLm91dHB1dCA9IG91dHB1dDtcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIGF2YWlsYWJsZUV4cHJlc3Npb25DaGFubmVscykge1xuICAgICAgY29uc3QgZXhpc3RpbmdUcmFja05hbWVzID0gbmV3IFNldChjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKTtcbiAgICAgIGZvciAoY29uc3QgW3RyYWNrTmFtZSwgdHJhY2tUaW1lUmFuZ2VdIG9mIHRyYWNrVGltZVJhbmdlcykge1xuICAgICAgICBpZiAoZXhpc3RpbmdUcmFja05hbWVzLmhhcyh0cmFja05hbWUpKSB7XG4gICAgICAgICAgZXh0ZW5kU2FtcGxlclRvRW5kKGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSksIHRyYWNrVGltZVJhbmdlLm1heEVuZElucHV0VGltZSk7XG4gICAgICAgICAgLy8gVGhlIHNhbXBsZXIgaW5wdXQvb3V0cHV0IGFycmF5cyB3ZXJlIHJlcGxhY2VkOyBkcm9wIGFueSBtZW1vaXplZCBpbnRlcnBvbGF0aW9uIHJlc3VsdC5cbiAgICAgICAgICBjaGFubmVsLmFuaW1hdGVkVmFsdWUuaW52YWxpZGF0ZUFuaW1hdGlvbkNhY2hlPy4oKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlucHV0ID1cbiAgICAgICAgICB0cmFja1RpbWVSYW5nZS5taW5TdGFydElucHV0VGltZSA9PT0gdHJhY2tUaW1lUmFuZ2UubWF4RW5kSW5wdXRUaW1lXG4gICAgICAgICAgICA/IG5ldyBGbG9hdDMyQXJyYXkoW3RyYWNrVGltZVJhbmdlLm1pblN0YXJ0SW5wdXRUaW1lXSlcbiAgICAgICAgICAgIDogbmV3IEZsb2F0MzJBcnJheShbdHJhY2tUaW1lUmFuZ2UubWluU3RhcnRJbnB1dFRpbWUsIHRyYWNrVGltZVJhbmdlLm1heEVuZElucHV0VGltZV0pO1xuICAgICAgICBjb25zdCBvdXRwdXRFbGVtZW50Q291bnQgPVxuICAgICAgICAgIHRyYWNrVGltZVJhbmdlLmludGVycG9sYXRpb25NZXRob2QgPT09IEFuaW1hdGlvbkludGVycG9sYXRpb24uQ3ViaWNTcGxpbmUgPyBpbnB1dC5sZW5ndGggKiAzIDogaW5wdXQubGVuZ3RoO1xuICAgICAgICBjb25zdCBhbmltYXRpb25TYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICBhbmltYXRpb25TYW1wbGVycy5zZXQodHJhY2tOYW1lLCB7XG4gICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgb3V0cHV0OiBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEVsZW1lbnRDb3VudCksXG4gICAgICAgICAgb3V0cHV0Q29tcG9uZW50TjogMSxcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiB0cmFja1RpbWVSYW5nZS5pbnRlcnBvbGF0aW9uTWV0aG9kLFxuICAgICAgICB9KTtcbiAgICAgICAgcm9vdEFuaW1hdGlvbi5zZXRBbmltYXRpb24ocGF0aE5hbWUsIG5ldyBBbmltYXRlZFNjYWxhcihhbmltYXRpb25TYW1wbGVycywgdHJhY2tOYW1lKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCAmJlxuICAgICAgICBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpLmluY2x1ZGVzKGZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKVxuICAgICAgKSB7XG4gICAgICAgIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5zZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZShmaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsICYmXG4gICAgICAgIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkuaW5jbHVkZXMoc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKVxuICAgICAgKSB7XG4gICAgICAgIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5zZXRTZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUoc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fY2FwdHVyZUFjdGl2ZVNhbXBsZXJCaW5kaW5nc0J5UG9zdGZpeChcbiAgICByb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICBwb3N0Zml4VG9UcmFja05hbWU6IHN0cmluZ1xuICApOiBBbmltYXRpb25DaGFubmVsQWN0aXZlU2FtcGxlckJpbmRpbmdzW10ge1xuICAgIGNvbnN0IGJpbmRpbmdzOiBBbmltYXRpb25DaGFubmVsQWN0aXZlU2FtcGxlckJpbmRpbmdzW10gPSBbXTtcbiAgICBjb25zdCBjb2xsZWN0QmluZGluZ3MgPSAoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkgPT4ge1xuICAgICAgY29uc3QgYW5pbWF0aW9uQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIGFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25DaGFubmVsc09mVHJhY2soKSkge1xuICAgICAgICAgIGNvbnN0IGFuaW1hdGVkVmFsdWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWU7XG4gICAgICAgICAgY29uc3QgZmlyc3RTYW1wbGVyVHJhY2tOYW1lID0gYW5pbWF0ZWRWYWx1ZS5nZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblNhbXBsZXJUcmFja05hbWUoKTtcbiAgICAgICAgICBjb25zdCBzZWNvbmRTYW1wbGVyVHJhY2tOYW1lID0gYW5pbWF0ZWRWYWx1ZS5nZXRTZWNvbmRBY3RpdmVBbmltYXRpb25TYW1wbGVyVHJhY2tOYW1lKCk7XG4gICAgICAgICAgY29uc3QgZmlyc3QgPSBmaXJzdFNhbXBsZXJUcmFja05hbWUuZW5kc1dpdGgocG9zdGZpeFRvVHJhY2tOYW1lKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkVHJhY2tOYW1lOiBhbmltYXRlZFZhbHVlLmdldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKCksXG4gICAgICAgICAgICAgICAgc2FtcGxlclRyYWNrTmFtZTogZmlyc3RTYW1wbGVyVHJhY2tOYW1lLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCBzZWNvbmQgPSBzZWNvbmRTYW1wbGVyVHJhY2tOYW1lPy5lbmRzV2l0aChwb3N0Zml4VG9UcmFja05hbWUpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0ZWRUcmFja05hbWU6IGFuaW1hdGVkVmFsdWUuZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKCksXG4gICAgICAgICAgICAgICAgc2FtcGxlclRyYWNrTmFtZTogc2Vjb25kU2FtcGxlclRyYWNrTmFtZSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKGZpcnN0ICE9IG51bGwgfHwgc2Vjb25kICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJpbmRpbmdzLnB1c2goeyBhbmltYXRpb25Db21wb25lbnQsIHBhdGhOYW1lLCBmaXJzdCwgc2Vjb25kIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBlbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgICAgY29sbGVjdEJpbmRpbmdzKGNoaWxkLmVudGl0eSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb2xsZWN0QmluZGluZ3Mocm9vdEVudGl0eSk7XG4gICAgcmV0dXJuIGJpbmRpbmdzO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3Jlc3RvcmVBY3RpdmVTYW1wbGVyQmluZGluZ3MoXG4gICAgYmluZGluZ3M6IHJlYWRvbmx5IEFuaW1hdGlvbkNoYW5uZWxBY3RpdmVTYW1wbGVyQmluZGluZ3NbXSxcbiAgICBhc3NpZ25lZFRyYWNrTmFtZXM6IFJlYWRvbmx5U2V0PEFuaW1hdGlvblRyYWNrTmFtZT4sXG4gICAgcG9zdGZpeFRvVHJhY2tOYW1lOiBzdHJpbmdcbiAgKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBiaW5kaW5nIG9mIGJpbmRpbmdzKSB7XG4gICAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gYmluZGluZy5hbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uKGJpbmRpbmcucGF0aE5hbWUpO1xuICAgICAgaWYgKGFuaW1hdGVkVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGF2YWlsYWJsZVRyYWNrTmFtZXMgPSBuZXcgU2V0KGFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKTtcbiAgICAgIGNvbnN0IHJlc3RvcmVCaW5kaW5nID0gKFxuICAgICAgICBhY3RpdmVTYW1wbGVyQmluZGluZzogQWN0aXZlU2FtcGxlckJpbmRpbmcgfCB1bmRlZmluZWQsXG4gICAgICAgIHNldEFjdGl2ZVRyYWNrTmFtZTogKHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKSA9PiB2b2lkXG4gICAgICApID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZVNhbXBsZXJCaW5kaW5nID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRUcmFja05hbWUgPVxuICAgICAgICAgIGFzc2lnbmVkVHJhY2tOYW1lcy5oYXMoYWN0aXZlU2FtcGxlckJpbmRpbmcuc2FtcGxlclRyYWNrTmFtZSkgJiZcbiAgICAgICAgICBhdmFpbGFibGVUcmFja05hbWVzLmhhcyhhY3RpdmVTYW1wbGVyQmluZGluZy5zYW1wbGVyVHJhY2tOYW1lKVxuICAgICAgICAgICAgPyBhY3RpdmVTYW1wbGVyQmluZGluZy5zYW1wbGVyVHJhY2tOYW1lXG4gICAgICAgICAgICA6IEFycmF5LmZyb20oYXNzaWduZWRUcmFja05hbWVzKS5maW5kKFxuICAgICAgICAgICAgICAgIHRyYWNrTmFtZSA9PiB0cmFja05hbWUuZW5kc1dpdGgocG9zdGZpeFRvVHJhY2tOYW1lKSAmJiBhdmFpbGFibGVUcmFja05hbWVzLmhhcyh0cmFja05hbWUpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIGlmIChyZXBsYWNlbWVudFRyYWNrTmFtZSAhPSBudWxsICYmIGF2YWlsYWJsZVRyYWNrTmFtZXMuaGFzKHJlcGxhY2VtZW50VHJhY2tOYW1lKSkge1xuICAgICAgICAgIHNldEFjdGl2ZVRyYWNrTmFtZShyZXBsYWNlbWVudFRyYWNrTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJlc2VydmVkUmVxdWVzdGVkVHJhY2tOYW1lID0gYWN0aXZlU2FtcGxlckJpbmRpbmcucmVxdWVzdGVkVHJhY2tOYW1lPy5lbmRzV2l0aChwb3N0Zml4VG9UcmFja05hbWUpXG4gICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICA6IGFjdGl2ZVNhbXBsZXJCaW5kaW5nLnJlcXVlc3RlZFRyYWNrTmFtZTtcbiAgICAgICAgaWYgKHByZXNlcnZlZFJlcXVlc3RlZFRyYWNrTmFtZSAhPSBudWxsICYmIHByZXNlcnZlZFJlcXVlc3RlZFRyYWNrTmFtZSAhPT0gcmVwbGFjZW1lbnRUcmFja05hbWUpIHtcbiAgICAgICAgICBzZXRBY3RpdmVUcmFja05hbWUocHJlc2VydmVkUmVxdWVzdGVkVHJhY2tOYW1lKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJlc3RvcmVCaW5kaW5nKGJpbmRpbmcuZmlyc3QsIHRyYWNrTmFtZSA9PiBhbmltYXRlZFZhbHVlLnNldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKHRyYWNrTmFtZSkpO1xuICAgICAgcmVzdG9yZUJpbmRpbmcoYmluZGluZy5zZWNvbmQsIHRyYWNrTmFtZSA9PiBhbmltYXRlZFZhbHVlLnNldFNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSh0cmFja05hbWUpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0Rmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUocm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpOiBBbmltYXRpb25UcmFja05hbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJvb3RFbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpKSB7XG4gICAgICAgIHJldHVybiBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0Rmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHJvb3RFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lID0gdGhpcy5fX2dldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKGNoaWxkLmVudGl0eSk7XG4gICAgICBpZiAoZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX19maW5kQW5pbWF0aW9uQ29tcG9uZW50SW5IaWVyYXJjaHkocm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpOiBBbmltYXRpb25Db21wb25lbnQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJvb3RFbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBhbmltYXRpb25Db21wb25lbnQ7XG4gICAgfVxuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygcm9vdEVudGl0eS5jaGlsZHJlbikge1xuICAgICAgY29uc3QgY2hpbGRBbmltYXRpb25Db21wb25lbnQgPSB0aGlzLl9fZmluZEFuaW1hdGlvbkNvbXBvbmVudEluSGllcmFyY2h5KGNoaWxkLmVudGl0eSk7XG4gICAgICBpZiAoY2hpbGRBbmltYXRpb25Db21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gY2hpbGRBbmltYXRpb25Db21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKHJvb3RFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5KTogQW5pbWF0aW9uVHJhY2tOYW1lIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBhbmltYXRpb25Db21wb25lbnQgPSByb290RW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgaWYgKGFuaW1hdGlvbkNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IFssIGNoYW5uZWxdIG9mIGFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25DaGFubmVsc09mVHJhY2soKSkge1xuICAgICAgICBjb25zdCBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKCk7XG4gICAgICAgIGlmIChzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHJvb3RFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IHNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSA9IHRoaXMuX19nZXRTZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUoY2hpbGQuZW50aXR5KTtcbiAgICAgIGlmIChzZWNvbmRBY3RpdmVBbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gc2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0Rmlyc3RBbmltYXRpb25UcmFja05hbWUocm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpOiBBbmltYXRpb25UcmFja05hbWUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGFuaW1hdGlvbkNvbXBvbmVudCA9IHJvb3RFbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgICBpZiAoYW5pbWF0aW9uQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpKSB7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvblRyYWNrTmFtZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKClbMF07XG4gICAgICAgIGlmIChhbmltYXRpb25UcmFja05hbWUgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBhbmltYXRpb25UcmFja05hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHJvb3RFbnRpdHkuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGFuaW1hdGlvblRyYWNrTmFtZSA9IHRoaXMuX19nZXRGaXJzdEFuaW1hdGlvblRyYWNrTmFtZShjaGlsZC5lbnRpdHkpO1xuICAgICAgaWYgKGFuaW1hdGlvblRyYWNrTmFtZSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBhbmltYXRpb25UcmFja05hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX19oYXNBbmltYXRpb25UcmFja05hbWUocm9vdEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHksIHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYW5pbWF0aW9uQ29tcG9uZW50ID0gcm9vdEVudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgIGlmIChhbmltYXRpb25Db21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBbLCBjaGFubmVsXSBvZiBhbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uQ2hhbm5lbHNPZlRyYWNrKCkpIHtcbiAgICAgICAgaWYgKGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkuaW5jbHVkZXModHJhY2tOYW1lKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiByb290RW50aXR5LmNoaWxkcmVuKSB7XG4gICAgICBpZiAodGhpcy5fX2hhc0FuaW1hdGlvblRyYWNrTmFtZShjaGlsZC5lbnRpdHksIHRyYWNrTmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3ZhbGlkYXRlQ2hhcmFjdGVyVnJtYUFuaW1hdGlvblNldChcbiAgICByb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSxcbiAgICB2cm1hQW5pbWF0aW9uczogQ2hhcmFjdGVyVnJtYUFuaW1hdGlvblNldCxcbiAgICBzdXBwbGllZFNlbWFudGljczogcmVhZG9ubHkgQ2hhcmFjdGVyQW5pbWF0aW9uU2VtYW50aWNbXSxcbiAgICByb290TW90aW9uOiBWcm1hUm9vdE1vdGlvblBvbGljeVxuICApOiB2b2lkIHtcbiAgICBjb25zdCByb290VnJtID0gcm9vdEVudGl0eS50cnlUb0dldFZybSgpO1xuICAgIGlmIChyb290VnJtID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hhcmFjdGVyIFZSTUEgYW5pbWF0aW9uIGFzc2lnbm1lbnQgcmVxdWlyZXMgYSBWUk0gcm9vdCBlbnRpdHkuJyk7XG4gICAgfVxuICAgIGlmIChyb290VnJtLl92ZXJzaW9uICE9PSAnMC54JyAmJiByb290VnJtLl92ZXJzaW9uICE9PSAnMS4wJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBWUk0gdmVyc2lvbiAnJHtyb290VnJtLl92ZXJzaW9ufScgZm9yIGNoYXJhY3RlciBWUk1BIGFuaW1hdGlvbiBhc3NpZ25tZW50LmApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldEh1bWFub2lkQm9uZU1hcCA9IHJvb3RFbnRpdHkuZ2V0VGFnVmFsdWUoJ2h1bWFub2lkX21hcF9uYW1lX25vZGVJZCcpIGFzIE1hcDxzdHJpbmcsIG51bWJlcj4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKHRhcmdldEh1bWFub2lkQm9uZU1hcCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NoYXJhY3RlciBWUk1BIGFuaW1hdGlvbiBhc3NpZ25tZW50IHJlcXVpcmVzIGh1bWFub2lkIGJvbmUgbWFwcGluZ3Mgb24gdGhlIFZSTSByb290IGVudGl0eS4nKTtcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0RW50aXRpZXMgPSByb290RW50aXR5LmdldFRhZ1ZhbHVlKCdybkVudGl0aWVzJykgYXMgSVNjZW5lR3JhcGhFbnRpdHlbXSB8IHVuZGVmaW5lZDtcbiAgICBpZiAodGFyZ2V0RW50aXRpZXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaGFyYWN0ZXIgVlJNQSBhbmltYXRpb24gYXNzaWdubWVudCByZXF1aXJlcyBodW1hbm9pZCBlbnRpdGllcyBvbiB0aGUgVlJNIHJvb3QgZW50aXR5LicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2VtYW50aWMgb2Ygc3VwcGxpZWRTZW1hbnRpY3MpIHtcbiAgICAgIGNvbnN0IHZybWFNb2RlbCA9IHZybWFBbmltYXRpb25zW3NlbWFudGljXSE7XG4gICAgICBpZiAodnJtYU1vZGVsLmFuaW1hdGlvbnMgPT0gbnVsbCB8fCB2cm1hTW9kZWwuYW5pbWF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaGFyYWN0ZXIgVlJNQSBhbmltYXRpb24gJyR7c2VtYW50aWN9JyBkb2VzIG5vdCBjb250YWluIGFueSBhbmltYXRpb25zLmApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBodW1hbm9pZEJvbmVNYXAgPSB0aGlzLl9fZ2V0VnJtYUh1bWFub2lkQm9uZU5hbWVNYXAodnJtYU1vZGVsKTtcbiAgICAgIGlmIChodW1hbm9pZEJvbmVNYXAgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENoYXJhY3RlciBWUk1BIGFuaW1hdGlvbiAnJHtzZW1hbnRpY30nIGRvZXMgbm90IGRlZmluZSBWUk1DX3ZybV9hbmltYXRpb24gaHVtYW5vaWQgYm9uZXMuYCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhhc1JldGFyZ2V0YWJsZUNoYW5uZWwgPSB2cm1hTW9kZWwuYW5pbWF0aW9ucy5zb21lKGFuaW1hdGlvbiA9PlxuICAgICAgICBhbmltYXRpb24uY2hhbm5lbHMuc29tZShjaGFubmVsID0+IHtcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBjaGFubmVsLnRhcmdldD8ubm9kZTtcbiAgICAgICAgICBjb25zdCBodW1hbm9pZEJvbmVOYW1lID0gbm9kZUluZGV4ID09IG51bGwgPyB1bmRlZmluZWQgOiBodW1hbm9pZEJvbmVNYXAuZ2V0KG5vZGVJbmRleCk7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IGNoYW5uZWwudGFyZ2V0Py5wYXRoO1xuICAgICAgICAgIGlmIChwYXRoICE9PSAndHJhbnNsYXRpb24nICYmIHBhdGggIT09ICdyb3RhdGlvbicgJiYgcGF0aCAhPT0gJ3NjYWxlJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocm9vdE1vdGlvbiA9PT0gJ2lnbm9yZUhpcHNUcmFuc2xhdGlvbicgJiYgaHVtYW5vaWRCb25lTmFtZSA9PT0gJ2hpcHMnICYmIHBhdGggPT09ICd0cmFuc2xhdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGh1bWFub2lkQm9uZU5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB0YXJnZXROb2RlSW5kZXggPSB0YXJnZXRIdW1hbm9pZEJvbmVNYXAuZ2V0KGh1bWFub2lkQm9uZU5hbWUpO1xuICAgICAgICAgIHJldHVybiB0YXJnZXROb2RlSW5kZXggIT0gbnVsbCAmJiB0YXJnZXRFbnRpdGllc1t0YXJnZXROb2RlSW5kZXhdICE9IG51bGw7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgaWYgKCFoYXNSZXRhcmdldGFibGVDaGFubmVsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2hhcmFjdGVyIFZSTUEgYW5pbWF0aW9uICcke3NlbWFudGljfScgZG9lcyBub3QgdGFyZ2V0IGEgaHVtYW5vaWQgYm9uZSBhdmFpbGFibGUgb24gdGhlIFZSTSByb290IGVudGl0eS5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBhIGdpdmVuIG5vZGUgcmVwcmVzZW50cyB0aGUgaGlwcyBib25lIGluIHRoZSBodW1hbm9pZCBza2VsZXRvbi5cbiAgICogVGhpcyBpcyB1c2VkIGZvciBzcGVjaWFsIGhhbmRsaW5nIG9mIGhpcCB0cmFuc2xhdGlvbiBhbmltYXRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gcm9vdEVudGl0eSAtIFRoZSByb290IGVudGl0eSBjb250YWluaW5nIGh1bWFub2lkIGJvbmUgbWFwcGluZ3NcbiAgICogQHBhcmFtIHZybU1vZGVsIC0gVGhlIFZSTSBtb2RlbCB3aXRoIGh1bWFub2lkIGJvbmUgZGVmaW5pdGlvbnNcbiAgICogQHBhcmFtIG5vZGVJbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgbm9kZSB0byBjaGVja1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBub2RlIHJlcHJlc2VudHMgdGhlIGhpcHMgYm9uZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwcml2YXRlIF9faXNIaXBzKF9yb290RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSwgdnJtTW9kZWw6IFZSTSwgbm9kZUluZGV4OiBJbmRleCkge1xuICAgIGNvbnN0IHNyY01hcE5vZGVJZE5hbWU6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgaWYgKElzLmV4aXN0KHZybU1vZGVsLmV4dGVuc2lvbnMuVlJNKSkge1xuICAgICAgY29uc3QgaHVtYW5Cb25lcyA9IHZybU1vZGVsLmV4dGVuc2lvbnMuVlJNLmh1bWFub2lkLmh1bWFuQm9uZXM7XG4gICAgICBmb3IgKGNvbnN0IGJvbmUgb2YgaHVtYW5Cb25lcykge1xuICAgICAgICBzcmNNYXBOb2RlSWROYW1lLnNldChib25lLm5vZGUsIGJvbmUuYm9uZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChJcy5leGlzdCh2cm1Nb2RlbC5leHRlbnNpb25zLlZSTUNfdnJtKSkge1xuICAgICAgY29uc3QgaHVtYW5Cb25lcyA9IHZybU1vZGVsLmV4dGVuc2lvbnMuVlJNQ192cm0uaHVtYW5vaWQuaHVtYW5Cb25lcztcbiAgICAgIGZvciAoY29uc3QgYm9uZU5hbWUgaW4gaHVtYW5Cb25lcykge1xuICAgICAgICBjb25zdCBib25lID0gaHVtYW5Cb25lc1tib25lTmFtZV07XG4gICAgICAgIHNyY01hcE5vZGVJZE5hbWUuc2V0KGJvbmUubm9kZSwgYm9uZU5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBodW1hbm9pZEJvbmVOYW1lID0gc3JjTWFwTm9kZUlkTmFtZS5nZXQobm9kZUluZGV4KSE7XG4gICAgaWYgKGh1bWFub2lkQm9uZU5hbWUgPT09ICdoaXBzJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHVwIGFuaW1hdGlvbiBjb21wb25lbnRzIGFuZCBkYXRhIGZvciBlbnRpdGllcyB3aXRoIHRoZSBzYW1lIHNrZWxldG9uIHN0cnVjdHVyZS5cbiAgICogUHJvY2Vzc2VzIGFsbCBhbmltYXRpb24gY2hhbm5lbHMgYW5kIGFwcGxpZXMgdGhlbSB0byBjb3JyZXNwb25kaW5nIGVudGl0aWVzIHdpdGggb3B0aW9uYWwgcmV0YXJnZXRpbmcuXG4gICAqXG4gICAqIEBwYXJhbSByb290RW50aXR5IC0gVGhlIHJvb3QgZW50aXR5IG9mIHRoZSB0YXJnZXQgc2tlbGV0b25cbiAgICogQHBhcmFtIGdsdGZNb2RlbCAtIFRoZSBzb3VyY2UgZ2xURiBtb2RlbCBjb250YWluaW5nIGFuaW1hdGlvbiBkYXRhXG4gICAqIEBwYXJhbSB2cm1Nb2RlbCAtIFRoZSBWUk0gbW9kZWwgd2l0aCBodW1hbm9pZCBib25lIG1hcHBpbmdzXG4gICAqIEBwYXJhbSBpc1NhbWVTa2VsZXRvbiAtIFdoZXRoZXIgdGhlIHNvdXJjZSBhbmQgdGFyZ2V0IHNrZWxldG9ucyBhcmUgaWRlbnRpY2FsXG4gICAqIEBwYXJhbSByZXRhcmdldE1vZGUgLSBUaGUgcmV0YXJnZXRpbmcgbW9kZSB0byBhcHBseVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldHVwQW5pbWF0aW9uRm9yU2FtZVNrZWxldG9uKFxuICAgIHJvb3RFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5LFxuICAgIGdsdGZNb2RlbDogUm5NMixcbiAgICB2cm1Nb2RlbDogVlJNLFxuICAgIGlzU2FtZVNrZWxldG9uOiBib29sZWFuLFxuICAgIHJldGFyZ2V0TW9kZTogUmV0YXJnZXRNb2RlXG4gICkge1xuICAgIGlmIChnbHRmTW9kZWwuYW5pbWF0aW9ucyA9PSBudWxsIHx8IGdsdGZNb2RlbC5hbmltYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eShBbmltYXRpb25TdGF0ZUNvbXBvbmVudCwgcm9vdEVudGl0eSk7XG5cbiAgICBmb3IgKGNvbnN0IGFuaW1hdGlvbiBvZiBnbHRmTW9kZWwuYW5pbWF0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBzYW1wbGVyIG9mIGFuaW1hdGlvbi5zYW1wbGVycykge1xuICAgICAgICBNb2RlbENvbnZlcnRlci5fcmVhZEJpbmFyeUZyb21BY2Nlc3NvckFuZFNldEl0VG9BY2Nlc3NvckV4dHJhcyh0aGlzLl9fZW5naW5lLCBzYW1wbGVyLmlucHV0T2JqZWN0ISk7XG4gICAgICAgIE1vZGVsQ29udmVydGVyLl9yZWFkQmluYXJ5RnJvbUFjY2Vzc29yQW5kU2V0SXRUb0FjY2Vzc29yRXh0cmFzKHRoaXMuX19lbmdpbmUsIHNhbXBsZXIub3V0cHV0T2JqZWN0ISk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhbmltYXRpb24gb2YgZ2x0Zk1vZGVsLmFuaW1hdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3QgY2hhbm5lbCBvZiBhbmltYXRpb24uY2hhbm5lbHMpIHtcbiAgICAgICAgLy8gZ2V0IGFuaW1hdGlvbiBkYXRhXG4gICAgICAgIGNvbnN0IGFuaW1JbnB1dEFycmF5ID0gY2hhbm5lbC5zYW1wbGVyT2JqZWN0Py5pbnB1dE9iamVjdD8uZXh0cmFzIS50eXBlZERhdGFBcnJheTtcbiAgICAgICAgY29uc3QgYW5pbU91dHB1dEFycmF5ID0gY2hhbm5lbC5zYW1wbGVyT2JqZWN0Py5vdXRwdXRPYmplY3Q/LmV4dHJhcyEudHlwZWREYXRhQXJyYXk7XG4gICAgICAgIGNvbnN0IGludGVycG9sYXRpb24gPVxuICAgICAgICAgIGNoYW5uZWwuc2FtcGxlck9iamVjdCEuaW50ZXJwb2xhdGlvbiAhPSBudWxsID8gY2hhbm5lbC5zYW1wbGVyT2JqZWN0IS5pbnRlcnBvbGF0aW9uIDogJ0xJTkVBUic7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgY29ycmVzcG9uZGluZyBqb2ludCBlbnRpdHlcbiAgICAgICAgY29uc3Qgbm9kZSA9IGdsdGZNb2RlbC5ub2Rlc1tjaGFubmVsLnRhcmdldCEubm9kZSFdO1xuICAgICAgICBjb25zdCBybkVudGl0eSA9IHRoaXMuX19nZXRDb3JyZXNwb25kaW5nRW50aXR5KFxuICAgICAgICAgIHJvb3RFbnRpdHksXG4gICAgICAgICAgZ2x0Zk1vZGVsLFxuICAgICAgICAgIHZybU1vZGVsLFxuICAgICAgICAgIGNoYW5uZWwudGFyZ2V0IS5ub2RlISxcbiAgICAgICAgICBub2RlLm5hbWUsXG4gICAgICAgICAgaXNTYW1lU2tlbGV0b25cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHJuRW50aXR5KSB7XG4gICAgICAgICAgY29uc3QgbmV3Um5FbnRpdHkgPSB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoQW5pbWF0aW9uQ29tcG9uZW50LCBybkVudGl0eSk7XG4gICAgICAgICAgY29uc3QgYW5pbWF0aW9uQ29tcG9uZW50ID0gbmV3Um5FbnRpdHkuZ2V0QW5pbWF0aW9uKCk7XG5cbiAgICAgICAgICBpZiAocmV0YXJnZXRNb2RlID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIC8vIGFwcGx5IGFuaW1hdGlvbiBkYXRhIHRvIHRoZSB0YXJnZXQgam9pbnQgZW50aXR5XG4gICAgICAgICAgICBsZXQgYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9ICd0cmFuc2xhdGUnO1xuICAgICAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0IS5wYXRoID09PSAndHJhbnNsYXRpb24nKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSAndHJhbnNsYXRlJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhbm5lbC50YXJnZXQhLnBhdGghID09PSAncm90YXRpb24nKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUgPSAncXVhdGVybmlvbic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID0gY2hhbm5lbC50YXJnZXQhLnBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uQXR0cmlidXRlVHlwZSA9PT0gJ3F1YXRlcm5pb24nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvblNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgICAgICAgICAgIGNvbnN0IHRyYWNrTmFtZSA9IElzLmV4aXN0KGFuaW1hdGlvbi5uYW1lKSA/IGFuaW1hdGlvbi5uYW1lISA6ICdVbnRpdGxlZCc7XG4gICAgICAgICAgICAgIGFuaW1hdGlvblNhbXBsZXJzLnNldCh0cmFja05hbWUsIHtcbiAgICAgICAgICAgICAgICBpbnB1dDogYW5pbUlucHV0QXJyYXkhLFxuICAgICAgICAgICAgICAgIG91dHB1dDogYW5pbU91dHB1dEFycmF5ISxcbiAgICAgICAgICAgICAgICBvdXRwdXRDb21wb25lbnROOiA0LCAvLyBRdWF0ZXJuaW9uXG4gICAgICAgICAgICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogQW5pbWF0aW9uSW50ZXJwb2xhdGlvbi5mcm9tU3RyaW5nKGludGVycG9sYXRpb24pLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFF1YXRlcm5pb24oYW5pbWF0aW9uU2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgICAgIGFuaW1hdGlvbkNvbXBvbmVudC5zZXRBbmltYXRpb24oYW5pbWF0aW9uQXR0cmlidXRlVHlwZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBhbmltYXRpb25BdHRyaWJ1dGVUeXBlID09PSAndHJhbnNsYXRlJyAmJlxuICAgICAgICAgICAgICB0aGlzLl9faXNIaXBzKHJvb3RFbnRpdHksIHZybU1vZGVsLCBjaGFubmVsLnRhcmdldCEubm9kZSEpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uU2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgICAgICAgY29uc3QgdHJhY2tOYW1lID0gSXMuZXhpc3QoYW5pbWF0aW9uLm5hbWUpID8gYW5pbWF0aW9uLm5hbWUhIDogJ1VudGl0bGVkJztcbiAgICAgICAgICAgICAgYW5pbWF0aW9uU2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwge1xuICAgICAgICAgICAgICAgIGlucHV0OiBhbmltSW5wdXRBcnJheSEsXG4gICAgICAgICAgICAgICAgb3V0cHV0OiBhbmltT3V0cHV0QXJyYXkhLFxuICAgICAgICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IDMsIC8vIHRyYW5zbGF0ZVxuICAgICAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IEFuaW1hdGlvbkludGVycG9sYXRpb24uZnJvbVN0cmluZyhpbnRlcnBvbGF0aW9uKSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKGFuaW1hdGlvblNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgICAgICBhbmltYXRpb25Db21wb25lbnQuc2V0QW5pbWF0aW9uKGFuaW1hdGlvbkF0dHJpYnV0ZVR5cGUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBnbHRmRW50aXR5ID0gZ2x0Zk1vZGVsLmV4dHJhcy5ybkVudGl0aWVzW2NoYW5uZWwudGFyZ2V0IS5ub2RlIV07XG4gICAgICAgICAgICBsZXQgcmV0YXJnZXQ6IElBbmltYXRpb25SZXRhcmdldCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChyZXRhcmdldE1vZGUgPT09ICdnbG9iYWwnKSB7XG4gICAgICAgICAgICAgIHJldGFyZ2V0ID0gbmV3IEdsb2JhbFJldGFyZ2V0KGdsdGZFbnRpdHkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXRhcmdldE1vZGUgPT09ICdhYnNvbHV0ZScpIHtcbiAgICAgICAgICAgICAgcmV0YXJnZXQgPSBuZXcgQWJzb2x1dGVBbmltYXRpb24oZ2x0ZkVudGl0eSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gcmV0YXJnZXQgbW9kZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uQ29tcG9uZW50Ll9zZXRSZXRhcmdldChyZXRhcmdldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FB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QUFDeEUsb0JBQU0sWUFBWSxHQUFHLE1BQU0sVUFBVSxJQUFJLElBQUksVUFBVSxPQUFRO0FBQy9ELGdDQUFrQixJQUFJLFdBQVc7QUFBQSxnQkFDL0IsT0FBTztBQUFBLGdCQUNQLFFBQVE7QUFBQSxnQkFDUixrQkFBa0I7QUFBQTtBQUFBLGdCQUNsQixxQkFBcUIsdUJBQXVCLFdBQVcsYUFBYTtBQUFBLGNBQ3RFLENBQUM7QUFDRCxvQkFBTSxtQkFBbUIsSUFBSSxnQkFBZ0IsbUJBQW1CLFNBQVM7QUFDekUsaUNBQW1CLGFBQWEsd0JBQXdCLGdCQUFnQjtBQUFBLFlBQzFFO0FBQUEsVUFDRixPQUFPO0FBQ0wsa0JBQU0sYUFBYSxVQUFVLE9BQU8sV0FBVyxRQUFRLE9BQVEsSUFBSztBQUNwRSxnQkFBSTtBQUNKLGdCQUFJLGlCQUFpQixVQUFVO0FBQzdCLHlCQUFXLElBQUksZUFBZSxVQUFVO0FBQUEsWUFDMUMsV0FBVyxpQkFBaUIsWUFBWTtBQUN0Qyx5QkFBVyxJQUFJLGtCQUFrQixVQUFVO0FBQUEsWUFDN0MsT0FBTztBQUNMLG9CQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxZQUN6QztBQUNBLCtCQUFtQixhQUFhLFFBQVE7QUFBQSxVQUMxQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsiX19lbmdpbmUiLCAiX19yZXNldEFuaW1hdGlvbkFuZFBvc2UiLCAiX19zZXR1cEFuaW1hdGlvbkZvclNhbWVTa2VsZXRvbiIsICJfX2dldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lIiwgIl9fZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lIiwgIl9fY2FwdHVyZUFjdGl2ZVNhbXBsZXJCaW5kaW5nc0J5UG9zdGZpeCIsICJfYSIsICJfYiIsICJfX2dldFZybWFIdW1hbm9pZEJvbmVOYW1lTWFwIiwgIl9fZ2V0VnJtYUV4cHJlc3Npb25OYW1lc01hcCIsICJfX3NldFZybWFFeHByZXNzaW9uQW5pbWF0aW9uIiwgIl9fZ2V0Q29ycmVzcG9uZGluZ0VudGl0eVdpdGhWcm1hIiwgIl9faGFzQW5pbWF0aW9uVHJhY2tOYW1lIiwgIl9fZ2V0Rmlyc3RBbmltYXRpb25UcmFja05hbWUiLCAiX19maWxsTWlzc2luZ1ZybWFFeHByZXNzaW9uVHJhY2tzIiwgIl9fcmVzdG9yZUFjdGl2ZVNhbXBsZXJCaW5kaW5ncyIsICJfX3ZhbGlkYXRlQ2hhcmFjdGVyVnJtYUFuaW1hdGlvblNldCIsICJwb3N0Zml4VG9UcmFja05hbWUiLCAiYW5pbWF0aW9uQ29tcG9uZW50IiwgIl9fZ2V0Q29ycmVzcG9uZGluZ0VudGl0eSIsICJfX2ZpbmRBbmltYXRpb25Db21wb25lbnRJbkhpZXJhcmNoeSIsICJfX2lzSGlwcyJdCn0K
