import {MeshComponent} from '../../..';
import {IVector3} from '../../math/IVector';

export interface RaycastResult {
  result: boolean;
  data?: {
    t: number; // t must be set valid value if result is true
    u: number; // intersected position in the triangle
    v: number; // intersected position in the triangle
  };
}

export interface RaycastResultEx1 {
  result: boolean;
  data?: {
    t: number; // t must be set valid value if result is true
    u: number; // intersected position in the triangle
    v: number; // intersected position in the triangle
    position: IVector3; // position must be set valid value if result is true
  };
}

export interface RaycastResultEx2 {
  result: boolean;
  data?: {
    t: number; // t must be set valid value if result is true
    u: number; // intersected position in the triangle
    v: number; // intersected position in the triangle
    position: IVector3; // position must be set valid value if result is true
    selectedMeshComponent: MeshComponent;
  };
}
