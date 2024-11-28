import { Result, Ok, Err, RnError } from './Result';
import { RnException } from './RnException';

function succeedIfValueEven(val: number): Result<number, number> {
  if (val % 2 === 0) {
    return new Ok(val);
  } else {
    return new Err({
      message: 'Error',
      error: val,
    });
  }
}

test(`Result.match`, () => {
  const result0 = succeedIfValueEven(0);
  const result1 = succeedIfValueEven(1);
  const ret0 = result0.match({
    Ok: (val: number) => {
      expect(val).toBe(0);
      return result0.name();
    },
    Err: (err: RnError<number>) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
      return err;
    },
  });
  expect(ret0.unwrapForce()).toBe('Ok');

  const ret1 = result1.match({
    Ok: (val: number) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
      return val;
    },
    Err: (err: RnError<number>) => {
      expect(err.message).toBe('Error');
      return {
        message: err.message + '!!!',
        error: 'Err',
      };
    },
  });
  expect(ret1.isErr()).toBe(true);
  if (ret1.isErr()) {
    expect(ret1.getRnError().error).toBe('Err');
  }
});

test(`Result.unwrap`, () => {
  const result0 = succeedIfValueEven(0);
  const value0 = result0.unwrapWithCompensation((err: RnError<number>) => {
    expect(true).toBe(false); // If here come, this is wrong behavior.
    return err.error + 1; // compensation
  });
  expect(value0).toBe(0);

  const result1 = succeedIfValueEven(1);
  const value1 = result1.unwrapWithCompensation((err: RnError<number>) => {
    expect(err.message).toBe('Error');
    return err.error + 1; // compensation
  });
  expect(value1 % 2).toBe(0);
});

test(`Result.unwrapForce`, () => {
  const result0 = succeedIfValueEven(0);
  const value0 = result0.unwrapForce();
  expect(value0).toBe(0);

  const result1 = succeedIfValueEven(1);
  expect(() => {
    result1.unwrapForce();
  }).toThrowError();

  try {
    result1.unwrapForce();
  } catch (err: any) {
    expect(err.message).toBe(`
  message: Error
  error: 1
`);
    expect(err.name).toBe(RnException._prefix);
    expect(err.getRnError()).toStrictEqual({
      message: 'Error',
      error: 1,
    });
  }
});

test(`Result.isOk`, () => {
  const result0 = succeedIfValueEven(0);
  expect(result0.isOk()).toBe(true);
  if (result0.isOk()) {
    expect(result0.get()).toBe(0);
  }
});

test(`wrapped Err`, () => {
  function wrapper(): Result<number, Err<number, number>> {
    const result0 = succeedIfValueEven(1);
    if (result0.isErr()) {
      return new Err({
        message: 'Error 2',
        error: result0,
      });
    }
    const one = result0.get();
    return new Ok(0);
  }

  const result = wrapper();
  result.unwrapWithCompensation((err) => {
    expect(err.message).toBe('Error 2');
    console.log(err.error.toString());
    return 0;
  });

  expect(() => {
    result.unwrapForce();
  }).toThrowError();
});
