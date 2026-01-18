import { toMatchImageSnapshot } from 'jest-image-snapshot';

const SetURL = 'http://localhost:8082/samples/test_e2e/MultiEngines';

const testCheckPtoDocument = async (
  canvasSelector,
  browser,
  url,
  expect,
  threshold,
  noParam = false,
  consoleOn = false
) => {
  expect.extend({ toMatchImageSnapshot });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(url);
  if (consoleOn) {
    this.consoleLog(page);
  }
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector(`p#rendered_${canvasSelector.replace('#', '')}`, { timeout: 2000000 });
  const canvasElement = await page.$(canvasSelector);
  const image = await canvasElement.screenshot();
  if (noParam) {
    expect(image).toMatchImageSnapshot();
  } else {
    expect(image).toMatchImageSnapshot({
      failureThreshold: threshold,
      failureThresholdType: 'percent',
    });
  }

  await page.close();
};

test('regression test MultiEngines 1', async () => {
  await testCheckPtoDocument('#world1', browser, SetURL, expect, 0.03);
});

test('regression test MultiEngines 2', async () => {
  await testCheckPtoDocument('#world2', browser, SetURL, expect, 0.03);
});
