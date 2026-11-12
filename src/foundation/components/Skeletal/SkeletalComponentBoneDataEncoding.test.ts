import Rn from '../../../../dist/esm';

/**
 * These tests decode the GPU bone data on the CPU in the same way as the shaders
 * (getBoneMatrix in processGeometry.glsl / processGeometry.wgsl) and compare the result
 * with the joint matrix that the skinning should use.
 */

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

/** A column-major 4x4 matrix */
type Mat = number[];
type Vec3 = [number, number, number];
type JointDesc = { t: Vec3; axis: Vec3; angle: number; s: Vec3 };

const IDENTITY: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// Unique joint indices keep the skinning cache keys of the skeletons in this file apart
let nextJointIndex = 100000;

function createJoint({ t, axis, angle, s }: JointDesc) {
  const entity = Rn.createGroupEntity(engine);
  const transform = entity.getTransform();
  const axisLength = Math.hypot(...axis);
  transform.localPosition = Rn.Vector3.fromCopy3(...t);
  transform.localRotation = Rn.Quaternion.fromAxisAngle(
    Rn.Vector3.fromCopy3(axis[0] / axisLength, axis[1] / axisLength, axis[2] / axisLength),
    angle
  );
  transform.localScale = Rn.Vector3.fromCopy3(...s);
  const sg = entity.getSceneGraph();
  sg.jointIndex = nextJointIndex++;
  return sg;
}

function createInverseBindMatricesAccessor(matrices: Mat[]) {
  const byteLength = matrices.length * 64;
  const buffer = new Rn.Buffer({
    byteLength,
    buffer: new ArrayBuffer(byteLength),
    name: 'InverseBindMatrices',
    byteAlign: 4,
  });
  const accessor = buffer
    .takeBufferView({ byteLengthToNeed: byteLength, byteStride: 0 })
    .unwrapForce()
    .takeAccessor({
      compositionType: Rn.CompositionType.Mat4,
      componentType: Rn.ComponentType.Float,
      count: matrices.length,
    })
    .unwrapForce();
  const typedArray = accessor.getTypedArray() as Float32Array;
  matrices.forEach((m, i) => {
    typedArray.set(m, i * 16);
  });
  return accessor;
}

function createSkeletal(
  joints: Rn.SceneGraphComponent[],
  boneDataType: Rn.BoneDataTypeEnum,
  { isAutoSelected = false, bindShapeMatrix }: { isAutoSelected?: boolean; bindShapeMatrix?: Mat } = {}
) {
  const skeletal = Rn.createSkeletalEntity(engine).getSkeletal();
  skeletal.setBoneDataType(boneDataType, isAutoSelected);
  skeletal.setInverseBindMatricesAccessor(createInverseBindMatricesAccessor(joints.map(() => IDENTITY)));
  if (bindShapeMatrix != null) {
    skeletal._bindShapeMatrix = Rn.Matrix44.fromCopyArrayColumnMajor(bindShapeMatrix);
  }
  skeletal.setJoints(joints);
  return skeletal;
}

function multiply(a: Mat, b: Mat): Mat {
  const r = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        r[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
      }
    }
  }
  return r;
}

const LOGQUAT_BIAS = 1048575;

function decodeLogQuat(lo: number, hi: number) {
  const xi = lo & 0x1fffff;
  const yi = (lo >>> 21) | ((hi & 0x3ff) << 11);
  const zi = (hi >>> 10) & 0x1fffff;
  const toLog = (i: number) => ((i - LOGQUAT_BIAS) / LOGQUAT_BIAS) * (Math.PI / 2);
  const vx = toLog(xi);
  const vy = toLog(yi);
  const vz = toLog(zi);
  const a = Math.hypot(vx, vy, vz);
  const k = a < 1e-4 ? 1 - (a * a) / 6 : Math.sin(a) / a;
  return [vx * k, vy * k, vz * k, Math.cos(a)];
}

function unpackSnorm2x16(u: number) {
  const toFloat = (c: number) => Math.max(-1, (c >= 0x8000 ? c - 0x10000 : c) / 32767);
  return [toFloat(u & 0xffff), toFloat(u >>> 16)];
}

/** Same as createMatrixFromQuaternionTranslationScale in the shaders */
function composeTRS(q: number[], t: number[], s: number[]): Mat {
  const [x, y, z, w] = q;
  const sx = x * x;
  const sy = y * y;
  const sz = z * z;
  const cx = y * z;
  const cy = x * z;
  const cz = x * y;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    (1 - 2 * (sy + sz)) * s[0],
    2 * (cz + wz) * s[0],
    2 * (cy - wy) * s[0],
    0,
    2 * (cz - wz) * s[1],
    (1 - 2 * (sx + sz)) * s[1],
    2 * (cx + wx) * s[1],
    0,
    2 * (cy + wy) * s[2],
    2 * (cx - wx) * s[2],
    (1 - 2 * (sx + sy)) * s[2],
    0,
    t[0],
    t[1],
    t[2],
    1,
  ];
}

/** Decodes the matrix of a joint in the same way as getBoneMatrix in the shaders */
function decodeJointMatrix(skeletal: Rn.SkeletalComponent, jointIdx: number): Mat {
  const f = skeletal.boneDataArray;
  const u = new Uint32Array(f.buffer, f.byteOffset, f.length);
  const info = skeletal.boneDataInfo._v;
  const boneDataType = Rn.BoneDataType.from(Math.round(info[3]));
  if (boneDataType === Rn.BoneDataType.Mat43x1) {
    const b = jointIdx * 12;
    return [
      f[b],
      f[b + 1],
      f[b + 2],
      0,
      f[b + 3],
      f[b + 4],
      f[b + 5],
      0,
      f[b + 6],
      f[b + 7],
      f[b + 8],
      0,
      f[b + 9],
      f[b + 10],
      f[b + 11],
      1,
    ];
  }
  if (boneDataType === Rn.BoneDataType.Vec4x2) {
    const b = jointIdx * 8;
    return composeTRS(decodeLogQuat(u[b + 3], u[b + 7]), [f[b], f[b + 1], f[b + 2]], [f[b + 4], f[b + 5], f[b + 6]]);
  }
  const b = jointIdx * 4;
  const [tx, ty] = unpackSnorm2x16(u[b + 2]);
  const [tz, encodedScale] = unpackSnorm2x16(u[b + 3]);
  const magnitude = 2 ** (encodedScale * 16);
  const scale = (u[b + 1] & 0x80000000) !== 0 ? -magnitude : magnitude;
  return composeTRS(decodeLogQuat(u[b], u[b + 1]), [tx * info[0], ty * info[1], tz * info[2]], [scale, scale, scale]);
}

function maxDifference(a: Mat, b: Mat) {
  let max = 0;
  for (let i = 0; i < 16; i++) {
    max = Math.max(max, Math.abs(a[i] - b[i]));
  }
  return max;
}

/** Runs the skinning update and checks every joint against inverse(skeleton) * joint * inverseBindMatrix * bindShape */
function expectDecodedJointMatrices(
  skeletal: Rn.SkeletalComponent,
  joints: Rn.SceneGraphComponent[],
  tolerance: number,
  bindShapeMatrix?: Mat
) {
  skeletal.$logic();
  joints.forEach((joint, i) => {
    let expected = Array.from(joint.matrixInner._v);
    if (bindShapeMatrix != null) {
      expected = multiply(expected, bindShapeMatrix);
    }
    const scale = Math.max(1, ...expected.slice(0, 11).map(Math.abs));
    expect(maxDifference(decodeJointMatrix(skeletal, i), expected)).toBeLessThanOrEqual(tolerance * scale);
  });
}

const allTypes: [Rn.BoneDataTypeEnum, number][] = [
  [Rn.BoneDataType.Mat43x1, 1e-6],
  [Rn.BoneDataType.Vec4x2, 1e-4],
  [Rn.BoneDataType.Vec4x1, 5e-4],
];

test.each(allTypes)(
  '%s reproduces rotated, translated and uniformly scaled joints (including scale > 1)',
  (boneDataType, tolerance) => {
    const joints = [
      createJoint({ t: [0.1, 1.2, -0.3], axis: [1, 2, 3], angle: 0.7, s: [1, 1, 1] }),
      createJoint({ t: [-0.5, 0.2, 0.05], axis: [0, 1, 0], angle: 2.5, s: [1.8, 1.8, 1.8] }),
      createJoint({ t: [0.02, -0.04, 0.3], axis: [-1, 0, 1], angle: 3.0, s: [40, 40, 40] }),
      createJoint({ t: [0.3, 0.6, 0.9], axis: [1, 0, 0], angle: -1.2, s: [0.01, 0.01, 0.01] }),
    ];
    expectDecodedJointMatrices(createSkeletal(joints, boneDataType), joints, tolerance);
  }
);

test.each(allTypes)('%s reproduces mirrored joints (negative determinant)', (boneDataType, tolerance) => {
  const joints = [
    createJoint({ t: [0.4, 1.0, 0.1], axis: [0, 0, 1], angle: 0.4, s: [-1, 1, 1] }),
    createJoint({ t: [-0.2, 0.5, 0.3], axis: [2, -1, 1], angle: 1.9, s: [1.5, -1.5, -1.5] }),
  ];
  expectDecodedJointMatrices(createSkeletal(joints, boneDataType), joints, tolerance);
});

test.each([
  [Rn.BoneDataType.Mat43x1, 1e-6],
  [Rn.BoneDataType.Vec4x2, 1e-4],
] as [Rn.BoneDataTypeEnum, number][])(
  '%s reproduces non-uniformly scaled and mirrored joints',
  (boneDataType, tolerance) => {
    const joints = [
      createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] }),
      createJoint({ t: [0.3, -0.2, 0.1], axis: [0, 1, 1], angle: -2.2, s: [-0.7, 1.3, 3] }),
    ];
    expectDecodedJointMatrices(createSkeletal(joints, boneDataType), joints, tolerance);
  }
);

test.each(allTypes)('%s collapses a joint with a zero scale', boneDataType => {
  const joints = [createJoint({ t: [0.5, 1.5, -0.5], axis: [1, 1, 0], angle: 0.8, s: [0, 0, 0] })];
  const skeletal = createSkeletal(joints, boneDataType);
  skeletal.$logic();
  const decoded = decodeJointMatrix(skeletal, 0);
  // The upper-left 3x3 is (almost) zero (Vec4x1 clamps the scale to 2^-16), and the translation is kept
  expect(Math.max(...decoded.slice(0, 11).map(Math.abs))).toBeLessThanOrEqual(2 ** -16 * 1.001);
  expect(decoded[12]).toBeCloseTo(0.5, 4);
  expect(decoded[13]).toBeCloseTo(1.5, 4);
  expect(decoded[14]).toBeCloseTo(-0.5, 4);
});

test('the bind shape matrix is applied after the inverse bind matrix', () => {
  const bindShapeMatrix: Mat = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0.1, 0.2, 0.3, 1];
  const joints = [createJoint({ t: [0.5, 1.0, 0.0], axis: [0, 1, 0], angle: 0.5, s: [1, 1, 1] })];
  const skeletal = createSkeletal(joints, Rn.BoneDataType.Mat43x1, { bindShapeMatrix });
  expectDecodedJointMatrices(skeletal, joints, 1e-6, bindShapeMatrix);
});

test('an automatically selected Vec4x1 switches to Vec4x2 when a non-uniform scale is found', () => {
  const joints = [
    createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 0, 0], angle: 0.3, s: [1, 1, 1] }),
    createJoint({ t: [0.2, 0.4, 0.1], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] }),
  ];
  const skeletal = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });
  expect(skeletal.boneDataArray.length).toBe(2 * 1 * 4);

  expectDecodedJointMatrices(skeletal, joints, 1e-4);
  expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x2);
  expect(skeletal.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x2.index);
  expect(skeletal.boneDataArray.length).toBe(2 * 2 * 4);
});

test('components sharing the skinning cache switch to Vec4x2 together', () => {
  // The same joints and inverse bind matrices give the same skinning cache key (like instances of the same model).
  // If only the leader switched, the follower would lose the shared result and fall back to its own joints,
  // which may not be animated.
  const joints = [
    createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 0, 0], angle: 0.3, s: [1, 1, 1] }),
    createJoint({ t: [0.2, 0.4, 0.1], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] }),
  ];
  const leader = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });
  const follower = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });

  leader.$logic();
  expect(leader.boneDataType).toBe(Rn.BoneDataType.Vec4x2);
  expect(follower.boneDataType).toBe(Rn.BoneDataType.Vec4x2);

  // The follower reuses the leader's result
  follower.$logic();
  expect(Array.from(follower.boneDataArray)).toEqual(Array.from(leader.boneDataArray));
  expect(Array.from(follower.boneDataInfo._v)).toEqual(Array.from(leader.boneDataInfo._v));
  expect(follower.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x2.index);
});

test('Vec4x1 is kept for all the components sharing the skinning cache if one of them specifies it explicitly', () => {
  const warn = vi.spyOn(engine.logger, 'warn').mockImplementation(() => undefined);
  try {
    const joints = [createJoint({ t: [0.2, 0.4, 0.1], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] })];
    const leader = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });
    const follower = createSkeletal(joints, Rn.BoneDataType.Vec4x1);

    leader.$logic();
    follower.$logic();
    expect(leader.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
    expect(follower.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
    expect(Array.from(follower.boneDataArray)).toEqual(Array.from(leader.boneDataArray));
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('an automatically selected Vec4x1 is kept while the scale is uniform', () => {
  const joints = [createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 0, 0], angle: 0.3, s: [3, 3, 3] })];
  const skeletal = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });
  expectDecodedJointMatrices(skeletal, joints, 5e-4);
  expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
});

test('an explicitly specified Vec4x1 is kept with a warning when a non-uniform scale is found', () => {
  const warn = vi.spyOn(engine.logger, 'warn').mockImplementation(() => undefined);
  try {
    const joints = [createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] })];
    const skeletal = createSkeletal(joints, Rn.BoneDataType.Vec4x1);
    skeletal.$logic();
    skeletal.$logic();
    expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
    expect(skeletal.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x1.index);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('Vec4x1 forced by Config.boneDataType is kept even if it was selected automatically', () => {
  const warn = vi.spyOn(engine.logger, 'warn').mockImplementation(() => undefined);
  engine.config.boneDataType = Rn.BoneDataType.Vec4x1;
  try {
    const joints = [createJoint({ t: [0.1, 0.2, 0.3], axis: [1, 2, 3], angle: 1.0, s: [2, 1, 0.5] })];
    const skeletal = createSkeletal(joints, Rn.BoneDataType.Vec4x1, { isAutoSelected: true });
    skeletal.$logic();
    expect(skeletal.boneDataType).toBe(Rn.BoneDataType.Vec4x1);
    expect(skeletal.boneDataInfo.w).toBe(Rn.BoneDataType.Vec4x1.index);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    engine.config.boneDataType = undefined;
    warn.mockRestore();
  }
});
