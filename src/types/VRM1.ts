import type { RnM2 } from './RnM2';
import type { VRMC } from './VRMC';
import type { Vrm1_Material } from './VRMC_materials_mtoon';
import type { VRMC_node_constraint } from './VRMC_node_constraint';
import type { VRMC_springBone } from './VRMC_springBone';
export interface Vrm1 extends RnM2 {
  materials: Vrm1_Material[];
  extensions: {
    VRMC_vrm: VRMC;
    VRMC_springBone?: VRMC_springBone;
    VRMC_node_constraint?: VRMC_node_constraint;
  };
}
