import { IResult, Ok, Err } from "./Result";

test('Basic usage of Result', () => {
  const succeedIfEven = (val: number): IResult<number, string> => {
    if (val % 2 === 0) {
      return new Ok(val);
    } else {
      return new Err('Error');
    }
  };

  const result0 = succeedIfEven(0);
  const result1 = succeedIfEven(1);

  expect(result0.match(
    (val: number)=>{return new Ok(val)},
    (val: string)=>{return val})
    ).toBeInstanceOf(Ok);

  expect(result1.getBoolean()).toBe(false);
});
