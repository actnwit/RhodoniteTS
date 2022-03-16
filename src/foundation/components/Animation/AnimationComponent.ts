import Component from '../../core/Component';
import ComponentRepository from '../../core/ComponentRepository';
import EntityRepository, {applyMixins} from '../../core/EntityRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {
  AnimationInterpolationEnum,
  AnimationInterpolation,
} from '../../definitions/AnimationInterpolation';
import {AnimationAttribute} from '../../definitions/AnimationAttribute';
import TransformComponent from '../Transform/TransformComponent';
import {ProcessStage} from '../../definitions/ProcessStage';
import MeshComponent from '../Mesh/MeshComponent';
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
import {valueWithDefault, greaterThan, lessThan} from '../../misc/MiscUtil';
import {EventPubSub, EventHandler} from '../../system/EventPubSub';
import {IVector, IVector3} from '../../math/IVector';
import {IQuaternion} from '../../math/IQuaternion';
import Quaternion from '../../math/Quaternion';
import {
  array3_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
  get1_offset,
  get1_offsetAsComposition,
  get3_offset,
  get3_offsetAsComposition,
  get4_offset,
  get4_offsetAsComposition,
  getN_offset,
  getN_offsetAsComposition,
  mulArray3WithScalar_offset,
  mulArray4WithScalar_offset,
  mulArrayNWithScalar_offset,
  normalizeArray4,
  qlerp_offsetAsComposition,
} from '../../math/raw/raw_extension';
import Vector3 from '../../math/Vector3';
import {Is} from '../../misc/Is';
import {IAnimationEntity} from '../../helpers/EntityHelper';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';

const defaultAnimationInfo = {
  name: '',
  maxStartInputTime: 0,
  maxEndInputTime: 0,
};

const ChangeAnimationInfo = Symbol(
  'AnimationComponentEventChangeAnimationInfo'
);
const PlayEnd = Symbol('AnimationComponentEventPlayEnd');

export default class AnimationComponent extends Component {
  /// inner states ///
  private __backupDefaultValues: Map<
    AnimationPathName,
    IVector | IQuaternion | number[]
  > = new Map();

  // The name of the current Active Track
  private __currentActiveAnimationTrackName?: AnimationTrackName;

  // Animation Data of each AnimationComponent
  private __animationTracks: Map<AnimationTrackName, AnimationTrack> =
    new Map();

  /// cache references of other components
  private __transformComponent?: TransformComponent;
  private __meshComponent?: MeshComponent;

  /// flags ///
  private __isAnimating = true;

  /// Static Members ///

  // Global animation time in Rhodonite
  public static globalTime = 0;

  // Event for pubsub of notifications
  public static readonly Event = {
    ChangeAnimationInfo,
    PlayEnd,
  };
  // TODO: fix the conflict possibilities of AnimationTrackNames btw components
  private static __animationGlobalInfo: Map<AnimationTrackName, AnimationInfo> =
    new Map();
  private static __pubsub = new EventPubSub();
  private static __componentRepository: ComponentRepository =
    ComponentRepository.getInstance();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);

    this.__currentProcessStage = ProcessStage.Create;
  }

  /// LifeCycle Methods ///

  $create() {
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      MeshComponent
    ) as MeshComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (
      this.isAnimating &&
      this.__currentActiveAnimationTrackName !== undefined
    ) {
      const animationSet = this.__animationTracks.get(
        this.__currentActiveAnimationTrackName
      );
      if (animationSet !== undefined) {
        for (const [attributeName, channel] of animationSet) {
          const i = AnimationAttribute.fromString(attributeName).index;
          const value = AnimationComponent.__interpolate(
            channel,
            AnimationComponent.globalTime,
            i
          );
          if (i === AnimationAttribute.Quaternion.index) {
            this.__transformComponent!.quaternion = Quaternion.fromCopyArray4(
              value as Array4<number>
            );
          } else if (i === AnimationAttribute.Translate.index) {
            this.__transformComponent!.translate = Vector3.fromCopyArray3(
              value as Array3<number>
            );
          } else if (i === AnimationAttribute.Scale.index) {
            this.__transformComponent!.scale = Vector3.fromCopyArray3(
              value as Array3<number>
            );
          } else if (i === AnimationAttribute.Weights.index) {
            this.__meshComponent!.weights = value;
          }
        }
      }
    }
  }

  static subscribe(type: AnimationComponentEventType, handler: EventHandler) {
    AnimationComponent.__pubsub.subscribe(type, handler);
  }

  /**
   * Compute cubic spline interpolation.
   * @param p_0 starting point
   * @param p_1 ending point
   * @param m_0 inTangent
   * @param m_1 outTangent
   * @param t ratio
   * @param animationAttributeIndex index of attribution
   */

  static cubicSpline(
    p0: Array<number>,
    p1: Array<number>,
    m0: Array<number>,
    m1: Array<number>,
    t: number
  ): Array<number> {
    const ret = new Array(p0.length);
    for (let i = 0; i < p0.length; i++) {
      ret[i] =
        (2 * t ** 3 - 3 * t ** 2 + 1) * p0[i] +
        (t ** 3 - 2 * t ** 2 + t) * m0[i] +
        (-2 * t ** 3 + 3 * t ** 2) * p1[i] +
        (t ** 3 - t ** 2) * m1[i];
    }
    return ret;
  }

  static binarySearch(inputArray: Float32Array, currentTime: number) {
    let low = 0;
    let high = inputArray.length - 1;
    let mid = 0;
    let retVal = 0;
    while (low <= high) {
      mid = low + ((high - low) >> 1);

      if (inputArray[mid] < currentTime) {
        low = mid + 1;
        retVal = mid;
      } else if (currentTime < inputArray[mid]) {
        high = mid - 1;
        retVal = high;
      } else {
        // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static interpolationSearch(inputArray: Float32Array | number[], currentTime: number) {
    let mid = 0;
    let lower = 0;
    let upper = inputArray.length - 1;
    let retVal = 0;

    while (
      lower <= upper &&
      currentTime >= inputArray[lower] &&
      currentTime <= inputArray[upper]
    ) {
      mid = Math.floor(
        lower +
          ((currentTime - inputArray[lower]) * (upper - lower)) /
            (inputArray[upper] - inputArray[lower])
      );

      if (inputArray[mid] < currentTime) {
        lower = mid + 1;
        retVal = mid;
      } else if (currentTime < inputArray[mid]) {
        upper = mid - 1;
        retVal = upper;
      } else {
        // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static bruteForceSearch(inputArray: Float32Array, currentTime: number) {
    for (let i = 0; i < inputArray.length; i++) {
      if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
        return i;
      }
    }
    return inputArray.length - 1;
  }

  private restoreDefaultValues() {
    this.__transformComponent!.quaternion = this.__backupDefaultValues.get(
      AnimationAttribute.Quaternion.str as AnimationPathName
    ) as Quaternion;

    this.__transformComponent!.translate = this.__backupDefaultValues.get(
      AnimationAttribute.Translate.str as AnimationPathName
    ) as IVector3;
    this.__transformComponent!.scale = this.__backupDefaultValues.get(
      AnimationAttribute.Scale.str as AnimationPathName
    ) as IVector3;
    if (this.__meshComponent != null) {
      this.__meshComponent!.weights = this.__backupDefaultValues.get(
        AnimationAttribute.Weights.str as AnimationPathName
      ) as number[];
    }
  }

  private backupDefaultValues() {
    this.__backupDefaultValues.set(
      AnimationAttribute.Quaternion.str as AnimationPathName,
      this.__transformComponent!.quaternion
    );
    this.__backupDefaultValues.set(
      AnimationAttribute.Translate.str as AnimationPathName,
      this.__transformComponent!.translate
    );
    this.__backupDefaultValues.set(
      AnimationAttribute.Scale.str as AnimationPathName,
      this.__transformComponent!.scale
    );
    if (this.__meshComponent != null) {
      this.__backupDefaultValues.set(
        AnimationAttribute.Weights.str as AnimationPathName,
        this.__meshComponent?.weights
      );
    }
  }

  setAnimating(flg: boolean) {
    this.__isAnimating = flg;
  }

  setAnimationToRest() {
    this.restoreDefaultValues();
  }

  static setAnimatingForAll(flg: boolean) {
    const animationComponents = this.__componentRepository._getComponents(
      AnimationComponent
    )! as AnimationComponent[];
    for (const animationComponent of animationComponents) {
      animationComponent.setAnimating(flg);
    }
  }

  static setActiveAnimationForAll(animationName: AnimationTrackName) {
    const components = ComponentRepository.getInstance().getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimationTrack(animationName);
    }
  }

  setActiveAnimationTrack(animationName: AnimationTrackName) {
    if (this.__animationTracks.has(animationName)) {
      this.__currentActiveAnimationTrackName = animationName;
      return true;
    } else {
      return false;
    }
  }

  getActiveAnimationTrack() {
    return this.__currentActiveAnimationTrackName;
  }

  setAnimation(
    trackName: AnimationTrackName,
    pathName: AnimationPathName,
    inputArray: Float32Array,
    outputArray: Float32Array,
    outputComponentN: VectorComponentN,
    interpolation: AnimationInterpolationEnum,
    makeThisActiveAnimation = true
  ) {
    if (makeThisActiveAnimation) {
      this.__currentActiveAnimationTrackName = trackName;
    } else {
      this.__currentActiveAnimationTrackName = valueWithDefault({
        value: this.__currentActiveAnimationTrackName,
        defaultValue: trackName,
      });
    }

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

    // set AnimationSet
    let animationSet: Map<AnimationPathName, AnimationChannel> | undefined =
      this.__animationTracks.get(trackName);
    if (Is.not.exist(animationSet)) {
      animationSet = new Map();
      this.__animationTracks.set(trackName, animationSet);
    }

    animationSet.set(pathName, channel);

    // set AnimationInfo
    const newMaxStartInputTime = inputArray[0];
    const newMaxEndInputTime = inputArray[inputArray.length - 1];

    const existingAnimationInfo = valueWithDefault<AnimationInfo>({
      value: AnimationComponent.__animationGlobalInfo.get(trackName),
      defaultValue: defaultAnimationInfo,
    });
    const existingMaxStartInputTime = existingAnimationInfo.maxStartInputTime;
    const existingMaxEndInputTime = existingAnimationInfo.maxEndInputTime;

    // eslint-disable-next-line prettier/prettier
    const startResult = lessThan(existingMaxStartInputTime, newMaxStartInputTime);
    const endResult = greaterThan(newMaxEndInputTime, existingMaxEndInputTime);
    if (startResult.result || endResult.result) {
      const info = {
        name: trackName,
        maxStartInputTime: startResult.less,
        maxEndInputTime: endResult.greater,
      };
      AnimationComponent.__animationGlobalInfo.set(trackName, info);
      AnimationComponent.__pubsub.publishAsync(
        AnimationComponent.Event.ChangeAnimationInfo,
        {infoMap: new Map(AnimationComponent.__animationGlobalInfo)}
      );
    }

    this.__transformComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      MeshComponent
    ) as MeshComponent;
    this.backupDefaultValues();
  }

  public getStartInputValueOfAnimation(animationTrackName?: string): number {
    const name = animationTrackName ?? this.__currentActiveAnimationTrackName;
    if (name === undefined) {
      const array = Array.from(
        AnimationComponent.__animationGlobalInfo.values()
      );
      if (array.length === 0) {
        return 0;
      }
      const firstAnimationInfo = array[0] as unknown as AnimationInfo;
      return firstAnimationInfo.maxEndInputTime;
    }
    const maxStartInputTime = valueWithDefault<AnimationInfo>({
      value: AnimationComponent.__animationGlobalInfo.get(name),
      defaultValue: defaultAnimationInfo,
    }).maxStartInputTime;

    return maxStartInputTime;
  }

  public getEndInputValueOfAnimation(animationTrackName?: string): number {
    const name = animationTrackName ?? this.__currentActiveAnimationTrackName;

    if (name === undefined) {
      const array = Array.from(
        AnimationComponent.__animationGlobalInfo.values()
      );
      if (array.length === 0) {
        return 0;
      }
      const firstAnimationInfo = array[0] as unknown as AnimationInfo;
      return firstAnimationInfo.maxEndInputTime;
    }
    const maxEndInputTime = valueWithDefault<AnimationInfo>({
      value: AnimationComponent.__animationGlobalInfo.get(name),
      defaultValue: defaultAnimationInfo,
    }).maxEndInputTime;

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
    const components = ComponentRepository.getInstance().getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationGlobalInfo.values());
      const lastInfo = infoArray[infoArray.length - 1];
      return lastInfo.maxStartInputTime;
    }
  }

  static get endInputValue() {
    const components = ComponentRepository.getInstance().getComponentsWithType(
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

  static get isAnimating() {
    const components = ComponentRepository.getInstance().getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];

    for (const component of components) {
      if (component.isAnimating) {
        return true;
      }
    }
    return false;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  private static __prepareVariablesForCubicSpline(
    outputArray_: Float32Array | number[],
    i: number,
    componentN: number,
    t_diff: number
  ): {
    p_0: Array<number>;
    p_1: Array<number>;
    m_0: Array<number>;
    m_1: Array<number>;
  } {
    const outputArray = outputArray_ as globalThis.Float32Array;

    if (componentN === 4) {
      const p_0 = outputArray[get4_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * i + componentN
      );
      const p_1 = outputArray[get4_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * (i + 1) + componentN
      );
      const m_0 = outputArray[mulArray4WithScalar_offset](
        componentN * 3 * i + componentN * 2,
        t_diff
      );
      const m_1 = outputArray[mulArray4WithScalar_offset](
        componentN * 3 * (i + 1),
        t_diff
      );
      return {p_0, p_1, m_0, m_1};
    } else if (componentN === 3) {
      const p_0 = outputArray[get3_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * i + componentN
      ) as Array<number>;
      const p_1 = outputArray[get3_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * (i + 1) + componentN
      ) as Array<number>;
      const m_0 = outputArray[mulArray3WithScalar_offset](
        componentN * 3 * i + componentN * 2,
        t_diff
      ) as Array<number>;
      const m_1 = outputArray[mulArray3WithScalar_offset](
        componentN * 3 * (i + 1),
        t_diff
      ) as Array<number>;
      return {p_0, p_1, m_0, m_1};
    } else {
      const p_0 = outputArray[getN_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * i + componentN,
        componentN
      );
      const p_1 = outputArray[getN_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
        componentN * 3 * (i + 1) + componentN,
        componentN
      );
      const m_0 = outputArray[mulArrayNWithScalar_offset](
        componentN * 3 * i + componentN * 2,
        componentN,
        t_diff
      ) as Array<number>;
      const m_1 = outputArray[mulArrayNWithScalar_offset](
        componentN * 3 * (i + 1),
        componentN,
        t_diff
      ) as Array<number>;
      return {p_0, p_1, m_0, m_1};
    }
  }

  private static __getOutputValue(
    keyFrameId: Index,
    channel: AnimationChannel,
    array_: Float32Array | number[]
  ) {
    const array = array_ as globalThis.Float32Array;
    if (
      channel.sampler.interpolationMethod === AnimationInterpolation.CubicSpline
    ) {
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…an,v1,v2,…vn,b1,b2,…bn
      if (channel.sampler.outputComponentN === 4) {
        // Quaternion/weights
        const value = array[get4_offset](
          channel.sampler.outputComponentN * 3 * keyFrameId +
            channel.sampler.outputComponentN
        ) as Array4<number>;
        return value;
      } else if (channel.sampler.outputComponentN === 3) {
        // Translate/Scale/weights
        const value = array[get3_offset](
          channel.sampler.outputComponentN * 3 * keyFrameId +
            channel.sampler.outputComponentN
        ) as Array3<number>;
        return value;
      } else if (channel.sampler.outputComponentN === 1) {
        const value = array[get1_offset](
          channel.sampler.outputComponentN * 3 * keyFrameId +
            channel.sampler.outputComponentN
        ) as Array1<number>;
        return value;
      } else {
        // weights // outputComponentN === N
        const value = array[getN_offset](
          channel.sampler.outputComponentN * 3 * keyFrameId +
            channel.sampler.outputComponentN,
          channel.sampler.outputComponentN
        ) as Array<number>;
        return value;
      }
    } else {
      // For Other than CUBICSPLINE interpolation
      if (channel.sampler.outputComponentN === 4) {
        // Quaternion/weights
        const value = array[get4_offsetAsComposition](
          keyFrameId
        ) as Array4<number>;
        return value;
      } else if (channel.sampler.outputComponentN === 3) {
        // Translate/Scale/weights
        const value = array[get3_offsetAsComposition](
          keyFrameId
        ) as Array3<number>;
        return value;
      } else if (channel.sampler.outputComponentN === 1) {
        // Effekseer (Animation Event)
        const value = array[get1_offsetAsComposition](
          keyFrameId
        ) as Array1<number>;
        return value;
      } else {
        // weights
        const value = array[getN_offsetAsComposition](
          keyFrameId,
          channel.sampler.outputComponentN
        ) as Array<number>;
        return value;
      }
    }
  }

  private static __lerp(
    data_: Float32Array | number[],
    ratio: number,
    animationAttributeIndex: Index,
    i: Index,
    outputComponentN: number
  ) {
    const data = data_ as globalThis.Float32Array;
    if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
      const array4 = data[qlerp_offsetAsComposition](data, ratio, i, i + 1);
      return array4;
    } else if (animationAttributeIndex === AnimationAttribute.Weights.index) {
      const arrayN = data[arrayN_lerp_offsetAsComposition](
        data,
        outputComponentN,
        ratio,
        i,
        i + 1
      );
      return arrayN;
    } else {
      // Translate / Scale
      const array3 = data[array3_lerp_offsetAsComposition](
        data,
        ratio,
        i,
        i + 1
      );
      return array3;
    }
  }

  private static __interpolate(
    channel: AnimationChannel,
    currentTime: number,
    animationAttributeIndex: Index
  ): Array<number> {
    const inputArray = channel.sampler.input;
    const outputArray = channel.sampler.output;
    const method =
      channel.sampler.interpolationMethod ?? AnimationInterpolation.Linear;

    // out of range
    if (currentTime <= inputArray[0]) {
      const outputOfZeroFrame = this.__getOutputValue(0, channel, outputArray);
      return outputOfZeroFrame;
    } else if (inputArray[inputArray.length - 1] <= currentTime) {
      const outputOfEndFrame = this.__getOutputValue(
        inputArray.length - 1,
        channel,
        outputArray
      );
      return outputOfEndFrame;
    }

    if (method === AnimationInterpolation.CubicSpline) {
      // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation
      const i = this.interpolationSearch(inputArray, currentTime);
      const t_diff = inputArray[i + 1] - inputArray[i]; // t_(k+1) - t_k
      const t = (currentTime - inputArray[i]) / t_diff;
      const {p_0, p_1, m_0, m_1} = this.__prepareVariablesForCubicSpline(
        outputArray,
        i,
        channel.sampler.outputComponentN,
        t_diff
      );
      const ret = this.cubicSpline(
        p_0,
        p_1,
        m_0,
        m_1,
        t
      ) as globalThis.Array<number>;
      if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
        (ret as any)[normalizeArray4]();
      }
      return ret;
    } else if (method === AnimationInterpolation.Linear) {
      const i = this.interpolationSearch(inputArray, currentTime);
      const ratio =
        (currentTime - inputArray[i]) / (inputArray[i + 1] - inputArray[i]);
      const ret = this.__lerp(
        outputArray,
        ratio,
        animationAttributeIndex,
        i,
        channel.sampler.outputComponentN
      );
      return ret as Array<number>;
    } else if (method === AnimationInterpolation.Step) {
      for (let i = 0; i < inputArray.length - 1; i++) {
        if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
          const output_frame_i = this.__getOutputValue(i, channel, outputArray);
          return output_frame_i;
        }
      }
      const outputOfEndFrame = this.__getOutputValue(
        inputArray.length - 1,
        channel,
        outputArray
      );
      return outputOfEndFrame;
    }

    // non supported type
    return [];
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IAnimationEntity {
    return this.__entityRepository.getEntity(
      this.__entityUid
    ) as unknown as IAnimationEntity;
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class AnimationEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
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
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}
ComponentRepository.registerComponentClass(AnimationComponent);
