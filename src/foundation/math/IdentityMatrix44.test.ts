import Matrix44 from "./Matrix44";
import MutableMatrix44 from "./MutableMatrix44";
import IdentityMatrix44 from "./IdentityMatrix44";

test('Test isEqual', () => {
  const a = Matrix44.identity();
  const b = MutableMatrix44.identity();
  const i = new IdentityMatrix44();

  expect(i.isEqual(a)).toBe(true);
  expect(i.isEqual(b)).toBe(true);
});
