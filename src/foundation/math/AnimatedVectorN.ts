import { VectorN } from './VectorN';
import { IAnimatedValue } from './IAnimatedValue';
import { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { __interpolate } from '../components/Animation/AnimationOps';
import { Logger } from '../misc/Logger';

/**
 * An animated vector class that extends VectorN and implements animation interpolation.
 * This class manages multiple animation tracks and supports blending between them.
 * It can interpolate vector values over time using animation samplers.
 */
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

  /**
   * Creates a new AnimatedVectorN instance.
   * @param animationSamplers - Map of animation track names to their corresponding samplers
   * @param activeAnimationTrackName - The name of the initially active animation track
   * @throws {Error} When the specified animation track is not found
   */
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

  /**
   * Gets the vector components as a plain number array.
   * @returns A new array containing the vector components
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the internal Float32Array and updates the animation state.
   * @param array - The new Float32Array to set
   */
  setFloat32Array(array: Float32Array) {
    this._v = array;
    this.update();
  }

  /**
   * Sets a specific time for animation evaluation instead of using global time.
   * @param time - The time value to set for animation evaluation
   */
  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  /**
   * Switches back to using the global animation time instead of a specific time.
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
   * Updates the vector values based on the current time and active animation tracks.
   * Handles time looping, interpolation, and blending between multiple tracks.
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
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.VectorN.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      for (let i = 0; i < this._v.length; i++) {
        this._v[i] = firstValue[i];
      }
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.VectorN.index);
      for (let i = 0; i < this._v.length; i++) {
        this._v[i] = firstValue[i] * (1 - this.blendingRatio) + secondValue[i] * this.blendingRatio;
      }
    }
    this.__lastTime = time;
  }

  /**
   * Sets the first active animation track by name.
   * @param animationTrackName - The name of the animation track to set as first active
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
   * @param animationTrackName - The name of the animation track to set as second active
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
   * Gets the minimum start time for a specific animation track.
   * @param trackName - The name of the animation track
   * @returns The minimum start input time for the track
   * @throws {Error} When the animation track is not found
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
   * @returns The maximum end input time for the track
   * @throws {Error} When the animation track is not found
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
   * @throws {Error} When the animation track is not found
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
   * @param animationSampler - The animation sampler to set for the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}
