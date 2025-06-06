import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import {
  type ComponentTID,
  type ComponentSID,
  type EntityUID,
  type Index,
  Array4,
  Array3,
  VectorComponentN,
} from '../../../types/CommonTypes';
import {
  type AnimationPathName,
  type AnimationTrack,
  type AnimationComponentEventType,
  type AnimationInfo,
  type AnimationTrackName,
  AnimationChannel,
  type AnimationSampler,
} from '../../../types/AnimationTypes';
import { valueWithDefault, valueWithCompensation } from '../../misc/MiscUtil';
import { EventPubSub, type EventHandler } from '../../system/EventPubSub';
import type { Quaternion } from '../../math/Quaternion';
import type { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import type { IAnimationEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import type { IEntity } from '../../core/Entity';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { IAnimationRetarget } from '../Skeletal';
import { __interpolate } from './AnimationOps';
import { ProcessStage } from '../../definitions';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableVector3 } from '../../math/MutableVector3';
import { MathUtil, type Scalar } from '../../math';
import type { IAnimatedValue } from '../../math/IAnimatedValue';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import type { AnimatedVectorN } from '../../math/AnimatedVectorN';

const defaultAnimationInfo = {
  name: '',
  minStartInputTime: 0,
  maxEndInputTime: 0,
};

const ChangeAnimationInfo = Symbol('AnimationComponentEventChangeAnimationInfo');
const PlayEnd = Symbol('AnimationComponentEventPlayEnd');

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
  public static __animationGlobalInfo: Map<AnimationTrackName, AnimationInfo> = new Map();

  private __isEffekseerState = -1;

  /// flags ///
  private __isAnimating = true;
  static isAnimating = true;
  public isLoop = true;

  // Global animation time in Rhodonite
  public useGlobalTime = true;
  public static globalTime = 0;

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

  /**
   * Creates an instance of AnimationComponent.
   * @param entityUid - The unique identifier of the entity that owns this component
   * @param componentSid - The component system identifier
   * @param entityRepository - The repository for managing entities
   * @param isReUse - Whether this component is being reused
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityRepository, isReUse);
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
   */
  $logic() {
    if (!AnimationComponent.isAnimating || !this.isAnimating) {
      return;
    }

    this.__applyAnimation();
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
      time = AnimationComponent.globalTime;
    }

    const transformComponent = (this.entity as unknown as ISceneGraphEntity).getTransform();
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    const effekseerComponent = this.entity.tryToGetEffekseer();

    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setTime(time);
      channel.animatedValue.blendingRatio = this.__animationBlendingRatio;
      if (pathName === 'translate') {
        transformComponent.localPosition = channel.animatedValue as unknown as Vector3;
      } else if (pathName === 'quaternion') {
        transformComponent.localRotation = channel.animatedValue as unknown as Quaternion;
      } else if (pathName === 'scale') {
        transformComponent.localScale = channel.animatedValue as unknown as Vector3;
      } else if (pathName === 'weights') {
        blendShapeComponent!.weights = (channel.animatedValue as AnimatedVectorN).getNumberArray();
      } else if (pathName.startsWith('material/')) {
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
      } else if (pathName === 'light_color') {
        const lightComponent = this.entity.tryToGetLight();
        if (Is.exist(lightComponent)) {
          const color = channel.animatedValue as unknown as Vector3;
          lightComponent.color = color;
        }
      } else if (pathName === 'light_intensity') {
        const lightComponent = this.entity.tryToGetLight();
        if (Is.exist(lightComponent)) {
          const intensity = channel.animatedValue as unknown as Scalar;
          lightComponent.intensity = intensity._v[0];
        }
      } else if (pathName === 'light_range') {
        const lightComponent = this.entity.tryToGetLight();
        if (Is.exist(lightComponent)) {
          const range = channel.animatedValue as unknown as Scalar;
          lightComponent.range = range._v[0];
        }
      } else if (pathName === 'light_spot_innerConeAngle') {
        const lightComponent = this.entity.tryToGetLight();
        if (Is.exist(lightComponent)) {
          const innerConeAngle = channel.animatedValue as unknown as Scalar;
          lightComponent.innerConeAngle = innerConeAngle._v[0];
        }
      } else if (pathName === 'light_spot_outerConeAngle') {
        const lightComponent = this.entity.tryToGetLight();
        if (Is.exist(lightComponent)) {
          const outerConeAngle = channel.animatedValue as unknown as Scalar;
          lightComponent.outerConeAngle = outerConeAngle._v[0];
        }
      } else if (pathName === 'camera_znear') {
        const cameraComponent = this.entity.tryToGetCamera();
        if (Is.exist(cameraComponent)) {
          const znear = channel.animatedValue as unknown as Scalar;
          cameraComponent.zNear = znear._v[0];
        }
      } else if (pathName === 'camera_zfar') {
        const cameraComponent = this.entity.tryToGetCamera();
        if (Is.exist(cameraComponent)) {
          const zfar = channel.animatedValue as unknown as Scalar;
          cameraComponent.zFar = zfar._v[0];
        }
      } else if (pathName === 'camera_fovy') {
        const cameraComponent = this.entity.tryToGetCamera();
        if (Is.exist(cameraComponent)) {
          const fovy = channel.animatedValue as unknown as Scalar;
          cameraComponent.setFovyAndChangeFocalLength(MathUtil.radianToDegree(fovy._v[0]));
        }
      } else if (pathName === 'camera_xmag') {
        const cameraComponent = this.entity.tryToGetCamera();
        if (Is.exist(cameraComponent)) {
          const xmag = channel.animatedValue as unknown as Scalar;
          cameraComponent.xMag = xmag._v[0];
        }
      } else if (pathName === 'camera_ymag') {
        const cameraComponent = this.entity.tryToGetCamera();
        if (Is.exist(cameraComponent)) {
          const ymag = channel.animatedValue as unknown as Scalar;
          cameraComponent.yMag = ymag._v[0];
        }
      } else if (pathName === 'effekseer') {
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
      }
    }
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
  static setActiveAnimationForAll(animationTrackName: AnimationTrackName) {
    const components = ComponentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimationTrack(animationTrackName);
    }
  }

  /**
   * Sets the active animation track for this component.
   * @param animationTrackName - The name of the animation track to activate
   */
  setActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setFirstActiveAnimationTrackName(animationTrackName);
    }
  }

  /**
   * Sets the second active animation track for blending purposes.
   * @param animationTrackName - The name of the second animation track to activate
   */
  setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setSecondActiveAnimationTrackName(animationTrackName);
    }
  }

  /**
   * Gets the name of the currently active animation track.
   * @returns The name of the active animation track
   * @throws Error if no active animation track is found
   */
  getActiveAnimationTrack() {
    for (const [pathName, channel] of this.__animationTrack) {
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
      return pathName == currentPathName && channel.animatedValue.getFirstActiveAnimationTrackName() === trackName;
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
    for (const trackName of trackNames) {
      const newMinStartInputTime = animatedValue.getMinStartInputTime(trackName);
      const newMaxEndInputTime = animatedValue.getMaxEndInputTime(trackName);

      const info = {
        name: trackName,
        minStartInputTime: newMinStartInputTime,
        maxEndInputTime: newMaxEndInputTime,
      };
      AnimationComponent.__animationGlobalInfo.set(trackName, info);
      AnimationComponent.__pubsub.publishAsync(AnimationComponent.Event.ChangeAnimationInfo, {
        infoMap: new Map(AnimationComponent.__animationGlobalInfo),
      });
    }
    // backup the current transform as rest pose
    this.entity.getTransform()._backupTransformAsRest();
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
    return AnimationComponent.__animationGlobalInfo.get(animationTrackName)!.minStartInputTime;
  }

  /**
   * Gets the end input time value for the specified animation track.
   * @param animationTrackName - The name of the animation track
   * @returns The maximum end input time value
   */
  public getEndInputValueOfAnimation(animationTrackName: string): number {
    return AnimationComponent.__animationGlobalInfo.get(animationTrackName)!.maxEndInputTime;
  }

  /**
   * Gets an array of all available animation track names.
   * @returns Array of animation track names
   */
  static getAnimationList(): AnimationTrackName[] {
    return Array.from(this.__animationGlobalInfo.keys());
  }

  /**
   * Gets the animation information for all tracks.
   * @returns A map containing animation track names and their corresponding information
   */
  static getAnimationInfo(): Map<AnimationTrackName, AnimationInfo> {
    return new Map(this.__animationGlobalInfo);
  }

  /**
   * Gets all animation track names associated with this component.
   * @returns An array of animation track names
   */
  public getAnimationTrackNames(): AnimationTrackName[] {
    const trackNames = [];
    for (const [pathName, channel] of this.__animationTrack) {
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
   * @returns The start input value
   */
  static get startInputValue() {
    const components = ComponentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationGlobalInfo.values());
      const lastInfo = infoArray[infoArray.length - 1];
      return lastInfo.minStartInputTime;
    }
  }

  /**
   * Gets the global end input value for all animation components.
   * @returns The end input value
   */
  static get endInputValue() {
    const components = ComponentRepository.getComponentsWithType(AnimationComponent) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationGlobalInfo.values());
      const lastInfo = infoArray[infoArray.length - 1];
      return lastInfo.maxEndInputTime;
    }
  }

  /**
   * Gets the component type identifier for AnimationComponent.
   * @returns The component type identifier
   */
  static get componentTID(): ComponentTID {
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
    return EntityRepository.getEntity(this.__entityUid) as unknown as IAnimationEntity;
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
      constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>) {
        super(entityUID, isAlive, components);
      }

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
    const output = __interpolate(animatedValue.getAnimationSampler(trackName), AnimationComponent.globalTime, i);

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
   * Sets the global animation state for all animation components.
   * @param flag - True to enable animation globally, false to disable
   */
  static setIsAnimating(flag: boolean) {
    this.isAnimating = flag;
  }

  /**
   * Performs a shallow copy of another animation component's data into this component.
   * @param component_ - The source animation component to copy from
   * @override
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as AnimationComponent;

    this.__animationTrack = new Map(component.__animationTrack);
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
        srcAnim.__applyAnimation();
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
        srcAnim.__applyAnimation();
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
        srcAnim.__applyAnimation();
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
    for (const [pathName, channel] of this.__animationTrack) {
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

  /**
   * Destroys this component, cleaning up resources and clearing animation data.
   * @override
   */
  _destroy(): void {
    super._destroy();
    this.__animationTrack.clear();
    this.__isAnimating = false;
  }
}
