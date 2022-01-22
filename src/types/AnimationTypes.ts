import Entity from '../foundation/core/Entity';
import {AnimationInterpolationEnum} from '../foundation/definitions/AnimationInterpolation';
import {Second} from './CommonTypes';

/**
 * animation path name
 * type of animation.channel.target.path in glTF2
 * See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#_animation_channels
 */
export type AnimationPathName =
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
 * Similar to [Animation.Channel](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel)
 */
export interface AnimationChannel {
  sampler: AnimationSampler;
  target: AnimationChannelTarget;
  belongTrackName: AnimationTrackName;
}

/**
 * Similar to [Animation.Channel.Target](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel-target)
 */
export interface AnimationChannelTarget {
  pathName: AnimationPathName;
  entity: Entity;
}

/**
 * Similar to [Animation.Sampler](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler)
 */
export interface AnimationSampler {
  input: Float32Array;
  output: Float32Array;
  outputComponentN: number;
  interpolationMethod: AnimationInterpolationEnum;
}

export type AnimationChannels = Map<AnimationPathName, AnimationChannel>;
export type AnimationTracks = Map<AnimationTrackName, AnimationChannels>;

export interface ChangeAnimationInfoEvent {
  infoMap: Map<AnimationTrackName, AnimationInfo>;
}

export type AnimationComponentEventType = symbol;
