import { AnimationChannel, AnimationSampler, AnimationSamplers, AnimationTrackName } from "../../types/AnimationTypes";
import { __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IVector3 } from "./IVector";
import { IAnimatedValue } from "./IAnimatedValue";
import { Vector3 } from "./Vector3";

export class AnimatedVector3 extends Vector3 implements IVector3, IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  public blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;

  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(3));
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

  public update() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Vector3.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Vector3.index);
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
      this._v[1] = firstValue[1] * (1 - this.blendingRatio) + secondValue[1] * this.blendingRatio;
      this._v[2] = firstValue[2] * (1 - this.blendingRatio) + secondValue[2] * this.blendingRatio;
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

