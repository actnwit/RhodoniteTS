import type { AnimationSampler, AnimationSamplers, AnimationTrackName } from '../../types/AnimationTypes';
import type { IAnimatedValue } from './IAnimatedValue';
import type { IQuaternion } from './IQuaternion';
import { Quaternion } from './Quaternion';
/**
 * An animated quaternion that can be driven by animation samplers.
 * This class extends the base Quaternion class to provide animation capabilities,
 * allowing quaternion values to be interpolated over time using animation tracks.
 * Supports blending between multiple animation tracks and both local and global time management.
 */
export declare class AnimatedQuaternion extends Quaternion implements IQuaternion, IAnimatedValue {
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
     * Creates a new AnimatedQuaternion instance.
     * @param animationSamplers - Map of animation samplers keyed by track names
     * @param activeAnimationTrackName - The initial active animation track name
     * @throws {Error} When the specified animation track is not found in the samplers
     */
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    /**
     * Returns the quaternion values as a number array.
     * @returns Array containing the x, y, z, w components of the quaternion
     */
    getNumberArray(): number[];
    /**
     * Sets the quaternion values from a Float32Array.
     * @param array - Float32Array containing the quaternion components [x, y, z, w]
     */
    setFloat32Array(array: Float32Array): void;
    /**
     * Sets the local animation time for this quaternion.
     * When set, this time will be used instead of the global animation time.
     * @param time - The animation time in seconds
     */
    setTime(time: number): void;
    /**
     * Switches to using global animation time instead of local time.
     * Resets the local time and triggers an update.
     */
    useGlobalTime(): void;
    /**
     * Sets the blending ratio between the first and second active animation tracks.
     * @param value - Blending ratio (0.0 = first track only, 1.0 = second track only)
     */
    set blendingRatio(value: number);
    /**
     * Gets the current blending ratio between animation tracks.
     * @returns The current blending ratio
     */
    get blendingRatio(): number;
    /**
     * Gets the x component of the quaternion.
     * Triggers an update before returning the value.
     * @returns The x component
     */
    get x(): number;
    /**
     * Gets the y component of the quaternion.
     * Triggers an update before returning the value.
     * @returns The y component
     */
    get y(): number;
    /**
     * Gets the z component of the quaternion.
     * Triggers an update before returning the value.
     * @returns The z component
     */
    get z(): number;
    /**
     * Gets the w component of the quaternion.
     * Triggers an update before returning the value.
     * @returns The w component
     */
    get w(): number;
    /**
     * Updates the quaternion values based on the current animation time and active tracks.
     * This method interpolates values from animation samplers and handles blending between tracks.
     * If looping is enabled, the time will wrap around the animation duration.
     */
    update(): void;
    /**
     * Sets the first active animation track.
     * @param animationTrackName - The name of the animation track to set as the first active track
     */
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Sets the second active animation track for blending.
     * @param animationTrackName - The name of the animation track to set as the second active track
     */
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    /**
     * Gets the name of the first active animation track.
     * @returns The first active animation track name
     */
    getFirstActiveAnimationTrackName(): string;
    /**
     * Gets the name of the second active animation track.
     * @returns The second active animation track name, or undefined if not set
     */
    getSecondActiveAnimationTrackName(): string | undefined;
    /**
     * Gets the minimum start time for the specified animation track.
     * @param trackName - The animation track name
     * @returns The start time of the animation track
     * @throws {Error} When the specified animation track is not found
     */
    getMinStartInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets the maximum end time for the specified animation track.
     * @param trackName - The animation track name
     * @returns The end time of the animation track
     * @throws {Error} When the specified animation track is not found
     */
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    /**
     * Gets all available animation track names.
     * @returns Array of all animation track names
     */
    getAllTrackNames(): string[];
    /**
     * Gets the animation sampler for the specified track.
     * @param trackName - The animation track name
     * @returns The animation sampler for the track
     * @throws {Error} When the specified animation track is not found
     */
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    /**
     * Deletes an animation sampler for the specified track.
     * @param trackName - The animation track name to delete
     */
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    /**
     * Sets or updates an animation sampler for the specified track.
     * @param animationTrackName - The animation track name
     * @param animationSampler - The animation sampler to set
     */
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}
