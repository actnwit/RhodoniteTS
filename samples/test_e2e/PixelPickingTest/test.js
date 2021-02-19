test('regression test PixelPickingTest', async () => {
  jest.setTimeout(600000);
  const page = await browser.newPage();
  await page.goto('http://localhost:8082/samples/test_e2e/PixelPickingTest');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 600000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  const windowHandle = await page.evaluateHandle(() => window);
  const valueHandle = await windowHandle.getProperty('_pickedEntityUID');
  expect(await valueHandle.jsonValue()).toBe(3);
  await page.goto('about:blank');
  await page.close();
});
