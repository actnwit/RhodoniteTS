const consoleLog = require('../common/testFunc').consoleLog;
const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/WebGpuGltf';

test('regression test WebGpuGltf', async () => {
  await testCheckWindowRendered(
    jest,
    browser,
    SetURL,
    expect,
    0.03,
    false,
    false
  );
});
