import {add3, add3_offset} from './raw_extension';

test('Array extensions', () => {
  const a = [0, 0, 0];

  // add array<number>
  const a_add3 = a[add3]([1, 0, 0]);
  expect(a.toString()).toEqual([1, 0, 0].toString());
  // return value is the same
  expect(a_add3.toString()).toEqual([1, 0, 0].toString());

  // add Float32Array
  a[add3_offset](new Float32Array([0, 1, 0]), 0, 0);
  expect(a.toString()).toEqual([1, 1, 0].toString());

  // add array<number> with offset
  const b = [0, 1, 0, 0];
  b[add3_offset]([1, 0, 0, 1], 1, 1);
  expect(b.toString()).toEqual([0, 1, 0, 1].toString());

});

test('Float32Array extensions', () => {
  const a = new Float32Array([0, 0, 0]);

  // add Float32Array
  const a_add3 = a[add3](new Float32Array([1, 0, 0]));
  expect(a.toString()).toEqual([1, 0, 0].toString());
  // return value is the same
  expect(a_add3.toString()).toEqual([1, 0, 0].toString());

  // add array<number>
  const a_add3_offset = a[add3_offset]([0, 1, 0], 0, 0);
  expect(a_add3_offset.toString()).toEqual([1, 1, 0].toString());

  // add array<number> with offset
  const b = [0, 1, 0, 0];
  b[add3_offset]([1, 0, 0, 1], 1, 1);
  expect(b.toString()).toEqual([0, 1, 0, 1].toString());
});
