test('regression test GltfImporter-orbit-moving', async () => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/GltfImporter-orbit-moving'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 450000});

  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.move(300, 0);
  await page.mouse.move(300, 10);
  await page.mouse.up();

  await page.waitForSelector('p#moved', {timeout: 450000});

  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.005,
    failureThresholdType: 'percent',
  });

  await page.close();
});
