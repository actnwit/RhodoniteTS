import { AnimationChannel, AnimationSampler, AnimationSamplers, AnimationTrackName } from "../../types/AnimationTypes";
import { __getOutputValue, __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IAnimatedValue } from "./IAnimatedValue";
import { Quaternion } from "./Quaternion";
import { IQuaternion } from "./IQuaternion";

export class AnimatedQuaternion extends Quaternion implements IQuaternion, IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  public blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;

  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(4));
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
  }

  setFloat32Array(array: Float32Array) {
    this._v = array;
  }

  setTime(time: number) {
    this.__time = time;
  }

  useGlobalTime() {
    this.__time = undefined;
  }

  get x() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[0];
    } else {
      this.update();
      this.__lastTime = time;
      return this._v[0];
    }
  }

  get y() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[1];
    } else {
      this.update();
      this.__lastTime = time;
      return this._v[1];
    }
  }

  get z() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[2];
    } else {
      this.update();
      this.__lastTime = time;
      return this._v[2];
    }
  }

  get w() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[3];
    } else {
      this.update();
      this.__lastTime = time;
      return this._v[3];
    }
  }

  public update() {
    const time = this.__time ?? AnimationComponent.globalTime;
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Vector4.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Vector4.index);
      const q1 = Quaternion.fromCopy4(firstValue[0], firstValue[1], firstValue[2], firstValue[3]);
      const q2 = Quaternion.fromCopy4(secondValue[0], secondValue[1], secondValue[2], secondValue[3]);
      const q = Quaternion.qlerp(q1, q2, this.blendingRatio)._v;
      this._v[0] = q[0];
      this._v[1] = q[1];
      this._v[2] = q[2];
      this._v[3] = q[3];
    }
  }

  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__firstActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
  }

  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__secondActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__secondActiveAnimationSampler = animationSampler;
  }

  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}

