import { VectorN } from './VectorN';
import { IAnimatedValue } from './IAnimatedValue';
import {
  AnimationSampler,
  AnimationSamplers,
  AnimationTrackName,
} from '../../types/AnimationTypes';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { __interpolate } from '../components/Animation/AnimationOps';
import { Logger } from '../misc/Logger';

export class AnimatedVectorN extends VectorN implements IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  private __blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;
  public isLoop = true;
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

  getNumberArray() {
    return Array.from(this._v);
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

  set blendingRatio(value: number) {
    this.__blendingRatio = value;
    this.__lastTime = -1;
    this.update();
  }

  get blendingRatio() {
    return this.__blendingRatio;
  }

  public update() {
    let time = this.__time ?? AnimationComponent.globalTime;
    if (this.isLoop) {
      let duration =
        this.__firstActiveAnimationSampler.input[
          this.__firstActiveAnimationSampler.input.length - 1
        ];
      if (this.__secondActiveAnimationSampler !== undefined) {
        duration = Math.min(
          duration,
          this.__secondActiveAnimationSampler.input[
            this.__secondActiveAnimationSampler.input.length - 1
          ]
        );
      }
      time = time % duration;
    }
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(
      this.__firstActiveAnimationSampler,
      time,
      AnimationAttribute.VectorN.index
    );
    if (this.__secondActiveAnimationSampler === undefined) {
      for (let i = 0; i < this._v.length; i++) {
        this._v[i] = firstValue[i];
      }
    } else {
      const secondValue = __interpolate(
        this.__secondActiveAnimationSampler,
        time,
        AnimationAttribute.VectorN.index
      );
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
      // throw new Error('Animation channel not found');
      Logger.info('Animation channel not found');
    } else {
      this.__firstActiveAnimationSampler = animationSampler;
    }
  }

  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__secondActiveAnimationTrackName);
    if (animationSampler === undefined) {
      // throw new Error('Animation channel not found');
      Logger.info('Animation channel not found');
    } else {
      this.__secondActiveAnimationSampler = animationSampler;
    }
  }

  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  getMinStartInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[0];
  }

  getMaxEndInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[animationSampler.input.length - 1];
  }

  getAllTrackNames() {
    return Array.from(this.__animationSamplers.keys());
  }

  getAnimationSampler(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler;
  }

  deleteAnimationSampler(trackName: AnimationTrackName) {
    this.__animationSamplers.delete(trackName);
  }

  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
