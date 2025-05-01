import { AnimationSampler, AnimationTrackName } from "../../types/AnimationTypes";
export interface IAnimatedValue {
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
  blendingRatio: number;
  setTime(time: number): void;
  useGlobalTime(): void;
  update(): void;
  setFloat32Array(array: Float32Array): void;
}
