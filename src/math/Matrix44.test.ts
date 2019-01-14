import Matrix44 from '../math/Matrix44';
import ImmutableVector3 from './ImmutableVector3';


test('Test isEqual', () => {
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = Matrix44.identity();
  b.translate(new ImmutableVector3(1, 0, 0));

  expect(a.isEqual(b)).toBe(true);
});

