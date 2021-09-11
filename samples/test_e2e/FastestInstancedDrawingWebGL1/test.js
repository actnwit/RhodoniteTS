const testCheckWindowRendered = require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/FastestInstancedDrawingWebGL1';

test('regression test FastestInstancedDrawingWebGL1', async () => {

  await testCheckWindowRendered(jest,browser,SetURL,expect,0.03,true);
  /*
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto('http://localhost:8082/samples/test_e2e/FastestInstancedDrawingWebGL1');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(() => {return window._rendered}, {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();

  await page.close();
  */
});
