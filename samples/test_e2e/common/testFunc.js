exports.testFunc = async (jest, browser, url, expect) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(
    'http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs'
  );
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 2000000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  expect(image).toMatchImageSnapshot();
  await page.goto('about:blank');
  await page.close();
};

exports.consoleLog = async page => {
  page.on('console', async msg => {
    const lines = [];
    for (let i = 0; i < msg.args().length; i++) {
      const value = await msg.args()[i].jsonValue();
      lines.push(value);
    }
    console.log(lines.join('\n')); // comment out if you check the browser side console out
  });
};

exports.testCheckWindowRendered = async (
  jest,
  browser,
  url,
  expect,
  threshold,
  noParam = false,
  consoleOn = false
) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(url);
  if (consoleOn) {
    this.consoleLog(page);
  }
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(
    () => {
      return window._rendered;
    },
    {timeout: 2000000}
  );
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  if (noParam) {
    expect(image).toMatchImageSnapshot();
  } else {
    expect(image).toMatchImageSnapshot({
      failureThreshold: threshold,
      failureThresholdType: 'percent',
    });
  }

  await page.close();
};

exports.testCheckPtoDocument = async (
  jest,
  browser,
  url,
  expect,
  threshold,
  noParam = false,
  consoleOn = false
) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(url);
  if (consoleOn) {
    this.consoleLog(page);
  }
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 2000000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  if (noParam) {
    expect(image).toMatchImageSnapshot();
  } else {
    expect(image).toMatchImageSnapshot({
      failureThreshold: threshold,
      failureThresholdType: 'percent',
    });
  }

  await page.close();
};

exports.defineTest = (name, mode, errorThreshold) => {
  const url = `http://localhost:8082/samples/test_e2e/${name}?mode=${mode}`;
  test(`${name} ${mode}`, async () => {
    await exports.testCheckWindowRendered(jest, browser, url, expect, errorThreshold, true);
  });
};

exports.doTests = (name, modes, errorThreshold = 0.03) => {
  for (const mode of modes) {
    exports.defineTest(name, mode, errorThreshold);
  }
};


exports.defineGltfTest = (name, mode, gltfName, gltfFormat,errorThreshold) => {
  const url = `http://localhost:8082/samples/test_e2e/${name}?mode=${mode}&gltf=${gltfName}&gltfformat=${gltfFormat}`;
  test(`${name} ${gltfName} ${mode}`, async () => {
    await exports.testCheckWindowRendered(jest, browser, url, expect, errorThreshold, true);
  });
};

exports.doGltfTests = (name, modes, gltfInfo, errorThreshold = 0.03) => {
  for (const gltf of gltfInfo) {
    for (const mode of modes) {
      exports.defineGltfTest(name, mode, gltf.name, gltf.format, errorThreshold);
    }
  }
};
