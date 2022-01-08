import {IResult, Ok, Err, Finalizer} from './Result';

function succeedIfValueEven(val: number): IResult<number, string> {
  if (val % 2 === 0) {
    return new Ok(val);
  } else {
    return new Err('Error');
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
});

test(`Result.${Ok.prototype.getBoolean.name}`, () => {
  const result0 = succeedIfValueEven(0);
  expect(result0.getBoolean()).toBe(true);
});

test(`${Ok.name}.${Ok.prototype.then.name}, ${Ok.name}.${Ok.prototype.catch.name}, ${Finalizer.name}.${Finalizer.prototype.finally.name}`, () => {
  {
    const result0 = succeedIfValueEven(0);
    const finalizerOfThen = result0.then((val: number) => {
      expect(val).toBe(0);
    }) as Finalizer;
    const finalizerOfCatch = result0.catch((err: string) => {
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
    const finalizerOfCatch = result1.catch((err: string) => {
      expect(err).toBe('Error');
    }) as Finalizer;

    expect(finalizerOfThen).toBeUndefined();
    expect(finalizerOfCatch).toBeInstanceOf(Finalizer);

    finalizerOfCatch.finally(() => {
      expect(true).toBe(true);
    });
  }
});
