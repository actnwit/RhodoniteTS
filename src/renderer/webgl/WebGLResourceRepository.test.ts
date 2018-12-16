import WebGLResouceRepository from './WebGLResourceRepository';
const puppeteer = require('puppeteer')

const timeout = 5000;

//let browser;
let page;
beforeAll(async () => {
  //browser = await puppeteer.launch({ headless: false, timeout: 0 })
  page = await (global as any).__BROWSER__.newPage()
  await page.goto('http://google.co.jp', {waitUntil: "networkidle2"})
}, timeout)

test('new Buffer() create a new Buffer instances', () => {
  const repo = WebGLResouceRepository.getInstance();
//  repo

});

afterAll(() => {
  //browser.close()
})

