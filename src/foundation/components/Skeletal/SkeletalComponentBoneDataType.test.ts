import Rn from '../../../../dist/esm';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

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

test('the default bone data type of SkeletalComponent is Vec4x2', () => {
  const skeletal = createSkeletal();
  expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x2);
});

test('bone data is allocated with the number of vec4 per joint of each bone data type', () => {
  const cases: [Rn.BoneDataTypeEnum, number][] = [
    [Rn.BoneDataType.Mat43x1, 3],
    [Rn.BoneDataType.Vec4x2, 2],
    [Rn.BoneDataType.Vec4x1, 1],
  ];
  for (const [boneDataType, vec4CountPerJoint] of cases) {
    const skeletal = createSkeletal();
    skeletal.setBoneDataType(boneDataType);
    skeletal.setJoints(createJoints(5));
    expect(skeletal.boneDataArray.length).toBe(5 * vec4CountPerJoint * 4);
    expect(skeletal.boneDataInfo.w).toBe(boneDataType.index);
  }
});

test('changing the bone data type after setJoints re-allocates the bone data', () => {
  const skeletal = createSkeletal();
  skeletal.setJoints(createJoints(4));
  expect(skeletal.boneDataArray.length).toBe(4 * 2 * 4);

  skeletal.setBoneDataType(Rn.BoneDataType.Vec4x1);
  expect(skeletal.boneDataArray.length).toBe(4 * 1 * 4);
  expect(skeletal.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x1.index);

  skeletal.setBoneDataType(Rn.BoneDataType.Mat43x1);
  expect(skeletal.boneDataArray.length).toBe(4 * 3 * 4);
  expect(skeletal.boneDataInfo.w).toBe(Rn.BoneDataType.Mat43x1.index);
});

test('bone data of different components do not overlap', () => {
  const skeletalA = createSkeletal();
  skeletalA.setBoneDataType(Rn.BoneDataType.Vec4x1);
  skeletalA.setJoints(createJoints(3));
  const skeletalB = createSkeletal();
  skeletalB.setBoneDataType(Rn.BoneDataType.Mat43x1);
  skeletalB.setJoints(createJoints(3));

  skeletalA.boneDataArray.fill(1);
  skeletalB.boneDataArray.fill(2);
  expect(Array.from(skeletalA.boneDataArray).every(v => v === 1)).toBe(true);
  expect(Array.from(skeletalB.boneDataArray).every(v => v === 2)).toBe(true);
  expect(skeletalA.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x1.index);
  expect(skeletalB.boneDataInfo.w).toBe(Rn.BoneDataType.Mat43x1.index);
});

test('Config.boneDataType overrides the bone data type of each component', () => {
  const skeletal = createSkeletal();
  skeletal.setBoneDataType(Rn.BoneDataType.Vec4x1);
  engine.config.boneDataType = Rn.BoneDataType.Mat43x1;
  try {
    expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Mat43x1);
    skeletal.setJoints(createJoints(2));
    expect(skeletal.boneDataArray.length).toBe(2 * 3 * 4);
  } finally {
    engine.config.boneDataType = undefined;
  }
  expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
});
