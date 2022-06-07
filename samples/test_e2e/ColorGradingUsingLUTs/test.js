
test('regression test ColorGradingUsingLUTs', async () => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 2000000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  await page.goto('about:blank');
  await page.close();
});
