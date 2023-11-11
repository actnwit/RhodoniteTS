import { test, expect } from '@playwright/test';
import sampleList from './sample-list.json';

declare const window: any;

sampleList.test_e2e.forEach((sample) => {
  test(`example test ${sample}`, async ({ page }) => {
    await page.goto(`http://localhost:8082/samples/test_e2e/${sample}/index.html`);
    // await page.waitForSelector('p#rendered');
    await page.waitForFunction(() => window._rendered);
    const canvasElement = await page.$('canvas');

    // console.log(sampleList);

    expect(await canvasElement!.screenshot()).toMatchSnapshot({
      maxDiffPixelRatio: 0.05,
    });
  });
});

// test(`example test `, async ({ page }) => {
//   await page.goto(`http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs/index.html`);
//   // await page.waitForSelector('p#rendered');
//   await page.waitForFunction(() => window._rendered);
//   const canvasElement = await page.$('canvas');

//   expect(await canvasElement!.screenshot()).toMatchSnapshot();
// });
