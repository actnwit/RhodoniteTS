import { MathUtil } from './MathUtil';

/** Decodes a snorm16 value packed by MathUtil.packSnormVec4ToUVec2 (same as unpackSnorm2x16 / unpack2x16snorm) */
function snorm16ToFloat(code: number) {
  return Math.max(-1, (code >= 0x8000 ? code - 0x10000 : code) / 32767);
}

/** Encodes a uniform scale and decodes it in the same way as the shaders (exp2(w * 16)) */
function roundTripVec4x1Scale(scale: number) {
  const packed = MathUtil.packSnormVec4ToUVec2(0, 0, 0, MathUtil.encodeVec4x1Scale(scale));
  const w = snorm16ToFloat(packed[1] >>> 16);
  return 2 ** (w * 16);
}

test('encodeVec4x1Scale represents 1 exactly and keeps scales over 1', () => {
  expect(roundTripVec4x1Scale(1)).toBe(1);
  expect(roundTripVec4x1Scale(2)).toBeCloseTo(2, 3);
  expect(roundTripVec4x1Scale(100)).toBeCloseTo(100, 1);
});

test('encodeVec4x1Scale keeps the relative error within 1.7e-4 over 2^-16 .. 2^16', () => {
  for (let exponent = -15.9; exponent <= 15.9; exponent += 0.37) {
    const scale = 2 ** exponent;
    const relativeError = Math.abs(roundTripVec4x1Scale(scale) - scale) / scale;
    expect(relativeError).toBeLessThanOrEqual(1.7e-4);
  }
});

test('encodeVec4x1Scale clamps scales out of the range', () => {
  expect(roundTripVec4x1Scale(0)).toBe(2 ** -16);
  expect(roundTripVec4x1Scale(1e-9)).toBe(2 ** -16);
  expect(roundTripVec4x1Scale(1e9)).toBe(2 ** 16);
});

test('isUniformScale uses a relative tolerance of 1e-3 and ignores the signs', () => {
  expect(MathUtil.isUniformScale(1, 1, 1)).toBe(true);
  expect(MathUtil.isUniformScale(100, 100.05, 99.95)).toBe(true);
  expect(MathUtil.isUniformScale(-2, 2, 2)).toBe(true);
  expect(MathUtil.isUniformScale(1, 1, 1.01)).toBe(false);
  expect(MathUtil.isUniformScale(0, 0, 0)).toBe(true);
});
