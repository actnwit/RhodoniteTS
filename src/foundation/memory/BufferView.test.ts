import {Buffer} from './Buffer';
import {CompositionType} from '../definitions/CompositionType';
import {ComponentType} from '../definitions/ComponentType';
import {Accessor} from './Accessor';

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
  const buffer = createBuffer(64);
  const bufferView = buffer
    .takeBufferView({
      byteLengthToNeed: 64,
      byteStride: 0,
    })
    .unwrapForce();
  const accessor = bufferView!
    .takeAccessor({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      count: 1,
    })
    .unwrapForce();

  expect(accessor instanceof Accessor).toBe(true);
});

test('take BufferView and Accessor, the Accessor byteLength is correct', () => {
  const compositionType = CompositionType.Vec3;
  const componentType = ComponentType.Float;
  const bytes =
    compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
  const count = 5;
  const buffer = createBuffer(bytes * count);

  const bufferView = buffer
    .takeBufferView({
      byteLengthToNeed: bytes * count,
      byteStride: 0,
    })
    .unwrapForce();

  const accessor = bufferView!
    .takeAccessor({
      compositionType,
      componentType,
      count: count,
    })
    .unwrapForce();

  expect(accessor instanceof Accessor).toBe(true);
  expect(accessor.byteLength).toBe(bytes * count);
});

test('take BufferView and Accessor, but the count is too much', () => {
  const compositionType = CompositionType.Vec3;
  const componentType = ComponentType.Float;
  const bytes =
    compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
  const count = 5;
  const buffer = createBuffer(bytes * count);

  const bufferView = buffer
    .takeBufferView({
      byteLengthToNeed: bytes * count,
      byteStride: 0,
    })
    .unwrapForce();

  try {
    const accessor = bufferView!
      .takeAccessor({
        compositionType,
        componentType,
        count: count + 1,
      })
      .unwrapForce();
  } catch (e) {
    console.log(e);
  }
});

test('take BufferView, but the byteLength is too much', () => {
  const compositionType = CompositionType.Vec3;
  const componentType = ComponentType.Float;
  const bytes =
    compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
  const count = 5;
  const buffer = createBuffer(bytes * count);

  try {
    const bufferView = buffer
      .takeBufferView({
        byteLengthToNeed: bytes * count + 1,
        byteStride: 0,
      })
      .unwrapForce();
  } catch (e) {
    console.log(e);
  }
});
