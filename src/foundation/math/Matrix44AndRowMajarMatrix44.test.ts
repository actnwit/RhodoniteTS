import Matrix44 from "./Matrix44";
import MutableMatrix44 from "./MutableMatrix44";
import Vector3 from "./Vector3";

test('This Matrix44 is equal that munupilated RowMajarMatrix44', () => {
  const a = new Matrix44(
    1, 0, 0, 1,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1);
  const b = MutableMatrix44.identity();
  b.translate(new Vector3(1, 0, 0));

  expect(a.isEqual(b)).toBe(true);
});

// test('Matrix44 -> MutableMatrix44', () => {
//   const a = new Matrix44(
//     1, 0, 0, 1,
//     0, 1, 0, 0,
//     0, 0, 1, 0,
//     0, 0, 0, 1);
//   const b = new MutableMatrix44(a);

//   expect(a.isEqual(b)).toBe(true);
// });

