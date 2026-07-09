import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
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
export declare class AnimatedVector3 extends Vector3 implements IVector3, IAnimatedValue {
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
     * Creates a new AnimatedVector3 instance.
     *
     * @param animationSamplers - A map containing animation samplers keyed by track names
     * @param activeAnimationTrackName - The name of the initial active animation track
     * @throws {Error} When the specified animation track is not found in the samplers
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Returns the vector components as a regular JavaScript array.
     *
     * @returns An array containing the x, y, and z components
     */
    getNumberArray(): number[];
    /**
     * Sets the vector values from a Float32Array and triggers an update.
     *
     * @param array - A Float32Array containing the new x, y, z values
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets the current animation time and triggers an update.
     *
     * When a specific time is set, the vector will use this time instead of
     * the global animation time for interpolation calculations.
     *
     * @param time - The time value in seconds
     */
    setTime(time: number): void;
    /**
     * Clears the specific time and uses the default time (0) for animation updates.
     * When used with AnimationComponent, the time will be set via setTime() during animation processing.
     */
    useGlobalTime(): void;
    /**
     * Sets the blending ratio between the first and second animation tracks.
     *
     * @param value - A value between 0 and 1, where 0 means only the first track
     *                is used and 1 means only the second track is used
     */
    set blendingRatio(value: number);
    /**
     * Gets the current blending ratio between animation tracks.
     *
     * @returns The blending ratio between 0 and 1
     */
    get blendingRatio(): number;
    /**
     * Gets the X component of the vector.
     *
     * This getter automatically triggers an update to ensure the value
     * reflects the current animation state.
     *
     * @returns The current X component value
     */
    get x(): number;
    /**
     * Gets the Y component of the vector.
     *
     * This getter automatically triggers an update to ensure the value
     * reflects the current animation state.
     *
     * @returns The current Y component value
     */
    get y(): number;
    /**
     * Gets the Z component of the vector.
     *
     * This getter automatically triggers an update to ensure the value
     * reflects the current animation state.
     *
     * @returns The current Z component value
     */
    get z(): number;
    /**
     * Updates the vector values based on the current animation state.
     *
     * This method interpolates values from the active animation tracks using
     * the current time. If two tracks are active, it blends them according
     * to the blending ratio. The method handles looping and caches results
     * to avoid unnecessary recalculations.
     */
    update(): void;
    /**
     * Sets the first (primary) active animation track.
     *
     * @param animationTrackName - The name of the animation track to set as primary
     */
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second (secondary) active animation track for blending.
     *
     * @param animationTrackName - The name of the animation track to set as secondary
     */
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Gets the name of the first (primary) active animation track.
     *
     * @returns The name of the first active animation track
     */
    getFirstActiveAnimationTrackName(): string;
    /**
     * Gets the name of the second (secondary) active animation track.
     *
     * @returns The name of the second active animation track, or undefined if not set
     */
    getSecondActiveAnimationTrackName(): string | undefined;
    /**
     * Gets the minimum start time from the input data of the specified animation track.
     *
     * @param trackName - The name of the animation track
     * @returns The minimum input time value
     * @throws {Error} When the specified animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time from the input data of the specified animation track.
     *
     * @param trackName - The name of the animation track
     * @returns The maximum input time value
     * @throws {Error} When the specified animation track is not found
     */
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets all available animation track names.
     *
     * @returns An array containing all animation track names
     */
    getAllTrackNames(): string[];
    /**
     * Gets the animation sampler for the specified track.
     *
     * @param trackName - The name of the animation track
     * @returns The animation sampler for the specified track
     * @throws {Error} When the specified animation track is not found
     */
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    /**
     * Removes an animation sampler for the specified track.
     *
     * @param trackName - The name of the animation track to remove
     */
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    /**
     * Sets or updates an animation sampler for the specified track.
     *
     * @param animationTrackName - The name of the animation track
     * @param animationSampler - The animation sampler to associate with the track
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
