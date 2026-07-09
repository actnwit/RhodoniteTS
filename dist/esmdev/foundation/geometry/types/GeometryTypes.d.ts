import type { MeshComponent, Primitive } from '../../../import';
import type { MeshUID } from '../../../types/CommonTypes';
import type { IVector3 } from '../../math/IVector';
/**
 * Result of a basic raycast operation against geometry.
 */
export interface RaycastResult {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
    };
}
/**
 * Extended raycast result that includes the intersection position in world space.
 */
export interface RaycastResultEx1 {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
        position: IVector3;
    };
}
/**
 * Extended raycast result that includes the intersection position and the selected mesh component.
 */
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
 * Primitive sort key used for depth sorting and rendering order optimization.
 *
 * See: http://realtimecollisiondetection.net/blog/?p=86
 *
 * Bit Field Layout (lower 18 bits of the sort key from LSB):
 * --- 0
 *  3 bits: Primitive Type (0: POINTS, 1: LINES, 2: LINE_LOOP, 3: LINE_STRIP, 4: TRIANGLES, 5: TRIANGLE_STRIP, 6: TRIANGLE_FAN)
 * 10 bits: Material UID
 *  3 bits: Render queue (larger value draws later inside the same translucency bucket)
 *  2 bits: Translucency type (0: Opaque, 1: Translucent, 2: Blend with ZWrite, 3: Blend without ZWrite)
 * --- 17
 *
 * Depth Field:
 * 32 bits: Depth
 */
export type PrimitiveSortKey = number;
export declare const PrimitiveSortKey_BitLength_TranslucencyType = 2;
export declare const PrimitiveSortKey_BitLength_Material = 10;
export declare const PrimitiveSortKey_BitLength_PrimitiveType = 3;
export declare const PrimitiveSortKey_BitLength_RenderQueue = 3;
export declare const PrimitiveSortKey_BitOffset_PrimitiveType = 0;
export declare const PrimitiveSortKey_BitOffset_Material = 3;
export declare const PrimitiveSortKey_BitOffset_RenderQueue: number;
export declare const PrimitiveSortKey_BitOffset_TranslucencyType: number;
export type PrimitiveSortKeyLength = typeof PrimitiveSortKey_BitLength_Material | typeof PrimitiveSortKey_BitLength_TranslucencyType | typeof PrimitiveSortKey_BitLength_PrimitiveType | typeof PrimitiveSortKey_BitLength_RenderQueue;
export type PrimitiveSortKeyOffset = typeof PrimitiveSortKey_BitOffset_Material | typeof PrimitiveSortKey_BitOffset_TranslucencyType | typeof PrimitiveSortKey_BitOffset_RenderQueue;
export declare const PrimitiveSortKey_BitLength_Depth = 32;
/**
 * Interface representing a mesh with a unique identifier.
 */
export interface IMesh {
    meshUID: MeshUID;
}
/**
 * Checks if the primitive uses blending (either with or without Z-write).
 * @param primitive - The primitive to check
 * @returns True if the primitive uses blending, false otherwise
 */
export declare function isBlend(primitive: Primitive): boolean;
/**
 * Checks if the primitive uses blending with Z-write enabled.
 * @param primitive - The primitive to check
 * @returns True if the primitive uses blending with Z-write, false otherwise
 */
export declare function isBlendWithZWrite(primitive: Primitive): boolean;
/**
 * Checks if the primitive uses blending without Z-write (depth writing disabled).
 * @param primitive - The primitive to check
 * @returns True if the primitive uses blending without Z-write, false otherwise
 */
export declare function isBlendWithoutZWrite(primitive: Primitive): boolean;
/**
 * Checks if the primitive is translucent (partially transparent).
 * @param primitive - The primitive to check
 * @returns True if the primitive is translucent, false otherwise
 */
export declare function isTranslucent(primitive: Primitive): boolean;
/**
 * Checks if the primitive is opaque (fully solid, not transparent).
 * @param primitive - The primitive to check
 * @returns True if the primitive is opaque, false otherwise
 */
export declare function isOpaque(primitive: Primitive): boolean;
