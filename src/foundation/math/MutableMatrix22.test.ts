import { MutableMatrix22 } from './MutableMatrix22';

test('MutableMatrix22.identity', () => {
  const identity = MutableMatrix22.identity();
  expect(identity.m00).toBe(1);
  expect(identity.m01).toBe(0);
  expect(identity.m10).toBe(0);
  expect(identity.m11).toBe(1);

  expect(identity instanceof MutableMatrix22).toBe(true);
});
