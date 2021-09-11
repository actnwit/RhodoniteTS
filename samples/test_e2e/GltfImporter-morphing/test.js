const testCheckWindowRendered = require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-morphing';


test('regression test GltfImporter-morphing', async () => {

  await testCheckWindowRendered(jest,browser,SetURL,expect,0.01,false,false);
  /*
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-morphing'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(() => {return window._rendered}, {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
  });

  await page.close();
  */
});
