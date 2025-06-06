import { toMatchImageSnapshot } from 'jest-image-snapshot';
expect.extend({ toMatchImageSnapshot });

test('regression test GltfImporter-ibl-2', async () => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto('http://localhost:8082/samples/test_e2e/GltfImporter-ibl-2');
  await page.setViewport({ width: 1000, height: 1000 });

  await page.waitForSelector('p#started', { timeout: 2000000 });

  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.move(0, -50);
  await page.mouse.move(-50, -50);
  await page.mouse.up();

  await page.waitForSelector('p#rendered', { timeout: 2000000 });
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
  });

  await page.close();
});
