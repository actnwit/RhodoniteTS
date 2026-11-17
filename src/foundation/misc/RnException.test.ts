import { RnException } from './RnException';

function RnExceptionTest() {
  throw new RnException({
    message: 'Error',
    error: 1,
  });
}

test('RnException Test', () => {
  expect(() => {
    RnExceptionTest();
  }).toThrowError();

  try {
    RnExceptionTest();
  } catch (err: any) {
    expect(err.message).toBe(`
  message: Error
  error: 1
`);
    expect(err.name).toBe(RnException._prefix);
  }
});

test('RnException Test with an undefined error object', () => {
  const exception = new RnException({ message: 'Error', error: undefined });
  expect(exception.message).toBe(`
  message: Error
  error: undefined
`);
  expect(exception.name).toBe(RnException._prefix);
});
