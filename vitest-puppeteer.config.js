import { existsSync } from 'node:fs';

// Puppeteer 25 no longer accepts the legacy `headless: 'new'` value, so the
// boolean form is used to keep the browser running in the new headless mode.
const headless = true;

// Prefer a Chrome binary that was downloaded into this repository (e.g. with
// `PUPPETEER_CACHE_DIR=.cache/puppeteer pnpm exec puppeteer browsers install chrome`).
// Without it, Puppeteer falls back to its default browser resolution, which is
// what CI relies on.
const localChromePaths = [
  '.cache/puppeteer/chrome/mac_arm-156.0.8078.47/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const localChromePath = localChromePaths.find((path) => existsSync(path));
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? localChromePath;

// GitHub Actions runners (and containers in general) have no GPU. On Linux the
// E2E run uses Mesa's software stack for both APIs:
//   * llvmpipe for GL/WebGL2 (via ANGLE's GL-EGL backend), and
//   * lavapipe for Vulkan, which the GPU process uses to allocate the WebGPU
//     swap chain image and share it with GL.
// That GL <-> Vulkan interop ("WebGPU on Vulkan via GL interop") is what makes
// WebGPU canvases present/capture correctly on Linux. With Chromium's default
// SwiftShader GL path the WebGPU canvas stays blank because no shared-image
// backing can be created for it, so these flags are not just a speed choice.
// lavapipe is blocklisted, hence --ignore-gpu-blocklist. Mesa's Vulkan driver
// must provide samplerYcbcrConversion (Mesa 25.x, which Ubuntu 24.04 ships,
// does; Mesa 22 does not).
const softwareRendering =
  process.env.E2E_SOFTWARE_RENDERING === '1' ||
  (process.env.E2E_SOFTWARE_RENDERING !== '0' && process.platform === 'linux');

const softwareRenderingArgs = softwareRendering
  ? [
      // Allow the SwiftShader WebGPU adapter when no hardware adapter exists,
      // and keep a software GL fallback if the system GL below cannot start.
      '--enable-unsafe-webgpu',
      '--enable-unsafe-swiftshader',
      // Use ANGLE over the system GL/EGL (Mesa llvmpipe) instead of SwANGLE, so
      // that the GPU process has a GL context that can share memory with Vulkan.
      '--use-gl=angle',
      '--use-angle=gl-egl',
      // lavapipe (software Vulkan) is on Chromium's blocklist.
      '--ignore-gpu-blocklist',
    ]
  : [];

export default {
  server: {
    command: 'node server.js',
    port: 8082, // jest-puppeteer waits until this port respond before starting the tests. 5000 is the default port of serve
    usedPortAction: 'error', // If the port is used, stop everything
    launchTimeout: 100000,
  },
  launch: {
    headless,
    devtools: false,
    protocolTimeout: 2000000,
    ...(executablePath ? { executablePath } : {}),
    // dumpio: true,
    // executablePath: "/Applications/Chromium.app/Contents/MacOS/Chromium", // Try this if you got error in Mac
    // executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // Try this if you got error in Mac
    // You can get Chromium for MacOS on the following:
    // - https://chromium.woolyss.com/download/#mac
    // - https://github.com/macchrome/macstable/releases

    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-audio-output',
      ...softwareRenderingArgs,
    ],
  },
};
