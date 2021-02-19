import MutableVector4 from './MutableVector4';

test('Test isEqual', () => {
  const a = new MutableVector4(0.2, 0.2, 0.2, 0.2);
  const b = new MutableVector4(0.1, 0.1, 0.1, 0.1);
  const c = new MutableVector4(0.3, 0.3, 0.3, 0.3);

  expect(a.add(b).isEqual(c)).toBe(true);
});
