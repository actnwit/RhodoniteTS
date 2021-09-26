import {add3, add3_offset, add4, add4_offset} from './raw_extension';

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

test(`${add4.toString()} operator`, () => {
  const a = [0, 0, 0, 0];

  // add Float32Array
  const a_add4 = a[add4]([1, 0, 0, 1]);
  expect(a.toString()).toEqual([1, 0, 0, 1].toString());
  // return value is the same
  expect(a_add4.toString()).toEqual([1, 0, 0, 1].toString());
});

test(`${add4_offset.toString()} operator`, () => {
  const a = [1, 0, 0, 0, 0];

  // add Float32Array
  const ret = a[add4_offset](new Float32Array([1, 0, 0, 0, 1]), 1, 1);
  expect(a.toString()).toEqual([1, 0, 0, 0, 1].toString());
  // return value is the same
  expect(ret.toString()).toEqual([1, 0, 0, 0, 1].toString());
});
