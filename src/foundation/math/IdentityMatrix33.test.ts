import IdentityMatrix33 from './IdentityMatrix33';
import {Matrix33} from './Matrix33';
import MutableMatrix33 from './MutableMatrix33';

test('Test isEqual', () => {
  const a = Matrix33.identity();
  const b = MutableMatrix33.identity();
  const i = new IdentityMatrix33();

  expect(i.isEqual(a)).toBe(true);
  expect(i.isEqual(b)).toBe(true);
});
