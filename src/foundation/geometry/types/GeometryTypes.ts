import { MeshComponent } from '../../..';
import {IVector3} from '../../math/IVector';

export interface RaycastResult {
  result: boolean;
  data?: {
    t: number; // t must be set valid value if result is true
    position: IVector3; // position must be set valid value if result is true
  };
}

export interface RaycastResultEx {
  result: boolean;
  data?: {
    t: number; // t must be set valid value if result is true
    position: IVector3; // position must be set valid value if result is true
    selectedMeshComponent: MeshComponent;
  };
}
