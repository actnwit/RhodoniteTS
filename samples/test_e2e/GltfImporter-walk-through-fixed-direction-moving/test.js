test('regression test GltfImporter-walk-through-fixed-direction-moving', async () => {

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-walk-through-fixed-direction-moving'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#moved', {timeout: 2000000});

  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
  });

  await page.close();
});
