import { Option, None, Some } from './Option';
test('unwrapOrDefault', () => {
  const val0: Option<number> = new Some(0);
  expect(val0.unwrapOrDefault(1)).toEqual(0);

  const val1: Option<number> = new None();
  expect(val1.unwrapOrDefault(1)).toEqual(1);
});

test('unwrapOrUndefined', () => {
  const val0: Option<number> = new Some(0);
  expect(val0.unwrapOrUndefined()).toEqual(0);

  const val1: Option<number> = new None();
  expect(val1.unwrapOrUndefined()).toEqual(undefined);
});

test('unwrapOrElse', () => {
  const val0: Option<number> = new Some(0);
  expect(
    val0.unwrapOrElse(() => {
      return 100;
    })
  ).toEqual(0);

  const val1: Option<number> = new None();
  expect(
    val1.unwrapOrElse(() => {
      return 1;
    })
  ).toEqual(1);
});

test('unwrapForce', () => {
  const val0: Option<number> = new Some(0);
  expect(val0.unwrapForce()).toEqual(0);

  const val1: Option<number> = new None();
  expect(() => {
    // throw error
    val1.unwrapForce();
  }).toThrowError(ReferenceError);
});

test('has and get', () => {
  const val0: Option<number> = new Some(0);
  expect(val0.has()).toBe(true);

  const val1: Option<number> = new None();
  expect(val1.has()).toBe(false);

  const val2: Option<number> = new Some(1);
  if (val2.has()) {
    expect(val2.get()).toEqual(1);
  } else {
    fail('val2 should have a value');
  }
});

test('doesNotHave', () => {
  const val0: Option<number> = new Some(0);
  expect(val0.doesNotHave()).toBe(false);

  const val1: Option<number> = new None();
  expect(val1.doesNotHave()).toBe(true);

  const val2: Option<number> = new None();
  if (val2.doesNotHave()) {
    expect(val2.has()).toBe(false);
  } else {
    fail('val2 should not have a value');
  }
});

test('Basic usage of Some and None', () => {
  class Hit {}

  const funcUsingSomeAndNone = (val: number): Option<Hit> => {
    if (val % 2 === 0) {
      // return hit object for even numbers
      return new Some(new Hit());
    } else {
      // return nothing for odd numbers
      return new None();
    }
  };

  const result0: Option<Hit> = funcUsingSomeAndNone(0); // Some
  const result1: Option<Hit> = funcUsingSomeAndNone(1); // None
  expect(result0.unwrapForce().constructor.name).toBe(Hit.name);
  expect(() => {
    result1.unwrapForce().constructor.name;
  }).toThrowError(ReferenceError);
});

test('An IOption variable can be replaced by Some', () => {
  let val: Option<number> = new None();
  val = new Some(10);
  const valRaw = val.unwrapForce();

  expect(valRaw).toEqual(10);
});

test('then(func)', () => {
  const val0 = new Some(0);
  val0.then((val) => {
    expect(val).toEqual(0);
    return new Some(1);
  });
});

test('const var = then(func)', () => {
  const val0 = new Some(0);
  const val1 = val0.then((val) => {
    return new Some(val);
  });
  expect(val1.has()).toBe(true);

  const none = new None();
  const none2 = none.then((val) => {
    return new Some(val); // this is not executed
  });
  expect(none2.doesNotHave()).toBe(true);
});

test('then<T>', () => {
  const val0 = new Some(0);
  const val1 = val0.then<string>((_val) => {
    return new Some('exist!');
  });
  expect(val1.unwrapForce()).toEqual('exist!');
});

test('else(func)', () => {
  const val0 = new None();
  val0.else(() => {
    return new None();
  });
});

test('const var = else(func)', () => {
  const val0 = new None();
  const val1 = val0.else(() => {
    return new Some(1);
  });
  expect(val1.has()).toBe(true);

  const none = new None();
  const none2 = none.else(() => {
    return new Some(1); // this is not executed
  });
  expect(none2.unwrapForce()).toEqual(1);
});

test('then(func).else(func)', () => {
  {
    const some = new Some(0);
    const val = some
      .then((val) => {
        expect(val).toEqual(0);
        return new None();
      })
      .else(() => {
        return new Some(1);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
  {
    const none = new None();
    const val = none
      .then(() => {
        console.error('this is not executed');
        return new None();
      })
      .else(() => {
        return new Some(1);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
  {
    const none = new None();
    const val = none
      .then(() => {
        console.error('this is not executed. because a none.then() just returns the none itself');
        return new None();
      })
      .else(() => {
        // nothing to do
        // none.else() returns the none itself
        return new None();
      });
    expect(val.doesNotHave()).toBe(true);
  }
});

test('else(func).then(func)', () => {
  {
    const some = new Some(0);
    const val = some
      .else(() => {
        console.error('this is not executed');
        return new Some(1);
      })
      .then((val) => {
        expect(val).toEqual(0); // do something with the original value
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(0);
  }
  {
    const none = new None();
    const val = none
      .else(() => {
        return new Some(1); // recover
      })
      .then((val) => {
        expect(val).toEqual(1); // do something with the recovered value
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
});

test('then(func).else(func) with return value', () => {
  {
    const some = new Some(0);
    const val = some
      .then((val) => {
        // this is executed because a some.then() does the received function
        expect(val).toEqual(0);
        return new Some(val);
      })
      .else(() => {
        console.error(
          'this is not executed. because the Some(val).else() just returns the Some(val) itself but execute received function.'
        );
        return new Some(1);
      });
    expect(val.unwrapForce()).toEqual(0);
  }
  {
    const none = new None();
    const val = none
      .then((val) => {
        console.error(
          'this is not executed. because a none.then() just returns the none itself but execute received function.'
        );
        expect(val).toEqual(0);
        return new Some(val);
      })
      .else(() => {
        return new Some(1); // this is executed because a none.else() execute the received function
      });
    expect(val.unwrapForce()).toEqual(1);
  }
});

test('else(func).then(func) with return value', () => {
  {
    const some = new Some(0);
    const val = some
      .else(() => {
        console.error('this is not executed');
        return new Some(1); // recover
      })
      .then((val) => {
        expect(val).toEqual(0); // do something with the original value
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(0);
  }
  {
    const none = new None();
    const val = none
      .else(() => {
        return new Some(1); // recover
      })
      .then((val) => {
        expect(val).toEqual(1); // do something with the recovered value
        return new Some(val);
      });
    expect(val.unwrapForce()).toEqual(1);
  }
});

test('match', () => {
  const some = new Some(0);
  const val = some.match({
    Some: (val) => {
      expect(val).toEqual(0);
    },
    None: () => {
      fail('this is not executed');
    },
  });
  expect(val).toBeUndefined();

  const none = new None();
  const val2 = none.match({
    Some: (_val) => {
      fail('this is not executed');
    },
    None: () => {
      expect(none.doesNotHave()).toBe(true);
    },
  });
  expect(val2).toBeUndefined();
});

test('match with return value', () => {
  const some = new Some(0);
  const val = some.match({
    Some: (val) => val,
    None: () => 1,
  });
  expect(val).toEqual(0);

  const none = new None();
  const val2 = none.match({
    Some: (val) => val,
    None: () => 1,
  });
  expect(val2).toEqual(1);
});

test('match<T> with return value', () => {
  const some = new Some(0);
  const val = some.match({
    Some: (_val) => 'exist!',
    None: () => 'none',
  });
  expect(val).toEqual('exist!');

  const none = new None();
  const val2 = none.match({
    Some: (_val) => 'exist!',
    None: () => 'none',
  });
  expect(val2).toEqual('none');
});
