test('regression test DataTextureInstancedDrawingWebGL2', async () => {
  jest.setTimeout(60000);
  const page = await browser.newPage();
  await page.goto('http://localhost:8082/test/e2e/DataTextureInstancedDrawingWebGL2');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 60000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
});
