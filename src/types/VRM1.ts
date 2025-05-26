import { RnM2 } from './RnM2';
import { VRMC } from './VRMC';
import { Vrm1_Material } from './VRMC_materials_mtoon';
import { VRMC_node_constraint } from './VRMC_node_constraint';
import { VRMC_springBone } from './VRMC_springBone';
export interface Vrm1 extends RnM2 {
  materials: Vrm1_Material[];
  extensions: {
    VRMC_vrm: VRMC;
    VRMC_springBone?: VRMC_springBone;
    VRMC_node_constraint?: VRMC_node_constraint;
  };
}
