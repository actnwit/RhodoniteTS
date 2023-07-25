const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/AnimationBlending';

test('regression test Animation Blending', async () => {
  await testCheckWindowRendered(jest, browser, SetURL, expect, 0.01);
});
