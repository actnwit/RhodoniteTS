test('regression test GltfImporter-draco-extension', async () => {
  jest.setTimeout(600000);
  const page = await browser.newPage();
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-draco-extension'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 600000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.1,
    failureThresholdType: 'percent',
  });

  await page.close();
});
