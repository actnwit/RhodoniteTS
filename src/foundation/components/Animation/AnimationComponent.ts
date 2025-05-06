import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
  Index,
  Array4,
  Array3,
  VectorComponentN,
} from '../../../types/CommonTypes';
import {
  AnimationPathName,
  AnimationTrack,
  AnimationComponentEventType,
  AnimationInfo,
  AnimationTrackName,
  AnimationChannel,
  AnimationSampler,
} from '../../../types/AnimationTypes';
import { valueWithDefault, valueWithCompensation } from '../../misc/MiscUtil';
import { EventPubSub, EventHandler } from '../../system/EventPubSub';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { IAnimationEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { IAnimationRetarget } from '../Skeletal';
import { __interpolate } from './AnimationOps';
import { ProcessStage } from '../../definitions';
import { MutableQuaternion } from '../../math/MutableQuaternion';
import { MutableVector3 } from '../../math/MutableVector3';
import { Scalar } from '../../math';
import { IAnimatedValue } from '../../math/IAnimatedValue';
import { AnimatedVector3 } from '../../math/AnimatedVector3';
import { AnimatedQuaternion } from '../../math/AnimatedQuaternion';
import { AnimatedVectorN } from '../../math/AnimatedVectorN';

const defaultAnimationInfo = {
  name: '',
  minStartInputTime: 0,
  maxEndInputTime: 0,
};

const ChangeAnimationInfo = Symbol('AnimationComponentEventChangeAnimationInfo');
const PlayEnd = Symbol('AnimationComponentEventPlayEnd');

/**
 * A component that manages animation.
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

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);
  }

  /// LifeCycle Methods ///
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (!AnimationComponent.isAnimating || !this.isAnimating) {
      return;
    }

    this.__applyAnimation();
  }

  set animationBlendingRatio(value: number) {
    this.__animationBlendingRatio = value;
    this.__applyAnimation();
  }

  get animationBlendingRatio() {
    return this.__animationBlendingRatio;
  }

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
      } else if (pathName === 'material') {
        const meshComponent = this.entity.tryToGetMesh();
        if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
          const mesh = meshComponent.mesh;
          for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
            const primitive = mesh.getPrimitiveAt(i);
            const material = primitive.material;
            if (Is.exist(material)) {
              material.setTime(time);
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

  static subscribe(type: AnimationComponentEventType, handler: EventHandler) {
    AnimationComponent.__pubsub.subscribe(type, handler);
  }

  setIsAnimating(flg: boolean) {
    this.__isAnimating = flg;
  }

  static setActiveAnimationForAll(animationTrackName: AnimationTrackName) {
    const components = ComponentRepository.getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimationTrack(animationTrackName);
    }
  }

  setActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setFirstActiveAnimationTrackName(animationTrackName);
    }
  }

  setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName) {
    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.setSecondActiveAnimationTrackName(animationTrackName);
    }
  }

  getActiveAnimationTrack() {
    for (const [pathName, channel] of this.__animationTrack) {
      return channel.animatedValue.getFirstActiveAnimationTrackName();
    }
    throw new Error('No active animation track found');
  }

  hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean {
    for (const [currentPathName, channel] of this.__animationTrack) {
      return pathName == currentPathName && channel.animatedValue.getFirstActiveAnimationTrackName() === trackName;
    }
    return false;
  }

  /**
   * set an animation channel to AnimationSet
   * @param pathName - the name of animation path
   * @param animatedValue - the animated value
   */
  setAnimation(
    pathName: AnimationPathName,
    animatedValue: IAnimatedValue
  ) {
    this.__animationTrack.set(pathName, {
      animatedValue,
      target: {
        pathName,
        entity: this.entity,
      },
    });

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

  getAnimation(pathName: AnimationPathName) {
    return this.__animationTrack.get(pathName)?.animatedValue;
  }

  public getStartInputValueOfAnimation(animationTrackName: string): number {
    return AnimationComponent.__animationGlobalInfo.get(animationTrackName)!.minStartInputTime;
  }

  public getEndInputValueOfAnimation(animationTrackName: string): number {
    return AnimationComponent.__animationGlobalInfo.get(animationTrackName)!.maxEndInputTime;
  }

  /**
   * get the Array of Animation Track Name
   * @returns Array of Animation Track Name
   */
  static getAnimationList(): AnimationTrackName[] {
    return Array.from(this.__animationGlobalInfo.keys());
  }

  /**
   * get the AnimationInfo of the Component
   * @returns the map of
   */
  static getAnimationInfo(): Map<AnimationTrackName, AnimationInfo> {
    return new Map(this.__animationGlobalInfo);
  }

  /**
   * get animation track names of this component
   * @returns an array of animation track name
   */
  public getAnimationTrackNames(): AnimationTrackName[] {
    const trackNames = [];
    for (const [pathName, channel] of this.__animationTrack) {
      trackNames.push(...channel.animatedValue.getAllTrackNames());
    }
    return trackNames;
  }

  /**
   * get the animation channels of the animation track
   * @returns the channel maps of the animation track
   */
  public getAnimationChannelsOfTrack(): AnimationTrack {
    return this.__animationTrack;
  }

  get isAnimating() {
    return this.__isAnimating;
  }

  static get startInputValue() {
    const components = ComponentRepository.getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationGlobalInfo.values());
      const lastInfo = infoArray[infoArray.length - 1];
      return lastInfo.minStartInputTime;
    }
  }

  static get endInputValue() {
    const components = ComponentRepository.getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationGlobalInfo.values());
      const lastInfo = infoArray[infoArray.length - 1];
      return lastInfo.maxEndInputTime;
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IAnimationEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as IAnimationEntity;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class AnimationEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getAnimation() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.AnimationComponentTID
        ) as AnimationComponent;
      }
    }
    applyMixins(base, AnimationEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }

  addKeyFrame(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    frameToInsert: Index,
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

  deleteKeysAtFrame(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    frameToDelete: Index,
    fps: number
  ) {
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
        output.splice(i * animatedValue.getAnimationSampler(trackName).outputComponentN, animatedValue.getAnimationSampler(trackName).outputComponentN);
        animatedValue.getAnimationSampler(trackName).output = new Float32Array(output);
      }
    }

    return true;
  }

  hasKeyFramesAtFrame(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    frame: Index,
    fps: number
  ) {
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

  static setIsAnimating(flag: boolean) {
    this.isAnimating = flag;
  }

  _shallowCopyFrom(component_: Component): void {
    const component = component_ as AnimationComponent;

    this.__animationTrack = new Map(component.__animationTrack);
    this.__isEffekseerState = component.__isEffekseerState;
    this.__isAnimating = component.__isAnimating;
  }

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

        const input = animatedValue.getAnimationSampler(trackName).input;
        if (channel.target.pathName === 'translate') {
          const outputs = retargetTranslate(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(
            pathName as AnimationPathName,
            newAnimatedValue
          );
        }
        if (channel.target.pathName === 'quaternion') {
          const outputs = retargetQuaternion(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 4,
            interpolationMethod: animatedValue.getAnimationSampler(trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedQuaternion(samplers, trackName);
          this.setAnimation(
            pathName as AnimationPathName,
            newAnimatedValue
          );
        }
        if (channel.target.pathName === 'scale') {
          const outputs = retargetScale(input, srcAnim);
          const samplers = new Map<AnimationTrackName, AnimationSampler>();
          samplers.set(trackName, {
            input,
            output: outputs,
            outputComponentN: 3,
            interpolationMethod: animatedValue.getAnimationSampler(trackName).interpolationMethod,
          });
          const newAnimatedValue = new AnimatedVector3(samplers, trackName);
          this.setAnimation(
            pathName as AnimationPathName,
            newAnimatedValue
          );
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

  resetAnimationTracks() {
    this.__animationTrack.clear();
  }

  resetAnimationTrack(trackName: string) {
    for (const [pathName, channel] of this.__animationTrack) {
      channel.animatedValue.deleteAnimationSampler(trackName);
    }
  }

  resetAnimationTrackByPostfix(postfix: string) {
    const trackNames = this.getAnimationTrackNames();
    for (const trackName of trackNames) {
      if (trackName.endsWith(postfix)) {
        this.resetAnimationTrack(trackName);
      }
    }
  }

  _destroy(): void {
    super._destroy();
    this.__animationTrack.clear();
    this.__isAnimating = false;
  }
}
