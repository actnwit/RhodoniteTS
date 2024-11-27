import { IOption, None, Some } from './Option';
test('unwrapOrDefault', () => {
  const val0: IOption<number> = new Some(0);
  expect(val0.unwrapOrDefault(1)).toEqual(0);

  const val1: IOption<number> = new None();
  expect(val1.unwrapOrDefault(1)).toEqual(1);
});

test('unwrapOrUndefined', () => {
  const val0: IOption<number> = new Some(0);
  expect(val0.unwrapOrUndefined()).toEqual(0);

  const val1: IOption<number> = new None();
  expect(val1.unwrapOrUndefined()).toEqual(undefined);
});

test('unwrapOrElse', () => {
  const val0: IOption<number> = new Some(0);
  expect(
    val0.unwrapOrElse(() => {
      return 100;
    })
  ).toEqual(0);

  const val1: IOption<number> = new None();
  expect(
    val1.unwrapOrElse(() => {
      return 1;
    })
  ).toEqual(1);
});

test('unwrapForce', () => {
  const val0: IOption<number> = new Some(0);
  expect(val0.unwrapForce()).toEqual(0);

  const val1: IOption<number> = new None();
  expect(() => {
    // throw error
    val1.unwrapForce();
  }).toThrowError(ReferenceError);
});

test('has and get', () => {
  const val0: IOption<number> = new Some(0);
  expect(val0.has()).toBe(true);

  const val1: IOption<number> = new None();
  expect(val1.has()).toBe(false);

  const val2: IOption<number> = new Some(1);
  if (val2.has()) {
    expect(val2.get()).toEqual(1);
  } else {
    fail('val2 should have a value');
  }
});

test('doesNotHave', () => {
  const val0: IOption<number> = new Some(0);
  expect(val0.doesNotHave()).toBe(false);

  const val1: IOption<number> = new None();
  expect(val1.doesNotHave()).toBe(true);

  const val2: IOption<number> = new None();
  if (val2.doesNotHave()) {
    expect(val2.has()).toBe(false);
  } else {
    fail('val2 should not have a value');
  }
});

test('Basic usage of Some and None', () => {
  class Hit {}

  const funcUsingSomeAndNone = (val: number): IOption<Hit> => {
    if (val % 2 === 0) {
      // return hit object for even numbers
      return new Some(new Hit());
    } else {
      // return nothing for odd numbers
      return new None();
    }
  };

  const result0: IOption<Hit> = funcUsingSomeAndNone(0); // Some
  const result1: IOption<Hit> = funcUsingSomeAndNone(1); // None
  expect(result0.unwrapForce().constructor.name).toBe(Hit.name);
  expect(() => {
    result1.unwrapForce().constructor.name;
  }).toThrowError(ReferenceError);
});

test('An IOption variable can be replaced by Some', () => {
  let val: IOption<number> = new None();
  val = new Some(10);
  const valRaw = val.unwrapForce();

  expect(valRaw).toEqual(10);
});

test('then(func)', () => {
  const val0: IOption<number> = new Some(0);
  val0.then((val) => {
    expect(val).toEqual(0);
  });
});

test('const var = then(func)', () => {
  const val0: IOption<number> = new Some(0);
  const val1: IOption<number> = val0.then((val) => {
    return new Some(val);
  });
  expect(val1.has()).toBe(true);

  const none: IOption<number> = new None();
  const none2: IOption<number> = none.then((val) => {
    return new Some(val); // this is not executed
  });
  expect(none2.doesNotHave()).toBe(true);
});

test('then<T>', () => {
  const val0: IOption<number> = new Some(0);
  const val1: IOption<string> = val0.then<string>((_val) => {
    return new Some('exist!');
  });
  expect(val1.unwrapForce()).toEqual('exist!');
});

test('else(func)', () => {
  const val0: IOption<number> = new None();
  val0.else(() => {
    expect(val0.doesNotHave()).toBe(true);
  });
});

test('const var = else(func)', () => {
  const val0: IOption<number> = new None();
  const val1: IOption<number> = val0.else(() => {
    return new Some(1);
  });
  expect(val1.has()).toBe(true);

  const none: IOption<number> = new Some(0);
  const none2: IOption<number> = none.else(() => {
    return new Some(1); // this is not executed
  });
  expect(none2.unwrapForce()).toEqual(0);
});

test('then(func).else(func)', () => {
  {
    const some: IOption<number> = new Some(0);
    const val = some
      .then((val) => {
        expect(val).toEqual(0);
        return new Some(val);
      })
      .else(() => {
        return new Some(1);
      });
    expect(val.unwrapForce()).toEqual(0);
  }
  {
    const none: IOption<number> = new None();
    const val = none
      .then((val) => {
        expect(val).toEqual(0);
        return new Some(val);
      })
      .else(() => {
        return new Some(1);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
});

test('else(func).then(func)', () => {
  {
    const some: IOption<number> = new Some(0);
    const val = some
      .else(() => {
        return new Some(1);
      })
      .then((val) => {
        expect(val).toEqual(0);
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(0);
  }
  {
    const none: IOption<number> = new None();
    const val = none
      .else(() => {
        return new Some(1);
      })
      .then((val) => {
        expect(val).toEqual(1);
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
});
