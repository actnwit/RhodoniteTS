import { AnimationTrackName } from "../../types";

export interface IAnimatedValue {
  setTime(time: number): void;
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  blendingRatio: number;
}
