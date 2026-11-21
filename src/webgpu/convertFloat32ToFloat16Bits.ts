/**
 * Converts Float32 values to IEEE 754 half-float (Float16) bits.
 *
 * HDR textures are uploaded as half floats on devices without the optional
 * `float32-filterable` feature (e.g. iOS Safari). There an `rgba32float` texture cannot be
 * bound with the default `sampleType: 'float'` of the texture bind group layouts, so every
 * draw using it is rejected. Filtering 16-bit float textures is core WebGPU, so half floats
 * work everywhere.
 *
 * The conversion rounds to nearest, ties to even, and handles denormals, Infinity and NaN
 * exactly like the platform `Float16Array` conversion.
 *
 * @param src - Float32 values
 * @returns The same values encoded as half-float bits
 */
export function convertFloat32ToFloat16Bits(src: Float32Array): Uint16Array {
  const dst = new Uint16Array(src.length);
  const floatView = new Float32Array(1);
  const uint32View = new Uint32Array(floatView.buffer);
  for (let i = 0; i < src.length; i++) {
    floatView[0] = src[i];
    const x = uint32View[0];
    const sign = (x >>> 16) & 0x8000;
    const exp = (x >>> 23) & 0xff;
    const mant = x & 0x007fffff;

    if (exp === 0xff) {
      // Inf, or NaN (which keeps a non-zero mantissa so it does not turn into Inf).
      dst[i] = sign | 0x7c00 | (mant !== 0 ? 0x0200 : 0);
      continue;
    }

    const e = exp - 127;
    if (e > 15) {
      // Overflow: rounds to Inf.
      dst[i] = sign | 0x7c00;
      continue;
    }

    if (e >= -14) {
      // Normal half float: keep the 10 mantissa bits, rounding to nearest even.
      let halfExp = e + 15;
      let halfMant = mant >>> 13;
      const remainder = x & 0x1fff;
      if (remainder > 0x1000 || (remainder === 0x1000 && (halfMant & 1) === 1)) {
        halfMant++;
        if (halfMant === 0x400) {
          halfMant = 0;
          halfExp++;
          if (halfExp >= 31) {
            dst[i] = sign | 0x7c00;
            continue;
          }
        }
      }
      dst[i] = sign | (halfExp << 10) | halfMant;
      continue;
    }

    if (e >= -25 && e <= -15) {
      // Denormal half float: shift the implicit-one significand down to the 2^-24 unit,
      // rounding to nearest even. A carry out of the mantissa becomes the smallest normal.
      const significand = mant | 0x00800000;
      const shift = -e - 1;
      let halfMant = significand >>> shift;
      const remainder = significand & ((1 << shift) - 1);
      const halfway = 1 << (shift - 1);
      if (remainder > halfway || (remainder === halfway && (halfMant & 1) === 1)) {
        halfMant++;
      }
      dst[i] = sign | halfMant;
      continue;
    }

    // Underflows to signed zero.
    dst[i] = sign;
  }
  return dst;
}
