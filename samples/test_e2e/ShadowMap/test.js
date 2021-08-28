test('regression test ShadowMap', async () => {
  jest.setTimeout(180000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(180000);
  await page.goto('http://localhost:8082/samples/test_e2e/ShadowMap');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 180000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01, // To counteract the error in depth encode shader
    failureThresholdType: 'percent',
  });

  await page.close();
});
