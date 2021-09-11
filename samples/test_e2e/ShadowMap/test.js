const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMap';

test('regression test ShadowMap', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.01,false,false);
  /*
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto('http://localhost:8082/samples/test_e2e/ShadowMap');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01, // To counteract the error in depth encode shader
    failureThresholdType: 'percent',
  });

  await page.close();
  */
});
