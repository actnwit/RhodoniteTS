import { RnM2 } from './RnM2';
import { VRMC_vrm_animation } from './VRMA';
export interface RnM2Vrma extends RnM2 {
  extensions: {
    VRMC_vrm_animation: VRMC_vrm_animation;
  };
}
