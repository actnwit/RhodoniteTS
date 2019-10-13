import RnPromise from "./RnPromise";

test('Promise.', async () => {
  new Promise((resolve)=> {
    const p1 = RnPromise.resolve(1);
    const p2 = RnPromise.resolve(2);
    const p3 = RnPromise.resolve(3);

    Promise.all([p1, p2, p3]).then((results) => {
      console.log(results);  // [1, 2, 3]
      expect(results).toEqual([1, 2, 3]);
      resolve();
    });
  });
});

test('RnPromise.resolve of thenable', async () => {
  new Promise((resolve)=> {
    var thenable = { then: function(resolve: any) {
      resolve("Resolving");
    }};
    const p1 = RnPromise.resolve(thenable);

    Promise.all([p1]).then((results) => {
      console.log(results);
      expect(results).toEqual(['Resolving']);
      resolve();
    });
  });
});

test('RnPromise.resolve of thenable', async () => {
  new Promise((resolve)=> {
    const rnPromise = new RnPromise((resolve, reject) => {
      resolve('resolve');
      reject('reject')
    });
    const p1 = RnPromise.resolve(rnPromise);

    Promise.all([p1]).then((results) => {
      console.log(results);
      expect(results).toEqual(['resolve']);
    }).catch((results) => {
      expect(results).toEqual(['reject']);
    }).finally(()=>{
      resolve();
    });
  });
});
