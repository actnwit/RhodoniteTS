import Rn from '../../../../dist/esm';

const config = new Rn.Config();
config.setUpAsMemoryBoostMode();
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config,
});
const countPerBufferView = engine.config.skeletalComponentCountPerBufferView;

function createJoints(count: number) {
  const joints: Rn.SceneGraphComponent[] = [];
  for (let i = 0; i < count; i++) {
    joints.push(Rn.createGroupEntity(engine).getSceneGraph());
  }
  return joints;
}

function createSkeletal() {
  return Rn.createSkeletalEntity(engine).getSkeletal();
}

function decodeLocation(skeletal: Rn.SkeletalComponent) {
  const v = (skeletal as any)._boneDataLocation._v as Float32Array;
  return v[0] * Rn.Component._variableLengthLocationRadix + v[1];
}

function locationOf(typedArray: Float32Array) {
  const memoryManager = engine.memoryManager;
  const buffers = memoryManager.getBuffers(Rn.BufferUse.GPUInstanceData);
  const layer = buffers.findIndex(buffer => buffer.getArrayBuffer() === typedArray.buffer);
  expect(layer).toBeGreaterThanOrEqual(0);
  const layerOffset = memoryManager.getByteOffsetOfExistingBuffers(Rn.BufferUse.GPUInstanceData, layer);
  return (layerOffset + typedArray.byteOffset) / 16;
}

/** Checks that the fixed member is placed at the slot which shaders read (componentSID % countPerBufferView) */
function expectSlotOfFixedMember(skeletal: Rn.SkeletalComponent, memberName: string) {
  const sid = skeletal.componentSID;
  const accessor = engine.componentMemoryRegistry.getAccessor(
    Rn.SkeletalComponent,
    memberName,
    Math.floor(sid / countPerBufferView)
  )!;
  const view = (skeletal as any)[`_${memberName}`]._v as Float32Array;
  expect(view.byteOffset).toBe(accessor.byteOffsetInRawArrayBufferOfBuffer + (sid % countPerBufferView) * 16);
}

test('Memory Boost Mode shares a buffer view among skeletal components', () => {
  expect(countPerBufferView).toBeGreaterThan(1);
});

test('bone data is allocated with the exact size of each bone data type in Memory Boost Mode', () => {
  const cases: [Rn.BoneDataTypeEnum, number][] = [
    [Rn.BoneDataType.Vec4x1, 1],
    [Rn.BoneDataType.Vec4x2, 2],
    [Rn.BoneDataType.Mat43x1, 3],
  ];
  for (const [boneDataType, vec4CountPerJoint] of cases) {
    const skeletal = createSkeletal();
    skeletal.setBoneDataType(boneDataType);
    skeletal.setJoints(createJoints(7));
    expect(skeletal.boneDataArray.length).toBe(7 * vec4CountPerJoint * 4);
    expect(skeletal.boneDataInfo.w).toBe(boneDataType.index);
    expect(decodeLocation(skeletal)).toBe(locationOf(skeletal.boneDataArray));
  }
});

test('bone data of skeletal components with different bone data types do not overlap', () => {
  const skeletals = [Rn.BoneDataType.Vec4x1, Rn.BoneDataType.Vec4x2, Rn.BoneDataType.Mat43x1].map((boneDataType, i) => {
    const skeletal = createSkeletal();
    skeletal.setBoneDataType(boneDataType);
    skeletal.setJoints(createJoints(4 + i));
    return skeletal;
  });
  skeletals.forEach((skeletal, i) => {
    skeletal.boneDataArray.fill(i + 1);
  });
  skeletals.forEach((skeletal, i) => {
    expect(Array.from(skeletal.boneDataArray).every(v => v === i + 1)).toBe(true);
  });

  // The ranges in the GPU data are disjoint
  const ranges = skeletals
    .map(skeletal => [decodeLocation(skeletal), decodeLocation(skeletal) + skeletal.boneDataArray.length / 4])
    .sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ranges.length; i++) {
    expect(ranges[i][0]).toBeGreaterThanOrEqual(ranges[i - 1][1]);
  }
});

test('changing the bone data type re-allocates the exact size in Memory Boost Mode', () => {
  const skeletal = createSkeletal();
  skeletal.setJoints(createJoints(6));
  expect(skeletal.boneDataArray.length).toBe(6 * 2 * 4);

  skeletal.setBoneDataType(Rn.BoneDataType.Mat43x1);
  expect(skeletal.boneDataArray.length).toBe(6 * 3 * 4);
  expect(decodeLocation(skeletal)).toBe(locationOf(skeletal.boneDataArray));

  // A smaller layout reuses the chunk of the component
  const locationOfMat43 = decodeLocation(skeletal);
  skeletal.setBoneDataType(Rn.BoneDataType.Vec4x1);
  expect(skeletal.boneDataArray.length).toBe(6 * 1 * 4);
  expect(decodeLocation(skeletal)).toBe(locationOfMat43);
});

test('a chunk released by a component is reused by another component', () => {
  const skeletalA = createSkeletal();
  skeletalA.setBoneDataType(Rn.BoneDataType.Vec4x1);
  skeletalA.setJoints(createJoints(9));
  const releasedLocation = decodeLocation(skeletalA);

  // Grow: the old chunk is too small, so it is released
  skeletalA.setBoneDataType(Rn.BoneDataType.Mat43x1);
  expect(decodeLocation(skeletalA)).not.toBe(releasedLocation);

  const skeletalB = createSkeletal();
  skeletalB.setBoneDataType(Rn.BoneDataType.Vec4x1);
  skeletalB.setJoints(createJoints(9));
  expect(decodeLocation(skeletalB)).toBe(releasedLocation);
  expect(decodeLocation(skeletalB)).toBe(locationOf(skeletalB.boneDataArray));
});

test('skeletal components can set joints out of SID order in Memory Boost Mode', () => {
  // Make the next skeletal component the first one of a new buffer view, and let it never allocate.
  let first = createSkeletal();
  while (first.componentSID % countPerBufferView !== 0) {
    first = createSkeletal();
  }
  const second = createSkeletal();
  const third = createSkeletal();
  const fourth = createSkeletal();

  // Previously, only the first component of a buffer view could create the buffer view,
  // and slots were taken in the allocation order.
  fourth.setBoneDataType(Rn.BoneDataType.Mat43x1);
  fourth.setJoints(createJoints(2));
  second.setBoneDataType(Rn.BoneDataType.Vec4x1);
  second.setJoints(createJoints(3));
  third.setJoints(createJoints(4));

  for (const skeletal of [second, third, fourth]) {
    expectSlotOfFixedMember(skeletal, 'boneDataInfo');
    expectSlotOfFixedMember(skeletal, 'boneDataLocation');
    expect(decodeLocation(skeletal)).toBe(locationOf(skeletal.boneDataArray));
  }
  expect(second.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x1.index);
  expect(third.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x2.index);
  expect(fourth.boneDataInfo.w).toBe(Rn.BoneDataType.Mat43x1.index);

  // The location offsets for shaders are indexed by the buffer view index
  const indexOfTheBufferView = Math.floor(second.componentSID / countPerBufferView);
  const locationOffsets = Rn.Component.getLocationOffsetOfMemberOfComponent(
    engine,
    Rn.SkeletalComponent,
    'boneDataInfo'
  );
  const accessor = engine.componentMemoryRegistry.getAccessor(
    Rn.SkeletalComponent,
    'boneDataInfo',
    indexOfTheBufferView
  )!;
  const layerOffset = engine.memoryManager.getByteOffsetOfExistingBuffers(
    Rn.BufferUse.GPUInstanceData,
    accessor.bufferView.buffer.indexOfTheBufferUsage
  );
  expect(locationOffsets[indexOfTheBufferView]).toBe((layerOffset + accessor.byteOffsetInBuffer) / 16);
});

test('a variable-length member requires its location member', () => {
  class VariableLengthTestComponent extends Rn.Component {}
  expect(() =>
    VariableLengthTestComponent.registerMember({
      bufferUse: Rn.BufferUse.GPUInstanceData,
      memberName: 'data',
      dataClassType: Rn.VectorN,
      shaderType: Rn.ShaderType.VertexShader,
      compositionType: Rn.CompositionType.Vec4Array,
      componentType: Rn.ComponentType.Float,
      initValues: new Rn.VectorN(new Float32Array(0)),
      isVariableLength: true,
    })
  ).toThrow();
});

test('skeletons can have more joints than the former maxBoneNumberForMemoryBoostMode in Memory Boost Mode', () => {
  const jointCount = engine.config.maxBoneNumberForMemoryBoostMode + 100;
  const skeletalA = createSkeletal();
  skeletalA.setBoneDataType(Rn.BoneDataType.Mat43x1);
  skeletalA.setJoints(createJoints(jointCount));
  const skeletalB = createSkeletal();
  skeletalB.setJoints(createJoints(3));

  expect(skeletalA.boneDataArray.length).toBe(jointCount * 3 * 4);
  // The last joint does not overlap the data of another component
  skeletalA.boneDataArray.fill(1);
  skeletalB.boneDataArray.fill(2);
  expect(skeletalA.boneDataArray[skeletalA.boneDataArray.length - 1]).toBe(1);
  expect(Array.from(skeletalB.boneDataArray).every(v => v === 2)).toBe(true);
  expect(decodeLocation(skeletalA)).toBe(locationOf(skeletalA.boneDataArray));
});
