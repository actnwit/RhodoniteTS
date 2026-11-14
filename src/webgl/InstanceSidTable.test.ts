import { InstanceSidTable } from './InstanceSidTable';
import type { WebGLContextWrapper } from './WebGLContextWrapper';

const unsupportedWrapper = { isWebGL2: false } as WebGLContextWrapper;

test('allocate returns contiguous ranges and free ranges are reused', () => {
  const table = new InstanceSidTable(unsupportedWrapper);
  expect(table.isSupported).toBe(false);

  expect(table.allocate(4)).toBe(0);
  expect(table.allocate(2)).toBe(4);

  table.free(0, 4);

  expect(table.allocate(3)).toBe(0);
  expect(table.allocate(1)).toBe(3);
  // The free list is exhausted, so the next allocation appends after the used range.
  expect(table.allocate(1)).toBe(6);
});

test('free merges adjacent ranges', () => {
  const table = new InstanceSidTable(unsupportedWrapper);
  expect(table.allocate(2)).toBe(0);
  expect(table.allocate(2)).toBe(2);
  expect(table.allocate(2)).toBe(4);

  table.free(0, 2);
  table.free(2, 2);
  table.free(4, 2);

  expect(table.allocate(6)).toBe(0);
});

test('records and remap entries are stored correctly', () => {
  const table = new InstanceSidTable(unsupportedWrapper);
  const base = table.allocate(3);

  table.setRecord(base + 0, 10, 20, 30);
  table.setRecord(base + 1, 11, 0xffff_ffff, 31);
  table.setRecord(base + 2, 12, 22, 0xffff_ffff);

  expect(table.getRecord(base + 0)).toEqual([10, 20, 30]);
  expect(table.getRecord(base + 1)).toEqual([11, 0xffff_ffff, 31]);
  expect(table.getRecord(base + 2)).toEqual([12, 22, 0xffff_ffff]);

  table.writeIdentityRemap(base, 3);
  expect([0, 1, 2].map(i => table.getRemapValue(base + i))).toEqual([0, 1, 2]);

  table.setRemap(base + 0, 2);
  table.setRemap(base + 1, 0);
  expect(table.getRemapValue(base + 0)).toBe(2);
  expect(table.getRemapValue(base + 1)).toBe(0);
});
