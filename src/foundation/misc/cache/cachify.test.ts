import { primitiveCachify1 } from './cachify';

let realCallCount = 0;
const expensiveFn = (arg: number) => {
  realCallCount++;
  return arg ** arg;
};

test('test cachify()', () => {
  const cachedFn = primitiveCachify1(expensiveFn);
  expect(realCallCount).toBe(0);
  const result = cachedFn(5);
  expect(result).toBe(5 ** 5);
  expect(realCallCount).toBe(1);

  const result2 = cachedFn(5);
  expect(result2).toBe(5 ** 5);
  expect(realCallCount).toBe(1);

  const result3 = cachedFn(10);
  expect(result3).toBe(10 ** 10);
  expect(realCallCount).toBe(2);
});
