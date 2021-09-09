test('regression test EffekseerTest', async () => {
  jest.setTimeout(180000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(180000);
  await page.goto('http://localhost:8082/samples/test_e2e/EffekseerTest');
  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; i++) {
      // console.log(msg.args()[i]); // comment out if you check the browser side console out
    }
  });
  await page.setViewport({width: 1000, height: 1000});
  // await page.waitForSelector('p#rendered', {timeout: 180000});
  await page.waitForFunction(() => {return window._rendered}, {timeout: 180000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
  });

  await page.close();
});
