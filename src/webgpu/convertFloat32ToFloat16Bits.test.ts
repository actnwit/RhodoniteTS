import { convertFloat32ToFloat16Bits } from './convertFloat32ToFloat16Bits';

test('converts representative values to IEEE 754 half-float bits', () => {
  const values = new Float32Array([
    0,
    -0,
    1,
    -1,
    0.5,
    -2,
    2,
    100,
    60000,
    65504, // Largest finite half float
    65519, // Rounds down to 65504
    65520, // Rounds up to Inf
    65536,
    Infinity,
    -Infinity,
    NaN,
    -NaN,
    2 ** -24, // Smallest half denormal
    2 ** -25, // Halfway to zero: ties to even
    3 * 2 ** -25, // Halfway between the two smallest denormals
    2 ** -15,
    2 ** -14, // Smallest normal half float
    1 + 2 ** -11, // Halfway: ties to even
    1 + 3 * 2 ** -11, // Halfway: ties to even
    0.1,
    Math.PI,
    1e-5,
    1e-8, // Underflows to zero
    -1e-8,
  ]);
  const expected = new Uint16Array([
    0x0000, 0x8000, 0x3c00, 0xbc00, 0x3800, 0xc000, 0x4000, 0x5640, 0x7b53, 0x7bff, 0x7bff, 0x7c00, 0x7c00, 0x7c00,
    0xfc00, 0x7e00, 0xfe00, 0x0001, 0x0000, 0x0002, 0x0200, 0x0400, 0x3c00, 0x3c02, 0x2e66, 0x4248, 0x00a8, 0x0000,
    0x8000,
  ]);

  expect(convertFloat32ToFloat16Bits(values)).toEqual(expected);
});

test('matches the platform Float16Array conversion when available', () => {
  const Float16ArrayCtor = (
    globalThis as unknown as {
      Float16Array?: new (src: Float32Array) => { buffer: ArrayBufferLike; length: number };
    }
  ).Float16Array;
  if (Float16ArrayCtor == null) {
    // Node builds without Float16Array still exercise the fixed table above.
    return;
  }

  // Deterministic bit patterns over the whole float range, including NaN, Inf and denormals.
  const count = 20000;
  const bits = new Uint32Array(count);
  let state = 0x12345678;
  for (let i = 0; i < count; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    bits[i] = state;
  }
  const values = new Float32Array(bits.buffer);
  const expected = new Uint16Array(new Float16ArrayCtor(values).buffer, 0, count);

  expect(convertFloat32ToFloat16Bits(values)).toEqual(expected);
});
