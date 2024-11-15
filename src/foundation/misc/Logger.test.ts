import { Logger, LogLevel } from './Logger';

test(`LogLevel.Debug`, () => {
  Logger.logLevel = LogLevel.Debug;
  Logger.isAccumulateLog = false;
  Logger.isRichLog = false;

  expect(Logger.debug('debug')).toBe('debug');
  expect(Logger.info('info')).toBe('info');
  expect(Logger.warn('warn')).toBe('warn');
  expect(Logger.error('error')).toBe('error');
  expect(Logger.assert(true, 'assert')).toBe('assert');
});

test(`LogLevel.Info`, () => {
  Logger.logLevel = LogLevel.Info;
  Logger.isAccumulateLog = false;
  Logger.isRichLog = false;

  expect(Logger.debug('debug')).toBeUndefined();
  expect(Logger.info('info')).toBe('info');
  expect(Logger.warn('warn')).toBe('warn');
  expect(Logger.error('error')).toBe('error');
  expect(Logger.assert(true, 'assert')).toBe('assert');
});

test(`LogLevel.Warn`, () => {
  Logger.logLevel = LogLevel.Warn;
  Logger.isAccumulateLog = false;
  Logger.isRichLog = false;

  expect(Logger.debug('debug')).toBeUndefined();
  expect(Logger.info('info')).toBeUndefined();
  expect(Logger.warn('warn')).toBe('warn');
  expect(Logger.error('error')).toBe('error');
  expect(Logger.assert(true, 'assert')).toBe('assert');
});

test(`LogLevel.Error`, () => {
  Logger.logLevel = LogLevel.Error;
  Logger.isAccumulateLog = false;
  Logger.isRichLog = false;

  expect(Logger.debug('debug')).toBeUndefined();
  expect(Logger.info('info')).toBeUndefined();
  expect(Logger.warn('warn')).toBeUndefined();
  expect(Logger.error('error')).toBe('error');
  expect(Logger.assert(true, 'assert')).toBe('assert');
});

test(`LogLevel.Assert`, () => {
  Logger.logLevel = LogLevel.Assert;
  Logger.isAccumulateLog = false;
  Logger.isRichLog = false;

  expect(Logger.debug('debug')).toBeUndefined();
  expect(Logger.info('info')).toBeUndefined();
  expect(Logger.warn('warn')).toBeUndefined();
  expect(Logger.error('error')).toBeUndefined();
  expect(Logger.assert(true, 'assert')).toBe('assert');
});

test(`isAccumulateLog`, () => {
  Logger.logLevel = LogLevel.Debug;
  Logger.isAccumulateLog = true;
  Logger.isRichLog = true;

  Logger.debug('debug!');
  Logger.info('info!');
  Logger.warn('warn!');
  Logger.error('error!');

  console.log(Logger.getAccumulatedLog().join('\n'));
});
