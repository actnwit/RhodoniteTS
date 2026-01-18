import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { __interpolate } from '../components/Animation/AnimationOps';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { Logger } from '../misc/Logger';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IVector4 } from './IVector';
import { Vector4 } from './Vector4';

/**
 * An animated 4D vector that interpolates between keyframe values over time.
 * This class extends Vector4 and provides animation capabilities by sampling
 * from animation tracks and optionally blending between two tracks.
 *
 * @example
 * ```typescript
 * const samplers = new Map();
 * const animatedVector = new AnimatedVector4(samplers, 'track1');
 * animatedVector.setTime(2.5);
 * console.log(animatedVector.x, animatedVector.y, animatedVector.z, animatedVector.w);
 * ```
 */
export class AnimatedVector4 extends Vector4 implements IVector4, IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  private __blendingRatio = 0;
  private __time?: number;
  private __lastTime = -1;
  public isLoop = true;

  /**
   * Creates a new AnimatedVector4 instance.
   *
   * @param animationSamplers - Map containing animation samplers keyed by track names
   * @param activeAnimationTrackName - The name of the initial active animation track
   * @throws {Error} When the specified animation track is not found in the samplers
   */
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

  /**
   * Returns the vector components as a regular JavaScript array.
   *
   * @returns An array containing the x, y, z, and w components
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the internal Float32Array data and triggers an update.
   *
   * @param array - The Float32Array to set as the internal data
   */
  setFloat32Array(array: Float32Array) {
    this._v = array;
    this.update();
  }

  /**
   * Sets the animation time for this vector. When set, this overrides the global time.
   *
   * @param time - The time value in seconds
   */
  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  /**
   * Switches back to using the global animation time instead of a custom time.
   * This removes any previously set custom time.
   */
  useGlobalTime() {
    this.__time = undefined;
    this.update();
  }

  /**
   * Sets the blending ratio between the first and second animation tracks.
   * A value of 0 means only the first track is used, 1 means only the second track,
   * and values in between create a linear blend.
   *
   * @param value - The blending ratio (typically between 0 and 1)
   */
  set blendingRatio(value: number) {
    this.__blendingRatio = value;
    this.__lastTime = -1;
    this.update();
  }

  /**
   * Gets the current blending ratio between animation tracks.
   *
   * @returns The current blending ratio
   */
  get blendingRatio() {
    return this.__blendingRatio;
  }

  /**
   * Gets the x component of the vector, updating the animation if necessary.
   *
   * @returns The current x component value
   */
  get x() {
    this.update();
    return this._v[0];
  }

  /**
   * Gets the y component of the vector, updating the animation if necessary.
   *
   * @returns The current y component value
   */
  get y() {
    this.update();
    return this._v[1];
  }

  /**
   * Gets the z component of the vector, updating the animation if necessary.
   *
   * @returns The current z component value
   */
  get z() {
    this.update();
    return this._v[2];
  }

  /**
   * Gets the w component of the vector, updating the animation if necessary.
   *
   * @returns The current w component value
   */
  get w() {
    this.update();
    return this._v[3];
  }

  /**
   * Updates the vector values by interpolating the animation samplers at the current time.
   * This method handles looping, blending between tracks, and caching to avoid
   * unnecessary recalculations.
   *
   * @private
   */
  public update() {
    let time = this.__time ?? 0;
    if (this.isLoop) {
      let duration = this.__firstActiveAnimationSampler.input[this.__firstActiveAnimationSampler.input.length - 1];
      if (this.__secondActiveAnimationSampler !== undefined) {
        duration = Math.min(
          duration,
          this.__secondActiveAnimationSampler.input[this.__secondActiveAnimationSampler.input.length - 1]
        );
      }
      time = time % duration;
    }
    if (this.__lastTime === time) {
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

  /**
   * Sets the first (primary) active animation track.
   *
   * @param animationTrackName - The name of the animation track to set as primary
   */
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__firstActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      // throw new Error('Animation channel not found');
      Logger.default.info('Animation channel not found');
    } else {
      this.__firstActiveAnimationSampler = animationSampler;
    }
  }

  /**
   * Sets the second (secondary) active animation track for blending.
   *
   * @param animationTrackName - The name of the animation track to set as secondary
   */
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__secondActiveAnimationTrackName);
    if (animationSampler === undefined) {
      // throw new Error('Animation channel not found');
      Logger.default.info('Animation channel not found');
    } else {
      this.__secondActiveAnimationSampler = animationSampler;
    }
  }

  /**
   * Gets the name of the first (primary) active animation track.
   *
   * @returns The name of the first active animation track
   */
  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  /**
   * Gets the name of the second (secondary) active animation track.
   *
   * @returns The name of the second active animation track, or undefined if not set
   */
  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  /**
   * Gets the minimum start time of the specified animation track.
   *
   * @param trackName - The name of the animation track
   * @returns The minimum start time of the track
   * @throws {Error} When the specified animation track is not found
   */
  getMinStartInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[0];
  }

  /**
   * Gets the maximum end time of the specified animation track.
   *
   * @param trackName - The name of the animation track
   * @returns The maximum end time of the track
   * @throws {Error} When the specified animation track is not found
   */
  getMaxEndInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[animationSampler.input.length - 1];
  }

  /**
   * Gets an array of all available animation track names.
   *
   * @returns An array containing all animation track names
   */
  getAllTrackNames() {
    return Array.from(this.__animationSamplers.keys());
  }

  /**
   * Gets the animation sampler for the specified track.
   *
   * @param trackName - The name of the animation track
   * @returns The animation sampler for the specified track
   * @throws {Error} When the specified animation track is not found
   */
  getAnimationSampler(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler;
  }

  /**
   * Removes an animation sampler for the specified track.
   *
   * @param trackName - The name of the animation track to remove
   */
  deleteAnimationSampler(trackName: AnimationTrackName) {
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Sets or adds an animation sampler for the specified track.
   *
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to set for this track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
