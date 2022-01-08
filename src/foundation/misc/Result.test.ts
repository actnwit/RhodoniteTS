import {IResult, Ok, Err} from './Result';

test('Basic usage of Result', () => {
  const succeedIfValueEven = (val: number): IResult<number, string> => {
    if (val % 2 === 0) {
      return new Ok(val);
    } else {
      return new Err('Error');
    }
  };

  const result0 = succeedIfValueEven(0);
  const result1 = succeedIfValueEven(1);
  let result = '';
  result0.match({
    Ok: (val: number) => {
      expect(val).toBe(0);
      result = result0.name();
    },
    Err: (err: string) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
      result = result0.name();
    },
    Finally: () => {
      expect(result).toBe('Ok');
    },
  });

  result1.match({
    Ok: (val: number) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
      result = result1.name();
    },
    Err: (err: string) => {
      expect(err).toBe('Error');
      result = result1.name();
    },
    Finally: () => {
      expect(result).toBe('Err');
    },
  });
  expect(result1.getBoolean()).toBe(false);
});
