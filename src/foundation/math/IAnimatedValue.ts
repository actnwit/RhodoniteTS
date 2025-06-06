import type { AnimationSampler, AnimationTrackName } from '../../types/AnimationTypes';

/**
 * Interface for animated values that can be controlled by animation tracks.
 * Provides functionality for managing animation samplers, time control, and value blending.
 */
export interface IAnimatedValue {
  /**
   * Sets the first active animation track name for primary animation.
   * @param animationTrackName - The name of the animation track to set as first active
   */
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;

  /**
   * Sets the second active animation track name for blending with the first track.
   * @param animationTrackName - The name of the animation track to set as second active
   */
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;

  /**
   * Gets the currently active first animation track name.
   * @returns The name of the first active animation track
   */
  getFirstActiveAnimationTrackName(): AnimationTrackName;

  /**
   * Gets the currently active second animation track name.
   * @returns The name of the second active animation track, or undefined if not set
   */
  getSecondActiveAnimationTrackName(): AnimationTrackName | undefined;

  /**
   * Gets the minimum start input time for a specified animation track.
   * @param trackName - The name of the animation track
   * @returns The minimum start time of the track's keyframes
   */
  getMinStartInputTime(trackName: AnimationTrackName): number;

  /**
   * Gets the maximum end input time for a specified animation track.
   * @param trackName - The name of the animation track
   * @returns The maximum end time of the track's keyframes
   */
  getMaxEndInputTime(trackName: AnimationTrackName): number;

  /**
   * Associates an animation sampler with the specified track name.
   * @param animationTrackName - The name of the animation track
   * @param animationSampler - The animation sampler to associate with the track
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;

  /**
   * The blending ratio between the first and second active animation tracks.
   * Value should be between 0.0 (first track only) and 1.0 (second track only).
   */
  blendingRatio: number;

  /**
   * Whether the animation should loop when it reaches the end.
   */
  isLoop: boolean;

  /**
   * Sets the current animation time.
   * @param time - The time value to set for animation playback
   */
  setTime(time: number): void;

  /**
   * Enables the use of global time for animation synchronization.
   */
  useGlobalTime(): void;

  /**
   * Updates the animated value based on the current time and active animation tracks.
   */
  update(): void;

  /**
   * Gets all available animation track names.
   * @returns An array of all animation track names
   */
  getAllTrackNames(): AnimationTrackName[];

  /**
   * Gets the animation sampler associated with the specified track name.
   * @param trackName - The name of the animation track
   * @returns The animation sampler for the specified track
   */
  getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;

  /**
   * Removes the animation sampler associated with the specified track name.
   * @param trackName - The name of the animation track to remove
   */
  deleteAnimationSampler(trackName: AnimationTrackName): void;

  /**
   * Sets the underlying Float32Array data for the animated value.
   * @param array - The Float32Array to set as the data source
   */
  setFloat32Array(array: Float32Array): void;

  /**
   * Gets the current animated value as an array of numbers.
   * @returns An array of numbers representing the current animated value
   */
  getNumberArray(): number[];
}
