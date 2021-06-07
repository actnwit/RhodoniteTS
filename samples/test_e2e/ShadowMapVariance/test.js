test('regression test ShadowMapVariance', async () => {
  jest.setTimeout(60000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(600000);
  await page.goto('http://localhost:8082/samples/test_e2e/ShadowMapVariance');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 60000 });
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
      failureThreshold: 0.005,
      failureThresholdType: 'percent'
    });
    await page.goto('about:blank');
    await page.close();
});
