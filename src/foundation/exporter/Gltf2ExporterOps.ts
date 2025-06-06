import type { Index } from '../../types/CommonTypes';
import type { Gltf2BufferViewEx, Gltf2Ex } from '../../types/glTF2ForOutput';
import { DataUtil } from '../misc/DataUtil';

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
