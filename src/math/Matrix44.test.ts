import ImmutableMatrix44 from './ImmutableMatrix44';
import MutableMatrix44 from './MutableMatrix44';
import ImmutableVector3 from './ImmutableVector3';


test('Test isEqual', () => {
  const a = new ImmutableMatrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = MutableMatrix44.identity();
  b.translate(new ImmutableVector3(1, 0, 0));

  expect(a.isEqual(b)).toBe(true);
});

