import {IResult, Ok, Err, RnError, RnException} from './Result';

function succeedIfValueEven(val: number): IResult<number, number> {
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
  let result = '';
  result0.match({
    Ok: (val: number) => {
      expect(val).toBe(0);
      result = result0.name();
    },
    Err: (err: RnError<number>) => {
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
    Err: (err: RnError<number>) => {
      expect(err.message).toBe('Error');
      result = result1.name();
    },
    Finally: () => {
      expect(result).toBe('Err');
    },
  });
});

test(`Result.unwrap`, () => {
  const result0 = succeedIfValueEven(0);
  const value0 = result0.unwrap((err: RnError<number>) => {
    expect(true).toBe(false); // If here come, this is wrong behavior.
  });
  expect(value0).toBe(0);

  const result1 = succeedIfValueEven(1);
  const value1 = result1.unwrap((err: RnError<number>) => {
    expect(err.message).toBe('Error');
  });
  expect(value1).toBeUndefined();
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
});

test(`wrapped Err`, () => {
  function wrapper(): IResult<number, Err<number, number>> {
    const result0 = succeedIfValueEven(1);
    if (result0.isErr()) {
      return new Err({
        message: 'Error 2',
        error: result0,
      });
    }
    return new Ok(0);
  }

  const result = wrapper();
  result.unwrap(err => {
    expect(err.message).toBe('Error 2');
    console.log(err.error.toString());
  });

  expect(() => {
    result.unwrapForce();
  }).toThrowError();
});

// test(`Ok.then, Ok.catch, Finalizer.finally`, () => {
//   {
//     const result0 = succeedIfValueEven(0);
//     const finalizerOfThen = result0.then((val: number) => {
//       expect(val).toBe(0);
//     }) as Finalizer;
//     const finalizerOfCatch = result0.catch((err: RnError<number>) => {
//       expect(true).toBe(false); // If here come, this is wrong behavior.
//     }) as Finalizer;

//     expect(finalizerOfThen).toBeInstanceOf(Finalizer);
//     expect(finalizerOfCatch).toBeUndefined();

//     finalizerOfThen.finally(() => {
//       expect(true).toBe(true);
//     });
//   }
//   {
//     const result1 = succeedIfValueEven(1);
//     const finalizerOfThen = result1.then((val: number) => {
//       expect(true).toBe(false); // If here come, this is wrong behavior.
//     }) as Finalizer;
//     const finalizerOfCatch = result1.catch((err: RnError<number>) => {
//       expect(err.message).toBe('Error');
//     }) as Finalizer;

//     expect(finalizerOfThen).toBeUndefined();
//     expect(finalizerOfCatch).toBeInstanceOf(Finalizer);

//     finalizerOfCatch.finally(() => {
//       expect(true).toBe(true);
//     });
//   }
// });
