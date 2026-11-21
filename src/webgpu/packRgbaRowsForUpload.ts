import { convertFloat32ToFloat16Bits } from './convertFloat32ToFloat16Bits';

/** RGBA float rows packed for GPUQueue.copyBufferToTexture. */
export type PackedRgbaRows = {
  /** Padded rows, ready to copy into a mapped GPUBuffer. */
  data: Uint16Array | Float32Array;
  /** `bytesPerRow` for the copy, padded to the 256-byte alignment WebGPU requires. */
  bytesPerRow: number;
  /** Number of array elements per row (row stride of `data`). */
  elementsPerRow: number;
};

/**
 * Packs tightly packed RGBA Float32 rows into the padded layout that
 * GPUQueue.copyBufferToTexture requires.
 *
 * Rows must be padded to a multiple of 256 bytes. A row also has to be copied at
 * `elementsPerRow` in the destination array (components per row, including padding),
 * not at the number of texels in the row.
 *
 * @param src - Tightly packed RGBA Float32 pixel data
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param isFloat16 - Encode as half floats instead of 32-bit floats
 */
export function packRgbaRowsForUpload(
  src: Float32Array,
  width: number,
  height: number,
  isFloat16: boolean
): PackedRgbaRows {
  const componentSize = isFloat16 ? Uint16Array.BYTES_PER_ELEMENT : Float32Array.BYTES_PER_ELEMENT;
  const texelSize = 4 * componentSize;
  const paddedBytesPerRow = Math.ceil((width * texelSize) / 256) * 256;
  const elementsPerRow = paddedBytesPerRow / componentSize;

  const converted = isFloat16 ? convertFloat32ToFloat16Bits(src) : src;
  const rowElements = width * 4;
  if (isFloat16) {
    const halfFloats = converted as Uint16Array;
    const data = new Uint16Array(elementsPerRow * height);
    for (let y = 0; y < height; y++) {
      const sourceStart = y * rowElements;
      data.set(halfFloats.subarray(sourceStart, sourceStart + rowElements), y * elementsPerRow);
    }
    return { data, bytesPerRow: paddedBytesPerRow, elementsPerRow };
  }

  const floats = converted as Float32Array;
  const data = new Float32Array(elementsPerRow * height);
  for (let y = 0; y < height; y++) {
    const sourceStart = y * rowElements;
    data.set(floats.subarray(sourceStart, sourceStart + rowElements), y * elementsPerRow);
  }
  return { data, bytesPerRow: paddedBytesPerRow, elementsPerRow };
}
