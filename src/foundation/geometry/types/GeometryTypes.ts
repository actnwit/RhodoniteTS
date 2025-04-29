import { MeshComponent, Primitive } from '../../../import';
import { MeshUID } from '../../../types/CommonTypes';
import { IVector3 } from '../../math/IVector';

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
 * Bit Field
 * --- 0
 *  3 bits: Primitive Type (0: POINTS, 1: LINES, 2: LINE_LOOP, 3: LINE_STRIP, 4: TRIANGLES, 5: TRIANGLE_STRIP, 6: TRIANGLE_FAN)
 * 10 bits: Material TID
 *  2 bits: Translucency type (0: Opaque, 1: Translucent, 2: Blend with ZWrite, 3: Blend without ZWrite
 *  3 bits: Viewport layer
 *  3 bits: Viewport
 *  2 bits: Fullscreen layer
 * --- 31
 *
 * Depth Field
 * 32 bits: Depth
 */
export type PrimitiveSortKey = number;
export const PrimitiveSortKey_BitLength_TranslucencyType = 2;
export const PrimitiveSortKey_BitLength_Material = 10;
export const PrimitiveSortKey_BitLength_PrimitiveType = 3;

export const PrimitiveSortKey_BitOffset_PrimitiveType = 0;
export const PrimitiveSortKey_BitOffset_Material = PrimitiveSortKey_BitLength_PrimitiveType;
export const PrimitiveSortKey_BitOffset_TranslucencyType =
  PrimitiveSortKey_BitLength_PrimitiveType + PrimitiveSortKey_BitLength_Material;
export const PrimitiveSortKey_BitOffset_ViewportLayer =
  PrimitiveSortKey_BitLength_PrimitiveType +
  PrimitiveSortKey_BitLength_Material +
  PrimitiveSortKey_BitLength_TranslucencyType;

export type PrimitiveSortKeyLength =
  | typeof PrimitiveSortKey_BitLength_Material
  | typeof PrimitiveSortKey_BitLength_TranslucencyType
  | typeof PrimitiveSortKey_BitLength_PrimitiveType;
export type PrimitiveSortKeyOffset =
  | typeof PrimitiveSortKey_BitOffset_Material
  | typeof PrimitiveSortKey_BitOffset_TranslucencyType
  | typeof PrimitiveSortKey_BitOffset_ViewportLayer;

export const PrimitiveSortKey_BitLength_Depth = 32;

export interface IMesh {
  meshUID: MeshUID;
}

// export function isTranslucent(primitive: Primitive) {
//   return primitive._sortkey & 0b00000000_00000000_00000000_00000001;
// }
function readBits(
  primitive: Primitive,
  offset: PrimitiveSortKeyOffset,
  length: PrimitiveSortKeyLength
) {
  // Creates a mask with the specified bit length
  let mask = (1 << length) - 1;
  // Read data from a specified offset
  return (primitive._sortkey >> offset) & mask;
}

// const translucencyBitOffset = PrimitiveSortKey_BitOffset_TranslucencyType + 1;
// export function isTranslucent(primitive: Primitive) {
//   return (primitive._sortkey >> translucencyBitOffset) & 1;
// }

export function isBlend(primitive: Primitive) {
  const bit = readBits(
    primitive,
    PrimitiveSortKey_BitOffset_TranslucencyType,
    PrimitiveSortKey_BitLength_TranslucencyType
  );
  return (
    bit === 2 || bit === 3 // blend
  );
}

export function isBlendWithZWrite(primitive: Primitive) {
  const bit = readBits(
    primitive,
    PrimitiveSortKey_BitOffset_TranslucencyType,
    PrimitiveSortKey_BitLength_TranslucencyType
  );
  return bit === 2; // blend with ZWrite
}

export function isBlendWithoutZWrite(primitive: Primitive) {
  const bit = readBits(
    primitive,
    PrimitiveSortKey_BitOffset_TranslucencyType,
    PrimitiveSortKey_BitLength_TranslucencyType
  );
  return bit === 3; // blend without ZWrite
}

export function isTranslucent(primitive: Primitive) {
  return (
    readBits(
      primitive,
      PrimitiveSortKey_BitOffset_TranslucencyType,
      PrimitiveSortKey_BitLength_TranslucencyType
    ) === 1 // translucent
  );
}

export function isOpaque(primitive: Primitive) {
  return (
    readBits(
      primitive,
      PrimitiveSortKey_BitOffset_TranslucencyType,
      PrimitiveSortKey_BitLength_TranslucencyType
    ) === 0 // opaque
  );
}
