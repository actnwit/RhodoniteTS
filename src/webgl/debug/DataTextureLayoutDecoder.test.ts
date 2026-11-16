import { ComponentType } from '../../foundation/definitions/ComponentType';
import { CompositionType } from '../../foundation/definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../foundation/definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../foundation/definitions/ShaderType';
import {
  type DataTextureLayoutSource,
  decodeComponentMember,
  decodeGlobalProperty,
  decodeMaterialProperty,
  decodeVariableLengthComponentMember,
  getFetchPlan,
} from './DataTextureLayoutDecoder';
import type { Texel } from './types';

function makeInfo(
  compositionType: ShaderSemanticsInfo['compositionType'],
  options: Partial<ShaderSemanticsInfo> = {}
): ShaderSemanticsInfo {
  return {
    semantic: 'test' as ShaderSemanticsInfo['semantic'],
    compositionType,
    componentType: ComponentType.Float,
    stage: ShaderType.VertexShader,
    min: -Number.MAX_VALUE,
    max: Number.MAX_VALUE,
    ...options,
  };
}

function makeLayout(width = 8): DataTextureLayoutSource {
  return {
    width,
    readVec4: (vec4Index: number): Texel | null =>
      vec4Index >= 0 && vec4Index < 1000 ? [vec4Index, vec4Index + 0.25, vec4Index + 0.5, vec4Index + 0.75] : null,
    readScalar: (scalarIndex: number): number | null => (scalarIndex >= 0 && scalarIndex < 4000 ? scalarIndex : null),
  };
}

describe('DataTextureLayoutDecoder', () => {
  it('maps composition types to the same fetch helpers as the shaders', () => {
    expect(getFetchPlan(CompositionType.Vec4).fetchFunction).toBe('fetchElement');
    expect(getFetchPlan(CompositionType.Vec3Array).fetchFunction).toBe('fetchVec3No16BytesAligned');
    expect(getFetchPlan(CompositionType.ScalarArray).fetchFunction).toBe('fetchScalarNo16BytesAligned');
    expect(getFetchPlan(CompositionType.Mat4).fetchFunction).toBe('fetchMat4');
    expect(getFetchPlan(CompositionType.Mat3Array).fetchFunction).toBe('fetchMat3No16BytesAligned');
    expect(getFetchPlan(CompositionType.Mat2).warning).toContain('vec4SizeOfProperty=2');
    expect(getFetchPlan(CompositionType.Mat2Array).warning).toContain('scalar_idx * 4');
  });

  it('decodes a non-array material property with the buffer-view offset', () => {
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.Vec4),
      offsets: [10],
      materialSID: 3,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
    });

    expect(result.bufferViewIndex).toBe(0);
    expect(result.indexInBufferView).toBe(3);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0].vec4Index).toBe(13);
    expect(result.locations[0].row).toBe(1);
    expect(result.locations[0].col).toBe(5);
    expect(result.locations[0].texels[0]).toEqual([13, 13.25, 13.5, 13.75]);
  });

  it('uses the buffer view selected by the material SID', () => {
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.Vec4),
      offsets: [10, 200],
      materialSID: 120,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
    });

    expect(result.bufferViewIndex).toBe(1);
    expect(result.indexInBufferView).toBe(20);
    expect(result.locations[0].vec4Index).toBe(220);
  });

  it('decodes scalar-array elements with the shader scalar index', () => {
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.ScalarArray, { arrayLength: 4 }),
      offsets: [4],
      materialSID: 0,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
      maxArrayElements: 4,
    });

    expect(result.locations.map(location => location.scalarIndex)).toEqual([16, 17, 18, 19]);
    expect(result.locations.map(location => location.col)).toEqual([4, 4, 4, 4]);
  });

  it('decodes vec3-array elements with padded scalar strides', () => {
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.Vec3Array, { arrayLength: 2 }),
      offsets: [0],
      materialSID: 0,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
      maxArrayElements: 2,
    });

    expect(result.locations.map(location => location.scalarIndex)).toEqual([0, 3]);
    expect(result.locations[0].texels).toHaveLength(1);
    expect(result.locations[1].texels).toHaveLength(2);
  });

  it('reads the number of texels required by matrix fetches', () => {
    const mat4 = decodeMaterialProperty({
      info: makeInfo(CompositionType.Mat4),
      offsets: [5],
      materialSID: 0,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
    });
    const mat3 = decodeMaterialProperty({
      info: makeInfo(CompositionType.Mat3),
      offsets: [5],
      materialSID: 0,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
    });

    expect(mat4.locations[0].texels).toHaveLength(4);
    expect(mat3.locations[0].texels).toHaveLength(3);
  });

  it('warns when a soloDatum is in a non-zero buffer view', () => {
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.Vec4, { soloDatum: true }),
      offsets: [7],
      materialSID: 150,
      materialCountPerBufferView: 100,
      layout: makeLayout(),
    });

    expect(result.bufferViewIndex).toBe(0);
    expect(result.locations[0].warnings.join(' ')).toContain('soloDatum');
  });

  it('decodes global arrays without an arrayLength stride', () => {
    const result = decodeGlobalProperty({
      info: makeInfo(CompositionType.ScalarArray, { arrayLength: 3 }),
      offset: 2,
      layout: makeLayout(),
      maxArrayElements: 3,
    });

    expect(result.locations.map(location => location.scalarIndex)).toEqual([8, 9, 10]);
    expect(result.locations.map(location => location.vec4Index)).toEqual([2, 2, 2]);
  });

  it('decodes component matrix members with the shader scalar formula', () => {
    const mat3 = decodeComponentMember({
      memberInfo: { compositionType: CompositionType.Mat3 },
      offsets: [2],
      componentSID: 0,
      componentCountPerBufferView: 10,
      layout: makeLayout(),
    });
    const vec3 = decodeComponentMember({
      memberInfo: { compositionType: CompositionType.Vec3 },
      offsets: [2],
      componentSID: 0,
      componentCountPerBufferView: 10,
      layout: makeLayout(),
    });

    expect(mat3.locations[0].scalarIndex).toBe(8);
    expect(mat3.locations[0].texels).toHaveLength(3);
    expect(vec3.locations[0].scalarIndex).toBe(8);
    expect(vec3.locations[0].texels).toHaveLength(1);
  });

  it('decodes variable-length members from the location texel', () => {
    const locationTexel: Texel = [0, 40, 2, 0];
    const layout: DataTextureLayoutSource = {
      width: 8,
      readVec4: (vec4Index: number): Texel | null => {
        if (vec4Index === 1) {
          return locationTexel;
        }
        return vec4Index >= 0 && vec4Index < 1000 ? [vec4Index, 0, 0, 0] : null;
      },
      readScalar: (scalarIndex: number): number | null => scalarIndex,
    };

    const result = decodeVariableLengthComponentMember({
      memberInfo: { compositionType: CompositionType.Vec4Array, isVariableLength: true },
      offsets: [5],
      locationMemberOffsets: [1],
      componentSID: 0,
      componentCountPerBufferView: 10,
      layout,
      maxArrayElements: 2,
    });

    expect(result.arrayLengthForShader).toBe(2);
    expect(result.locations.map(location => location.vec4Index)).toEqual([40, 41]);
  });

  it('warns when a texel is outside the CPU buffers', () => {
    const layout: DataTextureLayoutSource = {
      width: 8,
      readVec4: () => null,
      readScalar: () => null,
    };
    const result = decodeMaterialProperty({
      info: makeInfo(CompositionType.Vec4),
      offsets: [10],
      materialSID: 0,
      materialCountPerBufferView: 100,
      layout,
    });

    expect(result.locations[0].texels).toHaveLength(0);
    expect(result.locations[0].warnings.join(' ')).toContain('outside the GPUInstanceData buffers');
  });
});
