import {RnPromise, CallbackObj} from './RnPromise';

test('works with RnPromise.all', () => {
  const p1 = RnPromise.resolve(1);
  const p2 = RnPromise.resolve(2);
  const p3 = RnPromise.resolve(3);

  RnPromise.all([p1, p2, p3]).then((results: any) => {
    // console.log(results); // [1, 2, 3]
    expect(results).toEqual([1, 2, 3]);
  });
});

test('works with Promise.all', () => {
  const p1 = RnPromise.resolve(1);
  const p2 = RnPromise.resolve(2);
  const p3 = RnPromise.resolve(3);

  Promise.all([p1, p2, p3]).then((results: any) => {
    // console.log(results); // [1, 2, 3]
    expect(results).toEqual([1, 2, 3]);
  });
});

test('RnPromise.resolve of thenable', () => {
  const thenable = {
    then: function (resolve: any) {
      resolve('Resolving');
    },
  };
  const p1 = RnPromise.resolve(thenable);

  RnPromise.all([p1]).then((results: any) => {
    // console.log(results);
    expect(results).toEqual(['Resolving']);
  });
});

test('RnPromise.resolve of resolving rnPromise', () => {
  const rnPromise = new RnPromise((resolve, reject) => {
    resolve('resolve');
  });
  const p1 = RnPromise.resolve(rnPromise);

  RnPromise.all([p1])
    .then((results: any) => {
      // console.log(results);
      expect(results).toEqual(['resolve']);
    })
    .catch((results: any) => {
      // console.log(results);
    })
    .finally(() => {});
});

test('RnPromise.resolve of rejecting rnPromise', () => {
  const rnPromise = new RnPromise((resolve, reject) => {
    reject('reject');
  });
  const p1 = RnPromise.resolve(rnPromise);

  RnPromise.all([p1])
    .then((results: any) => {
      // console.log(results);
    })
    .catch((results: any) => {
      // console.log(results);
      expect(results).toEqual('reject');
    })
    .finally(() => {});
});

test('works with Promise.all callback', () => {
  const p1 = RnPromise.resolve(1);
  const p2 = RnPromise.resolve(2);
  const p3 = RnPromise.resolve(3);

  let count = 0;
  const callback = (obj: CallbackObj) => {
    console.log(obj);
    expect(obj.resolvedNum).toEqual(Math.min(++count, 3));
  };

  RnPromise.allWithProgressCallback([p1, p2, p3], callback).then(
    (results: any) => {
      expect(results).toEqual([1, 2, 3]);
      p1.then(() => {});
    }
  );
});
