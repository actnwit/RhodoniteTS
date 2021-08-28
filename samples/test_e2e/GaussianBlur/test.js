test('regression test GaussianBlur', async () => {
  jest.setTimeout(180000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(180000);
  await page.goto('http://localhost:8082/samples/test_e2e/GaussianBlur');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 180000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  await page.goto('about:blank');
  await page.close();
});
