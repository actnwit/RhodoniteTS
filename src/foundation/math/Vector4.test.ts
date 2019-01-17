import Matrix44 from './Matrix44';
import Vector4 from './Vector4';


test('Vector4 is immutable', () => {
  const vec = new Vector4(0, 3, 4, 0);
  console.log(vec.w)
  expect(()=>{(vec as any).w = 1}).toThrowError()

  console.log(vec.w)
  expect(vec.w).toBe(0);
});
