import {Buffer} from './Buffer';
import {CompositionType} from '../definitions/CompositionType';
import {ComponentType} from '../definitions/ComponentType';
import Accessor from './Accessor';

function createBuffer(byteSize: number) {
  const arrayBuffer = new ArrayBuffer(byteSize);
  const buffer = new Buffer({
    byteLength: arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'TestBuffer',
    byteAlign: 4,
  });

  return buffer;
}

test('An bufferView can take an accessor from itself', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({
    byteLengthToNeed: 64,
    byteStride: 0,
  });
  const accessor = bufferView!.takeAccessor({
    compositionType: CompositionType.Mat4,
    componentType: ComponentType.Float,
    count: 1,
  });

  expect(accessor instanceof Accessor).toBe(true);
});
