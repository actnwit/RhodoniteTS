import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { __interpolate } from '../components/Animation/AnimationOps';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { Logger } from '../misc/Logger';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IVector2 } from './IVector';
import { Vector2 } from './Vector2';

/**
 * An animated 2D vector that can interpolate between animation keyframes over time.
 * This class extends Vector2 and implements both IVector2 and IAnimatedValue interfaces,
 * providing support for animation blending, looping, and time-based value updates.
 */
export class AnimatedVector2 extends Vector2 implements IVector2, IAnimatedValue {
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
   * Creates a new AnimatedVector2 instance.
   * @param animationSamplers - A map of animation track names to their corresponding samplers
   * @param activeAnimationTrackName - The name of the initial active animation track
   * @throws {Error} When the specified animation track is not found in the samplers
   */
  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(2));
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
  }

  /**
   * Returns the current vector values as a regular JavaScript array.
   * @returns An array containing the x and y components of the vector
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the internal Float32Array and triggers an update.
   * @param array - The new Float32Array to use for the vector components
   */
  setFloat32Array(array: Float32Array) {
    this._v = array;
    this.update();
  }

  /**
   * Sets a specific time for animation evaluation instead of using global time.
   * @param time - The time value to use for animation sampling
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
   * Sets the blending ratio between the first and second active animation tracks.
   * @param value - The blending ratio (0.0 = first track only, 1.0 = second track only)
   */
  set blendingRatio(value: number) {
    this.__blendingRatio = value;
    this.__lastTime = -1;
    this.update();
  }

  /**
   * Gets the current blending ratio between animation tracks.
   * @returns The current blending ratio
   */
  get blendingRatio() {
    return this.__blendingRatio;
  }

  /**
   * Gets the x component of the vector, updating the animation if necessary.
   * @returns The x component value
   */
  get x() {
    this.update();
    return this._v[0];
  }

  /**
   * Gets the y component of the vector, updating the animation if necessary.
   * @returns The y component value
   */
  get y() {
    this.update();
    return this._v[1];
  }

  /**
   * Gets the z component of the vector, updating the animation if necessary.
   * Note: This always returns the z component even though this is a 2D vector.
   * @returns The z component value
   */
  get z() {
    this.update();
    return this._v[2];
  }

  /**
   * Updates the vector values based on the current time and active animation tracks.
   * Handles looping, blending between tracks, and caching to avoid redundant calculations.
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
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Vector2.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Vector2.index);
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
      this._v[1] = firstValue[1] * (1 - this.blendingRatio) + secondValue[1] * this.blendingRatio;
    }
    this.__lastTime = time;
  }

  /**
   * Sets the first (primary) active animation track.
   * @param animationTrackName - The name of the animation track to set as primary
   * @throws {Error} When the specified animation track is not found (logged as info instead)
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
   * @param animationTrackName - The name of the animation track to set as secondary
   * @throws {Error} When the specified animation track is not found (logged as info instead)
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
   * @returns The name of the first active animation track
   */
  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  /**
   * Gets the name of the second (secondary) active animation track.
   * @returns The name of the second active animation track, or undefined if not set
   */
  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  /**
   * Gets the minimum start time for a specific animation track.
   * @param trackName - The name of the animation track
   * @returns The minimum start time (first input value) of the specified track
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
   * Gets the maximum end time for a specific animation track.
   * @param trackName - The name of the animation track
   * @returns The maximum end time (last input value) of the specified track
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
   * @returns An array containing all animation track names
   */
  getAllTrackNames() {
    return Array.from(this.__animationSamplers.keys());
  }

  /**
   * Gets the animation sampler for a specific track.
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
   * Removes an animation sampler from the available tracks.
   * @param trackName - The name of the animation track to remove
   */
  deleteAnimationSampler(trackName: AnimationTrackName) {
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Adds or updates an animation sampler for a specific track.
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to associate with the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
