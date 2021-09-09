test('regression test MatCap', async () => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.goto('http://localhost:8082/samples/test_e2e/MatCap');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent'
  });
  await page.goto('about:blank');
  await page.close();
});
