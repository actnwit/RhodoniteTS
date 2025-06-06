import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { __interpolate } from '../components/Animation/AnimationOps';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import type { IScalar } from './IVector';
import type { IAnimatedValue } from './IAnimatedValue';
import { Scalar } from './Scalar';
import { Logger } from '../misc/Logger';

/**
 * A scalar value that can be animated using animation samplers.
 * This class extends Scalar and implements both IScalar and IAnimatedValue interfaces.
 * It supports blending between two animation tracks and can be configured to loop.
 */
export class AnimatedScalar extends Scalar implements IScalar, IAnimatedValue {
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
   * Creates a new AnimatedScalar instance.
   * @param animationSamplers - A map of animation track names to their corresponding samplers
   * @param activeAnimationTrackName - The name of the initially active animation track
   * @throws {Error} If the specified animation track is not found in the samplers
   */
  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(1));
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
  }

  /**
   * Returns the scalar value as an array of numbers.
   * @returns An array containing the scalar value
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the internal Float32Array and triggers an update.
   * @param array - The new Float32Array to set
   */
  setFloat32Array(array: Float32Array) {
    this._v = array;
    this.update();
  }

  /**
   * Sets a specific time for animation playback.
   * @param time - The time value to set for animation sampling
   */
  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  /**
   * Switches to using global time from AnimationComponent instead of a specific time.
   */
  useGlobalTime() {
    this.__time = undefined;
    this.update();
  }

  /**
   * Sets the blending ratio between the first and second animation tracks.
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
   * Gets the current scalar value, updating the animation if necessary.
   * @returns The current scalar value
   */
  get x() {
    this.update();
    return this._v[0];
  }

  /**
   * Updates the animated scalar value based on the current time and active animation tracks.
   * This method interpolates between keyframes and handles blending between two tracks if configured.
   * The update is skipped if the time hasn't changed since the last update.
   */
  public update() {
    let time = this.__time ?? AnimationComponent.globalTime;
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
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Scalar.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Scalar.index);
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
    }
    this.__lastTime = time;
  }

  /**
   * Sets the first active animation track by name.
   * @param animationTrackName - The name of the animation track to set as the first active track
   */
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

  /**
   * Sets the second active animation track by name for blending purposes.
   * @param animationTrackName - The name of the animation track to set as the second active track
   */
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

  /**
   * Gets the name of the first active animation track.
   * @returns The name of the first active animation track
   */
  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  /**
   * Gets the name of the second active animation track.
   * @returns The name of the second active animation track, or undefined if not set
   */
  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  /**
   * Gets the minimum start time from the input keyframes of the specified animation track.
   * @param trackName - The name of the animation track
   * @returns The minimum start time of the animation track
   * @throws {Error} If the specified animation track is not found
   */
  getMinStartInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[0];
  }

  /**
   * Gets the maximum end time from the input keyframes of the specified animation track.
   * @param trackName - The name of the animation track
   * @returns The maximum end time of the animation track
   * @throws {Error} If the specified animation track is not found
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
   * @returns An array containing all animation track names
   */
  getAllTrackNames() {
    return Array.from(this.__animationSamplers.keys());
  }

  /**
   * Gets the animation sampler for the specified track name.
   * @param trackName - The name of the animation track
   * @returns The animation sampler for the specified track
   * @throws {Error} If the specified animation track is not found
   */
  getAnimationSampler(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler;
  }

  /**
   * Deletes an animation sampler for the specified track name.
   * @param trackName - The name of the animation track to delete
   */
  deleteAnimationSampler(trackName: AnimationTrackName) {
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Sets or updates an animation sampler for the specified track name.
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to associate with the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
