import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IVector2 } from './IVector';
import { Vector2 } from './Vector2';
/**
 * An animated 2D vector that can interpolate between animation keyframes over time.
 * This class extends Vector2 and implements both IVector2 and IAnimatedValue interfaces,
 * providing support for animation blending, looping, and time-based value updates.
 */
export declare class AnimatedVector2 extends Vector2 implements IVector2, IAnimatedValue {
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
     * Creates a new AnimatedVector2 instance.
     * @param animationSamplers - A map of animation track names to their corresponding samplers
     * @param activeAnimationTrackName - The name of the initial active animation track
     * @throws {Error} When the specified animation track is not found in the samplers
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Returns the current vector values as a regular JavaScript array.
     * @returns An array containing the x and y components of the vector
     */
    getNumberArray(): number[];
    /**
     * Sets the internal Float32Array and triggers an update.
     * @param array - The new Float32Array to use for the vector components
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets a specific time for animation evaluation instead of using global time.
     * @param time - The time value to use for animation sampling
     */
    setTime(time: number): void;
    /**
     * Clears the specific time and uses the default time (0) for animation updates.
     * When used with AnimationComponent, the time will be set via setTime() during animation processing.
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
     * Gets the x component of the vector, updating the animation if necessary.
     * @returns The x component value
     */
    get x(): number;
    /**
     * Gets the y component of the vector, updating the animation if necessary.
     * @returns The y component value
     */
    get y(): number;
    /**
     * Gets the z component of the vector, updating the animation if necessary.
     * Note: This always returns the z component even though this is a 2D vector.
     * @returns The z component value
     */
    get z(): number;
    /**
     * Updates the vector values based on the current time and active animation tracks.
     * Handles looping, blending between tracks, and caching to avoid redundant calculations.
     */
    update(): void;
    /**
     * Sets the first (primary) active animation track.
     * @param animationTrackName - The name of the animation track to set as primary
     * @throws {Error} When the specified animation track is not found (logged as info instead)
     */
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second (secondary) active animation track for blending.
     * @param animationTrackName - The name of the animation track to set as secondary
     * @throws {Error} When the specified animation track is not found (logged as info instead)
     */
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Gets the name of the first (primary) active animation track.
     * @returns The name of the first active animation track
     */
    getFirstActiveAnimationTrackName(): string;
    /**
     * Gets the name of the second (secondary) active animation track.
     * @returns The name of the second active animation track, or undefined if not set
     */
    getSecondActiveAnimationTrackName(): string | undefined;
    /**
     * Gets the minimum start time for a specific animation track.
     * @param trackName - The name of the animation track
     * @returns The minimum start time (first input value) of the specified track
     * @throws {Error} When the specified animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time for a specific animation track.
     * @param trackName - The name of the animation track
     * @returns The maximum end time (last input value) of the specified track
     * @throws {Error} When the specified animation track is not found
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
     * @throws {Error} When the specified animation track is not found
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
     * @param animationSampler - The animation sampler to associate with the track
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
