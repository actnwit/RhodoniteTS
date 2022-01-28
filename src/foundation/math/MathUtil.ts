import MutableMatrix33 from './MutableMatrix33';
import MutableVector3 from './MutableVector3';
import {Count, Size} from '../../types/CommonTypes';

function radianToDegree(rad: number) {
  return (rad * 180) / Math.PI;
}

function degreeToRadian(deg: number) {
  return (deg * Math.PI) / 180;
}

// https://gamedev.stackexchange.com/questions/17326/conversion-of-a-number-from-single-precision-floating-point-representation-to-a/17410#17410
const toHalfFloat = () => {
  /* This method is faster than the OpenEXR implementation (very often
   * used, eg. in Ogre), with the additional benefit of rounding, inspired
   * by James Tursa?s half-precision code. */
  return function toHalf(val: number) {
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);
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
};

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

  const ir = Math.floor(x * (criteria - 1.0));
  const ig = Math.floor(y * (criteria - 1.0));
  const irg = ir * criteria + ig;
  const v0 = irg / criteria;

  const ib = Math.floor(z * (criteria - 1.0));
  const ia = Math.floor(w * (criteria - 1.0));
  const iba = ib * criteria + ia;
  const v1 = iba / criteria;
  return [v0, v1];
}

function erf(x: number) {
  // Save the sign of x
  let sign = 1;
  if (x < 0) sign = -1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t: number = 1 / (1 + 0.3275911 * x);
  const y: number =
    1 -
    ((((1.061405429 * t + -1.453152027) * t + 1.421413741) * t + -0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);

  return sign * y;
}

function invErf(x: number) {
  let w: number,
    p = 0;
  w = -Math.log((1.0 - x) * (1.0 + x));
  if (w < 5.0) {
    w = w - 2.5;
    p = 2.81022636e-8;
    p = 3.43273939e-7 + p * w;
    p = -3.5233877e-6 + p * w;
    p = -4.39150654e-6 + p * w;
    p = 0.00021858087 + p * w;
    p = -0.00125372503 + p * w;
    p = -0.00417768164 + p * w;
    p = 0.246640727 + p * w;
    p = 1.50140941 + p * w;
  } else {
    w = Math.sqrt(w) - 3;
    p = -0.000200214257;
    p = 0.000100950558 + p * w;
    p = 0.00134934322 + p * w;
    p = -0.00367342844 + p * w;
    p = 0.00573950773 + p * w;
    p = -0.0076224613 + p * w;
    p = 0.00943887047 + p * w;
    p = 1.00167406 + p * w;
    p = 2.83297682 + p * w;
  }
  return p * x;
}

function gaussianCdf(x: number, mu: number, sigma: number) {
  const U: number = 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2.0))));
  return U;
}

function invGaussianCdf(U: number, mu: number, sigma: number) {
  const x: number = sigma * Math.sqrt(2.0) * invErf(2.0 * U - 1) + mu;
  return x;
}

function computeEigenValuesAndVectors(
  A: MutableMatrix33,
  Q: MutableMatrix33,
  w: MutableVector3
) {
  const n = 3;
  let sd = 0;
  let so = 0; // Sums of diagonal resp. off-diagonal elements
  let s = 0;
  let c = 0;
  let t = 0; // sin(phi), cos(phi), tan(phi) and temporary storage
  let g = 0;
  let h = 0;
  let z = 0;
  let theta = 0; // More temporary storage
  let thresh = 0;

  // Initialize Q to the identitity matrix
  for (let i = 0; i < n; i++) {
    Q.setAt(i, i, 1.0);
    for (let j = 0; j < i; j++) {
      Q.setAt(i, j, 0.0);
      Q.setAt(j, i, 0.0);
    }
  }

  // Initialize w to diag(A)
  for (let i = 0; i < n; i++) w.setAt(i, A.at(i, i));

  // Calculate SQR(tr(A))
  sd = 0.0;
  for (let i = 0; i < n; i++) sd += Math.abs(w.at(i));
  sd = sd * sd;

  // Main iteration loop
  for (let nIter = 0; nIter < 50; nIter++) {
    // Test for convergence
    so = 0.0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) so += Math.abs(A.at(p, q));
    }
    if (so == 0.0) return 0;

    if (nIter < 4) thresh = (0.2 * so) / (n * n);
    else thresh = 0.0;

    // Do sweep
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        g = 100.0 * Math.abs(A.at(p, q));
        if (
          nIter > 4 &&
          Math.abs(w.at(p)) + g == Math.abs(w.at(p)) &&
          Math.abs(w.at(q)) + g == Math.abs(w.at(q))
        ) {
          A.setAt(p, q, 0.0);
        } else if (Math.abs(A.at(p, q)) > thresh) {
          // Calculate Jacobi transformation
          h = w.at(q) - w.at(p);
          if (Math.abs(h) + g == Math.abs(h)) {
            t = A.at(p, q) / h;
          } else {
            theta = (0.5 * h) / A.at(p, q);
            if (theta < 0.0)
              t = -1.0 / (Math.sqrt(1.0 + theta * theta) - theta);
            else t = 1.0 / (Math.sqrt(1.0 + theta * theta) + theta);
          }
          c = 1.0 / Math.sqrt(1.0 + t * t);
          s = t * c;
          z = t * A.at(p, q);

          // Apply Jacobi transformation
          A.setAt(p, q, 0.0);
          w.setAt(p, w.at(p) - z);
          w.setAt(q, w.at(q) + z);
          for (let r = 0; r < p; r++) {
            t = A.at(r, p);
            A.setAt(r, p, c * t - s * A.at(r, q));
            A.setAt(r, q, s * t + c * A.at(r, q));
          }
          for (let r = p + 1; r < q; r++) {
            t = A.at(p, r);
            A.setAt(p, r, c * t - s * A.at(r, q));
            A.setAt(r, q, s * t + c * A.at(r, q));
          }
          for (let r = q + 1; r < n; r++) {
            t = A.at(p, r);
            A.setAt(p, r, c * t - s * A.at(q, r));
            A.setAt(q, r, s * t + c * A.at(q, r));
          }

          // Update eigenvectors
          for (let r = 0; r < n; r++) {
            t = Q.at(r, p);
            Q.setAt(r, p, c * t - s * Q.at(r, q));
            Q.setAt(r, q, s * t + c * Q.at(r, q));
          }
        }
      }
    }
  }
  return -1;
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

function financial(val: number | string) {
  const fixedStr = Number.parseFloat(val as string).toFixed(7);
  if (val >= 0) {
    return ' ' + fixedStr;
  }
  return fixedStr;
}

function roundAsFloat(value: number): number {
  return Math.round(value * 10000000) / 10000000;
}

/**
 * This function calculates the ratio of a discrete Gaussian distribution.
 * The sampling points are one away from each other. The sum of the ratios is 1.
 * @kernelSize number of sampling points
 * @variance variance of the Gaussian distribution
 * @mean mean of the Gaussian distribution
 * e.g. kernelSize = 2 (mean=0) => the sampling points are -0.5 and 0.5
 * e.g. kernelSize = 3 (mean=1) => the sampling points are 0.0, 1.0 and 2.0
 * @effectiveDigit effectiveDigit of values in return array
 * @returns array of the Gaussian distribution where the sum of the elements is 1
 */
function computeGaussianDistributionRatioWhoseSumIsOne({
  kernelSize,
  variance,
  mean = 0,
  effectiveDigit = 4,
}: {
  kernelSize: Count;
  variance: number;
  mean?: number;
  effectiveDigit?: Count;
}) {
  const ceiledHalfKernelSize = Math.ceil(kernelSize / 2.0);
  const gaussianDistributionRatio: number[] = new Array(ceiledHalfKernelSize);
  let totalSize = 0;

  // above mean side and center
  for (let i = 0; i < ceiledHalfKernelSize; i++) {
    gaussianDistributionRatio[i] = Math.exp(
      -((i - mean) ** 2) / (2.0 * variance)
    );

    totalSize += gaussianDistributionRatio[i];
  }

  // below mean side
  totalSize *= 2;

  // if a center exists
  if ((kernelSize / 2.0) % 2 !== 0.0) {
    totalSize -= gaussianDistributionRatio[0];
  }

  const gaussianDistributionRatioWhoseSumIsOne = new Array(kernelSize);
  let totalRatio = 0;
  const changeDigitParam = Math.pow(10, effectiveDigit);

  for (let i = 0; i < ceiledHalfKernelSize - 1; i++) {
    let ratio =
      gaussianDistributionRatio[ceiledHalfKernelSize - 1 - i] / totalSize;

    ratio *= changeDigitParam;
    ratio = Math.round(ratio);
    ratio /= changeDigitParam;

    gaussianDistributionRatioWhoseSumIsOne[i] = ratio;
    gaussianDistributionRatioWhoseSumIsOne[kernelSize - 1 - i] = ratio;

    totalRatio += 2 * ratio;
  }

  if (kernelSize % 2 === 0) {
    const value = (1 - totalRatio) / 2.0;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize - 1] = value;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize] = value;
  } else {
    const value = 1 - totalRatio;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize - 1] = value;
  }

  return gaussianDistributionRatioWhoseSumIsOne;
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
  gaussianCdf,
  invGaussianCdf,
  computeEigenValuesAndVectors,
  computeGaussianDistributionRatioWhoseSumIsOne,
  roundAsFloat,
  financial,
});
