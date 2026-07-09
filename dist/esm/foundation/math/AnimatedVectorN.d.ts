import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import type { IAnimatedValue } from './IAnimatedValue';
import { VectorN } from './VectorN';
/**
 * An animated vector class that extends VectorN and implements animation interpolation.
 * This class manages multiple animation tracks and supports blending between them.
 * It can interpolate vector values over time using animation samplers.
 */
export declare class AnimatedVectorN extends VectorN implements IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    /**
     * Creates a new AnimatedVectorN instance.
     * @param animationSamplers - Map of animation track names to their corresponding samplers
     * @param activeAnimationTrackName - The name of the initially active animation track
     * @throws {Error} When the specified animation track is not found
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Gets the vector components as a plain number array.
     * @returns A new array containing the vector components
     */
    getNumberArray(): number[];
    /**
     * Sets the internal Float32Array and updates the animation state.
     * @param array - The new Float32Array to set
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets a specific time for animation evaluation instead of using global time.
     * @param time - The time value to set for animation evaluation
     */
    setTime(time: number): void;
    /**
     * Switches back to using the global animation time instead of a specific time.
     */
    useGlobalTime(): void;
    /**
     * Sets the blending ratio between the first and second active animation tracks.
     * @param value - The blending ratio (0.0 = first track only, 1.0 = second track only)
     */
    set blendingRatio(value: number);
    /**
     * Gets the current blending ratio between animation tracks.
     * @returns The current blending ratio
     */
    get blendingRatio(): number;
    /**
     * Updates the vector values based on the current time and active animation tracks.
     * Handles time looping, interpolation, and blending between multiple tracks.
     */
    update(): void;
    /**
     * Sets the first active animation track by name.
     * @param animationTrackName - The name of the animation track to set as first active
     */
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second active animation track by name for blending purposes.
     * @param animationTrackName - The name of the animation track to set as second active
     */
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Gets the name of the first active animation track.
     * @returns The name of the first active animation track
     */
    getFirstActiveAnimationTrackName(): string;
    /**
     * Gets the name of the second active animation track.
     * @returns The name of the second active animation track, or undefined if not set
     */
    getSecondActiveAnimationTrackName(): string | undefined;
    /**
     * Gets the minimum start time for a specific animation track.
     * @param trackName - The name of the animation track
     * @returns The minimum start input time for the track
     * @throws {Error} When the animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time for a specific animation track.
     * @param trackName - The name of the animation track
     * @returns The maximum end input time for the track
     * @throws {Error} When the animation track is not found
     */
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets all available animation track names.
     * @returns An array containing all animation track names
     */
    getAllTrackNames(): string[];
    /**
     * Gets the animation sampler for a specific track.
     * @param trackName - The name of the animation track
     * @returns The animation sampler for the specified track
     * @throws {Error} When the animation track is not found
     */
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    /**
     * Removes an animation sampler from the available tracks.
     * @param trackName - The name of the animation track to remove
     */
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    /**
     * Adds or updates an animation sampler for a specific track.
     * @param animationTrackName - The name of the animation track
     * @param animationSampler - The animation sampler to set for the track
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
