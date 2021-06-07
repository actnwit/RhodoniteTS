test('regression test ColorGradingUsingLUTs', async () => {
  jest.setTimeout(600000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(600000);
  await page.goto('http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 600000 });
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  await page.goto('about:blank');
  await page.close();
});
