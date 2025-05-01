import { AnimationChannel, AnimationChannels, AnimationSampler, AnimationTrackName } from "../../types/AnimationTypes";
import { Vector4 } from "./Vector4";
import { __getOutputValue, __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IVector4 } from "./IVector";
import { IAnimatedValue } from "./IAnimatedValue";

export class AnimatedVector4 extends Vector4 implements IVector4, IAnimatedValue {
  private __animationChannels: AnimationChannels;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationChannel: AnimationChannel;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationChannel?: AnimationChannel;
  public blendingRatio = 0;

  constructor(animationChannels: AnimationChannels, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(4));
    this.__animationChannels = animationChannels;
    this.setTime(AnimationComponent.globalTime);
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationChannel = this.__animationChannels.get(this.__firstActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationChannel = animationChannel;
  }

  setTime(time: number) {
    const firstValue = __interpolate(this.__firstActiveAnimationChannel.sampler, time, AnimationAttribute.Vector4.index);
    if (this.__secondActiveAnimationChannel === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationChannel.sampler, time, AnimationAttribute.Vector4.index);
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
      this._v[1] = firstValue[1] * (1 - this.blendingRatio) + secondValue[1] * this.blendingRatio;
      this._v[2] = firstValue[2] * (1 - this.blendingRatio) + secondValue[2] * this.blendingRatio;
      this._v[3] = firstValue[3] * (1 - this.blendingRatio) + secondValue[3] * this.blendingRatio;
    }
  }

  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__firstActiveAnimationTrackName = animationTrackName;
    const animationChannel = this.__animationChannels.get(this.__firstActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
  }

  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationChannel = this.__animationChannels.get(this.__secondActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
  }

  setAnimationChannel(animationTrackName: AnimationTrackName, animationChannel: AnimationChannel) {
    this.__animationChannels.set(animationTrackName, animationChannel);
  }
}
