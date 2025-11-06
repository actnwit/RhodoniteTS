import type { AnimationPathName } from '../../types/AnimationTypes';
import type { Byte, Index } from '../../types/CommonTypes';
import type { Gltf2AnimationPathName } from '../../types/glTF2';
import type { Gltf2BufferViewEx, Gltf2Ex } from '../../types/glTF2ForOutput';
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
