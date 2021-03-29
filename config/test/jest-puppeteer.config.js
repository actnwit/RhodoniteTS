module.exports = {
  server: {
    command: 'node server.js',
    port: 8082, // jest-puppeteer waits until this port respond before starting the tests. 5000 is the default port of serve
    usedPortAction: 'error', // If the port is used, stop everything
    launchTimeout: 10000, // Wait 5 secs max before timing out
  },
  launch: {
    headless: true,
    devtools: false,
    // dumpio: true,

    args: ["--start-maximized", "--no-sandbox", "--disable-gpu"],
  },
};
