import MutableVector4 from './MutableVector4';

test('Test isEqual', () => {
  const a = MutableVector4.fromCopyArray([0.2, 0.2, 0.2, 0.2]);
  const b = MutableVector4.fromCopyArray([0.1, 0.1, 0.1, 0.1]);
  const c = MutableVector4.fromCopyArray([0.3, 0.3, 0.3, 0.3]);

  expect(a.add(b).isEqual(c)).toBe(true);
});
