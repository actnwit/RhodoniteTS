import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import EntityRepository from '../core/EntityRepository';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import {
  AnimationInterpolationEnum,
  AnimationInterpolation,
} from '../definitions/AnimationInterpolation';
import {AnimationAttribute} from '../definitions/AnimationAttribute';
import TransformComponent from './TransformComponent';
import {ProcessStage} from '../definitions/ProcessStage';
import MutableVector3 from '../math/MutableVector3';
import MutableQuaternion from '../math/MutableQuaternion';
import MeshComponent from './MeshComponent';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
  Index,
  TypedArray as Float32Array,
  AnimationAttributeType,
  Array4,
  Array3,
} from '../../types/CommonTypes';
import {
  defaultValue,
  greaterThan,
  lessThan,
  valueWithCompensation,
} from '../misc/MiscUtil';
import {EventPubSub, EventHandler} from '../system/EventPubSub';
import {IVector, IVector3} from '../math/IVector';
import {IQuaternion} from '../math/IQuaternion';
import Quaternion from '../math/Quaternion';
import {
  array3_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
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
} from '../math/raw/raw_extension';
import Vector3 from '../math/Vector3';

export type AnimationName = string;
type TimeInSec = number;

export interface AnimationInfo {
  name: AnimationName;
  maxStartInputTime: TimeInSec;
  maxEndInputTime: TimeInSec;
}

interface AnimationLine {
  name: AnimationName;
  input: Float32Array;
  output: Float32Array;
  outputAttributeName: AnimationAttributeType;
  outputComponentN: number;
  interpolationMethod: AnimationInterpolationEnum;
  targetEntityUid?: EntityUID;
}

type AnimationSet = Map<AnimationAttributeType, AnimationLine>;

export interface ChangeAnimationInfoEvent {
  infoMap: Map<AnimationName, AnimationInfo>;
}

const defaultAnimationInfo = {
  name: '',
  maxStartInputTime: 0,
  maxEndInputTime: 0,
};

const ChangeAnimationInfo = Symbol(
  'AnimationComponentEventChangeAnimationInfo'
);
const PlayEnd = Symbol('AnimationComponentEventPlayEnd');
type AnimationComponentEventType = symbol;

export default class AnimationComponent extends Component {
  private __backupDefaultValues: Map<
    AnimationAttributeType,
    IVector | IQuaternion | number[]
  > = new Map();
  private __currentActiveAnimationName?: AnimationName;
  private __animationData: Map<AnimationName, AnimationSet> = new Map();
  public static globalTime = 0;
  private __isAnimating = true;
  private __transformComponent?: TransformComponent;
  private __meshComponent?: MeshComponent;
  private static __componentRepository: ComponentRepository =
    ComponentRepository.getInstance();
  private static __animationInfo: Map<AnimationName, AnimationInfo> = new Map();
  private static __pubsub = new EventPubSub();
  static Event = {
    ChangeAnimationInfo,
    PlayEnd,
  };

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);

    this.__currentProcessStage = ProcessStage.Create;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  static setActiveAnimationForAll(animationName: AnimationName) {
    const components = ComponentRepository.getInstance().getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    for (const component of components) {
      component.setActiveAnimation(animationName);
    }
  }

  setActiveAnimation(animationName: AnimationName) {
    if (this.__animationData.has(animationName)) {
      this.__currentActiveAnimationName = animationName;
      return true;
    } else {
      this.__currentActiveAnimationName = undefined;
      return false;
    }
  }

  setAnimation(
    animationName: string,
    attributeName: AnimationAttributeType,
    animationInputArray: Float32Array,
    animationOutputArray: Float32Array,
    outputComponentN: number,
    interpolation: AnimationInterpolationEnum,
    makeThisActiveAnimation = true
  ) {
    if (makeThisActiveAnimation) {
      this.__currentActiveAnimationName = animationName;
    } else {
      this.__currentActiveAnimationName = defaultValue(
        animationName,
        this.__currentActiveAnimationName
      );
    }

    const line: AnimationLine = {
      name: animationName,
      input: animationInputArray,
      output: animationOutputArray,
      outputComponentN: outputComponentN,
      outputAttributeName: attributeName,
      interpolationMethod: interpolation,
    };

    // set AnimationSet
    const animationSet = valueWithCompensation({
      value: this.__animationData.get(animationName),
      compensation: () => {
        const map = new Map();
        this.__animationData.set(animationName, map);
        return map;
      },
    });

    animationSet.set(attributeName, line);

    // set AnimationInfo
    const newMaxStartInputTime = animationInputArray[0];
    const newMaxEndInputTime =
      animationInputArray[animationInputArray.length - 1];

    const existingAnimationInfo = defaultValue<AnimationInfo>(
      defaultAnimationInfo,
      AnimationComponent.__animationInfo.get(animationName)
    );
    const existingMaxStartInputTime = existingAnimationInfo.maxStartInputTime;
    const existingMaxEndInputTime = existingAnimationInfo.maxEndInputTime;

    // eslint-disable-next-line prettier/prettier
    const startResult = lessThan(existingMaxStartInputTime, newMaxStartInputTime);
    const endResult = greaterThan(newMaxEndInputTime, existingMaxEndInputTime);
    if (startResult.result || endResult.result) {
      const info = {
        name: animationName,
        maxStartInputTime: startResult.less,
        maxEndInputTime: endResult.greater,
      };
      AnimationComponent.__animationInfo.set(animationName, info);
      AnimationComponent.__pubsub.publishAsync(
        AnimationComponent.Event.ChangeAnimationInfo,
        {infoMap: new Map(AnimationComponent.__animationInfo)}
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

  static subscribe(type: AnimationComponentEventType, handler: EventHandler) {
    AnimationComponent.__pubsub.subscribe(type, handler);
  }

  static lerp(
    data_: Float32Array,
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

  private static __isClamped(idx: number, inputArray: number[]) {
    if (idx < 0) {
      return true;
    }
    if (idx >= inputArray.length) {
      return true;
    }
    return false;
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

  static interpolationSearch(inputArray: Float32Array, currentTime: number) {
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

  private static __getOutputValue(
    keyFrameId: Index,
    line: AnimationLine,
    array_: Float32Array
  ) {
    const array = array_ as globalThis.Float32Array;
    if (line.interpolationMethod === AnimationInterpolation.CubicSpline) {
      // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
      if (line.outputComponentN === 4) {
        // Quaternion/weights
        const value = array[get4_offset](
          line.outputComponentN * 3 * keyFrameId + line.outputComponentN
        ) as Array4<number>;
        return value;
      } else if (line.outputComponentN === 3) {
        // Translate/Scale/weights
        const value = array[get3_offset](
          line.outputComponentN * 3 * keyFrameId + line.outputComponentN
        ) as Array3<number>;
        return value;
      } else {
        // weights
        const value = array[getN_offset](
          line.outputComponentN * 3 * keyFrameId + line.outputComponentN,
          line.outputComponentN
        ) as Array<number>;
        return value;
      }
    } else {
      if (line.outputComponentN === 4) {
        // Quaternion/weights
        const value = array[get4_offsetAsComposition](
          keyFrameId
        ) as Array4<number>;
        return value;
      } else if (line.outputComponentN === 3) {
        // Translate/Scale/weights
        const value = array[get3_offsetAsComposition](
          keyFrameId
        ) as Array3<number>;
        return value;
      } else {
        // weights
        const value = array[getN_offsetAsComposition](
          keyFrameId,
          line.outputComponentN
        ) as Array<number>;
        return value;
      }
    }
  }

  static interpolate(
    line: AnimationLine,
    currentTime: number,
    animationAttributeIndex: Index
  ): Array<number> {
    const inputArray = line.input;
    const outputArray = line.output;
    const method = line.interpolationMethod ?? AnimationInterpolation.Linear;

    // out of range
    if (currentTime <= inputArray[0]) {
      const outputOfZeroFrame = this.__getOutputValue(0, line, outputArray);
      return outputOfZeroFrame;
    } else if (inputArray[inputArray.length - 1] <= currentTime) {
      const outputOfEndFrame = this.__getOutputValue(
        inputArray.length - 1,
        line,
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
        line.outputComponentN,
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
      const ret = this.lerp(
        outputArray,
        ratio,
        animationAttributeIndex,
        i,
        line.outputComponentN
      );
      return ret as Array<number>;
    } else if (method === AnimationInterpolation.Step) {
      for (let i = 0; i < inputArray.length - 1; i++) {
        if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
          const output_frame_i = this.__getOutputValue(i, line, outputArray);
          return output_frame_i;
        }
      }
      const outputOfEndFrame = this.__getOutputValue(
        inputArray.length - 1,
        line,
        outputArray
      );
      return outputOfEndFrame;
    }

    // non supported type
    return [];
  }

  private static __prepareVariablesForCubicSpline(
    outputArray_: Float32Array,
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
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
        componentN * 3 * i + componentN
      );
      const p_1 = outputArray[get4_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
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
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
        componentN * 3 * i + componentN
      ) as Array<number>;
      const p_1 = outputArray[get3_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
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
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
        componentN * 3 * i + componentN,
        componentN
      );
      const p_1 = outputArray[getN_offset](
        // In glTF CUBICSPLINE interpolation, tangents (ak, bk) and values (vk) are grouped within keyframes: a1,a2,…​an,v1,v2,…​vn,b1,b2,…​bn
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

  getStartInputValueOfAnimation(animationName?: string) {
    const name = animationName ?? this.__currentActiveAnimationName;
    if (name === undefined) {
      const array = Array.from(AnimationComponent.__animationInfo.values());
      if (array.length === 0) {
        return 0;
      }
      const firstAnimationInfo = array[0] as unknown as AnimationInfo;
      return firstAnimationInfo.maxEndInputTime;
    }
    const maxStartInputTime = defaultValue<AnimationInfo>(
      defaultAnimationInfo,
      AnimationComponent.__animationInfo.get(name)
    ).maxStartInputTime;

    return maxStartInputTime;
  }

  getEndInputValueOfAnimation(animationName?: string) {
    const name = animationName ?? this.__currentActiveAnimationName;

    if (name === undefined) {
      const array = Array.from(AnimationComponent.__animationInfo.values());
      if (array.length === 0) {
        return 0;
      }
      const firstAnimationInfo = array[0] as unknown as AnimationInfo;
      return firstAnimationInfo.maxEndInputTime;
    }
    const maxEndInputTime = defaultValue<AnimationInfo>(
      defaultAnimationInfo,
      AnimationComponent.__animationInfo.get(name)
    ).maxEndInputTime;

    return maxEndInputTime;
  }

  static getAnimationInfo() {
    return new Map(this.__animationInfo);
  }

  static get startInputValue() {
    const components = ComponentRepository.getInstance().getComponentsWithType(
      AnimationComponent
    ) as AnimationComponent[];
    if (components.length === 0) {
      return 0;
    } else {
      const infoArray = Array.from(this.__animationInfo.values());
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
      const infoArray = Array.from(this.__animationInfo.values());
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

  setAnimating(flg: boolean) {
    this.__isAnimating = flg;
  }

  static setAnimatingForAll(flg: boolean) {
    const animationComponents = this.__componentRepository._getComponents(
      AnimationComponent
    )! as AnimationComponent[];
    for (const animationComponent of animationComponents) {
      animationComponent.setAnimating(flg);
    }
  }

  get isAnimating() {
    return this.__isAnimating;
  }

  setAnimationToRest() {
    this.restoreDefaultValues();
  }

  private restoreDefaultValues() {
    this.__transformComponent!.quaternion = this.__backupDefaultValues.get(
      AnimationAttribute.Quaternion.str as AnimationAttributeType
    ) as Quaternion;

    this.__transformComponent!.translate = this.__backupDefaultValues.get(
      AnimationAttribute.Translate.str as AnimationAttributeType
    ) as IVector3;
    this.__transformComponent!.scale = this.__backupDefaultValues.get(
      AnimationAttribute.Scale.str as AnimationAttributeType
    ) as IVector3;
    if (this.__meshComponent != null) {
      this.__meshComponent!.weights = this.__backupDefaultValues.get(
        AnimationAttribute.Weights.str as AnimationAttributeType
      ) as number[];
    }
  }

  private backupDefaultValues() {
    this.__backupDefaultValues.set(
      AnimationAttribute.Quaternion.str as AnimationAttributeType,
      this.__transformComponent!.quaternion
    );
    this.__backupDefaultValues.set(
      AnimationAttribute.Translate.str as AnimationAttributeType,
      this.__transformComponent!.translate
    );
    this.__backupDefaultValues.set(
      AnimationAttribute.Scale.str as AnimationAttributeType,
      this.__transformComponent!.scale
    );
    if (this.__meshComponent != null) {
      this.__backupDefaultValues.set(
        AnimationAttribute.Weights.str as AnimationAttributeType,
        this.__meshComponent?.weights
      );
    }
  }

  static getAnimationList() {
    return Array.from(this.__animationInfo.keys());
  }

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
    if (this.isAnimating && this.__currentActiveAnimationName !== undefined) {
      const animationSet = this.__animationData.get(
        this.__currentActiveAnimationName
      );
      if (animationSet !== undefined) {
        for (const [attributeName, line] of animationSet) {
          const i = AnimationAttribute.fromString(attributeName).index;
          const value = AnimationComponent.interpolate(
            line,
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
}
ComponentRepository.registerComponentClass(AnimationComponent);
