import Vector4 from '../math/Vector4';


// test('Test isEqual', () => {
//   const a = new Vector4(0.2, 0.2, 0.2, 0.2);
//   const b = new Vector4(0.1, 0.1, 0.1, 0.1);
//   const c = new Vector4(0.3, 0.3, 0.3, 0.3);
   
//   expect(a.add(b).isEqual(c)).toBe(false);
// });

test('Test isEqual', () => {
  const a = new Vector4(0.2, 0.2, 0.2, 0.2);
  const b = new Vector4(0.1, 0.1, 0.1, 0.1);
  const c = new Vector4(0.3, 0.3, 0.3, 0.3);
   
  expect(a.add(b).isEqual(c)).toBe(true);
});

