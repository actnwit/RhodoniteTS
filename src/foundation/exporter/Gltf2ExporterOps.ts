import type { AnimationChannel, AnimationPathName, AnimationSampler } from '../../types/AnimationTypes';
import type { Array1to4, Byte, Count, Index } from '../../types/CommonTypes';
import type {
  Gltf2,
  Gltf2AccessorCompositionTypeString,
  Gltf2Animation,
  Gltf2AnimationChannel,
  Gltf2AnimationPathName,
  Gltf2AnimationSampler,
} from '../../types/glTF2';
import type { Gltf2AccessorEx, Gltf2BufferViewEx, Gltf2Ex } from '../../types/glTF2ForOutput';
import type { ComponentTypeEnum, CompositionTypeEnum } from '../definitions';
import { ComponentType, type Gltf2AccessorComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import type { Accessor } from '../memory/Accessor';
import type { Buffer } from '../memory/Buffer';
import type { BufferView } from '../memory/BufferView';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';

/**
 * Creates a new glTF 2.0 buffer view and adds it to the provided glTF JSON object.
 * This function manages buffer view creation with proper byte alignment and offset calculation.
 *
 * @param json - The glTF 2.0 JSON object to add the buffer view to
 * @param bufferIdx - The index of the buffer that this buffer view will reference
 * @param uint8Array - The raw binary data to be stored in this buffer view
 * @returns The created buffer view object with extended properties
 *
 * @remarks
 * This function automatically handles:
 * - Calculating the correct byte offset based on accumulated buffer view lengths
 * - Adding necessary padding bytes for proper alignment (4-byte alignment)
 * - Updating the accumulated byte length tracking for the specified buffer
 * - Adding the buffer view to the glTF JSON structure
 *
 * @example
 * ```typescript
 * const gltf = createEmptyGltf2();
 * const vertexData = new Uint8Array([1, 2, 3, 4]);
 * const bufferView = createAndAddGltf2BufferView(gltf, 0, vertexData);
 * ```
 */
export function createAndAddGltf2BufferView(
  json: Gltf2Ex,
  bufferIdx: Index,
  uint8Array: Uint8Array
): Gltf2BufferViewEx {
  const bufferViewByteLengthAccumulated = json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx];
  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: uint8Array.byteLength,
    byteOffset: bufferViewByteLengthAccumulated,
    extras: {
      uint8Array,
    },
  };

  const nextBufferViewBytesLengthAccumulated =
    DataUtil.addPaddingBytes(gltfBufferViewEx.byteLength, 4) + bufferViewByteLengthAccumulated;

  json.bufferViews.push(gltfBufferViewEx);
  json.extras.bufferViewByteLengthAccumulatedArray[bufferIdx] = nextBufferViewBytesLengthAccumulated;
  return gltfBufferViewEx;
}

/**
 * Accumulates buffer view byte length with proper alignment.
 *
 * Calculates the total accumulated byte length for a buffer view, including
 * necessary padding bytes for 4-byte alignment. Used to track buffer offsets
 * when creating multiple buffer views in sequence.
 *
 * @param bufferViewByteLengthAccumulatedArray - Array tracking accumulated lengths per buffer
 * @param bufferIdxToSet - Index of the target buffer
 * @param gltf2BufferView - The buffer view to accumulate
 * @returns Updated accumulated byte length
 */
export function accumulateBufferViewByteLength(
  bufferViewByteLengthAccumulatedArray: number[],
  bufferIdxToSet: number,
  gltf2BufferView: Gltf2BufferViewEx
): number {
  const bufferViewLengthAligned = Is.exist(bufferViewByteLengthAccumulatedArray[bufferIdxToSet])
    ? bufferViewByteLengthAccumulatedArray[bufferIdxToSet] + DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4)
    : DataUtil.addPaddingBytes(gltf2BufferView.byteLength, 4);

  return bufferViewLengthAligned;
}

/**
 * Converts Rhodonite animation path names to glTF2 format.
 *
 * @param path - The Rhodonite animation path name
 * @returns The corresponding glTF2 animation path name
 * @throws Error if the path name is invalid
 */
export function convertToGltfAnimationPathName(path: AnimationPathName): Gltf2AnimationPathName {
  switch (path) {
    case 'translate':
      return 'translation';
    case 'quaternion':
      return 'rotation';
    case 'scale':
      return 'scale';
    case 'weights':
      return 'weights';
    // case 'effekseer':
    //   return 'effekseer';
    default:
      throw new Error('Invalid Path Name');
  }
}

/**
 * Aligns accessor byte offset to 4-byte boundaries.
 *
 * glTF2 specification requires that accessor byte offsets be aligned to
 * 4-byte boundaries for optimal performance and compatibility.
 *
 * @param byteOffset - Byte offset that may not be aligned
 * @returns Aligned byte offset
 */
export function alignAccessorByteOffsetTo4Bytes(byteOffset: Byte): Byte {
  const alignSize = 4;
  if (byteOffset % 4 === 0) {
    return byteOffset;
  }
  return byteOffset + (alignSize - (byteOffset % alignSize));
}

/**
 * Aligns buffer view byte stride to 4-byte boundaries.
 *
 * For performance and compatibility reasons, bufferView.byteStride must be
 * a multiple of 4 for vertex attributes.
 *
 * @param byteStride - Byte stride that may not be aligned
 * @returns Aligned byte stride
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
export function alignBufferViewByteStrideTo4Bytes(byteStride: Byte): Byte {
  const alignSize = 4;
  if (byteStride % 4 === 0) {
    return byteStride;
  }
  const byteStrideAlgined = byteStride + (alignSize - (byteStride % alignSize));

  return byteStrideAlgined;
}

/**
 * Type guard for checking if an ArrayBufferView has numeric array properties.
 */
export type NumericArrayBufferView = ArrayBufferView & { length: number; [index: number]: number };

/**
 * Type guard function to check if an ArrayBufferView is a numeric array buffer view.
 *
 * @param view - The ArrayBufferView to check
 * @returns True if the view has numeric array properties
 */
export function isNumericArrayBufferView(view: ArrayBufferView): view is NumericArrayBufferView {
  return typeof (view as any).length === 'number';
}

/**
 * Creates a glTF2 animation channel from Rhodonite animation data.
 *
 * @param channel - The Rhodonite animation channel
 * @param samplerIdx - Current sampler index
 * @param animation - The glTF2 animation to add the channel to
 * @param entityIdx - Index of the target entity
 * @returns Updated sampler index
 */
export function createGltf2AnimationChannel(
  channel: AnimationChannel,
  samplerIdx: Index,
  animation: Gltf2Animation,
  entityIdx: Index
): Index {
  const pathName = channel.target.pathName as AnimationPathName;

  const channelJson: Gltf2AnimationChannel = {
    sampler: samplerIdx++,
    target: {
      path: convertToGltfAnimationPathName(pathName),
      node: entityIdx,
    },
  };
  animation.channels.push(channelJson);
  return samplerIdx;
}

/**
 * Creates a glTF2 animation sampler from Rhodonite sampler data.
 *
 * @param inputAccessorIdx - Index of the input (time) accessor
 * @param outputAccessorIdx - Index of the output (value) accessor
 * @param sampler - The Rhodonite animation sampler
 * @param animation - The glTF2 animation to add the sampler to
 */
export function createGltf2AnimationSampler(
  inputAccessorIdx: number,
  outputAccessorIdx: number,
  sampler: AnimationSampler,
  animation: Gltf2Animation
): void {
  const samplerJson: Gltf2AnimationSampler = {
    input: inputAccessorIdx,
    output: outputAccessorIdx,
    interpolation: sampler.interpolationMethod.GltfString,
  };
  animation.samplers.push(samplerJson);
}

/**
 * Aligns buffer view byte length to proper boundaries.
 *
 * Calculates the aligned end position of a buffer view and returns the delta
 * needed to align it properly. Used to maintain proper memory alignment when
 * creating multiple buffer views sequentially.
 *
 * @param bufferViewByteLengthAccumulated - Current accumulated byte length
 * @param bufferView - The buffer view to align
 * @returns Delta value for alignment (non-negative)
 */
export function alignBufferViewByteLength(
  bufferViewByteLengthAccumulated: number,
  bufferView: Gltf2BufferViewEx
): number {
  const bufferViewEnd = bufferView.byteOffset + bufferView.byteLength;
  const alignedEnd = bufferViewEnd + DataUtil.calcPaddingBytes(bufferViewEnd, 4);
  const delta = alignedEnd - bufferViewByteLengthAccumulated;
  return delta >= 0 ? delta : 0;
}

/**
 * Resolves the byteStride to be written to a glTF bufferView for vertex attributes.
 *
 * Prefers the bufferView's explicit stride or accessor stride when available and
 * guarantees the result is large enough for the accessor's element width and aligned
 * to 4 bytes to satisfy glTF requirements.
 *
 * @param rnBufferView - Source buffer view
 * @param rnAccessor - Accessor that references the buffer view
 * @returns The resolved stride in bytes or undefined when stride should be omitted
 */
export function resolveVertexAttributeByteStride(rnBufferView: BufferView, rnAccessor: Accessor): Byte | undefined {
  const candidates: number[] = [];
  const defaultStride = rnBufferView.defaultByteStride;
  if (defaultStride > 0) {
    candidates.push(defaultStride);
  }
  const accessorStride = rnAccessor.byteStride;
  if (accessorStride > 0) {
    candidates.push(accessorStride);
  }
  const elementSize = rnAccessor.elementSizeInBytes;
  if (elementSize > 0) {
    candidates.push(elementSize);
  }

  if (candidates.length === 0) {
    return undefined;
  }

  const resolved = Math.max(...candidates);
  const aligned = alignBufferViewByteStrideTo4Bytes(resolved as Byte);

  return aligned < elementSize ? elementSize : aligned;
}

/**
 * Generates a complete glTF2 Binary (.glb) ArrayBuffer from JSON and binary data.
 *
 * Combines the glTF2 JSON document and binary buffer into a single .glb file
 * following the glTF2 binary format specification. Handles proper chunk
 * alignment and header construction.
 *
 * @param json - The glTF2 JSON document to embed
 * @param arraybuffer - Binary data buffer to include
 * @returns Complete .glb file as ArrayBuffer
 */
export function generateGlbArrayBuffer(json: Gltf2, arraybuffer: ArrayBuffer): ArrayBuffer {
  const headerBytes = 12; // 12byte-header

  // .glb file
  json.buffers![0].uri = undefined;
  let jsonStr = JSON.stringify(json, null, 2);
  let jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  const paddingBytes = DataUtil.calcPaddingBytes(jsonArrayBuffer.byteLength, 4);
  if (paddingBytes > 0) {
    for (let i = 0; i < paddingBytes; i++) {
      jsonStr += ' ';
    }
    jsonArrayBuffer = DataUtil.stringToBuffer(jsonStr);
  }
  const jsonChunkLength = jsonArrayBuffer.byteLength;
  const headerAndChunk0 = headerBytes + 4 + 4 + jsonChunkLength; // Chunk-0
  const totalBytes = headerAndChunk0 + 4 + 4 + arraybuffer.byteLength; // Chunk-1

  const glbArrayBuffer = new ArrayBuffer(totalBytes);
  const dataView = new DataView(glbArrayBuffer);
  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 2, true);
  dataView.setUint32(8, totalBytes, true);
  dataView.setUint32(12, jsonArrayBuffer.byteLength, true);
  dataView.setUint32(16, 0x4e4f534a, true);

  DataUtil.copyArrayBufferAs4Bytes({
    src: jsonArrayBuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: jsonArrayBuffer.byteLength,
    distByteOffset: 20,
  });
  DataUtil.copyArrayBufferAs4Bytes({
    src: arraybuffer,
    dist: glbArrayBuffer,
    srcByteOffset: 0,
    copyByteLength: arraybuffer.byteLength,
    distByteOffset: 20 + jsonChunkLength + 8,
  });
  dataView.setUint32(headerAndChunk0, arraybuffer.byteLength, true);
  dataView.setUint32(headerAndChunk0 + 4, 0x004e4942, true);
  return glbArrayBuffer;
}

/**
 * Type definition for buffer view byte length calculation parameters.
 */
export type BufferViewByteLengthDesc = {
  /** Byte offset of the accessor within the buffer view */
  accessorByteOffset: Byte;
  /** Number of elements in the accessor */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Byte offset of the buffer view within the buffer */
  bufferViewByteOffset: Byte;
  /** Size in bytes of each component */
  sizeOfComponent: Byte;
  /** Number of components per element */
  numberOfComponents: number;
};

/**
 * Calculates BufferView byte length and byte offset according to glTF2 specification.
 *
 * Ensures proper data alignment for performance and compatibility. Each element
 * of a vertex attribute must be aligned to 4-byte boundaries inside a bufferView.
 *
 * @param params - Parameters for calculation including offsets and sizes
 * @returns Object containing fixed byte length and offset values
 *
 * @see https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#data-alignment
 */
export function calcBufferViewByteLengthAndByteOffset({
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  bufferViewByteOffset,
  sizeOfComponent,
  numberOfComponents,
}: BufferViewByteLengthDesc): {
  fixedBufferViewByteLength: Byte;
  fixedBufferViewByteOffset: Byte;
} {
  // When byteStride of the referenced bufferView is not defined,
  // it means that accessor elements are tightly packed,
  //   i.e., effective stride equals the size of the element.
  const effectiveByteStride = bufferViewByteStride === 0 ? sizeOfComponent * numberOfComponents : bufferViewByteStride;

  // When byteStride is defined,
  //   it MUST be a multiple of the size of the accessor's component type.
  if (bufferViewByteStride % sizeOfComponent !== 0) {
    throw Error(
      "glTF2: When byteStride is defined, it MUST be a multiple of the size of the accessor's component type."
    );
  }

  // MUST be 4 bytes aligned
  const effectiveByteStrideAligned = alignBufferViewByteStrideTo4Bytes(effectiveByteStride);
  // MUST be 4 bytes aligned
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  // calc BufferView byteLength as following,
  //
  //  Each accessor MUST fit its bufferView, i.e.,
  //  ```
  //  accessor.byteOffset + EFFECTIVE_BYTE_STRIDE * (accessor.count - 1) + SIZE_OF_COMPONENT * NUMBER_OF_COMPONENTS
  //  ```
  //   MUST be less than or equal to bufferView.length.
  const bufferViewByteLength =
    alignedAccessorByteOffset + effectiveByteStrideAligned * (accessorCount - 1) + sizeOfComponent * numberOfComponents;

  // The offset of an accessor into a bufferView (i.e., accessor.byteOffset)
  //   and the offset of an accessor into a buffer (i.e., accessor.byteOffset + bufferView.byteOffset)
  //     MUST be a multiple of the size of the accessor's component type.
  const valByteLength = sizeOfComponent * numberOfComponents;
  const sumByteOffset = alignedAccessorByteOffset + bufferViewByteOffset;
  const paddingByte = valByteLength - (sumByteOffset % valByteLength);
  const fixedBufferViewByteOffset = bufferViewByteOffset + paddingByte;

  // MUST be 4 bytes aligned
  const alignedBufferViewByteOffset = alignAccessorByteOffsetTo4Bytes(fixedBufferViewByteOffset);

  const fixedBufferViewByteLength = bufferViewByteLength;
  return {
    fixedBufferViewByteLength,
    fixedBufferViewByteOffset: alignedBufferViewByteOffset,
  };
}

/**
 * Clamps a weight value to the valid range [0, 1].
 *
 * @param value - The weight value to clamp
 * @returns Clamped value between 0 and 1
 */
export function clampWeight(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

/**
 * Sanitizes a skin weight value to ensure it's valid.
 *
 * Ensures the weight is finite, non-negative, and within the valid range [0, 1].
 *
 * @param weight - The weight value to sanitize
 * @returns Object containing the sanitized value and whether it was mutated
 */
export function sanitizeSkinWeight(weight: number): { value: number; mutated: boolean } {
  if (!Number.isFinite(weight) || weight < 0) {
    return { value: 0, mutated: weight !== 0 };
  }
  if (weight > 1) {
    return { value: 1, mutated: true };
  }
  return { value: weight, mutated: false };
}

/**
 * Gets the maximum value for a normalized unsigned component type.
 *
 * @param componentType - The component type enum
 * @returns Maximum value for the component type
 */
export function getNormalizedUnsignedComponentMax(componentType: ComponentTypeEnum): number {
  if (componentType === ComponentType.UnsignedByte) {
    return 255;
  }
  if (componentType === ComponentType.UnsignedShort) {
    return 65535;
  }
  if (componentType === ComponentType.UnsignedInt) {
    return 4294967295;
  }
  return 1;
}

/**
 * Creates an unsigned typed array based on the component type.
 *
 * @param componentType - The component type enum
 * @param length - The length of the array to create
 * @returns The created typed array
 * @throws Error if the component type is not supported
 */
export function createUnsignedTypedArray(
  componentType: ComponentTypeEnum,
  length: number
): Uint8Array | Uint16Array | Uint32Array {
  if (componentType === ComponentType.UnsignedByte) {
    return new Uint8Array(length);
  }
  if (componentType === ComponentType.UnsignedShort) {
    return new Uint16Array(length);
  }
  if (componentType === ComponentType.UnsignedInt) {
    return new Uint32Array(length);
  }
  throw new Error('Unsupported component type for normalized weights');
}

/**
 * Parameters for creating a glTF2 accessor.
 */
export interface Gltf2AccessorDesc {
  /** Index of the buffer view */
  bufferViewIdx: Index;
  /** Byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Component type (e.g., FLOAT, UNSIGNED_SHORT) */
  componentType: ComponentTypeEnum;
  /** Number of elements */
  count: Count;
  /** Composition type (e.g., VEC3, MAT4) */
  compositionType: CompositionTypeEnum;
  /** Minimum values for each component */
  min?: Array1to4<number>;
  /** Maximum values for each component */
  max?: Array1to4<number>;
}

/**
 * Parameters for creating a glTF2 buffer view.
 */
export interface Gltf2BufferViewDesc {
  /** Index of the buffer */
  bufferIdx: Index;
  /** Byte offset within the buffer */
  bufferViewByteOffset: Byte;
  /** Accessor byte offset within the buffer view */
  accessorByteOffset: Byte;
  /** Number of accessor elements */
  accessorCount: Count;
  /** Byte stride of the buffer view */
  bufferViewByteStride: Byte;
  /** Component type */
  componentType: ComponentTypeEnum;
  /** Composition type */
  compositionType: CompositionTypeEnum;
  /** Raw data as Uint8Array */
  uint8Array: Uint8Array;
}

/**
 * Calculates the accessor index for deduplication purposes.
 *
 * @param existingUniqueRnAccessors - Array of unique accessors
 * @param rnAccessor - The accessor to find
 * @returns Index of the accessor or -1 if not found
 */
export function calcAccessorIdxToSet(existingUniqueRnAccessors: Accessor[], rnAccessor: Accessor): number {
  const accessorIdx = existingUniqueRnAccessors.findIndex(accessor => {
    return accessor.isSame(rnAccessor);
  });
  return accessorIdx;
}

/**
 * Finds the index of an existing buffer view in the cache.
 *
 * @param existingUniqueRnBufferViews - Array of unique buffer views
 * @param rnBufferView - The buffer view to search for
 * @returns Index of the buffer view or -1 if not found
 */
export function findBufferViewIdx(existingUniqueRnBufferViews: BufferView[], rnBufferView: BufferView): number {
  const bufferViewIdx = existingUniqueRnBufferViews.findIndex(bufferView => bufferView.isSame(rnBufferView));
  return bufferViewIdx;
}

/**
 * Calculates the buffer index for deduplication purposes.
 *
 * @param existingUniqueRnBuffers - Array of unique buffers
 * @param rnBuffer - The buffer to find or add
 * @returns Index where the buffer should be placed
 */
export function calcBufferIdxToSet(existingUniqueRnBuffers: Buffer[], rnBuffer: Buffer): number {
  if (existingUniqueRnBuffers.length === 0) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  const bufferIdx = existingUniqueRnBuffers.findIndex(buffer => buffer.isSame(rnBuffer));
  const bufferIdxToSet = bufferIdx === -1 ? existingUniqueRnBuffers.length : bufferIdx;
  if (bufferIdx === -1) {
    existingUniqueRnBuffers.push(rnBuffer);
  }
  return bufferIdxToSet;
}

/**
 * Creates a glTF2 BufferView for animation data.
 *
 * @param params - Parameters for buffer view creation
 * @returns Created glTF2 buffer view with proper alignment
 */
export function createGltf2BufferViewForAnimation({
  bufferIdx,
  bufferViewByteOffset,
  accessorByteOffset,
  accessorCount,
  bufferViewByteStride,
  componentType,
  compositionType,
  uint8Array,
}: Gltf2BufferViewDesc): Gltf2BufferViewEx {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);
  const { fixedBufferViewByteLength, fixedBufferViewByteOffset } = calcBufferViewByteLengthAndByteOffset({
    accessorByteOffset: alignedAccessorByteOffset,
    accessorCount: accessorCount,
    bufferViewByteStride,
    bufferViewByteOffset,
    sizeOfComponent: componentType.getSizeInBytes(),
    numberOfComponents: compositionType.getNumberOfComponents(),
  });

  const gltfBufferViewEx: Gltf2BufferViewEx = {
    buffer: bufferIdx,
    byteLength: fixedBufferViewByteLength,
    byteOffset: fixedBufferViewByteOffset,
    extras: {
      uint8Array,
    },
  };

  return gltfBufferViewEx;
}

/**
 * Creates a glTF2 Accessor for animation data.
 *
 * @param params - Parameters for accessor creation
 * @returns Created glTF2 accessor with proper type information
 */
export function createGltf2AccessorForAnimation({
  bufferViewIdx,
  accessorByteOffset,
  componentType,
  count,
  compositionType,
  min,
  max,
}: Gltf2AccessorDesc): Gltf2AccessorEx {
  const alignedAccessorByteOffset = alignAccessorByteOffsetTo4Bytes(accessorByteOffset);

  const gltf2AccessorEx = {
    bufferView: bufferViewIdx,
    byteOffset: alignedAccessorByteOffset,
    componentType: ComponentType.toGltf2AccessorComponentType(componentType),
    count,
    type: compositionType.str as Gltf2AccessorCompositionTypeString,
    min,
    max,
    extras: {},
  };
  return gltf2AccessorEx;
}

/**
 * Epsilon value for tangent vector calculations.
 */
export const TANGENT_EPSILON = 1e-6;

/**
 * Epsilon value for skin weight sum calculations.
 */
export const SKIN_WEIGHT_SUM_EPSILON = 1e-6;

/**
 * Epsilon value for skin weight difference calculations.
 */
export const SKIN_WEIGHT_DIFF_EPSILON = 1e-6;

/**
 * Tolerance value for skin weight residual calculations.
 */
export const SKIN_WEIGHT_RESIDUAL_TOLERANCE = 1e-6;

/**
 * Type definition for weight typed arrays.
 */
export type WeightTypedArray = Float32Array | Uint8Array | Uint16Array | Uint32Array;

/**
 * Accumulates a 3D vector into a Float32Array at the specified index.
 *
 * @param array - The Float32Array to accumulate into
 * @param index - The index of the vector
 * @param x - X component
 * @param y - Y component
 * @param z - Z component
 */
export function accumulateVector3(array: Float32Array, index: number, x: number, y: number, z: number): void {
  array[index * 3 + 0] += x;
  array[index * 3 + 1] += y;
  array[index * 3 + 2] += z;
}

/**
 * Builds an orthonormal vector perpendicular to the given normal.
 *
 * Creates a vector that is orthogonal to the provided normal vector,
 * used as a fallback when tangent vectors are degenerate.
 *
 * @param normal - Optional normal vector
 * @returns Orthonormal vector
 */
export function buildOrthonormalVector(normal?: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  if (!normal) {
    return { x: 1, y: 0, z: 0 };
  }

  const nx = normal.x;
  const ny = normal.y;
  const nz = normal.z;
  const normalLength = Math.hypot(nx, ny, nz);

  let ux = 0;
  let uy = 0;
  let uz = 1;

  if (normalLength > TANGENT_EPSILON) {
    const invLength = 1 / normalLength;
    const nnx = nx * invLength;
    const nny = ny * invLength;
    const nnz = nz * invLength;

    if (Math.abs(nnx) < 0.999) {
      ux = 1;
      uy = 0;
      uz = 0;
    } else {
      ux = 0;
      uy = 1;
      uz = 0;
    }

    // tangent = normalize(cross(up, normal))
    const tx = uy * nnz - uz * nny;
    const ty = uz * nnx - ux * nnz;
    const tz = ux * nny - uy * nnx;
    const tLength = Math.hypot(tx, ty, tz);
    if (tLength > TANGENT_EPSILON) {
      const inv = 1 / tLength;
      return { x: tx * inv, y: ty * inv, z: tz * inv };
    }
  }

  return { x: 1, y: 0, z: 0 };
}

/**
 * Normalizes a tangent vector and ensures it's orthogonal to the normal.
 *
 * Handles degenerate cases where the tangent vector is too small or parallel
 * to the normal vector by using a fallback orthonormal vector.
 *
 * @param tangent - The tangent vector to normalize
 * @param normal - Optional normal vector for orthogonalization
 * @param bitangent - Optional bitangent vector for handedness calculation
 * @returns Normalized tangent vector with w component indicating handedness
 */
export function normalizeTangentVector(
  tangent: { x: number; y: number; z: number; w: number },
  normal?: { x: number; y: number; z: number },
  bitangent?: { x: number; y: number; z: number }
): { x: number; y: number; z: number; w: number } {
  let tx = tangent.x;
  let ty = tangent.y;
  let tz = tangent.z;

  if (normal) {
    const dotNT = normal.x * tx + normal.y * ty + normal.z * tz;
    tx -= normal.x * dotNT;
    ty -= normal.y * dotNT;
    tz -= normal.z * dotNT;
  }

  let length = Math.hypot(tx, ty, tz);
  if (length <= TANGENT_EPSILON) {
    const fallback = buildOrthonormalVector(normal);
    tx = fallback.x;
    ty = fallback.y;
    tz = fallback.z;
    length = 1;
  } else {
    tx /= length;
    ty /= length;
    tz /= length;
  }

  let w = tangent.w !== 0 ? (tangent.w >= 0 ? 1 : -1) : 1;
  if (normal && bitangent) {
    const crossX = normal.y * tz - normal.z * ty;
    const crossY = normal.z * tx - normal.x * tz;
    const crossZ = normal.x * ty - normal.y * tx;
    const handedness = crossX * bitangent.x + crossY * bitangent.y + crossZ * bitangent.z;
    if (handedness < 0) {
      w = -1;
    }
  }

  return { x: tx, y: ty, z: tz, w };
}

/**
 * Processes a single skin weight element, sanitizing and normalizing values.
 *
 * @param accessor - The accessor containing weight data
 * @param elementIndex - Index of the element to process
 * @param baseIndex - Base index in the float data array
 * @param componentCount - Number of components per element
 * @param treatAsNormalizedUnsignedInt - Whether to treat values as normalized unsigned integers
 * @param normalizationDenominator - Denominator for normalization
 * @param floatData - Float32Array to store processed data
 * @returns True if any values were mutated
 */
export function processSkinWeightElement(
  accessor: Accessor,
  elementIndex: number,
  baseIndex: number,
  componentCount: number,
  treatAsNormalizedUnsignedInt: boolean,
  normalizationDenominator: number,
  floatData: Float32Array
): boolean {
  let mutated = false;
  let sum = 0;

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    const offset = componentIndex * accessor.componentSizeInBytes;
    const rawValue = accessor.getScalarAt(elementIndex, offset, {});
    const scaled = treatAsNormalizedUnsignedInt ? rawValue / normalizationDenominator : rawValue;
    const sanitized = sanitizeSkinWeight(scaled);
    if (sanitized.mutated) {
      mutated = true;
    }
    floatData[baseIndex + componentIndex] = sanitized.value;
    sum += sanitized.value;
  }

  if (normalizeSkinWeightElement(floatData, baseIndex, componentCount, sum)) {
    mutated = true;
  }

  return mutated;
}

/**
 * Normalizes skin weight elements to sum to 1.0.
 *
 * @param floatData - Float32Array containing weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param sum - Current sum of weights
 * @returns True if normalization was performed
 */
export function normalizeSkinWeightElement(
  floatData: Float32Array,
  baseIndex: number,
  componentCount: number,
  sum: number
): boolean {
  if (sum > SKIN_WEIGHT_SUM_EPSILON) {
    if (Math.abs(sum - 1) > SKIN_WEIGHT_DIFF_EPSILON) {
      const invSum = 1 / sum;
      let normalizedSum = 0;
      for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
        const normalized = Math.fround(floatData[baseIndex + componentIndex] * invSum);
        floatData[baseIndex + componentIndex] = normalized;
        normalizedSum += normalized;
      }
      const residual = 1 - normalizedSum;
      adjustWeightsForResidual(floatData, baseIndex, componentCount, residual, SKIN_WEIGHT_RESIDUAL_TOLERANCE);
      return true;
    }
    return false;
  }
  if (sum !== 0) {
    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
      floatData[baseIndex + componentIndex] = 0;
    }
    return true;
  }
  return false;
}

/**
 * Scales skin weight elements to unsigned integer range.
 *
 * @param floatData - Float32Array containing normalized weight data
 * @param baseIndex - Base index of the element
 * @param componentCount - Number of components per element
 * @param typedArray - Target typed array for scaled values
 * @param maxValue - Maximum value for the component type
 */
export function scaleSkinWeightElementToUnsigned(
  floatData: Float32Array,
  baseIndex: number,
  componentCount: number,
  typedArray: WeightTypedArray,
  maxValue: number
): void {
  const scaled = new Array<number>(componentCount);
  let total = 0;

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    const clamped = Math.max(0, Math.min(floatData[baseIndex + componentIndex], 1));
    const value = Math.round(clamped * maxValue);
    scaled[componentIndex] = value;
    total += value;
  }

  let diff = maxValue - total;
  if (diff !== 0) {
    rebalanceScaledSkinWeights(diff, scaled, componentCount, maxValue, floatData, baseIndex);
  }

  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    typedArray[baseIndex + componentIndex] = scaled[componentIndex];
  }
}

/**
 * Rebalances scaled skin weights to sum to the maximum value.
 *
 * @param diff - Difference to distribute
 * @param scaled - Array of scaled weight values
 * @param componentCount - Number of components
 * @param maxValue - Maximum value for the component type
 * @param floatData - Original float data for reference
 * @param baseIndex - Base index of the element
 */
export function rebalanceScaledSkinWeights(
  diff: number,
  scaled: number[],
  componentCount: number,
  maxValue: number,
  floatData: Float32Array,
  baseIndex: number
): void {
  const indices = Array.from({ length: componentCount }, (_, idx) => idx).sort(
    (a, b) => floatData[baseIndex + b] - floatData[baseIndex + a]
  );

  for (const idx of indices) {
    if (diff === 0) {
      break;
    }
    if (diff > 0) {
      const available = maxValue - scaled[idx];
      if (available <= 0) {
        continue;
      }
      const delta = Math.min(available, diff);
      scaled[idx] += delta;
      diff -= delta;
    } else {
      const available = scaled[idx];
      if (available <= 0) {
        continue;
      }
      const delta = Math.min(available, -diff);
      scaled[idx] -= delta;
      diff += delta;
    }
  }

  if (diff !== 0 && indices.length > 0) {
    const idx = indices[0];
    const baseValue = scaled[idx];
    const newValue = Math.max(0, Math.min(maxValue, baseValue + diff));
    scaled[idx] = newValue;
  }
}

/**
 * Adjusts weights to account for residual error after normalization.
 *
 * Distributes residual error across weights, prioritizing larger weights.
 *
 * @param data - Float32Array containing weight data
 * @param offset - Offset index in the array
 * @param componentCount - Number of components
 * @param residual - Residual error to distribute
 * @param tolerance - Tolerance for residual error
 */
export function adjustWeightsForResidual(
  data: Float32Array,
  offset: number,
  componentCount: number,
  residual: number,
  tolerance: number
): void {
  if (componentCount === 0 || Math.abs(residual) <= tolerance) {
    return;
  }

  const indices = Array.from({ length: componentCount }, (_, idx) => idx).sort(
    (a, b) => data[offset + b] - data[offset + a]
  );

  let remaining = residual;
  for (const localIndex of indices) {
    if (Math.abs(remaining) <= tolerance) {
      break;
    }
    const idx = offset + localIndex;
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
    remaining -= candidate - before;
  }

  if (Math.abs(remaining) > tolerance) {
    const idx = offset + indices[0];
    const before = data[idx];
    const candidate = clampWeight(before + remaining);
    data[idx] = candidate;
  }
}
