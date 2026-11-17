import Rn from '../../../../dist/esm';

async function createLight() {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });
  const light = Rn.createLightEntity(engine).getLight();
  return { engine, light };
}

test('changing a light property increments the update counts only when the value changes', async () => {
  const { engine, light } = await createLight();
  const cases: [string, () => void, () => void][] = [
    ['enable', () => (light.enable = false), () => (light.enable = false)],
    ['type', () => (light.type = Rn.LightType.Spot), () => (light.type = Rn.LightType.Spot)],
    ['innerConeAngle', () => (light.innerConeAngle = 0.1), () => (light.innerConeAngle = 0.1)],
    ['outerConeAngle', () => (light.outerConeAngle = 0.5), () => (light.outerConeAngle = 0.5)],
    ['intensity', () => (light.intensity = 2), () => (light.intensity = 2)],
    ['range', () => (light.range = 3), () => (light.range = 3)],
    ['color', () => (light.color = Rn.Vector3.fromCopy3(1, 0, 0)), () => (light.color = Rn.Vector3.fromCopy3(1, 0, 0))],
  ];
  for (const [name, change, sameValue] of cases) {
    const count = light.updateCount;
    const engineCount = Rn.LightComponent.getUpdateCount(engine);
    change();
    expect([name, light.updateCount]).toEqual([name, count + 1]);
    expect([name, Rn.LightComponent.getUpdateCount(engine)]).toEqual([name, engineCount + 1]);
    sameValue();
    expect([name, light.updateCount]).toEqual([name, count + 1]);
  }
});

test('setting the same color object after mutating it is detected', async () => {
  const { light } = await createLight();
  const color = Rn.MutableVector3.fromCopy3(1, 1, 1);
  light.color = color;
  const count = light.updateCount;
  color.x = 0.5;
  light.color = color;
  expect(light.updateCount).toBe(count + 1);
});

test('the GPU data follows enable, type and the cone angles', async () => {
  const { light } = await createLight();
  light.type = Rn.LightType.Spot;
  light.innerConeAngle = 0.2;
  light.outerConeAngle = 0.4;
  light.$logic();
  const property = light._lightPropertyForGpu._v;
  expect(property[0]).toBe(Rn.LightType.Spot.index);
  expect(property[2]).toBeCloseTo(Math.cos(0.2));
  expect(property[3]).toBeCloseTo(Math.cos(0.4));

  light.enable = false;
  light.$logic();
  expect(property[0]).toBe(-1);
});

test('the GPU range and intensity follow the light range adjustment level', async () => {
  const { engine, light } = await createLight();
  light.type = Rn.LightType.Point;
  light.range = 10;
  light.intensity = 2;
  light.color = Rn.Vector3.fromCopy3(0.5, 0.25, 1);

  light.$logic();
  const property = light._lightPropertyForGpu._v;
  const intensity = light._lightIntensityForGpu._v;
  expect(property[1]).toBeCloseTo(10);
  expect(intensity[0]).toBeCloseTo(1);
  expect(intensity[1]).toBeCloseTo(0.5);
  expect(intensity[2]).toBeCloseTo(2);

  engine.config.lightRangeAdjustmentLevel = 1;
  light.$logic();
  expect(property[1]).toBeCloseTo(9);
  expect(intensity[0]).toBeCloseTo(1.16);
  expect(intensity[1]).toBeCloseTo(0.58);
  expect(intensity[2]).toBeCloseTo(2.32);

  engine.config.lightRangeAdjustmentLevel = 2;
  light.$logic();
  expect(property[1]).toBeCloseTo(8);
  expect(intensity[2]).toBeCloseTo(2.7);

  engine.config.lightRangeAdjustmentLevel = 0;
  light.$logic();
  expect(property[1]).toBeCloseTo(10);
  expect(intensity[2]).toBeCloseTo(2);
});

test('the light range adjustment level does not change directional and unbounded lights', async () => {
  const { engine, light } = await createLight();
  engine.config.lightRangeAdjustmentLevel = 2;

  light.type = Rn.LightType.Point;
  light.range = -1;
  light.intensity = 2;
  light.$logic();
  expect(light._lightPropertyForGpu._v[1]).toBe(-1);
  expect(light._lightIntensityForGpu._v[0]).toBeCloseTo(2);

  light.type = Rn.LightType.Directional;
  light.range = -1;
  light.$logic();
  expect(light._lightPropertyForGpu._v[1]).toBe(-1);
  expect(light._lightIntensityForGpu._v[0]).toBeCloseTo(2);
});

test('creating and destroying a light increments the engine update count', async () => {
  const { engine } = await createLight();
  const count = Rn.LightComponent.getUpdateCount(engine);
  const entity = Rn.createLightEntity(engine);
  expect(Rn.LightComponent.getUpdateCount(engine)).toBe(count + 1);
  engine.entityRepository.deleteEntity(entity.entityUID);
  expect(Rn.LightComponent.getUpdateCount(engine)).toBeGreaterThan(count + 1);
});
