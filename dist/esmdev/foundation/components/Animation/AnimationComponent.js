// src/foundation/components/Animation/AnimationComponent.ts
import { TagKhrNodeVisibilityVisible } from "../../../types/glTF2.js";
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/index.js";
import { AnimationAttribute } from "../../definitions/AnimationAttribute.js";
import { MathUtil } from "../../math/index.js";
import { AnimatedQuaternion } from "../../math/AnimatedQuaternion.js";
import { AnimatedVector3 } from "../../math/AnimatedVector3.js";
import { MutableQuaternion } from "../../math/MutableQuaternion.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { DataUtil } from "../../misc/DataUtil.js";
import { Is } from "../../misc/Is.js";
import { EventPubSub } from "../../system/EventPubSub.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
import { __interpolate } from "./AnimationOps.js";
import { AnimationStateRepository } from "./AnimationStateRepository.js";
var ChangeAnimationInfo = /* @__PURE__ */ Symbol("AnimationComponentEventChangeAnimationInfo");
var PlayEnd = /* @__PURE__ */ Symbol("AnimationComponentEventPlayEnd");
var VrmExpressionPathPrefix = "vrmExpression/";
var _AnimationComponent = class _AnimationComponent extends Component {
  constructor() {
    super(...arguments);
    /// inner states ///
    // The name of the current Active Track
    this.__animationBlendingRatio = 0;
    // the value range is [0,1]
    // Animation Data of each AnimationComponent
    this.__animationTrack = /* @__PURE__ */ new Map();
    this.__animationTrackFeatureHashes = /* @__PURE__ */ new Map();
    this.__isEffekseerState = -1;
    /** Reused map for VRM expression weights to avoid a per-frame allocation. */
    this.__vrmExpressionWeights = /* @__PURE__ */ new Map();
    /** Cache of the leaf parameter name of `material/...` animation paths. */
    this.__materialParameterNameCache = /* @__PURE__ */ new Map();
    /// flags ///
    this.__isAnimating = true;
    this.isLoop = true;
    // Global animation time in Rhodonite
    this.useGlobalTime = true;
    // animation time in this animation component
    this.time = 0;
  }
  /// LifeCycle Methods ///
  /**
   * Component load lifecycle method. Moves the component to the Logic process stage.
   */
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Component logic lifecycle method. Applies animation if animation is enabled.
   *
   * ## Early Return Optimization for VRM Models with Shared Skeleton
   *
   * When multiple VRM models share the same skeleton (joint entities), animation
   * calculations only need to be performed once per frame. This optimization works
   * by checking if the SkeletalComponent's skinning cache will be used for this entity.
   *
   * The optimization flow:
   * 1. SkeletalComponent tracks which joint EntityUIDs had skinning cache hits
   * 2. Joints belonging to "leader" SkeletalComponents (those that compute skinning)
   *    are excluded from this tracking
   * 3. AnimationComponent checks if its entity is in the cached list
   * 4. If cached, early return skips animation calculation (skinning result will be reused)
   *
   * This significantly reduces CPU overhead when many VRM models share the same skeleton.
   */
  $logic() {
    if (!this.isAnimationEnabled()) {
      return;
    }
    if (AnimationStateRepository.isEntityCached(this.__entityUid, this.__engine)) {
      return;
    }
    this.__applyAnimation();
  }
  isAnimationEnabled() {
    if (_AnimationComponent.getIsAnimating(this.__engine) && this.isAnimating) {
      return true;
    }
    return false;
  }
  /**
   * Sets the animation blending ratio and applies the animation.
   * @param value - The blending ratio value between 0 and 1
   */
  set animationBlendingRatio(value) {
    this.__animationBlendingRatio = value;
    this.__applyAnimation();
  }
  /**
   * Updates the animation blending ratio without evaluating animation channels immediately.
   * @param value - The blending ratio value between 0 and 1
   * @internal
   */
  _setAnimationBlendingRatioWithoutApplying(value) {
    this.__animationBlendingRatio = value;
  }
  /**
   * Gets the current animation blending ratio.
   * @returns The blending ratio value between 0 and 1
   */
  get animationBlendingRatio() {
    return this.__animationBlendingRatio;
  }
  /**
   * Applies animation to the entity based on the current time and animation tracks.
   * Handles various animation types including transform, blend shape, material, light, camera, and Effekseer.
   * @private
   */
  __applyAnimation() {
    var _a;
    let time = this.time;
    if (this.useGlobalTime) {
      time = _AnimationComponent.getGlobalTime(this.__engine);
    }
    const transformComponent = this.entity.getTransform();
    const canSkipIdenticalTransformWrite = !this.entity.getSceneGraph()._hasPhysicsComponentInSubtree;
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    const effekseerComponent = this.entity.tryToGetEffekseer();
    let vrmExpressionWeights;
    const blendingRatio = this.__animationBlendingRatio;
    for (const [pathName, channel] of this.__animationTrack) {
      const animatedValue = channel.animatedValue;
      const setTimeAndBlendingRatio = animatedValue.setTimeAndBlendingRatio;
      if (setTimeAndBlendingRatio != null) {
        setTimeAndBlendingRatio.call(animatedValue, time, blendingRatio);
      } else {
        animatedValue.setTime(time);
        animatedValue.blendingRatio = blendingRatio;
      }
      if (pathName.startsWith(VrmExpressionPathPrefix)) {
        if (vrmExpressionWeights === void 0) {
          (_a = this.__vrmExpressionWeights) != null ? _a : this.__vrmExpressionWeights = /* @__PURE__ */ new Map();
          vrmExpressionWeights = this.__vrmExpressionWeights;
          vrmExpressionWeights.clear();
        }
        const expressionName = pathName.substring(VrmExpressionPathPrefix.length);
        vrmExpressionWeights.set(expressionName, channel.animatedValue.x);
        continue;
      }
      this.__applyChannelAnimation(
        pathName,
        channel,
        transformComponent,
        canSkipIdenticalTransformWrite,
        blendShapeComponent,
        effekseerComponent
      );
    }
    if (Is.exist(vrmExpressionWeights)) {
      const vrmComponent = this.entity.tryToGetVrm();
      if (Is.exist(vrmComponent)) {
        vrmComponent.setExpressionWeights(vrmExpressionWeights);
      }
    }
  }
  __applyChannelAnimation(pathName, channel, transformComponent, canSkipIdenticalTransformWrite, blendShapeComponent, effekseerComponent) {
    if (this.__applyTransformAnimation(pathName, channel, transformComponent, canSkipIdenticalTransformWrite)) return;
    if (this.__applyBlendShapeAnimation(pathName, channel, blendShapeComponent)) return;
    if (this.__applyVisibilityAnimation(pathName, channel)) return;
    if (this.__applyMaterialAnimation(pathName, channel)) return;
    if (this.__applyLightAnimation(pathName, channel)) return;
    if (this.__applyCameraAnimation(pathName, channel)) return;
    if (this.__applyEffekseerAnimation(pathName, channel, effekseerComponent)) return;
  }
  __applyTransformAnimation(pathName, channel, transformComponent, canSkipIdenticalTransformWrite) {
    const animatedValue = channel.animatedValue;
    if (pathName === "translate") {
      if (this.__shouldWriteTransformValue(
        animatedValue,
        transformComponent.localPositionInner._v,
        canSkipIdenticalTransformWrite
      )) {
        transformComponent.localPosition = animatedValue;
      }
      return true;
    }
    if (pathName === "quaternion") {
      if (this.__shouldWriteTransformValue(
        animatedValue,
        transformComponent.localRotationInner._v,
        canSkipIdenticalTransformWrite
      )) {
        transformComponent.localRotation = animatedValue;
      }
      return true;
    }
    if (pathName === "scale") {
      if (this.__shouldWriteTransformValue(
        animatedValue,
        transformComponent.localScaleInner._v,
        canSkipIdenticalTransformWrite
      )) {
        transformComponent.localScale = animatedValue;
      }
      return true;
    }
    return false;
  }
  /**
   * Returns true when the animated value differs from the value already stored in the transform.
   *
   * Writing an identical value would still increment the transform update count and invalidate the
   * world matrix and skinning caches downstream, so identical writes are skipped. The comparison is
   * against the target value (not the last applied value), so external transform edits are still
   * overwritten by the animation on the next frame.
   *
   * Physics subtrees set `canSkipIdenticalTransformWrite` to false: their setters also notify the
   * physics strategies with the parent world transform, which must keep running even when the local
   * value is unchanged.
   */
  __shouldWriteTransformValue(animatedValue, currentValue, canSkipIdenticalTransformWrite) {
    var _a;
    if (!canSkipIdenticalTransformWrite) {
      return true;
    }
    const animated = (_a = animatedValue.getValueArray) == null ? void 0 : _a.call(animatedValue);
    if (animated === void 0 || animated.length !== currentValue.length) {
      return true;
    }
    for (let i = 0; i < animated.length; i++) {
      if (animated[i] !== currentValue[i]) {
        return true;
      }
    }
    return false;
  }
  __applyBlendShapeAnimation(pathName, channel, blendShapeComponent) {
    var _a;
    if (pathName === "weights") {
      const animatedValue = channel.animatedValue;
      const value = (_a = animatedValue.getValueArray) == null ? void 0 : _a.call(animatedValue);
      if (value !== void 0) {
        blendShapeComponent.setWeightsFromArrayLike(value);
      } else {
        blendShapeComponent.weights = animatedValue.getNumberArray();
      }
      return true;
    }
    return false;
  }
  __applyVisibilityAnimation(pathName, channel) {
    var _a, _b;
    if (pathName !== "visibility") {
      return false;
    }
    const sceneGraph = this.entity.getSceneGraph();
    const localVisible = channel.animatedValue.x > 0.5;
    if (sceneGraph.entity.getTagValue(TagKhrNodeVisibilityVisible) !== localVisible) {
      sceneGraph.entity.tryToSetTag({ tag: TagKhrNodeVisibilityVisible, value: localVisible });
    }
    this.__applyEffectiveVisibility(sceneGraph, (_b = (_a = sceneGraph.parent) == null ? void 0 : _a.isVisible) != null ? _b : true);
    return true;
  }
  __applyEffectiveVisibility(sceneGraph, parentVisible) {
    const localVisible = this.__getLocalVisibility(sceneGraph);
    const effectiveVisible = parentVisible && localVisible;
    if (sceneGraph.isVisible !== effectiveVisible) {
      sceneGraph.isVisible = effectiveVisible;
    }
    for (const child of sceneGraph.children) {
      this.__applyEffectiveVisibility(child, effectiveVisible);
    }
  }
  __getLocalVisibility(sceneGraph) {
    const localVisible = sceneGraph.entity.getTagValue(TagKhrNodeVisibilityVisible);
    return typeof localVisible === "boolean" ? localVisible : sceneGraph.isVisible;
  }
  __applyMaterialAnimation(pathName, channel) {
    if (pathName.startsWith("material/")) {
      const meshComponent = this.entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        const mesh = meshComponent.mesh;
        const parameterName = this.__getMaterialParameterName(pathName);
        for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
          const primitive = mesh.getPrimitiveAt(i);
          const material = primitive.material;
          if (Is.exist(material)) {
            material.setParameter(parameterName, channel.animatedValue);
          }
        }
      }
      return true;
    }
    return false;
  }
  __getMaterialParameterName(pathName) {
    let name = this.__materialParameterNameCache.get(pathName);
    if (name === void 0) {
      name = pathName.split("/").pop();
      this.__materialParameterNameCache.set(pathName, name);
    }
    return name;
  }
  __applyLightAnimation(pathName, channel) {
    const lightComponent = this.entity.tryToGetLight();
    if (!Is.exist(lightComponent)) return false;
    if (pathName === "light_color") {
      const color = channel.animatedValue;
      lightComponent.color = color;
      return true;
    }
    if (pathName === "light_intensity") {
      const intensity = channel.animatedValue;
      lightComponent.intensity = intensity._v[0];
      return true;
    }
    if (pathName === "light_range") {
      const range = channel.animatedValue;
      lightComponent.range = range._v[0];
      return true;
    }
    if (pathName === "light_spot_innerConeAngle") {
      const innerConeAngle = channel.animatedValue;
      lightComponent.innerConeAngle = innerConeAngle._v[0];
      return true;
    }
    if (pathName === "light_spot_outerConeAngle") {
      const outerConeAngle = channel.animatedValue;
      lightComponent.outerConeAngle = outerConeAngle._v[0];
      return true;
    }
    return false;
  }
  __applyCameraAnimation(pathName, channel) {
    const cameraComponent = this.entity.tryToGetCamera();
    if (!Is.exist(cameraComponent)) return false;
    if (pathName === "camera_znear") {
      const znear = channel.animatedValue;
      cameraComponent.zNear = znear._v[0];
      return true;
    }
    if (pathName === "camera_zfar") {
      const zfar = channel.animatedValue;
      cameraComponent.zFar = zfar._v[0];
      return true;
    }
    if (pathName === "camera_fovy") {
      const fovy = channel.animatedValue;
      cameraComponent.setFovyAndChangeFocalLength(MathUtil.radianToDegree(fovy._v[0]));
      return true;
    }
    if (pathName === "camera_xmag") {
      const xmag = channel.animatedValue;
      cameraComponent.xMag = xmag._v[0];
      return true;
    }
    if (pathName === "camera_ymag") {
      const ymag = channel.animatedValue;
      cameraComponent.yMag = ymag._v[0];
      return true;
    }
    return false;
  }
  __applyEffekseerAnimation(pathName, channel, effekseerComponent) {
    if (pathName === "effekseer") {
      if (channel.animatedValue.x > 0.5) {
        if (this.__isEffekseerState === 0) {
          effekseerComponent == null ? void 0 : effekseerComponent.play();
        }
      } else {
        if (this.__isEffekseerState === 1) {
          effekseerComponent == null ? void 0 : effekseerComponent.pause();
        }
      }
      this.__isEffekseerState = channel.animatedValue.x;
      return true;
    }
    return false;
  }
  /**
   * Subscribes to animation component events.
   * @param type - The type of event to subscribe to
   * @param handler - The event handler function
   */
  static subscribe(type, handler) {
    _AnimationComponent.__pubsub.subscribe(type, handler);
  }
  /**
   * Sets whether this animation component is animating.
   * @param flg - True to enable animation, false to disable
   */
  setIsAnimating(flg) {
    this.__isAnimating = flg;
  }
  /**
   * Sets the active animation track for all animation components.
   * @param animationTrackName - The name of the animation track to activate
   */
  static setActiveAnimationForAll(engine, animationTrackName) {
    const components = engine.componentRepository.getComponentsWithType(_AnimationComponent);
    for (const component of components) {
      component.setActiveAnimationTrack(animationTrackName);
    }
  }
  /**
   * Sets the active animation track for this component.
   * @param animationTrackName - The name of the animation track to activate
   */
  setActiveAnimationTrack(animationTrackName) {
    for (const [, channel] of this.__animationTrack) {
      channel.animatedValue.setFirstActiveAnimationTrackName(animationTrackName);
    }
  }
  /**
   * Sets the second active animation track for blending purposes.
   * @param animationTrackName - The name of the second animation track to activate
   */
  setSecondActiveAnimationTrack(animationTrackName) {
    for (const [, channel] of this.__animationTrack) {
      channel.animatedValue.setSecondActiveAnimationTrackName(animationTrackName);
    }
  }
  /**
   * Gets the name of the currently active animation track.
   * @returns The name of the active animation track
   * @throws Error if no active animation track is found
   */
  getActiveAnimationTrack() {
    for (const [, channel] of this.__animationTrack) {
      return channel.animatedValue.getFirstActiveAnimationTrackName();
    }
    throw new Error("No active animation track found");
  }
  /**
   * Checks if this component has a specific animation for the given track and path.
   * @param trackName - The animation track name to check
   * @param pathName - The animation path name to check
   * @returns True if the animation exists, false otherwise
   */
  hasAnimation(trackName, pathName) {
    for (const [currentPathName, channel] of this.__animationTrack) {
      return pathName === currentPathName && channel.animatedValue.getFirstActiveAnimationTrackName() === trackName;
    }
    return false;
  }
  /**
   * Sets an animation channel for the specified path. If a channel already exists for the path,
   * it merges the new animation data with the existing one.
   * @param pathName - The name of the animation path (e.g., 'translate', 'rotate', 'scale')
   * @param animatedValueArg - The animated value containing animation data
   */
  setAnimation(pathName, animatedValueArg) {
    let animatedValue;
    const overwrittenTrackNames = /* @__PURE__ */ new Set();
    if (this.__animationTrack.has(pathName)) {
      const existedAnimatedValue = this.__animationTrack.get(pathName).animatedValue;
      const existedTrackNames = new Set(existedAnimatedValue.getAllTrackNames());
      for (const trackName of animatedValueArg.getAllTrackNames()) {
        if (existedTrackNames.has(trackName)) {
          overwrittenTrackNames.add(trackName);
        }
        existedAnimatedValue.setAnimationSampler(trackName, animatedValueArg.getAnimationSampler(trackName));
      }
      animatedValue = existedAnimatedValue;
    } else {
      this.__animationTrack.set(pathName, {
        animatedValue: animatedValueArg,
        target: {
          pathName,
          entity: this.entity
        }
      });
      animatedValue = animatedValueArg;
    }
    const trackNames = animatedValue.getAllTrackNames();
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.__engine);
    for (const trackName of trackNames) {
      if (overwrittenTrackNames.has(trackName)) {
        _AnimationComponent.__recalculateAnimationInfo(this.__engine, trackName);
        continue;
      }
      const newMinStartInputTime = animatedValue.getMinStartInputTime(trackName);
      const newMaxEndInputTime = animatedValue.getMaxEndInputTime(trackName);
      const existingInfo = animationGlobalInfo.get(trackName);
      const info = {
        name: trackName,
        minStartInputTime: existingInfo == null ? newMinStartInputTime : Math.min(existingInfo.minStartInputTime, newMinStartInputTime),
        maxEndInputTime: existingInfo == null ? newMaxEndInputTime : Math.max(existingInfo.maxEndInputTime, newMaxEndInputTime)
      };
      animationGlobalInfo.set(trackName, info);
      _AnimationComponent.__pubsub.publishAsync(_AnimationComponent.Event.ChangeAnimationInfo, {
        infoMap: new Map(animationGlobalInfo)
      });
    }
    if (!pathName.startsWith("vrmExpression/")) {
      this.entity.getTransform()._backupTransformAsRest();
    }
    this.__updateAnimationTrackFeatureHashes();
  }
  /**
   * Gets the animated value for the specified animation path.
   * @param pathName - The name of the animation path
   * @returns The animated value or undefined if not found
   */
  getAnimation(pathName) {
    var _a;
    return (_a = this.__animationTrack.get(pathName)) == null ? void 0 : _a.animatedValue;
  }
  /**
   * Gets the start input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The minimum start input time value
   */
  getStartInputValueOfAnimation(animationTrackName) {
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.__engine);
    return animationGlobalInfo.get(animationTrackName).minStartInputTime;
  }
  /**
   * Gets the end input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The maximum end input time value
   */
  getEndInputValueOfAnimation(animationTrackName) {
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.__engine);
    return animationGlobalInfo.get(animationTrackName).maxEndInputTime;
  }
  /**
   * Gets an array of all available animation track names.
   * @param engine - The engine instance to get the animation list for
   * @returns Array of animation track names
   */
  static getAnimationList(engine) {
    const animationGlobalInfo = this.getAnimationGlobalInfo(engine);
    return Array.from(animationGlobalInfo.keys());
  }
  /**
   * Gets the animation information for all tracks.
   * @param engine - The engine instance to get the animation info for
   * @returns A map containing animation track names and their corresponding information
   */
  static getAnimationInfo(engine) {
    return new Map(this.getAnimationGlobalInfo(engine));
  }
  /**
   * Gets all animation track names associated with this component.
   * @returns An array of animation track names
   */
  getAnimationTrackNames() {
    const trackNames = [];
    for (const [, channel] of this.__animationTrack) {
      trackNames.push(...channel.animatedValue.getAllTrackNames());
    }
    return trackNames;
  }
  /**
   * Gets the animation channels of the animation track.
   * @returns The channel maps of the animation track
   */
  getAnimationChannelsOfTrack() {
    return this.__animationTrack;
  }
  /**
   * Gets whether this component is currently animating.
   * @returns True if animating, false otherwise
   */
  get isAnimating() {
    return this.__isAnimating;
  }
  /**
   * Gets the global start input value for all animation components.
   * @param engine - The engine instance to get the start input value for
   * @returns The start input value
   */
  static getStartInputValue(engine) {
    const components = engine.componentRepository.getComponentsWithType(_AnimationComponent);
    if (components.length === 0) {
      return 0;
    }
    const animationGlobalInfo = this.getAnimationGlobalInfo(engine);
    const infoArray = Array.from(animationGlobalInfo.values());
    if (infoArray.length === 0) {
      return 0;
    }
    const lastInfo = infoArray[infoArray.length - 1];
    return lastInfo.minStartInputTime;
  }
  /**
   * Gets the global end input value for all animation components.
   * @param engine - The engine instance to get the end input value for
   * @returns The end input value
   */
  static getEndInputValue(engine) {
    const components = engine.componentRepository.getComponentsWithType(_AnimationComponent);
    if (components.length === 0) {
      return 0;
    }
    const animationGlobalInfo = this.getAnimationGlobalInfo(engine);
    const infoArray = Array.from(animationGlobalInfo.values());
    if (infoArray.length === 0) {
      return 0;
    }
    const lastInfo = infoArray[infoArray.length - 1];
    return lastInfo.maxEndInputTime;
  }
  /**
   * Gets the component type identifier for AnimationComponent.
   * @returns The component type identifier
   */
  static get componentTID() {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   * @returns The component type identifier
   */
  get componentTID() {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }
  /**
   * Gets the entity that owns this animation component.
   * @returns The entity which has this component
   */
  get entity() {
    return this.__engine.entityRepository.getEntity(this.__entityUid);
  }
  /**
   * Adds this animation component to an entity, extending the entity with animation methods.
   * @param base - The target entity to add this component to
   * @param _componentClass - The component class to add
   * @returns The entity extended with animation component methods
   */
  addThisComponentToEntity(base, _componentClass) {
    class AnimationEntity extends base.constructor {
      getAnimation() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationComponentTID);
      }
    }
    applyMixins(base, AnimationEntity);
    return base;
  }
  /**
   * Adds a keyframe to the specified animation track at the given frame.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frameToInsert - The frame number where to insert the keyframe
   * @param fps - The frames per second rate
   * @returns True if the keyframe was successfully added, false otherwise
   */
  addKeyFrame(trackName, pathName, frameToInsert, fps) {
    var _a;
    const secBegin = frameToInsert / fps;
    const input = secBegin;
    const secEnd = (frameToInsert + 1) / fps;
    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }
    const animatedValue = channel.animatedValue;
    (_a = animatedValue.invalidateAnimationCache) == null ? void 0 : _a.call(animatedValue);
    const i = AnimationAttribute.fromString(pathName).index;
    const globalTime = _AnimationComponent.getGlobalTime(this.__engine);
    const output = __interpolate(animatedValue.getAnimationSampler(trackName), globalTime, i);
    if (animatedValue.getAnimationSampler(trackName).input.length === 0) {
      const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
      inputArray.push(input);
      animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
      const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
      outputArray.push(...output);
      animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
    } else if (animatedValue.getAnimationSampler(trackName).input.length === 1) {
      const existedInput = animatedValue.getAnimationSampler(trackName).input[0];
      if (secEnd < existedInput) {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.unshift(input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.unshift(...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      } else if (existedInput < secBegin) {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.push(input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.push(...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      } else {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.splice(0, 0, input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.splice(0, 0, ...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      }
    } else {
      for (let i2 = 0; i2 < animatedValue.getAnimationSampler(trackName).input.length; i2++) {
        const existedInput = animatedValue.getAnimationSampler(trackName).input[i2];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            animatedValue.getAnimationSampler(trackName).input[i2] = input;
            for (let j = 0; j < animatedValue.getAnimationSampler(trackName).outputComponentN; j++) {
              animatedValue.getAnimationSampler(trackName).output[i2 * animatedValue.getAnimationSampler(trackName).outputComponentN + j] = output[j];
            }
          } else {
            const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
            inputArray.splice(i2, 0, input);
            animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
            const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
            outputArray.splice(i2 * animatedValue.getAnimationSampler(trackName).outputComponentN, 0, ...output);
            animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
          }
          break;
        }
      }
    }
    return true;
  }
  /**
   * Adds a keyframe with a specific value to the specified animation track at the given frame.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frameToInsert - The frame number where to insert the keyframe
   * @param output - The array of output values for the keyframe
   * @param fps - The frames per second rate
   * @returns True if the keyframe was successfully added, false otherwise
   */
  addKeyFrameWithValue(trackName, pathName, frameToInsert, output, fps) {
    var _a;
    const secBegin = frameToInsert / fps;
    const input = secBegin;
    const secEnd = (frameToInsert + 1) / fps;
    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }
    const animatedValue = channel.animatedValue;
    (_a = animatedValue.invalidateAnimationCache) == null ? void 0 : _a.call(animatedValue);
    if (animatedValue.getAnimationSampler(trackName).input.length === 0) {
      const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
      inputArray.push(input);
      animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
      const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
      outputArray.push(...output);
      animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
    } else if (animatedValue.getAnimationSampler(trackName).input.length === 1) {
      const existedInput = animatedValue.getAnimationSampler(trackName).input[0];
      if (secEnd < existedInput) {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.unshift(input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.unshift(...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      } else if (existedInput < secBegin) {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.push(input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.push(...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      } else {
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.splice(0, 0, input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.splice(0, 0, ...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      }
    } else {
      for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
        const existedInput = animatedValue.getAnimationSampler(trackName).input[i];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            animatedValue.getAnimationSampler(trackName).input[i] = input;
            for (let j = 0; j < animatedValue.getAnimationSampler(trackName).outputComponentN; j++) {
              animatedValue.getAnimationSampler(trackName).output[i * animatedValue.getAnimationSampler(trackName).outputComponentN + j] = output[j];
            }
          } else {
            const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
            inputArray.splice(i, 0, input);
            animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
            const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
            outputArray.splice(i * animatedValue.getAnimationSampler(trackName).outputComponentN, 0, ...output);
            animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
          }
          break;
        }
      }
    }
    return true;
  }
  /**
   * Deletes keyframes at the specified frame for the given animation track and path.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frameToDelete - The frame number where to delete keyframes
   * @param fps - The frames per second rate
   * @returns True if keyframes were successfully deleted, false otherwise
   */
  deleteKeysAtFrame(trackName, pathName, frameToDelete, fps) {
    var _a;
    const secBegin = frameToDelete / fps;
    const secEnd = (frameToDelete + 1) / fps;
    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }
    const animatedValue = channel.animatedValue;
    (_a = animatedValue.invalidateAnimationCache) == null ? void 0 : _a.call(animatedValue);
    for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
      const input = animatedValue.getAnimationSampler(trackName).input[i];
      if (secBegin <= input && input < secEnd) {
        const input2 = Array.from(animatedValue.getAnimationSampler(trackName).input);
        input2.splice(i, 1);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(input2);
        const output = Array.from(animatedValue.getAnimationSampler(trackName).output);
        output.splice(
          i * animatedValue.getAnimationSampler(trackName).outputComponentN,
          animatedValue.getAnimationSampler(trackName).outputComponentN
        );
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(output);
      }
    }
    return true;
  }
  /**
   * Checks if keyframes exist at the specified frame for the given animation track and path.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frame - The frame number to check
   * @param fps - The frames per second rate
   * @returns True if keyframes exist at the frame, false otherwise
   */
  hasKeyFramesAtFrame(trackName, pathName, frame, fps) {
    const secBegin = frame / fps;
    const secEnd = (frame + 1) / fps;
    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }
    const animatedValue = channel.animatedValue;
    for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
      const input = animatedValue.getAnimationSampler(trackName).input[i];
      if (secBegin <= input && input < secEnd) {
        return true;
      }
    }
    return false;
  }
  /**
   * Gets the animation global info map for a specific engine.
   * Creates a new map if one doesn't exist for the engine.
   * @param engine - The engine instance to get the animation info for
   * @returns The animation global info map for the engine
   */
  static getAnimationGlobalInfo(engine) {
    let infoMap = this.__animationGlobalInfoMap.get(engine);
    if (infoMap == null) {
      infoMap = /* @__PURE__ */ new Map();
      this.__animationGlobalInfoMap.set(engine, infoMap);
    }
    return infoMap;
  }
  static __recalculateAnimationInfo(engine, trackName) {
    let minStartInputTime = Number.POSITIVE_INFINITY;
    let maxEndInputTime = Number.NEGATIVE_INFINITY;
    const components = engine.componentRepository.getComponentsWithType(_AnimationComponent);
    for (const component of components) {
      for (const [, channel] of component.__animationTrack) {
        if (!channel.animatedValue.getAllTrackNames().includes(trackName)) {
          continue;
        }
        const sampler = channel.animatedValue.getAnimationSampler(trackName);
        if (sampler.input.length === 0) {
          continue;
        }
        minStartInputTime = Math.min(minStartInputTime, sampler.input[0]);
        maxEndInputTime = Math.max(maxEndInputTime, sampler.input[sampler.input.length - 1]);
      }
    }
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(engine);
    if (Number.isFinite(minStartInputTime) && Number.isFinite(maxEndInputTime)) {
      animationGlobalInfo.set(trackName, {
        name: trackName,
        minStartInputTime,
        maxEndInputTime
      });
    } else {
      animationGlobalInfo.delete(trackName);
    }
    _AnimationComponent.__pubsub.publishAsync(_AnimationComponent.Event.ChangeAnimationInfo, {
      infoMap: new Map(animationGlobalInfo)
    });
  }
  /**
   * Sets the animation state for the specified engine.
   * @param engine - The engine instance to set the animation state for
   * @param flag - True to enable animation, false to disable
   */
  static setIsAnimating(engine, flag) {
    AnimationStateRepository.setIsAnimating(engine, flag);
  }
  /**
   * Gets the animation state for the specified engine.
   * @param engine - The engine instance to get the animation state for
   * @returns True if animation is enabled for the engine, defaults to true if not set
   */
  static getIsAnimating(engine) {
    return AnimationStateRepository.getIsAnimating(engine);
  }
  /**
   * Sets the global animation time for the specified engine.
   * @param engine - The engine instance to set the global time for
   * @param time - The global animation time in seconds
   */
  static setGlobalTime(engine, time) {
    AnimationStateRepository.setGlobalTime(engine, time);
  }
  /**
   * Gets the global animation time for the specified engine.
   * @param engine - The engine instance to get the global time for
   * @returns The global animation time for the engine, defaults to 0 if not set
   */
  static getGlobalTime(engine) {
    return AnimationStateRepository.getGlobalTime(engine);
  }
  /**
   * Performs a shallow copy of another animation component's data into this component.
   * @param component_ - The source animation component to copy from
   * @override
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.__animationTrack = new Map(component.__animationTrack);
    this.__animationTrackFeatureHashes = new Map(component.__animationTrackFeatureHashes);
    AnimationStateRepository.markAnimationBindingChanged();
    this.__isEffekseerState = component.__isEffekseerState;
    this.__isAnimating = component.__isAnimating;
  }
  /**
   * Sets up animation retargeting from a source entity to this entity.
   * @param retarget - The retargeting interface that defines how to map animations
   * @param postfixToTrackName - Optional postfix to append to track names
   * @param excludedPathNames - Animation paths to omit while copying source tracks
   * @returns An array of created track names
   * @private
   */
  _setRetarget(retarget, postfixToTrackName, excludedPathNames = []) {
    const srcEntity = retarget.getEntity();
    const srcAnim = srcEntity.tryToGetAnimation();
    const dstEntity = this.entity;
    this.entity.getTransform()._backupTransformAsRest();
    if (Is.not.exist(srcAnim)) {
      return [];
    }
    srcAnim.useGlobalTime = false;
    const trackNames = [];
    for (const [pathName, channel] of srcAnim.__animationTrack) {
      if (excludedPathNames.includes(channel.target.pathName)) {
        continue;
      }
      const animatedValue = channel.animatedValue;
      for (const _trackName of animatedValue.getAllTrackNames()) {
        const trackName = _trackName + (postfixToTrackName != null ? postfixToTrackName : "");
        trackNames.push(trackName);
        const input = animatedValue.getAnimationSampler(_trackName).input;
        if (channel.target.pathName === "translate") {
          const outputs = retargetTranslate(input, srcAnim);
          const samplers = /* @__PURE__ */ new Map();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(pathName, newAnimatedValue);
        }
        if (channel.target.pathName === "quaternion") {
          const outputs = retargetQuaternion(input, srcAnim);
          const samplers = /* @__PURE__ */ new Map();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 4,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod
          });
          const newAnimatedValue = new AnimatedQuaternion(samplers, trackName);
          this.setAnimation(pathName, newAnimatedValue);
        }
        if (channel.target.pathName === "scale") {
          const outputs = retargetScale(input, srcAnim);
          const samplers = /* @__PURE__ */ new Map();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(pathName, newAnimatedValue);
        }
      }
    }
    function retargetTranslate(input, srcAnim2) {
      const outputsTranslation = new Float32Array(input.length * 3);
      for (let i = 0; i < input.length; i++) {
        srcAnim2.time = input[i];
        srcAnim2.__applyAnimation();
        const outputTranslation = retarget.retargetTranslate(dstEntity);
        outputsTranslation[i * 3 + 0] = outputTranslation.x;
        outputsTranslation[i * 3 + 1] = outputTranslation.y;
        outputsTranslation[i * 3 + 2] = outputTranslation.z;
      }
      return outputsTranslation;
    }
    function retargetQuaternion(input, srcAnim2) {
      const outputsQuaternion = new Float32Array(input.length * 4);
      for (let i = 0; i < input.length; i++) {
        srcAnim2.time = input[i];
        srcAnim2.__applyAnimation();
        const outputQuaternion = retarget.retargetQuaternion(dstEntity);
        outputsQuaternion[i * 4 + 0] = outputQuaternion.x;
        outputsQuaternion[i * 4 + 1] = outputQuaternion.y;
        outputsQuaternion[i * 4 + 2] = outputQuaternion.z;
        outputsQuaternion[i * 4 + 3] = outputQuaternion.w;
      }
      return outputsQuaternion;
    }
    function retargetScale(input, srcAnim2) {
      const outputsScale = new Float32Array(input.length * 3);
      for (let i = 0; i < input.length; i++) {
        srcAnim2.time = input[i];
        srcAnim2.__applyAnimation();
        const outputScale = retarget.retargetScale(dstEntity);
        outputsScale[i * 3 + 0] = outputScale.x;
        outputsScale[i * 3 + 1] = outputScale.y;
        outputsScale[i * 3 + 2] = outputScale.z;
      }
      return outputsScale;
    }
    return trackNames;
  }
  /**
   * Resets all animation tracks, clearing all animation data from this component.
   */
  resetAnimationTracks() {
    const trackNames = new Set(this.getAnimationTrackNames());
    this.__animationTrack.clear();
    for (const trackName of trackNames) {
      _AnimationComponent.__recalculateAnimationInfo(this.__engine, trackName);
    }
    this.__updateAnimationTrackFeatureHashes();
  }
  /**
   * Resets a specific animation track by removing its animation sampler data.
   * @param trackName - The name of the animation track to reset
   */
  resetAnimationTrack(trackName) {
    const emptyPathNames = [];
    for (const [pathName, channel] of this.__animationTrack) {
      const animatedValue = channel.animatedValue;
      const rebindsFirstActiveSampler = animatedValue.getFirstActiveAnimationSamplerTrackName() === trackName;
      const rebindsSecondActiveSampler = animatedValue.getSecondActiveAnimationSamplerTrackName() === trackName;
      animatedValue.deleteAnimationSampler(trackName);
      const remainingTrackNames = animatedValue.getAllTrackNames();
      if (remainingTrackNames.length === 0) {
        emptyPathNames.push(pathName);
        continue;
      }
      const fallbackTrackName = remainingTrackNames[0];
      if (rebindsFirstActiveSampler) {
        animatedValue.setFirstActiveAnimationTrackName(fallbackTrackName);
      }
      if (rebindsSecondActiveSampler) {
        animatedValue.setSecondActiveAnimationTrackName(fallbackTrackName);
      }
    }
    for (const pathName of emptyPathNames) {
      this.__animationTrack.delete(pathName);
    }
    _AnimationComponent.__recalculateAnimationInfo(this.__engine, trackName);
    this.__updateAnimationTrackFeatureHashes();
  }
  /**
   * Resets all animation tracks that have names ending with the specified postfix.
   * @param postfix - The postfix to match against track names
   */
  resetAnimationTrackByPostfix(postfix) {
    const trackNames = new Set(this.getAnimationTrackNames());
    for (const trackName of trackNames) {
      if (trackName.endsWith(postfix)) {
        this.resetAnimationTrack(trackName);
      }
    }
  }
  currentTrackFeatureHash() {
    return this.__animationTrackFeatureHashes.get(this.getActiveAnimationTrack());
  }
  /**
   * Gets the feature hash for a specific animation track.
   * @param trackName - The animation track whose feature hash should be returned
   * @returns The feature hash, or undefined when the track is not registered
   */
  getAnimationTrackFeatureHash(trackName) {
    return this.__animationTrackFeatureHashes.get(trackName);
  }
  /**
   * Destroys this component, cleaning up resources and clearing animation data.
   * @override
   */
  _destroy() {
    const trackNames = new Set(this.getAnimationTrackNames());
    super._destroy();
    this.__animationTrack.clear();
    this.__animationTrackFeatureHashes.clear();
    this.__isAnimating = false;
    AnimationStateRepository.markAnimationBindingChanged();
    for (const trackName of trackNames) {
      _AnimationComponent.__recalculateAnimationInfo(this.__engine, trackName);
    }
  }
  __updateAnimationTrackFeatureHashes() {
    AnimationStateRepository.markAnimationBindingChanged();
    const featureMap = /* @__PURE__ */ new Map();
    for (const [pathName, channel] of this.__animationTrack) {
      for (const trackName of channel.animatedValue.getAllTrackNames()) {
        const sampler = channel.animatedValue.getAnimationSampler(trackName);
        let feature = featureMap.get(trackName);
        if (Is.not.exist(feature)) {
          feature = {
            trackName,
            pathNames: /* @__PURE__ */ new Set(),
            minStartInputTime: Number.POSITIVE_INFINITY,
            maxEndInputTime: Number.NEGATIVE_INFINITY,
            totalKeyframes: 0
          };
          featureMap.set(trackName, feature);
        }
        feature.pathNames.add(pathName);
        if (sampler.input.length > 0) {
          feature.minStartInputTime = Math.min(feature.minStartInputTime, sampler.input[0]);
          feature.maxEndInputTime = Math.max(feature.maxEndInputTime, sampler.input[sampler.input.length - 1]);
          feature.totalKeyframes += sampler.input.length;
        }
      }
    }
    for (const [, feature] of featureMap) {
      if (!Number.isFinite(feature.minStartInputTime)) {
        feature.minStartInputTime = 0;
      }
      if (!Number.isFinite(feature.maxEndInputTime)) {
        feature.maxEndInputTime = 0;
      }
    }
    const hashMap = /* @__PURE__ */ new Map();
    const sortedTrackNames = Array.from(featureMap.keys()).sort();
    for (const trackName of sortedTrackNames) {
      const feature = featureMap.get(trackName);
      const serialized = [
        trackName,
        Array.from(feature.pathNames).sort().join(","),
        feature.minStartInputTime,
        feature.maxEndInputTime,
        feature.totalKeyframes
      ].join("|");
      const hash = DataUtil.toCRC32(serialized);
      hashMap.set(trackName, hash);
    }
    this.__animationTrackFeatureHashes = hashMap;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    _AnimationComponent.__animationGlobalInfoMap.delete(engine);
  }
};
/** Map to store animation global info per Engine instance for multi-engine support */
_AnimationComponent.__animationGlobalInfoMap = /* @__PURE__ */ new Map();
// Event for pubsub of notifications
_AnimationComponent.Event = {
  ChangeAnimationInfo,
  PlayEnd
};
_AnimationComponent.__tmpQuat = MutableQuaternion.identity();
_AnimationComponent.__tmpPos = MutableVector3.zero();
_AnimationComponent.__tmpScale = MutableVector3.one();
_AnimationComponent.__pubsub = new EventPubSub();
var AnimationComponent = _AnimationComponent;
export {
  AnimationComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEVmZmVrc2VlckNvbXBvbmVudCB9IGZyb20gJy4uLy4uLy4uL2VmZmVrc2Vlci9FZmZla3NlZXJDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUge1xuICBBbmltYXRpb25DaGFubmVsLFxuICBBbmltYXRpb25Db21wb25lbnRFdmVudFR5cGUsXG4gIEFuaW1hdGlvbkluZm8sXG4gIEFuaW1hdGlvblBhdGhOYW1lLFxuICBBbmltYXRpb25TYW1wbGVyLFxuICBBbmltYXRpb25UcmFjayxcbiAgQW5pbWF0aW9uVHJhY2tOYW1lLFxufSBmcm9tICcuLi8uLi8uLi90eXBlcy9BbmltYXRpb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRJRCwgSW5kZXgsIFNlY29uZCwgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL2dsVEYyJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zIH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHlSZXBvc2l0b3J5JztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zJztcbmltcG9ydCB7IEFuaW1hdGlvbkF0dHJpYnV0ZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0FuaW1hdGlvbkF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IElBbmltYXRpb25FbnRpdHksIElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTWF0aFV0aWwsIHR5cGUgU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aCc7XG5pbXBvcnQgeyBBbmltYXRlZFF1YXRlcm5pb24gfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkUXVhdGVybmlvbic7XG5pbXBvcnQgeyBBbmltYXRlZFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL0FuaW1hdGVkVmVjdG9yMyc7XG5pbXBvcnQgdHlwZSB7IEFuaW1hdGVkVmVjdG9yTiB9IGZyb20gJy4uLy4uL21hdGgvQW5pbWF0ZWRWZWN0b3JOJztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGVkVmFsdWUgfSBmcm9tICcuLi8uLi9tYXRoL0lBbmltYXRlZFZhbHVlJztcbmltcG9ydCB7IE11dGFibGVRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlUXVhdGVybmlvbic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHR5cGUgeyBRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vLi4vbWF0aC9RdWF0ZXJuaW9uJztcbmltcG9ydCB0eXBlIHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBEYXRhVXRpbCB9IGZyb20gJy4uLy4uL21pc2MvRGF0YVV0aWwnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyB0eXBlIEV2ZW50SGFuZGxlciwgRXZlbnRQdWJTdWIgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRXZlbnRQdWJTdWInO1xuaW1wb3J0IHR5cGUgeyBCbGVuZFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vQmxlbmRTaGFwZS9CbGVuZFNoYXBlQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBTY2VuZUdyYXBoQ29tcG9uZW50IH0gZnJvbSAnLi4vU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGlvblJldGFyZ2V0IH0gZnJvbSAnLi4vU2tlbGV0YWwnO1xuaW1wb3J0IHR5cGUgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcbmltcG9ydCB7IF9faW50ZXJwb2xhdGUgfSBmcm9tICcuL0FuaW1hdGlvbk9wcyc7XG5pbXBvcnQgeyBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkgfSBmcm9tICcuL0FuaW1hdGlvblN0YXRlUmVwb3NpdG9yeSc7XG5cbmNvbnN0IENoYW5nZUFuaW1hdGlvbkluZm8gPSBTeW1ib2woJ0FuaW1hdGlvbkNvbXBvbmVudEV2ZW50Q2hhbmdlQW5pbWF0aW9uSW5mbycpO1xuY29uc3QgUGxheUVuZCA9IFN5bWJvbCgnQW5pbWF0aW9uQ29tcG9uZW50RXZlbnRQbGF5RW5kJyk7XG5jb25zdCBWcm1FeHByZXNzaW9uUGF0aFByZWZpeCA9ICd2cm1FeHByZXNzaW9uLyc7XG5cbnR5cGUgQW5pbWF0aW9uVHJhY2tGZWF0dXJlID0ge1xuICB0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZTtcbiAgcGF0aE5hbWVzOiBTZXQ8QW5pbWF0aW9uUGF0aE5hbWU+O1xuICBtaW5TdGFydElucHV0VGltZTogU2Vjb25kO1xuICBtYXhFbmRJbnB1dFRpbWU6IFNlY29uZDtcbiAgdG90YWxLZXlmcmFtZXM6IG51bWJlcjtcbn07XG5cbi8qKlxuICogQSBjb21wb25lbnQgdGhhdCBtYW5hZ2VzIGFuaW1hdGlvbiBkYXRhIGFuZCBhcHBsaWVzIGFuaW1hdGlvbiB0cmFuc2Zvcm1hdGlvbnMgdG8gZW50aXRpZXMuXG4gKiBUaGlzIGNvbXBvbmVudCBoYW5kbGVzIHZhcmlvdXMgdHlwZXMgb2YgYW5pbWF0aW9ucyBpbmNsdWRpbmcgdHJhbnNmb3JtLCBibGVuZCBzaGFwZSwgbWF0ZXJpYWwsXG4gKiBsaWdodCwgY2FtZXJhLCBhbmQgRWZmZWtzZWVyIHBhcnRpY2xlIHN5c3RlbSBhbmltYXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgQW5pbWF0aW9uQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgLy8vIGlubmVyIHN0YXRlcyAvLy9cbiAgLy8gVGhlIG5hbWUgb2YgdGhlIGN1cnJlbnQgQWN0aXZlIFRyYWNrXG4gIHByaXZhdGUgX19hbmltYXRpb25CbGVuZGluZ1JhdGlvID0gMDsgLy8gdGhlIHZhbHVlIHJhbmdlIGlzIFswLDFdXG5cbiAgLy8gQW5pbWF0aW9uIERhdGEgb2YgZWFjaCBBbmltYXRpb25Db21wb25lbnRcbiAgcHJpdmF0ZSBfX2FuaW1hdGlvblRyYWNrOiBBbmltYXRpb25UcmFjayA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2FuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2hlczogTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgLyoqIE1hcCB0byBzdG9yZSBhbmltYXRpb24gZ2xvYmFsIGluZm8gcGVyIEVuZ2luZSBpbnN0YW5jZSBmb3IgbXVsdGktZW5naW5lIHN1cHBvcnQgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hbmltYXRpb25HbG9iYWxJbmZvTWFwOiBNYXA8RW5naW5lLCBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25JbmZvPj4gPSBuZXcgTWFwKCk7XG5cbiAgcHJpdmF0ZSBfX2lzRWZmZWtzZWVyU3RhdGUgPSAtMTtcblxuICAvKiogUmV1c2VkIG1hcCBmb3IgVlJNIGV4cHJlc3Npb24gd2VpZ2h0cyB0byBhdm9pZCBhIHBlci1mcmFtZSBhbGxvY2F0aW9uLiAqL1xuICBwcml2YXRlIF9fdnJtRXhwcmVzc2lvbldlaWdodHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIC8qKiBDYWNoZSBvZiB0aGUgbGVhZiBwYXJhbWV0ZXIgbmFtZSBvZiBgbWF0ZXJpYWwvLi4uYCBhbmltYXRpb24gcGF0aHMuICovXG4gIHByaXZhdGUgX19tYXRlcmlhbFBhcmFtZXRlck5hbWVDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cbiAgLy8vIGZsYWdzIC8vL1xuICBwcml2YXRlIF9faXNBbmltYXRpbmcgPSB0cnVlO1xuICBwdWJsaWMgaXNMb29wID0gdHJ1ZTtcblxuICAvLyBHbG9iYWwgYW5pbWF0aW9uIHRpbWUgaW4gUmhvZG9uaXRlXG4gIHB1YmxpYyB1c2VHbG9iYWxUaW1lID0gdHJ1ZTtcblxuICAvLyBhbmltYXRpb24gdGltZSBpbiB0aGlzIGFuaW1hdGlvbiBjb21wb25lbnRcbiAgcHVibGljIHRpbWUgPSAwO1xuXG4gIC8vIEV2ZW50IGZvciBwdWJzdWIgb2Ygbm90aWZpY2F0aW9uc1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEV2ZW50ID0ge1xuICAgIENoYW5nZUFuaW1hdGlvbkluZm8sXG4gICAgUGxheUVuZCxcbiAgfTtcblxuICBwcml2YXRlIHN0YXRpYyBfX3RtcFF1YXQgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFBvcyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBTY2FsZSA9IE11dGFibGVWZWN0b3IzLm9uZSgpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fcHVic3ViID0gbmV3IEV2ZW50UHViU3ViKCk7XG5cbiAgLy8vIExpZmVDeWNsZSBNZXRob2RzIC8vL1xuXG4gIC8qKlxuICAgKiBDb21wb25lbnQgbG9hZCBsaWZlY3ljbGUgbWV0aG9kLiBNb3ZlcyB0aGUgY29tcG9uZW50IHRvIHRoZSBMb2dpYyBwcm9jZXNzIHN0YWdlLlxuICAgKi9cbiAgJGxvYWQoKSB7XG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBvbmVudCBsb2dpYyBsaWZlY3ljbGUgbWV0aG9kLiBBcHBsaWVzIGFuaW1hdGlvbiBpZiBhbmltYXRpb24gaXMgZW5hYmxlZC5cbiAgICpcbiAgICogIyMgRWFybHkgUmV0dXJuIE9wdGltaXphdGlvbiBmb3IgVlJNIE1vZGVscyB3aXRoIFNoYXJlZCBTa2VsZXRvblxuICAgKlxuICAgKiBXaGVuIG11bHRpcGxlIFZSTSBtb2RlbHMgc2hhcmUgdGhlIHNhbWUgc2tlbGV0b24gKGpvaW50IGVudGl0aWVzKSwgYW5pbWF0aW9uXG4gICAqIGNhbGN1bGF0aW9ucyBvbmx5IG5lZWQgdG8gYmUgcGVyZm9ybWVkIG9uY2UgcGVyIGZyYW1lLiBUaGlzIG9wdGltaXphdGlvbiB3b3Jrc1xuICAgKiBieSBjaGVja2luZyBpZiB0aGUgU2tlbGV0YWxDb21wb25lbnQncyBza2lubmluZyBjYWNoZSB3aWxsIGJlIHVzZWQgZm9yIHRoaXMgZW50aXR5LlxuICAgKlxuICAgKiBUaGUgb3B0aW1pemF0aW9uIGZsb3c6XG4gICAqIDEuIFNrZWxldGFsQ29tcG9uZW50IHRyYWNrcyB3aGljaCBqb2ludCBFbnRpdHlVSURzIGhhZCBza2lubmluZyBjYWNoZSBoaXRzXG4gICAqIDIuIEpvaW50cyBiZWxvbmdpbmcgdG8gXCJsZWFkZXJcIiBTa2VsZXRhbENvbXBvbmVudHMgKHRob3NlIHRoYXQgY29tcHV0ZSBza2lubmluZylcbiAgICogICAgYXJlIGV4Y2x1ZGVkIGZyb20gdGhpcyB0cmFja2luZ1xuICAgKiAzLiBBbmltYXRpb25Db21wb25lbnQgY2hlY2tzIGlmIGl0cyBlbnRpdHkgaXMgaW4gdGhlIGNhY2hlZCBsaXN0XG4gICAqIDQuIElmIGNhY2hlZCwgZWFybHkgcmV0dXJuIHNraXBzIGFuaW1hdGlvbiBjYWxjdWxhdGlvbiAoc2tpbm5pbmcgcmVzdWx0IHdpbGwgYmUgcmV1c2VkKVxuICAgKlxuICAgKiBUaGlzIHNpZ25pZmljYW50bHkgcmVkdWNlcyBDUFUgb3ZlcmhlYWQgd2hlbiBtYW55IFZSTSBtb2RlbHMgc2hhcmUgdGhlIHNhbWUgc2tlbGV0b24uXG4gICAqL1xuICAkbG9naWMoKSB7XG4gICAgLy8gU2tpcCBpZiBhbmltYXRpb24gaXMgZ2xvYmFsbHkgb3IgbG9jYWxseSBkaXNhYmxlZFxuICAgIGlmICghdGhpcy5pc0FuaW1hdGlvbkVuYWJsZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBFYXJseSBSZXR1cm4gT3B0aW1pemF0aW9uIGZvciBWUk0gTW9kZWxzIHdpdGggU2hhcmVkIFNrZWxldG9uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFdoZW4gbXVsdGlwbGUgVlJNIG1vZGVscyBzaGFyZSB0aGUgc2FtZSBhbmltYXRpb24gKHNhbWUgc2tlbGV0b24gc3RydWN0dXJlKSxcbiAgICAvLyBvbmx5IG9uZSBtb2RlbCAodGhlIFwibGVhZGVyXCIpIG5lZWRzIHRvIGNvbXB1dGUgYW5pbWF0aW9uIHZhbHVlcy5cbiAgICAvLyBPdGhlciBtb2RlbHMgKFwiZm9sbG93ZXJzXCIpIGNhbiBza2lwIGFuaW1hdGlvbiBjYWxjdWxhdGlvbiBlbnRpcmVseSBiZWNhdXNlXG4gICAgLy8gdGhlaXIgU2tlbGV0YWxDb21wb25lbnQgd2lsbCByZXVzZSB0aGUgY2FjaGVkIHNraW5uaW5nIHJlc3VsdCBmcm9tIHRoZSBsZWFkZXIuXG4gICAgLy9cbiAgICAvLyBIb3cgaXQgd29ya3M6XG4gICAgLy8gMS4gU2tlbGV0YWxDb21wb25lbnQgdHJhY2tzIHdoaWNoIGpvaW50cyBoYWQgc2tpbm5pbmcgY2FjaGUgaGl0cyBpbiB0aGUgcHJldmlvdXMgZnJhbWVcbiAgICAvLyAyLiBKb2ludHMgYmVsb25naW5nIHRvIFwibGVhZGVyXCIgU2tlbGV0YWxDb21wb25lbnRzIGFyZSBleGNsdWRlZCAobXVzdCBjb250aW51ZSBhbmltYXRpbmcpXG4gICAgLy8gMy4gSm9pbnRzIGJlbG9uZ2luZyB0byBcImZvbGxvd2VyXCIgU2tlbGV0YWxDb21wb25lbnRzIGFyZSByZWdpc3RlcmVkIGZvciBlYXJseSByZXR1cm5cbiAgICAvLyA0LiBUaGlzIEFuaW1hdGlvbkNvbXBvbmVudCBjaGVja3MgaWYgaXRzIGVudGl0eSBpcyByZWdpc3RlcmVkXG4gICAgLy9cbiAgICAvLyBUd28gc2NlbmFyaW9zOlxuICAgIC8vIC0gc2hhbGxvd0NvcHk6IEpvaW50cyBhcmUgc2hhcmVkIChzYW1lIGVudGl0eVVJRCkgXHUyMTkyIG5vIGVhcmx5IHJldHVybiBuZWVkZWRcbiAgICAvLyAgICh0aGUgc2FtZSBBbmltYXRpb25Db21wb25lbnQgaW5zdGFuY2UgcHJvY2Vzc2VzIHRoZSBzaGFyZWQgam9pbnQgb25jZSlcbiAgICAvLyAtIFNlcGFyYXRlIGxvYWQ6IEpvaW50cyBhcmUgZGlmZmVyZW50IChkaWZmZXJlbnQgZW50aXR5VUlELCBzYW1lIGpvaW50SW5kZXgpXG4gICAgLy8gICBcdTIxOTIgZWFybHkgcmV0dXJuIGVuYWJsZWQsIHNpZ25pZmljYW50bHkgcmVkdWNpbmcgQ1BVIG92ZXJoZWFkXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGlmIChBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuaXNFbnRpdHlDYWNoZWQodGhpcy5fX2VudGl0eVVpZCwgdGhpcy5fX2VuZ2luZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBBcHBseSBhbmltYXRpb24gY2FsY3VsYXRpb25zICh1cGRhdGUgam9pbnQgdHJhbnNmb3JtcylcbiAgICB0aGlzLl9fYXBwbHlBbmltYXRpb24oKTtcbiAgfVxuXG4gIHB1YmxpYyBpc0FuaW1hdGlvbkVuYWJsZWQoKSB7XG4gICAgaWYgKEFuaW1hdGlvbkNvbXBvbmVudC5nZXRJc0FuaW1hdGluZyh0aGlzLl9fZW5naW5lKSAmJiB0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFuaW1hdGlvbiBibGVuZGluZyByYXRpbyBhbmQgYXBwbGllcyB0aGUgYW5pbWF0aW9uLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgYmxlbmRpbmcgcmF0aW8gdmFsdWUgYmV0d2VlbiAwIGFuZCAxXG4gICAqL1xuICBzZXQgYW5pbWF0aW9uQmxlbmRpbmdSYXRpbyh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fX2FuaW1hdGlvbkJsZW5kaW5nUmF0aW8gPSB2YWx1ZTtcbiAgICB0aGlzLl9fYXBwbHlBbmltYXRpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBhbmltYXRpb24gYmxlbmRpbmcgcmF0aW8gd2l0aG91dCBldmFsdWF0aW5nIGFuaW1hdGlvbiBjaGFubmVscyBpbW1lZGlhdGVseS5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGJsZW5kaW5nIHJhdGlvIHZhbHVlIGJldHdlZW4gMCBhbmQgMVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zZXRBbmltYXRpb25CbGVuZGluZ1JhdGlvV2l0aG91dEFwcGx5aW5nKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fYW5pbWF0aW9uQmxlbmRpbmdSYXRpbyA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGJsZW5kaW5nIHJhdGlvLlxuICAgKiBAcmV0dXJucyBUaGUgYmxlbmRpbmcgcmF0aW8gdmFsdWUgYmV0d2VlbiAwIGFuZCAxXG4gICAqL1xuICBnZXQgYW5pbWF0aW9uQmxlbmRpbmdSYXRpbygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2FuaW1hdGlvbkJsZW5kaW5nUmF0aW87XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhbmltYXRpb24gdG8gdGhlIGVudGl0eSBiYXNlZCBvbiB0aGUgY3VycmVudCB0aW1lIGFuZCBhbmltYXRpb24gdHJhY2tzLlxuICAgKiBIYW5kbGVzIHZhcmlvdXMgYW5pbWF0aW9uIHR5cGVzIGluY2x1ZGluZyB0cmFuc2Zvcm0sIGJsZW5kIHNoYXBlLCBtYXRlcmlhbCwgbGlnaHQsIGNhbWVyYSwgYW5kIEVmZmVrc2Vlci5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19hcHBseUFuaW1hdGlvbigpIHtcbiAgICBsZXQgdGltZSA9IHRoaXMudGltZTtcbiAgICBpZiAodGhpcy51c2VHbG9iYWxUaW1lKSB7XG4gICAgICB0aW1lID0gQW5pbWF0aW9uQ29tcG9uZW50LmdldEdsb2JhbFRpbWUodGhpcy5fX2VuZ2luZSk7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmb3JtQ29tcG9uZW50ID0gKHRoaXMuZW50aXR5IGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHkpLmdldFRyYW5zZm9ybSgpO1xuICAgIC8vIFBoeXNpY3Mgc3VidHJlZXMgbXVzdCBhbHdheXMgcmVjZWl2ZSB0aGUgbG9jYWwgdHJhbnNmb3JtIGJlY2F1c2UgdGhlaXIgc2V0dGVycyBub3RpZnkgdGhlXG4gICAgLy8gcGh5c2ljcyBzdHJhdGVnaWVzIHdpdGggdGhlIHBhcmVudCB3b3JsZCB0cmFuc2Zvcm0gKHNlZSBfX3Nob3VsZFdyaXRlVHJhbnNmb3JtVmFsdWUpLlxuICAgIGNvbnN0IGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZSA9ICEodGhpcy5lbnRpdHkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eSkuZ2V0U2NlbmVHcmFwaCgpXG4gICAgICAuX2hhc1BoeXNpY3NDb21wb25lbnRJblN1YnRyZWU7XG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgIGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0RWZmZWtzZWVyKCk7XG4gICAgbGV0IHZybUV4cHJlc3Npb25XZWlnaHRzOiBNYXA8c3RyaW5nLCBudW1iZXI+IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGJsZW5kaW5nUmF0aW8gPSB0aGlzLl9fYW5pbWF0aW9uQmxlbmRpbmdSYXRpbztcblxuICAgIGZvciAoY29uc3QgW3BhdGhOYW1lLCBjaGFubmVsXSBvZiB0aGlzLl9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgIGNvbnN0IGFuaW1hdGVkVmFsdWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWU7XG4gICAgICAvLyBFdmFsdWF0ZSB0aGUgdmFsdWUgb25jZSB3aXRoIGJvdGggdGhlIHRpbWUgYW5kIHRoZSBibGVuZGluZyByYXRpbyBzZXQuXG4gICAgICBjb25zdCBzZXRUaW1lQW5kQmxlbmRpbmdSYXRpbyA9IGFuaW1hdGVkVmFsdWUuc2V0VGltZUFuZEJsZW5kaW5nUmF0aW87XG4gICAgICBpZiAoc2V0VGltZUFuZEJsZW5kaW5nUmF0aW8gIT0gbnVsbCkge1xuICAgICAgICBzZXRUaW1lQW5kQmxlbmRpbmdSYXRpby5jYWxsKGFuaW1hdGVkVmFsdWUsIHRpbWUsIGJsZW5kaW5nUmF0aW8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5zZXRUaW1lKHRpbWUpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmJsZW5kaW5nUmF0aW8gPSBibGVuZGluZ1JhdGlvO1xuICAgICAgfVxuXG4gICAgICBpZiAocGF0aE5hbWUuc3RhcnRzV2l0aChWcm1FeHByZXNzaW9uUGF0aFByZWZpeCkpIHtcbiAgICAgICAgaWYgKHZybUV4cHJlc3Npb25XZWlnaHRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLl9fdnJtRXhwcmVzc2lvbldlaWdodHMgPz89IG5ldyBNYXAoKTtcbiAgICAgICAgICB2cm1FeHByZXNzaW9uV2VpZ2h0cyA9IHRoaXMuX192cm1FeHByZXNzaW9uV2VpZ2h0cztcbiAgICAgICAgICB2cm1FeHByZXNzaW9uV2VpZ2h0cy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb25OYW1lID0gcGF0aE5hbWUuc3Vic3RyaW5nKFZybUV4cHJlc3Npb25QYXRoUHJlZml4Lmxlbmd0aCk7XG4gICAgICAgIHZybUV4cHJlc3Npb25XZWlnaHRzLnNldChleHByZXNzaW9uTmFtZSwgKGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcikueCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2FwcGx5Q2hhbm5lbEFuaW1hdGlvbihcbiAgICAgICAgcGF0aE5hbWUsXG4gICAgICAgIGNoYW5uZWwsXG4gICAgICAgIHRyYW5zZm9ybUNvbXBvbmVudCxcbiAgICAgICAgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlLFxuICAgICAgICBibGVuZFNoYXBlQ29tcG9uZW50LFxuICAgICAgICBlZmZla3NlZXJDb21wb25lbnRcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKElzLmV4aXN0KHZybUV4cHJlc3Npb25XZWlnaHRzKSkge1xuICAgICAgY29uc3QgdnJtQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRWcm0oKTtcbiAgICAgIGlmIChJcy5leGlzdCh2cm1Db21wb25lbnQpKSB7XG4gICAgICAgIHZybUNvbXBvbmVudC5zZXRFeHByZXNzaW9uV2VpZ2h0cyh2cm1FeHByZXNzaW9uV2VpZ2h0cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5Q2hhbm5lbEFuaW1hdGlvbihcbiAgICBwYXRoTmFtZTogc3RyaW5nLFxuICAgIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwsXG4gICAgdHJhbnNmb3JtQ29tcG9uZW50OiBUcmFuc2Zvcm1Db21wb25lbnQsXG4gICAgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlOiBib29sZWFuLFxuICAgIGJsZW5kU2hhcGVDb21wb25lbnQ/OiBCbGVuZFNoYXBlQ29tcG9uZW50LFxuICAgIGVmZmVrc2VlckNvbXBvbmVudD86IEVmZmVrc2VlckNvbXBvbmVudFxuICApIHtcbiAgICBpZiAodGhpcy5fX2FwcGx5VHJhbnNmb3JtQW5pbWF0aW9uKHBhdGhOYW1lLCBjaGFubmVsLCB0cmFuc2Zvcm1Db21wb25lbnQsIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZSkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fX2FwcGx5QmxlbmRTaGFwZUFuaW1hdGlvbihwYXRoTmFtZSwgY2hhbm5lbCwgYmxlbmRTaGFwZUNvbXBvbmVudCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fX2FwcGx5VmlzaWJpbGl0eUFuaW1hdGlvbihwYXRoTmFtZSwgY2hhbm5lbCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fX2FwcGx5TWF0ZXJpYWxBbmltYXRpb24ocGF0aE5hbWUsIGNoYW5uZWwpKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX19hcHBseUxpZ2h0QW5pbWF0aW9uKHBhdGhOYW1lLCBjaGFubmVsKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9fYXBwbHlDYW1lcmFBbmltYXRpb24ocGF0aE5hbWUsIGNoYW5uZWwpKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX19hcHBseUVmZmVrc2VlckFuaW1hdGlvbihwYXRoTmFtZSwgY2hhbm5lbCwgZWZmZWtzZWVyQ29tcG9uZW50KSkgcmV0dXJuO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5VHJhbnNmb3JtQW5pbWF0aW9uKFxuICAgIHBhdGhOYW1lOiBzdHJpbmcsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICB0cmFuc2Zvcm1Db21wb25lbnQ6IFRyYW5zZm9ybUNvbXBvbmVudCxcbiAgICBjYW5Ta2lwSWRlbnRpY2FsVHJhbnNmb3JtV3JpdGU6IGJvb2xlYW5cbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICBpZiAocGF0aE5hbWUgPT09ICd0cmFuc2xhdGUnKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuX19zaG91bGRXcml0ZVRyYW5zZm9ybVZhbHVlKFxuICAgICAgICAgIGFuaW1hdGVkVmFsdWUsXG4gICAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50LmxvY2FsUG9zaXRpb25Jbm5lci5fdixcbiAgICAgICAgICBjYW5Ta2lwSWRlbnRpY2FsVHJhbnNmb3JtV3JpdGVcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIHRyYW5zZm9ybUNvbXBvbmVudC5sb2NhbFBvc2l0aW9uID0gYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFZlY3RvcjM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAncXVhdGVybmlvbicpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX3Nob3VsZFdyaXRlVHJhbnNmb3JtVmFsdWUoXG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSxcbiAgICAgICAgICB0cmFuc2Zvcm1Db21wb25lbnQubG9jYWxSb3RhdGlvbklubmVyLl92LFxuICAgICAgICAgIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50LmxvY2FsUm90YXRpb24gPSBhbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgUXVhdGVybmlvbjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdzY2FsZScpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX3Nob3VsZFdyaXRlVHJhbnNmb3JtVmFsdWUoXG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSxcbiAgICAgICAgICB0cmFuc2Zvcm1Db21wb25lbnQubG9jYWxTY2FsZUlubmVyLl92LFxuICAgICAgICAgIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50LmxvY2FsU2NhbGUgPSBhbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgVmVjdG9yMztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIHdoZW4gdGhlIGFuaW1hdGVkIHZhbHVlIGRpZmZlcnMgZnJvbSB0aGUgdmFsdWUgYWxyZWFkeSBzdG9yZWQgaW4gdGhlIHRyYW5zZm9ybS5cbiAgICpcbiAgICogV3JpdGluZyBhbiBpZGVudGljYWwgdmFsdWUgd291bGQgc3RpbGwgaW5jcmVtZW50IHRoZSB0cmFuc2Zvcm0gdXBkYXRlIGNvdW50IGFuZCBpbnZhbGlkYXRlIHRoZVxuICAgKiB3b3JsZCBtYXRyaXggYW5kIHNraW5uaW5nIGNhY2hlcyBkb3duc3RyZWFtLCBzbyBpZGVudGljYWwgd3JpdGVzIGFyZSBza2lwcGVkLiBUaGUgY29tcGFyaXNvbiBpc1xuICAgKiBhZ2FpbnN0IHRoZSB0YXJnZXQgdmFsdWUgKG5vdCB0aGUgbGFzdCBhcHBsaWVkIHZhbHVlKSwgc28gZXh0ZXJuYWwgdHJhbnNmb3JtIGVkaXRzIGFyZSBzdGlsbFxuICAgKiBvdmVyd3JpdHRlbiBieSB0aGUgYW5pbWF0aW9uIG9uIHRoZSBuZXh0IGZyYW1lLlxuICAgKlxuICAgKiBQaHlzaWNzIHN1YnRyZWVzIHNldCBgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlYCB0byBmYWxzZTogdGhlaXIgc2V0dGVycyBhbHNvIG5vdGlmeSB0aGVcbiAgICogcGh5c2ljcyBzdHJhdGVnaWVzIHdpdGggdGhlIHBhcmVudCB3b3JsZCB0cmFuc2Zvcm0sIHdoaWNoIG11c3Qga2VlcCBydW5uaW5nIGV2ZW4gd2hlbiB0aGUgbG9jYWxcbiAgICogdmFsdWUgaXMgdW5jaGFuZ2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3Nob3VsZFdyaXRlVHJhbnNmb3JtVmFsdWUoXG4gICAgYW5pbWF0ZWRWYWx1ZTogSUFuaW1hdGVkVmFsdWUsXG4gICAgY3VycmVudFZhbHVlOiBUeXBlZEFycmF5LFxuICAgIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZTogYm9vbGVhblxuICApOiBib29sZWFuIHtcbiAgICBpZiAoIWNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGVkID0gYW5pbWF0ZWRWYWx1ZS5nZXRWYWx1ZUFycmF5Py4oKTtcbiAgICBpZiAoYW5pbWF0ZWQgPT09IHVuZGVmaW5lZCB8fCBhbmltYXRlZC5sZW5ndGggIT09IGN1cnJlbnRWYWx1ZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuaW1hdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYW5pbWF0ZWRbaV0gIT09IGN1cnJlbnRWYWx1ZVtpXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5QmxlbmRTaGFwZUFuaW1hdGlvbihcbiAgICBwYXRoTmFtZTogc3RyaW5nLFxuICAgIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwsXG4gICAgYmxlbmRTaGFwZUNvbXBvbmVudD86IEJsZW5kU2hhcGVDb21wb25lbnRcbiAgKTogYm9vbGVhbiB7XG4gICAgaWYgKHBhdGhOYW1lID09PSAnd2VpZ2h0cycpIHtcbiAgICAgIGNvbnN0IGFuaW1hdGVkVmFsdWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgQW5pbWF0ZWRWZWN0b3JOO1xuICAgICAgY29uc3QgdmFsdWUgPSBhbmltYXRlZFZhbHVlLmdldFZhbHVlQXJyYXk/LigpO1xuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYmxlbmRTaGFwZUNvbXBvbmVudCEuc2V0V2VpZ2h0c0Zyb21BcnJheUxpa2UodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmxlbmRTaGFwZUNvbXBvbmVudCEud2VpZ2h0cyA9IGFuaW1hdGVkVmFsdWUuZ2V0TnVtYmVyQXJyYXkoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlWaXNpYmlsaXR5QW5pbWF0aW9uKHBhdGhOYW1lOiBzdHJpbmcsIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwpOiBib29sZWFuIHtcbiAgICBpZiAocGF0aE5hbWUgIT09ICd2aXNpYmlsaXR5Jykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHNjZW5lR3JhcGggPSAodGhpcy5lbnRpdHkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eSkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgIGNvbnN0IGxvY2FsVmlzaWJsZSA9IChjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXIpLnggPiAwLjU7XG4gICAgaWYgKHNjZW5lR3JhcGguZW50aXR5LmdldFRhZ1ZhbHVlKFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSkgIT09IGxvY2FsVmlzaWJsZSkge1xuICAgICAgc2NlbmVHcmFwaC5lbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6IFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSwgdmFsdWU6IGxvY2FsVmlzaWJsZSB9KTtcbiAgICB9XG4gICAgdGhpcy5fX2FwcGx5RWZmZWN0aXZlVmlzaWJpbGl0eShzY2VuZUdyYXBoLCBzY2VuZUdyYXBoLnBhcmVudD8uaXNWaXNpYmxlID8/IHRydWUpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5RWZmZWN0aXZlVmlzaWJpbGl0eShzY2VuZUdyYXBoOiBTY2VuZUdyYXBoQ29tcG9uZW50LCBwYXJlbnRWaXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgbG9jYWxWaXNpYmxlID0gdGhpcy5fX2dldExvY2FsVmlzaWJpbGl0eShzY2VuZUdyYXBoKTtcbiAgICBjb25zdCBlZmZlY3RpdmVWaXNpYmxlID0gcGFyZW50VmlzaWJsZSAmJiBsb2NhbFZpc2libGU7XG4gICAgaWYgKHNjZW5lR3JhcGguaXNWaXNpYmxlICE9PSBlZmZlY3RpdmVWaXNpYmxlKSB7XG4gICAgICBzY2VuZUdyYXBoLmlzVmlzaWJsZSA9IGVmZmVjdGl2ZVZpc2libGU7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBzY2VuZUdyYXBoLmNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9fYXBwbHlFZmZlY3RpdmVWaXNpYmlsaXR5KGNoaWxkLCBlZmZlY3RpdmVWaXNpYmxlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0TG9jYWxWaXNpYmlsaXR5KHNjZW5lR3JhcGg6IFNjZW5lR3JhcGhDb21wb25lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCBsb2NhbFZpc2libGUgPSBzY2VuZUdyYXBoLmVudGl0eS5nZXRUYWdWYWx1ZShUYWdLaHJOb2RlVmlzaWJpbGl0eVZpc2libGUpO1xuICAgIHJldHVybiB0eXBlb2YgbG9jYWxWaXNpYmxlID09PSAnYm9vbGVhbicgPyBsb2NhbFZpc2libGUgOiBzY2VuZUdyYXBoLmlzVmlzaWJsZTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseU1hdGVyaWFsQW5pbWF0aW9uKHBhdGhOYW1lOiBzdHJpbmcsIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwpOiBib29sZWFuIHtcbiAgICBpZiAocGF0aE5hbWUuc3RhcnRzV2l0aCgnbWF0ZXJpYWwvJykpIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChJcy5leGlzdChtZXNoQ29tcG9uZW50KSAmJiBJcy5leGlzdChtZXNoQ29tcG9uZW50Lm1lc2gpKSB7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBtZXNoQ29tcG9uZW50Lm1lc2g7XG4gICAgICAgIGNvbnN0IHBhcmFtZXRlck5hbWUgPSB0aGlzLl9fZ2V0TWF0ZXJpYWxQYXJhbWV0ZXJOYW1lKHBhdGhOYW1lKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoLmdldFByaW1pdGl2ZU51bWJlcigpOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoLmdldFByaW1pdGl2ZUF0KGkpO1xuICAgICAgICAgIGNvbnN0IG1hdGVyaWFsID0gcHJpbWl0aXZlLm1hdGVyaWFsO1xuICAgICAgICAgIGlmIChJcy5leGlzdChtYXRlcmlhbCkpIHtcbiAgICAgICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcihwYXJhbWV0ZXJOYW1lLCBjaGFubmVsLmFuaW1hdGVkVmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRNYXRlcmlhbFBhcmFtZXRlck5hbWUocGF0aE5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLl9fbWF0ZXJpYWxQYXJhbWV0ZXJOYW1lQ2FjaGUuZ2V0KHBhdGhOYW1lKTtcbiAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBuYW1lID0gcGF0aE5hbWUuc3BsaXQoJy8nKS5wb3AoKSE7XG4gICAgICB0aGlzLl9fbWF0ZXJpYWxQYXJhbWV0ZXJOYW1lQ2FjaGUuc2V0KHBhdGhOYW1lLCBuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlMaWdodEFuaW1hdGlvbihwYXRoTmFtZTogc3RyaW5nLCBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldExpZ2h0KCk7XG4gICAgaWYgKCFJcy5leGlzdChsaWdodENvbXBvbmVudCkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2xpZ2h0X2NvbG9yJykge1xuICAgICAgY29uc3QgY29sb3IgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBWZWN0b3IzO1xuICAgICAgbGlnaHRDb21wb25lbnQuY29sb3IgPSBjb2xvcjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdsaWdodF9pbnRlbnNpdHknKSB7XG4gICAgICBjb25zdCBpbnRlbnNpdHkgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBsaWdodENvbXBvbmVudC5pbnRlbnNpdHkgPSBpbnRlbnNpdHkuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAnbGlnaHRfcmFuZ2UnKSB7XG4gICAgICBjb25zdCByYW5nZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGxpZ2h0Q29tcG9uZW50LnJhbmdlID0gcmFuZ2UuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAnbGlnaHRfc3BvdF9pbm5lckNvbmVBbmdsZScpIHtcbiAgICAgIGNvbnN0IGlubmVyQ29uZUFuZ2xlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgbGlnaHRDb21wb25lbnQuaW5uZXJDb25lQW5nbGUgPSBpbm5lckNvbmVBbmdsZS5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdsaWdodF9zcG90X291dGVyQ29uZUFuZ2xlJykge1xuICAgICAgY29uc3Qgb3V0ZXJDb25lQW5nbGUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBsaWdodENvbXBvbmVudC5vdXRlckNvbmVBbmdsZSA9IG91dGVyQ29uZUFuZ2xlLl92WzBdO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseUNhbWVyYUFuaW1hdGlvbihwYXRoTmFtZTogc3RyaW5nLCBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsKTogYm9vbGVhbiB7XG4gICAgY29uc3QgY2FtZXJhQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRDYW1lcmEoKTtcbiAgICBpZiAoIUlzLmV4aXN0KGNhbWVyYUNvbXBvbmVudCkpIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2NhbWVyYV96bmVhcicpIHtcbiAgICAgIGNvbnN0IHpuZWFyID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpOZWFyID0gem5lYXIuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAnY2FtZXJhX3pmYXInKSB7XG4gICAgICBjb25zdCB6ZmFyID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnpGYXIgPSB6ZmFyLl92WzBdO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2NhbWVyYV9mb3Z5Jykge1xuICAgICAgY29uc3QgZm92eSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC5zZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoZm92eS5fdlswXSkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2NhbWVyYV94bWFnJykge1xuICAgICAgY29uc3QgeG1hZyA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC54TWFnID0geG1hZy5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdjYW1lcmFfeW1hZycpIHtcbiAgICAgIGNvbnN0IHltYWcgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQueU1hZyA9IHltYWcuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5RWZmZWtzZWVyQW5pbWF0aW9uKFxuICAgIHBhdGhOYW1lOiBzdHJpbmcsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBlZmZla3NlZXJDb21wb25lbnQ/OiBFZmZla3NlZXJDb21wb25lbnRcbiAgKTogYm9vbGVhbiB7XG4gICAgaWYgKHBhdGhOYW1lID09PSAnZWZmZWtzZWVyJykge1xuICAgICAgaWYgKChjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXIpLnggPiAwLjUpIHtcbiAgICAgICAgaWYgKHRoaXMuX19pc0VmZmVrc2VlclN0YXRlID09PSAwKSB7XG4gICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50Py5wbGF5KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLl9faXNFZmZla3NlZXJTdGF0ZSA9PT0gMSkge1xuICAgICAgICAgIGVmZmVrc2VlckNvbXBvbmVudD8ucGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fX2lzRWZmZWtzZWVyU3RhdGUgPSAoY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyKS54O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJzY3JpYmVzIHRvIGFuaW1hdGlvbiBjb21wb25lbnQgZXZlbnRzLlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlIG9mIGV2ZW50IHRvIHN1YnNjcmliZSB0b1xuICAgKiBAcGFyYW0gaGFuZGxlciAtIFRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAqL1xuICBzdGF0aWMgc3Vic2NyaWJlKHR5cGU6IEFuaW1hdGlvbkNvbXBvbmVudEV2ZW50VHlwZSwgaGFuZGxlcjogRXZlbnRIYW5kbGVyKSB7XG4gICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fcHVic3ViLnN1YnNjcmliZSh0eXBlLCBoYW5kbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhpcyBhbmltYXRpb24gY29tcG9uZW50IGlzIGFuaW1hdGluZy5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gZW5hYmxlIGFuaW1hdGlvbiwgZmFsc2UgdG8gZGlzYWJsZVxuICAgKi9cbiAgc2V0SXNBbmltYXRpbmcoZmxnOiBib29sZWFuKSB7XG4gICAgdGhpcy5fX2lzQW5pbWF0aW5nID0gZmxnO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBhbmltYXRpb24gdHJhY2sgZm9yIGFsbCBhbmltYXRpb24gY29tcG9uZW50cy5cbiAgICogQHBhcmFtIGFuaW1hdGlvblRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2sgdG8gYWN0aXZhdGVcbiAgICovXG4gIHN0YXRpYyBzZXRBY3RpdmVBbmltYXRpb25Gb3JBbGwoZW5naW5lOiBFbmdpbmUsIGFuaW1hdGlvblRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKSB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShBbmltYXRpb25Db21wb25lbnQpIGFzIEFuaW1hdGlvbkNvbXBvbmVudFtdO1xuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGNvbXBvbmVudHMpIHtcbiAgICAgIGNvbXBvbmVudC5zZXRBY3RpdmVBbmltYXRpb25UcmFjayhhbmltYXRpb25UcmFja05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhY3RpdmUgYW5pbWF0aW9uIHRyYWNrIGZvciB0aGlzIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIGFuaW1hdGlvblRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2sgdG8gYWN0aXZhdGVcbiAgICovXG4gIHNldEFjdGl2ZUFuaW1hdGlvblRyYWNrKGFuaW1hdGlvblRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKSB7XG4gICAgZm9yIChjb25zdCBbLCBjaGFubmVsXSBvZiB0aGlzLl9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5zZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZShhbmltYXRpb25UcmFja05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzZWNvbmQgYWN0aXZlIGFuaW1hdGlvbiB0cmFjayBmb3IgYmxlbmRpbmcgcHVycG9zZXMuXG4gICAqIEBwYXJhbSBhbmltYXRpb25UcmFja05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc2Vjb25kIGFuaW1hdGlvbiB0cmFjayB0byBhY3RpdmF0ZVxuICAgKi9cbiAgc2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2soYW5pbWF0aW9uVHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUpIHtcbiAgICBmb3IgKGNvbnN0IFssIGNoYW5uZWxdIG9mIHRoaXMuX19hbmltYXRpb25UcmFjaykge1xuICAgICAgY2hhbm5lbC5hbmltYXRlZFZhbHVlLnNldFNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZShhbmltYXRpb25UcmFja05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBjdXJyZW50bHkgYWN0aXZlIGFuaW1hdGlvbiB0cmFjay5cbiAgICogQHJldHVybnMgVGhlIG5hbWUgb2YgdGhlIGFjdGl2ZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHRocm93cyBFcnJvciBpZiBubyBhY3RpdmUgYW5pbWF0aW9uIHRyYWNrIGlzIGZvdW5kXG4gICAqL1xuICBnZXRBY3RpdmVBbmltYXRpb25UcmFjaygpIHtcbiAgICBmb3IgKGNvbnN0IFssIGNoYW5uZWxdIG9mIHRoaXMuX19hbmltYXRpb25UcmFjaykge1xuICAgICAgcmV0dXJuIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSgpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGFjdGl2ZSBhbmltYXRpb24gdHJhY2sgZm91bmQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBjb21wb25lbnQgaGFzIGEgc3BlY2lmaWMgYW5pbWF0aW9uIGZvciB0aGUgZ2l2ZW4gdHJhY2sgYW5kIHBhdGguXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgYW5pbWF0aW9uIHRyYWNrIG5hbWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIGFuaW1hdGlvbiBwYXRoIG5hbWUgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgYW5pbWF0aW9uIGV4aXN0cywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBoYXNBbmltYXRpb24odHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUsIHBhdGhOYW1lOiBBbmltYXRpb25QYXRoTmFtZSk6IGJvb2xlYW4ge1xuICAgIGZvciAoY29uc3QgW2N1cnJlbnRQYXRoTmFtZSwgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICByZXR1cm4gcGF0aE5hbWUgPT09IGN1cnJlbnRQYXRoTmFtZSAmJiBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0Rmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUoKSA9PT0gdHJhY2tOYW1lO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbiBhbmltYXRpb24gY2hhbm5lbCBmb3IgdGhlIHNwZWNpZmllZCBwYXRoLiBJZiBhIGNoYW5uZWwgYWxyZWFkeSBleGlzdHMgZm9yIHRoZSBwYXRoLFxuICAgKiBpdCBtZXJnZXMgdGhlIG5ldyBhbmltYXRpb24gZGF0YSB3aXRoIHRoZSBleGlzdGluZyBvbmUuXG4gICAqIEBwYXJhbSBwYXRoTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gcGF0aCAoZS5nLiwgJ3RyYW5zbGF0ZScsICdyb3RhdGUnLCAnc2NhbGUnKVxuICAgKiBAcGFyYW0gYW5pbWF0ZWRWYWx1ZUFyZyAtIFRoZSBhbmltYXRlZCB2YWx1ZSBjb250YWluaW5nIGFuaW1hdGlvbiBkYXRhXG4gICAqL1xuICBzZXRBbmltYXRpb24ocGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lLCBhbmltYXRlZFZhbHVlQXJnOiBJQW5pbWF0ZWRWYWx1ZSkge1xuICAgIGxldCBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZTtcbiAgICBjb25zdCBvdmVyd3JpdHRlblRyYWNrTmFtZXMgPSBuZXcgU2V0PEFuaW1hdGlvblRyYWNrTmFtZT4oKTtcbiAgICBpZiAodGhpcy5fX2FuaW1hdGlvblRyYWNrLmhhcyhwYXRoTmFtZSkpIHtcbiAgICAgIGNvbnN0IGV4aXN0ZWRBbmltYXRlZFZhbHVlID0gdGhpcy5fX2FuaW1hdGlvblRyYWNrLmdldChwYXRoTmFtZSkhLmFuaW1hdGVkVmFsdWU7XG4gICAgICBjb25zdCBleGlzdGVkVHJhY2tOYW1lcyA9IG5ldyBTZXQoZXhpc3RlZEFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKTtcbiAgICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIGFuaW1hdGVkVmFsdWVBcmcuZ2V0QWxsVHJhY2tOYW1lcygpKSB7XG4gICAgICAgIGlmIChleGlzdGVkVHJhY2tOYW1lcy5oYXModHJhY2tOYW1lKSkge1xuICAgICAgICAgIG92ZXJ3cml0dGVuVHJhY2tOYW1lcy5hZGQodHJhY2tOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBleGlzdGVkQW5pbWF0ZWRWYWx1ZS5zZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSwgYW5pbWF0ZWRWYWx1ZUFyZy5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkpO1xuICAgICAgfVxuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IGV4aXN0ZWRBbmltYXRlZFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fYW5pbWF0aW9uVHJhY2suc2V0KHBhdGhOYW1lLCB7XG4gICAgICAgIGFuaW1hdGVkVmFsdWU6IGFuaW1hdGVkVmFsdWVBcmcsXG4gICAgICAgIHRhcmdldDoge1xuICAgICAgICAgIHBhdGhOYW1lLFxuICAgICAgICAgIGVudGl0eTogdGhpcy5lbnRpdHksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGFuaW1hdGVkVmFsdWUgPSBhbmltYXRlZFZhbHVlQXJnO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBBbmltYXRpb25JbmZvXG4gICAgY29uc3QgdHJhY2tOYW1lcyA9IGFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpO1xuICAgIGNvbnN0IGFuaW1hdGlvbkdsb2JhbEluZm8gPSBBbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyh0aGlzLl9fZW5naW5lKTtcbiAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiB0cmFja05hbWVzKSB7XG4gICAgICBpZiAob3ZlcndyaXR0ZW5UcmFja05hbWVzLmhhcyh0cmFja05hbWUpKSB7XG4gICAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX3JlY2FsY3VsYXRlQW5pbWF0aW9uSW5mbyh0aGlzLl9fZW5naW5lLCB0cmFja05hbWUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld01pblN0YXJ0SW5wdXRUaW1lID0gYW5pbWF0ZWRWYWx1ZS5nZXRNaW5TdGFydElucHV0VGltZSh0cmFja05hbWUpO1xuICAgICAgY29uc3QgbmV3TWF4RW5kSW5wdXRUaW1lID0gYW5pbWF0ZWRWYWx1ZS5nZXRNYXhFbmRJbnB1dFRpbWUodHJhY2tOYW1lKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nSW5mbyA9IGFuaW1hdGlvbkdsb2JhbEluZm8uZ2V0KHRyYWNrTmFtZSk7XG5cbiAgICAgIGNvbnN0IGluZm8gPSB7XG4gICAgICAgIG5hbWU6IHRyYWNrTmFtZSxcbiAgICAgICAgbWluU3RhcnRJbnB1dFRpbWU6XG4gICAgICAgICAgZXhpc3RpbmdJbmZvID09IG51bGwgPyBuZXdNaW5TdGFydElucHV0VGltZSA6IE1hdGgubWluKGV4aXN0aW5nSW5mby5taW5TdGFydElucHV0VGltZSwgbmV3TWluU3RhcnRJbnB1dFRpbWUpLFxuICAgICAgICBtYXhFbmRJbnB1dFRpbWU6XG4gICAgICAgICAgZXhpc3RpbmdJbmZvID09IG51bGwgPyBuZXdNYXhFbmRJbnB1dFRpbWUgOiBNYXRoLm1heChleGlzdGluZ0luZm8ubWF4RW5kSW5wdXRUaW1lLCBuZXdNYXhFbmRJbnB1dFRpbWUpLFxuICAgICAgfTtcbiAgICAgIGFuaW1hdGlvbkdsb2JhbEluZm8uc2V0KHRyYWNrTmFtZSwgaW5mbyk7XG4gICAgICBBbmltYXRpb25Db21wb25lbnQuX19wdWJzdWIucHVibGlzaEFzeW5jKEFuaW1hdGlvbkNvbXBvbmVudC5FdmVudC5DaGFuZ2VBbmltYXRpb25JbmZvLCB7XG4gICAgICAgIGluZm9NYXA6IG5ldyBNYXAoYW5pbWF0aW9uR2xvYmFsSW5mbyksXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gUnVudGltZS1vbmx5IFZSTSBleHByZXNzaW9uIGNoYW5uZWxzIGRvIG5vdCBhbmltYXRlIFRyYW5zZm9ybSBhbmQgbXVzdCBub3QgcmVwbGFjZSBpdHMgcmVzdCBwb3NlLlxuICAgIGlmICghcGF0aE5hbWUuc3RhcnRzV2l0aCgndnJtRXhwcmVzc2lvbi8nKSkge1xuICAgICAgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkuX2JhY2t1cFRyYW5zZm9ybUFzUmVzdCgpO1xuICAgIH1cbiAgICB0aGlzLl9fdXBkYXRlQW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYW5pbWF0ZWQgdmFsdWUgZm9yIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIHBhdGguXG4gICAqIEBwYXJhbSBwYXRoTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gcGF0aFxuICAgKiBAcmV0dXJucyBUaGUgYW5pbWF0ZWQgdmFsdWUgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgZ2V0QW5pbWF0aW9uKHBhdGhOYW1lOiBBbmltYXRpb25QYXRoTmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9fYW5pbWF0aW9uVHJhY2suZ2V0KHBhdGhOYW1lKT8uYW5pbWF0ZWRWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzdGFydCBpbnB1dCB0aW1lIHZhbHVlIGZvciB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiB0cmFjay5cbiAgICogQHBhcmFtIGFuaW1hdGlvblRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHJldHVybnMgVGhlIG1pbmltdW0gc3RhcnQgaW5wdXQgdGltZSB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldFN0YXJ0SW5wdXRWYWx1ZU9mQW5pbWF0aW9uKGFuaW1hdGlvblRyYWNrTmFtZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBjb25zdCBhbmltYXRpb25HbG9iYWxJbmZvID0gQW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkdsb2JhbEluZm8odGhpcy5fX2VuZ2luZSk7XG4gICAgcmV0dXJuIGFuaW1hdGlvbkdsb2JhbEluZm8uZ2V0KGFuaW1hdGlvblRyYWNrTmFtZSkhLm1pblN0YXJ0SW5wdXRUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVuZCBpbnB1dCB0aW1lIHZhbHVlIGZvciB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiB0cmFjay5cbiAgICogQHBhcmFtIGFuaW1hdGlvblRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHJldHVybnMgVGhlIG1heGltdW0gZW5kIGlucHV0IHRpbWUgdmFsdWVcbiAgICovXG4gIHB1YmxpYyBnZXRFbmRJbnB1dFZhbHVlT2ZBbmltYXRpb24oYW5pbWF0aW9uVHJhY2tOYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IGFuaW1hdGlvbkdsb2JhbEluZm8gPSBBbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyh0aGlzLl9fZW5naW5lKTtcbiAgICByZXR1cm4gYW5pbWF0aW9uR2xvYmFsSW5mby5nZXQoYW5pbWF0aW9uVHJhY2tOYW1lKSEubWF4RW5kSW5wdXRUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gYXJyYXkgb2YgYWxsIGF2YWlsYWJsZSBhbmltYXRpb24gdHJhY2sgbmFtZXMuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGdldCB0aGUgYW5pbWF0aW9uIGxpc3QgZm9yXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIGFuaW1hdGlvbiB0cmFjayBuYW1lc1xuICAgKi9cbiAgc3RhdGljIGdldEFuaW1hdGlvbkxpc3QoZW5naW5lOiBFbmdpbmUpOiBBbmltYXRpb25UcmFja05hbWVbXSB7XG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IHRoaXMuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyhlbmdpbmUpO1xuICAgIHJldHVybiBBcnJheS5mcm9tKGFuaW1hdGlvbkdsb2JhbEluZm8ua2V5cygpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbmltYXRpb24gaW5mb3JtYXRpb24gZm9yIGFsbCB0cmFja3MuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGdldCB0aGUgYW5pbWF0aW9uIGluZm8gZm9yXG4gICAqIEByZXR1cm5zIEEgbWFwIGNvbnRhaW5pbmcgYW5pbWF0aW9uIHRyYWNrIG5hbWVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIGluZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2V0QW5pbWF0aW9uSW5mbyhlbmdpbmU6IEVuZ2luZSk6IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvbkluZm8+IHtcbiAgICByZXR1cm4gbmV3IE1hcCh0aGlzLmdldEFuaW1hdGlvbkdsb2JhbEluZm8oZW5naW5lKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgYW5pbWF0aW9uIHRyYWNrIG5hbWVzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgYW5pbWF0aW9uIHRyYWNrIG5hbWVzXG4gICAqL1xuICBwdWJsaWMgZ2V0QW5pbWF0aW9uVHJhY2tOYW1lcygpOiBBbmltYXRpb25UcmFja05hbWVbXSB7XG4gICAgY29uc3QgdHJhY2tOYW1lcyA9IFtdO1xuICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICB0cmFja05hbWVzLnB1c2goLi4uY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKSk7XG4gICAgfVxuICAgIHJldHVybiB0cmFja05hbWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFuaW1hdGlvbiBjaGFubmVscyBvZiB0aGUgYW5pbWF0aW9uIHRyYWNrLlxuICAgKiBAcmV0dXJucyBUaGUgY2hhbm5lbCBtYXBzIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICovXG4gIHB1YmxpYyBnZXRBbmltYXRpb25DaGFubmVsc09mVHJhY2soKTogQW5pbWF0aW9uVHJhY2sge1xuICAgIHJldHVybiB0aGlzLl9fYW5pbWF0aW9uVHJhY2s7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGN1cnJlbnRseSBhbmltYXRpbmcuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYW5pbWF0aW5nLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc0FuaW1hdGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzQW5pbWF0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGdsb2JhbCBzdGFydCBpbnB1dCB2YWx1ZSBmb3IgYWxsIGFuaW1hdGlvbiBjb21wb25lbnRzLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIHN0YXJ0IGlucHV0IHZhbHVlIGZvclxuICAgKiBAcmV0dXJucyBUaGUgc3RhcnQgaW5wdXQgdmFsdWVcbiAgICovXG4gIHN0YXRpYyBnZXRTdGFydElucHV0VmFsdWUoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKEFuaW1hdGlvbkNvbXBvbmVudCkgYXMgQW5pbWF0aW9uQ29tcG9uZW50W107XG4gICAgaWYgKGNvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IHRoaXMuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyhlbmdpbmUpO1xuICAgIGNvbnN0IGluZm9BcnJheSA9IEFycmF5LmZyb20oYW5pbWF0aW9uR2xvYmFsSW5mby52YWx1ZXMoKSk7XG4gICAgaWYgKGluZm9BcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBsYXN0SW5mbyA9IGluZm9BcnJheVtpbmZvQXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGxhc3RJbmZvLm1pblN0YXJ0SW5wdXRUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGdsb2JhbCBlbmQgaW5wdXQgdmFsdWUgZm9yIGFsbCBhbmltYXRpb24gY29tcG9uZW50cy5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBlbmQgaW5wdXQgdmFsdWUgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBlbmQgaW5wdXQgdmFsdWVcbiAgICovXG4gIHN0YXRpYyBnZXRFbmRJbnB1dFZhbHVlKGVuZ2luZTogRW5naW5lKSB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShBbmltYXRpb25Db21wb25lbnQpIGFzIEFuaW1hdGlvbkNvbXBvbmVudFtdO1xuICAgIGlmIChjb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGFuaW1hdGlvbkdsb2JhbEluZm8gPSB0aGlzLmdldEFuaW1hdGlvbkdsb2JhbEluZm8oZW5naW5lKTtcbiAgICBjb25zdCBpbmZvQXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGlvbkdsb2JhbEluZm8udmFsdWVzKCkpO1xuICAgIGlmIChpbmZvQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3QgbGFzdEluZm8gPSBpbmZvQXJyYXlbaW5mb0FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBsYXN0SW5mby5tYXhFbmRJbnB1dFRpbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgQW5pbWF0aW9uQ29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllclxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQW5pbWF0aW9uQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQW5pbWF0aW9uQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudGl0eSB0aGF0IG93bnMgdGhpcyBhbmltYXRpb24gY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgZ2V0IGVudGl0eSgpOiBJQW5pbWF0aW9uRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmdldEVudGl0eSh0aGlzLl9fZW50aXR5VWlkKSBhcyB1bmtub3duIGFzIElBbmltYXRpb25FbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGlzIGFuaW1hdGlvbiBjb21wb25lbnQgdG8gYW4gZW50aXR5LCBleHRlbmRpbmcgdGhlIGVudGl0eSB3aXRoIGFuaW1hdGlvbiBtZXRob2RzLlxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5IHRvIGFkZCB0aGlzIGNvbXBvbmVudCB0b1xuICAgKiBAcGFyYW0gX2NvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBhZGRcbiAgICogQHJldHVybnMgVGhlIGVudGl0eSBleHRlbmRlZCB3aXRoIGFuaW1hdGlvbiBjb21wb25lbnQgbWV0aG9kc1xuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIEFuaW1hdGlvbkVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0QW5pbWF0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLkFuaW1hdGlvbkNvbXBvbmVudFRJRCkgYXMgQW5pbWF0aW9uQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBBbmltYXRpb25FbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBrZXlmcmFtZSB0byB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiB0cmFjayBhdCB0aGUgZ2l2ZW4gZnJhbWUuXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uIHRyYWNrXG4gICAqIEBwYXJhbSBwYXRoTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gcGF0aFxuICAgKiBAcGFyYW0gZnJhbWVUb0luc2VydCAtIFRoZSBmcmFtZSBudW1iZXIgd2hlcmUgdG8gaW5zZXJ0IHRoZSBrZXlmcmFtZVxuICAgKiBAcGFyYW0gZnBzIC0gVGhlIGZyYW1lcyBwZXIgc2Vjb25kIHJhdGVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUga2V5ZnJhbWUgd2FzIHN1Y2Nlc3NmdWxseSBhZGRlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhZGRLZXlGcmFtZSh0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSwgcGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lLCBmcmFtZVRvSW5zZXJ0OiBJbmRleCwgZnBzOiBudW1iZXIpIHtcbiAgICBjb25zdCBzZWNCZWdpbiA9IGZyYW1lVG9JbnNlcnQgLyBmcHM7XG4gICAgY29uc3QgaW5wdXQgPSBzZWNCZWdpbjtcbiAgICBjb25zdCBzZWNFbmQgPSAoZnJhbWVUb0luc2VydCArIDEpIC8gZnBzO1xuXG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMuX19hbmltYXRpb25UcmFjay5nZXQocGF0aE5hbWUpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoY2hhbm5lbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgIC8vIFRoZSBzYW1wbGVyIGFycmF5cyBhcmUgcmV3cml0dGVuIGJlbG93OyBkcm9wIGFueSBtZW1vaXplZCBpbnRlcnBvbGF0aW9uIHJlc3VsdC5cbiAgICBhbmltYXRlZFZhbHVlLmludmFsaWRhdGVBbmltYXRpb25DYWNoZT8uKCk7XG5cbiAgICBjb25zdCBpID0gQW5pbWF0aW9uQXR0cmlidXRlLmZyb21TdHJpbmcocGF0aE5hbWUpLmluZGV4O1xuICAgIGNvbnN0IGdsb2JhbFRpbWUgPSBBbmltYXRpb25Db21wb25lbnQuZ2V0R2xvYmFsVGltZSh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBvdXRwdXQgPSBfX2ludGVycG9sYXRlKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLCBnbG9iYWxUaW1lLCBpKTtcblxuICAgIGlmIChhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgIGlucHV0QXJyYXkucHVzaChpbnB1dCk7XG4gICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgIG91dHB1dEFycmF5LnB1c2goLi4ub3V0cHV0KTtcbiAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgIH0gZWxzZSBpZiAoYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBleGlzdGVkSW5wdXQgPSBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFswXTtcbiAgICAgIGlmIChzZWNFbmQgPCBleGlzdGVkSW5wdXQpIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICBpbnB1dEFycmF5LnVuc2hpZnQoaW5wdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgICBvdXRwdXRBcnJheS51bnNoaWZ0KC4uLm91dHB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgICAgfSBlbHNlIGlmIChleGlzdGVkSW5wdXQgPCBzZWNCZWdpbikge1xuICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgIGlucHV0QXJyYXkucHVzaChpbnB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgIG91dHB1dEFycmF5LnB1c2goLi4ub3V0cHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzZWNCZWdpbiA8PSBleGlzdGVkSW5wdXQgPD0gc2VjRW5kXG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgICAgaW5wdXRBcnJheS5zcGxpY2UoMCwgMCwgaW5wdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgICBvdXRwdXRBcnJheS5zcGxpY2UoMCwgMCwgLi4ub3V0cHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNoYW5uZWwuc2FtcGxlci5pbnB1dC5sZW5ndGggPj0gMlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBleGlzdGVkSW5wdXQgPSBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFtpXTtcbiAgICAgICAgaWYgKHNlY0JlZ2luIDw9IGV4aXN0ZWRJbnB1dCkge1xuICAgICAgICAgIGlmIChzZWNCZWdpbiA8PSBleGlzdGVkSW5wdXQgJiYgZXhpc3RlZElucHV0IDw9IHNlY0VuZCkge1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXRbaV0gPSBpbnB1dDtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0Q29tcG9uZW50TjsgaisrKSB7XG4gICAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dFtcbiAgICAgICAgICAgICAgICBpICogYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0Q29tcG9uZW50TiArIGpcbiAgICAgICAgICAgICAgXSA9IG91dHB1dFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICAgICAgaW5wdXRBcnJheS5zcGxpY2UoaSwgMCwgaW5wdXQpO1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgICAgICBvdXRwdXRBcnJheS5zcGxpY2UoaSAqIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dENvbXBvbmVudE4sIDAsIC4uLm91dHB1dCk7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEga2V5ZnJhbWUgd2l0aCBhIHNwZWNpZmljIHZhbHVlIHRvIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIHRyYWNrIGF0IHRoZSBnaXZlbiBmcmFtZS5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoXG4gICAqIEBwYXJhbSBmcmFtZVRvSW5zZXJ0IC0gVGhlIGZyYW1lIG51bWJlciB3aGVyZSB0byBpbnNlcnQgdGhlIGtleWZyYW1lXG4gICAqIEBwYXJhbSBvdXRwdXQgLSBUaGUgYXJyYXkgb2Ygb3V0cHV0IHZhbHVlcyBmb3IgdGhlIGtleWZyYW1lXG4gICAqIEBwYXJhbSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQgcmF0ZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBrZXlmcmFtZSB3YXMgc3VjY2Vzc2Z1bGx5IGFkZGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFkZEtleUZyYW1lV2l0aFZhbHVlKFxuICAgIHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lLFxuICAgIHBhdGhOYW1lOiBBbmltYXRpb25QYXRoTmFtZSxcbiAgICBmcmFtZVRvSW5zZXJ0OiBJbmRleCxcbiAgICBvdXRwdXQ6IEFycmF5PG51bWJlcj4sXG4gICAgZnBzOiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3Qgc2VjQmVnaW4gPSBmcmFtZVRvSW5zZXJ0IC8gZnBzO1xuICAgIGNvbnN0IGlucHV0ID0gc2VjQmVnaW47XG4gICAgY29uc3Qgc2VjRW5kID0gKGZyYW1lVG9JbnNlcnQgKyAxKSAvIGZwcztcblxuICAgIGNvbnN0IGNoYW5uZWwgPSB0aGlzLl9fYW5pbWF0aW9uVHJhY2suZ2V0KHBhdGhOYW1lKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNoYW5uZWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICAvLyBUaGUgc2FtcGxlciBhcnJheXMgYXJlIHJld3JpdHRlbiBiZWxvdzsgZHJvcCBhbnkgbWVtb2l6ZWQgaW50ZXJwb2xhdGlvbiByZXN1bHQuXG4gICAgYW5pbWF0ZWRWYWx1ZS5pbnZhbGlkYXRlQW5pbWF0aW9uQ2FjaGU/LigpO1xuXG4gICAgaWYgKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgaW5wdXRBcnJheS5wdXNoKGlucHV0KTtcbiAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgb3V0cHV0QXJyYXkucHVzaCguLi5vdXRwdXQpO1xuICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IGV4aXN0ZWRJbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0WzBdO1xuICAgICAgaWYgKHNlY0VuZCA8IGV4aXN0ZWRJbnB1dCkge1xuICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgIGlucHV0QXJyYXkudW5zaGlmdChpbnB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgIG91dHB1dEFycmF5LnVuc2hpZnQoLi4ub3V0cHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgICB9IGVsc2UgaWYgKGV4aXN0ZWRJbnB1dCA8IHNlY0JlZ2luKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgICAgaW5wdXRBcnJheS5wdXNoKGlucHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgb3V0cHV0QXJyYXkucHVzaCguLi5vdXRwdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHNlY0JlZ2luIDw9IGV4aXN0ZWRJbnB1dCA8PSBzZWNFbmRcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICBpbnB1dEFycmF5LnNwbGljZSgwLCAwLCBpbnB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgIG91dHB1dEFycmF5LnNwbGljZSgwLCAwLCAuLi5vdXRwdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2hhbm5lbC5zYW1wbGVyLmlucHV0Lmxlbmd0aCA+PSAyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0ZWRJbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0W2ldO1xuICAgICAgICBpZiAoc2VjQmVnaW4gPD0gZXhpc3RlZElucHV0KSB7XG4gICAgICAgICAgaWYgKHNlY0JlZ2luIDw9IGV4aXN0ZWRJbnB1dCAmJiBleGlzdGVkSW5wdXQgPD0gc2VjRW5kKSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFtpXSA9IGlucHV0O1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROOyBqKyspIHtcbiAgICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0W1xuICAgICAgICAgICAgICAgIGkgKiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROICsgalxuICAgICAgICAgICAgICBdID0gb3V0cHV0W2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgICAgICBpbnB1dEFycmF5LnNwbGljZShpLCAwLCBpbnB1dCk7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgICAgIG91dHB1dEFycmF5LnNwbGljZShpICogYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0Q29tcG9uZW50TiwgMCwgLi4ub3V0cHV0KTtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMga2V5ZnJhbWVzIGF0IHRoZSBzcGVjaWZpZWQgZnJhbWUgZm9yIHRoZSBnaXZlbiBhbmltYXRpb24gdHJhY2sgYW5kIHBhdGguXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uIHRyYWNrXG4gICAqIEBwYXJhbSBwYXRoTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gcGF0aFxuICAgKiBAcGFyYW0gZnJhbWVUb0RlbGV0ZSAtIFRoZSBmcmFtZSBudW1iZXIgd2hlcmUgdG8gZGVsZXRlIGtleWZyYW1lc1xuICAgKiBAcGFyYW0gZnBzIC0gVGhlIGZyYW1lcyBwZXIgc2Vjb25kIHJhdGVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBrZXlmcmFtZXMgd2VyZSBzdWNjZXNzZnVsbHkgZGVsZXRlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBkZWxldGVLZXlzQXRGcmFtZSh0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSwgcGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lLCBmcmFtZVRvRGVsZXRlOiBJbmRleCwgZnBzOiBudW1iZXIpIHtcbiAgICBjb25zdCBzZWNCZWdpbiA9IGZyYW1lVG9EZWxldGUgLyBmcHM7XG4gICAgY29uc3Qgc2VjRW5kID0gKGZyYW1lVG9EZWxldGUgKyAxKSAvIGZwcztcblxuICAgIGNvbnN0IGNoYW5uZWwgPSB0aGlzLl9fYW5pbWF0aW9uVHJhY2suZ2V0KHBhdGhOYW1lKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNoYW5uZWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICAvLyBUaGUgc2FtcGxlciBhcnJheXMgYXJlIHJld3JpdHRlbiBiZWxvdzsgZHJvcCBhbnkgbWVtb2l6ZWQgaW50ZXJwb2xhdGlvbiByZXN1bHQuXG4gICAgYW5pbWF0ZWRWYWx1ZS5pbnZhbGlkYXRlQW5pbWF0aW9uQ2FjaGU/LigpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5wdXQgPSBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFtpXTtcbiAgICAgIGlmIChzZWNCZWdpbiA8PSBpbnB1dCAmJiBpbnB1dCA8IHNlY0VuZCkge1xuICAgICAgICBjb25zdCBpbnB1dCA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICBpbnB1dC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dCk7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgb3V0cHV0LnNwbGljZShcbiAgICAgICAgICBpICogYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0Q29tcG9uZW50TixcbiAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROXG4gICAgICAgICk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYga2V5ZnJhbWVzIGV4aXN0IGF0IHRoZSBzcGVjaWZpZWQgZnJhbWUgZm9yIHRoZSBnaXZlbiBhbmltYXRpb24gdHJhY2sgYW5kIHBhdGguXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uIHRyYWNrXG4gICAqIEBwYXJhbSBwYXRoTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gcGF0aFxuICAgKiBAcGFyYW0gZnJhbWUgLSBUaGUgZnJhbWUgbnVtYmVyIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQgcmF0ZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGtleWZyYW1lcyBleGlzdCBhdCB0aGUgZnJhbWUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaGFzS2V5RnJhbWVzQXRGcmFtZSh0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSwgcGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lLCBmcmFtZTogSW5kZXgsIGZwczogbnVtYmVyKSB7XG4gICAgY29uc3Qgc2VjQmVnaW4gPSBmcmFtZSAvIGZwcztcbiAgICBjb25zdCBzZWNFbmQgPSAoZnJhbWUgKyAxKSAvIGZwcztcblxuICAgIGNvbnN0IGNoYW5uZWwgPSB0aGlzLl9fYW5pbWF0aW9uVHJhY2suZ2V0KHBhdGhOYW1lKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGNoYW5uZWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGlucHV0ID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXRbaV07XG4gICAgICBpZiAoc2VjQmVnaW4gPD0gaW5wdXQgJiYgaW5wdXQgPCBzZWNFbmQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFuaW1hdGlvbiBnbG9iYWwgaW5mbyBtYXAgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKiBDcmVhdGVzIGEgbmV3IG1hcCBpZiBvbmUgZG9lc24ndCBleGlzdCBmb3IgdGhlIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBhbmltYXRpb24gaW5mbyBmb3JcbiAgICogQHJldHVybnMgVGhlIGFuaW1hdGlvbiBnbG9iYWwgaW5mbyBtYXAgZm9yIHRoZSBlbmdpbmVcbiAgICovXG4gIHN0YXRpYyBnZXRBbmltYXRpb25HbG9iYWxJbmZvKGVuZ2luZTogRW5naW5lKTogTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uSW5mbz4ge1xuICAgIGxldCBpbmZvTWFwID0gdGhpcy5fX2FuaW1hdGlvbkdsb2JhbEluZm9NYXAuZ2V0KGVuZ2luZSk7XG4gICAgaWYgKGluZm9NYXAgPT0gbnVsbCkge1xuICAgICAgaW5mb01hcCA9IG5ldyBNYXAoKTtcbiAgICAgIHRoaXMuX19hbmltYXRpb25HbG9iYWxJbmZvTWFwLnNldChlbmdpbmUsIGluZm9NYXApO1xuICAgIH1cbiAgICByZXR1cm4gaW5mb01hcDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fcmVjYWxjdWxhdGVBbmltYXRpb25JbmZvKGVuZ2luZTogRW5naW5lLCB0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSkge1xuICAgIGxldCBtaW5TdGFydElucHV0VGltZSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBsZXQgbWF4RW5kSW5wdXRUaW1lID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoQW5pbWF0aW9uQ29tcG9uZW50KSBhcyBBbmltYXRpb25Db21wb25lbnRbXTtcbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgICBmb3IgKGNvbnN0IFssIGNoYW5uZWxdIG9mIGNvbXBvbmVudC5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICAgIGlmICghY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKS5pbmNsdWRlcyh0cmFja05hbWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2FtcGxlciA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSk7XG4gICAgICAgIGlmIChzYW1wbGVyLmlucHV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIG1pblN0YXJ0SW5wdXRUaW1lID0gTWF0aC5taW4obWluU3RhcnRJbnB1dFRpbWUsIHNhbXBsZXIuaW5wdXRbMF0pO1xuICAgICAgICBtYXhFbmRJbnB1dFRpbWUgPSBNYXRoLm1heChtYXhFbmRJbnB1dFRpbWUsIHNhbXBsZXIuaW5wdXRbc2FtcGxlci5pbnB1dC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IEFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25HbG9iYWxJbmZvKGVuZ2luZSk7XG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShtaW5TdGFydElucHV0VGltZSkgJiYgTnVtYmVyLmlzRmluaXRlKG1heEVuZElucHV0VGltZSkpIHtcbiAgICAgIGFuaW1hdGlvbkdsb2JhbEluZm8uc2V0KHRyYWNrTmFtZSwge1xuICAgICAgICBuYW1lOiB0cmFja05hbWUsXG4gICAgICAgIG1pblN0YXJ0SW5wdXRUaW1lLFxuICAgICAgICBtYXhFbmRJbnB1dFRpbWUsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYW5pbWF0aW9uR2xvYmFsSW5mby5kZWxldGUodHJhY2tOYW1lKTtcbiAgICB9XG4gICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fcHVic3ViLnB1Ymxpc2hBc3luYyhBbmltYXRpb25Db21wb25lbnQuRXZlbnQuQ2hhbmdlQW5pbWF0aW9uSW5mbywge1xuICAgICAgaW5mb01hcDogbmV3IE1hcChhbmltYXRpb25HbG9iYWxJbmZvKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbmltYXRpb24gc3RhdGUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBzZXQgdGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3JcbiAgICogQHBhcmFtIGZsYWcgLSBUcnVlIHRvIGVuYWJsZSBhbmltYXRpb24sIGZhbHNlIHRvIGRpc2FibGVcbiAgICovXG4gIHN0YXRpYyBzZXRJc0FuaW1hdGluZyhlbmdpbmU6IEVuZ2luZSwgZmxhZzogYm9vbGVhbikge1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5zZXRJc0FuaW1hdGluZyhlbmdpbmUsIGZsYWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3IgdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGdldCB0aGUgYW5pbWF0aW9uIHN0YXRlIGZvclxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFuaW1hdGlvbiBpcyBlbmFibGVkIGZvciB0aGUgZW5naW5lLCBkZWZhdWx0cyB0byB0cnVlIGlmIG5vdCBzZXRcbiAgICovXG4gIHN0YXRpYyBnZXRJc0FuaW1hdGluZyhlbmdpbmU6IEVuZ2luZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuZ2V0SXNBbmltYXRpbmcoZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnbG9iYWwgYW5pbWF0aW9uIHRpbWUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBzZXQgdGhlIGdsb2JhbCB0aW1lIGZvclxuICAgKiBAcGFyYW0gdGltZSAtIFRoZSBnbG9iYWwgYW5pbWF0aW9uIHRpbWUgaW4gc2Vjb25kc1xuICAgKi9cbiAgc3RhdGljIHNldEdsb2JhbFRpbWUoZW5naW5lOiBFbmdpbmUsIHRpbWU6IG51bWJlcikge1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5zZXRHbG9iYWxUaW1lKGVuZ2luZSwgdGltZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ2xvYmFsIGFuaW1hdGlvbiB0aW1lIGZvciB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBnbG9iYWwgdGltZSBmb3JcbiAgICogQHJldHVybnMgVGhlIGdsb2JhbCBhbmltYXRpb24gdGltZSBmb3IgdGhlIGVuZ2luZSwgZGVmYXVsdHMgdG8gMCBpZiBub3Qgc2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0R2xvYmFsVGltZShlbmdpbmU6IEVuZ2luZSk6IG51bWJlciB7XG4gICAgcmV0dXJuIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5nZXRHbG9iYWxUaW1lKGVuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSBzaGFsbG93IGNvcHkgb2YgYW5vdGhlciBhbmltYXRpb24gY29tcG9uZW50J3MgZGF0YSBpbnRvIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gY29tcG9uZW50XyAtIFRoZSBzb3VyY2UgYW5pbWF0aW9uIGNvbXBvbmVudCB0byBjb3B5IGZyb21cbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgQW5pbWF0aW9uQ29tcG9uZW50O1xuXG4gICAgdGhpcy5fX2FuaW1hdGlvblRyYWNrID0gbmV3IE1hcChjb21wb25lbnQuX19hbmltYXRpb25UcmFjayk7XG4gICAgdGhpcy5fX2FuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2hlcyA9IG5ldyBNYXAoY29tcG9uZW50Ll9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzKTtcbiAgICBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkubWFya0FuaW1hdGlvbkJpbmRpbmdDaGFuZ2VkKCk7XG4gICAgdGhpcy5fX2lzRWZmZWtzZWVyU3RhdGUgPSBjb21wb25lbnQuX19pc0VmZmVrc2VlclN0YXRlO1xuICAgIHRoaXMuX19pc0FuaW1hdGluZyA9IGNvbXBvbmVudC5fX2lzQW5pbWF0aW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgYW5pbWF0aW9uIHJldGFyZ2V0aW5nIGZyb20gYSBzb3VyY2UgZW50aXR5IHRvIHRoaXMgZW50aXR5LlxuICAgKiBAcGFyYW0gcmV0YXJnZXQgLSBUaGUgcmV0YXJnZXRpbmcgaW50ZXJmYWNlIHRoYXQgZGVmaW5lcyBob3cgdG8gbWFwIGFuaW1hdGlvbnNcbiAgICogQHBhcmFtIHBvc3RmaXhUb1RyYWNrTmFtZSAtIE9wdGlvbmFsIHBvc3RmaXggdG8gYXBwZW5kIHRvIHRyYWNrIG5hbWVzXG4gICAqIEBwYXJhbSBleGNsdWRlZFBhdGhOYW1lcyAtIEFuaW1hdGlvbiBwYXRocyB0byBvbWl0IHdoaWxlIGNvcHlpbmcgc291cmNlIHRyYWNrc1xuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBjcmVhdGVkIHRyYWNrIG5hbWVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0UmV0YXJnZXQoXG4gICAgcmV0YXJnZXQ6IElBbmltYXRpb25SZXRhcmdldCxcbiAgICBwb3N0Zml4VG9UcmFja05hbWU/OiBzdHJpbmcsXG4gICAgZXhjbHVkZWRQYXRoTmFtZXM6IHJlYWRvbmx5IEFuaW1hdGlvblBhdGhOYW1lW10gPSBbXVxuICApOiBzdHJpbmdbXSB7XG4gICAgY29uc3Qgc3JjRW50aXR5ID0gcmV0YXJnZXQuZ2V0RW50aXR5KCk7XG4gICAgY29uc3Qgc3JjQW5pbSA9IHNyY0VudGl0eS50cnlUb0dldEFuaW1hdGlvbigpO1xuICAgIGNvbnN0IGRzdEVudGl0eSA9IHRoaXMuZW50aXR5O1xuICAgIHRoaXMuZW50aXR5LmdldFRyYW5zZm9ybSgpLl9iYWNrdXBUcmFuc2Zvcm1Bc1Jlc3QoKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KHNyY0FuaW0pKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHNyY0FuaW0udXNlR2xvYmFsVGltZSA9IGZhbHNlO1xuICAgIGNvbnN0IHRyYWNrTmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIHNyY0FuaW0uX19hbmltYXRpb25UcmFjaykge1xuICAgICAgaWYgKGV4Y2x1ZGVkUGF0aE5hbWVzLmluY2x1ZGVzKGNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFuaW1hdGVkVmFsdWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWU7XG4gICAgICBmb3IgKGNvbnN0IF90cmFja05hbWUgb2YgYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkpIHtcbiAgICAgICAgY29uc3QgdHJhY2tOYW1lID0gX3RyYWNrTmFtZSArIChwb3N0Zml4VG9UcmFja05hbWUgPz8gJycpO1xuICAgICAgICB0cmFja05hbWVzLnB1c2godHJhY2tOYW1lKTtcblxuICAgICAgICBjb25zdCBpbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcihfdHJhY2tOYW1lKS5pbnB1dDtcbiAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lID09PSAndHJhbnNsYXRlJykge1xuICAgICAgICAgIGNvbnN0IG91dHB1dHMgPSByZXRhcmdldFRyYW5zbGF0ZShpbnB1dCwgc3JjQW5pbSk7XG4gICAgICAgICAgY29uc3Qgc2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgICBzYW1wbGVycy5zZXQodHJhY2tOYW1lLCB7XG4gICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgIG91dHB1dDogb3V0cHV0cyxcbiAgICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IDMsXG4gICAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIoX3RyYWNrTmFtZSkuaW50ZXJwb2xhdGlvbk1ldGhvZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhzYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB0aGlzLnNldEFuaW1hdGlvbihwYXRoTmFtZSBhcyBBbmltYXRpb25QYXRoTmFtZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5uZWwudGFyZ2V0LnBhdGhOYW1lID09PSAncXVhdGVybmlvbicpIHtcbiAgICAgICAgICBjb25zdCBvdXRwdXRzID0gcmV0YXJnZXRRdWF0ZXJuaW9uKGlucHV0LCBzcmNBbmltKTtcbiAgICAgICAgICBjb25zdCBzYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICAgIHNhbXBsZXJzLnNldCh0cmFja05hbWUsIHtcbiAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRzLFxuICAgICAgICAgICAgb3V0cHV0Q29tcG9uZW50TjogNCxcbiAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcihfdHJhY2tOYW1lKS5pbnRlcnBvbGF0aW9uTWV0aG9kLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRRdWF0ZXJuaW9uKHNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKHBhdGhOYW1lIGFzIEFuaW1hdGlvblBhdGhOYW1lLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aE5hbWUgPT09ICdzY2FsZScpIHtcbiAgICAgICAgICBjb25zdCBvdXRwdXRzID0gcmV0YXJnZXRTY2FsZShpbnB1dCwgc3JjQW5pbSk7XG4gICAgICAgICAgY29uc3Qgc2FtcGxlcnMgPSBuZXcgTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uU2FtcGxlcj4oKTtcbiAgICAgICAgICBzYW1wbGVycy5zZXQodHJhY2tOYW1lLCB7XG4gICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgIG91dHB1dDogb3V0cHV0cyxcbiAgICAgICAgICAgIG91dHB1dENvbXBvbmVudE46IDMsXG4gICAgICAgICAgICBpbnRlcnBvbGF0aW9uTWV0aG9kOiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIoX3RyYWNrTmFtZSkuaW50ZXJwb2xhdGlvbk1ldGhvZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCBuZXdBbmltYXRlZFZhbHVlID0gbmV3IEFuaW1hdGVkVmVjdG9yMyhzYW1wbGVycywgdHJhY2tOYW1lKTtcbiAgICAgICAgICB0aGlzLnNldEFuaW1hdGlvbihwYXRoTmFtZSBhcyBBbmltYXRpb25QYXRoTmFtZSwgbmV3QW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXRhcmdldFRyYW5zbGF0ZShpbnB1dDogRmxvYXQzMkFycmF5LCBzcmNBbmltOiBBbmltYXRpb25Db21wb25lbnQpIHtcbiAgICAgIGNvbnN0IG91dHB1dHNUcmFuc2xhdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXQubGVuZ3RoICogMyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNyY0FuaW0udGltZSA9IGlucHV0W2ldO1xuICAgICAgICAoc3JjQW5pbSBhcyBhbnkpLl9fYXBwbHlBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0VHJhbnNsYXRpb24gPSByZXRhcmdldC5yZXRhcmdldFRyYW5zbGF0ZShkc3RFbnRpdHkpO1xuICAgICAgICBvdXRwdXRzVHJhbnNsYXRpb25baSAqIDMgKyAwXSA9IG91dHB1dFRyYW5zbGF0aW9uLng7XG4gICAgICAgIG91dHB1dHNUcmFuc2xhdGlvbltpICogMyArIDFdID0gb3V0cHV0VHJhbnNsYXRpb24ueTtcbiAgICAgICAgb3V0cHV0c1RyYW5zbGF0aW9uW2kgKiAzICsgMl0gPSBvdXRwdXRUcmFuc2xhdGlvbi56O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG91dHB1dHNUcmFuc2xhdGlvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXRhcmdldFF1YXRlcm5pb24oaW5wdXQ6IEZsb2F0MzJBcnJheSwgc3JjQW5pbTogQW5pbWF0aW9uQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCBvdXRwdXRzUXVhdGVybmlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXQubGVuZ3RoICogNCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNyY0FuaW0udGltZSA9IGlucHV0W2ldO1xuICAgICAgICAoc3JjQW5pbSBhcyBhbnkpLl9fYXBwbHlBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0UXVhdGVybmlvbiA9IHJldGFyZ2V0LnJldGFyZ2V0UXVhdGVybmlvbihkc3RFbnRpdHkpO1xuICAgICAgICBvdXRwdXRzUXVhdGVybmlvbltpICogNCArIDBdID0gb3V0cHV0UXVhdGVybmlvbi54O1xuICAgICAgICBvdXRwdXRzUXVhdGVybmlvbltpICogNCArIDFdID0gb3V0cHV0UXVhdGVybmlvbi55O1xuICAgICAgICBvdXRwdXRzUXVhdGVybmlvbltpICogNCArIDJdID0gb3V0cHV0UXVhdGVybmlvbi56O1xuICAgICAgICBvdXRwdXRzUXVhdGVybmlvbltpICogNCArIDNdID0gb3V0cHV0UXVhdGVybmlvbi53O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG91dHB1dHNRdWF0ZXJuaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJldGFyZ2V0U2NhbGUoaW5wdXQ6IEZsb2F0MzJBcnJheSwgc3JjQW5pbTogQW5pbWF0aW9uQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCBvdXRwdXRzU2NhbGUgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0Lmxlbmd0aCAqIDMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgICBzcmNBbmltLnRpbWUgPSBpbnB1dFtpXTtcbiAgICAgICAgKHNyY0FuaW0gYXMgYW55KS5fX2FwcGx5QW5pbWF0aW9uKCk7XG4gICAgICAgIGNvbnN0IG91dHB1dFNjYWxlID0gcmV0YXJnZXQucmV0YXJnZXRTY2FsZShkc3RFbnRpdHkpO1xuICAgICAgICBvdXRwdXRzU2NhbGVbaSAqIDMgKyAwXSA9IG91dHB1dFNjYWxlLng7XG4gICAgICAgIG91dHB1dHNTY2FsZVtpICogMyArIDFdID0gb3V0cHV0U2NhbGUueTtcbiAgICAgICAgb3V0cHV0c1NjYWxlW2kgKiAzICsgMl0gPSBvdXRwdXRTY2FsZS56O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG91dHB1dHNTY2FsZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhY2tOYW1lcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYWxsIGFuaW1hdGlvbiB0cmFja3MsIGNsZWFyaW5nIGFsbCBhbmltYXRpb24gZGF0YSBmcm9tIHRoaXMgY29tcG9uZW50LlxuICAgKi9cbiAgcmVzZXRBbmltYXRpb25UcmFja3MoKSB7XG4gICAgY29uc3QgdHJhY2tOYW1lcyA9IG5ldyBTZXQodGhpcy5nZXRBbmltYXRpb25UcmFja05hbWVzKCkpO1xuICAgIHRoaXMuX19hbmltYXRpb25UcmFjay5jbGVhcigpO1xuICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIHRyYWNrTmFtZXMpIHtcbiAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX3JlY2FsY3VsYXRlQW5pbWF0aW9uSW5mbyh0aGlzLl9fZW5naW5lLCB0cmFja05hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9fdXBkYXRlQW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIGEgc3BlY2lmaWMgYW5pbWF0aW9uIHRyYWNrIGJ5IHJlbW92aW5nIGl0cyBhbmltYXRpb24gc2FtcGxlciBkYXRhLlxuICAgKiBAcGFyYW0gdHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFjayB0byByZXNldFxuICAgKi9cbiAgcmVzZXRBbmltYXRpb25UcmFjayh0cmFja05hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGVtcHR5UGF0aE5hbWVzOiBBbmltYXRpb25QYXRoTmFtZVtdID0gW107XG4gICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIHRoaXMuX19hbmltYXRpb25UcmFjaykge1xuICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICAgIGNvbnN0IHJlYmluZHNGaXJzdEFjdGl2ZVNhbXBsZXIgPSBhbmltYXRlZFZhbHVlLmdldEZpcnN0QWN0aXZlQW5pbWF0aW9uU2FtcGxlclRyYWNrTmFtZSgpID09PSB0cmFja05hbWU7XG4gICAgICBjb25zdCByZWJpbmRzU2Vjb25kQWN0aXZlU2FtcGxlciA9IGFuaW1hdGVkVmFsdWUuZ2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uU2FtcGxlclRyYWNrTmFtZSgpID09PSB0cmFja05hbWU7XG4gICAgICBhbmltYXRlZFZhbHVlLmRlbGV0ZUFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKTtcbiAgICAgIGNvbnN0IHJlbWFpbmluZ1RyYWNrTmFtZXMgPSBhbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKTtcbiAgICAgIGlmIChyZW1haW5pbmdUcmFja05hbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBlbXB0eVBhdGhOYW1lcy5wdXNoKHBhdGhOYW1lKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBmYWxsYmFja1RyYWNrTmFtZSA9IHJlbWFpbmluZ1RyYWNrTmFtZXNbMF07XG4gICAgICBpZiAocmViaW5kc0ZpcnN0QWN0aXZlU2FtcGxlcikge1xuICAgICAgICBhbmltYXRlZFZhbHVlLnNldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKGZhbGxiYWNrVHJhY2tOYW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWJpbmRzU2Vjb25kQWN0aXZlU2FtcGxlcikge1xuICAgICAgICBhbmltYXRlZFZhbHVlLnNldFNlY29uZEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZShmYWxsYmFja1RyYWNrTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgcGF0aE5hbWUgb2YgZW1wdHlQYXRoTmFtZXMpIHtcbiAgICAgIHRoaXMuX19hbmltYXRpb25UcmFjay5kZWxldGUocGF0aE5hbWUpO1xuICAgIH1cbiAgICBBbmltYXRpb25Db21wb25lbnQuX19yZWNhbGN1bGF0ZUFuaW1hdGlvbkluZm8odGhpcy5fX2VuZ2luZSwgdHJhY2tOYW1lKTtcbiAgICB0aGlzLl9fdXBkYXRlQW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIGFsbCBhbmltYXRpb24gdHJhY2tzIHRoYXQgaGF2ZSBuYW1lcyBlbmRpbmcgd2l0aCB0aGUgc3BlY2lmaWVkIHBvc3RmaXguXG4gICAqIEBwYXJhbSBwb3N0Zml4IC0gVGhlIHBvc3RmaXggdG8gbWF0Y2ggYWdhaW5zdCB0cmFjayBuYW1lc1xuICAgKi9cbiAgcmVzZXRBbmltYXRpb25UcmFja0J5UG9zdGZpeChwb3N0Zml4OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0cmFja05hbWVzID0gbmV3IFNldCh0aGlzLmdldEFuaW1hdGlvblRyYWNrTmFtZXMoKSk7XG4gICAgZm9yIChjb25zdCB0cmFja05hbWUgb2YgdHJhY2tOYW1lcykge1xuICAgICAgaWYgKHRyYWNrTmFtZS5lbmRzV2l0aChwb3N0Zml4KSkge1xuICAgICAgICB0aGlzLnJlc2V0QW5pbWF0aW9uVHJhY2sodHJhY2tOYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjdXJyZW50VHJhY2tGZWF0dXJlSGFzaCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzLmdldCh0aGlzLmdldEFjdGl2ZUFuaW1hdGlvblRyYWNrKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZlYXR1cmUgaGFzaCBmb3IgYSBzcGVjaWZpYyBhbmltYXRpb24gdHJhY2suXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgYW5pbWF0aW9uIHRyYWNrIHdob3NlIGZlYXR1cmUgaGFzaCBzaG91bGQgYmUgcmV0dXJuZWRcbiAgICogQHJldHVybnMgVGhlIGZlYXR1cmUgaGFzaCwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIHRyYWNrIGlzIG5vdCByZWdpc3RlcmVkXG4gICAqL1xuICBnZXRBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoKHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX2FuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2hlcy5nZXQodHJhY2tOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGlzIGNvbXBvbmVudCwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIGFuZCBjbGVhcmluZyBhbmltYXRpb24gZGF0YS5cbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICBjb25zdCB0cmFja05hbWVzID0gbmV3IFNldCh0aGlzLmdldEFuaW1hdGlvblRyYWNrTmFtZXMoKSk7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uVHJhY2suY2xlYXIoKTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fX2lzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5Lm1hcmtBbmltYXRpb25CaW5kaW5nQ2hhbmdlZCgpO1xuICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIHRyYWNrTmFtZXMpIHtcbiAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX3JlY2FsY3VsYXRlQW5pbWF0aW9uSW5mbyh0aGlzLl9fZW5naW5lLCB0cmFja05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX191cGRhdGVBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMoKSB7XG4gICAgQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5Lm1hcmtBbmltYXRpb25CaW5kaW5nQ2hhbmdlZCgpO1xuICAgIGNvbnN0IGZlYXR1cmVNYXA6IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblRyYWNrRmVhdHVyZT4gPSBuZXcgTWFwKCk7XG5cbiAgICBmb3IgKGNvbnN0IFtwYXRoTmFtZSwgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKSB7XG4gICAgICAgIGNvbnN0IHNhbXBsZXIgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpO1xuICAgICAgICBsZXQgZmVhdHVyZSA9IGZlYXR1cmVNYXAuZ2V0KHRyYWNrTmFtZSk7XG4gICAgICAgIGlmIChJcy5ub3QuZXhpc3QoZmVhdHVyZSkpIHtcbiAgICAgICAgICBmZWF0dXJlID0ge1xuICAgICAgICAgICAgdHJhY2tOYW1lLFxuICAgICAgICAgICAgcGF0aE5hbWVzOiBuZXcgU2V0PEFuaW1hdGlvblBhdGhOYW1lPigpLFxuICAgICAgICAgICAgbWluU3RhcnRJbnB1dFRpbWU6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcbiAgICAgICAgICAgIG1heEVuZElucHV0VGltZTogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxuICAgICAgICAgICAgdG90YWxLZXlmcmFtZXM6IDAsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBmZWF0dXJlTWFwLnNldCh0cmFja05hbWUsIGZlYXR1cmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmVhdHVyZS5wYXRoTmFtZXMuYWRkKHBhdGhOYW1lKTtcbiAgICAgICAgaWYgKHNhbXBsZXIuaW5wdXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZlYXR1cmUubWluU3RhcnRJbnB1dFRpbWUgPSBNYXRoLm1pbihmZWF0dXJlLm1pblN0YXJ0SW5wdXRUaW1lLCBzYW1wbGVyLmlucHV0WzBdKTtcbiAgICAgICAgICBmZWF0dXJlLm1heEVuZElucHV0VGltZSA9IE1hdGgubWF4KGZlYXR1cmUubWF4RW5kSW5wdXRUaW1lLCBzYW1wbGVyLmlucHV0W3NhbXBsZXIuaW5wdXQubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgIGZlYXR1cmUudG90YWxLZXlmcmFtZXMgKz0gc2FtcGxlci5pbnB1dC5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFssIGZlYXR1cmVdIG9mIGZlYXR1cmVNYXApIHtcbiAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGZlYXR1cmUubWluU3RhcnRJbnB1dFRpbWUpKSB7XG4gICAgICAgIGZlYXR1cmUubWluU3RhcnRJbnB1dFRpbWUgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZmVhdHVyZS5tYXhFbmRJbnB1dFRpbWUpKSB7XG4gICAgICAgIGZlYXR1cmUubWF4RW5kSW5wdXRUaW1lID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBoYXNoTWFwOiBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IHNvcnRlZFRyYWNrTmFtZXMgPSBBcnJheS5mcm9tKGZlYXR1cmVNYXAua2V5cygpKS5zb3J0KCk7XG4gICAgZm9yIChjb25zdCB0cmFja05hbWUgb2Ygc29ydGVkVHJhY2tOYW1lcykge1xuICAgICAgY29uc3QgZmVhdHVyZSA9IGZlYXR1cmVNYXAuZ2V0KHRyYWNrTmFtZSkhO1xuICAgICAgY29uc3Qgc2VyaWFsaXplZCA9IFtcbiAgICAgICAgdHJhY2tOYW1lLFxuICAgICAgICBBcnJheS5mcm9tKGZlYXR1cmUucGF0aE5hbWVzKS5zb3J0KCkuam9pbignLCcpLFxuICAgICAgICBmZWF0dXJlLm1pblN0YXJ0SW5wdXRUaW1lLFxuICAgICAgICBmZWF0dXJlLm1heEVuZElucHV0VGltZSxcbiAgICAgICAgZmVhdHVyZS50b3RhbEtleWZyYW1lcyxcbiAgICAgIF0uam9pbignfCcpO1xuICAgICAgY29uc3QgaGFzaCA9IERhdGFVdGlsLnRvQ1JDMzIoc2VyaWFsaXplZCk7XG4gICAgICBoYXNoTWFwLnNldCh0cmFja05hbWUsIGhhc2gpO1xuICAgIH1cblxuICAgIHRoaXMuX19hbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMgPSBoYXNoTWFwO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBzdGF0aWMgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gY2xlYW4gdXAgcmVzb3VyY2VzIGZvclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX2FuaW1hdGlvbkdsb2JhbEluZm9NYXAuZGVsZXRlKGVuZ2luZSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFXQSxTQUFTLG1DQUFtQztBQUM1QyxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLDBCQUEwQjtBQUVuQyxTQUFTLGdCQUE2QjtBQUN0QyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLHVCQUF1QjtBQUdoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUcvQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLFVBQVU7QUFFbkIsU0FBNEIsbUJBQW1CO0FBTS9DLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZ0NBQWdDO0FBRXpDLElBQU0sc0JBQXNCLHVCQUFPLDRDQUE0QztBQUMvRSxJQUFNLFVBQVUsdUJBQU8sZ0NBQWdDO0FBQ3ZELElBQU0sMEJBQTBCO0FBZXpCLElBQU0sc0JBQU4sTUFBTSw0QkFBMkIsVUFBVTtBQUFBLEVBQTNDO0FBQUE7QUFHTDtBQUFBO0FBQUEsU0FBUSwyQkFBMkI7QUFHbkM7QUFBQTtBQUFBLFNBQVEsbUJBQW1DLG9CQUFJLElBQUk7QUFDbkQsU0FBUSxnQ0FBaUUsb0JBQUksSUFBSTtBQUlqRixTQUFRLHFCQUFxQjtBQUc3QjtBQUFBLFNBQVEseUJBQXlCLG9CQUFJLElBQW9CO0FBR3pEO0FBQUEsU0FBUSwrQkFBK0Isb0JBQUksSUFBb0I7QUFHL0Q7QUFBQSxTQUFRLGdCQUFnQjtBQUN4QixTQUFPLFNBQVM7QUFHaEI7QUFBQSxTQUFPLGdCQUFnQjtBQUd2QjtBQUFBLFNBQU8sT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQW1CZCxRQUFRO0FBQ04sU0FBSyxZQUFZLGFBQWEsS0FBSztBQUFBLEVBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFvQkEsU0FBUztBQUVQLFFBQUksQ0FBQyxLQUFLLG1CQUFtQixHQUFHO0FBQzlCO0FBQUEsSUFDRjtBQXNCQSxRQUFJLHlCQUF5QixlQUFlLEtBQUssYUFBYSxLQUFLLFFBQVEsR0FBRztBQUM1RTtBQUFBLElBQ0Y7QUFHQSxTQUFLLGlCQUFpQjtBQUFBLEVBQ3hCO0FBQUEsRUFFTyxxQkFBcUI7QUFDMUIsUUFBSSxvQkFBbUIsZUFBZSxLQUFLLFFBQVEsS0FBSyxLQUFLLGFBQWE7QUFDeEUsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLHVCQUF1QixPQUFlO0FBQ3hDLFNBQUssMkJBQTJCO0FBQ2hDLFNBQUssaUJBQWlCO0FBQUEsRUFDeEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSwwQ0FBMEMsT0FBZTtBQUN2RCxTQUFLLDJCQUEyQjtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUkseUJBQXlCO0FBQzNCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPUSxtQkFBbUI7QUFyTTdCO0FBc01JLFFBQUksT0FBTyxLQUFLO0FBQ2hCLFFBQUksS0FBSyxlQUFlO0FBQ3RCLGFBQU8sb0JBQW1CLGNBQWMsS0FBSyxRQUFRO0FBQUEsSUFDdkQ7QUFFQSxVQUFNLHFCQUFzQixLQUFLLE9BQXdDLGFBQWE7QUFHdEYsVUFBTSxpQ0FBaUMsQ0FBRSxLQUFLLE9BQXdDLGNBQWMsRUFDakc7QUFDSCxVQUFNLHNCQUFzQixLQUFLLE9BQU8sbUJBQW1CO0FBQzNELFVBQU0scUJBQXFCLEtBQUssT0FBTyxrQkFBa0I7QUFDekQsUUFBSTtBQUNKLFVBQU0sZ0JBQWdCLEtBQUs7QUFFM0IsZUFBVyxDQUFDLFVBQVUsT0FBTyxLQUFLLEtBQUssa0JBQWtCO0FBQ3ZELFlBQU0sZ0JBQWdCLFFBQVE7QUFFOUIsWUFBTSwwQkFBMEIsY0FBYztBQUM5QyxVQUFJLDJCQUEyQixNQUFNO0FBQ25DLGdDQUF3QixLQUFLLGVBQWUsTUFBTSxhQUFhO0FBQUEsTUFDakUsT0FBTztBQUNMLHNCQUFjLFFBQVEsSUFBSTtBQUMxQixzQkFBYyxnQkFBZ0I7QUFBQSxNQUNoQztBQUVBLFVBQUksU0FBUyxXQUFXLHVCQUF1QixHQUFHO0FBQ2hELFlBQUkseUJBQXlCLFFBQVc7QUFDdEMscUJBQUssMkJBQUwsaUJBQUsseUJBQTJCLG9CQUFJLElBQUk7QUFDeEMsaUNBQXVCLEtBQUs7QUFDNUIsK0JBQXFCLE1BQU07QUFBQSxRQUM3QjtBQUNBLGNBQU0saUJBQWlCLFNBQVMsVUFBVSx3QkFBd0IsTUFBTTtBQUN4RSw2QkFBcUIsSUFBSSxnQkFBaUIsUUFBUSxjQUFvQyxDQUFDO0FBQ3ZGO0FBQUEsTUFDRjtBQUNBLFdBQUs7QUFBQSxRQUNIO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksR0FBRyxNQUFNLG9CQUFvQixHQUFHO0FBQ2xDLFlBQU0sZUFBZSxLQUFLLE9BQU8sWUFBWTtBQUM3QyxVQUFJLEdBQUcsTUFBTSxZQUFZLEdBQUc7QUFDMUIscUJBQWEscUJBQXFCLG9CQUFvQjtBQUFBLE1BQ3hEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVRLHdCQUNOLFVBQ0EsU0FDQSxvQkFDQSxnQ0FDQSxxQkFDQSxvQkFDQTtBQUNBLFFBQUksS0FBSywwQkFBMEIsVUFBVSxTQUFTLG9CQUFvQiw4QkFBOEIsRUFBRztBQUMzRyxRQUFJLEtBQUssMkJBQTJCLFVBQVUsU0FBUyxtQkFBbUIsRUFBRztBQUM3RSxRQUFJLEtBQUssMkJBQTJCLFVBQVUsT0FBTyxFQUFHO0FBQ3hELFFBQUksS0FBSyx5QkFBeUIsVUFBVSxPQUFPLEVBQUc7QUFDdEQsUUFBSSxLQUFLLHNCQUFzQixVQUFVLE9BQU8sRUFBRztBQUNuRCxRQUFJLEtBQUssdUJBQXVCLFVBQVUsT0FBTyxFQUFHO0FBQ3BELFFBQUksS0FBSywwQkFBMEIsVUFBVSxTQUFTLGtCQUFrQixFQUFHO0FBQUEsRUFDN0U7QUFBQSxFQUVRLDBCQUNOLFVBQ0EsU0FDQSxvQkFDQSxnQ0FDUztBQUNULFVBQU0sZ0JBQWdCLFFBQVE7QUFDOUIsUUFBSSxhQUFhLGFBQWE7QUFDNUIsVUFDRSxLQUFLO0FBQUEsUUFDSDtBQUFBLFFBQ0EsbUJBQW1CLG1CQUFtQjtBQUFBLFFBQ3RDO0FBQUEsTUFDRixHQUNBO0FBQ0EsMkJBQW1CLGdCQUFnQjtBQUFBLE1BQ3JDO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLGFBQWEsY0FBYztBQUM3QixVQUNFLEtBQUs7QUFBQSxRQUNIO0FBQUEsUUFDQSxtQkFBbUIsbUJBQW1CO0FBQUEsUUFDdEM7QUFBQSxNQUNGLEdBQ0E7QUFDQSwyQkFBbUIsZ0JBQWdCO0FBQUEsTUFDckM7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksYUFBYSxTQUFTO0FBQ3hCLFVBQ0UsS0FBSztBQUFBLFFBQ0g7QUFBQSxRQUNBLG1CQUFtQixnQkFBZ0I7QUFBQSxRQUNuQztBQUFBLE1BQ0YsR0FDQTtBQUNBLDJCQUFtQixhQUFhO0FBQUEsTUFDbEM7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjUSw0QkFDTixlQUNBLGNBQ0EsZ0NBQ1M7QUEzVWI7QUE0VUksUUFBSSxDQUFDLGdDQUFnQztBQUNuQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sWUFBVyxtQkFBYyxrQkFBZDtBQUNqQixRQUFJLGFBQWEsVUFBYSxTQUFTLFdBQVcsYUFBYSxRQUFRO0FBQ3JFLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBUyxJQUFJLEdBQUcsSUFBSSxTQUFTLFFBQVEsS0FBSztBQUN4QyxVQUFJLFNBQVMsQ0FBQyxNQUFNLGFBQWEsQ0FBQyxHQUFHO0FBQ25DLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFUSwyQkFDTixVQUNBLFNBQ0EscUJBQ1M7QUEvVmI7QUFnV0ksUUFBSSxhQUFhLFdBQVc7QUFDMUIsWUFBTSxnQkFBZ0IsUUFBUTtBQUM5QixZQUFNLFNBQVEsbUJBQWMsa0JBQWQ7QUFDZCxVQUFJLFVBQVUsUUFBVztBQUN2Qiw0QkFBcUIsd0JBQXdCLEtBQUs7QUFBQSxNQUNwRCxPQUFPO0FBQ0wsNEJBQXFCLFVBQVUsY0FBYyxlQUFlO0FBQUEsTUFDOUQ7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFUSwyQkFBMkIsVUFBa0IsU0FBb0M7QUE3VzNGO0FBOFdJLFFBQUksYUFBYSxjQUFjO0FBQzdCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxhQUFjLEtBQUssT0FBd0MsY0FBYztBQUMvRSxVQUFNLGVBQWdCLFFBQVEsY0FBb0MsSUFBSTtBQUN0RSxRQUFJLFdBQVcsT0FBTyxZQUFZLDJCQUEyQixNQUFNLGNBQWM7QUFDL0UsaUJBQVcsT0FBTyxZQUFZLEVBQUUsS0FBSyw2QkFBNkIsT0FBTyxhQUFhLENBQUM7QUFBQSxJQUN6RjtBQUNBLFNBQUssMkJBQTJCLGFBQVksc0JBQVcsV0FBWCxtQkFBbUIsY0FBbkIsWUFBZ0MsSUFBSTtBQUNoRixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsMkJBQTJCLFlBQWlDLGVBQThCO0FBQ2hHLFVBQU0sZUFBZSxLQUFLLHFCQUFxQixVQUFVO0FBQ3pELFVBQU0sbUJBQW1CLGlCQUFpQjtBQUMxQyxRQUFJLFdBQVcsY0FBYyxrQkFBa0I7QUFDN0MsaUJBQVcsWUFBWTtBQUFBLElBQ3pCO0FBRUEsZUFBVyxTQUFTLFdBQVcsVUFBVTtBQUN2QyxXQUFLLDJCQUEyQixPQUFPLGdCQUFnQjtBQUFBLElBQ3pEO0FBQUEsRUFDRjtBQUFBLEVBRVEscUJBQXFCLFlBQTBDO0FBQ3JFLFVBQU0sZUFBZSxXQUFXLE9BQU8sWUFBWSwyQkFBMkI7QUFDOUUsV0FBTyxPQUFPLGlCQUFpQixZQUFZLGVBQWUsV0FBVztBQUFBLEVBQ3ZFO0FBQUEsRUFFUSx5QkFBeUIsVUFBa0IsU0FBb0M7QUFDckYsUUFBSSxTQUFTLFdBQVcsV0FBVyxHQUFHO0FBQ3BDLFlBQU0sZ0JBQWdCLEtBQUssT0FBTyxhQUFhO0FBQy9DLFVBQUksR0FBRyxNQUFNLGFBQWEsS0FBSyxHQUFHLE1BQU0sY0FBYyxJQUFJLEdBQUc7QUFDM0QsY0FBTSxPQUFPLGNBQWM7QUFDM0IsY0FBTSxnQkFBZ0IsS0FBSywyQkFBMkIsUUFBUTtBQUM5RCxpQkFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLG1CQUFtQixHQUFHLEtBQUs7QUFDbEQsZ0JBQU0sWUFBWSxLQUFLLGVBQWUsQ0FBQztBQUN2QyxnQkFBTSxXQUFXLFVBQVU7QUFDM0IsY0FBSSxHQUFHLE1BQU0sUUFBUSxHQUFHO0FBQ3RCLHFCQUFTLGFBQWEsZUFBZSxRQUFRLGFBQWE7QUFBQSxVQUM1RDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsMkJBQTJCLFVBQTBCO0FBQzNELFFBQUksT0FBTyxLQUFLLDZCQUE2QixJQUFJLFFBQVE7QUFDekQsUUFBSSxTQUFTLFFBQVc7QUFDdEIsYUFBTyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUk7QUFDL0IsV0FBSyw2QkFBNkIsSUFBSSxVQUFVLElBQUk7QUFBQSxJQUN0RDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFUSxzQkFBc0IsVUFBa0IsU0FBb0M7QUFDbEYsVUFBTSxpQkFBaUIsS0FBSyxPQUFPLGNBQWM7QUFDakQsUUFBSSxDQUFDLEdBQUcsTUFBTSxjQUFjLEVBQUcsUUFBTztBQUV0QyxRQUFJLGFBQWEsZUFBZTtBQUM5QixZQUFNLFFBQVEsUUFBUTtBQUN0QixxQkFBZSxRQUFRO0FBQ3ZCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxhQUFhLG1CQUFtQjtBQUNsQyxZQUFNLFlBQVksUUFBUTtBQUMxQixxQkFBZSxZQUFZLFVBQVUsR0FBRyxDQUFDO0FBQ3pDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxhQUFhLGVBQWU7QUFDOUIsWUFBTSxRQUFRLFFBQVE7QUFDdEIscUJBQWUsUUFBUSxNQUFNLEdBQUcsQ0FBQztBQUNqQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksYUFBYSw2QkFBNkI7QUFDNUMsWUFBTSxpQkFBaUIsUUFBUTtBQUMvQixxQkFBZSxpQkFBaUIsZUFBZSxHQUFHLENBQUM7QUFDbkQsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLGFBQWEsNkJBQTZCO0FBQzVDLFlBQU0saUJBQWlCLFFBQVE7QUFDL0IscUJBQWUsaUJBQWlCLGVBQWUsR0FBRyxDQUFDO0FBQ25ELGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLHVCQUF1QixVQUFrQixTQUFvQztBQUNuRixVQUFNLGtCQUFrQixLQUFLLE9BQU8sZUFBZTtBQUNuRCxRQUFJLENBQUMsR0FBRyxNQUFNLGVBQWUsRUFBRyxRQUFPO0FBRXZDLFFBQUksYUFBYSxnQkFBZ0I7QUFDL0IsWUFBTSxRQUFRLFFBQVE7QUFDdEIsc0JBQWdCLFFBQVEsTUFBTSxHQUFHLENBQUM7QUFDbEMsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLGFBQWEsZUFBZTtBQUM5QixZQUFNLE9BQU8sUUFBUTtBQUNyQixzQkFBZ0IsT0FBTyxLQUFLLEdBQUcsQ0FBQztBQUNoQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksYUFBYSxlQUFlO0FBQzlCLFlBQU0sT0FBTyxRQUFRO0FBQ3JCLHNCQUFnQiw0QkFBNEIsU0FBUyxlQUFlLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMvRSxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksYUFBYSxlQUFlO0FBQzlCLFlBQU0sT0FBTyxRQUFRO0FBQ3JCLHNCQUFnQixPQUFPLEtBQUssR0FBRyxDQUFDO0FBQ2hDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxhQUFhLGVBQWU7QUFDOUIsWUFBTSxPQUFPLFFBQVE7QUFDckIsc0JBQWdCLE9BQU8sS0FBSyxHQUFHLENBQUM7QUFDaEMsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsMEJBQ04sVUFDQSxTQUNBLG9CQUNTO0FBQ1QsUUFBSSxhQUFhLGFBQWE7QUFDNUIsVUFBSyxRQUFRLGNBQW9DLElBQUksS0FBSztBQUN4RCxZQUFJLEtBQUssdUJBQXVCLEdBQUc7QUFDakMsbUVBQW9CO0FBQUEsUUFDdEI7QUFBQSxNQUNGLE9BQU87QUFDTCxZQUFJLEtBQUssdUJBQXVCLEdBQUc7QUFDakMsbUVBQW9CO0FBQUEsUUFDdEI7QUFBQSxNQUNGO0FBQ0EsV0FBSyxxQkFBc0IsUUFBUSxjQUFvQztBQUN2RSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxVQUFVLE1BQW1DLFNBQXVCO0FBQ3pFLHdCQUFtQixTQUFTLFVBQVUsTUFBTSxPQUFPO0FBQUEsRUFDckQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsZUFBZSxLQUFjO0FBQzNCLFNBQUssZ0JBQWdCO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsT0FBTyx5QkFBeUIsUUFBZ0Isb0JBQXdDO0FBQ3RGLFVBQU0sYUFBYSxPQUFPLG9CQUFvQixzQkFBc0IsbUJBQWtCO0FBQ3RGLGVBQVcsYUFBYSxZQUFZO0FBQ2xDLGdCQUFVLHdCQUF3QixrQkFBa0I7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsd0JBQXdCLG9CQUF3QztBQUM5RCxlQUFXLENBQUMsRUFBRSxPQUFPLEtBQUssS0FBSyxrQkFBa0I7QUFDL0MsY0FBUSxjQUFjLGlDQUFpQyxrQkFBa0I7QUFBQSxJQUMzRTtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsOEJBQThCLG9CQUF3QztBQUNwRSxlQUFXLENBQUMsRUFBRSxPQUFPLEtBQUssS0FBSyxrQkFBa0I7QUFDL0MsY0FBUSxjQUFjLGtDQUFrQyxrQkFBa0I7QUFBQSxJQUM1RTtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSwwQkFBMEI7QUFDeEIsZUFBVyxDQUFDLEVBQUUsT0FBTyxLQUFLLEtBQUssa0JBQWtCO0FBQy9DLGFBQU8sUUFBUSxjQUFjLGlDQUFpQztBQUFBLElBQ2hFO0FBQ0EsVUFBTSxJQUFJLE1BQU0saUNBQWlDO0FBQUEsRUFDbkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGFBQWEsV0FBK0IsVUFBc0M7QUFDaEYsZUFBVyxDQUFDLGlCQUFpQixPQUFPLEtBQUssS0FBSyxrQkFBa0I7QUFDOUQsYUFBTyxhQUFhLG1CQUFtQixRQUFRLGNBQWMsaUNBQWlDLE1BQU07QUFBQSxJQUN0RztBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxhQUFhLFVBQTZCLGtCQUFrQztBQUMxRSxRQUFJO0FBQ0osVUFBTSx3QkFBd0Isb0JBQUksSUFBd0I7QUFDMUQsUUFBSSxLQUFLLGlCQUFpQixJQUFJLFFBQVEsR0FBRztBQUN2QyxZQUFNLHVCQUF1QixLQUFLLGlCQUFpQixJQUFJLFFBQVEsRUFBRztBQUNsRSxZQUFNLG9CQUFvQixJQUFJLElBQUkscUJBQXFCLGlCQUFpQixDQUFDO0FBQ3pFLGlCQUFXLGFBQWEsaUJBQWlCLGlCQUFpQixHQUFHO0FBQzNELFlBQUksa0JBQWtCLElBQUksU0FBUyxHQUFHO0FBQ3BDLGdDQUFzQixJQUFJLFNBQVM7QUFBQSxRQUNyQztBQUNBLDZCQUFxQixvQkFBb0IsV0FBVyxpQkFBaUIsb0JBQW9CLFNBQVMsQ0FBQztBQUFBLE1BQ3JHO0FBQ0Esc0JBQWdCO0FBQUEsSUFDbEIsT0FBTztBQUNMLFdBQUssaUJBQWlCLElBQUksVUFBVTtBQUFBLFFBQ2xDLGVBQWU7QUFBQSxRQUNmLFFBQVE7QUFBQSxVQUNOO0FBQUEsVUFDQSxRQUFRLEtBQUs7QUFBQSxRQUNmO0FBQUEsTUFDRixDQUFDO0FBQ0Qsc0JBQWdCO0FBQUEsSUFDbEI7QUFHQSxVQUFNLGFBQWEsY0FBYyxpQkFBaUI7QUFDbEQsVUFBTSxzQkFBc0Isb0JBQW1CLHVCQUF1QixLQUFLLFFBQVE7QUFDbkYsZUFBVyxhQUFhLFlBQVk7QUFDbEMsVUFBSSxzQkFBc0IsSUFBSSxTQUFTLEdBQUc7QUFDeEMsNEJBQW1CLDJCQUEyQixLQUFLLFVBQVUsU0FBUztBQUN0RTtBQUFBLE1BQ0Y7QUFDQSxZQUFNLHVCQUF1QixjQUFjLHFCQUFxQixTQUFTO0FBQ3pFLFlBQU0scUJBQXFCLGNBQWMsbUJBQW1CLFNBQVM7QUFDckUsWUFBTSxlQUFlLG9CQUFvQixJQUFJLFNBQVM7QUFFdEQsWUFBTSxPQUFPO0FBQUEsUUFDWCxNQUFNO0FBQUEsUUFDTixtQkFDRSxnQkFBZ0IsT0FBTyx1QkFBdUIsS0FBSyxJQUFJLGFBQWEsbUJBQW1CLG9CQUFvQjtBQUFBLFFBQzdHLGlCQUNFLGdCQUFnQixPQUFPLHFCQUFxQixLQUFLLElBQUksYUFBYSxpQkFBaUIsa0JBQWtCO0FBQUEsTUFDekc7QUFDQSwwQkFBb0IsSUFBSSxXQUFXLElBQUk7QUFDdkMsMEJBQW1CLFNBQVMsYUFBYSxvQkFBbUIsTUFBTSxxQkFBcUI7QUFBQSxRQUNyRixTQUFTLElBQUksSUFBSSxtQkFBbUI7QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDSDtBQUVBLFFBQUksQ0FBQyxTQUFTLFdBQVcsZ0JBQWdCLEdBQUc7QUFDMUMsV0FBSyxPQUFPLGFBQWEsRUFBRSx1QkFBdUI7QUFBQSxJQUNwRDtBQUNBLFNBQUssb0NBQW9DO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxhQUFhLFVBQTZCO0FBeG9CNUM7QUF5b0JJLFlBQU8sVUFBSyxpQkFBaUIsSUFBSSxRQUFRLE1BQWxDLG1CQUFxQztBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT08sOEJBQThCLG9CQUFvQztBQUN2RSxVQUFNLHNCQUFzQixvQkFBbUIsdUJBQXVCLEtBQUssUUFBUTtBQUNuRixXQUFPLG9CQUFvQixJQUFJLGtCQUFrQixFQUFHO0FBQUEsRUFDdEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPTyw0QkFBNEIsb0JBQW9DO0FBQ3JFLFVBQU0sc0JBQXNCLG9CQUFtQix1QkFBdUIsS0FBSyxRQUFRO0FBQ25GLFdBQU8sb0JBQW9CLElBQUksa0JBQWtCLEVBQUc7QUFBQSxFQUN0RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8saUJBQWlCLFFBQXNDO0FBQzVELFVBQU0sc0JBQXNCLEtBQUssdUJBQXVCLE1BQU07QUFDOUQsV0FBTyxNQUFNLEtBQUssb0JBQW9CLEtBQUssQ0FBQztBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxpQkFBaUIsUUFBd0Q7QUFDOUUsV0FBTyxJQUFJLElBQUksS0FBSyx1QkFBdUIsTUFBTSxDQUFDO0FBQUEsRUFDcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTU8seUJBQStDO0FBQ3BELFVBQU0sYUFBYSxDQUFDO0FBQ3BCLGVBQVcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxLQUFLLGtCQUFrQjtBQUMvQyxpQkFBVyxLQUFLLEdBQUcsUUFBUSxjQUFjLGlCQUFpQixDQUFDO0FBQUEsSUFDN0Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNTyw4QkFBOEM7QUFDbkQsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGNBQWM7QUFDaEIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sbUJBQW1CLFFBQWdCO0FBQ3hDLFVBQU0sYUFBYSxPQUFPLG9CQUFvQixzQkFBc0IsbUJBQWtCO0FBQ3RGLFFBQUksV0FBVyxXQUFXLEdBQUc7QUFDM0IsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLHNCQUFzQixLQUFLLHVCQUF1QixNQUFNO0FBQzlELFVBQU0sWUFBWSxNQUFNLEtBQUssb0JBQW9CLE9BQU8sQ0FBQztBQUN6RCxRQUFJLFVBQVUsV0FBVyxHQUFHO0FBQzFCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxXQUFXLFVBQVUsVUFBVSxTQUFTLENBQUM7QUFDL0MsV0FBTyxTQUFTO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGlCQUFpQixRQUFnQjtBQUN0QyxVQUFNLGFBQWEsT0FBTyxvQkFBb0Isc0JBQXNCLG1CQUFrQjtBQUN0RixRQUFJLFdBQVcsV0FBVyxHQUFHO0FBQzNCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxzQkFBc0IsS0FBSyx1QkFBdUIsTUFBTTtBQUM5RCxVQUFNLFlBQVksTUFBTSxLQUFLLG9CQUFvQixPQUFPLENBQUM7QUFDekQsUUFBSSxVQUFVLFdBQVcsR0FBRztBQUMxQixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sV0FBVyxVQUFVLFVBQVUsU0FBUyxDQUFDO0FBQy9DLFdBQU8sU0FBUztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQVcsZUFBZTtBQUN4QixXQUFPLHVCQUF1QjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksZUFBNkI7QUFDL0IsV0FBTyx1QkFBdUI7QUFBQSxFQUNoQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLFNBQTJCO0FBQzdCLFdBQU8sS0FBSyxTQUFTLGlCQUFpQixVQUFVLEtBQUssV0FBVztBQUFBLEVBQ2xFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSx5QkFDRSxNQUNBLGlCQUNBO0FBQUEsSUFDQSxNQUFNLHdCQUF5QixLQUFLLFlBQW9CO0FBQUEsTUFDdEQsZUFBZTtBQUNiLGVBQU8sS0FBSywyQkFBMkIsdUJBQXVCLHFCQUFxQjtBQUFBLE1BQ3JGO0FBQUEsSUFDRjtBQUNBLGdCQUFZLE1BQU0sZUFBZTtBQUNqQyxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLFlBQVksV0FBK0IsVUFBNkIsZUFBc0IsS0FBYTtBQXh5QjdHO0FBeXlCSSxVQUFNLFdBQVcsZ0JBQWdCO0FBQ2pDLFVBQU0sUUFBUTtBQUNkLFVBQU0sVUFBVSxnQkFBZ0IsS0FBSztBQUVyQyxVQUFNLFVBQVUsS0FBSyxpQkFBaUIsSUFBSSxRQUFRO0FBQ2xELFFBQUksR0FBRyxJQUFJLE1BQU0sT0FBTyxHQUFHO0FBQ3pCLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxnQkFBZ0IsUUFBUTtBQUU5Qix3QkFBYyw2QkFBZDtBQUVBLFVBQU0sSUFBSSxtQkFBbUIsV0FBVyxRQUFRLEVBQUU7QUFDbEQsVUFBTSxhQUFhLG9CQUFtQixjQUFjLEtBQUssUUFBUTtBQUNqRSxVQUFNLFNBQVMsY0FBYyxjQUFjLG9CQUFvQixTQUFTLEdBQUcsWUFBWSxDQUFDO0FBRXhGLFFBQUksY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sV0FBVyxHQUFHO0FBQ25FLFlBQU0sYUFBYSxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLEtBQUs7QUFDaEYsaUJBQVcsS0FBSyxLQUFLO0FBQ3JCLG9CQUFjLG9CQUFvQixTQUFTLEVBQUUsUUFBUSxJQUFJLGFBQWEsVUFBVTtBQUNoRixZQUFNLGNBQWMsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNO0FBQ2xGLGtCQUFZLEtBQUssR0FBRyxNQUFNO0FBQzFCLG9CQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsV0FBVztBQUFBLElBQ3BGLFdBQVcsY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sV0FBVyxHQUFHO0FBQzFFLFlBQU0sZUFBZSxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTSxDQUFDO0FBQ3pFLFVBQUksU0FBUyxjQUFjO0FBQ3pCLGNBQU0sYUFBYSxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLEtBQUs7QUFDaEYsbUJBQVcsUUFBUSxLQUFLO0FBQ3hCLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsUUFBUSxJQUFJLGFBQWEsVUFBVTtBQUNoRixjQUFNLGNBQWMsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNO0FBQ2xGLG9CQUFZLFFBQVEsR0FBRyxNQUFNO0FBQzdCLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsV0FBVztBQUFBLE1BQ3BGLFdBQVcsZUFBZSxVQUFVO0FBQ2xDLGNBQU0sYUFBYSxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLEtBQUs7QUFDaEYsbUJBQVcsS0FBSyxLQUFLO0FBQ3JCLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsUUFBUSxJQUFJLGFBQWEsVUFBVTtBQUNoRixjQUFNLGNBQWMsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNO0FBQ2xGLG9CQUFZLEtBQUssR0FBRyxNQUFNO0FBQzFCLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsV0FBVztBQUFBLE1BQ3BGLE9BQU87QUFFTCxjQUFNLGFBQWEsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxLQUFLO0FBQ2hGLG1CQUFXLE9BQU8sR0FBRyxHQUFHLEtBQUs7QUFDN0Isc0JBQWMsb0JBQW9CLFNBQVMsRUFBRSxRQUFRLElBQUksYUFBYSxVQUFVO0FBQ2hGLGNBQU0sY0FBYyxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU07QUFDbEYsb0JBQVksT0FBTyxHQUFHLEdBQUcsR0FBRyxNQUFNO0FBQ2xDLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsV0FBVztBQUFBLE1BQ3BGO0FBQUEsSUFDRixPQUFPO0FBRUwsZUFBU0EsS0FBSSxHQUFHQSxLQUFJLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNLFFBQVFBLE1BQUs7QUFDbEYsY0FBTSxlQUFlLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNQSxFQUFDO0FBQ3pFLFlBQUksWUFBWSxjQUFjO0FBQzVCLGNBQUksWUFBWSxnQkFBZ0IsZ0JBQWdCLFFBQVE7QUFDdEQsMEJBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNQSxFQUFDLElBQUk7QUFDeEQscUJBQVMsSUFBSSxHQUFHLElBQUksY0FBYyxvQkFBb0IsU0FBUyxFQUFFLGtCQUFrQixLQUFLO0FBQ3RGLDRCQUFjLG9CQUFvQixTQUFTLEVBQUUsT0FDM0NBLEtBQUksY0FBYyxvQkFBb0IsU0FBUyxFQUFFLG1CQUFtQixDQUN0RSxJQUFJLE9BQU8sQ0FBQztBQUFBLFlBQ2Q7QUFBQSxVQUNGLE9BQU87QUFDTCxrQkFBTSxhQUFhLE1BQU0sS0FBSyxjQUFjLG9CQUFvQixTQUFTLEVBQUUsS0FBSztBQUNoRix1QkFBVyxPQUFPQSxJQUFHLEdBQUcsS0FBSztBQUM3QiwwQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhLFVBQVU7QUFDaEYsa0JBQU0sY0FBYyxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU07QUFDbEYsd0JBQVksT0FBT0EsS0FBSSxjQUFjLG9CQUFvQixTQUFTLEVBQUUsa0JBQWtCLEdBQUcsR0FBRyxNQUFNO0FBQ2xHLDBCQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsV0FBVztBQUFBLFVBQ3BGO0FBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EscUJBQ0UsV0FDQSxVQUNBLGVBQ0EsUUFDQSxLQUNBO0FBcjRCSjtBQXM0QkksVUFBTSxXQUFXLGdCQUFnQjtBQUNqQyxVQUFNLFFBQVE7QUFDZCxVQUFNLFVBQVUsZ0JBQWdCLEtBQUs7QUFFckMsVUFBTSxVQUFVLEtBQUssaUJBQWlCLElBQUksUUFBUTtBQUNsRCxRQUFJLEdBQUcsSUFBSSxNQUFNLE9BQU8sR0FBRztBQUN6QixhQUFPO0FBQUEsSUFDVDtBQUVBLFVBQU0sZ0JBQWdCLFFBQVE7QUFFOUIsd0JBQWMsNkJBQWQ7QUFFQSxRQUFJLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNLFdBQVcsR0FBRztBQUNuRSxZQUFNLGFBQWEsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxLQUFLO0FBQ2hGLGlCQUFXLEtBQUssS0FBSztBQUNyQixvQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhLFVBQVU7QUFDaEYsWUFBTSxjQUFjLE1BQU0sS0FBSyxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTTtBQUNsRixrQkFBWSxLQUFLLEdBQUcsTUFBTTtBQUMxQixvQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFNBQVMsSUFBSSxhQUFhLFdBQVc7QUFBQSxJQUNwRixXQUFXLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNLFdBQVcsR0FBRztBQUMxRSxZQUFNLGVBQWUsY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sQ0FBQztBQUN6RSxVQUFJLFNBQVMsY0FBYztBQUN6QixjQUFNLGFBQWEsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxLQUFLO0FBQ2hGLG1CQUFXLFFBQVEsS0FBSztBQUN4QixzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhLFVBQVU7QUFDaEYsY0FBTSxjQUFjLE1BQU0sS0FBSyxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTTtBQUNsRixvQkFBWSxRQUFRLEdBQUcsTUFBTTtBQUM3QixzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFNBQVMsSUFBSSxhQUFhLFdBQVc7QUFBQSxNQUNwRixXQUFXLGVBQWUsVUFBVTtBQUNsQyxjQUFNLGFBQWEsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxLQUFLO0FBQ2hGLG1CQUFXLEtBQUssS0FBSztBQUNyQixzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhLFVBQVU7QUFDaEYsY0FBTSxjQUFjLE1BQU0sS0FBSyxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTTtBQUNsRixvQkFBWSxLQUFLLEdBQUcsTUFBTTtBQUMxQixzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFNBQVMsSUFBSSxhQUFhLFdBQVc7QUFBQSxNQUNwRixPQUFPO0FBRUwsY0FBTSxhQUFhLE1BQU0sS0FBSyxjQUFjLG9CQUFvQixTQUFTLEVBQUUsS0FBSztBQUNoRixtQkFBVyxPQUFPLEdBQUcsR0FBRyxLQUFLO0FBQzdCLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsUUFBUSxJQUFJLGFBQWEsVUFBVTtBQUNoRixjQUFNLGNBQWMsTUFBTSxLQUFLLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNO0FBQ2xGLG9CQUFZLE9BQU8sR0FBRyxHQUFHLEdBQUcsTUFBTTtBQUNsQyxzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFNBQVMsSUFBSSxhQUFhLFdBQVc7QUFBQSxNQUNwRjtBQUFBLElBQ0YsT0FBTztBQUVMLGVBQVMsSUFBSSxHQUFHLElBQUksY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sUUFBUSxLQUFLO0FBQ2xGLGNBQU0sZUFBZSxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTSxDQUFDO0FBQ3pFLFlBQUksWUFBWSxjQUFjO0FBQzVCLGNBQUksWUFBWSxnQkFBZ0IsZ0JBQWdCLFFBQVE7QUFDdEQsMEJBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSTtBQUN4RCxxQkFBUyxJQUFJLEdBQUcsSUFBSSxjQUFjLG9CQUFvQixTQUFTLEVBQUUsa0JBQWtCLEtBQUs7QUFDdEYsNEJBQWMsb0JBQW9CLFNBQVMsRUFBRSxPQUMzQyxJQUFJLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxtQkFBbUIsQ0FDdEUsSUFBSSxPQUFPLENBQUM7QUFBQSxZQUNkO0FBQUEsVUFDRixPQUFPO0FBQ0wsa0JBQU0sYUFBYSxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLEtBQUs7QUFDaEYsdUJBQVcsT0FBTyxHQUFHLEdBQUcsS0FBSztBQUM3QiwwQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhLFVBQVU7QUFDaEYsa0JBQU0sY0FBYyxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU07QUFDbEYsd0JBQVksT0FBTyxJQUFJLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxrQkFBa0IsR0FBRyxHQUFHLE1BQU07QUFDbEcsMEJBQWMsb0JBQW9CLFNBQVMsRUFBRSxTQUFTLElBQUksYUFBYSxXQUFXO0FBQUEsVUFDcEY7QUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsa0JBQWtCLFdBQStCLFVBQTZCLGVBQXNCLEtBQWE7QUF2OUJuSDtBQXc5QkksVUFBTSxXQUFXLGdCQUFnQjtBQUNqQyxVQUFNLFVBQVUsZ0JBQWdCLEtBQUs7QUFFckMsVUFBTSxVQUFVLEtBQUssaUJBQWlCLElBQUksUUFBUTtBQUNsRCxRQUFJLEdBQUcsSUFBSSxNQUFNLE9BQU8sR0FBRztBQUN6QixhQUFPO0FBQUEsSUFDVDtBQUVBLFVBQU0sZ0JBQWdCLFFBQVE7QUFFOUIsd0JBQWMsNkJBQWQ7QUFFQSxhQUFTLElBQUksR0FBRyxJQUFJLGNBQWMsb0JBQW9CLFNBQVMsRUFBRSxNQUFNLFFBQVEsS0FBSztBQUNsRixZQUFNLFFBQVEsY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sQ0FBQztBQUNsRSxVQUFJLFlBQVksU0FBUyxRQUFRLFFBQVE7QUFDdkMsY0FBTUMsU0FBUSxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLEtBQUs7QUFDM0UsUUFBQUEsT0FBTSxPQUFPLEdBQUcsQ0FBQztBQUNqQixzQkFBYyxvQkFBb0IsU0FBUyxFQUFFLFFBQVEsSUFBSSxhQUFhQSxNQUFLO0FBQzNFLGNBQU0sU0FBUyxNQUFNLEtBQUssY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU07QUFDN0UsZUFBTztBQUFBLFVBQ0wsSUFBSSxjQUFjLG9CQUFvQixTQUFTLEVBQUU7QUFBQSxVQUNqRCxjQUFjLG9CQUFvQixTQUFTLEVBQUU7QUFBQSxRQUMvQztBQUNBLHNCQUFjLG9CQUFvQixTQUFTLEVBQUUsU0FBUyxJQUFJLGFBQWEsTUFBTTtBQUFBLE1BQy9FO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsb0JBQW9CLFdBQStCLFVBQTZCLE9BQWMsS0FBYTtBQUN6RyxVQUFNLFdBQVcsUUFBUTtBQUN6QixVQUFNLFVBQVUsUUFBUSxLQUFLO0FBRTdCLFVBQU0sVUFBVSxLQUFLLGlCQUFpQixJQUFJLFFBQVE7QUFDbEQsUUFBSSxHQUFHLElBQUksTUFBTSxPQUFPLEdBQUc7QUFDekIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLGdCQUFnQixRQUFRO0FBRTlCLGFBQVMsSUFBSSxHQUFHLElBQUksY0FBYyxvQkFBb0IsU0FBUyxFQUFFLE1BQU0sUUFBUSxLQUFLO0FBQ2xGLFlBQU0sUUFBUSxjQUFjLG9CQUFvQixTQUFTLEVBQUUsTUFBTSxDQUFDO0FBQ2xFLFVBQUksWUFBWSxTQUFTLFFBQVEsUUFBUTtBQUN2QyxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyx1QkFBdUIsUUFBd0Q7QUFDcEYsUUFBSSxVQUFVLEtBQUsseUJBQXlCLElBQUksTUFBTTtBQUN0RCxRQUFJLFdBQVcsTUFBTTtBQUNuQixnQkFBVSxvQkFBSSxJQUFJO0FBQ2xCLFdBQUsseUJBQXlCLElBQUksUUFBUSxPQUFPO0FBQUEsSUFDbkQ7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsT0FBZSwyQkFBMkIsUUFBZ0IsV0FBK0I7QUFDdkYsUUFBSSxvQkFBb0IsT0FBTztBQUMvQixRQUFJLGtCQUFrQixPQUFPO0FBQzdCLFVBQU0sYUFBYSxPQUFPLG9CQUFvQixzQkFBc0IsbUJBQWtCO0FBQ3RGLGVBQVcsYUFBYSxZQUFZO0FBQ2xDLGlCQUFXLENBQUMsRUFBRSxPQUFPLEtBQUssVUFBVSxrQkFBa0I7QUFDcEQsWUFBSSxDQUFDLFFBQVEsY0FBYyxpQkFBaUIsRUFBRSxTQUFTLFNBQVMsR0FBRztBQUNqRTtBQUFBLFFBQ0Y7QUFDQSxjQUFNLFVBQVUsUUFBUSxjQUFjLG9CQUFvQixTQUFTO0FBQ25FLFlBQUksUUFBUSxNQUFNLFdBQVcsR0FBRztBQUM5QjtBQUFBLFFBQ0Y7QUFDQSw0QkFBb0IsS0FBSyxJQUFJLG1CQUFtQixRQUFRLE1BQU0sQ0FBQyxDQUFDO0FBQ2hFLDBCQUFrQixLQUFLLElBQUksaUJBQWlCLFFBQVEsTUFBTSxRQUFRLE1BQU0sU0FBUyxDQUFDLENBQUM7QUFBQSxNQUNyRjtBQUFBLElBQ0Y7QUFFQSxVQUFNLHNCQUFzQixvQkFBbUIsdUJBQXVCLE1BQU07QUFDNUUsUUFBSSxPQUFPLFNBQVMsaUJBQWlCLEtBQUssT0FBTyxTQUFTLGVBQWUsR0FBRztBQUMxRSwwQkFBb0IsSUFBSSxXQUFXO0FBQUEsUUFDakMsTUFBTTtBQUFBLFFBQ047QUFBQSxRQUNBO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxPQUFPO0FBQ0wsMEJBQW9CLE9BQU8sU0FBUztBQUFBLElBQ3RDO0FBQ0Esd0JBQW1CLFNBQVMsYUFBYSxvQkFBbUIsTUFBTSxxQkFBcUI7QUFBQSxNQUNyRixTQUFTLElBQUksSUFBSSxtQkFBbUI7QUFBQSxJQUN0QyxDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sZUFBZSxRQUFnQixNQUFlO0FBQ25ELDZCQUF5QixlQUFlLFFBQVEsSUFBSTtBQUFBLEVBQ3REO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxlQUFlLFFBQXlCO0FBQzdDLFdBQU8seUJBQXlCLGVBQWUsTUFBTTtBQUFBLEVBQ3ZEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxjQUFjLFFBQWdCLE1BQWM7QUFDakQsNkJBQXlCLGNBQWMsUUFBUSxJQUFJO0FBQUEsRUFDckQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGNBQWMsUUFBd0I7QUFDM0MsV0FBTyx5QkFBeUIsY0FBYyxNQUFNO0FBQUEsRUFDdEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxpQkFBaUIsWUFBNkI7QUFDNUMsVUFBTSxZQUFZO0FBRWxCLFNBQUssbUJBQW1CLElBQUksSUFBSSxVQUFVLGdCQUFnQjtBQUMxRCxTQUFLLGdDQUFnQyxJQUFJLElBQUksVUFBVSw2QkFBNkI7QUFDcEYsNkJBQXlCLDRCQUE0QjtBQUNyRCxTQUFLLHFCQUFxQixVQUFVO0FBQ3BDLFNBQUssZ0JBQWdCLFVBQVU7QUFBQSxFQUNqQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLGFBQ0UsVUFDQSxvQkFDQSxvQkFBa0QsQ0FBQyxHQUN6QztBQUNWLFVBQU0sWUFBWSxTQUFTLFVBQVU7QUFDckMsVUFBTSxVQUFVLFVBQVUsa0JBQWtCO0FBQzVDLFVBQU0sWUFBWSxLQUFLO0FBQ3ZCLFNBQUssT0FBTyxhQUFhLEVBQUUsdUJBQXVCO0FBQ2xELFFBQUksR0FBRyxJQUFJLE1BQU0sT0FBTyxHQUFHO0FBQ3pCLGFBQU8sQ0FBQztBQUFBLElBQ1Y7QUFDQSxZQUFRLGdCQUFnQjtBQUN4QixVQUFNLGFBQXVCLENBQUM7QUFDOUIsZUFBVyxDQUFDLFVBQVUsT0FBTyxLQUFLLFFBQVEsa0JBQWtCO0FBQzFELFVBQUksa0JBQWtCLFNBQVMsUUFBUSxPQUFPLFFBQVEsR0FBRztBQUN2RDtBQUFBLE1BQ0Y7QUFDQSxZQUFNLGdCQUFnQixRQUFRO0FBQzlCLGlCQUFXLGNBQWMsY0FBYyxpQkFBaUIsR0FBRztBQUN6RCxjQUFNLFlBQVksY0FBYyxrREFBc0I7QUFDdEQsbUJBQVcsS0FBSyxTQUFTO0FBRXpCLGNBQU0sUUFBUSxjQUFjLG9CQUFvQixVQUFVLEVBQUU7QUFDNUQsWUFBSSxRQUFRLE9BQU8sYUFBYSxhQUFhO0FBQzNDLGdCQUFNLFVBQVUsa0JBQWtCLE9BQU8sT0FBTztBQUNoRCxnQkFBTSxXQUFXLG9CQUFJLElBQTBDO0FBQy9ELG1CQUFTLElBQUksV0FBVztBQUFBLFlBQ3RCO0FBQUEsWUFDQSxRQUFRO0FBQUEsWUFDUixrQkFBa0I7QUFBQSxZQUNsQixxQkFBcUIsY0FBYyxvQkFBb0IsVUFBVSxFQUFFO0FBQUEsVUFDckUsQ0FBQztBQUNELGdCQUFNLG1CQUFtQixJQUFJLGdCQUFnQixVQUFVLFNBQVM7QUFDaEUsZUFBSyxhQUFhLFVBQStCLGdCQUFnQjtBQUFBLFFBQ25FO0FBQ0EsWUFBSSxRQUFRLE9BQU8sYUFBYSxjQUFjO0FBQzVDLGdCQUFNLFVBQVUsbUJBQW1CLE9BQU8sT0FBTztBQUNqRCxnQkFBTSxXQUFXLG9CQUFJLElBQTBDO0FBQy9ELG1CQUFTLElBQUksV0FBVztBQUFBLFlBQ3RCO0FBQUEsWUFDQSxRQUFRO0FBQUEsWUFDUixrQkFBa0I7QUFBQSxZQUNsQixxQkFBcUIsY0FBYyxvQkFBb0IsVUFBVSxFQUFFO0FBQUEsVUFDckUsQ0FBQztBQUNELGdCQUFNLG1CQUFtQixJQUFJLG1CQUFtQixVQUFVLFNBQVM7QUFDbkUsZUFBSyxhQUFhLFVBQStCLGdCQUFnQjtBQUFBLFFBQ25FO0FBQ0EsWUFBSSxRQUFRLE9BQU8sYUFBYSxTQUFTO0FBQ3ZDLGdCQUFNLFVBQVUsY0FBYyxPQUFPLE9BQU87QUFDNUMsZ0JBQU0sV0FBVyxvQkFBSSxJQUEwQztBQUMvRCxtQkFBUyxJQUFJLFdBQVc7QUFBQSxZQUN0QjtBQUFBLFlBQ0EsUUFBUTtBQUFBLFlBQ1Isa0JBQWtCO0FBQUEsWUFDbEIscUJBQXFCLGNBQWMsb0JBQW9CLFVBQVUsRUFBRTtBQUFBLFVBQ3JFLENBQUM7QUFDRCxnQkFBTSxtQkFBbUIsSUFBSSxnQkFBZ0IsVUFBVSxTQUFTO0FBQ2hFLGVBQUssYUFBYSxVQUErQixnQkFBZ0I7QUFBQSxRQUNuRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsYUFBUyxrQkFBa0IsT0FBcUJDLFVBQTZCO0FBQzNFLFlBQU0scUJBQXFCLElBQUksYUFBYSxNQUFNLFNBQVMsQ0FBQztBQUM1RCxlQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFFBQUFBLFNBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsUUFBQ0EsU0FBZ0IsaUJBQWlCO0FBQ2xDLGNBQU0sb0JBQW9CLFNBQVMsa0JBQWtCLFNBQVM7QUFDOUQsMkJBQW1CLElBQUksSUFBSSxDQUFDLElBQUksa0JBQWtCO0FBQ2xELDJCQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJLGtCQUFrQjtBQUNsRCwyQkFBbUIsSUFBSSxJQUFJLENBQUMsSUFBSSxrQkFBa0I7QUFBQSxNQUNwRDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBRUEsYUFBUyxtQkFBbUIsT0FBcUJBLFVBQTZCO0FBQzVFLFlBQU0sb0JBQW9CLElBQUksYUFBYSxNQUFNLFNBQVMsQ0FBQztBQUMzRCxlQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFFBQUFBLFNBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsUUFBQ0EsU0FBZ0IsaUJBQWlCO0FBQ2xDLGNBQU0sbUJBQW1CLFNBQVMsbUJBQW1CLFNBQVM7QUFDOUQsMEJBQWtCLElBQUksSUFBSSxDQUFDLElBQUksaUJBQWlCO0FBQ2hELDBCQUFrQixJQUFJLElBQUksQ0FBQyxJQUFJLGlCQUFpQjtBQUNoRCwwQkFBa0IsSUFBSSxJQUFJLENBQUMsSUFBSSxpQkFBaUI7QUFDaEQsMEJBQWtCLElBQUksSUFBSSxDQUFDLElBQUksaUJBQWlCO0FBQUEsTUFDbEQ7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLGFBQVMsY0FBYyxPQUFxQkEsVUFBNkI7QUFDdkUsWUFBTSxlQUFlLElBQUksYUFBYSxNQUFNLFNBQVMsQ0FBQztBQUN0RCxlQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFFBQUFBLFNBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsUUFBQ0EsU0FBZ0IsaUJBQWlCO0FBQ2xDLGNBQU0sY0FBYyxTQUFTLGNBQWMsU0FBUztBQUNwRCxxQkFBYSxJQUFJLElBQUksQ0FBQyxJQUFJLFlBQVk7QUFDdEMscUJBQWEsSUFBSSxJQUFJLENBQUMsSUFBSSxZQUFZO0FBQ3RDLHFCQUFhLElBQUksSUFBSSxDQUFDLElBQUksWUFBWTtBQUFBLE1BQ3hDO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsdUJBQXVCO0FBQ3JCLFVBQU0sYUFBYSxJQUFJLElBQUksS0FBSyx1QkFBdUIsQ0FBQztBQUN4RCxTQUFLLGlCQUFpQixNQUFNO0FBQzVCLGVBQVcsYUFBYSxZQUFZO0FBQ2xDLDBCQUFtQiwyQkFBMkIsS0FBSyxVQUFVLFNBQVM7QUFBQSxJQUN4RTtBQUNBLFNBQUssb0NBQW9DO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsb0JBQW9CLFdBQW1CO0FBQ3JDLFVBQU0saUJBQXNDLENBQUM7QUFDN0MsZUFBVyxDQUFDLFVBQVUsT0FBTyxLQUFLLEtBQUssa0JBQWtCO0FBQ3ZELFlBQU0sZ0JBQWdCLFFBQVE7QUFDOUIsWUFBTSw0QkFBNEIsY0FBYyx3Q0FBd0MsTUFBTTtBQUM5RixZQUFNLDZCQUE2QixjQUFjLHlDQUF5QyxNQUFNO0FBQ2hHLG9CQUFjLHVCQUF1QixTQUFTO0FBQzlDLFlBQU0sc0JBQXNCLGNBQWMsaUJBQWlCO0FBQzNELFVBQUksb0JBQW9CLFdBQVcsR0FBRztBQUNwQyx1QkFBZSxLQUFLLFFBQVE7QUFDNUI7QUFBQSxNQUNGO0FBQ0EsWUFBTSxvQkFBb0Isb0JBQW9CLENBQUM7QUFDL0MsVUFBSSwyQkFBMkI7QUFDN0Isc0JBQWMsaUNBQWlDLGlCQUFpQjtBQUFBLE1BQ2xFO0FBQ0EsVUFBSSw0QkFBNEI7QUFDOUIsc0JBQWMsa0NBQWtDLGlCQUFpQjtBQUFBLE1BQ25FO0FBQUEsSUFDRjtBQUNBLGVBQVcsWUFBWSxnQkFBZ0I7QUFDckMsV0FBSyxpQkFBaUIsT0FBTyxRQUFRO0FBQUEsSUFDdkM7QUFDQSx3QkFBbUIsMkJBQTJCLEtBQUssVUFBVSxTQUFTO0FBQ3RFLFNBQUssb0NBQW9DO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsNkJBQTZCLFNBQWlCO0FBQzVDLFVBQU0sYUFBYSxJQUFJLElBQUksS0FBSyx1QkFBdUIsQ0FBQztBQUN4RCxlQUFXLGFBQWEsWUFBWTtBQUNsQyxVQUFJLFVBQVUsU0FBUyxPQUFPLEdBQUc7QUFDL0IsYUFBSyxvQkFBb0IsU0FBUztBQUFBLE1BQ3BDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLDBCQUE4QztBQUM1QyxXQUFPLEtBQUssOEJBQThCLElBQUksS0FBSyx3QkFBd0IsQ0FBQztBQUFBLEVBQzlFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsNkJBQTZCLFdBQW1EO0FBQzlFLFdBQU8sS0FBSyw4QkFBOEIsSUFBSSxTQUFTO0FBQUEsRUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBaUI7QUFDZixVQUFNLGFBQWEsSUFBSSxJQUFJLEtBQUssdUJBQXVCLENBQUM7QUFDeEQsVUFBTSxTQUFTO0FBQ2YsU0FBSyxpQkFBaUIsTUFBTTtBQUM1QixTQUFLLDhCQUE4QixNQUFNO0FBQ3pDLFNBQUssZ0JBQWdCO0FBQ3JCLDZCQUF5Qiw0QkFBNEI7QUFDckQsZUFBVyxhQUFhLFlBQVk7QUFDbEMsMEJBQW1CLDJCQUEyQixLQUFLLFVBQVUsU0FBUztBQUFBLElBQ3hFO0FBQUEsRUFDRjtBQUFBLEVBRVEsc0NBQXNDO0FBQzVDLDZCQUF5Qiw0QkFBNEI7QUFDckQsVUFBTSxhQUE2RCxvQkFBSSxJQUFJO0FBRTNFLGVBQVcsQ0FBQyxVQUFVLE9BQU8sS0FBSyxLQUFLLGtCQUFrQjtBQUN2RCxpQkFBVyxhQUFhLFFBQVEsY0FBYyxpQkFBaUIsR0FBRztBQUNoRSxjQUFNLFVBQVUsUUFBUSxjQUFjLG9CQUFvQixTQUFTO0FBQ25FLFlBQUksVUFBVSxXQUFXLElBQUksU0FBUztBQUN0QyxZQUFJLEdBQUcsSUFBSSxNQUFNLE9BQU8sR0FBRztBQUN6QixvQkFBVTtBQUFBLFlBQ1I7QUFBQSxZQUNBLFdBQVcsb0JBQUksSUFBdUI7QUFBQSxZQUN0QyxtQkFBbUIsT0FBTztBQUFBLFlBQzFCLGlCQUFpQixPQUFPO0FBQUEsWUFDeEIsZ0JBQWdCO0FBQUEsVUFDbEI7QUFDQSxxQkFBVyxJQUFJLFdBQVcsT0FBTztBQUFBLFFBQ25DO0FBRUEsZ0JBQVEsVUFBVSxJQUFJLFFBQVE7QUFDOUIsWUFBSSxRQUFRLE1BQU0sU0FBUyxHQUFHO0FBQzVCLGtCQUFRLG9CQUFvQixLQUFLLElBQUksUUFBUSxtQkFBbUIsUUFBUSxNQUFNLENBQUMsQ0FBQztBQUNoRixrQkFBUSxrQkFBa0IsS0FBSyxJQUFJLFFBQVEsaUJBQWlCLFFBQVEsTUFBTSxRQUFRLE1BQU0sU0FBUyxDQUFDLENBQUM7QUFDbkcsa0JBQVEsa0JBQWtCLFFBQVEsTUFBTTtBQUFBLFFBQzFDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxlQUFXLENBQUMsRUFBRSxPQUFPLEtBQUssWUFBWTtBQUNwQyxVQUFJLENBQUMsT0FBTyxTQUFTLFFBQVEsaUJBQWlCLEdBQUc7QUFDL0MsZ0JBQVEsb0JBQW9CO0FBQUEsTUFDOUI7QUFDQSxVQUFJLENBQUMsT0FBTyxTQUFTLFFBQVEsZUFBZSxHQUFHO0FBQzdDLGdCQUFRLGtCQUFrQjtBQUFBLE1BQzVCO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBMkMsb0JBQUksSUFBSTtBQUN6RCxVQUFNLG1CQUFtQixNQUFNLEtBQUssV0FBVyxLQUFLLENBQUMsRUFBRSxLQUFLO0FBQzVELGVBQVcsYUFBYSxrQkFBa0I7QUFDeEMsWUFBTSxVQUFVLFdBQVcsSUFBSSxTQUFTO0FBQ3hDLFlBQU0sYUFBYTtBQUFBLFFBQ2pCO0FBQUEsUUFDQSxNQUFNLEtBQUssUUFBUSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRztBQUFBLFFBQzdDLFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxRQUNSLFFBQVE7QUFBQSxNQUNWLEVBQUUsS0FBSyxHQUFHO0FBQ1YsWUFBTSxPQUFPLFNBQVMsUUFBUSxVQUFVO0FBQ3hDLGNBQVEsSUFBSSxXQUFXLElBQUk7QUFBQSxJQUM3QjtBQUVBLFNBQUssZ0NBQWdDO0FBQUEsRUFDdkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGtCQUFrQixRQUFzQjtBQUM3Qyx3QkFBbUIseUJBQXlCLE9BQU8sTUFBTTtBQUFBLEVBQzNEO0FBQ0Y7QUFBQTtBQW4wQ2Esb0JBU0ksMkJBQWdGLG9CQUFJLElBQUk7QUFBQTtBQVQ1RixvQkE4QlksUUFBUTtBQUFBLEVBQzdCO0FBQUEsRUFDQTtBQUNGO0FBakNXLG9CQW1DSSxZQUFZLGtCQUFrQixTQUFTO0FBbkMzQyxvQkFvQ0ksV0FBVyxlQUFlLEtBQUs7QUFwQ25DLG9CQXFDSSxhQUFhLGVBQWUsSUFBSTtBQXJDcEMsb0JBdUNJLFdBQVcsSUFBSSxZQUFZO0FBdkNyQyxJQUFNLHFCQUFOOyIsCiAgIm5hbWVzIjogWyJpIiwgImlucHV0IiwgInNyY0FuaW0iXQp9Cg==
