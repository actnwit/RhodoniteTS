import { AnimationChannel, AnimationSampler, AnimationSamplers, AnimationTrackName } from "../../types/AnimationTypes";
import { Vector4 } from "./Vector4";
import { __getOutputValue, __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IVector4 } from "./IVector";
import { IAnimatedValue } from "./IAnimatedValue";

export class AnimatedVector4 extends Vector4 implements IVector4, IAnimatedValue {
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
    this.update();
  }

  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  useGlobalTime() {
    this.__time = undefined;
    this.update();
  }

  get x() {
    this.update();
    return this._v[0];
  }

  get y() {
    this.update();
    return this._v[1];
  }

  get z() {
    this.update();
    return this._v[2];
  }

  get w() {
    this.update();
    return this._v[3];
  }

  public update() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Vector4.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Vector4.index);
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
      this._v[1] = firstValue[1] * (1 - this.blendingRatio) + secondValue[1] * this.blendingRatio;
      this._v[2] = firstValue[2] * (1 - this.blendingRatio) + secondValue[2] * this.blendingRatio;
      this._v[3] = firstValue[3] * (1 - this.blendingRatio) + secondValue[3] * this.blendingRatio;
    }
    this.__lastTime = time;
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
