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

test('Cylinder rejects degenerate dimensions', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
  const cylinder = new Rn.Cylinder(engine);
  expect(() => cylinder.generate({ height: 0, radiusBottom: 0, radiusTop: 0 })).toThrow('Cylinder dimensions');
});
