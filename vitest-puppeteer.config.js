export default {
  server: {
    command: 'node server.js',
    port: 8082, // jest-puppeteer waits until this port respond before starting the tests. 5000 is the default port of serve
    usedPortAction: 'error', // If the port is used, stop everything
    launchTimeout: 100000,
  },
  launch: {
    headless: 'new',
    devtools: false,
    protocolTimeout: 2000000,
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
