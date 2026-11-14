import { ComponentType } from '../foundation/definitions/ComponentType';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { PrimitiveMode } from '../foundation/definitions/PrimitiveMode';
import { VertexAttribute } from '../foundation/definitions/VertexAttribute';
import type { Mesh } from '../foundation/geometry/Mesh';
import type { Primitive } from '../foundation/geometry/Primitive';
import type { Accessor } from '../foundation/memory/Accessor';
import type { Buffer } from '../foundation/memory/Buffer';
import { buildMultiDrawGroups, makeMultiDrawGroupKey, planMultiDrawRuns } from './MultiDraw';

type FakeAccessorOptions = {
  buffer: Buffer;
  data: Uint8Array;
  elementCount: number;
  stride: number;
  componentType?: any;
  compositionType?: any;
  indices?: ArrayLike<number>;
};

function createAccessor({
  buffer,
  data,
  elementCount,
  stride,
  componentType = ComponentType.Float,
  compositionType = CompositionType.Vec3,
  indices,
}: FakeAccessorOptions): Accessor {
  return {
    bufferView: { buffer },
    getUint8Array: () => data,
    elementCount,
    actualByteStride: stride,
    normalized: false,
    componentType,
    compositionType,
    getScalar: (i: number) => (indices != null ? indices[i] : 0),
  } as unknown as Accessor;
}

function createPrimitive({
  buffer,
  attributeData,
  vertexCount,
  indexData,
  indexDataUint32,
  morphTargets = 0,
  base = 0,
}: {
  buffer: Buffer;
  attributeData: Uint8Array;
  vertexCount: number;
  indexData?: Int32Array;
  indexDataUint32?: Uint32Array;
  morphTargets?: number;
  base?: number;
}): Primitive {
  const attributeAccessor = createAccessor({
    buffer,
    data: attributeData,
    elementCount: vertexCount,
    stride: 12,
  });
  const indicesAccessor =
    indexData != null
      ? createAccessor({
          buffer,
          data: new Uint8Array(indexData.buffer),
          elementCount: indexData.length,
          stride: 4,
          componentType: ComponentType.UnsignedInt as any,
          compositionType: CompositionType.Scalar as any,
          indices: indexData,
        })
      : indexDataUint32 != null
        ? createAccessor({
            buffer,
            data: new Uint8Array(indexDataUint32.buffer),
            elementCount: indexDataUint32.length,
            stride: 4,
            componentType: ComponentType.UnsignedInt as any,
            compositionType: CompositionType.Scalar as any,
            indices: Array.from(indexDataUint32),
          })
        : undefined;

  return {
    targets: new Array(morphTargets).fill(new Map()),
    attributeAccessors: [attributeAccessor],
    attributeSemantics: [VertexAttribute.Position.XYZ],
    indicesAccessor,
    primitiveMode: PrimitiveMode.Triangles,
    primitiveUid: base,
    hasIndices: () => indicesAccessor != null,
    getVertexCountAsVerticesBased: () => vertexCount,
    getRenderIndexBitSize: () => (indicesAccessor != null ? 'uint32' : 'uint16'),
    material: {
      materialSID: base,
    },
    mesh: {
      _ensureInstanceSidBase: () => base,
    } as unknown as Mesh,
  } as unknown as Primitive;
}

function createBufferStub(): Buffer {
  return {} as Buffer;
}

function createPositionBytes(count: number, offset: number): Uint8Array {
  const data = new Uint8Array(count * 12);
  for (let i = 0; i < count; i++) {
    const view = new Float32Array(data.buffer, i * 12, 3);
    view[0] = offset + i;
    view[1] = offset + i + 0.25;
    view[2] = offset + i + 0.5;
  }
  return data;
}

test('makeMultiDrawGroupKey groups primitives sharing a Buffer and layout', () => {
  const buffer = createBufferStub();
  const a = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 0),
    vertexCount: 3,
    indexData: new Int32Array([0, 1, 2]),
    base: 0,
  });
  const b = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 10),
    vertexCount: 3,
    indexData: new Int32Array([0, 1, 2]),
    base: 3,
  });

  expect(makeMultiDrawGroupKey(a)).not.toBeNull();
  expect(makeMultiDrawGroupKey(a)).toBe(makeMultiDrawGroupKey(b));
});

test('makeMultiDrawGroupKey rejects morph primitives and different Buffers', () => {
  const buffer = createBufferStub();
  const morph = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 0),
    vertexCount: 3,
    morphTargets: 1,
  });
  const other = createPrimitive({
    buffer: createBufferStub(),
    attributeData: createPositionBytes(3, 0),
    vertexCount: 3,
  });

  expect(makeMultiDrawGroupKey(morph)).toBeNull();
  expect(makeMultiDrawGroupKey(other)).not.toBeNull();
});

test('buildMultiDrawGroups concatenates attributes and rebases indices', () => {
  const buffer = createBufferStub();
  const a = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 0),
    vertexCount: 3,
    indexData: new Int32Array([0, 1, 2]),
    base: 5,
  });
  const b = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 10),
    vertexCount: 3,
    indexData: new Int32Array([0, 2, 1]),
    base: 9,
  });

  const merged = buildMultiDrawGroups([a, b]);
  expect(merged.length).toBe(1);

  const { group, attributeBytes, mergedIndices, instanceBases, materialSids } = merged[0];
  expect(group.entries.length).toBe(2);
  expect(group.totalVertexCount).toBe(6);
  expect(group.totalIndexCount).toBe(6);
  expect(attributeBytes[0].length).toBe(6 * 12);
  expect(mergedIndices).toBeDefined();
  expect(Array.from(mergedIndices!)).toEqual([0, 1, 2, 3, 5, 4]);

  expect(group.entries[0].vertexOffset).toBe(0);
  expect(group.entries[0].indexByteOffset).toBe(0);
  expect(group.entries[1].vertexOffset).toBe(3);
  expect(group.entries[1].indexByteOffset).toBe(12);

  expect(Array.from(instanceBases)).toEqual([5, 5, 5, 9, 9, 9]);
  expect(Array.from(materialSids)).toEqual([5, 5, 5, 9, 9, 9]);
});

test('buildMultiDrawGroups keeps single-primitive groups unmerged', () => {
  const buffer = createBufferStub();
  const a = createPrimitive({
    buffer,
    attributeData: createPositionBytes(3, 0),
    vertexCount: 3,
    indexData: new Int32Array([0, 1, 2]),
  });

  expect(buildMultiDrawGroups([a]).length).toBe(0);
});

test('planMultiDrawRuns splits runs by key and direction', () => {
  const keys = ['a', 'a', 'b', null, null, 'a'];
  const getKey = (index: number) => keys[index];

  const forward = planMultiDrawRuns(0, 5, 1, getKey);
  expect(forward.map(run => [run.startIndex, run.count, run.key])).toEqual([
    [0, 2, 'a'],
    [2, 1, 'b'],
    [3, 2, null],
    [5, 1, 'a'],
  ]);

  const backwardKeys = ['a', 'a', 'a', 'b', 'b'];
  const backward = planMultiDrawRuns(4, 0, -1, index => backwardKeys[index]);
  expect(backward.map(run => [run.startIndex, run.count, run.key])).toEqual([
    [4, 2, 'b'],
    [2, 3, 'a'],
  ]);
});
