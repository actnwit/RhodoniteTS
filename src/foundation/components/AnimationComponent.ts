import Component from "../core/Component";
import ComponentRepository from "../core/ComponentRepository";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { AnimationEnum, Animation } from "../definitions/Animation";
import { CompositionTypeEnum, CompositionType } from "../definitions/CompositionType";
import Quaternion from "../math/Quaternion";
import TransformComponent from "./TransformComponent";
import { ProcessStage } from "../definitions/ProcessStage";
import Vector3 from "../math/Vector3";
import MutableVector3 from "../math/MutableVector3";
import MutableQuaternion from "../math/MutableQuaterion";
import MeshComponent from "./MeshComponent";
import Vector4 from "../math/Vector4";
import MutableVector4 from "../math/MutableVector4";
import MathClassUtil from "../math/MathClassUtil";
import { ComponentTID, ComponentSID, EntityUID } from "../../types/CommonTypes";


type AnimationLine = {
    input: number[]
    output: any[],
    inTangent: number[],
    outTangent: number[],
    outputAttributeName: string,
    outputCompositionType: CompositionTypeEnum
    interpolationMethod: AnimationEnum,
    targetEntityUid?: EntityUID
  }

export default class AnimationComponent extends Component {
  private __animationLine: {[s:string]: AnimationLine} = {};
  private __backupDefaultValues: {[s:string]: any} = {};
  public static globalTime: number = 0;
  public static isAnimating = true;
  private __transformComponent?: TransformComponent;
  private __meshComponent?: MeshComponent;
  private static __startInputValueOfAllComponent: number = Number.MAX_VALUE;
  private static __endInputValueOfAllComponent: number = - Number.MAX_VALUE;
  private static returnVector3 = MutableVector3.zero();
  private static returnQuaternion = new MutableQuaternion([0,0,0,1]);

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.__currentProcessStage = ProcessStage.Create;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  setAnimation(animationAttributeName: string, animationInputArray: number[], animationOutputArray: any[], interpolation: AnimationEnum) {

    const line: AnimationLine = {
      input: animationInputArray,
      output: animationOutputArray,
      inTangent: [],
      outTangent: [],
      outputAttributeName: animationAttributeName,
      outputCompositionType: animationOutputArray[0].compositionType,
      interpolationMethod: interpolation
    };

    this.__animationLine[animationAttributeName] = line;
  }

  static lerp(start: any, end: any, ratio: number, compositionType: CompositionTypeEnum) {
    if (compositionType === CompositionType.Scalar) {
      return start * (1 - ratio) + end * ratio;
    } else {
      if (start instanceof Quaternion) {
        Quaternion.qlerpTo(start, end, ratio, AnimationComponent.returnQuaternion);
        // Quaternion.lerpTo(start, end, ratio, AnimationComponent.returnQuaternion); // This is faster and enough approximation
        return AnimationComponent.returnQuaternion as Quaternion;
      } else if (start instanceof Vector3) {
        (this.returnVector3 as MutableVector3).x = start.x * (1 - ratio) + end.x * ratio;
        (this.returnVector3 as MutableVector3).y = start.y * (1 - ratio) + end.y * ratio;
        (this.returnVector3 as MutableVector3).z = start.z * (1 - ratio) + end.z * ratio;
        return this.returnVector3;
      } else {
        const returnArray = [];
        for (let i=0; i<start.length; i++) {
          returnArray[i] = start[i] * (1 - ratio) + end[i] * ratio;
        }
        return returnArray;
      }
    }
  }

  static cubicSpline(start: any, end: any, inTangent: any, outTangent: any, ratio: number, deltaInput: number, compositionType: CompositionTypeEnum) {
    const ratio2 = ratio*ratio;
    const ratio3 = ratio2*ratio;
    if (compositionType === CompositionType.Scalar) {
      return (2*ratio3 - 3*ratio2 + 1) * start +
        (ratio3 - 2*ratio2 + ratio) * inTangent +
        (-2*ratio3 + 3*ratio2) * end +
        (ratio3 - ratio2) * outTangent;
    } else {
      if (start instanceof Vector3) {
        (this.returnVector3 as MutableVector3).x = (2*ratio3 - 3*ratio2 + 1) * start.x +
        (ratio3 - 2*ratio2 + ratio) * inTangent.x +
        (-2*ratio3 + 3*ratio2) * end.x +
        (ratio3 - ratio2) * outTangent.x;
        (this.returnVector3 as MutableVector3).y = (2*ratio3 - 3*ratio2 + 1) * start.y +
        (ratio3 - 2*ratio2 + ratio) * inTangent.y +
        (-2*ratio3 + 3*ratio2) * end.y +
        (ratio3 - ratio2) * outTangent.y;
        (this.returnVector3 as MutableVector3).z = (2*ratio3 - 3*ratio2 + 1) * start.z +
        (ratio3 - 2*ratio2 + ratio) * inTangent.z +
        (-2*ratio3 + 3*ratio2) * end.z +
        (ratio3 - ratio2) * outTangent.z;
        return this.returnVector3;
      } else if (start instanceof Quaternion) {
        this.returnQuaternion.x = (2*ratio3 - 3*ratio2 + 1) * start.x +
        (ratio3 - 2*ratio2 + ratio) * inTangent.x +
        (-2*ratio3 + 3*ratio2) * end.x +
        (ratio3 - ratio2) * outTangent.x;
        this.returnQuaternion.y = (2*ratio3 - 3*ratio2 + 1) * start.y +
        (ratio3 - 2*ratio2 + ratio) * inTangent.y +
        (-2*ratio3 + 3*ratio2) * end.y +
        (ratio3 - ratio2) * outTangent.y;
        this.returnQuaternion.z = (2*ratio3 - 3*ratio2 + 1) * start.z +
        (ratio3 - 2*ratio2 + ratio) * inTangent.z +
        (-2*ratio3 + 3*ratio2) * end.z +
        (ratio3 - ratio2) * outTangent.z;
        this.returnQuaternion.w = (2*ratio3 - 3*ratio2 + 1) * start.w +
        (ratio3 - 2*ratio2 + ratio) * inTangent.w +
        (-2*ratio3 + 3*ratio2) * end.w +
        (ratio3 - ratio2) * outTangent.w;
        return this.returnQuaternion;
      } else {
        const returnArray = [];
        for (let j=0; j<start.length; j++) {
          returnArray[j] = (2*ratio3 - 3*ratio2 + 1) * start.x +
          (ratio3 - 2*ratio2 + ratio) * inTangent[j] +
          (-2*ratio3 + 3*ratio2) * end.x +
          (ratio3 - ratio2) * outTangent[j];
        }
        return returnArray;
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
    while (low < high) {
      mid = low + ((high - low) >> 1);

      const value = inputArray[mid];
      if (value === input) {
        return mid;
      } else if (value > input) {
        high = mid - 1;
        retVal = high;
      } else {
        low = mid + 1;
        retVal = mid;
      }
    }

    return retVal;
  }

  static interpolationSearch(inputArray: number[], value: number) {

    let mid = 0;
    let lower = 0;
    let upper = inputArray.length - 1;

    while( lower <= upper ) {
      mid = Math.floor(lower + ((value - inputArray[lower]) * (upper - lower)) / (inputArray[upper] - inputArray[lower]));
      if( mid < lower || upper < mid ){
        break;
      }
      if ( inputArray[mid] === value ) {
        return mid;
      } else if ( inputArray[mid] < value ) {
        lower = mid + 1;
      } else {
        upper = mid - 1;
      }
    }

    return mid;
  }

  static bruteForceSearch(inputArray: number[], input: number) {
    for (let i = 0; i<inputArray.length; i++) {
      if (inputArray[i] <= input && input < inputArray[i+1]) {
        return i;
      }
    }
    return inputArray.length - 1;
  }

  static interpolate(line: AnimationLine, input: number) {

    const inputArray = line.input;
    const outputArray = line.output;
    const compositionType = line.outputCompositionType;
    const method = (line.interpolationMethod != null) ? line.interpolationMethod : Animation.Linear;

    if (method === Animation.CubicSpline) {
      for (let i = 0; i<inputArray.length-1; i++) {
        if (inputArray[i] <= input && input < inputArray[i+1]) {
          const i_minus_b = AnimationComponent.__isClamped(i-1, inputArray);
          const i_plus_b = AnimationComponent.__isClamped(i+1, inputArray);
          const i_pp_b = AnimationComponent.__isClamped(i+2, inputArray);
          let m_i = MathClassUtil.initWithScalar(outputArray[0], 0);
          if (!i_minus_b) {
            m_i = MathClassUtil.multiplyNumber(
              MathClassUtil.add(
                MathClassUtil.divideNumber(MathClassUtil.subtract(outputArray[i+1], outputArray[i]), MathClassUtil.subtract(inputArray[i+1], inputArray[i]))
              , MathClassUtil.divideNumber(MathClassUtil.subtract(outputArray[i], outputArray[i-1]), MathClassUtil.subtract(inputArray[i], inputArray[i-1]))
              ), 1/2);
          }
          let m_iplus = MathClassUtil.initWithScalar(outputArray[0], 0);
          if (!(i_plus_b || i_pp_b)) {
            m_iplus = MathClassUtil.multiplyNumber(
              MathClassUtil.add(
                MathClassUtil.divideNumber(MathClassUtil.subtract(outputArray[i+2], outputArray[i+1]), MathClassUtil.subtract(inputArray[i+2], inputArray[i+1]))
              , MathClassUtil.divideNumber(MathClassUtil.subtract(outputArray[i+1], outputArray[i]), MathClassUtil.subtract(inputArray[i+1], inputArray[i]))
              ), 1/2);
          }
          let ratio = (input - inputArray[i]) / (inputArray[i+1] - inputArray[i]);
          let resultValue = this.cubicSpline(outputArray[i], outputArray[i+1], m_i, m_iplus, ratio, inputArray[i+1] - inputArray[i], compositionType);
          return resultValue;
        }
      }
    } else {
      if (input < inputArray[0]) {
        return outputArray[0]; // out of range!
      }
      if (inputArray[inputArray.length-1] <= input) {
        return outputArray[outputArray.length-1]; // out of range!
      }

      if (method === Animation.Linear) {
        const j = Math.max(this.bruteForceSearch(inputArray, input), 0);
        // const j = Math.max(this.interpolationSearch(inputArray, input), 0);
        // const j = Math.max(this.binarySearch(inputArray, input), 0);

        if (inputArray[j+1] != null) {
          let ratio = (input - inputArray[j]) / (inputArray[j+1] - inputArray[j]);
          let resultValue = this.lerp(outputArray[j], outputArray[j+1], ratio, compositionType);
          return resultValue;
        } else {
          return outputArray[outputArray.length-1]; // out of range!
        }
      } else if (method === Animation.Step) {
        for (let i = 0; i<inputArray.length; i++) {
          if (typeof inputArray[i+1] === "undefined") {
            break;
          }
          if (inputArray[i] <= input && input < inputArray[i+1]) {
            return outputArray[i];
          }
        }
      }
    }

    return outputArray[0]; // out of range!
  }

  getStartInputValueOfAnimation() {
    let latestInputValue = Number.MAX_VALUE;
    for (let attributeName in this.__animationLine) {
      let inputValueArray = this.__animationLine[attributeName].input;
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

    for (let attributeName in this.__animationLine) {
      let inputValueArray = this.__animationLine[attributeName].input;
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
    const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent) as AnimationComponent[];
    components!.forEach(component => {
      component.getStartInputValueOfAnimation();
    });
    return AnimationComponent.__startInputValueOfAllComponent;
  }

  static get endInputValue() {
    const components = ComponentRepository.getInstance().getComponentsWithType(AnimationComponent) as AnimationComponent[];
    components!.forEach(component => {
      component.getEndInputValueOfAnimation();
    });
    return AnimationComponent.__endInputValueOfAllComponent;
  }

  $create() {
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, TransformComponent) as TransformComponent;
    this.__meshComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, MeshComponent) as MeshComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    for (let attributeName in this.__animationLine) {
      if (this.__backupDefaultValues[attributeName] == null) {
        if (attributeName === 'weights') {
          this.__backupDefaultValues[attributeName] = (this.__meshComponent! as any)[attributeName];
        } else {
          this.__backupDefaultValues[attributeName] = (this.__transformComponent! as any)[attributeName];
        }
      }
      if (AnimationComponent.isAnimating) {
        const line = this.__animationLine[attributeName];
        let value = AnimationComponent.interpolate(line, AnimationComponent.globalTime);
        if (attributeName === 'weights') {
          (this.__meshComponent! as any)[attributeName] = value;
        } else {
          (this.__transformComponent! as any)[attributeName] = value;
        }
      } else {
        if (attributeName === 'weights') {
          (this.__meshComponent! as any)[attributeName] = this.__backupDefaultValues[attributeName];
        } else {
          (this.__transformComponent! as any)[attributeName] = this.__backupDefaultValues[attributeName];
        }
      }
    }
  }
}
ComponentRepository.registerComponentClass(AnimationComponent);
