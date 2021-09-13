const testCheckWindowRendered = require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/FastestInstancedDrawingWebGL1';

test('regression test FastestInstancedDrawingWebGL1', async () => {

  await testCheckWindowRendered(jest,browser,SetURL,expect,0.03,true);

});
