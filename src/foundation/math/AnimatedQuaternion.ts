import { AnimationChannel, AnimationChannels, AnimationSampler, AnimationTrackName } from "../../types/AnimationTypes";
import { __getOutputValue, __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IAnimatedValue } from "./IAnimatedValue";
import { Quaternion } from "./Quaternion";
import { IQuaternion } from "./IQuaternion";

export class AnimatedQuaternion extends Quaternion implements IQuaternion, IAnimatedValue {
  private __animationChannels: AnimationChannels;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationChannel: AnimationChannel;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationChannel?: AnimationChannel;
  public blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;

  constructor(animationChannels: AnimationChannels, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(4));
    this.__animationChannels = animationChannels;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationChannel = this.__animationChannels.get(this.__firstActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationChannel = animationChannel;
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
      this.__update();
      this.__lastTime = time;
      return this._v[0];
    }
  }

  get y() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[1];
    } else {
      this.__update();
      this.__lastTime = time;
      return this._v[1];
    }
  }

  get z() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[2];
    } else {
      this.__update();
      this.__lastTime = time;
      return this._v[2];
    }
  }

  get w() {
    const time = this.__time ?? AnimationComponent.globalTime;
    if (this.__lastTime == time) {
      return this._v[3];
    } else {
      this.__update();
      this.__lastTime = time;
      return this._v[3];
    }
  }

  private __update() {
    const time = this.__time ?? AnimationComponent.globalTime;
    const firstValue = __interpolate(this.__firstActiveAnimationChannel.sampler, time, AnimationAttribute.Vector4.index);
    if (this.__secondActiveAnimationChannel === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationChannel.sampler, time, AnimationAttribute.Vector4.index);
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
    const animationChannel = this.__animationChannels.get(this.__firstActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationChannel = animationChannel;
  }

  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationChannel = this.__animationChannels.get(this.__secondActiveAnimationTrackName);
    if (animationChannel === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__secondActiveAnimationChannel = animationChannel;
  }

  setAnimationChannel(animationTrackName: AnimationTrackName, animationChannel: AnimationChannel) {
    this.__animationChannels.set(animationTrackName, animationChannel);
  }
}

