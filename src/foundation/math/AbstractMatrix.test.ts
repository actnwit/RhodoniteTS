import {Matrix22} from './Matrix22';

test('AbstractMatrix::isTheSourceSame', () => {
  const mat_source = new Float32Array([0, 1, 2, 3]);
  const mat_source2 = new Float32Array([-1, -1, -1, -1]);
  const mat1 = new Matrix22(mat_source);
  const mat2 = new Matrix22(mat_source);
  const matAnother = new Matrix22(mat_source2);
  const matAnother2 = Matrix22.fromCopy4RowMajor(0, 0, 0, 0);

  expect(mat1.isTheSourceSame(mat2._v.buffer)).toBe(true);
  expect(mat1.isTheSourceSame(matAnother._v.buffer)).toBe(false);
  expect(mat1.isTheSourceSame(matAnother2._v.buffer)).toBe(false);
});
