import { MeshComponent, Primitive } from '../../..';
import { MeshUID } from '../../../types/CommonTypes';
import { IVector3 } from '../../math/IVector';
export interface RaycastResult {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
    };
}
export interface RaycastResultEx1 {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
        position: IVector3;
    };
}
export interface RaycastResultEx2 {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
        position: IVector3;
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
export declare const PrimitiveSortKey_BitLength_TranslucencyType = 2;
export declare const PrimitiveSortKey_BitLength_Material = 10;
export declare const PrimitiveSortKey_BitLength_PrimitiveType = 3;
export declare const PrimitiveSortKey_BitOffset_PrimitiveType = 0;
export declare const PrimitiveSortKey_BitOffset_Material = 3;
export declare const PrimitiveSortKey_BitOffset_TranslucencyType: number;
export declare const PrimitiveSortKey_BitOffset_ViewportLayer: number;
export type PrimitiveSortKeyLength = typeof PrimitiveSortKey_BitLength_Material | typeof PrimitiveSortKey_BitLength_TranslucencyType | typeof PrimitiveSortKey_BitLength_PrimitiveType;
export type PrimitiveSortKeyOffset = typeof PrimitiveSortKey_BitOffset_Material | typeof PrimitiveSortKey_BitOffset_TranslucencyType | typeof PrimitiveSortKey_BitOffset_ViewportLayer;
export declare const PrimitiveSortKey_BitLength_Depth = 32;
export interface IMesh {
    meshUID: MeshUID;
}
export declare function isBlend(primitive: Primitive): boolean;
export declare function isBlendWithZWrite(primitive: Primitive): boolean;
export declare function isBlendWithoutZWrite(primitive: Primitive): boolean;
export declare function isTranslucent(primitive: Primitive): boolean;
export declare function isOpaque(primitive: Primitive): boolean;
