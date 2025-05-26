import { RnM2 } from './RnM2';
import { RnM2_VRMC_vrm_animation} from './VRMC_vrm_animation';
export interface RnM2Vrma extends RnM2 {
  extensions: {
    VRMC_vrm_animation: RnM2_VRMC_vrm_animation;
  };
}
