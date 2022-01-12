import { AnimationInterpolationEnum } from "../foundation/definitions/AnimationInterpolation";
import { EntityUID, Second } from "./CommonTypes";

/**
 * animation channel name
 * animation.channels in glTF2
 * See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#_animation_channels
 */
export type AnimationChannelName =
| 'undefined'
| 'translate'
| 'quaternion'
| 'scale'
| 'weights';

export type AnimationTrackName = string;

export interface AnimationInfo {
  name: AnimationTrackName;
  maxStartInputTime: Second;
  maxEndInputTime: Second;
}

/**
 * this includes both data of
 * [Animation.Channel](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel)
 * and
 * [Animation.Sampler](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler)
 * in glTF2
 */
export interface AnimationChannel {
  input: Float32Array;
  output: Float32Array;
  outputChannelName: AnimationChannelName;
  outputComponentN: number;
  interpolationMethod: AnimationInterpolationEnum;
  targetEntityUid?: EntityUID;
  belongTrackName: AnimationTrackName;
}

export type AnimationChannels = Map<AnimationChannelName, AnimationChannel>;
export type AnimationTracks = Map<AnimationTrackName, AnimationChannels>;

export interface ChangeAnimationInfoEvent {
  infoMap: Map<AnimationTrackName, AnimationInfo>;
}

export type AnimationComponentEventType = symbol;
