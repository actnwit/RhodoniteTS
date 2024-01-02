import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { AnimationInterpolationEnum } from '../../definitions/AnimationInterpolation';
import { AnimationAttribute } from '../../definitions/AnimationAttribute';
import { TransformComponent } from '../Transform/TransformComponent';
import { ProcessStage } from '../../definitions/ProcessStage';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
  Index,
  Array4,
  Array3,
  VectorComponentN,
  Array1,
} from '../../../types/CommonTypes';
import {
  AnimationPathName,
  AnimationTrack,
  AnimationComponentEventType,
  AnimationInfo,
  AnimationTrackName,
  AnimationChannel,
} from '../../../types/AnimationTypes';
import {
  valueWithDefault,
  greaterThan,
  lessThan,
  valueWithCompensation,
} from '../../misc/MiscUtil';
import { EventPubSub, EventHandler } from '../../system/EventPubSub';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import { IAnimationEntity, ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { EffekseerComponent } from '../../../effekseer';
import { IAnimationRetarget, ISkeletalEntityMethods, SkeletalComponent } from '../Skeletal';
import { BlendShapeComponent } from '../BlendShape/BlendShapeComponent';
import { __interpolate } from './AnimationOps';
import { MathUtil } from '../../math';

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
  private __firstActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationTrackName?: AnimationTrackName; // for animation blending
  private __interpolationRatioBtwFirstAndSecond = 0; // the value range is [0,1]

  // Animation Data of each AnimationComponent
  private __animationTracks: Map<AnimationTrackName, AnimationTrack> = new Map();
  private static __animationGlobalInfo: Map<AnimationTrackName, AnimationInfo> = new Map();

  /// cache references of other components
  private __transformComponent?: TransformComponent;
  private __blendShapeComponent?: BlendShapeComponent;
  private __effekseerComponent?: EffekseerComponent;
  private __isEffekseerState = -1;

  /// flags ///
  private __isAnimating = true;
  static isAnimating = true;
  private isLoop = true;

  /**
   * @private
   */
  private _animationRetarget1st?: IAnimationRetarget;
  private _animationRetarget2nd?: IAnimationRetarget;

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
  private static __pubsub = new EventPubSub();
  private static __vector3Zero = Vector3.zero();
  private static __vector3One = Vector3.one();
  private static __identityQuaternion = Quaternion.identity();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);

    this.__currentProcessStage = ProcessStage.Create;
  }

  /// LifeCycle Methods ///

  $create() {
    this.__transformComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;
    this.__blendShapeComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      BlendShapeComponent
    ) as BlendShapeComponent;
    this.__effekseerComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      EffekseerComponent
    ) as EffekseerComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (!AnimationComponent.isAnimating || !this.isAnimating) {
      return;
    }

    if (Is.exist(this._animationRetarget1st) || Is.exist(this._animationRetarget2nd)) {
      this.__applyRetargetAnimation();
    } else {
      this.__applyAnimation();
    }
  }

  private __applyRetargetAnimation() {
    let position1st = AnimationComponent.__vector3Zero;
    let rotation1st = AnimationComponent.__identityQuaternion;
    let scale1st = AnimationComponent.__vector3One;
    let position2nd = AnimationComponent.__vector3Zero;
    let rotation2nd = AnimationComponent.__identityQuaternion;
    let scale2nd = AnimationComponent.__vector3One;
    if (Is.exist(this._animationRetarget1st)) {
      position1st = this._animationRetarget1st.retargetTranslate(this.entity as ISceneGraphEntity);
      rotation1st = this._animationRetarget1st.retargetQuaternion(
        this.entity as ISceneGraphEntity
      ) as Quaternion;
      scale1st = this._animationRetarget1st.retargetScale(this.entity as ISceneGraphEntity);
    }
    if (Is.exist(this._animationRetarget2nd)) {
      position2nd = this._animationRetarget2nd.retargetTranslate(this.entity as ISceneGraphEntity);
      rotation2nd = this._animationRetarget2nd.retargetQuaternion(
        this.entity as ISceneGraphEntity
      ) as Quaternion;
      scale2nd = this._animationRetarget2nd.retargetScale(this.entity as ISceneGraphEntity);
    }
    this.__transformComponent!.localPosition = Vector3.lerp(
      position1st,
      position2nd,
      this.__interpolationRatioBtwFirstAndSecond
    );
    this.__transformComponent!.localScale = Vector3.lerp(
      scale1st,
      scale2nd,
      this.__interpolationRatioBtwFirstAndSecond
    );
    this.__transformComponent!.localRotation = Quaternion.qlerp(
      rotation1st,
      rotation2nd,
      this.__interpolationRatioBtwFirstAndSecond
    );
  }

  private __applyAnimation() {
    let time = this.time;
    if (this.useGlobalTime) {
      if (this.isLoop) {
        const duration = this.getEndInputValueOfAnimation(this.__firstActiveAnimationTrackName!);
        time =
          (AnimationComponent.globalTime % duration) +
          this.getStartInputValueOfAnimation(this.__firstActiveAnimationTrackName!);
      } else {
        time = AnimationComponent.globalTime;
      }
    }

    // process the first active animation track
    if (
      Is.exist(this.__firstActiveAnimationTrackName) &&
      this.__interpolationRatioBtwFirstAndSecond < 1
    ) {
      const animationSetOf1st = this.__animationTracks.get(this.__firstActiveAnimationTrackName);
      if (animationSetOf1st !== undefined) {
        for (const [attributeName, channel] of animationSetOf1st) {
          const i = AnimationAttribute.fromString(attributeName).index;
          const value = __interpolate(channel, time, i);

          if (i === AnimationAttribute.Quaternion.index) {
            this.__transformComponent!.localRotation = Quaternion.fromCopyArray4(
              value as Array4<number>
            );
          } else if (i === AnimationAttribute.Translate.index) {
            this.__transformComponent!.localPosition = Vector3.fromCopyArray3(
              value as Array3<number>
            );
          } else if (i === AnimationAttribute.Scale.index) {
            this.__transformComponent!.localScale = Vector3.fromCopyArray3(value as Array3<number>);
          } else if (i === AnimationAttribute.Weights.index) {
            this.__blendShapeComponent!.weights = value;
          } else if (i === AnimationAttribute.Effekseer.index) {
            if (value[0] > 0.5) {
              if (this.__isEffekseerState === 0) {
                this.__effekseerComponent?.play();
              }
            } else {
              if (this.__isEffekseerState === 1) {
                this.__effekseerComponent?.pause();
              }
            }
            this.__isEffekseerState = value[0];
          }
        }
      }
    }

    // process the second active animation track, and blending with the first's one
    if (
      Is.exist(this.__secondActiveAnimationTrackName) &&
      this.__interpolationRatioBtwFirstAndSecond > 0
    ) {
      const animationSetOf2nd = this.__animationTracks.get(this.__secondActiveAnimationTrackName);
      if (animationSetOf2nd !== undefined) {
        for (const [attributeName, channel] of animationSetOf2nd) {
          const i = AnimationAttribute.fromString(attributeName).index;
          const value = __interpolate(channel, time, i);

          if (i === AnimationAttribute.Quaternion.index) {
            const quatOf2nd = Quaternion.fromCopyArray4(value as Array4<number>);
            this.__transformComponent!.localRotation = Quaternion.qlerp(
              this.__transformComponent!.localRotationInner,
              quatOf2nd,
              this.__interpolationRatioBtwFirstAndSecond
            );
          } else if (i === AnimationAttribute.Translate.index) {
            const vec3Of2nd = Vector3.fromCopyArray3(value as Array3<number>);
            this.__transformComponent!.localPosition = Vector3.lerp(
              this.__transformComponent!.localPositionInner,
              vec3Of2nd,
              this.__interpolationRatioBtwFirstAndSecond
            );
          } else if (i === AnimationAttribute.Scale.index) {
            const vec3of2nd = Vector3.fromCopyArray3(value as Array3<number>);
            this.__transformComponent!.localScale = Vector3.lerp(
              this.__transformComponent!.localScaleInner,
              vec3of2nd,
              this.__interpolationRatioBtwFirstAndSecond
            );
          } else if (i === AnimationAttribute.Weights.index) {
            const weightsOf2nd = value;
            for (let i = 0; i < weightsOf2nd.length; i++) {
              this.__blendShapeComponent!.weights[i] = MathUtil.lerp(
                this.__blendShapeComponent!.weights[i],
                weightsOf2nd[i],
                this.__interpolationRatioBtwFirstAndSecond
              );
            }
          } else if (i === AnimationAttribute.Effekseer.index) {
            // do nothing
          }
        }
      }
    }
  }

  static subscribe(type: AnimationComponentEventType, handler: EventHandler) {
    AnimationComponent.__pubsub.subscribe(type, handler);
  }

  setIsAnimating(flg: boolean) {
    this.__isAnimating = flg;
  }

  static setIsAnimatingForAll(flg: boolean) {
    const animationComponents = ComponentRepository._getComponents(
      AnimationComponent
    )! as AnimationComponent[];
    for (const animationComponent of animationComponents) {
      animationComponent.setIsAnimating(flg);
    }
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
    if (this.__animationTracks.has(animationTrackName)) {
      this.__firstActiveAnimationTrackName = animationTrackName;
      this.__secondActiveAnimationTrackName = undefined;
      return true;
    } else {
      return false;
    }
  }

  static setActiveAnimationsForAll(
    animationTrackName: AnimationTrackName,
    secondTrackName: AnimationTrackName,
    interpolationRatioBtwFirstAndSecond: number
  ) {
    const components = ComponentRepository.getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimationTracks(
        animationTrackName,
        secondTrackName,
        interpolationRatioBtwFirstAndSecond
      );
    }
  }

  setActiveAnimationTracks(
    firstTrackName: AnimationTrackName,
    secondTrackName: AnimationTrackName,
    interpolationRatioBtwFirstAndSecond: number
  ) {
    if (this.__animationTracks.has(firstTrackName) && this.__animationTracks.has(secondTrackName)) {
      this.__firstActiveAnimationTrackName = firstTrackName;
      this.__secondActiveAnimationTrackName = secondTrackName;
      this.__interpolationRatioBtwFirstAndSecond = interpolationRatioBtwFirstAndSecond;
      return true;
    } else {
      return false;
    }
  }

  set interpolationRatioBtwFirstAndSecond(ratio: number) {
    this.__interpolationRatioBtwFirstAndSecond = ratio;
  }

  getActiveAnimationTrack() {
    return this.__firstActiveAnimationTrackName;
  }

  hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean {
    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);

    if (Is.not.exist(animationSet)) {
      return false;
    }

    return animationSet.has(pathName);
  }

  /**
   * set an animation channel to AnimationSet
   * @param trackName - the name of animation track
   * @param pathName - the name of animation path
   * @param inputArray - the array of input values
   * @param outputArray - the array of output values
   * @param outputComponentN - the number of output value's components
   * @param interpolation - the interpolation type
   * @param makeThisActiveAnimation - if true, set this animation track as current active animation
   */
  setAnimation(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    inputArray: Float32Array,
    outputArray: Float32Array,
    outputComponentN: VectorComponentN,
    interpolation: AnimationInterpolationEnum,
    makeThisActiveAnimation = true
  ) {
    // set the current Active AnimationTrackName
    if (makeThisActiveAnimation) {
      this.__firstActiveAnimationTrackName = trackName;
    } else {
      this.__firstActiveAnimationTrackName = valueWithDefault({
        value: this.__firstActiveAnimationTrackName,
        defaultValue: trackName,
      });
    }

    // set an animation channel to AnimationSet
    const animationSet: Map<AnimationPathName, AnimationChannel> = valueWithCompensation({
      value: this.__animationTracks.get(trackName),
      compensation: () => {
        const animationSet = new Map();
        this.__animationTracks.set(trackName, animationSet);
        return animationSet;
      },
    });
    const channel: AnimationChannel = {
      sampler: {
        input: inputArray,
        output: outputArray,
        outputComponentN,
        interpolationMethod: interpolation,
      },
      target: {
        pathName: pathName,
        entity: this.entity,
      },
      belongTrackName: trackName,
    };
    animationSet.set(pathName, channel);

    // update AnimationInfo
    const newMinStartInputTime = inputArray[0];
    const newMaxEndInputTime = inputArray[inputArray.length - 1];

    // const existingAnimationInfo = valueWithDefault<AnimationInfo>({
    //   value: AnimationComponent.__animationGlobalInfo.get(trackName),
    //   defaultValue: defaultAnimationInfo,
    // });
    // const existingMaxStartInputTime = existingAnimationInfo.minStartInputTime;
    // const existingMaxEndInputTime = existingAnimationInfo.maxEndInputTime;

    // const startResult = lessThan(existingMaxStartInputTime, newMaxStartInputTime);
    // const endResult = greaterThan(newMaxEndInputTime, existingMaxEndInputTime);
    // if (startResult.result || endResult.result) {
    const info = {
      name: trackName,
      minStartInputTime: newMinStartInputTime,
      maxEndInputTime: newMaxEndInputTime,
    };
    AnimationComponent.__animationGlobalInfo.set(trackName, info);
    AnimationComponent.__pubsub.publishAsync(AnimationComponent.Event.ChangeAnimationInfo, {
      infoMap: new Map(AnimationComponent.__animationGlobalInfo),
    });
    // }

    // backup the current transform as rest pose
    this.entity.getTransform()._backupTransformAsRest();
  }

  public getStartInputValueOfAnimation(animationTrackName: string): number {
    let maxStartInputTime = Number.MAX_VALUE;

    const animationTrack = this.__animationTracks.get(animationTrackName);
    if (Is.not.exist(animationTrack)) {
      return -1;
    }

    animationTrack.forEach((channel) => {
      const input = channel.sampler.input[0];
      if (input < maxStartInputTime) {
        maxStartInputTime = input;
      }
    });

    return maxStartInputTime;
  }

  public getEndInputValueOfAnimation(animationTrackName: string): number {
    const animationTrack = this.__animationTracks.get(animationTrackName);
    if (Is.not.exist(animationTrack)) {
      return -1;
    }
    let maxEndInputTime = 0;
    animationTrack.forEach((channel) => {
      const input = channel.sampler.input[channel.sampler.input.length - 1];
      if (maxEndInputTime < input) {
        maxEndInputTime = input;
      }
    });

    return maxEndInputTime;
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
    return Array.from(this.__animationTracks.keys());
  }

  /**
   * get the animation channels of the animation track
   * @param animationTrackName the name of animation track to get
   * @returns the channel maps of the animation track
   */
  public getAnimationChannelsOfTrack(
    animationTrackName: AnimationTrackName
  ): AnimationTrack | undefined {
    return this.__animationTracks.get(animationTrackName);
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

    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      return false;
    }

    const channel = animationSet.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    const i = AnimationAttribute.fromString(pathName).index;
    const output = __interpolate(channel, AnimationComponent.globalTime, i);

    if (channel.sampler.input.length === 0) {
      const inputArray = Array.from(channel.sampler.input);
      inputArray.push(input);
      channel.sampler.input = new Float32Array(inputArray);
      const outputArray = Array.from(channel.sampler.output);
      outputArray.push(...output);
      channel.sampler.output = new Float32Array(outputArray);
    } else if (channel.sampler.input.length === 1) {
      const existedInput = channel.sampler.input[0];
      if (secEnd < existedInput) {
        const inputArray = Array.from(channel.sampler.input);
        inputArray.unshift(input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.unshift(...output);
        channel.sampler.output = new Float32Array(outputArray);
      } else if (existedInput < secBegin) {
        const inputArray = Array.from(channel.sampler.input);
        inputArray.push(input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.push(...output);
        channel.sampler.output = new Float32Array(outputArray);
      } else {
        // secBegin <= existedInput <= secEnd
        const inputArray = Array.from(channel.sampler.input);
        inputArray.splice(0, 0, input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.splice(0, 0, ...output);
        channel.sampler.output = new Float32Array(outputArray);
      }
    } else {
      // channel.sampler.input.length >= 2
      for (let i = 0; i < channel.sampler.input.length; i++) {
        const existedInput = channel.sampler.input[i];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            channel.sampler.input[i] = input;
            for (let j = 0; j < channel.sampler.outputComponentN; j++) {
              channel.sampler.output[i * channel.sampler.outputComponentN + j] = output[j];
            }
          } else {
            const inputArray = Array.from(channel.sampler.input);
            inputArray.splice(i, 0, input);
            channel.sampler.input = new Float32Array(inputArray);
            const outputArray = Array.from(channel.sampler.output);
            outputArray.splice(i * channel.sampler.outputComponentN, 0, ...output);
            channel.sampler.output = new Float32Array(outputArray);
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

    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      return false;
    }

    const channel = animationSet.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    if (channel.sampler.input.length === 0) {
      const inputArray = Array.from(channel.sampler.input);
      inputArray.push(input);
      channel.sampler.input = new Float32Array(inputArray);
      const outputArray = Array.from(channel.sampler.output);
      outputArray.push(...output);
      channel.sampler.output = new Float32Array(outputArray);
    } else if (channel.sampler.input.length === 1) {
      const existedInput = channel.sampler.input[0];
      if (secEnd < existedInput) {
        const inputArray = Array.from(channel.sampler.input);
        inputArray.unshift(input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.unshift(...output);
        channel.sampler.output = new Float32Array(outputArray);
      } else if (existedInput < secBegin) {
        const inputArray = Array.from(channel.sampler.input);
        inputArray.push(input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.push(...output);
        channel.sampler.output = new Float32Array(outputArray);
      } else {
        // secBegin <= existedInput <= secEnd
        const inputArray = Array.from(channel.sampler.input);
        inputArray.splice(0, 0, input);
        channel.sampler.input = new Float32Array(inputArray);
        const outputArray = Array.from(channel.sampler.output);
        outputArray.splice(0, 0, ...output);
        channel.sampler.output = new Float32Array(outputArray);
      }
    } else {
      // channel.sampler.input.length >= 2
      for (let i = 0; i < channel.sampler.input.length; i++) {
        const existedInput = channel.sampler.input[i];
        if (secBegin <= existedInput) {
          if (secBegin <= existedInput && existedInput <= secEnd) {
            channel.sampler.input[i] = input;
            for (let j = 0; j < channel.sampler.outputComponentN; j++) {
              channel.sampler.output[i * channel.sampler.outputComponentN + j] = output[j];
            }
          } else {
            const inputArray = Array.from(channel.sampler.input);
            inputArray.splice(i, 0, input);
            channel.sampler.input = new Float32Array(inputArray);
            const outputArray = Array.from(channel.sampler.output);
            outputArray.splice(i * channel.sampler.outputComponentN, 0, ...output);
            channel.sampler.output = new Float32Array(outputArray);
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

    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      return false;
    }

    const channel = animationSet.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    for (let i = 0; i < channel.sampler.input.length; i++) {
      const input = channel.sampler.input[i];
      if (secBegin <= input && input < secEnd) {
        const input = Array.from(channel.sampler.input);
        input.splice(i, 1);
        channel.sampler.input = new Float32Array(input);
        const output = Array.from(channel.sampler.output);
        output.splice(i * channel.sampler.outputComponentN, channel.sampler.outputComponentN);
        channel.sampler.output = new Float32Array(output);
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

    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      return false;
    }

    const channel = animationSet.get(pathName);
    if (Is.not.exist(channel)) {
      return false;
    }

    for (let i = 0; i < channel.sampler.input.length; i++) {
      const input = channel.sampler.input[i];
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

    this.__firstActiveAnimationTrackName = component.__firstActiveAnimationTrackName;
    this.__animationTracks = new Map(component.__animationTracks);
    this.__isEffekseerState = component.__isEffekseerState;
    this.__isAnimating = component.__isAnimating;
    this._animationRetarget1st = component._animationRetarget1st;
    this._animationRetarget2nd = component._animationRetarget2nd;
  }

  setAnimationRetarget(retarget1st: IAnimationRetarget) {
    this._animationRetarget1st = retarget1st;

    this.__transformComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;

    this.__transformComponent?._backupTransformAsRest();
  }

  setAnimationRetarget2nd(retarget2nd: IAnimationRetarget) {
    this._animationRetarget2nd = retarget2nd;

    this.__transformComponent = EntityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;

    this.__transformComponent?._backupTransformAsRest();
  }

  getInputArray(
    trackName: AnimationTrackName,
    pathName: AnimationPathName
  ): Float32Array | undefined {
    const animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      return undefined;
    }

    const channel = animationSet.get(pathName);
    if (Is.not.exist(channel)) {
      return undefined;
    }

    return channel.sampler.input;
  }
}
ComponentRepository.registerComponentClass(AnimationComponent);
