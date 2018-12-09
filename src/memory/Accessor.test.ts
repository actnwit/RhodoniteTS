import Buffer from './Buffer';
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";

function createBuffer(byteSize: Byte) {
  const arrayBuffer = new ArrayBuffer(byteSize);
  const buffer = new Buffer({
    byteLength:arrayBuffer.byteLength,
    arrayBuffer: arrayBuffer,
    name: 'TestBuffer'});

  return buffer;
}

test('An accessor can take full size typedArray of the buffer', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 64, byteStride: 0});
  const accessor = bufferView!.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: 1});
  const typedArray = accessor.takeOne() as Float32Array;

  expect(typedArray.byteLength).toBe(64);
});

test('The range of the accessor exceeds the range of the buffer view', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 64, byteStride: 0});
  const accessor = bufferView!.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: 4});
  const typedArray = accessor.takeOne() as Float32Array;

  expect(typedArray.byteLength).toBe(64);
});
