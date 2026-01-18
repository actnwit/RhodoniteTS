import { Err } from './Result';
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
