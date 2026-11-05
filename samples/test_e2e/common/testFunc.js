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

// The reference images are generated in the CI environment (Ubuntu + Mesa
// llvmpipe/lavapipe, see config/e2e/Dockerfile). Runs on that platform compare
// strictly. Other platforms (macOS with a real GPU) render slightly differently
// (measured at up to ~1% on IBL samples), so they get a tolerance floor instead
// of failing on environment differences. Use `pnpm test-e2e:docker` when you
// need the strict, CI-identical check.
const IS_REFERENCE_ENVIRONMENT = process.env.E2E_REFERENCE_ENVIRONMENT !== '0' && process.platform === 'linux';
const NON_REFERENCE_FAILURE_THRESHOLD = Number(process.env.E2E_NON_REFERENCE_FAILURE_THRESHOLD ?? 2);

const resolveFailureThreshold = (threshold, noParam) => {
  const base = noParam ? DEFAULT_FAILURE_THRESHOLD : threshold;
  return IS_REFERENCE_ENVIRONMENT ? base : Math.max(base, NON_REFERENCE_FAILURE_THRESHOLD);
};

// Chromium only composites a WebGPU canvas on Linux when the GPU process has a
// GL context that can share memory with Vulkan ("WebGPU on Vulkan via GL
// interop"). That is why the E2E runner uses Mesa's llvmpipe + lavapipe on
// Linux (see vitest-puppeteer.config.js); with Chromium's default SwiftShader GL
// path the canvas stays blank and no shared-image backing can be created for it.
// Some environments still cannot provide that interop. When E2E_WEBGPU_SMOKE=1
// the WebGPU cases only verify that the sample reached its render loop instead
// of comparing screenshots.
const WEBGPU_SMOKE_ONLY = process.env.E2E_WEBGPU_SMOKE === '1';

/**
 * Returns true when the sample rendered through the WebGPU process approach.
 * A canvas that already owns a WebGPU context returns it from `getContext('webgpu')`,
 * while a canvas that owns a WebGL2 context returns null, so this detects the
 * rendering backend without knowing which sample is being tested.
 */
const isWebGpuCanvas = async page => {
  return page.evaluate(() => {
    const canvas = document.getElementById('world');
    return canvas != null && canvas.getContext('webgpu') != null;
  });
};

// jest-image-snapshot only rewrites snapshots that fail unless
// updatePassedSnapshot is set. `E2E_UPDATE_ALL_SNAPSHOTS=1` regenerates every
// reference image in the current environment (used by
// `config/e2e/run-in-docker.sh update`).
const UPDATE_ALL_SNAPSHOTS = process.env.E2E_UPDATE_ALL_SNAPSHOTS === '1';

/**
 * Compares a canvas screenshot with the stored snapshot using the shared pixel
 * threshold and failure threshold policy (including the software-rendering
 * tolerance). Test files that take screenshots themselves should use this
 * instead of calling `toMatchImageSnapshot` directly.
 */
export const matchCanvasImageSnapshot = (expect, image, threshold = 0, noParam = false) => {
  expect.extend({ toMatchImageSnapshot });
  expect(image).toMatchImageSnapshot({
    customDiffConfig: { threshold: SNAPSHOT_PIXEL_THRESHOLD },
    failureThreshold: resolveFailureThreshold(threshold, noParam),
    failureThresholdType: 'percent',
    updatePassedSnapshot: UPDATE_ALL_SNAPSHOTS,
  });
};

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

  if (WEBGPU_SMOKE_ONLY && (await isWebGpuCanvas(page))) {
    // The canvas cannot be captured on a GPU-less Linux host, so assert that the
    // sample reached its render loop instead of comparing pixels.
    const state = await page.evaluate(() => ({ rendered: window._rendered === true }));
    expect(state.rendered).toBe(true);
    console.warn(
      `[E2E] Skipped image comparison for ${url}: WebGPU canvases cannot be captured on this platform (set E2E_WEBGPU_SMOKE=0 on a machine with a real GPU to compare screenshots).`
    );
    await page.close();
    return;
  }

  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  matchCanvasImageSnapshot(expect, image, threshold, noParam);

  await page.close();
};

export const testCheckPtoDocument = async (browser, url, expect, threshold, noParam = false, consoleOn = false) => {
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
  matchCanvasImageSnapshot(expect, image, threshold, noParam);

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
