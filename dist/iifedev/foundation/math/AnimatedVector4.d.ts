import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IVector4 } from './IVector';
import { Vector4 } from './Vector4';
/**
 * An animated 4D vector that interpolates between keyframe values over time.
 * This class extends Vector4 and provides animation capabilities by sampling
 * from animation tracks and optionally blending between two tracks.
 *
 * @example
 * ```typescript
 * const samplers = new Map();
 * const animatedVector = new AnimatedVector4(samplers, 'track1');
 * animatedVector.setTime(2.5);
 * console.log(animatedVector.x, animatedVector.y, animatedVector.z, animatedVector.w);
 * ```
 */
export declare class AnimatedVector4 extends Vector4 implements IVector4, IAnimatedValue {
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
     * Creates a new AnimatedVector4 instance.
     *
     * @param animationSamplers - Map containing animation samplers keyed by track names
     * @param activeAnimationTrackName - The name of the initial active animation track
     * @throws {Error} When the specified animation track is not found in the samplers
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Returns the vector components as a regular JavaScript array.
     *
     * @returns An array containing the x, y, z, and w components
     */
    getNumberArray(): number[];
    /**
     * Sets the internal Float32Array data and triggers an update.
     *
     * @param array - The Float32Array to set as the internal data
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets the animation time for this vector. When set, this overrides the global time.
     *
     * @param time - The time value in seconds
     */
    setTime(time: number): void;
    /**
     * Switches back to using the global animation time instead of a custom time.
     * This removes any previously set custom time.
     */
    useGlobalTime(): void;
    /**
     * Sets the blending ratio between the first and second animation tracks.
     * A value of 0 means only the first track is used, 1 means only the second track,
     * and values in between create a linear blend.
     *
     * @param value - The blending ratio (typically between 0 and 1)
     */
    set blendingRatio(value: number);
    /**
     * Gets the current blending ratio between animation tracks.
     *
     * @returns The current blending ratio
     */
    get blendingRatio(): number;
    /**
     * Gets the x component of the vector, updating the animation if necessary.
     *
     * @returns The current x component value
     */
    get x(): number;
    /**
     * Gets the y component of the vector, updating the animation if necessary.
     *
     * @returns The current y component value
     */
    get y(): number;
    /**
     * Gets the z component of the vector, updating the animation if necessary.
     *
     * @returns The current z component value
     */
    get z(): number;
    /**
     * Gets the w component of the vector, updating the animation if necessary.
     *
     * @returns The current w component value
     */
    get w(): number;
    /**
     * Updates the vector values by interpolating the animation samplers at the current time.
     * This method handles looping, blending between tracks, and caching to avoid
     * unnecessary recalculations.
     *
     * @private
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
     * Gets the minimum start time of the specified animation track.
     *
     * @param trackName - The name of the animation track
     * @returns The minimum start time of the track
     * @throws {Error} When the specified animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time of the specified animation track.
     *
     * @param trackName - The name of the animation track
     * @returns The maximum end time of the track
     * @throws {Error} When the specified animation track is not found
     */
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets an array of all available animation track names.
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
     * Sets or adds an animation sampler for the specified track.
     *
     * @param animationTrackName - The name of the animation track
     * @param animationSampler - The animation sampler to set for this track
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
