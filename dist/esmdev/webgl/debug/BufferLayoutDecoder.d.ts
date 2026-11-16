import { type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../foundation/definitions/ShaderSemanticsInfo';
import type { Count, IndexOf16Bytes } from '../../types/CommonTypes';
import type { BufferLocationInfo, RawVec4 } from './types';
/**
 * Source of the data texture layout. `readVec4` and `readScalar` read the CPU-side
 * GPUInstanceData buffers, which are the same bytes that are uploaded to the texture.
 */
export type BufferLayoutSource = {
    width: number;
    readVec4: (vec4Index: number) => RawVec4 | null;
    readScalar: (scalarIndex: number) => number | null;
};
type FetchPlan = {
    fetchFunction: string;
    unit: 'vec4' | 'scalar' | 'scalar-weird';
    count: number;
    warning?: string;
};
/**
 * Mirrors the `fetch*` helpers in `prerequisites.glsl` for each composition type.
 */
export declare function getFetchPlan(compositionType: CompositionTypeEnum): FetchPlan;
/**
 * Decodes the location(s) of a material semantic for a given material SID.
 *
 * Mirrors `WebGLStrategyWebGL2.__getShaderPropertyOfMaterial`:
 * - `bufferViewIndex = floor(materialSID / materialCountPerBufferView)`
 * - `indexInBufferView = materialSID % materialCountPerBufferView`
 * - non-array: `vec4Index = offsets[bv] + vec4Size * indexInBufferView`
 * - array: `offsets[bv] + vec4Size * arrayLength * indexInBufferView + vec4Size * elementIndex`
 */
export declare function decodeMaterialProperty(args: {
    info: ShaderSemanticsInfo;
    offsets: IndexOf16Bytes[];
    materialSID: number;
    materialCountPerBufferView: number;
    layout: BufferLayoutSource;
    maxArrayElements?: number;
}): BufferLocationInfo;
/**
 * Decodes a global property. Global properties use instanceId 0, and array elements
 * use a plain `vec4Size` / `scalarSize` stride (no arrayLength multiplier).
 */
export declare function decodeGlobalProperty(args: {
    info: ShaderSemanticsInfo;
    offset: IndexOf16Bytes;
    layout: BufferLayoutSource;
    maxArrayElements?: number;
}): BufferLocationInfo;
export type ComponentMemberLayoutInfo = {
    compositionType: CompositionTypeEnum;
    arrayLength?: Count;
    isVariableLength?: boolean;
};
/**
 * Decodes a component member. Mirrors `processForNonArrayType` / `processForArrayType`
 * in `WebGLStrategyWebGL2`.
 */
export declare function decodeComponentMember(args: {
    memberInfo: ComponentMemberLayoutInfo;
    offsets: IndexOf16Bytes[];
    componentSID: number;
    componentCountPerBufferView: number;
    layout: BufferLayoutSource;
    maxArrayElements?: number;
}): BufferLocationInfo;
/**
 * Decodes a variable-length component member (e.g. SkeletalComponent.boneData).
 * The per-instance location is stored in `${memberName}Location` as
 * `location = x * 65536 + y`, with the element count in `z`.
 */
export declare function decodeVariableLengthComponentMember(args: {
    memberInfo: ComponentMemberLayoutInfo;
    offsets: IndexOf16Bytes[];
    locationMemberOffsets: IndexOf16Bytes[];
    componentSID: number;
    componentCountPerBufferView: number;
    layout: BufferLayoutSource;
    radix?: number;
    maxArrayElements?: number;
}): BufferLocationInfo;
export {};
