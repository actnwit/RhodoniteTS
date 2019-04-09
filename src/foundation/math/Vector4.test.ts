import Matrix44 from './Matrix44';
import Vector4 from './Vector4';


test('Vector4 is immutable', () => {
  const vec = new Vector4(0, 3, 4, 0);
  console.log(vec.w)
  expect(()=>{(vec as any).w = 1}).toThrowError()

  console.log(vec.w)
  expect(vec.w).toBe(0);
});

test('Multiplication of two Vector4 works correctly', () => {
  const vec = new Vector4(0, 3, 4, 0);
  console.log(vec.x, vec.y, vec.z, vec.w)

  const vec2 = new Vector4(0, 6, 8, 0);  
  const result_vec = Vector4.multiplyVector(vec, vec2);
  console.log(result_vec.x, result_vec.y, result_vec.z, result_vec.w);

  expect(result_vec.isEqual(new Vector4(0, 18, 32, 0))).toBe(true);
});
