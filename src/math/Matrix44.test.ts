import Matrix44 from '../math/Matrix44';
import Vector3 from './Vector3';


test('Test isEqual', () => {
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = Matrix44.identity();
  b.translate(new Vector3(1, 0, 0));

  expect(a.isEqual(b)).toBe(true);
});

