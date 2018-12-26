test('regression test', async () => {
  jest.setTimeout(60000);
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/test/e2e/DataTextureInstancedDrawing');
  await page.waitForSelector('p', {timeout: 15000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
});
