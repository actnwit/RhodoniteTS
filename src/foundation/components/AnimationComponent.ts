import Component from "../core/Component";
import ComponentRepository from "../core/ComponentRepository";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { AnimationInterpolationEnum, AnimationInterpolation } from "../definitions/AnimationInterpolation";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { CompositionTypeEnum, CompositionType } from "../definitions/CompositionType";
import Quaternion from "../math/Quaternion";
import TransformComponent from "./TransformComponent";
import { ProcessStage } from "../definitions/ProcessStage";
import MutableVector3 from "../math/MutableVector3";
import MutableQuaternion from "../math/MutableQuaternion";
import MeshComponent from "./MeshComponent";
import { ComponentTID, ComponentSID, EntityUID, Index } from "../../commontypes/CommonTypes";

type AnimationLine = {
  input: number[]
  output: any[],
  outputAttributeName: string,
  outputCompositionType: CompositionTypeEnum
  interpolationMethod: AnimationInterpolationEnum,
  targetEntityUid?: EntityUID
}

export default class AnimationComponent extends Component {
  private __animationLine: Map<Index, AnimationLine> = new Map();
  private __backupDefaultValues: Map<Index, any> = new Map();
  public static globalTime: number = 0;
  private static __isAnimating = true;
  private __isAnimating = true;
  private __transformComponent?: TransformComponent;
  private __meshComponent?: MeshComponent;
  private static __startInputValueOfAllComponent: number = Number.MAX_VALUE;
  private static __endInputValueOfAllComponent: number = - Number.MAX_VALUE;
  private static __startInputValueDirty = false;
  private static __endInputValueDirty = false;
  private static __componentRepository: ComponentRepository = ComponentRepository.getInstance();

  private static __returnVector3 = MutableVector3.zero();
  private static __tmpVector3_0 = MutableVector3.zero();
  private static __tmpVector3_1 = MutableVector3.zero();
  private static __tmpVector3_2 = MutableVector3.zero();
  private static __tmpVector3_3 = MutableVector3.zero();
  private static __returnQuaternion = MutableQuaternion.identity();
  private static __tmpQuaternion_0 = MutableQuaternion.identity();
  private static __tmpQuaternion_1 = MutableQuaternion.identity();
  private static __tmpQuaternion_2 = MutableQuaternion.identity();
  private static __tmpQuaternion_3 = MutableQuaternion.identity();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.__currentProcessStage = ProcessStage.Create;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  setAnimation(attributeName: string, animationInputArray: number[], animationOutputArray: any[], interpolation: AnimationInterpolationEnum) {

    const line: AnimationLine = {
      input: animationInputArray,
      output: animationOutputArray,
      outputAttributeName: attributeName,
      outputCompositionType: animationOutputArray[0].compositionType,
      interpolationMethod: interpolation
    };

    this.__animationLine.set(AnimationAttribute.fromString(attributeName).index, line);
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, TransformComponent) as TransformComponent;
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;
    this.backupDefaultValues(AnimationAttribute.fromString(attributeName).index);
    AnimationComponent.__startInputValueDirty = true;
    AnimationComponent.__endInputValueDirty = true;
  }

  static lerp(start: any, end: any, ratio: number, compositionType: CompositionTypeEnum, animationAttributeIndex: Index) {
    if (compositionType === CompositionType.Scalar) {
      return start * (1 - ratio) + end * ratio;
    } else {
      if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
        Quaternion.qlerpTo(start, end, ratio, AnimationComponent.__returnQuaternion);
        // Quaternion.lerpTo(start, end, ratio, AnimationComponent.returnQuaternion); // This is faster and enough approximation
        return AnimationComponent.__returnQuaternion as Quaternion;
      } else {
        (this.__returnVector3 as MutableVector3).x = start.x * (1 - ratio) + end.x * ratio;
        (this.__returnVector3 as MutableVector3).y = start.y * (1 - ratio) + end.y * ratio;
        (this.__returnVector3 as MutableVector3).z = start.z * (1 - ratio) + end.z * ratio;
        return this.__returnVector3;
        // } else {
        //   const returnArray = [];
        //   for (let i = 0; i < start.length; i++) {
        //     returnArray[i] = start[i] * (1 - ratio) + end[i] * ratio;
        //   }
        //   return returnArray;
      }
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

  static cubicSpline(p_0: any, p_1: any, m_0: any, m_1: any, t: number, animationAttributeIndex: Index) {
    const ratio2 = t * t;
    const ratio3 = ratio2 * t;

    // coefficients
    const c_0 = 2 * ratio3 - 3 * ratio2 + 1;
    const c_1 = ratio3 - 2 * ratio2 + t;
    const c_2 = -2 * ratio3 + 3 * ratio2;
    const c_3 = ratio3 - ratio2;

    if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
      const cp_0 = MutableQuaternion.multiplyNumberTo(p_0, c_0, this.__tmpQuaternion_0);
      const cm_0 = MutableQuaternion.multiplyNumberTo(m_0, c_1, this.__tmpQuaternion_1);
      const cp_1 = MutableQuaternion.multiplyNumberTo(p_1, c_2, this.__tmpQuaternion_2);
      const cm_1 = MutableQuaternion.multiplyNumberTo(m_1, c_3, this.__tmpQuaternion_3);
      return this.__returnQuaternion.copyComponents(cp_0).add(cm_0).add(cp_1).add(cm_1);

    } else if (animationAttributeIndex === AnimationAttribute.Weights.index) {
      return [c_0 * p_0 + c_1 * m_0 + c_2 * p_1 + c_3 * m_1];

    } else {
      const cp_0 = MutableVector3.multiplyTo(p_0, c_0, this.__tmpVector3_0);
      const cm_0 = MutableVector3.multiplyTo(m_0, c_1, this.__tmpVector3_1);
      const cp_1 = MutableVector3.multiplyTo(p_1, c_2, this.__tmpVector3_2);
      const cm_1 = MutableVector3.multiplyTo(m_1, c_3, this.__tmpVector3_3);
      return this.__returnVector3.copyComponents(cp_0).add(cm_0).add(cp_1).add(cm_1);
    }
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

  static binarySearch(inputArray: number[], currentTime: number) {
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
      } else { // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static interpolationSearch(inputArray: number[], currentTime: number) {

    let mid = 0;
    let lower = 0;
    let upper = inputArray.length - 1;
    let retVal = 0;

    while (lower <= upper && currentTime >= inputArray[lower] && currentTime <= inputArray[upper]) {
      mid = Math.floor(lower + (currentTime - inputArray[lower]) * ((upper - lower)) / (inputArray[upper] - inputArray[lower]));

      if (inputArray[mid] < currentTime) {
        lower = mid + 1;
        retVal = mid;
      } else if (currentTime < inputArray[mid]) {
        upper = mid - 1;
        retVal = upper;
      } else { // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static bruteForceSearch(inputArray: number[], currentTime: number) {
    for (let i = 0; i < inputArray.length; i++) {
      if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
        return i;
      }
    }
    return inputArray.length - 1;
  }

  static interpolate(line: AnimationLine, currentTime: number, animationAttributeIndex: Index) {

    const inputArray = line.input;
    const outputArray = line.output;
    const compositionType = line.outputCompositionType;
    const method = line.interpolationMethod ?? AnimationInterpolation.Linear;

    if (method === AnimationInterpolation.CubicSpline) {
      // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-

      const k = this.interpolationSearch(inputArray, currentTime);

      const t_diff = (inputArray[k + 1] - inputArray[k]); // t_(k+1) - t_k
      let t = (currentTime - inputArray[k]) / t_diff;
      if (t < 0 || 1 < t) {
        t = 0; // out of range
      }

      const [p_0, p_1, m_0, m_1] = this.__prepareVariablesForCubicSpline(outputArray, k, t_diff, animationAttributeIndex);
      return this.cubicSpline(p_0, p_1, m_0, m_1, t, animationAttributeIndex);

    } else if (method === AnimationInterpolation.Linear) {
      if (currentTime <= inputArray[0]) {
        return outputArray[0]; // out of range!
      } else if (inputArray[inputArray.length - 1] <= currentTime) {
        return outputArray[outputArray.length - 1]; // out of range!
      }
      // const j = this.bruteForceSearch(inputArray, input);
      // const j = this.binarySearch(inputArray, input);
      const j = this.interpolationSearch(inputArray, currentTime);

      let ratio = (currentTime - inputArray[j]) / (inputArray[j + 1] - inputArray[j]);
      let resultValue = this.lerp(outputArray[j], outputArray[j + 1], ratio, compositionType, animationAttributeIndex);
      return resultValue;
    } else if (method === AnimationInterpolation.Step) {
      if (currentTime <= inputArray[0]) {
        return outputArray[0]; // out of range!
      } else if (inputArray[inputArray.length - 1] <= currentTime) {
        return outputArray[outputArray.length - 1]; // out of range!
      }
      for (let i = 0; i < inputArray.length; i++) {
        if (typeof inputArray[i + 1] === "undefined") {
          break;
        }
        if (inputArray[i] <= currentTime && currentTime < inputArray[i + 1]) {
          return outputArray[i];
        }
      }
    }

    return outputArray[0]; // out of range!
  }

  private static __prepareVariablesForCubicSpline(outputArray: any[], k: number, t_diff: number, animationAttributeIndex: number) {
    let p_0, p_1, m_0, m_1;

    if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
      p_0 = outputArray[3 * k + 1]; //v_k
      p_1 = outputArray[3 * k + 4]; //v_(k+1)

      // the num of__tmpQuaternion is specified by this.cubicSpline
      const b_k = this.__tmpQuaternion_2.copyComponents(outputArray[3 * k + 2]);
      m_0 = b_k.multiplyNumber(t_diff);

      const a_k_plus_one = this.__tmpQuaternion_3.copyComponents(outputArray[3 * k + 3]); // a_(k+1)
      m_1 = a_k_plus_one.multiplyNumber(t_diff);

    } else if (animationAttributeIndex === AnimationAttribute.Weights.index) {
      p_0 = outputArray[k][1]; //v_k
      p_1 = outputArray[k + 1][1]; //v_(k+1)

      const b_k = outputArray[k][2];
      m_0 = t_diff * b_k;

      const a_k_plus_one = outputArray[k + 1][0];
      m_1 = t_diff * a_k_plus_one;

    } else {
      p_0 = outputArray[3 * k + 1];
      p_1 = outputArray[3 * k + 4];

      const b_k = this.__tmpVector3_2.copyComponents(outputArray[3 * k + 2]);
      m_0 = b_k.multiply(t_diff);

      const a_k_plus_one = this.__tmpVector3_3.copyComponents(outputArray[3 * k + 3]);
      m_1 = a_k_plus_one.multiply(t_diff);
    }

    return [p_0, p_1, m_0, m_1];
  }

  getStartInputValueOfAnimation() {
    let latestInputValue = Number.MAX_VALUE;
    for (let line of this.__animationLine.values()) {
      let inputValueArray = line.input;
      let inputLatestValueAtThisAttribute = inputValueArray[0];
      if (inputLatestValueAtThisAttribute < latestInputValue) {
        latestInputValue = inputLatestValueAtThisAttribute;
        if (latestInputValue < AnimationComponent.__startInputValueOfAllComponent) {
          AnimationComponent.__startInputValueOfAllComponent = latestInputValue;
        }
      }
    }
    return latestInputValue;
  }

  getEndInputValueOfAnimation() {
    let latestInputValue = - Number.MAX_VALUE;

    for (let line of this.__animationLine.values()) {
      let inputValueArray = line.input;
      let inputLatestValueAtThisAttribute = inputValueArray[inputValueArray.length - 1];
      if (inputLatestValueAtThisAttribute > latestInputValue) {
        latestInputValue = inputLatestValueAtThisAttribute;
        if (latestInputValue > AnimationComponent.__endInputValueOfAllComponent) {
          AnimationComponent.__endInputValueOfAllComponent = latestInputValue;
        }
      }
    }
    return latestInputValue;
  }

  static get startInputValue() {
    if (this.__startInputValueDirty) {
      const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent) as AnimationComponent[];
      components!.forEach(component => {
        component.getStartInputValueOfAnimation();
      });
      this.__startInputValueDirty = false;
    }
    return AnimationComponent.__startInputValueOfAllComponent;
  }

  static get endInputValue() {
    if (this.__endInputValueDirty) {
      const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent) as AnimationComponent[];
      components!.forEach(component => {
        component.getEndInputValueOfAnimation();
      });
      this.__endInputValueDirty = false;
    }
    return AnimationComponent.__endInputValueOfAllComponent;
  }

  $create() {
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, TransformComponent) as TransformComponent;
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (AnimationComponent.isAnimating) {
      for (var [i, line] of this.__animationLine) {
        let value = AnimationComponent.interpolate(line, AnimationComponent.globalTime, i);
        if (i === AnimationAttribute.Quaternion.index) {
          this.__transformComponent!.quaternion = value;
        } else if (i === AnimationAttribute.Translate.index) {
          this.__transformComponent!.translate = value;
        } else if (i === AnimationAttribute.Scale.index) {
          this.__transformComponent!.scale = value;
        } else if (i === AnimationAttribute.Weights.index) {
          this.__meshComponent!.weights = value;
        }
      }
    }
  }

  static get isAnimating() {
    return this.__isAnimating;
  }

  static set isAnimating(flg: boolean) {
    const animationComponents = this.__componentRepository._getComponents(AnimationComponent)! as AnimationComponent[];
    for (let animationComponent of animationComponents) {
      animationComponent.isAnimating = flg;
    }
  }

  get isAnimating() {
    return this.__isAnimating;
  }

  set isAnimating(flg: boolean) {
    if (flg) {
      for (var [i, line] of this.__animationLine) {
        this.backupDefaultValues(i);
      }
    } else {
      for (var [i, line] of this.__animationLine) {
        this.restoreDefaultValues(i);
      }
    }
    this.__isAnimating = flg;
  }

  private restoreDefaultValues(i: Index) {
    if (this.__backupDefaultValues.get(i) == null) {
      if (i === AnimationAttribute.Quaternion.index) {
        this.__transformComponent!.quaternion = this.__backupDefaultValues.get(i);
      } else if (i === AnimationAttribute.Translate.index) {
        this.__transformComponent!.translate = this.__backupDefaultValues.get(i);
      } else if (i === AnimationAttribute.Scale.index) {
        this.__transformComponent!.scale = this.__backupDefaultValues.get(i);
      } else if (i === AnimationAttribute.Weights.index) {
        this.__meshComponent!.weights = this.__backupDefaultValues.get(i);
      }
    }
  }

  private backupDefaultValues(i: Index) {
    if (this.__backupDefaultValues.get(i) == null) {
      if (i === AnimationAttribute.Quaternion.index) {
        this.__backupDefaultValues.set(i, this.__transformComponent!.quaternion);
      } else if (i === AnimationAttribute.Translate.index) {
        this.__backupDefaultValues.set(i, this.__transformComponent!.translate);
      } else if (i === AnimationAttribute.Scale.index) {
        this.__backupDefaultValues.set(i, this.__transformComponent!.scale);
      } else if (i === AnimationAttribute.Weights.index) {
        this.__backupDefaultValues.set(i, this.__meshComponent!.weights);
      }
    }
  }
}
ComponentRepository.registerComponentClass(AnimationComponent);
