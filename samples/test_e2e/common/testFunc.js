exports.testFunc = async (jest, browser, url, expect) => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto('http://localhost:8082/samples/test_e2e/ColorGradingUsingLUTs');
  await page.setViewport({ width: 1000, height: 1000 });
  await page.waitForSelector('p#rendered', { timeout: 450000});
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


exports.testCheckWindowRendered = async (jest, browser, url, expect,threshold,noParam = false,consoleOn = false) => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto(url);
  if(consoleOn )
  {
    this.consoleLog(page);
  }
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForFunction(() => {return window._rendered}, {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  if(noParam)
  {
    expect(image).toMatchImageSnapshot();
  }
  else
  {
    expect(image).toMatchImageSnapshot({
      failureThreshold: threshold,
      failureThresholdType: 'percent',
    });
  }
  

  await page.close();
};

exports.testCheckPtoDocument= async (jest, browser, url, expect,threshold,noParam = false,consoleOn = false) => {
  jest.setTimeout(450000);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(450000);
  await page.goto(url);
  if(consoleOn)
  {
    this.consoleLog(page);
  }
  await page.setViewport({width: 1000, height: 1000});
  await page.waitForSelector('p#rendered', {timeout: 450000});
  const canvasElement = await page.$('#world');
  const image = await canvasElement.screenshot();
  if(noParam)
  {
    expect(image).toMatchImageSnapshot();
  }
  else
  {
    expect(image).toMatchImageSnapshot({
      failureThreshold: threshold,
      failureThresholdType: 'percent',
    });
  }
  
  await page.close();
};