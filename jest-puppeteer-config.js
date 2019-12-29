module.exports = {
  server: {
    command: 'node server.js',
    port: 8082, // jest-puppeteer waits until this port respond before starting the tests. 5000 is the default port of serve
    usedPortAction: 'error', // If the port is used, stop everything
    launchTimeout: 5000, // Wait 5 secs max before timing out
  },
  launch: {
    headless: false,
    devtools: false,

    // executablePath: "/usr/bin/chromium-browser",

    args: ["--start-maximized", "--no-sandbox"],
  },
};
