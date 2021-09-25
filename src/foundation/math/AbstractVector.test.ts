import Vector4 from './Vector4';

test('AbstractVector::isTheSourceSame', () => {
  const vec_source = new Float32Array([0, 1, 2, 3]);
  const vec_source2 = new Float32Array([-1, -1, -1, -1]);
  const vec1 = new Vector4(vec_source);
  const vec2 = new Vector4(vec_source);
  const vecAnother = new Vector4(vec_source2);
  const vecAnother2 = new Vector4(0, 0, 0, 0);

  expect(vec1.isTheSourceSame(vec2._v.buffer)).toBe(true);
  expect(vec1.isTheSourceSame(vecAnother._v.buffer)).toBe(false);
  expect(vec1.isTheSourceSame(vecAnother2._v.buffer)).toBe(false);
});
