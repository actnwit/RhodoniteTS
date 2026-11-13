import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { __interpolateTo } from '../components/Animation/AnimationOps';
import { AnimationStateRepository } from '../components/Animation/AnimationStateRepository';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { Logger } from '../misc/Logger';
import { AnimatedValueEvaluationState } from './AnimatedValueEvaluationState';
import type { IAnimatedValue } from './IAnimatedValue';
import { VectorN } from './VectorN';

/**
 * An animated vector class that extends VectorN and implements animation interpolation.
 * This class manages multiple animation tracks and supports blending between them.
 * It can interpolate vector values over time using animation samplers.
 */
export class AnimatedVectorN extends VectorN implements IAnimatedValue {
  private __animationSamplers: AnimationSamplers;
  private __firstActiveAnimationTrackName: AnimationTrackName;
  private __firstActiveAnimationSamplerTrackName: AnimationTrackName;
  private __firstActiveAnimationSampler: AnimationSampler;
  private __secondActiveAnimationTrackName?: AnimationTrackName;
  private __secondActiveAnimationSamplerTrackName?: AnimationTrackName;
  private __secondActiveAnimationSampler?: AnimationSampler;
  private __blendingRatio = 0;
  private __time?: number;
  private __evaluation = new AnimatedValueEvaluationState();
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
    this.__firstActiveAnimationSamplerTrackName = activeAnimationTrackName;
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
   * Drops the memoized interpolation result. Call this after mutating sampler data directly.
   */
  invalidateAnimationCache() {
    this.__evaluation.invalidate();
  }

  /**
   * Number of actual interpolations performed. Intended for tests and benchmarks.
   */
  getEvaluationCount() {
    return this.__evaluation.evaluationCount;
  }

  /**
   * Gets the internal value array without allocating a copy. Do not mutate the returned array.
   */
  getValueArray() {
    return this._v;
  }

  /**
   * Sets the time and blending ratio and evaluates the value at most once.
   */
  setTimeAndBlendingRatio(time: number, blendingRatio: number) {
    this.__time = time;
    this.__blendingRatio = blendingRatio;
    this.update();
  }

  /**
   * Sets the internal Float32Array and updates the animation state.
   * @param array - The new Float32Array to set
   */
  setFloat32Array(array: Float32Array) {
    if (array === this._v) {
      return;
    }
    this._v = array;
    this.__evaluation.invalidate();
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
    const hasSecondSampler = this.__secondActiveAnimationSampler !== undefined;
    if (!this.__evaluation.shouldEvaluate(time, this.__blendingRatio, hasSecondSampler)) {
      return;
    }
    if (this.__secondActiveAnimationSampler === undefined) {
      __interpolateTo(
        this.__firstActiveAnimationSampler,
        time,
        AnimationAttribute.VectorN.index,
        this._v,
        this.__evaluation.firstCursor
      );
    } else {
      const evaluation = this.__evaluation;
      evaluation.ensureScratch(
        Math.max(
          this._v.length,
          this.__firstActiveAnimationSampler.outputComponentN,
          this.__secondActiveAnimationSampler!.outputComponentN
        )
      );
      const firstValue = evaluation.scratchFirst;
      const secondValue = evaluation.scratchSecond;
      __interpolateTo(
        this.__firstActiveAnimationSampler,
        time,
        AnimationAttribute.VectorN.index,
        firstValue,
        evaluation.firstCursor
      );
      __interpolateTo(
        this.__secondActiveAnimationSampler,
        time,
        AnimationAttribute.VectorN.index,
        secondValue,
        evaluation.secondCursor
      );
      for (let i = 0; i < this._v.length; i++) {
        this._v[i] = firstValue[i] * (1 - this.blendingRatio) + secondValue[i] * this.blendingRatio;
      }
    }
    this.__evaluation.markEvaluated(time, this.__blendingRatio);
  }

  /**
   * Sets the first active animation track by name.
   * @param animationTrackName - The name of the animation track to set as first active
   */
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    AnimationStateRepository.markAnimationBindingChanged();
    this.__evaluation.invalidate();
    this.__firstActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      // throw new Error('Animation channel not found');
      Logger.default.info('Animation channel not found');
    } else {
      this.__firstActiveAnimationSampler = animationSampler;
      this.__firstActiveAnimationSamplerTrackName = animationTrackName;
    }
  }

  /**
   * Sets the second active animation track by name for blending purposes.
   * @param animationTrackName - The name of the animation track to set as second active
   */
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName) {
    AnimationStateRepository.markAnimationBindingChanged();
    this.__evaluation.invalidate();
    this.__secondActiveAnimationTrackName = animationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__secondActiveAnimationTrackName);
    if (animationSampler === undefined) {
      // throw new Error('Animation channel not found');
      Logger.default.info('Animation channel not found');
    } else {
      this.__secondActiveAnimationSampler = animationSampler;
      this.__secondActiveAnimationSamplerTrackName = animationTrackName;
    }
  }

  /**
   * Gets the name of the first active animation track.
   * @returns The name of the first active animation track
   */
  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  getFirstActiveAnimationSamplerTrackName() {
    return this.__firstActiveAnimationSamplerTrackName;
  }

  /**
   * Gets the name of the second active animation track.
   * @returns The name of the second active animation track, or undefined if not set
   */
  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  getSecondActiveAnimationSamplerTrackName() {
    return this.__secondActiveAnimationSamplerTrackName;
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
    AnimationStateRepository.markAnimationBindingChanged();
    this.__evaluation.invalidate();
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Adds or updates an animation sampler for a specific track.
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to set for the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    AnimationStateRepository.markAnimationBindingChanged();
    this.__animationSamplers.set(animationTrackName, animationSampler);
    if (
      animationTrackName === this.__firstActiveAnimationSamplerTrackName ||
      animationTrackName === this.__firstActiveAnimationTrackName
    ) {
      this.__firstActiveAnimationSampler = animationSampler;
      this.__firstActiveAnimationSamplerTrackName = animationTrackName;
    }
    if (
      animationTrackName === this.__secondActiveAnimationSamplerTrackName ||
      animationTrackName === this.__secondActiveAnimationTrackName
    ) {
      this.__secondActiveAnimationSampler = animationSampler;
      this.__secondActiveAnimationSamplerTrackName = animationTrackName;
    }
    this.__evaluation.invalidate();
  }
}
