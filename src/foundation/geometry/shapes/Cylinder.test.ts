import Rn from '../../../../dist/esm';

test('Cylinder generates centered bounds for symmetric and asymmetric radii', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  cylinder.generate({ height: 2, radiusBottom: 1, radiusTop: 0.5, radialSegments: 16 });

  expect(cylinder.AABB.minPoint.y).toBeCloseTo(-1);
  expect(cylinder.AABB.maxPoint.y).toBeCloseTo(1);
  expect(cylinder.AABB.minPoint.x).toBeCloseTo(-1);
  expect(cylinder.AABB.maxPoint.x).toBeCloseTo(1);
});

test('Cylinder duplicates side vertices at the UV seam', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  const radialSegments = 8;
  cylinder.generate({ radialSegments, includeCaps: false });

  const positions = cylinder.getAttribute(Rn.VertexAttribute.Position.XYZ)!.getTypedArray() as Float32Array;
  const normals = cylinder.getAttribute(Rn.VertexAttribute.Normal.XYZ)!.getTypedArray() as Float32Array;
  const texcoords = cylinder.getAttribute(Rn.VertexAttribute.Texcoord0.XY)!.getTypedArray() as Float32Array;
  const indices = cylinder.indicesAccessor!.getTypedArray() as Uint16Array;
  const seamBottom = radialSegments * 2;
  const seamTop = seamBottom + 1;

  expect(positions.length / 3).toBe((radialSegments + 1) * 2);
  expect([...positions.slice(seamBottom * 3, seamBottom * 3 + 3)]).toEqual([...positions.slice(0, 3)]);
  expect([...positions.slice(seamTop * 3, seamTop * 3 + 3)]).toEqual([...positions.slice(3, 6)]);
  expect([...normals.slice(seamBottom * 3, seamBottom * 3 + 3)]).toEqual([...normals.slice(0, 3)]);
  expect([...normals.slice(seamTop * 3, seamTop * 3 + 3)]).toEqual([...normals.slice(3, 6)]);
  expect(texcoords[0]).toBe(0);
  expect(texcoords[seamBottom * 2]).toBe(1);
  expect(texcoords[seamTop * 2]).toBe(1);

  for (let i = 0; i < indices.length; i += 3) {
    const firstU = texcoords[indices[i] * 2];
    const secondU = texcoords[indices[i + 1] * 2];
    const thirdU = texcoords[indices[i + 2] * 2];
    expect(Math.max(firstU, secondU, thirdU) - Math.min(firstU, secondU, thirdU)).toBeLessThanOrEqual(
      1 / radialSegments
    );
  }
});

test('Cylinder rejects degenerate dimensions', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  expect(() => cylinder.generate({ height: 0, radiusBottom: 0, radiusTop: 0 })).toThrow('Cylinder dimensions');
});

test.each([
  3.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
])('Cylinder rejects a non-finite or fractional radialSegments value: %s', async radialSegments => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  expect(() => cylinder.generate({ radialSegments })).toThrow('Cylinder radialSegments must be a finite integer.');
});

test('Cylinder uses 32-bit indices when its vertex indices exceed the Uint16 range', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  cylinder.generate({ radialSegments: 16384 });

  const indices = cylinder.indicesAccessor!.getTypedArray();
  let maxIndex = 0;
  for (const index of indices) {
    maxIndex = Math.max(maxIndex, index);
  }

  expect(indices).toBeInstanceOf(Uint32Array);
  expect(maxIndex).toBe(65539);
});

test('Cylinder uses outward-facing counter-clockwise triangle winding', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  cylinder.generate({ height: 2, radiusBottom: 1, radiusTop: 0.5, radialSegments: 8 });

  const positions = cylinder.getAttribute(Rn.VertexAttribute.Position.XYZ)!.getTypedArray() as Float32Array;
  const normals = cylinder.getAttribute(Rn.VertexAttribute.Normal.XYZ)!.getTypedArray() as Float32Array;
  const indices = cylinder.indicesAccessor!.getTypedArray() as Uint16Array;

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const abX = positions[b] - positions[a];
    const abY = positions[b + 1] - positions[a + 1];
    const abZ = positions[b + 2] - positions[a + 2];
    const acX = positions[c] - positions[a];
    const acY = positions[c + 1] - positions[a + 1];
    const acZ = positions[c + 2] - positions[a + 2];
    const crossX = abY * acZ - abZ * acY;
    const crossY = abZ * acX - abX * acZ;
    const crossZ = abX * acY - abY * acX;
    const normalX = normals[a] + normals[b] + normals[c];
    const normalY = normals[a + 1] + normals[b + 1] + normals[c + 1];
    const normalZ = normals[a + 2] + normals[b + 2] + normals[c + 2];

    expect(crossX * normalX + crossY * normalY + crossZ * normalZ).toBeGreaterThan(0);
  }
});
