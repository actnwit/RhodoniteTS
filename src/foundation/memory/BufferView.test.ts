import Buffer from './Buffer';
import is from '../misc/IsUtil';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import Accessor from './AccessorBase';

function createBuffer(byteSize: number) {
  const arrayBuffer = new ArrayBuffer(byteSize);
  const buffer = new Buffer({
    byteLength:arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'TestBuffer'});

  return buffer;
}

test('An bufferView can take an accessor from itself', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 64, byteStride: 0, isAoS: false});
  const accessor = bufferView!.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: 1});

  expect(accessor instanceof Accessor).toBe(true);
});
