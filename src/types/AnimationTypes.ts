import { IEntity, Entity } from '../foundation/core/Entity';
import { AnimationInterpolationEnum } from '../foundation/definitions/AnimationInterpolation';
import { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
import { Second, VectorComponentN } from './CommonTypes';

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
  | 'weights'
  | 'effekseer';

export type AnimationTrackName = string;

export interface AnimationInfo {
  name: AnimationTrackName;
  minStartInputTime: Second; // min start time in all animation paths of the track
  maxEndInputTime: Second; // max end time in all animation paths of the track
}

export type AnimationTracks = Map<AnimationTrackName, AnimationTrack>;

/**
 * Similar to [Animation](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation)
 */
export type AnimationTrack = Map<AnimationPathName, AnimationChannel>;


export type AnimationChannels = Map<AnimationTrackName, AnimationChannel>;

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
  entity: ISceneGraphEntity;
}

/**
 * Similar to [Animation.Sampler](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler)
 */
export interface AnimationSampler {
  input: Float32Array;
  output: Float32Array;
  outputComponentN: VectorComponentN;
  interpolationMethod: AnimationInterpolationEnum;
}

export interface ChangeAnimationInfoEvent {
  infoMap: Map<AnimationTrackName, AnimationInfo>;
}

export type AnimationComponentEventType = symbol;
