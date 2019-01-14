import ImmutableMatrix44 from './ImmutableMatrix44';
import ImmutableVector4 from './ImmutableVector4';


test('ImmutableVector4 is immutable', () => {
  const vec = new ImmutableVector4(0, 3, 4, 0);
  console.log(vec.w)
  expect(()=>{(vec as any).w = 1}).toThrowError()

  console.log(vec.w)
  expect(vec.w).toBe(0);
});
