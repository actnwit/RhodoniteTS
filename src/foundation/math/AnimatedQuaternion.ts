import { AnimationChannel, AnimationSampler, AnimationSamplers, AnimationTrackName } from "../../types/AnimationTypes";
import { __getOutputValue, __interpolate } from "../components/Animation/AnimationOps";
import { AnimationAttribute } from "../definitions/AnimationAttribute";
import { AnimationComponent } from "../components/Animation/AnimationComponent";
import { IAnimatedValue } from "./IAnimatedValue";
import { Quaternion } from "./Quaternion";
import { IQuaternion } from "./IQuaternion";
import { Logger } from "../misc/Logger";

/**
 * An animated quaternion that can be driven by animation samplers.
 * This class extends the base Quaternion class to provide animation capabilities,
 * allowing quaternion values to be interpolated over time using animation tracks.
 * Supports blending between multiple animation tracks and both local and global time management.
 */
export class AnimatedQuaternion extends Quaternion implements IQuaternion, IAnimatedValue {
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
   * Creates a new AnimatedQuaternion instance.
   * @param animationSamplers - Map of animation samplers keyed by track names
   * @param activeAnimationTrackName - The initial active animation track name
   * @throws {Error} When the specified animation track is not found in the samplers
   */
  constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName) {
    super(new Float32Array(4));
    this.__animationSamplers = animationSamplers;
    this.__firstActiveAnimationTrackName = activeAnimationTrackName;
    const animationSampler = this.__animationSamplers.get(this.__firstActiveAnimationTrackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    this.__firstActiveAnimationSampler = animationSampler;
  }

  /**
   * Returns the quaternion values as a number array.
   * @returns Array containing the x, y, z, w components of the quaternion
   */
  getNumberArray() {
    return Array.from(this._v);
  }

  /**
   * Sets the quaternion values from a Float32Array.
   * @param array - Float32Array containing the quaternion components [x, y, z, w]
   */
  setFloat32Array(array: Float32Array) {
    this._v = array as Float32Array<ArrayBuffer>;
    this.update();
  }

  /**
   * Sets the local animation time for this quaternion.
   * When set, this time will be used instead of the global animation time.
   * @param time - The animation time in seconds
   */
  setTime(time: number) {
    this.__time = time;
    this.update();
  }

  /**
   * Switches to using global animation time instead of local time.
   * Resets the local time and triggers an update.
   */
  useGlobalTime() {
    this.__time = undefined;
    this.update();
  }

  /**
   * Sets the blending ratio between the first and second active animation tracks.
   * @param value - Blending ratio (0.0 = first track only, 1.0 = second track only)
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
   * Gets the x component of the quaternion.
   * Triggers an update before returning the value.
   * @returns The x component
   */
  get x() {
    this.update();
    return this._v[0];
  }

  /**
   * Gets the y component of the quaternion.
   * Triggers an update before returning the value.
   * @returns The y component
   */
  get y() {
    this.update();
    return this._v[1];
  }

  /**
   * Gets the z component of the quaternion.
   * Triggers an update before returning the value.
   * @returns The z component
   */
  get z() {
    this.update();
    return this._v[2];
  }

  /**
   * Gets the w component of the quaternion.
   * Triggers an update before returning the value.
   * @returns The w component
   */
  get w() {
    this.update();
    return this._v[3];
  }

  /**
   * Updates the quaternion values based on the current animation time and active tracks.
   * This method interpolates values from animation samplers and handles blending between tracks.
   * If looping is enabled, the time will wrap around the animation duration.
   */
  public update() {
    let time = this.__time ?? AnimationComponent.globalTime;
    if (this.isLoop) {
      let duration = this.__firstActiveAnimationSampler.input[this.__firstActiveAnimationSampler.input.length - 1];
      if (this.__secondActiveAnimationSampler !== undefined) {
        duration = Math.min(duration, this.__secondActiveAnimationSampler.input[this.__secondActiveAnimationSampler.input.length - 1]);
      }
      time = time % duration;
    }
    if (this.__lastTime == time) {
      return;
    }
    const firstValue = __interpolate(this.__firstActiveAnimationSampler, time, AnimationAttribute.Quaternion.index);
    if (this.__secondActiveAnimationSampler === undefined) {
      this._v[0] = firstValue[0];
      this._v[1] = firstValue[1];
      this._v[2] = firstValue[2];
      this._v[3] = firstValue[3];
    } else {
      const secondValue = __interpolate(this.__secondActiveAnimationSampler, time, AnimationAttribute.Quaternion.index);
      const q1 = Quaternion.fromCopy4(firstValue[0], firstValue[1], firstValue[2], firstValue[3]);
      const q2 = Quaternion.fromCopy4(secondValue[0], secondValue[1], secondValue[2], secondValue[3]);
      const q = Quaternion.qlerp(q1, q2, this.blendingRatio)._v;
      this._v[0] = q[0];
      this._v[1] = q[1];
      this._v[2] = q[2];
      this._v[3] = q[3];
    }
    this.__lastTime = time;
  }

  /**
   * Sets the first active animation track.
   * @param animationTrackName - The name of the animation track to set as the first active track
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
   * Sets the second active animation track for blending.
   * @param animationTrackName - The name of the animation track to set as the second active track
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
   * @returns The first active animation track name
   */
  getFirstActiveAnimationTrackName() {
    return this.__firstActiveAnimationTrackName;
  }

  /**
   * Gets the name of the second active animation track.
   * @returns The second active animation track name, or undefined if not set
   */
  getSecondActiveAnimationTrackName() {
    return this.__secondActiveAnimationTrackName;
  }

  /**
   * Gets the minimum start time for the specified animation track.
   * @param trackName - The animation track name
   * @returns The start time of the animation track
   * @throws {Error} When the specified animation track is not found
   */
  getMinStartInputTime(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler.input[0];
  }

  /**
   * Gets the maximum end time for the specified animation track.
   * @param trackName - The animation track name
   * @returns The end time of the animation track
   * @throws {Error} When the specified animation track is not found
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
   * @returns Array of all animation track names
   */
  getAllTrackNames() {
    return Array.from(this.__animationSamplers.keys());
  }

  /**
   * Gets the animation sampler for the specified track.
   * @param trackName - The animation track name
   * @returns The animation sampler for the track
   * @throws {Error} When the specified animation track is not found
   */
  getAnimationSampler(trackName: AnimationTrackName) {
    const animationSampler = this.__animationSamplers.get(trackName);
    if (animationSampler === undefined) {
      throw new Error('Animation channel not found');
    }
    return animationSampler;
  }

  /**
   * Deletes an animation sampler for the specified track.
   * @param trackName - The animation track name to delete
   */
  deleteAnimationSampler(trackName: AnimationTrackName) {
    this.__animationSamplers.delete(trackName);
  }

  /**
   * Sets or updates an animation sampler for the specified track.
   * @param animationTrackName - The animation track name
   * @param animationSampler - The animation sampler to set
   */
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler) {
    this.__animationSamplers.set(animationTrackName, animationSampler);
  }
}

