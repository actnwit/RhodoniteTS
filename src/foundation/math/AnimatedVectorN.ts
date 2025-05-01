import { VectorN } from "./VectorN";
import { IAnimatedValue } from "./IAnimatedValue";
import { AnimationSampler, AnimationSamplers, AnimationTrackName } from "../../types/AnimationTypes";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { __interpolate } from "../components/Animation/AnimationOps";

export class AnimatedVectorN extends VectorN implements IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  public blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;

  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array());
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
    this.setFloat32Array(new Float32Array(animationSampler.outputComponentN));
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

  public update() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.VectorN.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.VectorN.index);
      for (let i = 0; i < this._v.length; i++) {
        this._v[i] = firstValue[i] * (1 - this.blendingRatio) + secondValue[i] * this.blendingRatio;
      }
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