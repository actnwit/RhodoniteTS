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
  inTangent: number[],
  outTangent: number[],
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
  private static __returnVector3 = MutableVector3.zero();
  private static __returnQuaternion = new MutableQuaternion([0, 0, 0, 1]);
  private static __startInputValueDirty = false;
  private static __endInputValueDirty = false;
  private static __componentRepository: ComponentRepository = ComponentRepository.getInstance();

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
      inTangent: [],
      outTangent: [],
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

  static cubicSpline(start: any, end: any, inTangent: any, outTangent: any, ratio: number, animationAttributeIndex: Index) {
    const ratio2 = ratio * ratio;
    const ratio3 = ratio2 * ratio;
    if (!isNaN(start)) {
      return (2 * ratio3 - 3 * ratio2 + 1) * start +
        (ratio3 - 2 * ratio2 + ratio) * inTangent +
        (-2 * ratio3 + 3 * ratio2) * end +
        (ratio3 - ratio2) * outTangent;
    } else {
      if (animationAttributeIndex === AnimationAttribute.Quaternion.index) {
        this.__returnQuaternion.x = (2 * ratio3 - 3 * ratio2 + 1) * start.x +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.x +
          (-2 * ratio3 + 3 * ratio2) * end.x +
          (ratio3 - ratio2) * outTangent.x;
        this.__returnQuaternion.y = (2 * ratio3 - 3 * ratio2 + 1) * start.y +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.y +
          (-2 * ratio3 + 3 * ratio2) * end.y +
          (ratio3 - ratio2) * outTangent.y;
        this.__returnQuaternion.z = (2 * ratio3 - 3 * ratio2 + 1) * start.z +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.z +
          (-2 * ratio3 + 3 * ratio2) * end.z +
          (ratio3 - ratio2) * outTangent.z;
        this.__returnQuaternion.w = (2 * ratio3 - 3 * ratio2 + 1) * start.w +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.w +
          (-2 * ratio3 + 3 * ratio2) * end.w +
          (ratio3 - ratio2) * outTangent.w;
        return this.__returnQuaternion;
      } else {
        (this.__returnVector3 as MutableVector3).x = (2 * ratio3 - 3 * ratio2 + 1) * start.x +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.x +
          (-2 * ratio3 + 3 * ratio2) * end.x +
          (ratio3 - ratio2) * outTangent.x;
        (this.__returnVector3 as MutableVector3).y = (2 * ratio3 - 3 * ratio2 + 1) * start.y +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.y +
          (-2 * ratio3 + 3 * ratio2) * end.y +
          (ratio3 - ratio2) * outTangent.y;
        (this.__returnVector3 as MutableVector3).z = (2 * ratio3 - 3 * ratio2 + 1) * start.z +
          (ratio3 - 2 * ratio2 + ratio) * inTangent.z +
          (-2 * ratio3 + 3 * ratio2) * end.z +
          (ratio3 - ratio2) * outTangent.z;
        return this.__returnVector3;
        // } else {
        //   const returnArray = [];
        //   for (let j = 0; j < start.length; j++) {
        //     returnArray[j] = (2 * ratio3 - 3 * ratio2 + 1) * start.x +
        //       (ratio3 - 2 * ratio2 + ratio) * inTangent[j] +
        //       (-2 * ratio3 + 3 * ratio2) * end.x +
        //       (ratio3 - ratio2) * outTangent[j];
        //   }
        //   return returnArray;
      }
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

  static binarySearch(inputArray: number[], input: number) {
    let low = 0;
    let high = inputArray.length - 1;
    let mid = 0;
    let retVal = 0;
    while (low <= high) {
      mid = low + ((high - low) >> 1);

      if (inputArray[mid] < input) {
        low = mid + 1;
        retVal = mid;
      } else if (input < inputArray[mid]) {
        high = mid - 1;
        retVal = high;
      } else { // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static interpolationSearch(inputArray: number[], input: number) {

    let mid = 0;
    let lower = 0;
    let upper = inputArray.length - 1;
    let retVal = 0;

    while (lower <= upper && input >= inputArray[lower] && input <= inputArray[upper]) {
      mid = Math.floor(lower + (input - inputArray[lower]) * ((upper - lower)) / (inputArray[upper] - inputArray[lower]));

      if (inputArray[mid] < input) {
        lower = mid + 1;
        retVal = mid;
      } else if (input < inputArray[mid]) {
        upper = mid - 1;
        retVal = upper;
      } else { // if (inputArray[mid] === input) {
        return mid;
      }
    }

    return retVal;
  }

  static bruteForceSearch(inputArray: number[], input: number) {
    for (let i = 0; i < inputArray.length; i++) {
      if (inputArray[i] <= input && input < inputArray[i + 1]) {
        return i;
      }
    }
    return inputArray.length - 1;
  }

  static interpolate(line: AnimationLine, input: number, animationAttributeIndex: Index) {

    const inputArray = line.input;
    const outputArray = line.output;
    const compositionType = line.outputCompositionType;
    const method = (line.interpolationMethod != null) ? line.interpolationMethod : AnimationInterpolation.Linear;

    if (method === AnimationInterpolation.CubicSpline) {
      if (input <= inputArray[0]) {
        return outputArray[0]; // out of range!
      }
      if (inputArray[inputArray.length - 1] <= input) {
        return outputArray[outputArray.length - 1]; // out of range!
      }
      // for (let i = 0; i < inputArray.length - 1; i++) {
      //   if (inputArray[i] <= input && input < inputArray[i + 1]) {
      const i = this.interpolationSearch(inputArray, input);
      const t_ip_minus_i = inputArray[i + 1] - inputArray[i];
      const p_0 = outputArray[i];
      const p_1 = outputArray[i + 1];
      const a_k_plus_1 = outputArray[i + 1];
      const b_k = outputArray[i];
      const m_0 = t_ip_minus_i * b_k;
      const m_1 = t_ip_minus_i * a_k_plus_1;

      let ratio = (input - inputArray[i]) / t_ip_minus_i;
      let resultValue = this.cubicSpline(p_0, p_1, m_0, m_1, ratio, animationAttributeIndex);
      return resultValue;
      //   }
      // }
    } else if (method === AnimationInterpolation.Linear) {
      if (input <= inputArray[0]) {
        return outputArray[0]; // out of range!
      } else if (inputArray[inputArray.length - 1] <= input) {
        return outputArray[outputArray.length - 1]; // out of range!
      }
      // const j = this.bruteForceSearch(inputArray, input);
      // const j = this.binarySearch(inputArray, input);
      const j = this.interpolationSearch(inputArray, input);

      let ratio = (input - inputArray[j]) / (inputArray[j + 1] - inputArray[j]);
      let resultValue = this.lerp(outputArray[j], outputArray[j + 1], ratio, compositionType, animationAttributeIndex);
      return resultValue;
    } else if (method === AnimationInterpolation.Step) {
      if (input <= inputArray[0]) {
        return outputArray[0]; // out of range!
      } else if (inputArray[inputArray.length - 1] <= input) {
        return outputArray[outputArray.length - 1]; // out of range!
      }
      for (let i = 0; i < inputArray.length; i++) {
        if (typeof inputArray[i + 1] === "undefined") {
          break;
        }
        if (inputArray[i] <= input && input < inputArray[i + 1]) {
          return outputArray[i];
        }
      }
    }

    return outputArray[0]; // out of range!
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
          this.__meshComponent!.weights = [value];
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
