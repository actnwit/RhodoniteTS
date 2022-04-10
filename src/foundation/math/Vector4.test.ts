import {Vector4} from './Vector4';

test('Vector4 is immutable', () => {
  const vec = Vector4.fromCopyArray([0, 3, 4, 0]);
  expect(() => {
    (vec as any).x = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).y = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).z = 1;
  }).toThrowError();
  expect(() => {
    (vec as any).w = 1;
  }).toThrowError();

  expect(vec.w).toBe(0);
});

test('Vector4.glslStrAsFloat()', () => {
  const vec = Vector4.fromCopy4(0, 3, 4, 0);
  expect(vec.glslStrAsFloat).toBe('vec4(0.0, 3.0, 4.0, 0.0)');
});

test('Multiplication of two Vector4 works correctly', () => {
  const vec = Vector4.fromCopyArray([0, 3, 4, 0]);
  // console.log(vec.x, vec.y, vec.z, vec.w);

  const vec2 = Vector4.fromCopyArray([0, 6, 8, 0]);
  const result_vec = Vector4.multiplyVector(vec, vec2);
  // console.log(result_vec.x, result_vec.y, result_vec.z, result_vec.w);

  expect(result_vec.isEqual(Vector4.fromCopyArray([0, 18, 32, 0]))).toBe(true);
});
