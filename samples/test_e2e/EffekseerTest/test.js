const consoleLog = require('../common/testFunc').consoleLog;
const test01 = require('../common/testFunc').test01;
const SetURL = 'http://localhost:8082/samples/test_e2e/EffekseerTest';

test('regression test EffekseerTest', async () => {
  await test01(jest,browser,SetURL,expect);
  /*
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto('http://localhost:8082/samples/test_e2e/EffekseerTest');
  consoleLog(page);
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(() => {return window._rendered}, {timeout: 450000});
  // await page.waitForTimeout(8000);
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
  });

  await page.close();
  */
  
});
