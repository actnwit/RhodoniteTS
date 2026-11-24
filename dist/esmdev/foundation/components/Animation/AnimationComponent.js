// src/foundation/components/Animation/AnimationComponent.ts
import { TagKhrNodeVisibilityVisible } from "../../../types/glTF2.js";
import { Component } from "../../core/Component.js";
import { registerComponentRuntimeHooks } from "../../core/ComponentRuntimeHooks.js";
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
    this.Hb = 0;
    // the value range is [0,1]
    // Animation Data of each AnimationComponent
    this.__animationTrack = /* @__PURE__ */ new Map();
    this.Db = /* @__PURE__ */ new Map();
    this.Eb = -1;
    /** Reused map for VRM expression weights to avoid a per-frame allocation. */
    this.Nb = /* @__PURE__ */ new Map();
    /** Cache of the leaf parameter name of `material/...` animation paths. */
    this.Ob = /* @__PURE__ */ new Map();
    /// flags ///
    this.Fb = true;
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
    if (AnimationStateRepository.isEntityCached(this.Qb, this.c)) {
      return;
    }
    this.Gb();
  }
  isAnimationEnabled() {
    if (_AnimationComponent.getIsAnimating(this.c) && this.isAnimating) {
      return true;
    }
    return false;
  }
  /**
   * Sets the animation blending ratio and applies the animation.
   * @param value - The blending ratio value between 0 and 1
   */
  set animationBlendingRatio(value) {
    this.Hb = value;
    this.Gb();
  }
  /**
   * Updates the animation blending ratio without evaluating animation channels immediately.
   * @param value - The blending ratio value between 0 and 1
   * @internal
   */
  _setAnimationBlendingRatioWithoutApplying(value) {
    this.Hb = value;
  }
  /**
   * Gets the current animation blending ratio.
   * @returns The blending ratio value between 0 and 1
   */
  get animationBlendingRatio() {
    return this.Hb;
  }
  /**
   * Applies animation to the entity based on the current time and animation tracks.
   * Handles various animation types including transform, blend shape, material, light, camera, and Effekseer.
   * @private
   */
  Gb() {
    var _a, _b;
    let time = this.time;
    if (this.useGlobalTime) {
      time = _AnimationComponent.getGlobalTime(this.c);
    }
    const transformComponent = this.entity.getTransform();
    const canSkipIdenticalTransformWrite = !this.entity.getSceneGraph()._hasPhysicsComponentInSubtree;
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    const effekseerComponent = this.entity.tryToGetEffekseer();
    let vrmExpressionWeights;
    const blendingRatio = this.Hb;
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
          (_b = this[_a = "Nb"]) != null ? _b : this[_a] = /* @__PURE__ */ new Map();
          vrmExpressionWeights = this.Nb;
          vrmExpressionWeights.clear();
        }
        const expressionName = pathName.substring(VrmExpressionPathPrefix.length);
        vrmExpressionWeights.set(expressionName, channel.animatedValue.x);
        continue;
      }
      this.Rb(
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
  Rb(pathName, channel, transformComponent, canSkipIdenticalTransformWrite, blendShapeComponent, effekseerComponent) {
    if (this.Sb(pathName, channel, transformComponent, canSkipIdenticalTransformWrite)) return;
    if (this.Tb(pathName, channel, blendShapeComponent)) return;
    if (this.Ub(pathName, channel)) return;
    if (this.Vb(pathName, channel)) return;
    if (this.Wb(pathName, channel)) return;
    if (this.Xb(pathName, channel)) return;
    if (this.Yb(pathName, channel, effekseerComponent)) return;
  }
  Sb(pathName, channel, transformComponent, canSkipIdenticalTransformWrite) {
    const animatedValue = channel.animatedValue;
    if (pathName === "translate") {
      if (this.Lb(
        animatedValue,
        transformComponent.localPositionInner._v,
        canSkipIdenticalTransformWrite
      )) {
        transformComponent.localPosition = animatedValue;
      }
      return true;
    }
    if (pathName === "quaternion") {
      if (this.Lb(
        animatedValue,
        transformComponent.localRotationInner._v,
        canSkipIdenticalTransformWrite
      )) {
        transformComponent.localRotation = animatedValue;
      }
      return true;
    }
    if (pathName === "scale") {
      if (this.Lb(
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
  Lb(animatedValue, currentValue, canSkipIdenticalTransformWrite) {
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
  Tb(pathName, channel, blendShapeComponent) {
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
  Ub(pathName, channel) {
    var _a, _b;
    if (pathName !== "visibility") {
      return false;
    }
    const sceneGraph = this.entity.getSceneGraph();
    const localVisible = channel.animatedValue.x > 0.5;
    if (sceneGraph.entity.getTagValue(TagKhrNodeVisibilityVisible) !== localVisible) {
      sceneGraph.entity.tryToSetTag({ tag: TagKhrNodeVisibilityVisible, value: localVisible });
    }
    this.Pb(sceneGraph, (_b = (_a = sceneGraph.parent) == null ? void 0 : _a.isVisible) != null ? _b : true);
    return true;
  }
  Pb(sceneGraph, parentVisible) {
    const localVisible = this.Zb(sceneGraph);
    const effectiveVisible = parentVisible && localVisible;
    if (sceneGraph.isVisible !== effectiveVisible) {
      sceneGraph.isVisible = effectiveVisible;
    }
    for (const child of sceneGraph.children) {
      this.Pb(child, effectiveVisible);
    }
  }
  Zb(sceneGraph) {
    const localVisible = sceneGraph.entity.getTagValue(TagKhrNodeVisibilityVisible);
    return typeof localVisible === "boolean" ? localVisible : sceneGraph.isVisible;
  }
  Vb(pathName, channel) {
    if (pathName.startsWith("material/")) {
      const meshComponent = this.entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        const mesh = meshComponent.mesh;
        const parameterName = this._b(pathName);
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
  _b(pathName) {
    let name = this.Ob.get(pathName);
    if (name === void 0) {
      name = pathName.split("/").pop();
      this.Ob.set(pathName, name);
    }
    return name;
  }
  Wb(pathName, channel) {
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
  Xb(pathName, channel) {
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
  Yb(pathName, channel, effekseerComponent) {
    if (pathName === "effekseer") {
      if (channel.animatedValue.x > 0.5) {
        if (this.Eb === 0) {
          effekseerComponent == null ? void 0 : effekseerComponent.play();
        }
      } else {
        if (this.Eb === 1) {
          effekseerComponent == null ? void 0 : effekseerComponent.pause();
        }
      }
      this.Eb = channel.animatedValue.x;
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
    _AnimationComponent.Kb.subscribe(type, handler);
  }
  /**
   * Sets whether this animation component is animating.
   * @param flg - True to enable animation, false to disable
   */
  setIsAnimating(flg) {
    this.Fb = flg;
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
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.c);
    for (const trackName of trackNames) {
      if (overwrittenTrackNames.has(trackName)) {
        _AnimationComponent.Ib(this.c, trackName);
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
      _AnimationComponent.Kb.publishAsync(_AnimationComponent.Event.ChangeAnimationInfo, {
        infoMap: new Map(animationGlobalInfo)
      });
    }
    if (!pathName.startsWith("vrmExpression/")) {
      this.entity.getTransform()._backupTransformAsRest();
    }
    this.Mb();
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
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.c);
    return animationGlobalInfo.get(animationTrackName).minStartInputTime;
  }
  /**
   * Gets the end input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The maximum end input time value
   */
  getEndInputValueOfAnimation(animationTrackName) {
    const animationGlobalInfo = _AnimationComponent.getAnimationGlobalInfo(this.c);
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
    return this.Fb;
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
    return this.c.entityRepository.getEntity(this.Qb);
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
    const globalTime = _AnimationComponent.getGlobalTime(this.c);
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
    let infoMap = this.Jb.get(engine);
    if (infoMap == null) {
      infoMap = /* @__PURE__ */ new Map();
      this.Jb.set(engine, infoMap);
    }
    return infoMap;
  }
  static Ib(engine, trackName) {
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
    _AnimationComponent.Kb.publishAsync(_AnimationComponent.Event.ChangeAnimationInfo, {
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
    this.Db = new Map(component.Db);
    AnimationStateRepository.markAnimationBindingChanged();
    this.Eb = component.Eb;
    this.Fb = component.Fb;
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
        srcAnim2.Gb();
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
        srcAnim2.Gb();
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
        srcAnim2.Gb();
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
      _AnimationComponent.Ib(this.c, trackName);
    }
    this.Mb();
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
    _AnimationComponent.Ib(this.c, trackName);
    this.Mb();
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
    return this.Db.get(this.getActiveAnimationTrack());
  }
  /**
   * Gets the feature hash for a specific animation track.
   * @param trackName - The animation track whose feature hash should be returned
   * @returns The feature hash, or undefined when the track is not registered
   */
  getAnimationTrackFeatureHash(trackName) {
    return this.Db.get(trackName);
  }
  /**
   * Destroys this component, cleaning up resources and clearing animation data.
   * @override
   */
  _destroy() {
    const trackNames = new Set(this.getAnimationTrackNames());
    super._destroy();
    this.__animationTrack.clear();
    this.Db.clear();
    this.Fb = false;
    AnimationStateRepository.markAnimationBindingChanged();
    for (const trackName of trackNames) {
      _AnimationComponent.Ib(this.c, trackName);
    }
  }
  Mb() {
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
    this.Db = hashMap;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    _AnimationComponent.Jb.delete(engine);
  }
};
/** Map to store animation global info per Engine instance for multi-engine support */
_AnimationComponent.Jb = /* @__PURE__ */ new Map();
// Event for pubsub of notifications
_AnimationComponent.Event = {
  ChangeAnimationInfo,
  PlayEnd
};
_AnimationComponent.$b = MutableQuaternion.identity();
_AnimationComponent.ac = MutableVector3.zero();
_AnimationComponent.bc = MutableVector3.one();
_AnimationComponent.Kb = new EventPubSub();
var AnimationComponent = _AnimationComponent;
registerComponentRuntimeHooks({
  beginFrame: (engine) => {
    AnimationStateRepository.beginProcessFrame(engine);
  },
  cleanup: (engine) => {
    AnimationStateRepository._cleanupForEngine(engine);
    AnimationComponent._cleanupForEngine(engine);
  },
  isDirty: (engine) => AnimationComponent.getIsAnimating(engine)
});
export {
  AnimationComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9BbmltYXRpb24vQW5pbWF0aW9uQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEVmZmVrc2VlckNvbXBvbmVudCB9IGZyb20gJy4uLy4uLy4uL2VmZmVrc2Vlci9FZmZla3NlZXJDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUge1xuICBBbmltYXRpb25DaGFubmVsLFxuICBBbmltYXRpb25Db21wb25lbnRFdmVudFR5cGUsXG4gIEFuaW1hdGlvbkluZm8sXG4gIEFuaW1hdGlvblBhdGhOYW1lLFxuICBBbmltYXRpb25TYW1wbGVyLFxuICBBbmltYXRpb25UcmFjayxcbiAgQW5pbWF0aW9uVHJhY2tOYW1lLFxufSBmcm9tICcuLi8uLi8uLi90eXBlcy9BbmltYXRpb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRJRCwgSW5kZXgsIFNlY29uZCwgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL2dsVEYyJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB7IHJlZ2lzdGVyQ29tcG9uZW50UnVudGltZUhvb2tzIH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnRSdW50aW1lSG9va3MnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUHJvY2Vzc1N0YWdlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMnO1xuaW1wb3J0IHsgQW5pbWF0aW9uQXR0cmlidXRlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQW5pbWF0aW9uQXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgSUFuaW1hdGlvbkVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi8uLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBNYXRoVXRpbCwgdHlwZSBTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoJztcbmltcG9ydCB7IEFuaW1hdGVkUXVhdGVybmlvbiB9IGZyb20gJy4uLy4uL21hdGgvQW5pbWF0ZWRRdWF0ZXJuaW9uJztcbmltcG9ydCB7IEFuaW1hdGVkVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvQW5pbWF0ZWRWZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgQW5pbWF0ZWRWZWN0b3JOIH0gZnJvbSAnLi4vLi4vbWF0aC9BbmltYXRlZFZlY3Rvck4nO1xuaW1wb3J0IHR5cGUgeyBJQW5pbWF0ZWRWYWx1ZSB9IGZyb20gJy4uLy4uL21hdGgvSUFuaW1hdGVkVmFsdWUnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgdHlwZSB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi8uLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IHR5cGUgRXZlbnRIYW5kbGVyLCBFdmVudFB1YlN1YiB9IGZyb20gJy4uLy4uL3N5c3RlbS9FdmVudFB1YlN1Yic7XG5pbXBvcnQgdHlwZSB7IEJsZW5kU2hhcGVDb21wb25lbnQgfSBmcm9tICcuLi9CbGVuZFNoYXBlL0JsZW5kU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFNjZW5lR3JhcGhDb21wb25lbnQgfSBmcm9tICcuLi9TY2VuZUdyYXBoL1NjZW5lR3JhcGhDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJQW5pbWF0aW9uUmV0YXJnZXQgfSBmcm9tICcuLi9Ta2VsZXRhbCc7XG5pbXBvcnQgdHlwZSB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuaW1wb3J0IHsgX19pbnRlcnBvbGF0ZSB9IGZyb20gJy4vQW5pbWF0aW9uT3BzJztcbmltcG9ydCB7IEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeSB9IGZyb20gJy4vQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5JztcblxuY29uc3QgQ2hhbmdlQW5pbWF0aW9uSW5mbyA9IFN5bWJvbCgnQW5pbWF0aW9uQ29tcG9uZW50RXZlbnRDaGFuZ2VBbmltYXRpb25JbmZvJyk7XG5jb25zdCBQbGF5RW5kID0gU3ltYm9sKCdBbmltYXRpb25Db21wb25lbnRFdmVudFBsYXlFbmQnKTtcbmNvbnN0IFZybUV4cHJlc3Npb25QYXRoUHJlZml4ID0gJ3ZybUV4cHJlc3Npb24vJztcblxudHlwZSBBbmltYXRpb25UcmFja0ZlYXR1cmUgPSB7XG4gIHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lO1xuICBwYXRoTmFtZXM6IFNldDxBbmltYXRpb25QYXRoTmFtZT47XG4gIG1pblN0YXJ0SW5wdXRUaW1lOiBTZWNvbmQ7XG4gIG1heEVuZElucHV0VGltZTogU2Vjb25kO1xuICB0b3RhbEtleWZyYW1lczogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBBIGNvbXBvbmVudCB0aGF0IG1hbmFnZXMgYW5pbWF0aW9uIGRhdGEgYW5kIGFwcGxpZXMgYW5pbWF0aW9uIHRyYW5zZm9ybWF0aW9ucyB0byBlbnRpdGllcy5cbiAqIFRoaXMgY29tcG9uZW50IGhhbmRsZXMgdmFyaW91cyB0eXBlcyBvZiBhbmltYXRpb25zIGluY2x1ZGluZyB0cmFuc2Zvcm0sIGJsZW5kIHNoYXBlLCBtYXRlcmlhbCxcbiAqIGxpZ2h0LCBjYW1lcmEsIGFuZCBFZmZla3NlZXIgcGFydGljbGUgc3lzdGVtIGFuaW1hdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBbmltYXRpb25Db21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICAvLy8gaW5uZXIgc3RhdGVzIC8vL1xuICAvLyBUaGUgbmFtZSBvZiB0aGUgY3VycmVudCBBY3RpdmUgVHJhY2tcbiAgcHJpdmF0ZSBfX2FuaW1hdGlvbkJsZW5kaW5nUmF0aW8gPSAwOyAvLyB0aGUgdmFsdWUgcmFuZ2UgaXMgWzAsMV1cblxuICAvLyBBbmltYXRpb24gRGF0YSBvZiBlYWNoIEFuaW1hdGlvbkNvbXBvbmVudFxuICBwcml2YXRlIF9fYW5pbWF0aW9uVHJhY2s6IEFuaW1hdGlvblRyYWNrID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzOiBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuICAvKiogTWFwIHRvIHN0b3JlIGFuaW1hdGlvbiBnbG9iYWwgaW5mbyBwZXIgRW5naW5lIGluc3RhbmNlIGZvciBtdWx0aS1lbmdpbmUgc3VwcG9ydCAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2FuaW1hdGlvbkdsb2JhbEluZm9NYXA6IE1hcDxFbmdpbmUsIE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvbkluZm8+PiA9IG5ldyBNYXAoKTtcblxuICBwcml2YXRlIF9faXNFZmZla3NlZXJTdGF0ZSA9IC0xO1xuXG4gIC8qKiBSZXVzZWQgbWFwIGZvciBWUk0gZXhwcmVzc2lvbiB3ZWlnaHRzIHRvIGF2b2lkIGEgcGVyLWZyYW1lIGFsbG9jYXRpb24uICovXG4gIHByaXZhdGUgX192cm1FeHByZXNzaW9uV2VpZ2h0cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgLyoqIENhY2hlIG9mIHRoZSBsZWFmIHBhcmFtZXRlciBuYW1lIG9mIGBtYXRlcmlhbC8uLi5gIGFuaW1hdGlvbiBwYXRocy4gKi9cbiAgcHJpdmF0ZSBfX21hdGVyaWFsUGFyYW1ldGVyTmFtZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAvLy8gZmxhZ3MgLy8vXG4gIHByaXZhdGUgX19pc0FuaW1hdGluZyA9IHRydWU7XG4gIHB1YmxpYyBpc0xvb3AgPSB0cnVlO1xuXG4gIC8vIEdsb2JhbCBhbmltYXRpb24gdGltZSBpbiBSaG9kb25pdGVcbiAgcHVibGljIHVzZUdsb2JhbFRpbWUgPSB0cnVlO1xuXG4gIC8vIGFuaW1hdGlvbiB0aW1lIGluIHRoaXMgYW5pbWF0aW9uIGNvbXBvbmVudFxuICBwdWJsaWMgdGltZSA9IDA7XG5cbiAgLy8gRXZlbnQgZm9yIHB1YnN1YiBvZiBub3RpZmljYXRpb25zXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgQ2hhbmdlQW5pbWF0aW9uSW5mbyxcbiAgICBQbGF5RW5kLFxuICB9O1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wUXVhdCA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wUG9zID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFNjYWxlID0gTXV0YWJsZVZlY3RvcjMub25lKCk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19wdWJzdWIgPSBuZXcgRXZlbnRQdWJTdWIoKTtcblxuICAvLy8gTGlmZUN5Y2xlIE1ldGhvZHMgLy8vXG5cbiAgLyoqXG4gICAqIENvbXBvbmVudCBsb2FkIGxpZmVjeWNsZSBtZXRob2QuIE1vdmVzIHRoZSBjb21wb25lbnQgdG8gdGhlIExvZ2ljIHByb2Nlc3Mgc3RhZ2UuXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcG9uZW50IGxvZ2ljIGxpZmVjeWNsZSBtZXRob2QuIEFwcGxpZXMgYW5pbWF0aW9uIGlmIGFuaW1hdGlvbiBpcyBlbmFibGVkLlxuICAgKlxuICAgKiAjIyBFYXJseSBSZXR1cm4gT3B0aW1pemF0aW9uIGZvciBWUk0gTW9kZWxzIHdpdGggU2hhcmVkIFNrZWxldG9uXG4gICAqXG4gICAqIFdoZW4gbXVsdGlwbGUgVlJNIG1vZGVscyBzaGFyZSB0aGUgc2FtZSBza2VsZXRvbiAoam9pbnQgZW50aXRpZXMpLCBhbmltYXRpb25cbiAgICogY2FsY3VsYXRpb25zIG9ubHkgbmVlZCB0byBiZSBwZXJmb3JtZWQgb25jZSBwZXIgZnJhbWUuIFRoaXMgb3B0aW1pemF0aW9uIHdvcmtzXG4gICAqIGJ5IGNoZWNraW5nIGlmIHRoZSBTa2VsZXRhbENvbXBvbmVudCdzIHNraW5uaW5nIGNhY2hlIHdpbGwgYmUgdXNlZCBmb3IgdGhpcyBlbnRpdHkuXG4gICAqXG4gICAqIFRoZSBvcHRpbWl6YXRpb24gZmxvdzpcbiAgICogMS4gU2tlbGV0YWxDb21wb25lbnQgdHJhY2tzIHdoaWNoIGpvaW50IEVudGl0eVVJRHMgaGFkIHNraW5uaW5nIGNhY2hlIGhpdHNcbiAgICogMi4gSm9pbnRzIGJlbG9uZ2luZyB0byBcImxlYWRlclwiIFNrZWxldGFsQ29tcG9uZW50cyAodGhvc2UgdGhhdCBjb21wdXRlIHNraW5uaW5nKVxuICAgKiAgICBhcmUgZXhjbHVkZWQgZnJvbSB0aGlzIHRyYWNraW5nXG4gICAqIDMuIEFuaW1hdGlvbkNvbXBvbmVudCBjaGVja3MgaWYgaXRzIGVudGl0eSBpcyBpbiB0aGUgY2FjaGVkIGxpc3RcbiAgICogNC4gSWYgY2FjaGVkLCBlYXJseSByZXR1cm4gc2tpcHMgYW5pbWF0aW9uIGNhbGN1bGF0aW9uIChza2lubmluZyByZXN1bHQgd2lsbCBiZSByZXVzZWQpXG4gICAqXG4gICAqIFRoaXMgc2lnbmlmaWNhbnRseSByZWR1Y2VzIENQVSBvdmVyaGVhZCB3aGVuIG1hbnkgVlJNIG1vZGVscyBzaGFyZSB0aGUgc2FtZSBza2VsZXRvbi5cbiAgICovXG4gICRsb2dpYygpIHtcbiAgICAvLyBTa2lwIGlmIGFuaW1hdGlvbiBpcyBnbG9iYWxseSBvciBsb2NhbGx5IGRpc2FibGVkXG4gICAgaWYgKCF0aGlzLmlzQW5pbWF0aW9uRW5hYmxlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEVhcmx5IFJldHVybiBPcHRpbWl6YXRpb24gZm9yIFZSTSBNb2RlbHMgd2l0aCBTaGFyZWQgU2tlbGV0b25cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gV2hlbiBtdWx0aXBsZSBWUk0gbW9kZWxzIHNoYXJlIHRoZSBzYW1lIGFuaW1hdGlvbiAoc2FtZSBza2VsZXRvbiBzdHJ1Y3R1cmUpLFxuICAgIC8vIG9ubHkgb25lIG1vZGVsICh0aGUgXCJsZWFkZXJcIikgbmVlZHMgdG8gY29tcHV0ZSBhbmltYXRpb24gdmFsdWVzLlxuICAgIC8vIE90aGVyIG1vZGVscyAoXCJmb2xsb3dlcnNcIikgY2FuIHNraXAgYW5pbWF0aW9uIGNhbGN1bGF0aW9uIGVudGlyZWx5IGJlY2F1c2VcbiAgICAvLyB0aGVpciBTa2VsZXRhbENvbXBvbmVudCB3aWxsIHJldXNlIHRoZSBjYWNoZWQgc2tpbm5pbmcgcmVzdWx0IGZyb20gdGhlIGxlYWRlci5cbiAgICAvL1xuICAgIC8vIEhvdyBpdCB3b3JrczpcbiAgICAvLyAxLiBTa2VsZXRhbENvbXBvbmVudCB0cmFja3Mgd2hpY2ggam9pbnRzIGhhZCBza2lubmluZyBjYWNoZSBoaXRzIGluIHRoZSBwcmV2aW91cyBmcmFtZVxuICAgIC8vIDIuIEpvaW50cyBiZWxvbmdpbmcgdG8gXCJsZWFkZXJcIiBTa2VsZXRhbENvbXBvbmVudHMgYXJlIGV4Y2x1ZGVkIChtdXN0IGNvbnRpbnVlIGFuaW1hdGluZylcbiAgICAvLyAzLiBKb2ludHMgYmVsb25naW5nIHRvIFwiZm9sbG93ZXJcIiBTa2VsZXRhbENvbXBvbmVudHMgYXJlIHJlZ2lzdGVyZWQgZm9yIGVhcmx5IHJldHVyblxuICAgIC8vIDQuIFRoaXMgQW5pbWF0aW9uQ29tcG9uZW50IGNoZWNrcyBpZiBpdHMgZW50aXR5IGlzIHJlZ2lzdGVyZWRcbiAgICAvL1xuICAgIC8vIFR3byBzY2VuYXJpb3M6XG4gICAgLy8gLSBzaGFsbG93Q29weTogSm9pbnRzIGFyZSBzaGFyZWQgKHNhbWUgZW50aXR5VUlEKSBcdTIxOTIgbm8gZWFybHkgcmV0dXJuIG5lZWRlZFxuICAgIC8vICAgKHRoZSBzYW1lIEFuaW1hdGlvbkNvbXBvbmVudCBpbnN0YW5jZSBwcm9jZXNzZXMgdGhlIHNoYXJlZCBqb2ludCBvbmNlKVxuICAgIC8vIC0gU2VwYXJhdGUgbG9hZDogSm9pbnRzIGFyZSBkaWZmZXJlbnQgKGRpZmZlcmVudCBlbnRpdHlVSUQsIHNhbWUgam9pbnRJbmRleClcbiAgICAvLyAgIFx1MjE5MiBlYXJseSByZXR1cm4gZW5hYmxlZCwgc2lnbmlmaWNhbnRseSByZWR1Y2luZyBDUFUgb3ZlcmhlYWRcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaWYgKEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5pc0VudGl0eUNhY2hlZCh0aGlzLl9fZW50aXR5VWlkLCB0aGlzLl9fZW5naW5lKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFwcGx5IGFuaW1hdGlvbiBjYWxjdWxhdGlvbnMgKHVwZGF0ZSBqb2ludCB0cmFuc2Zvcm1zKVxuICAgIHRoaXMuX19hcHBseUFuaW1hdGlvbigpO1xuICB9XG5cbiAgcHVibGljIGlzQW5pbWF0aW9uRW5hYmxlZCgpIHtcbiAgICBpZiAoQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKHRoaXMuX19lbmdpbmUpICYmIHRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYW5pbWF0aW9uIGJsZW5kaW5nIHJhdGlvIGFuZCBhcHBsaWVzIHRoZSBhbmltYXRpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBibGVuZGluZyByYXRpbyB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDFcbiAgICovXG4gIHNldCBhbmltYXRpb25CbGVuZGluZ1JhdGlvKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fYW5pbWF0aW9uQmxlbmRpbmdSYXRpbyA9IHZhbHVlO1xuICAgIHRoaXMuX19hcHBseUFuaW1hdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGFuaW1hdGlvbiBibGVuZGluZyByYXRpbyB3aXRob3V0IGV2YWx1YXRpbmcgYW5pbWF0aW9uIGNoYW5uZWxzIGltbWVkaWF0ZWx5LlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgYmxlbmRpbmcgcmF0aW8gdmFsdWUgYmV0d2VlbiAwIGFuZCAxXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldEFuaW1hdGlvbkJsZW5kaW5nUmF0aW9XaXRob3V0QXBwbHlpbmcodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX19hbmltYXRpb25CbGVuZGluZ1JhdGlvID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBhbmltYXRpb24gYmxlbmRpbmcgcmF0aW8uXG4gICAqIEByZXR1cm5zIFRoZSBibGVuZGluZyByYXRpbyB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDFcbiAgICovXG4gIGdldCBhbmltYXRpb25CbGVuZGluZ1JhdGlvKCkge1xuICAgIHJldHVybiB0aGlzLl9fYW5pbWF0aW9uQmxlbmRpbmdSYXRpbztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGFuaW1hdGlvbiB0byB0aGUgZW50aXR5IGJhc2VkIG9uIHRoZSBjdXJyZW50IHRpbWUgYW5kIGFuaW1hdGlvbiB0cmFja3MuXG4gICAqIEhhbmRsZXMgdmFyaW91cyBhbmltYXRpb24gdHlwZXMgaW5jbHVkaW5nIHRyYW5zZm9ybSwgYmxlbmQgc2hhcGUsIG1hdGVyaWFsLCBsaWdodCwgY2FtZXJhLCBhbmQgRWZmZWtzZWVyLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2FwcGx5QW5pbWF0aW9uKCkge1xuICAgIGxldCB0aW1lID0gdGhpcy50aW1lO1xuICAgIGlmICh0aGlzLnVzZUdsb2JhbFRpbWUpIHtcbiAgICAgIHRpbWUgPSBBbmltYXRpb25Db21wb25lbnQuZ2V0R2xvYmFsVGltZSh0aGlzLl9fZW5naW5lKTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1Db21wb25lbnQgPSAodGhpcy5lbnRpdHkgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eSkuZ2V0VHJhbnNmb3JtKCk7XG4gICAgLy8gUGh5c2ljcyBzdWJ0cmVlcyBtdXN0IGFsd2F5cyByZWNlaXZlIHRoZSBsb2NhbCB0cmFuc2Zvcm0gYmVjYXVzZSB0aGVpciBzZXR0ZXJzIG5vdGlmeSB0aGVcbiAgICAvLyBwaHlzaWNzIHN0cmF0ZWdpZXMgd2l0aCB0aGUgcGFyZW50IHdvcmxkIHRyYW5zZm9ybSAoc2VlIF9fc2hvdWxkV3JpdGVUcmFuc2Zvcm1WYWx1ZSkuXG4gICAgY29uc3QgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlID0gISh0aGlzLmVudGl0eSBhcyB1bmtub3duIGFzIElTY2VuZUdyYXBoRW50aXR5KS5nZXRTY2VuZUdyYXBoKClcbiAgICAgIC5faGFzUGh5c2ljc0NvbXBvbmVudEluU3VidHJlZTtcbiAgICBjb25zdCBibGVuZFNoYXBlQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRCbGVuZFNoYXBlKCk7XG4gICAgY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRFZmZla3NlZXIoKTtcbiAgICBsZXQgdnJtRXhwcmVzc2lvbldlaWdodHM6IE1hcDxzdHJpbmcsIG51bWJlcj4gfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgYmxlbmRpbmdSYXRpbyA9IHRoaXMuX19hbmltYXRpb25CbGVuZGluZ1JhdGlvO1xuXG4gICAgZm9yIChjb25zdCBbcGF0aE5hbWUsIGNoYW5uZWxdIG9mIHRoaXMuX19hbmltYXRpb25UcmFjaykge1xuICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICAgIC8vIEV2YWx1YXRlIHRoZSB2YWx1ZSBvbmNlIHdpdGggYm90aCB0aGUgdGltZSBhbmQgdGhlIGJsZW5kaW5nIHJhdGlvIHNldC5cbiAgICAgIGNvbnN0IHNldFRpbWVBbmRCbGVuZGluZ1JhdGlvID0gYW5pbWF0ZWRWYWx1ZS5zZXRUaW1lQW5kQmxlbmRpbmdSYXRpbztcbiAgICAgIGlmIChzZXRUaW1lQW5kQmxlbmRpbmdSYXRpbyAhPSBudWxsKSB7XG4gICAgICAgIHNldFRpbWVBbmRCbGVuZGluZ1JhdGlvLmNhbGwoYW5pbWF0ZWRWYWx1ZSwgdGltZSwgYmxlbmRpbmdSYXRpbyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbmltYXRlZFZhbHVlLnNldFRpbWUodGltZSk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuYmxlbmRpbmdSYXRpbyA9IGJsZW5kaW5nUmF0aW87XG4gICAgICB9XG5cbiAgICAgIGlmIChwYXRoTmFtZS5zdGFydHNXaXRoKFZybUV4cHJlc3Npb25QYXRoUHJlZml4KSkge1xuICAgICAgICBpZiAodnJtRXhwcmVzc2lvbldlaWdodHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuX192cm1FeHByZXNzaW9uV2VpZ2h0cyA/Pz0gbmV3IE1hcCgpO1xuICAgICAgICAgIHZybUV4cHJlc3Npb25XZWlnaHRzID0gdGhpcy5fX3ZybUV4cHJlc3Npb25XZWlnaHRzO1xuICAgICAgICAgIHZybUV4cHJlc3Npb25XZWlnaHRzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbk5hbWUgPSBwYXRoTmFtZS5zdWJzdHJpbmcoVnJtRXhwcmVzc2lvblBhdGhQcmVmaXgubGVuZ3RoKTtcbiAgICAgICAgdnJtRXhwcmVzc2lvbldlaWdodHMuc2V0KGV4cHJlc3Npb25OYW1lLCAoY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyKS54KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLl9fYXBwbHlDaGFubmVsQW5pbWF0aW9uKFxuICAgICAgICBwYXRoTmFtZSxcbiAgICAgICAgY2hhbm5lbCxcbiAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50LFxuICAgICAgICBjYW5Ta2lwSWRlbnRpY2FsVHJhbnNmb3JtV3JpdGUsXG4gICAgICAgIGJsZW5kU2hhcGVDb21wb25lbnQsXG4gICAgICAgIGVmZmVrc2VlckNvbXBvbmVudFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoSXMuZXhpc3QodnJtRXhwcmVzc2lvbldlaWdodHMpKSB7XG4gICAgICBjb25zdCB2cm1Db21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFZybSgpO1xuICAgICAgaWYgKElzLmV4aXN0KHZybUNvbXBvbmVudCkpIHtcbiAgICAgICAgdnJtQ29tcG9uZW50LnNldEV4cHJlc3Npb25XZWlnaHRzKHZybUV4cHJlc3Npb25XZWlnaHRzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlDaGFubmVsQW5pbWF0aW9uKFxuICAgIHBhdGhOYW1lOiBzdHJpbmcsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICB0cmFuc2Zvcm1Db21wb25lbnQ6IFRyYW5zZm9ybUNvbXBvbmVudCxcbiAgICBjYW5Ta2lwSWRlbnRpY2FsVHJhbnNmb3JtV3JpdGU6IGJvb2xlYW4sXG4gICAgYmxlbmRTaGFwZUNvbXBvbmVudD86IEJsZW5kU2hhcGVDb21wb25lbnQsXG4gICAgZWZmZWtzZWVyQ29tcG9uZW50PzogRWZmZWtzZWVyQ29tcG9uZW50XG4gICkge1xuICAgIGlmICh0aGlzLl9fYXBwbHlUcmFuc2Zvcm1BbmltYXRpb24ocGF0aE5hbWUsIGNoYW5uZWwsIHRyYW5zZm9ybUNvbXBvbmVudCwgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9fYXBwbHlCbGVuZFNoYXBlQW5pbWF0aW9uKHBhdGhOYW1lLCBjaGFubmVsLCBibGVuZFNoYXBlQ29tcG9uZW50KSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9fYXBwbHlWaXNpYmlsaXR5QW5pbWF0aW9uKHBhdGhOYW1lLCBjaGFubmVsKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9fYXBwbHlNYXRlcmlhbEFuaW1hdGlvbihwYXRoTmFtZSwgY2hhbm5lbCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fX2FwcGx5TGlnaHRBbmltYXRpb24ocGF0aE5hbWUsIGNoYW5uZWwpKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX19hcHBseUNhbWVyYUFuaW1hdGlvbihwYXRoTmFtZSwgY2hhbm5lbCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5fX2FwcGx5RWZmZWtzZWVyQW5pbWF0aW9uKHBhdGhOYW1lLCBjaGFubmVsLCBlZmZla3NlZXJDb21wb25lbnQpKSByZXR1cm47XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlUcmFuc2Zvcm1BbmltYXRpb24oXG4gICAgcGF0aE5hbWU6IHN0cmluZyxcbiAgICBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsLFxuICAgIHRyYW5zZm9ybUNvbXBvbmVudDogVHJhbnNmb3JtQ29tcG9uZW50LFxuICAgIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZTogYm9vbGVhblxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgIGlmIChwYXRoTmFtZSA9PT0gJ3RyYW5zbGF0ZScpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fX3Nob3VsZFdyaXRlVHJhbnNmb3JtVmFsdWUoXG4gICAgICAgICAgYW5pbWF0ZWRWYWx1ZSxcbiAgICAgICAgICB0cmFuc2Zvcm1Db21wb25lbnQubG9jYWxQb3NpdGlvbklubmVyLl92LFxuICAgICAgICAgIGNhblNraXBJZGVudGljYWxUcmFuc2Zvcm1Xcml0ZVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50LmxvY2FsUG9zaXRpb24gPSBhbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgVmVjdG9yMztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdxdWF0ZXJuaW9uJykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9fc2hvdWxkV3JpdGVUcmFuc2Zvcm1WYWx1ZShcbiAgICAgICAgICBhbmltYXRlZFZhbHVlLFxuICAgICAgICAgIHRyYW5zZm9ybUNvbXBvbmVudC5sb2NhbFJvdGF0aW9uSW5uZXIuX3YsXG4gICAgICAgICAgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICB0cmFuc2Zvcm1Db21wb25lbnQubG9jYWxSb3RhdGlvbiA9IGFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBRdWF0ZXJuaW9uO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ3NjYWxlJykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9fc2hvdWxkV3JpdGVUcmFuc2Zvcm1WYWx1ZShcbiAgICAgICAgICBhbmltYXRlZFZhbHVlLFxuICAgICAgICAgIHRyYW5zZm9ybUNvbXBvbmVudC5sb2NhbFNjYWxlSW5uZXIuX3YsXG4gICAgICAgICAgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICB0cmFuc2Zvcm1Db21wb25lbnQubG9jYWxTY2FsZSA9IGFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBWZWN0b3IzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgd2hlbiB0aGUgYW5pbWF0ZWQgdmFsdWUgZGlmZmVycyBmcm9tIHRoZSB2YWx1ZSBhbHJlYWR5IHN0b3JlZCBpbiB0aGUgdHJhbnNmb3JtLlxuICAgKlxuICAgKiBXcml0aW5nIGFuIGlkZW50aWNhbCB2YWx1ZSB3b3VsZCBzdGlsbCBpbmNyZW1lbnQgdGhlIHRyYW5zZm9ybSB1cGRhdGUgY291bnQgYW5kIGludmFsaWRhdGUgdGhlXG4gICAqIHdvcmxkIG1hdHJpeCBhbmQgc2tpbm5pbmcgY2FjaGVzIGRvd25zdHJlYW0sIHNvIGlkZW50aWNhbCB3cml0ZXMgYXJlIHNraXBwZWQuIFRoZSBjb21wYXJpc29uIGlzXG4gICAqIGFnYWluc3QgdGhlIHRhcmdldCB2YWx1ZSAobm90IHRoZSBsYXN0IGFwcGxpZWQgdmFsdWUpLCBzbyBleHRlcm5hbCB0cmFuc2Zvcm0gZWRpdHMgYXJlIHN0aWxsXG4gICAqIG92ZXJ3cml0dGVuIGJ5IHRoZSBhbmltYXRpb24gb24gdGhlIG5leHQgZnJhbWUuXG4gICAqXG4gICAqIFBoeXNpY3Mgc3VidHJlZXMgc2V0IGBjYW5Ta2lwSWRlbnRpY2FsVHJhbnNmb3JtV3JpdGVgIHRvIGZhbHNlOiB0aGVpciBzZXR0ZXJzIGFsc28gbm90aWZ5IHRoZVxuICAgKiBwaHlzaWNzIHN0cmF0ZWdpZXMgd2l0aCB0aGUgcGFyZW50IHdvcmxkIHRyYW5zZm9ybSwgd2hpY2ggbXVzdCBrZWVwIHJ1bm5pbmcgZXZlbiB3aGVuIHRoZSBsb2NhbFxuICAgKiB2YWx1ZSBpcyB1bmNoYW5nZWQuXG4gICAqL1xuICBwcml2YXRlIF9fc2hvdWxkV3JpdGVUcmFuc2Zvcm1WYWx1ZShcbiAgICBhbmltYXRlZFZhbHVlOiBJQW5pbWF0ZWRWYWx1ZSxcbiAgICBjdXJyZW50VmFsdWU6IFR5cGVkQXJyYXksXG4gICAgY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlOiBib29sZWFuXG4gICk6IGJvb2xlYW4ge1xuICAgIGlmICghY2FuU2tpcElkZW50aWNhbFRyYW5zZm9ybVdyaXRlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0ZWQgPSBhbmltYXRlZFZhbHVlLmdldFZhbHVlQXJyYXk/LigpO1xuICAgIGlmIChhbmltYXRlZCA9PT0gdW5kZWZpbmVkIHx8IGFuaW1hdGVkLmxlbmd0aCAhPT0gY3VycmVudFZhbHVlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5pbWF0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhbmltYXRlZFtpXSAhPT0gY3VycmVudFZhbHVlW2ldKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlCbGVuZFNoYXBlQW5pbWF0aW9uKFxuICAgIHBhdGhOYW1lOiBzdHJpbmcsXG4gICAgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCxcbiAgICBibGVuZFNoYXBlQ29tcG9uZW50PzogQmxlbmRTaGFwZUNvbXBvbmVudFxuICApOiBib29sZWFuIHtcbiAgICBpZiAocGF0aE5hbWUgPT09ICd3ZWlnaHRzJykge1xuICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyBBbmltYXRlZFZlY3Rvck47XG4gICAgICBjb25zdCB2YWx1ZSA9IGFuaW1hdGVkVmFsdWUuZ2V0VmFsdWVBcnJheT8uKCk7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBibGVuZFNoYXBlQ29tcG9uZW50IS5zZXRXZWlnaHRzRnJvbUFycmF5TGlrZSh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBibGVuZFNoYXBlQ29tcG9uZW50IS53ZWlnaHRzID0gYW5pbWF0ZWRWYWx1ZS5nZXROdW1iZXJBcnJheSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseVZpc2liaWxpdHlBbmltYXRpb24ocGF0aE5hbWU6IHN0cmluZywgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCk6IGJvb2xlYW4ge1xuICAgIGlmIChwYXRoTmFtZSAhPT0gJ3Zpc2liaWxpdHknKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9ICh0aGlzLmVudGl0eSBhcyB1bmtub3duIGFzIElTY2VuZUdyYXBoRW50aXR5KS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgY29uc3QgbG9jYWxWaXNpYmxlID0gKGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcikueCA+IDAuNTtcbiAgICBpZiAoc2NlbmVHcmFwaC5lbnRpdHkuZ2V0VGFnVmFsdWUoVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlKSAhPT0gbG9jYWxWaXNpYmxlKSB7XG4gICAgICBzY2VuZUdyYXBoLmVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogVGFnS2hyTm9kZVZpc2liaWxpdHlWaXNpYmxlLCB2YWx1ZTogbG9jYWxWaXNpYmxlIH0pO1xuICAgIH1cbiAgICB0aGlzLl9fYXBwbHlFZmZlY3RpdmVWaXNpYmlsaXR5KHNjZW5lR3JhcGgsIHNjZW5lR3JhcGgucGFyZW50Py5pc1Zpc2libGUgPz8gdHJ1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlFZmZlY3RpdmVWaXNpYmlsaXR5KHNjZW5lR3JhcGg6IFNjZW5lR3JhcGhDb21wb25lbnQsIHBhcmVudFZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCBsb2NhbFZpc2libGUgPSB0aGlzLl9fZ2V0TG9jYWxWaXNpYmlsaXR5KHNjZW5lR3JhcGgpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZVZpc2libGUgPSBwYXJlbnRWaXNpYmxlICYmIGxvY2FsVmlzaWJsZTtcbiAgICBpZiAoc2NlbmVHcmFwaC5pc1Zpc2libGUgIT09IGVmZmVjdGl2ZVZpc2libGUpIHtcbiAgICAgIHNjZW5lR3JhcGguaXNWaXNpYmxlID0gZWZmZWN0aXZlVmlzaWJsZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHNjZW5lR3JhcGguY2hpbGRyZW4pIHtcbiAgICAgIHRoaXMuX19hcHBseUVmZmVjdGl2ZVZpc2liaWxpdHkoY2hpbGQsIGVmZmVjdGl2ZVZpc2libGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19nZXRMb2NhbFZpc2liaWxpdHkoc2NlbmVHcmFwaDogU2NlbmVHcmFwaENvbXBvbmVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxvY2FsVmlzaWJsZSA9IHNjZW5lR3JhcGguZW50aXR5LmdldFRhZ1ZhbHVlKFRhZ0tock5vZGVWaXNpYmlsaXR5VmlzaWJsZSk7XG4gICAgcmV0dXJuIHR5cGVvZiBsb2NhbFZpc2libGUgPT09ICdib29sZWFuJyA/IGxvY2FsVmlzaWJsZSA6IHNjZW5lR3JhcGguaXNWaXNpYmxlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5TWF0ZXJpYWxBbmltYXRpb24ocGF0aE5hbWU6IHN0cmluZywgY2hhbm5lbDogQW5pbWF0aW9uQ2hhbm5lbCk6IGJvb2xlYW4ge1xuICAgIGlmIChwYXRoTmFtZS5zdGFydHNXaXRoKCdtYXRlcmlhbC8nKSkge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0TWVzaCgpO1xuICAgICAgaWYgKElzLmV4aXN0KG1lc2hDb21wb25lbnQpICYmIElzLmV4aXN0KG1lc2hDb21wb25lbnQubWVzaCkpIHtcbiAgICAgICAgY29uc3QgbWVzaCA9IG1lc2hDb21wb25lbnQubWVzaDtcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyTmFtZSA9IHRoaXMuX19nZXRNYXRlcmlhbFBhcmFtZXRlck5hbWUocGF0aE5hbWUpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBwcmltaXRpdmUubWF0ZXJpYWw7XG4gICAgICAgICAgaWYgKElzLmV4aXN0KG1hdGVyaWFsKSkge1xuICAgICAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKHBhcmFtZXRlck5hbWUsIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldE1hdGVyaWFsUGFyYW1ldGVyTmFtZShwYXRoTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgbmFtZSA9IHRoaXMuX19tYXRlcmlhbFBhcmFtZXRlck5hbWVDYWNoZS5nZXQocGF0aE5hbWUpO1xuICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG5hbWUgPSBwYXRoTmFtZS5zcGxpdCgnLycpLnBvcCgpITtcbiAgICAgIHRoaXMuX19tYXRlcmlhbFBhcmFtZXRlck5hbWVDYWNoZS5zZXQocGF0aE5hbWUsIG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseUxpZ2h0QW5pbWF0aW9uKHBhdGhOYW1lOiBzdHJpbmcsIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwpOiBib29sZWFuIHtcbiAgICBjb25zdCBsaWdodENvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0TGlnaHQoKTtcbiAgICBpZiAoIUlzLmV4aXN0KGxpZ2h0Q29tcG9uZW50KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKHBhdGhOYW1lID09PSAnbGlnaHRfY29sb3InKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFZlY3RvcjM7XG4gICAgICBsaWdodENvbXBvbmVudC5jb2xvciA9IGNvbG9yO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2xpZ2h0X2ludGVuc2l0eScpIHtcbiAgICAgIGNvbnN0IGludGVuc2l0eSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGxpZ2h0Q29tcG9uZW50LmludGVuc2l0eSA9IGludGVuc2l0eS5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdsaWdodF9yYW5nZScpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgbGlnaHRDb21wb25lbnQucmFuZ2UgPSByYW5nZS5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdsaWdodF9zcG90X2lubmVyQ29uZUFuZ2xlJykge1xuICAgICAgY29uc3QgaW5uZXJDb25lQW5nbGUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBsaWdodENvbXBvbmVudC5pbm5lckNvbmVBbmdsZSA9IGlubmVyQ29uZUFuZ2xlLl92WzBdO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2xpZ2h0X3Nwb3Rfb3V0ZXJDb25lQW5nbGUnKSB7XG4gICAgICBjb25zdCBvdXRlckNvbmVBbmdsZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGxpZ2h0Q29tcG9uZW50Lm91dGVyQ29uZUFuZ2xlID0gb3V0ZXJDb25lQW5nbGUuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2FwcGx5Q2FtZXJhQW5pbWF0aW9uKHBhdGhOYW1lOiBzdHJpbmcsIGNoYW5uZWw6IEFuaW1hdGlvbkNoYW5uZWwpOiBib29sZWFuIHtcbiAgICBjb25zdCBjYW1lcmFDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldENhbWVyYSgpO1xuICAgIGlmICghSXMuZXhpc3QoY2FtZXJhQ29tcG9uZW50KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKHBhdGhOYW1lID09PSAnY2FtZXJhX3puZWFyJykge1xuICAgICAgY29uc3Qgem5lYXIgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQuek5lYXIgPSB6bmVhci5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocGF0aE5hbWUgPT09ICdjYW1lcmFfemZhcicpIHtcbiAgICAgIGNvbnN0IHpmYXIgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXI7XG4gICAgICBjYW1lcmFDb21wb25lbnQuekZhciA9IHpmYXIuX3ZbMF07XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAnY2FtZXJhX2ZvdnknKSB7XG4gICAgICBjb25zdCBmb3Z5ID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aChNYXRoVXRpbC5yYWRpYW5Ub0RlZ3JlZShmb3Z5Ll92WzBdKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhdGhOYW1lID09PSAnY2FtZXJhX3htYWcnKSB7XG4gICAgICBjb25zdCB4bWFnID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlIGFzIHVua25vd24gYXMgU2NhbGFyO1xuICAgICAgY2FtZXJhQ29tcG9uZW50LnhNYWcgPSB4bWFnLl92WzBdO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwYXRoTmFtZSA9PT0gJ2NhbWVyYV95bWFnJykge1xuICAgICAgY29uc3QgeW1hZyA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcjtcbiAgICAgIGNhbWVyYUNvbXBvbmVudC55TWFnID0geW1hZy5fdlswXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlFZmZla3NlZXJBbmltYXRpb24oXG4gICAgcGF0aE5hbWU6IHN0cmluZyxcbiAgICBjaGFubmVsOiBBbmltYXRpb25DaGFubmVsLFxuICAgIGVmZmVrc2VlckNvbXBvbmVudD86IEVmZmVrc2VlckNvbXBvbmVudFxuICApOiBib29sZWFuIHtcbiAgICBpZiAocGF0aE5hbWUgPT09ICdlZmZla3NlZXInKSB7XG4gICAgICBpZiAoKGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZSBhcyB1bmtub3duIGFzIFNjYWxhcikueCA+IDAuNSkge1xuICAgICAgICBpZiAodGhpcy5fX2lzRWZmZWtzZWVyU3RhdGUgPT09IDApIHtcbiAgICAgICAgICBlZmZla3NlZXJDb21wb25lbnQ/LnBsYXkoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuX19pc0VmZmVrc2VlclN0YXRlID09PSAxKSB7XG4gICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50Py5wYXVzZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9faXNFZmZla3NlZXJTdGF0ZSA9IChjaGFubmVsLmFuaW1hdGVkVmFsdWUgYXMgdW5rbm93biBhcyBTY2FsYXIpLng7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZXMgdG8gYW5pbWF0aW9uIGNvbXBvbmVudCBldmVudHMuXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGUgb2YgZXZlbnQgdG8gc3Vic2NyaWJlIHRvXG4gICAqIEBwYXJhbSBoYW5kbGVyIC0gVGhlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICovXG4gIHN0YXRpYyBzdWJzY3JpYmUodHlwZTogQW5pbWF0aW9uQ29tcG9uZW50RXZlbnRUeXBlLCBoYW5kbGVyOiBFdmVudEhhbmRsZXIpIHtcbiAgICBBbmltYXRpb25Db21wb25lbnQuX19wdWJzdWIuc3Vic2NyaWJlKHR5cGUsIGhhbmRsZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciB0aGlzIGFuaW1hdGlvbiBjb21wb25lbnQgaXMgYW5pbWF0aW5nLlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBlbmFibGUgYW5pbWF0aW9uLCBmYWxzZSB0byBkaXNhYmxlXG4gICAqL1xuICBzZXRJc0FuaW1hdGluZyhmbGc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9faXNBbmltYXRpbmcgPSBmbGc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYWN0aXZlIGFuaW1hdGlvbiB0cmFjayBmb3IgYWxsIGFuaW1hdGlvbiBjb21wb25lbnRzLlxuICAgKiBAcGFyYW0gYW5pbWF0aW9uVHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFjayB0byBhY3RpdmF0ZVxuICAgKi9cbiAgc3RhdGljIHNldEFjdGl2ZUFuaW1hdGlvbkZvckFsbChlbmdpbmU6IEVuZ2luZSwgYW5pbWF0aW9uVHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUpIHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKEFuaW1hdGlvbkNvbXBvbmVudCkgYXMgQW5pbWF0aW9uQ29tcG9uZW50W107XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgY29tcG9uZW50cykge1xuICAgICAgY29tcG9uZW50LnNldEFjdGl2ZUFuaW1hdGlvblRyYWNrKGFuaW1hdGlvblRyYWNrTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFjdGl2ZSBhbmltYXRpb24gdHJhY2sgZm9yIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gYW5pbWF0aW9uVHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFjayB0byBhY3RpdmF0ZVxuICAgKi9cbiAgc2V0QWN0aXZlQW5pbWF0aW9uVHJhY2soYW5pbWF0aW9uVHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUpIHtcbiAgICBmb3IgKGNvbnN0IFssIGNoYW5uZWxdIG9mIHRoaXMuX19hbmltYXRpb25UcmFjaykge1xuICAgICAgY2hhbm5lbC5hbmltYXRlZFZhbHVlLnNldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKGFuaW1hdGlvblRyYWNrTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNlY29uZCBhY3RpdmUgYW5pbWF0aW9uIHRyYWNrIGZvciBibGVuZGluZyBwdXJwb3Nlcy5cbiAgICogQHBhcmFtIGFuaW1hdGlvblRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzZWNvbmQgYW5pbWF0aW9uIHRyYWNrIHRvIGFjdGl2YXRlXG4gICAqL1xuICBzZXRTZWNvbmRBY3RpdmVBbmltYXRpb25UcmFjayhhbmltYXRpb25UcmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSkge1xuICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICBjaGFubmVsLmFuaW1hdGVkVmFsdWUuc2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKGFuaW1hdGlvblRyYWNrTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIGN1cnJlbnRseSBhY3RpdmUgYW5pbWF0aW9uIHRyYWNrLlxuICAgKiBAcmV0dXJucyBUaGUgbmFtZSBvZiB0aGUgYWN0aXZlIGFuaW1hdGlvbiB0cmFja1xuICAgKiBAdGhyb3dzIEVycm9yIGlmIG5vIGFjdGl2ZSBhbmltYXRpb24gdHJhY2sgaXMgZm91bmRcbiAgICovXG4gIGdldEFjdGl2ZUFuaW1hdGlvblRyYWNrKCkge1xuICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICByZXR1cm4gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEZpcnN0QWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignTm8gYWN0aXZlIGFuaW1hdGlvbiB0cmFjayBmb3VuZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGNvbXBvbmVudCBoYXMgYSBzcGVjaWZpYyBhbmltYXRpb24gZm9yIHRoZSBnaXZlbiB0cmFjayBhbmQgcGF0aC5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBhbmltYXRpb24gdHJhY2sgbmFtZSB0byBjaGVja1xuICAgKiBAcGFyYW0gcGF0aE5hbWUgLSBUaGUgYW5pbWF0aW9uIHBhdGggbmFtZSB0byBjaGVja1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBhbmltYXRpb24gZXhpc3RzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGhhc0FuaW1hdGlvbih0cmFja05hbWU6IEFuaW1hdGlvblRyYWNrTmFtZSwgcGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lKTogYm9vbGVhbiB7XG4gICAgZm9yIChjb25zdCBbY3VycmVudFBhdGhOYW1lLCBjaGFubmVsXSBvZiB0aGlzLl9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgIHJldHVybiBwYXRoTmFtZSA9PT0gY3VycmVudFBhdGhOYW1lICYmIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRGaXJzdEFjdGl2ZUFuaW1hdGlvblRyYWNrTmFtZSgpID09PSB0cmFja05hbWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFuIGFuaW1hdGlvbiBjaGFubmVsIGZvciB0aGUgc3BlY2lmaWVkIHBhdGguIElmIGEgY2hhbm5lbCBhbHJlYWR5IGV4aXN0cyBmb3IgdGhlIHBhdGgsXG4gICAqIGl0IG1lcmdlcyB0aGUgbmV3IGFuaW1hdGlvbiBkYXRhIHdpdGggdGhlIGV4aXN0aW5nIG9uZS5cbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoIChlLmcuLCAndHJhbnNsYXRlJywgJ3JvdGF0ZScsICdzY2FsZScpXG4gICAqIEBwYXJhbSBhbmltYXRlZFZhbHVlQXJnIC0gVGhlIGFuaW1hdGVkIHZhbHVlIGNvbnRhaW5pbmcgYW5pbWF0aW9uIGRhdGFcbiAgICovXG4gIHNldEFuaW1hdGlvbihwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWUsIGFuaW1hdGVkVmFsdWVBcmc6IElBbmltYXRlZFZhbHVlKSB7XG4gICAgbGV0IGFuaW1hdGVkVmFsdWU6IElBbmltYXRlZFZhbHVlO1xuICAgIGNvbnN0IG92ZXJ3cml0dGVuVHJhY2tOYW1lcyA9IG5ldyBTZXQ8QW5pbWF0aW9uVHJhY2tOYW1lPigpO1xuICAgIGlmICh0aGlzLl9fYW5pbWF0aW9uVHJhY2suaGFzKHBhdGhOYW1lKSkge1xuICAgICAgY29uc3QgZXhpc3RlZEFuaW1hdGVkVmFsdWUgPSB0aGlzLl9fYW5pbWF0aW9uVHJhY2suZ2V0KHBhdGhOYW1lKSEuYW5pbWF0ZWRWYWx1ZTtcbiAgICAgIGNvbnN0IGV4aXN0ZWRUcmFja05hbWVzID0gbmV3IFNldChleGlzdGVkQW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkpO1xuICAgICAgZm9yIChjb25zdCB0cmFja05hbWUgb2YgYW5pbWF0ZWRWYWx1ZUFyZy5nZXRBbGxUcmFja05hbWVzKCkpIHtcbiAgICAgICAgaWYgKGV4aXN0ZWRUcmFja05hbWVzLmhhcyh0cmFja05hbWUpKSB7XG4gICAgICAgICAgb3ZlcndyaXR0ZW5UcmFja05hbWVzLmFkZCh0cmFja05hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGV4aXN0ZWRBbmltYXRlZFZhbHVlLnNldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lLCBhbmltYXRlZFZhbHVlQXJnLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKSk7XG4gICAgICB9XG4gICAgICBhbmltYXRlZFZhbHVlID0gZXhpc3RlZEFuaW1hdGVkVmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19hbmltYXRpb25UcmFjay5zZXQocGF0aE5hbWUsIHtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZTogYW5pbWF0ZWRWYWx1ZUFyZyxcbiAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgcGF0aE5hbWUsXG4gICAgICAgICAgZW50aXR5OiB0aGlzLmVudGl0eSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgYW5pbWF0ZWRWYWx1ZSA9IGFuaW1hdGVkVmFsdWVBcmc7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIEFuaW1hdGlvbkluZm9cbiAgICBjb25zdCB0cmFja05hbWVzID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCk7XG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IEFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25HbG9iYWxJbmZvKHRoaXMuX19lbmdpbmUpO1xuICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIHRyYWNrTmFtZXMpIHtcbiAgICAgIGlmIChvdmVyd3JpdHRlblRyYWNrTmFtZXMuaGFzKHRyYWNrTmFtZSkpIHtcbiAgICAgICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fcmVjYWxjdWxhdGVBbmltYXRpb25JbmZvKHRoaXMuX19lbmdpbmUsIHRyYWNrTmFtZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgbmV3TWluU3RhcnRJbnB1dFRpbWUgPSBhbmltYXRlZFZhbHVlLmdldE1pblN0YXJ0SW5wdXRUaW1lKHRyYWNrTmFtZSk7XG4gICAgICBjb25zdCBuZXdNYXhFbmRJbnB1dFRpbWUgPSBhbmltYXRlZFZhbHVlLmdldE1heEVuZElucHV0VGltZSh0cmFja05hbWUpO1xuICAgICAgY29uc3QgZXhpc3RpbmdJbmZvID0gYW5pbWF0aW9uR2xvYmFsSW5mby5nZXQodHJhY2tOYW1lKTtcblxuICAgICAgY29uc3QgaW5mbyA9IHtcbiAgICAgICAgbmFtZTogdHJhY2tOYW1lLFxuICAgICAgICBtaW5TdGFydElucHV0VGltZTpcbiAgICAgICAgICBleGlzdGluZ0luZm8gPT0gbnVsbCA/IG5ld01pblN0YXJ0SW5wdXRUaW1lIDogTWF0aC5taW4oZXhpc3RpbmdJbmZvLm1pblN0YXJ0SW5wdXRUaW1lLCBuZXdNaW5TdGFydElucHV0VGltZSksXG4gICAgICAgIG1heEVuZElucHV0VGltZTpcbiAgICAgICAgICBleGlzdGluZ0luZm8gPT0gbnVsbCA/IG5ld01heEVuZElucHV0VGltZSA6IE1hdGgubWF4KGV4aXN0aW5nSW5mby5tYXhFbmRJbnB1dFRpbWUsIG5ld01heEVuZElucHV0VGltZSksXG4gICAgICB9O1xuICAgICAgYW5pbWF0aW9uR2xvYmFsSW5mby5zZXQodHJhY2tOYW1lLCBpbmZvKTtcbiAgICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX3B1YnN1Yi5wdWJsaXNoQXN5bmMoQW5pbWF0aW9uQ29tcG9uZW50LkV2ZW50LkNoYW5nZUFuaW1hdGlvbkluZm8sIHtcbiAgICAgICAgaW5mb01hcDogbmV3IE1hcChhbmltYXRpb25HbG9iYWxJbmZvKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBSdW50aW1lLW9ubHkgVlJNIGV4cHJlc3Npb24gY2hhbm5lbHMgZG8gbm90IGFuaW1hdGUgVHJhbnNmb3JtIGFuZCBtdXN0IG5vdCByZXBsYWNlIGl0cyByZXN0IHBvc2UuXG4gICAgaWYgKCFwYXRoTmFtZS5zdGFydHNXaXRoKCd2cm1FeHByZXNzaW9uLycpKSB7XG4gICAgICB0aGlzLmVudGl0eS5nZXRUcmFuc2Zvcm0oKS5fYmFja3VwVHJhbnNmb3JtQXNSZXN0KCk7XG4gICAgfVxuICAgIHRoaXMuX191cGRhdGVBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbmltYXRlZCB2YWx1ZSBmb3IgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gcGF0aC5cbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoXG4gICAqIEByZXR1cm5zIFRoZSBhbmltYXRlZCB2YWx1ZSBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBnZXRBbmltYXRpb24ocGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuX19hbmltYXRpb25UcmFjay5nZXQocGF0aE5hbWUpPy5hbmltYXRlZFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHN0YXJ0IGlucHV0IHRpbWUgdmFsdWUgZm9yIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIHRyYWNrLlxuICAgKiBAcGFyYW0gYW5pbWF0aW9uVHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFja1xuICAgKiBAcmV0dXJucyBUaGUgbWluaW11bSBzdGFydCBpbnB1dCB0aW1lIHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0U3RhcnRJbnB1dFZhbHVlT2ZBbmltYXRpb24oYW5pbWF0aW9uVHJhY2tOYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IGFuaW1hdGlvbkdsb2JhbEluZm8gPSBBbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyh0aGlzLl9fZW5naW5lKTtcbiAgICByZXR1cm4gYW5pbWF0aW9uR2xvYmFsSW5mby5nZXQoYW5pbWF0aW9uVHJhY2tOYW1lKSEubWluU3RhcnRJbnB1dFRpbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW5kIGlucHV0IHRpbWUgdmFsdWUgZm9yIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIHRyYWNrLlxuICAgKiBAcGFyYW0gYW5pbWF0aW9uVHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFja1xuICAgKiBAcmV0dXJucyBUaGUgbWF4aW11bSBlbmQgaW5wdXQgdGltZSB2YWx1ZVxuICAgKi9cbiAgcHVibGljIGdldEVuZElucHV0VmFsdWVPZkFuaW1hdGlvbihhbmltYXRpb25UcmFja05hbWU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IEFuaW1hdGlvbkNvbXBvbmVudC5nZXRBbmltYXRpb25HbG9iYWxJbmZvKHRoaXMuX19lbmdpbmUpO1xuICAgIHJldHVybiBhbmltYXRpb25HbG9iYWxJbmZvLmdldChhbmltYXRpb25UcmFja05hbWUpIS5tYXhFbmRJbnB1dFRpbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhbGwgYXZhaWxhYmxlIGFuaW1hdGlvbiB0cmFjayBuYW1lcy5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBhbmltYXRpb24gbGlzdCBmb3JcbiAgICogQHJldHVybnMgQXJyYXkgb2YgYW5pbWF0aW9uIHRyYWNrIG5hbWVzXG4gICAqL1xuICBzdGF0aWMgZ2V0QW5pbWF0aW9uTGlzdChlbmdpbmU6IEVuZ2luZSk6IEFuaW1hdGlvblRyYWNrTmFtZVtdIHtcbiAgICBjb25zdCBhbmltYXRpb25HbG9iYWxJbmZvID0gdGhpcy5nZXRBbmltYXRpb25HbG9iYWxJbmZvKGVuZ2luZSk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oYW5pbWF0aW9uR2xvYmFsSW5mby5rZXlzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFuaW1hdGlvbiBpbmZvcm1hdGlvbiBmb3IgYWxsIHRyYWNrcy5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBhbmltYXRpb24gaW5mbyBmb3JcbiAgICogQHJldHVybnMgQSBtYXAgY29udGFpbmluZyBhbmltYXRpb24gdHJhY2sgbmFtZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgaW5mb3JtYXRpb25cbiAgICovXG4gIHN0YXRpYyBnZXRBbmltYXRpb25JbmZvKGVuZ2luZTogRW5naW5lKTogTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uSW5mbz4ge1xuICAgIHJldHVybiBuZXcgTWFwKHRoaXMuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyhlbmdpbmUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBhbmltYXRpb24gdHJhY2sgbmFtZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBhbmltYXRpb24gdHJhY2sgbmFtZXNcbiAgICovXG4gIHB1YmxpYyBnZXRBbmltYXRpb25UcmFja05hbWVzKCk6IEFuaW1hdGlvblRyYWNrTmFtZVtdIHtcbiAgICBjb25zdCB0cmFja05hbWVzID0gW107XG4gICAgZm9yIChjb25zdCBbLCBjaGFubmVsXSBvZiB0aGlzLl9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgIHRyYWNrTmFtZXMucHVzaCguLi5jaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRyYWNrTmFtZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYW5pbWF0aW9uIGNoYW5uZWxzIG9mIHRoZSBhbmltYXRpb24gdHJhY2suXG4gICAqIEByZXR1cm5zIFRoZSBjaGFubmVsIG1hcHMgb2YgdGhlIGFuaW1hdGlvbiB0cmFja1xuICAgKi9cbiAgcHVibGljIGdldEFuaW1hdGlvbkNoYW5uZWxzT2ZUcmFjaygpOiBBbmltYXRpb25UcmFjayB7XG4gICAgcmV0dXJuIHRoaXMuX19hbmltYXRpb25UcmFjaztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgY3VycmVudGx5IGFuaW1hdGluZy5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbmltYXRpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzQW5pbWF0aW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9faXNBbmltYXRpbmc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ2xvYmFsIHN0YXJ0IGlucHV0IHZhbHVlIGZvciBhbGwgYW5pbWF0aW9uIGNvbXBvbmVudHMuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGdldCB0aGUgc3RhcnQgaW5wdXQgdmFsdWUgZm9yXG4gICAqIEByZXR1cm5zIFRoZSBzdGFydCBpbnB1dCB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGdldFN0YXJ0SW5wdXRWYWx1ZShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoQW5pbWF0aW9uQ29tcG9uZW50KSBhcyBBbmltYXRpb25Db21wb25lbnRbXTtcbiAgICBpZiAoY29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb25HbG9iYWxJbmZvID0gdGhpcy5nZXRBbmltYXRpb25HbG9iYWxJbmZvKGVuZ2luZSk7XG4gICAgY29uc3QgaW5mb0FycmF5ID0gQXJyYXkuZnJvbShhbmltYXRpb25HbG9iYWxJbmZvLnZhbHVlcygpKTtcbiAgICBpZiAoaW5mb0FycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGxhc3RJbmZvID0gaW5mb0FycmF5W2luZm9BcnJheS5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gbGFzdEluZm8ubWluU3RhcnRJbnB1dFRpbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ2xvYmFsIGVuZCBpbnB1dCB2YWx1ZSBmb3IgYWxsIGFuaW1hdGlvbiBjb21wb25lbnRzLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIGVuZCBpbnB1dCB2YWx1ZSBmb3JcbiAgICogQHJldHVybnMgVGhlIGVuZCBpbnB1dCB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGdldEVuZElucHV0VmFsdWUoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKEFuaW1hdGlvbkNvbXBvbmVudCkgYXMgQW5pbWF0aW9uQ29tcG9uZW50W107XG4gICAgaWYgKGNvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uR2xvYmFsSW5mbyA9IHRoaXMuZ2V0QW5pbWF0aW9uR2xvYmFsSW5mbyhlbmdpbmUpO1xuICAgIGNvbnN0IGluZm9BcnJheSA9IEFycmF5LmZyb20oYW5pbWF0aW9uR2xvYmFsSW5mby52YWx1ZXMoKSk7XG4gICAgaWYgKGluZm9BcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjb25zdCBsYXN0SW5mbyA9IGluZm9BcnJheVtpbmZvQXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGxhc3RJbmZvLm1heEVuZElucHV0VGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBBbmltYXRpb25Db21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5BbmltYXRpb25Db21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5BbmltYXRpb25Db21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW50aXR5IHRoYXQgb3ducyB0aGlzIGFuaW1hdGlvbiBjb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgd2hpY2ggaGFzIHRoaXMgY29tcG9uZW50XG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElBbmltYXRpb25FbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuZ2V0RW50aXR5KHRoaXMuX19lbnRpdHlVaWQpIGFzIHVua25vd24gYXMgSUFuaW1hdGlvbkVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoaXMgYW5pbWF0aW9uIGNvbXBvbmVudCB0byBhbiBlbnRpdHksIGV4dGVuZGluZyB0aGUgZW50aXR5IHdpdGggYW5pbWF0aW9uIG1ldGhvZHMuXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHkgdG8gYWRkIHRoaXMgY29tcG9uZW50IHRvXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIGFkZFxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IGV4dGVuZGVkIHdpdGggYW5pbWF0aW9uIGNvbXBvbmVudCBtZXRob2RzXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgQW5pbWF0aW9uRW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICBnZXRBbmltYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQW5pbWF0aW9uQ29tcG9uZW50VElEKSBhcyBBbmltYXRpb25Db21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIEFuaW1hdGlvbkVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGtleWZyYW1lIHRvIHRoZSBzcGVjaWZpZWQgYW5pbWF0aW9uIHRyYWNrIGF0IHRoZSBnaXZlbiBmcmFtZS5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoXG4gICAqIEBwYXJhbSBmcmFtZVRvSW5zZXJ0IC0gVGhlIGZyYW1lIG51bWJlciB3aGVyZSB0byBpbnNlcnQgdGhlIGtleWZyYW1lXG4gICAqIEBwYXJhbSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQgcmF0ZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBrZXlmcmFtZSB3YXMgc3VjY2Vzc2Z1bGx5IGFkZGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFkZEtleUZyYW1lKHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lLCBwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWUsIGZyYW1lVG9JbnNlcnQ6IEluZGV4LCBmcHM6IG51bWJlcikge1xuICAgIGNvbnN0IHNlY0JlZ2luID0gZnJhbWVUb0luc2VydCAvIGZwcztcbiAgICBjb25zdCBpbnB1dCA9IHNlY0JlZ2luO1xuICAgIGNvbnN0IHNlY0VuZCA9IChmcmFtZVRvSW5zZXJ0ICsgMSkgLyBmcHM7XG5cbiAgICBjb25zdCBjaGFubmVsID0gdGhpcy5fX2FuaW1hdGlvblRyYWNrLmdldChwYXRoTmFtZSk7XG4gICAgaWYgKElzLm5vdC5leGlzdChjaGFubmVsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGFuaW1hdGVkVmFsdWUgPSBjaGFubmVsLmFuaW1hdGVkVmFsdWU7XG4gICAgLy8gVGhlIHNhbXBsZXIgYXJyYXlzIGFyZSByZXdyaXR0ZW4gYmVsb3c7IGRyb3AgYW55IG1lbW9pemVkIGludGVycG9sYXRpb24gcmVzdWx0LlxuICAgIGFuaW1hdGVkVmFsdWUuaW52YWxpZGF0ZUFuaW1hdGlvbkNhY2hlPy4oKTtcblxuICAgIGNvbnN0IGkgPSBBbmltYXRpb25BdHRyaWJ1dGUuZnJvbVN0cmluZyhwYXRoTmFtZSkuaW5kZXg7XG4gICAgY29uc3QgZ2xvYmFsVGltZSA9IEFuaW1hdGlvbkNvbXBvbmVudC5nZXRHbG9iYWxUaW1lKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IG91dHB1dCA9IF9faW50ZXJwb2xhdGUoYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSksIGdsb2JhbFRpbWUsIGkpO1xuXG4gICAgaWYgKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgaW5wdXRBcnJheS5wdXNoKGlucHV0KTtcbiAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgb3V0cHV0QXJyYXkucHVzaCguLi5vdXRwdXQpO1xuICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IGV4aXN0ZWRJbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0WzBdO1xuICAgICAgaWYgKHNlY0VuZCA8IGV4aXN0ZWRJbnB1dCkge1xuICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgIGlucHV0QXJyYXkudW5zaGlmdChpbnB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgIG91dHB1dEFycmF5LnVuc2hpZnQoLi4ub3V0cHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgICB9IGVsc2UgaWYgKGV4aXN0ZWRJbnB1dCA8IHNlY0JlZ2luKSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgICAgaW5wdXRBcnJheS5wdXNoKGlucHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgb3V0cHV0QXJyYXkucHVzaCguLi5vdXRwdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHNlY0JlZ2luIDw9IGV4aXN0ZWRJbnB1dCA8PSBzZWNFbmRcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICBpbnB1dEFycmF5LnNwbGljZSgwLCAwLCBpbnB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICAgIG91dHB1dEFycmF5LnNwbGljZSgwLCAwLCAuLi5vdXRwdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2hhbm5lbC5zYW1wbGVyLmlucHV0Lmxlbmd0aCA+PSAyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0ZWRJbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0W2ldO1xuICAgICAgICBpZiAoc2VjQmVnaW4gPD0gZXhpc3RlZElucHV0KSB7XG4gICAgICAgICAgaWYgKHNlY0JlZ2luIDw9IGV4aXN0ZWRJbnB1dCAmJiBleGlzdGVkSW5wdXQgPD0gc2VjRW5kKSB7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFtpXSA9IGlucHV0O1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROOyBqKyspIHtcbiAgICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0W1xuICAgICAgICAgICAgICAgIGkgKiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROICsgalxuICAgICAgICAgICAgICBdID0gb3V0cHV0W2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgICAgICBpbnB1dEFycmF5LnNwbGljZShpLCAwLCBpbnB1dCk7XG4gICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgICAgIG91dHB1dEFycmF5LnNwbGljZShpICogYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0Q29tcG9uZW50TiwgMCwgLi4ub3V0cHV0KTtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBrZXlmcmFtZSB3aXRoIGEgc3BlY2lmaWMgdmFsdWUgdG8gdGhlIHNwZWNpZmllZCBhbmltYXRpb24gdHJhY2sgYXQgdGhlIGdpdmVuIGZyYW1lLlxuICAgKiBAcGFyYW0gdHJhY2tOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiB0cmFja1xuICAgKiBAcGFyYW0gcGF0aE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uIHBhdGhcbiAgICogQHBhcmFtIGZyYW1lVG9JbnNlcnQgLSBUaGUgZnJhbWUgbnVtYmVyIHdoZXJlIHRvIGluc2VydCB0aGUga2V5ZnJhbWVcbiAgICogQHBhcmFtIG91dHB1dCAtIFRoZSBhcnJheSBvZiBvdXRwdXQgdmFsdWVzIGZvciB0aGUga2V5ZnJhbWVcbiAgICogQHBhcmFtIGZwcyAtIFRoZSBmcmFtZXMgcGVyIHNlY29uZCByYXRlXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGtleWZyYW1lIHdhcyBzdWNjZXNzZnVsbHkgYWRkZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYWRkS2V5RnJhbWVXaXRoVmFsdWUoXG4gICAgdHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUsXG4gICAgcGF0aE5hbWU6IEFuaW1hdGlvblBhdGhOYW1lLFxuICAgIGZyYW1lVG9JbnNlcnQ6IEluZGV4LFxuICAgIG91dHB1dDogQXJyYXk8bnVtYmVyPixcbiAgICBmcHM6IG51bWJlclxuICApIHtcbiAgICBjb25zdCBzZWNCZWdpbiA9IGZyYW1lVG9JbnNlcnQgLyBmcHM7XG4gICAgY29uc3QgaW5wdXQgPSBzZWNCZWdpbjtcbiAgICBjb25zdCBzZWNFbmQgPSAoZnJhbWVUb0luc2VydCArIDEpIC8gZnBzO1xuXG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMuX19hbmltYXRpb25UcmFjay5nZXQocGF0aE5hbWUpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoY2hhbm5lbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgIC8vIFRoZSBzYW1wbGVyIGFycmF5cyBhcmUgcmV3cml0dGVuIGJlbG93OyBkcm9wIGFueSBtZW1vaXplZCBpbnRlcnBvbGF0aW9uIHJlc3VsdC5cbiAgICBhbmltYXRlZFZhbHVlLmludmFsaWRhdGVBbmltYXRpb25DYWNoZT8uKCk7XG5cbiAgICBpZiAoYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICBpbnB1dEFycmF5LnB1c2goaW5wdXQpO1xuICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgY29uc3Qgb3V0cHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCk7XG4gICAgICBvdXRwdXRBcnJheS5wdXNoKC4uLm91dHB1dCk7XG4gICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29uc3QgZXhpc3RlZElucHV0ID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXRbMF07XG4gICAgICBpZiAoc2VjRW5kIDwgZXhpc3RlZElucHV0KSB7XG4gICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgICAgaW5wdXRBcnJheS51bnNoaWZ0KGlucHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgb3V0cHV0QXJyYXkudW5zaGlmdCguLi5vdXRwdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQgPSBuZXcgRmxvYXQzMkFycmF5KG91dHB1dEFycmF5KTtcbiAgICAgIH0gZWxzZSBpZiAoZXhpc3RlZElucHV0IDwgc2VjQmVnaW4pIHtcbiAgICAgICAgY29uc3QgaW5wdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQpO1xuICAgICAgICBpbnB1dEFycmF5LnB1c2goaW5wdXQpO1xuICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXRBcnJheSk7XG4gICAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgICBvdXRwdXRBcnJheS5wdXNoKC4uLm91dHB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc2VjQmVnaW4gPD0gZXhpc3RlZElucHV0IDw9IHNlY0VuZFxuICAgICAgICBjb25zdCBpbnB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgIGlucHV0QXJyYXkuc3BsaWNlKDAsIDAsIGlucHV0KTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0QXJyYXkpO1xuICAgICAgICBjb25zdCBvdXRwdXRBcnJheSA9IEFycmF5LmZyb20oYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0KTtcbiAgICAgICAgb3V0cHV0QXJyYXkuc3BsaWNlKDAsIDAsIC4uLm91dHB1dCk7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkob3V0cHV0QXJyYXkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjaGFubmVsLnNhbXBsZXIuaW5wdXQubGVuZ3RoID49IDJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXhpc3RlZElucHV0ID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXRbaV07XG4gICAgICAgIGlmIChzZWNCZWdpbiA8PSBleGlzdGVkSW5wdXQpIHtcbiAgICAgICAgICBpZiAoc2VjQmVnaW4gPD0gZXhpc3RlZElucHV0ICYmIGV4aXN0ZWRJbnB1dCA8PSBzZWNFbmQpIHtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0W2ldID0gaW5wdXQ7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dENvbXBvbmVudE47IGorKykge1xuICAgICAgICAgICAgICBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRbXG4gICAgICAgICAgICAgICAgaSAqIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dENvbXBvbmVudE4gKyBqXG4gICAgICAgICAgICAgIF0gPSBvdXRwdXRbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBBcnJheS5mcm9tKGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0KTtcbiAgICAgICAgICAgIGlucHV0QXJyYXkuc3BsaWNlKGksIDAsIGlucHV0KTtcbiAgICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0ID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dEFycmF5KTtcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dEFycmF5ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgICAgICAgb3V0cHV0QXJyYXkuc3BsaWNlKGkgKiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROLCAwLCAuLi5vdXRwdXQpO1xuICAgICAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXRBcnJheSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBrZXlmcmFtZXMgYXQgdGhlIHNwZWNpZmllZCBmcmFtZSBmb3IgdGhlIGdpdmVuIGFuaW1hdGlvbiB0cmFjayBhbmQgcGF0aC5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoXG4gICAqIEBwYXJhbSBmcmFtZVRvRGVsZXRlIC0gVGhlIGZyYW1lIG51bWJlciB3aGVyZSB0byBkZWxldGUga2V5ZnJhbWVzXG4gICAqIEBwYXJhbSBmcHMgLSBUaGUgZnJhbWVzIHBlciBzZWNvbmQgcmF0ZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGtleWZyYW1lcyB3ZXJlIHN1Y2Nlc3NmdWxseSBkZWxldGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGRlbGV0ZUtleXNBdEZyYW1lKHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lLCBwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWUsIGZyYW1lVG9EZWxldGU6IEluZGV4LCBmcHM6IG51bWJlcikge1xuICAgIGNvbnN0IHNlY0JlZ2luID0gZnJhbWVUb0RlbGV0ZSAvIGZwcztcbiAgICBjb25zdCBzZWNFbmQgPSAoZnJhbWVUb0RlbGV0ZSArIDEpIC8gZnBzO1xuXG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMuX19hbmltYXRpb25UcmFjay5nZXQocGF0aE5hbWUpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoY2hhbm5lbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgIC8vIFRoZSBzYW1wbGVyIGFycmF5cyBhcmUgcmV3cml0dGVuIGJlbG93OyBkcm9wIGFueSBtZW1vaXplZCBpbnRlcnBvbGF0aW9uIHJlc3VsdC5cbiAgICBhbmltYXRlZFZhbHVlLmludmFsaWRhdGVBbmltYXRpb25DYWNoZT8uKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbnB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLmlucHV0W2ldO1xuICAgICAgaWYgKHNlY0JlZ2luIDw9IGlucHV0ICYmIGlucHV0IDwgc2VjRW5kKSB7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dCk7XG4gICAgICAgIGlucHV0LnNwbGljZShpLCAxKTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkuaW5wdXQgPSBuZXcgRmxvYXQzMkFycmF5KGlucHV0KTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gQXJyYXkuZnJvbShhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXQpO1xuICAgICAgICBvdXRwdXQuc3BsaWNlKFxuICAgICAgICAgIGkgKiBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5vdXRwdXRDb21wb25lbnROLFxuICAgICAgICAgIGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dENvbXBvbmVudE5cbiAgICAgICAgKTtcbiAgICAgICAgYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSkub3V0cHV0ID0gbmV3IEZsb2F0MzJBcnJheShvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBrZXlmcmFtZXMgZXhpc3QgYXQgdGhlIHNwZWNpZmllZCBmcmFtZSBmb3IgdGhlIGdpdmVuIGFuaW1hdGlvbiB0cmFjayBhbmQgcGF0aC5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBhbmltYXRpb24gdHJhY2tcbiAgICogQHBhcmFtIHBhdGhOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFuaW1hdGlvbiBwYXRoXG4gICAqIEBwYXJhbSBmcmFtZSAtIFRoZSBmcmFtZSBudW1iZXIgdG8gY2hlY2tcbiAgICogQHBhcmFtIGZwcyAtIFRoZSBmcmFtZXMgcGVyIHNlY29uZCByYXRlXG4gICAqIEByZXR1cm5zIFRydWUgaWYga2V5ZnJhbWVzIGV4aXN0IGF0IHRoZSBmcmFtZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBoYXNLZXlGcmFtZXNBdEZyYW1lKHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lLCBwYXRoTmFtZTogQW5pbWF0aW9uUGF0aE5hbWUsIGZyYW1lOiBJbmRleCwgZnBzOiBudW1iZXIpIHtcbiAgICBjb25zdCBzZWNCZWdpbiA9IGZyYW1lIC8gZnBzO1xuICAgIGNvbnN0IHNlY0VuZCA9IChmcmFtZSArIDEpIC8gZnBzO1xuXG4gICAgY29uc3QgY2hhbm5lbCA9IHRoaXMuX19hbmltYXRpb25UcmFjay5nZXQocGF0aE5hbWUpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoY2hhbm5lbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5wdXQgPSBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dFtpXTtcbiAgICAgIGlmIChzZWNCZWdpbiA8PSBpbnB1dCAmJiBpbnB1dCA8IHNlY0VuZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYW5pbWF0aW9uIGdsb2JhbCBpbmZvIG1hcCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqIENyZWF0ZXMgYSBuZXcgbWFwIGlmIG9uZSBkb2Vzbid0IGV4aXN0IGZvciB0aGUgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIGFuaW1hdGlvbiBpbmZvIGZvclxuICAgKiBAcmV0dXJucyBUaGUgYW5pbWF0aW9uIGdsb2JhbCBpbmZvIG1hcCBmb3IgdGhlIGVuZ2luZVxuICAgKi9cbiAgc3RhdGljIGdldEFuaW1hdGlvbkdsb2JhbEluZm8oZW5naW5lOiBFbmdpbmUpOiBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25JbmZvPiB7XG4gICAgbGV0IGluZm9NYXAgPSB0aGlzLl9fYW5pbWF0aW9uR2xvYmFsSW5mb01hcC5nZXQoZW5naW5lKTtcbiAgICBpZiAoaW5mb01hcCA9PSBudWxsKSB7XG4gICAgICBpbmZvTWFwID0gbmV3IE1hcCgpO1xuICAgICAgdGhpcy5fX2FuaW1hdGlvbkdsb2JhbEluZm9NYXAuc2V0KGVuZ2luZSwgaW5mb01hcCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvTWFwO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZWNhbGN1bGF0ZUFuaW1hdGlvbkluZm8oZW5naW5lOiBFbmdpbmUsIHRyYWNrTmFtZTogQW5pbWF0aW9uVHJhY2tOYW1lKSB7XG4gICAgbGV0IG1pblN0YXJ0SW5wdXRUaW1lID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGxldCBtYXhFbmRJbnB1dFRpbWUgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShBbmltYXRpb25Db21wb25lbnQpIGFzIEFuaW1hdGlvbkNvbXBvbmVudFtdO1xuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGNvbXBvbmVudHMpIHtcbiAgICAgIGZvciAoY29uc3QgWywgY2hhbm5lbF0gb2YgY29tcG9uZW50Ll9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgICAgaWYgKCFjaGFubmVsLmFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpLmluY2x1ZGVzKHRyYWNrTmFtZSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzYW1wbGVyID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKTtcbiAgICAgICAgaWYgKHNhbXBsZXIuaW5wdXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbWluU3RhcnRJbnB1dFRpbWUgPSBNYXRoLm1pbihtaW5TdGFydElucHV0VGltZSwgc2FtcGxlci5pbnB1dFswXSk7XG4gICAgICAgIG1heEVuZElucHV0VGltZSA9IE1hdGgubWF4KG1heEVuZElucHV0VGltZSwgc2FtcGxlci5pbnB1dFtzYW1wbGVyLmlucHV0Lmxlbmd0aCAtIDFdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRpb25HbG9iYWxJbmZvID0gQW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvbkdsb2JhbEluZm8oZW5naW5lKTtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKG1pblN0YXJ0SW5wdXRUaW1lKSAmJiBOdW1iZXIuaXNGaW5pdGUobWF4RW5kSW5wdXRUaW1lKSkge1xuICAgICAgYW5pbWF0aW9uR2xvYmFsSW5mby5zZXQodHJhY2tOYW1lLCB7XG4gICAgICAgIG5hbWU6IHRyYWNrTmFtZSxcbiAgICAgICAgbWluU3RhcnRJbnB1dFRpbWUsXG4gICAgICAgIG1heEVuZElucHV0VGltZSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhbmltYXRpb25HbG9iYWxJbmZvLmRlbGV0ZSh0cmFja05hbWUpO1xuICAgIH1cbiAgICBBbmltYXRpb25Db21wb25lbnQuX19wdWJzdWIucHVibGlzaEFzeW5jKEFuaW1hdGlvbkNvbXBvbmVudC5FdmVudC5DaGFuZ2VBbmltYXRpb25JbmZvLCB7XG4gICAgICBpbmZvTWFwOiBuZXcgTWFwKGFuaW1hdGlvbkdsb2JhbEluZm8pLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFuaW1hdGlvbiBzdGF0ZSBmb3IgdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIHNldCB0aGUgYW5pbWF0aW9uIHN0YXRlIGZvclxuICAgKiBAcGFyYW0gZmxhZyAtIFRydWUgdG8gZW5hYmxlIGFuaW1hdGlvbiwgZmFsc2UgdG8gZGlzYWJsZVxuICAgKi9cbiAgc3RhdGljIHNldElzQW5pbWF0aW5nKGVuZ2luZTogRW5naW5lLCBmbGFnOiBib29sZWFuKSB7XG4gICAgQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LnNldElzQW5pbWF0aW5nKGVuZ2luZSwgZmxhZyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYW5pbWF0aW9uIHN0YXRlIGZvciB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gZ2V0IHRoZSBhbmltYXRpb24gc3RhdGUgZm9yXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYW5pbWF0aW9uIGlzIGVuYWJsZWQgZm9yIHRoZSBlbmdpbmUsIGRlZmF1bHRzIHRvIHRydWUgaWYgbm90IHNldFxuICAgKi9cbiAgc3RhdGljIGdldElzQW5pbWF0aW5nKGVuZ2luZTogRW5naW5lKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5nZXRJc0FuaW1hdGluZyhlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGdsb2JhbCBhbmltYXRpb24gdGltZSBmb3IgdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIHNldCB0aGUgZ2xvYmFsIHRpbWUgZm9yXG4gICAqIEBwYXJhbSB0aW1lIC0gVGhlIGdsb2JhbCBhbmltYXRpb24gdGltZSBpbiBzZWNvbmRzXG4gICAqL1xuICBzdGF0aWMgc2V0R2xvYmFsVGltZShlbmdpbmU6IEVuZ2luZSwgdGltZTogbnVtYmVyKSB7XG4gICAgQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LnNldEdsb2JhbFRpbWUoZW5naW5lLCB0aW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnbG9iYWwgYW5pbWF0aW9uIHRpbWUgZm9yIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBnZXQgdGhlIGdsb2JhbCB0aW1lIGZvclxuICAgKiBAcmV0dXJucyBUaGUgZ2xvYmFsIGFuaW1hdGlvbiB0aW1lIGZvciB0aGUgZW5naW5lLCBkZWZhdWx0cyB0byAwIGlmIG5vdCBzZXRcbiAgICovXG4gIHN0YXRpYyBnZXRHbG9iYWxUaW1lKGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICByZXR1cm4gQW5pbWF0aW9uU3RhdGVSZXBvc2l0b3J5LmdldEdsb2JhbFRpbWUoZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHNoYWxsb3cgY29weSBvZiBhbm90aGVyIGFuaW1hdGlvbiBjb21wb25lbnQncyBkYXRhIGludG8gdGhpcyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjb21wb25lbnRfIC0gVGhlIHNvdXJjZSBhbmltYXRpb24gY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIF9zaGFsbG93Q29weUZyb20oY29tcG9uZW50XzogQ29tcG9uZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50XyBhcyBBbmltYXRpb25Db21wb25lbnQ7XG5cbiAgICB0aGlzLl9fYW5pbWF0aW9uVHJhY2sgPSBuZXcgTWFwKGNvbXBvbmVudC5fX2FuaW1hdGlvblRyYWNrKTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzID0gbmV3IE1hcChjb21wb25lbnQuX19hbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMpO1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5tYXJrQW5pbWF0aW9uQmluZGluZ0NoYW5nZWQoKTtcbiAgICB0aGlzLl9faXNFZmZla3NlZXJTdGF0ZSA9IGNvbXBvbmVudC5fX2lzRWZmZWtzZWVyU3RhdGU7XG4gICAgdGhpcy5fX2lzQW5pbWF0aW5nID0gY29tcG9uZW50Ll9faXNBbmltYXRpbmc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB1cCBhbmltYXRpb24gcmV0YXJnZXRpbmcgZnJvbSBhIHNvdXJjZSBlbnRpdHkgdG8gdGhpcyBlbnRpdHkuXG4gICAqIEBwYXJhbSByZXRhcmdldCAtIFRoZSByZXRhcmdldGluZyBpbnRlcmZhY2UgdGhhdCBkZWZpbmVzIGhvdyB0byBtYXAgYW5pbWF0aW9uc1xuICAgKiBAcGFyYW0gcG9zdGZpeFRvVHJhY2tOYW1lIC0gT3B0aW9uYWwgcG9zdGZpeCB0byBhcHBlbmQgdG8gdHJhY2sgbmFtZXNcbiAgICogQHBhcmFtIGV4Y2x1ZGVkUGF0aE5hbWVzIC0gQW5pbWF0aW9uIHBhdGhzIHRvIG9taXQgd2hpbGUgY29weWluZyBzb3VyY2UgdHJhY2tzXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGNyZWF0ZWQgdHJhY2sgbmFtZXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRSZXRhcmdldChcbiAgICByZXRhcmdldDogSUFuaW1hdGlvblJldGFyZ2V0LFxuICAgIHBvc3RmaXhUb1RyYWNrTmFtZT86IHN0cmluZyxcbiAgICBleGNsdWRlZFBhdGhOYW1lczogcmVhZG9ubHkgQW5pbWF0aW9uUGF0aE5hbWVbXSA9IFtdXG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBzcmNFbnRpdHkgPSByZXRhcmdldC5nZXRFbnRpdHkoKTtcbiAgICBjb25zdCBzcmNBbmltID0gc3JjRW50aXR5LnRyeVRvR2V0QW5pbWF0aW9uKCk7XG4gICAgY29uc3QgZHN0RW50aXR5ID0gdGhpcy5lbnRpdHk7XG4gICAgdGhpcy5lbnRpdHkuZ2V0VHJhbnNmb3JtKCkuX2JhY2t1cFRyYW5zZm9ybUFzUmVzdCgpO1xuICAgIGlmIChJcy5ub3QuZXhpc3Qoc3JjQW5pbSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgc3JjQW5pbS51c2VHbG9iYWxUaW1lID0gZmFsc2U7XG4gICAgY29uc3QgdHJhY2tOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtwYXRoTmFtZSwgY2hhbm5lbF0gb2Ygc3JjQW5pbS5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICBpZiAoZXhjbHVkZWRQYXRoTmFtZXMuaW5jbHVkZXMoY2hhbm5lbC50YXJnZXQucGF0aE5hbWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZTtcbiAgICAgIGZvciAoY29uc3QgX3RyYWNrTmFtZSBvZiBhbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKSkge1xuICAgICAgICBjb25zdCB0cmFja05hbWUgPSBfdHJhY2tOYW1lICsgKHBvc3RmaXhUb1RyYWNrTmFtZSA/PyAnJyk7XG4gICAgICAgIHRyYWNrTmFtZXMucHVzaCh0cmFja05hbWUpO1xuXG4gICAgICAgIGNvbnN0IGlucHV0ID0gYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKF90cmFja05hbWUpLmlucHV0O1xuICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aE5hbWUgPT09ICd0cmFuc2xhdGUnKSB7XG4gICAgICAgICAgY29uc3Qgb3V0cHV0cyA9IHJldGFyZ2V0VHJhbnNsYXRlKGlucHV0LCBzcmNBbmltKTtcbiAgICAgICAgICBjb25zdCBzYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICAgIHNhbXBsZXJzLnNldCh0cmFja05hbWUsIHtcbiAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRzLFxuICAgICAgICAgICAgb3V0cHV0Q29tcG9uZW50TjogMyxcbiAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcihfdHJhY2tOYW1lKS5pbnRlcnBvbGF0aW9uTWV0aG9kLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKHNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKHBhdGhOYW1lIGFzIEFuaW1hdGlvblBhdGhOYW1lLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbm5lbC50YXJnZXQucGF0aE5hbWUgPT09ICdxdWF0ZXJuaW9uJykge1xuICAgICAgICAgIGNvbnN0IG91dHB1dHMgPSByZXRhcmdldFF1YXRlcm5pb24oaW5wdXQsIHNyY0FuaW0pO1xuICAgICAgICAgIGNvbnN0IHNhbXBsZXJzID0gbmV3IE1hcDxBbmltYXRpb25UcmFja05hbWUsIEFuaW1hdGlvblNhbXBsZXI+KCk7XG4gICAgICAgICAgc2FtcGxlcnMuc2V0KHRyYWNrTmFtZSwge1xuICAgICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgICBvdXRwdXQ6IG91dHB1dHMsXG4gICAgICAgICAgICBvdXRwdXRDb21wb25lbnROOiA0LFxuICAgICAgICAgICAgaW50ZXJwb2xhdGlvbk1ldGhvZDogYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKF90cmFja05hbWUpLmludGVycG9sYXRpb25NZXRob2QsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3QgbmV3QW5pbWF0ZWRWYWx1ZSA9IG5ldyBBbmltYXRlZFF1YXRlcm5pb24oc2FtcGxlcnMsIHRyYWNrTmFtZSk7XG4gICAgICAgICAgdGhpcy5zZXRBbmltYXRpb24ocGF0aE5hbWUgYXMgQW5pbWF0aW9uUGF0aE5hbWUsIG5ld0FuaW1hdGVkVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFubmVsLnRhcmdldC5wYXRoTmFtZSA9PT0gJ3NjYWxlJykge1xuICAgICAgICAgIGNvbnN0IG91dHB1dHMgPSByZXRhcmdldFNjYWxlKGlucHV0LCBzcmNBbmltKTtcbiAgICAgICAgICBjb25zdCBzYW1wbGVycyA9IG5ldyBNYXA8QW5pbWF0aW9uVHJhY2tOYW1lLCBBbmltYXRpb25TYW1wbGVyPigpO1xuICAgICAgICAgIHNhbXBsZXJzLnNldCh0cmFja05hbWUsIHtcbiAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRzLFxuICAgICAgICAgICAgb3V0cHV0Q29tcG9uZW50TjogMyxcbiAgICAgICAgICAgIGludGVycG9sYXRpb25NZXRob2Q6IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcihfdHJhY2tOYW1lKS5pbnRlcnBvbGF0aW9uTWV0aG9kLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IG5ld0FuaW1hdGVkVmFsdWUgPSBuZXcgQW5pbWF0ZWRWZWN0b3IzKHNhbXBsZXJzLCB0cmFja05hbWUpO1xuICAgICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uKHBhdGhOYW1lIGFzIEFuaW1hdGlvblBhdGhOYW1lLCBuZXdBbmltYXRlZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJldGFyZ2V0VHJhbnNsYXRlKGlucHV0OiBGbG9hdDMyQXJyYXksIHNyY0FuaW06IEFuaW1hdGlvbkNvbXBvbmVudCkge1xuICAgICAgY29uc3Qgb3V0cHV0c1RyYW5zbGF0aW9uID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dC5sZW5ndGggKiAzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3JjQW5pbS50aW1lID0gaW5wdXRbaV07XG4gICAgICAgIChzcmNBbmltIGFzIGFueSkuX19hcHBseUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBvdXRwdXRUcmFuc2xhdGlvbiA9IHJldGFyZ2V0LnJldGFyZ2V0VHJhbnNsYXRlKGRzdEVudGl0eSk7XG4gICAgICAgIG91dHB1dHNUcmFuc2xhdGlvbltpICogMyArIDBdID0gb3V0cHV0VHJhbnNsYXRpb24ueDtcbiAgICAgICAgb3V0cHV0c1RyYW5zbGF0aW9uW2kgKiAzICsgMV0gPSBvdXRwdXRUcmFuc2xhdGlvbi55O1xuICAgICAgICBvdXRwdXRzVHJhbnNsYXRpb25baSAqIDMgKyAyXSA9IG91dHB1dFRyYW5zbGF0aW9uLno7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0c1RyYW5zbGF0aW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJldGFyZ2V0UXVhdGVybmlvbihpbnB1dDogRmxvYXQzMkFycmF5LCBzcmNBbmltOiBBbmltYXRpb25Db21wb25lbnQpIHtcbiAgICAgIGNvbnN0IG91dHB1dHNRdWF0ZXJuaW9uID0gbmV3IEZsb2F0MzJBcnJheShpbnB1dC5sZW5ndGggKiA0KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3JjQW5pbS50aW1lID0gaW5wdXRbaV07XG4gICAgICAgIChzcmNBbmltIGFzIGFueSkuX19hcHBseUFuaW1hdGlvbigpO1xuICAgICAgICBjb25zdCBvdXRwdXRRdWF0ZXJuaW9uID0gcmV0YXJnZXQucmV0YXJnZXRRdWF0ZXJuaW9uKGRzdEVudGl0eSk7XG4gICAgICAgIG91dHB1dHNRdWF0ZXJuaW9uW2kgKiA0ICsgMF0gPSBvdXRwdXRRdWF0ZXJuaW9uLng7XG4gICAgICAgIG91dHB1dHNRdWF0ZXJuaW9uW2kgKiA0ICsgMV0gPSBvdXRwdXRRdWF0ZXJuaW9uLnk7XG4gICAgICAgIG91dHB1dHNRdWF0ZXJuaW9uW2kgKiA0ICsgMl0gPSBvdXRwdXRRdWF0ZXJuaW9uLno7XG4gICAgICAgIG91dHB1dHNRdWF0ZXJuaW9uW2kgKiA0ICsgM10gPSBvdXRwdXRRdWF0ZXJuaW9uLnc7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0c1F1YXRlcm5pb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmV0YXJnZXRTY2FsZShpbnB1dDogRmxvYXQzMkFycmF5LCBzcmNBbmltOiBBbmltYXRpb25Db21wb25lbnQpIHtcbiAgICAgIGNvbnN0IG91dHB1dHNTY2FsZSA9IG5ldyBGbG9hdDMyQXJyYXkoaW5wdXQubGVuZ3RoICogMyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNyY0FuaW0udGltZSA9IGlucHV0W2ldO1xuICAgICAgICAoc3JjQW5pbSBhcyBhbnkpLl9fYXBwbHlBbmltYXRpb24oKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0U2NhbGUgPSByZXRhcmdldC5yZXRhcmdldFNjYWxlKGRzdEVudGl0eSk7XG4gICAgICAgIG91dHB1dHNTY2FsZVtpICogMyArIDBdID0gb3V0cHV0U2NhbGUueDtcbiAgICAgICAgb3V0cHV0c1NjYWxlW2kgKiAzICsgMV0gPSBvdXRwdXRTY2FsZS55O1xuICAgICAgICBvdXRwdXRzU2NhbGVbaSAqIDMgKyAyXSA9IG91dHB1dFNjYWxlLno7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0c1NjYWxlO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFja05hbWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyBhbGwgYW5pbWF0aW9uIHRyYWNrcywgY2xlYXJpbmcgYWxsIGFuaW1hdGlvbiBkYXRhIGZyb20gdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICByZXNldEFuaW1hdGlvblRyYWNrcygpIHtcbiAgICBjb25zdCB0cmFja05hbWVzID0gbmV3IFNldCh0aGlzLmdldEFuaW1hdGlvblRyYWNrTmFtZXMoKSk7XG4gICAgdGhpcy5fX2FuaW1hdGlvblRyYWNrLmNsZWFyKCk7XG4gICAgZm9yIChjb25zdCB0cmFja05hbWUgb2YgdHJhY2tOYW1lcykge1xuICAgICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fcmVjYWxjdWxhdGVBbmltYXRpb25JbmZvKHRoaXMuX19lbmdpbmUsIHRyYWNrTmFtZSk7XG4gICAgfVxuICAgIHRoaXMuX191cGRhdGVBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYSBzcGVjaWZpYyBhbmltYXRpb24gdHJhY2sgYnkgcmVtb3ZpbmcgaXRzIGFuaW1hdGlvbiBzYW1wbGVyIGRhdGEuXG4gICAqIEBwYXJhbSB0cmFja05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgYW5pbWF0aW9uIHRyYWNrIHRvIHJlc2V0XG4gICAqL1xuICByZXNldEFuaW1hdGlvblRyYWNrKHRyYWNrTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZW1wdHlQYXRoTmFtZXM6IEFuaW1hdGlvblBhdGhOYW1lW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtwYXRoTmFtZSwgY2hhbm5lbF0gb2YgdGhpcy5fX2FuaW1hdGlvblRyYWNrKSB7XG4gICAgICBjb25zdCBhbmltYXRlZFZhbHVlID0gY2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgICAgY29uc3QgcmViaW5kc0ZpcnN0QWN0aXZlU2FtcGxlciA9IGFuaW1hdGVkVmFsdWUuZ2V0Rmlyc3RBY3RpdmVBbmltYXRpb25TYW1wbGVyVHJhY2tOYW1lKCkgPT09IHRyYWNrTmFtZTtcbiAgICAgIGNvbnN0IHJlYmluZHNTZWNvbmRBY3RpdmVTYW1wbGVyID0gYW5pbWF0ZWRWYWx1ZS5nZXRTZWNvbmRBY3RpdmVBbmltYXRpb25TYW1wbGVyVHJhY2tOYW1lKCkgPT09IHRyYWNrTmFtZTtcbiAgICAgIGFuaW1hdGVkVmFsdWUuZGVsZXRlQW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpO1xuICAgICAgY29uc3QgcmVtYWluaW5nVHJhY2tOYW1lcyA9IGFuaW1hdGVkVmFsdWUuZ2V0QWxsVHJhY2tOYW1lcygpO1xuICAgICAgaWYgKHJlbWFpbmluZ1RyYWNrTmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGVtcHR5UGF0aE5hbWVzLnB1c2gocGF0aE5hbWUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZhbGxiYWNrVHJhY2tOYW1lID0gcmVtYWluaW5nVHJhY2tOYW1lc1swXTtcbiAgICAgIGlmIChyZWJpbmRzRmlyc3RBY3RpdmVTYW1wbGVyKSB7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuc2V0Rmlyc3RBY3RpdmVBbmltYXRpb25UcmFja05hbWUoZmFsbGJhY2tUcmFja05hbWUpO1xuICAgICAgfVxuICAgICAgaWYgKHJlYmluZHNTZWNvbmRBY3RpdmVTYW1wbGVyKSB7XG4gICAgICAgIGFuaW1hdGVkVmFsdWUuc2V0U2Vjb25kQWN0aXZlQW5pbWF0aW9uVHJhY2tOYW1lKGZhbGxiYWNrVHJhY2tOYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBwYXRoTmFtZSBvZiBlbXB0eVBhdGhOYW1lcykge1xuICAgICAgdGhpcy5fX2FuaW1hdGlvblRyYWNrLmRlbGV0ZShwYXRoTmFtZSk7XG4gICAgfVxuICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fX3JlY2FsY3VsYXRlQW5pbWF0aW9uSW5mbyh0aGlzLl9fZW5naW5lLCB0cmFja05hbWUpO1xuICAgIHRoaXMuX191cGRhdGVBbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYWxsIGFuaW1hdGlvbiB0cmFja3MgdGhhdCBoYXZlIG5hbWVzIGVuZGluZyB3aXRoIHRoZSBzcGVjaWZpZWQgcG9zdGZpeC5cbiAgICogQHBhcmFtIHBvc3RmaXggLSBUaGUgcG9zdGZpeCB0byBtYXRjaCBhZ2FpbnN0IHRyYWNrIG5hbWVzXG4gICAqL1xuICByZXNldEFuaW1hdGlvblRyYWNrQnlQb3N0Zml4KHBvc3RmaXg6IHN0cmluZykge1xuICAgIGNvbnN0IHRyYWNrTmFtZXMgPSBuZXcgU2V0KHRoaXMuZ2V0QW5pbWF0aW9uVHJhY2tOYW1lcygpKTtcbiAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiB0cmFja05hbWVzKSB7XG4gICAgICBpZiAodHJhY2tOYW1lLmVuZHNXaXRoKHBvc3RmaXgpKSB7XG4gICAgICAgIHRoaXMucmVzZXRBbmltYXRpb25UcmFjayh0cmFja05hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnRUcmFja0ZlYXR1cmVIYXNoKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19hbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMuZ2V0KHRoaXMuZ2V0QWN0aXZlQW5pbWF0aW9uVHJhY2soKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmVhdHVyZSBoYXNoIGZvciBhIHNwZWNpZmljIGFuaW1hdGlvbiB0cmFjay5cbiAgICogQHBhcmFtIHRyYWNrTmFtZSAtIFRoZSBhbmltYXRpb24gdHJhY2sgd2hvc2UgZmVhdHVyZSBoYXNoIHNob3VsZCBiZSByZXR1cm5lZFxuICAgKiBAcmV0dXJucyBUaGUgZmVhdHVyZSBoYXNoLCBvciB1bmRlZmluZWQgd2hlbiB0aGUgdHJhY2sgaXMgbm90IHJlZ2lzdGVyZWRcbiAgICovXG4gIGdldEFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2godHJhY2tOYW1lOiBBbmltYXRpb25UcmFja05hbWUpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzLmdldCh0cmFja05hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoaXMgY29tcG9uZW50LCBjbGVhbmluZyB1cCByZXNvdXJjZXMgYW5kIGNsZWFyaW5nIGFuaW1hdGlvbiBkYXRhLlxuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIGNvbnN0IHRyYWNrTmFtZXMgPSBuZXcgU2V0KHRoaXMuZ2V0QW5pbWF0aW9uVHJhY2tOYW1lcygpKTtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19hbmltYXRpb25UcmFjay5jbGVhcigpO1xuICAgIHRoaXMuX19hbmltYXRpb25UcmFja0ZlYXR1cmVIYXNoZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9faXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkubWFya0FuaW1hdGlvbkJpbmRpbmdDaGFuZ2VkKCk7XG4gICAgZm9yIChjb25zdCB0cmFja05hbWUgb2YgdHJhY2tOYW1lcykge1xuICAgICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fcmVjYWxjdWxhdGVBbmltYXRpb25JbmZvKHRoaXMuX19lbmdpbmUsIHRyYWNrTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZUFuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2hlcygpIHtcbiAgICBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkubWFya0FuaW1hdGlvbkJpbmRpbmdDaGFuZ2VkKCk7XG4gICAgY29uc3QgZmVhdHVyZU1hcDogTWFwPEFuaW1hdGlvblRyYWNrTmFtZSwgQW5pbWF0aW9uVHJhY2tGZWF0dXJlPiA9IG5ldyBNYXAoKTtcblxuICAgIGZvciAoY29uc3QgW3BhdGhOYW1lLCBjaGFubmVsXSBvZiB0aGlzLl9fYW5pbWF0aW9uVHJhY2spIHtcbiAgICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbGxUcmFja05hbWVzKCkpIHtcbiAgICAgICAgY29uc3Qgc2FtcGxlciA9IGNoYW5uZWwuYW5pbWF0ZWRWYWx1ZS5nZXRBbmltYXRpb25TYW1wbGVyKHRyYWNrTmFtZSk7XG4gICAgICAgIGxldCBmZWF0dXJlID0gZmVhdHVyZU1hcC5nZXQodHJhY2tOYW1lKTtcbiAgICAgICAgaWYgKElzLm5vdC5leGlzdChmZWF0dXJlKSkge1xuICAgICAgICAgIGZlYXR1cmUgPSB7XG4gICAgICAgICAgICB0cmFja05hbWUsXG4gICAgICAgICAgICBwYXRoTmFtZXM6IG5ldyBTZXQ8QW5pbWF0aW9uUGF0aE5hbWU+KCksXG4gICAgICAgICAgICBtaW5TdGFydElucHV0VGltZTogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuICAgICAgICAgICAgbWF4RW5kSW5wdXRUaW1lOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgICAgICB0b3RhbEtleWZyYW1lczogMCxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGZlYXR1cmVNYXAuc2V0KHRyYWNrTmFtZSwgZmVhdHVyZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmZWF0dXJlLnBhdGhOYW1lcy5hZGQocGF0aE5hbWUpO1xuICAgICAgICBpZiAoc2FtcGxlci5pbnB1dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZmVhdHVyZS5taW5TdGFydElucHV0VGltZSA9IE1hdGgubWluKGZlYXR1cmUubWluU3RhcnRJbnB1dFRpbWUsIHNhbXBsZXIuaW5wdXRbMF0pO1xuICAgICAgICAgIGZlYXR1cmUubWF4RW5kSW5wdXRUaW1lID0gTWF0aC5tYXgoZmVhdHVyZS5tYXhFbmRJbnB1dFRpbWUsIHNhbXBsZXIuaW5wdXRbc2FtcGxlci5pbnB1dC5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgZmVhdHVyZS50b3RhbEtleWZyYW1lcyArPSBzYW1wbGVyLmlucHV0Lmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgWywgZmVhdHVyZV0gb2YgZmVhdHVyZU1hcCkge1xuICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZmVhdHVyZS5taW5TdGFydElucHV0VGltZSkpIHtcbiAgICAgICAgZmVhdHVyZS5taW5TdGFydElucHV0VGltZSA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShmZWF0dXJlLm1heEVuZElucHV0VGltZSkpIHtcbiAgICAgICAgZmVhdHVyZS5tYXhFbmRJbnB1dFRpbWUgPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGhhc2hNYXA6IE1hcDxBbmltYXRpb25UcmFja05hbWUsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG4gICAgY29uc3Qgc29ydGVkVHJhY2tOYW1lcyA9IEFycmF5LmZyb20oZmVhdHVyZU1hcC5rZXlzKCkpLnNvcnQoKTtcbiAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiBzb3J0ZWRUcmFja05hbWVzKSB7XG4gICAgICBjb25zdCBmZWF0dXJlID0gZmVhdHVyZU1hcC5nZXQodHJhY2tOYW1lKSE7XG4gICAgICBjb25zdCBzZXJpYWxpemVkID0gW1xuICAgICAgICB0cmFja05hbWUsXG4gICAgICAgIEFycmF5LmZyb20oZmVhdHVyZS5wYXRoTmFtZXMpLnNvcnQoKS5qb2luKCcsJyksXG4gICAgICAgIGZlYXR1cmUubWluU3RhcnRJbnB1dFRpbWUsXG4gICAgICAgIGZlYXR1cmUubWF4RW5kSW5wdXRUaW1lLFxuICAgICAgICBmZWF0dXJlLnRvdGFsS2V5ZnJhbWVzLFxuICAgICAgXS5qb2luKCd8Jyk7XG4gICAgICBjb25zdCBoYXNoID0gRGF0YVV0aWwudG9DUkMzMihzZXJpYWxpemVkKTtcbiAgICAgIGhhc2hNYXAuc2V0KHRyYWNrTmFtZSwgaGFzaCk7XG4gICAgfVxuXG4gICAgdGhpcy5fX2FuaW1hdGlvblRyYWNrRmVhdHVyZUhhc2hlcyA9IGhhc2hNYXA7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9fYW5pbWF0aW9uR2xvYmFsSW5mb01hcC5kZWxldGUoZW5naW5lKTtcbiAgfVxufVxuXG4vLyBUaGUgRW5naW5lIHJlYWNoZXMgYW5pbWF0aW9uIHN0YXRlIHRocm91Z2ggdGhlc2UgaG9va3MsIHNvIGl0IGRvZXMgbm90IGltcG9ydCB0aGUgYW5pbWF0aW9uIGltcGxlbWVudGF0aW9uLlxucmVnaXN0ZXJDb21wb25lbnRSdW50aW1lSG9va3Moe1xuICBiZWdpbkZyYW1lOiBlbmdpbmUgPT4ge1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5iZWdpblByb2Nlc3NGcmFtZShlbmdpbmUpO1xuICB9LFxuICBjbGVhbnVwOiBlbmdpbmUgPT4ge1xuICAgIEFuaW1hdGlvblN0YXRlUmVwb3NpdG9yeS5fY2xlYW51cEZvckVuZ2luZShlbmdpbmUpO1xuICAgIEFuaW1hdGlvbkNvbXBvbmVudC5fY2xlYW51cEZvckVuZ2luZShlbmdpbmUpO1xuICB9LFxuICBpc0RpcnR5OiBlbmdpbmUgPT4gQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKGVuZ2luZSksXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFXQSxTQUFTLG1DQUFtQztBQUM1QyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFDQUFxQztBQUU5QyxTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLDBCQUEwQjtBQUVuQyxTQUFTLGdCQUE2QjtBQUN0QyxTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLHVCQUF1QjtBQUdoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUcvQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLFVBQVU7QUFFbkIsU0FBNEIsbUJBQW1CO0FBTS9DLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZ0NBQWdDO0FBRXpDLElBQU0sc0JBQXNCLHVCQUFPLDRDQUE0QztBQUMvRSxJQUFNLFVBQVUsdUJBQU8sZ0NBQWdDO0FBQ3ZELElBQU0sMEJBQTBCO0FBZXpCLElBQU0sc0JBQU4sTUFBTSw0QkFBMkIsVUFBVTtBQUFBLEVBQTNDO0FBQUE7QUFHTDtBQUFBO0FBQUEsU0FBUUEsS0FBMkI7QUFHbkM7QUFBQTtBQUFBLFNBQVEsbUJBQW1DLG9CQUFJLElBQUk7QUFDbkQsU0FBUUMsS0FBaUUsb0JBQUksSUFBSTtBQUlqRixTQUFRQyxLQUFxQjtBQUc3QjtBQUFBLFNBQVFDLEtBQXlCLG9CQUFJLElBQW9CO0FBR3pEO0FBQUEsU0FBUUMsS0FBK0Isb0JBQUksSUFBb0I7QUFHL0Q7QUFBQSxTQUFRQyxLQUFnQjtBQUN4QixTQUFPLFNBQVM7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U0FBUyxZQUFVO0FBQ2pCLDZCQUF5QixrQkFBa0IsTUFBTTtBQUNqRCx1QkFBbUIsa0JBQWtCLE1BQU07QUFBQSxFQUM3QztBQUFBLEVBQ0EsU0FBUyxZQUFVLG1CQUFtQixlQUFlLE1BQU07QUFDN0QsQ0FBQzsiLAogICJuYW1lcyI6IFsiX19hbmltYXRpb25CbGVuZGluZ1JhdGlvIiwgIl9fYW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzIiwgIl9faXNFZmZla3NlZXJTdGF0ZSIsICJfX3ZybUV4cHJlc3Npb25XZWlnaHRzIiwgIl9fbWF0ZXJpYWxQYXJhbWV0ZXJOYW1lQ2FjaGUiLCAiX19pc0FuaW1hdGluZyIsICJfX2VudGl0eVVpZCIsICJfX2VuZ2luZSIsICJfX2FwcGx5QW5pbWF0aW9uIiwgIl9fYXBwbHlDaGFubmVsQW5pbWF0aW9uIiwgIl9fYXBwbHlUcmFuc2Zvcm1BbmltYXRpb24iLCAiX19hcHBseUJsZW5kU2hhcGVBbmltYXRpb24iLCAiX19hcHBseVZpc2liaWxpdHlBbmltYXRpb24iLCAiX19hcHBseU1hdGVyaWFsQW5pbWF0aW9uIiwgIl9fYXBwbHlMaWdodEFuaW1hdGlvbiIsICJfX2FwcGx5Q2FtZXJhQW5pbWF0aW9uIiwgIl9fYXBwbHlFZmZla3NlZXJBbmltYXRpb24iLCAiX19zaG91bGRXcml0ZVRyYW5zZm9ybVZhbHVlIiwgIl9fYXBwbHlFZmZlY3RpdmVWaXNpYmlsaXR5IiwgIl9fZ2V0TG9jYWxWaXNpYmlsaXR5IiwgIl9fZ2V0TWF0ZXJpYWxQYXJhbWV0ZXJOYW1lIiwgIl9fcHVic3ViIiwgIl9fcmVjYWxjdWxhdGVBbmltYXRpb25JbmZvIiwgIl9fdXBkYXRlQW5pbWF0aW9uVHJhY2tGZWF0dXJlSGFzaGVzIiwgImkiLCAiaW5wdXQiLCAiX19hbmltYXRpb25HbG9iYWxJbmZvTWFwIiwgInNyY0FuaW0iLCAiX190bXBRdWF0IiwgIl9fdG1wUG9zIiwgIl9fdG1wU2NhbGUiXQp9Cg==
