import {
  buildLightClustersOnCpu,
  computeLightBoundingSphere,
  computeLightClusterIndex,
  createLightClusterBuildScratch,
  readLightClusterEntries,
  sphereIntersectsLightCluster,
  writeLightClusterViewHeader,
} from './LightClusterBuilder';
import {
  getLightClusterGlobalPropertyLength,
  getLightClusterViewLayout,
  LightClusterLayout,
  packLightEntry,
  unpackLightEntry,
} from './LightClusterLayout';

// ---- matrix helpers (column-major, m[row][col] = v[col * 4 + row]) ----

type Mat4 = Float64Array;

function mat4(rows: number[][]): Mat4 {
  const m = new Float64Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      m[c * 4 + r] = rows[r][c];
    }
  }
  return m;
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const m = new Float64Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) {
        s += a[k * 4 + r] * b[c * 4 + k];
      }
      m[c * 4 + r] = s;
    }
  }
  return m;
}

function transform(m: Mat4, p: number[]): number[] {
  const out = [0, 0, 0, 0];
  for (let r = 0; r < 4; r++) {
    out[r] = m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * p[3];
  }
  return out;
}

/** A right-handed look-at view matrix. */
function lookAt(eye: number[], target: number[], up: number[]): Mat4 {
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const normalize = (a: number[]) => {
    const l = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return mat4([
    [x[0], x[1], x[2], -dot(x, eye)],
    [y[0], y[1], y[2], -dot(y, eye)],
    [z[0], z[1], z[2], -dot(z, eye)],
    [0, 0, 0, 1],
  ]);
}

/** An off-center perspective frustum (WebGL depth range, or infinite far when `far` is Infinity). */
function frustum(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
  const c = far === Number.POSITIVE_INFINITY ? -1 : -(far + near) / (far - near);
  const d = far === Number.POSITIVE_INFINITY ? -2 * near : (-2 * far * near) / (far - near);
  return mat4([
    [(2 * near) / (right - left), 0, (right + left) / (right - left), 0],
    [0, (2 * near) / (top - bottom), (top + bottom) / (top - bottom), 0],
    [0, 0, c, d],
    [0, 0, -1, 0],
  ]);
}

function perspective(fovyDegree: number, aspect: number, near: number, far: number): Mat4 {
  const top = near * Math.tan((fovyDegree * Math.PI) / 360);
  return frustum(-top * aspect, top * aspect, -top, top, near, far);
}

/** A perspective projection with the WebGPU depth range [0, 1]. */
function perspectiveWebGpu(fovyDegree: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan((fovyDegree * Math.PI) / 360);
  return mat4([
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, far / (near - far), (far * near) / (near - far)],
    [0, 0, -1, 0],
  ]);
}

function orthographic(halfWidth: number, halfHeight: number, near: number, far: number): Mat4 {
  return mat4([
    [1 / halfWidth, 0, 0, 0],
    [0, 1 / halfHeight, 0, 0],
    [0, 0, -2 / (far - near), -(far + near) / (far - near)],
    [0, 0, 0, 1],
  ]);
}

function invert(m: Mat4): Mat4 {
  // Gauss-Jordan elimination on a row-major copy
  const a: number[][] = [];
  for (let r = 0; r < 4; r++) {
    a.push([m[r], m[4 + r], m[8 + r], m[12 + r], r === 0 ? 1 : 0, r === 1 ? 1 : 0, r === 2 ? 1 : 0, r === 3 ? 1 : 0]);
  }
  for (let c = 0; c < 4; c++) {
    let pivot = c;
    for (let r = c + 1; r < 4; r++) {
      if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    }
    [a[c], a[pivot]] = [a[pivot], a[c]];
    const p = a[c][c];
    for (let k = 0; k < 8; k++) a[c][k] /= p;
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = a[r][c];
      for (let k = 0; k < 8; k++) a[r][k] -= f * a[c][k];
    }
  }
  return mat4(a.map(row => row.slice(4)));
}

// ---- deterministic random ----

function createRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---- test scene ----

type TestLight = {
  sid: number;
  type: number; // 1: point, 2: spot
  position: number[];
  direction: number[];
  range: number;
  outerConeCos: number;
};

function createLights(random: () => number, count: number, center: number[], extent: number): TestLight[] {
  const lights: TestLight[] = [];
  for (let i = 0; i < count; i++) {
    const isSpot = random() < 0.4;
    const dir = [random() - 0.5, random() - 0.5, random() - 0.5];
    const l = Math.hypot(dir[0], dir[1], dir[2]);
    lights.push({
      sid: i * 3 + 1, // SIDs with holes
      type: isSpot ? 2 : 1,
      position: [
        center[0] + (random() - 0.5) * extent,
        center[1] + (random() - 0.5) * extent,
        center[2] + (random() - 0.5) * extent,
      ],
      direction: [dir[0] / l, dir[1] / l, dir[2] / l],
      range: 0.5 + random() * 4,
      outerConeCos: Math.cos(0.1 + random() * 1.4),
    });
  }
  return lights;
}

/** Whether the light can light the point (the exact support of the shader's attenuation). */
function lightReaches(light: TestLight, p: number[]) {
  const v = [p[0] - light.position[0], p[1] - light.position[1], p[2] - light.position[2]];
  const distance = Math.hypot(v[0], v[1], v[2]);
  if (distance >= light.range) return false;
  if (light.type === 2) {
    const cos = (v[0] * light.direction[0] + v[1] * light.direction[1] + v[2] * light.direction[2]) / distance;
    if (!(cos > light.outerConeCos)) return false;
  }
  return true;
}

function buildView(viewMatrix: Mat4, projectionMatrix: Mat4, lights: TestLight[], capacity = 1 << 16) {
  const layout = getLightClusterViewLayout([16, 9, 24], capacity);
  const spheres = new Float64Array(lights.length * 4);
  const entries: number[] = [];
  let localCount = 0;
  for (const light of lights) {
    const r = computeLightBoundingSphere(
      light.type,
      light.position,
      light.direction,
      light.range,
      light.outerConeCos,
      spheres,
      localCount * 4
    );
    expect(r).toBeGreaterThan(0);
    entries.push(packLightEntry(light.sid, -1));
    localCount++;
  }
  const viewOffset = 8; // not at the start of the memory
  const dst = new Float32Array(viewOffset + layout.viewVec4Count * 4);
  writeLightClusterViewHeader(dst, viewOffset, viewMatrix, projectionMatrix, spheres, localCount, layout);
  const scratch = createLightClusterBuildScratch(layout);
  const built = buildLightClustersOnCpu(dst, viewOffset, layout, spheres, entries, localCount, scratch);
  return { dst, viewOffset, layout, spheres, entries, localCount, built };
}

/** Samples points inside the view frustum and checks that every light reaching a point is in its cluster. */
function checkNoLightIsMissed(
  viewMatrix: Mat4,
  projectionMatrix: Mat4,
  lights: TestLight[],
  random: () => number,
  sampleCount: number,
  ndcZRange: [number, number],
  capacity = 1 << 16
) {
  const { dst, viewOffset, layout, built } = buildView(viewMatrix, projectionMatrix, lights, capacity);
  expect(built).toBe(true);
  const inverse = invert(multiply(projectionMatrix, viewMatrix));
  let checkedPairs = 0;
  for (let i = 0; i < sampleCount; i++) {
    const ndc = [random() * 2 - 1, random() * 2 - 1, ndcZRange[0] + random() * (ndcZRange[1] - ndcZRange[0]), 1];
    const h = transform(inverse, ndc);
    const p = [h[0] / h[3], h[1] / h[3], h[2] / h[3]];
    const clusterIndex = computeLightClusterIndex(dst, viewOffset, p[0], p[1], p[2]);
    expect(clusterIndex).toBeGreaterThanOrEqual(0);
    const clusterSids = new Set(
      readLightClusterEntries(dst, viewOffset, layout, clusterIndex).map(e => unpackLightEntry(e)[0])
    );
    for (const light of lights) {
      if (lightReaches(light, p)) {
        checkedPairs++;
        expect(clusterSids.has(light.sid)).toBe(true);
      }
    }
  }
  return checkedPairs;
}

describe('LightClusterLayout', () => {
  test('packs and unpacks light entries exactly as float32', () => {
    for (const [sid, slot] of [
      [0, -1],
      [5, 0],
      [65535, 5],
      [1234, 254],
    ]) {
      const entry = Math.fround(packLightEntry(sid, slot));
      expect(unpackLightEntry(entry)).toEqual([sid, slot]);
    }
  });

  test('computes the sizes of the regions', () => {
    expect(getLightClusterGlobalPropertyLength(1024)).toBe(1 + 256);
    expect(getLightClusterGlobalPropertyLength(1e9)).toBe(1 + Math.ceil(65535 / 4));
    const layout = getLightClusterViewLayout([16, 9, 24], 16384);
    expect(layout.clusterCount).toBe(3456);
    expect(layout.tableVec4Count).toBe(3456);
    expect(layout.indexCapacity).toBe(16384);
    expect(layout.viewVec4Count).toBe(LightClusterLayout.viewHeaderVec4Count + 3456 + 4096);
  });
});

describe('LightClusterBuilder', () => {
  test('a perspective view never misses a light reaching a point', () => {
    const random = createRandom(1);
    const view = lookAt([1, 2, 10], [0, 0, 0], [0, 1, 0]);
    const projection = perspective(60, 16 / 9, 0.1, 100);
    const lights = createLights(random, 200, [0, 0, 0], 16);
    const pairs = checkNoLightIsMissed(view, projection, lights, random, 4000, [-1, 0.999]);
    expect(pairs).toBeGreaterThan(1000);
  });

  test('works with the WebGPU depth range, an infinite far plane and an off-center (XR-like) frustum', () => {
    const random = createRandom(2);
    const view = lookAt([-3, 1, 6], [1, 0, -2], [0, 1, 0]);
    const lights = createLights(random, 150, [0, 0, 0], 14);
    expect(
      checkNoLightIsMissed(view, perspectiveWebGpu(75, 1.2, 0.05, 50), lights, random, 3000, [0, 0.9999])
    ).toBeGreaterThan(500);
    expect(
      checkNoLightIsMissed(
        view,
        frustum(-0.08, 0.05, -0.06, 0.07, 0.1, Number.POSITIVE_INFINITY),
        lights,
        random,
        3000,
        [-1, 0.999]
      )
    ).toBeGreaterThan(500);
  });

  test('an orthographic view never misses a light reaching a point', () => {
    const random = createRandom(3);
    const view = lookAt([0, 10, 0.01], [0, 0, 0], [0, 1, 0]);
    const lights = createLights(random, 150, [0, 0, 0], 12);
    expect(checkNoLightIsMissed(view, orthographic(8, 5, -5, 30), lights, random, 3000, [-1, 1])).toBeGreaterThan(500);
  });

  test('lights around and behind the camera are handled', () => {
    const random = createRandom(4);
    const view = lookAt([0, 0, 0], [0, 0, -1], [0, 1, 0]);
    const projection = perspective(90, 1, 0.1, 100);
    // Lights all around the eye, including ones that contain the eye
    const lights = createLights(random, 200, [0, 0, 0], 10);
    expect(checkNoLightIsMissed(view, projection, lights, random, 3000, [-1, 0.99], 1 << 21)).toBeGreaterThan(500);

    // A light entirely behind the eye plane is not assigned to any cluster
    const behind: TestLight = {
      sid: 7,
      type: 1,
      position: [0, 0, 5],
      direction: [0, 0, -1],
      range: 1,
      outerConeCos: 0,
    };
    const { dst, viewOffset, layout } = buildView(view, projection, [behind]);
    for (let c = 0; c < layout.clusterCount; c++) {
      expect(readLightClusterEntries(dst, viewOffset, layout, c)).toEqual([]);
    }
  });

  test('the light-centric build agrees with the cluster-centric test used by the compute shader', () => {
    const random = createRandom(5);
    const view = lookAt([2, 3, 9], [0, 0, 0], [0, 1, 0]);
    const projection = perspective(50, 1.5, 0.3, 80);
    const lights = createLights(random, 60, [0, 0, 0], 20);
    const { dst, viewOffset, layout, spheres, entries, localCount } = buildView(view, projection, lights);
    for (let z = 0; z < layout.gridZ; z++) {
      for (let y = 0; y < layout.gridY; y++) {
        for (let x = 0; x < layout.gridX; x++) {
          const expected: number[] = [];
          for (let i = 0; i < localCount; i++) {
            if (
              sphereIntersectsLightCluster(
                dst,
                viewOffset,
                layout,
                x,
                y,
                z,
                spheres[i * 4],
                spheres[i * 4 + 1],
                spheres[i * 4 + 2],
                spheres[i * 4 + 3]
              )
            ) {
              expected.push(entries[i]);
            }
          }
          const c = (z * layout.gridY + y) * layout.gridX + x;
          expect(readLightClusterEntries(dst, viewOffset, layout, c)).toEqual(expected);
        }
      }
    }
  });

  test('each cluster owns whole vec4s: lists start at vec4 boundaries, do not overlap and are zero-padded', () => {
    const random = createRandom(8);
    const view = lookAt([1, 4, 9], [0, 0, 0], [0, 1, 0]);
    const projection = perspective(55, 1.3, 0.2, 60);
    const lights = createLights(random, 90, [0, 0, 0], 14);
    const { dst, viewOffset, layout } = buildView(view, projection, lights);
    const tableOffset = viewOffset + LightClusterLayout.viewHeaderVec4Count * 4;
    const indexOffset = tableOffset + layout.tableVec4Count * 4;
    const owner = new Int32Array(layout.indexVec4Count).fill(-1);
    for (let c = 0; c < layout.clusterCount; c++) {
      const offsetVec4 = dst[tableOffset + c * 4];
      const count = dst[tableOffset + c * 4 + 1];
      expect(Number.isInteger(offsetVec4)).toBe(true);
      expect([dst[tableOffset + c * 4 + 2], dst[tableOffset + c * 4 + 3]]).toEqual([0, 0]);
      const vec4Count = Math.ceil(count / 4);
      for (let v = 0; v < vec4Count; v++) {
        expect(owner[offsetVec4 + v]).toBe(-1);
        owner[offsetVec4 + v] = c;
      }
      for (let i = count; i < vec4Count * 4; i++) {
        expect(dst[indexOffset + offsetVec4 * 4 + i]).toBe(0);
      }
    }
  });

  test('marks the view as overflowed when the index list is too small', () => {
    const random = createRandom(6);
    const view = lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0]);
    const projection = perspective(60, 1, 0.1, 100);
    const lights = createLights(random, 100, [0, 0, 0], 4);
    const { dst, viewOffset, built } = buildView(view, projection, lights, 64);
    expect(built).toBe(false);
    expect(dst[viewOffset + LightClusterLayout.viewGridOffset * 4 + 3]).toBe(LightClusterLayout.stateOverflow);
    expect(computeLightClusterIndex(dst, viewOffset, 0, 0, 0)).toBe(-1);
  });

  test('positions behind the eye plane use the all-light list', () => {
    const view = lookAt([0, 0, 0], [0, 0, -1], [0, 1, 0]);
    const projection = perspective(60, 1, 0.1, 100);
    const light: TestLight = {
      sid: 0,
      type: 1,
      position: [0, 0, -5],
      direction: [0, 0, -1],
      range: 2,
      outerConeCos: 0,
    };
    const { dst, viewOffset } = buildView(view, projection, [light]);
    expect(computeLightClusterIndex(dst, viewOffset, 0, 0, 3)).toBe(-1);
    expect(computeLightClusterIndex(dst, viewOffset, 0, 0, -3)).toBeGreaterThanOrEqual(0);
  });
});

describe('computeLightBoundingSphere', () => {
  test('directional lights and lights without range are not culled', () => {
    const out = new Float64Array(4);
    expect(computeLightBoundingSphere(0, [0, 0, 0], [0, 0, -1], 10, 0.9, out, 0)).toBe(-1);
    expect(computeLightBoundingSphere(1, [0, 0, 0], [0, 0, -1], -1, 0.9, out, 0)).toBe(-1);
    expect(computeLightBoundingSphere(2, [0, 0, 0], [0, 0, -1], 0, 0.9, out, 0)).toBe(-1);
  });

  test('a narrow spot light gets a sphere smaller than its range that contains the lit cone sector', () => {
    const out = new Float64Array(4);
    const outerConeCos = Math.cos(Math.PI / 8);
    const r = computeLightBoundingSphere(2, [1, 2, 3], [0, 0, -1], 10, outerConeCos, out, 0);
    expect(r).toBeLessThan(10);
    const random = createRandom(7);
    for (let i = 0; i < 2000; i++) {
      // a random point in the lit sector
      const distance = random() * 10;
      const angle = Math.acos(1 - random() * (1 - outerConeCos));
      const phi = random() * Math.PI * 2;
      const p = [
        1 + distance * Math.sin(angle) * Math.cos(phi),
        2 + distance * Math.sin(angle) * Math.sin(phi),
        3 - distance * Math.cos(angle),
      ];
      expect(Math.hypot(p[0] - out[0], p[1] - out[1], p[2] - out[2])).toBeLessThanOrEqual(out[3]);
    }
  });

  test('a wide spot light or a non-unit direction uses the range sphere', () => {
    const out = new Float64Array(4);
    expect(computeLightBoundingSphere(2, [0, 0, 0], [0, 0, -1], 10, Math.cos(1.2), out, 0)).toBeCloseTo(10.01);
    expect(computeLightBoundingSphere(2, [0, 0, 0], [0, 0, -2], 10, 0.95, out, 0)).toBeCloseTo(10.01);
    expect(Array.from(out.subarray(0, 3))).toEqual([0, 0, 0]);
  });
});
