import { consoleLog } from '../common/testFunc';
import { testCheckWindowRendered } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/WebGpuSimple';

test('regression test WebGpuSimple', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.03, false, false);
});
