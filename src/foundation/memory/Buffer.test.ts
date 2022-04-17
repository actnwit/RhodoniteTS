import {Buffer} from './Buffer';
import {BufferView} from './BufferView';
import {Byte} from '../../types/CommonTypes';

function createBuffer(byteSize: Byte) {
  const arrayBuffer = new ArrayBuffer(byteSize);
  const buffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'TestBuffer',
    byteAlign: 4,
  });

  return buffer;
}

test('new Buffer() create a new Buffer instances', () => {
  const buffer = createBuffer(100);
  expect(buffer instanceof Buffer).toBe(true);
});

test('a bufferView can be got from a Buffer', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer
    .takeBufferView({
      byteLengthToNeed: 100,
      byteStride: 0,
    })
    .unwrapForce();

  expect(bufferView instanceof BufferView).toBe(true);
});

test('Can not create a BufferView that exceeds the capacity of Buffer', () => {
  const buffer = createBuffer(100);
  let bufferView = null;
  try {
    bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: 200,
        byteStride: 0,
      })
      .unwrapForce();
  } catch {
    expect(bufferView).toBe(null);
  }
});

test('The byteLength of the buffer needs to be a multiple of 4', () => {
  const buffer = createBuffer(100);
  let bufferView = null;
  try {
    bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: 3,
        byteStride: 0,
      })
      .unwrapForce();
  } catch {
    expect(bufferView).toBe(null);
  }
});

test.skip('The byteStride of the buffer needs to be a multiple of 4', () => {
  const buffer = createBuffer(100);
  let bufferView = null;
  try {
    bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: 8,
        byteStride: 3,
        // isAoS: true,
      })
      .unwrapForce();
  } catch {
    expect(bufferView).toBe(null);
  }
});
