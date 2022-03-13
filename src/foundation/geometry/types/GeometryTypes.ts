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

/**
 * See: http://realtimecollisiondetection.net/blog/?p=86
 *
 * Bitfield
 * --- 0
 * 22 bits: Material ID
 *  2 bits: Translucency type (0: Opaque, 1: Mask, 2: Translucency)
 *  3 bits: Viewport layer
 *  3 bits: Viewport
 *  2 bits: Fullscreen layer
 * --- 31
 */
export type PrimitiveSortKey = number;
export const PrimitiveSortKey_BitOffset_Material = 0;
export const PrimitiveSortKey_BitLength_Material = 22;
export const PrimitiveSortKey_BitOffset_TranslucencyType = PrimitiveSortKey_BitLength_Material;
export const PrimitiveSortKey_BitLength_TranslucencyType = 2;
export const PrimitiveSortKey_BitOffset_ViewportLayer = PrimitiveSortKey_BitLength_Material + PrimitiveSortKey_BitLength_TranslucencyType;

export type PrimitiveSortKeyOffset = typeof PrimitiveSortKey_BitOffset_Material | typeof PrimitiveSortKey_BitOffset_TranslucencyType | typeof PrimitiveSortKey_BitOffset_ViewportLayer;
