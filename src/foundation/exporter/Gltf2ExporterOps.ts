import type { AnimationChannel, AnimationPathName, AnimationSampler } from '../../types/AnimationTypes';
import type { Byte, Count, Index } from '../../types/CommonTypes';
import type {
  Gltf2,
  Gltf2Animation,
  Gltf2AnimationChannel,
  Gltf2AnimationPathName,
  Gltf2AnimationSampler,
} from '../../types/glTF2';
import type { Gltf2BufferViewEx, Gltf2Ex } from '../../types/glTF2ForOutput';
import { ComponentType, type ComponentTypeEnum } from '../definitions/ComponentType';
import type { Accessor } from '../memory/Accessor';
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
