test('regression test DataTextureInstancedDrawingWebGL1', async () => {
  jest.setTimeout(600000);
  const page = await browser.newPage();
  await page.goto('http://localhost:8082/samples/test_e2e/FastestInstancedDrawingWebGL1');
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(() => {return window._rendered});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();

  await page.close();
});
