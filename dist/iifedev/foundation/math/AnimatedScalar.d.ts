import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IScalar } from './IVector';
import { Scalar } from './Scalar';
/**
 * A scalar value that can be animated using animation samplers.
 * This class extends Scalar and implements both IScalar and IAnimatedValue interfaces.
 * It supports blending between two animation tracks and can be configured to loop.
 */
export declare class AnimatedScalar extends Scalar implements IScalar, IAnimatedValue {
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
     * Creates a new AnimatedScalar instance.
     * @param animationSamplers - A map of animation track names to their corresponding samplers
     * @param activeAnimationTrackName - The name of the initially active animation track
     * @throws {Error} If the specified animation track is not found in the samplers
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Returns the scalar value as an array of numbers.
     * @returns An array containing the scalar value
     */
    getNumberArray(): number[];
    /**
     * Sets the internal Float32Array and triggers an update.
     * @param array - The new Float32Array to set
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets a specific time for animation playback.
     * @param time - The time value to set for animation sampling
     */
    setTime(time: number): void;
    /**
     * Clears the specific time and uses the default time (0) for animation updates.
     * When used with AnimationComponent, the time will be set via setTime() during animation processing.
     */
    useGlobalTime(): void;
    /**
     * Sets the blending ratio between the first and second animation tracks.
     * @param value - The blending ratio (0.0 = first track only, 1.0 = second track only)
     */
    set blendingRatio(value: number);
    /**
     * Gets the current blending ratio between animation tracks.
     * @returns The current blending ratio
     */
    get blendingRatio(): number;
    /**
     * Gets the current scalar value, updating the animation if necessary.
     * @returns The current scalar value
     */
    get x(): number;
    /**
     * Updates the animated scalar value based on the current time and active animation tracks.
     * This method interpolates between keyframes and handles blending between two tracks if configured.
     * The update is skipped if the time hasn't changed since the last update.
     */
    update(): void;
    /**
     * Sets the first active animation track by name.
     * @param animationTrackName - The name of the animation track to set as the first active track
     */
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second active animation track by name for blending purposes.
     * @param animationTrackName - The name of the animation track to set as the second active track
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
     * Gets the minimum start time from the input keyframes of the specified animation track.
     * @param trackName - The name of the animation track
     * @returns The minimum start time of the animation track
     * @throws {Error} If the specified animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time from the input keyframes of the specified animation track.
     * @param trackName - The name of the animation track
     * @returns The maximum end time of the animation track
     * @throws {Error} If the specified animation track is not found
     */
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets an array of all available animation track names.
     * @returns An array containing all animation track names
     */
    getAllTrackNames(): string[];
    /**
     * Gets the animation sampler for the specified track name.
     * @param trackName - The name of the animation track
     * @returns The animation sampler for the specified track
     * @throws {Error} If the specified animation track is not found
     */
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    /**
     * Deletes an animation sampler for the specified track name.
     * @param trackName - The name of the animation track to delete
     */
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    /**
     * Sets or updates an animation sampler for the specified track name.
     * @param animationTrackName - The name of the animation track
     * @param animationSampler - The animation sampler to associate with the track
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
