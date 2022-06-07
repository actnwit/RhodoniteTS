const {toMatchImageSnapshot} = require('jest-image-snapshot');
expect.extend({toMatchImageSnapshot});
module.exports = require('expect-puppeteer');
jest.setTimeout(2000000);
