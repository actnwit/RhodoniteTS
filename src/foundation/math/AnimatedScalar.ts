import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import { __interpolateTo } from '../components/Animation/AnimationOps';
import { AnimationStateRepository } from '../components/Animation/AnimationStateRepository';
import { AnimationAttribute } from '../definitions/AnimationAttribute';
import { Logger } from '../misc/Logger';
import { AnimatedValueEvaluationState } from './AnimatedValueEvaluationState';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IScalar } from './IVector';
import { Scalar } from './Scalar';

/**
 * A scalar value that can be animated using animation samplers.
 * This class extends Scalar and implements both IScalar and IAnimatedValue interfaces.
 * It supports blending between two animation tracks and can be configured to loop.
 */
export class AnimatedScalar extends Scalar implements IScalar, IAnimatedValue {
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
   * Creates a new AnimatedScalar instance.
   * @param animationSamplers - A map of animation track names to their corresponding samplers
   * @param activeAnimationTrackName - The name of the initially active animation track
   * @throws {Error} If the specified animation track is not found in the samplers
   */
  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(1));
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    this.__firstActiveAnimationSamplerTrackName = activeAnimationTrackName;
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
   * Sets the internal Float32Array and triggers an update.
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
   * Sets a specific time for animation playback.
   * @param time - The time value to set for animation sampling
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
    let time = this.__time ?? 0;
    if (this.isLoop) {
      const firstDuration =
        this.__firstActiveAnimationSampler.input[this.__firstActiveAnimationSampler.input.length - 1];
      let duration = firstDuration > 0 ? firstDuration : Number.POSITIVE_INFINITY;
      if (this.__secondActiveAnimationSampler !== undefined) {
        const secondDuration =
          this.__secondActiveAnimationSampler.input[this.__secondActiveAnimationSampler.input.length - 1];
        if (secondDuration > 0) {
          duration = Math.min(duration, secondDuration);
        }
      }
      if (Number.isFinite(duration)) {
        time = time % duration;
      }
    }
    const hasSecondSampler = this.__secondActiveAnimationSampler !== undefined;
    if (!this.__evaluation.shouldEvaluate(time, this.__blendingRatio, hasSecondSampler)) {
      return;
    }
    if (this.__secondActiveAnimationSampler === undefined) {
      __interpolateTo(
        this.__firstActiveAnimationSampler,
        time,
        AnimationAttribute.Scalar.index,
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
        AnimationAttribute.Scalar.index,
        firstValue,
        evaluation.firstCursor
      );
      __interpolateTo(
        this.__secondActiveAnimationSampler,
        time,
        AnimationAttribute.Scalar.index,
        secondValue,
        evaluation.secondCursor
      );
      this._v[0] = firstValue[0] * (1 - this.blendingRatio) + secondValue[0] * this.blendingRatio;
    }
    this.__evaluation.markEvaluated(time, this.__blendingRatio);
  }

  /**
   * Sets the first active animation track by name.
   * @param animationTrackName - The name of the animation track to set as the first active track
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
   * @param animationTrackName - The name of the animation track to set as the second active track
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
    AnimationStateRepository.markAnimationBindingChanged();
    this.__evaluation.invalidate();
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Sets or updates an animation sampler for the specified track name.
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to associate with the track
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
