import type { EffekseerComponent } from '../../../effekseer/EffekseerComponent';
import type {
  AnimationChannel,
  AnimationComponentEventType,
  AnimationInfo,
  AnimationPathName,
  AnimationSampler,
  AnimationTrack,
  AnimationTrackName,
} from '../../../types/AnimationTypes';
import {
  Array3,
  Array4,
  type ComponentSID,
  type ComponentTID,
  type EntityUID,
  type Index,
  type Second,
  VectorComponentN,
} from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import type { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import type { IAnimationEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import { MathUtil, type Scalar } from '../../math';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import type { AnimatedVectorN } from '../../math/AnimatedVectorN';
import type { IAnimatedValue } from '../../math/IAnimatedValue';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableVector3 } from '../../math/MutableVector3';
import type { Quaternion } from '../../math/Quaternion';
import type { Vector3 } from '../../math/Vector3';
import { DataUtil } from '../../misc/DataUtil';
import { Is } from '../../misc/Is';
import { valueWithCompensation, valueWithDefault } from '../../misc/MiscUtil';
import type { Engine } from '../../system/Engine';
import { type EventHandler, EventPubSub } from '../../system/EventPubSub';
import type { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { IAnimationRetarget } from '../Skeletal';
import type { TransformComponent } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { __interpolate } from './AnimationOps';
import { AnimationStateRepository } from './AnimationStateRepository';

const ChangeAnimationInfo = Symbol('AnimationComponentEventChangeAnimationInfo');
const PlayEnd = Symbol('AnimationComponentEventPlayEnd');

type AnimationTrackFeature = {
  trackName: AnimationTrackName;
  pathNames: Set<AnimationPathName>;
  minStartInputTime: Second;
  maxEndInputTime: Second;
  totalKeyframes: number;
};

/**
 * A component that manages animation data and applies animation transformations to entities.
 * This component handles various types of animations including transform, blend shape, material,
 * light, camera, and Effekseer particle system animations.
 */
export class AnimationComponent extends Component {
  /// inner states ///
  // The name of the current Active Track
  private __animationBlendingRatio = 0; // the value range is [0,1]

  // Animation Data of each AnimationComponent
  private __animationTrack: AnimationTrack = new Map();
  private __animationTrackFeatureHashes: Map<AnimationTrackName, number> = new Map();
  /** Map to store animation global info per Engine instance for multi-engine support */
  private static __animationGlobalInfoMap: Map<Engine, Map<AnimationTrackName, AnimationInfo>> = new Map();

  private __isEffekseerState = -1;

  /// flags ///
  private __isAnimating = true;
  public isLoop = true;

  // Global animation time in Rhodonite
  public useGlobalTime = true;

  // animation time in this animation component
  public time = 0;

  // Event for pubsub of notifications
  public static readonly Event = {
    ChangeAnimationInfo,
    PlayEnd,
  };

  private static __tmpQuat = MutableQuaternion.identity();
  private static __tmpPos = MutableVector3.zero();
  private static __tmpScale = MutableVector3.one();

  private static __pubsub = new EventPubSub();

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
    // Skip if animation is globally or locally disabled
    if (!this.isAnimationEnabled()) {
      return;
    }

    // ============================================================================
    // Early Return Optimization for VRM Models with Shared Skeleton
    // ============================================================================
    // When multiple VRM models share the same animation (same skeleton structure),
    // only one model (the "leader") needs to compute animation values.
    // Other models ("followers") can skip animation calculation entirely because
    // their SkeletalComponent will reuse the cached skinning result from the leader.
    //
    // How it works:
    // 1. SkeletalComponent tracks which joints had skinning cache hits in the previous frame
    // 2. Joints belonging to "leader" SkeletalComponents are excluded (must continue animating)
    // 3. Joints belonging to "follower" SkeletalComponents are registered for early return
    // 4. This AnimationComponent checks if its entity is registered
    //
    // Two scenarios:
    // - shallowCopy: Joints are shared (same entityUID) → no early return needed
    //   (the same AnimationComponent instance processes the shared joint once)
    // - Separate load: Joints are different (different entityUID, same jointIndex)
    //   → early return enabled, significantly reducing CPU overhead
    // ============================================================================
    if (AnimationStateRepository.isEntityCached(this.__entityUid, this.__engine)) {
      return;
    }

    // Apply animation calculations (update joint transforms)
    this.__applyAnimation();
  }

  public isAnimationEnabled() {
    if (AnimationComponent.getIsAnimating(this.__engine) && this.isAnimating) {
      return true;
    }
    return false;
  }

  /**
   * Sets the animation blending ratio and applies the animation.
   * @param value - The blending ratio value between 0 and 1
   */
  set animationBlendingRatio(value: number) {
    this.__animationBlendingRatio = value;
    this.__applyAnimation();
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
  private __applyAnimation() {
    let time = this.time;
    if (this.useGlobalTime) {
      time = AnimationComponent.getGlobalTime(this.__engine);
    }

    const transformComponent = (this.entity as unknown as ISceneGraphEntity).getTransform();
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    const effekseerComponent = this.entity.tryToGetEffekseer();

    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setTime(time);
      channel.animatedValue.blendingRatio = this.__animationBlendingRatio;

      this.__applyChannelAnimation(pathName, channel, transformComponent, blendShapeComponent, effekseerComponent);
    }
  }

  private __applyChannelAnimation(
    pathName: string,
    channel: AnimationChannel,
    transformComponent: TransformComponent,
    blendShapeComponent?: BlendShapeComponent,
    effekseerComponent?: EffekseerComponent
  ) {
    if (this.__applyTransformAnimation(pathName, channel, transformComponent)) return;
    if (this.__applyBlendShapeAnimation(pathName, channel, blendShapeComponent)) return;
    if (this.__applyMaterialAnimation(pathName, channel)) return;
    if (this.__applyLightAnimation(pathName, channel)) return;
    if (this.__applyCameraAnimation(pathName, channel)) return;
    if (this.__applyEffekseerAnimation(pathName, channel, effekseerComponent)) return;
  }

  private __applyTransformAnimation(
    pathName: string,
    channel: AnimationChannel,
    transformComponent: TransformComponent
  ): boolean {
    if (pathName === 'translate') {
      transformComponent.localPosition = channel.animatedValue as unknown as Vector3;
      return true;
    }
    if (pathName === 'quaternion') {
      transformComponent.localRotation = channel.animatedValue as unknown as Quaternion;
      return true;
    }
    if (pathName === 'scale') {
      transformComponent.localScale = channel.animatedValue as unknown as Vector3;
      return true;
    }
    return false;
  }

  private __applyBlendShapeAnimation(
    pathName: string,
    channel: AnimationChannel,
    blendShapeComponent?: BlendShapeComponent
  ): boolean {
    if (pathName === 'weights') {
      blendShapeComponent!.weights = (channel.animatedValue as AnimatedVectorN).getNumberArray();
      return true;
    }
    return false;
  }

  private __applyMaterialAnimation(pathName: string, channel: AnimationChannel): boolean {
    if (pathName.startsWith('material/')) {
      const meshComponent = this.entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        const mesh = meshComponent.mesh;
        for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
          const primitive = mesh.getPrimitiveAt(i);
          const material = primitive.material;
          if (Is.exist(material)) {
            material.setParameter(pathName.split('/').pop()!, channel.animatedValue);
          }
        }
      }
      return true;
    }
    return false;
  }

  private __applyLightAnimation(pathName: string, channel: AnimationChannel): boolean {
    const lightComponent = this.entity.tryToGetLight();
    if (!Is.exist(lightComponent)) return false;

    if (pathName === 'light_color') {
      const color = channel.animatedValue as unknown as Vector3;
      lightComponent.color = color;
      return true;
    }
    if (pathName === 'light_intensity') {
      const intensity = channel.animatedValue as unknown as Scalar;
      lightComponent.intensity = intensity._v[0];
      return true;
    }
    if (pathName === 'light_range') {
      const range = channel.animatedValue as unknown as Scalar;
      lightComponent.range = range._v[0];
      return true;
    }
    if (pathName === 'light_spot_innerConeAngle') {
      const innerConeAngle = channel.animatedValue as unknown as Scalar;
      lightComponent.innerConeAngle = innerConeAngle._v[0];
      return true;
    }
    if (pathName === 'light_spot_outerConeAngle') {
      const outerConeAngle = channel.animatedValue as unknown as Scalar;
      lightComponent.outerConeAngle = outerConeAngle._v[0];
      return true;
    }
    return false;
  }

  private __applyCameraAnimation(pathName: string, channel: AnimationChannel): boolean {
    const cameraComponent = this.entity.tryToGetCamera();
    if (!Is.exist(cameraComponent)) return false;

    if (pathName === 'camera_znear') {
      const znear = channel.animatedValue as unknown as Scalar;
      cameraComponent.zNear = znear._v[0];
      return true;
    }
    if (pathName === 'camera_zfar') {
      const zfar = channel.animatedValue as unknown as Scalar;
      cameraComponent.zFar = zfar._v[0];
      return true;
    }
    if (pathName === 'camera_fovy') {
      const fovy = channel.animatedValue as unknown as Scalar;
      cameraComponent.setFovyAndChangeFocalLength(MathUtil.radianToDegree(fovy._v[0]));
      return true;
    }
    if (pathName === 'camera_xmag') {
      const xmag = channel.animatedValue as unknown as Scalar;
      cameraComponent.xMag = xmag._v[0];
      return true;
    }
    if (pathName === 'camera_ymag') {
      const ymag = channel.animatedValue as unknown as Scalar;
      cameraComponent.yMag = ymag._v[0];
      return true;
    }
    return false;
  }

  private __applyEffekseerAnimation(
    pathName: string,
    channel: AnimationChannel,
    effekseerComponent?: EffekseerComponent
  ): boolean {
    if (pathName === 'effekseer') {
      if ((channel.animatedValue as unknown as Scalar).x > 0.5) {
        if (this.__isEffekseerState === 0) {
          effekseerComponent?.play();
        }
      } else {
        if (this.__isEffekseerState === 1) {
          effekseerComponent?.pause();
        }
      }
      this.__isEffekseerState = (channel.animatedValue as unknown as Scalar).x;
      return true;
    }
    return false;
  }

  /**
   * Subscribes to animation component events.
   * @param type - The type of event to subscribe to
   * @param handler - The event handler function
   */
  static subscribe(type: AnimationComponentEventType, handler: EventHandler) {
    AnimationComponent.__pubsub.subscribe(type, handler);
  }

  /**
   * Sets whether this animation component is animating.
   * @param flg - True to enable animation, false to disable
   */
  setIsAnimating(flg: boolean) {
    this.__isAnimating = flg;
  }

  /**
   * Sets the active animation track for all animation components.
   * @param animationTrackName - The name of the animation track to activate
   */
  static setActiveAnimationForAll(engine: Engine, animationTrackName: AnimationTrackName) {
    const components = engine.componentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimationTrack(animationTrackName);
    }
  }

  /**
   * Sets the active animation track for this component.
   * @param animationTrackName - The name of the animation track to activate
   */
  setActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    for (const [, channel] of this.__animationTrack) {
      channel.animatedValue.setFirstActiveAnimationTrackName(animationTrackName);
    }
  }

  /**
   * Sets the second active animation track for blending purposes.
   * @param animationTrackName - The name of the second animation track to activate
   */
  setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName) {
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
    throw new Error('No active animation track found');
  }

  /**
   * Checks if this component has a specific animation for the given track and path.
   * @param trackName - The animation track name to check
   * @param pathName - The animation path name to check
   * @returns True if the animation exists, false otherwise
   */
  hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean {
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
  setAnimation(pathName: AnimationPathName, animatedValueArg: IAnimatedValue) {
    let animatedValue: IAnimatedValue;
    if (this.__animationTrack.has(pathName)) {
      const existedAnimatedValue = this.__animationTrack.get(pathName)!.animatedValue;
      for (const trackName of animatedValueArg.getAllTrackNames()) {
        existedAnimatedValue.setAnimationSampler(trackName, animatedValueArg.getAnimationSampler(trackName));
      }
      animatedValue = existedAnimatedValue;
    } else {
      this.__animationTrack.set(pathName, {
        animatedValue: animatedValueArg,
        target: {
          pathName,
          entity: this.entity,
        },
      });
      animatedValue = animatedValueArg;
    }

    // update AnimationInfo
    const trackNames = animatedValue.getAllTrackNames();
    const animationGlobalInfo = AnimationComponent.getAnimationGlobalInfo(this.__engine);
    for (const trackName of trackNames) {
      const newMinStartInputTime = animatedValue.getMinStartInputTime(trackName);
      const newMaxEndInputTime = animatedValue.getMaxEndInputTime(trackName);

      const info = {
        name: trackName,
        minStartInputTime: newMinStartInputTime,
        maxEndInputTime: newMaxEndInputTime,
      };
      animationGlobalInfo.set(trackName, info);
      AnimationComponent.__pubsub.publishAsync(AnimationComponent.Event.ChangeAnimationInfo, {
        infoMap: new Map(animationGlobalInfo),
      });
    }
    // backup the current transform as rest pose
    this.entity.getTransform()._backupTransformAsRest();
    this.__updateAnimationTrackFeatureHashes();
  }

  /**
   * Gets the animated value for the specified animation path.
   * @param pathName - The name of the animation path
   * @returns The animated value or undefined if not found
   */
  getAnimation(pathName: AnimationPathName) {
    return this.__animationTrack.get(pathName)?.animatedValue;
  }

  /**
   * Gets the start input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The minimum start input time value
   */
  public getStartInputValueOfAnimation(animationTrackName: string): number {
    const animationGlobalInfo = AnimationComponent.getAnimationGlobalInfo(this.__engine);
    return animationGlobalInfo.get(animationTrackName)!.minStartInputTime;
  }

  /**
   * Gets the end input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The maximum end input time value
   */
  public getEndInputValueOfAnimation(animationTrackName: string): number {
    const animationGlobalInfo = AnimationComponent.getAnimationGlobalInfo(this.__engine);
    return animationGlobalInfo.get(animationTrackName)!.maxEndInputTime;
  }

  /**
   * Gets an array of all available animation track names.
   * @param engine - The engine instance to get the animation list for
   * @returns Array of animation track names
   */
  static getAnimationList(engine: Engine): AnimationTrackName[] {
    const animationGlobalInfo = this.getAnimationGlobalInfo(engine);
    return Array.from(animationGlobalInfo.keys());
  }

  /**
   * Gets the animation information for all tracks.
   * @param engine - The engine instance to get the animation info for
   * @returns A map containing animation track names and their corresponding information
   */
  static getAnimationInfo(engine: Engine): Map<AnimationTrackName, AnimationInfo> {
    return new Map(this.getAnimationGlobalInfo(engine));
  }

  /**
   * Gets all animation track names associated with this component.
   * @returns An array of animation track names
   */
  public getAnimationTrackNames(): AnimationTrackName[] {
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
  public getAnimationChannelsOfTrack(): AnimationTrack {
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
  static getStartInputValue(engine: Engine) {
    const components = engine.componentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
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
  static getEndInputValue(engine: Engine) {
    const components = engine.componentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
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
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  /**
   * Gets the entity that owns this animation component.
   * @returns The entity which has this component
   */
  get entity(): IAnimationEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as IAnimationEntity;
  }

  /**
   * Adds this animation component to an entity, extending the entity with animation methods.
   * @param base - The target entity to add this component to
   * @param _componentClass - The component class to add
   * @returns The entity extended with animation component methods
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class AnimationEntity extends (base.constructor as any) {
      getAnimation() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.AnimationComponentTID) as AnimationComponent;
      }
    }
    applyMixins(base, AnimationEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }

  /**
   * Adds a keyframe to the specified animation track at the given frame.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frameToInsert - The frame number where to insert the keyframe
   * @param fps - The frames per second rate
   * @returns True if the keyframe was successfully added, false otherwise
   */
  addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number) {
    const secBegin = frameToInsert / fps;
    const input = secBegin;
    const secEnd = (frameToInsert + 1) / fps;

    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    const animatedValue = channel.animatedValue;

    const i = AnimationAttribute.fromString(pathName).index;
    const globalTime = AnimationComponent.getGlobalTime(this.__engine);
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
        // secBegin <= existedInput <= secEnd
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.splice(0, 0, input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.splice(0, 0, ...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      }
    } else {
      // channel.sampler.input.length >= 2
      for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
        const existedInput = animatedValue.getAnimationSampler(trackName).input[i];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            animatedValue.getAnimationSampler(trackName).input[i] = input;
            for (let j = 0; j < animatedValue.getAnimationSampler(trackName).outputComponentN; j++) {
              animatedValue.getAnimationSampler(trackName).output[
                i * animatedValue.getAnimationSampler(trackName).outputComponentN + j
              ] = output[j];
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
   * Adds a keyframe with a specific value to the specified animation track at the given frame.
   * @param trackName - The name of the animation track
   * @param pathName - The name of the animation path
   * @param frameToInsert - The frame number where to insert the keyframe
   * @param output - The array of output values for the keyframe
   * @param fps - The frames per second rate
   * @returns True if the keyframe was successfully added, false otherwise
   */
  addKeyFrameWithValue(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    frameToInsert: Index,
    output: Array<number>,
    fps: number
  ) {
    const secBegin = frameToInsert / fps;
    const input = secBegin;
    const secEnd = (frameToInsert + 1) / fps;

    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    const animatedValue = channel.animatedValue;

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
        // secBegin <= existedInput <= secEnd
        const inputArray = Array.from(animatedValue.getAnimationSampler(trackName).input);
        inputArray.splice(0, 0, input);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(inputArray);
        const outputArray = Array.from(animatedValue.getAnimationSampler(trackName).output);
        outputArray.splice(0, 0, ...output);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(outputArray);
      }
    } else {
      // channel.sampler.input.length >= 2
      for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
        const existedInput = animatedValue.getAnimationSampler(trackName).input[i];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            animatedValue.getAnimationSampler(trackName).input[i] = input;
            for (let j = 0; j < animatedValue.getAnimationSampler(trackName).outputComponentN; j++) {
              animatedValue.getAnimationSampler(trackName).output[
                i * animatedValue.getAnimationSampler(trackName).outputComponentN + j
              ] = output[j];
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
  deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number) {
    const secBegin = frameToDelete / fps;
    const secEnd = (frameToDelete + 1) / fps;

    const channel = this.__animationTrack.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    const animatedValue = channel.animatedValue;

    for (let i = 0; i < animatedValue.getAnimationSampler(trackName).input.length; i++) {
      const input = animatedValue.getAnimationSampler(trackName).input[i];
      if (secBegin <= input && input < secEnd) {
        const input = Array.from(animatedValue.getAnimationSampler(trackName).input);
        input.splice(i, 1);
        animatedValue.getAnimationSampler(trackName).input = new Float32Array(input);
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
  hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number) {
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
  static getAnimationGlobalInfo(engine: Engine): Map<AnimationTrackName, AnimationInfo> {
    let infoMap = this.__animationGlobalInfoMap.get(engine);
    if (infoMap == null) {
      infoMap = new Map();
      this.__animationGlobalInfoMap.set(engine, infoMap);
    }
    return infoMap;
  }

  /**
   * Sets the animation state for the specified engine.
   * @param engine - The engine instance to set the animation state for
   * @param flag - True to enable animation, false to disable
   */
  static setIsAnimating(engine: Engine, flag: boolean) {
    AnimationStateRepository.setIsAnimating(engine, flag);
  }

  /**
   * Gets the animation state for the specified engine.
   * @param engine - The engine instance to get the animation state for
   * @returns True if animation is enabled for the engine, defaults to true if not set
   */
  static getIsAnimating(engine: Engine): boolean {
    return AnimationStateRepository.getIsAnimating(engine);
  }

  /**
   * Sets the global animation time for the specified engine.
   * @param engine - The engine instance to set the global time for
   * @param time - The global animation time in seconds
   */
  static setGlobalTime(engine: Engine, time: number) {
    AnimationStateRepository.setGlobalTime(engine, time);
  }

  /**
   * Gets the global animation time for the specified engine.
   * @param engine - The engine instance to get the global time for
   * @returns The global animation time for the engine, defaults to 0 if not set
   */
  static getGlobalTime(engine: Engine): number {
    return AnimationStateRepository.getGlobalTime(engine);
  }

  /**
   * Performs a shallow copy of another animation component's data into this component.
   * @param component_ - The source animation component to copy from
   * @override
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as AnimationComponent;

    this.__animationTrack = new Map(component.__animationTrack);
    this.__animationTrackFeatureHashes = new Map(component.__animationTrackFeatureHashes);
    this.__isEffekseerState = component.__isEffekseerState;
    this.__isAnimating = component.__isAnimating;
  }

  /**
   * Sets up animation retargeting from a source entity to this entity.
   * @param retarget - The retargeting interface that defines how to map animations
   * @param postfixToTrackName - Optional postfix to append to track names
   * @returns An array of created track names
   * @private
   */
  _setRetarget(retarget: IAnimationRetarget, postfixToTrackName?: string): string[] {
    const srcEntity = retarget.getEntity();
    const srcAnim = srcEntity.tryToGetAnimation();
    const dstEntity = this.entity;
    this.entity.getTransform()._backupTransformAsRest();
    if (Is.not.exist(srcAnim)) {
      return [];
    }
    srcAnim.useGlobalTime = false;
    const trackNames: string[] = [];
    for (const [pathName, channel] of srcAnim.__animationTrack) {
      const animatedValue = channel.animatedValue;
      for (const _trackName of animatedValue.getAllTrackNames()) {
        const trackName = _trackName + (postfixToTrackName ?? '');
        trackNames.push(trackName);

        const input = animatedValue.getAnimationSampler(_trackName).input;
        if (channel.target.pathName === 'translate') {
          const outputs = retargetTranslate(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(pathName as AnimationPathName, newAnimatedValue);
        }
        if (channel.target.pathName === 'quaternion') {
          const outputs = retargetQuaternion(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 4,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedQuaternion(samplers, trackName);
          this.setAnimation(pathName as AnimationPathName, newAnimatedValue);
        }
        if (channel.target.pathName === 'scale') {
          const outputs = retargetScale(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(_trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(pathName as AnimationPathName, newAnimatedValue);
        }
      }
    }

    function retargetTranslate(input: Float32Array, srcAnim: AnimationComponent) {
      const outputsTranslation = new Float32Array(input.length * 3);
      for (let i = 0; i < input.length; i++) {
        srcAnim.time = input[i];
        (srcAnim as any).__applyAnimation();
        const outputTranslation = retarget.retargetTranslate(dstEntity);
        outputsTranslation[i * 3 + 0] = outputTranslation.x;
        outputsTranslation[i * 3 + 1] = outputTranslation.y;
        outputsTranslation[i * 3 + 2] = outputTranslation.z;
      }
      return outputsTranslation;
    }

    function retargetQuaternion(input: Float32Array, srcAnim: AnimationComponent) {
      const outputsQuaternion = new Float32Array(input.length * 4);
      for (let i = 0; i < input.length; i++) {
        srcAnim.time = input[i];
        (srcAnim as any).__applyAnimation();
        const outputQuaternion = retarget.retargetQuaternion(dstEntity);
        outputsQuaternion[i * 4 + 0] = outputQuaternion.x;
        outputsQuaternion[i * 4 + 1] = outputQuaternion.y;
        outputsQuaternion[i * 4 + 2] = outputQuaternion.z;
        outputsQuaternion[i * 4 + 3] = outputQuaternion.w;
      }
      return outputsQuaternion;
    }

    function retargetScale(input: Float32Array, srcAnim: AnimationComponent) {
      const outputsScale = new Float32Array(input.length * 3);
      for (let i = 0; i < input.length; i++) {
        srcAnim.time = input[i];
        (srcAnim as any).__applyAnimation();
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
    this.__animationTrack.clear();
  }

  /**
   * Resets a specific animation track by removing its animation sampler data.
   * @param trackName - The name of the animation track to reset
   */
  resetAnimationTrack(trackName: string) {
    for (const [, channel] of this.__animationTrack) {
      channel.animatedValue.deleteAnimationSampler(trackName);
    }
  }

  /**
   * Resets all animation tracks that have names ending with the specified postfix.
   * @param postfix - The postfix to match against track names
   */
  resetAnimationTrackByPostfix(postfix: string) {
    const trackNames = this.getAnimationTrackNames();
    for (const trackName of trackNames) {
      if (trackName.endsWith(postfix)) {
        this.resetAnimationTrack(trackName);
      }
    }
  }

  currentTrackFeatureHash(): number | undefined {
    return this.__animationTrackFeatureHashes.get(this.getActiveAnimationTrack());
  }

  /**
   * Destroys this component, cleaning up resources and clearing animation data.
   * @override
   */
  _destroy(): void {
    super._destroy();
    this.__animationTrack.clear();
    this.__animationTrackFeatureHashes.clear();
    this.__isAnimating = false;
  }

  private __updateAnimationTrackFeatureHashes() {
    const featureMap: Map<AnimationTrackName, AnimationTrackFeature> = new Map();

    for (const [pathName, channel] of this.__animationTrack) {
      for (const trackName of channel.animatedValue.getAllTrackNames()) {
        const sampler = channel.animatedValue.getAnimationSampler(trackName);
        let feature = featureMap.get(trackName);
        if (Is.not.exist(feature)) {
          feature = {
            trackName,
            pathNames: new Set<AnimationPathName>(),
            minStartInputTime: Number.POSITIVE_INFINITY,
            maxEndInputTime: Number.NEGATIVE_INFINITY,
            totalKeyframes: 0,
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

    const hashMap: Map<AnimationTrackName, number> = new Map();
    const sortedTrackNames = Array.from(featureMap.keys()).sort();
    for (const trackName of sortedTrackNames) {
      const feature = featureMap.get(trackName)!;
      const serialized = [
        trackName,
        Array.from(feature.pathNames).sort().join(','),
        feature.minStartInputTime,
        feature.maxEndInputTime,
        feature.totalKeyframes,
      ].join('|');
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
  static _cleanupForEngine(engine: Engine): void {
    AnimationComponent.__animationGlobalInfoMap.delete(engine);
  }
}
