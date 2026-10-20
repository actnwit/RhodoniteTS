import { existsSync } from 'node:fs';

// Puppeteer 25 no longer accepts the legacy `headless: 'new'` value, so the
// boolean form is used to keep the browser running in the new headless mode.
const headless = true;

// Prefer a Chrome binary that was downloaded into this repository (e.g. with
// `PUPPETEER_CACHE_DIR=.cache/puppeteer pnpm exec puppeteer browsers install chrome`).
// Without it, Puppeteer falls back to its default browser resolution.
const localChromePaths = [
  '.cache/puppeteer/chrome/mac_arm-155.0.8059.79/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const localChromePath = localChromePaths.find((path) => existsSync(path));
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? localChromePath;

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
      '--disable-audio-output',
    ],
  },
};
