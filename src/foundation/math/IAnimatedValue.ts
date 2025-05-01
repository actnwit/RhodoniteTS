import { AnimationChannel, AnimationTrackName } from "../../types/AnimationTypes";
export interface IAnimatedValue {
  setTime(time: number): void;
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setAnimationChannel(animationTrackName: AnimationTrackName, animationChannel: AnimationChannel): void;
  blendingRatio: number;
}
