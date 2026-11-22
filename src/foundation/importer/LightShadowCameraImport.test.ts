import { expect, test } from 'vitest';
import type { RnM2 } from '../../types';
import { LightType } from '../definitions/LightType';
import { ProcessApproach } from '../definitions/ProcessApproach';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Engine } from '../system/Engine';
import { Gltf2Importer } from './Gltf2Importer';
import { ModelConverter } from './ModelConverter';

type PunctualLightType = 'spot' | 'directional' | 'point';

function createLightGltf(lightType: PunctualLightType): RnM2 {
  const light: Record<string, unknown> = {
    type: lightType,
    color: [1, 1, 1],
    intensity: 1,
  };
  if (lightType === 'spot') {
    light.spot = { innerConeAngle: 0.2, outerConeAngle: 0.4 };
  }
  return {
    asset: { version: '2.0', extras: {} },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Light', extensions: { KHR_lights_punctual: { light: 0 } } }],
    extensions: { KHR_lights_punctual: { lights: [light] } },
    extensionsUsed: ['KHR_lights_punctual'],
  } as unknown as RnM2;
}

async function importLightEntity(lightType: PunctualLightType) {
  const gltfModel = createLightGltf(lightType);
  await Gltf2Importer._loadInner(gltfModel, {}, {});
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  ModelConverter.convertToRhodoniteObjectSimple(engine, gltfModel);
  const rnEntities = (gltfModel.asset.extras as { rnEntities: unknown[] }).rnEntities;
  return rnEntities[0] as ISceneGraphEntity;
}

test('attaches a synchronized shadow camera to an imported spot light node', async () => {
  const entity = await importLightEntity('spot');
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Spot);
  const cameraComponent = entity.tryToGetCamera();
  expect(cameraComponent).toBeDefined();
  expect(cameraComponent!.isSyncToLight).toBe(true);
});

test('attaches a synchronized shadow camera to an imported directional light node', async () => {
  const entity = await importLightEntity('directional');
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Directional);
  const cameraComponent = entity.tryToGetCamera();
  expect(cameraComponent).toBeDefined();
  expect(cameraComponent!.isSyncToLight).toBe(true);
});

test('does not attach a camera to an imported point light node', async () => {
  const entity = await importLightEntity('point');
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Point);
  expect(entity.tryToGetCamera()).toBeUndefined();
});
