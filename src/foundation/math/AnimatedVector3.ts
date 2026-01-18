import {
  AnimationChannel,
  type AnimationSampler,
  type AnimationSamplers,
  type AnimationTrackName,
} from '../../types/AnimationTypes';
import { __interpolate } from '../components/Animation/AnimationOps';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { Logger } from '../misc/Logger';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IVector3 } from './IVector';
import { Vector3 } from './Vector3';

/**
 * An animated 3D vector that interpolates values based on animation tracks.
 *
 * This class extends Vector3 to provide animation capabilities, allowing the vector
 * to change its values over time based on animation samplers. It supports blending
 * between two animation tracks and can operate in looped or non-looped modes.
 *
 * @example
 * ```typescript
 * const samplers = new Map();
 * const animatedVector = new AnimatedVector3(samplers, "track1");
 * animatedVector.setTime(1.5);
 * console.log(animatedVector.x, animatedVector.y, animatedVector.z);
 * ```
 */
export class AnimatedVector3 extends Vector3 implements IVector3, IAnimatedValue {
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
   * Creates a new AnimatedVector3 instance.
   *
   * @param animationSamplers - A map containing animation samplers keyed by track names
   * @param activeAnimationTrackName - The name of the initial active animation track
   * @throws {Error} When the specified animation track is not found in the samplers
   */
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

  /**
   * Returns the vector components as a regular JavaScript array.
   *
   * @returns An array containing the x, y, and z components
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the vector values from a Float32Array and triggers an update.
   *
   * @param array - A Float32Array containing the new x, y, z values
   */
  setFloat32Array(array: Float32Array) {
    this._v = array;
    this.update();
  }

  /**
   * Sets the current animation time and triggers an update.
   *
   * When a specific time is set, the vector will use this time instead of
   * the global animation time for interpolation calculations.
   *
   * @param time - The time value in seconds
   */
  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  /**
   * Clears the specific time and uses the default time (0) for animation updates.
   * When used with AnimationComponent, the time will be set via setTime() during animation processing.
   */
  useGlobalTime() {
    this.__time = undefined;
    this.update();
  }

  /**
   * Sets the blending ratio between the first and second animation tracks.
   *
   * @param value - A value between 0 and 1, where 0 means only the first track
   *                is used and 1 means only the second track is used
   */
  set blendingRatio(value: number) {
    this.__blendingRatio = value;
    this.__lastTime = -1;
    this.update();
  }

  /**
   * Gets the current blending ratio between animation tracks.
   *
   * @returns The blending ratio between 0 and 1
   */
  get blendingRatio() {
    return this.__blendingRatio;
  }

  /**
   * Gets the X component of the vector.
   *
   * This getter automatically triggers an update to ensure the value
   * reflects the current animation state.
   *
   * @returns The current X component value
   */
  get x() {
    this.update();
    return this._v[0];
  }

  /**
   * Gets the Y component of the vector.
   *
   * This getter automatically triggers an update to ensure the value
   * reflects the current animation state.
   *
   * @returns The current Y component value
   */
  get y() {
    this.update();
    return this._v[1];
  }

  /**
   * Gets the Z component of the vector.
   *
   * This getter automatically triggers an update to ensure the value
   * reflects the current animation state.
   *
   * @returns The current Z component value
   */
  get z() {
    this.update();
    return this._v[2];
  }

  /**
   * Updates the vector values based on the current animation state.
   *
   * This method interpolates values from the active animation tracks using
   * the current time. If two tracks are active, it blends them according
   * to the blending ratio. The method handles looping and caches results
   * to avoid unnecessary recalculations.
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
   * Gets the minimum start time from the input data of the specified animation track.
   *
   * @param trackName - The name of the animation track
   * @returns The minimum input time value
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
   * Gets the maximum end time from the input data of the specified animation track.
   *
   * @param trackName - The name of the animation track
   * @returns The maximum input time value
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
   * Gets all available animation track names.
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
   * Sets or updates an animation sampler for the specified track.
   *
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to associate with the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
