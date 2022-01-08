import {IResult, Ok, Err, Finalizer, RnError, RnException} from './Result';

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

test(`Result.${Ok.prototype.match.name}`, () => {
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

test(`Result.${Ok.prototype.unwrap.name}`, () => {
  const result0 = succeedIfValueEven(0);
  expect(
    result0.unwrap((err: RnError<number>) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
    })
  ).toBe(0);
  const result1 = succeedIfValueEven(1);
  expect(
    result1.unwrap((err: RnError<number>) => {
      expect(err.message).toBe('Error');
    })
  ).toBeUndefined();
});

test(`Result.${Ok.prototype.unwrapForce.name}`, () => {
  const result0 = succeedIfValueEven(0);
  expect(result0.unwrapForce()).toBe(0);

  const result1 = succeedIfValueEven(1);
  expect(() => {
    result1.unwrapForce();
  }).toThrowError();

  try {
    result1.unwrapForce();
  } catch (err) {
    expect(err.message).toBe('Error');
    expect(err.name).toBe(RnException._prefix);
    expect(err.getRnError()).toStrictEqual({
      message: 'Error',
      error: 1,
    });
  }
});

test(`Result.${Ok.prototype.isOk.name}`, () => {
  const result0 = succeedIfValueEven(0);
  expect(result0.isOk()).toBe(true);
});

test(`${Ok.name}.${Ok.prototype.then.name}, ${Ok.name}.${Ok.prototype.catch.name}, ${Finalizer.name}.${Finalizer.prototype.finally.name}`, () => {
  {
    const result0 = succeedIfValueEven(0);
    const finalizerOfThen = result0.then((val: number) => {
      expect(val).toBe(0);
    }) as Finalizer;
    const finalizerOfCatch = result0.catch((err: RnError<number>) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
    }) as Finalizer;

    expect(finalizerOfThen).toBeInstanceOf(Finalizer);
    expect(finalizerOfCatch).toBeUndefined();

    finalizerOfThen.finally(() => {
      expect(true).toBe(true);
    });
  }
  {
    const result1 = succeedIfValueEven(1);
    const finalizerOfThen = result1.then((val: number) => {
      expect(true).toBe(false); // If here come, this is wrong behavior.
    }) as Finalizer;
    const finalizerOfCatch = result1.catch((err: RnError<number>) => {
      expect(err.message).toBe('Error');
    }) as Finalizer;

    expect(finalizerOfThen).toBeUndefined();
    expect(finalizerOfCatch).toBeInstanceOf(Finalizer);

    finalizerOfCatch.finally(() => {
      expect(true).toBe(true);
    });
  }
});
