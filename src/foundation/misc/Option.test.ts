import { IOption, None, Option, Some } from "./Option"

test('Basic usage of Option', () => {
  const val: Option<number> = new Option();
  expect(val.getOrDefault(0)).toEqual(0);
  expect(val.getOrElse(()=>{return 100})).toEqual(100);
  expect(()=>{val.getOrError()}).toThrowError(ReferenceError);

  val.set(10);

  expect(val.getOrDefault(0)).toEqual(10);
  expect(val.getOrElse(()=>{return 100})).toEqual(10);
  expect(val.getOrError()).toEqual(10);
});

test('Basic usage of Some and None', () => {
  class Hit {};

  const funcUsingSomeAndNone = (val: number): IOption<Hit> => {
    if (val % 2 === 0) { // return hit object for even numbers
      return new Some(new Hit());
    } else { // return nothing for odd numbers
      return new None();
    }
  }

  const result0: IOption<Hit> = funcUsingSomeAndNone(0); // Some
  const result1: IOption<Hit> = funcUsingSomeAndNone(1); // None
  expect(result0.getOrError().constructor.name).toBe(Hit.name);
  expect(()=>{result1.getOrError().constructor.name}).toThrowError(ReferenceError);
});

test('An IOption variable can be replaced by Some', () => {
  let val: IOption<number> = new None();
  val = new Some(10);
  const valRaw = val.getOrError();

  expect(valRaw).toEqual(10);
});
