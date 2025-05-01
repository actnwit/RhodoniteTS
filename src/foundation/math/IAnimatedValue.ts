import { AnimationChannel, AnimationTrackName } from "../../types/AnimationTypes";
export interface IAnimatedValue {
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setAnimationChannel(animationTrackName: AnimationTrackName, animationChannel: AnimationChannel): void;
  blendingRatio: number;
  setTime(time: number): void;
  useGlobalTime(): void;
}
