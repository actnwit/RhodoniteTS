module.exports = {
  launch: {
    // デバッグ時は以下をuncommentします
    headless: false,

    // デフォルトのChromiumで動かない機能がある場合はChromeの実行ファイルパスを渡すこともできます
    // executablePath: "/usr/bin/google-chrome-stable",

    // 必要に応じて引数を渡します
    args: ["--start-maximized", "--no-sandbox"],
  },
};
