import {Size} from '../../types/CommonTypes';

//import GLBoost from '../../globals';

function radianToDegree(rad: number) {
  return (rad * 180) / Math.PI;
}

function degreeToRadian(deg: number) {
  return (deg * Math.PI) / 180;
}

// https://gamedev.stackexchange.com/questions/17326/conversion-of-a-number-from-single-precision-floating-point-representation-to-a/17410#17410
const toHalfFloat = (function () {
  const floatView = new Float32Array(1);
  const int32View = new Int32Array(floatView.buffer);

  /* This method is faster than the OpenEXR implementation (very often
   * used, eg. in Ogre), with the additional benefit of rounding, inspired
   * by James Tursa?s half-precision code. */
  return function toHalf(val: number) {
    floatView[0] = val;
    const x = int32View[0];

    let bits = (x >> 16) & 0x8000; /* Get the sign */
    let m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
    const e = (x >> 23) & 0xff; /* Using int is faster here */

    /* If zero, or denormal, or exponent underflows too much for a denormal
     * half, return signed zero. */
    if (e < 103) {
      return bits;
    }

    /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
    if (e > 142) {
      bits |= 0x7c00;
      /* If exponent was 0xff and one mantissa bit was set, it means NaN,
       * not Inf, so make sure we set one mantissa bit too. */
      bits |= (e == 255 ? 0 : 1) && x & 0x007fffff;
      return bits;
    }

    /* If exponent underflows but not too much, return a denormal */
    if (e < 113) {
      m |= 0x0800;
      /* Extra rounding may overflow and set mantissa to 0 and exponent
       * to 1, which is OK. */
      bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
      return bits;
    }

    bits |= ((e - 112) << 10) | (m >> 1);
    /* Extra rounding. An overflow will set mantissa to 0 and increment
     * the exponent, which is OK. */
    bits += m & 1;
    return bits;
  };
})();

/**
 * check whether or not this texture size is power of two.
 *
 * @param x texture size.
 * @returns check whether or not the size x is power of two.
 */
function isPowerOfTwo(x: number): boolean {
  return (x & (x - 1)) == 0;
}

function isPowerOfTwoTexture(width: Size, height: Size) {
  return isPowerOfTwo(width) && isPowerOfTwo(height);
}

// values range must be [-1, 1]
function packNormalizedVec4ToVec2(
  x: number,
  y: number,
  z: number,
  w: number,
  criteria: number
) {
  // range to [0, s1]
  x = (x + 1) / 2.0;
  y = (y + 1) / 2.0;
  z = (z + 1) / 2.0;
  w = (w + 1) / 2.0;

  // pack x,y to v0(float)
  const ir = Math.floor(x * (criteria - 1.0));
  const ig = Math.floor(y * (criteria - 1.0));
  const irg = ir * criteria + ig;
  const v0 = irg / criteria;

  // pack z,w to v1(float)
  const ib = Math.floor(z * (criteria - 1.0));
  const ia = Math.floor(w * (criteria - 1.0));
  const iba = ib * criteria + ia;
  const v1 = iba / criteria;

  return [v0, v1];
}

function convertToStringAsGLSLFloat(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}.0`;
  } else {
    return '' + value;
  }
}

function nearZeroToZero(value: number): number {
  if (Math.abs(value) < 0.00001) {
    value = 0;
  } else if (0.99999 < value && value < 1.00001) {
    value = 1;
  } else if (-1.00001 < value && value < -0.99999) {
    value = -1;
  }
  return value;
}

export const MathUtil = Object.freeze({
  radianToDegree,
  degreeToRadian,
  toHalfFloat,
  isPowerOfTwo,
  isPowerOfTwoTexture,
  packNormalizedVec4ToVec2,
  convertToStringAsGLSLFloat,
  nearZeroToZero,
});
