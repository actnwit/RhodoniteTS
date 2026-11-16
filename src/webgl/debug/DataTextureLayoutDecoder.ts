import { CompositionType, type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../foundation/definitions/ShaderSemanticsInfo';
import type { Count, IndexOf16Bytes } from '../../types/CommonTypes';
import type { DataTextureLocationInfo, Texel, TexelLocation } from './types';

/**
 * Source of the data texture layout. `readVec4` and `readScalar` read the CPU-side
 * GPUInstanceData buffers, which are the same bytes that are uploaded to the texture.
 */
export type DataTextureLayoutSource = {
  width: number;
  readVec4: (vec4Index: number) => Texel | null;
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
export function getFetchPlan(compositionType: CompositionTypeEnum): FetchPlan {
  switch (compositionType) {
    case CompositionType.Vec4:
    case CompositionType.Vec4Array:
      return { fetchFunction: 'fetchElement', unit: 'vec4', count: 1 };
    case CompositionType.Vec3:
      return { fetchFunction: 'fetchElement', unit: 'vec4', count: 1 };
    case CompositionType.Vec3Array:
      return { fetchFunction: 'fetchVec3No16BytesAligned', unit: 'scalar', count: 3 };
    case CompositionType.Vec2:
      return { fetchFunction: 'fetchElement', unit: 'vec4', count: 1 };
    case CompositionType.Vec2Array:
      return { fetchFunction: 'fetchVec2No16BytesAligned', unit: 'scalar', count: 2 };
    case CompositionType.Scalar:
      return { fetchFunction: 'fetchElement', unit: 'vec4', count: 1 };
    case CompositionType.ScalarArray:
      return { fetchFunction: 'fetchScalarNo16BytesAligned', unit: 'scalar', count: 1 };
    case CompositionType.Mat4:
    case CompositionType.Mat4Array:
      return { fetchFunction: 'fetchMat4', unit: 'vec4', count: 4 };
    case CompositionType.Mat3:
      return { fetchFunction: 'fetchMat3', unit: 'vec4', count: 3 };
    case CompositionType.Mat3Array:
      return { fetchFunction: 'fetchMat3No16BytesAligned', unit: 'scalar', count: 9 };
    case CompositionType.Mat2:
      return {
        fetchFunction: 'fetchMat2',
        unit: 'vec4',
        count: 1,
        warning: 'MAT2 declares vec4SizeOfProperty=2 but fetchMat2 reads one texel.',
      };
    case CompositionType.Mat2Array:
      return {
        fetchFunction: 'fetchMat2No16BytesAligned',
        unit: 'scalar-weird',
        count: 1,
        warning: 'fetchMat2No16BytesAligned computes vec4_idx from scalar_idx * 4; the decoder mirrors the shader.',
      };
    case CompositionType.Mat4x3Array:
      return { fetchFunction: 'fetchMat4x3', unit: 'vec4', count: 3 };
    default:
      return {
        fetchFunction: 'unknown',
        unit: 'vec4',
        count: 1,
        warning: `Unsupported composition type "${compositionType.str}".`,
      };
  }
}

/**
 * Component members use a different set of fetch helpers from material semantics:
 * matrices read scalar-unaligned texels and Vec3/Scalar use scalar fetches.
 */
function getComponentFetchPlan(compositionType: CompositionTypeEnum): FetchPlan {
  switch (compositionType) {
    case CompositionType.Mat4:
    case CompositionType.Mat4Array:
      return { fetchFunction: 'fetchMat4', unit: 'vec4', count: 4 };
    case CompositionType.Mat3:
      return { fetchFunction: 'fetchMat3No16BytesAligned', unit: 'scalar', count: 9 };
    case CompositionType.Vec4:
    case CompositionType.Vec4Array:
      return { fetchFunction: 'fetchVec4', unit: 'vec4', count: 1 };
    case CompositionType.Vec3:
      return { fetchFunction: 'fetchVec3No16BytesAligned', unit: 'scalar', count: 3 };
    case CompositionType.Scalar:
      return { fetchFunction: 'fetchScalarNo16BytesAligned', unit: 'scalar', count: 1 };
    case CompositionType.Mat4x3Array:
      return { fetchFunction: 'fetchMat4x3', unit: 'vec4', count: 3 };
    default:
      return getFetchPlan(compositionType);
  }
}

function buildLocation(
  fetchPlan: FetchPlan,
  bufferViewIndex: number,
  vec4Index: number,
  scalarIndex: number | undefined,
  arrayElement: number | undefined,
  layout: DataTextureLayoutSource
): TexelLocation {
  const warnings: string[] = [];
  if (fetchPlan.warning != null) {
    warnings.push(fetchPlan.warning);
  }

  let effectiveVec4Index = vec4Index;
  let texelCount = fetchPlan.count;
  if (fetchPlan.unit === 'scalar' && scalarIndex != null) {
    effectiveVec4Index = Math.floor(scalarIndex / 4);
    const offsetInTexel = scalarIndex % 4;
    texelCount = Math.ceil((offsetInTexel + fetchPlan.count) / 4);
  } else if (fetchPlan.unit === 'scalar-weird' && scalarIndex != null) {
    effectiveVec4Index = scalarIndex * 4;
    texelCount = 1;
  }

  const row = layout.width > 0 ? Math.floor(effectiveVec4Index / layout.width) : -1;
  const col = layout.width > 0 ? effectiveVec4Index % layout.width : -1;
  const texels: Texel[] = [];
  for (let i = 0; i < texelCount; i++) {
    const texel = layout.readVec4(effectiveVec4Index + i);
    if (texel == null) {
      warnings.push(`Texel ${effectiveVec4Index + i} is outside the GPUInstanceData buffers.`);
      break;
    }
    texels.push(texel);
  }

  return {
    bufferViewIndex,
    vec4Index: effectiveVec4Index,
    row,
    col,
    fetchFunction: fetchPlan.fetchFunction,
    texels,
    scalarIndex: fetchPlan.unit === 'scalar' ? scalarIndex : undefined,
    arrayElement,
    warnings,
  };
}

function getArrayLengthForShader(info: ShaderSemanticsInfo): number {
  // Mirrors the shader generator: `info.arrayLength ?? 1`.
  return info.arrayLength ?? 1;
}

/**
 * Decodes the location(s) of a material semantic for a given material SID.
 *
 * Mirrors `WebGLStrategyWebGL2.__getShaderPropertyOfMaterial`:
 * - `bufferViewIndex = floor(materialSID / materialCountPerBufferView)`
 * - `indexInBufferView = materialSID % materialCountPerBufferView`
 * - non-array: `vec4Index = offsets[bv] + vec4Size * indexInBufferView`
 * - array: `offsets[bv] + vec4Size * arrayLength * indexInBufferView + vec4Size * elementIndex`
 */
export function decodeMaterialProperty(args: {
  info: ShaderSemanticsInfo;
  offsets: IndexOf16Bytes[];
  materialSID: number;
  materialCountPerBufferView: number;
  layout: DataTextureLayoutSource;
  maxArrayElements?: number;
}): DataTextureLocationInfo {
  const { info, offsets, materialSID, materialCountPerBufferView, layout } = args;
  const maxArrayElements = args.maxArrayElements ?? 4;
  const fetchPlan = getFetchPlan(info.compositionType);
  const arrayLengthForShader = getArrayLengthForShader(info);
  const vec4Size = info.compositionType.getVec4SizeOfProperty();
  const scalarSize = info.compositionType.getNumberOfComponents();
  const paddedAsVec4 = Math.ceil(scalarSize / 4) * 4;

  let bufferViewIndex = materialCountPerBufferView > 0 ? Math.floor(materialSID / materialCountPerBufferView) : 0;
  const indexInBufferView = materialCountPerBufferView > 0 ? materialSID % materialCountPerBufferView : 0;
  if (info.soloDatum) {
    bufferViewIndex = 0;
  }

  const warnings: string[] = [];
  if (info.soloDatum && materialCountPerBufferView > 0 && Math.floor(materialSID / materialCountPerBufferView) !== 0) {
    warnings.push(
      'soloDatum is stored once per material type, but the shader still applies indexInBufferView to the offset.'
    );
  }
  if (offsets.length === 0) {
    warnings.push('No material buffer view offsets were found.');
  }
  if (offsets[bufferViewIndex] == null) {
    warnings.push(`No offset for buffer view ${bufferViewIndex}; falling back to offsets[0].`);
  }
  const baseOffset = offsets[bufferViewIndex] ?? offsets[0] ?? 0;

  const locations: TexelLocation[] = [];
  if (CompositionType.isArray(info.compositionType)) {
    if (info.arrayLength == null) {
      warnings.push('Array semantic has no arrayLength; the shader uses 1 while allocation may use 100.');
    }
    const elementCount = Math.min(arrayLengthForShader, maxArrayElements);
    for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
      const vec4Index = baseOffset + vec4Size * arrayLengthForShader * indexInBufferView + vec4Size * elementIndex;
      const scalarIndex =
        baseOffset * 4 + paddedAsVec4 * arrayLengthForShader * indexInBufferView + scalarSize * elementIndex;
      locations.push(buildLocation(fetchPlan, bufferViewIndex, vec4Index, scalarIndex, elementIndex, layout));
    }
    if (arrayLengthForShader > elementCount) {
      warnings.push(`Only the first ${elementCount} of ${arrayLengthForShader} array elements are decoded.`);
    }
  } else {
    const vec4Index = baseOffset + vec4Size * indexInBufferView;
    locations.push(buildLocation(fetchPlan, bufferViewIndex, vec4Index, vec4Index * 4, undefined, layout));
  }

  if (warnings.length > 0 && locations.length > 0) {
    locations[0].warnings.push(...warnings);
  }

  return {
    bufferViewOffsets: offsets,
    bufferViewIndex,
    indexInBufferView,
    arrayLengthForShader,
    locations,
  };
}

/**
 * Decodes a global property. Global properties use instanceId 0, and array elements
 * use a plain `vec4Size` / `scalarSize` stride (no arrayLength multiplier).
 */
export function decodeGlobalProperty(args: {
  info: ShaderSemanticsInfo;
  offset: IndexOf16Bytes;
  layout: DataTextureLayoutSource;
  maxArrayElements?: number;
}): DataTextureLocationInfo {
  const { info, offset, layout } = args;
  const maxArrayElements = args.maxArrayElements ?? 4;
  const fetchPlan = getFetchPlan(info.compositionType);
  const arrayLengthForShader = getArrayLengthForShader(info);
  const vec4Size = info.compositionType.getVec4SizeOfProperty();
  const scalarSize = info.compositionType.getNumberOfComponents();
  const locations: TexelLocation[] = [];

  if (CompositionType.isArray(info.compositionType)) {
    const elementCount = Math.min(arrayLengthForShader, maxArrayElements);
    for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
      const vec4Index = offset + vec4Size * elementIndex;
      const scalarIndex = offset * 4 + scalarSize * elementIndex;
      locations.push(buildLocation(fetchPlan, 0, vec4Index, scalarIndex, elementIndex, layout));
    }
  } else {
    locations.push(buildLocation(fetchPlan, 0, offset, offset * 4, undefined, layout));
  }

  return {
    bufferViewOffsets: [offset],
    bufferViewIndex: 0,
    indexInBufferView: 0,
    arrayLengthForShader,
    locations,
  };
}

export type ComponentMemberLayoutInfo = {
  compositionType: CompositionTypeEnum;
  arrayLength?: Count;
  isVariableLength?: boolean;
};

/**
 * Decodes a component member. Mirrors `processForNonArrayType` / `processForArrayType`
 * in `WebGLStrategyWebGL2`.
 */
export function decodeComponentMember(args: {
  memberInfo: ComponentMemberLayoutInfo;
  offsets: IndexOf16Bytes[];
  componentSID: number;
  componentCountPerBufferView: number;
  layout: DataTextureLayoutSource;
  maxArrayElements?: number;
}): DataTextureLocationInfo {
  const { memberInfo, offsets, componentSID, componentCountPerBufferView, layout } = args;
  const maxArrayElements = args.maxArrayElements ?? 4;
  const fetchPlan = getComponentFetchPlan(memberInfo.compositionType);
  const vec4Size = memberInfo.compositionType.getVec4SizeOfProperty();
  const bufferViewIndex = componentCountPerBufferView > 0 ? Math.floor(componentSID / componentCountPerBufferView) : 0;
  const indexInBufferView = componentCountPerBufferView > 0 ? componentSID % componentCountPerBufferView : 0;
  const baseOffset = offsets[bufferViewIndex] ?? offsets[0] ?? 0;
  const locations: TexelLocation[] = [];
  const arrayLength = memberInfo.arrayLength ?? 0;

  if (CompositionType.isArray(memberInfo.compositionType)) {
    const elementCount = Math.min(arrayLength, maxArrayElements);
    for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
      const vec4Index = baseOffset + indexInBufferView * vec4Size * arrayLength + vec4Size * elementIndex;
      locations.push(buildLocation(fetchPlan, bufferViewIndex, vec4Index, vec4Index * 4, elementIndex, layout));
    }
  } else {
    let vec4Index = baseOffset;
    let scalarIndex = baseOffset * 4;
    switch (memberInfo.compositionType) {
      case CompositionType.Mat4:
        vec4Index = baseOffset + 4 * indexInBufferView;
        scalarIndex = vec4Index * 4;
        break;
      case CompositionType.Mat3:
        scalarIndex = baseOffset * 4 + 9 * indexInBufferView;
        break;
      case CompositionType.Vec4:
        vec4Index = baseOffset + indexInBufferView;
        scalarIndex = vec4Index * 4;
        break;
      case CompositionType.Vec3:
        scalarIndex = baseOffset * 4 + 3 * indexInBufferView;
        break;
      case CompositionType.Scalar:
        scalarIndex = baseOffset * 4 + indexInBufferView;
        break;
      default:
        break;
    }
    locations.push(buildLocation(fetchPlan, bufferViewIndex, vec4Index, scalarIndex, undefined, layout));
  }

  return {
    bufferViewOffsets: offsets,
    bufferViewIndex,
    indexInBufferView,
    arrayLengthForShader: arrayLength,
    locations,
  };
}

/**
 * Decodes a variable-length component member (e.g. SkeletalComponent.boneData).
 * The per-instance location is stored in `${memberName}Location` as
 * `location = x * 65536 + y`, with the element count in `z`.
 */
export function decodeVariableLengthComponentMember(args: {
  memberInfo: ComponentMemberLayoutInfo;
  offsets: IndexOf16Bytes[];
  locationMemberOffsets: IndexOf16Bytes[];
  componentSID: number;
  componentCountPerBufferView: number;
  layout: DataTextureLayoutSource;
  radix?: number;
  maxArrayElements?: number;
}): DataTextureLocationInfo {
  const { memberInfo, offsets, locationMemberOffsets, componentSID, componentCountPerBufferView, layout } = args;
  const maxArrayElements = args.maxArrayElements ?? 4;
  const radix = args.radix ?? 65536;
  const vec4Size = memberInfo.compositionType.getVec4SizeOfProperty();
  const bufferViewIndex = componentCountPerBufferView > 0 ? Math.floor(componentSID / componentCountPerBufferView) : 0;
  const indexInBufferView = componentCountPerBufferView > 0 ? componentSID % componentCountPerBufferView : 0;
  const locationBase = locationMemberOffsets[bufferViewIndex] ?? locationMemberOffsets[0] ?? 0;
  const locationVec4Index = locationBase + indexInBufferView;
  const locationTexel = layout.readVec4(locationVec4Index);

  const locations: TexelLocation[] = [];
  if (locationTexel == null) {
    locations.push({
      bufferViewIndex,
      vec4Index: locationVec4Index,
      row: layout.width > 0 ? Math.floor(locationVec4Index / layout.width) : -1,
      col: layout.width > 0 ? locationVec4Index % layout.width : -1,
      fetchFunction: 'fetchElement',
      texels: [],
      warnings: ['The variable-length location member could not be read.'],
    });
    return {
      bufferViewOffsets: offsets,
      bufferViewIndex,
      indexInBufferView,
      arrayLengthForShader: 0,
      locations,
    };
  }

  const location = Math.trunc(locationTexel[0]) * radix + Math.trunc(locationTexel[1]);
  const arrayLength = Math.max(0, Math.trunc(locationTexel[2]));
  const fetchPlan = getComponentFetchPlan(memberInfo.compositionType);
  const elementCount = Math.min(arrayLength, maxArrayElements);
  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    const vec4Index = location + vec4Size * elementIndex;
    locations.push(buildLocation(fetchPlan, bufferViewIndex, vec4Index, vec4Index * 4, elementIndex, layout));
  }
  if (arrayLength > elementCount) {
    if (locations.length > 0) {
      locations[0].warnings.push(`Only the first ${elementCount} of ${arrayLength} elements are decoded.`);
    }
  }

  return {
    bufferViewOffsets: offsets,
    bufferViewIndex,
    indexInBufferView,
    arrayLengthForShader: arrayLength,
    locations,
  };
}
