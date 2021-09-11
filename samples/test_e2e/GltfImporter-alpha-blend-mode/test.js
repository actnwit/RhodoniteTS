const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-alpha-blend-mode';

test('regression test GltfImporter-alpha-blend-mode', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03,false,false);
  /*
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-alpha-blend-mode'
  );
  await page.setViewport({width: 1000, height: 400});
  await page.waitForSelector('p#rendered', {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
  });

  await page.close();
  */
});
