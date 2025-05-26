import { RnM2Node } from "./RnM2";

export interface VRMC_node_constraint {
  node: RnM2Node;
  constraint: {
    roll?: {
      source: number;
      rollAxis: string;
      weight?: number;
    };
    aim?: {
      source: number;
      aimAxis: string;
      weight?: number;
    };
    rotation?: {
      source: number;
      weight?: number;
    };
  };
}
