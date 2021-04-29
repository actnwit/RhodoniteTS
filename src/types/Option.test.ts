import { IOption, None, Option, Some } from "./Option"

test('Basic usage of Option', () => {
  const val: Option<number> = new Option();
  val.set(10);
  const valRaw = val.getOrError();

  expect(valRaw).toEqual(10);
});

test('Basic usage of Option', () => {
  const val: Option<number> = new Option();
  val.set(10);
  const valRaw = val.getOrError();

  expect(valRaw).toEqual(10);
});
