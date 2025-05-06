import { AnimationSampler, AnimationTrackName } from "../../types/AnimationTypes";
export interface IAnimatedValue {
  setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
  getFirstActiveAnimationTrackName(): AnimationTrackName;
  getSecondActiveAnimationTrackName(): AnimationTrackName | undefined;
  getMinStartInputTime(trackName: AnimationTrackName): number;
  getMaxEndInputTime(trackName: AnimationTrackName): number;
  setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
  blendingRatio: number;
  isLoop: boolean;
  setTime(time: number): void;
  useGlobalTime(): void;
  update(): void;
  getAllTrackNames(): AnimationTrackName[];
  getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
  deleteAnimationSampler(trackName: AnimationTrackName): void;
  setFloat32Array(array: Float32Array): void;
  getNumberArray(): number[];
}
