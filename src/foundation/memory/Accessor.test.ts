import Buffer from './Buffer';
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";
import { Byte } from '../../types/CommonTypes';

function createBuffer(byteSize: Byte) {
  const arrayBuffer = new ArrayBuffer(byteSize);
  const buffer = new Buffer({
    byteLength:arrayBuffer.byteLength,
    buffer: arrayBuffer,
    name: 'TestBuffer'});

  return buffer;
}

test('An accessor can take full size typedArray of the buffer', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 64, byteStride: 0, isAoS: false});
  const accessor = bufferView!.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: 1});
  const typedArray = accessor.takeOne() as Float32Array;

  expect(typedArray.byteLength).toBe(64);
});

test('The range of the accessor exceeds the range of the buffer view', () => {
  const buffer = createBuffer(100);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 64, byteStride: 0, isAoS: false});
  let accessor = null;
  try {
    accessor = bufferView!.takeAccessor({compositionType: CompositionType.Mat4, componentType: ComponentType.Float, count: 2});
    const typedArray = accessor.takeOne() as Float32Array;
  } catch {
  }
  expect(accessor).toBe(null);

});

test('In SoA mode, data can be written in the correct position.', () => {
  const buffer = createBuffer(72);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 72, byteStride: 0, isAoS: false});
  let accessor0 = bufferView!.takeAccessor({compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 2});
  let accessor1 = bufferView!.takeAccessor({compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: 2});
  let accessor2 = bufferView!.takeAccessor({compositionType: CompositionType.Vec2, componentType: ComponentType.Float, count: 2});

  accessor0.setScalar(0, 100, {});
  accessor0.setScalar(1, 150, {});
  accessor1.setScalar(0, 200, {});

  const arrayBuffer = buffer.getArrayBuffer();
  const dataView = new DataView(arrayBuffer);

  expect(dataView.getFloat32(0, true)).toBe(100);
  expect(dataView.getFloat32(16, true)).toBe(150);
  expect(dataView.getFloat32(32, true)).toBe(200);

});

test('In AoS mode, data can be written in the correct position.', () => {
  const buffer = createBuffer(72);
  const bufferView = buffer.takeBufferView({byteLengthToNeed: 72, byteStride: 36, isAoS: true});
  let accessor0 = bufferView!.takeAccessor({compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 2});
  let accessor1 = bufferView!.takeAccessor({compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: 2});
  let accessor2 = bufferView!.takeAccessor({compositionType: CompositionType.Vec2, componentType: ComponentType.Float, count: 2});

  accessor0.setScalar(0, 100, {});
  accessor0.setScalar(1, 150, {});
  accessor1.setScalar(0, 200, {});

  const arrayBuffer = buffer.getArrayBuffer();
  const dataView = new DataView(arrayBuffer);

  expect(dataView.getFloat32(0, true)).toBe(100);
  expect(dataView.getFloat32(36, true)).toBe(150);
  expect(dataView.getFloat32(16, true)).toBe(200);

});