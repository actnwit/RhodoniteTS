module.exports = {
  server: {
    command: 'npx http-server -p 8082',
    port: 8082, // jest-puppeteer waits until this port respond before starting the tests. 5000 is the default port of serve
    usedPortAction: 'error', // If the port is used, stop everything
    launchTimeout: 5000, // Wait 5 secs max before timing out
  },
  launch: {
    // デバッグ時は以下をuncommentします
    // headless: false,
    devtools: false,

    // デフォルトのChromiumで動かない機能がある場合はChromeの実行ファイルパスを渡すこともできます
    // executablePath: "/usr/bin/google-chrome-stable",

    // 必要に応じて引数を渡します
    args: ["--start-maximized", "--no-sandbox"],
  },
};
