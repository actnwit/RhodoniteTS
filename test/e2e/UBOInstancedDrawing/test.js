test('regression test UBOInstancedDrawing', async () => {
  jest.setTimeout(60000);
  const page = await browser.newPage();
  await page.goto('http://localhost:8082/test/e2e/UBOInstancedDrawing');
  await page.waitForSelector('p#rendered', {timeout: 60000});
  const canvasElement = await page.$('#world');
  //await page.waitFor(4000);
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
});
