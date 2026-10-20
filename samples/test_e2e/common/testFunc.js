import { toMatchImageSnapshot } from 'jest-image-snapshot';

export const testFunc = async (browser, _url, expect) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto('http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 2000000 });
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  await page.goto('about:blank');
  await page.close();
};

export const consoleLog = async page => {
  page.on('console', async msg => {
    const lines = [];
    for (let i = 0; i < msg.args().length; i++) {
      const value = await msg.args()[i].jsonValue();
      lines.push(value);
    }
    console.log(lines.join('\n')); // comment out if you check the browser side console out
  });
};

const waitForExtraFrames = async (page, frameCount = 5) => {
  await page.evaluate(async count => {
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    }
  }, frameCount);
};

// Pixel level sensitivity and failure threshold used when comparing screenshots
// with the stored snapshots. They mirror the defaults of jest-image-snapshot and
// make the tolerance explicit instead of relying on the library defaults.
const SNAPSHOT_PIXEL_THRESHOLD = 0.01;
const DEFAULT_FAILURE_THRESHOLD = 0;

export const testCheckWindowRendered = async (browser, url, expect, threshold, noParam = false, consoleOn = false) => {
  expect.extend({ toMatchImageSnapshot });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(url);
  if (consoleOn) {
    this.consoleLog(page);
  }
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForFunction(
    () => {
      return window._rendered;
    },
    { timeout: 2000000 }
  );
  // Samples set `_rendered` on the second frame, so let a few extra frames pass to
  // make sure the screenshot captures a fully converged image.
  await waitForExtraFrames(page);
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    customDiffConfig: { threshold: SNAPSHOT_PIXEL_THRESHOLD },
    failureThreshold: noParam ? DEFAULT_FAILURE_THRESHOLD : threshold,
    failureThresholdType: 'percent',
  });

  await page.close();
};

export const testCheckPtoDocument = async (browser, url, expect, threshold, noParam = false, consoleOn = false) => {
  expect.extend({ toMatchImageSnapshot });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(url);
  if (consoleOn) {
    this.consoleLog(page);
  }
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 2000000 });
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot({
    customDiffConfig: { threshold: SNAPSHOT_PIXEL_THRESHOLD },
    failureThreshold: noParam ? DEFAULT_FAILURE_THRESHOLD : threshold,
    failureThresholdType: 'percent',
  });

  await page.close();
};

export const defineTest = (name, mode, errorThreshold) => {
  const url = `http://localhost:8082/samples/test_e2e/${name}?mode=${mode}`;
  test(`${name} ${mode}`, async () => {
    await testCheckWindowRendered(browser, url, expect, errorThreshold, true);
  });
};

export const doTests = (name, modes, errorThreshold = 0.03) => {
  for (const mode of modes) {
    defineTest(name, mode, errorThreshold);
  }
};

export const defineGltfTest = (name, mode, gltfName, gltfFormat, errorThreshold) => {
  const url = `http://localhost:8082/samples/test_e2e/${name}?mode=${mode}&gltf=${gltfName}&gltfformat=${gltfFormat}`;
  test(`${name} ${gltfName} ${mode}`, async () => {
    await testCheckWindowRendered(browser, url, expect, errorThreshold, true);
  });
};

export const doGltfTests = (name, modes, gltfInfo, errorThreshold = 0.03) => {
  for (const gltf of gltfInfo) {
    for (const mode of modes) {
      defineGltfTest(name, mode, gltf.name, gltf.format, errorThreshold);
    }
  }
};
