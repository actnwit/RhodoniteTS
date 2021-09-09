test('regression test FurnaceTest-whiteFurnace', async () => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto('http://localhost:8082/samples/test_e2e/FurnaceTest-whiteFurnace');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 2,
    failureThresholdType: 'percent'
  });
  await page.goto('about:blank');
  await page.close();
});
