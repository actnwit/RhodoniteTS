import { LogLevel, Logger } from './Logger';

test('LogLevel.Debug', () => {
  Logger.default.logLevel = LogLevel.Debug;
  Logger.default.isAccumulateLog = false;
  Logger.default.isRichLog = false;

  expect(Logger.default.debug('debug')).toBe('debug');
  expect(Logger.default.info('info')).toBe('info');
  expect(Logger.default.warn('warn')).toBe('warn');
  expect(Logger.default.error('error')).toBe('error');
  expect(Logger.default.assert(true, 'assert')).toBe('assert');
});

test('LogLevel.Info', () => {
  Logger.default.logLevel = LogLevel.Info;
  Logger.default.isAccumulateLog = false;
  Logger.default.isRichLog = false;

  expect(Logger.default.debug('debug')).toBeUndefined();
  expect(Logger.default.info('info')).toBe('info');
  expect(Logger.default.warn('warn')).toBe('warn');
  expect(Logger.default.error('error')).toBe('error');
  expect(Logger.default.assert(true, 'assert')).toBe('assert');
});

test('LogLevel.Warn', () => {
  Logger.default.logLevel = LogLevel.Warn;
  Logger.default.isAccumulateLog = false;
  Logger.default.isRichLog = false;

  expect(Logger.default.debug('debug')).toBeUndefined();
  expect(Logger.default.info('info')).toBeUndefined();
  expect(Logger.default.warn('warn')).toBe('warn');
  expect(Logger.default.error('error')).toBe('error');
  expect(Logger.default.assert(true, 'assert')).toBe('assert');
});

test('LogLevel.Error', () => {
  Logger.default.logLevel = LogLevel.Error;
  Logger.default.isAccumulateLog = false;
  Logger.default.isRichLog = false;

  expect(Logger.default.debug('debug')).toBeUndefined();
  expect(Logger.default.info('info')).toBeUndefined();
  expect(Logger.default.warn('warn')).toBeUndefined();
  expect(Logger.default.error('error')).toBe('error');
  expect(Logger.default.assert(true, 'assert')).toBe('assert');
});

test('LogLevel.Assert', () => {
  Logger.default.logLevel = LogLevel.Assert;
  Logger.default.isAccumulateLog = false;
  Logger.default.isRichLog = false;

  expect(Logger.default.debug('debug')).toBeUndefined();
  expect(Logger.default.info('info')).toBeUndefined();
  expect(Logger.default.warn('warn')).toBeUndefined();
  expect(Logger.default.error('error')).toBeUndefined();
  expect(Logger.default.assert(true, 'assert')).toBe('assert');
});

test('isAccumulateLog', () => {
  Logger.default.logLevel = LogLevel.Debug;
  Logger.default.isAccumulateLog = true;
  Logger.default.isRichLog = true;
  Logger.default.clearAccumulatedLog();

  Logger.default.debug('debug!');
  Logger.default.info('info!');
  Logger.default.warn('warn!');
  Logger.default.error('error!');

  console.log(Logger.default.getAccumulatedLog().join('\n'));
});

test('Engine-specific Logger instance', () => {
  const logger1 = new Logger();
  const logger2 = new Logger();

  logger1.logLevel = LogLevel.Debug;
  logger2.logLevel = LogLevel.Error;

  // logger1 should log debug messages
  expect(logger1.debug('debug from logger1')).toBe('debug from logger1');

  // logger2 should not log debug messages (only Error and above)
  expect(logger2.debug('debug from logger2')).toBeUndefined();
  expect(logger2.error('error from logger2')).toBe('error from logger2');
});
