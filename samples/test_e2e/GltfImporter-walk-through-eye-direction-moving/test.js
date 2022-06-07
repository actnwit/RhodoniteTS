test('regression test GltfImporter-walk-through-eye-direction-moving', async () => {

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-walk-through-eye-direction-moving'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 500000});

  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.move(0, 100);
  await page.mouse.up();

  await page.waitForSelector('p#moved', {timeout: 10000});

  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01,
    failureThresholdType: 'percent',
  });

  await page.close();
});
