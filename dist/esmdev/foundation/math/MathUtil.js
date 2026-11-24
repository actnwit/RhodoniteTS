// src/foundation/math/MathUtil.ts
function radianToDegree(rad) {
  return rad * 180 / Math.PI;
}
function degreeToRadian(deg) {
  return deg * Math.PI / 180;
}
var SINGULAR_EPSILON = 1e-6;
var SINGULAR_EPSILON_FLOAT64 = 1e-12;
var BIAS = 1048575;
var HALF_PI = Math.PI / 2;
function encodeLogQuat(qx, qy, qz, qw) {
  const len = Math.hypot(qx, qy, qz, qw);
  let x = qx / len, y = qy / len, z = qz / len, w = qw / len;
  if (w < 0) {
    x = -x;
    y = -y;
    z = -z;
    w = -w;
  }
  const s = Math.hypot(x, y, z);
  const k = s < 1e-12 ? 1 : Math.atan2(s, w) / s;
  const quant = (c) => {
    const i = Math.round(c * k / HALF_PI * BIAS) + BIAS;
    return Math.min(2 * BIAS, Math.max(0, i));
  };
  const ix = quant(x), iy = quant(y), iz = quant(z);
  const lo = (ix | (iy & 2047) << 21) >>> 0;
  const hi = (iy >>> 11 | iz << 10) >>> 0;
  return [lo, hi];
}
function isSingularDet(det, scale, epsilon = SINGULAR_EPSILON) {
  if (!Number.isFinite(det)) {
    return true;
  }
  return Math.abs(det) <= epsilon * scale;
}
function getSingularEpsilon(bytesPerElement) {
  return bytesPerElement === 8 ? SINGULAR_EPSILON_FLOAT64 : SINGULAR_EPSILON;
}
var toHalfFloat = () => {
  return function toHalf(val) {
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);
    floatView[0] = val;
    const x = int32View[0];
    let bits = x >> 16 & 32768;
    let m = x >> 12 & 2047;
    const e = x >> 23 & 255;
    if (e < 103) {
      return bits;
    }
    if (e > 142) {
      bits |= 31744;
      bits |= (e === 255 ? 0 : 1) && x & 8388607;
      return bits;
    }
    if (e < 113) {
      m |= 2048;
      bits |= (m >> 114 - e) + (m >> 113 - e & 1);
      return bits;
    }
    bits |= e - 112 << 10 | m >> 1;
    bits += m & 1;
    return bits;
  };
};
function isPowerOfTwo(x) {
  return x > 0 && (x & x - 1) === 0;
}
function isPowerOfTwoTexture(width, height) {
  return isPowerOfTwo(width) && isPowerOfTwo(height);
}
function packNormalizedVec4ToVec2(x, y, z, w, criteria) {
  x = (x + 1) / 2;
  y = (y + 1) / 2;
  z = (z + 1) / 2;
  w = (w + 1) / 2;
  const ir = Math.floor(x * (criteria - 1));
  const ig = Math.floor(y * (criteria - 1));
  const irg = ir * criteria + ig;
  const v0 = irg / criteria;
  const ib = Math.floor(z * (criteria - 1));
  const ia = Math.floor(w * (criteria - 1));
  const iba = ib * criteria + ia;
  const v1 = iba / criteria;
  return [v0, v1];
}
function packSnormVec4ToUVec2(x, y, z, w) {
  return [pack2x16snorm(x, y), pack2x16snorm(z, w)];
}
function pack2x16snorm(x, y) {
  const q = (v) => Math.floor(0.5 + 32767 * Math.min(1, Math.max(-1, v))) & 65535;
  return (q(x) | q(y) << 16) >>> 0;
}
var UNIFORM_SCALE_RELATIVE_TOLERANCE = 1e-3;
function isUniformScale(x, y, z) {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  const max = Math.max(ax, ay, az);
  const min = Math.min(ax, ay, az);
  return max - min <= UNIFORM_SCALE_RELATIVE_TOLERANCE * max;
}
var VEC4X1_LOG2_SCALE_RANGE = 16;
function encodeVec4x1Scale(scale) {
  return Math.log2(scale) / VEC4X1_LOG2_SCALE_RANGE;
}
function erf(x) {
  let sign = 1;
  if (x < 0) sign = -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t + -1.453152027) * t + 1.421413741) * t + -0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}
function invErf(x) {
  let w;
  let p = 0;
  w = -Math.log((1 - x) * (1 + x));
  if (w < 5) {
    w = w - 2.5;
    p = 281022636e-16;
    p = 343273939e-15 + p * w;
    p = -35233877e-13 + p * w;
    p = -439150654e-14 + p * w;
    p = 21858087e-11 + p * w;
    p = -0.00125372503 + p * w;
    p = -0.00417768164 + p * w;
    p = 0.246640727 + p * w;
    p = 1.50140941 + p * w;
  } else {
    w = Math.sqrt(w) - 3;
    p = -200214257e-12;
    p = 100950558e-12 + p * w;
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
function gaussianCdf(x, mu, sigma) {
  const U = 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
  return U;
}
function invGaussianCdf(U, mu, sigma) {
  const x = sigma * Math.sqrt(2) * invErf(2 * U - 1) + mu;
  return x;
}
function computeEigenValuesAndVectors(A, Q, w) {
  const n = 3;
  let sd = 0;
  let so = 0;
  let s = 0;
  let c = 0;
  let t = 0;
  let g = 0;
  let h = 0;
  let z = 0;
  let theta = 0;
  let thresh = 0;
  for (let i = 0; i < n; i++) {
    Q.setAt(i, i, 1);
    for (let j = 0; j < i; j++) {
      Q.setAt(i, j, 0);
      Q.setAt(j, i, 0);
    }
  }
  for (let i = 0; i < n; i++) w.setAt(i, A.at(i, i));
  sd = 0;
  for (let i = 0; i < n; i++) sd += Math.abs(w.at(i));
  sd = sd * sd;
  for (let nIter = 0; nIter < 50; nIter++) {
    so = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) so += Math.abs(A.at(p, q));
    }
    if (so === 0) return 0;
    if (nIter < 4) thresh = 0.2 * so / (n * n);
    else thresh = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        g = 100 * Math.abs(A.at(p, q));
        if (nIter > 4 && Math.abs(w.at(p)) + g === Math.abs(w.at(p)) && Math.abs(w.at(q)) + g === Math.abs(w.at(q))) {
          A.setAt(p, q, 0);
        } else if (Math.abs(A.at(p, q)) > thresh) {
          h = w.at(q) - w.at(p);
          if (Math.abs(h) + g === Math.abs(h)) {
            t = A.at(p, q) / h;
          } else {
            theta = 0.5 * h / A.at(p, q);
            if (theta < 0) t = -1 / (Math.sqrt(1 + theta * theta) - theta);
            else t = 1 / (Math.sqrt(1 + theta * theta) + theta);
          }
          c = 1 / Math.sqrt(1 + t * t);
          s = t * c;
          z = t * A.at(p, q);
          A.setAt(p, q, 0);
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
function convertToStringAsGLSLFloat(value) {
  if (Number.isInteger(value)) {
    return `${value}.0`;
  }
  return `${value}`;
}
function nearZeroToZero(value) {
  if (Math.abs(value) < 1e-5) {
    value = 0;
  } else if (0.99999 < value && value < 1.00001) {
    value = 1;
  } else if (-1.00001 < value && value < -0.99999) {
    value = -1;
  }
  return value;
}
function financial(val) {
  const fixedStr = Number.parseFloat(val).toFixed(7);
  if (val >= 0) {
    return ` ${fixedStr}`;
  }
  return fixedStr;
}
function roundAsFloat(value) {
  return Math.round(value * 1e7) / 1e7;
}
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}
function computeGaussianDistributionRatioWhoseSumIsOne({
  kernelSize,
  variance,
  mean = 0,
  effectiveDigit = 4
}) {
  const ceiledHalfKernelSize = Math.ceil(kernelSize / 2);
  const gaussianDistributionRatio = new Array(ceiledHalfKernelSize);
  let totalSize = 0;
  for (let i = 0; i < ceiledHalfKernelSize; i++) {
    gaussianDistributionRatio[i] = Math.exp(-((i - mean) ** 2) / (2 * variance));
    totalSize += gaussianDistributionRatio[i];
  }
  totalSize *= 2;
  if (kernelSize / 2 % 2 !== 0) {
    totalSize -= gaussianDistributionRatio[0];
  }
  const gaussianDistributionRatioWhoseSumIsOne = new Array(kernelSize);
  let totalRatio = 0;
  const changeDigitParam = 10 ** effectiveDigit;
  for (let i = 0; i < ceiledHalfKernelSize - 1; i++) {
    let ratio = gaussianDistributionRatio[ceiledHalfKernelSize - 1 - i] / totalSize;
    ratio *= changeDigitParam;
    ratio = Math.round(ratio);
    ratio /= changeDigitParam;
    gaussianDistributionRatioWhoseSumIsOne[i] = ratio;
    gaussianDistributionRatioWhoseSumIsOne[kernelSize - 1 - i] = ratio;
    totalRatio += 2 * ratio;
  }
  if (kernelSize % 2 === 0) {
    const value = (1 - totalRatio) / 2;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize - 1] = value;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize] = value;
  } else {
    const value = 1 - totalRatio;
    gaussianDistributionRatioWhoseSumIsOne[ceiledHalfKernelSize - 1] = value;
  }
  return gaussianDistributionRatioWhoseSumIsOne;
}
var MathUtil = Object.freeze({
  radianToDegree,
  degreeToRadian,
  encodeLogQuat,
  isSingularDet,
  getSingularEpsilon,
  SINGULAR_EPSILON,
  SINGULAR_EPSILON_FLOAT64,
  toHalfFloat,
  isPowerOfTwo,
  isPowerOfTwoTexture,
  packNormalizedVec4ToVec2,
  packSnormVec4ToUVec2,
  isUniformScale,
  encodeVec4x1Scale,
  convertToStringAsGLSLFloat,
  nearZeroToZero,
  gaussianCdf,
  invGaussianCdf,
  computeEigenValuesAndVectors,
  computeGaussianDistributionRatioWhoseSumIsOne,
  roundAsFloat,
  financial,
  lerp
});
export {
  MathUtil,
  encodeLogQuat
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NYXRoVXRpbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb3VudCwgU2l6ZSB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZU1hdHJpeDMzIH0gZnJvbSAnLi9NdXRhYmxlTWF0cml4MzMnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjMnO1xuXG4vKipcbiAqIENvbnZlcnRzIHJhZGlhbnMgdG8gZGVncmVlcy5cbiAqIEBwYXJhbSByYWQgLSBUaGUgYW5nbGUgaW4gcmFkaWFuc1xuICogQHJldHVybnMgVGhlIGFuZ2xlIGluIGRlZ3JlZXNcbiAqL1xuZnVuY3Rpb24gcmFkaWFuVG9EZWdyZWUocmFkOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKHJhZCAqIDE4MCkgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGRlZ3JlZXMgdG8gcmFkaWFucy5cbiAqIEBwYXJhbSBkZWcgLSBUaGUgYW5nbGUgaW4gZGVncmVlc1xuICogQHJldHVybnMgVGhlIGFuZ2xlIGluIHJhZGlhbnNcbiAqL1xuZnVuY3Rpb24gZGVncmVlVG9SYWRpYW4oZGVnOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGRlZyAqIE1hdGguUEkpIC8gMTgwO1xufVxuXG4vKipcbiAqIFJlbGF0aXZlIHRvbGVyYW5jZSB1c2VkIHRvIGRlY2lkZSB3aGV0aGVyIGEgZGV0ZXJtaW5hbnQgaXMgbnVtZXJpY2FsbHkgemVyby5cbiAqXG4gKiBUaGUgZGV0ZXJtaW5hbnQgaXMgY29tcGFyZWQgYWdhaW5zdCB0aGUgcHJvZHVjdCBvZiB0aGUgcm93IG5vcm1zLCB3aGljaCBpc1xuICogYW4gdXBwZXIgYm91bmQgb2YgfGRldHwgKEhhZGFtYXJkJ3MgaW5lcXVhbGl0eSkuIFRoaXMgbWFrZXMgdGhlIGNoZWNrXG4gKiBpbmRlcGVuZGVudCBvZiB0aGUgbWF0cml4IHNjYWxlLCB1bmxpa2UgY29tcGFyaW5nIHxkZXR8IGFnYWluc3QgYSBmaXhlZFxuICogYWJzb2x1dGUgdmFsdWUuXG4gKlxuICogTWF0cml4IGVsZW1lbnRzIGFyZSBzdG9yZWQgYXMgRmxvYXQzMiwgd2hpY2ggY2FycmllcyByb3VnaGx5IDEuMmUtNyBvZlxuICogcmVsYXRpdmUgcHJlY2lzaW9uLiBBIDR4NCBkZXRlcm1pbmFudCBjb21iaW5lcyBmb3VyIHJvd3MsIHNvIDFlLTYgZ2l2ZXMgYVxuICogcHJhY3RpY2FsIHNhZmV0eSBtYXJnaW46IGEgbWF0cml4IHdob3NlIGludmVyc2Ugd291bGQgYW1wbGlmeSB0aGUgaW5wdXRcbiAqIGVycm9yIGJ5IG1vcmUgdGhhbiB+MWU2IGlzIHRyZWF0ZWQgYXMgc2luZ3VsYXIuXG4gKi9cbmNvbnN0IFNJTkdVTEFSX0VQU0lMT04gPSAxZS02O1xuXG4vKipcbiAqIFJlbGF0aXZlIHRvbGVyYW5jZSB1c2VkIGZvciBtYXRyaWNlcyBiYWNrZWQgYnkgYSBGbG9hdDY0QXJyYXkuXG4gKlxuICogRG91YmxlIHByZWNpc2lvbiBjYXJyaWVzIHJvdWdobHkgMi4yZS0xNiBvZiByZWxhdGl2ZSBwcmVjaXNpb24sIHNvIGEgbXVjaFxuICogdGlnaHRlciB0aHJlc2hvbGQgY2FuIGJlIHVzZWQuIFRoaXMga2VlcHMgZ2VudWluZWx5IGludmVydGlibGUgbWF0cmljZXNcbiAqIGludmVydGlibGUgd2hlbiB0aGUgZG91YmxlLXByZWNpc2lvbiBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkLlxuICovXG5jb25zdCBTSU5HVUxBUl9FUFNJTE9OX0ZMT0FUNjQgPSAxZS0xMjtcblxuY29uc3QgQklBUyA9IDEwNDg1NzU7IC8vIDJeMjAgLSAxXG5jb25zdCBIQUxGX1BJID0gTWF0aC5QSSAvIDI7XG5cbi8qKlxuICogRW5jb2RlIGEgcXVhdGVybmlvbiAoeCwgeSwgeiwgdykgaW50byBhIDY0LWJpdCBsb2ctcXVhdGVybmlvbi5cbiAqIFJldHVybnMgW2xvLCBoaV0gYXMgdW5zaWduZWQgMzItYml0IGludGVnZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlTG9nUXVhdChxeDogbnVtYmVyLCBxeTogbnVtYmVyLCBxejogbnVtYmVyLCBxdzogbnVtYmVyKTogbnVtYmVyW10ge1xuICAvLyBOb3JtYWxpemUgdGhlIGlucHV0IHRvIGJlIHNhZmVcbiAgY29uc3QgbGVuID0gTWF0aC5oeXBvdChxeCwgcXksIHF6LCBxdyk7XG4gIGxldCB4ID0gcXggLyBsZW4sXG4gICAgeSA9IHF5IC8gbGVuLFxuICAgIHogPSBxeiAvIGxlbixcbiAgICB3ID0gcXcgLyBsZW47XG5cbiAgLy8gcSBhbmQgLXEgcmVwcmVzZW50IHRoZSBzYW1lIHJvdGF0aW9uOyBmb3JjZSB3ID49IDBcbiAgaWYgKHcgPCAwKSB7XG4gICAgeCA9IC14O1xuICAgIHkgPSAteTtcbiAgICB6ID0gLXo7XG4gICAgdyA9IC13O1xuICB9XG5cbiAgLy8gTG9nIG1hcDogdiA9IGF4aXMgKiAodGhldGEgLyAyKSA9ICh4eXogLyB8eHl6fCkgKiBhdGFuMih8eHl6fCwgdylcbiAgY29uc3QgcyA9IE1hdGguaHlwb3QoeCwgeSwgeik7XG4gIGNvbnN0IGsgPSBzIDwgMWUtMTIgPyAxIDogTWF0aC5hdGFuMihzLCB3KSAvIHM7XG5cbiAgLy8gT2Zmc2V0LWJpbmFyeSBxdWFudGl6YXRpb24gc28gdGhhdCAwIGlzIGV4YWN0bHkgcmVwcmVzZW50YWJsZVxuICBjb25zdCBxdWFudCA9IChjOiBudW1iZXIpOiBudW1iZXIgPT4ge1xuICAgIGNvbnN0IGkgPSBNYXRoLnJvdW5kKCgoYyAqIGspIC8gSEFMRl9QSSkgKiBCSUFTKSArIEJJQVM7XG4gICAgcmV0dXJuIE1hdGgubWluKDIgKiBCSUFTLCBNYXRoLm1heCgwLCBpKSk7IC8vIDAuLj0yXjIxLTJcbiAgfTtcbiAgY29uc3QgaXggPSBxdWFudCh4KSxcbiAgICBpeSA9IHF1YW50KHkpLFxuICAgIGl6ID0gcXVhbnQoeik7XG5cbiAgLy8gTGF5b3V0OiBsbyA9IHgoMjEpIHwgeSBsb3cgMTEgYml0cywgaGkgPSB5IGhpZ2ggMTAgYml0cyB8IHooMjEpXG4gIGNvbnN0IGxvID0gKGl4IHwgKChpeSAmIDB4N2ZmKSA8PCAyMSkpID4+PiAwO1xuICBjb25zdCBoaSA9ICgoaXkgPj4+IDExKSB8IChpeiA8PCAxMCkpID4+PiAwO1xuICByZXR1cm4gW2xvLCBoaV07XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBkZXRlcm1pbmFudCBzaG91bGQgYmUgdHJlYXRlZCBhcyB6ZXJvLlxuICpcbiAqIEEgcGxhaW4gYGRldCA9PT0gMGAgdGVzdCBvbmx5IGNhdGNoZXMgZXhhY3RseSBzaW5ndWxhciBtYXRyaWNlcy4gSW4gcHJhY3RpY2VcbiAqIGEgbWF0cml4IHdob3NlIGRldGVybWluYW50IGlzIHRpbnkgY29tcGFyZWQgd2l0aCBpdHMgc2NhbGUgaXMganVzdCBhc1xuICogZGFuZ2Vyb3VzLCBiZWNhdXNlIGl0cyBpbnZlcnNlIGFtcGxpZmllcyByb3VuZGluZyBlcnJvcnMgaW50byBnYXJiYWdlLlxuICpcbiAqIEBwYXJhbSBkZXQgLSBUaGUgZGV0ZXJtaW5hbnQgb2YgdGhlIG1hdHJpeFxuICogQHBhcmFtIHNjYWxlIC0gVGhlIHByb2R1Y3Qgb2YgdGhlIHJvdyBub3JtcyBvZiB0aGUgbWF0cml4IChIYWRhbWFyZCBib3VuZClcbiAqIEBwYXJhbSBlcHNpbG9uIC0gVGhlIHJlbGF0aXZlIHRvbGVyYW5jZSAoZGVmYXVsdHMgdG8gdGhlIEZsb2F0MzIgdGhyZXNob2xkKVxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWF0cml4IHNob3VsZCBiZSBjb25zaWRlcmVkIHNpbmd1bGFyXG4gKi9cbmZ1bmN0aW9uIGlzU2luZ3VsYXJEZXQoZGV0OiBudW1iZXIsIHNjYWxlOiBudW1iZXIsIGVwc2lsb246IG51bWJlciA9IFNJTkdVTEFSX0VQU0lMT04pOiBib29sZWFuIHtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGV0KSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIEEgemVybyBtYXRyaXggaGFzIHNjYWxlIDAgYW5kIGRldCAwLCBzbyB0aGlzIGFsc28gcmV0dXJucyB0cnVlIHRoZXJlLlxuICByZXR1cm4gTWF0aC5hYnMoZGV0KSA8PSBlcHNpbG9uICogc2NhbGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcmVsYXRpdmUgc2luZ3VsYXJpdHkgdG9sZXJhbmNlIGZvciBhIHR5cGVkIGFycmF5IGVsZW1lbnQgc2l6ZS5cbiAqIEBwYXJhbSBieXRlc1BlckVsZW1lbnQgLSA0IGZvciBGbG9hdDMyQXJyYXksIDggZm9yIEZsb2F0NjRBcnJheVxuICogQHJldHVybnMgVGhlIHJlbGF0aXZlIHRvbGVyYW5jZSB0byB1c2VcbiAqL1xuZnVuY3Rpb24gZ2V0U2luZ3VsYXJFcHNpbG9uKGJ5dGVzUGVyRWxlbWVudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGJ5dGVzUGVyRWxlbWVudCA9PT0gOCA/IFNJTkdVTEFSX0VQU0lMT05fRkxPQVQ2NCA6IFNJTkdVTEFSX0VQU0lMT047XG59XG5cbi8qKlxuICogQ29udmVydHMgYSAzMi1iaXQgZmxvYXRpbmcgcG9pbnQgbnVtYmVyIHRvIGEgMTYtYml0IGhhbGYtcHJlY2lzaW9uIGZsb2F0LlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBiYXNlZCBvbiB0aGUgT3BlbkVYUiBoYWxmLXByZWNpc2lvbiBmb3JtYXQgd2l0aCBhZGRpdGlvbmFsIHJvdW5kaW5nLlxuICogSW1wbGVtZW50YXRpb24gcmVmZXJlbmNlOiBodHRwczovL2dhbWVkZXYuc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzE3MzI2L2NvbnZlcnNpb24tb2YtYS1udW1iZXItZnJvbS1zaW5nbGUtcHJlY2lzaW9uLWZsb2F0aW5nLXBvaW50LXJlcHJlc2VudGF0aW9uLXRvLWEvMTc0MTAjMTc0MTBcbiAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdGhhdCBjb252ZXJ0cyBhIG51bWJlciB0byBoYWxmLXByZWNpc2lvbiBmbG9hdCByZXByZXNlbnRhdGlvblxuICovXG5jb25zdCB0b0hhbGZGbG9hdCA9ICgpOiAoKHZhbDogbnVtYmVyKSA9PiBudW1iZXIpID0+IHtcbiAgLyogVGhpcyBtZXRob2QgaXMgZmFzdGVyIHRoYW4gdGhlIE9wZW5FWFIgaW1wbGVtZW50YXRpb24gKHZlcnkgb2Z0ZW5cbiAgICogdXNlZCwgZWcuIGluIE9ncmUpLCB3aXRoIHRoZSBhZGRpdGlvbmFsIGJlbmVmaXQgb2Ygcm91bmRpbmcsIGluc3BpcmVkXG4gICAqIGJ5IEphbWVzIFR1cnNhP3MgaGFsZi1wcmVjaXNpb24gY29kZS4gKi9cbiAgcmV0dXJuIGZ1bmN0aW9uIHRvSGFsZih2YWw6IG51bWJlcikge1xuICAgIGNvbnN0IGZsb2F0VmlldyA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XG4gICAgY29uc3QgaW50MzJWaWV3ID0gbmV3IEludDMyQXJyYXkoZmxvYXRWaWV3LmJ1ZmZlcik7XG4gICAgZmxvYXRWaWV3WzBdID0gdmFsO1xuICAgIGNvbnN0IHggPSBpbnQzMlZpZXdbMF07XG5cbiAgICBsZXQgYml0cyA9ICh4ID4+IDE2KSAmIDB4ODAwMDsgLyogR2V0IHRoZSBzaWduICovXG4gICAgbGV0IG0gPSAoeCA+PiAxMikgJiAweDA3ZmY7IC8qIEtlZXAgb25lIGV4dHJhIGJpdCBmb3Igcm91bmRpbmcgKi9cbiAgICBjb25zdCBlID0gKHggPj4gMjMpICYgMHhmZjsgLyogVXNpbmcgaW50IGlzIGZhc3RlciBoZXJlICovXG5cbiAgICAvKiBJZiB6ZXJvLCBvciBkZW5vcm1hbCwgb3IgZXhwb25lbnQgdW5kZXJmbG93cyB0b28gbXVjaCBmb3IgYSBkZW5vcm1hbFxuICAgICAqIGhhbGYsIHJldHVybiBzaWduZWQgemVyby4gKi9cbiAgICBpZiAoZSA8IDEwMykge1xuICAgICAgcmV0dXJuIGJpdHM7XG4gICAgfVxuXG4gICAgLyogSWYgTmFOLCByZXR1cm4gTmFOLiBJZiBJbmYgb3IgZXhwb25lbnQgb3ZlcmZsb3csIHJldHVybiBJbmYuICovXG4gICAgaWYgKGUgPiAxNDIpIHtcbiAgICAgIGJpdHMgfD0gMHg3YzAwO1xuICAgICAgLyogSWYgZXhwb25lbnQgd2FzIDB4ZmYgYW5kIG9uZSBtYW50aXNzYSBiaXQgd2FzIHNldCwgaXQgbWVhbnMgTmFOLFxuICAgICAgICogbm90IEluZiwgc28gbWFrZSBzdXJlIHdlIHNldCBvbmUgbWFudGlzc2EgYml0IHRvby4gKi9cbiAgICAgIGJpdHMgfD0gKGUgPT09IDI1NSA/IDAgOiAxKSAmJiB4ICYgMHgwMDdmZmZmZjtcbiAgICAgIHJldHVybiBiaXRzO1xuICAgIH1cblxuICAgIC8qIElmIGV4cG9uZW50IHVuZGVyZmxvd3MgYnV0IG5vdCB0b28gbXVjaCwgcmV0dXJuIGEgZGVub3JtYWwgKi9cbiAgICBpZiAoZSA8IDExMykge1xuICAgICAgbSB8PSAweDA4MDA7XG4gICAgICAvKiBFeHRyYSByb3VuZGluZyBtYXkgb3ZlcmZsb3cgYW5kIHNldCBtYW50aXNzYSB0byAwIGFuZCBleHBvbmVudFxuICAgICAgICogdG8gMSwgd2hpY2ggaXMgT0suICovXG4gICAgICBiaXRzIHw9IChtID4+ICgxMTQgLSBlKSkgKyAoKG0gPj4gKDExMyAtIGUpKSAmIDEpO1xuICAgICAgcmV0dXJuIGJpdHM7XG4gICAgfVxuXG4gICAgYml0cyB8PSAoKGUgLSAxMTIpIDw8IDEwKSB8IChtID4+IDEpO1xuICAgIC8qIEV4dHJhIHJvdW5kaW5nLiBBbiBvdmVyZmxvdyB3aWxsIHNldCBtYW50aXNzYSB0byAwIGFuZCBpbmNyZW1lbnRcbiAgICAgKiB0aGUgZXhwb25lbnQsIHdoaWNoIGlzIE9LLiAqL1xuICAgIGJpdHMgKz0gbSAmIDE7XG4gICAgcmV0dXJuIGJpdHM7XG4gIH07XG59O1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgbnVtYmVyIGlzIGEgcG93ZXIgb2YgdHdvLlxuICogQHBhcmFtIHggLSBUaGUgbnVtYmVyIHRvIGNoZWNrXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBudW1iZXIgaXMgYSBwb3dlciBvZiB0d28sIGZhbHNlIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBpc1Bvd2VyT2ZUd28oeDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiB4ID4gMCAmJiAoeCAmICh4IC0gMSkpID09PSAwO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiB0ZXh0dXJlIGRpbWVuc2lvbnMgYXJlIGJvdGggcG93ZXJzIG9mIHR3by5cbiAqIEBwYXJhbSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgdGV4dHVyZVxuICogQHBhcmFtIGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmVcbiAqIEByZXR1cm5zIFRydWUgaWYgYm90aCBkaW1lbnNpb25zIGFyZSBwb3dlcnMgb2YgdHdvLCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZnVuY3Rpb24gaXNQb3dlck9mVHdvVGV4dHVyZSh3aWR0aDogU2l6ZSwgaGVpZ2h0OiBTaXplKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc1Bvd2VyT2ZUd28od2lkdGgpICYmIGlzUG93ZXJPZlR3byhoZWlnaHQpO1xufVxuXG4vKipcbiAqIFBhY2tzIGEgbm9ybWFsaXplZCA0RCB2ZWN0b3IgaW50byBhIDJEIHZlY3RvciB1c2luZyBhIHNwZWNpZmljIGVuY29kaW5nIHNjaGVtZS5cbiAqIEFsbCBpbnB1dCB2YWx1ZXMgbXVzdCBiZSBpbiB0aGUgcmFuZ2UgWy0xLCAxXS5cbiAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IgKHJhbmdlOiBbLTEsIDFdKVxuICogQHBhcmFtIHkgLSBUaGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3RvciAocmFuZ2U6IFstMSwgMV0pXG4gKiBAcGFyYW0geiAtIFRoZSB6IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yIChyYW5nZTogWy0xLCAxXSlcbiAqIEBwYXJhbSB3IC0gVGhlIHcgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IgKHJhbmdlOiBbLTEsIDFdKVxuICogQHBhcmFtIGNyaXRlcmlhIC0gVGhlIGVuY29kaW5nIGNyaXRlcmlhL3Jlc29sdXRpb25cbiAqIEByZXR1cm5zIEEgMi1lbGVtZW50IGFycmF5IGNvbnRhaW5pbmcgdGhlIHBhY2tlZCB2YWx1ZXNcbiAqL1xuZnVuY3Rpb24gcGFja05vcm1hbGl6ZWRWZWM0VG9WZWMyKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciwgY3JpdGVyaWE6IG51bWJlcik6IG51bWJlcltdIHtcbiAgLy8gcmFuZ2UgdG8gWzAsIDFdXG4gIHggPSAoeCArIDEpIC8gMi4wO1xuICB5ID0gKHkgKyAxKSAvIDIuMDtcbiAgeiA9ICh6ICsgMSkgLyAyLjA7XG4gIHcgPSAodyArIDEpIC8gMi4wO1xuXG4gIGNvbnN0IGlyID0gTWF0aC5mbG9vcih4ICogKGNyaXRlcmlhIC0gMS4wKSk7XG4gIGNvbnN0IGlnID0gTWF0aC5mbG9vcih5ICogKGNyaXRlcmlhIC0gMS4wKSk7XG4gIGNvbnN0IGlyZyA9IGlyICogY3JpdGVyaWEgKyBpZztcbiAgY29uc3QgdjAgPSBpcmcgLyBjcml0ZXJpYTtcblxuICBjb25zdCBpYiA9IE1hdGguZmxvb3IoeiAqIChjcml0ZXJpYSAtIDEuMCkpO1xuICBjb25zdCBpYSA9IE1hdGguZmxvb3IodyAqIChjcml0ZXJpYSAtIDEuMCkpO1xuICBjb25zdCBpYmEgPSBpYiAqIGNyaXRlcmlhICsgaWE7XG4gIGNvbnN0IHYxID0gaWJhIC8gY3JpdGVyaWE7XG4gIHJldHVybiBbdjAsIHYxXTtcbn1cblxuZnVuY3Rpb24gcGFja1Nub3JtVmVjNFRvVVZlYzIoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyKTogbnVtYmVyW10ge1xuICAvLyB2ZWM0IC0+IHR3byB1aW50MzJcbiAgcmV0dXJuIFtwYWNrMngxNnNub3JtKHgsIHkpLCBwYWNrMngxNnNub3JtKHosIHcpXTtcbn1cblxuLyoqXG4gKiBCaXQtY29tcGF0aWJsZSB3aXRoIFdHU0wgcGFjazJ4MTZzbm9ybSAoZmxvb3IoMC41ICsgMzI3NjcgKiB2KSkuXG4gKiBHTFNMIHBhY2tTbm9ybTJ4MTYgdXNlcyByb3VuZCgpLCB3aG9zZSBkaXJlY3Rpb24gZm9yIGFuIGV4YWN0IC41IGlzIGltcGxlbWVudGF0aW9uLWRlZmluZWQsXG4gKiBidXQgc2hhZGVycyBvbmx5IHVucGFjayB0aGUgZGF0YSBwYWNrZWQgaGVyZSwgc28gdGhlIHJlc3VsdCBkb2VzIG5vdCBkZXBlbmQgb24gdGhlIEdQVS5cbiAqL1xuZnVuY3Rpb24gcGFjazJ4MTZzbm9ybSh4OiBudW1iZXIsIHk6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHEgPSAodjogbnVtYmVyKSA9PiBNYXRoLmZsb29yKDAuNSArIDMyNzY3ICogTWF0aC5taW4oMSwgTWF0aC5tYXgoLTEsIHYpKSkgJiAweGZmZmY7XG4gIHJldHVybiAocSh4KSB8IChxKHkpIDw8IDE2KSkgPj4+IDA7XG59XG5cbi8qKlxuICogUmVsYXRpdmUgdG9sZXJhbmNlIHVzZWQgdG8gZGVjaWRlIHdoZXRoZXIgYSBzY2FsZSBpcyB1bmlmb3JtOiAobWF4IC0gbWluKSA8PSB0b2xlcmFuY2UgKiBtYXguXG4gKiBUaGUgVmVjNHgxIGJvbmUgZGF0YSB0eXBlLCB3aGljaCBzdXBwb3J0cyBvbmx5IHVuaWZvcm0gc2NhbGUsIHJlbGllcyBvbiB0aGlzIGRlY2lzaW9uLlxuICovXG5jb25zdCBVTklGT1JNX1NDQUxFX1JFTEFUSVZFX1RPTEVSQU5DRSA9IDFlLTM7XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHRocmVlIHNjYWxlIGNvbXBvbmVudHMgYXJlIChhbG1vc3QpIHVuaWZvcm0uXG4gKiBUaGUgc2lnbnMgYXJlIGlnbm9yZWQgKG9ubHkgdGhlIG1hZ25pdHVkZXMgYXJlIGNvbXBhcmVkKS5cbiAqXG4gKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudCBvZiB0aGUgc2NhbGVcbiAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50IG9mIHRoZSBzY2FsZVxuICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnQgb2YgdGhlIHNjYWxlXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBzY2FsZSBpcyB1bmlmb3JtXG4gKi9cbmZ1bmN0aW9uIGlzVW5pZm9ybVNjYWxlKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYXggPSBNYXRoLmFicyh4KTtcbiAgY29uc3QgYXkgPSBNYXRoLmFicyh5KTtcbiAgY29uc3QgYXogPSBNYXRoLmFicyh6KTtcbiAgY29uc3QgbWF4ID0gTWF0aC5tYXgoYXgsIGF5LCBheik7XG4gIGNvbnN0IG1pbiA9IE1hdGgubWluKGF4LCBheSwgYXopO1xuICByZXR1cm4gbWF4IC0gbWluIDw9IFVOSUZPUk1fU0NBTEVfUkVMQVRJVkVfVE9MRVJBTkNFICogbWF4O1xufVxuXG4vKipcbiAqIFRoZSByYW5nZSBvZiBsb2cyKHNjYWxlKSB0aGF0IHRoZSB1bmlmb3JtIHNjYWxlIG9mIHRoZSBWZWM0eDEgYm9uZSBkYXRhIHR5cGUgY2FuIHJlcHJlc2VudDogWy0xNiwgMTZdLlxuICogTXVzdCBtYXRjaCBSTl9WRUM0WDFfTE9HMl9TQ0FMRV9SQU5HRSBpbiB0aGUgc2hhZGVycyAocHJvY2Vzc0dlb21ldHJ5Lmdsc2wgLyBib25lRGVjb2RlLndnc2wpLlxuICovXG5jb25zdCBWRUM0WDFfTE9HMl9TQ0FMRV9SQU5HRSA9IDE2O1xuXG4vKipcbiAqIEVuY29kZXMgdGhlIG1hZ25pdHVkZSBvZiBhIHVuaWZvcm0gc2NhbGUgZm9yIHRoZSBWZWM0eDEgYm9uZSBkYXRhIHR5cGUuXG4gKlxuICogVGhlIHNjYWxlIGlzIHN0b3JlZCBhcyBsb2cyKHNjYWxlKSAvIDE2IGluIGEgc25vcm0xNiB2YWx1ZSwgYW5kIHNoYWRlcnMgZGVjb2RlIGl0IHdpdGggZXhwMih2YWx1ZSAqIDE2KS5cbiAqIFRoZSByZWxhdGl2ZSBlcnJvciBpcyB0aGVyZWZvcmUgY29uc3RhbnQgKGF0IG1vc3QgYWJvdXQgMS43ZS00KSBvdmVyIDJeLTE2IC4uIDJeMTYsIGFuZCAxLjAgaXMgZXhhY3QuXG4gKiBTY2FsZXMgb3V0IG9mIHRoZSByYW5nZSBhcmUgY2xhbXBlZCBieSB0aGUgc25vcm0gcGFja2luZzogYSB6ZXJvIHNjYWxlIChvZnRlbiB1c2VkIHRvIGhpZGUgYSBwYXJ0IG9mIGEgbWVzaClcbiAqIGJlY29tZXMgMl4tMTYsIHdoaWNoIGtlZXBzIHRoZSBtZXNoIGludmlzaWJsZSB3aGlsZSBrZWVwaW5nIHRoZSBza2lubmluZyBtYXRyaXggaW52ZXJ0aWJsZSBmb3Igbm9ybWFscy5cbiAqXG4gKiBAcGFyYW0gc2NhbGUgLSBUaGUgbWFnbml0dWRlIG9mIHRoZSB1bmlmb3JtIHNjYWxlICg+PSAwKVxuICogQHJldHVybnMgVGhlIHZhbHVlIHRvIGJlIHBhY2tlZCBhcyBzbm9ybTE2IChpdCBtYXkgYmUgb3V0IG9mIFstMSwgMV07IHRoZSBwYWNraW5nIGNsYW1wcyBpdClcbiAqL1xuZnVuY3Rpb24gZW5jb2RlVmVjNHgxU2NhbGUoc2NhbGU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmxvZzIoc2NhbGUpIC8gVkVDNFgxX0xPRzJfU0NBTEVfUkFOR0U7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXJyb3IgZnVuY3Rpb24gKGVyZikgZm9yIGEgZ2l2ZW4gdmFsdWUuXG4gKiBUaGUgZXJyb3IgZnVuY3Rpb24gaXMgZGVmaW5lZCBhcyBlcmYoeCkgPSAoMi9cdTIyMUFcdTAzQzApIFx1MjIyQlswIHRvIHhdIGVeKC10XHUwMEIyKSBkdFxuICogQHBhcmFtIHggLSBUaGUgaW5wdXQgdmFsdWVcbiAqIEByZXR1cm5zIFRoZSBlcnJvciBmdW5jdGlvbiB2YWx1ZSBmb3IgeFxuICovXG5mdW5jdGlvbiBlcmYoeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gU2F2ZSB0aGUgc2lnbiBvZiB4XG4gIGxldCBzaWduID0gMTtcbiAgaWYgKHggPCAwKSBzaWduID0gLTE7XG4gIHggPSBNYXRoLmFicyh4KTtcblxuICAvLyBBJlMgZm9ybXVsYSA3LjEuMjZcbiAgY29uc3QgdDogbnVtYmVyID0gMSAvICgxICsgMC4zMjc1OTExICogeCk7XG4gIGNvbnN0IHk6IG51bWJlciA9XG4gICAgMSAtXG4gICAgKCgoKDEuMDYxNDA1NDI5ICogdCArIC0xLjQ1MzE1MjAyNykgKiB0ICsgMS40MjE0MTM3NDEpICogdCArIC0wLjI4NDQ5NjczNikgKiB0ICsgMC4yNTQ4Mjk1OTIpICpcbiAgICAgIHQgKlxuICAgICAgTWF0aC5leHAoLXggKiB4KTtcblxuICByZXR1cm4gc2lnbiAqIHk7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBlcnJvciBmdW5jdGlvbiAoZXJmXHUyMDdCXHUwMEI5KSBmb3IgYSBnaXZlbiB2YWx1ZS5cbiAqIFRoaXMgaXMgdGhlIGludmVyc2Ugb2YgdGhlIGVycm9yIGZ1bmN0aW9uOiBpZiB5ID0gZXJmKHgpLCB0aGVuIHggPSBpbnZFcmYoeSkuXG4gKiBAcGFyYW0geCAtIFRoZSBpbnB1dCB2YWx1ZSAoc2hvdWxkIGJlIGluIHJhbmdlIFstMSwgMV0pXG4gKiBAcmV0dXJucyBUaGUgaW52ZXJzZSBlcnJvciBmdW5jdGlvbiB2YWx1ZSBmb3IgeFxuICovXG5mdW5jdGlvbiBpbnZFcmYoeDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHc6IG51bWJlcjtcbiAgbGV0IHAgPSAwO1xuICB3ID0gLU1hdGgubG9nKCgxLjAgLSB4KSAqICgxLjAgKyB4KSk7XG4gIGlmICh3IDwgNS4wKSB7XG4gICAgdyA9IHcgLSAyLjU7XG4gICAgcCA9IDIuODEwMjI2MzZlLTg7XG4gICAgcCA9IDMuNDMyNzM5MzllLTcgKyBwICogdztcbiAgICBwID0gLTMuNTIzMzg3N2UtNiArIHAgKiB3O1xuICAgIHAgPSAtNC4zOTE1MDY1NGUtNiArIHAgKiB3O1xuICAgIHAgPSAwLjAwMDIxODU4MDg3ICsgcCAqIHc7XG4gICAgcCA9IC0wLjAwMTI1MzcyNTAzICsgcCAqIHc7XG4gICAgcCA9IC0wLjAwNDE3NzY4MTY0ICsgcCAqIHc7XG4gICAgcCA9IDAuMjQ2NjQwNzI3ICsgcCAqIHc7XG4gICAgcCA9IDEuNTAxNDA5NDEgKyBwICogdztcbiAgfSBlbHNlIHtcbiAgICB3ID0gTWF0aC5zcXJ0KHcpIC0gMztcbiAgICBwID0gLTAuMDAwMjAwMjE0MjU3O1xuICAgIHAgPSAwLjAwMDEwMDk1MDU1OCArIHAgKiB3O1xuICAgIHAgPSAwLjAwMTM0OTM0MzIyICsgcCAqIHc7XG4gICAgcCA9IC0wLjAwMzY3MzQyODQ0ICsgcCAqIHc7XG4gICAgcCA9IDAuMDA1NzM5NTA3NzMgKyBwICogdztcbiAgICBwID0gLTAuMDA3NjIyNDYxMyArIHAgKiB3O1xuICAgIHAgPSAwLjAwOTQzODg3MDQ3ICsgcCAqIHc7XG4gICAgcCA9IDEuMDAxNjc0MDYgKyBwICogdztcbiAgICBwID0gMi44MzI5NzY4MiArIHAgKiB3O1xuICB9XG4gIHJldHVybiBwICogeDtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBjdW11bGF0aXZlIGRpc3RyaWJ1dGlvbiBmdW5jdGlvbiAoQ0RGKSBmb3IgYSBHYXVzc2lhbiBkaXN0cmlidXRpb24uXG4gKiBAcGFyYW0geCAtIFRoZSB2YWx1ZSBhdCB3aGljaCB0byBldmFsdWF0ZSB0aGUgQ0RGXG4gKiBAcGFyYW0gbXUgLSBUaGUgbWVhbiBvZiB0aGUgR2F1c3NpYW4gZGlzdHJpYnV0aW9uXG4gKiBAcGFyYW0gc2lnbWEgLSBUaGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb25cbiAqIEByZXR1cm5zIFRoZSBjdW11bGF0aXZlIHByb2JhYmlsaXR5IHVwIHRvIHhcbiAqL1xuZnVuY3Rpb24gZ2F1c3NpYW5DZGYoeDogbnVtYmVyLCBtdTogbnVtYmVyLCBzaWdtYTogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgVTogbnVtYmVyID0gMC41ICogKDEgKyBlcmYoKHggLSBtdSkgLyAoc2lnbWEgKiBNYXRoLnNxcnQoMi4wKSkpKTtcbiAgcmV0dXJuIFU7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBjdW11bGF0aXZlIGRpc3RyaWJ1dGlvbiBmdW5jdGlvbiAoaW52ZXJzZSBDREYpIGZvciBhIEdhdXNzaWFuIGRpc3RyaWJ1dGlvbi5cbiAqIEBwYXJhbSBVIC0gVGhlIGN1bXVsYXRpdmUgcHJvYmFiaWxpdHkgKHNob3VsZCBiZSBpbiByYW5nZSBbMCwgMV0pXG4gKiBAcGFyYW0gbXUgLSBUaGUgbWVhbiBvZiB0aGUgR2F1c3NpYW4gZGlzdHJpYnV0aW9uXG4gKiBAcGFyYW0gc2lnbWEgLSBUaGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb25cbiAqIEByZXR1cm5zIFRoZSB2YWx1ZSB4IHN1Y2ggdGhhdCBDREYoeCkgPSBVXG4gKi9cbmZ1bmN0aW9uIGludkdhdXNzaWFuQ2RmKFU6IG51bWJlciwgbXU6IG51bWJlciwgc2lnbWE6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHg6IG51bWJlciA9IHNpZ21hICogTWF0aC5zcXJ0KDIuMCkgKiBpbnZFcmYoMi4wICogVSAtIDEpICsgbXU7XG4gIHJldHVybiB4O1xufVxuXG4vKipcbiAqIENvbXB1dGVzIGVpZ2VudmFsdWVzIGFuZCBlaWdlbnZlY3RvcnMgb2YgYSAzeDMgc3ltbWV0cmljIG1hdHJpeCB1c2luZyB0aGUgSmFjb2JpIG1ldGhvZC5cbiAqIEBwYXJhbSBBIC0gVGhlIGlucHV0IDN4MyBzeW1tZXRyaWMgbWF0cml4ICh3aWxsIGJlIG1vZGlmaWVkIGR1cmluZyBjb21wdXRhdGlvbilcbiAqIEBwYXJhbSBRIC0gVGhlIG91dHB1dCBtYXRyaXggdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGVpZ2VudmVjdG9yc1xuICogQHBhcmFtIHcgLSBUaGUgb3V0cHV0IHZlY3RvciB0aGF0IHdpbGwgY29udGFpbiB0aGUgZWlnZW52YWx1ZXNcbiAqIEByZXR1cm5zIDAgb24gc3VjY2VzcywgLTEgaWYgbWF4aW11bSBpdGVyYXRpb25zIGV4Y2VlZGVkXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVFaWdlblZhbHVlc0FuZFZlY3RvcnMoQTogTXV0YWJsZU1hdHJpeDMzLCBROiBNdXRhYmxlTWF0cml4MzMsIHc6IE11dGFibGVWZWN0b3IzKSB7XG4gIGNvbnN0IG4gPSAzO1xuICBsZXQgc2QgPSAwO1xuICBsZXQgc28gPSAwOyAvLyBTdW1zIG9mIGRpYWdvbmFsIHJlc3AuIG9mZi1kaWFnb25hbCBlbGVtZW50c1xuICBsZXQgcyA9IDA7XG4gIGxldCBjID0gMDtcbiAgbGV0IHQgPSAwOyAvLyBzaW4ocGhpKSwgY29zKHBoaSksIHRhbihwaGkpIGFuZCB0ZW1wb3Jhcnkgc3RvcmFnZVxuICBsZXQgZyA9IDA7XG4gIGxldCBoID0gMDtcbiAgbGV0IHogPSAwO1xuICBsZXQgdGhldGEgPSAwOyAvLyBNb3JlIHRlbXBvcmFyeSBzdG9yYWdlXG4gIGxldCB0aHJlc2ggPSAwO1xuXG4gIC8vIEluaXRpYWxpemUgUSB0byB0aGUgaWRlbnRpdGl0eSBtYXRyaXhcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICBRLnNldEF0KGksIGksIDEuMCk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBpOyBqKyspIHtcbiAgICAgIFEuc2V0QXQoaSwgaiwgMC4wKTtcbiAgICAgIFEuc2V0QXQoaiwgaSwgMC4wKTtcbiAgICB9XG4gIH1cblxuICAvLyBJbml0aWFsaXplIHcgdG8gZGlhZyhBKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgdy5zZXRBdChpLCBBLmF0KGksIGkpKTtcblxuICAvLyBDYWxjdWxhdGUgU1FSKHRyKEEpKVxuICBzZCA9IDAuMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHNkICs9IE1hdGguYWJzKHcuYXQoaSkpO1xuICBzZCA9IHNkICogc2Q7XG5cbiAgLy8gTWFpbiBpdGVyYXRpb24gbG9vcFxuICBmb3IgKGxldCBuSXRlciA9IDA7IG5JdGVyIDwgNTA7IG5JdGVyKyspIHtcbiAgICAvLyBUZXN0IGZvciBjb252ZXJnZW5jZVxuICAgIHNvID0gMC4wO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDwgbjsgcCsrKSB7XG4gICAgICBmb3IgKGxldCBxID0gcCArIDE7IHEgPCBuOyBxKyspIHNvICs9IE1hdGguYWJzKEEuYXQocCwgcSkpO1xuICAgIH1cbiAgICBpZiAoc28gPT09IDAuMCkgcmV0dXJuIDA7XG5cbiAgICBpZiAobkl0ZXIgPCA0KSB0aHJlc2ggPSAoMC4yICogc28pIC8gKG4gKiBuKTtcbiAgICBlbHNlIHRocmVzaCA9IDAuMDtcblxuICAgIC8vIERvIHN3ZWVwXG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPCBuOyBwKyspIHtcbiAgICAgIGZvciAobGV0IHEgPSBwICsgMTsgcSA8IG47IHErKykge1xuICAgICAgICBnID0gMTAwLjAgKiBNYXRoLmFicyhBLmF0KHAsIHEpKTtcbiAgICAgICAgaWYgKG5JdGVyID4gNCAmJiBNYXRoLmFicyh3LmF0KHApKSArIGcgPT09IE1hdGguYWJzKHcuYXQocCkpICYmIE1hdGguYWJzKHcuYXQocSkpICsgZyA9PT0gTWF0aC5hYnMody5hdChxKSkpIHtcbiAgICAgICAgICBBLnNldEF0KHAsIHEsIDAuMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoQS5hdChwLCBxKSkgPiB0aHJlc2gpIHtcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgSmFjb2JpIHRyYW5zZm9ybWF0aW9uXG4gICAgICAgICAgaCA9IHcuYXQocSkgLSB3LmF0KHApO1xuICAgICAgICAgIGlmIChNYXRoLmFicyhoKSArIGcgPT09IE1hdGguYWJzKGgpKSB7XG4gICAgICAgICAgICB0ID0gQS5hdChwLCBxKSAvIGg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoZXRhID0gKDAuNSAqIGgpIC8gQS5hdChwLCBxKTtcbiAgICAgICAgICAgIGlmICh0aGV0YSA8IDAuMCkgdCA9IC0xLjAgLyAoTWF0aC5zcXJ0KDEuMCArIHRoZXRhICogdGhldGEpIC0gdGhldGEpO1xuICAgICAgICAgICAgZWxzZSB0ID0gMS4wIC8gKE1hdGguc3FydCgxLjAgKyB0aGV0YSAqIHRoZXRhKSArIHRoZXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYyA9IDEuMCAvIE1hdGguc3FydCgxLjAgKyB0ICogdCk7XG4gICAgICAgICAgcyA9IHQgKiBjO1xuICAgICAgICAgIHogPSB0ICogQS5hdChwLCBxKTtcblxuICAgICAgICAgIC8vIEFwcGx5IEphY29iaSB0cmFuc2Zvcm1hdGlvblxuICAgICAgICAgIEEuc2V0QXQocCwgcSwgMC4wKTtcbiAgICAgICAgICB3LnNldEF0KHAsIHcuYXQocCkgLSB6KTtcbiAgICAgICAgICB3LnNldEF0KHEsIHcuYXQocSkgKyB6KTtcbiAgICAgICAgICBmb3IgKGxldCByID0gMDsgciA8IHA7IHIrKykge1xuICAgICAgICAgICAgdCA9IEEuYXQociwgcCk7XG4gICAgICAgICAgICBBLnNldEF0KHIsIHAsIGMgKiB0IC0gcyAqIEEuYXQociwgcSkpO1xuICAgICAgICAgICAgQS5zZXRBdChyLCBxLCBzICogdCArIGMgKiBBLmF0KHIsIHEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgciA9IHAgKyAxOyByIDwgcTsgcisrKSB7XG4gICAgICAgICAgICB0ID0gQS5hdChwLCByKTtcbiAgICAgICAgICAgIEEuc2V0QXQocCwgciwgYyAqIHQgLSBzICogQS5hdChyLCBxKSk7XG4gICAgICAgICAgICBBLnNldEF0KHIsIHEsIHMgKiB0ICsgYyAqIEEuYXQociwgcSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCByID0gcSArIDE7IHIgPCBuOyByKyspIHtcbiAgICAgICAgICAgIHQgPSBBLmF0KHAsIHIpO1xuICAgICAgICAgICAgQS5zZXRBdChwLCByLCBjICogdCAtIHMgKiBBLmF0KHEsIHIpKTtcbiAgICAgICAgICAgIEEuc2V0QXQocSwgciwgcyAqIHQgKyBjICogQS5hdChxLCByKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVXBkYXRlIGVpZ2VudmVjdG9yc1xuICAgICAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgbjsgcisrKSB7XG4gICAgICAgICAgICB0ID0gUS5hdChyLCBwKTtcbiAgICAgICAgICAgIFEuc2V0QXQociwgcCwgYyAqIHQgLSBzICogUS5hdChyLCBxKSk7XG4gICAgICAgICAgICBRLnNldEF0KHIsIHEsIHMgKiB0ICsgYyAqIFEuYXQociwgcSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBudW1lcmljIHZhbHVlIHRvIGEgc3RyaW5nIGZvcm1hdHRlZCBmb3IgR0xTTCBmbG9hdCBsaXRlcmFscy5cbiAqIEVuc3VyZXMgdGhhdCBpbnRlZ2VyIHZhbHVlcyBhcmUgc3VmZml4ZWQgd2l0aCBcIi4wXCIgZm9yIHByb3BlciBHTFNMIHN5bnRheC5cbiAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBudW1lcmljIHZhbHVlIHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHN1aXRhYmxlIGZvciBHTFNMIGZsb2F0IGxpdGVyYWxzXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcbiAgICByZXR1cm4gYCR7dmFsdWV9LjBgO1xuICB9XG4gIHJldHVybiBgJHt2YWx1ZX1gO1xufVxuXG4vKipcbiAqIFJvdW5kcyB2ZXJ5IHNtYWxsIHZhbHVlcyB0byB6ZXJvIGFuZCB2YWx1ZXMgdmVyeSBjbG9zZSB0byBcdTAwQjExIHRvIGV4YWN0bHkgXHUwMEIxMS5cbiAqIFRoaXMgaGVscHMgcmVkdWNlIGZsb2F0aW5nLXBvaW50IHByZWNpc2lvbiBlcnJvcnMgaW4gY2FsY3VsYXRpb25zLlxuICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgdmFsdWUgd2l0aCBzbWFsbCBlcnJvcnMgY29ycmVjdGVkXG4gKi9cbmZ1bmN0aW9uIG5lYXJaZXJvVG9aZXJvKHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAoTWF0aC5hYnModmFsdWUpIDwgMC4wMDAwMSkge1xuICAgIHZhbHVlID0gMDtcbiAgfSBlbHNlIGlmICgwLjk5OTk5IDwgdmFsdWUgJiYgdmFsdWUgPCAxLjAwMDAxKSB7XG4gICAgdmFsdWUgPSAxO1xuICB9IGVsc2UgaWYgKC0xLjAwMDAxIDwgdmFsdWUgJiYgdmFsdWUgPCAtMC45OTk5OSkge1xuICAgIHZhbHVlID0gLTE7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZvcm1hdHMgYSBudW1lcmljIHZhbHVlIGFzIGEgZml4ZWQtd2lkdGggZmluYW5jaWFsIHN0cmluZyB3aXRoIDcgZGVjaW1hbCBwbGFjZXMuXG4gKiBQb3NpdGl2ZSB2YWx1ZXMgYXJlIHByZWZpeGVkIHdpdGggYSBzcGFjZSBmb3IgYWxpZ25tZW50LlxuICogQHBhcmFtIHZhbCAtIFRoZSBudW1lcmljIHZhbHVlIHRvIGZvcm1hdFxuICogQHJldHVybnMgQSBmb3JtYXR0ZWQgc3RyaW5nIHdpdGggY29uc2lzdGVudCB3aWR0aCBmb3IgZmluYW5jaWFsIGRpc3BsYXlcbiAqL1xuZnVuY3Rpb24gZmluYW5jaWFsKHZhbDogbnVtYmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZml4ZWRTdHIgPSBOdW1iZXIucGFyc2VGbG9hdCh2YWwgYXMgc3RyaW5nKS50b0ZpeGVkKDcpO1xuICBpZiAoKHZhbCBhcyBudW1iZXIpID49IDApIHtcbiAgICByZXR1cm4gYCAke2ZpeGVkU3RyfWA7XG4gIH1cbiAgcmV0dXJuIGZpeGVkU3RyO1xufVxuXG4vKipcbiAqIFJvdW5kcyBhIGZsb2F0aW5nLXBvaW50IG51bWJlciB0byA3IGRlY2ltYWwgcGxhY2VzIHRvIHJlZHVjZSBwcmVjaXNpb24gZXJyb3JzLlxuICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIHRvIHJvdW5kXG4gKiBAcmV0dXJucyBUaGUgcm91bmRlZCB2YWx1ZVxuICovXG5mdW5jdGlvbiByb3VuZEFzRmxvYXQodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMTAwMDAwMDApIC8gMTAwMDAwMDA7XG59XG5cbi8qKlxuICogUGVyZm9ybXMgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gdmFsdWVzLlxuICogQHBhcmFtIGEgLSBUaGUgc3RhcnRpbmcgdmFsdWVcbiAqIEBwYXJhbSBiIC0gVGhlIGVuZGluZyB2YWx1ZVxuICogQHBhcmFtIHQgLSBUaGUgaW50ZXJwb2xhdGlvbiBwYXJhbWV0ZXIgKDAgcmV0dXJucyBhLCAxIHJldHVybnMgYilcbiAqIEByZXR1cm5zIFRoZSBpbnRlcnBvbGF0ZWQgdmFsdWVcbiAqL1xuZnVuY3Rpb24gbGVycChhOiBudW1iZXIsIGI6IG51bWJlciwgdDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGEgKiAoMSAtIHQpICsgYiAqIHQ7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgYSBub3JtYWxpemVkIGRpc2NyZXRlIEdhdXNzaWFuIGRpc3RyaWJ1dGlvbiB3aGVyZSB0aGUgc3VtIG9mIGFsbCByYXRpb3MgZXF1YWxzIDEuXG4gKiBUaGUgc2FtcGxpbmcgcG9pbnRzIGFyZSBwb3NpdGlvbmVkIGF0IGludGVnZXIgaW50ZXJ2YWxzIGFyb3VuZCB0aGUgbWVhbi5cbiAqXG4gKiBAcGFyYW0gcGFyYW1zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgZm9yIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb25cbiAqIEBwYXJhbSBwYXJhbXMua2VybmVsU2l6ZSAtIE51bWJlciBvZiBzYW1wbGluZyBwb2ludHMgaW4gdGhlIGRpc3RyaWJ1dGlvblxuICogQHBhcmFtIHBhcmFtcy52YXJpYW5jZSAtIFZhcmlhbmNlIG9mIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb25cbiAqIEBwYXJhbSBwYXJhbXMubWVhbiAtIE1lYW4gb2YgdGhlIEdhdXNzaWFuIGRpc3RyaWJ1dGlvbiAoZGVmYXVsdDogMClcbiAqIEBwYXJhbSBwYXJhbXMuZWZmZWN0aXZlRGlnaXQgLSBOdW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIHByZWNpc2lvbiAoZGVmYXVsdDogNClcbiAqIEByZXR1cm5zIEFuIGFycmF5IG9mIG5vcm1hbGl6ZWQgcmF0aW9zIHRoYXQgc3VtIHRvIDFcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gRm9yIGtlcm5lbFNpemUgPSAyIChtZWFuPTApOiBzYW1wbGluZyBwb2ludHMgYXJlIGF0IC0wLjUgYW5kIDAuNVxuICogLy8gRm9yIGtlcm5lbFNpemUgPSAzIChtZWFuPTEpOiBzYW1wbGluZyBwb2ludHMgYXJlIGF0IDAuMCwgMS4wLCBhbmQgMi4wXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVHYXVzc2lhbkRpc3RyaWJ1dGlvblJhdGlvV2hvc2VTdW1Jc09uZSh7XG4gIGtlcm5lbFNpemUsXG4gIHZhcmlhbmNlLFxuICBtZWFuID0gMCxcbiAgZWZmZWN0aXZlRGlnaXQgPSA0LFxufToge1xuICBrZXJuZWxTaXplOiBDb3VudDtcbiAgdmFyaWFuY2U6IG51bWJlcjtcbiAgbWVhbj86IG51bWJlcjtcbiAgZWZmZWN0aXZlRGlnaXQ/OiBDb3VudDtcbn0pOiBudW1iZXJbXSB7XG4gIGNvbnN0IGNlaWxlZEhhbGZLZXJuZWxTaXplID0gTWF0aC5jZWlsKGtlcm5lbFNpemUgLyAyLjApO1xuICBjb25zdCBnYXVzc2lhbkRpc3RyaWJ1dGlvblJhdGlvOiBudW1iZXJbXSA9IG5ldyBBcnJheShjZWlsZWRIYWxmS2VybmVsU2l6ZSk7XG4gIGxldCB0b3RhbFNpemUgPSAwO1xuXG4gIC8vIGFib3ZlIG1lYW4gc2lkZSBhbmQgY2VudGVyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2VpbGVkSGFsZktlcm5lbFNpemU7IGkrKykge1xuICAgIGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9baV0gPSBNYXRoLmV4cCgtKChpIC0gbWVhbikgKiogMikgLyAoMi4wICogdmFyaWFuY2UpKTtcblxuICAgIHRvdGFsU2l6ZSArPSBnYXVzc2lhbkRpc3RyaWJ1dGlvblJhdGlvW2ldO1xuICB9XG5cbiAgLy8gYmVsb3cgbWVhbiBzaWRlXG4gIHRvdGFsU2l6ZSAqPSAyO1xuXG4gIC8vIGlmIGEgY2VudGVyIGV4aXN0c1xuICBpZiAoKGtlcm5lbFNpemUgLyAyLjApICUgMiAhPT0gMC4wKSB7XG4gICAgdG90YWxTaXplIC09IGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9bMF07XG4gIH1cblxuICBjb25zdCBnYXVzc2lhbkRpc3RyaWJ1dGlvblJhdGlvV2hvc2VTdW1Jc09uZSA9IG5ldyBBcnJheShrZXJuZWxTaXplKTtcbiAgbGV0IHRvdGFsUmF0aW8gPSAwO1xuICBjb25zdCBjaGFuZ2VEaWdpdFBhcmFtID0gMTAgKiogZWZmZWN0aXZlRGlnaXQ7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjZWlsZWRIYWxmS2VybmVsU2l6ZSAtIDE7IGkrKykge1xuICAgIGxldCByYXRpbyA9IGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9bY2VpbGVkSGFsZktlcm5lbFNpemUgLSAxIC0gaV0gLyB0b3RhbFNpemU7XG5cbiAgICByYXRpbyAqPSBjaGFuZ2VEaWdpdFBhcmFtO1xuICAgIHJhdGlvID0gTWF0aC5yb3VuZChyYXRpbyk7XG4gICAgcmF0aW8gLz0gY2hhbmdlRGlnaXRQYXJhbTtcblxuICAgIGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9XaG9zZVN1bUlzT25lW2ldID0gcmF0aW87XG4gICAgZ2F1c3NpYW5EaXN0cmlidXRpb25SYXRpb1dob3NlU3VtSXNPbmVba2VybmVsU2l6ZSAtIDEgLSBpXSA9IHJhdGlvO1xuXG4gICAgdG90YWxSYXRpbyArPSAyICogcmF0aW87XG4gIH1cblxuICBpZiAoa2VybmVsU2l6ZSAlIDIgPT09IDApIHtcbiAgICBjb25zdCB2YWx1ZSA9ICgxIC0gdG90YWxSYXRpbykgLyAyLjA7XG4gICAgZ2F1c3NpYW5EaXN0cmlidXRpb25SYXRpb1dob3NlU3VtSXNPbmVbY2VpbGVkSGFsZktlcm5lbFNpemUgLSAxXSA9IHZhbHVlO1xuICAgIGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9XaG9zZVN1bUlzT25lW2NlaWxlZEhhbGZLZXJuZWxTaXplXSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHZhbHVlID0gMSAtIHRvdGFsUmF0aW87XG4gICAgZ2F1c3NpYW5EaXN0cmlidXRpb25SYXRpb1dob3NlU3VtSXNPbmVbY2VpbGVkSGFsZktlcm5lbFNpemUgLSAxXSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9XaG9zZVN1bUlzT25lO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBjbGFzcyBjb250YWluaW5nIHZhcmlvdXMgbWF0aGVtYXRpY2FsIGZ1bmN0aW9ucyBhbmQgb3BlcmF0aW9ucy5cbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgc3RhdGljIG1ldGhvZHMgZm9yIGNvbW1vbiBtYXRoZW1hdGljYWwgY29tcHV0YXRpb25zIGluY2x1ZGluZzpcbiAqIC0gQW5nbGUgY29udmVyc2lvbnMgKHJhZGlhbnMvZGVncmVlcylcbiAqIC0gRmxvYXRpbmcgcG9pbnQgb3BlcmF0aW9ucyBhbmQgY29udmVyc2lvbnNcbiAqIC0gUG93ZXItb2YtdHdvIGNoZWNrc1xuICogLSBWZWN0b3IgcGFja2luZyB1dGlsaXRpZXNcbiAqIC0gU3RhdGlzdGljYWwgZnVuY3Rpb25zIChHYXVzc2lhbiBkaXN0cmlidXRpb25zLCBlcnJvciBmdW5jdGlvbnMpXG4gKiAtIE1hdHJpeCBlaWdlbnZhbHVlIGNvbXB1dGF0aW9uc1xuICogLSBJbnRlcnBvbGF0aW9uIGFuZCBmb3JtYXR0aW5nIHV0aWxpdGllc1xuICovXG5leHBvcnQgY29uc3QgTWF0aFV0aWwgPSBPYmplY3QuZnJlZXplKHtcbiAgcmFkaWFuVG9EZWdyZWUsXG4gIGRlZ3JlZVRvUmFkaWFuLFxuICBlbmNvZGVMb2dRdWF0LFxuICBpc1Npbmd1bGFyRGV0LFxuICBnZXRTaW5ndWxhckVwc2lsb24sXG4gIFNJTkdVTEFSX0VQU0lMT04sXG4gIFNJTkdVTEFSX0VQU0lMT05fRkxPQVQ2NCxcbiAgdG9IYWxmRmxvYXQsXG4gIGlzUG93ZXJPZlR3byxcbiAgaXNQb3dlck9mVHdvVGV4dHVyZSxcbiAgcGFja05vcm1hbGl6ZWRWZWM0VG9WZWMyLFxuICBwYWNrU25vcm1WZWM0VG9VVmVjMixcbiAgaXNVbmlmb3JtU2NhbGUsXG4gIGVuY29kZVZlYzR4MVNjYWxlLFxuICBjb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCxcbiAgbmVhclplcm9Ub1plcm8sXG4gIGdhdXNzaWFuQ2RmLFxuICBpbnZHYXVzc2lhbkNkZixcbiAgY29tcHV0ZUVpZ2VuVmFsdWVzQW5kVmVjdG9ycyxcbiAgY29tcHV0ZUdhdXNzaWFuRGlzdHJpYnV0aW9uUmF0aW9XaG9zZVN1bUlzT25lLFxuICByb3VuZEFzRmxvYXQsXG4gIGZpbmFuY2lhbCxcbiAgbGVycCxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVNBLFNBQVMsZUFBZSxLQUFxQjtBQUMzQyxTQUFRLE1BQU0sTUFBTyxLQUFLO0FBQzVCO0FBT0EsU0FBUyxlQUFlLEtBQXFCO0FBQzNDLFNBQVEsTUFBTSxLQUFLLEtBQU07QUFDM0I7QUFlQSxJQUFNLG1CQUFtQjtBQVN6QixJQUFNLDJCQUEyQjtBQUVqQyxJQUFNLE9BQU87QUFDYixJQUFNLFVBQVUsS0FBSyxLQUFLO0FBTW5CLFNBQVMsY0FBYyxJQUFZLElBQVksSUFBWSxJQUFzQjtBQUV0RixRQUFNLE1BQU0sS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckMsTUFBSSxJQUFJLEtBQUssS0FDWCxJQUFJLEtBQUssS0FDVCxJQUFJLEtBQUssS0FDVCxJQUFJLEtBQUs7QUFHWCxNQUFJLElBQUksR0FBRztBQUNU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
